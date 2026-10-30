// Safe wrapper around localStorage.
//
// localStorage is unavailable, or silently non-persistent, in more places than
// people expect: site data blocked, some private-browsing modes, and the in-app
// browsers that mail clients open links in — which is exactly how members reach
// this app, since the login code arrives by email. Touching it unguarded throws
// SecurityError and, with no error boundary, blanked the entire page.
//
// Reads come from memory first, so a value written during this page load is
// always readable even when the browser discards the write. The session then
// works normally; it just does not survive closing the tab.

const memory = new Map();

let persistent = false;
try {
  const probe = '__storage_probe__';
  window.localStorage.setItem(probe, probe);
  persistent = window.localStorage.getItem(probe) === probe;
  window.localStorage.removeItem(probe);
} catch {
  persistent = false;
}

/** False when the browser blocks or discards storage — the session won't outlive the tab. */
export const storageIsPersistent = persistent;

export function getItem(key) {
  if (memory.has(key)) return memory.get(key);
  if (!persistent) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  if (value === undefined || value === null) return removeItem(key);
  memory.set(key, String(value));
  if (!persistent) return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* quota or policy — the memory copy still serves this session */
  }
}

export function removeItem(key) {
  memory.delete(key);
  if (!persistent) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** JSON.parse that never throws — a corrupt entry must not take the app down. */
export function getJSON(key) {
  const raw = getItem(key);
  if (!raw || raw === 'undefined') return null;
  try {
    return JSON.parse(raw);
  } catch {
    removeItem(key);
    return null;
  }
}

export function setJSON(key, value) {
  if (value === undefined) return removeItem(key);
  setItem(key, JSON.stringify(value));
}
