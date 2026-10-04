// Nueve capturas, puzzles, accesos naturales, KO/descanso, pérdida segura y regresos.
// node tools/e2e_b22d.mjs [--only=regis|heatran|suenos|cierzo|sombra] [--base=http://localhost:8080]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installB22dHelpers } from './e2e_b22d_page.mjs';
import { F, V, LEGENDS } from '../game/src/content/events/b22d_common.js';
import { HOOKS, PICO, ESCARCHA, TUNELES, COLOSO, CIERZO, PESADILLA } from '../game/src/content/maps/b22d/layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools/cache/screens'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') || d;
const BASE = arg('base', 'http://localhost:8080'), ONLY = arg('only', '');
const flags = ['b01_woke', 'b01_starter_chosen', 'b01_core_found', 'b01_dex_received', 'b01_left_town',
  'game_cleared', 'b21_fin', 'b21_creditos', ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`)];
for (const id of ['b02', 'b08', 'b09a', 'b10', 'b13', 'b15']) {
  const m = await import(`../game/src/content/events/${id}_common.js`);
  flags.push(...Object.values(m.F || {}).filter((v) => typeof v === 'string'));
}

class PostDriver extends Driver {
  constructor(...args) { super(...args); this.carry = null; this.history = []; this.transcript = []; }
  snapState() { return this.eval(() => ({ ...window.__e2e.snap(), ...window.__b22d.snap(), choices: window.__b22d.choices() })); }
  async milestone(name, check) {
    const s = await super.milestone(name, check);
    const state = await this.eval(() => window.__e2e.engine.state.data);
    fs.writeFileSync(path.join(OUT, `${this.prefix}_estado.json`), JSON.stringify(state));
    return s;
  }
  async load(map, x, y, dir = 8) {
    if (this.loaded) {
      this.carry = await this.eval(() => JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));
      this.history = (await this.snapState()).battles; this.transcript.push(...await this.log());
    }
    const carried = Object.entries(this.carry?.flags || {}).filter(([, v]) => v).map(([k]) => k);
    const params = new URLSearchParams({ debug: 1, scene: 'map', map, x, y, dir, noenc: 1, party: 'MEWTWO:100',
      fragments: 10, core: 1, zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor', zform: 'complete', zcells: 100, zcores: 5,
      flags: [...new Set([...flags, ...carried])].join(','), vars: 'rest_count:0' });
    await this.page.goto(`${BASE}/?${params}`, { waitUntil: 'load' });
    await this.page.waitForFunction(() => window.__map?.ready, null, { timeout: 45000 });
    await installB22dHelpers(this.page, { carry: this.carry, battles: this.history }); this.loaded = true;
    await this.settle(); await this.turn(dir);
  }
  async talkEvent(id, opts = {}) {
    const underfoot = await this.eval((id) => window.__map.world.events.find((e) => e.id === id)?.overTrigger(), id);
    if (underfoot) { const p = await this.eval((id) => window.__e2e.eventPos(id), id); await this.walkTo(p.x, p.y); }
    else await this.faceEvent(id);
    await this.interact(opts);
  }
  async mode(mode) { await this.eval((m) => window.__b22d.mode(m), mode); }
  async battleTeam() { await this.eval(() => window.__b22d.combatTeam()); }
  async captured(key) {
    await this.milestone(`${key}_capturado`, (s) => !s.flags[LEGENDS[key].caught] || !s.caught.includes(LEGENDS[key].species) ? 'la captura no llegó a la partida' : null);
  }
  async exit(to) {
    const w = await this.eval((to) => window.__e2e.warpTo(to), to);
    if (!w) throw new Error(`No existe salida a ${to}`);
    const onto = await this.eval(([x, y]) => Boolean(window.__e2e.route(x, y)), [w.x, w.y]);
    await this.walkTo(w.x, w.y, { onto, stopWhen: (s) => s.map === to });
    const s = await this.snapState();
    if (s.map !== to) await this.exitTo(w.dirTrigger || (w.x > s.x ? 6 : w.x < s.x ? 4 : w.y > s.y ? 2 : 8), to);
    await this.settle();
  }
}

async function regis(d) {
  await d.load('estrato_casa_galena', 7, 9);
  await d.milestone('fermin_avisa', (s) => !s.flags[F.ferminAsk] ? 'sin aviso de Fermín' : null);
  await d.exit('ciudad_estrato');
  await d.load('mina_galena', 7, 16);
  await d.talkEvent('b22d_relieve'); await d.talkEvent('b22d_fermin_relieve');
  await d.talkEvent('b22d_marca_lampara');
  await d.milestone('relieve_error_reversible', (s) => (s.vars[V.reliefStep] || 0) !== 0 ? 'no reinició' : null);
  for (const sign of ['pico', 'lampara', 'vagoneta']) await d.talkEvent(`b22d_marca_${sign}`);
  await d.milestone('pico_abierto', (s) => !s.flags[F.picoOpen] ? 'sin entrada' : null);
  await d.walkTo(HOOKS.mina.relief.x, HOOKS.mina.relief.y, { stopWhen: (s) => s.map === PICO.id }); await d.settle();
  await d.talkEvent('regirock'); await d.captured('regirock');
  await d.exit('mina_galena');
  await d.milestone('regirock_regreso', (s) => s.map !== 'mina_galena' ? 'salida incorrecta' : null);

  await d.load('boreal_talleres', 15, 10, 2);
  await d.milestone('rosendo_avisa', (s) => !s.flags[F.rosendoAsk] ? 'sin Rosendo' : null);
  await d.step(2); await d.settle();
  await d.milestone('bodega_a_pie', (s) => s.map !== ESCARCHA.id ? 'sin bodega' : null);
  await d.talkEvent('b22d_talla_vieja'); await d.talkEvent('b22d_rosendo_bodega');
  await d.talkEvent('b22d_bloque_0'); await d.talkEvent('b22d_bloque_0');
  await d.milestone('talla_deshacer', (s) => s.vars[V.carving] !== 0 ? 'no deshizo talla' : null);
  for (const n of [1, 3, 4, 5, 7]) await d.talkEvent(`b22d_bloque_${n}`);
  await d.milestone('escarcha_abierta', (s) => !s.flags[F.escarchaOpen] ? 'talla no abrió' : null);
  await d.talkEvent('regice'); await d.captured('regice');
  await d.exit('boreal_talleres');
  await d.milestone('regice_regreso', (s) => s.map !== 'boreal_talleres' ? 'salida incorrecta' : null);

  await d.load('lumina_museo_galeria', 44, 9);
  await d.milestone('rosalia_avisa', (s) => !s.flags[F.rosaliaAsk] ? 'sin Rosalía' : null);
  await d.load('lumina_museo_taller', 17, 15, 2);
  await d.talkEvent('b22d_rosalia_muelle');
  await d.walkTo(17, 16, { stopWhen: (s) => s.map === TUNELES.id }); await d.settle();
  await d.talkEvent('b22d_reloj');
  await d.talkEvent('b22d_pieza_pendulo');
  await d.talkEvent('b22d_derrumbe_0');
  for (const part of ['rueda', 'pesa']) await d.talkEvent(`b22d_pieza_${part}`);
  await d.talkEvent('b22d_rosalia_tuneles');
  await d.milestone('reloj_restaurado', (s) => !s.flags[F.clockRestored] ? 'sin reloj' : null);
  await d.battleTeam(); await d.mode('ko'); await d.talkEvent('registeel');
  await d.milestone('registeel_ko_espera', (s) => !s.flags[LEGENDS.registeel.beaten] ? 'sin espera tras KO' : null);
  const afterKo = await d.eval(() => window.__map.world.events.find((e) => e.id === 'registeel').characterName);
  if (afterKo) throw new Error('Registeel sigue visible antes de descansar');
  await d.load('casa_prota_2f', 8, 6, 6);
  d.want.push('Descansar', 'Noche'); await d.interact();
  await d.load(TUNELES.id, TUNELES.arrive.x, TUNELES.arrive.y); await d.mode('capture');
  await d.talkEvent('registeel'); await d.captured('registeel');
  await d.exit('lumina_museo_taller');
  await d.milestone('registeel_regreso', (s) => s.map !== 'lumina_museo_taller' ? 'sin museo' : null);

  await d.battleTeam(); // Las capturas se guardan en el PC; el sello exige que vuelvan al equipo.
  await d.load('archivo_hondo', HOOKS.hondo.arriveBack.x, HOOKS.hondo.arriveBack.y);
  await d.talkEvent('b22d_sello_coloso');
  await d.milestone('coloso_exige_equipo', (s) => s.flags[F.colosoOpen] ? 'abrió con Regis en PC' : null);
  await d.eval(() => window.__b22d.regiParty());
  await d.talkEvent('b22d_sello_coloso'); await d.talkEvent('b22d_sello_coloso');
  await d.milestone('coloso_a_pie', (s) => s.map !== COLOSO.id ? 'sin Coloso' : null);
  await d.talkEvent('regigigas'); await d.captured('regigigas');
  await d.exit('archivo_hondo');
  await d.milestone('coloso_regreso_piso2', (s) => s.map !== 'archivo_hondo' || s.x !== 25 || s.y !== 10 ? 'regreso incorrecto' : null);
}

async function heatran(d) {
  await d.load('tizon_crater', 20, 18);
  await d.talkEvent('b22d_calzada');
  await d.milestone('calzada_exige_piedra', (s) => s.flags[F.causeway] ? 'abrió sin Piedra' : null);
  await d.load('volcan_tizon', 20, 39);
  await d.talkEvent('brasa');
  await d.milestone('piedra_forja', (s) => s.bag.MAGMASTONE !== 1 ? 'sin Piedra Magma' : null);
  await d.load('tizon_crater', 20, 18);
  await d.talkEvent('b22d_calzada'); await d.walkTo(20, 11, { face: 8 });
  await d.mode('lose'); const before = await d.snapState();
  await d.interact();
  await d.milestone('heatran_derrota_segura', (s) => s.money !== before.money || JSON.stringify(s.heal) !== JSON.stringify(before.heal)
    || s.x !== 20 || s.y !== 18 || s.health.some((p) => p.hp !== p.maxHP) ? 'derrota sin recuperación segura' : null);
  await d.battleTeam(); await d.mode('capture'); await d.talkEvent('heatran'); await d.captured('heatran');
  await d.exit('tizon_cueva');
  await d.milestone('heatran_regreso', (s) => s.map !== 'tizon_cueva' ? 'sin regreso' : null);
}

async function suenos(d) {
  await d.load('casa_prota_1f', 7, 10); await d.talkEvent('mama');
  await d.milestone('mama_rumor', (s) => !s.flags[F.rumor] ? 'sin rumor' : null);
  await d.walkTo(12, 4, { stopWhen: (s) => s.map === 'casa_prota_2f' }); await d.settle();
  await d.walkTo(8, 6, { face: 6 });
  d.want.push('Descansar', 'Noche'); await d.interact();
  await d.milestone('descanso_sin_sueno', (s) => s.map !== 'casa_prota_2f' || s.flags[F.nightmare] ? 'Descansar provocó sueño' : null);
  d.want.push('Dormir profundamente'); await d.interact();
  await d.milestone('primer_sueno_determinista', (s) => s.map !== 'alba_pesadilla' ? 'sin sueño' : null);
  await d.shot('pesadilla');
  for (const a of PESADILLA.silhouettes) { await d.walkTo(a.x, a.y); await d.settle(); }
  await d.milestone('vecinos_se_desvanecen', (s) => PESADILLA.silhouettes.some((a) => !s.flags[`b22d_${a.id}_vista`]) ? 'silueta no desapareció' : null);
  await d.walkTo(22, 1); await d.step(8); await d.settle();
  await d.milestone('borde_vuelve_al_pueblo', (s) => s.map !== PESADILLA.id || s.x !== 22 || s.y !== 33 ? 'el borde perdió al jugador' : null);
  await d.talkEvent('b22d_sueno_puerta');
  await d.milestone('puerta_despierta', (s) => s.map !== 'casa_prota_2f' || s.flags[F.nightmare] ? 'la puerta no despierta' : null);
  await d.walkTo(8, 6, { face: 6 }); d.want.push('Descansar', 'Noche'); await d.interact();
  d.want.push('Dormir profundamente'); await d.interact();
  await d.battleTeam(); await d.mode('ko'); await d.talkEvent('darkrai');
  await d.milestone('darkrai_ko_despierta', (s) => !s.flags[LEGENDS.darkrai.beaten] || s.map !== 'casa_prota_2f' || s.flags[F.nightmare] ? 'KO no despierta' : null);
  await d.walkTo(8, 6, { face: 6 }); d.want.push('Dormir profundamente'); await d.interact();
  await d.milestone('darkrai_sueno_siguiente', (s) => s.map !== 'alba_pesadilla' || !s.active.includes('darkrai') ? 'no vuelve en siguiente sueño' : null);
  await d.mode('capture'); await d.talkEvent('darkrai'); await d.captured('darkrai');
  await d.milestone('darkrai_captura_despierta', (s) => s.map !== 'casa_prota_2f' || s.flags[F.nightmare] ? 'no despertó' : null);
  await d.walkTo(10, 4, { stopWhen: (s) => s.map === 'casa_prota_1f' }); await d.settle();
  await d.talkEvent('mama'); await d.talkEvent('mama');
  await d.milestone('atrapasuenos_una_vez', (s) => s.bag.DREAMCATCHER !== 1 ? 'Atrapasueños incorrecto' : null);
  await d.load('islote_lumbre', 11, 6);
  await d.milestone('cresselia_solo_noche', (s) => s.active.includes('cresselia') ? 'salió de día' : null);
  await d.eval(() => window.__b22d.night()); await d.talkEvent('cresselia'); await d.captured('cresselia');
  await d.swimTo(11, 0); await d.exitTo(8, 'mar_del_sur');
  await d.milestone('cresselia_regreso', (s) => s.map !== 'mar_del_sur' ? 'sin regreso al mar' : null);
}

async function cierzo(d) {
  await d.load('mar_boreal', 6, 8);
  await d.talkEvent('verja_cierzo');
  await d.milestone('cierzo_300_vistas', (s) => s.flags[F.cierzoOpen] ? 'abrió antes de300' : null);
  await d.eval(() => window.__b22d.seen(300)); await d.talkEvent('verja_cierzo');
  await d.talkEvent('b22d_cierzo_verja');
  await d.milestone('instalacion_a_pie', (s) => s.map !== CIERZO.hall.id ? 'sin instalación' : null);
  await d.talkEvent('b22d_cierzo_ascensor');
  await d.milestone('original_exige_pruebas', (s) => s.map !== CIERZO.hall.id ? 'accedió antes de vencer prototipos' : null);
  for (const room of ['a', 'b', 'c']) {
    await d.talkEvent(`b22d_cierzo_puerta_${room}`);
    if (room === 'a') {
      await d.mode('lose'); const before = await d.snapState(); await d.talkEvent(`b22d_prototipo_${room}`);
      await d.milestone('prototipo_derrota_segura', (s) => s.money !== before.money || JSON.stringify(s.heal) !== JSON.stringify(before.heal)
        || s.flags.b22d_prototipo_a_vencido || s.health.some((p) => p.hp !== p.maxHP) ? 'perder alteró progreso o recursos' : null);
      await d.battleTeam(); await d.mode('capture');
    }
    const balls = (await d.snapState()).bag.MASTERBALL;
    await d.talkEvent(`b22d_prototipo_${room}`);
    await d.milestone(`prototipo_${room}_sin_captura`, (s) => !s.flags[`b22d_prototipo_${room}_vencido`] || s.bag.MASTERBALL !== balls ? 'captura o gasto indebido' : null);
    const entry = CIERZO.lab.entries[room]; await d.leave(entry.x, entry.y, 2, (s) => s.map === CIERZO.hall.id);
  }
  await d.expectSaid(/Los prototipos fallidos no pueden capturarse/,'rechazo de Balls');
  await d.talkEvent('b22d_cierzo_ascensor'); await d.talkEvent('mewtwo'); await d.captured('mewtwo');
  await d.exit(CIERZO.hall.id); await d.exit('mar_boreal');
  await d.milestone('cierzo_regreso', (s) => s.map !== 'mar_boreal' || s.x !== 4 || s.y !== 6 ? 'sin regreso al islote' : null);
}

async function sombra(d) {
  await d.load('ruinas_dintel_nucleo', 13, 20);
  d.want.push('No');
  await d.talkEvent('b22e_guardian_casilda');
  await d.milestone('casilda_avisa', (s) => !s.flags[F.casildaWarn] ? 'sin aviso' : null);
  await d.load('explanada_umbral', 27, 18);
  await d.milestone('sombra_solo_noche', (s) => s.active.includes('b22d_sombra_impar') ? 'sombra de día' : null);
  await d.eval(() => window.__b22d.night());
  await d.talkEvent('b22d_sombra_columna_o');
  await d.milestone('sombra_normal_no_avanza', (s) => (s.vars[V.shadowStep] || 0) !== 0 ? 'sombra normal abrió' : null);
  for (let i = 0; i < HOOKS.explanada.route.length; i++) await d.talkEvent(i ? `b22d_sombra_impar_${i}` : 'b22d_sombra_impar');
  await d.milestone('sombra_hasta_dintel', (s) => !s.flags[F.shadowFound] ? 'ruta incompleta' : null);
  await d.talkEvent('marshadow'); await d.captured('marshadow');
  await d.walkTo(27, 18);
  await d.milestone('umbral_regreso', (s) => s.map !== 'explanada_umbral' ? 'regreso bloqueado' : null);
}

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f));
const browser = await chromium.launch({ executablePath: CHROME, headless: !process.argv.includes('--headed'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = []; let d;
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', (e) => errors.push(e.stack || e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/favicon')) errors.push(`${r.status()} ${r.url()}`); });
  d = new PostDriver(page, errors, { outDir: OUT, root: ROOT, prefix: `e2e_b22d_${ONLY || 'all'}` });
  for (const [stage, run] of Object.entries({ regis, heatran, suenos, cierzo, sombra })) {
    if (ONLY && ONLY !== stage) continue; console.log(`— ${stage}`); await run(d);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`✔ B22d ${d.milestones.join(' → ')}`);
} catch (err) {
  await d?.shot('fallo').catch(() => {});
  console.error(JSON.stringify(await d?.snapState().catch(() => null)));
  if (errors.length) console.error(errors.join('\n'));
  console.error(err.stack || err.message); process.exitCode = 1;
} finally {
  if (d?.loaded) d.transcript.push(...await d.log().catch(() => []));
  fs.writeFileSync(path.join(OUT, `e2e_b22d_${ONLY || 'all'}_dialogos.txt`), (d?.transcript || []).map((l) => `${l.speaker}: ${l.text}`).join('\n'));
  await browser.close();
}
