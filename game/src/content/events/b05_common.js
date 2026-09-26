// Constantes y utilidades del Bloque 5 (docs/CAMPANA.md «B05 — Interludio 2: el Molino del Diezmo, Ruta 4 y
// Villa Brontia»; TABLILLAS T02 y T03). Módulo puro: sin DOM ni engine (se importa desde los mapas, también en Node).
import { getCharacter } from '../characters.js';

/** Flags del bloque (prefijo b05_) y estados globales que consulta. */
export const F = Object.freeze({
  // Estados globales (los ponen otros bloques)
  p2: 'p2_restored', // B04: abre el vado de la Ruta 4
  p3: 'p3_restored', // B06: cesan los vendavales de la Ruta 6 y el Parque da luz a Brontia
  p4: 'p4_restored', // B08: vuelve el tren
  p7: 'p7_restored', // B14: retrocede el hielo-eco de la Ruta 11
  // Salida del bloque (CAMPANA B05)
  brontia: 'b05_brontia',
  // Ruta 4
  // Villa Brontia
  millDoor: 'b05_molino_puerta', // puerta atascada del molino abierta con Embestida (C027)
  // T02 «El Molino del Diezmo»
  t02Met: 'b05_t02_anselmo',
  gearSmall: 'b05_t02_engranaje_p',
  gearMedium: 'b05_t02_engranaje_m',
  gearLarge: 'b05_t02_engranaje_g',
  shaftOpen: 'b05_t02_eje_abierto', // la muela gira bien y el eje se abre
  techs: 'b05_t02_tecnicos', // técnicos del Consorcio vencidos
  t02Done: 'b05_t02_tablilla', // Tabla Linfa obtenida: el Diezmo muele de nuevo (cambio en el mundo)
  dario: 'b05_t02_dario', // Darío deja el Consorcio y avisa del Parque Eólico
  // T03 «La campana que llama al rayo»
  sixto: 'b05_t03_sixto',
  abril: 'b05_t03_abril', // segunda pista
  belfry: 'b05_t03_campanil', // el jugador ha visto la campana grande y el cable cortado
  operator: 'b05_t03_operaria',
  circuit: 'b05_t03_circuito', // cables reconectados
  strike: 'b05_t03_rayo', // el rayo ha cargado la subestación
  horde: 'b05_t03_elekid', // horda de Elekid vencida
  t03Done: 'b05_t03_tablilla', // Tabla Trueno obtenida
  light: 'b05_brontia_luz', // Brontia recupera la luz a medias (cambio en el mundo, antes de P3)
  raichuita: 'b05_t03_raichuita',
});

/** Variables del bloque. */
export const V = Object.freeze({
  honey: 'b05_miel_ruta4', // rest_count a partir del cual el árbol de miel tiene un Pokémon (0 = sin untar)
  rustle: 'b05_audino_ruta4', // rest_count del último Audino (la hierba vuelve a agitarse al descansar)
  restCount: 'rest_count',
  socket: (n) => `b05_t02_hueco_${n}`, // 0 vacío · 1 pequeño · 2 mediano · 3 grande
  sense: (n) => `b05_t02_sentido_${n}`, // 1 derechas · -1 izquierdas
});

/** Hablantes (nombres fijados en CAMPANA/TABLILLAS; el resto, genéricos). */
export const SPEAKER = Object.freeze({
  anselmo: 'Anselmo',
  dario: 'Darío',
  sixto: 'Sixto',
  abril: 'Abril',
  operator: 'Operaria',
  tech: 'Técnico',
  techF: 'Técnica',
  neighbor: 'Vecina',
  farmer: 'Agricultora',
  shepherd: 'Pastor',
});

/** Sprite registrado o, si aún no existe, el de reserva de Añil. */
export const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

export const SPRITE = Object.freeze({
  anselmo: spriteOr('anselmo', 'anil:anciano1'),
  dario: spriteOr('dario', 'anil:empresario'),
  sixto: spriteOr('sixto', 'anil:anciano2'),
  abril: spriteOr('abril', 'anil:chica2'),
  operator: 'anil:operaria',
  tech: spriteOr('genesis_tecnico', 'anil:cientifico'),
  techF: spriteOr('genesis_tecnica', 'anil:cientifica'),
  neighbor: spriteOr('vecina', 'anil:mujer1'),
  neighborM: spriteOr('vecino', 'anil:hombre1'),
  elder: spriteOr('anciano', 'anil:anciano1'),
  child: spriteOr('nino', 'anil:nino'),
  girl: spriteOr('nina', 'anil:nina'),
  farmer: 'anil:mujer2',
  shepherd: 'anil:campista',
  mill: 'asset:objects/b05_molino_viento.png',
  tower: 'asset:objects/b05_campanario.png',
  bolt: 'asset:objects/b05_rayo.png',
  gearsR: 'asset:objects/b05_engranajes_d.png',
  gearsL: 'asset:objects/b05_engranajes_i.png',
  millstone: 'asset:objects/b05_muela.png',
  wheel: 'asset:objects/b05_rueda.png', // filas: 2 rueda a derechas · 4 rueda al revés · 6 corona a derechas · 8 corona al revés
  board: 'asset:objects/b05_cuadro.png',
  barrier: 'asset:objects/barreras.png',
});

/** when() a partir de flags: all(['a']), none(['b']) y una prueba extra. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

export const say = (ctx, speaker, text) => ctx.say(text, { speaker });
/** Zygarde habla por telepatía (voz sobria, CAMPANA §3.2). */
export const core = (ctx, text) => ctx.say(text, { telepathy: true });

/** El compañero de Zygarde (si acompaña y está visible) se gira hacia el jugador y reacciona. */
export async function zygardeEmote(ctx, kind = '!') {
  const c = ctx.world?.core;
  if (!c?.visible) return;
  c.turnToward?.(ctx.player);
  await ctx.emote(c, kind);
}

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** ¿Es de noche en el reloj de juego (20:00–5:59, render/dayNight.js)? */
export function isNight(state) {
  const h = state?.hour ?? 12;
  return h < 6 || h >= 20;
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

/** Objeto interactivo invisible (texto al pulsar A delante); `solid` para muebles. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); },
  };
}

/** Bloqueos invisibles (huella de un sprite grande: torre, molino…). */
export function blockers(prefix, list) {
  return list.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, solid: true, noOver: true }));
}

/** Rectángulo como lista de celdas. */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
