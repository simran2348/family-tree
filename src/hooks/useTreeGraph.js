import { useMemo } from 'react';
import { useTreeStore, useActiveTree } from '../store/familyTreeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import { computeLayout, getVisibleIds } from '../utils/layout';
import { getParentLinks, getChildren, getDescendants, hasRelationship } from '../utils/graph';
import { getRelationshipLabel } from '../utils/kinship';

/** Converts the active tree + settings into React Flow nodes and edges. */
export function useTreeGraph() {
  const tree = useActiveTree();
  const selectedId = useTreeStore((s) => s.selectedId);
  const layoutSettings = useSettingsStore((s) => s.layout);
  const card = useSettingsStore((s) => s.card);
  const relativeTo = useSettingsStore((s) => s.general.relativeTo);
  const exportFilter = useUiStore((s) => s.exportFilter);

  const preset = tree?.layoutPreset || 'vertical';
  const focusId = tree?.layoutFocusId && tree.people[tree.layoutFocusId] ? tree.layoutFocusId : tree?.homePersonId;

  const effectiveLayout = useMemo(
    () => ({
      ...layoutSettings,
      cardHeight: card.layout === 'vertical' ? Math.max(layoutSettings.cardHeight, card.photoSize + 78) : layoutSettings.cardHeight,
      cardWidth: card.layout === 'vertical' ? Math.min(layoutSettings.cardWidth, 200) : layoutSettings.cardWidth,
    }),
    [layoutSettings, card.layout, card.photoSize],
  );

  const visible = useMemo(
    () => (tree ? getVisibleIds(tree, { preset, focusId, collapsed: tree.collapsed, filter: exportFilter }) : new Set()),
    [tree, preset, focusId, exportFilter],
  );

  const layout = useMemo(
    () => (tree ? computeLayout(tree, { preset, focusId, visible, layout: effectiveLayout }) : null),
    [tree, preset, focusId, visible, effectiveLayout],
  );

  const refId = relativeTo === 'selected' ? selectedId : tree?.homePersonId;

  const nodes = useMemo(() => {
    if (!tree || !layout) return [];
    const manual = tree.layoutMode === 'manual';
    return [...visible].map((id) => {
      const position = (manual && tree.positions[id]) || layout.positions.get(id) || { x: 0, y: 0 };
      const childCount = getChildren(tree, id).length;
      const collapsed = tree.collapsed.includes(id);
      return {
        id,
        type: 'person',
        position,
        width: layout.cardW,
        height: layout.cardH,
        style: { width: layout.cardW, height: layout.cardH },
        draggable: manual, // cards stay locked while the layout is automatic
        data: {
          axis: layout.axis,
          relationLabel: card.showRelationship && refId ? getRelationshipLabel(tree, refId, id) : '',
          childCount,
          collapsed,
          hiddenCount: collapsed ? getDescendants(tree, id).size : 0,
        },
      };
    });
  }, [tree, layout, visible, refId, card.showRelationship]);

  const edges = useMemo(() => {
    if (!tree || !layout) return [];
    const out = [];
    for (const childId of visible) {
      const links = getParentLinks(tree, childId).filter((l) => visible.has(l.id));
      if (!links.length) continue;
      // Pair up two parents who are partners so the line drops from the middle of the couple.
      let pair = null;
      for (let i = 0; i < links.length && !pair; i++) {
        for (let j = i + 1; j < links.length; j++) {
          if (hasRelationship(tree, links[i].id, links[j].id, 'partner')) { pair = [links[i], links[j]]; break; }
        }
      }
      const groups = pair ? [pair, ...links.filter((l) => !pair.includes(l)).map((l) => [l])] : links.map((l) => [l]);
      for (const group of groups) {
        const parents = group.map((l) => l.id);
        out.push({
          id: `fam-${childId}-${parents.join('-')}`,
          source: parents[0],
          target: childId,
          type: 'family',
          data: { parents, axis: layout.axis, subtype: group[0].rel.subtype || 'biological' },
        });
      }
    }
    for (const rel of tree.relationships) {
      if (rel.type !== 'partner' || !visible.has(rel.source) || !visible.has(rel.target)) continue;
      out.push({
        id: `pt-${rel.id}`,
        source: rel.source,
        target: rel.target,
        type: 'partner',
        data: { status: rel.status, startDate: rel.startDate, axis: layout.axis },
      });
    }
    return out;
  }, [tree, layout, visible]);

  return { tree, nodes, edges, layout, visible };
}
