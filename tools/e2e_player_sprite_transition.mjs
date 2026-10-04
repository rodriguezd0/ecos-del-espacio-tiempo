// QA aislada: fixture inicial de mapa/género; después teclas reales y observación de cada render.
// --expect-gap reproduce la versión anterior. La demora sólo afecta al PNG de la primera carrera.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const expectGap = process.argv.includes('--expect-gap');
const base = (process.argv.find(a => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const out = path.resolve('tools/cache/player_sprite_transition', expectGap ? 'red' : 'green');
fs.mkdirSync(out, { recursive: true });
const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
assert.ok(executablePath, 'Chrome o Edge disponible');
const browser = await chromium.launch({ executablePath, headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = { expectGap, fixtures: [], cases: [], errors: [] };
try {
  for (const gender of ['M', 'F']) for (const delayMs of [0, 350]) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    try {
      const page = await context.newPage();
      const label = `${gender}_${delayMs ? 'slow' : 'normal'}`;
      page.on('pageerror', e => report.errors.push(`${label}: ${e.message}`));
      page.on('response', r => { if (r.status() >= 400) report.errors.push(`${label}: ${r.status()} ${r.url()}`); });
      let runRequests = 0;
      await page.route(`**/protagonista_${gender.toLowerCase()}_run.png`, async route => {
        runRequests++;
        if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
        await route.continue();
      });
      const params = new URLSearchParams({ scene: 'map', debug: '1', noenc: '1',
        map: 'dev_zygarde', x: '12', y: '26', dir: '6', party: 'none', follower: '0', zygarde: 'run', time: '13' });
      report.fixtures.push({ label, params: Object.fromEntries(params), gender, delayMs });
      await page.goto(`${base}/?${params}`);
      await page.waitForFunction(() => window.__map?.ready && !__map.runner.busy
        && __map.worldView.sprites.get(__map.world.player.uid)?.mesh.visible);
      // Género del banco aislado; no se modifica ningún guardado del usuario.
      await page.evaluate(async gender => {
        const { playerCharsets } = await import('/src/render/charsets.js');
        __map.state.player.gender = gender;
        __map.world.player.setCharsets(await playerCharsets(gender));
      }, gender);
      await page.waitForFunction(gender => {
        const p = __map.world.player, s = __map.worldView.sprites.get(p.uid);
        return s?.mesh.visible && s.sheet?.key === `protagonista_${gender.toLowerCase()}`;
      }, gender);
      await page.locator('#stage').screenshot({ path: path.join(out, `${label}_idle.png`) });
      await page.evaluate(() => {
        const scene = __map, original = scene.render;
        const trace = window.__spriteTransitionTrace = { frames: [], captures: {} };
        scene.render = function (...args) {
          const result = original.apply(this, args);
          const p = this.world.player, s = this.worldView.sprites.get(p.uid);
          const row = { frame: this.engine.frame, desired: p.characterName, sheet: s?.sheet?.key || null,
            visible: Boolean(s?.mesh.visible), shadow: Boolean(s?.shadow.visible),
            transparent: Boolean(p.transparent), x: p.x, y: p.y, pattern: p.pattern,
            opacity: s?.material.uniforms.uOpacity.value, rect: s?.material.uniforms.uRect.value.toArray() };
          trace.frames.push(row);
          const kind = !row.visible ? 'gap' : row.sheet?.endsWith('_run') ? 'run' : null;
          if (kind && !trace.captures[kind]) trace.captures[kind] = document.getElementById('world').toDataURL('image/png');
          return result;
        };
      });
      // Primera carrera en frío, regreso a reposo y seis cambios rápidos con la hoja ya cargada.
      for (const [key, ms] of [['ArrowRight', 650], ['ArrowLeft', 650], ['ArrowRight', 140],
        ['ArrowLeft', 140], ['ArrowRight', 140], ['ArrowLeft', 140], ['ArrowRight', 140], ['ArrowLeft', 140]]) {
        await page.keyboard.down('Shift');
        await page.keyboard.down(key);
        await page.waitForTimeout(ms);
        await page.keyboard.up(key);
        await page.keyboard.up('Shift');
        await page.waitForFunction(() => !__map.world.player.busy());
        await page.waitForTimeout(90);
      }
      // Caminar -> correr sin detenerse -> caminar.
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(170);
      await page.keyboard.down('Shift');
      await page.waitForTimeout(170);
      await page.keyboard.up('Shift');
      await page.waitForTimeout(170);
      await page.keyboard.up('ArrowRight');
      await page.waitForFunction(() => !__map.world.player.busy());
      await page.waitForTimeout(100);
      const trace = await page.evaluate(() => window.__spriteTransitionTrace);
      for (const [kind, data] of Object.entries(trace.captures))
        fs.writeFileSync(path.join(out, `${label}_${kind}.png`), Buffer.from(data.split(',')[1], 'base64'));
      const frames = trace.frames, gaps = frames.filter(f => !f.visible && !f.transparent);
      const changes = frames.filter((f, i) => i > 0 && f.desired !== frames[i - 1].desired).length;
      const running = frames.filter(f => f.sheet?.endsWith('_run') && f.visible).length;
      const result = { label, frames: frames.length, gaps: gaps.length, changes, running, runRequests,
        moved: frames.some(f => f.x !== 12 || f.y !== 26), trace: frames };
      report.cases.push(result);
      console.log(JSON.stringify({ label, frames: result.frames, gaps: result.gaps, changes, running, runRequests, moved: result.moved }));
      assert.ok(result.moved && running > 0 && changes >= 8, `${label}: movimiento y transiciones reales`);
      assert.ok(frames.every(f => f.opacity > 0), `${label}: opacidad positiva`);
      assert.ok(frames.every(f => f.rect?.every(Number.isFinite)), `${label}: recorte válido`);
      if (expectGap) assert.ok(gaps.length > 0, `${label}: reproduce fotogramas invisibles anteriores`);
      else assert.equal(gaps.length, 0, `${label}: visible en todos los fotogramas`);
      await page.locator('#stage').screenshot({ path: path.join(out, `${label}_final.png`) });
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(report.errors, [], 'sin errores del juego ni de recursos');
} finally {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
