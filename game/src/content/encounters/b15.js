// Encuentros salvajes del Bloque 15 (docs/POKEDEX_DISTRIBUCION.md §7.3, etapa H): «Ruta 11 y Paso del Norte»,
// «Ruta 13, Villa Boreal y Mar Boreal» y «Gruta Escarcha». Las mismas tablas sirven para el modo clásico y el visible
// (biblia §15). Formato de world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx]. La Senda del Lazo (Ruta 12) no
// tiene tabla en la distribución: es un camino de roca y nieve sin hierba alta.

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Ruta 11 y Paso del Norte · Hierba (50–55). */
export const NORTE_GRASS = t([
  [20, 'SNOVER', 50, 55], [20, 'CUBCHOO', 50, 55], [15, 'SNEASEL', 50, 55], [15, 'SWINUB', 50, 55],
  [12, 'BERGMITE', 50, 55], [8, 'ABSOL', 50, 55], [5, 'PILOSWINE', 50, 55], [3, 'STARAPTOR', 50, 55],
  [2, 'FRIGIBAX', 50, 55],
]);

/** Ruta 13 y Villa Boreal · Hierba de día y de noche (52–57). */
export const BOREAL_GRASS_DAY = t([
  [30, 'SNORUNT', 52, 57], [25, 'SMOOCHUM', 52, 57], [20, 'SNOVER', 52, 57], [15, 'CUBCHOO', 52, 57],
  [5, 'ABOMASNOW', 52, 57], [5, 'BEARTIC', 52, 57],
]);
export const BOREAL_GRASS_NIGHT = t([
  [30, 'SNORUNT', 52, 57], [25, 'SNEASEL', 52, 57], [20, 'CUBCHOO', 52, 57], [15, 'SMOOCHUM', 52, 57],
  [8, 'BEARTIC', 52, 57], [2, 'WEAVILE', 52, 57],
]);

/** Mar Boreal · Nadar y Buceo (52–57). */
export const BOREAL_SWIM = t([[50, 'WINGULL', 52, 57], [30, 'FRILLISH', 52, 57], [20, 'PELIPPER', 52, 57]]);
export const BOREAL_DIVE = t([[60, 'CLAMPERL', 52, 57], [40, 'RELICANTH', 52, 57]]);

/** Gruta Escarcha · Cueva de día (Jynx) y de noche (Froslass sustituye a Jynx) (53–58). */
const ESCARCHA_BASE = [
  [25, 'SNORUNT', 53, 58], [20, 'BERGMITE', 53, 58], [15, 'FRIGIBAX', 53, 58], [15, 'SWINUB', 53, 58],
  [11, 'GOLBAT', 53, 58], [5, 'GLALIE', 53, 58], [3, 'AVALUGG', 53, 58], [3, 'ARCTIBAX', 53, 58],
];
export const ESCARCHA_DAY = t([...ESCARCHA_BASE, [3, 'JYNX', 53, 58]]);
export const ESCARCHA_NIGHT = t([...ESCARCHA_BASE, [3, 'FROSLASS', 53, 58]]);

export const RUTA_11 = Object.freeze({ grass: NORTE_GRASS });
export const PASO_DEL_NORTE = Object.freeze({ grass: NORTE_GRASS });
export const RUTA_13 = Object.freeze({ grassDay: BOREAL_GRASS_DAY, grassNight: BOREAL_GRASS_NIGHT });
export const VILLA_BOREAL = Object.freeze({ grassDay: BOREAL_GRASS_DAY, grassNight: BOREAL_GRASS_NIGHT, water: BOREAL_SWIM });
export const MAR_BOREAL = Object.freeze({ water: BOREAL_SWIM });
/** Fondo del Mar Boreal (Buceo): como los fondos del sur, los encuentros submarinos van en la tabla de cueva. */
export const MAR_BOREAL_FONDO = Object.freeze({ cave: BOREAL_DIVE, stepChance: Object.freeze({ cave: 4 }) });
export const GRUTA_ESCARCHA = Object.freeze({ caveDay: ESCARCHA_DAY, caveNight: ESCARCHA_NIGHT });

export default {
  ruta_11: RUTA_11, paso_del_norte: PASO_DEL_NORTE, ruta_13: RUTA_13, villa_boreal: VILLA_BOREAL,
  mar_boreal: MAR_BOREAL, mar_boreal_fondo: MAR_BOREAL_FONDO, gruta_escarcha: GRUTA_ESCARCHA, gruta_escarcha_2: GRUTA_ESCARCHA,
};
