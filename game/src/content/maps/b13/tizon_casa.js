// Casa de la Maestra Brasa en el caserío del Tizón (TABLILLAS T12): cama para descansar (cura el equipo antes de subir
// al cráter), el arcón del crisol y el abuelo. Tileset 4 (Interior1). Eventos: b13_tizon.js (houseEvents).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, HOUSE_ENTRY as E } from './tizon_layout.js';
import { houseEvents } from '../../events/b13_tizon.js';

const OUT = BUILDINGS.brasa.door;

export default {
  id: 'tizon_casa',
  name: 'Volcán Tizón',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'MansionQuemada',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('cama_individual', 8, 2);
    b.stamp('mesa_comedor', 3, 5);
    b.stamp('estanteria_roja', 1, 2);
    b.stamp('comoda', 1, 5); // el mueble del crisol (evento en (1, 6), b13_tizon.js#houseEvents)
    b.stamp('sartenes', 5, 1);
    b.stamp('ventana', 3, 2);
    b.stamp('planta', 11, 8);
  },
  warps: exitWarps(E.x, E.y, { map: 'volcan_tizon', x: OUT.x, y: OUT.y + 1, dir: 2 }),
  events: [...exitArrowEvents(E.x, E.y + 1), ...houseEvents()],
};
