// Piezas comunes de los interiores pequeños de Lúmina (15×12, tileset 4): habitación de casa con salida de tres
// casillas, como las posadas y casas de los bloques anteriores. Módulo puro.
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { OUTSIDE, INTERIOR_ENTRY } from './lumina_layout.js';

/**
 * Definición base de un interior pequeño: `key` = edificio de lumina_layout (para la salida), `furnish(b)` = muebles.
 * opts: { id, name, key, brush ('habitacion_casa'), furnish, events }
 */
export function smallInterior({ id, name, key, brush = 'habitacion_casa', furnish, events = [], bgm = 'CiudadAzulona' }) {
  const E = INTERIOR_ENTRY[id];
  const OUT = OUTSIDE[key];
  if (!E || !OUT) throw new Error(`smallInterior(${id}): falta la entrada o la salida en lumina_layout.js`);
  return {
    id,
    name,
    tileset: 4,
    width: 15,
    height: 12,
    outdoor: false,
    bgm,
    battleback: 'indoor',
    showLocation: false,
    start: { x: E.x, y: E.y, dir: 8 },
    build(b) {
      b.fill(null, 'vacio');
      b.rect(null, 1, 1, 13, 10, brush);
      b.stamp('salida_casa', E.x - 2, E.y);
      furnish(b);
    },
    warps: exitWarps(E.x, E.y, { map: 'ciudad_lumina', x: OUT.x, y: OUT.y, dir: 2 }),
    events: [...exitArrowEvents(E.x, E.y + 1), ...events],
  };
}
