// Cueva de las Dunas (POKEDEX_DISTRIBUCION §7.3 «Dunas de Ceniza · Cueva / ruina: Cueva de las Dunas»; §7.7:
// Garchompita). Se baja por un boquete del noroeste de las Dunas. Cueva1 (arcilla): pasillos de arena y roca, un
// montañero y la Garchompita al fondo.
import { DUNAS_CUEVA as C, DUNAS } from './layout.js';
import { caveKit, cells } from './cave_kit.js';
import { DUNAS_CUEVA } from '../../encounters/b08.js';

const kit = caveKit('_arcilla');
const R = C.room;

export default {
  id: 'dunas_cueva',
  name: 'Cueva de las Dunas',
  tileset: 2,
  width: C.width,
  height: C.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'Cueva',
  start: C.arrive,
  encounters: DUNAS_CUEVA,
  build(b) {
    kit.paintRooms(b, [R]);
    kit.mergeRock(b);
    b.stamp('escalera_mano', C.exit.x, C.exit.y - 2);
    b.paint('mancha_arcilla', cells(9, 7, 6, 4));
    b.paint('mancha_arcilla', cells(19, 11, 7, 4));
    // Rocas que parten la cueva en pasillos.
    for (const [s, x, y] of [
      ['roca_grande_arcilla', 12, 12], ['roca_grande_arcilla', 16, 5], ['roca_musgo_arcilla', 21, 7], ['matojo_cueva_arcilla', 8, 14],
      ['roca_grande_arcilla', 25, 8], ['roca_peque_arcilla', 5, 10], ['roca_musgo_arcilla', 17, 13], ['roca_peque_arcilla', 23, 14],
      ['matojo_cueva_arcilla', 3, 12], ['roca_peque_arcilla', 14, 8], ['pepita', 27, 16],
      // Cristales: la cueva no es solo roca.
      ['gota_cristal', 11, 5], ['gota_cristal', 28, 10], ['musgo_rocas', 20, 6], ['musgo_rocas', 10, 15],
    ]) b.stamp(s, x, y);
  },
  warps: [{ x: C.exit.x, y: C.exit.y - 1, to: 'dunas_ceniza', tx: DUNAS.cave.front.x, ty: DUNAS.cave.front.y, dir: 2 }],
  events: [
    {
      id: 'montanero_julian', type: 'trainer', trainer: 'b08_montanero_cueva', name: 'Montañero Julián', sprite: 'anil:montanero',
      x: 18, y: 10, dir: 4, sight: 4,
      intro: '¡Eh! Esta cueva es mía hasta que salga el sol. Y aquí dentro no sale nunca.',
      after: 'Al fondo, detrás de las rocas, hay una piedra que brilla. Yo no llego: pesa demasiado mi mochila.',
    },
    { id: 'objeto_cueva_1', type: 'item', x: 27, y: 6, item: 'GARCHOMPITE' },
    { id: 'objeto_cueva_2', type: 'item', x: 4, y: 16, item: 'SUPERREPEL' },
    { id: 'objeto_cueva_3', type: 'item', x: 22, y: 12, item: 'RAREBONE', hidden: true },
  ],
};
