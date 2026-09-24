// Lógica narrativa sin navegador: cola de pistas de la Libreta (máx. 3, cola, descubrimiento directo, Nadar),
// API de historia con un ctx simulado (Tablillas, versos, «Pilar restaurado», Flauta), fase de crisis,
// descanso y transporte. docs/TABLILLAS.md §4.2, CAMPANA §1.7, §3.0, §3.1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, migrate } from '../game/src/core/state.js';
import {
  openClueState, advanceClueState, closeClueState, refreshClueQueue, clueStatus, clueNotebook, clueZones,
  markCluesSeen, syncClueSchedule, zygardeLine, activeCount,
} from '../game/src/content/story/clueLogic.js';
import {
  openClue, giveTablet, restorePillar, revealVerse, forgeAzureFlute, setCrisisPhase, syncFragmentItem, storyApi,
} from '../game/src/content/story/api.js';
import { derivedCrisisPhase, crisisPhase, crisisLayer, crisisTone, crisisAppliesTo, eveningWeight, CRISIS_RESTORED } from '../game/src/content/story/crisis.js';
import { verseRows, chronicleRows, tabletCells, tabCounter, clueListItems } from '../game/src/content/story/notebook.js';
import { revealedVerses } from '../game/src/content/story/verses.js';
import { missingCampaignTablets, hasAllCampaignTablets, CAMPAIGN_TABLETS } from '../game/src/content/story/tablets.js';
import {
  rest, restOptions, applyRest, minutesUntil, stormActive, stormWeather, registerRestHook, registerDreamHook, REST_COUNT_VAR,
} from '../game/src/world/rest.js';
import { TRAIN, FERRY, destinations, takeTransport, markStation, stationFlag } from '../game/src/world/transport.js';

/** ctx mínimo de guion: registra lo que se dice, se elige y a dónde se viaja. */
function fakeCtx(state, { choices = [], confirm = true } = {}) {
  const log = { said: [], toasts: [], warps: [], bgm: [], effects: [], healed: 0, weather: [] };
  return {
    state, log,
    ui: { toast: (t) => log.toasts.push(t), openClues: async () => {} },
    say: async (t) => { log.said.push(t); },
    choice: async () => (choices.length ? choices.shift() : 0),
    confirm: async () => confirm,
    se: () => {}, me: () => {}, bgm: (n) => log.bgm.push(n),
    effect: (n) => { log.effects.push(n); return { remove() {} }; },
    flash: async () => {}, shake: async () => {}, wait: async () => {}, fade: async () => {},
    weather: async (...w) => { log.weather.push(w); },
    facingTile: () => ({ x: 3, y: 3 }),
    setFlag: (k, v = true) => state.setFlag(k, v),
    requestRefresh: () => {},
    heal: () => { log.healed += 1; },
    warp: async (...a) => { log.warps.push(a); },
    world: { current: { def: { outdoor: true } } },
  };
}

test('cola de pistas: 3 abiertas como máximo; la cuarta espera y entra al resolver una', () => {
  const st = GameState.create();
  for (const id of ['T01', 'T02', 'T03']) assert.equal(openClueState(st, id).status, 'active');
  assert.equal(openClueState(st, 'T04').status, 'queued');
  assert.equal(activeCount(st), 3);
  assert.equal(openClueState(st, 'T01').changed, false, 'abrir dos veces no duplica');
  const { activated } = closeClueState(st, 'T01');
  assert.deepEqual(activated, ['T04']);
  assert.equal(clueStatus(st, 'T01'), 'solved');
  assert.equal(clueStatus(st, 'T04'), 'active');
  assert.equal(st.clues.find((c) => c.id === 'T01').solved, true, 'compatible con solveClue');
});

test('descubrimiento directo supera el límite; avanzar una pista en cola la activa', () => {
  const st = GameState.create();
  ['T01', 'T02', 'T03'].forEach((id) => openClueState(st, id));
  assert.equal(openClueState(st, 'T07', { direct: true }).status, 'active');
  assert.equal(activeCount(st), 4);
  openClueState(st, 'T05');
  assert.equal(clueStatus(st, 'T05'), 'queued');
  const r = advanceClueState(st, 'T05', 2);
  assert.deepEqual([r.status, r.step, r.changed], ['active', 2, true]);
  const e = st.clues.find((c) => c.id === 'T05');
  assert.match(e.text, /Losa del Pulso/, 'el texto pasa a la segunda pista');
});

test('T11 y T12 esperan a Nadar aunque haya hueco', () => {
  const st = GameState.create();
  assert.equal(openClueState(st, 'T11').status, 'queued');
  assert.deepEqual(refreshClueQueue(st), []);
  st.setZygardeAbility('swim', true);
  assert.deepEqual(refreshClueQueue(st), ['T11']);
  assert.equal(clueStatus(st, 'T11'), 'active');
});

test('la Libreta: secciones, «nuevo», zona de la segunda pista y frase de Zygarde', () => {
  const st = GameState.create();
  st.addClue('nota', 'Una nota suelta.');
  openClueState(st, 'T02');
  advanceClueState(st, 'T02');
  const nb = clueNotebook(st);
  assert.equal(nb.active.length, 1, 'las notas sueltas no ocupan hueco');
  assert.equal(activeCount(st), 1);
  const t02 = nb.active.find((r) => r.id === 'T02');
  assert.equal(t02.isNew, true);
  assert.equal(t02.steps.length, 2);
  assert.equal(t02.zone, 'ciudad_caudal');
  assert.equal(t02.zygarde, 'Allí no llego todavía.', 'falta Correr');
  assert.deepEqual(clueZones(st), [{ id: 'T02', zone: 'ciudad_caudal', place: 'Ciudad Caudal' }]);
  assert.equal(nb.notes[0].id, 'nota');
  assert.equal(nb.notes[0].custom, true);
  markCluesSeen(st);
  assert.equal(clueNotebook(st).active.find((r) => r.id === 'T02').isNew, false);
  st.setZygardeAbility('run', true);
  assert.equal(zygardeLine({ abilities: ['run'] }, st), null);
  assert.equal(zygardeLine({ abilities: ['swim'] }, st), 'Necesito cruzar agua profunda.');
  const items = clueListItems(st);
  assert.equal(items[0].kind, 'header');
});

test('syncClueSchedule abre las pistas cuyo hito ya pasó; el guardado conserva el estado de la cola', () => {
  const st = GameState.create();
  st.setFlag('b02_libreta');
  st.setFlag('p2_restored');
  assert.deepEqual(syncClueSchedule(st), ['T01', 'T03']);
  const back = new GameState(migrate(JSON.parse(JSON.stringify(st.data))));
  assert.equal(clueStatus(back, 'T03'), 'active');
  assert.equal(back.clues.find((c) => c.id === 'T01').order, 1);
  assert.throws(() => openClueState(st, 'T99'), /pista desconocida/);
});

test('giveTablet: mochila, Crónica, cierre del arco y rechazo de BLANKPLATE', async () => {
  const st = GameState.create();
  const ctx = fakeCtx(st);
  await openClue(ctx, 'T01');
  assert.equal(await giveTablet(ctx, 'MEADOWPLATE'), true);
  assert.ok(st.data.tablets.includes('MEADOWPLATE'));
  assert.equal(st.itemCount('MEADOWPLATE'), 1);
  assert.equal(clueStatus(st, 'T01'), 'solved');
  assert.ok(ctx.log.said.some((s) => /Tabla Pradal/.test(s)));
  assert.ok(ctx.log.said.some((s) => /Crónica/.test(s)));
  assert.equal(await giveTablet(ctx, 'MEADOWPLATE'), false, 'no se entrega dos veces');
  await assert.rejects(giveTablet(ctx, 'BLANKPLATE'), /BLANKPLATE/);
  await assert.rejects(giveTablet(ctx, 'POTION'), /desconocida/);
  assert.equal(chronicleRows(st)[0].unlocked, true);
  assert.equal(missingCampaignTablets(st).length, 14);
  for (const t of CAMPAIGN_TABLETS) await giveTablet(ctx, t.id, { silent: true });
  assert.ok(hasAllCampaignTablets(st));
  assert.equal(tabletCells(st).filter((c) => c.owned).length, 15);
  assert.equal(tabCounter(st, 'tablets'), 'Tablillas 15/18');
});

test('restorePillar: Fragmento con contador, verso, flag y efecto local; cadena de resonancia', async () => {
  const st = GameState.create();
  const ctx = fakeCtx(st);
  assert.equal(await restorePillar(ctx, 2), false, 'sin el Fragmento 1 el núcleo no responde');
  assert.match(ctx.log.said.at(-1), /no responde/);
  let local = null;
  assert.equal(await restorePillar(ctx, 1, { onRestored: async (_c, fr) => { local = fr.n; } }), true);
  assert.ok(st.flag('p1_restored'));
  assert.ok(st.flag('verse_1'));
  assert.deepEqual(st.data.fragments, ['F01']);
  assert.equal(st.itemCount('AZUREFRAGMENT'), 1);
  assert.equal(local, 1);
  assert.deepEqual(ctx.log.bgm, ['VinculoSupremo', 'LeyendaPrisma']);
  assert.ok(ctx.log.effects.includes('softLight'), 'brillo del núcleo');
  assert.equal(await restorePillar(ctx, 1), false, 'ya restaurado');
  assert.equal(await restorePillar(ctx, 2), true);
  assert.equal(st.itemCount('AZUREFRAGMENT'), 2);
  syncFragmentItem(st);
  assert.equal(st.itemCount('AZUREFRAGMENT'), 2);
  assert.equal(await forgeAzureFlute(ctx), false, 'faltan Fragmentos');
  for (let n = 3; n <= 10; n++) await restorePillar(ctx, n, { showVerse: false });
  assert.equal(st.itemCount('AZUREFRAGMENT'), 10);
  assert.equal(await forgeAzureFlute(ctx), true);
  assert.ok(st.hasKeyItem('AZUREFLUTE'));
  assert.equal(st.itemCount('AZUREFRAGMENT'), 0);
});

test('versos: traducción parcial sin Clave Glífica y total con ella', async () => {
  const st = GameState.create();
  const ctx = fakeCtx(st);
  await revealVerse(ctx, 1);
  await revealVerse(ctx, 'confirmation');
  await assert.rejects(revealVerse(ctx, 11), /inexistente/);
  let rows = verseRows(st);
  assert.equal(rows[0].revealed, true);
  assert.match(rows[0].translation, /···/);
  assert.equal(rows[1].revealed, false);
  assert.equal(rows.at(-1).revealed, true, 'confirmación');
  st.addKeyItem('GLYPHKEY');
  rows = verseRows(st);
  assert.equal(rows[0].translation, 'Cuando el que guarda el orden caiga en cien y cinco pedazos,');
  assert.equal(revealedVerses(st).length, 1);
  assert.equal(tabCounter(st, 'prophecy'), 'Versos 1/10');
});

test('fase de crisis derivada de los Pilares, forzable y restablecida tras el final', () => {
  const st = GameState.create();
  assert.equal(derivedCrisisPhase(st), 0);
  st.setFlag('p2_restored');
  assert.equal(crisisPhase(st), 0);
  st.setFlag('p3_restored');
  assert.equal(crisisPhase(st), 1);
  st.setFlag('p6_restored');
  assert.equal(crisisPhase(st), 2);
  st.setFlag('p8_restored');
  assert.equal(crisisPhase(st), 3);
  st.setFlag('p10_restored');
  assert.equal(crisisPhase(st), 4);
  st.setFlag('game_cleared');
  assert.equal(crisisPhase(st), CRISIS_RESTORED);
  assert.equal(setCrisisPhase(st, 3), 3);
  assert.equal(crisisPhase(st), 3);
  assert.equal(setCrisisPhase(st, null), CRISIS_RESTORED);
  assert.throws(() => setCrisisPhase(st, 9), /inválida/);
  const api = storyApi(fakeCtx(st));
  assert.equal(api.setCrisisPhase(1), 1);
  assert.equal(api.crisisPhase(), 1);
});

test('capa de cielo: eclipse con aurora, luna y grietas; atardecer largo; solo exteriores', () => {
  const eclipse = crisisLayer(3);
  assert.ok(eclipse.aurora && eclipse.moon && eclipse.cracks > 0);
  assert.equal(crisisLayer(4).cracks, 0, 'falsa calma: las grietas se cierran');
  assert.ok(crisisLayer(4).moon, 'la luna sigue grande');
  assert.deepEqual(crisisLayer(5).tone, [0, 0, 0, 0]);
  const dusk = crisisTone(crisisLayer(2), 19 * 60);
  const noon = crisisTone(crisisLayer(2), 12 * 60);
  assert.ok(dusk[0] > noon[0], 'atardecer más cálido');
  assert.equal(eveningWeight(12 * 60), 0);
  assert.ok(crisisAppliesTo({ outdoor: true }));
  assert.ok(!crisisAppliesTo({ outdoor: false }));
  assert.ok(!crisisAppliesTo({ outdoor: true, crisis: false }));
});

test('descanso: franjas, curación, contador, ganchos y tormenta de posada', async () => {
  assert.equal(minutesUntil(22 * 60, 8 * 60), 10 * 60);
  assert.equal(minutesUntil(8 * 60, 8 * 60), 0);
  assert.deepEqual(restOptions({ kind: 'home' }).map((o) => o.id), ['rest', 'deep']);
  assert.deepEqual(restOptions({ kind: 'inn', storm: true }).map((o) => o.id), ['rest', 'storm']);
  assert.deepEqual(restOptions({ kind: 'center', storm: true }).map((o) => o.id), ['rest']);
  assert.throws(() => restOptions({ kind: 'sofa' }), /desconocido/);

  const st = GameState.create();
  const hooks = [];
  const off = registerRestHook((_c, info) => hooks.push(info.mode));
  const ctx = fakeCtx(st, { choices: [0, 2] }); // Descansar → Noche
  const r = await rest(ctx, { kind: 'bed' });
  assert.deepEqual([r.rested, r.mode, r.slot], [true, 'rest', 'night']);
  assert.equal(st.hour, 21);
  assert.equal(ctx.log.healed, 1);
  assert.equal(st.var(REST_COUNT_VAR), 1);
  assert.deepEqual(hooks, ['rest']);

  const cancel = await rest(fakeCtx(st, { choices: [1] }), { kind: 'bed' });
  assert.equal(cancel.rested, false);

  let dreamt = 0;
  const offDream = registerDreamHook(async () => { dreamt += 1; return false; });
  const deep = await rest(fakeCtx(st, { choices: [1] }), { kind: 'home' });
  assert.deepEqual([deep.mode, st.hour, dreamt], ['deep', 8, 1]);

  const innCtx = fakeCtx(st, { choices: [1] });
  const storm = await rest(innCtx, { kind: 'inn', storm: true });
  assert.equal(storm.mode, 'storm');
  assert.ok(stormActive(st));
  assert.deepEqual(stormWeather(st, { outdoor: true }), ['storm', 6]);
  assert.equal(stormWeather(st, { outdoor: false }), null);
  assert.deepEqual(innCtx.log.weather, [['storm', 6]]);
  applyRest(st, { mode: 'rest', slot: 'morning' });
  assert.ok(!stormActive(st), 'otro descanso despeja la tormenta');
  await assert.rejects(rest(fakeCtx(st), { kind: 'bed', mode: 'deep' }), /no está disponible/);
  off();
  offDream();
});

test('transporte: tren tras P4 con estaciones visitadas; ferris por rutas tras P7', async () => {
  const st = GameState.create();
  assert.deepEqual(destinations(st, TRAIN, 'caudal'), [], 'línea suspendida antes de P4');
  const closed = fakeCtx(st);
  assert.equal(await takeTransport(closed, 'caudal'), null);
  assert.match(closed.log.said[0], /suspendido/);
  assert.ok(st.flag(stationFlag('caudal')), 'usar la estación la activa');
  st.setFlag('p4_restored');
  assert.deepEqual(destinations(st, TRAIN, 'caudal'), []);
  markStation(st, 'lumina');
  st.setPosition('ciudad_nexo', 1, 1);
  assert.deepEqual(destinations(st, TRAIN, 'caudal').map((s) => s.id), ['lumina', 'nexo'], 'visitar el mapa también cuenta');
  const ctx = fakeCtx(st, { choices: [1] });
  assert.equal(await takeTransport(ctx, 'caudal'), 'nexo');
  assert.equal(ctx.log.warps[0][0], 'ciudad_nexo');
  assert.deepEqual(destinations(st, FERRY, 'caleta'), []);
  st.setFlag('p7_restored');
  assert.deepEqual(destinations(st, FERRY, 'caleta').map((s) => s.id), ['nexo']);
  assert.deepEqual(destinations(st, FERRY, 'nexo').map((s) => s.id), ['caleta', 'boreal']);
  assert.throws(() => destinations(st, FERRY, 'lumina'), /parada desconocida/);
});
