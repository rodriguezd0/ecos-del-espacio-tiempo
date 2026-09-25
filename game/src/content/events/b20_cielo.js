// Cielo Interior y Trío de las Nubes (docs/CAMPANA.md B20; D20; TABLILLAS.md Crónica XI):
//   · Una caverna con cielo propio: islas de piedra sobre nubes (panorama `cielo`). Caer al vacío devuelve, sin daño, al
//     último punto seguro (world/impossible, B12): la llegada, los manantiales o la terraza del último combate ganado.
//   · Motivo (D20): son el último sello del Pacto de las Nubes («pedimos a los tres de las nubes que se interpusieran si
//     alguien volvía a llamar») y acaban de sentir cómo manos humanas desgarraban el viento, la tormenta y la tierra (el
//     Anillo de Captación). Para ellos, un humano con el último Fragmento es la misma amenaza que el Rey. Ni siervos ni
//     hipnosis.
//   · Tornadus 68 → manantial → Thundurus 68 → manantial → Landorus 70; captura desactivada («No es momento: es un sello»);
//     al perder, el equipo se cura y se vuelve al puente de antes de la terraza (bossBattle).
//   · La pregunta «¿Para qué lo despiertas?» (tres respuestas válidas); Zygarde Completo responde por el protagonista;
//     si se apagaron torres del Anillo (B17), Landorus lo dice. El Trío se retira al cielo (búsqueda en el postgame).
import { F, V, SPRITE, SPEAKER, OBJ, MUSIC, byGender, zygardeSays, zygardeLines, pause, eventById, placePlayer, bossBattle, lines } from './b20_common.js';
import { trioRequest, TRIO_ANSWERS, ringTowersOff } from './b20_logic.js';
import { springEvent } from './b20_senda.js';
import { CIELO, LINKS } from '../maps/b20/layout.js';
import { setAnchor } from '../../world/impossible/actions.js';

export const CIELO_TEXT = Object.freeze({
  arrival: [
    'Al salir de la Senda, la roca se abre… y hay cielo. Un cielo entero, azul, con nubes que no vienen de ningún sitio.',
    'Islas de piedra flotan sobre él, unidas por pasarelas estrechas.',
  ],
  arrivalCore: ['Aquí no sopla el viento de fuera. Este cielo lo guardan otros.', 'Tres. Nos están mirando desde que salimos de la roca.'],
  tornadus: [
    [SPEAKER.tornadus, 'Otro humano con la flauta en el bolsillo. Rota, esta vez.'],
    [SPEAKER.tornadus, 'Los que grabaron las tablas nos pidieron una cosa: interponernos si alguien volvía a llamar.'],
    [SPEAKER.tornadus, 'El viento se aparta de quien lo merece. Demuéstralo.'],
  ],
  tornadusWon: 'Tornadus se eleva en un remolino y se queda arriba, mirando.',
  tornadusLost: 'El viento te devuelve a la pasarela. Tornadus sigue en su terraza.',
  thundurus: [
    [SPEAKER.thundurus, 'Hace nada, unas manos humanas desgarraban el viento, la tormenta y la tierra. Lo sentimos arder.'],
    [SPEAKER.thundurus, 'Y ahora bajas tú, con nueve pedazos de la flauta que robó el rey.'],
  ],
  thundurusWon: 'Un trueno sin lluvia. Thundurus sube a las nubes y se queda allí, callado.',
  thundurusLost: 'Un relámpago te aparta. Tu equipo se recupera en la pasarela.',
  landorus: [
    [SPEAKER.landorus, 'El último humano que llamó con esa flauta se llamaba rey.'],
    [SPEAKER.landorus, 'Quería que el Eje le obedeciera. Nosotros seguimos aquí por él.'],
  ],
  landorusLost: 'La tierra tiembla y te devuelve a la pasarela. Landorus no se ha movido.',
  gather: 'Los tres bajan de las nubes y se posan delante de ti.',
  question: '¿Para qué lo despiertas?',
  zygardeSteps: 'Zygarde se pone a tu lado. Entero, más alto que los tres.',
  vouch: (s) => byGender(s, 'Yo respondo por él.', 'Yo respondo por ella.'),
  silence: 'Los tres se miran. Durante un momento largo, nadie dice nada.',
  towers: [SPEAKER.landorus, 'Alguien apagó las torres. Lo sentimos.'],
  answerReply: Object.freeze({
    cielo: [SPEAKER.tornadus, 'El cielo está roto. Eso lo sabemos también nosotros.'],
    fuerza: [SPEAKER.thundurus, 'Por la fuerza ya lo intentaron. Arriba, hace nada.'],
    zygarde: [SPEAKER.landorus, 'El guardián roto te lo pidió… y está entero.'],
  }),
  release: [SPEAKER.landorus, 'El sello se aparta. Que no tengamos que volver a interponernos.'],
  retire: 'El Trío de las Nubes se eleva, cada uno por su lado, y se pierde en el cielo.',
  retireCore: 'No se van lejos. El viento, la tormenta y la tierra siempre vuelven.',
  gateShut: 'Un arco de luz dorada sobre la última isla. No se abre mientras el sello siga en pie.',
  gate: 'Un arco de luz dorada. Al otro lado, una terraza de piedra.',
});

const beaten = (key) => (s) => Boolean(s?.flag(F[key]));
const RETRY_TEXT = { tornadus: CIELO_TEXT.tornadusLost, thundurus: CIELO_TEXT.thundurusLost, landorus: CIELO_TEXT.landorusLost };
const INTRO = { tornadus: CIELO_TEXT.tornadus, thundurus: CIELO_TEXT.thundurus, landorus: CIELO_TEXT.landorus };

async function sayPairs(ctx, pairs) {
  for (const [speaker, text] of pairs) await ctx.say(text, { speaker });
}

/** Un miembro del Trío se eleva y se pierde en el cielo (fundido). */
async function flyAway(ctx, id, { keep = false } = {}) {
  const ev = eventById(ctx, id);
  if (!ev) return;
  ctx.se('PRSFX- Gust', { volume: 70 });
  ev.through = true;
  const route = [{ speed: 5 }, 'up', 'up', 'up'];
  for (let o = 200; o >= 0; o -= 50) route.push({ opacity: o }, 'up');
  await ctx.move(ev, route, { through: true, wait: true });
  if (!keep) ev.opacity = 0;
}

async function fight(ctx, key) {
  const T = CIELO.trio[key];
  const ev = eventById(ctx, `trio_${key}`);
  ctx.cry(key.toUpperCase());
  if (ev) await ctx.emote(ev, '!');
  await sayPairs(ctx, INTRO[key]);
  const r = T.retry;
  const outcome = await bossBattle(ctx, trioRequest(key, { bgm: MUSIC.trio }), { x: r.x, y: r.y, dir: r.dir }, { loseText: RETRY_TEXT[key] });
  if (outcome !== 'win') return false;
  ctx.setFlag(F[key]);
  const p = ctx.player;
  setAnchor(ctx, { map: ctx.map.id, x: p.x, y: p.y, dir: p.direction });
  return true;
}

async function trioScene(ctx, key) {
  if (ctx.flag(F[key])) return;
  const won = await fight(ctx, key);
  if (!won) return;
  if (key === 'landorus') { await councilScene(ctx); return; }
  await ctx.say(key === 'tornadus' ? CIELO_TEXT.tornadusWon : CIELO_TEXT.thundurusWon);
  await flyAway(ctx, `trio_${key}`);
  ctx.requestRefresh();
}

/** Los tres, la pregunta y la respuesta de Zygarde (CAMPANA B20). */
async function councilScene(ctx) {
  const C = CIELO.council;
  await placePlayer(ctx, C.player.x, C.player.y, C.player.dir, { frames: 16 });
  const spawned = [];
  for (const k of ['tornadus', 'thundurus']) {
    const [x, y] = C[k];
    const ev = ctx.world.spawnEvent?.({ id: `consejo_${k}`, x, y: y - 3, sprite: SPRITE[k], dir: 2, through: true, stepAnime: true, directionFix: true });
    if (ev) { ev.opacity = 0; spawned.push(ev); }
  }
  await ctx.say(CIELO_TEXT.gather);
  for (const ev of spawned) ctx.move(ev, [{ speed: 3 }, { opacity: 120 }, 'down', { opacity: 200 }, 'down', { opacity: 255 }, 'down'], { through: true, wait: false });
  const land = eventById(ctx, 'trio_landorus');
  await pause(ctx, 50);
  // CAMPANA B20: «Después preguntan» (los tres a la vez). Hay que responder: B vuelve a preguntar (tope de seguridad).
  let q = -1;
  for (let tries = 0; !TRIO_ANSWERS[q] && tries < 8; tries++) {
    q = await ctx.choice(TRIO_ANSWERS.map((a) => a.text), { message: CIELO_TEXT.question, speaker: SPEAKER.trio });
  }
  const answer = TRIO_ANSWERS[q] || TRIO_ANSWERS[0];
  ctx.setVar(V.trioAnswer, answer.id);
  const [zx, zy] = C.zygarde;
  const giant = ctx.world.spawnEvent?.({ id: 'zygarde_completo', x: zx, y: zy, sprite: OBJ.zygardeComplete, through: true, stepAnime: true, directionFix: true, dir: 2 });
  if (giant) giant.opacity = 0;
  for (let f = 0; f <= 20; f++) { if (giant) giant.opacity = Math.round((255 * f) / 20); await pause(ctx, 1); }
  ctx.cry('ZYGARDE', 2);
  await ctx.say(CIELO_TEXT.zygardeSteps);
  await zygardeSays(ctx, CIELO_TEXT.vouch);
  await pause(ctx, 20);
  await ctx.say(CIELO_TEXT.silence);
  await sayPairs(ctx, [CIELO_TEXT.answerReply[answer.id]]);
  if (ringTowersOff(ctx.state)) await sayPairs(ctx, [CIELO_TEXT.towers]);
  await sayPairs(ctx, [CIELO_TEXT.release]);
  ctx.setFlag(F.trio);
  for (let f = 20; f >= 0; f--) { if (giant) giant.opacity = Math.round((255 * f) / 20); await pause(ctx, 1); }
  if (giant) ctx.world.removeEvent?.(giant);
  ctx.se('PRSFX- Gust', { volume: 80 });
  const flights = [...spawned, land].filter(Boolean).map((ev) => ctx.move(ev, [{ speed: 5 }, 'up', 'up', { opacity: 160 }, 'up', { opacity: 80 }, 'up', { opacity: 0 }], { through: true, wait: true }));
  await Promise.all(flights);
  for (const ev of spawned) ctx.world.removeEvent?.(ev);
  ctx.requestRefresh();
  await ctx.say(CIELO_TEXT.retire);
  await zygardeSays(ctx, CIELO_TEXT.retireCore);
}

function trioEvents() {
  const out = [];
  for (const key of ['tornadus', 'thundurus', 'landorus']) {
    const T = CIELO.trio[key];
    const pages = [{ when: (s) => !beaten(key)(s), sprite: SPRITE[key], dir: 2, stepAnime: true, speed: 3, directionFix: true, solid: true, trigger: 'action', script: (ctx) => trioScene(ctx, key) }];
    // Landorus sigue en su terraza tras el combate: la pregunta llega justo después (y se retoma si se sale a medias).
    if (key === 'landorus') {
      pages.push({ when: (s) => beaten(key)(s) && !s.flag(F.trio), sprite: SPRITE[key], dir: 2, stepAnime: true, speed: 3, directionFix: true, solid: true, trigger: 'action', script: councilScene });
    }
    out.push({ id: `trio_${key}`, x: T.at.x, y: T.at.y, name: key[0].toUpperCase() + key.slice(1), pages });
    for (const [x, y] of T.strip) {
      out.push({ id: `trio_${key}_franja_${x}`, x, y, pages: [{ when: (s) => !beaten(key)(s), through: true, trigger: 'touch', script: (ctx) => trioScene(ctx, key) }] });
    }
  }
  return out;
}

function gateEvent() {
  const G = CIELO.gate;
  const to = LINKS.cieloToTerraza;
  return {
    id: 'cielo_arco', x: G.x, y: G.y, name: 'Arco de luz',
    pages: [
      { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CIELO_TEXT.gateShut); } },
      {
        when: (s) => s.flag(F.trio), sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, through: true,
        trigger: 'touch', glow: { name: 'softLight', radius: 60, intensity: 0.6, pulse: 0.4, color: [255, 220, 130] },
        script: async (ctx) => {
          ctx.se('PRSFX- Teleport', { volume: 60 });
          await ctx.warp(to.map, to.x, to.y, to.dir, { fade: true, frames: 20 });
        },
      },
    ],
  };
}

function backEvent() {
  const B = CIELO.back;
  const to = LINKS.cieloToSenda;
  return {
    id: 'cielo_vuelta', x: B.x, y: B.y, name: 'Grieta',
    sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, through: true, trigger: 'touch',
    script: async (ctx) => { await ctx.warp(to.map, to.x, to.y, to.dir, { fade: true, frames: 16 }); },
  };
}

export async function cieloOnEnter(ctx) {
  for (let k = 1; k <= 9; k++) if (!ctx.flag(F.tramo(k))) ctx.setFlag(F.tramo(k));
  if (ctx.flag(F.skyArrival)) return;
  ctx.setFlag(F.skyArrival);
  await pause(ctx, 24);
  for (const t of CIELO_TEXT.arrival) await ctx.say(t);
  await zygardeLines(ctx, CIELO_TEXT.arrivalCore);
}

export function cieloEvents() {
  return [
    ...trioEvents(),
    ...CIELO.springs.map((s) => springEvent(`cielo_manantial_${s.n}`, s.n + 2, s)),
    gateEvent(),
    backEvent(),
    ...CIELO.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item })),
  ];
}

export { lines };
