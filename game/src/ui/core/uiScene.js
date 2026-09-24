// Escenas base de la UI.
//  - UIScene: escena transparente (se ve el mapa debajo). Si las escenas de debajo definen
//    `updateWhilePaused(dt)`, se les llama cada frame mientras esta UI es transparente (animaciones del mapa).
//  - ScreenScene: pantalla completa con fundido a negro al abrir y al cerrar (como pbFadeOutIn).
//    Las subclases implementan `tick()` (lógica con input) y `draw(g)`; cierran con `this.finish(result)`.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';

export const FADE_FRAMES = 7;

export class UIScene extends Scene {
  constructor() {
    super();
    this.t = 0; // frames desde que se abrió
    this.closing = false;
  }

  get transparent() {
    return true;
  }

  get input() {
    return engine.input;
  }

  update(dt) {
    this.t += 1;
    if (this.transparent) {
      for (const e of engine.scenes.stack) {
        if (e.scene === this) break;
        if (typeof e.scene.updateWhilePaused === 'function') {
          try {
            e.scene.updateWhilePaused(dt);
          } catch (err) {
            engine.reportError(err);
          }
        }
      }
    }
    this.tick(dt);
  }

  /** Lógica por frame de la subclase. */
  tick(_dt) {}

  /** Desapila esta escena devolviendo `result` a quien la abrió. */
  close(result) {
    if (this.closing) return;
    this.closing = true;
    engine.scenes.pop(result, this);
  }
}

export class ScreenScene extends UIScene {
  constructor() {
    super();
    this.phase = 'cover'; // cover → reveal → active → hide → uncover
    this.fade = 0;
    this.result = undefined;
  }

  get transparent() {
    return this.phase === 'cover' || this.phase === 'uncover';
  }

  get active() {
    return this.phase === 'active';
  }

  update(dt) {
    this.t += 1;
    switch (this.phase) {
      case 'cover':
        if (++this.fade >= FADE_FRAMES) { this.phase = 'reveal'; this.fade = FADE_FRAMES; }
        break;
      case 'reveal':
        if (--this.fade <= 0) { this.phase = 'active'; this.fade = 0; engine.input.flush(); }
        break;
      case 'hide':
        if (++this.fade >= FADE_FRAMES) { this.phase = 'uncover'; this.fade = FADE_FRAMES; this.onHidden(); }
        break;
      case 'uncover':
        if (--this.fade <= 0) super.close(this.result);
        break;
      default:
        this.tick(dt);
    }
    this.animate(dt);
  }

  /** Animaciones que corren también durante los fundidos. */
  animate(_dt) {}

  /** Se llama con la pantalla ya en negro, justo antes de mostrar lo de debajo. */
  onHidden() {}

  /** Cierra con fundido y devuelve `result`. */
  finish(result) {
    if (this.phase === 'hide' || this.phase === 'uncover') return;
    this.result = result;
    this.phase = 'hide';
    this.fade = Math.max(0, this.fade);
  }

  drawUI(g) {
    if (this.phase !== 'cover' && this.phase !== 'uncover') {
      g.save();
      this.draw(g);
      g.restore();
    }
    if (this.fade > 0) {
      g.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade / FADE_FRAMES)})`;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }

  draw(_g) {}
}

/**
 * Abre una escena de UI y espera su resultado.
 * @template T
 * @param {Scene} scene
 * @param {object} [params]
 * @returns {Promise<T>}
 */
export function openScene(scene, params) {
  return engine.scenes.push(scene, params);
}
