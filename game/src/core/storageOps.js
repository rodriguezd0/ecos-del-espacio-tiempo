// Operaciones puras del PC de almacenamiento: devuelven copias nuevas de { party, boxes }.
// Invariante: el equipo nunca se queda sin un Pokémon capaz de combatir.
// Las usa GameState (core/state.js) y la pantalla del PC (ui/logic/storageLogic.js las reexporta).

export const BOX_COLS = 6;
export const BOX_ROWS = 5;
export const PARTY_LIMIT = 6;

const ableCount = (party) => party.filter((p) => p && p.hp > 0 && !p.egg).length;

/** ¿Se puede quitar del equipo el Pokémon `index` (depositar, liberar, coger)? */
export function canRemoveFromParty(party, index) {
  const p = party[index];
  if (!p) return false;
  if (party.length <= 1) return false;
  return p.hp <= 0 || p.egg || ableCount(party) > 1;
}

/** Primera posición libre de una caja o -1. */
export function firstFree(box) {
  return box.indexOf(null);
}

function cloneBoxes(boxes) {
  return boxes.map((b) => b.slice());
}

/** Coge un Pokémon de una caja: { held, boxes } (held null si el hueco estaba vacío). */
export function takeFromBox(boxes, b, s) {
  const next = cloneBoxes(boxes);
  const held = next[b][s] || null;
  next[b][s] = null;
  return { held, boxes: next };
}

/** Deja el Pokémon sujeto en una caja; si el hueco está ocupado, intercambia (el antiguo pasa a sujeto). */
export function placeInBox(boxes, b, s, held) {
  const next = cloneBoxes(boxes);
  const prev = next[b][s] || null;
  next[b][s] = held;
  return { held: prev, boxes: next };
}

/** Coge un Pokémon del equipo. Lanza si es el último capaz de combatir. */
export function takeFromParty(party, index) {
  if (!canRemoveFromParty(party, index)) throw new Error('¡Es tu último Pokémon!');
  const next = party.slice();
  const [held] = next.splice(index, 1);
  return { held, party: next };
}

/** Deja el Pokémon sujeto en el equipo en `index` (intercambia si está ocupado; si no, lo añade al final). */
export function placeInParty(party, index, held) {
  const next = party.slice();
  if (index < next.length) {
    const prev = next[index];
    next[index] = held;
    return { held: prev, party: next };
  }
  if (next.length >= PARTY_LIMIT) throw new Error('El equipo está completo.');
  next.push(held);
  return { held: null, party: next };
}

/** Deposita el Pokémon `index` del equipo en la caja `b` (o en la siguiente con hueco) → { party, boxes, box, slot }. */
export function depositFromParty(party, boxes, index, b) {
  if (!canRemoveFromParty(party, index)) throw new Error('¡Es tu último Pokémon!');
  const order = [...boxes.keys()].map((i) => (b + i) % boxes.length);
  const target = order.find((i) => firstFree(boxes[i]) >= 0);
  if (target === undefined) throw new Error('No queda sitio en las cajas.');
  const nextBoxes = cloneBoxes(boxes);
  const slot = firstFree(nextBoxes[target]);
  nextBoxes[target][slot] = party[index];
  const nextParty = party.slice();
  nextParty.splice(index, 1);
  return { party: nextParty, boxes: nextBoxes, box: target, slot };
}

/** Saca al equipo el Pokémon de la caja (b, s). */
export function withdrawToParty(party, boxes, b, s) {
  const p = boxes[b][s];
  if (!p) throw new Error('No hay ningún Pokémon ahí.');
  if (party.length >= PARTY_LIMIT) throw new Error('El equipo está completo.');
  const nextBoxes = cloneBoxes(boxes);
  nextBoxes[b][s] = null;
  return { party: [...party, p], boxes: nextBoxes };
}

/** Libera el Pokémon de la caja (b, s). */
export function releaseFromBox(boxes, b, s) {
  const next = cloneBoxes(boxes);
  next[b][s] = null;
  return next;
}

/** Libera el Pokémon `index` del equipo. */
export function releaseFromParty(party, index) {
  if (!canRemoveFromParty(party, index)) throw new Error('¡Es tu último Pokémon!');
  const next = party.slice();
  next.splice(index, 1);
  return next;
}

/** Nº de Pokémon en una caja. */
export function boxCount(box) {
  return box.filter(Boolean).length;
}

/**
 * Mueve o intercambia entre dos huecos. ref = { party: índice } | { box, slot }.
 * Un hueco de equipo ≥ longitud significa "al final del equipo". El equipo no deja huecos.
 * @returns {{ party: object[], boxes: object[][] }}
 */
export function movePokemon(party, boxes, from, to) {
  const get = (ref) => ('party' in ref ? party[ref.party] : boxes[ref.box]?.[ref.slot]) || null;
  const moving = get(from);
  if (!moving) throw new Error('No hay ningún Pokémon ahí.');
  const target = get(to);
  const nextParty = party.slice();
  const nextBoxes = cloneBoxes(boxes);
  const put = (ref, p) => {
    if ('party' in ref) {
      if (p) nextParty[ref.party] = p;
      else nextParty[ref.party] = undefined;
    } else nextBoxes[ref.box][ref.slot] = p;
  };
  if ('party' in to && to.party >= party.length) {
    if ('party' in from) throw new Error('No hay ningún Pokémon ahí.');
    if (party.length >= PARTY_LIMIT) throw new Error('El equipo está completo.');
    put(from, null);
    nextParty.push(moving);
  } else {
    put(to, moving);
    put(from, target);
  }
  const compact = nextParty.filter(Boolean);
  if (ableCount(party) > 0 && ableCount(compact) === 0) throw new Error('¡Es tu último Pokémon!');
  return { party: compact, boxes: nextBoxes };
}
