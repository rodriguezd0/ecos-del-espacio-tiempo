// Regirock (docs/CAMPANA.md B22: «Cueva Sellada del Pico (Mina Galena) · Leer el relieve de los mineros con Fermín ·
// Nv 70»). Postgame (game_cleared):
//   1. Casa de los Galena (auto): Fermín cuenta que en la veta de cristal se ha desprendido la roca y ha dejado a la
//      vista un relieve tallado a pico; baja a la mina a esperarte.
//   2. Veta de cristal: el relieve (tres signos y dos flechas) y cuatro rocas con marcas de minero. Fermín lo lee: «la
//      roca se lee como se pica, de la boca al fondo» → al revés: pico, lámpara, vagoneta (b22d_logic.js). Se golpean
//      las rocas en ese orden; un error apaga el eco y se empieza otra vez (sin castigo).
//   3. La roca se abre: boca en la pared norte de la veta → Cueva Sellada del Pico (mina_galena_sellada) con Regirock.
// Mina Galena y la casa son mapas del B08: se añaden estos eventos con una línea (cambios mínimos y aditivos).
import {
  F, V, LEGENDS, SPEAKER, SPRITE, OBJ, MUSIC, postgame, when, lines, zygardeSays, pause, eventById, examine,
  legendPresent,
} from './b22d_common.js';
import { strikeRelief, RELIEF_ORDER, SIGN_DIR } from './b22d_logic.js';
import { legendBattle } from './b22d_battle.js';
import { HOOKS, PICO } from '../maps/b22d/layout.js';
import { stampPatch } from '../maps/b17/patch.js';
import CUEVA1 from '../stamps/baked/Cueva1.js';

const M = HOOKS.mina;
const FER = { speaker: SPEAKER.fermin };
const SIGN_NAME = Object.freeze({ pico: 'un pico', lampara: 'una lámpara', vagoneta: 'una vagoneta', casco: 'un casco' });

export const REGIROCK_TEXT = Object.freeze({
  home: [
    'Tú. Justo a quien quería ver.',
    'Desde que el cielo se calmó, la mina está tan quieta que se oyen cosas que antes tapaba el ruido.',
    'En la veta de cristal se ha desprendido una capa de roca. Debajo hay un relieve tallado a pico. Muy viejo.',
    'Mi abuelo hablaba de él. Lo llamaba «la puerta del pico». Decía que solo la abría quien supiera leer la roca.',
    'Yo sé leer la roca. A mi abuelo, no tanto. …Vamos juntos. Te espero en la veta.',
  ],
  relief: 'Un relieve tallado a pico en la roca. Tres signos en fila y, debajo, dos flechas que apuntan hacia la izquierda.',
  reliefFermin: 'Fermín está a tu lado, mirando el relieve con los brazos cruzados.',
  reliefRead: 'El relieve del pico: una vagoneta, una lámpara y un pico. Se lee al revés: pico, lámpara, vagoneta.',
  read: [
    'Aquí está. Mira: tres signos. Una vagoneta, una lámpara y un pico.',
    'Los picadores de antes marcaban así las rocas que había que golpear para abrir una galería sin que se viniera abajo.',
    'Y las flechas apuntan hacia la boca. Eso es de mi abuelo, seguro: «la roca se lee como se pica, de la boca al fondo».',
    'O sea, al revés de como lo miras: primero el pico, luego la lámpara y al final la vagoneta.',
    'Busca esos signos en las rocas de la veta y golpea en ese orden. Si te equivocas, la roca se calla. Se empieza otra vez y ya está.',
  ],
  again: 'Pico, lámpara, vagoneta. Y si la roca se calla, otra vez desde el pico.',
  markUnread: (sign) => `Una marca tallada en la roca: ${SIGN_NAME[sign]}. Parece muy antigua.`,
  markAsk: (sign) => `Una marca tallada en la roca: ${SIGN_NAME[sign]}. ¿Golpear la roca?`,
  echo: 'La roca responde con un eco hondo que se queda vibrando.',
  silent: 'Un golpe seco. La roca se calla… y los ecos de antes se apagan.',
  decoy: 'Un golpe seco. Esta marca es de otro minero: la roca no dice nada.',
  opening: '¡Eso es! ¿Lo oyes? La roca se está soltando por dentro.',
  opened: [
    'Cinco generaciones de Galena pasando por delante sin saberlo.',
    'Entra tú. Yo me quedo aquí, escuchando cómo respira la mina.',
  ],
  core: 'Ahí dentro duerme algo hecho de roca. Es más viejo que estas galerías.',
  waiting: 'Ahí dentro duerme algo que pesa más que toda la montaña. Ve con cuidado.',
  after: '¿Lo has visto? …No me lo cuentes. Hay cosas que es mejor seguir imaginando.',
  // Cueva Sellada del Pico
  arrive: 'Una galería sellada desde hace siglos. El aire huele a piedra que nadie ha tocado.',
  sleeping: 'Un coloso de roca, inmóvil sobre el estrado. En su cara hay siete puntos, apagados.',
  wake: 'Los puntos de su cara se encienden uno a uno. ¡El coloso se mueve!',
  gone: 'El estrado está vacío. En la roca quedan las marcas de sus pies.',
  stele: 'Una estela con glifos Unown.',
  steleRead: '«Roca soy. Hielo y acero son mis hermanos. El que nos dio forma duerme bajo la memoria.»',
  steleNoKey: 'Sin la Clave Glífica no entiendes los glifos.',
});

/** Fermín está fuera de casa (en la veta) mientras dura la búsqueda. Lo consulta la casa de los Galena (B08). */
export const ferminAway = (s) => Boolean(s) && postgame(s) && s.flag(F.ferminAsk) && !s.flag(LEGENDS.regirock.caught);

const readRelief = (s) => Boolean(s?.flag(F.reliefRead));
const open = (s) => Boolean(s?.flag(F.picoOpen));

// ───────────────────────────── casa de los Galena ─────────────────────────────

async function homeScene(ctx) {
  const fermin = eventById(ctx, 'fermin_casa');
  if (fermin) { ctx.face(fermin, ctx.player); await ctx.emote(fermin, '!'); }
  await lines(ctx, SPEAKER.fermin, REGIROCK_TEXT.home);
  await ctx.fade('out', 20);
  ctx.setFlag(F.ferminAsk);
  await pause(ctx, 20);
  await ctx.fade('in', 20);
}

/** Eventos que añade la casa de los Galena (estrato_casa_galena.js). */
export function b22dGalenaEvents() {
  return [{
    id: 'b22d_fermin_aviso', x: 0, y: 10, trigger: 'auto',
    when: (s) => postgame(s) && Boolean(s.flag('b08_cooperativa')) && !s.flag(F.ferminAsk), script: homeScene,
  }];
}

// ───────────────────────────── Mina Galena: relieve, marcas y Fermín ─────────────────────────────

async function reliefScript(ctx) {
  ctx.setFlag(F.reliefSeen);
  if (readRelief(ctx.state)) { await ctx.say(REGIROCK_TEXT.reliefRead); return; }
  await ctx.say(REGIROCK_TEXT.relief);
  if (ctx.flag(F.ferminAsk)) await ctx.say(REGIROCK_TEXT.reliefFermin);
}

async function ferminScript(ctx) {
  if (open(ctx.state)) { await ctx.say(REGIROCK_TEXT.waiting, FER); return; }
  if (readRelief(ctx.state)) { await ctx.say(REGIROCK_TEXT.again, FER); return; }
  const relief = eventById(ctx, 'b22d_relieve');
  ctx.face('player', 'up');
  await lines(ctx, SPEAKER.fermin, REGIROCK_TEXT.read.slice(0, 1));
  if (relief) { relief.direction = 4; relief.stepAnime = true; }
  await lines(ctx, SPEAKER.fermin, REGIROCK_TEXT.read.slice(1));
  if (relief) { relief.direction = 2; relief.stepAnime = false; }
  ctx.setFlag(F.reliefSeen);
  ctx.setFlag(F.reliefRead);
  ctx.setVar(V.reliefStep, 0);
}

async function openScene(ctx) {
  const relief = eventById(ctx, 'b22d_relieve');
  const fermin = eventById(ctx, 'b22d_fermin_relieve');
  ctx.se?.('Earth4', { volume: 80 });
  ctx.shake(4, 6, 50);
  if (fermin) { ctx.face(fermin, 'up'); await ctx.emote(fermin, '!'); }
  await ctx.say(REGIROCK_TEXT.opening, FER);
  await ctx.camera.pan(M.relief.x, M.relief.y, 30);
  if (relief) { relief.direction = 6; relief.stepAnime = true; }
  ctx.se?.('Rock Smash', { volume: 90 });
  await pause(ctx, 50);
  await ctx.flash([255, 240, 200], 16, 200);
  ctx.setFlag(F.picoOpen);
  ctx.setVar(V.reliefStep, 0);
  await pause(ctx, 20);
  await ctx.camera.reset(30);
  if (fermin) ctx.face(fermin, ctx.player);
  await lines(ctx, SPEAKER.fermin, REGIROCK_TEXT.opened);
  await zygardeSays(ctx, REGIROCK_TEXT.core);
}

function markScript(sign) {
  return async (ctx) => {
    if (!readRelief(ctx.state)) { await ctx.say(REGIROCK_TEXT.markUnread(sign)); return; }
    if (!(await ctx.confirm(REGIROCK_TEXT.markAsk(sign)))) return;
    ctx.se?.('Rock Smash', { volume: 80 });
    ctx.shake(2, 8, 10);
    await pause(ctx, 12);
    const res = strikeRelief(ctx.var(V.reliefStep, 0), sign);
    ctx.setVar(V.reliefStep, res.step);
    if (res.done) { await openScene(ctx); return; }
    if (res.ok) {
      ctx.se?.('PRSFX- Stealth Rocks', { volume: 60 });
      await ctx.say(REGIROCK_TEXT.echo);
      return;
    }
    await ctx.say(sign === 'casco' ? REGIROCK_TEXT.decoy : REGIROCK_TEXT.silent);
  };
}

/** Índice de un signo en el orden de golpeo (o -1 para el señuelo). */
const orderIndex = (sign) => RELIEF_ORDER.indexOf(sign);

function markEvents() {
  return M.marks.map((m) => {
    const lit = (s) => orderIndex(m.sign) >= 0 && Number(s.var(V.reliefStep, 0)) > orderIndex(m.sign);
    const base = { sprite: OBJ.marks, dir: SIGN_DIR[m.sign], pattern: 0, directionFix: true, walkAnime: false, stepAnime: false, shadow: false, solid: true, trigger: 'action', script: markScript(m.sign) };
    return {
      id: `b22d_marca_${m.sign}`, x: m.x, y: m.y, name: 'Marca de minero',
      pages: [
        { ...base, when: (s) => postgame(s) && !open(s) },
        { ...base, when: (s) => postgame(s) && !open(s) && lit(s), pattern: 1, stepAnime: true, speed: 2 },
      ],
    };
  });
}

/** Eventos que añade la Mina Galena (mina_galena.js). */
export function b22dMinaEvents() {
  const boca = stampPatch(CUEVA1, 'boca_norte', M.boca.x, M.boca.y);
  return [
    {
      id: 'b22d_relieve', x: M.relief.x, y: M.relief.y, name: 'Relieve',
      pages: [
        { when: (s) => postgame(s) && !open(s), sprite: OBJ.relief, dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: reliefScript },
        {
          when: open, patch: boca, through: true, trigger: 'touch',
          script: async (ctx) => {
            ctx.se?.('Door exit');
            await ctx.warp(PICO.id, PICO.arrive.x, PICO.arrive.y, PICO.arrive.dir);
          },
        },
      ],
    },
    {
      id: 'b22d_fermin_relieve', x: M.fermin.x, y: M.fermin.y, name: SPEAKER.fermin,
      pages: [{ when: ferminAway, sprite: SPRITE.fermin, dir: M.fermin.dir, move: 'look', trigger: 'action', script: ferminScript }],
    },
    ...markEvents(),
  ];
}

// ───────────────────────────── Cueva Sellada del Pico ─────────────────────────────

const REGIROCK_SPEC = Object.freeze({ species: 'REGIROCK', level: 70, moves: Object.freeze(['STONEEDGE', 'HAMMERARM', 'IRONDEFENSE', 'SUPERPOWER']) });

async function regirockScript(ctx) {
  ctx.face('player', 'up');
  await ctx.say(REGIROCK_TEXT.sleeping);
  const ev = eventById(ctx, 'regirock');
  if (ev) { ev.stepAnime = true; }
  ctx.cry('REGIROCK');
  ctx.shake(3, 6, 24);
  await ctx.say(REGIROCK_TEXT.wake);
  await legendBattle(ctx, 'regirock', REGIROCK_SPEC, { retry: { ...PICO.battle }, bgm: MUSIC.legend, battleback: 'CuevaOscura' });
}

/** Estela Unown (se lee con la Clave Glífica, que se tiene desde el P5). */
export function steleEvents(prefix, x, y, readText) {
  const script = async (ctx) => {
    await ctx.say(REGIROCK_TEXT.stele);
    await ctx.say(ctx.state.hasItem?.('GLYPHKEY') ? readText : REGIROCK_TEXT.steleNoKey);
  };
  return [0, 1].map((i) => ({ id: `${prefix}_${i}`, x: x + i, y: y + 1, trigger: 'action', noOver: true, script }));
}

/** Eventos del mapa mina_galena_sellada. */
export function picoEvents() {
  const R = PICO.regirock;
  return [
    {
      id: 'b22d_pico_llegada', x: 0, y: 0, trigger: 'auto', when: when({ none: ['b22d_pico_llegada'] }),
      script: async (ctx) => { ctx.setFlag('b22d_pico_llegada'); await ctx.say(REGIROCK_TEXT.arrive); },
    },
    {
      id: 'regirock', x: R.x, y: R.y, name: 'Regirock',
      pages: [
        { when: (s) => postgame(s), trigger: 'action', through: true, script: async (ctx) => { await ctx.say(REGIROCK_TEXT.gone); } },
        { when: (s) => legendPresent(s, 'regirock'), sprite: SPRITE.regirock, dir: R.dir, move: 'still', stepAnime: false, solid: true, trigger: 'action', script: regirockScript },
      ],
    },
    ...steleEvents('estela_pico', PICO.stele.x, PICO.stele.y, REGIROCK_TEXT.steleRead),
    ...PICO.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    examine('antorchas_pico', 20, 8, 'Soportes de hierro para antorchas, comidos por el óxido.', { solid: false }),
  ];
}

export { M as MINA_HOOK };
