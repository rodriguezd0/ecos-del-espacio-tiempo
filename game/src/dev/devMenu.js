// Menú del modo desarrollador (F9 en el mapa o «Desarrollador» en el menú de pausa; docs/MODO_DESARROLLADOR.md).
// Escena de UI transparente sobre el mapa con una pila de páginas. Todo se maneja con el TECLADO físico (los
// buscadores necesitan letras, que el juego usa como botones): ↑↓ mover · RePág/AvPág saltar · Intro elegir ·
// Esc volver · escribir filtra (páginas con buscador) · F9 cierra. Las páginas son objetos:
//   { title, search?: bool, hint?, empty?, items(dev, query) → [{ label, value?, hint?, color?, run?(dev, item) }] }
// y `run` puede usar menu.push(página), menu.prompt({...}) → texto|null, menu.pick(título, opciones) → índice|null,
// menu.status(texto) y menu.close(acción) (acción { type: 'dev', label, run(ctx) } que el mapa ejecuta como guion).
import { engine, SCREEN_W, SCREEN_H } from '../core/engine.js';
import { UIScene, openScene } from '../ui/core/uiScene.js';
import { drawWindow, isDarkSkin, skinBorders } from '../ui/core/windowskin.js';
import { drawText, cropText } from '../ui/core/text.js';
import { messageColors, C } from '../ui/core/colors.js';
import { menuSkin } from '../ui/core/options.js';
import { drawSelArrow, drawScrollArrow } from '../ui/core/widgets.js';
import { preloadDialogGfx } from '../ui/message/messageScenes.js';
import { sfx } from '../ui/core/sound.js';
import { DEV_KEY, DEV_KEY_LABEL } from './devConfig.js';

const MARGIN = 6;
const ROW_H = 22;
const LIST_FONT = 'note';
const HEADER_H = 34;
const SEARCH_H = 24;
const FOOTER_H = 40;
const MAX_QUERY = 32;
const PAGE_JUMP = 8;

/** Una página de entrada de texto (prompt). */
function inputPage({ title, initial = '', hint = '', validate = null }, resolve) {
  return { title, input: true, text: String(initial), hint, validate, resolve, items: () => [] };
}

/** Una página de elección simple (pick). */
function pickPage(title, options, resolve, hint = '') {
  const answer = (dev, i) => dev.menu.answer(i);
  return {
    title, hint, resolve,
    items: () => options.map((o, i) => ({ ...(typeof o === 'string' ? { label: o } : o), run: (dev) => answer(dev, i) })),
  };
}

export class DevMenuScene extends UIScene {
  /** dev = { scene (MapScene), state, db } — lo que reciben las páginas. */
  constructor(root, dev) {
    super();
    this.dev = { ...dev, menu: this };
    this.pages = [];
    this.message = '';
    this.messageColor = null;
    this.onKey = (e) => this.handleKey(e);
    this.pushPage(root);
  }

  async enter() {
    await preloadDialogGfx();
    window.addEventListener('keydown', this.onKey);
    sfx.decision();
  }

  exit() {
    window.removeEventListener('keydown', this.onKey);
    // Cualquier pregunta pendiente se responde «cancelar» para no dejar guiones colgados.
    for (const p of this.pages) p.resolve?.(null);
  }

  get page() { return this.pages[this.pages.length - 1]; }

  // ------------------------------------------------------------------ API para las páginas
  pushPage(page) {
    this.pages.push({ ...page, index: 0, top: 0, query: '', cache: null });
  }

  push(page) { this.pushPage(page); sfx.decision(); }

  pop() {
    const p = this.pages.pop();
    p?.resolve?.(null);
    if (!this.pages.length) this.close(null);
    else this.invalidate();
  }

  /** Vuelve a calcular las filas de la página actual (tras cambiar el estado). */
  invalidate() { for (const p of this.pages) p.cache = null; }

  status(text, kind = 'ok') {
    this.message = String(text ?? '');
    this.messageColor = kind === 'error' ? C.red : null;
    this.messageAt = this.t;
  }

  /** Pide un texto. opts: { title, initial, hint, validate(texto) → mensaje de error | null }. */
  prompt(opts) {
    return new Promise((resolve) => this.pushPage(inputPage(opts, resolve)));
  }

  /** Elige una opción. Devuelve el índice o null. */
  pick(title, options, hint = '') {
    return new Promise((resolve) => this.pushPage(pickPage(title, options, resolve, hint)));
  }

  /** Responde la pregunta de la página superior (pick/prompt) y la quita. */
  answer(value) {
    const p = this.pages.pop();
    const resolve = p?.resolve;
    if (!this.pages.length) this.close(null);
    this.invalidate();
    resolve?.(value);
  }

  /** Cierra el menú entero devolviendo una acción para el mapa (o null). */
  close(action = null) {
    if (this.closing) return;
    super.close(action);
  }

  // ------------------------------------------------------------------ filas
  rows() {
    const p = this.page;
    if (!p || p.input) return [];
    if (!p.cache || p.cache.query !== p.query) {
      let list;
      try {
        list = p.items(this.dev, p.query) || [];
      } catch (err) {
        console.error('[dev] página', err);
        list = [];
        this.status(err.message, 'error');
      }
      p.cache = { query: p.query, list };
      p.index = Math.max(0, Math.min(p.index, list.length - 1));
    }
    return p.cache.list;
  }

  visibleRows() {
    const p = this.page;
    const listH = SCREEN_H - 2 * MARGIN - HEADER_H - FOOTER_H - (p?.search ? SEARCH_H : 0) - 12;
    return Math.max(3, Math.floor(listH / ROW_H));
  }

  move(delta) {
    const p = this.page;
    const n = this.rows().length;
    if (!n) return;
    let i = p.index + delta;
    if (Math.abs(delta) === 1) i = (i + n) % n;
    else i = Math.max(0, Math.min(n - 1, i));
    if (i === p.index) return;
    p.index = i;
    const vis = this.visibleRows();
    if (p.index < p.top) p.top = p.index;
    if (p.index >= p.top + vis) p.top = p.index - vis + 1;
    sfx.cursor();
  }

  async activate() {
    const p = this.page;
    const item = this.rows()[p.index];
    if (!item?.run) { sfx.buzzer(); return; }
    sfx.decision();
    try {
      await item.run(this.dev, item);
    } catch (err) {
      console.error('[dev]', err);
      sfx.buzzer();
      this.status(err.message || String(err), 'error');
    }
    this.invalidate();
  }

  submitInput() {
    const p = this.page;
    const err = p.validate ? p.validate(p.text) : null;
    if (err) { sfx.buzzer(); this.status(err, 'error'); return; }
    sfx.decision();
    this.answer(p.text);
  }

  // ------------------------------------------------------------------ teclado
  handleKey(e) {
    if (engine.scenes.top !== this || this.closing) return;
    const p = this.page;
    if (!p) return;
    const handled = this.keyAction(e, p);
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }

  keyAction(e, p) {
    if (e.code === DEV_KEY) { if (!e.repeat) this.close(null); return true; }
    const typing = p.input || p.search;
    switch (e.key) {
      case 'ArrowUp': if (!p.input) this.move(-1); return true;
      case 'ArrowDown': if (!p.input) this.move(1); return true;
      case 'PageUp': if (!p.input) this.move(-PAGE_JUMP); return true;
      case 'PageDown': if (!p.input) this.move(PAGE_JUMP); return true;
      case 'Home': if (!p.input) this.move(-1e6); return true;
      case 'End': if (!p.input) this.move(1e6); return true;
      case 'Enter': if (!e.repeat) (p.input ? this.submitInput() : this.activate()); return true;
      case 'Escape': if (!e.repeat) { sfx.cancel(); this.pop(); } return true;
      case 'Backspace': this.erase(p); return true;
      default: break;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    if (typing && e.key.length === 1) { this.type(p, e.key); return true; }
    if (!typing && !e.repeat && (e.code === 'KeyZ' || e.code === 'Space')) { this.activate(); return true; }
    if (!typing && !e.repeat && e.code === 'KeyX') { sfx.cancel(); this.pop(); return true; }
    return false;
  }

  type(p, ch) {
    const field = p.input ? 'text' : 'query';
    if (p[field].length >= MAX_QUERY) { sfx.buzzer(); return; }
    p[field] += ch;
    if (!p.input) { p.index = 0; p.top = 0; }
  }

  erase(p) {
    const field = p.input ? 'text' : p.search ? 'query' : null;
    if (!field) { sfx.cancel(); this.pop(); return; }
    if (!p[field]) return;
    p[field] = p[field].slice(0, -1);
    if (!p.input) { p.index = 0; p.top = 0; }
  }

  // ------------------------------------------------------------------ dibujo
  drawUI(g) {
    const p = this.page;
    if (!p) return;
    const skin = menuSkin();
    const b = skinBorders(skin);
    const dark = isDarkSkin(skin);
    const [base, shadow] = messageColors(null, dark);
    this.gray = messageColors(7, dark);
    const x = MARGIN;
    const y = MARGIN;
    const w = SCREEN_W - 2 * MARGIN;
    const h = SCREEN_H - 2 * MARGIN;
    drawWindow(g, skin, x, y, w, h);
    const ix = x + b.left;
    const iw = w - b.left - b.right;
    let cy = y + b.top - 6;
    const crumbs = this.pages.map((pg) => pg.title).filter(Boolean).slice(-2).join(' › ');
    drawText(g, cropText(`Desarrollador · ${crumbs}`, iw), ix, cy, { color: C.blue, shadow: C.blueShadow });
    cy += HEADER_H - 6;
    if (p.input) this.drawInput(g, p, ix, cy, iw, base, shadow);
    else {
      if (p.search) {
        const q = p.query ? `Buscar: ${p.query}_` : 'Buscar: (escribe para filtrar)';
        drawText(g, cropText(q, iw, LIST_FONT), ix, cy, { font: LIST_FONT, color: p.query ? base : this.gray[0], shadow: p.query ? shadow : this.gray[1] });
        cy += SEARCH_H;
      }
      this.drawList(g, p, ix, cy, iw, base, shadow, dark);
    }
    this.drawFooter(g, p, ix, y + h - b.bottom - FOOTER_H + 4, iw, base, shadow);
  }

  drawList(g, p, x, y, w, base, shadow, dark) {
    const rows = this.rows();
    const vis = this.visibleRows();
    p.top = Math.max(0, Math.min(p.top, Math.max(0, rows.length - vis)));
    if (!rows.length) {
      drawText(g, p.empty || (p.query ? 'Nada coincide con la búsqueda.' : 'No hay nada aquí.'), x + 16, y, { font: LIST_FONT, color: this.gray[0], shadow: this.gray[1] });
      return;
    }
    for (let r = 0; r < vis; r++) {
      const i = p.top + r;
      const it = rows[i];
      if (!it) break;
      const ry = y + r * ROW_H;
      const sel = i === p.index;
      if (sel) {
        g.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(24,112,216,0.14)';
        g.fillRect(x + 12, ry + 1, w - 12, ROW_H - 1);
        drawSelArrow(g, x - 6, ry - 6, dark);
      }
      const [cb, cs] = it.color || [base, shadow];
      const valueW = it.value !== undefined ? Math.min(180, w / 2) : 0;
      drawText(g, cropText(it.label, w - 20 - valueW, LIST_FONT), x + 16, ry, { font: LIST_FONT, color: it.run ? cb : this.gray[0], shadow: it.run ? cs : this.gray[1] });
      if (valueW) drawText(g, cropText(String(it.value), valueW, LIST_FONT), x + w - 4, ry, { font: LIST_FONT, color: C.blue, shadow: C.blueShadow, align: 'right' });
    }
    if (p.top > 0) drawScrollArrow(g, 'up', x + w - 30, y - 30, this.t);
    if (p.top + vis < rows.length) drawScrollArrow(g, 'down', x + w - 30, y + vis * ROW_H - 12, this.t);
  }

  drawInput(g, p, x, y, w, base, shadow) {
    if (p.hint) drawText(g, cropText(p.hint, w, LIST_FONT), x, y, { font: LIST_FONT, color: base, shadow });
    const by = y + 34;
    g.fillStyle = 'rgba(24,112,216,0.14)';
    g.fillRect(x, by - 2, w, 32);
    const cursor = Math.floor(this.t / 20) % 2 ? '_' : ' ';
    drawText(g, cropText(`${p.text}${cursor}`, w - 8), x + 6, by, { color: base, shadow });
  }

  drawFooter(g, p, x, y, w, base, shadow) {
    const item = !p.input ? this.rows()[p.index] : null;
    const msgAge = this.t - (this.messageAt ?? -1e9);
    const line1 = this.message && msgAge < 420 ? this.message : item?.hint || p.hint || '';
    const color1 = this.message && msgAge < 420 ? this.messageColor || C.blue : base;
    if (line1) drawText(g, cropText(line1, w, LIST_FONT), x, y, { font: LIST_FONT, color: color1, shadow: this.messageColor ? C.redShadow : shadow });
    const keys = p.input
      ? `Intro aceptar · Esc cancelar · ${DEV_KEY_LABEL} cerrar`
      : `↑↓ mover · RePág/AvPág · Intro elegir · Esc volver${p.search ? ' · escribe para buscar' : ''} · ${DEV_KEY_LABEL} cerrar`;
    drawText(g, cropText(keys, w, 'tiny'), x, y + 20, { font: 'tiny', color: this.gray[0], shadow: null });
  }
}

/** Abre el menú de desarrollador. Devuelve null o una acción { type: 'dev', label, run(ctx) } para el mapa. */
export async function openDevMenu(root, dev) {
  return openScene(new DevMenuScene(root, dev));
}
