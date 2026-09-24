// Piezas de Cueva1 para biomas concretos: nieve y hielo (Gruta Escarcha), madera (minas, puentes), volcán
// (Volcán Tizón), agua (cuevas azules, Garganta), paredes para Trepar y salas irregulares probadas de Añil.
// Se mezclan en Cueva1.js. Coordenadas en tiles de la imagen original (ID = 384 + y*8 + x).
// Las salas `from` salen de mapas de Añil de la MISMA imagen (tilesets 2 y 12–15): en el tileset 12 el
// autotile 6 es agua helada, en el 13 lava; el resto de IDs es idéntico.
const T = (x, y) => 384 + y * 8 + x;

const stamps = {
  // ─── Nieve y hielo ───────────────────────────────────────────────────────────────────────
  montones_nieve: { src: [0, 293, 6, 2], layer: 1, tags: ['nieve', 'decoracion'], desc: 'Montoncitos de nieve dispersos (6×2, decorativos, pisables)' },
  copo_nieve: { src: [4, 292, 2, 1], layer: 1, tags: ['nieve', 'decoracion'], desc: 'Pequeño montón de nieve (2×1)' },
  cuerda: { src: [6, 294, 2, 4], layer: 2, tags: ['trepar', 'escalera'], desc: 'Cuerda colgante (bajar/subir un desnivel; evento encima)' },
  enredadera: { src: [5, 283, 1, 2], layer: 2, tags: ['trepar'], desc: 'Enredadera sobre la roca (pared escalable, Trepar)' },
  musgo_rocas: { src: [6, 282, 2, 1], layer: 2, tags: ['roca', 'decoracion'], desc: 'Rocas pequeñas con musgo (2×1)' },

  // ─── Madera: plataformas y puentes de tablones (terrain tag Bridge) ────────────────────────
  plataforma_madera: { src: [0, 298, 4, 3], layer: 1, tags: ['madera', 'puente'], desc: 'Plataforma/puente de tablones claros (4×3, terrain Bridge)' },
  plataforma_madera_oscura: { src: [5, 300, 3, 3], layer: 1, tags: ['madera', 'puente'], desc: 'Plataforma/puente de tablones oscuros (3×3, terrain Bridge)' },

  // ─── Rocas en el agua y escombros (roca rompible: usar el tile como gráfico de evento) ──────
  roca_agua_grande: { src: [4, 399, 2, 2], layer: 2, solid: true, tags: ['roca', 'agua'], desc: 'Roca grande que asoma en el agua (2×2)' },
  roca_agua: { src: [6, 399, 1, 1], layer: 2, solid: true, tags: ['roca', 'agua'], desc: 'Roca pequeña en el agua' },
  escombros: { src: [0, 398, 4, 2], layer: 2, tags: ['roca', 'escombros'], desc: `Montón de roca y cascotes (4×2). Roca rompible como evento: tileId ${T(0, 399)} (entera) → ${T(1, 399)} (cascotes)` },

  // ─── Salas irregulares probadas (recortes de mapas de Añil de esta imagen) ──────────────────
  sala_irregular: { from: { map: 13, x: 83, y: 10, w: 29, h: 15, layers: [0, 1, 2] }, tags: ['sala', 'irregular'], desc: 'Sala irregular de tierra con recodos y rocas (29×15, Monte Moon)' },
  sala_irregular_2: { from: { map: 11, x: 67, y: 59, w: 20, h: 16, layers: [0, 1, 2] }, tags: ['sala', 'irregular'], desc: 'Sala irregular pequeña con estanque (20×16, Monte Moon)' },
  sala_islote: { from: { map: 130, x: 2, y: 2, w: 29, h: 21, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'agua'], desc: 'Gruta con agua y orillas irregulares (29×21, Islas Espuma)' },
  sala_glaciar_cascada: { from: { map: 198, x: 5, y: 3, w: 28, h: 35, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'hielo', 'agua'], desc: 'Gruta helada con terrazas de nieve, cascada central y pared escalable (28×35, Cueva Glaciada; usar con tileset 12)' },
  sala_glaciar_bloques: { from: { map: 198, x: 1, y: 44, w: 33, h: 39, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'hielo'], desc: 'Gruta helada de suelo resbaladizo con rocas nevadas (33×39; tileset 12)' },
  sala_glaciar_santuario: { from: { map: 198, x: 43, y: 46, w: 29, h: 37, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'hielo', 'vestigio'], desc: 'Gruta helada con lago y santuario (29×37; tileset 12)' },
  sala_cueva_azul: { from: { map: 160, x: 4, y: 4, w: 32, h: 28, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'agua', 'gris'], desc: 'Cueva de agua azul con terrazas, estanques y cascada (32×28, Monte Plateado; usar con tileset 15)' },
  sala_cueva_azul_cascada: { from: { map: 160, x: 17, y: 42, w: 38, h: 26, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'agua', 'gris'], desc: 'Cueva azul con gran cascada y lago (38×26; tileset 15; Garganta del Albo, P2)' },
  sala_volcan_l: { from: { map: 151, x: 5, y: 2, w: 21, h: 22, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'volcan'], desc: 'Galería volcánica en L con escalones (21×22, Volcán Canela; usar con tileset 13)' },
  sala_volcan_cruz: { from: { map: 151, x: 2, y: 27, w: 19, h: 25, layers: [0, 1, 2] }, tags: ['sala', 'irregular', 'volcan'], desc: 'Galería volcánica en cruz (19×25; tileset 13)' },
};

const brushes = {
  hielo: { nine: [0, 290], layer: 1, desc: 'Placa de hielo resbaladizo con reborde (terrain Ice; mejor rectangular)' },
  nieve: { nine: [0, 295], inner: [3, 295], layer: 1, desc: 'Nieve acumulada sobre el suelo de la cueva (bordes de copos)' },
  cascada: { autotile: 0, layer: 2, desc: 'Cascada de cueva animada (autotile 0): rectángulo sobre la pared, con agua arriba y abajo' },
  pared_trepar: { tile: T(4, 283), layer: 2, desc: 'Roca con musgo para Trepar: pintar una franja sobre la pared (capa 2) y poner encima el evento climbWall' },
};

export const CAVE_EXTRAS = { stamps, brushes };
