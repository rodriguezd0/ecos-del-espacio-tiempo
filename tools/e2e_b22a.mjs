// B22a: teclas reales, Anclaje, caídas/reintentos, capturas y regresos. --only=giratina|senda|columna|alma.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b16_driver.mjs';
import { installB22aHelpers } from './e2e_b22a_page.mjs';
import { SABER, QUERER, SENTIR } from '../game/src/content/maps/b16/santuario_layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools/cache/screens');
fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') || d;
const BASE = arg('base', 'http://localhost:8080');
const flags = ['b01_woke', 'b01_starter_chosen', 'b01_core_found', 'b01_dex_received', 'b01_left_town',
  'b12_aljibe_abierto', 'b20_flute', 'b20_nucleo_visto', 'b21_salto', 'b21_llegada', 'b21_regreso',
  'b21_mama_casa', 'b21_resolucion', 'b21_creditos', 'game_cleared', 'b21_fin', 'b21_arceus_debilitado',
  'b16_santuario_visto', 'b16_saber_glifos', 'b16_saber_tres', 'b16_saber_cuatro',
  'b16_hebra_saber', 'b16_hebra_sentir', 'b16_hebra_querer', 'b16_telar', 'b16_telar_abierto',
  'b16_recuerdo_gael', 'b16_querer_viento', 'b16_azelf_vencido', 'b16_hito',
  ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`),
  ...Array.from({ length: 3 }, (_, i) => `b16_sentir_espejo_${i + 1}`)];

class PostDriver extends Driver {
  snapState() {
    return this.eval(() => ({ ...window.__e2e.snap(), choices: window.__b22a.choices(),
      vars: { ...window.__e2e.engine.state.data.vars }, battles: window.__b22a.battles.slice(),
      bag: { ...window.__e2e.engine.state.data.bag },
      caught: [...window.__e2e.engine.state.party, ...window.__e2e.engine.state.data.boxes.flat()].filter(Boolean).map((p) => p.species),
    }));
  }
  async load(map, x, y, dir = 8, opts = {}) {
    const params = new URLSearchParams({ debug: 1, scene: 'map', map, x, y, dir, noenc: 1, party: 'BLISSEY:100',
      fragments: 10, core: 1, zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor', zform: 'complete', zcells: 100, zcores: 5,
      flags: [...flags, ...(opts.flags || [])].join(','), vars: 'p9_choice:DIALGA,p9_chosen_caught:true,rest_count:1,b22a_arceus_descanso:0' });
    await this.page.goto(`${BASE}/?${params}`, { waitUntil: 'load' });
    await this.page.waitForFunction(() => window.__map?.ready, null, { timeout: 30000 });
    await installB22aHelpers(this.page, opts);
    await this.settle();
    await this.turn(dir);
  }
  async anchor(face, x, y, dir, phase) {
    await this.walkTo(x, y, { face: dir });
    for (let n = 0; n < 8; n++) {
      const s = await this.snapState();
      if (s.vars[`b22a_cara_${face}`] != null) {
        this.want.push('Soltarla'); await this.interact();
      }
      await this.page.waitForFunction(([id, o]) => window.__b22a.rotor(id) === o, [face, phase], { polling: 'raf', timeout: 30000 });
      this.want.push('Anclarla así'); await this.interact();
      if ((await this.snapState()).vars[`b22a_cara_${face}`] === phase) return;
    }
    throw new Error(`No se ancló ${face} en orientación ${phase}`);
  }
}

async function giratina(d) {
  await d.load('pilar_invertido', 26, 22, 2, { mode: 'lose' });
  await d.interact();
  await d.until((s) => s.map === 'distorsion_honda', { what: 'descender por el aljibe' });
  await d.settle();
  await d.shot('hondura');
  const fall = await d.eval(async () => {
    const { isVoidCell } = await import('/src/world/impossible/logic.js');
    const w = window.__map.world, m = w.map, p = w.player;
    const candidates = [];
    for (let y = 32; y <= 37; y++) for (let x = 13; x <= 21; x++) {
      if (isVoidCell(m, x, y)) continue;
      const route = window.__b12.safeRoute(x, y);
      if (!route) continue;
      for (const [dir, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
        if (m.valid(x + dx, y + dy) && isVoidCell(m, x + dx, y + dy) && p.passable(x, y, dir)) candidates.push({ x, y, dir, n: route.length });
      }
    }
    return candidates.sort((a, b) => a.n - b.n)[0];
  });
  if (!fall) throw new Error('sin borde alcanzable para probar caída');
  await d.walkTo(fall.x, fall.y); await d.step(fall.dir); await d.settle();
  await d.milestone('caida_sin_dano', (s) => s.x !== 17 || s.y !== 35 ? 'no volvió al Ancla inicial' : null);
  await d.anchor('honda', 18, 33, 8, 0);
  await d.walkTo(17, 16, { face: 8 });
  await d.holdPath(Array(6).fill(8));
  await d.walkTo(17, 6, { stopWhen: (s) => s.map === 'distorsion_corazon' });
  await d.settle();
  await d.milestone('corazon', (s) => s.map !== 'distorsion_corazon' ? 'sin Corazón' : null);
  await d.anchor('sur', 19, 19, 8, 2);
  await d.anchor('oeste', 13, 13, 8, 1);
  // Volver por la cara sur antes de orientarla hacia el este: girarla desde
  // el lado oeste cerraría el único puente de regreso a esta plataforma.
  await d.anchor('sur', 19, 19, 8, 1);
  await d.anchor('este', 23, 13, 8, 3);
  await d.anchor('sur', 21, 15, 8, 0);
  await d.milestone('tres_caras', (s) => !s.flags.b22a_corazon_abierto ? 'no se abrió el Corazón' : null);
  await d.shot('corazon_abierto');
  await d.faceEvent('b22a_griseosfera'); await d.interact();
  await d.milestone('derrota_reintento', (s) => !s.bag.GRISEOUSORB || s.flags.b22a_giratina_capturado ? 'reintento incorrecto' : null);
  await d.eval(() => window.__b22a.mode('capture'));
  await d.faceEvent('b22a_giratina'); await d.interact();
  await d.milestone('giratina_capturado', (s) => !s.flags.b22a_giratina_capturado || !s.caught.includes('GIRATINA') || s.bag.POKEBALL !== 3 ? 'captura/ball incorrecta' : null);
  await d.walkTo(18, 11, { stopWhen: (s) => s.map === 'pilar_invertido' }); await d.settle();
  await d.milestone('regreso_aljibe', (s) => s.map !== 'pilar_invertido' ? 'sin regreso' : null);
}

async function senda(d) {
  await d.load('ruta_12_senda_lazo', 19, 3);
  await d.interact();
  await d.milestone('lazo_anclado', (s) => !s.flags.b22a_lazo_anclado ? 'nudo sin anclar' : null);
  await d.walkTo(20, 1, { stopWhen: (s) => s.map === 'cumbre_azur' }); await d.settle();
  await d.shot('cumbre_azur');
  await d.walkTo(15, 3, { stopWhen: (s) => s.map === 'columna_lanza' }); await d.settle();
  await d.milestone('columna_a_pie', (s) => s.map !== 'columna_lanza' ? 'sin Columna' : null);
  await d.walkTo(14, 35); await d.interact();
  await d.walkTo(15, 39, { stopWhen: (s) => s.map === 'ruta_12_senda_lazo' }); await d.settle();
  if ((await d.snapState()).map === 'cumbre_azur') { await d.step(2); await d.settle(); }
  await d.milestone('regreso_senda', (s) => s.map !== 'ruta_12_senda_lazo' ? 'sin Senda' : null);
}

async function columna(d) {
  await d.load('columna_lanza', 14, 31, 8, { lead: 'MEWTWO' });
  await d.faceEvent('b22a_plataforma_palkia'); await d.interact();
  await d.milestone('palkia_capturado', (s) => !s.flags.b22a_otro_capturado || !s.caught.includes('PALKIA') ? 'sin Palkia' : null);
  await d.faceEvent('b21_arceus'); await d.interact();
  await d.milestone('arceus_capturado', (s) => !s.flags.arceus_caught || !s.caught.includes('ARCEUS') ? 'sin Arceus' : null);
  await d.walkTo(14, 31); d.want.push('Laberinto de la Profundidad'); await d.interact();
  await d.milestone('red_convergencia', (s) => s.map !== 'laberinto_profundidad' ? 'sin destino del Salto' : null);
}

async function alma(d) {
  await d.load('santuario_alma', SABER.uxie.uxie.x, SABER.uxie.uxie.y + 1);
  d.want.push('Dialga'); await d.interact();
  await d.milestone('uxie_capturado', (s) => !s.flags.b22a_uxie_capturado ? 'sin Uxie' : null);
  await d.load('santuario_alma', QUERER.azelf.battleSpot.x, QUERER.azelf.battleSpot.y);
  await d.faceEvent('azelf'); await d.interact();
  await d.milestone('azelf_capturado', (s) => !s.flags.b22a_azelf_capturado ? 'sin Azelf' : null);
  await d.load('santuario_alma', SENTIR.mirrors[0].entry.x, SENTIR.mirrors[0].entry.y);
  // Mesprit camina: volver a planear desde las dos posiciones reales del espejo,
  // sin inmovilizarlo ni cambiar los flags del encuentro.
  for (let n = 0; n < 100 && !(await d.snapState()).flags.b22a_mesprit_capturado; n++) {
    await d.settle();
    if ((await d.snapState()).flags.b22a_mesprit_capturado) break;
    const route = await d.eval(async () => {
      const { MIRROR_ROOMS, mirrorStep } = await import('/src/content/events/b16_mirror_logic.js');
      const { SENTIR, floorTop } = await import('/src/content/maps/b16/santuario_layout.js');
      const w = window.__map.world, p = w.player, m = SENTIR.mirrors[0];
      const ref = w.events.find((e) => e.id === 'b22a_reflejo_1');
      const mes = w.events.find((e) => e.id === 'b22a_mesprit_espejo_1');
      if (!ref?.page || !mes?.page) return null;
      const start = [p.x - m.room.x, p.y - floorTop(m.room), ref.x - m.room.x, ref.y - floorTop(m.room)];
      const target = [mes.x - m.room.x, mes.y - floorTop(m.room)];
      const q = [{ pos: start, route: [] }], seen = new Set([start.join(',')]);
      for (let i = 0; i < q.length; i++) {
        const cur = q[i];
        if (Math.abs(cur.pos[2] - target[0]) + Math.abs(cur.pos[3] - target[1]) <= 1) return cur.route;
        for (const dir of [2, 4, 6, 8]) {
          const next = mirrorStep(MIRROR_ROOMS[0], cur.pos, dir);
          if (!next || seen.has(next.join(','))) continue;
          seen.add(next.join(',')); q.push({ pos: next, route: [...cur.route, dir] });
        }
      }
      return null;
    });
    if (!route) throw new Error('sin camino para acercar el reflejo a Mesprit');
    if (route.length) await d.step(route[0]);
    await d.page.waitForFunction(() => {
      const w = window.__map?.world, ev = w?.events.find((e) => e.id === 'b22a_reflejo_1');
      return w?.scriptBusy() || !ev?.page || (!ev.busy() && ev.b22a?.last?.[0] === w.player.x && ev.b22a.last[1] === w.player.y);
    }, null, { timeout: 10000 });
  }
  await d.settle();
  await d.milestone('mesprit_capturado', (s) => !s.flags.b22a_mesprit_capturado || !s.caught.includes('MESPRIT') ? 'sin encuentro por los reflejos' : null);
}

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f));
const browser = await chromium.launch({ executablePath: CHROME, headless: !process.argv.includes('--headed'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = [], transcript = [];
let d;
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', (e) => errors.push(e.stack || e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/favicon')) errors.push(`${r.status()} ${r.url()}`); });
  d = new PostDriver(page, errors, { outDir: OUT, root: ROOT, prefix: `e2e_b22a_${arg('only', 'all')}` });
  const stages = { giratina, senda, columna, alma };
  for (const [name, run] of Object.entries(stages)) {
    if (arg('only', '') && arg('only', '') !== name) continue;
    console.log(`— ${name}`);
    await run(d); transcript.push(...await d.log());
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`✔ B22a ${d.milestones.join(' → ')}`);
} catch (e) {
  await d?.shot('fallo').catch(() => {});
  const s = await d?.snapState().catch(() => null);
  if (s) console.error(JSON.stringify({ map: s.map, x: s.x, y: s.y, dir: s.dir, top: s.top, busy: s.busy,
    lastText: s.lastText, vars: Object.fromEntries(Object.entries(s.vars).filter(([k]) => k.startsWith('b22a_'))) }));
  const rotors = await d?.eval(() => window.__map?.world.events.filter((ev) => String(ev.id).includes('rotor')).map((ev) => ({
    id: ev.id, trigger: ev.page?.trigger, phase: ev.b22a?.phase, t: ev.b22a?.t, hold: ev.b22a?.hold,
  }))).catch(() => null);
  if (rotors) console.error(JSON.stringify(rotors));
  if (errors.length) console.error(errors.join('\n'));
  console.error(e.stack || e.message);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(OUT, `e2e_b22a_${arg('only', 'all')}_dialogos.txt`), transcript.map((l) => `${l.speaker}: ${l.text}`).join('\n'));
  await browser.close();
}
