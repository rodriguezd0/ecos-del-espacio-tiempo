// Catálogo semántico y resolución de nombres contra los archivos reales de Añil.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAudioIndex } from '../tools/lib/audio_index.mjs';
import { createAudioIndex, resolveFile, resolveCry, listNames, loopSecondsFromMeta, normalizeName } from '../game/src/audio/resolve.js';
import { BGM, ME, SE, catalogList, resolveCatalog, catalogEntry } from '../game/src/audio/catalog.js';
import { SYNTH_NAMES } from '../game/src/audio/synth.js';

const ANIL = fileURLToPath(new URL('../Pokemon Anil V4.13/', import.meta.url));
const HAS_ANIL = fs.existsSync(`${ANIL}Audio`);
// El índice generado (versionado) permite probar la resolución aunque falte la carpeta de Añil;
// la primera prueba comprueba que coincide con el disco cuando la carpeta existe.
const generated = JSON.parse(fs.readFileSync(new URL('../game/data/audio_index.json', import.meta.url)));
const index = createAudioIndex(generated);

test('game/data/audio_index.json está al día con la carpeta Audio de Añil', { skip: !HAS_ANIL && 'falta la carpeta de Añil' }, () => {
  const diskJson = buildAudioIndex(ANIL, { meta: false });
  const msg = 'Índice desactualizado: ejecuta node tools/extract_audio.mjs';
  for (const kind of ['bgm', 'me', 'bgs']) {
    assert.deepEqual(Object.keys(generated[kind]).sort(), Object.keys(diskJson[kind]).sort(), `${msg} (${kind})`);
  }
  assert.deepEqual(generated.se, diskJson.se, `${msg} (se)`);
  assert.deepEqual(generated.cries, diskJson.cries, `${msg} (cries)`);
});

test('el índice generado trae el bucle de las BGM y omite el .mid', () => {
  const tagged = Object.values(generated.bgm).filter((e) => e.loopTags).length;
  assert.equal(tagged, 82);
  assert.equal(Object.values(generated.bgm).filter((e) => e.loop).length, 81);
  assert.equal(generated.bgm.title_dppt, undefined);
  const loop = loopSecondsFromMeta(resolveFile(index, 'bgm', 'PrismaVilla1').meta);
  assert.ok(Math.abs(loop.startSec - 18.0828) < 1e-3);
});

test('todas las entradas de archivo del catálogo existen en Añil', () => {
  const missing = [];
  for (const e of catalogList()) {
    if (e.synth) continue;
    if (!resolveFile(index, e.kind, e.file)) missing.push(`${e.kind}:${e.id} → ${e.file}`);
    for (const alt of e.alt || []) if (!resolveFile(index, e.kind, alt)) missing.push(`${e.kind}:${e.id} alt → ${alt}`);
  }
  assert.deepEqual(missing, []);
});

test('los sonidos sintetizados del catálogo son conocidos y core_signal usa el grito de PORYGON', () => {
  for (const e of catalogList().filter((x) => x.synth)) assert.ok(SYNTH_NAMES.includes(e.synth), e.synth);
  assert.equal(SE.core_signal.synth, 'core_signal');
  assert.equal(resolveCry(index, SE.core_signal.source).file, 'PORYGON.ogg');
});

test('catálogo: nombres semánticos básicos pedidos', () => {
  const se = ['cursor', 'decision', 'cancel', 'buzzer', 'menu_open', 'door_enter', 'bump', 'jump', 'grass_rustle',
    'ball_throw', 'ball_shake', 'ball_click', 'hit_normal', 'hit_super', 'hit_weak', 'low_hp', 'level_up', 'core_signal'];
  for (const id of se) assert.ok(SE[id], `SE ${id}`);
  for (const id of ['heal', 'item_get', 'key_item_get', 'save', 'evolution_success', 'capture']) assert.ok(ME[id], `ME ${id}`);
  for (const id of ['town_start', 'route', 'cave', 'ruins', 'lab', 'battle_wild', 'battle_trainer', 'battle_rival',
    'battle_legendary', 'genesis_base', 'prologue', 'victory_wild']) {
    assert.ok(BGM[id], `BGM ${id}`);
    assert.match(BGM[id].note, /PROVISIONAL/);
  }
});

test('resolveCatalog: semántico, alias y nombre de archivo literal', () => {
  const c = resolveCatalog('se', 'cursor');
  assert.deepEqual([c.id, c.file, c.volume], ['cursor', 'GUI sel cursor', 80]);
  assert.equal(resolveCatalog('se', 'select').id, 'decision');
  assert.equal(resolveCatalog('se', 'Hierba').id, 'grass_rustle');
  const lit = resolveCatalog('bgm', 'PrismaVilla1');
  assert.deepEqual([lit.id, lit.file, lit.volume, lit.pitch], [null, 'PrismaVilla1', 100, 100]);
  assert.equal(catalogEntry('xx', 'cursor'), null);
  assert.equal(catalogEntry('se', 'toString'), null);
});

test('resolveFile: sin extensión, sin mayúsculas y con prefijo Audio/…', () => {
  assert.equal(resolveFile(index, 'se', 'gui sel cursor').path, 'Audio/SE/GUI sel cursor.ogg');
  assert.equal(resolveFile(index, 'se', 'Audio/SE/GUI sel cursor.ogg').file, 'GUI sel cursor.ogg');
  assert.equal(resolveFile(index, 'me', 'item get').path, 'Audio/ME/Item get.wav');
  assert.equal(resolveFile(index, 'bgm', 'salvaje').name, 'Salvaje');
  assert.equal(resolveFile(index, 'bgm', 'NoExiste'), null);
  assert.equal(resolveFile(index, 'bgm', ''), null);
  assert.equal(normalizeName('se', 'se\\Anim\\Fire1.ogg'), 'Anim/Fire1.ogg');
  assert.throws(() => resolveFile(index, 'video', 'x'), /desconocido/);
});

test('resolveFile: subcarpeta Anim, gritos vía SE y preferencia de extensión de Essentials', () => {
  assert.equal(resolveFile(index, 'se', 'Shiny sparkle').path, 'Audio/SE/Anim/Shiny sparkle.ogg');
  assert.equal(resolveFile(index, 'se', 'Anim/Select').file, 'Anim/Select.WAV'); // SE: "", .wav, .ogg
  assert.equal(resolveFile(index, 'se', 'Anim/Select.ogg').file, 'Anim/Select.ogg'); // extensión explícita
  assert.equal(resolveFile(index, 'se', 'Cries/PIKACHU').path, 'Audio/SE/Cries/PIKACHU.ogg');
});

test('resolveCry: variante de forma, retroceso a la forma base y grito de debilitado', () => {
  assert.equal(resolveCry(index, 'CHARIZARD', 1).file, 'CHARIZARD_1.ogg');
  assert.equal(resolveCry(index, 'charizard', 0).file, 'CHARIZARD.ogg');
  assert.equal(resolveCry(index, 'TURTWIG', 3).file, 'TURTWIG.ogg');
  assert.equal(resolveCry(index, 'PIKACHU', 0, '_faint').file, 'PIKACHU_faint.ogg');
  assert.equal(resolveCry(index, 'TURTWIG', 0, '_faint'), null);
  assert.equal(resolveCry(index, 'ROYALEON').file, 'ROYALEON.wav');
  assert.equal(resolveCry(index, 'NOEXISTE'), null);
  assert.equal(resolveCry(index, null), null);
});

test('sin índice se adivina la ruta .ogg (el reproductor tolera el 404)', () => {
  const g = resolveFile(null, 'bgm', 'Salvaje');
  assert.deepEqual([g.path, g.guessed], ['Audio/BGM/Salvaje.ogg', true]);
  assert.equal(resolveCry(null, 'PIKACHU', 2).path, 'Audio/SE/Cries/PIKACHU_2.ogg');
  assert.equal(resolveFile(null, 'se', 'Door exit.wav').path, 'Audio/SE/Door exit.wav');
});

test('listNames devuelve nombres ordenados y createAudioIndex valida la entrada', () => {
  const bgm = listNames(index, 'bgm');
  assert.equal(bgm.length, 109);
  assert.ok(bgm.includes('PuebloMarengo'));
  assert.deepEqual(listNames(null, 'bgm'), []);
  assert.throws(() => createAudioIndex(null), TypeError);
});
