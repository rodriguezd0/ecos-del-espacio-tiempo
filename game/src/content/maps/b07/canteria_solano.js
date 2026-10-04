import { withB24Events } from '../../events/b24_maps.js';
import { withB22bEvents } from '../../events/b22b_maps.js';
// Galerías de la Cantería Solano (docs/CAMPANA.md «B07»: `canteria_solano` 5 + 2, «galerías estratificadas»; el
// exterior de la cantera —bancales, herrería, patio— está en la Ruta 6, tileset 5). Cueva1 (tileset 2), 60×16:
// tres salas en fila que bajan por los estratos (Galería del Ocre, de la Arcilla y el último estrato), unidas por
// pozos. El derrumbe está hecho de rocas por capas (eventos) y escombros macizos. Salas ASCII en
// content/events/b07_strata_rooms.js; eventos en content/events/b07_galerias.js.
import { ROOMS, room } from '../../events/b07_strata_rooms.js';
import { galeriasEvents, galeriasOnEnter, roomStart } from '../../events/b07_galerias.js';
import { GALERIAS_CANTERIA } from '../../encounters/b07.js';
import { GALERIAS, CANTERIA } from './layout.js';

const G = GALERIAS;
const LEDGE = Object.freeze({ sala: 'saliente', sala_arcilla: 'saliente_arcilla', sala_gris: 'saliente_gris' });
const EXIT_LIGHT = Object.freeze({ sala: 'salida_luz_sur', sala_arcilla: 'salida_luz_sur_arcilla', sala_gris: 'salida_luz_sur_gris' });
const ROCKS = Object.freeze({ sala: 'roca_musgo', sala_arcilla: 'roca_musgo_arcilla', sala_gris: 'roca_musgo_gris' });

const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

/** Rectángulo de suelo de una sala en el mapa: sin las columnas del borde (todas '#'), que ya son pared. */
export function floorRect(n) {
  const r = room(n);
  const o = G.rooms[n];
  return { x0: o.ox + 1, y0: o.oy, x1: o.ox + r.w - 2, y1: o.oy + r.h - 1 };
}

function paintRoom(b, n) {
  const meta = ROOMS[n];
  const f = floorRect(n);
  const o = G.rooms[n];
  const r = room(n);
  b.paint(meta.floor, rect(f.x0, f.y0, f.x1, f.y1));
  const ledges = r.marks.v.map(([x, y]) => [x + o.ox, y + o.oy]);
  if (ledges.length) b.paint(LEDGE[meta.floor], ledges);
  // Manchas de tierra removida bajo el derrumbe (lo que no se pisa) para que no parezca suelo limpio.
  const rubble = [];
  r.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#' && x > 0 && x < r.w - 1) rubble.push([x + o.ox, y + o.oy]); }));
  b.paint(`mancha${meta.floor.replace('sala', '')}`, rubble);
  // Antorchas y entibado en la pared norte (encima de la fila 0 de la sala).
  for (let x = f.x0 + 1; x < f.x1; x += 4) b.stamp('antorcha', x, f.y0 - 2);
  b.stamp(ROCKS[meta.floor], f.x1 - 1, f.y0 - 3);
}

export default {
  id: 'canteria_solano',
  name: 'Cantería Solano',
  tileset: 2,
  width: G.width,
  height: G.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'ZonaEscarpada',
  dark: { amount: 0.55, radius: 88 },
  escapeRope: true,
  start: (() => { const [x, y] = roomStart(1); return { x, y, dir: 8 }; })(),
  encounters: GALERIAS_CANTERIA,

  build(b) {
    b.fill(0, 'vacio');
    for (const n of [1, 2, 3]) paintRoom(b, n);
    // Salida de luz de la sala 1 (pared sur, bajo su llegada) hacia la cantera.
    const [sx] = roomStart(1);
    b.stamp(EXIT_LIGHT.sala, sx - 1, floorRect(1).y1);
    // Tabla de tiza de Quino junto a la entrada.
    const [[px, py]] = room(1).marks.P.map(([x, y]) => [x + G.rooms[1].ox, y + G.rooms[1].oy]);
    b.stamp('cartel', px, py);
  },

  warps: (() => {
    const [sx, sy] = roomStart(1);
    const m = CANTERIA.mineFront;
    return [{ x: sx, y: sy + 1, to: 'ruta_6', tx: m.x, ty: m.y, dir: m.dir }];
  })(),

  onEnter: galeriasOnEnter,
  events: withB24Events('canteria_solano', withB22bEvents('canteria_solano', galeriasEvents())),
};
