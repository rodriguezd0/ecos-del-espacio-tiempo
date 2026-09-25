// Invernadero de la Estación Talasa (docs/CAMPANA.md B13: «un invernadero de Solosis cultivados»): sala de laboratorio
// (tileset 4) con tanques de cultivo, macetas trepadoras, la mesa de registros y la consola que abre la compuerta hacia
// la cubierta sur. Encuentros de «invernadero y cubiertas» (POKEDEX §7.3). Eventos: b13_talasa_interiores.js.
import { BUILDINGS } from './talasa_layout.js';
import { TALASA_INVERNADERO } from '../../encounters/b13.js';
import { greenhouseEvents, GREENHOUSE as G } from '../../events/b13_talasa_interiores.js';

const OUT = BUILDINGS.greenhouse.door;

export default {
  id: 'talasa_invernadero',
  name: 'Estación Talasa',
  tileset: 4,
  width: G.width,
  height: G.height,
  outdoor: false,
  bgm: 'GuaridaRocket',
  battleback: 'Laboratorio',
  showLocation: false,
  start: { x: G.door.x, y: G.door.y, dir: 8 },
  encounters: TALASA_INVERNADERO,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, G.room.x, G.room.y, G.room.w, G.room.h, 'habitacion_lab');
    b.stamp('salida_lab', G.door.x - 1, G.door.y);
    b.rect(null, 3, 7, 14, 5, 'alfombra_verde');
    for (const [x, y] of G.plants) b.stamp('planta_alta', x, y);
    b.stamp('lab_ordenadores', 7, 1);
    b.stamp('mesa_lab_verde', G.table.x, G.table.y);
    for (const x of [3, 15]) b.stamp('ventanal_lab', x, 2);
  },
  warps: [G.door.x, G.door.x + 1].map((x) => ({ x, y: G.door.y, dirTrigger: 2, to: 'estacion_talasa', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),
  events: [
    ...[G.door.x, G.door.x + 1].map((x) => ({ id: `flecha_${x}`, x, y: G.door.y + 1, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false })),
    ...greenhouseEvents(),
  ],
};
