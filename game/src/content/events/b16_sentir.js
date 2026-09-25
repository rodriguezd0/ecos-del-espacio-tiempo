// Ala del Sentir — Mesprit, la emoción (docs/CAMPANA.md B16; D17; reglas puras en b16_mirror_logic.js):
//   · Tres salas de espejos: el reflejo del jugador se mueve invertido (izquierda ↔ derecha); hay que llevarlo hasta el
//     reflejo de Mesprit. Cada captura enseña una emoción de alguien del viaje: el orgullo de Leandro, la carga de
//     Fermín, el miedo de Fausto. La losa de eco devuelve el reflejo frente al jugador; los señuelos se deshacen.
//   · El último espejo: el recuerdo de Gael (mapa santuario_alma_recuerdo, b16_recuerdo.js).
//   · Cámara de Mesprit: «¿Qué le dirías?» (var b16_mesprit_respuesta, la usa B20) y la Hebra del Sentir.
import { F, V, SPEAKER, SPRITE, OBJ, TRIO_COLORS, MESPRIT_ANSWERS, lines, zygardeSays, when, eventById } from './b16_common.js';
import { MIRROR_ROOMS, MIRROR_DIR, MIRROR_X, ROOM_H, MIRROR_EMOTIONS, mirrorX } from './b16_mirror_logic.js';
import { SENTIR, PATIO, floorTop, mirrorCell } from '../maps/b16/santuario_layout.js';
import { RECUERDO_START, dismountForMemory } from './b16_recuerdo.js';

const FLAGS = [F.mirror1, F.mirror2, F.mirror3];

export const SENTIR_TEXT = Object.freeze({
  intro: 'Una sala partida por un cristal. Al otro lado estás tú… pero cuando das un paso a la izquierda, tu reflejo lo da a la derecha.',
  mesprit: 'Detrás del cristal, entre los reflejos, algo rosa se ríe y se esconde.',
  // Avisos breves (ui.toast: una línea corta)
  pad: 'Tu reflejo vuelve frente a ti.',
  decoy: 'Solo era un reflejo.',
  gateShut: 'Un cristal cierra la puerta. Mesprit sigue escondido en los reflejos de esta sala.',
  lastMirror: 'Un espejo enorme. No te devuelve tu reflejo, sino otro: un chico de Villa Alba que te da la espalda.',
  lastMirrorAfter: 'El gran espejo solo te devuelve tu reflejo. Y, al fondo, una pizca de rosa.',
});

// Emoción de cada captura (textos DECIDIDO-DEV; CAMPANA solo fija «el orgullo de Leandro, la carga de Fermín, el miedo
// de Fausto»: B04 «orgullo», B08 «carga familiar», B14 Fausto atrapado en un día de Antea que se repite).
const EMOTION_LINES = Object.freeze({
  1: Object.freeze({
    scene: 'En el cristal aparece Leandro, con el agua del Albo por la cintura, empujando una compuerta que no se mueve.',
    echo: 'Mi casa lleva trescientos años llevando el río a mano. No necesito que nadie me ayude.',
    mesprit: 'Orgullo. El de alguien que no deja que nadie le quite su río. Ni siquiera el río.',
  }),
  2: Object.freeze({
    scene: 'En el cristal aparece Fermín, de noche, sujetando con el hombro una viga de la mina mientras los demás salen.',
    echo: 'Se lo prometí a mi padre. Mientras yo aguante, aguanta la mina.',
    mesprit: 'Carga. La de quien lleva a la vez una promesa y una ciudad que se hunde, y no se lo cuenta a nadie.',
  }),
  3: Object.freeze({
    scene: 'En el cristal aparece Fausto, el buzo, bajo el agua de Antea, repitiendo los mismos gestos una y otra vez.',
    echo: 'Otra vez la misma mañana… otra vez…',
    mesprit: 'Miedo. El de alguien atrapado en un día que no termina.',
  }),
});

// ─────────────────────────────── Reflejo (evento paralelo) ───────────────────────────────

/** Casilla de rejilla (gx, gy) de una casilla del mapa dentro de la sala, o null. */
function toGrid(m, x, y) {
  const gx = x - m.room.x;
  const gy = y - floorTop(m.room);
  return gx >= 0 && gy >= 0 && gx < 17 && gy < ROOM_H ? { gx, gy } : null;
}

function placeReflection(ev, m, px, py) {
  const g = toGrid(m, px, py);
  if (!g) return;
  const c = mirrorCell(m.room, mirrorX(g.gx), g.gy);
  ev.moveTo(c.x, c.y);
  ev.direction = 8;
}

async function capture(ctx, m) {
  const n = m.n;
  const logic = MIRROR_ROOMS[n - 1];
  const t = mirrorCell(m.room, ...logic.target);
  const E = EMOTION_LINES[n];
  const who = MIRROR_EMOTIONS[n].who;
  ctx.se('PRSFX- Mirror Coat');
  await ctx.flash([255, 190, 214], 24, 190);
  ctx.cry('MESPRIT');
  const ghost = ctx.world.spawnEvent?.({ id: `eco_emocion_${n}`, x: t.x, y: t.y, sprite: SPRITE[who], through: true, dir: 4 });
  if (ghost) ghost.opacity = 150;
  await ctx.say(E.scene);
  await ctx.say(E.echo, { speaker: SPEAKER[who] });
  await ctx.say(E.mesprit, { speaker: SPEAKER.mesprit });
  if (ghost) ctx.world.removeEvent?.(ghost);
  ctx.setFlag(FLAGS[n - 1]);
  await ctx.say(n < 3 ? 'Mesprit se escurre por el cristal hacia la sala siguiente. La puerta del fondo se abre.' : 'Mesprit se escurre hacia el último espejo. La puerta del fondo se abre.');
  if (n === 1) await zygardeSays(ctx, 'Lo que sienten los demás también se guarda aquí.');
}

/** Guion paralelo del reflejo: sigue los pasos del jugador en espejo; al llegar a Mesprit, la captura. */
function reflectionMonitor(m) {
  const logic = MIRROR_ROOMS[m.n - 1];
  const target = mirrorCell(m.room, ...logic.target);
  const decoys = logic.decoys.map(([gx, gy]) => mirrorCell(m.room, gx, gy));
  return async (ctx) => {
    const ev = ctx.event;
    const p = ctx.player;
    const st = ev.b16 || (ev.b16 = { inside: false, last: null, pending: null, capturing: false });
    const g = toGrid(m, p.x, p.y);
    const inside = Boolean(g && g.gx < MIRROR_X);
    if (!inside) { st.inside = false; return; }
    if (!st.inside) {
      st.inside = true;
      st.last = [p.x, p.y];
      st.pending = null;
      placeReflection(ev, m, p.x, p.y);
      return;
    }
    const dx = p.x - st.last[0];
    const dy = p.y - st.last[1];
    if (dx || dy) {
      st.last = [p.x, p.y];
      if (Math.abs(dx) + Math.abs(dy) === 1) st.pending = MIRROR_DIR[dx === 1 ? 6 : dx === -1 ? 4 : dy === 1 ? 2 : 8];
      else { st.pending = null; placeReflection(ev, m, p.x, p.y); }
    }
    if (st.pending && !ev.busy()) {
      ev.setMoveSpeed(p.moveSpeed);
      ev.moveGeneric(st.pending);
      st.pending = null;
    }
    if (ev.busy()) return;
    for (const d of decoys) {
      const dec = eventById(ctx, `senuelo_${m.n}_${d.x}_${d.y}`);
      if (dec && !dec.erased && ev.x === d.x && ev.y === d.y) { ctx.se('PRSFX- Psych Up'); dec.erase(); ctx.ui?.toast?.(SENTIR_TEXT.decoy); }
    }
    if (!st.capturing && ev.x === target.x && ev.y === target.y && !ctx.flag(FLAGS[m.n - 1])) {
      st.capturing = true;
      ctx.scene?.runScript?.((c) => capture(c, m), ev, `espejo_${m.n}`);
    }
  };
}

function mirrorRoomEvents(m) {
  const n = m.n;
  const logic = MIRROR_ROOMS[n - 1];
  const solved = (s) => s.flag(FLAGS[n - 1]);
  const target = mirrorCell(m.room, ...logic.target);
  const start = mirrorCell(m.room, ...logic.reflection);
  const out = [];
  // El cristal: una columna de espejos sólidos (y su reflejo sube por la pared)
  for (let gy = -1; gy < ROOM_H; gy++) {
    const y = floorTop(m.room) + gy;
    out.push({ id: `espejo_${n}_${gy + 1}`, x: m.mirrorX, y, sprite: OBJ.mirror, dir: 2, stepAnime: true, solid: gy >= 0, through: gy < 0, directionFix: true });
  }
  out.push({
    id: `reflejo_${n}`, x: start.x, y: start.y, name: 'Reflejo',
    pages: [
      { when: (s) => !solved(s) && s.player.gender !== 'F', sprite: SPRITE.protagonistM, dir: 8, opacity: 170, trigger: 'parallel', script: reflectionMonitor(m), lock: false },
      { when: (s) => !solved(s) && s.player.gender === 'F', sprite: SPRITE.protagonistF, dir: 8, opacity: 170, trigger: 'parallel', script: reflectionMonitor(m), lock: false },
    ],
  });
  out.push({
    id: `mesprit_reflejo_${n}`, x: target.x, y: target.y, name: 'Mesprit',
    pages: [{ when: (s) => !solved(s), sprite: SPRITE.mesprit, dir: 2, opacity: 200, through: true, stepAnime: true, glow: { name: 'softLight', radius: 30, intensity: 0.5, pulse: 0.6, color: [...TRIO_COLORS.sentir] } }],
  });
  for (const [gx, gy] of logic.decoys) {
    const c = mirrorCell(m.room, gx, gy);
    out.push({ id: `senuelo_${n}_${c.x}_${c.y}`, x: c.x, y: c.y, pages: [{ when: (s) => !solved(s), sprite: SPRITE.mesprit, dir: 4, opacity: 90, through: true, stepAnime: true }] });
  }
  out.push({
    id: `losa_espejo_${n}`, x: m.reset.x, y: m.reset.y, trigger: 'touch', through: true,
    when: (s) => !solved(s),
    script: async (ctx) => {
      const ev = eventById(ctx, `reflejo_${n}`);
      if (!ev || !ev.page) return;
      placeReflection(ev, m, ctx.player.x, ctx.player.y);
      if (ev.b16) { ev.b16.pending = null; ev.b16.last = [ctx.player.x, ctx.player.y]; }
      ctx.se('PRSFX- Psych Up');
      ctx.ui?.toast?.(SENTIR_TEXT.pad);
    },
  });
  out.push({
    id: `cristal_puerta_${n}`, x: m.gate.warp.x, y: m.gate.warp.y,
    pages: [{ when: (s) => !solved(s), trigger: 'touch', script: async (ctx) => { await ctx.say(SENTIR_TEXT.gateShut); } }],
  });
  if (n === 1) {
    out.push({
      id: 'sentir_intro', x: m.entry.x, y: m.entry.y,
      pages: [{
        when: (s) => !s.flag('b16_sentir_intro'), trigger: 'auto',
        script: async (ctx) => {
          ctx.setFlag('b16_sentir_intro');
          await ctx.say(SENTIR_TEXT.intro);
          await ctx.say(SENTIR_TEXT.mesprit);
          await ctx.say('Atrápame con tu reflejo. Si te lías, pisa la losa.', { speaker: SPEAKER.mesprit });
        },
      }],
    });
  }
  return out;
}

// ─────────────────────────────── Último espejo y cámara de Mesprit ───────────────────────────────

async function enterMemory(ctx) {
  if (ctx.flag(F.memory)) { await ctx.say(SENTIR_TEXT.lastMirrorAfter); return; }
  await ctx.say(SENTIR_TEXT.lastMirror);
  await lines(ctx, SPEAKER.mesprit, [
    'Este espejo no es mío. Es de alguien que no está aquí y que salió de tu mismo pueblo.',
    'Lo verás desde dentro. Con sus pies. Aquí, lo que es izquierda para ti es derecha para él.',
  ]);
  if (!(await ctx.confirm('¿Asomarte al espejo?'))) return;
  await dismountForMemory(ctx); // dentro se lleva el aspecto de Gael: nada de montura
  ctx.se('PRSFX- Mirror Coat');
  await ctx.fade('out', 30, [255, 236, 244]);
  ctx.setVar('b16_recuerdo_fase', 0);
  await ctx.warp('santuario_alma_recuerdo', RECUERDO_START.x, RECUERDO_START.y, 8, { fade: false });
  await ctx.fade('in', 30);
}

function lastMirrorEvents() {
  const L = SENTIR.lastMirror;
  return [-1, 0, 1].map((dx) => ({
    id: `gran_espejo_${dx + 1}`, x: L.mirror.x + dx, y: L.mirror.y, name: 'Espejo',
    pages: [{ sprite: OBJ.mirror, dir: 2, stepAnime: true, directionFix: true, solid: true, trigger: 'action', script: enterMemory }],
  }));
}

async function mespritQuestion(ctx) {
  const M = SPEAKER.mesprit;
  ctx.cry('MESPRIT');
  await lines(ctx, M, [
    'Ese era su día. Lo has recorrido con sus pies, al revés de como tú lo viviste.',
    'Él oyó lo mismo que tú. Pidió permiso. Y esperó.',
    '¿Qué le dirías?',
  ]);
  const i = await ctx.choice(MESPRIT_ANSWERS.map((a) => a.text), { message: '¿Qué le dirías?' });
  const answer = MESPRIT_ANSWERS[Math.max(0, i)] || MESPRIT_ANSWERS[0];
  ctx.setVar(V.answer, answer.id);
  await ctx.say(`«${answer.text}.»`);
  await lines(ctx, M, [
    'No hay respuesta equivocada. Solo hay la tuya.',
    'Lo guardo. Algún día tendrás que decírselo tú, sin espejo de por medio.',
    'Toma. Sentir lo que otro sintió no te hace más débil. Te hace entero.',
  ]);
  ctx.se('PRSFX- Heal Bell');
  await ctx.flash([...TRIO_COLORS.sentir], 16, 160);
  await ctx.giveItem('EMOTIONTHREAD', 1);
  ctx.setFlag(F.sentir);
  await zygardeSays(ctx, 'Gael. …Otra hebra. Rosa.');
}

function mespritEvents() {
  const M = SENTIR.mesprit;
  return [
    {
      id: 'mesprit', x: M.mesprit.x, y: M.mesprit.y, name: SPEAKER.mesprit,
      pages: [{
        sprite: SPRITE.mesprit, dir: 2, stepAnime: true, solid: true, move: 'still',
        script: async (ctx) => {
          if (ctx.flag(F.sentir)) { await ctx.say('Lo que se siente se comparte. No se gasta.', { speaker: SPEAKER.mesprit }); return; }
          if (!ctx.flag(F.memory)) { await ctx.say('Aún te queda un espejo por mirar.', { speaker: SPEAKER.mesprit }); return; }
          await mespritQuestion(ctx);
        },
      }],
    },
    {
      id: 'mesprit_pregunta', x: M.arrive.x, y: M.arrive.y + 1,
      pages: [{ when: when({ all: [F.memory], none: [F.sentir] }), trigger: 'auto', script: mespritQuestion }],
    },
  ];
}

export function sentirEvents() {
  return [
    ...SENTIR.mirrors.flatMap(mirrorRoomEvents),
    { id: 'celula_alma_2', type: 'zygardeCell', cell: 'cell_alma_2', x: SENTIR.cell.x, y: SENTIR.cell.y },
    ...lastMirrorEvents(),
    ...mespritEvents(),
  ];
}

/** Warps del ala: salidas al patio, puertas entre espejos y hacia el último espejo. */
export function sentirWarps() {
  const front = PATIO.gates.sentir.front;
  const back = (x, y) => ({ x, y, dirTrigger: 2, to: 'santuario_alma', tx: front.x, ty: front.y, dir: 2 });
  const out = [];
  SENTIR.mirrors.forEach((m, i) => {
    out.push(back(m.exitBelow.x, m.exitBelow.y));
    const next = SENTIR.mirrors[i + 1];
    const to = next ? next.entry : SENTIR.lastMirror.entry.arrive;
    out.push({ x: m.gate.warp.x, y: m.gate.warp.y, to: 'santuario_alma', tx: to.x, ty: to.y, dir: 8 });
  });
  for (const s of [SENTIR.lastMirror.entry, SENTIR.mesprit.entry]) for (const e of s.exits) out.push(back(e.x, e.y));
  return out;
}
