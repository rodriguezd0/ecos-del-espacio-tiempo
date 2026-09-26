// Cámara de Geodude y Cámara de la Guardiana (CAMPANA B02, mazmorra 3–4; D08): el Geodude encajado en una grieta
// desde los temblores (se saca manteniendo pulsado A), rompe la roca que corta el túnel y ofrece acompañarte
// (regalo opcional nv 8; si se rechaza, espera en la cámara). Casilda te detiene ante el Núcleo: combate.
import { F, SPEAKER, SPRITE, when, say, strip, fx } from './b02_common.js';
import { ROOM, placeCasilda, setRoom, casildaRoom } from './b02_ruinas_casilda.js';
import { CAMARA, TUNNEL, ANTESALA } from '../maps/b02/ruinas_dintel_layout.js';
import { GEODUDE_GIFT } from '../encounters/b02.js';

const C = SPEAKER.casilda;
/** Fotogramas que hay que mantener pulsado A para sacar al Geodude (≈1,5 s) y espera máxima (≈12 s). */
export const PULL_FRAMES = 90;
const PULL_TIMEOUT = 720;
/** Casilla donde espera el Geodude tras romper la roca (si aún no te acompaña). */
export const GEODUDE_WAIT = Object.freeze({ x: 8, y: 8, dir: 4 });

// ─── Geodude ─────────────────────────────────────────────────────────────────────────────────────

async function camaraScene(ctx) {
  setRoom(ctx, ROOM.camara);
  await ctx.wait(10);
  ctx.face('casilda', 'left');
  await say(ctx, C, 'Toda una vida limpiando la galería, y no sabía que detrás había una sala.');
  await ctx.emote('casilda', '!');
  await say(ctx, C, 'Escucha. Por eso se oía rascar por las noches.');
  await showScratching(ctx);
  ctx.setFlag(F.camara);
}

/** Frases de guía de la cámara (DECIDIDO autor 25-09-2026: tras el puzzle no se sabía cómo seguir). */
export const CAMARA_HINT = Object.freeze({
  scene: 'Ahí, en la grieta del fondo. Hay algo atascado.',
  talk: 'Lo que rasca está en la grieta del fondo, al oeste. Sácalo de ahí si puedes.',
  rock: 'Haría falta alguien que sepa de piedras.',
  pullFailed: 'El Geodude sigue atascado. Mantén pulsado A, sin soltarlo, para tirar de él.',
});

/**
 * La cámara enseña de dónde sale el ruido: la grieta del oeste con el Geodude (sala oscura y grande: sin esto el
 * jugador no lo encontraba). Solo mientras sigue atascado.
 */
export async function showScratching(ctx) {
  if (ctx.flag(F.geodudeFree)) return;
  ctx.se('Strength push');
  await ctx.camera.pan(CAMARA.pull.x + 3, CAMARA.geodude.y + 1, 40);
  ctx.cry('GEODUDE');
  await ctx.emote('geodude', '…');
  await ctx.wait(20);
  await say(ctx, C, CAMARA_HINT.scene);
  await ctx.camera.reset(30);
}

/**
 * Tirar del Geodude manteniendo pulsado A (CAMPANA: «interacción A mantenido»). Sin entrada (Node) se da por
 * hecho. Devuelve true si salió.
 */
export async function holdToPull(ctx, frames = PULL_FRAMES) {
  const input = ctx.world?.input;
  if (!input || typeof input.held !== 'function') return true;
  let held = 0;
  for (let t = 0; t < PULL_TIMEOUT; t++) {
    if (input.held('A')) {
      held += 1;
      if (held % 20 === 1) { ctx.se('Strength push'); ctx.shake(1, 9, 12); }
      if (held >= frames) return true;
    } else if (held > 0) {
      held = Math.max(0, held - 2);
    }
    await ctx.wait(1);
  }
  return false;
}

async function pullGeodude(ctx) {
  await ctx.say('Un Geodude encajado en una grieta de la pared. Se revuelve, pero no puede salir.');
  if (!(await ctx.confirm('¿Intentas sacarlo?'))) return;
  await ctx.say('Agárralo bien y mantén pulsado A para tirar.');
  const ok = await holdToPull(ctx);
  if (!ok) { await ctx.say(CAMARA_HINT.pullFailed); return; }
  ctx.se('PRSFX- Rock Smash');
  await ctx.shake(4, 8, 16);
  await ctx.move('player', ['backward'], { through: false });
  await ctx.jump('this', 1, 0);
  ctx.cry('GEODUDE');
  await ctx.emote('this', '♪');
  ctx.setFlag(F.geodudeFree);
  await ctx.say('¡El Geodude ha salido de la grieta!');
  await breakRock(ctx);
}

/** El Geodude, agradecido, rompe la roca que corta el túnel hacia la sala de la Guardiana (D08). */
async function breakRock(ctx) {
  const geo = ctx.world?.events?.find((e) => e.id === 'geodude');
  await ctx.emote('geodude', '!');
  ctx.face('geodude', 'right');
  await ctx.say('El Geodude mira hacia el túnel del este, tapado por una roca.');
  await ctx.fade('out', 12);
  geo?.moveTo(TUNNEL.rock.x - 1, TUNNEL.rock.y);
  if (geo) geo.direction = 6;
  await ctx.camera.pan(TUNNEL.rock.x, TUNNEL.rock.y + 2, 1);
  await ctx.fade('in', 12);
  await ctx.wait(20);
  await ctx.move('geodude', ['backward', { wait: 6 }, 'forward'], { through: false, speed: 4.5 });
  ctx.se('Rock Smash');
  const dust = fx(ctx, 'zygardeHexBurst', { x: TUNNEL.rock.x, y: TUNNEL.rock.y, mode: 'out', count: 10, color: [220, 210, 190] });
  await ctx.shake(6, 9, 18);
  const rock = ctx.world?.events?.find((e) => e.id === 'roca_tunel');
  if (rock) {
    rock.directionFix = false; rock.walkAnime = false; rock.lockPattern = true; rock.pattern = 0;
    for (const dir of [4, 6, 8]) { rock.direction = dir; await ctx.wait(5); }
    for (let i = 0; i <= 10; i++) { rock.opacity = 255 - i * 25; await ctx.wait(1); }
  }
  dust?.remove?.(20);
  ctx.setFlag(F.rockBroken);
  await ctx.wait(20);
  await ctx.fade('out', 12);
  geo?.moveTo(GEODUDE_WAIT.x, GEODUDE_WAIT.y);
  if (geo) geo.direction = GEODUDE_WAIT.dir;
  await ctx.camera.reset(1);
  await ctx.fade('in', 12);
  if (casildaRoom(ctx.state) === ROOM.camara) {
    await say(ctx, C, 'La sala de guardia. La conozco del otro lado: esa roca cayó con los temblores.');
    await say(ctx, C, 'Te espero allí.');
    await ctx.fade('out', 10);
    setRoom(ctx, ROOM.guardiana);
    await ctx.fade('in', 10);
  }
  await offerGeodude(ctx);
}

/** El Geodude ofrece acompañarte (regalo opcional, nv 8). Si se rechaza, espera en la cámara. */
async function offerGeodude(ctx) {
  ctx.turnToPlayer('geodude');
  ctx.cry('GEODUDE');
  await ctx.say('El Geodude te mira sin moverse. Parece que quiere ir contigo.');
  if (!(await ctx.confirm('¿Quieres que el Geodude te acompañe?'))) {
    await ctx.say('El Geodude se queda en la cámara. Parece dispuesto a esperar.');
    return;
  }
  await ctx.givePokemon({ ...GEODUDE_GIFT });
  ctx.setFlag(F.geodudeGift);
}

/** Recoloca al Geodude al entrar en el mapa (espera junto a la grieta tras romper la roca). */
export function placeGeodude(ctx) {
  const ev = ctx.world?.events?.find((e) => e.id === 'geodude');
  if (!ev || !ctx.flag(F.rockBroken) || ctx.flag(F.geodudeGift)) return;
  ev.moveTo(GEODUDE_WAIT.x, GEODUDE_WAIT.y);
  ev.direction = GEODUDE_WAIT.dir;
}

// ─── La Guardiana ────────────────────────────────────────────────────────────────────────────────

/** Configuración del combate (sin derrota: el reintento lo gestiona el guion). */
export function guardianBattleConfig() {
  return { type: 'trainer', trainer: 'b02_casilda', canLose: true, rules: { canLose: true, noMoneyLoss: true, canRun: false, canCatch: false } };
}

/** Casilda te detiene ante el paso al Núcleo y combate (CAMPANA B02). */
export async function guardianBattle(ctx) {
  placeCasilda(ctx);
  ctx.face('player', ctx.directionTo(ctx.player, ctx.world.events.find((e) => e.id === 'casilda') || ctx.player));
  await ctx.emote('casilda', '…');
  await ctx.approach('casilda');
  await say(ctx, C, 'Hasta aquí te he traído. Detrás está la sala de la caja.');
  await say(ctx, C, 'Si esto va a despertar por alguien, que sea por alguien capaz de defenderlo.');
  let outcome = 'win';
  try {
    outcome = await ctx.battle(guardianBattleConfig());
  } catch (err) {
    console.error('[b02] combate con Casilda', err);
  }
  if (outcome !== 'win') {
    ctx.setFlag(F.casildaLost);
    await ctx.warp('ruinas_dintel', ANTESALA.heal.x, ANTESALA.heal.y, 4);
    return;
  }
  ctx.setFlag(F.casildaBeaten);
  await say(ctx, C, 'Bien. Con cabeza.');
  await say(ctx, C, 'Toma. Es lo que yo llevaría encima para bajar aquí.');
  await ctx.giveItem('POTION', 3);
  await ctx.giveItem('ESCAPEROPE');
  await say(ctx, C, 'Pasa. Yo voy detrás.');
  await ctx.move('casilda', ['right', 'right'], { through: false });
  await ctx.fade('out', 10);
  setRoom(ctx, ROOM.nucleo);
  await ctx.fade('in', 10);
}

function geodudeEvents() {
  return [
    { id: 'grieta', x: CAMARA.crack.x, y: CAMARA.crack.y, sprite: SPRITE.crack, dir: 2, directionFix: true, walkAnime: false, through: true },
    {
      id: 'geodude', x: CAMARA.geodude.x, y: CAMARA.geodude.y, name: 'Geodude',
      pages: [
        { when: (s) => !s.flag(F.geodudeFree), sprite: SPRITE.geodude, dir: 2, stepAnime: true, speed: 4, trigger: 'action', script: pullGeodude },
        { when: (s) => s.flag(F.geodudeFree) && !s.flag(F.geodudeGift), sprite: SPRITE.geodude, dir: 2, stepAnime: true, speed: 3, trigger: 'action', script: offerGeodude },
        { when: (s) => s.flag(F.geodudeGift) },
      ],
    },
    {
      id: 'roca_tunel', x: TUNNEL.rock.x, y: TUNNEL.rock.y, when: (s) => !s.flag(F.rockBroken), sprite: SPRITE.rock, dir: 2,
      directionFix: true, walkAnime: false, solid: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say('Una roca enorme tapa el túnel. No se mueve ni empujando con todas tus fuerzas.');
        if (!ctx.flag(F.geodudeFree)) await ctx.say(CAMARA_HINT.rock);
      },
    },
    ...strip('escena_camara', CAMARA.entry, { when: when({ all: [F.dinteles], none: [F.camara] }), script: camaraScene }),
    { id: 'piedra_dura', type: 'item', x: 20, y: 11, item: 'HARDSTONE' },
  ];
}

function guardianEvents() {
  const active = (s) => s.flag(F.rockBroken) && !s.flag(F.casildaBeaten) && !s.flag(F.casildaLost);
  return [
    ...strip('reto_guardiana', CAMARA.challenge, { when: active, script: guardianBattle }),
    { id: 'superpocion', type: 'item', x: 40, y: 7, item: 'SUPERPOTION', hidden: true },
  ];
}

/** Eventos de las dos cámaras. */
export function camaraEvents() {
  return [...geodudeEvents(), ...guardianEvents()];
}
