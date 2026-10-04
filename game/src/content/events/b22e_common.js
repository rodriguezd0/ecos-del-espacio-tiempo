// Constantes y utilidades del Bloque 22e — Postgame V (docs/CAMPANA.md B22): Grieta del Porvenir (siete Paradojas de
// hierro), Bastión Axis (instalación de combate, X18), revanchas de los Guardianes, cuarto del fondo del laboratorio de
// Alerce y Ruinas de Talasa (Ditto). Estado de entrada: `game_cleared` (B21).
// Módulo PURO (se importa en Node desde las definiciones de mapa y los tests): flags, variables, hablantes, gráficos,
// música y pequeñas ayudas de guion. Los textos están en b22e_texts.js.
import { getCharacter } from '../characters.js';
import { bossBattle } from '../common/bossBattle.js';

export { bossBattle };

/**
 * Flags del bloque. Globales sin prefijo que se leen: `game_cleared` (B21). Las claves son únicas en el proyecto (el
 * validador resuelve `F.clave` por nombre de clave en todos los archivos).
 */
export const F = Object.freeze({
  cleared: 'game_cleared',
  // Grieta del Porvenir
  grietaAbierta: 'b22e_grieta_vista', // se ha visto la boca de la grieta en el Mirador Sur
  grietaLlegada: 'b22e_grieta_llegada', // primera bajada (escena de Rosalía)
  rosaliaGrieta: 'b22e_rosalia_grieta', // Rosalía ha explicado el campamento
  tallerResuelto: 'b22e_taller_resuelto', // los tres bloques de hierro en la plataforma
  tallerTutorial: 'b22e_taller_tutorial', // Zygarde explicó la primera embestida a un bloque
  ferrodadaAparecida: 'b22e_ferrodada_aparecida', // recorrido a pie completado (Ferrodada en el cauce)
  paradojasTodas: 'b22e_paradojas_todas', // las siete capturadas (cambio en el mundo: la grieta se calma)
  // Bastión Axis
  bastionLlegada: 'b22e_bastion_llegada',
  bastionReglas: 'b22e_bastion_reglas', // la recepcionista explicó las reglas
  bastionRonda: 'b22e_bastion_ronda', // primera ronda de siete completada
  bastionMaestro: 'b22e_bastion_maestro', // racha de 21 (tercera ronda): título del Bastión
  // Revanchas de los Guardianes
  revanchaAviso: 'b22e_revancha_aviso', // Mamá / la Libreta: los Guardianes esperan en sus Pilares
  // Cuarto de Alerce
  cuartoAbierto: 'b22e_cuarto_abierto', // la llave abrió la puerta del fondo
  cuartoVisto: 'b22e_cuarto_visto', // se ha visto todo lo del cuarto
  alerceCuarto: 'b22e_alerce_cuarto', // Alerce, después (sin confesión)
  // Ruinas de Talasa
  talasaTrampilla: 'b22e_talasa_trampilla', // la trampilla de mantenimiento se ha visto forzada
  talasaRuinas: 'b22e_talasa_ruinas', // primera bajada a las ruinas
  talasaAlakazamita: 'b22e_talasa_alakazamita',
  talasaDitto: 'b22e_talasa_ditto', // el Ditto del laboratorio de cultivo (escena)
});

/** Variables del bloque. */
export const V = Object.freeze({
  restCount: 'rest_count', // world/rest.js
  // Grieta
  cauce: 'b22e_cauce', // tramo del cauce a pie: '' | 'sur' | 'norte' (extremo por el que se empezó)
  bloques: 'b22e_bloques', // posiciones de los bloques de hierro [[x, y]…] (coordenadas del mapa)
  // Bastión
  racha: 'b22e_bastion_racha', // victorias seguidas de la racha en curso
  record: 'b22e_bastion_record', // mejor racha
  puntos: 'b22e_bastion_pb', // Puntos de Batalla
  semilla: 'b22e_bastion_semilla', // semilla de los rivales de la racha en curso
  equipo: 'b22e_bastion_equipo', // uids de los tres Pokémon inscritos
  // Guardianes
  revancha: (key) => `b22e_revancha_${key}`, // rest_count de la última revancha ganada (-1 = ninguna)
});

/** Flags de una Paradoja (clave de PARADOXES en b22e_grieta_logic.js). */
export const paradoxFlag = Object.freeze({
  seen: (key) => `b22e_${key}_visto`,
  caught: (key) => `b22e_${key}_capturado`,
  rest: (key) => `b22e_${key}_descanso`, // var: rest_count cuando se debilitó sin capturarse (-1 = no)
  note: (key) => `b22e_nota_${key}`, // nota suelta de la Libreta
});

export const SPEAKER = Object.freeze({
  rosalia: 'Rosalía',
  alerce: 'Prof. Alerce',
  recepcion: 'Recepcionista',
  canje: 'Encargado de canje',
  guia: 'Guía del Bastión',
  casilda: 'Casilda',
  leandro: 'Leandro',
  abril: 'Abril',
  fermin: 'Fermín',
  olvido: 'Olvido',
  mom: 'Mamá',
  zygarde: 'Zygarde',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js, Graphics/Characters de Añil o arte propio). */
export const SPRITE = Object.freeze({
  rosalia: spriteOr('rosalia', 'anil:empresariaa'),
  alerce: spriteOr('profesor', 'anil:cientifico'),
  casilda: spriteOr('casilda', 'anil:anciana1'),
  leandro: spriteOr('leandro', 'anil:marinero'),
  abril: spriteOr('abril', 'anil:chavala1'),
  fermin: spriteOr('fermin', 'anil:minero'),
  olvido: spriteOr('olvido', 'anil:anciana1'),
  recepcion: 'secretaria', // charsets de Añil (Graphics/Characters)
  canje: 'asistente',
  guia: 'asistenta',
  nurse: 'enfermera',
  paradox: (species) => `follower:${species}:0:0`,
  pokemon: (species) => `follower:${species}:0:0`,
});

/** Objetos con arte propio (tools/b22e_assets.mjs) y de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  mouth: 'asset:objects/b22e_boca.png', // boca de la grieta (96×64): fila 2 dormida · 4 con brillo
  block: 'asset:objects/b22e_bloque.png', // bloque de hierro: fila 2 suelto · 4 encajado (brillo) · 6 golpe
  socket: 'asset:objects/b22e_zocalo.png', // zócalo de la plataforma: fila 2 vacío · 4 lleno
  frost: 'asset:objects/b22e_escarcha.png', // cristales de escarcha (filas 2/4/6/8: cuatro formas)
  spikes: 'asset:objects/b22e_puas.png', // púas de hierro fundidas por los rayos (filas 2/4 variantes · 6 con chispas)
  debris: 'asset:objects/b22e_resonador.png', // pedazos del Resonador (fila 2 anillo roto · 4 cadena · 6 placa)
  marks: 'asset:objects/b22e_marcas.png', // marcas del eco (2 rodadas · 4 plumas · 6 escamas · 8 tajo)
  crystal: 'asset:objects/b22e_cristal.png', // cristal cian del porvenir (animado)
  lever: 'asset:objects/b22e_palanca.png', // palanca del taller: fila 2 arriba · 4 bajada
  fire: 'asset:objects/hoguera.png', // hoguera (arte de B06, solo lectura)
  notebook: 'asset:objects/b22e_cuaderno.png', // cuaderno verde, fotos y papeles del cuarto de Alerce
  tank: 'asset:objects/b13_tanque.png', // tanque de cultivo de Talasa (arte de B13, solo lectura)
});

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.3 y «Música por situación»). */
export const MUSIC = Object.freeze({
  grieta: 'Transicion',
  paradox: 'PrismaBoss', // como Bramaluna, la otra Paradoja de Axis
  bastion: 'Torre Batalla',
  bastionBattle: 'CombateHoenn',
  bastionAce: 'Batalla Jefe Torre',
  guardian: 'CombateLider',
  lab: 'lab',
  ruinas: 'Lugar Fantasmal',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del jugador (state.player.gender 'F' → femenino). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Condición de página a partir de flags: all / none / test. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** ¿Postgame? (juego base terminado: B21). */
export const postgame = (s) => Boolean(s?.flag?.(F.cleared) && s.flag('b21_fin'));

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const t of [].concat(list)) {
    const text = typeof t === 'function' ? t(ctx.state) : t;
    await ctx.say(text, speaker ? { speaker, ...extra } : extra);
  }
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  await ctx.say(typeof text === 'function' ? text(ctx.state) : text, TELEPATHY);
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** ctx.effect sin romper el guion si el efecto no existe (tests). */
export function fx(ctx, name, opts) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[b22e] efecto ${name}`, err);
    return null;
  }
}

/** Evento del mapa actual por id (o null). */
export const eventById = (ctx, id) => ctx.world?.events?.find((e) => e.id === id) || null;

/** Número de descansos (world/rest.js). */
export const restCount = (s) => Number(s?.var?.(V.restCount, 0)) || 0;

/** Añade una nota suelta a la Libreta (no ocupa hueco de pista) y avisa. → true si era nueva. */
export async function addNote(ctx, id, text, { silent = false } = {}) {
  if (ctx.state.hasClue(id)) return false;
  ctx.state.addClue(id, text);
  if (!silent) {
    ctx.se?.('Mining item get');
    await ctx.say('Has apuntado una nota en la Libreta.');
  }
  return true;
}

/** Marca como resuelta una nota de la Libreta si existe. */
export function solveNote(state, id) {
  if (state.hasClue(id)) state.solveClue(id);
}

/** Copia profunda de datos JSON (equipo, mochila). */
export const cloneJson = (v) => JSON.parse(JSON.stringify(v));
