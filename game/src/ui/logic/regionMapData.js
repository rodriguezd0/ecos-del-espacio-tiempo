// Datos del mapa de la región: ESTRUCTURA con datos de relleno. El atlas de Axis (nombres de rutas y
// ciudades, forma de la región) está PENDIENTE (X02): nada de esto es canon. Sustituir cuando el autor
// lo decida; la pantalla solo depende del formato.
//
// Formato:
//   grid: 20 filas × 30 columnas ('.' mar, '#' tierra, '=' ruta) en casillas de 16 px (480×320 px)
//   points: [{ id, name, x, y, mapIds: [idDeMapa...], fly: bool }]  (x, y en casillas)
//   routes: [[idA, idB], ...] líneas entre puntos

export const REGION_MAP = {
  provisional: 'X02',
  name: 'Axis',
  grid: [
    '..............................',
    '..............................',
    '........#####.......####......',
    '......#########....######.....',
    '.....###########..########....',
    '....#######################...',
    '....########################..',
    '...#########################..',
    '...########################...',
    '...#######################....',
    '....#####################.....',
    '....####################......',
    '.....##################.......',
    '.....#################........',
    '......###############.........',
    '.......#############..........',
    '........##########............',
    '..........######..............',
    '..............................',
    '..............................',
  ],
  points: [
    { id: 'lugar_1', name: 'Lugar provisional 1', x: 8, y: 13, mapIds: [], fly: true },
    { id: 'lugar_2', name: 'Lugar provisional 2', x: 12, y: 8, mapIds: [], fly: true },
    { id: 'lugar_3', name: 'Lugar provisional 3', x: 19, y: 6, mapIds: [], fly: true },
    { id: 'lugar_4', name: 'Lugar provisional 4', x: 23, y: 10, mapIds: [], fly: true },
    { id: 'lugar_5', name: 'Lugar provisional 5', x: 15, y: 14, mapIds: [], fly: true },
  ],
  routes: [['lugar_1', 'lugar_2'], ['lugar_2', 'lugar_3'], ['lugar_3', 'lugar_4'], ['lugar_2', 'lugar_5'], ['lugar_5', 'lugar_4']],
};

/** Punto en la casilla (x, y) o null. */
export function pointAt(map, x, y) {
  return map.points.find((p) => p.x === x && p.y === y) || null;
}

/** Punto que contiene el mapa `mapId` (posición del jugador) o null. */
export function pointForMap(map, mapId) {
  if (!mapId) return null;
  return map.points.find((p) => (p.mapIds || []).includes(mapId)) || null;
}

/** ¿Se puede volar a ese punto con los puntos de vuelo desbloqueados? */
export function canFlyTo(point, flyPoints = []) {
  return Boolean(point && point.fly && flyPoints.includes(point.id));
}
