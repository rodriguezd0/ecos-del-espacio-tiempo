// Grandes Almacenes de Lúmina, planta baja (CAMPANA §1.3 y POKEDEX §7.4): planta de Interior1 con el mostrador en isla.
// Dos dependientes: artículos generales y Poké Balls especiales (tablas por Pilares de services/shop.js). Escalera a la
// primera planta (piedras evolutivas y Cordón Unión). Tileset 4, 19×18.
import { OUTSIDE, INTERIOR_ENTRY } from './lumina_layout.js';
import { clerkEvent } from '../../services/shop.js';
import { SPRITE, examine, npc } from '../../events/b09a_common.js';

const E = INTERIOR_ENTRY.lumina_almacenes;
const OUT = OUTSIDE.almacenes;
/** Escalera (casilla que se pisa) y llegada desde la primera planta. */
export const STAIRS = Object.freeze({ x: 2, y: 4 });
export const FROM_UP = Object.freeze({ x: 3, y: 4, dir: 6 });

export default {
  id: 'lumina_almacenes',
  name: 'Grandes Almacenes',
  tileset: 4,
  width: 19,
  height: 18,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('grandes_almacenes', 0, 0);
  },

  warps: [
    ...[8, 9, 10].map((x) => ({ x, y: 16, to: 'ciudad_lumina', tx: OUT.x, ty: OUT.y, dir: 2, door: true })),
    { x: STAIRS.x, y: STAIRS.y, to: 'lumina_almacenes_2', tx: 3, ty: 4, dir: 6 },
  ],

  events: [
    clerkEvent({ id: 'dependiente_general', x: 8, y: 10, dir: 2, sprite: SPRITE.clerk, list: 'general', greeting: '¡Grandes Almacenes de Lúmina, buenas! Planta baja: todo para el viaje.' }),
    clerkEvent({ id: 'dependiente_balls', x: 10, y: 10, dir: 2, sprite: SPRITE.clerk, list: 'balls', extra: ['GREATBALL', 'ULTRABALL'], greeting: 'Sección de Poké Balls. Tenemos de todo tipo.' }),
    examine('ascensor', 9, 3, 'El ascensor está en revisión. Usa la escalera, por favor.', { solid: true }),
    examine('estante_izq', 1, 7, 'Estanterías con mochilas, cantimploras y mapas de Axis.'),
    examine('estante_der', 17, 7, 'Estanterías con recuerdos de Lúmina: postales del museo y Staravia de peluche.'),
    npc('cliente_almacenes', 14, 13, SPRITE.neighbor, 'Clienta', ['Arriba venden piedras evolutivas. Mi Eevee todavía no ha decidido qué quiere ser.'], { dir: 4 }),
    npc('nino_almacenes', 4, 12, SPRITE.child, 'Niño', ['¡Mi madre me ha comprado una Poké Ball de verdad! Todavía no he atrapado nada.'], { dir: 2, move: { wander: 2 } }),
  ],
};
