// T07 «La colmena de la Reserva» (docs/TABLILLAS.md §4.5): reglas PURAS del arco (sin ctx), para los eventos
// (b09a_t07.js) y las pruebas. Seguir a las obreras (Cutiefly y Ribombee) que llevan polen de tres flores, una de cada
// zona de la Reserva (pradera, ribera de la laguna y huerto); colocar las tres ante la colmena hace salir a la reina:
// Vespiquen Alfa nv 36, captura opcional. Sin estado de fallo: el Alfa reaparece al descansar (TABLILLAS §4.8).
import { F, V, restCount } from './b09a_common.js';

/** Las tres zonas, en el orden en que se describen, con su flag de flor, su bit de obrera y su aspecto. */
export const ZONES = Object.freeze([
  Object.freeze({ key: 'pradera', flag: F.flower1, bit: 1, row: 2, worker: 'CUTIEFLY', pollen: 'amarillo',
    name: 'la flor amarilla de la pradera', place: 'la pradera de flores' }),
  Object.freeze({ key: 'ribera', flag: F.flower2, bit: 2, row: 4, worker: 'RIBOMBEE', pollen: 'lila',
    name: 'la flor lila de la orilla', place: 'la orilla de la laguna' }),
  Object.freeze({ key: 'huerto', flag: F.flower3, bit: 4, row: 6, worker: 'CUTIEFLY', pollen: 'blanco',
    name: 'la flor de azahar del huerto', place: 'el huerto' }),
]);

export const zoneByKey = (key) => ZONES.find((z) => z.key === key) || null;

/** ¿Ha volado ya la obrera de esa zona hasta su flor? */
export function workerFlown(state, key) {
  const z = zoneByKey(key);
  return Boolean(z) && (Number(state.var(V.bees, 0)) & z.bit) !== 0;
}

/** Nueva máscara de obreras tras volar la de `key` (no modifica el estado). */
export function withWorker(mask, key) {
  const z = zoneByKey(key);
  return z ? (Number(mask) || 0) | z.bit : Number(mask) || 0;
}

/** Flores recogidas (0–3). */
export function flowersHeld(state) {
  return ZONES.filter((z) => state.flag(z.flag)).length;
}

export const allFlowers = (state) => flowersHeld(state) === ZONES.length;

/**
 * Fase del arco: 'closed' (sin pista ni permiso) · 'open' (dentro, sin ver la colmena) · 'gather' (buscando flores) ·
 * 'ready' (las tres flores, sin colocar) · 'queen' (flores colocadas, la reina por vencer) · 'done' (Tablilla).
 */
export function t07Phase(state) {
  if (state.flag(F.t07Done)) return 'done';
  if (state.flag(F.flowersSet)) return 'queen';
  if (allFlowers(state)) return 'ready';
  if (state.flag(F.hiveSeen)) return 'gather';
  if (state.flag(F.gatePass) || state.flag(F.ivan)) return 'open';
  return 'closed';
}

/** ¿Está en pie el enjambre que cierra la Reserva interior? */
export const swarmUp = (state) => !state.flag(F.reserveOpen);

/** El Alfa vencido sin capturar reaparece tras el siguiente descanso junto a la colmena mudada. */
export function alphaReturns(state) {
  return state.flag(F.alpha) && !state.flag(F.alphaCaught) && restCount(state) > Number(state.var(V.vespiquenRest, -1));
}

/** Ruta en línea recta (primero en horizontal, luego en vertical) para el vuelo de una obrera. */
export function flightPath(from, to) {
  const out = [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  for (let i = 0; i < Math.abs(dx); i++) out.push(dx > 0 ? 'right' : 'left');
  for (let i = 0; i < Math.abs(dy); i++) out.push(dy > 0 ? 'down' : 'up');
  return out;
}
