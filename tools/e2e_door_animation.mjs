// Chrome aislado: puertas por teclas reales, curación, retorno y guardar/cargar por UI.
// node tools/e2e_door_animation.mjs [--base=http://localhost:8080]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { F as B01 } from '../game/src/content/events/b01_town_common.js';
import { PARTERRE_CELL } from '../game/src/content/events/b01_town_cell.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'tools/cache');
const BASE = process.argv.find(a => a.startsWith('--base='))?.slice(7) || 'http://localhost:8080';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RUN = new Date().toISOString().replace(/[:.]/g, '-');
const PROFILE = path.join(CACHE, 'door_animation_profile');
const PHASES_ONLY = process.argv.includes('--phases-only');
const PREFIX = PHASES_ONLY ? 'door_chrome_phases_' : 'door_chrome_';
const db = Object.fromEntries(['species', 'moves'].map(id => [id, JSON.parse(fs.readFileSync(path.join(ROOT, 'game/data', id + '.json'), 'utf8'))]));
const state = GameState.create({ name: 'Puertas', gender: 'M' });
for (const flag of Object.values(B01)) state.setFlag(flag);
state.addCell(PARTERRE_CELL.id); // C001: se guarda la clave persistente, como el guion normal.
for (const flag of ['b03_caudal_llegada', 'b03_gael_b2', 'b03_gael_b2_ganado', 'b03_llamada_alerce']) state.setFlag(flag);
state.setVar('starter', 'TURTWIG'); state.setVar('gael_starter', 'LITTEN');
state.setOption('textSpeed', 3);
state.addPokemon({ ...createPokemon(db, 'TURTWIG', 10, { rng: () => 0.4 }), uid: 'door_probe_turtwig', hp: 1, status: 'BURN' });
state.setParty(state.party.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m, pp: 0 })) })));
const fixtures = [['villa_alba', 33, 27], ['ciudad_caudal', 20, 25], ['aldea_mnemos', 5, 20]].map(([map, x, y], i) => {
  const copy = new GameState(structuredClone(state.data)); copy.setPosition(map, x, y, 8);
  if (i === 2) for (const f of ['p5_restored', 'b10_llegada', 'b10_niebla_levantada']) copy.setFlag(f);
  return { slot: i + 1, data: copy.data };
});
const report = { run: RUN, profile: PROFILE, phasesOnly: PHASES_ONLY, declarations: [
  'Historia preparada solo para el ensayo visual: flags B01 concluidos y llegada/duelo/llamada de Caudal vistos; no se recorre la campaña anterior.',
  'Tres ranuras de prueba con Turtwig nivel10, 1PS, quemadura y PP agotados; C001 del parterre ya recogida. La tercera prepara P5 y llegada/niebla de Mnemos vistas para probar Íker.',
  'SaveSystem y localStorage reales en perfil propio. /__saves se intercepta para evitar leer o escribir partidas ajenas.',
  'El monitor ejecuta el render original y lee el canvas inmediatamente después; no cambia esperas, entrada a mapas, guiones ni dibujo.',
], checks: [], frames: [], screenshots: [], errors: [], intercepted: [] };
let context, page, scenario = 'start';

async function installMonitor() {
  await page.evaluate(async () => {
    const { engine } = await import('/src/core/engine.js');
    const { MessageBox } = await import('/src/ui/message/messageBox.js');
    const probe = { session: 'idle', frames: [], log: [], seen: new Set() };
    const show = MessageBox.prototype.show;
    MessageBox.prototype.show = function(text, options) { probe.log.push(String(text)); return show.call(this, text, options); };
    probe.read = () => {
      const top = engine.scenes.top, m = window.__map, p = m?.world?.player;
      return { top: top?.constructor.name, sceneReady: top?.active, titleStage: top?.stage, titleIndex: top?.menu?.index,
        slot: top?.slot, mode: top?.mode, choiceIndex: top?.win?.index,
        choiceItems: top?.constructor.name === 'ChoiceScene' ? top.items.map(i => typeof i === 'string' ? i : i.label || i.text || '') : [],
        pauseIndex: top?.index, pauseEntries: top?.entries?.map(e => e.key), lastText: probe.log.at(-1),
        ready: Boolean(m?.ready), map: m?.world?.current?.id, x: p?.x, y: p?.y, dir: p?.direction,
        busy: Boolean(m?.world?.scriptBusy()), playerBusy: Boolean(p?.busy()), transferring: Boolean(m?.transferring),
        inputEnabled: Boolean(m?.world?.inputEnabled()), lastDir: p?.lastDir,
        directionHeldFor: p ? p.time - p.lastDirTime : undefined,
        panels: m?.worldView?.fxGroup.children.filter(c => c.name === 'door-panel').length || 0,
        party: engine.state?.party.map(p => ({ uid: p.uid, hp: p.hp, status: p.status, moves: p.moves.map(m => m.pp) })) || [],
      };
    };
    const monitor = () => {
      const m = window.__map, panel = m?.doorAnimation?.panel?.group;
      if (panel && m.fx.fadeAmount === 0) {
        const key = [probe.session, m.world.current.id, panel.userData.stamp, panel.userData.progress].join('/');
        if (!probe.seen.has(key)) {
          probe.seen.add(key);
          const player = m.worldView.sprites.get(m.world.player.uid)?.mesh;
          const orders = panel.children.map(c => c.renderOrder);
          // WebGL descarta su buffer al devolver el control. Leer en esta misma
          // llamada al render y componer UI evita una imagen negra fuera de rAF.
          const capture = document.createElement('canvas');
          capture.width = engine.renderer.domElement.width; capture.height = engine.renderer.domElement.height;
          const g = capture.getContext('2d');
          g.drawImage(engine.renderer.domElement, 0, 0); g.drawImage(engine.ui.canvas, 0, 0);
          probe.frames.push({ key, session: probe.session, ...probe.read(), progress: panel.userData.progress,
            stamp: panel.userData.stamp, inputEnabled: m.world.inputEnabled(), playerOrder: player?.renderOrder,
            playerVisible: player?.visible, panelMaxOrder: Math.max(...orders),
            image: capture.toDataURL('image/png') });
        }
      }
    };
    const render = engine.scenes.render;
    engine.scenes.render = function (...args) { render.apply(this, args); monitor(); };
    window.__doorProbe = probe;
  });
}
const snap = () => page.evaluate(() => window.__doorProbe.read());
const wait = ms => page.waitForTimeout(ms);
async function press(key, after = 120, hold = 60) {
  await page.keyboard.down(key); await wait(hold); await page.keyboard.up(key); await wait(after);
}
// Player distingue un giro breve de un paso. Soltar al ver el paso/contacto evita
// depender de la velocidad del navegador y no permite un segundo movimiento.
async function move(key) {
  const before = await snap();
  await page.keyboard.down(key);
  try {
    await until(s => s.map !== before.map || s.top !== before.top || s.x !== before.x || s.y !== before.y
      || s.busy || s.transferring, 'paso/contacto ' + key, 10000);
  } finally { await page.keyboard.up(key); }
}
async function until(fn, what, timeout = 30000) {
  const end = Date.now() + timeout; let s;
  while (Date.now() < end) { s = await snap(); if (fn(s)) return s; await wait(60); }
  throw new Error('Timeout ' + what + ': ' + JSON.stringify(s));
}
async function free(map, x, y) { return until(s => s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy && s.map === map && s.x === x && s.y === y, map + ' ' + x + ',' + y, 45000); }
async function shot(name) {
  const file = path.join(CACHE, PREFIX + name + '.png'); await page.locator('#stage').screenshot({ path: file }); report.screenshots.push(file);
}
function check(name, data = {}) { report.checks.push({ name, scenario, ...data }); console.log('PASS: ' + name); }
async function label(name) { scenario = name; await page.evaluate(s => { window.__doorProbe.session = s; }, name); }
async function drainFrames() {
  const frames = await page.evaluate(() => window.__doorProbe.frames.splice(0));
  for (const [i, frame] of frames.entries()) {
    const image = frame.image; delete frame.image;
    const file = path.join(CACHE, PREFIX + frame.session + '_phase' + String(i).padStart(2, '0') + '.png');
    if (image) {
      const buffer = Buffer.from(image.split(',')[1], 'base64');
      const png = PNG.sync.read(buffer);
      let visiblePixels = 0;
      for (let at = 0; at < png.data.length; at += 4) if (png.data[at] || png.data[at + 1] || png.data[at + 2]) visiblePixels++;
      assert.ok(visiblePixels > png.width * png.height * 0.3, 'captura de fase negra: ' + frame.key);
      fs.writeFileSync(file, buffer); frame.file = file; frame.visiblePixels = visiblePixels;
    }
    report.frames.push(frame);
  }
}
async function loadSlot(slot) {
  await page.goto(BASE + '/?debug=1', { waitUntil: 'load' }); await installMonitor();
  await until(s => s.top === 'TitleScene', 'título'); await wait(450); await press('KeyZ');
  await until(s => s.top === 'TitleScene' && s.titleStage === 'menu', 'menú título');
  let s = await snap(); for (let n = s.titleIndex; n > 0; n--) await press('ArrowUp');
  await press('KeyZ'); s = await until(s => s.top === 'SaveLoadScene' && s.mode === 'load' && s.sceneReady, 'cargar ranura');
  while (s.slot !== slot) { await press('ArrowRight'); s = await snap(); }
  await press('KeyZ'); await until(s => s.top === 'ChoiceScene' && s.choiceItems[0] === 'Cargar', 'acción cargar');
  await press('KeyZ', 30); check('Ranura ' + slot + ' cargada por el título');
}
async function transition(name, key, map, x, y) {
  await label(name); await move(key); const s = await free(map, x, y); await drainFrames();
  assert.equal(s.panels, 0); assert.equal(s.transferring, false);
  const frames = report.frames.filter(f => f.session === name);
  assert.ok(frames.length >= 3, name + ': estados de animación reales');
  assert.ok(frames.some(f => f.progress === 1));
  assert.ok(frames.every(f => f.busy && f.transferring && !f.inputEnabled && f.panels === 1));
  assert.ok(frames.every(f => f.playerVisible && f.panelMaxOrder < f.playerOrder), 'el personaje queda delante del panel');
  await shot(name + '_fin'); check(name + ': destino/retorno real y panel retirado', { map, x, y, phases: frames.map(f => f.progress) });
}
async function saveNormal(slot) {
  await press('KeyC'); await until(s => s.top === 'PauseMenuScene' && s.pauseEntries?.length, 'pausa');
  let s = await snap(), target = s.pauseEntries.indexOf('save'); assert.ok(target >= 0);
  while (s.pauseIndex !== target) { await press('ArrowDown'); s = await snap(); }
  await press('KeyZ'); s = await until(s => s.top === 'SaveLoadScene' && s.mode === 'save' && s.sceneReady, 'guardar');
  while (s.slot !== slot) { await press('ArrowRight'); s = await snap(); }
  await press('KeyZ');
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    s = await snap();
    if (s.top === 'ChoiceScene' || s.top === 'MessageScene') { await press('KeyZ'); continue; }
    if (s.top === 'PauseMenuScene') { await press('KeyX'); break; }
    await wait(90);
  }
  await free('ciudad_caudal', 20, 25);
  const saved = await page.evaluate(async slot => { const { SaveSystem } = await import('/src/core/state.js'); return SaveSystem.load(slot).data; }, slot);
  assert.deepEqual([saved.player.mapId, saved.player.x, saved.player.y, saved.player.dir], ['ciudad_caudal', 20, 25, 2]);
  assert.equal(JSON.stringify(saved).includes('doorAnimation'), false);
  check('Guardar por pausa conserva posición y no persiste recursos de dibujo');
}

try {
  context = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME,
    viewport: { width: 1024, height: 768 }, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  await context.route('**/__saves**', route => {
    const method = route.request().method(), pathname = new URL(route.request().url()).pathname;
    report.intercepted.push({ method, pathname });
    return route.fulfill(method === 'GET' ? { status: 200, contentType: 'application/json', body: pathname === '/__saves' ? '[]' : '{}' } : { status: 204 });
  });
  page = context.pages()[0] || await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) report.errors.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE + '/?debug=1', { waitUntil: 'load' }); await installMonitor();
  await until(s => s.top === 'TitleScene', 'título inicial');
  await page.evaluate(async rows => { const { SaveSystem, GameState } = await import('/src/core/state.js'); for (const row of rows) SaveSystem.save(row.slot, new GameState(row.data)); }, fixtures);
  fs.writeFileSync(path.join(CACHE, 'door_chrome_fixtures.json'), JSON.stringify({ declarations: report.declarations, fixtures }, null, 2));
  await loadSlot(1); await free('villa_alba', 33, 27); await shot('alba_cerrada');
  await transition('alba_entrada', 'ArrowUp', 'casa_vecinos_se', 6, 9);
  await transition('alba_salida', 'ArrowDown', 'villa_alba', 33, 27);
  if (!PHASES_ONLY) {
    await transition('alba_segunda_entrada', 'ArrowUp', 'casa_vecinos_se', 6, 9);
    await transition('alba_segunda_salida', 'ArrowDown', 'villa_alba', 33, 27);
  }
  await loadSlot(2); await free('ciudad_caudal', 20, 25); await shot('caudal_cerrada');
  await transition('caudal_entrada', 'ArrowUp', 'caudal_centro', 9, 12);
  if (!PHASES_ONLY) {
  for (let y = 11; y >= 7; y--) { await move('ArrowUp'); await free('caudal_centro', 9, y); }
  await press('KeyZ'); await until(s => s.top === 'MessageScene', 'enfermera');
  const end = Date.now() + 45000;
  while (Date.now() < end) { const s = await snap(); if (s.top === 'MapScene' && !s.busy) break; if (['MessageScene', 'ChoiceScene'].includes(s.top)) await press('KeyZ', 80); else await wait(70); }
  let s = await free('caudal_centro', 9, 7);
  assert.ok(s.party[0].hp > 1 && !s.party[0].status && s.party[0].moves.every(pp => pp > 0));
  check('El Centro cura PS, quemadura y PP por diálogo normal'); await shot('caudal_curacion');
  for (let y = 8; y <= 12; y++) { await move('ArrowDown'); await free('caudal_centro', 9, y); }
  }
  await transition('caudal_salida', 'ArrowDown', 'ciudad_caudal', 20, 25);
  if (!PHASES_ONLY) {
  await saveNormal(2); await shot('caudal_guardada');
  await loadSlot(2); const s = await free('ciudad_caudal', 20, 25); await wait(600);
  assert.equal((await snap()).panels, 0); assert.ok(s.party[0].hp > 1);
  check('Recarga normal: misma posición, equipo curado y puerta cerrada sin capa temporal'); await shot('caudal_recarga');
  }
  await loadSlot(3); await free('aldea_mnemos', 5, 20); await shot('iker_cerrada');
  await transition('iker_entrada', 'ArrowUp', 'mnemos_casa_iker', 7, 10);
  await transition('iker_salida', 'ArrowDown', 'aldea_mnemos', 5, 20);
  const ret = await page.evaluate(async () => { const { engine } = await import('/src/core/engine.js'); return engine.state.var('b11_t09_regreso'); });
  assert.equal(ret, 'aldea_mnemos|5|20|2'); check('Íker conserva RETURN_VAR y su recorrido por guion');
  assert.equal(report.errors.length, 0, 'cero errores del navegador'); report.success = true;
} catch (error) {
  report.success = false; report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
  console.error(error);
  if (page && !page.isClosed()) { try { report.last = await snap(); await drainFrames(); await shot('fallo'); } catch {} }
} finally {
  fs.writeFileSync(path.join(CACHE, PREFIX + 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await context?.close();
}
