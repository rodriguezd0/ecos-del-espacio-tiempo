// Encuentros salvajes del Bloque 4 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ruta 3 y Garganta del Albo» y «Pilar de
// la Corriente»). Mismas tablas en modo clásico y visible (biblia §15). Formato de world/encounters.js:
// [peso, 'ESPECIE', nivelMín, nivelMáx]. Las tablas de Nadar/Buceo solo se usan con la capacidad (etapas F/G).

const freeze = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Hierba de día (12–18): Buizel 20, Wooper 20, Psyduck 15, Yanma 15, Azurill 13, Starly 10, Staravia 5, Riolu 2. */
const GRASS_DAY = freeze([
  [20, 'BUIZEL', 12, 18], [20, 'WOOPER', 12, 18], [15, 'PSYDUCK', 12, 18], [15, 'YANMA', 12, 18],
  [13, 'AZURILL', 12, 18], [10, 'STARLY', 12, 18], [5, 'STARAVIA', 12, 18], [2, 'RIOLU', 12, 18],
]);
/** Hierba de noche (12–18): Kricketune 20, Murkrow 20, Wooper 20, Psyduck 15, Azurill 10, Yanma 10, Riolu 5. */
const GRASS_NIGHT = freeze([
  [20, 'KRICKETUNE', 12, 18], [20, 'MURKROW', 12, 18], [20, 'WOOPER', 12, 18], [15, 'PSYDUCK', 12, 18],
  [10, 'AZURILL', 12, 18], [10, 'YANMA', 12, 18], [5, 'RIOLU', 12, 18],
]);
/** Caña Vieja (12–15): Magikarp 50, Barboach 50. En el Albo solo pican con el Pilar restaurado (b04_river.js). */
export const ALBO_FISH_OLD = freeze([[50, 'MAGIKARP', 12, 15], [50, 'BARBOACH', 12, 15]]);

/** Ruta 3: ribera con cuestas de grava. */
export const RUTA_3 = Object.freeze({ grass: GRASS_DAY, grassNight: GRASS_NIGHT, fish_old: ALBO_FISH_OLD });
/** Garganta del Albo (exterior): misma tabla de hierba y pesca que la Ruta 3. */
export const GARGANTA_ALBO = Object.freeze({ grass: GRASS_DAY, grassNight: GRASS_NIGHT, fish_old: ALBO_FISH_OLD });
/** Grutas de la Garganta (13–18): Zubat 35, Geodude 30, Machop 20, Tinkatink 15. */
export const GRUTA_ALBO = Object.freeze({
  cave: freeze([[35, 'ZUBAT', 13, 18], [30, 'GEODUDE', 13, 18], [20, 'MACHOP', 13, 18], [15, 'TINKATINK', 13, 18]]),
});
/** Pozo del Albo (Buceo, etapa G, 45–50): Barboach 60, Whiscash 40. */
export const POZO_ALBO = Object.freeze({
  cave: freeze([[60, 'BARBOACH', 45, 50], [40, 'WHISCASH', 45, 50]]),
  stepChance: Object.freeze({ cave: 4 }),
});
/** Pilar de la Corriente (15–20): Wooper 30, Marill 25, Shellos 20 (Mar Oeste), Psyduck 20, Golbat 5. */
export const PILAR_CORRIENTE = Object.freeze({
  cave: freeze([[30, 'WOOPER', 15, 20], [25, 'MARILL', 15, 20], [20, 'SHELLOS', 15, 20], [20, 'PSYDUCK', 15, 20], [5, 'GOLBAT', 15, 20]]),
  stepChance: Object.freeze({ cave: 4 }),
});

export default { ruta_3: RUTA_3, garganta_albo: GARGANTA_ALBO, gruta_albo: GRUTA_ALBO, pozo_albo: POZO_ALBO, pilar_corriente: PILAR_CORRIENTE };
