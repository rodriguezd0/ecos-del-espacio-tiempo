// P-01 · Mundo Distorsión (guion B01 §1; biblia §4). Dialga (izquierda) y Palkia (derecha) frente a Giratina
// (Forma Origen). Tres intercambios como destellos de color (acero-azul, rosa-nacarado contra sombra), temblores;
// Dialga y Palkia se desvanecen hacia el fondo, derrotados; Giratina ruge y rasga el espacio. Sin texto.
import { engine } from '../../core/engine.js';
import { sfx, cry, bgm, stopBgm, SFX } from './prologueAudio.js';
import { rand } from './cineGfx.js';

const front = (id) => engine.assets.anil(`Graphics/Pokemon/Front/${id}.png`);

const STEEL = [120, 170, 255];
const PEARL = [255, 180, 225];
const SHADOW = [150, 60, 210];
const GROUND = 334; // línea de apoyo de Dialga y Palkia (px de pantalla)
const GIRA_Y = 236; // Giratina flota al fondo, entre ambos

/** Carga un sprite probando varias rutas (p. ej. Forma Origen y, si falta, Alterada). */
async function spriteFirst(stage, urls, opts) {
  let lastErr = null;
  for (const url of urls) {
    try {
      return await stage.sprite({ ...opts, url });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Sin sprite');
}

/** Parpadeo de impacto: blanco → normal. */
async function hitBlink(d, s, color = [1, 1, 1]) {
  s.tint = [...color, 0.85];
  await d.wait(4);
  s.tint = [0, 0, 0, 0];
  await d.wait(3);
  s.tint = [...color, 0.6];
  await d.wait(3);
  s.tint = [0, 0, 0, 0];
}

/** Proyectil/haz de `from` a `to`: carga, disparo, impacto. */
async function attack(d, stage, { from, to, color, width = 26, sound, flash = 0.55 }) {
  const charge = stage.glow(color, { w: 8, h: 8 });
  charge.x = from.x;
  charge.y = from.y;
  await d.tween(charge, { w: 70, h: 70 }, 18, 'out');
  const beam = stage.beam(color, { width });
  beam.from = from;
  beam.to = to;
  beam.progress = 0;
  if (sound) sfx(sound);
  await d.tween(beam, { progress: 1 }, 9, 'in');
  stage.flashScreen(color, flash, 16);
  stage.shake(9, 24);
  const burst = stage.glow(color, { w: 30, h: 30 });
  burst.x = to.x;
  burst.y = to.y;
  d.tween(burst, { w: 150, h: 150, alpha: 0 }, 26, 'out').then(() => stage.remove(burst)).catch(() => {});
  await d.tween(charge, { alpha: 0 }, 8, 'linear');
  stage.remove(charge);
  await d.tween(beam, { alpha: 0, width: 4 }, 14, 'in');
  stage.remove(beam);
}

export async function shotDistortion(d, stage) {
  await stage.setMode('distortion');
  stage.fade.a = 1;
  stage.bg.bright = 0.55;
  stopBgm(20);
  const dialga = await stage.sprite({ url: front('DIALGA'), order: 100 });
  const palkia = await stage.sprite({ url: front('PALKIA'), order: 100 });
  const giratina = await spriteFirst(stage, [front('GIRATINA_1'), front('GIRATINA')], { order: 50 });
  dialga.flip = true; // mira hacia el centro
  dialga.x = -120;
  dialga.y = GROUND;
  dialga.opacity = 0;
  palkia.x = 632;
  palkia.y = GROUND;
  palkia.opacity = 0;
  giratina.x = 256;
  giratina.y = GIRA_Y;
  giratina.opacity = 0;
  giratina.tint = [0, 0, 0, 1];
  const bob = d.every((f) => {
    giratina.y = GIRA_Y + Math.sin(f / 26) * 4;
    dialga.y = GROUND + Math.sin(f / 31) * 1.5;
    palkia.y = GROUND + Math.sin(f / 29 + 1) * 1.5;
  });

  sfx(SFX.wind, { volume: 70 });
  d.tween(stage.bg, { bright: 1 }, 120, 'out');
  await d.tween(stage.fade, { a: 0 }, 70, 'out');
  await d.wait(50);

  // Dialga y Palkia entran desde los lados
  cry('DIALGA');
  await d.tween(dialga, { x: 116, opacity: 1 }, 42, 'out');
  cry('PALKIA');
  await d.tween(palkia, { x: 396, opacity: 1 }, 42, 'out');
  await d.wait(30);

  // Giratina surge de la penumbra
  sfx(SFX.rumble, { volume: 70 });
  stage.shake(3, 60);
  await d.tween(giratina, { opacity: 1 }, 50, 'in');
  bgm('prologue', { fadeIn: 30 });
  cry('GIRATINA', 1);
  stage.flashScreen(SHADOW, 0.45, 24);
  await d.tween(giratina.tint, { 3: 0 }, 30, 'out');
  await d.wait(40);

  const mouthD = () => ({ x: dialga.x + 30, y: dialga.y - 120 });
  const mouthP = () => ({ x: palkia.x - 30, y: palkia.y - 116 });
  const coreG = () => ({ x: giratina.x, y: giratina.y - 96 });

  // 1: Dialga (acero-azul) contra sombra
  await attack(d, stage, { from: mouthD(), to: coreG(), color: STEEL, sound: SFX.steel });
  await hitBlink(d, giratina);
  await attack(d, stage, { from: coreG(), to: mouthD(), color: SHADOW, width: 34, sound: SFX.shadow });
  await hitBlink(d, dialga, [0.6, 0.3, 0.9]);
  await d.wait(16);

  // 2: Palkia (rosa nacarado) contra sombra
  await attack(d, stage, { from: mouthP(), to: coreG(), color: PEARL, width: 20, sound: SFX.pearl });
  sfx(SFX.slash);
  await hitBlink(d, giratina);
  await attack(d, stage, { from: coreG(), to: mouthP(), color: SHADOW, width: 34, sound: SFX.shadowClaw });
  await hitBlink(d, palkia, [0.6, 0.3, 0.9]);
  await d.wait(16);

  // 3: ataque conjunto y respuesta devastadora de Giratina
  sfx(SFX.timeRoar);
  await Promise.all([
    attack(d, stage, { from: mouthD(), to: coreG(), color: STEEL, width: 30, flash: 0.35 }),
    attack(d, stage, { from: mouthP(), to: coreG(), color: PEARL, width: 24, flash: 0.35 }),
  ]);
  await hitBlink(d, giratina);
  giratina.jitter = 2;
  await d.wait(20);
  giratina.jitter = 0;
  sfx(SFX.shadowForce2);
  const wave = stage.ring(SHADOW, { w: 20, h: 20, width: 0.16 });
  wave.x = coreG().x;
  wave.y = coreG().y;
  stage.flashScreen(SHADOW, 0.7, 30);
  stage.shake(14, 50);
  d.tween(wave, { w: 900, h: 900, alpha: 0 }, 48, 'out').then(() => stage.remove(wave)).catch(() => {});
  await Promise.all([hitBlink(d, dialga, [0.6, 0.3, 0.9]), hitBlink(d, palkia, [0.6, 0.3, 0.9])]);
  await d.wait(30);

  // Dialga y Palkia retroceden y se desvanecen hacia el fondo
  cry('DIALGA', 0, { faint: true });
  cry('PALKIA', 0, { faint: true });
  await Promise.all([
    d.tween(dialga, { x: 196, scaleMul: 0.5, opacity: 0 }, 100, 'in'),
    d.tween(palkia, { x: 316, scaleMul: 0.5, opacity: 0 }, 100, 'in'),
    d.tween(dialga.tint, { 3: 0.6 }, 60, 'linear'),
    d.tween(palkia.tint, { 3: 0.6 }, 60, 'linear'),
  ]);
  stage.remove(dialga);
  stage.remove(palkia);
  stopBgm(90);
  await d.wait(40);

  // Giratina ruge y rasga el espacio: una grieta horizontal se abre bajo él
  bob();
  cry('GIRATINA', 1, { pitch: 90 });
  giratina.jitter = 3;
  stage.shake(10, 80);
  sfx(SFX.quake);
  await d.wait(50);
  giratina.jitter = 0;
  const rift = stage.rift(SHADOW, { w: 380, h: 70, order: 40 });
  rift.x = 256;
  rift.y = 292;
  sfx(SFX.shadowForce);
  stage.flashScreen([255, 255, 255], 0.5, 20);
  await d.tween(rift, { open: 1 }, 50, 'out');
  for (let i = 0; i < 18; i++) stage.motes.spawn({ x: rand(120, 392), y: 292, vx: rand(-1, 1), vy: rand(-2.4, -0.6), size: 4, life: 70, color: [210, 170, 255] });
  await d.wait(30);
  // Giratina se lanza a la grieta
  await d.tween(giratina, { y: 360, scaleMul: 0.65, opacity: 0.2 }, 45, 'in');
  giratina.opacity = 0;
  stage.flashScreen([255, 255, 255], 1, 40);
  sfx(SFX.shadowForce2);
  await d.tween(rift, { open: 0 }, 30, 'in');
  await d.tween(stage.fade, { a: 1 }, 40, 'linear');
  stage.remove(rift);
  stage.remove(giratina);
}
