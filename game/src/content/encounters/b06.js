// Encuentros salvajes del Bloque 6 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Villa Brontia, Ruta 5 y Meseta del
// Impulso» y «Pilar del Impulso (Galerías del Soplo)», etapa C). Las mismas tablas sirven para el modo clásico y
// el visible (biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
// La nota «Drifloon junto al Parque Eólico» se cumple en la hierba de la Meseta pegada a la valla del Parque.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Hierba de día (6:00–20:00), niveles 20–26. */
export const MESETA_DAY = t([
  [15, 'EMOLGA', 20, 26], [15, 'PAWMO', 20, 26], [15, 'SWABLU', 20, 26], [12, 'DEDENNE', 20, 26],
  [10, 'DRIFLOON', 20, 26], [10, 'TOGEDEMARU', 20, 26], [10, 'GIRAFARIG', 20, 26], [5, 'DUBWOOL', 22, 26],
  [5, 'WOOLOO', 20, 23], [3, 'ELEKID', 20, 24],
]);

/** Hierba de noche, niveles 20–26. */
export const MESETA_NIGHT = t([
  [20, 'NOCTOWL', 20, 26], [15, 'MURKROW', 20, 26], [15, 'EMOLGA', 20, 26], [15, 'DEDENNE', 20, 26],
  [10, 'GIRAFARIG', 20, 26], [10, 'SWABLU', 20, 26], [10, 'TOGEDEMARU', 20, 26], [5, 'ELEKID', 20, 24],
]);

/** Ruta 5 y Meseta del Impulso: mismas tablas (la distribución las agrupa con Villa Brontia). */
export const RUTA_5 = Object.freeze({ grassDay: MESETA_DAY, grassNight: MESETA_NIGHT });
export const MESETA_IMPULSO = Object.freeze({ grassDay: MESETA_DAY, grassNight: MESETA_NIGHT });

/** Galerías del Soplo (cueva / ruina), niveles 23–27. */
export const GALERIAS_SOPLO = Object.freeze({
  cave: t([[30, 'MAGNEMITE', 23, 27], [25, 'NOIBAT', 23, 27], [20, 'DRIFLOON', 23, 27], [15, 'PIKACHU', 23, 27], [10, 'PICHU', 23, 25]]),
});

/** Visible fijo de la Meseta (y montura de Abril): Cyclizar nv 24. */
export const CYCLIZAR = Object.freeze({ species: 'CYCLIZAR', level: 24 });

export default { ruta_5: RUTA_5, meseta_impulso: MESETA_IMPULSO, galerias_soplo: GALERIAS_SOPLO };
