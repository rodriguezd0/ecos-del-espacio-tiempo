// Encuentros salvajes del Bloque 2 (docs/POKEDEX_DISTRIBUCION.md §7.3, D28 DECIDIDO-DEV). Las mismas tablas
// sirven para el modo clásico (al andar por la hierba o la ruina) y el visible (los Pokémon deambulan por ella;
// biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].

/** Villa Zaguán y Ruta 2 · etapa A: hierba (día / noche) y Caña Vieja (el estanque del pueblo). */
export const ZAGUAN_ENCOUNTERS = Object.freeze({
  grass: Object.freeze([
    [20, 'PIDOVE', 7, 12], [15, 'FLETCHLING', 7, 12], [15, 'PAWMI', 7, 12], [15, 'BUNEARY', 7, 12],
    [15, 'WOOLOO', 7, 12], [5, 'SILCOON', 7, 12], [5, 'CASCOON', 7, 12], [5, 'ABRA', 7, 12], [5, 'RALTS', 7, 12],
  ]),
  grassNight: Object.freeze([
    [20, 'NICKIT', 7, 12], [15, 'BUNEARY', 7, 12], [15, 'WOOLOO', 7, 12], [10, 'PIDOVE', 7, 12], [10, 'PAWMI', 7, 12],
    [10, 'ABRA', 7, 12], [10, 'RALTS', 7, 12], [5, 'SILCOON', 7, 12], [5, 'CASCOON', 7, 12],
  ]),
  fish_old: Object.freeze([[70, 'MAGIKARP', 8, 12], [30, 'GOLDEEN', 8, 12]]),
});

/**
 * Explanada del Umbral: pradera a las puertas de Zaguán; comparte la tabla de hierba de «Villa Zaguán y Ruta 2»
 * (la explanada no tiene tabla propia en §7.3).
 */
export const EXPLANADA_ENCOUNTERS = Object.freeze({
  grass: ZAGUAN_ENCOUNTERS.grass,
  grassNight: ZAGUAN_ENCOUNTERS.grassNight,
});

/** Pilar del Umbral (Ruinas del Dintel) · etapa A: cueva / ruina, niveles 5–9. */
export const RUINAS_ENCOUNTERS = Object.freeze({
  cave: Object.freeze([
    [30, 'GEODUDE', 5, 9], [30, 'ZUBAT', 5, 9], [15, 'MACHOP', 5, 9], [15, 'NACLI', 5, 9], [6, 'BONSLY', 5, 9], [4, 'ONIX', 5, 9],
  ]),
});

/** Regalo opcional: el Geodude de la Cámara (D08), nv 8; espera en la cámara si se rechaza (CAMPANA §2.6). */
export const GEODUDE_GIFT = Object.freeze({ species: 'GEODUDE', level: 8 });

export default {
  villa_zaguan: ZAGUAN_ENCOUNTERS,
  explanada_umbral: EXPLANADA_ENCOUNTERS,
  ruinas_dintel: RUINAS_ENCOUNTERS,
};
