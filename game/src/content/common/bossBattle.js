// Combates de guion que se pueden perder sin pérdida (CAMPANA §2.6; docs/BALANCE.md «Combates de guion»): Guardianes,
// jefes, Genesis y Gael. Módulo PURO (solo usa `ctx`; se importa en Node desde definiciones de mapa y tests).
//
// Al perder (o si el combate falla):
//   - sin «¡Estás fuera de combate!» ni vuelta al punto de cura (`canLose`: el motor solo dice «¡No te quedan
//     Pokémon!» y «¡Has perdido contra …!») y sin pagar dinero (`rules.noMoneyLoss`);
//   - el equipo se cura y el jugador vuelve a la casilla de reintento (o se queda donde está, con un fundido);
//   - el punto de cura del jugador (`state.healPoint`) NO se toca.

/** Reglas que se fuerzan en todo combate de guion. */
export const BOSS_RULES = Object.freeze({ canLose: true, noMoneyLoss: true });

/** Resultados que cuentan como superado (se devuelven tal cual). */
const PASSED = new Set(['win', 'caught']);

/**
 * Petición de `ctx.battle` con las reglas de guion (`canLose` arriba y en `rules`, `noMoneyLoss`). No modifica la
 * entrada; el resto de campos (trainer, format, ally, bgm…) pasa igual.
 */
export function bossBattleRequest(request = {}) {
  return { ...request, canLose: true, rules: { ...(request.rules || {}), ...BOSS_RULES } };
}

const toLines = (text) => (text == null ? [] : [].concat(text).filter((t) => typeof t === 'string' && t.length));

/**
 * Tras perder: cura el equipo, ejecuta `onLose` (estado del reintento) y lleva al jugador a `retry`. Sin `retry`, el
 * jugador se queda en su casilla (fundido a negro mientras se cura, si `ctx.fade` existe). Después dice `loseText`.
 * @param {object} ctx
 * @param {{ x: number, y: number, dir?: number, map?: string } | null} retry
 * @param {{ loseText?: string|string[], speaker?: string, onLose?: (ctx) => any, warp?: object, fade?: number }} opts
 */
export async function recoverAfterLoss(ctx, retry = null, opts = {}) {
  const { loseText = null, speaker = null, onLose = null, warp = null, fade = 16 } = opts;
  const mapId = retry?.map || ctx.map?.id;
  const stays = !retry || !mapId;
  const fades = stays && fade > 0 && typeof ctx.fade === 'function';
  if (fades) await ctx.fade('out', fade);
  ctx.heal();
  if (typeof onLose === 'function') await onLose(ctx);
  if (!stays) {
    const args = [mapId, retry.x, retry.y, retry.dir ?? 8];
    if (warp) args.push(warp);
    await ctx.warp(...args);
  } else {
    ctx.scene?.refreshFollower?.(); // el seguidor vuelve con el equipo curado (el warp ya lo hace al entrar)
  }
  if (fades) await ctx.fade('in', fade);
  for (const text of toLines(loseText)) await ctx.say(text, speaker ? { speaker } : {});
}

/**
 * Combate de guion sin pérdida. → 'win' | 'caught' (superado) | 'run' (huida de un salvaje: nada que recuperar) |
 * 'lose' (derrota o combate fallido: ya curado y en la casilla de reintento).
 * @param {object} ctx      contexto de guion (docs/ARCHITECTURE.md §6)
 * @param {object} request  petición de `ctx.battle` ({ trainer: id }, { type: 'trainer', trainers, ally }…)
 * @param {{ x: number, y: number, dir?: number, map?: string } | null} retry  casilla de reintento (mapa actual por
 *   defecto; `dir` 8 por defecto). null = el jugador se queda donde está (p. ej. «se le vuelve a hablar»).
 * @param {object} [opts]   { loseText, speaker, onLose(ctx), warp (opciones de ctx.warp), fade (fotogramas sin retry) }
 */
export async function bossBattle(ctx, request, retry = null, opts = {}) {
  let outcome;
  try {
    outcome = await ctx.battle(bossBattleRequest(request));
  } catch (err) {
    console.error('[bossBattle] el combate ha fallado; se trata como derrota sin pérdida', err);
    outcome = 'forfeit';
  }
  if (PASSED.has(outcome)) return outcome;
  if (outcome === 'run') return 'run';
  await recoverAfterLoss(ctx, retry, opts);
  return 'lose';
}

/**
 * Compatibilidad con el Bloque 6 (`content/events/b06_common.js#scriptedBattle`): misma firma y resultado.
 * → 'win' | 'lose'
 */
export function scriptedBattle(ctx, request, retry) {
  return bossBattle(ctx, request, retry);
}
