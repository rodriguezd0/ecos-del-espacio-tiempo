// Postgame V: controles reales, condiciones del Porvenir y capturas normales. --only=grieta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installB22aHelpers } from './e2e_b22a_page.mjs';
import { IRON_ROOM, EXPLANADA } from '../game/src/content/maps/b22e/grieta_layout.js';
import { solve } from '../game/src/content/events/b22e_iron_logic.js';
import { PARADOXES } from '../game/src/content/events/b22e_grieta_logic.js';
import { OUTSIDE, INTERIOR_ENTRY } from '../game/src/content/maps/b09a/lumina_layout.js';
import { installBastionHelpers } from './e2e_b22e_page.mjs';
import { BASTION, RECEPTION } from '../game/src/content/maps/b22e/bastion_layout.js';
import { ROOMS as R } from '../game/src/content/maps/b22e/rooms_layout.js';
import { F as B13 } from '../game/src/content/events/b13_common.js';
import { GUARDIANS } from '../game/src/content/events/b22e_guardians.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools/cache/screens'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) || d;
const BASE = arg('base', 'http://localhost:8080');
const FLAGS = ['b01_woke', 'b01_starter_chosen', 'b01_core_found', 'b01_dex_received', 'b01_left_town',
  'b09_gala', 'b17_mirador_visto', 'b17_vigilia', 'b21_regreso', 'game_cleared', 'b21_fin',
  ...Object.values(B13).filter((f) => typeof f === 'string'),
  'b02_casilda_vencida', 'b04_leandro_vencido', 'b04_leandro_despedida', 'b06_abril_vencida', 'b08_fermin',
  ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`)];

class PostDriver extends Driver {
  snapState() {
    return this.eval(() => ({ ...window.__e2e.snap(), choices: window.__b22a.choices(),
      vars: { ...window.__e2e.engine.state.data.vars }, battles: window.__b22a.battles.slice(),
      bag: { ...window.__e2e.engine.state.data.bag },
      caught: [...window.__e2e.engine.state.party, ...window.__e2e.engine.state.data.boxes.flat()].filter(Boolean).map((p) => p.species),
      bastion: window.__bastion ? { battles: window.__bastion.battles, requests: window.__bastion.requests, before: window.__bastion.before, now: window.__bastion.snapshot(), bagProof: window.__bastion.bagProof } : null,
    }));
  }
  async load(map, x, y, dir = 8) {
    const q = new URLSearchParams({ debug: 1, scene: 'map', map, x, y, noenc: 1, party: 'BLISSEY:100', core: 1,
      zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor', zform: 'complete', zcells: 100, zcores: 5,
      flags: FLAGS.join(','), hour: 13 });
    await this.page.goto(`${BASE}/?${q}`, { waitUntil: 'load' });
    await this.page.waitForFunction(() => window.__map?.ready, null, { timeout: 30000 });
    await installB22aHelpers(this.page, { mode: 'capture' });
    await this.settle(); await this.turn(dir);
  }
  async catch(key) {
    await this.faceEvent(`b22e_${key}`); await this.interact();
    await this.milestone(key, (s) => !s.flags[`b22e_${key}_capturado`] ? 'sin captura normal' : null);
  }
  async camp(time) {
    await this.walkTo(EXPLANADA.rosalia.x, EXPLANADA.rosalia.y + 1, { face: 8 });
    this.want.push('Esperar', time); await this.interact();
  }
  async waitCapture(key) {
    const until = Date.now() + 90000;
    while (Date.now() < until) {
      const s = await this.snapState();
      if (s.flags[`b22e_${key}_capturado`]) { await this.settle(); return; }
      if (s.busy || s.top !== 'MapScene') await this.settle();
      else await this.wait(300);
    }
    throw new Error(`no se acercó ${key}`);
  }
}

async function rooms(d) {
  await d.load('laboratorio_alerce', 13, 4, 8);
  await d.interact(); await d.expectSaid(/cerrada con llave/, 'puerta cerrada sin la llave');
  await d.eval(() => window.__e2e.engine.state.addKeyItem('ALERCEKEY'));
  await d.interact();
  await d.milestone('cuarto_con_llave', (s) => s.map !== R.archive.id || s.bag.ALERCEKEY !== 1 ? 'sin acceso o llave gastada' : null);
  for (const id of ['foto', 'calibracion', 'fechas', 'cuaderno']) { await d.faceEvent(`archivo_${id}`); await d.interact(); }
  await d.milestone('proyecto_laguna', (s) => !s.flags.b22e_cuarto_visto ? 'faltan archivos' : null);
  await d.expectSaid(/rascado/, 'foto'); await d.expectSaid(/tachado/, 'informe');
  await d.walkTo(R.archive.entry.x, R.archive.entry.y); await d.step(2); await d.settle();
  await d.faceEvent('alerce'); await d.interact(); await d.expectSaid(/No voy a cambiar ninguna fecha/, 'subtexto de Alerce');
  await d.milestone('regreso_laboratorio', (s) => s.map !== 'laboratorio_alerce' || !s.flags.b22e_alerce_cuarto ? 'sin retorno' : null);

  await d.load('estacion_talasa', R.talasa.return.x, R.talasa.return.y, 2);
  await d.faceEvent('b22e_trampilla_talasa'); await d.interact();
  await d.milestone('mantenimiento_talasa', (s) => s.map !== R.talasa.id ? 'sin escalera' : null);
  await d.faceEvent('cultivos_talasa'); await d.interact();
  await d.faceEvent('registro_talasa'); await d.interact();
  const balls = (await d.snapState()).bag.MASTERBALL;
  await d.faceEvent('ditto_talasa'); await d.interact();
  await d.milestone('ditto_normal', (s) => !s.flags.b22e_talasa_ditto || !s.caught.includes('DITTO') || s.bag.MASTERBALL !== balls - 1 ? 'sin captura normal' : null);
  await d.faceEvent('alakazamita_talasa'); await d.interact(); await d.interact();
  await d.milestone('alakazamita_unica', (s) => s.bag.ALAKAZITE !== 1 ? 'recompensa repetida o ausente' : null);
  await d.walkTo(R.talasa.entry.x, R.talasa.entry.y); await d.step(2); await d.settle();
  await d.milestone('regreso_talasa', (s) => s.map !== 'estacion_talasa' || s.x !== R.talasa.return.x || s.y !== R.talasa.return.y ? 'retorno inseguro' : null);
}

async function guardians(d) {
  for (const g of GUARDIANS) {
    await d.load(g.map, g.x, g.y + 1, 8);
    await installBastionHelpers(d.page);
    if (g.key === 'casilda') {
      const before = await d.eval(() => window.__bastion.weak());
      await d.faceEvent(`b22e_guardian_${g.key}`); await d.interact({ timeout: 180000 });
      await d.milestone('revancha_derrota_segura', (s) => s.flags.b22e_revancha_casilda_ganada
        || s.bastion.battles.at(-1)?.outcome !== 'lose' || s.bastion.now.money !== before.money || s.bastion.now.heal !== before.heal
        ? 'derrota alteró el punto de cura/dinero o marcó victoria' : null);
      await d.eval(async () => {
        const { createPokemon } = await import('/src/battle/core/pokemon.js'), s = window.__e2e.engine.state;
        s.setParty([createPokemon(window.__e2e.engine.data, 'MEWTWO', 100, { moves: ['PSYSTRIKE', 'AURASPHERE', 'ICEBEAM', 'FLAMETHROWER'], rng: () => 0.5 })]);
        window.__map.refreshFollower();
      });
    }
    await d.faceEvent(`b22e_guardian_${g.key}`); await d.interact({ timeout: 240000 });
    await d.milestone(`revancha_${g.key}`, (s) => !s.flags[`b22e_revancha_${g.key}_ganada`] || s.bastion.battles.at(-1)?.outcome !== 'win' ? 'sin revancha real' : null);
    const count = (await d.snapState()).bastion.battles.length;
    await d.faceEvent(`b22e_guardian_${g.key}`); await d.interact();
    await d.milestone(`descanso_${g.key}`, (s) => s.bastion.battles.length !== count ? 'revancha sin descanso' : null);
  }
}

async function bastion(d) {
  await d.load('mar_del_sur', BASTION.sea.x - 1, BASTION.sea.y, 6);
  await installBastionHelpers(d.page);
  await d.faceEvent('b22e_barca_bastion'); await d.interact();
  await d.milestone('barca_bastion', (s) => s.map !== 'bastion_axis' ? 'sin barca' : null);
  await d.walkTo(BASTION.hallOutside.x, BASTION.hallOutside.y, { face: 8 }); await d.step(8); await d.settle();
  await d.milestone('recepcion', (s) => s.map !== 'bastion_recepcion' ? 'sin recepción' : null);
  await d.faceEvent('reglas_bastion'); await d.interact();
  await d.expectSaid(/copias curadas a nivel 50/, 'reglas del Bastión');
  await d.faceEvent('recepcion_bastion'); d.want.push('Inscribir equipo');
  const manualBag = d.page.waitForFunction(() => window.__bastion.bagProof.waiting
    && window.__e2e.engine.scenes.stack.some((e) => e.scene.command?.active), null, { timeout: 300000 })
    .then(async () => { await d.shot('mochila_manual'); await d.press('ArrowRight'); await d.press('KeyZ'); });
  await Promise.all([manualBag, d.interact({ timeout: 900000, watch: [{ scene: 'BattleScene', name: 'arena_real' }] })]);
  await d.milestone('mochila_sellada', (s) => s.bastion.bagProof.choice !== 'bag' || !s.bastion.bagProof.notice
    || s.bastion.before.bag !== s.bastion.now.bag ? 'Mochila accesible o inventario alterado' : null);
  await d.milestone('ronda_siete', (s) => s.vars.b22e_bastion_racha !== 7 || !s.flags.b22e_bastion_ronda ? 'sin siete victorias' : null);
  await d.milestone('copias_nivel_50', (s) => s.bastion.requests.length !== 7 || s.bastion.requests.some((r) => !r.exhibition || r.player.some((p) => p.level !== 50 || p.status || p.hp <= 17))
    || JSON.stringify(s.bastion.before) !== JSON.stringify(s.bastion.now) ? 'se alteró la partida o no se curaron las copias' : null);
  await d.faceEvent('canje_bastion'); d.want.push('Caramelo Raro · 12 PB'); await d.interact();
  await d.milestone('canje_pb', (s) => s.vars.b22e_bastion_pb !== 7 || !s.bag.RARECANDY ? 'sin canje real' : null);
  const weak = await d.eval(() => window.__bastion.weak());
  await d.faceEvent('recepcion_bastion'); d.want.push('Inscribir equipo'); await d.interact({ timeout: 300000 });
  await d.milestone('derrota_segura', (s) => s.vars.b22e_bastion_racha !== 0 || s.vars.b22e_bastion_record !== 7 || s.vars.b22e_bastion_pb !== 7
    || s.bastion.battles.at(-1).outcome !== 'lose' || JSON.stringify(s.bastion.now) !== JSON.stringify(weak) ? 'derrota alteró la partida o el registro' : null);
  await d.walkTo(RECEPTION.entry.x, RECEPTION.entry.y); await d.step(2); await d.settle();
  await d.faceEvent('barquero_bastion'); await d.interact();
  await d.milestone('regreso_mar', (s) => s.map !== 'mar_del_sur' ? 'sin regreso al mar' : null);
}

async function taller(d) {
  await d.load('grieta_porvenir', ...IRON_ROOM.entry, 8);
  for (const [x, y, dir] of [[44, 9, 2], [35, 10, 2], [34, 12, 6], [43, 7, 2], [44, 11, 4], [42, 12, 8]]) {
    await d.walkTo(x, y, { face: dir }); await d.interact();
  }
  await d.milestone('colocacion_sin_solucion', (s) => s.flags.b22e_taller_resuelto || s.vars.b22e_bloques[0].join(',') !== '42,5' ? 'sin reproducción' : null);
  await d.faceEvent('b22e_palanca_taller'); await d.interact();
  await d.milestone('reinicio_total', (s) => JSON.stringify(s.vars.b22e_bloques) !== JSON.stringify(IRON_ROOM.blocks) ? 'quedó un encaje permanente' : null);
  for (const step of solve(IRON_ROOM)) { await d.walkTo(...step.stand, { face: step.dir }); await d.interact(); }
  await d.catch('ferropalmas');
  await d.faceEvent('b22e_palanca_taller'); await d.interact();
  await d.milestone('plataforma_conservada', (s) => !s.flags.b22e_taller_resuelto || !s.flags.b22e_ferropalmas_capturado ? 'se deshizo la plataforma' : null);
  await d.walkTo(24, 59); await d.step(2); await d.settle();
  await d.milestone('salida_segura', (s) => s.map !== 'mirador_sur' ? 'sin salida' : null);
}

async function grieta(d) {
  await d.load('mirador_sur', 28, 19, 8);
  await d.interact(); await d.settle();
  await d.milestone('bajada_porvenir', (s) => s.map !== 'grieta_porvenir' ? 'sin descenso desde el Mirador' : null);
  await d.walkTo(24, 44); await d.walkTo(24, 31);
  await d.milestone('cauce_a_pie', (s) => !s.flags.b22e_ferrodada_aparecida ? 'no recorrió el cauce' : null);
  await d.catch('ferrodada');
  await d.camp('Hasta la noche');
  await d.walkTo(42, 26); await d.waitCapture('ferrosaco');
  await d.milestone('ferrosaco', (s) => !s.flags.b22e_ferrosaco_capturado ? 'sin espera de cinco segundos' : null);
  await d.walkTo(4, 30); await d.waitCapture('ferropolilla');
  await d.milestone('ferropolilla', (s) => !s.flags.b22e_ferropolilla_capturado ? 'sin luz de Zygarde' : null);
  await d.camp('Hasta el amanecer'); await d.catch('ferrocuello');
  for (const step of solve(IRON_ROOM)) {
    await d.walkTo(...step.stand, { face: step.dir }); await d.interact();
  }
  await d.milestone('taller_encajado', (s) => !s.flags.b22e_taller_resuelto ? 'bloques incompletos' : null);
  await d.catch('ferropalmas');
  // La tormenta se obtiene en la posada real y se vuelve por el mismo camino.
  await d.walkTo(24, 59); await d.step(2); await d.settle();
  await d.walkTo(14, 39); await d.step(2); await d.settle();
  if ((await d.snapState()).map !== 'ciudad_lumina') throw new Error('sin descenso a Lúmina');
  await d.walkTo(OUTSIDE.hotel.x, OUTSIDE.hotel.y, { face: 8 });
  await d.step(8); await d.settle();
  if ((await d.snapState()).map !== 'lumina_hotel') throw new Error('sin entrada al Hotel Mirador');
  await d.faceEvent('recepcionista'); d.want.push('Descansar hasta tormenta'); await d.interact();
  const E = INTERIOR_ENTRY.lumina_hotel;
  await d.walkTo(E.x, E.y); await d.step(2); await d.settle();
  await d.walkTo(34, 0); await d.step(8); await d.settle();
  await d.walkTo(28, 19, { face: 8 }); await d.interact(); await d.settle();
  await d.catch('ferropuas');
  await d.camp('Hasta mediodía'); await d.catch('ferropaladin');
  await d.milestone('siete_paradojas', (s) => PARADOXES.some((p) => !s.caught.includes(p.species)) || !s.flags.b22e_paradojas_todas ? 'faltan capturas' : null);
  await d.walkTo(24, 59); await d.step(2); await d.settle();
  await d.milestone('regreso_mirador', (s) => s.map !== 'mirador_sur' ? 'sin regreso' : null);
}

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f));
const browser = await chromium.launch({ executablePath: CHROME, headless: !process.argv.includes('--headed'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = []; let d;
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', (e) => errors.push(e.stack || e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/favicon')) errors.push(`${r.status()} ${r.url()}`); });
  d = new PostDriver(page, errors, { outDir: OUT, root: ROOT, prefix: `e2e_b22e_${arg('only', 'grieta')}` });
  const mode = arg('only', 'grieta');
  if (mode === 'grieta') await grieta(d);
  else if (mode === 'bastion') await bastion(d);
  else if (mode === 'taller') await taller(d);
  else if (mode === 'rooms') await rooms(d);
  else if (mode === 'guardians') await guardians(d);
  else throw new Error(`Modo E2E desconocido: ${mode}`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`✔ B22e ${d.milestones.join(' → ')}`);
} catch (e) {
  await d?.shot('fallo').catch(() => {});
  const s = await d?.snapState().catch(() => null);
  if (s) console.error(JSON.stringify({ map: s.map, x: s.x, y: s.y, dir: s.dir, top: s.top, busy: s.busy,
    lastText: s.lastText, vars: Object.fromEntries(Object.entries(s.vars).filter(([k]) => k.startsWith('b22e_'))) }));
  console.error(e.stack || e.message); if (errors.length) console.error(errors.join('\n'));
  process.exitCode = 1;
} finally { await browser.close(); }
