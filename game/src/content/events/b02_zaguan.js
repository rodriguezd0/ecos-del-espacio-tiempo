// Eventos exteriores de Villa Zaguán (CAMPANA B02, paso 1; §3.1 fase 0: «puertas de Zaguán que se abren solas»):
// carteles, vecinos que duermen mal (y que vuelven a dormir tras el P1), C008 en la calle principal, puertas
// cerradas (escuela y granero), el campanario, la Arboleda de los Nombres y la salida sur cerrada hasta la Ruta 2.
// El arco T01 de la Arboleda (Mirta, el jardinero, el banco de piedra) es de B03: aquí solo el lugar.
import { F, SPRITE, say, examine } from './b02_common.js';
import { b02CellEvents } from './b02_cells.js';
import { PENDING_LINKS } from '../maps/b02/pending_links.js';
import { ARBOLEDA, CAMPANARIO, CLOSED_DOORS, TOWN_EXITS } from '../maps/b02/villa_zaguan_layout.js';

const restored = (s) => Boolean(s?.flag(F.restored));
const sign = (id, x, y, text, skin) => ({ id, type: 'sign', x, y, text, ...(skin ? { skin } : {}) });

// ─── Carteles ────────────────────────────────────────────────────────────────────────────────────

function signs() {
  const board = async (ctx) => {
    await ctx.say(restored(ctx.state)
      ? 'TABLÓN DEL CONCEJO\n«Las puertas vuelven a cerrar de noche. Gracias a quien corresponda.»'
      : 'TABLÓN DEL CONCEJO\n«Mientras sigan los temblores, cerrad las puertas con tranca. Y no os acerquéis a las ruinas.»', { skin: 'signskin' });
  };
  return [
    sign('cartel_norte', 17, 6, 'VILLA ZAGUÁN\nEl umbral del bosque.', 'sign hgss town'),
    sign('cartel_sur', 17, 30, 'RUTA 2 ↓\nHacia Ciudad Caudal.', 'sign hgss dir'),
    sign('cartel_oeste', 2, 15, 'RUINAS DEL DINTEL ←\nPilar del Umbral.', 'sign hgss dir'),
    { id: 'tablon_0', type: 'sign', x: 16, y: 21, script: board },
    { id: 'tablon_1', type: 'sign', x: 17, y: 21, script: board },
    sign('buzon_casilda', 9, 23, 'Casa del Dintel. Casilda Roquer.'),
  ];
}

// ─── Arboleda de los Nombres, escuela, granero y campanario ───────────────────────────────────────

const NAMES = ['Tomás', 'Aurora', 'Benigno', 'Luz'];
const FOUNDER = 'ÁRBOL DEL FUNDADOR\nEl primer nombre de Zaguán echó raíz aquí.';
const BENCH = 'Un banco de piedra, frío y cubierto de musgo. Desde aquí se ve toda la Arboleda.';

/** Banco de piedra de la Arboleda: gráfico de 3 casillas (evento central) y dos bloqueos a los lados. */
function benchEvents() {
  const b = ARBOLEDA.bench;
  return [
    { id: 'banco_piedra', x: b.x, y: b.y, sprite: SPRITE.bench, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(BENCH); } },
    examine('banco_piedra_o', b.x - 1, b.y, BENCH, { solid: true }),
    examine('banco_piedra_e', b.x + 1, b.y, BENCH, { solid: true }),
  ];
}

function places() {
  const out = ARBOLEDA.trees.map(([x, y], i) => sign(`placa_arbol_${i}`, x, y + 4, `Una placa de madera al pie del árbol: «${NAMES[i]}». En Zaguán, cada nombre tiene su árbol.`));
  const fp = ARBOLEDA.founderPlaque;
  out.push(sign('placa_fundador', fp.x, fp.y + 1, FOUNDER), sign('placa_fundador_2', fp.x + 1, fp.y + 1, FOUNDER));
  out.push(...benchEvents());
  for (const [i, p] of CLOSED_DOORS.escuela.entries()) out.push(examine(`puerta_escuela_${i}`, p.x, p.y, 'Escuela de Zaguán. La puerta está cerrada; dentro no hay nadie.', { solid: true }));
  for (const [i, p] of CLOSED_DOORS.granero.entries()) out.push(examine(`puerta_granero_${i}`, p.x, p.y, 'El granero de los huertos. La puerta está atrancada por dentro.', { solid: true }));
  const c = CAMPANARIO;
  out.push(examine('campana_0', c.bell.x, c.bell.y + 3, 'Una campana de bronce en su armazón. La cuerda está atada arriba, fuera del alcance.', { solid: true }));
  out.push(examine('campana_1', c.bell.x + 1, c.bell.y + 3, 'Una campana de bronce en su armazón. La cuerda está atada arriba, fuera del alcance.', { solid: true }));
  out.push(examine('capilla', c.chapel.x + 2, c.chapel.y + 4, 'Una capilla diminuta. Dentro huele a cera y a madera vieja.', { solid: true }));
  return out;
}

// ─── Vecinos (antes y después del P1) ────────────────────────────────────────────────────────────

function neighbors() {
  const talk = (speaker, before, after) => async (ctx) => {
    for (const line of restored(ctx.state) ? after : before) await say(ctx, speaker, line);
  };
  return [
    {
      id: 'vecina', x: 17, y: 24, sprite: 'vecina', dir: 4, move: 'look', trigger: 'action',
      script: talk('Vecina', ['Anoche se me abrió la puerta tres veces. Sin viento.', 'Y la tenía con tranca, ¿eh? Con tranca.'],
        ['La puerta ya no se abre sola. Esta noche le quito la tranca y duermo del tirón.']),
    },
    {
      id: 'anciano', x: 17, y: 8, sprite: 'anciano', dir: 4, move: 'look', trigger: 'action',
      script: talk('Anciano', ['Los temblores empezaron hace unas semanas. La gente teme que las ruinas se vengan abajo.', 'Casilda dice que no, que llevan ahí más que el pueblo. Casilda lo dice todo así, muy segura.'],
        ['La tierra está quieta, por fin. Casilda no quiere hablar del tema, pero sonríe más.']),
    },
    {
      id: 'hortelano', x: 33, y: 27, sprite: 'criador', dir: 4, move: { wander: 1 }, freq: 2, trigger: 'action',
      script: talk('Hortelano', ['Aquí no duerme nadie. Crujen las puertas, se asustan los Wooloo del prado…', '¡Y luego quieren que madrugue para regar!'],
        ['¡Los Wooloo del prado ya no se asustan! Así sí da gusto madrugar para regar.']),
    },
    {
      id: 'guia_ruinas', x: 7, y: 15, sprite: 'vecino', dir: 2, move: 'look', trigger: 'action',
      script: talk('Vecino', ['Las Ruinas del Dintel están al oeste, al final del camino.', 'Si vas, Casilda Roquer te parará en la entrada. No es mala gente: es que las cuida como si fueran suyas.'],
        ['¿Has estado en las ruinas con Casilda? Cuarenta años cuidándolas y dicen que por fin le han hecho caso.']),
    },
    {
      id: 'nina_estanque', x: 9, y: 28, sprite: 'nina', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => { await say(ctx, 'Niña', 'Mi padre dice que en el estanque hay Pokémon. Pero sin caña, ni los ves.'); },
    },
  ];
}

/** Por la noche, antes del P1, se oyen puertas que se abren solas (CAMPANA §3.1, fase 0). */
function nightDoors() {
  return [{
    id: 'puertas_de_noche', x: 0, y: 2, trigger: 'parallel', when: (s) => !restored(s),
    script: async (ctx) => {
      await ctx.wait(900 + Math.floor(Math.random() * 900));
      if (ctx.state.isDay() || ctx.flag(F.restored)) return;
      ctx.se('Door exit', { volume: 55 });
    },
  }];
}

/** Salida sur hacia la Ruta 2 (B03): cerrada con un aviso neutro hasta que el mapa exista. */
function southExit(ruta2Open) {
  if (ruta2Open) return [];
  const s = TOWN_EXITS.south;
  const out = [];
  for (let x = s.x0; x <= s.x1; x++) {
    out.push({
      id: `limite_sur_${x}`, x, y: s.y, trigger: 'touch',
      script: async (ctx) => {
        ctx.face('player', 'up');
        await ctx.say(PENDING_LINKS.ruta_2.blocked);
        await ctx.move('player', ['up'], { through: false });
      },
    });
  }
  return out;
}

/** Todos los eventos exteriores de Villa Zaguán. opts: { ruta2Open }. */
export function zaguanEvents({ ruta2Open = false } = {}) {
  return [
    ...signs(),
    ...places(),
    ...neighbors(),
    ...nightDoors(),
    ...b02CellEvents('villa_zaguan'),
    ...southExit(ruta2Open),
    { id: 'antidoto_huerto', type: 'item', x: 36, y: 26, item: 'ANTIDOTE' },
    { id: 'pokeball_arboleda', type: 'item', x: 16, y: 11, item: 'POKEBALL', hidden: true },
  ];
}
