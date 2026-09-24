// Oficinas del Consorcio Meridiano en Estrato (CAMPANA §1.3 «oficinas del Consorcio»; §5: fachada de Genesis). La
// representante que ofrece comprar la mina y un técnico con planos del Cerro; tras el P4, cajas: «Estrato ya no es
// prioritario». Genesis nunca es bufonesco: cortés y preciso.
import { estratoInterior } from './interior_kit.js';
import { F, SPEAKER, SPRITE, examine } from '../../events/b08_common.js';

export default estratoInterior({
  id: 'estrato_consorcio',
  building: 'consorcio',
  room: { x: 1, y: 1, w: 17, h: 12 },
  brush: 'habitacion_lab',
  furnish(b) {
    b.stamp('lab_ordenadores', 2, 3);
    b.stamp('pizarras', 9, 2);
    b.stamp('mesa_lab_verde', 9, 7);
    b.stamp('mesa_lab_verde', 13, 7);
    b.stamp('fotocopiadora', 15, 3);
    b.stamp('estanteria_lab', 13, 3);
    b.stamp('planta', 17, 11);
    b.stamp('planta', 1, 11);
  },
  events: [
    {
      id: 'rep_oficina', x: 10, y: 5, name: SPEAKER.rep, sprite: SPRITE.rep, dir: 2, move: 'look',
      when: (s) => !s?.flag(F.restored),
      script: async (ctx) => {
        await ctx.say('Consorcio Meridiano de Estudios Geofísicos. ¿En qué puedo ayudarle?', { speaker: SPEAKER.rep });
        await ctx.say('Nuestra oferta por la Mina Galena es la más generosa que Estrato va a recibir. Y la única.', { speaker: SPEAKER.rep });
        await ctx.say('Nosotros estabilizamos el suelo. Los mineros conservan su empleo. Todos ganan. Es la conclusión lógica.', { speaker: SPEAKER.rep });
      },
    },
    {
      id: 'tecnico_oficina', x: 4, y: 7, name: SPEAKER.tecnico, sprite: SPRITE.tecnico, dir: 8, move: 'look',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'Estamos recogiendo. La oficina cierra: Estrato ya no es prioritario.'
          : 'Las lecturas del Cerro Plomo son… fascinantes. La masa aumenta sin que cambie el volumen. Pero eso es confidencial.', { speaker: SPEAKER.tecnico });
      },
    },
    examine('pantallas_consorcio', 3, 5, (s) => (s.flag(F.restored)
      ? 'Las pantallas muestran una línea plana: «Estrato — actividad nula». Alguien ha escrito debajo: «Firma registrada».'
      : 'Gráficas con un pico enorme sobre el Cerro Plomo. Una etiqueta: «Masa anómala — seguimiento».'), { solid: true }),
    examine('pizarra_consorcio', 10, 3, 'Un plano de la Mina Galena con un pozo nuevo marcado en rojo: «Acceso lateral — estudio del terreno».'),
    examine('cajas_consorcio', 16, 5, (s) => (s.flag(F.restored) ? 'Cajas de mudanza precintadas con el emblema de los dos tubos cruzados.' : 'Archivadores con el emblema del Consorcio.'), { solid: true }),
  ],
});
