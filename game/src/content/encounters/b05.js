// Encuentros salvajes del Bloque 5 (docs/POKEDEX_DISTRIBUCION.md §7.3: «Ruta 4 · etapa C» y «Villa Brontia, Ruta 5 y
// Meseta del Impulso · etapa C»). Las mismas tablas sirven para el modo clásico (hierba alta) y el visible (los
// Pokémon deambulan por ella; biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
// La hierba agitada (Audino) y el árbol de miel son eventos del bloque (content/events/b05_wild.js) con sus tablas.

/** Ruta 4 — hierba alta (16–22), Caña Vieja (16–20) y Caña Buena (25–30; se pesca con la Caña Buena de Nexo, B09). */
export const RUTA_4 = Object.freeze({
  grass: Object.freeze([
    [20, 'PONYTA', 16, 22],
    [20, 'GLAMEOW', 16, 22],
    [17, 'MUDBRAY', 16, 22],
    [15, 'STUNKY', 16, 22],
    [15, 'PACHIRISU', 16, 22],
    [5, 'LUXIO', 16, 22],
    [5, 'SHINX', 16, 22],
    [3, 'LICKITUNG', 16, 22],
  ]),
  fish_old: Object.freeze([
    [60, 'GOLDEEN', 16, 20],
    [40, 'MAGIKARP', 16, 20],
  ]),
  fish_good: Object.freeze([
    [40, 'SEAKING', 25, 30],
    [40, 'GOLDEEN', 25, 30],
    [20, 'BARBOACH', 25, 30],
  ]),
});

/** Hierba agitada de la Ruta 4 (Audino 100 %, nv 20). */
export const RUTA_4_RUSTLE = Object.freeze([[100, 'AUDINO', 20, 20]]);

/** Árbol de miel de la Ruta 4 (18–22). */
export const RUTA_4_HONEY = Object.freeze([
  [30, 'COMBEE', 18, 22],
  [30, 'HERACROSS', 18, 22],
  [20, 'BURMY', 18, 22],
  [19, 'AIPOM', 18, 22],
  [1, 'MUNCHLAX', 18, 22],
]);

/** Villa Brontia — hierba del cerro de los molinos (misma tabla que la Ruta 5 y la Meseta, 20–26). */
export const VILLA_BRONTIA = Object.freeze({
  grass: Object.freeze([
    [15, 'EMOLGA', 20, 26],
    [15, 'PAWMO', 20, 26],
    [15, 'SWABLU', 20, 26],
    [12, 'DEDENNE', 20, 26],
    [10, 'DRIFLOON', 20, 26],
    [10, 'TOGEDEMARU', 20, 26],
    [10, 'GIRAFARIG', 20, 26],
    [5, 'DUBWOOL', 20, 26],
    [5, 'WOOLOO', 20, 26],
    [3, 'ELEKID', 20, 26],
  ]),
  grassNight: Object.freeze([
    [20, 'NOCTOWL', 20, 26],
    [15, 'MURKROW', 20, 26],
    [15, 'EMOLGA', 20, 26],
    [15, 'DEDENNE', 20, 26],
    [10, 'GIRAFARIG', 20, 26],
    [10, 'SWABLU', 20, 26],
    [10, 'TOGEDEMARU', 20, 26],
    [5, 'ELEKID', 20, 26],
  ]),
});

/** Horda de Elekid del campanario (T03, «aparece una horda de Elekid»). */
export const ELEKID_HORDE = Object.freeze({ species: 'ELEKID', levels: [21, 22, 23] });

export default { ruta_4: RUTA_4, villa_brontia: VILLA_BRONTIA };
