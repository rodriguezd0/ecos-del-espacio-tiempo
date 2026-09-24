// T10 · «La cuadrilla perdida» (docs/TABLILLAS.md T10), segunda parte, en la Ruta 10 alta: tramo de sigilo entre
// centinelas Honchkrow que dan la alarma (mientras el campamento está activo acuden los técnicos de guardia; después,
// la bandada) y devuelven al último punto seguro (como en B01); la cuadrilla atrapada en la cornisa (Trepar), el
// dormidero con el Honchkrow Alfa (nivel 42, captura opcional, reaparece al descansar) junto a la Tabla Oscura y,
// al final, la deserción de Nilo, que entrega los planos de la Estación Talasa (conduce a N4, B13).
// Los centinelas giran con un reloj determinista (SENTINELS: dirección = f(fotograma)) para que el ritmo se pueda
// leer en pantalla y comprobar en las pruebas. Módulo puro salvo los guiones.
import {
  F, V, SPEAKER, SPRITE, OBJ, MUSIC, TELEPATHY, when, lines, zygardeSays, byGender, placePlayer, pause, wildBossBattle,
} from './b11_common.js';
import { sightReach } from './b01_north_stealth.js';
import { HONCHKROW_ALFA } from '../encounters/b11.js';
import { RUTA10 } from '../maps/b11/layout.js';

const R = RUTA10;
const ARC = 'T10';
export const SIGHT = 3;

/**
 * Centinelas del pinar muerto. `dirs` = direcciones que miran en ciclo; cada una dura `period` fotogramas (60 = 1 s),
 * desfasadas por `phase`. Las rocas, matas y el tronco caído del mapa cortan su vista.
 */
export const SENTINELS = Object.freeze([
  Object.freeze({ id: 'centinela_1', x: 37, y: 6, dirs: [2, 6], period: 150, phase: 0 }),
  Object.freeze({ id: 'centinela_2', x: 40, y: 9, dirs: [2, 4, 8], period: 120, phase: 40 }),
  Object.freeze({ id: 'centinela_3', x: 44, y: 10, dirs: [4, 2, 8], period: 130, phase: 70 }),
  Object.freeze({ id: 'centinela_4', x: 47, y: 8, dirs: [4, 2], period: 140, phase: 20 }),
]);

/** Dirección de un centinela en el fotograma `frame` del mapa. */
export function sentinelDir(s, frame) {
  return s.dirs[Math.floor((frame + s.phase) / s.period) % s.dirs.length];
}

export const T10_TEXT = Object.freeze({
  alarm: '¡Craaa! ¡Un Honchkrow ha dado la voz de alarma!',
  guard: [
    '¡Eh! ¿Quién anda ahí?',
    'Esta ladera está acordonada por el Consorcio. Por su seguridad, vuelva por donde ha venido.',
  ],
  flock: 'Una bandada de Murkrow se lanza en picado desde los pinos y te obliga a retroceder.',
  firstCaught: 'Nos ven desde las ramas. Que no te miren.',
  crewHello: ['¡Alguien! ¡Por fin!', 'No te acerques al borde. Esos Honchkrow…'],
  crewStuck: 'Subimos por las raíces huyendo de ellos y ahora no sabemos bajar. Mira esa pared.',
  crewNilo: '¿Has visto a Nilo? Corrió ladera abajo. Pensábamos que…',
  crewNiloOk: (who) => `¿Está bien? …Menos mal. Gracias por venir, ${who}.`,
  crewZygarde: 'Puedo sostenerlos. Que no miren abajo.',
  crewVeins: 'Zygarde tiende vetas verdes por la pared: raíces vivas que sujetan como una escala.',
  crewThanks: 'Gracias. De verdad. Te esperamos abajo.',
  alfaIntro: 'Un Honchkrow enorme vigila el dormidero. A sus pies brilla algo oscuro.',
  alfaBack: 'El Honchkrow Alfa ha vuelto a su dormidero.',
  alfaLost: 'Has tenido que retirarte del dormidero. Tu equipo ha recuperado fuerzas.',
  plateSeen: 'Entre plumas negras y ramitas hay una losa oscura que brilla.',
  plateZygarde: 'La guardaban como un tesoro. Como si supieran lo que es.',
  descend: 'Bajas de la cornisa. Al pie de la pared te esperan la cuadrilla… y Nilo.',
  desertion: {
    hello: '¡Estáis bien! Pensé que…',
    crew: (who) => `Nos ha bajado ese Zygarde. Y ${who}.`,
    intro: 'Soy Nilo. Cuando los Honchkrow se nos echaron encima, yo… corrí. Llevo dos noches escondido en el bosque.',
    thanks: 'Gracias. No sé cómo…',
    campGone: 'El campamento ya no está. Se han llevado las cajas y se han ido.',
    campGoneNilo: '…Sin esperarnos.',
    campActive: 'Volvemos al campamento. La jefa querrá el parte.',
    notBack: 'Yo no vuelvo.',
    speech: [
      'Medimos cosas que no entendemos, en sitios que no son nuestros. Y cuando sale mal, cada uno corre por su lado.',
      'Lo dejo.',
      'Toma. Son los planos de la Estación Talasa, la plataforma que Genesis tiene en el mar del sur. Yo ya no los necesito.',
      'Dicen que abajo, en un tanque de presión, guardan una muestra que llaman «Z-4». Que brilla en verde… como tu compañero.',
      'Tú quizá sí los necesites.',
    ],
    speechZygarde: 'Una parte de mí. Encerrada, bajo el agua.',
    plans: 'Nilo te ha dado los planos de la Estación Talasa.',
    bye: 'Si alguna vez bajo al sur, será para otra cosa. Cuídate.',
  },
});

/** Nota de la Libreta con los planos (no ocupa hueco de pista). */
export const PLANS_NOTE = Object.freeze({
  id: 'b11_planos_talasa',
  text: 'Planos de la Estación Talasa, de Nilo: la plataforma de Genesis en el mar del sur. Abajo, en un tanque de presión, guardan la «Muestra Z-4».',
});

export const sentinelsActive = (s) => Boolean(s) && !s.flag(F.alfaBeaten) && !s.flag(F.alfaCaught);
const campActive = (s) => !s.flag(F.exp03Taken);

/** Te ha visto un centinela: alarma, fundido y vuelta al punto seguro (lo alto de la pared de raíces). */
async function caught(ctx) {
  ctx.cry?.('HONCHKROW');
  ctx.se?.('exclaim');
  await ctx.emote(ctx.event, '!');
  await ctx.say(T10_TEXT.alarm);
  if (campActive(ctx.state)) await lines(ctx, SPEAKER.guardia, T10_TEXT.guard);
  else await ctx.say(T10_TEXT.flock);
  await ctx.fade('out', 18);
  const n = Number(ctx.var(V.caught, 0)) + 1;
  ctx.setVar(V.caught, n);
  await placePlayer(ctx, R.safe);
  await pause(ctx, 12);
  await ctx.fade('in', 18);
  if (n === 1) await zygardeSays(ctx, T10_TEXT.firstCaught);
}

const CONE = Object.freeze({ name: 'visionCone', reach: (ev) => sightReach(ev, SIGHT), color: [255, 150, 190], width: 26 });

function sentinelEvents() {
  const out = SENTINELS.map((s) => ({
    id: s.id, x: s.x, y: s.y, name: 'Honchkrow',
    pages: [{
      when: sentinelsActive, sprite: SPRITE.honchkrow, dir: s.dirs[0], move: 'still', stepAnime: true, speed: 2,
      trigger: 'eventTouch', sight: SIGHT, glow: CONE, script: caught,
    }],
  }));
  // Reloj de los centinelas: gira cada uno según SENTINELS (turnGeneric → onTurned comprueba si ve al jugador).
  out.push({
    id: 'centinelas_reloj', x: 0, y: 0,
    pages: [{
      when: sentinelsActive, trigger: 'parallel',
      script: async (ctx) => {
        const frame = ctx.scene?.frame ?? 0;
        for (const s of SENTINELS) {
          const ev = ctx.world.events.find((e) => e.id === s.id);
          const d = sentinelDir(s, frame);
          if (ev && !ev.erased && ev.page && ev.direction !== d) ev.turnGeneric(d);
        }
        await pause(ctx, 4);
      },
    }],
  });
  return out;
}

// ------------------------------------------------------------------ cornisa y dormidero

async function crewTalk(ctx) {
  await lines(ctx, SPEAKER.tecnica, T10_TEXT.crewHello);
  await ctx.say(T10_TEXT.crewStuck, { speaker: SPEAKER.tecnico });
  if (!ctx.flag(F.crewFound)) {
    ctx.setFlag(F.crewFound);
    // Descubrimiento directo (TABLILLAS §4.2): el arco empieza aunque no se haya encontrado a Nilo.
    await ctx.story.openClue(ARC, { direct: true, silent: ctx.flag(F.niloMet) });
    if (!ctx.flag(F.niloTold)) await ctx.story.advanceClue(ARC, 2, { silent: true });
  }
  await ctx.say(T10_TEXT.crewNilo, { speaker: SPEAKER.tecnica });
  if (ctx.flag(F.niloMet)) await ctx.say(T10_TEXT.crewNiloOk(byGender(ctx.state, 'chaval', 'chavala')), { speaker: SPEAKER.tecnica });
  await zygardeSays(ctx, T10_TEXT.crewZygarde);
  ctx.se?.('core_signal', { volume: 60 });
  await ctx.flash?.([150, 255, 120], 20, 120);
  await ctx.say(T10_TEXT.crewVeins);
  await ctx.say(T10_TEXT.crewThanks, { speaker: SPEAKER.tecnico });
  await ctx.fade('out', 20);
  ctx.setFlag(F.crewSaved);
  await pause(ctx, 20);
  await ctx.fade('in', 20);
  await maybeDesertion(ctx);
}

function crewEvents() {
  return R.crew.map((c, i) => ({
    id: `cuadrilla_${i}`, x: c.x, y: c.y, name: i ? 'Técnica' : 'Técnico',
    pages: [{
      when: when({ none: [F.crewSaved] }), sprite: i ? SPRITE.tecnica : SPRITE.tecnico, dir: c.dir, move: 'still',
      trigger: 'action', script: crewTalk,
    }],
  }));
}

const alfaPresent = (s) => Boolean(s) && !s.flag(F.alfaCaught)
  && (!s.flag(F.alfaBeaten) || Number(s.var(V.restCount, 0)) > Number(s.var(V.alfaRest, -1)));

async function alfaFight(ctx) {
  ctx.cry?.('HONCHKROW');
  await ctx.say(ctx.flag(F.alfaBeaten) ? T10_TEXT.alfaBack : T10_TEXT.alfaIntro);
  const retry = { x: R.cornisa.to[0], y: R.cornisa.to[1], dir: 6 };
  const request = { type: 'wild', wild: { ...HONCHKROW_ALFA }, bgm: MUSIC.boss };
  const outcome = await wildBossBattle(ctx, request, retry, { loseText: T10_TEXT.alfaLost });
  if (outcome === 'caught' || outcome === 'win') {
    if (outcome === 'caught') ctx.setFlag(F.alfaCaught);
    ctx.setFlag(F.alfaBeaten);
    ctx.setVar(V.alfaRest, ctx.var(V.restCount, 0));
    if (!ctx.flag(F.darkPlate)) await ctx.say(T10_TEXT.plateSeen);
  }
}

async function takePlate(ctx) {
  await ctx.story.giveTablet('DREADPLATE');
  ctx.setFlag(F.darkPlate);
  await zygardeSays(ctx, T10_TEXT.plateZygarde);
  await maybeDesertion(ctx);
}

function roostEvents() {
  const { alfa, plate } = R.roost;
  return [
    {
      id: 'honchkrow_alfa', x: alfa.x, y: alfa.y, name: 'Honchkrow Alfa',
      pages: [{ when: alfaPresent, sprite: SPRITE.honchkrow, dir: alfa.dir, move: 'still', stepAnime: true, trigger: 'action', script: alfaFight }],
    },
    {
      id: 'tabla_oscura', x: plate.x, y: plate.y, name: 'Tablilla',
      pages: [{
        when: (s) => Boolean(s) && (s.flag(F.alfaBeaten) || s.flag(F.alfaCaught)) && !s.flag(F.darkPlate),
        sprite: OBJ.plate, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, trigger: 'action',
        script: takePlate,
      }],
    },
  ];
}

// ------------------------------------------------------------------ deserción de Nilo

const DESERT_SPOT = Object.freeze({ nilo: { x: 46, y: 9, dir: 8 }, crew: [{ x: 45, y: 9, dir: 8 }, { x: 47, y: 9, dir: 8 }] });

/** Cuando ya están la cuadrilla a salvo y la Tablilla, Nilo espera al pie de la cornisa y deserta. */
export async function maybeDesertion(ctx) {
  if (!ctx.flag(F.crewSaved) || !ctx.flag(F.darkPlate) || ctx.flag(F.niloDeserts)) return false;
  const D = T10_TEXT.desertion;
  await ctx.fade('out', 20);
  ctx.setFlag('b11_t10_espera'); // muestra a Nilo y la cuadrilla al pie de la cornisa
  const [fx, fy] = R.cornisa.from;
  await placePlayer(ctx, { x: fx, y: fy, dir: 2 });
  await pause(ctx, 10);
  await ctx.fade('in', 20);
  await ctx.say(T10_TEXT.descend);
  await ctx.say(D.hello, { speaker: SPEAKER.nilo });
  await ctx.say(D.crew(byGender(ctx.state, 'este chaval', 'esta chavala')), { speaker: SPEAKER.tecnica });
  // Si no se le encontró en el Neblino (descubrimiento directo del T10), Nilo se presenta aquí.
  if (!ctx.flag(F.niloMet)) {
    ctx.setFlag(F.niloMet);
    await ctx.say(D.intro, { speaker: SPEAKER.nilo });
  }
  await ctx.say(D.thanks, { speaker: SPEAKER.nilo });
  if (ctx.flag(F.exp03Taken)) {
    await ctx.say(D.campGone, { speaker: SPEAKER.tecnico });
    await ctx.say(D.campGoneNilo, { speaker: SPEAKER.nilo });
  } else {
    await ctx.say(D.campActive, { speaker: SPEAKER.tecnico });
    await ctx.say(D.notBack, { speaker: SPEAKER.nilo });
  }
  await lines(ctx, SPEAKER.nilo, D.speech);
  await zygardeSays(ctx, D.speechZygarde);
  ctx.me?.('key_item_get');
  ctx.state.addClue(PLANS_NOTE.id, PLANS_NOTE.text);
  ctx.setFlag(F.talasaPlans);
  await ctx.say(D.plans);
  await ctx.say(D.bye, { speaker: SPEAKER.nilo });
  await ctx.fade('out', 20);
  ctx.setFlag(F.niloDeserts);
  await pause(ctx, 10);
  await ctx.fade('in', 20);
  return true;
}

function desertionEvents() {
  const waiting = when({ all: ['b11_t10_espera'], none: [F.niloDeserts] });
  const { nilo, crew } = DESERT_SPOT;
  return [
    { id: 'nilo_ruta10', x: nilo.x, y: nilo.y, name: 'Nilo', pages: [{ when: waiting, sprite: SPRITE.nilo, dir: nilo.dir, move: 'still' }] },
    ...crew.map((c, i) => ({
      id: `cuadrilla_abajo_${i}`, x: c.x, y: c.y, pages: [{ when: waiting, sprite: i ? SPRITE.tecnica : SPRITE.tecnico, dir: c.dir, move: 'still' }],
    })),
  ];
}

/** Paredes de Trepar de la cornisa (subir desde (46,7), bajar desde (46,3)). */
function cornisaWalls() {
  const c = R.cornisa;
  const [fx, fy] = c.from;
  const [tx, ty] = c.to;
  return [
    { id: 'pared_cornisa_sube', type: 'climbWall', x: fx, y: fy - 1, to: [tx, ty], h: 3, sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true },
    { id: 'pared_cornisa_baja', type: 'climbWall', x: tx, y: ty + 1, to: [fx, fy], down: true, glow: false },
  ];
}

export function t10Events() {
  return [...sentinelEvents(), ...cornisaWalls(), ...crewEvents(), ...roostEvents(), ...desertionEvents()];
}

export { TELEPATHY };
