// Calzada del Rey — los tramos alzados y la Peña del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15): reacciones al alzar
// cada tramo, Casandra que cruza la Sima con su Noivern en cuanto se alza el último y combate (helper común
// bossBattle: perder no es derrota general), la estela del taller, el Salamence Alfa de la cima (captura opcional,
// reaparece al descansar) y Alerce ante la Bajada tras la Tablilla («Si ves a Gael…»). Módulo puro salvo los guiones.
import {
  F, V, SPEAKER, SPRITE, MUSIC, when, lines, pause, bossBattle, alfaPresent,
} from './b19_common.js';
import { PENA, DUEL, ALERCE } from '../maps/b19/calzada_layout.js';
import { SALAMENCE_ALFA } from '../encounters/b19.js';

export const PENA_TEXT = Object.freeze({
  span1: [
    [SPEAKER.tadeo, '¡Casandra! ¡Mira el primer tramo!'],
    [SPEAKER.casandra, '…Esas losas no las ha alzado el Resonador.'],
  ],
  span2: [[SPEAKER.peregrino, '¿Qué… qué es esa luz verde? ¡La Calzada entera, de una pila a otra!']],
  arrival: 'Un chillido cruza la Sima. Una sombra alada pasa sobre el último tramo y se posa en la Peña.',
  casandra: [
    '¡Alto ahí!',
    'He visto la luz verde desde el Mirador y he cruzado con mi Noivern. Es la primera vez que rompo la regla.',
    'El Resonador tira de las piedras y las piedras se caen. Las tuyas… se quedan.',
    '¿Quién eres para tocar la Calzada del Rey? Su taller es lo único que nos queda de él.',
    'Si el Rey tenía que abrirle la puerta a alguien, que sea a quien me gane aquí. Demuéstramelo.',
  ],
  rematch: ['Otra vez. Las piedras no mienten: demuéstramelo tú.'],
  lose: 'Vuelve cuando quieras. La Peña no se va a mover de aquí.',
  beaten: [
    '…',
    'Tu Zygarde no obliga a las piedras. Las piedras le responden.',
    'Llevamos toda la vida mirando esta peña desde la otra orilla.',
    'El taller está ahí arriba. Entra tú delante; yo te sigo.',
  ],
  noivern: '¡Nuuooiiv! El Noivern de Casandra te mira con las orejas tiesas.',
  casandraWaits: 'El taller está ahí. Entra tú primero.',
  casandraAfter: [
    'Me quedo aquí. Alguien tendrá que cuidar lo que él cuidó.',
    '«El Eje no elige reyes.» Llevo toda la vida repitiendo lo contrario.',
  ],
  stele: [
    'Una estela con letras Unown muy gastadas, junto a la boca del taller.',
    'Solo se lee entera una palabra: «TRABAJÓ».',
  ],
  steleBajada: [
    'Una estela junto a la boca de la roca. Las letras Unown están casi borradas por el viento de la Sima.',
    'Se lee: «LA CALZADA SIGUE HACIA EL FONDO».',
  ],
  alfa: 'Un Salamence enorme vigila la cima. Despliega las alas y ruge contra el viento de la Sima.',
  alfaBack: 'El Salamence Alfa ha vuelto a su nido.',
  alfaLost: 'Has tenido que bajar de la cima. Tu equipo ha recuperado fuerzas.',
  alerce: [
    'Me avisaron desde el campamento. Una calzada que vuelve a alzarse sobre la Sima no pasa desapercibida.',
    '¿Es esa? ¿La última?',
    '…',
    '«Vivió muchos años sin corona, cuidando el puente que había roto.»',
    'Con esta, la Libreta tiene el camino entero. Por esa puerta se baja al fondo de la Sima.',
    'Antes de bajar, deja que eche un vistazo a tu equipo.',
  ],
  healed: 'Alerce revisa a tu equipo con calma. ¡Tus Pokémon han recuperado todas sus fuerzas!',
  gael: [
    'Gael se llevó el cuaderno de Vértice. Si alguien sabe leer en él el camino al Origen, es él.',
    'Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir.',
  ],
  alerceBye: 'Ve. Te espero aquí arriba.',
  alerceNpc: 'La Libreta ya tiene el camino entero. ¿Quieres que mire a tu equipo antes de bajar?',
  alerceNpcBye: 'Ve con cuidado.',
});

// ───────────────────────────── Tramos alzados ─────────────────────────────

async function sayPairs(ctx, pairs) {
  for (const [speaker, text] of pairs) await ctx.say(text, { speaker });
}

/** Escena del bloque tras alzar el tramo n (b19_spans.js#useNeedle). */
export async function onSpanRebuilt(ctx, n) {
  if (n === 1) {
    await sayPairs(ctx, PENA_TEXT.span1); // Zygarde habla muy poco (autor, 25-09-2026)
  } else if (n === 2) {
    await sayPairs(ctx, PENA_TEXT.span2);
  } else if (n === 3) {
    await casandraArrives(ctx);
  }
}

// ───────────────────────────── Casandra en la Peña ─────────────────────────────

async function casandraArrives(ctx) {
  ctx.cry?.('NOIVERN');
  await ctx.flash?.([255, 255, 255], 8, 90);
  await ctx.say(PENA_TEXT.arrival);
  ctx.setFlag(F.casandraArrived);
  ctx.requestRefresh?.();
  await pause(ctx, 20);
  await duel(ctx, true);
}

async function casandraBeaten(ctx) {
  await lines(ctx, SPEAKER.casandra, PENA_TEXT.beaten);
  await ctx.fade('out', 16);
  ctx.setFlag(F.casandraBeaten);
  ctx.requestRefresh?.();
  await pause(ctx, 10);
  await ctx.fade('in', 16);
}

async function duel(ctx, first = false) {
  if (ctx.flag(F.casandraBeaten)) return;
  await lines(ctx, SPEAKER.casandra, first ? PENA_TEXT.casandra : PENA_TEXT.rematch);
  const outcome = await bossBattle(ctx, { trainer: 'b19_casandra', bgm: MUSIC.casandra }, DUEL.retry, { loseText: PENA_TEXT.lose, speaker: SPEAKER.casandra });
  if (outcome === 'win') await casandraBeaten(ctx);
}

function casandraPenaEvents() {
  const waiting = when({ all: [F.casandraArrived], none: [F.casandraBeaten] });
  const C = DUEL.casandra;
  const N = DUEL.noivern;
  return [
    {
      id: 'casandra_pena', x: C.x, y: C.y, name: 'Casandra',
      pages: [{ when: waiting, sprite: SPRITE.casandra, dir: C.dir, move: 'still', trigger: 'action', script: (ctx) => duel(ctx) }],
    },
    {
      id: 'noivern_casandra', x: N.x, y: N.y, name: 'Noivern',
      pages: [{
        when: waiting, sprite: SPRITE.noivern, dir: N.dir, stepAnime: true, speed: 3, trigger: 'action',
        script: async (ctx) => { ctx.cry?.('NOIVERN'); await ctx.say(PENA_TEXT.noivern); },
      }],
    },
    ...DUEL.strip.map(([x, y], k) => ({
      id: `duelo_casandra_${k}`, x, y,
      pages: [{ when: waiting, through: true, lock: false, trigger: 'touch', script: (ctx) => duel(ctx) }],
    })),
    {
      id: 'casandra_taller', x: DUEL.after.x, y: DUEL.after.y, name: 'Casandra',
      pages: [{
        when: when({ all: [F.casandraBeaten], none: [F.tablet] }), sprite: SPRITE.casandra, dir: DUEL.after.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await ctx.say(PENA_TEXT.casandraWaits, { speaker: SPEAKER.casandra }); },
      }],
    },
    {
      id: 'casandra_cuidadora', x: DUEL.afterTaller.x, y: DUEL.afterTaller.y, name: 'Casandra',
      pages: [{
        when: when({ all: [F.tablet] }), sprite: SPRITE.casandra, dir: DUEL.afterTaller.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await lines(ctx, SPEAKER.casandra, PENA_TEXT.casandraAfter); },
      }],
    },
  ];
}

// ───────────────────────────── Estela, Alfa y Alerce ─────────────────────────────

async function readStele(ctx) {
  for (const t of PENA_TEXT.stele) await ctx.say(t);
}

const ALFA_RETRY = Object.freeze({ x: PENA.cimaStairs.x + 1, y: PENA.cimaStairs.y + 3, dir: 8 });

async function alfaFight(ctx) {
  ctx.cry?.('SALAMENCE');
  await ctx.say(ctx.flag(F.alfaBeaten) ? PENA_TEXT.alfaBack : PENA_TEXT.alfa);
  const request = { type: 'wild', wild: { ...SALAMENCE_ALFA }, bgm: MUSIC.boss };
  const outcome = await bossBattle(ctx, request, ALFA_RETRY, { loseText: PENA_TEXT.alfaLost });
  if (outcome === 'caught' || outcome === 'win') {
    if (outcome === 'caught') ctx.setFlag(F.alfaCaught);
    ctx.setFlag(F.alfaBeaten);
    ctx.setVar(V.alfaRest, ctx.var(V.restCount, 0));
  }
}

async function alerceScene(ctx) {
  await pause(ctx, 12);
  await lines(ctx, SPEAKER.alerce, PENA_TEXT.alerce);
  ctx.heal();
  ctx.me?.('heal');
  await ctx.say(PENA_TEXT.healed);
  await lines(ctx, SPEAKER.alerce, PENA_TEXT.gael);
  await ctx.say(PENA_TEXT.alerceBye, { speaker: SPEAKER.alerce });
  await ctx.fade('out', 14);
  ctx.setFlag(F.alerce);
  ctx.requestRefresh?.();
  await pause(ctx, 8);
  await ctx.fade('in', 14);
}

async function alerceNpc(ctx) {
  if (await ctx.confirm(PENA_TEXT.alerceNpc)) {
    ctx.heal();
    ctx.me?.('heal');
    await ctx.say(PENA_TEXT.healed);
  }
  await ctx.say(PENA_TEXT.alerceNpcBye, { speaker: SPEAKER.alerce });
}

function penaEvents() {
  const A = ALERCE;
  return [
    { id: 'estela_pena', x: PENA.stele.x, y: PENA.stele.y + 1, name: 'Estela', pages: [{ trigger: 'action', script: readStele }] },
    {
      id: 'estela_bajada', x: PENA.steleBajada.x, y: PENA.steleBajada.y + 1, name: 'Estela',
      pages: [{ trigger: 'action', script: async (ctx) => { for (const t of PENA_TEXT.steleBajada) await ctx.say(t); } }],
    },
    {
      id: 'salamence_alfa', x: PENA.alfa.x, y: PENA.alfa.y, name: 'Salamence Alfa',
      pages: [{ when: alfaPresent, sprite: SPRITE.salamence, dir: PENA.alfa.dir, move: 'still', stepAnime: true, speed: 2, trigger: 'action', script: alfaFight }],
    },
    {
      id: 'alerce_escena', x: A.stand.x, y: A.stand.y, name: 'Prof. Alerce',
      pages: [{ when: when({ all: [F.tablet], none: [F.alerce] }), sprite: SPRITE.alerce, dir: A.stand.dir, move: 'still', trigger: 'auto', script: alerceScene }],
    },
    {
      id: 'alerce_pena', x: A.after.x, y: A.after.y, name: 'Prof. Alerce',
      pages: [{ when: when({ all: [F.alerce] }), sprite: SPRITE.alerce, dir: A.after.dir, move: 'still', trigger: 'action', script: alerceNpc }],
    },
  ];
}

export function penaAllEvents() {
  return [...casandraPenaEvents(), ...penaEvents()];
}
