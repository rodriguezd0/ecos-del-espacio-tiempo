// Casa de la vecina de las puertas (Villa Zaguán, CAMPANA B02 paso 1 y §3.1 fase 0: «Anoche se me abrió la puerta
// tres veces. Sin viento.»). Dentro, su marido y la mesa arrimada a la puerta. Tileset 4 (Interior1).
import { ROOM_BRUSHES, houseExit, exitArrows, examineRect } from '../b01/common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_zaguan_layout.js';
import { F } from '../../events/b02_common.js';

const ENTRY = INTERIOR_ENTRIES.zaguan_casa_vecina;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;

async function husbandTalk(ctx) {
  const say = (t) => ctx.say(t, { speaker: 'Vecino' });
  if (ctx.flag(F.restored)) {
    await say('Ya hemos devuelto la mesa a su sitio. Hacía semanas que no cenábamos sentados.');
    return;
  }
  await say('Mi mujer arrima la mesa a la puerta cada noche. Dice que así no se abre.');
  await say('Yo digo que así tampoco salimos. Pero duerme, que es lo importante.');
}

export default {
  id: 'zaguan_casa_vecina',
  name: 'Villa Zaguán',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PrismaVilla2',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },
  brushes: ROOM_BRUSHES,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_calida');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('sartenes', 1, 1);
    b.stamp('fregadero', 1, 3);
    b.stamp('nevera', 3, 3);
    b.stamp('ventana_cortinas', 5, 2);
    b.stamp('tele', 8, 3);
    b.stamp('sofa', 10, 4);
    b.stamp('planta', 7, 3);
    b.rect(null, 2, 6, 4, 2, 'alfombra_beige');
    b.stamp('mesa_comedor', 2, 6);
    b.stamp('cuadro', 9, 2);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_zaguan', TOWN_DOORS.zaguan_casa_vecina.x, TOWN_DOORS.zaguan_casa_vecina.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    { id: 'vecino', x: 9, y: 7, sprite: 'vecino', dir: 4, move: 'look', trigger: 'action', script: husbandTalk },
    ...examineRect('fregadero', 1, 5, 2, 1, 'Platos apilados. Aquí se cena tarde.'),
    ...examineRect('tele', 8, 5, 2, 1, 'Un programa sobre huertos. Nadie lo está viendo.'),
  ],
};
