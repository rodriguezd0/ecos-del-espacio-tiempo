// Fondo de la laguna de la Reserva del Delta (docs/CAMPANA.md §2.3 C088, etapa G: Buceo con la burbuja de Zygarde,
// §2.8). Tileset 15 (Cueva Azul), 22×16, oscuro. Entrada y salida por el remolino de la laguna (ruta_14_reserva,
// SPOTS.dive). La zona somera junto a la llegada no gasta la burbuja; un respiradero a medio camino (§2.8: < 40 s).
import { b09aCellEvents } from '../../events/b09a_cells.js';
import { SPOTS } from './ruta_14_layout.js';

const rect = (x, y, w, h) => Array.from({ length: w * h }, (_, i) => [x + (i % w), y + Math.floor(i / w)]);

export default {
  id: 'reserva_fondo',
  name: 'Fondo de la laguna',
  tileset: 15,
  width: 22,
  height: 16,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Sub',
  start: { x: 10, y: 9, dir: 2 },
  dark: { amount: 0.86 },
  tone: [-50, -6, 20, 30],
  noFollower: true,
  showLocation: false,
  underwater: { shallow: [[8, 7, 5, 4]] },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 3, 3, 16, 10, 'sala');
    // Lecho de la laguna: manchas de limo con musgo, matas de algas, un tronco hundido y rocas.
    for (const [x, y, w, h] of [[4, 4, 4, 3], [15, 9, 4, 3], [9, 11, 4, 2]]) b.paint('mancha', rect(x, y, w, h));
    for (const [x, y] of [[5, 10], [16, 4], [15, 10], [6, 4]]) b.stamp('roca_grande', x, y);
    for (const [s, x, y] of [
      ['matojo_cueva', 9, 4], ['matojo_cueva', 17, 7], ['roca_musgo', 11, 4], ['musgo_rocas', 4, 8],
      ['musgo_rocas', 13, 11], ['tronco_h', 8, 12], ['musgo_rocas', 3, 12], ['musgo_rocas', 17, 12],
    ]) b.stamp(s, x, y);
  },

  events: [
    { id: 'superficie', type: 'diveSpot', surface: true, x: 10, y: 9, to: 'ruta_14_reserva', tx: SPOTS.dive.x, ty: SPOTS.dive.y, dir: 2 },
    { id: 'respiradero', type: 'diveVent', x: 13, y: 8 },
    ...b09aCellEvents('reserva_fondo'),
    { id: 'objeto_fondo', type: 'item', x: 17, y: 11, item: 'PEARL', hidden: true },
  ],
};
