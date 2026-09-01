document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("main-sidebar");
    const contentWrapper = document.getElementById("content-wrapper");
    const header = document.querySelector("header");

    if (sidebarToggle && sidebar && contentWrapper && header) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            sidebar.classList.toggle("w-sidebar-width");
            sidebar.classList.toggle("w-20");
            contentWrapper.classList.toggle("pl-sidebar-width");
            contentWrapper.classList.toggle("pl-20");
            header.classList.toggle("left-sidebar-width");
            header.classList.toggle("left-20");
        });
    }

    const tabs = document.querySelectorAll("[data-settings-tab]");
    const panels = document.querySelectorAll("[data-settings-panel]");
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-settings-tab");
            tabs.forEach((item) => item.classList.remove("is-active"));
            panels.forEach((panel) => panel.classList.remove("is-active"));
            tab.classList.add("is-active");
            document.querySelector(`[data-settings-panel="${target}"]`)?.classList.add("is-active");
        });
    });

});
