// Santuario de los Glifos (B10; CAMPANA §1.3; X21: cumple la función de la antigua «Aldea Glífica»): sala octogonal con
// estelas de glifos de los Custodios. Amaro, el guardés, recibe una nota de nombres de Olvido y, tras el P5, entrega la
// Gardevoirita (POKEDEX_DISTRIBUCION §7.7). Con la Clave Glífica las estelas se leen enteras. Tileset 11 (InteriorTorre).
import { BUILDINGS, INTERIOR_ENTRIES } from './mnemos_layout.js';
import { SPEAKER, SPRITE } from '../../events/b10_common.js';
import { amaroTalk } from '../../events/b10_notes.js';
import { hasGlyphKey } from '../../story/verses.js';

const E = INTERIOR_ENTRIES.mnemos_santuario;
const OUT = BUILDINGS.santuario.door;

/** Estelas de glifos: traducción a medias con la Pokédex; entera con la Clave Glífica (textos DECIDIDO-DEV). */
const STELAE = Object.freeze([
  { x: 3, y: 5, partial: '«Aquí ··· los nombres para que no ···.»', full: '«Aquí escribimos los nombres para que no se pierdan.»' },
  { x: 9, y: 5, partial: '«El que ··· también es ··· de lo que guarda.»', full: '«El que recuerda también es parte de lo que guarda.»' },
]);

function steleEvent({ x, y, partial, full }, i) {
  return {
    id: `estela_${i}`, x, y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      await ctx.say('Una estela de piedra cubierta de glifos Unown.');
      if (hasGlyphKey(ctx.state)) await ctx.say(`Con la Clave Glífica la lees sin ayuda: ${full}`);
      else await ctx.say(`La Pokédex la traduce a trozos: ${partial}`);
    },
  };
}

export default {
  id: 'mnemos_santuario',
  name: 'Aldea Mnemos',
  tileset: 11,
  width: 13,
  height: 19,
  outdoor: false,
  bgm: 'PrismaVilla1',
  battleback: 'Templo',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('sala_octogonal', 0, 0);
    // Sin el emblema de Poké Ball de la sala (capa 1): en su lugar, cinco losas con glifos en el parqué.
    b.erase(1, 4, 8, 5, 5);
    for (const [x, y] of [[6, 10], [5, 9], [7, 9], [5, 11], [7, 11]]) b.stamp(x === 6 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
    for (const s of STELAE) b.stamp('pilar_placa_unown', s.x, s.y - 1);
  },

  warps: [{ x: E.x, y: E.y + 1, to: 'aldea_mnemos', tx: OUT.x, ty: OUT.y + 1, dir: 2 }],

  events: [
    { id: 'amaro', x: 6, y: 13, name: SPEAKER.amaro, sprite: SPRITE.amaro, dir: 2, move: 'look', script: amaroTalk },
    ...STELAE.map(steleEvent),
    { id: 'nicho_cofre', x: 6, y: 3, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say('Un nicho en la pared del fondo. Dentro, un cofre de madera lacada con un glifo tallado que la Pokédex traduce como «guardar».'); } },
  ],
};
