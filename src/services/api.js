// Small client for the json-server backend (server/db.json).
// In development Vite forwards /api/* to json-server on port 3001.
const BASE = import.meta.env.VITE_API_URL || '/api';

let online = null; // null until the first request finishes

function setOnline(next) {
  if (online === next) return;
  const wasKnown = online !== null;
  online = next;
  // Dynamic import avoids a circular import between the stores and this file.
  import('../store/uiStore').then(({ toast }) => {
    if (!next) toast('Backend is offline. Changes are saved in this browser and will sync when it is back.', 'warning', 5000);
    else if (wasKnown) toast('Backend is back online. Changes are syncing again.', 'success');
  });
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    setOnline(false);
    throw err;
  }
  // 5xx from the dev proxy means json-server is not running.
  if (res.status >= 500) setOnline(false);
  if (!res.ok) throw Object.assign(new Error(`${method} ${path} failed (${res.status})`), { status: res.status });
  setOnline(true);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
