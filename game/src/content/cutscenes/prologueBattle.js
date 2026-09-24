// Planos del prólogo en la explanada de montana_portal (guion B01 §1):
//   P-03     cientos de luces verdes convergen y forman a Zygarde Forma Completa (hexágonos #B9FF66).
//   Montaje  "Primer día" (atardecer), "Segundo día" (lluvia, luz gris), "Tercera noche" (luna, tono azul):
//            destellos, temblores, rocas que caen, la cascada cambiando; Zygarde cada vez más oscuro/tembloroso.
//   P-04     Zygarde devuelve a Giratina al aljibe, el portal se apaga; Zygarde pierde cohesión y se deshace en
//            100 destellos pequeños y 5 mayores que se alejan hacia el cielo.
import { engine } from '../../core/engine.js';
import { SPOTS } from '../maps/b01/montana_portal.js';
import { rand } from './cineGfx.js';
import { sfx, cry, bgm, stopBgm, SFX } from './prologueAudio.js';
import { VIOLET, GREEN, ALJIBE, ALJIBE_STATE, front, back, px } from './prologueMountain.js';

const TILE = 32;
// Encuadre de la explanada (estilo combate BW: Zygarde de espaldas abajo a la izquierda, Giratina arriba).
const VIEW = { x: SPOTS.plaza.x, y: SPOTS.plaza.y - 2 };
const GIRA = { x: px(20) + 16, y: 41.3 * TILE };
const ZYG = { x: px(13) + 16, y: 47.5 * TILE };
const ZYG_CORE = { x: ZYG.x, y: ZYG.y - 150 };
const GIRA_CORE = { x: GIRA.x, y: GIRA.y - 100 };

/** Luces verdes que llegan desde fuera del encuadre hasta `target`. */
function convergeMotes(field, target, n) {
  const cx = px(VIEW.x);
  const cy = px(VIEW.y);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(330, 520);
    field.spawn({
      x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8, vx: rand(-1, 1), vy: rand(-1, 1), drag: 0.93,
      size: Math.random() < 0.2 ? 6 : 4, life: 400, color: GREEN, alpha: rand(0.6, 1), fadeIn: 10,
      target: { x: target.x + rand(-30, 30), y: target.y + rand(-60, 60), k: rand(0.004, 0.008), kill: 14 },
    });
  }
}

/** Choque de energías en el punto medio. */
async function clash(d, set, { strength = 1, zyg, gira }) {
  const mid = { x: (ZYG_CORE.x + GIRA_CORE.x) / 2, y: (ZYG_CORE.y + GIRA_CORE.y) / 2 };
  const bz = set.beam(GREEN, { width: 22 * strength });
  const bg = set.beam(VIOLET, { width: 26 * strength });
  bz.from = { ...ZYG_CORE };
  bz.to = mid;
  bg.from = { ...GIRA_CORE };
  bg.to = mid;
  bz.progress = 0;
  bg.progress = 0;
  sfx(SFX.clash, { volume: 80 });
  await Promise.all([d.tween(bz, { progress: 1 }, 10, 'in'), d.tween(bg, { progress: 1 }, 10, 'in')]);
  const spark = set.glow([255, 255, 255], { w: 40, h: 40 });
  spark.x = mid.x;
  spark.y = mid.y;
  set.flash([255, 255, 255], 0.3 * strength, 14);
  set.shake(6 * strength, 8, 26);
  sfx(SFX.clash2);
  zyg.jitter += 1;
  gira.jitter += 1;
  await d.tween(spark, { w: 170 * strength, h: 170 * strength, alpha: 0 }, 26, 'out');
  zyg.jitter -= 1;
  gira.jitter -= 1;
  set.remove(spark);
  await Promise.all([d.tween(bz, { alpha: 0 }, 12, 'linear'), d.tween(bg, { alpha: 0 }, 12, 'linear')]);
  set.remove(bz);
  set.remove(bg);
}

/** Rocas que caen sobre la explanada (Object rock de Añil: fila 0 entera, filas 1–3 al romperse). */
async function fallingRocks(d, set, n = 3) {
  const url = engine.assets.anil('Graphics/Characters/Object rock.png');
  const jobs = [];
  for (let i = 0; i < n; i++) {
    const tx = px(Math.round(rand(VIEW.x - 6, VIEW.x + 6)));
    const ty = px(Math.round(rand(VIEW.y - 3, VIEW.y + 4)));
    jobs.push((async () => {
      await d.wait(i * 14);
      const rock = await set.sprite({ url, frameW: 32, frameH: 32, frame: 0, scale: 2, order: 90000 });
      rock.x = tx;
      rock.y = ty - 420;
      await d.tween(rock, { y: ty + 16 }, 34, 'in');
      sfx(SFX.rockHit, { volume: 70 });
      set.shake(4, 8, 14);
      for (const row of [1, 2, 3]) {
        rock.o.row = row;
        await d.wait(5);
      }
      await d.tween(rock, { opacity: 0 }, 20, 'linear');
      set.remove(rock);
    })());
  }
  await Promise.all(jobs);
}

/**
 * Coloca los actores sin animación para empezar el prólogo a mitad (ruta de desarrollo ?scene=prologue&shot=).
 * shot: 'p03' (Giratina sobre el aljibe) · 'montaje' | 'p04' (además Zygarde en la explanada).
 */
export async function stageActors(set, shot) {
  set.setAljibe(ALJIBE_STATE.violet);
  const halo = set.glow(VIOLET, { w: 220, h: 150, alpha: 0.5 });
  halo.x = ALJIBE.x;
  halo.y = ALJIBE.holeY;
  const giratina = await set.spriteFirst([front('GIRATINA_1'), front('GIRATINA')], {});
  giratina.x = ALJIBE.x;
  giratina.y = ALJIBE.rimY - 60;
  const out = { giratina, halo, spray: null, motes: set.particles({ max: 50 }) };
  if (shot === 'p03') return out;
  giratina.x = GIRA.x;
  giratina.y = GIRA.y;
  const zyg = await set.spriteFirst([back('ZYGARDE_2'), back('ZYGARDE_3'), back('ZYGARDE')], { order: 100001 });
  zyg.x = ZYG.x;
  zyg.y = ZYG.y;
  set.cut(VIEW.x, VIEW.y);
  bgm('prologue', { fadeIn: 10 });
  return { ...out, zyg };
}

/** P-03: Giratina baja a la explanada; las luces verdes forman a Zygarde Forma Completa. */
export async function shotZygarde(d, set, giratina) {
  await set.fadeOut(40);
  set.cut(VIEW.x, VIEW.y);
  giratina.x = GIRA.x;
  giratina.y = GIRA.y;
  const hover = d.every((f) => { giratina.y = GIRA.y + Math.sin(f / 24) * 5; });
  await set.fadeIn(40);
  cry('GIRATINA', 1, { volume: 70 });
  set.shake(4, 6, 40);
  await d.wait(60);

  const motes = set.particles({ max: 520, shape: 'hex' });
  sfx(SFX.gather);
  const gather = d.every((f) => { if (f % 2 === 0) convergeMotes(motes, ZYG_CORE, 4); });
  await d.wait(150);
  sfx(SFX.gather);
  await d.wait(60);
  gather();
  const core = set.glow(GREEN, { w: 10, h: 10 });
  core.x = ZYG_CORE.x;
  core.y = ZYG_CORE.y;
  sfx(SFX.form);
  await d.tween(core, { w: 120, h: 170, alpha: 0.85 }, 60, 'out');
  // hexágonos que se expanden y Zygarde toma forma
  for (let i = 0; i < 3; i++) {
    const r = set.ring(GREEN, { w: 40, h: 40, width: 0.1 });
    r.x = ZYG_CORE.x;
    r.y = ZYG_CORE.y;
    d.tween(r, { w: 380, h: 300, alpha: 0 }, 40, 'out').then(() => set.remove(r)).catch(() => {});
    await d.wait(12);
  }
  const zyg = await set.spriteFirst([back('ZYGARDE_2'), back('ZYGARDE_3'), back('ZYGARDE')], { order: 100001 });
  zyg.x = ZYG.x;
  zyg.y = ZYG.y;
  zyg.opacity = 0;
  zyg.tint = [0.75, 1, 0.4, 1];
  set.flash(GREEN, 0.4, 30);
  bgm('prologue', { fadeIn: 10, restart: true });
  await Promise.all([d.tween(zyg, { opacity: 1 }, 24, 'out'), d.tween(core, { alpha: 0 }, 40, 'linear')]);
  set.remove(core);
  cry('ZYGARDE', 2);
  await d.tween(zyg.tint, { 3: 0 }, 40, 'out');
  set.shake(6, 6, 40);
  await d.wait(50);
  cry('GIRATINA', 1);
  set.shake(8, 8, 40);
  await d.wait(60);
  hover();
  return { zyg, motes };
}

/** Montaje: dos días y la tercera noche. */
export async function shotMontage(d, set, { giratina, zyg, motes }) {
  const hover = d.every((f) => { giratina.y = GIRA.y + Math.sin(f / 24) * 5; });
  const spray = set.particles({ max: 220, shape: 'round' });
  const days = [
    { text: 'Primer día', hour: [18, 30], tone: [30, -8, -40, 0], weather: 'none', dark: 0.12, jitter: 0 },
    { text: 'Segundo día', hour: [13, 0], tone: [-34, -30, -18, 50], weather: 'rain', dark: 0.3, jitter: 1, waterfall: true },
    { text: 'Tercera noche', hour: [0, 30], tone: [-8, 4, 30, 6], weather: 'none', dark: 0.5, jitter: 2, moon: true },
  ];
  let moon = null;
  for (const day of days) {
    await set.fadeOut(30);
    set.setTime(...day.hour);
    await set.weather(day.weather, 7);
    set.tone(day.tone, 1);
    if (day.moon) moon = set.map.effects.add('moon', { x: 430, y: 62, radius: 34 });
    zyg.tint = [0.05, 0.08, 0.05, day.dark];
    zyg.jitter = day.jitter;
    d.caption(day.text, { frames: 200 });
    await set.fadeIn(30);
    await d.wait(30);
    await clash(d, set, { strength: 1, zyg, gira: giratina });
    await Promise.all([fallingRocks(d, set, 3), clash(d, set, { strength: 1.2, zyg, gira: giratina })]);
    if (day.waterfall) {
      // la cascada, crecida y agitada
      set.cut(36, 38);
      sfx(SFX.waterfall2);
      set.shake(6, 7, 70);
      const burst = d.every(() => set.spray(spray, 6));
      await d.wait(80);
      burst();
      set.cut(VIEW.x, VIEW.y);
    }
    await clash(d, set, { strength: 1.4, zyg, gira: giratina });
    await d.wait(30);
  }
  hover();
  motes.clear();
  return { moon };
}

/** P-04 (mapa): Zygarde devuelve a Giratina al aljibe; el portal se apaga; Zygarde se deshace en luz. */
export async function shotVictory(d, set, { giratina, zyg, halo, moon }) {
  // la luna (efecto de cielo en pantalla) se retira antes de mover la cámara
  if (moon) moon.remove(30);
  // empuje final
  zyg.jitter = 0;
  sfx(SFX.form);
  await d.tween(zyg.tint, { 0: 0.8, 1: 1, 2: 0.5, 3: 0.55 }, 30, 'out');
  const wave = set.ring(GREEN, { w: 40, h: 40, width: 0.14 });
  wave.x = ZYG_CORE.x;
  wave.y = ZYG_CORE.y;
  set.flash(GREEN, 0.4, 30);
  set.shake(10, 8, 50);
  sfx(SFX.shadowForce2);
  d.tween(wave, { w: 1100, h: 900, alpha: 0 }, 60, 'out').then(() => set.remove(wave)).catch(() => {});
  cry('GIRATINA', 1, { pitch: 85 });
  giratina.tint = [1, 1, 1, 0.7];
  await d.tween(giratina, { y: GIRA.y - 70 }, 30, 'out');
  d.tween(giratina.tint, { 3: 0 }, 30, 'linear');
  // la cámara sube la escalinata detrás de Giratina, empujado por la luz verde
  const trail = set.particles({ max: 200, shape: 'hex' });
  const push = d.every(() => trail.spawn({ x: giratina.x + rand(-60, 60), y: giratina.y + rand(-20, 30), vy: rand(-0.5, 0.5), size: 4, life: 40, color: GREEN }));
  await Promise.all([
    set.pan(SPOTS.aljibeCenter.x, SPOTS.aljibeCenter.y + 1, 240),
    d.tween(giratina, { x: ALJIBE.x, y: ALJIBE.rimY - 40 }, 240, 'inOut'),
  ]);
  push();
  set.setAljibe(ALJIBE_STATE.open);
  d.tween(halo, { w: 320, h: 220, alpha: 1 }, 30, 'out');
  set.shake(6, 7, 100);
  sfx(SFX.shadowForce);
  await d.tween(giratina, { y: ALJIBE.rimY }, 30, 'in');
  await d.tween(giratina, { crop: 0 }, 90, 'in');
  set.remove(giratina);
  // sellado verde y el portal se apaga
  set.setAljibe(ALJIBE_STATE.seal);
  halo.setColor(GREEN);
  set.flash(GREEN, 0.5, 40);
  sfx(SFX.seal);
  await d.wait(70);
  stopBgm(80);
  set.setAljibe(ALJIBE_STATE.off);
  await d.tween(halo, { alpha: 0 }, 60, 'linear');
  set.remove(halo);
  await d.wait(50);

  // Zygarde, inmóvil, pierde cohesión
  await set.fadeOut(40);
  set.cut(VIEW.x, VIEW.y);
  zyg.tint = [0.05, 0.08, 0.05, 0.45];
  zyg.speed = 0; // inmóvil
  await set.fadeIn(40);
  await d.wait(60);
  zyg.jitter = 1;
  await d.wait(40);
  zyg.jitter = 2;
  const sparks = set.particles({ max: 400, shape: 'hex' });
  const emit = (big) => {
    sparks.spawn({
      x: ZYG.x + rand(-80, 80), y: ZYG.y - rand(20, 220), vx: rand(-1, 1), vy: rand(-2.6, -0.7), ay: -0.035, drag: 0.99,
      size: big ? 16 : 6, life: big ? 220 : 170, color: big ? [230, 255, 190] : GREEN, alpha: 1, fadeIn: 8,
    });
  };
  sfx(SFX.scatter);
  set.flash(GREEN, 0.35, 40);
  // 100 destellos pequeños (células) que se desprenden mientras el cuerpo se deshace
  let shedCount = 0;
  const shed = d.every(() => {
    if (shedCount >= 100) return false;
    emit(false);
    shedCount += 1;
    return true;
  });
  await Promise.all([d.tween(zyg, { opacity: 0 }, 100, 'in'), d.tween(zyg.tint, { 0: 0.6, 1: 1, 2: 0.4, 3: 0.8 }, 100, 'linear')]);
  shed();
  while (shedCount < 100) { emit(false); shedCount += 1; }
  set.remove(zyg);
  // y 5 mayores (núcleos)
  sfx(SFX.scatter, { pitch: 80 });
  set.flash(GREEN, 0.3, 30);
  for (let i = 0; i < 5; i++) emit(true);
  await d.wait(130);
  await set.fadeOut(50);
}
