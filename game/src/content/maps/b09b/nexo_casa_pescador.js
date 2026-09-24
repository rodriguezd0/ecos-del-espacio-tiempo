// Casa del pescador de Ciudad Nexo (el de la Caña Buena, que pasa el día en el pantalán). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './nexo_layout.js';
import { F, SPRITE, lines, examine } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.nexo_casa_pescador;
const OUT = BUILDINGS.pescador.door;

export default {
  id: 'nexo_casa_pescador',
  name: 'Ciudad Nexo',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'CiudadCarmin',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 4, 4);
    b.stamp('fregadero', 1, 2);
    b.stamp('nevera', 3, 2);
    b.stamp('estanteria_roja', 9, 2);
    b.stamp('cama_individual', 9, 6);
    b.stamp('ventana_cortinas', 6, 1);
    b.stamp('planta', 1, 8);
  },

  warps: exitWarps(E.x, E.y, { map: 'ciudad_nexo', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'mujer_pescador', x: 3, y: 7, name: 'Vecina', sprite: SPRITE.neighbor, dir: 6, move: 'look',
      script: (ctx) => lines(ctx, 'Vecina', ctx.flag(F.goodRod)
        ? ['¿Te ha dado una de sus cañas? Entonces le has caído bien. A mí me costó diez años.']
        : ['Mi marido se pasa el día en el pantalán, mirando el agua. Dice que el mar habla si lo escuchas.', 'A veces pienso que le contesta.']),
    },
    examine('trofeo_pesca', 10, 4, 'Una foto enmarcada: un hombre joven con un Gyarados enorme enganchado a la caña. Detrás pone «Nexo, hace muchos años».', { solid: true }),
  ],
};
