// Encuentros salvajes del Bloque 9b (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ruta 8, Marisma Turbia y Palafitos · etapa
// D» y «Mar del Sur (superficie), costas y Ruta 15 · etapa F»; «Fondo del Mar del Sur · etapa G» para el bosque de algas
// de Caleta Sonda). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx, forma?] (la forma es opcional: Wooper de Paldea = 1,
// Shellos Mar Este = 1).

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Ruta 8 — juncales de la marisma (33–38). */
export const MARISMA_GRASS = t([
  [20, 'CROAGUNK', 33, 38], [15, 'SKORUPI', 33, 38], [15, 'WOOPER', 33, 38, 1], [15, 'VENIPEDE', 33, 38],
  [15, 'TOEDSCOOL', 33, 38], [10, 'CARNIVINE', 33, 38], [5, 'STUNKY', 33, 38], [5, 'WHIRLIPEDE', 33, 38],
]);

/** Ruta 8 con lluvia (tabla parcial de la distribución): Goomy 15 sustituye a Skorupi mientras llueve. */
export const MARISMA_GRASS_RAIN = t(MARISMA_GRASS.map((r) => (r[1] === 'SKORUPI' ? [r[0], 'GOOMY', r[2], r[3]] : r)));

/** Ruta 8: aguas hondas (Nadar, etapa F) y Caña Buena. */
export const RUTA_8 = Object.freeze({
  grass: MARISMA_GRASS,
  water: t([[60, 'SHELLOS', 35, 40], [40, 'WOOPER', 35, 40]]),
  fish_good: t([[70, 'BARBOACH', 33, 38], [25, 'GOLDEEN', 33, 38], [5, 'WHISCASH', 33, 38]]),
});

/** Mar del Sur (superficie): Nadar 42–50, Caña Buena desde los muelles 30–40 y Supercaña 45–50. */
const SEA_WATER = t([
  [20, 'TENTACOOL', 42, 50], [15, 'WINGULL', 42, 50], [10, 'PELIPPER', 42, 50], [10, 'MANTYKE', 42, 50],
  [10, 'FINNEON', 42, 50], [10, 'FRILLISH', 42, 50], [10, 'TENTACRUEL', 42, 50], [5, 'BRUXISH', 42, 50],
  [5, 'SHELLOS', 42, 50, 1], [5, 'MANTINE', 42, 50],
]);
const SEA_GOOD = t([[30, 'REMORAID', 30, 40], [30, 'CLAUNCHER', 30, 40], [20, 'WISHIWASHI', 30, 40], [20, 'CORSOLA', 30, 40]]);
const SEA_SUPER = t([
  [25, 'GYARADOS', 45, 50], [25, 'LUMINEON', 45, 50], [20, 'OCTILLERY', 45, 50], [20, 'CLAWITZER', 45, 50],
  [5, 'DONDOZO', 45, 50], [5, 'TATSUGIRI', 45, 50],
]);

/** Playas de la Ruta 15 (hierba de la arena, tras P4): 30–38. */
const BEACH_GRASS = t([[40, 'PYUKUMUKU', 30, 38], [30, 'FLAMIGO', 30, 38], [30, 'WINGULL', 30, 38]]);

export const CIUDAD_NEXO = Object.freeze({ water: SEA_WATER, fish_good: SEA_GOOD, fish_super: SEA_SUPER });
export const RUTA_15 = Object.freeze({ grass: BEACH_GRASS, water: SEA_WATER, fish_good: SEA_GOOD, fish_super: SEA_SUPER });
export const CALETA_SONDA = Object.freeze({ water: SEA_WATER, fish_good: SEA_GOOD, fish_super: SEA_SUPER });

/** Bosque de algas de Caleta Sonda (Buceo, etapa G): fauna del Fondo del Mar del Sur, 48–54. */
export const CALETA_ALGAS = Object.freeze({
  cave: t([
    [20, 'CHINCHOU', 48, 54], [15, 'CLAMPERL', 48, 54], [12, 'SKRELP', 48, 54], [10, 'RELICANTH', 48, 54],
    [8, 'CORSOLA', 48, 54], [8, 'WISHIWASHI', 48, 54], [7, 'REMORAID', 48, 54], [5, 'TATSUGIRI', 48, 54],
    [5, 'LANTURN', 48, 54], [5, 'JELLICENT', 48, 54], [3, 'DONDOZO', 48, 54], [2, 'DRAGALGE', 48, 54],
  ]),
  stepChance: Object.freeze({ cave: 4 }),
});

/** Visible fijo de las rocas de la costa (Ruta 15 y Caleta Sonda): Binacle 97, Barbaracle 3 (32–45). */
export const COAST_ROCKS = t([[97, 'BINACLE', 32, 38], [3, 'BARBARACLE', 40, 45]]);

export default {
  ruta_8_marisma: RUTA_8, ciudad_nexo: CIUDAD_NEXO, ruta_15: RUTA_15, caleta_sonda: CALETA_SONDA, caleta_algas: CALETA_ALGAS,
};
