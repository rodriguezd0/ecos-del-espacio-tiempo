// Eventos del campamento del Monte (docs/CAMPANA.md B11 «Problema» y §5.4: «Campamento del Monte; perforación de
// la explanada (EXP-03) … Se llevan el cristal»; §6: Gael B4 «al pie del Monte: intentó escalar y el aljibe no le
// respondió»). Dos estados:
//   · ACTIVO (hasta b11_exp03): técnicos, jefa de campo, cajas selladas «EXP-03», perforadora en marcha, trípode que
//     mide el aljibe y el perímetro que cierra la senda del Monte. Primera visita: escena corta de las cajas.
//   · RECOGIDO: tras la escena del laboratorio (b11_gael_alerce), al llegar, Genesis carga la última caja y se va (un
//     evento con `patch` quita tiendas, camión y contenedores y deja los pozos de sondeo); Gael baja de la senda y
//     combate (B4, continúa aunque se pierda). Salida del bloque: b11_gael_b4; la senda sube a montana_portal (B12).
import { F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, placePlayer, pause, scriptedBattle } from './b11_common.js';
import { trainerUntil } from './b06_common.js';
import { CAMP } from '../maps/b11/layout.js';
import { CAMP_PIECES, CAMP_HOLES } from '../maps/b11/campamento_monte_build.js';
import EXT1 from '../stamps/baked/Exterior1.js';

const C = CAMP;
const BARRIER = [2203, 2204]; // barrera de obras de Exterior1 (2×1, capa 2)

export const CAMP_TEXT = Object.freeze({
  intro: [
    'Consorcio Meridiano de Estudios Geofísicos. Perforación de estudio en la explanada del Monte.',
    'Tenemos todos los permisos. Mientras trabajemos, la senda del Monte está cerrada. Por su seguridad.',
  ],
  introTech: 'EXP-03 lista para el primer envío, jefa.',
  introChief: 'Con cuidado. Es la mejor muestra de la temporada.',
  chief: 'Siga, por favor. La senda estará cerrada hasta que terminemos.',
  guard: 'Perímetro de perforación. No se puede subir al Monte mientras trabajamos. Gracias por su comprensión.',
  barrier: 'Una barrera del Consorcio: «PERÍMETRO DE PERFORACIÓN · PROHIBIDO EL PASO».',
  crates: 'Cajas selladas del Consorcio. En la etiqueta: «EXP-03 · Muestra de núcleo · Explanada del Monte · Frágil».',
  crateEmpty: 'Una caja vacía. La etiqueta dice «EXP-03». Dentro solo quedan virutas de embalaje y un polvo blanquecino.',
  rig: 'Una perforadora de muestras que hace sondeos de control al pie del Monte. La broca sale cubierta de un polvo blanquecino, el mismo de las cajas.',
  hole: 'Un pozo de sondeo tapado con una chapa. Alguien ha escrito con tiza: «Control · sin resonancia». La muestra buena salió de la explanada de arriba.',
  tripod: 'Un trípode con un aparato que apunta a lo alto del Monte, hacia el aljibe. La pantalla muestra curvas que suben y bajan.',
  trailSign: 'SENDA DEL MONTE DEL PORTAL\n↑ Explanada · Aljibe',
  departure: {
    chief: 'Última caja. EXP-03, sellada y registrada.',
    tech: 'Todo cargado, jefa.',
    chief2: 'Recogemos. La explanada ya no nos da nada más.',
    toPlayerSeen: 'Otra vez usted. Puede subir cuando quiera: ya no queda nada que medir.',
    toPlayer: 'Consorcio Meridiano. Hemos terminado aquí. Puede circular.',
    crewMissing: 'Jefa, la cuadrilla de Nilo sigue sin volver…',
    crewMissingChief: 'Constará en el informe.',
    gone: 'El campamento se ha quedado vacío. Solo quedan los pozos de sondeo y una caja olvidada.',
  },
  gael: {
    down: 'Intenté subir.',
    aljibe: 'Llegué hasta el aljibe, arriba del todo. Esperé. Lo llamé. No me respondió.',
    you: 'A ti te responderá. Ya lo sé.',
    duel: 'Combate conmigo. Antes de que subas.',
    lost: 'Ni ganándote me contesta.',
    won: 'Por lo menos eso sigue igual.',
    ask: 'Cuando vuelvas, cuéntame qué hay.',
    nevermind: '…No. Da igual.',
  },
});

const active = (s) => Boolean(s) && !s.flag(F.exp03Taken);
const gone = (s) => Boolean(s) && s.flag(F.exp03Taken);

/** Casillas de un stamp horneado de Exterior1 → [[x, y, capa, id]] (id 0 = borrar). */
function stampPatch(name, x, y, { clear = false } = {}) {
  const st = EXT1.stamps[name];
  if (!st) throw new Error(`campamento_monte: stamp desconocido ${name}`);
  const out = [];
  st.layers.forEach((arr, layer) => {
    if (!arr) return;
    for (let j = 0; j < st.h; j++) for (let i = 0; i < st.w; i++) {
      const id = arr[j * st.w + i];
      if (id) out.push([x + i, y + j, layer, clear ? 0 : id]);
    }
  });
  return out;
}

/** Parche del campamento recogido: fuera tiendas, camión, contenedores, focos, mesa, barriles y cajas. */
export const CAMP_GONE_PATCH = Object.freeze(CAMP_PIECES.flatMap(([n, x, y]) => stampPatch(n, x, y, { clear: true })));

// ------------------------------------------------------------------ escenas

async function campIntro(ctx) {
  ctx.setFlag(F.campSeen);
  ctx.bgm?.(MUSIC.genesis, { fadeOutPrevious: 20 });
  await ctx.camera?.pan?.(C.chief.x, C.chief.y, 40);
  await lines(ctx, SPEAKER.jefa, CAMP_TEXT.intro);
  await ctx.say(CAMP_TEXT.introTech, { speaker: SPEAKER.tecnico });
  await ctx.say(CAMP_TEXT.introChief, { speaker: SPEAKER.jefa });
  await ctx.camera?.reset?.(30);
}

async function departure(ctx) {
  const D = CAMP_TEXT.departure;
  ctx.bgm?.(MUSIC.genesis, { fadeOutPrevious: 20 });
  await ctx.camera?.pan?.(C.crates[0][0], C.crates[0][1], 40);
  await ctx.say(D.chief, { speaker: SPEAKER.jefa });
  await ctx.say(D.tech, { speaker: SPEAKER.tecnico });
  await ctx.say(D.chief2, { speaker: SPEAKER.jefa });
  await ctx.say(ctx.flag(F.campSeen) ? D.toPlayerSeen : D.toPlayer, { speaker: SPEAKER.jefa });
  if (!ctx.flag(F.crewSaved)) {
    await ctx.say(D.crewMissing, { speaker: SPEAKER.tecnica });
    await ctx.say(D.crewMissingChief, { speaker: SPEAKER.jefa });
  }
  await ctx.camera?.reset?.(20); // Zygarde habla muy poco (autor, 25-09-2026)
  await ctx.fade('out', 30);
  ctx.setFlag(F.campSeen);
  ctx.setFlag(F.exp03Taken);
  await pause(ctx, 40);
  await ctx.fade('in', 30);
  await ctx.say(D.gone);
}

/** Gael, B4 al pie del Monte (continúa aunque se pierda; su frase cambia). */
async function gaelB4(ctx) {
  const G = CAMP_TEXT.gael;
  ctx.bgm?.('Amenaza', { fadeOutPrevious: 20 });
  await ctx.fade('out', 20);
  await placePlayer(ctx, C.duelSpot);
  await pause(ctx, 6);
  await ctx.fade('in', 20);
  await ctx.move('gael_monte', ['down', 'down', 'down', 'down', 'down', 'down'], { through: true });
  ctx.face('gael_monte', 'down');
  await ctx.say(G.down, { speaker: SPEAKER.gael });
  await ctx.say(G.aljibe, { speaker: SPEAKER.gael });
  await ctx.say(G.you, { speaker: SPEAKER.gael });
  await ctx.say(G.duel, { speaker: SPEAKER.gael });
  const outcome = await scriptedBattle(ctx, { trainer: 'b11_gael_b4' }, null);
  await ctx.say(outcome === 'win' ? G.won : G.lost, { speaker: SPEAKER.gael });
  await ctx.say(G.ask, { speaker: SPEAKER.gael });
  await pause(ctx, 30);
  await ctx.say(G.nevermind, { speaker: SPEAKER.gael });
  await ctx.move('gael_monte', ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'], { through: true });
  ctx.erase('gael_monte');
  ctx.setFlag(F.gaelB4);
  ctx.bgm?.(ctx.map?.bgm || 'Intro', { fadeOutPrevious: 30 });
}

/** Llegada desde la Ruta 10: la escena que toque según el estado del campamento y de la historia. */
async function arrival(ctx) {
  const s = ctx.state;
  if (!s.flag(F.exp03Taken) && !s.flag(F.gaelAlerce)) {
    if (!s.flag(F.campSeen)) await campIntro(ctx);
    return;
  }
  if (!s.flag(F.exp03Taken)) await departure(ctx);
  if (!s.flag(F.gaelB4)) await gaelB4(ctx);
}

const arrivalPending = (s) => Boolean(s) && (
  (!s.flag(F.exp03Taken) && !s.flag(F.gaelAlerce) && !s.flag(F.campSeen))
  || (s.flag(F.gaelAlerce) && !s.flag(F.gaelB4))
);

// ------------------------------------------------------------------ eventos

function arrivalEvents() {
  const out = [];
  for (let y = C.arrival.y0; y <= C.arrival.y1; y++) {
    out.push({ id: `llegada_campamento_${y}`, x: C.arrival.x, y, trigger: 'touch', when: arrivalPending, script: arrival });
  }
  return out;
}

function staffEvents() {
  const say = (speaker, text) => async (ctx) => { await ctx.say(text, { speaker }); };
  const out = [
    {
      id: 'jefa_campo', x: C.chief.x, y: C.chief.y, name: SPEAKER.jefa,
      pages: [{ when: active, sprite: SPRITE.investigadora, dir: C.chief.dir, move: 'still', trigger: 'action', script: say(SPEAKER.jefa, CAMP_TEXT.chief) }],
    },
    {
      id: 'guardia_perimetro', x: C.perimeter.guard.x, y: C.perimeter.guard.y, name: SPEAKER.guardia,
      pages: [{ when: active, sprite: SPRITE.tecnico, dir: C.perimeter.guard.dir, move: 'still', trigger: 'action', script: say(SPEAKER.guardia, CAMP_TEXT.guard) }],
    },
  ];
  const [a, b] = C.techs;
  out.push(trainerUntil({
    id: 'tecnico_sondeo', trainer: 'b11_tecnico_sondeo', name: 'Técnico Íñigo', sprite: SPRITE.tecnico, x: a.x, y: a.y, dir: a.dir, sight: 3,
    intro: 'Zona de trabajo. Si insiste en pasar, tendré que pedirle que se identifique. Con un combate.',
    after: 'La perforadora no para ni de noche. La jefa quiere la muestra entera antes del envío.',
  }, gone));
  out.push(trainerUntil({
    id: 'tecnica_sondeo', trainer: 'b11_tecnica_sondeo', name: 'Técnica Mara', sprite: SPRITE.tecnica, x: b.x, y: b.y, dir: b.dir, sight: 3,
    intro: 'Lecturas de campo. Esto no es un parque. …Muy bien, veamos qué lecturas da usted.',
    after: 'Medimos el aljibe desde aquí abajo. Arriba no deja acercarse a los aparatos.',
  }, gone));
  return out;
}

function barrierEvents() {
  const P = C.perimeter;
  const out = [];
  for (let x = P.x0; x <= P.x1; x++) {
    out.push({
      id: `barrera_${x}`, x, y: P.y, name: 'Barrera',
      pages: [{ when: active, tileId: BARRIER[(x - P.x0) % 2], solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CAMP_TEXT.barrier); } }],
    });
  }
  return out;
}

function objectEvents() {
  const text = (t) => async (ctx) => { await ctx.say(t); };
  const out = C.crates.map(([x, y], i) => ({
    id: `caja_exp03_${i}`, x, y, name: 'Caja EXP-03',
    pages: [
      {
        when: active, sprite: OBJ.crate, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, trigger: 'action',
        script: async (ctx) => { await ctx.say(CAMP_TEXT.crates); },
      },
      ...(i === 0 ? [{ when: gone, sprite: OBJ.crate, dir: 4, directionFix: true, walkAnime: false, trigger: 'action', script: text(CAMP_TEXT.crateEmpty) }] : []),
    ],
  }));
  out.push({
    id: 'perforadora', x: C.rig.x, y: C.rig.y, name: 'Perforadora',
    pages: [
      { when: active, sprite: OBJ.rig, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 4, solid: true, trigger: 'action', script: text(CAMP_TEXT.rig) },
      { when: gone, sprite: OBJ.hole, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: text(CAMP_TEXT.hole) },
    ],
  });
  out.push({
    id: 'tripode_aljibe', x: C.tripod.x, y: C.tripod.y, name: 'Trípode',
    pages: [{ when: active, sprite: OBJ.tripod, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: text(CAMP_TEXT.tripod) }],
  });
  out.push({ id: 'campamento_recogido', x: 0, y: 0, pages: [{ when: gone, through: true, patch: CAMP_GONE_PATCH }] });
  // Pozos de sondeo que quedan en la explanada (tapados con chapa) cuando Genesis se marcha.
  CAMP_HOLES.forEach(([x, y], i) => out.push({
    id: `pozo_sondeo_${i}`, x, y, name: 'Pozo de sondeo',
    pages: [{ when: gone, sprite: OBJ.hole, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: text(CAMP_TEXT.hole) }],
  }));
  out.push({ id: 'cartel_senda', type: 'sign', x: 13, y: 9, text: CAMP_TEXT.trailSign, skin: 'sign hgss dir' });
  return out;
}

function gaelEvents() {
  return [{
    id: 'gael_monte', x: C.gael.x, y: C.gael.y, name: 'Gael',
    pages: [{ when: when({ all: [F.gaelAlerce, F.exp03Taken], none: [F.gaelB4] }), sprite: SPRITE.gael, dir: C.gael.dir, move: 'still', trigger: 'action', script: gaelB4 }],
  }];
}

export function campEvents() {
  return [...arrivalEvents(), ...staffEvents(), ...barrierEvents(), ...objectEvents(), ...gaelEvents()];
}
