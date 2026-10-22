// Integration test: run against an isolated QA server with an in-memory database.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.AASTUDIO_BASE_URL || "http://localhost:18080";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
        const projectResponse = await context.request.post(`${baseUrl}/api/projects`, { data: { name: `Schema management QA ${Date.now()}`, description: "Isolated QA fixture" } });
        assert.equal(projectResponse.status(), 201);
        const project = await projectResponse.json();
        await context.addCookies([{ name: "aastudio.currentProject", value: project.projectId, url: baseUrl }]);
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${baseUrl}/db-modeling`);
        await page.locator(".monaco-editor").waitFor();
        await page.waitForFunction(() => document.querySelector("#db-schema-options").children.length === 3);
        const menu = page.locator(".workspace-document-menu");
        const source = () => page.locator("#db-schema-editor").inputValue();
        const currentId = () => page.evaluate((key) => localStorage.getItem(key), `aastudio-db-modeling-category:${project.projectId}`);
        const action = async (id) => { await menu.locator("summary").click(); await page.locator(`#${id}`).click(); };
        const originalId = await currentId();
        const original = await source();
        await action("db-schema-rename");
        await page.locator("#db-schema-add-name").fill("Renamed QA model");
        await page.locator("#db-schema-name-submit").click();
        await page.locator("#db-schema-add-modal").waitFor({ state: "hidden" });
        assert.equal(await page.locator("#db-current-schema-name").innerText(), "Renamed QA model");
        assert.equal(await source(), original);
        await page.reload();
        await page.locator(".monaco-editor").waitFor();
        await page.waitForFunction(() => document.querySelector("#db-current-schema-name").textContent === "Renamed QA model");
        const table = page.locator('[data-erd-table="users"]');
        await table.waitFor({ state: "visible" });
        const box = await table.boundingBox();
        await page.mouse.move(box.x + 30, box.y + 18);
        await page.mouse.down();
        await page.mouse.move(box.x + 110, box.y + 63, { steps: 5 });
        await page.mouse.up();
        await menu.locator("summary").click();
        const backupDownload = page.waitForEvent("download");
        await page.locator("#db-schema-backup").click();
        const chunks = [];
        for await (const chunk of await (await backupDownload).createReadStream()) chunks.push(chunk);
        const backup = Buffer.concat(chunks);
        const parsed = JSON.parse(backup.toString("utf8"));
        assert.equal(parsed.schemaText, original);
        assert.equal(parsed.categoryName, "Renamed QA model");
        assert(Number.isFinite(parsed.layout.users.x) && Number.isFinite(parsed.layout.users.y));

        await page.evaluate(() => monaco.editor.getModels()[0].setValue("Table changed {\n id int [pk]\n}"));
        await page.waitForFunction(() => document.querySelector('[data-erd-table="changed"]'));
        page.once("dialog", (dialog) => dialog.accept());
        await page.locator("#db-schema-restore-input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: backup });
        await page.waitForFunction((text) => document.querySelector("#db-schema-editor").value === text, original);
        const restoredDocument = await (await context.request.get(`${baseUrl}/api/db-modeling/schema?categoryId=${encodeURIComponent(originalId)}`)).json();
        assert.deepEqual(JSON.parse(restoredDocument.layoutJson), parsed.layout);
        await page.reload();
        await page.locator(".monaco-editor").waitFor();
        await page.waitForFunction((text) => document.querySelector("#db-schema-editor").value === text, original);

        const alert = page.waitForEvent("dialog");
        await page.locator("#db-schema-restore-input").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from('{"schemaText":"invalid"}') });
        const invalid = await alert;
        assert.equal(invalid.type(), "alert");
        await invalid.dismiss();
        assert.equal(await source(), original);

        // A failed rename must preserve the current title and document.
        await page.route("**/api/db-modeling/schema?**", (route) => route.request().method() === "PUT" ? route.fulfill({ status: 500 }) : route.continue());
        await action("db-schema-rename");
        await page.locator("#db-schema-add-name").fill("Failed name");
        await page.locator("#db-schema-name-submit").click();
        await page.waitForFunction(() => document.querySelector("#db-schema-name-error").textContent.length > 0);
        assert.equal(await page.locator("#db-current-schema-name").innerText(), "Renamed QA model");
        await page.locator("#db-schema-add-cancel").click();
        await page.unroute("**/api/db-modeling/schema?**");

        // Cancellation leaves the model intact.
        page.once("dialog", (dialog) => dialog.dismiss());
        await action("db-schema-delete");
        assert.equal(await currentId(), originalId);
        const deleted = [];
        for (let index = 0; index < 3; index++) {
            const id = await currentId();
            deleted.push(id);
            page.once("dialog", (dialog) => dialog.accept());
            const response = page.waitForResponse((response) => response.request().method() === "DELETE");
            await action("db-schema-delete");
            assert.equal((await response).status(), 204);
            await page.waitForFunction(({ key, previous }) => localStorage.getItem(key) !== previous,
                { key: `aastudio-db-modeling-category:${project.projectId}`, previous: id });
        }
        await page.waitForFunction(() => document.querySelector("#db-current-schema-name").textContent === "모델링 없음");
        assert.equal(await source(), "");
        await page.reload();
        await page.waitForFunction(() => document.querySelector("#db-current-schema-name").textContent === "모델링 없음");
        const stale = await context.request.put(`${baseUrl}/api/db-modeling/schema?categoryId=${encodeURIComponent(deleted[0])}`, { data: { schemaText: original, layoutJson: "{}" } });
        assert.equal(stale.status(), 409);
        const remaining = await (await context.request.get(`${baseUrl}/api/db-modeling/schema`)).json();
        assert.equal(remaining.categories.length, 0);

        // Restore a backup into the empty project using a fresh model identity.
        await page.locator("#db-schema-restore-input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: backup });
        await page.waitForFunction((text) => document.querySelector("#db-schema-editor").value === text, original);
        assert(!deleted.includes(await currentId()));
        assert.equal(await page.locator("#db-current-schema-name").innerText(), "Renamed QA model");
        assert.deepEqual(errors, []);
        console.log("PASS: rename/reload and failure handling, backup/restore, invalid backup rejection, delete cancellation/all models, no resurrection, restore into empty project; no JS errors.");
    } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
