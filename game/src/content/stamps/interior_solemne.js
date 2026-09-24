// Bibliotecas de los interiores solemnes: tileset 11 (InteriorTorre) y 8 (InteriorLiga). Ambos comparten con
// Interior1 las filas 0–214 (muebles; lista comprobada con node tools/stamps_compat.mjs 4 11 / 4 8) y añaden:
// salas de la Liga (fuego, hielo, sombra, trono dorado, campeón), vestíbulo solemne, arena, emblemas, alfombras
// reales y marcos de sala de 7 colores. Encima, el kit común de Pilar (overlay, extraTiles.js).
// Uso: Archivo Hondo (P5, 11), Santuario del Alma (P8, 11), Cámara del Cruce y Pilar del Origen (P9–P10, 8),
// Bastión Axis (8), Columna Lanza (8).
import base from './Interior1.js';
import { deriveLibrary } from './derive.js';
import { extraDefs } from './extraTiles.js';
import { frameAt } from './interior1_extras.js';

const T = (x, y) => 384 + y * 8 + x;

const SHARED_STAMPS = ['cama', 'cama_individual', 'escritorio_pc', 'comoda', 'estanteria_naranja', 'armario_lateral', 'consola',
  'tele', 'mesa_comedor', 'sofa', 'vitrina', 'estanteria_roja', 'nevera', 'fregadero', 'sartenes', 'taza', 'planta', 'planta_alta',
  'papelera', 'cuadro', 'reloj_pared', 'ventana_cortinas', 'ventana', 'escalera_subir_der', 'escalera_subir_izq', 'escalera_bajar_der',
  'escalera_bajar_izq', 'pc_centro', 'maquina_lab', 'pizarras', 'estanteria_lab', 'ventanal_lab', 'lab_ordenadores', 'lab_zona_maquina',
  'vitrina_museo', 'vitrina_estrecha', 'fosil_pedestal', 'fosil_pedestal_2', 'esqueleto_fosil', 'esqueleto_fosil_2',
  'panel_informativo', 'vitrinas_joyas'];
const SHARED_BRUSHES = ['vacio', 'suelo_madera', 'suelo_lab', 'alfombra_roja', 'alfombra_verde', 'alfombra_azul', 'alfombra_granate',
  'alfombra_lila', 'alfombra_beige'];

/** Marcos de sala por color (fila del bloque en la imagen). */
export const FRAMES = { blanco: 468, marron: 475, naranja: 482, azul: 489, pizarra: 496, dorado: 503, morado: 510 };
const SOLEMN_WALL = [[T(0, 196), T(1, 196), T(2, 196)], [T(0, 197), T(1, 197), T(2, 197)], [T(0, 198), T(1, 198), T(2, 198)]];

function solemnRooms(floorDesc) {
  const out = {};
  for (const [color, row] of Object.entries(FRAMES)) {
    out[`sala_${color}`] = {
      room: { wall: SOLEMN_WALL, floor: T(0, 580), floorShade: T(0, 581), void: 384, frame: frameAt(row) },
      desc: `Sala solemne: pared de mármol con zócalo, ${floorDesc} y marco ${color} (para recintos de Pilar)`,
    };
  }
  return out;
}

const COMMON_STAMPS = {
  emblema_suelo: { src: [0, 278, 5, 5], layer: 1, tags: ['solemne', 'suelo'], desc: 'Gran emblema circular en el suelo (5×5)' },
  emblema_anillo: { src: [0, 444, 4, 4], layer: 1, tags: ['solemne', 'suelo'], desc: 'Emblema de anillo azul y dorado en el suelo (4×4)' },
  trofeo: { src: [1, 284, 1, 3], layer: 2, solid: true, tags: ['solemne'], desc: 'Trofeo dorado sobre peana (1×3)' },
  estatua_busto: { src: [7, 85, 1, 3], layer: 2, solid: true, tags: ['solemne', 'estatua'], desc: 'Estatua sobre pedestal (1×3)' },
  luz_suelo: { src: [6, 279, 1, 1], layer: 2, tags: ['solemne', 'luz'], desc: 'Baldosa luminosa del suelo' },
  pantalla_pared: { src: [5, 206, 2, 2], layer: 2, tags: ['solemne', 'pared'], desc: 'Cuadro/pantalla de pared (2×2)' },
  sala_fuego: { from: { map: 172, x: 28, y: 1, w: 16, h: 22, layers: [0, 1, 2] }, tags: ['sala', 'solemne', 'fuego'], desc: 'Sala ceremonial con fosos de lava y braseros (16×22; Volcán Tizón / forja)' },
  sala_hielo: { from: { map: 172, x: 2, y: 5, w: 15, h: 18, layers: [0, 1, 2] }, tags: ['sala', 'solemne', 'hielo'], desc: 'Sala ceremonial de hielo con arcos (15×18; Santuario del Alma, Gruta Escarcha)' },
  sala_sombra: { from: { map: 172, x: 3, y: 29, w: 15, h: 17, layers: [0, 1, 2] }, tags: ['sala', 'solemne', 'sombra'], desc: 'Sala ceremonial de sombras con follaje azul (15×17; Mundo Distorsión, Archivo Hondo)' },
  sala_arena: { from: { map: 173, x: 6, y: 7, w: 13, h: 18, layers: [0, 1, 2] }, tags: ['sala', 'solemne', 'arena'], desc: 'Arena de combate con emblema, estatuas y trofeo (13×18)' },
};

const COMMON_BRUSHES = {
  suelo_solemne: { tile: T(0, 580), layer: 0, desc: 'Suelo de baldosa solemne' },
  alfombra_rombos: { nine: [0, 587], inner: [3, 587], layer: 1, desc: 'Alfombra de rombos con ribete dorado (pasillos y cruces del vestíbulo)' },
};

/**
 * @param {{ tileset: number, image: string, floorDesc: string, variant: 'torre'|'liga' }} spec
 */
export function solemnLibrary({ tileset, image, floorDesc, variant }) {
  const KIT = extraDefs(image);
  const own = {
    ...COMMON_STAMPS,
    vestibulo_solemne: {
      from: variant === 'liga' ? { map: 132, x: 1, y: 1, w: 31, h: 21, layers: [0, 1, 2] } : { map: 215, x: 1, y: 1, w: 31, h: 21, layers: [0, 1, 2] },
      door: [15, 20], tags: ['sala', 'solemne'],
      desc: `Vestíbulo solemne: mostrador, tienda, escaleras laterales, alfombra en cruz y estatuas (31×21; ${floorDesc})`,
    },
    sala_octogonal: { from: { map: 215, x: 1, y: 26, w: 13, h: 19, layers: [0, 1, 2] }, door: [6, 18], tags: ['sala', 'solemne'], desc: 'Sala octogonal con emblema central, setos y estatuas (13×19)' },
    sala_trono: { from: { map: 172, x: 29, y: 25, w: 13, h: 22, layers: [0, 1, 2] }, tags: ['sala', 'solemne', 'oro'], desc: 'Sala del trono dorada con alfombra roja y estatuas (13×22; Pilar del Origen)' },
    ...(variant === 'liga'
      ? { sala_campeon: { from: { map: 172, x: 50, y: 2, w: 11, h: 23, layers: [0, 1, 2] }, tags: ['sala', 'solemne'], desc: 'Salón alargado del campeón con alfombra roja y anillo (11×23; Columna Lanza, Bastión)' } }
      : {}),
    pasillo_real: { src: [0, 582, 8, 5], skip: [[0, 4], [1, 4]], layer: 2, tags: ['solemne', 'alfombra'], desc: `Pasillo con alfombra y barandillas doradas (8×5; ${variant === 'liga' ? 'roja' : 'azul'})` },
    ...KIT.stamps,
  };
  return deriveLibrary(base, {
    tileset,
    image,
    preview: { ground: 'suelo_solemne' },
    stamps: { include: SHARED_STAMPS, add: own },
    brushes: { include: SHARED_BRUSHES, add: { ...COMMON_BRUSHES, ...solemnRooms(floorDesc), ...KIT.brushes } },
  });
}
