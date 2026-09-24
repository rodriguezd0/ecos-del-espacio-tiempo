// Menús del combate con los gráficos de Añil (Graphics/UI/Battle): comandos (Luchar/Mochila/Pokémon/Huir),
// movimientos (botón por tipo, PP, tipo y categoría, descripción opcional con C, Megaevolución con E)
// y selección de objetivo en dobles. Cada menú se abre con open(...) → Promise del resultado.
import { engine } from '../../../core/engine.js';
import { UI, blit } from '../../../ui/core/images.js';
import { drawText, wrapLines, cropText, drawParagraph } from '../../../ui/core/text.js';
import { ppColors } from '../../../ui/core/colors.js';
import { playSE, SE } from '../../../ui/core/sound.js';
import { commandButton, moveButton, gridMove, targetButtons, MESSAGE_Y, SCREEN_W } from '../layout.js';

const B = (n) => UI(`Battle/${n}.png`);
export const MENU_GFX = [
  'overlay_command', 'overlay_fight', 'cursor_command', 'cursor_fight', 'cursor_target', 'cursor_mega',
].map(B).concat([UI('types.png'), UI('category.png')]);

const WHITE = '#ffffff';
const SHADOW = '#4b4b4b';
const TARGET_TEXT = ['#f0f8e0', '#404040'];
const CMD_ROWS = { normal: [0, 2, 1, 3], cancel: [0, 2, 1, 9] };
const CATEGORY_NAME = { Physical: 'Físico', Special: 'Especial', Status: 'Estado' };

class Menu {
  constructor() {
    this.active = false;
    this.resolve = null;
    this.t = 0;
  }

  begin() {
    this.active = true;
    this.t = 0;
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  finish(value) {
    this.active = false;
    const r = this.resolve;
    this.resolve = null;
    if (r) r(value);
  }
}

export class CommandMenu extends Menu {
  constructor() {
    super();
    this.index = 0;
    this.lastIndex = {};
  }

  /** @param {{ name: string, battlerIndex: number, cancelMode: boolean }} p → 0 luchar, 1 mochila, 2 pokémon, 3 huir/atrás */
  open(p) {
    this.p = p;
    this.rows = p.cancelMode ? CMD_ROWS.cancel : CMD_ROWS.normal;
    this.index = this.lastIndex[p.battlerIndex] ?? 0;
    this.lines = wrapLines(`¿Qué hará ${p.name}?`, 216);
    return this.begin();
  }

  update(input) {
    if (!this.active) return;
    this.t += 1;
    for (const d of ['LEFT', 'RIGHT', 'UP', 'DOWN']) {
      if (input.repeat(d)) {
        const n = gridMove(this.index, d);
        if (n !== this.index) { this.index = n; playSE(SE.cursor); }
      }
    }
    if (input.pressed('A')) {
      playSE(SE.decision);
      this.lastIndex[this.p.battlerIndex] = this.index;
      this.finish(this.index);
    } else if (input.pressed('B')) {
      if (this.p.cancelMode) { playSE(SE.cancel); this.finish(3); } else if (this.index !== 3) { this.index = 3; playSE(SE.cursor); }
    }
  }

  draw(g) {
    if (!this.active) return;
    blit(g, B('overlay_command'), 0, MESSAGE_Y);
    this.lines.slice(0, 2).forEach((line, i) => drawText(g, line, 28, MESSAGE_Y + 14 + i * 32, { color: WHITE, shadow: SHADOW }));
    for (let i = 0; i < 4; i++) {
      const b = commandButton(i);
      blit(g, B('cursor_command'), b.x, b.y, i === this.index ? 130 : 0, this.rows[i] * 46, 130, 46);
    }
  }
}

export class FightMenu extends Menu {
  constructor() {
    super();
    this.index = 0;
    this.lastIndex = {};
    this.mega = false;
    this.info = false;
  }

  /** @param {{ battlerIndex, moves: object[], canMega: boolean }} p → { index, mega } | null */
  open(p) {
    this.p = p;
    this.moves = p.moves;
    this.index = Math.min(this.lastIndex[p.battlerIndex] ?? 0, Math.max(0, this.moves.length - 1));
    this.mega = false;
    this.info = false;
    return this.begin();
  }

  update(input) {
    if (!this.active) return;
    this.t += 1;
    const valid = (i) => i >= 0 && i < this.moves.length;
    for (const d of ['LEFT', 'RIGHT', 'UP', 'DOWN']) {
      if (input.repeat(d)) {
        const n = gridMove(this.index, d, valid);
        if (n !== this.index) { this.index = n; playSE(SE.cursor); }
      }
    }
    if (input.pressed('R') && this.p.canMega) { this.mega = !this.mega; playSE(SE.decision); }
    if (input.pressed('START')) { this.info = !this.info; playSE(SE.cursor); }
    if (input.pressed('A') && this.moves[this.index]) {
      playSE(SE.decision);
      this.lastIndex[this.p.battlerIndex] = this.index;
      this.finish({ index: this.moves[this.index].index, mega: this.p.canMega && this.mega });
    } else if (input.pressed('B')) {
      playSE(SE.cancel);
      this.finish(null);
    }
  }

  draw(g) {
    if (!this.active) return;
    const types = engine.data?.types || {};
    blit(g, B('overlay_fight'), 0, MESSAGE_Y);
    this.moves.forEach((m, i) => {
      const b = moveButton(i);
      const row = types[m.type]?.icon ?? 0;
      blit(g, B('cursor_fight'), b.x, b.y, i === this.index ? 192 : 0, row * 46, 192, 46);
      const color = m.selectable === false ? '#b0b0b0' : WHITE;
      drawText(g, cropText(m.name, 170, 'narrow'), b.x + 96, b.y + 8, { color, shadow: SHADOW, align: 'center', font: 'narrow' });
    });
    const m = this.moves[this.index];
    if (m) {
      const row = types[m.type]?.icon ?? 0;
      blit(g, UI('types.png'), 416, MESSAGE_Y + 8, 0, row * 28, 64, 28);
      const cat = { Physical: 0, Special: 1, Status: 2 }[m.category] ?? 2;
      blit(g, UI('category.png'), 416, MESSAGE_Y + 34, 0, cat * 28, 64, 28);
      if (m.totalPP > 0) {
        const [c, s] = m.pp === 0 ? ppColors(0, m.totalPP) : ppColors(m.pp, m.totalPP);
        const dark = c === '#404040';
        drawText(g, `PP ${m.pp}/${m.totalPP}`, 448, MESSAGE_Y + 60, { color: dark ? WHITE : c, shadow: dark ? SHADOW : s, align: 'center', font: 'narrow' });
      }
    }
    if (this.p.canMega) {
      blit(g, B('cursor_mega'), 120, MESSAGE_Y - 46, 0, this.mega ? 46 : 0, 150, 46);
      drawText(g, 'E', 262, MESSAGE_Y - 36, { color: WHITE, shadow: SHADOW, font: 'small' });
    }
    if (this.info && m) this.drawInfo(g, m);
    else drawText(g, 'C: información', SCREEN_W - 6, MESSAGE_Y - 13, { color: WHITE, shadow: SHADOW, font: 'tiny', align: 'right' });
  }

  drawInfo(g, m) {
    const data = engine.data?.moves?.[m.id] || {};
    const y0 = 118;
    g.save();
    g.fillStyle = 'rgba(24,26,34,0.88)';
    g.fillRect(8, y0, SCREEN_W - 16, MESSAGE_Y - y0 - 6);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(8, y0, SCREEN_W - 16, 2);
    g.restore();
    const pw = m.power > 1 ? String(m.power) : '—';
    const acc = m.accuracy > 0 ? `${m.accuracy}%` : '—';
    drawText(g, m.name, 20, y0 + 6, { color: WHITE, shadow: SHADOW });
    drawText(g, `${CATEGORY_NAME[m.category] || ''}  ·  Potencia ${pw}  ·  Precisión ${acc}`, 20, y0 + 36, { color: '#d8e8ff', shadow: SHADOW, font: 'narrow' });
    drawParagraph(g, data.description || 'Sin descripción.', 20, y0 + 70, SCREEN_W - 44, { color: WHITE, shadow: SHADOW, maxLines: 3, lineHeight: 28 });
  }
}

export class TargetMenu extends Menu {
  /**
   * @param {{ sideSizes: number[], candidates: {index:number, battler:object}[], names: Object<number,string>, initial?: number }} p
   * → índice del combatiente elegido o -1
   */
  open(p) {
    this.p = p;
    this.buttons = targetButtons(p.sideSizes);
    this.valid = new Set(p.candidates.map((c) => c.index));
    const firstFoe = p.candidates.find((c) => c.index % 2 === 1);
    this.index = this.valid.has(p.initial) ? p.initial : (firstFoe || p.candidates[0] || { index: -1 }).index;
    return this.begin();
  }

  get current() {
    return this.active ? this.index : -1;
  }

  move(dir) {
    const cur = this.buttons.find((b) => b.index === this.index);
    if (!cur) return;
    const opts = this.buttons.filter((b) => this.valid.has(b.index) && b.index !== this.index);
    let best = null;
    let bestScore = Infinity;
    for (const b of opts) {
      const dx = b.x - cur.x;
      const dy = b.y - cur.y;
      const ok = (dir === 'LEFT' && dx < 0) || (dir === 'RIGHT' && dx > 0) || (dir === 'UP' && dy < 0) || (dir === 'DOWN' && dy > 0);
      if (!ok) continue;
      const score = (dir === 'LEFT' || dir === 'RIGHT') ? Math.abs(dx) + Math.abs(dy) * 4 : Math.abs(dy) + Math.abs(dx) * 0.5;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    if (best) { this.index = best.index; playSE(SE.cursor); }
  }

  update(input) {
    if (!this.active) return;
    this.t += 1;
    for (const d of ['LEFT', 'RIGHT', 'UP', 'DOWN']) if (input.repeat(d)) this.move(d);
    if (input.pressed('A')) { playSE(SE.decision); this.finish(this.index); } else if (input.pressed('B')) { playSE(SE.cancel); this.finish(-1); }
  }

  draw(g) {
    if (!this.active) return;
    blit(g, B('overlay_command'), 0, MESSAGE_Y);
    for (const b of this.buttons) {
      const has = this.valid.has(b.index);
      let type = 0;
      if (has) type = b.index % 2 === 0 ? 1 : 2;
      const row = type * 2 + (b.small ? 1 : 0);
      const sel = has && b.index === this.index;
      blit(g, B('cursor_target'), b.x, b.y, sel ? 236 : 0, row * 46, b.small ? 170 : 236, 46);
      const name = this.p.names[b.index];
      if (has && name) drawText(g, cropText(name, b.w - 24, 'narrow'), b.x + b.w / 2, b.y + 8, { color: TARGET_TEXT[0], shadow: TARGET_TEXT[1], align: 'center', font: 'narrow' });
    }
  }
}
