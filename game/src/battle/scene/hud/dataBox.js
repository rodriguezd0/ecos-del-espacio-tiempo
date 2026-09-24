// Cajas de datos de los combatientes (PokemonDataBox de Añil): nombre, nivel, género, estado,
// barra de PS animada por colores, PS numéricos (jugador) o porcentaje (rival), barra de EXP.
import { UI, blit, img } from '../../../ui/core/images.js';
import { drawText, textWidth, cropText } from '../../../ui/core/text.js';
import { dataBoxLayout } from '../layout.js';
import { hpColorZone, hpBarWidth } from './bars.js';

const B = (n) => UI(`Battle/${n}.png`);
export const DATABOX_GFX = [
  'databox_normal', 'databox_normal_foe', 'databox_thin', 'databox_thin_foe', 'overlay_hp', 'overlay_exp',
  'icon_numbers', 'icon_statuses', 'icon_own', 'icon_mega',
].map(B).concat([UI('shiny.png')]);

const NAME_BASE = '#ffffff';
const NAME_SHADOW = '#4b4b4b';
const MALE = ['#3060d8', '#4b4b4b'];
const FEMALE = ['#f85828', '#4b4b4b'];
const STATUS_ROW = { SLEEP: 0, POISON: 1, BURN: 2, PARALYSIS: 3, FROZEN: 4, FROSTBITE: 4, TOXIC: 5 };
const EXP_FLASH = 12;

function drawNumber(g, n, x, y, align = 'left') {
  const im = img(B('icon_numbers'));
  if (!im) return;
  const cw = im.width / 12;
  const digits = n === -1 ? [10] : n === -2 ? [11] : String(Math.max(0, Math.floor(n))).split('').map(Number);
  let cx = align === 'right' ? x - cw * digits.length : x;
  for (const d of digits) {
    g.drawImage(im, d * cw, 0, cw, im.height, cx, y, cw, im.height);
    cx += cw;
  }
}

export class DataBox {
  constructor(index, sideSize) {
    this.index = index;
    this.sideSize = sideSize;
    this.layout = dataBoxLayout(index, sideSize);
    this.view = null;
    this.visible = false;
    this.displayHp = 0;
    this.hpAnim = null;
    this.expFrac = 0;
    this.expAnim = null;
    this.offX = 0;
    this.selected = false;
    this.flash = 0;
    this.owned = false;
  }

  /** Datos nuevos (sin animar los PS salvo que se indique). */
  setView(view, { keepHp = false } = {}) {
    this.view = view;
    if (!keepHp || !this.hpAnim) this.displayHp = view.hp;
  }

  /** Anima los PS mostrados de `from` a `to` en `frames` (la promesa la gestiona la escena). */
  startHp(from, to, frames) {
    this.hpAnim = { from, to, frames: Math.max(1, frames), t: 0 };
    this.displayHp = from;
  }

  /** Anima la EXP de la fracción `from` a `to` (0..1). */
  startExp(from, to, frames) {
    this.expAnim = { from, to, frames: Math.max(1, frames), t: 0 };
    this.expFrac = from;
  }

  get animating() {
    return Boolean(this.hpAnim || this.expAnim);
  }

  update() {
    if (this.hpAnim) {
      const a = this.hpAnim;
      a.t += 1;
      this.displayHp = Math.round(a.from + (a.to - a.from) * Math.min(1, a.t / a.frames));
      if (a.t >= a.frames) { this.displayHp = a.to; this.hpAnim = null; }
    }
    if (this.expAnim) {
      const a = this.expAnim;
      a.t += 1;
      this.expFrac = a.from + (a.to - a.from) * Math.min(1, a.t / a.frames);
      if (a.t >= a.frames) {
        this.expFrac = a.to;
        this.expAnim = null;
        if (a.to >= 1) this.flash = EXP_FLASH;
      }
    }
    if (this.flash > 0) this.flash -= 1;
  }

  draw(g, frame) {
    const v = this.view;
    if (!this.visible || !v) return;
    const L = this.layout;
    let x = L.x + this.offX;
    let y = L.y;
    if (this.selected) {
      const ph = Math.floor(((frame % 36) / 36) * 4);
      y += ph === 1 ? -2 : ph === 3 ? 2 : 0;
    }
    x = Math.round(x);
    const player = (this.index & 1) === 0;
    const bg = L.thin ? (player ? 'databox_thin' : 'databox_thin_foe') : (player ? 'databox_normal' : 'databox_normal_foe');
    blit(g, B(bg), x, y);
    const bx = x + L.baseX;
    // Nombre, género y nivel: el nivel se alinea a la derecha y el nombre usa la fuente estrecha si no cabe
    const lvText = `Nv.${v.level}`;
    const lvRight = bx + 204;
    const lvW = textWidth(lvText);
    drawText(g, lvText, lvRight, y + 12, { color: NAME_BASE, shadow: NAME_SHADOW, outline: true, align: 'right' });
    let limit = lvRight - lvW - 6;
    if (v.gender === 'M' || v.gender === 'F') {
      const [c, s] = v.gender === 'M' ? MALE : FEMALE;
      limit -= 16;
      drawText(g, v.gender === 'M' ? '♂' : '♀', limit + 2, y + 12, { color: c, shadow: s });
    }
    const maxName = limit - (bx + 8) - 2;
    const font = textWidth(v.name) > maxName ? 'narrow' : 'system';
    drawText(g, cropText(v.name, maxName, font), bx + 8, y + 12, { color: NAME_BASE, shadow: NAME_SHADOW, outline: true, font });
    // Iconos
    const st = v.status === 'POISON' && v.toxic ? 'TOXIC' : v.status;
    if (STATUS_ROW[st] !== undefined) blit(g, B('icon_statuses'), bx + 24, y + 36, 0, STATUS_ROW[st] * 16, 44, 16);
    if (v.mega) blit(g, B('icon_mega'), bx + 8, y + 34);
    else if (!player && this.owned) blit(g, B('icon_own'), bx + 8, y + 36);
    if (v.shiny) blit(g, UI('shiny.png'), bx + (player ? -6 + 12 : 206 - 6), y + 36);
    // Barra de PS
    const hp = Math.max(0, Math.min(v.totalhp, this.displayHp));
    const w = hpBarWidth(hp, v.totalhp);
    if (w > 0) blit(g, B('overlay_hp'), bx + 102, y + 40, 0, hpColorZone(hp, v.totalhp) * 6, w, 6);
    if (L.showNumbers) {
      drawNumber(g, hp, bx + 80 + 54, y + 52 + 2, 'right');
      drawNumber(g, -1, bx + 80 + 54, y + 52 + 2);
      drawNumber(g, v.totalhp, bx + 80 + 70, y + 52 + 2);
    } else if (L.showPercent) {
      const pct = v.totalhp > 0 ? Math.ceil((hp / v.totalhp) * 100) : 0;
      drawNumber(g, pct, bx + 130 + 54, y + 52 + 2, 'right');
      drawNumber(g, -2, bx + 130 + 54, y + 52 + 2);
    }
    if (L.showExp) {
      const ew = Math.round((Math.max(0, Math.min(1, this.expFrac)) * 192) / 2) * 2;
      if (ew > 0) blit(g, B('overlay_exp'), bx + 6, y + 74, 0, 0, ew, 4);
    }
    if (this.flash > 0) {
      g.save();
      g.globalAlpha = (this.flash / EXP_FLASH) * 0.75;
      g.fillStyle = 'rgb(64,200,248)';
      g.fillRect(x + L.baseX, y + 30, 230, L.h - 30);
      g.restore();
    }
  }
}
