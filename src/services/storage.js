// Storage adapter for the family-tree store.
//
// The json-server backend (server/db.json) is the main copy of the data:
//   trees    -> one record per tree   (GET/POST/PUT/DELETE /trees/:id)
//   app      -> tree order, active tree, selection, recent people (PUT /app)
// Every save is also written to IndexedDB, so the app keeps working when the
// backend is not running. Changes made offline are pushed on the next save.
// "Session only" storage keeps data in sessionStorage and never sends it to the backend.
import { get, set, del } from 'idb-keyval';
import { useSettingsStore } from '../store/settingsStore';
import { api } from './api';

const SYNC_DELAY = 400; // ms to wait for more edits before sending (e.g. while typing)
const RETRY_DELAY = 10000;

const sessionOnly = () => useSettingsStore.getState().privacy.storage === 'session';

// What the backend holds, as JSON strings, so only changed trees are sent.
// null means we have not read the backend yet (or it went offline).
let serverTrees = null;
let serverApp = '';

let latestValue = null;
let timer = null;
let syncing = Promise.resolve();

const appRecord = (state, version) => ({
  treeOrder: state.treeOrder,
  activeTreeId: state.activeTreeId,
  selectedId: state.selectedId,
  recent: state.recent,
  version,
});

async function readLocal(name) {
  const fromSession = sessionStorage.getItem(name);
  if (sessionOnly()) return fromSession;
  const value = await get(name);
  return value ?? fromSession ?? null;
}

async function loadServerState() {
  const [trees, app] = await Promise.all([api.get('/trees'), api.get('/app')]);
  serverTrees = new Map(trees.map((t) => [t.id, JSON.stringify(t)]));
  serverApp = JSON.stringify(app ?? {});
  return { trees, app: app ?? {} };
}

async function pushToServer(value) {
  if (serverTrees === null) await loadServerState();
  const { state, version } = JSON.parse(value);

  for (const [id, tree] of Object.entries(state.trees)) {
    const json = JSON.stringify(tree);
    if (serverTrees.get(id) === json) continue;
    if (serverTrees.has(id)) await api.put(`/trees/${encodeURIComponent(id)}`, tree);
    else await api.post('/trees', tree);
    serverTrees.set(id, json);
  }
  for (const id of [...serverTrees.keys()]) {
    if (state.trees[id]) continue;
    await api.delete(`/trees/${encodeURIComponent(id)}`);
    serverTrees.delete(id);
  }
  const app = appRecord(state, version);
  const appJson = JSON.stringify(app);
  if (appJson !== serverApp) {
    await api.put('/app', app);
    serverApp = appJson;
  }
}

function scheduleSync(value, delay = SYNC_DELAY) {
  latestValue = value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const v = latestValue;
    syncing = syncing.then(() => pushToServer(v)).catch((err) => {
      console.warn('Backend sync failed, will retry', err);
      serverTrees = null; // re-read the backend before the next attempt
      if (latestValue === v) scheduleSync(v, RETRY_DELAY);
    });
  }, delay);
}

export const treeStorage = {
  getItem: async (name) => {
    let local = null;
    try {
      local = await readLocal(name);
    } catch (err) {
      console.error('Failed to load saved trees', err);
    }
    if (sessionOnly()) return local;

    try {
      const { trees, app } = await loadServerState();
      if (!trees.length) {
        // Empty backend (first run): upload what this browser already has.
        if (local) scheduleSync(local, 0);
        return local;
      }
      const byId = Object.fromEntries(trees.map((t) => [t.id, t]));
      const order = (app.treeOrder || []).filter((id) => byId[id]);
      for (const t of trees) if (!order.includes(t.id)) order.push(t.id);
      const state = {
        trees: byId,
        treeOrder: order,
        activeTreeId: byId[app.activeTreeId] ? app.activeTreeId : order[0],
        selectedId: app.selectedId ?? null,
        recent: app.recent || [],
      };
      const value = JSON.stringify({ state, version: app.version ?? 1 });
      set(name, value).catch(() => {}); // refresh the offline copy
      return value;
    } catch {
      // Backend not running: use the copy saved in this browser.
      return local;
    }
  },
  setItem: async (name, value) => {
    try {
      if (sessionOnly()) {
        sessionStorage.setItem(name, value);
        return;
      }
      await set(name, value);
    } catch (err) {
      console.error('Failed to save trees', err);
      import('../store/uiStore').then(({ toast }) => toast('Could not save changes to local storage.', 'error'));
    }
    scheduleSync(value);
  },
  removeItem: async (name) => {
    sessionStorage.removeItem(name);
    await del(name);
  },
};

export async function clearPersistentTrees(name) {
  await del(name);
}

/**
 * Keeps settings (theme, layout, profile, ...) in the backend's `settings` record.
 * Settings still load instantly from localStorage; the backend copy wins once it arrives.
 */
export function startSettingsSync() {
  const store = useSettingsStore;
  const current = () => JSON.stringify(store.getState().exportSettings());
  let lastSent = '';
  let settingsTimer = null;

  const push = () => {
    if (sessionOnly()) return;
    const json = current();
    if (json === lastSent) return;
    api.put('/settings', JSON.parse(json))
      .then(() => { lastSent = json; })
      .catch(() => {
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(push, RETRY_DELAY);
      });
  };

  api.get('/settings')
    .then((remote) => {
      if (remote && Object.keys(remote).length) {
        lastSent = JSON.stringify(remote);
        if (lastSent !== current()) store.getState().replaceAll(remote);
        lastSent = current(); // after merging with defaults
      }
      push(); // first run: save this browser's settings to the backend
    })
    .catch(() => {})
    .finally(() => {
      // Start listening only after the backend copy is applied, so defaults never overwrite it.
      store.subscribe(() => {
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(push, SYNC_DELAY);
      });
    });
}
