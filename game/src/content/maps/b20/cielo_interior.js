// Cielo Interior — la caverna con cielo propio del Pilar del Origen (docs/CAMPANA.md B20: «8 + panorama `cielo`»; §1.8
// Trío de las Nubes · Volando). Islas de piedra sobre un mar de nubes (panorama de Añil `cielo`) con las piezas del kit de
// Pilar; se hace en Cueva1 (tileset 2) porque sus islas flotantes con cara de roca son las del Mundo Distorsión (B12),
// con el tinte dorado del Origen. Caer al vacío devuelve al último punto seguro (world/impossible).
// Coordenadas: layout.js (CIELO) · eventos: content/events/b20_cielo.js.
import { CIELO } from './layout.js';
import { paintPlatform, raggedIsland, union, rectSet, floatingDebris } from '../b12/paint.js';
import { cieloEvents, cieloOnEnter } from '../../events/b20_cielo.js';
import { MUSIC } from '../../events/b20_common.js';
import { pilarTone } from '../../stamps/pilar.js';

const key = (x, y) => `${x},${y}`;

/** Casillas que la decoración y el contorno irregular no deben tocar. */
function keepCells() {
  const k = new Set();
  const add = (x, y) => k.add(key(x, y));
  for (const t of Object.values(CIELO.trio)) { add(t.at.x, t.at.y); for (const [x, y] of t.strip) add(x, y); add(t.retry.x, t.retry.y); }
  for (const s of CIELO.springs) { add(s.stand.x, s.stand.y); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) add(s.x + i, s.y + j); }
  for (const it of CIELO.items) add(it.x, it.y);
  add(CIELO.arrive.x, CIELO.arrive.y); add(CIELO.back.x, CIELO.back.y); add(CIELO.gate.x, CIELO.gate.y); add(CIELO.gateStand.x, CIELO.gateStand.y);
  // pasarelas (x 14–16) de arriba abajo
  for (let y = 0; y < CIELO.h; y++) for (let x = 14; x <= 16; x++) add(x, y);
  const c = CIELO.council;
  add(c.player.x, c.player.y); for (const p of [c.tornadus, c.thundurus, c.landorus, c.zygarde]) add(p[0], p[1]);
  return k;
}

export function buildCielo(b) {
  const keep = keepCells();
  const floor = union(...CIELO.islands.map((r, i) => {
    const narrow = r.x1 - r.x0 < 4 || r.y1 - r.y0 < 4;
    return narrow ? rectSet(r) : raggedIsland(r, { keep, seed: 30 + i * 7, bites: 0.1 });
  }));
  paintPlatform(b, { floor, reserved: keep, seed: 41, decals: 0.05 });
  for (const s of CIELO.springs) b.stamp('pilar_manantial', s.x, s.y);
  for (const t of Object.values(CIELO.trio)) b.stamp('pilar_camara_nucleo', t.at.x - 2, t.at.y - 2);
  // Columnas y aristas al borde de las terrazas; el arco de la Terraza en la isla más alta. Cada terraza lleva además
  // el rastro de su guardián para que no se repitan: columnas mordidas por el viento (Tornadus), cristales cargados
  // (Thundurus) y peñas caídas (Landorus).
  // [stamp, x, y, ancho, alto]: solo se coloca si TODA la pieza cae sobre la isla y fuera de las casillas reservadas.
  const deco = [
    ['pilar_columna', 8, 38, 1, 3], ['pilar_columna', 22, 38, 1, 3], ['pilar_columna', 8, 23, 1, 3], ['pilar_columna', 22, 23, 1, 3],
    ['pilar_columna', 8, 8, 1, 3], ['pilar_columna', 22, 8, 1, 3],
    ['pilar_arista_grande', 20, 49, 2, 2], ['pilar_arista', 11, 18, 1, 2], ['pilar_columna_quebrada', 19, 33, 1, 2],
    ['pilar_monolito', 12, 2, 2, 3], ['pilar_monolito', 17, 2, 2, 3],
    ['pilar_arista', 10, 43, 1, 2], ['pilar_columna_quebrada', 21, 27, 1, 2], ['pilar_arista', 9, 12, 1, 2],
    ['pilar_columna_quebrada', 9, 39, 1, 2], ['pilar_columna_quebrada', 19, 40, 1, 2], ['musgo_rocas', 17, 43, 2, 1],
    ['gota_cristal', 11, 27, 1, 2], ['gota_cristal', 19, 24, 1, 2], ['gota_cristal', 10, 24, 1, 2],
    ['roca_grande_gris', 19, 11, 2, 3], ['roca_musgo_gris', 10, 9, 2, 2], ['roca_peque_gris', 21, 13, 1, 2],
  ];
  const fits = (x, y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (keep.has(key(x + i, y + j)) || !floor.has(key(x + i, y + j))) return false;
    return true;
  };
  for (const [name, x, y, w, h] of deco) if (fits(x, y, w, h)) b.stamp(name, x, y);
  floatingDebris(b, [[2, 4, 2], [26, 12, 3], [3, 30, 2], [26, 40, 2], [4, 50, 2], [25, 52, 2], [2, 18, 3]]);
}

export default {
  id: 'cielo_interior',
  name: 'Cielo Interior',
  tileset: 2,
  width: CIELO.w,
  height: CIELO.h,
  outdoor: false,
  cave: true,
  bgm: MUSIC.sky,
  battleback: 'Volando',
  tone: pilarTone('P10', 0.35),
  // paralaje 0.18: con 56 casillas de alto el desplazamiento máximo (1408 × 0.18 ≈ 253 px) + la pantalla (384) no pasa
  // de los 640 px de la imagen, así que el panorama no se repite (arriba el cielo; abajo, el mar de nubes)
  panorama: Object.freeze({ image: 'anil:Graphics/Panoramas/cielo.png', parallax: 0.18 }),
  noFollower: true,
  mount: false,
  escapeRope: true,
  encounters: {},
  start: { ...CIELO.arrive },
  impossible: { section: 'cielo_interior', spawn: { ...CIELO.arrive }, fallFlag: 'b20_cielo_caida' },
  build: buildCielo,
  warps: [],
  onEnter: cieloOnEnter,
  events: cieloEvents(),
};
