// Recorrido E2E del Bloque 16 — Pilar del Alma (P8) (docs/CAMPANA.md B16) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (CAMPANA B16 «Entrada: b15_n5, zyg_core_5, Nadar,
// p7_restored»): P1–P7 (F01–F07), capacidades de Zygarde hasta Buceo, N1–N5, equipo alto y sin encuentros. Tramos
// (cada uno puede arrancar solo con su URL; las células de las alas anteriores se añaden al cargar):
//   lagos     llegada · Marta y la técnica de Genesis · nadar al islote del Sentir (C095) · nadar al islote del santuario
//   saber     un glifo equivocado vuelve a su pedestal · siete glifos · C097 · puerta equivocada (olvido de Uxie) · tres
//             y cuatro puertas · Hebra del Saber
//   sentir    tres salas de espejos (reflejo invertido; capturas con emociones) · C098 · el último espejo: se controla a
//             Gael con los controles en espejo (laboratorio, explanada, aljibe) · «¿Qué le dirías?» · Hebra del Sentir
//   querer    parar en el pasillo del viento (vuelta a la repisa) · C099 · Azelf nivel 58 con la Mochila sellada: una
//             derrota real con un Magikarp débil (reintento inmediato) y la victoria · Hebra del Querer
//   telar     el hexágono se abre · C100 · ritual de tres pulsaciones (una pulsación a destiempo) · Cadena Roja · P8
//   hito      el cielo se rompe · Forma Completa (Vuelo y Reconstrucción) · el jugador alza el hueco B (tutorial) · radio
//             de los Guardianes · Genesis se marcha · el puente se cruza a pie · Marta y su Snorunt
//   vuelo     Vuelo con Zygarde a Villa Boreal (destino elegido sin abrir el mapa regional)
//   variante  jugadora sin todas las células: Zygarde sostiene a medias («Me faltan dos partes…»); con la célula 100
//             (C095) la Forma Completa llega después y se alzan los dos huecos
//   evaristo  Don Evaristo (Correos de Nexo) enseña la carta sin destino tras el P8: pista T14
// Capturas en tools/cache/screens/e2e_b16_<nn>_<hito>.png y transcripción en e2e_b16_dialogos.txt.
// Uso: node tools/e2e_b16.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>]
//      [--to=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { STAGES, ORDER, FRESH, startUrl, CELLS_BEFORE } from './e2e_b16_stages.mjs';

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
const FROM = arg('from', 'lagos');
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
    d = new Driver(page, errors, { outDir: OUT, root: ROOT, loseOnce: RETRY ? ['azelf'] : [] });
    d.retry = RETRY;
    try {
      let loaded = false;
      for (const name of stageList()) {
        if (!STAGES[name]) throw new Error(`Tramo desconocido: ${name}`);
        if (!loaded || FRESH.has(name)) {
          if (loaded) transcript.push(...(await d.log().catch(() => [])));
          await d.goto(`${BASE}/?${startUrl(name).toString()}&debug`);
          const extra = CELLS_BEFORE[name] || [];
          if (extra.length) await d.eval((keys) => window.__b16.addCells(keys), extra);
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
  fs.writeFileSync(path.join(OUT, 'e2e_b16_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b16_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 16 completo de principio a fin.');
  }
}

await main();
