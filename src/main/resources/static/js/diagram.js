function initializeDiagramPage() {
    const diagramRoot = document.getElementById("diagram-root");
    if (!diagramRoot) {
        return;
    }

    const logic = window.DiagramLogic;
    if (!logic) {
        console.error("DiagramLogic is required before diagram.js");
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
    const propertyTabs = Array.from(diagramRoot.querySelectorAll("[data-property-tab]"));
    const propertyPanels = Array.from(diagramRoot.querySelectorAll("[data-property-panel]"));
    const nodeLabelInput = document.getElementById("diagram-node-label-input");
    const nodeSubLabelInput = document.getElementById("diagram-node-sub-label-input");
    const nodeBadgeInput = document.getElementById("diagram-node-badge-input");
    const badgePositionButtons = Array.from(diagramRoot.querySelectorAll("[data-badge-position]"));
    const linePaths = Array.from(diagramRoot.querySelectorAll("[data-line-from][data-line-to]"));
    const textColorValue = document.getElementById("diagram-text-color-value");
    const textColorButtons = Array.from(diagramRoot.querySelectorAll("[data-text-color]"));
    const textColorPicker = document.getElementById("diagram-text-color-picker");
    const fillColorValue = document.getElementById("diagram-fill-color-value");
    const fillColorButtons = Array.from(diagramRoot.querySelectorAll("[data-fill-color]"));
    const fillColorPicker = document.getElementById("diagram-fill-color-picker");
    const strokeColorValue = document.getElementById("diagram-stroke-color-value");
    const strokeColorButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-color]"));
    const strokeColorPicker = document.getElementById("diagram-stroke-color-picker");
    const strokeWidthInput = document.getElementById("diagram-stroke-width-input");
    const strokeWidthValue = document.getElementById("diagram-stroke-width-value");
    const strokeStyleButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-style]"));

    if (!spacesPanel) {
        return;
    }

    let currentScale = 1;
    let activeTool = "select";
    let selectedNode = null;
    let selectedNodes = [];
    let selectionFrame = null;
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
        if (spacesToggleIcon instanceof HTMLElement) {
            spacesToggleIcon.textContent = "chevron_left";
        }
    };

    window.openDiagramSpaces = () => {
        setSpacesHidden(false);
    };

    spacesToggle?.addEventListener("click", () => {
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

    setSpacesHidden(true);

    if (!zoomLayer || !diagramStage) {
        return;
    }

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
        propertiesPanel.classList.toggle("hidden", !visible);
        propertiesPanel.classList.toggle("w-0", !visible);
        propertiesPanel.classList.toggle("opacity-0", !visible);
        propertiesPanel.classList.toggle("pointer-events-none", !visible);
    };

    const setActivePropertyTab = (tabName) => {
        propertyTabs.forEach((button) => {
            const isActive = button.dataset.propertyTab === tabName;
            button.classList.toggle("diagram-property-tab-active", isActive);
        });
        propertyPanels.forEach((panel) => {
            panel.classList.toggle("hidden", panel.dataset.propertyPanel !== tabName);
        });
    };

    const syncNodeBadge = (node) => {
        const badgeText = (node.dataset.nodeBadgeText ?? "").trim();
        const badgePosition = node.dataset.nodeBadgePosition ?? "right";
        let badge = node.querySelector("[data-node-badge]");

        if (!badgeText) {
            badge?.remove();
            return;
        }

        if (!(badge instanceof HTMLElement)) {
            badge = document.createElement("div");
            badge.dataset.nodeBadge = "";
            node.appendChild(badge);
        }

        badge.textContent = badgeText;
        badge.className = logic.badgeClassName(badgePosition);
    };

    const applyNodeTextAppearance = (node) => {
        const textColor = node.dataset.textColor ?? "";
        node.querySelectorAll("[data-node-title], [data-node-subtitle]").forEach((element) => {
            if (!(element instanceof HTMLElement)) {
                return;
            }
            element.style.color = textColor;
        });
    };

    const updateSelectionPanel = (node) => {
        const title = node.querySelector("[data-node-title]")?.textContent?.trim() ?? "";
        const subtitle = node.querySelector("[data-node-subtitle]")?.textContent?.trim() ?? "";
        const badgeText = node.dataset.nodeBadgeText ?? "";
        const badgePosition = node.dataset.nodeBadgePosition ?? "right";
        const textColor = node.dataset.textColor ?? "";
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeColor = node.dataset.strokeColor ?? "#C6C6CD";
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
        if (nodeBadgeInput) {
            nodeBadgeInput.value = badgeText;
        }
        badgePositionButtons.forEach((button) => {
            const isActive = button.dataset.badgePosition === badgePosition;
            button.classList.toggle("diagram-align-button-active", isActive);
        });
        if (textColorValue) {
            textColorValue.textContent = textColor || "Default";
        }
        if (textColorPicker instanceof HTMLInputElement && textColor) {
            textColorPicker.value = textColor;
        }
        textColorButtons.forEach((button) => {
            const isActive = (button.dataset.textColor ?? "") === textColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        if (fillColorValue) {
            fillColorValue.textContent = fillColor;
        }
        if (fillColorPicker instanceof HTMLInputElement && fillColor !== "transparent") {
            fillColorPicker.value = fillColor;
        }
        if (strokeColorValue) {
            strokeColorValue.textContent = strokeColor;
        }
        if (strokeColorPicker instanceof HTMLInputElement && strokeColor !== "transparent") {
            strokeColorPicker.value = strokeColor;
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
                icon.classList.toggle("hidden", !isActive);
            }
        });
        strokeColorButtons.forEach((button) => {
            const isActive = button.dataset.strokeColor === strokeColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
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
        const groups = selectedNodes.filter((item) => item.dataset.nodeKind === "group-box");
        if (!groups.length && node.dataset.nodeKind !== "group-box") {
            return;
        }

        const targets = groups.length ? groups : [node];
        targets.forEach((groupNode) => {
            getGroupedChildNodes(groupNode).forEach((item) => {
                item.classList.add("diagram-node-grouped-highlight");
            });
        });
    };

    const setSelectedNodes = (nodes) => {
        const uniqueNodes = nodes.filter((node, index, list) => list.indexOf(node) === index);
        selectedNodes = uniqueNodes;
        selectedNode = uniqueNodes.length === 1 ? uniqueNodes[0] : null;

        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        uniqueNodes.forEach((item) => item.classList.add("diagram-node-selected"));
        getNodes().forEach(applyNodeAppearance);

        if (uniqueNodes.length === 1) {
            syncGroupedNodeHighlights(uniqueNodes[0]);
            updateSelectionPanel(uniqueNodes[0]);
            setActivePropertyTab(uniqueNodes[0].dataset.nodeKind === "shape" ? "shape" : "text");
            setPropertiesPanelVisible(true);
            syncSelectionFrame();
        } else {
            getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
            uniqueNodes
                .filter((item) => item.dataset.nodeKind === "group-box")
                .forEach((groupNode) => {
                    getGroupedChildNodes(groupNode).forEach((child) => {
                        child.classList.add("diagram-node-grouped-highlight");
                    });
                });
            setPropertiesPanelVisible(false);
            syncSelectionFrame();
        }
    };

    const setSelectedNode = (node) => {
        setSelectedNodes([node]);
    };

    const clearSelectedNode = () => {
        selectedNodes = [];
        selectedNode = null;
        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        getNodes().forEach(applyNodeAppearance);
        syncSelectionFrame();
        setPropertiesPanelVisible(false);
    };

    const applyNodeAppearance = (node) => {
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeColor = node.dataset.strokeColor ?? (node.dataset.nodeKind === "group-box" ? "#8FD5B7" : "#C6C6CD");
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const hasVisibleStroke = strokeColor !== "transparent" && Number(strokeWidth) > 0;

        node.style.backgroundColor = fillColor;
        node.style.borderWidth = hasVisibleStroke ? `${strokeWidth}px` : "0px";
        node.style.borderColor = strokeColor;
        node.style.borderStyle = hasVisibleStroke ? strokeStyle : "solid";
        node.style.boxShadow = hasVisibleStroke ? "" : "none";
    };

    const ensureResizeHandle = (node) => {
        node.querySelectorAll("[data-node-resize-handle]").forEach((handle) => handle.remove());
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

    const getStagePoint = (event) => {
        const stageRect = diagramStage.getBoundingClientRect();
        return {
            x: (event.clientX - stageRect.left) / currentScale,
            y: (event.clientY - stageRect.top) / currentScale
        };
    };

    const getNodeBox = (node) => ({
        x: node.offsetLeft,
        y: node.offsetTop,
        width: node.offsetWidth,
        height: node.offsetHeight
    });

    const normalizeBox = logic.normalizeBox;

    const isNodeInsideBox = (node, area) => {
        const box = getNodeBox(node);
        return logic.isBoxInside(box, area);
    };

    const createSelectionBox = () => {
        const box = document.createElement("div");
        box.className = "diagram-selection-box";
        diagramStage.appendChild(box);
        return box;
    };

    const syncSelectionBox = (boxElement, area) => {
        boxElement.style.left = `${area.x}px`;
        boxElement.style.top = `${area.y}px`;
        boxElement.style.width = `${area.width}px`;
        boxElement.style.height = `${area.height}px`;
    };

    const moveNodesByDelta = (nodes, deltaX, deltaY) => {
        const targets = new Map();

        nodes.forEach((node) => {
            targets.set(node.dataset.nodeKey ?? String(targets.size), node);
            if (node.dataset.nodeKind === "group-box") {
                getGroupedChildNodes(node).forEach((child) => {
                    targets.set(child.dataset.nodeKey ?? String(targets.size), child);
                });
            }
        });

        Array.from(targets.values()).forEach((node) => {
            node.style.left = `${node.offsetLeft + deltaX}px`;
            node.style.top = `${node.offsetTop + deltaY}px`;
        });

        Array.from(targets.values()).forEach((node) => {
            if (node.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(node);
            }
        });

        updateLinePaths();
        syncSelectionFrame();
    };

    const moveNodeByDelta = (node, deltaX, deltaY) => {
        moveNodesByDelta([node], deltaX, deltaY);
    };

    const getNodeMinimumSize = (node) => {
        return logic.nodeMinimumSize(node.dataset.nodeKind, node.dataset.shapeType);
    };

    const resizeNodeFromCorner = (node, corner, startBox, currentPoint) => {
        const min = getNodeMinimumSize(node);
        const nextBox = logic.resizeBox(startBox, corner, currentPoint, min, {
            preserveAspect: node.dataset.shapeType === "circle"
        });

        node.style.left = `${nextBox.left}px`;
        node.style.top = `${nextBox.top}px`;
        node.style.width = `${nextBox.width}px`;
        node.style.height = `${nextBox.height}px`;
    };

    let isFrameResizing = false;
    let frameResizeCorner = "se";
    let frameResizeStartBox = null;

    const getOrCreateSelectionFrame = () => {
        if (selectionFrame) {
            return selectionFrame;
        }

        const frame = document.createElement("div");
        frame.className = "diagram-node-selection-frame";
        ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((corner) => {
            const handle = document.createElement("button");
            handle.type = "button";
            handle.dataset.nodeResizeHandle = corner;
            handle.className = `diagram-node-resize-handle diagram-node-resize-handle--${corner}`;
            handle.setAttribute("aria-label", `Resize selected node ${corner}`);
            handle.addEventListener("mousedown", (event) => {
                if (activeTool !== "select" || !selectedNode) {
                    return;
                }

                isFrameResizing = true;
                frameResizeCorner = corner;
                frameResizeStartBox = {
                    left: selectedNode.offsetLeft,
                    top: selectedNode.offsetTop,
                    width: selectedNode.offsetWidth,
                    height: selectedNode.offsetHeight
                };
                event.preventDefault();
                event.stopPropagation();
                document.body.style.userSelect = "none";
            });
            frame.appendChild(handle);
        });

        diagramStage.appendChild(frame);
        selectionFrame = frame;
        return frame;
    };

    const syncSelectionFrame = () => {
        if (!selectedNode || selectedNodes.length !== 1) {
            selectionFrame?.remove();
            selectionFrame = null;
            return;
        }

        const padding = 8;
        const frame = getOrCreateSelectionFrame();
        const stageRect = diagramStage.getBoundingClientRect();
        const nodeRect = selectedNode.getBoundingClientRect();
        frame.style.left = `${(nodeRect.left - stageRect.left) / currentScale - padding}px`;
        frame.style.top = `${(nodeRect.top - stageRect.top) / currentScale - padding}px`;
        frame.style.width = `${nodeRect.width / currentScale + padding * 2}px`;
        frame.style.height = `${nodeRect.height / currentScale + padding * 2}px`;
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
        element.classList.remove("relative");
        element.style.left = `${element.offsetLeft}px`;
        element.style.top = `${element.offsetTop}px`;
        element.style.userSelect = "none";
        element.dataset.fillColor = element.dataset.fillColor ?? (element.dataset.nodeKey === "order-service" ? "#CDE5FF" : "#FFFFFF");
        element.dataset.strokeColor = element.dataset.strokeColor ?? (element.dataset.nodeKind === "group-box" ? "#8FD5B7" : "#C6C6CD");
        element.dataset.strokeWidth = element.dataset.strokeWidth ?? (element.dataset.nodeKey === "order-service" ? "2" : "1");
        element.dataset.strokeStyle = element.dataset.strokeStyle ?? "solid";
        element.dataset.nodeBadgeText = element.dataset.nodeBadgeText ?? (element.querySelector("[data-node-badge]")?.textContent?.trim() ?? "");
        element.dataset.nodeBadgePosition = element.dataset.nodeBadgePosition ?? "right";
        syncNodeBadge(element);
        applyNodeTextAppearance(element);
        applyNodeAppearance(element);
        syncNodeGroupMembership(element);

        element.addEventListener("click", (event) => {
            event.stopPropagation();
            if (hasDragged) {
                hasDragged = false;
                event.preventDefault();
                return;
            }
            setSelectedNode(element);
        });

        let isDragging = false;
        let hasDragged = false;
        let startX = 0;
        let startY = 0;
        let dragSnapshots = [];

        element.addEventListener("mousedown", (event) => {
            if (activeTool !== "select") {
                return;
            }
            if (event.target instanceof HTMLElement && event.target.closest("[data-node-resize-handle]")) {
                return;
            }
            isDragging = true;
            hasDragged = false;
            startX = event.clientX;
            startY = event.clientY;

            if (event.shiftKey || event.ctrlKey || event.metaKey) {
                if (selectedNodes.includes(element)) {
                    const nextSelection = selectedNodes.filter((node) => node !== element);
                    setSelectedNodes(nextSelection.length ? nextSelection : [element]);
                } else {
                    setSelectedNodes([...selectedNodes, element]);
                }
            } else if (!selectedNodes.includes(element)) {
                setSelectedNode(element);
            }

            dragSnapshots = (selectedNodes.includes(element) ? selectedNodes : [element]).map((node) => ({
                element: node,
                initialLeft: node.offsetLeft,
                initialTop: node.offsetTop
            }));

            selectedNodes
                .filter((node) => node.dataset.nodeKind === "group-box")
                .forEach((groupNode) => {
                    getGroupedChildNodes(groupNode).forEach((child) => {
                        if (!dragSnapshots.some((item) => item.element === child)) {
                            dragSnapshots.push({
                                element: child,
                                initialLeft: child.offsetLeft,
                                initialTop: child.offsetTop
                            });
                        }
                    });
                });

            if (element.dataset.nodeKind === "group-box" && !selectedNodes.includes(element)) {
                getGroupedChildNodes(element).forEach((child) => {
                    if (!dragSnapshots.some((item) => item.element === child)) {
                        dragSnapshots.push({
                            element: child,
                            initialLeft: child.offsetLeft,
                            initialTop: child.offsetTop
                        });
                    }
                });
            }

            event.preventDefault();
            event.stopPropagation();
            document.body.style.userSelect = "none";
        });

        window.addEventListener("mousemove", (event) => {
            if (!isDragging) {
                return;
            }
            const deltaX = (event.clientX - startX) / currentScale;
            const deltaY = (event.clientY - startY) / currentScale;
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                hasDragged = true;
            }
            dragSnapshots.forEach((item) => {
                item.element.style.left = `${item.initialLeft + deltaX}px`;
                item.element.style.top = `${item.initialTop + deltaY}px`;
            });
            updateLinePaths();
            syncSelectionFrame();
        });

        window.addEventListener("mouseup", () => {
            if (isDragging && dragSnapshots.length) {
                dragSnapshots.forEach((item) => {
                    if (item.element.dataset.nodeKind !== "group-box") {
                        syncNodeGroupMembership(item.element);
                    }
                });
            }
            isDragging = false;
            document.body.style.userSelect = "";
            if (!hasDragged && element.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(element);
            }
            dragSnapshots = [];
            syncSelectionFrame();
        });
    };

    const shapeTools = ["rectangle", "circle", "diamond"];
    const isShapeTool = (tool) => shapeTools.includes(tool);

    const createNodeMarkup = (tool) => {
        const node = document.createElement("div");
        node.dataset.diagramNode = "";
        node.dataset.nodeKey = `generated-${tool}-${++nodeCounter}`;

        if (tool === "rectangle" || tool === "circle" || tool === "diamond") {
            const title = tool === "rectangle"
                ? "Rectangle"
                : (tool === "circle" ? "Circle" : "Diamond");
            const shapeClass = tool === "rectangle"
                ? "diagram-shape-rectangle w-40 h-28"
                : (tool === "circle" ? "diagram-shape-circle w-32 h-32" : "diagram-shape-diamond w-28 h-28");

            node.dataset.nodeKind = "shape";
            node.dataset.shapeType = tool;
            node.dataset.fillColor = "#FFFFFF";
            node.dataset.strokeColor = "#C6C6CD";
            node.dataset.strokeWidth = "2";
            node.dataset.strokeStyle = "solid";
            node.dataset.textColor = "";
            node.className = `absolute ${shapeClass} bg-surface-white border border-outline-variant shadow-sm cursor-move z-10`;
            node.innerHTML = `
                <span class="hidden" data-node-title>${title}</span>
                <span class="hidden" data-node-subtitle">Shape</span>
            `;
            return node;
        }

        let icon = "rectangle";
        let title = "Service Node";
        let subtitle = "New Component";
        let shapeClass = "rounded-xl";
        let widthClass = "w-48";
        let extraClass = "";

        if (tool === "text") {
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
            node.dataset.strokeColor = "#8FD5B7";
            node.dataset.strokeWidth = "1";
            node.dataset.strokeStyle = "dashed";
            node.dataset.textColor = "";
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

    const placeNodeAtPoint = (node, point) => {
        diagramStage.appendChild(node);
        const offsetLeft = node.offsetWidth / 2;
        const offsetTop = node.offsetHeight / 2;
        node.style.left = `${Math.max(24, point.x - offsetLeft)}px`;
        node.style.top = `${Math.max(24, point.y - offsetTop)}px`;
        bindNodeInteractions(node);
        syncNodeGroupMembership(node);
        setSelectedNode(node);
    };

    const createNodeAtPointer = (event) => {
        if (activeTool === "select") {
            return;
        }
        const point = getStagePoint(event);
        const node = createNodeMarkup(activeTool);
        placeNodeAtPoint(node, point);
        activeTool = "select";
        syncToolButtons();
    };

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
    let isSelecting = false;
    let selectionStart = null;
    let selectionBox = null;
    let selectionMoved = false;
    let suppressCanvasClick = false;
    let drawingShape = null;
    let suppressShapeClick = false;
    let startX = 0;
    let startY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;

    const syncDrawingShape = (node, start, end) => {
        const area = normalizeBox(start, end);
        const width = Math.max(1, area.width);
        const height = Math.max(1, area.height);
        node.style.left = `${area.x}px`;
        node.style.top = `${area.y}px`;
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
    };

    zoomLayer.addEventListener("mousedown", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]")) {
            return;
        }
        if (isShapeTool(activeTool) && event.button === 0) {
            const point = getStagePoint(event);
            const node = createNodeMarkup(activeTool);
            node.classList.add("diagram-node-drawing");
            diagramStage.appendChild(node);
            syncDrawingShape(node, point, point);
            drawingShape = {
                node,
                tool: activeTool,
                start: point,
                moved: false
            };
            clearSelectedNode();
            event.preventDefault();
            return;
        }
        if (activeTool !== "select") {
            return;
        }

        if (event.altKey || event.button === 1) {
            isPanning = true;
            startX = event.clientX;
            startY = event.clientY;
            initialScrollLeft = zoomLayer.scrollLeft;
            initialScrollTop = zoomLayer.scrollTop;
            zoomLayer.style.cursor = "grabbing";
            event.preventDefault();
            return;
        }

        if (event.button !== 0) {
            return;
        }

        isSelecting = true;
        selectionMoved = false;
        selectionStart = getStagePoint(event);
        selectionBox = createSelectionBox();
        syncSelectionBox(selectionBox, normalizeBox(selectionStart, selectionStart));
        startX = event.clientX;
        startY = event.clientY;
        event.preventDefault();
    });

    window.addEventListener("mousemove", (event) => {
        if (isFrameResizing && selectedNode && frameResizeStartBox) {
            resizeNodeFromCorner(selectedNode, frameResizeCorner, frameResizeStartBox, getStagePoint(event));
            if (selectedNode.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(selectedNode);
            } else {
                syncGroupedNodeHighlights(selectedNode);
            }
            updateLinePaths();
            syncSelectionFrame();
            return;
        }

        if (drawingShape) {
            const currentPoint = getStagePoint(event);
            const area = normalizeBox(drawingShape.start, currentPoint);
            drawingShape.moved = area.width > 4 || area.height > 4;
            syncDrawingShape(drawingShape.node, drawingShape.start, currentPoint);
            return;
        }

        if (isSelecting && selectionStart && selectionBox) {
            const currentPoint = getStagePoint(event);
            const area = normalizeBox(selectionStart, currentPoint);
            selectionMoved = area.width > 4 || area.height > 4;
            syncSelectionBox(selectionBox, area);
            if (selectionMoved) {
                const nodes = getNodes().filter((node) => isNodeInsideBox(node, area));
                setSelectedNodes(nodes);
            }
            return;
        }

        if (isPanning) {
            zoomLayer.scrollLeft = initialScrollLeft - (event.clientX - startX);
            zoomLayer.scrollTop = initialScrollTop - (event.clientY - startY);
        }
    });

    window.addEventListener("mouseup", () => {
        if (isFrameResizing) {
            isFrameResizing = false;
            frameResizeStartBox = null;
            document.body.style.userSelect = "";
            syncSelectionFrame();
        }

        if (drawingShape) {
            const { node, start, moved } = drawingShape;
            if (!moved) {
                node.classList.remove("diagram-node-drawing");
                node.style.width = "";
                node.style.height = "";
                placeNodeAtPoint(node, start);
            } else {
                node.classList.remove("diagram-node-drawing");
                bindNodeInteractions(node);
                syncNodeGroupMembership(node);
                setSelectedNode(node);
            }
            drawingShape = null;
            suppressShapeClick = true;
            activeTool = "select";
            syncToolButtons();
        }

        if (isSelecting) {
            if (!selectionMoved) {
                clearSelectedNode();
            } else {
                suppressCanvasClick = true;
            }
            selectionBox?.remove();
            selectionBox = null;
            selectionStart = null;
            isSelecting = false;
        }
        isPanning = false;
        syncToolButtons();
    });

    zoomLayer.addEventListener("click", (event) => {
        if (suppressShapeClick) {
            suppressShapeClick = false;
            return;
        }
        if (suppressCanvasClick) {
            suppressCanvasClick = false;
            return;
        }
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
        const activeNodes = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (!activeNodes.length) {
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
        moveNodesByDelta(activeNodes, deltaX, deltaY);
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

    textColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode) {
                return;
            }
            selectedNode.dataset.textColor = button.dataset.textColor ?? "";
            applyNodeTextAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    textColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(textColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.textColor = textColorPicker.value;
        applyNodeTextAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    nodeBadgeInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        selectedNode.dataset.nodeBadgeText = nodeBadgeInput.value.trim();
        syncNodeBadge(selectedNode);
        syncSelectionFrame();
    });

    badgePositionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.badgePosition) {
                return;
            }
            selectedNode.dataset.nodeBadgePosition = button.dataset.badgePosition;
            syncNodeBadge(selectedNode);
            updateSelectionPanel(selectedNode);
        });
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

    fillColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(fillColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.fillColor = fillColorPicker.value;
        applyNodeAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    strokeColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.strokeColor) {
                return;
            }
            selectedNode.dataset.strokeColor = button.dataset.strokeColor;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    strokeColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(strokeColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.strokeColor = strokeColorPicker.value;
        applyNodeAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
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

    propertyTabs.forEach((button) => {
        button.addEventListener("click", () => {
            setActivePropertyTab(button.dataset.propertyTab ?? "text");
        });
    });

    setPropertiesPanelVisible(false);
    setActivePropertyTab("text");
    applyScale();
    syncToolButtons();
    updateLinePaths();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDiagramPage);
} else {
    initializeDiagramPage();
}
