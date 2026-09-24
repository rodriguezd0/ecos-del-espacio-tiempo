// Encuentros salvajes del Bloque 9a (docs/POKEDEX_DISTRIBUCION.md §7.3, etapa D: «Ruta 7», «Ciudad Lúmina (Parque
// de las Eras)» y «Ruta 14 y Reserva del Delta»). Las mismas tablas sirven para el modo clásico y el visible
// (biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. La hierba agitada (Audino) y
// el árbol de miel son eventos del bloque (content/events/b09a_wild.js) con sus tablas.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Ruta 7 — hierba de día y de noche (30–35). */
export const RUTA_7 = Object.freeze({
  grassDay: t([
    [20, 'HERDIER', 30, 35], [15, 'GLAMEOW', 30, 35], [15, 'STARAVIA', 30, 35], [15, 'PONYTA', 30, 35],
    [10, 'STUFFUL', 30, 35], [10, 'CUTIEFLY', 30, 35], [5, 'SKUNTANK', 30, 35], [4, 'ABRA', 30, 35],
    [3, 'SCYTHER', 30, 35], [3, 'MUDSDALE', 30, 35],
  ]),
  grassNight: t([
    [20, 'HOOTHOOT', 30, 35], [20, 'HERDIER', 30, 35], [15, 'GLAMEOW', 30, 35], [15, 'STUNKY', 30, 35],
    [10, 'SKUNTANK', 30, 35], [10, 'STUFFUL', 30, 35], [5, 'ABRA', 30, 35], [5, 'SCYTHER', 30, 35],
  ]),
});

/** Hierba agitada de la Ruta 7 (Audino 100 %, nv 33). */
export const RUTA_7_RUSTLE = t([[100, 'AUDINO', 33, 33]]);

/** Ciudad Lúmina — hierba del Parque de las Eras (30–35). */
export const LUMINA = Object.freeze({
  grassDay: t([[35, 'MIMEJR', 30, 35], [35, 'RALTS', 30, 35], [30, 'PICHU', 30, 35]]),
  grassNight: t([[50, 'MUNNA', 30, 35], [25, 'RALTS', 30, 35], [25, 'MIMEJR', 30, 35]]),
});

/** Ruta 14 y Reserva del Delta — hierba (32–38), Nadar en la laguna (35–40, etapa F) y Caña Buena (30–36). */
export const RUTA_14 = Object.freeze({
  grass: t([
    [12, 'TANGELA', 32, 38], [12, 'CHATOT', 32, 38], [10, 'TROPIUS', 32, 38], [10, 'CARNIVINE', 32, 38],
    [8, 'SCYTHER', 32, 38], [8, 'GIRAFARIG', 32, 38], [8, 'YANMA', 32, 38], [8, 'ORICORIO', 32, 38],
    [8, 'COMFEY', 32, 38], [6, 'STUFFUL', 32, 38], [5, 'FLAMIGO', 32, 38], [2, 'RIBOMBEE', 32, 38],
    [2, 'HAPPINY', 32, 38], [1, 'CHANSEY', 32, 38],
  ]),
  water: t([[60, 'WOOPER', 35, 40], [20, 'QUAGSIRE', 35, 40], [20, 'PSYDUCK', 35, 40]]),
  fish_good: t([[60, 'BARBOACH', 30, 36], [40, 'GOLDEEN', 30, 36]]),
});

/** Árbol de miel de la Reserva (32–36). */
export const RESERVA_HONEY = t([
  [30, 'COMBEE', 32, 36], [25, 'BURMY', 32, 36], [25, 'AIPOM', 32, 36], [18, 'CHERUBI', 32, 36], [2, 'MUNCHLAX', 32, 36],
]);

/** Visible fijo del huerto de la Reserva. */
export const APPLIN = Object.freeze({ species: 'APPLIN', level: 34 });

/** Alfa de historia de T07 (TABLILLAS §4.5; POKEDEX §7.3 «Alfas fijos de historia»). */
export const VESPIQUEN_ALPHA = Object.freeze({ species: 'VESPIQUEN', level: 36, alpha: true });

export default { ruta_7: RUTA_7, ciudad_lumina: LUMINA, ruta_14_reserva: RUTA_14 };
