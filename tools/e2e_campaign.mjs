// Partida continua: título → créditos → despertar. Solo controles y decisiones; nunca fixtures de progreso.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { installCampaignHelpers } from './e2e_campaign_page.mjs';
import { CampaignDriver } from './e2e_campaign_driver.mjs';

const dir = path.resolve('tools/cache/campaign');
fs.mkdirSync(dir, { recursive: true });
const resume = process.argv.includes('--resume');
const storage = path.join(dir, 'campaign_browser_storage.json');
const nameFile = path.join(dir, 'campaign_identity.json');
const name = resume ? JSON.parse(fs.readFileSync(nameFile, 'utf8')).name : `QA${Date.now().toString(36).slice(-7)}`;
if (!resume) fs.writeFileSync(nameFile, JSON.stringify({ name, createdAt: Date.now() }, null, 2));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, ...(resume ? { storageState: storage } : {}) });
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.stack || e.message));
const d = new CampaignDriver(page, errors, { outDir: dir, root: process.cwd(), prefix: 'campaign' });
try {
  await page.goto('http://localhost:8080/', { waitUntil: 'load' });
  await installCampaignHelpers(page);
  const blocks = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09a', 'B09b', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21'];
  let first = 0;
  if (resume) {
    const checkpoint = JSON.parse(fs.readFileSync(path.join(dir, 'campaign_checkpoint.json'), 'utf8'));
    d.milestones.push(...checkpoint.milestones); d.shots = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
    first = blocks.indexOf(checkpoint.name) + 1;
    await d.until(s => s.top === 'TitleScene', { what: 'título para continuar' });
    await d.wait(800); await d.press('KeyZ', 700);
    await d.until(s => s.titleStage === 'menu', { what: 'menú Continuar' });
    await d.wait(200); await d.press('KeyZ', 700);
    await d.until(s => s.top === 'SaveLoadScene', { what: 'cargar QA' });
    await d.press('KeyZ', 400); await d.until(s => s.top === 'ChoiceScene', { what: 'Cargar' });
    await d.press('KeyZ', 700); await d.until(s => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'partida QA' });
    await d.settle();
    if ((await d.snap()).playerName !== name) throw new Error('Se cargó una partida distinta de QA.');
  }
  for (const block of blocks.slice(first)) {
    const file = path.resolve(`tools/e2e_campaign_${block.toLowerCase()}.mjs`);
    let warned = false;
    while (!fs.existsSync(file)) {
      if (!warned) { console.log(`Partida guardada; esperando conductor de ${block}.`); warned = true; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    d.prefix = `campaign_${block.toLowerCase()}`;
    console.log(`INICIO ${block} · ${name}`);
    for (;;) {
      try {
        const module = await import(`./e2e_campaign_${block.toLowerCase()}.mjs?run=${Date.now()}`);
        await module[`run${block}`](d, name); break;
      } catch (e) {
        await d.shot('fallo').catch(() => {});
        fs.writeFileSync(path.join(dir, 'campaign_failure.json'), JSON.stringify({ block, stage: d.currentStage,
          error: e.stack, state: await d.snap().catch(() => null), errors }, null, 2));
        console.error(e.stack); console.log('La misma partida permanece abierta para corregir el conductor y reintentar.');
        const retry = path.join(dir, 'campaign_retry.json'), stamp = fs.existsSync(retry) ? fs.statSync(retry).mtimeMs : 0;
        while (!fs.existsSync(retry) || fs.statSync(retry).mtimeMs <= stamp) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    await d.save(block);
  }
  console.log(`Campaña completa desde partida nueva ${name}`);
} catch (e) {
  await d.shot('fallo').catch(() => {});
  fs.writeFileSync(path.join(dir, 'campaign_failure.json'), JSON.stringify({ error: e.stack, state: await d.snap().catch(() => null), errors }, null, 2));
  console.error(e.stack); process.exitCode = 1;
} finally {
  const logFile = path.join(dir, 'campaign_dialogos.json');
  const prior = resume && fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
  fs.writeFileSync(logFile, JSON.stringify([...prior, ...await d.log().catch(() => [])], null, 2));
  await browser.close();
}
