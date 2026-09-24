// Piezas de Interior1 (tileset 4) para interiores especiales de la campaña: museo con vitrinas (Museo de las
// Eras de Lúmina), laboratorio/estación de investigación (Estación Talasa), estación de tren, grandes
// almacenes, oficinas (Consorcio), central/instalación industrial (Genesis) y marcos de sala de colores.
// Salas completas = recortes probados de mapas de Añil del mismo tileset (se usan como plantilla: después se
// sustituyen los muebles o se añaden eventos). Se mezclan en Interior1.js.
const T = (x, y) => 384 + y * 8 + x;

/** Marco de habitación (brush `room`) de un color: bloque de 7 filas desde `r` (filas 468+ del tileset). */
export const frameAt = (r) => ({
  tl: T(3, r + 1), t: T(1, r + 2), tr: T(4, r + 1), l: T(2, r + 1), r: T(0, r + 1),
  bl: [T(0, r + 3), T(1, r + 3)], br: [T(2, r + 3), T(3, r + 3)],
  bl2: [T(0, r + 4), T(1, r + 4)], br2: [T(2, r + 4), T(3, r + 4)], b: T(1, r),
});

const stamps = {
  // ─── Museo ────────────────────────────────────────────────────────────────────────────────
  vitrina_museo: { src: [0, 96, 3, 2], layer: 2, solid: true, tags: ['museo'], desc: 'Vitrina alargada de cristal sobre peana (3×2)' },
  vitrina_estrecha: { src: [7, 96, 1, 2], layer: 2, solid: true, tags: ['museo'], desc: 'Vitrina estrecha (1×2)' },
  fosil_pedestal: { src: [3, 96, 2, 2], layer: 2, solid: true, tags: ['museo', 'fosil'], desc: 'Fósil de concha sobre pedestal (2×2)' },
  fosil_pedestal_2: { src: [5, 96, 2, 2], layer: 2, solid: true, tags: ['museo', 'fosil'], desc: 'Fósil sobre pedestal blanco (2×2)' },
  esqueleto_fosil: { src: [0, 99, 3, 3], layer: 2, solid: true, tags: ['museo', 'fosil'], desc: 'Esqueleto fósil sobre peana (3×3)' },
  esqueleto_fosil_2: { src: [3, 99, 2, 3], layer: 2, solid: true, tags: ['museo', 'fosil'], desc: 'Esqueleto fósil de cola larga (2×3)' },
  panel_informativo: { src: [5, 105, 2, 2], layer: 2, tags: ['museo', 'pared'], desc: 'Panel informativo iluminado (pared, 2×2)' },
  vitrinas_joyas: { src: [5, 108, 2, 2], layer: 2, solid: true, tags: ['museo'], desc: 'Dos vitrinas pequeñas con gemas (2×2)' },
  cordon_museo: { from: { map: 40, x: 15, y: 4, w: 7, h: 6, layers: [2] }, tags: ['museo'], desc: 'Exposición acordonada con postes y cordón rojo (7×6)' },
  museo_sala: { from: { map: 40, x: 1, y: 1, w: 35, h: 19, layers: [0, 1, 2] }, tags: ['museo', 'sala'], desc: 'Sala de museo completa: vitrinas, fósiles, cordones, maqueta y recepción (35×19)' },
  museo_galeria: { from: { map: 40, x: 1, y: 27, w: 28, h: 16, layers: [0, 1, 2] }, tags: ['museo', 'sala'], desc: 'Galería de museo con vitrinas, maqueta de cohete y escalera (28×16)' },

  // ─── Laboratorio / estación de investigación ───────────────────────────────────────────────
  laboratorio_grande: { from: { map: 118, x: 1, y: 1, w: 33, h: 19, layers: [0, 1, 2] }, tags: ['laboratorio', 'sala'], desc: 'Laboratorio grande con máquinas, ordenadores y probetas (33×19)' },
  laboratorio_sala: { from: { map: 118, x: 1, y: 25, w: 18, h: 16, layers: [0, 1, 2] }, tags: ['laboratorio', 'sala'], desc: 'Sala de laboratorio (18×16)' },
  laboratorio_sala_2: { from: { map: 118, x: 26, y: 25, w: 18, h: 16, layers: [0, 1, 2] }, tags: ['laboratorio', 'sala'], desc: 'Sala de laboratorio con equipos (18×16)' },
  laboratorio_sala_3: { from: { map: 118, x: 51, y: 25, w: 18, h: 16, layers: [0, 1, 2] }, tags: ['laboratorio', 'sala'], desc: 'Sala de laboratorio con cápsulas (18×16)' },

  // ─── Instalación industrial (Genesis, minas) ──────────────────────────────────────────────
  central_generador: { from: { map: 150, x: 32, y: 6, w: 15, h: 14, layers: [0, 1, 2] }, tags: ['industria', 'sala'], desc: 'Sala del generador con marco dorado (15×14; Central/instalación de Genesis)' },
  central_almacen: { from: { map: 150, x: 70, y: 17, w: 25, h: 19, layers: [0, 1, 2] }, tags: ['industria', 'sala'], desc: 'Almacén industrial con contenedores, bidones y conos (25×19)' },
  central_pasillo: { from: { map: 150, x: 4, y: 28, w: 21, h: 14, layers: [0, 1, 2] }, tags: ['industria', 'sala'], desc: 'Pasillo industrial en L con maquinaria (21×14)' },

  // ─── Ciudad: estación, almacenes, oficinas ────────────────────────────────────────────────
  estacion_tren: { from: { map: 145, x: 1, y: 1, w: 27, h: 17, layers: [0, 1, 2] }, door: [13, 16], tags: ['estacion', 'sala'], desc: 'Estación de tren: andén con vagón, bancos, máquina expendedora y taquilla (27×17)' },
  grandes_almacenes: { from: { map: 78, x: 1, y: 1, w: 19, h: 18, layers: [0, 1, 2] }, tags: ['tienda', 'sala'], desc: 'Planta baja de grandes almacenes con mostradores y escaleras (19×18)' },
  grandes_almacenes_planta: { from: { map: 78, x: 26, y: 1, w: 18, h: 17, layers: [0, 1, 2] }, tags: ['tienda', 'sala'], desc: 'Planta de grandes almacenes con estanterías (18×17)' },
  oficinas: { from: { map: 100, x: 1, y: 2, w: 39, h: 25, layers: [0, 1, 2] }, tags: ['oficina', 'sala'], desc: 'Planta de oficinas con mesas, ordenadores y recepción (39×25; Consorcio)' },
};

const brushes = {
  habitacion_blanca: {
    room: { wall: [[717, 718, 719], [725, 726, 727], [733, 734, 735]], floor: 418, floorShade: 419, void: 384, frame: frameAt(468) },
    desc: 'Habitación de casa con marco blanco (el marco de museo y laboratorio)',
  },
  habitacion_museo: {
    room: { wall: [[656, 657, 658], [664, 665, 666], [672, 673, 674]], floor: T(1, 110), floorShade: T(0, 110), void: 384, frame: frameAt(468) },
    desc: 'Sala de museo: pared clara, suelo de madera oscura y marco blanco',
  },
};

export const INTERIOR1_EXTRAS = { stamps, brushes };
