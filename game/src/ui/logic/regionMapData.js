// Atlas de Axis para el mapa regional y el Vuelo (docs/CAMPANA.md §1.1–1.7, X02 DECIDIDO-DEV).
// Rejilla de 30×20 casillas de 16 px (480×320, como la hoja Town Map de Añil). Las casillas de los lugares y
// los caminos son los de la ilustración del agente de arte (game/assets/ui/region_map.json, generada por
// tools/pixel_map.mjs a partir del esquema ASCII de §1.2): un test comprueba que siguen coincidiendo.
// Módulo PURO: lo usan ui/screens/regionMap.js, el Vuelo (world/zygarde), el plano del prólogo y los tests.
//
// Formato:
//   terrain: 20 filas × 30 caracteres (TERRAIN_KEYS) — tierra/mar y biomas de la misma ilustración.
//   places: { id, name, kind, x, y, desc?, pillar?, pillars?, parent?, fly?, flyUnlock?, links, mapIds, flyTo }
//     kind: 'town' | 'route' | 'zone' | 'sea' | 'post' (postgame) · x, y: casilla del icono y del cursor
//     links: conexiones tal como las da la tabla de CAMPANA desde ESTE lugar ([id, dir]; dir N, S, E, O, NE, NO,
//            SE, SO o null si la tabla no la da). Los tests comprueban que son simétricas y coherentes.
//     parent: lugar dentro de otro (misma casilla; p. ej. el Archivo Hondo en Aldea Mnemos).
//     fly: destino de Vuelo (población). flyUnlock: solo tras desbloquearlo por guion (state.unlockFlyPoint(id)).
//   roads / seaRoads: caminos dibujados (pares de ids; codo horizontal → vertical desde el primero).
//   rivers: líneas decorativas del Río Albo (ilustración provisional).
// Los mapas de cada lugar salen de content/services/zones.js (mapPlace), que también resuelve los interiores por
// prefijo ('zaguan_centro' → villa_zaguan).
import { mapPlace, CATALOG_MAP_IDS } from '../../content/services/zones.js';

export const CELL = 16;
export const GRID_W = 30;
export const GRID_H = 20;

export const TERRAIN_KEYS = Object.freeze({
  '~': 'mar', '.': 'llanura', f: 'bosque', '^': 'montaña', '*': 'nieve', p: 'meseta', ':': 'arena',
  w: 'marisma', o: 'sima', l: 'lago', i: 'islote', v: 'volcán', r: 'arrecife',
});

// x: 0         1         2
//    012345678901234567890123456789
const TERRAIN = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 0  costa norte
  '~~~~~~~^^^*^^^**~~~~~~~~******', // 1  cordillera · Mar Boreal · Instalación Cierzo
  '...***^^^^^^^^^*^^^**~~~*l****', // 2  Aljibe (P6) · Cumbre Azur · Mar Boreal · Lagos del Alma (P8)
  '~^^^^^^^^^^^^^^^^^^^^~~~****.~', // 3
  '~.^^^^.........^^^^^^~~~*****~', // 4  Monte del Portal · Ruta 12
  '.......ffffff.....^^*~~~*****.', // 5  Villa Boreal · Gruta Escarcha
  '..fff..ffffff....^^^********.~', // 6  Ruta 10 · Ruta 13
  '..fff..ffffff....^^^****^^^..~', // 7  Ruta 9 (Neblino) · Laberinto · Cerro del Alba · Paso del Norte
  '...ff..ffffff.....^^^...ppppp.', // 8  Villa Alba · Mesa de los Vientos
  '~....^^^.........^^.....ppppp.', // 9  Ruta 1
  '~....^^^................ppppp.', // 10 Aldea Mnemos · Ruinas del Dintel · Villa Zaguán · Meseta (P3)
  '..www^^^................ppppp~', // 11 Garganta del Albo (P2) · Ruta 2 · Ruta 5
  '..www.........................', // 12 Ruta 8 · Ruta 3 · Ciudad Caudal · Ruta 4 · Villa Brontia
  '..www..............^^^^.......', // 13 Senda del Mirador
  '~...........ooo....^^^^^:::::~', // 14 Ciudad Lúmina · Sima del Eje · Calzada del Rey · Ruta 6
  '~..fffff...........^^^^::::::~', // 15 Mirador Sur · Cantería Solano · Cerro Plomo (P4)
  '~..fffff..............:::::::~', // 16 Ruta 14 · Ruta 7 · Ciudad Estrato · Dunas de Ceniza
  '~........~~...~~~~.~~..~~~:~~~', // 17 Ruta 15 · Ciudad Nexo · costa sur
  '~...~~~~~~~~~~~~~~~~v~~~~~i~~~', // 18 Caleta Sonda · Mar del Sur · Volcán Tizón · Bastión Axis
  '~~r~i~~~~~~~~~i~~~~~~~~~~~~~~~', // 19 Arrecife del Eco (P7) · Islote Lumbre · Estación Talasa
];

const P = (id, name, kind, x, y, links, extra = {}) => ({ id, name, kind, x, y, links, ...extra });

const RAW_PLACES = [
  // ── Poblaciones (§1.3) ─────────────────────────────────────────────────────────────────────
  P('villa_alba', 'Villa Alba', 'town', 10, 8, [['laberinto_profundidad', 'N'], ['ruta_1', 'S']],
    { fly: true, desc: 'Pueblo de piedemonte entre bosque' }),
  P('villa_zaguan', 'Villa Zaguán', 'town', 10, 10, [['ruta_1', 'N'], ['ruinas_dintel', 'O'], ['ruta_2', 'S']],
    { fly: true, desc: 'Aldea de huertos a la salida del bosque' }),
  P('ciudad_caudal', 'Ciudad Caudal', 'town', 11, 12,
    [['ruta_2', 'N'], ['ruta_3', 'NO'], ['ruta_4', 'E'], ['senda_mirador', 'S']],
    { fly: true, desc: 'Ciudad fluvial de canales y esclusas' }),
  P('villa_brontia', 'Villa Brontia', 'town', 19, 12, [['ruta_4', 'O'], ['ruta_5', 'E'], ['ruta_11', 'N'], ['ruta_6', 'S']],
    { fly: true, desc: 'Meseta con molinos y campanario' }),
  P('ciudad_estrato', 'Ciudad Estrato', 'town', 22, 16,
    [['ruta_6', 'N'], ['dunas_ceniza', 'E'], ['ruta_7', 'O'], ['canteria_solano', null]],
    { fly: true, desc: 'Ciudad minera en cañón escalonado' }),
  P('ciudad_lumina', 'Ciudad Lúmina', 'town', 4, 14,
    [['ruta_7', 'E'], ['ruta_8_marisma', 'NO'], ['ruta_14_reserva', 'S'], ['mirador_sur', 'N']],
    { fly: true, desc: 'Capital cultural' }),
  P('aldea_mnemos', 'Aldea Mnemos', 'town', 2, 10, [['ruta_8_marisma', 'SE'], ['ruta_9_neblino', 'N'], ['archivo_hondo', null]],
    { fly: true, desc: 'Aldea de bambú, cerezos y archivos' }),
  P('ciudad_nexo', 'Ciudad Nexo', 'town', 5, 17, [['ruta_14_reserva', 'N'], ['ruta_15', 'O'], ['mar_del_sur', 'SE']],
    { fly: true, desc: 'Puerto y nudo de comunicaciones' }),
  P('caleta_sonda', 'Caleta Sonda', 'town', 1, 18, [['ruta_15', 'E'], ['arrecife_eco', 'SO'], ['mar_del_sur', null]],
    { fly: true, desc: 'Pueblo de pescadores y buzos' }),
  P('villa_boreal', 'Villa Boreal', 'town', 25, 5,
    [['ruta_13', 'S'], ['lagos_alma', 'N'], ['gruta_escarcha', 'E'], ['mar_boreal', 'O']],
    { fly: true, desc: 'Pueblo de observadores de auroras' }),
  P('mesa_vientos', 'Mesa de los Vientos', 'town', 27, 8, [],
    { fly: true, flyUnlock: true, desc: 'Comunidad aislada sobre una mesa rocosa' }),
  P('bastion_axis', 'Bastión Axis', 'post', 26, 18, [['mar_del_sur', null]],
    { fly: true, desc: 'Fortaleza costera convertida en instalación de combate' }),

  // ── Rutas y zonas (§1.4) ───────────────────────────────────────────────────────────────────
  P('ruta_1', 'Ruta 1', 'route', 10, 9, [['villa_alba', 'N'], ['villa_zaguan', 'S'], ['ruta_10', 'O'], ['cerro_del_alba', 'E']],
    { desc: 'Bosque y claros' }),
  P('laberinto_profundidad', 'Laberinto de la Profundidad', 'zone', 10, 7, [['villa_alba', 'S']],
    { desc: 'Laberinto privado de setos y piedra' }),
  P('ruta_2', 'Ruta 2', 'route', 10, 11, [['villa_zaguan', 'N'], ['ciudad_caudal', 'S']], { desc: 'Pradera, estanque y puentes' }),
  P('ruta_3', 'Ruta 3', 'route', 8, 12, [['ciudad_caudal', 'SE'], ['garganta_albo', 'NO']], { desc: 'Ribera con cuestas de grava' }),
  P('garganta_albo', 'Garganta del Albo', 'zone', 7, 11, [['ruta_3', 'S']], { pillar: 2, desc: 'Desfiladero con cascadas' }),
  P('ruta_4', 'Ruta 4', 'route', 15, 12, [['ciudad_caudal', 'O'], ['villa_brontia', 'E']], { desc: 'Vega inundable y subida a la meseta' }),
  P('ruta_5', 'Ruta 5', 'route', 22, 11, [['villa_brontia', 'O'], ['meseta_impulso', 'E']], { desc: 'Meseta ventosa' }),
  P('meseta_impulso', 'Meseta del Impulso', 'zone', 26, 10, [['ruta_5', 'O']],
    { pillar: 3, desc: 'Altiplano con el Anillo de los Vientos y el Parque Eólico' }),
  P('ruta_6', 'Ruta 6', 'route', 19, 14,
    [['villa_brontia', 'N'], ['ciudad_estrato', 'S'], ['canteria_solano', null], ['calzada_rey', null]],
    { desc: 'Cañón escalonado' }),
  P('canteria_solano', 'Cantería Solano', 'zone', 20, 15, [['ruta_6', null], ['ciudad_estrato', null]], { desc: 'Cantera en el cañón de la Ruta 6' }),
  P('dunas_ceniza', 'Dunas de Ceniza', 'zone', 25, 16, [['ciudad_estrato', 'O'], ['cerro_plomo', null]], { desc: 'Desierto gris' }),
  P('cerro_plomo', 'Cerro Plomo', 'zone', 27, 15, [['dunas_ceniza', null]], { pillar: 4, desc: 'Pilar de la Masa' }),
  P('ruta_7', 'Ruta 7', 'route', 9, 16,
    [['ciudad_estrato', 'E'], ['ciudad_lumina', 'O'], ['calzada_rey', 'N'], ['mirador_sur', null]],
    { desc: 'Valle ferroviario al sur de la Sima' }),
  P('ruta_14_reserva', 'Ruta 14', 'route', 5, 16, [['ciudad_lumina', 'N'], ['ciudad_nexo', 'S']], { desc: 'Reserva del Delta' }),
  P('ruta_8_marisma', 'Ruta 8', 'route', 3, 12, [['ciudad_lumina', 'SE'], ['aldea_mnemos', 'NO']], { desc: 'Marisma Turbia y Palafitos' }),
  P('ruta_9_neblino', 'Ruta 9', 'route', 3, 7, [['aldea_mnemos', 'S'], ['ruta_10', 'N']], { desc: 'Bosque Neblino' }),
  P('ruta_10', 'Ruta 10', 'route', 7, 6, [['ruta_1', 'E'], ['montana_portal', 'O'], ['ruta_9_neblino', 'S']], { desc: 'Faldas del Monte' }),
  P('montana_portal', 'Monte del Portal', 'zone', 5, 4, [['ruta_10', 'E'], ['aljibe_portal', null]], { desc: 'Gran cascada y explanada' }),
  P('aljibe_portal', 'Aljibe del Portal', 'zone', 4, 2, [['montana_portal', null]], { pillar: 6, desc: 'Pilar Invertido' }),
  P('cerro_del_alba', 'Cerro del Alba', 'zone', 12, 7, [['ruta_1', null]], { desc: 'Cornisa y cima sobre Villa Alba' }),
  P('ruta_11', 'Ruta 11', 'route', 20, 10, [['villa_brontia', 'S'], ['paso_del_norte', 'N']], { desc: 'Vertiente nevada' }),
  P('paso_del_norte', 'Paso del Norte', 'zone', 21, 7, [['ruta_11', 'S'], ['ruta_12_senda_lazo', 'O'], ['ruta_13', 'N']],
    { desc: 'Collado con refugio' }),
  P('ruta_12_senda_lazo', 'Ruta 12', 'route', 17, 4, [['paso_del_norte', 'E'], ['cumbre_azur', null]], { desc: 'Senda del Lazo' }),
  P('ruta_13', 'Ruta 13', 'route', 23, 6, [['paso_del_norte', 'S'], ['villa_boreal', 'N']], { desc: 'Nieve profunda' }),
  P('lagos_alma', 'Lagos del Alma', 'zone', 25, 2, [['villa_boreal', 'S']], { pillar: 8, desc: 'Tres lagos glaciares con santuario central' }),
  P('gruta_escarcha', 'Gruta Escarcha', 'zone', 28, 5, [['villa_boreal', 'O']], { desc: 'Cueva de hielo' }),
  P('mar_boreal', 'Mar Boreal', 'sea', 21, 2, [['villa_boreal', 'E'], ['instalacion_cierzo', null]], { desc: 'Mar frío' }),
  P('ruta_15', 'Ruta 15', 'route', 3, 17, [['ciudad_nexo', 'E'], ['caleta_sonda', 'O'], ['mar_del_sur', null]],
    { desc: 'Sendero de los Acantilados' }),
  P('mar_del_sur', 'Mar del Sur', 'sea', 16, 18,
    [['ciudad_nexo', null], ['caleta_sonda', null], ['ruta_15', null], ['islote_lumbre', null], ['estacion_talasa', null],
      ['volcan_tizon', null], ['bastion_axis', null]],
    { desc: 'Un mar en tres sectores, con su fondo (Buceo)' }),
  // Sector oeste del Mar del Sur, frente a Caleta Sonda (CAMPANA §1.2 y el mapa `mar_del_sur` de B13): al oeste de Nexo.
  P('islote_lumbre', 'Islote Lumbre', 'zone', 4, 19, [['mar_del_sur', null]], { desc: 'Islote de cerezos y farolillos' }),
  P('estacion_talasa', 'Estación Talasa', 'zone', 14, 19, [['mar_del_sur', null]], { desc: 'Plataforma de investigación' }),
  P('volcan_tizon', 'Volcán Tizón', 'zone', 20, 18, [['mar_del_sur', null]], { desc: 'Cono volcánico con el caserío de la forja' }),
  P('arrecife_eco', 'Arrecife del Eco', 'sea', 2, 19, [['caleta_sonda', null]], { pillar: 7, desc: 'Arrecife y Ruinas de Antea' }),
  P('sima_eje', 'Sima del Eje', 'zone', 13, 14, [['senda_mirador', 'N'], ['mirador_sur', 'S'], ['calzada_rey', 'E']],
    { pillar: 9, pillars: [9, 10], desc: 'Abismo central' }),
  P('senda_mirador', 'Senda del Mirador', 'zone', 12, 13, [['ciudad_caudal', 'N'], ['sima_eje', 'S']], { desc: 'Borde norte de la Sima' }),
  P('mirador_sur', 'Mirador Sur', 'zone', 13, 15, [['sima_eje', 'N'], ['ciudad_lumina', 'S'], ['ruta_7', null]], { desc: 'Borde sur de la Sima' }),
  P('calzada_rey', 'Calzada del Rey', 'zone', 16, 14, [['sima_eje', 'O'], ['ruta_7', 'S'], ['ruta_6', null]], { desc: 'Brazo este de la Sima' }),
  P('cumbre_azur', 'Cumbre Azur', 'zone', 15, 2, [['ruta_12_senda_lazo', null]], { desc: 'Columna Lanza, sobre las nubes' }),

  // ── Pilares con lugar propio y postgame (§1.5–1.6) ─────────────────────────────────────────
  P('ruinas_dintel', 'Ruinas del Dintel', 'zone', 9, 10, [['villa_zaguan', 'E']], { pillar: 1, desc: 'Pilar del Umbral' }),
  P('archivo_hondo', 'Archivo Hondo', 'zone', 2, 10, [['aldea_mnemos', null]], { pillar: 5, parent: 'aldea_mnemos', desc: 'Pilar de la Memoria' }),
  P('instalacion_cierzo', 'Instalación Cierzo', 'post', 27, 1, [['mar_boreal', null]], { desc: 'Islote del Mar Boreal' }),
];

/** Caminos terrestres de la ilustración (pares de ids; codo horizontal → vertical desde el primero). */
const ROADS = [
  ['villa_alba', 'laberinto_profundidad'], ['villa_alba', 'ruta_1'], ['ruta_1', 'villa_zaguan'],
  ['ruta_1', 'cerro_del_alba'], ['ruta_1', 'ruta_10'], ['ruta_10', 'montana_portal'], ['ruta_10', 'ruta_9_neblino'],
  ['villa_zaguan', 'ruinas_dintel'], ['villa_zaguan', 'ruta_2'], ['ruta_2', 'ciudad_caudal'],
  ['ciudad_caudal', 'ruta_3'], ['ruta_3', 'garganta_albo'], ['ciudad_caudal', 'ruta_4'], ['ruta_4', 'villa_brontia'],
  ['villa_brontia', 'ruta_5'], ['ruta_5', 'meseta_impulso'], ['villa_brontia', 'ruta_11'], ['ruta_11', 'paso_del_norte'],
  ['paso_del_norte', 'ruta_12_senda_lazo'], ['ruta_12_senda_lazo', 'cumbre_azur'], ['paso_del_norte', 'ruta_13'],
  ['ruta_13', 'villa_boreal'], ['villa_boreal', 'lagos_alma'], ['villa_boreal', 'gruta_escarcha'],
  ['villa_brontia', 'ruta_6'], ['ruta_6', 'canteria_solano'], ['canteria_solano', 'ciudad_estrato'],
  ['ciudad_estrato', 'dunas_ceniza'], ['dunas_ceniza', 'cerro_plomo'], ['ciudad_estrato', 'ruta_7'], ['ruta_7', 'ciudad_lumina'],
  ['mirador_sur', 'ruta_7'], ['mirador_sur', 'sima_eje'], ['sima_eje', 'senda_mirador'], ['senda_mirador', 'ciudad_caudal'],
  ['sima_eje', 'calzada_rey'], ['calzada_rey', 'ruta_6'],
  ['ciudad_lumina', 'ruta_8_marisma'], ['ruta_8_marisma', 'aldea_mnemos'], ['aldea_mnemos', 'ruta_9_neblino'],
  ['ciudad_lumina', 'ruta_14_reserva'], ['ruta_14_reserva', 'ciudad_nexo'], ['ciudad_nexo', 'ruta_15'],
  ['ruta_15', 'caleta_sonda'], ['montana_portal', 'aljibe_portal'],
];

/** Travesías por mar (línea de puntos). */
const SEA_ROADS = [
  ['caleta_sonda', 'arrecife_eco'], ['ciudad_nexo', 'islote_lumbre'], ['islote_lumbre', 'estacion_talasa'],
  ['estacion_talasa', 'volcan_tizon'], ['volcan_tizon', 'bastion_axis'], ['villa_boreal', 'mar_boreal'],
  ['mar_boreal', 'instalacion_cierzo'],
];

/**
 * Discrepancias conocidas entre las direcciones de las tablas de CAMPANA y la geometría del esquema §1.2:
 * Lúmina lista el Mirador Sur al N, pero en el esquema el Mirador baja al camino de la Ruta 7 al este (╩).
 */
export const LAYOUT_EXCEPTIONS = Object.freeze([['ciudad_lumina', 'mirador_sur']]);

/** Ids de mapa del catálogo asociados a un lugar (sin los interiores por prefijo). */
export function placeMapIds(placeId) {
  return CATALOG_MAP_IDS.filter((id) => mapPlace(id) === placeId);
}

// Cada lugar lleva además `mapIds` (mapas del catálogo) y, si es destino de Vuelo, `flyTo: { map }` (mapa
// principal = id del lugar; la casilla la da `flyPoint`/`start` de su definición, ver resolveFlyTarget).
const PLACES = RAW_PLACES.map((p) => Object.freeze({
  ...p,
  links: Object.freeze(p.links.map((l) => Object.freeze([...l]))),
  mapIds: Object.freeze(placeMapIds(p.id)),
  flyTo: p.fly ? Object.freeze({ map: p.id }) : null,
}));

/** Lugares cuyo único acceso es otro medio (Vuelo): no necesitan conexiones. */
export const LINKLESS_PLACES = Object.freeze(['mesa_vientos']);

/** Caracteres de agua del atlas (mar, lago, arrecife): el resto es tierra en la rejilla simple `grid`. */
export const WATER_TERRAIN = Object.freeze(['~', 'l', 'r']);

export const REGION_MAP = Object.freeze({
  name: 'Axis',
  decision: 'X02', // DECIDIDO-DEV, revisable por el autor (docs/DECISIONES.md)
  provisional: 'X02', // compatibilidad con el formato anterior
  width: GRID_W,
  height: GRID_H,
  terrain: Object.freeze(TERRAIN),
  // Formato anterior: '#' tierra y '.' agua (lo siguen usando el plano del prólogo y pruebas antiguas).
  grid: Object.freeze(TERRAIN.map((row) => [...row].map((ch) => (WATER_TERRAIN.includes(ch) ? '.' : '#')).join(''))),
  places: Object.freeze(PLACES),
  points: Object.freeze(PLACES), // alias (formato anterior: world/zygarde usa points + mapIds + flyTo)
  roads: Object.freeze(ROADS.map((r) => Object.freeze(r))),
  seaRoads: Object.freeze(SEA_ROADS.map((r) => Object.freeze(r))),
  rivers: Object.freeze([
    // Río Albo: gran cascada del Monte → Garganta → Caudal → se hunde en la Sima → Delta junto a Nexo.
    [[6, 4], [7, 8], [8, 10], [11, 12], [13, 14]],
    [[12, 15], [9, 16], [6, 17]],
  ]),
});

export const DIRECTION_VECTORS = Object.freeze({
  N: [0, -1], S: [0, 1], E: [1, 0], O: [-1, 0], NE: [1, -1], NO: [-1, -1], SE: [1, 1], SO: [-1, 1],
});

const byId = new Map(PLACES.map((p) => [p.id, p]));

/** Lugar por id o null. */
export function placeById(id, map = REGION_MAP) {
  if (map === REGION_MAP) return byId.get(id) || null;
  return (map.places || map.points || []).find((p) => p.id === id) || null;
}

/** Casillas por las que pasa una polilínea (tramos rectos o diagonales), sin repetir. */
export function pathCells(path = []) {
  const out = [];
  const push = (x, y) => { if (!out.some(([a, b]) => a === x && b === y)) out.push([x, y]); };
  for (let i = 0; i < path.length; i++) {
    const [x0, y0] = path[i];
    if (i === 0) push(x0, y0);
    if (i === path.length - 1) break;
    const [x1, y1] = path[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 1; s <= steps; s++) push(Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps));
  }
  return out;
}

/** Vértices de un camino entre dos lugares: codo horizontal → vertical (como tools/pixel_map.mjs). */
export function roadPath(a, b) {
  return [[a.x, a.y], [b.x, a.y], [b.x, b.y]];
}

/**
 * Casillas de cursor de cada ruta: tramos de los caminos que la tocan (el horizontal es del primero del par y
 * el vertical del segundo cuando ambos son rutas). Map(idRuta → [[x, y]…]).
 */
function routeCells(map) {
  const out = new Map();
  const find = (id) => placeById(id, map);
  const add = (id, cells) => {
    if (!out.has(id)) out.set(id, []);
    out.get(id).push(...cells);
  };
  for (const [ai, bi] of map.roads || []) {
    const a = find(ai);
    const b = find(bi);
    if (!a || !b) continue;
    const horiz = pathCells([[a.x, a.y], [b.x, a.y]]);
    const vert = pathCells([[b.x, a.y], [b.x, b.y]]);
    if (a.kind === 'route' && b.kind === 'route') { add(a.id, horiz); add(b.id, vert); }
    else if (a.kind === 'route') add(a.id, [...horiz, ...vert]);
    else if (b.kind === 'route') add(b.id, [...horiz, ...vert]);
  }
  return out;
}
const ROUTE_CELLS = routeCells(REGION_MAP);

/**
 * Lugar bajo la casilla (x, y): primero los iconos (el lugar padre si hay varios), después las rutas por sus
 * caminos. null si no hay nada.
 */
export function pointAt(map, x, y) {
  const places = map.places || map.points || [];
  const direct = places.find((p) => p.x === x && p.y === y && !p.parent) || places.find((p) => p.x === x && p.y === y);
  if (direct) return direct;
  const cells = map === REGION_MAP ? ROUTE_CELLS : routeCells(map);
  for (const [id, list] of cells) if (list.some(([a, b]) => a === x && b === y)) return placeById(id, map);
  return null;
}

/** Casillas de cursor de una ruta del atlas (pruebas y dibujo provisional). */
export function routeHitCells(id) {
  return ROUTE_CELLS.get(id) || [];
}

/** Lugares hijos (misma casilla, `parent`) de un lugar. */
export function childPlaces(id, map = REGION_MAP) {
  return (map.places || []).filter((p) => p.parent === id);
}

/** Lugar que contiene el mapa `mapId` (posición del jugador) o null. */
export function pointForMap(map, mapId) {
  if (!mapId) return null;
  const places = map.places || map.points || [];
  const pid = mapPlace(mapId);
  if (pid) return places.find((p) => p.id === pid) || null;
  return places.find((p) => (p.mapIds || []).includes(mapId)) || null;
}

/**
 * Anillos de zona de las pistas (content/story/clueLogic.js#clueZones: segundas pistas activas) agrupados por
 * lugar del atlas: [{ placeId, x, y, clues: [ids] }] en el orden de las pistas. Las zonas sin lugar se ignoran.
 */
export function clueRings(zones, map = REGION_MAP) {
  const out = new Map();
  for (const z of zones || []) {
    const place = pointForMap(map, z?.zone);
    if (!place) continue;
    const ring = out.get(place.id) || { placeId: place.id, x: place.x, y: place.y, clues: [] };
    out.set(place.id, { ...ring, clues: [...ring.clues, z.id] });
  }
  return [...out.values()];
}

/**
 * ¿Se puede volar a ese lugar? Es un destino (`fly`) y: se ha desbloqueado por guion (flyPoints) o, salvo
 * los de `flyUnlock`, se ha visitado alguno de sus mapas (state.data.visited, que rellena setPosition).
 * Firma antigua compatible: canFlyTo(point, flyPoints).
 */
export function canFlyTo(point, flyPoints = [], visited = []) {
  if (!point || !point.fly) return false;
  if ((flyPoints || []).includes(point.id)) return true;
  if (point.flyUnlock) return false;
  return (visited || []).some((mapId) => mapPlace(mapId) === point.id || (point.mapIds || []).includes(mapId));
}

/** Destinos de Vuelo disponibles para una partida (lista de lugares). */
export function flyDestinations(state, map = REGION_MAP) {
  const d = state?.data || {};
  return (map.places || []).filter((p) => canFlyTo(p, d.flyPoints, d.visited));
}

/**
 * Casilla de llegada del Vuelo a un lugar: { mapId, x, y, dir }. La da la definición del mapa principal
 * del lugar (`flyPoint: { x, y, dir }`, normalmente delante del Centro Pokémon) o, si no la tiene, su
 * `start`. loadDef(id) → definición (content/maps/index.js#loadMapDefinition). null si el mapa no existe.
 */
export async function resolveFlyTarget(placeId, loadDef) {
  const place = placeById(placeId);
  if (!place || !place.fly) return null;
  let def = null;
  try {
    def = await loadDef(place.id);
  } catch {
    return null;
  }
  if (!def) return null;
  const spot = def.flyPoint || def.start || {};
  return {
    mapId: def.id || place.id,
    x: Number.isInteger(spot.x) ? spot.x : undefined,
    y: Number.isInteger(spot.y) ? spot.y : undefined,
    dir: spot.dir || 2,
  };
}

// ---------------------------------------------------------------- marcas (células de Zygarde, etc.)
const markProviders = [];

/**
 * Registra un proveedor de marcas para el mapa regional: (state, atlas) → [{ mapId | placeId | id, kind,
 * count | remaining, found?, total?, crisis? }]. Las células de Zygarde llegan por
 * world/zygarde/detection.js#regionPointMarks (la pantalla las pide sola).
 */
export function registerRegionMarks(fn) {
  if (typeof fn !== 'function') throw new Error('registerRegionMarks: se esperaba una función');
  if (!markProviders.includes(fn)) markProviders.push(fn);
}

/**
 * Marcas agrupadas por lugar: Map(placeId → [{ kind, count, found, total, crisis }]). `count` = lo que queda por
 * encontrar (células restantes). Acepta { placeId | id | mapId, … }. Nunca lanza.
 */
export function regionMarks(state, map = REGION_MAP, extra = []) {
  const out = new Map();
  const add = (m) => {
    if (!m) return;
    const pid = m.placeId || m.id || (m.mapId ? mapPlace(m.mapId) : null);
    if (!pid) return;
    if (!out.has(pid)) out.set(pid, []);
    out.get(pid).push({
      kind: m.kind || 'cell', count: m.count ?? m.remaining ?? 1, found: m.found ?? null, total: m.total ?? null, crisis: Boolean(m.crisis),
    });
  };
  for (const fn of markProviders) {
    try {
      for (const m of fn(state, map) || []) add(m);
    } catch (err) {
      console.warn('[mapa regional] proveedor de marcas con error', err);
    }
  }
  for (const m of extra || []) add(m);
  return out;
}
