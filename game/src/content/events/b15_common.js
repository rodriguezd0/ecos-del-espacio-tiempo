// Constantes y utilidades del Bloque 15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo (docs/CAMPANA.md
// B15). Módulo puro (se importa en Node desde las definiciones de mapa): flags, variables, hablantes, sprites, música y
// ayudas de guion. Los combates de guion usan el helper común del proyecto (docs/BALANCE.md): bossBattle.
import { getCharacter } from '../characters.js';
import { gaelStarterSpecies } from '../trainers/b01_town.js';
import { bossBattle } from '../common/bossBattle.js';

export { bossBattle };

/**
 * Flags del bloque. Globales sin prefijo: p7_restored (B14), zyg_core_5 (lo pone joinCore). Las claves son únicas en
 * el proyecto (el validador resuelve `F.clave` por nombre de clave).
 */
export const F = Object.freeze({
  p7: 'p7_restored',
  p8: 'p8_restored', // B16: con el Pilar del Alma vuelve el vínculo de los Pokémon del norte
  // Estado del mundo: DESVINCULACIÓN del norte (los Pokémon no reconocen a sus entrenadores). Lo pone la primera
  // llegada al norte (Ruta 11 o el muelle de Villa Boreal); B16 lo revierte con setFlag('b15_desvinculacion', false)
  // o, sin más, al restaurar el P8 (isNorthUnbound lo consulta).
  unbound: 'b15_desvinculacion',
  // Ruta 11 y Paso del Norte
  r11Intro: 'b15_r11_llegada',
  pasoIntro: 'b15_paso_llegada',
  refugioHint: 'b15_refugio_pista', // la guarda del refugio explica la Senda
  genesisPaso: 'b15_genesis_paso', // los técnicos del mirador del Paso
  // Senda del Lazo (Ruta 12, tramo bajo)
  sendaIntro: 'b15_senda_llegada',
  sendaLoopSeen: 'b15_senda_lazo_visto', // primera vuelta al principio (Zygarde lo nota)
  sendaTop: 'b15_senda_mirador', // se llegó al mirador (pauta resuelta)
  sendaHigh: 'b15_senda_alto', // el tramo alto: un bucle que aún no se puede romper
  // Ruta 13 y Villa Boreal
  r13Intro: 'b15_r13_llegada',
  borealIntro: 'b15_boreal_llegada',
  // T13 · «La torre de hielo»
  rosendo: 'b15_t13_rosendo', // segunda pista
  nieves: 'b15_t13_nieves', // Nieves acepta ir al lago
  lakeSeen: 'b15_t13_lago_visto',
  ancientBlock: 'b15_t13_bloque', // el bloque antiguo sale del lago
  icePlate: 'b15_t13_tablilla', // Tabla Helada
  tower: 'b15_torre', // la Torre de Hielo vuelve a estar en pie (destino de Vuelo: flyPoint de Villa Boreal)
  froslassite: 'b15_froslassita',
  // Gael B5 y N5
  gaelMet: 'b15_gael_visto',
  gaelB5: 'b15_gael_b5', // combate hecho (gane o pierda)
  gaelWon: 'b15_gael_b5_ganado',
  n5: 'b15_n5', // SALIDA del bloque (content/story/journal.js); N5 unido (zyg_core_5)
  alerceRing: 'b15_alerce_aro', // «Ese aro no es de ninguna tienda.»
  // Gruta Escarcha y Mar Boreal
  escarchaIntro: 'b15_escarcha_llegada',
  cierzoSeen: 'b15_cierzo_visto',
});

/** Variables del bloque. */
export const V = Object.freeze({
  loops: 'b15_senda_vueltas', // vueltas al principio de la Senda del Lazo
  sendaStep: 'b15_senda_rellano', // rellanos superados en esta subida (0–4)
  lake: 'b15_lago', // pasadas por placa del Lago Viejo (cadena de dígitos 0–2)
  lakeBlocks: 'b15_lago_bloques', // máscara de bloques de hielo rotos
  lakeFalls: 'b15_lago_caidas',
});

/** ¿Sigue la desvinculación del norte? (la pone el B15; la revierte el B16). */
export function isNorthUnbound(s) {
  return Boolean(s) && s.flag(F.unbound) && !s.flag(F.p8);
}

export const SPEAKER = Object.freeze({
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  rosendo: 'Rosendo',
  nieves: 'Nieves',
  guarda: 'Guarda del refugio',
  directora: 'Directora del Observatorio',
  astronomo: 'Astrónomo',
  montanera: 'Montañera',
  marinero: 'Marinero',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  vecino: 'Vecino',
  vecina: 'Vecina',
  curioso: 'Curioso',
  curiosa: 'Curiosa',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  gael: spriteOr('gael', 'anil:guay'),
  rosendo: spriteOr('rosendo', 'anciano2'),
  nieves: 'chica2',
  guarda: 'veterana',
  directora: spriteOr('archivista', 'cientifica'),
  astronomo: 'cientifico',
  montanera: 'campistaa',
  marinero: 'marinero',
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  vecino: spriteOr('vecino', 'anil:veterano'),
  vecina: spriteOr('vecina', 'anil:dama'),
  anciana: 'anciana2',
  nino: spriteOr('nino', 'chaval1'),
  enfermera: spriteOr('enfermera', 'enfermera'),
  core: spriteOr('zygarde_core', 'anil:ZYGARDE'),
  frigibax: 'follower:FRIGIBAX:0:0',
  snover: 'follower:SNOVER:0:0',
  cubchoo: 'follower:CUBCHOO:0:0',
  swinub: 'follower:SWINUB:0:0',
  sneasel: 'follower:SNEASEL:0:0',
  larvitar: 'follower:LARVITAR:0:0',
  pupitar: 'follower:PUPITAR:0:0',
  absol: 'follower:ABSOL:0:0',
  iceObject: 'Object Ice',
});

/** Objetos con arte propio (tools/b15_assets.mjs) y de Añil. */
export const OBJ = Object.freeze({
  ice: ['asset:objects/b15_hielo_0.png', 'asset:objects/b15_hielo_1.png', 'asset:objects/b15_hielo_2.png'],
  rock: 'asset:objects/b15_hielo_roca.png',
  ancient: 'asset:objects/b15_bloque_antiguo.png', // fila 2 en el hielo · 4 liberado
  prints: 'asset:objects/b15_huellas.png', // 2 Larvitar ↑ · 4 Larvitar ← · 6 Larvitar → · 8 botas ↑
  tower: 'asset:objects/b15_torre_hielo.png', // fila 2 Torre en pie · 4 andamio
  telescope: 'asset:objects/b15_telescopio.png',
  sculptures: 'asset:objects/b15_esculturas.png',
  sled: 'asset:objects/b15_trineo.png',
  iceBlock: 'Object Ice', // bloques de hielo (filas 2–6) y su rotura (fila 8), Añil
  veins: 'asset:objects/barreras.png', // dir 8 = roca nevada agrietada
});

/** Música (nombres de Añil o del catálogo, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  north: 'PrismaRuta2',
  senda: 'Transicion',
  boreal: 'Emociones',
  rival: 'CombateRival',
  tension: 'Amenaza',
  genesis: 'EncuentroRocket',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Evolución final del inicial de Gael (CAMPANA §6.3). */
export const FINAL = Object.freeze({ LITTEN: 'INCINEROAR', SOBBLE: 'INTELEON', TURTWIG: 'TORTERRA' });
export function gaelFinalStarter(state) {
  const base = gaelStarterSpecies(state);
  return FINAL[base] || base;
}

/** Condición de página a partir de flags: all / none / test. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Noche de juego (GameState.isDay). */
export const isNight = (s) => Boolean(s) && typeof s.isDay === 'function' && !s.isDay();

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const t of list) {
    const text = typeof t === 'function' ? t(ctx.state) : t;
    await ctx.say(text, speaker ? { speaker, ...extra } : extra);
  }
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Texto según el género del jugador (state.player.gender 'F' → femenino). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Llamada de Alerce por la Pokédex (mismo formato que B03 y B07). */
export async function alerceCall(ctx, list) {
  ctx.me?.('Register phone');
  await ctx.say('¡La Pokédex está sonando!\nEs una llamada del Prof. Alerce.');
  ctx.se?.('GUI pokedex open');
  await lines(ctx, SPEAKER.alerce, list);
  ctx.se?.('GUI pokedex open');
}

/** ctx.effect sin romper el guion si el efecto no existe (tests). */
export function fx(ctx, name, opts) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[b15] efecto ${name}`, err);
    return null;
  }
}

/** Busca un evento del mapa actual por id (o null). */
export const eventById = (ctx, id) => ctx.world?.events?.find((e) => e.id === id) || null;

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

/** Primera llegada al norte: fija la desvinculación (estado del mundo). */
export function markNorthUnbound(ctx) {
  if (!ctx.flag(F.unbound) && !ctx.flag(F.p8)) ctx.setFlag(F.unbound);
}
