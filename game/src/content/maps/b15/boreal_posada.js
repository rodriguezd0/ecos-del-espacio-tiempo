// Posada de Villa Boreal (CAMPANA §3.1, X25): «Descansar hasta tormenta» existe en la posada de Brontia, la de Villa
// Boreal y el Hotel Mirador de Lúmina (innkeeperEvent con storm: true, content/services/inn.js). En el norte, la tormenta
// es una ventisca en los mapas exteriores del bloque (`stormWeather` de sus definiciones). Tileset 4 (Interior1).
import { innkeeperEvent } from '../../services/inn.js';
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { BOREAL, BOREAL_INTERIORS } from './layout_boreal.js';

const E = BOREAL_INTERIORS.boreal_posada;
const OUT = BOREAL.buildings.posada.door;

export default {
  id: 'boreal_posada',
  name: 'Villa Boreal',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'Emociones',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 3, 5); // junto a la estantería, sin pisarla
    b.stamp('cama', 9, 3);
    b.stamp('cama', 11, 7);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('reloj_pared', 5, 2);
    b.stamp('ventana_cortinas', 6, 2);
    b.stamp('planta', 13, 3);
    b.stamp('planta_alta', 1, 8);
    b.rect(null, 4, 8, 3, 2, 'alfombra_azul');
    b.stamp('taza', 4, 6);
  },

  warps: exitWarps(E.x, E.y, { map: 'villa_boreal', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    innkeeperEvent({
      x: 4, y: 4, dir: 2, sprite: 'anil:dama', storm: true,
      greeting: '¡Pasa, que hace frío! Esto es la posada de Boreal: mantas de lana, sopa caliente y ventanas al norte para ver las auroras.',
    }),
    {
      id: 'huesped_boreal', x: 8, y: 8, name: 'Huésped', sprite: 'anil:excursionista', dir: 4, move: 'look',
      script: async (ctx) => {
        await ctx.say('Si pides «descansar hasta tormenta», la posadera te despierta cuando entra la ventisca. Dicen que con ella se ven Pokémon que no salen nunca.', { speaker: 'Huésped' });
        await ctx.say('Yo solo he venido por las auroras. Este año el cielo está tan raro que casi da miedo mirarlo.', { speaker: 'Huésped' });
      },
    },
    { ...examineEvent('estanteria_posada', 1, 5, 'Guías de Axis y un libro de firmas: «Vinimos por la aurora. Nos quedamos por la sopa.»'), solid: true },
  ],
};
