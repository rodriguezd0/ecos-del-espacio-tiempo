// Constantes y utilidades del Bloque 11 — Interludio 5: Bosque Neblino, el Monte y la casa (docs/CAMPANA.md B11).
// Módulo puro (se importa en Node desde las definiciones de mapa): flags, variables, hablantes, sprites, música y
// ayudas de guion. Los combates de guion usan el helper común del proyecto (docs/BALANCE.md): scriptedBattle.
import { getCharacter } from '../characters.js';
import { gaelStarterSpecies } from '../trainers/b01_town.js';
import { scriptedBattle } from './b06_common.js';
import { bossBattle } from '../common/bossBattle.js';

export { scriptedBattle };

/**
 * Flags del bloque. Globales sin prefijo: p5_restored (B10). Las claves son únicas en el proyecto (el validador
 * resuelve `F.clave` por nombre de clave).
 */
export const F = Object.freeze({
  // Bosque Neblino
  neblinoIntro: 'b11_neblino_intro', // primera entrada tras el P5: la niebla se ha ido
  // T10 · «La cuadrilla perdida»
  niloMet: 'b11_t10_nilo_visto', // Nilo, escondido de noche (pista inicial)
  niloTold: 'b11_t10_nilo_cuenta', // la cuadrilla subió a la Ruta 10 (segunda pista)
  crewFound: 'b11_t10_cuadrilla_vista',
  crewSaved: 'b11_t10_cuadrilla', // rescatada de la cornisa
  alfaBeaten: 'b11_t10_alfa', // Honchkrow Alfa vencido (reaparece al descansar) o capturado
  alfaCaught: 'b11_t10_alfa_capturado',
  darkPlate: 'b11_t10_tablilla', // Tabla Oscura
  niloDeserts: 'b11_nilo_desertor', // Nilo deserta y da los planos de Talasa
  talasaPlans: 'b11_planos_talasa', // para B13 (N4)
  // T09 · «El niño que recuerda»
  ikerMet: 'b11_t09_iker', // segunda pista
  drawingsSolved: 'b11_t09_dibujos', // tres lugares identificados
  wellFound: 'b11_t09_pozo_deducido', // el pozo estaba bajo la casa de té
  wellOpen: 'b11_t09_pozo_abierto', // el Musharna abre el paso
  mindPlate: 'b11_t09_tablilla',
  ikerCured: 'b11_t09_iker_curado', // Chimechita
  // Villa Alba
  homeReturn: 'b11_regreso', // primer regreso a casa
  eggGiven: 'b11_huevo', // Mamá entrega el huevo de Togepi
  eggWaiting: 'b11_huevo_aviso', // equipo lleno: Mamá lo guarda hasta que haya sitio
  gaelAlerce: 'b11_gael_alerce', // «Usted sabía quiénes eran desde el principio.»
  // Campamento del Monte
  campSeen: 'b11_campamento_visto', // primera visita: perforación de la explanada, cajas EXP-03
  exp03Taken: 'b11_exp03', // Genesis se lleva el cristal: el campamento queda abandonado
  gaelB4: 'b11_gael_b4', // SALIDA del bloque (content/story/journal.js)
  // Cerro del Alba
  cerroSeen: 'b11_cerro_visto',
});

/** Variables del bloque. */
export const V = Object.freeze({
  restCount: 'rest_count',
  alfaRest: 'b11_alfa_descanso', // rest_count cuando se venció al Alfa (reaparece al descansar)
  caught: 'b11_sigilo_pillado', // veces que los centinelas han visto al jugador
  drawings: 'b11_t09_dibujo', // dibujos identificados (0–3)
});

export const SPEAKER = Object.freeze({
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  mom: 'Mamá',
  lia: 'Lía',
  nilo: 'Nilo',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  jefa: 'Jefa de campo',
  guardia: 'Técnico de guardia',
  iker: 'Íker',
  madreIker: 'Madre de Íker',
  anciano: 'Anciano',
  vecina: 'Vecina',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  gael: spriteOr('gael', 'anil:guay'),
  alerce: spriteOr('profesor', 'anil:cientifico'),
  mom: 'mama',
  lia: spriteOr('ayudante', 'anil:cientifica'),
  nilo: spriteOr('nilo', spriteOr('genesis_tecnico', 'anil:cientifico')),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  investigadora: spriteOr('genesis_investigadora', spriteOr('genesis_tecnica', 'anil:cientifica')),
  iker: spriteOr('iker', spriteOr('nino', 'anil:joven')),
  madreIker: spriteOr('vecina', 'anil:dama'),
  anciano: spriteOr('anciano', 'anil:veterano'),
  vecina: spriteOr('vecina', 'anil:dama'),
  honchkrow: 'follower:HONCHKROW:0:0',
  murkrow: 'follower:MURKROW:0:0',
  musharna: 'follower:MUSHARNA:0:0',
  togepi: 'follower:TOGEPI:0:0',
});

/** Objetos con arte propio (tools/b11_assets.mjs) y reutilizados de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  crate: 'asset:objects/b11_caja_exp03.png', // fila 2 sellada · 4 abierta y vacía
  rig: 'asset:objects/b11_perforadora.png', // perforadora de muestras (fila 2 en marcha · 4 parada)
  crystal: 'asset:objects/b11_cristal_lila.png', // cristales lila del Neblino (fila = variante)
  hole: 'asset:objects/b11_sondeo.png', // hoyo de sondeo tapado
  fire: 'asset:objects/hoguera.png', // hoguera (arte de B06)
  tripod: 'asset:objects/tripode.png', // trípode del Consorcio (arte de B01)
  instrumentCase: 'asset:objects/b09b_maletin.png', // maletín de instrumentos de un técnico (arte de B09b)
  plate: 'asset:objects/b11_tablilla.png', // Tablilla en el suelo (fila 2 Oscura · 4 Mental)
  veins: 'asset:objects/barreras.png', // vetas verdes de Trepar (dir 6)
});

/** Música (nombres de Añil o del catálogo, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  genesis: 'GuaridaRocket',
  grunt: 'EncuentroRocket',
  rival: 'CombateRival',
  boss: 'PrismaBoss',
  tension: 'Amenaza',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Evolución final del inicial de Gael (CAMPANA §6.3: «inicial final 43»). */
export const FINAL = Object.freeze({ LITTEN: 'INCINEROAR', SOBBLE: 'INTELEON', TURTWIG: 'TORTERRA' });
export function gaelFinalStarter(state) {
  const base = gaelStarterSpecies(state);
  return FINAL[base] || base;
}

/**
 * Combate de guion contra un salvaje fijo (Alfa) sin derrota general (CAMPANA §2.6; docs/BALANCE.md): es el helper
 * común `bossBattle` (content/common/bossBattle.js), que ya trata la captura como superado y la huida como «nada
 * que recuperar». Si se pierde, se cura el equipo, se vuelve a `retry` ({ x, y, dir } de este mapa) sin tocar el
 * punto de cura y se dice `loseText`. → 'win' | 'caught' | 'run' | 'lose'
 */
export function wildBossBattle(ctx, request, retry, opts = {}) {
  return bossBattle(ctx, request, retry, opts);
}

/** Condición de página a partir de flags: all / none / test. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Noche de juego (20:00–5:59, GameState.isDay). */
export const isNight = (s) => Boolean(s) && typeof s.isDay === 'function' && !s.isDay();

/** Dice varias líneas seguidas con el mismo hablante. */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). Zygarde habla muy poco (autor, 25-09-2026). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Texto según el género del jugador (state.player.gender 'F' → femenino). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Recoloca al jugador (y su cadena de seguidores) en una casilla del mapa actual sin warp. */
export async function placePlayer(ctx, { x, y, dir = 2 }) {
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten();
  const { placeChainBehind } = await import('../../world/follower.js');
  placeChainBehind(p, ctx.world.followers);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}
