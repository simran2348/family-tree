import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { treeStorage } from '../services/storage';
import { createSampleTree, createEmptyTree } from '../constants/sampleData';
import { addRelative, removePerson, suggestPosition, normalizeTree } from '../services/relativeService';
import { validateRelationship } from '../utils/graph';
import { uid } from '../utils/id';
import { useSettingsStore } from './settingsStore';
import { getEffectiveDimensions } from '../utils/layout';

const HISTORY_LIMIT = 60;

export const useTreeStore = create(
  persist(
    (set, get) => {
      /** Applies `recipe` to a shallow copy of the active tree and records an undo step. */
      const commit = (label, recipe, { history = true } = {}) => {
        const s = get();
        const tree = s.trees[s.activeTreeId];
        if (!tree) return undefined;
        const draft = { ...tree };
        const result = recipe(draft);
        draft.updatedAt = new Date().toISOString();
        set({
          trees: { ...s.trees, [tree.id]: draft },
          past: history ? [...s.past.slice(-HISTORY_LIMIT + 1), { treeId: tree.id, tree, label }] : s.past,
          future: history ? [] : s.future,
        });
        return result;
      };

      return {
        trees: {},
        treeOrder: [],
        activeTreeId: null,
        selectedId: null,
        multiSelect: [],
        recent: [],
        past: [],
        future: [],
        hydrated: false,

        // ---- selection -------------------------------------------------------
        selectPerson: (id) => {
          if (!id) return set({ selectedId: null });
          set((s) => ({ selectedId: id, recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8) }));
        },
        toggleMultiSelect: (id) =>
          set((s) => ({ multiSelect: s.multiSelect.includes(id) ? s.multiSelect.filter((x) => x !== id) : [...s.multiSelect, id] })),
        setMultiSelect: (ids) => set({ multiSelect: ids }),

        // ---- people ----------------------------------------------------------
        addRelative: (opts) => {
          try {
            const id = commit(opts.kind === 'none' ? 'Add person' : `Add ${opts.kind}`, (draft) => {
              const newId = addRelative(draft, opts);
              if (!draft.homePersonId) draft.homePersonId = newId;
              if (draft.layoutMode === 'manual' && !draft.positions[newId]) {
                const settings = useSettingsStore.getState();
                const pos = suggestPosition(draft, opts.anchorId, opts.kind, getEffectiveDimensions(settings.layout, draft.layoutPreset));
                if (pos) draft.positions = { ...draft.positions, [newId]: pos };
              }
              return newId;
            });
            if (id) get().selectPerson(id);
            return { ok: true, id };
          } catch (err) {
            return { ok: false, error: err.message };
          }
        },
        updatePerson: (id, patch, label = 'Edit person') =>
          commit(label, (draft) => {
            if (!draft.people[id]) return;
            draft.people = { ...draft.people, [id]: { ...draft.people[id], ...patch, updatedAt: new Date().toISOString() } };
          }),
        deletePerson: (id) => {
          commit('Delete person', (draft) => removePerson(draft, id));
          set((s) => ({
            selectedId: s.selectedId === id ? s.trees[s.activeTreeId]?.homePersonId || null : s.selectedId,
            multiSelect: s.multiSelect.filter((x) => x !== id),
            recent: s.recent.filter((x) => x !== id),
          }));
        },
        setHomePerson: (id) => commit('Set home person', (draft) => { draft.homePersonId = id; }),

        // ---- relationships ---------------------------------------------------
        addRelationship: (rel) => {
          const tree = get().trees[get().activeTreeId];
          const full = { id: uid('r'), ...rel };
          const error = validateRelationship(tree, full);
          if (error) return { ok: false, error };
          commit('Add relationship', (draft) => { draft.relationships = [...draft.relationships, full]; });
          return { ok: true };
        },
        updateRelationship: (id, patch) =>
          commit('Edit relationship', (draft) => {
            draft.relationships = draft.relationships.map((r) => (r.id === id ? { ...r, ...patch } : r));
          }),
        removeRelationship: (id) =>
          commit('Remove relationship', (draft) => { draft.relationships = draft.relationships.filter((r) => r.id !== id); }),

        // ---- layout ----------------------------------------------------------
        setPositions: (positions, { switchToManual = true } = {}) =>
          commit('Move card', (draft) => {
            draft.positions = { ...draft.positions, ...positions };
            if (switchToManual) draft.layoutMode = 'manual';
          }),
        setLayoutMode: (mode, seedPositions = null) =>
          commit(mode === 'manual' ? 'Manual layout' : 'Automatic layout', (draft) => {
            draft.layoutMode = mode;
            if (seedPositions) draft.positions = { ...seedPositions, ...draft.positions };
          }),
        setLayoutPreset: (preset, focusId) =>
          commit('Change layout', (draft) => {
            draft.layoutPreset = preset;
            draft.layoutMode = 'auto';
            if (focusId) draft.layoutFocusId = focusId;
          }),
        setLayoutFocus: (id) => commit('Change focus', (draft) => { draft.layoutFocusId = id; }),
        resetLayout: () => commit('Reset layout', (draft) => { draft.positions = {}; draft.layoutMode = 'auto'; }),
        toggleCollapsed: (id) =>
          commit('Toggle branch', (draft) => {
            draft.collapsed = draft.collapsed.includes(id) ? draft.collapsed.filter((c) => c !== id) : [...draft.collapsed, id];
          }),
        expandAll: () => commit('Expand all', (draft) => { draft.collapsed = []; }),

        // ---- history ---------------------------------------------------------
        undo: () => {
          const s = get();
          const step = s.past[s.past.length - 1];
          if (!step || step.treeId !== s.activeTreeId) return null;
          const current = s.trees[step.treeId];
          set({
            trees: { ...s.trees, [step.treeId]: step.tree },
            past: s.past.slice(0, -1),
            future: [...s.future, { treeId: step.treeId, tree: current, label: step.label }],
          });
          const sel = get().selectedId;
          if (sel && !step.tree.people[sel]) set({ selectedId: step.tree.homePersonId });
          return step.label;
        },
        redo: () => {
          const s = get();
          const step = s.future[s.future.length - 1];
          if (!step || step.treeId !== s.activeTreeId) return null;
          const current = s.trees[step.treeId];
          set({
            trees: { ...s.trees, [step.treeId]: step.tree },
            future: s.future.slice(0, -1),
            past: [...s.past, { treeId: step.treeId, tree: current, label: step.label }],
          });
          return step.label;
        },

        // ---- trees -----------------------------------------------------------
        updateTreeMeta: (patch) => commit('Rename tree', (draft) => Object.assign(draft, patch)),
        createTree: (name, { sample = false } = {}) => {
          const tree = sample ? { ...createSampleTree(), name: name || 'The Hartley Family' } : createEmptyTree(name);
          tree.layoutPreset = useSettingsStore.getState().general.defaultLayout;
          set((s) => ({
            trees: { ...s.trees, [tree.id]: tree },
            treeOrder: [...s.treeOrder, tree.id],
            activeTreeId: tree.id,
            selectedId: tree.homePersonId,
            past: [], future: [], multiSelect: [],
          }));
          return tree.id;
        },
        addImportedTree: (raw, nameOverride) => {
          const tree = normalizeTree(raw);
          if (nameOverride) tree.name = nameOverride;
          set((s) => ({
            trees: { ...s.trees, [tree.id]: tree },
            treeOrder: [...s.treeOrder, tree.id],
            activeTreeId: tree.id,
            selectedId: tree.homePersonId,
            past: [], future: [], multiSelect: [],
          }));
          return tree.id;
        },
        duplicateTree: (id) => {
          const src = get().trees[id];
          if (!src) return null;
          const copy = { ...JSON.parse(JSON.stringify(src)), id: uid('tree'), name: `${src.name} (copy)`, createdAt: new Date().toISOString() };
          set((s) => ({ trees: { ...s.trees, [copy.id]: copy }, treeOrder: [...s.treeOrder, copy.id], activeTreeId: copy.id, past: [], future: [] }));
          return copy.id;
        },
        renameTree: (id, name) =>
          set((s) => ({ trees: { ...s.trees, [id]: { ...s.trees[id], name, updatedAt: new Date().toISOString() } } })),
        deleteTree: (id) => {
          const s = get();
          const trees = { ...s.trees };
          delete trees[id];
          const treeOrder = s.treeOrder.filter((t) => t !== id);
          if (!treeOrder.length) {
            const fresh = createEmptyTree('My family tree');
            trees[fresh.id] = fresh;
            treeOrder.push(fresh.id);
          }
          const activeTreeId = s.activeTreeId === id ? treeOrder[0] : s.activeTreeId;
          set({ trees, treeOrder, activeTreeId, selectedId: trees[activeTreeId].homePersonId, past: [], future: [], multiSelect: [] });
        },
        switchTree: (id) => {
          const tree = get().trees[id];
          if (!tree) return;
          set({ activeTreeId: id, selectedId: tree.homePersonId, past: [], future: [], multiSelect: [], recent: [] });
        },

        // ---- backup ----------------------------------------------------------
        exportBackup: () => {
          const s = get();
          return { trees: s.treeOrder.map((id) => s.trees[id]), activeTreeId: s.activeTreeId };
        },
        restoreBackup: (backup, { replace = true } = {}) => {
          const incoming = (backup.trees || []).map((t) => normalizeTree(t, { keepId: replace }));
          if (!incoming.length) throw new Error('The backup does not contain any family trees.');
          set((s) => {
            const trees = replace ? {} : { ...s.trees };
            const order = replace ? [] : [...s.treeOrder];
            for (const t of incoming) { trees[t.id] = t; if (!order.includes(t.id)) order.push(t.id); }
            const activeTreeId = trees[backup.activeTreeId] ? backup.activeTreeId : incoming[0].id;
            return { trees, treeOrder: order, activeTreeId, selectedId: trees[activeTreeId].homePersonId, past: [], future: [], multiSelect: [], recent: [] };
          });
        },
        resetToSample: () => {
          const tree = createSampleTree();
          set({ trees: { [tree.id]: tree }, treeOrder: [tree.id], activeTreeId: tree.id, selectedId: tree.homePersonId, past: [], future: [], multiSelect: [], recent: [] });
        },
        clearAllData: () => {
          const tree = createEmptyTree('My family tree');
          set({ trees: { [tree.id]: tree }, treeOrder: [tree.id], activeTreeId: tree.id, selectedId: null, past: [], future: [], multiSelect: [], recent: [] });
        },
      };
    },
    {
      name: 'ftb-trees',
      version: 1,
      storage: createJSONStorage(() => treeStorage),
      partialize: (s) => ({ trees: s.trees, treeOrder: s.treeOrder, activeTreeId: s.activeTreeId, selectedId: s.selectedId, recent: s.recent }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Could not restore saved trees', error);
        const store = useTreeStore;
        const s = store.getState();
        if (!s.treeOrder.length || !s.trees[s.activeTreeId]) {
          const tree = createSampleTree();
          tree.layoutPreset = useSettingsStore.getState().general.defaultLayout;
          store.setState({ trees: { [tree.id]: tree }, treeOrder: [tree.id], activeTreeId: tree.id, selectedId: tree.homePersonId });
        } else if (!s.trees[s.activeTreeId].people[s.selectedId]) {
          store.setState({ selectedId: s.trees[s.activeTreeId].homePersonId });
        }
        store.setState({ hydrated: true });
      },
    },
  ),
);

export const useActiveTree = () => useTreeStore((s) => s.trees[s.activeTreeId]);
export const useSelectedPerson = () =>
  useTreeStore((s) => (s.selectedId ? s.trees[s.activeTreeId]?.people[s.selectedId] : null));
