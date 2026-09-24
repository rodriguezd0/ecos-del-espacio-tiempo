// Mapa de PRUEBA conectado al este de dev_test (sin canon): comprueba ver y cruzar conexiones.
import { DEV_FALLBACK_7 } from './dev_fallback.js';

const W = 24;
const H = 34;

export default {
  id: 'dev_test_este',
  name: 'Sendero de pruebas',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 1',
  battleback: 'field',
  fallback: DEV_FALLBACK_7,
  encounters: {
    grass: [[50, 'CATERPIE', 3, 5], [50, 'WEEDLE', 3, 5]],
  },
  build(b) {
    b.fill(null, 'cesped');
    b.rect(null, 0, 0, 20, 6, 'bosque');
    b.rect(null, 0, 28, 20, 6, 'bosque');
    b.rect(null, 20, 0, 4, H, 'bosque');
    b.rect(null, 0, 6, 2, 8, 'bosque_pinos');
    b.rect(null, 0, 20, 2, 8, 'bosque_pinos');
    const path = [];
    for (let y = 16; y <= 18; y++) for (let x = 0; x <= 12; x++) path.push([x, y]);
    for (let y = 8; y <= 18; y++) for (let x = 10; x <= 12; x++) path.push([x, y]);
    b.paint('camino_arena', path);
    b.rect(null, 4, 20, 12, 6, 'hierba_alta');
    b.rect(null, 14, 8, 5, 6, 'hierba_alta');
    b.stamp('pino', 5, 8);
    b.stamp('arbol', 3, 11);
    b.stamp('tocon', 8, 13);
  },
  connections: [{ dir: 'west', to: 'dev_test', offset: 0 }],
  events: [
    {
      id: 'excursionista', x: 11, y: 10, sprite: 'montanero', dir: 2, move: { wander: 2 },
      script: async (ctx) => {
        await ctx.say('Has cruzado a otro mapa sin fundido: es una conexión.', { speaker: 'Excursionista' });
      },
    },
  ],
};
