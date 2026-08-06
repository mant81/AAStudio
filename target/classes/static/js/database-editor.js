(function () {
  const C = window.ProjectStudioCommon;
  if (!C) return;
  const { qs, qsa, getProjectState, setProjectState, uid } = C;
  const dbCanvas = qs('[data-db-canvas]');
  if (!dbCanvas) return;
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
  function ensureDatabaseState(pid) {
    const project = getProjectState(pid);
    if (project.databaseWorkspace) return project.databaseWorkspace;
    const seed = { tables: [{ id: uid('table'), name: 'projects', description: '프로젝트 메인 테이블', color: '#0f172a', position: { x: 44, y: 44 }, columns: [{ id: uid('col'), name: 'id', type: 'UUID', isPrimaryKey: true, isNotNull: true, isUnique: true, defaultValue: '' }, { id: uid('col'), name: 'name', type: 'VARCHAR', length: 120, isPrimaryKey: false, isNotNull: true, isUnique: false, defaultValue: '' }] }], selectedTableId: null, selectedColumnId: null };
    seed.selectedTableId = seed.tables[0].id;
    seed.selectedColumnId = seed.tables[0].columns[0].id;
    setProjectState(pid, { databaseWorkspace: seed });
    return seed;
  }
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
      dbCanvas.innerHTML = dbState.tables.map((t, idx) => `<div class="db-table" style="left:${t.position?.x ?? 40 + idx * 260}px; top:${t.position?.y ?? 40 + idx * 80}px;"><div class="db-table-head">${t.name}</div>${t.columns.map((c) => `<div class="db-row">${c.name} ${c.type}${c.isPrimaryKey ? ' PK' : ''}${c.foreignKey ? ' FK' : ''}</div>`).join('')}</div>`).join('');
    }
    const nodeOptions = (table?.columns || []).map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    if (relSource) relSource.innerHTML = nodeOptions;
    if (relTargetTable) relTargetTable.innerHTML = dbState.tables.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
    const targetTable = dbState.tables.find((t) => t.id === relTargetTable?.value) || dbState.tables[0];
    if (relTargetColumn) relTargetColumn.innerHTML = (targetTable?.columns || []).map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  qs('[data-db-add-table]')?.addEventListener('click', () => { const name = prompt('Table name', `table_${dbState.tables.length + 1}`); if (!name?.trim()) return; const table = { id: uid('table'), name: name.trim(), description: '', color: '#0f172a', position: { x: 40 + dbState.tables.length * 260, y: 40 + dbState.tables.length * 40 }, columns: [] }; dbState.tables.push(table); dbState.selectedTableId = table.id; dbState.selectedColumnId = null; persist(); });
  qs('[data-db-table-save]')?.addEventListener('click', () => { const table = selectedTable(); if (!table) return; table.name = tableName?.value.trim() || table.name; table.description = tableDescription?.value.trim() || ''; table.color = tableColor?.value.trim() || ''; persist(); });
  qs('[data-db-table-delete]')?.addEventListener('click', () => { if (dbState.tables.length <= 1) return alert('최소 1개의 테이블은 유지되어야 합니다.'); const table = selectedTable(); if (!table) return; if (!confirm(`"${table.name}" 테이블을 삭제할까요?`)) return; dbState.tables = dbState.tables.filter((t) => t.id !== table.id); dbState.selectedTableId = dbState.tables[0]?.id || null; dbState.selectedColumnId = dbState.tables[0]?.columns[0]?.id || null; persist(); });
  qs('[data-db-column-add]')?.addEventListener('click', () => { const table = selectedTable(); if (!table) return; const name = columnName?.value.trim(); if (!name) return; const col = { id: uid('col'), name, type: columnType?.value.trim() || 'VARCHAR', length: Number(columnLength?.value || 0) || undefined, isPrimaryKey: false, isNotNull: false, isUnique: false, defaultValue: columnDefault?.value.trim() || '' }; table.columns.push(col); dbState.selectedColumnId = col.id; persist(); });
  qs('[data-db-column-save]')?.addEventListener('click', () => { const col = selectedColumn(); if (!col) return; col.name = columnName?.value.trim() || col.name; col.type = columnType?.value.trim() || col.type; col.length = Number(columnLength?.value || 0) || undefined; col.defaultValue = columnDefault?.value.trim() || ''; persist(); });
  qs('[data-db-column-delete]')?.addEventListener('click', () => { const table = selectedTable(); const col = selectedColumn(); if (!table || !col) return; table.columns = table.columns.filter((c) => c.id !== col.id); dbState.selectedColumnId = table.columns[0]?.id || null; persist(); });
  qs('[data-db-rel-save]')?.addEventListener('click', () => { const table = selectedTable(); if (!table) return; const col = table.columns.find((c) => c.id === relSource?.value); if (!col) return; const targetTableValue = dbState.tables.find((t) => t.id === relTargetTable?.value); const targetCol = targetTableValue?.columns.find((c) => c.id === relTargetColumn?.value); if (!targetTableValue || !targetCol) return; col.foreignKey = { tableId: targetTableValue.id, columnId: targetCol.id }; persist(); });
  qs('[data-save-section="database"]')?.addEventListener('click', () => { setProjectState(projectId, { databaseWorkspace: dbState, lastSavedSection: 'database', lastSavedAt: new Date().toISOString() }); alert('database를 로컬 스토리지에 저장했습니다.'); });
  render();
})();
