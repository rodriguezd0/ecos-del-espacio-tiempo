// Introducir nombre (portado de 026_UI_TextEntry.rb de Añil): teclado en pantalla con 4 pestañas y
// teclado físico. Modo teclado: se escribe directamente (Enter acepta, Esc cancela, flechas → cursor).
// Modo cursor: flechas + A/B; cualquier tecla imprimible no asignada vuelve al modo teclado.
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { drawPokemonIcon, preloadPokemon } from '../core/pokemonGfx.js';
import { COMMON_GFX } from '../core/widgets.js';
import { playSE, SE, sfx } from '../core/sound.js';

const N = (n) => UI(`Naming/${n}.png`);
const COLS = 13;
const ROWS = 5;
const MODES = [-6, -5, -4, -3]; // pestañas
const BACK = -2;
const OK = -1;
const DARK = ['#101820', '#a8b8b8'];

/** Juegos de caracteres (como Añil). Los espacios son huecos vacíos. */
export const CHARSETS = [
  { name: 'MAYÚS', chars: [...('ABCDEFGHIJ ,.' + 'KLMNOPQRST \'-' + 'UVWXYZ     ♂♀' + '             ' + '0123456789   ')] },
  { name: 'minús', chars: [...('abcdefghij ,.' + 'klmnopqrst \'-' + 'uvwxyz     ♂♀' + '             ' + '0123456789   ')] },
  { name: 'acentos', chars: [...('ÀÁÂÄÃàáâäã Ææ' + 'ÈÉÊË èéêë  Çç' + 'ÌÍÎÏ ìíîï  Œœ' + 'ÒÓÔÖÕòóôöõ Ññ' + 'ÙÚÛÜ ùúûü  Ýý')] },
  { name: 'otros', chars: [...(',.:;…•!?¡¿ ♂♀' + '“”‘’()*~_^    ' + '@#&%+-×÷/=    ' + '◎○□△♠♥♦♣★   $' + '             ')].slice(0, 65) },
];

/** Normaliza el resultado: recorta espacios y aplica la longitud máxima. */
export function finalizeName(text, { maxLength = 12, initial = '' } = {}) {
  const t = [...String(text || '')].slice(0, maxLength).join('').trim();
  return t || initial || '';
}

class NamingScene extends ScreenScene {
  constructor(opts) {
    super();
    this.opts = opts;
    this.maxLength = Math.max(1, Math.min(16, opts.maxLength || 12));
    this.text = [...String(opts.initial || '')].slice(0, this.maxLength);
    this.mode = 0;
    this.cursor = 0; // >=0 carácter, o MODES/BACK/OK
    this.keyboard = true; // modo teclado físico
    this.onKey = (e) => this.handleKey(e);
  }

  async enter() {
    const gfx = ['bg', 'overlay_controls', 'overlay_tab_1', 'overlay_tab_2', 'overlay_tab_3', 'overlay_tab_4', 'icon_mode',
      'cursor_1', 'cursor_2', 'cursor_3', 'icon_shadow'].map(N);
    const subject = this.opts.iconSpecies ? [{ species: this.opts.iconSpecies, form: this.opts.iconForm || 0 }] : [];
    await Promise.all([preload([...gfx, ...COMMON_GFX]), preloadPokemon(subject)]);
    window.addEventListener('keydown', this.onKey);
  }

  exit() {
    window.removeEventListener('keydown', this.onKey);
  }

  add(ch) {
    if (this.text.length >= this.maxLength) { sfx.buzzer(); return; }
    this.text = [...this.text, ch];
    sfx.cursor();
  }

  del() {
    if (!this.text.length) return;
    this.text = this.text.slice(0, -1);
    sfx.cancel();
  }

  confirm() {
    playSE(SE.namingConfirm);
    this.finish(finalizeName(this.text.join(''), { maxLength: this.maxLength, initial: this.opts.initial }));
  }

  /** Teclado físico. */
  handleKey(e) {
    this.keyFrame = this.t;
    if (this.phase !== 'active' || (e.repeat && e.key.length !== 1)) return;
    const mapped = engine.input.keymap[e.code];
    if (this.keyboard) {
      if (e.key.startsWith('Arrow')) { this.keyboard = false; return; }
      if (e.key === 'Enter') { this.confirm(); return; }
      if (e.key === 'Backspace') { this.del(); return; }
      if (e.key === 'Escape') { this.del(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this.add(e.key); }
      return;
    }
    if (e.key.length === 1 && !mapped && !e.ctrlKey && !e.metaKey) {
      this.keyboard = true;
      this.add(e.key);
    }
  }

  tick() {
    const inp = this.input;
    if (this.keyboard) {
      // La entrada llega por handleKey; un mando (sin teclas físicas recientes) pasa al modo cursor.
      const recentKey = this.keyFrame !== undefined && this.t - this.keyFrame <= 2;
      if (!recentKey && ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A'].some((b) => inp.pressed(b))) this.keyboard = false;
      return;
    }
    if (inp.pressed('START')) { this.cursor = OK; sfx.cursor(); return; }
    if (inp.pressed('SELECT')) { this.changeTab(this.mode + 1); return; }
    if (inp.pressed('B')) { this.del(); return; }
    if (inp.pressed('A')) { this.activate(); return; }
    this.moveCursor(inp);
  }

  activate() {
    const c = this.cursor;
    if (c === OK) { this.confirm(); return; }
    if (c === BACK) { this.del(); return; }
    if (c < BACK) { this.changeTab(MODES.indexOf(c)); return; }
    const ch = CHARSETS[this.mode].chars[c];
    if (ch && ch !== ' ') this.add(ch);
    else if (ch === ' ' && c % COLS === COLS - 3) this.add(' ');
  }

  changeTab(i) {
    this.mode = ((i % CHARSETS.length) + CHARSETS.length) % CHARSETS.length;
    playSE(SE.namingTab);
  }

  moveCursor(inp) {
    let c = this.cursor;
    const top = [...MODES, BACK, OK];
    if (c < 0) {
      const k = top.indexOf(c);
      if (inp.repeat('LEFT')) c = top[(k - 1 + top.length) % top.length];
      else if (inp.repeat('RIGHT')) c = top[(k + 1) % top.length];
      else if (inp.repeat('DOWN')) c = Math.min(COLS - 1, Math.max(0, k * 2));
      else if (inp.repeat('UP')) c = (ROWS - 1) * COLS + Math.min(COLS - 1, k * 2);
    } else {
      const row = Math.floor(c / COLS);
      const col = c % COLS;
      if (inp.repeat('LEFT')) c = row * COLS + ((col - 1 + COLS) % COLS);
      else if (inp.repeat('RIGHT')) c = row * COLS + ((col + 1) % COLS);
      else if (inp.repeat('UP')) c = row === 0 ? top[Math.min(top.length - 1, Math.floor(col / 2))] : c - COLS;
      else if (inp.repeat('DOWN')) c = row === ROWS - 1 ? top[Math.min(top.length - 1, Math.floor(col / 2))] : c + COLS;
    }
    if (c !== this.cursor) { this.cursor = c; sfx.cursor(); }
  }

  draw(g) {
    blit(g, N('bg'), 0, 0);
    if (this.opts.iconSpecies) {
      blit(g, N('icon_shadow'), 66, 64);
      drawPokemonIcon(g, { species: this.opts.iconSpecies, form: this.opts.iconForm || 0, hp: 1 }, 88, 48, { t: this.t });
    }
    drawText(g, this.opts.title || 'Introduce un nombre.', 160, 18, { color: DARK[0], shadow: DARK[1] });
    if (this.opts.gender === 'M') drawText(g, '♂', 430, 54, { color: '#0080f8', shadow: DARK[1] });
    else if (this.opts.gender === 'F') drawText(g, '♀', 430, 54, { color: '#f81818', shadow: DARK[1] });
    for (let i = 0; i < this.maxLength; i++) {
      const x = 160 + 24 * i;
      const cur = i === this.text.length;
      const y = cur && Math.floor(this.t / 16) % 2 ? 82 : 78;
      g.fillStyle = DARK[1];
      g.fillRect(x + 2, y + 2, 22, 4);
      g.fillStyle = DARK[0];
      g.fillRect(x, y, 22, 4);
      if (this.text[i]) drawText(g, this.text[i], x + 12, 50, { color: DARK[0], shadow: DARK[1], align: 'center' });
    }
    blit(g, N(`overlay_tab_${this.mode + 1}`), 22, 162);
    const chars = CHARSETS[this.mode].chars;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const ch = chars[y * COLS + x];
        if (ch && ch !== ' ') drawText(g, ch, 22 + 44 + x * 32, 162 + 24 + y * 38, { color: DARK[0], shadow: '#a0a0a0', align: 'center' });
      }
    }
    blit(g, N('overlay_controls'), 16, 96);
    blit(g, N('icon_mode'), 44 + this.mode * 62, 120, this.mode * 60, 0, 60, 44);
    if (!this.keyboard) this.drawCursor(g);
    const hint = this.keyboard ? 'Teclado: escribe · Intro: aceptar · Flechas: teclado en pantalla' : 'A: elegir · B: borrar · C: OK · V: pestaña';
    drawText(g, hint, 256, 366, { color: '#e8e0f8', shadow: '#301838', align: 'center', font: 'tiny' });
  }

  drawCursor(g) {
    const c = this.cursor;
    if (c >= 0) blit(g, N('cursor_1'), 52 + 32 * (c % COLS), 180 + 38 * Math.floor(c / COLS));
    else if (c === OK) blit(g, N('cursor_3'), 394, 120);
    else if (c === BACK) blit(g, N('cursor_3'), 314, 120);
    else blit(g, N('cursor_2'), 44 + MODES.indexOf(c) * 62, 120);
  }
}

/** Abre la pantalla de nombre. Devuelve el texto (o `initial` si se deja vacío). */
export async function open(opts = {}) {
  return openScene(new NamingScene(opts));
}
