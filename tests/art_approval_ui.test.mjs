import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { GameState } from '../game/src/core/state.js';
import { getCharacter, listAliases } from '../game/src/content/characters.js';
import { listAnilClasses } from '../game/src/content/anilClasses.js';

// Canvas de registro: conserva las llamadas finales de dibujo. Los glifos pasan
// por el drawText real; solo se sustituye el rasterizador de fuente del navegador.
function canvas() {
  const element = { width: 512, height: 384, glyphText: null };
  const g = { canvas: element, texts: [], images: [], font: '', fillStyle: '', textAlign: 'left', globalAlpha: 1,
    save() {}, restore() {}, fillRect() {}, strokeRect() {},
    measureText(text) { return { width: String(text).length * 6 + (this.font.includes('serif') && !this.font.includes('monospace') ? 1 : 0) }; },
    fillText(text, x, y) { element.glyphText = String(text); this.texts.push({ text: String(text), x, y, color: this.fillStyle, align: this.textAlign }); },
    drawImage(image, ...args) { this.images.push({ image, args }); },
    getImageData(_x, _y, w, h) { const data = new Uint8ClampedArray(w * h * 4); data[3] = 255; return { width: w, height: h, data }; },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData() {},
  };
  element.getContext = () => g;
  return element;
}
globalThis.location ??= { search: '' };
globalThis.document ??= { createElement(type) { assert.equal(type, 'canvas'); return canvas(); } };
const { engine } = await import('../game/src/core/engine.js');
const { default: SpriteViewerScene } = await import('../game/src/dev/spriteViewer.js');
const cardModule = await import('../game/src/ui/screens/trainerCard.js');

function header(id, { anil = false, character } = {}) {
  const scene = new SpriteViewerScene();
  scene.ids = [id]; scene.index = 0; scene.anil = anil;
  if (character) scene.entryFor = () => character;
  const g = canvas().getContext('2d'); scene.drawHeader(g);
  return g.texts.find(t => t.align === 'right');
}
function sourceImage(url) {
  if (url.startsWith('assets/characters/')) {
    const png = PNG.sync.read(fs.readFileSync(new URL('../game/' + url, import.meta.url)));
    return { url, width: png.width, height: png.height, data: png.data };
  }
  return { url, width: 512, height: 384 };
}
async function withCard(gender, run) {
  const previous = { state: engine.state, push: engine.scenes.push, tryImage: engine.assets.tryImage };
  engine.state = GameState.create({ name: 'Arte', gender });
  engine.assets.tryImage = async url => sourceImage(url);
  let scene;
  engine.scenes.push = async value => { scene = value; value.engine = engine; await value.enter(); };
  try {
    await cardModule.open();
    assert.equal(scene.character.file, getCharacter('protagonista_' + gender.toLowerCase()).file);
    await run(scene);
  } finally { engine.state = previous.state; engine.scenes.push = previous.push; engine.assets.tryImage = previous.tryImage; }
}
const glyphs = g => g.images.filter(c => c.image.glyphText).map(c => c.image.glyphText).join('');

test('visor: el frontal propio aprobado se dibuja con origen Axis, no Añil', () => {
  const tag = header('gael_front');
  assert.equal(tag.text, 'AXIS (APROBADO)');
  assert.equal(tag.color, '#B9FF66');
});
test('visor: el arte propio provisional conserva D30 y el color de aviso', () => {
  const tag = header('gael', { character: { ...getCharacter('gael'), provisional: true, approvedBy: undefined, approvedOn: undefined } });
  assert.equal(tag.text, 'PROVISIONAL D30'); assert.equal(tag.color, '#FFB060');
});
test('visor: una clase original de Añil conserva su referencia', () => {
  assert.equal(header(listAnilClasses()[0], { anil: true }).text, 'AÑIL (REFERENCIA)');
});
test('visor: un sprite propio sin metadatos de aprobación conserva su origen sin atribuir aprobación', () => {
  const ch = { ...getCharacter('gael_front'), approvedBy: undefined, approvedOn: undefined };
  assert.equal(header('gael_front', { character: ch }).text, 'AXIS');
});
test('visor: los metadatos incompletos no anuncian aprobación', () => {
  const ch = { ...getCharacter('gael_front'), approvedOn: undefined };
  assert.equal(header('gael_front', { character: ch }).text, 'AXIS');
});
test('visor: los alias aprobados conservan el origen del sprite propio', () => {
  assert.equal(listAliases().casilda_front, 'guardiana_front');
  assert.equal(header('casilda_front', { character: getCharacter('casilda_front') }).text, 'AXIS (APROBADO)');
});

for (const gender of ['M', 'F']) test('tarjeta ' + gender + ': la foto aprobada conserva recorte/escala y no dibuja marcador provisional', async () => {
  await withCard(gender, scene => {
    assert.equal(scene.character.provisional, false);
    assert.equal(scene.character.approvedBy, 'autor');
    assert.equal(scene.character.approvedOn, '2026-10-04');
    scene.phase = 'active';
    const g = canvas().getContext('2d'); scene.drawUI(g);
    const photo = g.images.find(c => c.image.url === scene.character.file);
    assert.ok(photo); assert.deepEqual(photo.args, [0, 0, 64, 64, 338, 120, 128, 128]);
    assert.ok(!glyphs(g).includes('[PROVISIONALD30]'), 'se dibujó el aviso sobre un protagonista aprobado');
  });
});
test('tarjeta: una foto provisional sigue dibujando su aviso mediante glifos reales', async () => {
  await withCard('M', scene => {
    scene.character = { ...scene.character, provisional: true, approvedBy: undefined, approvedOn: undefined };
    const g = canvas().getContext('2d'); scene.drawPhoto(g, 330, 104, 144, 144);
    assert.ok(g.images.some(c => c.image.url === scene.character.file));
    assert.ok(glyphs(g).includes('[PROVISIONALD30]'));
  });
});
test('tarjeta: sin personaje disponible no inventa una foto ni un aviso provisional', async () => {
  await withCard('F', scene => {
    scene.character = null;
    const g = canvas().getContext('2d'); scene.drawPhoto(g, 330, 104, 144, 144);
    assert.equal(g.images.length, 0);
  });
});
