// node tools/e2e_b23.mjs: robo/carta y recorrido continuo Nexo→ocho mapas de Almenara→Nexo.
// Fixtures solo al iniciar y trasladar la comprobación del prólogo a Nexo. No salta hitos ni simula resultados.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installB23Helpers } from './e2e_b23_page.mjs';
import { F } from '../game/src/content/events/b23_common.js';
const root = process.cwd(), outDir = path.join(root, 'tools/cache/screens'); fs.mkdirSync(outDir, { recursive: true });
const flags = ['b01_woke', 'b01_starter_chosen', 'b01_core_found', 'b01_dex_received', 'b01_left_town',
  'game_cleared', 'b21_fin', 'b21_creditos', ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`)];
for (const block of ['b02', 'b08', 'b09a', 'b09b', 'b10', 'b11', 'b13', 'b14', 'b15', 'b16', 'b18', 'b20']) {
  const m = await import(`../game/src/content/events/${block}_common.js`); flags.push(...Object.values(m.F || {}).filter(v => typeof v === 'string'));
}
class AlmenaraDriver extends Driver {
  snapState() { return this.eval(() => ({ ...window.__e2e.snap(), ...window.__b23.snap() })); }
  async milestone(name, check) {
    const s = await super.milestone(name, check);
    const state = await this.eval(() => JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));
    fs.writeFileSync(path.join(outDir, 'e2e_b23_checkpoint.json'), JSON.stringify({ state, battles: s.battles, milestones: this.milestones }));
    return s;
  }
  async walkTo(x, y, { onto = true, face = null, stopWhen = null } = {}) {
    for (let i = 0; i < 60; i++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle();
      if (stopWhen?.(s)) return s;
      if (onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1) {
        if (face) await this.turn(face); return s;
      }
      const route = await this.eval(([x, y, onto]) => window.__e2e.route(x, y, { onto }), [x, y, onto]);
      if (!route?.length) throw new Error(`Sin ruta a ${x},${y} desde ${s.map}:${s.x},${s.y}`);
      await this.holdPath(route.slice(0, 100));
    }
    throw new Error(`Ruta interrumpida a ${x},${y}`);
  }
  async load(map, x, y, dir = 8) {
    const carry = this.loaded ? await this.eval(() => JSON.parse(JSON.stringify(window.__e2e.engine.state.data))) : null;
    const history = this.loaded ? (await this.snapState()).battles : [];
    const params = new URLSearchParams({ debug: 1, scene: 'map', map, x, y, dir, noenc: 1, party: 'MEWTWO:100', fragments: 10,
      core: 1, zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild', zform: 'complete', zcells: 100, zcores: 5, flags: flags.join(',') });
    await this.page.goto(`http://localhost:8080/?${params}`, { waitUntil: 'load' });
    await this.page.waitForFunction(() => window.__map?.ready, null, { timeout: 60000 });
    await installB23Helpers(this.page, { carry, history }); this.loaded = true; await this.settle();
  }
  async talk(id, options = {}) {
    const pos = await this.eval(id => window.__e2e.eventPos(id), id);
    const under = await this.eval(id => window.__map.world.events.find(e => e.id === id)?.overTrigger(), id);
    if (under) await this.walkTo(pos.x, pos.y); else await this.faceEvent(id);
    await this.interact(options);
  }
  async beatTechnician(key) {
    for (let n = 0; n < 3; n++) {
      await this.talk(`b23_tecnico_${key}`);
      if ((await this.snapState()).flags[`dlc1_tecnico_${key}`]) return;
    }
    throw new Error(`El equipo no derrotó al técnico ${key}`);
  }
  async go(to) {
    const w = await this.eval(to => window.__map.world.current.def.warps.find(w => w.to === to), to);
    if (!w) throw new Error(`Sin salida a ${to}`);
    if (w.door && !w.dirTrigger) {
      await this.walkTo(w.x, w.y, { onto: false }); const s = await this.pos();
      await this.step(w.x > s.x ? 6 : w.x < s.x ? 4 : w.y > s.y ? 2 : 8);
    } else {
      await this.walkTo(w.x, w.y, { stopWhen: s => s.map === to });
      if ((await this.pos()).map !== to) await this.exitTo(w.dirTrigger || 2, to);
    }
    await this.settle();
    if ((await this.pos()).map !== to) throw new Error(`La salida no llegó a ${to}`);
  }
  mode(mode, probe = false) { return this.eval(([m, p]) => window.__b23.mode(m, p), [mode, probe]); }
  team(mode) { return this.eval(m => window.__b23.team(m), mode); }
  async healAndRest() {
    await this.go('almenara_centro'); await this.walkTo(9, 7, { face: 8 }); await this.interact();
    await this.talk('descanso'); await this.go('puerto_almenara');
  }
}
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
const d = new AlmenaraDriver(page, errors, { outDir, root, prefix: 'e2e_b23' });
try {
  await d.load('laberinto_profundidad', 20, 12); await d.talk('b22a_nodo_laberinto');
  await d.milestone('robo_nodo', s => !s.flags[F.theft] ? 'no se produjo el robo' : null);
  await d.walkTo(19, 33); await d.exitTo(2, 'villa_alba'); await d.go('laboratorio_alerce');
  await d.talk('alerce'); await d.milestone('carta_alerce', s => !s.flags[F.letter] ? 'sin carta' : null);
  await d.load('ciudad_nexo', 26, 37); d.want.push('Puerto Almenara'); await d.talk('marinero_ferri');
  await d.milestone('ferri_almenara', s => s.map !== 'puerto_almenara' || !s.flags[F.arrival] ? 'no llegó el ferri' : null);
  await d.talk('b23_vecina'); await d.talk('b23_faro'); await d.go('almenara_centro');
  await d.walkTo(9, 7, { face: 8 }); await d.interact(); await d.go('puerto_almenara');
  await d.go('ruta_a1'); await d.beatTechnician('bomba');
  await d.milestone('bomba_detenida', s => !s.flags[F.pump] || s.battles.at(-1)?.outcome !== 'win' ? 'sin victoria real' : null);
  await d.go('puerto_almenara'); await d.talk('b23_faro');
  await d.milestone('faro_encendido', s => !s.flags[F.lighthouse] ? 'faro apagado' : null);
  await d.go('ruta_a1'); await d.go('ruta_a2'); await d.beatTechnician('salinas'); await d.go('oasis_vaso');
  await d.talk('b23_valvula_oasis'); await d.talk('b23_vasija');
  await d.milestone('oasis_y_vasija', s => !s.flags[F.oasis] || !s.flags[F.vessel] || !s.keys.includes('PRISONBOTTLE') ? 'sin agua o vasija' : null);
  await d.go('monte_candil'); await d.go('el_crisol');
  await d.beatTechnician('crisol_o'); await d.beatTechnician('crisol_e');
  for (const id of ['b23_terminal', 'b23_aislamiento_0', 'b23_aislamiento_1', 'b23_aislamiento_2']) await d.talk(id);
  await d.expectSaid(/No necesito su permiso\./, 'la grabación'); await d.milestone('crisol_aislado', s => !s.flags[F.crisol] ? 'sin aislamiento' : null);
  await d.go('torre_crisol'); await d.team('weak'); const before = await d.snapState(); await d.talk('b23_gael');
  await d.milestone('gael_derrota_real', s => s.battles.at(-1)?.outcome !== 'lose' || s.flags[F.gaelWon] || s.money !== before.money || s.health.some(p => p.hp !== p.maxHP) ? 'recuperación de derrota incorrecta' : null);
  await d.team('strong'); await d.mode('mega'); await d.talk('b23_gael');
  await d.milestone('gael_victoria_mega', s => !s.flags[F.gaelWon] || !s.battles.at(-1)?.megaEvolutions.some(m => m.species === 'ZYGARDE') ? 'sin victoria y mega real' : null);
  await d.team('noMega'); await d.mode('fight', true); const balls = (await d.snapState()).bag.MASTERBALL; await d.talk('b23_hoopa');
  await d.expectSaid(/Primero debes calmarlo con Mega Zygarde/, 'bloqueo de captura antes de Mega');
  await d.milestone('hoopa_ko_sin_mega', s => s.flags[F.sealed] || s.flags[F.end] || s.bag.MASTERBALL !== balls || s.battles.at(-1)?.outcome !== 'win' ? 'selló sin mega o gastó la Ball' : null);
  await d.go('el_crisol'); await d.go('monte_candil'); await d.go('oasis_vaso'); await d.go('ruta_a2'); await d.go('ruta_a1'); await d.go('puerto_almenara');
  await d.healAndRest(); await d.go('ruta_a1'); await d.go('ruta_a2'); await d.go('oasis_vaso'); await d.go('monte_candil'); await d.go('el_crisol'); await d.go('torre_crisol');
  await d.team('strong'); await d.mode('mega'); await d.talk('b23_hoopa');
  await d.milestone('hoopa_sellado_gael_sale', s => !s.flags[F.end] || !s.flags[F.nodeReturned] || s.visible.includes('b23_gael') || !s.battles.at(-1)?.megaEvolutions.some(m => m.species === 'ZYGARDE') ? 'no terminó la escena con mega real' : null);
  await d.go('el_crisol'); await d.go('monte_candil'); await d.go('oasis_vaso'); await d.go('ruta_a2'); await d.go('ruta_a1'); await d.go('puerto_almenara'); await d.healAndRest();
  await d.go('ruta_a1'); await d.go('ruta_a2'); await d.go('oasis_vaso'); await d.go('monte_candil'); await d.go('el_crisol'); await d.go('torre_crisol');
  await d.mode('capture'); await d.talk('b23_hoopa');
  await d.milestone('hoopa_captura_opcional', s => !s.flags[F.hoopaCaught] || !s.caught.some(p => p.species === 'HOOPA' && p.form === 0) || s.battles.at(-1)?.outcome !== 'caught' ? 'no se capturó Hoopa contenido' : null);
  await d.go('el_crisol'); await d.go('monte_candil'); await d.go('oasis_vaso'); await d.go('ruta_a2'); await d.go('ruta_a1'); await d.go('puerto_almenara');
  d.want.push('Ciudad Nexo'); await d.talk('b23_ferri'); await d.milestone('regreso_nexo', s => s.map !== 'ciudad_nexo' ? 'sin regreso' : null);
  if (errors.length) throw new Error(errors.join('\n'));
  const state = await d.snapState();
  fs.writeFileSync(path.join(outDir, 'e2e_b23_result.json'), JSON.stringify({ milestones: d.milestones, battles: state.battles, errors }, null, 2));
  console.log(`Almenara OK: ${d.milestones.length} hitos, ${state.battles.length} combates reales.`);
} catch (e) { await d.shot('fallo'); console.error(e); process.exitCode = 1; }
finally { await browser.close(); }
