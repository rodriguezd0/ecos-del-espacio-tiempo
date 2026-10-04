export function cells(x, y, w, h) {
  return Array.from({ length: w * h }, (_, i) => [x + i % w, y + Math.floor(i / w)]);
}
function palms(b, points) { for (const [x, y] of points) b.paint('palmeral', cells(x, y, 2, 4)); }
export function buildPort(b) {
  b.fill(0, 'agua'); b.rect(null, 1, 1, 46, 31, 'playa');
  b.rect(0, 3, 3, 42, 24, 'cesped'); b.rect(null, 4, 17, 44, 4, 'camino_arena');
  b.rect(0, 20, 27, 5, 11, 'cesped'); b.rect(1, 20, 27, 5, 11, 'nexo_muelle');
  b.stamp('centro_pokemon', 6, 6); b.stamp('faro', 32, 2);
  b.stamp('tienda_campana', 19, 6); b.stamp('cartel_madera', 18, 24);
  palms(b, [[3, 4], [14, 5], [39, 5], [4, 22], [37, 22], [40, 22]]);
  for (const [x, y] of [[13, 24], [31, 24]]) b.stamp('roca_gris', x, y);
}
export function buildPalmRoad(b) {
  b.fill(null, 'cesped'); b.rect(null, 0, 0, 48, 3, 'acantilado');
  b.rect(null, 0, 33, 48, 3, 'agua'); b.rect(null, 1, 19, 46, 3, 'camino_arena');
  palms(b, [[3, 5], [7, 4], [11, 6], [16, 4], [32, 5], [37, 4], [42, 6],
    [4, 25], [9, 27], [16, 26], [23, 26], [31, 25], [39, 27], [44, 25]]);
  b.rect(null, 20, 10, 11, 8, 'camino_tierra'); b.rect(null, 13, 10, 4, 5, 'hierba_alta');
  b.rect(null, 34, 25, 3, 5, 'hierba_alta'); b.stamp('cartel_madera', 5, 18);
}
export function buildSalinas(b) {
  b.fill(null, 'camino_arena'); b.rect(null, 0, 0, 48, 4, 'bosque');
  b.rect(null, 0, 32, 48, 4, 'agua'); b.rect(null, 1, 19, 46, 3, 'camino_tierra');
  for (const [x, y] of [[8, 7], [17, 7], [34, 7], [7, 25], [16, 25], [33, 25]]) {
    b.rect(null, x, y, 6, 5, 'agua'); b.rect(null, x - 1, y - 1, 8, 1, 'camino_tierra');
  }
  b.stamp('cartel_madera', 3, 17); b.stamp('palmera_maceta', 26, 5);
}
export function buildOasis(b) {
  b.fill(null, 'camino_arena'); b.rect(null, 0, 0, 36, 3, 'acantilado');
  b.rect(null, 0, 27, 36, 5, 'acantilado'); b.rect(null, 1, 19, 34, 3, 'camino_tierra');
  b.rect(null, 12, 11, 12, 8, 'grava');
  for (const [x, y] of [[10, 7], [25, 8], [27, 15], [10, 23]]) b.stamp('palmera_maceta', x, y);
  b.stamp('pilar_zocalo_gastado', 4, 5); b.stamp('pilar_zocalo_gastado', 27, 23);
  b.stamp('roca_grande', 3, 23); b.stamp('cartel_madera', 29, 18);
}
export function buildCandil(b) {
  b.fill(null, 'cesped'); b.rect(null, 0, 0, 40, 3, 'acantilado');
  b.rect(null, 4, 4, 32, 18, 'terraza'); b.stamp('escalera_terraza_ancha', 20, 19);
  b.rect(null, 1, 29, 34, 3, 'camino_tierra'); b.rect(null, 21, 22, 4, 9, 'camino_tierra');
  b.stamp('laboratorio_rojo', 20, 0); b.stamp('cartel_madera', 25, 26);
  for (const [x, y] of [[6, 25], [11, 28], [29, 25], [32, 31]]) b.stamp('roca_grande', x, y);
  palms(b, [[3, 34], [15, 34], [27, 34], [35, 34]]);
}
export function buildCrisol(b) {
  b.fill(null, 'vacio'); b.rect(null, 2, 0, 30, 33, 'sala_pizarra');
  b.rect(null, 15, 9, 5, 22, 'alfombra_rombos');
  b.stamp('estanteria_lab', 4, 5); b.stamp('estanteria_lab', 28, 5);
  b.stamp('consola', 4, 10); b.stamp('consola', 28, 10);
  b.stamp('pilar_columna', 4, 17); b.stamp('pilar_columna', 29, 17);
  b.stamp('pilar_escalinata', 16, 2);
}
export function buildTower(b) {
  b.fill(null, 'vacio'); b.rect(null, 2, 0, 30, 35, 'sala_dorado');
  b.rect(null, 15, 14, 5, 19, 'alfombra_verde'); b.stamp('emblema_suelo', 15, 6);
  b.stamp('pilar_monolito', 6, 6); b.stamp('pilar_monolito', 26, 6);
  b.stamp('pilar_escalinata', 16, 30);
}
