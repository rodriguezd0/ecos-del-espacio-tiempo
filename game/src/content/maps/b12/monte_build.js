// Añadidos del B12 a la construcción del Monte del Portal (montana_portal, B01): hierba alta de montaña en las
// terrazas y en la repisa de la cascada, la boca de la gruta, peñas y el bosque del borde este. Se llama al final del
// build del mapa del prólogo; solo pinta en casillas que el prólogo dejó libres (las coordenadas están en layout.js).
import { MONTE } from './layout.js';

export function buildMonteB12(b) {
  for (const g of MONTE.grass) b.rect(1, g.x, g.y, g.w, g.h, 'hierba_alta');
  // Bosque del borde este (al pie del macizo ampliado) y peñas junto a la pared de raíces.
  b.blob(null, [...Array(12)].flatMap((_, j) => [[48, 38 + j], [49, 38 + j]]), 'bosque_pinos');
  for (const [x, y] of [[45, 45], [44, 48]]) b.stamp('roca_gris', x, y);
  b.stamp('roca_grande', 45, 39);
  // Repisa de la cascada: la boca de la gruta, piedras y matas.
  b.stamp('boquete', MONTE.grutaMouth.x, MONTE.grutaMouth.y);
  for (const [x, y] of [[42, 16], [46, 28], [43, 30]]) b.stamp('roca_gris', x, y);
  b.stamp('roca_grande', 46, 16);
  for (const [x, y] of [[41, 12], [47, 9], [44, 18], [42, 27], [47, 24]]) b.stamp('brotes', x, y);
  // Más piedra suelta en la repisa y al oeste del salto (se ve desde las terrazas): solo rocas y matojos, que casan con
  // la roca del macizo (pinos, matas y tocones traen su parche de césped y desentonan). Sin cerrar la senda de la pared
  // de raíces (47,33) a la gruta (44,11) ni al objeto (47,5).
  for (const [x, y] of [[48, 21], [42, 31], [45, 3], [41, 17], [48, 13]]) b.stamp('roca_peque', x, y);
  b.stamp('roca_gris', 41, 4);
  for (const [x, y] of [[43, 33], [48, 29], [41, 23]]) b.stamp('brotes', x, y);
  for (const [x, y] of [[34, 8], [34, 20], [35, 31]]) b.stamp('roca_peque', x, y);
  for (const [x, y] of [[35, 14], [34, 26], [35, 3]]) b.stamp('brotes', x, y);
}
