// Círculo del Jardín (docs/CAMPANA.md B17 paso 3; DECISIONES X26): «Los Clefairy pisan en secuencia seis puntos hundidos;
// el jugador memoriza la danza y alza las piedras en ese orden con Reconstrucción». Reglas PURAS (Node y navegador).
// Las seis losas hundidas rodean el jardín de la plaza de Villa Alba (la isla ajardinada del centro, donde apareció la
// primera célula) sobre el anillo de arena: un hexágono alrededor del jardín.

/** Las seis losas (sentido horario desde el noroeste), en coordenadas de villa_alba. */
export const CIRCLE_POINTS = Object.freeze([
  Object.freeze({ x: 20, y: 14 }), // 0 · noroeste
  Object.freeze({ x: 25, y: 14 }), // 1 · noreste
  Object.freeze({ x: 28, y: 18 }), // 2 · este
  Object.freeze({ x: 25, y: 22 }), // 3 · sureste
  Object.freeze({ x: 20, y: 22 }), // 4 · suroeste
  Object.freeze({ x: 17, y: 18 }), // 5 · oeste
]);

/** Orden de la danza de los Clefairy: siempre cruzando el círculo (oeste, este, noroeste, sureste, noreste, suroeste). */
export const DANCE_ORDER = Object.freeze([5, 2, 0, 3, 1, 4]);

/** Casillas de los tres Clefairy (arena del anillo, al norte del jardín) y del que guía la danza. */
export const DANCERS = Object.freeze([
  Object.freeze({ x: 22, y: 15, dir: 2 }),
  Object.freeze({ x: 21, y: 15, dir: 6 }),
  Object.freeze({ x: 23, y: 15, dir: 4 }),
]);

/** Casilla de llegada del Vuelo al Círculo (anillo de arena, lado norte). */
export const CIRCLE_LANDING = Object.freeze({ x: 22, y: 14, dir: 2 });

/** Índice de losa en (x, y) o -1. */
export function pointAt(x, y) {
  return CIRCLE_POINTS.findIndex((p) => p.x === x && p.y === y);
}

/**
 * Alzar la losa `i` con `step` losas ya alzadas en orden. → { ok, step, done }
 * ok: era la siguiente de la danza (queda alzada) · step: nuevas losas en pie (0 si falla: se hunden todas) ·
 * done: el Círculo está completo.
 */
export function raiseInOrder(step, i) {
  const s = Math.max(0, Math.min(DANCE_ORDER.length, Number(step) || 0));
  if (s >= DANCE_ORDER.length) return { ok: false, step: s, done: true };
  if (DANCE_ORDER[s] !== i) return { ok: false, step: 0, done: false };
  const next = s + 1;
  return { ok: true, step: next, done: next === DANCE_ORDER.length };
}

/** Losas en pie con `step` aciertos (las primeras de la danza). */
export function raisedPoints(step) {
  return DANCE_ORDER.slice(0, Math.max(0, Math.min(DANCE_ORDER.length, Number(step) || 0)));
}

/** Ruta en línea (primero horizontal) de (x0, y0) a (x1, y1): lista de 'left'|'right'|'up'|'down'. */
export function lineRoute(x0, y0, x1, y1) {
  const out = [];
  for (let i = 0; i < Math.abs(x1 - x0); i++) out.push(x1 > x0 ? 'right' : 'left');
  for (let i = 0; i < Math.abs(y1 - y0); i++) out.push(y1 > y0 ? 'down' : 'up');
  return out;
}
