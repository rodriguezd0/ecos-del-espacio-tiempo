// Bodega de los tallistas y Cueva Sellada de la Escarcha (docs/CAMPANA.md B22: Regice, «talla de hielo con Rosendo»).
// Bajo los Talleres del Hielo de Villa Boreal: una bodega excavada en el hielo viejo donde los tallistas guardaban los
// bloques en serrín (la talla vieja en su peana y los nueve bloques en bruto) y, tras el muro de hielo que no se funde,
// la gruta donde duerme Regice. Tileset 12 (Cueva Hielo) con la variante de hielo de Cueva1. Sin encuentros salvajes:
// estuvo sellada (README). Eventos: content/events/b22d_regice.js.
import { caveKit, cells } from '../b08/cave_kit.js';
import { ESCARCHA, HOOKS } from './layout.js';
import { escarchaEvents } from '../../events/b22d_regice.js';

const kit = caveKit('_hielo');
const R = ESCARCHA.rooms;
const back = HOOKS.talleres.hatchFront;

function build(b) {
  kit.paintRooms(b, Object.values(R));
  kit.carveTunnel(b, ESCARCHA.tunnel);
  kit.mergeRock(b);
  b.stamp('escalera_mano', ESCARCHA.ladder.x, ESCARCHA.ladder.y);
  // Bodega: serrín (nieve pisada), bloques guardados, vigas y herramientas.
  b.paint('nieve', cells(8, 8, 7, 7));
  for (const [s, x, y] of [
    ['montones_nieve', 3, 15], ['tronco_h_hielo', 10, 6], ['tronco_v_hielo', 15, 8], ['roca_nevada', 3, 9],
    ['roca_peque_hielo', 14, 15], ['copo_nieve', 6, 16], ['gota_cristal', 16, 13], ['matojo_cueva_hielo', 3, 11],
    ['montones_nieve', 9, 16],
  ]) b.stamp(s, x, y);
  // Gruta de Regice: nieve antigua, carámbanos y rocas heladas alrededor del centro despejado.
  b.paint('nieve', cells(25, 12, 7, 4));
  b.paint('mancha_hielo', cells(26, 8, 5, 4));
  for (const [s, x, y] of [
    ['roca_grande_hielo', 23, 11], ['roca_grande_hielo', 31, 12], ['roca_nevada', 24, 16], ['gota_cristal', 24, 6],
    ['gota_cristal', 32, 6], ['roca_musgo_hielo', 23, 7], ['copo_nieve', 29, 17], ['montones_nieve', 26, 17],
    ['roca_peque_hielo', 31, 16], ['cristales', 25, 6],
  ]) b.stamp(s, x, y);
  b.stamp('pilar_placa_unown', ESCARCHA.stele.x, ESCARCHA.stele.y);
}

export default {
  id: ESCARCHA.id,
  name: 'Cueva Sellada de la Escarcha',
  tileset: 12,
  width: ESCARCHA.width,
  height: ESCARCHA.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'CuevaHielo',
  start: ESCARCHA.arrive,
  build,
  warps: [{ x: ESCARCHA.exit.x, y: ESCARCHA.exit.y, to: 'boreal_talleres', tx: back.x, ty: back.y, dir: back.dir }],
  events: escarchaEvents(),
};
