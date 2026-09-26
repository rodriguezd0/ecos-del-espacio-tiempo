// Encuentros salvajes del Bloque 2 (docs/POKEDEX_DISTRIBUCION.md §7.3, D28 DECIDIDO-DEV). Las mismas tablas
// sirven para el modo clásico (al andar por la hierba o la ruina) y el visible (los Pokémon deambulan por ella;
// biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
// Curva del principio rebajada a petición del autor (DECISIONES X35, «DECIDIDO (autor, 25-09-2026)»): hierba de
// Zaguán y la Explanada 5–8 (antes 7–12), ruinas 5–8 (antes 5–9) y Geodude de la Cámara 7 (antes 8).

/** Villa Zaguán y Ruta 2 · etapa A: hierba (día / noche) y Caña Vieja (el estanque del pueblo). */
export const ZAGUAN_ENCOUNTERS = Object.freeze({
  grass: Object.freeze([
    [20, 'PIDOVE', 5, 8], [15, 'FLETCHLING', 5, 8], [15, 'PAWMI', 5, 8], [15, 'BUNEARY', 5, 8],
    [15, 'WOOLOO', 5, 8], [5, 'SILCOON', 5, 8], [5, 'CASCOON', 5, 8], [5, 'ABRA', 5, 8], [5, 'RALTS', 5, 8],
  ]),
  grassNight: Object.freeze([
    [20, 'NICKIT', 5, 8], [15, 'BUNEARY', 5, 8], [15, 'WOOLOO', 5, 8], [10, 'PIDOVE', 5, 8], [10, 'PAWMI', 5, 8],
    [10, 'ABRA', 5, 8], [10, 'RALTS', 5, 8], [5, 'SILCOON', 5, 8], [5, 'CASCOON', 5, 8],
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

/** Pilar del Umbral (Ruinas del Dintel) · etapa A: cueva / ruina, niveles 5–8. */
export const RUINAS_ENCOUNTERS = Object.freeze({
  cave: Object.freeze([
    [30, 'GEODUDE', 5, 8], [30, 'ZUBAT', 5, 8], [15, 'MACHOP', 5, 8], [15, 'NACLI', 5, 8], [6, 'BONSLY', 5, 8], [4, 'ONIX', 5, 8],
  ]),
});

/** Regalo opcional: el Geodude de la Cámara (D08), nv 7; espera en la cámara si se rechaza (CAMPANA §2.6). */
export const GEODUDE_GIFT = Object.freeze({ species: 'GEODUDE', level: 7 });

export default {
  villa_zaguan: ZAGUAN_ENCOUNTERS,
  explanada_umbral: EXPLANADA_ENCOUNTERS,
  ruinas_dintel: RUINAS_ENCOUNTERS,
};
