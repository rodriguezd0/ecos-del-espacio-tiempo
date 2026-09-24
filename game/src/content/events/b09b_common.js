// Constantes y utilidades del Bloque 9b (docs/CAMPANA.md «B09 — Interludio 4», parte B: Ruta 8 Marisma y Palafitos
// con el arco T08, Ciudad Nexo, Ruta 15 y Caleta Sonda). Módulo puro (se importa en Node desde las definiciones de
// mapa): flags, variables, hablantes, gráficos y ayudas de guion comunes. Los combates de guion usan el helper común
// content/common/bossBattle.js (docs/BALANCE.md).
import { getCharacter } from '../characters.js';
export { bossBattle } from '../common/bossBattle.js';

/**
 * Flags del bloque. Prefijo b09_ (mismo bloque de CAMPANA que B09a) con el área detrás para no chocar con Lúmina:
 * b09_marisma_*, b09_t08_*, b09_nexo_*, b09_r15_*, b09_caleta_*. Globales que se consultan: p4_restored (tren) y
 * p7_restored (ferris). El hito del Buceo (b13_dive_resonance) lo pone B13 en el muelle de buzos (caleta_layout.js
 * DIVERS.resonance); este bloque no lo lee.
 */
export const F = Object.freeze({
  // Ruta 8 · Marisma Turbia y Palafitos
  marshArrival: 'b09_marisma_llegada', // llegada: el golpeteo de las bombas
  remedios: 'b09_t08_remedios', // Doña Remedios: segunda pista de T08 (curandera)
  alerce: 'b09_t08_alerce', // Alerce llega, analiza él el agua y carga el lector en la Pokédex
  pump: (n) => `b09_t08_bomba_${n}`, // bomba n (1–3) parada tras vencer a su técnico
  pumps: 'b09_t08_bombas', // las tres bombas paradas (lecturas fiables)
  readings: 'b09_t08_lecturas', // seis lecturas tomadas
  tablet: 'b09_t08_tablilla', // Tabla Tóxica (TOXICPLATE) bajo el lodo más denso
  healed: 'b09_marisma_sana', // CAMBIO EN EL MUNDO: la marisma empieza a sanar, los jóvenes se quedan (T08 resuelto)
  remediosGift: 'b09_t08_regalo_remedios',
  marshNorth: 'b09_marisma_norte', // el jugador ha llegado a la senda de Mnemos (salida del bloque hacia B10)
  // Ciudad Nexo
  goodRod: 'b09_nexo_cana_buena', // el pescador da la Caña Buena (GOODROD)
  t12: 'b09_nexo_mercado_t12', // pista T12 (en cola hasta Nadar)
  talasaSeen: 'b09_nexo_talasa_vista', // plataforma del Consorcio vista con los prismáticos
  // Ruta 15
  tides: 'b09_r15_mareas', // los pescadores hablan de las mareas que traen barcos antiguos
  // Caleta Sonda
  superRod: 'b09_caleta_supercana', // Supercaña (SUPERROD) de la tienda de pesca
  t11: 'b09_caleta_ramon_t11', // Ramón abre la pista T11 (en cola hasta Nadar)
  // Globales (otros bloques)
  p4: 'p4_restored',
  p7: 'p7_restored',
});

/** Variables del bloque. */
export const V = Object.freeze({
  reading: (n) => `b09_t08_lectura_${n}`, // 0 sin leer · 1–5 nivel de la lectura de la estaca n (1–6)
  dug: (id) => `b09_t08_removida_${id}`, // 1 = poza removida sin éxito (solo cambia el texto)
});

export const SPEAKER = Object.freeze({
  alerce: 'Alerce',
  remedios: 'Remedios',
  tech: 'Técnico',
  techF: 'Técnica',
  vendor: 'Vendedora',
  youth: 'Joven',
  youthF: 'Joven',
  kid: 'Niño',
  fisher: 'Pescador',
  sailor: 'Marinero',
  evaristo: 'Don Evaristo',
  ramon: 'Ramón',
  diver: 'Buzo',
  shipwright: 'Carpintera de ribera',
});

export const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js, alias de characters_campaign.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  alerce: spriteOr('alerce', 'profesor'),
  remedios: spriteOr('remedios', 'anil:anciana1'),
  evaristo: spriteOr('evaristo', 'anil:anciano1'),
  ramon: spriteOr('ramon', 'anil:capitan'),
  tech: spriteOr('genesis_tecnico', 'anil:cientifico'),
  techF: spriteOr('genesis_tecnica', 'anil:cientifica'),
  diver: spriteOr('buzo', 'anil:nadador'),
  neighbor: spriteOr('vecina', 'anil:mujer1'),
  neighborM: spriteOr('vecino', 'anil:hombre1'),
  elder: spriteOr('anciano', 'anil:anciano2'),
  kid: spriteOr('nino', 'anil:nino'),
  youth: 'anil:chaval3',
  youthF: 'anil:chica1',
  fisher: 'anil:pescador',
  sailor: 'anil:marinero',
  vendor: 'anil:mujer2',
  worker: 'anil:operario',
  workerF: 'anil:operaria',
  wooper: 'follower:WOOPER:1:0',
  binacle: 'follower:BINACLE:0:0',
});

/** Objetos con arte propio (tools/b09b_assets.mjs) y de otros bloques (solo se leen). */
export const OBJ = Object.freeze({
  pump: 'asset:objects/b09b_bomba.png', // fila 2 en marcha · 4 parada
  stake: 'asset:objects/b09b_estaca.png', // pattern = lectura (ver b09b_assets.mjs)
  mud: 'asset:objects/b09b_lodo.png', // fila 2 burbujea · 4 calma · 6 Tablilla · 8 hueco
  platform: 'asset:objects/b09b_plataforma.png',
  binoculars: 'asset:objects/b09b_prismaticos.png',
  kit: 'asset:objects/b09b_maletin.png',
  buoy: 'asset:objects/b09b_boya.png',
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  grunt: 'EncuentroRocket',
  marsh: 'PuebloLavanda',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Condición de página a partir de flags: all / none / prueba extra. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Dice varias líneas seguidas con el mismo hablante. */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Objeto interactivo invisible (texto al pulsar A delante); `solid` para muebles. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); },
  };
}

/** Bloqueos invisibles (huella de un sprite grande). */
export function blockers(prefix, list) {
  return list.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, solid: true, noOver: true }));
}

/** Enlace cerrado: aviso neutro y un paso atrás (`back` = dirección de retroceso, `face` = hacia dónde mira). */
export function blockedLink(prefix, cells, text, back, face, extra = {}) {
  const script = async (ctx) => {
    ctx.face('player', face);
    await ctx.say(typeof text === 'function' ? text(ctx.state) : text);
    await ctx.move('player', [back], { through: false });
  };
  return cells.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, trigger: 'touch', script, ...extra }));
}

/** Rectángulo como lista de celdas. */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Ruta de movimiento ortogonal (primero en x, luego en y) de `from` a `to`. */
export function routeTo(from, to) {
  const out = [];
  for (let x = from.x; x < to.x; x++) out.push('right');
  for (let x = from.x; x > to.x; x--) out.push('left');
  for (let y = from.y; y < to.y; y++) out.push('down');
  for (let y = from.y; y > to.y; y--) out.push('up');
  return out;
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Nivel de un entrenador para `ctx.battle`: entrenador del registro (content/trainers/b09b.js). */
export const trainerRequest = (id, extra = {}) => ({ type: 'trainer', trainer: id, ...extra });
