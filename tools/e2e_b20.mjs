// Recorrido E2E del Bloque 20 — Pilar del Origen (P10) (docs/CAMPANA.md B20) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (CAMPANA B20 «Entrada: 9 Fragmentos, 15 Tablillas y Forma
// Completa»; se empieza con 14 Tablillas para oír a la puerta decir cuál falta). Tramos (cada uno puede arrancar solo con
// su URL):
//   puerta   llegada · la puerta nombra la Tablilla que falta (y la Libreta la anota) · quince nichos · losa · Reconstrucción
//   t1…t9    los nueve tramos de la Senda del Origen (grava y piedras · estanque y compuerta · veleta y roca · manantial,
//            barro y placa · losa de recuerdo, caída y Trepar · aristas y Ancla · manantial, Buceo, caracola y reja ·
//            tres voces: espejo, viento y puertas (una equivocada) · pliegue, cascada detenida, Reconstrucción y verso X)
//   cielo    Tornadus · manantial · Thundurus (una derrota simulada: reintento) · manantial · Landorus · la pregunta ·
//            «Yo respondo por él» · el Trío se retira · arco a la Terraza
//   terraza  Gael cura · B6 (una derrota simulada: vuelve a curar) · verso X, «Yo pedí permiso», línea de Mesprit, Zygarde
//   nucleo   Fragmento 10 · Flauta Azur · profecía entera · falsa calma (fase 4)
// Capturas en tools/cache/screens/e2e_b20_<nn>_<hito>.png y transcripción en e2e_b20_dialogos.txt.
// Uso: node tools/e2e_b20.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>] [--to=<tramo>]
//      [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b20_driver.mjs';
import { STAGES, ORDER, startUrl, ENTRY_KEY_ITEMS } from './e2e_b20_stages.mjs';

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
const FROM = arg('from', 'puerta');
const ONLY = arg('only', '');
const TO = arg('to', '');
if (!ORDER.includes(FROM)) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);

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
    d = new Driver(page, errors, { outDir: OUT, root: ROOT, loseOnce: RETRY ? ['thundurus', 'b20_gael_b6'] : [] });
    d.retry = RETRY;
    try {
      let loaded = false;
      for (const name of stageList()) {
        if (!STAGES[name]) throw new Error(`Tramo desconocido: ${name}`);
        if (!loaded) {
          await d.goto(`${BASE}/?${startUrl(name).toString()}&debug`);
          await d.eval((ids) => { for (const id of ids) window.__e2e.engine.state.addKeyItem(id); }, ENTRY_KEY_ITEMS);
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
  fs.writeFileSync(path.join(OUT, 'e2e_b20_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b20_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 20 completo de principio a fin.');
  }
}

await main();
