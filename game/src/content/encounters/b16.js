// Encuentros salvajes del Bloque 16 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Lagos del Alma» y «Pilar del Alma
// (Santuario)», etapa H). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
//   · La Supercaña solo pica en el Lago del Sentir (zona del mapa) y la Caña Buena solo en sus 6 casillas de Feebas,
//     que cambian cada día de juego (content/events/b16_feebas.js, `fishingAt` del mapa; world/fishing.js).

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Lagos del Alma · Hierba (55–60). */
export const LAGOS_GRASS = t([
  [25, 'AZUMARILL', 55, 60], [25, 'QUAGSIRE', 55, 60], [25, 'KIRLIA', 55, 60], [22, 'CHIMECHO', 55, 60], [3, 'YANMEGA', 55, 60],
]);
/** Lagos del Alma · Nadar (55–60). */
export const LAGOS_SURF = t([[40, 'WHISCASH', 55, 60], [30, 'AZUMARILL', 55, 60], [30, 'QUAGSIRE', 55, 60]]);
/** Lago del Sentir · Supercaña (55–60). */
export const SENTIR_SUPERROD = t([
  [60, 'MAGIKARP', 55, 60], [20, 'GOLDEEN', 55, 60], [14, 'WHISCASH', 55, 60], [5, 'DRATINI', 55, 60], [1, 'DRAGONAIR', 55, 60],
]);
/** Casillas especiales del Lago del Sentir · Caña Buena (20–25). */
export const FEEBAS_GOODROD = t([[100, 'FEEBAS', 20, 25]]);

export const LAGOS_ALMA = Object.freeze({ grass: LAGOS_GRASS, water: LAGOS_SURF });
/** Zona del Lago del Sentir: las mismas tablas + la Supercaña. */
export const LAGO_SENTIR = Object.freeze({ grass: LAGOS_GRASS, water: LAGOS_SURF, fish_super: SENTIR_SUPERROD });
/** Tablas de pesca de una casilla de Feebas (la Supercaña sigue picando igual). */
export const FEEBAS_SPOT = Object.freeze({ fish_good: FEEBAS_GOODROD, fish_super: SENTIR_SUPERROD });

/** Pilar del Alma (Santuario) · Cueva / ruina (55–60). */
export const SANTUARIO_ALMA = Object.freeze({
  cave: t([[35, 'BRONZONG', 55, 60], [31, 'HATTREM', 55, 60], [30, 'BEHEEYEM', 55, 60], [2, 'GARDEVOIR', 55, 60], [2, 'GALLADE', 55, 60]]),
});

/** Azelf (Ala del Querer): combate de la prueba, nivel 58 (CAMPANA B16). */
export const AZELF_TRIAL = Object.freeze({
  species: 'AZELF', level: 58, moves: Object.freeze(['ANCIENTPOWER', 'PSYCHIC', 'NASTYPLOT', 'FLAMETHROWER']),
});

export default { lagos_alma: LAGOS_ALMA, santuario_alma: SANTUARIO_ALMA };
