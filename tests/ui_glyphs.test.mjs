// Glifos de píxeles de la UI: correcciones de Power Green Small/Narrow y escalado sin pérdidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLYPH_PATCHES, patchedGlyph, scaleMask, scaledEdge } from '../game/src/ui/core/glyphPatches.js';
import { FONTS } from '../game/src/ui/core/text.js';

const rowsOf = (m) => Array.from({ length: m.h }, (_, y) => Array.from({ length: m.w }, (_, x) => (m.bits[y * m.w + x] ? '#' : '.')).join(''));
const inkCount = (m) => m.bits.reduce((a, b) => a + b, 0);

test('todas las fuentes de píxeles se dibujan a escala entera (nítidas)', () => {
  for (const [name, f] of Object.entries(FONTS)) {
    if (!f.grid) continue;
    assert.ok(Number.isInteger(f.size / f.grid), `${name}: ${f.size}px no es múltiplo de ${f.grid}`);
    assert.ok(f.size >= f.grid, `${name}: escala menor que 1`);
  }
  assert.equal(FONTS.small.family, 'Power Green Small');
  assert.equal(FONTS.small.size / FONTS.small.grid, 2, 'small = 1 píxel de fuente por píxel de arte');
});

test('la «m» y la «w» corregidas tienen tres trazos separados y una columna de espacio', () => {
  for (const family of ['Power Green Small', 'Power Green Narrow']) {
    const m = patchedGlyph(family, 'm');
    const rows = rowsOf(m);
    assert.equal(rows[0], '####.'.slice(0, m.w));
    for (const r of rows.slice(1)) assert.equal(r, '#.#.#', `${family} m`);
    assert.ok(m.adv > m.w, `${family}: la «m» necesita espacio a la derecha`);
    const w = rowsOf(patchedGlyph(family, 'w'));
    assert.equal(w.at(-1), '.#.#.');
    assert.equal(w[0], '#.#.#');
  }
});

test('la «l» de Small no invade la letra anterior («ll» legible)', () => {
  const l = patchedGlyph('Power Green Small', 'l');
  assert.equal(l.x0, 0);
  assert.equal(l.w, 1);
  assert.equal(l.h, 7, 'misma altura que las ascendentes de Small');
  assert.equal(l.y0, -7, 'apoyada en la línea base');
  assert.ok(l.adv - l.w >= 1);
});

test('los glifos corregidos respetan la altura de la fuente', () => {
  const heights = { 'Power Green Small': { x: 5, cap: 7 }, 'Power Green Narrow': { x: 6, cap: 9 } };
  for (const [family, set] of Object.entries(GLYPH_PATCHES)) {
    for (const [ch, p] of Object.entries(set)) {
      const widths = new Set(p.rows.map((r) => r.length));
      assert.equal(widths.size, 1, `${family} «${ch}»: filas de distinto ancho`);
      assert.ok(p.adv >= p.rows[0].length + 1, `${family} «${ch}»: sin columna de espacio`);
      const h = p.rows.length;
      if ('mw'.includes(ch)) assert.equal(h, heights[family].x, `${family} «${ch}»`);
      if ('MWl'.includes(ch)) assert.equal(h, heights[family].cap, `${family} «${ch}»`);
    }
  }
  assert.equal(rowsOf(patchedGlyph('Power Green Small', '…'))[0], '#.#.#', 'tres puntos');
  assert.equal(patchedGlyph('Power Green', 'm'), null, 'Power Green se usa tal cual');
  // Rayas (no existen en las TTF): a la altura del guion de cada fuente.
  assert.equal(patchedGlyph('Power Green Small', '—').y0, -4);
  assert.equal(patchedGlyph('Power Green', '—').y0, -5);
  assert.equal(patchedGlyph('Power Green Narrow', '–').y0, -5);
});

test('scaleMask a escala entera amplía cada píxel a un cuadrado exacto', () => {
  const m = patchedGlyph('Power Green Small', 'm');
  const s = scaleMask(m, 2);
  assert.equal(s.w, m.w * 2);
  assert.equal(s.h, m.h * 2);
  assert.equal(s.y0, m.y0 * 2);
  assert.equal(s.adv, 12);
  assert.equal(inkCount(s), inkCount(m) * 4);
  assert.deepEqual(rowsOf(s).slice(2, 4), ['##..##..##', '##..##..##']);
});

test('scaleMask a escala fraccionaria no pierde ningún trazo ni hueco', () => {
  const m = patchedGlyph('Power Green Narrow', 'm');
  const s = scaleMask(m, 20 / 12);
  // Cada columna de fuente ocupa al menos un píxel y los huecos entre trazos siguen vacíos.
  for (let x = 0; x < m.w; x++) assert.ok(scaledEdge(x + 1, 20 / 12) - scaledEdge(x, 20 / 12) >= 1);
  const row = rowsOf(s).at(-1);
  assert.equal(row.split(/\.+/).filter(Boolean).length, 3, `tres trazos en «${row}»`);
  assert.ok(inkCount(s) >= inkCount(m));
  assert.throws(() => scaleMask(m, 0.5), /Escala de glifo no válida/);
});
