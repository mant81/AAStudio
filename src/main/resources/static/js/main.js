(function () {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const S = window.ProjectRepository || window.ProjectStorage || {};
  const STORAGE_KEY = 'project-studio-ui-state-v1';

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function getState() { return S.readState ? S.readState() : {}; }
  function setState(next) { return S.writeState ? S.writeState(next) : window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function patchState(patch) { return S.patchState ? S.patchState(patch) : setState({ ...getState(), ...patch }); }
  function getProjectState(projectId) { return S.getProjectState ? S.getProjectState(projectId) : (getState().projects?.[projectId] || {}); }
  function setProjectState(projectId, patch) { return S.updateProjectState ? S.updateProjectState(projectId, patch) : setState({ ...getState(), projects: { ...(getState().projects || {}), [projectId]: { ...(getProjectState(projectId) || {}), ...patch } } }); }
  function readProjectName(projectId, fallback) {
    const project = getProjectState(projectId);
    return project.name || fallback;
  }
  function uid(prefix) { return S.uid ? S.uid(prefix) : `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
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
      };
      S.upsertProject ? S.upsertProject(created) : null;
      setProjectState(id, {
        name,
        description,
        updatedAt: new Date().toISOString(),
      });
      window.location.href = `/project/${id}/diagram`;
    });
  }

  const settingsDialog = qs('[data-settings-dialog]');
  const shareDialog = qs('[data-share-dialog]');

  qs('[data-open-settings]')?.addEventListener('click', () => settingsDialog?.removeAttribute('hidden'));
  qs('[data-close-settings]')?.addEventListener('click', () => settingsDialog?.setAttribute('hidden', 'hidden'));
  qs('[data-open-share]')?.addEventListener('click', () => shareDialog?.removeAttribute('hidden'));
  qs('[data-close-share]')?.addEventListener('click', () => shareDialog?.setAttribute('hidden', 'hidden'));

  qs('[data-save-rename]')?.addEventListener('click', () => {
    const input = qs('#renameInput');
    const name = input?.value?.trim();
    if (!name) return;
    const title = qs('#projectName');
    if (title) title.textContent = name;
    const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
    setProjectState(projectId, { name, updatedAt: new Date().toISOString() });
    const sidebarTitle = qs('.mini-meta strong');
    if (sidebarTitle) sidebarTitle.textContent = name;
    settingsDialog?.setAttribute('hidden', 'hidden');
  });

  qs('[data-delete-project]')?.addEventListener('click', () => {
    const ok = window.confirm('프로젝트를 삭제하시겠습니까?');
    if (ok) window.location.href = '/project';
  });

  qs('[data-copy-share]')?.addEventListener('click', async () => {
    const input = qs('.share-box input');
    try {
      await navigator.clipboard.writeText(input?.value || '');
      alert('링크를 복사했습니다.');
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  });

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
      toolbar: '<button class="ghost-btn" type="button">Save</button><button class="ghost-btn" type="button" data-open-share>Share</button>',
    },
    database: {
      title: 'Table Canvas',
      toolbar: '<button class="ghost-btn" type="button">Save DB</button><button class="ghost-btn" type="button">Export</button>',
    },
    'api-docs': {
      title: 'API Docs',
      toolbar: '<button class="ghost-btn" type="button">Save API</button><button class="ghost-btn" type="button">Generate</button>',
    },
    wiki: {
      title: 'WIKI Editor',
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
    const current = state.activeSection || path.split('/').filter(Boolean)[2] || 'diagram';
    const projectName = readProjectName(projectId, qs('[data-project-name]')?.textContent || 'Project');
    const titleEl = qs('[data-project-name]');
    if (titleEl) titleEl.textContent = projectName;
    const renameInput = qs('#renameInput');
    if (renameInput) renameInput.value = projectName;
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
    const projects = S.getProjects ? S.getProjects() : [];
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
      projectGrid.innerHTML = projects.map((project) => `
        <article class="card project-card">
          <div>
            <p class="eyebrow tiny">Project</p>
            <h3>${project.name}</h3>
            <p class="muted">${project.description || ''}</p>
          </div>
          <div class="project-card-actions">
            <a class="primary-btn" href="/project/${project.id}">Open</a>
            <button class="secondary-btn" type="button" data-project-delete="${project.id}">Delete</button>
          </div>
        </article>
      `).join('');
      qsa('[data-project-delete]', projectGrid).forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-project-delete');
          if (!id) return;
          if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
          S.deleteProject ? S.deleteProject(id) : null;
          window.location.reload();
        });
      });
    }
  }

  window.ProjectDiagramEditor?.init?.();

  function ensureDatabaseState(projectId) {
    const project = getProjectState(projectId);
    if (project.databaseWorkspace) return project.databaseWorkspace;
    const seed = {
      tables: [],
      selectedTableId: null,
      selectedColumnId: null,
    };
    setProjectState(projectId, { databaseWorkspace: seed });
    return seed;
  }
  function ensureApiState(projectId) {
    const project = getProjectState(projectId);
    if (project.apiWorkspace) return project.apiWorkspace;
    const seed = {
      groups: [],
      endpoints: [],
      selectedGroupId: null,
      selectedEndpointId: null,
    };
    setProjectState(projectId, { apiWorkspace: seed });
    return seed;
  }
  function ensureWikiState(projectId) {
    const project = getProjectState(projectId);
    if (project.wikiWorkspace) return project.wikiWorkspace;
    const seed = {
      pages: [],
      selectedPageId: null,
    };
    setProjectState(projectId, { wikiWorkspace: seed });
    return seed;
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

  const dbCanvas = qs('[data-db-canvas]');
  if (dbCanvas) {
    const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
    let dbState = ensureDatabaseState(projectId);
    const tableList = qs('[data-db-table-list]');
    const tableName = qs('[data-db-table-name]');
    const tableDescription = qs('[data-db-table-description]');
    const tableColor = qs('[data-db-table-color]');
    const columnList = qs('[data-db-column-list]');
    const columnName = qs('[data-db-column-name]');
    const columnType = qs('[data-db-column-type]');
    const columnLength = qs('[data-db-column-length]');
    const columnDefault = qs('[data-db-column-default]');
    const relSource = qs('[data-db-rel-source]');
    const relTargetTable = qs('[data-db-rel-target-table]');
    const relTargetColumn = qs('[data-db-rel-target-column]');

    const selectedTable = () => dbState.tables.find((t) => t.id === dbState.selectedTableId) || dbState.tables[0];
    const selectedColumn = () => selectedTable()?.columns.find((c) => c.id === dbState.selectedColumnId) || selectedTable()?.columns[0];

    function persist() { setProjectState(projectId, { databaseWorkspace: dbState }); render(); }

    function render() {
      dbState = ensureDatabaseState(projectId);
      const table = selectedTable();
      if (tableName) tableName.value = table?.name || '';
      if (tableDescription) tableDescription.value = table?.description || '';
      if (tableColor) tableColor.value = table?.color || '';
      if (tableList) {
        tableList.innerHTML = dbState.tables.map((t) => `<button class="db-legend-item ${t.id === dbState.selectedTableId ? 'active' : ''}" type="button" data-db-select-table="${t.id}">${t.name}</button>`).join('');
        qsa('[data-db-select-table]', tableList).forEach((btn) => btn.addEventListener('click', () => { dbState.selectedTableId = btn.getAttribute('data-db-select-table'); dbState.selectedColumnId = selectedTable()?.columns[0]?.id || null; persist(); }));
      }
      if (columnList) {
        const cols = table?.columns || [];
        columnList.innerHTML = cols.map((c) => `<div class="node-item ${c.id === dbState.selectedColumnId ? 'active' : ''}"><span>${c.name} ${c.type}${c.length ? `(${c.length})` : ''}</span><div class="node-actions"><button class="small-icon-btn" type="button" data-db-select-column="${c.id}">•</button></div></div>`).join('');
        qsa('[data-db-select-column]', columnList).forEach((btn) => btn.addEventListener('click', () => { dbState.selectedColumnId = btn.getAttribute('data-db-select-column'); persist(); }));
      }
      if (dbCanvas) {
        dbCanvas.innerHTML = dbState.tables.map((t, idx) => {
          const left = t.position?.x ?? 40 + idx * 260;
          const top = t.position?.y ?? 40 + idx * 80;
          return `<div class="db-table" style="left:${left}px; top:${top}px;"><div class="db-table-head">${t.name}</div>${t.columns.map((c) => `<div class="db-row">${c.name} ${c.type}${c.isPrimaryKey ? ' PK' : ''}${c.foreignKey ? ' FK' : ''}</div>`).join('')}</div>`;
        }).join('');
      }
      const nodeOptions = (table?.columns || []).map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
      if (relSource) relSource.innerHTML = nodeOptions;
      if (relTargetTable) relTargetTable.innerHTML = dbState.tables.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
      const targetTable = dbState.tables.find((t) => t.id === relTargetTable?.value) || dbState.tables[0];
      if (relTargetColumn) relTargetColumn.innerHTML = (targetTable?.columns || []).map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    qs('[data-db-add-table]')?.addEventListener('click', () => {
      const name = prompt('Table name', `table_${dbState.tables.length + 1}`);
      if (!name?.trim()) return;
      const table = { id: uid('table'), name: name.trim(), description: '', color: '#0f172a', position: { x: 40 + dbState.tables.length * 260, y: 40 + dbState.tables.length * 40 }, columns: [] };
      dbState.tables.push(table);
      dbState.selectedTableId = table.id;
      dbState.selectedColumnId = null;
      persist();
    });
    qs('[data-db-table-save]')?.addEventListener('click', () => {
      const table = selectedTable(); if (!table) return;
      table.name = tableName?.value.trim() || table.name;
      table.description = tableDescription?.value.trim() || '';
      table.color = tableColor?.value.trim() || '';
      persist();
    });
    qs('[data-db-table-delete]')?.addEventListener('click', () => {
      if (dbState.tables.length <= 1) return alert('최소 1개의 테이블은 유지되어야 합니다.');
      const table = selectedTable(); if (!table) return;
      if (!confirm(`"${table.name}" 테이블을 삭제할까요?`)) return;
      dbState.tables = dbState.tables.filter((t) => t.id !== table.id);
      dbState.selectedTableId = dbState.tables[0]?.id || null;
      dbState.selectedColumnId = dbState.tables[0]?.columns[0]?.id || null;
      persist();
    });
    qs('[data-db-column-add]')?.addEventListener('click', () => {
      const table = selectedTable(); if (!table) return;
      const name = columnName?.value.trim(); if (!name) return;
      const col = { id: uid('col'), name, type: columnType?.value.trim() || 'VARCHAR', length: Number(columnLength?.value || 0) || undefined, isPrimaryKey: false, isNotNull: false, isUnique: false, defaultValue: columnDefault?.value.trim() || '' };
      table.columns.push(col);
      dbState.selectedColumnId = col.id;
      persist();
    });
    qs('[data-db-column-save]')?.addEventListener('click', () => {
      const col = selectedColumn(); if (!col) return;
      col.name = columnName?.value.trim() || col.name;
      col.type = columnType?.value.trim() || col.type;
      col.length = Number(columnLength?.value || 0) || undefined;
      col.defaultValue = columnDefault?.value.trim() || '';
      persist();
    });
    qs('[data-db-column-delete]')?.addEventListener('click', () => {
      const table = selectedTable(); const col = selectedColumn(); if (!table || !col) return;
      table.columns = table.columns.filter((c) => c.id !== col.id);
      dbState.selectedColumnId = table.columns[0]?.id || null;
      persist();
    });
    qs('[data-db-rel-save]')?.addEventListener('click', () => {
      const table = selectedTable(); if (!table) return;
      const col = table.columns.find((c) => c.id === relSource?.value); if (!col) return;
      const targetTable = dbState.tables.find((t) => t.id === relTargetTable?.value); const targetCol = targetTable?.columns.find((c) => c.id === relTargetColumn?.value);
      if (!targetTable || !targetCol) return;
      col.foreignKey = { tableId: targetTable.id, columnId: targetCol.id };
      persist();
    });
    qs('[data-save-section="database"]')?.addEventListener('click', () => { setProjectState(projectId, { databaseWorkspace: dbState, lastSavedSection: 'database', lastSavedAt: new Date().toISOString() }); alert('database를 로컬 스토리지에 저장했습니다.'); });
    render();
  }

  const apiShell = qs('[data-api-group-list]');
  if (apiShell) {
    const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
    let apiState = ensureApiState(projectId);
    const groupList = qs('[data-api-group-list]');
    const endpointList = qs('[data-api-endpoint-list]');
    const fields = {
      groupName: qs('[data-api-group-name]'),
      groupDesc: qs('[data-api-group-description]'),
      groupBase: qs('[data-api-group-baseurl]'),
      groupToken: qs('[data-api-group-token]'),
      method: qs('[data-api-endpoint-method]'),
      path: qs('[data-api-endpoint-path]'),
      summary: qs('[data-api-endpoint-summary]'),
      description: qs('[data-api-endpoint-description]'),
      request: qs('[data-api-endpoint-request]'),
      response: qs('[data-api-endpoint-response]'),
      params: qs('[data-api-endpoint-params]'),
      status: qs('[data-api-endpoint-status]'),
    };
    function selectedGroup() { return apiState.groups.find((g) => g.id === apiState.selectedGroupId) || apiState.groups[0]; }
    function selectedEndpoint() { return apiState.endpoints.find((e) => e.id === apiState.selectedEndpointId) || apiState.endpoints[0]; }
    function persist() { setProjectState(projectId, { apiWorkspace: apiState }); render(); }
    function render() {
      apiState = ensureApiState(projectId);
      const group = selectedGroup();
      const endpoint = selectedEndpoint();
      if (group) {
        fields.groupName.value = group.name || '';
        fields.groupDesc.value = group.description || '';
        fields.groupBase.value = group.baseUrl || '';
        fields.groupToken.value = group.authToken || '';
      }
      if (endpoint) {
        fields.method.value = endpoint.method || 'GET';
        fields.path.value = endpoint.path || '';
        fields.summary.value = endpoint.summary || '';
        fields.description.value = endpoint.description || '';
        fields.request.value = JSON.stringify(endpoint.requestBody || {}, null, 2);
        fields.response.value = endpoint.responseExample || '';
        fields.params.value = JSON.stringify(endpoint.parameters || [], null, 2);
        fields.status.value = JSON.stringify(endpoint.statusCodes || [], null, 2);
        qs('[data-api-method]').textContent = endpoint.method || 'GET';
        qs('[data-api-path]').textContent = endpoint.path || '';
      }
      if (groupList) {
        groupList.innerHTML = apiState.groups.map((g) => `<div class="api-group-card ${g.id === apiState.selectedGroupId ? 'active' : ''}"><button class="ghost-btn" type="button" data-api-select-group="${g.id}">${g.name}</button><div>${(apiState.endpoints.filter((e) => e.groupId === g.id).map((e) => `<div class="api-endpoint-item ${e.id === apiState.selectedEndpointId ? 'active' : ''}"><span><span class="badge ${e.method.toLowerCase()}">${e.method}</span> ${e.path}</span><button class="small-icon-btn" type="button" data-api-select-endpoint="${e.id}">•</button></div>`).join('')) || ''}</div></div>`).join('');
        qsa('[data-api-select-group]', groupList).forEach((btn) => btn.addEventListener('click', () => { apiState.selectedGroupId = btn.getAttribute('data-api-select-group'); apiState.selectedEndpointId = apiState.endpoints.find((e) => e.groupId === apiState.selectedGroupId)?.id || null; persist(); }));
        qsa('[data-api-select-endpoint]', groupList).forEach((btn) => btn.addEventListener('click', () => { apiState.selectedEndpointId = btn.getAttribute('data-api-select-endpoint'); persist(); }));
      }
      if (endpointList) {
        endpointList.innerHTML = apiState.endpoints.map((e) => `<div class="api-endpoint-item ${e.id === apiState.selectedEndpointId ? 'active' : ''}"><span><span class="badge ${e.method.toLowerCase()}">${e.method}</span> ${e.path}</span><button class="small-icon-btn" type="button" data-api-select-endpoint="${e.id}">•</button></div>`).join('');
      }
    }
    qs('[data-api-group-add]')?.addEventListener('click', () => { const name = prompt('Group name', `Group ${apiState.groups.length + 1}`); if (!name?.trim()) return; const group = { id: uid('group'), name: name.trim(), description: '', baseUrl: '', authToken: '', headers: {}, order: apiState.groups.length }; apiState.groups.push(group); apiState.selectedGroupId = group.id; persist(); });
    qs('[data-api-group-save]')?.addEventListener('click', () => { const group = selectedGroup(); if (!group) return; group.name = fields.groupName.value.trim() || group.name; group.description = fields.groupDesc.value.trim() || ''; group.baseUrl = fields.groupBase.value.trim() || ''; group.authToken = fields.groupToken.value.trim() || ''; persist(); });
    qs('[data-api-group-delete]')?.addEventListener('click', () => { if (apiState.groups.length <= 1) return alert('최소 1개의 그룹은 유지되어야 합니다.'); const group = selectedGroup(); if (!group) return; apiState.groups = apiState.groups.filter((g) => g.id !== group.id); apiState.endpoints = apiState.endpoints.filter((e) => e.groupId !== group.id); apiState.selectedGroupId = apiState.groups[0]?.id || null; apiState.selectedEndpointId = apiState.endpoints[0]?.id || null; persist(); });
    qs('[data-api-endpoint-add]')?.addEventListener('click', () => { const group = selectedGroup(); if (!group) return; const ep = { id: uid('ep'), groupId: group.id, method: 'GET', path: '/api/new', summary: 'New endpoint', description: '', parameters: [], requestBody: { contentType: 'application/json', schema: '{}', example: '{}' }, responseExample: '{}', statusCodes: [{ code: 200, description: 'OK' }] }; apiState.endpoints.push(ep); apiState.selectedEndpointId = ep.id; persist(); });
    qs('[data-api-endpoint-save]')?.addEventListener('click', () => { const ep = selectedEndpoint(); if (!ep) return; ep.method = fields.method.value.trim().toUpperCase() || ep.method; ep.path = fields.path.value.trim() || ep.path; ep.summary = fields.summary.value.trim() || ep.summary; ep.description = fields.description.value.trim() || ''; try { ep.requestBody = JSON.parse(fields.request.value || '{}'); } catch {} ep.responseExample = fields.response.value.trim(); try { ep.parameters = JSON.parse(fields.params.value || '[]'); } catch {} try { ep.statusCodes = JSON.parse(fields.status.value || '[]'); } catch {} persist(); });
    qs('[data-api-endpoint-delete]')?.addEventListener('click', () => { const ep = selectedEndpoint(); if (!ep) return; apiState.endpoints = apiState.endpoints.filter((e) => e.id !== ep.id); apiState.selectedEndpointId = apiState.endpoints.find((e) => e.groupId === apiState.selectedGroupId)?.id || null; persist(); });
    qs('[data-save-section="api-docs"]')?.addEventListener('click', () => { setProjectState(projectId, { apiWorkspace: apiState, lastSavedSection: 'api-docs', lastSavedAt: new Date().toISOString() }); alert('api-docs를 로컬 스토리지에 저장했습니다.'); });
    render();
  }

  const wikiShell = qs('[data-wiki-tree]');
  if (wikiShell) {
    const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
    let wikiState = ensureWikiState(projectId);
    const titleEl = qs('[data-wiki-title]');
    const pageTitle = qs('[data-wiki-page-title]');
    const pageContent = qs('[data-wiki-page-content]');
    function selectedPage() { return wikiState.pages.find((p) => p.id === wikiState.selectedPageId) || wikiState.pages[0]; }
    function persist() { setProjectState(projectId, { wikiWorkspace: wikiState }); render(); }
    function render() {
      wikiState = ensureWikiState(projectId);
      const page = selectedPage();
      if (titleEl) titleEl.textContent = page?.title || '';
      if (pageTitle) pageTitle.value = page?.title || '';
      if (pageContent) pageContent.value = page?.content || '';
      if (wikiShell) {
        wikiShell.innerHTML = wikiState.pages.map((p) => `<button class="wiki-node ${p.id === wikiState.selectedPageId ? 'active' : ''}" type="button" data-wiki-select="${p.id}">${p.title}</button>`).join('');
        qsa('[data-wiki-select]', wikiShell).forEach((btn) => btn.addEventListener('click', () => { wikiState.selectedPageId = btn.getAttribute('data-wiki-select'); persist(); }));
      }
    }
    qs('[data-wiki-page-add]')?.addEventListener('click', () => { const title = prompt('Page title', `Page ${wikiState.pages.length + 1}`); if (!title?.trim()) return; const now = new Date().toISOString(); const page = { id: uid('page'), title: title.trim(), content: '', order: wikiState.pages.length, createdAt: now, updatedAt: now }; wikiState.pages.push(page); wikiState.selectedPageId = page.id; persist(); });
    qs('[data-wiki-page-delete]')?.addEventListener('click', () => { if (wikiState.pages.length <= 1) return alert('최소 1개의 페이지는 유지되어야 합니다.'); const page = selectedPage(); if (!page) return; if (!confirm(`"${page.title}" 페이지를 삭제할까요?`)) return; wikiState.pages = wikiState.pages.filter((p) => p.id !== page.id); wikiState.selectedPageId = wikiState.pages[0]?.id || null; persist(); });
    qs('[data-save-section="wiki"]')?.addEventListener('click', () => { const page = selectedPage(); if (!page) return; page.title = pageTitle.value.trim() || page.title; page.content = pageContent.value || ''; page.updatedAt = new Date().toISOString(); persist(); setProjectState(projectId, { lastSavedSection: 'wiki', lastSavedAt: new Date().toISOString() }); alert('wiki를 로컬 스토리지에 저장했습니다.'); });
    pageTitle?.addEventListener('input', () => { const page = selectedPage(); if (!page) return; page.title = pageTitle.value; render(); });
    pageContent?.addEventListener('input', () => { const page = selectedPage(); if (!page) return; page.content = pageContent.value; });
    render();
  }
})();
