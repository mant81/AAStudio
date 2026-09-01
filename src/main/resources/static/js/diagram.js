function initializeDiagramPage() {
    const diagramRoot = document.getElementById("diagram-root");
    if (!diagramRoot) {
        return;
    }

    const spacesPanel = document.getElementById("spaces-panel");
    const spacesToggle = document.getElementById("diagram-spaces-toggle");
    const spacesToggleIcon = document.getElementById("diagram-spaces-toggle-icon");
    const spacesOpenButton = document.getElementById("diagram-spaces-open");
    const spacesTexts = Array.from(diagramRoot.querySelectorAll("[data-spaces-text]"));
    const spacesAction = diagramRoot.querySelector("[data-spaces-action]");
    const spacesHeader = diagramRoot.querySelector("[data-spaces-header]");
    const spacesHeaderTitle = diagramRoot.querySelector("[data-spaces-header-title]");
    const spacesHeaderExpander = diagramRoot.querySelector("[data-spaces-header-expander]");
    const spacesCollapsedIcon = diagramRoot.querySelector("[data-spaces-collapsed-icon]");
    const spacesScroll = diagramRoot.querySelector("[data-spaces-scroll]");
    const spacesRows = Array.from(diagramRoot.querySelectorAll("[data-spaces-row]"));
    const spacesExpanders = Array.from(diagramRoot.querySelectorAll("[data-spaces-expander]"));
    const spacesFooter = diagramRoot.querySelector("[data-spaces-footer]");
    const spaceGroups = Array.from(diagramRoot.querySelectorAll("[data-space-group]"));
    const zoomLayer = document.getElementById("zoom-layer");
    const diagramStage = document.getElementById("diagram-stage");
    const zoomInButton = document.getElementById("diagram-zoom-in");
    const zoomOutButton = document.getElementById("diagram-zoom-out");
    const zoomValue = document.getElementById("diagram-zoom-value");
    const toolButtons = Array.from(diagramRoot.querySelectorAll("[data-diagram-tool]"));
    const selectedNodeName = document.getElementById("diagram-selected-node-name");
    const selectedNodeType = document.getElementById("diagram-selected-node-type");
    const selectedNodeIcon = document.getElementById("diagram-selected-node-icon");
    const selectedNodeIconWrap = document.getElementById("diagram-selected-node-icon-wrap");
    const propertiesPanel = document.getElementById("diagram-properties-panel");
    const propertiesCloseButton = document.getElementById("diagram-properties-close");
    const nodeLabelInput = document.getElementById("diagram-node-label-input");
    const nodeSubLabelInput = document.getElementById("diagram-node-sub-label-input");
    const linePaths = Array.from(diagramRoot.querySelectorAll("[data-line-from][data-line-to]"));
    const fillColorValue = document.getElementById("diagram-fill-color-value");
    const fillColorButtons = Array.from(diagramRoot.querySelectorAll("[data-fill-color]"));
    const strokeWidthInput = document.getElementById("diagram-stroke-width-input");
    const strokeWidthValue = document.getElementById("diagram-stroke-width-value");
    const strokeStyleButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-style]"));

    if (!spacesPanel || !spacesToggle || !spacesToggleIcon || !zoomLayer || !diagramStage) {
        return;
    }

    let currentScale = 1;
    let activeTool = "select";
    let selectedNode = null;
    let nodeCounter = diagramRoot.querySelectorAll("[data-diagram-node]").length;
    let diagramCounter = diagramRoot.querySelectorAll("[data-space-diagram]").length + 1;
    let groupCounter = spaceGroups.length + 1;

    const getNodes = () => Array.from(diagramRoot.querySelectorAll("[data-diagram-node]"));

    const setSpacesHidden = (hidden) => {
        spacesPanel.style.display = hidden ? "none" : "flex";
        spacesPanel.style.width = hidden ? "0px" : "280px";
        spacesPanel.style.opacity = hidden ? "0" : "1";
        spacesPanel.style.pointerEvents = hidden ? "none" : "auto";
        spacesPanel.classList.toggle("hidden", hidden);
        spacesPanel.classList.toggle("flex", !hidden);
        spacesPanel.classList.toggle("w-[280px]", !hidden);
        spacesPanel.classList.toggle("opacity-100", !hidden);
        spacesPanel.classList.toggle("pointer-events-auto", !hidden);
        spacesPanel.classList.toggle("bg-surface", !hidden);
        spacesPanel.classList.toggle("border-outline-variant", !hidden);
        spacesPanel.classList.toggle("w-0", hidden);
        spacesPanel.classList.toggle("opacity-0", hidden);
        spacesPanel.classList.toggle("pointer-events-none", hidden);
        spacesPanel.classList.toggle("bg-transparent", hidden);
        spacesPanel.classList.toggle("border-transparent", hidden);
        spacesTexts.forEach((element) => element.classList.toggle("hidden", hidden));
        spacesRows.forEach((element) => {
            element.classList.toggle("justify-center", hidden);
            element.classList.toggle("px-3", !hidden);
            element.classList.toggle("px-2", hidden);
        });
        spacesExpanders.forEach((element) => element.classList.toggle("hidden", hidden));
        if (spacesAction instanceof HTMLElement) {
            spacesAction.classList.toggle("hidden", hidden);
        }
        if (spacesHeader instanceof HTMLElement) {
            spacesHeader.classList.toggle("justify-between", !hidden);
            spacesHeader.classList.toggle("justify-center", hidden);
            spacesHeader.classList.toggle("px-4", !hidden);
            spacesHeader.classList.toggle("px-0", hidden);
        }
        if (spacesHeaderTitle instanceof HTMLElement) {
            spacesHeaderTitle.classList.toggle("hidden", hidden);
        }
        if (spacesHeaderExpander instanceof HTMLElement) {
            spacesHeaderExpander.classList.toggle("hidden", hidden);
        }
        if (spacesCollapsedIcon instanceof HTMLElement) {
            spacesCollapsedIcon.classList.toggle("hidden", true);
        }
        if (spacesScroll instanceof HTMLElement) {
            spacesScroll.classList.toggle("px-2", !hidden);
            spacesScroll.classList.toggle("px-1", hidden);
        }
        if (spacesFooter instanceof HTMLElement) {
            spacesFooter.classList.toggle("px-4", !hidden);
            spacesFooter.classList.toggle("px-2", hidden);
        }
        if (spacesOpenButton instanceof HTMLElement) {
            spacesOpenButton.classList.toggle("hidden", !hidden);
        }
        spacesToggleIcon.textContent = "chevron_left";
    };

    window.openDiagramSpaces = () => {
        setSpacesHidden(false);
    };

    const setActiveDiagramButton = (button) => {
        const diagramButtons = Array.from(diagramRoot.querySelectorAll("[data-space-diagram]"));
        diagramButtons.forEach((item) => {
            const isActive = item === button;
            item.classList.toggle("bg-secondary/10", isActive);
            item.classList.toggle("text-secondary", isActive);
            item.classList.toggle("text-on-surface-variant", !isActive);
        });
    };

    const bindDiagramButton = (button) => {
        button.addEventListener("click", () => {
            setActiveDiagramButton(button);
        });
    };

    const syncGroupState = (group, expanded) => {
        const children = group.querySelector("[data-spaces-children]");
        const expander = group.querySelector("[data-spaces-expander]");
        if (children instanceof HTMLElement) {
            children.classList.toggle("hidden", !expanded);
        }
        if (expander instanceof HTMLElement) {
            expander.classList.toggle("-rotate-90", !expanded);
        }
        group.dataset.groupExpanded = expanded ? "true" : "false";
    };

    const createDiagramButton = (name, isActive) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.spaceDiagram = "";
        button.className = "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-body-md text-body-md text-left transition-colors";
        button.innerHTML = `
            <span class="material-symbols-outlined text-[16px]">account_tree</span>
            <span class="truncate" data-spaces-text>${name}</span>
        `;
        bindDiagramButton(button);
        if (isActive) {
            setActiveDiagramButton(button);
        } else {
            button.classList.add("text-on-surface-variant", "hover:bg-surface-variant/50");
        }
        return button;
    };

    const bindGroupInteractions = (group) => {
        if (group.dataset.bound === "true") {
            return;
        }
        group.dataset.bound = "true";

        const toggleButton = group.querySelector("[data-group-toggle]");
        const addDiagramButton = group.querySelector("[data-group-add-diagram]");
        const children = group.querySelector("[data-spaces-children]");
        const expanded = group.dataset.groupExpanded !== "false";

        syncGroupState(group, expanded);

        toggleButton?.addEventListener("click", () => {
            const nextExpanded = group.dataset.groupExpanded !== "true";
            syncGroupState(group, nextExpanded);
        });

        addDiagramButton?.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!(children instanceof HTMLElement)) {
                return;
            }

            const groupName = group.querySelector("[data-group-name]")?.textContent?.trim() || `Group ${groupCounter}`;
            const newButton = createDiagramButton(`${groupName} Diagram ${diagramCounter++}`, true);
            newButton.classList.remove("text-on-surface-variant", "hover:bg-surface-variant/50");
            children.appendChild(newButton);
            syncGroupState(group, true);
        });

        Array.from(group.querySelectorAll("[data-space-diagram]")).forEach(bindDiagramButton);
    };

    const applyScale = () => {
        diagramStage.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        if (zoomValue) {
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
        }
    };

    const syncToolButtons = () => {
        toolButtons.forEach((button) => {
            const isActive = button.dataset.diagramTool === activeTool;
            button.classList.toggle("text-secondary", isActive);
            button.classList.toggle("bg-secondary/10", isActive);
            button.classList.toggle("text-on-surface-variant", !isActive);
        });
        zoomLayer.style.cursor = activeTool === "select" ? "grab" : "copy";
    };

    const setPropertiesPanelVisible = (visible) => {
        if (!(propertiesPanel instanceof HTMLElement)) {
            return;
        }

        propertiesPanel.classList.toggle("w-[300px]", visible);
        propertiesPanel.classList.toggle("opacity-100", visible);
        propertiesPanel.classList.toggle("pointer-events-auto", visible);
        propertiesPanel.classList.toggle("flex", visible);
        propertiesPanel.classList.toggle("w-0", !visible);
        propertiesPanel.classList.toggle("opacity-0", !visible);
        propertiesPanel.classList.toggle("pointer-events-none", !visible);
    };

    const updateSelectionPanel = (node) => {
        const title = node.querySelector("[data-node-title]")?.textContent?.trim() ?? "";
        const subtitle = node.querySelector("[data-node-subtitle]")?.textContent?.trim() ?? "";
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const nodeKind = node.dataset.nodeKind ?? "node";
        const nodeIcon = node.querySelector(".material-symbols-outlined")?.textContent?.trim() ?? "widgets";
        const panelTypeLabel = nodeKind === "group-box" ? "Selected Group" : "Selected Node";
        const panelIcon = nodeKind === "group-box" ? "dashboard_customize" : nodeIcon;
        if (selectedNodeName) {
            selectedNodeName.textContent = title;
        }
        if (selectedNodeType) {
            selectedNodeType.textContent = panelTypeLabel;
        }
        if (selectedNodeIcon) {
            selectedNodeIcon.textContent = panelIcon;
        }
        if (selectedNodeIconWrap) {
            selectedNodeIconWrap.classList.toggle("bg-secondary-fixed", nodeKind !== "group-box");
            selectedNodeIconWrap.classList.toggle("text-secondary", nodeKind !== "group-box");
            selectedNodeIconWrap.classList.toggle("bg-accent-db/10", nodeKind === "group-box");
            selectedNodeIconWrap.classList.toggle("text-accent-db", nodeKind === "group-box");
        }
        if (nodeLabelInput) {
            nodeLabelInput.value = title;
        }
        if (nodeSubLabelInput) {
            nodeSubLabelInput.value = subtitle;
        }
        if (fillColorValue) {
            fillColorValue.textContent = fillColor;
        }
        if (strokeWidthInput) {
            strokeWidthInput.value = strokeWidth;
        }
        if (strokeWidthValue) {
            strokeWidthValue.textContent = `${strokeWidth}px`;
        }
        fillColorButtons.forEach((button) => {
            const isActive = button.dataset.fillColor === fillColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            const icon = button.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.classList.toggle("hidden", !isActive && button.dataset.fillColor !== "#E0E3E5");
            }
        });
        strokeStyleButtons.forEach((button) => {
            const isActive = button.dataset.strokeStyle === strokeStyle;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
        });
    };

    const syncGroupedNodeHighlights = (node) => {
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        if (node.dataset.nodeKind !== "group-box") {
            return;
        }
        getGroupedChildNodes(node).forEach((item) => {
            item.classList.add("diagram-node-grouped-highlight");
        });
    };

    const setSelectedNode = (node) => {
        selectedNode = node;
        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        node.classList.add("diagram-node-selected");
        getNodes().forEach(applyNodeAppearance);
        syncGroupedNodeHighlights(node);
        updateSelectionPanel(node);
        setPropertiesPanelVisible(true);
    };

    const clearSelectedNode = () => {
        selectedNode = null;
        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        getNodes().forEach(applyNodeAppearance);
        setPropertiesPanelVisible(false);
    };

    const applyNodeAppearance = (node) => {
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const nodeKind = node.dataset.nodeKind ?? "node";
        const isSelectedPrimary = node.classList.contains("diagram-node-selected");
        const borderColor = nodeKind === "group-box"
            ? "#8FD5B7"
            : (isSelectedPrimary ? "#006399" : "#C6C6CD");

        node.style.backgroundColor = fillColor;
        node.style.borderWidth = `${strokeWidth}px`;
        node.style.borderColor = borderColor;
        node.style.borderStyle = strokeStyle;
    };

    const ensureResizeHandle = (node) => {
        if (node.querySelector("[data-node-resize-handle]")) {
            return;
        }

        node.classList.add("relative");
        const handle = document.createElement("button");
        handle.type = "button";
        handle.dataset.nodeResizeHandle = "";
        handle.className = "diagram-node-resize-handle absolute -bottom-2 -right-2 w-4 h-4 rounded-full border-2 border-surface-white bg-secondary shadow-sm";
        handle.setAttribute("aria-label", "Resize node");
        node.appendChild(handle);
    };

    const getAnchorPoint = (node, anchor) => {
        const left = node.offsetLeft;
        const top = node.offsetTop;
        const width = node.offsetWidth;
        const height = node.offsetHeight;

        switch (anchor) {
            case "left":
                return { x: left, y: top + height / 2 };
            case "right":
                return { x: left + width, y: top + height / 2 };
            case "top":
                return { x: left + width / 2, y: top };
            case "bottom":
            default:
                return { x: left + width / 2, y: top + height };
        }
    };

    const getGroupedChildNodes = (groupNode) => {
        return getNodes().filter((node) => {
            if (node === groupNode || node.dataset.nodeKind === "group-box") {
                return false;
            }
            return node.dataset.groupParent === groupNode.dataset.nodeKey;
        });
    };

    const isNodeInsideGroup = (node, groupNode) => {
        const groupLeft = groupNode.offsetLeft;
        const groupTop = groupNode.offsetTop;
        const groupRight = groupLeft + groupNode.offsetWidth;
        const groupBottom = groupTop + groupNode.offsetHeight;
        const centerX = node.offsetLeft + (node.offsetWidth / 2);
        const centerY = node.offsetTop + (node.offsetHeight / 2);

        return centerX >= groupLeft
            && centerX <= groupRight
            && centerY >= groupTop
            && centerY <= groupBottom;
    };

    const findContainingGroup = (node) => {
        const groups = getNodes().filter((item) => item.dataset.nodeKind === "group-box");
        for (let index = groups.length - 1; index >= 0; index -= 1) {
            if (isNodeInsideGroup(node, groups[index])) {
                return groups[index];
            }
        }
        return null;
    };

    const syncNodeGroupMembership = (node) => {
        if (node.dataset.nodeKind === "group-box") {
            return;
        }

        const containingGroup = findContainingGroup(node);
        if (containingGroup) {
            node.dataset.groupParent = containingGroup.dataset.nodeKey ?? "";
        } else {
            delete node.dataset.groupParent;
        }
    };

    const moveNodeByDelta = (node, deltaX, deltaY) => {
        const initialLeft = node.offsetLeft;
        const initialTop = node.offsetTop;
        node.style.left = `${initialLeft + deltaX}px`;
        node.style.top = `${initialTop + deltaY}px`;

        if (node.dataset.nodeKind === "group-box") {
            getGroupedChildNodes(node).forEach((child) => {
                child.style.left = `${child.offsetLeft + deltaX}px`;
                child.style.top = `${child.offsetTop + deltaY}px`;
            });
        } else {
            syncNodeGroupMembership(node);
        }

        updateLinePaths();
    };

    const updateLinePaths = () => {
        linePaths.forEach((path) => {
            const fromKey = path.dataset.lineFrom;
            const toKey = path.dataset.lineTo;
            const fromNode = diagramRoot.querySelector(`[data-node-key="${fromKey}"]`);
            const toNode = diagramRoot.querySelector(`[data-node-key="${toKey}"]`);

            if (!(fromNode instanceof HTMLElement) || !(toNode instanceof HTMLElement)) {
                return;
            }

            const start = getAnchorPoint(fromNode, path.dataset.fromAnchor || "bottom");
            const end = getAnchorPoint(toNode, path.dataset.toAnchor || "top");
            const deltaX = end.x - start.x;
            const deltaY = end.y - start.y;

            const fromAnchor = path.dataset.fromAnchor || "bottom";
            const toAnchor = path.dataset.toAnchor || "top";

            let pathValue = "";
            if ((fromAnchor === "right" && toAnchor === "left") || (fromAnchor === "left" && toAnchor === "right")) {
                const midX = start.x + deltaX / 2;
                pathValue = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
            } else if ((fromAnchor === "bottom" && toAnchor === "top") || (fromAnchor === "top" && toAnchor === "bottom")) {
                const midY = start.y + deltaY / 2;
                pathValue = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
            } else {
                const controlY1 = start.y + deltaY * 0.45;
                const controlY2 = end.y - deltaY * 0.45;
                pathValue = `M ${start.x} ${start.y} C ${start.x} ${controlY1}, ${end.x} ${controlY2}, ${end.x} ${end.y}`;
            }

            path.setAttribute("d", pathValue);
        });
    };

    const bindNodeInteractions = (node) => {
        const element = node;
        if (element.dataset.bound === "true") {
            return;
        }
        element.dataset.bound = "true";
        ensureResizeHandle(element);
        element.style.left = `${element.offsetLeft}px`;
        element.style.top = `${element.offsetTop}px`;
        element.dataset.fillColor = element.dataset.fillColor ?? (element.dataset.nodeKey === "order-service" ? "#CDE5FF" : "#FFFFFF");
        element.dataset.strokeWidth = element.dataset.strokeWidth ?? (element.dataset.nodeKey === "order-service" ? "2" : "1");
        element.dataset.strokeStyle = element.dataset.strokeStyle ?? "solid";
        applyNodeAppearance(element);
        syncNodeGroupMembership(element);

        element.addEventListener("click", (event) => {
            event.stopPropagation();
            setSelectedNode(element);
        });

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let groupedChildren = [];
        let isResizing = false;
        let initialWidth = 0;
        let initialHeight = 0;
        const resizeHandle = element.querySelector("[data-node-resize-handle]");

        resizeHandle?.addEventListener("mousedown", (event) => {
            if (activeTool !== "select") {
                return;
            }
            isResizing = true;
            startX = event.clientX;
            startY = event.clientY;
            initialWidth = element.offsetWidth;
            initialHeight = element.offsetHeight;
            setSelectedNode(element);
            event.preventDefault();
            event.stopPropagation();
        });

        element.addEventListener("mousedown", (event) => {
            if (activeTool !== "select") {
                return;
            }
            if (event.target instanceof HTMLElement && event.target.closest("[data-node-resize-handle]")) {
                return;
            }
            isDragging = true;
            startX = event.clientX;
            startY = event.clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;
            groupedChildren = element.dataset.nodeKind === "group-box"
                ? getGroupedChildNodes(element).map((child) => ({
                    element: child,
                    initialLeft: child.offsetLeft,
                    initialTop: child.offsetTop
                }))
                : [];
            setSelectedNode(element);
            event.preventDefault();
            event.stopPropagation();
        });

        window.addEventListener("mousemove", (event) => {
            if (isResizing) {
                const deltaX = (event.clientX - startX) / currentScale;
                const deltaY = (event.clientY - startY) / currentScale;
                const minWidth = element.dataset.nodeKind === "group-box" ? 240 : 120;
                const minHeight = element.dataset.nodeKind === "group-box" ? 120 : 72;
                element.style.width = `${Math.max(minWidth, initialWidth + deltaX)}px`;
                element.style.height = `${Math.max(minHeight, initialHeight + deltaY)}px`;
                if (element.dataset.nodeKind !== "group-box") {
                    syncNodeGroupMembership(element);
                } else {
                    syncGroupedNodeHighlights(element);
                }
                updateLinePaths();
                return;
            }
            if (!isDragging) {
                return;
            }
            const deltaX = (event.clientX - startX) / currentScale;
            const deltaY = (event.clientY - startY) / currentScale;
            element.style.left = `${initialLeft + deltaX}px`;
            element.style.top = `${initialTop + deltaY}px`;
            groupedChildren.forEach((child) => {
                child.element.style.left = `${child.initialLeft + deltaX}px`;
                child.element.style.top = `${child.initialTop + deltaY}px`;
            });
            updateLinePaths();
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
            isResizing = false;
            if (element.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(element);
            }
            groupedChildren = [];
        });
    };

    const createNodeMarkup = (tool) => {
        const node = document.createElement("div");
        node.dataset.diagramNode = "";
        node.dataset.nodeKey = `generated-${tool}-${++nodeCounter}`;

        let icon = "rectangle";
        let title = "Service Node";
        let subtitle = "New Component";
        let shapeClass = "rounded-xl";
        let widthClass = "w-48";
        let extraClass = "";

        if (tool === "circle") {
            icon = "circle";
            title = "Circle Node";
            subtitle = "Visual Group";
            shapeClass = "rounded-full";
        } else if (tool === "diamond") {
            icon = "category";
            title = "Decision";
            subtitle = "Logic";
        } else if (tool === "text") {
            icon = "text_fields";
            title = "Text Block";
            subtitle = "Editable";
            widthClass = "w-56";
        } else if (tool === "image") {
            icon = "image";
            title = "Image Block";
            subtitle = "Placeholder";
            widthClass = "w-56";
        } else if (tool === "group-box") {
            title = "Group Box";
            subtitle = "Group Box";
            widthClass = "w-[700px]";
            shapeClass = "rounded-2xl";
            extraClass = "h-[180px] border-accent-db/20 bg-accent-db/5 border-dashed z-0 items-start justify-start";
        }

        if (tool === "group-box") {
            node.dataset.nodeKind = "group-box";
            node.dataset.fillColor = "rgba(16, 185, 129, 0.05)";
            node.dataset.strokeWidth = "1";
            node.dataset.strokeStyle = "dashed";
            node.className = `absolute ${widthClass} ${shapeClass} ${extraClass} border p-0 cursor-move`;
            node.innerHTML = `
                <div class="absolute -top-3 left-6 bg-surface-container-low px-2 font-label-md text-label-md text-accent-db flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">database</span>
                    <span data-node-title>${title}</span>
                </div>
                <span class="hidden" data-node-subtitle>${subtitle}</span>
            `;
            return node;
        }

        node.className = `absolute ${widthClass} bg-surface-white border border-outline-variant ${shapeClass} shadow-md p-4 flex flex-col items-center justify-center gap-2 cursor-move z-10`;
        node.innerHTML = `
            <div class="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-1">
                <span class="material-symbols-outlined text-[20px]">${icon}</span>
            </div>
            <h3 class="font-title-md text-title-md text-on-surface text-center" data-node-title>${title}</h3>
            <p class="font-label-md text-label-md text-on-surface-variant text-center" data-node-subtitle>${subtitle}</p>
        `;
        return node;
    };

    const createNodeAtPointer = (event) => {
        if (activeTool === "select") {
            return;
        }
        const stageRect = diagramStage.getBoundingClientRect();
        const left = (event.clientX - stageRect.left) / currentScale;
        const top = (event.clientY - stageRect.top) / currentScale;
        const node = createNodeMarkup(activeTool);
        diagramStage.appendChild(node);
        const offsetLeft = activeTool === "group-box" ? 350 : 96;
        const offsetTop = activeTool === "group-box" ? 90 : 48;
        node.style.left = `${Math.max(24, left - offsetLeft)}px`;
        node.style.top = `${Math.max(24, top - offsetTop)}px`;
        bindNodeInteractions(node);
        syncNodeGroupMembership(node);
        setSelectedNode(node);
        activeTool = "select";
        syncToolButtons();
    };

    spacesToggle.addEventListener("click", () => {
        setSpacesHidden(true);
    });

    spacesOpenButton?.addEventListener("click", () => {
        setSpacesHidden(false);
    });

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        const clickedOpenButton = event.target.closest("#diagram-spaces-open");
        const clickedSidebarSpaces = event.target.closest("[data-open-diagram-spaces]");
        if (!clickedOpenButton && !clickedSidebarSpaces) {
            return;
        }

        const isDiagramPage = window.location.pathname.replace(/\/$/, "") === "/diagram";
        if (clickedSidebarSpaces && !isDiagramPage) {
            return;
        }

        event.preventDefault();
        setSpacesHidden(false);
    });

    zoomInButton?.addEventListener("click", () => {
        currentScale = Math.min(2, Number((currentScale + 0.1).toFixed(2)));
        applyScale();
    });

    zoomOutButton?.addEventListener("click", () => {
        currentScale = Math.max(0.5, Number((currentScale - 0.1).toFixed(2)));
        applyScale();
    });

    toolButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeTool = button.dataset.diagramTool ?? "select";
            syncToolButtons();
        });
    });

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;

    zoomLayer.addEventListener("mousedown", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]")) {
            return;
        }
        if (activeTool !== "select") {
            return;
        }
        isPanning = true;
        startX = event.clientX;
        startY = event.clientY;
        initialScrollLeft = zoomLayer.scrollLeft;
        initialScrollTop = zoomLayer.scrollTop;
        zoomLayer.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (event) => {
        if (!isPanning) {
            return;
        }
        zoomLayer.scrollLeft = initialScrollLeft - (event.clientX - startX);
        zoomLayer.scrollTop = initialScrollTop - (event.clientY - startY);
    });

    window.addEventListener("mouseup", () => {
        isPanning = false;
        syncToolButtons();
    });

    zoomLayer.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]")) {
            return;
        }
        if (activeTool === "select") {
            clearSelectedNode();
        }
        createNodeAtPointer(event);
    });

    zoomLayer.addEventListener("wheel", (event) => {
        if (!event.ctrlKey) {
            return;
        }
        event.preventDefault();
        currentScale = event.deltaY < 0
            ? Math.min(2, Number((currentScale + 0.1).toFixed(2)))
            : Math.max(0.5, Number((currentScale - 0.1).toFixed(2)));
        applyScale();
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
        if (!selectedNode) {
            return;
        }
        if (event.target instanceof HTMLElement) {
            const tagName = event.target.tagName.toLowerCase();
            if (tagName === "input" || tagName === "textarea" || event.target.isContentEditable) {
                return;
            }
        }

        const step = event.shiftKey ? 10 : 2;
        let deltaX = 0;
        let deltaY = 0;

        if (event.key === "ArrowUp") {
            deltaY = -step;
        } else if (event.key === "ArrowDown") {
            deltaY = step;
        } else if (event.key === "ArrowLeft") {
            deltaX = -step;
        } else if (event.key === "ArrowRight") {
            deltaX = step;
        } else {
            return;
        }

        event.preventDefault();
        moveNodeByDelta(selectedNode, deltaX, deltaY);
    });

    getNodes().forEach(bindNodeInteractions);

    nodeLabelInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        const titleElement = selectedNode.querySelector("[data-node-title]");
        if (titleElement) {
            titleElement.textContent = nodeLabelInput.value;
        }
        if (selectedNodeName) {
            selectedNodeName.textContent = nodeLabelInput.value;
        }
        updateLinePaths();
    });

    nodeSubLabelInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        const subtitleElement = selectedNode.querySelector("[data-node-subtitle]");
        if (subtitleElement) {
            subtitleElement.textContent = nodeSubLabelInput.value;
        }
        updateLinePaths();
    });

    fillColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.fillColor) {
                return;
            }
            selectedNode.dataset.fillColor = button.dataset.fillColor;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    strokeWidthInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        selectedNode.dataset.strokeWidth = strokeWidthInput.value;
        applyNodeAppearance(selectedNode);
        if (strokeWidthValue) {
            strokeWidthValue.textContent = `${strokeWidthInput.value}px`;
        }
    });

    strokeStyleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.strokeStyle) {
                return;
            }
            selectedNode.dataset.strokeStyle = button.dataset.strokeStyle;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    spaceGroups.forEach(bindGroupInteractions);

    const initialDiagramButton = diagramRoot.querySelector("[data-space-diagram].bg-secondary\\/10")
        ?? diagramRoot.querySelector("[data-space-diagram]");
    if (initialDiagramButton instanceof HTMLElement) {
        setActiveDiagramButton(initialDiagramButton);
    }

    if (spacesAction instanceof HTMLElement && spacesScroll instanceof HTMLElement) {
        spacesAction.addEventListener("click", () => {
            const group = document.createElement("div");
            group.dataset.spaceGroup = "";
            group.dataset.groupExpanded = "true";
            group.className = "group";
            group.innerHTML = `
                <div class="flex items-center gap-2" data-space-group-header>
                    <button class="flex-1 flex items-center gap-2 px-2 py-1.5 text-on-surface hover:bg-surface-variant/50 rounded-lg transition-colors text-left"
                            data-spaces-row
                            data-group-toggle
                            type="button">
                        <span class="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200" data-spaces-expander>expand_more</span>
                        <span class="material-symbols-outlined text-[18px] text-accent-api" data-spaces-primary-icon>folder</span>
                        <span class="font-body-md text-body-md flex-1 truncate font-medium" data-spaces-text data-group-name>New Group ${groupCounter++}</span>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant/60 rounded-lg transition-colors"
                            data-group-add-diagram
                            title="Add diagram"
                            type="button">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>
                <div class="pl-9 pr-2 py-1 space-y-1" data-spaces-children></div>
            `;
            spacesScroll.appendChild(group);
            bindGroupInteractions(group);
            if (spacesPanel.classList.contains("w-0")) {
                setSpacesHidden(false);
            }
        });
    }

    propertiesCloseButton?.addEventListener("click", () => {
        clearSelectedNode();
    });

    setSpacesHidden(true);
    setPropertiesPanelVisible(false);
    applyScale();
    syncToolButtons();
    updateLinePaths();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDiagramPage);
} else {
    initializeDiagramPage();
}
