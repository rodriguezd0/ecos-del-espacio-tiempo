// Mecanismo de la Cámara de los Contrapesos (docs/CAMPANA.md B08, «Mazmorra»): bloques y piedras que se empujan (y
// de los que se tira con A), losas quebradizas, arena profunda, la placa y su plataforma, los platillos y la palanca
// de la Gran Balanza, la palanca de retorno y la estela con las reglas. Las REGLAS son las de b08_balance_logic.js
// (puras y probadas); aquí solo se anima y se guarda el estado (var b08_camara). Escenas de Fermín y del núcleo:
// b08_camara_scenes.js.
import {
  PIECES, PIECE_IDS, PANS, PAN_NAMES, SPOTS, CELL, DIR_NAME, cellAt, cellsOf, normalizePuzzle, resetPieces, step, pull,
  settle, isHole, panView, balanceReading,
} from './b08_balance_logic.js';
import { F, V, OBJ, TELEPATHY, zygardeSays, findEvent } from './b08_common.js';
import { isRiding } from '../../world/zygarde/mount.js';
import { platformPatches } from '../maps/b08/camara_build.js';

const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const LEAD = [150, 160, 172];

/** Estado del puzle guardado (siempre válido). */
export function readPuzzle(state) {
  const st = normalizePuzzle(state?.var?.(V.puzzle, null));
  return state?.flag?.(F.balance) ? { ...st, solved: true } : st;
}

function writePuzzle(ctx, st) {
  ctx.setVar(V.puzzle, { pieces: st.pieces, holes: st.holes, plate: st.plate, solved: st.solved });
}

const riding = (ctx) => isRiding(ctx.world);

export const CAMARA_TEXT = Object.freeze({
  block: 'Un bloque de basalto, frío y pesadísimo. Tiene la forma de una columna de seis caras.',
  stone: 'Una piedra suelta con vetas grises de galena. Pesa, pero se puede mover.',
  pieceAsk: '¿Qué quieres hacer?',
  pieceOpts: ['Empujar', 'Tirar', 'Dejarlo'],
  noRoom: 'No hay sitio a tu espalda para tirar de él.',
  noPush: 'No se mueve: algo lo frena al otro lado.',
  locked: 'El contrapeso descansa en su platillo. La Balanza lo sujeta.',
  creak: 'La losa cruje bajo tus pies… pero aguanta.',
  fallFirst: [
    '¡La losa se parte bajo el peso de los dos!',
    'Caéis a la galería de abajo… Ni un rasguño: Zygarde ha frenado la caída.',
  ],
  fall: 'Caes a la galería de abajo.',
  holeFall: 'Te dejas caer por el agujero hasta la galería de abajo.',
  plateHint: 'Una placa de piedra con un hexágono grabado. La pisas… y ni se inmuta. Hará falta más peso.',
  platePress: 'La placa se hunde con un chasquido y se queda encajada.',
  platformUp: 'En el foso, una plataforma de piedra sube desde la oscuridad y encaja entre la terraza y el ala este.',
  plateDown: 'La placa está hundida y encajada. La plataforma del foso sigue arriba.',
  leverFar: 'La palanca de la Balanza queda al otro lado del platillo.',
  leverAsk: 'La palanca de la Gran Balanza. ¿Tirar de ella?',
  light: 'Los tres platillos quedan a la par… pero el contrapeso de la sima ni se inmuta. Aún falta peso sobre la Balanza.',
  /** heavy / light: listas de platillos ('A' | 'B' | 'C'); concuerda en número («baja» / «bajan»). */
  tilt: (heavy, light) => {
    const names = (keys) => keys.map((k) => PAN_NAMES[k]).join(' y ');
    const down = heavy.length > 1 ? `Los platillos ${names(heavy)} bajan` : `El platillo ${names(heavy)} baja`;
    const up = light.length > 1 ? `los platillos ${names(light)} se quedan arriba` : `el ${names(light)} se queda arriba`;
    return `${down} y ${up}. La palanca vuelve sola a su sitio.`;
  },
  leverAfter: 'La palanca está bajada. La Gran Balanza sigue nivelada.',
  solved: [
    'Los tres platillos bajan a la vez y se quedan a la par.',
    'En la oscuridad de la sima, algo enorme cede con un crujido de cadenas y empieza a subir.',
  ],
  gate: 'Al otro lado de la terraza, la losa que cerraba el paso al núcleo se hunde en el suelo.',
  slab: 'Una losa de basalto encajada entre los pilares del dintel. No hay manera de moverla.',
  resetAsk: 'Una palanca de hierro con el martillo y el pico de los Galena grabados. ¿Tirar? Los contrapesos volverán a su sitio.',
  resetDone: 'Las cadenas de la sima chirrían. Los bloques y las piedras vuelven a su sitio, y las losas rotas del puente suben y encajan.',
  resetSolved: 'La palanca no se mueve: la Balanza está nivelada y lo sujeta todo.',
  plaque: [
    'Una estela con glifos antiguos. Debajo, alguien ha grabado a punzón una traducción:',
    '«La piedra suelta pesa lo que una persona; el basalto, lo que dos; quien cabalga al guardián, lo que tres.»',
    '«La losa que se hunde pide el peso de tres. El suelo débil no sostiene a tres. La arena honda solo deja pasar a quien cabalga.»',
    '«Tres platos y un solo peso. Todo lo que la cámara guarda, sobre ellos.»',
    'Al pie, más reciente: «Padre lo intentó con tres mineros encima. No se movió. —F.»',
  ],
  panLand: (pan) => `El platillo ${PAN_NAMES[pan]} se mece con el peso nuevo.`,
});

// ───────────────────────────── Contrapesos ─────────────────────────────

/** Coloca los eventos de los contrapesos donde dice el estado (al entrar en el mapa y tras la palanca de retorno). */
export function syncPieces(ctx) {
  const st = readPuzzle(ctx.state);
  for (const id of PIECE_IDS) {
    const ev = ctx.world.events.find((e) => e.id === `contrapeso_${id}`);
    if (ev) ev.moveTo(...st.pieces[id]);
  }
}

async function afterMove(ctx, id, st) {
  const [x, y] = st.pieces[id];
  const pan = Object.keys(PANS).find((k) => PANS[k].some(([px, py]) => px === x && py === y));
  if (pan) {
    ctx.se('PRSFX- Iron Defense', { volume: 60 });
    await ctx.say(CAMARA_TEXT.panLand(pan));
  }
}

async function doPush(ctx, ev, id, dir) {
  const st = readPuzzle(ctx.state);
  const p = ctx.player;
  const r = step(st, p.x, p.y, dir, riding(ctx));
  if (r.kind !== 'push' || r.moved !== id) { ctx.se('Player bump'); return false; }
  ctx.se('Strength push');
  await ctx.move(ev, [DIR_NAME[dir]], { through: true, speed: 4 });
  writePuzzle(ctx, r.state);
  await afterMove(ctx, id, r.state);
  return true;
}

async function doPull(ctx, ev, id, dir) {
  const st = readPuzzle(ctx.state);
  const p = ctx.player;
  const r = pull(st, p.x, p.y, dir, riding(ctx));
  if (!r.ok) { await ctx.say(CAMARA_TEXT.noRoom); return false; }
  ctx.se('Strength push');
  const back = DIR_NAME[10 - dir];
  const pm = ctx.move('player', ['direction_fix_on', back, 'direction_fix_off'], { wait: false, through: true, speed: 4 });
  const em = ctx.move(ev, [back], { wait: false, through: true, speed: 4 });
  await Promise.all([pm, em]);
  writePuzzle(ctx, r.state);
  if (r.fell || r.pressed) await applyConsequence(ctx, r);
  await afterMove(ctx, id, r.state);
  return true;
}

async function pieceScript(ctx) {
  const ev = ctx.event;
  const id = ev.def.piece;
  const p = ctx.player;
  const dir = p.direction;
  if (ev.x !== p.x + DV[dir][0] || ev.y !== p.y + DV[dir][1]) return;
  const viaA = Boolean(ctx.world.input?.held?.('A'));
  if (!viaA) { await doPush(ctx, ev, id, dir); return; }
  const text = PIECES[id].kind === 'block' ? CAMARA_TEXT.block : CAMARA_TEXT.stone;
  await ctx.say(text);
  const i = await ctx.choice(CAMARA_TEXT.pieceOpts, { message: CAMARA_TEXT.pieceAsk, cancel: 2 });
  if (i === 0 && !(await doPush(ctx, ev, id, dir))) await ctx.say(CAMARA_TEXT.noPush);
  else if (i === 1) await doPull(ctx, ev, id, dir);
}

function pieceEvent(id) {
  const def = PIECES[id];
  const base = { sprite: def.kind === 'block' ? OBJ.block : OBJ.stone, directionFix: true, walkAnime: false, solid: true };
  return {
    id: `contrapeso_${id}`, x: def.x, y: def.y, piece: id, name: def.kind === 'block' ? 'Bloque de basalto' : 'Piedra suelta',
    pages: [
      { ...base, dir: 2, trigger: 'touch', script: pieceScript },
      { ...base, when: (s) => Boolean(s?.flag(F.balance)), dir: 6, trigger: 'action', script: async (ctx) => { await ctx.say(CAMARA_TEXT.locked); } },
    ],
  };
}

// ───────────────────────────── Caídas, placa y plataforma ─────────────────────────────

/** Lleva al jugador (y a sus acompañantes) a otra casilla del mismo mapa tras un fundido. */
async function teleport(ctx, x, y, dir = 2) {
  await ctx.fade('out', 14);
  ctx.player.moveTo(x, y);
  ctx.player.direction = dir;
  for (const f of ctx.world.followers || []) f.moveTo?.(x, y);
  ctx.requestRefresh();
  await ctx.wait(4);
  await ctx.fade('in', 14);
}

/** Aplica lo que dice la lógica tras quedar el jugador en una casilla: la placa o la caída. */
async function applyConsequence(ctx, r) {
  if (r.pressed) await pressPlate(ctx, r.state);
  if (!r.fell) return;
  ctx.se('Rock Smash');
  ctx.shake(5, 8, 18);
  writePuzzle(ctx, r.state);
  await ctx.flash(LEAD, 8, 140);
  await teleport(ctx, r.at[0], r.at[1], 2);
  ctx.se('Player jump');
  if (!ctx.flag(F.fallSeen)) {
    ctx.setFlag(F.fallSeen);
    for (const t of CAMARA_TEXT.fallFirst) await ctx.say(t);
    await zygardeSays(ctx, 'Juntos pesamos demasiado para ese suelo.');
  } else {
    await ctx.say(r.broke ? CAMARA_TEXT.fall : CAMARA_TEXT.holeFall);
  }
}

/** El jugador está en una losa quebradiza o en un agujero: se rompe (si pesa tres) y cae. */
async function fragileScript(ctx) {
  const p = ctx.player;
  const r = settle(readPuzzle(ctx.state), p.x, p.y, riding(ctx));
  if (r.fell) await applyConsequence(ctx, r);
}

async function pressPlate(ctx, st) {
  writePuzzle(ctx, { ...st, plate: true });
  ctx.se('PRSFX- Rock Wrecker', { volume: 80 });
  ctx.shake(3, 6, 20);
  await ctx.say(CAMARA_TEXT.platePress);
  await ctx.camera.pan(32, 18, 30);
  ctx.se('PRSFX- Iron Defense', { volume: 80 });
  await ctx.flash(LEAD, 10, 110);
  await ctx.wait(20);
  await ctx.say(CAMARA_TEXT.platformUp);
  await ctx.camera.reset(24);
  if (!ctx.flag(F.plateSeen)) {
    ctx.setFlag(F.plateSeen);
    await zygardeSays(ctx, 'Juntos pesamos lo bastante.');
  }
}

async function plateScript(ctx) {
  const p = ctx.player;
  const st = readPuzzle(ctx.state);
  const r = settle(st, p.x, p.y, riding(ctx));
  if (r.pressed) { await pressPlate(ctx, r.state); return; }
  if (!st.plate && !ctx.flag(F.plateHint)) {
    ctx.setFlag(F.plateHint);
    await ctx.say(CAMARA_TEXT.plateHint);
  }
}

function fragileEvents() {
  return cellsOf(CELL.FRAGILE).map(([x, y], i) => {
    const k = `${x},${y}`;
    const hole = (s) => readPuzzle(s).holes.includes(k);
    const base = { sprite: OBJ.floor, directionFix: true, walkAnime: false, through: true, shadow: false, pattern: i % 4 };
    return {
      id: `losa_quebradiza_${x}_${y}`, x, y,
      pages: [
        { ...base, dir: 2 },
        { ...base, when: (s, ev) => !hole(s) && isRiding(ev?.world), dir: 2, trigger: 'touch', script: fragileScript },
        { ...base, when: (s) => hole(s), dir: 4, trigger: 'touch', script: fragileScript },
      ],
    };
  });
}

function plateEvents() {
  const [[x, y]] = cellsOf(CELL.PLATE);
  const latched = (s) => readPuzzle(s).plate;
  const base = { sprite: OBJ.plate, directionFix: true, walkAnime: false, through: true, shadow: false };
  const { down, up } = platformPatches();
  const [[px, py]] = cellsOf(CELL.PIT);
  return [
    {
      id: 'placa', x, y,
      pages: [
        { ...base, dir: 2 },
        { ...base, when: (s, ev) => !latched(s) && !s.flag(F.plateHint) && !isRiding(ev?.world), dir: 2, trigger: 'touch', script: plateScript },
        { ...base, when: (s, ev) => !latched(s) && isRiding(ev?.world), dir: 2, trigger: 'touch', script: plateScript },
        { ...base, when: latched, dir: 4, trigger: 'action', script: async (ctx) => { await ctx.say(CAMARA_TEXT.plateDown); } },
      ],
    },
    {
      id: 'plataforma', x: px, y: py, through: true,
      pages: [{ through: true, patch: down }, { when: latched, through: true, patch: up }],
    },
  ];
}

/** Arena profunda: Terreno complicado solo montado (tipo roughTerrain) con el dibujo de la arena encima. */
function sandEvents() {
  const sand = new Set(cellsOf(CELL.SAND).map(([x, y]) => `${x},${y}`));
  const has = (x, y) => sand.has(`${x},${y}`);
  return cellsOf(CELL.SAND).map(([x, y]) => {
    const mask = (has(x, y - 1) ? 0 : 1) | (has(x + 1, y) ? 0 : 2) | (has(x, y + 1) ? 0 : 4) | (has(x - 1, y) ? 0 : 8);
    return {
      id: `arena_${x}_${y}`, type: 'roughTerrain', kind: 'sand', mounted: true, x, y,
      sprite: OBJ.sand, dir: [2, 4, 6, 8][mask >> 2], pattern: mask & 3, directionFix: true, walkAnime: false, shadow: false,
    };
  });
}

// ───────────────────────────── La Gran Balanza ─────────────────────────────

function panEvents() {
  const out = [];
  for (const [pan, cells] of Object.entries(PANS)) {
    for (const [x, y] of cells) {
      const view = (s) => panView(readPuzzle(s), pan);
      const base = { sprite: OBJ.pan, directionFix: true, walkAnime: false, through: true, shadow: false };
      out.push({
        id: `platillo_${pan}_${x}`, x, y, name: `Platillo ${PAN_NAMES[pan]}`,
        pages: [
          { ...base, dir: 2 },
          { ...base, when: (s) => view(s) === 'down', dir: 4 },
          { ...base, when: (s) => view(s) === 'up', dir: 6 },
          { ...base, when: (s) => Boolean(s?.flag(F.balance)), dir: 8, light: { radius: 40, intensity: 0.5 } },
        ],
      });
    }
  }
  return out;
}

/** Viga, cadenas y eje de la Balanza, y contrapesos colgados sobre la sima (decorado). */
function balanceDecor() {
  const lit = (s) => Boolean(s?.flag(F.balance));
  const piece = (id, x, y, pattern, extra = {}) => ({
    id, x, y, through: true,
    pages: [
      { sprite: OBJ.beam, dir: 2, pattern, directionFix: true, walkAnime: false, shadow: false, ...extra },
      { when: lit, sprite: OBJ.beam, dir: 8, pattern, directionFix: true, walkAnime: false, shadow: false, ...extra },
    ],
  });
  const out = [];
  const bx0 = PANS.A[0][0];
  const bx1 = PANS.C[1][0];
  for (let x = bx0; x <= bx1; x++) {
    if (x >= 17 && x <= 19) continue;
    out.push(piece(`viga_${x}`, x, 8, x === bx0 ? 1 : x === bx1 ? 2 : 0));
  }
  for (const [x] of [...PANS.A, ...PANS.C]) {
    for (let y = 9; y <= 11; y++) {
      if (x === SPOTS.lever.x && y === SPOTS.lever.y) continue;
      out.push(piece(`cadena_${x}_${y}`, x, y, 3));
    }
  }
  // El platillo del centro cuelga del propio eje: dos cadenas bajo sus brazos.
  for (const x of [PANS.B[0][0], PANS.B[2][0]]) out.push(piece(`cadena_${x}_11`, x, 11, 3));
  const { x: ex, y: ey } = SPOTS.pivot;
  out.push({
    id: 'eje_balanza', x: ex, y: ey, through: true, name: 'Gran Balanza',
    pages: [
      { sprite: OBJ.pivot, dir: 2, directionFix: true, walkAnime: false, shadow: false },
      { when: lit, sprite: OBJ.pivot, dir: 4, directionFix: true, walkAnime: false, shadow: false, light: { radius: 90, intensity: 0.7 } },
    ],
  });
  for (const [x, y, speed] of [
    [29, 9, 1], [32, 6, 2], [35, 10, 1], [23, 5, 2], [14, 6, 1], [27, 5, 1],
    [4, 24, 1], [7, 31, 2], [18, 32, 1], [36, 17, 2], [10, 20, 2], [4, 30, 1],
  ]) {
    out.push({ id: `contrapeso_colgado_${x}_${y}`, x, y, through: true, sprite: OBJ.weight, dir: 2, directionFix: true, stepAnime: true, speed, walkAnime: false, shadow: false });
  }
  return out;
}

async function leverScript(ctx) {
  const p = ctx.player;
  const from = SPOTS.leverFrom;
  if (p.x !== from.x || p.y !== from.y) { await ctx.say(CAMARA_TEXT.leverFar); return; }
  if (!(await ctx.confirm(CAMARA_TEXT.leverAsk))) return;
  const ev = ctx.event;
  const mounted = riding(ctx);
  const st = readPuzzle(ctx.state);
  const reading = balanceReading(st, { x: p.x, y: p.y, mounted });
  ctx.se('PRSFX- Shift Gear', { volume: 80 });
  ev.direction = 4;
  await ctx.wait(16);
  if (reading.solved) { await balanceSolved(ctx, st); return; }
  ctx.shake(2, 6, 14);
  ctx.se('PRSFX- Iron Defense', { volume: 60 });
  await ctx.wait(12);
  ev.direction = 2;
  if (reading.light) {
    await ctx.say(CAMARA_TEXT.light);
  } else {
    await ctx.say(CAMARA_TEXT.tilt(reading.heavy, reading.lightest));
    // Pista de la montura: con Zygarde debajo, el platillo de la palanca pesaría lo justo.
    if (!mounted && balanceReading(st, { x: p.x, y: p.y, mounted: true }).solved) {
      await zygardeSays(ctx, 'Súbete. Contigo encima, este platillo pesa lo que los otros dos.');
    }
  }
}

let onSolved = null;
/** La escena de Fermín (b08_camara_scenes.js) se engancha aquí para no crear un ciclo de imports. */
export function setBalanceSolvedHandler(fn) { onSolved = fn; }

async function balanceSolved(ctx, st) {
  writePuzzle(ctx, { ...st, solved: true });
  ctx.setFlag(F.balance);
  ctx.se('PRSFX- Rock Wrecker', { volume: 100 });
  ctx.shake(4, 5, 40);
  await ctx.flash([236, 244, 255], 20, 170);
  for (const t of CAMARA_TEXT.solved) await ctx.say(t);
  await ctx.camera.pan(7, 10, 40);
  for (const x of [6, 7, 8]) {
    const slab = findEvent(ctx, `losa_nucleo_${x}`);
    if (slab) { slab.direction = 4; }
  }
  ctx.se('PRSFX- Earthquake', { volume: 70 });
  await ctx.wait(20);
  for (const x of [6, 7, 8]) { const slab = findEvent(ctx, `losa_nucleo_${x}`); if (slab) slab.direction = 6; }
  await ctx.wait(20);
  ctx.requestRefresh();
  await ctx.say(CAMARA_TEXT.gate);
  await ctx.camera.reset(30);
  if (onSolved) await onSolved(ctx);
}

function leverEvents() {
  const { x, y } = SPOTS.lever;
  const base = { sprite: OBJ.lever, directionFix: true, walkAnime: false, solid: true, trigger: 'action' };
  const slabs = SPOTS.gate.map(([gx, gy]) => ({
    id: `losa_nucleo_${gx}`, x: gx, y: gy,
    pages: [
      { sprite: OBJ.slab, dir: 2, directionFix: true, walkAnime: false, solid: true, shadow: false, trigger: 'action', script: async (ctx) => { await ctx.say(CAMARA_TEXT.slab); } },
      { when: (s) => Boolean(s?.flag(F.balance)), through: true },
    ],
  }));
  return [
    {
      id: 'palanca_balanza', x, y, name: 'Palanca de la Balanza',
      pages: [
        { ...base, dir: 2, script: leverScript },
        { ...base, when: (s) => Boolean(s?.flag(F.balance)), dir: 4, script: async (ctx) => { await ctx.say(CAMARA_TEXT.leverAfter); } },
      ],
    },
    ...slabs,
  ];
}

// ───────────────────────────── Palanca de retorno, estela y mecanismo ─────────────────────────────

async function resetScript(ctx) {
  if (ctx.flag(F.balance)) { await ctx.say(CAMARA_TEXT.resetSolved); return; }
  if (!(await ctx.confirm(CAMARA_TEXT.resetAsk))) return;
  const ev = ctx.event;
  ev.direction = 4;
  ctx.se('PRSFX- Shift Gear', { volume: 90 });
  ctx.shake(3, 6, 24);
  await ctx.flash(LEAD, 16, 140);
  writePuzzle(ctx, resetPieces(readPuzzle(ctx.state)));
  syncPieces(ctx);
  ctx.requestRefresh();
  await ctx.wait(10);
  ev.direction = 2;
  await ctx.say(CAMARA_TEXT.resetDone);
}

function fixtureEvents() {
  const r = SPOTS.resetLever;
  const [px, py] = [SPOTS.plaque.x, SPOTS.plaque.y];
  const readPlaque = async (ctx) => {
    for (const t of CAMARA_TEXT.plaque) await ctx.say(t);
    if (!ctx.flag(F.balance)) await ctx.say('Esta cámara está hecha para medir lo que pesamos juntos.', TELEPATHY);
  };
  return [
    { id: 'palanca_retorno', x: r.x, y: r.y, name: 'Palanca de retorno', sprite: OBJ.lever, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: resetScript },
    { id: 'estela_0', x: px, y: py, trigger: 'action', noOver: true, solid: true, script: readPlaque },
    { id: 'estela_1', x: px + 1, y: py, trigger: 'action', noOver: true, solid: true, script: readPlaque },
  ];
}

/**
 * Vigila casos que no dispara un paso: montar encima de una losa quebradiza o de la placa (el peso cambia sin
 * moverse). Evento paralelo invisible en la roca.
 */
function watcherEvent() {
  return {
    id: 'mecanismo_camara', x: 0, y: 0, trigger: 'parallel',
    script: async (ctx) => {
      const scene = ctx.scene;
      const p = ctx.player;
      if (scene?.runner && !scene.runner.busy && !scene.transferring && !p.busy()) {
        const st = readPuzzle(ctx.state);
        const c = cellAt(p.x, p.y);
        const mounted = riding(ctx);
        const breaks = c === CELL.FRAGILE && (mounted || isHole(st, p.x, p.y));
        const presses = c === CELL.PLATE && mounted && !st.plate;
        if (breaks || presses) await scene.runScript((c2) => (presses ? plateScript(c2) : fragileScript(c2)), null, 'camara:mecanismo');
      }
      await ctx.wait(6);
    },
  };
}

/** Todos los eventos del mecanismo de la Cámara. */
export function mechanismEvents() {
  return [
    ...PIECE_IDS.map(pieceEvent), ...fragileEvents(), ...plateEvents(), ...sandEvents(), ...panEvents(),
    ...balanceDecor(), ...leverEvents(), ...fixtureEvents(), watcherEvent(),
  ];
}
