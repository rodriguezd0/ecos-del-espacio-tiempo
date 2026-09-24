// Prueba de humo en navegador real (Chrome del sistema, headless) con capturas.
// Uso:
//   node tools/smoke.mjs [--url=http://localhost:8080/?debug] [--name=boot] [--wait=2500]
//        [--keys="Enter:600,ArrowDown*4:150,KeyZ"] [--shots=3] [--eval="expr"]
// --keys: lista separada por comas de Tecla[*repeticiones][:ms de espera tras cada pulsación]
//         Usa "hold:ArrowUp:1200" para mantener una tecla pulsada N ms.
// Guarda capturas en tools/cache/screens/<name>_<n>.png y muestra errores de consola.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
}));
const url = args.url || 'http://localhost:8080/?debug';
const name = args.name || 'smoke';
const waitMs = Number(args.wait || 2500);
const outDir = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(outDir, { recursive: true });

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.url()}`));
page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(waitMs);
let shot = 0;
const snap = async () => {
  shot += 1;
  const file = path.join(outDir, `${name}_${shot}.png`);
  await page.locator('#stage').screenshot({ path: file });
  console.log(`captura → ${file}`);
};
await snap();

if (args.keys) {
  for (const step of String(args.keys).split(',')) {
    const hold = step.match(/^hold:([^:]+):(\d+)$/);
    if (hold) {
      await page.keyboard.down(hold[1]);
      await page.waitForTimeout(Number(hold[2]));
      await page.keyboard.up(hold[1]);
      continue;
    }
    const m = step.match(/^([^*:]+)(?:\*(\d+))?(?::(\d+))?$/);
    if (!m) continue;
    const [, key, times = '1', delay = '250'] = m;
    if (key === 'snap') {
      await snap();
      continue;
    }
    if (key === 'wait') {
      await page.waitForTimeout(Number(delay));
      continue;
    }
    for (let i = 0; i < Number(times); i++) {
      await page.keyboard.down(key);
      await page.waitForTimeout(60);
      await page.keyboard.up(key);
      await page.waitForTimeout(Number(delay));
    }
  }
  await page.waitForTimeout(500);
  await snap();
}
if (args.eval) console.log('eval →', JSON.stringify(await page.evaluate(String(args.eval))));
for (let i = 1; i < Number(args.shots || 0); i++) {
  await page.waitForTimeout(700);
  await snap();
}
console.log(errors.length ? `Errores/avisos (${errors.length}):\n${errors.join('\n')}` : 'Sin errores de consola.');
await browser.close();
process.exitCode = errors.some((e) => /pageerror|\[error\]|http 4|http 5|requestfailed/.test(e)) ? 1 : 0;
