// Constantes y utilidades del Bloque 10 — Pilar de la Memoria (docs/CAMPANA.md B10). Módulo puro (se importa en Node
// desde las definiciones de mapa): flags, variables, hablantes, sprites, música, textos según el género del
// protagonista y ayudas de guion comunes (combate de guion sin pérdida, teletransporte dentro del mapa).
import { getCharacter } from '../characters.js';
import { scriptedBattle as b06ScriptedBattle } from './b06_common.js';
import { placeChainBehind } from '../../world/follower.js';

/** Flags de la historia del bloque (en orden) y auxiliares. Globales sin prefijo: p5_restored, verse_5. */
export const F = Object.freeze({
  arrival: 'b10_llegada', // escena de llegada a Mnemos (la niebla, Fausta)
  olvidoMet: 'b10_olvido_conocida', // Olvido entrega las notas de nombres
  notes: 'b10_notas_repartidas', // las cinco notas entregadas y Olvido abre el Archivo
  archivoOpen: 'b10_archivo_abierto',
  casia: 'b10_casia', // cameo de Casia en el Archivo de papel
  olvidoDown: 'b10_olvido_baja', // Olvido baja por su camino y espera al fondo
  suelo: 'b10_suelo', // Estancia del Suelo Olvidado cruzada
  manos: 'b10_manos', // Estancia de las Dos Manos
  lectura: 'b10_lectura', // Estancia de la Lectura (relato en la Libreta)
  rollos: 'b10_rollos', // Estancia de los Rollos
  mural: 'b10_mural', // Sala del Mural
  olvidoChallenged: 'b10_olvido_retada',
  olvido: 'b10_olvido_vencida',
  restored: 'p5_restored', // global (content/story/fragments.js)
  alerce: 'b10_alerce', // Alerce calla al oír el verso V
  informe: 'b10_informe', // informe tachado de la Laguna Clara
  keystone: 'b10_piedra_espiritu', // Olvido da la Piedra Espíritu (ODDKEYSTONE)
  // auxiliares
  sinistea: 'b10_sinistea',
  gardevoirite: 'b10_gardevoirita',
  spiritomb: 'b10_spiritomb', // capturado
  hondoSeen: 'b10_hondo_visto',
  muralSeen: 'b10_mural_visto',
  notesNote: 'b10_nota_libreta',
  fogLifted: 'b10_niebla_levantada', // aviso «la niebla se ha levantado» ya mostrado (B11 lo comprueba)
  sueloFall: 'b10_suelo_caida', // primera caída en el Suelo Olvidado (comentario del Core)
});

/** Destinatarios de las notas de nombres (misión de Olvido). */
export const NOTES = Object.freeze([
  Object.freeze({ key: 'sabina', flag: 'b10_nota_sabina', who: 'Sabina', where: 'la casa de té' }),
  Object.freeze({ key: 'tome', flag: 'b10_nota_tome', who: 'Tomé', where: 'el herbolario' }),
  Object.freeze({ key: 'jacinta', flag: 'b10_nota_jacinta', who: 'Jacinta', where: 'la casa rosa del este' }),
  Object.freeze({ key: 'amaro', flag: 'b10_nota_amaro', who: 'Amaro', where: 'el Santuario de los Glifos' }),
  Object.freeze({ key: 'bruno', flag: 'b10_nota_bruno', who: 'Bruno', where: 'el estanque' }),
]);
export const noteFor = (key) => NOTES.find((n) => n.key === key) || null;
export const notesDelivered = (s) => NOTES.filter((n) => s?.flag?.(n.flag)).length;

/** Variables del bloque. */
export const V = Object.freeze({
  lever1: 'b10_palanca_1', // posición 0–3 de la palanca oeste (Dos Manos)
  lever2: 'b10_palanca_2', // posición 0–3 de la palanca este
  glyphStep: 'b10_glifo_paso', // glifos tocados en orden (0–6)
  scrollStep: 'b10_rollo_paso', // rollos colocados en orden (0–4)
  scrollSlots: 'b10_rollo_huecos', // colores colocados por hueco ('----')
  mural: 'b10_mural_orden', // orden actual de los paneles ('351624')
  honey: 'b10_miel', // rest_count a partir del cual el árbol de miel tiene un Pokémon (0 = sin untar)
  spiritombRest: 'b10_spiritomb_descanso', // rest_count cuando huyó Spiritomb (reaparece al descansar)
  restCount: 'rest_count', // world/rest.js
});

export const SPEAKER = Object.freeze({
  olvido: 'Olvido',
  casia: 'Casia',
  alerce: 'Alerce',
  custodio: 'Eco del custodio',
  custodia: 'Eco de la custodia',
  fausta: 'Fausta',
  sabina: 'Sabina',
  tome: 'Tomé',
  elio: 'Elio',
  jacinta: 'Jacinta',
  nerea: 'Nerea',
  amaro: 'Amaro',
  bruno: 'Bruno',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  pescador: 'Pescador',
  vecino: 'Vecino',
  vecina: 'Vecina',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  olvido: spriteOr('olvido', 'anil:anciana2'),
  casia: spriteOr('casia', 'anil:cientifica'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  custodio: spriteOr('archivista', 'anil:fuji'),
  custodia: 'anil:kimono',
  fausta: 'anil:mujer2',
  sabina: 'anil:kimono',
  tome: 'anil:anciano1',
  elio: 'anil:chaval2',
  jacinta: 'anil:anciana1',
  nerea: spriteOr('nina', 'anil:chavala1'),
  amaro: 'anil:fuji',
  bruno: spriteOr('nino', 'anil:chaval1'),
  monje: 'anil:anciano2',
  pescador: 'anil:pescador',
  vecino: spriteOr('vecino', 'anil:hombre1'),
  vecina: spriteOr('vecina', 'anil:mujer1'),
  pancham: 'follower:PANCHAM:0:0',
  chingling: 'follower:CHINGLING:0:0',
  sinistea: 'follower:SINISTEA:0:0',
  bronzong: 'follower:BRONZONG:0:0',
  spiritomb: 'follower:SPIRITOMB:0:0',
});

/** Objetos del bloque (arte propio de tools/b10_assets.mjs). */
export const OBJ = Object.freeze({
  bamboo: 'asset:objects/b10_bambu.png',
  lever: 'asset:objects/b10_palanca.png',
  // Umbral bajo (una casilla de alto, no tapa al jugador que llega del norte): 0–6 umbral glífico de la Lectura con
  // k glifos encendidos · 8 losa de las Dos Manos.
  threshold: 'asset:objects/b10_umbral.png',
  cubby: 'asset:objects/b10_hueco_rollo.png',
  mural: 'asset:objects/b10_mural.png',
  wall: 'asset:objects/barreras.png', // vetas verdes de Trepar (dir 6)
  scroll: 'libro', // rollo de pergamino (Graphics/Characters/libro.png, patrón 0, dir 2)
});

/** Fotograma de una hoja 4×4 del bloque (índice = fila·4 + columna) → propiedades de página { dir, pattern }. */
export function frame(index) {
  const i = Math.max(0, Math.min(15, Math.floor(index)));
  return { dir: [2, 4, 6, 8][Math.floor(i / 4)], pattern: i % 4, directionFix: true, walkAnime: false, stepAnime: false };
}

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  town: 'PrismaVilla1',
  archive: 'Transicion',
  hondo: 'Emociones',
  genesis: 'GuaridaRocket',
  guardian: 'CombateLider',
  grunt: 'EncuentroRocket',
  tension: 'Amenaza',
});

/** Tono sepia del P5 (content/stamps/pilar.js lo expone como pilarTone('P5')). */
export const SEPIA = Object.freeze([190, 150, 104]);
export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
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

/**
 * Combate de guion que se puede perder sin pérdida (CAMPANA §2.6, docs/BALANCE.md): el helper común de
 * content/events/b06_common.js (canLose + noMoneyLoss, cura y vuelve a `retry` sin tocar el punto de cura).
 */
export const scriptedBattle = b06ScriptedBattle;

/** Lleva al jugador a (x, y) del mismo mapa con un fundido (caídas del Suelo Olvidado, escenas). */
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
    await ctx.wait(6);
    await ctx.fade('in', frames);
  }
}

/** Evento del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id) || null;
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());
