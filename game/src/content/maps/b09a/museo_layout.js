// Museo de las Eras (Ciudad Lúmina; TABLILLAS §4.6): FUENTE ÚNICA de las coordenadas de sus tres mapas. Módulo puro.
//   lumina_museo          planta baja (stamp museo_sala 35×19): vestíbulo, fósiles, máquina de revivir y escalera
//                         al sótano (solo personal hasta la noche de T06)
//   lumina_museo_galeria  primera planta (stamp museo_galeria 28×16) + la sala «Antea, la ciudad de antes»
//                         (clausurada hasta la noche de T06) y la Sala de las Crónicas (abre tras T06)
//   lumina_museo_taller   sótano: Sala de Réplicas, taller (báscula), archivo y muelle de carga con la furgoneta
// Casillas comprobadas con la pasabilidad real de los stamps de Interior1.

export const HALL = Object.freeze({
  W: 35, H: 19,
  exits: [{ x0: 18, x1: 20, y: 17 }, { x0: 27, x1: 29, y: 17 }], // felpudos de la fachada (se pisan)
  stairsUp: { x: 9, y: 15 }, // escalera a la galería
  fromGallery: { x: 8, y: 15, dir: 4 },
  stairsDown: { x: 31, y: 13 }, // escalera_bajar_der (2×3); la casilla que se pisa es (31,14)
  stairsDownTile: { x: 31, y: 14 },
  fromBasement: { x: 30, y: 15, dir: 8 },
  rosaliaNight: { x: 19, y: 12, dir: 2 },
  rosaliaDay: { x: 12, y: 12, dir: 2 },
  desk: { x: 17, y: 14, dir: 2 }, // recepcionista (de día)
  scientist: { x: 27, y: 6, dir: 2 }, // paleontólogo junto a la máquina de revivir
  guard: { x: 30, y: 14, dir: 4 }, // vigilante: tapa el paso a la escalera del personal hasta la noche de T06
  exhibits: { vitrinas: [5, 7], vitrinas2: [5, 10], fossils: [16, 7], pots: [11, 7], machine: [25, 5] },
});

export const GALLERY = Object.freeze({
  W: 48, H: 16,
  stairs: [[17, 13], [18, 13]], // escalera de bajada
  fromHall: { x: 19, y: 13, dir: 4 },
  antea: { room: [31, 1, 7, 12], door: { x: 34, y: 12 }, alcoves: [[2, 4], [3, 4], [5, 4], [6, 4]], arrival: { x: 34, y: 11, dir: 8 }, back: { x: 4, y: 5, dir: 2 } },
  cronicas: { room: [41, 1, 6, 12], door: { x: 43, y: 12 }, alcoves: [[21, 4], [22, 4], [24, 4], [25, 4]], arrival: { x: 43, y: 11, dir: 8 }, back: { x: 23, y: 5, dir: 2 } },
  photo: { x: 14, y: 3 }, // foto de la excavación (pared de la galería, sobre el panel)
  vitrine: { x: 34, y: 4 }, // vitrina vacía de la losa (Sala Antea; stamp vitrina_museo en 33,3)
  plaque: { x: 32, y: 3 }, // calco del borde (pared de la Sala Antea)
  kingPanel: { x: 36, y: 3 }, // panel del Rey (tras T06)
  panelWall: { x0: 41, x1: 46, y: 3 }, // paneles de la Crónica (pared de la Sala de las Crónicas)
  rosaliaCronicas: { x: 44, y: 10, dir: 2 },
  rocket: { x: 20, y: 7 },
  showcase: { x: 4, y: 7 },
  visitor: { x: 12, y: 9 },
});

export const BASEMENT = Object.freeze({
  W: 32, H: 20,
  stairsUp: { x: 2, y: 4 }, // casilla de la escalera (subir: vuelve a la planta baja)
  arrival: { x: 3, y: 5, dir: 2 },
  // Sala de Réplicas: seis palés en dos filas; Rosalía vigila desde la puerta
  pallets: [[4, 7], [7, 7], [10, 7], [4, 11], [7, 11], [10, 11]],
  roomEntry: { x: 7, y: 13, dir: 8 }, // casilla de reinicio de la sala
  rosalia: { x: 12, y: 13, dir: 4 },
  // Taller
  scale: { x: 20, y: 5 }, // báscula (se usa desde abajo)
  eevee: { x: 27, y: 7 },
  bench: { x: 17, y: 8 },
  // Archivo (estanterías en y 14–15; las fichas se consultan desde la fila 16)
  ficha1962: { x: 3, y: 15 },
  fichaLaguna: { x: 7, y: 15 },
  rosaliaArchive: { x: 10, y: 16, dir: 4 }, // tras T06, hasta que se lee la ficha de la Laguna Clara
  // Muelle de carga
  van: { x: 27, y: 16 },
  vanBlock: [25, 13, 6, 4], // huella de la furgoneta (x, y, w, h)
  restorers: [{ x: 22, y: 14, dir: 4 }, { x: 22, y: 16, dir: 4 }],
  crate: { x: 23, y: 15 },
  dockEntry: { x: 17, y: 15, dir: 6 }, // casilla de reintento del combate del muelle
  dockExit: [{ x: 29, y: 17 }, { x: 30, y: 17 }],
});
