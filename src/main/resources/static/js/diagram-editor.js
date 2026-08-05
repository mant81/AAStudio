(function () {
  const S = window.ProjectRepository || window.ProjectStorage || {};

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function uid(prefix) {
    return S.uid ? S.uid(prefix) : `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function getProjectState(projectId) {
    if (S.getProjectState) return S.getProjectState(projectId);
    return S.readState?.().projects?.[projectId] || {};
  }

  function setProjectState(projectId, patch) {
    if (S.updateProjectState) return S.updateProjectState(projectId, patch);
    return null;
  }

  function saveDiagramState(projectId, next) {
    setProjectState(projectId, { diagramWorkspace: next });
  }

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

  function init() {
    const diagramShell = qs('[data-diagram-canvas]');
    if (!diagramShell) return;

    const projectId = qs('[data-project-shell]')?.getAttribute('data-project-id') || '1';
    let diagramState = ensureDiagramState(projectId);

    const diagramSwitcher = qs('[data-diagram-switcher]');
    const diagramName = qs('[data-diagram-name]');
    const diagramMeta = qs('[data-diagram-meta]');
    const diagramStats = qs('[data-diagram-stats]');
    const diagramViewport = qs('[data-diagram-viewport]');
    const edgeList = qs('[data-edge-list]');
    const nodeLabel = qs('[data-node-label]');
    const nodeTypeInput = qs('[data-node-type-input]');
    const nodeColorInput = qs('[data-node-color]');
    const nodeDescription = qs('[data-node-description]');
    const edgeSource = qs('[data-edge-source]');
    const edgeTarget = qs('[data-edge-target]');
    const edgeLabel = qs('[data-edge-label]');
    const edgeEditLabel = qs('[data-edge-edit-label]');
    const edgeArrow = qs('[data-edge-arrow]');
    const edgeCurve = qs('[data-edge-curve]');
    const edgeStroke = qs('[data-edge-stroke]');
    const edgeColor = qs('[data-edge-color]');
    const selectedEdgeTitle = qs('[data-selected-edge-title]');
    const bottomSummary = qs('[data-diagram-bottom-summary]');
    const zoomInBtn = qs('[data-diagram-zoom-in]');
    const zoomOutBtn = qs('[data-diagram-zoom-out]');
    const zoomResetBtn = qs('[data-diagram-zoom-reset]');
    const panToggleBtn = qs('[data-diagram-pan-toggle]');
    const fitViewBtn = qs('[data-diagram-fit-view]');

    let draggingNodeId = null;
    let dragOffset = { x: 0, y: 0 };
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panOrigin = { x: 0, y: 0 };
    let selectedEdgeId = diagramState.selectedEdgeId || null;
    let dragPaletteType = null;

    const minZoom = 0.45;
    const maxZoom = 1.8;
    const zoomStep = 0.1;

    const NODE_PRESETS = {
      server: { label: 'Service', color: '#0f172a', icon: '◫' },
      database: { label: 'Database', color: '#0f766e', icon: '▦' },
      page: { label: 'Page', color: '#6d28d9', icon: '▣' },
      note: { label: 'Note', color: '#b45309', icon: '✎' },
      gateway: { label: 'Gateway', color: '#1f2937', icon: '◆' },
    };

    function currentDiagram() {
      return diagramState.diagrams.find((d) => d.id === diagramState.activeDiagramId) || diagramState.diagrams[0] || null;
    }

    function ensureViewport() {
      const diagram = currentDiagram();
      if (!diagram) return { x: 80, y: 70, zoom: 1 };
      if (!diagram.viewport) diagram.viewport = { x: 80, y: 70, zoom: 1 };
      return diagram.viewport;
    }

    function persist() {
      diagramState.selectedEdgeId = selectedEdgeId;
      saveDiagramState(projectId, diagramState);
      render();
    }

    function selectedNode() {
      const diagram = currentDiagram();
      return diagram?.nodes.find((n) => n.id === diagramState.selectedNodeId) || null;
    }

    function selectedEdge() {
      const diagram = currentDiagram();
      return diagram?.edges.find((edge) => edge.id === selectedEdgeId) || null;
    }

    function createNode(type) {
      const preset = NODE_PRESETS[type] || NODE_PRESETS.server;
      const diagram = currentDiagram();
      if (!diagram) return null;

      const index = diagram.nodes.length;
      return {
        id: uid(type || 'node'),
        type: type || 'server',
        position: { x: 90 + index * 38, y: 100 + index * 28 },
        data: {
          label: `${preset.label} ${index + 1}`,
          description: '',
        },
        style: { color: preset.color },
      };
    }

    function createNodeAt(type, x, y) {
      const node = createNode(type);
      if (!node) return null;

      node.position.x = Math.max(20, x - 70);
      node.position.y = Math.max(20, y - 24);
      return node;
    }

    function normalizeEdge(edge) {
      return {
        ...edge,
        lineType: edge.lineType || 'smoothstep',
        arrow: edge.arrow || 'end',
        curve: typeof edge.curve === 'number' ? edge.curve : 0.35,
        strokeWidth: Number(edge.strokeWidth || 2),
        color: edge.color || '#2563eb',
      };
    }

    function edgePath(source, target, edge) {
      const x1 = source.position.x + 70;
      const y1 = source.position.y + 24;
      const x2 = target.position.x + 70;
      const y2 = target.position.y + 24;

      if (edge.lineType === 'straight') {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }

      const bend = Math.max(40, Math.min(180, Math.abs(x2 - x1) * edge.curve));
      return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
    }

    function updateSelectOptions() {
      const diagram = currentDiagram();
      if (!diagram) {
        if (edgeSource) edgeSource.innerHTML = '';
        if (edgeTarget) edgeTarget.innerHTML = '';
        return;
      }

      const options = diagram.nodes
        .map((node) => `<option value="${node.id}">${node.data?.label || node.id}</option>`)
        .join('');

      if (edgeSource) edgeSource.innerHTML = options;
      if (edgeTarget) edgeTarget.innerHTML = options;
    }

    function renderDiagramSwitcher() {
      if (!diagramSwitcher) return;

      diagramSwitcher.innerHTML = diagramState.diagrams
        .map((diagram) => `
          <button class="mini-nav-item ${diagram.id === diagramState.activeDiagramId ? 'active' : ''}" type="button" data-diagram-pick="${diagram.id}">
            ${diagram.name}
          </button>
        `)
        .join('');

      qsa('[data-diagram-pick]', diagramSwitcher).forEach((btn) => {
        btn.addEventListener('click', () => {
          diagramState.activeDiagramId = btn.getAttribute('data-diagram-pick');
          diagramState.selectedNodeId = currentDiagram()?.nodes[0]?.id || null;
          persist();
        });
      });
    }

    function renderEdges(diagram) {
      if (!edgeList) return;

      edgeList.innerHTML = diagram.edges
        .map((edge) => `
          <div class="node-item ${edge.id === selectedEdgeId ? 'active' : ''}" data-edge-pick="${edge.id}">
            <span>${edge.label || `${edge.source} → ${edge.target}`}</span>
            <div class="node-actions">
              <button class="small-icon-btn" type="button" data-edge-remove="${edge.id}">×</button>
            </div>
          </div>
        `)
        .join('');

      qsa('[data-edge-pick]', edgeList).forEach((item) => {
        item.addEventListener('click', () => {
          selectedEdgeId = item.getAttribute('data-edge-pick');
          diagramState.selectedNodeId = null;
          syncInspector();
          persist();
        });
      });

      qsa('[data-edge-remove]', edgeList).forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-edge-remove');
          diagram.edges = diagram.edges.filter((edge) => edge.id !== id);
          if (selectedEdgeId === id) selectedEdgeId = null;
          persist();
        });
      });
    }

    function renderCanvas() {
      const diagram = currentDiagram();
      if (!diagram) {
        diagramShell.innerHTML = `
          <div class="diagram-empty-state">
            <strong>등록된 다이어그램이 없습니다</strong>
            <p>왼쪽의 + Diagram으로 새 작업을 시작할 수 있습니다.</p>
          </div>
        `;
        return;
      }

      const viewport = ensureViewport();
      diagramShell.innerHTML = '';

      const frame = document.createElement('div');
      frame.className = 'diagram-viewport';
      frame.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'diagram-edge-layer');
      svg.setAttribute('viewBox', '0 0 1000 600');
      svg.style.position = 'absolute';
      svg.style.inset = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none';

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <marker id="diagram-arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"></path>
        </marker>
        <marker id="diagram-arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#2563eb"></path>
        </marker>
        <marker id="diagram-arrow-both" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"></path>
        </marker>
      `;
      svg.appendChild(defs);

      diagram.edges.forEach((edge) => {
        const normalized = normalizeEdge(edge);
        const source = diagram.nodes.find((n) => n.id === edge.source);
        const target = diagram.nodes.find((n) => n.id === edge.target);
        if (!source || !target) return;

        const pathData = edgePath(source, target, normalized);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', normalized.color);
        path.setAttribute('stroke-width', String(normalized.strokeWidth));
        path.setAttribute('fill', 'none');
        path.setAttribute(
          'marker-end',
          normalized.arrow === 'none'
            ? ''
            : normalized.arrow === 'start'
              ? 'url(#diagram-arrow-start)'
              : normalized.arrow === 'both'
                ? 'url(#diagram-arrow-both)'
                : 'url(#diagram-arrow-end)',
        );
        path.style.pointerEvents = 'stroke';
        svg.appendChild(path);

        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hit.setAttribute('d', pathData);
        hit.setAttribute('fill', 'none');
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', '18');
        hit.style.pointerEvents = 'stroke';
        hit.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedEdgeId = edge.id;
          diagramState.selectedNodeId = null;
          syncInspector();
          persist();
        });
        svg.appendChild(hit);

        if (edge.label) {
          const label = document.createElement('div');
          label.className = 'diagram-edge-label';
          label.textContent = edge.label;
          label.style.left = `${(source.position.x + target.position.x) / 2 - 24}px`;
          label.style.top = `${(source.position.y + target.position.y) / 2 - 14}px`;
          label.style.cursor = 'pointer';
          label.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedEdgeId = edge.id;
            diagramState.selectedNodeId = null;
            syncInspector();
            persist();
          });
          frame.appendChild(label);
        }
      });

      frame.appendChild(svg);

      diagram.nodes.forEach((node) => {
        const el = document.createElement('div');
        el.className = `diagram-node ${diagramState.selectedNodeId === node.id ? 'selected' : ''}`;
        el.style.left = `${node.position.x}px`;
        el.style.top = `${node.position.y}px`;
        el.dataset.nodeId = node.id;
        el.dataset.nodeType = node.type || 'server';
        el.style.background = node.style?.color || '';

        const preset = NODE_PRESETS[node.type] || NODE_PRESETS.server;
        el.innerHTML = `
          <div class="diagram-node-grip"></div>
          <div class="diagram-node-body">
            <div class="diagram-node-head">
              <span class="diagram-node-icon">${preset.icon}</span>
              <span class="node-label">${node.data?.label || node.id}</span>
            </div>
            <div class="node-desc">${node.data?.description || node.type}</div>
          </div>
          <span class="diagram-node-handle diagram-node-handle-left"></span>
          <span class="diagram-node-handle diagram-node-handle-right"></span>
        `;

        el.addEventListener('mousedown', (e) => {
          draggingNodeId = node.id;
          dragOffset = { x: e.offsetX, y: e.offsetY };
          diagramState.selectedNodeId = node.id;
          selectedEdgeId = null;
          persist();
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          diagramState.selectedNodeId = node.id;
          selectedEdgeId = null;
          persist();
        });

        frame.appendChild(el);
      });

      diagramShell.appendChild(frame);
      diagramShell.style.cursor = isPanning ? 'grabbing' : 'default';

      diagramShell.onmousemove = (e) => {
        if (!draggingNodeId) return;

        const rect = frame.getBoundingClientRect();
        const node = diagram.nodes.find((n) => n.id === draggingNodeId);
        if (!node) return;

        node.position.x = Math.max(0, (e.clientX - rect.left) / viewport.zoom - dragOffset.x);
        node.position.y = Math.max(0, (e.clientY - rect.top) / viewport.zoom - dragOffset.y);
        saveDiagramState(projectId, diagramState);
        renderCanvas();
      };

      diagramShell.ondragover = (e) => {
        if (!dragPaletteType) return;
        e.preventDefault();
        diagramShell.classList.add('drop-ready');
      };

      diagramShell.ondragleave = () => {
        diagramShell.classList.remove('drop-ready');
      };

      diagramShell.ondrop = (e) => {
        if (!dragPaletteType) return;
        e.preventDefault();

        const rect = frame.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        const node = createNodeAt(dragPaletteType, x, y);

        diagram.nodes.push(node);
        diagramState.selectedNodeId = node.id;
        selectedEdgeId = null;
        dragPaletteType = null;
        diagramShell.classList.remove('drop-ready');
        persist();
      };

      diagramShell.onmousedown = (e) => {
        if (e.target !== diagramShell) return;
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        const current = ensureViewport();
        panOrigin = { x: current.x, y: current.y };
        diagramShell.style.cursor = 'grabbing';
      };

      diagramShell.onwheel = (e) => {
        e.preventDefault();
        const current = ensureViewport();
        current.zoom = Number(
          Math.max(minZoom, Math.min(maxZoom, current.zoom + (e.deltaY < 0 ? zoomStep : -zoomStep))).toFixed(2),
        );
        persist();
      };

      window.onmouseup = () => {
        draggingNodeId = null;
        isPanning = false;
        diagramShell.style.cursor = 'default';
      };

      window.onmousemove = (e) => {
        if (!isPanning) return;

        const current = ensureViewport();
        current.x = panOrigin.x + (e.clientX - panStart.x);
        current.y = panOrigin.y + (e.clientY - panStart.y);
        saveDiagramState(projectId, diagramState);
        renderCanvas();
      };
    }

    function syncInspector() {
      const node = selectedNode();
      const edge = selectedEdge();

      if (nodeLabel) nodeLabel.value = node?.data?.label || '';
      if (nodeTypeInput) nodeTypeInput.value = node?.type || 'server';
      if (nodeColorInput) nodeColorInput.value = node?.style?.color || '';
      if (nodeDescription) nodeDescription.value = node?.data?.description || '';
      if (edgeEditLabel) edgeEditLabel.value = edge?.label || '';
      if (edgeArrow) edgeArrow.value = edge?.arrow || 'end';
      if (edgeCurve) edgeCurve.value = String(edge?.curve ?? 0.35);
      if (edgeStroke) edgeStroke.value = String(edge?.strokeWidth ?? 2);
      if (edgeColor) edgeColor.value = edge?.color || '#2563eb';
      if (selectedEdgeTitle) selectedEdgeTitle.textContent = edge ? `Selected Edge: ${edge.label || edge.id}` : 'Selected Edge';
      if (bottomSummary) {
        if (node) {
          bottomSummary.textContent = `노드 선택됨: ${node.data?.label || node.id}`;
        } else if (edge) {
          bottomSummary.textContent = `연결선 선택됨: ${edge.label || edge.id}`;
        } else {
          bottomSummary.textContent = '선택 항목 없음';
        }
      }
    }

    function render() {
      diagramState = ensureDiagramState(projectId);
      const diagram = currentDiagram();

      if (!diagram) {
        if (diagramName) diagramName.textContent = '다이어그램';
        if (diagramMeta) diagramMeta.textContent = '0 nodes / 0 edges';
        if (diagramStats) diagramStats.textContent = '0 nodes';
        if (diagramViewport) diagramViewport.textContent = '100% / drag to move';
        renderDiagramSwitcher();
        syncInspector();
        updateSelectOptions();
        renderCanvas();
        return;
      }

      const viewport = ensureViewport();
      if (diagramName) diagramName.textContent = diagram.name;
      if (diagramMeta) diagramMeta.textContent = `${diagram.nodes.length} nodes / ${diagram.edges.length} edges`;
      if (diagramStats) diagramStats.textContent = `${diagram.nodes.length} nodes`;
      if (diagramViewport) diagramViewport.textContent = `${Math.round(viewport.zoom * 100)}% / drag to move`;
      if (panToggleBtn) panToggleBtn.textContent = diagramState.panMode ? 'Pan Mode: On' : 'Pan Mode';

      syncInspector();
      renderDiagramSwitcher();
      updateSelectOptions();
      renderEdges(diagram);
      renderCanvas();
    }

    function changeZoom(delta) {
      const viewport = ensureViewport();
      viewport.zoom = Number(Math.max(minZoom, Math.min(maxZoom, viewport.zoom + delta)).toFixed(2));
      persist();
    }

    function resetZoom() {
      const viewport = ensureViewport();
      viewport.zoom = 1;
      viewport.x = 80;
      viewport.y = 70;
      persist();
    }

    function fitView() {
      const diagram = currentDiagram();
      if (!diagram || diagram.nodes.length === 0) return resetZoom();

      const minX = Math.min(...diagram.nodes.map((node) => node.position.x));
      const minY = Math.min(...diagram.nodes.map((node) => node.position.y));
      const maxX = Math.max(...diagram.nodes.map((node) => node.position.x));
      const maxY = Math.max(...diagram.nodes.map((node) => node.position.y));
      const width = Math.max(maxX - minX + 220, 1);
      const height = Math.max(maxY - minY + 140, 1);
      const viewport = ensureViewport();
      const scaleX = (diagramShell.clientWidth - 120) / width;
      const scaleY = (diagramShell.clientHeight - 120) / height;

      viewport.zoom = Number(Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY))).toFixed(2));
      viewport.x = 60 - minX * viewport.zoom;
      viewport.y = 60 - minY * viewport.zoom;
      persist();
    }

    qs('[data-diagram-create]')?.addEventListener('click', () => {
      const name = prompt('New diagram name', `Diagram ${diagramState.diagrams.length + 1}`);
      if (!name?.trim()) return;

      const next = {
        id: uid('diagram'),
        name: name.trim(),
        nodes: [],
        edges: [],
        viewport: { x: 80, y: 70, zoom: 1 },
      };

      diagramState.diagrams.push(next);
      diagramState.activeDiagramId = next.id;
      diagramState.selectedNodeId = null;
      persist();
    });

    qs('[data-diagram-rename]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      if (!diagram) return;

      const name = prompt('Rename diagram', diagram.name);
      if (!name?.trim()) return;

      diagram.name = name.trim();
      persist();
    });

    qs('[data-diagram-delete]')?.addEventListener('click', () => {
      if (diagramState.diagrams.length <= 1) {
        return alert('최소 1개의 다이어그램은 유지되어야 합니다.');
      }

      const diagram = currentDiagram();
      if (!diagram) return;
      if (!confirm(`"${diagram.name}"를 삭제할까요?`)) return;

      diagramState.diagrams = diagramState.diagrams.filter((d) => d.id !== diagram.id);
      diagramState.activeDiagramId = diagramState.diagrams[0]?.id || null;
      diagramState.selectedNodeId = diagramState.diagrams[0]?.nodes[0]?.id || null;
      persist();
    });

    qs('[data-diagram-add-node]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      if (!diagram) return;

      const label = prompt('Node label', `Node ${diagram.nodes.length + 1}`);
      if (!label?.trim()) return;

      const node = createNode('server');
      node.data.label = label.trim();
      diagram.nodes.push(node);
      diagramState.selectedNodeId = node.id;
      selectedEdgeId = null;
      persist();
    });

    qsa('[data-node-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-node-type') || 'server';
        const diagram = currentDiagram();
        if (!diagram) return;

        const node = createNode(type);
        diagram.nodes.push(node);
        diagramState.selectedNodeId = node.id;
        selectedEdgeId = null;
        persist();
      });

      btn.setAttribute('draggable', 'true');
      btn.addEventListener('dragstart', (e) => {
        dragPaletteType = btn.getAttribute('data-node-type') || 'server';
        btn.classList.add('dragging');

        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', dragPaletteType);
        }
      });

      btn.addEventListener('dragend', () => {
        dragPaletteType = null;
        btn.classList.remove('dragging');
        diagramShell.classList.remove('drop-ready');
      });
    });

    qs('[data-node-save]')?.addEventListener('click', () => {
      const node = selectedNode();
      if (!node) return;

      node.data.label = nodeLabel?.value.trim() || node.data.label;
      node.type = nodeTypeInput?.value.trim() || node.type;
      node.style = { ...(node.style || {}), color: nodeColorInput?.value.trim() || node.style?.color || '' };
      node.data.description = nodeDescription?.value.trim() || '';
      persist();
    });

    qs('[data-node-delete]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      const node = selectedNode();
      if (!diagram || !node) return;

      diagram.nodes = diagram.nodes.filter((item) => item.id !== node.id);
      diagram.edges = diagram.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
      diagramState.selectedNodeId = diagram.nodes[0]?.id || null;
      selectedEdgeId = null;
      persist();
    });

    qs('[data-edge-create]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      if (!diagram || diagram.nodes.length < 2) return alert('노드를 2개 이상 추가하세요.');

      const source = edgeSource?.value;
      const target = edgeTarget?.value;
      if (!source || !target || source === target) return;

      diagram.edges.push({
        id: uid('edge'),
        source,
        target,
        label: edgeLabel?.value.trim() || '',
        lineType: 'smoothstep',
        arrow: 'end',
        curve: 0.35,
        strokeWidth: 2,
        color: '#2563eb',
      });
      persist();
    });

    qs('[data-edge-save]')?.addEventListener('click', () => {
      const edge = selectedEdge();
      if (!edge) return;

      edge.label = edgeEditLabel?.value.trim() || '';
      edge.arrow = edgeArrow?.value || 'end';
      edge.curve = Number(edgeCurve?.value || 0.35);
      edge.strokeWidth = Number(edgeStroke?.value || 2);
      edge.color = edgeColor?.value || '#2563eb';
      persist();
    });

    qs('[data-edge-delete-selected]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      const edge = selectedEdge();
      if (!diagram || !edge) return;

      diagram.edges = diagram.edges.filter((item) => item.id !== edge.id);
      selectedEdgeId = null;
      persist();
    });

    zoomInBtn?.addEventListener('click', () => changeZoom(zoomStep));
    zoomOutBtn?.addEventListener('click', () => changeZoom(-zoomStep));
    zoomResetBtn?.addEventListener('click', () => resetZoom());
    fitViewBtn?.addEventListener('click', () => fitView());
    panToggleBtn?.addEventListener('click', () => {
      diagramState.panMode = !diagramState.panMode;
      persist();
    });

    qs('[data-save-section="diagram"]')?.addEventListener('click', () => {
      const diagram = currentDiagram();
      if (!diagram) return;

      saveDiagramState(projectId, diagramState);
      alert('diagram을 로컬 스토리지에 저장했습니다.');
    });

    render();
  }

  window.ProjectDiagramEditor = { init };
})();
