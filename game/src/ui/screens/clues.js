// Libreta de pistas (objeto clave CLUENOTEBOOK): lista las pistas anotadas en la partida
// (GameState.addClue / solveClue). Solo muestra lo que el contenido haya anotado; sin textos propios de trama.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { preload } from '../core/images.js';
import { drawText, wrapLines } from '../core/text.js';
import { drawWindow, isDarkSkin, skinBorders, preloadSkins } from '../core/windowskin.js';
import { messageColors } from '../core/colors.js';
import { menuSkin } from '../core/options.js';
import { drawScrollArrow, COMMON_GFX } from '../core/widgets.js';
import { sfx } from '../core/sound.js';

const LINE_H = 32;
const TOP = 56;
const SOLVED = ['#8c8c8c', '#d0d0d0'];

/** Líneas a dibujar (pura): cada pista envuelta al ancho, con separación entre pistas. */
export function clueLines(clues, width, wrap = wrapLines) {
  const out = [];
  clues.forEach((c, i) => {
    if (i > 0) out.push({ text: '', solved: false });
    for (const row of wrap(`${c.solved ? '(Resuelta) ' : '· '}${c.text}`, width)) out.push({ text: row, solved: Boolean(c.solved) });
  });
  return out;
}

class CluesScene extends ScreenScene {
  async enter() {
    this.scroll = 0;
    await Promise.all([preloadSkins(), preload(COMMON_GFX)]);
    const b = skinBorders(menuSkin());
    this.lines = clueLines(engine.state.clues || [], SCREEN_W - b.left - b.right - 24);
  }

  get visibleRows() {
    const b = skinBorders(menuSkin());
    return Math.floor((SCREEN_H - TOP - b.top - b.bottom) / LINE_H);
  }

  tick() {
    const inp = this.input;
    const maxScroll = Math.max(0, this.lines.length - this.visibleRows);
    if (inp.repeat('UP') && this.scroll > 0) { this.scroll -= 1; sfx.cursor(); }
    else if (inp.repeat('DOWN') && this.scroll < maxScroll) { this.scroll += 1; sfx.cursor(); }
    else if (inp.pressed('B') || inp.pressed('A')) { sfx.cancel(); this.finish(); }
  }

  draw(g) {
    g.fillStyle = '#d8d0b8';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const skin = menuSkin();
    const b = skinBorders(skin);
    const [base, shadow] = messageColors(null, isDarkSkin(skin));
    drawWindow(g, skin, 0, -16, SCREEN_W, TOP + 8);
    drawText(g, 'Libreta de pistas', b.left + 4, 8, { color: base, shadow });
    drawWindow(g, skin, 0, TOP, SCREEN_W, SCREEN_H - TOP);
    if (!this.lines.length) {
      drawText(g, 'Todavía no has anotado ninguna pista.', SCREEN_W / 2, TOP + 120, { color: base, shadow, align: 'center' });
      return;
    }
    const rows = this.lines.slice(this.scroll, this.scroll + this.visibleRows);
    rows.forEach((l, i) => {
      const col = l.solved ? SOLVED : [base, shadow];
      drawText(g, l.text, b.left + 12, TOP + b.top - 2 + i * LINE_H, { color: col[0], shadow: col[1] });
    });
    if (this.scroll > 0) drawScrollArrow(g, 'up', SCREEN_W - 44, TOP - 4, this.t);
    if (this.scroll + this.visibleRows < this.lines.length) drawScrollArrow(g, 'down', SCREEN_W - 44, SCREEN_H - 44, this.t);
  }
}

/** Abre la Libreta de pistas. */
export async function open() {
  if (!engine.state) throw new Error('No hay partida en curso.');
  return openScene(new CluesScene());
}
