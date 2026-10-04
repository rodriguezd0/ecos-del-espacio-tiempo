import { F, OBJ, SPRITE, postgame, eventById } from './b22e_common.js';
import { PARADOXES, paradoxPresent, ringRoute, WAITS, minutesUntil } from './b22e_grieta_logic.js';
import { paradoxBattle } from './b22e_grieta_battle.js';
import { grietaMonitor } from './b22e_grieta_watch.js';
import { tallerEvents, syncBlocks } from './b22e_grieta_taller.js';
import { stormActive } from '../../world/rest.js';
import { ARRIVAL, CAUCE, ESCARCHA, HONDONADA, CUENCA, TORMENTA, ESPOLON, TALLER, EXPLANADA, ITEMS } from '../maps/b22e/grieta_layout.js';

const spots = { ferrodada: CAUCE.stop, ferrosaco: ESCARCHA.from, ferropalmas: { x: TALLER.palmas.x, y: TALLER.palmas.y + 2 },
  ferrocuello: CUENCA.start, ferropolilla: HONDONADA.moth, ferropuas: TORMENTA.spot, ferropaladin: ESPOLON.spot };
const NOTES = [
  'Ferrodada: recorrer el cauce entero a pie, sin montura.',
  'Ferrosaco: quedarse quieto cinco segundos junto a la escarcha, de noche.',
  'Ferropalmas: encajar los tres bloques con Embestida; la palanca conserva los que ya encajaron.',
  'Ferrocuello: buscar su vuelo en la cuenca al amanecer, entre las cinco y las ocho.',
  'Ferropolilla: acercar la luz de Zygarde de noche; Destello amplía su alcance.',
  'Ferropúas: visitar el peñasco con tormenta. En el Hotel Mirador de Lúmina puedes descansar hasta que llegue.',
  'Ferropaladín: llegar al espolón a mediodía, entre las doce y las dos, después de ver a los otros seis.',
];

async function waitAtCamp(ctx) {
  const labels = [...WAITS.map((w) => w.label), 'Descansar y curar', 'Salir'];
  const i = await ctx.choice(labels, { message: 'Rosalía mantiene encendido el campamento.', cancel: labels.length - 1 });
  if (i === WAITS.length) { await ctx.rest({ kind: 'camp' }); return; }
  const w = WAITS[i];
  if (!w) return;
  await ctx.fade?.('out', 12);
  ctx.state.advanceMinutes(minutesUntil(ctx.state.data.clock.minutes, w.minutes));
  ctx.requestRefresh?.(); await ctx.fade?.('in', 12);
  await ctx.say('El aire cambia sobre las repisas.');
}

function paradoxEvent(p) {
  const spot = spots[p.key];
  const moving = p.key === 'ferrocuello' ? { move: { route: ringRoute(CUENCA.ring), repeat: true }, speed: 3, freq: 5 }
    : p.key === 'ferrodada' ? { move: { route: ['up', 'up', 'down', 'down', 'down', 'down', 'up', 'up'], repeat: true }, speed: 3, freq: 4 }
      : { move: 'still' };
  return { id: `b22e_${p.key}`, x: spot.x, y: spot.y, name: p.name,
    pages: [{ when: (s) => paradoxPresent(s, p.key, { stormOn: stormActive(s) }),
      sprite: SPRITE.paradox(p.species), dir: spot.dir || 2, stepAnime: true, solid: true, ...moving,
      restrictTo: p.key === 'ferrosaco' ? (x, y) => x >= 38 && x <= 45 && y >= 21 && y <= 30 : null,
      script: async (ctx) => {
        if (p.key === 'ferrosaco' || p.key === 'ferropolilla') {
          await ctx.say(p.key === 'ferrosaco' ? NOTES[1] : NOTES[4]); return;
        }
        if (!(await ctx.confirm(`¿Acercarte a ${p.name}?`))) return;
        await paradoxBattle(ctx, p.key);
      } }] };
}

export function grietaEvents() {
  const prop = (id, at, sprite, dir = 2) => ({ id, x: at[0], y: at[1], sprite, dir, solid: true, directionFix: true, walkAnime: false });
  return [
    ...PARADOXES.map(paradoxEvent), ...tallerEvents(),
    { id: 'b22e_grieta_monitor', x: 0, y: 0, through: true, trigger: 'parallel', lock: false, script: grietaMonitor },
    { id: 'b22e_rosalia_campamento', ...EXPLANADA.rosalia, sprite: SPRITE.rosalia, solid: true,
      script: async (ctx) => {
        ctx.setFlag(F.rosaliaGrieta);
        await ctx.say('El Resonador abrió este pliegue cuando se sobrecargó. Son ecos de un futuro posible; Antea guarda el pasado.', { speaker: 'Rosalía' });
        const i = await ctx.choice(['Consultar las notas', 'Esperar', 'Salir'], { cancel: 2 });
        if (i === 0) for (const note of NOTES) await ctx.say(note, { speaker: 'Rosalía' });
        if (i === 1) await waitAtCamp(ctx);
      } },
    { id: 'b22e_hoguera', ...EXPLANADA.fire, sprite: OBJ.fire, stepAnime: true, solid: true, script: waitAtCamp },
    { id: 'b22e_notas', x: EXPLANADA.board.x, y: EXPLANADA.board.y + 1, script: async (ctx) => { for (const note of NOTES) await ctx.say(note); } },
    ...ESCARCHA.crystals.map((xy, i) => prop(`b22e_escarcha_${i}`, xy, OBJ.frost, [2, 4, 6, 8][i % 4])),
    ...TORMENTA.spikes.map((xy, i) => prop(`b22e_puas_${i}`, xy, OBJ.spikes, [2, 4, 6, 8][i % 4])),
    ...ESPOLON.crystals.map((xy, i) => prop(`b22e_cristal_${i}`, xy, OBJ.crystal, [2, 4, 6, 8][i % 4])),
    ...EXPLANADA.debris.map(([x, y, dir], i) => prop(`b22e_resonador_${i}`, [x, y], OBJ.debris, dir)),
    ...ITEMS.map((it) => ({ ...it, type: 'item' })),
  ];
}

export async function grietaOnEnter(ctx) {
  syncBlocks(ctx);
  const monitor = eventById(ctx, 'b22e_grieta_monitor');
  if (monitor) monitor.b22e = null;
  if (!ctx.flag(F.grietaLlegada)) {
    ctx.setFlag(F.grietaLlegada);
    await ctx.say('La bajada termina entre repisas. En las rocas hay huellas de ruedas y escarcha que no se derrite.');
    await ctx.say('Rosalía ha instalado un campamento junto a los restos del Resonador.');
  }
}

export function miradorGrietaEvents() {
  const base = { when: postgame, through: true, walkAnime: false, directionFix: true, shadow: false };
  return [
    ...[0, 1].flatMap((dy) => [0, 1, 2].map((dx) => ({ id: `b22e_boca_${dx}_${dy}`, x: 27 + dx, y: 17 + dy,
      pages: [{ ...base, sprite: OBJ.mouth, pattern: dx, dir: dy === 0 ? 6 : 8 }] }))),
    { id: 'b22e_bajada_porvenir', x: 28, y: 18, pages: [{ ...base, through: false, solid: true, trigger: 'action', script: async (ctx) => {
      await ctx.say('Una escalera de roca baja por la grieta.');
      if (!(await ctx.confirm('¿Bajar a la Grieta del Porvenir?'))) return;
      ctx.setFlag(F.grietaAbierta);
      await ctx.warp('grieta_porvenir', ARRIVAL.x, ARRIVAL.y, ARRIVAL.dir, { fade: true });
    } }] },
  ];
}
