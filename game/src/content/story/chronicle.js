// La Crónica de Axis: los textos que los Custodios grabaron en las Tablillas (docs/TABLILLAS.md §4.3,
// X11). Módulo PURO de datos. Cada entrada se desbloquea al conseguir su Tablilla (state.tablets).
// Son hechos internos, pero como toda inscripción admiten interpretaciones (la IX es ambigua a propósito).

const c = (n, numeral, tablet, text, note = '') => Object.freeze({ n, numeral, tablet, text, note });

export const CHRONICLE = Object.freeze([
  c(1, 'I', 'MEADOWPLATE', 'Nadie recuerda quién alzó los diez Pilares. Cuando llegamos ya sostenían el cielo, y la hierba crecía a su alrededor como si los conociera.'),
  c(2, 'II', 'SPLASHPLATE', 'Una mujer tocaba una flauta azul. Cuando el mar se tragó los valles, tocó en lo alto; el que duerme abrió los ojos y el agua volvió a su sitio.', 'la Tañedora'),
  c(3, 'III', 'ZAPPLATE', 'Tras aquella noche aprendimos a escuchar: el rayo, el agua y la piedra respondían a los Pilares.'),
  c(4, 'IV', 'STONEPLATE', 'Levantamos casas junto a ellos y los llamamos por lo que hacían: Umbral, Corriente, Impulso, Masa, Memoria. Los otros cinco no se dejaron nombrar tan fácilmente.'),
  c(5, 'V', 'FISTPLATE', 'En Antea, la ciudad de antes, nació un rey fuerte y justo al principio, que quiso que el Eje le obedeciera como sus soldados.'),
  c(6, 'VI', 'IRONPLATE', 'El rey forjó una corona que imitaba el sonido de la flauta. Los Pilares no le respondieron. Entonces robó la flauta verdadera.'),
  c(7, 'VII', 'INSECTPLATE', 'Cuando el rey marchó hacia el centro, los enjambres huyeron al sur. Los pequeños saben antes que nadie cuándo va a cambiar la tierra.'),
  c(8, 'VIII', 'TOXICPLATE', 'El día en que tocó, el agua de los lagos se volvió amarga.'),
  c(9, 'IX', 'MINDPLATE', 'El que duerme despertó y lo miró, y no le dio nada. Esa misma noche la tierra se abrió bajo el Puente: Antea se hundió en el mar y el valle se volvió abismo. Unos dijeron que fue su mano; otros, que fue la corona al romperse. Lo escribimos para no olvidarlo.'),
  c(10, 'X', 'DREADPLATE', 'Después el Creador se desprendió de sus tablas, una por cada forma del mundo, y se durmió. Guardó tres: lo que sostiene, lo que acecha y lo que es.'),
  c(11, 'XI', 'PIXIEPLATE', 'Rompimos la flauta en diez y dimos una pieza a cada Pilar, porque cada Pilar sabe guardar lo suyo. Y pedimos a los tres de las nubes que se interpusieran si alguien volvía a llamar.'),
  c(12, 'XII', 'FLAMEPLATE', 'Las fraguas del rey se apagaron. Con su hierro hicimos cerrojos, no espadas.'),
  c(13, 'XIII', 'ICICLEPLATE', 'Vino un invierno largo. Los que se quedaron grabaron en estas tablas el camino al fondo del abismo, para que solo quien las reuniera todas pudiera bajar.'),
  c(14, 'XIV', 'SKYPLATE', 'Antes de cerrar los ojos, el que duerme nos mostró lo que vendría, y lo escribimos en los Pilares: cuando el que guarda el orden caiga en cien y cinco pedazos…'),
  c(15, 'XV', 'DRACOPLATE', 'El rey no murió en el abismo. Vivió muchos años sin corona, cuidando el puente que había roto. Sus últimas palabras fueron: el Eje no elige reyes; elige a quien camina.'),
]);

/** Las tres que conserva Arceus: sin numeral (se reciben tras Columna Lanza, B21). */
export const ARCEUS_CHRONICLE = Object.freeze([
  c(16, '—', 'EARTHPLATE', 'Lo que sostiene.'),
  c(17, '—', 'SPOOKYPLATE', 'Lo que acecha.'),
  c(18, '—', 'LEGENDPLATE', 'Lo que es.'),
]);

export const ALL_CHRONICLE = Object.freeze([...CHRONICLE, ...ARCEUS_CHRONICLE]);

/** Entrada de la Crónica asociada a una Tablilla (o null). */
export function chronicleFor(tabletId) {
  return ALL_CHRONICLE.find((e) => e.tablet === tabletId) || null;
}

/** ¿Está desbloqueada la entrada? (se tiene su Tablilla). */
export function isChronicleUnlocked(state, entry) {
  return (state.data.tablets || []).includes(entry.tablet);
}

/** Entradas desbloqueadas, en orden de la Crónica. */
export function unlockedChronicle(state) {
  return ALL_CHRONICLE.filter((e) => isChronicleUnlocked(state, e));
}
