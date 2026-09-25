// Recorrido E2E del Bloque 17 — Interludio 8: Axis en eclipse (docs/CAMPANA.md B17) en navegador real (Chrome headless
// + playwright-core), con teclas reales. Estado de entrada por URL (CAMPANA B17 «Entrada: Vuelo»; p8_restored y
// zyg_complete, crisis en fase 3): P1–P8, Forma Completa con Vuelo y Reconstrucción, pista T14 abierta por B16.
// Tramos (cada uno puede arrancar solo con su URL):
//   t14      Don Evaristo confía la carta; acertijo del sobre (Brontia, las salinas, la Meseta); la Mesa en el Vuelo
//   mesa     llegada a la Mesa (Brisa desconfía) · Altaria del prado · del Alto (Trepar) · de la Aguja (Reconstrucción)
//            · confianza y curación · Aurora lee la carta · vuelo a Nexo · reencuentro: Tabla Cielo y Staraptorita
//   mirador  Mirador Sur ocupado: el Resonador y la Cadena Sintética, las torres del Anillo, nota y mensaje de Alerce
//   temblor  Torre del Temblor (Mirador Sur): puzzle de las piedras sin apoyo, combate doble de técnicos, consola
//   viento   Torre del Viento (Senda del Mirador): lo mismo en el espolón del oeste
//   vigilia  Esclusa mayor de Caudal: cae la noche, radio de los Guardianes, «Van a intentarlo por la fuerza.»
//   senda    salida: se reconstruye el tramo derrumbado y se baja por el tablero hasta el Puente de B18
//   circulo  Mamá y los Clefairy; la primera danza; un error (las piedras se hunden); las seis piedras en orden; el
//            anciano y Mamá; tres Piedras Lunares
// Capturas en tools/cache/screens/e2e_b17_<nn>_<hito>.png y transcripción en e2e_b17_dialogos.txt.
// Uso: node tools/e2e_b17.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>] [--to=<tramo>]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { STAGES, ORDER, FRESH, startUrl } from './e2e_b17_stages.mjs';

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
    d = new Driver(page, errors, { outDir: OUT, root: ROOT, prefix: 'e2e_b17' });
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
  fs.writeFileSync(path.join(OUT, 'e2e_b17_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b17_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 17 completo de principio a fin.');
  }
}

await main();
