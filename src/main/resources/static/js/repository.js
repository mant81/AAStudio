(function (global) {
  const STORAGE_KEY = 'project-studio-ui-state-v1';

  function readState() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function writeState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function patchState(patch) {
    writeState({ ...readState(), ...patch });
  }

  function getProjects() {
    return readState().projectsList || [];
  }

  function getProjectById(projectId) {
    return getProjects().find((item) => item.id === projectId) || null;
  }

  function upsertProject(project) {
    const projects = getProjects();
    const next = projects.some((item) => item.id === project.id)
      ? projects.map((item) => (item.id === project.id ? project : item))
      : [...projects, project];
    patchState({ projectsList: next });
  }

  function deleteProject(projectId) {
    patchState({ projectsList: getProjects().filter((item) => item.id !== projectId) });
    const state = readState();
    if (state.projects?.[projectId]) {
      const projects = { ...state.projects };
      delete projects[projectId];
      writeState({ ...state, projects });
    }
  }

  function getProjectState(projectId) {
    return readState().projects?.[projectId] || {};
  }

  function updateProjectState(projectId, patch) {
    const state = readState();
    const projects = { ...(state.projects || {}) };
    projects[projectId] = { ...(projects[projectId] || {}), ...patch };
    writeState({ ...state, projects });
  }

  function removeProjectState(projectId) {
    const state = readState();
    const projects = { ...(state.projects || {}) };
    delete projects[projectId];
    writeState({ ...state, projects });
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function createProjectRecord({ id, name, description }) {
    const now = new Date().toISOString();
    const project = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    upsertProject(project);
    return project;
  }

  global.ProjectRepository = {
    readState,
    writeState,
    patchState,
    getProjects,
    getProjectById,
    upsertProject,
    deleteProject,
    getProjectState,
    updateProjectState,
    removeProjectState,
    uid,
    createProjectRecord,
  };
})(window);
