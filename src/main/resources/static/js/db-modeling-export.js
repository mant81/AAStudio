(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.DbModelExport = api;
})(globalThis, () => {
    "use strict";

    const dialects = { postgresql: "PostgreSQL", mysql: "MySQL / MariaDB", sqlserver: "SQL Server", oracle: "Oracle" };
    const xml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
    const literal = (value) => `'${String(value).replace(/'/g, "''")}'`;
    const comment = (value) => String(value ?? "").replace(/[\r\n\u2028\u2029]+/g, " ");
    const quote = (value, dialect) => {
        const name = String(value);
        if (!name || /\0/.test(name)) throw new Error("식별자 이름이 올바르지 않습니다.");
        if (dialect === "mysql") return `\`${name.replace(/`/g, "``")}\``;
        if (dialect === "sqlserver") return `[${name.replace(/]/g, "]]")}]`;
        return `"${name.replace(/"/g, '""')}"`;
    };
    const tableName = (name, dialect) => String(name).split(".").map((part) => quote(part, dialect)).join(".");

    function columnType(type, dialect) {
        const match = String(type).trim().toLowerCase().match(/^([a-z][\w]*(?:\s+(?:varying|precision))?)(?:\s*\(\s*([\d\s,]+|max)\s*\))?$/);
        if (!match) throw new Error(`자료형 '${type}'을 ${dialects[dialect]}로 변환할 수 없습니다.`);
        const base = match[1], args = match[2]?.replace(/\s/g, "");
        const integers = { int: 10, integer: 10, int4: 10, serial: 10, smallint: 5, int2: 5, smallserial: 5, bigint: 19, int8: 19, bigserial: 19, tinyint: 3, mediumint: 8 };
        if (base in integers) {
            if (dialect === "oracle") return `NUMBER(${integers[base]})`;
            if (["bigint", "int8", "bigserial"].includes(base)) return "BIGINT";
            if (["smallint", "int2", "smallserial", "tinyint"].includes(base)) return dialect === "mysql" && base === "tinyint" ? "TINYINT" : "SMALLINT";
            return "INT";
        }
        if (["boolean", "bool", "bit"].includes(base)) {
            if (args && args !== "1") throw new Error("여러 비트로 구성된 BIT 자료형은 자동 변환을 지원하지 않습니다.");
            return { postgresql: "BOOLEAN", mysql: "BOOLEAN", sqlserver: "BIT", oracle: "NUMBER(1)" }[dialect];
        }
        if (["uuid", "uniqueidentifier"].includes(base)) return { postgresql: "UUID", mysql: "CHAR(36)", sqlserver: "UNIQUEIDENTIFIER", oracle: "RAW(16)" }[dialect];
        if (["decimal", "numeric", "number"].includes(base)) return `${dialect === "oracle" ? "NUMBER" : "DECIMAL"}${args ? `(${args})` : ""}`;
        if (["float", "double", "double precision", "real", "binary_float", "binary_double"].includes(base)) {
            const single = ["real", "binary_float"].includes(base);
            return dialect === "oracle" ? (single ? "BINARY_FLOAT" : "BINARY_DOUBLE") : dialect === "sqlserver" ? (single ? "REAL" : "FLOAT") : dialect === "postgresql" ? (single ? "REAL" : "DOUBLE PRECISION") : (single ? "FLOAT" : "DOUBLE");
        }
        if (["text", "longtext", "mediumtext", "clob", "nclob", "json", "jsonb"].includes(base) || args === "max") {
            if (dialect === "postgresql") return base === "json" || base === "jsonb" ? base.toUpperCase() : "TEXT";
            if (dialect === "mysql") return base === "json" || base === "jsonb" ? "JSON" : "LONGTEXT";
            return dialect === "oracle" ? "CLOB" : "NVARCHAR(MAX)";
        }
        if (["varchar", "character varying", "nvarchar", "varchar2", "nvarchar2", "char", "nchar"].includes(base)) {
            const fixed = ["char", "nchar"].includes(base), national = base.startsWith("n");
            const length = args || (fixed ? "1" : "255");
            if (!/^\d+$/.test(length) || Number(length) < 1) throw new Error(`자료형 '${type}'의 길이가 올바르지 않습니다.`);
            if (dialect === "oracle") return `${fixed ? (national ? "NCHAR" : "CHAR") : (national ? "NVARCHAR2" : "VARCHAR2")}(${length}${national ? "" : " CHAR"})`;
            return `${national && dialect === "sqlserver" ? "N" : ""}${fixed ? "CHAR" : "VARCHAR"}(${length})`;
        }
        if (base === "date") return "DATE";
        if (["timestamp", "datetime", "datetime2", "timestamptz", "datetimeoffset"].includes(base)) {
            const zone = ["timestamptz", "datetimeoffset"].includes(base);
            if (zone && dialect === "mysql") throw new Error("시간대 자료형은 MySQL/MariaDB 내보내기 전에 변환해야 합니다.");
            if (dialect === "sqlserver") return `${zone ? "DATETIMEOFFSET" : "DATETIME2"}${args ? `(${args})` : ""}`;
            if (dialect === "mysql") return `${base.startsWith("datetime") ? "DATETIME" : "TIMESTAMP"}${args ? `(${args})` : ""}`;
            return `TIMESTAMP${args ? `(${args})` : ""}${zone ? " WITH TIME ZONE" : ""}`;
        }
        if (base === "time" && dialect !== "oracle") return `TIME${args ? `(${args})` : ""}`;
        if (["blob", "bytea", "binary", "varbinary", "raw"].includes(base)) {
            if (dialect === "postgresql") return "BYTEA";
            if (dialect === "mysql") return args ? `VARBINARY(${args})` : "LONGBLOB";
            if (dialect === "sqlserver") return `VARBINARY(${args || "MAX"})`;
            return args ? `RAW(${args})` : "BLOB";
        }
        throw new Error(`자료형 '${type}'은 ${dialects[dialect]} 내보내기에서 지원하지 않습니다.`);
    }

    function defaultSql(value, dialect) {
        const text = String(value).trim().replace(/^`([\s\S]*)`$/, "$1").replace(/^N(?=')/i, "");
        if (/^'(?:[^']|'')*'$/.test(text)) return `${dialect === "sqlserver" ? "N" : ""}${text}`;
        if (/^"[\s\S]*"$/.test(text)) return `${dialect === "sqlserver" ? "N" : ""}${literal(text.slice(1, -1))}`;
        if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || /^null$/i.test(text)) return text.toUpperCase();
        if (/^(true|false)$/i.test(text)) return ["oracle", "sqlserver"].includes(dialect) ? (/^true$/i.test(text) ? "1" : "0") : text.toUpperCase();
        if (/^(current_timestamp(?:\(\))?|now\(\)|getdate\(\)|sysdate|systimestamp)$/i.test(text)) return dialect === "oracle" ? "SYSTIMESTAMP" : "CURRENT_TIMESTAMP";
        if (/^current_date(?:\(\))?$/i.test(text)) return dialect === "sqlserver" ? "CAST(GETDATE() AS DATE)" : "CURRENT_DATE";
        if (/^(uuid\(\)|gen_random_uuid\(\)|newid\(\)|sys_guid\(\))$/i.test(text)) return { postgresql: "gen_random_uuid()", mysql: "(UUID())", sqlserver: "NEWID()", oracle: "SYS_GUID()" }[dialect];
        throw new Error(`기본값 '${text}'을 자동 변환할 수 없습니다. 기본값을 확인하세요.`);
    }

    function toSql(model, dialect, title = "Schema", source = "") {
        if (!dialects[dialect]) throw new Error("지원하지 않는 SQL 형식입니다.");
        const structure = source.replace(/\/\*[\s\S]*?\*\/|--[^\r\n]*|\/\/[^\r\n]*|'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"/g, " ");
        if (/\b(?:indexes|enum)\s*\{|\bcheck\s*\(|\bcreate\s+(?:unique\s+)?index\b|(?:^|[,\r\n])\s*(?:unique\s+)?(?:key|index)\b|\bunique\s*(?:key\s+\w+\s*)?\(|\bcreate\s+(?:view|trigger|procedure|function)\b/i.test(structure)) {
            throw new Error("인덱스·CHECK·ENUM 등 추가 정의는 아직 SQL 변환을 지원하지 않습니다. 해당 정의를 확인하세요.");
        }
        if (/\bon\s+(?:delete|update)\b|\b(?:delete|update)\s*:|\bunsigned\b|\bgenerated\s+always\s+as\s*\(|\b\w+\s*\[\s*\]|\bwith(?:out)?\s+time\s+zone\b/i.test(structure)) {
            throw new Error("참조 동작·UNSIGNED·계산 컬럼·배열·시간대 수식은 아직 SQL 변환을 지원하지 않습니다. 해당 정의를 확인하세요.");
        }
        if (!model.tables?.length) throw new Error("내보낼 테이블이 없습니다. 스키마를 먼저 작성하세요.");
        const blocks = [`-- ${comment(title)}\n-- AAStudio / ${dialects[dialect]}`];
        const tables = new Map(model.tables.map((table) => [table.name.toLowerCase(), table]));
        for (const table of model.tables) {
            if (!table.columns.length) throw new Error(`'${table.name}' 테이블에 컬럼이 없습니다.`);
            const lines = [];
            for (const column of table.columns) {
                const type = columnType(column.type, dialect);
                const increment = column.increment || /^(?:big|small)?serial$/i.test(column.type);
                if (increment && !/^(INT|BIGINT|SMALLINT|TINYINT|NUMBER\(\d+\))$/.test(type)) throw new Error(`'${column.name}'의 자동 증가 자료형을 확인하세요.`);
                if (increment && column.defaultValue != null) throw new Error(`'${column.name}'에는 자동 증가와 기본값을 함께 지정할 수 없습니다.`);
                const identity = increment ? { postgresql: " GENERATED BY DEFAULT AS IDENTITY", mysql: " AUTO_INCREMENT", sqlserver: " IDENTITY(1,1)", oracle: " GENERATED BY DEFAULT AS IDENTITY" }[dialect] : "";
                let definition = `    ${quote(column.name, dialect)} ${type}${identity}${column.pk || !column.nullable ? " NOT NULL" : ""}`;
                if (column.defaultValue != null) {
                    const value = defaultSql(column.defaultValue, dialect);
                    definition += ` DEFAULT ${dialect === "mysql" && /^(JSON|LONGTEXT|LONGBLOB)$/.test(type) ? `(${value})` : value}`;
                }
                if (column.unique && !column.pk || increment && dialect === "mysql" && !column.pk) definition += " UNIQUE";
                if (/^jsonb?$/i.test(column.type) && dialect === "sqlserver") definition += ` CHECK (ISJSON(${quote(column.name, dialect)}) = 1)`;
                if (/^jsonb?$/i.test(column.type) && dialect === "oracle") definition += ` CHECK (${quote(column.name, dialect)} IS JSON)`;
                if (dialect === "mysql" && column.comment) definition += ` COMMENT ${literal(column.comment)}`;
                if (column.comment && dialect !== "mysql") lines.push(`    -- ${comment(column.comment)}`);
                lines.push(definition);
            }
            // Comments stay outside comma-separated definitions.
            const definitions = lines.map((line, index) => line.trimStart().startsWith("--") ? line : line + (lines.slice(index + 1).some((next) => !next.trimStart().startsWith("--")) ? "," : ""));
            const pk = table.columns.filter((column) => column.pk).map((column) => quote(column.name, dialect));
            if (pk.length) {
                const last = definitions.findLastIndex((line) => !line.trimStart().startsWith("--"));
                definitions[last] += ",";
                definitions.push(`    PRIMARY KEY (${pk.join(", ")})`);
            }
            const suffix = dialect === "mysql" ? ` ENGINE=InnoDB${table.comment ? ` COMMENT=${literal(table.comment)}` : ""}` : "";
            blocks.push(`${table.comment ? `-- ${comment(table.comment)}\n` : ""}CREATE TABLE ${tableName(table.name, dialect)} (\n${definitions.join("\n")}\n)${suffix};`);
        }
        for (const [index, ref] of (model.refs || []).entries()) {
            const from = tables.get(ref.fromTable.toLowerCase()), to = tables.get(ref.toTable.toLowerCase());
            const fromColumns = ref.fromColumns || [ref.fromColumn], toColumns = ref.toColumns || [ref.toColumn];
            if (!from || !to || fromColumns.length !== toColumns.length || fromColumns.some((name) => !from.columns.some((c) => c.name.toLowerCase() === name.toLowerCase())) || toColumns.some((name) => !to.columns.some((c) => c.name.toLowerCase() === name.toLowerCase()))) throw new Error("외래키의 테이블과 컬럼 정의를 확인하세요.");
            const constraint = `fk_${from.name.replace(/[^a-z0-9_]/gi, "_").slice(0, 20)}_${index + 1}`;
            blocks.push(`ALTER TABLE ${tableName(from.name, dialect)} ADD CONSTRAINT ${quote(constraint, dialect)} FOREIGN KEY (${fromColumns.map((name) => quote(name, dialect)).join(", ")}) REFERENCES ${tableName(to.name, dialect)} (${toColumns.map((name) => quote(name, dialect)).join(", ")});`);
        }
        return blocks.join("\n\n") + "\n";
    }

    function toSvg(model, positions = {}, title = "ERD") {
        if (!model.tables?.length) throw new Error("내보낼 테이블이 없습니다. 스키마를 먼저 작성하세요.");
        const cards = model.tables.map((table, index) => {
            const position = positions[table.name.toLowerCase()] || {};
            return { table, x: Number.isFinite(position.x) ? position.x : 48 + index % 3 * 300, y: Number.isFinite(position.y) ? position.y : 48 + Math.floor(index / 3) * 230, w: 256, h: 40 + Math.max(1, table.columns.length) * 34 };
        });
        const minX = Math.min(...cards.map((card) => card.x)) - 96, minY = Math.min(...cards.map((card) => card.y)) - 48;
        const width = Math.max(...cards.map((card) => card.x + card.w)) - minX + 96;
        const height = Math.max(...cards.map((card) => card.y + card.h)) - minY + 48;
        const byName = new Map(cards.map((card) => [card.table.name.toLowerCase(), card]));
        const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" role="img"><title>${xml(title)}</title><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f5f7fb"/><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#4383a7"/></marker></defs>`];
        for (const ref of model.refs || []) {
            const from = byName.get(ref.fromTable.toLowerCase()), to = byName.get(ref.toTable.toLowerCase());
            if (!from || !to) continue;
            const right = to.x + to.w / 2 >= from.x + from.w / 2;
            const x1 = from.x + (right ? from.w : 0), x2 = to.x + (right ? 0 : to.w);
            const y1 = from.y + 57 + Math.max(0, from.table.columns.findIndex((c) => c.name.toLowerCase() === ref.fromColumn.toLowerCase())) * 34;
            const y2 = to.y + 57 + Math.max(0, to.table.columns.findIndex((c) => c.name.toLowerCase() === ref.toColumn.toLowerCase())) * 34;
            const bend = Math.max(56, Math.min(160, Math.abs(x2 - x1) / 2)) * (right ? 1 : -1);
            svg.push(`<path d="M${x1} ${y1}C${x1 + bend} ${y1},${x2 - bend} ${y2},${x2} ${y2}" stroke="#4383a7" fill="none" stroke-width="1.5" marker-end="url(#arrow)"/>`);
        }
        cards.forEach(({ table, x, y, w, h }, index) => {
            svg.push(`<g font-family="Arial, sans-serif"><title>${xml(table.comment || table.name)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="white" stroke="#cbd5e1"/><path d="M${x + 7} ${y}H${x + w - 7}Q${x + w} ${y} ${x + w} ${y + 7}V${y + 40}H${x}V${y + 7}Q${x} ${y} ${x + 7} ${y}" fill="#0876a5"/><text x="${x + 12}" y="${y + 25}" fill="white" font-weight="bold" font-size="13">${xml(table.name.length > 27 ? table.name.slice(0, 26) + "…" : table.name)}</text><clipPath id="names-${index}"><rect x="${x + 32}" y="${y + 40}" width="110" height="${h - 40}"/></clipPath>`);
            table.columns.forEach((column, row) => {
                const top = y + 40 + row * 34;
                const fk = (model.refs || []).some((ref) => ref.fromTable.toLowerCase() === table.name.toLowerCase() && ref.fromColumn.toLowerCase() === column.name.toLowerCase());
                const role = column.pk ? "PK" : fk ? "FK" : "";
                const type = String(column.type) + (column.nullable ? "" : " !");
                svg.push(`<g><title>${xml(`${column.name}: ${column.type}${column.comment ? ` — ${column.comment}` : ""}`)}</title><path d="M${x} ${top}H${x + w}" stroke="#e7edf3"/>${role ? `<text x="${x + 6}" y="${top + 19}" font-size="9" fill="${column.pk ? "#986500" : "#0876a5"}">${role}</text>` : ""}<text clip-path="url(#names-${index})" x="${x + 32}" y="${top + 19}" font-size="12" fill="#263b50">${xml(column.name)}</text><text x="${x + w - 10}" y="${top + 19}" text-anchor="end" font-size="11" fill="#64748b">${xml(type.length > 17 ? type.slice(0, 16) + "…" : type)}</text></g>`);
            });
            svg.push("</g>");
        });
        svg.push("</svg>");
        return { svg: svg.join(""), width, height };
    }

    async function rasterize(drawing) {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(drawing.svg)}`;
        await image.decode();
        const scale = Math.min(2, 4096 / drawing.width, 4096 / drawing.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(drawing.width * scale));
        canvas.height = Math.max(1, Math.ceil(drawing.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("이미지를 생성할 수 없습니다.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    function pdfFromCanvas(canvas) {
        const image = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.95).split(",")[1]), (c) => c.charCodeAt(0));
        const encoder = new TextEncoder(), chunks = [], offsets = [0];
        let position = 0;
        const append = (value) => { const bytes = value instanceof Uint8Array ? value : encoder.encode(value); chunks.push(bytes); position += bytes.length; };
        const object = (id, text, stream) => {
            offsets[id] = position;
            append(`${id} 0 obj\n${text}\n`);
            if (stream) { append("stream\n"); append(stream); append("\nendstream\n"); }
            append("endobj\n");
        };
        const pageW = canvas.width >= canvas.height ? 842 : 595, pageH = canvas.width >= canvas.height ? 595 : 842;
        const scale = Math.min((pageW - 48) / canvas.width, (pageH - 48) / canvas.height);
        const w = canvas.width * scale, h = canvas.height * scale;
        append("%PDF-1.4\n");
        object(1, "<< /Type /Catalog /Pages 2 0 R >>");
        object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
        object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
        object(4, `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`, image);
        const content = encoder.encode(`q\n${w} 0 0 ${h} ${(pageW - w) / 2} ${(pageH - h) / 2} cm\n/Im0 Do\nQ\n`);
        object(5, `<< /Length ${content.length} >>`, content);
        const xref = position;
        append("xref\n0 6\n0000000000 65535 f \n");
        for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
        append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
        return new Blob(chunks, { type: "application/pdf" });
    }

    async function imageBlob(model, positions, title, format) {
        const drawing = toSvg(model, positions, title);
        if (format === "svg") return new Blob([drawing.svg], { type: "image/svg+xml;charset=utf-8" });
        const canvas = await rasterize(drawing);
        if (format === "pdf") return pdfFromCanvas(canvas);
        if (format !== "png") throw new Error("지원하지 않는 이미지 형식입니다.");
        return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG를 생성할 수 없습니다.")), "image/png"));
    }

    return { toSql, columnType, toSvg, imageBlob };
});
