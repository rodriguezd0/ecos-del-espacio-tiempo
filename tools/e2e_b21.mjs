// Recorrido E2E del Bloque 21 — Final (docs/CAMPANA.md B21; D21–D24) en navegador real (Chrome headless +
// playwright-core), con teclas reales, desde el estado de entrada p10_restored + b20_flute hasta los créditos:
//   salto     el Nodo del Origen (B20 si existe; si no, la maqueta dev_nodo_origen): aviso de no retorno, «Sí», Forma
//             10 %, cinemática del Salto de Convergencia con la escritura Unown y llegada a Columna Lanza
//   cumbre    la pregunta de Zygarde («Todavía no» y luego «Sí»), Honor Ball, menú obligatorio del Arca con el equipo
//             lleno (un «cancelar» que no vale), la Flauta, Arceus despierta; combate por fases: Poké Ball bloqueada en
//             la fase Tierra sin gastarse, transición a Fantasma, derrota forzada → «Reintentar fase», transición a Normal
//             y Master Ball al soltar la Tabla Legendaria; resolución (18 Tablillas, confirmación, eje reparado, cielo);
//             Salto de vuelta (saltado con A) al Laberinto; Olmedo, Mamá, Alerce (ALERCEKEY) y montaje de Guardianes
//   gael      la casa vacía, la nota y el huevo del inicial de Gael (gael_starter)
//   final     la tele, Vértice en el carguero, créditos sobre los lugares restaurados y el despertar en el cuarto
//   retirada  (aparte) derrota en la fase Tierra → «Retirarse»: antecámara, equipo curado y fase guardada
// Capturas en tools/cache/screens/e2e_b21_<nn>_<hito>.png y transcripción en e2e_b21_dialogos.txt.
// Uso: node tools/e2e_b21.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>] [--to=<tramo>]
//      [--node=dev|b20]
//      node tools/e2e_b21.mjs --urls   → solo imprime las URL de arranque de cada tramo (para probar a mano)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB21Helpers } from './e2e_b21_page.mjs';
import { STAGES, ORDER, FRESH, PILOT, NODE, startUrl } from './e2e_b21_stages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const BASE = arg('base', 'http://localhost:8080');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const FROM = arg('from', 'salto');
const ONLY = arg('only', '');
const TO = arg('to', 'final');
if (!ORDER.includes(FROM)) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);

function stageList() {
  if (ONLY) return [ONLY];
  const from = ORDER.indexOf(FROM);
  const to = ORDER.indexOf(TO);
  return ORDER.slice(from, (to < 0 ? ORDER.length - 1 : to) + 1);
}

/** Conductor del B16 con el estado del B21 (window.__b21) y la instalación de sus ayudantes. */
class B21Driver extends Driver {
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(),
      vars: window.__b21.vars(),
      choices: window.__b21.choiceItems(),
      zygarde: window.__b21.zygarde(),
      jumping: window.__b21.jumping(),
      cinematic: window.__b21.cinematic(),
      surfing: false,
      mirror: false,
      lost: [],
      battles: window.__b21.battles.map((b) => b.species),
    }));
  }

  async goto(url, pilot = {}) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB21Helpers(this.page, pilot);
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.eval(() => window.__b21.setup());
    await this.settle();
  }
}

/** ¿Hay Nodo del Origen de B20 (mapa registrado)? */
async function pickNode(page) {
  const wanted = arg('node', '');
  if (wanted === 'dev') return NODE.dev;
  await page.goto(`${BASE}/?scene=map&map=dev_nodo_origen&debug`, { waitUntil: 'load' });
  await page.waitForFunction(() => Boolean(window.__map?.ready), null, { timeout: 30000 });
  const has = await page.evaluate(async () => Boolean((await import('/src/content/maps/index.js')).MAPS.nucleo_origen));
  if (wanted === 'b20' && !has) throw new Error('nucleo_origen (B20) no está registrado');
  return has ? NODE.b20 : NODE.dev;
}

/** --urls: imprime las URL de arranque de cada tramo para probar a mano (sin navegador). */
function printUrls() {
  const node = arg('node', 'b20') === 'dev' ? NODE.dev : NODE.b20;
  for (const name of ORDER) console.log(`${name}\n${BASE}/?${startUrl(name, node).toString()}&tablets=15\n`);
}

async function main() {
  if (argv.includes('--urls')) { printUrls(); return; }
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const errors = [];
  const t0 = Date.now();
  let failed = null;
  let d = null;
  const transcript = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
    page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
    d = new B21Driver(page, errors, { outDir: OUT, root: ROOT, prefix: 'e2e_b21' });
    try {
      const node = await pickNode(page);
      console.log(`Nodo del Origen: ${node.map}`);
      let loaded = false;
      for (const name of stageList()) {
        if (!STAGES[name]) throw new Error(`Tramo desconocido: ${name}`);
        if (!loaded || FRESH.has(name)) {
          if (loaded) transcript.push(...(await d.log().catch(() => [])));
          await d.goto(`${BASE}/?${startUrl(name, node).toString()}&debug`, PILOT[name] || PILOT.cumbre);
          loaded = true;
        }
        console.log(`— ${name}`);
        await STAGES[name](d, { node });
      }
      const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
      if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
    } catch (err) {
      failed = err;
      await d.shot('fallo').catch(() => {});
    }
    transcript.push(...(await d.log().catch(() => [])));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'e2e_b21_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b21_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 21 completo: del Nodo del Origen a los créditos.');
  }
}

await main();
