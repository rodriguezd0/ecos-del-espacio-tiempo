// Mochila por bolsillos (portada de 008_UI_Bag.rb de Añil). Modos: 'field' (usar/dar/tirar/ordenar),
// 'battle' (solo objetos usables en combate) y 'select' (elegir un objeto, con filtro opcional).
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText, drawParagraph, textWidth, cropText } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawScrollArrow, drawItemIcon, itemIconUrl, COMMON_GFX } from '../core/widgets.js';
import { ListCursor } from '../core/list.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx } from '../core/sound.js';
import {
  POCKETS, SORT_MODES, pocketEntries, pocketCounts, nextPocket, showsQuantity, isKeyItem, BAG_FILTERS,
} from '../logic/bagLogic.js';
import { drawHelpWindow, showCommands, message, confirm, chooseNumber } from './common.js';
import { useBagItem } from './bagUse.js';
import { giveItemTo } from './progression.js';
import { ui } from '../api.js';

const BG = (n) => UI(`Bag/${n}.png`);
const ROWS = 7;
const memory = { pocket: 1, index: {} }; // último bolsillo/índice visto

class BagScene extends ScreenScene {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.mode = opts.mode || 'field';
    this.filter = opts.filter || (this.mode === 'battle' ? BAG_FILTERS.battle : null);
    this.help = '';
    this.busy = false;
  }

  get state() {
    return engine.state;
  }

  async enter() {
    const female = this.state?.player?.gender === 'F';
    const gfx = [];
    for (let i = 1; i <= 8; i++) gfx.push(BG(`bg_${i}`), BG(`bag_${i}${female ? '_f' : ''}`));
    gfx.push(BG('cursor'), BG('icon_pocket'), BG('icon_slider'));
    this.female = female;
    this.pocket = memory.pocket;
    this.refresh(true);
    if (this.filter && !this.entries.length) {
      const counts = pocketCounts(this.state.data.bag, engine.data.items, this.filter);
      const first = POCKETS.find((p) => counts[p.id] > 0);
      if (first) { this.pocket = first.id; this.refresh(true); }
    }
    const icons = this.entries.map((e) => itemIconUrl(e.id));
    await Promise.all([preload([...gfx, ...COMMON_GFX, ...icons]), preloadDialogGfx()]);
  }

  /** Recalcula las entradas del bolsillo actual. */
  refresh(resetCursor = false) {
    const sort = this.state.var(`ui.bagSort.${this.pocket}`, 'obtained');
    this.entries = pocketEntries(this.state.data.bag, engine.data.items, this.pocket, { filter: this.filter, sort });
    const count = this.entries.length + 1; // + CERRAR MOCHILA
    const idx = resetCursor ? memory.index[this.pocket] || 0 : this.cursor?.index || 0;
    this.cursor = new ListCursor(count, ROWS, { index: Math.min(idx, count - 1), wrap: true });
  }

  get current() {
    return this.entries[this.cursor.index] || null;
  }

  changePocket(dir) {
    const skip = this.mode !== 'field';
    const counts = pocketCounts(this.state.data.bag, engine.data.items, this.filter);
    const next = nextPocket(this.pocket, dir, counts, skip);
    if (next === this.pocket) return;
    memory.index[this.pocket] = this.cursor.index;
    this.pocket = next;
    memory.pocket = next;
    playSE(SE.bagPocket);
    this.refresh(true);
    preload(this.entries.map((e) => itemIconUrl(e.id)));
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    if (inp.repeat('LEFT')) { this.changePocket(-1); return; }
    if (inp.repeat('RIGHT')) { this.changePocket(1); return; }
    if (this.cursor.handle(inp)) memory.index[this.pocket] = this.cursor.index;
    if (inp.pressed('B')) { sfx.cancel(); this.finish(null); return; }
    if (inp.pressed('A')) {
      const e = this.current;
      if (!e) { sfx.cancel(); this.finish(null); return; }
      sfx.decision();
      this.run(() => this.onItem(e));
    }
  }

  async run(fn) {
    this.busy = true;
    try {
      await fn();
    } catch (err) {
      engine.reportError(err);
    }
    this.help = '';
    this.busy = false;
    if (this.phase === 'active') this.refresh();
  }

  async onItem(e) {
    if (this.mode !== 'field') {
      if (this.mode === 'battle') {
        this.help = `¿Qué hacer con ${e.item.name}?`;
        const c = await showCommands(['Usar', 'Cancelar']);
        if (c !== 0) return;
      }
      this.finish(e.id);
      return;
    }
    const cmds = [];
    const add = (label, fn) => cmds.push({ label, fn });
    if (e.item.fieldUse || isKeyItem(e.item)) add('Usar', () => this.useItem(e));
    if (!isKeyItem(e.item) && this.state.party.length) add('Dar', () => this.giveItem(e));
    if (!isKeyItem(e.item)) add('Tirar', () => this.tossItem(e));
    add('Ordenar', () => this.sortPocket());
    add('Cancelar', null);
    this.help = `¿Qué hacer con ${e.item.name}?`;
    const c = await showCommands(cmds.map((x) => x.label));
    if (c < 0 || !cmds[c].fn) return;
    this.help = '';
    await cmds[c].fn();
  }

  async useItem(e) {
    const r = await useBagItem(e.id);
    if (r && r.returnToWorld) this.finish(e.id);
  }

  async giveItem(e) {
    const idx = await ui.openParty({ mode: 'select', message: `¿A quién le das ${e.item.name}?` });
    if (Number.isInteger(idx)) await giveItemTo(idx, e.id);
  }

  async tossItem(e) {
    let n = 1;
    if (e.qty > 1) {
      n = await chooseNumber({ min: 1, max: e.qty, initial: 1, message: `¿Cuántos ${e.item.namePlural || e.item.name} quieres tirar?` });
      if (!n) return;
    }
    const label = n === 1 ? e.item.name : e.item.namePlural || e.item.name;
    if (!(await confirm(`¿Seguro que quieres tirar ${n} ${label}?`))) return;
    this.state.removeItem(e.id, n);
    await message(`Has tirado ${n} ${label}.`);
  }

  async sortPocket() {
    const c = await showCommands([...SORT_MODES.map((m) => m.name), 'Cancelar']);
    if (c < 0 || c >= SORT_MODES.length) return;
    this.state.setVar(`ui.bagSort.${this.pocket}`, SORT_MODES[c].id);
    playSE(SE.bagCursor);
  }

  draw(g) {
    const p = this.pocket;
    blit(g, BG(`bg_${p}`), 0, 0);
    blit(g, BG(`bag_${p}${this.female ? '_f' : ''}`), 30, 20);
    this.drawPocketIcons(g);
    if (this.mode === 'field' || this.hasOtherPockets()) {
      drawScrollArrow(g, 'left', -4, 76, this.t);
      drawScrollArrow(g, 'right', 150, 76, this.t);
    }
    drawText(g, POCKETS[p - 1].name, 94, 186, { color: C.bagText, shadow: C.bagShadow, align: 'center' });
    this.drawList(g);
    this.drawSlider(g);
    const e = this.current;
    if (e) drawItemIcon(g, e.id, 24, 312);
    const desc = e ? e.item.description || '' : 'Cerrar la Mochila.';
    drawParagraph(g, desc, 88, 286, 400, { color: C.white, shadow: '#000000', maxLines: 3 });
    if (this.help || this.opts.message) drawHelpWindow(g, this.help || this.opts.message, 358);
  }

  hasOtherPockets() {
    const counts = pocketCounts(this.state.data.bag, engine.data.items, this.filter);
    return POCKETS.filter((x) => counts[x.id] > 0).length > 1;
  }

  drawPocketIcons(g) {
    if (this.filter) {
      const counts = pocketCounts(this.state.data.bag, engine.data.items, this.filter);
      for (let i = 1; i <= 8; i++) {
        if (counts[i] > 0) continue;
        blit(g, BG('icon_pocket'), 6 + (i - 1) * 22, 224 + 6, (i - 1) * 20, 28, 20, 20);
      }
    }
    blit(g, BG('icon_pocket'), 2 + (this.pocket - 1) * 22, 224 + 2, (this.pocket - 1) * 28, 0, 28, 28);
  }

  drawList(g) {
    const c = this.cursor;
    for (let r = 0; r < ROWS + 1; r++) {
      const i = c.top + r;
      if (i >= c.count || r >= ROWS) break;
      const y = 8 + r * 32;
      if (i === c.index) blit(g, BG('cursor'), 184, y);
      const e = this.entries[i];
      if (!e) {
        drawText(g, 'CERRAR MOCHILA', 200, y + 16, { color: C.bagText, shadow: C.bagShadow });
        continue;
      }
      const qty = showsQuantity(e.item) ? `x${String(e.qty).padStart(3, ' ')}` : '';
      const qtyW = qty ? textWidth(qty) + 16 : 0;
      drawText(g, cropText(e.item.name, 250 - qtyW), 200, y + 16, { color: C.bagText, shadow: C.bagShadow });
      if (qty) drawText(g, qty, 450, y + 16, { color: C.bagText, shadow: C.bagShadow, align: 'right' });
    }
  }

  drawSlider(g) {
    const c = this.cursor;
    if (!c.canScrollUp && !c.canScrollDown) return;
    const sl = BG('icon_slider');
    if (c.canScrollUp) blit(g, sl, 470, 16, 0, 0, 36, 38);
    if (c.canScrollDown) blit(g, sl, 470, 228, 0, 38, 36, 38);
    const sliderH = 174;
    let boxH = Math.floor((sliderH * ROWS) / c.count);
    boxH += Math.min((sliderH - boxH) / 2, sliderH / 6);
    boxH = Math.max(Math.floor(boxH), 38);
    const maxTop = Math.max(1, c.count - ROWS);
    const y = 54 + Math.floor(((sliderH - boxH) * c.top) / maxTop);
    blit(g, sl, 470, y, 36, 0, 36, 4);
    for (let yy = 4; yy < boxH - 18; yy += 16) blit(g, sl, 470, y + yy, 36, 4, 36, Math.min(16, boxH - 18 - yy));
    blit(g, sl, 470, y + boxH - 18, 36, 20, 36, 18);
  }
}

/** Abre la mochila. Ver ui.openBag. */
export async function open(opts = {}) {
  if (!engine.state) throw new Error('No hay partida en curso: no se puede abrir la mochila.');
  return openScene(new BagScene(opts));
}
