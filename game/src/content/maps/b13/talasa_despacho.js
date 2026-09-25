// Despacho de dirección de la Estación Talasa (docs/CAMPANA.md B13, punto 3; §5.5 escalón 7): la foto enmarcada del
// «Proyecto Laguna — equipo de campo» con un rostro rascado y el cuaderno de tapas verdes; Alerce, de espaldas en los
// archivadores, no se gira. Aquí está la tarjeta de dirección que abre el laboratorio. Tileset 4 (Interior1).
import { BUILDINGS } from './talasa_layout.js';
import { officeEvents, OFFICE as O, INTERIOR_PIECES as PIECE } from '../../events/b13_talasa_interiores.js';

const OUT = BUILDINGS.tower.door;

export default {
  id: 'talasa_despacho',
  name: 'Estación Talasa',
  tileset: 4,
  width: O.width,
  height: O.height,
  outdoor: false,
  bgm: 'GuaridaRocket',
  battleback: 'Laboratorio',
  showLocation: false,
  start: { x: O.door.x, y: O.door.y, dir: 8 },
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, O.room.x, O.room.y, O.room.w, O.room.h, 'habitacion_blanca');
    b.stamp('salida_lab', O.door.x - 1, O.door.y);
    b.rect(null, 5, 5, 6, 3, 'alfombra_granate');
    b.stamp('mesa_lab_verde', O.desk.x - 1, O.desk.y);
    b.stamp('ventana', O.window.x, O.window.y);
    b.stamp('estanteria_lab', 1, 4);
    b.stamp('estanteria_roja', 9, 2);
    b.stamp(PIECE.lockers, O.cabinets[0][0], O.cabinets[0][1] - 1); // archivadores (eventos en la fila 3)
    b.stamp(PIECE.terminal, O.terminal.x, O.terminal.y - 1);
    b.stamp('reloj_pared', 8, 1);
    b.stamp('planta', 13, 8);
    b.stamp('papelera', 1, 8);
  },
  warps: [O.door.x, O.door.x + 1].map((x) => ({ x, y: O.door.y, dirTrigger: 2, to: 'estacion_talasa', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),
  events: [
    ...[O.door.x, O.door.x + 1].map((x) => ({ id: `flecha_${x}`, x, y: O.door.y + 1, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false })),
    ...officeEvents(),
  ],
};
