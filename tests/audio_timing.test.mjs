// Cálculos del mezclador (bucles, volúmenes, tono), caché LRU y cargador con fetch simulado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  framesToSeconds, normalizeVolume, normalizePitch, loopPosition, clampResumeOffset, loopRegion, volumesFromOptions,
} from '../game/src/audio/timing.js';
import { LruMap, AudioLoader } from '../game/src/audio/bufferCache.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('framesToSeconds', () => {
  assert.equal(framesToSeconds(60), 1);
  assert.equal(framesToSeconds(0), 0);
  assert.equal(framesToSeconds(-5), 0);
  assert.equal(framesToSeconds('x'), 0);
  assert.equal(framesToSeconds(true, 30), 0.5);
});

test('normalizeVolume admite 0..1 y 0..100', () => {
  assert.equal(normalizeVolume(80), 0.8);
  assert.equal(normalizeVolume(0.5), 0.5);
  assert.equal(normalizeVolume(undefined, 0.3), 0.3);
  assert.equal(normalizeVolume(250), 1);
  assert.equal(normalizeVolume(-1), 0);
  assert.equal(normalizeVolume('nope', 0.2), 0.2);
});

test('normalizePitch admite escala RPG Maker (100) y factor', () => {
  assert.equal(normalizePitch(100), 1);
  assert.equal(normalizePitch(75), 0.75);
  assert.equal(normalizePitch(1.5), 1.5);
  assert.equal(normalizePitch(0), 1);
  assert.equal(normalizePitch(undefined), 1);
  assert.equal(normalizePitch(1000), 4);
});

test('loopPosition vuelve a LOOPSTART al pasar LOOPEND', () => {
  close(loopPosition(10, 5, 1, 18, 176), 15);
  close(loopPosition(170, 10, 1, 18, 176), 18 + (180 - 18) % 158);
  close(loopPosition(0, 2, 1.5, 1, 2), 1); // 3 s → 1 + (3-1)%1
  close(loopPosition(5, 10, 1, 0, null, 12), 12); // sin bucle: se queda al final
});

test('clampResumeOffset mantiene la reanudación dentro del archivo', () => {
  assert.equal(clampResumeOffset(-3, 10, 20, 30), 0);
  assert.equal(clampResumeOffset(NaN, 10, 20, 30), 0);
  assert.equal(clampResumeOffset(15, 10, 20, 30), 15);
  close(clampResumeOffset(25, 10, 20, 30), 15);
  assert.equal(clampResumeOffset(40, 0, 0, 30), 0);
});

test('loopRegion usa el bucle del archivo o el archivo completo', () => {
  assert.deepEqual(loopRegion({ startSec: 2, endSec: 8 }, 10), { loopStart: 2, loopEnd: 8, fromTags: true });
  assert.deepEqual(loopRegion({ startSec: 2, endSec: 18 }, 10), { loopStart: 2, loopEnd: 10, fromTags: true });
  assert.deepEqual(loopRegion(null, 10), { loopStart: 0, loopEnd: 10, fromTags: false });
  assert.deepEqual(loopRegion({ startSec: 12, endSec: 18 }, 10), { loopStart: 0, loopEnd: 10, fromTags: false });
});

test('volumesFromOptions lee las opciones de la partida', () => {
  assert.deepEqual(volumesFromOptions({ bgmVolume: 0.7, seVolume: 0.8 }), { bgm: 0.7, se: 0.8, me: 0.7, cry: 0.8 });
  assert.deepEqual(volumesFromOptions({ bgmVolume: 50, seVolume: 0, meVolume: 0.2, cryVolume: 1 }), { bgm: 0.5, se: 0, me: 0.2, cry: 1 });
  assert.deepEqual(volumesFromOptions(null), {});
  assert.deepEqual(volumesFromOptions({ bgmVolume: 'alto' }), {});
});

test('LruMap expulsa el menos usado', () => {
  const m = new LruMap(2);
  m.set('a', 1).set('b', 2);
  m.get('a');
  m.set('c', 3);
  assert.deepEqual([m.has('a'), m.has('b'), m.has('c'), m.size], [true, false, true, 2]);
  assert.equal(m.get('zz'), undefined);
});

function withFetch(impl, fn) {
  const saved = globalThis.fetch;
  globalThis.fetch = impl;
  return Promise.resolve(fn()).finally(() => { globalThis.fetch = saved; });
}

test('AudioLoader: archivo ausente → null con un único aviso', async () => {
  const warnings = [];
  let calls = 0;
  const loader = new AudioLoader({ urlFor: (p) => `/anil/${p}`, warn: (_k, m) => warnings.push(m) });
  await withFetch(async () => { calls += 1; return { ok: false, status: 404 }; }, async () => {
    const ctx = { decodeAudioData: async () => { throw new Error('no debería decodificar'); } };
    assert.equal(await loader.load(ctx, 'Audio/SE/nada.ogg'), null);
    assert.equal(await loader.load(ctx, 'Audio/SE/nada.ogg'), null);
  });
  assert.equal(calls, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /No se encontró Audio\/SE\/nada\.ogg \(HTTP 404\)/);
});

test('AudioLoader: decodifica, adjunta el bucle y cachea', async () => {
  const bytes = fs.readFileSync(new URL('../Pokemon Anil V4.13/Audio/BGM/Battle low HP.ogg', import.meta.url));
  let calls = 0;
  let decodes = 0;
  const loader = new AudioLoader({ urlFor: (p) => p, warn: () => {} });
  const ctx = { decodeAudioData: async () => { decodes += 1; return { duration: 33.08 }; } };
  await withFetch(async () => {
    calls += 1;
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  }, async () => {
    const r = await loader.load(ctx, 'Audio/BGM/Battle low HP.ogg', 'bgm');
    assert.equal(r.buffer.duration, 33.08);
    assert.equal(r.meta.loop.start, 507223);
    await loader.load(ctx, 'Audio/BGM/Battle low HP.ogg', 'bgm');
  });
  assert.deepEqual([calls, decodes], [1, 1]);
  assert.equal(loader.isCached('Audio/BGM/Battle low HP.ogg', 'bgm'), true);
  assert.equal(loader.stats().bgm, 1);
});

test('AudioLoader: error de decodificación → null con aviso', async () => {
  const warnings = [];
  const loader = new AudioLoader({ urlFor: (p) => p, warn: (_k, m) => warnings.push(m) });
  const ctx = { decodeAudioData: async () => { throw new Error('formato no soportado'); } };
  await withFetch(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }), async () => {
    assert.equal(await loader.load(ctx, 'Audio/BGM/x.mid', 'bgm'), null);
  });
  assert.match(warnings[0], /No se pudo decodificar Audio\/BGM\/x\.mid: formato no soportado/);
});
