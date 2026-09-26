// Construcción del Archivo Hondo (InteriorTorre, tileset 11, con el kit común de Pilar; el tinte sepia lo pone el
// mapa). Plataformas de enlosado antiguo sobre el vacío unidas en espiral; estanterías y vitrinas de archivo en los
// bordes, columnas, glifos y aristas; losas de recuerdo (pilar_losa_eco) donde aparecen los ecos-custodios; dinteles
// en cada paso entre estancias; la cámara de núcleo en el centro. El Suelo Olvidado no tiene tiles: es el vacío
// que se pisa (casillas sin pintar = transitables y negras). Módulo puro.
import { FLOORS, SUELO, MANOS, LECTURA, ROLLOS, MURAL, NUCLEO, ENTRY, rectCells } from './hondo_layout.js';

function paintFloors(b) {
  const cells = [];
  for (const r of Object.values(FLOORS)) cells.push(...rectCells(r));
  const seen = new Set();
  const uniq = cells.filter(([x, y]) => (seen.has(`${x},${y}`) ? false : (seen.add(`${x},${y}`), true)));
  b.paint('pilar_enlosado', uniq);
}

/** Suelo Olvidado: la rejilla queda sin tiles (se pisa, pero no se ve). Columnas quebradas en las orillas. */
function paintSuelo(b) {
  const g = SUELO.grid;
  b.erase(0, g.x, g.y, g.w, g.h);
  b.erase(1, g.x, g.y, g.w, g.h);
  b.erase(2, g.x, g.y, g.w, g.h);
  b.stamp('pilar_losa_eco', SUELO.losa.x, SUELO.losa.y);
  b.stamp('pilar_columna_quebrada', 9, 1);
  b.stamp('pilar_columna_quebrada', 19, 1);
  b.stamp('pilar_zocalo_gastado', 9, 6);
  b.stamp('pilar_zocalo_gastado', 19, 6);
  b.stamp('pilar_escalinata', ENTRY.stairs.x, ENTRY.stairs.y);
  b.stamp('estanteria_roja', 7, 0);
  b.stamp('estatua_busto', 1, 1);
  b.stamp('pilar_glifo', 2, 5);
  b.stamp('pilar_glifo_2', 21, 3);
  b.stamp('vitrina', 20, 0);
}

function paintManos(b) {
  b.stamp('pilar_losa_eco', MANOS.losa.x, MANOS.losa.y);
  b.stamp('pilar_dintel', MANOS.dintel.x, MANOS.dintel.y);
  for (const x of [28, 33, 35, 44]) b.stamp('pilar_columna', x, 0);
  b.stamp('estanteria_roja', 36, 0);
  b.stamp('estanteria_lab', 38, 0);
  b.stamp('pilar_glifo', 30, 7);
  b.stamp('pilar_glifo_2', 43, 7);
  b.stamp('pilar_arista', 28, 7);
}

function paintLectura(b) {
  b.stamp('pilar_placa_unown', LECTURA.stele.x, LECTURA.stele.y);
  b.stamp('pilar_losa_eco', LECTURA.losa.x, LECTURA.losa.y);
  b.stamp('pilar_dintel', LECTURA.dintel.x, LECTURA.dintel.y);
  b.stamp('estanteria_roja', 32, 10);
  b.stamp('estanteria_lab', 38, 10);
  b.stamp('vitrina', 42, 10);
  b.stamp('pilar_columna', 32, 20);
  b.stamp('pilar_columna_quebrada', 44, 21);
  b.stamp('pilar_glifo', 36, 17);
  b.stamp('pilar_glifo_2', 33, 17);
  b.stamp('pilar_arista_grande', 42, 13); // bajo la vitrina, sin pisarla
}

function paintRollos(b) {
  b.stamp('pilar_losa_eco', ROLLOS.losa.x, ROLLOS.losa.y);
  b.stamp('pilar_dintel', ROLLOS.dintel.x, ROLLOS.dintel.y);
  // Estanterías del archivo a lo largo de la pared norte (los cuatro huecos de los Rollos son eventos)
  for (const x of [2, 10, 18, 22, 26]) b.stamp('estanteria_roja', x, 26);
  b.stamp('estanteria_lab', 24, 26);
  b.stamp('vitrina', 28, 26);
  b.stamp('pilar_columna', 2, 33);
  b.stamp('pilar_columna', 30, 34);
  b.stamp('pilar_arista', 12, 35);
  b.stamp('pilar_glifo', 16, 33);
  b.stamp('pilar_glifo_2', 9, 31);
  b.stamp('estatua_busto', 29, 29);
  // Vitrinas de legajos y una estela en la parte baja de la sala (lejos del recorrido del custodio y de la losa)
  b.stamp('vitrina_museo', 4, 30);
  b.stamp('vitrina_museo', 8, 33);
  b.stamp('pilar_placa_unown', 18, 34);
}

function paintMural(b) {
  b.stamp('pilar_dintel', MURAL.dintel.x, MURAL.dintel.y);
  b.stamp('pilar_manantial', MURAL.spring.x, MURAL.spring.y);
  b.stamp('pilar_columna', 1, 18);
  b.stamp('pilar_columna', 18, 18);
  b.stamp('pilar_glifo', 4, 16);
  b.stamp('pilar_glifo_2', 9, 17);
  b.stamp('estatua_busto', 18, 12);
  b.stamp('pilar_arista', 2, 19);
  // Dos monolitos a los lados del paso central y vitrinas junto a la pared oeste (la fila 12 queda libre para leer
  // los paneles; el paso x 7–8 lleva del pasillo de los Rollos al Mural).
  b.stamp('pilar_monolito', 4, 13);
  b.stamp('pilar_monolito', 10, 13);
  b.stamp('vitrina_estrecha', 1, 13);
  b.stamp('vitrina_estrecha', 1, 15);
}

function paintNucleo(b) {
  b.stamp('pilar_camara_nucleo', NUCLEO.camara.x, NUCLEO.camara.y);
  b.stamp('pilar_pedestal', NUCLEO.pedestal.x, NUCLEO.pedestal.y - 1);
  b.stamp('pilar_columna', 24, 10);
  b.stamp('pilar_columna', 26, 10);
  for (const [x, y] of [[21, 14], [30, 14], [21, 22], [30, 17]]) b.stamp('pilar_columna', x, y);
  b.stamp('pilar_monolito', 22, 13);
  b.stamp('pilar_monolito', 28, 13);
  b.stamp('pilar_arista_grande', 21, 19);
  b.stamp('pilar_glifo', 25, 16);
  b.stamp('pilar_glifo_2', 25, 22);
  b.stamp('pilar_escalinata', NUCLEO.stairsUp.x - 1, NUCLEO.stairsUp.y - 2);
}

export function buildHondo(b) {
  b.fill(0, 'vacio');
  paintFloors(b);
  paintSuelo(b);
  paintManos(b);
  paintLectura(b);
  paintRollos(b);
  paintMural(b);
  paintNucleo(b);
}
