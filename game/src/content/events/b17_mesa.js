// Mesa de los Vientos (TABLILLAS T14 «La carta sin destino»: «una comunidad de cuidadores de Altaria lleva aislada desde
// las tormentas. […] Los cuidadores no confían en el jugador; hay que ayudarles a recuperar su rebaño de Altaria,
// disperso por la crisis (tres encuentros visibles)»; CAMPANA §1.3: «Cuidadores de Altaria (curan)»).
//   · Llegada: Brisa, la jefa de los cuidadores, desconfía; faltan tres Altaria del rebaño.
//   · Los tres Altaria: prado del oeste (a pie), la Aguja del Viento (Reconstrucción) y el Alto (Trepar). Cada uno está
//     asustado: combate salvaje de guion sin captura (el rebaño no se captura); al calmarse, vuelve al corral.
//   · Con el rebaño completo, los cuidadores confían: curan (el canto de los Altaria) y dejan pasar a la cabaña de Aurora
//     (mesa_vientos_casa, content/events/b17_t14.js).
// Módulo puro salvo los guiones.
import {
  F, SPEAKER, SPRITE, when, lines, eventById, pause, examine, npc, byGender,
} from './b17_common.js';
import {
  AGUJA_GAP, CLIMB, WISH_ROCK, BUILDINGS, CORRAL, HERD_SPOTS, SPOTS, ITEMS, FLY_POINT,
} from '../maps/b17/mesa_layout.js';
import { socketTiles } from '../maps/b17/rim.js';
import { HERD } from '../encounters/b17.js';
import { bossBattle } from '../common/bossBattle.js';

const Z = socketTiles('Exterior1');
const HERD_FLAGS = Object.freeze([F.altaria1, F.altaria2, F.altaria3]);
export const herdCount = (s) => HERD_FLAGS.filter((f) => s?.flag(f)).length;
const CATCH_REASON = 'Es un Altaria del rebaño de la Mesa. Los cuidadores lo esperan: no se puede capturar.';

export const MESA_TEXT = Object.freeze({
  arrival: [
    'El viento sopla fuerte y limpio. Por debajo del borde solo hay nubes.',
  ],
  brisaMeet: [
    '¿Quién eres tú? Aquí no sube nadie desde las tormentas. Nadie.',
    (s) => `¿Has venido… volando? ¿Con eso? Pues ya puedes volver por donde has venido, ${byGender(s, 'forastero', 'forastera')}.`,
  ],
  brisaWhy: [
    'La última tormenta nos dispersó el rebaño. Tres Altaria no han vuelto, y con el cielo así no se atreven a bajar.',
    'No nos fiamos de los de abajo. Si de verdad quieres algo de esta Mesa, empieza por ayudarnos.',
  ],
  brisaTask: (n) => (n === 0
    ? ['Uno anda por el prado del oeste. Otro se ha subido al Alto, por la pared. Y el tercero está en la Aguja, al otro lado del hueco.']
    : [`Faltan ${n === 1 ? 'dos' : 'uno'}. Prado del oeste, el Alto y la Aguja: mira bien.`]),
  letterAsk: 'Le cuentas que traes una carta para Aurora, de parte de su hermano.',
  brisaLetter: '¿Para Aurora? Aurora no recibe a nadie. Primero el rebaño.',
  trust: [
    'Los tres. Han vuelto los tres.',
    'Perdona el recibimiento. Aquí arriba, el que llega sin avisar suele venir a llevarse algo.',
    'Aurora vive en la cabaña del oeste, la del buzón. Si traes algo para ella, pasa. Y si tus Pokémon están cansados, los Altaria cantan para quien lo necesite.',
  ],
  healAsk: '¿Quieres que los Altaria canten para tu equipo?',
  healDone: 'Los Altaria del corral cantan a coro. Tu equipo se ha recuperado.',
  brisaLater: (s) => (s.flag(F.reunion)
    ? ['Aurora se ha quedado unos días con su hermano, en Nexo. Dice que vuelve cuando el cielo se calme.']
    : ['El rebaño está entero. Aurora está en su cabaña.']),
  cefiroNo: ['Aurora no recibe visitas. Hace años que no.'],
  cefiroYes: ['Pasa, pasa. Aurora ya sabe que has ayudado con el rebaño.'],
  cefiroAfter: ['Sesenta años esperando una carta que no sabía que existía. Y un Pokémon la trae volando. Qué cosas.'],
  nube: (s) => (herdCount(s) < 3
    ? ['Mi Swablu no para de llamar a los que faltan. Dice que los oye, pero no vienen.']
    : ['¡Han vuelto todos! Mi Swablu ya no llora por las noches.']),
  sign: 'MESA DE LOS VIENTOS\nComunidad de cuidadores de Altaria. No asustes al rebaño.',
  bell: 'La campana de los vientos. Los cuidadores la tocan para llamar al rebaño.',
  wishRock: 'Una roca lisa en lo más alto de la Mesa. Los cuidadores la llaman la roca del deseo.',
  altariaScared: 'El Altaria se revuelve, asustado. ¡Hay que calmarlo!',
  altariaCalm: 'El Altaria deja de revolverse. Canta bajito y se deja guiar hasta el corral.',
  altariaRun: 'El Altaria sigue revoloteando, asustado.',
  altariaLost: 'El Altaria se ha alejado un poco. Tu equipo se ha recuperado: puedes intentarlo otra vez.',
  corral: 'Los Altaria del corral se acicalan las alas de algodón.',
  keepersDoor: 'La casa de los cuidadores. La puerta está atrancada contra el viento; dentro crepita una chimenea.',
  gapBlocked: 'Entre la Mesa y la Aguja del Viento solo hay nubes. En el borde quedan zócalos hexagonales, gastados.',
});

// ───────────────────────────── llegada y cuidadores ─────────────────────────────

async function arrivalScene(ctx) {
  ctx.setFlag(F.mesaArrival);
  await pause(ctx, 20);
  for (const t of MESA_TEXT.arrival) await ctx.say(t);
  // Zygarde habla muy poco (autor, 25-09-2026): sin comentario de llegada ni conteo del rebaño (lo lleva Brisa).
  const brisa = eventById(ctx, 'brisa');
  if (brisa) {
    await ctx.emote(brisa, '!');
    const { stageRoute } = await import('./b07_path.js');
    const p = ctx.player;
    const route = stageRoute(ctx, brisa, p.x, p.y - 1);
    if (route?.length) await ctx.move(brisa, route.slice(0, 30), { through: false, speed: 4 });
    ctx.turnToPlayer(brisa);
    ctx.face('player', ctx.directionTo(ctx.player, brisa));
  }
  await lines(ctx, SPEAKER.keeper, MESA_TEXT.brisaMeet);
  await ctx.say(MESA_TEXT.letterAsk);
  await ctx.say(MESA_TEXT.brisaLetter, { speaker: SPEAKER.keeper });
  await lines(ctx, SPEAKER.keeper, MESA_TEXT.brisaWhy);
  await lines(ctx, SPEAKER.keeper, MESA_TEXT.brisaTask(herdCount(ctx.state)));
  // Brisa vuelve a la puerta del corral (si no, se quedaría en el estrado hasta recargar el mapa).
  if (brisa) {
    const { stageRoute } = await import('./b07_path.js');
    const home = SPOTS.brisa;
    const back = stageRoute(ctx, brisa, home.x, home.y);
    if (back?.length) await ctx.move(brisa, back.slice(0, 40), { through: false, speed: 4 });
    ctx.face(brisa, home.dir);
  }
}

async function heal(ctx) {
  if (!(await ctx.confirm(MESA_TEXT.healAsk))) return;
  await ctx.fade('out', 16);
  ctx.heal();
  ctx.setHealPoint(FLY_POINT.x, FLY_POINT.y, 2, 'mesa_vientos');
  ctx.me('heal');
  await pause(ctx, 60);
  await ctx.fade('in', 16);
  await ctx.say(MESA_TEXT.healDone);
}

async function brisaTalk(ctx) {
  if (!ctx.flag(F.trust)) {
    await lines(ctx, SPEAKER.keeper, MESA_TEXT.brisaTask(herdCount(ctx.state)));
    return;
  }
  await lines(ctx, SPEAKER.keeper, MESA_TEXT.brisaLater(ctx.state));
  await heal(ctx);
}

/** Con el rebaño completo: Brisa da las gracias y abre la Mesa (una vez). */
async function trustScene(ctx) {
  ctx.setFlag(F.trust);
  const brisa = eventById(ctx, 'brisa');
  if (brisa) { ctx.turnToPlayer(brisa); await ctx.emote(brisa, '♪'); }
  ctx.cry('ALTARIA');
  await lines(ctx, SPEAKER.keeper, MESA_TEXT.trust);
  await heal(ctx);
}

function keeperEvents() {
  const S = SPOTS;
  const door = BUILDINGS.aurora.door;
  return [
    { id: 'brisa', x: S.brisa.x, y: S.brisa.y, name: SPEAKER.keeper, pages: [{ sprite: SPRITE.keeper, dir: S.brisa.dir, move: 'still', trigger: 'action', script: brisaTalk }] },
    {
      id: 'cefiro', x: S.cefiro.x, y: S.cefiro.y, name: SPEAKER.keeperOld,
      pages: [
        { sprite: SPRITE.keeperOld, dir: S.cefiro.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.keeperOld, MESA_TEXT.cefiroNo) },
        { when: (s) => s.flag(F.trust), sprite: SPRITE.keeperOld, dir: S.cefiro.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.keeperOld, MESA_TEXT.cefiroYes) },
        { when: (s) => s.flag(F.reunion), sprite: SPRITE.keeperOld, dir: S.cefiro.dir, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.keeperOld, MESA_TEXT.cefiroAfter) },
      ],
    },
    npc('nube', S.nube.x, S.nube.y, SPRITE.keeperKid, SPEAKER.keeperKid, (s) => MESA_TEXT.nube(s), { dir: S.nube.dir }),
    { id: 'swablu_nube', x: S.nubeSwablu.x, y: S.nubeSwablu.y, name: 'Swablu', pages: [{ sprite: SPRITE.swablu, dir: S.nubeSwablu.dir, move: { wander: 1 }, stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry('SWABLU'); await ctx.say('¡Swablu!'); } }] },
    // Puerta de la cabaña de Aurora: Céfiro no deja pasar hasta que el rebaño vuelve.
    {
      id: 'puerta_aurora', x: door.x, y: door.y, when: (s) => !s.flag(F.trust), trigger: 'touch', noOver: true,
      script: async (ctx) => {
        const c = eventById(ctx, 'cefiro');
        if (c) ctx.turnToPlayer(c);
        await lines(ctx, SPEAKER.keeperOld, MESA_TEXT.cefiroNo);
        await ctx.move('player', ['down'], { through: false });
      },
    },
    { id: 'llegada_mesa', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.mesaArrival] }), script: arrivalScene },
    { id: 'confianza_mesa', x: 1, y: 0, trigger: 'auto', when: (s) => herdCount(s) === 3 && !s.flag(F.trust), script: trustScene },
  ];
}

// ───────────────────────────── el rebaño ─────────────────────────────

/** Petición del combate con un Altaria del rebaño (salvaje de guion, sin captura). */
export function herdBattleRequest(n) {
  return {
    type: 'wild',
    wild: { ...HERD[n] },
    rules: { catchCondition: () => ({ allowed: false, reason: CATCH_REASON }) },
    bgm: 'PrismaSalvaje',
    battleback: 'Acantilado',
  };
}

async function herdEncounter(ctx, n) {
  const ev = eventById(ctx, `altaria_rebano_${n + 1}`);
  ctx.cry('ALTARIA');
  if (ev) { ctx.turnToPlayer(ev); await ctx.emote(ev, '!'); }
  await ctx.say(MESA_TEXT.altariaScared);
  const outcome = await bossBattle(ctx, herdBattleRequest(n), null, { loseText: MESA_TEXT.altariaLost });
  if (outcome === 'run') { await ctx.say(MESA_TEXT.altariaRun); return; }
  if (outcome !== 'win' && outcome !== 'caught') return;
  ctx.setFlag(HERD_FLAGS[n]);
  await ctx.say(MESA_TEXT.altariaCalm);
  if (ev) {
    ctx.se('Anim/Wind1', { volume: 70 });
    for (let o = 255; o >= 0; o -= 32) { ev.opacity = Math.max(0, o); await pause(ctx, 2); }
  }
  ctx.requestRefresh();
}

function herdEvents() {
  const events = [];
  HERD_SPOTS.forEach((p, n) => {
    const missing = (s) => !s.flag(HERD_FLAGS[n]);
    events.push({
      id: `altaria_rebano_${n + 1}`, x: p.x, y: p.y, name: 'Altaria',
      pages: [{
        when: missing, sprite: SPRITE.altaria, dir: p.dir, move: n === 0 ? { wander: 2 } : 'still', stepAnime: true, speed: 3, freq: 3,
        trigger: 'touch', script: (ctx) => herdEncounter(ctx, n),
      }],
    });
    const r = CORRAL.roost[n];
    events.push({
      id: `altaria_corral_vuelto_${n + 1}`, x: r.x, y: r.y, name: 'Altaria',
      pages: [{ when: (s) => s.flag(HERD_FLAGS[n]), sprite: SPRITE.altaria, dir: r.dir, move: { wander: 1 }, stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry('ALTARIA'); await ctx.say(MESA_TEXT.corral); } }],
    });
  });
  CORRAL.flock.forEach((p, i) => {
    events.push({
      id: `rebano_corral_${i}`, x: p.x, y: p.y, name: i === 1 ? 'Swablu' : 'Altaria',
      pages: [{ sprite: i === 1 ? SPRITE.swablu : SPRITE.altaria, dir: p.dir, move: { wander: 1 }, stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry(i === 1 ? 'SWABLU' : 'ALTARIA'); await ctx.say(MESA_TEXT.corral); } }],
    });
  });
  return events;
}

// ───────────────────────────── paso a la Aguja y al Alto ─────────────────────────────

function passageEvents() {
  const tiles = AGUJA_GAP.cells.map(([x, y]) => [x, y, 2, Z.stone]);
  return [
    ...AGUJA_GAP.sockets.map((p, i) => ({
      id: `zocalo_aguja_${i}`, type: 'rebuildGap', x: p.x, y: p.y, flag: 'b17_aguja', tiles, tutorial: true, blockedText: MESA_TEXT.gapBlocked,
    })),
    { id: 'pared_alto_sube', type: 'climbWall', x: CLIMB.up.x, y: CLIMB.up.y, to: [...CLIMB.top], h: 3 },
    { id: 'pared_alto_baja', type: 'climbWall', x: CLIMB.down.x, y: CLIMB.down.y, to: [...CLIMB.bottom], down: true, glow: false },
  ];
}

function details() {
  return [
    { id: 'cartel_mesa', type: 'sign', ...SPOTS.sign, text: MESA_TEXT.sign, skin: 'sign hgss dir' },
    examine('campana_vientos_0', SPOTS.bell.x, SPOTS.bell.y + 3, MESA_TEXT.bell),
    examine('campana_vientos_1', SPOTS.bell.x + 1, SPOTS.bell.y + 3, MESA_TEXT.bell),
    examine('puerta_cuidadores', BUILDINGS.cuidadores.door.x, BUILDINGS.cuidadores.door.y, MESA_TEXT.keepersDoor),
    examine('roca_deseo_0', WISH_ROCK.x, WISH_ROCK.y + 1, MESA_TEXT.wishRock),
    examine('roca_deseo_1', WISH_ROCK.x + 1, WISH_ROCK.y + 1, MESA_TEXT.wishRock),
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) })),
  ];
}

export function mesaEvents() {
  return [...keeperEvents(), ...herdEvents(), ...passageEvents(), ...details()];
}
