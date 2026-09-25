// Tramos del recorrido E2E del Bloque 21 (tools/e2e_b21.mjs). Estado de entrada de CAMPANA B21: p10_restored y
// b20_flute (más lo que implica haber jugado los bloques anteriores: Villa Alba tras B01 y B11, Pilares P1–P10, Forma
// Completa). Las casillas salen de los mismos módulos puros que usa el juego.
import { COLUMNA } from '../game/src/content/maps/b21/layout.js';
import { DEV_NODE } from '../game/src/content/maps/b21/dev_nodo_origen.js';
import { EPI } from '../game/src/content/events/b21_epilogo.js';
import { F } from '../game/src/content/events/b21_common.js';
import { MONTAGE_SHOTS } from '../game/src/content/events/b21_cine.js';
import { RESOLUTION_TEXT, BATTLE_TEXT, EPILOGUE_TEXT, ZYGARDE_TEXT } from '../game/src/content/events/b21_texts.js';

const need = (cond, msg) => (cond ? null : msg);
const has = (s, f) => Boolean(s.flags[f]);

/** Lo que dejó el resto de la campaña (para que Villa Alba, el montaje y los créditos no repitan escenas de llegada). */
const STORY = [
  'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_dex_received', 'b01_mom_gift', 'b01_left_town', 'b02_libreta',
  'b11_regreso', 'b11_huevo', 'b11_gael_alerce', 'b11_gael_b4', 'b08_camara_vista', 'b08_cerro_visto', 'b10_hondo_visto',
  'b10_llegada', 'b10_niebla_levantada', 'b13_talasa', 'b15_n5', 'b16_hito',
  ...Array.from({ length: 10 }, (_, i) => `p${i + 1}_restored`), ...Array.from({ length: 10 }, (_, i) => `verse_${i + 1}`),
  'zyg_10', 'zyg_50', 'zyg_complete', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_core_5', 'zyg_dive',
  'b20_flute', 'b20_nucleo_visto',
  // B17 (opcional): el Círculo del Jardín en pie → toma de los Clefairy en el montaje; Mamá ya contó lo de la danza.
  'b17_circulo_mama', 'b17_circulo_danza', 'b17_circulo', 'b17_circulo_piedras',
];
const AFTER = {
  salto: [F.jumpWarned, F.jumpDone, F.lanzaArrival, 'zyg_jump_seen'],
  cumbre: [F.zygardeAsked, F.zygardeJoined, F.arceusAwake, F.arceusDone, F.arceusCaught, F.tabletsComplete, F.axisRepaired, F.finalResolved, F.gameCleared, 'verse_confirmation'],
  pueblo: [F.epilogueBack, F.epilogueOlmedo, F.epilogueMom, F.alerceKeyGiven, F.montageDone, F.momInside],
  gael: [F.gaelHouseSeen, F.gaelNoteRead, F.gaelEggGiven],
};
const flagsUpTo = (stage) => {
  const keys = Object.keys(AFTER);
  const i = keys.indexOf(stage);
  return (i < 0 ? keys : keys.slice(0, i)).flatMap((k) => AFTER[k]);
};
const entry = (stage, over = {}) => new URLSearchParams({
  scene: 'map', party: 'MEWTWO:100', fragments: '10', noenc: '1', time: '12', core: '1', zygarde: 'all', zform: 'complete',
  zcells: '100', zcores: '5',
  vars: 'gael_starter:SOBBLE,starter:TURTWIG,p9_choice:PALKIA', ...over,
  flags: [...STORY, ...flagsUpTo(stage), ...(over.flags ? [over.flags] : [])].join(','),
});

/** Capacidades de campo tras el Salto (jump) y la resolución (anchor) para los tramos que empiezan en el epílogo. */
const AFTER_JUMP = 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor';

/** Nodo del Origen: el de B20 (nucleo_origen) si está registrado; si no, la maqueta dev_nodo_origen. */
export const NODE = {
  b20: { map: 'nucleo_origen', x: 10, y: 16, dir: 8, event: 'nucleo_origen' },
  dev: { map: 'dev_nodo_origen', x: DEV_NODE.x, y: DEV_NODE.y, dir: 8, event: 'b21_nodo_origen' },
};

const STARTS = {
  salto: (node) => entry('salto', { map: node.map, x: String(node.x), y: String(node.y), dir: String(node.dir) }),
  cumbre: () => entry('cumbre', { map: 'columna_lanza', x: String(COLUMNA.arrival.x), y: String(COLUMNA.arrival.y), dir: '8' }),
  retirada: () => entry('cumbre', {
    map: 'columna_lanza', x: String(COLUMNA.flute.x), y: String(COLUMNA.flute.y), dir: '8',
    flags: [F.zygardeAsked, F.zygardeJoined, F.arceusAwake].join(','),
  }),
  gael: () => entry('gael', { map: 'villa_alba', x: String(EPI.meet.x), y: String(EPI.meet.y), dir: '8', time: '18', zygarde: AFTER_JUMP }),
  final: () => entry('final', { map: 'villa_alba', x: '10', y: '27', dir: '8', time: '18', zygarde: AFTER_JUMP }),
};
export const startUrl = (stage, node) => STARTS[stage](node);
export const ORDER = ['salto', 'cumbre', 'gael', 'final', 'retirada'];
/** Tramos que cargan su propia URL aunque se venga del anterior. */
export const FRESH = new Set(['retirada']);
/** Opciones del piloto por tramo (derrota forzada en la fase indicada). */
export const PILOT = { cumbre: { forfeitAt: 1 }, retirada: { forfeitAt: 0 } };

// ───────────────────────────── tramos ─────────────────────────────

async function salto(d, { node }) {
  const pos = await d.eval((id) => window.__b21.eventPos(id), node.event);
  if (!pos?.alive) throw new Error(`El Nodo del Origen (${node.event}) no está activo en ${node.map}`);
  // El de B20 es sólido (se usa desde la casilla de abajo); el de la maqueta se pisa.
  if (node.map === 'dev_nodo_origen') await d.walkTo(pos.x, pos.y, { face: 8 });
  else await d.walkTo(pos.x, pos.y + 1, { face: 8 });
  d.want = ['Sí'];
  await d.interact({ timeout: 120000, watch: [
    { name: 'salto_aviso', re: /No podrás volver/ },
    { name: 'salto_estelas', when: (s) => s.jumping, delay: 6000 },
  ] });
  await d.until((s) => s.map === 'columna_lanza' && has(s, F.lanzaArrival) && !s.busy, { timeout: 90000, what: 'llegada a Columna Lanza' });
  await d.milestone('columna_llegada', async (s) => need(has(s, F.jumpDone) && s.zygarde.form === 'complete' && s.zygarde.jump, 'Salto sin Forma Completa ni capacidad'));
}

async function cumbre(d) {
  // «Todavía no»: la escena espera.
  d.want = ['Todavía no'];
  await d.walkTo(COLUMNA.question.x0 + 2, COLUMNA.question.y + 1, { face: 8 });
  await d.step(8);
  await d.settle({ watch: [{ name: 'zygarde_pregunta', re: /Antes de despertarlo/ }] });
  await d.milestone('zygarde_espera', async (s) => need(has(s, F.zygardeAsked) && !has(s, F.zygardeJoined), 'la pregunta no esperó'));
  // Al altar: Zygarde vuelve a preguntar → «Sí» → el Arca (equipo lleno) → la Flauta → Arceus.
  d.want = ['Sí', 'Sí', 'Reintentar fase'];
  await d.walkTo(COLUMNA.flute.x, COLUMNA.flute.y, { face: 8 });
  await d.interact({ timeout: 900000, watch: [
    { name: 'honor_ball', re: /Honor Ball/ },
    { name: 'zygarde_toca', re: /se acerca y la toca/ },
    { name: 'zygarde_equipo', re: /se ha unido a tu equipo/ },
    { name: 'flauta', re: /toca la Flauta Azur/ },
    { name: 'arceus_despierta', re: /Despierto para medir/ },
    { name: 'combate_fase1', when: (s) => s.top === 'BattleScene', delay: 4000 },
    { name: 'reintentar', re: /Arceus espera/ },
    { name: 'tablillas', re: /dieciocho Tablillas/ },
    { name: 'confirmacion', re: /Respondiste a la llamada/ },
    { name: 'cielo', re: /La aurora se apaga/ },
  ], onBusy: async (s) => { if (s.jumping) { await d.press('KeyZ', 400); return true; } return false; } });
  await d.until((s) => s.map === 'villa_alba' && has(s, F.momInside) && !s.busy, { timeout: 300000, what: 'fin de la parte guiada del pueblo' });
  await d.milestone('pueblo_libre', async (s) => {
    const party = await d.eval(() => window.__b21.party());
    const z = party.find((p) => p.species === 'ZYGARDE');
    const boxed = await d.eval(() => window.__b21.boxed());
    const tabs = await d.eval(() => window.__b21.tablets());
    const crisis = await d.eval(() => window.__b21.crisis());
    const pilot = await d.eval(() => window.__b21.pilot.log.slice());
    const balls = await d.eval(() => window.__b21.items('POKEBALL'));
    return need(z && z.form === 2 && z.level === 70 && z.ball === 'PREMIERBALL' && z.ability === 'POWERCONSTRUCT', `Zygarde del equipo: ${JSON.stringify(z)}`)
      || need(boxed.includes('LUCARIO'), `el Arca no envió al PC al elegido (${boxed})`)
      || need(tabs.length === 18, `Tablillas: ${tabs.length}`)
      || need(has(s, F.arceusCaught) && has(s, F.gameCleared) && has(s, F.alerceKeyGiven) && has(s, F.montageDone), 'faltan flags de la resolución o el epílogo')
      || need(crisis === 5, `cielo de crisis: fase ${crisis}`)
      || need(balls === 10, `la Poké Ball bloqueada se gastó (${balls})`)
      || need(pilot.some((l) => /derrota forzada en la fase 1/.test(l)), `sin derrota en la fase 2: ${pilot}`);
  });
  await d.expectSaid(new RegExp(BATTLE_TEXT.held('Terrax')), 'la Ball bloqueada en la fase Tierra');
  await d.expectSaid(/Otra vez tú\./, 'la línea de Olmedo');
  await d.expectSaid(/Hay cosas ahí que debería haber enseñado hace tiempo/, 'la línea de Alerce');
  await d.expectSaid(new RegExp(RESOLUTION_TEXT.axis.PALKIA.slice(0, 30)), 'el eje no elegido (Dialga, tiempo) reparado');
}

async function gael(d) {
  await d.walkTo(9, 13, { face: 8 });
  await d.pushUntil(8, (s) => s.map === 'casa_gael', 'entrar en casa de Gael', { watch: [{ name: 'casa_gael', re: /casa de Gael/ }] });
  await d.walkTo(EPI.gaelTable.x + 1, EPI.gaelTable.y, { face: 4 });
  await d.interact({ watch: [{ name: 'nota_gael', re: /Para que tu Pokédex/ }] });
  // Equipo lleno (Zygarde se unió y Arceus fue al PC): el Huevo espera en la mesa.
  await d.milestone('huevo_espera', async (s) => need(has(s, F.gaelNoteRead) && has(s, F.gaelEggWaiting) && !has(s, F.gaelEggGiven), 'el Huevo no esperó con el equipo lleno'));
  await d.eval(() => window.__b21.deposit(3));
  await d.interact({ watch: [{ name: 'huevo_recibido', re: /Huevo/ }] });
  await d.milestone('huevo_gael', async (s) => {
    const party = await d.eval(() => window.__b21.party());
    const egg = party.find((p) => p.egg);
    return need(has(s, F.gaelNoteRead) && has(s, F.gaelEggGiven), 'sin nota o sin huevo') || need(egg?.species === 'SOBBLE', `huevo: ${JSON.stringify(egg)}`);
  });
  await d.walkTo(7, 10);
  await d.exitTo(2, 'villa_alba');
}

async function final(d) {
  d.want = ['No'];
  await d.walkTo(10, 26, { face: 8 });
  // Al cruzar la puerta salta la tele (auto) y todo sigue de corrido hasta el despertar: los hitos van en el empuje.
  const opts = { timeout: 600000, watch: [
    { name: 'tele', re: /abandonado Axis en un carguero/ },
    { name: 'carguero', re: /Juraría que lo llevaba encima/ },
    { name: 'creditos', when: (s) => s.cinematic && !['carguero', 'casa_prota_1f', 'villa_alba'].includes(s.map), delay: 1200 },
    { name: 'creditos_pueblo', when: (s) => s.cinematic && s.map === 'villa_alba', delay: 400 },
    { name: 'despertar', re: /Sigo entero/ },
  ] };
  await d.pushUntil(8, (s) => s.map !== 'villa_alba', 'entrar en casa', opts);
  await d.settle(opts);
  await d.milestone('postgame', async (s) => {
    const z = await d.eval(() => window.__b21.zygarde());
    return need(s.map === 'casa_prota_2f', `no despierta en el cuarto (${s.map})`)
      || need(has(s, F.creditsDone) && has(s, F.epilogueEnd) && has(s, F.tvNews), 'faltan flags del final')
      || need(z.form === 'complete' && z.anchor, `Zygarde: ${JSON.stringify(z)}`);
  });
  await d.expectSaid(new RegExp(EPILOGUE_TEXT.zygardeStays), 'Zygarde se queda en Forma Completa');
}

async function retirada(d) {
  d.want = ['Sí', 'Retirarse'];
  await d.walkTo(COLUMNA.flute.x, COLUMNA.flute.y, { face: 8 });
  await d.interact({ timeout: 300000, watch: [{ name: 'retirarse', re: /Arceus espera/ }] });
  await d.milestone('retirada', async (s) => {
    const party = await d.eval(() => window.__b21.party());
    const vars = await d.eval(() => window.__b21.vars());
    return need(s.map === 'columna_lanza' && s.x === COLUMNA.retreat.x && s.y === COLUMNA.retreat.y, `no está en la antecámara (${s.x},${s.y})`)
      || need(party.every((p) => p.hp > 0), 'el equipo no se curó')
      || need(vars.b21_arceus_fase === 0, `fase guardada ${vars.b21_arceus_fase}`)
      || need(!has(s, F.arceusDone), 'Arceus superado sin combatir');
  });
  await d.expectSaid(new RegExp(BATTLE_TEXT.retreat), 'el aviso de la retirada');
}

export const STAGES = { salto, cumbre, gael, final, retirada };
export { MONTAGE_SHOTS, ZYGARDE_TEXT };
