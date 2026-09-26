// Prueba de combate online en el navegador: dos Chrome (headless) en la Ruta 1, A reta a B (--mode=pvp|coop), B acepta
// y los dos pulsan A sin parar (primer movimiento) hasta que acaba. Capturas en tools/cache/netbattle_*.png.
// Uso: node tools/net_battle_smoke.mjs [--mode=pvp] [--url=http://localhost:8080]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const BASE = arg('url', 'http://localhost:8080');
const MODE = arg('mode', 'pvp');
const OUT = path.resolve('tools/cache');
const MAX_MS = 6 * 60 * 1000;
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
fs.mkdirSync(OUT, { recursive: true });

const browsers = [];
async function openPlayer(name, x) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
  page.on('pageerror', (e) => console.log(`[${name}] error:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error' || /online/.test(m.text())) console.log(`[${name}]`, m.text()); });
  await page.goto(`${BASE}/?scene=map&map=ruta_1&x=${x}&y=12&debug`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
  await page.evaluate((n) => { window.__map.state.player.name = n; }, name);
  return page;
}

const join = (page, code) => page.evaluate(async (c) => {
  const { net } = await import('/src/net/netClient.js');
  return net.join(c, { name: window.__map.state.player.name, gender: 'M' });
}, code);

try {
  const a = await openPlayer('Ana', 10);
  const b = await openPlayer('Beto', 12);
  const room = await join(a, '');
  await join(b, room);
  await a.waitForTimeout(400);
  await a.evaluate(async (mode) => {
    const { net } = await import('/src/net/netClient.js');
    const { runFieldAction } = await import('/src/world/fieldActions.js');
    const peerId = [...net.peers.keys()][0];
    window.__map.runScript((ctx) => runFieldAction(ctx, { type: 'online', op: 'battle', mode, peerId }), null, 'prueba');
  }, MODE);
  const t0 = Date.now();
  let started = false;
  let shot = false;
  for (;;) {
    await Promise.all([a.keyboard.press('Enter'), b.keyboard.press('Enter')]);
    await a.waitForTimeout(150);
    const inBattle = await Promise.all([a, b].map((p) => p.evaluate(() => Boolean(window.__map.inBattle))));
    if (inBattle.every(Boolean)) started = true;
    if (started && !shot && Date.now() - t0 > 20000) {
      await a.screenshot({ path: path.join(OUT, 'netbattle_a.png') });
      await b.screenshot({ path: path.join(OUT, 'netbattle_b.png') });
      shot = true;
    }
    if (started && inBattle.every((v) => !v)) break;
    if (Date.now() - t0 > MAX_MS) throw new Error(`sin terminar tras ${MAX_MS / 1000} s (en combate: ${inBattle})`);
  }
  console.log(`OK: combate ${MODE} completado en ${Math.round((Date.now() - t0) / 1000)} s`);
} catch (err) {
  console.log('FALLO:', err.message);
  process.exitCode = 1;
} finally {
  await Promise.all(browsers.map((br) => br.close()));
}
