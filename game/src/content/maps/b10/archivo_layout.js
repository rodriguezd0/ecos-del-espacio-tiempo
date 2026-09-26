// Coordenadas del Archivo de papel de Mnemos (mnemos_archivo, tileset 4): la sala de lectura sobre el Archivo Hondo,
// donde Genesis «digitaliza» las estanterías antes de que la niebla borre la tinta. Módulo puro.

export const ARCHIVO_ROOM = Object.freeze({
  width: 23,
  height: 17,
  room: Object.freeze({ x: 1, y: 1, w: 21, h: 15 }), // paredes y 4–15 de suelo
  entry: Object.freeze({ x: 11, y: 15 }), // felpudo de la salida (llegada desde la aldea)
  stairs: Object.freeze({ stamp: 'escalera_bajar_der', x: 19, y: 4 }), // warp en (19,5) → Archivo Hondo
  stairsWarp: Object.freeze({ x: 19, y: 5 }),
  stairsArrival: Object.freeze({ x: 18, y: 6, dir: 2 }), // al subir del Archivo Hondo
  // Estanterías (estanteria_roja 2×3) en pasillos: la base bloquea.
  stacks: Object.freeze([[3, 7], [5, 7], [3, 11], [5, 11], [15, 7], [17, 7], [15, 11], [17, 11]]),
  wallShelves: Object.freeze([[3, 2], [5, 2], [7, 2], [14, 2]]), // (x 9–13: los ordenadores)
  scanners: Object.freeze([Object.freeze({ x: 9, y: 7 }), Object.freeze({ x: 12, y: 7 })]), // fotocopiadora 2×2
  table: Object.freeze({ x: 9, y: 11 }), // mesa de lectura (mesa_lab_verde 3×2)
  // Personajes
  casia: Object.freeze({ x: 11, y: 10, dir: 8 }),
  olvido: Object.freeze({ x: 12, y: 14, dir: 8 }),
  olvidoTable: Object.freeze({ x: 10, y: 13, dir: 8 }), // tras el P5, leyendo el informe
  playerTable: Object.freeze({ x: 11, y: 14, dir: 8 }),
  tecnico: Object.freeze({ x: 7, y: 10, dir: 6 }),
  tecnica: Object.freeze({ x: 17, y: 10, dir: 4 }),
});
