// Stamps y brushes del tileset 4 (Interior1) — casas, laboratorio y edificios interiores de Axis.
// Formato: docs/ARCHITECTURE.md §5 y docs/stamps.md. Tras editar: node tools/stamps_bake.mjs Interior1
// y revisar la hoja: node tools/preview_stamps.mjs Interior1
//
// Flujo típico de una habitación: brush `vacio` en todo el mapa → brush `habitacion_casa` (o `habitacion_lab`)
// sobre el rectángulo de paredes+suelo (3 filas de pared) → stamp de salida centrado en la fila inferior →
// muebles de pared (capa 2) en las filas de pared y muebles de suelo encima.
// Los muebles de este tileset son GRÁFICOS: la interacción (PC, TV, estantería…) la ponen los eventos del mapa.
// Museo, laboratorio grande, estación, grandes almacenes, oficinas e industria: interior1_extras.js.
import { INTERIOR1_EXTRAS } from './interior1_extras.js';

const WOOD_FRAME = {
  tl: 4195, t: 4201, tr: 4196, l: 4194, r: 4192,
  bl: [4224, 4225], br: [4226, 4227], bl2: [4232, 4233], br2: [4234, 4235], b: 4185,
};
const WHITE_FRAME = {
  tl: 4139, t: 4145, tr: 4140, l: 4138, r: 4136,
  bl: [4152, 4153], br: [4154, 4155], bl2: [4160, 4161], br2: [4162, 4163], b: 4129,
};

export default {
  tileset: 4,
  image: 'Interior1',
  preview: { ground: 'suelo_madera' },
  stamps: {
    // ─── Salidas (se colocan con la esquina en (puertaX - 2, fila inferior del suelo)) ───────────
    salida_casa: {
      tiles: { w: 5, h: 2, layers: [null, null, [0, 424, 425, 426, 0, 4205, 432, 433, 434, 4206]] },
      door: [2, 1], tags: ['salida'], desc: 'Hueco en el marco de madera con felpudo rojo (salida de casa, 3 casillas de ancho)',
    },
    salida_lab: {
      tiles: { w: 4, h: 2, layers: [null, null, [0, 408, 409, 0, 4149, 416, 417, 4150]] },
      door: [1, 1], tags: ['salida'], desc: 'Hueco en el marco blanco con felpudo rojo (salida de laboratorio, 2 de ancho)',
    },

    // ─── Dormitorio ─────────────────────────────────────────────────────────────────────────
    cama: { src: [5, 19, 3, 4], layer: 2, solid: true, tags: ['dormitorio'], desc: 'Cama de matrimonio morada (3×4)' },
    cama_individual: { src: [4, 0, 3, 3], layer: 2, solid: true, tags: ['dormitorio'], desc: 'Cama/colchoneta verde menta sin cabecero (3×3)' },
    escritorio_pc: { from: { map: 28, x: 24, y: 4, w: 3, h: 3, layers: [2] }, solid: true, tags: ['dormitorio', 'pc'], desc: 'Escritorio con PC y silla verde (3×3)' },
    comoda: { src: [4, 19, 1, 2], layer: 2, solid: true, tags: ['dormitorio'], desc: 'Cómoda con cajones' },
    estanteria_naranja: { src: [3, 15, 1, 2], layer: 2, solid: true, tags: ['dormitorio', 'libros'], desc: 'Estantería naranja estrecha' },
    armario_lateral: { src: [3, 24, 1, 4], layer: 2, solid: true, tags: ['dormitorio'], desc: 'Armario alto visto de lado (pared izquierda)' },
    consola: { src: [4, 18, 2, 1], layer: 2, tags: ['salon'], desc: 'Videoconsola en el suelo' },

    // ─── Salón y cocina ─────────────────────────────────────────────────────────────────────
    tele: { src: [0, 14, 2, 2], layer: 2, solid: true, tags: ['salon'], desc: 'Televisor sobre mueble (2×2)' },
    mesa_comedor: {
      tiles: { w: 5, h: 3, layers: [null, null, [483, 472, 473, 474, 484, 491, 480, 481, 482, 492, 0, 488, 489, 490, 0]] },
      solid: true, tags: ['salon', 'cocina'], desc: 'Mesa de comedor con mantel y dos sillas (5×3)',
    },
    sofa: { src: [2, 19, 2, 5], layer: 2, solid: true, tags: ['salon'], desc: 'Sofá azul vertical (pared derecha)' },
    vitrina: { src: [0, 16, 2, 3], layer: 2, solid: true, tags: ['salon'], desc: 'Vitrina de madera con cristal' },
    estanteria_roja: { src: [5, 38, 2, 3], layer: 2, solid: true, tags: ['salon', 'libros'], desc: 'Estantería roja con libros (2×3)' },
    nevera: { src: [5, 12, 1, 3], layer: 2, solid: true, tags: ['cocina'], desc: 'Nevera blanca' },
    fregadero: { src: [6, 14, 2, 3], layer: 2, solid: true, tags: ['cocina'], desc: 'Fregadero y encimera (2×3)' },
    sartenes: { src: [4, 15, 2, 2], layer: 2, tags: ['cocina', 'pared'], desc: 'Sartenes colgadas (va sobre la pared)' },
    taza: { src: [3, 11, 1, 1], layer: 2, stack: true, tags: ['cocina', 'sobre_mueble'], desc: 'Taza (se apila sobre una mesa)' },

    // ─── Decoración ─────────────────────────────────────────────────────────────────────────
    planta: { src: [7, 0, 1, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Planta en maceta (1×2)' },
    planta_alta: { src: [7, 4, 1, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Planta alta enredadera (1×2)' },
    papelera: { src: [7, 2, 1, 1], layer: 2, solid: true, tags: ['decoracion'], desc: 'Papelera roja' },
    cuadro: { src: [7, 3, 1, 1], layer: 2, tags: ['pared', 'decoracion'], desc: 'Cuadro pequeño (pared)' },
    reloj_pared: { src: [7, 6, 1, 1], layer: 2, tags: ['pared', 'decoracion'], desc: 'Reloj de pared gris' },
    ventana_cortinas: { src: [3, 44, 2, 2], layer: 1, tags: ['pared'], desc: 'Ventana con cortinas azules (pared, 2×2)' },
    ventana: { src: [2, 1, 2, 1], layer: 1, tags: ['pared'], desc: 'Ventana de cristal azul (pared)' },
    escalera_subir_der: { from: { map: 28, x: 13, y: 4, w: 2, h: 3, layers: [1, 2] }, door: [1, 1], tags: ['escalera'], desc: 'Escalera que sube, pegada a la pared derecha (warp en door)' },
    escalera_subir_izq: { from: { map: 28, x: 2, y: 25, w: 2, h: 3, layers: [1, 2] }, door: [0, 1], tags: ['escalera'], desc: 'Escalera que sube, pegada a la pared izquierda' },
    escalera_bajar_der: { src: [6, 7, 2, 3], layer: 1, door: [0, 1], tags: ['escalera'], desc: 'Escalera que baja (planta alta), pared derecha' },
    escalera_bajar_izq: { from: { map: 28, x: 24, y: 25, w: 2, h: 3, layers: [1] }, door: [1, 1], tags: ['escalera'], desc: 'Escalera que baja (planta alta), pared izquierda' },

    // ─── Centro Pokémon / edificios públicos ─────────────────────────────────────────────────
    mostrador_centro: {
      from: { map: 31, x: 7, y: 2, w: 7, h: 9, layers: [1, 2] }, skip: [[0, 0], [6, 0]], solid: true, tags: ['centro'],
      desc: 'Mostrador del Centro Pokémon con máquina curativa, hueco de la trastienda y logotipo en el suelo (7×9; la fila 0 va sobre la 1ª fila de pared)',
    },
    pc_centro: { src: [0, 147, 2, 3], layer: 2, solid: true, tags: ['centro', 'pc'], desc: 'Terminal PC de almacenamiento (2×3)' },

    // ─── Laboratorio ────────────────────────────────────────────────────────────────────────
    maquina_lab: { src: [0, 40, 3, 5], layer: 2, solid: true, tags: ['laboratorio'], desc: 'Máquina de laboratorio con cápsula turquesa (3×5)' },
    pizarras: { src: [0, 32, 4, 2], layer: 2, tags: ['laboratorio', 'pared'], desc: 'Pizarras con gráficas (pared, 4×2)' },
    estanteria_lab: { src: [5, 67, 2, 3], layer: 2, solid: true, tags: ['laboratorio', 'libros'], desc: 'Estantería blanca con libros (2×3)' },
    fotocopiadora: { src: [3, 37, 2, 2], layer: 2, solid: true, tags: ['laboratorio'], desc: 'Aparato blanco (fotocopiadora/analizador)' },
    ventanal_lab: { src: [4, 46, 1, 2], layer: 2, tags: ['laboratorio', 'pared'], desc: 'Ventanal azul de laboratorio (pared)' },
    lab_ordenadores: { from: { map: 29, x: 10, y: 7, w: 5, h: 4, layers: [2] }, solid: true, tags: ['laboratorio', 'pc'], desc: 'Banco de ordenadores del laboratorio (5×4)' },
    lab_zona_maquina: { from: { map: 29, x: 5, y: 5, w: 5, h: 7, layers: [0, 1, 2] }, solid: true, tags: ['laboratorio'], desc: 'Zona elevada con máquina y ordenador (5×7, incluye suelo)' },
    mesa_lab_verde: { src: [5, 74, 3, 2], layer: 1, solid: true, tags: ['laboratorio'], desc: 'Mesa de trabajo verde (3×2)' },

    ...INTERIOR1_EXTRAS.stamps,
  },

  brushes: {
    vacio: { tile: 384, layer: 0, desc: 'Negro de fuera de la habitación' },
    suelo_madera: { tile: 418, layer: 0, desc: 'Suelo de parqué' },
    suelo_lab: { tile: 659, layer: 0, desc: 'Suelo ajedrezado de laboratorio' },
    habitacion_casa: {
      room: { wall: [[717, 718, 719], [725, 726, 727], [733, 734, 735]], floor: 418, floorShade: 419, void: 384, frame: WOOD_FRAME },
      desc: 'Habitación de casa: 3 filas de pared, parqué y marco de madera',
    },
    habitacion_lab: {
      room: { wall: [[656, 657, 658], [664, 665, 666], [672, 673, 674]], floor: 659, floorShade: 660, void: 384, frame: WHITE_FRAME },
      desc: 'Habitación de laboratorio: pared verde claro, suelo ajedrezado y marco blanco',
    },
    alfombra_roja: { nine: [4, 3], layer: 1, desc: 'Alfombra roja de cuadros' },
    alfombra_verde: { nine: [3, 28], layer: 1, desc: 'Alfombra verde' },
    alfombra_azul: { nine: [0, 83], layer: 1, desc: 'Alfombra azul con ribete dorado' },
    alfombra_granate: { nine: [0, 86], layer: 1, desc: 'Alfombra granate con ribete dorado' },
    alfombra_lila: { nine: [3, 154], layer: 1, desc: 'Alfombra lila con puntilla' },
    alfombra_beige: { nine: [3, 151], layer: 1, desc: 'Alfombra beige con estrella' },
    ...INTERIOR1_EXTRAS.brushes,
  },
};
