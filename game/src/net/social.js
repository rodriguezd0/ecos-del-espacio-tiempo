// Chat de texto y globos de emoción de la sala online, en el mapa. Tecla R (E en el teclado) con el jugador libre:
// menú rápido de globos (! ? … ♪ ♥) y «Escribir mensaje» (campo de texto real para el teclado físico).
// Cada mensaje sale como burbuja sobre quien lo dice (unos segundos) y queda en un registro abajo a la izquierda.
import { ui } from '../ui/api.js';
import { drawText, textWidth } from '../ui/core/text.js';
import { MAX_CHAT_LENGTH, NET_EMOTES, sanitizeChat } from './protocol.js';

const BUBBLE_MS = 6000;
const LOG_MS = 12000;
const LOG_LINES = 4;
const BUBBLE_MAX_W = 200;
const LINE_H = 16;
const FONT = 'small';
const SELF = 'self';

/** Parte `text` en líneas de como mucho `maxW` px (palabras; corta las muy largas). Máximo 3 líneas. */
export function wrapText(text, maxW, measure = (s) => textWidth(s, FONT)) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxW) { line = next; continue; }
    if (line) lines.push(line);
    line = word;
    while (measure(line) > maxW && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && measure(line.slice(0, cut)) > maxW) cut -= 1;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines.length > 3 ? [...lines.slice(0, 2), `${lines[2]}…`] : lines;
}

export class SocialLayer {
  /** sync: MapNetSync (cliente, escena, avatares remotos). */
  constructor(sync, { now = () => performance.now() } = {}) {
    this.sync = sync;
    this.now = now;
    this.bubbles = new Map(); // id del jugador (o SELF) → { lines, until }
    this.log = []; // { name, text, at }
    const client = sync.client;
    this.offs = [
      client.on('chat', (m) => this.receiveChat(m.id, m.text)),
      client.on('emo', (m) => this.showEmote(m.id, m.k)),
    ];
  }

  dispose() {
    for (const off of this.offs) off();
    this.offs = [];
  }

  nameOf(id) {
    if (id === SELF) return this.sync.scene.state?.player?.name || 'Tú';
    return this.sync.client.peers.get(id)?.name || '?';
  }

  receiveChat(id, raw) {
    const text = sanitizeChat(raw);
    if (!text) return;
    const at = this.now();
    this.bubbles.set(id, { lines: wrapText(text, BUBBLE_MAX_W), until: at + BUBBLE_MS });
    this.log = [...this.log, { name: this.nameOf(id), text, at }].slice(-LOG_LINES);
  }

  sendChat(raw) {
    const text = sanitizeChat(raw);
    if (!text) return false;
    this.sync.client.send({ t: 'chat', text });
    this.receiveChat(SELF, text);
    return true;
  }

  characterOf(id) {
    if (id === SELF) return this.sync.scene.world.player;
    return this.sync.remote.avatars.get(id) || null;
  }

  showEmote(id, kind) {
    const ch = this.characterOf(id);
    if (ch && NET_EMOTES.includes(kind)) this.sync.scene.emote?.(ch, kind);
  }

  sendEmote(kind) {
    if (!NET_EMOTES.includes(kind)) return;
    this.sync.client.send({ t: 'emo', k: kind });
    this.showEmote(SELF, kind);
  }

  /** Menú rápido (tecla R): globos y escribir. Se ejecuta como guion de la escena. */
  async openMenu() {
    const options = [...NET_EMOTES, 'Escribir mensaje', 'Cancelar'];
    const pick = await ui.choice(options, { cancel: options.length - 1 });
    if (pick < NET_EMOTES.length) { this.sendEmote(NET_EMOTES[pick]); return; }
    if (pick !== NET_EMOTES.length) return;
    const text = await readChatLine();
    if (text) this.sendChat(text);
  }

  drawUI(g) {
    const now = this.now();
    const view = this.sync.scene.worldView;
    const cam = this.sync.scene.camera;
    for (const [id, b] of this.bubbles) {
      if (now > b.until) { this.bubbles.delete(id); continue; }
      const ch = this.characterOf(id);
      const head = ch && view?.headPosOf(ch);
      if (!head) continue;
      drawBubble(g, b.lines, Math.round(head.x - cam.renderX), Math.round(head.y - cam.renderY) - 24);
    }
    const recent = this.log.filter((l) => now - l.at < LOG_MS);
    recent.forEach((l, i) => {
      const alpha = Math.min(1, (LOG_MS - (now - l.at)) / 1500);
      const y = 384 - 26 - (recent.length - i) * LINE_H;
      drawText(g, `${l.name}: ${l.text}`, 6, y, { font: FONT, color: '#f8f8f8', shadow: '#202830', alpha });
    });
  }
}

/** Burbuja de cómic con cola hacia abajo; (cx, bottom) = punta de la cola. */
function drawBubble(g, lines, cx, bottom) {
  const w = Math.max(...lines.map((l) => textWidth(l, FONT))) + 12;
  const h = lines.length * LINE_H + 6;
  const x = Math.round(Math.min(512 - w - 2, Math.max(2, cx - w / 2)));
  const y = bottom - h - 5;
  g.save();
  g.fillStyle = 'rgba(248,248,248,0.95)';
  g.strokeStyle = '#383040';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(x, y, w, h, 5);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(cx - 5, y + h - 1);
  g.lineTo(cx, bottom);
  g.lineTo(cx + 5, y + h - 1);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  lines.forEach((l, i) => drawText(g, l, x + 6, y + 2 + i * LINE_H, { font: FONT, color: '#383040' }));
}

/**
 * Campo de texto real sobre el juego (teclado físico): Intro envía, Esc cancela. Mientras está abierto, las teclas
 * no llegan al juego. Resuelve con el texto o null.
 */
export function readChatLine(doc = globalThis.document) {
  if (!doc) return Promise.resolve(null);
  return new Promise((resolve) => {
    const box = doc.createElement('input');
    box.type = 'text';
    box.maxLength = MAX_CHAT_LENGTH;
    box.placeholder = 'Escribe un mensaje y pulsa Intro (Esc para cancelar)';
    box.setAttribute('aria-label', 'Mensaje de chat');
    Object.assign(box.style, {
      position: 'fixed', left: '50%', bottom: '6%', transform: 'translateX(-50%)', width: 'min(640px, 90vw)',
      padding: '10px 14px', font: '20px "Power Green", monospace', color: '#303848', background: '#f8f8f8',
      border: '3px solid #383040', borderRadius: '8px', outline: 'none', zIndex: 1000, boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
    });
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      box.remove();
      resolve(value);
    };
    box.addEventListener('keydown', (e) => {
      e.stopPropagation(); // que el juego no reciba las teclas (A, S, Espacio… son botones)
      if (e.key === 'Enter') finish(box.value);
      else if (e.key === 'Escape') finish(null);
    });
    box.addEventListener('keyup', (e) => e.stopPropagation());
    box.addEventListener('blur', () => setTimeout(() => finish(null), 0)); // clic fuera = cancelar
    doc.body.appendChild(box);
    box.focus();
  });
}
