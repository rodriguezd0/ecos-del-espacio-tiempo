// Motor: renderer Three.js + canvas UI + bucle de paso fijo a 60 Hz + escenas.
import * as THREE from 'three';
import { Input } from './input.js';
import { Assets } from './assets.js';
import { SceneManager } from './scenes.js';
import { SCREEN_W, SCREEN_H } from './screen.js';

export { SCREEN_W, SCREEN_H };
export const FPS = 60;
const STEP = 1 / FPS;
const MAX_STEPS_PER_FRAME = 5;

class Engine {
  constructor() {
    this.renderer = null;
    this.ui = null;
    this.input = null;
    this.assets = new Assets();
    this.audio = null; // se asigna en main.js (src/audio)
    this.scenes = new SceneManager(this);
    this.data = null;
    this.state = null;
    this.frame = 0;
    this.scale = 1;
    this._acc = 0;
    this._last = 0;
    this._running = false;
    this.debug = new URLSearchParams(location.search).has('debug');
  }

  init() {
    const world = document.getElementById('world');
    const ui = document.getElementById('ui');
    this.renderer = new THREE.WebGLRenderer({ canvas: world, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(SCREEN_W, SCREEN_H, false);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const g = ui.getContext('2d');
    g.imageSmoothingEnabled = false;
    this.ui = { canvas: ui, ctx: g };
    this.input = new Input(window);
    window.addEventListener('resize', () => this.fit());
    this.fit();
    this.installUpdateNotifier();
  }

  /** Escala entera máxima que cabe en la ventana (letterbox). */
  fit() {
    const stage = document.getElementById('stage');
    const fitScale = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
    // Escala entera si cabe al menos ×1; si la ventana es más pequeña, escala fraccional.
    const scale = fitScale >= 1 ? Math.floor(fitScale) : fitScale;
    this.scale = scale;
    stage.style.left = `${Math.round((window.innerWidth - SCREEN_W * scale) / 2)}px`;
    stage.style.top = `${Math.round((window.innerHeight - SCREEN_H * scale) / 2)}px`;
    stage.style.transform = `scale(${scale})`;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    const tick = (now) => {
      if (!this._running) return;
      let delta = (now - this._last) / 1000;
      this._last = now;
      if (delta > 0.25) delta = 0.25; // pestaña en segundo plano
      this._acc += delta;
      let steps = 0;
      while (this._acc >= STEP && steps < MAX_STEPS_PER_FRAME) {
        this.step();
        this._acc -= STEP;
        steps += 1;
      }
      if (steps === MAX_STEPS_PER_FRAME) this._acc = 0;
      this.scenes.render(this.renderer, this.ui.ctx);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  step() {
    this.frame += 1;
    this.input.update();
    try {
      this.scenes.update(STEP);
      if (this.audio && this.audio.update) this.audio.update(STEP);
      // Tiempo de juego en el guardado (antes se sumaba en el objeto GameState y nunca se guardaba).
      if (this.state?.tickPlayTime) this.state.tickPlayTime(1);
    } catch (err) {
      this.reportError(err);
    }
  }

  reportError(err) {
    console.error(err);
    if (this._errorShown) return;
    this._errorShown = true;
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:8px;top:8px;right:8px;max-height:45vh;overflow:auto;background:rgba(40,0,0,.92);color:#fdd;font:12px monospace;padding:8px;z-index:20;white-space:pre-wrap;border:1px solid #f66';
    box.textContent = `Error: ${err && err.stack ? err.stack : err}\n\n(Pulsa aquí para ocultar)`;
    box.onclick = () => { box.remove(); this._errorShown = false; };
    document.body.appendChild(box);
  }

  /** Avisa (sin recargar) cuando el servidor de desarrollo detecta cambios. */
  installUpdateNotifier() {
    if (!window.EventSource) return;
    const toast = document.getElementById('update-toast');
    let first = null;
    try {
      const es = new EventSource('/__events');
      es.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (first === null) {
          first = msg.stamp;
          return;
        }
        if (msg.stamp !== first && toast) toast.style.display = 'block';
      };
    } catch {
      /* sin servidor de desarrollo */
    }
    if (toast) toast.onclick = () => location.reload();
  }
}

export const engine = new Engine();
