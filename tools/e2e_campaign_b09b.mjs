import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB09bObserver} from './e2e_campaign_b09b_page.mjs';
import * as R8 from '../game/src/content/maps/b09b/ruta_8_layout.js';
import * as NX from '../game/src/content/maps/b09b/nexo_layout.js';
import * as R15 from '../game/src/content/maps/b09b/ruta_15_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
const RETRY=false;
const pick = (label) => (s) => { const i = s.choices.findIndex((c) => c === label || c.startsWith(label)); return i < 0 ? 0 : i; };
const has = (s, id) => (s.items[id] || 0) > 0;

// ───────────────────────────── Ruta 8 · T08 ─────────────────────────────

async function arrival(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_8_marisma' && s.ready, { timeout: 30000, what: 'la Ruta 8' });
  await d.settle();
  await d.walkTo(R8.START.x - 2, R8.START.y, { watch: [{ re: /golpeteo sordo/, name: 'marisma_bombas', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/golpeteo sordo/, 'el golpeteo de las bombas');
  await d.milestone('marisma_llegada', (s) => (s.flags.b09_marisma_llegada ? null : 'sin b09_marisma_llegada'));
}

async function remedios(d) {
  const door = R8.HOUSES.remedios.door;
  await d.push(door.x, door.y + 1, 'up', 'palafitos_remedios');
  await d.talk(6, 6, 'up', { watch: [{ re: /Soy Remedios/, name: 'remedios', delay: 200 }] });
  await d.expectSaid(/cerca de las bombas del Consorcio/, 'la pista de Remedios');
  await d.milestone('t08_remedios', (s) => (s.flags.b09_t08_remedios && s.clues.some((c) => c.id === 'T08' && c.step === 2) ? null : 'sin segunda pista de T08'));
  // Al salir, Alerce llega por el puente e insiste en tomar él las muestras.
  const watch = [{ re: /Quería ver el agua con mis propios ojos/, name: 'alerce_llega', delay: 200 }];
  await d.leave(6, 9, 'down', 'ruta_8_marisma', { watch, choose: () => 0 });
  await d.settle({ watch });
  await d.expectSaid(/No\. Las muestras las tomo yo\./, 'la insistencia de Alerce');
  await d.milestone('t08_alerce', (s) => (s.flags.b09_t08_alerce ? null : 'Alerce no llegó'));
}

/** Técnico de una bomba: la vista lo dispara; con derrota simulada, reintento desde su casilla de reintento. */
async function pump(d, n, approach) {
  const p = R8.PUMPS.find((q) => q.n === n);
  const flag = `b09_t08_bomba_${n}`;
  const watch = [{ scene: 'BattleScene', name: `tecnico_${n}`, delay: 3000 }];
  await d.walkTo(approach.x, approach.y, { watch, stopWhen: (s) => s.flags[flag] || s.lost.includes(p.tech.trainer) });
  await d.settle({ watch });
  let s = await d.snapState();
  if (!s.flags[flag]) {
    if (RETRY && s.lost.includes(p.tech.trainer)) {
      await d.milestone(`bomba_${n}_reintento`, (st) => (st.x === p.tech.front.x && st.y === p.tech.front.y ? null : `tras perder: (${st.x},${st.y})`));
    }
    await d.talkTo(p.tech.x, p.tech.y, { watch });
    s = await d.snapState();
  }
  await d.milestone(`bomba_${n}`, (st) => (st.flags[flag] ? null : `la bomba ${n} sigue en marcha`));
}

async function pumps(d) {
  await pump(d, 1, { x: 36, y: 50 });
  await d.expectSaid(/De acuerdo\. Detengo la bomba/, 'la técnica para la bomba');
  await pump(d, 2, { x: 41, y: 15 });
  // C044, en el barro junto a la bomba del noreste.
  await d.walkTo(R8.CELLS.c044.x, R8.CELLS.c044.y);
  await d.settle();
  await d.milestone('c044', (s) => (s.cells.includes('cell_marisma_1') ? null : 'sin C044'));
  await pump(d, 3, { x: 13, y: 16 });
  await d.expectSaid(/sin las bombas, el lodo se asienta/, 'la Pokédex vibra');
  await d.milestone('t08_bombas', (s) => (s.flags.b09_t08_bombas ? null : 'faltan bombas'));
  // Lodo Negro en la llanura de la bomba del noroeste.
  const it = R8.ITEMS.find((i) => i.item === 'BLACKSLUDGE');
  await d.talkTo(it.x, it.y);
  await d.milestone('lodo_negro', (s) => (has(s, 'BLACKSLUDGE') ? null : 'sin Lodo Negro'));
}

async function stakes(d) {
  for (const n of [6, 5, 4, 2, 1, 3]) {
    const k = R8.STAKES.find((st) => st.n === n);
    await d.talkTo(k.x, k.y);
    const s = await d.snapState();
    if (!(Number(s.vars[`b09_t08_lectura_${n}`]) > 0)) throw new Error(`la estaca ${n} no guardó lectura`);
    if (n === 5) await d.shot('estaca_muy_alta');
  }
  await d.expectSaid(/Ya tienes las seis lecturas/, 'el aviso de las seis lecturas');
  await d.milestone('t08_lecturas', (s) => (s.flags.b09_t08_lecturas ? null : 'sin las seis lecturas'));
  const st = R8.SPOTS.alerceStation;
  await d.talkTo(st.x, st.y);
  await d.expectSaid(/Repasemos las lecturas/, 'el resumen de Alerce');
}

async function dig(d) {
  const yes = pick('Sí');
  if (RETRY) {
    const wrong = R8.POOLS.find((p) => p.id === 'q1');
    await d.talkTo(wrong.x, wrong.y, { choose: yes });
    await d.expectSaid(/Solo barro, espeso y frío/, 'la poza equivocada');
    await d.milestone('poza_equivocada', (s) => (!s.flags.b09_t08_tablilla ? null : 'la poza equivocada dio la Tablilla'));
  }
  const src = R8.SOURCE_POOL;
  const watch = [{ re: /asoma una losa violeta/, name: 'losa', delay: 200 }, { re: /Hace dieciséis años/, name: 'remedios_aparatos', delay: 200 }];
  await d.talkTo(src.x, src.y, { choose: yes, watch });
  await d.expectSaid(/Hace dieciséis años vinieron unos señores a medir la laguna/, 'la frase de Remedios');
  await d.expectSaid(/^Son aparatos corrientes\.$/, 'la respuesta de Alerce');
  await d.expectSaid(/Nos quedamos/, 'los jóvenes se quedan');
  await d.milestone('t08_tablilla', (s) => {
    if (!s.tablets.includes('TOXICPLATE') && !has(s, 'TOXICPLATE')) return 'sin Tabla Tóxica';
    if (!s.flags.b09_marisma_sana) return 'la marisma no sana';
    if ((s.items.REVIVALHERB || 0) < 2) return 'sin el regalo de Remedios';
    if (!(s.hour >= 17)) return `la escena final no es por la tarde (${s.hour})`;
    return null;
  });
  const foam = await d.eval(() => window.__b09b.eventPage('espuma_0'));
  await d.milestone('marisma_sana', () => (foam === 1 ? null : `la espuma sigue (página ${foam})`));
}

// ───────────────────────────── Nexo, Ruta 15, Caleta ─────────────────────────────

async function nexo(d) {
  await d.travel('ciudad_nexo');
  await d.until((s) => s.top === 'MapScene' && s.map === 'ciudad_nexo' && s.ready, { timeout: 30000, what: 'Ciudad Nexo' });
  await d.settle();
  await d.milestone('nexo', null);
  // Correos: Don Evaristo, por encima del mostrador.
  const co = NX.BUILDINGS.correos.door;
  await d.push(co.x, co.y + 1, 'up', 'nexo_correos');
  await d.talk(7, 8, 'right', { watch: [{ re: /Sesenta años detrás de este mostrador/, name: 'evaristo', delay: 200 }] });
  await d.expectSaid(/Sesenta años detrás de este mostrador/, 'Don Evaristo');
  await d.leave(4, 9, 'down', 'ciudad_nexo');
  // Mercado: los herreros de Tizón ya no mandan picos (T12, en cola hasta Nadar).
  const her = NX.PLAZA.stalls.find((st) => st.role === 'herreros');
  await d.talk(her.x + 1, her.y + 4, 'up', { watch: [{ re: /no mandan ni uno/, name: 'mercado_t12', delay: 200 }] });
  await d.milestone('t12_en_cola', (s) => (s.clues.some((c) => c.id === 'T12' && c.status === 'queued') ? null : 'T12 no está en cola'));
  // Aduana Vieja cerrada (DLC 2).
  await d.talkTo(NX.BUILDINGS.aduana.door.x, NX.BUILDINGS.aduana.door.y);
  await d.expectSaid(/Cerrado hasta nueva orden/, 'la Aduana cerrada');
  // Ferri parado y prismáticos: la plataforma del Consorcio.
  await d.talkTo(NX.PORT.ferrySailor.x, NX.PORT.ferrySailor.y);
  await d.expectSaid(/no sale ni un ferri/, 'el ferri parado');
  await d.milestone('ferri_parado', null);
  const watch = [{ re: /plataforma con grúas/, name: 'plataforma_talasa', delay: 300 }];
  await d.talkTo(NX.PORT.binoculars.x, NX.PORT.binoculars.y, { choose: pick('Mirar'), watch });
  await d.expectSaid(/plataforma con grúas/, 'la plataforma del Consorcio');
  await d.milestone('talasa_vista', (s) => (s.flags.b09_nexo_talasa_vista ? null : 'sin ver la plataforma'));
  // Pescador del pantalán: Caña Buena.
  await d.talkTo(NX.PORT.fisher.x, NX.PORT.fisher.y);
  await d.milestone('cana_buena', (s) => (has(s, 'GOODROD') ? null : 'sin Caña Buena'));
  // Hacia la Ruta 15 por el oeste.
  await d.walkTo(0, NX.EXITS.west.y0 + 1);
  await d.crossEdge('left', 'ruta_15');
}

async function ruta15(d) {
  await d.milestone('ruta15', (s) => (s.map === 'ruta_15' ? null : `mapa ${s.map}`));
  const f2 = R15.SPOTS.fishers[1];
  await d.talkTo(f2.x, f2.y, { watch: [{ re: /velas cuadradas/, name: 'mareas', delay: 200 }] });
  await d.milestone('mareas', (s) => (s.flags.b09_r15_mareas ? null : 'sin la historia de las mareas'));
  await d.talkTo(R15.LOOKOUT.binoculars.x, R15.LOOKOUT.binoculars.y, { choose: pick('Mirar') });
  await d.expectSaid(/casas blancas de Caleta Sonda/, 'la vista del mirador');
  const rock = R15.BINACLE_ROCKS[1];
  await d.talkTo(rock.x, rock.y, { watch: [{ scene: 'BattleScene', name: 'binacle', delay: 2500 }] });
  await d.expectSaid(/(Binacle asoma|Barbaracle se despega)/, 'el Binacle de la roca');
  await d.walkTo(0, R15.EXITS.west.y0 + 1);
  await d.crossEdge('left', 'caleta_sonda');
}

async function caleta(d) {
  await d.milestone('caleta', (s) => (s.map === 'caleta_sonda' ? null : `mapa ${s.map}`));
  const ti = CL.BUILDINGS.tienda.door;
  await d.push(ti.x, ti.y + 1, 'up', 'caleta_tienda');
  await d.talk(4, 6, 'left');
  await d.milestone('supercana', (s) => (has(s, 'SUPERROD') ? null : 'sin Supercaña'));
  await d.leave(4, 9, 'down', 'caleta_sonda');
  const fa = CL.BUILDINGS.faro.door;
  await d.push(fa.x, fa.y + 1, 'up', 'caleta_faro');
  await d.talk(4, 6, 'up', { watch: [{ re: /bailan luces/, name: 'ramon', delay: 200 }] });
  await d.milestone('t11_en_cola', (s) => (s.clues.some((c) => c.id === 'T11' && c.status === 'queued') ? null : 'T11 no está en cola'));
  await d.leave(6, 9, 'down', 'caleta_sonda');
  // Muelle de buzos: Ainhoa y el extremo previsto para la resonancia del Buceo (B13).
  const watch = [{ scene: 'BattleScene', name: 'ainhoa', delay: 3000 }];
  await d.walkTo(CL.DIVERS.resonance.x, CL.DIVERS.resonance.y, { watch });
  await d.talkTo(CL.DIVERS.diver.x, CL.DIVERS.diver.y);
  await d.milestone('muelle_buzos', (s) => (s.x === CL.DIVERS.resonance.x && s.y === CL.DIVERS.resonance.y ? null : `(${s.x},${s.y})`));
}

// ───────────────────────────── Principal ─────────────────────────────

export async function runB09b(d){await refreshDriver(d);await installB09bObserver(d.page);await d.stages('B09b',{arrival,remedios,pumps,stakes,dig,nexo,ruta15,caleta});}
