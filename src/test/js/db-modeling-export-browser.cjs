// Run against an isolated QA server with PLAYWRIGHT_MODULE and AASTUDIO_BASE_URL.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.AASTUDIO_BASE_URL || "http://localhost:18080";
const source = "Table users {\n id int [pk, increment]\n email varchar(160) [not null, unique]\n enabled boolean [default: true]\n website varchar(200) [default: 'https://example.com/a--b', note: 'pk unique default: hello']\n}\nTable orders {\n id bigint [pk]\n user_id int [not null]\n total decimal(12, 2) [default: 0]\n}\nRef: orders.user_id > users.id";
const layout = { users: { x: 48, y: 48 }, orders: { x: 2248, y: 848 } };
const contents = async (download) => {
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    return Buffer.concat(chunks);
};
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.route(`${baseUrl}/api/db-modeling/schema**`, (route) => route.fulfill({ json: { schemaText: source, layoutJson: JSON.stringify(layout), categories: [{ categoryId: "ecommerce", categoryName: "Export QA" }] } }));
        await page.goto(`${baseUrl}/db-modeling`);
        await page.locator(".monaco-editor").waitFor();
        await page.waitForFunction(() => document.querySelector('[data-erd-table="orders"]')?.offsetLeft === 2248);
        assert.equal(await page.locator("#db-export-source, #db-export-model").count(), 0);
        assert.equal(await page.locator("[data-db-export-image]").count(), 3);
        assert.equal(await page.locator("[data-db-export-sql]").count(), 4);
        const menu = page.locator("[data-workspace-export]");
        const download = async (selector) => {
            await menu.locator("summary").click();
            const next = page.waitForEvent("download");
            await page.locator(selector).click();
            const file = await next;
            assert.equal(await menu.getAttribute("open"), null);
            return { name: file.suggestedFilename(), bytes: await contents(file) };
        };
        for (const dialect of ["postgresql", "mysql", "sqlserver", "oracle"]) {
            const file = await download(`[data-db-export-sql="${dialect}"]`);
            assert(file.name.endsWith(`.${dialect}.sql`));
            const text = file.bytes.toString("utf8");
            assert.match(text, /CREATE TABLE/);
            assert.match(text, /FOREIGN KEY/);
            assert.match(text, /DEFAULT (TRUE|1)/);
            assert.match(text, /DECIMAL\(12,2\)|NUMBER\(12,2\)/);
            assert.match(text, /AUTO_INCREMENT|IDENTITY/);
            assert.match(text, /https:\/\/example.com\/a--b/);
            assert(!/website[^\n]*NOT NULL/.test(text));
        }
        const svg = await download('[data-db-export-image="svg"]');
        assert(svg.name.endsWith(".svg"));
        const vector = svg.bytes.toString("utf8");
        assert(vector.includes("orders") && vector.includes('x="2248"'));
        assert(!vector.includes("foreignObject"));
        const validXml = await page.evaluate((text) => !new DOMParser().parseFromString(text, "image/svg+xml").querySelector("parsererror"), vector);
        assert(validXml);
        const png = await download('[data-db-export-image="png"]');
        assert.equal(png.bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert(png.bytes.readUInt32BE(16) > 2200);
        assert(png.bytes.readUInt32BE(16) <= 4096);
        assert(png.bytes.readUInt32BE(20) > 900);
        const pdf = await download('[data-db-export-image="pdf"]');
        assert.equal(pdf.bytes.subarray(0, 5).toString(), "%PDF-");
        const pdfText = pdf.bytes.toString("latin1");
        assert(pdfText.includes("/MediaBox") && pdfText.includes("/Subtype /Image"));
        const xref = Number(pdfText.match(/startxref\n(\d+)/)[1]);
        assert.equal(pdf.bytes.subarray(xref, xref + 4).toString(), "xref");
        if (process.env.AASTUDIO_EXPORT_ARTIFACT_DIR) {
            const directory = process.env.AASTUDIO_EXPORT_ARTIFACT_DIR;
            fs.mkdirSync(directory, { recursive: true });
            for (const [name, file] of [["erd-export-preview.svg", svg], ["erd-export-preview.png", png], ["erd-export-preview.pdf", pdf]]) fs.writeFileSync(path.join(directory, name), file.bytes);
        }

        // The SQL parser must preserve named composite primary and foreign keys.
        await page.evaluate(() => monaco.editor.getModels()[0].setValue("CREATE TABLE parent (tenant int, id bigint, CONSTRAINT pk_parent PRIMARY KEY (tenant, id));\nCREATE TABLE child (tenant int, parent_id bigint, CONSTRAINT fk_child FOREIGN KEY (tenant, parent_id) REFERENCES parent(tenant, id));"));
        await page.waitForFunction(() => document.querySelector('[data-erd-table="parent"]'));
        const compound = (await download('[data-db-export-sql="postgresql"]')).bytes.toString("utf8");
        assert.match(compound, /PRIMARY KEY \("tenant", "id"\)/);
        assert.match(compound, /FOREIGN KEY \("tenant", "parent_id"\) REFERENCES "parent" \("tenant", "id"\)/);

        await page.evaluate(() => monaco.editor.getModels()[0].setValue("Table invalid {\n id int [pk]\n shape geometry\n}"));
        await menu.locator("summary").click();
        const alert = page.waitForEvent("dialog").then(async (dialog) => {
            assert.equal(dialog.type(), "alert");
            await dialog.dismiss();
        });
        await page.locator('[data-db-export-sql="oracle"]').click();
        await alert;
        assert.equal(await menu.getAttribute("open"), null);
        await page.setViewportSize({ width: 375, height: 812 });
        await menu.locator("summary").click();
        const box = await page.locator(".db-export-menu").boundingBox();
        assert(box.x >= 0 && box.x + box.width <= 375);
        assert(await page.locator('[data-db-export-sql="mysql"] span:last-of-type').isVisible());
        assert.deepEqual(errors, []);
        console.log("PASS: seven real downloads, SQL defaults/identity/composite keys, full ERD SVG/PNG bounds, PDF xref, explicit unsupported-type error, mobile menu and removed old entries; no JS errors.");
    } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
