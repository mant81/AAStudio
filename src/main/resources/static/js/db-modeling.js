(() => {
    const editor = document.getElementById("db-schema-editor");
    const editorView = document.getElementById("db-editor-view");
    const propertiesPanel = document.getElementById("db-properties-panel");
    const propertiesContent = document.getElementById("db-properties-content");
    const sidebarEditor = document.getElementById("db-sidebar-editor");
    const sidebarEditorHost = document.getElementById("db-sidebar-editor-host");
    const monacoEditorHost = document.getElementById("db-monaco-editor");
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
    const erdToolbar = document.getElementById("erd-toolbar");
    const erdOverlayToggle = document.getElementById("db-erd-overlay-toggle");
    const canvasBackground = document.getElementById("db-canvas-background");
    const linesLayer = document.getElementById("erd-lines");
    const erdGrid = document.getElementById("erd-grid");
    const erdGridToggle = document.getElementById("erd-grid-toggle");
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
    const schemaAddModal = document.getElementById("db-schema-add-modal");
    const schemaAddForm = document.getElementById("db-schema-add-form");
    const schemaAddName = document.getElementById("db-schema-add-name");
    const schemaAddCancel = document.getElementById("db-schema-add-cancel");
    const schemaAddCancelSecondary = document.getElementById("db-schema-add-cancel-secondary");
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
    let saveQueue = Promise.resolve();
    let schemaMutationPending = false;
    let schemaNameMode = "add";
    let schemaExportPending = false;
    const sidebar_width_key = "aastudio-db-sidebar-width";
    let erdTool = "select";
    let erdZoom = 1;
    let erdPanX = 0;
    let erdPanY = 0;
    let erdPositions = {};
    let selectedTableName = null;
    const columnEditModal = document.getElementById("db-column-edit-modal");
    const columnEditForm = document.getElementById("db-column-edit-form");
    const columnsModal = document.getElementById("db-columns-modal");
    const columnsForm = document.getElementById("db-columns-form");
    let editingColumn = null;

    const moveErdToolbarToCanvas = () => {
        if (!(erdToolbar instanceof HTMLElement) || !(erdCanvas instanceof HTMLElement)) return;
        erdCanvas.appendChild(erdToolbar);
    };
    moveErdToolbarToCanvas();

    const setErdOverlayVisible = (visible) => {
        if (!(propertiesPanel instanceof HTMLElement)) return;
        propertiesPanel.hidden = !visible;
        erdOverlayToggle?.setAttribute("aria-expanded", String(visible));
        erdOverlayToggle?.setAttribute("aria-label", visible ? "속성 닫기" : "속성 열기");
        erdOverlayToggle?.setAttribute("title", visible ? "속성 닫기" : "속성 열기");
        const icon = erdOverlayToggle?.querySelector("i");
        if (icon) icon.className = visible ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line";
    };

    const drawBaseCanvas = () => {
        if (!(canvasBackground instanceof HTMLCanvasElement)) return;
        const bounds = canvasBackground.getBoundingClientRect();
        const width = Math.max(1, Math.round(bounds.width));
        const height = Math.max(1, Math.round(bounds.height));
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvasBackground.width = Math.round(width * dpr);
        canvasBackground.height = Math.round(height * dpr);
        const context = canvasBackground.getContext("2d");
        if (!context) return;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#f3f6fa";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "rgba(82, 96, 110, 0.22)";
        for (let x = 1; x < width; x += 24) {
            for (let y = 1; y < height; y += 24) {
                context.beginPath();
                context.arc(x, y, 1, 0, Math.PI * 2);
                context.fill();
            }
        }

    };

    drawBaseCanvas();
    window.requestAnimationFrame(drawBaseCanvas);
    window.setTimeout(drawBaseCanvas, 120);
    window.addEventListener("resize", drawBaseCanvas);
    if (window.ResizeObserver && canvasBackground instanceof HTMLElement) {
        new ResizeObserver(drawBaseCanvas).observe(canvasBackground);
    }

    erdOverlayToggle?.addEventListener("click", () => {
        setErdOverlayVisible(propertiesPanel?.hidden ?? true);
    });
    propertiesPanel?.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setErdOverlayVisible(false);
        erdOverlayToggle?.focus();
    });

    const renderProperties = () => {
        if (!(propertiesContent instanceof HTMLElement)) return;
        const table = schema.tables.find((item) => item.name === selectedTableName);
        propertiesContent.replaceChildren();
        const summary = document.createElement("p");
        summary.textContent = table
            ? table.name
            : `${schema.tables.length}개 테이블 · ${schema.refs.length}개 관계`;
        summary.className = "db-properties-name";
        propertiesContent.appendChild(summary);
        if (!table) {
            const hint = document.createElement("p");
            hint.textContent = "캔버스에서 테이블을 선택하면 속성이 표시됩니다.";
            propertiesContent.appendChild(hint);
            return;
        }
        if (table.comment) {
            const comment = document.createElement("p");
            comment.textContent = table.comment;
            propertiesContent.appendChild(comment);
        }
    };

    let monacoEditor = null;

    const setEditorText = (text) => {
        const value = String(text ?? "");
        if (editor) editor.value = value;
        monacoEditor?.setValue(value);
    };

    const selectTableInEditor = (tableName) => {
        const source = monacoEditor?.getValue() ?? editor?.value ?? "";
        const declaration = /\b(?:Table|CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?)\s+([`"\w.-]+)\s*([({])/gi;
        let match;
        while ((match = declaration.exec(source))) {
            if (unquote(match[1]).toLowerCase() !== tableName.toLowerCase()) continue;
            const opening = match.index + match[0].lastIndexOf(match[2]);
            const closing = findClosing(source, opening, match[2], match[2] === "{" ? "}" : ")");
            const end = closing < 0 ? opening + 1 : closing + 1;
            if (monacoEditor) {
                const model = monacoEditor.getModel();
                const startPosition = model.getPositionAt(match.index);
                const endPosition = model.getPositionAt(end);
                monacoEditor.setSelection({ startLineNumber: startPosition.lineNumber, startColumn: startPosition.column, endLineNumber: endPosition.lineNumber, endColumn: endPosition.column });
                monacoEditor.revealLineInCenter(startPosition.lineNumber);
                monacoEditor.focus();
            } else if (editor) {
                editor.setSelectionRange(match.index, end);
            }
            return;
        }
    };

    const mountMonacoEditor = () => {
        if (monacoEditor || !(monacoEditorHost instanceof HTMLElement) || !window.monaco) return;
        monacoEditor = window.monaco.editor.create(monacoEditorHost, {
            value: editor?.value ?? "",
            language: "sql",
            theme: "vs-dark",
            readOnly: !dbCategoryId,
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            padding: { top: 12, bottom: 12 },
            wordWrap: "off",
            scrollBeyondLastLine: false,
            tabSize: 2,
            insertSpaces: true,
        });
        monacoEditor.onDidChangeModelContent(() => {
            if (!editor) return;
            editor.value = monacoEditor.getValue();
            editor.dispatchEvent(new Event("input", { bubbles: true }));
            updateEditorGutter();
        });
        monacoEditor.onDidChangeCursorPosition((event) => {
            if (editor) {
                const offset = monacoEditor.getModel().getOffsetAt(event.position);
                editor.selectionStart = offset;
                editor.selectionEnd = offset;
            }
            updateEditorGutter();
        });
        monacoEditor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, () => {
            applySchema(monacoEditor.getValue(), true);
        });
    };

    window.addEventListener("monaco-ready", mountMonacoEditor, { once: true });
    if (window.monaco) mountMonacoEditor();

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
            option.setAttribute("aria-current", category.categoryId === dbCategoryId ? "true" : "false");
            option.classList.toggle("bg-surface-container", category.categoryId === dbCategoryId);
            option.classList.toggle("text-primary", category.categoryId === dbCategoryId);
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

    const columnAttributes = (definition, dbml = false) => {
        const source = dbml ? splitTopLevel(definition).find((attribute) => /^default\s*:/i.test(attribute)) || "" : definition.replace(/\bcomment\s+'(?:''|\\.|[^'])*'/gi, "");
        const match = source.match(/\bdefault(?:\s*:\s*|\s*(?=\()|\s+)(`[^`]*`|N?'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|[a-z_]\w*\([^)]*\)|\([^)]*\)|[^,\]\s]+)/i);
        let defaultValue = match?.[1];
        if (defaultValue?.startsWith("(") && defaultValue.endsWith(")")) defaultValue = defaultValue.slice(1, -1);
        if (dbml && defaultValue?.startsWith("'")) defaultValue = defaultValue.replace(/\\'/g, "''");
        const flags = definition.replace(/'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|`[^`]*`/g, "");
        return { defaultValue, unique: /\bunique\b/i.test(flags), increment: /\b(?:increment|auto_increment|identity)\b|generated\s+(?:always|by\s+default)\s+as\s+identity/i.test(flags), pk: dbml ? /\bpk\b/i.test(flags) : /\bprimary\s+key\b/i.test(flags) };
    };

    const stripSchemaComments = (text) => text.replace(/'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|`(?:\\.|[^`])*`|\/\*[\s\S]*?\*\/|--[^\r\n]*|\/\/[^\r\n]*/g,
        (token) => /^["'`]/.test(token) ? token : token.replace(/[^\r\n]/g, " "));

    const parseDdl = (text) => {
        const cleaned = stripSchemaComments(text);
        const tables = [];
        const refs = [];
        const tablePattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(/gi;
        let tableMatch;
        while ((tableMatch = tablePattern.exec(cleaned))) {
            const table = ensureTable(tables, unquote(tableMatch[1]));
            const close = findClosing(cleaned, tableMatch.index + tableMatch[0].lastIndexOf("("), "(", ")");
            if (close < 0) continue;
            const body = cleaned.slice(tableMatch.index + tableMatch[0].length, close);
            const primaryNames = [];
            splitTopLevel(body).forEach((definition) => {
                const foreign = definition.match(/(?:constraint\s+[^\s]+\s+)?foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)\s*\(([^)]+)\)/i);
                if (foreign) {
                    const fromColumns = foreign[1].split(",").map(unquote), toColumns = foreign[3].split(",").map(unquote);
                    refs.push({ fromTable: table.name, fromColumn: fromColumns[0], fromColumns, toTable: unquote(foreign[2]), toColumn: toColumns[0], toColumns });
                    return;
                }
                const primary = definition.match(/^(?:constraint\s+[^\s]+\s+)?primary\s+key\s*\(([^)]+)\)/i);
                if (primary) {
                    primaryNames.push(...primary[1].split(",").map(unquote));
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
                const metadata = columnAttributes(rest);
                addColumn(table, { name, type: normalizeType(rest), ...metadata, nullable: !metadata.pk && !/\bnot\s+null\b/i.test(rest) });
            });
            table.columns.forEach((column) => { if (primaryNames.some((name) => name.toLowerCase() === column.name.toLowerCase())) { column.pk = true; column.nullable = false; } });
            tableMatch.lastIndex = close + 1;
        }
        const alterReferencePattern = /alter\s+table\s+([^\s]+)[\s\S]*?foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)\s*\(([^)]+)\)/gi;
        let alterReference;
        while ((alterReference = alterReferencePattern.exec(cleaned))) {
            refs.push({
                fromTable: unquote(alterReference[1]),
                fromColumn: unquote(alterReference[2].split(",")[0]), fromColumns: alterReference[2].split(",").map(unquote),
                toTable: unquote(alterReference[3]),
                toColumn: unquote(alterReference[4].split(",")[0]), toColumns: alterReference[4].split(",").map(unquote)
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
        const cleaned = stripSchemaComments(text);
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
                const columnMatch = line.match(/^([`"\w.-]+)\s+([A-Za-z][\w]*(?:\s+(?:varying|precision))?(?:\s*\([^)]*\))?)(?:\s*\[([^\]]+)\])?/i);
                if (!columnMatch) return;
                const attributes = columnMatch[3] ?? "";
                const metadata = columnAttributes(attributes, true);
                const inlineNote = attributes.match(/note\s*:\s*['"]([^'"]*)['"]/i)?.[1] ?? "";
                addColumn(table, { name: unquote(columnMatch[1]), type: columnMatch[2], ...metadata, nullable: !metadata.pk && !/not null/i.test(attributes), comment: inlineNote });
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

    const syncColumnEditorValues = (table) => {
        [...document.querySelectorAll("#db-table-columns-editor .db-columns-grid-row")].forEach((row, index) => {
            const column = table.columns[index];
            const name = row.querySelector("[data-column-name]")?.value.trim();
            const type = row.querySelector("[data-column-type]")?.value.trim();
            if (column && name && type) Object.assign(column, {
                name,
                type,
                comment: row.querySelector("[data-column-comment]")?.value.trim() || "",
                defaultValue: row.querySelector("[data-column-default]")?.value.trim() || undefined,
                nullable: row.querySelector("[data-column-nullable]")?.checked !== true
            });
        });
    };
    const openColumnsEditor = (table) => {
        const columnEditor = document.getElementById("db-table-columns-editor");
        if (!(columnEditor instanceof HTMLElement)) return;
        columnEditor.replaceChildren(...table.columns.map((column, index) => {
            const row = document.createElement("div");
            row.className = "db-columns-grid db-columns-grid-row";
            row.innerHTML = `<input id="db-column-name-${index}" name="column-name-${index}" data-column-name value="${escapeHtml(column.name)}" aria-label="컬럼명"><span>${index + 1}</span><input id="db-column-type-${index}" name="column-type-${index}" data-column-type value="${escapeHtml(column.type)}" aria-label="타입"><label><input id="db-column-nullable-${index}" name="column-nullable-${index}" data-column-nullable type="checkbox" ${column.nullable ? "" : "checked"}></label><input id="db-column-default-${index}" name="column-default-${index}" data-column-default value="${escapeHtml(column.defaultValue || "")}" aria-label="Default"><input id="db-column-comment-${index}" name="column-comment-${index}" data-column-comment value="${escapeHtml(column.comment || "")}" aria-label="Comment"><span class="db-columns-order-actions"><button type="button" data-column-up aria-label="위로 이동" title="위로 이동">▲</button><button type="button" data-column-down aria-label="아래로 이동" title="아래로 이동">▼</button><button type="button" data-column-delete aria-label="컬럼 삭제" title="컬럼 삭제">×</button></span>`;
            const deleteCell = document.createElement("span");
            deleteCell.className = "db-columns-delete-action";
            const deleteButton = row.querySelector("[data-column-delete]");
            if (deleteButton) { deleteButton.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">delete</span>'; deleteButton.parentElement?.removeChild(deleteButton); deleteCell.appendChild(deleteButton); row.appendChild(deleteCell); }
            row.querySelector("[data-column-up]").disabled = index === 0;
            row.querySelector("[data-column-down]").disabled = index === table.columns.length - 1;
            row.querySelector("[data-column-up]")?.addEventListener("click", () => { syncColumnEditorValues(table); if (index > 0) [table.columns[index - 1], table.columns[index]] = [table.columns[index], table.columns[index - 1]]; openColumnsEditor(table); });
            row.querySelector("[data-column-down]")?.addEventListener("click", () => { syncColumnEditorValues(table); if (index < table.columns.length - 1) [table.columns[index], table.columns[index + 1]] = [table.columns[index + 1], table.columns[index]]; openColumnsEditor(table); });
            row.querySelector("[data-column-delete]")?.addEventListener("click", () => { syncColumnEditorValues(table); table.columns.splice(index, 1); openColumnsEditor(table); });
            return row;
        }));
    };

    const renderSidebar = () => {
        const tableCount = document.getElementById("db-table-count");
        if (tableCount) tableCount.textContent = String(schema.tables.length);
        const list = document.getElementById("db-table-list");
        if (!(list instanceof HTMLElement)) return;
        list.replaceChildren();
        schema.tables.forEach((table, index) => {
            const key = table.name.toLowerCase();
            const hidden = erdPositions[key]?.hidden === true;
            const wrapper = document.createElement("div");
            wrapper.className = "db-table-list-item";
            const row = document.createElement("button");
            const active = selectedTableName ? table.name === selectedTableName : index === 0;
            row.className = `flex w-full items-center gap-2 rounded-lg border-l-2 px-2 py-1.5 text-left font-code-sm text-code-sm transition-colors ${active ? "border-secondary bg-secondary/5 text-secondary" : "border-transparent text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"}`;
            row.type = "button";
            row.dataset.dbTableRow = "";
            row.dataset.tableName = table.name.toLowerCase();
            row.innerHTML = `<span class="material-symbols-outlined text-[16px]">table</span><span class="truncate">${escapeHtml(table.name)}</span>`;
            row.addEventListener("click", () => {
                selectedTableName = table.name;
                document.querySelectorAll("[data-db-table-row]").forEach((item) => {
                    const active = item.dataset.tableName === table.name.toLowerCase();
                    item.classList.toggle("border-secondary", active);
                    item.classList.toggle("bg-secondary/5", active);
                    item.classList.toggle("text-secondary", active);
                    item.classList.toggle("border-transparent", !active);
                    item.classList.toggle("text-on-surface-variant", !active);
                });
                document.querySelectorAll(".db-erd-table-node.is-selected").forEach((item) => item.classList.remove("is-selected"));
                const node = canvas.querySelector(`[data-erd-table="${CSS.escape(table.name)}"]`);
                if (node instanceof HTMLElement) {
                    node.classList.add("is-selected");
                    renderProperties();
                }
            });
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "db-table-edit-toggle";
            edit.setAttribute("aria-label", `${table.name} 수정`);
            edit.title = "테이블 설정";
            edit.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">edit</span>';
            edit.addEventListener("click", (event) => {
                event.stopPropagation();
                editingColumn = { tableName: table.name, table };
                document.getElementById("db-columns-subtitle").textContent = table.name;
                const columnEditor = document.getElementById("db-table-columns-editor");
                columnEditor.replaceChildren(...table.columns.map((column, index) => {
                    const row = document.createElement("div");
                    row.className = "db-columns-grid db-columns-grid-row";
                    row.innerHTML = `<input id="db-column-name-${index}" name="column-name-${index}" data-column-name value="${escapeHtml(column.name)}" aria-label="컬럼명"><span>${index + 1}</span><input id="db-column-type-${index}" name="column-type-${index}" data-column-type value="${escapeHtml(column.type)}" aria-label="타입"><label><input id="db-column-nullable-${index}" name="column-nullable-${index}" data-column-nullable type="checkbox" ${column.nullable ? "" : "checked"}></label><input id="db-column-default-${index}" name="column-default-${index}" data-column-default value="${escapeHtml(column.defaultValue || "")}" aria-label="Default"><input id="db-column-comment-${index}" name="column-comment-${index}" data-column-comment value="${escapeHtml(column.comment || "")}" aria-label="Comment"><span class="db-columns-order-actions"><button type="button" data-column-up aria-label="위로 이동" title="위로 이동">▲</button><button type="button" data-column-down aria-label="아래로 이동" title="아래로 이동">▼</button><button type="button" data-column-delete aria-label="컬럼 삭제" title="컬럼 삭제">×</button></span>`;
                    const deleteCell = document.createElement("span");
                    deleteCell.className = "db-columns-delete-action";
                    const deleteButton = row.querySelector("[data-column-delete]");
                    if (deleteButton) { deleteButton.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">delete</span>'; deleteButton.parentElement?.removeChild(deleteButton); deleteCell.appendChild(deleteButton); row.appendChild(deleteCell); }
                    row.querySelector("[data-column-up]").disabled = index === 0;
                    row.querySelector("[data-column-down]").disabled = index === table.columns.length - 1;
                    return row;
                }));
                [...columnEditor.querySelectorAll(".db-columns-grid-row")].forEach((row, index) => {
                    row.querySelector("[data-column-up]")?.addEventListener("click", () => {
                        syncColumnEditorValues(table);
                        if (index > 0) [table.columns[index - 1], table.columns[index]] = [table.columns[index], table.columns[index - 1]];
                        openColumnsEditor(table);
                    });
                    row.querySelector("[data-column-down]")?.addEventListener("click", () => {
                        syncColumnEditorValues(table);
                        if (index < table.columns.length - 1) [table.columns[index], table.columns[index + 1]] = [table.columns[index + 1], table.columns[index]];
                        openColumnsEditor(table);
                    });
                    row.querySelector("[data-column-delete]")?.addEventListener("click", () => { syncColumnEditorValues(table); table.columns.splice(index, 1); openColumnsEditor(table); });
                });
                columnsModal.classList.remove("hidden");
                columnsModal.classList.add("flex");
            });
            const visibility = document.createElement("button");
            visibility.type = "button";
            visibility.className = "db-table-visibility-toggle";
            visibility.setAttribute("aria-label", `${table.name} ${hidden ? "보이기" : "숨기기"}`);
            visibility.title = hidden ? "테이블 보이기" : "테이블 숨기기";
            visibility.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${hidden ? "visibility_off" : "visibility"}</span>`;
            visibility.addEventListener("click", () => {
                erdPositions[key] = { ...erdPositions[key], hidden: !hidden };
                if (!hidden && selectedTableName === table.name) selectedTableName = null;
                renderSidebar();
                renderErd();
                saveServerDocument(editor?.value ?? "", erdPositions);
            });
            wrapper.append(row, edit, visibility);
            list.appendChild(wrapper);
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
        if (!schema.tables.some((table) => table.name === selectedTableName)) selectedTableName = null;
        renderProperties();
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
            node.className = "db-erd-table-node absolute w-64 rounded-xl border border-outline-variant shadow-md transition-shadow";
            const savedPosition = erdPositions[table.name.toLowerCase()];
            if (savedPosition?.hidden === true) return;
            const defaultX = 48 + (index % columns) * 300;
            const defaultY = 48 + Math.floor(index / columns) * 230;
            const x = Number.isFinite(savedPosition?.x) ? Math.max(12, savedPosition.x) : defaultX;
            const y = Number.isFinite(savedPosition?.y) ? Math.max(12, savedPosition.y) : defaultY;
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.style.setProperty("--erd-header-color", savedPosition?.color || "#006399");
            node.dataset.erdTable = table.name;
            node.classList.toggle("is-selected", table.name === selectedTableName);
            const rows = table.columns.map((column) => {
                const foreignKey = schema.refs.some((ref) => ref.fromTable.toLowerCase() === table.name.toLowerCase() && ref.fromColumn.toLowerCase() === column.name.toLowerCase());
                const role = column.pk ? "PK" : foreignKey ? "FK" : "";
                const comment = column.comment ? `<span class="db-erd-column-note" role="tooltip"><span class="db-erd-column-note-title"><span class="material-symbols-outlined">view_column</span><strong>${escapeHtml(column.name)}</strong><code>${escapeHtml(column.type)}</code></span><span class="db-erd-column-note-label">Note</span><span class="db-erd-column-note-text">${escapeHtml(column.comment)}</span></span>` : "";
                const typeMatch = String(column.type).match(/^(.+?)(\s*\([^)]*\))?$/);
                const typeName = typeMatch?.[1]?.trim() || column.type;
                const typeSize = typeMatch?.[2]?.trim() || "";
                const typeLabel = `${escapeHtml(typeName)}${typeSize ? `<span class="db-erd-column-size">${escapeHtml(typeSize)}</span>` : ""}`;
                return `<div class="db-erd-column-row"><span class="db-erd-column-name ${column.pk ? "is-primary" : ""}">${role ? `<span class="db-erd-column-role ${column.pk ? "is-pk" : "is-fk"}">${role}</span>` : ""}<span class="truncate">${escapeHtml(column.name)}</span>${column.comment ? '<span class="material-symbols-outlined db-erd-column-comment-mark" aria-label="코멘트 있음">comment</span>' : ""}</span><span class="db-erd-column-type">${typeLabel}${column.nullable ? "" : '<span class="db-erd-required">!</span>'}</span>${comment}</div>`;
            }).join("");
            node.innerHTML = `<header class="db-erd-table-header"><span class="flex min-w-0 items-center gap-2"><span class="material-symbols-outlined text-[17px]">table</span><span class="truncate font-code-sm text-code-sm font-semibold">${escapeHtml(table.name)}</span></span><span class="db-erd-header-actions"><button class="db-erd-table-settings" type="button" aria-label="${escapeHtml(table.name)} 테이블 설정" title="테이블 설정"><span class="material-symbols-outlined">settings</span></button></span></header><div>${rows || '<div class="px-3 py-3 text-xs text-on-surface-variant">컬럼 없음</div>'}</div>`;
            node.querySelector(".db-erd-table-settings")?.addEventListener("click", (event) => {
                event.stopPropagation();
                if (editingColumn?.tableName === table.name && !columnEditModal.classList.contains("hidden")) {
                    closeColumnEditModal();
                    return;
                }
                if (editingColumn) closeColumnEditModal();
                editingColumn = { tableName: table.name, table, header: node.querySelector(".db-erd-table-header"), button: event.currentTarget, originalColor: savedPosition?.color || "#006399" };
                editingColumn.button.setAttribute("aria-expanded", "true");
                const name = document.getElementById("db-column-edit-name");
                name.value = table.name;
                const color = savedPosition?.color || "#006399";
                editingColumn.selectedColor = color;
                columnEditModal.classList.remove("hidden");
                const bounds = node.getBoundingClientRect();
                const cardWidth = columnEditForm.offsetWidth;
                const cardHeight = columnEditForm.offsetHeight;
                const right = bounds.right + 12;
                const onRight = right + cardWidth <= window.innerWidth - 12;
                const left = onRight ? right : Math.max(12, bounds.left - cardWidth - 12);
                const top = Math.max(12, Math.min(bounds.top, window.innerHeight - cardHeight - 12));
                columnEditForm.style.left = `${left}px`;
                columnEditForm.style.top = `${top}px`;
                columnEditModal.classList.toggle("is-left", !onRight);
                const arrow = columnEditModal.querySelector(".db-table-settings-arrow");
                arrow.style.left = `${onRight ? left - 7 : left + cardWidth - 5}px`;
                arrow.style.top = `${Math.max(top + 20, Math.min(bounds.top + 18, top + cardHeight - 24))}px`;
            });
            node.addEventListener("dblclick", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const settings = node.querySelector(".db-erd-table-settings");
                if (settings instanceof HTMLButtonElement) settings.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true, view: window }));
            }, true);
            if (table.comment) {
                node.querySelector(".db-erd-table-header > span")?.insertAdjacentHTML("beforeend", `<span class="material-symbols-outlined db-erd-comment-icon" title="${escapeHtml(table.comment)}">comment</span>`);
            }
            canvas.appendChild(node);
            positions.set(table.name.toLowerCase(), node);
            node.addEventListener("click", () => {
                if (erdTool !== "select") return;
                document.querySelectorAll(".db-erd-table-node.is-selected").forEach((item) => item.classList.remove("is-selected"));
                node.classList.add("is-selected");
                selectedTableName = table.name;
                renderProperties();
                selectTableInEditor(table.name);
            });
            node.addEventListener("pointerdown", (event) => {
                if (event.target.closest(".db-erd-table-settings")) return;
                if (event.detail > 1) return;
                if (erdCanvas?.classList.contains("is-space-pan")) return;
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
                        ...erdPositions[table.name.toLowerCase()],
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

    const saveServerDocument = (text, layout = erdPositions, targetCategoryId = dbCategoryId, targetCategoryName = currentSchemaName?.textContent?.trim() || "E-Commerce Schema") => {
        if (!targetCategoryId) return Promise.resolve(false);
        const body = JSON.stringify({ schemaText: text, layoutJson: JSON.stringify(layout) });
        setDbSaveStatus("pending");
        saveQueue = saveQueue.then(async () => {
            try {
                const query = new URLSearchParams({ categoryId: targetCategoryId, categoryName: targetCategoryName });
                const response = await fetch(`/api/db-modeling/schema?${query.toString()}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    keepalive: true,
                    body
                });
                if (!response.ok) throw new Error(`DB 모델 저장 실패: ${response.status}`);
                setDbSaveStatus("saved");
                setStatus(`${schema.tables.length}개 테이블 · DB 저장 완료`);
                return true;
            } catch (error) {
                console.warn(error);
                setDbSaveStatus("error");
                setStatus("DB 저장에 실패했습니다. 입력 내용은 브라우저에 보관됩니다.", true);
                return false;
            }
        });
        return saveQueue;
    };

    const scheduleServerSave = (text, layout = erdPositions) => {
        window.clearTimeout(serverSaveTimer);
        if (schemaMutationPending || !dbCategoryId) return;
        const categoryId = dbCategoryId;
        const categoryName = currentSchemaName?.textContent?.trim() || "E-Commerce Schema";
        const positions = structuredClone(layout);
        setDbSaveStatus("pending");
        serverSaveTimer = window.setTimeout(() => saveServerDocument(text, positions, categoryId, categoryName), 700);
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
        if (schemaMutationPending) return Promise.resolve();
        const query = new URLSearchParams({ categoryId });
        return fetch(`/api/db-modeling/schema?${query.toString()}`, { headers: { Accept: "application/json" } })
            .then((response) => {
                if (!response.ok) throw new Error(`DB 모델 카테고리 조회 실패: ${response.status}`);
                return response.json();
            })
            .then((document) => {
                dbCategories = Array.isArray(document?.categories) ? document.categories : dbCategories;
                if (!dbCategories.length) {
                    dbCategoryId = "";
                    localStorage.removeItem(categoryStorageKey);
                    window.clearTimeout(parseTimer);
                    window.clearTimeout(serverSaveTimer);
                    setEditorText("");
                    schema = { tables: [], refs: [] };
                    erdPositions = {};
                    selectedTableName = null;
                    renderSidebar();
                    renderErd();
                    renderSchemaOptions();
                    if (currentSchemaName) currentSchemaName.textContent = "모델링 없음";
                    monacoEditor?.updateOptions({ readOnly: true });
                    setManagementAvailability();
                    setStatus("+ 버튼으로 새 모델링을 추가하세요.");
                    setDbSaveStatus("saved", "모델링 없음");
                    return;
                }
                if (!dbCategories.some((item) => item.categoryId === categoryId)) return loadCategory(dbCategories[0].categoryId);
                dbCategoryId = categoryId;
                localStorage.setItem(categoryStorageKey, dbCategoryId);
                storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${dbCategoryId}`;
                const category = dbCategories.find((item) => item.categoryId === dbCategoryId);
                const categoryName = category?.categoryName || "E-Commerce Schema";
                if (currentSchemaName) currentSchemaName.textContent = categoryName;
                renderSchemaOptions();
                closeSchemaMenu();
                erdPositions = parseErdLayout(document?.layoutJson);
                const storedCategoryText = localStorage.getItem(storageKey);
                const categoryText = document?.schemaText || storedCategoryText || sample;
                setEditorText(categoryText);
                highlightDbml(categoryText);
                updateEditorGutter();
                setInputType(categoryText);
                applySchema(categoryText, false, false);
                monacoEditor?.updateOptions({ readOnly: false });
                setManagementAvailability();
            })
            .catch((error) => console.warn(error));
    };

    const closeSchemaAddModal = () => {
        schemaAddModal?.classList.add("hidden");
        schemaAddModal?.classList.remove("flex");
    };

    const openSchemaAddModal = (mode = "add") => {
        if (schemaMutationPending) return;
        schemaNameMode = mode === "rename" ? "rename" : "add";
        document.getElementById("db-schema-name-title").textContent = schemaNameMode === "rename" ? "이름 변경" : "스키마 추가";
        document.getElementById("db-schema-name-description").textContent = schemaNameMode === "rename" ? "현재 모델링의 이름을 변경합니다." : "새 DB 스키마 카테고리를 추가합니다.";
        document.getElementById("db-schema-name-submit").textContent = schemaNameMode === "rename" ? "변경" : "추가";
        document.getElementById("db-schema-name-error").textContent = "";
        schemaAddModal?.classList.remove("hidden");
        schemaAddModal?.classList.add("flex");
        if (schemaAddName instanceof HTMLInputElement) {
            schemaAddName.value = schemaNameMode === "rename" ? currentSchemaName?.textContent?.trim() || "" : "";
            schemaAddName.focus();
        }
    };

    const legacyAddSchemaCategory = () => {
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
        setEditorText(sample);
        applySchema(sample, false, false);
        saveServerDocument(sample, {}, categoryId, name.trim());
        closeSchemaMenu();
    };

    const addSchemaCategory = (rawName) => {
        if (schemaMutationPending) return false;
        const name = String(rawName ?? "").trim();
        if (!name || name.length > 120) {
            schemaAddName?.focus();
            return false;
        }
        const categoryId = `schema-${crypto.randomUUID()}`;
        dbCategoryId = categoryId;
        localStorage.setItem(categoryStorageKey, dbCategoryId);
        storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${dbCategoryId}`;
        if (currentSchemaName) currentSchemaName.textContent = name;
        erdPositions = {};
        dbCategories = [...dbCategories, { categoryId, categoryName: name }];
        renderSchemaOptions();
        setEditorText(sample);
        applySchema(sample, false, false);
        saveServerDocument(sample, {}, categoryId, name);
        monacoEditor?.updateOptions({ readOnly: false });
        setManagementAvailability();
        closeSchemaMenu();
        return true;
    };

    const setMode = () => {
        editorView?.classList.add("hidden");
        sidebarEditor?.classList.remove("hidden");
        sidebarEditor?.classList.add("flex");
        objectExplorer?.classList.remove("hidden");
        secondarySidebar?.classList.add("db-sidebar-editor-active");
        setSidebarCollapsed(false);
        renderErd();
    };

    const setSidebarCollapsed = (collapsed) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        secondarySidebar.classList.toggle("collapsed", collapsed);
        secondarySidebar.classList.toggle("w-64", !collapsed);
        secondarySidebar.classList.toggle("w-14", collapsed);
        secondarySidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
        secondarySidebarToggle?.setAttribute("aria-label", collapsed ? "에디터 펼치기" : "에디터 접기");
        secondarySidebarToggle?.setAttribute("title", collapsed ? "에디터 펼치기" : "에디터 접기");
        const icon = secondarySidebarToggle?.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = "chevron_right";
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
        if (Number.isFinite(stored_width) && stored_width > 0) {
            const width = Math.min(Math.max(280, Math.floor(window.innerWidth * 0.6)), Math.max(280, stored_width));
            secondarySidebar.style.setProperty("--db-sidebar-width", `${width}px`);
        } else {
            secondarySidebar.style.removeProperty("--db-sidebar-width");
        }
    };

    const resize_sidebar = (event) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        const min_width = 280;
        const max_width = Math.max(min_width, Math.floor(window.innerWidth * 0.6));
        const bounds = secondarySidebar.getBoundingClientRect();
        const pointer_width = event.clientX - bounds.left;
        const width = Math.min(max_width, Math.max(min_width, pointer_width));
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

    const erdGridStorageKey = "aastudio-erd-grid-visible";
    const setErdGridVisible = (visible) => {
        erdGrid?.classList.toggle("is-hidden", !visible);
        erdGridToggle?.setAttribute("aria-pressed", String(visible));
        erdGridToggle?.setAttribute("title", visible ? "격자 숨기기" : "격자 표시");
        erdGridToggle?.classList.toggle("bg-secondary/10", visible);
        erdGridToggle?.classList.toggle("text-secondary", visible);
        erdGridToggle?.classList.toggle("text-on-surface-variant", !visible);
        const icon = erdGridToggle?.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = visible ? "grid_on" : "grid_off";
        localStorage.setItem(erdGridStorageKey, String(visible));
    };

    document.querySelectorAll("[data-erd-tool]").forEach((button) => {
        button.addEventListener("click", () => setErdTool(button.dataset.erdTool ?? "select"));
    });
    erdGridToggle?.addEventListener("click", () => {
        setErdGridVisible(erdGrid?.classList.contains("is-hidden") ?? false);
    });
    document.getElementById("erd-zoom-in")?.parentElement?.addEventListener("click", () => {
        erdZoom = Math.min(2, Number((erdZoom + 0.1).toFixed(2)));
        applyErdViewport();
    });
    document.getElementById("erd-zoom-out")?.parentElement?.addEventListener("click", () => {
        erdZoom = Math.max(0.4, Number((erdZoom - 0.1).toFixed(2)));
        applyErdViewport();
    });
    erdCanvas?.addEventListener("wheel", (event) => {
        if (!event.ctrlKey || event.target.closest("#erd-toolbar")) return;
        event.preventDefault();
        const nextZoom = Math.max(0.4, Math.min(2, Number((erdZoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))));
        if (nextZoom === erdZoom) return;
        const bounds = erdCanvas.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        erdPanX = x - (x - erdPanX) * nextZoom / erdZoom;
        erdPanY = y - (y - erdPanY) * nextZoom / erdZoom;
        erdZoom = nextZoom;
        applyErdViewport();
    }, { passive: false });
    erdCanvas?.addEventListener("pointerdown", (event) => {
        if (!(erdTool === "pan" && event.button === 0) && event.button !== 1) return;
        if (event.target.closest("#erd-toolbar, .db-erd-table-settings")) return;
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
    let toolToastTimer;
    const showToolToast = (icon, message) => {
        let toast = document.getElementById("canvas-tool-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "canvas-tool-toast";
            toast.className = "canvas-tool-toast";
            toast.setAttribute("role", "status");
            erdCanvas.appendChild(toast);
        }
        toast.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${icon}</span><span>${message}</span>`;
        toast.classList.add("is-visible");
        clearTimeout(toolToastTimer);
        toolToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1400);
    };
    document.addEventListener("keydown", (event) => {
        if (event.code !== "Space" || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true'], .monaco-editor"))) return;
        event.preventDefault();
        if (erdCanvas?.classList.contains("is-space-pan")) return;
        erdCanvas?.classList.add("is-space-pan");
        setErdTool("pan");
        showToolToast("pan_tool", "이동 모드");
    });
    const releaseSpacePan = () => {
        const wasMoving = erdCanvas?.classList.contains("is-space-pan");
        erdCanvas?.classList.remove("is-space-pan");
        setErdTool("select");
        if (wasMoving) showToolToast("near_me", "선택 모드");
    };
    document.addEventListener("keyup", (event) => { if (event.code === "Space" && erdCanvas?.classList.contains("is-space-pan")) releaseSpacePan(); });
    window.addEventListener("blur", releaseSpacePan);
    setErdTool("select");
    applyErdViewport();
    setErdGridVisible(localStorage.getItem(erdGridStorageKey) !== "false");

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
        setEditorText(`${editor.value.trimEnd()}${block}`);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        setMode("editor");
        monacoEditor?.focus();
    });

    currentSchemaButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = schemaMenu?.classList.toggle("hidden") === false;
        currentSchemaButton.setAttribute("aria-expanded", String(isOpen));
    });
    schemaAddButton?.addEventListener("click", openSchemaAddModal);
    schemaAddCancel?.addEventListener("click", closeSchemaAddModal);
    schemaAddCancelSecondary?.addEventListener("click", closeSchemaAddModal);
    schemaAddModal?.addEventListener("click", (event) => {
        if (event.target === schemaAddModal) closeSchemaAddModal();
    });
    schemaAddForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (schemaNameMode === "rename") {
            if (await renameSchema(schemaAddName?.value)) closeSchemaAddModal();
        } else if (addSchemaCategory(schemaAddName?.value)) closeSchemaAddModal();
    });
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Node) || currentSchemaButton?.contains(event.target) || schemaMenu?.contains(event.target)) return;
        closeSchemaMenu();
    });
    const render_editor = () => applySchema(editor?.value ?? "", true);
    const closeColumnEditModal = (saved = false) => {
        if (!saved && editingColumn?.header) editingColumn.header.parentElement.style.setProperty("--erd-header-color", editingColumn.originalColor);
        editingColumn?.button?.setAttribute("aria-expanded", "false");
        columnEditModal?.classList.add("hidden");
        editingColumn = null;
    };
    columnEditModal?.addEventListener("pointerdown", (event) => { if (event.target === columnEditModal) closeColumnEditModal(); });
    window.addEventListener("resize", () => closeColumnEditModal());
    document.getElementById("db-column-edit-close")?.addEventListener("click", () => closeColumnEditModal());
    document.getElementById("db-column-edit-cancel")?.addEventListener("click", () => closeColumnEditModal());
    const closeColumnsModal = () => { columnsModal?.classList.add("hidden"); columnsModal?.classList.remove("flex"); editingColumn = null; };
    document.getElementById("db-columns-close")?.addEventListener("click", closeColumnsModal);
    document.getElementById("db-columns-cancel")?.addEventListener("click", closeColumnsModal);
    columnsModal?.addEventListener("click", (event) => { if (event.target === columnsModal) closeColumnsModal(); });
    const serializeTableInSource = (source, table) => {
        const text = String(source ?? "");
        const dbml = !/create\s+table/i.test(text);
        const tablePattern = dbml
            ? new RegExp(`(table\\s+${table.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*\\{)`, "i")
            : new RegExp(`(create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?${table.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*\\()`, "i");
        const match = tablePattern.exec(text);
        if (!match) return text;
        const opening = match.index + match[0].length - 1;
        const closing = findClosing(text, opening, dbml ? "{" : "(", dbml ? "}" : ")");
        if (closing < 0) return text;
        const lines = table.columns.map((column) => {
            const attrs = [];
            if (column.pk) attrs.push(dbml ? "pk" : "PRIMARY KEY");
            if (column.unique) attrs.push("unique");
            if (column.increment) attrs.push("increment");
            if (!column.nullable) attrs.push("not null");
            if (column.defaultValue) attrs.push(dbml ? `default: ${column.defaultValue}` : `DEFAULT ${column.defaultValue}`);
            if (dbml && column.comment) attrs.push(`note: "${String(column.comment).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
            const suffix = dbml ? (attrs.length ? ` [${attrs.join(", ")}]` : "") : ` ${attrs.join(" ")}`;
            return `  ${column.name} ${column.type}${suffix}${dbml ? "" : ","}`;
        });
        return `${text.slice(0, opening + 1)}\n${lines.join("\n")}\n${text.slice(closing)}`;
    };
    document.getElementById("db-column-add")?.addEventListener("click", () => {
        if (!editingColumn?.table) return;
        syncColumnEditorValues(editingColumn.table);
        const index = editingColumn.table.columns.length + 1;
        editingColumn.table.columns.push({ name: `new_column_${index}`, type: "varchar", nullable: true, comment: "" });
        openColumnsEditor(editingColumn.table);
    });
    columnsForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!editingColumn?.table) return;
        syncColumnEditorValues(editingColumn.table);
        [...document.querySelectorAll("#db-table-columns-editor .db-columns-grid-row")].forEach((row, index) => {
            const column = editingColumn.table.columns[index];
            const name = row.querySelector("[data-column-name]")?.value.trim();
            const type = row.querySelector("[data-column-type]")?.value.trim();
            const comment = row.querySelector("[data-column-comment]")?.value.trim() || "";
            const defaultValue = row.querySelector("[data-column-default]")?.value.trim() || undefined;
            if (column && name && type) Object.assign(column, { name, type, comment, defaultValue, nullable: row.querySelector("[data-column-nullable]")?.checked !== true });
        });
        const updatedSource = serializeTableInSource(monacoEditor?.getValue() ?? editor?.value ?? "", editingColumn.table);
        setEditorText(updatedSource);
        applySchema(updatedSource, false, false);
        saveServerDocument(updatedSource, erdPositions);
        closeColumnsModal();
    });
    const previewHeaderColor = (color) => { if (editingColumn?.header && /^#[0-9a-f]{6}$/i.test(color)) editingColumn.header.parentElement.style.setProperty("--erd-header-color", color); };
    const headerPalette = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#e67e22", "#95a5a6", "#d35400", "#c0392b", "#16a085", "#2c3e50", "#f1c40f", "#27ae60", "#8e44ad", "#2980b9", "#e84393"];
    document.getElementById("db-header-color-swatches")?.replaceChildren(...headerPalette.map((color) => {
        const swatch = document.createElement("button");
        swatch.type = "button"; swatch.className = "db-header-color-swatch"; swatch.style.backgroundColor = color; swatch.setAttribute("aria-label", color);
        swatch.addEventListener("click", () => { if (editingColumn) editingColumn.selectedColor = color; previewHeaderColor(color); });
        return swatch;
    }));
    columnEditForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!editingColumn || !editor) return;
        const oldName = editingColumn.tableName;
        const newName = document.getElementById("db-column-edit-name").value.trim();
        const color = editingColumn.selectedColor;
        if (!/^[A-Za-z_][\w]*$/.test(newName) || !/^#[0-9a-f]{6}$/i.test(color)) return;
        if (newName !== oldName && schema.tables.some((table) => table.name.toLowerCase() === newName.toLowerCase())) return;
        const key = oldName.toLowerCase();
        const layout = erdPositions[key] || {};
        erdPositions[key] = { ...layout, color };
        if (newName !== oldName) {
            const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const headerPattern = new RegExp("(Table\\s+)" + escaped + "(\\s*\\{)", "i");
            if (!headerPattern.test(editor.value)) return;
            let source = editor.value.replace(headerPattern, (match, before, after) => before + newName + after);
            source = source.replace(new RegExp("\\b" + escaped + "\\.", "g"), `${newName}.`);
            erdPositions[newName.toLowerCase()] = erdPositions[key];
            delete erdPositions[key];
            selectedTableName = newName;
            setEditorText(source);
            highlightDbml(source);
            applySchema(source, false);
        } else {
            renderErd();
            saveServerDocument(editor.value, erdPositions);
        }
        closeColumnEditModal(true);
    });
    document.getElementById("db-editor-render")?.addEventListener("click", render_editor);
    document.getElementById("db-sidebar-editor-render")?.addEventListener("click", render_editor);
    document.getElementById("db-editor-example")?.addEventListener("click", () => {
        setEditorText(sample);
        highlightDbml(sample);
        updateEditorGutter();
        applySchema(sample);
    });
    document.getElementById("db-schema-sample")?.addEventListener("click", () => {
        document.getElementById("db-editor-example")?.click();
    });
    document.getElementById("db-schema-toggle-editor")?.addEventListener("click", () => secondarySidebarToggle?.click());

    const downloadSchema = (contents, extension, contentType, rawName = currentSchemaName?.textContent?.trim() || "schema") => {
        const name = rawName.replace(/[\\/:*?"<>|]/g, "-");
        const url = URL.createObjectURL(contents instanceof Blob ? contents : new Blob([contents], { type: contentType }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${name}.${extension}`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const createSchemaBackup = () => ({ version: 1, categoryName: currentSchemaName?.textContent?.trim(), schemaText: editor?.value ?? "", layout: erdPositions });
    const setManagementAvailability = () => {
        ["db-schema-rename", "db-schema-backup", "db-schema-delete", "db-schema-sample"].forEach((id) => {
            const button = document.getElementById(id);
            if (button) button.disabled = !dbCategoryId || schemaMutationPending;
        });
        document.querySelectorAll("[data-db-export-image], [data-db-export-sql]").forEach((button) => {
            button.disabled = !dbCategoryId || schemaMutationPending || schemaExportPending;
        });
        const submit = document.getElementById("db-schema-name-submit");
        if (submit) submit.disabled = schemaMutationPending;
    };
    const beginSchemaMutation = () => {
        if (schemaMutationPending) return false;
        schemaMutationPending = true;
        window.clearTimeout(parseTimer);
        window.clearTimeout(serverSaveTimer);
        monacoEditor?.updateOptions({ readOnly: true });
        document.getElementById("db-modeling-workspace")?.style.setProperty("pointer-events", "none");
        setManagementAvailability();
        return true;
    };
    const endSchemaMutation = () => {
        schemaMutationPending = false;
        monacoEditor?.updateOptions({ readOnly: !dbCategoryId });
        document.getElementById("db-modeling-workspace")?.style.removeProperty("pointer-events");
        setManagementAvailability();
    };
    const renameSchema = async (rawName) => {
        const name = String(rawName ?? "").trim();
        if (!dbCategoryId || !name || name.length > 120 || !beginSchemaMutation()) return false;
        try {
            if (!await saveServerDocument(editor?.value ?? "", erdPositions, dbCategoryId, name)) {
                document.getElementById("db-schema-name-error").textContent = "이름을 변경하지 못했습니다. 다시 시도하세요.";
                return false;
            }
            currentSchemaName.textContent = name;
            dbCategories = dbCategories.map((item) => item.categoryId === dbCategoryId ? { ...item, categoryName: name } : item);
            renderSchemaOptions();
            return true;
        } finally { endSchemaMutation(); }
    };
    document.getElementById("db-schema-rename")?.addEventListener("click", () => openSchemaAddModal("rename"));
    document.getElementById("db-schema-backup")?.addEventListener("click", () => {
        downloadSchema(JSON.stringify(createSchemaBackup(), null, 2), "json", "application/json;charset=utf-8");
    });
    const restoreInput = document.getElementById("db-schema-restore-input");
    document.getElementById("db-schema-restore")?.addEventListener("click", () => {
        if (!schemaMutationPending) restoreInput?.click();
    });
    restoreInput?.addEventListener("change", async () => {
        const file = restoreInput.files?.[0];
        restoreInput.value = "";
        if (!file || schemaMutationPending) return;
        let backup;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error("5MB 이하의 백업 파일을 선택하세요.");
            backup = JSON.parse(await file.text());
            if (!backup || backup.version !== 1 || typeof backup.schemaText !== "string" || !backup.schemaText.trim() || !parseSchema(backup.schemaText).tables.length || typeof backup.categoryName !== "string" || !backup.categoryName.trim() || backup.categoryName.length > 120) {
                throw new Error("유효한 DB 모델링 백업 파일이 아닙니다.");
            }
            if (!backup.layout || typeof backup.layout !== "object" || Array.isArray(backup.layout)
                || Object.values(backup.layout).some((point) => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
                throw new Error("백업 파일의 테이블 위치가 올바르지 않습니다.");
            }
        } catch (error) { window.alert(error.message); return; }
        if (dbCategoryId && !window.confirm("현재 모델링을 백업 내용으로 복원하시겠습니까?")) return;
        if (!beginSchemaMutation()) return;
        try {
            const id = dbCategoryId || `schema-${crypto.randomUUID()}`;
            const name = backup.categoryName.trim();
            if (!await saveServerDocument(backup.schemaText, backup.layout, id, name)) throw new Error("백업을 저장하지 못했습니다. 현재 모델링은 변경하지 않았습니다.");
            dbCategoryId = id;
            storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "project-1")}:${id}`;
            localStorage.setItem(categoryStorageKey, id);
            erdPositions = backup.layout;
            currentSchemaName.textContent = name;
            dbCategories = [...dbCategories.filter((item) => item.categoryId !== id), { categoryId: id, categoryName: name }];
            setEditorText(backup.schemaText);
            setInputType(backup.schemaText);
            applySchema(backup.schemaText, false, false);
            renderSchemaOptions();
            setStatus("백업을 복원했습니다.");
        } catch (error) { window.alert(error.message); }
        finally { endSchemaMutation(); }
    });
    document.getElementById("db-schema-delete")?.addEventListener("click", async () => {
        if (!dbCategoryId || schemaMutationPending || !window.confirm(`'${currentSchemaName?.textContent?.trim()}' 모델링을 삭제하시겠습니까?`)) return;
        if (!beginSchemaMutation()) return;
        const id = dbCategoryId;
        try {
            await saveQueue;
            const response = await fetch(`/api/db-modeling/schema?${new URLSearchParams({ categoryId: id })}`, { method: "DELETE" });
            if (!response.ok) throw new Error("모델링을 삭제하지 못했습니다. 다시 시도하세요.");
            localStorage.removeItem(storageKey);
            dbCategories = dbCategories.filter((item) => item.categoryId !== id);
            endSchemaMutation();
            await loadCategory(dbCategories[0]?.categoryId || id);
        } catch (error) { window.alert(error.message); }
        finally { endSchemaMutation(); }
    });
    document.querySelectorAll("[data-db-export-image], [data-db-export-sql]").forEach((button) => {
        button.addEventListener("click", async () => {
            if (schemaExportPending || schemaMutationPending || !dbCategoryId) return;
            schemaExportPending = true;
            setManagementAvailability();
            try {
                const source = editor?.value ?? "";
                const model = parseSchema(source);
                const name = currentSchemaName?.textContent?.trim() || "schema";
                if (button.dataset.dbExportSql) {
                    const dialect = button.dataset.dbExportSql;
                    const sql = window.DbModelExport.toSql(model, dialect, name, source);
                    downloadSchema(sql, `${dialect}.sql`, "text/plain;charset=utf-8", name);
                } else {
                    const layout = structuredClone(erdPositions);
                    document.querySelectorAll(".db-erd-table-node").forEach((node) => {
                        layout[node.dataset.erdTable.toLowerCase()] = { x: node.offsetLeft, y: node.offsetTop };
                    });
                    const format = button.dataset.dbExportImage;
                    const blob = await window.DbModelExport.imageBlob(model, layout, name, format);
                    downloadSchema(blob, format, blob.type, name);
                }
                setStatus("내보내기 파일을 생성했습니다.");
            } catch (error) {
                window.alert(error.message || "파일을 내보내지 못했습니다.");
            } finally {
                schemaExportPending = false;
                setManagementAvailability();
            }
        });
    });
    const shareSource = document.getElementById("db-share-source");
    const shareStatus = document.getElementById("db-share-status");
    document.getElementById("db-schema-share")?.addEventListener("toggle", (event) => {
        if (!event.target.open) return;
        if (shareSource) shareSource.value = editor?.value ?? "";
        if (shareStatus) shareStatus.textContent = "";
    });
    document.getElementById("db-share-copy")?.addEventListener("click", async () => {
        const text = editor?.value ?? "";
        if (shareSource) shareSource.value = text;
        try {
            await navigator.clipboard.writeText(text);
            if (shareStatus) shareStatus.textContent = "코드를 복사했습니다.";
        } catch {
            shareSource?.focus();
            shareSource?.select();
            if (shareStatus) shareStatus.textContent = "코드를 선택했습니다. Ctrl/Cmd+C로 복사하세요.";
        }
    });
    editor?.addEventListener("input", () => {
        if (schemaMutationPending || !dbCategoryId) return;
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
    setEditorText(initialText);
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
