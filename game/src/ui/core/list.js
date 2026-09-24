// Ventana de comandos con cursor y desplazamiento (Window_CommandPokemon de Essentials) y
// la lógica de selección reutilizable (ListCursor) para listas propias de cada pantalla.
import { SCREEN_W } from '../../core/engine.js';
import { drawWindow, isDarkSkin, skinBorders } from './windowskin.js';
import { drawText, textWidth } from './text.js';
import { messageColors } from './colors.js';
import { drawSelArrow, drawScrollArrow } from './widgets.js';
import { menuSkin } from './options.js';
import { sfx } from './sound.js';

/**
 * Cursor sobre una lista con desplazamiento: mantiene `index` y `top` (primera fila visible).
 * wrap: vuelve al principio/final al pasarse.
 */
export class ListCursor {
  constructor(count, visibleRows, { index = 0, wrap = true } = {}) {
    this.count = count;
    this.rows = Math.max(1, visibleRows);
    this.wrap = wrap;
    this.index = Math.max(0, Math.min(index, count - 1));
    this.top = 0;
    this.ensureVisible();
  }

  setCount(count) {
    this.count = count;
    this.index = Math.max(0, Math.min(this.index, count - 1));
    this.ensureVisible();
  }

  ensureVisible() {
    if (this.index < this.top) this.top = this.index;
    if (this.index >= this.top + this.rows) this.top = this.index - this.rows + 1;
    this.top = Math.max(0, Math.min(this.top, Math.max(0, this.count - this.rows)));
  }

  move(delta) {
    if (this.count <= 0) return false;
    let i = this.index + delta;
    if (this.wrap && Math.abs(delta) === 1) i = (i + this.count) % this.count;
    else i = Math.max(0, Math.min(this.count - 1, i));
    if (i === this.index) return false;
    this.index = i;
    this.ensureVisible();
    return true;
  }

  /** Procesa arriba/abajo (con repetición) y L/R como página. Devuelve true si cambió. */
  handle(input) {
    let moved = false;
    if (input.repeat('UP')) moved = this.move(-1);
    else if (input.repeat('DOWN')) moved = this.move(1);
    else if (input.repeat('L') || input.repeat('LEFT')) moved = this.pageKeys ? this.move(-this.rows) : false;
    else if (input.repeat('R') || input.repeat('RIGHT')) moved = this.pageKeys ? this.move(this.rows) : false;
    if (moved) sfx.cursor();
    return moved;
  }

  get canScrollUp() { return this.top > 0; }
  get canScrollDown() { return this.top + this.rows < this.count; }
}

const ROW_H = 32;

/**
 * Ventana de comandos.
 * items: string | { label, disabled?, color?: [base, shadow] }
 * opts: { x, y, width, maxRows, skin, align: 'right' (ancla x como borde derecho), cancelIndex }
 */
export class CommandWindow {
  constructor(items, opts = {}) {
    this.items = items.map((it) => (typeof it === 'string' ? { label: it } : it));
    this.skinName = opts.skin || null;
    const b = skinBorders(this.skin);
    this.borders = b;
    const maxRows = opts.maxRows || 8;
    this.rows = Math.min(maxRows, Math.max(1, this.items.length));
    const textW = Math.max(0, ...this.items.map((it) => textWidth(it.label)));
    this.width = opts.width || Math.min(SCREEN_W, textW + 16 + 16 + 8 + b.left + b.right);
    this.height = this.rows * ROW_H + b.top + b.bottom;
    this.x = opts.align === 'right' ? (opts.x ?? SCREEN_W) - this.width : opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.cursor = new ListCursor(this.items.length, this.rows, { index: opts.index || 0 });
    this.cancelIndex = opts.cancelIndex ?? -1;
    this.t = 0;
    this.active = true;
  }

  get skin() {
    return this.skinName || menuSkin();
  }

  get index() {
    return this.cursor.index;
  }

  /**
   * Procesa la entrada. Devuelve { type: 'select', index } | { type: 'cancel' } | null.
   */
  update(input) {
    this.t += 1;
    if (!this.active) return null;
    this.cursor.handle(input);
    if (input.pressed('A')) {
      const it = this.items[this.cursor.index];
      if (it && it.disabled) { sfx.buzzer(); return null; }
      sfx.decision();
      return { type: 'select', index: this.cursor.index };
    }
    if (input.pressed('B') && this.cancelIndex !== null) {
      sfx.cancel();
      return { type: 'cancel', index: this.cancelIndex };
    }
    return null;
  }

  draw(g) {
    const { x, y, width, height, borders: b } = this;
    drawWindow(g, this.skin, x, y, width, height);
    const dark = isDarkSkin(this.skin);
    const [base, shadow] = messageColors(null, dark);
    const c = this.cursor;
    for (let r = 0; r < this.rows; r++) {
      const i = c.top + r;
      const it = this.items[i];
      if (!it) break;
      const ry = y + b.top + r * ROW_H;
      if (i === c.index && this.active) drawSelArrow(g, x + b.left, ry, dark);
      let col = it.color || [base, shadow];
      if (it.disabled) col = messageColors(7, dark);
      drawText(g, it.label, x + b.left + 16, ry - 2, { color: col[0], shadow: col[1] });
    }
    if (c.canScrollUp) drawScrollArrow(g, 'up', x + width / 2 - 14, y - 4, this.t);
    if (c.canScrollDown) drawScrollArrow(g, 'down', x + width / 2 - 14, y + height - 36, this.t);
  }
}
