// Bloque 12 — datos y escenas (docs/CAMPANA.md B12, §2.3–2.4, §3.0; POKEDEX_DISTRIBUCION §7.3): encuentros, mapas del
// Mundo Distorsión (tileset, fondo, niebla, música), gemelos coherentes, células, objetos (Gengarita, Lucarita) y los
// guiones con un ctx simulado: el aljibe, el núcleo (orden de las Anclas, restauración, N3 y Nadar), la Respuesta
// de Zygarde, la sombra de Giratina y Casilda.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { storyApi } from '../game/src/content/story/api.js';
import { CELLS, cellByKey } from '../game/src/content/zygarde/cells.js';
import { mapInfo } from '../game/src/content/services/zones.js';
import * as ENC from '../game/src/content/encounters/b12.js';
import { B12_CELLS } from '../game/src/content/events/b12_cells.js';
import { b12Aljibe } from '../game/src/content/events/b12_monte.js';
import { nucleoEvents } from '../game/src/content/events/b12_nucleo.js';
import { vestibuloEvents } from '../game/src/content/events/b12_distorsion.js';
import { b12ZaguanEvents } from '../game/src/content/events/b12_mundo.js';
import { F, V } from '../game/src/content/events/b12_common.js';
import { NUCLEO, SUMIDERO, MONTE } from '../game/src/content/maps/b12/layout.js';
import { facetRoom, facetMapId, FACET_ROOM_IDS } from '../game/src/content/maps/b12/rooms.js';
import { rotatePoint } from '../game/src/world/impossible/logic.js';
import { CELLS as ALL } from '../game/src/content/zygarde/cells.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const species = load('species.json');
const items = { ...load('items.json'), ...load('items_axis.json') };

function fakeCtx(state, { choices = [], map = 'pilar_invertido_nucleo', world = null } = {}) {
  const said = [];
  const warps = [];
  const player = { x: 0, y: 0, direction: 8, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {}, turnToward() {} };
  const ctx = {
    state, said, warps, player,
    db: { species, items },
    map: { id: map, valid: () => true, passable: () => true },
    world: world || { events: [], followers: [] },
    say: async (t, o = {}) => { said.push({ text: t, speaker: o.speaker || (o.telepathy ? 'Zygarde' : '') }); },
    choice: async () => (choices.length ? choices.shift() : 0),
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    fade: async () => {}, wait: async () => {}, flash: async () => {}, emote: async () => {}, move: async () => {},
    face() {}, se() {}, me() {}, bgm() {}, erase() {}, shake: async () => {}, requestRefresh() {}, directionTo: () => 2,
    effect: () => ({ remove() {} }),
    ui: { toast() {} },
    warp: async (id, x, y, dir) => { warps.push({ id, x, y, dir }); },
    giveItem: async (id, n = 1) => { state.addItem(id, n); },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}
const texts = (ctx) => ctx.said.map((s) => s.text);

/** Partida al entrar en el P6: P1–P5, Fragmentos 1–5, Trepar, N1+N2 y `cells` células. */
function entryState(cells = 50) {
  const st = GameState.create({ name: 'Prueba' });
  for (const f of ['b01_left_town', 'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'b11_exp03', 'b11_gael_b4']) st.setFlag(f);
  for (let i = 1; i <= 5; i++) st.addFragment(`F0${i}`);
  for (const k of ['run', 'ram', 'terrain', 'climb']) st.setZygardeAbility(k, true);
  st.addCore('N1');
  st.addCore('N2');
  st.setZygardeForm('10');
  for (const c of ALL.slice(0, cells)) st.addCell(c.key);
  return st;
}

test('encuentros: POKEDEX §7.3 (Monte: cueva 40–45; Pilar Invertido: cueva 42–47), especies de Añil y pesos 100', () => {
  for (const [table, lo, hi] of [[ENC.MONTE_CUEVA.cave, 40, 45], [ENC.PILAR_INVERTIDO.cave, 42, 47]]) {
    assert.equal(table.reduce((a, r) => a + r[0], 0), 100);
    for (const [, sp, min, max] of table) {
      assert.ok(species[sp], sp);
      assert.ok(min >= lo && max <= hi, `${sp} ${min}-${max}`);
    }
  }
  assert.deepEqual(ENC.PILAR_INVERTIDO.cave.map((r) => r[1]), ['HAUNTER', 'DUSCLOPS', 'SABLEYE', 'BEHEEYEM', 'DRIFBLIM', 'GOLBAT', 'MISMAGIUS', 'NOIVERN']);
  assert.ok(ENC.MONTE_HIERBA.grassDay && ENC.MONTE_HIERBA.grassNight, 'hierba del Monte = tabla de la Ruta 10 alta');
});

test('Mundo Distorsión: tileset 14, fondo propio, niebla `portal`, música y fondo de combate MundoDistorsion', async () => {
  const ids = ['pilar_invertido', 'pilar_invertido_mirada', 'pilar_invertido_sumidero', 'pilar_invertido_nucleo',
    ...FACET_ROOM_IDS.flatMap((r) => [facetMapId(r, 0), facetMapId(r, 1)])];
  for (const id of ids) {
    const { def } = await buildMapNode(id);
    assert.equal(def.tileset, 14, id);
    assert.equal(def.panorama?.shader, 'distorsion', id);
    assert.equal(def.fog?.name, 'portal', id);
    assert.ok(def.impossible, `${id}: espacio imposible`);
    assert.equal(def.battleback, 'MundoDistorsion', id);
    assert.equal(def.bgm, 'distortion', id);
    assert.equal(mapInfo(id).name, 'Pilar Invertido', id);
    assert.equal(def.mount, false, `${id}: sin montura`);
  }
  // Encuentros solo fuera de las salas de puzzle (POKEDEX: «solo fuera de las salas de puzzle»).
  for (const id of ids) {
    const { def } = await buildMapNode(id);
    assert.equal(Boolean(def.encounters), id === 'pilar_invertido', `${id}: encuentros`);
  }
});

test('La Cara Vuelta: los gemelos miden lo mismo y cada arista cae en la casilla girada de la otra', async () => {
  for (const roomId of FACET_ROOM_IDS) {
    const a = await buildMapNode(facetMapId(roomId, 0));
    const b = await buildMapNode(facetMapId(roomId, 1));
    assert.equal(a.def.width, b.def.height);
    assert.equal(a.def.height, b.def.width);
    const ea = a.def.events.filter((e) => e.type === 'arista');
    const eb = b.def.events.filter((e) => e.type === 'arista');
    assert.equal(ea.length, facetRoom(roomId).aristas.length);
    for (const e of ea) {
      const [x, y] = rotatePoint(e.x, e.y, a.def.width, a.def.height, 1);
      assert.ok(eb.some((o) => o.x === x && o.y === y && o.twin === a.def.id && o.turn === -1), `${roomId}: arista (${e.x},${e.y})`);
      assert.equal(e.twin, b.def.id);
      assert.equal(e.turn, 1);
    }
  }
});

test('células C050–C053 y C076: en sus mapas y casillas del registro; C051, C052 y C053 obligatorias', () => {
  for (const c of B12_CELLS) {
    const reg = cellByKey(c.id);
    assert.ok(reg, c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map, `${c.code}: mapa`);
  }
  assert.deepEqual(B12_CELLS.map((c) => c.code), ['C050', 'C051', 'C052', 'C053', 'C076']);
  assert.ok(cellByKey('cell_monte_2').required && cellByKey('cell_invertido_1').required && cellByKey('cell_invertido_2').required);
  assert.equal(CELLS.find((c) => c.id === 'C076').stage, 'F', 'C076 es de Nadar');
});

test('objetos: Gengarita en el rincón del Sumidero; la Lucarita la da Casilda; ids de objeto existentes', async () => {
  const { def } = await buildMapNode('pilar_invertido_sumidero');
  const gengar = def.events.find((e) => e.item === 'GENGARITEX');
  assert.ok(gengar && gengar.x === SUMIDERO.gengarita.x && gengar.y === SUMIDERO.gengarita.y);
  assert.ok(items.GENGARITEX && items.LUCARIONITE);
  for (const id of ['pilar_invertido', 'pilar_invertido_mirada', 'pilar_invertido_sumidero', 'monte_gruta', 'montana_portal',
    ...FACET_ROOM_IDS.flatMap((r) => [facetMapId(r, 0), facetMapId(r, 1)])]) {
    const m = await buildMapNode(id);
    for (const e of m.def.events || []) if (e.type === 'item') assert.ok(items[e.item], `${id}: objeto ${e.item}`);
  }
});

test('el aljibe: nada en el prólogo; en la partida real responde a Zygarde y baja al Mundo Distorsión', async () => {
  const proto = fakeCtx(GameState.create({ name: 'P' }), { map: 'montana_portal' });
  assert.equal(await b12Aljibe(proto), false, 'en el prólogo el mapa del B01 dice su texto');
  const st = entryState();
  const ctx = fakeCtx(st, { map: 'montana_portal', choices: [0] });
  assert.equal(await b12Aljibe(ctx), true);
  // Zygarde habla muy poco (autor, 25-09-2026): una sola línea, imprescindible.
  assert.deepEqual(ctx.said.filter((l) => l.speaker === 'Zygarde').map((l) => l.text), ['Al otro lado está la parte de mí que se quedó sujetando la puerta.']);
  assert.ok(st.flag(F.aljibeResuena));
  assert.equal(ctx.warps.at(-1).id, 'pilar_invertido');
  const again = fakeCtx(st, { map: 'montana_portal', choices: [1] });
  await b12Aljibe(again);
  assert.ok(!texts(again).includes('Al otro lado está la parte de mí que se quedó sujetando la puerta.'), 'la escena de resonancia solo una vez');
  assert.equal(again.warps.length, 0, 'con «No» no se baja');
});

/** Ejecuta el guion del Ancla del núcleo `id`. */
async function touchNucleo(ctx, id) {
  const ev = nucleoEvents().find((e) => e.id === id);
  await ev.pages[0].script(ctx);
}

test('núcleo: el orden equivocado reabre el sello; veta → ojo → gota restaura el P6, libera N3 y da Nadar (50 %)', async () => {
  const st = entryState(50);
  const ctx = fakeCtx(st);
  await touchNucleo(ctx, 'ancla_ojo');
  assert.equal(st.var(V.nucleoOrden, 0), 0);
  assert.ok(texts(ctx).includes('El sello se abre un poco más y los postes se apagan. Hay que empezar desde el principio.'));
  assert.ok(!ctx.said.some((l) => l.speaker === 'Zygarde'), 'el aviso es narración, no Zygarde');
  await touchNucleo(ctx, 'ancla_veta');
  assert.equal(st.var(V.nucleoOrden, 0), 1);
  await touchNucleo(ctx, 'ancla_gota');
  assert.equal(st.var(V.nucleoOrden, 0), 0, 'saltarse el ojo también reabre');
  await touchNucleo(ctx, 'ancla_veta');
  await touchNucleo(ctx, 'ancla_ojo');
  await touchNucleo(ctx, 'ancla_gota');
  assert.ok(st.flag('p6_restored'), 'P6 restaurado');
  assert.ok(st.flag(F.selloCerrado));
  assert.ok((st.data.fragments || []).includes('F06'), 'Fragmento Azur 6');
  assert.ok(st.flag('verse_6'), 'verso VI');
  assert.ok(st.hasCore('N3'), 'N3 unido');
  assert.ok(st.flag('zyg_core_3'));
  assert.ok(st.zygardeAbility('swim'), 'Nadar');
  assert.equal(st.zygardeForm, '50');
  assert.ok(st.flag('zyg_50'));
  assert.ok(!texts(ctx).includes('…Vuelve.'), 'Zygarde habla muy poco');
});

test('núcleo: con menos de 50 células, N3 se une pero Zygarde dice cuántas partes faltan', async () => {
  const st = entryState(46);
  const ctx = fakeCtx(st);
  for (const id of ['ancla_veta', 'ancla_ojo', 'ancla_gota']) await touchNucleo(ctx, id);
  assert.ok(st.flag('p6_restored') && st.hasCore('N3'));
  assert.ok(!st.zygardeAbility('swim'));
  assert.ok(texts(ctx).includes('Me faltan cuatro partes.'));
});

test('núcleo: sin el Fragmento 5 el sello no se cierra (cadena de resonancia) y se puede reintentar', async () => {
  const st = entryState(50);
  st.data.fragments = st.data.fragments.filter((f) => f !== 'F05');
  const ctx = fakeCtx(st);
  for (const id of ['ancla_veta', 'ancla_ojo', 'ancla_gota']) await touchNucleo(ctx, id);
  assert.ok(!st.flag('p6_restored'));
  assert.ok(!st.flag(F.selloCerrado));
  assert.equal(st.var(V.nucleoOrden, 0), 0);
  assert.equal(NUCLEO.anchors.map((a) => a.symbol).join(','), 'veta,ojo,gota');
});

test('Respuesta de Zygarde en la explanada interior tras restaurar: «Aquí lo empujé. Tres noches.»', async () => {
  const st = entryState(50);
  st.setFlag('p6_restored');
  const ev = vestibuloEvents().find((e) => e.id === 'b12_respuesta');
  assert.ok(ev.when(st));
  const ctx = fakeCtx(st, { map: 'pilar_invertido' });
  await ev.script(ctx);
  // Zygarde habla muy poco (autor, 25-09-2026): solo la línea canónica.
  assert.deepEqual(texts(ctx), ['Aquí lo empujé. Tres noches.']);
  assert.ok(!ev.when(st), 'una sola vez');
});

test('sombra de Giratina: la mitad este de la isla alta la dispara (C053, obligatoria, está dentro); una vez; no en el vacío', async () => {
  const { sumideroEvents } = await import('../game/src/content/events/b12_sumidero.js');
  const band = sumideroEvents().filter((e) => String(e.id).startsWith('b12_sombra_'));
  const at = new Set(band.map((e) => `${e.x},${e.y}`));
  const c = SUMIDERO.cell;
  assert.ok(!at.has(`${c.x},${c.y}`), 'no se solapa con la célula');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) assert.ok(at.has(`${c.x + dx},${c.y + dy}`), `vecina (${c.x + dx},${c.y + dy}) de C053`);
  assert.ok(SUMIDERO.buttons.every((b) => !at.has(`${b.x},${b.y}`)), 'ni con los pulsadores');
  const st = entryState(52);
  const ev = band[0];
  assert.ok(ev.when(st));
  const onVoid = fakeCtx(st, { map: 'pilar_invertido_sumidero' });
  onVoid.map = { id: 'pilar_invertido_sumidero', valid: () => true, data: () => 0 };
  await ev.script(onVoid);
  assert.ok(!st.flag(F.sombraGiratina), 'en una casilla de vacío primero se cae');
  const onStone = fakeCtx(st, { map: 'pilar_invertido_sumidero' });
  onStone.map = { id: 'pilar_invertido_sumidero', valid: () => true, data: () => 1 };
  await ev.script(onStone);
  assert.ok(st.flag(F.sombraGiratina));
  assert.deepEqual(texts(onStone), ['No mires. No nos busca. Aún.']);
  assert.ok(!ev.when(st), 'una sola vez');
});

test('Casilda entrega la Lucarita en Villa Zaguán tras el P6 (una vez)', async () => {
  const st = entryState(50);
  st.setFlag('b02_salida');
  const [casilda, auto] = b12ZaguanEvents();
  assert.ok(!auto.when(st), 'antes del P6 no aparece');
  st.setFlag('p6_restored');
  assert.ok(auto.when(st));
  const world = { events: [{ id: 'b12_casilda', x: 19, y: 16, turnToward() {} }], followers: [] };
  const ctx = fakeCtx(st, { map: 'villa_zaguan', world });
  await auto.script(ctx);
  assert.equal(st.itemCount('LUCARIONITE'), 1);
  assert.ok(texts(ctx).includes('Toma. Mi marido la encontró hace años. Ahora sé para quién era.'));
  assert.ok(!auto.when(st) && !casilda.pages[0].when(st));
});

test('Monte: el mapa del prólogo conserva su llegada, su senda al campamento y el aljibe; la poza es mayor', async () => {
  const { def } = await buildMapNode('montana_portal');
  assert.deepEqual(def.start, { x: 17, y: 48, dir: 8 });
  assert.equal(def.width, MONTE.width);
  assert.ok([16, 17, 18].every((x) => def.warps.some((w) => w.x === x && w.y === def.height - 1 && w.to === 'campamento_monte')));
  assert.ok(def.warps.some((w) => w.to === 'monte_gruta'));
  assert.ok(!def.encounters, 'sin tabla de mapa (el prólogo no tiene encuentros)');
  assert.equal(def.encounterZones.length, 1);
});

test('tras el P6 las sombras dejan de bajar al Neblino (la Médium lo cuenta)', async () => {
  const { neblinoEvents } = await import('../game/src/content/events/b11_neblino.js');
  const { expandEventDef } = await import('../game/src/world/eventTypes.js');
  const medium = expandEventDef(neblinoEvents().find((e) => e.id === 'medium_celia'));
  const after = medium.pages[1].script;
  const st = entryState(50);
  const before = fakeCtx(st, { map: 'ruta_9_neblino' });
  await after(before);
  assert.match(texts(before)[0], /bajan sombras del Monte/);
  st.setFlag('p6_restored');
  const later = fakeCtx(st, { map: 'ruta_9_neblino' });
  await after(later);
  assert.match(texts(later)[0], /Las sombras ya no bajan del Monte/);
});
