// Revisión de los retratos en el visor del juego, con flechas y el ciclo real de lanzamiento.
// No carga ni modifica partidas. Capturas/result.json en tools/cache/arte-final/browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { CHARACTERS } from './pixel_chars/roster.mjs';

const out = path.resolve('tools/cache/arte-final/browser');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
const wanted = CHARACTERS.filter((c) => c.sheets.some((s) => ['battle_front', 'battle_back'].includes(s.kind))).map((c) => c.id);
const records = [];
async function press(key) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}
try {
  await page.goto('http://localhost:8080/?scene=sprites&char=protagonista_m&battle&debug');
  await page.evaluate(async () => { window.artEngine = (await import('/src/core/engine.js')).engine; });
  await page.waitForFunction(() => window.artEngine.scenes.top?.constructor.name === 'SpriteViewerScene', null, { timeout: 60000 });
  assert.deepEqual(await page.evaluate(() => window.artEngine.scenes.top.errors), []);
  for (const id of wanted) {
    for (let n = 0; await page.evaluate(() => window.artEngine.scenes.top.selectedId) !== id; n++) {
      assert.ok(n < 40, `seleccionar ${id}`);
      await press('ArrowRight');
    }
    const entry = await page.evaluate(() => {
      const s = window.artEngine.scenes.top;
      const battle = s.entryFor(s.selectedId).battle;
      const id = battle.front || battle.back;
      const image = s.images.get(id);
      return { id, width: image.width, height: image.height, battle: s.showBattle };
    });
    assert.equal(entry.battle, true);
    assert.equal(entry.height, 160);
    assert.equal(entry.width, id.startsWith('protagonista') ? 800 : 160);
    await page.waitForTimeout(id.startsWith('protagonista') ? 1200 : 160);
    await page.locator('#stage').screenshot({ path: path.join(out, `${id}.png`) });
    records.push({ character: id, ...entry });
    console.log(`${id}: retrato cargado y dibujado`);
  }
  assert.equal(records.length, 15);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ characters: records, errors }, null, 2) + '\n');
} finally { await browser.close(); }
