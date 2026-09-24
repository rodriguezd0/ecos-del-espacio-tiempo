// Mapa regional de Axis / selector de Vuelo (estructura de 010_UI_RegionMap.rb de Añil con el atlas real,
// ui/logic/regionMapData.js). Base: la ilustración game/assets/ui/region_map.png (480×320, solo terreno;
// la prepara el agente de arte) o, si aún no existe, una versión provisional dibujada por código a partir
// de la rejilla del atlas. Encima: ríos, rutas, lugares, Pilares, marcas (células) y cursor.
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload, img } from '../core/images.js';
import { drawText } from '../core/text.js';
import { COMMON_GFX } from '../core/widgets.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { sfx } from '../core/sound.js';
import {
  REGION_MAP, CELL, pointAt, pointForMap, canFlyTo, pathCells, roadPath, regionMarks, childPlaces,
} from '../logic/regionMapData.js';
import { message, confirm } from './common.js';

const TM = (n) => UI(`Town Map/${n}.png`);
export const REGION_ART_URL = 'assets/ui/region_map.png';
const OX = 16;
const OY = 32;
const HEADER = { color: '#f8f8f8', shadow: '#182878' };
const ICON = {
  town: { fill: '#f8f0c8', edge: '#384048', size: 12 },
  post: { fill: '#c0c0c8', edge: '#384048', size: 10 },
  zone: { fill: '#f8d070', edge: '#584018', size: 8 },
  sea: { fill: '#a8e0f8', edge: '#1c3c8c', size: 8 },
};
const ROUTE = { fill: '#f0e0a0', edge: '#584018' };
const PILLAR_COLOR = '#b9ff66';

// ---------------------------------------------------------------- ilustración provisional
const TERRAIN_COLORS = {
  '~': ['#2c50c8', '#3c64d8', '#2440b0'], '.': ['#60a850', '#70b858', '#4c9040'], f: ['#2f7a3a', '#3c8c44', '#205c2a'],
  '^': ['#8c7a58', '#a08c68', '#6c5c40'], '*': ['#e8f0f8', '#f8fcff', '#b8c8e0'], p: ['#b09860', '#c0a870', '#907848'],
  ':': ['#b8b0a0', '#c8c0b0', '#989080'], w: ['#5a7c50', '#6c8c5c', '#3c6c78'], o: ['#281c38', '#3a2850', '#140c20'],
  l: ['#58a0e8', '#78b8f0', '#3c80c8'], i: ['#2c50c8', '#3c64d8', '#2440b0'], v: ['#2c50c8', '#3c64d8', '#2440b0'],
  r: ['#2c50c8', '#58c8d8', '#2440b0'],
};
const ISLAND_COLORS = { i: '#d8c890', v: '#4c3428', r: '#78d8e0' };
const isWater = (c) => c === '~' || c === 'i' || c === 'v' || c === 'r';
let provisionalCanvas = null;

function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Dibuja el terreno del atlas en un lienzo de 480×320 (una vez; se cachea). */
function provisionalArt(map) {
  if (provisionalCanvas) return provisionalCanvas;
  const cv = document.createElement('canvas');
  cv.width = map.width * CELL;
  cv.height = map.height * CELL;
  const g = cv.getContext('2d');
  const at = (x, y) => (map.terrain[y] && map.terrain[y][x]) || '~';
  const PX = 2; // píxel de arte
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const c = at(x, y);
      const [base, light, dark] = TERRAIN_COLORS[c] || TERRAIN_COLORS['~'];
      g.fillStyle = base;
      g.fillRect(x * CELL, y * CELL, CELL, CELL);
      for (let py = 0; py < CELL; py += PX) {
        for (let px = 0; px < CELL; px += PX) {
          const r = hash(x * CELL + px, y * CELL + py, 3);
          if (r < 0.1) g.fillStyle = light; else if (r > 0.9) g.fillStyle = dark; else continue;
          g.fillRect(x * CELL + px, y * CELL + py, PX, PX);
        }
      }
      if (c === '^' || c === '*') drawPeak(g, x, y, c === '*' ? '#98a8c0' : '#5c4c34', c === '*' ? '#ffffff' : '#c8b890');
      if (c === 'f') drawTrees(g, x, y);
      if (ISLAND_COLORS[c]) drawIsland(g, x, y, c);
    }
  }
  drawCoast(g, map, at, PX);
  provisionalCanvas = cv;
  return cv;
}

function drawPeak(g, x, y, shade, top) {
  if (hash(x, y, 7) < 0.45) return;
  const cx = x * CELL + 8; const by = y * CELL + 13;
  g.fillStyle = shade;
  for (let i = 0; i < 5; i++) g.fillRect(cx - 5 + i, by - i * 2, 10 - i * 2, 2);
  g.fillStyle = top;
  g.fillRect(cx - 1, by - 8, 2, 2);
}

function drawTrees(g, x, y) {
  for (const [ox, oy] of [[3, 4], [9, 8], [5, 11]]) {
    if (hash(x + ox, y + oy, 11) < 0.35) continue;
    g.fillStyle = '#1c4c24';
    g.fillRect(x * CELL + ox, y * CELL + oy, 4, 4);
    g.fillStyle = '#58a058';
    g.fillRect(x * CELL + ox, y * CELL + oy, 2, 2);
  }
}

function drawIsland(g, x, y, c) {
  g.fillStyle = ISLAND_COLORS[c];
  g.fillRect(x * CELL + 3, y * CELL + 5, 10, 7);
  g.fillRect(x * CELL + 5, y * CELL + 3, 6, 11);
  if (c === 'v') { g.fillStyle = '#e04020'; g.fillRect(x * CELL + 7, y * CELL + 4, 2, 2); }
  if (c === 'i') { g.fillStyle = '#58a048'; g.fillRect(x * CELL + 6, y * CELL + 5, 4, 3); }
}

/** Orilla: franja clara en la tierra que toca el mar y espuma en el agua junto a la costa. */
function drawCoast(g, map, at, PX) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (isWater(at(x, y))) continue;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || !isWater(at(nx, ny))) continue;
        const bx = x * CELL + (dx === 1 ? CELL - PX : 0);
        const by = y * CELL + (dy === 1 ? CELL - PX : 0);
        g.fillStyle = '#e8d8a0';
        g.fillRect(bx, by, dx ? PX : CELL, dy ? PX : CELL);
        g.fillStyle = '#88b8f8';
        g.fillRect(bx + dx * PX, by + dy * PX, dx ? PX : CELL, dy ? PX : CELL);
      }
    }
  }
}

/**
 * Marcas de células de Zygarde por lugar (world/zygarde/detection.js#regionPointMarks: solo con la Detección
 * mejorada o en la crisis del P8). Si el módulo no está, sin marcas.
 */
async function zygardeCellMarks(state, map) {
  if (!state) return [];
  try {
    const det = await import('../../world/zygarde/detection.js');
    if (typeof det.regionPointMarks !== 'function') return [];
    return det.regionPointMarks(state, map.points || map.places).map((m) => ({
      placeId: m.id, kind: 'cell', count: m.remaining, found: m.found, total: m.total, crisis: Boolean(m.crisis),
    }));
  } catch (err) {
    console.warn('[mapa regional] marcas de células no disponibles', err);
    return [];
  }
}

/** Línea continua de grosor `w` por los centros de una lista de casillas (tramos en L, sin antialias). */
function drawCellLine(g, cells, w) {
  const h = w / 2;
  for (let i = 0; i < cells.length; i++) {
    const px = OX + cells[i][0] * CELL + 8;
    const py = OY + cells[i][1] * CELL + 8;
    g.fillRect(px - h, py - h, w, w);
    if (i + 1 >= cells.length) continue;
    const qx = OX + cells[i + 1][0] * CELL + 8;
    const qy = OY + cells[i + 1][1] * CELL + 8;
    g.fillRect(Math.min(px, qx) - h, py - h, Math.abs(qx - px) + w, w);
    g.fillRect(qx - h, Math.min(py, qy) - h, w, Math.abs(qy - py) + w);
  }
}

// ---------------------------------------------------------------- escena
class RegionMapScene extends ScreenScene {
  constructor(opts) {
    super();
    this.opts = opts;
    this.map = opts.mapData || REGION_MAP;
    const mapId = engine.state?.player?.mapId;
    this.here = pointForMap(this.map, mapId);
    const start = this.here || this.map.places.find((p) => p.fly) || this.map.places[0];
    this.cx = start ? start.x : Math.floor(this.map.width / 2);
    this.cy = start ? start.y : Math.floor(this.map.height / 2);
    this.busy = false;
    const d = engine.state?.data || {};
    this.flyPoints = d.flyPoints || [];
    this.visited = d.visited || [];
    this.marks = new Map();
  }

  async enter() {
    const [cellMarks] = await Promise.all([
      zygardeCellMarks(engine.state, this.map),
      preload([TM('bg'), TM('cursor'), TM('icon_fly'), REGION_ART_URL, ...COMMON_GFX]),
      preloadDialogGfx(),
    ]);
    this.marks = regionMarks(engine.state, this.map, [...cellMarks, ...(this.opts.marks || [])]);
  }

  canFly(p) {
    return canFlyTo(p, this.flyPoints, this.visited);
  }

  /** Destinos para saltar con L/R: en Vuelo los disponibles; si no, todas las poblaciones y zonas. */
  jumpTargets() {
    const list = this.map.places.filter((p) => (this.opts.fly ? this.canFly(p) : p.kind !== 'route'));
    return list.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }

  jump(dir) {
    const list = this.jumpTargets();
    if (!list.length) return false;
    const cur = list.findIndex((p) => p.x === this.cx && p.y === this.cy);
    const next = list[(cur + dir + list.length) % list.length] || list[0];
    this.cx = next.x;
    this.cy = next.y;
    return true;
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    let moved = false;
    if (inp.repeat('LEFT') && this.cx > 0) { this.cx -= 1; moved = true; } else if (inp.repeat('RIGHT') && this.cx < this.map.width - 1) { this.cx += 1; moved = true; }
    if (inp.repeat('UP') && this.cy > 0) { this.cy -= 1; moved = true; } else if (inp.repeat('DOWN') && this.cy < this.map.height - 1) { this.cy += 1; moved = true; }
    if (inp.pressed('L') && this.jump(-1)) moved = true;
    if (inp.pressed('R') && this.jump(1)) moved = true;
    if (moved) sfx.cursor();
    if (inp.pressed('B')) { sfx.cancel(); this.finish(null); return; }
    if (inp.pressed('A') && this.opts.fly) {
      this.busy = true;
      this.tryFly().catch((err) => engine.reportError(err)).finally(() => { this.busy = false; });
    }
  }

  async tryFly() {
    const p = pointAt(this.map, this.cx, this.cy);
    if (!p || !p.fly) { sfx.buzzer(); return; }
    if (!this.canFly(p)) { sfx.buzzer(); await message('Aún no conoces ese lugar.'); return; }
    if (this.here && this.here.id === p.id) { sfx.buzzer(); await message('Ya estás allí.'); return; }
    if (await confirm(`¿Quieres ir a ${p.name}?`)) this.finish(p.id);
  }

  // ---------------------------------------------------------------- dibujo
  draw(g) {
    blit(g, TM('bg'), 0, 0);
    // La ilustración de arte ya trae relieve, caminos y marcadores (en las casillas del atlas); sin ella se
    // dibuja la versión provisional con los mismos datos.
    const art = this.opts.mapData ? null : img(REGION_ART_URL);
    if (art) {
      g.drawImage(art, OX, OY);
    } else {
      g.drawImage(provisionalArt(this.map), OX, OY);
      this.drawRivers(g);
      this.drawRoads(g);
      for (const p of this.map.places) if (p.kind !== 'route' && !p.parent) this.drawPlace(g, p);
    }
    for (const p of this.map.places) this.drawOverlay(g, p);
    this.drawHere(g);
    blit(g, TM('cursor'), OX + this.cx * CELL - 8, OY + this.cy * CELL - 8, (Math.floor(this.t / 16) % 2) * 32, 0, 32, 32);
    this.drawTexts(g);
  }

  drawRivers(g) {
    g.fillStyle = '#5890f0';
    for (const line of this.map.rivers || []) drawCellLine(g, pathCells(line), 2);
  }

  /** Caminos (codo horizontal → vertical, como la ilustración) y travesías por mar (punteadas). */
  drawRoads(g) {
    const find = (id) => this.map.places.find((p) => p.id === id);
    const cellsOf = ([a, b]) => {
      const p = find(a); const q = find(b);
      return p && q ? pathCells(roadPath(p, q)) : [];
    };
    for (const [fill, w] of [[ROUTE.edge, 6], [ROUTE.fill, 4]]) {
      g.fillStyle = fill;
      for (const r of this.map.roads || []) drawCellLine(g, cellsOf(r), w);
    }
    g.fillStyle = '#e8f0ff';
    for (const r of this.map.seaRoads || []) {
      for (const [x, y] of cellsOf(r)) g.fillRect(OX + x * CELL + 7, OY + y * CELL + 7, 2, 2);
    }
  }

  drawPlace(g, p) {
    const st = ICON[p.kind] || ICON.zone;
    const cx = OX + p.x * CELL + 8;
    const cy = OY + p.y * CELL + 8;
    const h = st.size / 2;
    g.fillStyle = st.edge;
    g.fillRect(cx - h - 1, cy - h - 1, st.size + 2, st.size + 2);
    g.fillStyle = st.fill;
    g.fillRect(cx - h, cy - h, st.size, st.size);
    if (p.pillar || childPlaces(p.id, this.map).some((c) => c.pillar)) {
      g.fillStyle = PILLAR_COLOR;
      g.fillRect(cx - 2, cy - 2, 4, 4);
    }
  }

  /** Información de la partida sobre el mapa: células por encontrar y destinos de Vuelo. */
  drawOverlay(g, p) {
    const cx = OX + p.x * CELL + 8;
    const cy = OY + p.y * CELL + 8;
    const marks = this.marks.get(p.id);
    if (marks && marks.length) {
      const left = marks.reduce((a, m) => a + (m.count || 0), 0);
      const pulse = marks.some((m) => m.crisis) && Math.floor(this.t / 12) % 2 === 0;
      g.fillStyle = '#1a4010';
      g.fillRect(cx + 3, cy - 11, 8, 8);
      g.fillStyle = left > 0 ? (pulse ? '#f8fff0' : PILLAR_COLOR) : '#6c7c60';
      g.fillRect(cx + 4, cy - 10, 6, 6);
    }
    if (this.opts.fly && this.canFly(p)) {
      blit(g, TM('icon_fly'), cx - 16, cy - 16, (Math.floor(this.t / 16) % 2) * 32, 0, 32, 32);
    }
  }

  drawHere(g) {
    if (!this.here || Math.floor(this.t / 20) % 2 === 0) return;
    const cx = OX + this.here.x * CELL + 8;
    const cy = OY + this.here.y * CELL;
    g.fillStyle = '#183010';
    g.fillRect(cx - 5, cy - 11, 10, 10);
    g.fillStyle = PILLAR_COLOR;
    g.fillRect(cx - 4, cy - 10, 8, 8);
  }

  drawTexts(g) {
    const p = pointAt(this.map, this.cx, this.cy);
    const title = this.opts.fly ? '¿Adónde quieres ir?' : `Región de ${this.map.name}`;
    drawText(g, title, 24, 0, HEADER);
    drawText(g, p ? p.name : '', 488, 0, { ...HEADER, align: 'right' });
    let foot = p?.desc || '';
    const pillars = p ? [...(p.pillars || (p.pillar ? [p.pillar] : [])), ...childPlaces(p.id, this.map).map((c) => c.pillar).filter(Boolean)] : [];
    if (pillars.length) foot = `${foot}${foot ? ' · ' : ''}${pillars.length > 1 ? 'Pilares' : 'Pilar'} ${pillars.join(' y ')}`;
    if (this.opts.fly && p?.fly && !this.canFly(p)) foot = 'Aún no conoces este lugar.';
    const cells = (p ? this.marks.get(p.id) || [] : []).filter((m) => m.kind === 'cell');
    if (cells.length) {
      const total = cells.reduce((a, m) => a + (m.total || 0), 0);
      const found = cells.reduce((a, m) => a + (m.found ?? (m.total || 0) - (m.count || 0)), 0);
      foot = `${foot}${foot ? ' · ' : ''}Células: ${found}${total ? `/${total}` : ''}`;
    }
    drawText(g, foot, 256, 354, { ...HEADER, align: 'center', font: 'small' });
  }
}

/**
 * Abre el mapa. opts: { fly: true } → id del lugar de Vuelo elegido o null · { marks: [...] } marcas extra
 * ({ mapId|placeId, kind, count, total }) · { mapData } atlas propio (pruebas).
 */
export async function open(opts = {}) {
  return openScene(new RegionMapScene(opts));
}
