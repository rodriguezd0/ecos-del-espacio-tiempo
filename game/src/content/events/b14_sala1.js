// Sala 1 de las Ruinas de Antea, «Plaza de la Caracola» (docs/CAMPANA.md B14: «Mover una estatua en Antea abre un
// paso en la ruina sumergida»). En el presente, la estatua de la tañedora de caracola está caída sobre la boca norte;
// en Antea está de pie junto a la puerta alta, sobre una peana con ruedas que corre por una ranura. Si se empuja hasta
// la hornacina, en el presente aparece caída allí y la boca queda libre (var b14_estatua). Módulo puro salvo guiones.
import { ROOMS, ROOM1 } from '../maps/b14/layout.js';
import { F, V, SPRITE, OBJ, lines, zygardeSays, byGender, eventById } from './b14_common.js';
import { ventEvents, echoCitizen, echoDoor, itemEvents, bigSprite } from './b14_antea_common.js';
import { caracolaEvents } from './b14_caracolas.js';
import { cellEvent } from './b01_cells.js';

const S = ROOM1.statue;
const moved = (s) => Number(s?.var(V.statue, 0)) === 1;

export const SALA1_TEXT = Object.freeze({
  entryCore: 'Una ciudad. Bajo el agua. La oigo… como si aún hablara.',
  fallenGate: 'Una estatua caída tapa la boca del pasadizo. Pesa demasiado para moverla.',
  fallenGateCore: 'En el eco de esta plaza estaba de pie. Allí quizá se pueda mover.',
  fallenNiche: 'La estatua caída descansa en la hornacina, cubierta de coral. Justo donde la dejaste… hace siglos.',
  statue: 'Una figura de piedra se lleva una caracola a los labios. La peana tiene ruedas de bronce encajadas en una ranura del suelo.',
  statueHint: 'La ranura sigue hacia el oeste, hasta una hornacina en la muralla. Habría que empujarla desde el otro lado.',
  statueAsk: '¿Empujar la estatua hacia la hornacina?',
  statuePush: 'Empujas con el hombro. Las ruedas chirrían y la estatua se desliza por la ranura hasta la hornacina.',
  statueCore: 'Se quedará ahí mil años. Donde la dejes, allí caerá.',
  statueMoved: 'La estatua descansa en su hornacina, mirando a la plaza.',
  gate: 'La puerta alta de Antea: dos hojas de bronce con espirales de caracola. Está cerrada por dentro.',
  plinth: 'Una losa de piedra al pie de la muralla: la hornacina de la estatua.',
});

// ───────────────────────────── presente ─────────────────────────────

function fallenStatueEvents() {
  const [gl, gc, gr] = ROOM1.fallenGate;
  const [nl, nc, nr] = ROOM1.fallenNiche;
  const gateScript = async (ctx) => {
    await ctx.say(SALA1_TEXT.fallenGate);
    if (!ctx.flag(F.statueSeen)) {
      ctx.setFlag(F.statueSeen);
      await zygardeSays(ctx, SALA1_TEXT.fallenGateCore);
    }
  };
  return [
    ...bigSprite('estatua_caida_boca', gc[0], gc[1], OBJ.fallen, 2, [], {
      block: [gl, gr], when: (s) => !moved(s), extra: { script: undefined },
    }).map((ev) => ({ ...ev, pages: ev.pages.map((p) => ({ ...p, script: gateScript })) })),
    ...bigSprite('estatua_caida_hornacina', nc[0], nc[1], OBJ.fallen, 2, SALA1_TEXT.fallenNiche, { block: [nl, nr], when: moved }),
  ];
}

async function entryScene(ctx) {
  if (ctx.flag(F.anteaIn)) return;
  ctx.setFlag(F.anteaIn);
  await zygardeSays(ctx, SALA1_TEXT.entryCore);
}

export function sala1PresenteEvents() {
  return [
    ...caracolaEvents(1, 'presente'),
    ...fallenStatueEvents(),
    cellEvent({ id: 'cell_ecos_1', x: ROOM1.cell.x, y: ROOM1.cell.y }),
    ...ventEvents('respiradero_s1', ROOM1.vents),
    ...itemEvents([
      { id: 'objeto_s1_perla', x: 22, y: 8, item: 'BIGPEARL', hidden: true },
      { id: 'objeto_s1_real', x: 25, y: 10, item: 'RELICCOPPER' },
      { id: 'objeto_s1_buceo', x: 5, y: 7, item: 'DIVEBALL', count: 2 },
    ]),
    {
      id: 'llegada_s1', x: ROOMS[1].south.arrival.x, y: ROOMS[1].south.arrival.y - 1,
      pages: [{ when: (s) => !s.flag(F.anteaIn), through: true, trigger: 'touch', lock: false, script: entryScene }],
    },
  ];
}

// ───────────────────────────── Antea ─────────────────────────────

async function statueTalk(ctx) {
  await ctx.say(SALA1_TEXT.statue);
  const p = ctx.player;
  if (p.x !== S.push.x || p.y !== S.push.y || p.direction !== S.push.dir) {
    await ctx.say(SALA1_TEXT.statueHint);
    return;
  }
  const i = await ctx.choice(['Sí', 'No'], { message: SALA1_TEXT.statueAsk, cancel: 1 });
  if (i !== 0) return;
  const ev = eventById(ctx, 'estatua');
  ctx.se('Strength push', { volume: 90 });
  ctx.shake(2, 4, 40);
  const steps = Array(S.from.x - S.to.x).fill('left');
  if (ev) await ctx.move(ev, steps, { through: true, speed: 2, wait: true }).catch(() => {});
  await ctx.move('player', steps.slice(0, -1), { through: false, speed: 3 }).catch(() => {});
  ctx.se('Rock Smash', { volume: 50 });
  ctx.setVar(V.statue, 1);
  ctx.requestRefresh();
  await ctx.say(SALA1_TEXT.statuePush);
  await zygardeSays(ctx, SALA1_TEXT.statueCore);
}

function statueEvents() {
  return [
    {
      id: 'estatua', x: S.from.x, y: S.from.y, name: 'Estatua',
      pages: [{ when: (s) => !moved(s), sprite: OBJ.statue, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: statueTalk }],
    },
    {
      id: 'estatua_hornacina', x: S.to.x, y: S.to.y, name: 'Estatua',
      pages: [{
        when: moved, sprite: OBJ.statue, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say(SALA1_TEXT.statueMoved); },
      }],
    },
  ];
}

const ECHOES = Object.freeze({
  vendor: (s) => [
    '¡Conchas, redes, sal gorda! ¿Te pongo algo?',
    `¿Has oído lo de la corona, ${byGender(s, 'muchacho', 'muchacha')}? Dicen que el rey la ha mandado forjar para que suene como la flauta.`,
  ],
  kid: ['Si soplas la caracola del heraldo, se oye el mar de otro día. ¡Lo dice mi abuela!', 'Yo lo he intentado y solo se oye… zzzuuum.'],
  old: ['La puerta alta solo se abre los días de ofrenda. Hoy no toca, hoy no toca.', 'Qué mañana más tranquila. Como todas.'],
  fisher: ['La mar está mansa. Buena mañana para echar las redes.', 'Aunque anda un rumor raro bajo el agua. Como si el mar se acordara de algo.'],
});

export function sala1AnteaEvents() {
  return [
    ...caracolaEvents(1, 'antea'),
    ...statueEvents(),
    ...bigSprite('puerta_alta', 16, 4, OBJ.gate, 2, SALA1_TEXT.gate, { block: [[15, 4], [17, 4]] }),
    { id: 'hornacina', x: S.to.x, y: 5, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(SALA1_TEXT.plinth); } },
    echoCitizen('eco_vendedora', 8, 17, SPRITE.echoVendor, 2, ECHOES.vendor, { name: 'Vendedora' }),
    echoCitizen('eco_nino', 19, 11, SPRITE.echoKid, 4, ECHOES.kid, { move: { wander: 2 }, name: 'Niño' }),
    echoCitizen('eco_anciana', 12, 7, SPRITE.echoOld, 2, ECHOES.old, { name: 'Anciana' }),
    echoCitizen('eco_pescador', 22, 18, SPRITE.echoFisher, 2, ECHOES.fisher, { name: 'Pescador' }),
    echoDoor('puerta_casa_o', 5, 9), echoDoor('puerta_casa_e', 27, 9), echoDoor('puerta_casa_rosa', 4, 15),
    ...itemEvents([{ id: 'objeto_s1a_escama', x: 25, y: 18, item: 'HEARTSCALE' }]),
  ];
}

export { lines };
