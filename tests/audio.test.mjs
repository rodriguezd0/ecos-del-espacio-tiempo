// Parser de metadatos de audio (Ogg Vorbis / WAV) con archivos reales de Añil y datos sintéticos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseOggMeta, parseWavMeta, parseAudioMeta, parseVorbisComments, loopFromComments, readFirstPackets, hasLoopTags,
} from '../game/src/audio/oggMeta.js';

const AUDIO = new URL('../Pokemon Anil V4.13/Audio/', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, AUDIO));
// La carpeta de Añil no se versiona (.gitignore): sin ella se omiten las pruebas con archivos reales.
const real = { skip: fs.existsSync(AUDIO) ? false : 'falta "Pokemon Anil V4.13/Audio"' };

test('lee LOOPSTART/LOOPLENGTH y frecuencia de un OGG real (PrismaVilla1)', real, () => {
  const meta = parseOggMeta(read('BGM/PrismaVilla1.ogg'));
  assert.equal(meta.codec, 'vorbis');
  assert.equal(meta.sampleRate, 44100);
  assert.equal(meta.channels, 2);
  assert.equal(meta.comments.LOOPSTART, '000797453');
  assert.equal(meta.totalSamples, 8379392);
  assert.deepEqual([meta.loop.start, meta.loop.length], [797453, 6993050]);
  assert.ok(Math.abs(meta.loop.startSec - 18.0828) < 1e-3);
  assert.ok(Math.abs(meta.loop.endSec - 176.6554) < 1e-3);
  assert.ok(Math.abs(meta.duration - 190.0089) < 1e-3);
});

test('bucle que termina justo al final del archivo (Battle low HP)', real, () => {
  const meta = parseAudioMeta(read('BGM/Battle low HP.ogg'));
  assert.equal(meta.loop.start + meta.loop.length, meta.totalSamples);
});

test('acepta la errata LOOPLENGHT de PrismaBossFinal', real, () => {
  const meta = parseOggMeta(read('BGM/PrismaBossFinal.ogg'));
  assert.equal(meta.comments.LOOPLENGHT, '002444707');
  assert.deepEqual([meta.loop.start, meta.loop.length], [2135135, 2444707]);
});

test('LOOPSTART al final del archivo (CombateCintia) → etiquetas presentes pero sin bucle válido', real, () => {
  const meta = parseOggMeta(read('BGM/CombateCintia.ogg'));
  assert.equal(meta.loopTags, true);
  assert.equal(meta.loop, null);
});

test('OGG sin etiquetas de bucle (CiudadAnil)', real, () => {
  const meta = parseOggMeta(read('BGM/CiudadAnil.ogg'));
  assert.equal(meta.loopTags, false);
  assert.equal(meta.loop, null);
  assert.ok(meta.duration > 100);
});

test('WAV de Añil (ME Item get): frecuencia y duración', real, () => {
  const meta = parseAudioMeta(read('ME/Item get.wav'));
  assert.equal(meta.format, 'wav');
  assert.equal(meta.sampleRate, 22050);
  assert.ok(Math.abs(meta.duration - 1.01) < 0.02);
  assert.equal(meta.loop, null);
});

test('datos que no son audio → null', () => {
  assert.equal(parseAudioMeta(new Uint8Array([1, 2, 3, 4, 5, 6])), null);
  assert.equal(parseWavMeta(new Uint8Array(4)), null);
  assert.throws(() => parseAudioMeta('texto'), TypeError);
});

test('loopFromComments: LOOPEND, recorte al final y valores no numéricos', () => {
  assert.deepEqual(loopFromComments({ LOOPSTART: '100', LOOPEND: '400' }), { start: 100, length: 300 });
  assert.deepEqual(loopFromComments({ LOOPSTART: '100', LOOPLENGTH: '900' }, 500), { start: 100, length: 400 });
  assert.deepEqual(loopFromComments({ LOOPSTART: '100' }, 500), { start: 100, length: 400 });
  assert.equal(loopFromComments({ LOOPSTART: 'abc', LOOPLENGTH: '10' }), null);
  assert.equal(loopFromComments({ LOOPSTART: '600', LOOPLENGTH: '10' }, 500), null);
  assert.equal(loopFromComments({}), null);
  assert.equal(hasLoopTags({ LOOPSTART: 'x' }), true);
  assert.equal(hasLoopTags(null), false);
});

// ---- Ogg sintético: paquete de comentarios repartido entre dos páginas ----

function le32(n) {
  return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
}

function page({ type = 0, granule = 0, serial = 7, seq = 0, lacing, body }) {
  const g = [...le32(granule), 0, 0, 0, 0];
  return [...Buffer.from('OggS'), 0, type, ...g, ...le32(serial), ...le32(seq), 0, 0, 0, 0, lacing.length, ...lacing, ...body];
}

function vorbisId(rate) {
  return [1, ...Buffer.from('vorbis'), ...le32(0), 2, ...le32(rate), ...le32(0), ...le32(128000), ...le32(0), 0xb8, 1];
}

function vorbisComments(entries) {
  const vendor = Buffer.from('test');
  const out = [3, ...Buffer.from('vorbis'), ...le32(vendor.length), ...vendor, ...le32(entries.length)];
  for (const e of entries) {
    const b = Buffer.from(e, 'utf8');
    out.push(...le32(b.length), ...b);
  }
  out.push(1);
  return out;
}

function syntheticOgg() {
  const padding = 'COMMENT=' + 'x'.repeat(600); // obliga a que el paquete supere 2 segmentos de 255 bytes
  const comments = vorbisComments(['loopstart=1000', 'LoopLength=2000', 'TITLE=Señal', padding]);
  const first = comments.slice(0, 510); // página 2: lacing 255,255 (el paquete continúa)
  const rest = comments.slice(510); // página 3: el resto (<255) cierra el paquete
  assert.ok(rest.length > 0 && rest.length < 255);
  const id = vorbisId(48000);
  return new Uint8Array([
    ...page({ type: 2, seq: 0, lacing: [id.length], body: id }),
    ...page({ seq: 1, lacing: [255, 255], body: first }),
    ...page({ type: 1, seq: 2, lacing: [rest.length], body: rest }),
    ...page({ type: 4, seq: 3, granule: 48000 * 3, lacing: [4], body: [0, 0, 0, 0] }),
  ]);
}

test('reensambla un paquete de comentarios que ocupa varias páginas', () => {
  const bytes = syntheticOgg();
  const { packets, serial } = readFirstPackets(bytes, 2);
  assert.equal(serial, 7);
  assert.equal(packets.length, 2);
  const tags = parseVorbisComments(packets[1]);
  assert.equal(tags.vendor, 'test');
  assert.equal(tags.comments.TITLE, 'Señal');
  const meta = parseOggMeta(bytes);
  assert.equal(meta.sampleRate, 48000);
  assert.equal(meta.duration, 3);
  assert.deepEqual([meta.loop.start, meta.loop.length], [1000, 2000]);
});

test('un Ogg truncado no rompe el parser', () => {
  const bytes = syntheticOgg().subarray(0, 120);
  const meta = parseOggMeta(bytes);
  assert.equal(meta.sampleRate, 48000);
  assert.equal(meta.loop, null);
});
