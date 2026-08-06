(function () {
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
  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

  window.ProjectStudioCommon = {
    qs,
    qsa,
    getState,
    setState,
    patchState,
    getProjects,
    getProject,
    saveProject,
    getProjectState,
    setProjectState,
    uid,
  };
})();
