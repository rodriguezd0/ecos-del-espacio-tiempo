// Encuentros salvajes del Bloque 10 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Aldea Mnemos» y «Pilar de la Memoria
// (Archivo Hondo)», etapa D). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx] o { species, weight, min, max, form } (Unown por forma).
// Evento / regalo (Sinistea en la casa de té, Spiritomb en la Losa del Olvido) y árbol de miel: eventos del bloque.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Hierba de día (6:00–20:00), niveles 35–40. Honedge ronda la cuneta del Santuario de los Glifos. */
export const MNEMOS_DAY = t([
  [30, 'PANCHAM', 35, 40], [25, 'CHINGLING', 35, 40], [25, 'BRONZOR', 35, 40], [20, 'HONEDGE', 35, 40],
]);

/** Hierba de noche, niveles 35–40. */
export const MNEMOS_NIGHT = t([
  [25, 'MUNNA', 35, 40], [25, 'MISDREAVUS', 35, 40], [25, 'DUSKULL', 35, 40], [25, 'GASTLY', 35, 40],
]);

export const ALDEA_MNEMOS = Object.freeze({ grassDay: MNEMOS_DAY, grassNight: MNEMOS_NIGHT });

/** Árbol de miel de Mnemos (35–38). */
export const MNEMOS_HONEY = t([[60, 'CHERUBI', 35, 38], [40, 'COMBEE', 35, 38]]);

/** Unown en sus 28 formas (A–Z, ! y ?): 30 % del total repartido entre formas. */
const UNOWN_FORMS = 28;
const unown = Array.from({ length: UNOWN_FORMS }, (_, form) => Object.freeze({
  species: 'UNOWN', form, min: 36, max: 41, weight: form >= 26 ? 2 : 1,
}));

/** Archivo Hondo (cueva / ruina), niveles 36–41: Unown 30, Haunter 25, Elgyem 25, Chimecho 17, Bronzong 3. */
export const ARCHIVO_HONDO = Object.freeze({
  cave: Object.freeze([
    ...unown,
    Object.freeze([25, 'HAUNTER', 36, 41]), Object.freeze([25, 'ELGYEM', 36, 41]),
    Object.freeze([17, 'CHIMECHO', 36, 41]), Object.freeze([3, 'BRONZONG', 36, 41]),
  ]),
});

/** Regalos y visibles fijos del bloque. */
export const SINISTEA_GIFT = Object.freeze({ species: 'SINISTEA', level: 35 });
export const SPIRITOMB = Object.freeze({ species: 'SPIRITOMB', level: 40 });

export default { aldea_mnemos: ALDEA_MNEMOS, archivo_hondo: ARCHIVO_HONDO };
