// Copia de las partidas en el disco del servidor (server/saves.mjs → carpeta saves/ del proyecto). El juego sigue
// leyendo y escribiendo en localStorage (rápido y síncrono); esto lo refleja en el servidor:
//   · al guardar o borrar una ranura se envía al servidor (en segundo plano, con aviso si falla);
//   · al arrancar, se trae del servidor lo que sea más reciente y se sube lo local que el servidor no tenga.
// Cada navegador tiene un id de dueño (ecos.owner); si el navegador lo pierde, «Cargar partida → Importar →
// Desde el servidor» lista TODAS las partidas guardadas para recuperarlas.
import { SaveSystem, SAVE_SLOTS, saveKey } from './state.js';

export const SAVES_URL = '/__saves';
const OWNER_KEY = 'ecos.owner';
const OWNER_RE = /^[a-z0-9]{8,40}$/;
const PULL_TIMEOUT_MS = 4000;

function newOwnerId() {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
}

/** Id de dueño de este navegador (se crea la primera vez). */
export function ownerId(storage = globalThis.localStorage) {
  let id = storage.getItem(OWNER_KEY);
  if (!OWNER_RE.test(id || '')) {
    id = newOwnerId();
    storage.setItem(OWNER_KEY, id);
  }
  return id;
}

const readLocal = (storage, slot) => {
  try {
    return JSON.parse(storage.getItem(saveKey(slot)) || 'null');
  } catch {
    return null;
  }
};

/**
 * Reconcilia servidor y navegador ranura a ranura: gana la copia con `savedAt` más reciente.
 * Devuelve { pulled: [ranuras], pushed: [ranuras] }.
 */
export async function syncSaves({ fetchImpl = globalThis.fetch, storage = globalThis.localStorage, timeoutMs = PULL_TIMEOUT_MS } = {}) {
  const owner = ownerId(storage);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let remote;
  try {
    const res = await fetchImpl(`${SAVES_URL}/${owner}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    remote = await res.json();
  } finally {
    clearTimeout(timer);
  }
  const pulled = [];
  const pushed = [];
  for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
    const server = remote[slot] || null;
    const local = readLocal(storage, slot);
    if (server && (!local || (server.savedAt || 0) > (local.savedAt || 0))) {
      storage.setItem(saveKey(slot), JSON.stringify(server));
      pulled.push(slot);
    } else if (local && (!server || (local.savedAt || 0) > (server.savedAt || 0))) {
      await pushSave(slot, local, { fetchImpl, storage });
      pushed.push(slot);
    }
  }
  return { pulled, pushed };
}

export async function pushSave(slot, data, { fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  const res = await fetchImpl(`${SAVES_URL}/${ownerId(storage)}/${slot}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`El servidor no guardó la ranura ${slot} (HTTP ${res.status})`);
}

export async function deleteRemote(slot, { fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  const res = await fetchImpl(`${SAVES_URL}/${ownerId(storage)}/${slot}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Todas las partidas del servidor (de cualquier navegador): [{ owner, slot, name, savedAt }], las más recientes primero. */
export async function listServerSaves({ fetchImpl = globalThis.fetch } = {}) {
  const res = await fetchImpl(SAVES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const owners = await res.json();
  return owners.flatMap((o) => o.slots.map((s) => ({ owner: o.owner, ...s }))).sort((a, b) => b.savedAt - a.savedAt);
}

export async function fetchServerSave(owner, slot, { fetchImpl = globalThis.fetch } = {}) {
  const res = await fetchImpl(`${SAVES_URL}/${owner}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json())[slot] || null;
}

/**
 * Conecta SaveSystem con el servidor. onError(mensaje) avisa al jugador si una copia falla (la partida sigue
 * guardada en el navegador).
 */
export function installSaveSync({ onError = (m) => console.warn(m) } = {}) {
  SaveSystem.listener = (kind, slot, data) => {
    const job = kind === 'save' ? pushSave(slot, data) : deleteRemote(slot);
    job.catch((err) => {
      console.error('[partidas]', err);
      onError('No se pudo copiar la partida al servidor (sigue guardada en este navegador).');
    });
  };
}
