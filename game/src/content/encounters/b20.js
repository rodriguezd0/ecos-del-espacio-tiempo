// Encuentros salvajes del Bloque 20 — Pilar del Origen (docs/POKEDEX_DISTRIBUCION.md §7.3 «Pilar del Origen (Senda del
// Origen) · etapa P10»: Cueva / ruina 62–68 — Unown 30, Bronzong 20, Dragonair 20, Hakamo-o 15, Metang 15). Las mismas
// tablas sirven para el modo clásico y el visible (biblia §15). Los Unown del Origen salen con las letras de ORIGEN
// (formas O, R, I, G, E y N; §7.6 «formas de Unown», opcionales de color), repartidas a partes iguales.
// Solo en los tramos de la Senda donde se camina libre (no en las salas de viento, espejo, espacio imposible ni Buceo).
// Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx, forma?].

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Letras de ORIGEN → forma de Unown (A = 0 … Z = 25). */
export const UNOWN_ORIGEN = Object.freeze({ O: 14, R: 17, I: 8, G: 6, E: 4, N: 13 });

export const SENDA_CUEVA = t([
  ...Object.values(UNOWN_ORIGEN).map((form) => [5, 'UNOWN', 62, 68, form]),
  [20, 'BRONZONG', 62, 68], [20, 'DRAGONAIR', 62, 68], [15, 'HAKAMOO', 62, 68], [15, 'METANG', 62, 68],
]);

export const SENDA_ORIGEN = Object.freeze({ cave: SENDA_CUEVA, stepChance: Object.freeze({ cave: 4 }) });

/** Tramos con encuentros (los de recorrido libre). */
export const TRAMOS_CON_ENCUENTROS = Object.freeze([1, 2, 4, 9]);

export default { senda_origen: SENDA_ORIGEN };
