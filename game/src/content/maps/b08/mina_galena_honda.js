// Galería honda de la Mina Galena (docs/CAMPANA.md B08 «Cambio en el mundo»: tras el P4 aparecen fósiles en la
// galería honda; POKEDEX §7.3: tabla de la galería honda y la Steelixita). Se baja por el montacargas de la mina una
// vez despejado. Cueva1 (arcilla): lecho de fósiles, cristales y un minero de la cooperativa.
import { HONDA, MINA } from './layout.js';
import { caveKit, cells } from './cave_kit.js';
import { MINA_HONDA } from '../../encounters/b08.js';
import { F, OBJ, SPEAKER, SPRITE } from '../../events/b08_common.js';

const kit = caveKit('_arcilla');
const R = HONDA.room;

export default {
  id: 'mina_galena_honda',
  name: 'Mina Galena',
  tileset: 2,
  width: HONDA.width,
  height: HONDA.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'CuevaOscura',
  start: HONDA.arrive,
  encounters: MINA_HONDA,
  build(b) {
    kit.paintRooms(b, [R]);
    kit.mergeRock(b);
    b.stamp('escalera_mano', HONDA.ladder.x, HONDA.ladder.y - 2);
    b.paint('mancha_arcilla', cells(6, 12, 5, 3));
    b.paint('mancha_arcilla', cells(18, 7, 4, 3));
    for (const [s, x, y] of [
      ['cristales', 17, 5], ['gota_cristal', 24, 6], ['gota_cristal', 5, 17], ['roca_grande_arcilla', 22, 15], ['roca_musgo_arcilla', 5, 7],
      ['matojo_cueva_arcilla', 11, 17], ['roca_peque_arcilla', 16, 12], ['tronco_h_arcilla', 7, 5], ['pepita', 13, 16], ['pepita', 20, 11],
    ]) b.stamp(s, x, y);
    for (const x of [10, 19]) b.stamp('antorcha', x, R.y0 - 2);
  },
  warps: [{ x: HONDA.ladder.x, y: HONDA.ladder.y - 1, to: 'mina_galena', tx: MINA.liftArrival.x, ty: MINA.liftArrival.y, dir: 2 }],
  onEnter: async (ctx) => {
    if (ctx.flag(F.honda)) return;
    ctx.setFlag(F.honda); // Zygarde habla muy poco (autor, 25-09-2026): sin comentario del Core al llegar.
  },
  events: [
    ...[[8, 9, 0], [9, 13, 1], [14, 8, 2], [21, 13, 3], [12, 18, 1], [24, 18, 0]].map(([x, y, v]) => ({
      id: `fosil_${x}_${y}`, x, y, sprite: OBJ.fossil, dir: 2, pattern: v, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Huesos fosilizados incrustados en la roca. Los mineros los dejan donde están: dicen que la galería los ha devuelto.'); },
    })),
    {
      id: 'minera_honda', x: 16, y: 10, name: SPEAKER.minera, sprite: SPRITE.minera, dir: 2, move: 'look',
      script: async (ctx) => {
        await ctx.say('Cuando el suelo se quedó quieto, se desprendió media pared. Y detrás, ¡fósiles! Los dos mejores se los llevó Fermín.', { speaker: SPEAKER.minera });
        await ctx.say('Dicen que en Lúmina, en el museo, saben devolverles la vida. Qué cosas.', { speaker: SPEAKER.minera });
      },
    },
    { id: 'objeto_honda_1', type: 'item', x: 24, y: 9, item: 'STEELIXITE' },
    { id: 'objeto_honda_2', type: 'item', x: 6, y: 18, item: 'NUGGET' },
    { id: 'objeto_honda_3', type: 'item', x: 19, y: 17, item: 'MAXREVIVE', hidden: true },
  ],
};
