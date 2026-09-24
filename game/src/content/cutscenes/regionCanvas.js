// Plano nocturno de la región para la dispersión del prólogo (P-04): silueta suavizada a partir del atlas
// de ui/logic/regionMapData.js (X02: `terrain`, o `grid` en el formato antiguo) con el tono de cada terreno
// (bosque, montaña, nieve, meseta, arena…) muy apagado. Pixel art a ×2 (arte 256×192).
// Devuelve el lienzo 512×384 y los puntos (px de pantalla) de origen, núcleos y pueblo.
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { makeCanvas } from '../../render/textures.js';
import { REGION_MAP } from '../../ui/logic/regionMapData.js';
import { REGION_ART, REGION_POINTS, landCell, landGrid, terrainAt, cellToScreen } from './prologueData.js';

const ART_W = REGION_ART.w;
const ART_H = REGION_ART.h;
const CELL = REGION_ART.cell;
const OX = REGION_ART.ox;
const OY = REGION_ART.oy;

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Valor 0..1 interpolado entre centros de celda (suaviza la costa). */
function landValue(grid, ax, ay) {
  const gx = (ax - OX) / CELL - 0.5;
  const gy = (ay - OY) / CELL - 0.5;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const v = (x, y) => (landCell(grid, x, y) ? 1 : 0);
  const top = v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx;
  const bot = v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bot * fy;
}

const PAL = {
  sea: [5, 10, 24], wave: [12, 22, 44], shallow: [10, 24, 44], coast: [52, 96, 82],
  land: [14, 34, 24], land2: [18, 44, 30], forest: [8, 24, 16], rock: [38, 38, 46], light: [255, 214, 120],
};

/** Tono nocturno por tipo de terreno del atlas (TERRAIN_KEYS); el resto usa la tierra común. */
const TERRAIN_TONE = {
  f: [9, 26, 17], '^': [25, 26, 33], '*': [32, 38, 50], p: [22, 32, 23], ':': [34, 31, 25], w: [15, 28, 24],
  o: [6, 6, 12], v: [36, 17, 15], i: [20, 34, 26],
};

export function buildRegionCanvas(map = REGION_MAP) {
  const grid = landGrid(map);
  const art = makeCanvas(ART_W, ART_H);
  const img = art.g.createImageData(ART_W, ART_H);
  const land = new Uint8Array(ART_W * ART_H);
  for (let y = 0; y < ART_H; y++) {
    for (let x = 0; x < ART_W; x++) {
      const n = (hash(x >> 1, y >> 1) - 0.5) * 0.35;
      land[x + y * ART_W] = landValue(grid, x, y) + n > 0.5 ? 1 : 0;
    }
  }
  const isLand = (x, y) => x >= 0 && y >= 0 && x < ART_W && y < ART_H && land[x + y * ART_W] === 1;
  const origin = REGION_POINTS.origin.map((v, i) => (i === 0 ? OX + v * CELL + 4 : OY + v * CELL + 4));
  for (let y = 0; y < ART_H; y++) {
    for (let x = 0; x < ART_W; x++) {
      let c;
      const h = hash(x, y);
      if (isLand(x, y)) {
        const coast = !isLand(x - 1, y) || !isLand(x + 1, y) || !isLand(x, y - 1) || !isLand(x, y + 1);
        const dm = Math.hypot(x - origin[0], (y - origin[1]) * 1.3);
        const tone = TERRAIN_TONE[terrainAt(map, Math.floor((x - OX) / CELL), Math.floor((y - OY) / CELL))];
        if (coast) c = PAL.coast;
        else if (dm < 10 && h < 0.55) c = PAL.rock;
        else if (tone) c = h < 0.12 ? PAL.land2 : tone;
        else if (hash(x >> 2, y >> 2) < 0.28) c = h < 0.7 ? PAL.forest : PAL.land;
        else c = h < 0.15 ? PAL.land2 : PAL.land;
      } else {
        const near = isLand(x - 2, y) || isLand(x + 2, y) || isLand(x, y - 2) || isLand(x, y + 2);
        c = near ? PAL.shallow : (h < 0.02 && y % 3 === 0 ? PAL.wave : PAL.sea);
      }
      const i = (x + y * ART_W) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = 255;
    }
  }
  art.g.putImageData(img, 0, 0);
  // Luces tenues del pueblo (3 píxeles cálidos) — sin nombre ni rótulo.
  const [vx, vy] = REGION_POINTS.village;
  art.g.fillStyle = `rgb(${PAL.light.join(',')})`;
  for (const [dx, dy] of [[0, 0], [2, 1], [-1, 2]]) art.g.fillRect(OX + vx * CELL + 3 + dx, OY + vy * CELL + 3 + dy, 1, 1);
  const out = makeCanvas(SCREEN_W, SCREEN_H);
  out.g.imageSmoothingEnabled = false;
  out.g.drawImage(art.canvas, 0, 0, SCREEN_W, SCREEN_H);
  return {
    canvas: out.canvas,
    points: {
      origin: cellToScreen(REGION_POINTS.origin),
      village: cellToScreen(REGION_POINTS.village),
      cores: REGION_POINTS.cores.map(cellToScreen),
    },
  };
}
