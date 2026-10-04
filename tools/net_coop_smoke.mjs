// Prueba en el navegador del juego en equipo: dos Chrome en la Ruta 1, forman equipo y A se enfrenta a un entrenador de
// la historia (--trainer, por defecto el primero del registro con 2+ Pokémon) con B en el mismo mapa: debe ser un combate
// doble de los dos contra él, y los dos deben ganar experiencia. Capturas en tools/cache/netcoop_*.png.
// --evolution=day|night: dos Eevee suben de nivel y evolucionan con el horario del anfitrión, aunque el invitado
// tenga otro reloj. Es un banco aislado; no forma parte de la partida continua.
// Uso: node tools/net_coop_smoke.mjs [--trainer=<id>] [--url=http://localhost:8080] [--evolution=day|night]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const BASE = arg('url', 'http://localhost:8080');
const EVOLUTION = arg('evolution', '');
if (EVOLUTION && !['day', 'night'].includes(EVOLUTION)) throw new Error('--evolution debe ser day o night');
const OUT = path.resolve('tools/cache');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const browsers = [];
const errors = [];

async function openPlayer(name, x) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 512, height: 384 } });
  page.on('pageerror', (e) => { errors.push(`[${name}] ${e.message}`); console.log(`[${name}] error:`, e.message); });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`[${name}]`, m.text()); });
  await page.goto(`${BASE}/?scene=map&map=ruta_1&x=${x}&y=12&debug`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
  await page.evaluate(async ({name: n, evolution}) => {
    const { createPokemon, expForLevel } = await import('/src/battle/core/pokemon.js');
    const { engine } = await import('/src/core/engine.js');
    const st = window.__map.state;
    st.player.name = n;
    if (evolution) {
      const pokemon = createPokemon(engine.data, 'EEVEE', 25, {moves: ['SWIFT', 'BITE', 'QUICKATTACK', 'TACKLE'], rng: () => 0.5});
      pokemon.exp = expForLevel(engine.data.species.EEVEE.growthRate, 26) - 1;
      pokemon.happiness = 255;
      st.setParty([pokemon]);
      const hostNight = evolution === 'night';
      st.data.clock.minutes = (n === 'Ana' ? (hostNight ? 22 : 12) : (hostNight ? 12 : 22)) * 60;
    } else st.setParty([createPokemon(engine.data, 'CHARMELEON', 25), createPokemon(engine.data, 'IVYSAUR', 25)]);
  }, {name, evolution: EVOLUTION});
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
  // Espera al cierre real de los dos diálogos y a que cada cliente vea al compañero en el mapa.
  // Un número fijo de Enter puede dejar al invitado ocupado y provocar el combate individual previsto.
  const readyUntil = Date.now() + 30000;
  let ready = [];
  while (Date.now() < readyUntil) {
    ready = await both((p) => p.evaluate(async () => {
      const {net} = await import('/src/net/netClient.js');
      const {team, partnerHere} = await import('/src/net/coopBattle.js');
      const scene = window.__map;
      return {free: scene.ready && !scene.world.scriptBusy() && !scene.world.player.busy(),
        partnerHere: Boolean(partnerHere(scene.world.current.id)), partner: team.partnerName,
        peerMaps: [...net.peers.values()].map(peer => peer.av?.m || null)};
    }));
    if (ready.every(s => s.free && s.partnerHere)) break;
    await both((p) => p.keyboard.press('Enter'));
    await A.waitForTimeout(200);
  }
  if (!ready.every(s => s.free && s.partnerHere)) throw new Error(`El equipo no quedó libre en el mismo mapa: ${JSON.stringify(ready)}`);
  console.log('preparados:', JSON.stringify(ready));
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
    if (started && inBattle.every((v) => !v)) {
      const busy = await both((p) => p.evaluate(() => window.__map.world.scriptBusy()));
      if (busy.every((v) => !v)) break;
    }
  }
  const after = await both(expOf);
  console.log(`entrenador ${trainer} · combate en equipo: ${started ? 'sí' : 'NO'} · experiencia A ${before[0]}→${after[0]}, B ${before[1]}→${after[1]}`);
  const evolved = await both((p) => p.evaluate(() => window.__map.state.party.map(pk => ({species: pk.species, level: pk.level}))));
  const target = EVOLUTION === 'night' ? 'UMBREON' : 'ESPEON';
  const evolutionOK = !EVOLUTION || evolved.every(p => p[0]?.species === target && p[0].level >= 26);
  if (EVOLUTION) {
    console.log('evoluciones:', JSON.stringify(evolved));
    await A.screenshot({path: path.join(OUT, `netcoop_evolution_${EVOLUTION}_a.png`)});
    await B.screenshot({path: path.join(OUT, `netcoop_evolution_${EVOLUTION}_b.png`)});
    fs.writeFileSync(path.join(OUT, `netcoop_evolution_${EVOLUTION}.json`), JSON.stringify({target, evolved, errors}, null, 2));
  }
  const ok = teamA === 'Beto' && teamB === 'Ana' && started && after[0] > before[0] && after[1] > before[1] && evolutionOK && !errors.length;
  console.log(ok ? 'OK: equipo, combate doble contra el entrenador y experiencia para los dos' : 'FALLO');
  process.exitCode = ok ? 0 : 1;
} finally {
  await Promise.all(browsers.map((br) => br.close()));
}
