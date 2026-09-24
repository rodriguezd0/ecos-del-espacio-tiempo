// Mapa de PRUEBA del overworld (sin canon): césped, caminos, hierba alta con encuentros, estanque,
// saliente, árboles, casa con puerta, NPC que habla, NPC que deambula, cartel, objeto, entrenador con
// visión y hooks de campo de Zygarde. Textos genéricos de prueba. Tileset 7 (ExteriorBosqueCeleste).
import { DEV_FALLBACK_7 } from './dev_fallback.js';

const W = 40;
const H = 34;

export default {
  id: 'dev_test',
  name: 'Zona de pruebas',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 1',
  battleback: 'field',
  start: { x: 10, y: 21, dir: 2 },
  fallback: DEV_FALLBACK_7,
  encounters: {
    grass: [[40, 'PIDGEY', 2, 4], [35, 'RATTATA', 2, 4], [15, 'CATERPIE', 3, 4], [10, 'PIKACHU', 3, 5]],
    grassNight: [[50, 'HOOTHOOT', 3, 5], [50, 'RATTATA', 3, 5]],
  },

  build(b) {
    b.fill(null, 'cesped');
    // Bosque de borde (bandas de alto 4k+2 para que los troncos cuadren)
    b.rect(null, 0, 0, 4, H, 'bosque');
    b.rect(null, 4, 0, 32, 6, 'bosque');
    b.rect(null, 4, 28, 32, 6, 'bosque');
    b.rect(null, 36, 0, 4, 14, 'bosque');
    b.rect(null, 36, 20, 4, 14, 'bosque');

    // Casa con puerta en (10,13)
    b.stamp('casa_roja', 6, 6);
    // Caminos de arena: salida de la casa y camino este-oeste hacia la conexión
    const path = [];
    for (let y = 14; y <= 18; y++) for (let x = 9; x <= 11; x++) path.push([x, y]);
    for (let y = 16; y <= 18; y++) for (let x = 4; x < W; x++) path.push([x, y]);
    for (let y = 18; y <= 27; y++) for (let x = 17; x <= 19; x++) path.push([x, y]);
    b.paint('camino_arena', path);

    // Estanque: agua animada (autotile de Añil) + orilla encima
    const pond = [];
    for (let y = 7; y <= 12; y++) for (let x = 26; x <= 33; x++) pond.push([x, y]);
    b.paint('agua', pond);
    b.paint('orilla', pond);
    b.stamp('roca_agua', 30, 9);

    // Hierba alta con encuentros
    b.rect(null, 22, 20, 10, 6, 'hierba_alta');
    b.rect(null, 5, 24, 5, 3, 'hierba_alta');

    // Saliente (se salta hacia el sur)
    b.rect(null, 5, 22, 10, 1, 'saliente');

    // Árboles sueltos y decoración
    b.stamp('arbol', 18, 7);
    b.stamp('pino', 21, 8);
    b.stamp('arbol', 33, 21);
    b.stamp('cartel_madera', 13, 15);
    b.rect(null, 14, 8, 3, 2, 'flores_azules');
    b.stamp('macizo_flores', 4, 14);
    b.stamp('flores_rosas', 15, 11);
    b.stamp('flores_blancas', 24, 13);
    b.stamp('tocon', 34, 14);
    b.scatterStamps('brotes', 19, 11, 7, 4, 4, { spacing: 1, onlyIf: (x, y, bb) => !bb.get(1, x, y) && !bb.get(2, x, y) });
  },

  warps: [
    { x: 10, y: 13, to: 'dev_test_casa', tx: 10, ty: 13, dir: 8, door: true },
  ],
  connections: [{ dir: 'east', to: 'dev_test_este', offset: 0 }],

  events: [
    {
      id: 'cartel', type: 'sign', x: 13, y: 15,
      text: 'CARTEL DE PRUEBA\nCasa de pruebas · Estanque al este · Hierba alta al sur.',
    },
    {
      id: 'hablador', x: 14, y: 19, sprite: 'chaval1', dir: 2, move: 'look',
      script: async (ctx) => {
        await ctx.say('¡Hola! Soy un NPC de prueba.', { speaker: 'Chico' });
        await ctx.say('Pulsa C para abrir el menú y Mayús para correr.', { speaker: 'Chico' });
        const r = await ctx.choice(['Saltar', 'Nada'], { message: '¿Quieres ver algo?', cancel: 1 });
        if (r === 0) {
          await ctx.move(ctx.event, [{ jump: [0, 0] }], { wait: true });
          await ctx.emote(ctx.event, '♪');
        } else {
          await ctx.emote(ctx.event, '…');
        }
      },
    },
    {
      id: 'paseante', x: 22, y: 12, sprite: 'chica1', dir: 2, move: { wander: 3 }, freq: 3,
      script: async (ctx) => {
        await ctx.say('Me gusta pasear junto al estanque.', { speaker: 'Chica' });
      },
    },
    {
      id: 'entrenador', type: 'trainer', x: 30, y: 17, sprite: 'campista', dir: 4, sight: 4,
      name: 'Campista de prueba',
      intro: '¡Te he visto! ¡Combate de prueba!',
      defeat: 'Vaya, has ganado.',
      after: 'Ya me has vencido. Sigue probando cosas.',
      party: [{ species: 'RATTATA', level: 4 }, { species: 'PIDGEY', level: 5 }],
    },
    { id: 'objeto', type: 'item', x: 6, y: 26, item: 'POTION' },
    { id: 'roca', type: 'ramRock', x: 34, y: 12 },
    { id: 'celula', type: 'zygardeCell', x: 24, y: 10, cell: 'dev_celula_1' },
  ],
};
