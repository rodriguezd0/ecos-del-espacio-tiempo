// T01 · Tabla Pradal: «La Arboleda de los Nombres» (docs/TABLILLAS.md §4.5 T01, Crónica I; CAMPANA B03 punto 1).
// Villa Zaguán (mapa de B02): este módulo aporta los eventos del arco, que villa_zaguan añade a los suyos.
//   Pista inicial: calco de la Libreta (la abre B02 con b02_libreta). Segunda pista: el jardinero (el Árbol del
//   Fundador se seca desde la raíz y la hierba muerta forma una espiral). Problema: el consejo quiere talarlo;
//   Mirta (9) se ata a él. Puzzle: subir al campanario —la única vista cenital— y ver que el centro de la espiral
//   está unos pasos más allá, bajo un banco de piedra; el latido del Core lo confirma; se excava y aparece la
//   Tablilla, que robaba el agua a las raíces. Consecuencia: el árbol se recupera y no se tala; Mirta regala una
//   Semilla Milagro. Sin estado de fallo. Disponible tras P1 (clues.js: available p1_restored).
// Coordenadas: ARBOLEDA y CAMPANARIO de maps/b02/villa_zaguan_layout.js (fuente única de B02).
import * as ZL from '../maps/b02/villa_zaguan_layout.js';
import { F, SPEAKER, SPRITE, OBJ, objectEvent, say, core, zygardeEmote } from './b03_common.js';

const DEF_ARBOLEDA = { area: { x: 9, y: 6, w: 8, h: 10 }, founder: { x: 9, y: 8 }, bench: { x: 14, y: 14 } };
const DEF_CAMPANARIO = { bell: { x: 35, y: 6 } };
const ARB = ZL.ARBOLEDA || DEF_ARBOLEDA;
const CAMP = ZL.CAMPANARIO || DEF_CAMPANARIO;

/** Flag temporal de la excavación (el banco se aparta mientras se cava). */
const DIGGING = 'b03_t01_cavando';

/**
 * Lugares del arco: el banco de piedra de B02 (3 casillas centradas en ARBOLEDA.bench, «6 casillas al este del
 * tronco») es el centro de la espiral. Mirta, atada al Fundador, junto al tronco (al este).
 */
export const T01_SITE = Object.freeze({
  area: ARB.area,
  founderTrunk: [{ x: ARB.founder.x, y: ARB.founder.y + 5 }, { x: ARB.founder.x + 1, y: ARB.founder.y + 5 }],
  bench: { x: ARB.bench.x, y: ARB.bench.y },
  mirta: { x: ARB.founder.x + 2, y: ARB.founder.y + 5, dir: 4 },
  gardener: { x: ARB.area.x + ARB.area.w - 1, y: ARB.area.y + ARB.area.h - 1, dir: 8 },
  council: { x: ARB.area.x - 1, y: ARB.area.y + ARB.area.h - 1, dir: 6 },
  bell: [{ x: CAMP.bell.x, y: CAMP.bell.y + 3 }, { x: CAMP.bell.x + 1, y: CAMP.bell.y + 3 }],
});

/** Eventos genéricos de B02 (b02_zaguan.js) que el arco sustituye en las mismas casillas. */
export const T01_REPLACES = Object.freeze(['banco_piedra', 'banco_piedra_o', 'banco_piedra_e', 'campana_0', 'campana_1']);

/**
 * Une los eventos de Villa Zaguán (B02) con los del arco T01: quita los genéricos del banco y la campana (que el
 * arco sustituye en las mismas casillas) y añade los de T01. Uso en villa_zaguan.js: `events: withT01(zaguanEvents(…))`.
 */
export function withT01(events) {
  return [...events.filter((e) => !T01_REPLACES.includes(e.id)), ...t01ZaguanEvents()];
}

/**
 * Espiral de hierba muerta (puro): del pie del Árbol del Fundador hacia el centro, bajo el banco. Devuelve casillas
 * ordenadas de fuera a dentro, sin repetir y dentro de la Arboleda.
 */
export function spiralCells(site = T01_SITE) {
  const c = site.bench;
  const root = site.founderTrunk[1];
  // Espiral cuadrada de dos vueltas: sale del pie del Fundador (al este del tronco), rodea la Arboleda por el sur,
  // el este y el norte, y se cierra sobre el banco. Tramos [dx, dy, pasos] desde el pie del tronco.
  const legs = [[0, 1, 2], [1, 0, 6], [0, -1, 6], [-1, 0, 5], [0, 1, 2], [1, 0, 4], [0, 1, 3], [-1, 0, 2], [0, -1, 2], [1, 0, 1], [0, 1, 1]];
  const out = [{ x: root.x + 1, y: root.y }];
  let { x, y } = out[0];
  for (const [dx, dy, n] of legs) {
    for (let i = 0; i < n; i++) {
      x += dx;
      y += dy;
      out.push({ x, y });
    }
  }
  // Con la Arboleda de B02 el último paso cae en el centro del banco; si B02 mueve el banco, se traslada la
  // vuelta interior (las 12 últimas casillas) para que la espiral siga acabando bajo su losa central.
  const last = out[out.length - 1];
  const sx = c.x - last.x;
  const sy = c.y - last.y;
  const n = out.length;
  return out.map((p, i) => (i >= n - 12 ? { x: p.x + sx, y: p.y + sy } : p));
}

const avail = (s) => Boolean(s?.flag(F.p1));
const done = (s) => Boolean(s?.flag(F.t01Done));
/** ¿La casilla del evento es césped libre? (sin mapa —validación en Node— se da por buena). */
const freeCell = (ev) => !ev?.map || (ev.map.passableStrict(ev.x, ev.y) && !ev.map.data(ev.x, ev.y, 2));

// ── Diálogos ───────────────────────────────────────────────────────────────────────────────
const J = SPEAKER.gardener;
const M = SPEAKER.mirta;
const C = SPEAKER.council;

async function gardenerTalk(ctx) {
  if (done(ctx.state)) {
    await say(ctx, J, 'El Fundador vuelve a beber. Mira las hojas de abajo: ya no amarillean.');
    await say(ctx, J, 'Cuarenta años cuidando esta arboleda y nunca se me ocurrió subir al campanario a mirarla.');
    return;
  }
  if (!avail(ctx.state)) {
    await say(ctx, J, 'El Árbol del Fundador está enfermo. No sé qué le pasa: la tierra se seca a su alrededor por mucho que riegue.');
    return;
  }
  if (ctx.flag(F.t01View)) {
    await say(ctx, J, '¿Lo has visto desde arriba? ¿El centro no está en el árbol? ¿Bajo el banco de piedra?');
    await say(ctx, J, 'Ese banco lleva ahí desde antes que la escuela. Si hay que apartarlo, te echo una mano.');
    return;
  }
  await say(ctx, J, '¿Ves la hierba? Se está muriendo a trozos, y no al azar.');
  await say(ctx, J, 'El Fundador se seca desde la raíz. Y la hierba muerta… gira. Como un remolino alrededor de algo.');
  await say(ctx, J, 'Desde aquí abajo no hay forma de verla entera. Solo el campanero la vería, allá arriba, junto a la campana.');
  if (!ctx.flag(F.t01Gardener)) {
    ctx.setFlag(F.t01Gardener);
    await ctx.story.advanceClue('T01', 2);
  }
}

async function mirtaTalk(ctx) {
  if (done(ctx.state)) {
    if (!ctx.flag(F.t01Seed)) {
      await say(ctx, M, '¡Ya no se va a morir! Y mi árbol tampoco se queda solo.');
      await ctx.giveItem('MIRACLESEED');
      ctx.setFlag(F.t01Seed);
      await say(ctx, M, 'La encontré en la raíz de mi árbol cuando era pequeña. Bueno, más pequeña. Es para ti.');
      return;
    }
    await say(ctx, M, 'Mi árbol se llama como yo. Algún día será tan alto como el Fundador.');
    return;
  }
  await say(ctx, M, '¡No me voy a mover! Me he atado al Fundador con la cuerda de tender de mi madre.');
  await say(ctx, M, 'Mi árbol de nombre está al lado. Si talan el Fundador, el mío se queda solo.');
  if (avail(ctx.state)) await say(ctx, M, 'Tú no vienes a talarlo, ¿verdad? Pues ayúdame a que no lo talen.');
}

async function councilTalk(ctx) {
  if (done(ctx.state)) {
    await say(ctx, C, 'El árbol se ha enderezado un palmo en una mañana. No me preguntes cómo.');
    await say(ctx, C, 'Si el Fundador se recupera, el consejo no tiene nada que talar. Así constará en el acta.');
    return;
  }
  await say(ctx, C, 'El consejo lo ha decidido: el Fundador se inclina sobre la escuela. Con un temblor más, se nos cae encima de los críos.');
  await say(ctx, C, 'Mañana viene la cuadrilla con las sierras. Y esa niña… a ver quién la desata.');
}

async function founderLook(ctx) {
  if (done(ctx.state)) {
    await ctx.say('El Árbol del Fundador. Las hojas vuelven a estar verdes y la corteza ya no cruje.');
    return;
  }
  await ctx.say('El Árbol del Fundador. La corteza está reseca y las hojas de abajo, amarillas. Se inclina hacia la escuela.');
}

// ── Vista cenital desde el campanario ──────────────────────────────────────────────────────
async function belfryView(ctx) {
  const cells = spiralCells();
  const c = T01_SITE.bench;
  const handles = [];
  await ctx.fade('out', 16);
  await ctx.say('Subes por la escalerilla hasta el hueco de la campana. Desde aquí arriba se ve todo Zaguán.');
  // Centrada en el banco: toda la espiral queda por encima de la caja de mensajes.
  await ctx.camera.pan(c.x - 1, c.y, 1);
  await ctx.wait(4);
  await ctx.fade('in', 24);
  await ctx.wait(30);
  await ctx.say('La Arboleda de los Nombres, vista desde lo alto…');
  for (const cell of cells) {
    try {
      handles.push(ctx.effect('softLight', { x: cell.x, y: cell.y, radius: 26, color: [255, 214, 120], intensity: 0.55, pulse: 0 }));
    } catch (err) {
      console.warn('[b03] rastro de la espiral', err);
    }
    await ctx.wait(3);
  }
  try {
    handles.push(ctx.effect('softLight', { x: c.x, y: c.y, radius: 60, color: [255, 236, 170], intensity: 0.8, pulse: 0.4 }));
  } catch (err) {
    console.warn('[b03] centro de la espiral', err);
  }
  ctx.se('core_signal', { volume: 60 });
  await ctx.say('La hierba seca dibuja una espiral. Empieza al pie del Árbol del Fundador…');
  await ctx.say('…y su centro no está en el árbol. Está unos pasos más allá, justo bajo el banco de piedra.');
  await core(ctx, 'Desde aquí late más fuerte. Allí abajo.');
  for (const h of handles) h?.remove?.(20);
  await ctx.fade('out', 16);
  await ctx.camera.reset(1);
  await ctx.fade('in', 16);
  ctx.setFlag(F.t01View);
  await ctx.story.advanceClue('T01', 2, { silent: true });
}

async function bellTalk(ctx) {
  if (done(ctx.state)) {
    await ctx.say('La campana de Zaguán. Desde aquí arriba, la Arboleda vuelve a ser verde de punta a punta.');
    return;
  }
  if (!avail(ctx.state)) {
    await ctx.say('La campana de Zaguán, en su armazón de madera. Una escalerilla sube hasta el hueco.');
    return;
  }
  if (!(await ctx.confirm('Una escalerilla sube hasta el hueco de la campana. ¿Subir a mirar el pueblo?'))) return;
  await belfryView(ctx);
}

// ── Excavación bajo el banco ───────────────────────────────────────────────────────────────
async function digScene(ctx) {
  ctx.se('core_signal', { volume: 70 });
  await ctx.flash([185, 255, 102], 10, 60);
  await zygardeEmote(ctx, '!');
  await core(ctx, 'Aquí. Algo late bajo la piedra. No es mío… pero es muy antiguo.');
  if (!(await ctx.confirm('¿Apartar el banco de piedra y cavar debajo?'))) return;
  await ctx.fade('out', 20);
  ctx.setFlag(DIGGING, true);
  await ctx.say('El jardinero trae una pala. Entre los dos apartáis el banco y caváis donde estaba.');
  ctx.se('PRSFX- Dig1');
  // Un paso atrás para que se vea el hoyo (el jugador está delante del banco, mirando hacia él).
  const back = { 2: 'up', 4: 'right', 6: 'left', 8: 'down' }[ctx.player.direction] || 'down';
  await ctx.move('player', ['direction_fix_on', back, 'direction_fix_off'], { through: false });
  await ctx.wait(20);
  await ctx.fade('in', 20);
  await ctx.wait(20);
  await ctx.say('A un palmo de hondo, la pala tropieza con algo liso. Una tabla de piedra verdosa, fresca y húmeda…');
  await say(ctx, J, 'La tierra de alrededor está seca como el polvo, y la tabla, empapada. Se estaba bebiendo el agua de las raíces.');
  await ctx.story.giveTablet('MEADOWPLATE');
  ctx.setFlag(DIGGING, false);
  ctx.setFlag(F.t01Done);
  ctx.se('Anim/Saint7');
  await ctx.flash([200, 255, 170], 20, 140);
  await ctx.shake(2, 4, 20);
  await ctx.say('Un crujido suave recorre la Arboleda. Las raíces del Fundador vuelven a beber.');
  await core(ctx, 'La hierba ya no tiene sed.');
}

async function benchTalk(ctx) {
  if (done(ctx.state)) {
    await ctx.say('El banco de piedra, otra vez en su sitio. La tierra removida de debajo ya empieza a verdear.');
    return;
  }
  if (!avail(ctx.state) || !ctx.flag(F.t01View)) {
    await ctx.say('Un banco de piedra muy antiguo, con musgo en las juntas. La hierba de alrededor está seca.');
    return;
  }
  await digScene(ctx);
}

// ── Eventos ────────────────────────────────────────────────────────────────────────────────
function spiralEvents() {
  const benchSet = new Set([-1, 0, 1].map((d) => `${T01_SITE.bench.x + d},${T01_SITE.bench.y}`));
  return spiralCells()
    .filter((c) => !benchSet.has(`${c.x},${c.y}`))
    .map((c, i) => ({
      ...objectEvent(`t01_hierba_${i}`, c.x, c.y, OBJ.dryGrass(i)),
      pages: [
        { when: (s, ev) => !done(s) && freeCell(ev), ...OBJ.dryGrass(i) },
        ...(i % 2 === 0 ? [{ when: (s, ev) => done(s) && freeCell(ev), ...OBJ.newGrass }] : []),
      ],
    }));
}

function benchEvents() {
  const b = T01_SITE.bench;
  const parts = [OBJ.benchL, OBJ.benchM, OBJ.benchR];
  const out = parts.map((p, i) => ({
    ...objectEvent(`t01_banco_${i}`, b.x - 1 + i, b.y, p),
    through: false, trigger: 'action', when: (s) => !s?.flag(DIGGING), script: benchTalk,
  }));
  // Si la excavación se cortara a medias (error al dar la Tablilla), el hoyo retoma la escena: nunca queda bloqueada.
  out.push(objectEvent('t01_hoyo', b.x, b.y, OBJ.holeGlint, {
    when: (s) => Boolean(s?.flag(DIGGING)), trigger: 'action', script: benchTalk,
  }));
  out.push(objectEvent('t01_brote', b.x - 1, b.y + 1, OBJ.sprout, { when: done }));
  return out;
}

/** Eventos del arco T01 para villa_zaguan (B02 los añade a los suyos). */
export function t01ZaguanEvents() {
  const s = T01_SITE;
  return [
    ...spiralEvents(),
    ...benchEvents(),
    {
      id: 't01_jardinero', x: s.gardener.x, y: s.gardener.y, sprite: SPRITE.gardener, dir: s.gardener.dir,
      move: 'look', trigger: 'action', script: gardenerTalk,
    },
    {
      id: 't01_mirta', x: s.mirta.x, y: s.mirta.y, sprite: SPRITE.mirta, dir: s.mirta.dir, move: 'still',
      trigger: 'action', script: mirtaTalk,
      pages: [{ when: (st) => !st?.flag(F.t01Seed) }, { when: (st) => Boolean(st?.flag(F.t01Seed)), move: 'look' }],
    },
    {
      id: 't01_concejal', x: s.council.x, y: s.council.y, sprite: SPRITE.council, dir: s.council.dir,
      move: 'still', trigger: 'action', script: councilTalk,
    },
    ...s.founderTrunk.map((t, i) => ({ id: `t01_fundador_${i}`, x: t.x, y: t.y, trigger: 'action', noOver: true, solid: true, script: founderLook })),
    // Sólidos como los de B02 a los que sustituyen: la fila baja del armazón de la campana es pisable en el tileset.
    ...s.bell.map((t, i) => ({ id: `t01_campana_${i}`, x: t.x, y: t.y, trigger: 'action', noOver: true, solid: true, script: bellTalk })),
  ];
}

export const T01_FLAGS = Object.freeze({ digging: DIGGING });
