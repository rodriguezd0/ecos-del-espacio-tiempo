import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {reloadCompletedCampaign} from './e2e_campaign_reload.mjs';
import {installB21Observer} from './e2e_campaign_b21_page.mjs';
import { COLUMNA } from '../game/src/content/maps/b21/layout.js';
import { EPI, gaelEggSpecies } from '../game/src/content/events/b21_epilogo.js';
import { F, V } from '../game/src/content/events/b21_common.js';
import { MONTAGE_SHOTS } from '../game/src/content/events/b21_cine.js';
import { RESOLUTION_TEXT, BATTLE_TEXT, ZYGARDE_TEXT } from '../game/src/content/events/b21_texts.js';
import {completeArceus} from './e2e_campaign_b21_retry.mjs';

const need = (cond, msg) => (cond ? null : msg);
const has = (s, f) => Boolean(s.flags[f]);
export function resolutionLine(s) {
  const choice = s.vars?.[V.p9Choice];
  if (!['DIALGA', 'PALKIA'].includes(choice)) throw Error('Falta la elección real del P9.');
  return RESOLUTION_TEXT.axis[choice];
}

export function gaelEggProofError(s) {
  const species = gaelEggSpecies({ var: (key, fallback) => s.vars?.[key] ?? fallback });
  const eggs = [...s.partyFull, ...s.boxedPokemon].filter(p => p.egg && p.species === species);
  return need(has(s, F.gaelEggGiven) && !has(s, F.gaelEggWaiting), 'el huevo de Gael sigue pendiente')
    || need(eggs.length === 1, `se espera un huevo de ${species}, hay ${eggs.length}`);
}


async function salto(d, { node }) {
  const pos = await d.eval((id) => window.__b21.eventPos(id), node.event);
  if (!pos?.alive) throw new Error(`El Nodo del Origen (${node.event}) no está activo en ${node.map}`);
  await d.walkTo(pos.x, pos.y + 1, { face: 8 });
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
  if(!has(await d.snap(),F.zygardeJoined)) {
    d.want = ['Todavía no'];
    await d.walkTo(COLUMNA.question.x0 + 2, COLUMNA.question.y + 1, { face: 8 });
    await d.step(8);
    await d.settle({ watch: [{ name: 'zygarde_pregunta', re: /Antes de despertarlo/ }] });
    await d.milestone('zygarde_espera', async (s) => need(has(s, F.zygardeAsked) && !has(s, F.zygardeJoined), 'la pregunta no esperó'));
  }
  // Al altar: Zygarde vuelve a preguntar → «Sí» → el Arca (equipo lleno) → la Flauta → Arceus.
  await completeArceus(d,{ timeout: 900000, watch: [
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
    const tabs=await d.eval(()=>window.__b21.tablets());
    const crisis=await d.eval(()=>window.__b21.crisis());
    return need(z&&z.form===2&&z.level===70&&z.ball==='PREMIERBALL'&&z.ability==='POWERCONSTRUCT','Zygarde no se unio correctamente')
      ||need(tabs.length===18,'no completo las dieciocho Tablillas')
      ||need(has(s,F.arceusDone)&&has(s,F.gameCleared)&&has(s,F.alerceKeyGiven)&&has(s,F.montageDone),'resolucion o epilogo incompleto')
      ||need(crisis===5,'cielo no reparado');
  });
  await d.expectSaid(/Otra vez tú\./, 'la línea de Olmedo');
  await d.expectSaid(/Hay cosas ahí que debería haber enseñado hace tiempo/, 'la línea de Alerce');
  await d.expectSaid(new RegExp(resolutionLine(await d.snap()).slice(0, 30)), 'el eje no elegido reparado');
}

export async function gael(d) {
  const before = await d.snap();
  if (!has(before, F.gaelEggGiven) && before.partyList.length >= 6) {
    const reserve = before.pokemon.filter(p => p.species !== 'ZYGARDE').sort((a, b) => a.level - b.level)[0];
    if (!reserve) throw Error('No hay un Pokémon que se pueda guardar para hacer sitio al huevo de Gael.');
    await d.travel('zaguan_centro'); await d.depositAtPC(reserve.species);
    await d.travel('villa_alba');
  }
  await d.walkTo(9, 13, { face: 8 });
  await d.pushUntil(8, (s) => s.map === 'casa_gael', 'entrar en casa de Gael', { watch: [{ name: 'casa_gael', re: /casa de Gael/ }] });
  await d.walkTo(EPI.gaelTable.x + 1, EPI.gaelTable.y, { face: 4 });
  await d.interact({ watch: [{ name: 'nota_gael', re: /Para que tu Pokédex/ }] });
  await d.milestone('nota_gael',s=>need(has(s,F.gaelNoteRead),'no leyo la nota de Gael'));
  await d.milestone('huevo_gael', gaelEggProofError);
  await d.interact();
  await d.milestone('huevo_gael_unico', gaelEggProofError);
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
    { name: 'despertar', re: /Zygarde conserva la Forma Completa/ },
  ] };
  await d.pushUntil(8, (s) => s.map !== 'villa_alba', 'entrar en casa', opts);
  await d.settle(opts);
  await d.milestone('postgame', async (s) => {
    const z = await d.eval(() => window.__b21.zygarde());
    return need(s.map === 'casa_prota_2f', `no despierta en el cuarto (${s.map})`)
      || need(has(s, F.creditsDone) && has(s, F.epilogueEnd) && has(s, F.tvNews), 'faltan flags del final')
      || need(z.form === 'complete' && z.anchor, `Zygarde: ${JSON.stringify(z)}`);
  });
  await d.expectSaid(/Zygarde conserva la Forma Completa/, 'Zygarde se queda en Forma Completa (narración)');
}


export async function runB21(d,name){await refreshDriver(d);await installB21Observer(d.page);
 await d.stages('B21',{salto:d=>salto(d,{node:{map:'nucleo_origen',event:'nucleo_origen'}}),cumbre,gael,final,
 persistencia:d=>reloadCompletedCampaign(d,name),
 huevo_recargado:async d=>{
  const from=await d.snap();await d.travel('villa_alba');await gael(d);
  await d.travel(from.map);await d.walkTo(from.x,from.y);
  await d.milestone('huevo_gael_recargado',gaelEggProofError);
 }});}
