// Bloque 19 — la Calzada del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15): reglas de los tramos forzados, guiones con un
// contexto de prueba (solución, derrumbe, reinicio al volver al borde, Reconstrucción y la Tabla Draco con la API de
// historia), datos del bloque (entrenadores, encuentros, objetos) y enlaces con los bloques vecinos (B09a, B17, B20).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { storyApi } from '../game/src/content/story/api.js';
import {
  SPAN_DEFS, cellsOf, solveSpan, spanFlag, spanMaskVar, spanFootVar, stoneAt,
} from '../game/src/content/events/b19_spans_logic.js';
import { onStone, onEdge, useNeedle, spanReadyVar, resetSpan, SPAN_TEXT } from '../game/src/content/events/b19_spans.js';
import { spanPatch } from '../game/src/content/maps/b19/calzada_patch.js';
import { isLand, isChasm, TRAINERS, ITEMS, EXITS } from '../game/src/content/maps/b19/calzada_layout.js';
import { F, V } from '../game/src/content/events/b19_common.js';
import { takeTablet } from '../game/src/content/events/b19_taller.js';
import { PENA_TEXT } from '../game/src/content/events/b19_pena.js';
import TRAINERS_B19 from '../game/src/content/trainers/b19.js';
import { CALZADA_CAVE, SIMA_CAVE, SALAMENCE_ALFA } from '../game/src/content/encounters/b19.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import { DESCENTS, PUERTA_QUINCE } from '../game/src/content/maps/b19/links.js';
import { UMBRAL, ITEMS as SIMA_ITEMS, ARRIVALS } from '../game/src/content/maps/b19/sima_layout.js';
import { PUERTA } from '../game/src/content/maps/b20/layout.js';
import { PENDING_LINKS as B09A_LINKS } from '../game/src/content/maps/b09a/links.js';
import { PENDING_LINKS as B17_LINKS } from '../game/src/content/maps/b17/links.js';
import { JOURNAL_BLOCKS } from '../game/src/content/story/journal.js';
import { loadMapDefinition } from '../game/src/content/maps/index.js';
import fs from 'node:fs';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url)));
const SPECIES = load('species.json');
const ITEM_DB = { ...load('items.json'), ...load('items_axis.json') };

/** Contexto de guion de prueba (sin motor): registra lo dicho y aplica los cambios de estado. */
function fakeCtx(state, { at = [0, 0], choices = [], map = 'calzada_rey' } = {}) {
  const said = [];
  const tiles = [];
  const ctx = {
    state, said, tiles,
    player: { x: at[0], y: at[1], direction: 8, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} },
    world: { followers: [], events: [] },
    map: { id: map },
    scene: null,
    say: async (t, o = {}) => { said.push(o.speaker ? `${o.speaker}: ${t}` : (o.telepathy ? `Zygarde: ${t}` : t)); },
    choice: async () => (choices.length ? choices.shift() : 0),
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    zygarde: (k) => Boolean(state.zygardeAbility(k)),
    setTile: (x, y, l, id) => tiles.push([x, y, l, id]),
    giveItem: async (id, n = 1) => { state.addItem(id, n); said.push(`objeto ${id}`); },
    requestRefresh() {}, se() {}, me() {}, cry() {}, shake() {}, heal() {},
    wait: async () => {}, fade: async () => {}, flash: async () => {}, effect: () => null,
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

function newState(flags = []) {
  const st = GameState.create({ name: 'Prueba', gender: 'F' });
  for (const f of ['p9_restored', F.intro, ...flags]) st.setFlag(f);
  st.setZygardeForm?.('complete');
  st.setZygardeAbility('rebuild', true);
  return st;
}

async function walkStones(ctx, n, path) {
  for (const [x, y] of path) {
    ctx.player.x = x; ctx.player.y = y;
    await onStone(ctx, n, stoneAt(n, x, y));
  }
}

// ───────────────────────────── Reglas de los tramos ─────────────────────────────

test('tramos: una sola solución, metas dentro de la Calzada de verdad y entradas solo desde su orilla', () => {
  for (const d of SPAN_DEFS) {
    const c = cellsOf(d.n);
    assert.equal(solveSpan(d.n, { countLimit: 100 }).count, 1, `tramo ${d.n}: no tiene solución única`);
    for (const g of c.goals) assert.ok(g.x >= d.road.x0 && g.x <= d.road.x1 && g.y >= d.road.y0 && g.y <= d.road.y1, `tramo ${d.n}: meta (${g.x},${g.y}) fuera de la calzada`);
    for (const [x, y] of d.near) assert.ok(isLand(x, y), `tramo ${d.n}: orilla (${x},${y}) sin tierra`);
    for (const [x, y] of d.far) assert.ok(isChasm(x, y), `tramo ${d.n}: salida (${x},${y}) no es vacío`);
    const nearSet = new Set(d.near.map(([x, y]) => `${x},${y}`));
    for (const s of c.stones) {
      assert.ok(isChasm(s.x, s.y), `tramo ${d.n}: piedra (${s.x},${s.y}) sobre tierra`);
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const [nx, ny] = [s.x + dx, s.y + dy];
        if (isLand(nx, ny)) assert.ok(nearSet.has(`${nx},${ny}`), `tramo ${d.n}: la piedra (${s.x},${s.y}) toca tierra fuera de la orilla (${nx},${ny})`);
      }
    }
    const patch = new Set(spanPatch(d.n).map(([x, y]) => `${x},${y}`));
    for (const [x, y] of [...d.far]) assert.ok(patch.has(`${x},${y}`), `tramo ${d.n}: la Reconstrucción no alza (${x},${y})`);
    assert.ok(isLand(d.beyond.x, d.beyond.y), `tramo ${d.n}: (beyond) sin tierra`);
  }
});

test('tramos: la solución despierta la aguja y la Reconstrucción alza la Calzada de verdad', async () => {
  for (const d of SPAN_DEFS) {
    const st = newState();
    const [path] = solveSpan(d.n, { limit: 1 }).paths;
    const ctx = fakeCtx(st, { choices: [0] });
    await walkStones(ctx, d.n, path);
    assert.equal(st.var(spanReadyVar(d.n)), 1, `tramo ${d.n}: la aguja no despierta en la meta`);
    const ok = await useNeedle(ctx, d.n);
    assert.ok(ok && st.flag(spanFlag(d.n)), `tramo ${d.n}: la Reconstrucción no alza la Calzada`);
    assert.equal(ctx.tiles.length, spanPatch(d.n).length, `tramo ${d.n}: no se escriben todas las losas`);
    assert.equal(st.var(spanMaskVar(d.n)), 0, `tramo ${d.n}: la máscara no vuelve a 0`);
  }
});

test('tramos: la aguja no responde fuera de la meta; quedarse sin salida hunde el tramo y devuelve al borde', async () => {
  const st = newState();
  const ctx = fakeCtx(st, { choices: [0] });
  assert.equal(await useNeedle(ctx, 1), false, 'la aguja alza la Calzada sin pisar las piedras');
  assert.ok(!st.flag(spanFlag(1)));
  // Tramo 3: (34,21) → (34,20) → (33,20) → (33,19) → (34,19) deja la última piedra sin salida.
  await walkStones(ctx, 3, [[34, 21], [34, 20], [33, 20], [33, 19], [34, 19]]);
  const start = SPAN_DEFS[2].start;
  assert.deepEqual([ctx.player.x, ctx.player.y], [start.x, start.y], 'tras el derrumbe no se vuelve al borde');
  assert.equal(st.var(spanMaskVar(3)), 0, 'tras el derrumbe las piedras no vuelven a alzarse');
  assert.equal(st.var(spanFootVar(3)), -1);
  assert.equal(st.var(V.collapses), 1);
  assert.ok(st.flag(F.firstCollapse) && ctx.said.some((t) => t === SPAN_TEXT.collapseFirst[0]) && !ctx.said.some((t) => t.startsWith('Zygarde:')), 'sin la narración del rescate (Zygarde no habla, autor 25-09-2026)');
});

test('tramos: volver a la orilla con piedras caídas las vuelve a alzar', async () => {
  const st = newState();
  const ctx = fakeCtx(st);
  await walkStones(ctx, 1, [[13, 39], [13, 38]]);
  assert.notEqual(st.var(spanMaskVar(1)), 0, 'la primera piedra no ha caído');
  ctx.player.x = 13; ctx.player.y = 39;
  await onStone(ctx, 1, stoneAt(1, 13, 39));
  ctx.player.x = 13; ctx.player.y = 40;
  await onEdge(ctx, 1);
  assert.equal(st.var(spanMaskVar(1)), 0);
  assert.equal(st.var(spanFootVar(1)), -1);
  assert.ok(ctx.said.some((t) => /vuelve a alzar las piedras/.test(t)));
  resetSpan(st, 1);
});

// ───────────────────────────── Tabla Draco ─────────────────────────────

test('Tabla Draco: Crónica XV, pista T15 resuelta, Salamencita y cambio en el mundo', async () => {
  const st = newState([F.casandraBeaten]);
  const ctx = fakeCtx(st, { map: 'calzada_taller' });
  await ctx.story.openClue('T15', { direct: true, silent: true });
  await takeTablet(ctx);
  assert.ok(st.data.tablets.includes('DRACOPLATE') && st.itemCount('DRACOPLATE') === 1, 'sin Tabla Draco');
  assert.equal(ctx.story.clueStatus('T15'), 'solved', 'la pista T15 no se resuelve');
  assert.equal(st.itemCount('SALAMENCITE'), 1, 'sin Salamencita');
  for (const f of [F.tablet, F.salamencite, F.resonatorOff, F.caretakers]) assert.ok(st.flag(f), `falta ${f}`);
  assert.ok(ctx.said.some((t) => t.includes('el Eje no elige reyes; elige a quien camina')), 'no se lee la Crónica XV');
  assert.ok(ctx.said.some((t) => /^Casandra: Se equivocó/.test(t)), 'Casandra no reacciona');
});

test('Alerce, antes de la bajada: la línea de CAMPANA, literal', () => {
  assert.ok(PENA_TEXT.gael.includes('Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir.'));
});

// ───────────────────────────── Datos ─────────────────────────────

test('entrenadores: equipos del inventario de Axis, niveles de la curva y dinero de BALANCE; Casandra de TABLILLAS', () => {
  for (const [id, def] of Object.entries(TRAINERS_B19)) {
    const r = checkTrainerMoney(id, def);
    assert.ok(r.ok, r.problem);
    const party = typeof def.party === 'function' ? def.party(GameState.create({ name: 'x' })) : def.party;
    for (const p of party) {
      assert.ok(SPECIES[p.species], `${id}: especie ${p.species}`);
      assert.ok(p.level >= 62 && p.level <= 65, `${id}: nivel ${p.level} fuera de 62–65`);
    }
  }
  const cas = TRAINERS_B19.b19_casandra.party.map((p) => `${p.species}:${p.level}`);
  assert.deepEqual(cas, ['DRUDDIGON:63', 'NOIVERN:63', 'SHELGON:64', 'KOMMOO:65']);
  for (const t of TRAINERS) assert.ok(TRAINERS_B19[t.trainer], `${t.id}: entrenador ${t.trainer} inexistente`);
});

test('encuentros: tablas de POKEDEX_DISTRIBUCION (Calzada 60–64, Sima 60–65) y Salamence Alfa 64', () => {
  const sum = (tab) => tab.reduce((a, r) => a + r[0], 0);
  assert.equal(sum(CALZADA_CAVE), 100);
  assert.equal(sum(SIMA_CAVE), 100);
  assert.deepEqual(CALZADA_CAVE.map((r) => `${r[1]}:${r[0]}`), ['SHELGON:30', 'JANGMOO:30', 'DRUDDIGON:20', 'GABITE:15', 'HAKAMOO:5']);
  assert.deepEqual(SIMA_CAVE.map((r) => `${r[1]}:${r[0]}`), ['DEINO:20', 'BELDUM:20', 'GIBLE:20', 'DURALUDON:15', 'ELGYEM:15', 'ZWEILOUS:5', 'METANG:5']);
  for (const r of CALZADA_CAVE) assert.deepEqual([r[2], r[3]], [60, 64]);
  for (const r of SIMA_CAVE) assert.deepEqual([r[2], r[3]], [60, 65]);
  assert.deepEqual(SALAMENCE_ALFA, { species: 'SALAMENCE', level: 64, alpha: true });
});

test('objetos: existen y la Metagrossita está en la Sima (POKEDEX §7.7)', () => {
  for (const it of [...ITEMS, ...SIMA_ITEMS]) assert.ok(ITEM_DB[it.item], `${it.id}: objeto ${it.item} inexistente`);
  assert.ok(SIMA_ITEMS.some((i) => i.item === 'METAGROSSITE'));
});

// ───────────────────────────── Enlaces ─────────────────────────────

test('enlaces: Ruta 7 (B09a), bajadas de B17, Puerta de las Quince (B20) y salida del bloque', async () => {
  const r7 = B09A_LINKS.ruta_7.calzada_rey;
  assert.equal(EXITS.south.offset, -r7.offset, 'offset de la Ruta 7 no simétrico');
  const calzada = await loadMapDefinition('calzada_rey');
  assert.ok(calzada.connections.some((c) => c.to === 'ruta_7' && c.dir === 'south' && c.offset === -r7.offset));
  for (const [id, d] of Object.entries(DESCENTS)) {
    const theirs = B17_LINKS[id].sima_eje.from;
    assert.deepEqual([theirs.x0, theirs.x1, theirs.y], [d.xs[0], d.xs[1], d.rim.y], `${id}: la bajada no coincide con B17`);
  }
  const sima = await loadMapDefinition('sima_eje');
  const inPlaza = (p) => p.x >= UMBRAL.plaza.x0 && p.x <= UMBRAL.plaza.x1 && p.y >= UMBRAL.plaza.y0 && p.y <= UMBRAL.plaza.y1;
  assert.ok(inPlaza(sima.puertaQuinceArrival), 'la vuelta de la Puerta de las Quince no cae en el Umbral');
  assert.deepEqual([PUERTA_QUINCE.x, PUERTA_QUINCE.y, PUERTA_QUINCE.dir], [PUERTA.arrive.x, PUERTA.arrive.y, PUERTA.arrive.dir]);
  assert.ok(sima.warps.some((w) => w.to === 'calzada_rey'));
  assert.deepEqual([ARRIVALS.north.x, ARRIVALS.north.y], [DESCENTS.senda_mirador.xs[0], DESCENTS.senda_mirador.sima.arriveY]);
  assert.ok(JOURNAL_BLOCKS.some((j) => j.block === 'B19' && j.flag === F.exit), 'la salida del bloque no es la del Diario');
});
