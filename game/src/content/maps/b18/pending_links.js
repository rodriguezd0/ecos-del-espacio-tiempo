// Enlaces del Bloque 18 con los mapas de B17 (docs/CAMPANA.md §1.4 «Sima del Eje: N Senda del Mirador (Caudal) · S
// Mirador Sur (Lúmina)»; B17 «Salida: la Senda del Mirador, en el borde norte de la Sima»). El Puente es el tramo
// central: el estribo norte y el arranque del tablero están en la Senda del Mirador (tablero x 18–22 hasta su borde
// sur) y el estribo sur en el Mirador Sur (tablero x 19–21 desde su borde norte). Conexiones con offset 0 en los dos
// sentidos (B17 las declara en senda_mirador.js y mirador_sur.js: `BRIDGE.south` y `DECK.north` de sus layouts).
// Mientras un destino no esté registrado, el borde queda cerrado por el propio mapa. Módulo puro.
import { MAPS } from '../index.js';
import { NORTH_EXIT, SOUTH_EXIT } from './puente_layout.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

export const PENDING_LINKS = Object.freeze({
  senda_mirador: Object.freeze({
    dir: 'north', to: 'senda_mirador', block: 'B17', offset: 0, x0: NORTH_EXIT.x0, x1: NORTH_EXIT.x1,
    expect: 'La Senda del Mirador (B17) lleva su tablero (x 18–22) hasta el borde sur y conecta `south` → puente_convergencia con offset 0.',
  }),
  mirador_sur: Object.freeze({
    dir: 'south', to: 'mirador_sur', block: 'B17', offset: 0, x0: SOUTH_EXIT.x0, x1: SOUTH_EXIT.x1,
    expect: 'El Mirador Sur (B17) empieza su tablero (x 19–21) en el borde norte y conecta `north` → puente_convergencia con offset 0.',
  }),
});

/** Conexión lista para `connections` si el destino existe; si no, null. */
export function linkIfReady(id) {
  const link = PENDING_LINKS[id];
  if (!link || !mapRegistered(link.to)) return null;
  return { dir: link.dir, to: link.to, offset: link.offset };
}
