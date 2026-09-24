// Barra de mensajes del combate (estilo Añil: franja oscura translúcida y texto blanco con sombra).
// Reutiliza la escritura progresiva y los códigos de texto de ui/message/messageBox.js.
// Modos (Battle::Scene#pbDisplay*): normal → se cierra sola 1 s después de escribirse (A/B adelantan);
// paused → flecha y espera (3 s, o tecla al final del combate); brief → queda visible mientras sigue la acción.
import { SCREEN_W, SCREEN_H } from '../../../core/engine.js';
import { MessageBox } from '../../../ui/message/messageBox.js';
import { drawGlyphRun } from '../../../ui/core/text.js';
import { drawPauseArrow } from '../../../ui/core/widgets.js';
import { UI, blit } from '../../../ui/core/images.js';

export const MESSAGE_GFX = [UI('Battle/overlay_message.png')];
const BAR_Y = SCREEN_H - 96;
const TEXT_BASE = '#ffffff';
const TEXT_SHADOW = '#4b4b4b';
export const NORMAL_AUTO = 60;
export const PAUSED_AUTO = 180;

class BattleTextBox extends MessageBox {
  layout() {
    return {
      x: 0, y: BAR_Y, w: SCREEN_W, h: 96,
      tx: 32, ty: BAR_Y + 14, tw: SCREEN_W - 72,
      clipY: BAR_Y + 4, clipH: 88,
    };
  }

  updateEnd(pressed) {
    if (this.closeAfter !== null) {
      if (--this.closeAfter <= 0) this.state = 'done';
      return;
    }
    if (this.noWait || this.opts?.keepOpen) { this.state = 'done'; return; }
    if (pressed) { this.state = 'done'; return; }
    if (this.autoLeft !== null) {
      this.autoLeft -= this.fastForward ? 6 : 1;
      if (this.autoLeft <= 0) this.state = 'done';
    }
  }
}

export class MessageBar {
  constructor() {
    this.box = new BattleTextBox({ lines: 2 });
    this.visible = false; // fondo de la barra (también bajo los menús)
    this.showText = false;
    this.resolve = null;
    this.mode = 'normal';
    this.lingering = 0; // fotogramas que lleva visible un mensaje breve terminado
    this.battleEnd = false;
    this.t = 0;
  }

  get busy() {
    return Boolean(this.resolve);
  }

  /**
   * Muestra un mensaje. mode: 'normal' | 'paused' | 'brief' | 'hold' (sin cierre automático, p. ej. antes
   * de una pregunta). Devuelve una promesa que se resuelve al terminar según el modo.
   */
  show(text, mode = 'normal') {
    this.finishPending();
    this.mode = mode;
    this.visible = true;
    this.showText = true;
    this.lingering = 0;
    let auto = null;
    if (mode === 'normal') auto = NORMAL_AUTO;
    else if (mode === 'paused' && (!this.battleEnd || this.autoAdvance)) auto = PAUSED_AUTO;
    this.box.show(String(text ?? ''), { auto: auto ?? undefined, keepOpen: mode === 'brief' || mode === 'hold' });
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  finishPending() {
    if (this.resolve) {
      const r = this.resolve;
      this.resolve = null;
      r();
    }
  }

  /** Oculta el texto (la barra puede seguir visible bajo los menús). */
  clear() {
    this.finishPending();
    this.showText = false;
    this.box.hide();
  }

  hide() {
    this.clear();
    this.visible = false;
  }

  /** Un mensaje breve ya escrito sigue en pantalla. */
  get lingeringBrief() {
    return this.showText && this.mode === 'brief' && this.box.finishedTyping;
  }

  update(input, fast = false) {
    this.t += 1;
    if (!this.showText) return;
    this.box.fastForward = fast;
    if (fast && this.box.state === 'typing') this.box.fast = true;
    if (fast && this.box.state === 'more') this.box.startScroll();
    this.box.update(input);
    if (this.box.finishedTyping && this.mode === 'brief') this.lingering += 1;
    if (this.box.done && this.resolve) {
      const r = this.resolve;
      this.resolve = null;
      if (this.mode !== 'brief' && this.mode !== 'hold') this.showText = false;
      r();
    }
  }

  draw(g) {
    if (!this.visible) return;
    blit(g, UI('Battle/overlay_message.png'), 0, BAR_Y);
    if (!this.showText) return;
    const L = this.box.layout();
    const top = this.box.scrollLines;
    g.save();
    g.beginPath();
    g.rect(L.x, L.clipY, L.w, L.clipH);
    g.clip();
    const run = [];
    for (const c of this.box.shown) {
      const rel = c.line - top;
      if (rel < -1 || rel > 2) continue;
      run.push({ ch: c.ch, x: L.tx + c.x, y: Math.round(L.ty + rel * 32), color: c.color ? '#f8d030' : TEXT_BASE, shadow: TEXT_SHADOW });
    }
    drawGlyphRun(g, run, 'system');
    g.restore();
    const waitingKey = this.box.state === 'more' || (this.box.state === 'end' && this.mode === 'paused');
    if (waitingKey) drawPauseArrow(g, SCREEN_W - 44, SCREEN_H - 40, this.t);
  }
}
