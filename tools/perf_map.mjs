// Rendimiento y fugas del overworld en Chrome headless (performance.now dentro de la página):
//   1) Mapa grande sintético (120×120, bosque, hierba, agua, 40 NPC que deambulan) o el que se indique:
//      tiempo de CPU por fotograma de lógica (engine.step) y de dibujo (scenes.render) y FPS de rAF.
//   2) Fugas: geometrías/texturas/programas de Three.js (renderer.info) tras N warps de ida y vuelta.
// Uso: node tools/perf_map.mjs [--map=<id>] [--seconds=5] [--warps=10] [--base=http://localhost:8080]
// Ojo: headless usa SwiftShader (GPU por software): los tiempos de dibujo son una cota PESIMISTA.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
}));
const BASE = args.base || 'http://localhost:8080';
const SECONDS = Number(args.seconds || 5);
const WARPS = Number(args.warps || 10);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}/?scene=map&map=dev_test&debug&noenc=1`, { waitUntil: 'load' });
await page.waitForFunction('window.__map && window.__map.ready', null, { timeout: 30000 });

// Mapa grande sintético registrado en caliente (no se escribe ningún archivo de contenido).
const mapId = args.map || 'perf_grande';
if (!args.map) {
  await page.evaluate(async () => {
    const reg = await import('/src/content/maps/index.js');
    const W = 120; const H = 120;
    const events = [];
    for (let i = 0; i < 40; i++) {
      events.push({ id: `npc${i}`, x: 10 + (i % 10) * 10, y: 12 + Math.floor(i / 10) * 24, sprite: i % 2 ? 'chica1' : 'chaval1', move: { wander: 3 }, freq: 4 });
    }
    reg.MAPS.perf_grande = async () => ({
      default: {
        id: 'perf_grande', name: 'Prueba de rendimiento', tileset: 7, width: W, height: H, outdoor: true,
        start: { x: 60, y: 60 }, events,
        build(b) {
          b.fill(null, 'cesped');
          b.rect(null, 0, 0, W, 6, 'bosque');
          b.rect(null, 0, H - 6, W, 6, 'bosque');
          b.rect(null, 0, 6, 4, H - 12, 'bosque');
          b.rect(null, W - 4, 6, 4, H - 12, 'bosque');
          for (let k = 0; k < 6; k++) b.rect(null, 10 + k * 17, 30, 10, 8, 'hierba_alta');
          const pond = [];
          for (let y = 70; y < 84; y++) for (let x = 20; x < 50; x++) pond.push([x, y]);
          b.paint('agua', pond);
          b.paint('orilla', pond);
          const road = [];
          for (let y = 58; y < 62; y++) for (let x = 4; x < W - 4; x++) road.push([x, y]);
          b.paint('camino_arena', road);
          for (let y = 90; y < 108; y += 6) for (let x = 60; x < 110; x += 5) b.stamp('arbol', x, y);
        },
      },
    });
  });
}

await page.evaluate((id) => window.__map.transfer(id, undefined, undefined, 2, { fade: false }), mapId);
await page.waitForFunction((id) => window.__map.world.map.id === id, mapId, { timeout: 30000 });
await page.waitForTimeout(1500);

const perf = await page.evaluate(async (seconds) => {
  const eng = window.__map.engine;
  const st = { upd: [], ren: [], raf: [] };
  const step = eng.step.bind(eng);
  eng.step = () => { const t = performance.now(); step(); st.upd.push(performance.now() - t); };
  const render = eng.scenes.render;
  eng.scenes.render = (r, g) => { const t = performance.now(); render(r, g); st.ren.push(performance.now() - t); };
  // El jugador camina en círculo para mover la cámara y los NPC.
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
  let k = 0;
  const walker = setInterval(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: keys[k % 4] }));
    k += 1;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: keys[k % 4] }));
  }, 700);
  let last = performance.now();
  const end = last + seconds * 1000;
  await new Promise((resolve) => {
    const tick = (now) => { st.raf.push(now - last); last = now; if (now < end) requestAnimationFrame(tick); else resolve(); };
    requestAnimationFrame(tick);
  });
  clearInterval(walker);
  window.dispatchEvent(new KeyboardEvent('keyup', { code: keys[k % 4] }));
  eng.step = step;
  eng.scenes.render = render;
  const stats = (a) => {
    const s = [...a].sort((x, y) => x - y);
    const avg = s.reduce((x, y) => x + y, 0) / (s.length || 1);
    return { n: s.length, avg: +avg.toFixed(3), p95: +(s[Math.floor(s.length * 0.95)] || 0).toFixed(3), max: +(s[s.length - 1] || 0).toFixed(3) };
  };
  return {
    update: stats(st.upd), render: stats(st.ren), fps: +(1000 / stats(st.raf).avg).toFixed(1),
    meshes: window.__map.worldView.views.get(window.__map.world.map.id)?.meshes.length,
    events: window.__map.world.events.length,
  };
}, SECONDS);

// Fugas: ida y vuelta entre dos mapas con fundido desactivado.
const leak = await page.evaluate(async (warps) => {
  const m = window.__map;
  const info = m.engine.renderer.info;
  const snap = () => ({ geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length ?? 0 });
  await m.transfer('dev_test', 10, 21, 2, { fade: false });
  await m.transfer('dev_test_casa', 10, 12, 8, { fade: false });
  await m.transfer('dev_test', 10, 21, 2, { fade: false });
  await m.weather.set('rain', 6); // precarga: las texturas cacheadas (y subidas a la GPU) la primera vez no son fugas
  await new Promise((r) => setTimeout(r, 500));
  await m.weather.set('none', 0);
  const round = async () => {
    for (let i = 0; i < warps; i++) {
      await m.transfer('dev_test_casa', 10, 12, 8, { fade: false });
      await m.weather.set(i % 2 ? 'rain' : 'none', 6);
      await new Promise((r) => setTimeout(r, 50));
      await m.transfer('dev_test', 10, 21, 2, { fade: false });
    }
    await m.weather.set('none', 0);
    await new Promise((r) => setTimeout(r, 300));
    return snap();
  };
  // Dos rondas iguales: la primera sube a la GPU lo cacheado por primera vez; la segunda no debe crecer.
  const warm = await round();
  return { before: warm, after: await round() };
}, WARPS);

await browser.close();
const report = { map: mapId, seconds: SECONDS, ...perf, leak, errors };
console.log(JSON.stringify(report, null, 2));
const leaked = leak.after.geometries - leak.before.geometries > 4 || leak.after.textures - leak.before.textures > 2;
if (leaked) console.log(`POSIBLE FUGA: ${JSON.stringify(leak)}`);
process.exitCode = errors.length || leaked ? 1 : 0;
