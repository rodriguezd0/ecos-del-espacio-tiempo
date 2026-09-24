// Encuentros salvajes del Bloque 3 (docs/POKEDEX_DISTRIBUCION.md §7.3 «Villa Zaguán y Ruta 2» y «Ciudad Caudal
// (canales)», etapa A). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. Nadar (etapa F) solo se usa con la capacidad de
// Zygarde; sus niveles son los del momento en que se usa (§7.2).

/** Ruta 2 — hierba alta (día/noche), Caña Vieja y estanque con Nadar. */
export const RUTA_2 = Object.freeze({
  grass: Object.freeze([
    [20, 'PIDOVE', 7, 12], [15, 'FLETCHLING', 7, 12], [15, 'PAWMI', 7, 12], [15, 'BUNEARY', 7, 12], [15, 'WOOLOO', 7, 12],
    [5, 'SILCOON', 7, 12], [5, 'CASCOON', 7, 12], [5, 'ABRA', 7, 12], [5, 'RALTS', 7, 12],
  ]),
  grassNight: Object.freeze([
    [20, 'NICKIT', 7, 12], [15, 'BUNEARY', 7, 12], [15, 'WOOLOO', 7, 12], [10, 'PIDOVE', 7, 12], [10, 'PAWMI', 7, 12],
    [10, 'ABRA', 7, 12], [10, 'RALTS', 7, 12], [5, 'SILCOON', 7, 12], [5, 'CASCOON', 7, 12],
  ]),
  fish_old: Object.freeze([[70, 'MAGIKARP', 8, 12], [30, 'GOLDEEN', 8, 12]]),
  water: Object.freeze([[60, 'PSYDUCK', 35, 40], [40, 'MARILL', 35, 40]]),
});

/** Árbol de miel de la Ruta 2 (§7.3): se unta Miel y se vuelve tras descansar. */
export const RUTA_2_HONEY = Object.freeze([
  [30, 'COMBEE', 8, 12], [25, 'BURMY', 8, 12], [20, 'CHERUBI', 8, 12], [19, 'AIPOM', 8, 12], [5, 'HERACROSS', 8, 12],
  [1, 'MUNCHLAX', 8, 12],
]);

/** Ciudad Caudal — canales (Caña Vieja) y Nadar. */
export const CAUDAL = Object.freeze({
  fish_old: Object.freeze([[60, 'MAGIKARP', 8, 15], [25, 'GOLDEEN', 8, 15], [15, 'BARBOACH', 8, 15]]),
  water: Object.freeze([[50, 'BUIZEL', 35, 40], [30, 'PSYDUCK', 35, 40], [20, 'MARILL', 35, 40]]),
});

export default { ruta_2: RUTA_2, ciudad_caudal: CAUDAL };
