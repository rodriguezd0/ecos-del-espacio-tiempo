// Eventos de la Ruta 12, Senda del Lazo, tramo bajo (docs/CAMPANA.md B15: «En la Senda del Lazo se sube y se vuelve al
// principio; la columna de luz de la Cumbre Azur atrae a curiosos»; Tyranitarita en el mirador, POKEDEX §7.7). Pauta,
// escaleras y rastros en content/maps/b15/layout_senda.js: coronar una escalera falsa (subiendo) devuelve al principio;
// las huellas de tres garras de los Larvitar llevan a la buena en cada rellano. Encima del mirador, el tramo alto es un
// bucle que todavía no se puede romper. También los personajes del refugio del Paso (content/maps/b15/paso_refugio.js).
import { F, V, SPEAKER, SPRITE, OBJ, markNorthUnbound, zygardeSays, lines, byGender, pause, when, fx } from './b15_common.js';
import { SENDA, correctStair, wrongTops, trail, topRow } from '../maps/b15/layout_senda.js';
import { REFUGIO } from '../maps/b15/layout_paso.js';

const S = SENDA;
export const MAP_ID = 'ruta_12_senda_lazo';

export const SENDA_TEXT = Object.freeze({
  arrival: 'La Senda del Lazo sube por la ladera de la Cumbre Azur en rellanos de nieve. Allá arriba, la columna de luz.',
  guideStone: 'SENDA DEL LAZO · RUTA 12\nLos pastores subían detrás de los Larvitar: ellos saben por dónde la montaña es de verdad.\nQuien sube sin guía, vuelve a empezar.',
  loop: 'Al coronar la escalera, el aire se dobla como un pliegue de papel…',
  loopBack: '…y estás otra vez junto a la piedra de los pastores.',
  loopZygarde: 'La senda se dobla sobre sí misma. Aquí el espacio está anudado.',
  loopHint: 'Los pequeños que viven aquí no se pierden. Míralos.',
  high: 'Más arriba, el camino se pierde entre las nubes…',
  highBack: '…y vuelve a dejarte en el borde del mirador, como si no hubieras dado un paso.',
  highZygarde: 'Aquí el nudo es más fuerte. Todavía no puedo deshacerlo.',
  top: 'Desde el mirador, la columna de luz parece al alcance de la mano. Abajo, un mar de nubes.',
  topSign: 'MIRADOR DEL LAZO\nMás arriba, la senda vuelve sobre sí misma. No insistáis.',
  printsLarvitar: 'Huellas pequeñas de tres garras en la nieve. Suben decididas.',
  printsBoots: 'Huellas de botas. Van y vienen, como si alguien hubiera dudado mucho.',
  larvitar: 'El Larvitar mira escaleras arriba y se sacude la nieve, esperando.',
  pupitar: 'Un Pupitar dormita junto a la madriguera. Ni se inmuta.',
  curiosa: [
    'La vi desde Brontia, esa columna de luz. No pude quedarme en casa.',
    'Llevo toda la mañana subiendo. Cada vez que llego arriba, estoy otra vez aquí. ¿Lo entiendes tú?',
  ],
});

// ───────────────────────────── Lazo ─────────────────────────────

async function loopBack(ctx) {
  if (ctx.player.direction !== 8) return;
  ctx.se?.('Teleport');
  await ctx.flash?.([210, 225, 255], 12, 150);
  await ctx.say(SENDA_TEXT.loop);
  await ctx.fade('out', 24);
  const n = (Number(ctx.var(V.loops, 0)) || 0) + 1;
  ctx.setVar(V.loops, n);
  ctx.setVar(V.sendaStep, 0);
  const L = S.loopStart;
  await ctx.warp(MAP_ID, L.x, L.y, L.dir, { fade: false });
  await ctx.fade('in', 24);
  await ctx.say(SENDA_TEXT.loopBack);
  if (!ctx.flag(F.sendaLoopSeen)) {
    ctx.setFlag(F.sendaLoopSeen);
    await zygardeSays(ctx, SENDA_TEXT.loopZygarde);
  } else if (n % 3 === 0) {
    await zygardeSays(ctx, SENDA_TEXT.loopHint);
  }
}

/** Coronar la escalera buena de la cara k (subiendo): cuenta el rellano; la última abre el mirador. */
async function rightStep(ctx, k) {
  if (ctx.player.direction !== 8) return;
  ctx.setVar(V.sendaStep, Math.max(Number(ctx.var(V.sendaStep, 0)) || 0, k + 1));
  if (k === S.pattern.length - 1 && !ctx.flag(F.sendaTop)) {
    ctx.setFlag(F.sendaTop);
    await ctx.say(SENDA_TEXT.top);
    await zygardeSays(ctx, 'Lo has encontrado siguiendo a los pequeños.');
  }
}

async function highLoop(ctx) {
  if (ctx.player.direction !== 8) return;
  ctx.se?.('Teleport');
  await ctx.flash?.([230, 235, 255], 14, 170);
  await ctx.say(SENDA_TEXT.high);
  await ctx.fade('out', 30);
  const B = S.high.back;
  await ctx.warp(MAP_ID, B.x, B.y, B.dir, { fade: false });
  await ctx.fade('in', 30);
  await ctx.say(SENDA_TEXT.highBack);
  if (!ctx.flag(F.sendaHigh)) {
    ctx.setFlag(F.sendaHigh);
    await zygardeSays(ctx, SENDA_TEXT.highZygarde);
  }
}

function loopEvents() {
  const out = wrongTops().map((w) => ({
    id: `lazo_${w.face}_${w.side}`, x: w.x, y: w.y, trigger: 'touch', through: true, script: loopBack,
  }));
  S.pattern.forEach((_, k) => {
    const c = correctStair(k);
    out.push({ id: `rellano_${k}`, x: c.top[0], y: c.top[1], trigger: 'touch', through: true, script: (ctx) => rightStep(ctx, k) });
  });
  for (let x = S.high.x0; x <= S.high.x1; x++) {
    out.push({ id: `tramo_alto_${x}`, x, y: S.high.y, trigger: 'touch', through: true, script: highLoop });
  }
  return out;
}

// ───────────────────────────── Huellas ─────────────────────────────

/** Rastros: Larvitar (fila 2 ↑, 4 ←, 6 →) y botas de los perdidos (fila 8). → [{ x, y, row, kind }] */
export function printTrails() {
  const out = [];
  const add = (list, kind) => {
    for (const p of list) {
      if (out.some((q) => q.x === p.x && q.y === p.y)) continue;
      const row = kind === 'botas' ? 8 : ({ 8: 2, 4: 4, 6: 6 })[p.dir];
      out.push({ x: p.x, y: p.y, row, kind });
    }
  };
  const c0 = correctStair(0);
  const c1 = correctStair(1);
  const c2 = correctStair(2);
  // Cara 1: de la piedra de los pastores al pie de la escalera buena.
  add(trail([S.guideStone.x + 2, 39], c0.foot, 37), 'larvitar');
  // Cara 2: de lo alto de la escalera buena anterior a la siguiente.
  add(trail(c0.top, c1.foot, c1.foot[1] + 2), 'larvitar');
  // Cara 3: las de los Larvitar y, cruzándolas, las de botas hacia una escalera falsa.
  add(trail(c1.top, c2.foot, c2.foot[1] + 2), 'larvitar');
  const falseSide = 'E'; // escalera falsa de la cara 3 (la buena es la del centro)
  const falseX = S.stairs[2][falseSide] + 1;
  add(trail(c1.top, [falseX, c2.foot[1]], c2.foot[1] + 1), 'botas');
  return out;
}

function printEvents() {
  return printTrails().map((p, i) => ({
    id: `huella_${p.kind}_${i}`, x: p.x, y: p.y, name: p.kind === 'botas' ? 'Huellas de botas' : 'Huellas de Larvitar',
    pages: [{
      sprite: OBJ.prints, dir: p.row, pattern: i % 4, directionFix: true, walkAnime: false, through: true, shadow: false,
      trigger: 'action', script: async (ctx) => { await ctx.say(p.kind === 'botas' ? SENDA_TEXT.printsBoots : SENDA_TEXT.printsLarvitar); },
    }],
  }));
}

// ───────────────────────────── Personajes y objetos ─────────────────────────────

async function arrival(ctx) {
  ctx.setFlag(F.sendaIntro);
  markNorthUnbound(ctx);
  await ctx.say(SENDA_TEXT.arrival);
}

function peopleEvents() {
  const c3 = correctStair(3);
  const M = S.mirador;
  const out = [];
  // Llegada: automática al entrar la primera vez (no hay franja que se pueda rodear).
  out.push({ id: 'llegada_senda', x: S.east.x - 2, y: S.east.y0, through: true, trigger: 'auto', when: when({ none: [F.sendaIntro] }), script: arrival });
  out.push(
    { id: 'piedra_pastores', type: 'sign', x: S.guideStone.x, y: S.guideStone.y, text: SENDA_TEXT.guideStone },
    {
      id: 'excursionista_telmo', type: 'trainer', trainer: 'b15_excursionista_telmo', name: 'Excursionista Telmo', sprite: 'anil:excursionista',
      ...S.telmo, sight: 3,
      intro: 'Tres días subiendo esta senda. Tres días apareciendo aquí abajo. Necesito desahogarme.',
      after: 'Dicen que hay que seguir a alguien. Yo he seguido a todo el que ha subido. Por eso estoy aquí.',
    },
    {
      id: 'curiosa_senda', x: S.curiosa.x, y: S.curiosa.y, name: SPEAKER.curiosa, sprite: SPRITE.vecina, dir: S.curiosa.dir, move: 'look',
      trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.curiosa, SENDA_TEXT.curiosa),
    },
    {
      id: 'larvitar_guia', x: c3.foot[0] + 1, y: c3.foot[1], name: 'Larvitar',
      pages: [{ sprite: SPRITE.larvitar, dir: 8, stepAnime: true, speed: 2, trigger: 'action', script: async (ctx) => { ctx.cry('LARVITAR'); await ctx.say(SENDA_TEXT.larvitar); } }],
    },
    {
      id: 'pupitar_mirador', x: M.pupitar.x, y: M.pupitar.y, name: 'Pupitar',
      pages: [{ sprite: SPRITE.pupitar, dir: 4, trigger: 'action', script: async (ctx) => { ctx.cry('PUPITAR'); await ctx.say(SENDA_TEXT.pupitar); } }],
    },
    {
      id: 'aspirante_ximena', type: 'trainer', trainer: 'b15_aspirante_ximena', name: 'Aspirante Ximena', sprite: 'anil:aspirante_f',
      ...M.ximena, sight: 3,
      intro: '¿Tú también has seguido a los Larvitar? Entonces sabes mirar. Veamos si sabes combatir.',
      after: 'Más arriba no se puede subir: el camino te devuelve aquí. Por eso me quedo mirando la luz.',
    },
    { id: 'cartel_mirador_lazo', type: 'sign', x: M.sign.x, y: M.sign.y, text: SENDA_TEXT.topSign },
    { id: 'objeto_senda_tyranitarita', type: 'item', x: M.stone.x, y: M.stone.y, item: 'TYRANITARITE' },
    { id: 'objeto_senda_hiperpocion', type: 'item', ...S.items.hyper, item: 'HYPERPOTION' },
    { id: 'objeto_senda_revivir', type: 'item', ...S.items.revive, item: 'REVIVE' },
    { id: 'objeto_senda_oculto', type: 'item', ...S.items.hidden, item: 'RARECANDY', hidden: true },
    {
      id: 'columna_luz_senda', x: 20, y: 0, through: true,
      glow: { name: 'softLight', radius: 190, color: [205, 222, 255], intensity: 0.6, pulse: 0.3 },
    },
  );
  return out;
}

export function sendaEvents() {
  return [...loopEvents(), ...printEvents(), ...peopleEvents()];
}

/** Al entrar: el contador de rellanos de esta subida vuelve a 0 (solo informativo, para el E2E). */
export async function sendaOnEnter(ctx) {
  if (ctx.player && ctx.player.y > topRow(0)) ctx.setVar(V.sendaStep, 0);
}

// ───────────────────────────── Refugio del Paso ─────────────────────────────

export const REFUGIO_TEXT = Object.freeze({
  guarda: [
    (s) => `${byGender(s, 'Bienvenido', 'Bienvenida')} al refugio. Aquí arriba nadie pregunta de dónde vienes, solo si traes frío.`,
    '¿Vas a la Senda del Lazo? Los curiosos suben por la luz de la cumbre y al rato aparecen otra vez abajo, con cara de no entender nada.',
    'Mi abuelo subía con las cabras. Decía que la senda se enreda, pero no con quien sigue a los Larvitar: ellos saben por dónde la montaña es de verdad.',
    'Busca sus huellas. Tres garras. No las confundas con las botas de los perdidos.',
  ],
  guardaUnbound: 'Y cuida de los tuyos. Estos días los Pokémon del norte miran a sus entrenadores como si no los conocieran.',
  guardaAgain: 'Tres garras, no botas. Y si la nieve las tapa, fíjate en quién sube sin dudar.',
  hiker1: 'Tres días subiendo la Senda. Siempre vuelvo a la piedra de abajo. Ni siquiera noto cuándo.',
  hiker2: 'La columna de luz se ve desde Brontia. Mi Snorunt ya no quiere salir de la Poké Ball, pero yo tenía que verla.',
});

export function refugioEvents() {
  const R = REFUGIO;
  return [
    {
      id: 'guarda_refugio', x: R.guarda.x, y: R.guarda.y, name: SPEAKER.guarda, sprite: SPRITE.guarda, dir: R.guarda.dir, move: 'look',
      trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.refugioHint)) { await ctx.say(REFUGIO_TEXT.guardaAgain, { speaker: SPEAKER.guarda }); return; }
        await lines(ctx, SPEAKER.guarda, REFUGIO_TEXT.guarda);
        if (ctx.flag(F.unbound)) await ctx.say(REFUGIO_TEXT.guardaUnbound, { speaker: SPEAKER.guarda });
        ctx.setFlag(F.refugioHint);
      },
    },
    { id: 'excursionista_refugio', x: R.hikers[0].x, y: R.hikers[0].y, name: 'Excursionista', sprite: 'campista', dir: R.hikers[0].dir, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(REFUGIO_TEXT.hiker1, { speaker: 'Excursionista' }); } },
    { id: 'curioso_refugio', x: R.hikers[1].x, y: R.hikers[1].y, name: SPEAKER.curioso, sprite: 'chaval2', dir: R.hikers[1].dir, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(REFUGIO_TEXT.hiker2, { speaker: SPEAKER.curioso }); } },
  ];
}

export { pause, fx };
