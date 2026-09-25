// Contenido del Bloque 14 — Pilar de los Ecos (docs/CAMPANA.md B14; POKEDEX_DISTRIBUCION §7): entrenadores 49–52,
// tablas de encuentros (solo especies antiguas en los ecos, ninguna Paradoja), combate del eco (captura desactivada
// con su motivo, sin huida), Bramaluna real (nivel 58, reaparece al descansar), caracolas (punto de regreso),
// patrullas deterministas, escenas de Caleta y células C077–C084.
import test from 'node:test';
import assert from 'node:assert/strict';
import TRAINERS from '../game/src/content/trainers/b14.js';
import {
  FONDO_BUCEO, ARRECIFE_BUCEO, CAPA_ECO, BRAMALUNA_ECO, BRAMALUNA_REAL, ANTEA_ECO, ANTEA_PRIMIGENIA,
} from '../game/src/content/encounters/b14.js';
import { echoBattleRequest, realPresent, CATCH_REASON, releaseFausto } from '../game/src/content/events/b14_fosa.js';
import { caracolaKey, parseCaracolaKey, defaultReturn } from '../game/src/content/events/b14_caracolas.js';
import { patrolAt, patrolPeriod, compilePatrol } from '../game/src/content/events/b14_bramaluna.js';
import { needIntro, needFinal, b14CaletaEvents } from '../game/src/content/events/b14_caleta.js';
import { PATROLS, ROOMS, ANTEA_MAPS, FONDO } from '../game/src/content/maps/b14/layout.js';
import { LINKS } from '../game/src/content/maps/b13/mar_layout.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';

/** Estado mínimo con la interfaz que usan las condiciones (flag, var, zygardeAbility). */
function fakeState({ flags = {}, vars = {}, abilities = [] } = {}) {
  return {
    flag: (k) => Boolean(flags[k]),
    var: (k, d = 0) => (k in vars ? vars[k] : d),
    zygardeAbility: (k) => abilities.includes(k),
  };
}

const PARADOX = [
  'GREATTUSK', 'SCREAMTAIL', 'BRUTEBONNET', 'FLUTTERMANE', 'SLITHERWING', 'SANDYSHOCKS', 'ROARINGMOON', 'WALKINGWAKE',
  'GOUGINGFIRE', 'RAGINGBOLT', 'IRONTREADS', 'IRONBUNDLE', 'IRONHANDS', 'IRONJUGULIS', 'IRONMOTH', 'IRONTHORNS',
  'IRONVALIANT', 'IRONLEAVES', 'IRONBOULDER', 'IRONCROWN',
];

test('entrenadores del bloque: niveles 49–52, dinero por clase y la jefa de dragado sin pérdida', () => {
  const ids = Object.keys(TRAINERS);
  assert.equal(ids.length, 7);
  for (const [id, t] of Object.entries(TRAINERS)) {
    assert.ok(id.startsWith('b14_'), id);
    assert.ok(t.party.length >= 2 && t.party.length <= 3, `${id}: equipo de ${t.party.length}`);
    for (const p of t.party) assert.ok(p.level >= 49 && p.level <= 52, `${id}: ${p.species} nv ${p.level}`);
    assert.ok(t.loseText && t.winText, `${id}: textos`);
    assert.ok([24, 40].includes(t.money), `${id}: dinero ${t.money}`);
  }
  assert.equal(TRAINERS.b14_jefa_adela.canLose, true);
});

test('encuentros: tablas de POKEDEX_DISTRIBUCION §7.3 y ecos sin Paradojas', () => {
  const sum = (t) => t.reduce((a, r) => a + r[0], 0);
  for (const [name, t, lo, hi] of [['fondo', FONDO_BUCEO, 48, 54], ['arrecife', ARRECIFE_BUCEO, 50, 55], ['eco', CAPA_ECO, 50, 55]]) {
    assert.equal(sum(t), 100, `${name}: pesos`);
    for (const [, sp, a, b] of t) assert.ok(a === lo && b === hi, `${name}: ${sp} ${a}–${b}`);
  }
  assert.deepEqual(CAPA_ECO.map((r) => r[1]), ['CRANIDOS', 'SHIELDON', 'CORSOLA', 'DREEPY', 'DRAKLOAK']);
  assert.equal(CAPA_ECO[2][4], 1, 'Corsola de Galar (forma 1)');
  for (const t of [FONDO_BUCEO, ARRECIFE_BUCEO, CAPA_ECO]) for (const [, sp] of t) assert.ok(!PARADOX.includes(sp), `Paradoja en tabla: ${sp}`);
  assert.equal(ANTEA_ECO.cave, CAPA_ECO);
  assert.equal(ANTEA_PRIMIGENIA.grass, CAPA_ECO, 'era primigenia: solo en la hierba alta');
});

test('Bramaluna del eco: nivel 56 Alfa, Energía Potenciadora, Paleosíntesis, sin huida y sin captura', () => {
  assert.equal(BRAMALUNA_ECO.species, 'ROARINGMOON');
  assert.equal(BRAMALUNA_ECO.level, 56);
  assert.equal(BRAMALUNA_ECO.alpha, true);
  assert.equal(BRAMALUNA_ECO.ability, 'PROTOSYNTHESIS');
  assert.equal(BRAMALUNA_ECO.heldItem, 'BOOSTERENERGY');
  assert.deepEqual([...BRAMALUNA_ECO.moves], ['DRAGONDANCE', 'CRUNCH', 'DRAGONCLAW', 'ACROBATICS']);
  const req = echoBattleRequest();
  assert.equal(req.type, 'wild');
  assert.equal(req.rules.canRun, false);
  const verdict = req.rules.catchCondition();
  assert.equal(verdict.allowed, false);
  assert.equal(verdict.reason, CATCH_REASON);
  assert.match(CATCH_REASON, /Es un eco: no hay nada que atrapar/);
  // La petición es una copia: tocarla no cambia la definición congelada.
  req.wild.moves.push('ROAR');
  assert.equal(BRAMALUNA_ECO.moves.length, 4);
});

test('Bramaluna real: nivel 58 tras el P7; si se vence, vuelve al descansar; capturada, no vuelve', () => {
  assert.equal(BRAMALUNA_REAL.level, 58);
  assert.equal(BRAMALUNA_REAL.alpha, true);
  assert.equal(realPresent(fakeState()), false, 'antes del P7 no hay Bramaluna real');
  assert.equal(realPresent(fakeState({ flags: { p7_restored: true } })), true);
  const beaten = { p7_restored: true, b14_bramaluna_real_vencida: true };
  assert.equal(realPresent(fakeState({ flags: beaten, vars: { rest_count: 3, b14_bramaluna_descanso: 3 } })), false);
  assert.equal(realPresent(fakeState({ flags: beaten, vars: { rest_count: 4, b14_bramaluna_descanso: 3 } })), true);
  assert.equal(realPresent(fakeState({ flags: { p7_restored: true, b14_bramaluna_capturada: true } })), false);
});

test('caracolas: el punto de regreso se guarda y se lee; sin él, la primera caracola de la sala en la misma capa', () => {
  const k = caracolaKey('antea_3_primigenia', 24, 8, 8);
  assert.deepEqual(parseCaracolaKey(k), { map: 'antea_3_primigenia', x: 24, y: 8, dir: 8 });
  assert.equal(parseCaracolaKey('ruta_1:1:1:2'), null);
  assert.equal(parseCaracolaKey(''), null);
  for (const id of ANTEA_MAPS) {
    const r = defaultReturn(id);
    const room = Number(id.split('_')[1]);
    assert.deepEqual([r.x, r.y, r.dir], [ROOMS[room].caracolas[0].stand.x, ROOMS[room].caracolas[0].stand.y, ROOMS[room].caracolas[0].stand.dir]);
    assert.equal(r.map, id);
  }
});

test('patrullas de la Bramaluna: deterministas, cíclicas y con el aviso de 5 casillas', () => {
  for (const id of Object.keys(PATROLS)) {
    const period = patrolPeriod(id);
    assert.equal(compilePatrol(PATROLS[id]).period, period);
    for (const f of [0, 17, 200, period - 1]) assert.deepEqual(patrolAt(id, f), patrolAt(id, f + period * 3), `${id} fotograma ${f}`);
    const start = patrolAt(id, 0);
    assert.deepEqual([start.from.x, start.from.y], [PATROLS[id].start.x, PATROLS[id].start.y]);
    // Durante un paso la posición lógica ya es la casilla de destino (como en el motor).
    const walk = patrolAt(id, 1);
    assert.equal(walk.kind, 'move');
    assert.equal(Math.abs(walk.x - walk.from.x) + Math.abs(walk.y - walk.from.y), 1);
  }
});

test('Caleta Sonda: escena de entrada con Buceo y sin P7; escena final solo tras el P7 y una vez', () => {
  const dive = ['dive'];
  assert.equal(needIntro(fakeState({ abilities: dive })), true);
  assert.equal(needIntro(fakeState()), false, 'sin Buceo no hay escena');
  assert.equal(needIntro(fakeState({ abilities: dive, flags: { b14_caleta_intro: true } })), false);
  assert.equal(needIntro(fakeState({ abilities: dive, flags: { b14_fausto_despierto: true } })), false, 'Fausto ya volvió');
  assert.equal(needIntro(fakeState({ abilities: dive, flags: { p7_restored: true } })), false);
  assert.equal(needFinal(fakeState()), false);
  assert.equal(needFinal(fakeState({ flags: { p7_restored: true } })), true);
  assert.equal(needFinal(fakeState({ flags: { p7_restored: true, b14_caleta_final: true } })), false);
});

/** Contexto de guion mínimo: flags, objetos y diálogo registrados (Zygarde acompaña en forma 50 %). */
function fakeCtx(flags = {}) {
  const f = { ...flags };
  const said = [];
  const items = [];
  return {
    said, items, flags: f,
    state: { data: { zygarde: { form: '50' } }, flag: (k) => Boolean(f[k]), zygardeAbility: () => true, player: { gender: 'M' } },
    flag: (k) => Boolean(f[k]),
    setFlag: (k, v = true) => { f[k] = v; },
    say: async (t) => { said.push(t); },
    giveItem: async (id, n = 1) => { items.push([id, n]); },
    se: () => {},
  };
}

const pageScript = (id) => b14CaletaEvents().find((e) => e.id === id).pages[0].script;

test('P7 sin despertar a Fausto: el Pilar lo suelta y su Real de plata espera en la playa (una sola vez)', async () => {
  const ctx = fakeCtx({ p7_restored: true, b14_compuerta: true });
  assert.equal(await releaseFausto(ctx), true);
  assert.equal(ctx.flags.b14_fausto_despierto, true);
  assert.equal(ctx.flags.b14_fausto_soltado, true);
  assert.equal(await releaseFausto(ctx), false, 'solo una vez');
  const talk = pageScript('b14_fausto');
  await talk(ctx);
  assert.deepEqual(ctx.items, [['RELICSILVER', 1]]);
  await talk(ctx);
  assert.equal(ctx.items.length, 1, 'el regalo no se repite');
  // Si se le despertó en la sala 2 (ya dio su moneda), la playa no da otra aunque falte el flag del regalo (partidas
  // guardadas antes de existir): solo regala quien soltó el P7.
  const woke = fakeCtx({ p7_restored: true, b14_fausto_despierto: true });
  assert.equal(await releaseFausto(woke), false);
  await pageScript('b14_fausto')(woke);
  assert.deepEqual(woke.items, []);
});

test('Tobías: si no se vio la escena de la playa, el Real de cobre espera; nunca se repite', async () => {
  const ctx = fakeCtx();
  const talk = pageScript('b14_tobias');
  await talk(ctx);
  assert.deepEqual(ctx.items, [['RELICCOPPER', 1]]);
  await talk(ctx);
  assert.equal(ctx.items.length, 1);
  const seen = fakeCtx({ b14_caleta_intro: true, b14_tobias_moneda: true });
  await pageScript('b14_tobias')(seen);
  assert.deepEqual(seen.items, []);
});

test('C079–C080 bajo el Islote Lumbre: al pie del borde sur del fondo, bajo el islote de la superficie (B13)', () => {
  const islote = LINKS.south.find((l) => l.to === 'islote_lumbre');
  for (const k of ['fondo_sur_3', 'fondo_sur_4']) {
    const c = FONDO.cells[k];
    assert.ok(c.x >= islote.offset && c.x < islote.offset + islote.width, `${k}: x ${c.x} fuera del islote`);
    assert.ok(c.y >= FONDO.h - 10, `${k}: y ${c.y} lejos del borde sur`);
  }
});

test('células C077–C084: claves y mapas del bloque; las tres del Pilar son obligatorias', () => {
  const byId = Object.fromEntries(CELLS.map((c) => [c.id, c]));
  const want = {
    C077: ['cell_fondo_sur_1', 'fondo_mar_sur'], C078: ['cell_fondo_sur_2', 'fondo_mar_sur'], C079: ['cell_fondo_sur_3', 'fondo_mar_sur'],
    C080: ['cell_fondo_sur_4', 'fondo_mar_sur'], C081: ['cell_fondo_sur_5', 'fondo_mar_sur'], C082: ['cell_ecos_1', 'antea_1_presente'],
    C083: ['cell_ecos_2', 'antea_3_presente'], C084: ['cell_ecos_3', 'antea_4_presente'],
  };
  for (const [id, [key, map]] of Object.entries(want)) {
    assert.equal(byId[id]?.key, key, id);
    assert.equal(byId[id]?.map, map, id);
  }
  for (const id of ['C082', 'C083', 'C084']) assert.equal(byId[id].required, true, `${id} obligatoria`);
});
