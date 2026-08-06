(function () {
  const C = window.ProjectStudioCommon;
  if (!C) return;
  const { qs, qsa, getProjectState, setProjectState, uid } = C;
  const wikiShell = qs('[data-wiki-tree]');
  if (!wikiShell) return;
  const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
  let wikiState = ensureWikiState(projectId);
  const titleEl = qs('[data-wiki-title]');
  const pageTitle = qs('[data-wiki-page-title]');
  const pageContent = qs('[data-wiki-page-content]');
  function ensureWikiState(pid) {
    const project = getProjectState(pid);
    if (project.wikiWorkspace) return project.wikiWorkspace;
    const seed = { pages: [{ id: uid('page'), title: 'Overview', content: '프로젝트 개요를 입력하세요.', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], selectedPageId: null };
    seed.selectedPageId = seed.pages[0].id;
    setProjectState(pid, { wikiWorkspace: seed });
    return seed;
  }
  function selectedPage() { return wikiState.pages.find((p) => p.id === wikiState.selectedPageId) || wikiState.pages[0]; }
  function persist() { setProjectState(projectId, { wikiWorkspace: wikiState }); render(); }
  function render() {
    wikiState = ensureWikiState(projectId);
    const page = selectedPage();
    if (titleEl) titleEl.textContent = page ? page.title : '';
    if (pageTitle) pageTitle.value = page ? page.title : '';
    if (pageContent) pageContent.value = page ? page.content : '';
    wikiShell.innerHTML = wikiState.pages.map((p) => `<button class="wiki-node ${p.id === wikiState.selectedPageId ? 'active' : ''}" type="button" data-wiki-select="${p.id}">${p.title}</button>`).join('');
    qsa('[data-wiki-select]', wikiShell).forEach((btn) => btn.addEventListener('click', () => { wikiState.selectedPageId = btn.getAttribute('data-wiki-select'); persist(); }));
  }
  qs('[data-wiki-page-add]')?.addEventListener('click', () => { const title = prompt('Page title', `Page ${wikiState.pages.length + 1}`); if (!title?.trim()) return; const now = new Date().toISOString(); const page = { id: uid('page'), title: title.trim(), content: '', order: wikiState.pages.length, createdAt: now, updatedAt: now }; wikiState.pages.push(page); wikiState.selectedPageId = page.id; persist(); });
  qs('[data-wiki-page-delete]')?.addEventListener('click', () => { if (wikiState.pages.length <= 1) return alert('최소 1개의 페이지는 유지되어야 합니다.'); const page = selectedPage(); if (!page) return; if (!confirm(`"${page.title}" 페이지를 삭제할까요?`)) return; wikiState.pages = wikiState.pages.filter((p) => p.id !== page.id); wikiState.selectedPageId = wikiState.pages[0]?.id || null; persist(); });
  qs('[data-save-section="wiki"]')?.addEventListener('click', () => { const page = selectedPage(); if (!page) return; page.title = pageTitle.value.trim() || page.title; page.content = pageContent.value || ''; page.updatedAt = new Date().toISOString(); persist(); setProjectState(projectId, { lastSavedSection: 'wiki', lastSavedAt: new Date().toISOString() }); alert('wiki를 로컬 스토리지에 저장했습니다.'); });
  pageTitle?.addEventListener('input', () => { const page = selectedPage(); if (!page) return; page.title = pageTitle.value; render(); });
  pageContent?.addEventListener('input', () => { const page = selectedPage(); if (!page) return; page.content = pageContent.value; });
  render();
})();
