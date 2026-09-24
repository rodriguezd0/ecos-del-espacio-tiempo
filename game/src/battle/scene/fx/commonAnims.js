// Animaciones comunes: estados alterados, subidas/bajadas de características, destello variocolor,
// Megaevolución, objetos, bayas, drenadoras, atracción, atrapado, protecciones, clima y campos.
import { FX_SE } from '../moveStyle.js';
import { aura, ringAt, burstAt, impactAt } from './primitives.js';
import { rand } from '../gfx/particles.js';
import { lerp, Ease } from '../timeline.js';

const STATUS_FX = {
  BURN: { cell: 'burn', tint: [1, 0.45, 0.15], color: [255, 150, 60] },
  POISON: { cell: 'poison', tint: [0.75, 0.35, 0.95], color: [200, 110, 240] },
  TOXIC: { cell: 'poison', tint: [0.6, 0.2, 0.8], color: [170, 70, 220] },
  PARALYSIS: { cell: 'paraSpark', tint: [1, 0.9, 0.3], color: [255, 240, 90] },
  SLEEP: { cell: 'sleepZ', tint: null, color: [200, 210, 255] },
  FROZEN: { cell: 'crystal', tint: [0.6, 0.9, 1], color: [190, 240, 255] },
  FROSTBITE: { cell: 'crystal', tint: [0.6, 0.9, 1], color: [190, 240, 255] },
};

/** Animación de un estado alterado sobre un combatiente. */
export async function statusAnimation(fx, idx, status) {
  const def = STATUS_FX[status];
  if (!def) return;
  fx.se(FX_SE[status]);
  if (fx.minimal) { await fx.tasks.wait(6); return; }
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  const w = s ? s.width * 0.3 : 36;
  if (s && def.tint) s.stripe = { color: def.tint, amount: 0.55, dir: status === 'PARALYSIS' ? 3 : 1 };
  if (status === 'SLEEP') {
    for (let i = 0; i < 3; i++) {
      fx.particles.spawn({ x: c.x + 20 + i * 10, y: c.y - 20, vx: 0.4, vy: -0.9, image: 'cell:sleepZ', color: [255, 255, 255], size: 150 + i * 24, life: 40, delay: i * 10, alpha: 1, alphaEnd: 0, order: 60 });
    }
    await fx.tasks.wait(50);
  } else if (status === 'FROZEN' || status === 'FROSTBITE') {
    fx.particles.spawn({ x: c.x, y: c.y + 6, image: 'cell:crystal', color: [255, 255, 255], size: (s ? s.width : 100) * 1.25, life: 44, alpha: 0.85, alphaEnd: 0, fadeIn: 8, order: 60 });
    burstAt(fx, c, 'ICE', { n: 8, speed: 3 });
    await fx.tasks.wait(44);
  } else if (status === 'PARALYSIS') {
    for (let k = 0; k < 4; k++) {
      fx.particles.spawn({ x: c.x + rand(-w, w), y: c.y + rand(-w, w), image: 'cell:paraSpark', color: [255, 255, 255], animate: true, size: 192, life: 12, alpha: 1, alphaEnd: 0.4, order: 60 });
      if (s) s.offX = k % 2 ? 3 : -3;
      await fx.tasks.wait(8);
    }
    if (s) s.offX = 0;
    await fx.tasks.wait(10);
  } else {
    const rise = status === 'BURN' ? -1.3 : -0.8;
    for (let i = 0; i < 8; i++) {
      fx.particles.spawn({ x: c.x + rand(-w, w), y: c.y + rand(0, w), vy: rise, image: `cell:${def.cell}`, animate: true, color: [255, 255, 255], size: 176, sizeEnd: 150, life: 28, delay: i * 3, alpha: 1, alphaEnd: 0, order: 60 });
    }
    await fx.tasks.wait(44);
  }
  if (s) s.stripe = null;
}

/** Confusión: patitos girando sobre la cabeza. */
export async function confusionAnimation(fx, idx) {
  fx.se(FX_SE.confusion);
  if (fx.minimal) return;
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  const top = c.y - (s ? s.height * 0.45 : 50);
  for (let i = 0; i < 3; i++) {
    fx.particles.spawn({ image: 'cell:duck', color: [255, 255, 255], size: 150, life: 50, alpha: 1, alphaEnd: 0.2, order: 62,
      orbit: { cx: c.x, cy: top, r: 34, speed: 0.12, a0: (i / 3) * Math.PI * 2, flat: 0.35 } });
  }
  await fx.tasks.wait(50);
}

/** Subida (azul-anaranjado ascendente) o bajada (azul descendente) de características. */
export async function statAnimation(fx, idx, stages) {
  const up = stages > 0;
  fx.se(up ? FX_SE.statUp : FX_SE.statDown);
  if (fx.minimal) { await fx.tasks.wait(10); return; }
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  const w = s ? s.width * 0.3 : 36;
  const h = s ? s.height * 0.45 : 50;
  if (s) s.stripe = up ? { color: [1, 0.55, 0.2], amount: 0.6, dir: -1 } : { color: [0.3, 0.55, 1], amount: 0.6, dir: 1 };
  const color = up ? [255, 170, 80] : [110, 160, 255];
  const n = Math.min(3, Math.abs(stages)) * 5 + 5;
  for (let i = 0; i < n; i++) {
    const x = c.x + rand(-w, w);
    fx.particles.spawn({ x, y: up ? c.y + h * 0.6 : c.y - h * 0.8, vy: up ? -2.2 : 2.2, image: 'arrow', color, additive: true, size: 14, rot: up ? 0 : Math.PI, life: 26, delay: i * 2, alpha: 1, alphaEnd: 0, order: 61 });
  }
  await fx.tasks.wait(36 + n);
  if (s) s.stripe = null;
}

/** Destello variocolor al entrar. */
export async function shinyAnimation(fx, idx) {
  fx.se(FX_SE.shiny);
  if (fx.minimal) return;
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    fx.particles.spawn({ image: 'sparkle', color: [255, 255, 210], additive: true, size: 18, sizeEnd: 4, life: 24, delay: i * 2, alpha: 1, alphaEnd: 0, order: 62,
      path: (k) => ({ x: c.x + Math.cos(a + k * 2) * lerp(10, 58, k), y: c.y + Math.sin(a + k * 2) * lerp(10, 58, k) }) });
  }
  await fx.tasks.wait(40);
}

/** Megaevolución, fase 1: energía que converge y el sprite brilla. */
export async function megaGather(fx, idx) {
  fx.se(FX_SE.mega1);
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  if (!fx.minimal) {
    fx.tone([-70, -70, -50, 0], 12);
    const colors = [[255, 120, 120], [255, 220, 120], [140, 255, 150], [120, 200, 255], [220, 140, 255]];
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2);
      const r0 = rand(90, 160);
      const col = colors[i % colors.length];
      fx.particles.spawn({ image: 'orb', color: col, additive: true, size: 14, sizeEnd: 6, life: 24, delay: i * 2, alpha: 0.3, alphaEnd: 1, order: 63,
        path: (k) => ({ x: c.x + Math.cos(a) * r0 * (1 - Ease.inQuad(k)), y: c.y + Math.sin(a) * r0 * (1 - Ease.inQuad(k)) }) });
    }
  }
  await fx.tasks.tween(fx.minimal ? 10 : 70, (k) => { if (s) s.color = [1, 1, 1, Math.min(1, k * 1.2)]; });
  fx.flash([255, 255, 255], 255, 16);
}

/** Megaevolución, fase 2: estallido y grito (tras el cambio de forma). */
export async function megaBurst(fx, idx) {
  fx.se(FX_SE.mega2);
  const s = fx.sprite(idx);
  const c = s ? s.center : fx.point(idx);
  if (!fx.minimal) {
    ringAt(fx, c, [255, 255, 255], { from: 20, to: 300, life: 30 });
    ringAt(fx, c, [255, 190, 255], { from: 10, to: 220, life: 34 });
    burstAt(fx, c, 'FAIRY', { n: 22, speed: 7, life: 30 });
    fx.cam.shake(5, 18);
  }
  await fx.tasks.tween(20, (k) => { if (s) s.color = [1, 1, 1, 1 - k]; });
  if (!fx.minimal) fx.tone([0, 0, 0, 0], 16);
  fx.cry(idx);
  await fx.tasks.wait(20);
}

async function sparkleOn(fx, idx, color, se) {
  fx.se(se);
  if (fx.minimal) return;
  await aura(fx, idx, color, { frames: 30, image: 'sparkle' });
}

async function drainAnim(fx, from, to) {
  fx.se(FX_SE.leech);
  if (fx.minimal || from === undefined || to === undefined) return;
  const a = fx.point(from);
  const b = fx.point(to);
  for (let i = 0; i < 8; i++) {
    const ox = rand(-20, 20);
    fx.particles.spawn({ image: 'orb', color: [140, 255, 120], additive: true, size: 12, life: 26, delay: i * 3, alpha: 1, alphaEnd: 0.5, order: 60,
      path: (k) => ({ x: lerp(a.x + ox, b.x, k), y: lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * 40 }) });
  }
  await fx.tasks.wait(48);
}

/**
 * Animación común por nombre (Battle#pbCommonAnimation). Devuelve la promesa o null si no aplica.
 * `fx.weatherFx(name)` / `fx.terrainFx(name)` delegan en la escena para clima y campos.
 */
export async function playCommonAnimation(fx, name, user, targets = []) {
  const t0 = targets[0] ?? user;
  if (name.startsWith('Weather:')) return fx.weatherFx(name.slice(8));
  if (name.startsWith('Terrain:')) return fx.terrainFx(name.slice(8));
  switch (name) {
    case 'Confusion': return confusionAnimation(fx, user ?? t0);
    case 'Attract':
      fx.se(FX_SE.attract);
      if (!fx.minimal) {
        const c = fx.point(user ?? t0);
        for (let i = 0; i < 6; i++) fx.particles.spawn({ x: c.x + rand(-30, 30), y: c.y, vy: -1, image: 'cell:heart', animate: true, color: [255, 255, 255], size: 170, life: 34, delay: i * 4, alpha: 1, alphaEnd: 0, order: 60 });
      }
      return fx.tasks.wait(fx.minimal ? 6 : 44);
    case 'MegaEvolution': return megaGather(fx, user ?? t0);
    case 'MegaEvolution2': return megaBurst(fx, user ?? t0);
    case 'EatBerry': return sparkleOn(fx, user ?? t0, [200, 255, 170], FX_SE.berry);
    case 'UseItem': case 'HealingWish': case 'LunarDance': return sparkleOn(fx, user ?? t0, [255, 255, 200], FX_SE.item);
    case 'LeechSeed': return drainAnim(fx, targets[0], user);
    case 'StatUp': return statAnimation(fx, user ?? t0, 1);
    case 'CraftyShield': case 'WideGuard': case 'QuickGuard': return sparkleOn(fx, user ?? t0, [170, 230, 255], FX_SE.protect);
    case 'Powder':
      if (!fx.minimal) { impactAt(fx, fx.point(user ?? t0), { cellName: 'explosion', size: 90 }); fx.cam.shake(6, 14); }
      fx.se('PRSFX- Explosion');
      return fx.tasks.wait(24);
    case 'ParentalBond': return fx.tasks.wait(4);
    default:
      if (/Wrap|Bind|Clamp|FireSpin|Whirlpool|SandTomb|MagmaStorm|Infestation|SnapTrap|Thunder/.test(name)) {
        const s = fx.sprite(user ?? t0);
        fx.se('PRSFX- Wrap');
        if (s && !fx.minimal) await fx.tasks.tween(24, (k, raw) => { s.scaleX = 1 - 0.08 * Math.sin(raw * Math.PI * 4); });
        if (s) s.scaleX = 1;
        return null;
      }
      return sparkleOn(fx, user ?? t0, [255, 255, 255], null);
  }
}
