import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, MiniMap, Controls, applyNodeChanges, useReactFlow,
} from '@xyflow/react';
import { useTreeGraph } from '../../hooks/useTreeGraph';
import { useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore, toast } from '../../store/uiStore';
import { useResolvedTheme, useMotion } from '../../hooks/useTheme';
import PersonCard from './PersonCard';
import { FamilyEdge, PartnerEdge } from './RelationshipConnector';
import EmptyTree from './EmptyTree';

const nodeTypes = { person: PersonCard };
const edgeTypes = { family: FamilyEdge, partner: PartnerEdge };

export default function FamilyTree() {
  const { tree, nodes: graphNodes, edges } = useTreeGraph();
  const [nodes, setNodes] = useState(graphNodes);
  const rf = useReactFlow();
  const duration = useMotion();
  const canvas = useSettingsStore((s) => s.canvas);
  const { colors } = useResolvedTheme();
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const toggleMultiSelect = useTreeStore((s) => s.toggleMultiSelect);
  const setPositions = useTreeStore((s) => s.setPositions);
  const selectedId = useTreeStore((s) => s.selectedId);
  const openContextMenu = useUiStore((s) => s.openContextMenu);
  const closeContextMenu = useUiStore((s) => s.closeContextMenu);
  const openModal = useUiStore((s) => s.openModal);
  const viewportRequest = useUiStore((s) => s.viewportRequest);
  const exporting = useUiStore((s) => s.exporting);

  useEffect(() => setNodes(graphNodes), [graphNodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes.filter((c) => c.type === 'position' || c.type === 'dimensions'), nds)),
    [],
  );

  // Cards are only draggable in manual layout, so a drag just saves that card's new spot.
  const onNodeDragStop = useCallback(
    (_e, node) => {
      if (tree.layoutMode === 'manual') setPositions({ [node.id]: node.position });
    },
    [tree.layoutMode, setPositions],
  );

  const onNodeClick = useCallback(
    (e, node) => {
      closeContextMenu();
      if (e.shiftKey || e.metaKey || e.ctrlKey) toggleMultiSelect(node.id);
      else selectPerson(node.id);
    },
    [selectPerson, toggleMultiSelect, closeContextMenu],
  );

  const onNodeDoubleClick = useCallback(
    (_e, node) => {
      selectPerson(node.id);
      openModal('profile', { personId: node.id });
    },
    [selectPerson, openModal],
  );

  const onNodeContextMenu = useCallback(
    (e, node) => {
      e.preventDefault();
      selectPerson(node.id);
      openContextMenu({ personId: node.id, x: e.clientX, y: e.clientY });
    },
    [selectPerson, openContextMenu],
  );

  // Viewport commands coming from the toolbar, search and keyboard shortcuts.
  useEffect(() => {
    if (!viewportRequest) return;
    const { kind, id } = viewportRequest;
    if (kind === 'fit') rf.fitView({ padding: canvas.padding, duration });
    if (kind === 'zoomIn') rf.zoomIn({ duration: duration / 2 });
    if (kind === 'zoomOut') rf.zoomOut({ duration: duration / 2 });
    if (kind === 'center' || kind === 'reset') {
      const target = id || (kind === 'reset' ? tree.homePersonId : selectedId);
      const node = target && rf.getInternalNode(target);
      if (!node) {
        if (kind === 'reset') rf.fitView({ padding: canvas.padding, duration });
        else if (target) toast('That person is hidden by the current layout or a collapsed branch.', 'warning');
        return;
      }
      const w = node.measured?.width ?? node.width;
      const h = node.measured?.height ?? node.height;
      const zoom = kind === 'reset' ? canvas.defaultZoom : Math.max(rf.getZoom(), 0.95);
      rf.setCenter(node.internals.positionAbsolute.x + w / 2, node.internals.positionAbsolute.y + h / 2, { zoom, duration });
    }
  }, [viewportRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fit when switching trees or layouts.
  const fitKey = `${tree.id}|${tree.layoutPreset}|${tree.layoutFocusId || ''}`;
  const lastFitKey = useRef(fitKey);
  useEffect(() => {
    if (lastFitKey.current === fitKey) return undefined;
    lastFitKey.current = fitKey;
    const t = setTimeout(() => rf.fitView({ padding: canvas.padding, duration }), 60);
    return () => clearTimeout(t);
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // On first load, show readable cards around the home person when the whole tree is too wide to read.
  const initialView = useCallback(async () => {
    await rf.fitView({ padding: canvas.padding, maxZoom: 1 });
    const n = tree.homePersonId && rf.getInternalNode(tree.homePersonId);
    if (rf.getZoom() < 0.6 && n) {
      const w = n.measured?.width ?? n.width ?? 0;
      const h = n.measured?.height ?? n.height ?? 0;
      rf.setCenter(n.internals.positionAbsolute.x + w / 2, n.internals.positionAbsolute.y + h / 2, { zoom: Math.max(0.75, canvas.defaultZoom * 0.75) });
    }
  }, [rf, canvas.padding, canvas.defaultZoom, tree.homePersonId]);
  useEffect(() => {
    const t = setTimeout(initialView, 120);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gridColor = canvas.gridColor || colors.gridColor;
  const gridOpacity = canvas.gridOpacity ?? colors.gridOpacity ?? 0.45;
  const background = canvas.background || colors.canvasBg;
  // The grid is a fixed screen-space layer: it does not scale or shift when zooming or panning.
  const style = useMemo(() => {
    const base = { background, '--canvas-fill': background };
    if (!canvas.showGrid) return base;
    const line = `color-mix(in srgb, ${gridColor} ${Math.round(gridOpacity * 100)}%, transparent)`;
    return {
      ...base,
      backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
      backgroundSize: `${canvas.gridSize}px ${canvas.gridSize}px`,
    };
  }, [background, canvas.showGrid, canvas.gridSize, gridColor, gridOpacity]);

  if (!Object.keys(tree.people).length) return <EmptyTree />;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onNodeDragStop={onNodeDragStop}
      onPaneClick={closeContextMenu}
      onMoveStart={closeContextMenu}
      minZoom={0.08}
      maxZoom={2.5}
      snapToGrid={canvas.snapToGrid}
      snapGrid={[canvas.gridSize / 2, canvas.gridSize / 2]}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnDoubleClick={false}
      panOnScroll={false}
      proOptions={{ hideAttribution: true }}
      style={style}
      aria-label="Family tree canvas"
    >
      {canvas.showMinimap && !exporting && (
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeColor={(n) => (n.id === selectedId ? colors.selected : colors.cardBorder)}
          nodeStrokeWidth={0}
          nodeBorderRadius={6}
          maskColor={`color-mix(in srgb, ${colors.canvasBg} 70%, transparent)`}
          className="!hidden sm:!block"
          style={{ width: 168, height: 112 }}
          ariaLabel="Minimap"
        />
      )}
      {canvas.showControls && !exporting && <Controls position="bottom-left" showInteractive={false} />}
    </ReactFlow>
  );
}
