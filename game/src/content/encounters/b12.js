// Encuentros salvajes del Bloque 12 (docs/POKEDEX_DISTRIBUCION.md §7.3): «Ruta 10 (tramo alto) y Monte del Portal»
// (hierba de día y de noche: las mismas tablas que la Ruta 10 alta de B11, reutilizadas; cueva/ruina en la gruta del
// Monte). El P6 interior queda sin Pokémon por X36 (decisión del creador, 26-09-2026). Las mismas tablas
// sirven para el modo clásico y el visible. Formato de world/encounters.js: [peso, 'ESPECIE', mín, máx].
import { RUTA_10_ALTO } from './b11.js';

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Monte del Portal: hierba alta de las terrazas y de la repisa de la cascada (niveles 40–45). */
export const MONTE_HIERBA = RUTA_10_ALTO;

/** Monte del Portal: paredes y grutas (niveles 40–45). */
export const MONTE_CUEVA = Object.freeze({
  cave: t([[33, 'NOIBAT', 40, 45], [32, 'MACHOKE', 40, 45], [32, 'GRAVELER', 40, 45], [3, 'DRUDDIGON', 40, 45]]),
});

export default { montana_portal: MONTE_HIERBA, monte_gruta: MONTE_CUEVA };
