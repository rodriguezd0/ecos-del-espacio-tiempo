// Reglas PURAS de los sellos y pruebas del Bloque 22d (sin DOM ni motor: las usan los eventos, los tests y el E2E).
//   · Relieve de los mineros (Regirock): cuatro rocas con signos; el relieve se lee al revés («de la boca al fondo, como
//     se pica»): pico → lámpara → vagoneta. Un golpe fuera de orden apaga el eco y se empieza de nuevo (sin castigo).
//   · Talla de hielo (Regice): nueve bloques en rejilla 3×3; la talla vieja enseña qué cinco hay que tallar (una cruz,
//     la frente del guardián de hielo). Tallar alterna el bloque (se puede deshacer): nunca hay callejón sin salida.
//   · Reloj de la galería vieja (Registeel): tres piezas perdidas (péndulo, rueda de escape y pesa); con las tres,
//     Rosalía lo restaura y la puerta del Engranaje, que va unida a su maquinaria, se abre.
//   · La sombra a destiempo (Marshadow): cinco sombras de piedra oscilan juntas; una va a otro compás. Al hablarle se
//     escurre de un punto a otro de la ruta hasta la sombra del dintel.

// ───────────────────────────── Relieve de los mineros ─────────────────────────────

/** Signos tal como están tallados en el relieve (de izquierda a derecha). */
export const RELIEF_CARVED = Object.freeze(['vagoneta', 'lampara', 'pico']);
/** Orden de golpeo: el relieve se lee al revés. */
export const RELIEF_ORDER = Object.freeze([...RELIEF_CARVED].reverse());
/** Signos de las rocas marcadas (el casco es un señuelo: marca de un minero, no del relieve). */
export const RELIEF_SIGNS = Object.freeze(['pico', 'lampara', 'vagoneta', 'casco']);
/** Fila de la hoja b22d_marcas.png de cada signo. */
export const SIGN_DIR = Object.freeze({ pico: 2, lampara: 4, vagoneta: 6, casco: 8 });

/**
 * Golpe en la roca del signo `sign` con `step` aciertos seguidos. → { step, ok, done }. Un fallo vuelve a 0; acertar el
 * primero tras un fallo cuenta como el primer golpe de una serie nueva.
 */
export function strikeRelief(step, sign) {
  const s = Math.max(0, Math.min(RELIEF_ORDER.length, Number(step) || 0));
  if (s >= RELIEF_ORDER.length) return { step: s, ok: true, done: true };
  if (RELIEF_ORDER[s] === sign) {
    const next = s + 1;
    return { step: next, ok: true, done: next === RELIEF_ORDER.length };
  }
  const restart = RELIEF_ORDER[0] === sign ? 1 : 0;
  return { step: restart, ok: restart === 1, done: false };
}

// ───────────────────────────── Talla de hielo ─────────────────────────────

/** Bloques de la rejilla 3×3 (índice = fila × 3 + columna). */
export const KNOB_COUNT = 9;
/** Talla correcta: la cruz (arriba, centro, abajo, izquierda y derecha del centro). */
export const CARVE_TARGET = Object.freeze([1, 3, 4, 5, 7]);
const TARGET_MASK = CARVE_TARGET.reduce((m, i) => m | (1 << i), 0);
const FULL = (1 << KNOB_COUNT) - 1;

export const knobCarved = (mask, i) => ((Number(mask) || 0) & (1 << i)) !== 0;
/** Tallar/destallar el bloque `i` (alterna). */
export function toggleKnob(mask, i) {
  if (!Number.isInteger(i) || i < 0 || i >= KNOB_COUNT) throw new Error(`talla: bloque fuera de rango ${i}`);
  return ((Number(mask) || 0) ^ (1 << i)) & FULL;
}
export const carvingDone = (mask) => ((Number(mask) || 0) & FULL) === TARGET_MASK;
/** Diferencias con la talla correcta: { missing: bloques por tallar, extra: tallados que sobran }. */
export function carvingDiff(mask) {
  const m = Number(mask) || 0;
  const missing = CARVE_TARGET.filter((i) => !knobCarved(m, i));
  const extra = [];
  for (let i = 0; i < KNOB_COUNT; i++) if (knobCarved(m, i) && !CARVE_TARGET.includes(i)) extra.push(i);
  return { missing, extra };
}

// ───────────────────────────── Reloj de la galería vieja ─────────────────────────────

export const CLOCK_PARTS = Object.freeze(['pendulo', 'rueda', 'pesa']);
export const PART_NAMES = Object.freeze({ pendulo: 'el péndulo', rueda: 'la rueda de escape', pesa: 'la pesa' });
export const partBit = (part) => {
  const i = CLOCK_PARTS.indexOf(part);
  if (i < 0) throw new Error(`reloj: pieza desconocida «${part}»`);
  return 1 << i;
};
export const hasPart = (mask, part) => ((Number(mask) || 0) & partBit(part)) !== 0;
export const addPart = (mask, part) => (Number(mask) || 0) | partBit(part);
export const clockComplete = (mask) => CLOCK_PARTS.every((p) => hasPart(mask, p));
export const missingParts = (mask) => CLOCK_PARTS.filter((p) => !hasPart(mask, p));

// ───────────────────────────── La sombra a destiempo ─────────────────────────────

/** ¿Es la sombra `i` la que se mueve a destiempo? (la única con otro compás; ver layout SHADOWS) */
export const isOddShadow = (shadows, i) => Boolean(shadows?.[i]?.odd);

/** Siguiente punto de la ruta de la sombra tras el paso `step` (null = ha llegado al dintel). */
export function nextShadowPoint(route, step) {
  const s = Number(step) || 0;
  return s + 1 < route.length ? route[s + 1] : null;
}

// ───────────────────────────── Instalación Cierzo ─────────────────────────────

/** Prototipos fallidos: sala, especie y perfil (CAMPANA B22: ataque extremo, defensa extrema, tipo cambiante). */
export const PROTOTYPES = Object.freeze([
  Object.freeze({
    room: 'a', label: 'Prototipo A', profile: 'ataque',
    spec: Object.freeze({
      species: 'MEWTWO', level: 70, nature: 'ADAMANT', ability: 'PRESSURE',
      ivs: Object.freeze({ hp: 0, atk: 31, def: 0, spa: 0, spd: 0, spe: 31 }),
      evs: Object.freeze({ hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 }),
      moves: Object.freeze(['PSYCHOCUT', 'BRICKBREAK', 'SHADOWCLAW', 'SWORDSDANCE']),
    }),
  }),
  Object.freeze({
    room: 'b', label: 'Prototipo B', profile: 'defensa',
    spec: Object.freeze({
      species: 'MEWTWO', level: 72, nature: 'BOLD', ability: 'PRESSURE',
      ivs: Object.freeze({ hp: 31, atk: 0, def: 31, spa: 0, spd: 31, spe: 0 }),
      evs: Object.freeze({ hp: 4, atk: 0, def: 252, spa: 0, spd: 252, spe: 0 }),
      moves: Object.freeze(['BARRIER', 'AMNESIA', 'LIFEDEW', 'CONFUSION']),
    }),
  }),
  Object.freeze({
    room: 'c', label: 'Prototipo C', profile: 'tipo',
    spec: Object.freeze({
      species: 'MEWTWO', level: 74, nature: 'TIMID', ability: 'PROTEAN',
      ivs: Object.freeze({ hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 }),
      moves: Object.freeze(['FLAMETHROWER', 'THUNDERBOLT', 'ICEBEAM', 'SHADOWBALL']),
    }),
  }),
]);

/** Especies vistas que abren la verja de la Instalación Cierzo (CAMPANA B22). */
export const CIERZO_SEEN = 300;

/** ¿Lleva el jugador a los tres Regis en el equipo? (sin huevos) */
export function hasRegiTrio(party) {
  const list = (party || []).filter((p) => p && !p.egg).map((p) => p.species);
  return ['REGIROCK', 'REGICE', 'REGISTEEL'].every((s) => list.includes(s));
}
