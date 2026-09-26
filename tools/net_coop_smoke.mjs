// Prueba en el navegador del juego en equipo: dos Chrome en la Ruta 1, forman equipo y A se enfrenta a un entrenador de
// la historia (--trainer, por defecto el primero del registro con 2+ Pokémon) con B en el mismo mapa: debe ser un combate
// doble de los dos contra él, y los dos deben ganar experiencia. Capturas en tools/cache/netcoop_*.png.
// Uso: node tools/net_coop_smoke.mjs [--trainer=<id>] [--url=http://localhost:8080]
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

async function openPlayer(name, x) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
  page.on('pageerror', (e) => console.log(`[${name}] error:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[${name}]`, m.text()); });
  await page.goto(`${BASE}/?scene=map&map=ruta_1&x=${x}&y=12&debug`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
  await page.evaluate(async (n) => {
    const { createPokemon } = await import('/src/battle/core/pokemon.js');
    const { engine } = await import('/src/core/engine.js');
    const st = window.__map.state;
    st.player.name = n;
    st.setParty([createPokemon(engine.data, 'CHARMELEON', 25), createPokemon(engine.data, 'IVYSAUR', 25)]);
  }, name);
  return page;
}

const expOf = (p) => p.evaluate(() => window.__map.state.party.reduce((a, pk) => a + pk.exp, 0));
const both = (fn) => Promise.all([A, B].map(fn));
let A;
let B;

try {
  A = await openPlayer('Ana', 10);
  B = await openPlayer('Beto', 12);
  const room = await A.evaluate(async () => (await import('/src/net/netClient.js')).net.join('', { name: 'Ana', gender: 'F' }));
  await B.evaluate(async (c) => (await import('/src/net/netClient.js')).net.join(c, { name: 'Beto', gender: 'M' }), room);
  await A.waitForTimeout(600);
  await A.evaluate(async () => {
    const { net } = await import('/src/net/netClient.js');
    const { runFieldAction } = await import('/src/world/fieldActions.js');
    window.__map.runScript((ctx) => runFieldAction(ctx, { type: 'online', op: 'team', peerId: [...net.peers.keys()][0] }), null, 'equipo');
  });
  for (let i = 0; i < 12; i++) { await both((p) => p.keyboard.press('Enter')); await A.waitForTimeout(250); }
  const teamA = await A.evaluate(async () => (await import('/src/net/coopBattle.js')).team.partnerName);
  const teamB = await B.evaluate(async () => (await import('/src/net/coopBattle.js')).team.partnerName);
  console.log('equipo:', teamA, '/', teamB);
  const trainer = await A.evaluate(async (wanted) => {
    const { TRAINERS } = await import('/src/content/trainers/index.js');
    return wanted || Object.keys(TRAINERS).find((id) => (TRAINERS[id].party || []).length >= 2);
  }, arg('trainer', ''));
  const before = await both(expOf);
  await A.evaluate((id) => { window.__map.runScript((ctx) => ctx.battle({ type: 'trainer', trainer: id }), null, 'reto'); }, trainer);
  const t0 = Date.now();
  let started = false;
  let shot = false;
  while (Date.now() - t0 < 5 * 60 * 1000) {
    await both((p) => p.keyboard.press('Enter'));
    await A.waitForTimeout(200);
    const inBattle = await both((p) => p.evaluate(() => Boolean(window.__map.inBattle)));
    if (inBattle.every(Boolean)) started = true;
    if (started && !shot && Date.now() - t0 > 15000) {
      await A.screenshot({ path: path.join(OUT, 'netcoop_a.png') });
      await B.screenshot({ path: path.join(OUT, 'netcoop_b.png') });
      shot = true;
    }
    if (started && inBattle.every((v) => !v)) break;
  }
  const after = await both(expOf);
  console.log(`entrenador ${trainer} · combate en equipo: ${started ? 'sí' : 'NO'} · experiencia A ${before[0]}→${after[0]}, B ${before[1]}→${after[1]}`);
  const ok = teamA === 'Beto' && teamB === 'Ana' && started && after[0] > before[0] && after[1] > before[1];
  console.log(ok ? 'OK: equipo, combate doble contra el entrenador y experiencia para los dos' : 'FALLO');
  process.exitCode = ok ? 0 : 1;
} finally {
  await Promise.all(browsers.map((br) => br.close()));
}
