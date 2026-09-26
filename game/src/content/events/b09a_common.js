// Constantes y utilidades del Bloque 9a — Interludio 4A: Ruta 7, Ciudad Lúmina (Museo de las Eras, gala, Gael B3)
// y Ruta 14 / Reserva del Delta (docs/CAMPANA.md B09 parte A; TABLILLAS T06 y T07). Módulo PURO (sin DOM ni motor):
// lo importan los mapas también desde Node. La parte B (Marisma, Nexo, Ruta 15, Caleta) es de otro bloque (B09b).
import { getCharacter } from '../characters.js';
import { scriptedBattle as scriptedBattleB06 } from './b06_common.js';

/** Flags del bloque (prefijo b09_) y estados globales que consulta. */
export const F = Object.freeze({
  // Globales
  p4: 'p4_restored', // B08: los mineros despejan el Paso del Derrumbe y vuelve el tren
  p5: 'p5_restored',
  // Salida del bloque (CAMPANA B09, compartida con B09b)
  gala: 'b09_gala',
  gaelB3: 'b09_gael_b3',
  // Ruta 7
  r7Arrival: 'b09_r7_llegada', // primera entrada a la Ruta 7 (ya sin línea del Core)
  // Gala (Hotel Mirador)
  galaInvite: 'b09_gala_invitacion', // el botones ha llevado al jugador al hotel
  gaelB3Won: 'b09_gael_b3_ganado',
  // T06 — Museo de las Eras
  t06Night: 'b09_t06_noche', // Rosalía, de noche: segunda pista (réplicas)
  t06Solved: 'b09_t06_original', // la losa original identificada
  t06Chase: 'b09_t06_persecucion', // los restauradores huyen al muelle
  t06Won: 'b09_t06_restauradores', // combate del muelle ganado; la furgoneta se va vacía
  t06Done: 'b09_t06_tablilla', // Tabla Acero entregada (cambio en el mundo: sala reabierta, fósiles, Crónicas)
  eevee: 'b09_eevee',
  laguna: 'b09_ficha_laguna', // ficha de la Expedición a la Laguna Clara leída
  t08: 'b09_t08_pista', // Rosalía abre T08 (inventario de 1962)
  audinita: 'b09_audinita',
  ovalStone: 'b09_piedra_oval',
  milcery: 'b09_milcery',
  rotom: 'b09_rotom',
  skull: 'b09_fosil_craneo',
  armor: 'b09_fosil_coraza',
  // T07 — Reserva del Delta
  ivan: 'b09_ivan', // Iván ha abierto la pista en el Centro de Lúmina
  gatePass: 'b09_reserva_paso', // el guarda deja entrar en la Reserva
  hiveSeen: 'b09_t07_colmena', // segunda pista: la losa que zumba
  flower1: 'b09_t07_flor_pradera',
  flower2: 'b09_t07_flor_ribera',
  flower3: 'b09_t07_flor_huerto',
  flowersSet: 'b09_t07_flores', // las tres flores ante la colmena
  alpha: 'b09_t07_alfa', // Vespiquen Alfa vencido o capturado
  alphaCaught: 'b09_vespiquen_capturado',
  t07Done: 'b09_t07_tablilla', // Tabla Bicho: la colmena se traslada
  scolipite: 'b09_scolipedita',
  reserveOpen: 'b09_reserva_abierta', // la Reserva reabre con todos sus encuentros
  applinCaught: 'b09_applin_capturado',
});

/** Variables del bloque. */
export const V = Object.freeze({
  restCount: 'rest_count',
  t06Clues: 'b09_t06_pistas', // bits: 1 ficha del peso · 2 foto · 4 calco · 8 frío · 16 báscula
  t06Try: 'b09_t06_intento', // intentos fallidos (reordena los palés)
  t06Pallet: 'b09_t06_pale', // posición del palé de la original cuando se la llevan
  bees: 'b09_t07_obreras', // bits: obreras que ya han volado a su flor
  vespiquenRest: 'b09_vespiquen_descanso', // rest_count cuando se venció al Alfa (reaparece al descansar)
  applinRest: 'b09_applin_descanso',
  honey: 'b09_miel_reserva',
  rustle: 'b09_audino_ruta7',
  fossil: 'b09_fosil_pendiente', // fósil entregado al museo: 'SKULLFOSSIL' | 'ARMORFOSSIL' | 0
});

/** Bits de las cuatro pistas de la Sala de Réplicas (TABLILLAS §4.6; la del peso son dos: ficha y báscula). */
export const CLUE_BIT = Object.freeze({ weight: 1, photo: 2, glyphs: 4, cold: 8, scale: 16 });

export const SPEAKER = Object.freeze({
  gael: 'Gael',
  vertice: 'Dr. Vértice',
  rosalia: 'Rosalía',
  ivan: 'Iván',
  bellboy: 'Botones',
  receptionist: 'Recepcionista',
  host: 'Presentadora',
  restorer: 'Restaurador',
  restorerF: 'Restauradora',
  guard: 'Guarda',
  miner: 'Minero',
  minerF: 'Minera',
  scientist: 'Paleontólogo',
  keeper: 'Criador',
  keeperF: 'Criadora',
  baker: 'Pastelero',
  dealer: 'Chamarilero',
});

/** Sprite registrado o, si aún no existe, el de reserva de Añil. */
export const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

export const SPRITE = Object.freeze({
  gael: spriteOr('gael', 'anil:guay'),
  vertice: spriteOr('vertice', 'anil:presidente'),
  rosalia: spriteOr('rosalia', 'anil:empresariaa'),
  ivan: 'anil:montanero',
  guard: 'anil:campistaa',
  bellboy: 'anil:Repartidor',
  receptionist: 'anil:secretaria',
  host: 'anil:modelo',
  restorer: spriteOr('genesis_investigador', 'anil:cientifico'),
  restorerF: spriteOr('genesis_investigadora', 'anil:cientifica'),
  miner: 'anil:minero',
  minerF: 'anil:minera',
  scientist: 'anil:cientifico',
  keeper: 'anil:criador',
  keeperF: 'anil:criadora',
  baker: 'anil:cocinero',
  dealer: 'anil:anciano1',
  clerk: spriteOr('dependiente', 'tendero'),
  museumDesk: 'anil:asistenta',
  guests: ['anil:noble', 'anil:nobla', 'anil:ricachon', 'anil:ricachona', 'anil:kimono', 'anil:empresario'],
  neighbor: spriteOr('vecina', 'anil:mujer1'),
  neighborM: spriteOr('vecino', 'anil:hombre1'),
  child: spriteOr('nino', 'anil:nino'),
  girl: spriteOr('nina', 'anil:nina'),
  elder: spriteOr('anciano', 'anil:anciano2'),
  eevee: 'follower:EEVEE:0:0',
  rotom: 'follower:ROTOM:0:0',
  milcery: 'follower:MILCERY:0:0',
  vespiquen: 'follower:VESPIQUEN:0:0',
  combee: 'follower:COMBEE:0:0',
  cutiefly: 'follower:CUTIEFLY:0:0',
  ribombee: 'follower:RIBOMBEE:0:0',
  applin: 'follower:APPLIN:0:0',
  // Arte propio del bloque (tools/b09a_assets.mjs, PROVISIONAL D30)
  rails: 'asset:objects/b09_via.png',
  railEnd: 'asset:objects/b09_topera.png',
  slab: 'asset:objects/b09_losas.png',
  hive: 'asset:objects/b09_colmena.png',
  van: 'asset:objects/b09_furgoneta.png',
  rubble: 'asset:objects/b09_derrumbe.png',
  flowers: 'asset:objects/b09_flores.png',
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  lumina: 'CiudadAzulona',
  route7: 'Ruta 3',
  reserve: 'ZonaSafari',
  rival: 'CombateRival',
  grunt: 'EncuentroRocket',
  boss: 'PrismaBoss',
  tension: 'Amenaza',
  gala: 'Emociones',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** when() a partir de flags: all(['a']), none(['b']) y una prueba extra. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

export const say = (ctx, speaker, text) => ctx.say(text, speaker ? { speaker } : {});

/** Varias líneas seguidas del mismo hablante. */
export async function lines(ctx, speaker, list) {
  for (const text of list) await say(ctx, speaker, text);
}

/** Zygarde (telepatía sobria, CAMPANA §3.2), solo si acompaña al jugador. Zygarde habla muy poco (autor, 25-09-2026). */
export async function core(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** ¿Es de noche en el reloj de juego (20:00–5:59, como render/dayNight.js)? */
export function isNight(state) {
  const h = state?.hour ?? 12;
  return h < 6 || h >= 20;
}

const restCount = (s) => Number(s?.var?.(V.restCount, 0)) || 0;
export { restCount };

/**
 * Combate de guion que se puede perder sin pérdida (CAMPANA §2.6, BALANCE): el helper común del Bloque 6
 * (`canLose` + `noMoneyLoss`; al perder cura y devuelve a `retry` sin tocar el punto de cura). → 'win' | 'lose'
 */
export function scriptedBattle(ctx, request, retry) {
  return scriptedBattleB06(ctx, request, retry);
}

/** Objeto interactivo invisible (texto al pulsar A delante); `solid` para muebles. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => {
      const t = typeof text === 'function' ? text(ctx.state) : text;
      for (const line of Array.isArray(t) ? t : [t]) await ctx.say(line);
    },
  };
}

/** Bloqueos invisibles (huella de un sprite grande). */
export function blockers(prefix, cells) {
  return cells.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, solid: true, noOver: true }));
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

/** Evento de un NPC que habla (líneas fijas o función del estado). */
export function npc(id, x, y, sprite, speaker, text, extra = {}) {
  return {
    id, x, y, sprite, dir: extra.dir ?? 2, move: extra.move ?? 'look', trigger: 'action', name: speaker || undefined, ...extra,
    script: async (ctx) => {
      const t = typeof text === 'function' ? text(ctx.state) : text;
      for (const line of Array.isArray(t) ? t : [t]) await say(ctx, speaker, line);
    },
  };
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());
