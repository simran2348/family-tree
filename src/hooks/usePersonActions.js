import { useMemo } from 'react';
import { useTreeStore } from '../store/familyTreeStore';
import { useUiStore, toast } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { displayName } from '../utils/person';
import { getDescendants } from '../utils/graph';

/** Shared person actions used by the sidebar, context menu and keyboard shortcuts. */
export function usePersonActions() {
  return useMemo(() => {
    const ui = () => useUiStore.getState();
    const store = () => useTreeStore.getState();
    const tree = () => store().trees[store().activeTreeId];

    const actions = {
      openProfile: (id) => ui().openModal('profile', { personId: id }),
      edit: (id) => {
        store().selectPerson(id);
        ui().setSidebarOpen(true);
        ui().setEditing(true);
      },
      add: (kind, anchorId) => {
        if (!anchorId && kind !== 'none') return toast('Select a person first.', 'warning');
        ui().openModal('addPerson', { kind, anchorId });
      },
      center: (id) => ui().requestViewport('center', id),
      setHome: (id) => {
        store().setHomePerson(id);
        toast(`${displayName(tree().people[id])} is now the home person.`, 'success');
      },
      focusLayout: (id) => {
        const t = tree();
        const preset = ['descendants', 'ancestors', 'pedigree'].includes(t.layoutPreset) ? t.layoutPreset : 'descendants';
        store().setLayoutPreset(preset, id);
      },
      toggleBranch: (id) => store().toggleCollapsed(id),
      toggleMulti: (id) => store().toggleMultiSelect(id),
      remove: (id) => {
        const t = tree();
        const person = t.people[id];
        if (!person) return;
        const doDelete = () => {
          store().deletePerson(id);
          toast(`${displayName(person)} was deleted. Press ⌘Z to undo.`, 'success', 5000);
        };
        if (!useSettingsStore.getState().general.confirmDeletes) return doDelete();
        const relCount = t.relationships.filter((r) => r.source === id || r.target === id).length;
        const desc = getDescendants(t, id).size;
        ui().openModal('confirm', {
          title: `Delete ${displayName(person)}?`,
          message: `This removes the person and ${relCount} relationship${relCount === 1 ? '' : 's'}. ${desc ? `Their ${desc} descendant${desc === 1 ? '' : 's'} will stay in the tree but lose this link.` : ''}`,
          confirmLabel: 'Delete person',
          danger: true,
          onConfirm: doDelete,
        });
      },
    };
    return actions;
  }, []);
}
