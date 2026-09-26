// Constantes y utilidades del Bloque 18 — Pilar de la Convergencia (P9) (docs/CAMPANA.md B18; D18). Módulo PURO (se
// importa en Node desde las definiciones de mapa): flags, variables, hablantes, sprites, arte propio, música y ayudas
// de guion. Los combates de guion usan el helper común del proyecto (content/common/bossBattle.js, docs/BALANCE.md) y
// la tensión de ejes es genérica (world/axis/, docs/ARCHITECTURE.md §22).
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';

/**
 * Flags del bloque en orden de historia. Globales sin prefijo: p9_restored (Pilar), verse_9. Entrada (CAMPANA B18):
 * b17_vigilia (B17), REDCHAIN y la Reconstrucción (zyg_complete / capacidad `rebuild`).
 */
export const F = Object.freeze({
  // Puente
  arrival: 'b18_llegada', // primera llegada al borde norte (Alerce con el catalejo)
  gap1: 'b18_tramo_1', gap2: 'b18_tramo_2', gap3: 'b18_tramo_3', // los tres puntos del tramo central
  bridge: 'b18_puente_entero', // el tramo central está en pie (Genesis lo ve; Alerce avanza hasta el borde)
  casiaIntro: 'b18_casia_intro', // Casia intercepta en la plataforma (antes del primer combate)
  casia: 'b18_casia', // Casia vencida
  garridoIntro: 'b18_garrido_intro',
  garrido: 'b18_garrido', // Garrido vencido
  heal1: 'b18_cura_1', heal2: 'b18_cura_2', // Alerce ofreció curar tras Casia y tras Garrido
  verticeLine: 'b18_vertice_frase', // «Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?»
  vertice: 'b18_vertice', // Vértice vencido
  overload: 'b18_resonador_roto', // el Resonador se sobrecarga y la Cadena Sintética se parte
  irruption: 'b18_irrupcion', // Dialga y Palkia irrumpen en la Cámara del Cruce
  gael: 'b18_gael', // Gael llega por el borde sur y rechaza a Vértice
  verticeGone: 'b18_vertice_huye', // Vértice se retira en el aerodeslizador (B21: sale de Axis en el epílogo)
  notebook: 'b18_cuaderno', // Gael recoge el cuaderno de campo de Vértice (B20/B21)
  arrest: 'b18_detenidos', // Olmedo detiene a Casia y a Garrido
  scene: 'b18_escena', // escena completa: la boca de la Cámara queda abierta
  heal3: 'b18_cura_3',
  // Cámara del Cruce
  chamberIn: 'b18_camara_llegada',
  tutorial: 'b18_cristal_tutorial', // la narración describe el primer cristal
  room1: 'b18_sala_1', room2: 'b18_sala_2', room3: 'b18_sala_3', // salida de cada sala alcanzada por primera vez
  nucleus: 'b18_nucleo_visto', // primera llegada al núcleo (se abre el atajo del vestíbulo)
  verse: 'verse_9', // global (content/story/verses.js)
  bound: 'b18_eje_atado', // primera victoria contra el elegido (captura o derrota)
  restored: 'p9_restored', // global (content/story/fragments.js)
  orb: 'b18_orbe', // orbe del no elegido recogido
  tempered: 'b18_cadena_templada', // la Cadena Roja queda templada (se conserva)
  inscription: 'b18_inscripcion', // inscripción del núcleo leída: pista T15
  // Salida
  farewell: 'b18_despedida', // Alerce y Olmedo tras el P9 (relojes sincronizados, la Sima ya no se ensancha)
  // de otros bloques (solo lectura)
  t15Tablet: 'b19_tablilla', // B19: Tabla Draco conseguida; Alerce espera ya en la Calzada, y la policía deja el Puente
});

/** Variables del bloque. */
export const V = Object.freeze({
  /** Salida (CAMPANA B18): 'DIALGA' | 'PALKIA'. La elección queda fijada. B21/B22 la usan (reencuentro en Columna Lanza). */
  choice: 'p9_choice',
  /** Salida: true si el elegido se capturó (antes o después de restaurar el Pilar). */
  caught: 'p9_chosen_caught',
  /** rest_count cuando se debilitó al elegido sin capturarlo (reaparece al descansar; -1 = no está debilitado). */
  chosenRest: 'b18_elegido_descanso',
  defeats: 'b18_elegido_derrotas', // veces que el jugador perdió contra el elegido (sin castigo)
  restCount: 'rest_count', // world/rest.js
});

export const CHOICES = Object.freeze({ DIALGA: 'DIALGA', PALKIA: 'PALKIA' });
/** Orbe que deja el NO elegido (CAMPANA B18): Dialga elegido → Palkia deja la Lustresfera; Palkia elegido → Diamansfera. */
export const ORB_OF_UNCHOSEN = Object.freeze({ DIALGA: 'LUSTROUSORB', PALKIA: 'ADAMANTORB' });
export const OTHER = Object.freeze({ DIALGA: 'PALKIA', PALKIA: 'DIALGA' });

export const SPEAKER = Object.freeze({
  alerce: 'Prof. Alerce',
  casia: 'Casia',
  garrido: 'Garrido',
  vertice: 'Vértice',
  gael: 'Gael',
  olmedo: 'Agente Olmedo',
  agent: 'Agente',
  tech: 'Técnico',
  techF: 'Técnica',
  vendor: 'Buhonera',
  dialga: 'Dialga',
  palkia: 'Palkia',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js y alias de characters_campaign.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  alerce: spriteOr('alerce', spriteOr('profesor', 'anil:cientifico')),
  casia: spriteOr('casia', 'anil:cientifica'),
  garrido: spriteOr('garrido', 'anil:cientifico'),
  vertice: spriteOr('vertice_lider', spriteOr('vertice', 'anil:giovanni')),
  gael: spriteOr('gael', 'anil:guay'),
  olmedo: spriteOr('olmedo', spriteOr('policia', 'anil:policia')),
  agent: spriteOr('policia', 'anil:policia'),
  tech: spriteOr('genesis_tecnico', 'anil:cientifico'),
  techF: spriteOr('genesis_tecnica', 'anil:cientifica'),
  vendor: 'anil:mujer1',
  dialga: 'follower:DIALGA:0:0',
  palkia: 'follower:PALKIA:0:0',
});

/** Arte propio (node tools/b18_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  resonator: 'asset:objects/b18_resonador.png', // 96×128 · fila 2 activo · 4 sobrecarga · 6 roto
  chain: 'asset:objects/b18_cadena.png', // 32×32 · fila 2 horizontal · 4 vertical · 6 rota
  hover: 'asset:objects/b18_aerodeslizador.png', // 128×96 · fila 2 posado · 4 en vuelo
  items: 'asset:objects/b18_objetos.png', // 32×32 · fila 2 cuaderno · 4 Diamansfera · 6 Lustresfera · 8 reloj
  tripod: 'asset:objects/tripode.png', // catalejo/trípode (arte de B01)
  fire: 'asset:objects/hoguera.png', // hoguera (arte de B06)
});

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.8). */
export const MUSIC = Object.freeze({
  sima: 'Amenaza',
  chamber: 'Transicion',
  genesis: 'GuaridaRocket',
  commander: 'CombateComandante',
  vertice: 'CombateGiovanniFinal',
  crisis: 'Climax',
  legendary: 'Legendario',
  after: 'LeyendaPrisma',
});

/** Tinte plata del P9 (content/stamps/pilar.js lo expone como pilarTone('P9')). */
export const SILVER = Object.freeze([200, 208, 224]);
export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento vivo del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id && !e.erased) || null;
}

/** Recoloca al jugador en (x, y) del mapa actual (con fundido opcional) y su cadena de seguidores detrás. */
export async function placePlayer(ctx, x, y, dir = 8, { fade = true, frames = 14 } = {}) {
  if (fade) await ctx.fade('out', frames);
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  placeChainBehind(p, ctx.world?.followers || []);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
  if (fade) {
    await pause(ctx, 6);
    await ctx.fade('in', frames);
  }
}

/** Casilla libre junto al jugador (se pisa y no hay otro evento sólido), o null. `skip`: eventos que no cuentan. */
export function freeSpotNearPlayer(ctx, skip = []) {
  const p = ctx.player;
  return [[-1, 0], [1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
    .find((c) => ctx.map.playerPassable(c.x, c.y, 0, {})
      && !ctx.world.events.some((e) => !skip.includes(e) && !e.erased && e.page && !e.through && e.x === c.x && e.y === c.y)) || null;
}

/**
 * Trae junto al jugador (con fundido) a los personajes que están fuera de la vista y devuelve una función que los
 * devuelve a su sitio (también con fundido). Los que ya se ven se quedan donde están.
 */
export async function gatherNearPlayer(ctx, events, { frames = 10 } = {}) {
  const p = ctx.player;
  const far = events.filter((ev) => ev && (Math.abs(ev.x - p.x) > 6 || Math.abs(ev.y - p.y) > 4));
  if (!far.length) return async () => {};
  const homes = far.map((ev) => ({ ev, x: ev.x, y: ev.y, dir: ev.direction }));
  await ctx.fade('out', frames);
  for (const ev of far) {
    const spot = freeSpotNearPlayer(ctx, [ev]);
    if (spot) ev.moveTo(spot.x, spot.y);
  }
  await ctx.fade('in', frames);
  return async () => {
    await ctx.fade('out', frames);
    for (const h of homes) { h.ev.moveTo(h.x, h.y); h.ev.direction = h.dir; }
    await ctx.fade('in', frames);
  };
}

/** Lleva a un personaje de escena por el suelo (BFS de content/events/b07_path.js); ruta en L si no hay mapa. */
export async function walkTo(ctx, ev, x, y, opts = {}) {
  if (!ev || (ev.x === x && ev.y === y)) return;
  const { stageRoute } = await import('./b07_path.js');
  const route = stageRoute(ctx, ev, x, y);
  if (route?.length) await ctx.move(ev, route, { through: false, ...opts });
  if (ev.x !== x || ev.y !== y) {
    // Sin camino libre (gente en medio): se atraviesa, para que la escena nunca se quede colgada.
    const rest = [];
    for (let i = 0; i < Math.abs(x - ev.x); i++) rest.push(x > ev.x ? 'right' : 'left');
    for (let i = 0; i < Math.abs(y - ev.y); i++) rest.push(y > ev.y ? 'down' : 'up');
    if (rest.length) await ctx.move(ev, rest, { through: true, ...opts });
  }
}

/** Sprite de evento fijo (hoja 4×4 de un objeto: `dir` = fila, sin animar al andar). */
export const objectPage = (sprite, dir = 2, extra = {}) => ({ sprite, dir, directionFix: true, walkAnime: false, ...extra });

/** Evento que se examina (sólido o no): texto fijo o función del estado. */
export function examine(id, x, y, text, { solid = true, when: cond } = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid, ...(cond ? { when: cond } : {}),
    script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); },
  };
}

/** ¿Hay que traer de vuelta al elegido? (debilitado sin capturar y ya se ha descansado desde entonces) */
export function chosenWaiting(s) {
  if (!s || !s.flag(F.bound) || s.var(V.caught, false) === true) return false;
  const at = Number(s.var(V.chosenRest, -1));
  if (at < 0) return false;
  return Number(s.var(V.restCount, 0)) > at;
}
