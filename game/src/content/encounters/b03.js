// Encuentros salvajes del Bloque 3 (docs/POKEDEX_DISTRIBUCION.md §7.3 «Villa Zaguán y Ruta 2» y «Ciudad Caudal
// (canales)», etapa A). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. Nadar (etapa F) solo se usa con la capacidad de
// Zygarde; sus niveles son los del momento en que se usa (§7.2).
// Curva del principio rebajada a petición del autor (DECISIONES X35, «DECIDIDO (autor, 25-09-2026)»): hierba 6–10
// (antes 7–12), árbol de miel 7–11 (antes 8–12) y Caña Vieja de Caudal 8–13 (antes 8–15).

/** Ruta 2 — hierba alta (día/noche), Caña Vieja y estanque con Nadar. */
export const RUTA_2 = Object.freeze({
  grass: Object.freeze([
    [20, 'PIDOVE', 6, 10], [15, 'FLETCHLING', 6, 10], [15, 'PAWMI', 6, 10], [15, 'BUNEARY', 6, 10], [15, 'WOOLOO', 6, 10],
    [5, 'SILCOON', 6, 10], [5, 'CASCOON', 6, 10], [5, 'ABRA', 6, 10], [5, 'RALTS', 6, 10],
  ]),
  grassNight: Object.freeze([
    [20, 'NICKIT', 6, 10], [15, 'BUNEARY', 6, 10], [15, 'WOOLOO', 6, 10], [10, 'PIDOVE', 6, 10], [10, 'PAWMI', 6, 10],
    [10, 'ABRA', 6, 10], [10, 'RALTS', 6, 10], [5, 'SILCOON', 6, 10], [5, 'CASCOON', 6, 10],
  ]),
  fish_old: Object.freeze([[70, 'MAGIKARP', 8, 12], [30, 'GOLDEEN', 8, 12]]),
  water: Object.freeze([[60, 'PSYDUCK', 35, 40], [40, 'MARILL', 35, 40]]),
});

/** Árbol de miel de la Ruta 2 (§7.3): se unta Miel y se vuelve tras descansar. */
export const RUTA_2_HONEY = Object.freeze([
  [30, 'COMBEE', 7, 11], [25, 'BURMY', 7, 11], [20, 'CHERUBI', 7, 11], [19, 'AIPOM', 7, 11], [5, 'HERACROSS', 7, 11],
  [1, 'MUNCHLAX', 7, 11],
]);

/** Ciudad Caudal — canales (Caña Vieja) y Nadar. */
export const CAUDAL = Object.freeze({
  fish_old: Object.freeze([[60, 'MAGIKARP', 8, 13], [25, 'GOLDEEN', 8, 13], [15, 'BARBOACH', 8, 13]]),
  water: Object.freeze([[50, 'BUIZEL', 35, 40], [30, 'PSYDUCK', 35, 40], [20, 'MARILL', 35, 40]]),
});

export default { ruta_2: RUTA_2, ciudad_caudal: CAUDAL };
