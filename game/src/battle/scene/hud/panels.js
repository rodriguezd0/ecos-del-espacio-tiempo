// Paneles del combate: cartel de habilidad, alineación del equipo (Poké Balls) y ventana de subida de nivel.
import { UI, blit } from '../../../ui/core/images.js';
import { drawText } from '../../../ui/core/text.js';
import { playSE, SE } from '../../../ui/core/sound.js';
import { lineupLayout, SCREEN_W } from '../layout.js';

const B = (n) => UI(`Battle/${n}.png`);
export const PANEL_GFX = ['ability_bar', 'overlay_lineup', 'icon_ball', 'icon_ball_empty', 'icon_ball_faint', 'icon_ball_status'].map(B);

const STAT_ROWS = [['hp', 'PS'], ['atk', 'Ataque'], ['def', 'Defensa'], ['spa', 'At. Esp.'], ['spd', 'Def. Esp.'], ['spe', 'Velocidad']];

/** Cartel de habilidad (AbilitySplashBar): entra deslizándose desde su lado. */
export class AbilitySplash {
  constructor(side) {
    this.side = side;
    this.text = null;
    this.name = '';
    this.slide = 0; // 0 fuera → 1 dentro
    this.target = 0;
  }

  show(abilityName, pokemonName) {
    this.text = abilityName;
    this.name = pokemonName;
    this.target = 1;
    playSE('Battle ability');
  }

  hide() {
    this.target = 0;
  }

  update() {
    this.slide += (this.target - this.slide) * 0.25;
    if (Math.abs(this.target - this.slide) < 0.01) this.slide = this.target;
  }

  draw(g) {
    if (this.slide <= 0.01 || !this.text) return;
    const w = 256;
    const x = this.side === 0 ? -w + w * this.slide : SCREEN_W - w * this.slide;
    const y = this.side === 0 ? 180 : 80;
    blit(g, B('ability_bar'), Math.round(x), y, 0, this.side === 0 ? 0 : 64, 256, 64);
    const tx = this.side === 0 ? x + 10 : x + w - 8;
    const align = this.side === 0 ? 'left' : 'right';
    drawText(g, this.text, tx, y + 4, { color: '#f8f8f8', shadow: '#000000', outline: true, align });
    drawText(g, `de ${this.name}`, tx, y + 32, { color: '#f8f8f8', shadow: '#000000', outline: true, align });
  }
}

/** Alineación del equipo: barra y 6 Poké Balls (ok / estado / debilitado / vacío). */
export class Lineup {
  constructor(side) {
    this.side = side;
    this.status = [];
    this.visible = false;
    this.t = 0;
    this.alpha = 1;
    this.hiding = false;
  }

  show(status) {
    this.status = status.slice(0, 6);
    this.visible = true;
    this.hiding = false;
    this.alpha = 1;
    this.t = 0;
  }

  hide() {
    if (this.visible) this.hiding = true;
  }

  update() {
    if (!this.visible) return;
    this.t += 1;
    if (this.hiding) {
      this.alpha -= 1 / 12;
      if (this.alpha <= 0) { this.visible = false; this.hiding = false; }
    }
  }

  draw(g) {
    if (!this.visible) return;
    const L = lineupLayout(this.side);
    const dir = this.side === 0 ? 1 : -1;
    const slideBar = Math.max(0, 1 - this.t / 8) * (SCREEN_W / 2) * dir;
    g.save();
    g.globalAlpha = Math.max(0, this.alpha);
    blit(g, B('overlay_lineup'), Math.round(L.barX + slideBar), L.barY);
    for (let i = 0; i < 6; i++) {
      const delay = 8 + i * 2;
      const k = Math.max(0, Math.min(1, (this.t - delay) / 8));
      if (this.t < delay) continue;
      const st = this.status[i] || 'empty';
      const name = st === 'fainted' ? 'icon_ball_faint' : st === 'status' ? 'icon_ball_status' : st === 'ok' ? 'icon_ball' : 'icon_ball_empty';
      const x = L.ballX + L.step * i + (1 - k) * (SCREEN_W / 2) * dir;
      blit(g, B(name), Math.round(x), L.ballY);
    }
    g.restore();
  }
}

/** Ventana de subida de nivel: primero las ganancias (+n) y después los valores nuevos. */
export class LevelUpPanel {
  constructor() {
    this.active = false;
    this.page = 0;
    this.resolve = null;
    this.t = 0;
  }

  open(oldStats, newStats) {
    this.old = oldStats;
    this.cur = newStats;
    this.page = 0;
    this.t = 0;
    this.active = true;
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  update(input, fast = false) {
    if (!this.active) return;
    this.t += 1;
    const next = (this.t > 6 && (input.pressed('A') || input.pressed('B'))) || (fast && this.t > 45) || this.t > 360;
    if (!next) return;
    playSE(SE.cursor);
    if (this.page === 0) { this.page = 1; this.t = 0; return; }
    this.active = false;
    const r = this.resolve;
    this.resolve = null;
    if (r) r();
  }

  draw(g) {
    if (!this.active) return;
    const w = 208;
    const h = 6 * 28 + 20;
    const x = SCREEN_W - w - 8;
    const y = 288 - h - 6;
    g.save();
    g.fillStyle = 'rgba(20,24,32,0.9)';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#b9ff66';
    g.fillRect(x, y, w, 2);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(x, y + h - 2, w, 2);
    g.restore();
    STAT_ROWS.forEach(([k, label], i) => {
      const ty = y + 8 + i * 28;
      drawText(g, label, x + 12, ty, { color: '#f8f8f8', shadow: '#303030', font: 'narrow' });
      const val = this.page === 0 ? `+${(this.cur[k] ?? 0) - (this.old[k] ?? 0)}` : String(this.cur[k] ?? 0);
      drawText(g, val, x + w - 12, ty, { color: this.page === 0 ? '#b9ff66' : '#f8f8f8', shadow: '#303030', align: 'right', font: 'narrow' });
    });
  }
}
