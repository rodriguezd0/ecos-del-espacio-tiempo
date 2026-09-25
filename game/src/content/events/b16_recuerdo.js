// El último espejo del Ala del Sentir: el día de Gael (docs/CAMPANA.md B16: «El jugador controla a Gael (controles en
// espejo) y revive su día del Laberinto (la escena oculta de B01: corre al laboratorio, pide permiso, Alerce dice
// «Esperaremos a la policía», y espera), luego la explanada del Umbral, donde Casilda no le deja pasar, y el aljibe que
// no le respondió»; §6.2 B16 «Empatía»). Mapa santuario_alma_recuerdo (`mirrorControls: true`).
//   · Controles en espejo: world.input se envuelve una vez con un Proxy que invierte izquierda y derecha SOLO mientras
//     el mapa actual tenga `mirrorControls` (así nunca se queda invertido fuera del recuerdo).
//   · El jugador lleva el aspecto de Gael (charsets) hasta que sale del recuerdo.
// Fases (var b16_recuerdo_fase): 0 laboratorio · 1 esperar · 2 explanada · 3 esperar fuera · 4 aljibe.
import { F, SPEAKER, SPRITE, lines, eventById, placePlayer, pause } from './b16_common.js';
import { LAB, ESPLANADA, ALJIBE, MIRROR_KEYS } from '../maps/b16/recuerdo_layout.js';
import { SENTIR } from '../maps/b16/santuario_layout.js';
import { setRiding } from '../../world/zygarde/mount.js';

export const PHASE_VAR = 'b16_recuerdo_fase';
export const RECUERDO_START = LAB.arrive;
const phase = (s) => Number(s.var(PHASE_VAR, 0)) || 0;
const inPhase = (n) => (s) => !s.flag(F.memory) && phase(s) === n;

export const RECUERDO_TEXT = Object.freeze({
  open: 'El laboratorio del Prof. Alerce, el día del Laberinto. Por la ventana llega un sonido grave que nadie más parece oír.',
  controls: 'Dentro del espejo, izquierda y derecha se invierten.',
  hint1: 'Gael corre hacia el profesor.',
  wait: 'Gael se aparta junto a la ventana. Espera.',
  waiting: 'Pasan los minutos. Luego, una hora. El sonido del Laberinto se apaga.',
  back: 'La puerta se abre. Vuelves tú, con el agente Olmedo… y algo que brilla en verde te sigue.',
  gaelLooks: 'Gael mira el brillo. No dice nada.',
  esplanada: 'La explanada del Umbral. Al fondo, bajo el dintel, una mujer mayor con una escoba.',
  pushed: 'Casilda no se mueve. Gael retrocede dos pasos.',
  bench: 'Gael se sienta en una piedra, fuera. Espera.',
  later: 'Al rato llegas tú, con el brillo verde a tu lado.',
  inside: 'Casilda te corta el paso, como a él. Pero el brillo se acerca al dintel, la piedra se enciende un instante… y Casilda entra contigo.',
  dusk: 'Al atardecer, una luz verde sale de la ruina y toma forma. Gael se levanta, la mira un momento y se va sin decir nada.',
  aljibe: 'El aljibe del Monte del Portal. La piedra está fría. El agua, quieta.',
  touch: 'Gael pone la mano sobre la piedra del aljibe.',
  nothing: 'Nada.',
  end: 'El espejo se empaña. El recuerdo se deshace.',
});

// ─────────────────────────────── Controles en espejo y aspecto de Gael ───────────────────────────────

/** Envuelve world.input (una sola vez) para invertir izquierda/derecha en los mapas con `mirrorControls`. */
export function installMirrorInput(world) {
  const base = world?.input;
  if (!base || base.__b16Mirror) return;
  world.input = new Proxy(base, {
    get(target, key) {
      if (key === '__b16Mirror') return true;
      if (key === 'dir4') {
        return () => {
          const d = target.dir4();
          return world.current?.def?.mirrorControls ? (MIRROR_KEYS[d] ?? d) : d;
        };
      }
      const v = target[key];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}

async function wearGael(ctx) {
  ctx.player.setCharsets({ walk: SPRITE.gael, run: SPRITE.gael, surf: SPRITE.gael });
}

async function restorePlayer(ctx) {
  try {
    const { playerCharsets } = await import('../../render/charsets.js');
    ctx.player.setCharsets(await playerCharsets(ctx.state.player.gender));
  } catch (err) {
    console.error('[B16] no se pudo recuperar el aspecto del jugador', err);
  }
}

/**
 * Baja de la montura del 10 % y espera a que world/zygarde/mount.js#syncMount devuelva al jugador su aspecto: si se
 * entrara al recuerdo montado, la sincronización de la montura (cada fotograma) repondría el aspecto guardado del
 * jugador DESPUÉS de ponerle el de Gael.
 */
export async function dismountForMemory(ctx) {
  const world = ctx.world;
  if (!world?.zygMount?.riding && !world?.zygMount?.form) return;
  setRiding(world, false);
  for (let i = 0; i < 10 && world.zygMount?.form; i++) await pause(ctx, 1);
}

/** Al entrar en el recuerdo (también al cargar una partida guardada dentro). */
export async function recuerdoOnEnter(ctx) {
  installMirrorInput(ctx.world);
  await dismountForMemory(ctx);
  await wearGael(ctx);
  if (phase(ctx.state) === 0 && !ctx.flag('b16_recuerdo_visto')) {
    ctx.setFlag('b16_recuerdo_visto');
    await pause(ctx, 20);
    await ctx.say(RECUERDO_TEXT.open);
    await ctx.say(RECUERDO_TEXT.controls);
  }
}

async function goTo(ctx, spot, next) {
  await ctx.fade('out', 30, [255, 236, 244]);
  ctx.setVar(PHASE_VAR, next);
  await placePlayer(ctx, spot.x, spot.y, spot.dir ?? 8, { fade: false });
  await pause(ctx, 10);
  await ctx.fade('in', 30);
}

// ─────────────────────────────── 1. El laboratorio ───────────────────────────────

async function askAlerce(ctx) {
  const A = SPEAKER.alerce;
  if (phase(ctx.state) >= 1) { await ctx.say('Esperaremos.', { speaker: A }); return; }
  await ctx.say('Profesor, el sonido viene del Laberinto. Llame a los Arenzana, pida permiso…', { speaker: SPEAKER.gael });
  const al = eventById(ctx, 'recuerdo_alerce');
  if (al) al.turnToward(ctx.player);
  await pause(ctx, 30);
  await ctx.say('No. Esperaremos a la policía.', { speaker: A });
  await pause(ctx, 40);
  await ctx.say('…', { speaker: SPEAKER.gael });
  await ctx.say(RECUERDO_TEXT.wait);
  ctx.setVar(PHASE_VAR, 1);
}

async function waitInLab(ctx) {
  await ctx.say(RECUERDO_TEXT.waiting);
  await ctx.fade('out', 40);
  await pause(ctx, 30);
  await ctx.fade('in', 40);
  await ctx.say('Ya vuelven.', { speaker: SPEAKER.lia });
  const me = ctx.world.spawnEvent?.({ id: 'recuerdo_protagonista', x: LAB.protagonist.x, y: LAB.protagonist.y, sprite: ctx.state.player.gender === 'F' ? SPRITE.protagonistF : SPRITE.protagonistM, dir: 8, through: true });
  const ol = ctx.world.spawnEvent?.({ id: 'recuerdo_olmedo', x: LAB.olmedo.x, y: LAB.olmedo.y, sprite: SPRITE.olmedo, dir: 8, through: true });
  const glow = me ? ctx.effect?.('softLight', { x: me.x, y: me.y, radius: 40, color: [185, 255, 102], intensity: 0.6, pulse: 0.5, fadeIn: 10 }) : null;
  ctx.se('Door enter');
  await ctx.say(RECUERDO_TEXT.back);
  ctx.face('player', { x: LAB.protagonist.x, y: LAB.protagonist.y });
  await pause(ctx, 30);
  await ctx.say(RECUERDO_TEXT.gaelLooks);
  glow?.remove?.(20);
  if (me) ctx.world.removeEvent?.(me);
  if (ol) ctx.world.removeEvent?.(ol);
  await ctx.say(RECUERDO_TEXT.esplanada);
  await goTo(ctx, ESPLANADA.arrive, 2);
}

function labEvents() {
  return [
    {
      id: 'recuerdo_alerce', x: LAB.alerce.x, y: LAB.alerce.y, name: SPEAKER.alerce,
      pages: [{ sprite: SPRITE.alerce, dir: LAB.alerce.dir, move: 'still', script: askAlerce }],
    },
    {
      id: 'recuerdo_lia', x: LAB.lia.x, y: LAB.lia.y, name: SPEAKER.lia,
      pages: [{
        sprite: SPRITE.lia, dir: LAB.lia.dir, move: 'look',
        script: (ctx) => lines(ctx, SPEAKER.lia, [phase(ctx.state) >= 1 ? 'El profesor sabrá lo que hace, Gael.' : '¿Tú también lo oyes? Yo creía que era el viento.']),
      }],
    },
    {
      id: 'recuerdo_ventana', x: LAB.wait.x, y: LAB.wait.y, trigger: 'touch', through: true,
      when: inPhase(1), script: waitInLab,
    },
    {
      id: 'recuerdo_puerta', x: LAB.door.x, y: LAB.door.y + 1,
      pages: [{ trigger: 'touch', script: async (ctx) => { await ctx.say(phase(ctx.state) >= 1 ? 'Gael mira la puerta. No sale.' : 'Gael no ha venido a irse. Ha venido a pedir permiso.'); } }],
    },
  ];
}

// ─────────────────────────────── 2. La explanada del Umbral ───────────────────────────────

async function casildaBlocks(ctx) {
  const C = SPEAKER.casilda;
  const cas = eventById(ctx, 'recuerdo_casilda');
  if (cas) cas.turnToward(ctx.player);
  await ctx.say('Aquí no entra nadie a hacer turismo.', { speaker: C });
  await ctx.say('No vengo de turismo. He oído algo ahí dentro.', { speaker: SPEAKER.gael });
  await ctx.say('Yo oigo cosas todas las noches. Son piedras, muy viejas, nada más. Fuera.', { speaker: C });
  await ctx.move('player', ['direction_fix_on', 'down', 'down', 'direction_fix_off'], { through: false });
  await ctx.say(RECUERDO_TEXT.pushed);
  ctx.setVar(PHASE_VAR, 3);
  await ctx.say('Gael busca un sitio donde esperar.');
}

async function waitOutside(ctx) {
  await ctx.say(RECUERDO_TEXT.bench);
  await ctx.fade('out', 40);
  await pause(ctx, 20);
  await ctx.fade('in', 40);
  // B02: «Explanada: Gael espera fuera. "Llegué antes. No me ha dejado pasar."» (se lo dice al protagonista al llegar)
  await ctx.say(RECUERDO_TEXT.later);
  await ctx.say('Llegué antes. No me ha dejado pasar.', { speaker: SPEAKER.gael });
  await ctx.say(RECUERDO_TEXT.inside);
  await ctx.fade('out', 30, [255, 190, 120]);
  await pause(ctx, 20);
  await ctx.fade('in', 30);
  const burst = ctx.effect?.('zygardeHexBurst', { x: ESPLANADA.glow.x, y: ESPLANADA.glow.y, mode: 'in', count: 30, spread: 2.5 });
  ctx.se('core_signal', { volume: 60 });
  await ctx.flash([185, 255, 102], 20, 160);
  await ctx.say(RECUERDO_TEXT.dusk);
  burst?.remove?.(30);
  await ctx.say(RECUERDO_TEXT.aljibe);
  await goTo(ctx, ALJIBE.arrive, 4);
}

function esplanadaEvents() {
  const E = ESPLANADA;
  return [
    {
      id: 'recuerdo_casilda', x: E.casilda.x, y: E.casilda.y, name: SPEAKER.casilda,
      pages: [{
        sprite: SPRITE.casilda, dir: E.casilda.dir, move: 'still', solid: true,
        script: async (ctx) => {
          if (phase(ctx.state) === 2) await casildaBlocks(ctx);
          else await ctx.say('Fuera.', { speaker: SPEAKER.casilda });
        },
      }],
    },
    ...[-1, 0, 1].map((dx) => ({
      id: `recuerdo_dintel_${dx + 1}`, x: E.front.x + dx, y: E.front.y, trigger: 'touch', through: true,
      when: inPhase(2), script: casildaBlocks,
    })),
    {
      id: 'recuerdo_piedra', x: E.bench.x, y: E.bench.y, trigger: 'touch', through: true,
      when: inPhase(3), script: waitOutside,
    },
  ];
}

// ─────────────────────────────── 3. El aljibe ───────────────────────────────

async function touchAljibe(ctx) {
  await ctx.say(RECUERDO_TEXT.touch);
  await pause(ctx, 40);
  await ctx.say(RECUERDO_TEXT.nothing);
  await ctx.say('Contéstame.', { speaker: SPEAKER.gael });
  await pause(ctx, 60);
  await ctx.say(RECUERDO_TEXT.nothing);
  await ctx.say('…Ya.', { speaker: SPEAKER.gael });
  await pause(ctx, 30);
  await ctx.say(RECUERDO_TEXT.end);
  await ctx.fade('out', 40, [255, 236, 244]);
  ctx.setFlag(F.memory);
  ctx.setVar(PHASE_VAR, 5);
  await restorePlayer(ctx);
  const a = SENTIR.mesprit.arrive;
  await ctx.warp('santuario_alma', a.x, a.y, 8, { fade: false });
  await ctx.fade('in', 40);
}

function aljibeEvents() {
  const A = ALJIBE;
  return [{
    id: 'recuerdo_aljibe', x: A.front.x, y: A.front.y - 1, name: 'Aljibe',
    pages: [{ solid: true, trigger: 'action', script: async (ctx) => {
      if (phase(ctx.state) === 4) await touchAljibe(ctx);
      else await ctx.say(RECUERDO_TEXT.aljibe);
    } }],
  }];
}

export function recuerdoEvents() {
  return [...labEvents(), ...esplanadaEvents(), ...aljibeEvents()];
}

/** Por si se sale del recuerdo por otro camino: el aspecto del jugador vuelve (lo llama el santuario al entrar). */
export async function ensurePlayerLooksLikePlayer(ctx) {
  const walk = ctx.player?.charsets?.walk;
  if (walk === SPRITE.gael) await restorePlayer(ctx);
}
