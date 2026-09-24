// Progreso de la campaña para los servicios (stock de tiendas, tutores): cuántos Pilares se han
// restaurado según los flags globales de docs/CAMPANA.md (`p1_restored` … `p10_restored`, `game_cleared`).
// Módulo PURO: recibe un GameState (o cualquier objeto con flag(k)).

export const PILLAR_COUNT = 10;
export const PILLAR_FLAGS = Object.freeze(Array.from({ length: PILLAR_COUNT }, (_, i) => `p${i + 1}_restored`));
export const CLEARED_FLAG = 'game_cleared';

/** Nº de Pilares restaurados (los flags se cuentan todos, no hace falta que sean consecutivos). */
export function restoredPillars(state) {
  if (!state || typeof state.flag !== 'function') return 0;
  return PILLAR_FLAGS.reduce((n, f) => n + (state.flag(f) ? 1 : 0), 0);
}

/** Progreso resumido: { pillars: 0..10, cleared: bool }. */
export function campaignProgress(state) {
  return {
    pillars: restoredPillars(state),
    cleared: Boolean(state && typeof state.flag === 'function' && state.flag(CLEARED_FLAG)),
  };
}

/**
 * ¿Se cumple un requisito de progreso? req: { pillars?: n, cleared?: bool, flag?: 'clave' }.
 * Sin requisito → true.
 */
export function meetsProgress(state, req = {}) {
  if (!req) return true;
  const p = campaignProgress(state);
  if (Number.isFinite(req.pillars) && p.pillars < req.pillars) return false;
  if (req.cleared && !p.cleared) return false;
  if (req.flag && !(state && state.flag(req.flag))) return false;
  return true;
}
