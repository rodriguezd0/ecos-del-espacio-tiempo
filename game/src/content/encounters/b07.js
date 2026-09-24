// Encuentros salvajes del Bloque 7 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Ruta 6 y Cantería Solano», etapa D; curva
// §7.1: salvajes 24–29). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Hierba de día (6:00–20:00), niveles 24–29. */
export const RUTA6_DAY = t([
  [20, 'GLIGAR', 24, 29], [20, 'TIMBURR', 24, 29], [15, 'RHYHORN', 24, 29], [15, 'MEDITITE', 24, 29],
  [12, 'NOSEPASS', 24, 29], [10, 'MACHOKE', 26, 29], [5, 'BOMBIRDIER', 25, 29], [3, 'ABSOL', 26, 29],
]);

/** Hierba de noche, niveles 24–29. */
export const RUTA6_NIGHT = t([
  [25, 'HOUNDOUR', 24, 29], [15, 'GLIGAR', 24, 29], [15, 'RHYHORN', 24, 29], [15, 'MEDITITE', 24, 29],
  [15, 'TIMBURR', 24, 29], [12, 'NOSEPASS', 24, 29], [3, 'ABSOL', 26, 29],
]);

export const RUTA_6 = Object.freeze({ grassDay: RUTA6_DAY, grassNight: RUTA6_NIGHT });

/** Galerías de la Cantería (cueva / ruina), niveles 25–29. */
export const GALERIAS_CANTERIA = Object.freeze({
  cave: t([[30, 'GRAVELER', 25, 29], [25, 'NACLI', 25, 29], [25, 'TINKATINK', 25, 29], [20, 'ONIX', 25, 29]]),
});

export default { ruta_6: RUTA_6, canteria_solano: GALERIAS_CANTERIA };
