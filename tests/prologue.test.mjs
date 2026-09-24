// Prólogo y partida nueva (B01 §0–§1): director de cinemáticas, reglas de nombre/estado inicial,
// datos de la dispersión y el mapa montana_portal (escalinata transitable hasta el portal).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Director, CancelledError, isCancel, EASES, SPEED_UP } from '../game/src/content/cutscenes/director.js';
import {
  validateName, validateGender, createNewGameState, prologueSeen, markPrologueSeen, resolveStartMap,
  NAME_MAX, START_HOUR, PROLOGUE_FLAG, PROLOGUE_SEEN_KEY, START_MAP, FALLBACK_MAP, TIME_CAPTION,
} from '../game/src/content/newgameRules.js';
import {
  SHOTS, REGION_POINTS, CORE_TRAILS, landCell, landCells, cellToScreen, resolveRegionPoints, snapCell, coreLaunchVector,
  landGrid, terrainAt,
} from '../game/src/content/cutscenes/prologueData.js';
import { REGION_MAP } from '../game/src/ui/logic/regionMapData.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { dx, dy } from '../game/src/world/gameMap.js';

const ticks = (d, n) => { for (let i = 0; i < n; i++) d.tick(); };

// ───────────────────────────── Director ─────────────────────────────

test('Director.wait se resuelve exactamente tras N fotogramas', async () => {
  const d = new Director();
  let done = false;
  const p = d.wait(3).then(() => { done = true; });
  ticks(d, 2);
  await Promise.resolve();
  assert.equal(done, false);
  ticks(d, 1);
  await p;
  assert.equal(done, true);
  assert.equal(d.frame, 3);
});

test('Director.tween interpola propiedades numéricas y termina en el valor final', async () => {
  const d = new Director();
  const o = { x: 0, y: 10 };
  const p = d.tween(o, { x: 100, y: 0 }, 4, 'linear');
  ticks(d, 2);
  assert.equal(o.x, 50);
  assert.equal(o.y, 5);
  ticks(d, 2);
  await p;
  assert.deepEqual(o, { x: 100, y: 0 });
  assert.throws(() => d.tween({ s: 'a' }, { s: 1 }, 2), /no es numérica/);
});

test('las curvas de interpolación van de 0 a 1', () => {
  for (const [name, fn] of Object.entries(EASES)) {
    assert.ok(Math.abs(fn(0)) < 1e-9, `${name}(0)`);
    assert.ok(Math.abs(fn(1) - 1) < 1e-9, `${name}(1)`);
  }
});

test('Director.every ejecuta tareas por fotograma y las quita al devolver false o fallar', () => {
  const d = new Director();
  let a = 0;
  let b = 0;
  const stop = d.every(() => { a += 1; });
  d.every(() => { b += 1; return b < 2; });
  d.every(() => { throw new Error('tarea rota'); });
  const orig = console.error;
  console.error = () => {};
  try { ticks(d, 5); } finally { console.error = orig; }
  assert.equal(a, 5);
  assert.equal(b, 2);
  stop();
  ticks(d, 2);
  assert.equal(a, 5);
});

test('Director.cancel rechaza esperas, interpolaciones y promesas externas con CancelledError', async () => {
  const d = new Director({ skippable: true });
  const never = new Promise(() => {});
  const w = d.wait(100);
  const t = d.tween({ x: 0 }, { x: 1 }, 100);
  const f = d.waitFor(never);
  d.cancel();
  for (const p of [w, t, f]) await assert.rejects(p, (err) => err instanceof CancelledError && isCancel(err));
  await assert.rejects(d.wait(1), CancelledError);
  assert.throws(() => d.check(), CancelledError);
  assert.equal(isCancel(new Error('otra')), false);
});

test('Director.waitFor devuelve el valor de la promesa externa', async () => {
  const d = new Director();
  assert.equal(await d.waitFor(Promise.resolve(42)), 42);
});

test('los rótulos entran y salen con fundido y caducan', () => {
  const d = new Director();
  d.caption('Primer día', { frames: 50, fade: 10 });
  ticks(d, 5);
  assert.equal(Director.captionAlpha(d.captions[0]), 0.5);
  ticks(d, 20);
  assert.equal(Director.captionAlpha(d.captions[0]), 1);
  ticks(d, 30);
  assert.equal(d.captions.length, 0);
});

test('acelerar con A multiplica los pasos por fotograma', () => {
  const d = new Director();
  assert.equal(d.stepsFor(false), 1);
  assert.equal(d.stepsFor(true), SPEED_UP);
  assert.ok(SPEED_UP > 1);
});

// ───────────────────────────── Partida nueva ─────────────────────────────

test('validateName: 1–10 caracteres, sin nombre por defecto y sin códigos de texto', () => {
  assert.equal(validateName('').ok, false);
  assert.equal(validateName('   ').ok, false);
  assert.equal(validateName(undefined).ok, false);
  assert.deepEqual(validateName('  Ana  '), { ok: true, name: 'Ana', error: null });
  assert.equal(validateName('Ñandú').name, 'Ñandú');
  assert.equal(validateName('A'.repeat(NAME_MAX)).ok, true);
  const long = validateName('A'.repeat(NAME_MAX + 1));
  assert.equal(long.ok, false);
  assert.match(long.error, /10/);
  assert.equal(validateName('Ro\\PNdri').name, 'RoPNdri');
  assert.equal(validateName('\\').ok, false);
});

test('createNewGameState: nombre, género, opciones, mañana y prólogo visto', () => {
  const st = createNewGameState({ name: 'Lía', gender: 'F', options: { textSpeed: 3 }, playerId: 7 });
  assert.equal(st.player.name, 'Lía');
  assert.equal(st.player.gender, 'F');
  assert.equal(st.player.id, 7);
  assert.equal(st.options.textSpeed, 3);
  assert.equal(st.data.clock.minutes, START_HOUR * 60);
  assert.ok(st.isDay());
  assert.equal(st.flag(PROLOGUE_FLAG), true);
  assert.equal(st.party.length, 0);
  assert.throws(() => createNewGameState({ name: '', gender: 'M' }), /nombre/);
  assert.throws(() => createNewGameState({ name: 'Ana', gender: 'X' }), /Género/);
  assert.equal(validateGender('M'), 'M');
});

test('prólogo visto: se recuerda en el almacenamiento y tolera errores', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(prologueSeen(storage), false);
  assert.equal(markPrologueSeen(storage), true);
  assert.equal(mem.get(PROLOGUE_SEEN_KEY), '1');
  assert.equal(prologueSeen(storage), true);
  const broken = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  assert.equal(prologueSeen(broken), false);
  const orig = console.warn;
  console.warn = () => {};
  try { assert.equal(markPrologueSeen(broken), false); } finally { console.warn = orig; }
  assert.equal(prologueSeen(null), false);
});

test('resolveStartMap: usa el inicio de casa_prota_2f o, si falta, el mapa de pruebas', async () => {
  const ok = await resolveStartMap(async (id) => ({ id, start: { x: 4, y: 5, dir: 2 } }));
  assert.deepEqual(ok, { map: START_MAP, x: 4, y: 5, dir: 2, fallback: false });
  const orig = console.warn;
  console.warn = () => {};
  try {
    const missing = await resolveStartMap(async () => { throw new Error('Mapa desconocido'); });
    assert.deepEqual(missing, { map: FALLBACK_MAP, fallback: true });
  } finally { console.warn = orig; }
  assert.equal(TIME_CAPTION, 'Axis. Tres días después.');
});

// ───────────────────────────── Datos del prólogo ─────────────────────────────

test('planos del prólogo en el orden del guion', () => {
  assert.deepEqual([...SHOTS], ['p01', 'p02', 'p03', 'montaje', 'p04', 'final']);
});

test('dispersión (CAMPANA §2.4): cinco estelas grandes en cinco direcciones desde el aljibe', () => {
  const grid = landGrid(REGION_MAP);
  const { origin, village, cores } = REGION_POINTS;
  assert.equal(cores.length, 5);
  assert.deepEqual(CORE_TRAILS.map((t) => t.core), ['N1', 'N2', 'N3', 'N4', 'N5']);
  for (const [x, y] of [origin, village]) assert.ok(landCell(grid, x, y), `(${x},${y}) en tierra`);
  const [n1, n2, n3, n4, n5] = cores;
  const [vx, vy] = village;
  assert.ok(n1[0] === vx && n1[1] < vy && landCell(grid, ...n1), 'N1 al norte del pueblo');
  assert.ok(n2[0] > vx && landCell(grid, ...n2), 'N2 en la meseta del este');
  assert.deepEqual(n3, origin, 'N3 vuelve al propio aljibe');
  assert.ok(n4[1] > vy && !landCell(grid, ...n4), 'N4 en el mar del sur');
  assert.ok(n5[1] < vy && n5[0] > vx && landCell(grid, ...n5), 'N5 en el norte helado');
  assert.ok(origin[0] < vx && origin[1] < vy, 'el Monte del Portal queda al noroeste del pueblo (X22)');
  // Salidas: cuatro direcciones distintas y la del aljibe sube y vuelve
  const from = cellToScreen(origin);
  const vecs = cores.map((c, i) => coreLaunchVector(from, cellToScreen(c), 3.4, CORE_TRAILS[i].arc));
  assert.equal(vecs.filter((v) => v.returns).length, 1, 'solo N3 vuelve al origen');
  assert.ok(vecs[2].returns && vecs[2].vy < 0, 'N3 sube antes de caer en el aljibe');
  const angles = vecs.filter((v) => !v.returns).map((v) => Math.round(Math.atan2(v.vy, v.vx) * 10));
  assert.equal(new Set(angles).size, 4, 'cuatro direcciones distintas');
  assert.ok(landCells().length > 100, 'hay destinos de sobra para 100 células');
  for (const p of [origin, village, ...cores].map(cellToScreen)) assert.ok(p.x > 0 && p.x < 512 && p.y > 0 && p.y < 384);
});

test('dispersión: los puntos se ajustan a la rejilla aunque cambie el atlas (X02) y respetan sus ids', () => {
  const grid = ['......', '.####.', '.####.', '......'];
  const pts = resolveRegionPoints({ grid, points: [{ id: 'villa_alba', x: 2, y: 2 }] });
  assert.deepEqual(pts.village, [2, 2], 'usa el punto del atlas');
  assert.deepEqual(pts.cores[0], [2, 1], 'N1 justo al norte');
  assert.ok(landCell(grid, ...pts.origin) && !landCell(grid, ...pts.cores[3]), 'origen en tierra y N4 en el mar');
  const atlas = { terrain: ['~~~', '~f^', 'l.:'], places: [{ id: 'villa_alba', x: 1, y: 1 }] };
  assert.deepEqual(landGrid(atlas), ['...', '.##', '.##'], 'atlas con tipos: agua = mar, lago y arrecife');
  assert.equal(terrainAt(atlas, 2, 1), '^');
  assert.deepEqual(resolveRegionPoints(atlas).village, [1, 1], 'usa los lugares (places) del atlas');
  assert.deepEqual(snapCell(grid, [0, 0], 'land'), [1, 1]);
  assert.equal(landCell(grid, ...snapCell(grid, [2, 1], 'sea')), false);
  assert.deepEqual(snapCell(grid, [2, 2], 'land'), [2, 2], 'una celda válida no se mueve');
});

// ───────────────────────────── Mapa montana_portal ─────────────────────────────

function reachable(map, sx, sy) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  const player = { isPlayer: true };
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      const nx = x + dx(d);
      const ny = y + dy(d);
      if (!map.valid(nx, ny)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}

test('montana_portal: la escalinata sube desde la explanada hasta el estrado del portal', async () => {
  const { def, entry } = await buildMapNode('montana_portal');
  const mod = await import('../game/src/content/maps/b01/montana_portal.js');
  const { SPOTS } = mod;
  const r = reachable(entry.map, def.start.x, def.start.y);
  const front = { x: SPOTS.aljibe.x, y: SPOTS.aljibe.y + 1 };
  assert.ok(r.has(`${front.x},${front.y}`), 'delante del aljibe alcanzable');
  for (const s of SPOTS.stairs) assert.ok(r.has(`${s.x + 2},${s.y + 1}`), `escalera en ${s.x},${s.y} transitable`);
  // tres tramos ascendentes: cada escalera está más al norte que la anterior
  const ys = SPOTS.stairs.map((s) => s.y);
  assert.deepEqual([...ys].sort((a, b) => b - a), ys);
  // la cara de cada terraza (junto a la escalera) no se pisa: la escalera es el paso entre niveles
  for (const s of SPOTS.stairs) {
    assert.equal(r.has(`${s.x - 2},${s.y + 1}`), false, `cara de terraza junto a ${s.x},${s.y}`);
    assert.equal(r.has(`${s.x + 6},${s.y + 1}`), false, `cara de terraza junto a ${s.x + 4},${s.y}`);
  }
});

test('montana_portal: gran cascada, aljibe como evento y sin encuentros', async () => {
  const { def, built } = await buildMapNode('montana_portal');
  const { SPOTS } = await import('../game/src/content/maps/b01/montana_portal.js');
  const wf = SPOTS.waterfall;
  let waterfall = 0;
  for (let y = wf.y; y < wf.y + wf.h; y++) {
    for (let x = wf.x; x < wf.x + wf.w; x++) {
      const id = built.layers[2][x + y * built.width];
      if (id >= 48 && id < 96) waterfall += 1;
    }
  }
  assert.equal(waterfall, wf.w * wf.h, 'autotile de cascada en toda su caída');
  const aljibe = def.events.find((e) => e.id === 'aljibe');
  assert.ok(aljibe && aljibe.sprite.includes('aljibe'));
  assert.equal(aljibe.x, SPOTS.aljibe.x);
  assert.ok(def.events.filter((e) => e.solid).length >= 19, 'el hueco del aljibe no se puede pisar');
  assert.ok(!def.encounters || Object.keys(def.encounters).length === 0);
  assert.equal(def.outdoor, true);
});
