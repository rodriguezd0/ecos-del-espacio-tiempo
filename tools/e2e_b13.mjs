// Recorrido E2E del Bloque 13 — Interludio 6: Estación Talasa, Islote Lumbre y Volcán Tizón (docs/CAMPANA.md B13;
// TABLILLAS T11, T12) en navegador real (Chrome headless + playwright-core), con teclas reales. Estado de entrada por
// URL (ARCHITECTURE §9): P1–P6 restaurados, zyg_50 (Nadar), tres núcleos, 56 células (C001–C056) más las de la
// etapa F de otras zonas (C068–C076, ya recogidas en bloques anteriores), planos de Nilo y Nilo desertor (B11),
// equipo alto, de día y sin encuentros aleatorios.
// Tramos (--from=… empieza en uno y sigue; --only=… hace solo uno):
//   mar     muelle de buzos (aviso del Core) → Mar del Sur (llamada de Alerce, C061, C062, C057, C058)
//   talasa  Alerce en barca · control · invernadero · despacho · laboratorio (doble con Alerce, derrota y reintento,
//           escena clave, Vértice, N4) · despedida (Porygon de Nilo, «Ha dejado de contestar») · salida b13_talasa
//   caleta  a nado a Caleta · resonancia del Buceo (hito b13_dive_resonance) · Ramón (segunda pista de T11)
//   buceo   Buceo genérico en la dársena de Talasa (punto equivalente, C087, emerger)
//   lumbre  T11 completa (baile de noche, gruta, Lucía, Tabla Duende, C063) y la fiesta de los farolillos
//   tizon   T12 completa (C066, C067, Brasa, coladas y respiraderos, jefa de perforación, Tabla Llama, forja)
// Capturas tools/cache/screens/e2e_b13_<nn>_<hito>.png y transcripción e2e_b13_dialogos.txt.
// Uso: node tools/e2e_b13.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--from=tramo | --only=tramo]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b13_driver.mjs';
import { mar, talasaArrival, talasa, caleta } from './e2e_b13_steps.mjs';
import { buceo, lumbre, tizon } from './e2e_b13_islands.mjs';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (name, def) => (argv.find((a) => a.startsWith(`--${name}=`)) || `--${name}=${def}`).slice(name.length + 3);
const BASE = arg('base', 'http://localhost:8080');
const RETRY = !argv.includes('--no-retry');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const ENTRY_FLAGS = [
  'b01_dex_received', 'b01_left_town', 'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored',
  'zyg_10', 'zyg_50', 'b09_gala', 'b11_planos_talasa', 'b11_nilo_desertor',
];
const TALASA_DONE = [
  'b13_mar_llamada', 'b13_talasa_llegada', 'b13_talasa_invernadero', 'b13_talasa_tarjeta', 'b13_talasa_foto', 'b13_talasa_lab_dentro',
  'b13_talasa_combate', 'b13_talasa_n4', 'b13_talasa', 'b13_alerce_gael', 'b13_nilo_porygon', 'b13_buceo_pista',
];
const DIVE_DONE = ['b13_dive_resonance', 'b13_buceo_escena', 'zyg_dive', 'b13_t11_ramon'];
/** Células de la etapa F de otras zonas (Caudal, Garganta, Zaguán, Reserva, Marisma, Ruta 4, Mnemos, Nexo, Monte). */
const OTHER_F_CELLS = ['C068', 'C069', 'C070', 'C071', 'C072', 'C073', 'C074', 'C075', 'C076'];
/** Células del B13 ya recogidas cuando se empieza en un tramo posterior. */
const B13_EARLY_CELLS = ['C057', 'C058', 'C059', 'C060', 'C061', 'C062'];

const url = ({ map, x, y, dir = 2, flags = [], zygarde = 'run,ram,terrain,climb,swim', zcores = 3, time = 11 }) => new URLSearchParams({
  scene: 'map', map, x: String(x), y: String(y), dir: String(dir),
  party: 'GARCHOMP:78,METAGROSS:76,GYARADOS:75,LUCARIO:75', fragments: '6', noenc: '1', time: String(time),
  zygarde, zcells: '56', zcores: String(zcores), vars: 'starter:TURTWIG,gael_starter:LITTEN',
  flags: [...ENTRY_FLAGS, ...flags].join(','),
}).toString();

const r = CL.DIVERS.resonance;
const TRAMOS = [
  { id: 'mar', run: mar, start: { url: url({ map: 'caleta_sonda', x: r.x, y: r.y - 2 }), cells: OTHER_F_CELLS, loseOnce: [] } },
  {
    id: 'talasa',
    run: async (d) => { await talasaArrival(d); await talasa(d, { retry: RETRY }); },
    start: { url: url({ map: 'estacion_talasa', x: TAL.JETTY.x + 1, y: TAL.JETTY.y + 1, flags: ['b13_mar_llamada'] }), cells: [...OTHER_F_CELLS, 'C057', 'C058', 'C061', 'C062'] },
    loseOnce: ['b13_casia'],
  },
  { id: 'caleta', run: caleta, start: { url: url({ map: 'caleta_sonda', x: r.x, y: r.y - 3, flags: TALASA_DONE, zcores: 4 }), cells: [...OTHER_F_CELLS, ...B13_EARLY_CELLS] } },
  {
    id: 'buceo', run: buceo,
    start: { url: url({ map: 'estacion_talasa', x: TAL.LADDER.x, y: TAL.LADDER.y, dir: 6, flags: [...TALASA_DONE, ...DIVE_DONE], zcores: 4, zygarde: 'run,ram,terrain,climb,swim,dive' }), cells: [...OTHER_F_CELLS, ...B13_EARLY_CELLS] },
  },
  {
    id: 'lumbre', run: lumbre,
    start: { url: url({ map: 'caleta_sonda', x: r.x, y: r.y - 1, flags: [...TALASA_DONE, ...DIVE_DONE], zcores: 4, zygarde: 'run,ram,terrain,climb,swim,dive' }), cells: [...OTHER_F_CELLS, ...B13_EARLY_CELLS] },
  },
  {
    id: 'tizon', run: (d) => tizon(d, { retry: RETRY }),
    start: { url: url({ map: 'mar_del_sur', x: 182, y: 39, dir: 6, flags: [...TALASA_DONE, ...DIVE_DONE], zcores: 4, zygarde: 'run,ram,terrain,climb,swim,dive' }), cells: [...OTHER_F_CELLS, ...B13_EARLY_CELLS] },
    loseOnce: ['b13_jefa_perforacion'],
  },
];
// Tramos que siguen sin recargar (el estado pasa de uno a otro): mar → talasa → caleta.
const CONTINUES = { talasa: 'mar', caleta: 'talasa' };

const FROM = arg('from', 'mar');
const ONLY = arg('only', '');
const first = ONLY || FROM;
if (!TRAMOS.some((t) => t.id === first)) throw new Error(`tramo desconocido: ${first} (${TRAMOS.map((t) => t.id).join(', ')})`);
const selected = ONLY ? TRAMOS.filter((t) => t.id === ONLY) : TRAMOS.slice(TRAMOS.findIndex((t) => t.id === FROM));

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const logs = [];
  let d = null;
  let failed = null;
  const t0 = Date.now();
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
    page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
    d = new Driver(page, errors, { outDir: OUT, root: ROOT });
    let prev = null;
    for (const t of selected) {
      const chained = prev && CONTINUES[t.id] === prev;
      if (!chained) {
        logs.push(...await d.log().catch(() => []));
        // Las derrotas simuladas se instalan con la página: se juntan las de los tramos encadenados que siguen.
        const chain = [t];
        for (let k = selected.indexOf(t) + 1; k < selected.length && CONTINUES[selected[k].id] === chain[chain.length - 1].id; k++) chain.push(selected[k]);
        const loseOnce = RETRY ? chain.flatMap((c) => c.loseOnce || []) : [];
        await d.goto(`${BASE}/?${t.start.url}&debug`, { loseOnce });
        const n = await d.eval((ids) => window.__b13.addCells(ids), t.start.cells);
        console.log(`· tramo ${t.id} (${n} células al empezar)`);
      } else console.log(`· tramo ${t.id}`);
      await t.run(d);
      prev = t.id;
    }
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
    if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  } catch (err) {
    failed = err;
    await d?.shot('fallo').catch(() => {});
  } finally {
    const log = [...logs, ...(d ? await d.log().catch(() => []) : [])];
    fs.writeFileSync(path.join(OUT, 'e2e_b13_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
    await browser.close();
    const secs = Math.round((Date.now() - t0) / 1000);
    console.log(`Hitos: ${(d?.milestones || []).join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b13_dialogos.txt)`);
  }
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ Bloque 13: ${selected.map((t) => t.id).join(', ')} sin fallos.`);
  }
}

await main();
