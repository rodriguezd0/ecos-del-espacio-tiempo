// T13 · «La torre de hielo» (docs/TABLILLAS.md §4.5; CAMPANA B15): en los Talleres del Hielo, el tallista Rosendo (80,
// casi ciego) no reconoce el hielo del Lago Viejo —tiene capas antiguas de la glaciación-eco— y su Frigibax ya no se le
// acerca (desvinculación). Su sobrina nieta Nieves (16) no se atreve a tallar sola y el concejo quiere suspender la Torre
// de Hielo que guía a los viajeros. En el lago (content/events/b15_lago.js) se abre paso hasta el bloque antiguo; Nieves
// lo talla, aparece la Tabla Helada y, esa noche, la Torre vuelve a la plaza. Recompensa: Froslassita.
// Continuidad de Nieves: Talleres (antes de ir al lago y tras la ceremonia) · Lago Viejo (camino del bloque) · plaza
// (ceremonia). Rosendo: Talleres salvo durante la ceremonia.
import { F, SPEAKER, SPRITE, OBJ, isNorthUnbound, zygardeSays, lines, byGender, pause, when, fx } from './b15_common.js';
import { TALLERES, BOREAL } from '../maps/b15/layout_boreal.js';
import { LAGO, lakeToMap } from '../maps/b15/layout_lago.js';
import { LAKE } from './b15_lago_logic.js';
import { resetLake } from './b15_lago.js';

const R = { speaker: SPEAKER.rosendo };
const N = { speaker: SPEAKER.nieves };

export const T13_TEXT = Object.freeze({
  rosendo: [
    '¿Quién anda por ahí? …Pasa, pasa. Tengo los ojos cansados, pero el oído todavía me sirve.',
    'Me llamo Rosendo. Llevo sesenta inviernos tallando la Torre de Hielo de Boreal.',
    'Este año bajé al Lago Viejo a elegir los bloques, como siempre. Puse las manos en el hielo y no lo reconocí.',
    'Tiene capas que no son de este invierno. Ni del anterior. Hielo muy viejo, que el lago ha sacado a flote cuando se fue esa helada rara.',
    'Y mi Frigibax, que dormía a mis pies desde que salió del huevo, ya no se me acerca. Me mira desde la esquina como a un extraño.',
  ],
  rosendoZygardeClue: '«El hielo más viejo». Ahí espera.',
  rosendoZygardeDirect: 'Hielo que recuerda. Ahí dentro hay algo.',
  rosendoAgain: 'El hielo viejo está en el lago, al noreste del pueblo. Nieves conoce el camino. Yo ya solo lo conozco de oído.',
  rosendoAfter: [
    'Nieves se queda con el oficio. Yo me quedo con el oído: la Torre suena distinta este año.',
  ],
  rosendoUnbound: 'El Frigibax sigue sin acercarse. Pero anoche durmió aquí, en el taller. Algo es algo.',
  rosendoRebound: 'Mi Frigibax ha vuelto a dormir a mis pies. No hace falta ver para saberlo.',
  nieves: [
    'Soy Nieves. Rosendo es mi tío abuelo, pero todo el mundo le llama abuelo.',
    'Él ya no puede bajar al lago con los ojos así. Y yo… nunca he sacado un bloque sola.',
    'El hielo del lago cruje: cada placa aguanta dos pasadas, y a la tercera te vas al agua.',
    'El concejo quiere dejar la Torre para el año que viene. Pero sin Torre, con ventisca, los que bajan del Paso se pierden.',
  ],
  nievesAsk: '¿Vienes conmigo al Lago Viejo?',
  nievesYes: '¡Vale! Te espero en el embarcadero del lago. Se sale del pueblo por el camino del noreste.',
  nievesNo: 'Si cambias de idea, aquí estaré.',
  nievesAfter: 'Ahora tallo yo. El abuelo me corrige de oído. Dice que tengo buena mano. ¡Él, que nunca dice nada!',
  lakeIntro: [
    'Este es el Lago Viejo. El bloque antiguo es ese, el oscuro del rincón. ¿Lo ves? Está encajado detrás de un bloque normal.',
    'Para sacarlo hay que ponerse justo delante, en la placa de abajo. Pero el hielo resbala: si empiezas a andar, no paras hasta chocar con algo.',
    'Y cruje. Cada placa aguanta dos pasadas; a la tercera, al agua. Los bloques normales se pueden romper; las rocas, no.',
    'Si te caes, no pasa nada: el lago vuelve a cerrarse y empezamos de nuevo. Y si ves el hielo muy tocado, dímelo y lo dejamos reposar.',
  ],
  lakeMenu: '¿Qué hacemos?',
  hints: [
    'Las rocas y los bloques son tus frenos: fíjate en dónde te dejarían parado antes de dar el primer paso.',
    'Al bloque antiguo solo se llega subiendo por su misma columna. Busca cómo meterte en ella.',
    'Romper un bloque también te quita un freno. Piensa cuál necesitas todavía.',
  ],
  lakeAlone: 'Un lago helado con bloques cortados en la orilla. Sin alguien que conozca este hielo, mejor no fiarse de él.',
  hut: 'La caseta de Rosendo: sierras, garfios y un banco lleno de virutas de hielo.',
  sign: 'LAGO VIEJO\nHielo para la Torre. No pisar sin el tallista.',
  pull: 'Yo tiro. Tú guía.',
  pulled: 'Zygarde tiende sus vetas verdes alrededor del bloque. Con un crujido largo, el hielo antiguo se suelta del lago.',
  carve: 'Nieves talla el bloque despacio, capa a capa, como le enseñó su abuelo.',
  found: 'Aquí dentro hay algo. …¡Una tabla! Estaba en el corazón del hielo.',
  foundZygarde: 'La decimotercera. Estaba en el hielo más viejo.',
  tower: 'Y con el resto del bloque… me da para la Torre entera. ¡Esta noche la levantamos!',
  night: 'Esa noche, media Villa Boreal se reúne en la plaza.',
  ceremony: {
    rosendoTouch: '…Esta sí. Esta la conozco.',
    nieves: 'La he tallado yo sola, abuelo. Bueno. Con ayuda.',
    rosendo: 'El oficio es tuyo, Nieves. Yo ya solo sé escucharlo.',
    gift: (s) => `Y tú, ${byGender(s, 'muchacho', 'muchacha')}, toma. Mi maestra me la dio cuando tallé mi primera Torre. Brilla como el hielo que no se deshace.`,
    thanks: 'La Torre vuelve a guiar a los viajeros. Gracias.',
  },
});

// ───────────────────────────── Talleres del Hielo ─────────────────────────────

const atWorkshop = (s) => Boolean(s) && (!s.flag(F.nieves) || s.flag(F.froslassite));
const atLake = (s) => Boolean(s) && s.flag(F.nieves) && !s.flag(F.tower);
const atCeremony = (s) => Boolean(s) && s.flag(F.tower) && !s.flag(F.froslassite);
const rosendoHome = (s) => Boolean(s) && (!s.flag(F.tower) || s.flag(F.froslassite));
export const NIEVES_WHERE = Object.freeze({ atWorkshop, atLake, atCeremony });
export const ROSENDO_WHERE = Object.freeze({ rosendoHome, atCeremony });

async function rosendoTalk(ctx) {
  if (ctx.flag(F.froslassite)) {
    await lines(ctx, SPEAKER.rosendo, T13_TEXT.rosendoAfter);
    await ctx.say(isNorthUnbound(ctx.state) ? T13_TEXT.rosendoUnbound : T13_TEXT.rosendoRebound, R);
    return;
  }
  if (ctx.flag(F.rosendo)) { await ctx.say(T13_TEXT.rosendoAgain, R); return; }
  await lines(ctx, SPEAKER.rosendo, T13_TEXT.rosendo);
  const had = ctx.story?.clueStatus?.('T13');
  if (!had || had === 'none') await ctx.story?.openClue?.('T13', { direct: true, silent: true });
  await ctx.story?.advanceClue?.('T13', 2);
  ctx.setFlag(F.rosendo);
  await zygardeSays(ctx, had && had !== 'none' ? T13_TEXT.rosendoZygardeClue : T13_TEXT.rosendoZygardeDirect);
}

async function nievesTalk(ctx) {
  if (ctx.flag(F.froslassite)) { await ctx.say(T13_TEXT.nievesAfter, N); return; }
  await lines(ctx, SPEAKER.nieves, T13_TEXT.nieves);
  if (!ctx.flag(F.rosendo)) {
    const had = ctx.story?.clueStatus?.('T13');
    if (!had || had === 'none') await ctx.story?.openClue?.('T13', { direct: true, silent: true });
    await ctx.story?.advanceClue?.('T13', 2);
    ctx.setFlag(F.rosendo);
  }
  const i = await ctx.choice(['Vamos', 'Ahora no'], { message: T13_TEXT.nievesAsk, cancel: 1 });
  if (i !== 0) { await ctx.say(T13_TEXT.nievesNo, N); return; }
  await ctx.say(T13_TEXT.nievesYes, N);
  await ctx.fade('out', 16);
  ctx.setFlag(F.nieves);
  await pause(ctx, 10);
  await ctx.fade('in', 16);
}

export function talleresEvents() {
  const T = TALLERES;
  const unbound = (s) => isNorthUnbound(s);
  return [
    {
      id: 'rosendo', x: T.rosendo.x, y: T.rosendo.y, name: SPEAKER.rosendo,
      pages: [{ when: rosendoHome, sprite: SPRITE.rosendo, dir: T.rosendo.dir, move: 'still', trigger: 'action', script: rosendoTalk }],
    },
    {
      id: 'nieves_talleres', x: T.nieves.x, y: T.nieves.y, name: SPEAKER.nieves,
      pages: [{ when: atWorkshop, sprite: SPRITE.nieves, dir: T.nieves.dir, move: 'look', trigger: 'action', script: nievesTalk }],
    },
    {
      id: 'frigibax_rosendo', x: T.frigibax.x, y: T.frigibax.y, name: 'Frigibax',
      pages: [
        { when: (s) => unbound(s) || !s?.flag(F.p8), sprite: SPRITE.frigibax, dir: 8, stepAnime: true, move: 'look', trigger: 'action', script: async (ctx) => { ctx.cry('FRIGIBAX'); await ctx.say('El Frigibax se esconde tras los bloques. Mira a Rosendo desde lejos, sin acercarse.'); } },
      ],
    },
    {
      id: 'frigibax_vuelta', x: T.rosendo.x + 1, y: T.rosendo.y + 1, name: 'Frigibax',
      pages: [{ when: (s) => Boolean(s) && s.flag(F.p8) && !unbound(s), sprite: SPRITE.frigibax, dir: 4, stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry('FRIGIBAX'); await ctx.say('¡Frii!', { speaker: 'Frigibax' }); } }],
    },
    ...T.blocks.map(([x, y], i) => ({ id: `bloque_taller_${i}`, x, y, name: 'Bloque de hielo', sprite: SPRITE.iceObject, dir: 2 + 2 * (i % 3), directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Bloques de hielo del lago de otros inviernos, guardados en serrín.'); } })),
    { id: 'talla_banco', x: T.bench.x, y: T.bench.y, name: 'Talla', sprite: OBJ.sculptures, dir: 2, pattern: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una Torre de Hielo en miniatura, tallada con mucho cuidado. En la base, grabado: «Rosendo, primer invierno».'); } },
  ];
}

// ───────────────────────────── Lago Viejo ─────────────────────────────

async function lakeIntro(ctx) {
  ctx.setFlag(F.lakeSeen);
  await lines(ctx, SPEAKER.nieves, T13_TEXT.lakeIntro);
}

async function nievesLake(ctx) {
  if (!ctx.flag(F.lakeSeen)) { await lakeIntro(ctx); return; }
  const i = await ctx.choice(['Pedir consejo', 'Empezar de nuevo', 'Nada'], { message: T13_TEXT.lakeMenu, cancel: 2 });
  if (i === 0) {
    const n = (Number(ctx.var('b15_lago_consejo', 0)) || 0) % T13_TEXT.hints.length;
    ctx.setVar('b15_lago_consejo', n + 1);
    await ctx.say(T13_TEXT.hints[n], N);
  } else if (i === 1) {
    await ctx.fade('out', 12);
    resetLake(ctx.state);
    ctx.requestRefresh();
    await ctx.fade('in', 12);
    await ctx.say('El agua que asoma entre las grietas vuelve a helarse. El lago está como al principio.');
  }
}

/** Escena al sacar el bloque antiguo (b15_lago.js → lakeEvents({ onAncient })). */
export async function extractAncient(ctx) {
  if (!ctx.flag(F.nieves)) {
    const had = ctx.story?.clueStatus?.('T13');
    if (!had || had === 'none') await ctx.story?.openClue?.('T13', { direct: true });
    await ctx.say(T13_TEXT.lakeAlone);
    await ctx.say('Sacarlo sin alguien que sepa tallar sería romperlo. En el pueblo, en los Talleres del Hielo, sabrán qué hacer.');
    return;
  }
  await zygardeSays(ctx, T13_TEXT.pull);
  const [ax, ay] = lakeToMap(...LAKE.ancient);
  const burst = fx(ctx, 'zygardeHexBurst', { x: ax, y: ay, mode: 'in', count: 18 });
  ctx.se?.('PRSFX- Freeze Shock2');
  ctx.shake(4, 6, 30);
  await ctx.flash([200, 255, 220], 14, 140);
  await ctx.say(T13_TEXT.pulled);
  burst?.remove?.(20);
  ctx.setFlag(F.ancientBlock);
  await ctx.fade('out', 24);
  const P = LAGO.respawn;
  await ctx.warp('boreal_lago', P.x, P.y, P.dir, { fade: false });
  await ctx.fade('in', 24);
  await ctx.say(T13_TEXT.carve);
  for (let k = 0; k < 3; k++) { ctx.se?.('Mining hammer'); ctx.shake(1, 8, 6); await pause(ctx, 16); }
  await ctx.say(T13_TEXT.found, N);
  await ctx.story?.giveTablet?.('ICICLEPLATE');
  ctx.setFlag(F.icePlate);
  await zygardeSays(ctx, T13_TEXT.foundZygarde);
  await ctx.say(T13_TEXT.tower, N);
  await ctx.fade('out', 30);
  ctx.setFlag(F.tower);
  const h = ctx.state.hour ?? 12;
  if (h >= 6 && h < 21) ctx.state.advanceMinutes?.((21 - h) * 60);
  const Fp = BOREAL.flyPoint;
  await ctx.warp('villa_boreal', Fp.x, Fp.y, Fp.dir, { fade: false });
  await ctx.fade('in', 30);
}

export function lakeSideEvents() {
  return [
    {
      id: 'nieves_lago', x: LAGO.nieves.x, y: LAGO.nieves.y, name: SPEAKER.nieves,
      pages: [{ when: atLake, sprite: SPRITE.nieves, dir: LAGO.nieves.dir, move: 'look', trigger: 'action', script: nievesLake }],
    },
    { id: 'llegada_lago_nieves', x: LAGO.entry.x + 1, y: LAGO.entry.y, trigger: 'touch', when: (s) => atLake(s) && !s.flag(F.lakeSeen), script: lakeIntro },
    { id: 'llegada_lago_nieves_2', x: LAGO.entry.x + 1, y: LAGO.entry.y + 1, trigger: 'touch', when: (s) => atLake(s) && !s.flag(F.lakeSeen), script: lakeIntro },
    { id: 'llegada_lago_nieves_3', x: LAGO.entry.x + 1, y: LAGO.entry.y + 2, trigger: 'touch', when: (s) => atLake(s) && !s.flag(F.lakeSeen), script: lakeIntro },
    { id: 'cartel_lago', type: 'sign', x: LAGO.sign.x, y: LAGO.sign.y, text: T13_TEXT.sign },
    { id: 'caseta_lago', x: LAGO.hut.x + 1, y: LAGO.hut.y + 4, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(T13_TEXT.hut); } },
    { id: 'trineo_lago', ...LAGO.sled, name: 'Trineo', sprite: OBJ.sled, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('El trineo de Rosendo, con las cuerdas enrolladas y los garfios listos.'); } },
  ];
}

// ───────────────────────────── Ceremonia de la Torre (Villa Boreal) ─────────────────────────────

async function ceremony(ctx) {
  if (ctx.flag(F.froslassite)) return;
  await ctx.say(T13_TEXT.night);
  ctx.face('player', 'up');
  await ctx.camera?.pan?.(BOREAL.tower.x, BOREAL.tower.y, 30);
  ctx.face('rosendo_plaza', 'up');
  await pause(ctx, 20);
  await ctx.say(T13_TEXT.ceremony.rosendoTouch, R);
  ctx.face('nieves_plaza', 'left');
  await ctx.say(T13_TEXT.ceremony.nieves, N);
  await ctx.say(T13_TEXT.ceremony.rosendo, R);
  await ctx.camera?.reset?.(20);
  ctx.face('rosendo_plaza', 'down');
  await ctx.say(T13_TEXT.ceremony.gift(ctx.state), R);
  await ctx.giveItem('FROSLASSITE', 1);
  ctx.setFlag(F.froslassite);
  await ctx.say(T13_TEXT.ceremony.thanks, N);
  await ctx.fade('out', 20);
  await pause(ctx, 10);
  await ctx.fade('in', 20);
}

/** Sitios de Rosendo y Nieves junto a la Torre en la plaza. */
export const TOWER_SPOTS = Object.freeze({
  rosendo: { x: BOREAL.tower.x - 1, y: BOREAL.tower.y + 1, dir: 8 },
  nieves: { x: BOREAL.tower.x + 1, y: BOREAL.tower.y + 1, dir: 4 },
});

export function ceremonyEvents() {
  const S = TOWER_SPOTS;
  return [
    { id: 'rosendo_plaza', x: S.rosendo.x, y: S.rosendo.y, name: SPEAKER.rosendo, pages: [{ when: atCeremony, sprite: SPRITE.rosendo, dir: S.rosendo.dir, trigger: 'action', script: ceremony }] },
    { id: 'nieves_plaza', x: S.nieves.x, y: S.nieves.y, name: SPEAKER.nieves, pages: [{ when: atCeremony, sprite: SPRITE.nieves, dir: S.nieves.dir, trigger: 'action', script: ceremony }] },
    { id: 'ceremonia_torre', x: 0, y: BOREAL.height - 1, through: true, pages: [{ when: atCeremony, trigger: 'auto', script: ceremony }] },
  ];
}

export { when };
