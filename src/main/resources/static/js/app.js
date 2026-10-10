document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("main-sidebar");
    const contentWrapper = document.getElementById("content-wrapper");
    const header = document.querySelector("header");

    if (sidebarToggle && sidebar && contentWrapper) {
        const toggleIcon = sidebarToggle.querySelector("[data-sidebar-toggle-icon]");
        const setSidebarCollapsed = (collapsed) => {
            sidebar.classList.toggle("collapsed", collapsed);
            sidebar.classList.toggle("w-sidebar-width", !collapsed);
            sidebar.classList.toggle("w-20", collapsed);
            contentWrapper.classList.toggle("pl-sidebar-width", !collapsed);
            contentWrapper.classList.toggle("pl-20", collapsed);
            contentWrapper.classList.toggle("sidebar-expanded", !collapsed);
            header?.classList.toggle("left-sidebar-width", !collapsed);
            header?.classList.toggle("left-20", collapsed);
            toggleIcon?.classList.toggle("rotate-180", collapsed);
            sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
            sidebarToggle.setAttribute("aria-label", collapsed ? "사이드바 펼치기" : "사이드바 접기");
            localStorage.setItem("aastudio-sidebar-collapsed", String(collapsed));
        };

        const storedCollapsed = localStorage.getItem("aastudio-sidebar-collapsed");
        setSidebarCollapsed(storedCollapsed === null ? true : storedCollapsed === "true");
        sidebarToggle.addEventListener("click", () => {
            setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
        });
    }

    const projectSelect = document.querySelector("[data-project-select]");
    if (projectSelect) {
        const projectCard = projectSelect.closest(".project-select-card");
        const projectArea = projectCard?.closest(".project-select-area");
        const projectTrigger = projectCard?.querySelector("[data-project-trigger]");
        const projectValue = projectCard?.querySelector("[data-project-value]");
        const projectMenu = projectCard?.querySelector("[data-project-menu]");
        const projectOptions = projectMenu ? [...projectMenu.querySelectorAll("[data-project-value]")] : [];
        const currentProjectId = projectCard?.dataset.currentProjectId;
        const currentProjectOption = [...projectSelect.options].find((option) => option.value === currentProjectId);
        if (currentProjectOption) projectSelect.value = currentProjectOption.value;
        const syncProjectDropdown = () => {
            const selected = projectSelect.options[projectSelect.selectedIndex];
            if (projectValue && selected) projectValue.textContent = selected.textContent;
            projectOptions.forEach((option) => option.classList.toggle("is-selected", option.dataset.projectValue === projectSelect.value));
        };
        const closeProjectDropdown = () => {
            projectCard?.classList.remove("is-open");
            projectArea?.classList.remove("is-open");
            projectTrigger?.setAttribute("aria-expanded", "false");
        };
        projectTrigger?.addEventListener("click", () => {
            const isOpen = projectCard?.classList.toggle("is-open") ?? false;
            projectArea?.classList.toggle("is-open", isOpen);
            projectTrigger.setAttribute("aria-expanded", String(isOpen));
        });
        projectOptions.forEach((option) => option.addEventListener("click", () => {
            projectSelect.value = option.dataset.projectValue;
            projectSelect.dispatchEvent(new Event("change", { bubbles: true }));
            syncProjectDropdown();
            closeProjectDropdown();
        }));
        projectSelect.addEventListener("change", syncProjectDropdown);
        document.addEventListener("click", (event) => {
            if (projectCard && !projectCard.contains(event.target)) closeProjectDropdown();
        });
        syncProjectDropdown();

        const projectModal = document.getElementById("common-project-modal");
        const projectModalForm = document.getElementById("common-project-form");
        const projectModalName = document.getElementById("common-project-name");
        const closeProjectModal = () => {
            projectModal?.classList.add("hidden");
            projectModal?.classList.remove("flex");
            projectModal?.setAttribute("aria-hidden", "true");
        };
        const requestProjectName = () => new Promise((resolve) => {
            if (!(projectModal instanceof HTMLElement) || !(projectModalForm instanceof HTMLFormElement) || !(projectModalName instanceof HTMLInputElement)) {
                resolve(null);
                return;
            }
            projectModal.classList.remove("hidden");
            projectModal.classList.add("flex");
            projectModal.setAttribute("aria-hidden", "false");
            projectModalName.value = "";
            window.requestAnimationFrame(() => projectModalName.focus());
            const onSubmit = (event) => {
                event.preventDefault();
                const value = projectModalName.value.trim();
                if (value) finish(value);
            };
            const onBackdrop = (event) => {
                if (event.target === projectModal) finish(null);
            };
            const onCancel = () => finish(null);
            const finish = (value) => {
                projectModalForm.removeEventListener("submit", onSubmit);
                projectModal.removeEventListener("click", onBackdrop);
                document.getElementById("common-project-cancel")?.removeEventListener("click", onCancel);
                document.getElementById("common-project-cancel-secondary")?.removeEventListener("click", onCancel);
                closeProjectModal();
                resolve(value);
            };
            projectModalForm.addEventListener("submit", onSubmit);
            projectModal.addEventListener("click", onBackdrop);
            document.getElementById("common-project-cancel")?.addEventListener("click", onCancel);
            document.getElementById("common-project-cancel-secondary")?.addEventListener("click", onCancel);
        });

        const setCurrentProject = (projectId) => {
            document.cookie = `aastudio.currentProject=${encodeURIComponent(projectId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
        };

        projectSelect.addEventListener("change", async () => {
            const projectId = projectSelect.value;
            if (projectId !== "__create__") {
                setCurrentProject(projectId);
                window.location.reload();
                return;
            }

            const name = await requestProjectName();
            if (!name || !name.trim()) {
                projectSelect.selectedIndex = 0;
                return;
            }

            try {
                const response = await fetch("/api/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim(), description: "" })
                });
                if (!response.ok) {
                    const result = await response.json().catch(() => ({}));
                    throw new Error(result.message || "프로젝트를 만들 수 없습니다.");
                }
                const project = await response.json();
                setCurrentProject(project.projectId);
                window.location.reload();
            } catch (error) {
                window.alert(error.message);
                projectSelect.selectedIndex = 0;
            }
        });

        const hasProjects = [...projectSelect.options].some((option) => option.value !== "__create__");
        if (!hasProjects) {
            projectSelect.value = "__create__";
            window.requestAnimationFrame(() => projectSelect.dispatchEvent(new Event("change", { bubbles: true })));
        }
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
