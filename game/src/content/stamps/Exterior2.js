// Stamps y brushes del tileset 3 (Exterior2), derivados de ExteriorBosqueCeleste.
// Solo las piezas idénticas píxel a píxel (node tools/stamps_compat.mjs 7 3) más las revisadas a ojo con
// `preview_stamps ExteriorBosqueCeleste --as=3` (acantilado marrón, valla vertical, hierba y flores).
// PENDIENTE: los edificios propios de Exterior2 (tejados morados, etc.) y su orilla de agua.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';

export const SHARED_STAMPS = ['centro_pokemon', 'edificio_turquesa_ancho', 'granero_verde', 'arbol', 'pino', 'arbol_alto',
  'pino_alto', 'roca_gris', 'roca_agua', 'tocon', 'guijarros', 'brotes', 'flores_rosas', 'flores_blancas', 'macizo_flores',
  'lupinos', 'arbustos', 'entrada_mina', 'barrera_obras', 'meseta_hierba', 'escalera_diagonal', 'cartel_madera',
  'tablon_anuncios', 'tablon_anuncios_2', 'cartel_ruta', 'papelera', 'buzon_azul', 'buzon_rojo', 'maquinas_expendedoras',
  'farola', 'columpio', 'estatua', 'estatua_2', 'fuente_grande', 'flor_amarilla_grande', 'flor_lila_grande',
  'escalera_terraza', 'escalera_terraza_ancha', 'jardinera_flores', 'troncos', 'placa_piedra', 'seto_marco', 'seto_corto',
  'jardin_vallado', 'seto_largo'];
export const SHARED_BRUSHES = ['cesped', 'cesped_claro', 'camino_arena', 'camino_tierra', 'agua', 'bosque', 'bosque_pinos',
  'bosque_mixto', 'terraza', 'estanque', 'saliente', 'valla_blanca', 'valla_blanca_v'];

export const EXTRA_BRUSHES = {
  hierba_alta: { tile: 388, layer: 1, desc: 'Hierba alta clásica (encuentros, tag Grass)' },
  hierba_alta_oscura: { ...base.brushes.hierba_alta, desc: 'Hierba alta de hojas oscuras (encuentros)' },
  flores_amarillas: { autotile: 2, layer: 1, desc: 'Flores amarillas animadas' },
  acantilado: { ...base.brushes.acantilado, desc: 'Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas' },
};

export default deriveLibrary(base, {
  tileset: 3,
  image: 'Exterior2',
  stamps: { include: SHARED_STAMPS },
  brushes: { include: SHARED_BRUSHES, add: EXTRA_BRUSHES },
});
