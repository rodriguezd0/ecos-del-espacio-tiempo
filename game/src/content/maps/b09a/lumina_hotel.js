// Hotel Mirador de Ciudad Lúmina (CAMPANA B09 punto 1 y §3.1): salón de la gala del Museo de las Eras (arriba) y
// vestíbulo con la recepción (abajo). La recepcionista ofrece «Descansar hasta tormenta» (X25: storm: true), que
// sirve también para llegar de noche al museo (T06). Tileset 4 (Interior1), 26×22.
import { exitArrowEvents } from '../../services/interior.js';
import { SERVICE_STAMPS } from '../../services/interior.js';
import { OUTSIDE, INTERIOR_ENTRY } from './lumina_layout.js';
import { hotelEvents, HOTEL } from '../../events/b09a_gala.js';

const E = INTERIOR_ENTRY.lumina_hotel;
const OUT = OUTSIDE.hotel;
const BACK_DOOR = { w: 2, h: 3, layers: [null, [1256, 1257, 1264, 1265, 1272, 1273], null] };

export default {
  id: 'lumina_hotel',
  name: 'Hotel Mirador',
  tileset: 4,
  width: 26,
  height: 22,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },
  stamps: { ...SERVICE_STAMPS, puerta_madera: { tiles: BACK_DOOR, desc: 'Puerta de madera (pared)' } },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 24, 20, 'habitacion_museo');
    b.stamp('salida_lab', E.x - 1, E.y);
    // Salón de la gala: ventanales del mirador, alfombra granate, estrado entre plantas y mesas
    for (const x of [3, 7, 16, 20]) b.stamp('ventana', x, 2);
    b.stamp('panel_informativo', 11, 2);
    b.rect(null, 5, 5, 16, 7, 'alfombra_granate');
    for (const [x, y] of [[9, 4], [16, 4], [2, 9], [23, 9]]) b.stamp('planta_alta', x, y);
    b.stamp('mesa_comedor', 2, 5);
    b.stamp('mesa_comedor', 19, 5);
    b.stamp('vitrina_museo', 11, 4);
    // Vestíbulo: recepción, sofás, puerta de las habitaciones y plantas
    b.rect(null, 9, 14, 8, 5, 'alfombra_azul');
    b.stamp('svc_mostrador_tienda', 19, 14);
    b.stamp('sofa', 2, 13);
    b.stamp('estanteria_roja', 5, 12);
    b.stamp('puerta_madera', 23, 1);
    b.stamp('reloj_pared', 13, 2);
    for (const [x, y] of [[8, 18], [17, 18], [1, 19], [7, 12]]) b.stamp('planta', x, y);
  },

  warps: [E.x, E.x + 1].map((x) => ({ x, y: E.y, dirTrigger: 2, to: 'ciudad_lumina', tx: OUT.x, ty: OUT.y, dir: 2, door: true })),

  events: [
    ...exitArrowEvents(E.x, E.y + 1).slice(1),
    ...hotelEvents(HOTEL),
  ],
};
