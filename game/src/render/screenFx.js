// Efectos de pantalla con interpolación por fotogramas lógicos (60 Hz): tono de pantalla
// ($game_screen.start_tone_change), destello (start_flash), fundidos y transiciones.
import { addTones } from './dayNight.js';

const tween = (from, to, frames, resolve) => ({ from, to, frames: Math.max(1, frames), t: 0, resolve });

export class ScreenFx {
  constructor(compositor) {
    this.comp = compositor;
    this.screenTone = [0, 0, 0, 0];
    this.toneTween = null;
    this.flash = null; // { color:[r,g,b], alpha, frames, t }
    this.fadeAmount = 0;
    this.fadeColor = [0, 0, 0];
    this.fadeTween = null;
    this.trans = null; // { name, t, tween }
    this.transSeed = Math.random() * 100;
    this.rotation = 0; // giro de pantalla en rad, sentido horario (aristas del espacio imposible, B12)
    this.zoom = 1;
    this.rotTween = null;
  }

  /** Gira la imagen hasta `angle` rad (horario) con escala `zoom` en `frames` (0 = al instante). */
  rotateTo(angle = 0, frames = 20, zoom = 1) {
    this.rotTween?.resolve?.();
    this.rotTween = null;
    if (frames <= 0) {
      this.rotation = angle;
      this.zoom = zoom;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.rotTween = { ...tween([this.rotation, this.zoom], [angle, zoom], frames, resolve) };
    });
  }

  /** Cambia el tono de pantalla (además del día/noche y el clima) en `frames`. */
  toneTo(tone, frames = 20) {
    return new Promise((resolve) => {
      this.toneTween?.resolve?.();
      this.toneTween = tween(this.screenTone.slice(), [...tone, 0, 0, 0, 0].slice(0, 4), frames, resolve);
    });
  }

  /** Destello: color [r,g,b] (0..255), intensidad inicial alpha (0..255), duración en fotogramas. */
  flashScreen(color = [255, 255, 255], alpha = 255, frames = 12) {
    return new Promise((resolve) => {
      this.flash?.resolve?.();
      this.flash = { color, alpha: alpha / 255, frames: Math.max(1, frames), t: 0, resolve };
    });
  }

  fadeTo(amount, frames = 16, color = this.fadeColor) {
    this.fadeColor = color;
    return new Promise((resolve) => {
      this.fadeTween?.resolve?.();
      this.fadeTween = tween(this.fadeAmount, amount, frames, resolve);
    });
  }
  fadeOut(frames = 16, color = [0, 0, 0]) { return this.fadeTo(1, frames, color); }
  fadeIn(frames = 16) { return this.fadeTo(0, frames); }

  /** Transición animada t: 0→1 (termina en negro); se mantiene hasta clearTransition(). */
  playTransition(name, frames = 50, opts = {}) {
    return new Promise((resolve) => {
      this.trans?.tw?.resolve?.(); // la transición sustituida no deja su promesa pendiente
      this.trans = { name, t: 0, opts, tw: tween(0, 1, frames, resolve) };
    });
  }
  clearTransition() {
    this.trans?.tw?.resolve?.();
    this.trans = null;
  }

  get busy() { return Boolean(this.fadeTween || this.trans?.tw || this.flash || this.rotTween); }

  update() {
    const step = (tw, set) => {
      tw.t += 1;
      const k = Math.min(1, tw.t / tw.frames);
      set(k);
      if (tw.t >= tw.frames) { tw.resolve?.(); return null; }
      return tw;
    };
    if (this.toneTween) {
      const tw = this.toneTween;
      this.toneTween = step(tw, (k) => { this.screenTone = tw.from.map((v, i) => v + (tw.to[i] - v) * k); });
    }
    if (this.fadeTween) {
      const tw = this.fadeTween;
      this.fadeTween = step(tw, (k) => { this.fadeAmount = tw.from + (tw.to - tw.from) * k; });
    }
    if (this.flash) {
      const f = this.flash;
      f.t += 1;
      if (f.t >= f.frames) { f.resolve?.(); this.flash = null; }
    }
    if (this.trans?.tw) {
      const tr = this.trans;
      tr.tw = step(tr.tw, (k) => { tr.t = k; });
    }
    if (this.rotTween) {
      const tw = this.rotTween;
      this.rotTween = step(tw, (k) => {
        const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        this.rotation = tw.from[0] + (tw.to[0] - tw.from[0]) * e;
        this.zoom = tw.from[1] + (tw.to[1] - tw.from[1]) * e;
      });
    }
  }

  /** Vuelca el estado al compositor. `baseTones` = tonos de día/noche y clima. */
  apply(...baseTones) {
    this.comp.setTone(addTones(...baseTones, this.screenTone));
    const f = this.flash;
    if (f) this.comp.setFlash(f.color[0], f.color[1], f.color[2], f.alpha * (1 - f.t / f.frames));
    else this.comp.setFlash(255, 255, 255, 0);
    this.comp.setFade(this.fadeColor[0], this.fadeColor[1], this.fadeColor[2], this.fadeAmount);
    if (this.trans) this.comp.setTransition(this.trans.name, this.trans.t, { seed: this.transSeed, center: this.trans.opts.center });
    else this.comp.setTransition(null, 0);
    this.comp.setRotation?.(this.rotation, this.zoom);
  }
}
