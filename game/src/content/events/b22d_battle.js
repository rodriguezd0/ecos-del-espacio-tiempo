// Combates contra los legendarios del Bloque 22d (CAMPANA B22, reglas comunes del postgame y §2.6): se usa el helper
// común `bossBattle` (sin pérdida de dinero ni vuelta al punto de cura; al perder, curado y a la casilla de reintento).
// Captura → flag de captura; debilitado → vuelve tras descansar (var `rest_count`); huida → sigue ahí.
// Módulo puro salvo los guiones (solo usa `ctx`).
import { bossBattle } from '../common/bossBattle.js';
import { LEGENDS, MUSIC, recordLegendOutcome } from './b22d_common.js';

/** Petición de `ctx.battle` para un legendario salvaje (spec: { species, level, moves, ability, nature, ivs, evs }). */
export function legendRequest(spec, { bgm = MUSIC.legend, battleback = null, rules = null, environment = null } = {}) {
  if (!spec?.species) throw new Error('b22d: legendario sin especie');
  const wild = { ...spec };
  if (spec.moves) wild.moves = [...spec.moves];
  if (spec.ivs) wild.ivs = { ...spec.ivs };
  if (spec.evs) wild.evs = { ...spec.evs };
  const req = { type: 'wild', wild, bgm };
  if (battleback) req.battleback = battleback;
  // El entorno del terreno manda sobre el fondo (el agua o la lava pondrían el fondo de agua): se fija aquí.
  if (environment) req.environment = environment;
  if (rules) req.rules = { ...rules };
  return req;
}

/**
 * Combate contra el legendario `key` (LEGENDS). → 'caught' | 'beaten' | 'run' | 'lose'.
 * opts: { retry: {x, y, dir, map?} | null, loseText, speaker, bgm, battleback, rules, beatenText }
 */
export async function legendBattle(ctx, key, spec, opts = {}) {
  const L = LEGENDS[key];
  if (!L) throw new Error(`b22d: legendario desconocido «${key}»`);
  const outcome = await bossBattle(ctx, legendRequest(spec, opts), opts.retry ?? null, {
    loseText: opts.loseText ?? 'Tu equipo ha recuperado fuerzas. Puedes volver a intentarlo.',
    speaker: opts.speaker ?? null,
  });
  const result = recordLegendOutcome(ctx.state, key, outcome);
  ctx.requestRefresh?.();
  if (result === 'beaten' && opts.beatenText !== null) {
    await ctx.say(opts.beatenText || 'Se ha retirado para recuperarse. Si descansas, quizá vuelva a su sitio.');
  }
  return result;
}

/** Petición de un prototipo de la Instalación Cierzo: combate sin captura (el motivo sale en pantalla). */
export function prototypeRequest(spec, reason) {
  return legendRequest(spec, {
    bgm: MUSIC.proto,
    battleback: 'Laboratorio',
    rules: { canCatch: false, catchReason: reason },
  });
}
