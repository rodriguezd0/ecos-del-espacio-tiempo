// Senda del Origen, tramos 7–9 (docs/CAMPANA.md B20):
//   7 · Ecos — caracola del eco en una cisterna (Buceo): segundo Manantial; se baja al fondo con Buceo; la caracola (B14)
//       lleva al eco seco de la cisterna, donde la reja del túnel aún funciona: alzada en el pasado, sigue alzada en el
//       presente (causalidad de un solo sentido) y el túnel lleva buceando al pozo del norte.
//   8 · Alma — tres voces a la vez: controles en espejo (Sentir, B16), el viento que devuelve a quien se para (Querer, B16)
//       y tres puertas de las que solo una inscripción dice la verdad (Saber, B16).
//   9 · Convergencia — cascada detenida y pliegue (Reconstrucción), eco de la Cámara del Cruce (B18, world/axis): con la
//       Cadena Roja tensada hacia el tiempo, la cascada del canal se para y se sube por ella a la repisa del oeste; hacia
//       el espacio, el pliegue lleva a la repisa alta, donde la Reconstrucción alza el tramo roto. En la pared, el verso X
//       y el último mensaje de los Custodios.
import { F, V, OBJ, SPEAKER, GOLD, pause, placePlayer, examine, frame, when, lines } from './b20_common.js';
import { STILL_FRAMES, corridorFloor, corridorLedge, corridorPath, doorExit, doorText, DOOR_RULES, t9Room } from './b20_logic.js';
import { AXIS_TIME } from '../../world/axis/logic.js';
import { axisRoomEvents } from '../../world/axis/roomEvents.js';
import { syncAxis } from '../../world/axis/actions.js';
import { springEvent, steleEvents } from './b20_senda.js';
import { T7, T8, T9, INNER, tramoId, ARRIVE } from '../maps/b20/layout.js';
import { installMirrorInput } from './b16_recuerdo.js';
import { extraTiles } from '../stamps/extraTiles.js';

const KIT = extraTiles('Cueva1');
const ZOCALO_VIVO = KIT.find((t) => t.name === 'pilar_zocalo_vivo')?.id || 0;

// ───────────────────────────── Tramo 7 ─────────────────────────────

export const T7_TEXT = Object.freeze({
  stele: ['Una estela con glifos Unown:', '«La cisterna guarda lo que sonó en ella. Quien lo oiga, podrá cambiar lo que fue.»'],
  caracola: {
    presente: 'Una caracola enorme, incrustada en el fondo de la cisterna. Del hueco sale un zumbido que no suena a agua.',
    eco: 'La misma caracola, limpia y blanca, sobre una peana. Vibra aunque nadie la toque.',
  },
  ask: '¿Golpear la caracola?',
  hit: 'Golpeas la caracola con la palma.',
  // Zygarde habla muy poco (autor, 25-09-2026): las reglas de los tramos son narración neutra.
  firstEcho: 'La cisterna está seca: es un eco de cuando aún no tenía agua. Lo que cambie aquí seguirá cambiado en el presente.',
  back: 'El agua vuelve a llenarlo todo. El presente.',
  grateDown: 'Una reja caída tapa el túnel del norte. Está soldada al fondo por el óxido y las algas.',
  grateUp: 'La reja está alzada, clavada en lo alto por el óxido. El túnel queda libre.',
  ecoGrate: 'Una reja de bronce cierra la boca del túnel. Tiene una manivela al lado.',
  ecoGrateUp: 'La reja está alzada y encajada en su ranura.',
  crank: 'Una manivela de bronce. Mueve la reja del túnel.',
  crankAsk: '¿Girar la manivela?',
  crankDone: 'Giras la manivela. La reja sube chirriando… y se encaja arriba con un golpe seco.',
  crankAgain: 'La manivela no se mueve: la reja está encajada arriba.',
  masonry: 'Piedra recién tallada al fondo del túnel, sin una grieta. En este tiempo el túnel aún no llega más allá.',
});

export const grateRaised = (s) => Boolean(s?.flag(F.t7Grate));

/** Golpear la caracola: la cisterna cambia entera entre el presente sumergido y su eco seco (misma casilla). */
async function strike(ctx, to) {
  await ctx.say(to === 'eco' ? T7_TEXT.caracola.presente : T7_TEXT.caracola.eco);
  if ((await ctx.choice(['Golpearla', 'No'], { message: T7_TEXT.ask, cancel: 1 })) !== 0) return;
  await ctx.say(T7_TEXT.hit);
  const p = ctx.player;
  ctx.se('Anim/Water1', { volume: 80 });
  ctx.se('core_signal', { volume: 50 });
  await ctx.flash([104, 216, 192], 16, 170);
  await ctx.fade('out', 18, to === 'eco' ? [220, 250, 240] : [4, 20, 34]);
  await ctx.warp(to === 'eco' ? `${tramoId(7)}_eco` : `${tramoId(7)}_fondo`, p.x, p.y, p.direction, { fade: false });
  await ctx.fade('in', 22);
  if (to === 'eco' && !ctx.flag(F.t7Echo)) {
    ctx.setFlag(F.t7Echo);
    await ctx.say(T7_TEXT.firstEcho);
  } else if (to !== 'eco') {
    await ctx.say(T7_TEXT.back);
  }
}

function caracolaEvent(era) {
  const C = T7.caracola;
  return {
    id: 't7_caracola', x: C.x, y: C.y, name: 'Caracola',
    sprite: OBJ.caracola, dir: era === 'eco' ? 4 : 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
    solid: true, noOver: true, trigger: 'action', light: { radius: 70, intensity: 0.7 },
    script: (ctx) => strike(ctx, era === 'eco' ? 'presente' : 'eco'),
  };
}

export function tramo7SurfaceEvents() {
  return [
    springEvent('t7_manantial', 2, T7.spring),
    { id: 't7_remolino', type: 'diveSpot', x: T7.dive.x, y: T7.dive.y },
    // Pozo norte: al volver desde el tramo 8 se baja por aquí al túnel (si no, el jugador quedaría encerrado en la repisa).
    // Va a un lado del pozo: delante de la repisa, un evento de acción taparía la oferta de nadar.
    { id: 't7_pozo', type: 'diveSpot', x: T7.wellDive.x, y: T7.wellDive.y },
    ...steleEvents('t7_estela', { x: 16, y: 13 }, T7_TEXT.stele),
  ];
}

export function tramo7BottomEvents() {
  const G = T7.grate;
  return [
    caracolaEvent('presente'),
    ...T7.vents.map(([x, y], i) => ({ id: `t7_respiradero_${i}`, type: 'diveVent', x, y })),
    {
      id: 't7_reja', x: G.x, y: G.y, name: 'Reja',
      pages: [
        { ...frame(0), sprite: OBJ.grate, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(T7_TEXT.grateDown); } },
        { when: grateRaised, ...frame(1), sprite: OBJ.grate, through: true, trigger: 'action', script: async (ctx) => { await ctx.say(T7_TEXT.grateUp); } },
      ],
    },
    { id: 't7_emerger', type: 'diveSpot', surface: true, x: T7.surfaceSpot.x, y: T7.surfaceSpot.y },
    { id: 't7_objeto', type: 'item', x: T7.item.x, y: T7.item.y, item: T7.item.item, count: T7.item.count },
  ];
}

async function turnCrank(ctx) {
  if (grateRaised(ctx.state)) { await ctx.say(T7_TEXT.crankAgain); return; }
  await ctx.say(T7_TEXT.crank);
  if ((await ctx.choice(['Sí', 'No'], { message: T7_TEXT.crankAsk, cancel: 1 })) !== 0) return;
  ctx.se('Door slide');
  await ctx.shake(2, 6, 20);
  ctx.setFlag(F.t7Grate);
  ctx.requestRefresh();
  ctx.se('PRSFX- Iron Defense', { volume: 70 });
  await ctx.say(T7_TEXT.crankDone);
}

export function tramo7EchoEvents() {
  const G = T7.grate;
  const M = T7.masonry;
  return [
    caracolaEvent('eco'),
    {
      id: 't7_reja', x: G.x, y: G.y, name: 'Reja',
      pages: [
        { ...frame(2), sprite: OBJ.grate, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(T7_TEXT.ecoGrate); } },
        { when: grateRaised, ...frame(3), sprite: OBJ.grate, through: true, trigger: 'action', script: async (ctx) => { await ctx.say(T7_TEXT.ecoGrateUp); } },
      ],
    },
    {
      id: 't7_manivela', x: T7.crank.x, y: T7.crank.y, name: 'Manivela',
      pages: [
        { sprite: OBJ.lever, dir: 6, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: turnCrank },
        { when: grateRaised, sprite: OBJ.lever, dir: 8, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: turnCrank },
      ],
    },
    examine('t7_obra', M.x, M.y, T7_TEXT.masonry),
  ];
}

// ───────────────────────────── Tramo 8 ─────────────────────────────

export const T8_TEXT = Object.freeze({
  voices: [
    [SPEAKER.saber, 'Solo una dice la verdad.'],
    [SPEAKER.sentir, 'Aquí todo se siente al revés.'],
    [SPEAKER.querer, 'Y quien se para, vuelve atrás.'],
  ],
  controls: 'En este tramo, izquierda y derecha se invierten.',
  pushed: 'El viento te devuelve a la última losa clara.',
  door: (n) => `Una puerta de piedra con el numeral ${['I', 'II', 'III'][n - 1]}. Tiene una inscripción:`,
  ask: '¿Cruzar esta puerta?',
  forgot: 'La puerta no se abre. Un soplo cálido te envuelve… y estás otra vez en la entrada. Las inscripciones han cambiado.',
  open: 'La puerta se abre sin ruido.',
  alreadyOpen: 'Esta no se abre. La puerta que dijo la verdad sigue abierta.',
});

const toLocal = (x, y) => [x - INNER.x, y - INNER.y];
const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });

async function pushBack(ctx, from, to) {
  const path = corridorPath(from[0], from[1], to[0], to[1]);
  if (!path || !path.length) return;
  ctx.se('PRSFX- Gust');
  const face = ctx.player.direction;
  await ctx.move('player', ['direction_fix_on', ...path.map((d) => DIR_NAME[d]), 'direction_fix_off'], { through: true, speed: 5 });
  ctx.face('player', face);
  if (!ctx.flag('b20_t8_viento_aviso')) {
    ctx.setFlag('b20_t8_viento_aviso');
    await ctx.say(T8_TEXT.pushed);
  }
}

/** Guion paralelo del pasillo (Querer): cuenta los fotogramas parado fuera de una losa clara y empuja a la última. */
async function windMonitor(ctx) {
  const ev = ctx.event;
  const p = ctx.player;
  const st = ev.b20 || (ev.b20 = { ledge: null, still: 0, last: null, pushing: false });
  const [c, r] = toLocal(p.x, p.y);
  if (!corridorFloor(c, r) || ctx.flag(F.t8Door)) { st.still = 0; return; }
  if (!st.ledge) st.ledge = toLocal(ARRIVE.x, ARRIVE.y);
  if (corridorLedge(c, r)) { st.ledge = [c, r]; st.still = 0; return; }
  const moved = !st.last || st.last[0] !== p.x || st.last[1] !== p.y;
  st.last = [p.x, p.y];
  const busy = ctx.world?.scriptBusy?.() && !st.pushing;
  if (moved || p.busy() || busy) { st.still = 0; return; }
  st.still += 1;
  if (st.still < STILL_FRAMES || st.pushing) return;
  st.pushing = true;
  st.still = 0;
  const to = st.ledge;
  ctx.scene?.runScript?.(async (c2) => {
    try { await pushBack(c2, [c, r], to); } finally { st.pushing = false; st.last = null; }
  }, ev, 'tramo8:viento');
}

async function doorScript(ctx, n) {
  const variant = Number(ctx.var(V.t8Variant, 0)) || 0;
  const open = ctx.flag(F.t8Door);
  if (open && doorExit(variant) === n) { await crossDoor(ctx); return; }
  if (open) {
    // Con la puerta verdadera ya abierta, las otras solo se leen: equivocarse ahora no «olvida» nada ni cambia la salida
    await ctx.say(T8_TEXT.door(n));
    await ctx.say(doorText(variant, n));
    await ctx.say(T8_TEXT.alreadyOpen);
    return;
  }
  if (!ctx.flag('b20_t8_reglas')) {
    ctx.setFlag('b20_t8_reglas');
    for (const t of DOOR_RULES) await ctx.say(t);
  }
  await ctx.say(T8_TEXT.door(n));
  await ctx.say(doorText(variant, n));
  if ((await ctx.choice(['Cruzarla', 'Dejarla'], { message: T8_TEXT.ask, cancel: 1 })) !== 0) return;
  if (doorExit(variant) !== n) {
    ctx.se('PRSFX- Future Sight1', { volume: 60 });
    await ctx.fade('out', 24, [255, 236, 170]);
    ctx.setVar(V.t8Variant, variant + 1);
    await placePlayer(ctx, ARRIVE.x, ARRIVE.y, 8, { fade: false });
    ctx.requestRefresh();
    await pause(ctx, 10);
    await ctx.fade('in', 24);
    await ctx.say(T8_TEXT.forgot);
    return;
  }
  ctx.setFlag(F.t8Door);
  ctx.se('Door slide');
  ctx.requestRefresh();
  await pause(ctx, 16);
  await ctx.say(T8_TEXT.open);
  await crossDoor(ctx);
}

async function crossDoor(ctx) {
  ctx.se('Door enter');
  await ctx.warp(tramoId(9), ARRIVE.x, ARRIVE.y, 8, { fade: true, frames: 20 });
}

function doorEvent(d) {
  const base = { sprite: OBJ.door16, solid: true, trigger: 'action', script: (ctx) => doorScript(ctx, d.n) };
  return {
    id: `t8_puerta_${d.n}`, x: d.x, y: d.y, name: `Puerta ${d.n}`,
    pages: [
      { ...base, ...frame(d.n - 1) },
      { ...base, ...frame(8), when: (s) => s.flag(F.t8Door) && doorExit(s.var(V.t8Variant, 0)) === d.n },
    ],
  };
}

async function voicesScene(ctx) {
  ctx.setFlag(F.t8Intro);
  await pause(ctx, 20);
  for (const [speaker, text] of T8_TEXT.voices) await ctx.say(text, { speaker });
  await ctx.say(T8_TEXT.controls);
}

/** Al entrar en el tramo 8: controles en espejo (Proxy de B16, solo mientras el mapa tenga `mirrorControls`). */
export async function tramo8Enter(ctx) {
  installMirrorInput(ctx.world);
}

export function tramo8Events() {
  return [
    { id: 't8_viento', x: 0, y: 0, pages: [{ trigger: 'parallel', lock: false, script: windMonitor }] },
    { id: 't8_voces', x: ARRIVE.x, y: ARRIVE.y - 1, pages: [{ when: (s) => !s.flag(F.t8Intro), trigger: 'auto', script: voicesScene }] },
    ...T8.doors.map(doorEvent),
    ...T8.voices.map((v) => ({
      id: `t8_voz_${v.id}`, x: v.x, y: v.y, sprite: OBJ.thread, ...frame(v.row * 4), stepAnime: true, speed: 2, through: true, shadow: false,
      light: { radius: 44, intensity: 0.6 },
    })),
  ];
}

// ───────────────────────────── Tramo 9 ─────────────────────────────

export const T9_TEXT = Object.freeze({
  // Narración neutra la primera vez que se usa un cristal (el tipo axisCrystal las dice como narración)
  tutorial: [
    'El cristal late con dos luces: la fría del tiempo y la cálida del espacio. La Cadena Roja vibra al acercarse.',
    'Es un eco de la Cámara del Cruce: la Cadena Roja puede tensarse hacia uno de los dos.',
  ],
  frozen: 'La cascada se ha parado a media caída. Ahora se puede subir por ella.',
  fold: 'Las marcas violetas se han abierto. Llevan al otro lado.',
  custodios: [
    'La pared está llena de glifos Unown, más nuevos que los del resto de la Senda. La Clave Glífica los lee:',
    '«Aquí termina el camino que grabamos. Si has llegado, ya sabes quiénes fuimos: los que escucharon, los que rompieron la flauta, los que cerraron el fondo.»',
    '«No te pedimos que despiertes a nadie. Te pedimos que sepas por qué lo haces.»',
  ],
  plaqueCustodios: 'El último mensaje de los Custodios.',
  plaqueVerse: 'El décimo verso de la profecía.',
});

/** Primera vez que se tensa la Cadena hacia cada eje en el tramo: la narración describe el cambio. */
async function t9OnTense(ctx, mode) {
  const flag = mode === AXIS_TIME ? F.t9Frozen : F.t9Fold;
  if (ctx.flag(flag)) return;
  ctx.setFlag(flag);
  await ctx.say(mode === AXIS_TIME ? T9_TEXT.frozen : T9_TEXT.fold);
}

/** Al entrar: el tono del mapa sigue a la tensión guardada de ESTE tramo (world/axis/actions.js#syncAxis). */
export function tramo9Enter(ctx) {
  return syncAxis(ctx, V.t9Axis);
}

async function wallScene(ctx) {
  ctx.setFlag(F.custodios);
  await pause(ctx, 10);
  for (const t of T9_TEXT.custodios) await ctx.say(t);
  await ctx.story.revealVerse(10);
}

/** Casilla de vacío pasable de Cueva1 (transparente, prioridad 0) bajo los escombros detenidos (world/axis). */
export const T9_PASS_TILE = 405;

export function tramo9Events() {
  const S = T9.gap.socket;
  const room = t9Room();
  return [
    // Sala de ejes: cristales, corrientes (la cascada del canal), pliegue y escombros, generados de la rejilla
    ...axisRoomEvents(room, {
      ox: INNER.x, oy: INNER.y, prefix: 't9', axisVar: V.t9Axis, passTile: T9_PASS_TILE,
      crystal: { tutorial: T9_TEXT.tutorial, tutorialFlag: F.t9Crystal, onTense: t9OnTense },
      items: [{ item: T9.item.item }],
    }),
    {
      id: 't9_zocalo', type: 'rebuildGap', x: S.x, y: S.y, flag: F.t9Gap, tutorial: true,
      tiles: T9.gap.cells.map(([x, y]) => [x, y, 2, ZOCALO_VIVO]),
    },
    ...T9.wallScene.map(([x, y]) => ({
      id: `t9_pared_${x}_${y}`, x, y, pages: [{ when: (s) => !s.flag(F.custodios), through: true, trigger: 'touch', script: wallScene }],
    })),
    ...steleEvents('t9_placa_custodios', T9.plaques.custodios, (s) => (s.flag(F.custodios) ? T9_TEXT.custodios.slice(1) : T9_TEXT.plaqueCustodios)),
    ...steleEvents('t9_placa_verso', T9.plaques.verse, T9_TEXT.plaqueVerse, async (ctx) => { await ctx.story.revealVerse(10); }),
  ];
}

export { lines, GOLD, when };
