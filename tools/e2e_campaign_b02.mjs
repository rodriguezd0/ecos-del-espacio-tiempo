// B02 continuo: no sustituciones de equipo ni curas por API.
import { refreshDriver } from './e2e_campaign_refresh.mjs';
const flag=(s,k)=>Boolean(s.flags[k]);
const need=(c,m)=>c?null:m;
async function zaguan(d) {
  await d.walkTo(14, 59);
  await d.crossEdge('down', 'villa_zaguan');
  await d.settle();
  await d.milestone('villa_zaguan', (s) => need(s.map === 'villa_zaguan', `mapa ${s.map}`));
  await d.walkTo(18, 11, { stopWhen: (s) => s.cells.includes('cell_zaguan_1') });
  await d.settle();
  await d.milestone('c008', (s) => need(s.cells.includes('cell_zaguan_1') && s.cells.length === 6, `células ${s.cells.length}`));
  await d.enterDoor(26, 14, 'zaguan_centro');
  await d.settle({ watch: [{ re: /primera vez en un Centro/, name: 'centro_tutorial', delay: 300 }] });
  await d.expectSaid(/primera vez en un Centro Pokémon/, 'el tutorial del Centro');
  await d.walkTo(9, 7, { face: 'up' });
  await d.press('KeyZ', 400);
  await d.settle({ watch: [{ re: /recuperado por completo/, name: 'centro_cura' }] });
  await d.expectSaid(/Tus Pokémon se han recuperado por completo/, 'la cura de la enfermera');
  await d.milestone('centro', (s) => need(flag(s, 'b02_centro_tutorial') && s.b02.healPoint?.mapId === 'zaguan_centro', 'tutorial/punto de cura'));
  await d.exitTo('villa_zaguan');
  await d.settle();
  await d.talk('vecina');
  await d.settle();
  await d.expectSaid(/Anoche se me abrió la puerta tres veces\. Sin viento\./, 'la vecina de las puertas');
}

// ───────────────────────────── Explanada ─────────────────────────────

async function explanada(d) {
  await d.walkTo(0, 17);
  await d.crossEdge('left', 'explanada_umbral');
  await d.settle();
  await d.walkTo(24, 14, { stopWhen: (s) => flag(s, 'b02_gael_espera') });
  await d.settle({ watch: [{ re: /Llegué antes/, name: 'gael_espera', delay: 200 }] });
  await d.expectSaid(/Llegué antes\. No me ha dejado pasar\./, 'Gael');
  await d.walkTo(15, 15, { stopWhen: (s) => flag(s, 'b02_casilda_acompana') || s.busy });
  await d.settle({ watch: [
    { re: /Aquí no entra nadie/, name: 'casilda_bloquea', delay: 200 },
    { re: /Voy contigo/, name: 'dintel_brilla', delay: 200 },
  ] });
  await d.expectSaid(/Esto brillaba en el patio/, 'C009 de Casilda');
  await d.milestone('casilda_acompana', (s) => need(flag(s, 'b02_casilda_acompana') && s.cells.includes('cell_zaguan_2') && s.cells.length === 7, `células ${s.cells.length}`));
  await d.walkTo(15, 9, { stopWhen: (s) => s.map === 'ruinas_dintel_base' });
  await d.until((s) => s.map === 'ruinas_dintel_base' && s.ready, { what: 'entrar en el piso de entrenadores' });
  await d.settle();
  await d.milestone('piso_1_entrenadores');
  // Cada escalera se puede desandar sin rebote; después subimos para conservar el recorrido completo.
  await d.exitTo('explanada_umbral');
  await d.walkTo(15, 9, { stopWhen: (s) => s.map === 'ruinas_dintel_base' });
  await d.until((s) => s.map === 'ruinas_dintel_base' && s.ready, { what: 'volver al piso 1' });
  await d.exitTo('ruinas_dintel');
}

// ───────────────────────────── Ruinas: antesala y galería ─────────────────────────────

async function antesalaYGaleria(d) {
  await d.settle({ watch: [{ re: /Son piedras/, name: 'antesala', delay: 300 }] });
  await d.expectSaid(/Son piedras\. Muy viejas, nada más\./, 'Casilda en la antesala');
  await d.interact(21, 30, 'down');
  await d.settle();
  await d.expectSaid(/El primero mira al alba\. El segundo, al agua que no se va\. El tercero, a quien entra\./, 'la inscripción');
  await d.walkTo(15, 30, { stopWhen: (s) => s.cells.includes('cell_umbral_1') });
  await d.settle();
  await d.walkTo(13, 23, { stopWhen: (s) => flag(s, 'b02_galeria') });
  await d.settle({ watch: [{ re: /Una piedra en cada alcoba/, name: 'galeria', delay: 300 }] });
  await d.walkTo(5, 21, { stopWhen: (s) => s.cells.includes('cell_umbral_2') });
  await d.settle();
  await d.milestone('c010_c011', (s) => need(s.cells.includes('cell_umbral_1') && s.cells.includes('cell_umbral_2'), 'C010/C011'));
  const stones = await d.eval(async () => (await import('/src/content/maps/b02/ruinas_dintel_layout.js')).STONES);
  for (const [name, presses] of [['piedra_agua', 3], ['piedra_entrada', 2], ['piedra_alba', 1]]) {
    const st = stones.find((s) => s.id === name);
    const face = { 4: 'left', 6: 'right' }[st.from.dir];
    await d.walkTo(st.from.x, st.from.y, { face });
    for (let i = 0; i < presses; i++) {
      const before = await d.eval((id) => window.__e2e.engine.state.var(`b02_${id}`, 8), name);
      // Girar para mirar la piedra todavía ocupa unos fotogramas. Solo repetimos A si no cambió su orientación.
      for (let retry = 0; retry < 3; retry++) {
        await d.until((s) => !s.playerBusy && !s.busy, { what: 'quieto ante la piedra' });
        await d.press('KeyZ', 300);
        await d.settle({ watch: [{ re: /Eso no lo había hecho nunca/, name: 'primera_ranura', delay: 100 }] });
        const after = await d.eval((id) => window.__e2e.engine.state.var(`b02_${id}`, 8), name);
        if (after !== before || flag(await d.snap(), `b02_${name}_viva`)) break;
      }
      await d.turn(face);
    }
    const s = await d.snap();
    if (!flag(s, `b02_${name}_viva`)) throw new Error(`${name} no se encendió (orientaciones ${s.b02.stones})`);
  }
  await d.expectSaid(/Y eso era una puerta\./, 'la losa deslizándose');
  await d.milestone('losa_abierta', (s) => need(flag(s, 'b02_dinteles'), 'sin b02_dinteles'));
}

// ───────────────────────────── Ruinas: Geodude y Guardiana ─────────────────────────────

async function geodude(d) {
  await d.walkTo(18, 11, { stopWhen: (s) => flag(s, 'b02_camara_geodude') });
  await d.settle();
  await d.expectSaid(/rascar por las noches/, 'Casilda ante el Geodude');
  await d.walkTo(12, 9, { stopWhen: (s) => s.cells.includes('cell_umbral_3') });
  await d.settle();
  await d.walkTo(4, 7, { face: 'left' });
  d.choiceRules.unshift({ re: /acompañe/, index: 1 }); // primero lo rechaza: debe esperar en la cámara
  await d.press('KeyZ', 400);
  await d.settle({
    watch: [{ re: /encajado en una grieta/, name: 'geodude_encajado' }, { re: /ha salido de la grieta/, name: 'geodude_libre' }],
    onText: async (s) => {
      if (!/mantén pulsado A/.test(s.lastText || '')) return false;
      await d.wait(1200); // que termine de escribirse: la pulsación que cierra el mensaje sigue apretada al tirar
      await d.hold('KeyZ', 2600);
      return true;
    },
  });
  await d.expectSaid(/dispuesto a esperar/, 'el Geodude espera');
  await d.milestone('roca_rota', (s) => need(flag(s, 'b02_geodude_libre') && flag(s, 'b02_roca_rota') && !flag(s, 'b02_geodude_regalo'), 'Geodude/roca'));
  d.choiceRules.shift();
  const g = await d.eval(() => window.__e2e.eventInfo('geodude'));
  await d.interact(g.x, g.y, 'right');
  await d.settle();
  await d.milestone('geodude_regalo', (s) => need(flag(s, 'b02_geodude_regalo') && s.party.includes('GEODUDE'), `equipo ${s.party}`));
}

async function guardiana(d) {
  for (let attempt=0; attempt<4; attempt++) {
    await d.walkTo(34,21); await d.step(6); await d.step(8); await d.settle({timeout:300000});
    if ((await d.snap()).flags.b02_casilda_vencida) break;
    console.log('Derrota real ante Casilda: cura del guion y reintento con el mismo equipo.');
  }
  await d.milestone('guardiana_vencida',s=>s.flags.b02_casilda_vencida?null:'Casilda no vencida');
}
// ───────────────────────────── Núcleo y salida ─────────────────────────────

async function nucleo(d) {
  await d.settle();
  await d.walkTo(13, 12, { face: 'up' });
  await d.wait(800);
  await d.press('KeyZ', 400);
  await d.until((s) => s.busy || s.top !== 'MapScene', { what: 'la columna hueca responde' });
  await d.settle({ timeout: 300000, watch: [
    { re: /Fragmento Azur 1/, name: 'fragmento_1', delay: 300 },
    { re: /Siempre la vi cerrada/, name: 'arca', delay: 200 },
    { re: /Cien\. Y cinco/, name: 'verso_1', delay: 200 },
  ] });
  await d.expectSaid(/Cien\. Y cinco\. …Soy yo\./, 'el Core ante el verso I');
  await d.expectSaid(/Serán números\./, 'Casilda');
  await d.milestone('pilar_restaurado', (s) => need(flag(s, 'p1_restored') && flag(s, 'b02_atajo') && s.b02.fragments.includes('F01') && s.b02.keyItems.includes('ZYGARDECUBE'), 'P1/Arca/atajo'));
}

async function salida(d) {
  await d.exitTo('ruinas_dintel');
  await d.walkTo(34, 29);
  await d.walkTo(21, 34);
  await d.hold('ArrowDown', 400); // la claridad de la salida: empujar contra ella
  await d.until((s) => s.map === 'ruinas_dintel_base' && s.ready, { what: 'bajar al piso 1' });
  await d.exitTo('explanada_umbral');
  await d.settle({ timeout: 300000, watch: [
    { re: /Forma 10/, name: 'forma_10', delay: 300 },
    { re: /responde a un niño/, name: 'consorcio', delay: 200 },
    { re: /Mi madre apuntaba/, name: 'libreta', delay: 200 },
  ] });
  await d.expectSaid(/Aquí se mide con los ojos\. Fuera\./, 'Casilda echa al Consorcio');
  await d.milestone('salida', (s) => need(flag(s, 'zyg_10') && s.b02.run && s.b02.form === '10' && flag(s, 'b02_libreta') && flag(s, 'b02_salida')
    && s.b02.keyItems.includes('CLUENOTEBOOK') && s.b02.clues.includes('T01:active') && s.b02.hour >= 18 && s.b02.hour < 21, JSON.stringify(s.b02)));
}

async function despues(d) {
  const s = await d.walkTo(29, 14, { stopWhen: (st) => st.map === 'villa_zaguan' });
  if (s.map !== 'villa_zaguan') await d.crossEdge('right', 'villa_zaguan');
  await d.settle();
  await d.talk('vecina');
  await d.settle();
  await d.expectSaid(/La puerta ya no se abre sola/, 'la vecina tras el P1');
  await d.enterDoor(6, 23, 'casa_dintel');
  await d.settle();
  await d.interact(9, 7, 'left');
  await d.settle();
  await d.expectSaid(/no sé qué hacer con la tarde/, 'Casilda en casa');
  await d.milestone('casa_dintel');
}


export async function runB02(d) {
  await refreshDriver(d); await d.eval(() => { window.__campaign.control.wild = 'mega'; });
  const pointInteract = d.interact.bind(d);
  d.interact = async (x, y, from, opts = {}) => {
    if (typeof x !== 'number') return pointInteract(x);
    const offset = { down: [0, 1, 'up'], up: [0, -1, 'down'], left: [-1, 0, 'right'], right: [1, 0, 'left'] }[from || 'down'];
    return pointInteract(x + offset[0], y + offset[1], offset[2], opts);
  };
  try {
    await zaguan(d);await explanada(d);await antesalaYGaleria(d);await geodude(d);await guardiana(d);
    await nucleo(d);await salida(d);await despues(d);await d.exitTo('villa_zaguan');
  } finally { delete d.interact; }
}
