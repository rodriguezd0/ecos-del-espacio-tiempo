// Constantes y utilidades del Bloque 14 — Pilar de los Ecos (docs/CAMPANA.md «B14»). Módulo PURO (se importa en Node
// desde las definiciones de mapa y los tests): flags, variables, hablantes, gráficos, música y ayudas de guion.
// Los combates de guion usan el helper común del proyecto (docs/BALANCE.md): bossBattle / scriptedBattle.
import { getCharacter } from '../characters.js';
import { bossBattle } from '../common/bossBattle.js';
import { expandEventDef } from '../../world/eventTypes.js';

export { bossBattle };

/**
 * Flags del bloque (prefijo b14_). Globales: p7_restored (salida; lo pone restorePillar(7)), verse_7.
 * Estado de entrada (CAMPANA B14): b13_talasa, zyg_core_4, zyg_dive (y la capacidad `dive`).
 */
export const F = Object.freeze({
  // Caleta Sonda
  caletaIntro: 'b14_caleta_intro', // los pescadores cuentan las mareas del eco; Fausto no ha vuelto
  coinsGift: 'b14_tobias_moneda', // Tobías regala un Real de cobre de las mareas
  caletaFinal: 'b14_caleta_final', // tras el P7: Fausto en la playa, el ferri, la draga
  // Arrecife del Eco y la draga de Genesis
  reefArrival: 'b14_arrecife_llegada',
  dredgeSeen: 'b14_draga_vista', // el cabezal tapa la Puerta de Antea
  jefaBeaten: 'b14_jefa_vencida',
  dredgeAside: 'b14_draga_apartada', // la jefa aparta el cabezal: se puede entrar en las ruinas
  // Mazmorra
  anteaIn: 'b14_antea_entrada', // primera entrada en las ruinas
  caracolaTuto: 'b14_caracola_tuto', // primera caracola (Zygarde explica los ecos)
  firstEcho: 'b14_primer_eco', // primera vez en una capa de eco
  echoPeople: 'b14_ecos_vecinos', // primera vez que se habla con un eco de Antea
  cisternDry: 'b14_aljibe_seco_visto', // primera vez en el aljibe seco (presente)
  spillwaySeen: 'b14_boca_fosa_vista', // la corriente de la boca de la Fosa
  statueSeen: 'b14_estatua_vista', // la estatua caída tapa la boca norte (presente)
  gearFound: 'b14_equipo_fausto', // aletas y gafas de Fausto en la sala 2 (presente)
  cisternSeen: 'b14_aljibe_visto', // la corriente del aljibe
  faustoMet: 'b14_fausto_visto',
  faustoAwake: 'b14_fausto_despierto', // Fausto «despierta» y vuelve a Caleta por su cuenta (o lo suelta el P7)
  silverGift: 'b14_fausto_real', // Real de plata de Fausto (al despertar o, si lo soltó el P7, en la playa)
  faustoFreed: 'b14_fausto_soltado', // el P7 soltó a Fausto sin que se le despertara (su regalo espera en la playa)
  cistern: 'b14_compuerta', // compuerta del aljibe cerrada en Antea → el aljibe del presente, seco
  sprout3: 'b14_brote_3', // brote de helecho de la sala 3 en la mano
  fern3: 'b14_helecho_3', // helecho plantado en la sala 3 → raíz en Antea
  sprout4: 'b14_brote_4',
  fern4: 'b14_helecho_4',
  spillway: 'b14_aliviadero', // aliviadero de la sala 4 cerrado en Antea → la boca de la Fosa, seca
  primalSeen: 'b14_primigenia_vista', // primera vez en la era primigenia (aviso de Zygarde)
  bramalunaSeen: 'b14_bramaluna_vista', // primera vez que la Bramaluna ve al jugador
  fosaIn: 'b14_fosa_entrada',
  echoBeaten: 'b14_bramaluna_eco', // Bramaluna Alfa (eco) vencida: el eco se desestabiliza
  restored: 'p7_restored', // global (content/story/fragments.js) — SALIDA del bloque
  t13: 'b14_t13', // inscripción de la pista T13 leída
  // Bramaluna real (tras el P7)
  realCaught: 'b14_bramaluna_capturada',
  realBeaten: 'b14_bramaluna_real_vencida',
  // Campana de dragado tras el P7
  bellAbandoned: 'b14_campana_abandonada',
});

/** Variables del bloque. */
export const V = Object.freeze({
  statue: 'b14_estatua', // 0 junto a la puerta alta · 1 en la hornacina (Antea)
  fausto: 'b14_fausto', // parada de la rutina de Fausto (0 fuente · 1 redes · 2 compuerta · 3 caracola)
  caracola: 'b14_caracola', // última caracola: 'mapa:x:y:dir' (regreso tras la embestida de la Bramaluna)
  caught: 'b14_bramaluna_pillado', // veces que la Bramaluna ha embestido
  restCount: 'rest_count', // world/rest.js
  realRest: 'b14_bramaluna_descanso', // rest_count al vencer a la Bramaluna real (reaparece al descansar)
});

export const SPEAKER = Object.freeze({
  fausto: 'Fausto',
  carmela: 'Carmela',
  tobias: 'Tobías',
  jefa: 'Adela',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  sailor: 'Marinero',
  diver: 'Buzo',
  echo: 'Eco',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  fausto: spriteOr('fausto', spriteOr('buzo', 'anil:nadador')),
  carmela: 'anil:mujer2',
  tobias: 'anil:pescador',
  sailor: 'anil:marinero',
  diver: spriteOr('buzo', 'anil:nadador'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  jefa: spriteOr('genesis_investigadora', spriteOr('genesis_tecnica', 'anil:cientifica')),
  // Ecos de los vecinos de Antea (semitransparentes).
  echoFisher: 'anil:pescador',
  echoWoman: 'anil:mujer1',
  echoOld: 'anil:anciana1',
  echoKid: 'anil:nino',
  echoVendor: 'anil:mujer2',
  bramaluna: 'asset:objects/b14_bramaluna_alfa.png',
  bramalunaSmall: 'follower:ROARINGMOON:0:0',
});

/** Objetos con arte propio (tools/b14_assets.mjs, PROVISIONAL D30). Hojas 4×4: fila = dirección 2/4/6/8. */
export const OBJ = Object.freeze({
  caracola: 'asset:objects/b14_caracola.png', // 32×64: fila 2 presente · 4 Antea · 6 primigenia · 8 resonando
  statue: 'asset:objects/b14_estatua.png', // 32×64: estatua en pie (Antea)
  fallen: 'asset:objects/b14_estatua_caida.png', // 96×32: estatua caída y cubierta de coral (presente)
  wheel: 'asset:objects/b14_rueda.png', // 32×32: fila 2 abierta · 4 cerrada (compuerta y aliviadero)
  fern: 'asset:objects/b14_helecho.png', // 32×32: 2 brote (se coge) · 4 tierra húmeda · 6 brote plantado · 8 mata
  bigFern: 'asset:objects/b14_helecho_gigante.png', // 64×64: helecho gigante (primigenia), fila = variante
  root: 'asset:objects/b14_raiz.png', // 64×96: fila 2 raíz viva (Antea) · 4 raíz petrificada (presente)
  dredge: 'asset:objects/b14_draga.png', // 96×96: 2 trabajando · 4 parada · 6 cubierta de coral (tras el P7)
  bell: 'asset:objects/b14_campana.png', // 96×96: 2 con luces · 4 abandonada
  coral: 'asset:objects/b14_coral.png', // 32×32: 2 coral rojo · 4 abanico rosa · 6 coral cerebro · 8 anémona
  crate: 'asset:objects/b14_caja.png', // 32×32: 2 caja de reliquias sellada · 4 abierta y vacía
  gate: 'asset:objects/b14_puerta.png', // 96×64: 2 puerta de bronce cerrada (Antea)
  gear: 'asset:objects/b14_equipo.png', // 32×32: aletas y gafas de buceo
  stall: 'asset:objects/b14_puesto.png', // 96×64: puesto de redes (Antea)
  shaft: 'asset:objects/b14_haz.png', // 32×64: haz de luz de una salida a la superficie
});

/** Música (nombres de Añil o del catálogo, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  reef: 'Emociones',
  echo: 'Transicion',
  primal: 'Amenaza',
  genesis: 'GuaridaRocket',
  grunt: 'EncuentroRocket',
  boss: 'PrismaBoss',
  tension: 'Amenaza',
});

/** Tonos de las capas (se suman a día/noche; las capas de eco no tienen ciclo). */
export const TONES = Object.freeze({
  presente: [-54, -6, 30, 36],
  antea: [28, 12, -22, 34], // luz dorada de un día que ya pasó
  anteaStone: [18, 4, -16, 30],
  primigenia: [-10, 18, -18, 40], // verde húmedo, bruma
  fosa: [-30, 20, 10, 50],
});

/** Tintes (RGB) de los destellos. */
export const COLOR = Object.freeze({
  echo: [104, 216, 192], // verde agua del P7
  roar: [120, 40, 90],
  gold: [255, 220, 150],
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Condición de página a partir de flags: all / none / test. */
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
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Recoloca al jugador (y su cadena de seguidores) en una casilla del mapa actual sin warp. */
export async function placePlayer(ctx, { x, y, dir = 2 }) {
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  const { placeChainBehind } = await import('../../world/follower.js');
  placeChainBehind(p, ctx.world.followers);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** Evento del mapa actual por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id) || null;
}

/** Objeto interactivo invisible (texto al pulsar A delante); `solid` para muebles y ruinas. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => {
      const t = typeof text === 'function' ? text(ctx.state) : text;
      for (const line of [].concat(t)) await ctx.say(line);
    },
  };
}

/** Bloqueos invisibles (huella de un sprite grande), opcionalmente con condición. */
export function blockers(prefix, cells, extra = {}) {
  return cells.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, solid: true, noOver: true, ...extra }));
}

/** Fotograma fijo de una hoja 4×4 (fila = 2/4/6/8) sin animación de paso. */
export const still = (dir, extra = {}) => ({ dir, directionFix: true, walkAnime: false, stepAnime: false, ...extra });
/** Fotogramas animados en bucle (stepAnime) de una fila. */
export const looping = (dir, speed = 2, extra = {}) => ({ dir, directionFix: true, walkAnime: false, stepAnime: true, speed, ...extra });

/**
 * Añade una condición a TODAS las páginas de un evento (también de los tipos que traen sus propias páginas, como
 * `trainer`): se expande el tipo y cada `when` pasa a ser `cond && when`.
 */
export function onlyWhen(def, cond) {
  const raw = def.type ? expandEventDef(def) : def;
  const pages = raw.pages && raw.pages.length ? raw.pages : [{}];
  const base = { ...raw };
  delete base.pages;
  delete base.type;
  return {
    ...base,
    pages: pages.map((p) => {
      const w = p.when ?? raw.when;
      return { ...p, when: (s, ev) => Boolean(s) && cond(s, ev) && (!w || w(s, ev)) };
    }),
  };
}

/** Rectángulo como lista de celdas. */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Ruta ortogonal (primero x, luego y) de `from` a `to`. */
export function routeTo(from, to) {
  const out = [];
  for (let x = from.x; x < to.x; x++) out.push('right');
  for (let x = from.x; x > to.x; x--) out.push('left');
  for (let y = from.y; y < to.y; y++) out.push('down');
  for (let y = from.y; y > to.y; y--) out.push('up');
  return out;
}
