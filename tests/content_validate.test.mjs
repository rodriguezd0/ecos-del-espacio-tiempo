// Validador de contenido (tools/validate_content.mjs): todo el contenido registrado pasa sin errores y cada
// comprobación detecta los fallos que debe detectar (datos de prueba mínimos, sin navegador).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateContent, EXTERNAL_FLAGS } from '../tools/validate_content.mjs';
import {
  Report, loadDb, edgeCrossings, checkEncounters, checkTrainers, scanScripts, flagsReadByWhen, mapFile, spriteFile, urlToFile,
} from '../tools/validate_content_lib.mjs';
import { mapFromRows } from './world_helpers.mjs';

const db = loadDb();

test('validate_content: todo el contenido registrado pasa sin errores', async () => {
  const { report, stats } = await validateContent();
  const errors = report.errors.map((e) => `${e.file}: ${e.msg}`);
  assert.deepEqual(errors, [], `errores de contenido:\n${errors.join('\n')}`);
  assert.ok(stats.maps >= 10, 'mapas registrados');
  assert.ok(stats.trainers >= 4, 'entrenadores registrados');
  assert.ok(stats.cells >= 7, 'células del Bloque 1 colocadas');
  assert.ok(stats.b01Flags >= 10, 'flags leídos por when() en el Bloque 1');
});

test('Report agrupa por archivo y separa errores de avisos', () => {
  const r = new Report();
  r.error('a.js', 'uno');
  r.warn('a.js', 'dos');
  r.error('b.js', 'tres');
  r.note('nota');
  assert.equal(r.errors.length, 2);
  assert.equal(r.warnings.length, 1);
  assert.deepEqual([...r.byFile().keys()], ['a.js', 'b.js']);
  assert.deepEqual(r.info, ['nota']);
});

test('mapFile y rutas de gráficos: registro → archivo y claves de sprite → disco', () => {
  assert.equal(mapFile(() => import('./b01/ruta_1.js')), 'game/src/content/maps/b01/ruta_1.js');
  assert.ok(fs.existsSync(spriteFile('anil:cientifico')), 'alias de clase de Añil');
  assert.ok(fs.existsSync(spriteFile('ayudante')), 'arte propio registrado');
  assert.ok(fs.existsSync(spriteFile('asset:objects/tripode.png')), 'asset propio');
  assert.equal(fs.existsSync(spriteFile('no_existe_nunca')), false);
  assert.equal(spriteFile('follower:PIKACHU:0:0'), null);
  assert.ok(urlToFile('/anil/Graphics/Trainers/CHICO.png').endsWith(path.join('Graphics', 'Trainers', 'CHICO.png')));
});

test('edgeCrossings: cuenta las casillas del borde que se cruzan en ambos sentidos', () => {
  const a = mapFromRows(['.#..', '....', '.#.#']);
  const b = mapFromRows(['..#.', '....']);
  // a al sur conecta con b; offset 1 → x de a = x de b + 1
  const cross = edgeCrossings(a, b, { dir: 'south', offset: 1 });
  assert.deepEqual(cross.map(([x]) => x), [2]);
  assert.equal(edgeCrossings(a, b, { dir: 'south', offset: 10 }).length, 0, 'sin solape no hay paso');
});

test('checkEncounters: especies fuera de species.json, pesos y niveles', () => {
  const r = new Report();
  checkEncounters(r, 'm.js', { encounters: { grass: [[20, 'BIDOOF', 2, 4], [10, 'NOEXISTE', 2, 4], [0, 'STARLY', 5, 3]], stepChance: { grass: 21 } } }, db);
  const msgs = r.errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /NOEXISTE/);
  assert.match(msgs, /peso inválido/);
  assert.match(msgs, /niveles inválidos/);
  assert.equal(r.errors.length, 3);
});

test('checkTrainers: especies, movimientos, objetos y equipos dinámicos', () => {
  const r = new Report();
  checkTrainers(r, {
    ok: { sprite: 'anil:bichero', party: [{ species: 'WURMPLE', level: 3, moves: ['TACKLE'] }], items: ['POTION'] },
    mal: { sprite: 'gael_front', party: [{ species: 'NOEXISTE', level: 0, moves: ['NOMOVE'], item: 'NOITEM' }], items: ['NADA'] },
    roto: { sprite: 'gael_front', party: () => { throw new Error('sin variable'); } },
    vacio: { sprite: 'gael_front', party: [] },
  }, {}, db);
  const msgs = r.errors.map((e) => e.msg);
  assert.ok(!msgs.some((m) => m.startsWith('ok:')), 'el correcto no da errores');
  for (const re of [/NOEXISTE/, /nivel inválido/, /NOMOVE/, /NOITEM/, /NADA/, /roto: el equipo no se puede formar/, /vacio: equipo vacío/]) {
    assert.ok(msgs.some((m) => re.test(m)), `falta ${re}`);
  }
});

test('scanScripts: flags que se ponen (literales, constantes y F.x), objetos y entrenadores por id', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecos-scan-'));
  const file = path.join(dir, 'guion.js');
  fs.writeFileSync(file, [
    "export const F = Object.freeze({",
    "  dex: 'b01_dex_received',",
    "});",
    "const MARCA = 'mi_flag';",
    "ctx.setFlag('literal_flag');",
    'ctx.setFlag(MARCA);',
    'ctx.setFlag(F.dex, true);',
    "await ctx.giveItem('POTION', 3);",
    "state.addKeyItem('NOEXISTE');",
    "await ctx.battle({ trainer: 'gael_1' });",
  ].join('\n'));
  try {
    const { flagsSet, items, trainerRefs } = scanScripts([file]);
    assert.deepEqual([...flagsSet.keys()].sort(), ['b01_dex_received', 'literal_flag', 'mi_flag']);
    assert.deepEqual(items.map((i) => i.id), ['POTION', 'NOEXISTE']);
    assert.deepEqual(trainerRefs.map((t) => t.id), ['gael_1']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('flagsReadByWhen: descubre los flags de all/none aunque when() corte en el primero', () => {
  const when = (s) => s.flag('a') && s.flag('b') && !s.flag('c') && !s.flag('d');
  const defs = [{ id: 'm', events: [{ id: 'e', x: 0, y: 0, when }, { id: 'p', x: 1, y: 0, pages: [{ when: (s) => s.flag('z') }] }] }];
  const reads = flagsReadByWhen(defs);
  assert.deepEqual([...reads.keys()].sort(), ['a', 'b', 'c', 'd', 'z']);
  assert.deepEqual([...reads.get('z')], ['m']);
});

test('los flags externos del Bloque 1 están documentados', () => {
  assert.ok(EXTERNAL_FLAGS.p1_restored.includes('B02'));
});
