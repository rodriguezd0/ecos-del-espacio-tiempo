// Escenas de diálogo apiladas sobre el mapa: mensaje, elección y número.
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { UIScene } from '../core/uiScene.js';
import { MessageBox, LINE_HEIGHT, MESSAGE_LINES } from './messageBox.js';
import { CommandWindow } from '../core/list.js';
import { preloadSkins, frameAt, drawWindow, isDarkSkin, skinBorders } from '../core/windowskin.js';
import { currentOptions, menuSkin } from '../core/options.js';
import { preload } from '../core/images.js';
import { COMMON_GFX, drawScrollArrow } from '../core/widgets.js';
import { drawText, textWidth } from '../core/text.js';
import { messageColors } from '../core/colors.js';
import { sfx } from '../core/sound.js';

const MSG_BOX_H = LINE_HEIGHT * MESSAGE_LINES + 32;

export async function preloadDialogGfx() {
  const f = frameAt(currentOptions().frame);
  await Promise.all([preloadSkins([f.speech, f.menu]), preload(COMMON_GFX)]);
}

/** Caja de mensaje. Reutilizable: show() devuelve una promesa que se resuelve al terminar cada texto. */
export class MessageScene extends UIScene {
  constructor() {
    super();
    this.box = new MessageBox();
    this.resolveCurrent = null;
    this.kept = false;
  }

  async enter() {
    await preloadDialogGfx();
  }

  exit() {
    this.exited = true;
    if (this.resolveCurrent) this.resolveCurrent();
    this.resolveCurrent = null;
  }

  show(text, opts = {}) {
    if (this.resolveCurrent) this.resolveCurrent(); // no debería ocurrir: libera la espera anterior
    this.kept = false;
    this.box.show(text, opts);
    return new Promise((resolve) => { this.resolveCurrent = resolve; });
  }

  tick() {
    if (this.kept) return; // abierta a la espera de closeMessage() o de un nuevo texto
    this.box.update(this.input);
    if (!this.box.done) return;
    const resolve = this.resolveCurrent;
    this.resolveCurrent = null;
    if (this.box.opts?.keepOpen) {
      this.kept = true;
    } else {
      this.close();
    }
    if (resolve) resolve();
  }

  drawUI(g) {
    this.box.draw(g);
  }
}

/** Ventana de elección (Sí/No, listas). Se coloca encima de la caja de mensaje, a la derecha. */
export class ChoiceScene extends UIScene {
  /**
   * @param {Array<string|object>} items
   * @param {{ cancel?: number, index?: number, x?: number, y?: number, maxRows?: number, messageBelow?: boolean }} opts
   */
  constructor(items, opts = {}) {
    super();
    this.items = items;
    this.opts = opts;
  }

  async enter() {
    await preloadDialogGfx();
    const cancel = this.opts.cancel === undefined ? -1 : this.opts.cancel;
    const maxRows = this.opts.maxRows || Math.floor((SCREEN_H - MSG_BOX_H) / 32) - 1;
    this.win = new CommandWindow(this.items, {
      index: this.opts.index || 0, maxRows, cancelIndex: cancel === null ? null : cancel, width: this.opts.width,
    });
    const bottom = this.opts.anchor === 'screen' ? SCREEN_H : SCREEN_H - MSG_BOX_H;
    this.win.x = this.opts.x ?? SCREEN_W - this.win.width;
    this.win.y = this.opts.y ?? bottom - this.win.height;
  }

  tick() {
    const r = this.win.update(this.input);
    if (!r) return;
    this.close(r.index);
  }

  drawUI(g) {
    this.win.draw(g);
  }
}

/** Introducir un número: arriba/abajo ±1, izquierda/derecha ±10. formatter(n) → texto adicional (precio). */
export class NumberScene extends UIScene {
  constructor(opts = {}) {
    super();
    this.min = opts.min ?? 0;
    this.max = Math.max(this.min, opts.max ?? 99);
    this.value = Math.max(this.min, Math.min(this.max, opts.initial ?? this.min));
    this.formatter = opts.formatter || null;
    this.digits = String(this.max).length;
    this.opts = opts;
  }

  async enter() {
    await preloadDialogGfx();
  }

  set(v) {
    const n = Math.max(this.min, Math.min(this.max, v));
    if (n !== this.value) { this.value = n; sfx.cursor(); }
  }

  tick() {
    const inp = this.input;
    const span = this.max - this.min + 1;
    if (inp.repeat('UP')) this.set(this.value === this.max ? this.min : this.value + 1);
    else if (inp.repeat('DOWN')) this.set(this.value === this.min ? this.max : this.value - 1);
    else if (inp.repeat('RIGHT')) this.set(this.value + 10);
    else if (inp.repeat('LEFT')) this.set(this.value - 10);
    if (span <= 0) return;
    if (inp.pressed('A')) { sfx.decision(); this.close(this.value); }
    else if (inp.pressed('B')) { sfx.cancel(); this.close(this.opts.cancelValue ?? null); }
  }

  drawUI(g) {
    const skin = menuSkin();
    const b = skinBorders(skin);
    const numText = `x${String(this.value).padStart(this.digits, '0')}`;
    const extra = this.formatter ? this.formatter(this.value) : '';
    const inner = textWidth(numText) + (extra ? textWidth(extra) + 24 : 0) + 16;
    const w = Math.max(120, inner + b.left + b.right);
    const h = 32 + b.top + b.bottom;
    const x = this.opts.x ?? SCREEN_W - w;
    const y = this.opts.y ?? SCREEN_H - MSG_BOX_H - h;
    drawWindow(g, skin, x, y, w, h);
    const [base, shadow] = messageColors(null, isDarkSkin(skin));
    drawText(g, numText, x + b.left + 8, y + b.top - 2, { color: base, shadow });
    if (extra) drawText(g, extra, x + w - b.right - 4, y + b.top - 2, { color: base, shadow, align: 'right' });
    const ax = x + b.left + 8 + textWidth(numText) / 2 - 14;
    drawScrollArrow(g, 'up', ax, y - 30, this.t);
    drawScrollArrow(g, 'down', ax, y + h - 10, this.t);
  }
}
