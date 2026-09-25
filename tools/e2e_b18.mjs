// Recorrido E2E del Bloque 18 — Pilar de la Convergencia (P9) (docs/CAMPANA.md B18) en navegador real (Chrome headless
// + playwright-core), con teclas reales. Estado de entrada por URL (CAMPANA B18 «Entrada: Reconstrucción y Cadena Roja»;
// b17_vigilia): P1–P8, Forma Completa con Vuelo y Reconstrucción, Cadena Roja y tres Master Ball en la Mochila.
// Tramos (cada uno puede arrancar solo con su URL):
//   puente     llegada con Alerce (catalejo, relojes) · los tres zócalos del tramo central · el puente entero
//   genesis    (jugadora) Casia: una derrota simulada y la victoria · Alerce cura · Garrido · Vértice: «Él te enseñó a
//              escuchar…» antes del combate · sobrecarga · Dialga y Palkia · Gael y Vértice · cuaderno · detención
//   cruce      Cámara del Cruce: vestíbulo (primer cristal y tutorial), Caída, Río y Cruce con el plan del solucionador
//              (tras cada paso, la casilla y el eje que dicen las reglas) · llegada al núcleo
//   nucleo     verso IX · «No» en la confirmación · Dialga confirmado · derrota simulada (entrada de la Cámara, elección
//              conservada) · atajo · Dialga se debilita: P9, Fragmento 9, Cadena templada, T15 · Lustresfera
//   reaparece  despedida en el Puente · descanso en la tienda de Alerce · Dialga ha vuelto · captura (40 % de PS)
// Capturas en tools/cache/screens/e2e_b18_<nn>_<hito>.png y transcripción en e2e_b18_dialogos.txt.
// Uso: node tools/e2e_b18.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>]
//      [--to=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver18 } from './e2e_b18_driver.mjs';
import { STAGES, ORDER, FRESH, startUrl } from './e2e_b18_stages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const BASE = arg('base', 'http://localhost:8080');
const RETRY = !argv.includes('--no-retry');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const FROM = arg('from', ORDER[0]);
const ONLY = arg('only', '');
const TO = arg('to', '');
if (!ORDER.includes(FROM)) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);
if (ONLY && !ORDER.includes(ONLY)) throw new Error(`--only desconocido: ${ONLY} (${ORDER.join(', ')})`);

function stageList() {
  if (ONLY) return [ONLY];
  const from = ORDER.indexOf(FROM);
  const to = TO ? ORDER.indexOf(TO) : ORDER.length - 1;
  return ORDER.slice(from, to + 1);
}

async function main() {
  if (!CHROME) throw new Error('No se encuentra Chrome ni Edge para playwright-core');
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
    // Derrotas simuladas (una vez cada una): Casia y el primer combate contra el elegido.
    d = new Driver18(page, errors, { outDir: OUT, root: ROOT, loseOnce: RETRY ? ['b18_casia', 'p9'] : [] });
    try {
      let loaded = false;
      for (const name of stageList()) {
        if (!STAGES[name]) throw new Error(`Tramo desconocido: ${name}`);
        if (!loaded || FRESH.has(name)) {
          if (loaded) transcript.push(...(await d.log().catch(() => [])));
          await d.goto(`${BASE}/?${startUrl(name).toString()}&debug`);
          loaded = true;
        }
        console.log(`— ${name}`);
        await STAGES[name](d);
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
  fs.writeFileSync(path.join(OUT, 'e2e_b18_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b18_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 18 completo de principio a fin.');
  }
}

await main();
