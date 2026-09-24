// Eventos de la Ruta 10 (docs/CAMPANA.md §1.4 y B11): paredes de raíces (Trepar: la principal y la de la repisa de
// C049), células C007 (orilla del Albo, etapa A) y C049, carteles, entrenadores del tramo bajo (niveles de la
// apertura) y del alto (40–42), objetos (Altarianita, POKEDEX_DISTRIBUCION §7.7), una excursionista que habla de
// la pared, la pista de Zygarde hacia casa (primer regreso, B11 paso 2) y todo el T10 del tramo alto
// (content/events/b11_t10.js: centinelas, cuadrilla, dormidero y deserción de Nilo).
import { F, OBJ, SPEAKER, when, zygardeSays } from './b11_common.js';
import { b11CellEvents } from './b11_cells.js';
import { t10Events } from './b11_t10.js';
import { RUTA10 } from '../maps/b11/layout.js';

const R = RUTA10;

export const RUTA10_TEXT = Object.freeze({
  sign: 'RUTA 10 · FALDAS DEL MONTE\n← Monte del Portal · → Ruta 1 y Villa Alba · ↓ Bosque Neblino',
  junction: '↓ Ruta 9 · Bosque Neblino\n→ Ruta 1 · Villa Alba',
  pinar: 'PINAR DEL DORMIDERO\nZona de nidos. No moleste a los Honchkrow.',
  hiker: [
    '¿Ves esa pared? Las raíces bajan desde la pradera de arriba como una cortina.',
    'Dicen que arriba empieza la subida al Monte del Portal. Yo nunca he sabido trepar por ahí.',
  ],
  homeHint: 'Por ahí se va a tu casa. Hace mucho que no vuelves.',
  bank: 'La orilla del Albo. El agua baja clara y fría desde el Monte.',
});

/** Paredes de raíces con vetas verdes (Trepar). La de la repisa lleva a C049. */
function climbEvents() {
  const out = [];
  const pair = (tag, from, to, h = 3) => {
    const [fx, fy] = from;
    const [tx, ty] = to;
    out.push({ id: `pared_${tag}_sube`, type: 'climbWall', x: fx, y: fy - 1, to: [tx, ty], h, sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true });
    out.push({ id: `pared_${tag}_baja`, type: 'climbWall', x: tx, y: ty + 1, to: [fx, fy], down: true, glow: false });
  };
  pair('raices', R.climb.from, R.climb.to);
  pair('repisa', R.ledge.from, R.ledge.to);
  return out;
}

function trainerEvents() {
  return [
    // Tramo bajo (etapa A)
    {
      id: 'joven_tomas', type: 'trainer', trainer: 'b11_joven_tomas', name: 'Joven Tomás', sprite: 'anil:joven',
      x: 35, y: 19, dir: 2, sight: 3,
      intro: '¡Eh! Por aquí no pasa casi nadie. ¡Un combate!',
      after: 'Más allá del bosque, al oeste, el Albo baja del Monte. De noche se oye la cascada.',
    },
    {
      id: 'chica_nuria', type: 'trainer', trainer: 'b11_chica_nuria', name: 'Chica Nuria', sprite: 'anil:chica',
      x: 46, y: 22, dir: 8, sight: 3,
      intro: '¿Vienes de la Ruta 1? ¡Pues demuéstrame lo que has aprendido!',
      after: 'Mi abuela dice que el bosque del sur tiene niebla desde hace semanas. Yo no me atrevo a entrar.',
    },
    // Tramo alto (etapa E)
    {
      id: 'montanero_elias', type: 'trainer', trainer: 'b11_montanero_elias', name: 'Montañero Elías', sprite: 'anil:montanero',
      x: 24, y: 11, dir: 2, sight: 3,
      intro: '¿Has subido por las raíces? ¡Así me gusta! A ver si tus Pokémon trepan igual de bien.',
      after: 'Desde el campamento del oeste no dejan subir al Monte. Dicen que perforan algo arriba.',
    },
    {
      id: 'ornitologa_marisa', type: 'trainer', trainer: 'b11_ornitologa_marisa', name: 'Ornitóloga Marisa', sprite: 'anil:ornitologo',
      x: 9, y: 9, dir: 8, sight: 3,
      intro: 'Chis… Las Altaria anidan en esta pradera. Combatamos en voz baja.',
      after: 'Las Altaria cantan al amanecer. Los Honchkrow del pinar, al anochecer. Nunca a la vez.',
    },
    {
      id: 'veterana_amparo', type: 'trainer', trainer: 'b11_veterana_amparo', name: 'Veterana Amparo', sprite: 'anil:veterana',
      x: 22, y: 8, dir: 4, sight: 3,
      intro: 'Llevo cuarenta años subiendo al Monte. Y nunca lo había visto con gente de bata.',
      after: 'Esos del Consorcio miden hasta el aire que respiras. Me dan mala espina.',
    },
  ];
}

function itemEvents() {
  return [
    { id: 'objeto_ruta10_altarianita', type: 'item', x: 3, y: 13, item: 'ALTARIANITE' },
    { id: 'objeto_ruta10_1', type: 'item', x: 29, y: 4, item: 'HYPERPOTION' },
    { id: 'objeto_ruta10_2', type: 'item', x: 50, y: 10, item: 'ULTRABALL', count: 2 },
    { id: 'objeto_ruta10_3', type: 'item', x: 13, y: 12, item: 'REVIVE', hidden: true },
    { id: 'objeto_ruta10_4', type: 'item', x: 18, y: 23, item: 'POKEBALL' },
    { id: 'objeto_ruta10_5', type: 'item', x: 26, y: 31, item: 'POTION' },
    { id: 'objeto_ruta10_6', type: 'item', x: 19, y: 35, item: 'ORANBERRY', hidden: true },
  ];
}

function signEvents() {
  const examine = (id, x, y, text) => ({ id, x, y, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(text); } });
  return [
    { id: 'cartel_ruta10', type: 'sign', x: 56, y: 19, text: RUTA10_TEXT.sign, skin: 'sign hgss dir' },
    { id: 'cartel_cruce', type: 'sign', x: 24, y: 19, text: RUTA10_TEXT.junction, skin: 'sign hgss dir' },
    { id: 'cartel_pinar', type: 'sign', x: 31, y: 11, text: RUTA10_TEXT.pinar },
    examine('orilla_albo', 11, 25, RUTA10_TEXT.bank),
    {
      id: 'excursionista_pared', x: 27, y: 18, name: 'Excursionista', sprite: 'anil:excursionista_f', dir: 6, move: 'look',
      trigger: 'action', script: async (ctx) => { for (const t of RUTA10_TEXT.hiker) await ctx.say(t, { speaker: 'Excursionista' }); },
    },
  ];
}

/** Tras el P5, al subir del Neblino, Zygarde recuerda que Villa Alba está al este (primer regreso a casa). */
function homeHintEvents() {
  const script = async (ctx) => {
    ctx.setFlag('b11_pista_casa');
    await zygardeSays(ctx, RUTA10_TEXT.homeHint);
  };
  const out = [];
  for (let x = R.south.x0; x <= R.south.x1; x++) {
    out.push({
      id: `pista_casa_${x}`, x, y: 30, trigger: 'touch', script,
      when: when({ all: ['p5_restored'], none: [F.homeReturn, 'b11_pista_casa'] }),
    });
  }
  return out;
}

export function ruta10Events() {
  return [
    ...climbEvents(),
    ...b11CellEvents('ruta_10'),
    ...trainerEvents(),
    ...itemEvents(),
    ...signEvents(),
    ...homeHintEvents(),
    ...t10Events(),
  ];
}

export { SPEAKER };
