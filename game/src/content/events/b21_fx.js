// Presentación del Bloque 21 (solo navegador; los guiones la cargan bajo demanda con import()):
//   unownJumpLayer(lines)   capa del Salto de Convergencia: escritura Unown que pasa de largo (nunca Unown vivos:
//                           CAMPANA B21 §1 «Los Unown solo aparecen como escritura»)
//   openCinema()            capa transparente de cine para el montaje, el carguero y los créditos: bandas negras,
//                           rótulos pequeños y bloques de créditos con fundido. El mapa de debajo sigue vivo
//                           (UIScene → MapScene.updateWhilePaused: guiones, cámara y fundidos).
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { UIScene, openScene } from '../../ui/core/uiScene.js';
import { drawText } from '../../ui/core/text.js';
import { ensureUnownFont } from '../story/storyFx.js';
import { unownText } from '../story/verses.js';

// ─────────────────────────────── Salto: escritura Unown ───────────────────────────────

/** Capa de dibujo del Salto (field.playJump({ draw })): líneas Unown que se alejan del centro con las estelas. */
export async function unownJumpLayer(texts) {
  const ok = await ensureUnownFont();
  if (!ok) return null;
  const lines = texts.map((t) => unownText(t)).filter(Boolean);
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H / 2 + 10;
  const SHOWN = 0.34; // fracción del ciclo en la que se ve cada línea: unas tres a la vez
  return (g, k, t) => {
    const intro = Math.min(1, k * 6);
    const outro = k > 0.88 ? Math.max(0, (0.96 - k) / 0.08) : 1;
    g.save();
    lines.forEach((line, i) => {
      const cycle = (t * 0.0026 + i / lines.length) % 1;
      if (cycle > SHOWN) return;
      const phase = cycle / SHOWN;
      const alpha = Math.sin(phase * Math.PI) * 0.42 * intro * outro;
      if (alpha <= 0.02) return;
      const ang = ((i * 137.508 + 23) * Math.PI) / 180;
      const r = 30 + phase * phase * 320;
      drawText(g, line, Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.62), {
        font: 'unown', color: '#dcffd2', shadow: '#0c2a16', alpha, align: 'center',
      });
    });
    // Velo por DETRÁS de las estelas (sobre el mapa): el lugar de partida se pierde y solo queda el camino.
    g.globalCompositeOperation = 'destination-over';
    g.globalAlpha = 0.82 * intro * (k > 0.9 ? Math.max(0, (1 - k) / 0.1) : 1);
    const veil = g.createRadialGradient(cx, cy, 10, cx, cy, 340);
    veil.addColorStop(0, 'rgba(14, 40, 24, 1)');
    veil.addColorStop(1, 'rgba(2, 10, 6, 1)');
    g.fillStyle = veil;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.restore();
  };
}

// ─────────────────────────────── Capa de cine ───────────────────────────────

const BAR = 38;

class CinemaScene extends UIScene {
  constructor() {
    super();
    this.bars = 0; // 0..1
    this.barsTarget = 0;
    this.items = []; // { kind: 'caption'|'credit', lines, t, frames, fade }
  }

  tick() {
    this.bars += Math.sign(this.barsTarget - this.bars) * Math.min(Math.abs(this.barsTarget - this.bars), 1 / 20);
    this.items = this.items.map((it) => ({ ...it, t: it.t + 1 })).filter((it) => it.t <= it.frames);
  }

  alphaOf(it) {
    if (it.t < it.fade) return it.t / it.fade;
    if (it.t > it.frames - it.fade) return Math.max(0, (it.frames - it.t) / it.fade);
    return 1;
  }

  drawUI(g) {
    if (this.bars > 0) {
      g.save();
      g.fillStyle = '#000';
      const h = Math.round(BAR * this.bars);
      g.fillRect(0, 0, SCREEN_W, h);
      g.fillRect(0, SCREEN_H - h, SCREEN_W, h);
      g.restore();
    }
    for (const it of this.items) {
      const alpha = this.alphaOf(it);
      if (alpha <= 0) continue;
      if (it.kind === 'caption') {
        drawText(g, it.lines[0], 18, SCREEN_H - 30, { color: '#f4f0e0', shadow: '#181420', font: 'small', alpha });
      } else if (it.kind === 'title') {
        it.lines.forEach((line, i) => drawText(g, line, SCREEN_W / 2, SCREEN_H / 2 - 20 + i * 26, { align: 'center', color: '#fff6dc', shadow: '#201a10', alpha }));
      } else {
        const y0 = BAR + 16;
        it.lines.forEach((line, i) => drawText(g, line, SCREEN_W / 2, y0 + i * 22, {
          align: 'center', color: i === 0 ? '#ffe6a0' : '#f4f4f8', shadow: '#101018', font: 'small', alpha,
        }));
      }
    }
  }
}

/**
 * Abre la capa de cine. → { bars(on), caption(text, frames), credit(lines, frames), title(lines, frames), close() }.
 * Los tiempos van en fotogramas de la capa (60 = 1 s).
 */
export function openCinema() {
  const scene = new CinemaScene();
  const done = openScene(scene);
  const push = (kind, lines, frames, fade) => {
    scene.items = [...scene.items, { kind, lines: Array.isArray(lines) ? lines : [lines], t: 0, frames: Math.max(fade * 2, frames), fade }];
  };
  return {
    scene,
    done,
    bars: (on) => { scene.barsTarget = on ? 1 : 0; },
    caption: (text, frames = 200) => push('caption', text, frames, 24),
    credit: (lines, frames = 300) => push('credit', lines, frames, 30),
    title: (lines, frames = 240) => push('title', lines, frames, 40),
    clear: () => { scene.items = []; },
    close: () => { scene.close(); return done; },
  };
}
