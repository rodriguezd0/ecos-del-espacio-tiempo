// Arco T08 «La laguna que fue clara» (docs/TABLILLAS.md T08; CAMPANA B09 «Alerce en T08»; §5.5 escalón 4 de la
// escalera de Alerce, subtexto rebajado). Ruta 8, Marisma Turbia:
//   1. Doña Remedios, curandera de los Palafitos, da la segunda pista (los Pokémon enferman cerca de las bombas).
//   2. Alerce acude en persona e insiste en analizar él mismo el agua; carga un lector en la Pokédex y ha clavado seis
//      estacas de muestreo.
//   3. Hay que apagar las tres bombas de lodo de Genesis (combates de guion contra sus técnicos): con ellas en marcha
//      las lecturas bailan.
//   4. Triangular con la Pokédex: la concentración (de más o menos) en las seis estacas señala el origen.
//   5. La Tablilla aparece bajo el lodo más denso (Zygarde lo remueve con Terreno complicado) → Tabla Tóxica.
//   6. La marisma empieza a sanar. Remedios, mirando el instrumental: «Hace dieciséis años vinieron unos señores a medir
//      la laguna, con aparatos como ese.» Alerce: «Son aparatos corrientes.»
// Reintentos (§2.6): los técnicos se reintentan sin pérdida; las mediciones se repiten; las pozas equivocadas no
// penalizan. Coordenadas: content/maps/b09b/ruta_8_layout.js.
import { F, V, SPEAKER, SPRITE, OBJ, MUSIC, lines, bossBattle, trainerRequest, routeTo } from './b09b_common.js';
import { STAKES, POOLS, PUMPS, SPOTS, FOAM, HOUSES, readingLevel, READING_WORDS } from '../maps/b09b/ruta_8_layout.js';

const A = { speaker: SPEAKER.alerce };
const R = { speaker: SPEAKER.remedios };
const HEAL_ME = 'heal';
/** Franja de la escena de la tarde (minutos del día): se juega a las 18:00 salvo que ya sea entre las 17 y las 20. */
const DAY_MINUTES = 24 * 60;
const EVENING_AT = 18 * 60;
const EVENING_FROM = 17 * 60;
const EVENING_TO = 20 * 60;

export const T08_TEXT = Object.freeze({
  remediosIntro: [
    'Pasa, pasa. Soy Remedios. En los Palafitos me llaman cuando algo no se cura solo.',
    'Déjame ver a tus Pokémon.',
  ],
  healed: 'Ya está. Descansados y sin una pizca de barro.',
  remediosClue: [
    'Hace semanas que los Pokémon del estero enferman. Los Wooper no comen y los Croagunk tosen de noche.',
    'Y siempre los que viven cerca de las bombas del Consorcio. Esas máquinas que golpean el lodo día y noche.',
    'Antes esto era una laguna clara, ¿sabes? Yo me bañaba en ella de niña.',
    'Los jóvenes quieren irse. No los culpo. Pero si se van ellos, se acaban los Palafitos.',
  ],
  remediosAgain: '¿Te curo a esos Pokémon?',
  remediosHint: 'El profesor sigue junto al agua, en el islote grande. Dice que el agua la analiza él y nadie más.',
  remediosAfter: 'El agua tardará, pero ya huele distinto. Vuelve cuando quieras.',
  alerceArrive: [
    '\\PN.',
    'He oído lo de la marisma. Quería ver el agua con mis propios ojos.',
    'Voy a tomar muestras.',
  ],
  alerceHelp: ['Te ayudo con las muestras', '¿Y las bombas?'],
  alerceInsist: ['No. Las muestras las tomo yo.', 'Primero, las muestras. Y las tomo yo.'],
  alerceTask: [
    'Tú puedes hacer otra cosa. Esta mañana he clavado seis estacas alrededor de la marisma.',
    'Te he cargado un lector en la Pokédex. Mide la concentración en cada estaca: donde más suba la aguja, más cerca estará el origen.',
  ],
  alercePumpsOn: 'Pero mientras esas bombas remuevan el lodo, las lecturas bailarán. Habrá que pararlas.',
  alercePumpsOff: 'Las bombas ya están paradas. Mejor: sin ellas el lodo se asienta y las lecturas valdrán algo.',
  alerceWhere: 'Estaré en el islote grande, junto al agua.',
  stakeBefore: 'Una estaca de madera con una cinta blanca, recién clavada en el barro.',
  stakeMeasure: 'Acercas la Pokédex a la estaca. El lector zumba un momento…',
  stakeNoisy: 'La aguja salta de un lado a otro. Con las bombas en marcha, el lodo no para de moverse.',
  stakeLevel: Object.freeze({
    1: 'La aguja apenas se mueve. Concentración muy baja.',
    2: 'La aguja sube un poco. Concentración baja.',
    3: 'La aguja se queda a media escala. Concentración media.',
    4: 'La aguja sube mucho. Concentración alta.',
    5: 'La aguja se clava arriba del todo. Concentración muy alta.',
  }),
  allReadings: 'Ya tienes las seis lecturas. Donde más sube la aguja, más cerca está lo que envenena el agua.',
  pumpRunning: 'Una bomba del Consorcio golpea el lodo sin parar. Por un tubo sube un agua turbia y violácea.',
  pumpStopped: 'La bomba está parada. El lodo de alrededor empieza a asentarse.',
  pumpsAllOff: 'La Pokédex vibra: sin las bombas, el lodo se asienta. Las lecturas ya serán fiables.',
  pumpsAllOffEarly: 'El golpeteo de las bombas ha cesado. La marisma se queda en silencio.',
  poolBefore: 'Un lodo espeso y violáceo que burbujea. Huele a hierro.',
  poolNeedReadings: 'Sin las seis lecturas no sabrás si es aquí.',
  poolAsk: '¿Quieres que Zygarde remueva el lodo?',
  poolWrong: 'Zygarde hunde las patas en el lodo y lo aparta… Solo barro, espeso y frío.',
  poolWrongHint: 'Por aquí la aguja no subía tanto.',
  poolDugAlready: 'El lodo removido vuelve a cerrarse despacio. Aquí solo había barro.',
  poolCalm: 'El lodo se ha asentado. Ya no burbujea.',
  poolHole: 'El hueco donde estaba la losa se ha llenado de un agua todavía turbia, pero quieta.',
  dig: 'Zygarde hunde las patas en el lodo más espeso y lo aparta a un lado.',
  tabletSeen: 'Bajo el lodo asoma una losa violeta. El barro de alrededor burbujea como si respirara.',
  evening: 'Esa tarde, en los Palafitos…',
  finaleAlerce: [
    'Las bombas, paradas. Y la losa, fuera del lodo.',
    'El agua tardará en limpiarse. Pero ya no hay nada que la ensucie.',
  ],
  finaleRemedios: 'Hace dieciséis años vinieron unos señores a medir la laguna, con aparatos como ese.',
  finaleAlerceReply: 'Son aparatos corrientes.',
  finaleAlerceBye: 'Vuelvo al laboratorio. Ve con cuidado.',
  finaleYouth: 'Remedios… Nos quedamos. Si el agua se limpia, nos quedamos.',
  finaleRemediosYouth: 'Eso quería oír.',
  finaleGift: 'Toma. Para cuando algo no se cure solo.',
  kit: 'Un maletín de campo abierto: frascos con agua de la marisma, etiquetas escritas a mano y un medidor de aguja muy usado.',
});

// ───────────────────────────── utilidades puras ─────────────────────────────

/** ¿Están paradas las tres bombas? */
export const pumpsOff = (s) => PUMPS.every((p) => s.flag(F.pump(p.n)));
/** Lecturas tomadas (nivel > 0). */
export const readingsTaken = (s) => STAKES.filter((k) => Number(s.var(V.reading(k.n), 0)) > 0).length;
export const allReadings = (s) => readingsTaken(s) === STAKES.length;

/**
 * Poza cuyo patrón de lecturas explica las observadas (la solución del triángulo; la usan los tests y el resumen de
 * Alerce no la revela). → ids de las pozas coherentes con las lecturas.
 */
export function consistentPools(levels) {
  return POOLS.filter((p) => STAKES.every((k) => readingLevel(k, p) === levels[k.n])).map((p) => p.id);
}

async function healParty(ctx, healPoint) {
  await ctx.fade?.('out', 12);
  ctx.me(HEAL_ME);
  ctx.heal();
  if (healPoint) ctx.setHealPoint(healPoint.x, healPoint.y, healPoint.dir ?? 8);
  await ctx.wait?.(30);
  await ctx.fade?.('in', 12);
  await ctx.say(T08_TEXT.healed, R);
}

// ───────────────────────────── Remedios (interior) ─────────────────────────────

/** Conversación con Doña Remedios. `healPoint` = casilla delante de ella (punto de cura del jugador). */
export async function remediosTalk(ctx, healPoint) {
  if (!ctx.flag(F.remedios)) {
    await lines(ctx, SPEAKER.remedios, T08_TEXT.remediosIntro);
    await healParty(ctx, healPoint);
    await lines(ctx, SPEAKER.remedios, T08_TEXT.remediosClue);
    // Segunda pista de T08 (si no estaba abierta: descubrimiento directo, TABLILLAS §4.2).
    await ctx.story.advanceClue('T08', 2);
    ctx.setFlag(F.remedios);
    return;
  }
  if (ctx.flag(F.healed)) {
    await ctx.say(T08_TEXT.remediosAfter, R);
    if (await ctx.confirm(T08_TEXT.remediosAgain)) await healParty(ctx, healPoint);
    return;
  }
  if (await ctx.confirm(T08_TEXT.remediosAgain)) await healParty(ctx, healPoint);
  if (ctx.flag(F.alerce)) await ctx.say(T08_TEXT.remediosHint, R);
}

// ───────────────────────────── Alerce ─────────────────────────────

async function alerceArrival(ctx) {
  if (ctx.flag(F.alerce) || !ctx.flag(F.remedios)) return;
  const p = ctx.player;
  const from = SPOTS.alerceFrom;
  const alerce = ctx.world.spawnEvent({ id: 'alerce_llega', x: from.x, y: from.y, sprite: SPRITE.alerce, dir: 4, through: true });
  ctx.requestRefresh();
  ctx.face('player', 'right');
  await ctx.move(alerce, routeTo(from, { x: p.x + 1, y: p.y }), { through: true });
  ctx.face(alerce, p);
  await lines(ctx, SPEAKER.alerce, T08_TEXT.alerceArrive);
  const i = await ctx.choice(T08_TEXT.alerceHelp, { cancel: 1 });
  await ctx.say(T08_TEXT.alerceInsist[i === 0 ? 0 : 1], A);
  await lines(ctx, SPEAKER.alerce, T08_TEXT.alerceTask);
  // Si el jugador ya ha parado las bombas antes de hablar con Remedios, Alerce no le pide que las pare.
  await ctx.say(pumpsOff(ctx.state) ? T08_TEXT.alercePumpsOff : T08_TEXT.alercePumpsOn, A);
  await ctx.say(T08_TEXT.alerceWhere, A);
  ctx.setFlag(F.alerce);
  await ctx.move(alerce, ['right', 'right', 'right', 'right', 'right'], { through: true, speed: 4 });
  ctx.erase(alerce);
  ctx.requestRefresh();
}

/** Resumen de las lecturas que da Alerce en su puesto (sin decir dónde está el origen). */
async function alerceStationTalk(ctx) {
  const s = ctx.state;
  if (!pumpsOff(s)) {
    const left = PUMPS.filter((p) => !s.flag(F.pump(p.n))).length;
    await ctx.say(left === 1 ? 'Aún queda una bomba en marcha. Mientras golpee el lodo, las lecturas no valdrán nada.' : 'Las bombas siguen golpeando. Mientras remuevan el lodo, las lecturas no valdrán nada.', A);
    return;
  }
  const read = STAKES.filter((k) => Number(s.var(V.reading(k.n), 0)) > 0);
  if (!read.length) { await ctx.say('Las bombas, paradas. Ahora mide en las seis estacas.', A); return; }
  await ctx.say(allReadings(s) ? 'Repasemos las lecturas.' : 'Lo que llevas medido:', A);
  for (const k of read) await ctx.say(`${k.name[0].toUpperCase()}${k.name.slice(1)}: ${READING_WORDS[s.var(V.reading(k.n))]}.`, A);
  await ctx.say(allReadings(s)
    ? 'Donde más sube la aguja, más cerca está. Busca allí el lodo más espeso.'
    : `Faltan ${STAKES.length - read.length}. No saques conclusiones con medio mapa.`, A);
}

function alerceEvents() {
  const st = SPOTS.alerceStation;
  return [
    {
      id: 'alerce_llegada', x: HOUSES.remedios.door.x, y: HOUSES.remedios.door.y + 1, through: true,
      pages: [{ when: (s) => Boolean(s) && s.flag(F.remedios) && !s.flag(F.alerce), trigger: 'auto', script: alerceArrival }],
    },
    {
      id: 'alerce_puesto', x: st.x, y: st.y, name: SPEAKER.alerce,
      pages: [{
        when: (s) => Boolean(s) && s.flag(F.alerce) && !s.flag(F.healed),
        sprite: SPRITE.alerce, dir: st.dir, move: 'still', trigger: 'action', script: alerceStationTalk,
      }],
    },
    {
      id: 'maletin_alerce', x: SPOTS.kit.x, y: SPOTS.kit.y,
      pages: [{
        when: (s) => Boolean(s) && s.flag(F.alerce) && !s.flag(F.healed),
        sprite: OBJ.kit, dir: 2, directionFix: true, stepAnime: true, speed: 2, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say(T08_TEXT.kit); },
      }],
    },
  ];
}

// ───────────────────────────── Bombas y técnicos ─────────────────────────────

const TECH_TEXT = Object.freeze({
  1: {
    intro: ['Muestreo de biomarcadores celulares en curso. Aléjese del tubo, por favor.', 'Si insiste, tendré que apartarle yo misma. Con todo respeto.'],
    again: '¿Otra vez usted? Muy bien. Protocolo de contención.',
    stop: 'De acuerdo. Detengo la bomba. Constará en el informe.',
    after: 'Sin bomba, el lodo se asienta y la muestra pierde valor. Enhorabuena, supongo.',
    speaker: SPEAKER.techF,
  },
  2: {
    intro: ['Esta bomba tiene permiso del ayuntamiento. Bueno, lo tendrá.', 'Le ruego que no toque nada. Ni a nadie.'],
    again: 'Repetimos la prueba. Mismas condiciones.',
    stop: 'Parada técnica. Anotado.',
    after: '¿Buscaba usted algo en concreto? Nosotros sí.',
    speaker: SPEAKER.tech,
  },
  3: {
    intro: ['El lodo guarda restos de actividad celular. Lo demás es ruido.', 'Usted, por ejemplo.'],
    again: 'Vuelve el ruido.',
    stop: 'Apago. Pero el lodo seguirá aquí.',
    after: 'Mañana vendrá otra cuadrilla. O no. Depende de lo que decidan arriba.',
    speaker: SPEAKER.tech,
  },
});

const pumpMetFlag = (n) => `b09_t08_bomba_${n}_vista`;

async function techBattle(ctx, pump) {
  const text = TECH_TEXT[pump.n];
  const ev = ctx.event;
  if (ctx.flag(F.pump(pump.n))) return;
  ctx.bgm(MUSIC.grunt);
  await ctx.emote(ev, '!');
  await ctx.approach(ev);
  ctx.turnToPlayer(ev);
  ctx.face('player', ctx.directionTo(ctx.player, ev));
  if (ctx.flag(pumpMetFlag(pump.n))) await ctx.say(text.again, { speaker: text.speaker });
  else await lines(ctx, text.speaker, text.intro);
  ctx.setFlag(pumpMetFlag(pump.n));
  const outcome = await bossBattle(ctx, trainerRequest(pump.tech.trainer), pump.tech.front);
  if (outcome !== 'win') return;
  ctx.bgm(MUSIC.marsh, { fadeOutPrevious: 20 });
  await ctx.say(text.stop, { speaker: text.speaker });
  ctx.se('PC close');
  ctx.setFlag(F.pump(pump.n));
  ctx.requestRefresh();
  if (pumpsOff(ctx.state) && !ctx.flag(F.pumps)) {
    ctx.setFlag(F.pumps);
    await ctx.wait?.(20);
    // El lector de la Pokédex solo existe desde que Alerce lo carga (las bombas se pueden parar antes).
    if (ctx.flag(F.alerce)) {
      ctx.se('Mining ping');
      await ctx.say(T08_TEXT.pumpsAllOff);
    } else {
      await ctx.say(T08_TEXT.pumpsAllOffEarly);
    }
  }
}

function pumpEvents() {
  return PUMPS.flatMap((pump) => {
    const t = pump.tech;
    const text = TECH_TEXT[pump.n];
    return [
      {
        id: `bomba_${pump.n}`, x: pump.x, y: pump.y, name: 'Bomba del Consorcio',
        pages: [
          {
            sprite: OBJ.pump, dir: 2, directionFix: true, stepAnime: true, speed: 4, solid: true, trigger: 'action',
            script: async (ctx) => { await ctx.say(T08_TEXT.pumpRunning); },
          },
          {
            when: (s) => Boolean(s) && s.flag(F.pump(pump.n)),
            sprite: OBJ.pump, dir: 4, directionFix: true, stepAnime: false, solid: true, trigger: 'action',
            script: async (ctx) => { await ctx.say(T08_TEXT.pumpStopped); },
          },
        ],
      },
      {
        id: `tecnico_bomba_${pump.n}`, x: t.x, y: t.y, name: text.speaker,
        pages: [
          {
            when: (s) => Boolean(s) && !s.flag(F.pump(pump.n)),
            sprite: pump.n === 1 ? SPRITE.techF : SPRITE.tech, dir: t.dir, move: 'still', trigger: 'eventTouch', sight: 3,
            script: (ctx) => techBattle(ctx, pump),
          },
          {
            when: (s) => Boolean(s) && s.flag(F.pump(pump.n)) && !s.flag(F.healed),
            sprite: pump.n === 1 ? SPRITE.techF : SPRITE.tech, dir: t.dir, move: 'look', trigger: 'action',
            script: async (ctx) => { await ctx.say(text.after, { speaker: text.speaker }); },
          },
          { when: (s) => Boolean(s) && s.flag(F.healed), sprite: '', through: true },
        ],
      },
    ];
  });
}

// ───────────────────────────── Estacas ─────────────────────────────

async function stakeScript(ctx, stake) {
  if (!ctx.flag(F.alerce)) { await ctx.say(T08_TEXT.stakeBefore); return; }
  ctx.se('PC access');
  await ctx.say(T08_TEXT.stakeMeasure);
  if (!pumpsOff(ctx.state)) { await ctx.say(T08_TEXT.stakeNoisy); return; }
  const level = readingLevel(stake);
  ctx.se('Mining ping');
  await ctx.say(T08_TEXT.stakeLevel[level]);
  ctx.setVar(V.reading(stake.n), level);
  ctx.requestRefresh();
  if (allReadings(ctx.state) && !ctx.flag(F.readings)) {
    ctx.setFlag(F.readings);
    await ctx.say(T08_TEXT.allReadings);
  }
}

/** Página de la estaca: fila y fotograma de la cinta según la lectura (tools/b09b_assets.mjs). */
function stakePage(level) {
  if (level === 0) return { dir: 2, pattern: 0 };
  if (level === 5) return { dir: 6, pattern: 0 };
  return { dir: 4, pattern: level - 1 };
}

function stakeEvents() {
  return STAKES.map((k) => ({
    id: `estaca_${k.n}`, x: k.x, y: k.y, name: 'Estaca de muestreo',
    pages: [0, 1, 2, 3, 4, 5].map((level) => ({
      ...(level ? { when: (s) => Boolean(s) && Number(s.var(V.reading(k.n), 0)) === level } : {}),
      sprite: OBJ.stake, ...stakePage(level), directionFix: true, stepAnime: false, solid: true, trigger: 'action',
      script: (ctx) => stakeScript(ctx, k),
    })),
  }));
}

// ───────────────────────────── Pozas de lodo y Tablilla ─────────────────────────────

async function finaleScene(ctx) {
  const f = SPOTS.finale;
  await ctx.fade('out', 30);
  await ctx.say(T08_TEXT.evening);
  // «Esa tarde»: la escena es a las 18:00 (si ya es tarde, se queda; si es de noche, a la tarde siguiente).
  const m = ((ctx.state.data.clock.minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  if (m < EVENING_FROM || m >= EVENING_TO) ctx.state.advanceMinutes((EVENING_AT - m + DAY_MINUTES) % DAY_MINUTES);
  const p = ctx.player;
  p.moveTo(f.player.x, f.player.y);
  p.direction = f.player.dir;
  for (const fl of ctx.world.followers || []) fl.moveTo?.(f.player.x - 1, f.player.y);
  const remedios = ctx.world.spawnEvent({ id: 'remedios_final', x: f.remedios.x, y: f.remedios.y, sprite: SPRITE.remedios, dir: f.remedios.dir, through: true });
  ctx.requestRefresh();
  ctx.bgm(MUSIC.marsh, { fadeOutPrevious: 20 });
  await ctx.fade('in', 30);
  const alerce = ctx.world.events.find((e) => e.id === 'alerce_puesto');
  if (alerce) ctx.face(alerce, p);
  await lines(ctx, SPEAKER.alerce, T08_TEXT.finaleAlerce);
  const kit = ctx.world.events.find((e) => e.id === 'maletin_alerce');
  if (kit) ctx.face(remedios, kit);
  await ctx.wait(20);
  await ctx.say(T08_TEXT.finaleRemedios, R);
  if (alerce) ctx.face(alerce, 'down');
  await ctx.wait(30);
  await ctx.say(T08_TEXT.finaleAlerceReply, A);
  await ctx.wait(40);
  if (kit) ctx.erase(kit);
  ctx.se('Door slide', { volume: 60 });
  if (alerce) {
    ctx.face(alerce, p);
    await ctx.say(T08_TEXT.finaleAlerceBye, A);
    await ctx.move(alerce, [...routeTo({ x: alerce.x, y: alerce.y }, { x: alerce.x, y: 36 }), ...routeTo({ x: alerce.x, y: 36 }, f.alerceExit)], { through: true, speed: 4 });
    ctx.erase(alerce);
  }
  const youth = ctx.world.events.find((e) => e.id === 'joven_1');
  if (youth) {
    await ctx.move(youth, ['right', 'right'], { through: true });
    ctx.face(youth, remedios);
  }
  await ctx.say(T08_TEXT.finaleYouth, { speaker: SPEAKER.youth });
  ctx.face(remedios, youth || p);
  await ctx.say(T08_TEXT.finaleRemediosYouth, R);
  ctx.face(remedios, p);
  if (!ctx.flag(F.remediosGift)) {
    await ctx.say(T08_TEXT.finaleGift, R);
    await ctx.giveItem('REVIVALHERB', 2);
    ctx.setFlag(F.remediosGift);
  }
  ctx.setFlag(F.healed);
  await ctx.fade('out', 20);
  ctx.erase(remedios);
  ctx.requestRefresh();
  await ctx.fade('in', 20);
}

async function digSource(ctx) {
  ctx.se('PRSFX- Mud Sport1');
  await ctx.say(T08_TEXT.dig);
  await ctx.shake(4, 6, 30);
  ctx.setSelfSwitch('A', true); // la poza muestra la losa
  ctx.requestRefresh();
  await ctx.wait(30);
  await ctx.say(T08_TEXT.tabletSeen);
  await ctx.story.giveTablet('TOXICPLATE');
  ctx.setFlag(F.tablet);
  ctx.requestRefresh();
  await finaleScene(ctx);
}

async function poolScript(ctx, pool) {
  const s = ctx.state;
  if (pool.source && s.flag(F.tablet)) { await ctx.say(T08_TEXT.poolHole); return; }
  if (s.flag(F.healed)) { await ctx.say(T08_TEXT.poolCalm); return; }
  await ctx.say(T08_TEXT.poolBefore);
  if (!s.flag(F.readings)) {
    if (s.flag(F.alerce)) await ctx.say(T08_TEXT.poolNeedReadings);
    return;
  }
  if (!ctx.zygarde('terrain')) return;
  if (!pool.source && Number(s.var(V.dug(pool.id), 0)) > 0) { await ctx.say(T08_TEXT.poolDugAlready); return; }
  if ((await ctx.choice(['Sí', 'No'], { message: T08_TEXT.poolAsk, cancel: 1 })) !== 0) return;
  if (pool.source) { await digSource(ctx); return; }
  ctx.se('PRSFX- Mud Slap');
  await ctx.shake(2, 6, 16);
  await ctx.say(T08_TEXT.poolWrong);
  await ctx.say(T08_TEXT.poolWrongHint);
  ctx.setVar(V.dug(pool.id), 1);
}

function poolEvents() {
  return POOLS.map((pool) => ({
    id: `poza_${pool.id}`, x: pool.x, y: pool.y, name: 'Lodo denso',
    pages: [
      { sprite: OBJ.mud, dir: 2, directionFix: true, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: (ctx) => poolScript(ctx, pool) },
      // La losa asoma (solo en la escena de la poza del origen).
      { when: (_s, ev) => Boolean(pool.source) && ev.selfSwitch('A'), sprite: OBJ.mud, dir: 6, directionFix: true, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: (ctx) => poolScript(ctx, pool) },
      { when: (s) => Boolean(s) && s.flag(F.healed), sprite: OBJ.mud, dir: 4, directionFix: true, stepAnime: false, solid: true, trigger: 'action', script: (ctx) => poolScript(ctx, pool) },
      { when: (s) => Boolean(s) && Boolean(pool.source) && s.flag(F.tablet), sprite: OBJ.mud, dir: 8, directionFix: true, stepAnime: false, solid: true, trigger: 'action', script: (ctx) => poolScript(ctx, pool) },
    ],
  }));
}

/** Manchas de espuma tóxica sobre la laguna (se van al sanar la marisma). */
function foamEvents() {
  return FOAM.map(([x, y], i) => ({
    id: `espuma_${i}`, x, y, through: true,
    pages: [
      { sprite: OBJ.mud, dir: 2, directionFix: true, stepAnime: true, speed: 1 + (i % 2), opacity: 150 },
      { when: (s) => Boolean(s) && s.flag(F.healed), sprite: '', through: true },
    ],
  }));
}

/** Todos los eventos del arco T08 en la Ruta 8. */
export function t08Events() {
  return [...alerceEvents(), ...pumpEvents(), ...stakeEvents(), ...poolEvents(), ...foamEvents()];
}

export { finaleScene as t08FinaleScene };
