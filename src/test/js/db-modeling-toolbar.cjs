// Run with AASTUDIO_BASE_URL and an installed PLAYWRIGHT_MODULE.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.AASTUDIO_BASE_URL || "http://localhost:8080";
const original = "Table customers {\n id int [pk]\n email varchar\n}";
const ddl = "CREATE TABLE accounts (id BIGINT PRIMARY KEY, name VARCHAR(60));";
const readDownload = async (download) => {
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8");
};

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, permissions: ["clipboard-read", "clipboard-write"] });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.route(`${baseUrl}/api/db-modeling/schema**`, (route) => route.fulfill({
            json: { schemaText: original, layoutJson: "{}", categories: [{ categoryId: "ecommerce", categoryName: "QA schema" }] }
        }));
        await page.goto(`${baseUrl}/db-modeling`);
        await page.locator(".monaco-editor").waitFor();
        await page.waitForFunction(() => document.querySelector("#db-schema-editor").value.includes("customers"));
        const exports = page.locator("[data-workspace-export]");
        const download = async (selector) => {
            await exports.locator("summary").click();
            const result = page.waitForEvent("download");
            await page.locator(selector).click();
            const file = await result;
            assert.equal(await exports.getAttribute("open"), null);
            return { name: file.suggestedFilename(), text: await readDownload(file) };
        };
        const source = await download('[data-db-export-sql="postgresql"]');
        assert(source.name.endsWith(".postgresql.sql"));
        assert.match(source.text, /CREATE TABLE "customers"/);
        await page.evaluate((text) => monaco.editor.getModels()[0].setValue(text), ddl);
        await page.waitForFunction(() => document.querySelector('[data-erd-table="accounts"]'));
        const sql = await download('[data-db-export-sql="postgresql"]');
        assert(sql.name.endsWith(".sql"));
        assert.match(sql.text, /CREATE TABLE "accounts"/);
        assert.match(sql.text, /PRIMARY KEY \("id"\)/);

        await page.locator("#db-schema-share summary").click();
        await page.waitForFunction((text) => document.querySelector("#db-share-source").value === text, ddl);
        await page.locator("#db-share-copy").click();
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), ddl);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#db-schema-share").getAttribute("open"), null);

        const manage = page.locator(".workspace-document-menu");
        await manage.locator("summary").click();
        await page.locator("#db-schema-toggle-editor").click();
        assert.equal(await page.locator("#secondary-sidebar").isVisible(), false);
        await manage.locator("summary").click();
        await page.locator("#db-schema-toggle-editor").click();
        await page.locator("#secondary-sidebar").waitFor({ state: "visible" });
        await manage.locator("summary").click();
        await page.locator("#db-schema-rebuild").click();
        await page.waitForFunction(() => document.querySelector('[data-erd-table="accounts"]'));
        await page.locator("#db-schema-sample").click();
        await page.waitForFunction(() => document.querySelector('[data-erd-table="users"]'));

        await exports.locator("summary").click();
        await page.locator("#db-current-schema-button").click();
        assert.equal(await exports.getAttribute("open"), null);
        await page.locator("#db-current-schema-button").click();
        for (const width of [1024, 375]) {
            await page.setViewportSize({ width, height: 812 });
            const left = await page.locator(".workspace-context").boundingBox();
            const right = await page.locator(".workspace-actions").boundingBox();
            assert(left.x + left.width <= right.x);
            assert(right.x + right.width <= width);
            await exports.locator("summary").click();
            const menu = await page.locator(".workspace-export-menu").last().boundingBox();
            assert(menu.x >= 0 && menu.x + menu.width <= width);
            assert(await page.locator('[data-db-export-sql="postgresql"] span:last-of-type').isVisible());
            await page.keyboard.press("Escape");
        }
        assert.deepEqual(errors, []);
        console.log("PASS: SQL generation from DBML/DDL, clipboard sharing, sample, rebuild/editor toggle, dropdown closing and responsive toolbar; no JS errors.");
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
