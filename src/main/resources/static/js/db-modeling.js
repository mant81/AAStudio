(() => {
    const editor = document.getElementById("db-schema-editor");
    const editorView = document.getElementById("db-editor-view");
    const erdView = document.getElementById("db-erd-view");
    const editorStatus = document.getElementById("db-editor-status");
    const inputType = document.getElementById("db-editor-input-type");
    const canvas = document.getElementById("canvas-pan-area");
    const linesLayer = document.getElementById("erd-lines");
    const secondarySidebar = document.getElementById("secondary-sidebar");
    const secondarySidebarToggle = document.getElementById("secondary-sidebar-toggle");
    const objectSearch = document.getElementById("db-object-search");
    const newTableButton = document.getElementById("db-new-table-button");
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
    const storageKey = `aastudio-db-modeling-schema:${decodeURIComponent(currentProjectId || "alpha")}`;
    let schema = { tables: [], refs: [] };
    let parseTimer = null;
    let serverSaveTimer = null;

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
        const match = String(value).trim().match(/^[A-Za-z][\w]*(?:\s*\([^)]*\))?/);
        return match ? match[0].replace(/\s+/g, " ") : "text";
    };

    const ensureTable = (tables, name) => {
        const existing = tables.find((table) => table.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;
        const table = { name, columns: [] };
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
                const columnMatch = line.match(/^([`"\w.-]+)\s+([^\s\[]+)(?:\s*\[([^\]]+)\])?/);
                if (!columnMatch) return;
                const attributes = columnMatch[3] ?? "";
                const pk = /\bpk\b/i.test(attributes);
                addColumn(table, { name: unquote(columnMatch[1]), type: columnMatch[2], pk, nullable: !pk && !/not null/i.test(attributes) });
                const inlineRef = attributes.match(/ref\s*:\s*[<>-]\s*([^.\s\]]+)\.([^\s\]]+)/i);
                if (inlineRef) {
                    refs.push({ fromTable: table.name, fromColumn: unquote(columnMatch[1]), toTable: unquote(inlineRef[1]), toColumn: unquote(inlineRef[2]) });
                }
            });
            tableMatch.lastIndex = close + 1;
        }
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

    const renderErd = () => {
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

    const scheduleServerSave = (text) => {
        window.clearTimeout(serverSaveTimer);
        serverSaveTimer = window.setTimeout(async () => {
            try {
                const response = await fetch("/api/db-modeling/schema", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ schemaText: text })
                });
                if (!response.ok) throw new Error(`DB 모델 저장 실패: ${response.status}`);
                setStatus(`${schema.tables.length}개 테이블 · DB 저장 완료`);
            } catch (error) {
                console.warn(error);
                setStatus("DB 저장에 실패했습니다. 입력 내용은 브라우저에 보관됩니다.", true);
            }
        }, 700);
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

    const setMode = (mode) => {
        editorView?.classList.toggle("hidden", mode !== "editor");
        erdView?.classList.toggle("hidden", mode !== "erd");
        document.querySelectorAll("[data-db-mode]").forEach((button) => {
            const active = button.dataset.dbMode === mode;
            button.classList.toggle("bg-surface-white", active);
            button.classList.toggle("text-secondary", active);
            button.classList.toggle("shadow-sm", active);
            button.classList.toggle("text-on-surface-variant", !active);
        });
        if (mode === "erd") renderErd();
    };

    const setSidebarCollapsed = (collapsed) => {
        if (!(secondarySidebar instanceof HTMLElement)) return;
        secondarySidebar.classList.toggle("collapsed", collapsed);
        secondarySidebar.classList.toggle("w-64", !collapsed);
        secondarySidebar.classList.toggle("w-14", collapsed);
        secondarySidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
        const icon = secondarySidebarToggle?.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = collapsed ? "chevron_right" : "chevron_left";
        localStorage.setItem("aastudio-db-sidebar-collapsed", String(collapsed));
    };

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
    document.getElementById("db-editor-render")?.addEventListener("click", () => applySchema(editor?.value ?? "", true));
    document.getElementById("db-editor-example")?.addEventListener("click", () => {
        if (editor) editor.value = sample;
        applySchema(sample);
    });
    editor?.addEventListener("input", () => {
        setInputType(editor.value);
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

    const stored = localStorage.getItem(storageKey);
    const initialText = stored || sample;
    if (editor) editor.value = initialText;
    setInputType(editor?.value ?? sample);
    applySchema(editor?.value ?? sample, false, false);
    setMode("editor");

    fetch("/api/db-modeling/schema", { headers: { Accept: "application/json" } })
        .then((response) => {
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`DB 모델 조회 실패: ${response.status}`);
            return response.json();
        })
        .then((document) => {
            if (document?.schemaText) {
                if (editor) editor.value = document.schemaText;
                setInputType(document.schemaText);
                applySchema(document.schemaText, false, false);
            } else if (stored) {
                scheduleServerSave(stored);
            }
        })
        .catch((error) => console.warn(error));
})();
