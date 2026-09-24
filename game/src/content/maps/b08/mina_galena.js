// Mina Galena (docs/CAMPANA.md B08; §1.3 «Ciudad Estrato: … Mina Galena»; Cueva1, tierra): la mina de la familia
// Galena bajo Estrato. Vestíbulo con los mineros; galería principal; al oeste la veta de cristal (C036); al este el
// pozo lateral del Consorcio (dos técnicos) que baja hasta la perforadora de Garrido; al norte el montacargas de la
// galería honda (cascotes hasta el P4). Coordenadas: layout.js (MINA). Eventos: content/events/b08_mina.js.
import { minaEvents, minaOnEnter } from '../../events/b08_mina.js';
import { OBJ } from '../../events/b08_common.js';
import { MINA_GALENA } from '../../encounters/b08.js';
import { caveKit, cells } from './cave_kit.js';
import { MINA, ESTRATO } from './layout.js';

const kit = caveKit('');
const R = MINA.rooms;

function build(b) {
  kit.paintRooms(b, Object.values(R));
  for (const p of MINA.passages) kit.carveVertical(b, p);
  for (const t of MINA.tunnels) kit.carveTunnel(b, t);
  kit.mergeRock(b);
  // Suelo gastado de los caminos de la vagoneta y manchas de tierra.
  b.paint('mancha', cells(19, 28, 6, 3));
  b.paint('mancha', cells(19, 17, 4, 5));
  b.paint('mancha', cells(34, 17, 5, 4));
  // Vestíbulo: vigas, antorchas y cajones.
  for (const x of [14, 29]) b.stamp('antorcha', x, R.vestibulo.y0 - 2);
  for (const [s, x, y] of [
    ['tronco_h', 13, 27], ['tronco_h', 28, 27], ['carteles_dobles', 24, 26], ['roca_grande', 30, 30], ['matojo_cueva', 12, 30],
    ['pepita', 26, 32], ['roca_peque', 13, 29],
  ]) b.stamp(s, x, y);
  // Galería principal y montacargas.
  for (const [s, x, y] of [['tronco_v', 16, 20], ['roca_musgo', 26, 21], ['escombros', 22, 7], ['roca_grande', 18, 8], ['cartel', 33, 16]]) b.stamp(s, x, y);
  b.stamp('agujero', MINA.lift.x, MINA.lift.y - 1);
  for (const x of [19, 24]) b.stamp('antorcha', x, R.montacargas.y0 - 2);
  // Veta de cristal.
  const v = R.veta;
  b.stamp('cristales', v.x0 + 1, v.y0);
  b.stamp('gota_cristal', v.x1 - 1, v.y0);
  b.stamp('gota_cristal', v.x0, v.y1 - 1);
  for (const [s, x, y] of [['roca_musgo', 9, 21], ['pepita', 6, 21], ['musgo_rocas', 4, 20]]) b.stamp(s, x, y);
  // Pozo lateral: roca removida por el Consorcio.
  for (const [s, x, y] of [['escombros', 37, 20], ['roca_peque', 32, 21], ['escombros', 38, 8], ['roca_grande', 32, 8]]) b.stamp(s, x, y);
  b.stamp('salida_luz_sur', MINA.exit.stamp.x, MINA.exit.stamp.y);
}

/** Vía de la vagoneta (eventos) del vestíbulo a la galería y vagonetas. */
function railEvents() {
  const out = [];
  const rail = (x, y, pattern) => out.push({ id: `via_${x}_${y}`, x, y, sprite: OBJ.rail, dir: 2, pattern, directionFix: true, walkAnime: false, shadow: false, through: true });
  for (let y = 17; y <= 30; y++) rail(21, y, 2);
  out.push({ id: 'vagoneta_vestibulo', x: 18, y: 30, sprite: OBJ.cart, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una vagoneta llena de galena. Brilla como el plomo recién cortado.'); } });
  out.push({ id: 'vagoneta_galeria', x: 24, y: 19, sprite: OBJ.cart, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una vagoneta vacía. Alguien ha escrito con tiza: «Mañana, si el techo aguanta».'); } });
  // Entibados de madera sobre los pasos.
  for (const p of MINA.passages) out.push({ id: `entibo_${p.x}_${p.rows[1]}`, x: p.x + 1, y: p.rows[1], sprite: OBJ.entibo, dir: 2, directionFix: true, walkAnime: false, shadow: false, through: true, alwaysOnTop: false });
  return out;
}

export default {
  id: 'mina_galena',
  name: 'Mina Galena',
  tileset: 2,
  width: MINA.width,
  height: MINA.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'CuevaOscura',
  start: MINA.exit.arrive,
  encounters: MINA_GALENA,
  build,
  warps: [{ x: MINA.exit.warp.x, y: MINA.exit.warp.y, to: 'ciudad_estrato', tx: ESTRATO.mine.front.x, ty: ESTRATO.mine.front.y, dir: 2 }],
  onEnter: minaOnEnter,
  events: [...minaEvents(), ...railEvents()],
};
