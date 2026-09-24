// Casa de los hortelanos (Villa Zaguán, CAMPANA B02 paso 1: «la gente duerme mal»). La hortelana y su hijo; tras
// restaurar el Pilar vuelven a dormir. Tileset 4 (Interior1).
import { houseExit, exitArrows, examineRect } from '../b01/common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_zaguan_layout.js';
import { F } from '../../events/b02_common.js';

const ENTRY = INTERIOR_ENTRIES.zaguan_casa_huerto;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;

function talk(speaker, before, after) {
  return async (ctx) => {
    for (const line of ctx.flag(F.restored) ? after : before) await ctx.say(line, { speaker });
  };
}

export default {
  id: 'zaguan_casa_huerto',
  name: 'Villa Zaguán',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'PrismaVilla2',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('sartenes', 1, 1);
    b.stamp('fregadero', 1, 3);
    b.stamp('nevera', 3, 3);
    b.stamp('ventana_cortinas', 5, 2);
    b.stamp('estanteria_naranja', 8, 3);
    b.stamp('reloj_pared', 9, 2);
    b.stamp('cama', 11, 3);
    b.rect(null, 3, 6, 7, 3, 'alfombra_verde');
    b.stamp('mesa_comedor', 4, 6);
    b.stamp('taza', 6, 7);
    b.stamp('planta', 1, 8);
    b.stamp('planta_alta', 13, 8);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_zaguan', TOWN_DOORS.zaguan_casa_huerto.x, TOWN_DOORS.zaguan_casa_huerto.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    {
      id: 'hortelana', x: 3, y: 5, sprite: 'criadora', dir: 2, move: 'look', trigger: 'action',
      script: talk('Hortelana', ['Los Wooloo del prado balan toda la noche. Algo los tiene nerviosos.', 'Y cuando ellos no duermen, aquí no duerme nadie.'],
        ['Los Wooloo ya no balan de noche. Por fin vamos a dormir todos del tirón.']),
    },
    {
      id: 'nino', x: 10, y: 8, sprite: 'nino', dir: 4, move: { wander: 1 }, freq: 3, trigger: 'action',
      script: talk('Niño', ['¿Has ido a las ruinas? ¡Mi madre no me deja ni acercarme! Dice que se van a caer.'],
        ['¡Dicen que en las ruinas se encendió una luz verde! ¿Tú la has visto?']),
    },
    ...examineRect('estanteria', 8, 5, 1, 1, 'Almanaques de siembra y un libro de recetas con las esquinas dobladas.'),
    ...examineRect('mesa', 5, 6, 3, 1, 'Un cesto con verduras recién cogidas del huerto.'),
  ],
};
