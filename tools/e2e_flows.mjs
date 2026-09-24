// Flujos de integración en navegador real (Chrome headless) con capturas y comprobaciones:
//   saveload  guardar desde el menú de pausa → recargar → Continuar desde el título restaura mapa/posición/equipo
//   keepopen  un guion con mensaje keepOpen + ctx.wait no se queda colgado (el mapa sigue vivo bajo la UI)
//   clues     Mochila → Obj. Clave → Libreta de pistas → Usar abre la libreta (acción useItem del menú)
//   repel     el repelente descuenta pasos al andar y avisa al agotarse
//   escape    Cuerda Huida desde la Mochila lleva al punto de cura
// Uso: node tools/e2e_flows.mjs [escenario …] [--base=http://localhost:8080]
// Capturas en tools/cache/screens/e2e_<escenario>_<n>.png. Sale con código 1 si algo falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

/** Utilidades de página: pulsar teclas como el jugador (mantener ~60 ms), esperar condiciones y capturar. */
function driver(page, name, errors) {
  let shot = 0;
  return {
    page,
    async press(key, times = 1, after = 250) {
      for (let i = 0; i < times; i++) {
        await page.keyboard.down(key);
        await page.waitForTimeout(70);
        await page.keyboard.up(key);
        await page.waitForTimeout(after);
      }
    },
    async hold(key, ms) {
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
    },
    async until(expr, timeout = 15000, what = expr) {
      try {
        await page.waitForFunction(expr, null, { timeout, polling: 100 });
      } catch {
        throw new Error(`Tiempo agotado esperando: ${what}\n${errors.join('\n')}`);
      }
    },
    eval: (expr) => page.evaluate(expr),
    async snap() {
      shot += 1;
      const file = path.join(OUT, `e2e_${name}_${shot}.png`);
      await page.locator('#stage').screenshot({ path: file });
      console.log(`  captura → ${path.relative(ROOT, file)}`);
    },
  };
}

const MAP_READY = 'window.__map && window.__map.ready && window.__map.engine.scenes.top === window.__map';
const topName = 'window.__map?.engine.scenes.top?.constructor?.name';

async function openMap(d, query) {
  await d.page.goto(`${BASE}/?scene=map&debug&noenc=1&${query}`, { waitUntil: 'load' });
  await d.until(MAP_READY, 20000, 'mapa listo');
  await d.page.waitForTimeout(600);
}

const SCENARIOS = {
  async saveload(d) {
    await openMap(d, 'map=dev_test&x=10&y=21');
    await d.hold('ArrowDown', 30); // girar
    await d.press('ArrowLeft', 1, 400);
    await d.hold('ArrowRight', 900); // andar unas casillas
    await d.page.waitForTimeout(500);
    const before = await d.eval('({ map: __map.world.map.id, x: __map.world.player.x, y: __map.world.player.y, party: __map.state.party.map((p) => p.species) })');
    await d.press('KeyC', 1, 900);
    await d.until(`${topName} === 'PauseMenuScene'`, 5000, 'menú de pausa');
    await d.snap();
    const idx = await d.eval("window.__map.engine.scenes.top.entries.findIndex((e) => e.key === 'save')");
    const cur = await d.eval('window.__map.engine.scenes.top.index');
    await d.press(idx > cur ? 'ArrowDown' : 'ArrowUp', Math.abs(idx - cur), 200);
    await d.press('KeyZ', 1, 1200); // Guardar
    await d.press('KeyZ', 1, 1200); // ranura 1
    await d.snap();
    await d.press('KeyZ', 1, 2500); // Sí
    await d.until(`${topName} === 'PauseMenuScene'`, 10000, 'vuelta al menú tras guardar');
    await d.press('KeyX', 1, 800);
    const saved = await d.eval("JSON.parse(localStorage.getItem('ecos.save.1') || 'null')");
    if (!saved) throw new Error('No se escribió la ranura 1');
    if (saved.player.mapId !== before.map || saved.player.x !== before.x || saved.player.y !== before.y) {
      throw new Error(`Posición guardada ${saved.player.mapId} (${saved.player.x},${saved.player.y}) ≠ ${before.map} (${before.x},${before.y})`);
    }
    if (!(saved.playTimeFrames > 0)) throw new Error('playTimeFrames no se guarda');
    // Recargar la página y Continuar desde el título
    await d.page.goto(`${BASE}/?debug`, { waitUntil: 'load' });
    await d.page.waitForTimeout(2500);
    await d.press('KeyZ', 1, 800); // Pulsa A
    await d.snap();
    await d.press('KeyZ', 1, 1500); // Continuar
    await d.press('KeyZ', 1, 1200); // ranura
    await d.press('KeyZ', 1, 800); // Cargar
    await d.until(MAP_READY, 20000, 'mapa tras Continuar');
    await d.page.waitForTimeout(1200);
    await d.snap();
    const after = await d.eval('({ map: __map.world.map.id, x: __map.world.player.x, y: __map.world.player.y, party: __map.state.party.map((p) => p.species), time: __map.state.playTimeFrames })');
    if (after.map !== before.map || after.x !== before.x || after.y !== before.y) throw new Error(`Restaurado en ${JSON.stringify(after)} y se guardó ${JSON.stringify(before)}`);
    if (after.party.join() !== before.party.join()) throw new Error('El equipo no coincide');
    if (!(after.time >= saved.playTimeFrames)) throw new Error('El tiempo de juego no se restauró');
    return `guardado en ${before.map} (${before.x},${before.y}) y restaurado; tiempo ${saved.playTimeFrames} f`;
  },

  async keepopen(d) {
    await openMap(d, 'map=dev_test&x=10&y=21');
    await d.eval(`window.__done = false; void __map.runScript(async (ctx) => {
      await ctx.say('Mensaje que se queda abierto.', { keepOpen: true });
      await ctx.wait(30);
      await ctx.move('player', ['turn_left', { wait: 10 }]);
      window.__done = true;
    }, null, 'prueba keepOpen')`);
    await d.until(`${topName} === 'MessageScene'`, 5000, 'caja de mensaje abierta');
    await d.page.waitForTimeout(300);
    await d.snap();
    await d.until('window.__done === true', 8000, 'guion con keepOpen + wait');
    await d.until(MAP_READY, 5000, 'la caja abierta se cierra al acabar el guion');
    await d.snap();
    return 'keepOpen + wait termina y la caja se cierra sola';
  },

  async clues(d) {
    await openMap(d, 'map=dev_test&x=10&y=21');
    await d.eval("__map.state.addKeyItem('CLUENOTEBOOK'); __map.state.addClue('prueba', 'Pista de prueba: texto genérico para la libreta.')");
    await d.press('KeyC', 1, 900);
    const idx = await d.eval("window.__map.engine.scenes.top.entries.findIndex((e) => e.key === 'bag')");
    const cur = await d.eval('window.__map.engine.scenes.top.index');
    await d.press(idx > cur ? 'ArrowDown' : 'ArrowUp', Math.abs(idx - cur), 200);
    await d.press('KeyZ', 1, 1200);
    await d.until(`${topName} === 'BagScene' && window.__map.engine.scenes.top.active`, 5000, 'mochila');
    for (let i = 0; i < 8; i++) {
      if (await d.eval('window.__map.engine.scenes.top.pocket === 8')) break;
      await d.press('ArrowLeft', 1, 250);
    }
    await d.snap();
    await d.press('KeyZ', 1, 700); // objeto
    await d.press('KeyZ', 1, 1500); // Usar
    await d.until(`${topName} === 'CluesScene' && window.__map.engine.scenes.top.active`, 8000, 'libreta de pistas');
    await d.snap();
    await d.press('KeyX', 1, 1200);
    await d.until(MAP_READY, 8000, 'vuelta al mapa');
    return 'Libreta de pistas abierta desde la Mochila (acción useItem)';
  },

  async repel(d) {
    await openMap(d, 'map=dev_test&x=10&y=18');
    await d.eval("__map.state.startRepel('REPEL', 2)");
    await d.hold('ArrowRight', 1100);
    await d.page.waitForTimeout(500);
    await d.until(`${topName} === 'MessageScene'`, 5000, 'aviso de fin del repelente');
    await d.page.waitForTimeout(600);
    await d.snap();
    const steps = await d.eval('__map.state.repelSteps');
    if (steps !== 0) throw new Error(`repelSteps = ${steps}`);
    await d.press('KeyZ', 2, 500);
    await d.until(MAP_READY, 5000, 'vuelta al mapa tras el aviso');
    return 'repelente agotado tras 2 pasos con aviso';
  },

  async escape(d) {
    await openMap(d, 'map=dev_test&x=10&y=21');
    await d.eval("__map.state.addKeyItem('ESCAPEROPE'); __map.state.setHealPoint('dev_test_casa', 10, 11, 8)");
    // Sin await: el guion espera a que el jugador conteste.
    await d.eval("void __map.runScript((ctx) => import('/src/world/fieldActions.js').then((m) => m.runFieldAction(ctx, { type: 'useItem', item: 'ESCAPEROPE' })), null, 'cuerda')");
    await d.page.waitForTimeout(1200);
    await d.snap();
    await d.press('KeyZ', 1, 900); // Sí
    await d.press('KeyZ', 1, 900); // mensaje
    await d.until("window.__map.world.map.id === 'dev_test_casa'", 8000, 'llegada al punto de cura');
    await d.page.waitForTimeout(800);
    await d.snap();
    return 'Cuerda Huida → dev_test_casa';
  },
};

const wanted = argv.filter((a) => !a.startsWith('--'));
const names = wanted.length ? wanted : Object.keys(SCENARIOS);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
for (const name of names) {
  const fn = SCENARIOS[name];
  if (!fn) { console.error(`Escenario desconocido: ${name}`); failed += 1; continue; }
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
  page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
  console.log(`▶ ${name}`);
  try {
    const d = driver(page, name, errors);
    const msg = await fn(d);
    if (errors.length) throw new Error(`errores de consola:\n${errors.join('\n')}`);
    console.log(`  ✔ ${msg}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✖ ${err.message}`);
    await page.locator('#stage').screenshot({ path: path.join(OUT, `e2e_${name}_fallo.png`) }).catch(() => {});
  }
  await context.close();
}
await browser.close();
console.log(failed ? `${failed} escenario(s) con fallos` : 'Todos los escenarios correctos.');
process.exitCode = failed ? 1 : 0;
