// Constantes y utilidades del Bloque 6 — Pilar del Impulso (docs/CAMPANA.md B06). Módulo puro (se importa en
// Node desde las definiciones de mapa): flags, variables, hablantes, sprites y ayudas de guion comunes.
import { getCharacter } from '../characters.js';
import { gaelStarterSpecies } from '../trainers/b01_town.js';
import { expandEventDef } from '../../world/eventTypes.js';

/** Flags de la historia del bloque (en orden) y auxiliares. Globales sin prefijo: p3_restored, zyg_core_2. */
export const F = Object.freeze({
  mesetaIntro: 'b06_meseta_intro', // llegada a la Meseta: el Parque parado
  gaelMet: 'b06_gael_parque', // Gael espera en la puerta del Parque
  double: 'b06_doble_ganado', // combate doble con Gael de aliado
  casiaMet: 'b06_casia_presentada', // «Somos Genesis»
  casia: 'b06_casia_vencida',
  colector: 'b06_colector_roto', // N2 + 4 células + Terreno complicado
  gaelScreens: 'b06_gael_pantallas', // Gael se queda mirando los datos…
  gaelLeft: 'b06_gael_se_fue', // …y se va (al salir el jugador del Parque)
  abrilMet: 'b06_abril_conocida',
  abrilChallenged: 'b06_abril_retada', // ya dijo «Termina rápido…» (el reintento no repite la escena)
  abril: 'b06_abril_vencida', // abre las galerías
  bells: 'b06_campanas', // secuencia correcta: el vendaval del sur se calma
  abrilSala: 'b06_abril_sala', // Abril sube a la Sala al oír las campanas
  restored: 'p3_restored', // global (content/story/fragments.js)
  abrilAfter: 'b06_abril_despedida', // «Vale. Esto no es aburrido.»
  // auxiliares
  wooloo1: 'b06_wooloo_1',
  wooloo2: 'b06_wooloo_2',
  woolooReward: 'b06_wooloo_premio',
  galeriasSeen: 'b06_galerias_vistas',
  salaSeen: 'b06_sala_vista',
  parqueLight: 'b06_parque_luz',
  t03Abril: 'b06_t03_abril',
});

/** Variables del bloque. */
export const V = Object.freeze({
  bellStep: 'b06_campana_paso', // campanas acertadas (0–3)
  cyclizarRest: 'b06_cyclizar_descanso', // rest_count cuando se venció a Cyclizar (reaparece al descansar)
});

export const SPEAKER = Object.freeze({
  gael: 'Gael',
  casia: 'Casia',
  abril: 'Abril',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  pastor: 'Pastor',
  operaria: 'Operaria',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  gael: spriteOr('gael', 'anil:guay'),
  casia: spriteOr('casia', 'anil:cientifica'),
  abril: spriteOr('abril', 'anil:estudianta'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  investigador: spriteOr('genesis_investigador', 'anil:cientifico'),
  wooloo: 'follower:WOOLOO:0:0',
  cyclizar: 'follower:CYCLIZAR:0:0',
  drifloon: 'follower:DRIFLOON:0:0',
});

/** Objetos del bloque (arte propio de tools/b06_assets.mjs). */
export const OBJ = Object.freeze({
  colector: 'asset:objects/colector.png',
  turbine: 'asset:objects/aerogenerador.png',
  bell: 'asset:objects/campana_viento.png',
  fire: 'asset:objects/hoguera.png',
  log: 'asset:objects/barreras.png',
  /** Molino de viento de la meseta (arte del Bloque 5, tools/b05_assets.mjs; solo se lee). */
  mill: 'asset:objects/b05_molino_viento.png',
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  wind: 'viento',
  genesis: 'GuaridaRocket',
  commander: 'CombateComandante',
  grunt: 'EncuentroRocket',
  guardian: 'CombateLider',
  rival: 'CombateRival',
  tension: 'Amenaza',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Inicial evolucionado de Gael (su inicial con ventaja, CAMPANA §6.3: «inicial evolucionado 25»). */
export const EVOLVED = Object.freeze({ LITTEN: 'TORRACAT', SOBBLE: 'DRIZZILE', TURTWIG: 'GROTLE' });
export function gaelEvolvedStarter(state) {
  const base = gaelStarterSpecies(state);
  return EVOLVED[base] || base;
}

/** Equipo de Gael como aliado en el combate doble (CAMPANA §6.3: Staravia 24, inicial evolucionado 25). */
export function gaelAllyParty(state) {
  return [{ species: 'STARAVIA', level: 24 }, { species: gaelEvolvedStarter(state), level: 25 }];
}

/**
 * Combate de guion que se puede perder sin pérdida (CAMPANA §2.6): `scriptedBattle(ctx, request, retry)` → 'win' |
 * 'lose'. Vive en el helper común `content/common/bossBattle.js` (docs/ARCHITECTURE.md §6, «Combates de guion»); se
 * reexporta aquí por
 * compatibilidad con los guiones y tests del bloque.
 */
export { scriptedBattle } from '../common/bossBattle.js';

/** Condición de página a partir de flags: all / none. */
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
 * Entrenador (tipo `trainer` de world/eventTypes.js) que desaparece cuando se cumple `hideWhen(state)` (p. ej.
 * los técnicos de Genesis tras romper el Colector). Se expande aquí para poder añadir la página final vacía.
 */
export function trainerUntil(def, hideWhen) {
  const { type: _t, ...expanded } = expandEventDef({ ...def, type: 'trainer' });
  return { ...expanded, pages: [...expanded.pages, { when: (s) => Boolean(s) && hideWhen(s), sprite: '', through: true }] };
}

/**
 * Entrenador (tipo `trainer`) con otra frase de después del combate cuando se cumple `laterWhen(state)` (p. ej. tras
 * el P3, cuando el Parque vuelve a girar). Añade una tercera página a las dos del tipo.
 */
export function trainerLater(def, laterWhen, laterText) {
  const { type: _t, ...expanded } = expandEventDef({ ...def, type: 'trainer' });
  const [battlePage, afterPage] = expanded.pages;
  const later = {
    ...afterPage,
    when: (s, ev) => Boolean(s) && afterPage.when(s, ev) && laterWhen(s),
    script: async (ctx) => { await ctx.say(laterText, { speaker: def.name }); },
  };
  return { ...expanded, pages: [battlePage, afterPage, later] };
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());
