// Laboratorio del Prof. Alerce — elección de inicial (B01 §4.3; D03, D05). La escena del regreso (§4.7)
// está en b01_town_return.js. Posiciones: ver LAB en este módulo y content/maps/b01/README.md.
import {
  F, V, STARTERS, STARTER_LEVEL, SPEAKER, SPRITE, AUDIO, when, gaelStarterFor,
} from './b01_town_common.js';
import { alerceB11Line } from './b11_home.js'; // B11: tras la escena de Gael

/** Posiciones del laboratorio (mapa laboratorio_alerce). */
export const LAB = Object.freeze({
  entry: { x: 9, y: 13 },          // felpudo (llegada desde el pueblo)
  exitMat: [{ x: 9, y: 13 }, { x: 10, y: 13 }],
  table: { x: 13, y: 9 },          // mesa/máquina con las 3 Poké Balls (fila de arriba)
  alerce: { x: 10, y: 8, dir: 2 },
  gael: { x: 16, y: 9, dir: 4 },
  assistant: { x: 4, y: 8, dir: 8 },
  backDoor: [{ x: 13, y: 3 }, { x: 14, y: 3 }],
  escort: { x: 9, y: 11, dir: 8 },  // llegada tras la escolta del policía (§4.6 → §4.7)
  police: { x: 10, y: 11, dir: 8 },
});

const say = (ctx, speaker, text, opts = {}) => ctx.say(text, { speaker, ...opts });
const speciesName = (ctx, sp) => ctx.db.species?.[sp]?.name || sp;
const taken = (s, sp) => s.var(V.starter, '') === sp || s.var(V.gaelStarter, '') === sp;

// ----------------------------------------------------------------------------- escena de llegada (§4.3)

async function labIntro(ctx) {
  ctx.face('gael', ctx.player);
  await ctx.emote('gael', '…');
  await say(ctx, SPEAKER.gael, 'Llegas tarde, \\PN. Llevo aquí desde que abrió.');
  await say(ctx, SPEAKER.gael, 'El profesor no ha querido empezar sin ti.');
  await ctx.movePlayerTo(LAB.entry.x, LAB.alerce.y + 3, { through: false });
  ctx.face('player', 'up');
  ctx.face('alerce', 'down');
  await say(ctx, SPEAKER.alerce, 'Buenos días, \\PN. Gracias por venir.');
  await say(ctx, SPEAKER.alerce, 'Los temblores de estas noches no se parecen a nada que haya registrado en Villa Alba. Necesito datos de campo: qué Pokémon se mueven, dónde, y qué cambia en el terreno.');
  await say(ctx, SPEAKER.alerce, 'Para eso necesito gente que conozca estos bosques. Y cada uno necesitará un compañero.');
  ctx.face('alerce', 'right');
  await ctx.wait(10);
  await say(ctx, SPEAKER.alerce, 'En esa máquina hay tres Pokémon. Elige al que quieras que te acompañe.');
  ctx.setFlag(F.labIntro);
}

// ----------------------------------------------------------------------------- elección (§4.3)

async function chooseStarter(ctx, index) {
  const sp = STARTERS[index];
  const name = speciesName(ctx, sp);
  const category = ctx.db.species?.[sp]?.category;
  let picture = { close() {} };
  try {
    const mod = await import('./b01_town_picture.js');
    picture = await mod.showPokemonPicture(sp);
  } catch (err) {
    console.warn('No se pudo mostrar el sprite del inicial', err);
  }
  ctx.cry(sp);
  let yes = false;
  try {
    yes = await ctx.confirm(category ? `¿Eliges a ${name}, el Pokémon ${category}?` : `¿Eliges a ${name}?`);
  } finally {
    picture.close();
  }
  if (!yes) return;

  const pkmn = await ctx.givePokemon({ species: sp, level: STARTER_LEVEL }, { silent: true });
  if (!pkmn) return;
  ctx.setVar(V.starter, sp);
  ctx.me(AUDIO.pokemonGet);
  await ctx.say(`¡\\PN ha recibido a ${name}!`);
  await offerNickname(ctx, pkmn, name);
  await gaelTakesHis(ctx, sp);
  await say(ctx, SPEAKER.alerce, 'Cuidad de ellos. Y no os alejéis del pueblo todavía: quiero que os familiaricéis primero.');
  await gaelLeaves(ctx);
  ctx.setFlag(F.starter);
}

async function offerNickname(ctx, pkmn, name) {
  if (!(await ctx.confirm(`¿Quieres ponerle un mote a ${name}?`))) return;
  const text = await ctx.ui.textEntry({ title: `Mote de ${name}`, initial: '', maxLength: 12, iconSpecies: pkmn.species, gender: pkmn.gender });
  const nick = String(text || '').trim();
  if (!nick || nick === name) return;
  const party = ctx.state.party;
  const i = party.findIndex((p) => p.uid === pkmn.uid);
  if (i >= 0) ctx.state.setPartyMember(i, { ...party[i], nickname: nick });
}

/** Gael elige el de ventaja de tipo (D05): camina hasta su Poké Ball y se la queda. */
async function gaelTakesHis(ctx, playerSpecies) {
  const his = gaelStarterFor(playerSpecies);
  const bx = LAB.table.x + STARTERS.indexOf(his);
  const g = ctx.world.events.find((e) => e.id === 'gael');
  if (g) {
    const route = [];
    for (let y = g.y; y < LAB.table.y + 3; y++) route.push('down');
    for (let x = g.x; x > bx; x--) route.push('left');
    for (let x = g.x; x < bx; x++) route.push('right');
    route.push('up', 'turn_up');
    await ctx.move('gael', route);
  }
  await say(ctx, SPEAKER.gael, 'Entonces yo me quedo con este.');
  ctx.se('decision');
  ctx.setVar(V.gaelStarter, his);
  await ctx.wait(20);
  ctx.face('gael', ctx.player);
  await say(ctx, SPEAKER.gael, 'No es personal. Es lo lógico.');
}

/** Gael sale antes que el jugador (§4.3). */
async function gaelLeaves(ctx) {
  const g = ctx.world.events.find((e) => e.id === 'gael');
  if (!g) return;
  const route = ['down'];
  const exit = LAB.exitMat[1];
  for (let x = g.x; x > exit.x; x--) route.push('left');
  for (let x = g.x; x < exit.x; x++) route.push('right');
  for (let y = g.y + 1; y < exit.y; y++) route.push('down');
  await ctx.move('gael', route);
  ctx.se('door_exit');
  ctx.erase('gael');
}

async function ballAfter(ctx) {
  await ctx.say('Queda una Poké Ball en la máquina. Su Pokémon descansa tranquilo.');
}

async function ballBeforeIntro(ctx) {
  await ctx.say('Tres Poké Balls en la máquina del profesor.');
}

// ----------------------------------------------------------------------------- eventos del mapa

/** Poké Balls enteras (gráfico de objeto; el tile 688 solo era la mitad de arriba) sobre la mesa y sus disparadores desde el frente. */
function ballEvents() {
  const out = [];
  STARTERS.forEach((sp, i) => {
    const x = LAB.table.x + i;
    const present = (s) => !taken(s, sp);
    out.push({ id: `bola_${sp}`, x, y: LAB.table.y, sprite: 'Object ball', dir: 2, directionFix: true, walkAnime: false, shadow: false, alwaysOnTop: true, when: present, solid: true, trigger: 'action', script: (ctx) => pick(ctx, i) });
    out.push({ id: `bola_${sp}_frente`, x, y: LAB.table.y + 1, when: present, trigger: 'action', noOver: true, script: (ctx) => pick(ctx, i) });
  });
  return out;
}

async function pick(ctx, index) {
  if (ctx.flag(F.starter)) return ballAfter(ctx);
  if (!ctx.flag(F.labIntro)) return ballBeforeIntro(ctx);
  return chooseStarter(ctx, index);
}

/**
 * Personajes fijos del laboratorio. Gael está junto a la máquina antes de elegir (§4.3) y vuelve para la
 * escena del regreso (§4.7, la dirige b01_town_return.js); el profesor y la ayudante siempre están.
 */
export function labNpcEvents() {
  return [
    {
      id: 'gael', x: LAB.gael.x, y: LAB.gael.y, sprite: SPRITE.gael, dir: LAB.gael.dir, trigger: 'action',
      pages: [
        { when: when({ none: [F.starter] }), script: gaelTalk },
        { when: when({ all: [F.escorted], none: [F.dex] }), script: gaelTalk },
      ],
    },
    {
      id: 'alerce', x: LAB.alerce.x, y: LAB.alerce.y, sprite: SPRITE.alerce, dir: LAB.alerce.dir, trigger: 'action',
      script: alerceTalk,
    },
    {
      id: 'ayudante', x: LAB.assistant.x, y: LAB.assistant.y, sprite: SPRITE.assistant, dir: LAB.assistant.dir, trigger: 'action',
      script: assistantTalk,
    },
    ...LAB.backDoor.map((p, i) => ({
      id: `puerta_fondo_${i}`, x: p.x, y: p.y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Una puerta al fondo del laboratorio. Está cerrada con llave.'); },
    })),
  ];
}

async function gaelTalk(ctx) {
  if (ctx.flag(F.escorted)) return;
  await say(ctx, SPEAKER.gael, ctx.flag(F.labIntro) ? 'Elige tú primero. Luego elegiré yo.' : 'Llevo aquí desde que abrió.');
}

async function alerceTalk(ctx) {
  const later = alerceB11Line(ctx.state);
  if (later) {
    await say(ctx, SPEAKER.alerce, later);
  } else if (ctx.flag(F.dex)) {
    await say(ctx, SPEAKER.alerce, 'Las ruinas del Pilar del Umbral están al sur, pasada la Ruta 1. Id con cuidado.');
  } else if (ctx.flag(F.starter)) {
    await say(ctx, SPEAKER.alerce, 'Cuidad de ellos. Y no os alejéis del pueblo todavía: quiero que os familiaricéis primero.');
  } else if (ctx.flag(F.labIntro)) {
    await say(ctx, SPEAKER.alerce, 'En esa máquina hay tres Pokémon. Elige al que quieras que te acompañe.');
  } else {
    await say(ctx, SPEAKER.alerce, 'Buenos días, \\PN. Gracias por venir.');
  }
}

async function assistantTalk(ctx) {
  if (ctx.flag(F.dex)) {
    await say(ctx, SPEAKER.assistant, 'La Pokédex también envía lecturas del terreno. El profesor revisará todo lo que registres.');
  } else if (ctx.flag(F.starter)) {
    await say(ctx, SPEAKER.assistant, '¡Enhorabuena por tu primer compañero! Cuídalo mucho.');
  } else {
    await say(ctx, SPEAKER.assistant, 'El profesor lleva días repasando los registros de los temblores. Casi no sale de aquí.');
  }
}

export function labChoiceEvents() {
  return [
    // Director de la escena de llegada (auto, una vez)
    { id: 'escena_llegada', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.labIntro, F.starter] }), script: labIntro },
    ...ballEvents(),
    // No se sale sin elegir (tras la presentación)
    ...LAB.exitMat.map((p, i) => ({
      id: `no_salir_${i}`, x: p.x, y: p.y, trigger: 'touch',
      when: when({ all: [F.labIntro], none: [F.starter] }),
      script: async (ctx) => {
        ctx.face('alerce', ctx.directionTo(LAB.alerce, ctx.player));
        await say(ctx, SPEAKER.alerce, '\\PN, todavía no has elegido. Los tres te están esperando en la máquina.');
        await ctx.move('player', ['up'], { through: false });
      },
    })),
  ];
}
