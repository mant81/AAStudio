// Run with PLAYWRIGHT_MODULE pointing to an installed playwright-core package.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "../../..");
const resources = path.join(root, "src/main/resources");
const read = (file) => fs.readFileSync(path.join(resources, file), "utf8");
const baseUrl = process.env.AASTUDIO_BASE_URL;
const schemaText = "Table users {\n id int [pk]\n email varchar\n}\nTable orders {\n id int [pk]\n user_id int\n}\nRef: orders.user_id > users.id";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        let head = read("templates/fragments/layout.html").match(/<head>([\s\S]*?)<\/head>/)[1];
        head = head.replace(/th:href="@\{([^}(]+)(?:\([^}]*\))?\}"/g, 'href="$1"');
        const template = read("templates/db-modeling.html");
        const body = template.slice(template.indexOf('<div class="workspace-page db-modeling-page'), template.lastIndexOf("</html>"));
        await page.route("http://aastudio.test/**", async (route) => {
            const url = new URL(route.request().url());
            if (url.pathname === "/db-modeling") {
                return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head>${head}</head><body>${body}</body></html>` });
            }
            if (url.pathname === "/api/db-modeling/schema") {
                return route.fulfill({ json: { schemaText, layoutJson: "{}", categories: [{ categoryId: "ecommerce", categoryName: "Test" }] } });
            }
            const file = path.join(resources, "static", url.pathname);
            if (fs.existsSync(file)) return route.fulfill({ path: file });
            return route.fulfill({ status: 404, body: "" });
        });
        if (baseUrl) {
            await page.route(`${baseUrl}/api/db-modeling/schema**`, (route) => route.fulfill({
                json: { schemaText, layoutJson: "{}", categories: [{ categoryId: "ecommerce", categoryName: "Test" }] }
            }));
        }
        await page.goto(baseUrl ? `${baseUrl}/db-modeling` : "http://aastudio.test/db-modeling");
        await page.waitForFunction(() => typeof tailwind !== "undefined");
        if (!baseUrl) {
            await page.addScriptTag({ path: path.join(resources, "static/js/db-modeling.js") });
            await page.addScriptTag({ url: "http://aastudio.test/vendor/monaco/vs/loader.js" });
            await page.addScriptTag({ content: 'require.config({ paths: { vs: "/vendor/monaco/vs" } }); require(["vs/editor/editor.main"], () => window.dispatchEvent(new Event("monaco-ready")));' });
        }
        await page.locator("#db-monaco-editor .monaco-editor").waitFor({ state: "visible" });
        await page.waitForFunction(() => document.querySelectorAll(".db-erd-table-node").length === 2);
        const stage = page.locator("#erd-canvas");
        const table = page.locator('[data-erd-table="users"]');
        const initial = await stage.boundingBox();
        const editorInitial = await page.locator("#secondary-sidebar").boundingBox();
        assert(editorInitial.width >= 280);
        const tableInitial = await table.boundingBox();
        assert(initial.width > 800 && initial.height > 800, JSON.stringify(initial));
        assert(tableInitial.width === 256 && tableInitial.height > 80);
        assert(await table.isVisible());
        assert.equal(await page.locator("#db-properties-panel").isVisible(), false);
        assert.equal(await page.locator("#erd-lines path").count(), 1);
        await table.click();
        await page.locator("#db-erd-overlay-toggle").click();
        assert(await page.locator("#db-properties-panel").isVisible());
        assert.equal((await page.locator("#db-properties-panel").boundingBox()).width, 300);
        assert.match(await page.locator("#db-properties-content").innerText(), /users/);
        assert.deepEqual(await stage.boundingBox(), initial);
        assert.deepEqual(await page.locator("#secondary-sidebar").boundingBox(), editorInitial);
        assert.deepEqual(await table.boundingBox(), tableInitial);
        await page.locator("#db-erd-overlay-toggle").click();
        assert.equal(await page.locator("#db-properties-panel").isVisible(), false);
        assert(await table.isVisible());
        assert.deepEqual(await stage.boundingBox(), initial);
        await page.mouse.move(tableInitial.x + 30, tableInitial.y + 18);
        await page.mouse.down();
        await page.mouse.move(tableInitial.x + 100, tableInitial.y + 68, { steps: 5 });
        await page.mouse.up();
        const moved = await table.boundingBox();
        assert.equal(Math.round(moved.x - tableInitial.x), 70);
        assert.equal(Math.round(moved.y - tableInitial.y), 50);
        await page.locator("#erd-grid-toggle").click();
        assert.equal(await page.locator("#erd-grid").isVisible(), false);
        await page.locator("#erd-grid-toggle").click();
        assert(await page.locator("#erd-grid").isVisible());
        await page.locator("#erd-zoom-in").click();
        assert.equal(await page.locator("#erd-zoom-value").innerText(), "110%");
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.locator("#db-erd-overlay-toggle").click();
        const narrow = await stage.boundingBox();
        await page.locator("#db-erd-overlay-toggle").click();
        assert.deepEqual(await stage.boundingBox(), narrow);
        assert(await table.isVisible());
        assert.deepEqual(errors, []);
        console.log("PASS: initial tables/relations, property toggle/selection, unchanged canvas geometry, drag, grid, zoom, resize; no JS errors.");
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
