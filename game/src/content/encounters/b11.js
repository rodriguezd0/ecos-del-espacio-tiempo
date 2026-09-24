// Encuentros salvajes del Bloque 11 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ruta 10 (tramo bajo)» etapa A,
// «Ruta 9 y Bosque Neblino» etapa E y «Ruta 10 (tramo alto) y Monte del Portal» etapa E). Las mismas tablas sirven
// para el modo clásico y el visible (biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', mín, máx].
// La Ruta 10 tiene dos tablas en un mismo mapa: el tramo alto usa `encounterZones` (world/encounters.js).

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Ruta 10, tramo bajo: hierba de día (niveles 4–7). */
export const RUTA10_BAJO_DAY = t([
  [20, 'STARLY', 4, 7], [20, 'PIDOVE', 4, 7], [15, 'BUDEW', 4, 7], [15, 'LILLIPUP', 4, 7], [15, 'WURMPLE', 4, 7], [15, 'KRICKETOT', 4, 7],
]);
/** Ruta 10, tramo bajo: hierba de noche. */
export const RUTA10_BAJO_NIGHT = t([
  [30, 'HOOTHOOT', 4, 7], [25, 'KRICKETOT', 4, 7], [20, 'LILLIPUP', 4, 7], [15, 'WURMPLE', 4, 7], [10, 'BUDEW', 4, 7],
]);

/** Ruta 10, tramo alto (y Monte del Portal): hierba de día (niveles 40–45). */
export const RUTA10_ALTO_DAY = t([
  [20, 'SWABLU', 40, 45], [15, 'BOMBIRDIER', 40, 45], [15, 'SNEASEL', 40, 45], [12, 'STARAVIA', 40, 45], [10, 'MEDICHAM', 40, 45],
  [10, 'ABSOL', 40, 45], [5, 'ALTARIA', 40, 45], [5, 'RIOLU', 40, 45], [5, 'LARVITAR', 40, 45], [3, 'BAGON', 40, 45],
]);
/** Ruta 10, tramo alto: hierba de noche. */
export const RUTA10_ALTO_NIGHT = t([
  [25, 'CLEFAIRY', 40, 45], [20, 'SNEASEL', 40, 45], [15, 'ABSOL', 40, 45], [15, 'NOCTOWL', 40, 45], [10, 'CLEFFA', 40, 45],
  [10, 'SWABLU', 40, 45], [5, 'LARVITAR', 40, 45],
]);

/** Ruta 9 y Bosque Neblino: hierba de día (niveles 37–43). */
export const NEBLINO_DAY = t([
  [20, 'HATENNA', 37, 43], [20, 'PONYTA', 37, 43, 1], [15, 'TOEDSCOOL', 37, 43], [15, 'VENIPEDE', 37, 43], [12, 'APPLIN', 37, 43],
  [5, 'HATTREM', 37, 43], [5, 'THIEVUL', 37, 43], [5, 'CUTIEFLY', 37, 43], [3, 'MIMIKYU', 37, 43],
]);
/** Ruta 9 y Bosque Neblino: hierba de noche. */
export const NEBLINO_NIGHT = t([
  [25, 'MISDREAVUS', 37, 43], [20, 'NOCTOWL', 37, 43], [20, 'THIEVUL', 37, 43], [15, 'HATENNA', 37, 43], [10, 'MIMIKYU', 37, 43],
  [8, 'GASTLY', 37, 43], [2, 'HONCHKROW', 37, 43],
]);

/**
 * Entradas con forma (Ponyta de Galar, forma 1 en Añil): world/encounters.js#normalizeEntry solo lee la forma en el
 * formato de objeto, así que las tablas que la necesitan se convierten aquí.
 */
function withForms(rows) {
  return Object.freeze(rows.map(([weight, species, min, max, form]) => Object.freeze(
    form ? { weight, species, min, max, form } : [weight, species, min, max],
  )));
}

export const RUTA_10 = Object.freeze({ grassDay: RUTA10_BAJO_DAY, grassNight: RUTA10_BAJO_NIGHT });
/** Zona del tramo alto (rectángulo en maps/b11/layout.js RUTA10.altoZone). */
export const RUTA_10_ALTO = Object.freeze({ grassDay: RUTA10_ALTO_DAY, grassNight: RUTA10_ALTO_NIGHT });
export const RUTA_9_NEBLINO = Object.freeze({ grassDay: withForms(NEBLINO_DAY), grassNight: NEBLINO_NIGHT });

/** Honchkrow Alfa del dormidero (T10, nivel 42; TABLILLAS T10, POKEDEX §7.3 «Alfas fijos»). */
export const HONCHKROW_ALFA = Object.freeze({ species: 'HONCHKROW', level: 42, alpha: true });

export default { ruta_10: RUTA_10, ruta_10_alto: RUTA_10_ALTO, ruta_9_neblino: RUTA_9_NEBLINO };
