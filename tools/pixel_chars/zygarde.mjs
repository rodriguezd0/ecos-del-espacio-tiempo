// Zygarde Core (acompañante de campo) y Célula de Zygarde como charsets 4×4 (nativo 32×32 ×2).
// Diseño PROVISIONAL (D30) coherente con el oficial: cuerpo gelatinoso verde con dos antenas,
// placa hexagonal oscura al frente y núcleo luminoso; la célula es una gota verde con brillo.
import { fromRows, compose, sheet } from '../pixel.mjs';
import { NATIVE, checkRows, stretchRows } from './assemble.mjs';

export const CORE_PALETTE = {
  k: '#0E2418', // contorno
  L: '#B8F880', G: '#6CD040', g: '#3E9430', d: '#22602A', // cuerpo verde
  x: '#16302A', X: '#2C5448', // placa hexagonal
  N: '#E8FFFF', n: '#70D0F0', v: '#2E88C0', // núcleo
};

const CORE_X = 8; // columna del frame donde empieza la rejilla de 16 px
const CORE_W = 16;

const CORE_DOWN = [
  '...k........k...', // 15
  '..kLk......kLk..', // 16
  '..kGGk....kGgk..', // 17
  '...kGGkkkkGgk...', // 18
  '..kLGGGGGGGGgk..', // 19
  '.kLGGGGGGGGGGgk.', // 20
  '.kGGGkkkkkkGGgk.', // 21
  'kLGGkXxxxxXkGggk', // 22
  'kGGkXxxnnxxXkggk', // 23
  'kGGkxxnNNnxxkggk', // 24
  'kGGkXxxnvxxXkggk', // 25
  'kGGGkXxxxxXkGggk', // 26
  '.kGGGkkkkkkGggk.', // 27
  '.kgGGGGGGGGggdk.', // 28
  '..kkgggggggddk..', // 29
  '....kkkkkkkk....', // 30
];

const CORE_LEFT = [
  '....k.....k.....', // 15
  '...kLk...kLk....', // 16
  '...kGk...kGgk...', // 17
  '...kGGkkkGgk....', // 18
  '..kLGGGGGGGgk...', // 19
  '.kLGGGGGGGGGgk..', // 20
  '.kkkkGGGGGGGggk.', // 21
  'kXxxXkGGGGGGggk.', // 22
  'kxnnxkGGGGGggdk.', // 23
  'knNNxkGGGGGggdk.', // 24
  'kxnvxkGGGGgggdk.', // 25
  'kXxxXkGGGGggddk.', // 26
  '.kkkkGGGGGggddk.', // 27
  '.kgGGGGGGgggdk..', // 28
  '..kkggggggddk...', // 29
  '....kkkkkkkk....', // 30
];

const CORE_UP = [
  '...k........k...', // 15
  '..kLk......kLk..', // 16
  '..kGGk....kGgk..', // 17
  '...kGGkkkkGgk...', // 18
  '..kLGGGGGGGGgk..', // 19
  '.kLGGLLGGGGGGgk.', // 20
  '.kGGLGGGGGGGGgk.', // 21
  'kLGGGGgggggGGggk', // 22
  'kGGGGgGGGGGgGggk', // 23
  'kGGGgGGGGGGGgggk', // 24
  'kGGGGgGGGGGgGggk', // 25
  'kGGGGGgggggGGggk', // 26
  '.kGGGGGGGGGGggk.', // 27
  '.kgGGGGGGGGggdk.', // 28
  '..kkgggggggddk..', // 29
  '....kkkkkkkk....', // 30
];

/** Aplasta (quita una fila central) o estira (la duplica). */
function squash(rows, amount) {
  if (amount > 0) return [...rows.slice(0, 7), ...rows.slice(8)];
  if (amount < 0) return stretchRows(rows, 7);
  return rows;
}

const GROUND_Y = 30; // última fila opaca (base apoyada)

function coreFrame(rows, { squashBy = 0, lift = 0, glow = false }) {
  checkRows('core', rows, CORE_W);
  const pal = glow ? { ...CORE_PALETTE, n: '#B8F0FF', v: '#60C0F0' } : CORE_PALETTE;
  const shaped = squash(rows, squashBy);
  const img = fromRows(shaped, pal);
  return compose(NATIVE, NATIVE, [{ img, x: CORE_X, y: GROUND_Y + 1 - shaped.length - lift }]);
}

/** Hoja del Core: rebote blando (normal, aplastado, normal, estirado y elevado) y pulso del núcleo. */
export function buildCoreSheet() {
  const cycle = (rows) => [
    coreFrame(rows, {}),
    coreFrame(rows, { squashBy: 1, glow: true }),
    coreFrame(rows, {}),
    coreFrame(rows, { squashBy: -1, lift: 1, glow: true }),
  ];
  const left = cycle(CORE_LEFT);
  return sheet([cycle(CORE_DOWN), left, left.map((f) => f.mirrorX()), cycle(CORE_UP)], NATIVE, NATIVE);
}

// ─────────────────────────── Célula ───────────────────────────

export const CELL_PALETTE = {
  k: '#0E2418', L: '#D8FFB0', G: '#7CDC48', g: '#44A032', d: '#22602A', x: '#16302A', N: '#E8FFFF',
  '+': '#F4FFE0', '*': '#B9FF66',
};

const CELL = [
  '....kk....', // 0
  '...kLGk...', // 1
  '..kLGGgk..', // 2
  '.kLGGGGgk.', // 3
  '.kGGxxGgk.', // 4
  'kLGxNNxggk', // 5
  'kGGGxxGggk', // 6
  'kGGGGGggdk', // 7
  '.kgGGggdk.', // 8
  '..kkkkkk..', // 9
];

const SPARKLES = [
  { x: 3, y: 2 }, { x: 13, y: 5 }, { x: 5, y: 12 }, { x: 12, y: 1 },
];

function sparkle(img, x, y, big) {
  const star = big
    ? ['..+..', '..*..', '+*+*+', '..*..', '..+..']
    : ['.+.', '+*+', '.+.'];
  return compose(NATIVE, NATIVE, [img, { img: fromRows(star, CELL_PALETTE), x: x - (big ? 2 : 1), y: y - (big ? 2 : 1) }]);
}

/** Hoja de la Célula: flota arriba/abajo con destellos rotando (las 4 filas iguales). */
export function buildCellSheet() {
  checkRows('célula', CELL, 10);
  const body = fromRows(CELL, CELL_PALETTE);
  const bob = [0, 1, 2, 1];
  const frames = bob.map((b, i) => {
    const base = compose(NATIVE, NATIVE, [{ img: body, x: 11, y: 17 - b }]);
    const s = SPARKLES[i];
    return sparkle(base, 8 + s.x, 12 + s.y - b, i % 2 === 0);
  });
  return sheet([frames, frames, frames, frames], NATIVE, NATIVE);
}
