(function () {
  const C = window.ProjectStudioCommon;
  if (!C) return;
  const { qs, qsa, getProjectState, setProjectState, uid } = C;
  const shell = qs('[data-diagram-shell]');
  if (!shell) return;
  const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
  let diagramState = ensureDiagramState(projectId);
  const nodeList = qs('[data-diagram-node-list]');
  const canvas = qs('[data-diagram-canvas]');
  const titleEl = qs('[data-diagram-active-title]');
  const countEl = qs('[data-diagram-node-count]');
  const nameInput = qs('[data-diagram-node-name]');
  const typeInput = qs('[data-diagram-node-type]');
  const descInput = qs('[data-diagram-node-desc]');

  function ensureDiagramState(pid) {
    const project = getProjectState(pid);
    if (project.diagramWorkspace) return project.diagramWorkspace;
    const seed = { nodes: [{ id: uid('node'), title: 'Auth', type: 'gateway', description: '로그인과 세션을 담당합니다.', x: 140, y: 110 }, { id: uid('node'), title: 'Project', type: 'page', description: '프로젝트 메인 영역입니다.', x: 360, y: 180 }], selectedNodeId: null };
    seed.selectedNodeId = seed.nodes[0].id;
    setProjectState(pid, { diagramWorkspace: seed });
    return seed;
  }
  function selectedNode() { return diagramState.nodes.find((node) => node.id === diagramState.selectedNodeId) || diagramState.nodes[0]; }
  function persist() { setProjectState(projectId, { diagramWorkspace: diagramState }); render(); }
  function render() {
    diagramState = ensureDiagramState(projectId);
    const node = selectedNode();
    if (countEl) countEl.textContent = String(diagramState.nodes.length);
    if (titleEl) titleEl.textContent = node ? node.title : '선택된 노드 없음';
    if (nameInput) nameInput.value = node ? node.title : '';
    if (typeInput) typeInput.value = node ? node.type : 'page';
    if (descInput) descInput.value = node ? node.description : '';
    if (nodeList) {
      nodeList.innerHTML = diagramState.nodes.map((item) => `<button class="mini-nav-item ${item.id === diagramState.selectedNodeId ? 'active' : ''}" type="button" data-diagram-select="${item.id}"><span>${item.title}</span><small>${item.type}</small></button>`).join('');
      qsa('[data-diagram-select]', nodeList).forEach((btn) => btn.addEventListener('click', () => { diagramState.selectedNodeId = btn.getAttribute('data-diagram-select'); persist(); }));
    }
    if (canvas) {
      canvas.innerHTML = diagramState.nodes.map((item, idx) => {
        const left = item.x ?? 80 + idx * 160;
        const top = item.y ?? 80 + idx * 80;
        return `<div class="diagram-node" data-node-type="${item.type}" style="left:${left}px; top:${top}px;"><div class="diagram-node-grip"></div><div class="diagram-node-body"><div class="diagram-node-head"><div class="diagram-node-icon">${item.type.slice(0, 1).toUpperCase()}</div><strong class="node-label">${item.title}</strong></div><div class="node-desc">${item.description || '설명 없음'}</div></div></div>`;
      }).join('');
    }
  }
  qs('[data-diagram-add-node]')?.addEventListener('click', () => { const node = { id: uid('node'), title: `Node ${diagramState.nodes.length + 1}`, type: 'page', description: '', x: 80 + diagramState.nodes.length * 160, y: 90 + diagramState.nodes.length * 50 }; diagramState.nodes.push(node); diagramState.selectedNodeId = node.id; persist(); });
  qs('[data-diagram-delete-node]')?.addEventListener('click', () => { if (diagramState.nodes.length <= 1) return alert('최소 1개의 노드는 유지되어야 합니다.'); const node = selectedNode(); if (!node) return; if (!confirm(`"${node.title}" 노드를 삭제할까요?`)) return; diagramState.nodes = diagramState.nodes.filter((item) => item.id !== node.id); diagramState.selectedNodeId = diagramState.nodes[0]?.id || null; persist(); });
  qs('[data-diagram-center]')?.addEventListener('click', () => { diagramState.nodes = diagramState.nodes.map((node, idx) => ({ ...node, x: 100 + idx * 180, y: 100 + idx * 90 })); persist(); });
  nameInput?.addEventListener('input', () => { const node = selectedNode(); if (!node) return; node.title = nameInput.value; persist(); });
  typeInput?.addEventListener('change', () => { const node = selectedNode(); if (!node) return; node.type = typeInput.value; persist(); });
  descInput?.addEventListener('input', () => { const node = selectedNode(); if (!node) return; node.description = descInput.value; persist(); });
  render();
})();
