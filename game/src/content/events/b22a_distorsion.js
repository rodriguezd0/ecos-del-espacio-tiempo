// Mundo Distorsión profundo (docs/CAMPANA.md B22: «Giratina · Mundo Distorsión profundo (por el aljibe) · Anclaje
// espacial · Fijar tres "caras" con el Anclaje; la Griseosfera está dentro. Forma Origen, nv 75, captura desde el
// turno 3»; §1.6; X16). Se baja por el aljibe: en la explanada interior (B12) se abre en el postgame una grieta nueva
// hacia la Hondura (distorsion_honda), con la primera losa que gira sin parar (tutorial del Anclaje) y, más abajo, el
// Corazón (distorsion_corazon): tres caras giran alrededor de un corazón de piedra cerrado; cuando las tres miran al
// corazón a la vez, se abre. Dentro, la Griseosfera; al cogerla, Giratina sube del vacío. Caer al vacío devuelve al
// último poste sin daño (espacio imposible de B12, world/impossible/).
import { F, OBJ, VIOLET, GREEN, isPostgame, legendReady, when, zygardeSays, zygardeLines, pause, eventById, fadeEvent } from './b22a_common.js';
import { DIST_TEXT } from './b22a_texts.js';
import { HONDA, CORAZON, EXPLANADA_B22A } from '../maps/b22a/layout.js';
import { faceEvents } from './b22a_faces.js';
import { heartReady, anchoredOf, pointsTo } from './b22a_faces_logic.js';
import { isVoidCell } from '../../world/impossible/logic.js';
import { giratinaRequest, legendBattle } from './b22a_legends.js';

// ───────────────────────────── bajada: explanada del aljibe → Hondura ─────────────────────────────

/** Media vuelta de pantalla y caída al otro lado (como el aljibe de B12). */
async function descend(ctx, map, at) {
  const scene = ctx.scene;
  ctx.se?.('PRSFX- Shadow Force1', { volume: 70 });
  await ctx.flash?.([...VIOLET], 20, 170);
  try {
    if (scene?.fx?.rotateTo) {
      ctx.fade?.('out', 40, [50, 30, 70]);
      await scene.fx.rotateTo(Math.PI, 40, 0.7);
    } else if (ctx.fade) await ctx.fade('out', 24);
    await ctx.warp(map, at.x, at.y, at.dir ?? 8, { fade: false });
  } finally {
    scene?.fx?.rotateTo?.(0, 0, 1);
    if (ctx.fade) await ctx.fade('in', 30);
  }
}

async function grietaScript(ctx) {
  await ctx.say(DIST_TEXT.grieta);
  if (!ctx.flag(F.grietaVista)) {
    ctx.setFlag(F.grietaVista);
    await zygardeLines(ctx, DIST_TEXT.grietaZygarde);
  }
  if (!(await ctx.confirm(DIST_TEXT.grietaAsk))) return;
  await descend(ctx, 'distorsion_honda', HONDA.arrival);
}

/** Evento que añade la explanada interior del aljibe (pilar_invertido, B12): la grieta del postgame. */
export function explanadaB22aEvents() {
  const g = EXPLANADA_B22A.grieta;
  return [{
    id: 'b22a_grieta_honda', x: g.x, y: g.y, name: 'Grieta',
    pages: [{
      when: isPostgame, sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, shadow: false,
      solid: true, trigger: 'action', script: grietaScript,
      glow: { name: 'softLight', radius: 60, intensity: 0.55, pulse: 0.5, color: [150, 90, 220] },
    }],
  }];
}

/** Grieta de vuelta a la explanada (se pisa). */
function portalBack(id, at, text) {
  const r = EXPLANADA_B22A.returnArrival;
  return {
    id, x: at.x, y: at.y, name: 'Grieta', sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true,
    through: true, shadow: false, trigger: 'touch', glow: { name: 'softLight', radius: 52, intensity: 0.5, pulse: 0.5, color: [190, 120, 255] },
    script: async (ctx) => {
      await ctx.say(text);
      if (!(await ctx.confirm(DIST_TEXT.exitAsk))) return;
      ctx.se?.('PRSFX- Teleport', { volume: 60 });
      await ctx.warp('pilar_invertido', r.x, r.y, r.dir, { fade: true, frames: 24 });
    },
  };
}

// ───────────────────────────── La Hondura ─────────────────────────────

async function hondaArrival(ctx) {
  ctx.setFlag(F.hondaLlegada);
  await pause(ctx, 16);
  await ctx.say(DIST_TEXT.hondaArrival);
  await zygardeSays(ctx, DIST_TEXT.hondaZygarde);
  await ctx.say(DIST_TEXT.faceIntro);
}

/** La sombra de Giratina cruza el vacío de la Hondura (una vez): eco de B12, ahora «sí nos busca». */
async function shadowScene(ctx) {
  // Una casilla de la franja que haya quedado en el vacío (borde irregular de la isla): primero se cae.
  if (ctx.map && ctx.player && isVoidCell(ctx.map, ctx.player.x, ctx.player.y)) return;
  ctx.setFlag(F.sombraHonda);
  const scene = ctx.scene;
  // Como en el Sumidero (B12): solo baja la música; la sombra es una masa casi negra con un contorno violeta tenue.
  const now = ctx.audio?.nowPlaying?.();
  if (now?.name) ctx.bgm(now.name, { volume: 22 });
  try {
    const url = scene?.panorama ? (await import('../../core/engine.js')).engine.assets.anil('Graphics/Pokemon/Front/GIRATINA_1.png') : null;
    const pass = scene?.panorama?.silhouette?.({
      url, scale: 3, from: [760, 120], to: [-240, 180], frames: 200, alpha: 0.95, color: [0.0, 0.0, 0.004], rim: [0.40, 0.22, 0.56],
    });
    await pause(ctx, 210);
    if (pass) await Promise.race([pass, pause(ctx, 30)]);
  } catch (err) {
    console.warn('[b22a] sombra de Giratina', err);
    await pause(ctx, 200);
  } finally {
    if (now?.name) ctx.bgm(now.name, { volume: 100 });
  }
  await pause(ctx, 16);
  await zygardeSays(ctx, DIST_TEXT.shadowZygarde);
}

export function hondaEvents() {
  const H = HONDA;
  const out = [
    { id: 'b22a_honda_llegada', x: H.arrival.x, y: H.arrival.y, through: true, trigger: 'auto', when: when({ none: [F.hondaLlegada] }), script: hondaArrival },
    ...faceEvents(H.face, H.posts),
    ...H.anchors.map((a) => ({ id: `b22a_${a.id}`, type: 'ancla', x: a.x, y: a.y })),
    portalBack('b22a_grieta_vuelta_honda', H.portalBack, DIST_TEXT.portalBack),
    {
      id: 'b22a_grieta_corazon', x: H.portalDown.x, y: H.portalDown.y, name: 'Grieta', sprite: OBJ.portal, dir: 2, directionFix: true,
      walkAnime: false, stepAnime: true, through: true, shadow: false, trigger: 'touch',
      glow: { name: 'softLight', radius: 60, intensity: 0.55, pulse: 0.5, color: [190, 120, 255] },
      script: async (ctx) => {
        await ctx.say(DIST_TEXT.portalDown);
        ctx.se?.('PRSFX- Teleport', { volume: 60 });
        const a = CORAZON.arrival;
        await ctx.warp('distorsion_corazon', a.x, a.y, a.dir, { fade: true, frames: 24 });
      },
    },
    ...Array.from({ length: H.bridge.y1 - H.bridge.y0 + 1 }, (_, i) => ({ id: `b22a_puente_honda_${i}`, type: 'puenteMirada', x: H.bridge.x, y: H.bridge.y0 + i })),
    ...Array.from({ length: H.shadowStrip.x1 - H.shadowStrip.x0 + 1 }, (_, i) => ({
      id: `b22a_sombra_${i}`, x: H.shadowStrip.x0 + i, y: H.shadowStrip.y, through: true, trigger: 'touch',
      when: when({ none: [F.sombraHonda] }), script: shadowScene,
    })),
    ...H.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, ...(it.hidden ? { hidden: true } : {}) })),
  ];
  return out;
}

// ───────────────────────────── El Corazón ─────────────────────────────

const faceById = (id) => CORAZON.faces.find((f) => f.id === id);

async function corazonArrival(ctx) {
  ctx.setFlag(F.corazonLlegada);
  await pause(ctx, 16);
  await ctx.say(DIST_TEXT.corazonArrival);
  await zygardeLines(ctx, DIST_TEXT.corazonZygarde);
}

/** Las tres caras miran al corazón: se abre (una sola vez; después queda abierto). */
async function openHeart(ctx) {
  if (ctx.flag(F.corazonAbierto)) return;
  ctx.se?.('PRSFX- Origin Pulse', { volume: 70 });
  ctx.shake?.(5, 6, 40);
  await ctx.flash?.([230, 200, 255], 24, 200);
  await ctx.say(DIST_TEXT.opening);
  ctx.setFlag(F.corazonAbierto);
  ctx.requestRefresh?.();
  await pause(ctx, 10);
  await zygardeSays(ctx, DIST_TEXT.openingZygarde);
}

/** Tras anclar o soltar una cara del Corazón: si las tres miran al corazón, se abre. */
async function afterFaceChange(ctx) {
  if (!ctx.flag(F.corazonAbierto) && heartReady(ctx.state, CORAZON.faces)) await openHeart(ctx);
}

function markEvents() {
  const out = [];
  for (const [id, at] of Object.entries(CORAZON.marks)) {
    const face = faceById(id);
    const lit = (s) => pointsTo(face, anchoredOf(s, face), face.heart);
    const base = { sprite: OBJ.corazon, directionFix: true, walkAnime: false, shadow: false, trigger: 'action', noOver: true };
    out.push({
      id: `b22a_marca_${id}`, x: at.x, y: at.y, name: 'Marca',
      pages: [
        { ...base, when: (s) => !s.flag(F.corazonAbierto) && !lit(s), dir: 6, solid: true, script: async (ctx) => { await ctx.say(DIST_TEXT.markOff); } },
        { ...base, when: (s) => !s.flag(F.corazonAbierto) && lit(s), dir: 8, stepAnime: true, speed: 2, solid: true, light: { radius: 44, intensity: 0.7 }, script: async (ctx) => { await ctx.say(DIST_TEXT.markOn); } },
        { ...base, when: (s) => s.flag(F.corazonAbierto), dir: 8, through: true, trigger: null, script: null },
      ],
    });
  }
  return out;
}

/** Muro del corazón: anillo de bloques (capa 1) que se deshace al abrirse (parche persistente). */
function heartWallEvent() {
  const h = CORAZON.heart;
  const ring = [];
  for (let y = h.y0; y <= h.y1; y++) for (let x = h.x0; x <= h.x1; x++) {
    if (x === h.x0 || x === h.x1 || y === h.y0 || y === h.y1) ring.push([x, y, 1, 0]);
  }
  return { id: 'b22a_muro_corazon', x: h.x0, y: h.y0, through: true, pages: [{ when: when({ all: [F.corazonAbierto] }), through: true, patch: ring }] };
}

// ─── Griseosfera y Giratina ───

async function giratinaFight(ctx) {
  await ctx.say(DIST_TEXT.giratinaRule);
  if (!(await ctx.confirm(DIST_TEXT.giratinaAsk))) return;
  ctx.cry?.('GIRATINA', 1);
  await legendBattle(ctx, 'giratina', giratinaRequest(), {
    retry: null, loseText: DIST_TEXT.giratinaLose, caughtText: DIST_TEXT.giratinaCaught, faintedText: DIST_TEXT.giratinaFainted,
  });
}

async function orbScript(ctx) {
  if (ctx.flag(F.griseosfera)) { await ctx.say(DIST_TEXT.pedestalEmpty); return; }
  await ctx.say(DIST_TEXT.orb);
  if (!(await ctx.confirm(DIST_TEXT.orbAsk))) return;
  await ctx.giveItem('GRISEOUSORB', 1, { found: true });
  ctx.setFlag(F.griseosfera);
  ctx.requestRefresh?.();
  // Giratina sube del vacío
  ctx.se?.('PRSFX- Shadow Force1', { volume: 80 });
  ctx.shake?.(6, 5, 60);
  await ctx.say(DIST_TEXT.rise);
  const g = eventById(ctx, 'b22a_giratina');
  if (g) { g.opacity = 0; await fadeEvent(ctx, g, 255, 30); }
  ctx.cry?.('GIRATINA', 1);
  await ctx.flash?.([120, 60, 160], 20, 180);
  await zygardeLines(ctx, DIST_TEXT.giratinaZygarde);
  await giratinaFight(ctx);
}

async function giratinaTalk(ctx) {
  await ctx.say(DIST_TEXT.giratinaWaits);
  await giratinaFight(ctx);
}

function heartEvents() {
  const C = CORAZON;
  return [
    {
      id: 'b22a_griseosfera', x: C.pedestal.x, y: C.pedestal.y, name: 'Pedestal',
      pages: [
        { sprite: OBJ.corazon, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: orbScript, light: { radius: 64, intensity: 0.8 }, glow: { name: 'softLight', radius: 70, intensity: 0.5, pulse: 0.4, color: [...[220, 205, 150]] } },
        { when: when({ all: [F.griseosfera] }), sprite: OBJ.corazon, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: orbScript },
      ],
    },
    {
      id: 'b22a_giratina', x: C.giratina.x, y: C.giratina.y, name: 'Giratina',
      pages: [{
        when: (s) => s.flag(F.griseosfera) && legendReady(s, 'giratina'), sprite: 'follower:GIRATINA:1:0', dir: 2, stepAnime: true, speed: 2,
        directionFix: true, solid: true, trigger: 'action', script: giratinaTalk, light: { radius: 90, intensity: 0.8 },
      }],
    },
    {
      id: 'b22a_grieta_salida_corazon', x: C.exitHeart.x, y: C.exitHeart.y, name: 'Grieta',
      pages: [{
        when: when({ all: [F.corazonAbierto, F.griseosfera] }), sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true,
        through: true, shadow: false, trigger: 'touch', glow: { name: 'softLight', radius: 52, intensity: 0.5, pulse: 0.5, color: [190, 120, 255] },
        script: portalBack('x', C.exitHeart, DIST_TEXT.exitHeart).script,
      }],
    },
  ];
}

export function corazonEvents() {
  const C = CORAZON;
  return [
    { id: 'b22a_corazon_llegada', x: C.arrival.x, y: C.arrival.y, through: true, trigger: 'auto', when: when({ none: [F.corazonLlegada] }), script: corazonArrival },
    ...C.faces.flatMap((f) => faceEvents(f, C.posts, { onChange: afterFaceChange })),
    ...C.anchors.map((a) => ({ id: `b22a_${a.id}`, type: 'ancla', x: a.x, y: a.y })),
    ...markEvents(),
    heartWallEvent(),
    // Red de seguridad: si las tres caras ya miran al corazón (p. ej. al cargar partida), se abre al entrar.
    { id: 'b22a_corazon_apertura', x: 0, y: 0, through: true, trigger: 'auto', when: (s) => !s.flag(F.corazonAbierto) && heartReady(s, C.faces), script: openHeart },
    ...heartEvents(),
    portalBack('b22a_grieta_vuelta_corazon', C.portalBack, DIST_TEXT.portalBack),
    ...C.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1 })),
  ];
}

export { GREEN };
