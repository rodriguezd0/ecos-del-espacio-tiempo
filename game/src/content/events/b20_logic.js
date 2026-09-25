// Reglas PURAS del Bloque 20 — Pilar del Origen (docs/CAMPANA.md B20). Sin ctx ni DOM: las usan los eventos
// (content/events/b20_*.js), los mapas, las pruebas (tests/b20_*.test.mjs) y el recorrido E2E (tools/e2e_b20*.mjs).
// Reutiliza las reglas ya hechas de otros bloques (solo lectura):
//   · tramo 1: piedras giratorias de B02 (content/events/b02_puzzle.js: orden de giro y nombres)
//   · tramo 3: ráfagas y veletas de B06 (content/events/b06_wind_logic.js: parseRoom, settleWind, solveRoom)
//   · tramo 4: pesos de B08 (content/events/b08_balance_logic.js: WEIGHT, PRESS)
//   · tramo 6: espacio imposible de B12 (world/impossible/logic.js: parseFacetRoom, facetReach)
//   · tramo 8: caballeros y bribones de B16 (content/events/b16_saber_logic.js: inscripciones, salida única)
//   · tramo 9: tensión de ejes de B18 (world/axis/logic.js: parseAxisRoom, solucionador y trampas)
import { ROTATION, nextDir, DIR_NAME as STONE_DIR_NAME } from './b02_puzzle.js';
import { parseRoom } from './b06_wind_logic.js';
import { WEIGHT, PRESS } from './b08_balance_logic.js';
import { inscriptionText, inscriptionTruth, consistentExits } from './b16_saber_logic.js';
import { parseFacetRoom } from '../../world/impossible/logic.js';
import { parseAxisRoom } from '../../world/axis/logic.js';
import { CAMPAIGN_TABLETS } from '../story/tablets.js';
import { hasFragment } from '../story/fragments.js';
import { T1, T3, T6, T8, T9, INNER } from '../maps/b20/layout.js';

export { ROTATION, nextDir, STONE_DIR_NAME, WEIGHT, PRESS };

// ───────────────────────────── Puerta de las Quince ─────────────────────────────

export const ALL_NICHES = (1 << CAMPAIGN_TABLETS.length) - 1; // 15 bits
export const nicheBit = (n) => 1 << (n - 1);
export const nicheLit = (mask, n) => Boolean((Number(mask) || 0) & nicheBit(n));
export const nichesLitCount = (mask) => CAMPAIGN_TABLETS.filter((_, i) => nicheLit(mask, i + 1)).length;

/** Tablilla de campaña del nicho n (1–15: T01…T15, en orden de arco). */
export const nicheTablet = (n) => CAMPAIGN_TABLETS[n - 1] || null;

/** Nichos que se pueden encender ahora (Tablillas que lleva el jugador y aún no colocadas). → [n…] */
export function placeableNiches(state, mask) {
  const owned = new Set(state?.data?.tablets || []);
  return CAMPAIGN_TABLETS.map((t, i) => i + 1).filter((n) => !nicheLit(mask, n) && owned.has(nicheTablet(n).id));
}

/** Fragmentos que faltan de los Pilares 1–9 (cadena de resonancia). → [n…] */
export const missingFragments = (state) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !hasFragment(state, n));

/**
 * Qué le falta al jugador para abrir la Puerta (CAMPANA B20 «La puerta indica qué falta»): Tablillas (por nicho),
 * Fragmentos (Pilares 1–9) y la Forma Completa. `mask` = nichos ya encendidos.
 */
export function doorRequirements(state, mask) {
  const owned = new Set(state?.data?.tablets || []);
  const tablets = CAMPAIGN_TABLETS.filter((t, i) => !nicheLit(mask, i + 1) && !owned.has(t.id));
  const complete = Boolean(state?.flag?.('zyg_complete') || state?.zygardeAbility?.('rebuild'));
  return { tablets, fragments: missingFragments(state), complete, ready: !tablets.length && !missingFragments(state).length };
}

// ───────────────────────────── Tramo 1 · piedras giratorias ─────────────────────────────

export const STONE_START = 8;
/** Orientación de una piedra guardada en su variable (o la inicial). */
export const stoneDirOf = (value) => (ROTATION.includes(Number(value)) ? Number(value) : STONE_START);
/** Pulsaciones que necesita una piedra desde la orientación inicial hasta su respuesta. */
export function stonePresses(stone, from = STONE_START) {
  let d = from;
  for (let n = 0; n < 4; n++) {
    if (d === stone.answer) return n;
    d = nextDir(d);
  }
  throw new Error(`piedra ${stone.id}: respuesta inalcanzable`);
}
export const STONES = T1.stones;

// ───────────────────────────── Tramo 3 · ráfagas con veleta ─────────────────────────────

/** Definición de sala para content/events/b06_wind.js (la roca agrietada cuenta como suelo: se rompe con Embestida). */
export const WIND_ROOM = Object.freeze({
  id: 'b20_t3_rafagas',
  rows: Object.freeze(T3.rows.map((r) => r.replace(/R/g, '.'))),
  sectors: T3.sectors,
  vanes: Object.freeze({ a: T3.vane }),
});
export const windRoom = () => parseRoom(WIND_ROOM.rows, WIND_ROOM.sectors);
/** Giros de veleta que llevan el canal del este a soplar hacia el norte (base sur: S → O → N). */
export const VANE_TURNS_NORTH = 2;

// ───────────────────────────── Tramo 4 · placa de contrapeso ─────────────────────────────

/** ¿Baja la placa con este peso? (B08: a pie 1, montado en el 10 % 3; la placa baja con 3 o más). */
export const platePresses = (mounted) => (mounted ? WEIGHT.mounted : WEIGHT.foot) >= PRESS;

// ───────────────────────────── Tramo 6 · arista y Ancla ─────────────────────────────

export const facetRoom6 = () => parseFacetRoom(T6.rows, { cellOrient: 1 });

// ───────────────────────────── Tramo 8 · tres voces a la vez ─────────────────────────────

/** Fotogramas parado fuera de una losa clara antes de que el viento devuelva al jugador (B16: 45; aquí algo más). */
export const STILL_FRAMES = 60;
const cell8 = (c, r) => (c >= 0 && r >= 0 && c < INNER.w && r < INNER.h ? T8.rows[r][c] : ' ');
/** ¿Suelo del pasillo? (rejilla interior) */
export const corridorFloor = (c, r) => ['.', 'R', 'S'].includes(cell8(c, r));
/** ¿Losa clara? (se puede parar: también la llegada y todo el pasillo de las puertas) */
export const corridorLedge = (c, r) => ['R', 'S'].includes(cell8(c, r));

const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
/** Camino más corto dentro del pasillo (rejilla interior) → lista de direcciones 2/4/6/8 o null. */
export function corridorPath(c0, r0, c1, r1) {
  if (!corridorFloor(c0, r0) || !corridorFloor(c1, r1)) return null;
  const key = (c, r) => `${c},${r}`;
  const prev = new Map([[key(c0, r0), null]]);
  const queue = [[c0, r0]];
  while (queue.length) {
    const [c, r] = queue.shift();
    if (c === c1 && r === r1) {
      const out = [];
      let k = key(c, r);
      while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
      return out;
    }
    for (const d of [8, 2, 4, 6]) {
      const nc = c + DV[d][0];
      const nr = r + DV[d][1];
      if (!corridorFloor(nc, nr) || prev.has(key(nc, nr))) continue;
      prev.set(key(nc, nr), [key(c, r), d]);
      queue.push([nc, nr]);
    }
  }
  return null;
}

const ins = (fact, claim) => Object.freeze({ fact, claim: claim ? Object.freeze(claim) : null });
/**
 * Inscripciones de las tres puertas (variantes: el «olvido» pasa a la siguiente). Solo UNA dice la verdad; una
 * inscripción dice la verdad si todo lo que dice es cierto (hechos del viaje de B16: content/events/b16_saber_logic.js).
 */
export const DOOR_ROUNDS = Object.freeze([
  Object.freeze([ins('bramaluna', { here: true }), ins('brontia', { not: 1 }), ins(null, { notHere: true })]),
  Object.freeze([ins(null, { is: 3 }), ins('guardiana', { here: true }), ins('nucleo5', { not: 2 })]),
  Object.freeze([ins(null, { notHere: true }), ins('albo', null), ins('mnemos', { is: 2 })]),
]);
export const DOOR_RULES = Object.freeze([
  'Tres puertas. Solo una inscripción dice la verdad; solo una puerta sigue adelante.',
  'Una inscripción dice la verdad únicamente si todo lo que dice es cierto.',
]);
export const doorRound = (variant) => DOOR_ROUNDS[((Number(variant) || 0) % DOOR_ROUNDS.length + DOOR_ROUNDS.length) % DOOR_ROUNDS.length];
/** Puerta verdadera de una variante (lanza si la variante no tiene salida única: lo vigilan las pruebas). */
export function doorExit(variant) {
  const exits = consistentExits(doorRound(variant));
  if (exits.length !== 1) throw new Error(`b20 tramo 8: la variante ${variant} no tiene salida única (${exits.join(', ') || 'ninguna'})`);
  return exits[0];
}
export const doorText = (variant, n) => inscriptionText(doorRound(variant)[n - 1], n);
export { inscriptionTruth };

// ───────────────────────────── Tramo 9 · cascada detenida y pliegue ─────────────────────────────

/** Casilla de la rejilla del tramo 9 (sala de ejes) de una casilla de mapa. */
export const t9Local = (x, y) => ({ x: x - INNER.x, y: y - INNER.y });

/**
 * Sala de ejes del tramo 9 (world/axis/logic.js#parseAxisRoom). `rebuilt` = el tramo roto de la repisa alta ya
 * reconstruido (sin él, sus casillas son vacío). La geometría es la del mapa: la misma rejilla pinta y crea los eventos.
 */
export function t9Room({ rebuilt = true } = {}) {
  const gap = new Set(T9.gap.cells.map(([x, y]) => { const p = t9Local(x, y); return `${p.x},${p.y}`; }));
  const rows = rebuilt ? [...T9.room] : T9.room.map((r, y) => [...r].map((ch, x) => (gap.has(`${x},${y}`) ? ' ' : ch)).join(''));
  return parseAxisRoom(rows, { name: rebuilt ? 'b20_t9' : 'b20_t9_roto' });
}

// ───────────────────────────── Trío de las Nubes ─────────────────────────────

/** Motivo en pantalla cuando se intenta capturar (CAMPANA B20, literal). */
export const SEAL_REASON = 'No es momento: es un sello.';

/** Los tres del Pacto de las Nubes (CAMPANA B20: niveles y movimientos; el resto de cada ficha, DECIDIDO-DEV). */
export const TRIO = Object.freeze({
  tornadus: Object.freeze({ species: 'TORNADUS', level: 68, moves: Object.freeze(['HURRICANE', 'NASTYPLOT', 'DARKPULSE', 'AIRSLASH']) }),
  thundurus: Object.freeze({ species: 'THUNDURUS', level: 68, moves: Object.freeze(['THUNDERBOLT', 'DARKPULSE', 'NASTYPLOT', 'HAMMERARM']) }),
  landorus: Object.freeze({ species: 'LANDORUS', level: 70, moves: Object.freeze(['EARTHPOWER', 'STONEEDGE', 'ROCKSLIDE', 'CALMMIND']) }),
});
export const TRIO_ORDER = Object.freeze(['tornadus', 'thundurus', 'landorus']);

/** Petición del combate contra uno del Trío: sin huida y con la captura desactivada (el motivo se explica). */
export function trioRequest(key, { bgm = 'Legendario menor', battleback = 'Volando' } = {}) {
  const t = TRIO[key];
  if (!t) throw new Error(`Trío: desconocido «${key}»`);
  return {
    type: 'wild',
    wild: { species: t.species, level: t.level, moves: [...t.moves] },
    rules: { canRun: false, catchCondition: () => ({ allowed: false, reason: SEAL_REASON }) },
    bgm, battleback,
  };
}

/** Respuestas a «¿Para qué lo despiertas?» (CAMPANA B20, literales; todas válidas). */
export const TRIO_ANSWERS = Object.freeze([
  Object.freeze({ id: 'cielo', text: 'Para arreglar el cielo' }),
  Object.freeze({ id: 'fuerza', text: 'Para que nadie lo haga por la fuerza' }),
  Object.freeze({ id: 'zygarde', text: 'No lo sé; Zygarde me lo pidió' }),
]);

/** Flags de B17 de cada torre del Anillo de Captación apagada (content/events/b17_common.js). */
export const RING_TOWER_FLAGS = Object.freeze(['b17_torre_viento', 'b17_torre_tormenta', 'b17_torre_temblor']);

/**
 * ¿Apagó el jugador alguna torre del Anillo de Captación (B17, opcional)? B17 lo guarda en la variable
 * `b17_torres_apagadas` (0–3, «la consulta B20») y en un flag por torre.
 */
export function ringTowersOff(state) {
  if (!state?.data) return false;
  if (Number(state.var?.('b17_torres_apagadas', 0)) > 0) return true;
  return RING_TOWER_FLAGS.some((f) => state.flag(f));
}

// ───────────────────────────── Gael (B6) ─────────────────────────────

/** Línea de Gael según la respuesta dada a Mesprit en B16 (§6.4, literales). */
export const GAEL_MESPRIT_LINE = Object.freeze({
  culpa: Object.freeze({ said: 'No fue culpa tuya.', gael: 'No quiero que me consueles.' }),
  lejos: Object.freeze({ said: 'Tú también llegaste lejos.', gael: 'Lejos no es a tu lado.' }),
  permiso: Object.freeze({ said: 'Deberías haber entrado sin pedir permiso.', gael: '…Quizá la próxima vez.' }),
});
export const gaelMespritLine = (state) => GAEL_MESPRIT_LINE[state?.var?.('b16_mesprit_respuesta', '')] || null;
