const projectStorageKey = "aastudio:projects";
const activeProjectKey = "aastudio:active-project-id";
const activeSectionKey = "aastudio:active-section-id";

const menuItems = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: "ri-dashboard-3-line",
    title: "프로젝트 개요",
    description: "프로젝트 상태와 폴더 구조를 한 번에 확인하는 시작 화면입니다.",
  },
  {
    id: "diagram",
    label: "다이어그램",
    icon: "ri-node-tree",
    title: "시각 설계 폴더",
    description: "독립된 다이어그램 작업을 프로젝트 안의 폴더처럼 관리합니다.",
  },
  {
    id: "db-modeling",
    label: "DB모델링",
    icon: "ri-database-2-line",
    title: "데이터 구조 폴더",
    description: "테이블, 관계, 속성을 같은 프로젝트 기준으로 묶어 둡니다.",
  },
  {
    id: "api-definition",
    label: "API정의서",
    icon: "ri-file-list-3-line",
    title: "인터페이스 폴더",
    description: "요청과 응답 규격을 프로젝트 폴더 단위로 정리합니다.",
  },
  {
    id: "wiki",
    label: "WIKI",
    icon: "ri-article-line",
    title: "문서 폴더",
    description: "메모, 가이드, 정책을 한 공간에서 이어서 볼 수 있습니다.",
  },
];

const railItems = [
  { id: "dashboard", icon: "ri-dashboard-3-line", label: "Dashboard", sectionId: "dashboard" },
  { id: "diagram", icon: "ri-node-tree", label: "Diagram", sectionId: "diagram" },
  { id: "db-modeling", icon: "ri-database-2-line", label: "DB Model", sectionId: "db-modeling" },
  { id: "api-definition", icon: "ri-article-line", label: "API", sectionId: "api-definition" },
  { id: "wiki", icon: "ri-file-list-3-line", label: "Wiki", sectionId: "wiki" },
  { id: "meeting", icon: "ri-file-list-3-line", label: "Meeting", sectionId: "meeting" },
  { id: "whiteboard", icon: "ri-brush-line", label: "Whiteboard", sectionId: "whiteboard" },
  { id: "settings", icon: "ri-settings-3-line", label: "Settings", sectionId: "settings" }
];

const editorViews = {
  dashboard: {
    title: "project_overview",
    schema: "public",
    tables: [
      { id: "projects", name: "projects", description: "프로젝트 목록" },
      { id: "project_members", name: "project_members", description: "프로젝트 멤버" },
      { id: "project_activity", name: "project_activity", description: "최근 활동" },
      { id: "project_wiki", name: "project_wiki", description: "위키 문서" },
    ],
  },
  diagram: {
    title: "diagram_tabs",
    schema: "public",
    tables: [
      { id: "diagram_tabs", name: "diagram_tabs", description: "다이어그램 탭" },
      { id: "diagram_nodes", name: "diagram_nodes", description: "노드 데이터" },
      { id: "diagram_links", name: "diagram_links", description: "연결선 데이터" },
      { id: "diagram_history", name: "diagram_history", description: "작업 이력" },
    ],
  },
  "db-modeling": {
    title: "db_modeling",
    schema: "public",
    tables: [
      { id: "db_models", name: "db_models", description: "모델 목록" },
      { id: "db_tables", name: "db_tables", description: "테이블 정의" },
      { id: "db_relations", name: "db_relations", description: "관계 정의" },
      { id: "db_columns", name: "db_columns", description: "컬럼 정의" },
    ],
  },
  "api-definition": {
    title: "api_definition",
    schema: "public",
    tables: [
      { id: "api_docs", name: "api_docs", description: "API 문서" },
      { id: "api_endpoints", name: "api_endpoints", description: "엔드포인트" },
      { id: "api_requests", name: "api_requests", description: "요청 예시" },
      { id: "api_responses", name: "api_responses", description: "응답 예시" },
    ],
  },
  wiki: {
    title: "wiki_pages",
    schema: "public",
    tables: [
      { id: "wiki_pages", name: "wiki_pages", description: "페이지 목록" },
      { id: "wiki_sections", name: "wiki_sections", description: "섹션" },
      { id: "wiki_tags", name: "wiki_tags", description: "태그" },
      { id: "wiki_comments", name: "wiki_comments", description: "댓글" },
    ],
  },
};

const projectSwitcherToggle = document.getElementById("projectSwitcherToggle");
const projectSwitcherText = document.getElementById("projectSwitcherText");
const projectDropdown = document.getElementById("projectDropdown");
const projectDropdownList = document.getElementById("projectDropdownList");
const createProjectDropdownBtn = document.getElementById("createProjectDropdownBtn");
const commonModal = document.getElementById("commonModal");
const commonModalTitle = document.getElementById("commonModalTitle");
const commonModalDescription = document.getElementById("commonModalDescription");
const commonModalInput = document.getElementById("commonModalInput");
const commonModalConfirm = document.getElementById("commonModalConfirm");
const railMenu = document.getElementById("railMenu");
const workspaceGrid = document.getElementById("workspaceGrid");
const layout = document.querySelector(".layout");

const state = {
  projects: [],
  activeProjectId: null,
  activeSectionId: "dashboard",
  activeTableId: null,
  dropdownOpen: false,
  commonModalOpen: false,
};

const commonModalState = {
  onConfirm: null,
  confirmText: "확인",
  title: "제목 변경",
  description: "프로젝트 이름을 입력하세요.",
};

function createProjectId() {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getNextProjectDefaultName(projects = []) {
  return `Project ${projects.length + 1}`;
}

function normalizeProject(project, index = 0) {
  const now = Date.now();
  return {
    id: String(project?.id || createProjectId()),
    name: String(project?.name || `Project ${index + 1}`),
    status: project?.status === "archived" ? "archived" : "active",
    description: String(project?.description || "프로젝트 단위 작업 공간"),
    createdAt: Number(project?.createdAt || now),
    updatedAt: Number(project?.updatedAt || now),
  };
}

function loadProjects() {
  try {
    const data = JSON.parse(localStorage.getItem(projectStorageKey) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  localStorage.setItem(projectStorageKey, JSON.stringify(projects));
}

function ensureProjects() {
  const projects = loadProjects();
  if (projects.length) {
    const normalized = projects.map((project, index) => normalizeProject(project, index));
    if (JSON.stringify(projects) !== JSON.stringify(normalized)) {
      saveProjects(normalized);
    }
    return normalized;
  }

  const seeded = [normalizeProject({ name: "Project 1" }, 0)];
  saveProjects(seeded);
  return seeded;
}

function getValidMenuId(value) {
  return menuItems.some((item) => item.id === value) ? value : "dashboard";
}

function getEditorView(sectionId) {
  return editorViews[sectionId] || editorViews.dashboard;
}

function getEditorTables(sectionId) {
  const view = getEditorView(sectionId);
  return Array.isArray(view.tables) ? view.tables : [];
}

function getActiveTable(sectionId) {
  const tables = getEditorTables(sectionId);
  return tables.find((table) => table.id === state.activeTableId) || tables[0] || null;
}

function getActiveProject(projects) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("projectId");
  const fromStorage = localStorage.getItem(activeProjectKey);
  const activeId = fromQuery || fromStorage || projects[0]?.id || null;
  const activeProject = projects.find((project) => project.id === activeId) || projects[0] || null;

  if (activeProject?.id) {
    localStorage.setItem(activeProjectKey, activeProject.id);
  }

  return activeProject;
}

function getActiveSection() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("section") || params.get("view");
  const fromStorage = localStorage.getItem(activeSectionKey);
  const sectionId = fromQuery || fromStorage || "dashboard";
  const normalized = getValidMenuId(sectionId);
  localStorage.setItem(activeSectionKey, normalized);
  return normalized;
}

function syncLocation(projectId, sectionId) {
  const url = new URL(window.location.href);
  if (projectId) {
    url.searchParams.set("projectId", projectId);
  } else {
    url.searchParams.delete("projectId");
  }
  if (sectionId) {
    url.searchParams.set("section", sectionId);
  } else {
    url.searchParams.delete("section");
  }
  window.history.replaceState({}, "", url);
}

function setDropdownOpen(open) {
  state.dropdownOpen = open;
  projectDropdown.hidden = !open;
  projectDropdown.style.display = open ? "flex" : "none";
  projectSwitcherToggle?.setAttribute("aria-expanded", String(open));
}

function setCommonModalOpen(open) {
  state.commonModalOpen = open;
  if (commonModal) {
    commonModal.hidden = !open;
    commonModal.style.display = open ? "flex" : "none";
  }
}

function openCommonModal(options = {}) {
  commonModalState.onConfirm = typeof options.onConfirm === "function" ? options.onConfirm : null;
  commonModalState.confirmText = options.confirmText || "확인";
  commonModalState.title = options.title || "제목 변경";
  commonModalState.description = options.description || "프로젝트 이름을 입력하세요.";

  if (commonModalTitle) {
    commonModalTitle.textContent = commonModalState.title;
  }
  if (commonModalDescription) {
    commonModalDescription.textContent = commonModalState.description;
  }
  if (commonModalConfirm) {
    commonModalConfirm.textContent = commonModalState.confirmText;
  }
  if (commonModalInput) {
    commonModalInput.value = String(options.initialValue || "");
  }

  setCommonModalOpen(true);
  window.setTimeout(() => {
    commonModalInput?.focus();
    commonModalInput?.select?.();
  }, 0);
}

function closeCommonModal() {
  commonModalState.onConfirm = null;
  setCommonModalOpen(false);
}

function confirmCommonModal() {
  const value = commonModalInput?.value || "";
  const onConfirm = commonModalState.onConfirm;
  if (onConfirm) {
    const result = onConfirm(value);
    if (result === false) {
      return;
    }
  }
  closeCommonModal();
}

function setActiveProject(projectId) {
  if (!projectId) return;
  state.activeProjectId = projectId;
  localStorage.setItem(activeProjectKey, projectId);
  setDropdownOpen(false);
  syncLocation(projectId, state.activeSectionId);
  renderAll();
}

function setActiveSection(sectionId) {
  const normalized = getValidMenuId(sectionId);
  state.activeSectionId = normalized;
  state.activeTableId = getEditorTables(normalized)[0]?.id || null;
  localStorage.setItem(activeSectionKey, normalized);
  syncLocation(state.activeProjectId, normalized);
  renderAll();
}

function createProject(projectName) {
  const projects = ensureProjects();
  const next = normalizeProject(
    {
      id: createProjectId(),
      name: String(projectName || getNextProjectDefaultName(projects)),
      description: "새 프로젝트 작업 공간",
    },
    projects.length,
  );
  const updated = [next, ...projects];
  saveProjects(updated);
  localStorage.setItem(activeSectionKey, "dashboard");
  state.activeSectionId = "dashboard";
  setActiveProject(next.id);
}

function renameActiveProject(nextName) {
  const trimmedName = String(nextName || "").trim();
  if (!trimmedName) {
    return false;
  }

  const projects = loadProjects();
  const updatedProjects = projects.map((project) =>
    project?.id === state.activeProjectId
      ? {
          ...project,
          name: trimmedName,
          updatedAt: Date.now(),
        }
      : project,
  );

  saveProjects(updatedProjects);
  renderAll();
  return true;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function generateRowData(tableId, index) {
  const seed = tableId.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase() || "row";
  const id = `${seed}-${String(index + 1).padStart(2, "0")}`;
  const suffix = String(index + 1).padStart(2, "0");

  return {
    id: id.toLowerCase(),
    code: `${seed}_${suffix}`,
    name: `${tableId} record ${index + 1}`,
    status: index % 3 === 0 ? "active" : index % 3 === 1 ? "draft" : "archived",
    updatedAt: new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
  };
}

function createEditorTableMarkup(activeTable, tables, sectionId) {
  const rows = Array.from({ length: 12 }, (_, index) => generateRowData(activeTable?.id || sectionId, index));
  return `
    <aside class="editor-sidebar">
      <header class="editor-sidebar__title">
        <p class="eyebrow">Table Editor</p>
        <h2>${getEditorView(sectionId).title}</h2>
      </header>
      <section class="editor-sidebar__controls" aria-label="Table controls">
        <label class="editor-select">
          <span>schema</span>
          <select aria-label="schema">
            <option selected>public</option>
          </select>
        </label>
        <button class="action-button action-button--soft" type="button" data-new-table>
          <i class="ri-add-line"></i>
          New table
        </button>
      </section>
      <section class="editor-sidebar__search" aria-label="Table search">
        <label class="search-field">
          <i class="ri-search-line"></i>
          <input type="text" value="" placeholder="Search tables..." aria-label="Search tables" data-table-filter />
        </label>
        <button class="icon-button icon-button--ghost" type="button" aria-label="Filter tables">
          <i class="ri-filter-3-line"></i>
        </button>
      </section>
      <section class="editor-table-list" data-table-list aria-label="Tables">
        ${tables
          .map(
            (table) => `
              <button class="editor-table-item ${table.id === activeTable?.id ? "is-active" : ""}" type="button" data-table-id="${table.id}">
                <span class="editor-table-item__icon"><i class="ri-table-line"></i></span>
                <span class="editor-table-item__body">
                  <strong>${table.name}</strong>
                  <span>${table.description}</span>
                </span>
                <i class="ri-global-line editor-table-item__globe"></i>
              </button>
            `,
          )
          .join("")}
      </section>
    </aside>

    <section class="editor-content">
      <nav class="editor-tabs" aria-label="Table tabs">
        <button class="editor-tab is-active" type="button" data-table-tab="${activeTable?.id || ""}">
          <i class="ri-table-line"></i>
          ${activeTable?.name || "table"}
        </button>
        <button class="editor-tab editor-tab--add" type="button" data-new-tab aria-label="New tab">+</button>
      </nav>

      <header class="editor-toolbar" aria-label="Table toolbar">
        <label class="toolbar-search">
          <i class="ri-search-line"></i>
          <input type="text" placeholder="Filter by id, name, or ask AI" aria-label="Filter rows" />
        </label>
        <button class="toolbar-button" type="button"><i class="ri-sort-desc"></i> Sort</button>
        <button class="toolbar-chip" type="button">3 RLS policies</button>
        <button class="toolbar-button toolbar-button--select" type="button">Role postgres <i class="ri-arrow-down-s-line"></i></button>
        <button class="toolbar-icon" type="button" aria-label="More"><i class="ri-more-2-fill"></i></button>
        <button class="toolbar-icon" type="button" aria-label="Refresh"><i class="ri-refresh-line"></i></button>
        <button class="toolbar-button toolbar-button--primary" type="button">Insert <i class="ri-arrow-down-s-line"></i></button>
      </header>

      <section class="editor-grid" aria-label="Row data">
        <header class="grid-header">
          <span></span>
          <span>id <small>uuid</small></span>
          <span>code <small>text</small></span>
          <span>name <small>text</small></span>
          <span>status <small>text</small></span>
          <span>updated_at <small>timestamp</small></span>
        </header>
        ${rows
          .map(
            (row) => `
              <article class="grid-row">
                <span class="grid-checkbox"></span>
                <span class="grid-cell grid-cell--primary">${row.id}</span>
                <span class="grid-cell">${row.code}</span>
                <span class="grid-cell">${row.name}</span>
                <span class="grid-cell"><span class="status-pill status-pill--${row.status}">${row.status}</span></span>
                <span class="grid-cell">${row.updatedAt}</span>
              </article>
            `,
          )
          .join("")}
      </section>

      <footer class="editor-footer">
        <button class="pager-button" type="button">Page 1 of 1</button>
        <button class="pager-button" type="button">100 rows</button>
        <span class="editor-footer__meta">${rows.length} records</span>
        <nav class="editor-footer__switch" aria-label="Data view switch">
          <button class="pager-tab is-active" type="button">Data</button>
          <button class="pager-tab" type="button">Definition</button>
        </nav>
      </footer>
    </section>
  `;
}

function renderProjectDropdown(projects, activeProject) {
  projectSwitcherText.textContent = activeProject?.name || "프로젝트 선택";

  projectDropdownList.innerHTML = projects
    .map(
      (project) => `
        <button class="project-dropdown__item ${project.id === activeProject?.id ? "is-active" : ""}" type="button" data-project-id="${project.id}" role="menuitem">
          <span>
            <strong>${project.name}</strong>
            <span>${project.id}</span>
          </span>
          ${project.id === activeProject?.id ? '<i class="ri-check-line"></i>' : ""}
        </button>
      `,
    )
    .join("") || `<div class="project-dropdown__empty">No projects found</div>`;

  projectDropdownList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const projectId = button.getAttribute("data-project-id");
      if (projectId) {
        setActiveProject(projectId);
      }
    });
  });
}

function renderRail(activeSectionId) {
  const settingsItem = railItems.find((item) => item.id === "settings" || item.id === "utility-settings");
  const topRailItems = railItems.filter((item) => item.id !== settingsItem?.id);

  railMenu.innerHTML = [
    ...topRailItems.map(
      (item) =>
        item.sectionId && item.id !== settingsItem?.id
          ? `<a class="rail-item ${item.sectionId === activeSectionId ? "is-active" : ""}" href="?section=${encodeURIComponent(item.sectionId)}" data-section-id="${item.sectionId}" aria-label="${item.label}">
        <i class="${item.icon}" aria-hidden="true"></i>
        <span class="rail-item__label">${item.label}</span>
      </a>`
          : `<button class="rail-item rail-item--utility" type="button" aria-label="${item.label}">
        <i class="${item.icon}" aria-hidden="true"></i>
        <span class="rail-item__label">${item.label}</span>
      </button>`,
    ),
    '<span class="rail-spacer" aria-hidden="true"></span>',
    settingsItem
      ? `<button class="rail-item rail-item--utility rail-item--settings" type="button" aria-label="${settingsItem.label}">
        <i class="${settingsItem.icon}" aria-hidden="true"></i>
        <span class="rail-item__label">${settingsItem.label}</span>
      </button>`
      : "",
  ].join("");

  railMenu.querySelectorAll("[data-section-id]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.getAttribute("data-section-id");
      if (sectionId) {
        setActiveSection(sectionId);
      }
    });
  });
}

function buildWorkspaceCards(activeProject, activeSectionId) {
  const section = menuItems.find((item) => item.id === activeSectionId) || menuItems[0];
  const otherItems = menuItems.filter((item) => item.id !== "dashboard");

  return [
    {
      variant: "wide",
      eyebrow: "Folder map",
      title: "하나의 프로젝트 안에서 폴더로 통합",
      description:
        "대시보드, 다이어그램, DB모델링, API정의서, WIKI를 분리된 모듈이 아니라 하나의 프로젝트 폴더 집합으로 다룹니다.",
      body: `
        <div class="folder-grid">
          ${otherItems
            .map(
              (item) => `
                <article class="folder-mini">
                  <strong>${item.label}</strong>
                  <span>${item.description}</span>
                </article>
              `,
            )
            .join("")}
        </div>
      `,
    },
    {
      variant: "stack",
      eyebrow: "Selected project",
      title: activeProject?.name || "기본 프로젝트",
      description: activeProject?.description || "기본 프로젝트가 자동으로 생성됩니다.",
      meta: [
        `ID ${activeProject?.id || "-"}`,
        `Created ${formatDate(activeProject?.createdAt) || "-"}`,
        `Updated ${formatDate(activeProject?.updatedAt) || "-"}`,
      ],
    },
    {
      variant: "stack",
      eyebrow: "Active folder",
      title: section.label,
      description: section.description,
      meta: [
        "아이콘 레일에서 폴더를 전환할 수 있습니다.",
        "프로젝트를 바꾸면 모든 폴더 기준이 함께 바뀝니다.",
      ],
      actions: [
        { label: "대시보드로 이동", sectionId: "dashboard", tone: "soft" },
        ...otherItems
          .filter((item) => item.id !== activeSectionId)
          .slice(0, 2)
          .map((item) => ({ label: item.label, sectionId: item.id, tone: "default" })),
      ],
    },
  ];
}

function renderWorkspace(activeProject, activeSectionId) {
  const section = menuItems.find((item) => item.id === activeSectionId) || menuItems[0];
  const view = getEditorView(activeSectionId);
  const tables = getEditorTables(activeSectionId);
  const activeTable = getActiveTable(activeSectionId);
  layout?.classList.toggle("is-editor-view", activeSectionId !== "dashboard");

  workspaceGrid.innerHTML = createEditorTableMarkup(activeTable, tables, activeSectionId);

  workspaceGrid.querySelectorAll("[data-table-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const tableId = button.getAttribute("data-table-id");
      if (tableId) {
        state.activeTableId = tableId;
        renderAll();
      }
    });
  });

  const newTableBtn = workspaceGrid.querySelector("[data-new-table]");
  newTableBtn?.addEventListener("click", () => {
    const nextId = `table_${Date.now().toString(36)}`;
    const nextTable = {
      id: nextId,
      name: `new_table_${tables.length + 1}`,
      description: "새 테이블",
    };
    const current = getEditorTables(activeSectionId);
    state.activeTableId = nextId;
    editorViews[activeSectionId].tables = [nextTable, ...current];
    renderAll();
  });
}

function renderAll() {
  state.projects = ensureProjects();
  const activeProject = getActiveProject(state.projects);
  state.activeProjectId = activeProject?.id || state.projects[0]?.id || null;
  state.activeSectionId = getActiveSection();
  if (!state.activeTableId) {
    state.activeTableId = getEditorTables(state.activeSectionId)[0]?.id || null;
  }

  renderProjectDropdown(state.projects, activeProject);
  renderRail(state.activeSectionId);
  renderWorkspace(activeProject, state.activeSectionId);
}

projectSwitcherToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  setDropdownOpen(!state.dropdownOpen);
});

projectSwitcherText?.addEventListener("dblclick", (event) => {
  event.preventDefault();
  event.stopPropagation();

  const currentProject = state.projects.find((project) => project.id === state.activeProjectId);
  openCommonModal({
    title: "프로젝트 제목 변경",
    description: "새 프로젝트 제목을 입력하세요.",
    confirmText: "저장",
    initialValue: currentProject?.name || "",
    onConfirm: (nextName) => {
      renameActiveProject(nextName);
    },
  });
});

commonModal?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (event.target?.closest?.("[data-modal-close]")) {
    closeCommonModal();
  }
});

commonModalConfirm?.addEventListener("click", () => {
  confirmCommonModal();
});

commonModalInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    confirmCommonModal();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeCommonModal();
  }
});

document.addEventListener("click", () => {
  if (state.dropdownOpen) {
    setDropdownOpen(false);
  }
  if (state.commonModalOpen) {
    closeCommonModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDropdownOpen(false);
    closeCommonModal();
  }
});

createProjectDropdownBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const projects = state.projects.length ? state.projects : ensureProjects();
  const defaultName = getNextProjectDefaultName(projects);
  openCommonModal({
    title: "새 프로젝트 생성",
    description: "프로젝트 제목을 입력하세요.",
    confirmText: "생성",
    initialValue: defaultName,
    onConfirm: (nextName) => {
      const trimmedName = String(nextName || "").trim();
      if (!trimmedName) {
        return false;
      }
      createProject(trimmedName);
    },
  });
});

setDropdownOpen(false);
renderAll();
