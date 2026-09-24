// Casa de la familia Galena (CAMPANA §1.3 «casa de Fermín»): Sol espera noticias de su padre mientras él está en el
// Cerro; tras el P4, Fermín en casa. El casco del abuelo cuelga junto a la puerta: la «carga familiar».
import { estratoInterior } from './interior_kit.js';
import { F, SPEAKER, SPRITE, examine } from '../../events/b08_common.js';

export default estratoInterior({
  id: 'estrato_casa_galena',
  building: 'galena',
  room: { x: 1, y: 1, w: 11, h: 9 },
  furnish(b) {
    b.stamp('mesa_comedor', 2, 6);
    b.stamp('estanteria_roja', 9, 3);
    b.stamp('comoda', 1, 3);
    b.stamp('fregadero', 5, 3);
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('cuadro', 8, 2);
    b.stamp('planta', 10, 8);
  },
  events: [
    {
      id: 'sol_casa', x: 8, y: 6, name: SPEAKER.sol, sprite: SPRITE.sol, dir: 4, move: 'look',
      when: (s) => Boolean(s) && s.flag(F.ferminCerro) && !s.flag(F.restored),
      script: async (ctx) => {
        await ctx.say('Mi padre se ha ido al Cerro. Dice que lo que hay que arreglar no está en la mina, sino debajo.', { speaker: SPEAKER.sol });
        await ctx.say('Yo solo quiero que alguien le quite ese peso de encima. Lleva cargándolo toda la vida.', { speaker: SPEAKER.sol });
      },
    },
    {
      id: 'fermin_casa', x: 8, y: 6, name: SPEAKER.fermin, sprite: SPRITE.fermin, dir: 4, move: 'look',
      when: (s) => Boolean(s?.flag(F.coop)),
      script: async (ctx) => {
        await ctx.say('Cooperativa. Llevo todo el día diciendo la palabra para acostumbrarme.', { speaker: SPEAKER.fermin });
        await ctx.say('Pesa menos de lo que pensaba. Repartido, casi nada pesa tanto.', { speaker: SPEAKER.fermin });
      },
    },
    examine('casco_abuelo', 2, 3, [
      'Un casco de minero muy viejo, con la lámpara rota, cuelga de un clavo.',
      'Grabado a punta de navaja: «La Galena no se vende».',
    ], { solid: true }),
    examine('foto_galena', 8, 3, 'Una foto antigua: tres generaciones de Galena delante de la boca de la mina. Todos con la misma cara de cansancio.'),
    examine('estanteria_galena', 9, 5, 'Planos de la mina, dibujados a mano. Las galerías más viejas llevan la nota «hacia el Cerro».', { solid: true }),
  ],
});
