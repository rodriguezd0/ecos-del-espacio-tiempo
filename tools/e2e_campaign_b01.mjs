// Recorrido B01 reutilizado con controles reales; sin cargas ni preparación de progreso.
const WATCH_PROLOGUE = true;
let PLAYER_NAME;
async function titleToBedroom(d) {
  await d.until((s) => s.top === 'TitleScene', { what: 'pantalla de título' });
  await d.wait(800);
  await d.shot('titulo');
  await d.press('KeyZ', 700); // Pulsa A
  await d.until((s) => s.titleStage === 'menu', { what: 'menú del título' });
  const idx = await d.eval(() => window.__e2e.titleNewIndex());
  const cur = await d.eval(() => window.__e2e.titleIndex());
  for (let i = cur; i < idx; i++) await d.press('ArrowDown', 150);
  await d.press('KeyZ', 1200); // Nueva partida
  if (WATCH_PROLOGUE) {
    await d.page.keyboard.down('KeyZ'); // A acelera ×3
    await d.until((s) => s.top === 'IdentityScene', { timeout: 240000, what: 'fin del prólogo (acelerado)' });
    await d.page.keyboard.up('KeyZ');
  } else {
    await d.until((s) => s.top === 'CineOverlay', { timeout: 30000, what: 'prólogo en marcha' });
    await d.wait(1500);
    await d.shot('prologo');
    await d.press('KeyC', 600); // START: saltar (prólogo ya visto)
    await d.until((s) => s.top === 'IdentityScene', { timeout: 30000, what: '«¿Quién eres?»' });
  }
  await d.wait(700);
  await d.shot('quien_eres');
  await d.press('KeyZ', 600); // Chico
  await d.until((s) => s.top === 'ChoiceScene', { what: '¿Eres un chico?' });
  await d.press('KeyZ', 900); // Sí
  await d.until((s) => s.top === 'NamingScene', { what: 'pantalla de nombre' });
  await d.wait(500);
  await d.page.keyboard.type(PLAYER_NAME, { delay: 90 });
  await d.wait(300);
  await d.shot('nombre');
  await d.press('Enter', 900);
  await d.until((s) => s.top === 'ChoiceScene', { what: 'confirmar nombre' });
  await d.press('KeyZ', 900); // Sí
  await d.until((s) => s.top === 'MapScene' && s.map === 'casa_prota_2f' && s.ready, { timeout: 30000, what: 'la habitación' });
  await d.settle();
}

async function home(d) {
  await d.milestone('despertar', (s) => (s.flags.b01_woke ? null : 'sin b01_woke') || (s.playerName === PLAYER_NAME ? null : `nombre ${s.playerName}`));
  await d.exitTo('casa_prota_1f');
  await d.settle();
  await d.expectSaid(/te espera en el laboratorio/, 'el aviso de Mamá');
  await d.milestone('mama', (s) => (s.flags.b01_met_mom ? null : 'sin b01_met_mom'));
  await d.exitTo('villa_alba');
  await d.settle();
}

async function lab(d) {
  await d.exitTo('laboratorio_alerce');
  await d.settle();
  await d.expectSaid(/Llegas tarde/, 'el saludo de Gael');
  await d.milestone('laboratorio', (s) => (s.flags.b01_lab_intro_seen ? null : 'sin presentación'));
  const ball = await d.eval(() => window.__e2e.eventPos('bola_TURTWIG'));
  await d.walkTo(ball.x, ball.y + 2, { face: 'up' });
  await d.press('KeyZ', 600);
  await d.settle();
  await d.expectSaid(/Entonces yo me quedo con este/, 'la elección de Gael');
  await d.milestone('inicial', (s) => (s.flags.b01_starter_chosen && s.party[0] === 'TURTWIG' ? null : `equipo ${s.party}`));
  await d.exitTo('villa_alba');
  await d.settle();
  await d.expectSaid(/pitido que no termina de ser un grito/, 'la señal');
  await d.milestone('senal', (s) => (s.flags.b01_signal_heard ? null : 'sin b01_signal_heard'));
}

async function northAndCore(d) {
  const strip = await d.eval(() => window.__e2e.eventPos('escena_policia_22'));
  await d.walkTo(strip.x, strip.y, { stopWhen: (s) => s.flags.b01_police_entered });
  await d.settle();
  await d.expectSaid(/Voy a echar un vistazo/, 'el agente Olmedo');
  await d.milestone('agente_entra', (s) => (s.flags.b01_police_entered ? null : 'sin b01_police_entered'));
  await d.walkTo(22, 0);
  await d.crossEdge('up', 'laberinto_profundidad');
  await d.settle();
  await d.shot('laberinto');
  const door = await d.eval(() => window.__e2e.eventPos('camara_entrada_19'));
  const watch = [
    { re: /¿Qué te he dicho\?/, name: 'sigilo_detectado' },
    { re: /^Puedes oírme\.$/, name: 'core', delay: 400 },
    { re: /¿Qué es eso\?/, name: 'agente_y_core', delay: 400 },
    { re: /Un núcleo/, name: 'regreso_lab', delay: 400 },
    { scene: 'BattleScene', name: 'combate_gael', delay: 4500 },
  ];
  for (let attempt = 0; attempt < 8; attempt++) {
    const s = await d.walkTo(door.x, door.y, { watch, stopWhen: (st) => st.flags.b01_core_found || st.map !== 'laberinto_profundidad' });
    if (s.flags.b01_core_found || s.map !== 'laberinto_profundidad') break;
    await d.settle({ watch });
  }
  await d.settle({ timeout: 240000, watch }); // Core, agente, escolta, regreso y combate con Gael
  const log = await d.log();
  const caught = log.filter((l) => /¿Qué te he dicho\?/.test(l.text)).length;
  console.log(`  (sigilo: ${caught} detección(es))`);
  await d.expectSaid(/Puedes oírme/, 'el Core');
  await d.expectSaid(/Un núcleo/, 'Alerce ante el núcleo');
  await d.expectSaid(/combate conmigo/, 'el reto de Gael');
  await d.milestone('core_y_duelo', (s) => (s.flags.b01_core_found && s.flags.b01_escorted && s.flags.b01_gael_duel_done ? null : 'faltan flags del Core o del duelo'));
  await d.expectSaid(/Pokédex/, 'la entrega de la Pokédex');
  await d.milestone('pokedex', (s) => (s.flags.b01_dex_received && s.hasDex && s.balls >= 5 ? null : `dex ${s.hasDex} balls ${s.balls}`));
}

async function leaveTown(d) {
  await d.exitTo('villa_alba');
  await d.settle({ watch: [{ re: /^Aquí\. Una parte de mí\.$/, name: 'c001_core_senala', delay: 300 }] });
  await d.expectSaid(/Aquí\. Una parte de mí\./, 'la escena de C001');
  await d.milestone('c001_parterre', (s) => (s.cells.includes('cell_villa_alba_1') ? null : 'sin C001'));
  // Como un jugador: pasar por casa antes de salir (Mamá cura y regala 3 Pociones, §4.7).
  await d.exitTo('casa_prota_1f');
  await d.settle();
  await d.expectSaid(/Por si acaso\. Y vuelve de vez en cuando\./, 'el regalo de Mamá');
  await d.milestone('mama_regalo', (s) => (s.flags.b01_mom_gift ? null : 'sin b01_mom_gift'));
  await d.exitTo('villa_alba');
  await d.settle();
  await d.walkTo(22, 35);
  await d.crossEdge('down', 'ruta_1');
  await d.settle();
  await d.milestone('ruta_1', (s) => (s.flags.b01_left_town ? null : 'sin b01_left_town'));
}

async function route1(d) {
  const b = await d.eval(() => window.__e2e.eventPos('topografa_b'));
  await d.walkTo(b.x, b.y + 1, { face: 'up' });
  await d.press('KeyZ', 500);
  await d.settle();
  await d.expectSaid(/Lecturas de campo\. Siga, por favor\./, 'los topógrafos');
  await d.milestone('topografos');
  const watch = [
    { scene: 'BattleScene', name: 'combate_ruta_1', delay: 4000 },
    { re: /Célula de Zygarde\. \(2\/100\)/, name: 'celula_puente', delay: 200 },
  ];
  for (const id of ['cell_ruta_1_1', 'cell_ruta_1_2', 'cell_ruta_1_3', 'cell_ruta_1_4']) {
    const c = await d.eval((cid) => window.__e2e.eventPos(cid), id);
    await d.walkTo(c.x, c.y, { watch, stopWhen: (s) => s.cells.includes(id) });
    await d.settle();
    const s = await d.snapState();
    if (!s.cells.includes(id)) throw new Error(`No se recogió ${id}`);
    console.log(`  · ${id} (${s.cells.length}/100)`);
  }
  const sign = await d.eval(() => window.__e2e.eventPos('cartel_umbral'));
  await d.walkTo(sign.x, sign.y + 1, { face: 'up' });
  await d.press('KeyZ', 700);
  await d.until((s) => s.top === 'MessageScene', { what: 'cartel del Pilar del Umbral' });
  await d.wait(600);
  await d.expectSaid(/Pilar del Umbral — Ruinas antiguas/, 'el cartel del Umbral');
  await d.milestone('cartel_umbral', (s) => (s.cells.length >= 5 ? null : `células ${s.cells.length}`));
  await d.settle();
}


export async function runB01(d, name) {
  PLAYER_NAME = name;
  await titleToBedroom(d); await home(d); await lab(d); await northAndCore(d); await leaveTown(d); await route1(d);
}
