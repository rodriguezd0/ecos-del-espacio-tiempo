// Galerías del Soplo (docs/CAMPANA.md B06, mazmorra del Pilar del Impulso): Cueva1 (tileset 2) con el kit de
// Pilar y el tinte blanco del P3. Pasarelas de piedra (`pilar_enlosado`) sobre pozos de viento (negro): abajo la
// Galería de las Flechas, arriba la Galería del Remolino, unidas por un pasillo. Las salas salen de las cadenas
// ASCII de content/events/b06_wind_rooms.js (lo que se pinta y lo que resuelve el test es lo mismo).
// Entrada: boca del Anillo de los Vientos → salida de luz sur. Salida: boca del techo del Remolino → Sala de las
// Campanas (anillo_vientos). Eventos en content/events/b06_galerias.js.
import { FLECHAS, REMOLINO, walkCells, marksInMap } from '../../events/b06_wind_rooms.js';
import { galeriasEvents } from '../../events/b06_galerias.js';
import { F, zygardeSays } from '../../events/b06_common.js';
import { GALERIAS_SOPLO } from '../../encounters/b06.js';
import { pilarTone } from '../../stamps/pilar.js';
import { GALERIAS, ANILLO } from './layout.js';

const G = GALERIAS;
const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

function walkways() {
  const cells = [
    ...walkCells(REMOLINO, G.remolino.ox, G.remolino.oy),
    ...walkCells(FLECHAS, G.flechas.ox, G.flechas.oy),
    ...G.corridor,
  ];
  const seen = new Set();
  return cells.filter(([x, y]) => (seen.has(`${x},${y}`) ? false : (seen.add(`${x},${y}`), true)));
}

/** Piedras, cristales y manchas en la roca que no se pisa (`free(x, y)`), en posiciones fijas por semilla. */
function rockery(b, free) {
  const fits = (x, y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!free(x + i, y + j)) return false;
    return true;
  };
  const used = new Set();
  const take = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add(`${x + i},${y + j}`); };
  const clear = (x, y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (used.has(`${x + i},${y + j}`)) return false;
    return true;
  };
  const pieces = [['cristales', 6, 2], ['roca_grande_gris', 2, 3], ['roca_musgo_gris', 2, 2], ['matojo_cueva_gris', 2, 2], ['roca_peque_gris', 1, 2], ['gota_cristal', 1, 2]];
  let k = 0;
  for (let y = G.floor.y0; y <= G.floor.y1; y += 2) {
    for (let x = G.floor.x0 + ((y >> 1) % 3); x <= G.floor.x1; x += 3) {
      const [name, w, h] = pieces[k % pieces.length];
      if (fits(x, y, w, h) && clear(x - 1, y - 1, w + 2, h + 2)) {
        b.stamp(name, x, y);
        take(x, y, w, h);
        k += 1;
      } else if (fits(x, y, 2, 1) && clear(x, y, 2, 1) && (x + y) % 4 === 0) {
        b.paint('mancha_gris', [[x, y], [x + 1, y]]);
      }
    }
  }
}

function decorate(b) {
  const R = G.remolino;
  const Fl = G.flechas;
  // Remolino: monolito y columnas en la zona en calma del este, glifos en el suelo, aristas al fondo.
  b.stamp('pilar_monolito', R.ox + 17, R.oy + 5);
  b.stamp('pilar_columna', R.ox + 20, R.oy + 5);
  b.stamp('pilar_columna_quebrada', R.ox + 15, R.oy + 9);
  b.stamp('pilar_arista', R.ox + 20, R.oy + 9);
  b.stamp('pilar_glifo', R.ox + 13, R.oy + 6);
  b.stamp('pilar_glifo_2', R.ox + 9, R.oy + 9);
  b.stamp('pilar_losa_eco', R.ox + 13, R.oy + 10);
  // Boca del techo sobre el rellano de salida.
  const [[xx]] = marksInMap(REMOLINO, 'X', R.ox, R.oy);
  b.stamp('boca_norte_gris', xx - 1, G.floor.y0 - 4);
  // Flechas: columnas en las esquinas de las islas, glifos y una losa de eco en la entrada.
  b.stamp('pilar_columna_quebrada', Fl.ox + 20, Fl.oy + 6);
  b.stamp('pilar_glifo', Fl.ox + 2, Fl.oy + 5);
  b.stamp('pilar_glifo_2', Fl.ox + 18, Fl.oy + 7);
  b.stamp('pilar_arista', Fl.ox + 1, Fl.oy + 4);
  b.stamp('pilar_glifo', Fl.ox + 15, Fl.oy + 12);
  // Salida de luz hacia el Anillo.
  b.stamp('salida_luz_sur_gris', G.exitDoor.x - 1, G.floor.y1);
}

export default {
  id: 'galerias_soplo',
  name: 'Pilar del Impulso',
  tileset: 2,
  width: G.width,
  height: G.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'Acantilado',
  tone: pilarTone('P3'),
  start: { x: G.entry.x, y: G.entry.y, dir: G.entry.dir },
  encounters: GALERIAS_SOPLO,

  build(b) {
    b.fill(0, 'vacio');
    const f = G.floor;
    b.paint('sala_gris', rect(f.x0, f.y0, f.x1, f.y1));
    const walk = walkways();
    const isWalk = new Set(walk.map(([x, y]) => `${x},${y}`));
    const nearWalk = (x, y, r) => {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (isWalk.has(`${x + i},${y + j}`)) return true;
      return false;
    };
    // Pozos de viento alrededor de las pasarelas; más allá, roca de la galería (inaccesible) con piedras.
    const rim = rect(f.x0, f.y0, f.x1, f.y1).filter(([x, y]) => !isWalk.has(`${x},${y}`) && nearWalk(x, y, 1));
    b.paint('vacio', rim, { layer: 0 });
    b.paint('suelo_gris', walk, { layer: 0 });
    b.paint('pilar_enlosado', walk);
    rockery(b, (x, y) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1 && !nearWalk(x, y, 1));
    decorate(b);
  },

  warps: [
    { x: G.exitDoor.x, y: G.exitDoor.y, to: 'anillo_vientos', tx: ANILLO.mouthArrival.x, ty: ANILLO.mouthArrival.y, dir: ANILLO.mouthArrival.dir },
  ],

  onEnter: async (ctx) => {
    if (ctx.flag(F.galeriasSeen)) return;
    ctx.setFlag(F.galeriasSeen);
    await zygardeSays(ctx, 'Aquí abajo el viento no encuentra salida. Da vueltas y vuelve.');
  },

  events: galeriasEvents(),
};
