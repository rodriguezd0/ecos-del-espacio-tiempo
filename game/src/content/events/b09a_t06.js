// T06 «El Museo de las Eras» (docs/TABLILLAS.md §4.6; CAMPANA B09 puntos 1–3): de noche, Rosalía cuenta que los
// «restauradores» de la Fundación Meridiano han hecho seis réplicas y han cambiado las etiquetas (segunda pista). En
// el sótano, la Sala de Réplicas: seis losas y cuatro pistas repartidas por el museo (b09a_t06_logic.js). Un error →
// Rosalía dice «No» y la sala se reinicia. Acierto → el Core confirma; los restauradores se llevan la losa a la fuerza,
// persecución hasta el muelle de carga y combate contra los dos (nv 35–36). La furgoneta se va vacía. Rosalía entrega la
// Tabla Acero («El museo no puede protegerla; tú sí.»), Eevee y la pista T08; la ficha de la Laguna Clara queda en el
// archivo. Reintento sin pérdida en la sala y en el muelle.
import { F, V, CLUE_BIT, SPEAKER, SPRITE, MUSIC, when, say, lines, core, isNight, scriptedBattle, pause, byGender } from './b09a_common.js';
import { SLABS, slabAt, isOriginal, describeSlab, hasClue, withClue, scaleTicket, CLUE_NOTES, ORIGINAL_WEIGHT } from './b09a_t06_logic.js';
import { BASEMENT, HALL } from '../maps/b09a/museo_layout.js';

const R = SPEAKER.rosalia;
const B = BASEMENT;

export const T06_TEXT = Object.freeze({
  night: [
    'Has venido. Bien. Cierra la puerta.',
    'Esta tarde los «restauradores» de la Fundación han traído seis losas idénticas a la nuestra. Réplicas, dicen, para una exposición itinerante.',
    'Las han bajado al sótano, junto a la original. Y cuando me he dado la vuelta, habían cambiado todas las etiquetas.',
    'Al amanecer viene su furgoneta a llevarse «las réplicas». Si nos equivocamos, se llevarán la de verdad, y con papeles firmados.',
    'Tú ves cosas que yo no veo. Ayúdame a encontrar la original.',
    'He dejado abiertos el sótano, el taller, el archivo y la sala de Antea. Si hay algo que distinga la losa, estará en este museo.',
  ],
  closedStaff: 'SOLO PERSONAL DEL MUSEO',
  noSlab: 'Un palé vacío.',
  ask: '¿Señalar esta losa como la original?',
  wrong: 'No.',
  reset: 'Rosalía vuelve a colocar los palés en silencio. Los restauradores se habían dejado uno torcido.',
});

// ------------------------------------------------------------ pistas
/** Registra una pista (bit + nota suelta en la Libreta). → true si era nueva. */
export async function foundClue(ctx, key) {
  const bit = CLUE_BIT[key];
  if (hasClue(ctx.state, bit)) return false;
  ctx.setVar(V.t06Clues, withClue(ctx.var(V.t06Clues, 0), bit));
  const note = CLUE_NOTES[key];
  if (note && ctx.state.addClue(note.id, note.text)) ctx.ui?.toast?.('Anotado en la Libreta.');
  return true;
}

const t06Active = (s) => Boolean(s) && s.flag(F.t06Night) && !s.flag(F.t06Solved);

// ------------------------------------------------------------ escena nocturna (planta baja)
export async function nightScene(ctx) {
  if (ctx.flag(F.t06Night)) return;
  const ros = ctx.world.events.find((e) => e.id === 'rosalia_noche');
  if (ros) {
    // El mostrador separa las dos alas de la planta baja: Rosalía habla desde donde está (la cámara la busca).
    ros.turnToward?.(ctx.player);
    await ctx.camera?.pan?.(ros.x, ros.y, 24);
  }
  ctx.bgm(MUSIC.tension, { fadeOutPrevious: 20 });
  await lines(ctx, R, T06_TEXT.night);
  await ctx.story.advanceClue('T06', 2);
  ctx.setFlag(F.t06Night);
  await say(ctx, R, 'Te espero abajo, en la Sala de Réplicas. Se baja por la escalera del personal, en el ala del taller: la puerta derecha del arco.');
  await say(ctx, R, 'Tómate el tiempo que haga falta: la furgoneta no llega hasta el amanecer.');
  await ctx.camera?.reset?.(24);
  if (ros) ctx.erase(ros);
}

// ------------------------------------------------------------ Sala de Réplicas
async function examineSlab(ctx, pos) {
  const slab = slabAt(ctx.state, pos);
  if (!slab) { await ctx.say(T06_TEXT.noSlab); return; }
  for (const line of describeSlab(ctx.state, slab)) await ctx.say(line);
  await showEdge(ctx, slab);
  if (!t06Active(ctx.state)) return;
  if (!(await ctx.confirm(T06_TEXT.ask))) return;
  if (isOriginal(slab)) { await solved(ctx, pos); return; }
  await say(ctx, R, T06_TEXT.wrong);
  await ctx.fade('out', 20);
  ctx.setVar(V.t06Try, (Number(ctx.var(V.t06Try, 0)) || 0) + 1);
  await ctx.warp(ctx.map.id, B.roomEntry.x, B.roomEntry.y, B.roomEntry.dir, { fade: false });
  await ctx.fade('in', 20);
  await ctx.say(T06_TEXT.reset);
}

/** Los tres glifos del borde en una placa Unown (en Node, solo el texto). */
async function showEdge(ctx, slab) {
  if (typeof document === 'undefined') { await ctx.say(`En el borde hay tres glifos Unown: «${slab.glyphs}».`); return; }
  try {
    const fx = await import('../story/storyFx.js');
    await fx.showVerse({ unown: slab.glyphs, translation: `La Pokédex lee: «${slab.glyphs}».`, full: false, tint: [150, 170, 190], title: `Borde de la losa del palé ${slab.pallet}` });
  } catch (err) {
    console.error('[b09a] placa del borde', err);
    await ctx.say(`En el borde hay tres glifos Unown: «${slab.glyphs}».`);
  }
}

async function solved(ctx, pos) {
  await say(ctx, R, '…');
  await say(ctx, R, 'Sí. Es ella. Cuarenta años mirándola, y he tenido que verla con tus ojos.');
  await core(ctx, 'Es esta. La siento desde aquí: está escrita, como las otras.');
  ctx.setFlag(F.t06Solved);
  ctx.bgm(MUSIC.grunt, { fadeOutPrevious: 10 });
  await pause(ctx, 20);
  const [a, b] = ['restaurador_a', 'restauradora_b'].map((id) => ctx.world.events.find((e) => e.id === id));
  for (const ev of [a, b]) if (ev) ctx.turnToPlayer(ev);
  await say(ctx, SPEAKER.restorer, 'Buenas noches. Venimos a recoger las piezas. Protocolo de traslado adelantado.');
  await say(ctx, R, 'Esa se queda. Y las otras cinco, también, hasta que alguien me explique de dónde han salido.');
  await say(ctx, SPEAKER.restorerF, 'Lo sentimos. La Fundación tiene prisa.');
  ctx.setVar(V.t06Pallet, pos);
  await ctx.say(`¡Los restauradores cargan el palé ${slabAt(ctx.state, pos).pallet} en una carretilla y salen corriendo hacia el muelle de carga!`);
  ctx.se?.('Door slide');
  for (const ev of [a, b]) if (ev) await ctx.move(ev, ['right', 'right', 'right', 'right', 'right'], { through: true, speed: 5 });
  ctx.setFlag(F.t06Chase); // el palé queda vacío y los dos esperan en el muelle
  await say(ctx, R, '¡El muelle! ¡Detenlos antes de que lleguen a la furgoneta!');
}

function palletEvents() {
  return B.pallets.map(([x, y], pos) => ({
    id: `pale_${pos}`, x, y, name: 'Losa',
    pages: [
      { sprite: SPRITE.slab, dir: 2, pattern: pos % 4, directionFix: true, stepAnime: false, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: (ctx) => examineSlab(ctx, pos) },
      // El palé de la original queda vacío cuando se la llevan (y ya no se examina como réplica).
      { when: (s) => Boolean(s) && s.flag(F.t06Chase) && Number(s.var(V.t06Pallet, -1)) === pos, sprite: SPRITE.slab, dir: 8, directionFix: true, shadow: false, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say('El palé está vacío. Aquí estaba la original.'); } },
      { when: (s) => Boolean(s) && s.flag(F.t06Done) && Number(s.var(V.t06Pallet, -1)) === pos, sprite: SPRITE.slab, dir: 8, directionFix: true, shadow: false, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say('El palé vacío de la losa original. Rosalía ha pegado una nota: «Viaja con quien sabe protegerla».'); } },
    ],
  }));
}

function roomEvents() {
  const nightOnly = (s) => t06Active(s);
  return [
    {
      id: 'rosalia_replicas', x: B.rosalia.x, y: B.rosalia.y, name: R,
      pages: [{ when: nightOnly, sprite: SPRITE.rosalia, dir: B.rosalia.dir, move: 'still', trigger: 'action', script: async (ctx) => {
        const n = [CLUE_BIT.weight, CLUE_BIT.scale, CLUE_BIT.photo, CLUE_BIT.glyphs, CLUE_BIT.cold].filter((b) => hasClue(ctx.state, b)).length;
        await say(ctx, R, n === 0
          ? 'Seis losas iguales. Busca por el museo: el inventario del archivo, las fotos de la galería, la sala de Antea… Algo tiene que delatarla.'
          : 'Cuando lo tengas claro, señala la losa. Si fallas, te diré que no, y volveremos a empezar. No hay prisa.');
      } }],
    },
    ...['restaurador_a', 'restauradora_b'].map((id, i) => ({
      id, x: 14 + i, y: 11, name: i ? SPEAKER.restorerF : SPEAKER.restorer,
      pages: [{ when: (s) => Boolean(s) && s.flag(F.t06Solved) && !s.flag(F.t06Chase), sprite: i ? SPRITE.restorerF : SPRITE.restorer, dir: 8, move: 'still', through: true }],
    })),
  ];
}

// ------------------------------------------------------------ taller y archivo
function workshopEvents() {
  return [
    {
      id: 'bascula', x: B.scale.x, y: B.scale.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        await ctx.say('La báscula de carga del taller. En la pantalla quedan las últimas pesadas de la tarde:');
        await ctx.say(scaleTicket());
        if (t06Active(ctx.state)) await foundClue(ctx, 'scale');
      },
    },
    {
      id: 'ficha_1962', x: B.ficha1962.x, y: B.ficha1962.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        await ctx.say(`Inventario del Museo, 1962. «Losa votiva de Antea. Metal oscuro con relieves. Peso: ${ORIGINAL_WEIGHT} kg. Sala de Antea, vitrina 1».`);
        await ctx.say('Al pie de la ficha, a lápiz: «Ver también: tabla amarga, Laguna Clara».');
        if (t06Active(ctx.state)) await foundClue(ctx, 'weight');
      },
    },
    {
      id: 'ficha_laguna', x: B.fichaLaguna.x, y: B.fichaLaguna.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        if (!ctx.flag(F.t06Done)) { await ctx.say('Cajones de fichas de catálogo, ordenados por años. Hay miles.'); return; }
        await ctx.say('Una ficha de catálogo, más nueva que las demás: «Expedición a la Laguna Clara (hace 16 años). Fondos: Fundación Meridiano. Resultados: no publicados».');
        if (!ctx.flag(F.laguna)) {
          const ros = ctx.world.events.find((e) => e.id === 'rosalia_archivo');
          if (ros) ctx.turnToPlayer(ros);
          await say(ctx, R, 'Nunca publicaron nada.');
          await say(ctx, R, 'Estaré arriba, en la Sala de las Crónicas. Hay paredes que llenar.');
          if (ros) {
            await ctx.move(ros, ['down', 'right', 'right', 'right', 'right', 'right', 'right'], { through: true, speed: 4 });
            ctx.erase(ros);
          }
          ctx.setFlag(F.laguna); // Rosalía vuelve a la Sala de las Crónicas
        }
      },
    },
    // Tras T06, Rosalía espera en el archivo hasta que el jugador lee la ficha de la Laguna Clara (CAMPANA B09 punto 3).
    {
      id: 'rosalia_archivo', x: B.rosaliaArchive.x, y: B.rosaliaArchive.y, name: R,
      pages: [{ when: when({ all: [F.t06Done], none: [F.laguna] }), sprite: SPRITE.rosalia, dir: B.rosaliaArchive.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await say(ctx, R, 'Mira el cajón de las fichas nuevas, ese de ahí. Hay una que no debería estar tan nueva.'); } }],
    },
    {
      id: 'eevee_taller', x: B.eevee.x, y: B.eevee.y, name: 'Eevee',
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.eevee), sprite: SPRITE.eevee, dir: 2, move: { wander: 1 }, stepAnime: true, trigger: 'action',
        script: async (ctx) => { ctx.cry?.('EEVEE'); await ctx.say('Un Eevee duerme enroscado entre virutas de madera. Tiene una goma de borrar mordisqueada entre las patas.'); } }],
    },
  ];
}

// ------------------------------------------------------------ muelle de carga
async function dockBattle(ctx) {
  if (ctx.flag(F.t06Won) || !ctx.flag(F.t06Chase)) return;
  const van = ctx.world.events.find((e) => e.id === 'furgoneta');
  await say(ctx, SPEAKER.restorer, '¡Alto ahí! Esto es un traslado autorizado.');
  await say(ctx, SPEAKER.restorerF, 'Si insistes, tendremos que proceder. Con perdón.');
  const outcome = await scriptedBattle(ctx, {
    type: 'trainer', format: 'double', trainers: ['b09a_restaurador_bruno', 'b09a_restauradora_noemi'], bgm: MUSIC.grunt,
  }, B.dockEntry);
  if (outcome !== 'win') {
    await say(ctx, R, '¿Estás bien? Todavía no han arrancado. ¡Inténtalo otra vez!');
    return;
  }
  await say(ctx, SPEAKER.restorer, 'Incidencia. Abortamos el traslado.');
  for (const id of ['restaurador_muelle', 'restauradora_muelle']) {
    const ev = ctx.world.events.find((e) => e.id === id);
    if (ev) { await ctx.move(ev, ['right', 'right'], { through: true, speed: 5 }); ctx.erase(ev); }
  }
  ctx.se?.('Door slide');
  if (van) await ctx.move(van, ['right', 'right', 'right', 'right', 'right', 'right', 'right'], { through: true, speed: 5 });
  if (van) ctx.erase(van);
  await ctx.say('La furgoneta se va a toda velocidad… vacía. La carretilla con la losa se ha quedado en el muelle.');
  ctx.setFlag(F.t06Won);
  await finale(ctx);
}

async function finale(ctx) {
  const ros = ctx.world.events.find((e) => e.id === 'rosalia_muelle');
  if (ros) { await ctx.approach(ros); ctx.turnToPlayer(ros); }
  ctx.bgm(MUSIC.lumina, { fadeOutPrevious: 30 });
  await lines(ctx, R, [
    'Se han ido. Sin la losa.',
    'Volverán. Con otra fundación, con otros papeles. Y este museo no tiene más que una curadora coja y una alarma que suena cuando le da la gana.',
    'El museo no puede protegerla; tú sí.',
  ]);
  await ctx.story.giveTablet('IRONPLATE');
  ctx.setFlag(F.t06Done);
  await lines(ctx, R, [
    'Y llévate a este también. Vive en el taller desde hace meses, se come mis gomas de borrar y no deja dormir al vigilante.',
  ]);
  await ctx.givePokemon({ species: 'EEVEE', level: 10 });
  ctx.setFlag(F.eevee);
  await lines(ctx, R, [
    'Una cosa más. La ficha de inventario de 1962 citaba otra tabla: «amarga», en la antigua Laguna Clara. Hoy la llaman la Marisma Turbia.',
    `Si vas hacia allí, mira bien dónde pisas, ${byGender(ctx.state, 'chico', 'chica')}.`,
  ]);
  ctx.setFlag(F.t08);
  await ctx.story.openClue('T08');
  await say(ctx, R, 'Mañana reabro la sala de Antea. Con la historia del rey, que para eso la escribieron. Y en el archivo… ya verás. Pasa cuando quieras.');
  if (ros) ctx.erase(ros);
}

function dockEvents() {
  const chasing = when({ all: [F.t06Chase], none: [F.t06Won] });
  const [ra, rb] = B.restorers;
  const [vx, vy, vw, vh] = B.vanBlock;
  const vanBlocks = [];
  for (let y = vy; y < vy + vh; y++) {
    for (let x = vx; x < vx + vw; x++) {
      if (x === B.van.x && y === B.van.y) continue;
      vanBlocks.push({ id: `furgoneta_${x}_${y}`, x, y, pages: [{ when: (s) => Boolean(s) && !s.flag(F.t06Won), solid: true, noOver: true }] });
    }
  }
  return [
    ...vanBlocks,
    {
      id: 'furgoneta', x: B.van.x, y: B.van.y, name: 'Furgoneta',
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.t06Won), sprite: SPRITE.van, dir: 2, directionFix: true, stepAnime: false, walkAnime: false, shadow: false, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say('Una furgoneta rosa con el logotipo de la Fundación Meridiano: dos tubos de ensayo cruzados sobre un círculo.'); } }],
    },
    { id: 'restaurador_muelle', x: ra.x, y: ra.y, name: SPEAKER.restorer, pages: [{ when: chasing, sprite: SPRITE.restorer, dir: ra.dir, move: 'still', trigger: 'action', script: dockBattle }] },
    { id: 'restauradora_muelle', x: rb.x, y: rb.y, name: SPEAKER.restorerF, pages: [{ when: chasing, sprite: SPRITE.restorerF, dir: rb.dir, move: 'still', trigger: 'action', script: dockBattle }] },
    ...[B.dockEntry.y - 1, B.dockEntry.y, B.dockEntry.y + 1].map((y) => ({ id: `muelle_franja_${y}`, x: B.dockEntry.x + 2, y, trigger: 'touch', through: true, when: chasing, script: dockBattle })),
    { id: 'carretilla', x: B.crate.x, y: B.crate.y, name: 'Carretilla',
      pages: [
        { when: chasing, sprite: SPRITE.slab, dir: 4, directionFix: true, shadow: false, solid: true, trigger: 'action', script: dockBattle },
        { when: when({ all: [F.t06Won], none: [F.t06Done] }), sprite: SPRITE.slab, dir: 4, directionFix: true, shadow: false, solid: true, trigger: 'action', script: finale },
      ] },
    { id: 'rosalia_muelle', x: B.dockEntry.x, y: B.dockEntry.y + 1, name: R,
      pages: [{ when: when({ all: [F.t06Chase], none: [F.t06Done] }), sprite: SPRITE.rosalia, dir: 6, move: 'still', trigger: 'action',
        script: async (ctx) => { if (ctx.flag(F.t06Won)) await finale(ctx); else await say(ctx, R, '¡Que no se la lleven!'); } }] },
  ];
}

export function basementEvents() {
  return [...palletEvents(), ...roomEvents(), ...workshopEvents(), ...dockEvents()];
}

/** Rosalía de noche en la planta baja (escena que abre la segunda pista). */
export function hallNightEvents() {
  const waiting = (s) => Boolean(s) && isNight(s) && s.flag(F.gala) && !s.flag(F.t06Night) && !s.flag(F.t06Done);
  const h = HALL.rosaliaNight;
  return [
    { id: 'rosalia_noche', x: h.x, y: h.y, name: R, sprite: SPRITE.rosalia, dir: h.dir, move: 'still', when: waiting, trigger: 'action', script: nightScene },
    { id: 't06_noche_auto', x: 0, y: 0, trigger: 'auto', when: waiting, script: nightScene },
  ];
}

export { SLABS };
