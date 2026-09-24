// Eventos exteriores de Ciudad Lúmina (docs/CAMPANA.md B09 parte A): invitación automática a la gala al llegar,
// Gael en la escalinata del museo (B3, b09a_gael.js), puerta del museo, vía y topera de la estación, vecinos que
// cambian de frase con la historia, patio de la guardería, Parque de las Eras (entrenadores, tutor, C042 y la
// Galladita), carteles, puertas cerradas y la verja del Mirador Sur (B17).
import { F, SPEAKER, SPRITE, when, examine, npc, isNight, byGender } from './b09a_common.js';
import { galaInvitationEvents } from './b09a_gala.js';
import { gaelStepsEvents } from './b09a_gael.js';
import { railEvents, railStop } from './b09a_rail.js';
import { b09aCellEvents } from './b09a_cells.js';
import { moveTutorEvent } from '../services/moveTeaching.js';
import { BUILDINGS, EXITS, RAIL, YARD, SPOTS } from '../maps/b09a/lumina_layout.js';
import { blockedText } from '../maps/b09a/links.js';

export const LUMINA_TEXT = Object.freeze({
  city: 'CIUDAD LÚMINA\nLa ciudad de las Eras',
  museum: 'MUSEO DE LAS ERAS\nAbierto todos los días. La sala «Antea, la ciudad de antes», cerrada temporalmente.',
  museumAfter: 'MUSEO DE LAS ERAS\nNueva sala: «Antea, la ciudad de antes». Sala de las Crónicas.',
  hotel: 'HOTEL MIRADOR\nVistas al borde de la Sima desde todas las habitaciones.',
  station: 'ESTACIÓN CENTRAL DE LÚMINA\nTren regional.',
  park: 'PARQUE DE LAS ERAS\nNo pisar la hierba alta: hay Pokémon salvajes.',
  daycare: 'GUARDERÍA POKÉMON DE LÚMINA',
  junk: 'LOS TRASTOS DE LÚMINA\nCompra y venta de cosas raras.',
  bakery: 'PASTELERÍA EL HORNO DE LAS ERAS',
  gallery: 'GALERÍA DE ARTE\nCerrada por montaje.',
  closed: 'Está cerrado.',
});

// ------------------------------------------------------------ estación y vía
function railwayEvents() {
  return [...railEvents('via_lumina', RAIL.y, RAIL.x0, RAIL.x1), railStop('topera', RAIL.stop.x, RAIL.stop.y)];
}

// ------------------------------------------------------------ vecinos
function neighborEvents() {
  return [
    npc('vecina_estacion', 55, 30, SPRITE.neighbor, 'Vecina', (s) => (s.flag(F.p4)
      ? ['¡Vuelve el tren de Estrato! Mi hermano trabaja en la mina y ya no tiene que dar la vuelta por la costa.']
      : ['El tren lleva meses sin venir. Dicen que se ha hundido media Ciudad Estrato.']), { dir: 4 }),
    npc('turista_plaza', 29, 33, 'anil:Fotografo', 'Turista', (s) => (s.flag(F.gala)
      ? ['Estuve en la gala del Hotel Mirador. El mecenas habló muy bien. Aunque no recuerdo qué dijo exactamente.']
      : ['¿Has visto el museo? Dicen que esta noche hay una gala en el Hotel Mirador.']), { dir: 2, move: { wander: 2 } }),
    npc('anciano_plaza', 41, 33, SPRITE.elder, 'Anciano', (s) => (s.flag(F.t06Done)
      ? ['Han reabierto la sala de Antea. Llevaba veinte años esperando para ver esa losa, y ahora resulta que ya no está. ¡Pero la sala es preciosa!']
      : ['La sala de Antea lleva cerrada desde que se agrietaba la vitrina cada noche. La curadora dice que no es por el frío, pero yo sé lo que me digo.']), { dir: 4 }),
    npc('nina_parque', 21, 46, SPRITE.girl, 'Niña', ['En el parque salen Ralts. Mi hermano dice que de noche salen otros que se comen los sueños. ¡Mentira!'], { dir: 2, move: { wander: 2 } }),
    npc('vecino_paseo', 22, 11, SPRITE.neighborM, 'Vecino', (s) => (s.flag(F.gala)
      ? ['Los del Consorcio Meridiano y los de la Fundación Meridiano… ¿Serán los mismos? Tanto «Meridiano» me marea.']
      : ['El Hotel Mirador está de gala. Hay coches de gente importante por todo el paseo.']), { dir: 2 }),
    npc('botones_puerta', 44, 10, SPRITE.bellboy, SPEAKER.bellboy, (s) => (s.flag(F.gala)
      ? [`${byGender(s, 'Bienvenido', 'Bienvenida')} al Hotel Mirador. Las mejores vistas de la Sima, y camas para descansar cuando haga falta.`]
      : ['La gala está a punto de empezar.']), { dir: 2, when: when({ all: [F.galaInvite] }) }),
    npc('estudiante_almacenes', 60, 50, SPRITE.child, 'Chico', ['En la primera planta de los Grandes Almacenes venden piedras evolutivas. ¡Y un cordón rarísimo para las evoluciones por intercambio!'], { dir: 8 }),
    npc('pescadora_estanque', 24, 44, 'anil:pescadoraow', 'Pescadora', ['En el estanque del parque no pica nada. Pero es tan bonito que da igual.'], { dir: 8 }),
    npc('guarda_mirador', 35, 6, 'anil:asistente', 'Vigilante', ['El camino del Mirador Sur está cerrado. El borde de la Sima se desprende a trozos.'], { dir: 2, move: 'still' }),
    npc('noche_museo', 30, 29, SPRITE.neighbor, 'Paseante', ['De noche, la fachada del museo parece que respira. Será la luz de las farolas.'], {
      dir: 8, when: (s) => Boolean(s) && isNight(s) && s.flag(F.gala) && !s.flag(F.t06Done),
    }),
  ];
}

// ------------------------------------------------------------ patio de la guardería
function yardEvents() {
  const inYard = (x, y) => x > YARD.x && x < YARD.x + YARD.w - 1 && y >= YARD.y && y < YARD.y + YARD.h - 1;
  const mons = [['MARILL', 60, 4], ['PICHU', 64, 5], ['HAPPINY', 67, 6], ['WOOLOO', 62, 7]];
  return mons.map(([sp, x, y]) => ({
    id: `patio_${sp.toLowerCase()}`, x, y, name: sp, sprite: `follower:${sp}:0:0`, dir: 2, move: { wander: 2 }, stepAnime: true, trigger: 'action',
    restrictTo: inYard, script: async (ctx) => { ctx.cry?.(sp); await ctx.say('Juega tranquilo en el patio de la guardería.'); },
  }));
}

// ------------------------------------------------------------ parque, tutor y objetos
function parkEvents() {
  return [
    { id: 'estudiante_ana', type: 'trainer', trainer: 'b09a_lum_estudiante_ana', name: 'Estudiante Ana', sprite: 'anil:estudiante',
      x: 9, y: 49, dir: 8, sight: 3, intro: '¡Estoy estudiando los Pokémon del parque! Ayúdame con la parte práctica.',
      after: 'Los Mime Jr. del parque imitan a los visitantes. A mí me imitan tomando apuntes.' },
    { id: 'dama_carmen', type: 'trainer', trainer: 'b09a_lum_dama_carmen', name: 'Dama Carmen', sprite: 'anil:dama',
      x: 26, y: 50, dir: 4, sight: 3, intro: 'Un paseo por el parque no está completo sin un combate elegante.',
      after: 'Mi Kirlia baila cuando el viento mueve la hierba alta. Algún día evolucionará.' },
    moveTutorEvent({
      id: 'tutor_parque', x: SPOTS.tutor.x, y: SPOTS.tutor.y, dir: SPOTS.tutor.dir, sprite: 'anil:veterano',
      moves: ['ZENHEADBUTT', 'DRAININGKISS', 'SIGNALBEAM', 'SNORE'], cost: { money: 1500 }, speaker: 'Tutor del parque',
      greeting: 'Las Eras pasan, pero lo aprendido se queda. ¿Quieres que enseñe algo a tus Pokémon?',
    }),
    { id: 'galladita', type: 'item', x: 16, y: 40, item: 'GALLADITE', hidden: true },
    { id: 'objeto_parque_1', type: 'item', x: 29, y: 56, item: 'REVIVE' },
    { id: 'objeto_parque_2', type: 'item', x: 3, y: 56, item: 'HEARTSCALE', hidden: true },
    { id: 'objeto_ciudad_1', type: 'item', x: 69, y: 55, item: 'SUPERREPEL' },
  ];
}

// ------------------------------------------------------------ carteles, puertas cerradas y bordes
function signEvents() {
  const doorOf = (k) => BUILDINGS[k].door;
  const closedDoors = ['bloque2', 'bloque3', 'rosa', 'granate'].map((k) => examine(`puerta_${k}`, doorOf(k).x, doorOf(k).y, LUMINA_TEXT.closed, { solid: true }));
  return [
    { id: 'cartel_ciudad', type: 'sign', x: SPOTS.entrySign.x, y: SPOTS.entrySign.y, text: LUMINA_TEXT.city },
    { id: 'cartel_museo', type: 'sign', x: 49, y: 29, script: async (ctx) => { await ctx.say(ctx.flag(F.t06Done) ? LUMINA_TEXT.museumAfter : LUMINA_TEXT.museum, { skin: 'signskin' }); } },
    { id: 'cartel_hotel', type: 'sign', x: 32, y: 8, text: LUMINA_TEXT.hotel },
    { id: 'cartel_estacion', type: 'sign', x: 57, y: 28, text: LUMINA_TEXT.station },
    { id: 'cartel_galeria', type: 'sign', x: 45, y: 45, text: LUMINA_TEXT.gallery },
    examine('puerta_galeria', 45, 44, LUMINA_TEXT.gallery, { solid: true }),
    ...closedDoors,
  ];
}

function borderEvents(open) {
  // Los lados del camino del Mirador Sur (x 32 y x 37) no dejan rodear la verja.
  const out = [];
  for (let y = 0; y <= 3; y++) for (const x of [EXITS.north.x0 - 1, EXITS.north.x1 + 1]) out.push({ id: `lado_mirador_${x}_${y}`, x, y, solid: true, noOver: true });
  if (!open.north) {
    const g = EXITS.north.gate;
    for (const x of [g.x + 1, g.x + 2]) out.push(examine(`verja_mirador_${x}`, x, g.y + 2, blockedText('ciudad_lumina', 'mirador_sur'), { solid: true }));
  }
  if (!open.west) {
    const cells = [];
    for (let y = EXITS.west.y0; y <= EXITS.west.y1; y++) cells.push([EXITS.west.x, y]);
    for (const [x, y] of cells) {
      out.push({ id: `borde_marisma_${y}`, x, y, trigger: 'touch', script: async (ctx) => {
        ctx.face('player', 'left');
        await ctx.say(blockedText('ciudad_lumina', 'ruta_8_marisma'));
        await ctx.move('player', ['right'], { through: false });
      } });
    }
  }
  return out;
}

export function luminaEvents(open = {}) {
  return [
    ...galaInvitationEvents(),
    ...gaelStepsEvents(),
    ...railwayEvents(),
    ...neighborEvents(),
    ...yardEvents(),
    ...parkEvents(),
    ...signEvents(),
    ...borderEvents(open),
    ...b09aCellEvents('ciudad_lumina'),
  ];
}
