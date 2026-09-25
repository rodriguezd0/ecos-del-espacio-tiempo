// Selector de archivo (ui/core/filePicker.js): se resuelve con el archivo, con null al cancelar (evento `cancel`) y con
// null si el diálogo se cierra sin elegir nada (vuelta del foco) — antes el menú de carga quedaba bloqueado 2 minutos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickFile } from '../game/src/ui/core/filePicker.js';

function fakeDom() {
  let input = null;
  const doc = {
    createElement() {
      input = new EventTarget();
      input.files = null;
      input.style = {};
      input.click = () => {};
      input.remove = () => { input.removed = true; };
      return input;
    },
    body: { appendChild() {} },
  };
  const win = new EventTarget();
  return { doc, win, get input() { return input; } };
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

test('con archivo: se resuelve con él al llegar `change`', async () => {
  const dom = fakeDom();
  const p = pickFile({ doc: dom.doc, win: dom.win });
  dom.input.files = [{ name: 'partida.json' }];
  dom.input.dispatchEvent(new Event('change'));
  assert.deepEqual(await p, { name: 'partida.json' });
  assert.equal(dom.input.removed, true);
});

test('cancelar (evento `cancel`): se resuelve con null al momento', async () => {
  const dom = fakeDom();
  const p = pickFile({ doc: dom.doc, win: dom.win });
  dom.input.dispatchEvent(new Event('cancel'));
  assert.equal(await p, null);
});

test('navegador sin `cancel`: al volver el foco sin archivo se resuelve con null', async () => {
  const dom = fakeDom();
  const p = pickFile({ doc: dom.doc, win: dom.win, graceMs: 10 });
  await tick();
  dom.win.dispatchEvent(new Event('focus'));
  assert.equal(await p, null);
});

test('el foco vuelve y el archivo llega justo después: gana el archivo', async () => {
  const dom = fakeDom();
  const p = pickFile({ doc: dom.doc, win: dom.win, graceMs: 30 });
  await tick();
  dom.win.dispatchEvent(new Event('focus'));
  dom.input.files = [{ name: 'tarde.json' }];
  dom.input.dispatchEvent(new Event('change'));
  assert.deepEqual(await p, { name: 'tarde.json' });
});
