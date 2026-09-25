// Encuentros salvajes del Bloque 19 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Calzada del Rey» y «Sima del Eje», etapa
// Completa, Cueva / ruina). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. Se usan por zonas (`encounterZones`): las pilas, la Peña y
// la cima en la Calzada; las cornisas y la calzada en la Sima. Nunca el campamento, los tramos ni el Umbral.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Calzada del Rey · Cueva / ruina (60–64). */
export const CALZADA_CAVE = t([
  [30, 'SHELGON', 60, 64], [30, 'JANGMOO', 60, 64], [20, 'DRUDDIGON', 60, 64], [15, 'GABITE', 60, 64], [5, 'HAKAMOO', 60, 64],
]);

/** Sima del Eje · Cueva / ruina (60–65). */
export const SIMA_CAVE = t([
  [20, 'DEINO', 60, 65], [20, 'BELDUM', 60, 65], [20, 'GIBLE', 60, 65], [15, 'DURALUDON', 60, 65], [15, 'ELGYEM', 60, 65],
  [5, 'ZWEILOUS', 60, 65], [5, 'METANG', 60, 65],
]);

export const CALZADA_REY = Object.freeze({ cave: CALZADA_CAVE });
export const SIMA_EJE = Object.freeze({ cave: SIMA_CAVE });

/** Salamence Alfa de la cima de la Peña del Rey (T15, nivel 64; TABLILLAS T15, POKEDEX §7.3 «Alfas fijos»). */
export const SALAMENCE_ALFA = Object.freeze({ species: 'SALAMENCE', level: 64, alpha: true });

export default { calzada_rey: CALZADA_REY, sima_eje: SIMA_EJE };
