// Bloque 15 — Interludio 7: datos, reglas puras y guiones sin navegador (docs/CAMPANA.md B15; TABLILLAS T13;
// POKEDEX_DISTRIBUCION §7.3; BALANCE).
//   · Lago Viejo (T13): el plano tiene solución, exige romper bloques, cada placa aguanta dos pasadas y el lago se
//     reinicia; eventos de placa por casilla.
//   · Senda del Lazo: pauta, escaleras falsas y rastros.
//   · Continuidad de Nieves y Rosendo (siempre en un solo sitio).
//   · Encuentros = tablas de la distribución; entrenadores 52–56 con el dinero de BALANCE; Gael B5 (Mega Absol).
//   · Guiones con un ctx simulado: desvinculación, lazo, T13 completo (Tabla Helada, Torre, Froslassita), Gael B5 con
//     victoria y con derrota (N5, b15_n5, frases de CAMPANA) y llamada de Alerce.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import {
  LAKE, LAKE_ROWS, PASSES, parseLake, initialState, move, ram, canExtract, solveLake, runSteps, encodeCounts, decodeCounts, iceFrame,
} from '../game/src/content/events/b15_lago_logic.js';
import { lakeEvents, resetLake, lakeCounts } from '../game/src/content/events/b15_lago.js';
import { SENDA, correctStair, wrongTops } from '../game/src/content/maps/b15/layout_senda.js';
import { sendaEvents, printTrails } from '../game/src/content/events/b15_senda.js';
import { NIEVES_WHERE, ROSENDO_WHERE, talleresEvents, extractAncient, ceremonyEvents } from '../game/src/content/events/b15_t13.js';
import { terrazaEvents, GAEL_TEXT } from '../game/src/content/events/b15_gael.js';
import { alerceRingCall } from '../game/src/content/events/b15_boreal.js';
import { ruta11Events } from '../game/src/content/events/b15_ruta11.js';
import { F, V, isNorthUnbound, gaelFinalStarter } from '../game/src/content/events/b15_common.js';
import { B15_CELLS } from '../game/src/content/events/b15_cells.js';
import { cellsOnMap } from '../game/src/content/zygarde/cells.js';
import ENC from '../game/src/content/encounters/b15.js';
import TRAINERS from '../game/src/content/trainers/b15.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import { BOREAL } from '../game/src/content/maps/b15/layout_boreal.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const species = load('species.json');
const items = { ...load('items.json'), ...load('items_axis.json') };

// ───────────────────────────── Lago Viejo (T13) ─────────────────────────────

test('Lago Viejo: el plano tiene solución, no trivial, y exige Embestida; el bloque antiguo se saca desde abajo', () => {
  assert.ok(LAKE.ancient && LAKE.blocks.length >= 2 && LAKE.shore.length === 3, 'plano incompleto');
  const { steps } = solveLake();
  assert.ok(steps, 'el lago no tiene solución');
  assert.ok(steps.length >= 8, `solución demasiado corta (${steps.length})`);
  assert.ok(steps.some((s) => s.act === 'embestir'), 'la solución no rompe ningún bloque');
  const end = runSteps(LAKE, steps);
  assert.ok(end.solved && !end.fell, 'la solución no saca el bloque antiguo');
  assert.equal(steps.at(-1).act, 'sacar');
  assert.ok(end.counts.some((c) => c === PASSES), 'ninguna placa llega a su límite: las grietas no importan');
  // Sin poder romper bloques (todos rocas), no hay solución.
  const rocks = parseLake(LAKE_ROWS.map((r) => r.replace(/B/g, '#')));
  assert.equal(solveLake(rocks).steps, null, 'se resuelve sin romper bloques');
});

test('Lago Viejo: cada placa aguanta dos pasadas (a la tercera, al agua); romper y sacar solo delante', () => {
  const st = initialState();
  const [sx, sy] = [st.x, st.y];
  const i = LAKE.iceIndex(sx, sy - 1);
  assert.ok(i >= 0, 'sobre la orilla central no hay hielo');
  const worn = { ...st, counts: st.counts.map((c, k) => (k === i ? PASSES : c)) };
  const res = move(LAKE, worn, 8);
  assert.ok(res.fell && res.state.fell, 'una placa con dos pasadas no se hunde');
  const fresh = move(LAKE, st, 8);
  assert.ok(fresh.moved && !fresh.fell && fresh.state.counts[i] === 1, 'la primera pasada no cuenta');
  assert.equal(ram(LAKE, st, 8).broke, false, 'se rompe un bloque que no está delante');
  assert.equal(canExtract(LAKE, st, 8), false, 'se saca el bloque antiguo desde la orilla');
  const counts = [0, 1, 2, 2, 1, 0];
  assert.deepEqual(decodeCounts(encodeCounts(counts)).slice(0, counts.length), counts);
  for (const [x, y] of LAKE.ice) {
    const f = iceFrame(LAKE, x, y);
    assert.ok([2, 4, 6, 8].includes(f.dir) && f.pattern >= 0 && f.pattern <= 3, `marco de hielo inválido en (${x},${y})`);
  }
});

test('Lago Viejo: un evento por placa (tres estados de grietas), bloques, rocas y bloque antiguo; reiniciar vacía el lago', () => {
  const evs = lakeEvents();
  for (const [x, y] of LAKE.ice) {
    const ev = evs.find((e) => e.id === `placa_${x}_${y}`);
    assert.ok(ev && ev.pages.length === 3 && ev.pages.every((p) => p.trigger === 'touch' && p.through), `placa (${x},${y})`);
  }
  LAKE.blocks.forEach((_, i) => assert.ok(evs.some((e) => e.id === `bloque_lago_${i}`), `bloque ${i}`));
  assert.ok(evs.some((e) => e.id === 'bloque_antiguo'), 'bloque antiguo');
  const s = GameState.create({ name: 'Prueba' });
  s.setVar(V.lake, '2212');
  s.setVar(V.lakeBlocks, 3);
  resetLake(s);
  assert.ok(lakeCounts(s).every((c) => c === 0) && s.var(V.lakeBlocks) === 0, 'el lago no se reinicia');
});

// ───────────────────────────── Senda del Lazo ─────────────────────────────

test('Senda del Lazo: pauta de cuatro caras, ocho escaleras falsas y rastros de Larvitar distintos de las botas', () => {
  assert.equal(SENDA.pattern.length, 4);
  assert.ok(SENDA.pattern.every((s) => ['O', 'N', 'E'].includes(s)), 'pauta con lados desconocidos');
  assert.ok(new Set(SENDA.pattern).size >= 3, 'la pauta es demasiado regular');
  assert.equal(wrongTops().length, 8);
  for (let k = 0; k < 4; k++) assert.ok(!wrongTops().some((w) => w.face === k && w.x === correctStair(k).x), `cara ${k + 1}`);
  const ids = new Set(sendaEvents().map((e) => e.id));
  assert.equal(ids.size, sendaEvents().length, 'ids repetidos en la Senda');
  const prints = printTrails();
  assert.equal(new Set(prints.map((p) => `${p.x},${p.y}`)).size, prints.length, 'huellas superpuestas');
  assert.ok(prints.every((p) => [2, 4, 6, 8].includes(p.row)));
});

// ───────────────────────────── Continuidad ─────────────────────────────

test('Nieves y Rosendo están siempre en un único sitio a lo largo del T13', () => {
  const steps = [[], [F.rosendo], [F.rosendo, F.nieves], [F.rosendo, F.nieves, F.lakeSeen], [F.rosendo, F.nieves, F.ancientBlock, F.icePlate, F.tower],
    [F.rosendo, F.nieves, F.ancientBlock, F.icePlate, F.tower, F.froslassite]];
  for (const flags of steps) {
    const s = GameState.create({ name: 'Prueba' });
    for (const f of flags) s.setFlag(f);
    const n = Object.entries(NIEVES_WHERE).filter(([, fn]) => fn(s)).map(([k]) => k);
    const r = Object.entries(ROSENDO_WHERE).filter(([, fn]) => fn(s)).map(([k]) => k);
    assert.equal(n.length, 1, `Nieves en ${JSON.stringify(n)} con ${flags.join(',') || '(nada)'}`);
    assert.equal(r.length, 1, `Rosendo en ${JSON.stringify(r)} con ${flags.join(',') || '(nada)'}`);
  }
});

// ───────────────────────────── Encuentros, células, entrenadores ─────────────────────────────

/** Tabla de POKEDEX_DISTRIBUCION §7.3 → [[peso, ESPECIE, min, max]…] por encabezado y fila. */
function docTable(heading, method) {
  const md = fs.readFileSync(new URL('../docs/POKEDEX_DISTRIBUCION.md', import.meta.url), 'utf8').split(/\r?\n/);
  const i = md.findIndex((l) => l.startsWith('#### ') && l.includes(heading));
  assert.ok(i >= 0, `sin sección «${heading}»`);
  const rowLine = md.slice(i + 1, i + 14).find((l) => l.startsWith(`| ${method} |`));
  assert.ok(rowLine, `sin fila «${method}» en «${heading}»`);
  const [, , lv, list] = rowLine.split('|').map((c) => c.trim());
  const [min, max] = lv.split('–').map(Number);
  return list.split(',').map((p) => p.trim().match(/^(.+?) (\d+)$/)).map(([, name, w]) => [Number(w), name.toUpperCase(), min, max]);
}

test('Encuentros: las tablas del bloque son las de POKEDEX_DISTRIBUCION §7.3 (especies, pesos y niveles)', () => {
  const same = (table, doc, what) => assert.deepEqual(table.map((r) => [...r]), doc, what);
  same(ENC.ruta_11.grass, docTable('Ruta 11 y Paso del Norte', 'Hierba'), 'Ruta 11');
  same(ENC.paso_del_norte.grass, docTable('Ruta 11 y Paso del Norte', 'Hierba'), 'Paso del Norte');
  same(ENC.ruta_13.grassDay, docTable('Ruta 13, Villa Boreal', 'Hierba (día)'), 'Ruta 13 de día');
  same(ENC.ruta_13.grassNight, docTable('Ruta 13, Villa Boreal', 'Hierba (noche)'), 'Ruta 13 de noche');
  same(ENC.mar_boreal.water, docTable('Ruta 13, Villa Boreal', 'Nadar'), 'Mar Boreal');
  same(ENC.mar_boreal_fondo.cave, docTable('Ruta 13, Villa Boreal', 'Buceo'), 'fondo del Mar Boreal');
  const [day, night] = [ENC.gruta_escarcha.caveDay, ENC.gruta_escarcha.caveNight];
  const md = fs.readFileSync(new URL('../docs/POKEDEX_DISTRIBUCION.md', import.meta.url), 'utf8');
  assert.match(md, /Gruta Escarcha · etapa H/);
  assert.ok(day.some((r) => r[1] === 'JYNX') && !day.some((r) => r[1] === 'FROSLASS'), 'Jynx de día');
  assert.ok(night.some((r) => r[1] === 'FROSLASS') && !night.some((r) => r[1] === 'JYNX'), 'Froslass de noche');
  for (const t of [day, night]) assert.equal(t.reduce((a, r) => a + r[0], 0), 100);
  for (const table of Object.values(ENC).flatMap((m) => Object.values(m).filter(Array.isArray))) {
    for (const [, sp] of table) assert.ok(species[sp], `especie desconocida ${sp}`);
  }
});

test('Células C089–C094 y C096: en el registro global, en su mapa y casilla; C095 no es de este bloque', () => {
  assert.deepEqual(B15_CELLS.map((c) => c.code), ['C089', 'C090', 'C091', 'C092', 'C093', 'C094', 'C096']);
  for (const c of B15_CELLS) {
    const reg = cellsOnMap(c.map).find((r) => r.key === c.id);
    assert.ok(reg, `${c.code} (${c.id}) no está en content/zygarde/cells.js para ${c.map}`);
    assert.equal(reg.id, c.code, `${c.id}: código ${reg.id} en el registro`);
  }
});

test('Entrenadores: niveles 52–56, dinero de BALANCE y Gael B5 de CAMPANA §6.3 con Mega Absol', () => {
  for (const [id, def] of Object.entries(TRAINERS)) {
    const check = checkTrainerMoney(id, def);
    assert.ok(check.ok, check.problem || `${id}: dinero`);
    const s = GameState.create({ name: 'Prueba' });
    const party = typeof def.party === 'function' ? def.party(s) : def.party;
    for (const p of party) {
      assert.ok(p.level >= 52 && p.level <= 56, `${id}: ${p.species} a nivel ${p.level}`);
      assert.ok(species[p.species], `${id}: especie ${p.species}`);
    }
  }
  const gael = TRAINERS.b15_gael_b5;
  assert.equal(gael.money, 60);
  assert.ok(gael.megaRing && gael.canLose, 'Gael B5: aro y combate que se puede perder');
  for (const [starter, final] of [['LITTEN', 'INCINEROAR'], ['SOBBLE', 'INTELEON'], ['TURTWIG', 'TORTERRA']]) {
    const s = GameState.create({ name: 'Prueba' });
    s.setVar('gael_starter', starter);
    const party = gael.party(s);
    assert.deepEqual(party.map((p) => [p.species, p.level]), [
      ['STARAPTOR', 53], ['LUCARIO', 53], ['WEAVILE', 53], ['GARCHOMP', 54], ['ABSOL', 55], [final, 56],
    ]);
    assert.equal(party[4].item, 'ABSOLITE');
    assert.equal(gaelFinalStarter(s), final);
  }
  for (const it of ['ABSOLITE', 'TYRANITARITE', 'GLALITITE', 'BAXCALIBRITE', 'FROSLASSITE', 'ABOMASITE', 'ICICLEPLATE']) {
    assert.ok(items[it], `objeto desconocido ${it}`);
  }
});

// ───────────────────────────── Guiones con ctx simulado ─────────────────────────────

function mockCtx(state, { outcome = 'win', choices = [], player = { x: 5, y: 5, direction: 8 } } = {}) {
  const said = [];
  const warps = [];
  const given = [];
  const ctx = {
    state, said, warps, given,
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    say: async (text, opts = {}) => { said.push({ text: String(text), ...opts }); },
    choice: async () => (choices.length ? choices.shift() : 0),
    fade: async () => {}, flash: async () => {}, shake: () => {}, se: () => {}, me: () => {}, bgm: () => {}, cry: () => {},
    wait: async () => {}, emote: async () => {}, face: () => {}, move: async () => {}, erase: () => {},
    warp: async (...a) => { warps.push(a); },
    battle: async () => outcome,
    heal: () => {}, requestRefresh: () => {}, effect: () => null, refresh: () => {},
    giveItem: async (id, n = 1) => { given.push(id); state.addItem?.(id, n); },
    zygarde: (k) => state.zygardeAbility(k),
    story: {
      clueStatus: () => state.var('clue_T13', 'none'),
      openClue: async () => { state.setVar('clue_T13', 'open'); },
      advanceClue: async () => {},
      giveTablet: async (id) => { given.push(id); },
    },
    player: { ...player, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} },
    world: { events: [], followers: [] },
    map: { id: 'prueba' },
    scene: null,
  };
  return ctx;
}
const text = (ctx) => ctx.said.map((l) => l.text).join('\n');
const run = (events, id, ctx, page = 0) => events.find((e) => e.id === id).pages?.[page]?.script?.(ctx) ?? events.find((e) => e.id === id).script(ctx);

test('Desvinculación: la escena de la Ruta 11 fija el estado del mundo; el P8 (B16) lo revierte', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag(F.p7);
  s.data.zygarde.form = 'core';
  const ctx = mockCtx(s);
  const ev = ruta11Events().find((e) => e.id.startsWith('llegada_r11_'));
  assert.ok(ev.when(s), 'la escena no está activa al llegar');
  await ev.script(ctx);
  assert.ok(isNorthUnbound(s) && s.flag(F.r11Intro), 'no se fija la desvinculación');
  assert.match(text(ctx), /Me mira como si no me hubiera visto nunca/);
  assert.ok(!ev.when(s), 'la escena se repite');
  s.setFlag(F.p8);
  assert.ok(!isNorthUnbound(s), 'el P8 no revierte la desvinculación');
});

test('Senda del Lazo: coronar una escalera falsa subiendo devuelve al principio; pasando de lado, no', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.data.zygarde.form = 'core';
  const evs = sendaEvents();
  const lazo = evs.find((e) => e.id.startsWith('lazo_'));
  const up = mockCtx(s, { player: { x: lazo.x, y: lazo.y, direction: 8 } });
  await lazo.script(up);
  assert.deepEqual(up.warps[0].slice(0, 3), ['ruta_12_senda_lazo', SENDA.loopStart.x, SENDA.loopStart.y]);
  assert.equal(s.var(V.loops), 1);
  assert.match(text(up), /anudado/);
  const side = mockCtx(s, { player: { x: lazo.x, y: lazo.y, direction: 4 } });
  await lazo.script(side);
  assert.equal(side.warps.length, 0, 'el lazo salta al pasar de lado');
});

test('T13 completo: Rosendo, Nieves, el bloque antiguo (Tabla Helada, Torre de noche) y la ceremonia con la Froslassita', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag(F.p7);
  s.setZygardeAbility('ram', true);
  s.data.zygarde.form = 'core';
  const tall = talleresEvents();
  const c1 = mockCtx(s);
  await run(tall, 'rosendo', c1);
  assert.ok(s.flag(F.rosendo), 'Rosendo no da la pista');
  assert.match(text(c1), /no lo reconocí/);
  const c2 = mockCtx(s, { choices: [0] });
  await run(tall, 'nieves_talleres', c2);
  assert.ok(s.flag(F.nieves), 'Nieves no acepta ir al lago');
  const c3 = mockCtx(s);
  await extractAncient(c3);
  for (const f of [F.ancientBlock, F.icePlate, F.tower]) assert.ok(s.flag(f), `falta ${f}`);
  assert.ok(c3.given.includes('ICICLEPLATE'), 'sin Tabla Helada');
  const last = c3.warps.at(-1);
  assert.deepEqual(last.slice(0, 3), ['villa_boreal', BOREAL.flyPoint.x, BOREAL.flyPoint.y], 'no se vuelve a la plaza');
  const cer = ceremonyEvents().find((e) => e.id === 'ceremonia_torre');
  assert.ok(cer.pages[0].when(s), 'la ceremonia no se activa con la Torre en pie');
  const c4 = mockCtx(s);
  await cer.pages[0].script(c4);
  assert.ok(s.flag(F.froslassite) && c4.given.includes('FROSLASSITE'), 'sin Froslassita');
  assert.match(text(c4), /…Esta sí\. Esta la conozco\./);
  assert.ok(!cer.pages[0].when(s), 'la ceremonia se repite');
});

for (const outcome of ['win', 'lose']) {
  test(`Gael B5 (${outcome === 'win' ? 'victoria' : 'derrota'}): frases de CAMPANA, N5 unido, salida del bloque y llamada de Alerce`, async () => {
    const s = GameState.create({ name: 'Prueba' });
    s.setFlag(F.p7);
    s.data.zygarde.form = 'core';
    s.setVar('gael_starter', 'LITTEN');
    const ev = terrazaEvents().find((e) => e.id === 'gael_escena');
    assert.ok(ev.pages[0].when(s), 'la escena no está activa');
    const ctx = mockCtx(s, { outcome });
    await ev.pages[0].script(ctx);
    const t = text(ctx);
    for (const line of [GAEL_TEXT.challenge, GAEL_TEXT.deaf]) assert.ok(t.includes(line), `falta «${line}»`);
    assert.ok(ctx.said.some((l) => l.text === 'Gracias, Gael.' && l.telepathy), 'Zygarde no da las gracias a Gael');
    assert.ok(t.includes(outcome === 'win' ? GAEL_TEXT.won : GAEL_TEXT.lost), 'frase de Gael según el resultado');
    assert.ok(s.flag(F.n5) && s.flag(F.gaelB5) && s.flag('zyg_core_5'), 'sin N5 o sin la salida del bloque');
    assert.equal(Boolean(s.flag(F.gaelWon)), outcome === 'win');
    assert.ok(!ev.pages[0].when(s), 'la escena se repite');
    const call = mockCtx(s);
    await alerceRingCall(call);
    assert.ok(call.said.some((l) => l.text === 'Ese aro no es de ninguna tienda.' && l.speaker === 'Prof. Alerce'), 'la línea de CAMPANA, literal');
    assert.ok(s.flag(F.alerceRing));
  });
}
