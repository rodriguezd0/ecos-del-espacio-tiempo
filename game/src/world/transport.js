// Transporte regional (docs/CAMPANA.md §1.7, X12):
//   · Tren regional tras P4 (p4_restored): Caudal, Brontia, Estrato, Lúmina y Nexo. Cada estación se activa
//     la primera vez que el jugador la usa o la visita (flag train_station_<id>).
//   · Ferris tras P7 (p7_restored): Nexo ↔ Caleta Sonda y Nexo ↔ Villa Boreal.
// Uso desde el mapa de una estación (evento de taquilla o revisor):
//   { id: 'taquilla', x, y, sprite: 'anil:…', script: (ctx) => takeTrain(ctx, 'caudal') }
//   o el atajo stationEvent({ id, x, y, station: 'caudal' }) / portEvent({ id, x, y, port: 'nexo' }).
// La llegada usa `arrival` { x, y, dir } de la estación (null = start del mapa): quien construya el mapa de la
// estación rellena aquí sus coordenadas. Módulo sin DOM (la tarjeta de viaje se carga bajo demanda).

export const TRAIN_UNLOCK_FLAG = 'p4_restored';
export const FERRY_UNLOCK_FLAG = 'p7_restored';
export const stationFlag = (id) => `train_station_${id}`;

const stop = (id, name, map, arrival = null) => Object.freeze({ id, name, map, arrival });

export const TRAIN = Object.freeze({
  kind: 'train',
  name: 'Tren regional',
  unlockFlag: TRAIN_UNLOCK_FLAG,
  needsVisit: true,
  stops: Object.freeze([
    stop('caudal', 'Ciudad Caudal', 'ciudad_caudal', { x: 57, y: 44, dir: 2 }), // B03: delante de la estación (caudal_layout.js TRAIN_ARRIVAL)
    stop('brontia', 'Villa Brontia', 'villa_brontia', { x: 28, y: 34, dir: 2 }), // B05: delante de la estación (villa_brontia_layout.js TRAIN_ARRIVAL)
    stop('estrato', 'Ciudad Estrato', 'ciudad_estrato'),
    stop('lumina', 'Ciudad Lúmina', 'ciudad_lumina'),
    stop('nexo', 'Ciudad Nexo', 'ciudad_nexo'),
  ]),
  routes: null, // todas las estaciones se comunican entre sí
});

export const FERRY = Object.freeze({
  kind: 'ferry',
  name: 'Ferri',
  unlockFlag: FERRY_UNLOCK_FLAG,
  needsVisit: false,
  stops: Object.freeze([
    stop('nexo', 'Ciudad Nexo', 'ciudad_nexo'),
    stop('caleta', 'Caleta Sonda', 'caleta_sonda'),
    stop('boreal', 'Villa Boreal', 'villa_boreal'),
  ]),
  routes: Object.freeze([['nexo', 'caleta'], ['nexo', 'boreal']]),
});

const TEXT = Object.freeze({
  trainClosed: 'El servicio de tren está suspendido.',
  ferryClosed: 'Los ferris no salen: el mar está revuelto.',
  none: 'Todavía no hay otros destinos disponibles.',
  ask: (name) => `${name}. ¿Adónde quieres ir?`,
  cancel: 'Cancelar',
  arrive: (name) => `Has llegado a ${name}.`,
});

function stopOf(net, id) {
  const s = net.stops.find((x) => x.id === id);
  if (!s) throw new Error(`${net.name}: parada desconocida "${id}" (${net.stops.map((x) => x.id).join(', ')})`);
  return s;
}

/** ¿Está en servicio la red? (flag de desbloqueo; una red sin unlockFlag siempre lo está). */
export function networkOpen(state, net) {
  return !net.unlockFlag || state.flag(net.unlockFlag);
}

/** ¿Está activa la estación? (redes con needsVisit: flag de estación o haber pisado su mapa). */
export function stopActive(state, net, stopId) {
  if (!net.needsVisit) return true;
  const s = stopOf(net, stopId);
  return state.flag(stationFlag(s.id)) || (state.data.visited || []).includes(s.map);
}

/** Registra la visita a una estación (la activa como destino). */
export function markStation(state, stopId, net = TRAIN) {
  stopOf(net, stopId);
  if (net.needsVisit) state.setFlag(stationFlag(stopId));
}

/** Destinos disponibles desde una parada: [{ id, name, map, arrival }]. */
export function destinations(state, net, fromId) {
  stopOf(net, fromId);
  if (!networkOpen(state, net)) return [];
  const linked = net.routes
    ? net.routes.filter((r) => r.includes(fromId)).map((r) => (r[0] === fromId ? r[1] : r[0]))
    : net.stops.map((s) => s.id);
  return net.stops.filter((s) => s.id !== fromId && linked.includes(s.id) && stopActive(state, net, s.id));
}

async function travel(ctx, net, from, to) {
  await ctx.fade?.('out', 20);
  if (typeof document !== 'undefined') {
    try {
      const fx = await import('../content/story/storyFx.js');
      await fx.showTravel({ kind: net.kind, title: net.name, from: from.name, to: to.name });
    } catch (err) {
      console.error('[transporte] tarjeta de viaje', err);
    }
  }
  const a = to.arrival || {};
  await ctx.warp(to.map, a.x, a.y, a.dir ?? 2, { fade: false });
  await ctx.fade?.('in', 20);
}

/**
 * Taquilla de una red: activa la parada actual, pregunta el destino y viaja con una tarjeta de transición.
 * opts: { network (TRAIN|FERRY|red de prueba con la misma forma), speaker, silent }. → id de destino o null.
 */
export async function takeTransport(ctx, fromId, opts = {}) {
  const net = opts.network || TRAIN;
  const from = stopOf(net, fromId);
  const say = (t) => ctx.say(t, opts.speaker ? { speaker: opts.speaker } : {});
  markStation(ctx.state, fromId, net);
  if (!networkOpen(ctx.state, net)) {
    await say(net.kind === 'ferry' ? TEXT.ferryClosed : TEXT.trainClosed);
    return null;
  }
  const list = destinations(ctx.state, net, fromId);
  if (!list.length) { await say(TEXT.none); return null; }
  const i = await ctx.choice([...list.map((s) => s.name), TEXT.cancel], { message: TEXT.ask(net.name), cancel: list.length });
  const to = list[i];
  if (!to) return null;
  await travel(ctx, net, from, to);
  return to.id;
}

export const takeTrain = (ctx, fromId, opts = {}) => takeTransport(ctx, fromId, { ...opts, network: opts.network || TRAIN });
export const takeFerry = (ctx, fromId, opts = {}) => takeTransport(ctx, fromId, { ...opts, network: opts.network || FERRY });

/** Evento de taquilla de tren listo para `events: [...]` de un mapa de estación. */
export function stationEvent({ station, network, sprite = 'anil:marinero', dir = 2, speaker = 'Taquilla', ...rest }) {
  if (!station) throw new Error('stationEvent: falta "station"');
  return { sprite, dir, trigger: 'action', ...rest, script: (ctx) => takeTrain(ctx, station, { network, speaker }) };
}

/** Evento de muelle de ferri. */
export function portEvent({ port, network, sprite = 'anil:marinero', dir = 2, speaker = 'Muelle', ...rest }) {
  if (!port) throw new Error('portEvent: falta "port"');
  return { sprite, dir, trigger: 'action', ...rest, script: (ctx) => takeFerry(ctx, port, { network, speaker }) };
}
