// Tensión de ejes con la Cadena Roja (world/axis, aditivo B18; B20 lo reutiliza en la Senda del Origen): reglas puras,
// salas ASCII y solucionador, tipos de evento, `voidBlocks` de GameMap y guiones de campo (tensar, caer, corrientes y
// pliegues) sobre el mapa real de la Cámara del Cruce, comparados con el solucionador. Sin navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { GameMap } from '../game/src/world/gameMap.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import {
  AXIS_VAR, AXIS_TIME, AXIS_SPACE, AXIS_TONE_DELTA, normalizeAxis, axisMode, isFrozen, foldsOpen, axisTone,
  parseAxisRoom, walkableAt, isVoidAt, slideFrom, stepResult, afterTension, crystalsNear, solveAxisRoom, axisTraps,
  planSummary, solvableWithout, setAxisCache, cachedAxis,
} from '../game/src/world/axis/logic.js';
import { AXIS_PASS_TILE } from '../game/src/world/axis/eventTypes.js';
import { axisRoomEvents, roomSafe, roomCharAt } from '../game/src/world/axis/roomEvents.js';
import { tenseChain, rideCurrent, crossFold, syncAxis } from '../game/src/world/axis/actions.js';
import { ROOM_PLACES, CAIDA, RIO } from '../game/src/content/maps/b18/cruce_layout.js';
import { testTileset, T } from './world_helpers.mjs';
import { fieldWorld, fieldCtx } from './b18_helpers.mjs';

/** Sala mínima que exige los dos ejes: escombros (tiempo) y un pliegue sobre el vacío (espacio). Sin trampas. */
const FIXED = ['X.1C', '    ', 'C.1.', 'DDDD', 'C..E'];
/** La misma sin el cristal de la salida: desde la salida sin el espacio tensado no se puede volver (trampa). */
const TRAP = ['X.1', '   ', 'C.1', 'DDD', 'C.E'];

/** Reproduce un plan con las reglas paso a paso. → estado final { x, y, mode } */
function replay(room, plan) {
  let s = { x: room.entry.x, y: room.entry.y, mode: null };
  for (const a of plan.actions) {
    if (a.type === 'move') {
      const r = stepResult(room, s.x, s.y, a.dir, s.mode);
      assert.ok(r, `paso imposible ${a.dir} desde (${s.x},${s.y}) con ${s.mode}`);
      s = r.fell ? { ...room.entry, mode: s.mode } : { x: r.x, y: r.y, mode: s.mode };
    } else {
      assert.ok(crystalsNear(room, s.x, s.y).some((c) => c.x === a.crystal.x && c.y === a.crystal.y), `tensión sin cristal al lado en (${s.x},${s.y})`);
      const r = afterTension(room, s.x, s.y, a.mode);
      s = r.fell ? { ...room.entry, mode: a.mode } : { x: r.x, y: r.y, mode: a.mode };
    }
  }
  return s;
}

// ───────────────────────────── lógica pura ─────────────────────────────

test('parseAxisRoom: lee cada elemento de la leyenda y falla con mensajes claros', () => {
  const r = parseAxisRoom(['X>1o', 'C.1E', 'DD..'], { name: 'mini' });
  assert.deepEqual([r.w, r.h], [4, 3]);
  assert.deepEqual(r.entry, { x: 3, y: 1 });
  assert.deepEqual(r.exits, [{ x: 0, y: 0 }]);
  assert.deepEqual(r.crystals, [{ x: 0, y: 1 }]);
  assert.deepEqual(r.debris, [{ x: 0, y: 2 }, { x: 1, y: 2 }]);
  assert.deepEqual(r.currents, [{ x: 1, y: 0, dir: 6 }]);
  assert.deepEqual(r.folds.map((f) => [f.id, f.a, f.b]), [['1', { x: 2, y: 0 }, { x: 2, y: 1 }]]);
  assert.deepEqual(r.items, [{ x: 3, y: 0 }]);
  assert.equal(r.at(-1, 0), '#', 'fuera de la sala es muro');
  assert.throws(() => parseAxisRoom(['..E', '..']), /mide 2/);
  assert.throws(() => parseAxisRoom(['...']), /falta la entrada/);
  assert.throws(() => parseAxisRoom(['E1.', '1.1']), /3 marcas/);
  assert.throws(() => parseAxisRoom(['E?.']), /desconocido/);
  assert.throws(() => parseAxisRoom(['E.E']), /dos entradas/);
  assert.throws(() => parseAxisRoom([]), /vacía/);
});

test('Reglas: el tiempo congela escombros y corrientes; el espacio abre los pliegues; nada tensado, todo se mueve', () => {
  const r = parseAxisRoom(['E>>. ', '.<<  ', 'D1..1']);
  assert.equal(normalizeAxis('otro'), null);
  const s = GameState.create({ name: 'P' });
  assert.equal(axisMode(s), null);
  s.setVar(AXIS_VAR, AXIS_SPACE);
  assert.equal(axisMode(s), AXIS_SPACE);
  assert.ok(isFrozen(AXIS_TIME) && !isFrozen(AXIS_SPACE) && !isFrozen(null));
  assert.ok(foldsOpen(AXIS_SPACE) && !foldsOpen(AXIS_TIME) && !foldsOpen(null));
  // Escombros
  assert.equal(walkableAt(r, 0, 2, null), false);
  assert.equal(walkableAt(r, 0, 2, AXIS_TIME), true);
  assert.equal(walkableAt(r, 0, 2, AXIS_SPACE), false);
  assert.ok(isVoidAt(r, 0, 2, AXIS_SPACE) && !isVoidAt(r, 0, 2, AXIS_TIME) && isVoidAt(r, 4, 0, AXIS_TIME));
  // Corrientes: arrastran hasta salir; hacia el vacío, caída; congeladas, se pisan sin moverse
  assert.deepEqual(slideFrom(r, 1, 0, null), { x: 3, y: 0, fell: false, path: [6, 6] });
  assert.deepEqual(stepResult(r, 0, 0, 6, AXIS_TIME), { x: 1, y: 0, fell: false, via: 'walk' });
  assert.deepEqual(stepResult(r, 0, 0, 6, null), { x: 3, y: 0, fell: false, via: 'current' });
  assert.deepEqual(stepResult(r, 0, 1, 6, AXIS_SPACE), { x: 0, y: 1, fell: false, via: 'current' }, 'la corriente de vuelta deja al jugador donde empezó');
  // Pliegues: con el espacio tensado, pisar una marca lleva a la otra
  assert.deepEqual(stepResult(r, 2, 2, 4, AXIS_SPACE), { x: 4, y: 2, fell: false, via: 'fold' });
  assert.deepEqual(stepResult(r, 2, 2, 4, AXIS_TIME), { x: 1, y: 2, fell: false, via: 'walk' });
  // Cambiar de eje encima de un escombro o de una corriente
  assert.deepEqual(afterTension(r, 0, 2, AXIS_SPACE), { x: 0, y: 2, fell: true });
  assert.deepEqual(afterTension(r, 0, 2, AXIS_TIME), { x: 0, y: 2, fell: false });
  assert.deepEqual(afterTension(r, 2, 0, AXIS_SPACE), { x: 3, y: 0, fell: false });
  assert.deepEqual(crystalsNear(parseAxisRoom(['C.E']), 1, 0), [{ x: 0, y: 0, dir: 4 }]);
});

test('Tono del mapa: el eje suma su desplazamiento al tono base (gris acotado); sin eje, el base', () => {
  assert.deepEqual(axisTone([10, 10, 10, 230], AXIS_TIME), [-10, 4, 36, 255]);
  assert.deepEqual(axisTone(undefined, AXIS_SPACE), [...AXIS_TONE_DELTA.space]);
  assert.deepEqual(axisTone([1, 2, 3, 4], null), [1, 2, 3, 4]);
  assert.equal(setAxisCache('nada'), null);
  assert.equal(setAxisCache(AXIS_TIME), AXIS_TIME);
  assert.equal(cachedAxis(), AXIS_TIME);
  setAxisCache(null);
});

test('Solucionador: una sala mínima exige los dos ejes; el plan se reproduce; axisTraps detecta la trampa', () => {
  const room = parseAxisRoom(FIXED, { name: 'fija' });
  const plan = solveAxisRoom(room);
  assert.ok(plan, 'la sala mínima no tiene solución');
  const sum = planSummary(plan);
  assert.deepEqual([...sum.modes].sort(), [AXIS_SPACE, AXIS_TIME]);
  assert.equal(sum.folds, 1);
  const end = replay(room, plan);
  assert.ok(room.exits.some((e) => e.x === end.x && e.y === end.y), 'el plan no acaba en la salida');
  assert.equal(solvableWithout(room, AXIS_TIME), false, 'se resuelve sin congelar');
  assert.equal(solvableWithout(room, AXIS_SPACE), false, 'se resuelve sin abrir el pliegue');
  assert.deepEqual(axisTraps(room), []);
  const trap = parseAxisRoom(TRAP, { name: 'trampa' });
  assert.ok(solveAxisRoom(trap), 'la sala trampa también se resuelve desde la entrada');
  const found = axisTraps(trap);
  assert.ok(found.length > 0, 'axisTraps no ve la trampa');
  assert.ok(found.some((t) => t.x === 0 && t.y === 0 && t.mode !== AXIS_SPACE && t.noEntry), 'la salida sin espacio tensado debería ser trampa');
});

// ───────────────────────────── tipos de evento ─────────────────────────────

const noSelf = { selfSwitch: () => false };
const active = (def, s) => def.pages.map((p, i) => (p.when(s, noSelf) ? i : -1)).filter((i) => i >= 0);
const withAxis = (mode, varName = AXIS_VAR) => { const s = GameState.create({ name: 'P' }); if (mode) s.setVar(varName, mode); return s; };

test('Tipos de evento: cristal, escombro (patch pasable), corriente y pliegue cambian de página con el eje', () => {
  const crystal = expandEventDef({ id: 'c', type: 'axisCrystal', x: 1, y: 1 });
  assert.equal(crystal.axisKind, 'crystal');
  assert.deepEqual([null, AXIS_TIME, AXIS_SPACE].map((m) => active(crystal, withAxis(m))), [[0], [1], [2]]);
  assert.deepEqual(crystal.pages.map((p) => [p.dir, p.solid, p.trigger]), [[2, true, 'action'], [4, true, 'action'], [6, true, 'action']]);

  const debris = expandEventDef({ id: 'd', type: 'axisDebris', x: 3, y: 4 });
  assert.equal(debris.axisKind, 'debris');
  assert.deepEqual(debris.pages[0].patch, [[3, 4, 2, 0]]);
  assert.deepEqual(debris.pages[1].patch, [[3, 4, 2, AXIS_PASS_TILE]]);
  assert.ok(debris.pages.every((p) => p.through));
  assert.deepEqual([null, AXIS_TIME, AXIS_SPACE].map((m) => active(debris, withAxis(m))), [[0], [1], [0]]);
  assert.deepEqual(expandEventDef({ id: 'd2', type: 'axisDebris', x: 0, y: 0, passTile: 999 }).pages[1].patch, [[0, 0, 2, 999]]);

  assert.throws(() => expandEventDef({ id: 'k', type: 'axisCurrent', x: 0, y: 0 }), /dir/);
  const current = expandEventDef({ id: 'k', type: 'axisCurrent', x: 0, y: 0, dir: 6 });
  assert.deepEqual([null, AXIS_TIME, AXIS_SPACE].map((m) => active(current, withAxis(m))), [[0], [1], [0]]);
  assert.equal(current.pages[0].trigger, 'touch');
  assert.equal(typeof current.pages[0].script, 'function');
  assert.ok(!current.pages[1].trigger, 'la corriente congelada no arrastra');

  assert.throws(() => expandEventDef({ id: 'f', type: 'axisFold', x: 0, y: 0 }), /to/);
  const fold = expandEventDef({ id: 'f', type: 'axisFold', x: 0, y: 0, to: { x: 5, y: 5 } });
  assert.deepEqual([null, AXIS_TIME, AXIS_SPACE].map((m) => active(fold, withAxis(m))), [[0], [0], [1]]);
  assert.equal(fold.pages[1].trigger, 'touch');
});

test('Tipos de evento: variable propia (axisVar) y condición extra (when) para reutilizarlos en otro bloque', () => {
  const debris = expandEventDef({ id: 'd', type: 'axisDebris', x: 0, y: 0, axisVar: 'eje_b20' });
  const s = withAxis(AXIS_TIME, 'eje_b20');
  assert.deepEqual(active(debris, s), [1]);
  assert.deepEqual(active(debris, withAxis(AXIS_TIME)), [0], 'lee la variable global en vez de la propia');
  const gated = expandEventDef({ id: 'c', type: 'axisCrystal', x: 0, y: 0, when: (st) => st.flag('b20_tramo') });
  const g = withAxis(null);
  assert.deepEqual(active(gated, g), []);
  g.setFlag('b20_tramo');
  assert.deepEqual(active(gated, g), [0]);
});

test('axisRoomEvents: un evento por elemento de la sala en coordenadas del mapa, con punto seguro y objetos', () => {
  const room = parseAxisRoom(['X>1o', 'C.1E', 'DD..'], { name: 'mini' });
  const evs = axisRoomEvents(room, { ox: 10, oy: 20, prefix: 'mini', items: [{ item: 'POTION', count: 2 }] });
  const of = (type) => evs.filter((e) => e.type === type);
  assert.equal(new Set(evs.map((e) => e.id)).size, evs.length, 'ids repetidos');
  const safe = roomSafe(room, 10, 20);
  assert.deepEqual(safe, { x: 13, y: 21, dir: 8 });
  assert.deepEqual(of('axisCrystal').map((e) => [e.x, e.y, e.safe]), [[10, 21, safe]]);
  assert.deepEqual(of('axisDebris').map((e) => [e.x, e.y]), [[10, 22], [11, 22]]);
  assert.deepEqual(of('axisCurrent').map((e) => [e.x, e.y, e.dir]), [[11, 20, 6]]);
  assert.deepEqual(of('axisFold').map((e) => [e.x, e.y, e.to]).sort(), [[12, 20, { x: 12, y: 21 }], [12, 21, { x: 12, y: 20 }]].sort());
  assert.deepEqual(of('item').map((e) => [e.x, e.y, e.item, e.count]), [[13, 20, 'POTION', 2]]);
  assert.equal(roomCharAt(room, 10, 20, 11, 20), '>');
  assert.equal(roomCharAt(room, 10, 20, 9, 20), null);
  for (const e of evs) expandEventDef(e); // todos se expanden sin error
});

// ───────────────────────────── GameMap.voidBlocks ─────────────────────────────

test('GameMap.voidBlocks: una casilla sin ningún tile bloquea; sin la opción se pisa; un tile la vuelve suelo', () => {
  const tileset = testTileset();
  const layers = () => {
    const l = [new Uint16Array(9).fill(T.GRASS), new Uint16Array(9), new Uint16Array(9)];
    l[0][4] = 0; // (1, 1) sin tiles
    return l;
  };
  const mk = (voidBlocks) => new GameMap({ id: 'v', def: { id: 'v', voidBlocks }, built: { width: 3, height: 3, layers: layers() }, tileset });
  const m = mk(true);
  assert.ok(m.isVoid(1, 1) && !m.isVoid(0, 0));
  assert.equal(m.playerPassable(1, 1, 2, {}), false);
  assert.equal(m.passable(1, 1, 4, null, {}), false);
  assert.equal(m.passableStrict(1, 1), false);
  m.setTile(1, 1, 2, T.GRASS);
  assert.ok(!m.isVoid(1, 1) && m.playerPassable(1, 1, 2, {}) && m.passableStrict(1, 1), 'el tile del patch no la vuelve suelo');
  const n = mk(false);
  assert.ok(n.isVoid(1, 1) && n.playerPassable(1, 1, 2, {}), 'sin voidBlocks una casilla vacía debería pisarse (RMXP)');
});

// ───────────────────────────── guiones de campo sobre la Cámara real ─────────────────────────────

const at = (place, c) => ({ x: place.ox + c.x, y: place.oy + c.y });

test('Cámara real: tensar congela los escombros (se pisan); tensar hacia Palkia encima de uno devuelve a la entrada', async () => {
  const t = await fieldWorld('camara_cruce');
  const ctx = fieldCtx(t);
  const d = at(CAIDA, CAIDA.grid.debris[0]);
  assert.ok(t.map.isVoid(d.x, d.y) && !t.map.playerPassable(d.x, d.y, 2, {}), 'el escombro que cae se pisa');
  assert.equal(await tenseChain(ctx, AXIS_TIME, { safe: CAIDA.entry }), AXIS_TIME);
  assert.equal(t.state.var(AXIS_VAR, null), AXIS_TIME);
  assert.equal(cachedAxis(), AXIS_TIME);
  assert.ok(!t.map.isVoid(d.x, d.y) && t.map.playerPassable(d.x, d.y, 2, {}), 'el escombro congelado no se pisa');
  t.p.moveTo(d.x, d.y);
  await tenseChain(ctx, AXIS_SPACE, { safe: CAIDA.entry });
  assert.deepEqual([t.p.x, t.p.y], [CAIDA.entry.x, CAIDA.entry.y], 'no cae a la entrada de la sala');
  assert.ok(t.map.isVoid(d.x, d.y));
  assert.ok(ctx.log.toasts.some((m) => /Caes al vacío/.test(m)));
  await assert.rejects(tenseChain(ctx, 'arriba'), /eje inválido/);
  setAxisCache(null);
});

test('Cámara real: cada corriente arrastra (o hace caer) exactamente como el solucionador, con el eje sin tensar y con el espacio', async () => {
  const t = await fieldWorld('camara_cruce');
  const ctx = fieldCtx(t);
  let rides = 0;
  let falls = 0;
  for (const mode of [null, AXIS_SPACE]) {
    t.state.setVar(AXIS_VAR, mode);
    t.w.refreshEvents();
    for (const place of ROOM_PLACES) {
      for (const c of place.grid.currents) {
        rides += 1;
        const start = at(place, c);
        t.p.moveTo(start.x, start.y);
        const r = await rideCurrent(ctx, { safe: place.entry });
        const want = slideFrom(place.grid, c.x, c.y, mode);
        const end = want.fell ? place.entry : at(place, want);
        assert.deepEqual([t.p.x, t.p.y], [end.x, end.y], `${place.name} (${c.x},${c.y}) con ${mode}: el juego y el solucionador no coinciden`);
        assert.equal(r === 'fell', want.fell);
        if (want.fell) falls += 1;
      }
    }
  }
  assert.ok(rides >= 60 && falls >= 12, `pocas corrientes comprobadas (${rides}, ${falls} caídas)`);
  // Congeladas (tiempo): no arrastran
  t.state.setVar(AXIS_VAR, AXIS_TIME);
  t.w.refreshEvents();
  const c = at(RIO, RIO.grid.currents[0]);
  t.p.moveTo(c.x, c.y);
  assert.equal(await rideCurrent(ctx, { safe: RIO.entry }), 'out');
  assert.deepEqual([t.p.x, t.p.y], [c.x, c.y]);
});

test('Cámara real: cada pliegue lleva a su pareja; syncAxis y el tono del mapa siguen a la tensión guardada', async () => {
  const t = await fieldWorld('camara_cruce', { vars: { [AXIS_VAR]: AXIS_SPACE } });
  const ctx = fieldCtx(t);
  for (const place of ROOM_PLACES) {
    for (const f of place.grid.folds) {
      const a = at(place, f.a);
      const b = at(place, f.b);
      const ev = t.w.events.find((e) => e.x === a.x && e.y === a.y && e.def?.axisKind === 'fold' && e.page);
      assert.ok(ev && ev.trigger === 'touch', `${place.name}: el pliegue ${f.id} no está abierto con el espacio tensado`);
      t.p.moveTo(a.x, a.y);
      assert.equal(await crossFold(ctx, ev.def.to), true);
      assert.deepEqual([t.p.x, t.p.y], [b.x, b.y], `${place.name}: el pliegue ${f.id} no lleva a su pareja`);
    }
  }
  setAxisCache(null);
  const base = t.def.tone;
  assert.equal(syncAxis(t.state), AXIS_SPACE);
  assert.deepEqual(t.def.tone, axisTone(base, AXIS_SPACE), 'el tono del mapa no sigue al eje');
  setAxisCache(null);
  assert.deepEqual(t.def.tone, base);
});
