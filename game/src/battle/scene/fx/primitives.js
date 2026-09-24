// Primitivas de animación de combate (proyectiles, ráfagas, anillos, haces, embestidas, reacción al golpe…).
// Reciben `fx`, la fachada de la escena: { tasks, particles, cam, sprite(i), point(i), feet(i), flash,
// tone, se, minimal }. Todas devuelven promesas que terminan al acabar la parte "bloqueante".
import { Ease, lerp } from '../timeline.js';
import { rand } from '../gfx/particles.js';

/** Receta de partículas por tipo. */
export const TYPE_PARTICLES = Object.freeze({
  NORMAL: { image: 'star', color: [255, 255, 230], additive: true, size: 14 },
  FIGHTING: { image: 'impact', color: [255, 200, 120], additive: true, size: 18 },
  FLYING: { image: 'streak', color: [235, 245, 255], additive: true, size: 28, face: true },
  POISON: { image: 'bubble', color: [200, 110, 240], additive: false, size: 14 },
  GROUND: { image: 'rock', color: [255, 255, 255], additive: false, size: 14, gravity: 0.25 },
  ROCK: { image: 'rock', color: [255, 255, 255], additive: false, size: 16, gravity: 0.3 },
  BUG: { image: 'dot', color: [190, 240, 90], additive: true, size: 8 },
  GHOST: { image: 'wisp', color: [170, 120, 240], additive: true, size: 20 },
  STEEL: { image: 'star', color: [225, 235, 255], additive: true, size: 16 },
  QMARKS: { image: 'star', color: [255, 255, 255], additive: true, size: 14 },
  FIRE: { image: 'flame', color: [255, 190, 80], colorEnd: [255, 70, 20], additive: true, size: 18, gravity: -0.12 },
  WATER: { image: 'bubble', color: [150, 210, 255], additive: false, size: 14 },
  GRASS: { image: 'leaf', color: [130, 235, 100], additive: false, size: 14, spin: true },
  ELECTRIC: { image: 'sparkle', color: [255, 245, 110], additive: true, size: 16 },
  PSYCHIC: { image: 'ring', color: [255, 130, 220], additive: true, size: 20 },
  ICE: { image: 'shard', color: [200, 245, 255], additive: true, size: 14, spin: true },
  DRAGON: { image: 'orb', color: [150, 120, 255], colorEnd: [90, 220, 255], additive: true, size: 16 },
  DARK: { image: 'shard', color: [110, 60, 110], additive: false, size: 16, spin: true },
  FAIRY: { image: 'sparkle', color: [255, 190, 235], additive: true, size: 16 },
});

export const recipe = (type) => TYPE_PARTICLES[type] || TYPE_PARTICLES.NORMAL;

/** Ráfaga de partículas de un tipo en un punto. */
export function burstAt(fx, p, type, opts = {}) {
  const r = recipe(type);
  fx.particles.burst(opts.n ?? 10, {
    x: p.x, y: p.y, image: opts.image || r.image, color: opts.color || r.color, colorEnd: r.colorEnd,
    additive: opts.additive ?? r.additive, size: opts.size ?? r.size, sizeEnd: (opts.size ?? r.size) * 0.6,
    speed: opts.speed ?? 4, speedMin: opts.speedMin ?? 1.5, life: opts.life ?? 24, ay: opts.gravity ?? r.gravity ?? 0,
    drag: 0.92, vr: r.spin ? rand(-0.3, 0.3) : 0, randomRot: r.spin, face: r.face, order: opts.order ?? 50,
    sizeRand: true, alpha: 1, alphaEnd: 0, angle: opts.angle, spread: opts.spread, delay: opts.delay,
  });
}

/** Destello de impacto (estrella de golpe + halo). */
export function impactAt(fx, p, { size = 72, color = [255, 255, 255], cellName = 'hitStar', life = 14 } = {}) {
  fx.particles.spawn({ x: p.x, y: p.y, image: 'soft', color, additive: true, size: size * 1.2, sizeEnd: size * 1.8, life, alpha: 0.9, alphaEnd: 0, order: 48 });
  fx.particles.spawn({ x: p.x, y: p.y, image: `cell:${cellName}`, color: [255, 255, 255], size: size * 2.6, sizeEnd: size * 3, life, alpha: 1, alphaEnd: 0, order: 52 });
}

/** Anillo expansivo. */
export function ringAt(fx, p, color, { from = 16, to = 120, life = 22, additive = true, order = 49 } = {}) {
  fx.particles.spawn({ x: p.x, y: p.y, image: 'ring', color, additive, size: from, sizeEnd: to, life, alpha: 1, alphaEnd: 0, order });
}

/** Proyectil con estela de A a B (arco opcional). */
export async function projectile(fx, a, b, type, { frames = 22, arc = 0, size = 22, trail = true, image = null, color = null } = {}) {
  const r = recipe(type);
  const col = color || r.color;
  const path = (k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * arc });
  fx.particles.spawn({ image: 'soft', color: col, additive: true, size: size * 1.8, life: frames, alpha: 0.9, alphaEnd: 0.9, path, order: 46 });
  fx.particles.spawn({ image: image || (r.image === 'rock' ? 'rock' : 'orb'), color: r.image === 'rock' ? [255, 255, 255] : [255, 255, 255], additive: r.image !== 'rock', size, life: frames, alpha: 1, alphaEnd: 1, path, vr: 0.2, order: 47 });
  if (trail) {
    await fx.tasks.until((t) => {
      if (t % 2 === 0) {
        const pos = path(Math.min(1, t / frames));
        fx.particles.spawn({ x: pos.x + rand(-4, 4), y: pos.y + rand(-4, 4), image: r.image, color: col, colorEnd: r.colorEnd, additive: r.additive, size: r.size * 0.8, sizeEnd: 2, life: 14, alpha: 0.9, alphaEnd: 0, vy: r.gravity ? -0.5 : 0, order: 45, randomRot: true });
      }
      return t >= frames;
    });
  } else {
    await fx.tasks.wait(frames);
  }
}

/** Haz de energía de A a B con chispas. */
export async function beam(fx, a, b, type, { width = 22, life = 34 } = {}) {
  const r = recipe(type);
  fx.particles.beam({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, width, color: r.color, life, grow: 8 });
  fx.particles.beam({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, width: width * 0.45, color: [255, 255, 255], life: life - 4, grow: 10, order: 46 });
  await fx.tasks.until((t) => {
    if (t > 6 && t % 3 === 0) {
      const k = Math.random();
      fx.particles.spawn({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), image: r.image, color: r.color, additive: true, size: r.size, sizeEnd: 2, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), life: 16, alpha: 1, alphaEnd: 0, order: 50 });
    }
    return t >= life - 6;
  });
}

/** Partículas que convergen hacia un punto (carga de energía). */
export async function charge(fx, p, type, { frames = 16, n = 14, radius = 60 } = {}) {
  const r = recipe(type);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const sx = p.x + Math.cos(a) * radius;
    const sy = p.y + Math.sin(a) * radius;
    fx.particles.spawn({ image: r.additive ? r.image : 'soft', color: r.color, additive: true, size: r.size * 0.9, sizeEnd: 4, life: frames,
      path: (k) => ({ x: lerp(sx, p.x, Ease.inQuad(k)), y: lerp(sy, p.y, Ease.inQuad(k)) }), alpha: 0.2, alphaEnd: 1, order: 48, delay: i % 3 });
  }
  fx.particles.spawn({ x: p.x, y: p.y, image: 'soft', color: r.color, additive: true, size: 10, sizeEnd: 56, life: frames + 4, alpha: 0.3, alphaEnd: 0.9, order: 47 });
  await fx.tasks.wait(frames);
}

/** Embestida: el sprite avanza hacia el objetivo y vuelve. `hit` se llama en el momento del contacto. */
export async function lunge(fx, userIdx, targetPoint, hit, { dist = 0.55, frames = 10 } = {}) {
  const s = fx.sprite(userIdx);
  if (!s) { await hit?.(); return; }
  const from = s.center;
  const dx = (targetPoint.x - from.x) * dist;
  const dy = (targetPoint.y - from.y) * dist;
  await fx.tasks.tween(4, (k) => { s.offX = -dx * 0.08 * k; s.offY = -dy * 0.08 * k; }, Ease.outQuad);
  await fx.tasks.tween(frames, (k) => {
    s.offX = lerp(-dx * 0.08, dx, k);
    s.offY = lerp(-dy * 0.08, dy, k);
    if (fx.particles && Math.random() < 0.5) {
      fx.particles.spawn({ x: s.center.x, y: s.center.y, image: 'soft', color: [255, 255, 255], additive: true, size: 30, sizeEnd: 10, life: 8, alpha: 0.35, alphaEnd: 0, order: 44 });
    }
  }, Ease.inQuad);
  const hitDone = hit ? hit() : null;
  await fx.tasks.tween(12, (k) => { s.offX = lerp(dx, 0, k); s.offY = lerp(dy, 0, k); }, Ease.outCubic);
  await hitDone;
}

/** Reacción al golpe: parpadeo, sacudida lateral y destello blanco. */
export async function hitReact(fx, idx, { strong = false, blinks = 3 } = {}) {
  const s = fx.sprite(idx);
  if (!s) return;
  const amp = strong ? 8 : 5;
  await fx.tasks.tween(blinks * 8, (k, raw) => {
    const f = Math.floor(raw * blinks * 8);
    s.opacity = f % 8 < 4 ? 0.15 : 1;
    s.offX = Math.sin(f * 1.6) * amp * (1 - k);
    s.color = [1, 1, 1, f < 4 ? 0.7 : 0];
  });
  s.opacity = 1;
  s.offX = 0;
  s.color = [1, 1, 1, 0];
}

/** Aura (subida de energía): partículas que ascienden alrededor del sprite + halo. */
export async function aura(fx, idx, color, { frames = 36, image = 'sparkle', rise = true } = {}) {
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  const w = s ? s.width * 0.35 : 40;
  const h = s ? s.height * 0.5 : 50;
  fx.particles.spawn({ x: c.x, y: c.y, image: 'soft', color, additive: true, size: w * 2.2, sizeEnd: w * 2.8, life: frames, alpha: 0.2, alphaEnd: 0, fadeIn: 8, order: 43 });
  await fx.tasks.until((t) => {
    if (t % 2 === 0) {
      fx.particles.spawn({ x: c.x + rand(-w, w), y: c.y + (rise ? h * 0.8 : -h), vy: rise ? rand(-2.2, -1) : rand(1, 2.2), image, color, additive: true, size: rand(8, 16), sizeEnd: 2, life: 22, alpha: 1, alphaEnd: 0, order: 54 });
    }
    return t >= frames;
  });
}

/** Ondas de sonido (anillos que viajan). */
export async function soundWaves(fx, a, b, color, { n = 4, frames = 26 } = {}) {
  for (let i = 0; i < n; i++) {
    fx.particles.spawn({ image: 'ring', color, additive: true, size: 16, sizeEnd: 60, life: frames, alpha: 0.9, alphaEnd: 0, order: 48, delay: i * 5,
      path: (k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }) });
  }
  await fx.tasks.wait(frames + (n - 1) * 5 - 6);
}

/** Objetos que caen desde arriba sobre un punto (Lanzarrocas, Granizo…). */
export async function rainOn(fx, p, type, { n = 7, frames = 30 } = {}) {
  const r = recipe(type);
  for (let i = 0; i < n; i++) {
    const tx = p.x + rand(-40, 40);
    const ty = p.y + rand(-10, 30);
    const sx = tx + rand(-30, 30);
    const sy = ty - 220;
    const life = 14 + Math.floor(rand(0, 4));
    fx.particles.spawn({ image: r.image, color: r.color, additive: r.additive, size: r.size * 1.6, life, delay: i * 3, alpha: 1, alphaEnd: 1, randomRot: true, vr: 0.2, order: 52,
      path: (k) => ({ x: lerp(sx, tx, k), y: lerp(sy, ty, Ease.inQuad(k)) }) });
    fx.tasks.wait(i * 3 + life).then(() => burstAt(fx, { x: tx, y: ty }, type, { n: 4, speed: 3, life: 14 }));
  }
  await fx.tasks.wait(frames);
}

/** Movimiento de enfoque de cámara entre usuario y objetivo (estilo BW2). */
export function focusCamera(fx, userIdx, targetIdx) {
  if (fx.minimal || userIdx === undefined || userIdx === null) return;
  const a = fx.point(userIdx);
  const b = fx.point(targetIdx ?? userIdx);
  const zoom = userIdx === targetIdx ? 1.14 : 1.1;
  fx.cam.focusBetween(a, b, zoom, userIdx === targetIdx ? 1 : 0.62);
}
