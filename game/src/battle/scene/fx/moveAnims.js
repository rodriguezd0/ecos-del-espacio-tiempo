// Animaciones de movimientos. Primero la de Añil del propio movimiento (anilAnimPlayer.js: Data/PkmnAnimations de
// Essentials); si no existe o no carga, una genérica por estilo (moveStyle.js) y tipo que combina cámara, tono de
// pantalla, partículas del tipo y sonidos PRSFX de Añil.
import { classifyMove } from '../moveStyle.js';
import {
  burstAt, impactAt, ringAt, projectile, beam, charge, lunge, aura, soundWaves, rainOn, focusCamera, recipe,
} from './primitives.js';
import { rand } from '../gfx/particles.js';
import { lerp, Ease } from '../timeline.js';
import { playAnilMoveAnimation } from './anilAnimPlayer.js';

const scaleTone = (t, k) => (t ? [t[0] * k, t[1] * k, t[2] * k, 0] : null);

async function withTint(fx, info, body) {
  const t = info.fx.tint;
  if (t && !fx.minimal) fx.tone(scaleTone(t, 1), 8);
  try {
    await body();
  } finally {
    if (t && !fx.minimal) fx.tone([0, 0, 0, 0], 12);
  }
}

async function contactAnim(fx, u, targets, info) {
  const tp = fx.point(targets[0]);
  const hitAll = async () => {
    for (const t of targets) {
      const p = fx.point(t);
      if (info.punch) impactAt(fx, p, { cellName: 'fist', size: 60 });
      else if (info.slice || info.bite) {
        fx.particles.spawn({ x: p.x, y: p.y, image: 'slash', color: info.fx.alt, additive: true, size: 80, sizeEnd: 96, rot: info.bite ? Math.PI / 2 : 0, life: 14, alpha: 1, alphaEnd: 0, order: 53 });
        if (info.bite) fx.particles.spawn({ x: p.x, y: p.y, image: 'slash', color: info.fx.alt, additive: true, size: 80, sizeEnd: 96, rot: -Math.PI / 2, life: 14, alpha: 1, alphaEnd: 0, order: 53 });
      }
      impactAt(fx, p, { size: info.heavy ? 88 : 64, color: info.fx.color });
      burstAt(fx, p, info.type, { n: info.heavy ? 14 : 9, speed: 4.5 });
      if (info.heavy) fx.cam.shake(6, 14);
    }
    fx.flash([255, 255, 255], info.heavy ? 90 : 50, 6);
    await fx.tasks.wait(10);
  };
  if (u === null || u === undefined) { await hitAll(); return; }
  await lunge(fx, u, tp, hitAll, { dist: 0.6, frames: 8 });
}

async function projectileAnim(fx, u, targets, info) {
  const a = u !== null && u !== undefined ? fx.point(u) : { x: 256, y: -40 };
  await Promise.all(targets.map(async (t, i) => {
    await fx.tasks.wait(i * 4);
    const b = fx.point(t);
    const arc = info.type === 'GRASS' || info.type === 'ROCK' || info.type === 'GROUND' ? 40 : 10;
    await projectile(fx, a, b, info.type, { frames: 20, arc, size: 20 });
    impactAt(fx, b, { size: 58, color: info.fx.color });
    burstAt(fx, b, info.type, { n: 10, speed: 4 });
    ringAt(fx, b, info.fx.color, { from: 12, to: 90, life: 18 });
  }));
  fx.flash(info.fx.color, 40, 6);
  await fx.tasks.wait(8);
}

async function beamAnim(fx, u, targets, info) {
  const a = u !== null && u !== undefined ? fx.point(u) : { x: 256, y: -40 };
  await charge(fx, a, info.type, { frames: 14, n: 12, radius: 54 });
  await Promise.all(targets.map(async (t) => {
    const b = fx.point(t);
    const run = beam(fx, a, b, info.type, { width: info.heavy ? 30 : 20, life: 32 });
    await fx.tasks.wait(8);
    impactAt(fx, b, { size: 70, color: info.fx.color, cellName: 'burst' });
    burstAt(fx, b, info.type, { n: 12, speed: 5 });
    await run;
  }));
  fx.cam.shake(info.heavy ? 7 : 3, 12);
  fx.flash(info.fx.alt, 70, 8);
  await fx.tasks.wait(6);
}

async function waveAnim(fx, u, targets, info) {
  const a = u !== null && u !== undefined ? fx.point(u) : { x: 256, y: 192 };
  for (let i = 0; i < 3; i++) ringAt(fx, a, info.fx.color, { from: 20, to: 260, life: 28 + i * 4, order: 46 });
  burstAt(fx, a, info.type, { n: 16, speed: 6, life: 30 });
  await fx.tasks.wait(14);
  for (const t of targets) {
    const b = fx.point(t);
    burstAt(fx, b, info.type, { n: 10, speed: 4 });
    impactAt(fx, b, { size: 56, color: info.fx.color });
  }
  fx.cam.shake(4, 16);
  fx.flash(info.fx.color, 60, 8);
  await fx.tasks.wait(14);
}

async function rainAnim(fx, u, targets, info) {
  await Promise.all(targets.map((t) => rainOn(fx, fx.point(t), info.type, { n: info.heavy ? 9 : 6, frames: 34 })));
  fx.cam.shake(5, 12);
}

async function quakeAnim(fx, u, targets, info) {
  fx.cam.shake(10, 44);
  fx.se('PRSFX- Earthquake');
  for (let k = 0; k < 4; k++) {
    for (const t of targets) {
      const f = fx.feet(t);
      burstAt(fx, { x: f.x + rand(-30, 30), y: f.y - 4 }, 'GROUND', { n: 5, speed: 3.5, angle: -Math.PI / 2, spread: 1, gravity: 0.25 });
    }
    await fx.tasks.wait(9);
  }
  await fx.tasks.wait(6);
}

async function soundAnim(fx, u, targets, info) {
  const a = u !== null && u !== undefined ? fx.point(u) : { x: 256, y: 192 };
  await Promise.all(targets.map((t) => soundWaves(fx, a, fx.point(t), info.fx.color, { n: 4, frames: 24 })));
  for (const t of targets) ringAt(fx, fx.point(t), info.fx.color, { from: 30, to: 110, life: 16 });
  await fx.tasks.wait(6);
}

async function statusAnim(fx, u, targets, info) {
  const a = u !== null && u !== undefined ? fx.point(u) : null;
  if (a) {
    fx.particles.spawn({ x: a.x, y: a.y, image: 'soft', color: info.fx.color, additive: true, size: 30, sizeEnd: 90, life: 18, alpha: 0.7, alphaEnd: 0, order: 45 });
    await fx.tasks.wait(8);
  }
  await Promise.all(targets.map(async (t) => {
    const b = fx.point(t);
    if (a) await soundWaves(fx, a, b, info.fx.alt, { n: 2, frames: 18 });
    const r = recipe(info.type);
    for (let i = 0; i < 10; i++) {
      fx.particles.spawn({ image: r.image, color: info.fx.color, additive: true, size: r.size, life: 34, alpha: 1, alphaEnd: 0, order: 55, delay: i * 2,
        orbit: { cx: b.x, cy: b.y + 10, r: 44, speed: 0.16, a0: (i / 10) * Math.PI * 2, flat: 0.4 } });
    }
    const s = fx.sprite(t);
    if (s) {
      s.stripe = { color: info.fx.color.map((v) => v / 255), amount: 0.6, dir: 1 };
      await fx.tasks.wait(30);
      s.stripe = null;
    } else await fx.tasks.wait(30);
  }));
}

async function selfAnim(fx, u, targets, info) {
  const idx = u ?? targets[0];
  const s = fx.sprite(idx);
  if (s) s.stripe = { color: info.fx.color.map((v) => v / 255), amount: 0.5, dir: -1 };
  ringAt(fx, fx.feet(idx), info.fx.color, { from: 20, to: 150, life: 26 });
  await aura(fx, idx, info.fx.color, { frames: 34, image: recipe(info.type).additive ? recipe(info.type).image : 'sparkle' });
  if (s) s.stripe = null;
}

async function healAnim(fx, u, targets) {
  const list = u !== null && u !== undefined ? [u] : targets;
  fx.se('PRSFX- Recover');
  await Promise.all(list.map(async (i) => {
    const s = fx.sprite(i);
    if (s) s.stripe = { color: [0.6, 1, 0.7], amount: 0.45, dir: -1 };
    await aura(fx, i, [180, 255, 190], { frames: 36, image: 'sparkle' });
    if (s) s.stripe = null;
  }));
}

async function protectAnim(fx, u, targets) {
  const idx = u ?? targets[0];
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  const size = s ? Math.max(s.width, s.height) * 0.9 : 120;
  fx.particles.spawn({ x: c.x, y: c.y, image: 'bubble', color: [150, 230, 255], additive: true, size: size * 0.6, sizeEnd: size, life: 34, alpha: 0.9, alphaEnd: 0, order: 58 });
  fx.particles.spawn({ x: c.x, y: c.y, image: 'ring', color: [200, 250, 255], additive: true, size: size * 0.9, sizeEnd: size * 1.1, life: 30, alpha: 1, alphaEnd: 0, order: 59 });
  await fx.tasks.wait(30);
}

async function fieldAnim(fx, u, targets, info) {
  const side = targets.length ? targets[0] & 1 : 1;
  const base = side === 1 ? { x: 384, y: 180 } : { x: 128, y: 290 };
  const r = recipe(info.type);
  for (let i = 0; i < 12; i++) {
    const tx = base.x + rand(-100, 100);
    const ty = base.y + rand(-8, 16);
    fx.particles.spawn({ image: r.image, color: r.color, additive: r.additive, size: r.size, life: 26, delay: i * 2, alpha: 1, alphaEnd: 0.2, order: 40,
      path: (k) => ({ x: lerp(base.x, tx, k), y: lerp(base.y - 60, ty, Ease.outQuad(k)) - Math.sin(Math.PI * k) * 40 }) });
  }
  await fx.tasks.wait(34);
}

const STYLE_ANIMS = {
  contact: contactAnim, projectile: projectileAnim, beam: beamAnim, wave: waveAnim, rain: rainAnim, quake: quakeAnim,
  sound: soundAnim, status: statusAnim, self: selfAnim, heal: healAnim, protect: protectAnim, field: fieldAnim,
};

/**
 * Animación de un movimiento.
 * @param fx      fachada de la escena
 * @param {{ user: number|null, targets: number[], move: object, hitNum: number }} p
 */
export async function playMoveAnimation(fx, { user, targets, move, hitNum = 0 }) {
  const info = classifyMove(move);
  const list = targets.length ? targets : (user !== null && user !== undefined ? [user] : []);
  if (!list.length) return;
  if (!fx.minimal) {
    try {
      if (await playAnilMoveAnimation(fx, { user, targets, move, hitNum })) return;
    } catch (err) {
      console.warn(`[combate] Animación de Añil de ${move?.id} fallida; se usa la genérica`, err);
    }
  }
  fx.moveSE(move, info);
  if (fx.minimal) {
    await fx.tasks.wait(8);
    return;
  }
  if (hitNum === 0) focusCamera(fx, user, list[0]);
  const run = STYLE_ANIMS[info.style] || projectileAnim;
  await withTint(fx, info, () => run(fx, user, list, info));
}
