// Refugio del Paso del Norte (docs/CAMPANA.md §1.4 «Collado con refugio»): la guarda del refugio, literas para
// descansar (rincón de descanso), dos curiosos que han venido por la columna de luz y el mapa de la Senda del Lazo con
// la pauta de los pastores («seguid a los Larvitar»). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents, examineEvent, restSpotEvent } from '../../services/index.js';
import { PASO, REFUGIO } from './layout_paso.js';
import { refugioEvents } from '../../events/b15_senda.js';

const E = REFUGIO.entry;
const OUT = PASO.refugio.door;

export default {
  id: 'paso_refugio',
  name: 'Refugio del Paso',
  tileset: 4,
  width: REFUGIO.width,
  height: REFUGIO.height,
  outdoor: false,
  bgm: 'PrismaRuta2',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('cama_individual', 8, 4);
    b.stamp('cama_individual', 11, 4);
    b.stamp('mesa_comedor', 2, 6);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('reloj_pared', 5, 2);
    // El mapa del collado dibujado a mano, colgado en la pared (se examina desde la casilla de delante).
    b.stamp('panel_informativo', REFUGIO.map.x, REFUGIO.map.y - 2);
    b.stamp('ventana', 3, 2);
    b.stamp('ventana', 9, 2);
    b.stamp('planta_alta', 13, 8);
    b.rect(null, 5, 8, 5, 2, 'alfombra_verde');
    b.stamp('taza', 4, 7);
  },

  warps: exitWarps(E.x, E.y, { map: 'paso_del_norte', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    ...refugioEvents(),
    restSpotEvent('literas', 9, 6, { kind: 'bed', message: 'Unas literas con mantas gruesas. ¿Quieres descansar un rato?' }),
    restSpotEvent('literas_2', 12, 6, { kind: 'bed', message: 'Unas literas con mantas gruesas. ¿Quieres descansar un rato?' }),
    examineEvent('mapa_pared', REFUGIO.map.x, REFUGIO.map.y,'Un mapa del collado dibujado a mano. Junto a la Senda del Lazo, alguien ha escrito: «Seguid a los Larvitar. Ellos nunca se pierden.»'),
    { ...examineEvent('estanteria_refugio', 2, 5, 'Botiquines, cuerdas y un cuaderno de registro: «Días en la Senda: 3. Vueltas: no las cuento.»'), solid: true },
  ],
};
