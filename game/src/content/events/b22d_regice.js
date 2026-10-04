// Regice (docs/CAMPANA.md B22: «Cueva Sellada de la Escarcha · Talla de hielo con Rosendo · Nv 70»). Postgame:
//   1. Talleres del Hielo (auto): Rosendo, que ya casi no ve, oye «un hielo que lleva sesenta años callado»: bajo el
//      taller está la bodega de los tallistas, con un muro de hielo que no se funde y una talla a medio hacer.
//   2. La bodega (boreal_cueva_sellada): la talla vieja (el modelo, una cruz de cinco luces) y nueve bloques en bruto en
//      rejilla 3×3. El jugador talla; Rosendo escucha. Tallar alterna el bloque (el hielo perdona: nunca se bloquea).
//   3. Con la cruz tallada el muro se funde: la Cueva Sellada de la Escarcha, con Regice.
// Los Talleres son un mapa del B15: se añaden estos eventos con una línea (cambio mínimo y aditivo).
import {
  F, V, LEGENDS, SPEAKER, SPRITE, OBJ, MUSIC, postgame, when, lines, zygardeSays, pause, eventById, legendPresent,
} from './b22d_common.js';
import { KNOB_COUNT, toggleKnob, knobCarved, carvingDone, carvingDiff } from './b22d_logic.js';
import { legendBattle } from './b22d_battle.js';
import { steleEvents } from './b22d_regirock.js';
import { HOOKS, ESCARCHA } from '../maps/b22d/layout.js';
import { giveHint } from './b22b_hints.js';

const E = ESCARCHA;
const ROS = { speaker: SPEAKER.rosendo };
const COUNT_WORD = ['ninguno', 'uno', 'dos', 'tres', 'cuatro', 'cinco'];

export const REGICE_TEXT = Object.freeze({
  home: [
    '¿Quién anda ahí? …Ah, eres tú. Te conozco por los pasos.',
    'Ahora que el hielo vuelve a ser hielo, lo oigo mejor que nunca. Y hay uno que lleva sesenta años callado.',
    'Debajo del taller está la bodega de los tallistas. Mi maestro me enseñó allí un muro de hielo que no se funde, con una talla a medio hacer.',
    'Decía que el muro era una puerta y la talla, la llave. Que la dejaron a medias para que nadie la terminase sin saber lo que hacía.',
    'Yo ya no veo lo bastante para tallar. Pero todavía sé escuchar el hielo. Si tú pones las manos, yo pongo los oídos.',
    'La trampilla está bajo el serrín, junto a la planta. Te espero abajo.',
  ],
  hatch: 'Una trampilla de madera. Abajo se ve el primer peldaño de una escalera y sube un aire muy frío.',
  hatchAsk: '¿Bajar a la bodega?',
  cellar: 'Aquí abajo el hielo no ha cambiado en sesenta años. Escucha… ¿lo oyes? Está esperando.',
  rosendoModel: 'Primero, mira la talla vieja. Está en su peana, junto a la pared. Esa es la que hay que copiar.',
  rosendoHow: 'Nueve bloques en bruto. Talla los que te diga la talla vieja y deja los demás como están. Si te equivocas, no pasa nada: el hielo perdona.',
  rosendoAsk: '¿Quieres que escuche cómo va la talla?',
  hintNone: 'Todavía no has tocado ninguno. El hielo está esperando tus manos.',
  hintMissing: (n) => `${n === 1 ? 'Falta uno' : `Faltan ${COUNT_WORD[n] || n}`}. Lo oigo: el hielo aún no está entero.`,
  hintExtra: (n) => `${n === 1 ? 'Sobra uno' : `Sobran ${COUNT_WORD[n] || n}`}. Hay un bloque tallado que no suena como los demás.`,
  hintBoth: 'Algo sobra y algo falta. Vuelve a mirar la talla vieja.',
  model: 'Una talla pequeña, gastada por los años: un bloque de hielo con cinco luces en cruz. Arriba, abajo, a los lados y en el centro.',
  knobRaw: 'Un bloque de hielo en bruto, del tamaño de una persona.',
  knobNeedModel: 'Rosendo dice que antes hay que mirar la talla vieja.',
  knobAsk: '¿Tallar el bloque?',
  knobCarve: 'Golpe a golpe, el bloque va tomando forma. Rosendo asiente sin decir nada.',
  knobCarved: 'Un bloque tallado. Brilla un poco por dentro.',
  knobUndoAsk: '¿Devolverle la forma en bruto?',
  knobUndo: 'Rosendo pasa la palma por el bloque y el hielo vuelve a cerrarse, liso.',
  wall: 'Un muro de hielo liso y duro como el cristal. Dentro se adivina una silueta a medio tallar.',
  done: '…Esta sí. Esta la conozco.',
  melt: 'El muro de hielo cruje, se llena de burbujas y se deshace en agua que corre hacia el fondo.',
  opened: [
    'Ve tú. Yo me quedo aquí, escuchando.',
    'Hace sesenta años que quería oír esto.',
  ],
  core: 'Detrás del muro duerme algo hecho de hielo. No se ha movido desde que lo sellaron.',
  waiting: 'Sigue ahí dentro. Lo oigo respirar despacio, como el hielo del lago en enero.',
  // cueva
  sleeping: 'Una figura de hielo antiguo, quieta en el centro de la gruta. En su cara hay siete puntos, apagados.',
  wake: 'Los siete puntos se encienden. El aire se hiela de golpe. ¡La figura se mueve!',
  gone: 'Solo queda escarcha en el suelo, con la forma de unos pies enormes.',
  steleRead: '«Hielo soy. Roca y acero son mis hermanos. El que nos dio forma duerme bajo la memoria.»',
});

/** Rosendo está en la bodega mientras dura la talla (hasta capturar a Regice). Lo consulta el taller (B15). */
export const rosendoAway = (s) => Boolean(s) && postgame(s) && s.flag(F.rosendoAsk) && !s.flag(LEGENDS.regice.caught);

const opened = (s) => Boolean(s?.flag(F.escarchaOpen));
const mask = (s) => Number(s?.var?.(V.carving, 0)) || 0;

// ───────────────────────────── Talleres del Hielo ─────────────────────────────

async function homeScene(ctx) {
  const rosendo = eventById(ctx, 'rosendo');
  if (rosendo) { ctx.face(rosendo, ctx.player); await ctx.emote(rosendo, '…'); }
  await lines(ctx, SPEAKER.rosendo, REGICE_TEXT.home);
  await giveHint(ctx, 'rosendo');
  await ctx.fade('out', 20);
  ctx.setFlag(F.rosendoAsk);
  await pause(ctx, 20);
  await ctx.fade('in', 20);
}

async function hatchScript(ctx) {
  await ctx.say(REGICE_TEXT.hatch);
  if (!(await ctx.confirm(REGICE_TEXT.hatchAsk))) {
    await ctx.move('player', ['up'], { through: false });
    return;
  }
  ctx.se?.('Door enter');
  await ctx.warp(E.id, E.arrive.x, E.arrive.y, E.arrive.dir);
}

/** Eventos que añade el taller de Rosendo (boreal_talleres.js). */
export function b22dTalleresEvents() {
  const H = HOOKS.talleres;
  return [
    {
      id: 'b22d_rosendo_aviso', x: 0, y: 13, trigger: 'auto',
      when: (s) => postgame(s) && !s.flag(F.rosendoAsk), script: homeScene,
    },
    {
      id: 'b22d_trampilla', x: H.hatch.x, y: H.hatch.y, name: 'Trampilla',
      pages: [{ when: (s) => postgame(s) && s.flag(F.rosendoAsk), sprite: OBJ.hatch, dir: 4, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'touch', script: hatchScript }],
    },
  ];
}

// ───────────────────────────── la bodega ─────────────────────────────

async function rosendoScript(ctx) {
  if (opened(ctx.state)) { await ctx.say(REGICE_TEXT.waiting, ROS); return; }
  if (!ctx.flag(F.carvingModel)) { await ctx.say(REGICE_TEXT.rosendoModel, ROS); return; }
  await ctx.say(REGICE_TEXT.rosendoHow, ROS);
  if (!(await ctx.confirm(REGICE_TEXT.rosendoAsk))) return;
  const m = mask(ctx.state);
  const { missing, extra } = carvingDiff(m);
  let hint = REGICE_TEXT.hintBoth;
  if (m === 0) hint = REGICE_TEXT.hintNone;
  else if (!extra.length) hint = REGICE_TEXT.hintMissing(missing.length);
  else if (!missing.length) hint = REGICE_TEXT.hintExtra(extra.length);
  await ctx.say(hint, ROS);
}

async function openScene(ctx) {
  const rosendo = eventById(ctx, 'b22d_rosendo_bodega');
  const wall = eventById(ctx, 'b22d_muro_hielo');
  await pause(ctx, 20);
  if (rosendo) { ctx.face(rosendo, 'right'); await ctx.emote(rosendo, '!'); }
  await ctx.say(REGICE_TEXT.done, ROS);
  await ctx.camera.pan(E.wall.x, E.wall.y + 1, 30);
  ctx.se?.('PRSFX- Ice Shard', { volume: 70 });
  if (wall) { wall.stepAnime = true; wall.speed = 2; }
  await pause(ctx, 60);
  await ctx.say(REGICE_TEXT.melt);
  ctx.setFlag(F.escarchaOpen);
  await ctx.camera.reset(30);
  if (rosendo) ctx.face(rosendo, ctx.player);
  await lines(ctx, SPEAKER.rosendo, REGICE_TEXT.opened);
  await zygardeSays(ctx, REGICE_TEXT.core);
}

function knobScript(i) {
  return async (ctx) => {
    if (opened(ctx.state)) { await ctx.say(REGICE_TEXT.knobCarved); return; }
    if (!ctx.flag(F.carvingModel)) { await ctx.say(REGICE_TEXT.knobRaw); await ctx.say(REGICE_TEXT.knobNeedModel); return; }
    const m = mask(ctx.state);
    const carved = knobCarved(m, i);
    if (!(await ctx.confirm(carved ? REGICE_TEXT.knobUndoAsk : REGICE_TEXT.knobAsk))) return;
    ctx.se?.(carved ? 'PRSFX- Mist' : 'PRSFX- Ice Shard', { volume: 70 });
    const next = toggleKnob(m, i);
    ctx.setVar(V.carving, next);
    await ctx.say(carved ? REGICE_TEXT.knobUndo : REGICE_TEXT.knobCarve);
    if (carvingDone(next)) await openScene(ctx);
  };
}

function knobEvents() {
  const out = [];
  for (let i = 0; i < KNOB_COUNT; i++) {
    const k = E.knobs[i];
    const base = { sprite: OBJ.knob, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: knobScript(i) };
    out.push({
      id: `b22d_bloque_${i}`, x: k.x, y: k.y, name: 'Bloque de hielo',
      pages: [
        { ...base, dir: 2 },
        { ...base, when: (s) => knobCarved(mask(s), i), dir: 4, stepAnime: true, speed: 2 },
      ],
    });
  }
  return out;
}

export const REGICE_SPEC = Object.freeze({ species: 'REGICE', level: 70, moves: Object.freeze(['BLIZZARD', 'HAMMERARM', 'AMNESIA', 'ICEBEAM']) });

async function regiceScript(ctx) {
  ctx.face('player', 'up');
  await ctx.say(REGICE_TEXT.sleeping);
  const ev = eventById(ctx, 'regice');
  if (ev) ev.stepAnime = true;
  ctx.cry('REGICE');
  await ctx.flash([220, 240, 255], 12, 160);
  await ctx.say(REGICE_TEXT.wake);
  await legendBattle(ctx, 'regice', REGICE_SPEC, { retry: { ...E.battle }, bgm: MUSIC.legend, battleback: 'CuevaHielo' });
}

/** Eventos del mapa boreal_cueva_sellada. */
export function escarchaEvents() {
  const R = E.rosendo;
  const G = E.regice;
  return [
    {
      id: 'b22d_bodega_llegada', x: 0, y: 0, trigger: 'auto',
      when: (s) => rosendoAway(s) && !s.flag('b22d_bodega_llegada'),
      script: async (ctx) => { ctx.setFlag('b22d_bodega_llegada'); await ctx.say(REGICE_TEXT.cellar, ROS); },
    },
    {
      id: 'b22d_rosendo_bodega', x: R.x, y: R.y, name: SPEAKER.rosendo,
      pages: [{ when: rosendoAway, sprite: SPRITE.rosendo, dir: R.dir, move: 'still', trigger: 'action', script: rosendoScript }],
    },
    {
      id: 'b22d_talla_vieja', x: E.model.x, y: E.model.y, name: 'Talla vieja',
      sprite: OBJ.knob, dir: 6, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
      script: async (ctx) => { ctx.setFlag(F.carvingModel); await ctx.say(REGICE_TEXT.model); },
    },
    ...knobEvents(),
    {
      id: 'b22d_muro_hielo', x: E.wall.x, y: E.wall.y, name: 'Muro de hielo',
      pages: [
        { sprite: OBJ.knob, dir: 8, pattern: 0, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(REGICE_TEXT.wall); } },
        { when: opened, through: true },
      ],
    },
    {
      id: 'regice', x: G.x, y: G.y, name: 'Regice',
      pages: [
        { when: (s) => postgame(s), trigger: 'action', through: true, script: async (ctx) => { await ctx.say(REGICE_TEXT.gone); } },
        { when: (s) => legendPresent(s, 'regice'), sprite: SPRITE.regice, dir: G.dir, move: 'still', stepAnime: false, solid: true, trigger: 'action', script: regiceScript },
      ],
    },
    ...steleEvents('estela_escarcha', E.stele.x, E.stele.y, REGICE_TEXT.steleRead),
    ...E.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
  ];
}

export { when };
