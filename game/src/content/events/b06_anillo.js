// Eventos del Anillo de los Vientos (docs/CAMPANA.md B06): monolitos del ritmo, Abril Céspedes (tedio) y su
// reto «antes de las galerías», la boca de las Galerías del Soplo (cerrada por un vendaval hasta romper el
// Colector), el campamento (descanso), las ráfagas de la Sala de las Campanas, C034 y la bajada a las galerías.
// Campanas y núcleo: content/events/b06_nucleo.js.
import { CAMPANAS, REMOLINO, marksInMap } from './b06_wind_rooms.js';
import { gustEvents } from './b06_wind.js';
import { b06CellEvents } from './b06_cells.js';
import { bellEvents, pedestalEvent, abrilSalaEvent } from './b06_nucleo.js';
import { F, SPEAKER, SPRITE, OBJ, lines, zygardeSays, scriptedBattle } from './b06_common.js';
import { ANILLO, GALERIAS } from '../maps/b06/layout.js';

const A = ANILLO;
const S = A.sala;
const galeKeys = new Set(CAMPANAS.gale.map(([x, y]) => `${x},${y}`));
const isGale = (g) => galeKeys.has(`${g.x},${g.y}`);

export const ANILLO_TEXT = Object.freeze({
  monoliths: Object.freeze({
    N: 'Un monolito del anillo. Arriba tiene tallado un solo hexágono. Debajo, un surco largo, muy largo, como un golpe que no se suelta. La cara de la piedra mira hacia la campana del norte.',
    E: 'Un monolito del anillo. Tiene tallados dos hexágonos. Debajo, un surco corto. La cara de la piedra mira hacia la campana del este.',
    W: 'Un monolito del anillo. Tiene tallados tres hexágonos. Debajo, un surco corto. La cara de la piedra mira hacia la campana del oeste.',
  }),
  plaque: 'Una estela cubierta de glifos. La Pokédex solo reconoce una palabra: «viento».',
  sign: 'GALERÍAS DEL SOPLO\nPeligro: corrientes de aire. — La guarda del Anillo',
  fire: 'Una hoguera pequeña con una olla encima. Huele a guiso.',
  fireCold: 'Las brasas están frías. Alguien ha recogido la olla.',
  tentNote: 'Hay una nota sujeta con una piedra: «Me he ido a Brontia. Si me aburro, vuelvo. —A.»',
  mouthGale: 'De la boca de las galerías sale un viento que te empuja hacia atrás. No hay manera de bajar.',
  losa: 'Una losa con un hueco que da a las galerías. Se oye el viento de abajo.',
  losaAsk: '¿Bajar a las galerías?',
});

/** Llegada a la zona del Remolino al bajar por la losa (rellano bajo la boca del techo). */
function remolinoLanding() {
  const [[x, y]] = marksInMap(REMOLINO, 'X', GALERIAS.remolino.ox, GALERIAS.remolino.oy);
  return { x, y: y + 1 };
}

// ------------------------------------------------------------ Abril

/** Flag de B05: el jugador ya habló con Abril en la plaza de Brontia (content/events/b05_common.js). */
const MET_IN_BRONTIA = 'b05_t03_abril';

async function abrilFirstTalk(ctx) {
  ctx.setFlag(F.abrilMet);
  const first = ctx.flag(MET_IN_BRONTIA)
    ? 'Anda, otra vez tú. ¿También subes a ver esto? Aquí no hay nada que ver. Un anillo de piedras y viento.'
    : '¿Turista? Aquí no hay nada que ver. Un anillo de piedras y viento. Mucho viento.';
  await lines(ctx, SPEAKER.abril, [
    first,
    'Soy Abril. La guarda del Anillo, dicen. Cinco años vigilando una piedra que no hace nada.',
  ]);
}

/** Segunda pista de T03 si el jugador la lleva abierta (TABLILLAS: «Abril, aburrida»). */
async function abrilT03(ctx) {
  const entry = (ctx.state.clues || []).find((c) => c.id === 'T03');
  if (!entry || entry.solved || entry.status === 'solved' || (entry.step || 1) >= 2 || ctx.flag(F.t03Abril)) return;
  ctx.setFlag(F.t03Abril);
  await lines(ctx, SPEAKER.abril, [
    '¿Lo del rayo de Brontia? Allí ya ni se asustan. Cae siempre en la campana grande.',
  ]);
  await ctx.story.advanceClue('T03', 2);
}

async function abrilBeforeColector(ctx) {
  if (!ctx.flag(F.abrilMet)) await abrilFirstTalk(ctx);
  await lines(ctx, SPEAKER.abril, [
    '¿Las galerías? Ni lo sueñes. Desde que los del Parque montaron sus cacharros, de ahí abajo sale un viento que tumba.',
    'Ni yo bajo. Y eso que me aburro muchísimo.',
  ]);
  await abrilT03(ctx);
}

async function abrilChallenge(ctx) {
  if (!ctx.flag(F.abrilMet)) await abrilFirstTalk(ctx);
  const ev = ctx.world.events.find((e) => e.id === 'abril');
  if (ev) ev.turnToward(ctx.player);
  if (!ctx.flag(F.abrilChallenged)) {
    await lines(ctx, SPEAKER.abril, [
      '¿Lo notas? Ha parado. El viento de las galerías sopla como antes.',
      '¿Has sido tú, lo del Parque? Pues mira qué bien. Ya que estás, a ver si al menos me entretienes.',
      'Termina rápido, que se me enfría la comida.',
    ]);
    ctx.setFlag(F.abrilChallenged);
  } else {
    // Reintento tras una derrota (§2.6): sin repetir la escena entera.
    await lines(ctx, SPEAKER.abril, ['¿Otra vez tú? Bueno, la comida ya se ha enfriado. Venga.']);
  }
  await abrilT03(ctx);
  const outcome = await scriptedBattle(ctx, { trainer: 'b06_abril' }, { x: A.abril.x, y: A.abril.y + 1, dir: 8 });
  if (outcome !== 'win') return;
  ctx.setFlag(F.abril);
  await lines(ctx, SPEAKER.abril, [
    'Vaya. Pues sí que sabes.',
    'Ahí abajo hay corrientes que te llevan de un lado a otro. Si te arrastran, déjate llevar. Si no te dejan subir, móntate en ese bicho tuyo.',
    'Y hay veletas. Giran. No me preguntes para qué, nunca me ha dado por probar.',
    'Ah, y en la Ruta 5, detrás de unos troncos rajados, a veces brilla algo verde. Yo no pienso ir a mirar.',
  ]);
}

async function abrilTalk(ctx) {
  if (!ctx.flag(F.colector)) { await abrilBeforeColector(ctx); return; }
  if (!ctx.flag(F.abril)) { await abrilChallenge(ctx); return; }
  await lines(ctx, SPEAKER.abril, ['¿Sigues por aquí? Las galerías no se van a bajar solas.']);
  await abrilT03(ctx);
}

function abrilEvents() {
  return [
    {
      id: 'abril', x: A.abril.x, y: A.abril.y, name: SPEAKER.abril,
      pages: [
        { when: (s) => Boolean(s) && !s.flag(F.bells), sprite: SPRITE.abril, dir: A.abril.dir, move: 'still', trigger: 'action', script: abrilTalk },
      ],
    },
  ];
}

// ------------------------------------------------------------ boca de las galerías y campamento

/** Vuelve al jugador fuera de la boca (hacia el anillo). */
async function stepBack(ctx) {
  const p = ctx.player;
  await ctx.move('player', ['direction_fix_on'], { through: false });
  await ctx.movePlayerTo(p.x, A.mouthArrival.y, { through: true, speed: 5 });
  await ctx.move('player', ['direction_fix_off'], { through: false });
}

async function mouthScript(ctx) {
  if (!ctx.flag(F.colector) && !ctx.flag(F.restored)) {
    ctx.se('PRSFX- Gust', { volume: 90 });
    await ctx.say(ANILLO_TEXT.mouthGale);
    await stepBack(ctx);
    return;
  }
  if (!ctx.flag(F.abril)) {
    await stepBack(ctx);
    await abrilChallenge(ctx);
    return;
  }
  ctx.se('Door enter');
  await ctx.warp('galerias_soplo', GALERIAS.entry.x, GALERIAS.entry.y, GALERIAS.entry.dir);
}

function campEvents() {
  const tentDoor = { x: A.tent.x + 1, y: A.tent.y + 3 };
  return [
    ...A.mouthTiles.map(([x, y], i) => ({ id: `boca_galerias_${i}`, x, y, trigger: 'touch', through: true, script: mouthScript })),
    {
      id: 'tienda_abril', x: tentDoor.x, y: tentDoor.y, trigger: 'action', solid: true, noOver: true,
      script: async (ctx) => {
        if (ctx.flag(F.abrilAfter)) await ctx.say(ANILLO_TEXT.tentNote);
        else await ctx.say('La tienda de Abril. Dentro hay un saco de dormir y una pila de revistas viejas.');
        const r = await ctx.rest({ kind: 'camp', message: '¿Quieres descansar un rato en la tienda?' });
        if (r?.rested) ctx.setHealPoint(tentDoor.x, tentDoor.y + 1, 8);
      },
    },
    {
      id: 'hoguera', x: A.fire.x, y: A.fire.y, name: 'Hoguera',
      pages: [
        { sprite: OBJ.fire, dir: 2, directionFix: true, stepAnime: true, speed: 4, solid: true, trigger: 'action', light: { radius: 80, intensity: 0.6 }, script: async (ctx) => { await ctx.say(ANILLO_TEXT.fire); } },
        { when: (s) => Boolean(s) && s.flag(F.abrilAfter), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(ANILLO_TEXT.fireCold); } },
      ],
    },
    { id: 'cartel_galerias', type: 'sign', x: A.mouth.x - 1, y: A.mouth.y, text: ANILLO_TEXT.sign },
  ];
}

// ------------------------------------------------------------ monolitos, estela y objetos

function stoneEvents() {
  const out = Object.entries(A.monoliths).flatMap(([k, m]) => [0, 1].map((dx) => ({
    id: `monolito_${k.toLowerCase()}_${dx}`, x: m.x + dx, y: m.y + 2, trigger: 'action', noOver: true,
    script: async (ctx) => { await ctx.say(ANILLO_TEXT.monoliths[k]); },
  })));
  out.push(...[17, 18].map((x) => ({ id: `estela_${x}`, x, y: 32, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(ANILLO_TEXT.plaque); } })));
  out.push(
    { id: 'objeto_anillo_1', type: 'item', x: 5, y: 34, item: 'HYPERPOTION', hidden: true },
    { id: 'objeto_anillo_2', type: 'item', x: 39, y: 3, item: 'ETHER' },
    { id: 'objeto_anillo_3', type: 'item', x: 4, y: 14, item: 'REVIVE', hidden: true },
  );
  return out;
}

// ------------------------------------------------------------ Sala de las Campanas

function salaEvents() {
  const windy = (s) => !s.flag(F.restored);
  const [[lx, ly]] = marksInMap(CAMPANAS, 'E', S.ox, S.oy);
  const down = remolinoLanding();
  return [
    ...gustEvents(CAMPANAS, S.ox, S.oy, { prefix: 'sala', active: windy, only: (g) => !isGale(g) }),
    ...gustEvents(CAMPANAS, S.ox, S.oy, { prefix: 'vendaval', roomKey: 'campanas_sur', active: (s) => windy(s) && !s.flag(F.bells), only: isGale }),
    ...bellEvents(),
    pedestalEvent(),
    abrilSalaEvent(),
    ...b06CellEvents('anillo_vientos'),
    {
      id: 'losa_bajada', x: lx, y: ly, trigger: 'action', noOver: true, through: true,
      script: async (ctx) => {
        await ctx.say(ANILLO_TEXT.losa);
        if (!(await ctx.confirm(ANILLO_TEXT.losaAsk))) return;
        ctx.se('Door enter');
        await ctx.warp('galerias_soplo', down.x, down.y, 2);
      },
    },
  ];
}

/** Primera llegada a la Sala (la llama la subida desde el Remolino tras el warp). */
export async function salaIntro(ctx) {
  if (ctx.flag(F.salaSeen)) return;
  ctx.setFlag(F.salaSeen);
  await zygardeSays(ctx, 'El centro está dormido. Las campanas lo llaman. Pero no de cualquier manera.');
}

/** Todos los eventos del Anillo de los Vientos. */
export function anilloEvents() {
  return [...abrilEvents(), ...campEvents(), ...stoneEvents(), ...salaEvents()];
}
