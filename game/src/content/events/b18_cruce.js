// Cámara del Cruce — salas (docs/CAMPANA.md B18 «Mazmorra: Cámara del Cruce (3 salas)»): la Cadena Roja se tensa en
// los cristales de cambio hacia Dialga (tiempo) o Palkia (espacio). Escombros, corrientes, pliegues y cristales salen
// de las salas ASCII (b18_cruce_rooms.js) con world/axis/roomEvents.js; las reglas son las genéricas de world/axis.
// Aquí: llegada, tutorial del primer cristal, rótulos de las salas, marcas de sala superada, estela del vestíbulo,
// warps entre salas y el atajo del vestíbulo al núcleo (se abre al llegar al núcleo por primera vez).
import { F, SPEAKER, lines, when, examine } from './b18_common.js';
import { ROOM_ITEMS, ROOM_NAMES } from './b18_cruce_rooms.js';
import { VESTIBULO, CAIDA, RIO, CRUCE, NUCLEO, SHORTCUT, ROOM_PLACES } from '../maps/b18/cruce_layout.js';
import { MOUTH } from '../maps/b18/puente_layout.js';
import { axisRoomEvents } from '../../world/axis/roomEvents.js';
import { syncAxis } from '../../world/axis/actions.js';
import { CORE_MAP } from '../maps/b18/vertical_layout.js';

export const CRUCE_TEXT = Object.freeze({
  arrive: [
    'Una sala de mármol plateado suspendida sobre el abismo. Del techo se desprenden piedras que caen hacia el fondo de la Sima.',
    'Más arriba retumban dos rugidos que no se ponen de acuerdo.',
  ],
  stele: 'Una estela de los Custodios. La Clave Glífica traduce: «Tira hacia el que detiene, y lo que cae se quedará. Tira hacia el que pliega, y lo lejano se acercará.»',
  sealed: 'Una puerta de piedra sellada. En el dintel, un hexágono apagado. Al otro lado se oyen dos rugidos.',
  roomDone: (n) => `Sala ${n} superada.`,
});

/** Tutorial del primer cristal: narración neutra (Zygarde habla muy poco, autor, 25-09-2026). */
export const CRYSTAL_TUTORIAL = Object.freeze([
  'El cristal vibra con la Cadena Roja. Si se tensa hacia uno de los dos, el Pilar obedece.',
  'Hacia Dialga, lo que se mueve se queda quieto. Hacia Palkia, las marcas violetas se abren y lo que se movía vuelve a moverse.',
]);

// ─────────────────────────────── salas ───────────────────────────────

function roomEvents(place, n) {
  const crystal = n === 0 ? { tutorial: [...CRYSTAL_TUTORIAL], tutorialFlag: F.tutorial } : {};
  const out = axisRoomEvents(place.grid, {
    ox: place.ox, oy: place.oy, prefix: place.name, safe: place.entry, crystal, items: ROOM_ITEMS[place.name] || [],
  });
  // Sala superada: la primera vez que se pisa su salida (marca para el Diario y las pruebas)
  const flag = [null, F.room1, F.room2, F.room3][n];
  if (flag && place.gate) {
    out.push({
      id: `${place.name}_superada`, x: place.gate.front.x, y: place.gate.front.y, through: true,
      pages: [{ when: when({ none: [flag] }), trigger: 'touch', through: true, script: async (ctx) => { ctx.setFlag(flag); ctx.ui?.toast?.(CRUCE_TEXT.roomDone(n)); } }],
    });
  }
  return out;
}

/** Estela del vestíbulo (pilar_placa_unown 2×2 en las filas bajas; se lee desde abajo). */
export const STELE = Object.freeze({ x: VESTIBULO.room.x + 8, y: VESTIBULO.oy + VESTIBULO.grid.h });

export function cruceEvents() {
  return [
    {
      id: 'escena_camara', x: 0, y: 0,
      pages: [{ when: when({ none: [F.chamberIn] }), trigger: 'auto', script: arrivalScene }],
    },
    ...ROOM_PLACES.flatMap((p, i) => roomEvents(p, i)),
    examine('estela_cruce', STELE.x, STELE.y + 1, CRUCE_TEXT.stele),
    examine('estela_cruce_b', STELE.x + 1, STELE.y + 1, CRUCE_TEXT.stele),
    {
      id: 'atajo_sellado', x: SHORTCUT.warp.x, y: SHORTCUT.warp.y,
      pages: [{ when: when({ none: [F.nucleus] }), solid: true, trigger: 'touch', script: async (ctx) => { await ctx.say(CRUCE_TEXT.sealed); } }],
    },
  ];
}

async function arrivalScene(ctx) {
  ctx.setFlag(F.chamberIn);
  for (const t of CRUCE_TEXT.arrive) await ctx.say(t);
}

// ─────────────────────────────── warps ───────────────────────────────

const stairWarps = (place, to) => place.stairs.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, ...to }));
const toFront = (place) => ({ to: 'camara_cruce', tx: place.gate.front.x, ty: place.gate.front.y, dir: 2 });
const gateWarp = (place, arrive) => ({ x: place.gate.warp.x, y: place.gate.warp.y, to: 'camara_cruce', tx: arrive.x, ty: arrive.y, dir: 8 });

export function cruceWarps() {
  return [
    // Vestíbulo: la escalinata baja al Puente (a la boca, mirando al sur)
    ...stairWarps(VESTIBULO, { to: 'puente_convergencia', tx: MOUTH.arrive.x, ty: MOUTH.arrive.y, dir: 2 }),
    gateWarp(VESTIBULO, CAIDA.stairs.arrive),
    ...stairWarps(CAIDA, toFront(VESTIBULO)),
    gateWarp(CAIDA, RIO.stairs.arrive),
    ...stairWarps(RIO, toFront(CAIDA)),
    gateWarp(RIO, CRUCE.stairs.arrive),
    ...stairWarps(CRUCE, toFront(RIO)),
    { ...gateWarp(CRUCE, NUCLEO.stairs.arrive), to: CORE_MAP },
    // El núcleo está arriba; al conocerlo, el atajo evita repetir los tres puzzles.
    { x: SHORTCUT.warp.x, y: SHORTCUT.warp.y, to: CORE_MAP, tx: NUCLEO.stairs.arrive.x, ty: NUCLEO.stairs.arrive.y, dir: 8 },
  ];
}

// ─────────────────────────────── al entrar ───────────────────────────────

/** Sala del mapa en la que está el jugador (o 'nucleo'). */
export function roomAt(x, y) {
  for (const p of ROOM_PLACES) {
    const r = p.room;
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return p.name;
  }
  const n = NUCLEO.room;
  if (x >= n.x && x < n.x + n.w && y >= n.y && y < n.y + n.h) return 'nucleo';
  return null;
}

let lastRoom = null;

/** Al entrar (o cambiar de sala: los warps internos vuelven a entrar en el mapa): tono del eje y rótulo de la sala. */
export async function cruceEnter(ctx) {
  syncAxis(ctx);
  const room = roomAt(ctx.player.x, ctx.player.y);
  if (room === 'nucleo') {
    // Las partidas anteriores guardaban esta sala dentro del mapa del puzzle. Mantener coordenadas y switches
    // permite continuar incluso entre la elección, el KO, la restauración y la recogida del orbe.
    const prefix = 'camara_cruce:';
    for (const [key, value] of Object.entries(ctx.state.data.selfSwitches)) {
      if (!key.startsWith(prefix) || !value) continue;
      const [, id, letter] = key.split(':');
      if (/^(dialga_nucleo|palkia_nucleo|nucleo_|orbe_no_elegido|elegido_reaparece|placa_nucleo)/.test(id)) {
        ctx.state.setSelfSwitch(CORE_MAP, id, letter, true);
      }
    }
    if (ctx.map.id === 'camara_cruce') {
      await ctx.warp(CORE_MAP, ctx.player.x, ctx.player.y, ctx.player.direction, { fade: false });
      return;
    }
  }
  const name = room === 'nucleo' ? 'Núcleo del Cruce' : ROOM_NAMES[room];
  if (room && room !== lastRoom && name) ctx.ui?.showLocation?.(name);
  lastRoom = room;
}

export { SPEAKER, lines, CAIDA, RIO, CRUCE };
