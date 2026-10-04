// Construcción del Santuario del Alma (tileset 11 InteriorTorre + kit común de Pilar; el tinte rosa lo pone el mapa).
// Salas solemnes (`sala_<color>`) sobre la oscuridad: el blanco del patio, el dorado del Saber y del Telar, el morado
// del Sentir y el azul del Querer. Puertas = dintel con el hueco negro en la pared; escalinatas de bajada con el marco
// abierto. Módulo puro: solo pinta tiles (los eventos están en content/events/b16_*.js).
import { PATIO, SABER, SENTIR, QUERER, TELAR, P8_UP, floorTop, floorBottom, mirrorCell } from './santuario_layout.js';
import { MIRROR_ROOMS, ROOM_H, MIRROR_X } from '../../events/b16_mirror_logic.js';
import { WALLS as WIND_WALLS, LEDGES, CORRIDOR_W } from '../../events/b16_wind_logic.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';

const VOID = 384; // negro (bloquea)

function blank(b, x, y) {
  b.set(0, x, y, VOID);
  b.set(1, x, y, 0);
  b.set(2, x, y, 0);
}

/** Dintel sobre la pared norte con el hueco negro detrás (la puerta a otra sala). */
function gate(b, g) {
  for (const h of g.hollow) for (let y = h.y - 2; y <= h.y; y++) blank(b, h.x, y);
  b.stamp('pilar_dintel', g.dintel.x, g.dintel.y);
}

/** Escalinata de bajada (3×3) al pie de la sala con el marco abierto debajo. */
function stairs(b, s, room) {
  b.stamp('pilar_escalinata', s.stamp.x, s.stamp.y);
  const frameY = room.y + room.h;
  for (let x = s.cx - 1; x <= s.cx + 1; x++) blank(b, x, frameY);
}

const room = (b, r, brush) => b.rect(null, r.x, r.y, r.w, r.h, brush);
/** Casillas de suelo de una sala (bajo las tres filas de pared). */
const floorOf = (r) => cells(r.x, floorTop(r), r.w, r.h - 3);
/** Sala del ala del Saber: marco dorado y suelo de enlosado antiguo (piedra que «recuerda»), distinto del resto. */
function saberRoom(b, r) {
  room(b, r, 'sala_dorado');
  b.paint('pilar_enlosado', floorOf(r));
}

/**
 * Obstáculos de una casilla con piezas altas (columnas, bustos, aristas): [[stamp, x, y], …] con (x, y) = casilla de
 * la base. Se pintan de abajo arriba y al final se reescriben las bases, para que la parte alta de una pieza nunca
 * tape (y deje pasar) la base de la de encima.
 */
function obstacles(b, list) {
  const bases = [];
  for (const [name, x, y] of [...list].sort((a, c) => c[2] - a[2])) {
    const def = b.findStamp(name);
    const grids = def && b.stampGrids(def, name);
    if (!grids) continue;
    b.stamp(name, x, y - grids.h + 1);
    for (let l = 0; l < grids.layers.length; l++) {
      const id = grids.layers[l]?.[(grids.h - 1) * grids.w];
      if (id) bases.push([l, x, y, id]);
    }
  }
  for (const [l, x, y, id] of bases) b.set(l, x, y, id);
}

function paintPatio(b, floor) {
  const P = PATIO;
  buildPilarHall(b, { floor: { x: P.room.x, y: floorTop(P.room), w: P.room.w, h: P.room.h - 3 }, up: P8_UP[floor], down: { x: 40, y: 58 } });
  // Camino de alfombra desde la escalinata hasta el hexágono sellado y, en cruz, hasta cada dintel
  b.paint('alfombra_rombos', [...cells(39, 49, 3, 7), ...cells(31, 50, 19, 3), ...cells(31, 49, 3, 1), ...cells(47, 49, 3, 1)]);
  if (floor === 3) b.stamp('pilar_camara_nucleo', P.dais.x, P.dais.y);
  gate(b, floor === 1 ? P.gates.saber : floor === 2 ? P.gates.sentir : P.gates.querer);
  b.stamp('pilar_manantial', P.spring.x, P.spring.y);
  // Estatuas en los extremos, columnas junto a los dinteles, glifos y aristas en el suelo
  for (const [x, y] of P.statues) b.stamp('estatua_busto', x, y - 2);
  for (const x of [35, 45]) b.stamp('pilar_columna', x, floorTop(P.room) - 2);
  for (const [x, y] of [[36, 57], [44, 57], [30, 50], [50, 52], [34, 53], [46, 53]]) b.stamp(x % 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
  // La columna del rellano ocupa (51,54–56); una arista aquí cortaría su base.
  b.stamp('pilar_arista_grande', 47, 56);
  b.stamp('pilar_monolito', 34, 55);
  b.stamp('pilar_columna_quebrada', 29, 57);
}

function paintSaber(b) {
  const S = SABER;
  // Sala de los glifos: pedestales en fila, relieves (eventos) en la pared y la puerta a las rondas
  saberRoom(b, S.glyphRoom.room);
  stairs(b, S.glyphRoom.entry, S.glyphRoom.room);
  gate(b, S.glyphRoom.gate);
  for (const p of S.glyphRoom.pedestals) b.stamp('pilar_pedestal', p.x, p.y - 1);
  b.paint('alfombra_beige', cells(3, 10, 17, 1));
  b.stamp('estatua_busto', 1, 9);
  b.stamp('estatua_busto', 21, 9);
  b.stamp('pilar_glifo', 4, 12);
  b.stamp('pilar_glifo_2', 18, 12);
  // Tres puertas: alfombra delante de las puertas y luces en el suelo junto a la escalinata
  saberRoom(b, S.doors3.room);
  b.paint('alfombra_granate', cells(3, 20, 9, 2));
  stairs(b, S.doors3.entry, S.doors3.room);
  b.stamp('pilar_placa_unown', S.doors3.stele.x, S.doors3.stele.y);
  b.stamp('pilar_columna', 12, 21);
  b.stamp('pilar_arista', 12, 25);
  for (const [x, y] of [[4, 25], [10, 25]]) b.stamp('luz_suelo', x, y);
  b.stamp('pilar_glifo_2', 2, 26);
  // Cuatro puertas
  saberRoom(b, S.doors4.room);
  b.paint('alfombra_granate', cells(3, 33, 13, 2));
  stairs(b, S.doors4.entry, S.doors4.room);
  b.stamp('pilar_placa_unown', S.doors4.stele.x, S.doors4.stele.y);
  b.stamp('pilar_columna', 1, 34);
  b.stamp('pilar_arista', 17, 37);
  for (const [x, y] of [[6, 38], [12, 38]]) b.stamp('luz_suelo', x, y);
  b.stamp('pilar_glifo', 3, 38);
  // Cámara de Uxie: enlosado, alfombra dorada bajo el núcleo y luces a los lados
  saberRoom(b, S.uxie.room);
  b.paint('alfombra_beige', cells(5, 46, 7, 5));
  stairs(b, S.uxie.entry, S.uxie.room);
  b.stamp('pilar_camara_nucleo', S.uxie.chamber.x, S.uxie.chamber.y);
  for (const [x, y] of [[3, 47], [13, 47], [3, 51], [13, 51]]) b.stamp('pilar_columna', x, y - 2);
  for (const [x, y] of [[3, 48], [13, 48]]) b.stamp('luz_suelo', x, y);
  b.stamp('pilar_arista_grande', 1, 52);
}

function paintMirrorRoom(b, m) {
  const r = m.room;
  room(b, r, 'sala_morado');
  const logic = MIRROR_ROOMS[m.n - 1];
  // El mundo del reflejo (a la derecha del espejo) sobre alfombra lila
  const right = [];
  for (let gy = 0; gy < ROOM_H; gy++) for (let gx = MIRROR_X + 1; gx < logic.rows[0].length; gx++) if (!(gy === ROOM_H - 1 && gx === 16)) right.push([r.x + gx, floorTop(r) + gy]);
  b.paint('alfombra_lila', right);
  // Losa de eco (reinicio) antes de los obstáculos: su marco 3×3 no debe tapar la base de ninguno
  b.stamp('pilar_losa_eco', m.reset.x - 1, m.reset.y - 1);
  const list = [];
  for (const [gx, gy] of logic.obstacles) {
    const c = mirrorCell(r, gx, gy);
    if (gy === ROOM_H - 1 && (gx === 0 || gx === 16)) continue; // esquinas recortadas del marco
    if (gx < MIRROR_X) list.push([(gx + gy) % 3 === 0 ? 'estatua_busto' : 'pilar_columna', c.x, c.y]);
    else list.push([(gx + gy) % 2 ? 'pilar_arista' : 'pilar_columna_quebrada', c.x, c.y]);
  }
  obstacles(b, list);
  // Salida hacia el patio (abajo a la izquierda) y puerta a la sala siguiente
  blank(b, m.exitBelow.x, floorBottom(r) + 1);
  gate(b, m.gate);
}

function paintSentir(b) {
  for (const m of SENTIR.mirrors) paintMirrorRoom(b, m);
  const L = SENTIR.lastMirror;
  room(b, L.room, 'sala_morado');
  stairs(b, L.entry, L.room);
  b.paint('alfombra_lila', cells(48, 5, 7, 3));
  for (const x of [47, 55]) b.stamp('pilar_columna', x, 4);
  b.stamp('estatua_busto', 45, 8);
  b.stamp('estatua_busto', 57, 8);
  const M = SENTIR.mesprit;
  room(b, M.room, 'sala_morado');
  b.paint('alfombra_lila', cells(47, 18, 9, 7));
  stairs(b, M.entry, M.room);
  for (const [x, y] of [[46, 20], [56, 20]]) b.stamp('luz_suelo', x, y);
  b.stamp('pilar_camara_nucleo', M.chamber.x, M.chamber.y);
  for (const [x, y] of [[47, 19], [55, 19]]) b.stamp('pilar_columna', x, y - 2);
  b.stamp('pilar_arista_grande', 45, 23);
}

function paintQuerer(b) {
  const Wd = QUERER.wind;
  room(b, Wd.room, 'sala_azul');
  // Canales de resonancia: cada tramo horizontal de '#' es una línea de canal (bloquea)
  const rows = new Map();
  for (const [gx, gy] of WIND_WALLS) {
    if (gy === 16 && (gx === 0 || gx === CORRIDOR_W - 1)) continue; // esquinas recortadas
    rows.set(gy, [...(rows.get(gy) || []), gx]);
  }
  for (const [gy, xs] of rows) b.paint('pilar_canal', xs.map((gx) => [Wd.room.x + gx, floorTop(Wd.room) + gy]));
  for (const [gx, gy] of LEDGES) b.stamp('luz_suelo', Wd.room.x + gx, floorTop(Wd.room) + gy);
  blank(b, Wd.exitBelow.x, floorBottom(Wd.room) + 1);
  gate(b, Wd.gate);
  const A = QUERER.azelf;
  room(b, A.room, 'sala_azul');
  b.paint('alfombra_azul', cells(64, 28, 9, 7));
  stairs(b, A.entry, A.room);
  b.stamp('pilar_camara_nucleo', A.chamber.x, A.chamber.y);
  for (const [x, y] of [[63, 29], [73, 29], [63, 33], [73, 32]]) b.stamp('pilar_columna', x, y - 2);
}

function paintTelar(b) {
  const T = TELAR;
  room(b, T.room, 'sala_dorado');
  stairs(b, T.entry, T.room);
  b.paint('alfombra_beige', cells(47, 32, 9, 7));
  b.stamp('pilar_camara_nucleo', T.emblem.x, T.emblem.y);
  for (const [x, y] of [[45, 33], [57, 33], [45, 38], [57, 38]]) b.stamp('pilar_columna', x, y - 2);
  for (const [x, y] of [[47, 39], [55, 39]]) b.stamp('pilar_monolito', x, y - 2);
  b.stamp('pilar_arista_grande', 44, 40);
  b.stamp('pilar_arista_grande', 57, 40);
  b.stamp('pilar_glifo', 49, 39);
  b.stamp('pilar_glifo_2', 53, 39);
}

function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

export function buildSantuarioFloor(b, floor) {
  paintPatio(b, floor);
  if (floor === 1) paintSaber(b);
  if (floor === 2) paintSentir(b);
  if (floor === 3) { paintQuerer(b); paintTelar(b); }
}

export const buildSantuario = (b) => buildSantuarioFloor(b, 1);
