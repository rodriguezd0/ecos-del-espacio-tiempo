// Sistema de partículas y haces para las animaciones de combate (Three.js). Coordenadas del campo
// (px, y hacia abajo). Cada partícula es un quad con material propio reutilizado desde un pool.
import * as THREE from 'three';
import { particleMaterial, beamMaterial, GEOM } from './materials.js';
import { fxTexture, cell } from './fxTextures.js';

const MAX_PARTICLES = 320;
const rand = (a, b) => a + Math.random() * (b - a);

/** Resuelve la imagen de una partícula: nombre de forma procedural, 'cell:<nombre>' o { tex, rect }. */
function resolveImage(img, frame = 0) {
  if (img && typeof img === 'object' && img.tex) return img;
  const name = String(img || 'dot');
  if (name.startsWith('cell:')) {
    const c = cell(name.slice(5), frame);
    if (c) return c;
    return { tex: fxTexture('star'), rect: [0, 0, 1, 1], w: 18, h: 18, frames: 1 };
  }
  const tex = fxTexture(name);
  return { tex, rect: [0, 0, 1, 1], w: tex.image.width, h: tex.image.height, frames: 1 };
}

export class Particles {
  constructor(group) {
    this.group = group;
    this.pool = [];
    this.live = [];
    this.beams = [];
    this.time = 0;
  }

  acquire(additive) {
    let mesh = this.pool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(GEOM.center, particleMaterial(null, additive));
      mesh.frustumCulled = false;
    }
    mesh.material.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    mesh.visible = true;
    this.group.add(mesh);
    return mesh;
  }

  /**
   * Crea una partícula. Opciones (px y fotogramas): x, y, vx, vy, ax, ay, drag, size, sizeEnd, stretch,
   * rot, vr, life, delay, alpha, alphaEnd, fadeIn, color [r,g,b], colorEnd, additive, image, animate,
   * order, orbit { cx, cy, r, speed, a0 }, path (t 0..1) → { x, y }.
   */
  spawn(o) {
    if (this.live.length >= MAX_PARTICLES) return null;
    const p = {
      x: o.x ?? 0, y: o.y ?? 0, vx: o.vx ?? 0, vy: o.vy ?? 0, ax: o.ax ?? 0, ay: o.ay ?? 0, drag: o.drag ?? 1,
      size: o.size ?? 16, sizeEnd: o.sizeEnd ?? o.size ?? 16, stretch: o.stretch ?? 1,
      rot: o.rot ?? (o.randomRot ? rand(0, Math.PI * 2) : 0), vr: o.vr ?? 0, life: Math.max(1, o.life ?? 30), delay: o.delay ?? 0, t: 0,
      alpha: o.alpha ?? 1, alphaEnd: o.alphaEnd ?? 0, fadeIn: o.fadeIn ?? 0,
      color: o.color || [255, 255, 255], colorEnd: o.colorEnd || null,
      image: o.image || 'dot', animate: Boolean(o.animate), additive: Boolean(o.additive),
      order: o.order ?? 40, orbit: o.orbit || null, path: o.path || null, face: Boolean(o.face),
      mesh: null,
    };
    p.mesh = this.acquire(p.additive);
    p.mesh.visible = false;
    this.live.push(p);
    return p;
  }

  /** Ráfaga de n partículas alrededor de (x, y) con velocidad radial. */
  burst(n, o) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-(o.spread ?? Math.PI), o.spread ?? Math.PI) : rand(0, Math.PI * 2);
      const sp = rand(o.speedMin ?? 1, o.speed ?? 3);
      out.push(this.spawn({ ...o, vx: Math.cos(a) * sp + (o.vx ?? 0), vy: Math.sin(a) * sp + (o.vy ?? 0),
        rot: o.randomRot ? rand(0, Math.PI * 2) : o.rot, delay: (o.delay ?? 0) + (o.stagger ? i * o.stagger : 0),
        size: o.sizeRand ? (o.size ?? 16) * rand(0.6, 1.2) : o.size }));
    }
    return out;
  }

  /** Haz de A a B que crece y se desvanece. Devuelve el haz (para esperarlo: dura `life`). */
  beam({ x0, y0, x1, y1, width = 18, color = [255, 255, 255], life = 30, grow = 8, order = 45 }) {
    const mesh = new THREE.Mesh(GEOM.beam, beamMaterial());
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    mesh.material.uniforms.uColor.value.set(color[0] / 255, color[1] / 255, color[2] / 255);
    this.group.add(mesh);
    const b = { mesh, x0, y0, x1, y1, width, life, grow, t: 0 };
    this.beams.push(b);
    return b;
  }

  update() {
    this.time += 1;
    const keep = [];
    for (const p of this.live) {
      if (p.delay > 0) { p.delay -= 1; keep.push(p); continue; }
      p.t += 1;
      const k = Math.min(1, p.t / p.life);
      if (p.path) {
        const pos = p.path(k);
        p.x = pos.x; p.y = pos.y;
      } else if (p.orbit) {
        const o = p.orbit;
        const a = (o.a0 ?? 0) + o.speed * p.t;
        p.x = o.cx + Math.cos(a) * o.r;
        p.y = o.cy + Math.sin(a) * o.r * (o.flat ?? 0.35);
      } else {
        p.vx = (p.vx + p.ax) * p.drag;
        p.vy = (p.vy + p.ay) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
      }
      p.rot += p.vr;
      if (p.face) p.rot = Math.atan2(p.vy, p.vx);
      if (p.t >= p.life) { this.release(p); continue; }
      this.apply(p, k);
      keep.push(p);
    }
    this.live = keep;
    const bk = [];
    for (const b of this.beams) {
      b.t += 1;
      const dx = b.x1 - b.x0;
      const dy = b.y1 - b.y0;
      const len = Math.hypot(dx, dy) * Math.min(1, b.t / b.grow);
      const fade = b.t > b.life - 8 ? Math.max(0, (b.life - b.t) / 8) : 1;
      b.mesh.position.set(b.x0, b.y0, 0);
      b.mesh.rotation.z = Math.atan2(dy, dx);
      b.mesh.scale.set(Math.max(1, len), b.width * (0.8 + 0.2 * Math.sin(b.t * 0.9)), 1);
      b.mesh.material.uniforms.uAlpha.value = fade;
      b.mesh.material.uniforms.uTime.value = b.t / 60;
      if (b.t >= b.life) {
        b.mesh.removeFromParent();
        b.mesh.material.dispose();
      } else bk.push(b);
    }
    this.beams = bk;
  }

  apply(p, k) {
    const m = p.mesh;
    const frame = p.animate ? Math.floor(k * 6) : 0;
    const img = resolveImage(p.image, frame);
    const u = m.material.uniforms;
    u.map.value = img.tex;
    u.uRect.value.set(...img.rect);
    const c = p.colorEnd ? p.color.map((v, i) => v + (p.colorEnd[i] - v) * k) : p.color;
    u.uColor.value.set(c[0] / 255, c[1] / 255, c[2] / 255);
    let a = p.alpha + (p.alphaEnd - p.alpha) * k;
    if (p.fadeIn > 0 && p.t < p.fadeIn) a *= p.t / p.fadeIn;
    u.uAlpha.value = Math.max(0, Math.min(1, a));
    const size = p.size + (p.sizeEnd - p.size) * k;
    const aspect = img.h / img.w;
    m.scale.set(size * p.stretch, size * aspect, 1);
    m.rotation.z = p.rot;
    m.position.set(Math.round(p.x), Math.round(p.y), 0);
    m.renderOrder = p.order;
    m.visible = true;
  }

  release(p) {
    p.mesh.visible = false;
    p.mesh.removeFromParent();
    this.pool.push(p.mesh);
  }

  get busy() {
    return this.live.length > 0 || this.beams.length > 0;
  }

  clear() {
    for (const p of this.live) this.release(p);
    this.live = [];
    for (const b of this.beams) { b.mesh.removeFromParent(); b.mesh.material.dispose(); }
    this.beams = [];
  }

  dispose() {
    this.clear();
    for (const m of this.pool) m.material.dispose();
    this.pool = [];
  }
}

export { rand };
