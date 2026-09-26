// Prueba en el navegador de intercambio, chat y globos: dos Chrome en la Ruta 1. A (Eevee + Pikachu) propone
// intercambiar a B (Kadabra + Pikachu); los dos pulsan A sin parar (ofrecen el primero y aceptan). Al final A debe
// tener Alakazam (Kadabra evoluciona al intercambiarse) y B a Eevee. Antes, A escribe en el chat y envía un globo.
// Uso: node tools/net_trade_smoke.mjs [--url=http://localhost:8080]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const BASE = arg('url', 'http://localhost:8080');
const OUT = path.resolve('tools/cache');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const browsers = [];

async function openPlayer(name, x, species) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
  page.on('pageerror', (e) => console.log(`[${name}] error:`, e.message));
  await page.goto(`${BASE}/?scene=map&map=ruta_1&x=${x}&y=12&debug`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
  await page.evaluate(async ([n, sp]) => {
    const { createPokemon } = await import('/src/battle/core/pokemon.js');
    const { engine } = await import('/src/core/engine.js');
    const st = window.__map.state;
    st.player.name = n;
    st.setParty([createPokemon(engine.data, sp, 30), ...st.party]);
  }, [name, species]);
  return page;
}

const party = (p) => p.evaluate(() => window.__map.state.party.map((pk) => pk.species));

try {
  const a = await openPlayer('Ana', 10, 'EEVEE');
  const b = await openPlayer('Beto', 12, 'KADABRA');
  const room = await a.evaluate(async () => (await import('/src/net/netClient.js')).net.join('', { name: 'Ana', gender: 'F' }));
  await b.evaluate(async (c) => (await import('/src/net/netClient.js')).net.join(c, { name: 'Beto', gender: 'M' }), room);
  await a.waitForTimeout(500);
  await a.evaluate(() => { window.__map.net.social.sendChat('¡Hola, Beto! ¿Cambiamos?'); window.__map.net.social.sendEmote('♥'); });
  await b.waitForTimeout(400);
  const chat = await b.evaluate(() => window.__map.net.social.log.map((l) => `${l.name}: ${l.text}`));
  console.log('chat en B:', JSON.stringify(chat));
  await b.screenshot({ path: path.join(OUT, 'nettrade_chat.png') });
  await a.evaluate(async () => {
    const { net } = await import('/src/net/netClient.js');
    const { runFieldAction } = await import('/src/world/fieldActions.js');
    window.__map.runScript((ctx) => runFieldAction(ctx, { type: 'online', op: 'trade', peerId: [...net.peers.keys()][0] }), null, 'prueba');
  });
  const t0 = Date.now();
  let pa = [];
  let pb = [];
  while (Date.now() - t0 < 90000) {
    await Promise.all([a.keyboard.press('Enter'), b.keyboard.press('Enter')]);
    await a.waitForTimeout(250);
    [pa, pb] = await Promise.all([party(a), party(b)]);
    if (pa[0] === 'ALAKAZAM' && pb[0] === 'EEVEE') break;
  }
  console.log('A:', pa.join(','), '· B:', pb.join(','));
  const ok = chat.some((l) => l.includes('Cambiamos')) && pa[0] === 'ALAKAZAM' && pb[0] === 'EEVEE';
  console.log(ok ? 'OK: chat e intercambio (con evolución) funcionan' : 'FALLO');
  process.exitCode = ok ? 0 : 1;
} finally {
  await Promise.all(browsers.map((br) => br.close()));
}
