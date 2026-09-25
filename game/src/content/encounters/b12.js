// Encuentros salvajes del Bloque 12 (docs/POKEDEX_DISTRIBUCION.md §7.3): «Ruta 10 (tramo alto) y Monte del Portal»
// (hierba de día y de noche: las mismas tablas que la Ruta 10 alta de B11, reutilizadas; cueva/ruina en la gruta del
// Monte) y «Pilar Invertido (Mundo Distorsión)» (cueva/ruina, solo fuera de las salas de puzzle). Las mismas tablas
// sirven para el modo clásico y el visible. Formato de world/encounters.js: [peso, 'ESPECIE', mín, máx].
import { RUTA_10_ALTO } from './b11.js';

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Monte del Portal: hierba alta de las terrazas y de la repisa de la cascada (niveles 40–45). */
export const MONTE_HIERBA = RUTA_10_ALTO;

/** Monte del Portal: paredes y grutas (niveles 40–45). */
export const MONTE_CUEVA = Object.freeze({
  cave: t([[33, 'NOIBAT', 40, 45], [32, 'MACHOKE', 40, 45], [32, 'GRAVELER', 40, 45], [3, 'DRUDDIGON', 40, 45]]),
});

/** Pilar Invertido (Mundo Distorsión): cueva/ruina, niveles 42–47. */
export const PILAR_INVERTIDO = Object.freeze({
  cave: t([
    [20, 'HAUNTER', 42, 47], [18, 'DUSCLOPS', 42, 47], [17, 'SABLEYE', 42, 47], [15, 'BEHEEYEM', 42, 47],
    [15, 'DRIFBLIM', 42, 47], [10, 'GOLBAT', 42, 47], [3, 'MISMAGIUS', 42, 47], [2, 'NOIVERN', 42, 47],
  ]),
});

export default { montana_portal: MONTE_HIERBA, monte_gruta: MONTE_CUEVA, pilar_invertido: PILAR_INVERTIDO };
