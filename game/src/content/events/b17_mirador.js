// Mirador Sur ocupado (docs/CAMPANA.md B17 «Problema»: «Genesis ocupa el Mirador Sur ("estudio geotécnico del
// Consorcio"), levanta andamios hacia el puente roto y monta un Resonador Sintético con una Cadena Sintética construida
// con lo que registró desde fuera del P8. Lo alimenta el Anillo de Captación»; §5.4 «Operación Convergencia»).
//   · Antes del P8 (se llega desde Lúmina en cualquier momento) es un paseo público sobre la Sima.
//   · Del P8 al P9 (B18): valla de obra, caravana, contenedores, andamios sobre el vacío y el Resonador; técnicos en la
//     puerta. La primera vez que el jugador se acerca, escena de la ocupación: Zygarde reconoce la cadena copiada y
//     siente las tres torres del Anillo (nota en la Libreta). Espolón del este: la Torre del Temblor.
import {
  F, SPEAKER, SPRITE, OBJ, MUSIC, occupied, lines, zygardeSays, eventById, pause, npc, frame,
} from './b17_common.js';
import {
  COMPOUND, DECK_BARRIER, SCAFFOLD, RESONATOR, TOWER, DESCENT, DESCENT_GAP, SPOTS, ITEMS, RIM_Y,
} from '../maps/b17/mirador_layout.js';
import { socketTiles, rect } from '../maps/b17/rim.js';
import { stampPatch, barrierLine } from '../maps/b17/patch.js';
import { towerEvents } from './b17_torres.js';
import { maybeAlerceCall, MIRADOR_HINT_NOTE } from './b17_vigilia.js';
import { mapRegistered, blockedText } from '../maps/b17/links.js';
import BAKED from '../stamps/baked/Exterior3.js';

const P8 = F.p8;
/** Tiles de la barrera de obra (stamp `barrera_obras`, 2×1). */
const BARRIER = BAKED.stamps.barrera_obras?.layers?.find((l) => l && l.some(Boolean)) || [0];
export const ANILLO_NOTE = Object.freeze({
  id: 'b17_anillo',
  text: 'Anillo de Captación: tres torres en el borde de la Sima alimentan el Resonador de Genesis. Una al este del Mirador Sur; dos en la Senda del Mirador, al norte. Zygarde puede alzar piedras hasta ellas.',
});

export const MIRADOR_TEXT = Object.freeze({
  sign: 'MIRADOR SUR\nBorde de la Sima del Eje. Prohibido saltar la barandilla.',
  legend: 'PUENTE DE LA CONVERGENCIA\nDe él solo quedan los dos estribos. Nadie sabe cuándo se hundió el tramo central.',
  consortium: 'CONSORCIO MERIDIANO DE ESTUDIOS GEOFÍSICOS\nEstudio geotécnico. Zona restringida.',
  guard: ['Estudio geotécnico del Consorcio. Zona restringida.', 'Por su seguridad, no se acerque a la valla.'],
  guardAfter: ['El acceso sigue restringido. Gracias por su comprensión.'],
  scene: {
    call: 'Desde la valla, un técnico del Consorcio te hace señas para que te acerques.',
    stop: 'Alto. Estudio geotécnico del Consorcio. Zona restringida.',
    look: 'Detrás de la valla, unos andamios de metal salen del viejo estribo del Puente y avanzan sobre la Sima.',
    ring: 'Al final, colgado sobre el vacío, un gran anillo envuelto en una cadena de eslabones rojos zumba y parpadea.',
    a: 'El registro del Santuario ha servido. La Cadena Sintética ya resuena en la frecuencia buena.',
    b: 'Resonar no es sostener. Sin las torres del Anillo a pleno rendimiento, el Resonador no aguanta ni un minuto.',
    c: 'Las tres drenan desde anoche: viento, tormenta y temblor. El director quiere la prueba cuanto antes.',
    z1: 'Esa cadena imita algo que conozco. Suena mal, como una voz copiada.',
    z2: (s) => (s.flag(F.towerTemblor)
      ? 'Las torres tiran de la tierra para alimentar ese anillo. La del este ya está callada. Las otras, al otro lado de la Sima, no.'
      : 'Las torres tiran de la tierra para alimentar ese anillo. Siento una aquí, al este. Y dos más al otro lado de la Sima.'),
    note: 'Has anotado en la Libreta lo del Anillo de Captación.',
  },
  worker1: ['Calibración del Resonador: 71 %. No toque nada, por favor.'],
  worker2: ['La cadena vibra sola cuando pasa la luna. No sale en ningún manual.'],
  worker3: ['El andamio llega hasta donde llega el tablero viejo. Más allá, solo vacío.'],
  tourist: ['Desde aquí se ve la Senda del Mirador, al otro lado. De noche parece que la Sima no tiene fondo.'],
  neighbor: (s) => (s.flag(F.p9)
    ? ['Se han ido los del Consorcio. Han dejado el Mirador lleno de agujeros de tornillo.']
    : ['El Consorcio ha vallado el Mirador «para un estudio». ¡Si hasta han cerrado el paseo de los domingos!']),
  child: (s) => (occupied(s)
    ? ['¡Hay una torre nueva en el borde del este! Mi madre dice que no me acerque, que zumba.']
    : ['Si tiras una piedra a la Sima, no se oye cuando llega. Lo he probado cien veces.']),
  resonator: 'El Resonador Sintético zumba sobre el vacío. La cadena roja que lo envuelve vibra a destiempo.',
  deckBarrier: 'PUENTE DE LA CONVERGENCIA\nTramo inestable. Prohibido el paso.',
  descentGap: 'Un trozo de la cornisa que baja a la Sima se ha desprendido. En los bordes del hueco quedan zócalos hexagonales, muy gastados.',
});

// ───────────────────────────── ocupación (parches y figurantes) ─────────────────────────────

/** Parches de la ocupación: valla de obra alrededor del recinto, caravana, contenedores, depósito y andamios. */
export function occupationPatch() {
  const C = COMPOUND;
  const fence = [
    ...rect(C.x0, RIM_Y + 1, C.x0, C.y1 - 1), // oeste
    ...rect(C.x1, RIM_Y + 1, C.x1, C.y1 - 1), // este
    ...rect(C.x0, C.y1, C.gate.x0, C.y1), // sur, hasta la puerta
    ...rect(C.gate.x1, C.y1, C.x1, C.y1),
  ];
  const scaffold = rect(SCAFFOLD.x0, SCAFFOLD.y0, SCAFFOLD.x1, SCAFFOLD.y1);
  const plate = BAKED.stamps.chapa_metal.layers.find((l) => l && l.some(Boolean)) || [];
  const w = BAKED.stamps.chapa_metal.w;
  return [
    ...barrierLine(BAKED, fence),
    ...stampPatch(BAKED, 'caravana', C.caravan.x, C.caravan.y),
    ...stampPatch(BAKED, 'contenedores', C.containers.x, C.containers.y),
    ...stampPatch(BAKED, 'deposito', C.tank.x, C.tank.y),
    // andamios: chapa sobre el vacío (capa 2, se pisa) desde el tablero hasta el Resonador
    ...scaffold.map(([x, y]) => [x, y, 2, plate[((y - SCAFFOLD.y0) % 2) * w + ((x - SCAFFOLD.x0) % w)] || plate[0]]),
  ];
}

function occupationEvents() {
  const C = COMPOUND;
  const events = [
    // un solo evento sin gráfico aplica todos los parches de la ocupación
    { id: 'ocupacion_consorcio', x: C.x0, y: C.y1, pages: [{ when: occupied, through: true, patch: occupationPatch() }] },
    {
      id: 'resonador', x: RESONATOR.x, y: RESONATOR.y, name: 'Resonador Sintético',
      pages: [{ when: occupied, sprite: OBJ.resonator, ...frame(0), stepAnime: true, speed: 2, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MIRADOR_TEXT.resonator); } }],
    },
    { id: 'cartel_consorcio', x: SPOTS.consortiumSign.x, y: SPOTS.consortiumSign.y, trigger: 'action', noOver: true, when: occupied, script: async (ctx) => { await ctx.say(MIRADOR_TEXT.consortium, { skin: 'sign hgss dir' }); } },
  ];
  C.guards.forEach((g, i) => {
    events.push({
      id: `guardia_consorcio_${i}`, x: g.x + (i === 0 ? 1 : -1), y: g.y, name: SPEAKER.tecnico,
      pages: [{
        when: occupied, sprite: i === 0 ? SPRITE.tecnico : SPRITE.tecnica, dir: 2, move: 'still', trigger: 'action',
        script: async (ctx) => { await lines(ctx, i === 0 ? SPEAKER.tecnico : SPEAKER.tecnica, ctx.flag(F.mirador) ? MIRADOR_TEXT.guardAfter : MIRADOR_TEXT.guard); },
      }],
    });
  });
  const workerLines = [MIRADOR_TEXT.worker1, MIRADOR_TEXT.worker2, MIRADOR_TEXT.worker3];
  C.workers.forEach((p, i) => {
    events.push(npc(`trabajador_consorcio_${i}`, p.x, p.y, i % 2 ? SPRITE.tecnica : SPRITE.tecnico, i % 2 ? SPEAKER.tecnica : SPEAKER.tecnico, workerLines[i], { dir: p.dir, move: 'still', when: occupied }));
  });
  C.tripods.forEach(([x, y], i) => events.push({ id: `tripode_mirador_${i}`, x, y, pages: [{ when: occupied, sprite: OBJ.tripod, dir: 2, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Un trípode de medición apunta a la Sima.'); } }] }));
  C.crates.forEach(([x, y], i) => events.push({ id: `caja_mirador_${i}`, x, y, pages: [{ when: occupied, sprite: OBJ.crate, ...frame(0), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Cajas de instrumental del Consorcio, precintadas.'); } }] }));
  return events;
}

// ───────────────────────────── escena de la ocupación ─────────────────────────────

/** Lleva al jugador delante de la puerta del recinto si la escena empezó lejos (avenida o bajada). */
async function walkToGate(ctx, guard) {
  const T = COMPOUND.trigger;
  const front = { x: T.x0 + 2, y: T.y };
  const p = ctx.player;
  if (Math.abs(p.x - front.x) + Math.abs(p.y - front.y) <= 2) return;
  if (guard) await ctx.emote(guard, '!');
  await ctx.say(MIRADOR_TEXT.scene.call);
  try {
    const { stageRoute } = await import('./b07_path.js');
    const route = stageRoute(ctx, p, front.x, front.y);
    if (route?.length) await ctx.move('player', route.slice(0, 60), { through: false, speed: 4 });
  } catch (err) {
    console.warn('[b17] mirador: no se pudo llevar al jugador a la valla', err);
  }
}

async function occupationScene(ctx) {
  const S = MIRADOR_TEXT.scene;
  ctx.setFlag(F.mirador);
  const guard = eventById(ctx, 'guardia_consorcio_0');
  await walkToGate(ctx, guard);
  ctx.face('player', 'up');
  if (guard) await ctx.emote(guard, '!');
  await ctx.say(S.stop, { speaker: SPEAKER.tecnico });
  ctx.bgm?.(MUSIC.genesis, { fadeOutPrevious: 30 });
  await ctx.camera.pan(RESONATOR.x, RESONATOR.y + 3, 60);
  await ctx.say(S.look);
  ctx.se?.('PRSFX- Charge', { volume: 60 });
  await ctx.say(S.ring);
  await ctx.say(S.a, { speaker: SPEAKER.tecnica });
  await ctx.say(S.b, { speaker: SPEAKER.tecnico });
  await ctx.say(S.c, { speaker: SPEAKER.tecnica });
  await ctx.camera.reset(40);
  await pause(ctx, 10);
  await zygardeSays(ctx, S.z1);
  await zygardeSays(ctx, S.z2);
  if (ctx.state.hasClue(MIRADOR_HINT_NOTE.id)) ctx.state.solveClue(MIRADOR_HINT_NOTE.id); // el aviso de Alerce, ya visto
  if (!ctx.state.hasClue(ANILLO_NOTE.id)) {
    ctx.state.addClue(ANILLO_NOTE.id, ANILLO_NOTE.text);
    ctx.se?.('Mining item get');
    await ctx.say(S.note);
  }
  ctx.bgm?.(MUSIC.sima, { fadeOutPrevious: 30 });
  await maybeAlerceCall(ctx);
}

function sceneTrigger() {
  const out = [];
  const pending = (s) => occupied(s) && !s.flag(F.mirador);
  for (const T of [COMPOUND.trigger, ...COMPOUND.approaches]) {
    for (let x = T.x0; x <= T.x1; x++) {
      const id = T === COMPOUND.trigger ? `escena_mirador_${x}` : `escena_mirador_${x}_${T.y}`;
      out.push({ id, x, y: T.y, through: true, trigger: 'touch', when: pending, script: occupationScene });
    }
  }
  return out;
}

// ───────────────────────────── público, entrenadores, bajada ─────────────────────────────

function publicEvents() {
  return [
    { id: 'cartel_mirador_sur', type: 'sign', ...SPOTS.sign, text: MIRADOR_TEXT.sign, skin: 'sign hgss dir' },
    { id: 'placa_puente', type: 'sign', ...SPOTS.legend, text: MIRADOR_TEXT.legend },
    npc('visitante_mirador', SPOTS.tourist.x, SPOTS.tourist.y, SPRITE.tourist, SPEAKER.tourist, MIRADOR_TEXT.tourist, { dir: SPOTS.tourist.dir, when: (s) => !s.flag(P8) }),
    npc('vecina_mirador', SPOTS.neighbor.x, SPOTS.neighbor.y, 'anil:mujer1', 'Vecina de Lúmina', (s) => MIRADOR_TEXT.neighbor(s), { dir: SPOTS.neighbor.dir, when: (s) => s.flag(P8) }),
    npc('nino_mirador', SPOTS.child.x, SPOTS.child.y, 'anil:chaval2', 'Niño', (s) => MIRADOR_TEXT.child(s), { dir: SPOTS.child.dir, move: { wander: 2 } }),
    {
      id: 'fotografa_marcela', type: 'trainer', trainer: 'b17_fotografa_marcela', name: 'Fotógrafa Marcela', sprite: 'anil:fotografa',
      ...SPOTS.trainerA, sight: 3, when: (s) => s.flag(P8),
      intro: '¡Alto ahí! Con esta luna, hasta un combate sale bien en foto.',
      after: 'Desde que pusieron la valla, las mejores fotos se hacen desde aquí. El anillo ese brilla que da miedo.',
    },
    {
      id: 'aspirante_ines', type: 'trainer', trainer: 'b17_aspirante_ines', name: 'Aspirante Inés', sprite: 'anil:aspirante_f',
      ...SPOTS.trainerB, sight: 3, when: (s) => s.flag(P8),
      intro: '¿Vienes a mirar la torre del espolón? Primero, a ver si sabes pisar firme.',
      after: 'La torre del espolón tira del suelo. Se nota en las rodillas.',
    },
  ];
}

/**
 * Barrera de obra a la entrada del estribo hasta el P9: del Mirador al Puente no se pasa. Con el P9 restaurado (B18) el
 * Puente vuelve a cruzar la Sima entera y el estribo sur queda abierto (si no, el tramo sur del Puente, que B18 abre
 * tras la escena de Vértice, moriría contra esta barrera).
 */
function deckEvents() {
  return DECK_BARRIER.map((p, i) => ({
    id: `barrera_estribo_${i}`, x: p.x, y: p.y,
    pages: [{
      when: (s) => !s.flag(F.p9), tileId: BARRIER[i % BARRIER.length] || BARRIER[0], solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(MIRADOR_TEXT.deckBarrier, { skin: 'sign hgss dir' }); },
    }],
  }));
}

/**
 * Tramo desprendido de la bajada: zócalos de Reconstrucción a los dos lados del hueco (flag compartido). Así la Sima del
 * Eje solo se alcanza desde aquí con la Forma Completa (CAMPANA §2.5 G14), aunque el Mirador Sur se visite desde B09.
 */
function descentGapEvents() {
  const stone = socketTiles('Exterior3').stone;
  const tiles = DESCENT_GAP.cells.map(([x, y]) => [x, y, 2, stone]);
  return DESCENT_GAP.sockets.map((p, i) => ({
    id: `zocalo_bajada_${i}`, type: 'rebuildGap', x: p.x, y: p.y, flag: DESCENT_GAP.flag, tiles, tutorial: true,
    blockedText: MIRADOR_TEXT.descentGap,
  }));
}

function descentEvents() {
  if (mapRegistered('sima_eje')) return descentGapEvents();
  const text = blockedText('mirador_sur', 'sima_eje');
  return [
    ...descentGapEvents(),
    ...DESCENT.block.map((p, i) => ({
      id: `bajada_mirador_${i}`, x: p.x, y: p.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => { await ctx.say(text, { skin: 'sign hgss dir' }); },
    })),
  ];
}

function items() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) }));
}

export function miradorEvents() {
  return [
    ...occupationEvents(),
    ...sceneTrigger(),
    ...publicEvents(),
    ...deckEvents(),
    ...descentEvents(),
    ...towerEvents({ ...TOWER, image: 'Exterior3' }, socketTiles('Exterior3')),
    ...items(),
  ];
}
