// Encuentros salvajes del Bloque 18 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Sima del Eje · etapa Completa · acceso:
// Reconstrucción»: Cueva / ruina 60–65 — Deino 20, Beldum 20, Gible 20, Duraludon 15, Elgyem 15, Zweilous 5, Metang 5;
// §7.1 «P9 · B18 · salvajes 60–65»). La misma tabla sirve en la hierba de los bordes de la Sima (Puente) y en las salas
// de la Cámara del Cruce, en modo clásico y visible (biblia §15). Formato de world/encounters.js:
// [peso, 'ESPECIE', nivelMín, nivelMáx].

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Sima del Eje (60–65). */
export const SIMA_EJE = t([
  [20, 'DEINO', 60, 65], [20, 'BELDUM', 60, 65], [20, 'GIBLE', 60, 65], [15, 'DURALUDON', 60, 65],
  [15, 'ELGYEM', 60, 65], [5, 'ZWEILOUS', 60, 65], [5, 'METANG', 60, 65],
]);

/** Puente de la Convergencia: el Rellano de los Custodios y la plataforma del Cruce (zonas del mapa). */
export const PUENTE_CONVERGENCIA = Object.freeze({ cave: SIMA_EJE });
/** Cámara del Cruce: salas del Pilar (Cueva / ruina). */
export const CAMARA_CRUCE = Object.freeze({ cave: SIMA_EJE });

/** El elegido del P9 (CAMPANA B18 «Elección»): nivel 65 con sus cuatro movimientos. */
export const P9_LEGENDS = Object.freeze({
  DIALGA: Object.freeze({ species: 'DIALGA', level: 65, moves: Object.freeze(['ROAROFTIME', 'METALCLAW', 'DRAGONPULSE', 'ANCIENTPOWER']) }),
  PALKIA: Object.freeze({ species: 'PALKIA', level: 65, moves: Object.freeze(['SPACIALREND', 'WATERPULSE', 'DRAGONPULSE', 'ANCIENTPOWER']) }),
});

export default { puente_convergencia: PUENTE_CONVERGENCIA, camara_cruce: CAMARA_CRUCE };
