// Epílogo del juego base (docs/CAMPANA.md B21 §6, D24):
//   · Zygarde en 10 % devuelve al jugador por el Salto hasta el nodo del Laberinto. Olmedo, en la verja: «Otra vez tú.»
//   · Mamá, en la puerta de casa. Alerce entrega la llave del cuarto del fondo (ALERCEKEY): «Hay cosas ahí que debería
//     haber enseñado hace tiempo. Cuando quieras.» (sin confesión).
//   · Montaje de los Guardianes en sus Pilares (y los Clefairy del Círculo del Jardín si se levantó, B17).
//   · La casa de Gael, vacía: una nota y un huevo de su inicial (world/eggs.js; var gael_starter): «Para que tu Pokédex
//     no tenga huecos por mi culpa.» Si el equipo está lleno, el huevo espera sobre la mesa (CAMPANA §2.6).
//   · La tele: Vértice ha dejado Axis en un carguero; en la cubierta, busca un cuaderno que no encuentra.
//   · Créditos sobre los lugares restaurados y el despertar en el cuarto. Zygarde sigue en Forma Completa por decisión
//     propia (el Arca solo gestiona formas). Empieza el postgame.
// Villa Alba y sus casas son mapas del Bloque 1: cada uno añade estos eventos con una línea (edición mínima).
import { F, V, SPEAKER, SPRITE, EGG_ROW, MUSIC, when, lines, pause, placePlayer, eventById, setClock, byGender } from './b21_common.js';
import { EPILOGUE_TEXT } from './b21_texts.js';
import { convergenceTravel, landFromJump, becomeTenPercent } from './b21_salto.js';
import { guardiansMontage, shipScene, creditsRoll } from './b21_cine.js';
import { stageRoute } from './b07_path.js';
import { setHomeHealPoint } from './b01_town_common.js';
import { createEgg, addEggToParty, EGG_TEXT } from '../../world/eggs.js';

/** Casillas del epílogo en Villa Alba y en las casas (mapas de B01; ver content/maps/b01/README.md). */
export const EPI = Object.freeze({
  labyrinth: Object.freeze({ x: 20, y: 11 }), // piedra central del Laberinto (CHAMBER.core): nodo de la Red
  gate: Object.freeze({ x: 22, y: 9, dir: 8 }), // ante el Agente Olmedo (puesto 22,8)
  mom: Object.freeze({ x: 10, y: 26 }), // puerta de casa (10,25)
  meet: Object.freeze({ x: 10, y: 27, dir: 8 }),
  alerceFrom: Object.freeze({ x: 19, y: 27 }),
  alerceAt: Object.freeze({ x: 11, y: 27 }),
  gaelTable: Object.freeze({ x: 8, y: 7 }), // esquina de la mesa de la casa de Gael (la nota y el huevo)
  tv: Object.freeze({ x: 7, y: 6, dir: 8 }), // ante la tele del salón
  bed: Object.freeze({ x: 8, y: 6, dir: 2 }), // junto a la cama (casa_prota_2f)
});

// ─────────────────────────────── Columna Lanza → Laberinto → Villa Alba ───────────────────────────────

/** Del nodo del Laberinto a la verja de Villa Alba (fundido) con la casa como punto de cura (la madre cura). */
async function labyrinthToGate(ctx) {
  await ctx.fade('out', 30);
  await ctx.warp('villa_alba', EPI.gate.x, EPI.gate.y, EPI.gate.dir, { fade: false });
  setHomeHealPoint(ctx); // hasta ahora era el último del Origen (B20): una derrota en el pueblo no manda a la Sima
  await ctx.fade('in', 30);
}

/** Salto de vuelta (auto en Columna Lanza tras la resolución) y llegada a la verja de Villa Alba. */
export async function returnHome(ctx) {
  // Zygarde adopta la Forma 10 % y lleva al jugador de vuelta, sin hablar (autor, 25-09-2026).
  await becomeTenPercent(ctx);
  await convergenceTravel(ctx, { to: 'laberinto_profundidad', x: EPI.labyrinth.x, y: EPI.labyrinth.y, dir: 2 });
  ctx.setFlag(F.epilogueBack);
  await landFromJump(ctx);
  setClock(ctx.state, 18, 0);
  await pause(ctx, 20);
  await labyrinthToGate(ctx);
}

/**
 * Nodo de Columna Lanza tras el final (postgame): el Salto devuelve al nodo del Laberinto y a la verja de Villa Alba.
 * Salida de seguridad mientras B22 no abra la Red de Convergencia: el mapa prohíbe Vuelo y Cuerda Huida (el final
 * no deja volver hasta terminar), así que sin esto un regreso en el postgame no tendría salida.
 */
export async function leaveColumna(ctx) {
  await ctx.say(EPILOGUE_TEXT.nodeAwake);
  const go = await ctx.choice(['Sí', 'No'], { message: EPILOGUE_TEXT.nodeAsk, cancel: 1 });
  if (go !== 0) return false;
  await becomeTenPercent(ctx);
  await convergenceTravel(ctx, { to: 'laberinto_profundidad', x: EPI.labyrinth.x, y: EPI.labyrinth.y, dir: 2 });
  await landFromJump(ctx);
  await labyrinthToGate(ctx);
  return true;
}

// ─────────────────────────────── Villa Alba ───────────────────────────────

async function walkPlayerTo(ctx, x, y) {
  const route = stageRoute(ctx, ctx.player, x, y);
  if (route.length) await ctx.move('player', route, { through: false, speed: 4 });
}

async function olmedoScene(ctx) {
  const cop = eventById(ctx, 'policia');
  if (cop) {
    ctx.face(cop, 'down');
    await ctx.emote(cop, '!');
  }
  await lines(ctx, SPEAKER.olmedo, EPILOGUE_TEXT.olmedo);
  ctx.setFlag(F.epilogueOlmedo);
}

async function momScene(ctx) {
  const mom = eventById(ctx, 'b21_mama_puerta');
  await ctx.camera.pan(EPI.mom.x, EPI.mom.y, 40);
  if (mom) await ctx.emote(mom, '!');
  await ctx.camera.reset(40);
  await walkPlayerTo(ctx, EPI.meet.x, EPI.meet.y);
  ctx.face('player', 'up');
  if (mom) ctx.face(mom, 'down');
  await lines(ctx, SPEAKER.mom, EPILOGUE_TEXT.mom);
  ctx.setFlag(F.epilogueMom);
}

async function alerceScene(ctx) {
  await ctx.say(EPILOGUE_TEXT.momAlerce, { speaker: SPEAKER.mom });
  const alerce = ctx.world.spawnEvent?.({ id: '__alerce', x: EPI.alerceFrom.x, y: EPI.alerceFrom.y, sprite: SPRITE.alerce, dir: 4 });
  if (alerce) {
    const route = stageRoute(ctx, alerce, EPI.alerceAt.x, EPI.alerceAt.y);
    await ctx.move(alerce, [...route, 'turn_left'], { speed: 3.5 });
  }
  ctx.face('player', 'right');
  await lines(ctx, SPEAKER.alerce, EPILOGUE_TEXT.alerce);
  await ctx.giveItem('ALERCEKEY');
  ctx.setFlag(F.alerceKeyGiven);
  await ctx.say(EPILOGUE_TEXT.alerceKey, { speaker: SPEAKER.alerce });
  await ctx.say(EPILOGUE_TEXT.alerceBye);
  if (alerce) {
    await ctx.move(alerce, ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'], { speed: 3.5 });
    ctx.world.removeEvent?.(alerce);
  }
}

async function momGoesHome(ctx) {
  const mom = eventById(ctx, 'b21_mama_puerta');
  ctx.face('player', 'up');
  await lines(ctx, SPEAKER.mom, EPILOGUE_TEXT.momGael);
  if (mom) {
    await ctx.move(mom, ['up'], { speed: 3 });
    ctx.se?.('door_enter');
  }
  ctx.setFlag(F.momInside);
}

/** Parte guiada del pueblo (auto al llegar por la verja; se reanuda por flags si algo la corta). */
export async function villageEpilogue(ctx) {
  ctx.bgm(MUSIC.village);
  if (!ctx.flag(F.epilogueOlmedo)) await olmedoScene(ctx);
  if (!ctx.flag(F.epilogueMom)) await momScene(ctx);
  if (!ctx.flag(F.alerceKeyGiven)) await alerceScene(ctx);
  if (!ctx.flag(F.montageDone)) {
    const p = ctx.player;
    await guardiansMontage(ctx, { map: 'villa_alba', x: p.x, y: p.y, dir: 8 });
  }
  if (!ctx.flag(F.momInside)) await momGoesHome(ctx);
}

/** Eventos que añade Villa Alba (villa_alba.js). */
export function b21VillaAlbaEvents() {
  return [
    {
      id: 'b21_epilogo_pueblo', x: 0, y: 1, trigger: 'auto',
      when: when({ all: [F.epilogueBack], none: [F.momInside] }), script: villageEpilogue,
    },
    {
      id: 'b21_mama_puerta', x: EPI.mom.x, y: EPI.mom.y, name: SPEAKER.mom, sprite: SPRITE.mom, dir: 2,
      when: when({ all: [F.epilogueBack], none: [F.momInside] }), trigger: 'action',
      script: async (ctx) => { await ctx.say(EPILOGUE_TEXT.momGael[1], { speaker: SPEAKER.mom }); },
    },
  ];
}

// ─────────────────────────────── Casa de Gael ───────────────────────────────

/** Especie del huevo: el inicial de Gael (var gael_starter de B01; si falta, el que tiene ventaja sobre el del jugador). */
export function gaelEggSpecies(state) {
  const v = String(state.var(V.gaelStarter, '') || '').toUpperCase();
  if (['LITTEN', 'SOBBLE', 'TURTWIG'].includes(v)) return v;
  const mine = String(state.var('starter', '') || '').toUpperCase();
  return { TURTWIG: 'LITTEN', LITTEN: 'SOBBLE', SOBBLE: 'TURTWIG' }[mine] || 'LITTEN';
}

/** Entrega el huevo (o lo deja esperando si el equipo está lleno). → true si se entregó. */
export async function giveGaelEgg(ctx) {
  if (ctx.flag(F.gaelEggGiven)) return true;
  const egg = createEgg(ctx.db, gaelEggSpecies(ctx.state), { ot: { name: ctx.state.player.name, id: ctx.state.player.id }, metMap: 'villa_alba' });
  if (!addEggToParty(ctx.state, egg)) {
    ctx.setFlag(F.gaelEggWaiting);
    await ctx.say(EPILOGUE_TEXT.eggFull);
    return false;
  }
  ctx.me?.('egg_get');
  await ctx.say(EGG_TEXT.received);
  ctx.setFlag(F.gaelEggGiven);
  ctx.setFlag(F.gaelEggWaiting, false);
  return true;
}

async function noteScript(ctx) {
  if (!ctx.flag(F.gaelNoteRead)) {
    await ctx.say(EPILOGUE_TEXT.gaelTable);
    await ctx.say(EPILOGUE_TEXT.gaelNote);
    ctx.setFlag(F.gaelNoteRead);
  } else if (!ctx.flag(F.gaelEggGiven)) {
    await ctx.say(EPILOGUE_TEXT.eggNow);
  } else {
    await ctx.say(EPILOGUE_TEXT.gaelNoteAgain);
    return;
  }
  await giveGaelEgg(ctx);
}

/** Eventos que añade la casa de Gael (casa_gael.js). */
export function b21CasaGaelEvents() {
  const t = EPI.gaelTable;
  const eggPage = (row) => ({
    when: (s) => s.flag(F.epilogueBack) && !s.flag(F.gaelEggGiven) && gaelEggSpecies(s) === row.species,
    sprite: SPRITE.egg, dir: row.dir, pattern: 0, directionFix: true, walkAnime: false, stepAnime: false, trigger: 'action', script: noteScript,
  });
  return [
    {
      id: 'b21_casa_vacia', x: 0, y: 0, trigger: 'auto',
      when: when({ all: [F.epilogueBack], none: [F.gaelHouseSeen] }),
      script: async (ctx) => { ctx.setFlag(F.gaelHouseSeen); await ctx.say(EPILOGUE_TEXT.gaelHouse); },
    },
    {
      id: 'b21_nota_gael', x: t.x, y: t.y, name: 'Nota de Gael', noOver: true, solid: true,
      pages: [
        { when: (s) => s.flag(F.epilogueBack), sprite: SPRITE.objects, dir: 4, pattern: 0, directionFix: true, walkAnime: false, stepAnime: false, trigger: 'action', script: noteScript },
        ...Object.entries(EGG_ROW).map(([species, dir]) => eggPage({ species, dir })),
      ],
    },
  ];
}

// ─────────────────────────────── Casa: la tele, el carguero, créditos y despertar ───────────────────────────────

/** Despertar en el cuarto (mañana): Zygarde sigue en Forma Completa; empieza el postgame. */
export async function wakeUp(ctx) {
  const { setForm } = await import('../../world/zygarde/progression.js');
  setClock(ctx.state, 8, 0);
  setForm(ctx.state, 'complete');
  ctx.scene?.refreshFollower?.();
  setHomeHealPoint(ctx);
  ctx.heal?.();
  await pause(ctx, 40);
  await ctx.fade('in', 60);
  await ctx.say(EPILOGUE_TEXT.wake);
  ctx.face('player', 'down');
  await pause(ctx, 20);
  await ctx.say(EPILOGUE_TEXT.formNote);
  ctx.setFlag(F.epilogueEnd);
  await ctx.say(EPILOGUE_TEXT.postgame);
  if (typeof document !== 'undefined' && (await ctx.confirm(EPILOGUE_TEXT.save))) {
    try {
      await ctx.ui.openSave();
    } catch (err) {
      console.error('[b21] guardar', err);
    }
  }
}

/** La tele (auto al entrar en casa tras la nota de Gael) → carguero → créditos → despertar. */
export async function tvScene(ctx) {
  const mom = eventById(ctx, 'mama');
  if (mom) {
    ctx.face(mom, ctx.player);
    await ctx.emote(mom, '!');
  }
  await ctx.say(EPILOGUE_TEXT.tvMom, { speaker: SPEAKER.mom });
  await walkPlayerTo(ctx, EPI.tv.x, EPI.tv.y);
  ctx.face('player', 'up');
  ctx.se?.('GUI trainer card flip');
  await ctx.flash([200, 220, 255], 8, 90);
  await lines(ctx, SPEAKER.tv, EPILOGUE_TEXT.tv);
  ctx.setFlag(F.tvNews);
  await shipScene(ctx, { map: 'casa_prota_1f', x: EPI.tv.x, y: EPI.tv.y, dir: 8 });
  if (mom) ctx.face(mom, ctx.player);
  await lines(ctx, SPEAKER.mom, EPILOGUE_TEXT.momAfterTv);
  await creditsRoll(ctx);
  await ctx.warp('casa_prota_2f', EPI.bed.x, EPI.bed.y, EPI.bed.dir, { fade: false });
  ctx.bgm(MUSIC.village, { fadeOutPrevious: 30 });
  await wakeUp(ctx);
}

/** Eventos que añade la planta baja de casa (casa_prota_1f.js). */
export function b21CasaEvents() {
  return [
    {
      id: 'b21_tele', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.gaelNoteRead], none: [F.tvNews] }), script: tvScene,
    },
    {
      id: 'b21_mama_aviso', x: 1, y: 0, trigger: 'auto',
      when: when({ all: [F.momInside], none: [F.gaelNoteRead, F.momGaelHint] }),
      script: async (ctx) => {
        ctx.setFlag(F.momGaelHint);
        await ctx.say(EPILOGUE_TEXT.momHome, { speaker: SPEAKER.mom });
      },
    },
  ];
}

/** Eventos que añade el cuarto (casa_prota_2f.js): si los créditos terminaron sin despertar, se despierta al entrar. */
export function b21CuartoEvents() {
  return [{
    id: 'b21_despertar', x: 0, y: 1, trigger: 'auto', when: when({ all: [F.creditsDone], none: [F.epilogueEnd] }),
    script: async (ctx) => {
      await ctx.fade('out', 1);
      placePlayer(ctx, EPI.bed.x, EPI.bed.y, EPI.bed.dir);
      await wakeUp(ctx);
    },
  }];
}

/** ¿Está el jugador en la parte guiada del epílogo? (para pruebas). */
export const inGuidedEpilogue = (s) => s.flag(F.epilogueBack) && !s.flag(F.momInside);
export { byGender };
