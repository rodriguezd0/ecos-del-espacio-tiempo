// Cerro Plomo (docs/CAMPANA.md B08; §1.5 Pilar de la Masa: Cueva1 + kit, tinte plomo): las galerías de la familia
// Galena bajo el cerro de las Dunas de Ceniza. Abajo, la galería de entrada (vieja explotación: vigas, vía, vagoneta y
// faroles); en medio, la verja de los Galena; arriba, la antesala del Pilar (enlosado, monolitos) con la boca de la
// Cámara de los Contrapesos. Eventos en content/events/b08_cerro.js.
import { cerroEvents, cerroOnEnter } from '../../events/b08_cerro.js';
import { CERRO_PLOMO } from '../../encounters/b08.js';
import { pilarTone } from '../../stamps/pilar.js';
import { caveKit, cells } from './cave_kit.js';
import { CERRO, DUNAS } from './layout.js';
import { OBJ } from '../../events/b08_common.js';

const kit = caveKit('_gris');
const R = CERRO.rooms;

function build(b) {
  kit.paintRooms(b, [R.entrada, R.antesala]);
  kit.carveVertical(b, CERRO.passage);
  kit.mergeRock(b);
  // Antesala del Pilar: enlosado, monolitos, columnas y la boca oscura de la puerta.
  const a = R.antesala;
  b.paint('pilar_enlosado', [...cells(a.x0 + 1, a.y0, a.x1 - a.x0 - 1, a.y1 - a.y0 + 1), ...cells(CERRO.passage.x, a.y1 + 1, 3, 2)]);
  b.stamp('boca_norte_gris', CERRO.doorStamp.x, CERRO.doorStamp.y);
  b.stamp('pilar_placa_unown', 11, 6);
  for (const [s, x, y] of [
    ['pilar_columna', 16, 6], ['pilar_monolito', 18, 6], ['pilar_columna', 8, 6], ['pilar_columna', 21, 6],
    ['pilar_columna_quebrada', 8, 12], ['pilar_arista', 22, 12], ['pilar_arista_grande', 19, 11],
    ['pilar_glifo', 14, 9], ['pilar_glifo_2', 11, 11], ['pilar_losa_eco', 14, 11], ['pilar_zocalo_gastado', 10, 9],
    ['pilar_glifo', 18, 13], ['pilar_zocalo', 12, 13], ['pilar_glifo_2', 17, 9],
  ]) b.stamp(s, x, y);
  b.paint('pilar_canal_v', cells(7, 9, 1, 3));
  b.paint('pilar_canal_v', cells(22, 8, 1, 3));
  // Galería de entrada: vieja explotación de los Galena.
  const e = R.entrada;
  b.paint('mancha_gris', cells(e.x0 + 1, e.y1 - 1, 4, 2));
  b.paint('mancha_gris', cells(e.x1 - 4, e.y0, 4, 2));
  for (const [s, x, y] of [
    ['tronco_h_gris', 7, 20], ['tronco_h_gris', 19, 20], ['roca_grande_gris', 21, 24], ['matojo_cueva_gris', 6, 23],
    ['roca_peque_gris', 11, 25], ['cartel', 9, 20], ['musgo_rocas', 17, 25],
  ]) if (b.hasStamp(s)) b.stamp(s, x, y);
  for (const x of [8, 20]) b.stamp('antorcha', x, e.y0 - 2);
  b.stamp('salida_luz_sur_gris', CERRO.exit.stamp.x, CERRO.exit.stamp.y);
}

export default {
  id: 'cerro_plomo',
  name: 'Pilar de la Masa',
  tileset: 2,
  width: CERRO.width,
  height: CERRO.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'Cueva',
  tone: pilarTone('P4', 0.5),
  start: CERRO.exit.arrive,
  encounters: CERRO_PLOMO,
  build,
  warps: [
    { x: CERRO.exit.warp.x, y: CERRO.exit.warp.y, to: 'dunas_ceniza', tx: DUNAS.cerro.front.x, ty: DUNAS.cerro.front.y, dir: 2 },
  ],
  onEnter: cerroOnEnter,
  events: [
    ...cerroEvents(),
    // Vagoneta y vía de la vieja explotación.
    { id: 'vagoneta_cerro', x: 16, y: 22, sprite: OBJ.cart, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una vagoneta oxidada, vacía. En el fondo, polvo gris de plomo.'); } },
    ...[13, 14, 15].map((x) => ({ id: `via_cerro_${x}`, x, y: 22, sprite: OBJ.rail, dir: 2, pattern: 0, directionFix: true, walkAnime: false, shadow: false, through: true })),
  ],
};
