// Eventos de la Estación Talasa (docs/CAMPANA.md B13 «Asalto a Talasa», §2.3, §2.6; §5.5; §6.2 B13): Alerce llega en
// barca al embarcadero («Esta vez voy yo.»), técnicos de Genesis (45–48), la compuerta de la cubierta sur (se abre desde
// la consola del invernadero), la puerta sellada del laboratorio (tarjeta de dirección), la dársena con el remolino a
// los pilotes (Buceo, punto equivalente), C059–C060, objetos y, tras N4, la despedida en el embarcadero al atardecer:
// el Porygon de Nilo, «Ha dejado de contestar» (Gael) y la salida del bloque (b13_talasa). La estación sigue accesible.
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, zygardeSays, examine, byGender, findEvent, walkTo, objectPage, pause,
} from './b13_common.js';
import { cellEvent } from './b01_cells.js';
import {
  ARRIVAL, BOAT, BUILDINGS, INTERIOR_ENTRIES, SHUTTER, DIVE, TRAINERS, CELLS, ITEMS, CRATES, LADDER, JETTY, PILES,
} from '../maps/b13/talasa_layout.js';

const A = { speaker: SPEAKER.alerce };

export const TALASA_TEXT = Object.freeze({
  sign: 'ESTACIÓN TALASA\nConsorcio Meridiano de Estudios Geofísicos.\nPROHIBIDO EL PASO A PERSONAL NO AUTORIZADO.',
  shutter: 'Una compuerta de seguridad cierra el paso a la cubierta sur. En un lateral: «Mando desde la consola del invernadero».',
  labSealed: 'Una puerta blindada con un lector de tarjetas. «LABORATORIO · SOLO DIRECCIÓN».',
  labOpen: 'Pasas la tarjeta de dirección por el lector. La puerta se abre con un siseo.',
  crate: 'Cajas precintadas con el emblema de los tubos cruzados. «Material de muestreo · frágil».',
  ladder: 'Una escalerilla de metal baja hasta el agua de la dársena.',
  pool: 'El agua de la dársena es oscura y honda. Por aquí bajan los buzos de la estación.',
  boat: 'La barca de Alerce, amarrada al pantalán.',
  pile: 'Un pilote de hormigón cubierto de percebes. Sostiene la plataforma desde el fondo.',
  sunset: 'El sol tarda en ponerse. Lleva así varios días: tardes de dos horas que no terminan de irse.',
});

// ───────────────────────────── Llegada de Alerce ─────────────────────────────

async function arrivalScene(ctx) {
  if (ctx.flag(F.talArrival)) return;
  const boat = findEvent(ctx, 'barca_alerce');
  const alerce = findEvent(ctx, 'alerce_muelle');
  const nilo = ctx.flag(F.niloDeserted) ? findEvent(ctx, 'nilo_barca') : null;
  ctx.face('player', 'right');
  ctx.se('PRSFX- Motor', { volume: 60 });
  await ctx.say('Se oye un motor acercándose por el este.');
  if (boat) {
    boat.moveTo(BOAT.from.x, BOAT.from.y);
    boat.opacity = 255;
    const route = Array(BOAT.from.x - BOAT.x).fill('left');
    await ctx.move(boat, route, { through: true, speed: 4 });
  }
  if (nilo) { nilo.moveTo(ARRIVAL.nilo.x, ARRIVAL.nilo.y); nilo.opacity = 255; }
  if (alerce) {
    alerce.moveTo(JETTY.x + 2, JETTY.y + 5);
    alerce.opacity = 255;
    await ctx.jump(alerce, 0, 0);
    await walkTo(ctx, alerce, ARRIVAL.alerce.x, ARRIVAL.alerce.y);
    ctx.turnToPlayer(alerce);
  }
  ctx.face('player', alerce ? ctx.directionTo(ctx.player, alerce) : 'right');
  await ctx.say('Esta vez voy yo.', A);
  if (ctx.flag(F.plans)) {
    await lines(ctx, SPEAKER.alerce, [
      'Según los planos de Nilo, el tanque está en el laboratorio de la cubierta este. La puerta solo se abre con una tarjeta de dirección.',
      'La tarjeta estará arriba, en la torre. Y a la cubierta sur se pasa por una compuerta que manejan desde el invernadero.',
    ]);
  } else {
    await lines(ctx, SPEAKER.alerce, [
      'No sé cómo está repartida esta estación. Un laboratorio así tendrá la puerta sellada.',
      'Buscaremos quién tiene la llave. Quien manda, seguramente.',
    ]);
  }
  if (nilo) {
    await lines(ctx, SPEAKER.nilo, ['Yo me quedo en la barca. Ahí dentro me conoce todo el mundo.', 'Suerte. De verdad.']);
  }
  await ctx.say(`Tú encárgate de los técnicos; yo iré detrás de ti, sin hacer ruido. Aquí no eres ${byGender(ctx.state, 'bienvenido', 'bienvenida')}.`, A);
  await zygardeSays(ctx, 'Está aquí. Abajo. Lo oigo.');
  if (alerce) {
    await ctx.move(alerce, ['down', 'left', 'left', 'left'], { through: true, speed: 4 });
    alerce.opacity = 0;
  }
  ctx.bgm(MUSIC.genesis);
  ctx.setFlag(F.talArrival);
}

function arrivalEvents() {
  const pending = when({ none: [F.talArrival] });
  return [
    ...ARRIVAL.trigger.map(([x, y], i) => ({ id: `llegada_talasa_${i}`, x, y, trigger: 'touch', through: true, when: pending, script: arrivalScene })),
    {
      id: 'barca_alerce', x: BOAT.x, y: BOAT.y, name: 'Barca',
      pages: [
        { ...objectPage(OBJ.boat, 2), opacity: 0, through: true, when: pending },
        { when: when({ all: [F.talArrival], none: [F.talDone] }), ...objectPage(OBJ.boat, 2, { stepAnime: true }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TALASA_TEXT.boat); } },
        { when: when({ all: [F.talDone] }), through: true },
      ],
    },
    {
      id: 'alerce_muelle', x: ARRIVAL.alerce.x, y: ARRIVAL.alerce.y, name: SPEAKER.alerce,
      pages: [{ sprite: SPRITE.alerce, dir: 2, opacity: 0, through: true, when: pending }, { when: when({ all: [F.talArrival] }), through: true }],
    },
    {
      // Nilo se queda sentado en la barca durante el asalto (si desertó en B11); en la despedida baja al embarcadero.
      id: 'nilo_barca', x: ARRIVAL.nilo.x, y: ARRIVAL.nilo.y, name: SPEAKER.nilo,
      pages: [
        { sprite: SPRITE.nilo, dir: 2, opacity: 0, through: true, when: pending },
        { when: when({ all: [F.talArrival] }), through: true },
        {
          when: when({ all: [F.talArrival, F.niloDeserted], none: [F.talN4] }), sprite: SPRITE.nilo, dir: 2, move: 'look', through: true,
          trigger: 'action', script: async (ctx) => { await ctx.say('Os espero en la barca. Aquí fuera no me ve nadie. Eso espero.', { speaker: SPEAKER.nilo }); },
        },
      ],
    },
  ];
}

// ───────────────────────────── Compuerta, laboratorio, dársena ─────────────────────────────

function shutterEvents() {
  const out = [];
  for (let y = SHUTTER.y0; y <= SHUTTER.y1; y++) {
    out.push({
      id: `compuerta_${y}`, x: SHUTTER.x, y, name: 'Compuerta',
      pages: [
        { ...objectPage(OBJ.shutter, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TALASA_TEXT.shutter); } },
        { when: when({ all: [F.talGreenhouse] }), ...objectPage(OBJ.shutter, 4), through: true },
      ],
    });
  }
  return out;
}

async function labDoor(ctx) {
  if (!ctx.flag(F.talCard)) { await ctx.say(TALASA_TEXT.labSealed); return; }
  const e = INTERIOR_ENTRIES.talasa_laboratorio;
  if (!ctx.flag(F.talLabIn)) {
    ctx.se('PRSFX- Charge', { volume: 50 });
    await ctx.say(TALASA_TEXT.labOpen);
  }
  await ctx.warp('talasa_laboratorio', e.x, e.y, 8, { door: true });
}

function labDoorEvent() {
  const d = BUILDINGS.lab.door;
  return { id: 'puerta_laboratorio', x: d.x, y: d.y, name: 'Laboratorio', trigger: 'touch', solid: true, script: labDoor };
}

function poolEvents() {
  return [
    // Sin `to`: el punto equivalente de la definición del mapa (dive: talasa_pilotes).
    { id: 'remolino_darsena', type: 'diveSpot', x: DIVE.x, y: DIVE.y },
    examine('escalerilla_darsena', LADDER.x - 1, LADDER.y - 1, TALASA_TEXT.ladder, { through: true }),
  ];
}

// ───────────────────────────── Despedida en el embarcadero ─────────────────────────────

async function niloGift(ctx) {
  const nilo = findEvent(ctx, 'nilo_regalo');
  if (nilo) ctx.turnToPlayer(nilo);
  await ctx.say('Era del laboratorio. No puedo quedármelo.', { speaker: SPEAKER.nilo });
  const pk = await ctx.givePokemon({ species: 'PORYGON', level: 40 });
  if (!pk) {
    await ctx.say('No tienes sitio… Vale. Te lo guardo hasta que vuelvas.', { speaker: SPEAKER.nilo });
    return false;
  }
  ctx.setFlag(F.talPorygon);
  await ctx.say('Lo trataban como a un aparato más. Contigo estará mejor.', { speaker: SPEAKER.nilo });
  return true;
}

async function farewellScene(ctx) {
  if (ctx.flag(F.talDone)) return;
  // La tarde larga de la fase 2 de la crisis (CAMPANA B13 «Cambio»; content/story/crisis.js).
  const st = ctx.state;
  const now = st.data?.clock?.minutes ?? 0;
  const target = 19 * 60 + 10;
  const delta = ((target - (now % 1440)) + 1440) % 1440;
  if (delta > 0 && typeof st.advanceMinutes === 'function') st.advanceMinutes(delta);
  const alerce = findEvent(ctx, 'alerce_despedida');
  ctx.bgm('Emociones');
  await pause(ctx, 20);
  await ctx.say(TALASA_TEXT.sunset);
  if (alerce) {
    ctx.turnToPlayer(alerce);
    ctx.face('player', ctx.directionTo(ctx.player, alerce));
  }
  await ctx.say('Ya está. Zygarde tiene lo que era suyo.', A);
  if (ctx.flag(F.niloDeserted) && !ctx.flag(F.talPorygon)) {
    const nilo = findEvent(ctx, 'nilo_regalo');
    if (nilo) await walkTo(ctx, nilo, 20, 12);
    await niloGift(ctx);
  }
  await lines(ctx, SPEAKER.alerce, [
    'Llamé a Gael antes de salir de Nexo. Quería que viniera.',
  ]);
  await pause(ctx, 30);
  await ctx.say('…Ha dejado de contestar.', A);
  ctx.setFlag(F.talGaelLine);
  await zygardeSays(ctx, 'Donde bajan los buzos. Allí podré cubrirte.');
  await lines(ctx, SPEAKER.alerce, [
    '¿Los buzos de Caleta Sonda? Tienen un muelle al final del pueblo.',
    'Yo vuelvo a Villa Alba. Si necesitas algo, ya sabes dónde encontrarme.',
  ]);
  if (alerce) {
    await walkTo(ctx, alerce, JETTY.x + 2, JETTY.y + 5);
    alerce.opacity = 0;
  }
  // Nilo (si ya ha dado el Porygon) sube a la barca con Alerce; si no, se queda esperando en el embarcadero.
  const nilo = ctx.flag(F.talPorygon) ? findEvent(ctx, 'nilo_regalo') : null;
  if (nilo) {
    await walkTo(ctx, nilo, JETTY.x + 2, JETTY.y + 5);
    nilo.opacity = 0;
  }
  const boat = findEvent(ctx, 'barca_alerce');
  if (boat) {
    ctx.se('PRSFX- Motor', { volume: 60 });
    await ctx.move(boat, ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'], { through: true, speed: 4 });
    boat.opacity = 0;
  }
  ctx.setFlag(F.talDone);
  ctx.requestRefresh();
}

function farewellEvents() {
  const pendingGift = when({ all: [F.talDone, F.niloDeserted], none: [F.talPorygon] });
  return [
    { id: 'despedida_talasa', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.talN4], none: [F.talDone] }), script: farewellScene },
    {
      id: 'alerce_despedida', x: 21, y: 12, name: SPEAKER.alerce,
      pages: [{ through: true }, { when: when({ all: [F.talN4], none: [F.talDone] }), sprite: SPRITE.alerce, dir: 4, solid: true }],
    },
    {
      id: 'nilo_regalo', x: 22, y: 13, name: SPEAKER.nilo,
      pages: [
        { through: true },
        { when: when({ all: [F.talN4, F.niloDeserted], none: [F.talDone] }), sprite: SPRITE.nilo, dir: 4, solid: true },
        { when: pendingGift, sprite: SPRITE.nilo, dir: 2, move: 'look', solid: true, trigger: 'action', script: niloGift },
      ],
    },
  ];
}

// ───────────────────────────── Personajes, objetos y células ─────────────────────────────

const TRAINER_TEXT = {
  tecnico_control: { intro: 'Alto. Esto es una instalación privada del Consorcio.', after: 'Por el paso del oeste se va al invernadero. No es que te lo recomiende.' },
  tecnica_cubierta: { intro: 'Nadie cruza la cubierta sin identificarse. Y tú no tienes identificación.', after: 'La compuerta del sur solo la abre la consola del invernadero.' },
  tecnico_torre: { intro: 'La torre es de la dirección. Nadie sube sin cita.', after: 'La directora guarda la tarjeta en su despacho. Yo no te he dicho nada.' },
  tecnica_laboratorio: { intro: 'Ni un paso más. Detrás de esta puerta está lo único que importa aquí.', after: 'El laboratorio solo se abre con la tarjeta de dirección.' },
};

function trainerEvents() {
  return TRAINERS.map((t) => ({
    id: t.id, type: 'trainer', trainer: t.trainer, name: t.name, sprite: t.female ? SPRITE.techF : SPRITE.tech,
    x: t.x, y: t.y, dir: t.dir, sight: t.sight, intro: TRAINER_TEXT[t.id].intro, after: TRAINER_TEXT[t.id].after,
  }));
}

export function talasaEvents() {
  return [
    ...arrivalEvents(),
    ...trainerEvents(),
    ...shutterEvents(),
    labDoorEvent(),
    ...poolEvents(),
    ...farewellEvents(),
    // El aviso cuelga de la barrera de obras junto al pantalán (stamp de PROPS en (16, 11)).
    { id: 'cartel_talasa', type: 'sign', x: JETTY.x - 1, y: JETTY.y + 8, text: TALASA_TEXT.sign },
    ...CRATES.map(([x, y], i) => examine(`cajas_talasa_${i}`, x, y, TALASA_TEXT.crate, { solid: true, ...objectPage(OBJ.kit, 2) })),
    ...PILES.map(([x, y], i) => examine(`pilote_${i}`, x, y, TALASA_TEXT.pile, { solid: true, ...objectPage(OBJ.pile, [2, 4, 6, 8][i % 4]) })),
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    ...Object.values(CELLS).map((c) => cellEvent({ id: c.key, x: c.x, y: c.y })),
  ];
}
