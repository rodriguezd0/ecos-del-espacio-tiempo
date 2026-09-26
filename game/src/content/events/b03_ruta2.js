// Eventos de la Ruta 2 (docs/CAMPANA.md B03, §2.3; POKEDEX_DISTRIBUCION §7.3): entrenadores con visión,
// objetos, células (C013 bajo el puente, C015 en el alto de la rampa con Correr, C070 en el estanque con Nadar),
// la cuesta de grava, el árbol de miel, los Wooloo del cercado, carteles y el enlace norte con Villa Zaguán
// (B02; cerrado con un aviso neutro mientras el mapa no exista).
import { cellsOf, cellEvent, blockedLink, V, SPEAKER, say } from './b03_common.js';
import { PENDING_LINKS } from '../maps/b03/pending_links.js';
import { RUTA_2_HONEY } from '../encounters/b03.js';

/** Entrenadores (definiciones de combate en content/trainers/b03.js). */
export const RUTA2_TRAINERS = Object.freeze([
  {
    id: 'ornitologo_ciro', trainer: 'r2_ornitologo_ciro', name: 'Ornitólogo Ciro', sprite: 'anil:ornitologo', x: 17, y: 9, dir: 4,
    intro: '¡Silencio! Estaba contando Pidove… Bueno, ya los has espantado. ¡Combate!',
    after: 'Los Fletchling de esta pradera anidan en los postes del cercado. Míralos al amanecer.',
  },
  {
    id: 'aspirante_irene', trainer: 'r2_aspirante_irene', name: 'Aspirante Irene', sprite: 'anil:aspirante_f', x: 11, y: 29, dir: 6,
    intro: 'Voy camino de Caudal para entrenar junto al río. Tú primero.',
    after: 'Dicen que en Caudal el río crece de día y de noche se queda en nada. Qué cosas.',
  },
  {
    id: 'pescador_tomas', trainer: 'r2_pescador_tomas', name: 'Pescador Tomás', sprite: 'anil:pescador', x: 19, y: 27, dir: 4, sight: 3,
    intro: '¡Ha picado algo! Ah, no: eras tú. Ya que estás…',
    after: 'En Caudal hay un pescador que regala cañas a quien le escucha. Y habla mucho, te aviso.',
  },
  {
    id: 'excursionista_olga', trainer: 'r2_excursionista_olga', name: 'Excursionista Olga', sprite: 'anil:excursionista_f', x: 8, y: 44, dir: 6,
    intro: 'Desde el alto se ve Caudal entera. Antes, un combate para estirar las piernas.',
    after: 'La cuesta de grava resbala. A pie no hay manera; con algo que corra más, a lo mejor.',
  },
  {
    id: 'joven_adrian', trainer: 'r2_joven_adrian', name: 'Joven Adrián', sprite: 'anil:joven', x: 14, y: 59, dir: 8,
    intro: '¡Te he visto venir desde el puente! Nadie pasa sin combatir.',
    after: 'Caudal está ahí mismo. Cruza el puente dorado y ya estás dentro.',
  },
]);

const TEXT = Object.freeze({
  signNorth: 'RUTA 2\n↑ Villa Zaguán   ↓ Ciudad Caudal',
  signSouth: 'CIUDAD CAUDAL ↓\n«La ciudad de las esclusas.»',
  hill: 'ALTO DE LA PRADERA\nDesde aquí se ven los tejados de Caudal y el brillo del Albo.',
  board: 'TABLÓN DE LA RUTA 2\n«Se ruega no molestar a los Wooloo del cercado.»\n«Se vende miel de la pradera. Preguntad en Caudal.»',
  pond: 'ESTANQUE DE LA PRADERA\nPesca permitida. Prohibido bañarse sin Pokémon que sepan nadar.',
});

/** Pokémon al azar de una tabla [peso, especie, min, max] (Math.random: solo en el navegador). */
export function pickEncounter(table, rng = Math.random) {
  const total = table.reduce((a, r) => a + r[0], 0);
  let r = rng() * total;
  for (const [w, species, min, max] of table) {
    r -= w;
    if (r < 0) return { species, level: min + Math.floor(rng() * (max - min + 1)) };
  }
  const [, species, min] = table[table.length - 1];
  return { species, level: min };
}

/**
 * Árbol de miel (POKEDEX_DISTRIBUCION §7.2): se unta Miel (HONEY) y, después de descansar (var rest_count de
 * world/rest.js), aparece un Pokémon de la tabla. Sin pérdida: la Miel solo se gasta al untarla.
 */
export function honeyTreeEvent({ id, x, y, table = RUTA_2_HONEY, varKey = V.honey }) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      const readyAt = ctx.var(varKey, 0);
      const rests = ctx.var(V.restCount, 0);
      if (readyAt > 0 && rests >= readyAt) {
        ctx.setVar(varKey, 0);
        await ctx.say('¡Algo se mueve entre las ramas, atraído por la Miel!');
        const enc = pickEncounter(table);
        await ctx.wildBattle(enc);
        return;
      }
      if (readyAt > 0) {
        await ctx.say('La corteza sigue untada de Miel. Habrá que volver más tarde, después de descansar.');
        return;
      }
      await ctx.say('Un árbol de corteza dulzona. Huele un poco a miel.');
      if (!ctx.state.hasItem('HONEY')) return;
      if (!(await ctx.confirm('¿Quieres untar Miel en el árbol?'))) return;
      ctx.state.removeItem('HONEY', 1);
      ctx.setVar(varKey, rests + 1);
      await ctx.say('\\PN ha untado Miel en la corteza.\nSeguro que algún Pokémon acude cuando pase el tiempo.');
    },
  };
}

/** Dos Wooloo pastan en el cercado (no salen de él). */
function pastureEvents(p) {
  const inside = (x, y) => x > p.x && x < p.x + p.w - 1 && y > p.y && y < p.y + p.h - 1;
  const wooloo = (id, x, y) => ({
    id, x, y, sprite: 'follower:WOOLOO:0:0', dir: 2, move: { wander: 3 }, freq: 2, speed: 2, stepAnime: true,
    restrictTo: inside, trigger: 'action',
    script: async (ctx) => { ctx.cry('WOOLOO'); await ctx.say('¡Beee! El Wooloo se sacude la lana y sigue pastando.'); },
  });
  return [
    wooloo('wooloo_1', p.x + 2, p.y + 3),
    wooloo('wooloo_2', p.x + 5, p.y + 4),
    {
      id: 'pastora', x: p.x + p.w - 2, y: p.y + p.h, sprite: 'vecina', dir: 8, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Pastora', 'Mis Wooloo están nerviosos desde los temblores. Anoche se apretaron todos contra la valla, mirando al sur.');
        await say(ctx, 'Pastora', 'Hacia Caudal. Allí el río anda revuelto, dicen.');
      },
    },
  ];
}

function honeyNpc(tree) {
  return {
    id: 'apicultor', x: tree.event.x + 2, y: tree.event.y, sprite: 'anil:anciano1', dir: 4, move: 'still', trigger: 'action',
    script: async (ctx) => {
      await say(ctx, 'Apicultor', 'Ese árbol es especial: si le untas Miel, los Pokémon de la pradera acuden a lamerla.');
      await say(ctx, 'Apicultor', 'Pero no enseguida, ¿eh? Hay que dejar pasar el tiempo. Descansa en algún sitio y vuelve.');
      if (!ctx.flag('b03_apicultor_miel')) {
        ctx.setFlag('b03_apicultor_miel');
        await ctx.giveItem('HONEY', 1);
        await say(ctx, 'Apicultor', 'Toma, para empezar. En Caudal venden más, en el mercado del canal.');
      }
    },
  };
}

/**
 * Eventos de la Ruta 2. opts: { zaguanOpen, pathX: [x0, x1], pond, hill, pasture, honeyTree }.
 */
export function ruta2Events(opts) {
  const { zaguanOpen = false, pathX, hill, pasture, honeyTree } = opts;
  const out = [
    ...RUTA2_TRAINERS.map((t) => ({ ...t, type: 'trainer', sight: t.sight ?? 4 })),
    ...cellsOf('ruta_2').map((c) => cellEvent(c)),
    // Objetos
    { id: 'pokeball_1', type: 'item', x: 23, y: 11, item: 'POKEBALL' },
    { id: 'antidoto_1', type: 'item', x: 3, y: 30, item: 'ANTIDOTE' },
    { id: 'miel_1', type: 'item', x: 21, y: 46, item: 'HONEY' },
    { id: 'pocion_1', type: 'item', x: 25, y: 56, item: 'POTION' },
    { id: 'superpocion_alto', type: 'item', x: 7, y: 37, item: 'SUPERPOTION' },
    { id: 'repelente_oculto', type: 'item', x: 20, y: 20, item: 'REPEL', hidden: true },
    { id: 'miel_oculta', type: 'item', x: 12, y: 64, item: 'HONEY', hidden: true },
    { id: 'eter_oculto', type: 'item', x: 26, y: 34, item: 'ETHER', hidden: true },
    // Carteles
    { id: 'cartel_norte', type: 'sign', x: 18, y: 2, text: TEXT.signNorth },
    { id: 'cartel_sur', type: 'sign', x: 18, y: 66, text: TEXT.signSouth },
    { id: 'cartel_alto', type: 'sign', x: hill.x + 5, y: hill.y + 1, text: TEXT.hill },
    { id: 'tablon', type: 'sign', x: 10, y: 48, text: TEXT.board },
    { id: 'tablon_2', type: 'sign', x: 11, y: 48, text: TEXT.board },
    { id: 'cartel_estanque', type: 'sign', x: 16, y: 25, text: TEXT.pond },
    // Viajero en el banco antes de Caudal
    {
      id: 'viajero', x: 18, y: 59, sprite: 'anil:guiri', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Viajero', 'Vengo de Caudal. La ciudad está patas arriba: por la mañana el agua se sale de los canales y por la noche los deja secos.');
        await say(ctx, 'Viajero', 'El Maestre de Esclusas dice que lo tiene controlado. Nadie le cree, pero nadie se lo dice.');
      },
    },
    honeyTreeEvent({ id: 'arbol_miel', x: honeyTree.event.x, y: honeyTree.event.y }),
    honeyNpc(honeyTree),
    ...pastureEvents(pasture),
    // Cuesta de grava (CAMPANA §1.1, G1): a pie resbala; montado en el 10 % se sube.
    ...hill.ramp.map((x) => ({ id: `grava_${x}`, type: 'gravelSlope', x, y: hill.rampY[1] })),
  ];
  if (!zaguanOpen) {
    const cells = [];
    for (let x = pathX[0]; x <= pathX[1]; x++) cells.push([x, 0]);
    out.push(...blockedLink('limite_norte', cells, PENDING_LINKS.ruta_2.villa_zaguan.blocked, 'down', 'up'));
  }
  return out;
}
