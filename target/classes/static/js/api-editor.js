(function () {
  const C = window.ProjectStudioCommon;
  if (!C) return;
  const { qs, qsa, getProjectState, setProjectState, uid } = C;
  const apiShell = qs('[data-api-group-list]');
  if (!apiShell) return;
  const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
  let apiState = ensureApiState(projectId);
  const groupList = qs('[data-api-group-list]');
  const endpointList = qs('[data-api-endpoint-list]');
  const fields = { groupName: qs('[data-api-group-name]'), groupDesc: qs('[data-api-group-description]'), groupBase: qs('[data-api-group-baseurl]'), groupToken: qs('[data-api-group-token]'), method: qs('[data-api-endpoint-method]'), path: qs('[data-api-endpoint-path]'), summary: qs('[data-api-endpoint-summary]'), description: qs('[data-api-endpoint-description]'), request: qs('[data-api-endpoint-request]'), response: qs('[data-api-endpoint-response]'), params: qs('[data-api-endpoint-params]'), status: qs('[data-api-endpoint-status]') };
  function ensureApiState(pid) {
    const project = getProjectState(pid);
    if (project.apiWorkspace) return project.apiWorkspace;
    const seed = { groups: [{ id: uid('group'), name: 'Project API', description: '기본 API 그룹', baseUrl: '/api', authToken: '', headers: {}, order: 0 }], endpoints: [{ id: uid('ep'), groupId: null, method: 'GET', path: '/projects', summary: 'List projects', description: '프로젝트 목록을 조회합니다.', parameters: [], requestBody: { contentType: 'application/json', schema: '{}', example: '{}' }, responseExample: '{\n  "items": []\n}', statusCodes: [{ code: 200, description: 'OK' }] }], selectedGroupId: null, selectedEndpointId: null };
    seed.endpoints[0].groupId = seed.groups[0].id;
    seed.selectedGroupId = seed.groups[0].id;
    seed.selectedEndpointId = seed.endpoints[0].id;
    setProjectState(pid, { apiWorkspace: seed });
    return seed;
  }
  function selectedGroup() { return apiState.groups.find((g) => g.id === apiState.selectedGroupId) || apiState.groups[0]; }
  function selectedEndpoint() { return apiState.endpoints.find((e) => e.id === apiState.selectedEndpointId) || apiState.endpoints[0]; }
  function persist() { setProjectState(projectId, { apiWorkspace: apiState }); render(); }
  function render() {
    apiState = ensureApiState(projectId);
    const group = selectedGroup();
    const endpoint = selectedEndpoint();
    if (group) { fields.groupName.value = group.name || ''; fields.groupDesc.value = group.description || ''; fields.groupBase.value = group.baseUrl || ''; fields.groupToken.value = group.authToken || ''; }
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
})();
