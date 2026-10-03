// Encuentros legendarios del Bloque 22a (docs/CAMPANA.md B22, tabla de legendarios): Giratina (Forma Origen, nv 75,
// captura desde el turno 3), el no elegido del P9 (nv 75), Arceus si no se capturó (solo fase Normal, nv 75, captura
// por debajo del 50 %) y el trío del Alma (nv 70). Peticiones de combate PURAS (las prueban los tests) y el guion común
// de encuentro: combate sin pérdida (helper común bossBattle, docs/BALANCE.md), captura → flag; debilitado → reaparece
// tras descansar (rest_count); derrota → curado y se le vuelve a hablar. Un intento de captura bloqueado no gasta la
// Ball ni el turno (motor: rules.catchCondition). Los movimientos (CAMPANA no los fija para el postgame) son
// DECIDIDO-DEV: los del combate de B16 para Azelf, los característicos de cada uno para el resto.
import { bossBattle } from '../common/bossBattle.js';
import { createArceus, FINAL_PHASE } from './b21_arceus_logic.js';
import { LEGENDS, MUSIC, BATTLEBACK, restCount } from './b22a_common.js';
import { DIST_TEXT, COLUMNA_TEXT } from './b22a_texts.js';

export const LEGEND_SPECS = Object.freeze({
  giratina: Object.freeze({ species: 'GIRATINA', level: 75, form: 1, moves: Object.freeze(['SHADOWFORCE', 'DRAGONCLAW', 'EARTHPOWER', 'AURASPHERE']) }),
  DIALGA: Object.freeze({ species: 'DIALGA', level: 75, moves: Object.freeze(['ROAROFTIME', 'FLASHCANNON', 'DRAGONPULSE', 'EARTHPOWER']) }),
  PALKIA: Object.freeze({ species: 'PALKIA', level: 75, moves: Object.freeze(['SPACIALREND', 'HYDROPUMP', 'DRAGONPULSE', 'EARTHPOWER']) }),
  uxie: Object.freeze({ species: 'UXIE', level: 70, moves: Object.freeze(['PSYCHIC', 'FUTURESIGHT', 'AMNESIA', 'YAWN']) }),
  mesprit: Object.freeze({ species: 'MESPRIT', level: 70, moves: Object.freeze(['PSYCHIC', 'FUTURESIGHT', 'COPYCAT', 'FLATTER']) }),
  azelf: Object.freeze({ species: 'AZELF', level: 70, moves: Object.freeze(['ANCIENTPOWER', 'PSYCHIC', 'NASTYPLOT', 'FLAMETHROWER']) }),
});

/** El elegido del P9 y el que no se eligió (var p9_choice de B18). */
export const OTHER = Object.freeze({ DIALGA: 'PALKIA', PALKIA: 'DIALGA' });
export const NAMES = Object.freeze({ DIALGA: 'Dialga', PALKIA: 'Palkia', GIRATINA: 'Giratina', ARCEUS: 'Arceus', UXIE: 'Uxie', MESPRIT: 'Mesprit', AZELF: 'Azelf' });
/** Orbe que dejó el no elegido (B18): Dialga elegido → Lustresfera (de Palkia); Palkia elegido → Diamansfera. */
export const ORB_OF_UNCHOSEN = Object.freeze({ DIALGA: 'LUSTROUSORB', PALKIA: 'ADAMANTORB' });
export const ORB_NAMES = Object.freeze({ LUSTROUSORB: 'Lustresfera', ADAMANTORB: 'Diamansfera' });

/** Giratina se deja atrapar desde el tercer turno (turnCount del motor: 0 en el primero). */
export const GIRATINA_CATCH_TURN = 2;

const wildOf = (spec) => ({ ...spec, moves: [...spec.moves] });

/** rules.catchCondition de Giratina: «captura desde el turno 3». Pura. */
export function giratinaCatchCondition(battle) {
  const turn = Number(battle?.turnCount) || 0;
  return turn >= GIRATINA_CATCH_TURN ? { allowed: true, reason: null } : { allowed: false, reason: DIST_TEXT.giratinaCatchReason };
}

/** rules.catchCondition de Arceus en el postgame: por debajo del 50 % de sus PS. Pura. */
export function arceusCatchCondition(battle) {
  const foe = (battle?.battlers || []).find((b, i) => i % 2 === 1 && b && !b.isFainted?.()) || battle?.battlers?.[1] || null;
  if (foe && foe.totalhp > 0 && foe.hp * 2 < foe.totalhp) return { allowed: true, reason: null };
  return { allowed: false, reason: COLUMNA_TEXT.arceusCatchReason };
}

/** Giratina en el corazón del Mundo Distorsión. */
export function giratinaRequest() {
  return {
    type: 'wild', wild: wildOf(LEGEND_SPECS.giratina), bgm: MUSIC.legendary, battleback: BATTLEBACK.distortion,
    rules: { catchCondition: giratinaCatchCondition },
  };
}

/** El no elegido del P9 en su plataforma de Columna Lanza (choice = el elegido). */
export function unchosenRequest(choice) {
  const other = OTHER[choice];
  if (!other) throw new Error(`unchosenRequest: elección inválida "${choice}" (DIALGA | PALKIA)`);
  return { type: 'wild', wild: wildOf(LEGEND_SPECS[other]), bgm: MUSIC.legendary, battleback: BATTLEBACK.columna };
}

/** Uxie, Mesprit o Azelf (clave del trío). Azelf: con objetos (sin el sello de B16). */
export function trioRequest(key) {
  const spec = LEGEND_SPECS[key];
  if (!spec || !['uxie', 'mesprit', 'azelf'].includes(key)) throw new Error(`trioRequest: clave desconocida "${key}"`);
  return { type: 'wild', wild: wildOf(spec), bgm: MUSIC.legendary, battleback: BATTLEBACK.alma };
}

/** Arceus en la cima: solo la fase Normal (forma propia, sin Tabla, Recuperación una vez), nv 75. */
export function arceusRematchRequest(db) {
  return {
    type: 'wild', wild: createArceus(db, FINAL_PHASE), bgm: MUSIC.arceus, battleback: BATTLEBACK.arceus, transition: 'zoomIn',
    rules: { catchCondition: arceusCatchCondition },
  };
}

/**
 * Guion común de encuentro: combate sin pérdida y resultado. → 'caught' | 'win' | 'run' | 'lose'.
 * opts: { name, retry (casilla o null: se queda), loseText, caughtText, faintedText, onCaught(ctx), onFainted(ctx) }.
 */
export async function legendBattle(ctx, key, request, opts = {}) {
  const L = LEGENDS[key];
  if (!L) throw new Error(`legendBattle: legendario desconocido "${key}"`);
  const name = opts.name || L.name;
  const outcome = await bossBattle(ctx, request, opts.retry ?? null, { loseText: opts.loseText ?? null });
  if (outcome === 'caught') {
    ctx.setFlag(L.caught);
    ctx.setVar(L.rest, -1);
    ctx.requestRefresh?.();
    if (opts.caughtText !== null) await ctx.say(opts.caughtText ?? `${name} se queda contigo.`);
    if (typeof opts.onCaught === 'function') await opts.onCaught(ctx);
  } else if (outcome === 'win') {
    ctx.setVar(L.rest, restCount(ctx.state));
    ctx.requestRefresh?.();
    if (opts.faintedText !== null) await ctx.say(opts.faintedText ?? `${name} se retira. Cuando descanses, volverá.`);
    if (typeof opts.onFainted === 'function') await opts.onFainted(ctx);
  }
  return outcome;
}
