// Laboratorio del tanque de la Estación Talasa (docs/CAMPANA.md B13, puntos 4–7; §2.4 N4; §5.2–5.5): Casia y Garrido
// junto al tanque de presión «Muestra Z-4»; combate doble con Alerce de aliado (Probopass 50, Bronzong 50, Gastrodon 51,
// Porygon2 52); la escena clave a mitad del combate (fase de diálogo del motor, battle/core/bossPhases.js); Alerce abre
// el tanque manejando los controles sin mirar; Vértice aparece en la pantalla como Líder Supremo; N4 se une al Core.
// Si se pierde, se reintenta desde la puerta del laboratorio con el equipo curado (helper común bossBattle).
import { grantCore } from '../../world/zygarde/scenes.js';
import { F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, bossBattle, findEvent, walkTo, objectPage } from './b13_common.js';
import { showScreen } from './b13_screen.js';

/** Sala 26×17: suelo y 4–15, felpudo x 12–13 en y 15. */
export const LAB = Object.freeze({
  width: 26, height: 17, room: { x: 1, y: 1, w: 24, h: 15 }, door: { x: 12, y: 15 },
  tank: { x: 12, y: 6 }, // tanque 3×3 (la base ocupa x 11–13, y 6)
  screen: { x: 19, y: 3 },
  console: { x: 16, y: 6 },
  consoleFrom: { x: 16, y: 7 },
  casia: { x: 11, y: 9, dir: 2 },
  garrido: { x: 13, y: 9, dir: 2 },
  stand: { x: 12, y: 11 }, // casilla del jugador en la escena
  alerceStand: { x: 13, y: 11 },
  retry: { x: 12, y: 14, dir: 8 }, // puerta del laboratorio (CAMPANA: «desde la puerta del laboratorio»)
  alerceDoor: { x: 13, y: 14 },
});

/** Equipo de Alerce (CAMPANA B13 y §5.5). */
export const ALERCE_PARTY = Object.freeze([
  { species: 'PROBOPASS', level: 50 }, { species: 'BRONZONG', level: 50 },
  { species: 'GASTRODON', level: 51 }, { species: 'PORYGON2', level: 52 },
]);

/** Escena clave a mitad del combate (CAMPANA B13 punto 5, literal): fase de diálogo al caer el primer Pokémon de Casia. */
export const KEY_LINES = Object.freeze([
  'Casia: «Profesor. ¿Sigue calibrando a mano? Vértice siempre decía que usted era el único que sabía escuchar a los Pilares.»',
  'Alerce: «Ya no.»',
]);

/** Petición del combate doble (formato de dobles con aliado de B06; fases del motor). */
export function labBattleRequest() {
  return {
    type: 'trainer', format: 'double', trainers: ['b13_casia', 'b13_garrido'],
    ally: { name: 'Alerce', party: ALERCE_PARTY.map((p) => ({ ...p })), skill: 72 },
    bgm: MUSIC.commander,
    phases: [{ faint: true, name: 'calibrar_a_mano', messages: [...KEY_LINES] }],
    phaseTarget: 1, // el primer puesto rival: los Pokémon de Casia
  };
}

export const LAB_TEXT = Object.freeze({
  tank: 'En el centro de la sala, un tanque de presión. Dentro, algo verde late despacio contra el cristal. En la placa: «MUESTRA Z-4».',
  tankOpen: 'El tanque está abierto y vacío. Solo queda un cerco verde en el cristal.',
  consoleOff: 'La consola del tanque. Válvulas, manómetros y un teclado sin rótulos.',
  hands: [
    'Alerce se acerca a la consola del tanque.',
    'Gira dos válvulas, pulsa una secuencia en el teclado y baja la palanca de descompresión. No mira los mandos ni una sola vez.',
  ],
  hiss: 'La presión baja con un silbido largo. El cristal del tanque se abre.',
  loseText: ['Otra vez. Son dos, pero nosotros también.', 'Respira. Te espero junto a la puerta.'],
});

// ───────────────────────────── Escena ─────────────────────────────

async function battle(ctx) {
  const outcome = await bossBattle(ctx, labBattleRequest(), LAB.retry, {
    speaker: SPEAKER.alerce, loseText: [...LAB_TEXT.loseText],
    onLose: (c) => {
      const alerce = findEvent(c, 'alerce_lab');
      if (alerce) { alerce.moveTo(LAB.alerceDoor.x, LAB.alerceDoor.y); alerce.direction = 8; }
    },
  });
  if (outcome !== 'win') return false;
  ctx.setFlag(F.talBattle);
  return true;
}

/** Primera entrada con la tarjeta: Casia y Garrido junto al tanque. */
async function labIntro(ctx) {
  ctx.setFlag(F.talLabIn);
  const alerce = findEvent(ctx, 'alerce_lab');
  ctx.bgm(MUSIC.tension);
  await ctx.say(LAB_TEXT.tank);
  await ctx.movePlayerTo(LAB.stand.x, LAB.stand.y);
  if (alerce) await walkTo(ctx, alerce, LAB.alerceStand.x, LAB.alerceStand.y);
  ctx.face('player', 'up');
  if (alerce) ctx.face(alerce, 'up');
  const cells = ctx.state.cellCount?.() ?? ctx.state.data.zygarde?.cells?.length ?? 0;
  await ctx.emote('casia', '…');
  ctx.face('casia', 'down');
  ctx.face('garrido', 'down');
  await lines(ctx, SPEAKER.casia, [
    `El portador del Core. ${cells} células, si los registros de la costa no fallan. Y viene acompañado.`,
    'Profesor Alerce. Tan lejos de Villa Alba.',
  ]);
  await ctx.say('Abrid el tanque.', { speaker: SPEAKER.alerce });
  await lines(ctx, SPEAKER.garrido, ['No podemos, profesor. Órdenes.', 'Nada personal. Pero la muestra se queda donde está.']);
  await ctx.say('Si quieren el núcleo, que demuestren que saben qué hacer con él.', { speaker: SPEAKER.casia });
  await ctx.say('\\PN. A mi lado.', { speaker: SPEAKER.alerce });
  if (await battle(ctx)) await afterBattle(ctx);
}

/** Tras perder (o al volver a entrar): hablar con Casia, Garrido o Alerce repite el combate. */
async function retryTalk(ctx) {
  if (ctx.flag(F.talBattle)) return;
  const i = await ctx.choice(['Sí', 'No'], { message: '¿Volver a enfrentarte a Casia y Garrido con Alerce?', cancel: 1 });
  if (i !== 0) return;
  const alerce = findEvent(ctx, 'alerce_lab');
  await ctx.movePlayerTo(LAB.stand.x, LAB.stand.y);
  if (alerce) await walkTo(ctx, alerce, LAB.alerceStand.x, LAB.alerceStand.y);
  ctx.face('player', 'up');
  if (await battle(ctx)) await afterBattle(ctx);
}

/** Después del combate: el tanque, la pantalla de Vértice y N4. */
async function afterBattle(ctx) {
  ctx.bgm(MUSIC.genesis);
  // (Las frases de derrota de Casia y Garrido ya las dice el combate: aquí sigue la escena, sin repetirlas.)
  await ctx.say('Doctora, se acabó. No vamos a sacar nada más de aquí.', { speaker: SPEAKER.garrido });
  await ctx.say('La muestra no sale de este laboratorio. Es la orden.', { speaker: SPEAKER.casia });
  const alerce = findEvent(ctx, 'alerce_lab');
  if (alerce) {
    await walkTo(ctx, alerce, LAB.consoleFrom.x, LAB.consoleFrom.y);
    ctx.face(alerce, 'up');
  }
  for (const t of LAB_TEXT.hands) await ctx.say(t);
  ctx.se('PRSFX- Shift Gear', { volume: 80 });
  await ctx.wait(20);
  ctx.se('PRSFX- Mist', { volume: 90 });
  const tank = findEvent(ctx, 'tanque_z4');
  if (tank) tank.direction = 4;
  await ctx.flash([200, 255, 180], 12, 110);
  await ctx.say(LAB_TEXT.hiss);
  // La pantalla se enciende: el Líder Supremo (CAMPANA B13 punto 6; §5.2 «revelación como líder»).
  ctx.se('PRSFX- Charge', { volume: 60 });
  const wall = findEvent(ctx, 'pantalla_lab');
  if (wall) wall.direction = 4;
  await ctx.wait(20);
  ctx.face('casia', 'right');
  ctx.face('garrido', 'right');
  ctx.face('player', 'right');
  if (wall) wall.direction = 6;
  const screen = await showScreen('vertice_front', { caption: 'GENESIS · LÍDER SUPREMO' });
  try {
    await ctx.say('Doctora Varela. Garrido. Es suficiente por hoy.', { speaker: SPEAKER.vertice });
    await lines(ctx, SPEAKER.vertice, [
      'Volvemos a vernos. En la gala me conociste como mecenas del museo. Aquí puedo presentarme como corresponde.',
      'Aurelio Vértice. Genesis responde ante mí.',
      'Déjales el núcleo. Ya hemos aprendido lo que necesitábamos.',
    ]);
    await ctx.say('Sí, doctor.', { speaker: SPEAKER.casia });
    await ctx.say('Recogemos.', { speaker: SPEAKER.garrido });
  } finally {
    screen.close();
  }
  if (wall) wall.direction = 2;
  ctx.se('PRSFX- Mist', { volume: 50 });
  await ctx.wait(20);
  // N4 sale del tanque y se une al Core (CAMPANA §2.4).
  await joinN4(ctx, tank);
  await lines(ctx, SPEAKER.casia, ['Nos volveremos a ver. Los registros no se borran.']);
  for (const id of ['casia', 'garrido']) {
    const ev = findEvent(ctx, id);
    if (ev) ctx.move(ev, ['down', 'down', 'down', 'down', 'down', 'down'], { wait: false, through: true, speed: 4 });
  }
  await ctx.wait(70);
  for (const id of ['casia', 'garrido']) ctx.erase(id);
  ctx.setFlag(F.talN4);
  await ctx.say('Vámonos de aquí. Te espero en el embarcadero.', { speaker: SPEAKER.alerce });
  await ctx.fade('out', 30);
  await ctx.warp('estacion_talasa', 19, 12, 8, { fade: false });
  await ctx.fade('in', 30);
}

async function joinN4(ctx, tank) {
  ctx.se('core_signal', { volume: 80 });
  const at = tank || { x: LAB.tank.x, y: LAB.tank.y };
  let burst = null;
  try {
    burst = ctx.effect?.('zygardeHexBurst', { x: at.x, y: at.y, mode: 'out', count: 30 });
  } catch (err) {
    console.warn('[b13] efecto de N4', err);
  }
  await ctx.flash([185, 255, 102], 20, 170);
  if (tank) tank.direction = 6;
  await ctx.say('Un núcleo verde sale del tanque, flota hacia ti y se funde con el Core.');
  burst?.remove?.(20);
  await grantCore(ctx, 'N4', { scenes: false });
  // Zygarde habla muy poco (autor, 25-09-2026): N4 se une en silencio; sin anunciar el Buceo.
}

// ───────────────────────────── Eventos ─────────────────────────────

export function labEvents() {
  const talk = { trigger: 'action', script: retryTalk };
  return [
    {
      id: 'escena_lab', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.talCard], none: [F.talLabIn] }),
      script: labIntro,
    },
    {
      id: 'tanque_z4', x: LAB.tank.x, y: LAB.tank.y, name: 'Tanque de presión',
      pages: [
        { ...objectPage(OBJ.tank, 2, { stepAnime: true }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(LAB_TEXT.tank); } },
        { when: when({ all: [F.talN4] }), ...objectPage(OBJ.tank, 6), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(LAB_TEXT.tankOpen); } },
      ],
    },
    ...[LAB.tank.x - 1, LAB.tank.x + 1].map((x, i) => ({ id: `tanque_base_${i}`, x, y: LAB.tank.y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(ctx.flag(F.talN4) ? LAB_TEXT.tankOpen : LAB_TEXT.tank); } })),
    // El cuerpo del tanque (el sprite ocupa tres filas): nadie se mete detrás del cristal.
    ...[LAB.tank.y - 2, LAB.tank.y - 1].flatMap((y) => [LAB.tank.x - 1, LAB.tank.x, LAB.tank.x + 1].map((x) => ({ id: `tanque_cuerpo_${x}_${y}`, x, y, solid: true, noOver: true }))),
    {
      id: 'pantalla_lab', x: LAB.screen.x, y: LAB.screen.y, name: 'Pantalla', ...objectPage(OBJ.screen, 2), through: true,
    },
    { id: 'consola_tanque', x: LAB.console.x, y: LAB.console.y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(LAB_TEXT.consoleOff); } },
    {
      id: 'casia', x: LAB.casia.x, y: LAB.casia.y, name: SPEAKER.casia,
      pages: [
        { when: when({ none: [F.talN4] }), sprite: SPRITE.casia, dir: 8, ...talk },
        { when: when({ all: [F.talN4] }), through: true },
      ],
    },
    {
      id: 'garrido', x: LAB.garrido.x, y: LAB.garrido.y, name: SPEAKER.garrido,
      pages: [
        { when: when({ none: [F.talN4] }), sprite: SPRITE.garrido, dir: 8, ...talk },
        { when: when({ all: [F.talN4] }), through: true },
      ],
    },
    {
      id: 'alerce_lab', x: LAB.alerceDoor.x, y: LAB.alerceDoor.y, name: SPEAKER.alerce,
      pages: [
        { through: true },
        { when: when({ all: [F.talCard], none: [F.talN4] }), sprite: SPRITE.alerce, dir: 8, ...talk },
      ],
    },
  ];
}
