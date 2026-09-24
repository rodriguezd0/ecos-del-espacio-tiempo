// Globos de emoción sobre personajes ("!" "?" "…" "♪" "♥"), pixel art propio a escala DS×2.
import * as THREE from 'three';
import { makeCanvas, rawTexture } from './textures.js';
import { anchoredQuad, spriteMaterial } from './characterSprite.js';

const PALETTE = { k: '#383040', w: '#f8f8f8', s: '#d8d8e8', r: '#e83030', b: '#3058e0', g: '#505060', p: '#e0508c' };

const BALLOON = [
  '...kkkkkkkkkk...',
  '..kwwwwwwwwwwk..',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kswwwwwwwwwwsk.',
  '..kssssssssssk..',
  '...kkkkssskkk...',
  '.......ksk......',
  '........k.......',
];

const SYMBOLS = {
  '!': ['....rr....', '....rr....', '....rr....', '....rr....', '....rr....', '..........', '....rr....', '....rr....'],
  '?': ['...bbbb...', '..bb..bb..', '......bb..', '.....bb...', '....bb....', '..........', '....bb....', '....bb....'],
  '…': ['..........', '..........', '..........', '..........', '..........', '..........', '.gg.gg.gg.', '.gg.gg.gg.'],
  '♪': ['.....pp...', '.....ppp..', '.....p.pp.', '.....p..p.', '.....p....', '...ppp....', '..pppp....', '...pp.....'],
  '♥': ['..........', '.rr...rr..', 'rrrr.rrrr.', 'rrrrrrrrr.', '.rrrrrrr..', '..rrrrr...', '...rrr....', '....r.....'],
};
const ALIASES = { '...': '…', exclamation: '!', question: '?', music: '♪', heart: '♥', love: '♥' };
export const EMOTE_KINDS = Object.keys(SYMBOLS);

const texCache = new Map();

function emoteTexture(kind) {
  if (!texCache.has(kind)) {
    const S = 2;
    const { canvas, g } = makeCanvas(16 * S, BALLOON.length * S);
    const put = (x, y, ch) => {
      if (ch === '.') return;
      g.fillStyle = PALETTE[ch];
      g.fillRect(x * S, y * S, S, S);
    };
    BALLOON.forEach((row, y) => [...row].forEach((ch, x) => put(x, y, ch)));
    SYMBOLS[kind].forEach((row, y) => [...row].forEach((ch, x) => put(x + 3, y + 2, ch)));
    texCache.set(kind, rawTexture(canvas));
  }
  return texCache.get(kind);
}

export function normalizeEmote(kind) {
  const k = ALIASES[kind] || kind;
  if (!SYMBOLS[k]) throw new Error(`Emoción desconocida "${kind}" (usa ${EMOTE_KINDS.join(' ')})`);
  return k;
}

const QUAD = anchoredQuad();

export class EmoteLayer {
  constructor(parent) {
    this.parent = parent;
    this.active = [];
  }

  /** Muestra un globo sobre `target` (objeto con headPos()). Devuelve una promesa al terminar. */
  show(target, kind, frames = 56) {
    const k = normalizeEmote(kind);
    const tex = emoteTexture(k);
    const mat = spriteMaterial(tex);
    const mesh = new THREE.Mesh(QUAD, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2e6;
    this.parent.add(mesh);
    return new Promise((resolve) => {
      this.active.push({ target, mesh, mat, age: 0, frames, resolve, w: tex.image.width, h: tex.image.height });
    });
  }

  update() {
    for (const e of this.active) {
      e.age += 1;
      const pos = e.target.headPos?.();
      if (pos) {
        const grow = Math.min(1, 0.35 + e.age * 0.22);
        e.mesh.scale.set(e.w, Math.round(e.h * grow), 1);
        e.mesh.position.set(Math.round(pos.x), Math.round(pos.y), 0);
      } else {
        e.mesh.visible = false;
      }
    }
    const done = this.active.filter((e) => e.age >= e.frames);
    if (!done.length) return;
    this.active = this.active.filter((e) => e.age < e.frames);
    for (const e of done) {
      e.mesh.removeFromParent();
      e.mat.dispose();
      e.resolve();
    }
  }

  clear() {
    for (const e of this.active) { e.mesh.removeFromParent(); e.mat.dispose(); e.resolve(); }
    this.active = [];
  }
}
