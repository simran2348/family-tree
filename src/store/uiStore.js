import { create } from 'zustand';
import { uid } from '../utils/id';

// Transient UI state – never persisted.
export const useUiStore = create((set, get) => ({
  sidebarOpen: typeof window === 'undefined' ? true : window.innerWidth >= 900,
  sidebarTab: 'personal',
  editing: false,
  settings: { open: false, section: 'general' },
  treeSettingsOpen: false,
  modal: null, // { type, props }
  contextMenu: null, // { personId, x, y }
  exportFilter: null, // Set of ids rendered during an export
  exporting: false,
  toasts: [],
  shortcutsOpen: false,
  fullscreen: false,
  viewportRequest: null, // { kind: 'fit' | 'center' | 'reset' | 'zoomIn' | 'zoomOut', id?, n }

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setEditing: (editing) => set({ editing }),
  openSettings: (section = 'general') => set({ settings: { open: true, section }, treeSettingsOpen: false }),
  closeSettings: () => set((s) => ({ settings: { ...s.settings, open: false } })),
  setSettingsSection: (section) => set((s) => ({ settings: { ...s.settings, section } })),
  setTreeSettingsOpen: (open) => set({ treeSettingsOpen: open }),
  openModal: (type, props = {}) => set({ modal: { type, props }, contextMenu: null }),
  closeModal: () => set({ modal: null }),
  openContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),
  setExportFilter: (filter) => set({ exportFilter: filter }),
  setExporting: (exporting) => set({ exporting }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  requestViewport: (kind, id = null) => set({ viewportRequest: { kind, id, n: Date.now() + Math.random() } }),

  toast: (message, tone = 'info', timeout = 3200) => {
    const id = uid('t');
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), timeout);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (...args) => useUiStore.getState().toast(...args);
