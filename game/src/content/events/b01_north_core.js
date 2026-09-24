// El Core en la cámara derruida del Laberinto (B01 §4.6; D02, D02b, D06). Telepatía sobria, insinuación
// de la profecía exactamente como el guion, elección "Te ayudaré." / "¿Qué eres?", el Core pasa a
// seguir al jugador (state.data.zygarde.form = 'core', flag b01_core_found; su evento desaparece: nunca
// en dos sitios), llega el policía y escolta al laboratorio (flag b01_escorted; la escena del regreso,
// §4.7, es de content/events/b01_town_return.js).
import { F, SPEAKER, SPRITE } from './b01_town_common.js';
import { LAB } from './b01_town_lab.js';

/** Núcleo que se une en este bloque (docs/CAMPANA.md §2.4: N1, Laberinto de la Profundidad). */
export const CORE_ID = 'N1';
const GREEN = [185, 255, 102];
const SAY_CORE = { telepathy: true };

/** Líneas del Core (guion B01 §4.6, literales). */
export const CORE_LINES = Object.freeze({
  intro: [
    '…',
    'Puedes oírme.',
    'No te acerques más rápido. Estoy… incompleto.',
    'Lo que era se ha dispersado por esta tierra. Sin ello no puedo sostener el equilibrio.',
    'Las piedras de este lugar recuerdan una promesa. Alguien que caminaría entre el tiempo y el espacio.',
    'Te he estado esperando. Aunque no sabía que eras tú.',
  ],
  choices: ['Te ayudaré.', '¿Qué eres?'],
  whatAreYou: 'Una parte. Un núcleo. El resto está lejos.',
  accept: 'Entonces iré contigo.',
});

/** Líneas del policía al llegar (guion B01 §4.6, literales). */
export const POLICE_LINES = Object.freeze([
  '¡Aquí estás! ¿Tienes idea de lo que…?',
  '…¿Qué es eso?',
  'No. No voy a fingir que sé qué hacer con esto. Ni voy a dejarte aquí dentro.',
  'Vamos al laboratorio. El profesor Alerce sabrá qué es… o eso espero.',
]);

const found = (s) => Boolean(s?.flag(F.coreFound));

/** Bucle de la elección: "¿Qué eres?" responde y vuelve a preguntar; devuelve al aceptar. */
export async function coreChoice(ask, say) {
  for (let guard = 0; guard < 20; guard++) {
    const i = await ask(CORE_LINES.choices);
    if (i === 0) return;
    await say(CORE_LINES.whatAreYou);
  }
}

/**
 * El Core se une: estado (con joinCore del sistema de Zygarde si está: núcleo, flag global y forma), evento
 * fuera y compañero de campo en su lugar.
 */
function coreJoins(ctx, coreEvent, joinCore = null) {
  const s = ctx.state;
  if (typeof joinCore === 'function') {
    joinCore(s, CORE_ID);
  } else {
    if (typeof s.setZygardeForm === 'function') s.setZygardeForm('core');
    else s.data.zygarde.form = 'core';
    s.addCore(CORE_ID);
  }
  ctx.setFlag(F.coreFound);
  const at = { x: coreEvent.x, y: coreEvent.y };
  ctx.erase(coreEvent);
  ctx.scene.refreshFollower();
  const core = ctx.world.core;
  core.moveTo(at.x, at.y);
  core.turnToward(ctx.player);
  return core;
}

/**
 * El policía llega hasta el jugador (en diagonal, sin taparlo). Es el mismo que patrullaba: sale de su
 * ruta (pasillo o jardín del este), recorre el pasillo y sube por el hueco. Si no hubiera patrulla
 * activa, entra por el pasillo desde fuera de la vista.
 */
async function policeArrives(ctx, chamber) {
  const p = ctx.player;
  const x = p.x === chamber.door[0] ? chamber.door[1] : chamber.door[0];
  const hallY = chamber.y1 + 3;
  let cop = ctx.world.events.find((e) => e.id.startsWith('policia_patrulla') && e.page && !e.erased);
  if (cop) cop.moveTo(cop.x, cop.y);
  else {
    cop = ctx.world.spawnEvent({
      id: 'policia_llegada', x: Math.max(4, x - 9), y: hallY, sprite: SPRITE.police, dir: 6, through: true,
    });
  }
  const route = [];
  for (let y = cop.y; y < hallY; y++) route.push('down');
  for (let cx = cop.x; cx < x; cx++) route.push('right');
  for (let cx = cop.x; cx > x; cx--) route.push('left');
  for (let y = hallY; y > p.y + 1; y--) route.push('up');
  await ctx.move(cop, route, { speed: 4.5 });
  cop.applyMove('still'); // no retoma la patrulla durante la conversación
  ctx.face(cop, p);
  ctx.face('player', cop);
  return cop;
}

/** Escena completa (auto al pisar la entrada de la cámara). */
async function coreScene(ctx, chamber) {
  const coreEv = ctx.world.events.find((e) => e.id === 'core_camara');
  if (!coreEv || coreEv.erased || found(ctx.state)) return;
  ctx.audio?.stopBGM?.(40);
  // Se coloca frente al Core, a tres casillas.
  await ctx.movePlayerTo(coreEv.x, ctx.player.y, { through: false, speed: 2.5 });
  ctx.face('player', 'up');
  // La pantalla se tiñe de verde un instante (§4.6).
  ctx.audio?.playCoreSignal?.();
  ctx.flash(GREEN, 24, 150);
  await ctx.tone([-40, 26, -40, 0], 12);
  await ctx.wait(20);
  ctx.tone([0, 0, 0, 0], 40);
  await ctx.say(CORE_LINES.intro[0], SAY_CORE);
  await ctx.say(CORE_LINES.intro[1], SAY_CORE);
  // Da un paso hacia él; el Core le pide calma.
  if (ctx.player.y - coreEv.y > 2) await ctx.move('player', ['up'], { through: false, speed: 2 });
  await ctx.say(CORE_LINES.intro[2], SAY_CORE);
  for (const line of CORE_LINES.intro.slice(3)) await ctx.say(line, SAY_CORE);
  await coreChoice(
    (items) => ctx.choice(items, { cancel: null }),
    (text) => ctx.say(text, SAY_CORE),
  );
  await ctx.say(CORE_LINES.accept, SAY_CORE);
  ctx.audio?.playCoreSignal?.({ volume: 60 });
  await ctx.flash(GREEN, 30, 200);
  const progression = await import('../../world/zygarde/progression.js').catch((err) => {
    console.warn('[b01] Sistema de Zygarde no disponible; el Core se une sin él', err);
    return null;
  });
  const core = coreJoins(ctx, coreEv, progression?.joinCore);
  await ctx.move(core, [{ jump: [0, 0] }], { through: true });
  core.turnToward(ctx.player);
  await ctx.wait(20);
  // Llega el policía (§4.6).
  ctx.bgm('tension');
  const cop = await policeArrives(ctx, chamber);
  await ctx.say(POLICE_LINES[0], { speaker: SPEAKER.police });
  ctx.face(cop, core);
  await ctx.emote(cop, '!');
  await ctx.say(POLICE_LINES[1], { speaker: SPEAKER.police });
  ctx.face(cop, ctx.player);
  await ctx.wait(20);
  await ctx.say(POLICE_LINES[2], { speaker: SPEAKER.police });
  await ctx.say(POLICE_LINES[3], { speaker: SPEAKER.police });
  // Fundido y escolta al laboratorio (§4.7 lo dirige el agente del pueblo).
  await ctx.fade('out', 30);
  ctx.setFlag(F.escorted);
  await ctx.warp('laboratorio_alerce', LAB.escort.x, LAB.escort.y, LAB.escort.dir, { fade: false });
  await ctx.fade('in', 24);
}

/**
 * Eventos de la cámara: el Core (hasta b01_core_found), disparadores de la escena en el hueco de entrada y
 * la luz verde tenue. chamber = { x0, y0, x1, y1, door: [x, x], core: {x, y} } (las grietas son del suelo).
 */
export function coreChamberEvents(chamber) {
  const scene = (ctx) => coreScene(ctx, chamber);
  const triggers = chamber.door.map((x) => ({
    id: `camara_entrada_${x}`, x, y: chamber.y1 + 1, trigger: 'touch',
    when: (s) => !found(s), script: scene,
  }));
  return [
    {
      id: 'core_camara', x: chamber.core.x, y: chamber.core.y,
      pages: [{
        when: (s) => !found(s), sprite: 'zygarde_core', dir: 2, stepAnime: true, speed: 1.5,
        glow: { name: 'zygardeCell', size: 72, alpha: 0.55 }, light: { radius: 96, intensity: 0.8 },
        trigger: 'action', script: scene,
      }],
    },
    ...triggers,
    // Luz verde tenue de la cámara (siempre: allí descansó el Core).
    {
      id: 'camara_luz', x: chamber.core.x, y: chamber.core.y - 1, through: true,
      glow: { name: 'softLight', radius: 190, intensity: 0.3, pulse: 0.35, color: [120, 255, 140] },
    },
  ];
}
