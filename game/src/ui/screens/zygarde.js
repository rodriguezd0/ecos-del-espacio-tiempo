// Pantalla de Zygarde / Arca de Zygarde (docs/CAMPANA.md §2.1, §2.7; X15): forma actual, contador de células
// (100) y núcleos (5), formas desbloqueadas (el Arca permite cambiar entre ellas) y capacidades con iconos.
// Sin umbrales numéricos en las capacidades ni en el mundo (§1.1). Devuelve una acción para el mapa:
// { type: 'zygarde', action: 'fly' } | { type: 'zygarde', action: 'formChanged', form } | null.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { img, preload } from '../core/images.js';
import { drawText, textWidth } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawPokemonSprite, preloadPokemon } from '../core/pokemonGfx.js';
import { drawHexOutline, drawHexFilled } from '../message/messageBox.js';
import { sfx } from '../core/sound.js';
import { message } from './common.js';
import { getCharacter, frameRect } from '../../content/characters.js';
import { FORMS } from '../../content/zygarde/thresholds.js';
import { FIELD_TEXT } from '../../content/zygarde/texts.js';
import { zygardeSummary, canChooseForm, setForm } from '../../world/zygarde/progression.js';

const GREEN = { color: C.core, shadow: C.coreShadow };
const DIM = { color: '#5f7a55', shadow: '#0c1a10' };
const COLS = 3;
const CAP_X = 14;
const CAP_Y = 258;
const CAP_W = 164;
const CAP_H = 22;
const FORM_X = 34;
const FORM_Y = 214;
const FORM_STEP = 44;
/** Tamaño del sprite de frente por forma (Graphics/Pokemon/Front/ZYGARDE[_n].png: 92, 69 y 127 px). */
const FIGURE_SCALE = { 10: 1.6, 50: 1.3, complete: 1.05 };

// ------------------------------------------------------------ iconos de capacidades (vectoriales)
function line(g, pts) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke();
}

const ICONS = {
  run: (g) => { line(g, [-8, -4, -2, -4]); line(g, [-9, 0, -1, 0]); line(g, [-8, 4, -2, 4]); line(g, [2, -6, 8, 0, 2, 6]); },
  ram: (g) => { g.beginPath(); g.arc(0, 1, 7, 0, Math.PI * 2); g.stroke(); line(g, [-1, -6, 2, -1, -2, 2, 1, 7]); },
  terrain: (g) => { g.beginPath(); g.ellipse(-4, 2, 2.5, 4.5, -0.3, 0, Math.PI * 2); g.ellipse(4, -2, 2.5, 4.5, 0.3, 0, Math.PI * 2); g.stroke(); line(g, [-9, 8, 9, 8]); },
  climb: (g) => { line(g, [-6, -8, -6, 8]); line(g, [2, 6, 2, -6]); line(g, [-2, -2, 2, -7, 6, -2]); },
  swim: (g) => { for (const y of [-3, 3]) line(g, [-8, y, -4, y - 3, 0, y, 4, y - 3, 8, y]); },
  detect: (g) => { for (const r of [3, 6, 9]) { g.beginPath(); g.arc(-4, 4, r, -Math.PI / 2, 0); g.stroke(); } g.fillRect(-5, 3, 2, 2); },
  dive: (g) => { for (const [x, y, r] of [[-4, -5, 2.5], [2, -1, 2], [-2, 4, 1.5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); } line(g, [5, 2, 5, 8]); line(g, [2, 5, 5, 8, 8, 5]); },
  fly: (g) => { for (const [x, y, r] of [[-4, 2, 4], [4, -3, 3], [5, 5, 2]]) drawHexOutline(g, x, y, r, g.strokeStyle, 1, 1.5); },
  rebuild: (g) => { g.strokeRect(-8, 3, 7, 5); g.strokeRect(1, 3, 7, 5); g.strokeRect(-4, -3, 8, 5); line(g, [0, -5, 0, -9]); },
  jump: (g) => { drawHexOutline(g, 0, 3, 5, g.strokeStyle, 1, 1.5); line(g, [0, 6, 0, -8]); line(g, [-4, -4, 0, -8, 4, -4]); },
  anchor: (g) => { g.beginPath(); g.arc(0, -6, 2, 0, Math.PI * 2); g.stroke(); line(g, [0, -4, 0, 8]); line(g, [-4, -1, 4, -1]); g.beginPath(); g.arc(0, 2, 6, 0.2, Math.PI - 0.2); g.stroke(); },
};

function drawIcon(g, key, cx, cy, color) {
  g.save();
  g.translate(Math.round(cx) + 0.5, Math.round(cy) + 0.5);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 2;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  (ICONS[key] || ICONS.detect)(g);
  g.restore();
}

// ------------------------------------------------------------ escena
class ZygardeScene extends ScreenScene {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.focus = 'caps';
    this.formIndex = 0;
    this.capIndex = 0;
    this.busy = false;
    this.formChanged = null;
  }

  async enter() {
    this.refresh();
    this.formIndex = Math.max(0, this.info.forms.findIndex((f) => f.current));
    this.core = getCharacter('zygarde_core');
    await Promise.all([
      preloadPokemon([0, 1, 2].map((form) => ({ species: 'ZYGARDE', form })), { sprites: true }),
      preload([this.core?.file].filter(Boolean)),
    ]);
  }

  refresh() {
    this.info = zygardeSummary(engine.state);
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    if (inp.pressed('B')) { sfx.cancel(); this.exitScreen(); return; }
    if (this.focus === 'forms') this.tickForms(inp);
    else this.tickCaps(inp);
  }

  exitScreen() {
    this.finish(this.formChanged ? { type: 'zygarde', action: 'formChanged', form: this.formChanged } : null);
  }

  tickForms(inp) {
    const n = this.info.forms.length;
    if (inp.repeat('LEFT')) { this.formIndex = (this.formIndex - 1 + n) % n; sfx.cursor(); }
    else if (inp.repeat('RIGHT')) { this.formIndex = (this.formIndex + 1) % n; sfx.cursor(); }
    else if (inp.repeat('DOWN') || inp.repeat('UP')) { this.focus = 'caps'; sfx.cursor(); }
    else if (inp.pressed('A')) this.run(() => this.chooseForm(this.info.forms[this.formIndex]));
  }

  tickCaps(inp) {
    const n = this.info.capabilities.length;
    const i = this.capIndex;
    if (inp.repeat('LEFT') && i % COLS > 0) { this.capIndex -= 1; sfx.cursor(); }
    else if (inp.repeat('RIGHT') && i % COLS < COLS - 1 && i + 1 < n) { this.capIndex += 1; sfx.cursor(); }
    else if (inp.repeat('DOWN') && i + COLS < n) { this.capIndex += COLS; sfx.cursor(); }
    else if (inp.repeat('UP')) {
      if (i >= COLS) this.capIndex -= COLS;
      else this.focus = 'forms';
      sfx.cursor();
    } else if (inp.pressed('A')) this.run(() => this.chooseCap(this.info.capabilities[i]));
  }

  run(fn) {
    this.busy = true;
    Promise.resolve().then(fn).catch((err) => engine.reportError(err)).finally(() => { this.busy = false; this.refresh(); });
  }

  async chooseForm(f) {
    const st = engine.state;
    if (!f.unlocked) { sfx.buzzer(); await message('Zygarde aún no puede adoptar esa forma.'); return; }
    if (f.current) { sfx.buzzer(); return; }
    if (!canChooseForm(st, f.key)) { sfx.buzzer(); await message(FIELD_TEXT.noArca); return; }
    sfx.decision();
    setForm(st, f.key);
    this.formChanged = f.key;
    await message(FIELD_TEXT.formChanged(FORMS[f.key].name));
  }

  async chooseCap(c) {
    if (!c) return;
    if (c.key === 'fly' && c.unlocked) {
      sfx.decision();
      this.finish({ type: 'zygarde', action: 'fly' });
      return;
    }
    sfx.decision();
    await message(c.unlocked ? `${c.name}: ${c.desc}` : (c.pending ? 'Zygarde siente que le faltan partes.' : 'Zygarde aún no lo recuerda.'));
  }

  // ------------------------------------------------------------ dibujo
  draw(g) {
    const i = this.info;
    g.fillStyle = '#07100c';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    for (let y = 0; y < SCREEN_H + 20; y += 26) {
      for (let x = (y / 26) % 2 ? 15 : 0; x < SCREEN_W + 20; x += 30) drawHexOutline(g, x, y, 9, C.coreEdge, 0.14);
    }
    drawText(g, this.info.hasArca ? 'ARCA DE ZYGARDE' : 'ZYGARDE', 20, 6, GREEN);
    drawText(g, i.formName, SCREEN_W - 20, 6, { ...GREEN, align: 'right' });
    g.fillStyle = C.coreEdge;
    g.fillRect(14, 40, SCREEN_W - 28, 2);
    this.drawFigurePanel(g);
    this.drawForms(g);
    this.drawCells(g);
    this.drawCores(g);
    g.fillStyle = C.coreEdge;
    g.fillRect(14, 250, SCREEN_W - 28, 2);
    this.drawCaps(g);
    this.drawHelp(g);
  }

  drawFigurePanel(g) {
    g.fillStyle = 'rgba(12, 30, 18, 0.9)';
    g.fillRect(16, 48, 168, 148);
    g.strokeStyle = C.coreEdge;
    g.lineWidth = 2;
    g.strokeRect(16, 48, 168, 148);
    const form = this.info.form;
    const cx = 100;
    const cy = 124;
    drawHexOutline(g, cx, cy + 6, 58 + Math.sin(this.t / 30) * 2, C.core, 0.18, 2);
    if (form && FORMS[form]?.speciesForm !== null && FORMS[form]) {
      drawPokemonSprite(g, { species: 'ZYGARDE', form: FORMS[form].speciesForm }, cx, cy, { t: this.t, scale: FIGURE_SCALE[form] || 1 });
      return;
    }
    const ch = this.core;
    const im = ch ? img(ch.file) : null;
    if (im && form === 'core') {
      const r = frameRect(ch, 2, Math.floor(this.t / 12) % 4, im.width, im.height);
      g.drawImage(im, r.x, r.y, r.w, r.h, cx - r.w, cy + 44 - r.h * 2, r.w * 2, r.h * 2);
      return;
    }
    drawText(g, '?', cx, cy - 14, { color: C.core, shadow: C.coreShadow, align: 'center' });
  }

  drawForms(g) {
    this.info.forms.forEach((f, k) => {
      const x = FORM_X + k * FORM_STEP;
      const sel = this.focus === 'forms' && k === this.formIndex;
      if (sel) drawHexOutline(g, x, FORM_Y, 20 + Math.sin(this.t / 6), '#ffffff', 0.85, 2);
      if (f.current) drawHexFilled(g, x, FORM_Y, 15, C.core, 0.85);
      drawHexOutline(g, x, FORM_Y, 15, f.unlocked ? C.core : '#2c4a2a', 1, 2);
      if (!f.unlocked) drawText(g, '?', x, FORM_Y - 11, { ...DIM, align: 'center', font: 'small' });
      drawText(g, f.unlocked ? f.name : '???', x, FORM_Y + 18, { ...(f.unlocked ? GREEN : DIM), align: 'center', font: 'tiny' });
    });
  }

  drawCells(g) {
    const i = this.info;
    drawText(g, 'Células', 202, 46, GREEN);
    drawText(g, `${i.cells}/${i.totalCells}`, 494, 46, { ...GREEN, align: 'right' });
    for (let k = 0; k < i.totalCells; k++) {
      const row = Math.floor(k / 20);
      const cx = 212 + (k % 20) * 14 + (row % 2 ? 7 : 0);
      const cy = 88 + row * 12;
      if (k < i.cells) drawHexFilled(g, cx, cy, 5, C.core, 0.72 + 0.28 * Math.sin(this.t / 30 + k));
      else drawHexFilled(g, cx, cy, 5, '#1c3020', 1);
    }
  }

  drawCores(g) {
    const i = this.info;
    drawText(g, 'Núcleos', 202, 150, GREEN);
    drawText(g, `${i.coreCount}/${i.cores.length}`, 494, 150, { ...GREEN, align: 'right' });
    i.cores.forEach((c, k) => {
      const x = 226 + k * 58;
      const y = 204;
      drawHexOutline(g, x, y, 16, c.have ? C.core : '#2c4a2a', 1, 2);
      if (c.have) drawHexFilled(g, x, y, 9, C.core, 0.6 + 0.4 * Math.sin(this.t / 25 + k));
      drawText(g, c.id, x, y + 18, { ...(c.have ? GREEN : DIM), align: 'center', font: 'tiny' });
    });
  }

  drawCaps(g) {
    this.info.capabilities.forEach((c, k) => {
      const x = CAP_X + (k % COLS) * CAP_W;
      const y = CAP_Y + Math.floor(k / COLS) * CAP_H;
      const sel = this.focus === 'caps' && k === this.capIndex;
      if (sel) {
        g.fillStyle = 'rgba(185, 255, 102, 0.16)';
        g.fillRect(x - 2, y, CAP_W - 6, CAP_H - 1);
        g.strokeStyle = C.core;
        g.lineWidth = 1;
        g.strokeRect(x - 1.5, y + 0.5, CAP_W - 7, CAP_H - 2);
      }
      const color = c.unlocked ? C.core : '#3d5a36';
      if (c.pending) drawHexOutline(g, x + 11, y + 11, 10 + Math.sin(this.t / 8) * 1.5, C.core, 0.6, 1);
      if (c.unlocked) drawIcon(g, c.key, x + 11, y + 11, color);
      else {
        drawHexOutline(g, x + 11, y + 11, 8, color, 1, 2);
        drawText(g, '?', x + 11, y + 3, { ...DIM, align: 'center', font: 'tiny' });
      }
      drawText(g, c.unlocked ? c.short : '???', x + 26, y + 1, { ...(c.unlocked ? GREEN : DIM), font: 'small' });
    });
  }

  drawHelp(g) {
    g.fillStyle = 'rgba(4, 12, 8, 0.9)';
    g.fillRect(0, 350, SCREEN_W, SCREEN_H - 350);
    let text;
    if (this.focus === 'forms') {
      const f = this.info.forms[this.formIndex];
      text = !f?.unlocked ? 'Forma aún no recuperada.' : (this.info.hasArca ? 'A: adoptar esta forma' : 'Hace falta el Arca para cambiar de forma.');
    } else {
      const c = this.info.capabilities[this.capIndex];
      if (!c) text = '';
      else if (c.key === 'fly' && c.unlocked) text = `${c.name}. A: volar a un lugar visitado.`;
      else text = c.unlocked ? `${c.name}. ${c.desc}` : (c.pending ? 'Zygarde siente que le faltan partes.' : 'Zygarde aún no lo recuerda.');
    }
    const font = textWidth(text, 'small') > SCREEN_W - 28 ? 'tiny' : 'small';
    drawText(g, text, 14, font === 'small' ? 354 : 358, { color: '#d8f0c8', shadow: '#0a1a10', font });
  }
}

/** Abre la pantalla de Zygarde (opts.arca: abierta desde el Arca de la Mochila). */
export async function open(opts = {}) {
  if (!engine.state) throw new Error('No hay partida en curso.');
  return openScene(new ZygardeScene(opts));
}
