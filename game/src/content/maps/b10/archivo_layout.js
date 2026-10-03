// Coordenadas del Archivo de papel de Mnemos (mnemos_archivo, tileset 4): primera planta bajo el Archivo Hondo,
// donde Genesis «digitaliza» las estanterías antes de que la niebla borre la tinta. Módulo puro.

export const ARCHIVO_ROOM = Object.freeze({
  width: 23,
  height: 17,
  room: Object.freeze({ x: 1, y: 1, w: 21, h: 15 }), // paredes y 4–15 de suelo
  entry: Object.freeze({ x: 11, y: 15 }), // felpudo de la salida (llegada desde la aldea)
  stairs: Object.freeze({ stamp: 'escalera_subir_der', x: 18, y: 4 }), // warp en (19,5) → recuerdos, piso 2
  stairsWarp: Object.freeze({ x: 19, y: 5 }),
  stairsArrival: Object.freeze({ x: 20, y: 5, dir: 6 }), // al bajar del Archivo Hondo, junto al lateral abierto de la escalera
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

/** Entrenadores del Pilar en la primera planta; los identificadores conservan sus derrotas. */
export const ARCHIVO_TRAINERS = Object.freeze([
  Object.freeze({ id: 'b10_investigadora_leonor', x: 7, y: 6, dir: 6, sight: 3 }),
  Object.freeze({ id: 'b10_cerebrito_ismael', x: 14, y: 6, dir: 4, sight: 3 }),
  Object.freeze({ id: 'b10_medium_remigio', x: 13, y: 10, dir: 2, sight: 3 }),
]);
