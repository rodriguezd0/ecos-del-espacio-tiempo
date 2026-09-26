// Estancias 3–5 del Archivo Hondo (docs/CAMPANA.md B10):
//   3 Lectura: la custodia lee un relato de glifos; el jugador lo compone en la puerta glífica (el texto queda en la
//     Libreta). 4 Rollos: reproducir el orden en que el custodio coloca rollos en la estantería (C046 detrás).
//   5 Sala del Mural: seis paneles que se ordenan según la historia; los errores no penalizan; cada Tablilla que se
//     tenga añade una pista opcional. Manantial que cura antes de la Guardiana.
// Reglas puras en b10_hondo_logic.js.
import { F, V, SPEAKER, SPRITE, OBJ, frame, lines, eventById, when } from './b10_common.js';
import { ecoEvent, ecoAppear, ecoVanish, ecoMove, stepsTo, runEco, gateEvents } from './b10_hondo_eco.js';
import {
  RELATO, GLYPHS, DOOR_GLYPHS, touchGlyph, relatoPlain,
  SCROLL_SEQUENCE, SCROLL_COLORS, SCROLL_LABELS, EMPTY_SLOTS, slotColor, remainingScrolls, placeScroll,
  PANELS, panelById, muralOrder, placePanel, muralSolved, muralCorrect, panelHints,
} from './b10_hondo_logic.js';
import { LECTURA, ROLLOS, MURAL } from '../maps/b10/hondo_layout.js';

export const ROOMS_TEXT = Object.freeze({
  losa: 'Una losa con anillos grabados. Al pisarla, el aire huele a papel viejo…',
  stele: 'Una estela cubierta de glifos. Debajo, más pequeño: «Lo que aquí se lee, allí se escribe.»',
  doorIntro: 'Una losa de piedra cierra el paso bajo el dintel, con seis glifos en relieve. La Pokédex reconoce cada uno por separado.',
  doorAsk: '¿Qué glifo tocas?',
  doorLit: 'El glifo se enciende con una luz dorada.',
  doorWrong: 'La puerta suelta un zumbido grave y todos los glifos se apagan.',
  doorOpen: 'Los seis glifos brillan a la vez. La losa se hunde hasta quedar a ras del suelo, sin un ruido.',
  doorDone: 'La puerta glífica está abierta.',
  relatoNote: (t) => `Relato de la Estancia de la Lectura: ${t}`,
  relatoSaved: 'El relato queda copiado en la Libreta.',
  cubbyFull: 'Ya hay un rollo en este hueco.',
  cubbyAsk: '¿Qué rollo colocas en este hueco?',
  cubbyEmpty: 'Un hueco vacío de la estantería.',
  scrollsFall: 'Los rollos resbalan de la estantería y ruedan de vuelta a la cesta.',
  scrollOk: 'El rollo encaja en el hueco con un clic.',
  rollosDone: 'Al fondo de la estancia, la losa del dintel del noroeste se retira.',
  rollosGate: 'Una losa cierra el paso bajo el dintel. Tiene cuatro muescas de colores.',
  basket: 'Una cesta con rollos de colores: rojo, azul, verde y ocre.',
  basketReset: '¿Devuelves los rollos de la estantería a la cesta?',
  muralIntro: 'Seis paneles de piedra, cada uno con una escena. Parecen fuera de su sitio.',
  muralAsk: '¿Qué panel pones en este hueco?',
  muralKeep: 'Dejarlo así',
  muralDone: 'Los seis paneles se iluminan de izquierda a derecha. Al este de la sala, la losa del dintel se hunde.',
  muralCount: (n) => {
    if (n >= 6) return '';
    const inPlace = n === 0 ? 'Ningún panel parece' : n === 1 ? 'Un panel parece' : `${['dos', 'tres', 'cuatro', 'cinco'][n - 2]} paneles parecen`;
    return `Algo no encaja todavía. (${inPlace.charAt(0).toUpperCase()}${inPlace.slice(1)} en su sitio.)`;
  },
  muralGate: 'Una losa cierra el paso bajo el dintel. En ella hay seis huecos vacíos, en fila.',
  spring: 'El agua del manantial está tibia y huele a papel viejo. Tus Pokémon beben y se recuperan.',
});

// ------------------------------------------------------------ Estancia 3 · Lectura

async function lecturaEco(ctx) {
  await runEco(async () => {
    await ctx.say(ROOMS_TEXT.losa);
    const ev = eventById(ctx, 'eco_lectura');
    await ecoAppear(ctx, ev, { at: LECTURA.reader, dir: 8 });
    await ctx.wait(20);
    for (const line of RELATO) await ctx.say(line.text, { speaker: SPEAKER.custodia });
    await ctx.wait(10);
    await ecoVanish(ctx, ev);
  });
}

const glyphStep = (s) => Math.max(0, Number(s?.var?.(V.glyphStep, 0)) || 0);

async function glyphDoor(ctx) {
  if (ctx.flag(F.lectura)) { await ctx.say(ROOMS_TEXT.doorDone); return; }
  await ctx.say(ROOMS_TEXT.doorIntro);
  const labels = DOOR_GLYPHS.map((g) => GLYPHS[g]);
  for (;;) {
    const i = await ctx.choice([...labels, 'Nada'], { message: ROOMS_TEXT.doorAsk, cancel: labels.length });
    if (i < 0 || i >= labels.length) return;
    const r = touchGlyph(glyphStep(ctx.state), DOOR_GLYPHS[i]);
    ctx.setVar(V.glyphStep, r.step);
    if (!r.ok) {
      ctx.se('PRSFX- Confuse Ray', { volume: 70 });
      await ctx.say(ROOMS_TEXT.doorWrong);
      return;
    }
    ctx.se('PRSFX- Heal Bell', { volume: 60, pitch: 90 + r.step * 8 });
    if (r.done) { await openGlyphDoor(ctx); return; }
    await ctx.say(ROOMS_TEXT.doorLit);
  }
}

async function openGlyphDoor(ctx) {
  await ctx.flash([255, 236, 180], 16, 140);
  ctx.setFlag(F.lectura);
  ctx.se('Door slide', { volume: 90 });
  ctx.shake(2, 5, 20);
  await ctx.say(ROOMS_TEXT.doorOpen);
  ctx.state.addClue('b10_relato', ROOMS_TEXT.relatoNote(relatoPlain()));
  ctx.se('GUI trainer card flip');
  await ctx.say(ROOMS_TEXT.relatoSaved);
}

function lecturaEvents() {
  const L = LECTURA;
  const out = [];
  for (const dx of [0, 1]) {
    out.push({ id: `estela_lectura_${dx}`, x: L.stele.x + dx, y: L.stele.y + 1, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(ROOMS_TEXT.stele); } });
  }
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push({ id: `losa_lectura_${dx}${dy}`, x: L.losa.x + dx, y: L.losa.y + dy, trigger: 'touch', through: true, when: when({ none: [F.lectura] }), script: lecturaEco });
  }
  out.push(ecoEvent('eco_lectura', L.reader, { name: SPEAKER.custodia, sprite: SPRITE.custodia }));
  // Puerta glífica (3 casillas): un umbral bajo (se aborda desde el norte; un sprite alto taparía al jugador) con el
  // sprite en el centro y los lados sólidos mientras está cerrada. Abierta, la losa queda a ras de suelo, encendida.
  const closed = (s) => Boolean(s) && !s.flag(F.lectura);
  out.push({
    id: 'puerta_glifica', x: L.door.x, y: L.door.y,
    pages: [
      ...[0, 1, 2, 3, 4, 5].map((k) => ({
        when: (s) => closed(s) && glyphStep(s) === k,
        sprite: OBJ.threshold, ...frame(k), solid: true, shadow: false, trigger: 'action', script: glyphDoor,
      })),
      { when: (s) => Boolean(s) && s.flag(F.lectura), sprite: OBJ.threshold, ...frame(6), through: true, shadow: false },
    ],
  });
  for (const dx of [-1, 1]) {
    out.push({ id: `puerta_glifica_${dx < 0 ? 'o' : 'e'}`, x: L.door.x + dx, y: L.door.y, pages: [{ when: closed, solid: true, trigger: 'action', script: glyphDoor }] });
  }
  return out;
}

// ------------------------------------------------------------ Estancia 4 · Rollos

const scrollStep = (s) => Math.max(0, Number(s?.var?.(V.scrollStep, 0)) || 0);
const scrollSlots = (s) => String(s?.var?.(V.scrollSlots, EMPTY_SLOTS) || EMPTY_SLOTS);
const FRAME_OF = Object.freeze({ rojo: 1, azul: 2, verde: 3, ocre: 4 });

async function rollosEco(ctx) {
  await runEco(async () => {
    await ctx.say(ROOMS_TEXT.losa);
    const ev = eventById(ctx, 'eco_rollos');
    const home = ROLLOS.custodio;
    await ecoAppear(ctx, ev, { at: home, dir: 8 });
    const cubbies = ROLLOS.cubbies.map((_, i) => eventById(ctx, `hueco_rollo_${i}`));
    for (const c of cubbies) if (c) Object.assign(c, { direction: 2, pattern: 0 });
    let at = home;
    for (const { color, cubby } of SCROLL_SEQUENCE) {
      await ecoMove(ctx, ev, ['turn_up', { wait: 10 }]); // coge el rollo de la cesta
      const spot = { x: ROLLOS.cubbies[cubby].x, y: ROLLOS.cubbies[cubby].y + 1 };
      await ecoMove(ctx, ev, [{ speed: 3.5 }, ...stepsTo(at, spot), 'turn_up']);
      await ctx.wait(10);
      ctx.se('GUI summary change page', { volume: 70 });
      const f = frame(FRAME_OF[color]);
      if (cubbies[cubby]) { cubbies[cubby].direction = f.dir; cubbies[cubby].pattern = f.pattern; }
      await ecoMove(ctx, ev, [...stepsTo(spot, home)]);
      at = home;
    }
    await ctx.wait(30);
    await ecoVanish(ctx, ev);
    // La estantería vuelve a como la dejó el jugador.
    const slots = scrollSlots(ctx.state);
    cubbies.forEach((c, i) => {
      if (!c) return;
      const f = frame(FRAME_OF[slotColor(slots, i)] || 0);
      c.direction = f.dir; c.pattern = f.pattern;
    });
    await ctx.say('El eco se deshace. En la estantería solo quedan los rollos que has puesto tú.');
  });
}

async function openRollos(ctx) {
  ctx.setFlag(F.rollos);
  ctx.se('Door slide', { volume: 90 });
  ctx.shake(3, 6, 24);
  await ctx.wait(20);
  await ctx.say(ROOMS_TEXT.rollosDone);
}

async function cubbyScript(ctx, i) {
  if (ctx.flag(F.rollos)) { await ctx.say(`Un rollo ${slotColor(scrollSlots(ctx.state), i) || ''} bien colocado.`.replace(' .', '.')); return; }
  const slots = scrollSlots(ctx.state);
  if (slotColor(slots, i)) { await ctx.say(ROOMS_TEXT.cubbyFull); return; }
  const left = remainingScrolls(slots);
  const labels = left.map((c) => SCROLL_LABELS[c]);
  const k = await ctx.choice([...labels, 'Nada'], { message: ROOMS_TEXT.cubbyAsk, cancel: labels.length });
  if (k < 0 || k >= labels.length) return;
  const r = placeScroll(scrollStep(ctx.state), slots, left[k], i);
  if (!r.ok) {
    ctx.setVar(V.scrollStep, 0);
    ctx.setVar(V.scrollSlots, EMPTY_SLOTS);
    ctx.se('PRSFX- Rock Throw1', { volume: 60 });
    await ctx.say(ROOMS_TEXT.scrollsFall);
    return;
  }
  ctx.setVar(V.scrollSlots, r.slots);
  ctx.setVar(V.scrollStep, r.step);
  ctx.se('GUI summary change page', { volume: 80 });
  await ctx.say(ROOMS_TEXT.scrollOk);
  if (r.done) await openRollos(ctx);
}

function rollosEvents() {
  const R = ROLLOS;
  const out = R.cubbies.map((pos, i) => ({
    id: `hueco_rollo_${i}`, x: pos.x, y: pos.y, name: 'Estantería',
    pages: [null, ...SCROLL_COLORS].map((color) => ({
      when: (s) => Boolean(s) && slotColor(scrollSlots(s), i) === color,
      sprite: OBJ.cubby, ...frame(color ? FRAME_OF[color] : 0), solid: true, shadow: false, trigger: 'action',
      script: (ctx) => cubbyScript(ctx, i),
    })),
  }));
  out.push({
    id: 'cesta_rollos', x: R.basket.x, y: R.basket.y, sprite: OBJ.scroll, dir: 2, pattern: 0, directionFix: true, walkAnime: false,
    shadow: false, solid: true, trigger: 'action',
    script: async (ctx) => {
      await ctx.say(ROOMS_TEXT.basket);
      if (ctx.flag(F.rollos) || scrollSlots(ctx.state) === EMPTY_SLOTS) return;
      if (!(await ctx.confirm(ROOMS_TEXT.basketReset))) return;
      ctx.setVar(V.scrollStep, 0);
      ctx.setVar(V.scrollSlots, EMPTY_SLOTS);
    },
  });
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push({ id: `losa_rollos_${dx}${dy}`, x: R.losa.x + dx, y: R.losa.y + dy, trigger: 'touch', through: true, when: when({ none: [F.rollos] }), script: rollosEco });
  }
  out.push(ecoEvent('eco_rollos', R.custodio, { name: SPEAKER.custodio }));
  out.push(...gateEvents('losa_rollos', R.gate, F.rollos, ROOMS_TEXT.rollosGate));
  return out;
}

// ------------------------------------------------------------ Estancia 5 · Sala del Mural

const muralNow = (s) => muralOrder(s?.var?.(V.mural, null));

async function panelScript(ctx, slot) {
  const order = muralNow(ctx.state);
  const panel = panelById(order[slot]);
  if (!ctx.flag(F.muralSeen)) {
    ctx.setFlag(F.muralSeen);
    await ctx.say(ROOMS_TEXT.muralIntro);
  }
  await ctx.say(`${panel.name}: ${panel.text}`);
  for (const hint of panelHints(panel, ctx.state.data.tablets || [])) await ctx.say(`Te recuerda a la Libreta. ${hint}`);
  if (ctx.flag(F.mural)) return;
  const names = PANELS.map((p) => p.name);
  const k = await ctx.choice([...names, ROOMS_TEXT.muralKeep], { message: ROOMS_TEXT.muralAsk, cancel: names.length, index: panel.n - 1 });
  if (k < 0 || k >= names.length || PANELS[k].n === panel.n) return;
  const next = placePanel(order, slot, PANELS[k].n);
  ctx.setVar(V.mural, next);
  ctx.se('Door slide', { volume: 50, pitch: 130 });
  await ctx.wait(10);
  if (muralSolved(next)) { await muralDone(ctx); return; }
  await ctx.say(ROOMS_TEXT.muralCount(muralCorrect(next)));
}

async function muralDone(ctx) {
  ctx.setFlag(F.mural);
  for (let i = 0; i < 6; i++) { ctx.se('PRSFX- Heal Bell', { volume: 55, pitch: 80 + i * 10 }); await ctx.wait(10); }
  await ctx.flash([255, 230, 180], 20, 150);
  ctx.se('Door slide', { volume: 90 });
  ctx.shake(3, 6, 24);
  await ctx.say(ROOMS_TEXT.muralDone);
}

function muralEvents() {
  const M = MURAL;
  const out = M.panels.map((pos, slot) => ({
    id: `panel_mural_${slot}`, x: pos.x, y: pos.y, name: 'Mural',
    pages: PANELS.map((p) => ({
      when: (s) => Boolean(s) && muralNow(s)[slot] === String(p.n),
      sprite: OBJ.mural, ...frame(p.n), solid: true, shadow: false, trigger: 'action',
      script: (ctx) => panelScript(ctx, slot),
    })),
  }));
  // Huecos entre paneles (el panel mide dos casillas): sólidos, se leen igual que el panel de su izquierda.
  M.panels.forEach((pos, slot) => out.push({ id: `panel_mural_${slot}_d`, x: pos.x + 1, y: pos.y, solid: true, trigger: 'action', noOver: true, script: (ctx) => panelScript(ctx, slot) }));
  out.push(...gateEvents('losa_mural', M.gate, F.mural, ROOMS_TEXT.muralGate));
  const heal = async (ctx) => {
    ctx.se('PRSFX- Aqua Ring1', { volume: 70 });
    ctx.heal();
    await ctx.say(ROOMS_TEXT.spring);
  };
  out.push(
    { id: 'manantial_s', x: M.spring.x + 1, y: M.spring.y + 2, trigger: 'action', noOver: true, solid: true, script: heal },
    { id: 'manantial_o', x: M.spring.x, y: M.spring.y + 1, trigger: 'action', noOver: true, solid: true, script: heal },
    { id: 'manantial_e', x: M.spring.x + 2, y: M.spring.y + 1, trigger: 'action', noOver: true, solid: true, script: heal },
  );
  return out;
}

export { lecturaEvents, rollosEvents, muralEvents, lines };
