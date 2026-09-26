// Puente de la Convergencia (docs/CAMPANA.md B18 «Secuencia» 1–2; §3.1 fase 3: «relojes desfasados y una Sima que se
// ensancha (P9)»): llegada desde el tablero de la Senda del Mirador con Alerce en el Rellano de los Custodios (catalejo,
// tienda para descansar, buhonera), los tres puntos señalizados del tramo central (Reconstrucción: tipo `rebuildGap` de
// B16 con `flag`, `tutorial` y `onRebuilt`), Alerce «desde el borde» de la plataforma, estela, objetos, grietas de las
// losas y la despedida tras restaurar el P9. Los combates y la escena de Genesis están en b18_genesis.js.
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, eventById, objectPage, examine, byGender, pause, walkTo,
  gatherNearPlayer,
} from './b18_common.js';
import {
  BRIDGE, gapCells, CAST, CAMP, SIGNS, ITEMS, CRACKS, PLATFORM, BARRIER_Y,
} from '../maps/b18/puente_layout.js';
import { extraDefs } from '../stamps/extraTiles.js';
import { clerkEvent, runRest } from '../services/index.js';

// ─────────────────────────────── Piedras de la Reconstrucción ───────────────────────────────

const Z = extraDefs('Exterior1').stamps;
const tileOf = (name) => Z[name]?.tiles?.layers?.[2]?.[0] || 0;
export const STONE = tileOf('pilar_zocalo');
export const STONE_LIVE = tileOf('pilar_zocalo_vivo');
/** Piedras que alza Zygarde en un hueco del tramo central: capa 2, hexágono vivo en la columna central. */
export const gapTiles = (gap) => Object.freeze(gapCells(gap).map(([x, y]) => Object.freeze([x, y, 2, x === BRIDGE.cx ? STONE_LIVE : STONE])));

/** Tiles de la barrera de obras de Exterior1 (stamp `barrera_obras`, 2×1): izquierda y derecha. Bloquean. */
export const BARRIER_TILES = Object.freeze([2203, 2204]);

export const PUENTE_TEXT = Object.freeze({
  view: [
    'Más allá del rellano, el tramo central del Puente se hundió: solo quedan dos estribos sueltos sobre el vacío.',
    'Al fondo, una plataforma octogonal. En el centro, una máquina blanca late entre destellos magenta; una cadena la une a los monolitos del Pilar.',
  ],
  socket: 'Un hueco en el puente. En el borde quedan zócalos de piedra con hexágonos gastados.',
  scope: 'Por el catalejo de Alerce se ve la plataforma: técnicos, cables y una máquina blanca que late en magenta.',
  scopeAfter: 'Por el catalejo se ve el fondo de la Sima, muy abajo. Allí brilla algo dorado, quieto.',
  stele: 'Una estela de los Custodios. La Clave Glífica traduce: «Aquí se cruzan los dos caminos del mundo. Quien tire de ellos, que no los rompa.»',
  crack: 'Una grieta cruza las losas. Por ella sale una luz violeta, y la piedra cruje bajo los pies.',
  crackGone: 'La grieta se ha cerrado. La piedra está fría y firme.',
  fire: 'Una hoguera pequeña. Alerce ha dejado una cafetera de campaña junto a las brasas.',
  barrier: 'Un vallado de Genesis corta el tramo sur del Puente. Detrás, tablones hacia el Mirador Sur.',
  barrierPolice: 'El vallado de Genesis sigue ahí, ahora con cinta de la Policía Regional. Los tablones de detrás no parecen seguros.',
});

// ─────────────────────────────── Llegada ───────────────────────────────

/** Casilla a la que se acerca Alerce en la llegada: justo delante (al sur) del jugador, dentro del tablero. */
export function arrivalSpot(player) {
  const x = Math.min(BRIDGE.x1, Math.max(BRIDGE.x0, player.x));
  return { x, y: Math.max(BRIDGE.north.y0, Math.min(BRIDGE.north.y1, player.y + 1)) };
}

async function arrivalScene(ctx) {
  ctx.setFlag(F.arrival);
  const alerce = eventById(ctx, 'alerce_campamento');
  if (alerce) {
    ctx.face(alerce, 'up');
    await ctx.emote(alerce, '!');
  }
  await ctx.say('\\PN. Aquí.', { speaker: SPEAKER.alerce });
  if (alerce) {
    // Delante del jugador, siempre sobre el tablero (el jugador llega por el borde norte, x 18–22: a su lado puede
    // haber vacío).
    const spot = arrivalSpot(ctx.player);
    await walkTo(ctx, alerce, spot.x, spot.y, { speed: 4 });
    ctx.turnToPlayer(alerce);
    ctx.face('player', ctx.directionTo(ctx.player, alerce));
  }
  await ctx.camera.pan(BRIDGE.cx, PLATFORM.y0 + 8, 80);
  ctx.se('PRSFX- Charge', { volume: 40 });
  for (const t of PUENTE_TEXT.view) await ctx.say(t);
  await lines(ctx, SPEAKER.alerce, [
    'Genesis ha tendido tablones desde el Mirador Sur. Llegaron a la plataforma por detrás.',
    'Esa máquina es su resonador. El anillo que viste en el Mirador Sur solo recoge lo que drenan las torres; toda esa energía acaba aquí.',
    'Y lo que la une a los monolitos es una cadena. Una copia de la tuya.',
  ]);
  await ctx.camera.pan(BRIDGE.cx, 22, 50);
  // Zygarde habla muy poco (autor, 25-09-2026): los huecos los describe la narración.
  await ctx.say('En el tramo central se abren tres huecos. En sus bordes quedan zócalos con hexágonos gastados.');
  await ctx.camera.reset(50);
  ctx.se('GUI trainer card flip', { volume: 50 });
  await lines(ctx, SPEAKER.alerce, [
    'Mi reloj va cuatro minutos por detrás del de Olmedo. Hace una hora iba seis por delante.',
    'Y la Sima está más ancha que ayer. De noche se oye crujir la piedra del puente.',
    'Olmedo reúne a la Policía Regional en la Senda. Tardarán.',
    'Si vas a cruzar, te sigo hasta el borde de esa plataforma. Entre combate y combate, déjame a tu equipo.',
    'En la tienda se puede descansar. Y la mujer de las mochilas vende de todo a los que bajan a la Sima.',
  ]);
  if (alerce) {
    await walkTo(ctx, alerce, CAST.alerceCamp.x, CAST.alerceCamp.y, { speed: 4 });
    ctx.face(alerce, CAST.alerceCamp.dir);
  }
}

// ─────────────────────────────── Alerce ───────────────────────────────

export const ALERCE_LINES = Object.freeze({
  camp: [
    'Tres huecos en el tramo central. En los bordes quedan zócalos viejos.',
    'Si te hace falta, déjame ver a tu equipo.',
  ],
  edge: 'Aquí me quedo, en el borde. No te pares por mí.',
  mouth: 'Baja. Aquí arriba me quedo yo con Olmedo.',
  after: 'Mi reloj y el de Olmedo marcan lo mismo. Por primera vez en semanas.',
});

/** Curación de campo de Alerce (sin coste). → true si curó. */
export async function alerceHeal(ctx, { ask = '¿Dejas que Alerce revise a tu equipo?' } = {}) {
  if (!(await ctx.confirm(ask))) {
    await ctx.say('Como quieras. Aquí estoy.', { speaker: SPEAKER.alerce });
    return false;
  }
  await ctx.fade('out', 10);
  ctx.heal();
  ctx.scene?.refreshFollower?.();
  ctx.me('heal');
  await pause(ctx, 30);
  await ctx.fade('in', 10);
  await ctx.say(`Listo. Están como nuevos. Tú también deberías respirar un poco, ${byGender(ctx.state, 'chico', 'chica')}.`, { speaker: SPEAKER.alerce });
  return true;
}

function alerceEvents() {
  const talk = (text) => async (ctx) => {
    await ctx.say(typeof text === 'function' ? text(ctx.state) : text, { speaker: SPEAKER.alerce });
    await alerceHeal(ctx);
  };
  return [
    {
      id: 'alerce_campamento', x: CAST.alerceCamp.x, y: CAST.alerceCamp.y, name: SPEAKER.alerce,
      pages: [{
        when: when({ none: [F.bridge] }), sprite: SPRITE.alerce, dir: CAST.alerceCamp.dir, move: 'still',
        script: async (ctx) => { await lines(ctx, SPEAKER.alerce, ALERCE_LINES.camp); await alerceHeal(ctx); },
      }],
    },
    {
      id: 'alerce_borde', x: CAST.alerceEdge.x, y: CAST.alerceEdge.y, name: SPEAKER.alerce,
      pages: [{ when: when({ all: [F.bridge], none: [F.scene] }), sprite: SPRITE.alerce, dir: CAST.alerceEdge.dir, move: 'still', script: talk(ALERCE_LINES.edge) }],
    },
    {
      id: 'alerce_boca', x: CAST.alerceMouth.x, y: CAST.alerceMouth.y, name: SPEAKER.alerce,
      pages: [
        { when: when({ all: [F.scene], none: [F.restored] }), sprite: SPRITE.alerce, dir: CAST.alerceMouth.dir, move: 'still', script: talk(ALERCE_LINES.mouth) },
        // Tras la Tabla Draco (B19) Alerce espera en la Calzada del Rey: aquí ya no está.
        { when: when({ all: [F.scene, F.restored], none: [F.t15Tablet] }), sprite: SPRITE.alerce, dir: CAST.alerceMouth.dir, move: 'still', script: talk(ALERCE_LINES.after) },
      ],
    },
  ];
}

// ─────────────────────────────── Reconstrucción del tramo central ───────────────────────────────

async function bridgeWhole(ctx) {
  await ctx.camera.pan(BRIDGE.cx, PLATFORM.y0 + 4, 40);
  ctx.se('PRSFX- Charge', { volume: 55 });
  for (const id of ['tecnico_resonador', 'tecnica_cadena', 'casia']) {
    const ev = eventById(ctx, id);
    if (ev) await ctx.emote(ev, '!');
  }
  await ctx.say(`Actividad de Reconstrucción en el tramo central. Tres activaciones seguidas. Es ${byGender(ctx.state, 'el portador', 'la portadora')}.`, { speaker: SPEAKER.casia });
  await ctx.camera.reset(40);
  await ctx.fade('out', 12);
  ctx.setFlag(F.bridge);
  await pause(ctx, 8);
  await ctx.fade('in', 12);
  await ctx.say('Voy detrás de ti. Te espero en el borde de la plataforma.', { speaker: SPEAKER.alerce });
}

function socketEvents() {
  return BRIDGE.gaps.map((g) => ({
    id: `zocalo_tramo_${g.n}`, type: 'rebuildGap', x: g.socket.x, y: g.socket.y, flag: g.flag, tiles: gapTiles(g), tutorial: true,
    blockedText: PUENTE_TEXT.socket,
    onRebuilt: async (ctx) => {
      if (g.n >= 3) await bridgeWhole(ctx);
    },
  }));
}

// ─────────────────────────────── Rellano: campamento, estela y detalles ───────────────────────────────

async function campRest(ctx) {
  const r = await runRest(ctx, { kind: 'camp', message: '¿Quieres descansar un rato en la tienda de Alerce?' });
  if (r?.rested) {
    ctx.setHealPoint(CAMP.healPoint.x, CAMP.healPoint.y, CAMP.healPoint.dir);
    ctx.ui?.toast?.('Si caes derrotado, volverás al campamento de Alerce.');
  }
}

function campEvents() {
  return [
    { id: 'tienda_alerce', x: CAMP.rest.x, y: CAMP.rest.y, trigger: 'action', noOver: true, solid: true, script: campRest },
    { id: 'hoguera', x: CAMP.fire.x, y: CAMP.fire.y, ...objectPage(OBJ.fire, 2, { stepAnime: true, speed: 3 }), solid: true, trigger: 'action', light: { radius: 70, intensity: 0.9 }, script: async (ctx) => { await ctx.say(PUENTE_TEXT.fire); } },
    {
      id: 'catalejo', x: CAMP.scope.x, y: CAMP.scope.y, ...objectPage(OBJ.tripod, 2), solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(ctx.flag(F.scene) ? PUENTE_TEXT.scopeAfter : PUENTE_TEXT.scope); },
    },
    {
      ...clerkEvent({
        id: 'buhonera', x: CAST.vendor.x, y: CAST.vendor.y, dir: CAST.vendor.dir, sprite: SPRITE.vendor, list: 'balls',
        extra: ['ULTRABALL', 'HYPERPOTION', 'MAXPOTION', 'FULLRESTORE', 'FULLHEAL', 'REVIVE', 'MAXREPEL'],
        greeting: 'Subo lo que me piden los que bajan a la Sima. Hoy, sobre todo, Poké Balls.',
      }),
      name: SPEAKER.vendor,
    },
    examine('estela_convergencia', SIGNS.stele.x, SIGNS.stele.y + 1, PUENTE_TEXT.stele),
    examine('estela_convergencia_b', SIGNS.stele.x + 1, SIGNS.stele.y + 1, PUENTE_TEXT.stele),
  ];
}

/** Grietas luminosas en las losas: la Sima se ensancha hasta que se restaura el P9 (brillo de evento: se va solo). */
function crackEvents() {
  return CRACKS.map((c, i) => ({
    id: `grieta_losas_${i}`, x: c.x, y: c.y, through: true,
    pages: [
      { when: (s) => !s.flag(F.restored), through: true, glow: { name: 'cracks', absolute: true, length: 26, branches: 2, seed: 30 + i * 7, color: [170, 120, 240], alpha: 0.7 }, trigger: 'action', script: async (ctx) => { await ctx.say(PUENTE_TEXT.crack); } },
      { when: (s) => s.flag(F.restored), through: true, trigger: 'action', script: async (ctx) => { await ctx.say(PUENTE_TEXT.crackGone); } },
    ],
  }));
}

function itemEvents() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count ?? 1, ...(it.hidden ? { hidden: true } : {}) }));
}

/**
 * Vallado de Genesis en el tramo sur. Tras la escena la policía lo precinta y se retira con el P9 restaurado, igual
 * que la barrera del estribo del Mirador Sur (B17): antes, el tramo sur moriría contra ella.
 */
function southEvents() {
  const out = [];
  for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) {
    out.push({
      id: `vallado_sur_${x}`, x, y: BARRIER_Y,
      pages: [{
        when: when({ none: [F.restored] }), tileId: BARRIER_TILES[(x - BRIDGE.x0) % 2], solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say(ctx.flag(F.scene) ? PUENTE_TEXT.barrierPolice : PUENTE_TEXT.barrier); },
      }],
    });
  }
  return out;
}

// ─────────────────────────────── Despedida tras el P9 ───────────────────────────────

async function farewellScene(ctx) {
  ctx.setFlag(F.farewell);
  const alerce = eventById(ctx, 'alerce_boca');
  const olmedo = eventById(ctx, 'olmedo_despues');
  // Si se vuelve al Puente por otro lado (campamento, Senda), se acercan; al terminar vuelven junto a la boca.
  const sendBack = await gatherNearPlayer(ctx, [alerce, olmedo]);
  if (alerce) ctx.turnToPlayer(alerce);
  ctx.se('GUI trainer card flip', { volume: 50 });
  await lines(ctx, SPEAKER.alerce, [
    'Lo he notado desde aquí arriba. Las losas han dejado de crujir.',
    ALERCE_LINES.after,
  ]);
  if (olmedo) ctx.turnToPlayer(olmedo);
  await lines(ctx, SPEAKER.olmedo, [
    'Los nuestros también. Todos a la misma hora, de Caudal a Lúmina.',
    'Nos quedamos con lo que queda de esa máquina. Nadie más va a jugar con cadenas aquí.',
  ]);
  await ctx.say('Cuando quieras, sigue. Yo tengo muchas notas que ordenar.', { speaker: SPEAKER.alerce });
  await sendBack();
}

export function puenteEvents() {
  return [
    {
      id: 'escena_llegada', x: 0, y: 0,
      pages: [{ when: when({ none: [F.arrival] }), trigger: 'auto', script: arrivalScene }],
    },
    {
      id: 'escena_despedida', x: 1, y: 0,
      pages: [{ when: when({ all: [F.restored, F.scene], none: [F.farewell, F.t15Tablet] }), trigger: 'auto', script: farewellScene }],
    },
    ...alerceEvents(),
    ...socketEvents(),
    ...campEvents(),
    ...crackEvents(),
    ...itemEvents(),
    ...southEvents(),
  ];
}
