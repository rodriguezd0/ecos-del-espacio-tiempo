// Casa del Barrio bajo (Ciudad Caudal): el agua del canal entra cada mañana (CAMPANA B03 «inundaciones de día y
// canales secos de noche»; B04: Gael evacúa el barrio bajo). Charcos en el suelo de día y sacos en la puerta hasta
// P2. Tileset 4 (Interior1). Salida delante de la puerta.
import { BUILDINGS } from './caudal_layout.js';
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { F, OBJ, objectEvent, say } from '../../events/b03_common.js';

const DOOR_X = 6;
const MAT_Y = 9;
const door = BUILDINGS.bajo1.door;
const isDay = (s) => (typeof s?.isDay === 'function' ? s.isDay() : true);
const flooded = (s) => !s?.flag(F.p2) && isDay(s);

const PUDDLES = [[3, 7], [8, 6], [9, 8], [4, 5]];

export default {
  id: 'caudal_casa_bajo',
  name: 'Ciudad Caudal',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'CiudadCeleste',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('cama_individual', 1, 3);
    b.stamp('comoda', 4, 3);
    b.stamp('ventana_cortinas', 6, 2);
    b.stamp('tele', 9, 3);
    b.stamp('planta', 11, 3);
  },

  warps: exitWarps(DOOR_X, MAT_Y, { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(DOOR_X, MAT_Y + 1),
    ...PUDDLES.map(([x, y], i) => objectEvent(`charco_casa_${i}`, x, y, OBJ.puddle(i), { when: flooded })),
    objectEvent('sacos_puerta', 8, 9, OBJ.sandbags(), {
      through: false, when: (s) => !s?.flag(F.p2), trigger: 'action',
      script: async (ctx) => { await ctx.say('Sacos terreros junto a la puerta. Por la mañana los ponen fuera; por la noche los meten para que no se los lleve nadie.'); },
    }),
    examineEvent('tele', 9, 5, 'En la tele dan el parte: «…el nivel del Albo sigue variando sin explicación. La Casa de las Esclusas pide calma…»'),
    {
      id: 'madre_bajo', x: 3, y: 6, sprite: 'vecina', dir: 6, move: 'look', trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.p2)) {
          await say(ctx, 'Vecina', 'Ya no entra el agua. He fregado el suelo tres veces solo por el gusto de verlo seco.');
          return;
        }
        await say(ctx, 'Vecina', isDay(ctx.state)
          ? 'Perdona el desorden. Cada mañana el canal se nos mete en casa. Achicamos, secamos, y a la mañana siguiente, otra vez.'
          : 'Ahora, de noche, el canal se queda vacío. Casi prefiero el agua: el silencio da más miedo.');
        await say(ctx, 'Vecina', 'Si esto sigue así, tendremos que irnos a casa de mi hermana, en la parte alta.');
      },
    },
    {
      id: 'nino_bajo', x: 8, y: 7, sprite: 'nino', dir: 4, move: { wander: 1 }, trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Niño', '¡Esta mañana vino un Magikarp nadando por la calle! Bueno… saltando. Lo devolvimos al canal.');
      },
    },
  ],
};
