// Director de cinemáticas: reloj de fotogramas propio (lo avanza CineOverlay, que acelera ×3 con A),
// esperas, interpolaciones, tareas por fotograma, rótulos y cancelación (saltar con START).
// Módulo PURO (sin DOM ni Three.js): se prueba en tests/prologue.test.mjs.
//
//   const d = new Director({ skippable: true });
//   await d.wait(60);                          // 60 fotogramas lógicos (se acortan con A)
//   await d.tween(obj, { x: 100 }, 30, 'out'); // interpola propiedades numéricas
//   const stop = d.every((frame) => { … });    // tarea por fotograma (devuelve la función para quitarla)
//   d.caption('Primer día', { frames: 150 });  // rótulo pequeño (lo dibuja el overlay)
//   d.cancel();                                // las esperas pendientes y futuras rechazan con CancelledError

export class CancelledError extends Error {
  constructor(message = 'Cinemática cancelada') {
    super(message);
    this.name = 'CancelledError';
    this.cancelled = true;
  }
}

export const isCancel = (err) => Boolean(err && err.cancelled);

export const EASES = Object.freeze({
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2),
  back: (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
});

export const SPEED_UP = 3;

const noop = () => {};
/** Marca la promesa como manejada (las lanzadas sin await no generan "unhandled rejection" al cancelar). */
const handled = (p) => { p.catch(noop); return p; };

export class Director {
  /** @param {{ skippable?: boolean, speedUp?: number }} opts */
  constructor({ skippable = false, speedUp = SPEED_UP } = {}) {
    this.skippable = skippable;
    this.speedUp = speedUp;
    this.frame = 0;
    this.cancelled = false;
    this.waits = []; // { until, resolve, reject }
    this.tweens = []; // { target, from, to, frames, t, ease, resolve, reject }
    this.tasks = new Set();
    this.captions = []; // { text, t, frames, fade, style }
    this.cancelWaiters = [];
  }

  /** Lanza CancelledError si ya se canceló (para cortar bucles de los guiones). */
  check() {
    if (this.cancelled) throw new CancelledError();
  }

  /** Espera `frames` fotogramas del director. */
  wait(frames) {
    if (this.cancelled) return handled(Promise.reject(new CancelledError()));
    const n = Math.max(0, Math.round(frames));
    if (n === 0) return Promise.resolve();
    return handled(new Promise((resolve, reject) => this.waits.push({ until: this.frame + n, resolve, reject })));
  }

  /** Espera una promesa externa (paneo de cámara, fundido…) pero se corta al cancelar. */
  waitFor(promise) {
    if (this.cancelled) return handled(Promise.reject(new CancelledError()));
    return handled(new Promise((resolve, reject) => {
      const entry = { reject };
      this.cancelWaiters.push(entry);
      Promise.resolve(promise).then(
        (v) => { this.cancelWaiters = this.cancelWaiters.filter((e) => e !== entry); resolve(v); },
        (e) => { this.cancelWaiters = this.cancelWaiters.filter((x) => x !== entry); reject(e); },
      );
    }));
  }

  /**
   * Interpola propiedades numéricas de `target` hasta `props` en `frames` fotogramas.
   * `ease`: nombre de EASES o función t→t'.
   */
  tween(target, props, frames, ease = 'inOut') {
    if (this.cancelled) return handled(Promise.reject(new CancelledError()));
    const fn = typeof ease === 'function' ? ease : (EASES[ease] || EASES.inOut);
    const from = {};
    for (const k of Object.keys(props)) {
      const v = target[k];
      if (typeof v !== 'number') throw new Error(`tween: la propiedad "${k}" no es numérica`);
      from[k] = v;
    }
    const n = Math.max(1, Math.round(frames));
    return handled(new Promise((resolve, reject) => {
      this.tweens.push({ target, from, to: { ...props }, frames: n, t: 0, ease: fn, resolve, reject });
    }));
  }

  /** Registra una tarea por fotograma; devuelve la función que la quita. */
  every(fn) {
    this.tasks.add(fn);
    return () => this.tasks.delete(fn);
  }

  /** Muestra un rótulo pequeño durante `frames` (con fundido de `fade`). */
  caption(text, { frames = 150, fade = 20, style = 'small' } = {}) {
    this.captions = [...this.captions, { text, t: 0, frames, fade, style }];
  }

  /** Alfa (0..1) de un rótulo según su tiempo. */
  static captionAlpha(c) {
    if (c.t < c.fade) return c.t / c.fade;
    if (c.t > c.frames - c.fade) return Math.max(0, (c.frames - c.t) / c.fade);
    return 1;
  }

  /** Avanza un fotograma: esperas, interpolaciones, tareas y rótulos. */
  tick() {
    if (this.cancelled) return;
    this.frame += 1;
    if (this.tweens.length) {
      const done = [];
      for (const tw of this.tweens) {
        tw.t += 1;
        const k = tw.ease(Math.min(1, tw.t / tw.frames));
        for (const key of Object.keys(tw.to)) tw.target[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * k;
        if (tw.t >= tw.frames) done.push(tw);
      }
      if (done.length) {
        this.tweens = this.tweens.filter((tw) => !done.includes(tw));
        for (const tw of done) tw.resolve();
      }
    }
    for (const task of [...this.tasks]) {
      try {
        if (task(this.frame) === false) this.tasks.delete(task);
      } catch (err) {
        this.tasks.delete(task);
        console.error('[cine] tarea por fotograma', err);
      }
    }
    if (this.captions.length) {
      this.captions = this.captions.map((c) => ({ ...c, t: c.t + 1 })).filter((c) => c.t <= c.frames);
    }
    if (this.waits.length) {
      const ready = this.waits.filter((w) => w.until <= this.frame);
      if (ready.length) {
        this.waits = this.waits.filter((w) => w.until > this.frame);
        for (const w of ready) w.resolve();
      }
    }
  }

  /** Cancela: rechaza todo lo pendiente y lo futuro con CancelledError. */
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    const err = new CancelledError();
    for (const w of this.waits) w.reject(err);
    for (const tw of this.tweens) tw.reject(err);
    for (const c of this.cancelWaiters) c.reject(err);
    this.waits = [];
    this.tweens = [];
    this.cancelWaiters = [];
    this.tasks.clear();
    this.captions = [];
  }

  /** Nº de pasos por fotograma de pantalla según el botón de acelerar. */
  stepsFor(accelerating) {
    return accelerating ? this.speedUp : 1;
  }
}
