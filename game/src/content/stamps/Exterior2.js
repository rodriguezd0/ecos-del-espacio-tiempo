// Stamps y brushes del tileset 3 (Exterior2), derivados de ExteriorBosqueCeleste.
// Solo las piezas idénticas píxel a píxel (node tools/stamps_compat.mjs 7 3) más las revisadas a ojo con
// `preview_stamps ExteriorBosqueCeleste --as=3` (acantilado marrón, valla vertical, hierba y flores).
// Propias (ciudad grande, mercado, cementerio, puerto): exterior23_extras.js.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';
import { COMMON, EXT2 } from './exterior23_extras.js';
import { extraDefs } from './extraTiles.js';

const KIT = extraDefs('Exterior2'); // grava, barro y zócalos (tiles propios del overlay)

export const SHARED_STAMPS = ['centro_pokemon', 'edificio_turquesa_ancho', 'granero_verde', 'arbol', 'pino', 'arbol_alto',
  'pino_alto', 'roca_gris', 'roca_agua', 'tocon', 'guijarros', 'brotes', 'flores_rosas', 'flores_blancas', 'macizo_flores',
  'lupinos', 'arbustos', 'entrada_mina', 'barrera_obras', 'meseta_hierba', 'escalera_diagonal', 'cartel_madera',
  'tablon_anuncios', 'tablon_anuncios_2', 'cartel_ruta', 'papelera', 'buzon_azul', 'buzon_rojo', 'maquinas_expendedoras',
  'farola', 'columpio', 'estatua', 'estatua_2', 'fuente_grande', 'flor_amarilla_grande', 'flor_lila_grande',
  'escalera_terraza', 'escalera_terraza_ancha', 'jardinera_flores', 'troncos', 'placa_piedra', 'seto_marco', 'seto_corto',
  'jardin_vallado', 'seto_largo'];
export const SHARED_BRUSHES = ['cesped', 'cesped_claro', 'camino_arena', 'camino_tierra', 'agua', 'bosque', 'bosque_pinos',
  'bosque_mixto', 'terraza', 'estanque', 'saliente', 'valla_blanca', 'valla_blanca_v'];

const T = (x, y) => 384 + y * 8 + x;

export const EXTRA_BRUSHES = {
  hierba_alta: { tile: 388, layer: 1, desc: 'Hierba alta clásica (encuentros, tag Grass)' },
  hierba_alta_oscura: { ...base.brushes.hierba_alta, desc: 'Hierba alta de hojas oscuras (encuentros)' },
  flores_amarillas: { autotile: 2, layer: 1, desc: 'Flores amarillas animadas' },
  acantilado: { ...base.brushes.acantilado, desc: 'Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas' },
  cascada: { autotile: 0, layer: 2, desc: 'Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo' },
  playa: { edge2: { src: [0, 366] }, layer: 1, desc: 'Playa de arena con espuma sobre el agua (borde doble; formas convexas)' },
  orilla: { nine: [0, 489], inner: [3, 489], fill: 0, layer: 1, desc: 'Orilla de hierba del agua (misma máscara que `agua`)' },
  suelo_ciudad: { tile: T(1, 475), variants: [T(2, 475), T(1, 476), T(2, 476)], chance: 0.5, layer: 0, desc: 'Losas de piedra gris de ciudad' },
  adoquin: { tile: T(0, 456), layer: 0, desc: 'Adoquinado de calle' },
};

export default deriveLibrary(base, {
  tileset: 3,
  image: 'Exterior2',
  stamps: { include: SHARED_STAMPS, add: { ...COMMON, ...EXT2, ...KIT.stamps } },
  brushes: { include: SHARED_BRUSHES, add: { ...EXTRA_BRUSHES, ...KIT.brushes } },
});
