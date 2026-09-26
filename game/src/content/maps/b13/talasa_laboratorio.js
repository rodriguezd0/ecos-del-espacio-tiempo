// Laboratorio del tanque de la Estación Talasa (docs/CAMPANA.md B13, puntos 4–7): sala blanca clínica de Genesis con el
// tanque de presión «Muestra Z-4» (N4), la consola, la pantalla mural, bancos de ordenadores y cámaras. Combate doble con
// Alerce contra Casia y Garrido; reintento desde la puerta. Tileset 4 (Interior1). Eventos: b13_talasa_lab.js.
import { BUILDINGS } from './talasa_layout.js';
import { labEvents, LAB } from '../../events/b13_talasa_lab.js';
import { INTERIOR_PIECES as PIECE } from '../../events/b13_talasa_interiores.js';

const OUT = BUILDINGS.lab.door;

export default {
  id: 'talasa_laboratorio',
  name: 'Estación Talasa',
  tileset: 4,
  width: LAB.width,
  height: LAB.height,
  outdoor: false,
  bgm: 'GuaridaRocket',
  battleback: 'BaseVillano',
  showLocation: false,
  start: { x: LAB.door.x, y: LAB.door.y, dir: 8 },
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, LAB.room.x, LAB.room.y, LAB.room.w, LAB.room.h, 'habitacion_lab');
    b.stamp('salida_lab', LAB.door.x - 1, LAB.door.y);
    b.rect(null, 9, 8, 7, 5, 'alfombra_azul');
    b.stamp('lab_ordenadores', 2, 1);
    b.stamp('pizarras', 8, 2);
    b.stamp('lab_ordenadores', 20, 1);
    b.stamp('maquina_lab', 1, 8); // (encima de las estanterías, sin pisarlas)
    b.stamp('maquina_lab', 22, 8);
    b.stamp('estanteria_lab', 1, 13);
    b.stamp('estanteria_lab', 23, 13);
    b.stamp('fotocopiadora', 17, 12);
    b.stamp('mesa_lab_verde', 5, 11);
    for (const x of [15, 17]) b.stamp('ventanal_lab', x, 2);
    b.stamp('planta', 7, 13);
    b.stamp('planta', 18, 4);
    b.stamp(PIECE.console, LAB.console.x, LAB.console.y - 1); // consola del tanque (evento en su base)
  },
  warps: [LAB.door.x, LAB.door.x + 1].map((x) => ({ x, y: LAB.door.y, dirTrigger: 2, to: 'estacion_talasa', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),
  events: [
    ...[LAB.door.x, LAB.door.x + 1].map((x) => ({ id: `flecha_${x}`, x, y: LAB.door.y + 1, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false })),
    ...labEvents(),
  ],
};
