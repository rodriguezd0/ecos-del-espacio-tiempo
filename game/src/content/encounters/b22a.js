// Encuentros salvajes del Bloque 22a. docs/POKEDEX_DISTRIBUCION.md no da tabla propia para el Mundo Distorsión
// profundo: se reutiliza la de «Pilar Invertido (Mundo Distorsión)» (§7.3, el mismo dominio) con los niveles del
// postgame (§7.1: «Postgame · B22 · salvajes 65–80») — DECIDIDO-DEV, a revisar por el autor. Solo en la isla grande de
// la Hondura (como en el P6: «solo fuera de las salas de puzzle»); el Corazón, la Cumbre Azur y Columna Lanza no tienen
// tabla (la Ruta 12 tampoco la tiene). Mismas tablas en modo clásico y visible. Formato: [peso, 'ESPECIE', mín, máx].

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Mundo Distorsión profundo, la Hondura: cueva/ruina, niveles 65–70. */
export const DISTORSION_HONDA = Object.freeze({
  cave: t([
    [20, 'HAUNTER', 65, 70], [18, 'DUSCLOPS', 65, 70], [17, 'SABLEYE', 65, 70], [15, 'BEHEEYEM', 65, 70],
    [15, 'DRIFBLIM', 65, 70], [10, 'GOLBAT', 65, 70], [3, 'MISMAGIUS', 65, 70], [2, 'NOIVERN', 65, 70],
  ]),
});

export default { distorsion_honda: DISTORSION_HONDA };
