// Constantes y utilidades del Bloque 22a — Postgame I: el Eje y el Alma (docs/CAMPANA.md B22; X12, X16). Módulo PURO
// (se importa en Node desde las definiciones de mapa): flags, variables, hablantes, gráficos, música y ayudas de guion.
// Los textos están en b22a_texts.js. Reglas comunes del postgame (CAMPANA B22): todo en solitario; las condiciones de
// captura se explican en pantalla; un intento bloqueado no gasta objeto ni turno (motor: rules.catchCondition); un
// legendario debilitado reaparece al descansar (world/rest.js suma la variable rest_count en cada descanso).
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';

/**
 * Flags del bloque. Globales de otros bloques (solo lectura): game_cleared (B21), b21_fin (despertar del epílogo: empieza
 * el postgame), arceus_caught y b21_arceus_debilitado (B21).
 */
export const F = Object.freeze({
  // Estado del mundo (otros bloques lo consultan)
  lazoAnclado: 'b22a_lazo_anclado', // el nudo del tramo alto de la Senda del Lazo está fijo: se sube a la Cumbre Azur
  redAbierta: 'b22a_red_abierta', // Zygarde explicó la Red de Convergencia (primer uso de un nodo en el postgame)
  corazonAbierto: 'b22a_corazon_abierto', // las tres caras miraron al corazón: se abrió
  griseosfera: 'b22a_griseosfera', // la Griseosfera se cogió del pedestal (Giratina sale del vacío)
  // Escenas vistas
  anchorTutorial: 'b22a_anclaje_visto', // primer uso del Anclaje espacial (Zygarde lo explica)
  cumbreLlegada: 'b22a_cumbre_llegada',
  columnaPie: 'b22a_columna_a_pie', // primera llegada a Columna Lanza por la Cumbre
  grietaVista: 'b22a_grieta_vista', // Zygarde ve la grieta nueva de la explanada
  hondaLlegada: 'b22a_honda_llegada',
  sombraHonda: 'b22a_sombra_honda', // la sombra de Giratina cruza la Hondura («Ahora sí nos busca.»)
  corazonLlegada: 'b22a_corazon_llegada',
  mespritEspejos: 'b22a_mesprit_espejos', // Mesprit se deja ver en los espejos
  otroVisto: 'b22a_otro_visto', // el no elegido apareció en su plataforma
  // Capturas (salida opcional de cada encuentro)
  giratinaCaught: 'b22a_giratina_capturado',
  otroCaught: 'b22a_otro_capturado',
  uxieCaught: 'b22a_uxie_capturado',
  mespritCaught: 'b22a_mesprit_capturado',
  azelfCaught: 'b22a_azelf_capturado',
  arceusCaught: 'arceus_caught', // global (B21)
  // De otros bloques (solo lectura)
  gameCleared: 'game_cleared',
  postgame: 'b21_fin',
  arceusFainted: 'b21_arceus_debilitado',
  epilogueBack: 'b21_regreso',
});

/** Variables del bloque (y las de otros bloques que se leen). */
export const V = Object.freeze({
  restCount: 'rest_count', // world/rest.js: +1 en cada descanso
  p9Choice: 'p9_choice', // B18: 'DIALGA' | 'PALKIA' (el elegido)
  p9Caught: 'p9_chosen_caught', // B18: el elegido capturado
  mespritAnswer: 'b16_mesprit_respuesta', // B16
  uxieTries: 'b22a_uxie_olvidos', // respuestas equivocadas a la última pregunta de Uxie (sin castigo)
});

/**
 * Legendarios del bloque: variable con el rest_count del momento en que se debilitaron (-1 o sin valor = en pie) y
 * flag de captura. Arceus usa la de B21 (arceus_caught) y su línea base se fija al despertar del epílogo.
 */
export const LEGENDS = Object.freeze({
  giratina: Object.freeze({ species: 'GIRATINA', name: 'Giratina', rest: 'b22a_giratina_descanso', caught: F.giratinaCaught }),
  otro: Object.freeze({ species: null, name: null, rest: 'b22a_otro_descanso', caught: F.otroCaught }),
  arceus: Object.freeze({ species: 'ARCEUS', name: 'Arceus', rest: 'b22a_arceus_descanso', caught: F.arceusCaught }),
  uxie: Object.freeze({ species: 'UXIE', name: 'Uxie', rest: 'b22a_uxie_descanso', caught: F.uxieCaught }),
  mesprit: Object.freeze({ species: 'MESPRIT', name: 'Mesprit', rest: 'b22a_mesprit_descanso', caught: F.mespritCaught }),
  azelf: Object.freeze({ species: 'AZELF', name: 'Azelf', rest: 'b22a_azelf_descanso', caught: F.azelfCaught }),
});

export const SPEAKER = Object.freeze({
  arceus: 'Arceus',
  uxie: 'Uxie',
  mesprit: 'Mesprit',
  azelf: 'Azelf',
  olmedo: 'Agente Olmedo',
  curiosa: 'Curiosa',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (seguidores de Añil para los legendarios; content/characters.js para las personas). */
export const SPRITE = Object.freeze({
  giratina: 'follower:GIRATINA:1:0', // Forma Origen
  dialga: 'follower:DIALGA:0:0',
  palkia: 'follower:PALKIA:0:0',
  uxie: 'follower:UXIE:0:0',
  mesprit: 'follower:MESPRIT:0:0',
  azelf: 'follower:AZELF:0:0',
  curiosa: spriteOr('vecina', 'anil:mujer1'),
  protagonistM: 'protagonista_m',
  protagonistF: 'protagonista_f',
});

/** Arte propio (node tools/b22a_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  cara: 'asset:objects/b22a_cara.png', // 32×32 · fila 2 reflejo de losa · 4 losa anclada · 6 centro anclado · 8 centro reflejo
  poste: 'asset:objects/b22a_poste.png', // 32×64 · fila 2 poste del nudo apagado · 4 encendido (cara anclada)
  objetos: 'asset:objects/b22a_objetos.png', // 32×32 · fila 2 nudo de aire · 4 nudo anclado · 6 hexágono de la Red · 8 peldaños de nube
  corazon: 'asset:objects/b22a_corazon.png', // 32×64 · fila 2 Griseosfera en su pedestal · 4 pedestal vacío · 6 marca apagada · 8 marca encendida
  portal: 'asset:objects/portal_distorsion.png', // grieta-portal del Mundo Distorsión (B12)
  anchorPost: 'asset:objects/ancla_poste.png', // Ancla del espacio imposible (B12)
});

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.8). */
export const MUSIC = Object.freeze({
  legendary: 'Legendario', // legendarios de Pilar
  arceus: 'PrismaBossFinal', // Arceus en la fase Normal
  distortion: 'distortion',
  summit: 'Transicion', // la Cumbre Azur (la misma que la Senda del Lazo)
});

/** Fondos de combate (CAMPANA §1.8). */
export const BATTLEBACK = Object.freeze({ distortion: 'MundoDistorsion', columna: 'ColumnaLanza', arceus: 'Arceus', alma: 'Templo' });

export const GREEN = Object.freeze([185, 255, 102]);
export const VIOLET = Object.freeze([168, 104, 232]);
export const GOLD = Object.freeze([255, 226, 150]);
export const TELEPATHY = Object.freeze({ telepathy: true });

// ───────────────────────────── estado (puro) ─────────────────────────────

/** ¿Empezó el postgame? (fin del juego base y despertar del epílogo, B21). */
export const isPostgame = (s) => Boolean(s?.flag?.(F.gameCleared) && s.flag(F.postgame));

/** rest_count de la partida. */
export const restCount = (s) => Number(s?.var?.(V.restCount, 0)) || 0;

/**
 * ¿Está el legendario `key` en su sitio? No capturado y, si se debilitó, ya se ha descansado desde entonces (la variable
 * guarda el rest_count del momento; sin valor = nunca se debilitó).
 */
export function legendReady(s, key) {
  const L = LEGENDS[key];
  if (!L || !s || s.flag(L.caught)) return false;
  const at = s.var(L.rest, null);
  if (at === null || at === undefined || at === '') return true;
  const n = Number(at);
  return !Number.isFinite(n) || n < 0 || restCount(s) > n;
}

/** ¿Se debilitó y espera a que se descanse? */
export function legendResting(s, key) {
  const L = LEGENDS[key];
  return Boolean(L && s && !s.flag(L.caught) && !legendReady(s, key));
}

/** Arceus vuelve a la cima: B21 lo dejó debilitado, sin capturar, y se ha descansado tras el final. */
export const arceusReady = (s) => isPostgame(s) && Boolean(s.flag(F.arceusFainted)) && legendReady(s, 'arceus');

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Condición de página del postgame (+ test opcional). */
export const postgameWhen = (test = null) => (s) => isPostgame(s) && (!test || Boolean(test(s)));

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

// ───────────────────────────── guion ─────────────────────────────

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(typeof text === 'function' ? text(ctx.state) : text, TELEPATHY);
}

/** Varias líneas telepáticas seguidas. */
export async function zygardeLines(ctx, list) {
  for (const text of list) await zygardeSays(ctx, text);
}

/** Espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento vivo del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id && !e.erased) || null;
}

/** Recoloca al jugador en (x, y) del mapa actual y su cadena de seguidores detrás (sin fundido). */
export function placePlayer(ctx, x, y, dir = 8) {
  const p = ctx.player;
  if (!p) return;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  placeChainBehind(p, ctx.world?.followers || []);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** Aparece o se desvanece un evento (opacidad) en `frames` fotogramas. */
export async function fadeEvent(ctx, ev, to, frames = 16) {
  if (!ev) return;
  const from = ev.opacity ?? 255;
  for (let f = 1; f <= frames; f++) {
    ev.opacity = Math.round(from + ((to - from) * f) / frames);
    await pause(ctx, 1);
  }
  ev.opacity = to;
}

/** Sprite de evento fijo (hoja 4×4 de un objeto: `dir` = fila, sin animar al andar). */
export const objectPage = (sprite, dir = 2, extra = {}) => ({ sprite, dir, directionFix: true, walkAnime: false, shadow: false, ...extra });
