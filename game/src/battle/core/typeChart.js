// Tabla de tipos a partir de game/data/types.json (weaknesses/resistances/immunities del tipo DEFENSOR).
// Multiplicadores como en Essentials 21.1: 0, 0.5, 1, 2 (el producto da 0.25 o 4 con dos tipos).

export const INEFFECTIVE = 0;
export const NOT_VERY_EFFECTIVE = 0.5;
export const NORMAL_EFFECTIVE = 1;
export const SUPER_EFFECTIVE = 2;

const cache = new WeakMap();

function chartFor(types) {
  let chart = cache.get(types);
  if (chart) return chart;
  chart = new Map();
  for (const [defId, def] of Object.entries(types)) {
    const row = new Map();
    for (const t of def.weaknesses || []) row.set(t, SUPER_EFFECTIVE);
    for (const t of def.resistances || []) row.set(t, NOT_VERY_EFFECTIVE);
    for (const t of def.immunities || []) row.set(t, INEFFECTIVE);
    chart.set(defId, row);
  }
  cache.set(types, chart);
  return chart;
}

/** Efectividad de un tipo atacante contra un único tipo defensor. */
export function typeMultiplier(types, atkType, defType) {
  if (!atkType || !defType) return NORMAL_EFFECTIVE;
  const row = chartFor(types).get(defType);
  if (!row) return NORMAL_EFFECTIVE;
  return row.has(atkType) ? row.get(atkType) : NORMAL_EFFECTIVE;
}

/** Efectividad contra varios tipos defensores (producto). */
export function calculateEffectiveness(types, atkType, ...defTypes) {
  let ret = NORMAL_EFFECTIVE;
  for (const t of defTypes.flat()) ret *= typeMultiplier(types, atkType, t);
  return ret;
}

export const Effectiveness = Object.freeze({
  ineffective: (v) => v === INEFFECTIVE,
  notVeryEffective: (v) => v > INEFFECTIVE && v < NORMAL_EFFECTIVE,
  resistant: (v) => v < NORMAL_EFFECTIVE,
  normal: (v) => v === NORMAL_EFFECTIVE,
  superEffective: (v) => v > NORMAL_EFFECTIVE,
  ineffectiveType: (types, atk, def) => typeMultiplier(types, atk, def) === INEFFECTIVE,
  superEffectiveType: (types, atk, def) => typeMultiplier(types, atk, def) > NORMAL_EFFECTIVE,
  notVeryEffectiveType: (types, atk, def) => typeMultiplier(types, atk, def) === NOT_VERY_EFFECTIVE,
});

/** Tipos "reales" (excluye pseudotipos como QMARKS). */
export function realTypes(types) {
  return Object.values(types).filter((t) => !t.pseudo).map((t) => t.id);
}
