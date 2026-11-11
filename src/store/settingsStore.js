import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from '../constants/defaults';

const clone = (o) => JSON.parse(JSON.stringify(o));

function mergeDefaults(saved) {
  const out = clone(DEFAULT_SETTINGS);
  if (!saved || typeof saved !== 'object') return out;
  for (const section of Object.keys(out)) {
    if (saved[section] && typeof saved[section] === 'object') out[section] = { ...out[section], ...saved[section] };
  }
  return out;
}

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...clone(DEFAULT_SETTINGS),
      update: (section, patch) => set((s) => ({ [section]: { ...s[section], ...patch } })),
      resetSection: (section) => set({ [section]: clone(DEFAULT_SETTINGS[section]) }),
      resetSections: (sections) => set(Object.fromEntries(sections.map((k) => [k, clone(DEFAULT_SETTINGS[k])]))),
      resetAll: () => set(clone(DEFAULT_SETTINGS)),
      replaceAll: (data) => set(mergeDefaults(data)),
      exportSettings: () => {
        const s = get();
        return Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, s[k]]));
      },
    }),
    {
      name: 'ftb-settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, s[k]])),
      merge: (persisted, current) => ({ ...current, ...mergeDefaults(persisted) }),
    },
  ),
);
