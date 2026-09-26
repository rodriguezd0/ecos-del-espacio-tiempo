// Eventos del Paso del Norte (docs/CAMPANA.md B15: «la columna de luz de la Cumbre Azur atrae a curiosos»; §5.4
// Genesis mide lo que ve): llegada al collado, el mirador con la columna de luz y dos técnicos de Genesis que la
// registran (entrenadores), un curioso, el refugio (puerta), carteles y objetos. Coordenadas en
// content/maps/b15/layout_paso.js.
import { F, SPRITE, markNorthUnbound, when } from './b15_common.js';
import { PASO } from '../maps/b15/layout_paso.js';

const P = PASO;

export const PASO_TEXT = Object.freeze({
  arrival: 'Desde el collado se ve, al oeste, una columna de luz clavada sobre la Cumbre Azur. No parpadea.',
  signpost: 'PASO DEL NORTE\n↑ Ruta 13 · Villa Boreal   ← Ruta 12 · Senda del Lazo\n↓ Ruta 11 · Villa Brontia',
  mirador: 'MIRADOR DEL PASO\nAl oeste, la Cumbre Azur. La senda que sube es la del Lazo: quien la toma sin guía, vuelve a empezar.',
  bench: 'Un banco helado orientado hacia la columna de luz. Alguien ha dejado un termo vacío.',
  tripod: 'Un trípode con un aparato apuntado a la cumbre. En la pantalla, una línea que no baja nunca.',
  refugio: 'REFUGIO DEL PASO\nAbierto todo el año. Mantas, estufa y consejo.',
  column: 'La columna de luz se alza sobre la Cumbre Azur, recta como un hilo tensado.',
});

async function arrival(ctx) {
  ctx.setFlag(F.pasoIntro);
  markNorthUnbound(ctx);
  await ctx.say(PASO_TEXT.arrival); // Zygarde habla muy poco (autor, 25-09-2026).
}

function sceneEvents() {
  const A = P.arrival;
  const out = [];
  for (let x = A.x0; x <= A.x1; x++) out.push({ id: `llegada_paso_${x}`, x, y: A.y, trigger: 'touch', when: when({ none: [F.pasoIntro] }), script: arrival });
  // Quien llega en ferri a Villa Boreal baja al Paso por la Ruta 13: la misma llegada al entrar por el norte.
  for (let x = P.north.x0; x <= P.north.x1; x++) out.push({ id: `llegada_paso_norte_${x}`, x, y: 1, trigger: 'touch', when: when({ none: [F.pasoIntro] }), script: arrival });
  // Resplandor de la columna de luz sobre la esquina noroeste (hacia la Cumbre Azur).
  out.push({
    id: 'columna_luz_paso', x: P.columnLight.x, y: P.columnLight.y, through: true,
    glow: { name: 'softLight', radius: 150, color: [200, 220, 255], intensity: 0.55, pulse: 0.25 },
  });
  return out;
}

function trainerEvents() {
  const T = P.tecnicos;
  return [
    {
      id: 'tecnico_paso', type: 'trainer', trainer: 'b15_tecnico_paso', name: 'Técnico de Genesis Germán', sprite: SPRITE.tecnico,
      ...T.german, sight: 3,
      intro: 'Registro de luminosidad de la Cumbre Azur. Genesis le agradece que no se interponga. …¿Insiste? Bien.',
      after: 'La columna no es un fenómeno óptico. No cambia ni de noche ni con la ventisca.',
    },
    {
      id: 'tecnica_paso', type: 'trainer', trainer: 'b15_tecnica_paso', name: 'Técnica de Genesis Candela', sprite: SPRITE.tecnica,
      ...T.candela, sight: 3,
      intro: 'Este mirador es un punto de medida. Si quiere mirar, mire. Si quiere combatir, también sabemos medir eso.',
      after: 'Hemos subido la Senda cuatro veces con instrumental. Cuatro veces hemos vuelto al mismo sitio.',
    },
    {
      id: 'aspirante_valentin', type: 'trainer', trainer: 'b15_aspirante_valentin', name: 'Aspirante Valentín', sprite: 'anil:aspirante',
      ...P.valentin, sight: 3,
      intro: '¿También vienes por la luz? Todo el norte habla de ella. Antes, un combate.',
      after: 'En el refugio dicen que la Senda solo deja subir a quien sabe a quién seguir.',
    },
  ];
}

function objectEvents() {
  const M = P.mirador;
  const I = P.items;
  return [
    { id: 'poste_paso', type: 'sign', x: P.signpost.x, y: P.signpost.y, text: PASO_TEXT.signpost },
    { id: 'cartel_mirador', type: 'sign', x: M.x1, y: M.y1 + 1, text: PASO_TEXT.mirador },
    { id: 'cartel_refugio', type: 'sign', x: P.refugio.door.x + 2, y: P.refugio.door.y + 1, text: PASO_TEXT.refugio },
    { id: 'banco_mirador', x: M.bench.x + 1, y: M.bench.y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(PASO_TEXT.bench); } },
    {
      id: 'tripode_mirador', x: M.tripod.x, y: M.tripod.y, name: 'Trípode',
      pages: [{ sprite: 'asset:objects/tripode.png', dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(PASO_TEXT.tripod); } }],
    },
    { id: 'objeto_paso_curatotal', type: 'item', ...I.fullHeal, item: 'FULLHEAL' },
    { id: 'objeto_paso_ultraball', type: 'item', ...I.ultra, item: 'ULTRABALL', count: 2 },
    { id: 'objeto_paso_oculto', type: 'item', ...I.hidden, item: 'MAXPOTION', hidden: true },
  ];
}

export function pasoEvents() {
  return [...sceneEvents(), ...trainerEvents(), ...objectEvents()];
}
