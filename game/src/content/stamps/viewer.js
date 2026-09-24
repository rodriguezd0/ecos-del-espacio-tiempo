// Visor en navegador de la biblioteca de stamps (http://localhost:8080/src/content/stamps/viewer.html).
// Dibuja cada stamp y una demo de cada brush con canvas 2D a partir de los tilesets originales de Añil.
import { STAMP_LIBRARIES, loadStampLibrary } from './index.js';
import { paintBrush, brushKind, brushDemo } from './brushes.js';
import { autotileSourceRects, isAutotile, autotileSlot, FIRST_REGULAR_TILE, TILE } from '../../shared/autotile.js';

const $ = (id) => document.getElementById(id);
const images = new Map();

function loadImage(url) {
  if (!images.has(url)) {
    images.set(url, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
      img.src = url;
    }));
  }
  return images.get(url);
}

async function loadGraphics(tilesetInfo) {
  const tiles = await loadImage(`/anil/Graphics/Tilesets/${tilesetInfo.image}.png`);
  const autotiles = await Promise.all(tilesetInfo.autotiles.map((name) => (
    name ? loadImage(`/assets/autotiles/${name}.png`).catch(() => null) : null
  )));
  return { tiles, autotiles };
}

function drawTile(g, gfx, id, px, py) {
  if (!id) return;
  if (id >= FIRST_REGULAR_TILE) {
    const t = id - FIRST_REGULAR_TILE;
    g.drawImage(gfx.tiles, (t % 8) * TILE, Math.floor(t / 8) * TILE, TILE, TILE, px, py, TILE, TILE);
    return;
  }
  if (!isAutotile(id)) return;
  const img = gfx.autotiles[autotileSlot(id)];
  if (!img) return;
  const rects = autotileSourceRects(id, 0, img.height);
  if (rects.length === 1) {
    g.drawImage(img, rects[0].x, rects[0].y, TILE, TILE, px, py, TILE, TILE);
    return;
  }
  rects.forEach((r, i) => g.drawImage(img, r.x, r.y, 16, 16, px + (i % 2) * 16, py + Math.floor(i / 2) * 16, 16, 16));
}

/** Rejilla de 3 capas w×h; `put` ignora lo que cae fuera. */
function makeGrid(w, h) {
  const layers = [0, 1, 2].map(() => new Array(w * h).fill(0));
  const put = (x, y, l, id) => { if (x >= 0 && y >= 0 && x < w && y < h) layers[l][x + y * w] = id; };
  return { w, h, layers, put };
}

function paintGround(lib, grid) {
  const name = lib.def.preview?.ground;
  if (!name) return;
  const cells = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) cells.push([x, y]);
  for (const w of paintBrush(lib.brush(name), cells)) grid.put(w.x, w.y, w.layer, w.id);
}

function renderGrid(grid, gfx, zoom, door) {
  const canvas = document.createElement('canvas');
  canvas.width = grid.w * TILE; canvas.height = grid.h * TILE;
  canvas.style.width = `${canvas.width * zoom}px`;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (const layer of grid.layers) {
    for (let i = 0; i < layer.length; i++) drawTile(g, gfx, layer[i], (i % grid.w) * TILE, Math.floor(i / grid.w) * TILE);
  }
  if (door) {
    g.strokeStyle = '#ffe600'; g.lineWidth = 2;
    g.strokeRect(door[0] * TILE + 1, door[1] * TILE + 1, TILE - 2, TILE - 2);
  }
  return canvas;
}

function card({ name, meta, desc, tags, canvas, isBrush }) {
  const el = document.createElement('article');
  el.className = `card${isBrush ? ' brush' : ''}`;
  el.title = 'Clic: copiar el nombre';
  el.append(canvas);
  const title = document.createElement('div');
  title.className = 'name'; title.textContent = name;
  const m = document.createElement('div');
  m.className = 'meta'; m.textContent = meta;
  const d = document.createElement('div');
  d.className = 'desc'; d.textContent = desc || '';
  const t = document.createElement('div');
  t.className = 'tags';
  for (const tag of tags || []) { const s = document.createElement('span'); s.textContent = tag; t.append(s); }
  el.append(title, m, d, t);
  el.addEventListener('click', () => copy(name));
  return el;
}

function copy(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
  const toast = $('toast');
  toast.textContent = `Copiado: ${text}`;
  toast.classList.add('show');
  clearTimeout(copy.timer);
  copy.timer = setTimeout(() => toast.classList.remove('show'), 1200);
}

function matches(text, ...fields) {
  if (!text) return true;
  return fields.join(' ').toLowerCase().includes(text.toLowerCase());
}

async function render(state) {
  const grid = $('grid');
  grid.textContent = 'Cargando…';
  const lib = await loadStampLibrary(state.tileset);
  const entry = STAMP_LIBRARIES[state.tileset];
  const def = (await entry.def()).default;
  const libx = { ...lib, def, brush: lib.brush };
  const gfx = await loadGraphics(state.db.tilesets[lib.tileset]);
  const cards = [];
  if (state.kind !== 'brushes') {
    for (const s of Object.values(lib.stamps)) {
      if (!matches(state.filter, s.name, s.desc, s.tags.join(' '))) continue;
      const g = makeGrid(s.w + 2, s.h + 2);
      paintGround(libx, g);
      s.layers.forEach((layer, l) => layer && layer.forEach((id, i) => { if (id) g.put(1 + (i % s.w), 1 + Math.floor(i / s.w), l, id); }));
      const door = s.door ? [s.door[0] + 1, s.door[1] + 1] : null;
      const meta = `${s.w}×${s.h}${s.door ? ` · puerta ${s.door.join(',')}` : ''}${s.solid ? ' · sólido' : ''}`;
      cards.push(card({ name: s.name, meta, desc: s.desc, tags: s.tags, canvas: renderGrid(g, gfx, state.zoom, door) }));
    }
  }
  if (state.kind !== 'stamps') {
    for (const [name, b] of Object.entries(lib.brushes)) {
      if (!matches(state.filter, name, b.desc || '', brushKind(b))) continue;
      const demo = brushDemo(b);
      const g = makeGrid(demo.w, demo.h);
      paintGround(libx, g);
      const under = def.preview?.under?.[name];
      if (under) for (const w of paintBrush(lib.brush(under), demo.cells)) g.put(w.x, w.y, w.layer, w.id);
      for (const w of paintBrush(b, demo.cells, { seed: 1 })) g.put(w.x, w.y, w.layer, w.id);
      cards.push(card({ name, meta: `brush ${brushKind(b)} · capa ${b.layer ?? '—'}`, desc: b.desc, tags: [], canvas: renderGrid(g, gfx, state.zoom), isBrush: true }));
    }
  }
  grid.replaceChildren(...cards);
  $('stats').textContent = `${lib.image} · ${Object.keys(lib.stamps).length} stamps · ${Object.keys(lib.brushes).length} brushes`;
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  return { tileset: Number(p.get('ts')) || 7, filter: p.get('q') || '', kind: p.get('ver') || 'all', zoom: Number(p.get('zoom')) || 1 };
}

function writeHash(s) {
  const p = new URLSearchParams({ ts: s.tileset, ver: s.kind, zoom: s.zoom });
  if (s.filter) p.set('q', s.filter);
  history.replaceState(null, '', `#${p}`);
}

async function main() {
  const db = await fetch('/data/tilesets.json').then((r) => {
    if (!r.ok) throw new Error(`tilesets.json: HTTP ${r.status}`);
    return r.json();
  });
  const state = { ...readHash(), db };
  const select = $('lib');
  for (const [id, e] of Object.entries(STAMP_LIBRARIES)) {
    const o = document.createElement('option');
    o.value = id; o.textContent = `${id} · ${e.image}`;
    select.append(o);
  }
  select.value = String(state.tileset);
  $('filter').value = state.filter;
  $('kind').value = state.kind;
  $('zoom').value = String(state.zoom);
  let pending = 0;
  const update = async () => {
    const my = ++pending;
    Object.assign(state, {
      tileset: Number(select.value), filter: $('filter').value.trim(), kind: $('kind').value, zoom: Number($('zoom').value),
    });
    writeHash(state);
    try {
      if (my === pending) await render(state);
    } catch (err) {
      $('grid').innerHTML = '';
      const e = document.createElement('div');
      e.className = 'error'; e.textContent = `Error: ${err.message}`;
      $('grid').append(e);
      console.error(err);
    }
  };
  for (const id of ['lib', 'kind', 'zoom']) $(id).addEventListener('change', update);
  $('filter').addEventListener('input', () => { clearTimeout(update.t); update.t = setTimeout(update, 200); });
  await update();
}

main().catch((err) => {
  $('grid').textContent = `Error al iniciar el visor: ${err.message}`;
  console.error(err);
});
