// Plantilla de las casas del Bloque 8 (Interior1): habitación con marco, salida de 3 casillas con felpudo y vuelta al
// exterior. Cada interior añade sus muebles y eventos. Módulo puro.
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { ESTRATO, ESTRATO_INTERIORS } from './layout.js';

/**
 * Definición base de un interior de Estrato. opts: { id, building (clave de ESTRATO.buildings), room: { x, y, w, h },
 * brush ('habitacion_casa'), furnish(b), events, bgm }. La llegada es ESTRATO_INTERIORS[id] (sobre el felpudo).
 */
export function estratoInterior({ id, building, room, brush = 'habitacion_casa', furnish, events = [], bgm = 'CiudadVerde', width, height }) {
  const E = ESTRATO_INTERIORS[id];
  const OUT = ESTRATO.buildings[building].door;
  if (!E) throw new Error(`estratoInterior: falta la llegada de ${id} en layout.js`);
  return {
    id,
    name: 'Ciudad Estrato',
    tileset: 4,
    width: width ?? room.x + room.w + 1,
    height: height ?? room.y + room.h + 1,
    outdoor: false,
    bgm,
    battleback: 'indoor',
    showLocation: false,
    start: { x: E.x, y: E.y, dir: 8 },
    build(b) {
      b.fill(null, 'vacio');
      b.rect(null, room.x, room.y, room.w, room.h, brush);
      b.stamp('salida_casa', E.x - 2, E.y);
      furnish?.(b);
    },
    warps: exitWarps(E.x, E.y, { map: 'ciudad_estrato', x: OUT.x, y: OUT.y + 1, dir: 2 }),
    events: [...exitArrowEvents(E.x, E.y + 1), ...events],
  };
}
