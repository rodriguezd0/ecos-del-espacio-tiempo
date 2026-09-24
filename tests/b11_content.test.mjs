// Bloque 11 — datos y escenas (docs/CAMPANA.md B11, TABLILLAS T09/T10, POKEDEX_DISTRIBUCION §7.3, BALANCE):
// tablas de encuentros (y la zona del tramo alto de la Ruta 10), entrenadores y dinero, Gael B4, células, conexiones
// simétricas y los guiones principales con un ctx simulado (Nilo y la cuadrilla, el Alfa y la Tabla Oscura, la
// deserción, la escena del laboratorio, el campamento con EXP-03 y Gael B4, el puzzle de Íker y la Tabla Mental).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { storyApi } from '../game/src/content/story/api.js';
import { JOURNAL_BLOCKS } from '../game/src/content/story/journal.js';
import * as ENC from '../game/src/content/encounters/b11.js';
import { B11_CELLS } from '../game/src/content/events/b11_cells.js';
import { RUTA10, CAMP } from '../game/src/content/maps/b11/layout.js';
import { SENTINELS, sentinelDir, maybeDesertion, PLANS_NOTE } from '../game/src/content/events/b11_t10.js';
import { niloTalk } from '../game/src/content/events/b11_t10_nilo.js';
import { b11LabEvents, HOME_TEXT, alerceB11Line } from '../game/src/content/events/b11_home.js';
import { campEvents, CAMP_TEXT, CAMP_GONE_PATCH } from '../game/src/content/events/b11_camp.js';
import { ikerHouseEvents, wellEvents, teaHouseWellEvents, DRAWINGS, WELL_ANSWER } from '../game/src/content/events/b11_t09.js';
import fs from 'node:fs';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const species = load('species.json');
const items = { ...load('items.json'), ...load('items_axis.json') };

// ------------------------------------------------------------------ ctx simulado

function fakeCtx(state, { choices = [], outcome = 'win', map = 'ruta_10' } = {}) {
  const said = [];
  const warps = [];
  const battles = [];
  const player = { x: 0, y: 0, direction: 2, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} };
  const ctx = {
    state, said, warps, battles, player,
    db: { species, items },
    map: { id: map },
    world: { events: [], followers: [] },
    scene: { frame: 0, camera: { snapToTarget() {} } },
    say: async (t, o = {}) => { said.push({ text: t, speaker: o.speaker || (o.telepathy ? 'Zygarde' : '') }); },
    choice: async () => (choices.length ? choices.shift() : 0),
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    fade: async () => {}, wait: async () => {}, flash: async () => {}, emote: async () => {}, move: async () => {},
    face() {}, se() {}, me() {}, cry() {}, bgm() {}, erase() {}, heal() {}, shake() {}, requestRefresh() {},
    camera: { pan: async () => {}, reset: async () => {} },
    ui: { toast() {} },
    warp: async (id, x, y, dir) => { warps.push({ id, x, y, dir }); },
    battle: async (req) => { battles.push(req); return outcome; },
    giveItem: async (id, n = 1) => { state.addItem(id, n); },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}
const texts = (ctx) => ctx.said.map((s) => s.text);
const saidExactly = (ctx, t) => texts(ctx).includes(t);

// ------------------------------------------------------------------ datos

test('encuentros: especies de Añil, pesos 100 y niveles de POKEDEX_DISTRIBUCION §7.3', () => {
  const tables = [
    [ENC.RUTA10_BAJO_DAY, 4, 7], [ENC.RUTA10_BAJO_NIGHT, 4, 7], [ENC.RUTA10_ALTO_DAY, 40, 45], [ENC.RUTA10_ALTO_NIGHT, 40, 45],
    [ENC.NEBLINO_DAY, 37, 43], [ENC.NEBLINO_NIGHT, 37, 43],
  ];
  for (const [t, lo, hi] of tables) {
    assert.equal(t.reduce((a, r) => a + r[0], 0), 100);
    for (const [, sp, min, max] of t) {
      assert.ok(species[sp], `especie ${sp}`);
      assert.ok(min >= lo && max <= hi, `${sp} ${min}-${max} fuera de ${lo}-${hi}`);
    }
  }
  const ponyta = ENC.RUTA_9_NEBLINO.grassDay.find((e) => e.species === 'PONYTA');
  assert.equal(ponyta.form, 1, 'Ponyta de Galar (forma 1)');
});

test('Ruta 10: dos tablas en un mapa (tramo bajo y zona del tramo alto)', async () => {
  const { entry } = await buildMapNode('ruta_10');
  const world = new World({ state: GameState.create({ name: 'Prueba' }) });
  world.setCurrent({ ...entry, events: null });
  const low = world.encountersAt(30, 25);
  const high = world.encountersAt(30, 10);
  assert.notEqual(low, high);
  assert.equal(low.choose('grassDay').level <= 7, true);
  assert.ok(high.choose('grassDay').level >= 40);
  assert.equal(high, world.encountersAt(RUTA10.altoZone.x1, RUTA10.altoZone.y1));
});

test('entrenadores: niveles del tramo, dinero de BALANCE y Gael B4 con el equipo de CAMPANA §6.3', () => {
  const ids = Object.keys(TRAINERS).filter((id) => id.startsWith('b11_'));
  assert.ok(ids.length >= 11);
  const money = {
    Joven: 16, Chica: 16, Bichera: 16, Montañero: 32, Excursionista: 32, Ornitóloga: 32, Veterano: 48, Veterana: 48,
    Médium: 48, 'Técnico del Consorcio': 40, 'Técnica del Consorcio': 40, Rival: 60,
  };
  const s = GameState.create({ name: 'Prueba' });
  s.setVar('gael_starter', 'SOBBLE');
  for (const id of ids) {
    const t = getTrainer(id, s);
    for (const p of t.party) assert.ok(species[p.species], `${id}: ${p.species}`);
    const lv = t.party.map((p) => p.level);
    if (['b11_joven_tomas', 'b11_chica_nuria'].includes(id)) assert.ok(Math.max(...lv) <= 7, `${id} (etapa A)`);
    else assert.ok(Math.min(...lv) >= 38 && Math.max(...lv) <= 43, `${id} fuera de 38–43`);
    assert.ok(money[t.class] !== undefined, `${id}: clase «${t.class}» sin dinero de referencia`);
    assert.equal(t.money, money[t.class], `${id}: dinero`);
    const check = checkTrainerMoney(id, TRAINERS[id]);
    assert.ok(check.ok, check.problem || id);
  }
  const gael = getTrainer('b11_gael_b4', s);
  assert.deepEqual(gael.party.map((p) => [p.species, p.level]), [['STARAPTOR', 41], ['LUCARIO', 41], ['GABITE', 41], ['ABSOL', 42], ['INTELEON', 43]]);
  assert.equal(gael.canLose, true);
});

test('células: coinciden con el registro global y tienen evento en su casilla', async () => {
  for (const c of B11_CELLS) {
    const reg = CELLS.find((r) => r.key === c.id);
    assert.ok(reg, c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    const { def } = await buildMapNode(c.map);
    assert.ok(def.events.some((e) => e.type === 'zygardeCell' && e.cell === c.id && e.x === c.x && e.y === c.y), `${c.code} en ${c.map}`);
  }
  assert.deepEqual(B11_CELLS.map((c) => c.code).sort(), ['C007', 'C047', 'C048', 'C049', 'C054']);
});

test('conexiones: Ruta 1 ↔ Ruta 10 ↔ Neblino y campamento, simétricas; salida del bloque en el Diario', async () => {
  const r10 = (await buildMapNode('ruta_10')).def;
  const r1 = (await buildMapNode('ruta_1')).def;
  const neb = (await buildMapNode('ruta_9_neblino')).def;
  const camp = (await buildMapNode('campamento_monte')).def;
  const conn = (d, to) => d.connections.find((c) => c.to === to);
  assert.equal(conn(r1, 'ruta_10').offset + conn(r10, 'ruta_1').offset, 0);
  assert.equal(conn(r10, 'ruta_9_neblino').offset + conn(neb, 'ruta_10').offset, 0);
  assert.equal(conn(r10, 'campamento_monte').offset + conn(camp, 'ruta_10').offset, 0);
  assert.ok(JOURNAL_BLOCKS.some((b) => b.block === 'B11' && b.flag === 'b11_gael_b4'));
});

test('centinelas del T10: reloj determinista y ciclo de direcciones', () => {
  for (const s of SENTINELS) {
    const seen = new Set();
    for (let f = 0; f < s.period * s.dirs.length; f += 10) seen.add(sentinelDir(s, f));
    assert.deepEqual([...seen].sort(), [...s.dirs].sort(), s.id);
  }
});

// ------------------------------------------------------------------ escenas

test('T10: Nilo abre la pista de noche y cuenta lo de la cuadrilla (segunda pista)', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('p5_restored');
  const ctx = fakeCtx(s, { map: 'ruta_9_neblino' });
  await niloTalk(ctx);
  assert.ok(s.flag('b11_t10_nilo_visto'));
  assert.equal(ctx.story.clueStatus('T10'), 'active');
  await niloTalk(ctx);
  assert.ok(s.flag('b11_t10_nilo_cuenta'));
  assert.equal(s.clues.find((c) => c.id === 'T10').step, 2);
});

test('T10: cuadrilla, Alfa (captura opcional), Tabla Oscura y deserción de Nilo con los planos de Talasa', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('p5_restored');
  const { def } = await buildMapNode('ruta_10');
  const find = (id) => def.events.find((e) => e.id === id);
  const script = (id) => (find(id).pages ? find(id).pages[0].script : find(id).script);
  const ctx = fakeCtx(s);
  // Descubrimiento directo: sin haber visto a Nilo, la cuadrilla abre el arco.
  await script('cuadrilla_0')(ctx);
  assert.ok(s.flag('b11_t10_cuadrilla'));
  assert.equal(ctx.story.clueStatus('T10'), 'active');
  assert.ok(!s.flag('b11_nilo_desertor'), 'sin Tablilla aún no hay deserción');
  // El Alfa: huir no cambia nada; ganar deja la Tablilla.
  const run = fakeCtx(s, { outcome: 'run' });
  await script('honchkrow_alfa')(run);
  assert.ok(!s.flag('b11_t10_alfa'));
  assert.equal(run.battles[0].wild.species, 'HONCHKROW');
  assert.equal(run.battles[0].wild.alpha, true);
  assert.equal(run.battles[0].wild.level, 42);
  await script('honchkrow_alfa')(fakeCtx(s, { outcome: 'win' }));
  assert.ok(s.flag('b11_t10_alfa'));
  const plate = find('tabla_oscura').pages[0];
  assert.ok(plate.when(s));
  const end = fakeCtx(s);
  await plate.script(end);
  assert.ok(s.data.tablets.includes('DREADPLATE'));
  assert.equal(ctx.story.clueStatus('T10'), 'solved');
  assert.ok(s.flag('b11_nilo_desertor') && s.flag('b11_planos_talasa'));
  assert.ok(s.hasClue(PLANS_NOTE.id), 'nota de los planos en la Libreta');
  assert.ok(texts(end).some((t) => /planos de la Estación Talasa/.test(t)));
  assert.ok(texts(end).some((t) => /^Soy Nilo/.test(t)), 'Nilo se presenta si no se le encontró en el Neblino');
  assert.ok(texts(end).some((t) => /Z-4/.test(t)), 'los planos apuntan a la Muestra Z-4 (N4, CAMPANA §2.4)');
  assert.equal(await maybeDesertion(fakeCtx(s)), false, 'la deserción no se repite');
  // El Alfa reaparece al descansar (hasta capturarlo).
  const alfa = find('honchkrow_alfa').pages[0];
  assert.equal(alfa.when(s), false);
  s.setVar('rest_count', Number(s.var('rest_count', 0)) + 1);
  assert.equal(alfa.when(s), true);
});

test('Laboratorio: Gael se enfrenta a Alerce con las líneas fijadas y se va', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const [gael, scene] = b11LabEvents();
  assert.equal(scene.when(s), false, 'antes del P5 no hay escena');
  s.setFlag('p5_restored');
  assert.ok(scene.when(s) && gael.pages[0].when(s));
  const ctx = fakeCtx(s, { map: 'laboratorio_alerce' });
  await scene.script(ctx);
  assert.ok(saidExactly(ctx, 'Usted sabía quiénes eran desde el principio.'));
  assert.ok(saidExactly(ctx, 'Sabía de qué eran capaces.'));
  assert.equal(ctx.said.find((l) => l.text === 'Sabía de qué eran capaces.').speaker, 'Prof. Alerce');
  assert.ok(s.flag('b11_gael_alerce'));
  assert.equal(scene.when(s), false);
  assert.equal(HOME_TEXT.mom.egg, 'Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para ti.');
  // Al volver a hablarle: línea propia hasta el P6 (antes y después de Gael B4); después, la de otro bloque.
  assert.equal(alerceB11Line(s), HOME_TEXT.lab.alerceLater);
  s.setFlag('b11_gael_b4');
  assert.equal(alerceB11Line(s), HOME_TEXT.lab.alerceMonte);
  s.setFlag('p6_restored');
  assert.equal(alerceB11Line(s), null);
});

test('Campamento: primera visita (EXP-03), marcha de Genesis tras el laboratorio y Gael B4 (continúa aunque se pierda)', async () => {
  const events = campEvents();
  const arrival = events.find((e) => e.id.startsWith('llegada_campamento'));
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('p5_restored');
  const first = fakeCtx(s, { map: 'campamento_monte' });
  await arrival.script(first);
  assert.ok(s.flag('b11_campamento_visto') && !s.flag('b11_exp03'));
  assert.ok(texts(first).includes(CAMP_TEXT.introTech));
  assert.equal(arrival.when(s), false, 'la primera visita no se repite');
  s.setFlag('b11_gael_alerce');
  assert.equal(arrival.when(s), true);
  const second = fakeCtx(s, { map: 'campamento_monte', outcome: 'lose' });
  await arrival.script(second);
  assert.ok(s.flag('b11_exp03'), 'Genesis se lleva el cristal');
  assert.ok(texts(second).includes(CAMP_TEXT.departure.chief));
  assert.equal(second.battles[0].trainer, 'b11_gael_b4');
  assert.ok(second.battles[0].canLose);
  assert.ok(saidExactly(second, 'Cuando vuelvas, cuéntame qué hay.') && saidExactly(second, '…No. Da igual.'));
  assert.ok(texts(second).includes(CAMP_TEXT.gael.lost), 'frase de derrota del jugador');
  assert.ok(s.flag('b11_gael_b4'), 'salida del bloque');
  assert.ok(CAMP_GONE_PATCH.length > 20 && CAMP_GONE_PATCH.every(([x, y]) => x >= 0 && y >= 0 && x < CAMP.width && y < CAMP.height));
});

test('T09: tres dibujos, la casa de té, el Musharna, la Tabla Mental y la Chimechita', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('p5_restored');
  const house = ikerHouseEvents();
  const iker = house.find((e) => e.id === 'iker');
  // Un error no penaliza; luego las tres respuestas correctas y el pozo.
  const wrong = fakeCtx(s, { choices: [4] });
  await iker.script(wrong);
  assert.ok(s.flag('b11_t09_iker'));
  assert.equal(s.clues.find((c) => c.id === 'T09').step, 2);
  assert.ok(!s.flag('b11_t09_dibujos'));
  const right = fakeCtx(s, { choices: [...DRAWINGS.map((d) => d.answer), WELL_ANSWER] });
  await iker.script(right);
  assert.ok(s.flag('b11_t09_dibujos') && s.flag('b11_t09_pozo_deducido'));
  // La casa de té (B10) muestra al Musharna y lleva al pozo.
  const [musharna] = teaHouseWellEvents({ x: 12, y: 9 });
  assert.ok(musharna.pages[0].when(s));
  const tea = fakeCtx(s, { map: 'mnemos_casa_te' });
  await musharna.pages[0].script(tea);
  assert.equal(tea.warps[0].id, 'mnemos_pozo_custodios');
  const plate = wellEvents().find((e) => e.id === 'tabla_mental');
  await plate.pages[0].script(fakeCtx(s, { map: 'mnemos_pozo_custodios' }));
  assert.ok(s.data.tablets.includes('MINDPLATE'));
  const exit = wellEvents().find((e) => e.id === 'salida_pozo');
  const back = fakeCtx(s, { map: 'mnemos_pozo_custodios' });
  await exit.script(back);
  assert.equal(back.warps[0].id, 'mnemos_casa_te', 'vuelve a la casa de té');
  const cured = house.find((e) => e.id === 'iker_curado');
  assert.ok(cured.when(s));
  await cured.script(fakeCtx(s, { map: 'mnemos_casa_iker' }));
  assert.ok(s.flag('b11_t09_iker_curado'));
  assert.equal(s.itemCount('CHIMECHITE'), 1);
});
