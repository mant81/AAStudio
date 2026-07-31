document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-history-back]").forEach((button) => {
        button.addEventListener("click", () => {
            if (window.history.length > 1) {
                window.history.back();
                return;
            }
            window.location.assign("/");
        });
    });

  document.body.dataset.uiReady = "true";

  const path = window.location.pathname;
  document.querySelectorAll("[data-nav-path]").forEach((link) => {
    const target = link.dataset.navPath;
    const isDashboard = target === "/" && path === "/";
    const isSection = target !== "/" && path.startsWith(target);
    link.classList.toggle("active", isDashboard || isSection);
  });

  document.querySelectorAll("[data-diagram-payload]").forEach((canvas) => {
    try {
      const diagram = JSON.parse(canvas.dataset.diagramPayload || "{}");
      const nodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
      const edges = Array.isArray(diagram.edges) ? diagram.edges : [];
      canvas.replaceChildren();
      if (!nodes.length) {
        const empty = document.createElement("span");
        empty.className = "empty-state";
        empty.textContent = "표시할 노드가 없습니다.";
        canvas.append(empty);
        return;
      }
      const nodeById = new Map();
      nodes.forEach((item) => {
        const node = document.createElement("div");
        node.className = "diagram-node";
        node.textContent = String(item.label || item.name || item.id || "Node");
        canvas.append(node);
        nodeById.set(String(item.id), node.textContent);
      });
      if (edges.length) {
        const links = document.createElement("div");
        links.className = "diagram-edges";
        edges.forEach((edge) => {
          const link = document.createElement("span");
          link.textContent = `${nodeById.get(String(edge.from)) || edge.from} → ${nodeById.get(String(edge.to)) || edge.to}`;
          links.append(link);
        });
        canvas.append(links);
      }
    } catch {
      canvas.textContent = "유효한 diagram JSON이 아닙니다.";
      canvas.classList.add("diagram-invalid");
    }
  });

  document.querySelectorAll(".diagram-toolbar").forEach((toolbar) => {
    const article = toolbar.closest("article");
    const canvas = article?.querySelector("[data-diagram-payload]");
    if (!canvas) return;
    let scale = 1;
    toolbar.querySelector("[data-diagram-layout]")?.addEventListener("click", () => {
      canvas.classList.toggle("vertical-layout");
    });
    toolbar.querySelectorAll("[data-diagram-zoom]").forEach((button) => {
      button.addEventListener("click", () => {
        scale = Math.max(0.6, Math.min(1.8, scale + Number(button.dataset.diagramZoom)));
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = "top left";
      });
    });
    toolbar.querySelector("[data-diagram-export]")?.addEventListener("click", (event) => {
      try {
        const payload = JSON.parse(canvas.dataset.diagramPayload || "{}");
        const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
        const edges = Array.isArray(payload.edges) ? payload.edges : [];
        const width = Math.max(520, nodes.length * 170 + 40);
        const height = 220;
        const positions = new Map(nodes.map((node, index) => [
          String(node.id), { x: 30 + index * 170, y: 75, label: String(node.label || node.name || node.id || "Node") }
        ]));
        const escapeXml = (value) => value.replace(/[<>&"']/g, (character) => ({
          "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;"
        })[character]);
        const lines = edges.map((edge) => {
          const from = positions.get(String(edge.from));
          const to = positions.get(String(edge.to));
          return from && to ? `<line x1="${from.x + 120}" y1="${from.y + 28}" x2="${to.x}" y2="${to.y + 28}" stroke="#0f766e" stroke-width="2" marker-end="url(#arrow)"/>` : "";
        }).join("");
        const boxes = [...positions.values()].map((node) =>
          `<g><rect x="${node.x}" y="${node.y}" width="120" height="56" rx="8" fill="#fff" stroke="#14b8a6"/><text x="${node.x + 60}" y="${node.y + 34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#134e4a">${escapeXml(node.label)}</text></g>`
        ).join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f8fffe"/><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0f766e"/></marker></defs>${lines}${boxes}</svg>`;
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        const link = document.createElement("a");
        const name = event.currentTarget.dataset.diagramName || "diagram";
        link.href = blobUrl;
        link.download = `${name.replace(/[^\p{L}\p{N}._-]+/gu, "-")}.svg`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.alert("다이어그램을 SVG로 내보낼 수 없습니다.");
      }
    });
  });

  const workbenchSearch = document.querySelector("[data-workbench-search]");
  if (workbenchSearch) {
    workbenchSearch.addEventListener("input", () => {
      const query = workbenchSearch.value.trim().toLocaleLowerCase();
      document.querySelectorAll(".workbench-content .record-list > article").forEach((card) => {
        card.hidden = query.length > 0 && !card.textContent.toLocaleLowerCase().includes(query);
      });
    });
  }

  document.querySelectorAll("[data-record-filter]").forEach((filter) => {
    filter.addEventListener("change", () => {
      const value = filter.value.trim().toLocaleUpperCase();
      const panel = filter.closest(".workspace-panel");
      panel?.querySelectorAll(".record-list > article[data-filter-value]").forEach((card) => {
        card.hidden = value.length > 0 && !card.dataset.filterValue.toLocaleUpperCase().includes(value);
      });
    });
  });

  document.querySelectorAll("[data-copy-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = document.querySelector("[data-share-path]");
      if (!input) return;
      const absoluteUrl = new URL(input.value, window.location.origin).toString();
      try {
        await navigator.clipboard.writeText(absoluteUrl);
        button.textContent = "Copied";
      } catch {
        input.value = absoluteUrl;
        input.select();
      }
    });
  });

  document.querySelectorAll("[data-wiki-insert-link]").forEach((button) => {
    button.addEventListener("click", () => {
      const form = button.closest("form");
      const editor = form?.querySelector(".wiki-content-editor");
      if (!editor) return;
      const url = window.prompt("링크 URL을 입력하세요.");
      if (!url) return;
      const label = window.prompt("링크 표시 이름을 입력하세요.", "Link") || "Link";
      const insertion = `[${label}](${url})`;
      const start = editor.selectionStart;
      editor.setRangeText(insertion, start, editor.selectionEnd, "end");
      editor.focus();
    });
  });

  document.querySelectorAll("[data-compare-versions]").forEach((button) => {
    button.addEventListener("click", () => {
      const container = button.closest(".version-compare");
      const left = container?.querySelector("[data-version-left]");
      const right = container?.querySelector("[data-version-right]");
      const output = container?.querySelector("[data-version-diff]");
      if (!left || !right || !output) return;
      const leftLines = (left.selectedOptions[0]?.dataset.content || "").split(/\r?\n/);
      const rightLines = (right.selectedOptions[0]?.dataset.content || "").split(/\r?\n/);
      const length = Math.max(leftLines.length, rightLines.length);
      const diff = [];
      for (let index = 0; index < length; index += 1) {
        const before = leftLines[index];
        const after = rightLines[index];
        if (before === after) diff.push(`  ${before || ""}`);
        else {
          if (before !== undefined) diff.push(`- ${before}`);
          if (after !== undefined) diff.push(`+ ${after}`);
        }
      }
      output.textContent = diff.join("\n");
      output.hidden = false;
    });
  });

  const inspector = document.querySelector("[data-selection-inspector]");
  if (inspector) {
    const empty = inspector.querySelector(".inspector-empty");
    const content = inspector.querySelector(".inspector-content");
    const title = inspector.querySelector("[data-inspector-title]");
    const body = inspector.querySelector("[data-inspector-body]");
    const select = (article) => {
      document.querySelectorAll(".workbench-shell .record-list > article.selected").forEach((item) => item.classList.remove("selected"));
      article.classList.add("selected");
      title.textContent = article.querySelector("strong")?.textContent?.trim() || "Selected item";
      body.textContent = article.innerText.trim().slice(0, 2000);
      empty.hidden = true;
      content.hidden = false;
    };
    document.querySelectorAll(".workbench-shell .record-list > article").forEach((article) => {
      article.tabIndex = 0;
      article.addEventListener("click", (event) => {
        if (!event.target.closest("button,a,input,select,textarea,summary")) select(article);
      });
      article.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(article);
        }
      });
    });
  }
});
