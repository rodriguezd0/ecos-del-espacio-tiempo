// Al día siguiente de restaurar el Pilar de la Corriente (docs/CAMPANA.md B04): Leandro da las gracias al jugador
// «en la plaza, a lo grande» y Alerce, que ha viajado a Caudal para ver el río, entrega el inicial que nadie eligió
// (X13): «Lleva días mirando la puerta.». Escena parametrizable por posiciones para que Ciudad Caudal (B03) la
// incluya en su plaza con thanksEvents(CAUDAL_THANKS); mientras Caudal no esté registrado, la Ruta 3 la usa a las
// puertas de la ciudad (maps/b04/pending_links.js). Pone b04_gracias y b04_inicial.
import { F, SPEAKER, SPRITE, kid, unchosenStarter, GIFT_STARTER_LEVEL, follower } from './b04_common.js';

const L = { speaker: SPEAKER.leandro };
const A = { speaker: SPEAKER.alerce };
const NEXT_MORNING = 9 * 60;

/** Minutos hasta las 9:00 del día siguiente. */
export function minutesToNextMorning(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return 1440 - m + NEXT_MORNING;
}

export const THANKS_TEXT = Object.freeze({
  night: 'Esa noche, en Caudal, nadie tuvo que subir los muebles al piso de arriba.',
  morning: 'A la mañana siguiente…',
  speech: [
    '¡Vecinos de Caudal! ¡Un momento, que esto no lo digo dos veces!',
    'Ayer el Albo volvió a su cauce. Esta mañana no se ha salido, y anoche no se escondió.',
    'Y no ha sido gracias a mí. Llevo semanas girando llaves, y solo conseguía empeorarlo.',
  ],
  speechPlayer: (s) => `Ha sido gracias a ${s?.player?.gender === 'F' ? 'esta' : 'este'} ${kid(s)}. Bajó a la Escalera de Estanques y la hizo girar entera.`,
  crowd: ['¡Bravo!', '¡Viva el Albo!'],
  personal: [
    'Mi familia lleva trescientos años llevando este río a mano. Se nos olvidó escucharlo. No volverá a pasar.',
    'Gracias. De verdad. Si Caudal puede hacer algo por ti, pídemelo a mí.',
  ],
  alerce: [
    'He venido a ver el río con mis propios ojos.',
    '…Nunca lo había visto tan tranquilo.',
    'Traigo a alguien. Lleva días mirando la puerta.',
  ],
  alerceAfter: 'Cuídalo. Yo vuelvo al laboratorio. Id con cuidado.',
});

/**
 * Escena completa. spots = { player: {x,y,dir}, leandro: {x,y,dir}, alerce: { from: {x,y}, to: {x,y} }, crowd: [{x,y,dir,sprite}] }.
 * where = texto del lugar para el rótulo ('en la plaza' / 'a las puertas de Caudal').
 */
export async function thanksScene(ctx, spots) {
  if (ctx.flag(F.thanks)) return;
  await ctx.fade('out', 24);
  await ctx.say(THANKS_TEXT.night);
  ctx.state.advanceMinutes(minutesToNextMorning(ctx.state.data.clock.minutes));
  await ctx.say(THANKS_TEXT.morning);
  const p = ctx.player;
  p.moveTo(spots.player.x, spots.player.y);
  p.direction = spots.player.dir;
  // El seguidor, a un lado (delante del jugador se planta Alerce).
  for (const f of ctx.world.followers || []) f.moveTo?.(spots.player.x - 1, spots.player.y + 1);
  const leandro = ctx.world.spawnEvent({ id: 'leandro_gracias', x: spots.leandro.x, y: spots.leandro.y, sprite: SPRITE.leandro, dir: spots.leandro.dir, through: true });
  const crowd = (spots.crowd || []).map((c, i) => ctx.world.spawnEvent({ id: `vecino_gracias_${i}`, x: c.x, y: c.y, sprite: c.sprite, dir: c.dir, through: true }));
  // Vecinos del propio mapa que ya están en la plaza: se unen al corro mirando a Leandro.
  for (const id of spots.faceExisting || []) {
    const ev = ctx.world.events.find((e) => e.id === id);
    if (ev) ctx.face(ev, leandro);
  }
  ctx.requestRefresh();
  await ctx.fade('in', 24);
  for (const line of THANKS_TEXT.speech) await ctx.say(line, L);
  await ctx.say(THANKS_TEXT.speechPlayer(ctx.state), L);
  for (let i = 0; i < crowd.length; i++) {
    await ctx.emote(crowd[i], i % 2 ? '♪' : '!');
    if (i < THANKS_TEXT.crowd.length) await ctx.say(THANKS_TEXT.crowd[i], { speaker: 'Vecinos' });
  }
  ctx.face(leandro, p);
  for (const line of THANKS_TEXT.personal) await ctx.say(line, L);
  // Llega Alerce.
  const a = spots.alerce;
  const alerce = ctx.world.spawnEvent({ id: 'alerce_gracias', x: a.from.x, y: a.from.y, sprite: SPRITE.alerce, dir: 2, through: true });
  const route = [];
  for (let x = a.from.x; x < a.to.x; x++) route.push('right');
  for (let x = a.from.x; x > a.to.x; x--) route.push('left');
  for (let y = a.from.y; y < a.to.y; y++) route.push('down');
  for (let y = a.from.y; y > a.to.y; y--) route.push('up');
  await ctx.move(alerce, route, { through: true });
  ctx.face(alerce, p);
  ctx.face('player', alerce);
  for (const line of THANKS_TEXT.alerce) await ctx.say(line, A);
  await givenStarter(ctx);
  await ctx.say(THANKS_TEXT.alerceAfter, A);
  ctx.setFlag(F.thanks);
  await ctx.fade('out', 20);
  for (const ev of [leandro, alerce, ...crowd]) ctx.erase(ev);
  await ctx.fade('in', 20);
}

async function givenStarter(ctx) {
  if (ctx.flag(F.starterGift)) return;
  const species = unchosenStarter(ctx.state);
  await ctx.givePokemon({ species, level: GIFT_STARTER_LEVEL });
  ctx.setFlag(F.starterGift);
}

/**
 * Evento automático de la escena (auto al entrar en el mapa con el Pilar restaurado y sin haberla visto).
 * spots: ver thanksScene. id: identificador único en el mapa.
 */
export function thanksEvents(spots, { id = 'gracias_leandro', x = spots.player.x, y = spots.player.y, touch = null } = {}) {
  const when = (s) => Boolean(s?.flag(F.restored)) && !s.flag(F.thanks);
  const script = (ctx) => thanksScene(ctx, spots);
  // `touch` = casillas que disparan la escena al pisarlas (reserva de la Ruta 3); si no, automática al entrar.
  if (touch) return touch.map(([tx, ty]) => ({ id: `${id}_${tx}_${ty}`, x: tx, y: ty, when, trigger: 'touch', script }));
  return [{ id, x, y, through: true, pages: [{ when, trigger: 'auto', script }] }];
}

/**
 * Posiciones propuestas en la plaza de Ciudad Caudal (maps/b03/caudal_layout.js: tablón de la plaza en (29–30, 32),
 * Centro Pokémon en (20, 24)). B03 las incluye con `...thanksEvents(CAUDAL_THANKS)` en los eventos de Caudal.
 */
export const CAUDAL_THANKS = Object.freeze({
  player: { x: 31, y: 24, dir: 8 },
  leandro: { x: 31, y: 22, dir: 2 }, // sobre el rosetón de la plaza (caudal_layout.js SPOTS.roseton)
  // Llega desde el Centro Pokémon por la fila 26 y se planta delante del jugador (no en diagonal).
  alerce: { from: { x: 22, y: 26 }, to: { x: 31, y: 25 } },
  crowd: [
    { x: 29, y: 23, dir: 6, sprite: 'nina' }, { x: 33, y: 23, dir: 4, sprite: 'vecino' },
    { x: 28, y: 25, dir: 6, sprite: 'anciano' }, { x: 34, y: 25, dir: 4, sprite: 'nino' },
  ],
  faceExisting: ['vecina_plaza'], // vecina de B03 en (32, 24), junto al jugador
});

// ───────────────────────────── Gael en el barrio bajo ─────────────────────────────

/**
 * Mientras el Albo siga desbordado, Gael evacúa el barrio bajo de Caudal con sus Pokémon (CAMPANA B04 §3 y §6.2,
 * tono «Ayuda»). Posiciones libres de la calle del barrio (maps/b03/caudal_layout.js: casas en y 44–47, sacos en
 * y 49); B03 lo incluye en Caudal con `...evacuationEvents()`.
 */
export const CAUDAL_EVACUATION = Object.freeze({
  gael: { x: 37, y: 50, dir: 4 }, // junto al vecino del barrio (36, 50)
  helper: { x: 40, y: 49, dir: 6, species: 'RIOLU' }, // arrastra sacos hacia la puerta de la tercera casa
});

export const EVACUATION_TEXT = Object.freeze({
  before: [
    'Ahora no. El agua ha vuelto a entrar en dos casas.',
    'El Maestre dice que no necesita a nadie. Yo no voy a quedarme mirando.',
  ],
  after: [
    'Aquí hago falta yo. Lo de la Garganta es cosa tuya.',
    'No lo estropees.',
  ],
  helper: 'Riolu arrastra un saco terrero hasta una puerta. Ni te mira: está trabajando.',
});

export function evacuationEvents(spots = CAUDAL_EVACUATION) {
  const active = (s) => Boolean(s?.flag('b03_gael_b2')) && !s.flag(F.restored);
  const G = { speaker: SPEAKER.gael };
  const { gael, helper } = spots;
  return [
    {
      id: 'b04_gael_barrio', x: gael.x, y: gael.y,
      pages: [{
        when: active, sprite: SPRITE.gael, dir: gael.dir, trigger: 'action',
        script: async (ctx) => {
          for (const line of ctx.flag(F.clash) ? EVACUATION_TEXT.after : EVACUATION_TEXT.before) await ctx.say(line, G);
        },
      }],
    },
    {
      id: 'b04_gael_ayudante', x: helper.x, y: helper.y,
      pages: [{
        when: active, sprite: follower(helper.species), dir: helper.dir, stepAnime: true, trigger: 'action',
        script: async (ctx) => { ctx.cry(helper.species); await ctx.say(EVACUATION_TEXT.helper); },
      }],
    },
  ];
}
