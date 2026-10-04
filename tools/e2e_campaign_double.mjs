// Escena real de dobles para medir contornos y guardar comparativa. Este banco aislado no forma parte de la campaña.
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const stage = 'after';
const party = process.argv.find(a => a.startsWith('--party='))?.slice(8) || 'CHARMELEON,CHARMELEON';
const suffix = process.argv.find(a => a.startsWith('--name='))?.slice(7) || stage;
const coop = process.argv.includes('--coop');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
async function tap(p, key = 'Enter') { await p.keyboard.down(key); await p.waitForTimeout(70); await p.keyboard.up(key); }
const browser = await chromium.launch({ executablePath: chrome, headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let guest = null;
  if (coop) {
    guest = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
    guest.on('pageerror', e => errors.push(e.message));
    for (const [p, x, name, species] of [[page, 10, 'QADobleA', 'WAILORD'], [guest, 12, 'QADobleB', 'LITTEN']]) {
      await p.goto(`http://localhost:8080/?scene=map&map=ruta_1&x=${x}&y=12&debug`);
      await p.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
      await p.evaluate(async ({ name, species }) => {
        const { createPokemon } = await import('/src/battle/core/pokemon.js'), { engine } = await import('/src/core/engine.js');
        window.__doubleEngine = engine; window.__map.state.player.name = name;
        window.__map.state.setParty([createPokemon(engine.data, species, 25, { moves: ['EMBER', 'TACKLE'] })]);
      }, { name, species });
    }
    console.log('coop: jugadores preparados');
    const room = await page.evaluate(async () => (await import('/src/net/netClient.js')).net.join('', { name: 'QADobleA', gender: 'M' }));
    await guest.evaluate(async room => (await import('/src/net/netClient.js')).net.join(room, { name: 'QADobleB', gender: 'F' }), room);
    await page.waitForTimeout(600);
    console.log(await page.evaluate(async () => ({ peers: [...(await import('/src/net/netClient.js')).net.peers.keys()],
      me: (await import('/src/net/netClient.js')).net.id })));
    await page.evaluate(async () => {
      const { net } = await import('/src/net/netClient.js'), { runFieldAction } = await import('/src/world/fieldActions.js');
      window.__map.runScript(ctx => runFieldAction(ctx, { type: 'online', op: 'team', peerId: [...net.peers.keys()][0] }), null, 'equipo');
    });
    for (let i = 0; i < 80; i++) {
      for (const p of [page, guest]) {
        await p.bringToFront();
        const choice = await p.evaluate(() => window.__doubleEngine.scenes.top.constructor.name === 'ChoiceScene'
          ? window.__doubleEngine.scenes.top.win.index : -1);
        if (choice > 0) await tap(p, 'ArrowUp');
        await tap(p);
      }
      await page.waitForTimeout(250);
      const names = await Promise.all([page, guest].map(p => p.evaluate(async () => (await import('/src/net/coopBattle.js')).team.partnerName)));
      if (names.every(Boolean)) break;
    }
    for (let i = 0; i < 30; i++) {
      await Promise.all([page, guest].map(p => tap(p))); await page.waitForTimeout(150);
      const calm = await Promise.all([page, guest].map(p => p.evaluate(() =>
        window.__doubleEngine.scenes.top.constructor.name === 'MapScene' && !window.__map.world.scriptBusy())));
      if (calm.every(Boolean)) break;
    }
    console.log('coop: invitación atendida');
    console.log(await page.evaluate(async () => ({ team: (await import('/src/net/coopBattle.js')).team.partnerName,
      top: window.__doubleEngine.scenes.top.constructor.name })));
    await page.evaluate(async () => {
      const { TRAINERS } = await import('/src/content/trainers/index.js');
      const trainer = Object.keys(TRAINERS).find(id => TRAINERS[id].party?.length >= 2 && TRAINERS[id].party[0].level >= 35);
      window.__map.runScript(ctx => ctx.battle({ type: 'trainer', trainer }), null, 'doble visual');
    });
  } else await page.goto(`http://localhost:8080/?scene=battle&double=1&party=${party}&foe=SNORLAX,SNORLAX&lv=40&plv=25&pmoves=EMBER,TACKLE&seed=100`);
  await page.evaluate(async () => { window.__doubleEngine = (await import('/src/core/engine.js')).engine; });
  await page.waitForFunction(() => {
    const s = window.__doubleEngine.scenes.top;
    return s?.constructor.name === 'BattleScene' && s.battlers?.[0]?.visible && s.battlers?.[0]?.atlas
      && s.battlers?.[2]?.visible && s.battlers?.[2]?.atlas && s.command?.active;
  }, null, { timeout: 60000 });
  await page.locator('#stage').screenshot({ path: `tools/cache/screens/e2e_campaign_double_${suffix}.png` });
  if (guest) await guest.locator('#stage').screenshot({ path: `tools/cache/screens/e2e_campaign_double_${suffix}_guest.png` });
  const boxes = await page.evaluate(async () => {
    const { engine } = await import('/src/core/engine.js'); const s = engine.scenes.top;
    return [0, 2].map(i => { const b = s.battlers[i], a = b.anchor, image = b.atlas.tex.image;
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const g = canvas.getContext('2d'); g.drawImage(image, 0, 0); const d = g.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (let y = 0; y < b.atlas.fh; y++) for (let x = 0; x < b.atlas.fw; x++) if (d[(y * canvas.width + x) * 4 + 3] > 8) {
        const px = a.x + (x - b.atlas.fw / 2) * b.scale, py = a.y - (b.atlas.fh - y) * b.scale;
        left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
      }
      return { index: i, species: b.view.species, left, right, top, bottom, scale: b.scale, anchor: a,
        mesh: { x: b.mesh.position.x, y: b.mesh.position.y, w: b.mesh.scale.x, h: b.mesh.scale.y } };
    });
  });
  fs.writeFileSync(`tools/cache/screens/e2e_campaign_double_${suffix}.json`, JSON.stringify(boxes, null, 2));
  if (stage === 'after' && boxes[0].right + 8 > boxes[1].left) throw new Error(`Solape real: ${JSON.stringify(boxes)}`);
  let sawFx = false, finished = false;
  const players = guest ? [page, guest] : [page];
  await Promise.all(players.map(p => p.evaluate(() => {
    const s = window.__doubleEngine.scenes.top, ui = s.battle.ui, original = ui.animateMove.bind(ui);
    window.__doubleMoves = { count: 0, active: false };
    ui.animateMove = async (...args) => {
      window.__doubleMoves.count++; window.__doubleMoves.active = true;
      try { return await original(...args); } finally { window.__doubleMoves.active = false; }
    };
  })));
  const end = Date.now() + 90000;
  while (Date.now() < end) {
    await Promise.all(players.map(p => tap(p))); await page.waitForTimeout(150);
    const s = await page.evaluate(() => ({ ...window.__doubleMoves, turn: window.__doubleEngine.scenes.top.battle?.turnCount,
      command: window.__doubleEngine.scenes.top.command?.active }));
    if (!sawFx && s.active) {
      await page.locator('#stage').screenshot({ path: `tools/cache/screens/e2e_campaign_double_${suffix}_efecto.png` }); sawFx = true;
    }
    if (s.count > 0 && s.turn >= 1 && s.command) { finished = true; break; }
  }
  if (!finished || !sawFx) throw new Error(`No se observó un turno real con animación: ${suffix}`);
  await page.locator('#stage').screenshot({ path: `tools/cache/screens/e2e_campaign_double_${suffix}_tras_turno.png` });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ suffix, boxes, sawFx, finished }));
} finally { await browser.close(); }
