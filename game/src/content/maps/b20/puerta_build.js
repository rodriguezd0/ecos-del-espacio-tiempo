// Construcción de la Puerta de las Quince (docs/CAMPANA.md B20): el fondo de la Sima del Eje en Cueva1 gris (tileset 2)
// con el kit de Pilar. De sur a norte: la plaza de la llegada, el muro de roca alzada con los nichos (la Puerta) y el
// hueco de la losa, el abismo donde las Tablillas proyectan el camino, y la repisa del norte con la boca de la Senda.
// Módulo PURO: solo tiles (eventos en content/events/b20_puerta.js).
import { PUERTA } from './layout.js';
import { ABYSS, rect, decorate, scatterGlyphs, around, cellSet, key } from './paint.js';

const P = PUERTA;

export function buildPuerta(b) {
  const F = P.floor;
  b.fill(0, 'vacio');
  b.rect(null, F.x, F.y, F.w, F.h, 'sala_gris');
  // El abismo (y 6–13) salvo el umbral delante de la losa
  const threshold = cellSet(rect(P.threshold.x0, P.threshold.y, P.threshold.x1, P.threshold.y));
  for (let y = P.abyss.y0; y <= P.abyss.y1; y++) {
    for (let x = F.x; x < F.x + F.w; x++) {
      if (threshold.has(key(x, y))) continue;
      b.set(0, x, y, ABYSS);
      b.set(1, x, y, 0);
    }
  }
  // La Puerta: muro de roca alzada (y 14–17) con el hueco de la losa
  const wall = rect(F.x, P.wall.y0, F.x + F.w - 1, P.wall.y1).filter(([x]) => x < P.doorway.x0 || x > P.doorway.x1);
  b.paint('macizo_gris', wall);
  // Enlosado: repisa del norte, umbral y hueco, calzada central y plaza
  b.paint('pilar_enlosado', rect(12, P.ledge.y0, 20, P.ledge.y1));
  b.paint('pilar_enlosado', rect(P.doorway.x0, P.threshold.y, P.doorway.x1, P.wall.y1));
  b.paint('pilar_enlosado', rect(7, 19, 25, 29));
  b.paint('pilar_enlosado', rect(15, 29, 17, 32));
  b.paint('mancha_gris', [...rect(4, 30, 11, 31), ...rect(21, 30, 27, 31), ...rect(4, 18, 6, 22), ...rect(26, 18, 27, 23)]);
  // Medallón de núcleo en el centro de la plaza (eco de las cámaras de los Pilares)
  b.stamp('pilar_camara_nucleo', 14, 22);
  // Bocas: la Senda (norte) y la claridad hacia la Sima (sur)
  b.stamp('boca_norte_gris', P.exit.x - 1, 0);
  b.stamp('salida_luz_sur_gris', P.back.x - 1, P.back.y - 1);
  b.stamp('pilar_placa_unown', P.stele.x, P.stele.y);
  // Piezas del kit: monolitos y columnas que enmarcan la Puerta, aristas y restos
  const reserved = around([
    ...P.niches.map((n) => [n.x, n.y + 1]), [P.slab.x, P.slab.y + 1], [P.arrive.x, P.arrive.y], [P.arrive.x, P.arrive.y - 1],
    ...P.items.map((it) => [it.x, it.y]), [P.stele.x, P.stele.y + 2], [P.stele.x + 1, P.stele.y + 2],
  ]);
  decorate(b, [
    ['pilar_monolito', 4, 19, 2, 3], ['pilar_monolito', 26, 19, 2, 3], ['pilar_columna', 13, 18, 1, 3], ['pilar_columna', 19, 18, 1, 3],
    ['pilar_columna', 7, 26, 1, 3], ['pilar_columna', 24, 26, 1, 3], ['pilar_arista_grande', 4, 27, 2, 2], ['pilar_arista_grande', 26, 27, 2, 2],
    ['pilar_columna_quebrada', 11, 29, 1, 2], ['pilar_columna_quebrada', 21, 29, 1, 2], ['pilar_arista', 22, 23, 1, 2],
    ['roca_grande_gris', 27, 24, 2, 3], ['matojo_cueva_gris', 3, 24, 2, 2], ['musgo_rocas', 9, 31, 2, 1],
    ['pilar_columna_quebrada', 12, 4, 1, 2], ['pilar_columna_quebrada', 20, 4, 1, 2], ['pilar_arista', 5, 4, 1, 2], ['roca_grande_gris', 25, 3, 2, 3],
  ], reserved);
  const noGlyph = new Set([...reserved, ...rect(14, 22, 18, 26).map(([x, y]) => key(x, y))]);
  scatterGlyphs(b, rect(7, 19, 25, 29), { seed: 20, chance: 0.05, reserved: noGlyph });
}
