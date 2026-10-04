// Construcción de la Cámara del Cruce (tileset 8 InteriorLiga + kit común de Pilar; el tinte plata lo pone el mapa).
// Salas solemnes (`sala_<color>`: pared de mármol, suelo y marco) que flotan sobre el abismo de la Sima: fuera de las
// salas y en los huecos de su suelo no hay tiles (se ve el panorama `sima`; `voidBlocks` los hace intransitables).
// El suelo de cada sala es el enlosado antiguo del kit, recortado alrededor de los huecos (su bordillo marca el
// borde del abismo). Las puertas del norte son dinteles con el hueco negro; las escalinatas bajan a la sala anterior.
// Módulo puro: solo pinta tiles (los eventos están en content/events/b18_cruce.js y b18_nucleo.js).
import { ROOM_PLACES, NUCLEO, SHORTCUT } from './cruce_layout.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';

const VOID_BLACK = 384; // negro del marco y de los huecos de las puertas (bloquea)

function blank(b, x, y) {
  b.set(0, x, y, VOID_BLACK);
  b.set(1, x, y, 0);
  b.set(2, x, y, 0);
}
function hole(b, x, y) {
  b.set(0, x, y, 0);
  b.set(1, x, y, 0);
  b.set(2, x, y, 0);
}
const cells = (x, y, w, h) => {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
};

/** Puerta en la pared norte: hueco negro de tres casillas (las tres filas de pared) y el dintel encima. */
function gate(b, g) {
  for (const h of g.hollow) for (let y = h.y - 2; y <= h.y; y++) blank(b, h.x, y);
  b.stamp('pilar_dintel', g.dintel.x, g.dintel.y);
}

/** Escalinata de bajada (3×3) con el marco abierto debajo (los warps están en su última fila). */
function stairs(b, s, room) {
  b.stamp('pilar_escalinata', s.stamp.x, s.stamp.y);
  const frameY = room.y + room.h;
  for (let x = s.stamp.x; x <= s.stamp.x + 2; x++) blank(b, x, frameY);
}

/** Casillas de suelo de una sala: la rejilla sin huecos + las tres filas de la escalinata. */
function floorCells(r) {
  const out = [];
  const g = r.grid;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const c = g.at(x, y);
      if (c !== ' ' && c !== 'D') out.push([r.ox + x, r.oy + y]);
    }
  }
  const last = r.room.y + r.room.h - 1;
  for (let y = r.oy + g.h; y <= last; y++) {
    for (let x = r.room.x; x < r.room.x + r.room.w; x++) {
      if (y === last && (x === r.room.x || x === r.room.x + r.room.w - 1)) continue; // esquinas del marco
      out.push([x, y]);
    }
  }
  return out;
}

/** Decorado de las filas bajas de una sala (fuera de la rejilla): columnas, luces y glifos a los lados. */
function lowerDecor(b, r) {
  const g = r.grid;
  const y0 = r.oy + g.h;
  const left = r.room.x + 1;
  const right = r.room.x + r.room.w - 2;
  b.stamp('pilar_columna', left, y0);
  b.stamp('pilar_columna', right, y0);
  b.stamp('luz_suelo', left + 2, y0 + 1);
  b.stamp('pilar_glifo', left + 1, y0 + 2);
  b.stamp('pilar_glifo_2', right - 1, y0 + 2);
  // El vestíbulo lleva la estela de los Custodios a la derecha de la escalinata (content/events/b18_cruce.js#STELE)
  if (r.name === 'vestibulo') b.stamp('pilar_placa_unown', r.room.x + 8, y0);
  else b.stamp('luz_suelo', right - 2, y0 + 1);
}

function paintRoom(b, r) {
  b.rect(null, r.room.x, r.room.y, r.room.w, r.room.h, r.color);
  b.paint('pilar_enlosado', floorCells(r));
  const g = r.grid;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const c = g.at(x, y);
      if (c === ' ' || c === 'D') hole(b, r.ox + x, r.oy + y);
    }
  }
  stairs(b, r.stairs, r.room);
  if (r.gate) gate(b, r.gate);
  lowerDecor(b, r);
}

function paintNucleo(b) {
  const N = NUCLEO;
  b.rect(null, N.room.x, N.room.y, N.room.w, N.room.h, 'sala_blanco');
  // El mismo enlosado antiguo que las salas (la baldosa roja de la sala no casa con el «mármol plateado» del Pilar)
  const floor = cells(N.room.x, N.floorTop, N.room.w, N.floorBottom - N.floorTop + 1)
    .filter(([x, y]) => !(y === N.floorBottom && (x === N.room.x || x === N.room.x + N.room.w - 1)));
  b.paint('pilar_enlosado', floor);
  // Dos mitades: la del tiempo (azul, Dialga) y la del espacio (lila, Palkia), con el núcleo en el cruce
  b.paint('alfombra_azul', cells(N.room.x + 1, N.floorTop + 1, 7, 8));
  b.paint('alfombra_lila', cells(N.cx + 1, N.floorTop + 1, 7, 8));
  b.paint('alfombra_rombos', cells(N.cx - 1, N.floorTop + 6, 3, 6));
  b.stamp('pilar_camara_nucleo', N.chamber.x, N.chamber.y);
  b.stamp('pilar_escalinata', N.stairs.stamp.x, N.stairs.stamp.y);
  for (let x = N.stairs.stamp.x; x <= N.stairs.stamp.x + 2; x++) blank(b, x, N.room.y + N.room.h);
  b.stamp('pilar_placa_unown', N.inscription.x, N.inscription.y - 1);
  for (const [x, y] of [[N.room.x + 1, N.floorTop + 1], [N.room.x + N.room.w - 2, N.floorTop + 1], [N.room.x + 1, N.floorBottom - 2], [N.room.x + N.room.w - 2, N.floorBottom - 2]]) {
    b.stamp('pilar_columna', x, y - 2);
  }
  for (const [x, y] of [[N.cx - 6, N.floorTop + 9], [N.cx + 6, N.floorTop + 9]]) b.stamp('pilar_arista_grande', x, y - 1);
  for (const [x, y] of [[N.cx - 3, N.floorTop], [N.cx + 3, N.floorTop]]) b.stamp('luz_suelo', x, y);
}

export function buildCruce(b) {
  for (const r of ROOM_PLACES) paintRoom(b, r);
  gate(b, SHORTCUT);
}

export function buildCruceNucleo(b) {
  buildPilarHall(b, { floor: { x: NUCLEO.room.x, y: NUCLEO.floorTop, w: NUCLEO.room.w, h: NUCLEO.floorBottom - NUCLEO.floorTop + 1 } });
  // El núcleo conserva su decoración y sus pasillos: no añadir bases en casillas de guardados antiguos.
  for (let y = NUCLEO.room.y; y < NUCLEO.room.y + NUCLEO.room.h; y++) {
    for (let x = NUCLEO.room.x; x < NUCLEO.room.x + NUCLEO.room.w; x++) b.set(2, x, y, 0);
  }
  paintNucleo(b);
}
