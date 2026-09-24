// Cámara del mapa: sigue al jugador (centrado como Essentials), respeta los límites del mapa salvo en
// los lados con conexión, paneos suaves para escenas y temblor de pantalla.
import { SCREEN_W, SCREEN_H } from '../core/engine.js';

const TILE = 32;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.target = null;
    this.bounds = { w: SCREEN_W, h: SCREEN_H, open: {} };
    this.pan = null;
    this.shakeState = null;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  setBounds(widthTiles, heightTiles, open = {}) {
    this.bounds = { w: widthTiles * TILE, h: heightTiles * TILE, open };
  }

  follow(target) {
    this.target = target;
    this.pan = null;
  }

  /** Esquina superior izquierda deseada para centrar el punto (px, py) (centro de casilla). */
  desiredFor(px, py) {
    let x = px - SCREEN_W / 2;
    let y = py - SCREEN_H / 2;
    const { w, h, open } = this.bounds;
    if (w <= SCREEN_W) x = (w - SCREEN_W) / 2;
    else {
      if (!open.west) x = Math.max(0, x);
      if (!open.east) x = Math.min(w - SCREEN_W, x);
    }
    if (h <= SCREEN_H) y = (h - SCREEN_H) / 2;
    else {
      if (!open.north) y = Math.max(0, y);
      if (!open.south) y = Math.min(h - SCREEN_H, y);
    }
    return { x, y };
  }

  targetCenter() {
    const t = this.target;
    return { x: t.realX + TILE / 2, y: t.realY + TILE / 2 };
  }

  snapToTarget() {
    if (!this.target) return;
    const c = this.targetCenter();
    const d = this.desiredFor(c.x, c.y);
    this.x = d.x;
    this.y = d.y;
  }

  /** Mueve el centro de la cámara a la casilla (tx, ty) en `frames`. */
  panTo(tx, ty, frames = 30) {
    const d = this.desiredFor(tx * TILE + TILE / 2, ty * TILE + TILE / 2);
    return this.panToPx(d.x, d.y, frames);
  }

  panToPx(x, y, frames) {
    this.pan?.resolve?.();
    return new Promise((resolve) => {
      this.pan = { fromX: this.x, fromY: this.y, toX: x, toY: y, t: 0, dur: Math.max(1, frames), resolve, hold: true };
    });
  }

  /** Vuelve al objetivo y reanuda el seguimiento. */
  async reset(frames = 20) {
    if (this.target) {
      const c = this.targetCenter();
      const d = this.desiredFor(c.x, c.y);
      await this.panToPx(d.x, d.y, frames);
    }
    this.pan = null;
  }

  /** Temblor: power 1..9, speed 1..9, frames de duración (como $game_screen.start_shake). */
  shake(power = 5, speed = 5, frames = 20) {
    return new Promise((resolve) => {
      this.shakeState?.resolve?.();
      this.shakeState = { power, speed, frames, t: 0, resolve };
    });
  }

  update() {
    if (this.pan) {
      const p = this.pan;
      p.t = Math.min(p.dur, p.t + 1);
      const k = easeInOut(p.t / p.dur);
      this.x = p.fromX + (p.toX - p.fromX) * k;
      this.y = p.fromY + (p.toY - p.fromY) * k;
      if (p.t >= p.dur && p.resolve) { const r = p.resolve; p.resolve = null; r(); }
    } else if (this.target) {
      this.snapToTarget();
    }
    this.shakeX = 0;
    this.shakeY = 0;
    const s = this.shakeState;
    if (s) {
      s.t += 1;
      const fade = Math.min(1, (s.frames - s.t) / 8);
      this.shakeX = Math.round(Math.sin(s.t * s.speed * 0.35) * s.power * 1.5 * Math.max(0, fade));
      if (s.t >= s.frames) { this.shakeState = null; s.resolve(); }
    }
  }

  get renderX() { return Math.round(this.x) + this.shakeX; }
  get renderY() { return Math.round(this.y) + this.shakeY; }
}
