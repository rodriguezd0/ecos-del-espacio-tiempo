// Encuentros salvajes del Bloque 3 (docs/POKEDEX_DISTRIBUCION.md §7.3 «Villa Zaguán y Ruta 2» y «Ciudad Caudal
// (canales)», etapa A). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. Nadar (etapa F) solo se usa con la capacidad de
// Zygarde; sus niveles son los del momento en que se usa (§7.2).
// Curva del principio rebajada a petición del autor (DECISIONES «DECIDIDO (autor, 25-09-2026)», curva inicial):
// hierba 5–9 (antes 7–12), miel y Caña Vieja de la Ruta 2 6–10 (antes 8–12), Caña Vieja de Caudal 8–13 (antes 8–15).

/** Ruta 2 — hierba alta (día/noche), Caña Vieja y estanque con Nadar. */
export const RUTA_2 = Object.freeze({
  grass: Object.freeze([
    [20, 'PIDOVE', 5, 9], [15, 'FLETCHLING', 5, 9], [15, 'PAWMI', 5, 9], [15, 'BUNEARY', 5, 9], [15, 'WOOLOO', 5, 9],
    [5, 'SILCOON', 5, 9], [5, 'CASCOON', 5, 9], [5, 'ABRA', 5, 9], [5, 'RALTS', 5, 9],
  ]),
  grassNight: Object.freeze([
    [20, 'NICKIT', 5, 9], [15, 'BUNEARY', 5, 9], [15, 'WOOLOO', 5, 9], [10, 'PIDOVE', 5, 9], [10, 'PAWMI', 5, 9],
    [10, 'ABRA', 5, 9], [10, 'RALTS', 5, 9], [5, 'SILCOON', 5, 9], [5, 'CASCOON', 5, 9],
  ]),
  fish_old: Object.freeze([[70, 'MAGIKARP', 6, 10], [30, 'GOLDEEN', 6, 10]]),
  water: Object.freeze([[60, 'PSYDUCK', 35, 40], [40, 'MARILL', 35, 40]]),
});

/** Árbol de miel de la Ruta 2 (§7.3): se unta Miel y se vuelve tras descansar. */
export const RUTA_2_HONEY = Object.freeze([
  [30, 'COMBEE', 6, 10], [25, 'BURMY', 6, 10], [20, 'CHERUBI', 6, 10], [19, 'AIPOM', 6, 10], [5, 'HERACROSS', 6, 10],
  [1, 'MUNCHLAX', 6, 10],
]);

/** Ciudad Caudal — canales (Caña Vieja) y Nadar. */
export const CAUDAL = Object.freeze({
  fish_old: Object.freeze([[60, 'MAGIKARP', 8, 13], [25, 'GOLDEEN', 8, 13], [15, 'BARBOACH', 8, 13]]),
  water: Object.freeze([[50, 'BUIZEL', 35, 40], [30, 'PSYDUCK', 35, 40], [20, 'MARILL', 35, 40]]),
});

export default { ruta_2: RUTA_2, ciudad_caudal: CAUDAL };
