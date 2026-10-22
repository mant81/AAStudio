// Run against a local Spring Boot server; supports PLAYWRIGHT_MODULE and AASTUDIO_BASE_URL.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.AASTUDIO_BASE_URL || "http://localhost:8080";

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript(() => localStorage.setItem("aastudio-sidebar-collapsed", "false"));
        const routes = ["/", "/diagram", "/db-modeling", "/api", "/wiki", "/settings"];
        for (const route of routes) {
            const response = await page.goto(`${baseUrl}${route}`);
            assert.equal(response.status(), 200, route);
            await page.waitForFunction(() => typeof tailwind !== "undefined");
            const active = page.locator('.app-navigation a[aria-current="page"]');
            assert.equal(await active.count(), 1, route);
            assert.equal(await active.getAttribute("href"), route);
            const geometry = await page.evaluate(() => {
                const header = document.querySelector(".app-navigation").getBoundingClientRect();
                const main = document.querySelector("main").getBoundingClientRect();
                const workspace = document.querySelector(".workspace-page")?.getBoundingClientRect();
                const project = document.querySelector(".project-select-area").getBoundingClientRect();
                const menus = document.querySelector(".app-navigation-tabs").getBoundingClientRect();
                return { x: main.x, width: main.width, top: main.top, headerBottom: header.bottom,
                    headerHeight: header.height, projectRight: project.right, menuLeft: menus.left,
                    projectCenter: project.y + project.height / 2, menuCenter: menus.y + menus.height / 2,
                    workspaceBottom: workspace?.bottom, viewport: innerWidth, height: innerHeight };
            });
            assert.equal(geometry.x, 0, route);
            assert.equal(geometry.width, geometry.viewport, route);
            assert.equal(geometry.top, geometry.headerBottom, route);
            assert.equal(geometry.headerHeight, 56, route);
            assert(geometry.projectRight <= geometry.menuLeft, route);
            assert.equal(geometry.projectCenter, geometry.menuCenter, route);
            if (geometry.workspaceBottom) assert.equal(geometry.workspaceBottom, geometry.height, route);
        }

        // Switching through the new dropdown must persist the project cookie and reload.
        const select = page.locator("[data-project-select]");
        const trigger = page.locator("[data-project-trigger]");
        const projectIds = await select.locator('option:not([value="__create__"])').evaluateAll((options) => options.map((o) => o.value));
        assert(projectIds.length > 0);
        const selectedId = projectIds.at(-1);
        await trigger.click();
        await Promise.all([
            page.waitForNavigation(),
            page.locator(`.project-select-option[data-project-value="${selectedId}"]`).click()
        ]);
        assert.equal((await context.cookies()).find((cookie) => cookie.name === "aastudio.currentProject")?.value, encodeURIComponent(selectedId));
        const currentName = await trigger.innerText();
        await trigger.focus();
        await page.keyboard.press("ArrowDown");
        assert.equal(await trigger.getAttribute("aria-expanded"), "true");
        assert.equal(await page.locator('[role="option"][aria-selected="true"]').count(), 1);
        assert(await page.locator('[role="option"][aria-selected="true"]').evaluate((element) => document.activeElement === element));
        await page.keyboard.press("Escape");
        assert.equal(await trigger.getAttribute("aria-expanded"), "false");
        assert(await trigger.evaluate((element) => document.activeElement === element));

        // Cancelling creation restores the selected project, including when it is not the first one.
        await trigger.click();
        await page.locator('.project-select-create').click();
        await page.locator("#common-project-name").waitFor({ state: "visible" });
        await page.locator("#common-project-name").press("Escape");
        await page.locator("#common-project-modal").waitFor({ state: "hidden" });
        assert.equal(await select.inputValue(), selectedId);
        assert.equal(await trigger.innerText(), currentName);

        // Verify the create request and resulting cookie without writing test projects to the database.
        let creation;
        await page.route(`${baseUrl}/api/projects`, async (route) => {
            creation = route.request().postDataJSON();
            await route.fulfill({ json: { projectId: selectedId } });
        });
        await trigger.click();
        await page.locator('.project-select-create').click();
        await page.locator("#common-project-name").fill("상단 탐색 검증");
        await Promise.all([
            page.waitForNavigation(),
            page.locator('#common-project-form button[type="submit"]').click()
        ]);
        assert.deepEqual(creation, { name: "상단 탐색 검증", description: "" });

        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`${baseUrl}/settings`);
        const header = await page.locator(".app-navigation").boundingBox();
        assert.equal(header.width, 375);
        assert.equal(header.height, 56);
        assert(await trigger.isVisible());
        assert(await page.locator(".app-settings-link").isVisible());
        await page.locator('.app-navigation-tab[href="/wiki"]').focus();
        assert(await page.locator('.app-navigation-tab[href="/wiki"]').evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.left >= 0 && box.right <= innerWidth;
        }));
        await trigger.click();
        const menu = await page.locator(".project-select-menu").boundingBox();
        assert(menu.x >= 0 && menu.x + menu.width <= 375);
        assert.deepEqual(errors, []);
        console.log("PASS: six rendered routes, active navigation, full width and viewport height, project switching/creation/cancel, keyboard access, mobile navigation; no JS errors.");
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
