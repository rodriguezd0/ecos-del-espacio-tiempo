// Hito de la Forma Completa (docs/CAMPANA.md B16 «Hito de la Forma Completa»; §2.1; §3.1 fase 3): al salir del
// santuario tras restaurar el P8, el cielo se rompe (auroras, luna enorme, grietas; los lagos se hielan y hierven a la
// vez), el puente de hielo lleno de vecinos de Boreal se quiebra y Zygarde decide sostenerlo.
//   · Con 100 células y 5 núcleos: las células convergen en la FORMA COMPLETA (reachMilestone 'complete' sin escena
//     genérica), sostiene el puente, alza el primer hueco (demostración) y el jugador reconstruye el segundo: el primer
//     tutorial de Reconstrucción (tipo `rebuildGap` con `flag`, `tutorial` y `onRebuilt`). Los vecinos cruzan.
//   · Si faltan células: Zygarde sostiene el puente a medias hasta que todos cruzan (sin víctimas) y no puede formarse:
//     «Me faltan [n] partes. Las siento todas encendidas.» El hueco se queda con sus zócalos; el hito ocurre al recoger
//     la célula 100, con la escena corta genérica (world/zygarde/scenes.js + MEMORY_LINES.complete).
//   · Después, por radio, los Guardianes informan desde sus comarcas; Genesis se marcha con su registro; vuelve el
//     vínculo de los Pokémon del norte (la Snorunt de Marta).
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, zygardeSays, byGender, when, placePlayer, eventById, pause,
} from './b16_common.js';
import { BRIDGE, SANCTUARY, gapCells } from '../maps/b16/lagos_layout.js';
import { extraDefs } from '../stamps/extraTiles.js';
import { capabilityStatus } from '../../world/zygarde/progression.js';
import { numberWord } from '../zygarde/texts.js';

// ─────────────────────────────── Piedras de la Reconstrucción ───────────────────────────────

const Z = extraDefs('Exterior1').stamps;
const tileOf = (name) => Z[name]?.tiles?.layers?.[2]?.[0] || 0;
export const STONE = tileOf('pilar_zocalo');
export const STONE_LIVE = tileOf('pilar_zocalo_vivo');

/** Piedras que alza Zygarde en un hueco del puente ('A' | 'B'): capa 2, hexágono vivo en el centro. */
export const gapTiles = (gap) => Object.freeze(gapCells(gap).map(([x, y]) => Object.freeze([x, y, 2, x === BRIDGE.cx ? STONE_LIVE : STONE])));
/** El tramo de la orilla que se hunde (capas 1 y 2 vacías: queda el agua). */
const COLLAPSE = Object.freeze(gapCells('B').flatMap(([x, y]) => [[x, y, 1, 0], [x, y, 2, 0]]));

// Los lagos «se hielan y hierven a la vez» durante la escena: no se nada (getter `noSwim` de la definición del mapa).
let boiling = false;
export const lakesBoiling = () => boiling;
export function setLakesBoiling(on) { boiling = Boolean(on); }
/**
 * Al entrar en los Lagos (warp, Vuelo o cargar partida): el agua solo hierve entre la Forma Completa y el hueco B
 * (hito completo a medias). Así el estado del módulo nunca se queda pegado de otra partida o de otra visita.
 */
export function syncLakesBoiling(ctx) {
  setLakesBoiling(Boolean(ctx?.state?.flag(F.milestoneScene) && !ctx.state.flag(F.milestone)));
}

export const HITO_TEXT = Object.freeze({
  sky: 'El cielo se abre. Auroras de todos los colores corren sobre los lagos y la luna crece hasta ocupar medio cielo.',
  lakes: 'El agua cruje: se hiela en las orillas y hierve en el centro, a la vez. Un vapor blanco lo cubre todo.',
  cracks: 'Una grieta luminosa recorre el puente de hielo. El tramo de la orilla se hunde con un estruendo.',
  cracksPartial: 'Una grieta luminosa recorre el puente de hielo, de punta a punta.',
  converge: 'Todas las células convergen. Zygarde adopta la \\c[3]Forma Completa\\c[0].',
  unlock: 'Zygarde ha recuperado: \\c[3]Vuelo y Reconstrucción\\c[0].',
  holds: 'Una red de hexágonos verdes sujeta el hielo. El tramo de los vecinos ya no se mueve.',
  holdsPartial: 'Zygarde se enrosca bajo el puente. El hielo aguanta… a duras penas.',
  collapseAfter: 'En cuanto pisa la orilla el último vecino, el tramo se hunde en el agua hirviente.',
  boiling: 'El agua hierve. Por ahí no se puede nadar.',
  flyHint: 'Elige «Volar» en la pantalla de Zygarde (menú de pausa) para ir a un lugar que ya conozcas.',
  steam: 'El vapor se disipa poco a poco. El cielo, no.',
  // Zygarde habla muy poco (autor, 25-09-2026): lo que antes indicaba él es narración neutra.
  otherGap: 'Junto a la orilla queda otro hueco en el puente. Al borde, un zócalo con hexágonos gastados.',
  sockets: 'Los zócalos del puente roto siguen en su sitio, con sus hexágonos gastados.',
});

// ─────────────────────────────── Vecinos en el puente ───────────────────────────────

const VILLAGERS = Object.freeze([
  Object.freeze({ id: 'puente_marta', speaker: SPEAKER.marta, sprite: SPRITE.marta }),
  Object.freeze({ id: 'puente_anciano', speaker: SPEAKER.elder, sprite: SPRITE.elder }),
  Object.freeze({ id: 'puente_nino', speaker: SPEAKER.kid, sprite: SPRITE.kid }),
  Object.freeze({ id: 'puente_vecina', speaker: SPEAKER.neighborF, sprite: SPRITE.neighborF }),
]);

function villagerEvents() {
  return VILLAGERS.map((v, i) => {
    const p = BRIDGE.villagers[i];
    return {
      id: v.id, x: p.x, y: p.y, name: v.speaker,
      pages: [{
        when: when({ all: [F.restored], none: [F.milestone] }), sprite: v.sprite, dir: p.dir, move: 'still',
        script: async (ctx) => {
          if (ctx.flag(F.bridgeBroken) && !ctx.flag(F.bridgeB)) await ctx.say('¡No te pares! ¡El hielo cruje!', { speaker: v.speaker });
          else await ctx.say('Mira el cielo… nunca había visto una aurora así.', { speaker: v.speaker });
        },
      }],
    };
  });
}

/** Los vecinos bajan del puente a la orilla (en paralelo) y esperan a que lleguen todos. */
async function villagersCross(ctx) {
  const moves = [];
  VILLAGERS.forEach((v, i) => {
    const ev = eventById(ctx, v.id);
    if (!ev || !ev.page) return;
    const steps = Math.max(1, BRIDGE.y1 + 2 - BRIDGE.villagers[i].y);
    moves.push(ctx.move(ev, [...Array(steps).fill('down'), i % 2 ? 'right' : 'left'], { wait: false, through: true, speed: 4 }));
  });
  await Promise.all(moves);
}

// ─────────────────────────────── Zócalos y tramo hundido ───────────────────────────────

function socketEvents() {
  const S = BRIDGE.sockets;
  return [
    ...S.A.map((p, i) => ({
      id: `zocalo_a_${i}`, type: 'rebuildGap', x: p.x, y: p.y, flag: F.bridgeA, tiles: gapTiles('A'), tutorial: true,
    })),
    ...S.B.map((p, i) => ({
      id: `zocalo_b_${i}`, type: 'rebuildGap', x: p.x, y: p.y, flag: F.bridgeB, tiles: gapTiles('B'), tutorial: true,
      when: (s) => s.flag(F.bridgeBroken),
      onRebuilt: async (ctx) => { if (!ctx.flag(F.milestone)) await finishMilestone(ctx, { partial: false }); },
    })),
    {
      id: 'puente_hundido', x: BRIDGE.cx, y: BRIDGE.gapB.y0,
      pages: [{ when: when({ all: [F.bridgeBroken], none: [F.bridgeB] }), through: true, patch: COLLAPSE }],
    },
  ];
}

// ─────────────────────────────── Escena ───────────────────────────────

/** ¿Tiene ya Zygarde todo lo que necesita para la Forma Completa (células, núcleos y capacidades previas)? */
export function canBecomeComplete(state) {
  const s = capabilityStatus(state, 'fly');
  return s.unlocked || (s.cellsMissing === 0 && s.coresMissing.length === 0 && s.requiresMet);
}

async function skyBreaks(ctx) {
  ctx.bgm(MUSIC.crisis, { fadeOutPrevious: 20 });
  ctx.story.setCrisisPhase(2);
  await pause(ctx, 30);
  ctx.se('Thunder4');
  ctx.shake(7, 6, 50);
  await ctx.flash([236, 214, 255], 24, 220);
  ctx.story.setCrisisPhase(3);
  await pause(ctx, 50);
  await ctx.say(HITO_TEXT.sky);
  ctx.se('PRSFX- Icicle Crash1');
  await ctx.weather('fog', 4);
  setLakesBoiling(true);
  await ctx.say(HITO_TEXT.lakes);
}

async function bridgeCracks(ctx, { collapse }) {
  await ctx.camera.pan(BRIDGE.cx, BRIDGE.middle.y1, 50);
  const marta = eventById(ctx, 'puente_marta');
  if (marta) await ctx.emote(marta, '!');
  await ctx.say('¡El puente! ¡Se está partiendo!', { speaker: SPEAKER.marta });
  const crack = ctx.effect?.('cracks', { x: BRIDGE.cx, y: BRIDGE.gapB.y0, length: 150, branches: 4, seed: 8, color: [190, 140, 255], fadeIn: 20 });
  ctx.se('PRSFX- Earthquake');
  ctx.shake(8, 8, 40);
  await pause(ctx, 40);
  if (collapse) {
    ctx.se('Ice Smash');
    for (const [x, y, l, id] of COLLAPSE) ctx.setTile(x, y, l, id);
    ctx.setFlag(F.bridgeBroken);
    await ctx.say(HITO_TEXT.cracks);
    await ctx.say('¡No podemos volver!', { speaker: SPEAKER.elder });
  } else {
    await ctx.say(HITO_TEXT.cracksPartial);
  }
  crack?.remove?.(60);
}

/** La Forma Completa: las células convergen, Zygarde gigante sostiene el hielo y alza el primer hueco. */
async function completeForm(ctx) {
  const { reachMilestone } = await import('../../world/zygarde/scenes.js');
  const p = ctx.player;
  ctx.se('PRSFX- Healing Wish');
  const bursts = [[20, 30], [36, 30], [28, 42], [28, 20], [16, 38], [40, 38]].map(([x, y]) => ctx.effect?.('zygardeHexBurst', { x, y, mode: 'in', count: 26, spread: 3 }));
  await ctx.flash([185, 255, 102], 30, 220);
  await reachMilestone(ctx, 'complete', { scenes: false, sayMissing: false });
  ctx.scene?.refreshFollower?.();
  for (const b of bursts) b?.remove?.(30);
  // A la izquierda del puente: a la derecha lo taparía la luna de la crisis (efecto fijo arriba a la derecha).
  const giant = ctx.world.spawnEvent?.({ id: 'zygarde_completo', x: BRIDGE.x0 - 4, y: BRIDGE.middle.y1, sprite: OBJ.zygardeComplete, through: true, stepAnime: true, directionFix: true, dir: 2 });
  if (giant) giant.opacity = 0;
  for (let f = 0; f <= 20; f++) { if (giant) giant.opacity = Math.round((255 * f) / 20); await pause(ctx, 1); }
  ctx.cry('ZYGARDE', 2);
  await ctx.say(HITO_TEXT.converge);
  await zygardeSays(ctx, 'Nada me obliga. El mundo necesita que esté entero, y elijo estarlo.');
  ctx.me('key_item_get');
  await ctx.say(HITO_TEXT.unlock);
  const net = ctx.effect?.('softLight', { x: BRIDGE.cx, y: BRIDGE.middle.y0 + 2, radius: 110, color: [185, 255, 102], intensity: 0.7, pulse: 0.4, fadeIn: 20 });
  await ctx.say(HITO_TEXT.holds);
  await ctx.say('¡No se hunde! ¡Algo lo está sujetando!', { speaker: SPEAKER.kid });
  // Demostración: el hueco del islote (A) se alza solo.
  await ctx.camera.pan(BRIDGE.cx, BRIDGE.gapA.y0, 30);
  const { rebuildStones } = await import('../../world/zygarde/actions.js');
  await rebuildStones(ctx, gapTiles('A'));
  ctx.setFlag(F.bridgeA);
  await ctx.say(HITO_TEXT.otherGap);
  net?.remove?.(60);
  for (let f = 20; f >= 0; f--) { if (giant) giant.opacity = Math.round((255 * f) / 20); await pause(ctx, 1); }
  if (giant) ctx.world.removeEvent?.(giant);
  await ctx.camera.reset(30);
  ctx.face(p, 2);
}

/** Variante sin todas las células: sostiene a medias, los vecinos cruzan y el tramo se hunde después. */
async function partialForm(ctx) {
  const { reachMilestone } = await import('../../world/zygarde/scenes.js');
  ctx.se('PRSFX- Healing Wish');
  const burst = ctx.effect?.('zygardeHexBurst', { x: BRIDGE.cx, y: BRIDGE.middle.y1, mode: 'in', count: 18, spread: 2 });
  await ctx.flash([185, 255, 102], 20, 140);
  const { missing } = await reachMilestone(ctx, 'complete', { scenes: false, sayMissing: false });
  burst?.remove?.(20);
  const net = ctx.effect?.('softLight', { x: BRIDGE.cx, y: BRIDGE.middle.y1, radius: 70, color: [185, 255, 102], intensity: 0.45, pulse: 0.6, fadeIn: 20 });
  await ctx.say(HITO_TEXT.holdsPartial);
  await ctx.say('¡Corred! ¡A la orilla!', { speaker: SPEAKER.elder });
  await villagersCross(ctx);
  ctx.se('Ice Smash');
  for (const [x, y, l, id] of COLLAPSE) ctx.setTile(x, y, l, id);
  ctx.setFlag(F.bridgeBroken);
  await ctx.say(HITO_TEXT.collapseAfter);
  net?.remove?.(40);
  const n = Math.max(1, missing);
  await zygardeSays(ctx, `Me ${n === 1 ? 'falta una parte' : `faltan ${numberWord(n)} partes`}. Las siento todas encendidas.`);
  await ctx.camera.reset(30);
}

async function radioScene(ctx) {
  ctx.me('Register phone');
  await ctx.say('La radio de la observadora crepita desde la orilla. Es la frecuencia de los Guardianes: hablan todos a la vez.');
  await ctx.say('Aquí Leandro, en Caudal. El Albo sube sin una gota de lluvia. Cierro las esclusas; el barrio bajo, arriba.', { speaker: `${SPEAKER.leandro} (radio)` });
  await ctx.say('Abril, desde la Meseta. El viento ha perdido el rumbo otra vez. Estoy bajando a la gente del Anillo.', { speaker: `${SPEAKER.abril} (radio)` });
  await ctx.say('Fermín. Apuntalo la mina con los míos. Aguantará. Que nadie baje hasta que yo lo diga.', { speaker: `${SPEAKER.fermin} (radio)` });
  ctx.setFlag(F.radio);
}

async function genesisLeaves(ctx) {
  if (ctx.flag(F.genesis)) return;
  await ctx.say('Registro completo. Gracias por la demostración.', { speaker: SPEAKER.tecnica });
  await ctx.say('Los técnicos de Genesis recogen el trípode y las cajas y se alejan hacia el sur sin mirar atrás.');
  ctx.setFlag(F.genesis);
}

/** Final común: vecinos a salvo, vínculo, radio, Genesis, cielo en fase 3. */
async function finishMilestone(ctx, { partial }) {
  if (!partial) {
    await ctx.say('¡Ya está! ¡Todos a la orilla!', { speaker: SPEAKER.elder });
    await villagersCross(ctx);
  }
  await ctx.say(`¡Gracias, ${byGender(ctx.state, 'chico', 'chica')}! ¡Y a tu… a ese Pokémon!`, { speaker: SPEAKER.neighborF });
  ctx.setFlag(F.bond);
  ctx.cry('SNORUNT');
  await ctx.say('Desde la orilla llega un grito. La Snorunt de Marta ha corrido hacia ella y no la suelta.');
  await ctx.say('¡Me reconoce! ¡Me reconoce otra vez!', { speaker: SPEAKER.marta });
  await radioScene(ctx);
  await genesisLeaves(ctx);
  setLakesBoiling(false);
  await ctx.weather('none', 0);
  await ctx.say(HITO_TEXT.steam);
  ctx.story.setCrisisPhase(null); // la fase 3 ya es la derivada (p8_restored)
  if (partial) ctx.setFlag(F.milestonePartial);
  ctx.setFlag(F.milestone);
  ctx.bgm(MUSIC.lakes, { fadeOutPrevious: 30 });
  if (!partial && ctx.state.zygardeAbility('fly')) {
    await ctx.say(HITO_TEXT.flyHint);
    ctx.setFlag(F.flyHint);
  }
}

/** Escena de la salida (evento automático de los Lagos): del cielo roto al final del hito. */
export async function milestoneScene(ctx) {
  const out = SANCTUARY.out;
  if (ctx.player.x !== out.x || ctx.player.y !== out.y) await placePlayer(ctx, out.x, out.y, 2);
  ctx.face('player', 2);
  await skyBreaks(ctx);
  const complete = canBecomeComplete(ctx.state);
  await bridgeCracks(ctx, { collapse: complete });
  await zygardeSays(ctx, 'Si no me sostengo ahora, no habrá nada que sostener.');
  if (complete) {
    await completeForm(ctx);
    // El jugador termina el tutorial reconstruyendo el hueco de la orilla (zócalo B): finishMilestone en onRebuilt.
    await ctx.say(HITO_TEXT.boiling);
    ctx.setFlag(F.milestoneScene);
    return;
  }
  await partialForm(ctx);
  ctx.setFlag(F.milestoneScene);
  await finishMilestone(ctx, { partial: true });
}

/** Aviso (narración) al volver con la Forma Completa si el puente sigue roto (variante sin células). */
async function bridgeReminder(ctx) {
  ctx.setFlag('b16_puente_aviso');
  await ctx.say(HITO_TEXT.sockets);
}

export function hitoEvents() {
  return [
    ...villagerEvents(),
    ...socketEvents(),
    {
      id: 'hito_forma_completa', x: 0, y: 0,
      pages: [{ when: when({ all: [F.restored], none: [F.milestone, F.milestoneScene] }), trigger: 'auto', script: milestoneScene }],
    },
    {
      id: 'aviso_puente', x: 1, y: 0,
      pages: [{
        when: (s) => s.flag(F.milestone) && s.flag(F.milestonePartial) && s.zygardeAbility('rebuild') && !(s.flag(F.bridgeA) && s.flag(F.bridgeB)) && !s.flag('b16_puente_aviso'),
        trigger: 'auto', script: bridgeReminder,
      }],
    },
  ];
}
