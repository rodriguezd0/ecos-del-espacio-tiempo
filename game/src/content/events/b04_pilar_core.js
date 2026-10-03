// Núcleo del Pilar de la Corriente (CAMPANA B04): la corriente al cerrar el ciclo, el combate con Leandro en la isla
// (reintento: se le vuelve a hablar), la restauración (ctx.story.restorePillar(2): Fragmento 2, verso II, flag
// p2_restored), la lectura del verso con Leandro, la inscripción junto al verso (T02 segunda pista, T03) y la
// despedida («Mañana, en la plaza»). Líneas literales de CAMPANA marcadas con «».
import { CORE as LANDING, SPOTS } from '../maps/b04/pilar_corriente_layout.js';
import { CORE, SUMMIT } from '../maps/b04/pilar_corriente_floors.js';
import { pilarTone } from '../stamps/pilar.js';
import { setCycleHandler } from './b04_pilar_puzzle.js';
import { CYCLE_FLAG } from './b04_hydraulics.js';
import { F, SPEAKER, SPRITE, SAY_CORE, kid } from './b04_common.js';
import { bossBattle } from '../common/bossBattle.js';
import { walkEventTo } from './b01_town_path.js';

const L = { speaker: SPEAKER.leandro };
const BLUE = [72, 136, 232];
const coreTile = { x: CORE.x, y: CORE.y };

/** Textos de la escena (los no literales de CAMPANA son DECIDIDO-DEV y se listan en el README del bloque). */
export const CORE_TEXT = Object.freeze({
  cycle: 'El agua da la vuelta entera: baja de E1 a E6 y la noria la devuelve arriba. Por los canales corre una luz azul hasta el centro de la sala.',
  cycleLeandro: '…Ha dado la vuelta. La Escalera entera. Mi abuelo decía que eso no lo había visto nadie.',
  bridge: 'Del foso central suben unas losas de piedra y forman un paso hasta la escalera del piso superior.',
  challenge: (s) => [
    'La Escalera te ha hecho caso. A mí, en semanas, no me ha hecho ni una vez.',
    `Mi familia lleva trescientos años cuidando este Pilar. No me aparto de este núcleo sin ver de qué pasta estás ${s?.player?.gender === 'F' ? 'hecha' : 'hecho'}.`,
    'En el rellano te dije que vería si sabes dónde pisas. Esto es lo que falta. ¡Adelante!',
  ],
  win: 'Adelante. El núcleo es tuyo… o del río, qué sé yo.',
  lose: 'Otra vez. Y esta vez mira dónde pisas.',
  wait: 'Cuando quieras, vuelve a hablarme. No me voy a ninguna parte.',
  verseCore: '…El agua… olvidará su cauce.',
  verseLeandro: '«El agua olvidará su cauce.» Eso es lo que lleva pasando en Caudal todo el mes. De día se sale y de noche se esconde.',
  river: 'Muy por encima, a través de la roca, el rumor del Albo cambia de tono. Se vuelve hondo y tranquilo.',
  quote: 'Trescientos años girando llaves… y el río solo necesitaba que alguien lo escuchara.',
  inscriptionIntro: 'Junto al verso hay más glifos, más pequeños. La Pokédex los traduce a trozos:',
  t02: '«La segunda tabla gira donde el agua trabaja.»',
  t03: '«La tercera tabla llama al rayo desde lo alto.»',
  sixto: '¿El rayo? En Brontia, el viejo Sixto, el campanero, jura que cada noche le cae uno en el campanario. Sin tormenta. Medio pueblo se ríe de él.',
  farewell: 'Vuelve a Caudal. Mañana, en la plaza. …No me hagas repetirlo.',
  coreAfter: 'El núcleo late con una luz azul tranquila. El agua de la Escalera corre a su alrededor.',
  coreIdle: 'Un zócalo hexagonal en el centro de la cámara, seco y frío. A su alrededor, un foso de agua quieta.',
});

// ───────────────────────────── La corriente (ciclo cerrado) ─────────────────────────────

async function cycleScene(ctx) {
  if (ctx.flag(F.restored)) {
    await ctx.say('La corriente vuelve a recorrer la Escalera de punta a punta.');
    return;
  }
  ctx.se('PRSFX- Surf', { volume: 90 });
  await ctx.shake(4, 6, 40);
  await ctx.flash(BLUE, 24, 160);
  const glow = ctx.effect('softLight', { x: LANDING.x, y: LANDING.y, radius: 110, color: BLUE, intensity: 0.7, pulse: 0.4, fadeIn: 40 });
  await ctx.say(CORE_TEXT.cycle);
  await ctx.camera.pan(LANDING.x, LANDING.y - 2, 50);
  ctx.se('Anim/Saint7');
  await ctx.wait(20);
  await ctx.say(CORE_TEXT.bridge);
  // Leandro sube primero; el jugador lo encontrará junto al núcleo en el tercer piso.
  await ctx.say(CORE_TEXT.cycleLeandro, L);
  ctx.requestRefresh();
  await ctx.wait(20);
  await ctx.camera.reset(40);
  glow?.remove?.(60);
}
setCycleHandler(cycleScene);

// ───────────────────────────── Leandro en la isla ─────────────────────────────

export async function leandroBattle(ctx) {
  const ev = ctx.world.events.find((e) => e.id === 'leandro_isla');
  if (ev) ctx.face(ev, ctx.player);
  if (!ctx.flag(F.leandroBeaten) && !ctx.var('b04_leandro_intentos', 0)) {
    for (const line of CORE_TEXT.challenge(ctx.state)) await ctx.say(line, L);
  } else {
    await ctx.say('¿Otra vez? Bien. Así se aprende a llevar un río.', L);
  }
  // Combate de guion (content/common/bossBattle.js): sin pérdida de dinero ni punto de cura; al perder se cura sin
  // moverse de la isla («Reintento: se le vuelve a hablar», CAMPANA B04).
  const outcome = await bossBattle(ctx, { trainer: 'leandro' }, null, {
    onLose: (c) => c.setVar('b04_leandro_intentos', c.var('b04_leandro_intentos', 0) + 1),
    loseText: [CORE_TEXT.lose, CORE_TEXT.wait],
    speaker: SPEAKER.leandro,
  });
  if (outcome === 'win') {
    ctx.setFlag(F.leandroBeaten);
    await ctx.say(CORE_TEXT.win, L);
    // Se aparta a un lado del zócalo (a su derecha está la estela: por eso baja un paso).
    if (ev) await ctx.move(ev, ['down', 'turn_left'], { through: false });
    return true;
  }
  return false;
}

// ───────────────────────────── Restauración y verso ─────────────────────────────

async function readInscription(ctx, leandro = true) {
  await ctx.say(CORE_TEXT.inscriptionIntro);
  await ctx.say(CORE_TEXT.t02);
  await ctx.story.advanceClue('T02', 2);
  await ctx.say(CORE_TEXT.t03);
  if (leandro) await ctx.say(CORE_TEXT.sixto, L);
  await ctx.story.openClue('T03');
  ctx.setFlag(F.inscription);
}

async function onRestored(ctx) {
  // Zygarde habla muy poco (autor, 25-09-2026): solo la lectura del verso II (CAMPANA: «Core y Leandro»).
  await ctx.say(CORE_TEXT.verseCore, SAY_CORE);
  const ev = ctx.world.events.find((e) => e.id === 'leandro_isla');
  if (ev) { ctx.face(ev, coreTile); await ctx.emote(ev, '!'); }
  await ctx.say(CORE_TEXT.verseLeandro, L);
  ctx.se('PRSFX- Surf', { volume: 60 });
  await ctx.shake(2, 4, 30);
  await ctx.say(CORE_TEXT.river);
  await ctx.tone(pilarTone('P2', 0.45), 60);
  if (ev) ctx.face(ev, ctx.player);
  await ctx.say(CORE_TEXT.quote, L);
}

export async function restoreScene(ctx) {
  ctx.face('player', coreTile);
  const ok = await ctx.story.restorePillar(2, { core: coreTile, onRestored });
  if (!ok) return false;
  await readInscription(ctx, true);
  const ev = ctx.world.events.find((e) => e.id === 'leandro_isla');
  if (ev) ctx.face(ev, ctx.player);
  await ctx.say(CORE_TEXT.farewell, L);
  if (ev) {
    await walkEventTo(ctx, 'leandro_isla', SUMMIT.down.x, SUMMIT.down.y, { speed: 4, fallback: false });
    ctx.setFlag(F.leandroGone);
  } else {
    ctx.setFlag(F.leandroGone);
  }
  return true;
}

async function coreScript(ctx) {
  if (ctx.flag(F.restored)) {
    await ctx.say(CORE_TEXT.coreAfter);
    return;
  }
  if (!ctx.flag(CYCLE_FLAG)) { await ctx.say(CORE_TEXT.coreIdle); return; }
  if (!ctx.flag(F.leandroBeaten)) {
    await leandroBattle(ctx);
    return;
  }
  await restoreScene(ctx);
}

async function inscriptionScript(ctx) {
  if (!ctx.flag(F.restored)) {
    await ctx.say('Una estela con glifos Unown. Al lado del hexágono central hay un hueco liso, como si esperara algo.');
    return;
  }
  await ctx.say('La estela brilla con el verso del Pilar: «el agua olvidará su cauce,».');
  await readInscription(ctx, false);
}

/** Eventos del núcleo: Leandro en la isla, el núcleo y la estela del verso. */
export function coreEvents() {
  const onIsland = (s) => (s.flag(CYCLE_FLAG) || s.flag(F.restored)) && !s.flag(F.leandroGone);
  const beaten = (s) => s.flag(F.leandroBeaten);
  return [
    {
      id: 'leandro_isla', x: CORE.leandro.x, y: CORE.leandro.y,
      pages: [
        { when: (s) => onIsland(s) && !beaten(s), sprite: SPRITE.leandro, dir: CORE.leandro.dir, trigger: 'action', script: leandroBattle },
        { when: (s) => onIsland(s) && beaten(s), sprite: SPRITE.leandro, dir: 4, trigger: 'action', script: async (ctx) => { await ctx.say(ctx.flag(F.restored) ? CORE_TEXT.farewell : CORE_TEXT.win, L); } },
      ],
    },
    // Al pisar la isla por el puente, Leandro reta al jugador.
    ...CORE.arrive.map(([x, y]) => ({
      id: `isla_llegada_${x}`, x, y, trigger: 'auto',
      when: (s) => onIsland(s) && !beaten(s) && !s.var('b04_leandro_intentos', 0),
      script: leandroBattle,
    })),
    {
      id: 'nucleo', x: CORE.x, y: CORE.y, trigger: 'action', script: coreScript,
      pages: [
        { when: (s) => !s.flag(F.restored), solid: true, trigger: 'action', script: coreScript, glow: { name: 'softLight', radius: 70, intensity: 0.35, pulse: 0.3, color: BLUE } },
        { when: (s) => s.flag(F.restored), solid: true, trigger: 'action', script: coreScript, glow: { name: 'softLight', radius: 110, intensity: 0.55, pulse: 0.2, color: BLUE } },
      ],
    },
    { id: 'estela_verso', x: CORE.inscriptionEvent.x, y: CORE.inscriptionEvent.y, solid: true, trigger: 'action', script: inscriptionScript },
  ];
}

/** Posición de Leandro en el rellano (para la escena del reto): la usa b04_pilar.js. */
export const LEANDRO_LANDING = SPOTS.leandro;
/** Texto de «chaval/chavala» para las líneas que lo usan. */
export const kidOf = kid;
