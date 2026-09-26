// Estado de las pistas de la Libreta (docs/TABLILLAS.md §4.2, X24). Módulo PURO: opera sobre un GameState
// (state.clues + addClue/solveClue/updateClue) sin DOM, para poder probarlo con node --test.
//
// Cada pista de arco guarda en state.clues: { id, text, solved, status, step, seen, order }
//   status 'active' | 'queued' | 'solved'   step 1 (inicial) | 2 (segunda)   seen: ya vista en la Libreta
// Reglas: como máximo 3 activas; las demás esperan en cola (orden de apertura) y la siguiente se activa en
// cuanto quedan menos de 3 y su condición de cola se cumple (T11/T12 esperan a Nadar). El descubrimiento
// directo (llegar al lugar sin la pista) la activa aunque se supere el límite. Las pistas sueltas anotadas con
// state.addClue (sin arco) se muestran como notas y no ocupan hueco.
import { CLUE_ARCS, clueArc, MAX_ACTIVE_CLUES, ABILITY_NAMES } from './clues.js';

export const STATUS = Object.freeze({ ACTIVE: 'active', QUEUED: 'queued', SOLVED: 'solved' });

export function clueEntry(state, id) {
  return (state.clues || []).find((c) => c.id === id) || null;
}

/** Estado de una entrada de state.clues ('active' | 'queued' | 'solved'), o null si no existe. */
export function entryStatus(entry) {
  if (!entry) return null;
  if (entry.solved || entry.status === STATUS.SOLVED) return STATUS.SOLVED;
  return entry.status === STATUS.QUEUED ? STATUS.QUEUED : STATUS.ACTIVE;
}

export const clueStatus = (state, id) => entryStatus(clueEntry(state, id));

/** Pistas de arco abiertas (las notas sueltas de addClue no ocupan hueco en el límite de 3). */
export function activeClues(state) {
  return (state.clues || []).filter((c) => entryStatus(c) === STATUS.ACTIVE && clueArc(c.id));
}

export function activeCount(state) {
  return activeClues(state).length;
}

function nextOrder(state) {
  return (state.clues || []).reduce((m, c) => Math.max(m, Number(c.order) || 0), 0) + 1;
}

function requireArc(id, fn) {
  const arc = clueArc(id);
  if (!arc) throw new Error(`${fn}: pista desconocida "${id}" (se esperaba T01–T15)`);
  return arc;
}

/** ¿Puede salir de la cola? (queueUntil: { ability } | { flag }). */
export function queueReady(arc, state) {
  const q = arc?.queueUntil;
  if (!q) return true;
  if (q.ability && !state.zygardeAbility(q.ability)) return false;
  if (q.flag && !state.flag(q.flag)) return false;
  return true;
}

/**
 * Abre la pista inicial de un arco. { direct: true } = descubrimiento directo (activa sin límite).
 * → { status, changed }
 */
export function openClueState(state, id, { direct = false } = {}) {
  const arc = requireArc(id, 'openClue');
  const cur = clueEntry(state, id);
  if (cur) {
    const status = entryStatus(cur);
    if (status === STATUS.QUEUED && direct) {
      state.updateClue(id, { status: STATUS.ACTIVE, seen: false });
      return { status: STATUS.ACTIVE, changed: true };
    }
    return { status, changed: false };
  }
  const active = direct || (activeCount(state) < MAX_ACTIVE_CLUES && queueReady(arc, state));
  const status = active ? STATUS.ACTIVE : STATUS.QUEUED;
  const order = nextOrder(state);
  state.addClue(id, arc.steps[0].text);
  state.updateClue(id, { status, step: 1, seen: false, order });
  return { status, changed: true };
}

/**
 * Pasa un arco a su segunda pista (o al paso indicado). Si no estaba abierta, se abre como descubrimiento
 * directo; si estaba en cola, se activa (hablar con alguien o visitar el sitio la hace presente).
 * → { status, step, changed }
 */
export function advanceClueState(state, id, step = 2) {
  const arc = requireArc(id, 'advanceClue');
  if (!clueEntry(state, id)) openClueState(state, id, { direct: true });
  const cur = clueEntry(state, id);
  if (entryStatus(cur) === STATUS.SOLVED) return { status: STATUS.SOLVED, step: cur.step || 1, changed: false };
  const from = Number(cur.step) || 1;
  const target = Math.max(from, Math.min(arc.steps.length, Math.max(1, Math.floor(Number(step) || 2))));
  const wasQueued = entryStatus(cur) === STATUS.QUEUED;
  const changed = target !== from || wasQueued;
  state.updateClue(id, {
    step: target, text: arc.steps[target - 1].text, status: STATUS.ACTIVE, seen: changed ? false : Boolean(cur.seen),
  });
  return { status: STATUS.ACTIVE, step: target, changed };
}

/**
 * Cierra (resuelve) una pista: la de un arco al obtener su Tablilla o una nota suelta.
 * Devuelve los ids que han salido de la cola al liberarse un hueco.
 */
export function closeClueState(state, id) {
  const arc = clueArc(id);
  let cur = clueEntry(state, id);
  if (!cur) {
    if (!arc) throw new Error(`closeClue: pista desconocida "${id}"`);
    state.addClue(id, arc.steps[0].text);
    state.updateClue(id, { step: 1, order: nextOrder(state) });
    cur = clueEntry(state, id);
  }
  if (entryStatus(cur) !== STATUS.SOLVED) {
    state.solveClue(id);
    state.updateClue(id, { status: STATUS.SOLVED, seen: false });
  }
  return { activated: refreshClueQueue(state) };
}

/** Activa pistas en cola mientras haya hueco (< 3) y se cumpla su condición. → ids activados. */
export function refreshClueQueue(state) {
  const out = [];
  let active = activeCount(state);
  const queued = (state.clues || []).filter((c) => entryStatus(c) === STATUS.QUEUED)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  for (const e of queued) {
    if (active >= MAX_ACTIVE_CLUES) break;
    const arc = clueArc(e.id);
    if (arc && !queueReady(arc, state)) continue;
    state.updateClue(e.id, { status: STATUS.ACTIVE, seen: false });
    active += 1;
    out.push(e.id);
  }
  return out;
}

/**
 * Abre las pistas cuyo hito del guion (opens.flag) ya se cumplió y aún no están anotadas. Útil como red de
 * seguridad al cargar partidas o tras un Pilar; los guiones siguen abriéndolas explícitamente con openClue.
 */
export function syncClueSchedule(state) {
  const opened = [];
  for (const arc of CLUE_ARCS) {
    if (!arc.opens?.flag || clueEntry(state, arc.id) || !state.flag(arc.opens.flag)) continue;
    openClueState(state, arc.id);
    opened.push(arc.id);
  }
  return opened;
}

/** Marca como vistas (sin «¡Nuevo!») las pistas indicadas o todas. */
export function markCluesSeen(state, ids = null) {
  for (const c of state.clues || []) {
    if (c.seen || (ids && !ids.includes(c.id))) continue;
    state.updateClue(c.id, { seen: true });
  }
}

/** Capacidades de Zygarde que faltan para resolver el arco. */
export function missingAbilities(arc, state) {
  return (arc?.abilities || []).filter((k) => !state.zygardeAbility(k));
}

function rowFor(state, c) {
  const status = entryStatus(c);
  const arc = clueArc(c.id);
  const isNew = !c.seen && c.seen !== undefined;
  if (!arc) {
    return { id: c.id, custom: true, status, step: 1, title: 'Nota', isNew, steps: [{ label: 'Nota', by: '', text: c.text }], place: null, zone: null, missing: [] };
  }
  const step = Math.max(1, Math.min(arc.steps.length, Number(c.step) || 1));
  const steps = arc.steps.slice(0, status === STATUS.SOLVED ? Math.max(step, 1) : step);
  return {
    id: c.id, custom: false, status, step, isNew, arc,
    title: status === STATUS.SOLVED ? arc.title : arc.steps[step - 1].label,
    steps,
    place: step >= 2 || status === STATUS.SOLVED ? arc.place : null,
    zone: step >= 2 && status === STATUS.ACTIVE ? arc.zone : null,
    // Sin frase de Zygarde que anticipe capacidades (DECIDIDO autor, 25-09-2026: mecánicas más ocultas).
    missing: missingAbilities(arc, state).map((k) => ABILITY_NAMES[k] || k),
  };
}

/** Vista de la Libreta (pura): { active, queued, notes, solved } con filas listas para dibujar. */
export function clueNotebook(state) {
  const rows = [...(state.clues || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)).map((c) => rowFor(state, c));
  return {
    active: rows.filter((r) => r.status === STATUS.ACTIVE && !r.custom),
    queued: rows.filter((r) => r.status === STATUS.QUEUED),
    notes: rows.filter((r) => r.status === STATUS.ACTIVE && r.custom),
    solved: rows.filter((r) => r.status === STATUS.SOLVED),
  };
}

/** Anillos de zona para el mapa regional: pistas activas en su segunda fase. → [{ id, zone, place }] */
export function clueZones(state) {
  return clueNotebook(state).active.filter((r) => r.zone).map((r) => ({ id: r.id, zone: r.zone, place: r.place }));
}
