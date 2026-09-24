// Secuencias de presentación del combate (entrada, envíos, cambios, debilitados, daño, PS, EXP, capturas).
// Funciones async que animan la BattleScene; las llama SceneBattleUI al procesar la cola del motor.
import { Ease, lerp } from './timeline.js';
import { throwArc, ballBurst, emerge, recall, captureSequence } from './fx/ballAnims.js';
import { hitReact, impactAt } from './fx/primitives.js';
import { shinyAnimation } from './fx/commonAnims.js';
import { hpAnimFrames, expFraction, expAnimFrames } from './hud/bars.js';
import { battlerPosition, SCREEN_W } from './layout.js';

const HIT_SE = ['hit_normal', 'hit_weak', 'hit_super'];

/** Entrada: la escena aparece desde negro con el fondo y las bases deslizándose; cámara BW2. */
export async function introSequence(scene, snapshot) {
  const { field, tasks } = scene;
  const wild = snapshot.type === 'wild';
  const player = scene.trainers.player;
  if (player) player.visible = true;
  for (const t of scene.trainers.foe) t.visible = true;
  const foes = wild ? snapshot.battlers.filter((b) => b && b.side === 1) : [];
  await Promise.all(foes.map(async (v) => {
    const s = scene.battlers[v.index];
    await s.setPokemon(v);
    s.visible = true;
    s.tone = [-0.32, -0.32, -0.32];
    scene.boxes[v.index].setView(v);
  }));
  if (scene.minimal) {
    field.cam.snap('default');
    await scene.fadeTo(0, 10);
  } else {
    field.cam.snap(wild ? 'introFoe' : 'introTrainer');
    const slide = (k) => {
      const d = (1 - Ease.outCubic(k)) * SCREEN_W;
      field.setBaseOffset(0, d, 0);
      field.setBaseOffset(1, -d, 0);
      if (player) player.offX = d;
      for (const t of scene.trainers.foe) t.offX = -d;
      for (const v of foes) scene.battlers[v.index].offX = -d;
    };
    slide(0);
    await Promise.all([scene.fadeTo(0, 14), tasks.tween(30, slide)]);
    for (const v of foes) scene.battlers[v.index].offX = 0;
  }
  if (wild) {
    // Los salvajes recuperan el color con un destello y gritan (Intro2)
    await tasks.tween(8, (k) => { for (const v of foes) scene.battlers[v.index].tone = [-0.32 * (1 - k), -0.32 * (1 - k), -0.32 * (1 - k)]; });
    if (!scene.minimal) {
      tasks.tween(16, (k) => { for (const v of foes) scene.battlers[v.index].color = [1, 1, 1, 0.9 * (1 - k)]; });
      scene.screen.flashScreen([255, 255, 255], 90, 12);
    }
    for (const [i, v] of foes.entries()) {
      await tasks.wait(i * 8);
      scene.cry(v.index);
      if (v.shiny) shinyAnimation(scene.fx, v.index);
    }
    if (!scene.minimal) field.cam.to('default', 0.05);
    for (const v of foes) await slideBoxIn(scene, v.index);
  } else if (!scene.minimal) {
    field.cam.to('default', 0.05);
  }
  if (!wild) {
    scene.lineups[1].show(snapshot.partyCounts?.[1] || []);
    scene.lineups[0].show(snapshot.partyCounts?.[0] || []);
  }
  await tasks.wait(scene.minimal ? 4 : 16);
}

/** La caja de datos entra deslizándose desde su lado. */
export async function slideBoxIn(scene, index) {
  const box = scene.boxes[index];
  if (!box) return;
  const dir = index % 2 === 0 ? 1 : -1;
  box.visible = true;
  await scene.tasks.tween(8, (k) => { box.offX = (1 - k) * (SCREEN_W / 2) * dir; });
  box.offX = 0;
}

export async function slideBoxOut(scene, index) {
  const box = scene.boxes[index];
  if (!box || !box.visible) return;
  const dir = index % 2 === 0 ? 1 : -1;
  await scene.tasks.tween(8, (k) => { box.offX = k * (SCREEN_W / 2) * dir; });
  box.visible = false;
  box.offX = 0;
}

/** Envío de un Pokémon (inicio de combate o cambio). */
export async function sendOut(scene, view, { startBattle = false } = {}) {
  const s = scene.battlers[view.index];
  const box = scene.boxes[view.index];
  if (!s) return;
  const { tasks } = scene;
  await s.setPokemon(view);
  box?.setView(view);
  if (box) box.owned = scene.isOwned(view.species);
  if (view.wild) {
    s.visible = true;
    if (!box?.visible) await slideBoxIn(scene, view.index);
    return;
  }
  const side = view.side;
  const target = battlerPosition(view.index, scene.sideSizes[side]);
  const ballTo = { x: target.x, y: target.y - 60 };
  const ball = scene.ballSprite();
  await ball.load(scene.ballOf(view));
  let from;
  if (side === 0) {
    const tr = scene.trainers.player;
    if (startBattle && tr?.visible) {
      from = { x: tr.baseX + 40, y: tr.baseY - 120 };
      scene.lineups[0].hide();
      for (const f of [1, 2, 3, 4]) { tr.frame = f; await tasks.wait(3); }
      tasks.tween(16, (k) => { tr.offX = -SCREEN_W / 2 * Ease.inQuad(k); }).then(() => { tr.visible = false; tr.frame = 0; });
    } else from = { x: -10, y: 220 };
  } else {
    const tr = scene.trainers.foe[0];
    if (startBattle && tr?.visible) {
      from = { x: tr.baseX - 20, y: tr.baseY - 110 };
      scene.lineups[1].hide();
      tasks.tween(16, (k) => { tr.offX = (SCREEN_W / 2) * Ease.inQuad(k); tr.opacity = 1 - k; }).then(() => { tr.visible = false; tr.opacity = 1; });
    } else from = { x: SCREEN_W + 20, y: 40 };
  }
  scene.se('ball_throw');
  await throwArc(scene.fx, ball, from, ballTo, { frames: scene.minimal ? 10 : 22, height: side === 0 ? 90 : 50 });
  ball.open = true;
  ballBurst(scene.fx, ballTo, scene.ballOf(view));
  const emerging = emerge(scene.fx, s, ballTo);
  await tasks.wait(4);
  ball.visible = false;
  await emerging;
  if (view.shiny) await shinyAnimation(scene.fx, view.index);
  await slideBoxIn(scene, view.index);
}

/** Retirada de un Pokémon (cambio, Ida y Vuelta…). */
export async function withdraw(scene, view) {
  const s = scene.battlers[view.index];
  const box = slideBoxOut(scene, view.index);
  await recall(scene.fx, s, scene.ballOf(view));
  await box;
}

/** Debilitado: grito grave, el sprite se hunde y desaparece; la caja sale. */
export async function faintSequence(scene, view) {
  const s = scene.battlers[view.index];
  const { tasks } = scene;
  scene.cry(view.index, { faint: true });
  if (s) {
    await tasks.wait(scene.minimal ? 4 : 18);
    scene.se('faint');
    const h = s.height;
    await tasks.tween(scene.minimal ? 8 : 18, (k) => {
      s.offY = h * Ease.inQuad(k);
      s.clipV = 1.01 - Ease.inQuad(k) * 1.02;
      s.opacity = 1 - k * 0.5;
    });
    s.visible = false;
    s.resetFx();
  }
  await slideBoxOut(scene, view.index);
}

/** Golpe: sonido por eficacia, reacción del objetivo y barra de PS bajando. */
export async function damageSequence(scene, entries) {
  const { tasks } = scene;
  let best = 0;
  for (const e of entries) best = Math.max(best, e.effectiveness === 2 ? 2 : e.effectiveness === 1 ? 1 : 0);
  scene.se(HIT_SE[best]);
  const jobs = entries.map(async (e) => {
    const box = scene.boxes[e.battler.index];
    if (e.substitute) {
      impactAt(scene.fx, scene.fx.point(e.battler.index), { size: 40 });
      await tasks.wait(10);
      return;
    }
    const react = hitReact(scene.fx, e.battler.index, { strong: e.effectiveness === 2 });
    if (box) await animateBox(scene, box, e.from, e.to, e.battler);
    await react;
  });
  if (best === 2 && !scene.minimal) scene.field.cam.shake(5, 12);
  await Promise.all(jobs);
}

/** Anima los PS de una caja (valor inicial/final) y espera. */
export async function animateBox(scene, box, from, to, view) {
  if (view) box.setView({ ...view }, { keepHp: true });
  const frames = hpAnimFrames(from, to, view?.totalhp || box.view?.totalhp || 1);
  box.startHp(from, to, frames);
  await scene.tasks.until(() => !box.hpAnim, frames + 4);
}

/** Barra de EXP (varios tramos si sube de nivel). */
export async function expSequence(scene, battlerView, from, to, levelMin, levelMax) {
  const box = battlerView ? scene.boxes[battlerView.index] : null;
  if (!box || !box.visible || !box.layout.showExp) return;
  const f0 = expFraction(from, levelMin, levelMax);
  const f1 = expFraction(to, levelMin, levelMax);
  const frames = expAnimFrames(f0, f1);
  scene.se('exp_gain');
  box.startExp(f0, f1, scene.minimal ? Math.ceil(frames / 2) : frames);
  await scene.tasks.until(() => !box.expAnim, frames + 4);
  if (f1 >= 1) {
    scene.se('exp_full');
    await scene.tasks.wait(10);
  }
}

/** Captura (Battle#pbThrowPokeBall). */
export async function captureAnim(scene, { ball, shakes, caught, target, critical }) {
  const s = target ? scene.battlers[target.index] : null;
  const from = { x: -20, y: 250 };
  await captureSequence(scene.fx, { ball, sprite: s?.visible ? s : null, target: scene.fx.point(target?.index ?? 1), shakes, caught, critical, from });
  if (caught && target) {
    await slideBoxOut(scene, target.index);
  }
  scene.field.cam.to('default', 0.06);
}

/** El entrenador rival vuelve a escena (al final del combate). */
export async function trainerAppear(scene, idx = 0) {
  const tr = scene.trainers.foe[idx];
  if (!tr) return;
  tr.visible = true;
  tr.opacity = 1;
  await scene.tasks.tween(scene.minimal ? 6 : 14, (k) => { tr.offX = lerp(SCREEN_W / 4 + 64, 0, Ease.outCubic(k)); });
  tr.offX = 0;
}
