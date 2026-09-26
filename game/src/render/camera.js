// Cámara del mapa, como en Pokémon: sigue SIEMPRE al jugador centrado, también junto a los bordes y esquinas (lo de
// fuera lo dibujan los mapas vecinos y el relleno de borde de world/seams.js; en interiores, negro). Solo un mapa que
// cabe entero en la pantalla se queda quieto, centrado (como en Añil). Paneos suaves para escenas y temblor.
import { SCREEN_W, SCREEN_H } from '../core/screen.js';

const TILE = 32;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.target = null;
    this.bounds = { w: SCREEN_W, h: SCREEN_H };
    this.pan = null;
    this.shakeState = null;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  /** Tamaño del mapa actual (casillas). Ya no limita la cámara: solo decide si el mapa cabe entero en pantalla. */
  setBounds(widthTiles, heightTiles) {
    this.bounds = { w: widthTiles * TILE, h: heightTiles * TILE };
  }

  /** ¿El mapa actual cabe entero en la pantalla? (entonces la cámara se queda centrada en él). */
  get mapFitsScreen() {
    return this.bounds.w <= SCREEN_W && this.bounds.h <= SCREEN_H;
  }

  follow(target) {
    this.target = target;
    this.pan?.resolve?.(); // un paneo interrumpido no deja colgado a quien lo esperaba
    this.pan = null;
  }

  /** Esquina superior izquierda para centrar el punto (px, py) (centro de casilla); mapa pequeño: centrado en él. */
  desiredFor(px, py) {
    const { w, h } = this.bounds;
    if (this.mapFitsScreen) return { x: (w - SCREEN_W) / 2, y: (h - SCREEN_H) / 2 };
    return { x: px - SCREEN_W / 2, y: py - SCREEN_H / 2 };
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
