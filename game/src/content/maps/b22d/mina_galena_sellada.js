// Cueva Sellada del Pico (docs/CAMPANA.md B22: Regirock, «Cueva Sellada del Pico (Mina Galena)»): la galería que los
// primeros picadores sellaron detrás de la veta de cristal de la Mina Galena. Cueva1 (tierra y musgo, la misma roca
// de la mina): un vestíbulo con restos de entibado y una nave alta con el estrado de Regirock, la estela Unown y
// columnas de roca viva. Sin encuentros salvajes: estuvo sellada (decisión DECIDIDO-DEV, README). Se entra por la boca
// que se abre en la veta (b22d_regirock.js) y se sale por el túnel del este.
import { caveKit, cells } from '../b08/cave_kit.js';
import { PICO, HOOKS } from './layout.js';
import { picoEvents } from '../../events/b22d_regirock.js';

const kit = caveKit('');
const R = PICO.rooms;
const back = HOOKS.mina.arriveBack;

function build(b) {
  kit.paintRooms(b, Object.values(R));
  kit.carveTunnel(b, PICO.tunnel);
  kit.mergeRock(b);
  b.stamp('boca_este', PICO.exitStamp.x, PICO.exitStamp.y);
  // Vestíbulo: entibado viejo, cascotes y cristales que asoman.
  b.paint('mancha', cells(21, 11, 4, 3));
  for (const [s, x, y] of [
    ['tronco_h', 21, 9], ['escombros', 23, 13], ['roca_peque', 20, 13], ['gota_cristal', 26, 9], ['musgo_rocas', 24, 10],
    ['pepita', 22, 14], ['antorcha', 22, 7], ['antorcha', 25, 7],
  ]) b.stamp(s, x, y);
  // Nave: estrado de roca pisada, columnas de roca viva, cristales y la estela.
  b.paint('mancha', cells(PICO.dais.x0, PICO.dais.y0, PICO.dais.x1 - PICO.dais.x0 + 1, PICO.dais.y1 - PICO.dais.y0 + 1));
  b.paint('mancha', cells(8, 15, 3, 5));
  for (const [s, x, y] of [
    ['roca_grande', 5, 14], ['roca_grande', 12, 14], ['roca_grande', 5, 18], ['roca_grande', 12, 18],
    ['antorcha', 7, 7], ['antorcha', 11, 7], ['cristales', 4, 9], ['gota_cristal', 15, 11],
    ['matojo_cueva', 14, 16], ['roca_peque', 4, 16], ['musgo_rocas', 9, 20], ['pepita', 14, 20], ['roca_musgo', 4, 11],
  ]) b.stamp(s, x, y);
  b.stamp('pilar_placa_unown', PICO.stele.x, PICO.stele.y);
}

export default {
  id: PICO.id,
  name: 'Cueva Sellada del Pico',
  tileset: 2,
  width: PICO.width,
  height: PICO.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'CuevaOscura',
  start: PICO.arrive,
  build,
  warps: [{ x: PICO.exit.x, y: PICO.exit.y, to: 'mina_galena', tx: back.x, ty: back.y, dir: back.dir }],
  events: picoEvents(),
};
