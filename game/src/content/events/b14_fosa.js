// Fosa del Eco, cámara del núcleo del Pilar de los Ecos (docs/CAMPANA.md B14):
//   · Bramaluna Alfa (eco) anida aquí: combate final OBLIGATORIO (nivel 56, Energía Potenciadora, Paleosíntesis) con
//     la captura desactivada por rules.catchCondition («Es un eco: no hay nada que atrapar»). Victoria: el eco se
//     desestabiliza. Derrota: sin pérdida, de vuelta a la sala 4 junto al manantial de curación del eco.
//   · Núcleo: restorePillar(7) → Fragmento 7, verso VII, efecto local (mareas, hielo-eco, ferris, draga) e inscripción
//     de la pista T13. La Bramaluna pasa a ser REAL: visible en el nido, captura opcional (nivel 58, ratio 10),
//     reaparece al descansar si se debilita.
//   · Tras el P7, una corriente ascendente devuelve al jugador a Caleta Sonda.
// Módulo puro salvo los guiones.
import { FOSA, ROOM4, CALETA, roomMap } from '../maps/b14/layout.js';
import { F, V, SPRITE, MUSIC, COLOR, lines, zygardeSays, eventById, placePlayer, pause, bossBattle } from './b14_common.js';
import { BRAMALUNA_ECO, BRAMALUNA_REAL } from '../encounters/b14.js';
import { bigFernEvents } from '../maps/b14/paint.js';
import { pilarTone } from '../stamps/pilar.js';

export const CATCH_REASON = '¡La Poké Ball la atraviesa como si fuera bruma! Es un eco: no hay nada que atrapar.';

export const FOSA_TEXT = Object.freeze({
  enter: ['Su nido. Y debajo, el núcleo.', 'No es la guardiana de nada. Solo vive aquí… en un tiempo que ya no existe.'],
  wake: 'La Bramaluna Alfa se yergue en su nido y ruge. El eco entero tiembla.',
  wakeCore: 'No nos dejará pasar. Tendremos que hacerle frente.',
  lost: 'Has tenido que retirarte. Junto al manantial del eco, tu equipo recupera fuerzas.',
  won: 'La Bramaluna del eco se deshace en ondas verdes, como un reflejo en el agua que alguien ha tocado.',
  wonCore: 'El eco se rompe. El núcleo… ahora me oye.',
  coreBlocked: 'El núcleo late bajo una capa de eco espesa. Algo lo guarda.',
  coreCold: 'El núcleo guarda un calor tranquilo. El eco de la fosa se ha calmado.',
  coreIntro: 'Aquí. Todo lo que fue sigue sonando.',
  tides: 'Un rumor de mareas recorre la fosa… y se aquieta, como una respiración que por fin se acompasa.',
  north: 'Muy lejos, al norte, algo helado se afloja. Como un nudo que se deshace.',
  dredge: 'Arriba, en el arrecife, algo metálico cruje y se queda en silencio.',
  local: 'Las mareas vuelven a su sitio. Y el hielo del norte cede.',
  faustoFreed: 'En la calle de los pescadores, el eco suelta a Fausto. Volverá a casa.',
  verseCore: 'El chico de la caleta se quedó atrapado en lo que fue. Tú lo has oído y sigues aquí.',
  t13: 'Bajo el verso hay otra inscripción, más pequeña. La lees sin ayuda: «La decimotercera tabla espera en el hielo más viejo.»',
  real: 'Algo se mueve en el nido. La Bramaluna sigue ahí… pero ya no es un eco. Respira de verdad.',
  realCore: 'Se ha quedado de este lado del tiempo. Ya no es un recuerdo: es ella, entera.',
  realTalk: 'La Bramaluna Alfa descansa en su nido. Te mira con unos ojos muy antiguos.',
  realLost: 'Te has retirado del nido. Tu equipo ha recuperado fuerzas.',
  realGone: 'El nido está vacío. Aún quedan escamas calientes entre las piedras.',
  upcurrent: 'Una corriente mansa sube desde la fosa hacia la superficie.',
  upcurrentAsk: '¿Dejarte llevar hasta Caleta Sonda?',
  plaque: 'Una estela con glifos Unown, gastada por el agua.',
  plaqueRead: '«La decimotercera tabla espera en el hielo más viejo.»',
});

const echoAlive = (s) => !s.flag(F.echoBeaten);
const restored = (s) => s.flag(F.restored);
/** La Bramaluna real está en el nido: tras el P7, sin capturar y (si se venció) tras descansar. */
export const realPresent = (s) => Boolean(s) && restored(s) && !s.flag(F.realCaught)
  && (!s.flag(F.realBeaten) || Number(s.var(V.restCount, 0)) > Number(s.var(V.realRest, -1)));

// ───────────────────────────── Bramaluna eco ─────────────────────────────

/** Petición del combate contra la Bramaluna del eco (captura desactivada, sin huida). */
export function echoBattleRequest() {
  return {
    type: 'wild',
    wild: { ...BRAMALUNA_ECO, moves: [...BRAMALUNA_ECO.moves] },
    rules: { canRun: false, catchCondition: () => ({ allowed: false, reason: CATCH_REASON }) },
    bgm: MUSIC.boss,
    battleback: 'Pradera3',
  };
}

const RETRY = Object.freeze({ map: roomMap(4, 'presente'), x: ROOM4.springStand.x, y: ROOM4.springStand.y, dir: ROOM4.springStand.dir });

async function echoFight(ctx) {
  const ev = eventById(ctx, 'bramaluna_eco');
  ctx.cry('ROARINGMOON');
  ctx.shake(7, 8, 40);
  if (ev) await ctx.emote(ev, '!');
  await ctx.say(FOSA_TEXT.wake);
  await zygardeSays(ctx, FOSA_TEXT.wakeCore);
  const outcome = await bossBattle(ctx, echoBattleRequest(), RETRY, { loseText: FOSA_TEXT.lost });
  if (outcome !== 'win') return;
  ctx.setFlag(F.echoBeaten);
  ctx.se('Anim/Water1', { volume: 90 });
  await ctx.flash(COLOR.echo, 30, 220);
  if (ev) { for (let o = 255; o >= 0; o -= 25) { ev.opacity = o; await pause(ctx, 2); } }
  ctx.requestRefresh();
  await ctx.say(FOSA_TEXT.won);
  await zygardeSays(ctx, FOSA_TEXT.wonCore);
}

function echoEvents() {
  const T = FOSA.trigger;
  const strip = [];
  for (let x = T.x0; x <= T.x1; x++) {
    strip.push({ id: `nido_aviso_${x}`, x, y: T.y, pages: [{ when: echoAlive, through: true, trigger: 'touch', script: echoFight }] });
  }
  const B = FOSA.echoBoss;
  return [
    ...strip,
    {
      id: 'bramaluna_eco', x: B.x, y: B.y, name: 'Bramaluna Alfa',
      pages: [{ when: echoAlive, sprite: SPRITE.bramaluna, dir: B.dir, move: 'still', stepAnime: true, speed: 2, opacity: 200, solid: true, trigger: 'action', script: echoFight }],
    },
  ];
}

// ───────────────────────────── núcleo ─────────────────────────────

async function localEffect(ctx) {
  ctx.se('PRSFX- Water Pulse', { volume: 70 });
  await ctx.tone(pilarTone('P7', 0.3), 40);
  await ctx.say(FOSA_TEXT.tides);
  await ctx.say(FOSA_TEXT.north);
  await ctx.say(FOSA_TEXT.dredge);
  await zygardeSays(ctx, FOSA_TEXT.local);
  await releaseFausto(ctx);
}

/**
 * CAMPANA B14 «Cambio en el mundo: … Fausto vuelve»: si no se le despertó en la sala 2 (basta con llegar a la
 * compuerta de su rutina para pasar), el P7 lo suelta igualmente; su Real de plata le espera en la playa de Caleta
 * Sonda (CAMPANA §2.6: los regalos esperan). Devuelve true si lo soltó ahora.
 */
export async function releaseFausto(ctx) {
  if (ctx.flag(F.faustoAwake)) return false;
  ctx.setFlag(F.faustoFreed);
  ctx.setFlag(F.faustoAwake);
  await zygardeSays(ctx, FOSA_TEXT.faustoFreed);
  return true;
}

async function coreScene(ctx) {
  await zygardeSays(ctx, FOSA_TEXT.coreIntro);
  const ok = await ctx.story.restorePillar(7, { core: { x: FOSA.core.x, y: FOSA.core.y }, onRestored: localEffect });
  if (!ok) return;
  await zygardeSays(ctx, FOSA_TEXT.verseCore);
  await ctx.say(FOSA_TEXT.t13);
  await ctx.story.openClue('T13');
  ctx.setFlag(F.t13);
  // La Bramaluna se queda de este lado del tiempo.
  ctx.shake(3, 5, 40);
  ctx.cry('ROARINGMOON');
  ctx.requestRefresh();
  await pause(ctx, 30);
  await ctx.say(FOSA_TEXT.real);
  await zygardeSays(ctx, FOSA_TEXT.realCore);
}

function coreEvent() {
  const C = FOSA.core;
  return {
    id: 'nucleo_ecos', x: C.x, y: C.y, name: 'Núcleo',
    pages: [
      { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(FOSA_TEXT.coreBlocked); } },
      {
        when: (s) => s.flag(F.echoBeaten) && !restored(s), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 110, intensity: 0.7, pulse: 0.6, color: COLOR.echo }, script: coreScene,
      },
      {
        when: restored, solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 80, intensity: 0.35, pulse: 0.2, color: COLOR.echo },
        script: async (ctx) => { await ctx.say(FOSA_TEXT.coreCold); },
      },
    ],
  };
}

// ───────────────────────────── Bramaluna real ─────────────────────────────

async function realFight(ctx) {
  ctx.cry('ROARINGMOON');
  await ctx.say(FOSA_TEXT.realTalk);
  const request = { type: 'wild', wild: { ...BRAMALUNA_REAL, moves: [...BRAMALUNA_REAL.moves] }, bgm: MUSIC.boss, battleback: 'Pradera3' };
  const b = FOSA.battleSpot;
  const outcome = await bossBattle(ctx, request, { x: b.x, y: b.y, dir: b.dir }, { loseText: FOSA_TEXT.realLost });
  if (outcome === 'caught') { ctx.setFlag(F.realCaught); ctx.requestRefresh(); return; }
  if (outcome === 'win') {
    ctx.setFlag(F.realBeaten);
    ctx.setVar(V.realRest, Number(ctx.var(V.restCount, 0)));
    ctx.requestRefresh();
  }
}

function realEvents() {
  const N = FOSA.nest;
  return [{
    id: 'bramaluna_real', x: N.x, y: N.y, name: 'Bramaluna Alfa',
    pages: [
      { when: (s) => restored(s) && !realPresent(s), trigger: 'action', solid: false, through: true, script: async (ctx) => { await ctx.say(FOSA_TEXT.realGone); } },
      { when: realPresent, sprite: SPRITE.bramaluna, dir: 2, move: 'still', stepAnime: true, speed: 2, solid: true, trigger: 'action', script: realFight },
    ],
  }];
}

// ───────────────────────────── salida ─────────────────────────────

function upcurrentEvent() {
  const U = FOSA.upcurrent;
  const R = CALETA.reefDive;
  return {
    id: 'corriente_ascendente', x: U.x, y: U.y, name: 'Corriente ascendente',
    pages: [{
      when: restored, through: true, trigger: 'action', glow: { name: 'zygardeWhirl', up: true },
      script: async (ctx) => {
        await ctx.say(FOSA_TEXT.upcurrent);
        if ((await ctx.choice(['Sí', 'No'], { message: FOSA_TEXT.upcurrentAsk, cancel: 1 })) !== 0) return;
        ctx.se('PRSFX- Dive2');
        await ctx.fade('out', 20, [180, 230, 255]);
        await ctx.warp('caleta_sonda', R.x, R.y, 2, { fade: false });
        await ctx.fade('in', 20);
      },
    }],
  };
}

export async function fosaOnEnter(ctx) {
  if (ctx.flag(F.fosaIn)) return;
  ctx.setFlag(F.fosaIn);
  await pause(ctx, 20);
  for (const t of FOSA_TEXT.enter) await zygardeSays(ctx, t);
}

export function fosaEvents() {
  const P = FOSA.inscription;
  return [
    ...echoEvents(),
    coreEvent(),
    ...realEvents(),
    upcurrentEvent(),
    {
      id: 'estela_t13', x: P.x, y: P.y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say(FOSA_TEXT.plaque);
        if (ctx.flag(F.t13)) await ctx.say(FOSA_TEXT.plaqueRead);
      },
    },
    // Helechos y raíces del eco en la fosa (se desvanecen al restaurar el Pilar).
    ...bigFernEvents('helecho_fosa', [[6, 13, 2], [23, 13, 4], [9, 17, 6], [21, 17, 8], [12, 21, 4], [19, 21, 2]])
      .map((ev) => ({ ...ev, when: (s) => !restored(s), opacity: 170 })),
  ];
}

export { lines, placePlayer };
