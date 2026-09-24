// Pruebas de la lógica pura de texto de la UI: códigos de mensaje, ajuste de línea y recorte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandText, tokenize, layoutTokens, wrapText, cropText, stringWidth, WAIT_SHORT, WAIT_LONG,
} from '../game/src/ui/core/textCodes.js';

// Fuente monoespaciada de prueba: cada carácter mide 10 px.
const mono = () => 10;

test('expandText sustituye \\PN, \\PM y \\v[]', () => {
  const env = { playerName: 'Ana', money: 1500, vars: (k) => ({ cuenta: 7 })[k] };
  assert.equal(expandText('Hola, \\PN. Tienes \\PM $ y \\v[cuenta] fichas.', env), 'Hola, Ana. Tienes 1500 $ y 7 fichas.');
  assert.equal(expandText('\\v[nada]', env), '');
  assert.equal(expandText(null, env), '');
});

test('tokenize reconoce colores, pausas, saltos y cierre', () => {
  const t = tokenize('A\\c[2]B\\c[0]\\.C\\|\\nD\\fE\\wt[5]\\wtnp[20]\\^\\se[GUI sel decision]\\bF\\c[#12AB34]');
  const types = t.map((x) => x.type);
  assert.deepEqual(types, [
    'text', 'color', 'text', 'color', 'wait', 'text', 'wait', 'newline', 'text', 'page', 'text',
    'wait', 'close', 'noWait', 'se', 'color', 'text', 'color',
  ]);
  assert.equal(t[1].color, 2);
  assert.equal(t[3].color, null);
  assert.equal(t[4].frames, WAIT_SHORT);
  assert.equal(t[6].frames, WAIT_LONG);
  assert.equal(t[11].frames, 5);
  assert.equal(t[12].frames, 20);
  assert.equal(t[14].name, 'GUI sel decision');
  assert.equal(t[15].color, 'male');
  assert.equal(t[17].color, '#12ab34');
});

test('los saltos de línea reales también cuentan', () => {
  const t = tokenize('uno\r\ndos\ntres');
  assert.deepEqual(t.map((x) => x.type), ['text', 'newline', 'text', 'newline', 'text']);
});

test('wrapText ajusta por palabras sin cortar palabras cortas', () => {
  // 10 px por carácter, 100 px → 10 caracteres por línea
  assert.deepEqual(wrapText('hola que tal estas hoy', 100, mono), ['hola que', 'tal estas', 'hoy']);
});

test('wrapText parte palabras más largas que la línea', () => {
  assert.deepEqual(wrapText('abcdefghijklmno', 100, mono), ['abcdefghij', 'klmno']);
});

test('wrapText respeta \\n y no deja espacios al inicio tras un ajuste', () => {
  assert.deepEqual(wrapText('uno\\ndos tres cuatro cinco', 100, mono), ['uno', 'dos tres', 'cuatro', 'cinco']);
});

test('layoutTokens asigna línea, x y color a cada carácter', () => {
  const { ops, lineCount, charCount } = layoutTokens(tokenize('ab \\c[2]cd'), 100, mono);
  const chars = ops.filter((o) => o.op === 'char');
  assert.equal(lineCount, 1);
  assert.equal(charCount, 5);
  assert.deepEqual(chars.map((c) => [c.ch, c.x, c.color]), [['a', 0, null], ['b', 10, null], [' ', 20, null], ['c', 30, 2], ['d', 40, 2]]);
});

test('una palabra con cambio de color en medio no se parte al ajustar', () => {
  const { ops } = layoutTokens(tokenize('aaaaaaa \\c[1]bb\\c[0]cc'), 100, mono);
  const chars = ops.filter((o) => o.op === 'char' && o.ch !== ' ');
  const lines = chars.map((c) => `${c.ch}${c.line}`).join(' ');
  assert.equal(lines, 'a0 a0 a0 a0 a0 a0 a0 b1 b1 c1 c1');
});

test('los controles quedan en su posición entre caracteres', () => {
  const { ops } = layoutTokens(tokenize('ab\\.cd'), 100, mono);
  assert.deepEqual(ops.map((o) => (o.op === 'char' ? o.ch : o.op)), ['a', 'b', 'wait', 'c', 'd']);
});

test('\\f salta al comienzo de la página siguiente y marca pageBreak', () => {
  const { ops, lineCount } = layoutTokens(tokenize('uno\\fdos'), 100, mono, { linesPerPage: 2 });
  const d = ops.find((o) => o.ch === 'd');
  assert.equal(d.line, 2);
  assert.equal(d.pageBreak, true);
  assert.equal(lineCount, 3);
});

test('cropText añade puntos suspensivos solo si no cabe', () => {
  assert.equal(cropText('corto', 100, mono), 'corto');
  assert.equal(cropText('un texto demasiado largo', 100, mono), 'un texto…');
  assert.equal(stringWidth('abc', mono), 30);
});
