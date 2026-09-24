// Caja de diálogo con escritura progresiva, desplazamiento de líneas, códigos de control,
// etiqueta de hablante y estilo telepático del Core de Zygarde.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { expandText, tokenize, layoutTokens } from '../core/textCodes.js';
import { drawText, drawGlyphRun, measure, textWidth } from '../core/text.js';
import { drawWindow, isDarkSkin, skinBorders } from '../core/windowskin.js';
import { messageColors, C } from '../core/colors.js';
import { drawPauseArrow } from '../core/widgets.js';
import { charsPerFrame, speechSkin, menuSkin } from '../core/options.js';
import { playSE, SE } from '../core/sound.js';

export const MESSAGE_LINES = 2;
export const LINE_HEIGHT = 32;
const SCROLL_FRAMES_PER_LINE = 6;
const TEXT_PADDING = 4;

/** Entorno de sustitución de códigos a partir de la partida en curso. */
export function textEnv() {
  const s = engine.state;
  return {
    playerName: s?.player?.name ?? '',
    money: s?.player?.money ?? 0,
    vars: (k) => (s ? s.var(k, '') : ''),
  };
}

export class MessageBox {
  /**
   * @param {{ lines?: number, position?: 'bottom'|'top'|'middle', skin?: string }} opts
   */
  constructor(opts = {}) {
    this.lines = opts.lines || MESSAGE_LINES;
    this.position = opts.position || 'bottom';
    this.skinOverride = opts.skin || null;
    this.visible = false;
    this.t = 0;
    this.reset();
  }

  reset() {
    this.ops = [];
    this.pos = 0;
    this.shown = [];
    this.topLine = 0;
    this.budget = 0;
    this.state = 'idle'; // typing | waiting | more | scrolling | end | done
    this.fast = false;
    this.waitLeft = 0;
    this.closeAfter = null;
    this.noWait = false;
    this.autoLeft = null;
    this.scrollFrom = 0;
    this.scrollTo = 0;
    this.scrollT = 0;
  }

  get skin() {
    return this.skinOverride || speechSkin();
  }

  get telepathy() {
    return Boolean(this.opts?.telepathy);
  }

  /** Geometría de la caja y del área de texto. */
  layout() {
    const h = LINE_HEIGHT * this.lines + 32;
    const w = SCREEN_W;
    let y = SCREEN_H - h;
    if (this.position === 'top') y = 0;
    else if (this.position === 'middle') y = Math.floor((SCREEN_H - h) / 2);
    const b = this.telepathy ? { left: 24, top: 16, right: 40, bottom: 16 } : skinBorders(this.skin);
    return {
      x: 0, y, w, h,
      tx: b.left + TEXT_PADDING, ty: y + b.top - 2,
      tw: w - b.left - b.right - TEXT_PADDING * 2,
      clipY: y + b.top - 4, clipH: h - b.top - b.bottom + 8,
    };
  }

  /**
   * Muestra un texto nuevo.
   * @param {string} text
   * @param {{ speaker?: string, telepathy?: boolean, keepOpen?: boolean, auto?: number, position?: string,
   *           skin?: string, se?: string }} opts
   */
  show(text, opts = {}) {
    this.reset();
    this.opts = opts;
    if (opts.position) this.position = opts.position;
    if (opts.skin) this.skinOverride = opts.skin;
    const L = this.layout();
    const expanded = expandText(text, textEnv());
    const { ops } = layoutTokens(tokenize(expanded), L.tw, measure('system'), { linesPerPage: this.lines });
    this.ops = ops;
    this.autoLeft = Number.isFinite(opts.auto) ? opts.auto : null;
    this.state = 'typing';
    this.visible = true;
    if (opts.se) playSE(opts.se);
  }

  get done() {
    return this.state === 'done';
  }

  /** ¿Terminó de escribir (aunque espere tecla)? */
  get finishedTyping() {
    return this.state === 'end' || this.state === 'done';
  }

  hide() {
    this.visible = false;
  }

  update(input) {
    this.t += 1;
    const pressed = input && (input.pressed('A') || input.pressed('B'));
    switch (this.state) {
      case 'typing':
        if (pressed) this.fast = true;
        this.type();
        break;
      case 'waiting':
        if (pressed) this.fast = true;
        if (this.fast || --this.waitLeft <= 0) { this.state = 'typing'; this.type(); }
        break;
      case 'more':
        if (pressed) { playSE(SE.cursor); this.startScroll(); }
        break;
      case 'scrolling':
        if (++this.scrollT >= this.scrollFrames) {
          this.topLine = this.scrollTo;
          this.state = 'typing';
          this.fast = false;
          this.type();
        }
        break;
      case 'end':
        this.updateEnd(pressed);
        break;
      default:
        break;
    }
  }

  updateEnd(pressed) {
    if (this.closeAfter !== null) {
      if (--this.closeAfter <= 0) this.state = 'done';
      return;
    }
    if (this.noWait || this.opts?.keepOpen) { this.state = 'done'; return; }
    if (this.autoLeft !== null) {
      if (--this.autoLeft <= 0) this.state = 'done';
      return;
    }
    if (pressed) {
      playSE(SE.cursor);
      this.state = 'done';
    }
  }

  type() {
    const cpf = this.fast ? Infinity : charsPerFrame();
    this.budget = Math.min(this.budget + cpf, 1e6);
    while (this.pos < this.ops.length) {
      const op = this.ops[this.pos];
      if (op.op === 'char') {
        const bottom = this.topLine + this.lines;
        if (op.line >= bottom || (op.pageBreak && this.shown.length && op.line > this.topLine)) {
          this.state = 'more';
          this.fast = false;
          this.budget = 0;
          return;
        }
        if (this.budget < 1) return;
        this.budget -= 1;
        this.shown.push(op);
        this.pos += 1;
      } else if (op.op === 'wait') {
        this.pos += 1;
        if (!this.fast) {
          this.state = 'waiting';
          this.waitLeft = op.frames;
          this.budget = 0;
          return;
        }
      } else {
        if (op.op === 'se') playSE(op.name);
        else if (op.op === 'close') this.closeAfter = op.frames;
        else if (op.op === 'noWait') this.noWait = true;
        this.pos += 1;
      }
    }
    this.state = 'end';
    this.fast = false;
    this.budget = 0;
  }

  startScroll() {
    const next = this.ops.slice(this.pos).find((o) => o.op === 'char');
    if (!next) { this.state = 'typing'; return; }
    const target = next.pageBreak ? next.line : next.line - this.lines + 1;
    this.scrollFrom = this.topLine;
    this.scrollTo = Math.max(this.topLine + 1, target);
    if (next.pageBreak) {
      this.topLine = this.scrollTo;
      this.state = 'typing';
      this.type();
      return;
    }
    this.scrollFrames = SCROLL_FRAMES_PER_LINE * (this.scrollTo - this.scrollFrom);
    this.scrollT = 0;
    this.state = 'scrolling';
  }

  /** Posición vertical de desplazamiento actual en líneas (fraccional durante la animación). */
  get scrollLines() {
    if (this.state !== 'scrolling') return this.topLine;
    const k = this.scrollT / this.scrollFrames;
    return this.scrollFrom + (this.scrollTo - this.scrollFrom) * k;
  }

  draw(g) {
    if (!this.visible) return;
    const L = this.layout();
    if (this.telepathy) this.drawTelepathyFrame(g, L);
    else drawWindow(g, this.skin, L.x, L.y, L.w, L.h);
    const dark = this.telepathy || isDarkSkin(this.skin);
    if (this.opts?.speaker && !this.telepathy) this.drawSpeaker(g, L);
    // Texto (recortado al área de la caja)
    const top = this.scrollLines;
    g.save();
    g.beginPath();
    g.rect(L.x, L.clipY, L.w, L.clipH);
    g.clip();
    const run = [];
    for (const c of this.shown) {
      const rel = c.line - top;
      if (rel < -1 || rel > this.lines) continue;
      let base; let shadow;
      if (this.telepathy && !c.color) { base = C.core; shadow = C.coreShadow; } else [base, shadow] = messageColors(c.color, dark);
      run.push({ ch: c.ch, x: L.tx + c.x, y: Math.round(L.ty + rel * LINE_HEIGHT), color: base, shadow });
    }
    drawGlyphRun(g, run, 'system');
    g.restore();
    // Flecha de continuar (abajo a la derecha, como CURSOR_POSITION = 1)
    const waitingKey = this.state === 'more' || (this.state === 'end' && this.closeAfter === null && !this.noWait
      && !this.opts?.keepOpen && this.autoLeft === null);
    if (waitingKey) {
      if (this.telepathy) this.drawCoreArrow(g, L);
      else drawPauseArrow(g, L.x + L.w - 44, L.y + L.h - 40, this.t);
    }
  }

  drawSpeaker(g, L) {
    const name = String(this.opts.speaker);
    const skin = menuSkin();
    const b = skinBorders(skin);
    const w = Math.max(96, textWidth(name) + b.left + b.right + 16);
    const h = 32 + b.top + b.bottom - 8;
    const x = 14;
    const y = this.position === 'top' ? L.y + L.h - 4 : L.y - h + 4;
    drawWindow(g, skin, x, y, w, h);
    const dark = isDarkSkin(skin);
    const [base, shadow] = messageColors(null, dark);
    drawText(g, name, x + w / 2, y + b.top - 6, { align: 'center', color: base, shadow });
  }

  drawTelepathyFrame(g, L) {
    const pulse = 0.55 + 0.25 * Math.sin(this.t / 40);
    g.fillStyle = 'rgba(6, 14, 10, 0.93)';
    g.fillRect(L.x + 6, L.y + 4, L.w - 12, L.h - 8);
    g.fillStyle = C.coreEdge;
    g.fillRect(L.x + 6, L.y + 4, L.w - 12, 2);
    g.fillRect(L.x + 6, L.y + L.h - 6, L.w - 12, 2);
    g.globalAlpha = pulse;
    g.fillStyle = C.core;
    g.fillRect(L.x + 10, L.y + 8, L.w - 20, 1);
    g.fillRect(L.x + 10, L.y + L.h - 9, L.w - 20, 1);
    g.globalAlpha = 1;
    // Hexágono discreto (célula) a la izquierda
    drawHexOutline(g, L.x + 14, L.y + L.h / 2, 5, C.core, pulse);
  }

  drawCoreArrow(g, L) {
    const a = 0.4 + 0.6 * Math.abs(Math.sin(this.t / 16));
    const x = L.x + L.w - 34;
    const y = L.y + L.h - 30;
    g.globalAlpha = a;
    g.fillStyle = C.core;
    for (let i = 0; i < 6; i++) g.fillRect(x + i, y + i, 12 - i * 2, 1);
    g.globalAlpha = 1;
  }
}

function hexPath(g, cx, cy, r) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = Math.round(cx + r * Math.cos(a));
    const py = Math.round(cy + r * Math.sin(a));
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
}

/** Contorno de hexágono de píxeles (decoración del estilo telepático). */
export function drawHexOutline(g, cx, cy, r, color, alpha = 1, lineWidth = 2) {
  g.save();
  g.globalAlpha *= alpha;
  g.strokeStyle = color;
  g.lineWidth = lineWidth;
  hexPath(g, cx, cy, r);
  g.stroke();
  g.restore();
}

/** Hexágono relleno. */
export function drawHexFilled(g, cx, cy, r, color, alpha = 1) {
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = color;
  hexPath(g, cx, cy, r);
  g.fill();
  g.restore();
}
