// Eventos de Ciudad Caudal (docs/CAMPANA.md B03; coordenadas en maps/b03/caudal_layout.js):
//   · Gael en el puente de entrada y la llamada de Alerce (b03_caudal_gael.js)
//   · Anselmo (T02), pescador (Caña Vieja), mercado, tutor y vecinos (b03_caudal_npcs.js)
//   · Esclusa mayor: compuertas con rebose, cartel y C014 (aparece tras la escena de Gael)
//   · C068 en el canal del Mercado, junto al tercer puente (Nadar, etapa F)
//   · Ruedas de molino: a trompicones de día y paradas de noche hasta P2; después giran (la del Diezmo, al revés
//     hasta que se resuelve T02) — cambio en el mundo que dejan preparado los bloques B04/B05
//   · Barrio bajo: charcos de día y sacos terreros hasta P2
//   · Puertas cerradas, carteles, objetos y enlaces pendientes (Ruta 3, Ruta 4, Senda del Mirador)
import { F, SPRITE, OBJ, objectEvent, when, cellsOf, cellEvent, blockedLink, say } from './b03_common.js';
import { gaelEvents } from './b03_caudal_gael.js';
import { anselmoEvent, marketEvents, caudalNeighbors } from './b03_caudal_npcs.js';
import { PENDING_LINKS } from '../maps/b03/pending_links.js';
import {
  W, H, LOCK, WHEELS, BUILDINGS, WEST_EXIT, EAST_EXIT, SOUTH_EXIT, NORTH_ENTRY,
} from '../maps/b03/caudal_layout.js';

const isDay = (s) => (typeof s?.isDay === 'function' ? s.isDay() : true);
const hasTablet = (s, id) => (s?.data?.tablets || []).includes(id);

const TEXT = Object.freeze({
  entrada: 'CIUDAD CAUDAL\n«La ciudad de las esclusas.»',
  esclusa: 'ESCLUSA MAYOR DE CAUDAL\nCompuertas al cuidado de la Casa de las Esclusas. Prohibido tocar los tornos.',
  molinos: 'BARRIO DE LOS MOLINOS\n← Molino harinero · Molino del Diezmo ↓',
  mercado: 'MERCADO FLUVIAL\nMiel, bayas y lo que traiga el río.',
  estacion: 'ESTACIÓN DE CAUDAL\nServicio de tren suspendido hasta nuevo aviso.',
  estacionAbierta: 'ESTACIÓN DE CAUDAL\nTren regional: Caudal · Brontia · Estrato · Lúmina · Nexo.',
  senda: 'PASO CERRADO\nSenda del Mirador. Desprendimientos hacia la Sima del Eje.',
  barrioBajo: 'BARRIO BAJO\nSe ruega no retirar los sacos de las puertas.',
  tablon: 'TABLÓN MUNICIPAL\n«Aviso: el nivel del Albo varía de forma imprevista. No bajéis a los cauces.»\n«La Casa de las Esclusas informa: situación bajo control.»',
});

// ── Esclusa mayor ──────────────────────────────────────────────────────────────────────────
/** Tramos de compuerta (compuerta.png): fila 2 arriba, 4 centro, 6 abajo; rebose animado. */
function lockGates() {
  const out = [];
  LOCK.gates.forEach((g, gi) => {
    for (let y = g.y0; y <= g.y1; y++) {
      const dir = y === g.y0 ? 2 : (y === g.y1 ? 6 : 4);
      out.push({
        id: `compuerta_${gi}_${y}`, x: g.x, y, sprite: SPRITE.gate, dir, directionFix: true, walkAnime: false,
        stepAnime: true, speed: 3, shadow: false, through: false, trigger: 'action',
        script: async (ctx) => { await ctx.say('Una compuerta de madera con flejes de hierro. El agua rebosa por encima, a borbotones.'); },
      });
    }
  });
  return out;
}

// ── Ruedas de molino ───────────────────────────────────────────────────────────────────────
/**
 * Rueda (noria.png): dir 2 gira · 4 parada · 6 al revés · 8 a trompicones. Antes de P2 va a trompicones de día y
 * parada de noche (el Albo errático); tras P2 gira. La del Diezmo no gira antes de P2 («el río ya no lo mueve»,
 * Anselmo) y tras P2 gira al revés hasta la Tabla Linfa (TABLILLAS T02, estado del mundo).
 */
function wheel(id, pos, { diezmo = false } = {}) {
  const base = { id, x: pos.x, y: pos.y, sprite: SPRITE.wheel, directionFix: true, walkAnime: false, shadow: false, through: false, trigger: 'action' };
  const look = (text) => async (ctx) => { await ctx.say(text); };
  const diezmoPages = [
    { when: (s) => !s?.flag(F.p2), dir: 4, stepAnime: false, script: look('La rueda del Diezmo está quieta. El agua pasa por debajo y no consigue moverla.') },
    { when: (s) => Boolean(s?.flag(F.p2)) && !hasTablet(s, 'SPLASHPLATE'), dir: 6, stepAnime: true, speed: 3, script: look('La rueda del Diezmo gira… al revés. Contra el agua.') },
  ];
  return {
    ...base,
    pages: [
      { when: (s) => !s?.flag(F.p2) && isDay(s), dir: 8, stepAnime: true, speed: 2, script: look('La rueda gira a trompicones: avanza, se para, vuelve a avanzar. El agua no llega con fuerza.') },
      { when: (s) => !s?.flag(F.p2) && !isDay(s), dir: 4, stepAnime: false, script: look('La rueda está quieta. Por debajo apenas corre un hilo de agua.') },
      { when: (s) => Boolean(s?.flag(F.p2)), dir: 2, stepAnime: true, speed: 3, script: look('La rueda gira con buen ritmo. Dentro, la muela canta.') },
      ...(diezmo ? diezmoPages : []),
    ],
  };
}

// ── Barrio bajo: charcos (de día) y sacos (hasta P2) ───────────────────────────────────────
const PUDDLES = [[27, 49], [31, 50], [38, 49], [42, 50], [35, 51], [45, 48], [23, 50]];
const SANDBAGS = [[29, 49, 0], [35, 49, 1], [41, 49, 0]];

function lowQuarter() {
  const out = PUDDLES.map(([x, y], i) => objectEvent(`charco_${i}`, x, y, OBJ.puddle(i), {
    when: (s) => !s?.flag(F.p2) && isDay(s),
  }));
  for (const [x, y, v] of SANDBAGS) {
    out.push(objectEvent(`sacos_${x}`, x, y, OBJ.sandbags(v), {
      through: false, when: (s) => !s?.flag(F.p2), trigger: 'action',
      script: async (ctx) => { await ctx.say('Sacos terreros apilados delante de la puerta. Están húmedos por abajo.'); },
    }));
  }
  return out;
}

/** Refresca las páginas cuando cambia el día y la noche (charcos, ruedas y vecinos dependen de la hora). */
function dayWatcher() {
  return {
    id: 'reloj_rio', x: 0, y: 0, trigger: 'parallel',
    script: async (ctx) => {
      const day = isDay(ctx.state);
      if (ctx.event.lastDay !== undefined && ctx.event.lastDay !== day) ctx.requestRefresh();
      ctx.event.lastDay = day;
      await ctx.wait(60);
    },
  };
}

// ── Puertas cerradas ───────────────────────────────────────────────────────────────────────
function lockedDoor(id, key, text) {
  const d = BUILDINGS[key].door;
  return { id, x: d.x, y: d.y, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(text); } };
}

function doors(open) {
  const out = [
    lockedDoor('puerta_molino2', 'molino2', 'Molino de la Aceña. Cerrado.\nPor la rendija se ve la muela quieta y un gato dormido encima.'),
    lockedDoor('puerta_casa_norte', 'casaNorte', 'Está cerrado. Dentro suena una radio: «…se ruega a los vecinos del barrio bajo que no bajen a los cauces…»'),
    lockedDoor('puerta_taberna', 'taberna', 'CASA DE COMIDAS «EL CANAL»\nCerrado por inundación. Volvemos cuando el río vuelva.'),
    lockedDoor('puerta_bajo2', 'bajo2', 'Una voz desde dentro: «¡No se puede pasar, estamos achicando agua!»'),
    lockedDoor('puerta_bajo3', 'bajo3', 'La puerta está atrancada con tablones. No hay nadie.'),
    lockedDoor('puerta_este', 'este', 'Nadie contesta. En el buzón pone: «Familia Vado».'),
  ];
  if (!open.diezmo) out.push(lockedDoor('puerta_diezmo', 'diezmo', 'La puerta del Molino del Diezmo está atrancada por dentro. Alguien ha escrito con tiza: «NO SE VENDE».'));
  return out;
}

// ── Enlaces pendientes ─────────────────────────────────────────────────────────────────────
function pendingLinks(open) {
  const out = [];
  const L = PENDING_LINKS.ciudad_caudal;
  if (!open.ruta_3) {
    const cells = [];
    for (let y = WEST_EXIT.y0; y <= WEST_EXIT.y1; y++) cells.push([0, y]);
    out.push(...blockedLink('limite_oeste', cells, L.ruta_3.blocked, 'right', 'left'));
  }
  if (!open.ruta_4) {
    const cells = [];
    for (let y = EAST_EXIT.y0; y <= EAST_EXIT.y1; y++) cells.push([W - 1, y]);
    out.push(...blockedLink('limite_este', cells, L.ruta_4.blocked, 'left', 'right'));
  }
  if (!open.senda) {
    out.push({ id: 'cartel_senda', type: 'sign', x: SOUTH_EXIT.x0 - 1, y: SOUTH_EXIT.gate.y - 1, text: TEXT.senda });
    const gateText = async (ctx) => { await ctx.say('Una verja de hierro cerrada con cadena. Al otro lado, la senda baja hacia la Sima.'); };
    for (let x = SOUTH_EXIT.x0; x <= SOUTH_EXIT.x1; x++) {
      for (let y = SOUTH_EXIT.gate.y; y <= SOUTH_EXIT.gate.y + 1; y++) {
        out.push({ id: `verja_${x}_${y}`, x, y, trigger: 'action', noOver: true, script: gateText });
      }
    }
  }
  return out;
}

/** Eventos de Ciudad Caudal. `open` = { ruta_3, ruta_4, senda, diezmo } (mapas vecinos ya registrados). */
export function caudalEvents(open = {}) {
  return [
    ...gaelEvents(),
    ...cellsOf('ciudad_caudal').map((c) => (c.id === 'cell_caudal_1' ? cellEvent(c, { when: (s) => Boolean(s?.flag(F.gael)) }) : cellEvent(c))),
    ...lockGates(),
    wheel('rueda_molino', WHEELS.molino),
    wheel('rueda_acena', WHEELS.molino2),
    wheel('rueda_diezmo', WHEELS.diezmo, { diezmo: true }),
    ...lowQuarter(),
    dayWatcher(),
    anselmoEvent(),
    ...marketEvents(),
    ...caudalNeighbors(),
    ...doors(open),
    ...pendingLinks(open),
    // Carteles
    { id: 'cartel_entrada', type: 'sign', x: NORTH_ENTRY.x1 + 2, y: 6, text: TEXT.entrada },
    { id: 'cartel_esclusa', type: 'sign', x: LOCK.sign.x, y: LOCK.sign.y, text: TEXT.esclusa },
    { id: 'cartel_molinos', type: 'sign', x: 12, y: 25, text: TEXT.molinos },
    { id: 'cartel_mercado', type: 'sign', x: 43, y: 43, text: TEXT.barrioBajo },
    { id: 'tablon_plaza', type: 'sign', x: 29, y: 32, text: TEXT.tablon },
    { id: 'tablon_plaza_2', type: 'sign', x: 30, y: 32, text: TEXT.tablon },
    {
      id: 'cartel_estacion', type: 'sign', x: 60, y: 45,
      script: async (ctx) => { await ctx.say(ctx.flag(F.p4) ? TEXT.estacionAbierta : TEXT.estacion, { skin: 'signskin' }); },
    },
    // Objetos
    { id: 'pokeball_jardin', type: 'item', x: 20, y: 50, item: 'POKEBALL' },
    { id: 'superpocion_molinos', type: 'item', x: 2, y: 39, item: 'SUPERPOTION' },
    { id: 'miel_oculta_jardin', type: 'item', x: 3, y: 50, item: 'HONEY', hidden: true },
    { id: 'eter_oculto_fuente', type: 'item', x: 22, y: 28, item: 'ETHER', hidden: true },
    { id: 'antiparalizador_oculto', type: 'item', x: 61, y: 20, item: 'PARALYZEHEAL', hidden: true },
    // Entrenadores del mercado y del paseo
    {
      id: 'pescadora_luz', type: 'trainer', trainer: 'cc_pescadora_luz', name: 'Pescadora Luz', sprite: 'anil:pescadora',
      x: 23, y: 39, dir: 6, sight: 3,
      intro: 'El río está raro, pero mis Pokémon no. ¿Lo comprobamos?',
      after: 'Con la caña de mi vecino de muelle se pesca de maravilla. Pídesela, es un pesado pero la regala.',
    },
    {
      id: 'marinero_bruno', type: 'trainer', trainer: 'cc_marinero_bruno', name: 'Marinero Bruno', sprite: 'anil:marinero',
      x: 47, y: 24, dir: 4, sight: 4,
      intro: '¡Eh! Llevo tres días sin poder sacar la barca. Necesito desfogarme.',
      after: 'Cuando el Albo se calme volveré a remar hasta la vega. Hoy, ni pensarlo.',
    },
    {
      // En el muro del río (casilla de agua), se lee desde el paseo sur: no tapa la salida de la pasarela.
      id: 'nivel_rio', x: 36, y: 13, trigger: 'action', noOver: true,
      script: async (ctx) => {
        await ctx.say(isDay(ctx.state)
          ? 'Una escala pintada en el muro del río. Hoy el agua llega a la marca roja: «CRECIDA».'
          : 'Una escala pintada en el muro del río. El agua apenas llega a la última marca.');
        await say(ctx, 'Cartel', 'Nivel del Albo — Casa de las Esclusas.');
      },
    },
  ].filter((e) => e.x >= 0 && e.y >= 0 && e.x < W && e.y < H);
}
