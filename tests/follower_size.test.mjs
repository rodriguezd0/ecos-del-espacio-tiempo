// Tamaño en el mapa de los seguidores de Añil (render/followerSize.js): el creador vio un Onix «enorme» y un Yanma
// «bastante grande comparado con lo que mide» (25-09-2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  followerBudget, followerScale, sheetContentExtent, parseFollowerKey, FOLLOWER_MIN_PX, FOLLOWER_MAX_PX,
} from '../game/src/render/followerSize.js';

/** Hoja 4×4 de fotogramas `fw`×`fh` con un rectángulo opaco de `w`×`h` en el fotograma (r, c). */
function sheet(fw, fh, rects) {
  const width = fw * 4; const height = fh * 4;
  const data = new Uint8Array(width * height * 4);
  for (const { r, c, w, h } of rects) {
    for (let y = fh - h; y < fh; y++) for (let x = 0; x < w; x++) data[(((r * fh + y) * width) + c * fw + x) * 4 + 3] = 255;
  }
  return { data, width, height };
}

test('presupuesto proporcional a la altura, con mínimo y máximo', () => {
  assert.equal(followerBudget(0.4), FOLLOWER_MIN_PX, 'los pequeños conservan su tamaño chibi');
  assert.equal(followerBudget(1.5), 58, 'a la altura del protagonista');
  assert.equal(followerBudget(8.8), FOLLOWER_MAX_PX);
  assert.equal(followerBudget(undefined), FOLLOWER_MIN_PX);
});

test('escala: Onix a la mitad, Yanma a 3/4, el resto intacto', () => {
  assert.equal(followerScale(164, 8.8, 'ONIX'), 0.5, 'Onix: 164 px con máximo de 96');
  assert.equal(followerScale(58, 1.2, 'YANMA'), 0.75, 'Yanma: 58 px de alas con 1,2 m');
  assert.equal(followerScale(48, 0.4, 'LITTEN'), 1);
  assert.equal(followerScale(28, 0.3, 'PIDGEY'), 1);
  assert.equal(followerScale(70, 9.2, 'STEELIX'), 1);
  assert.equal(followerScale(52, 1.2, 'ABSOL'), 1, 'menos de un 10 % de exceso: tamaño real');
  assert.equal(followerScale(78, 5, 'ZYGARDE'), 1);
  assert.equal(followerScale(300, 1, 'ZYGARDE'), 1, 'Zygarde queda fuera (decisiones del autor)');
  assert.equal(followerScale(0, 1), 1);
});

test('mayor dimensión opaca entre los 16 fotogramas', () => {
  const s = sheet(64, 64, [{ r: 0, c: 0, w: 20, h: 30 }, { r: 2, c: 3, w: 58, h: 44 }]);
  assert.equal(sheetContentExtent(s.data, s.width, s.height), 58);
  const empty = sheet(64, 64, []);
  assert.equal(sheetContentExtent(empty.data, empty.width, empty.height), 0);
});

test('clave de seguidor', () => {
  assert.deepEqual(parseFollowerKey('follower:ONIX:0:1'), { species: 'ONIX', form: 0 });
  assert.deepEqual(parseFollowerKey('follower:ZYGARDE:1'), { species: 'ZYGARDE', form: 1 });
  assert.deepEqual(parseFollowerKey('follower:WOOLOO'), { species: 'WOOLOO', form: 0 });
  assert.equal(parseFollowerKey('anil:trchar000'), null);
});
