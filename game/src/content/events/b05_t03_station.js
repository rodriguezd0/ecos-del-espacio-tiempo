// Subestación de Brontia (TABLILLAS T03: «en la subestación, reconectar los cables: un circuito de interruptores
// con un solo camino válido, para desviar el rayo de la torre a la red»). Tablero en el suelo con 9 cajas de empalme
// (3 quemadas) y 12 interruptores; la palanca general prueba la línea: si la corriente toca una caja quemada salta el
// diferencial y todo se reinicia (interruptores reiniciables, sin fallo permanente). La operaria cuenta el apagón y
// el contrato del Consorcio (CAMPANA B05). Lógica pura en content/events/b05_circuit.js.
import { F, SPEAKER, SPRITE, say, byGender } from './b05_common.js';
import {
  SWITCHES, DAMAGED, INPUT, OUTPUT, ROWS, COLS, node, nodeTile, switchTile, evaluateCircuit,
} from './b05_circuit.js';

export const MAP_ID = 'brontia_subestacion';

/** Coordenadas del interior (content/maps/b05/brontia_subestacion.js). */
export const STATION = Object.freeze({
  width: 19, height: 14,
  room: { x: 1, y: 1, w: 17, h: 11 }, // suelo y 4–11
  door: { x: 9, y: 11 },
  board: { x: 7, y: 5 }, // caja J00; el tablero ocupa x 7–11, y 5–9
  input: [{ x: 7, y: 4 }], // cable del pararrayos que baja por la pared hasta J00
  output: [{ x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 }], // cable de J22 a la red
  mains: { x: 15, y: 9 }, // cuadro de salida a la red del pueblo
  lever: { x: 14, y: 4 }, // palanca general (bajo el cuadro de la pared)
  diagram: [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }], // esquema en la pared
  operator: { x: 4, y: 8, dir: 6 },
});

const T = Object.freeze({
  opIntro: (s) => [
    `${byGender(s, 'Bienvenido', 'Bienvenida')} a la subestación de Brontia. O a lo que queda de ella.`,
    s.flag(F.p3)
      ? 'El Parque Eólico vuelve a dar luz, sí. Pero la reserva de la subestación sigue vacía.'
      : 'Sin el Parque Eólico, aquí no entra ni un voltio. Desde que el ayuntamiento le dio el «mantenimiento» al Consorcio, el Parque no produce nada.',
    'Antes, el pararrayos del campanario estaba conectado a esta red: cada tormenta cargaba las baterías de reserva. Cortaron la línea hace años.',
    'Si alguien reconectara los cables sin tocar las cajas quemadas, el rayo de cada noche nos daría luz en vez de sustos.',
  ],
  opHint: 'La línea del pararrayos entra por la caja de arriba a la izquierda. La red sale por la de abajo a la derecha. Las cajas negras están quemadas: si les llega corriente, salta el diferencial.',
  opDone: 'La línea está conectada. Cuando caiga el rayo esta noche, lo sabremos.',
  opLight: (s) => (s.flag(F.p3)
    ? 'Cada noche, el rayo carga la reserva. Si el Parque vuelve a fallar, Brontia no se quedará a oscuras. Gracias.'
    : '¡Tenemos luz! No toda, pero las farolas de la plaza vuelven a encenderse. Gracias.'),
  diagram: 'ESQUEMA DEL CUADRO\nEntrada: línea del pararrayos (arriba a la izquierda).\nSalida: red del pueblo (abajo a la derecha).\fLas cajas quemadas derivan a tierra: si reciben corriente, salta el diferencial y se abren todos los interruptores.',
  mains: 'Salida a la red del pueblo. La aguja del voltímetro está en cero.',
  mainsOn: 'Salida a la red del pueblo. La aguja tiembla, esperando.',
  lever: 'La palanca general del cuadro.',
  leverAsk: '¿Qué quieres hacer con la palanca general?',
  leverOpts: ['Probar la línea', 'Abrir todos los interruptores', 'Nada'],
  open: 'La corriente no llega a la red: la línea está cortada en algún punto.',
  short: '¡Chispazo! La corriente ha tocado una caja quemada y ha saltado el diferencial. Todos los interruptores se han abierto.',
  ok: 'Un zumbido recorre el cuadro de punta a punta. ¡La línea del pararrayos llega a la red sin tocar ninguna caja quemada!',
  reset: 'Has abierto todos los interruptores.',
  locked: 'El interruptor está fijado. La línea ya está conectada.',
  node: 'Una caja de empalme.',
  burnt: 'Una caja de empalme quemada. Huele a cable chamuscado y suelta chispas.',
});

const swState = (s, id) => Boolean(s?.selfSwitch(MAP_ID, id, 'A'));
/** Interruptores cerrados según el estado guardado. */
export function closedSwitches(state) {
  return SWITCHES.filter((sw) => swState(state, sw.id)).map((sw) => sw.id);
}

/** ¿Está este interruptor en el camino con corriente (tras conectar la línea)? */
function litSwitch(s, sw) {
  if (!s?.flag(F.circuit)) return false;
  const { energized } = evaluateCircuit(closedSwitches(s));
  return swState(s, sw.id) && energized.includes(sw.a) && energized.includes(sw.b);
}

function setAll(ctx, value) {
  for (const sw of SWITCHES) ctx.state.setSelfSwitch(MAP_ID, sw.id, 'A', value);
  ctx.requestRefresh();
}

async function testLine(ctx) {
  ctx.se('PRSFX- Shift Gear', { volume: 70 });
  await ctx.wait(12);
  const r = evaluateCircuit(closedSwitches(ctx.state));
  if (r.result === 'short') {
    ctx.se('PRSFX- Spark1', { volume: 90 });
    await ctx.flash([255, 250, 200], 10, 200);
    ctx.shake(3, 8, 10);
    setAll(ctx, false);
    await ctx.say(T.short);
    return false;
  }
  if (r.result === 'open') { ctx.se('Player bump'); await ctx.say(T.open); return false; }
  ctx.se('PRSFX- Electric Terrain', { volume: 80 });
  ctx.setFlag(F.circuit);
  await ctx.flash([255, 240, 150], 14, 140);
  await ctx.say(T.ok);
  if (ctx.world.events.some((e) => e.id === 'operaria')) {
    ctx.turnToPlayer('operaria');
    await say(ctx, SPEAKER.operator, '¡Lo has conseguido! Ahora solo falta que caiga el rayo. Esta noche, como todas.');
  }
  return true;
}

function boardEvents() {
  const { x: x0, y: y0 } = STATION.board;
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = node(r, c);
      const t = nodeTile(id, x0, y0);
      const burnt = DAMAGED.includes(id);
      out.push({
        id: `caja_${id}`, x: t.x, y: t.y, sprite: SPRITE.board, directionFix: true, walkAnime: false, shadow: false,
        dir: burnt ? 4 : 2, stepAnime: burnt, speed: 4,
        pages: [
          { pattern: 0, trigger: 'action', script: async (ctx) => { await ctx.say(burnt ? T.burnt : T.node); } },
          ...(burnt ? [] : [{ when: (s) => Boolean(s?.flag(F.circuit)) && evaluateCircuit(closedSwitches(s)).energized.includes(id), pattern: 1, light: { radius: 40, intensity: 0.8 }, trigger: 'action', script: async (ctx) => { await ctx.say(T.node); } }]),
        ],
      });
    }
  }
  for (const sw of SWITCHES) {
    const t = switchTile(sw, x0, y0);
    const dir = sw.axis === 'h' ? 6 : 8;
    const base = { sprite: SPRITE.board, dir, directionFix: true, walkAnime: false, shadow: false, through: true, trigger: 'action' };
    out.push({
      id: sw.id, x: t.x, y: t.y,
      pages: [
        { ...base, pattern: 0, script: async (ctx) => { ctx.se('PRSFX- Switcheroo', { volume: 60 }); ctx.setSelfSwitch('A', true); } },
        { ...base, when: (s, ev) => ev.selfSwitch('A'), pattern: 1, script: async (ctx) => { ctx.se('PRSFX- Switcheroo', { volume: 60 }); ctx.setSelfSwitch('A', false); } },
        { ...base, when: (s) => Boolean(s?.flag(F.circuit)), pattern: 0, script: async (ctx) => { await ctx.say(T.locked); } },
        { ...base, when: (s, ev) => Boolean(s?.flag(F.circuit)) && ev.selfSwitch('A'), pattern: 1, script: async (ctx) => { await ctx.say(T.locked); } },
        { ...base, when: (s) => litSwitch(s, sw), pattern: 2, script: async (ctx) => { await ctx.say(T.locked); } },
      ],
    });
  }
  // Cables fijos: entrada desde la pared y salida hacia la red
  STATION.input.forEach((p, i) => out.push({ id: `cable_entrada_${i}`, x: p.x, y: p.y, sprite: SPRITE.board, dir: 8, pattern: 3, directionFix: true, walkAnime: false, shadow: false, solid: true,
    trigger: 'action', script: async (ctx) => { await ctx.say('La línea del pararrayos del campanario baja por la pared hasta el cuadro.'); } }));
  STATION.output.forEach((p, i) => out.push({ id: `cable_salida_${i}`, x: p.x, y: p.y, sprite: SPRITE.board, dir: 6, pattern: 3, directionFix: true, walkAnime: false, shadow: false, through: true }));
  return out;
}

function staffEvents() {
  const o = STATION.operator;
  return [
    {
      id: 'operaria', x: o.x, y: o.y, name: SPEAKER.operator, sprite: SPRITE.operator, dir: o.dir, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.light) || ctx.flag(F.strike)) { await say(ctx, SPEAKER.operator, T.opLight(ctx.state)); return; }
        if (ctx.flag(F.circuit)) { await say(ctx, SPEAKER.operator, T.opDone); return; }
        if (!ctx.flag(F.operator)) {
          for (const line of T.opIntro(ctx.state)) await say(ctx, SPEAKER.operator, line);
          ctx.setFlag(F.operator);
        }
        await say(ctx, SPEAKER.operator, T.opHint);
      },
    },
    ...STATION.diagram.map((d, i) => ({ id: `esquema_${i}`, x: d.x, y: d.y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(T.diagram); } })),
    {
      id: 'cuadro_red', x: STATION.mains.x, y: STATION.mains.y, sprite: SPRITE.board, dir: 2, pattern: 0, directionFix: true, walkAnime: false, shadow: false, solid: true,
      pages: [
        { trigger: 'action', script: async (ctx) => { await ctx.say(T.mains); } },
        { when: (s) => Boolean(s?.flag(F.circuit)), pattern: 1, trigger: 'action', script: async (ctx) => { await ctx.say(T.mainsOn); } },
      ],
    },
    {
      id: 'palanca_general', x: STATION.lever.x, y: STATION.lever.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        if (ctx.flag(F.circuit)) { await ctx.say(T.locked); return; }
        await ctx.say(T.lever);
        const i = await ctx.choice(T.leverOpts, { message: T.leverAsk, cancel: 2 });
        if (i === 0) await testLine(ctx);
        else if (i === 1) { setAll(ctx, false); await ctx.say(T.reset); }
      },
    },
  ];
}

export function stationEvents() {
  return [...boardEvents(), ...staffEvents()];
}

export { INPUT, OUTPUT };
