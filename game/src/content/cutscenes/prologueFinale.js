// P-04 (final): la dispersión sobre el plano oscuro de la región —100 destellos pequeños (células) y 5 mayores
// (núcleos) con estelas— y el núcleo que cae al norte de un pequeño pueblo entre bosques. Fundido a negro.
import { SCREEN_W } from '../../core/engine.js';
import { cellToScreen, landCells } from './prologueData.js';
import { rand } from './cineGfx.js';
import { sfx, SFX } from './prologueAudio.js';

const GREEN = [185, 255, 102];
const PALE = [230, 255, 190];

/** Lanza una estela desde `from` hacia `to` con arco inicial. */
function launch(field, from, to, { big = false } = {}) {
  const ang = rand(-Math.PI * 0.9, -Math.PI * 0.1);
  const speed = big ? rand(2.2, 3) : rand(2.5, 4.5);
  return field.spawn({
    x: from.x, y: from.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, drag: 0.965,
    size: big ? 12 : 6, life: 600, color: big ? PALE : GREEN, alpha: 1, fadeIn: 4,
    target: { x: to.x, y: to.y, k: big ? 0.0022 : 0.003, kill: 5 }, big,
  });
}

export async function shotScatter(d, stage) {
  await stage.setMode('sky');
  const points = stage.regionPoints;
  stage.fade.a = 1;
  const heads = stage.particles({ max: 140, shape: 'hex' });
  const trail = stage.particles({ max: 900, shape: 'square' });
  const blips = [];
  const stopTrail = d.every(() => {
    for (const p of heads.list) {
      trail.spawn({ x: p.x, y: p.y, size: p.big ? 8 : 4, life: p.big ? 56 : 30, color: p.big ? GREEN : [140, 220, 90], alpha: p.big ? 0.85 : 0.7 });
    }
  });
  const arrive = (p) => {
    const g = stage.glow(p.big ? PALE : GREEN, { w: p.big ? 30 : 10, h: p.big ? 30 : 10, alpha: p.big ? 1 : 0.7 });
    g.x = p.x;
    g.y = p.y;
    blips.push(g);
    d.tween(g, { alpha: p.big ? 0.35 : 0 }, p.big ? 80 : 40, 'out').catch(() => {});
  };
  await d.tween(stage.fade, { a: 0 }, 40, 'out');
  sfx(SFX.scatter);
  // 100 células a destinos repartidos por la tierra
  const cells = landCells();
  for (let i = 0; i < 100; i++) {
    const to = cellToScreen(cells[Math.floor(rand(0, cells.length))]);
    const p = launch(heads, points.origin, { x: to.x + rand(-6, 6), y: to.y + rand(-6, 6) });
    p.onDeath = arrive;
    if (i % 8 === 7) await d.wait(3);
  }
  // 5 núcleos: el último, al norte del pequeño pueblo
  const order = [1, 2, 3, 4, 0];
  for (const i of order) {
    await d.wait(i === 0 ? 40 : 16);
    const p = launch(heads, points.origin, points.cores[i], { big: true });
    p.onDeath = arrive;
    sfx(SFX.fall, { volume: 60, pitch: 80 + i * 5 });
  }
  await d.wait(40);
  // espera a que lleguen (con tope)
  for (let guard = 0; guard < 360 && heads.count > 0; guard += 10) await d.wait(10);
  await d.wait(60);
  await d.tween(stage.fade, { a: 1 }, 40, 'linear');
  stopTrail();
  for (const g of blips) stage.remove(g);
  stage.remove(heads);
  stage.remove(trail);
}

export async function shotVillage(d, stage) {
  await stage.setMode('village');
  const v = stage.village;
  v.place(0, 0);
  stage.fade.a = 1;
  sfx(SFX.wind, { volume: 40 });
  await d.tween(stage.fade, { a: 0 }, 60, 'out');
  await d.wait(70);
  // un núcleo cae hacia el norte del pueblo
  const impact = { x: 272, y: 52 };
  const heads = stage.particles({ max: 4, shape: 'hex' });
  const trail = stage.particles({ max: 200, shape: 'square' });
  const core = heads.spawn({ x: SCREEN_W + 30, y: -60, vx: -2.6, vy: 1.6, size: 10, life: 400, color: PALE, target: { x: impact.x, y: impact.y, k: 0.004, kill: 8 } });
  const stopTrail = d.every(() => { for (const p of heads.list) trail.spawn({ x: p.x, y: p.y, size: 6, life: 40, color: GREEN, alpha: 0.8 }); });
  sfx(SFX.fall, { volume: 80 });
  for (let guard = 0; guard < 300 && heads.list.includes(core); guard += 5) await d.wait(5);
  stopTrail();
  const glow = stage.glow(GREEN, { w: 20, h: 20 });
  glow.x = impact.x;
  glow.y = impact.y;
  stage.flashScreen(GREEN, 0.5, 24);
  stage.shake(3, 24);
  sfx(SFX.impact, { volume: 55 });
  await d.tween(glow, { w: 220, h: 170 }, 30, 'out');
  await d.tween(glow, { w: 76, h: 64, alpha: 0.85 }, 70, 'inOut');
  const pulse = d.every((f) => { glow.alpha = 0.6 + 0.25 * Math.sin(f / 14); });
  await d.wait(150);
  await d.tween(stage.fade, { a: 1 }, 90, 'linear');
  pulse();
  stage.remove(glow);
  stage.remove(heads);
  stage.remove(trail);
}
