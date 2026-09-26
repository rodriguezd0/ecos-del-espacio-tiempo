// Sistema de campo de Zygarde en el mundo (sin navegador): tipos de evento, montura (velocidad, cuestas de
// grava, forma de agua), terreno complicado, detección (latido, marcas del mapa regional), medidor del Buceo,
// destino de Vuelo y Anclaje.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapFromRows } from './world_helpers.mjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { EVENT_TYPES } from '../game/src/world/eventTypes.js';
import { RUN_SPEED } from '../game/src/world/player.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import {
  MOUNT_RUN_SPEED, syncMount, setRiding, isRiding, isMounted, mountForm, desiredForm, canRide, mountAllowed,
  playerWeight, combinedMountSprite, resetMount,
} from '../game/src/world/zygarde/mount.js';
import {
  nearestCell, mapCellCount, cellLabel, regionCellMarks, regionPointMarks,
  detectionMode, mapCellKeys,
} from '../game/src/world/zygarde/detection.js';
import { DiveMeter, DIVE_SEGMENT_FRAMES, isShallow, diveLightRadius, underwaterConfig } from '../game/src/world/zygarde/dive.js';
import { resolveFlyDestination, canFlyFrom, canAnchor } from '../game/src/world/zygarde/actions.js';
import { zygardeArea, cellFoundDefault } from '../game/src/world/zygarde/eventTypes.js';

/** Mundo de prueba. `sprite`: charset base del jugador ('trchar000' de Añil = sin arte de montura → fallback). */
function worldWith(rows, events = [], { abilities = [], form = '10', defExtra = {}, sprite = 'trchar000' } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const a of abilities) state.setZygardeAbility(a, true);
  if (form) state.setZygardeForm(form);
  const world = new World({ state, rng: () => 0.5 });
  const map = mapFromRows(rows);
  const def = { id: 'prueba', outdoor: true, events, ...defExtra };
  world.setCurrent({ id: 'prueba', def, map, offset: { x: 0, y: 0 }, events: null });
  world.player.setCharsets({ walk: sprite, run: sprite, surf: sprite });
  return { world, state };
}

const ev = (world, id) => world.events.find((e) => e.id === id);

test('tipos de evento de Zygarde registrados (sustituyen a los básicos y añaden los nuevos)', () => {
  for (const t of ['zygardeCell', 'ramRock', 'roughTerrain', 'gravelSlope', 'climbWall', 'diveSpot', 'diveVent', 'diveCurrent', 'rebuildGap']) {
    assert.ok(EVENT_TYPES.includes(t), t);
  }
  assert.deepEqual(zygardeArea('gravelSlope', 'g', 2, 3, 2, 1).map((e) => [e.id, e.x, e.y]), [['g_2_3', 2, 3], ['g_3_3', 3, 3]]);
});

test('montura del 10 %: montar sube la velocidad de galope al doble de la carrera y eleva al jugador', () => {
  const { world } = worldWith(['.....', '.....'], [], { abilities: ['run'] });
  world.player.moveTo(2, 1);
  assert.equal(canRide(world), true);
  assert.equal(desiredForm(world), null);
  setRiding(world, true);
  const changes = [];
  assert.equal(syncMount(world, { onFormChange: (a, b) => changes.push([a, b]) }), '10');
  assert.deepEqual(changes, [[null, '10']]);
  assert.equal(isRiding(world), true);
  assert.equal(world.runSpeed(), MOUNT_RUN_SPEED);
  assert.ok(MOUNT_RUN_SPEED - RUN_SPEED === 1, 'un punto de velocidad de Essentials = la mitad de tiempo por casilla');
  assert.ok(world.player.yOffset < 0, 'jugador elevado sobre la montura');
  const char = world.extraCharacters.find((c) => c.id === 'zygarde_mount');
  assert.equal(char.characterName, 'follower:ZYGARDE:1:0');
  assert.equal(char.visible, true);
  assert.equal(playerWeight(world), 3);
  setRiding(world, false);
  syncMount(world);
  assert.equal(mountForm(world), null);
  assert.equal(world.player.yOffset, 0);
  assert.equal(world.runSpeed(), RUN_SPEED);
  assert.equal(playerWeight(world), 1);
});

test('montura: sin Correr, sin Zygarde o en interiores no se monta; nadando o bajo el agua se usa el 50 %', () => {
  const { world, state } = worldWith(['...'], [], { abilities: [] });
  setRiding(world, true);
  assert.equal(syncMount(world), null, 'sin Correr');
  state.setZygardeAbility('run', true);
  assert.equal(syncMount(world), '10');
  world.player.surfing = true;
  assert.equal(syncMount(world), '50');
  world.player.surfing = false;
  world.current.def = { ...world.current.def, outdoor: false };
  assert.equal(syncMount(world), null, 'interior');
  world.current.def = { ...world.current.def, underwater: true };
  assert.equal(syncMount(world), '50');
  assert.equal(mountAllowed({ outdoor: true, noMount: true }), false);
  assert.equal(mountAllowed({ cave: true }), true);
  resetMount(world);
  assert.equal(isMounted(world), false);
});

test('arte combinado de montura: se usa si existe en characters.js; si no, fallback con el seguidor', () => {
  assert.equal(combinedMountSprite('base_inexistente', '10'), null);
  assert.equal(combinedMountSprite('', '10'), null);
  assert.equal(combinedMountSprite('protagonista_m', '10'), 'protagonista_m_ride10');
  assert.equal(combinedMountSprite('protagonista_f', '50'), 'protagonista_f_ride50');
  assert.equal(combinedMountSprite('protagonista_m', '50', { underwater: true }), 'protagonista_m_dive');
  const { world } = worldWith(['.....'], [], { abilities: ['run', 'swim'], sprite: 'protagonista_m' });
  setRiding(world, true);
  syncMount(world);
  assert.equal(world.player.characterName, 'protagonista_m_ride10', 'hoja combinada como sprite del jugador');
  assert.equal(world.player.yOffset, 0);
  assert.equal(world.extraCharacters[0].visible, false, 'sin montura aparte');
  world.player.surfing = true;
  syncMount(world);
  assert.equal(world.player.charsets.surf, 'protagonista_m_ride50');
  world.player.surfing = false;
  world.current.def = { ...world.current.def, underwater: true };
  syncMount(world);
  assert.equal(world.player.charsets.walk, 'protagonista_m_dive', 'bajo el agua: el jugador en la burbuja');
  setRiding(world, false);
  world.current.def = { ...world.current.def, underwater: false };
  syncMount(world);
  assert.equal(world.player.charsets.walk, 'protagonista_m', 'al desmontar recupera sus hojas');
});

test('montura 10 % en vista lateral: la pareja queda centrada en la casilla (anchorX del registro)', () => {
  for (const base of ['protagonista_m', 'protagonista_f']) {
    const { world } = worldWith(['.....'], [], { abilities: ['run'], sprite: base });
    const p = world.player;
    setRiding(world, true);
    for (const [dir, sign] of [[2, 0], [8, 0], [4, -1], [6, 1]]) {
      p.direction = dir;
      syncMount(world);
      assert.equal(Math.sign(p.xOffset), sign, `${base} dir ${dir}: xOffset ${p.xOffset}`);
      if (sign) assert.ok(Math.abs(p.xOffset) >= 10 && Math.abs(p.xOffset) <= 12 && p.xOffset % 2 === 0, `${base} dir ${dir}: ${p.xOffset}`);
    }
    setRiding(world, false);
    syncMount(world);
    assert.equal(p.xOffset, 0, 'a pie vuelve al centro');
  }
});

test('cuesta de grava: bloquea a pie y se cruza montado en el 10 %', () => {
  const { world } = worldWith(['.....'], zygardeArea('gravelSlope', 'grava', 2, 0, 1, 1), { abilities: ['run'] });
  const p = world.player;
  p.moveTo(1, 0);
  assert.equal(p.canMoveInDirection(6), false);
  setRiding(world, true);
  syncMount(world);
  world.refreshEvents();
  assert.equal(p.canMoveInDirection(6), true);
});

test('terreno complicado: barro con la capacidad; arena honda (mounted) además montado', () => {
  const events = [
    { id: 'barro', type: 'roughTerrain', kind: 'mud', x: 2, y: 0 },
    { id: 'arena', type: 'roughTerrain', kind: 'sand', mounted: true, x: 2, y: 1 },
  ];
  const { world, state } = worldWith(['.....', '.....'], events, { abilities: ['run'] });
  const p = world.player;
  p.moveTo(1, 0);
  assert.equal(p.canMoveInDirection(6), false, 'sin Terreno');
  state.setZygardeAbility('terrain', true);
  world.refreshEvents();
  assert.equal(p.canMoveInDirection(6), true, 'con Terreno');
  p.moveTo(1, 1);
  assert.equal(p.canMoveInDirection(6), false, 'arena honda a pie');
  setRiding(world, true);
  syncMount(world);
  world.refreshEvents();
  assert.equal(p.canMoveInDirection(6), true, 'arena honda montado');
});

test('roca agrietada: bloquea; su guion sin Embestida solo describe; el grupo comparte estado', async () => {
  const events = [
    { id: 't1', type: 'ramRock', kind: 'log', group: 'troncos', x: 2, y: 0, tileId: 390 },
    { id: 't2', type: 'ramRock', kind: 'log', group: 'troncos', x: 2, y: 1, tileId: 390, glow: false },
  ];
  const { world, state } = worldWith(['.....', '.....'], events);
  const p = world.player;
  p.moveTo(1, 0);
  assert.equal(p.canMoveInDirection(6), false);
  assert.deepEqual(ev(world, 't1').page.glow, { name: 'zygardeFissure', kind: 'log' });
  assert.equal(ev(world, 't2').page.glow, null);
  const said = [];
  const ctx = { zygarde: (k) => state.zygardeAbility(k), say: async (t) => said.push(t), event: ev(world, 't1'), world };
  await ev(world, 't1').script(ctx);
  assert.match(said[0], /troncos/);
  for (const e of world.events) e.setSelfSwitch('A', true);
  world.refreshEvents();
  assert.equal(ev(world, 't1').page, null);
  assert.equal(p.canMoveInDirection(6), true);
});

test('reconstrucción: el zócalo bloquea hasta reconstruir; los tiles persisten por la página A', () => {
  const tiles = [[2, 0, 2, 384]];
  const { world } = worldWith(['..#..'], [{ id: 'zocalo', type: 'rebuildGap', x: 2, y: 0, tiles }]);
  const p = world.player;
  p.moveTo(1, 0);
  assert.equal(p.canMoveInDirection(6), false);
  assert.deepEqual(ev(world, 'zocalo').page.glow, { name: 'zygardeSocket' });
  ev(world, 'zocalo').setSelfSwitch('A', true);
  world.refreshEvents();
  assert.equal(world.map.data(2, 0, 2), 384, 'patch aplicado');
  assert.equal(p.canMoveInDirection(6), true, 'colisión real: la losa se pisa');
});

test('célula: texto por defecto con el recuento y comprobación de progresión al recogerla', async () => {
  const { world, state } = worldWith(['...'], [{ id: 'c', type: 'zygardeCell', x: 1, y: 0, cell: 'cell_ruta_1_1' }], { form: 'core' });
  const others = CELLS.filter((c) => c.key !== 'cell_ruta_1_1');
  for (const c of others.slice(0, 8)) state.addCell(c.key);
  state.addCore('N1');
  state.setFlag('p1_restored');
  const said = [];
  const ctx = {
    state, world, event: ev(world, 'c'), player: world.player,
    say: async (t, o = {}) => said.push(o.telepathy ? `[T] ${t}` : t), se: () => {}, requestRefresh: () => {},
    flash: async () => {}, wait: async () => {}, effect: () => null, scene: { refreshFollower() {} },
  };
  const page = ev(world, 'c').page;
  assert.equal(page.sprite, 'zygarde_celula');
  assert.ok(!page.stepAnime && !page.walkAnime, 'quieta: sin animación (autor, 25-09-2026)');
  assert.ok(!page.glow && !page.light, 'sin brillo ni luz alrededor');
  await ev(world, 'c').script(ctx);
  assert.equal(said[0], 'Has encontrado una Célula de Zygarde. (9/100)');
  assert.ok(!said.some((t) => t.startsWith('[T]')), 'Zygarde no dice nada al recoger una célula');
  assert.equal(state.zygardeAbility('run'), false, 'aún faltan partes');
  state.addCell(others[8].key);
  assert.equal(cellFoundDefault(state), 'Has encontrado una Célula de Zygarde. (10/100)');
});

test('detección: sin latido ni flecha (autor, 25-09-2026); célula más cercana del mapa y rótulo', async () => {
  const det = await import('../game/src/world/zygarde/detection.js');
  for (const gone of ['heartbeatInterval', 'heartbeatStrength', 'HEARTBEAT_RADIUS', 'vectorAngle']) assert.equal(det[gone], undefined, gone);
  const fx = await import('../game/src/world/zygarde/fx.js').catch(() => null);
  if (fx) assert.ok(!fx.ZYGARDE_EFFECTS.includes('zygardeHeartbeat'), 'sin efecto de latido');
  const events = [
    { id: 'a', type: 'zygardeCell', x: 8, y: 0, cell: 'dev_a' },
    { id: 'b', type: 'zygardeCell', x: 3, y: 1, cell: 'dev_b' },
  ];
  const { world, state } = worldWith(['..........', '..........'], events);
  const near = nearestCell(world.events, 0, 0);
  assert.equal(near.ev.id, 'b');
  assert.deepEqual([near.dx, near.dy, near.dist], [3, 1, 4]);
  state.addCell('dev_b');
  world.refreshEvents();
  assert.equal(nearestCell(world.events, 0, 0).ev.id, 'a');
  assert.deepEqual(mapCellKeys('prueba', world.current.def), ['dev_a', 'dev_b']);
  assert.deepEqual(mapCellCount(state, 'prueba', world.current.def), { found: 1, total: 2 });
  assert.equal(cellLabel(state, 'prueba', world.current.def), 'Células: 1/2');
  assert.equal(cellLabel(state, 'sin_celulas', { events: [] }), '');
});

test('marcas del mapa regional: nada, visitados (Detección mejorada) y crisis del P8', () => {
  const s = GameState.create();
  s.addCell('cell_ruta_1_1');
  s.setPosition('ruta_1', 0, 0);
  assert.equal(detectionMode(s), 'none');
  assert.deepEqual(regionPointMarks(s, [{ id: 'p', mapIds: ['ruta_1'] }]), []);
  s.setZygardeAbility('detect', true);
  const marks = regionCellMarks(s);
  assert.equal(marks.mode, 'visited');
  assert.deepEqual(marks.maps.ruta_1, { total: 6, found: 1, remaining: 5, visited: true, show: true });
  assert.equal(marks.maps.ruta_2.show, false, 'no visitada');
  const pts = regionPointMarks(s, [{ id: 'sur', mapIds: ['ruta_1', 'villa_alba'] }, { id: 'lejos', mapIds: ['ruta_13'] }]);
  assert.deepEqual(pts, [{ id: 'sur', remaining: 6, found: 1, total: 7, visited: true, crisis: false }]);
  s.setFlag('p8_restored');
  assert.equal(detectionMode(s), 'crisis');
  assert.equal(regionCellMarks(s).maps.ruta_13.show, true, 'en la crisis brillan también las no visitadas');
});

test('Buceo: 8 segmentos, uno cada 5 s en zona profunda, nada en la somera; recarga en respiradero', () => {
  const m = new DiveMeter();
  assert.equal(m.segments, 8);
  for (let i = 0; i < DIVE_SEGMENT_FRAMES * 3; i++) m.tick(false);
  assert.equal(m.segments, 8, 'somera: no gasta');
  for (let i = 0; i < DIVE_SEGMENT_FRAMES; i++) m.tick(true);
  assert.equal(m.segments, 7);
  let depleted = 0;
  for (let i = 0; i < DIVE_SEGMENT_FRAMES * 8; i++) if (m.tick(true)) depleted += 1;
  assert.equal(depleted, 1, 'avisa una sola vez');
  assert.equal(m.empty, true);
  assert.equal(m.refill(), true);
  assert.equal(m.segments, 8);
  assert.equal(m.refill(), false);
  const def = { underwater: { shallow: [[0, 0, 2, 2]] } };
  assert.equal(isShallow(def, 1, 1), true);
  assert.equal(isShallow(def, 2, 1), false);
  assert.equal(isShallow({}, 5, 5), true, 'fuera del agua no gasta');
  assert.deepEqual(underwaterConfig({ underwater: true }), { shallow: [] });
  const s = GameState.create();
  assert.equal(diveLightRadius(s), 3 * 32 + 16);
  s.addPokemon({ uid: 'x', species: 'PIKACHU', level: 5, hp: 10, moves: [{ id: 'FLASH', pp: 20 }] });
  assert.equal(diveLightRadius(s), 5 * 32 + 16, 'Destello amplía la luz');
});

test('Vuelo: destino desde el mapa regional (flyTo, mapIds u objeto) y mapas donde se puede', async () => {
  const points = [{ id: 'a', mapIds: ['villa_alba'], flyTo: { map: 'villa_alba', x: 3, y: 4, dir: 2 } }, { id: 'b', mapIds: ['ruta_1'] }];
  assert.deepEqual(await resolveFlyDestination('a', points), { map: 'villa_alba', x: 3, y: 4, dir: 2 });
  assert.deepEqual(await resolveFlyDestination('b', points), { map: 'ruta_1', dir: 2 });
  assert.deepEqual(await resolveFlyDestination({ mapId: 'x', x: 1, y: 2 }, points), { map: 'x', x: 1, y: 2, dir: 2 });
  assert.equal(await resolveFlyDestination(null, points), null);
  assert.equal(await resolveFlyDestination('nada', points), null);
  // Lugar real del atlas: la casilla es el flyPoint de la definición del mapa (resolveFlyTarget de services).
  const defs = {
    villa_zaguan: { id: 'villa_zaguan', start: { x: 3, y: 4, dir: 2 }, flyPoint: { x: 20, y: 16, dir: 8 } },
    villa_alba: { id: 'villa_alba', start: { x: 5, y: 6, dir: 2 } },
  };
  const loadDef = async (id) => { if (!defs[id]) throw new Error(`Mapa desconocido: ${id}`); return defs[id]; };
  assert.deepEqual(await resolveFlyDestination('villa_zaguan', { loadDef }), { map: 'villa_zaguan', x: 20, y: 16, dir: 8 });
  assert.deepEqual(await resolveFlyDestination('villa_alba', { loadDef }), { map: 'villa_alba', x: 5, y: 6, dir: 2 }, 'sin flyPoint: start');
  assert.equal(await resolveFlyDestination('ciudad_caudal', { loadDef }), null, 'mapa aún no construido: no se vuela');
  assert.equal(canFlyFrom({ outdoor: true }), true);
  assert.equal(canFlyFrom({ outdoor: false }), false);
  assert.equal(canFlyFrom({ outdoor: true, underwater: true }), false);
});

test('Anclaje espacial: solo con la capacidad y en zonas marcadas', () => {
  const s = GameState.create();
  assert.equal(canAnchor(s, { anchorZone: true }), false);
  s.setZygardeAbility('anchor', true);
  assert.equal(canAnchor(s, { anchorZone: true }), true);
  assert.equal(canAnchor(s, {}), false);
});
