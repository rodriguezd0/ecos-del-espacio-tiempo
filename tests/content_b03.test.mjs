// Bloque 3 — Interludio 1: Zaguán, Ruta 2 y llegada a Caudal (docs/CAMPANA.md B03). Datos (células, encuentros,
// entrenadores, enlaces) y escenas con un ctx simulado sobre un GameState real: T01 completo (jardinero, campanario,
// banco y Tabla Pradal, Mirta), Lía y el Repartir Exp, Gael B2 (gane o pierda) y la llamada de Alerce, Anselmo (T02),
// la Caña Vieja, el árbol de miel y las ruedas de molino según el estado del río.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { loadDb } from '../tools/validate_content_lib.mjs';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { storyApi } from '../game/src/content/story/api.js';
import { clueStatus, clueEntry } from '../game/src/content/story/clueLogic.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { F, V, B03_CELLS } from '../game/src/content/events/b03_common.js';
import { spiralCells, T01_SITE, T01_REPLACES, withT01, t01ZaguanEvents, T01_FLAGS } from '../game/src/content/events/b03_t01.js';
import { liaCentroEvents } from '../game/src/content/events/b03_lia.js';
import { gaelBridgeScene } from '../game/src/content/events/b03_caudal_gael.js';
import { anselmoTalk, fisherTalk } from '../game/src/content/events/b03_caudal_npcs.js';
import { honeyTreeEvent, pickEncounter } from '../game/src/content/events/b03_ruta2.js';
import { caudalEvents } from '../game/src/content/events/b03_caudal.js';
import { RUTA_2, RUTA_2_HONEY, CAUDAL } from '../game/src/content/encounters/b03.js';
import trainers from '../game/src/content/trainers/b03.js';
import ruta2 from '../game/src/content/maps/b03/ruta_2.js';
import caudal from '../game/src/content/maps/b03/ciudad_caudal.js';

const db = loadDb();
const KEY_POCKET = 8;

function mockCtx(state, { battle = 'win', events = [] } = {}) {
  const said = [];
  const world = { core: null, events, player: { x: 31, y: 9, direction: 8 } };
  const ctx = {
    state, world, said, db, audio: null, ui: { toast() {} }, event: null,
    get player() { return world.player; },
    say: async (t, o = {}) => { said.push({ t: String(t), who: o.telepathy ? 'Core' : (o.speaker || '') }); },
    confirm: async () => true, choice: async () => 0,
    wait: async () => {}, fade: async () => {}, flash: async () => {}, shake: async () => {}, tone: async () => {},
    se() {}, me() {}, bgm() {}, cry() {}, emote: async () => {}, face() {}, turnToPlayer() {}, approach: async () => {},
    move: async () => {}, erase() {}, requestRefresh() {}, heal() { ctx.healed = true; },
    movePlayerTo: async (x, y) => { world.player.x = x; world.player.y = y; },
    effect: () => ({ remove() {} }), camera: { pan: async () => {}, reset: async () => {} },
    directionTo: () => 8,
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    async giveItem(id, n = 1) {
      const it = db.items[id];
      assert.ok(it, `objeto ${id}`);
      if (it.pocket === KEY_POCKET) state.addKeyItem(id); else state.addItem(id, n);
    },
    async battle(cfg) { ctx.lastBattle = cfg; return battle; },
    async wildBattle(enc) { ctx.lastWild = enc; return 'run'; },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

const newState = (...flags) => {
  const s = GameState.create({ name: 'Prueba' });
  for (const f of flags) s.setFlag(f);
  return s;
};
const saidText = (ctx) => ctx.said.map((l) => l.t).join('\n');
const script = (events, id) => events.find((e) => e.id === id).script;

// ───────────────────────────── Datos ─────────────────────────────

test('células del bloque: claves y códigos del registro, en su mapa y con evento en la casilla fijada', () => {
  const byKey = new Map(CELLS.map((c) => [c.key, c]));
  for (const c of B03_CELLS) {
    const reg = byKey.get(c.id);
    assert.ok(reg, `${c.id} en content/zygarde/cells.js`);
    assert.equal(reg.id, c.code, `${c.id}: código`);
    assert.equal(reg.map, c.map, `${c.id}: mapa`);
    assert.equal(reg.stage, c.stage, `${c.id}: etapa`);
    const def = c.map === 'ruta_2' ? ruta2 : caudal;
    const ev = def.events.find((e) => e.id === c.id);
    assert.ok(ev, `${c.id}: evento en ${c.map}`);
    assert.deepEqual([ev.x, ev.y], [c.x, c.y], `${c.id}: casilla`);
  }
  assert.deepEqual(B03_CELLS.map((c) => c.code).sort(), ['C013', 'C014', 'C015', 'C068', 'C070']);
});

test('las células de etapa A/B están en tierra y las de Nadar (F) en agua', async () => {
  const maps = { ruta_2: await buildMapNode('ruta_2'), ciudad_caudal: await buildMapNode('ciudad_caudal') };
  for (const c of B03_CELLS) {
    const m = maps[c.map].entry.map;
    const t = m.terrainTagAt(c.x, c.y);
    if (c.stage === 'F') assert.ok(t.canSurf, `${c.code} debería estar en agua navegable`);
    else assert.ok(!t.canSurf && m.passableStrict(c.x, c.y), `${c.code} debería estar en tierra transitable`);
  }
});

test('bajo los puentes y pasarelas no hay «agua» (no salta el aviso de nadar al pulsar A a lo largo)', async () => {
  const c = (await buildMapNode('ciudad_caudal')).entry.map;
  for (const [x, y] of [[31, 11], [38, 11], [44, 12], [37, 40], [9, 27], [50, 29], [29, 41]]) {
    assert.ok(!c.terrainTagAt(x, y).canSurf, `Caudal (${x},${y})`);
    assert.ok(c.playerPassable(x, y, 2, {}), `Caudal (${x},${y}) transitable`);
  }
  const r = (await buildMapNode('ruta_2')).entry.map;
  // Puentes de tablones y embarcadero del estanque
  for (const [x, y] of [[14, 16], [14, 53], [18, 27], [19, 28]]) assert.ok(!r.terrainTagAt(x, y).canSurf, `Ruta 2 (${x},${y})`);
});

test('Caudal: toda llegada desde la Ruta 2 pasa por la llamada de Gael (no se puede rodear el B2)', async () => {
  const { entry } = await buildMapNode('ciudad_caudal');
  const m = entry.map;
  const strip = new Set(caudal.events.filter((e) => e.id.startsWith('entrada_gael_')).map((e) => `${e.x},${e.y}`));
  const south = ruta2.connections.find((c) => c.to === 'ciudad_caudal');
  const r = (await buildMapNode('ruta_2')).entry.map;
  for (let x = 0; x < m.width; x++) {
    const rx = x + south.offset;
    if (!m.passableStrict(x, 0) || rx < 0 || rx >= r.width || !r.passableStrict(rx, r.height - 1)) continue;
    // Casilla de llegada: la de debajo (y 1) es la franja de Gael o no se puede pisar
    assert.ok(strip.has(`${x},1`) || !m.passableStrict(x, 1), `llegada por x ${x} sin franja de Gael`);
  }
  assert.ok(strip.size >= 4);
});

test('Caudal: bordes cerrados salvo los enlaces y los dos vanos de la estación entran', async () => {
  const { entry } = await buildMapNode('ciudad_caudal');
  const m = entry.map;
  // Borde oeste: solo el sendero de la ribera (y 3–5) y el río (y 10–13)
  for (let y = 14; y < m.height; y++) assert.ok(!m.passableStrict(0, y), `borde oeste abierto en y ${y}`);
  // Orilla junto a la verja de la Senda del Mirador (x 48)
  for (let y = 52; y < m.height; y++) assert.ok(!m.passableStrict(48, y), `orilla (48,${y}) abierta`);
  const toStation = caudal.warps.filter((w) => w.to === 'caudal_estacion').map((w) => `${w.x},${w.y}`).sort();
  assert.deepEqual(toStation, ['57,43', '58,43']);
});

test('Caudal: la llegada por la boca norte lleva al puente y dispara el B2', async () => {
  const s = newState(F.p1);
  const ctx = mockCtx(s, { battle: 'win', events: [{ id: 'gael', x: 31, y: 12 }] });
  ctx.world.player.x = 29; ctx.world.player.y = 1;
  const ev = caudal.events.find((e) => e.id === 'entrada_gael_29');
  await ev.script(ctx);
  assert.deepEqual([ctx.world.player.x, ctx.world.player.y], [31, 8], 'baja hasta el puente');
  assert.ok(s.flag(F.gael) && s.flag(F.alerce));
  assert.ok(!ev.when(s), 'la franja se apaga tras la escena');
});

test('encuentros: tablas de POKEDEX_DISTRIBUCION (pesos 100, niveles y especies existentes)', () => {
  const sum = (t) => t.reduce((a, r) => a + r[0], 0);
  for (const [name, table] of Object.entries({ ...RUTA_2, honey: RUTA_2_HONEY, ...Object.fromEntries(Object.entries(CAUDAL).map(([k, v]) => [`caudal_${k}`, v])) })) {
    assert.equal(sum(table), 100, `${name} suma 100`);
    for (const [, sp] of table) assert.ok(db.species[sp], `${name}: ${sp}`);
  }
  // Curva inicial del autor (DECISIONES «DECIDIDO (autor, 25-09-2026)»): antes hierba 7–12 y Caña Vieja 8–15.
  assert.ok(RUTA_2.grass.every((r) => r[2] === 5 && r[3] === 9), 'hierba de la Ruta 2: 5–9');
  assert.ok(CAUDAL.fish_old.every((r) => r[2] === 8 && r[3] === 13), 'Caña Vieja de Caudal: 8–13');
  assert.deepEqual(ruta2.encounters, RUTA_2);
  assert.deepEqual(caudal.encounters, CAUDAL);
});

// Curva inicial del autor (DECISIONES «DECIDIDO (autor, 25-09-2026)»): el Gael B2 de 12/12/14 era «mucha diferencia»
// para quien acaba de elegir el inicial; ahora Starly 9, Riolu 9 e inicial 11, y entrenadores 7–11 (antes 9–13).
test('entrenadores: curva del Interludio 1 (7–11) y Gael B2 con Starly 9, Riolu 9 e inicial con ventaja 11', () => {
  for (const [id, t] of Object.entries(trainers)) {
    if (id === 'gael_2') continue;
    for (const p of t.party) assert.ok(p.level >= 7 && p.level <= 11, `${id}: ${p.species} ${p.level}`);
  }
  const s = newState();
  s.setVar('starter', 'SOBBLE');
  const party = trainers.gael_2.party(s);
  assert.deepEqual(party.map((p) => [p.species, p.level]), [['STARLY', 9], ['RIOLU', 9], ['TURTWIG', 11]]);
  assert.equal(trainers.gael_2.canLose, true);
});

test('enlaces: Ruta 2 ↔ Caudal simétrico y la entrada norte encaja con Villa Zaguán (B02)', async () => {
  const south = ruta2.connections.find((c) => c.to === 'ciudad_caudal');
  const north = caudal.connections.find((c) => c.to === 'ruta_2');
  assert.equal(south.dir, 'south');
  assert.equal(north.dir, 'north');
  assert.equal(south.offset, -north.offset);
  const zl = await import('../game/src/content/maps/b02/villa_zaguan_layout.js').catch(() => null);
  if (zl?.TOWN_EXITS?.south) assert.equal(zl.TOWN_EXITS.south.x0 - 5, 13, 'camino sur de Zaguán (x 18–21) = x 13–16 de la Ruta 2');
});

// ───────────────────────────── T01 ─────────────────────────────

test('T01: la espiral sale del pie del Fundador y acaba bajo la losa central del banco', () => {
  const cells = spiralCells();
  const trunk = T01_SITE.founderTrunk[1];
  assert.deepEqual(cells[0], { x: trunk.x + 1, y: trunk.y });
  assert.deepEqual(cells[cells.length - 1], T01_SITE.bench);
  assert.equal(new Set(cells.map((c) => `${c.x},${c.y}`)).size, cells.length, 'sin casillas repetidas');
  for (let i = 1; i < cells.length; i++) {
    assert.equal(Math.abs(cells[i].x - cells[i - 1].x) + Math.abs(cells[i].y - cells[i - 1].y), 1, 'trazo continuo');
  }
});

test('T01: withT01 sustituye el banco y la campana genéricos de B02 y añade el arco', () => {
  const b02 = [{ id: 'banco_piedra' }, { id: 'campana_0' }, { id: 'vecina' }];
  const merged = withT01(b02);
  for (const id of T01_REPLACES) assert.ok(!merged.some((e) => e.id === id), id);
  assert.ok(merged.some((e) => e.id === 'vecina'));
  assert.ok(merged.some((e) => e.id === 't01_banco_1') && merged.some((e) => e.id === 't01_campana_0'));
  const ids = merged.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
});

test('T01 completo: jardinero → campanario → banco (Tabla Pradal, Crónica I) → Mirta (Semilla Milagro)', async () => {
  const s = newState(F.p1, F.libreta);
  const ev = t01ZaguanEvents();
  const ctx = mockCtx(s);
  // Antes de la vista, el banco solo se describe
  await script(ev, 't01_banco_1')(ctx);
  assert.ok(!s.flag(F.t01Done));
  await script(ev, 't01_jardinero')(ctx);
  assert.ok(s.flag(F.t01Gardener));
  assert.equal(clueEntry(s, 'T01').step, 2, 'segunda pista');
  await script(ev, 't01_campana_0')(ctx);
  assert.ok(s.flag(F.t01View));
  assert.match(saidText(ctx), /su centro no está en el árbol/);
  await script(ev, 't01_banco_1')(ctx);
  assert.ok(s.data.tablets.includes('MEADOWPLATE'));
  assert.equal(clueStatus(s, 'T01'), 'solved');
  assert.ok(s.flag(F.t01Done));
  assert.ok(!s.flag(T01_FLAGS.digging), 'el banco vuelve a su sitio');
  assert.match(saidText(ctx), /Se estaba bebiendo el agua de las raíces/);
  await script(ev, 't01_mirta')(ctx);
  assert.equal(s.itemCount('MIRACLESEED'), 1);
  await script(ev, 't01_mirta')(ctx);
  assert.equal(s.itemCount('MIRACLESEED'), 1, 'solo una vez');
});

test('T01 antes del P1: nadie deja cavar ni subir a mirar (disponible tras P1)', async () => {
  const s = newState();
  const ev = t01ZaguanEvents();
  const ctx = mockCtx(s);
  await script(ev, 't01_campana_0')(ctx);
  await script(ev, 't01_banco_1')(ctx);
  assert.ok(!s.flag(F.t01View) && !s.flag(F.t01Done));
});

// ───────────────────────────── Lía, Gael, Alerce, Anselmo, pescador ─────────────────────────────

test('Lía aparece tras el P1, entrega el Repartir Exp una sola vez y se va', async () => {
  const [lia] = liaCentroEvents();
  assert.equal(lia.when(newState()), false);
  const s = newState(F.p1);
  assert.equal(lia.when(s), true);
  const ctx = mockCtx(s);
  await lia.script(ctx);
  assert.equal(s.itemCount('EXPSHARE'), 1);
  assert.ok(s.flag(F.lia));
  assert.equal(lia.when(s), false);
});

test('Gael B2: si gana el jugador, célula a la esclusa, llamada de Alerce y flags de salida', async () => {
  const s = newState(F.p1);
  const ctx = mockCtx(s, { battle: 'win', events: [{ id: 'gael', x: 31, y: 12 }] });
  await gaelBridgeScene(ctx);
  assert.equal(ctx.lastBattle.trainer, 'gael_2');
  assert.equal(ctx.lastBattle.canLose, true);
  assert.ok(s.flag(F.gael) && s.flag(F.gaelWon) && s.flag(F.alerce));
  const t = saidText(ctx);
  assert.match(t, /Encontré una célula/);
  assert.match(t, /Se me escapó de las manos… hacia ti\./);
  assert.match(t, /¿Balizas de tres patas en la Garganta\?/);
  assert.match(t, /…Da igual\. Id con cuidado\./);
  const cell = caudalEvents({}).find((e) => e.id === 'cell_caudal_1');
  assert.ok(cell.when(s), 'C014 aparece tras la escena');
});

test('Gael B2: si pierde el jugador, la historia sigue (cura y cambia la frase de Gael)', async () => {
  const s = newState(F.p1);
  const ctx = mockCtx(s, { battle: 'lose', events: [{ id: 'gael', x: 31, y: 12 }] });
  await gaelBridgeScene(ctx);
  assert.ok(ctx.healed);
  assert.ok(s.flag(F.gael) && !s.flag(F.gaelWon) && s.flag(F.alerce));
  assert.match(saidText(ctx), /Ganar no cambia nada/);
});

test('Anselmo abre la pista T02 con su frase exacta; el pescador regala la Caña Vieja', async () => {
  const s = newState(F.p1);
  const ctx = mockCtx(s);
  await anselmoTalk(ctx);
  assert.equal(clueStatus(s, 'T02'), 'active');
  assert.match(saidText(ctx), /«La muela del Diezmo pesa como un río\.»/);
  await anselmoTalk(ctx);
  assert.equal((s.clues || []).filter((c) => c.id === 'T02').length, 1);
  await fisherTalk(ctx);
  assert.ok(s.hasKeyItem('OLDROD'));
  assert.ok(s.flag(F.oldRod));
  // Gyaradosita (POKEDEX §7.7): solo con Nadar y una vez
  await fisherTalk(ctx);
  assert.equal(s.itemCount('GYARADOSITE'), 0, 'sin Nadar no hay megapiedra');
  s.setZygardeAbility('swim');
  await fisherTalk(ctx);
  await fisherTalk(ctx);
  assert.equal(s.itemCount('GYARADOSITE'), 1);
});

// ───────────────────────────── Mundo ─────────────────────────────

test('árbol de miel: se unta, espera a un descanso y entonces aparece un Pokémon de su tabla', async () => {
  const s = newState();
  const ev = honeyTreeEvent({ id: 'arbol', x: 1, y: 1 });
  const ctx = mockCtx(s);
  await ev.script(ctx);
  assert.equal(s.var(V.honey, 0), 0, 'sin Miel no pasa nada');
  s.addItem('HONEY', 1);
  await ev.script(ctx);
  assert.equal(s.itemCount('HONEY'), 0);
  assert.equal(s.var(V.honey, 0), 1);
  await ev.script(ctx);
  assert.equal(ctx.lastWild, undefined, 'hay que descansar antes');
  s.setVar(V.restCount, 1);
  await ev.script(ctx);
  assert.ok(RUTA_2_HONEY.some((r) => r[1] === ctx.lastWild.species));
  assert.equal(s.var(V.honey, 0), 0);
  const counts = {};
  let seed = 1;
  const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 2000; i++) { const e = pickEncounter(RUTA_2_HONEY, rng); counts[e.species] = (counts[e.species] || 0) + 1; }
  assert.ok(counts.COMBEE > counts.HERACROSS && counts.HERACROSS > (counts.MUNCHLAX || 0));
});

test('ruedas de molino: a trompicones de día y paradas de noche hasta P2; el Diezmo gira al revés hasta T02', () => {
  const ev = caudalEvents({});
  const page = (id, s) => {
    const pages = ev.find((e) => e.id === id).pages;
    for (let i = pages.length - 1; i >= 0; i--) if (pages[i].when(s)) return pages[i];
    return null;
  };
  const s = newState();
  s.data.clock.minutes = 10 * 60;
  assert.equal(page('rueda_molino', s).dir, 8);
  assert.equal(page('rueda_diezmo', s).dir, 4, 'el Diezmo no gira antes de P2 («el río ya no lo mueve»)');
  s.data.clock.minutes = 23 * 60;
  assert.equal(page('rueda_molino', s).dir, 4);
  assert.equal(page('rueda_diezmo', s).dir, 4);
  s.setFlag(F.p2);
  assert.equal(page('rueda_molino', s).dir, 2);
  assert.equal(page('rueda_diezmo', s).dir, 6);
  s.addTablet('SPLASHPLATE');
  assert.equal(page('rueda_diezmo', s).dir, 2);
});
