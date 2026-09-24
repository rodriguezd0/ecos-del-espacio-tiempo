// Molino harinero del Barrio de los Molinos (Ciudad Caudal; CAMPANA §1.3 «Barrio de los Molinos»). Una familia de
// molineros vive del agua del Canal de los Molinos: con el Albo errático la muela va a trompicones (antes de P2)
// y vuelve a girar tras P2. Sacos de harina (objetos de b03_objetos.png) y la muela. Tileset 4 (Interior1).
import { BUILDINGS } from './caudal_layout.js';
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { F, OBJ, objectEvent, say } from '../../events/b03_common.js';

const DOOR_X = 7;
const MAT_Y = 10;
const door = BUILDINGS.molino.door;

const SACKS = [[2, 5], [3, 5], [2, 6], [12, 5], [13, 6], [11, 9], [12, 9]];

async function millstone(ctx) {
  if (ctx.flag(F.p2)) {
    await ctx.say('La muela gira con un rumor constante. La harina cae fina en la artesa.');
    return;
  }
  await ctx.say('Una muela de piedra enorme. Gira un poco, se para, vuelve a girar… La harina sale a grumos.');
}

export default {
  id: 'caudal_molino',
  name: 'Ciudad Caudal',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'CiudadCeleste',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('ventana', 5, 2);
    b.stamp('ventana', 9, 2);
    b.stamp('reloj_pared', 12, 2);
    b.rect(null, 5, 5, 5, 3, 'alfombra_beige');
    b.stamp('mesa_comedor', 5, 5);
    b.stamp('fregadero', 1, 3);
    b.stamp('sartenes', 3, 2);
    b.stamp('estanteria_naranja', 13, 3);
    b.stamp('planta', 1, 8);
  },

  warps: exitWarps(DOOR_X, MAT_Y, { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(DOOR_X, MAT_Y + 1),
    ...SACKS.map(([x, y], i) => objectEvent(`saco_${i}`, x, y, OBJ.sandbags(), {
      through: false, trigger: 'action',
      script: async (ctx) => { await ctx.say('Sacos de harina apilados. Por el grano grueso, se nota que la muela no va fina.'); },
    })),
    examineEvent('muela_0', 6, 6, 'Sobre la mesa hay una muela pequeña de muestra y un cedazo lleno de harina gruesa.'),
    examineEvent('muela_1', 7, 5, 'Una trampilla en el suelo deja ver el eje de la rueda. Huele a agua de canal.'),
    {
      // La rueda del molino vista por dentro (noria.png): a trompicones hasta P2, girando después.
      id: 'muela', x: 10, y: 4, sprite: 'asset:objects/noria.png', directionFix: true, walkAnime: false, shadow: false,
      trigger: 'action', script: millstone,
      pages: [
        { when: (s) => !s?.flag(F.p2), dir: 8, stepAnime: true, speed: 2 },
        { when: (s) => Boolean(s?.flag(F.p2)), dir: 2, stepAnime: true, speed: 3 },
      ],
    },
    {
      id: 'molinero', x: 9, y: 8, sprite: 'vecino', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.p2)) {
          await say(ctx, 'Molinero', '¡La rueda gira como antes! Llevo toda la mañana moliendo. El gremio está contento, por fin.');
          await say(ctx, 'Molinero', 'Menos el viejo Anselmo. Su Diezmo gira… al revés. ¿Has visto cosa igual?');
          return;
        }
        await say(ctx, 'Molinero', 'Con el río así, la rueda va a trompicones: un rato sí, un rato no. La harina sale gruesa como arena.');
        await say(ctx, 'Molinero', 'El gremio quiere que modernicemos, que pongamos motores. Y el viejo Anselmo, el del Diezmo, dice que antes muerto.');
      },
    },
    {
      id: 'molinera', x: 3, y: 8, sprite: 'vecina', dir: 6, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Molinera', 'Aquí se ha molido el grano de medio valle. Ahora hay días que no llenamos ni un saco.');
        if (!ctx.flag('b03_molino_regalo')) {
          ctx.setFlag('b03_molino_regalo');
          await say(ctx, 'Molinera', 'Toma, llévate esto. Una vecina lo trajo de la pradera y aquí no lo usamos.');
          await ctx.giveItem('HONEY', 2);
        }
      },
    },
  ],
};
