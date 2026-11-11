import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactFlow } from '@xyflow/react';
import { useTreeStore } from '../store/familyTreeStore';
import { useUiStore, toast } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { usePersonActions } from './usePersonActions';
import { toggleFullscreen } from '../components/family-tree/TreeControls';

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/** Finds the closest card in an arrow-key direction from the selected card. */
function nearestInDirection(nodes, fromId, dir) {
  const from = nodes.find((n) => n.id === fromId);
  if (!from) return null;
  const c = (n) => ({ x: n.internals.positionAbsolute.x + (n.measured?.width ?? 0) / 2, y: n.internals.positionAbsolute.y + (n.measured?.height ?? 0) / 2 });
  const o = c(from);
  let best = null;
  for (const n of nodes) {
    if (n.id === fromId) continue;
    const p = c(n);
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const main = dir === 'ArrowRight' ? dx : dir === 'ArrowLeft' ? -dx : dir === 'ArrowDown' ? dy : -dy;
    const cross = dir === 'ArrowRight' || dir === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
    if (main <= 4) continue;
    const score = main + cross * 2.2;
    if (!best || score < best.score) best = { id: n.id, score };
  }
  return best?.id || null;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const rf = useReactFlow();
  const actions = usePersonActions();

  useEffect(() => {
    const onKey = (e) => {
      const ui = useUiStore.getState();
      const store = useTreeStore.getState();
      const keyboardNav = useSettingsStore.getState().accessibility.keyboardNav;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key;

      if (mod && key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus(); return; }
      if (mod && key === ',') { e.preventDefault(); ui.openSettings('general'); return; }
      if (isTyping(document.activeElement)) return;
      if (mod && key.toLowerCase() === 'z') {
        e.preventDefault();
        const label = e.shiftKey ? store.redo() : store.undo();
        if (label) toast(`${e.shiftKey ? 'Redid' : 'Undid'}: ${label}`);
        return;
      }
      if (mod && key.toLowerCase() === 'y') { e.preventDefault(); const l = store.redo(); if (l) toast(`Redid: ${l}`); return; }
      if (mod || e.altKey) return;
      if (ui.modal || ui.settings.open || ui.shortcutsOpen) return;

      if (key === '?') { ui.setShortcutsOpen(true); return; }
      if (key === '/') { e.preventDefault(); document.getElementById('global-search')?.focus(); return; }
      if (key === '[') { ui.toggleSidebar(); return; }
      if (key === 'Escape') { ui.closeContextMenu(); if (store.multiSelect.length) store.setMultiSelect([]); return; }

      const onTree = location.pathname === '/';
      if (onTree) {
        if (key === '+' || key === '=') { ui.requestViewport('zoomIn'); return; }
        if (key === '-' || key === '_') { ui.requestViewport('zoomOut'); return; }
        if (key === '0') { ui.requestViewport('reset'); return; }
        if (key.toLowerCase() === 'f' && !e.shiftKey) { ui.requestViewport('fit'); return; }
        if (key === 'F' && e.shiftKey) { toggleFullscreen(); return; }
        if (key === '.') { ui.requestViewport('center'); return; }
        if (key.toLowerCase() === 't') { ui.setTreeSettingsOpen(!ui.treeSettingsOpen); return; }
      }
      if (!keyboardNav) return;
      const sel = store.selectedId;
      const tree = store.trees[store.activeTreeId];

      if (key.toLowerCase() === 'h' && tree.homePersonId) {
        store.selectPerson(tree.homePersonId);
        if (onTree) ui.requestViewport('center', tree.homePersonId); else navigate('/');
        return;
      }
      if (!sel || !tree.people[sel]) return;
      if (onTree && key.startsWith('Arrow')) {
        e.preventDefault();
        const next = nearestInDirection(rf.getNodes().map((n) => rf.getInternalNode(n.id)).filter(Boolean), sel, key);
        if (next) { store.selectPerson(next); ui.requestViewport('center', next); }
        return;
      }
      const map = { e: () => actions.edit(sel), p: () => actions.add('parent', sel), s: () => actions.add('sibling', sel), m: () => actions.add('partner', sel), c: () => actions.add('child', sel) };
      if (map[key.toLowerCase()]) { e.preventDefault(); map[key.toLowerCase()](); return; }
      if (key === 'Enter') { actions.openProfile(sel); return; }
      if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); actions.remove(sel); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname, navigate, rf, actions]);
}
