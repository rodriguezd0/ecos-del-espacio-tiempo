// B22c: pistas naturales, siete capturas normales, KO→descanso, derrota segura, itinerancia y retornos.
// node tools/e2e_b22c.mjs [--only=lugia|hooh|primas|rayquaza|latis] [--resume=<checkpoint.json>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installB22cHelpers } from './e2e_b22c_page.mjs';
import { F, LEGENDS } from '../game/src/content/events/b22c_common.js';
import { SITES, LUGIA_ROUTE, LATIOS_ROUTE } from '../game/src/content/maps/b22c/layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools/cache/screens'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d = '') => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') || d;
const BASE = arg('base', 'http://localhost:8080'), ONLY = arg('only'), RESUME = arg('resume');
const flags = ['b01_woke', 'b01_starter_chosen', 'b01_core_found', 'b01_dex_received', 'b01_left_town',
  'game_cleared', 'b21_fin', 'b21_creditos', ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`)];
for (const id of ['b02', 'b08', 'b09a', 'b09b', 'b10', 'b11', 'b13', 'b14', 'b15', 'b16', 'b18', 'b20']) {
  const m = await import(`../game/src/content/events/${id}_common.js`);
  flags.push(...Object.values(m.F || {}).filter(v => typeof v === 'string'));
}

class LegendDriver extends Driver {
  constructor(...args) { super(...args); this.carry = null; this.history = []; this.transcript = []; this.completed = []; }
  snapState() { return this.eval(() => ({ ...window.__e2e.snap(), ...window.__b22c.snap(), choices: window.__b22c.choices() })); }
  async checkpoint() {
    this.carry = await this.eval(() => JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));
    this.history = (await this.snapState()).battles;
    fs.writeFileSync(path.join(OUT, `${this.prefix}_checkpoint.json`), JSON.stringify({ state: this.carry,
      battles: this.history, completed: this.completed, milestones: this.milestones }));
  }
  async milestone(name, check) { const s = await super.milestone(name, check); await this.checkpoint(); return s; }
  async load(map, x, y, dir = 8) {
    if (this.loaded) {
      this.carry = await this.eval(() => JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));
      this.history = (await this.snapState()).battles; this.transcript.push(...await this.log());
    }
    const carried = Object.entries(this.carry?.flags || {}).filter(([, v]) => v).map(([k]) => k);
    const params = new URLSearchParams({ debug: 1, scene: 'map', map, x, y, dir, noenc: 1, party: 'MEWTWO:100', fragments: 10,
      core: 1, zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor', zform: 'complete', zcells: 100, zcores: 5,
      flags: [...new Set([...flags, ...carried])].join(','), vars: 'rest_count:0' });
    await this.page.goto(`${BASE}/?${params}`, { waitUntil: 'load' });
    await this.page.waitForFunction(() => window.__map?.ready, null, { timeout: 45000 });
    await installB22cHelpers(this.page, { carry: this.carry, battles: this.history }); this.loaded = true;
    await this.settle(); await this.turn(dir);
  }
  async talkEvent(id, opts = {}) {
    const underfoot = await this.eval(id => window.__map.world.events.find(e => e.id === id)?.overTrigger(), id);
    if (underfoot) { const p = await this.eval(id => window.__e2e.eventPos(id), id); await this.walkTo(p.x, p.y); }
    else await this.faceEvent(id);
    await this.interact(opts);
  }
  async mode(m) { await this.eval(m => window.__b22c.mode(m), m); }
  async battleTeam() { await this.eval(() => window.__b22c.combatTeam()); }
  async captured(key) { return this.milestone(`${key}_capturado`, s => !s.flags[LEGENDS[key].caught]
    || !s.caught.includes(LEGENDS[key].species) || !s.battles.some(b => b.species === LEGENDS[key].species && b.outcome === 'caught')
    ? 'la captura real no llegó a la partida' : null); }
  async exit(to) {
    const w = await this.eval(to => window.__e2e.warpTo(to), to); if (!w) throw new Error(`Sin salida a ${to}`);
    await this.walkTo(w.x, w.y, { stopWhen: s => s.map === to });
    if ((await this.snapState()).map !== to) await this.exitTo(w.dirTrigger || 2, to);
    await this.settle();
  }
  async rest(slot = 'Mañana') {
    await this.load('casa_prota_2f', 8, 6, 6); this.want.push('Descansar', slot); await this.interact();
  }
  async returnFrom(key) {
    const S = SITES[key]; await this.exit(S.back.map);
    await this.milestone(`${key}_regreso`, s => s.map !== S.back.map || s.x !== S.back.x || s.y !== S.back.y ? 'regreso incorrecto' : null);
  }
}

async function lugia(d) {
  await d.load('caleta_faro', 8, 9); await d.talkEvent('ramon');
  await d.milestone('ramon_pista_natural', s => !s.flags[F.ramon] ? 'sin pista' : null);
  await d.load('fondo_mar_sur', 104, 43); d.want.push('Marcas visibles sin destellos');
  await d.talkEvent('b22c_acceso_lugia');
  await d.milestone('sima_guia_accesible', s => s.map !== 'sima_marina' || s.vars.b22c_lugia_guia !== 3 ? 'guía incorrecta' : null);
  for (const p of LUGIA_ROUTE) { await d.walkTo(p.x, p.y); await d.settle(); }
  await d.mode('lose'); const before = await d.snapState(); await d.talkEvent('b22c_lugia');
  await d.milestone('lugia_derrota_segura', s => s.money !== before.money || JSON.stringify(s.heal) !== JSON.stringify(before.heal)
    || s.x !== 16 || s.y !== 7 || s.health.some(p => p.hp !== p.maxHP) || s.flags[LEGENDS.lugia.caught] ? 'derrota alteró recursos o llegada' : null);
  await d.battleTeam(); await d.mode('capture'); await d.talkEvent('b22c_lugia'); await d.captured('lugia');
  for (const p of LUGIA_ROUTE.slice().reverse().slice(1)) { await d.walkTo(p.x, p.y); await d.settle(); }
  await d.returnFrom('lugia');
}

async function hooh(d) {
  if (d.carry?.flags?.[LEGENDS.hooh.caught]) {
    await d.load('cerro_alba', 13, 5); await hoohReturn(d); return;
  }
  await d.load('archivo_hondo_nucleo', 25, 17); d.want.push('No'); await d.talkEvent('b22e_guardian_olvido');
  await d.milestone('olvido_ceniza_natural', s => s.bag.SACREDASH !== 1 ? 'sin ceniza' : null);
  await d.load('cerro_alba', 12, 6); await d.talkEvent('brasero_alba');
  await d.milestone('brasero_espera_amanecer', s => s.flags[F.brazier] || s.bag.SACREDASH !== 1 ? 'gastó fuera del amanecer' : null);
  await d.rest(); await d.load('cerro_alba', 12, 6); await d.talkEvent('brasero_alba');
  await d.milestone('brasero_ceniza_consumida', s => !s.flags[F.brazier] || s.bag.SACREDASH ? 'ofrenda incorrecta' : null);
  await d.mode('capture'); await d.talkEvent('b22c_hooh'); await d.captured('hooh');
  await hoohReturn(d);
}

async function hoohReturn(d) {
  await d.walkTo(11, 19, { face: 2 }); await d.interact();
  await d.walkTo(5, 29, { stopWhen: s => s.map === 'ruta_1' }); await d.settle();
  await d.milestone('hooh_regreso_ruta1', s => s.map !== 'ruta_1' ? 'sin regreso al camino' : null);
}

async function primas(d) {
  await d.load('antea_2_antea', 22, 18); await d.talkEvent('b22c_reliquia_blue'); await d.talkEvent('b22c_reliquia_dew');
  await d.milestone('reliquias_eco_antea', s => s.bag.BLUEORB !== 1 || s.bag.SOULDEW !== 1 ? 'reliquias incorrectas' : null);
  await d.load('mina_galena_honda', 12, 13); await d.talkEvent('b22c_reliquia_red');
  await d.milestone('prisma_rojo_mina', s => s.bag.REDORB !== 1 ? 'sin prisma rojo' : null);
  await d.load('mar_del_sur', 174, 28); await d.talkEvent('b22c_lluvia_superficie');
  await d.milestone('lluvia_exige_movimiento', s => s.flags[F.rain] ? 'activada sin movimiento' : null);
  await d.eval(() => window.__b22c.team([['PELIPPER', 100, ['RAINDANCE', 'SURF', 'ICEBEAM', 'HURRICANE']]]));
  await d.talkEvent('b22c_lluvia_superficie');
  await d.milestone('danza_lluvia_superficie', s => !s.flags[F.rain] ? 'ritual no responde' : null);
  await d.load('fondo_mar_sur', 169, 27); await d.talkEvent('fosa_abisal_2');
  await d.battleTeam(); await d.mode('ko'); await d.talkEvent('b22c_kyogre');
  await d.milestone('kyogre_ko_descanso', s => !s.flags[LEGENDS.kyogre.beaten] || s.visible.includes('b22c_kyogre') ? 'KO no espera descanso' : null);
  await d.returnFrom('kyogre'); await d.rest();
  await d.load('fondo_mar_sur', 169, 27); await d.talkEvent('fosa_abisal_2'); await d.mode('capture');
  await d.talkEvent('b22c_kyogre'); await d.captured('kyogre'); await d.returnFrom('kyogre');
  await d.load('tizon_cueva', 30, 44); await d.talkEvent('b22c_acceso_groudon');
  await d.milestone('veta_exige_dia_soleado', s => s.flags[F.sun] || s.map !== 'tizon_cueva' ? 'abrió sin movimiento' : null);
  await d.eval(() => window.__b22c.team([['CHARIZARD', 100, ['SUNNYDAY', 'FLAMETHROWER', 'AIRSLASH', 'SOLARBEAM']]]));
  await d.talkEvent('b22c_acceso_groudon');
  await d.milestone('dia_soleado_veta', s => !s.flags[F.sun] || s.map !== 'veta_magmatica' ? 'ritual no abrió la veta' : null);
  await d.mode('capture'); await d.talkEvent('b22c_groudon'); await d.captured('groudon'); await d.returnFrom('groudon');
}

async function rayquaza(d) {
  await d.battleTeam(); await d.load('cumbre_azur', 17, 13); await d.talkEvent('b22c_acceso_rayquaza');
  await d.talkEvent('b22c_ascenso_draco');
  await d.milestone('rayquaza_exige_equipo_y_tormenta', s => s.visible.includes('b22c_rayquaza') ? 'aparece con legendarios en PC' : null);
  await d.returnFrom('rayquaza');
  await d.load('lumina_hotel', 21, 16); d.want.push('Descansar hasta tormenta'); await d.talkEvent('recepcionista');
  await d.milestone('hotel_tormenta_real', s => !s.storm ? 'sin tormenta' : null);
  await d.eval(() => window.__b22c.weatherParty()); await d.load('cumbre_azur', 17, 13); await d.talkEvent('b22c_acceso_rayquaza');
  await d.mode('capture'); await d.talkEvent('b22c_rayquaza'); await d.captured('rayquaza');
  await d.talkEvent('b22c_ascenso_draco');
  await d.milestone('rayquaza_ascenso_draco', s => !s.party.some(p => p.species === 'RAYQUAZA' && p.moves.includes('DRAGONASCENT')) ? 'sin Ascenso Draco' : null);
  await d.returnFrom('rayquaza');
}

async function latis(d) {
  await d.battleTeam(); await d.load('lagos_alma', 46, 28); await d.mode('capture'); await d.talkEvent('b22c_reflejo_latias');
  await d.captured('latias'); await d.milestone('latiasita_una_vez', s => s.bag.LATIASITE !== 1 || !s.flags[F.latiasSeen] ? 'sin piedra o avistamiento' : null);
  const first = LATIOS_ROUTE[0]; await d.load('mar_del_sur', first.x - 1, first.y);
  await d.eval(() => window.__b22c.team([['NINJASK', 100, ['AERIALACE', 'SWORDSDANCE']]]));
  await d.mode('run'); await d.talkEvent('b22c_latios_0');
  await d.milestone('latios_itinerante_huida_real', s => s.vars.b22c_latios_ruta !== 1 || s.flags[LEGENDS.latios.caught]
    || !s.battles.some(b => b.species === 'LATIOS' && b.outcome === 'run') ? 'no cambió tras huir' : null);
  const second = LATIOS_ROUTE[1]; await d.load('mar_del_sur', second.x - 1, second.y); await d.mode('capture');
  await d.talkEvent('b22c_latios_1'); await d.captured('latios');
  await d.milestone('latiosita_una_vez', s => s.bag.LATIOSITE !== 1 ? 'sin piedra' : null);
  await d.swimTo(48, 25); await d.talkEvent('b22c_rastro_latios');
  await d.milestone('latios_regreso_mar', s => s.map !== 'mar_del_sur' ? 'sin regreso' : null);
}

async function buceo(d) {
  await d.load('mar_del_sur', 110, 12, 2); await d.interact();
  await d.milestone('buceo_real_bajo_talasa', s => s.map !== 'fondo_mar_sur' || !s.dive ? 'no bajó con Buceo' : null);
  await d.walkTo(118, 26); await d.walkTo(103, 37); await d.talkEvent('b22c_acceso_lugia');
  await d.milestone('sima_desde_superficie', s => s.map !== 'sima_marina' ? 'no se llega desde el remolino' : null);
  await d.returnFrom('lugia'); await d.walkTo(118, 26); await d.walkTo(110, 12); await d.interact();
  await d.milestone('lugia_emerger_real', s => s.map !== 'mar_del_sur' || !s.surfing ? 'no emergió tras volver' : null);
  await d.load('mar_del_sur', 138, 36, 2); await d.interact();
  await d.walkTo(145, 30); await d.talkEvent('fosa_abisal_2');
  await d.milestone('fosa_desde_superficie', s => s.map !== 'fosa_abisal' ? 'no se llega a la fosa desde el remolino' : null);
  await d.returnFrom('kyogre'); await d.walkTo(145, 30); await d.walkTo(138, 36); await d.interact();
  await d.milestone('kyogre_emerger_real', s => s.map !== 'mar_del_sur' || !s.surfing ? 'no emergió tras la fosa' : null);
}

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
const browser = await chromium.launch({ executablePath: CHROME, headless: !process.argv.includes('--headed'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = []; let d;
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', e => errors.push(e.stack || e.message));
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/favicon')) errors.push(`${r.status()} ${r.url()}`); });
  d = new LegendDriver(page, errors, { outDir: OUT, root: ROOT, prefix: `e2e_b22c_${ONLY || 'all'}` });
  if (RESUME) { const saved = JSON.parse(fs.readFileSync(RESUME)); d.carry = saved.state; d.history = saved.battles;
    d.completed = saved.completed; d.milestones = saved.milestones; }
  for (const [stage, run] of Object.entries({ lugia, hooh, primas, rayquaza, latis, buceo })) {
    if (ONLY && ONLY !== stage || d.completed.includes(stage)) continue;
    console.log(`— ${stage}`); await run(d); d.completed.push(stage); await d.checkpoint();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`✔ B22c ${d.milestones.join(' → ')}`);
} catch (err) {
  await d?.shot('fallo').catch(() => {}); console.error(JSON.stringify(await d?.snapState().catch(() => null)));
  if (errors.length) console.error(errors.join('\n')); console.error(err.stack || err.message); process.exitCode = 1;
} finally {
  if (d?.loaded) d.transcript.push(...await d.log().catch(() => []));
  fs.writeFileSync(path.join(OUT, `e2e_b22c_${ONLY || 'all'}_dialogos.txt`), (d?.transcript || []).map(l => `${l.speaker}: ${l.text}`).join('\n'));
  await browser.close();
}
