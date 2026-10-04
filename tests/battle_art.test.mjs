// Contrato de exportación del elenco de combate: escala BW, encuadre y regeneración reproducible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Img, strayPixels } from '../tools/pixel.mjs';
import { CHARACTERS } from '../tools/pixel_chars/roster.mjs';

const fronts = CHARACTERS.flatMap((c) => c.sheets.filter((s) => s.kind === 'battle_front'));
const backs = CHARACTERS.flatMap((c) => c.sheets.filter((s) => s.kind === 'battle_back'));

test('los trece retratos frontales caben completos y comparten la escala de los entrenadores de Añil', () => {
  assert.equal(fronts.length, 13);
  for (const s of fronts) {
    const img = s.build();
    const b = img.bbox();
    assert.deepEqual([img.w, img.h], [80, 80], s.id);
    assert.ok(b.h >= 58 && b.h <= 66, `${s.id}: figura de ${b.h * 2}px`);
    assert.ok(b.x >= 2 && b.y >= 2 && b.x + b.w <= 78, `${s.id}: contorno completo`);
    assert.equal(b.y + b.h, 77, `${s.id}: pies sobre la misma línea de suelo`);
    assert.deepEqual(strayPixels(img), [], `${s.id}: sin puntas sueltas tras componer la figura`);
  }
});

test('los PNG de combate se reproducen desde sus fuentes y conservan píxeles exactos de 2 por 2', () => {
  for (const s of [...fronts, ...backs]) {
    const source = s.build().scale(2);
    const file = new URL(`../game/assets/characters/${s.id}.png`, import.meta.url);
    const actual = Img.load(file);
    assert.deepEqual([actual.w, actual.h], [source.w, source.h], s.id);
    assert.ok(actual.data.every((v, i) => v === source.data[i]), `${s.id}: PNG generado`);
    for (let y = 0; y < actual.h; y += 2) for (let x = 0; x < actual.w; x += 2) {
      const c = actual.get(x, y);
      assert.deepEqual(actual.get(x + 1, y), c, s.id);
      assert.deepEqual(actual.get(x, y + 1), c, s.id);
      assert.deepEqual(actual.get(x + 1, y + 1), c, s.id);
    }
  }
});
