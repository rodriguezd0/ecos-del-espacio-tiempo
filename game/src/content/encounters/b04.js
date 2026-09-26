// Encuentros salvajes del Bloque 4 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ruta 3 y Garganta del Albo» y «Pilar de
// la Corriente»). Mismas tablas en modo clásico y visible (biblia §15). Formato de world/encounters.js:
// [peso, 'ESPECIE', nivelMín, nivelMáx]. Las tablas de Nadar/Buceo solo se usan con la capacidad (etapas F/G).
// Curva rebajada con la curva inicial del autor (DECISIONES «DECIDIDO (autor, 25-09-2026)»): hierba 11–16 (antes
// 12–18), grutas 12–16 (antes 13–18), Caña Vieja del Albo 11–14 (antes 12–15) y Pilar 13–18 (antes 15–20).

const freeze = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Hierba de día (11–16): Buizel 20, Wooper 20, Psyduck 15, Yanma 15, Azurill 13, Starly 10, Staravia 5, Riolu 2. */
const GRASS_DAY = freeze([
  [20, 'BUIZEL', 11, 16], [20, 'WOOPER', 11, 16], [15, 'PSYDUCK', 11, 16], [15, 'YANMA', 11, 16],
  [13, 'AZURILL', 11, 16], [10, 'STARLY', 11, 16], [5, 'STARAVIA', 11, 16], [2, 'RIOLU', 11, 16],
]);
/** Hierba de noche (11–16): Kricketune 20, Murkrow 20, Wooper 20, Psyduck 15, Azurill 10, Yanma 10, Riolu 5. */
const GRASS_NIGHT = freeze([
  [20, 'KRICKETUNE', 11, 16], [20, 'MURKROW', 11, 16], [20, 'WOOPER', 11, 16], [15, 'PSYDUCK', 11, 16],
  [10, 'AZURILL', 11, 16], [10, 'YANMA', 11, 16], [5, 'RIOLU', 11, 16],
]);
/** Caña Vieja (11–14): Magikarp 50, Barboach 50. En el Albo solo pican con el Pilar restaurado (b04_river.js). */
export const ALBO_FISH_OLD = freeze([[50, 'MAGIKARP', 11, 14], [50, 'BARBOACH', 11, 14]]);

/** Ruta 3: ribera con cuestas de grava. */
export const RUTA_3 = Object.freeze({ grass: GRASS_DAY, grassNight: GRASS_NIGHT, fish_old: ALBO_FISH_OLD });
/** Garganta del Albo (exterior): misma tabla de hierba y pesca que la Ruta 3. */
export const GARGANTA_ALBO = Object.freeze({ grass: GRASS_DAY, grassNight: GRASS_NIGHT, fish_old: ALBO_FISH_OLD });
/** Grutas de la Garganta (12–16): Zubat 35, Geodude 30, Machop 20, Tinkatink 15. */
export const GRUTA_ALBO = Object.freeze({
  cave: freeze([[35, 'ZUBAT', 12, 16], [30, 'GEODUDE', 12, 16], [20, 'MACHOP', 12, 16], [15, 'TINKATINK', 12, 16]]),
});
/** Pozo del Albo (Buceo, etapa G, 45–50): Barboach 60, Whiscash 40. */
export const POZO_ALBO = Object.freeze({
  cave: freeze([[60, 'BARBOACH', 45, 50], [40, 'WHISCASH', 45, 50]]),
  stepChance: Object.freeze({ cave: 4 }),
});
/** Pilar de la Corriente (13–18): Wooper 30, Marill 25, Shellos 20 (Mar Oeste), Psyduck 20, Golbat 5. */
export const PILAR_CORRIENTE = Object.freeze({
  cave: freeze([[30, 'WOOPER', 13, 18], [25, 'MARILL', 13, 18], [20, 'SHELLOS', 13, 18], [20, 'PSYDUCK', 13, 18], [5, 'GOLBAT', 13, 18]]),
  stepChance: Object.freeze({ cave: 4 }),
});

export default { ruta_3: RUTA_3, garganta_albo: GARGANTA_ALBO, gruta_albo: GRUTA_ALBO, pozo_albo: POZO_ALBO, pilar_corriente: PILAR_CORRIENTE };
