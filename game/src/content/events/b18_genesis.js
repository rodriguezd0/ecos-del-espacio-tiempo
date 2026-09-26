// Genesis en el Puente de la Convergencia (docs/CAMPANA.md B18 «Secuencia» 2–3; §5.2–5.4 Vértice, Casia y Garrido; §6.2
// Gael «Rechaza a Vértice… Recoge el cuaderno»): combates en secuencia sobre la plataforma con el helper común de
// combates de guion (content/common/bossBattle.js: perder no es derrota general; se reintenta en su casilla) y Alerce
// ofreciendo curar desde el borde entre uno y otro; la frase de Vértice; la sobrecarga del Resonador; Dialga y Palkia
// irrumpen en la Cámara del Cruce; Gael rechaza a Vértice; Vértice se retira en el aerodeslizador y pierde el cuaderno;
// Olmedo detiene a Casia y a Garrido; Gael recoge el cuaderno y se marcha.
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, eventById, pause, walkTo, objectPage, byGender,
  freeSpotNearPlayer,
} from './b18_common.js';
import { CAST, STRIPS, RETRY, RESONATOR, CHAIN, HOVER, MOUTH, PLATFORM } from '../maps/b18/puente_layout.js';
import { bossBattle } from '../common/bossBattle.js';
import { alerceHeal } from './b18_puente.js';

export const GENESIS_TEXT = Object.freeze({
  seal: 'La Cadena Sintética cruza la boca de la escalera. Zumba como un cable de alta tensión.',
  overload: 'La Cadena Sintética se tensa hasta chirriar. El Resonador escupe chispas magenta.',
  snap: 'La Cadena se parte con un chasquido de cristal. El Resonador se apaga de golpe.',
  sky: 'El aire se desgarra sobre la Sima. Por la grieta asoman dos siluetas enormes: una azul acero, otra perla y violeta.',
  dive: 'Dialga y Palkia rugen a la vez y se lanzan de cabeza por la boca de la Cámara del Cruce.',
  notebook: 'Del bolsillo de la bata de Vértice cae un cuaderno de campo de tapas marrones.',
  flyAway: 'El aerodeslizador se eleva sobre el abismo y se pierde hacia el sur.',
  gaelTakes: 'Gael recoge el cuaderno, lo hojea un momento y se lo guarda en la chaqueta.',
  resonatorOff: 'Lo que queda del Resonador Sintético: chapa ennegrecida y una antena doblada.',
  resonatorOn: 'Una torre blanca llena de bobinas. Vibra tanto que cuesta mirarla.',
});

// ─────────────────────────────── Alerce entre combate y combate ───────────────────────────────

/** Alerce se acerca desde el borde (fundido), ofrece curar y vuelve a su sitio. */
async function alerceOffers(ctx, flag, intro) {
  ctx.setFlag(flag);
  ctx.world?.refreshEvents?.();
  const al = [eventById(ctx, 'alerce_borde'), eventById(ctx, 'alerce_boca')].find((e) => e?.page) || null;
  const home = al ? { x: al.x, y: al.y, dir: al.direction } : null;
  if (al) {
    await ctx.fade('out', 10);
    const spot = freeSpotNearPlayer(ctx, [al]);
    if (spot) al.moveTo(spot.x, spot.y);
    ctx.turnToPlayer(al);
    ctx.face('player', ctx.directionTo(ctx.player, al));
    await ctx.fade('in', 10);
  }
  await ctx.say(intro, { speaker: SPEAKER.alerce });
  await alerceHeal(ctx);
  if (al && home) {
    await ctx.fade('out', 10);
    al.moveTo(home.x, home.y);
    al.direction = home.dir;
    await ctx.fade('in', 10);
  }
}

// ─────────────────────────────── Casia ───────────────────────────────

async function casiaScene(ctx) {
  const casia = eventById(ctx, 'casia');
  if (!casia) return;
  ctx.bgm(MUSIC.genesis);
  ctx.turnToPlayer(casia);
  ctx.face('player', ctx.directionTo(ctx.player, casia));
  if (!ctx.flag(F.casiaIntro)) {
    ctx.setFlag(F.casiaIntro);
    await ctx.emote(casia, '!');
    const cells = ctx.state.cellCount?.() ?? ctx.state.data.zygarde?.cells?.length ?? 0;
    await lines(ctx, SPEAKER.casia, [
      `${byGender(ctx.state, 'Portador', 'Portadora')} del Core. ${cells} células, cinco núcleos, Forma Completa desde los Lagos del Alma.`,
      'Y la Cadena Roja. La original. Nuestra copia salió de lo que medimos desde fuera del Pilar del Alma.',
      `Solo nos falta compararlas. Quédate ${byGender(ctx.state, 'quieto', 'quieta')} y sigue siendo un dato.`,
    ]);
  } else {
    await ctx.say('Repetimos la medición.', { speaker: SPEAKER.casia });
  }
  const outcome = await bossBattle(ctx, { trainer: 'b18_casia' }, RETRY.casia, {
    speaker: SPEAKER.casia, loseText: 'Resultado anotado. Vuelve cuando quieras repetir la medición.',
  });
  if (outcome !== 'win') return;
  await ctx.say('Fuera de rango. Todo lo que tiene que ver contigo sale fuera de rango.', { speaker: SPEAKER.casia });
  await walkTo(ctx, casia, CAST.casiaAside.x, CAST.casiaAside.y, { speed: 4 });
  ctx.face(casia, CAST.casiaAside.dir);
  ctx.setFlag(F.casia); // a un lado: la sustituye el evento `casia_aparte` en la misma casilla
  ctx.bgm(MUSIC.sima);
  await alerceOffers(ctx, F.heal1, 'Bien. Déjame ver a tu equipo antes de que venga el siguiente.');
}

// ─────────────────────────────── Garrido ───────────────────────────────

async function garridoScene(ctx) {
  const garrido = eventById(ctx, 'garrido');
  if (!garrido) return;
  ctx.bgm(MUSIC.genesis);
  ctx.turnToPlayer(garrido);
  ctx.face('player', ctx.directionTo(ctx.player, garrido));
  if (!ctx.flag(F.garridoIntro)) {
    ctx.setFlag(F.garridoIntro);
    await ctx.emote(garrido, '…');
    await lines(ctx, SPEAKER.garrido, [
      'Hemos tendido andamios sobre un abismo para llegar hasta aquí. Treinta años de obra y nunca había visto algo así.',
      'No me gusta dejar un trabajo a medias. Nada personal.',
    ]);
  } else {
    await ctx.say('Otra vez. Sin prisa.', { speaker: SPEAKER.garrido });
  }
  const outcome = await bossBattle(ctx, { trainer: 'b18_garrido' }, RETRY.garrido, {
    speaker: SPEAKER.garrido, loseText: 'Descansa. El andamio no se va a mover de aquí.',
  });
  if (outcome !== 'win') return;
  await ctx.say('El doctor está en el Resonador. Yo que tú no lo haría esperar… ni me fiaría.', { speaker: SPEAKER.garrido });
  await walkTo(ctx, garrido, CAST.garridoAside.x, CAST.garridoAside.y, { speed: 4 });
  ctx.face(garrido, CAST.garridoAside.dir);
  ctx.setFlag(F.garrido); // a un lado: lo sustituye el evento `garrido_aparte` en la misma casilla
  ctx.bgm(MUSIC.sima);
  await alerceOffers(ctx, F.heal2, 'Queda uno. El que da las órdenes. Deja que les eche un vistazo.');
}

// ─────────────────────────────── Vértice ───────────────────────────────

async function verticeScene(ctx) {
  if (ctx.flag(F.vertice)) { await convergenceScene(ctx); return; }
  const v = eventById(ctx, 'vertice');
  if (!v) return;
  ctx.turnToPlayer(v);
  ctx.face('player', ctx.directionTo(ctx.player, v));
  if (!ctx.flag(F.verticeLine)) {
    ctx.bgm(MUSIC.genesis);
    await lines(ctx, SPEAKER.vertice, [
      'Por fin sin una pantalla de por medio. Has recorrido mucho camino desde la gala del museo.',
      'El Rey del Eje forjó una corona que imitaba la flauta. Fracasó porque pedía. Yo no pido: sincronizo.',
      'La profecía es una cerradura. Yo fabrico llaves.',
    ]);
    await pause(ctx, 20);
    await ctx.say('Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?', { speaker: SPEAKER.vertice });
    ctx.setFlag(F.verticeLine);
    await pause(ctx, 20);
  } else {
    await ctx.say('Seguimos donde lo dejamos.', { speaker: SPEAKER.vertice });
  }
  const outcome = await bossBattle(ctx, { trainer: 'b18_vertice' }, RETRY.vertice, {
    speaker: SPEAKER.vertice, loseText: 'Vuelve cuando quieras. El Resonador no tiene prisa.',
  });
  if (outcome !== 'win') return;
  ctx.setFlag(F.vertice);
  await convergenceScene(ctx);
}

// ─────────────────────────────── La irrupción ───────────────────────────────

/** Sprite de un legendario que cruza el cielo sobre la Sima y se lanza por la boca de la Cámara. */
async function legendaryDive(ctx, species, sprite, from, color) {
  const ev = ctx.world.spawnEvent?.({ id: `irrupcion_${species.toLowerCase()}`, x: from.x, y: from.y, sprite, dir: 2, through: true, alwaysOnTop: true, stepAnime: true, directionFix: true });
  if (!ev) return null;
  ev.opacity = 0;
  for (let f = 0; f <= 16; f++) { ev.opacity = Math.round((255 * f) / 16); await pause(ctx, 1); }
  ctx.cry(species);
  await ctx.flash(color, 16, 150);
  return ev;
}

/**
 * Escena tras vencer a Vértice, por pasos que se saltan si ya ocurrieron (si algo la interrumpe, el evento automático
 * `escena_convergencia` la retoma donde quedó al volver al mapa).
 */
async function convergenceScene(ctx) {
  ctx.bgm(MUSIC.crisis, { fadeOutPrevious: 20 });
  if (!ctx.flag(F.irruption)) await irruptionStep(ctx);
  let gael = null;
  if (!ctx.flag(F.verticeGone)) gael = await gaelStep(ctx, eventById(ctx, 'vertice'));
  let olmedo = null;
  if (!ctx.flag(F.arrest)) olmedo = await olmedoStep(ctx);
  if (!ctx.flag(F.notebook)) await notebookStep(ctx, gael, olmedo);
  else {
    for (const ev of [gael, olmedo]) if (ev) ctx.world.removeEvent?.(ev);
  }
  await finishStep(ctx);
}

async function irruptionStep(ctx) {
  const v = eventById(ctx, 'vertice');
  await ctx.say('…Interesante.', { speaker: SPEAKER.vertice });
  // Sobrecarga del Resonador
  ctx.setFlag(F.overload);
  ctx.se('PRSFX- Charge', { volume: 90 });
  await ctx.camera.pan(RESONATOR.x, RESONATOR.y - 1, 30);
  await ctx.say(GENESIS_TEXT.overload);
  await ctx.say('¡Doctor! ¡La tensión de la Cadena Sintética se dispara!', { speaker: SPEAKER.techF });
  await ctx.say('Déjala. Quiero ver qué hay al otro lado.', { speaker: SPEAKER.vertice });
  ctx.se('PRSFX- Explosion', { volume: 90 });
  ctx.shake(8, 8, 40);
  await ctx.flash([255, 255, 255], 20, 230);
  ctx.setFlag(F.irruption); // el Resonador queda roto y la Cadena Sintética partida (páginas)
  await ctx.say(GENESIS_TEXT.snap);
  // Dialga y Palkia irrumpen y se lanzan a la Cámara
  await ctx.camera.pan(MOUTH.warp.x, MOUTH.warp.y - 4, 30);
  const rift = ctx.effect?.('cracks', { x: MOUTH.warp.x, y: MOUTH.warp.y - 6, length: 160, branches: 5, seed: 18, color: [220, 200, 255], fadeIn: 20 });
  ctx.se('PRSFX- Ominous Wind', { volume: 90 });
  await pause(ctx, 20);
  await ctx.say(GENESIS_TEXT.sky);
  ctx.se('PRSFX- Roar of Time', { volume: 90 });
  const dialga = await legendaryDive(ctx, 'DIALGA', SPRITE.dialga, { x: MOUTH.warp.x - 4, y: MOUTH.warp.y - 5 }, [118, 172, 255]);
  ctx.se('PRSFX- Spacial Rend', { volume: 90 });
  const palkia = await legendaryDive(ctx, 'PALKIA', SPRITE.palkia, { x: MOUTH.warp.x + 4, y: MOUTH.warp.y - 5 }, [222, 128, 255]);
  ctx.shake(9, 9, 50);
  await ctx.say(GENESIS_TEXT.dive);
  const dives = [];
  for (const ev of [dialga, palkia]) if (ev) dives.push(ctx.move(ev, ev.x < MOUTH.warp.x ? ['down', 'right', 'down', 'right', 'down', 'right', 'right'] : ['down', 'left', 'down', 'left', 'down', 'left', 'left'], { speed: 5, wait: true }));
  await Promise.all(dives);
  for (let f = 16; f >= 0; f--) { for (const ev of [dialga, palkia]) if (ev) ev.opacity = Math.round((255 * f) / 16); await pause(ctx, 1); }
  for (const ev of [dialga, palkia]) if (ev) ctx.world.removeEvent?.(ev);
  await ctx.flash([255, 255, 255], 24, 200);
  rift?.remove?.(60);
  await ctx.camera.reset(30);
  await ctx.say('Magnífico.', { speaker: SPEAKER.vertice });
  if (v) ctx.face(v, 'down');
}

// ─────────────────────────────── Gael y la huida ───────────────────────────────

/** Gael llega por el borde sur; Vértice le ofrece irse con él y se retira en el aerodeslizador. → evento de Gael */
async function gaelStep(ctx, v) {
  const gael = ctx.world.spawnEvent?.({ id: 'gael_escena', x: CAST.gaelFrom.x, y: CAST.gaelFrom.y, sprite: SPRITE.gael, dir: 8 });
  if (gael) {
    await ctx.camera.pan(CAST.gaelArrive.x, CAST.gaelArrive.y + 3, 30);
    await walkTo(ctx, gael, CAST.gaelArrive.x, CAST.gaelArrive.y + 1, { speed: 4 });
    ctx.face(gael, 'up');
  }
  if (v) { await ctx.emote(v, '!'); ctx.face(v, 'down'); }
  await ctx.say('Gael.', { speaker: SPEAKER.vertice });
  await ctx.say('Ven conmigo. Tú sabes lo que es esperar.', { speaker: SPEAKER.vertice });
  await pause(ctx, 30);
  await ctx.say('No voy a pedirle permiso a nadie. Tampoco a usted.', { speaker: SPEAKER.gael });
  ctx.setFlag(F.gael);
  await ctx.say('Lástima. Entonces seguiremos hablando otro día.', { speaker: SPEAKER.vertice });
  // Vértice se retira en el aerodeslizador y pierde el cuaderno
  if (v) {
    await walkTo(ctx, v, HOVER.takeoff.x, HOVER.takeoff.y, { speed: 4 });
    ctx.face(v, 'up');
  }
  ctx.se('PRSFX- Magnet Rise', { volume: 80 });
  ctx.setFlag(F.verticeGone); // aerodeslizador en vuelo, cuaderno en el suelo, Vértice fuera
  await ctx.say(GENESIS_TEXT.notebook);
  await flyAway(ctx);
  await ctx.say(GENESIS_TEXT.flyAway);
  await ctx.camera.reset(30);
  return gael;
}

async function flyAway(ctx) {
  ctx.world?.refreshEvents?.();
  const hover = eventById(ctx, 'aerodeslizador');
  if (!hover) return;
  hover.alwaysOnTop = true;
  await ctx.move(hover, ['up', 'right', 'up', 'right', 'right', 'down', 'right', 'right', 'down', 'right', 'right'], { speed: 5, wait: true });
  for (let f = 16; f >= 0; f--) { hover.opacity = Math.round((255 * f) / 16); await pause(ctx, 1); }
  ctx.erase(hover);
}

// ─────────────────────────────── Olmedo y el cuaderno ───────────────────────────────

/** Olmedo llega con la Policía Regional y detiene a Casia y a Garrido. → evento de Olmedo */
async function olmedoStep(ctx) {
  const y0 = PLATFORM.y0 - 2; // llegan por el tramo reconstruido
  const olmedo = ctx.world.spawnEvent?.({ id: 'olmedo_escena', x: 20, y: y0, sprite: SPRITE.olmedo, dir: 2 });
  const a1 = ctx.world.spawnEvent?.({ id: 'agente_escena_1', x: 19, y: y0, sprite: SPRITE.agent, dir: 2 });
  const a2 = ctx.world.spawnEvent?.({ id: 'agente_escena_2', x: 21, y: y0, sprite: SPRITE.agent, dir: 2 });
  await ctx.say('¡Policía Regional! ¡Que nadie se mueva!', { speaker: SPEAKER.olmedo });
  ctx.world?.refreshEvents?.();
  const alive = (id) => { const ev = eventById(ctx, id); return ev?.page ? ev : null; };
  const casia = alive('casia_aparte') || alive('casia');
  const garrido = alive('garrido_aparte') || alive('garrido');
  const moves = [];
  if (olmedo) moves.push(walkTo(ctx, olmedo, CAST.olmedoArrive.x, CAST.olmedoArrive.y, { speed: 4 }));
  if (a1 && casia) moves.push(walkTo(ctx, a1, casia.x + 1, casia.y, { speed: 4 }));
  if (a2 && garrido) moves.push(walkTo(ctx, a2, garrido.x - 1, garrido.y, { speed: 4 }));
  await Promise.all(moves);
  if (a1 && casia) { ctx.face(a1, 'left'); ctx.face(casia, 'right'); }
  if (a2 && garrido) { ctx.face(a2, 'right'); ctx.face(garrido, 'left'); }
  await lines(ctx, SPEAKER.olmedo, [
    'Doctora Casia Varela. Ulises Garrido. Quedan detenidos por la ocupación del Puente y por poner en peligro a media región.',
  ]);
  await ctx.say('Hora de la detención… Ni siquiera los relojes se ponen de acuerdo hoy. Anótelo como aproximada, agente.', { speaker: SPEAKER.casia });
  await ctx.say('Sin rencor, agente. Ya iba siendo hora.', { speaker: SPEAKER.garrido });
  // Los agentes se los llevan por el puente reconstruido (x 19 y 21), sin pisar el vacío ni los monolitos.
  await Promise.all([[a1, casia, 19], [a2, garrido, 21]].map(([ag, who, lane]) => escort(ctx, ag, who, lane)));
  for (const ev of [a1, a2]) if (ev) ctx.world.removeEvent?.(ev);
  ctx.setFlag(F.arrest); // Casia y Garrido ya no están en la plataforma
  if (olmedo) {
    ctx.turnToPlayer(olmedo);
    await ctx.say(`Primero el Laberinto y ahora esto. ${byGender(ctx.state, 'Chico', 'Chica')}, tienes un don para estar donde no se debe.`, { speaker: SPEAKER.olmedo });
  }
  return olmedo;
}

/** Ruta de un personaje hasta la columna `lane` por su fila y después hacia el norte hasta la fila `toY`. */
function laneRoute(ev, lane, toY) {
  const side = Array(Math.abs(lane - ev.x)).fill(lane > ev.x ? 'right' : 'left');
  return [...side, ...Array(Math.max(0, ev.y - toY)).fill('up')];
}

/**
 * Un agente escolta a un detenido: van en fila hasta el carril `lane` del tablero y suben por el tramo reconstruido
 * hacia la Senda (el agente delante); al llegar se desvanecen (el agente se quita en olmedoStep y el detenido
 * desaparece con su página al fijar F.arrest).
 */
async function escort(ctx, agent, who, lane) {
  const top = PLATFORM.y0 - 5; // sobre el segundo estribo
  const moves = [];
  if (agent) moves.push(ctx.move(agent, laneRoute(agent, lane, top), { speed: 4, wait: true, through: true }));
  if (who) moves.push(ctx.move(who, laneRoute(who, lane, top + 1), { speed: 4, wait: true, through: true }));
  await Promise.all(moves);
  const evs = [agent, who].filter(Boolean);
  for (let f = 12; f >= 0; f--) { for (const ev of evs) ev.opacity = Math.round((255 * f) / 12); await pause(ctx, 1); }
}

/** Gael recoge el cuaderno de Vértice y se marcha por los andamios (distancia). */
async function notebookStep(ctx, gaelEv, olmedo) {
  let gael = gaelEv;
  if (!gael) gael = ctx.world.spawnEvent?.({ id: 'gael_escena', x: CAST.notebook.x, y: CAST.notebook.y + 2, sprite: SPRITE.gael, dir: 8 });
  if (gael) {
    await walkTo(ctx, gael, CAST.notebook.x, CAST.notebook.y + 1, { speed: 4 });
    ctx.face(gael, 'up');
  }
  await pause(ctx, 20);
  ctx.setFlag(F.notebook); // el cuaderno desaparece del suelo
  await ctx.say(GENESIS_TEXT.gaelTakes);
  if (gael) {
    ctx.turnToPlayer(gael);
    await ctx.emote(gael, '…');
  }
  if (olmedo) await ctx.say('¡Eh, tú! Eso es una prueba. ¡Espera!', { speaker: SPEAKER.olmedo });
  if (gael) {
    const side = Array(Math.abs(20 - gael.x)).fill(gael.x > 20 ? 'left' : 'right');
    await ctx.move(gael, ['down', ...side, ...Array(10).fill('down')], { speed: 4, wait: true, through: true });
    for (let f = 12; f >= 0; f--) { gael.opacity = Math.round((255 * f) / 12); await pause(ctx, 1); }
    ctx.world.removeEvent?.(gael);
  }
  if (olmedo) {
    await ctx.say('…Ese chico. Lo conozco desde que era así de alto.', { speaker: SPEAKER.olmedo });
    ctx.world.removeEvent?.(olmedo);
  }
}

/** Cierre: la boca de la Cámara queda abierta y Alerce baja hasta ella. */
async function finishStep(ctx) {
  // Zygarde habla muy poco (autor, 25-09-2026): sin comentarios en la irrupción ni en el cierre.
  await ctx.fade('out', 14);
  ctx.setFlag(F.scene); // la boca de la Cámara queda abierta; Alerce y la policía, en su sitio
  await pause(ctx, 8);
  await ctx.fade('in', 14);
  ctx.bgm(MUSIC.sima, { fadeOutPrevious: 30 });
  await alerceOffers(ctx, F.heal3, 'Lo que haya dicho Vértice… puede esperar. Antes de bajar, tu equipo.');
}

// ─────────────────────────────── Eventos ───────────────────────────────

const genesisPage = (sprite, dir, extra = {}) => ({ sprite, dir, move: 'still', ...extra });

function castEvents() {
  const casiaTalk = async (ctx) => {
    if (!ctx.flag(F.casia)) { await casiaScene(ctx); return; }
    await ctx.say('No me mires así. Mido; no destruyo. Lo demás… lo decide otro.', { speaker: SPEAKER.casia });
  };
  const garridoTalk = async (ctx) => {
    if (!ctx.flag(F.garrido)) { if (ctx.flag(F.casia)) await garridoScene(ctx); return; }
    await ctx.say('Treinta años levantando andamios. Nunca uno tan cerca de algo que no se debía tocar.', { speaker: SPEAKER.garrido });
  };
  return [
    {
      id: 'casia', x: CAST.casia.x, y: CAST.casia.y, name: SPEAKER.casia,
      pages: [{ when: when({ none: [F.casia] }), ...genesisPage(SPRITE.casia, CAST.casia.dir), script: casiaTalk }],
    },
    {
      id: 'casia_aparte', x: CAST.casiaAside.x, y: CAST.casiaAside.y, name: SPEAKER.casia,
      pages: [{ when: when({ all: [F.casia], none: [F.arrest] }), ...genesisPage(SPRITE.casia, CAST.casiaAside.dir), script: casiaTalk }],
    },
    {
      id: 'garrido', x: CAST.garrido.x, y: CAST.garrido.y, name: SPEAKER.garrido,
      pages: [{ when: when({ none: [F.garrido] }), ...genesisPage(SPRITE.garrido, CAST.garrido.dir), script: garridoTalk }],
    },
    {
      id: 'garrido_aparte', x: CAST.garridoAside.x, y: CAST.garridoAside.y, name: SPEAKER.garrido,
      pages: [{ when: when({ all: [F.garrido], none: [F.arrest] }), ...genesisPage(SPRITE.garrido, CAST.garridoAside.dir), script: garridoTalk }],
    },
    {
      id: 'vertice', x: CAST.vertice.x, y: CAST.vertice.y, name: SPEAKER.vertice,
      pages: [
        { when: when({ none: [F.verticeGone] }), ...genesisPage(SPRITE.vertice, CAST.vertice.dir), script: async (ctx) => {
          if (!ctx.flag(F.garrido)) { await ctx.say('Mis directores primero. Es cuestión de protocolo.', { speaker: SPEAKER.vertice }); return; }
          await verticeScene(ctx);
        } },
      ],
    },
    // Tras la escena: Olmedo vigila lo que queda del Resonador
    {
      id: 'olmedo_despues', x: CAST.olmedoAfter.x, y: CAST.olmedoAfter.y, name: SPEAKER.olmedo,
      pages: [{
        when: when({ all: [F.scene], none: [F.t15Tablet] }), sprite: SPRITE.olmedo, dir: CAST.olmedoAfter.dir, move: 'still',
        script: async (ctx) => {
          if (ctx.flag(F.restored)) { await ctx.say('Los relojes van a la par. Eso lo has hecho tú ahí abajo, ¿verdad? No me lo expliques.', { speaker: SPEAKER.olmedo }); return; }
          await ctx.say('Mis agentes se llevan a esos dos a Caudal. Yo me quedo con este cacharro hasta que alguien me diga qué es.', { speaker: SPEAKER.olmedo });
        },
      }],
    },
    {
      id: 'agente_resonador', x: CAST.agentAfter.x, y: CAST.agentAfter.y, name: SPEAKER.agent,
      pages: [{ when: when({ all: [F.scene], none: [F.t15Tablet] }), sprite: SPRITE.agent, dir: CAST.agentAfter.dir, move: 'still', script: async (ctx) => { await ctx.say('Nadie toca la máquina. Órdenes del agente Olmedo.', { speaker: SPEAKER.agent }); } }],
    },
  ];
}

function stripEvents() {
  const casiaWhen = when({ all: [F.bridge], none: [F.casia] });
  const garridoWhen = when({ all: [F.casia], none: [F.garrido] });
  return [
    ...STRIPS.casia.map((c) => ({ id: `franja_casia_${c.x}`, x: c.x, y: c.y, through: true, pages: [{ when: casiaWhen, trigger: 'touch', through: true, script: casiaScene }] })),
    ...STRIPS.garrido.map((c) => ({ id: `franja_garrido_${c.x}`, x: c.x, y: c.y, through: true, pages: [{ when: garridoWhen, trigger: 'touch', through: true, script: garridoScene }] })),
  ];
}

function techEvent(id, trainer, pos, sprite, speaker, intro, after) {
  return {
    id, x: pos.x, y: pos.y, name: speaker,
    pages: [
      {
        when: (s, ev) => !s.flag(F.scene) && !ev.selfSwitch('A'), sprite, dir: pos.dir, trigger: 'eventTouch', sight: 4,
        script: async (ctx) => {
          const ev = ctx.event;
          ctx.bgm('EncuentroRocket');
          await ctx.emote(ev, '!');
          await ctx.approach(ev);
          ctx.turnToPlayer(ev);
          ctx.face('player', ctx.directionTo(ctx.player, ev));
          await ctx.say(intro, { speaker });
          const outcome = await ctx.battle({ type: 'trainer', trainer });
          if (outcome === 'win') ctx.setSelfSwitch('A', true);
        },
      },
      { when: (s, ev) => !s.flag(F.scene) && ev.selfSwitch('A'), sprite, dir: pos.dir, trigger: 'action', script: async (ctx) => { await ctx.say(after, { speaker }); } },
    ],
  };
}

function machineEvents() {
  return [
    {
      id: 'resonador', x: RESONATOR.x, y: RESONATOR.y, name: 'Resonador Sintético',
      pages: [
        { ...objectPage(OBJ.resonator, 2, { stepAnime: true, speed: 3 }), solid: true, trigger: 'action', glow: { name: 'softLight', radius: 70, intensity: 0.55, pulse: 0.5, color: [232, 107, 196] }, script: async (ctx) => { await ctx.say(GENESIS_TEXT.resonatorOn); } },
        { when: when({ all: [F.overload] }), ...objectPage(OBJ.resonator, 4, { stepAnime: true, speed: 4 }), solid: true, trigger: 'action', glow: { name: 'softLight', radius: 90, intensity: 0.8, pulse: 0.9, color: [255, 120, 230] }, script: async (ctx) => { await ctx.say(GENESIS_TEXT.overload); } },
        { when: when({ all: [F.irruption] }), ...objectPage(OBJ.resonator, 6, { stepAnime: true, speed: 1 }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(GENESIS_TEXT.resonatorOff); } },
      ],
    },
    ...RESONATOR.solid.filter(([x, y]) => !(x === RESONATOR.x && y === RESONATOR.y)).map(([x, y]) => ({
      id: `resonador_base_${x}_${y}`, x, y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(ctx.flag(F.irruption) ? GENESIS_TEXT.resonatorOff : GENESIS_TEXT.resonatorOn); },
    })),
    ...CHAIN.horizontal.map(([x, y]) => chainEvent(x, y, 2)),
    ...CHAIN.vertical.map(([x, y]) => chainEvent(x, y, 4)),
    {
      id: 'sello_boca', x: MOUTH.seal.x, y: MOUTH.seal.y, name: 'Cadena Sintética',
      pages: [{ when: when({ none: [F.irruption] }), ...objectPage(OBJ.chain, 2, { stepAnime: true, speed: 3 }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(GENESIS_TEXT.seal); } }],
    },
    {
      id: 'aerodeslizador', x: HOVER.x, y: HOVER.y, name: 'Aerodeslizador',
      pages: [
        { when: when({ none: [F.verticeGone] }), ...objectPage(OBJ.hover, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Un aerodeslizador blanco con el emblema de los tubos cruzados. Las toberas aún están calientes.'); } },
        { when: when({ all: [F.verticeGone], none: [F.notebook] }), ...objectPage(OBJ.hover, 4, { stepAnime: true, speed: 4 }), through: true, alwaysOnTop: true },
      ],
    },
    ...HOVER.solid.filter(([x]) => x !== HOVER.x).map(([x, y]) => ({
      id: `aerodeslizador_casco_${x}`, x, y, pages: [{ when: when({ none: [F.verticeGone] }), solid: true, noOver: true }],
    })),
    {
      id: 'cuaderno_vertice', x: CAST.notebook.x, y: CAST.notebook.y, name: 'Cuaderno',
      pages: [{ when: when({ all: [F.verticeGone], none: [F.notebook] }), ...objectPage(OBJ.items, 2, { stepAnime: true, speed: 2 }), through: true }],
    },
  ];
}

function chainEvent(x, y, dir) {
  return {
    id: `cadena_sintetica_${x}_${y}`, x, y, through: true,
    pages: [
      { when: when({ none: [F.irruption] }), ...objectPage(OBJ.chain, dir, { stepAnime: true, speed: 3 }), through: true },
      { when: when({ all: [F.irruption] }), ...objectPage(OBJ.chain, 6), through: true },
    ],
  };
}

export function genesisEvents() {
  return [
    // Retoma la escena de la convergencia si algo la interrumpió tras vencer a Vértice.
    { id: 'escena_convergencia', x: 2, y: 0, pages: [{ when: when({ all: [F.vertice], none: [F.scene] }), trigger: 'auto', script: convergenceScene }] },
    ...castEvents(),
    ...stripEvents(),
    techEvent('tecnico_resonador', 'b18_tecnico_resonador', CAST.tecnico, SPRITE.tech, SPEAKER.tech,
      'Perímetro del Resonador. Identifícate… No, da igual: ya sé quién eres.', 'El doctor dice que esto cambiará el mundo. Yo solo quería un sueldo fijo.'),
    techEvent('tecnica_cadena', 'b18_tecnica_cadena', CAST.tecnica, SPRITE.techF, SPEAKER.techF,
      'La Cadena Sintética está al noventa por ciento. No voy a dejar que la toques.', 'Si la tensión sube de cien… no sé qué hay al otro lado. Nadie lo sabe.'),
    ...machineEvents(),
  ];
}
