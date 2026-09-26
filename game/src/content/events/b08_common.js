// Constantes y utilidades del Bloque 8 — Pilar de la Masa (docs/CAMPANA.md B08; TABLILLAS T05). Módulo puro: sin DOM
// ni engine (se importa desde las definiciones de mapa, también en Node).
import { getCharacter } from '../characters.js';

/** Flags del bloque (prefijo b08_) y estados globales que lee o pone. */
export const F = Object.freeze({
  // Globales
  p3: 'p3_restored', // B06: entrada (cesan los vendavales de la Ruta 6)
  restored: 'p4_restored', // salida del bloque: se detiene el hundimiento, Paso del Derrumbe, tren, galería honda
  verse: 'verse_4',
  megaring: 'b07_megaring', // salida de B07 (no se exige: Estrato se alcanza por la Ruta 6)
  // Llegada y problema humano
  arrival: 'b08_llegada', // primer temblor en Estrato
  argument: 'b08_discusion', // Fermín y Sol discuten ante la mina; Fermín baja
  // Mina Galena
  mineSeen: 'b08_mina_vista',
  techs: 'b08_mina_tecnicos', // los dos técnicos del pozo lateral, vencidos
  garridoMet: 'b08_garrido_visto',
  garrido: 'b08_garrido', // Garrido vencido: el pozo no llega a nada
  ferminCerro: 'b08_fermin_cerro', // Fermín espera en la puerta de los Galena del Cerro Plomo
  // Cerro Plomo y Cámara de los Contrapesos
  cerroSeen: 'b08_cerro_visto',
  gateOpen: 'b08_cerro_abierto', // Fermín abre la verja de la familia
  chamberSeen: 'b08_camara_vista',
  creakHint: 'b08_cruje', // primer aviso del suelo quebradizo
  fallSeen: 'b08_caida', // primera caída a la galería inferior
  plateHint: 'b08_placa_pista',
  balance: 'b08_balanza', // la Gran Balanza cede: baja la losa del núcleo
  ferminChallenged: 'b08_fermin_reto',
  fermin: 'b08_fermin', // Fermín vencido
  ferminLeft: 'b08_fermin_despedida', // tras el núcleo, Fermín vuelve a Estrato
  // Estrato tras el P4
  coop: 'b08_cooperativa', // la opción de compra caduca; cooperativa minera
  fossils: 'b08_fosiles',
  t05Hint: 'b08_t05_losa', // segunda pista de T05 (Fermín: la Losa del Pulso)
  // T05 «El Pulso de Estrato»
  herminia: 'b08_t05_herminia',
  tournamentOpen: 'b08_t05_torneo_abierto',
  tournament: 'b08_t05_torneo', // torneo ganado (final contra Sol)
  defenseStarted: 'b08_t05_defensa_empezada', // la escena nocturna ya se ha visto (el reintento es con Sol)
  defended: 'b08_t05_defensa', // combate doble con Sol contra los técnicos, de noche
  tablet: 'b08_t05_tablilla', // Tabla Fuerte (FISTPLATE)
  medichamite: 'b08_t05_medichamita',
  // Otros
  cellHintGalena: 'b08_pista_celula',
  honda: 'b08_honda_vista',
});

/** Variables del bloque. */
export const V = Object.freeze({
  puzzle: 'b08_camara', // estado de la Cámara (content/events/b08_balance_logic.js)
  round: 'b08_t05_ronda', // rondas del torneo ganadas (0–3; la 4.ª es la final)
  rematch: 'b08_t05_revancha', // rest_count de la última revancha
  restCount: 'rest_count',
});

export const SPEAKER = Object.freeze({
  fermin: 'Fermín',
  sol: 'Sol',
  garrido: 'Garrido',
  rep: 'Representante del Consorcio',
  herminia: 'Maestra Herminia',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  minero: 'Minero',
  minera: 'Minera',
  vecina: 'Vecina',
  vecino: 'Vecino',
  nino: 'Niño',
  alumna: 'Alumna',
  revisor: 'Revisor',
  mercader: 'Mercader',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

export const SPRITE = Object.freeze({
  fermin: spriteOr('fermin', 'anil:minero'),
  sol: spriteOr('sol', 'anil:minera'),
  garrido: spriteOr('garrido', 'anil:cientifico'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  rep: spriteOr('genesis_investigadora', 'anil:cientifica'),
  minero: 'anil:minero',
  minera: 'anil:minera',
  herminia: 'anil:anciana1',
  vecina: spriteOr('vecina', 'anil:mujer1'),
  vecino: spriteOr('vecino', 'anil:hombre1'),
  anciano: spriteOr('anciano', 'anil:anciano1'),
  nino: spriteOr('nino', 'anil:nino'),
  nina: spriteOr('nina', 'anil:nina'),
  estudiante: 'anil:estudiante',
  revisor: 'anil:marinero',
  mercader: 'anil:empresario',
});

/** Arte propio del bloque (tools/b08_assets.mjs). Hojas 4×4: fila = dirección RMXP 2/4/6/8. */
export const OBJ = Object.freeze({
  block: 'asset:objects/b08_bloque.png',
  stone: 'asset:objects/b08_piedra.png',
  plate: 'asset:objects/b08_placa.png',
  floor: 'asset:objects/b08_suelo.png',
  sand: 'asset:objects/b08_arena.png',
  pan: 'asset:objects/b08_platillo.png',
  beam: 'asset:objects/b08_balanza.png',
  pivot: 'asset:objects/b08_eje.png',
  weight: 'asset:objects/b08_contrapeso.png',
  slab: 'asset:objects/b08_losa.png',
  lever: 'asset:objects/b08_palanca.png',
  drill: 'asset:objects/b08_perforadora.png',
  cart: 'asset:objects/b08_vagoneta.png',
  pebble: 'asset:objects/b08_flotante.png',
  crack: 'asset:objects/b08_grieta.png',
  losaPulso: 'asset:objects/b08_losa_pulso.png',
  gate: 'asset:objects/b08_verja.png',
  rail: 'asset:objects/b08_via.png',
  fossil: 'asset:objects/b08_fosiles.png',
  entibo: 'asset:objects/b08_entibo.png',
  barrier: 'asset:objects/barreras.png',
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  town: 'CiudadVerde',
  guardian: 'CombateLider',
  commander: 'CombateComandante',
  grunt: 'EncuentroRocket',
  tension: 'Amenaza',
  cave: 'Cueva',
  dunes: 'IslaCanela',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Condición de página a partir de flags: all / none (+ prueba extra). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Varias líneas seguidas con el mismo hablante (texto o función del estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const t of list) {
    const text = typeof t === 'function' ? t(ctx.state) : t;
    await ctx.say(text, speaker ? { speaker, ...extra } : extra);
  }
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

/** ¿Es de noche en el reloj de juego (20:00–5:59)? */
export function isNight(state) {
  const h = state?.hour ?? 12;
  return h < 6 || h >= 20;
}

/** Objeto interactivo invisible (texto al pulsar A delante); `solid` para muebles. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => {
      const list = [].concat(typeof text === 'function' ? text(ctx.state) : text);
      for (const t of list) await ctx.say(t);
    },
  };
}

/** Bloqueos invisibles (huella de un sprite grande). */
export function blockers(prefix, list) {
  return list.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, solid: true, noOver: true }));
}

/** Rectángulo como lista de celdas. */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
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

/** Busca un evento del mapa actual por id (o null). */
export const findEvent = (ctx, id) => ctx.world.events.find((e) => e.id === id && !e.erased) || null;

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());
