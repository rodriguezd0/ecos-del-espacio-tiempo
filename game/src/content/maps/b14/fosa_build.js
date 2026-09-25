// Fosa del Eco, cámara del núcleo del Pilar de los Ecos (docs/CAMPANA.md B14): bolsa de aire en el fondo de la fosa
// (tileset 15, variante gris) con la cámara de núcleo en el centro, el nido de la Bramaluna al norte y, al sur, la
// salida de luz hacia la sala 4. Los helechos y las raíces del eco son eventos (desaparecen tras el P7). Módulo PURO.
import { FOSA } from './layout.js';
import { rect, placeFree, cellSet } from './paint.js';

export function reservedFosa() {
  const out = [...rect(12, 9, 18, 15), ...rect(13, 4, 17, 8)];
  for (let y = 15; y <= 23; y++) out.push([15, y], [14, y], [16, y]);
  out.push([FOSA.upcurrent.x, FOSA.upcurrent.y], [FOSA.upcurrent.x, FOSA.upcurrent.y + 1]);
  return cellSet(out);
}

export function buildFosa(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 24, 19, 'sala_gris');
  const res = reservedFosa();
  // Terrazas de roca que encajonan la cámara (la fosa se estrecha hacia el nido).
  b.paint('macizo_gris', [...rect(3, 5, 9, 9), ...rect(21, 5, 26, 9), ...rect(3, 20, 7, 23), ...rect(24, 20, 26, 23)]);
  // Suelo: limo alrededor, enlosado antiguo bajo el núcleo y el camino desde la entrada.
  b.paint('mancha_gris', [...rect(10, 5, 20, 8), ...rect(5, 11, 10, 18), ...rect(20, 11, 25, 18)]);
  b.paint('pilar_enlosado', [...rect(11, 9, 19, 16), ...rect(14, 17, 16, 23)]);
  b.stamp('pilar_camara_nucleo', FOSA.chamber.x, FOSA.chamber.y);
  b.stamp('salida_luz_sur_gris', FOSA.door.x - 1, 23);
  // Nido: anillo de piedras rotas y restos.
  for (const [n, x, y] of [['roca_musgo_gris', 11, 5], ['roca_musgo_gris', 18, 5], ['musgo_rocas', 13, 4], ['musgo_rocas', 16, 4], ['roca_peque_gris', 12, 7], ['roca_peque_gris', 18, 7]]) b.stamp(n, x, y);
  // Columnas del recinto y aristas del eco.
  for (const [x, y] of [[11, 9], [19, 9], [11, 15], [19, 15]]) b.stamp('pilar_columna', x, y - 2);
  b.stamp('pilar_placa_unown', FOSA.inscription.x, FOSA.inscription.y - 1);
  for (const [x, y] of [[5, 16], [24, 12], [8, 12]]) b.stamp('pilar_arista', x, y);
  b.stamp('pilar_arista_grande', 22, 16);
  const free = (x, y) => x >= 3 && x <= 26 && y >= 5 && y <= 23 && !b.get(2, x, y);
  placeFree(b, [
    ['cristales', 4, 18, 6, 2], ['gota_cristal', 25, 11, 1, 2], ['matojo_cueva_gris', 9, 20, 2, 2],
    ['roca_grande_gris', 21, 19, 2, 3], ['gota_cristal', 6, 11, 1, 2], ['musgo_rocas', 18, 21, 2, 1],
  ], free, res);
}
