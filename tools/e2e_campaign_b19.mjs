import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB19Observer} from './e2e_campaign_b19_page.mjs';
import { ARRIVAL, NPC, CAMP, PENA, DUEL, ARRIVAL_STRIP } from '../game/src/content/maps/b19/calzada_layout.js';
import { NICHE, ENTRY as TALLER_ENTRY } from '../game/src/content/maps/b19/taller_layout.js';
import { ARRIVALS, GAP_W, GAP_ALCOVE, GAP_FINAL, UMBRAL, EXITS } from '../game/src/content/maps/b19/sima_layout.js';
import { solutionSteps, spanDef } from '../game/src/content/events/b19_spans_logic.js';


const RETRY=false;
const has = (s, f) => Boolean(s.flags[f]);
const need = (ok, msg) => (ok ? null : msg);

// ───────────────────────────── Tramos ─────────────────────────────

async function antes(d) {
  const [sx, sy] = ARRIVAL_STRIP[0];
  await d.walkTo(sx + 1, sy - 1);
  await d.expectSaid(/Casandra, nuestra guía, se ha ido a Lúmina/, 'la espera de los Peregrinos');
  const stone = await d.eval(() => window.__b19.eventAlive('tramo_1_piedra_0'));
  await d.milestone('antes_del_p9', (s) => need(has(s, 'b19_llegada_antes') && !stone, `llegada ${has(s, 'b19_llegada_antes')}, piedra ${stone}`));
}

async function llegada(d) {
  const [sx, sy] = ARRIVAL_STRIP[0];
  await d.walkTo(sx + 1, sy - 1, { watch: [{ re: /Bienvenid[oa] a la Calzada del Rey/, name: 'bienvenida', delay: 200 }] });
  await d.expectSaid(/Casandra está junto al Resonador/, 'la bienvenida de Leocadia');
  const C = CAMP.casandra;
  await d.talk(C.x, C.y + 1, 'up', { watch: [{ re: /trozo cayó al Mirador Sur/, name: 'casandra_resonador', delay: 200 }] });
  await d.expectSaid(/lo arrojaron a la Sima/, 'el mito del Rey');
  await d.expectSaid(/una sola vez cada una, y terminando junto a la aguja/, 'la regla del tramo (narración)');
  const clue = await d.eval(() => window.__b19.clue('T15'));
  const tadeo = await d.eval(() => window.__b19.eventAlive('tadeo_paso'));
  await d.milestone('casandra', (s) => need(has(s, 'b19_llegada') && has(s, 'b19_casandra_intro') && clue?.step === 2 && !tadeo, `pista ${JSON.stringify(clue)}, Tadeo ${tadeo}`));
}

async function tramo1(d) {
  const S = solutionSteps(1);
  const [fx, fy] = S.from;
  await d.walkTo(fx, fy, { face: 'up' });
  // Pisar una piedra y volver al borde: cae y el Resonador las vuelve a alzar.
  await d.steps([8, 2]);
  await d.expectSaid(/el trozo del Resonador vuelve a alzar las piedras/, 'el reinicio del tramo');
  await d.milestone('tramo1_reinicio', (s) => need(Number(s.vars.b19_tramo_1_caidas || 0) === 0, `máscara ${s.vars.b19_tramo_1_caidas}`));
  await d.steps(S.dirs);
  await d.turn(S.face);
  await d.milestone('tramo1_meta', (s) => need(Number(s.vars.b19_tramo_1_listo) === 1, 'la aguja no despierta'));
  d.want.push('Sí');
  await d.interact({ watch: [{ re: /Esta vez, se quedan/, name: 'tramo1_alzado', delay: 100 }] });
  await d.expectSaid(/No la ha alzado el Resonador|no las ha alzado el Resonador/i, 'la reacción del Mirador');
  await d.milestone('tramo1', (s) => need(has(s, 'b19_tramo_1'), 'el primer tramo no se ha alzado'));
}

async function tramo2(d) {
  const S = solutionSteps(2);
  await d.walkTo(S.from[0], S.from[1], { face: 'right' });
  await d.steps(S.dirs);
  await d.turn(S.face);
  d.want.push('Sí');
  await d.interact();
  await d.expectSaid(/esa luz verde/, 'el Peregrino de la pila B');
  await d.milestone('tramo2', (s) => need(has(s, 'b19_tramo_2'), 'el segundo tramo no se ha alzado'));
}

async function tramo3(d) {
  const S = solutionSteps(3);
  const start = spanDef(3).start;
  await d.walkTo(S.from[0], S.from[1], { face: 'up' });
  // Derrumbe a propósito: por aquí la última piedra se queda sin salida.
  await d.steps([8, 8, 4, 8, 6], { watch: [{ re: /La losa se parte/, name: 'tramo3_derrumbe', delay: 150 }] });
  await d.expectSaid(/Una red de hexágonos verdes te sujeta|La red de hexágonos verdes te devuelve/, 'el rescate (narración)');
  await d.milestone('derrumbe', (s) => need(Number(s.vars.b19_derrumbes) >= 1 && s.x === start.x && s.y === start.y, `derrumbes ${s.vars.b19_derrumbes} en (${s.x},${s.y})`));
  await d.walkTo(S.from[0], S.from[1], { face: 'up' });
  await d.steps(S.dirs);
  await d.turn(S.face);
  d.want.push('Sí');
  const watch = [
    { re: /Una sombra alada/, name: 'noivern', delay: 300 },
    { scene: 'BattleScene', name: 'casandra_combate', delay: 3500 },
  ];
  await d.interact({ watch });
  await d.expectSaid(/Si el Rey tenía que abrirle la puerta a alguien/, 'el reto de Casandra');
  if (RETRY) {
    const s = await d.milestone('casandra_derrota', (st) => need(st.lost.includes('b19_casandra') && !has(st, 'b19_casandra_vencida') && st.x === DUEL.retry.x && st.y === DUEL.retry.y, `perdido ${st.lost} en (${st.x},${st.y})`));
    void s;
    const [sx, sy] = DUEL.strip[1];
    await d.walkTo(sx, sy + 1, { face: 'up' });
    await d.steps([8]);
  }
  await d.expectSaid(/Las piedras le responden/, 'Casandra vencida');
  await d.milestone('casandra_vencida', (s) => need(has(s, 'b19_casandra_vencida'), 'Casandra no ha sido vencida'));
}

async function taller(d) {
  const W = PENA.workshop;
  await d.walkTo(W.front.x, W.front.y, { face: 'up' });
  await d.exitTo('up', 'calzada_taller');
  await d.expectSaid(/Aquí trabajó alguien durante mucho tiempo/, 'la llegada al taller');
  await d.talk(NICHE.stand.x, NICHE.stand.y, 'up', { watch: [{ re: /El rey no murió en el abismo/, name: 'cronica_xv', delay: 200 }] });
  await d.expectSaid(/Se equivocó… y se quedó a arreglarlo/, 'Casandra ante la Crónica');
  const sal = await d.eval(() => window.__b19.items('SALAMENCITE'));
  const clue = await d.eval(() => window.__b19.clue('T15'));
  await d.milestone('tabla_draco', (s) => {
    if (!s.tablets.includes('DRACOPLATE')) return `sin Tabla Draco (${s.tablets})`;
    if (sal !== 1 || !has(s, 'b19_cuidadores') || !has(s, 'b19_resonador_apagado')) return `Salamencita ${sal}`;
    return need(clue?.solved || clue?.status === 'solved', `pista T15 ${JSON.stringify(clue)}`);
  });
  await d.walkTo(TALLER_ENTRY.x, TALLER_ENTRY.y);
  await d.exitTo('down', 'calzada_rey', { watch: [{ re: /Si ves a Gael/, name: 'alerce', delay: 200 }] });
  await d.expectSaid(/^Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir\.$/, 'la línea de Alerce');
  await d.milestone('alerce', (s) => need(has(s, 'b19_alerce'), 'sin la escena de Alerce'));
}

async function alfa(d) {
  const A = PENA.alfa;
  await d.talk(A.x, A.y + 1, 'up', { watch: [{ scene: 'BattleScene', name: 'salamence_alfa', delay: 3500 }] });
  await d.milestone('alfa', (s) => need(has(s, 'b19_alfa') && s.battles.some(b=>b.species==='SALAMENCE'&&b.outcome==='win'), `Alfa ${has(s, 'b19_alfa')} combates ${s.battles}`));
}

async function bajada(d) {
  const B = PENA.bajada;
  await d.walkTo(B.front.x, B.front.y, { face: 'up' });
  await d.exitTo('up', 'sima_eje', { watch: [{ re: /Aquí se abrió todo/, name: 'sima', delay: 200 }] });
  const G = GAP_FINAL.socket;
  await d.walkTo(G.x + 1, G.y, { face: 'left' });
  d.want.push('Sí');
  await d.interact({ watch: [{ re: /encajan contra el Umbral/, name: 'ultimo_tramo', delay: 150 }] });
  const [lx, ly] = UMBRAL.landing[1];
  await d.walkTo(lx, ly);
  await d.settle();
  await d.expectSaid(/La Puerta de las Quince\. Detrás, el Origen\./, 'el Umbral');
  await d.milestone('umbral', (s) => need(has(s, 'b19_calzada') && has(s, 'b19_sima_ultimo_tramo'), 'sin la salida b19_calzada'));
  const hasPuerta = await d.eval(() => Boolean(window.__map?.world?.current?.def?.warps?.some((w) => w.to === 'puerta_quince')));
  if (!hasPuerta) { console.log('  (puerta_quince aún sin registrar: se omite la entrada)'); return; }
  await d.walkTo(UMBRAL.arrive.x, UMBRAL.arrive.y, { face: 'up' });
  await d.exitTo('up', 'puerta_quince');
  await d.milestone('puerta_quince', (s) => need(s.map === 'puerta_quince', `mapa ${s.map}`));
}

async function oeste(d) {
  const [s0] = GAP_W.sockets;
  await d.walkTo(s0.x, s0.y - 1, { face: 'down' });
  d.want.push('Sí');
  await d.interact();
  await d.milestone('sima_oeste', (s) => need(has(s, 'b19_sima_paso'), 'el hueco del sendero no se ha alzado'));
  const A = GAP_ALCOVE.socket;
  await d.walkTo(A.x - 1, A.y, { face: 'right' });
  d.want.push('Sí');
  await d.interact();
  await d.talk(8, 31, 'right');
  const metag = await d.eval(() => window.__b19.items('METAGROSSITE'));
  await d.milestone('metagrossita', () => need(metag === 1, `Metagrossita ${metag}`));
  const S = EXITS.south;
  await d.walkTo(S.x0, S.y);
  await d.exitTo('down', 'mirador_sur');
  await d.milestone('mirador_sur', (s) => need(s.map === 'mirador_sur', `mapa ${s.map}`));
}


export async function runB19(d){await refreshDriver(d);await installB19Observer(d.page);
 await d.stages('B19',{entrada:async d=>d.travel('calzada_rey'),llegada,tramo1,tramo2,tramo3,taller,alfa,bajada});}
