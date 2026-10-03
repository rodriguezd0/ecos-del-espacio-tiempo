// Anclaje espacial de Zygarde en el postgame (docs/CAMPANA.md §2.1 y B22; X16: solo en la Senda del Lazo y en el
// Mundo Distorsión profundo; biblia §8: «fijar una orientación inestable», nunca abrir rutas ni duplicar la
// Reconstrucción). La capacidad `anchor` la da el hito `game_cleared` (content/zygarde/thresholds.js) y la acción es la
// API de world/zygarde/actions.js (`spatialAnchor` + `canAnchor`: capacidad y mapa con `anchorZone: true`). Este módulo
// añade la primera explicación de Zygarde y el aviso cuando todavía no se puede.
import { canAnchor, spatialAnchor } from '../../world/zygarde/actions.js';
import { F, zygardeSays, zygardeLines } from './b22a_common.js';
import { ANCHOR_TEXT } from './b22a_texts.js';

/** ¿Puede Zygarde anclar aquí ahora? (capacidad `anchor` y mapa con anchorZone). */
export function anchorAvailable(ctx) {
  return canAnchor(ctx.state, ctx.world?.current?.def || ctx.map?.def || null);
}

/**
 * Ancla lo que se tuerce: la primera vez, Zygarde lo explica (una sola vez en la partida); sin la capacidad o fuera de
 * una zona marcada, solo lo dice. `onAnchor(ctx)` aplica el cambio del mapa (variable, flag…). → true si se ancló.
 */
export async function useAnchor(ctx, { onAnchor = null } = {}) {
  if (!anchorAvailable(ctx)) {
    await zygardeSays(ctx, ANCHOR_TEXT.cant);
    return false;
  }
  if (!ctx.flag(F.anchorTutorial)) {
    ctx.setFlag(F.anchorTutorial);
    await zygardeLines(ctx, ANCHOR_TEXT.tutorial);
  }
  return spatialAnchor(ctx, { onAnchor });
}
