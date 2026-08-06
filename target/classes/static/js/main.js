(function () {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const STORAGE_KEY = 'project-studio-state-v1';

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function getState() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }
  function setState(next) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  function patchState(patch) { setState({ ...getState(), ...patch }); }
  function getProjects() { return getState().projects || []; }
  function getProject(projectId) { return getProjects().find((project) => project.id === projectId) || {}; }
  function saveProject(project) {
    const projects = getProjects();
    const idx = projects.findIndex((item) => item.id === project.id);
    if (idx >= 0) projects[idx] = { ...projects[idx], ...project };
    else projects.unshift(project);
    setState({ ...getState(), projects });
  }
  function deleteProject(projectId) {
    const projects = getProjects().filter((project) => project.id !== projectId);
    setState({ ...getState(), projects });
  }
  function getProjectState(projectId) { return getProject(projectId).state || {}; }
  function setProjectState(projectId, patch) {
    const project = getProject(projectId);
    saveProject({
      ...project,
      id: projectId,
      state: { ...(project.state || {}), ...patch },
      updatedAt: new Date().toISOString(),
    });
  }
  function readProjectName(projectId, fallback) {
    const project = getProject(projectId);
    return project.name || fallback;
  }
  function formatDate(value) {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  }
  function projectStatus(project) {
    return project.state && project.state.activeSection ? 'Active' : 'Draft';
  }
  function projectBadgeClass(project) {
    return project.state && project.state.activeSection ? 'active' : 'draft';
  }
  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
  function ensureDiagramState(projectId) {
    const project = getProjectState(projectId);
    if (project.diagramWorkspace) return project.diagramWorkspace;
    const seed = {
      diagrams: [],
      activeDiagramId: null,
      selectedNodeId: null,
      selectedEdgeId: null,
    };
    setProjectState(projectId, { diagramWorkspace: seed });
    return seed;
  }
  function saveDiagramState(projectId, next) {
    setProjectState(projectId, { diagramWorkspace: next });
  }

  qsa('[data-collapse-sidebar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  });

  const createForm = qs('[data-project-create-form]');
  if (createForm) {
    const nameInput = qs('input[name="name"]', createForm) || qs('input[type="text"]', createForm);
    const descInput = qs('textarea[name="description"]', createForm) || qs('textarea', createForm);
    const draft = getState().newProjectDraft || {};
    if (nameInput && draft.name) nameInput.value = draft.name;
    if (descInput && draft.description) descInput.value = draft.description;
    nameInput?.addEventListener('input', () => {
      patchState({
        newProjectDraft: {
          ...(getState().newProjectDraft || {}),
          name: nameInput.value,
          description: descInput?.value || '',
        },
      });
    });
    descInput?.addEventListener('input', () => {
      patchState({
        newProjectDraft: {
          ...(getState().newProjectDraft || {}),
          name: nameInput?.value || '',
          description: descInput.value,
        },
      });
    });
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput?.value?.trim() || 'New Project';
      const description = descInput?.value?.trim() || '';
      const id = uid('project');
      patchState({
        currentProjectId: id,
        newProjectDraft: { name, description },
      });
      const created = {
        id,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: { activeSection: 'diagram' },
      };
      saveProject(created);
      window.location.href = '/project';
    });
  }



  qsa('[data-section]').forEach((el) => {
    el.addEventListener('click', () => {
      const section = el.getAttribute('data-section');
      if (!section) return;
      const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
      setProjectState(projectId, { activeSection: section, updatedAt: new Date().toISOString() });
      window.location.href = `/project/${projectId}/${section}`;
    });
  });

  const shell = qs('[data-project-shell]');
  const sectionPanels = qsa('[data-section-panel]');
  const sectionTabs = qsa('[data-section-tab]');
  const sectionTitle = qs('[data-section-title]');
  const sectionToolbar = qs('[data-section-toolbar]');
  const sectionMeta = {
    diagram: {
      title: 'Diagram Editor',
      toolbar: '<button class="ghost-btn" type="button">Save</button>',
    },
    database: {
      title: 'Database Modeling',
      toolbar: '<button class="ghost-btn" type="button">Save DB</button><button class="ghost-btn" type="button">Export</button>',
    },
    'api-docs': {
      title: 'API Definition',
      toolbar: '<button class="ghost-btn" type="button">Save API</button><button class="ghost-btn" type="button">Generate</button>',
    },
    wiki: {
      title: 'Wiki',
      toolbar: '<button class="ghost-btn" type="button">Save WIKI</button><button class="ghost-btn" type="button">New Page</button>',
    },
  };

  function activateSection(section) {
    if (!shell) return;
    const next = sectionMeta[section] ? section : 'diagram';
    const projectId = shell.getAttribute('data-project-id') || '1';
    sectionPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.getAttribute('data-section-panel') === next);
    });
    sectionTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-section-tab') === next);
    });
    if (sectionTitle) sectionTitle.textContent = sectionMeta[next].title;
    if (sectionToolbar) sectionToolbar.innerHTML = sectionMeta[next].toolbar;
    setProjectState(projectId, { activeSection: next, updatedAt: new Date().toISOString() });
    const url = `/project/${projectId}/${next}`;
    window.history.replaceState({}, '', url);
  }

  if (shell) {
    const projectId = shell.getAttribute('data-project-id') || '1';
    const state = getProjectState(projectId);
    const project = getProject(projectId);
    const current = state.activeSection || path.split('/').filter(Boolean)[2] || 'diagram';
    const titleEl = qs('[data-project-name]');
    const descEl = qs('[data-project-description]');
    const statusEl = qs('[data-project-status]');
    const createdEl = qs('[data-project-created]');
    const updatedEl = qs('[data-project-updated]');
    if (titleEl) titleEl.textContent = project.name || 'Project';
    if (descEl) descEl.textContent = project.description || '프로젝트 설명이 없습니다.';
    if (statusEl) statusEl.textContent = project.state && project.state.activeSection ? 'Active' : 'Draft';
    if (createdEl) createdEl.textContent = formatDate(project.createdAt);
    if (updatedEl) updatedEl.textContent = formatDate(project.updatedAt);
    patchState({ currentProjectId: projectId });
    activateSection(current);
    sectionTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const section = tab.getAttribute('data-section-tab');
        if (!section) return;
        activateSection(section);
      });
    });
    qsa('[data-save-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-save-section');
        if (!section) return;
        setProjectState(projectId, {
          activeSection: section,
          lastSavedSection: section,
          lastSavedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        alert('로컬 스토리지에 저장했습니다.');
      });
    });
  }

  const projectGrid = qs('[data-project-grid]');
  const projectEmpty = qs('[data-project-empty]');
  if (projectGrid) {
    const state = getState();
    const projects = getProjects().slice().sort((a, b) => {
      if (a.id === state.currentProjectId) return -1;
      if (b.id === state.currentProjectId) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const projectCount = qs('[data-project-count]');
    const projectLastUpdated = qs('[data-project-last-updated]');
    if (projectCount) projectCount.textContent = String(projects.length);
    if (projectLastUpdated) {
      const last = projects.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      projectLastUpdated.textContent = last ? new Date(last.updatedAt).toLocaleDateString() : '-';
    }
    if (projects.length > 0) {
      if (projectEmpty) projectEmpty.hidden = true;
      projectGrid.hidden = false;
      projectGrid.innerHTML = projects.map((project) => {
        const createdAt = formatDate(project.createdAt);
        const updatedAt = formatDate(project.updatedAt);
        const status = projectStatus(project);
        const badgeClass = projectBadgeClass(project);
        const isCurrent = state.currentProjectId === project.id;
        return `
        <article class="card project-card project-card-clickable ${isCurrent ? 'is-current' : ''}" role="button" tabindex="0" data-project-open="${project.id}">
          <div class="project-card-top">
            <div>
              <p class="eyebrow tiny">Project</p>
              <h3>${project.name}</h3>
            </div>
            <span class="project-status ${badgeClass}">${status}</span>
          </div>
          <p class="muted project-card-desc">${project.description || '프로젝트 설명이 없습니다.'}</p>
          <div class="project-card-meta">
            <div>
              <span>Created</span>
              <strong>${createdAt}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>${updatedAt}</strong>
            </div>
          </div>
          <div class="project-card-actions">
            <button class="primary-btn" type="button" data-project-open-btn="${project.id}">Open</button>
            <button class="secondary-btn" type="button" data-project-delete="${project.id}">Delete</button>
          </div>
        </article>
      `;}).join('');
      qsa('[data-project-open], [data-project-open-btn]', projectGrid).forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-project-open') || btn.getAttribute('data-project-open-btn');
          if (!id) return;
          patchState({ currentProjectId: id });
          window.location.href = `/project/${id}`;
        });
      });
      qsa('[data-project-delete]', projectGrid).forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-project-delete');
          if (!id) return;
          if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
          deleteProject(id);
          window.location.reload();
        });
      });
    }
  }

  const recentEmpty = qs('[data-recent-empty]');
  const recentList = qs('[data-recent-list]');
  if (recentEmpty && recentList) {
    recentEmpty.hidden = true;
    recentList.hidden = false;
  }

  qs('[data-continue-work]')?.addEventListener('click', () => {
    const shell = qs('[data-project-shell]');
    const projectId = shell?.getAttribute('data-project-id');
    if (!projectId) {
      window.location.href = '/project';
      return;
    }
    const state = getProjectState(projectId);
    const section = state.activeSection || 'diagram';
    window.location.href = `/project/${projectId}/${section}`;
  });

  if (path.startsWith('/share')) {
    const status = qs('[data-share-status]');
    const token = search.get('t');
    if (!token) {
      if (status) status.textContent = 'invalid';
    } else {
      if (status) status.textContent = `ready: ${token}`;
    }
  }
})();

