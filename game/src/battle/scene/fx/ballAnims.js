// Poké Balls en combate: lanzamiento con arco y giro, apertura con destello, salida/retirada de Pokémon
// y secuencia de captura (absorción, caída con botes, sacudidas, estrellas o escape).
import * as THREE from 'three';
import { engine } from '../../../core/engine.js';
import { rawTexture } from '../../../render/textures.js';
import { spriteMaterial, GEOM } from '../gfx/materials.js';
import { lerp, Ease } from '../timeline.js';
import { ringAt } from './primitives.js';

/** Color de destello por Ball (getBattlerColorFromPokeBall de Essentials, aproximado). */
export const BALL_COLORS = Object.freeze({
  POKEBALL: [232, 72, 56], GREATBALL: [72, 136, 232], ULTRABALL: [248, 208, 56], MASTERBALL: [184, 88, 232],
  SAFARIBALL: [120, 184, 80], NETBALL: [80, 200, 208], DIVEBALL: [72, 144, 248], NESTBALL: [152, 200, 64],
  REPEATBALL: [240, 128, 48], TIMERBALL: [232, 232, 232], LUXURYBALL: [48, 48, 48], PREMIERBALL: [248, 248, 248],
  DUSKBALL: [72, 176, 96], HEALBALL: [248, 152, 200], QUICKBALL: [72, 176, 232], CHERISHBALL: [224, 56, 56],
  BEASTBALL: [88, 136, 248], DREAMBALL: [248, 160, 216], FRIENDBALL: [96, 200, 96], LOVEBALL: [248, 136, 200],
  MOONBALL: [216, 224, 136], FASTBALL: [248, 200, 64], HEAVYBALL: [144, 160, 176], LEVELBALL: [232, 120, 56], LUREBALL: [72, 160, 216],
});
export const ballColor = (ball) => BALL_COLORS[ball] || BALL_COLORS.POKEBALL;

const texCache = new Map();
async function ballTexture(ball, open = false) {
  const key = `${ball}${open ? '_open' : ''}`;
  if (!texCache.has(key)) {
    texCache.set(key, (async () => {
      const url = (b) => engine.assets.anil(`Graphics/Battle animations/ball_${b}${open ? '_open' : ''}.png`);
      const im = (await engine.assets.tryImage(url(ball))) || (await engine.assets.tryImage(url('POKEBALL')));
      return im ? rawTexture(im) : null;
    })());
  }
  return texCache.get(key);
}

/** Sprite de una Poké Ball (8 frames de 32×64 al girar; versión abierta aparte). */
export class BallSprite {
  constructor(group) {
    this.mesh = new THREE.Mesh(GEOM.center, spriteMaterial());
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 64;
    group.add(this.mesh);
    this.x = 0; this.y = 0; this.rot = 0; this.scale = 1;
    this.frame = 0; this.open = false; this.visible = false; this.color = [1, 1, 1, 0]; this.opacity = 1;
  }

  async load(ball) {
    this.ball = ball;
    [this.closedTex, this.openTex] = await Promise.all([ballTexture(ball), ballTexture(ball, true)]);
  }

  update() {
    const tex = this.open ? this.openTex : this.closedTex;
    this.mesh.visible = this.visible && Boolean(tex);
    if (!this.mesh.visible) return;
    const u = this.mesh.material.uniforms;
    u.map.value = tex;
    const frames = this.open ? 1 : 8;
    const f = ((Math.floor(this.frame) % frames) + frames) % frames;
    u.uRect.value.set(f / frames, 0, (f + 1) / frames, 1);
    u.uColor.value.set(...this.color);
    u.uOpacity.value = this.opacity;
    this.mesh.position.set(Math.round(this.x), Math.round(this.y), 0);
    this.mesh.scale.set(32 * this.scale, 64 * this.scale, 1);
    this.mesh.rotation.z = this.rot;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

/** Lanza la Ball en arco de `from` a `to` girando. */
export async function throwArc(fx, ball, from, to, { frames = 24, height = 110 } = {}) {
  ball.visible = true;
  ball.open = false;
  ball.rot = 0;
  await fx.tasks.tween(frames, (k) => {
    ball.x = lerp(from.x, to.x, k);
    ball.y = lerp(from.y, to.y, k) - Math.sin(Math.PI * k) * height;
    ball.frame = k * 14;
  });
  ball.frame = 0;
}

/** Destello de apertura de la Ball. */
export function ballBurst(fx, p, ball, { big = false } = {}) {
  const col = ballColor(ball);
  fx.se('ball_open');
  if (fx.minimal) return;
  fx.particles.spawn({ x: p.x, y: p.y, image: 'soft', color: [255, 255, 255], additive: true, size: 20, sizeEnd: big ? 140 : 100, life: 16, alpha: 1, alphaEnd: 0, order: 66 });
  ringAt(fx, p, col, { from: 10, to: big ? 150 : 110, life: 18, order: 66 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    fx.particles.spawn({ x: p.x, y: p.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, drag: 0.9, image: i % 2 ? 'star' : 'sparkle', color: i % 3 === 0 ? col : [255, 255, 255], additive: true, size: 14, sizeEnd: 4, life: 22, alpha: 1, alphaEnd: 0, order: 67 });
  }
}

/** El Pokémon sale de la Ball: crece desde el punto de la Ball, blanco → color normal, grito. */
export async function emerge(fx, sprite, ballPoint, { cry = true } = {}) {
  if (!sprite) return;
  sprite.visible = true;
  sprite.resetFx();
  const a = sprite.anchor;
  const dy0 = ballPoint.y - a.y;
  const dx0 = ballPoint.x - a.x;
  sprite.color = [1, 1, 1, 1];
  await fx.tasks.tween(fx.minimal ? 6 : 12, (k) => {
    sprite.scaleX = k;
    sprite.scaleY = k;
    sprite.offX = dx0 * (1 - k);
    sprite.offY = dy0 * (1 - k) * 0.6;
  }, Ease.outBack);
  sprite.scaleX = 1; sprite.scaleY = 1; sprite.offX = 0; sprite.offY = 0;
  if (cry) fx.cry(sprite.index);
  await fx.tasks.tween(fx.minimal ? 4 : 10, (k) => { sprite.color = [1, 1, 1, 1 - k]; });
  sprite.color = [1, 1, 1, 0];
}

/** Retirada: el Pokémon se tiñe del color de la Ball y encoge hacia ella. */
export async function recall(fx, sprite, ball = 'POKEBALL') {
  if (!sprite || !sprite.visible) return;
  const col = ballColor(ball).map((v) => v / 255);
  fx.se('recall');
  await fx.tasks.tween(fx.minimal ? 6 : 14, (k) => {
    sprite.color = [...col, Math.min(1, k * 2)];
    sprite.scaleX = 1 - k;
    sprite.scaleY = 1 - k;
    sprite.offY = -sprite.height * 0.3 * k;
  }, Ease.inQuad);
  sprite.visible = false;
  sprite.resetFx();
}

/**
 * Captura completa. shakes = -1 bloqueada por el entrenador; 0..3 escapa; 4 = capturado.
 * `from` = punto de lanzamiento. Devuelve cuando termina (la Ball queda en el suelo si se captura).
 */
export async function captureSequence(fx, { ball, sprite, target, shakes, caught, critical, from }) {
  const center = sprite ? sprite.center : target;
  const ground = sprite ? { x: sprite.anchor.x, y: sprite.anchor.y - 14 } : { x: target.x, y: target.y + 40 };
  const b = fx.ballSprite();
  await b.load(ball);
  fx.se(critical ? 'ball_throw_critical' : 'ball_throw');
  fx.cam.to('focusFoe', 0.08);
  await throwArc(fx, b, from, { x: center.x, y: center.y - 20 }, { frames: 26, height: 90 });
  fx.se('ball_hit');
  if (shakes < 0) {
    // Bloqueada: rebota y cae fuera
    await fx.tasks.tween(20, (k) => { b.x = lerp(center.x, center.x - 70, k); b.y = lerp(center.y - 20, center.y + 60, k) - Math.sin(Math.PI * k) * 50; b.frame = k * 10; });
    b.visible = false;
    b.dispose();
    return;
  }
  // Rebote hacia arriba, apertura y absorción
  await fx.tasks.tween(10, (k) => { b.y = center.y - 20 - Math.sin(Math.PI * k * 0.5) * 30; b.x = center.x - 10 * k; });
  b.open = true;
  const bp = { x: b.x, y: b.y };
  ballBurst(fx, bp, ball);
  if (sprite) {
    const col = ballColor(ball).map((v) => v / 255);
    await fx.tasks.tween(fx.minimal ? 8 : 18, (k) => {
      sprite.color = [...col, Math.min(1, k * 2)];
      sprite.scaleX = 1 - k;
      sprite.scaleY = 1 - k;
      sprite.offX = (bp.x - sprite.anchor.x) * k;
      sprite.offY = (bp.y - sprite.anchor.y) * k;
    }, Ease.inQuad);
    sprite.visible = false;
    sprite.resetFx();
  }
  fx.se('ball_absorb');
  await fx.tasks.wait(6);
  b.open = false;
  // Caída con botes
  const y0 = b.y;
  await fx.tasks.tween(14, (k) => { b.y = lerp(y0, ground.y, Ease.inQuad(k)); b.x = lerp(bp.x, ground.x, k); });
  for (const h of [22, 10, 4]) {
    fx.se('ball_drop');
    await fx.tasks.tween(10, (k) => { b.y = ground.y - Math.sin(Math.PI * k) * h; });
  }
  await fx.tasks.wait(16);
  // Sacudidas
  const n = Math.min(3, caught ? 3 : shakes);
  for (let i = 0; i < n; i++) {
    fx.se('ball_shake');
    await fx.tasks.tween(16, (k) => { b.rot = Math.sin(k * Math.PI * 2) * 0.45; b.x = ground.x + Math.sin(k * Math.PI * 2) * 4; });
    b.rot = 0;
    await fx.tasks.wait(22);
  }
  if (caught) {
    fx.se('ball_click');
    if (!fx.minimal) {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.6;
        fx.particles.spawn({ x: ground.x, y: ground.y - 10, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, ay: 0.05, image: 'cell:twinkle', color: [255, 255, 255], size: 150, life: 34, alpha: 1, alphaEnd: 0, order: 68 });
        fx.particles.spawn({ x: ground.x, y: ground.y - 10, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6, image: 'star', color: [255, 240, 150], additive: true, size: 16, life: 30, alpha: 1, alphaEnd: 0, order: 68 });
      }
    }
    await fx.tasks.tween(20, (k) => { b.color = [0, 0, 0, 0.35 * k]; });
    fx.caughtBall = b;
    return;
  }
  // Escapa
  b.open = true;
  ballBurst(fx, { x: b.x, y: b.y - 8 }, ball, { big: true });
  if (sprite) await emerge(fx, sprite, { x: b.x, y: b.y }, { cry: false });
  b.visible = false;
  b.dispose();
}
