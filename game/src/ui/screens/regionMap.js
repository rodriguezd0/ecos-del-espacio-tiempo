// Mapa de la región / Vuelo (estructura de 010_UI_RegionMap.rb con datos de relleno: atlas PENDIENTE X02).
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { COMMON_GFX } from '../core/widgets.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { sfx } from '../core/sound.js';
import { REGION_MAP, pointAt, pointForMap, canFlyTo } from '../logic/regionMapData.js';
import { message, confirm } from './common.js';

const TM = (n) => UI(`Town Map/${n}.png`);
const SQ = 16;
const OX = 16;
const OY = 32;
const COLORS = { '.': '#2848c8', '#': '#58a048', '=': '#d8c080' };

class RegionMapScene extends ScreenScene {
  constructor(opts) {
    super();
    this.opts = opts;
    this.map = opts.mapData || REGION_MAP;
    const here = pointForMap(this.map, engine.state?.player?.mapId) || this.map.points[0];
    this.cx = here ? here.x : 15;
    this.cy = here ? here.y : 10;
    this.here = pointForMap(this.map, engine.state?.player?.mapId);
    this.busy = false;
  }

  async enter() {
    await Promise.all([preload([TM('bg'), TM('cursor'), TM('icon_fly'), ...COMMON_GFX]), preloadDialogGfx()]);
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    const cols = this.map.grid[0].length;
    const rows = this.map.grid.length;
    let moved = false;
    if (inp.repeat('LEFT') && this.cx > 0) { this.cx -= 1; moved = true; }
    else if (inp.repeat('RIGHT') && this.cx < cols - 1) { this.cx += 1; moved = true; }
    if (inp.repeat('UP') && this.cy > 0) { this.cy -= 1; moved = true; }
    else if (inp.repeat('DOWN') && this.cy < rows - 1) { this.cy += 1; moved = true; }
    if (moved) sfx.cursor();
    if (inp.pressed('B')) { sfx.cancel(); this.finish(null); return; }
    if (inp.pressed('A') && this.opts.fly) {
      this.busy = true;
      this.tryFly().finally(() => { this.busy = false; });
    }
  }

  async tryFly() {
    const p = pointAt(this.map, this.cx, this.cy);
    if (!p) return;
    if (!canFlyTo(p, engine.state?.data.flyPoints)) { sfx.buzzer(); await message('No puedes volar a ese lugar todavía.'); return; }
    if (await confirm(`¿Quieres volar a ${p.name}?`)) this.finish(p.id);
  }

  draw(g) {
    blit(g, TM('bg'), 0, 0);
    const grid = this.map.grid;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        g.fillStyle = COLORS[grid[y][x]] || COLORS['.'];
        g.fillRect(OX + x * SQ, OY + y * SQ, SQ, SQ);
      }
    }
    this.drawRoutes(g);
    const fly = engine.state?.data.flyPoints || [];
    for (const p of this.map.points) {
      const px = OX + p.x * SQ;
      const py = OY + p.y * SQ;
      g.fillStyle = '#f8f0c8';
      g.fillRect(px + 2, py + 2, SQ - 4, SQ - 4);
      g.fillStyle = '#384048';
      g.fillRect(px + 5, py + 5, SQ - 10, SQ - 10);
      if (this.opts.fly && canFlyTo(p, fly)) blit(g, TM('icon_fly'), px - 8, py - 8, (Math.floor(this.t / 16) % 2) * 32, 0, 32, 32);
    }
    if (this.here && Math.floor(this.t / 20) % 2) {
      g.fillStyle = '#b9ff66';
      g.fillRect(OX + this.here.x * SQ + 4, OY + this.here.y * SQ - 6, 8, 8);
    }
    blit(g, TM('cursor'), OX + this.cx * SQ - 8, OY + this.cy * SQ - 8, (Math.floor(this.t / 16) % 2) * 32, 0, 32, 32);
    const p = pointAt(this.map, this.cx, this.cy);
    const header = this.opts.fly ? '¿Adónde quieres volar?' : `Región de ${this.map.name}`;
    drawText(g, header, 24, 0, { color: '#f8f8f8', shadow: '#182878' });
    drawText(g, p ? p.name : '', 488, 0, { color: '#f8f8f8', shadow: '#182878', align: 'right' });
    drawText(g, `Atlas pendiente [PROVISIONAL ${this.map.provisional || 'X02'}]`, 256, 356, { color: '#f8f8f8', shadow: '#182878', align: 'center', font: 'small' });
  }

  drawRoutes(g) {
    const byId = Object.fromEntries(this.map.points.map((p) => [p.id, p]));
    g.fillStyle = COLORS['='];
    for (const [a, b] of this.map.routes || []) {
      const p = byId[a];
      const q = byId[b];
      if (!p || !q) continue;
      // Ruta en L: horizontal y luego vertical, en casillas
      const y0 = OY + p.y * SQ + SQ / 2 - 2;
      g.fillRect(OX + Math.min(p.x, q.x) * SQ + SQ / 2, y0, Math.abs(q.x - p.x) * SQ, 4);
      g.fillRect(OX + q.x * SQ + SQ / 2 - 2, OY + Math.min(p.y, q.y) * SQ + SQ / 2, 4, Math.abs(q.y - p.y) * SQ);
    }
  }
}

/** Abre el mapa. opts: { fly: true } → id del punto de vuelo elegido o null; { mapData } para datos propios. */
export async function open(opts = {}) {
  return openScene(new RegionMapScene(opts));
}
