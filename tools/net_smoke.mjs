// Prueba del multijugador en el navegador: dos Chrome (headless) en el mismo mapa (--map, Ruta 1 por defecto), A crea una sala,
// B se une, B anda y A debe ver su avatar moverse. Guarda capturas en tools/cache/net_*.png.
// Uso: node tools/net_smoke.mjs [--url=http://localhost:8080]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const BASE = arg('url', 'http://localhost:8080');
const MAP = arg('map', 'ruta_1');
const OUT = path.resolve('tools/cache');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

fs.mkdirSync(OUT, { recursive: true });
// Un navegador por jugador: una pestaña en segundo plano no recibe requestAnimationFrame (el juego se pararía).
const launch = () => chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const browsers = [];

async function openPlayer(name, x) { // x, 12: casilla de aparición (se busca la libre más cercana)
  const browser = await launch();
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
  page.on('pageerror', (e) => console.log(`[${name}] error:`, e.message));
  await page.goto(`${BASE}/?scene=map&map=${MAP}&x=${x}&y=12&debug`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
  await page.evaluate((n) => { window.__map.state.player.name = n; }, name);
  return page;
}

const joinRoom = (page, code) => page.evaluate(async (c) => {
  const { net } = await import('/src/net/netClient.js');
  return net.join(c, { name: window.__map.state.player.name, gender: 'M' });
}, code);

const remoteOf = (page) => page.evaluate(() => (window.__map.world.remote?.list || []).map((a) => ({ name: a.name, x: a.x, y: a.y, map: a.mapId, busy: a.busy() })));

try {
  const a = await openPlayer('Ana', 10);
  const b = await openPlayer('Beto', 12);
  const room = await joinRoom(a, '');
  console.log('sala', room);
  await joinRoom(b, room);
  await a.waitForTimeout(500);
  console.log('A ve:', JSON.stringify(await remoteOf(a)));
  const before = await b.evaluate(() => ({ x: window.__map.world.player.x, y: window.__map.world.player.y }));
  await b.keyboard.down('ArrowLeft');
  await b.waitForTimeout(900);
  await b.keyboard.up('ArrowLeft');
  await b.waitForTimeout(600);
  const after = await b.evaluate(() => ({ x: window.__map.world.player.x, y: window.__map.world.player.y }));
  const seen = await remoteOf(a);
  console.log('B', JSON.stringify(before), '→', JSON.stringify(after), '· A ve:', JSON.stringify(seen));
  const ok = seen.length === 1 && seen[0].x === after.x && seen[0].y === after.y;
  const rtt = await a.evaluate(async () => (await import('/src/net/netClient.js')).net.rtt);
  console.log('ping A (ms):', rtt?.toFixed(1));
  await a.screenshot({ path: path.join(OUT, 'net_a.png') });
  await b.screenshot({ path: path.join(OUT, 'net_b.png') });
  console.log(ok ? 'OK: A ve a B donde está' : 'FALLO: posiciones distintas');
  process.exitCode = ok ? 0 : 1;
} finally {
  await Promise.all(browsers.map((br) => br.close()));
}
