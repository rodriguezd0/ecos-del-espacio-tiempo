// HUD del sistema de campo de Zygarde (canvas 2D de la UI, 512×384): medidor de resonancia del Buceo
// (8 segmentos hexagonales), flecha de Detección mejorada alrededor del jugador y superposición del Salto de
// Convergencia (estelas, espacio estirado y destellos). Sin cifras en el mundo (CAMPANA §1.1).
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { drawHexFilled, drawHexOutline } from '../../ui/message/messageBox.js';
import { C } from '../../ui/core/colors.js';

const SEG_R = 9;
const SEG_GAP = 21;

/** Medidor de resonancia: 8 hexágonos arriba a la derecha; parpadea con 2 o menos. */
export function drawDiveMeter(g, meter, t) {
  if (!meter) return;
  const n = meter.max;
  const x0 = SCREEN_W - 16 - (n - 1) * SEG_GAP - SEG_R;
  const y = 22;
  const low = meter.segments <= 2;
  const blink = low && Math.floor(t / 12) % 2 === 0;
  g.save();
  g.fillStyle = 'rgba(4, 16, 12, 0.62)';
  g.fillRect(x0 - SEG_R - 8, y - SEG_R - 7, (n - 1) * SEG_GAP + SEG_R * 2 + 16, SEG_R * 2 + 14);
  g.strokeStyle = C.coreEdge;
  g.lineWidth = 2;
  g.strokeRect(x0 - SEG_R - 8, y - SEG_R - 7, (n - 1) * SEG_GAP + SEG_R * 2 + 16, SEG_R * 2 + 14);
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * SEG_GAP;
    drawHexOutline(g, cx, y, SEG_R, C.coreEdge, 1, 2);
    if (i < meter.segments - 1 || (i === meter.segments - 1 && !blink)) {
      const draining = i === meter.segments - 1;
      const alpha = draining ? 1 - meter.progress * 0.65 : 1;
      drawHexFilled(g, cx, y, SEG_R - 3, low ? '#e8ff9a' : C.core, alpha);
    } else if (i === meter.segments - 1 && blink) {
      drawHexFilled(g, cx, y, SEG_R - 3, '#ffffff', 0.5);
    }
  }
  g.restore();
}

/** Flecha de Detección mejorada: triángulo verde que orbita al jugador apuntando a la célula. */
export function drawDetectArrow(g, px, py, angle, t, strength = 1) {
  const r = 30 + Math.sin(t / 10) * 2;
  const ax = px + Math.cos(angle) * r;
  const ay = py + Math.sin(angle) * r;
  g.save();
  g.translate(Math.round(ax), Math.round(ay));
  g.rotate(angle);
  g.globalAlpha = 0.55 + 0.35 * strength;
  g.fillStyle = C.coreShadow;
  g.beginPath();
  g.moveTo(10, 0); g.lineTo(-6, -8); g.lineTo(-2, 0); g.lineTo(-6, 8); g.closePath();
  g.fill();
  g.fillStyle = C.core;
  g.beginPath();
  g.moveTo(8, 0); g.lineTo(-4, -6); g.lineTo(-1, 0); g.lineTo(-4, 6); g.closePath();
  g.fill();
  g.restore();
}

/**
 * Superposición del Salto de Convergencia. `k` = progreso 0..1, `t` = fotogramas. Estelas radiales que
 * aceleran, anillos hexagonales que se estiran y destellos breves de columnas en ruinas.
 */
export function drawJumpOverlay(g, k, t, seed = 7) {
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H / 2 + 10;
  const intro = Math.min(1, k * 8);
  const outro = k > 0.92 ? (k - 0.92) / 0.08 : 0;
  g.save();
  g.globalAlpha = 0.72 * intro;
  const grad = g.createRadialGradient(cx, cy, 20, cx, cy, 360);
  grad.addColorStop(0, 'rgba(10, 40, 20, 0.0)');
  grad.addColorStop(1, 'rgba(4, 14, 10, 1.0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  g.globalAlpha = intro;
  const speed = 0.6 + k * 2.4;
  for (let i = 0; i < 70; i++) {
    const a = ((i * 137.508 + seed) % 360) * (Math.PI / 180);
    const phase = ((t * speed * 0.013 + i * 0.173) % 1);
    const r0 = 30 + phase * phase * 420;
    const len = 12 + phase * 90 * speed;
    const x0 = cx + Math.cos(a) * r0;
    const y0 = cy + Math.sin(a) * r0 * 0.75;
    const x1 = cx + Math.cos(a) * (r0 + len);
    const y1 = cy + Math.sin(a) * (r0 + len) * 0.75;
    g.strokeStyle = i % 5 === 0 ? 'rgba(230,255,220,0.9)' : 'rgba(185,255,102,0.7)';
    g.lineWidth = i % 5 === 0 ? 3 : 2;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  for (let j = 0; j < 4; j++) {
    const p = ((t * 0.01 * speed + j / 4) % 1);
    drawHexOutline(g, cx, cy, 20 + p * p * 300, C.core, (1 - p) * 0.6, 2);
  }
  // Destellos de ruinas: siluetas de columnas que aparecen un instante.
  const flash = (t % 150) < 8;
  if (flash && k < 0.9) {
    g.globalAlpha = (1 - (t % 150) / 8) * 0.5;
    g.fillStyle = '#e8ffe0';
    const off = ((Math.floor(t / 150) * 97) % 200) - 100;
    for (let c = 0; c < 5; c++) {
      const x = cx + off + (c - 2) * 70;
      g.fillRect(x - 8, cy - 90 + (c % 2) * 20, 16, 150 - (c % 2) * 30);
      g.fillRect(x - 14, cy - 96 + (c % 2) * 20, 28, 8);
    }
  }
  if (outro > 0) {
    g.globalAlpha = outro;
    g.fillStyle = '#f0fff0';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }
  g.restore();
}
