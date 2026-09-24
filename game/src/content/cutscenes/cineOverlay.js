// Capa de control de cinemáticas: escena transparente que va encima de la escena que se está filmando
// (escenario propio del prólogo o MapScene). Cada fotograma avanza la escena de debajo y el Director
// 1 vez (o ×3 manteniendo A); START salta si el Director es saltable. Dibuja rótulos y avisos.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { drawText } from '../../ui/core/text.js';
import { Director } from './director.js';

const HINT_FRAMES = 240;

export class CineOverlay extends Scene {
  /** @param {Director} director */
  constructor(director) {
    super();
    this.director = director;
    this.target = null;
    this.t = 0;
    this.skipRequested = false;
  }

  get transparent() { return true; }

  /** Escena filmada (se actualiza desde aquí porque solo la escena superior recibe update). */
  setTarget(scene) { this.target = scene; }

  update(dt) {
    this.t += 1;
    const input = engine.input;
    const d = this.director;
    if (d.skippable && !d.cancelled && input.pressed('START')) {
      this.skipRequested = true;
      d.cancel();
      return;
    }
    const steps = d.stepsFor(input.held('A'));
    this.accelerating = steps > 1;
    for (let i = 0; i < steps; i++) {
      try {
        this.target?.update(dt);
      } catch (err) {
        engine.reportError(err);
      }
      d.tick();
    }
  }

  drawUI(g) {
    for (const c of this.director.captions) this.drawCaption(g, c);
    if (this.director.skippable && !this.director.cancelled && this.t < HINT_FRAMES) {
      const a = Math.min(1, (HINT_FRAMES - this.t) / 40) * 0.8;
      drawText(g, 'START: saltar', SCREEN_W - 8, SCREEN_H - 20, { align: 'right', color: '#d8d8e0', shadow: '#101018', font: 'tiny', alpha: a });
    }
    if (this.accelerating) drawText(g, '▶▶', SCREEN_W - 10, 6, { align: 'right', color: '#e8e8f0', shadow: '#101018', font: 'small', alpha: 0.75 });
  }

  drawCaption(g, c) {
    const alpha = Director.captionAlpha(c);
    if (alpha <= 0) return;
    const y = c.style === 'center' ? SCREEN_H / 2 - 16 : SCREEN_H - 58;
    if (c.style === 'center') {
      drawText(g, c.text, SCREEN_W / 2, y, { align: 'center', color: '#f0f0f8', shadow: '#181828', alpha });
      return;
    }
    g.save();
    g.globalAlpha = alpha * 0.55;
    g.fillStyle = '#000';
    g.fillRect(0, y - 6, 200, 34);
    g.restore();
    drawText(g, c.text, 20, y, { color: '#f0f0f8', shadow: '#181828', font: 'small', alpha });
  }
}

/** Espera (por fotogramas de pantalla) hasta que `pred()` sea cierto o pasen `timeoutMs`. */
export function untilFrame(pred, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const step = () => {
      let ok = false;
      try { ok = pred(); } catch { ok = false; }
      if (ok) { resolve(); return; }
      if (performance.now() - start > timeoutMs) { reject(new Error('Tiempo de espera agotado al cambiar de escena')); return; }
      requestAnimationFrame(step);
    };
    step();
  });
}

/**
 * Sustituye la pila por `scene` (con `params`), espera a que esté cargada y vuelve a poner el overlay
 * encima apuntando a ella. Devuelve la escena.
 */
export async function stageScene(overlay, scene, params) {
  engine.scenes.replace(scene, params).catch((err) => engine.reportError(err));
  await untilFrame(() => engine.scenes.top === scene);
  overlay.setTarget(scene);
  engine.scenes.push(overlay).catch((err) => engine.reportError(err));
  await untilFrame(() => engine.scenes.top === overlay);
  return scene;
}
