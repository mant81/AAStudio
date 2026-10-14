(() => {
    const editor = document.getElementById("db-schema-editor");
    const editorView = document.getElementById("db-editor-view");
    const erdView = document.getElementById("db-erd-view");
    const sidebarEditor = document.getElementById("db-sidebar-editor");
    const sidebarEditorHost = document.getElementById("db-sidebar-editor-host");
    const sidebarEditorGutter = document.getElementById("db-sidebar-editor-gutter");
    const sidebarEditorHighlight = document.getElementById("db-sidebar-editor-highlight");
    const objectExplorer = document.getElementById("db-object-explorer");
    const sidebarEditorStatus = document.getElementById("db-sidebar-editor-status");
    const sidebarEditorStatusMessage = document.getElementById("db-sidebar-editor-status-message");
    const sidebarEditorPosition = document.getElementById("db-sidebar-editor-position");
    const editorStatus = document.getElementById("db-editor-status");
    const inputType = document.getElementById("db-editor-input-type");
    const canvas = document.getElementById("canvas-pan-area");
    const erdCanvas = document.getElementById("erd-canvas");
    const linesLayer = document.getElementById("erd-lines");
    const erdGrid = document.getElementById("erd-grid");
    const erdZoomValue = document.getElementById("erd-zoom-value");
    const secondarySidebar = document.getElementById("secondary-sidebar");
    const secondarySidebarToggle = document.getElementById("secondary-sidebar-toggle");
    const sidebar_resize_handle = document.getElementById("db-sidebar-resize-handle");
    const objectSearch = document.getElementById("db-object-search");
    const newTableButton = document.getElementById("db-new-table-button");
    const currentSchemaButton = document.getElementById("db-current-schema-button");
    const currentSchemaName = document.getElementById("db-current-schema-name");
    const schemaMenu = document.getElementById("db-schema-menu");
    const schemaOptions = document.getElementById("db-schema-options");
    const schemaAddButton = document.getElementById("db-schema-add-button");
    const dbSaveStatus = document.getElementById("db-save-status");
    const dbSaveStatusIcon = document.getElementById("db-save-status-icon");
    const dbSaveStatusText = document.getElementById("db-save-status-text");
    const sample = `Table users {
  id int [pk]
  email varchar
  created_at timestamp
}

Table orders {
  id bigint [pk]
  user_id int
  status varchar
}

Ref: orders.user_id > users.id`;
    const currentProjectId = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("aastudio.currentProject="))
        ?.split("=")
        .slice(1)
        .join("=");
    const categoryStorageKey = `aastudio-db-modeling-category:${decodeURIComponent(currentProjectId || "project-1")}`;
    let dbCategoryId = localStorage.getItem(categoryStorageKey) || "ecommerce";
    let storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${dbCategoryId}`;
    let dbCategories = [];
    let schema = { tables: [], refs: [] };
    let parseTimer = null;
    let serverSaveTimer = null;
    const sidebar_width_key = "aastudio-db-sidebar-width";
    let erdTool = "select";
    let erdZoom = 1;
    let erdPanX = 0;
    let erdPanY = 0;
    let erdPositions = {};

    const parseErdLayout = (value) => {
        if (value && typeof value === "object") return value;
        if (typeof value !== "string" || !value.trim()) return {};
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            console.warn("ERD 좌표 복원에 실패했습니다.", error);
            return {};
        }
    };

    const renderSchemaOptions = () => {
        if (!(schemaOptions instanceof HTMLElement)) return;
        schemaOptions.replaceChildren();
        dbCategories.forEach((category) => {
            const option = document.createElement("button");
            option.className = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-on-surface-variant hover:bg-surface-variant transition-colors";
            option.type = "button";
            option.setAttribute("role", "menuitem");
            option.innerHTML = `<span class="material-symbols-outlined text-[18px]">${category.categoryId === dbCategoryId ? "radio_button_checked" : "radio_button_unchecked"}</span><span class="truncate">${escapeHtml(category.categoryName)}</span>`;
            option.addEventListener("click", () => loadCategory(category.categoryId));
            schemaOptions.appendChild(option);
        });
    };

    const closeSchemaMenu = () => {
        schemaMenu?.classList.add("hidden");
        currentSchemaButton?.setAttribute("aria-expanded", "false");
    };

    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const unquote = (value) => String(value ?? "")
        .trim()
        .split(".")
        .map((part) => part.trim().replace(/^([`"\[])(.*)([`"\]])$/, "$2").trim())
        .join(".");

    const setStatus = (message, isError = false) => {
        if (editorStatus) {
            editorStatus.textContent = message;
            editorStatus.classList.toggle("text-error", isError);
        }
        if (sidebarEditorStatus) {
            if (sidebarEditorStatusMessage) sidebarEditorStatusMessage.textContent = message;
            else sidebarEditorStatus.textContent = message;
            sidebarEditorStatus.classList.toggle("text-error", isError);
        }
    };

    const setDbSaveStatus = (state, message) => {
        if (!(dbSaveStatus instanceof HTMLElement)) return;
        const states = {
            pending: { icon: "cloud_upload", className: "text-on-surface-variant", label: "저장 중" },
            saved: { icon: "cloud_done", className: "text-secondary", label: "저장됨" },
            error: { icon: "cloud_off", className: "text-error", label: "저장 실패" }
        };
        const current = states[state] || states.pending;
        if (dbSaveStatusIcon) {
            dbSaveStatusIcon.textContent = current.icon;
            dbSaveStatusIcon.className = `material-symbols-outlined text-[14px] ${current.className}`;
        }
        if (dbSaveStatusText) dbSaveStatusText.textContent = message || current.label;
        dbSaveStatus.classList.toggle("text-error", state === "error");
        dbSaveStatus.classList.toggle("text-secondary", state === "saved");
    };

    const applyErdViewport = () => {
        const transform = `translate(${erdPanX}px, ${erdPanY}px) scale(${erdZoom})`;
        canvas?.style.setProperty("transform", transform);
        linesLayer?.style.setProperty("transform", transform);
        canvas?.style.setProperty("transform-origin", "0 0");
        linesLayer?.style.setProperty("transform-origin", "0 0");
        if (erdZoomValue) erdZoomValue.textContent = `${Math.round(erdZoom * 100)}%`;
    };

    const setErdTool = (tool) => {
        erdTool = tool;
        document.querySelectorAll("[data-erd-tool]").forEach((button) => {
            const active = button.dataset.erdTool === tool;
            button.classList.toggle("bg-secondary/10", active);
            button.classList.toggle("text-secondary", active);
            button.classList.toggle("text-on-surface-variant", !active);
        });
        erdCanvas?.classList.toggle("is-pan-tool", tool === "pan");
    };

    const updateEditorGutter = () => {
        if (!(editor instanceof HTMLTextAreaElement) || !(sidebarEditorGutter instanceof HTMLElement)) return;
        const lineCount = Math.max(1, editor.value.split("\n").length);
        const line = editor.value.slice(0, editor.selectionStart).split("\n").length;
        sidebarEditorGutter.replaceChildren(...Array.from({ length: lineCount }, (_, index) => {
            const number = document.createElement("span");
            number.textContent = String(index + 1);
            number.className = index + 1 === line ? "is-active" : "";
            return number;
        }));
        sidebarEditorGutter.scrollTop = editor.scrollTop;
        const lineStart = editor.value.lastIndexOf("\n", Math.max(0, editor.selectionStart - 1)) + 1;
        if (sidebarEditorPosition) sidebarEditorPosition.textContent = `Ln ${line}, Col ${editor.selectionStart - lineStart + 1}`;
    };

    const highlightDbml = (text) => {
        if (!(sidebarEditorHighlight instanceof HTMLElement)) return;
        const cursorIndex = editor instanceof HTMLTextAreaElement ? editor.selectionStart : 0;
        const hasSelection = editor instanceof HTMLTextAreaElement && editor.selectionStart !== editor.selectionEnd;
        const beforeCursor = String(text ?? "").slice(0, cursorIndex);
        const afterCursor = String(text ?? "").slice(cursorIndex);
        const leftWord = beforeCursor.match(/[A-Za-z_][\w$.-]*$/)?.[0] ?? "";
        const rightWord = afterCursor.match(/^[A-Za-z_][\w$.-]*/)?.[0] ?? "";
        const activeWord = hasSelection ? "" : `${leftWord}${rightWord}`;
        const tokenPattern = /(\/\/.*$|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\[[^\]]+\]|\b(?:Table|Ref|Note|TableGroup|indexes)\b|\b(?:integer|int|bigint|smallint|varchar|char|text|boolean|date|timestamp|datetime|uuid|decimal|float|json|jsonb)\b|\b[A-Za-z_][\w$.-]*\b)/gim;
        const lines = String(text ?? "").split("\n");
        sidebarEditorHighlight.innerHTML = lines.map((line) => {
            let result = "";
            let lastIndex = 0;
            line.replace(tokenPattern, (token, _match, offset) => {
                result += escapeHtml(line.slice(lastIndex, offset));
                const escaped = escapeHtml(token);
                let className = "db-token-plain";
                if (/^\/\//.test(token)) className = "db-token-comment";
                else if (/^['"]/.test(token)) className = "db-token-string";
                else if (/^\[/.test(token)) className = "db-token-attribute";
                else if (/^(Table|Ref|Note|TableGroup|indexes)$/i.test(token)) className = "db-token-keyword";
                else if (/^(integer|int|bigint|smallint|varchar|char|text|boolean|date|timestamp|datetime|uuid|decimal|float|json|jsonb)$/i.test(token)) className = "db-token-type";
                if (activeWord && token === activeWord && /^[A-Za-z_][\w$.-]*$/.test(token)) className += " db-token-match";
                result += `<span class="${className}">${escaped}</span>`;
                lastIndex = offset + token.length;
                return token;
            });
            result += escapeHtml(line.slice(lastIndex));
            return `${result || " "}<br>`;
        }).join("");
        sidebarEditorHighlight.scrollTop = editor.scrollTop;
        sidebarEditorHighlight.scrollLeft = editor.scrollLeft;
    };

    const splitTopLevel = (value, separator = ",") => {
        const parts = [];
        let start = 0;
        let depth = 0;
        let quote = "";
        for (let index = 0; index < value.length; index += 1) {
            const char = value[index];
            if (quote) {
                if (char === quote && value[index - 1] !== "\\") quote = "";
                continue;
            }
            if (char === "'" || char === '"' || char === "`") {
                quote = char;
            } else if (char === "(") {
                depth += 1;
            } else if (char === ")") {
                depth = Math.max(0, depth - 1);
            } else if (char === separator && depth === 0) {
                parts.push(value.slice(start, index).trim());
                start = index + 1;
            }
        }
        const tail = value.slice(start).trim();
        if (tail) parts.push(tail);
        return parts;
    };

    const findClosing = (text, openingIndex, openChar, closeChar) => {
        let depth = 0;
        let quote = "";
        for (let index = openingIndex; index < text.length; index += 1) {
            const char = text[index];
            if (quote) {
                if (char === quote && text[index - 1] !== "\\") quote = "";
                continue;
            }
            if (char === "'" || char === '"' || char === "`") {
                quote = char;
            } else if (char === openChar) {
                depth += 1;
            } else if (char === closeChar) {
                depth -= 1;
                if (depth === 0) return index;
            }
        }
        return -1;
    };

    const normalizeType = (value) => {
        const match = String(value).trim().match(/^[A-Za-z][\w]*(?:\s+(?:varying|precision))?(?:\s*\([^)]*\))?/i);
        return match ? match[0].replace(/\s+/g, " ") : "text";
    };

    const ensureTable = (tables, name) => {
        const existing = tables.find((table) => table.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;
        const table = { name, columns: [], comment: "" };
        tables.push(table);
        return table;
    };

    const addColumn = (table, column) => {
        const existing = table.columns.find((item) => item.name.toLowerCase() === column.name.toLowerCase());
        if (existing) {
            Object.assign(existing, column);
        } else {
            table.columns.push(column);
        }
    };

    const uniqueReferences = (refs) => refs.filter((ref, index, all) => index === all.findIndex((item) => (
        item.fromTable.toLowerCase() === ref.fromTable.toLowerCase()
        && item.fromColumn.toLowerCase() === ref.fromColumn.toLowerCase()
        && item.toTable.toLowerCase() === ref.toTable.toLowerCase()
        && item.toColumn.toLowerCase() === ref.toColumn.toLowerCase()
    )));

    const parseDdl = (text) => {
        const cleaned = text
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/--[^\r\n]*/g, "");
        const tables = [];
        const refs = [];
        const tablePattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(/gi;
        let tableMatch;
        while ((tableMatch = tablePattern.exec(cleaned))) {
            const table = ensureTable(tables, unquote(tableMatch[1]));
            const close = findClosing(cleaned, tableMatch.index + tableMatch[0].lastIndexOf("("), "(", ")");
            if (close < 0) continue;
            const body = cleaned.slice(tableMatch.index + tableMatch[0].length, close);
            splitTopLevel(body).forEach((definition) => {
                const foreign = definition.match(/(?:constraint\s+[^\s]+\s+)?foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)\s*\(([^)]+)\)/i);
                if (foreign) {
                    refs.push({ fromTable: table.name, fromColumn: unquote(foreign[1].split(",")[0]), toTable: unquote(foreign[2]), toColumn: unquote(foreign[3].split(",")[0]) });
                    return;
                }
                const primary = definition.match(/^primary\s+key\s*\(([^)]+)\)/i);
                if (primary) {
                    primary[1].split(",").map(unquote).forEach((name) => {
                        const column = table.columns.find((item) => item.name.toLowerCase() === name.toLowerCase());
                        if (column) column.pk = true;
                    });
                    return;
                }
                if (/^(unique|check|constraint|key|index)\b/i.test(definition)) return;
                const columnMatch = definition.match(/^([`"\[][^`"\]]+[\]"`]|[A-Za-z_][\w$]*)\s+(.+)$/s);
                if (!columnMatch) return;
                const name = unquote(columnMatch[1]);
                const rest = columnMatch[2];
                const inlineRef = rest.match(/references\s+([^\s(]+)\s*\(([^)]+)\)/i);
                if (inlineRef) {
                    refs.push({ fromTable: table.name, fromColumn: name, toTable: unquote(inlineRef[1]), toColumn: unquote(inlineRef[2].split(",")[0]) });
                }
                const pk = /\bprimary\s+key\b/i.test(rest);
                addColumn(table, { name, type: normalizeType(rest), pk, nullable: !pk && !/\bnot\s+null\b/i.test(rest) });
            });
            tableMatch.lastIndex = close + 1;
        }
        const alterReferencePattern = /alter\s+table\s+([^\s]+)[\s\S]*?foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)\s*\(([^)]+)\)/gi;
        let alterReference;
        while ((alterReference = alterReferencePattern.exec(cleaned))) {
            refs.push({
                fromTable: unquote(alterReference[1]),
                fromColumn: unquote(alterReference[2].split(",")[0]),
                toTable: unquote(alterReference[3]),
                toColumn: unquote(alterReference[4].split(",")[0])
            });
        }
        return { tables, refs: uniqueReferences(refs) };
    };

    const parseDbml = (text) => {
        const notes = [];
        const notePattern = /note\s+([`"\w.-]+(?:\.[`"\w.-]+)?)\s*\{([\s\S]*?)\}/gi;
        let noteMatch;
        while ((noteMatch = notePattern.exec(text))) {
            const valueMatch = noteMatch[2].match(/(?:value\s*:\s*)?['"]([\s\S]*?)['"]/i);
            if (valueMatch) notes.push({ target: unquote(noteMatch[1]), text: valueMatch[1].trim() });
        }
        const cleaned = text.replace(/\/\/[^\r\n]*/g, "");
        const tables = [];
        const refs = [];
        const tablePattern = /table\s+([`"\w.-]+)\s*\{/gi;
        let tableMatch;
        while ((tableMatch = tablePattern.exec(cleaned))) {
            const close = findClosing(cleaned, tableMatch.index + tableMatch[0].lastIndexOf("{"), "{", "}");
            if (close < 0) continue;
            const table = ensureTable(tables, unquote(tableMatch[1]));
            const body = cleaned.slice(tableMatch.index + tableMatch[0].length, close);
            body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
                const columnMatch = line.match(/^([`"\w.-]+)\s+([^\s\[]+(?:\s+(?:varying|precision))?(?:\([^)]*\))?)(?:\s*\[([^\]]+)\])?/i);
                if (!columnMatch) return;
                const attributes = columnMatch[3] ?? "";
                const pk = /\bpk\b/i.test(attributes);
                const inlineNote = attributes.match(/note\s*:\s*['"]([^'"]*)['"]/i)?.[1] ?? "";
                addColumn(table, { name: unquote(columnMatch[1]), type: columnMatch[2], pk, nullable: !pk && !/not null/i.test(attributes), comment: inlineNote });
                const inlineRef = attributes.match(/ref\s*:\s*[<>-]\s*([^.\s\]]+)\.([^\s\]]+)/i);
                if (inlineRef) {
                    refs.push({ fromTable: table.name, fromColumn: unquote(columnMatch[1]), toTable: unquote(inlineRef[1]), toColumn: unquote(inlineRef[2]) });
                }
            });
            tableMatch.lastIndex = close + 1;
        }
        notes.forEach((note) => {
            const separator = note.target.lastIndexOf(".");
            if (separator < 0) {
                ensureTable(tables, note.target).comment = note.text;
                return;
            }
            const table = tables.find((item) => item.name.toLowerCase() === note.target.slice(0, separator).toLowerCase());
            const column = table?.columns.find((item) => item.name.toLowerCase() === note.target.slice(separator + 1).toLowerCase());
            if (column) column.comment = note.text;
        });
        const refPattern = /ref\s*:\s*([^.\s]+)\.([^\s]+)\s*(?:>|<|-)\s*([^.\s]+)\.([^\s]+)/gi;
        let refMatch;
        while ((refMatch = refPattern.exec(cleaned))) {
            refs.push({ fromTable: unquote(refMatch[1]), fromColumn: unquote(refMatch[2]), toTable: unquote(refMatch[3]), toColumn: unquote(refMatch[4]) });
        }
        return { tables, refs: uniqueReferences(refs) };
    };

    const parseSchema = (text) => /create\s+table/i.test(text) ? parseDdl(text) : parseDbml(text);

    const setInputType = (text) => {
        const ddl = /create\s+table/i.test(text);
        if (inputType) inputType.textContent = ddl ? "DDL" : "DBML";
    };

    const renderSidebar = () => {
        const tableCount = document.querySelector("#secondary-sidebar .group .text-on-surface-variant.font-code-sm");
        if (tableCount) tableCount.textContent = String(schema.tables.length);
        const list = document.querySelector('#secondary-sidebar .group [class~="space-y-0.5"]');
        if (!(list instanceof HTMLElement)) return;
        list.replaceChildren();
        schema.tables.forEach((table, index) => {
            const row = document.createElement("button");
            row.className = `flex w-full items-center gap-2 rounded-lg border-l-2 px-2 py-1.5 text-left font-code-sm text-code-sm transition-colors ${index === 0 ? "border-secondary bg-secondary/5 text-secondary" : "border-transparent text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"}`;
            row.type = "button";
            row.dataset.dbTableRow = "";
            row.dataset.tableName = table.name.toLowerCase();
            row.innerHTML = `<span class="material-symbols-outlined text-[16px]">table</span><span class="truncate">${escapeHtml(table.name)}</span>`;
            row.addEventListener("click", () => {
                setMode("erd");
                window.requestAnimationFrame(() => document.querySelector(`[data-erd-table="${CSS.escape(table.name)}"]`)?.scrollIntoView({ block: "center", inline: "center" }));
            });
            list.appendChild(row);
        });
    };

    const renderErdLegacy = () => {
        if (!(canvas instanceof HTMLElement) || !(linesLayer instanceof SVGElement)) return;
        canvas.replaceChildren();
        linesLayer.replaceChildren();
        const positions = new Map();
        const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(schema.tables.length || 1))));
        schema.tables.forEach((table, index) => {
            const node = document.createElement("article");
            const x = 48 + (index % columns) * 300;
            const y = 48 + Math.floor(index / columns) * 230;
            node.className = "absolute w-60 overflow-hidden rounded-xl border border-outline-variant bg-surface-white shadow-md transition-shadow hover:shadow-xl";
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.dataset.erdTable = table.name;
            const rows = table.columns.map((column) => `<div class="flex items-center justify-between gap-3 border-t border-surface-container px-3 py-2 text-xs"><span class="flex min-w-0 items-center gap-1.5 truncate text-on-surface ${column.pk ? "font-semibold" : ""}">${column.pk ? '<span class="material-symbols-outlined text-[13px] text-accent-logic">key</span>' : '<span class="w-[13px]"></span>'}<span class="truncate">${escapeHtml(column.name)}</span></span><span class="shrink-0 font-code-sm text-[10px] text-on-surface-variant">${escapeHtml(column.type)}</span></div>`).join("");
            node.innerHTML = `<header class="flex items-center gap-2 bg-surface-container px-3 py-2.5 text-on-surface"><span class="material-symbols-outlined text-[17px] text-accent-db">table</span><span class="font-code-sm text-code-sm font-semibold">${escapeHtml(table.name)}</span></header><div>${rows || '<div class="px-3 py-3 text-xs text-on-surface-variant">컬럼 없음</div>'}</div>`;
            canvas.appendChild(node);
            positions.set(table.name.toLowerCase(), node);
        });
        schema.refs.forEach((ref) => {
            const from = positions.get(ref.fromTable.toLowerCase());
            const to = positions.get(ref.toTable.toLowerCase());
            if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement)) return;
            const startX = from.offsetLeft + from.offsetWidth;
            const startY = from.offsetTop + Math.min(from.offsetHeight / 2, 70);
            const endX = to.offsetLeft;
            const endY = to.offsetTop + Math.min(to.offsetHeight / 2, 70);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "currentColor");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("stroke-dasharray", "4 4");
            path.classList.add("text-secondary");
            linesLayer.appendChild(path);
        });
    };

    const renderErd = () => {
        if (!(canvas instanceof HTMLElement) || !(linesLayer instanceof SVGElement)) return;
        canvas.replaceChildren();
        linesLayer.replaceChildren();
        if (!schema.tables.length) {
            const empty = document.createElement("div");
            empty.className = "db-erd-empty-state";
            empty.innerHTML = '<span class="material-symbols-outlined">account_tree</span><strong>표시할 테이블이 없습니다</strong><span>에디터에서 DBML 또는 DDL을 작성하면 ERD가 생성됩니다.</span>';
            canvas.appendChild(empty);
            return;
        }
        const positions = new Map();
        const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(schema.tables.length))));
        schema.tables.forEach((table, index) => {
            const node = document.createElement("article");
            node.className = "db-erd-table-node absolute w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-white shadow-md transition-shadow";
            const savedPosition = erdPositions[table.name.toLowerCase()];
            const defaultX = 48 + (index % columns) * 300;
            const defaultY = 48 + Math.floor(index / columns) * 230;
            const x = Number.isFinite(savedPosition?.x) ? Math.max(12, savedPosition.x) : defaultX;
            const y = Number.isFinite(savedPosition?.y) ? Math.max(12, savedPosition.y) : defaultY;
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.dataset.erdTable = table.name;
            const relationCount = schema.refs.filter((ref) => ref.fromTable.toLowerCase() === table.name.toLowerCase() || ref.toTable.toLowerCase() === table.name.toLowerCase()).length;
            const rows = table.columns.map((column) => {
                const foreignKey = schema.refs.some((ref) => ref.fromTable.toLowerCase() === table.name.toLowerCase() && ref.fromColumn.toLowerCase() === column.name.toLowerCase());
                const role = column.pk ? "PK" : foreignKey ? "FK" : "";
                const comment = column.comment ? `<span class="material-symbols-outlined db-erd-comment-icon" title="${escapeHtml(column.comment)}">comment</span>` : "";
                const typeMatch = String(column.type).match(/^(.+?)(\s*\([^)]*\))?$/);
                const typeName = typeMatch?.[1]?.trim() || column.type;
                const typeSize = typeMatch?.[2]?.trim() || "";
                const typeLabel = `${escapeHtml(typeName)}${typeSize ? `<span class="db-erd-column-size">${escapeHtml(typeSize)}</span>` : ""}`;
                return `<div class="db-erd-column-row"><span class="db-erd-column-name ${column.pk ? "is-primary" : ""}">${role ? `<span class="db-erd-column-role ${column.pk ? "is-pk" : "is-fk"}">${role}</span>` : ""}<span class="truncate">${escapeHtml(column.name)}</span>${comment}</span><span class="db-erd-column-type">${typeLabel}${column.nullable ? "" : '<span class="db-erd-required">!</span>'}</span></div>`;
            }).join("");
            node.innerHTML = `<header class="db-erd-table-header"><span class="flex min-w-0 items-center gap-2"><span class="material-symbols-outlined text-[17px]">table</span><span class="truncate font-code-sm text-code-sm font-semibold">${escapeHtml(table.name)}</span></span><span class="db-erd-relation-count">${relationCount}</span></header><div>${rows || '<div class="px-3 py-3 text-xs text-on-surface-variant">컬럼 없음</div>'}</div>`;
            if (table.comment) {
                node.querySelector(".db-erd-table-header > span")?.insertAdjacentHTML("beforeend", `<span class="material-symbols-outlined db-erd-comment-icon" title="${escapeHtml(table.comment)}">comment</span>`);
            }
            canvas.appendChild(node);
            positions.set(table.name.toLowerCase(), node);
            node.addEventListener("click", () => {
                if (erdTool !== "select") return;
                document.querySelectorAll(".db-erd-table-node.is-selected").forEach((item) => item.classList.remove("is-selected"));
                node.classList.add("is-selected");
            });
            node.addEventListener("pointerdown", (event) => {
                if (erdTool !== "select" || event.button !== 0) return;
                event.preventDefault();
                node.setPointerCapture?.(event.pointerId);
                const startX = event.clientX;
                const startY = event.clientY;
                const originX = node.offsetLeft;
                const originY = node.offsetTop;
                node.classList.add("is-selected", "is-dragging");
                const move = (moveEvent) => {
                    node.style.left = `${Math.max(12, originX + (moveEvent.clientX - startX) / erdZoom)}px`;
                    node.style.top = `${Math.max(12, originY + (moveEvent.clientY - startY) / erdZoom)}px`;
                    linesLayer.replaceChildren();
                    drawRelations();
                };
                const stop = () => {
                    node.classList.remove("is-dragging");
                    erdPositions[table.name.toLowerCase()] = {
                        x: Math.round(node.offsetLeft),
                        y: Math.round(node.offsetTop)
                    };
                    saveServerDocument(editor?.value ?? "", erdPositions);
                    node.removeEventListener("pointermove", move);
                    node.removeEventListener("pointerup", stop);
                    node.removeEventListener("pointercancel", stop);
                };
                node.addEventListener("pointermove", move);
                node.addEventListener("pointerup", stop, { once: true });
                node.addEventListener("pointercancel", stop, { once: true });
            });
        });
        const drawRelations = () => {
            linesLayer.replaceChildren();
            schema.refs.forEach((ref) => {
                const from = positions.get(ref.fromTable.toLowerCase());
                const to = positions.get(ref.toTable.toLowerCase());
                if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement)) return;
                const right = to.offsetLeft + to.offsetWidth / 2 >= from.offsetLeft + from.offsetWidth / 2;
                const startX = from.offsetLeft + (right ? from.offsetWidth : 0);
                const endX = to.offsetLeft + (right ? 0 : to.offsetWidth);
                const startY = from.offsetTop + Math.min(from.offsetHeight / 2, 70);
                const endY = to.offsetTop + Math.min(to.offsetHeight / 2, 70);
                const curve = Math.max(40, Math.abs(endX - startX) * 0.45);
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${startX} ${startY} C ${startX + (right ? curve : -curve)} ${startY}, ${endX + (right ? -curve : curve)} ${endY}, ${endX} ${endY}`);
                path.classList.add("db-erd-relation-line");
                const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                title.textContent = `${ref.fromTable}.${ref.fromColumn} → ${ref.toTable}.${ref.toColumn}`;
                path.appendChild(title);
                linesLayer.appendChild(path);
                [[startX, startY], [endX, endY]].forEach(([x, y]) => {
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", String(x));
                    dot.setAttribute("cy", String(y));
                    dot.setAttribute("r", "3");
                    dot.classList.add("db-erd-relation-dot");
                    linesLayer.appendChild(dot);
                });
            });
        };
        drawRelations();
        applyErdViewport();
    };

    const saveServerDocument = async (text, layout = erdPositions, targetCategoryId = dbCategoryId, targetCategoryName = currentSchemaName?.textContent?.trim() || "E-Commerce Schema") => {
        setDbSaveStatus("pending");
        try {
            const query = new URLSearchParams({ categoryId: targetCategoryId, categoryName: targetCategoryName });
            const response = await fetch(`/api/db-modeling/schema?${query.toString()}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                keepalive: true,
                body: JSON.stringify({ schemaText: text, layoutJson: JSON.stringify(layout) })
            });
            if (!response.ok) throw new Error(`DB 모델 저장 실패: ${response.status}`);
            setDbSaveStatus("saved");
            setStatus(`${schema.tables.length}개 테이블 · DB 저장 완료`);
        } catch (error) {
            console.warn(error);
            setDbSaveStatus("error");
            setStatus("DB 저장에 실패했습니다. 입력 내용은 브라우저에 보관됩니다.", true);
        }
    };

    const scheduleServerSave = (text, layout = erdPositions) => {
        window.clearTimeout(serverSaveTimer);
        setDbSaveStatus("pending");
        serverSaveTimer = window.setTimeout(() => saveServerDocument(text, layout), 700);
    };

    const applySchema = (text, switchToErd = false, persist = true) => {
        const parsed = parseSchema(text);
        if (!parsed.tables.length) {
            setStatus("테이블 정의를 찾지 못했습니다.", true);
            return false;
        }
        schema = parsed;
        localStorage.setItem(storageKey, text);
        if (persist) scheduleServerSave(text);
        renderSidebar();
        renderErd();
        setStatus(`${schema.tables.length}개 테이블 · ${schema.refs.length}개 관계 분석 완료`);
        if (switchToErd) setMode("erd");
        return true;
    };

    const loadCategory = (categoryId) => {
        const query = new URLSearchParams({ categoryId });
        return fetch(`/api/db-modeling/schema?${query.toString()}`, { headers: { Accept: "application/json" } })
            .then((response) => {
                if (!response.ok) throw new Error(`DB 모델 카테고리 조회 실패: ${response.status}`);
                return response.json();
            })
            .then((document) => {
                dbCategoryId = categoryId;
                localStorage.setItem(categoryStorageKey, dbCategoryId);
                storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${dbCategoryId}`;
                dbCategories = Array.isArray(document?.categories) ? document.categories : dbCategories;
                const category = dbCategories.find((item) => item.categoryId === dbCategoryId);
                if (currentSchemaName) currentSchemaName.textContent = category?.categoryName || "E-Commerce Schema";
                renderSchemaOptions();
                closeSchemaMenu();
                erdPositions = parseErdLayout(document?.layoutJson);
                const storedCategoryText = localStorage.getItem(storageKey);
                const categoryText = document?.schemaText || storedCategoryText || sample;
                if (editor) editor.value = categoryText;
                highlightDbml(categoryText);
                updateEditorGutter();
                setInputType(categoryText);
                applySchema(categoryText, false, false);
            })
            .catch((error) => console.warn(error));
    };

    const addSchemaCategory = () => {
        const name = window.prompt("새 스키마 이름을 입력하세요.", "New Schema");
        if (!name?.trim()) return;
        const baseId = name.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "schema";
        let categoryId = baseId;
        let suffix = 2;
        while (dbCategories.some((item) => item.categoryId === categoryId)) categoryId = `${baseId}-${suffix++}`;
        dbCategoryId = categoryId;
        localStorage.setItem(categoryStorageKey, dbCategoryId);
        storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${dbCategoryId}`;
        if (currentSchemaName) currentSchemaName.textContent = name.trim();
        erdPositions = {};
        dbCategories = [...dbCategories, { categoryId, categoryName: name.trim() }];
        renderSchemaOptions();
        if (editor) editor.value = sample;
        applySchema(sample, false, false);
        saveServerDocument(sample, {}, categoryId, name.trim());
        closeSchemaMenu();
    };

    const setMode = (mode) => {
        const editor_mode = mode === "editor";
        editorView?.classList.add("hidden");
        erdView?.classList.remove("hidden");
        sidebarEditor?.classList.toggle("hidden", !editor_mode);
        sidebarEditor?.classList.toggle("flex", editor_mode);
        objectExplorer?.classList.toggle("hidden", editor_mode);
        secondarySidebar?.classList.toggle("db-sidebar-editor-active", editor_mode);
        if (editor_mode) {
            setSidebarCollapsed(false);
            document.getElementById("db-sidebar-controls")?.classList.add("hidden");
        } else {
            document.getElementById("db-sidebar-controls")?.classList.remove("hidden");
            setSidebarCollapsed(localStorage.getItem("aastudio-db-sidebar-collapsed") === "true");
        }
        document.querySelectorAll("[data-db-mode]").forEach((button) => {
            const active = button.dataset.dbMode === mode;
            button.classList.toggle("bg-surface-white", active);
            button.classList.toggle("text-secondary", active);
            button.classList.toggle("shadow-sm", active);
            button.classList.toggle("text-on-surface-variant", !active);
        });
        renderErd();
    };

    const setSidebarCollapsed = (collapsed) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        secondarySidebar.classList.toggle("collapsed", collapsed);
        secondarySidebar.classList.toggle("w-64", !collapsed);
        secondarySidebar.classList.toggle("w-14", collapsed);
        secondarySidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
        const icon = secondarySidebarToggle?.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = collapsed ? "chevron_right" : "chevron_left";
        apply_sidebar_width(collapsed);
        localStorage.setItem("aastudio-db-sidebar-collapsed", String(collapsed));
    };

    const apply_sidebar_width = (collapsed) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        if (collapsed) {
            secondarySidebar.style.setProperty("--db-sidebar-width", "3.5rem");
            return;
        }
        const stored_width = Number(localStorage.getItem(sidebar_width_key));
        if (Number.isFinite(stored_width)) {
            secondarySidebar.style.setProperty("--db-sidebar-width", `${stored_width}px`);
        } else {
            secondarySidebar.style.removeProperty("--db-sidebar-width");
        }
    };

    const resize_sidebar = (event) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        const min_width = 280;
        const max_width = Math.max(min_width, Math.floor(window.innerWidth * 0.6));
        const width = Math.min(max_width, Math.max(min_width, event.clientX - secondarySidebar.getBoundingClientRect().left));
        secondarySidebar.style.setProperty("--db-sidebar-width", `${width}px`);
        localStorage.setItem(sidebar_width_key, String(width));
    };

    sidebar_resize_handle?.addEventListener("pointerdown", (event) => {
        if (!(secondarySidebar instanceof HTMLElement) || secondarySidebar.classList.contains("collapsed")) return;
        event.preventDefault();
        sidebar_resize_handle.setPointerCapture?.(event.pointerId);
        secondarySidebar.classList.add("db-sidebar-resizing");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        const handle_pointer_move = (move_event) => resize_sidebar(move_event);
        const stop_resize = () => {
            secondarySidebar.classList.remove("db-sidebar-resizing");
            document.body.style.removeProperty("cursor");
            document.body.style.removeProperty("user-select");
            window.removeEventListener("pointermove", handle_pointer_move);
            window.removeEventListener("pointerup", stop_resize);
            window.removeEventListener("pointercancel", stop_resize);
        };
        window.addEventListener("pointermove", handle_pointer_move);
        window.addEventListener("pointerup", stop_resize, { once: true });
        window.addEventListener("pointercancel", stop_resize, { once: true });
    });

    const toggleSidebarGroup = (header) => {
        const content = header.parentElement?.querySelector('[class~="space-y-0.5"]');
        if (!(content instanceof HTMLElement)) return;
        const collapsed = content.classList.toggle("hidden");
        header.setAttribute("aria-expanded", String(!collapsed));
        const icon = header.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = collapsed ? "chevron_right" : "expand_more";
    };

    const filterSidebarTables = () => {
        const query = objectSearch?.value.trim().toLowerCase() ?? "";
        document.querySelectorAll("[data-db-table-row]").forEach((row) => {
            row.classList.toggle("hidden", Boolean(query) && !row.dataset.tableName.includes(query));
        });
    };

    document.querySelectorAll("[data-erd-tool]").forEach((button) => {
        button.addEventListener("click", () => setErdTool(button.dataset.erdTool ?? "select"));
    });
    document.getElementById("erd-grid-toggle")?.addEventListener("click", () => {
        erdGrid?.classList.toggle("is-hidden");
    });
    document.getElementById("erd-zoom-in")?.parentElement?.addEventListener("click", () => {
        erdZoom = Math.min(2, Number((erdZoom + 0.1).toFixed(2)));
        applyErdViewport();
    });
    document.getElementById("erd-zoom-out")?.parentElement?.addEventListener("click", () => {
        erdZoom = Math.max(0.4, Number((erdZoom - 0.1).toFixed(2)));
        applyErdViewport();
    });
    erdCanvas?.addEventListener("pointerdown", (event) => {
        if (erdTool !== "pan" && event.button !== 1) return;
        event.preventDefault();
        erdCanvas.setPointerCapture?.(event.pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        const originX = erdPanX;
        const originY = erdPanY;
        erdCanvas.classList.add("is-panning");
        const move = (moveEvent) => {
            erdPanX = originX + moveEvent.clientX - startX;
            erdPanY = originY + moveEvent.clientY - startY;
            applyErdViewport();
        };
        const stop = () => {
            erdCanvas.classList.remove("is-panning");
            erdCanvas.removeEventListener("pointermove", move);
            erdCanvas.removeEventListener("pointerup", stop);
            erdCanvas.removeEventListener("pointercancel", stop);
        };
        erdCanvas.addEventListener("pointermove", move);
        erdCanvas.addEventListener("pointerup", stop, { once: true });
        erdCanvas.addEventListener("pointercancel", stop, { once: true });
    });
    setErdTool("select");
    applyErdViewport();

    secondarySidebarToggle?.addEventListener("click", () => {
        setSidebarCollapsed(!secondarySidebar?.classList.contains("collapsed"));
    });
    objectSearch?.addEventListener("input", filterSidebarTables);
    document.querySelectorAll("[data-db-group-toggle]").forEach((header) => header.addEventListener("click", () => toggleSidebarGroup(header)));
    const tablesGroupHeader = document.getElementById("db-tables-view-toggle");
    tablesGroupHeader?.setAttribute("aria-expanded", "true");
    tablesGroupHeader?.addEventListener("click", () => {
        setMode("editor");
        toggleSidebarGroup(tablesGroupHeader);
    });
    setSidebarCollapsed(localStorage.getItem("aastudio-db-sidebar-collapsed") === "true");

    newTableButton?.addEventListener("click", () => {
        if (!(editor instanceof HTMLTextAreaElement)) return;
        const existingNames = new Set(schema.tables.map((table) => table.name.toLowerCase()));
        let suffix = schema.tables.length + 1;
        let name = `new_table_${suffix}`;
        while (existingNames.has(name)) name = `new_table_${++suffix}`;
        const block = `\n\nTable ${name} {\n  id int [pk]\n}`;
        editor.value = `${editor.value.trimEnd()}${block}`;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        setMode("editor");
        editor.focus();
    });

    document.querySelectorAll("[data-db-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.dbMode)));
    currentSchemaButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = schemaMenu?.classList.toggle("hidden") === false;
        currentSchemaButton.setAttribute("aria-expanded", String(isOpen));
    });
    schemaAddButton?.addEventListener("click", addSchemaCategory);
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Node) || currentSchemaButton?.contains(event.target) || schemaMenu?.contains(event.target)) return;
        closeSchemaMenu();
    });
    const render_editor = () => applySchema(editor?.value ?? "", true);
    document.getElementById("db-editor-render")?.addEventListener("click", render_editor);
    document.getElementById("db-sidebar-editor-render")?.addEventListener("click", render_editor);
    document.getElementById("db-editor-example")?.addEventListener("click", () => {
        if (editor) editor.value = sample;
        highlightDbml(sample);
        updateEditorGutter();
        applySchema(sample);
    });
    editor?.addEventListener("input", () => {
        setInputType(editor.value);
        highlightDbml(editor.value);
        clearTimeout(parseTimer);
        parseTimer = window.setTimeout(() => {
            const parsed = parseSchema(editor.value);
            if (parsed.tables.length) {
                schema = parsed;
                localStorage.setItem(storageKey, editor.value);
                scheduleServerSave(editor.value);
                renderSidebar();
                renderErd();
                setStatus(`${parsed.tables.length}개 테이블 · ERD 생성 가능`);
                if (/create\s+table/i.test(editor.value)) setMode("erd");
            }
        }, 400);
    });

    editor?.addEventListener("click", updateEditorGutter);
    editor?.addEventListener("click", () => highlightDbml(editor.value));
    editor?.addEventListener("mouseup", () => {
        updateEditorGutter();
        highlightDbml(editor.value);
    });
    editor?.addEventListener("focus", () => highlightDbml(editor.value));
    editor?.addEventListener("keyup", () => highlightDbml(editor.value));
    editor?.addEventListener("select", () => highlightDbml(editor.value));
    editor?.addEventListener("scroll", () => {
        updateEditorGutter();
        highlightDbml(editor.value);
    });
    editor?.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
            event.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.setRangeText("  ", start, end, "end");
            editor.dispatchEvent(new Event("input", { bubbles: true }));
            updateEditorGutter();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            applySchema(editor.value, true);
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            applySchema(editor.value, false);
        }
    });

    const stored = localStorage.getItem(storageKey);
    if (editor instanceof HTMLTextAreaElement && sidebarEditorHost instanceof HTMLElement) {
        sidebarEditorHost.appendChild(editor);
        editor.classList.add("db-sidebar-schema-editor");
        updateEditorGutter();
        highlightDbml(editor.value);
        editor.addEventListener("input", updateEditorGutter);
        editor.addEventListener("scroll", updateEditorGutter);
    }
    const initialText = stored || sample;
    if (editor) editor.value = initialText;
    highlightDbml(initialText);
    updateEditorGutter();
    setInputType(editor?.value ?? sample);
    applySchema(editor?.value ?? sample, false, false);
    setMode("editor");

    loadCategory(dbCategoryId);
    /*
        .then((response) => {
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`DB 모델 조회 실패: ${response.status}`);
            return response.json();
        })
        .then((document) => {
            if (document?.schemaText) {
                erdPositions = parseErdLayout(document.layoutJson);
                if (editor) editor.value = document.schemaText;
                highlightDbml(document.schemaText);
                updateEditorGutter();
                setInputType(document.schemaText);
                applySchema(document.schemaText, false, false);
            } else if (stored) {
                scheduleServerSave(stored);
            }
        })
        .catch((error) => console.warn(error));
    */
})();
