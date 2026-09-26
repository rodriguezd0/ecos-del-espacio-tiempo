// Eventos de la Escalera de Estanques (Pilar de la Corriente, CAMPANA B04): los seis vasos (parches de agua o
// fondo según el estado), las compuertas C1–C4, sus mandos, la palanca de la noria (fondo de E4), la noria, la
// palanca de reinicio (entrada), la estela que explica las reglas y el puente del núcleo. Reglas y modelo del agua:
// b04_hydraulics.js. Geometría: maps/b04/pilar_corriente_layout.js. Tiles: maps/b04/pilar_corriente_tiles.js.
import {
  readPuzzle, writePuzzle, applyAction, actionBlocked, isFull, isOpen, cycleComplete, pondName, gateName,
  CYCLE_FLAG, INITIAL, puzzleState,
} from './b04_hydraulics.js';
import { PONDS, CONTROLS, NORIA, pondParts, cellSet, cellKey, SPOTS } from '../maps/b04/pilar_corriente_layout.js';
import { POND_PATCHES, bridgePatch } from '../maps/b04/pilar_corriente_tiles.js';
import { F, SPRITE, AUDIO } from './b04_common.js';

const WATER_BLUE = [90, 170, 255];
const pondIndex = (id) => Number(id.slice(1)) - 1;
const GATE_ROUTE = Object.freeze(['de E1 a E2', 'de E3 a E4', 'de E4 a E5', 'de E5 a E6']);
/** ¿La corriente circula? (ciclo cerrado; tras el P2 la palanca de mantenimiento puede pararla). */
export const flowing = (s) => Boolean(s?.flag(CYCLE_FLAG));
/** ¿Están arriba las losas del puente del núcleo? (corriente en marcha o Pilar ya restaurado: nada se pierde). */
export const bridgeUp = (s) => Boolean(s?.flag(CYCLE_FLAG) || s?.flag(F.restored));

/** Estado del puzle para dibujar: con la corriente en marcha, todo abierto y la noria girando. */
export function viewState(s) {
  const p = readPuzzle(s);
  if (!flowing(s)) return p;
  return puzzleState({ gates: 15, noria: true, water: p.water });
}

// ───────────────────────────── Vasos ─────────────────────────────

/** Evento invisible por estanque: su página aplica el parche lleno/vacío (MapEvent#applyPatch). */
function pondEvent(pond) {
  const i = pondIndex(pond.id);
  const full = (s) => isFull(readPuzzle(s).water, i);
  const [x, y] = pond.outer;
  return {
    id: `vaso_${pond.id}`, x, y, through: true,
    pages: [
      { when: (s) => !full(s), patch: POND_PATCHES[pond.id].empty, through: true },
      { when: full, patch: POND_PATCHES[pond.id].full, through: true },
    ],
  };
}

/** Compuerta (sprite en el borde del estanque de salida): cerrada (dir 2) o abierta con agua (dir 4). */
function gateSpriteEvent(pond) {
  const g = pond.outlet.gate;
  const open = (s) => isOpen(viewState(s).gates, g);
  const [x, y] = pond.outlet.at;
  const base = { sprite: SPRITE.gate, directionFix: true, walkAnime: false, solid: true, trigger: 'action' };
  const script = async (ctx) => { await ctx.say(`La compuerta ${gateName(g)} (${GATE_ROUTE[g]}). Se maneja desde su mando.`); };
  return {
    id: `compuerta_${gateName(g).toLowerCase()}`, x, y,
    pages: [
      { ...base, when: (s) => !open(s), dir: 2, script },
      { ...base, when: open, dir: 4, stepAnime: true, speed: 3, script },
    ],
  };
}

/** Noria: suelta (dir 6), enganchada y quieta (dir 4) o girando con el ciclo cerrado (dir 2). */
function noriaEvent() {
  const base = { sprite: SPRITE.noria, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: noriaTalk };
  return {
    id: 'noria', x: NORIA.x, y: NORIA.y,
    pages: [
      { ...base, when: (s) => !viewState(s).noria, dir: 6 },
      { ...base, when: (s) => viewState(s).noria && !flowing(s), dir: 4 },
      { ...base, when: flowing, dir: 2, stepAnime: true, speed: 3 },
    ],
  };
}

async function noriaTalk(ctx) {
  const p = viewState(ctx.state);
  if (flowing(ctx.state)) { await ctx.say('La noria gira sin descanso. Sube el agua de E6 a E1 y la escalera entera respira.'); return; }
  await ctx.say(p.noria
    ? 'Una gran noria de madera. Su engranaje está enganchado: en cuanto E6 tenga agua, la subirá hasta E1.'
    : 'Una gran noria de madera. Su engranaje está suelto. La palanca que lo engancha está en el fondo de E4.');
}

/** Bloqueos invisibles de la base de la noria (el sprite ocupa 3×4 casillas). */
function noriaBlockers() {
  return NORIA.cells.filter(([x, y]) => !(x === NORIA.x && y === NORIA.y)).map(([x, y]) => ({
    id: `noria_base_${x}_${y}`, x, y, solid: true, trigger: 'action', script: noriaTalk,
  }));
}

/** Losas del puente del núcleo: suben con la corriente en marcha. */
function bridgeEvent() {
  return {
    id: 'puente_nucleo', x: 19, y: 13, through: true,
    pages: [
      { when: (s) => !bridgeUp(s), patch: bridgePatch(false), through: true },
      { when: bridgeUp, patch: bridgePatch(true), through: true },
    ],
  };
}

// ───────────────────────────── Animación y seguridad ─────────────────────────────

/** Si el jugador está en el fondo de un estanque que se llena, sale por la escalera más cercana. */
async function evacuate(ctx) {
  const p = readPuzzle(ctx.state);
  const pl = ctx.player;
  for (const pond of PONDS) {
    if (!isFull(p.water, pondIndex(pond.id))) continue;
    const parts = pondParts(pond);
    if (!cellSet(parts.floor).has(cellKey(pl.x, pl.y))) continue;
    const exit = parts.stairs.reduce((best, c) => {
      const d = Math.abs(c[0] - pl.x) + Math.abs(c[1] - pl.y);
      return !best || d < best.d ? { c, d } : best;
    }, null);
    await ctx.fade('out', 10);
    pl.moveTo(exit.c[0], exit.c[1]);
    for (const f of ctx.world.followers || []) f.moveTo?.(exit.c[0], exit.c[1]);
    await ctx.fade('in', 10);
    await ctx.say(`¡El agua de ${pond.id} sube de golpe! Sales a tiempo por la escalera.`);
    return true;
  }
  return false;
}

/** Aplica una acción con animación: el agua baja estanque a estanque y la noria gira al subirla. */
export async function runAction(ctx, action) {
  const before = readPuzzle(ctx.state);
  const r = applyAction(before, action);
  let water = before.water;
  const set = (w) => { writePuzzle(ctx.state, puzzleState({ ...r.state, water: w })); ctx.requestRefresh(); };
  set(water);
  const noria = ctx.world.events.find((e) => e.id === 'noria');
  for (const step of r.steps) {
    if (step.by === 'noria') {
      ctx.se(AUDIO.gear);
      if (noria) { noria.direction = 2; noria.stepAnime = true; }
      await ctx.wait(30);
    } else {
      ctx.se(AUDIO.splash, { volume: 70 });
    }
    water = (water & ~(1 << step.from)) | (1 << step.to);
    set(water);
    await ctx.wait(step.by === 'noria' ? 24 : 18);
  }
  writePuzzle(ctx.state, r.state);
  if (noria && !r.cycle) { noria.stepAnime = false; noria.direction = r.state.noria ? 4 : 6; }
  ctx.requestRefresh();
  await ctx.wait(2);
  await evacuate(ctx);
  return r;
}

/** Texto del estado para la estela y los mandos. */
export function stateText(p) {
  const water = [0, 1, 2, 3, 4, 5].map((i) => `${pondName(i)} ${isFull(p.water, i) ? 'lleno' : 'vacío'}`).join(' · ');
  const gates = [0, 1, 2, 3].map((g) => `${gateName(g)} ${isOpen(p.gates, g) ? 'abierta' : 'cerrada'}`).join(' · ');
  return `${water}\n${gates} · noria ${p.noria ? 'enganchada' : 'suelta'}`;
}

const BLOCKED_TEXT = Object.freeze({
  c4_trabada: 'El mando de C4 no cede: un trinquete lo bloquea mientras la noria esté suelta.',
  noria_trabada: 'El engranaje no se suelta: con C4 abierta, el agua empuja la noria.',
  ciclo: 'La corriente sujeta el mecanismo. Ya no hace falta tocarlo.',
});

/** Tras cada acción: si el ciclo se cierra, arranca la escena de la corriente (b04_pilar_core.js). */
let onCycle = null;
export function setCycleHandler(fn) { onCycle = fn; }

async function afterAction(ctx, r) {
  if (!r.cycle || ctx.flag(CYCLE_FLAG)) return;
  ctx.setFlag(CYCLE_FLAG);
  if (onCycle) await onCycle(ctx);
}

// ───────────────────────────── Mandos y palancas ─────────────────────────────

function gateControlEvent(id, g) {
  const pos = CONTROLS[id];
  const open = (s) => isOpen(viewState(s).gates, g);
  const script = async (ctx) => {
    const p = readPuzzle(ctx.state);
    const isOpenNow = isOpen(p.gates, g);
    await ctx.say(`Mando de la compuerta ${gateName(g)} (${GATE_ROUTE[g]}). Ahora está ${isOpenNow ? 'abierta' : 'cerrada'}.`);
    const blocked = actionBlocked(p, { type: 'gate', gate: g });
    if (blocked) { await ctx.say(BLOCKED_TEXT[blocked]); return; }
    const pick = await ctx.choice([isOpenNow ? 'Cerrarla' : 'Abrirla', 'Dejarla así'], { cancel: 1 });
    if (pick !== 0) return;
    ctx.se(AUDIO.lever);
    await ctx.shake(2, 6, 10);
    const r = await runAction(ctx, { type: 'gate', gate: g });
    await afterAction(ctx, r);
  };
  const base = { sprite: SPRITE.lever, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script };
  return {
    id, x: pos.x, y: pos.y,
    pages: [
      { ...base, when: (s) => !open(s), dir: 2 },
      { ...base, when: open, dir: 4, stepAnime: true, speed: 2 },
    ],
  };
}

/** Palanca del engranaje de la noria: en el fondo de E4, solo accesible con E4 vacío. */
function noriaLeverEvent() {
  const pos = CONTROLS.palanca_noria;
  const e4Full = (s) => isFull(readPuzzle(s).water, 3);
  const script = async (ctx) => {
    const p = readPuzzle(ctx.state);
    await ctx.say(`La palanca del engranaje de la noria. El engranaje está ${p.noria ? 'enganchado' : 'suelto'}.`);
    const blocked = actionBlocked(p, { type: 'noria' });
    if (blocked) { await ctx.say(BLOCKED_TEXT[blocked]); return; }
    const pick = await ctx.choice([p.noria ? 'Soltarlo' : 'Engancharlo', 'Dejarlo así'], { cancel: 1 });
    if (pick !== 0) return;
    ctx.se(AUDIO.gear);
    await ctx.shake(3, 5, 16);
    const r = await runAction(ctx, { type: 'noria' });
    if (!p.noria) await ctx.say('A lo lejos, algo encaja con un golpe seco. La noria está enganchada.');
    await afterAction(ctx, r);
  };
  const base = { sprite: SPRITE.lever, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script };
  return {
    id: 'palanca_noria', x: pos.x, y: pos.y,
    pages: [
      { ...base, when: (s) => !e4Full(s) && !viewState(s).noria, dir: 6 },
      { ...base, when: (s) => !e4Full(s) && viewState(s).noria, dir: 8 },
      // Bajo el agua no se alcanza: sin gráfico ni guion.
      { when: e4Full, through: true },
    ],
  };
}

/** Palanca de reinicio (entrada): devuelve todo al estado inicial (CAMPANA). Tras el P2, «mantenimiento». */
function resetLeverEvent() {
  const pos = CONTROLS.palanca_reinicio;
  const script = async (ctx) => {
    const cycle = ctx.flag(CYCLE_FLAG);
    const restored = ctx.flag(F.restored);
    if (cycle && !restored) { await ctx.say(BLOCKED_TEXT.ciclo); return; }
    const msg = restored
      ? 'La palanca de mantenimiento de la Escalera. Si tiras de ella, el agua vuelve a como estaba al principio. ¿Tirar?'
      : 'Una palanca vieja con la madera gastada de tanto usarla. Si tiras de ella, compuertas, noria y agua vuelven a como estaban al principio. ¿Tirar?';
    if (!(await ctx.confirm(msg))) return;
    ctx.se(AUDIO.lever);
    await ctx.shake(4, 6, 24);
    await ctx.flash(WATER_BLUE, 16, 120);
    writePuzzle(ctx.state, puzzleState(INITIAL));
    if (restored) ctx.setFlag(CYCLE_FLAG, false);
    ctx.requestRefresh();
    await ctx.wait(4);
    await evacuate(ctx);
    await ctx.say('El agua ruge por los canales y cada estanque vuelve a su nivel de partida.');
  };
  const base = { sprite: SPRITE.lever, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script };
  return {
    id: 'palanca_reinicio', x: pos.x, y: pos.y,
    pages: [{ ...base, dir: 6 }],
  };
}

/** Estela junto a la entrada: reglas de la Escalera y estado actual. */
function stelaEvent() {
  const script = async (ctx) => {
    await ctx.say('Una estela con glifos antiguos. Debajo, alguien ha grabado en letras corrientes las reglas de la Escalera:');
    await ctx.say('«Estanque lleno: suben las losas. Estanque vacío: se anda por el fondo.»');
    await ctx.say('«Las compuertas sueltan el agua cuesta abajo, de E1 a E6. La noria la sube de E6 a E1 si su engranaje está enganchado; la palanca está en el fondo de E4.»');
    await ctx.say('«Cuando el agua da la vuelta entera con todas las compuertas abiertas, la corriente llega al núcleo.»');
    await ctx.say(`Estado de la Escalera:\n${stateText(viewState(ctx.state))}`);
  };
  return { id: 'estela', x: SPOTS.stelaEvent.x, y: SPOTS.stelaEvent.y, solid: true, trigger: 'action', script };
}

/** Placa del trinquete junto al mando de C4. */
function ratchetPlaque() {
  return {
    id: 'placa_trinquete', x: SPOTS.ratchet.x, y: SPOTS.ratchet.y, type: 'sign',
    text: 'Una placa de bronce atornillada a la roca: «Que no baje agua a E6 si la noria no puede subirla. — L. A., maestre».',
  };
}

/** Todos los eventos del mecanismo. */
export function puzzleEvents() {
  return [
    ...PONDS.map(pondEvent),
    ...PONDS.filter((p) => Number.isInteger(p.outlet.gate)).map(gateSpriteEvent),
    noriaEvent(), ...noriaBlockers(), bridgeEvent(),
    gateControlEvent('mando_c1', 0), gateControlEvent('mando_c2', 1),
    gateControlEvent('mando_c3', 2), gateControlEvent('mando_c4', 3),
    noriaLeverEvent(), resetLeverEvent(), stelaEvent(), ratchetPlaque(),
  ];
}
