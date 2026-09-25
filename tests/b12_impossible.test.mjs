// Espacio imposible (world/impossible/, B12; lo reutiliza el P10): giros de mapa gemelo, Anclas, vacío, puentes de la
// mirada, cascadas invertidas, caras de sala y el campo de MapScene (giro encima de un puente → caída).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rotatePoint, rotateDir, rotateRows, twinPosition, encodeAnchor, decodeAnchor, inGaze, bridgeExists, liftRoute,
  isVoidCell, parseFacetRoom, facetKind, facetMasks, facetReach, ANCHOR_VAR,
} from '../game/src/world/impossible/logic.js';
import { IMPOSSIBLE_EVENT_TYPES, isCurrentAnchor } from '../game/src/world/impossible/eventTypes.js';
import { ImpossibleField } from '../game/src/world/impossible/field.js';
import { touchAnchor, fallToAnchor, turnToTwin, rideInvertedFall } from '../game/src/world/impossible/actions.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { VisibleEncounters } from '../game/src/world/visibleEncounters.js';
import { GameState } from '../game/src/core/state.js';
import { GameMap } from '../game/src/world/gameMap.js';
import { testTileset } from './world_helpers.mjs';

test('giros: la casilla girada y su inversa; direcciones y rejillas', () => {
  for (const [w, h] of [[7, 7], [5, 9]]) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [a, b] = rotatePoint(x, y, w, h, 1);
        assert.ok(a >= 0 && a < h && b >= 0 && b < w, 'dentro del mapa girado (h × w)');
        assert.deepEqual(rotatePoint(a, b, h, w, -1), [x, y], 'girar y deshacer');
      }
    }
  }
  assert.deepEqual(rotatePoint(0, 0, 5, 5, 1), [4, 0], 'la esquina NO pasa a la NE (horario)');
  assert.equal(rotateDir(8, 1), 6);
  assert.equal(rotateDir(6, 1), 2);
  assert.equal(rotateDir(2, -1), 6);
  assert.equal(rotateDir(4, 2), 6);
  assert.deepEqual(rotateRows(['ab', 'cd'], 1), ['ca', 'db']);
  assert.deepEqual(rotateRows(rotateRows(['abc', 'def'], 1), -1), ['abc', 'def']);
  assert.deepEqual(twinPosition(5, 5, 1, 3, 8, 1), { x: 1, y: 1, dir: 6 });
});

test('Anclas: codificación y Ancla actual', () => {
  const v = encodeAnchor({ map: 'pilar_invertido', x: 3, y: 4, dir: 8 });
  assert.equal(v, 'pilar_invertido|3|4|8');
  assert.deepEqual(decodeAnchor(v), { map: 'pilar_invertido', x: 3, y: 4, dir: 8 });
  assert.equal(decodeAnchor('nada'), null);
  assert.equal(decodeAnchor(null), null);
  assert.throws(() => encodeAnchor({ x: 1, y: 2 }));
  const st = GameState.create({ name: 'P' });
  st.setVar(ANCHOR_VAR, v);
  assert.ok(isCurrentAnchor(st, { map: { id: 'pilar_invertido' }, x: 3, y: 3 }), 'el poste junto a la casilla guardada');
  assert.ok(!isCurrentAnchor(st, { map: { id: 'otro' }, x: 3, y: 3 }));
});

test('vacío: casilla sin capas 0 y 1 (la capa 2 cuelga sobre el vacío)', () => {
  const layers = [new Uint16Array(9), new Uint16Array(9), new Uint16Array(9)];
  layers[0][0] = 384; layers[1][1] = 384; layers[2][2] = 384;
  const map = new GameMap({ id: 'v', built: { width: 3, height: 3, layers }, tileset: testTileset() });
  assert.equal(isVoidCell(map, 0, 0), false);
  assert.equal(isVoidCell(map, 1, 0), false);
  assert.equal(isVoidCell(map, 2, 0), true, 'solo capa 2');
  assert.equal(isVoidCell(map, 1, 1), true);
  assert.equal(isVoidCell(map, -1, 0), false, 'fuera del mapa no es vacío');
});

test('puentes de la mirada: a 1–4 casillas en la dirección de avance; debajo, mientras no se gire', () => {
  assert.ok(inGaze(5, 5, 6, 6, 5));
  assert.ok(inGaze(5, 5, 6, 9, 5));
  assert.ok(!inGaze(5, 5, 6, 10, 5), 'a 5 casillas');
  assert.ok(!inGaze(5, 5, 6, 4, 5), 'detrás');
  assert.ok(!inGaze(5, 5, 6, 6, 6), 'en diagonal');
  assert.ok(inGaze(5, 5, 8, 5, 1));
  assert.ok(bridgeExists({ x: 5, y: 5, dir: 6, turned: false }, 5, 5));
  assert.ok(!bridgeExists({ x: 5, y: 5, dir: 6, turned: true }, 5, 5), 'girar encima lo hace desaparecer');
  assert.deepEqual(liftRoute({ x: 3, y: 9 }, { x: 3, y: 5 }), ['up', 'up', 'up', 'up']);
  assert.throws(() => liftRoute({ x: 3, y: 5 }, { x: 3, y: 9 }), /encima/);
});

test('caras: tipos por orientación, máscaras de los dos gemelos y alcance con giros', () => {
  assert.equal(facetKind('A', 0), 'floor');
  assert.equal(facetKind('A', 1), 'wall');
  assert.equal(facetKind('B', 1), 'floor');
  assert.equal(facetKind('b', 0), 'void');
  assert.equal(facetKind('c', 1, { cellOrient: 1 }), 'floor');
  assert.throws(() => facetKind('?', 0), /desconocido/);
  const room = parseFacetRoom([
    ' .X. ',
    ' BBB ',
    ' .*. ',
    ' .S. ',
  ]);
  assert.deepEqual(room.start, { x: 2, y: 3 });
  assert.equal(room.aristas.length, 1);
  assert.throws(() => parseFacetRoom([' . ', ' S ']), /salida/);
  const a = facetMasks(room, 0, 2);
  const b = facetMasks(room, 1, 2);
  assert.equal(a.size, b.size);
  assert.equal(a.width, 9);
  assert.equal(b.width, 8, 'el gemelo mide alto × ancho');
  assert.ok(a.vuelta.size === 3 && [...a.vuelta].every((k) => a.wall.has(k)), 'las B son paredes vueltas en la base');
  const [ax, ay] = a.map(2, 2);
  const [bx, by] = b.map(2, 2);
  assert.deepEqual(rotatePoint(ax, ay, a.width, a.height, 1), [bx, by], 'la arista cae en la casilla girada');
  const seen = facetReach(room, { ...room.start, o: 0 });
  assert.ok(seen.has('2,0,1'), 'la salida, en el gemelo');
  assert.ok(!seen.has('2,0,0'), 'sin girar no se llega');
});

test('tipos de evento: ancla (dos páginas), arista (gemelo obligatorio), puente, cascada y pulsador', () => {
  const ancla = expandEventDef({ id: 'a', type: 'ancla', x: 1, y: 1 });
  assert.equal(ancla.pages.length, 2);
  assert.ok(ancla.pages.every((p) => p.solid && p.trigger === 'touch'));
  assert.throws(() => expandEventDef({ id: 'x', type: 'arista', x: 0, y: 0 }), /twin/);
  const arista = expandEventDef({ id: 'x', type: 'arista', x: 0, y: 0, twin: 'gemelo', turn: -1 });
  assert.equal(arista.trigger, 'touch');
  assert.ok(arista.through);
  const puente = expandEventDef({ id: 'p', type: 'puenteMirada', x: 0, y: 0 });
  assert.equal(puente.opacity, 0);
  assert.ok(puente.through);
  assert.throws(() => expandEventDef({ id: 'c', type: 'cascadaInvertida', x: 0, y: 5 }), /top/);
  const st = GameState.create({ name: 'P' });
  const casc = expandEventDef({ id: 'c', type: 'cascadaInvertida', x: 0, y: 5, top: [0, 1], open: (s) => s.flag('abierta') });
  assert.ok(!casc.pages[1].when(st), 'cerrada sin su pulsador');
  st.setFlag('abierta');
  assert.ok(casc.pages[1].when(st), 'abierta');
  assert.ok(casc.pages[0].solid && casc.pages[1].through);
  assert.throws(() => expandEventDef({ id: 'b', type: 'pulsador', x: 0, y: 0 }), /flag/);
  assert.ok(IMPOSSIBLE_EVENT_TYPES.pulsador);
});

// ───────────────────────────── guiones (ctx simulado) ─────────────────────────────

function fakeCtx(state, { map = { id: 'm', width: 9, height: 9 } } = {}) {
  const said = [];
  const transfers = [];
  const player = {
    x: 2, y: 3, direction: 8, opacity: 255, yOffset: 0,
    moveTo(x, y) { this.x = x; this.y = y; }, straighten() {},
  };
  const scene = {
    fx: { rotations: [], rotateTo(a) { this.rotations.push(a); return Promise.resolve(); }, flashScreen() {} },
    transfer: async (id, x, y, dir) => { transfers.push({ id, x, y, dir }); },
    impossible: { markArrival() {}, resetTracking() {} },
    camera: { snapToTarget() {} },
  };
  return {
    state, said, transfers, player, scene, map,
    world: { followers: [] },
    say: async (t) => { said.push(t); },
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    wait: async () => {}, fade: async () => {}, flash: async () => {}, se() {}, face() {}, requestRefresh() {},
    move: async (who, route) => { for (const r of route) if (r === 'up') player.y -= 1; },
  };
}

test('guiones: tocar un Ancla, caer (vuelve al Ancla, sin daño), girar al gemelo y subir por la cascada', async () => {
  const st = GameState.create({ name: 'P' });
  const ctx = fakeCtx(st);
  await touchAnchor(ctx, { text: 'primer poste', firstFlag: 'poste_visto' });
  assert.equal(st.var(ANCHOR_VAR, null), 'm|2|3|8');
  assert.deepEqual(ctx.said, ['primer poste']);
  await touchAnchor(ctx, { text: 'primer poste', firstFlag: 'poste_visto' });
  assert.equal(ctx.said.length, 1, 'el texto solo la primera vez');
  ctx.player.moveTo(6, 6);
  await fallToAnchor(ctx, { firstFlag: 'caida', onFirst: async (c) => c.say('cayó') });
  assert.deepEqual([ctx.player.x, ctx.player.y], [2, 3], 'de vuelta al Ancla');
  assert.equal(ctx.player.opacity, 255);
  assert.deepEqual(ctx.said.slice(-1), ['cayó']);
  st.setVar(ANCHOR_VAR, 'otro_mapa|4|4|2');
  await fallToAnchor(ctx);
  assert.deepEqual(ctx.transfers.at(-1), { id: 'otro_mapa', x: 4, y: 4, dir: 2 }, 'Ancla en otro mapa: warp');
  ctx.player.moveTo(1, 3);
  ctx.player.direction = 8;
  const to = await turnToTwin(ctx, { twin: 'gemelo', turn: 1 });
  assert.deepEqual(to, { x: 5, y: 1, dir: 6 });
  assert.deepEqual(ctx.transfers.at(-1), { id: 'gemelo', x: 5, y: 1, dir: 6 });
  assert.ok(ctx.scene.fx.rotations.some((a) => Math.abs(a - Math.PI / 2) < 1e-9), 'la pantalla gira 90°');
  ctx.player.moveTo(3, 8);
  await rideInvertedFall(ctx, { top: { x: 3, y: 2 } });
  assert.deepEqual([ctx.player.x, ctx.player.y], [3, 2]);
});

test('campo: girar encima de un puente hace caer; andar recto no; el vacío hace caer', () => {
  const layers = [new Uint16Array(25), new Uint16Array(25), new Uint16Array(25)];
  for (const i of [0, 1, 2, 3, 4]) layers[0][i] = 384; // fila 0 de suelo
  const map = new GameMap({ id: 'mirada', built: { width: 5, height: 5, layers }, tileset: testTileset() });
  const st = GameState.create({ name: 'P' });
  const bridge = { x: 2, y: 1, page: {}, erased: false, opacity: 0, def: { type: 'puenteMirada' } };
  const player = { x: 2, y: 0, direction: 2, busy: () => false };
  const scripts = [];
  const world = { player, map, current: { def: {} }, scriptBusy: () => false, requestRefresh() {} };
  const scene = { world, state: st, transferring: false, runScript: (fn, ev, name) => { scripts.push(name); } };
  const field = new ImpossibleField(scene);
  field.onEnterMap({ def: { id: 'mirada', impossible: { section: 'm' } }, events: [bridge] });
  field.update(1 / 60);
  assert.equal(scripts.length, 0, 'en la isla, mirando al puente');
  field.updateBridges();
  assert.ok(bridge.opacity > 0, 'el puente aparece al mirarlo');
  player.y = 1; // paso al puente
  field.update(1 / 60);
  assert.equal(scripts.length, 0, 'andar recto por el puente');
  player.direction = 6; // gira encima
  field.update(1 / 60);
  assert.equal(scripts.length, 1, 'girar encima hace caer');
  field.falling = false;
  field.turnedOn = null;
  field.bridges = [];
  field.resetTracking();
  field.update(1 / 60);
  assert.equal(scripts.length, 2, 'casilla sin suelo: cae');
  assert.equal(st.var(ANCHOR_VAR, null), 'mirada|2|0|2', 'la llegada por warp fija el punto seguro');
});

test('vacío y salvajes: no hay encuentro al pisar el vacío y ningún visible aparece ni camina sobre él', () => {
  const layers = [new Uint16Array(25), new Uint16Array(25), new Uint16Array(25)];
  for (const i of [0, 1, 2, 3, 4]) layers[0][i] = 384; // fila 0 de suelo; el resto, vacío
  const map = new GameMap({ id: 'explanada', built: { width: 5, height: 5, layers }, tileset: testTileset() });
  const st = GameState.create({ name: 'P' });
  const player = { x: 2, y: 0, direction: 2, busy: () => false };
  const world = { player, map, current: { def: { impossible: { section: 'v' } } }, scriptBusy: () => false, requestRefresh() {}, events: [], state: st };
  const field = new ImpossibleField({ world, state: st, transferring: false, runScript() {} });
  field.onEnterMap({ def: { id: 'explanada', impossible: { section: 'v' } }, events: [] });
  assert.equal(field.overVoid(), false, 'sobre la piedra');
  player.y = 2;
  assert.equal(field.overVoid(), true, 'sobre el vacío: MapScene no tira encuentros');
  const visible = new VisibleEncounters(world);
  assert.equal(visible.eligible(1, 0, 'cave'), true, 'la piedra sí');
  assert.equal(visible.eligible(1, 3, 'cave'), false, 'el vacío no');
  world.current = { def: {} };
  assert.equal(visible.eligible(1, 3, 'cave'), true, 'fuera del espacio imposible no cambia nada');
  field.onEnterMap({ def: { id: 'normal' }, events: [] });
  assert.equal(field.overVoid(), false, 'mapa normal: nunca es vacío');
});
