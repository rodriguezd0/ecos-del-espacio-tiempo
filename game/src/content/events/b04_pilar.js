// Eventos del Pilar de la Corriente (CAMPANA B04): reto de Leandro en el rellano («para ver si sabe dónde pisa»),
// sus pistas, entrenadores de la Escalera (Pescador/Buceadora, nv 15–19), objetos, células C021–C023 en los fondos
// de E1, E4 y E6, el manantial del rellano y, de los módulos hermanos, el mecanismo (b04_pilar_puzzle.js) y el
// núcleo (b04_pilar_core.js).
import { readPuzzle, isFull, isOpen, CYCLE_FLAG } from './b04_hydraulics.js';
import { puzzleEvents, flowing } from './b04_pilar_puzzle.js';
import { coreEvents } from './b04_pilar_core.js';
import { SPOTS, CELL_SPOTS, TRAINER_SPOTS, ITEM_SPOTS } from '../maps/b04/pilar_corriente_layout.js';
import { F, SPEAKER, SPRITE } from './b04_common.js';

const L = { speaker: SPEAKER.leandro };
const GREEN = [185, 255, 102];

/** Reto de Leandro (CAMPANA B04 §4: «Leandro reta al jugador dentro del Pilar para ver si sabe dónde pisa»). */
export const DARE_LINES = Object.freeze([
  '¿Me has seguido hasta aquí abajo?',
  'Esto es la Escalera de Estanques. Seis estanques, cuatro compuertas y una noria que no gira desde que tengo memoria.',
  'Mi abuelo decía que cuando el agua da la vuelta entera, el Pilar respira. Yo llevo semanas girando llaves y solo he conseguido que el Albo se vuelva loco.',
]);
export const DARE_RULES = Object.freeze([
  'Un estanque lleno levanta sus losas; uno vacío te deja andar por el fondo.',
  'Las compuertas sueltan el agua cuesta abajo, de E1 a E6. La noria la sube de E6 a E1… si alguien engancha su engranaje. La palanca está en el fondo de E4.',
]);
export const DARE_END = Object.freeze([
  '¿Quieres ayudar? Pues demuéstralo. Ahí dentro el agua no perdona errores: ya veremos si sabes dónde pisas.',
  'Si te lías, tira de esa palanca: lo devuelve todo a como estaba. Mi familia la ha usado más de lo que admitiría.',
  'Y si consigues que llegue la corriente al núcleo… allí hablamos.',
]);

async function dareScene(ctx) {
  const leandro = ctx.world.events.find((e) => e.id === 'leandro_rellano');
  if (leandro) { ctx.face(leandro, ctx.player); await ctx.emote(leandro, '!'); }
  ctx.face('player', leandro || 'up');
  for (const line of DARE_LINES) await ctx.say(line, L);
  await ctx.say('…¿Y eso verde que brilla? Da igual. Escucha bien, que no lo voy a repetir.', L);
  for (const line of DARE_RULES) await ctx.say(line, L);
  for (const line of DARE_END) await ctx.say(line, L);
  ctx.setFlag(F.dare);
}

/** Pista de Leandro según la fase del puzle (las fases de la solución de referencia de CAMPANA). */
export function leandroHint(p) {
  if (isFull(p.water, 0)) return 'El mando de C3 está al otro lado de E1. Vacíalo: con C1 y C2 abiertas y C3 cerrada, el agua de E1 baja y se queda en E3.';
  if (isFull(p.water, 3)) return 'Para bajar al fondo de E4, cierra C2 y abre C3. Si C2 sigue abierta, E3 vuelve a llenarlo en cuanto se vacía.';
  if (!p.noria) return 'E4 está vacío. Baja y engancha la noria: su palanca está en el fondo.';
  if (!isOpen(p.gates, 3)) return 'Con la noria enganchada, abre C4. Su mando está al otro lado de E6, pasando por E5.';
  if (!isOpen(p.gates, 1)) return isFull(p.water, 1)
    ? 'Han subido las losas de E2. Por ellas se llega al mando de C2. Ábrela y que el agua dé la vuelta.'
    : 'Para que suban las losas de E2, la noria tiene que subir agua con C2 cerrada.';
  return 'Si no le ves salida, tira de la palanca y empieza de nuevo. No hay prisa: el agua espera.';
}

async function leandroTalk(ctx) {
  if (!ctx.flag(F.dare)) { await dareScene(ctx); return; }
  const pick = await ctx.choice(['¿Alguna pista?', 'Nada'], { message: '¿Qué quieres ahora?', cancel: 1 });
  if (pick !== 0) { await ctx.say('Pues al agua. Aquí se aprende mirando.', L); return; }
  await ctx.say(leandroHint(readPuzzle(ctx.state)), L);
}

function leandroEvents() {
  const here = (s) => !s.flag(CYCLE_FLAG) && !s.flag(F.restored);
  return [
    {
      id: 'leandro_rellano', x: SPOTS.leandro.x, y: SPOTS.leandro.y,
      pages: [{ when: here, sprite: SPRITE.leandro, dir: SPOTS.leandro.dir, trigger: 'action', script: leandroTalk }],
    },
    // Reto al entrar por primera vez (bloqueante al cumplirse).
    {
      id: 'reto_leandro', x: SPOTS.arrival.x, y: SPOTS.arrival.y - 1,
      pages: [{ when: (s) => here(s) && !s.flag(F.dare), trigger: 'auto', script: dareScene }],
    },
  ];
}

// ───────────────────────────── Entrenadores, objetos, células, manantial ─────────────────────────────

const TRAINERS = Object.freeze([
  {
    id: 'pescador_bruno', trainer: 'pc_pescador_bruno', name: 'Pescador Bruno', sprite: 'anil:pescador',
    intro: '¿Tú también vienes a ver la Escalera? Aquí dentro todavía se puede pescar algo… o a alguien.',
    after: 'Leandro no deja pescar en los estanques. Dice que se enturbia la corriente.',
  },
  {
    id: 'buceadora_marta', trainer: 'pc_buceadora_marta', name: 'Buceadora Marta', sprite: 'anil:buceadora',
    intro: '¡Alto! Buceo en estos estanques desde niña. ¡A ver cuánto aguantas!',
    after: 'Cuando un estanque se vacía, en el fondo aparecen cosas. Merece la pena mirar.',
  },
  {
    id: 'pescador_tomas', trainer: 'pc_pescador_tomas', name: 'Pescador Tomás', sprite: 'anil:pescador',
    intro: 'Llegar hasta aquí tiene mérito. Pasar de aquí, más.',
    after: 'La noria no gira desde hace años. Ni el maestre sabe por qué.',
  },
  {
    id: 'buceadora_ines', trainer: 'pc_buceadora_ines', name: 'Buceadora Inés', sprite: 'anil:buceadora',
    intro: 'El agua de aquí dentro tiene memoria. ¿Y tú?',
    after: 'Desde esta franja se ve el núcleo, al otro lado del foso. Nadie ha llegado a pisarlo.',
  },
]);

function trainerEvents() {
  return TRAINERS.map((t) => ({ ...t, ...TRAINER_SPOTS[t.id], type: 'trainer', sight: 4 }));
}

function itemEvents() {
  return Object.entries(ITEM_SPOTS).map(([id, it]) => ({ id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) }));
}

async function afterCell(ctx) {
  await ctx.flash(GREEN, 12, 90);
}

function cellEvents() {
  return Object.entries(CELL_SPOTS).map(([cell, { x, y }]) => ({ id: cell, type: 'zygardeCell', x, y, cell, onFound: afterCell }));
}

function springEvent() {
  const script = async (ctx) => {
    await ctx.say('Agua limpia y fría brota de la pila de piedra.');
    if (!(await ctx.confirm('¿Dejar que tu equipo beba?'))) return;
    ctx.me('heal');
    ctx.heal();
    await ctx.say('Tu equipo ha recuperado todas sus fuerzas.');
  };
  return { id: 'manantial', x: SPOTS.springEvent.x, y: SPOTS.springEvent.y, solid: true, trigger: 'action', script };
}

/** Todos los eventos del mapa pilar_corriente. */
export function pilarEvents() {
  return [
    ...puzzleEvents(),
    ...coreEvents(),
    ...leandroEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...cellEvents(),
    springEvent(),
  ];
}

/** Al entrar: la música cambia con la corriente en marcha (nada más; los eventos llevan el estado). */
export async function pilarOnEnter(ctx) {
  if (flowing(ctx.state) && ctx.flag(F.restored)) ctx.bgm('LeyendaPrisma');
}
