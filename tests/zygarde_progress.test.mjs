// Progresión de Zygarde (world/zygarde/progression.js y scenes.js): capacidades a partir de células, núcleos
// e hitos; activación diferida con escena genérica; «Me faltan N partes»; formas y Arca; estado guardado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, migrate } from '../game/src/core/state.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { MILESTONES } from '../game/src/content/zygarde/thresholds.js';
import { missingPartsLine, numberWord } from '../game/src/content/zygarde/texts.js';
import {
  capabilityStatus, pendingCapabilities, missingParts, firstMissing, unlockedForms, naturalForm, applyUnlock,
  joinCore, canChooseForm, inCrisisSearch, zygardeSummary,
} from '../game/src/world/zygarde/progression.js';
import {
  checkZygardeProgress, reachMilestone, grantCore, unlockCapability, remindMissing,
} from '../game/src/world/zygarde/scenes.js';

function stateWith({ cells = 0, cores = [], flags = [], abilities = [] } = {}) {
  const s = GameState.create({ name: 'Prueba' });
  for (const c of CELLS.slice(0, cells)) s.addCell(c.key);
  for (const id of cores) s.addCore(id);
  for (const f of flags) s.setFlag(f);
  for (const a of abilities) s.setZygardeAbility(a, true);
  return s;
}

/** ctx mínimo que registra lo dicho y los efectos. */
function fakeCtx(state) {
  const said = [];
  return {
    state, said,
    world: null, player: null,
    say: async (t, o = {}) => { said.push(o.telepathy ? `[T] ${t}` : t); },
    flash: async () => {}, wait: async () => {}, se: () => {}, effect: () => ({ remove() {} }),
    setFlag: (k, v = true) => state.setFlag(k, v), requestRefresh: () => {},
    scene: { refreshFollower() { said.push('<seguidor>'); } },
  };
}

test('estado nuevo: ninguna capacidad pendiente ni formas', () => {
  const s = stateWith();
  assert.deepEqual(pendingCapabilities(s), []);
  assert.deepEqual(unlockedForms(s), []);
  assert.equal(naturalForm(s), null);
});

test('Correr: 10 células + N1 + P1 restaurado; sin el hito no hay aviso de partes', () => {
  const s = stateWith({ cells: 10, cores: ['N1'] });
  assert.deepEqual(pendingCapabilities(s), []);
  assert.equal(missingParts(s, 'run'), 0, 'sin hito no se dice nada');
  s.setFlag('p1_restored');
  assert.deepEqual(pendingCapabilities(s), ['run']);
  const st = capabilityStatus(s, 'run');
  assert.equal(st.eligible, true);
  assert.equal(st.unlocked, false);
});

test('activación diferida: con el hito y 8 células faltan dos partes; al llegar a 10 se activa', () => {
  const s = stateWith({ cells: 8, cores: ['N1'], flags: ['p1_restored'] });
  assert.equal(missingParts(s, 'run'), 2);
  assert.deepEqual(firstMissing(s), { key: 'run', missing: 2 });
  s.addCell(CELLS[8].key);
  s.addCell(CELLS[9].key);
  assert.deepEqual(pendingCapabilities(s), ['run']);
});

test('applyUnlock: Correr pasa a la forma 10 % y fija zyg_10; no retrocede la forma', () => {
  const s = stateWith({ cells: 10, cores: ['N1'], flags: ['p1_restored'] });
  s.setZygardeForm('core');
  assert.deepEqual(applyUnlock(s, 'run'), { changed: true, formChanged: '10' });
  assert.equal(s.zygardeForm, '10');
  assert.ok(s.flag('zyg_10'));
  assert.deepEqual(applyUnlock(s, 'run'), { changed: false, formChanged: null });
  s.setZygardeForm('50');
  applyUnlock(s, 'ram');
  assert.equal(s.zygardeForm, '50', 'Embestida no cambia la forma');
});

test('cadena completa: 100 células, 5 núcleos e hitos activan todo en orden (Completa al final)', () => {
  const s = stateWith({
    cells: 100, cores: ['N1', 'N2', 'N3', 'N4', 'N5'],
    flags: [MILESTONES.run, MILESTONES.climb, MILESTONES.dive, MILESTONES.complete],
  });
  const keys = pendingCapabilities(s);
  assert.deepEqual(keys, ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild']);
  for (const k of keys) applyUnlock(s, k);
  assert.equal(s.zygardeForm, 'complete');
  assert.ok(s.flag('zyg_50') && s.flag('zyg_complete'));
  assert.deepEqual(unlockedForms(s), ['core', '10', '50', 'complete']);
  s.setFlag(MILESTONES.jump);
  assert.deepEqual(pendingCapabilities(s), ['jump'], 'el Salto llega tras el P10');
});

test('núcleos: joinCore añade, fija zyg_core_n y empieza como Core; Terreno necesita N2', () => {
  const s = stateWith({ cells: 30, cores: ['N1'], flags: ['p1_restored'] });
  applyUnlock(s, 'run');
  applyUnlock(s, 'ram');
  assert.equal(capabilityStatus(s, 'terrain').eligible, false);
  assert.deepEqual(capabilityStatus(s, 'terrain').coresMissing, ['N2']);
  assert.equal(joinCore(s, 'N2'), true);
  assert.ok(s.flag('zyg_core_2'));
  assert.deepEqual(pendingCapabilities(s), ['terrain']);
  assert.throws(() => joinCore(s, 'N9'), /desconocido/);
  const fresh = stateWith();
  joinCore(fresh, 'N1');
  assert.equal(fresh.zygardeForm, 'core');
});

test('Arca: solo formas desbloqueadas y con ZYGARDECUBE', () => {
  const s = stateWith({ cells: 10, cores: ['N1'], flags: ['p1_restored'] });
  s.setZygardeForm('core');
  applyUnlock(s, 'run');
  assert.equal(canChooseForm(s, 'core'), false, 'sin Arca');
  s.addKeyItem('ZYGARDECUBE');
  assert.equal(canChooseForm(s, 'core'), true);
  assert.equal(canChooseForm(s, '50'), false, 'forma bloqueada');
  assert.equal(canChooseForm(s, '10', { requireArca: false }), true);
});

test('crisis del P8 sin todas las células', () => {
  const s = stateWith({ cells: 96, cores: ['N1', 'N2', 'N3', 'N4', 'N5'], flags: ['p8_restored'] });
  assert.equal(inCrisisSearch(s), true);
  assert.equal(missingParts(s, 'fly'), 0, 'faltan capacidades previas: no se cuenta aún');
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive']) s.setZygardeAbility(k, true);
  assert.equal(missingParts(s, 'fly'), 4);
});

test('textos: números en palabras y «Me faltan N partes»', () => {
  assert.equal(missingPartsLine(1), 'Me falta una parte.');
  assert.equal(missingPartsLine(2), 'Me faltan dos partes.');
  assert.equal(missingPartsLine(25), 'Me faltan 25 partes.');
  assert.equal(numberWord(16), 'dieciséis');
});

test('checkZygardeProgress: escena genérica telepática + aviso + ayuda; Vuelo y Reconstrucción en una sola escena', async () => {
  const s = stateWith({ cells: 18, cores: ['N1'], flags: ['p1_restored'] });
  s.setZygardeForm('core');
  const ctx = fakeCtx(s);
  const keys = await checkZygardeProgress(ctx);
  assert.deepEqual(keys, ['run', 'ram']);
  assert.ok(ctx.said.includes('[T] Recuerdo cómo se abre paso.'), 'línea de Embestida (CAMPANA §2.1)');
  assert.ok(ctx.said.some((t) => t.includes('Forma 10')), 'aviso de cambio de forma');
  assert.equal(s.zygardeForm, '10');

  const full = stateWith({ cells: 100, cores: ['N1', 'N2', 'N3', 'N4', 'N5'], flags: ['p8_restored'] });
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive']) full.setZygardeAbility(k, true);
  const ctx2 = fakeCtx(full);
  assert.deepEqual(await checkZygardeProgress(ctx2), ['fly', 'rebuild']);
  assert.equal(ctx2.said.filter((t) => t.startsWith('[T]')).length, 1, 'una sola escena');
  assert.ok(ctx2.said.some((t) => t.includes('Vuelo y Reconstrucción')));
});

test('checkZygardeProgress con scenes: false activa sin escena', async () => {
  const s = stateWith({ cells: 25, cores: ['N1', 'N2'], abilities: ['run', 'ram'] });
  const ctx = fakeCtx(s);
  assert.deepEqual(await checkZygardeProgress(ctx, { scenes: false }), ['terrain']);
  assert.equal(ctx.said.filter((t) => !t.startsWith('<')).length, 0);
});

test('reachMilestone: fija el flag y dice las partes que faltan; al completarlas se activa sola', async () => {
  const s = stateWith({ cells: 8, cores: ['N1'] });
  s.setZygardeForm('core');
  const ctx = fakeCtx(s);
  const r = await reachMilestone(ctx, 'run');
  assert.ok(s.flag('p1_restored'));
  assert.deepEqual(r, { unlocked: [], missing: 2 });
  assert.deepEqual(ctx.said.filter((t) => t.startsWith('[T]')), ['[T] Me faltan dos partes.']);
  // El Core lo recuerda al hablarle.
  const ctx2 = fakeCtx(s);
  assert.equal(await remindMissing(ctx2), true);
  s.addCell(CELLS[8].key);
  s.addCell(CELLS[9].key);
  assert.deepEqual(await checkZygardeProgress(fakeCtx(s)), ['run']);
  assert.equal(await remindMissing(fakeCtx(s)), false);
  await assert.rejects(() => reachMilestone(ctx, 'nada'), /desconocido/);
});

test('grantCore y unlockCapability (escenas de bloque)', async () => {
  const s = stateWith({ cells: 34, cores: ['N1'], abilities: ['run', 'ram'] });
  const ctx = fakeCtx(s);
  const r = await grantCore(ctx, 'N2', { scenes: false });
  assert.deepEqual(r, { isNew: true, unlocked: ['terrain'] });
  assert.equal(await unlockCapability(ctx, 'anchor'), true);
  assert.equal(await unlockCapability(ctx, 'anchor'), false);
});

test('resumen de pantalla: sin capacidades de postgame hasta recuperarlas', () => {
  const s = stateWith({ cells: 12, cores: ['N1'] });
  s.setZygardeForm('core');
  const sum = zygardeSummary(s);
  assert.equal(sum.cells, 12);
  assert.equal(sum.coreCount, 1);
  assert.equal(sum.formName, 'Core');
  assert.ok(!sum.capabilities.some((c) => c.key === 'anchor'));
  assert.deepEqual(sum.forms.map((f) => f.unlocked), [true, false, false, false]);
  s.setZygardeAbility('anchor', true);
  assert.ok(zygardeSummary(s).capabilities.some((c) => c.key === 'anchor'));
});

test('GameState: setZygardeForm valida y el guardado conserva la forma', () => {
  const s = GameState.create();
  assert.equal(s.zygardeForm, null);
  s.setZygardeForm('50');
  assert.equal(s.zygardeForm, '50');
  assert.throws(() => s.setZygardeForm('70'), /forma desconocida/);
  s.setZygardeForm(null);
  assert.equal(s.zygardeForm, null);
  s.setZygardeForm('10');
  s.addCell('cell_ruta_1_1');
  const back = new GameState(migrate(JSON.parse(JSON.stringify(s.data))));
  assert.equal(back.zygardeForm, '10');
  assert.equal(back.cellCount(), 1);
});
