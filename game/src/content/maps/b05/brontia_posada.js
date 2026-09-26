// Posada de Villa Brontia (CAMPANA §3.1, X25): «Descansar hasta tormenta» existe en la posada de Brontia
// (innkeeperEvent con storm: true, content/services/inn.js). Descansar es la forma de llegar a la noche del rayo
// (T03; TABLILLAS §4.8: los arcos nocturnos se alcanzan con «descansar»). Tileset 4 (Interior1).
import { innkeeperEvent } from '../../services/inn.js';
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './villa_brontia_layout.js';
import { SPRITE, examine } from '../../events/b05_common.js';

const E = INTERIOR_ENTRIES.brontia_posada;
const OUT = BUILDINGS.posada.door;

export default {
  id: 'brontia_posada',
  name: 'Villa Brontia',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'PuebloMarengo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    // Mostrador de la posadera, camas de los huéspedes y un rincón con mesa
    b.stamp('mesa_comedor', 3, 5); // junto a la estantería, sin pisarla
    b.stamp('cama', 9, 3);
    b.stamp('cama', 11, 7);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('reloj_pared', 5, 2);
    b.stamp('ventana_cortinas', 6, 2);
    b.stamp('planta', 13, 3);
    b.stamp('planta_alta', 1, 8);
    b.rect(null, 4, 8, 3, 2, 'alfombra_verde');
    b.stamp('taza', 4, 6);
  },

  warps: exitWarps(E.x, E.y, { map: 'villa_brontia', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    innkeeperEvent({
      x: 4, y: 4, dir: 2, sprite: SPRITE.neighbor, storm: true,
      greeting: '¡Buenas! Esto es la posada de Brontia. Las camas están limpias y las mantas abrigan, haya luz o no.',
    }),
    {
      id: 'huesped', x: 8, y: 8, name: 'Huésped', sprite: 'anil:excursionista', dir: 4, move: 'look',
      script: async (ctx) => {
        await ctx.say('Si descansas hasta la noche, verás el rayo del campanario desde la ventana. Cae siempre en el mismo sitio.', { speaker: 'Huésped' });
        await ctx.say('Y si pides «descansar hasta tormenta», la posadera te despierta cuando se levanta el aguacero. Dicen que con lluvia salen Pokémon raros.', { speaker: 'Huésped' });
      },
    },
    examine('estanteria', 1, 5, 'Guías de viaje de Axis. La de Brontia tiene una foto de la plaza iluminada.', { solid: true }),
  ],
};
