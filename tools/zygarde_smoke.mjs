// Humo en navegador del sistema de campo de Zygarde (mapas dev_zygarde y dev_zygarde_fondo), con capturas y
// comprobaciones. Requiere el servidor en marcha (http://localhost:8080).
// Uso: node tools/zygarde_smoke.mjs [escenario …|all] [--url=http://localhost:8080/]
//   escenarios: montura grava embestida terreno trepar nadar buceo reconstruir volar salto pantalla rotulo
// Capturas en tools/cache/screens/zyg_<escenario>_<n>_<etiqueta>.png. Sale con código 1 si algo falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('--url=')) || '--url=http://localhost:8080/').slice(6);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find((p) => fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[error] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.stack || e.message}`));

const wait = (ms) => page.waitForTimeout(ms);
const ev = (code) => page.evaluate(code);
async function key(k, times = 1, delay = 180) {
  for (let i = 0; i < times; i++) { await page.keyboard.down(k); await wait(70); await page.keyboard.up(k); await wait(delay); }
}
async function hold(k, ms, mod = null) {
  if (mod) await page.keyboard.down(mod);
  await page.keyboard.down(k); await wait(ms); await page.keyboard.up(k);
  if (mod) await page.keyboard.up(mod);
}
async function idle(ms = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await ev('!window.__map?.runner?.busy && !window.__map?.world?.player?.busy()')) return true;
    await wait(100);
  }
  return false;
}
async function go(query, ms = 3500) { await page.goto(`${BASE}?scene=map&debug&noenc=1&${query}`, { waitUntil: 'load' }); await wait(ms); }
const place = (x, y, dir) => ev(`(() => { const p = __map.world.player; p.moveTo(${x}, ${y}); p.direction = ${dir}; __map.camera.snapToTarget(); })()`);

let scenario = '';
let shot = 0;
const results = [];
async function snap(label) {
  shot += 1;
  await page.locator('#stage').screenshot({ path: path.join(OUT, `zyg_${scenario}_${shot}_${label}.png`) });
}
function check(label, ok, detail = '') {
  results.push({ scenario, label, ok: Boolean(ok), detail });
  console.log(`${ok ? '  ok ' : '  FALLO'} ${scenario}: ${label}${detail ? ` (${detail})` : ''}`);
}

const S = {
  async montura() {
    await go('map=dev_zygarde&zygarde=all&x=10&y=26&dir=6');
    await key('KeyE'); await wait(400);
    check('montar con E', await ev('__map.world.zygMount.form === "10"'));
    await snap('montado');
    await hold('ArrowRight', 350, 'ShiftLeft');
    check('galope a 5.5', await ev('__map.world.player.moveSpeed === 5.5'));
    await wait(300);
    await key('KeyE'); await wait(400);
    check('desmontar', await ev('__map.world.zygMount.form === null && !__map.world.core.hidden'));
  },
  async grava() {
    await go('map=dev_zygarde&zygarde=all&x=18&y=14&dir=6');
    await key('KeyZ'); await wait(700);
    await key('KeyZ'); await wait(400);
    await key('KeyZ'); await wait(600);
    await idle();
    check('ofrece montar en la cuesta', await ev('__map.world.zygMount.form === "10"'));
    await hold('ArrowRight', 900); await wait(400);
    check('cruza la grava montado', await ev('__map.world.player.x > 21'));
    await snap('cruzada');
  },
  async embestida() {
    await go('map=dev_zygarde&zygarde=all&x=19&y=6&dir=6');
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(250);
    await snap('embiste');
    await idle(); await wait(300);
    check('roca rota', await ev('!__map.world.events.find((e) => e.id === "roca").page'));
    await place(19, 10, 6); await wait(300);
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(300);
    await idle();
    check('pila de troncos rota (grupo)', await ev('__map.world.events.filter((e) => e.def.group === "troncos").every((e) => !e.page)'));
  },
  async terreno() {
    await go('map=dev_zygarde&zygarde=run,ram&zform=10&x=13&y=20&dir=6');
    await hold('ArrowRight', 300); await wait(300);
    check('barro bloquea sin la capacidad', await ev('__map.world.player.x === 13'));
    await ev('__map.state.setZygardeAbility("terrain", true); __map.world.requestRefresh()');
    await wait(100);
    await hold('ArrowRight', 400); await wait(300);
    check('con Terreno se cruza y se hunde', await ev('__map.world.player.x >= 14 && __map.world.player.bushDepth >= 10'));
    await snap('barro');
  },
  async trepar() {
    await go('map=dev_zygarde&zygarde=all&zform=10&x=8&y=12&dir=8');
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(380);
    await snap('trepando');
    await idle(); await wait(300);
    check('arriba de la terraza', await ev('__map.world.player.y === 8'));
    await hold('ArrowUp', 700); await wait(1500);
    await idle();
    check('célula de arriba recogida', await ev('__map.state.hasCell("dev_zyg_celula_2")'));
    await key('KeyZ', 2, 300);
  },
  async nadar() {
    await go('map=dev_zygarde&zygarde=all&x=24&y=6&dir=6');
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(900);
    await idle();
    check('nadando sobre el 50 %', await ev('__map.world.player.surfing && __map.world.zygMount.form === "50"'));
    await snap('nadando');
    await place(30, 6, 2);
    await ev('__map.world.player.surfing = true; __map.world.player.setMovementType("surfing")');
    await wait(400);
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(2500);
    await idle();
    check('baja al fondo con la burbuja', await ev('__map.world.map.id === "dev_zygarde_fondo" && !!__map.zygarde.dive'));
    await snap('fondo');
  },
  async buceo() {
    await go('map=dev_zygarde_fondo&zygarde=all');
    await hold('ArrowRight', 1200); await wait(300);
    await ev('__map.zygarde.dive.meter.segments = 1; __map.zygarde.dive.meter.frames = 250');
    await wait(4000);
    await key('KeyZ'); await wait(1500);
    await idle();
    check('al agotarse vuelve al respiradero con la burbuja llena', await ev('__map.world.player.x === 6 && __map.world.player.y === 12 && __map.zygarde.dive.meter.segments === 8'));
    await ev('__map.zygarde.dive.meter.segments = 3');
    await place(15, 8, 6); await wait(200);
    await hold('ArrowRight', 200); await wait(700);
    await idle();
    check('el respiradero recarga y guarda el punto', await ev('__map.zygarde.dive.meter.segments === 8 && __map.zygarde.dive.vent.x === 16'));
    await place(11, 13, 6); await wait(200);
    await hold('ArrowRight', 200); await wait(1600);
    await idle();
    check('la corriente empuja', await ev('__map.world.player.x >= 16'));
    await snap('corriente');
  },
  async reconstruir() {
    await go('map=dev_zygarde&zygarde=all&x=30&y=15&dir=2');
    await key('KeyZ'); await wait(500);
    await key('KeyZ'); await wait(900);
    await snap('alzando');
    await idle(12000);
    await key('KeyZ'); await wait(400);
    await hold('ArrowDown', 1300); await wait(500);
    check('cruza a la isla', await ev('__map.world.player.y > 18'));
    await ev('__map.transfer("dev_zygarde", 30, 14, 2)'); await wait(2500);
    check('las losas persisten', await ev('__map.world.map.data(30, 17, 2) > 0 && __map.world.map.playerPassable(30, 17, 2, {})'));
  },
  async volar() {
    await go('map=dev_zygarde&zygarde=all&x=10&y=26&dir=2');
    await ev(`import('/src/world/zygarde/actions.js').then((m) => { __map.runScript((ctx) => m.flyTransition(ctx, { map: 'dev_test', x: 10, y: 21, dir: 2 })); })`);
    await wait(600);
    await snap('disgregacion');
    await wait(3000);
    await idle();
    check('llega al destino visible', await ev('__map.world.map.id === "dev_test" && __map.world.player.opacity === 255'));
  },
  async salto() {
    await go('map=dev_zygarde&zygarde=all&x=10&y=26&dir=8');
    await ev(`import('/src/world/zygarde/actions.js').then((m) => { __map.runScript((ctx) => m.convergenceJump(ctx, { to: 'dev_test', x: 10, y: 21, frames: 300 })); })`);
    await wait(2000);
    await snap('salto');
    await wait(5000);
    await idle();
    check('Salto de Convergencia llega montado en el 10 %', await ev('__map.world.map.id === "dev_test" && __map.state.flag("zyg_jump_seen") && __map.state.zygardeForm === "10"'));
  },
  async pantalla() {
    await go('map=dev_zygarde&zcells=37&zcores=2&zygarde=run,ram,terrain,climb&zform=10');
    await ev('__map.state.addKeyItem("ZYGARDECUBE")');
    await ev(`import('/src/world/fieldActions.js').then((m) => { __map.runScript((ctx) => m.useFieldItem(ctx, 'ZYGARDECUBE')); })`);
    await wait(1500);
    await snap('arca');
    await key('ArrowUp'); await wait(200);
    await key('ArrowLeft'); await wait(200);
    await key('KeyZ'); await wait(900);
    await key('KeyZ'); await wait(400);
    await key('KeyX'); await wait(1500);
    await idle();
    check('el Arca cambia a Core', await ev('__map.state.zygardeForm === "core" && __map.world.core.characterName === "zygarde_core"'));
  },
  async rotulo() {
    await go('map=ruta_1&zform=core&zcores=1&zcells=3', 900);
    await snap('rotulo');
    check('rótulo de células (sin errores)', true);
  },
};

const wanted = args.filter((a) => !a.startsWith('--'));
const list = !wanted.length || wanted.includes('all') ? Object.keys(S) : wanted;
for (const name of list) {
  if (!S[name]) { console.error(`Escenario desconocido: ${name}`); continue; }
  scenario = name;
  shot = 0;
  try {
    await S[name]();
  } catch (err) {
    check('sin excepciones', false, err.message);
  }
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas.`);
console.log(errors.length ? `Errores de consola (${errors.length}):\n${errors.slice(0, 20).join('\n')}` : 'Sin errores de consola.');
process.exitCode = failed.length || errors.length ? 1 : 0;
