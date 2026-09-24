// Parque Eólico ocupado por Genesis (docs/CAMPANA.md B06 pasos 2–3; §2.4 N2; §5.3 Casia; §6.2 Gael): infiltración
// breve (dos técnicos), la Dra. Casia Varela («No somos un consorcio. Somos Genesis.»), combate, el Colector se
// rompe (C029–C032 y N2 → Terreno complicado), Casia se retira y Gael se queda mirando las pantallas.
// Reintento sin pérdida (§2.6): perder contra Casia devuelve a la puerta del Colector con el equipo curado.
import { F, SPEAKER, SPRITE, OBJ, MUSIC, lines, zygardeSays, trainerUntil, scriptedBattle } from './b06_common.js';
import { collectColectorCells } from './b06_cells.js';
import { PARQUE, MESETA } from '../maps/b06/layout.js';
import { UNLOCK_TEXT, missingPartsLine } from '../zygarde/texts.js';
import { capabilityDef } from '../zygarde/thresholds.js';

const P = PARQUE;
const GREEN = [185, 255, 102];

export const PARQUE_TEXT = Object.freeze({
  door: 'Una puerta de servicio con un cartel: «Solo personal autorizado».',
  sphere: 'Una esfera de cristal sobre una base llena de cables. Dentro late una luz verde, encerrada. En la base pone: «MUESTRA Z-2».',
  sphereBroken: 'La base del Colector sigue ahí, con los cables colgando. La esfera está hecha añicos.',
  cells: (n) => `¡Cuatro Células de Zygarde escapan del Colector y vuelven contigo! (${n}/100)`,
  screensOff: 'Las pantallas están apagadas. Alguien ha sacado los discos.',
});

// ------------------------------------------------------------ Casia y el Colector

async function casiaIntro(ctx) {
  const n = ctx.state.cellCount?.() ?? ctx.state.data.zygarde?.cells?.length ?? 0;
  await lines(ctx, SPEAKER.casia, [
    'Te esperaba. No tan pronto, eso sí.',
    `Villa Alba. Paso rápido. Una forma incompleta que te sigue a menos de un metro. ${n} lecturas de célula a tu alrededor.`,
    'Doctora Casia Varela. No somos un consorcio. Somos Genesis.',
  ]);
  await zygardeSays(ctx, 'Esa esfera. Hay una parte de mí dentro. No puede salir.');
  await lines(ctx, SPEAKER.casia, [
    'Ah, lo notas. La muestra Z-2 lleva semanas ahí dentro. El Colector la atrae; a ella y a todo lo que se le parece.',
    '¿Te parece mal? Dime una cosa. ¿Quién votó a Dialga? ¿Quién eligió que el tiempo tuviera dueño?',
    'Nadie. Nosotros solo queremos entender lo que otros llaman sagrado. Entender primero. Decidir después.',
    'Pero adelante. Una muestra más nunca sobra.',
  ]);
}

/** Rotura del Colector: la esfera se agrieta y estalla, salen las cuatro células y N2 se funde con Zygarde. */
async function breakColector(ctx) {
  const sphere = ctx.world.events.find((e) => e.id === 'muestra_z2');
  ctx.bgm(MUSIC.tension, { fadeOutPrevious: 20 });
  if (sphere) { sphere.direction = 4; sphere.stepAnime = true; }
  ctx.se('PRSFX- Mirror Shatter', { volume: 70 });
  ctx.shake(4, 6, 40);
  await ctx.wait(40);
  ctx.se('PRSFX- Shell Smash1', { volume: 90 });
  await ctx.flash(GREEN, 24, 220);
  if (sphere) { sphere.direction = 6; sphere.stepAnime = false; }
  ctx.setFlag(F.colector);
  // Cuatro células salen despedidas y vuelven al compañero.
  const fx = [];
  for (const [dx, dy] of [[-2, 1], [2, 1], [-1, 3], [1, 3]]) {
    try { fx.push(ctx.effect('zygardeCell', { x: P.sphere.x + dx, y: P.sphere.y + dy })); } catch { /* sin capa de efectos */ }
  }
  await ctx.wait(30);
  for (const h of fx) h?.remove?.(20);
  await collectColectorCells(ctx);
  ctx.se('Mining item get');
  await ctx.say(PARQUE_TEXT.cells(ctx.state.data.zygarde.cells.length));
  await joinN2(ctx);
}

async function joinN2(ctx) {
  const core = ctx.world.spawnEvent({
    id: 'nucleo_n2', x: P.sphere.x, y: P.sphere.y + 1, sprite: 'zygarde_core', dir: 2, stepAnime: true, through: true,
    glow: { name: 'zygardeCell', size: 60, alpha: 0.5 },
  });
  ctx.se('core_signal', { volume: 70 });
  await ctx.wait(20);
  const route = [];
  for (let y = core.y; y < ctx.player.y - 1; y++) route.push('down');
  await ctx.move(core, route, { through: true, speed: 3 });
  await ctx.flash(GREEN, 30, 200);
  ctx.erase(core);
  const { grantCore } = await import('../../world/zygarde/scenes.js');
  const { unlocked } = await grantCore(ctx, 'N2', { scenes: false });
  if (unlocked.includes('terrain')) {
    await ctx.say('Ahora recuerdo cómo se pisa la tierra blanda.', { telepathy: true });
    await ctx.say(UNLOCK_TEXT(capabilityDef('terrain').name));
    const hint = capabilityDef('terrain').hint;
    if (hint) await ctx.say(hint);
  } else {
    const { missingParts } = await import('../../world/zygarde/progression.js');
    await ctx.say('Un núcleo más. Recuerdo la tierra blanda, pero todavía no llego.', { telepathy: true });
    const n = missingParts(ctx.state, 'terrain');
    if (n > 0) await ctx.say(missingPartsLine(n), { telepathy: true });
  }
}

async function casiaLeaves(ctx) {
  const casia = ctx.world.events.find((e) => e.id === 'casia');
  if (casia) casia.turnToward(ctx.player);
  await lines(ctx, SPEAKER.casia, [
    'Solo lo estábamos escuchando.',
    'Lo que hemos medido ya es nuestro. Gracias por los datos.',
  ]);
  if (casia) {
    const px = ctx.player.x;
    const side = px <= casia.x ? 'right' : 'left';
    await ctx.move(casia, [side, 'down', 'down', 'down', 'down', 'down'], { through: true, speed: 4 });
    ctx.erase(casia);
  }
}

async function gaelAtScreens(ctx) {
  ctx.bgm('GuaridaRocket', { fadeOutPrevious: 30 });
  const g = ctx.world.spawnEvent({ id: 'gael_llega', x: P.colectorEntry.x, y: P.colectorEntry.y + 1, sprite: SPRITE.gael, dir: 8, through: true });
  await ctx.move(g, ['up', 'left', 'left', 'left'], { through: true, speed: 4 });
  g.turnToward(ctx.player);
  await lines(ctx, SPEAKER.gael, [
    'Ha salido una mujer con bata. Ni me ha mirado.',
    '¿Estás bien? …Ya veo que sí.',
  ]);
  ctx.face(g, 'up');
  await ctx.wait(20);
  await lines(ctx, SPEAKER.gael, [
    'Mira esto. Un mapa de toda la región. Cada punto verde es una célula.',
    'Llevan meses anotándolas. Con fechas. Con horas.',
    '…',
    'No me esperes. Quiero ver esto con calma.',
  ]);
  ctx.setFlag(F.gaelScreens);
  ctx.erase(g);
}

async function casiaScene(ctx) {
  if (ctx.flag(F.colector)) return;
  await ctx.movePlayerTo(P.facing.x, P.facing.y, { through: false, speed: 3 });
  ctx.face('player', 'up');
  const casia = ctx.world.events.find((e) => e.id === 'casia');
  if (casia) casia.turnToward(ctx.player);
  if (!ctx.flag(F.casiaMet)) {
    ctx.bgm(MUSIC.genesis);
    await casiaIntro(ctx);
    ctx.setFlag(F.casiaMet);
  } else {
    await ctx.say('¿Otra medición? Adelante.', { speaker: SPEAKER.casia });
  }
  // Perder devuelve a la puerta del Colector con el equipo curado (CAMPANA §2.6).
  const outcome = await scriptedBattle(ctx, { trainer: 'b06_casia' }, P.colectorEntry);
  if (outcome !== 'win') return;
  ctx.setFlag(F.casia);
  await ctx.say('…Interesante.', { speaker: SPEAKER.casia });
  await breakColector(ctx);
  await casiaLeaves(ctx);
  await gaelAtScreens(ctx);
}

// ------------------------------------------------------------ eventos

function colectorEvents() {
  const strip = [P.facing.x - 1, P.facing.x, P.facing.x + 1].map((x) => ({
    id: `casia_linea_${x}`, x, y: P.facing.y, trigger: 'touch', through: true,
    when: (s) => Boolean(s) && !s.flag(F.colector), script: casiaScene,
  }));
  return [
    {
      id: 'muestra_z2', x: P.sphere.x, y: P.sphere.y, name: 'Colector',
      pages: [
        {
          sprite: OBJ.colector, dir: 2, directionFix: true, stepAnime: true, speed: 3, solid: true, trigger: 'action',
          light: { radius: 90, intensity: 0.7 },
          script: async (ctx) => { await ctx.say(PARQUE_TEXT.sphere); if (!ctx.flag(F.colector)) await casiaScene(ctx); },
        },
        {
          when: (s) => Boolean(s) && s.flag(F.colector), sprite: OBJ.colector, dir: 6, directionFix: true, solid: true, trigger: 'action',
          script: async (ctx) => { await ctx.say(PARQUE_TEXT.sphereBroken); },
        },
      ],
    },
    {
      id: 'casia', x: P.casia.x, y: P.casia.y, name: SPEAKER.casia,
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.colector), sprite: SPRITE.casia, dir: P.casia.dir, move: 'still', trigger: 'action', script: casiaScene }],
    },
    ...strip,
    {
      id: 'pantallas', x: P.screens.x + 2, y: P.screens.y + 3, trigger: 'action', noOver: true,
      script: async (ctx) => {
        if (!ctx.flag(F.colector)) { await ctx.say('Mapas, gráficas y columnas de cifras. Todo con el emblema de dos tubos cruzados.'); return; }
        await ctx.say(PARQUE_TEXT.screensOff);
      },
    },
  ];
}

function almacenEvents() {
  const genesisGone = (s) => Boolean(s) && s.flag(F.colector);
  const door = P.innerDoor;
  return [
    trainerUntil({
      id: 'tecnico_almacen', trainer: 'b06_tecnico_almacen', name: 'Técnico Rubén', sprite: SPRITE.tecnico,
      x: 6, y: 14, dir: 6, sight: 5, eyeBgm: MUSIC.grunt,
      intro: 'Esta zona está en mantenimiento. ¿Quién te ha dejado pasar?',
      after: 'Anotaré que has entrado. Con hora y todo.',
    }, genesisGone),
    trainerUntil({
      id: 'tecnica_control', trainer: 'b06_tecnica_control', name: 'Técnica Olga', sprite: SPRITE.tecnica,
      x: 16, y: 5, dir: 4, sight: 4, eyeBgm: MUSIC.grunt,
      intro: 'La doctora no quiere visitas. Y yo tampoco.',
      after: 'Pasa si quieres. Ella ya te está midiendo.',
    }, genesisGone),
    {
      id: 'investigador', x: 21, y: 16, name: 'Investigador',
      pages: [{
        when: (s) => Boolean(s) && !s.flag(F.colector), sprite: SPRITE.investigador, dir: 8, move: 'still', trigger: 'action',
        script: async (ctx) => { await ctx.say('No toque nada, por favor. Estamos calibrando.', { speaker: 'Investigador' }); },
      }],
    },
    {
      id: 'operaria_brontia', x: 21, y: 16, name: SPEAKER.operaria,
      pages: [{
        when: (s) => genesisGone(s) && s.flag(F.restored), sprite: 'anil:mecanica', dir: 2, move: { wander: 1 }, trigger: 'action',
        script: async (ctx) => {
          await lines(ctx, SPEAKER.operaria, [
            'El Consorcio se fue dejándolo todo tirado. Hemos reconectado el Parque en una tarde.',
            'Brontia vuelve a tener luz. Y el viento sopla derecho, que ya ni me acordaba.',
          ]);
        },
      }],
    },
    { id: 'objeto_almacen_1', type: 'item', x: 3, y: 5, item: 'MAGNET' },
    { id: 'objeto_almacen_2', type: 'item', x: 21, y: 17, item: 'GREATBALL', count: 3 },
    {
      id: 'puerta_servicio', x: door.x, y: door.y, name: 'Puerta de servicio',
      pages: [{
        sprite: 'doors5', dir: 2, pattern: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'touch',
        script: async (ctx) => {
          const ev = ctx.event;
          ctx.se('Door slide');
          for (const d of [4, 6, 8]) { ev.direction = d; await ctx.wait(4); }
          await ctx.warp('parque_eolico', P.colectorEntry.x, P.colectorEntry.y, P.colectorEntry.dir);
        },
      }],
    },
  ];
}

function gaelScreenEvent() {
  return {
    id: 'gael_pantallas', x: P.gaelScreens.x, y: P.gaelScreens.y, name: SPEAKER.gael,
    pages: [{
      when: (s) => Boolean(s) && s.flag(F.gaelScreens) && !s.flag(F.gaelLeft), sprite: SPRITE.gael, dir: 8, move: 'still', trigger: 'action',
      script: async (ctx) => {
        await ctx.say('…', { speaker: SPEAKER.gael });
        await ctx.say('Te he dicho que no me esperes.', { speaker: SPEAKER.gael });
        ctx.face('this', 'up');
      },
    }],
  };
}

export function parqueEvents() {
  return [...almacenEvents(), ...colectorEvents(), gaelScreenEvent()];
}

/** Salida del almacén a la Meseta (delante de la puerta de la nave del Colector). */
export function parqueExitWarps() {
  const d = MESETA.colector.door;
  return P.exitTiles.map(([x, y]) => ({ x, y, dirTrigger: 2, to: 'meseta_impulso', tx: d.x, ty: d.y + 1, dir: 2, door: true }));
}

/** Vuelta de la sala del Colector al almacén (pisar el hueco sur). */
export function colectorBackWarps() {
  const f = P.innerFront;
  return P.colectorBack.map(([x, y]) => ({ x, y, to: 'parque_eolico', tx: f.x, ty: f.y, dir: 2 }));
}
