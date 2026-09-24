// Escuela del Pico (CAMPANA §1.3; TABLILLAS T05): la Maestra Herminia (70) y sus pocos alumnos. Tras el P4, Herminia
// quiere recuperar el Torneo del Pulso para que los jóvenes no se vayan (content/events/b08_t05.js).
import { estratoInterior } from './interior_kit.js';
import { F, SPEAKER, SPRITE, examine } from '../../events/b08_common.js';
import { herminiaSchool } from '../../events/b08_t05.js';

export default estratoInterior({
  id: 'estrato_escuela',
  building: 'escuela',
  room: { x: 1, y: 1, w: 15, h: 12 },
  brush: 'habitacion_blanca',
  furnish(b) {
    b.stamp('pizarras', 6, 2);
    for (const [x, y] of [[3, 6], [7, 6], [11, 6], [3, 9], [11, 9]]) b.stamp('mesa_lab_verde', x, y);
    b.stamp('estanteria_lab', 1, 3);
    b.stamp('estanteria_lab', 14, 3);
    b.stamp('planta', 13, 11);
    b.stamp('reloj_pared', 12, 2);
  },
  events: [
    {
      id: 'herminia', x: 8, y: 4, name: SPEAKER.herminia, sprite: SPRITE.herminia, dir: 2, move: 'look',
      when: (s) => !s?.flag(F.tournamentOpen),
      script: herminiaSchool,
    },
    {
      id: 'alumna', x: 4, y: 8, name: SPEAKER.alumna, sprite: SPRITE.nina, dir: 8,
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'Mi padre dice que ya no nos vamos a Nexo. ¡Me quedo en la escuela!'
          : 'Mis padres dicen que a final de mes nos vamos a Nexo. Allí no hay minas, pero tampoco temblores.', { speaker: SPEAKER.alumna });
      },
    },
    {
      id: 'alumno', x: 12, y: 8, name: SPEAKER.nino, sprite: SPRITE.nino, dir: 8,
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.tournamentOpen)
          ? '¡Vuelve el Torneo del Pulso! Mi abuelo ganó tres veces. Yo pienso ganar cuatro.'
          : 'La maestra nos cuenta que antes había un torneo en la plaza. Pulsos de mineros y de Pokémon. Suena genial.', { speaker: SPEAKER.nino });
      },
    },
    examine('pizarra', 7, 3, 'En la pizarra: «Tema 4. Las capas de la tierra. Los estratos más pesados siempre quedan abajo».'),
    examine('pizarra_2', 8, 3, 'En la pizarra: «Tema 4. Las capas de la tierra. Los estratos más pesados siempre quedan abajo».'),
  ],
});
