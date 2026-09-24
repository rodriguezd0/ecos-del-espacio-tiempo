// Presentación de la historia en la capa UI (solo navegador; api.js la carga bajo demanda):
//   openObtain({ item, color })        objeto importante que aparece con rayos sobre el mapa (Tablillas, Fragmentos)
//   showVerse({ verse, full, tint })   placa con el verso en escritura Unown y su traducción (parcial o total)
//   showTravel({ kind, from, to })     tarjeta de viaje en tren o ferri (sobre la pantalla ya fundida a negro)
//   ensureUnownFont() / drawUnown(...) fuente Unown de Añil (Fonts/Annon.ttf)
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { UIScene, openScene } from '../../ui/core/uiScene.js';
import { drawText, wrapLines, textWidth } from '../../ui/core/text.js';
import { img, preload } from '../../ui/core/images.js';
import { itemIconCandidates } from '../../ui/core/widgets.js';
import { drawHexOutline, drawHexFilled } from '../../ui/message/messageBox.js';
import { playSE } from '../../ui/core/sound.js';
import { numeral } from './verses.js';

const UNOWN_FAMILY = 'Annon';
let unownReady = null;

/** Carga la fuente Unown de Añil (una vez). Resuelve true si está disponible. */
export function ensureUnownFont() {
  if (!unownReady) {
    unownReady = engine.assets.font(UNOWN_FAMILY, engine.assets.anil('Fonts/Annon.ttf'))
      .then(() => true)
      .catch((err) => { console.warn('[historia] Fuente Unown no disponible', err); return false; });
  }
  return unownReady;
}

const css = (rgb, a = 1) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
const shade = (rgb, k) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

/** Dibuja líneas de Unown (ya envueltas) centradas en cx. `chars` limita los caracteres visibles. */
export function drawUnown(g, lines, cx, y, { color = '#e8f4ff', shadow = '#10202c', lineHeight = 30, chars = Infinity } = {}) {
  let left = chars;
  lines.forEach((line, i) => {
    if (left <= 0) return;
    const text = line.slice(0, Math.max(0, left));
    left -= line.length;
    // Se centra por el ancho de la línea completa para que no «baile» mientras se escribe.
    const w = textWidth(line, 'unown');
    drawText(g, text, Math.round(cx - w / 2), y + i * lineHeight, { font: 'unown', color, shadow });
  });
}

/** Primera URL de icono de objeto que haya cargado (o null). */
function iconImage(itemId) {
  for (const url of itemIconCandidates(itemId)) {
    const im = img(url);
    if (im) return im;
  }
  return null;
}

/** Carga los iconos candidatos EN ORDEN hasta que uno exista (evita pedir los de respaldo sin necesidad). */
export async function preloadItemIcon(itemId) {
  for (const url of itemIconCandidates(itemId)) {
    const [im] = await preload([url]);
    if (im) return im;
  }
  return null;
}

// ------------------------------------------------------------------ objeto obtenido
const OBTAIN_INTRO = 36;

class ObtainScene extends UIScene {
  constructor(opts) {
    super();
    this.item = opts.item;
    this.color = opts.color || [255, 236, 170];
    this.onIntro = null;
  }

  async enter() {
    await preloadItemIcon(this.item);
    playSE('Anim/Saint7');
  }

  updateWhilePaused() { this.t += 1; this.checkIntro(); }

  checkIntro() {
    if (this.t >= OBTAIN_INTRO && this.onIntro) { const f = this.onIntro; this.onIntro = null; f(); }
  }

  tick() { this.checkIntro(); }

  drawUI(g) {
    const k = Math.min(1, this.t / 18);
    g.save();
    g.fillStyle = `rgba(4,8,16,${0.5 * k})`;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const cx = SCREEN_W / 2;
    const cy = 150;
    // Rayos giratorios
    g.translate(cx, cy);
    g.rotate(this.t / 90);
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      g.fillStyle = css(this.color, (i % 2 ? 0.18 : 0.3) * k);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-14, -170 * k);
      g.lineTo(14, -170 * k);
      g.closePath();
      g.fill();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // Halo hexagonal
    const pulse = 0.75 + 0.25 * Math.sin(this.t / 8);
    drawHexFilled(g, cx, cy, 64 * k, css(this.color), 0.22 * pulse);
    drawHexOutline(g, cx, cy, 70 * k, css(this.color), 0.8 * k, 2);
    // Icono ×2, que sube y se asienta
    const im = iconImage(this.item);
    if (im) {
      const s = 2 * (0.6 + 0.4 * k);
      const w = Math.round(im.width * s);
      const h = Math.round(im.height * s);
      const bob = Math.round(Math.sin(this.t / 14) * 3);
      g.imageSmoothingEnabled = false;
      g.drawImage(im, Math.round(cx - w / 2), Math.round(cy - h / 2 + (1 - k) * 30 + bob), w, h);
    }
    // Destellos de cuatro puntas
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.t / 40;
      const r = 84 + Math.sin(this.t / 10 + i) * 8;
      const tw = Math.max(0, Math.sin(this.t / 6 + i * 1.7));
      if (tw < 0.2) continue;
      const x = Math.round(cx + Math.cos(a) * r);
      const y = Math.round(cy + Math.sin(a) * r * 0.7);
      g.fillStyle = `rgba(255,255,255,${tw * k})`;
      g.fillRect(x - 1, y - 5, 2, 10);
      g.fillRect(x - 5, y - 1, 10, 2);
    }
    g.restore();
  }
}

/**
 * Muestra un objeto importante sobre el mapa. Devuelve { ready, done, close }: `ready` se resuelve al terminar la
 * entrada (para mostrar el mensaje encima) y close() la retira.
 */
export function openObtain(opts) {
  const scene = new ObtainScene(opts);
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  scene.onIntro = readyResolve;
  const done = openScene(scene);
  return { ready, done, close: () => { engine.scenes.pop(undefined, scene); return done; } };
}

// ------------------------------------------------------------------ verso Unown
const UNOWN_LH = 28;
const TRANS_LH = 20;
const PLAQUE_W = 480;
const PAPER_W = 448;

class VerseScene extends UIScene {
  constructor(opts) {
    super();
    this.opts = opts;
    this.tint = opts.tint || [180, 200, 255];
  }

  async enter() {
    await ensureUnownFont();
    const o = this.opts;
    this.unownLines = wrapLines(o.unown, PLAQUE_W - 48, 'unown');
    this.totalChars = this.unownLines.reduce((n, l) => n + l.length, 0);
    this.transLines = wrapLines(o.translation, PAPER_W - 32, 'note').slice(0, 5);
    // La placa y la hoja se ajustan a la longitud del verso y se centran en la pantalla.
    const plaqueH = 44 + this.unownLines.length * UNOWN_LH + 8;
    const paperH = 30 + this.transLines.length * TRANS_LH + 10;
    const top = Math.max(6, Math.floor((SCREEN_H - plaqueH - 10 - paperH) / 2));
    this.plaque = { x: (SCREEN_W - PLAQUE_W) / 2, y: top, w: PLAQUE_W, h: plaqueH };
    this.paper = { x: (SCREEN_W - PAPER_W) / 2, y: top + plaqueH + 10, w: PAPER_W, h: paperH };
    playSE('Anim/Saint3');
  }

  get revealed() { return Math.floor(this.t * 1.2); }

  tick() {
    const inp = this.input;
    const done = this.revealed >= this.totalChars + 20;
    if (inp.pressed('A') || inp.pressed('B')) {
      if (!done) this.t = Math.ceil((this.totalChars + 20) / 1.2);
      else this.close();
    }
  }

  drawUI(g) {
    const o = this.opts;
    const k = Math.min(1, this.t / 14);
    g.save();
    g.fillStyle = `rgba(2,6,12,${0.62 * k})`;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.globalAlpha = k;
    this.drawPlaque(g, o);
    const shown = this.revealed;
    drawUnown(g, this.unownLines, SCREEN_W / 2, this.plaque.y + 40, {
      color: css(shade(this.tint, 1.15)), shadow: css(shade(this.tint, 0.25)), chars: shown, lineHeight: UNOWN_LH,
    });
    if (shown > this.totalChars) this.drawTranslation(g, o, Math.min(1, (shown - this.totalChars) / 20));
    g.restore();
  }

  drawPlaque(g, o) {
    const { x, y, w, h } = this.plaque;
    g.fillStyle = '#1b2430';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#243142';
    for (let yy = y + 6; yy < y + h - 6; yy += 6) g.fillRect(x + 6, yy, w - 12, 2);
    g.fillStyle = css(this.tint, 0.9);
    g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h);
    for (const [cx, cy] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) {
      drawHexOutline(g, cx, cy, 7, css(this.tint), 0.9);
    }
    const title = o.title || `Verso ${numeral(o.verse?.n)}`;
    drawText(g, title, SCREEN_W / 2, y + 10, { align: 'center', color: '#f0f4f8', shadow: '#0a1018', font: 'note' });
  }

  drawTranslation(g, o, a) {
    const { x, y, w, h } = this.paper;
    g.save();
    g.globalAlpha *= a;
    g.fillStyle = '#efe6cc';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#c9bb95';
    g.fillRect(x, y + h - 3, w, 3);
    const label = o.full ? 'Traducción · Clave Glífica' : 'Traducción parcial · Pokédex';
    drawText(g, label, x + 12, y + 4, { color: '#8a6a3a', shadow: '#e2d6b4', font: 'note' });
    this.transLines.forEach((line, i) => {
      drawText(g, line, x + 16, y + 24 + i * TRANS_LH, { color: '#40382c', shadow: '#d4c8a8', font: 'note' });
    });
    if (this.revealed >= this.totalChars + 20 && Math.floor(this.t / 20) % 2 === 0) {
      g.fillStyle = '#6a5a40';
      g.fillRect(x + w - 20, y + h - 16, 8, 6);
    }
    g.restore();
  }
}

/** Placa del verso: opts { verse, unown, translation, full, tint, title }. Espera a que el jugador la cierre. */
export function showVerse(opts) {
  return openScene(new VerseScene(opts));
}

// ------------------------------------------------------------------ tarjeta de viaje
const TRAVEL_FRAMES = 110;

class TravelScene extends UIScene {
  constructor(opts) {
    super();
    this.opts = opts;
  }

  tick() {
    if (this.t > 20 && (this.input.pressed('A') || this.input.pressed('B'))) this.close();
    else if (this.t >= TRAVEL_FRAMES) this.close();
  }

  drawUI(g) {
    const o = this.opts;
    const ferry = o.kind === 'ferry';
    g.save();
    g.fillStyle = ferry ? '#061424' : '#0c0c14';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const k = Math.min(1, this.t / 14) * Math.min(1, (TRAVEL_FRAMES - this.t) / 14 + 0.001);
    g.globalAlpha = Math.max(0, k);
    drawText(g, o.title || (ferry ? 'Ferri' : 'Tren regional'), SCREEN_W / 2, 92, { align: 'center', color: '#f8f8f8', shadow: '#384058' });
    const x0 = 96; const x1 = SCREEN_W - 96; const y = 200;
    g.fillStyle = ferry ? '#2c5c8c' : '#7a7a86';
    if (ferry) {
      for (let x = 40; x < SCREEN_W - 40; x += 16) g.fillRect(x + Math.round(Math.sin(this.t / 10 + x) * 2), y + 14 + (x % 32 ? 0 : 2), 10, 2);
    } else {
      g.fillRect(x0, y + 12, x1 - x0, 2);
      for (let x = x0; x < x1; x += 12) g.fillRect(x, y + 14, 6, 4);
    }
    for (const [x, name] of [[x0, o.from], [x1, o.to]]) {
      g.fillStyle = '#f0d060';
      g.fillRect(x - 5, y + 8, 10, 10);
      drawText(g, name || '', x, y + 30, { align: 'center', color: '#e8e8f0', shadow: '#282838', font: 'note' });
    }
    const p = Math.min(1, this.t / (TRAVEL_FRAMES - 20));
    const vx = Math.round(x0 + (x1 - x0) * (p * p * (3 - 2 * p)));
    if (ferry) this.drawBoat(g, vx, y); else this.drawTrain(g, vx, y);
    g.restore();
  }

  drawTrain(g, x, y) {
    g.fillStyle = '#c84838'; g.fillRect(x - 30, y - 8, 26, 16); g.fillRect(x - 2, y - 12, 30, 20);
    g.fillStyle = '#f0e0a0'; g.fillRect(x + 18, y - 8, 6, 6); g.fillRect(x - 26, y - 4, 6, 6); g.fillRect(x - 16, y - 4, 6, 6);
    g.fillStyle = '#202028'; g.fillRect(x - 26, y + 8, 6, 4); g.fillRect(x + 4, y + 8, 6, 4); g.fillRect(x + 18, y + 8, 6, 4);
  }

  drawBoat(g, x, y) {
    const bob = Math.round(Math.sin(this.t / 8) * 2);
    g.fillStyle = '#e8e8f0'; g.fillRect(x - 24, y - 2 + bob, 48, 10);
    g.fillStyle = '#d04838'; g.fillRect(x - 20, y + 8 + bob, 40, 4);
    g.fillStyle = '#f0f0f8'; g.fillRect(x - 8, y - 14 + bob, 18, 12);
    g.fillStyle = '#383848'; g.fillRect(x + 4, y - 22 + bob, 4, 8);
  }
}

/** Tarjeta de viaje (tren o ferri). Se cierra sola o con A. */
export function showTravel(opts) {
  return openScene(new TravelScene(opts));
}
