// Encuentros salvajes del Bloque 17 (docs/POKEDEX_DISTRIBUCION.md §7.3, «Mesa de los Vientos» y «Sima del Eje», etapa
// Completa; §7.1: salvajes 55–62). Las mismas tablas sirven para el modo clásico y el visible (biblia §15). Formato de
// world/encounters.js: [peso, 'ESPECIE', nivelMín, nivelMáx].
//   · Sima del Eje (Cueva / ruina): solo en la tierra sobre el vacío que se alcanza con Reconstrucción (Cabeza del
//     Puente de la Senda del Mirador). La Senda y el Mirador Sur que se pisan antes (desde Caudal y Lúmina, en cualquier
//     momento de la partida) no tienen encuentros.
//   · Círculo del Jardín (Villa Alba, de noche): Clefairy visibles en el Círculo ya alzado (content/events/b17_circulo.js).

const t = (rows) => Object.freeze(rows.map((r) => Object.freeze(r)));

/** Mesa de los Vientos · Hierba (58–62). */
export const MESA_GRASS = t([
  [30, 'ALTARIA', 58, 62], [25, 'STARAPTOR', 58, 62], [20, 'TROPIUS', 58, 62], [12, 'NOIVERN', 58, 62],
  [10, 'DRIFBLIM', 58, 62], [3, 'TOGETIC', 58, 62],
]);
export const MESA_VIENTOS = Object.freeze({ grass: MESA_GRASS });

/** Sima del Eje · Cueva / ruina (60–65). */
export const SIMA_CAVE = t([
  [20, 'DEINO', 60, 65], [20, 'BELDUM', 60, 65], [20, 'GIBLE', 60, 65], [15, 'DURALUDON', 60, 65], [15, 'ELGYEM', 60, 65],
  [5, 'ZWEILOUS', 60, 65], [5, 'METANG', 60, 65],
]);
export const SIMA_RIM = Object.freeze({ cave: SIMA_CAVE });

/** Rebaño de la Mesa (T14, «tres encuentros visibles»): Altaria dispersos por la crisis; no se capturan. */
export const HERD = Object.freeze([
  Object.freeze({ species: 'ALTARIA', level: 58 }),
  Object.freeze({ species: 'ALTARIA', level: 59 }),
  Object.freeze({ species: 'ALTARIA', level: 60 }),
]);

/** Clefairy del Círculo del Jardín (de noche, tras alzar las piedras): nivel 55–58. */
export const CIRCLE_CLEFAIRY = Object.freeze({ species: 'CLEFAIRY', min: 55, max: 58 });

/** Tablas por mapa (la Senda solo en su zona SIMA_ZONE: `encounterZones` de senda_mirador.js). */
export default { mesa_vientos: MESA_VIENTOS, senda_mirador: SIMA_RIM };
