// Escena de desarrollo (?scene=ui): crea una partida de prueba y permite abrir cada pantalla.
// ?open=<id> abre directamente una prueba (útil para capturas con tools/smoke.mjs).
// ?frame=<n> marco de ventana (0 = Añil oscuro) · ?speed=<0..3> velocidad de texto.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { GameState, SaveSystem } from '../../core/state.js';
import { createPokemon } from '../../battle/core/pokemon.js';
import { ui } from '../api.js';
import { CommandWindow } from '../core/list.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { drawText } from '../core/text.js';
import { UI, blit, preload } from '../core/images.js';
import { setOption } from '../core/options.js';

function mk(db, species, level, opts = {}) {
  return createPokemon(db, species, level, { ot: { name: 'Prueba', id: 12345 }, ...opts });
}

/** Partida de prueba con equipo variado, mochila y cajas. */
export function buildTestState(db) {
  const s = GameState.create({ name: 'Prueba', gender: 'M', playerId: 12345 });
  const party = [
    mk(db, 'TURTWIG', 14, { nickname: 'Brote', heldItem: 'ORANBERRY', nature: 'ADAMANT' }),
    { ...mk(db, 'LITTEN', 13, { gender: 'F' }), hp: 12 },
    { ...mk(db, 'SOBBLE', 11, { shiny: true }), status: 'POISON' },
    mk(db, 'SHINX', 16, { gender: 'M', heldItem: 'POTION' }),
    { ...mk(db, 'GIBLE', 18), hp: 0 },
    mk(db, 'ZYGARDE', 30, { form: 1, moves: ['THOUSANDARROWS', 'DRAGONPULSE', 'BITE', 'DIG'] }),
  ];
  party.forEach((p) => s.addPokemon(p));
  const items = {
    POTION: 5, SUPERPOTION: 2, HYPERPOTION: 1, ANTIDOTE: 2, PARALYZEHEAL: 1, FULLHEAL: 1, REVIVE: 2, ETHER: 1,
    RARECANDY: 3, PROTEIN: 1, FIRESTONE: 1, REPEL: 4, ESCAPEROPE: 1,
    POKEBALL: 12, GREATBALL: 4, ULTRABALL: 1, TM01: 1, TM24: 1, TM26: 1,
    ORANBERRY: 4, SITRUSBERRY: 2, PECHABERRY: 1, XATTACK: 2, XSPEED: 1, TOWNMAP: 1, EXPSHARE: 1,
  };
  for (const [id, n] of Object.entries(items)) if (db.items[id]) s.addItem(id, n);
  const boxed = ['PIKACHU', 'EEVEE', 'RIOLU', 'GASTLY', 'MAGIKARP', 'DRIFLOON', 'MUNCHLAX', 'CUBONE'];
  boxed.forEach((sp, i) => {
    if (!db.species[sp]) return;
    const p = mk(db, sp, 5 + i * 3);
    s.registerCaught(sp);
    s.data.boxes[0][i * 2] = p;
  });
  const dex = db.dex?.entries || [];
  dex.slice(0, 40).forEach((e, i) => { if (e.id && db.species[e.id]) (i % 3 ? s.registerSeen(e.id) : s.registerCaught(e.id)); });
  s.data.dex.obtained = true;
  s.addMoney(18450);
  s.data.playTimeFrames = 60 * 60 * 95;
  s.addCell('celula_prueba_1');
  s.addCell('celula_prueba_2');
  s.addCore('nucleo_prueba_1');
  return s;
}

const TESTS = [
  ['msg', 'Mensaje simple', () => ui.message('¡Hola, \\PN! Esto es una prueba de la caja de diálogo de Ecos del Espacio-Tiempo.')],
  ['long', 'Mensaje largo', () => ui.message('Este texto es bastante más largo que dos líneas, así que la caja tendrá que desplazarse hacia arriba cuando llegue al final del espacio disponible.\\.\\. Pulsa A para continuar leyendo el resto del mensaje, que ocupa varias líneas más.')],
  ['codes', 'Códigos y colores', () => ui.message('Colores: \\c[1]azul\\c[0], \\c[2]rojo\\c[0], \\c[3]verde\\c[0]. Pausa\\|... y ahora \\bchico\\c[0] y \\rchica\\c[0].\\fEsta es una página nueva (código de salto de página).')],
  ['speaker', 'Con hablante', () => ui.message('Hablo con una etiqueta de nombre encima de la caja.', { speaker: 'Vecina' })],
  ['core', 'Telepatía (Core)', async () => {
    await ui.message('[PROVISIONAL] Texto de prueba del estilo telepático.', { telepathy: true });
    await ui.message('Segunda línea de prueba, sin contenido narrativo.', { telepathy: true });
  }],
  ['choice', 'Elección', async () => {
    const i = await ui.choice(['Planta', 'Fuego', 'Agua', 'Cancelar'], { message: '¿Qué tipo prefieres?', cancel: 3 });
    await ui.message(`Elegiste la opción ${i}.`);
  }],
  ['confirm', 'Sí / No', async () => {
    const ok = await ui.confirm('¿Quieres continuar?');
    await ui.message(ok ? 'Has dicho que sí.' : 'Has dicho que no.');
  }],
  ['number', 'Número', async () => {
    const n = await ui.number({ min: 1, max: 99, initial: 1, message: '¿Cuántas quieres?', formatter: (v) => `${v * 200} $` });
    await ui.message(n === null ? 'Cancelado.' : `Has elegido ${n}.`);
  }],
  ['naming', 'Introducir nombre', async () => {
    const name = await ui.textEntry({ title: 'Nombre del Pokémon', initial: '', maxLength: 12, iconSpecies: 'TURTWIG' });
    await ui.message(`Nombre: «${name}».`);
  }],
  ['toast', 'Aviso + cartel de zona', () => { ui.showLocation('Zona de pruebas'); ui.toast('Has obtenido una Célula.'); }],
  ['pause', 'Menú de pausa', () => ui.openPauseMenu()],
  ['party', 'Equipo', () => ui.openParty({ mode: 'view' })],
  ['summary', 'Datos de Pokémon', () => ui.openSummary(engine.state.party[0], { party: engine.state.party, index: 0 })],
  ['bag', 'Mochila', () => ui.openBag({ mode: 'field' })],
  ['bagBattle', 'Mochila (combate)', async () => {
    const it = await ui.openBag({ mode: 'battle' });
    await ui.message(`Objeto elegido: ${it || 'ninguno'}.`);
  }],
  ['pokedex', 'Pokédex', () => ui.openPokedex()],
  ['options', 'Opciones', () => ui.openOptions()],
  ['save', 'Guardar', () => ui.openSave()],
  ['load', 'Cargar', async () => {
    // Siembra una ranura de prueba si no hay ninguna partida guardada.
    if (!SaveSystem.list().some(Boolean)) SaveSystem.save(1, engine.state);
    const st = await ui.openLoad();
    await ui.message(st ? `Cargada la partida de ${st.player.name} (no se aplica en la escena de pruebas).` : 'No se cargó nada.');
  }],
  ['shop', 'Tienda', () => ui.openShop(['POTION', 'SUPERPOTION', 'ANTIDOTE', 'PARALYZEHEAL', 'POKEBALL', 'GREATBALL', 'REPEL', 'ESCAPEROPE', 'FULLHEAL', 'REVIVE'])],
  ['storage', 'PC (cajas)', () => ui.openStorage()],
  ['map', 'Mapa / Vuelo', () => ui.openRegionMap({ fly: true })],
  ['learn', 'Aprender movimiento', async () => {
    const p = engine.state.party[3];
    const idx = await ui.learnMove(p, 'THUNDERBOLT');
    await ui.message(idx === null ? 'No aprendió el movimiento.' : `Olvidaría el movimiento ${idx}.`);
  }],
  ['evolve', 'Evolución', async () => {
    const ok = await ui.evolve(engine.state.party[0], 'GROTLE');
    await ui.message(ok ? 'Evolucionó (la pantalla no modifica los datos).' : 'Evolución cancelada.');
  }],
  ['card', 'Tarjeta de entrenador', () => ui.openTrainerCard()],
  ['zygarde', 'Zygarde', () => ui.openZygarde()],
  ['title', 'Pantalla de título', async () => {
    const mod = await import('../screens/title.js');
    await engine.scenes.replace(new mod.default(), {});
  }],
];

export default class UITestScene extends Scene {
  async enter(params = {}) {
    if (!engine.state) engine.state = buildTestState(engine.data);
    if (params.frame !== undefined) setOption('frame', Number(params.frame) || 0);
    if (params.speed !== undefined) setOption('textSpeed', Number(params.speed) || 0);
    await Promise.all([preloadDialogGfx(), preload([UI('Party/bg.png')])]);
    this.win = new CommandWindow(TESTS.map((t) => t[1]), { x: 8, y: 36, maxRows: 9, width: 284, cancelIndex: null });
    this.busy = false;
    this.last = '';
    if (params.open) {
      const test = TESTS.find((t) => t[0] === params.open);
      if (test) setTimeout(() => this.run(test), 50);
    }
  }

  async run(test) {
    this.busy = true;
    this.last = test[1];
    try {
      await test[2]();
    } catch (err) {
      console.error(err);
      await ui.message(`Error en «${test[1]}»: ${err.message}`).catch(() => {});
    }
    this.busy = false;
  }

  update() {
    if (this.busy) return;
    const r = this.win.update(engine.input);
    if (r && r.type === 'select') this.run(TESTS[r.index]);
  }

  drawUI(g) {
    blit(g, UI('Party/bg.png'), 0, 0);
    drawText(g, 'Pruebas de interfaz', SCREEN_W / 2, 4, { align: 'center', color: '#f8f8f8', shadow: '#283048' });
    this.win.draw(g);
    const s = engine.state;
    const info = [
      `Jugador: ${s.player.name}`, `Dinero: ${s.player.money}`, `Equipo: ${s.party.length}`,
      `Opción: ${this.last || '—'}`,
    ];
    info.forEach((line, i) => drawText(g, line, 304, 44 + i * 30, { color: '#f8f8f8', shadow: '#283048', font: 'small' }));
    drawText(g, 'A: abrir · flechas: elegir', SCREEN_W / 2, SCREEN_H - 30, { align: 'center', color: '#f8f8f8', shadow: '#283048', font: 'small' });
  }
}
