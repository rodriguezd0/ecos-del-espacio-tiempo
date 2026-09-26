// Gael en el puente de entrada de Caudal (CAMPANA B03 punto 4, §6.2 «Orgullo herido», §6.3) y la llamada de
// Alerce por la Pokédex (B03 punto 5; §5.5 escalera de revelación, escena 2). Combate B2: Starly 12, Riolu 12,
// inicial 14 (content/trainers/b03.js → gael_2). Si el jugador pierde, la historia sigue (§2.6): cura y cambia
// la frase de Gael. La célula que «se le escapó» es C014 y queda en la pasarela de la Esclusa mayor.
import { F, SPEAKER, SPRITE, say, when, zygardeEmote, B03_CELLS } from './b03_common.js';
import { GAEL, BRIDGES } from '../maps/b03/caudal_layout.js';
import { getTrainer } from '../trainers/index.js';

const G = SPEAKER.gael;
const A = SPEAKER.alerce;
const LOCK_CELL = B03_CELLS.find((c) => c.id === 'cell_caudal_1');

/** Configuración del combate B2 (sin game over). */
export function gael2BattleConfig(state) {
  const t = getTrainer('gael_2', state);
  if (!t.party?.length) throw new Error('gael_2 sin Pokémon');
  return {
    type: 'trainer',
    trainer: 'gael_2',
    bgm: t.bgm,
    canLose: true,
    rules: { canLose: true, noMoneyLoss: true, canRun: false, canCatch: false },
  };
}

/** Brillo de la célula: sale de las manos de Gael, va hacia el jugador y se desvía a la esclusa. */
async function cellFlight(ctx, from) {
  let h = null;
  try {
    h = ctx.effect('zygardeCell', { x: from.x, y: from.y, size: 48 });
  } catch (err) {
    console.warn('[b03] brillo de la célula', err);
  }
  ctx.se('Mining item get', { volume: 60 });
  await ctx.wait(30);
  const p = ctx.player;
  // Si la esclusa queda fuera de pantalla, la cámara acompaña al brillo hasta la pasarela y luego vuelve.
  const far = Math.abs(LOCK_CELL.x - p.x) > 6 || Math.abs(LOCK_CELL.y - p.y) > 4;
  let pan = null;
  const path = [
    [from.x, from.y], [(from.x + p.x) / 2, (from.y + p.y) / 2 - 0.5], [p.x + 0.4, p.y + 0.2],
    [p.x + 2, p.y + 1.2], [LOCK_CELL.x - 2, LOCK_CELL.y - 0.8], [LOCK_CELL.x, LOCK_CELL.y],
  ];
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1];
    const [x1, y1] = path[i];
    const n = i === 2 ? 18 : 12;
    if (i === 3 && far) pan = ctx.camera.pan(LOCK_CELL.x - 1, LOCK_CELL.y - 1, 40);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      h?.object?.position?.set?.((x0 + (x1 - x0) * t) * 32 + 16, (y0 + (y1 - y0) * t) * 32 + 16, 0);
      await ctx.wait(1);
    }
    if (i === 2) await zygardeEmote(ctx, '!');
  }
  await ctx.wait(10);
  h?.remove?.(20);
  ctx.requestRefresh(); // aparece el evento de C014 en la pasarela
  if (pan) {
    await pan;
    await ctx.wait(30);
    await ctx.camera.reset(30);
  }
}

/** Gael cruza el puente hacia el sur: se queda ayudando en el barrio bajo (B04: evacuación; b04_caudal.js). */
async function gaelLeaves(ctx) {
  await ctx.move('gael', ['down', 'down', 'down', 'down', 'down', 'down'], { speed: 4 });
  ctx.erase('gael');
}

/** Llamada de Alerce por la Pokédex (subtexto: reconoce el instrumental; sin revelar nada). */
export async function alerceCall(ctx) {
  ctx.me('Register phone');
  await ctx.say('¡La Pokédex está sonando!\nEs una llamada del Prof. Alerce.');
  ctx.se('GUI pokedex open');
  await say(ctx, A, '\\PN, ¿me oyes? Las lecturas de Zaguán se han calmado. Pensé que te gustaría saberlo.');
  await say(ctx, A, '¿Ya estáis en Caudal? Bien. ¿Algo raro por ahí?');
  await ctx.say('Le cuentas lo de los aparatos que ha visto Gael río arriba.');
  await say(ctx, A, '¿Balizas de tres patas en la Garganta?');
  await ctx.wait(45);
  await say(ctx, A, '…Da igual. Id con cuidado.');
  await say(ctx, A, 'Te llamaré si las lecturas cambian.');
  ctx.se('GUI pokedex open');
  ctx.setFlag(F.alerce);
}

/** Escena completa del puente (se dispara al pisar el puente dorado). */
export async function gaelBridgeScene(ctx) {
  if (ctx.flag(F.gael)) return;
  ctx.bgm('intro_tough');
  ctx.face('gael', 'down');
  await ctx.wait(20);
  await ctx.emote('gael', '…');
  await ctx.approach('gael');
  ctx.face('player', ctx.directionTo(ctx.player, ctx.world.events.find((e) => e.id === 'gael')));
  await say(ctx, G, 'Por fin. Te he visto bajar por la pradera.');
  await say(ctx, G, 'Encontré una célula. Aquí, en la orilla. La tuve en la mano.');
  const gael = ctx.world.events.find((e) => e.id === 'gael');
  await cellFlight(ctx, { x: gael.x, y: gael.y });
  await ctx.wait(20);
  await say(ctx, G, 'Se me escapó de las manos… hacia ti.');
  await ctx.wait(20);
  await say(ctx, G, 'Claro. Viene a ti. Todo viene a ti.');
  await say(ctx, G, 'Pues demuéstrame que no es casualidad. Combate.');
  let outcome = 'win';
  try {
    outcome = await ctx.battle(gael2BattleConfig(ctx.state));
  } catch (err) {
    console.error('[b03] combate con Gael (B2)', err);
  }
  ctx.bgm('CiudadCeleste');
  if (outcome === 'win') {
    ctx.setFlag(F.gaelWon);
    await say(ctx, G, 'No he terminado. Pero eso ya lo sabías.');
  } else {
    ctx.heal();
    await say(ctx, G, 'Ganar no cambia nada. La célula sigue yendo hacia ti, no hacia mí.');
  }
  await say(ctx, G, 'Río arriba, en la Garganta, hay aparatos clavados entre las rocas. Balizas de tres patas.');
  await say(ctx, G, 'Llevan el mismo sello que el trípode de los topógrafos de la Ruta 1.');
  // Enlaza con B04: Gael no sube a la Garganta, evacúa el barrio bajo («Lo de la Garganta es cosa tuya»).
  await say(ctx, G, 'Yo me quedo aquí. El barrio bajo se inunda cada mañana y nadie mueve un dedo.');
  await gaelLeaves(ctx);
  ctx.setFlag(F.gael);
  await ctx.wait(30);
  await alerceCall(ctx);
}

/** Si la partida se cortó entre el combate y la llamada, la llamada llega al volver a Caudal. */
async function pendingCall(ctx) {
  await ctx.wait(20);
  await alerceCall(ctx);
}

/**
 * Llegada desde la Ruta 2 (boca norte de la ciudad): Gael llama desde el puente y el jugador baja hasta él. Sin esto
 * se podía rodear el puente por el Paseo del Albo y las pasarelas de la esclusa (o irse a la Ruta 3) sin el B2.
 */
export async function gaelCallsFromBridge(ctx) {
  if (ctx.flag(F.gael)) return;
  await say(ctx, G, '¡\\PN! Aquí, en el puente.');
  await ctx.movePlayerTo(GAEL.meet.x, GAEL.meet.y);
  ctx.face('player', 'down');
  await gaelBridgeScene(ctx);
}

/** Eventos: Gael en el puente, franjas que disparan la escena (entrada norte y extremos del puente) y la llamada. */
export function gaelEvents() {
  const active = when({ none: [F.gael] });
  const bridge = BRIDGES.entrance;
  const strip = [];
  for (let x = GAEL.entry.x0; x <= GAEL.entry.x1; x++) {
    strip.push({ id: `entrada_gael_${x}`, x, y: GAEL.entry.y, trigger: 'touch', when: active, script: gaelCallsFromBridge });
  }
  for (let x = GAEL.trigger.x0; x <= GAEL.trigger.x1; x++) {
    strip.push({ id: `puente_gael_n_${x}`, x, y: bridge.y0, trigger: 'touch', when: active, script: gaelBridgeScene });
    strip.push({ id: `puente_gael_s_${x}`, x, y: bridge.y1, trigger: 'touch', when: active, script: gaelBridgeScene });
  }
  return [
    {
      id: 'gael', x: GAEL.stand.x, y: GAEL.stand.y, sprite: SPRITE.gael, dir: 2, when: active, trigger: 'action',
      script: gaelBridgeScene,
    },
    ...strip,
    { id: 'llamada_alerce', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.gael], none: [F.alerce] }), script: pendingCall },
  ];
}
