document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('.app-navigation-tab[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });

    document.querySelectorAll("[data-workspace-export], [data-workspace-menu]").forEach((menu) => {
        menu.addEventListener("click", (event) => {
            if (event.target.closest("[data-diagram-export], [data-workspace-action]")) menu.open = false;
        });
        menu.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            menu.open = false;
            menu.querySelector("summary")?.focus();
        });
        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target)) menu.open = false;
        }, true);
    });

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
        let selectedProjectId = projectSelect.value;
        const syncProjectDropdown = () => {
            const selected = projectSelect.options[projectSelect.selectedIndex];
            if (projectValue && selected) projectValue.textContent = selected.textContent;
            projectOptions.forEach((option) => {
                const selected = option.dataset.projectValue === projectSelect.value;
                option.classList.toggle("is-selected", selected);
                option.setAttribute("aria-selected", String(selected));
            });
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
        projectTrigger?.addEventListener("keydown", (event) => {
            if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            projectCard?.classList.add("is-open");
            projectArea?.classList.add("is-open");
            projectTrigger.setAttribute("aria-expanded", "true");
            const selected = projectOptions.find((option) => option.dataset.projectValue === projectSelect.value);
            (selected || projectOptions[0])?.focus();
        });
        projectCard?.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeProjectDropdown();
                projectTrigger?.focus();
                return;
            }
            const index = projectOptions.indexOf(document.activeElement);
            if (index < 0) return;
            let next = index;
            if (event.key === "ArrowDown") next = (index + 1) % projectOptions.length;
            else if (event.key === "ArrowUp") next = (index - 1 + projectOptions.length) % projectOptions.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = projectOptions.length - 1;
            else return;
            event.preventDefault();
            projectOptions[next].focus();
        });
        projectCard?.addEventListener("focusout", (event) => {
            if (!projectCard.contains(event.relatedTarget)) closeProjectDropdown();
        });
        projectOptions.forEach((option) => option.addEventListener("click", () => {
            projectSelect.value = option.dataset.projectValue;
            projectSelect.dispatchEvent(new Event("change", { bubbles: true }));
            syncProjectDropdown();
            closeProjectDropdown();
            projectTrigger?.focus();
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
            projectTrigger?.focus();
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
            const onKeydown = (event) => {
                if (event.key === "Escape") finish(null);
            };
            const finish = (value) => {
                projectModalForm.removeEventListener("submit", onSubmit);
                projectModal.removeEventListener("click", onBackdrop);
                projectModal.removeEventListener("keydown", onKeydown);
                document.getElementById("common-project-cancel")?.removeEventListener("click", onCancel);
                document.getElementById("common-project-cancel-secondary")?.removeEventListener("click", onCancel);
                closeProjectModal();
                resolve(value);
            };
            projectModalForm.addEventListener("submit", onSubmit);
            projectModal.addEventListener("click", onBackdrop);
            projectModal.addEventListener("keydown", onKeydown);
            document.getElementById("common-project-cancel")?.addEventListener("click", onCancel);
            document.getElementById("common-project-cancel-secondary")?.addEventListener("click", onCancel);
        });

        const setCurrentProject = (projectId) => {
            document.cookie = `aastudio.currentProject=${encodeURIComponent(projectId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
        };

        projectSelect.addEventListener("change", async () => {
            const projectId = projectSelect.value;
            if (projectId !== "__create__") {
                selectedProjectId = projectId;
                setCurrentProject(projectId);
                window.location.reload();
                return;
            }

            const name = await requestProjectName();
            if (!name || !name.trim()) {
                projectSelect.value = selectedProjectId;
                syncProjectDropdown();
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
                projectSelect.value = selectedProjectId;
                syncProjectDropdown();
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
        const selected = [...panels].some((panel) => panel.classList.contains("is-active") && panel.dataset.settingsPanel === tab.dataset.settingsTab);
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-pressed", String(selected));
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-settings-tab");
            tabs.forEach((item) => {
                item.classList.remove("is-active");
                item.setAttribute("aria-pressed", "false");
            });
            panels.forEach((panel) => panel.classList.remove("is-active"));
            tab.classList.add("is-active");
            tab.setAttribute("aria-pressed", "true");
            document.querySelector(`[data-settings-panel="${target}"]`)?.classList.add("is-active");
        });
    });

});
