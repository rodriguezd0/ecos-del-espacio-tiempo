// Pistas de los quince arcos de Tablillas T01–T15 para la Libreta (docs/TABLILLAS.md §4.2, §4.4, §4.5; X24).
// Módulo PURO de datos. Cada arco: pista inicial (steps[0]) y segunda pista (steps[1]); cuándo se abre
// (opens), desde cuándo es resoluble (available), capacidades mínimas de Zygarde (abilities) y cuándo se
// cierra (closes: al obtener su Tablilla). Las pistas son interpretables y sin coordenadas: la segunda
// añade un anillo de zona (zone = id de mapa) en el mapa regional, nunca una casilla.
// Estado y cola (máximo 3 activas): content/story/clueLogic.js. API para guiones: content/story/api.js.

export const MAX_ACTIVE_CLUES = 3;

/** Frases de Zygarde cuando falta una capacidad (anticipación sin bloqueo, TABLILLAS §4.2). */
export const ZYGARDE_LINES = Object.freeze({
  default: 'Allí no llego todavía.',
  swim: 'Necesito cruzar agua profunda.',
});

/** Nombres de las capacidades de campo (claves de state.zygarde.abilities). */
export const ABILITY_NAMES = Object.freeze({
  run: 'Correr', ram: 'Embestida', terrain: 'Terreno complicado', climb: 'Trepar', swim: 'Nadar',
  dive: 'Buceo', fly: 'Vuelo', rebuild: 'Reconstrucción',
});

const step = (label, text, by = label) => Object.freeze({ label, by, text });

// Todas las pistas se cierran al obtener la Tablilla de su arco (giveTablet → closeClue); ningún arco
// tiene estado de fallo permanente (TABLILLAS §4.8).
const arc = (d) => Object.freeze({
  abilities: [], queueUntil: null, after: null, night: false, ...d,
  closes: Object.freeze({ tablet: d.tablet, when: 'Al obtener la Tablilla del arco' }),
  steps: Object.freeze(d.steps),
});

export const CLUE_ARCS = Object.freeze([
  arc({
    id: 'T01', title: 'La Arboleda de los Nombres', tablet: 'MEADOWPLATE', place: 'Villa Zaguán', zone: 'villa_zaguan', block: 'B03',
    opens: { block: 'B02', by: 'Calco dentro de la Libreta (la madre de Casilda tradujo la inscripción del P1)', flag: 'b02_libreta' },
    available: { label: 'tras P1', flag: 'p1_restored' }, cellStage: 'A',
    steps: [
      step('Calco de la Libreta', '«Donde cada nombre echa raíz, la hierba guarda la primera tabla.»'),
      step('Villa Zaguán', 'El jardinero: el Árbol del Fundador se seca desde la raíz y la hierba muerta forma una espiral.', 'El jardinero'),
    ],
  }),
  arc({
    id: 'T02', title: 'El Molino del Diezmo', tablet: 'SPLASHPLATE', place: 'Ciudad Caudal', zone: 'ciudad_caudal', block: 'B05',
    opens: { block: 'B03', by: 'El molinero Anselmo, en Caudal', flag: null },
    available: { label: 'tras P2', flag: 'p2_restored' }, abilities: ['run'], cellStage: 'B/C',
    steps: [
      step('Anselmo, el molinero', 'Anselmo: «La muela del Diezmo pesa como un río.»'),
      step('Ciudad Caudal', 'Inscripción junto al verso II: «La segunda tabla gira donde el agua trabaja.»', 'Inscripción del verso II'),
    ],
  }),
  arc({
    id: 'T03', title: 'La campana que llama al rayo', tablet: 'ZAPPLATE', place: 'Villa Brontia', zone: 'villa_brontia', block: 'B05',
    opens: { block: 'B04', by: 'Inscripción del núcleo del P2 y el campanero Sixto', flag: 'p2_restored' },
    available: { label: 'tras P2', flag: 'p2_restored' }, abilities: ['ram'], cellStage: 'C', night: true,
    steps: [
      step('Inscripción del P2', 'Cada noche cae un rayo en el campanario, sin tormenta.', 'Inscripción del P2 y el campanero Sixto'),
      step('Villa Brontia', 'Abril: «Aquí ya ni se asustan. Cae siempre en la campana grande.»', 'Abril'),
    ],
  }),
  arc({
    id: 'T04', title: 'La cantera cerrada', tablet: 'STONEPLATE', place: 'Ruta 6, Cantería Solano', zone: 'ruta_6', block: 'B07',
    opens: { block: 'B06', by: 'Inscripción del núcleo del P3', flag: 'p3_restored' },
    available: { label: 'tras P3', flag: 'p3_restored' }, abilities: ['ram', 'run'], cellStage: 'C/D',
    steps: [
      step('Inscripción del P3', '«La cuarta tabla duerme entre capas de piedra.»'),
      step('Cantería Solano', 'Bea Solano: su hermano Quino y la cuadrilla de Timburr han quedado atrapados.', 'Bea Solano'),
    ],
  }),
  arc({
    id: 'T05', title: 'El Pulso de Estrato', tablet: 'FISTPLATE', place: 'Ciudad Estrato', zone: 'ciudad_estrato', block: 'B09',
    opens: { block: 'B08', by: 'Inscripción del núcleo del P4', flag: 'p4_restored' },
    available: { label: 'tras P4', flag: 'p4_restored' }, cellStage: 'D',
    steps: [
      step('Inscripción del P4', '«La quinta tabla se gana con las manos.»'),
      step('Ciudad Estrato', 'Fermín: la Losa del Pulso de la plaza, sobre la que se echan pulsos desde hace siglos.', 'Fermín'),
    ],
  }),
  arc({
    id: 'T06', title: 'El Museo de las Eras', tablet: 'IRONPLATE', place: 'Ciudad Lúmina', zone: 'ciudad_lumina', block: 'B09',
    opens: { block: 'B09', by: 'Rosalía Quintana, en la gala', flag: 'b09_gala' },
    available: { label: 'tras P4', flag: 'p4_restored' }, cellStage: 'D',
    steps: [
      step('Rosalía, en la gala', 'Rosalía, curadora del Museo de las Eras, pide que vuelva al museo de noche.', 'Rosalía Quintana'),
      step('Museo de las Eras', 'Los «restauradores» han hecho seis réplicas de la losa para una exposición itinerante y han cambiado las etiquetas.', 'Rosalía Quintana'),
    ],
  }),
  arc({
    id: 'T07', title: 'La colmena de la Reserva', tablet: 'INSECTPLATE', place: 'Reserva del Delta', zone: 'ruta_14_reserva', block: 'B09',
    opens: { block: 'B09', by: 'El guardabosques Iván, en el Centro de Lúmina', flag: null },
    available: { label: 'tras P4', flag: 'p4_restored' }, cellStage: 'D',
    steps: [
      step('Iván, el guardabosques', 'Iván: la Reserva del Delta está cerrada por un enjambre.'),
      step('Reserva del Delta', 'La colmena gigante se ha construido alrededor de «una losa que zumba».', 'Iván'),
    ],
  }),
  arc({
    id: 'T08', title: 'La laguna que fue clara', tablet: 'TOXICPLATE', place: 'Ruta 8, Marisma Turbia', zone: 'ruta_8_marisma', block: 'B09',
    opens: { block: 'B09', by: 'Rosalía, tras T06 (inventario de 1962)', flag: null },
    available: { label: 'tras P4', flag: 'p4_restored' }, abilities: ['terrain'], after: 'T06', cellStage: 'D',
    steps: [
      step('Inventario de 1962', 'Rosalía: «El inventario de 1962 cita una tabla amarga en la antigua Laguna Clara.»', 'Rosalía Quintana'),
      step('Marisma Turbia', 'Doña Remedios, curandera de los Palafitos: los Pokémon enferman cerca de las bombas del Consorcio.', 'Doña Remedios'),
    ],
  }),
  arc({
    id: 'T09', title: 'El niño que recuerda', tablet: 'MINDPLATE', place: 'Aldea Mnemos', zone: 'aldea_mnemos', block: 'B11',
    opens: { block: 'B10', by: 'Inscripción del núcleo del P5', flag: 'p5_restored' },
    available: { label: 'tras P5', flag: 'p5_restored' }, abilities: ['terrain'], cellStage: 'E',
    steps: [
      step('Inscripción del P5', '«La novena tabla sueña en voz ajena.»'),
      step('Aldea Mnemos', 'Íker, de ocho años, recuerda cosas que nunca vivió y dibuja mapas antiguos.', 'Aldea Mnemos'),
    ],
  }),
  arc({
    id: 'T10', title: 'La cuadrilla perdida', tablet: 'DREADPLATE', place: 'Bosque Neblino y Ruta 10', zone: 'ruta_10', block: 'B11',
    opens: { block: 'B11', by: 'Nilo, encuentro nocturno en el Neblino', flag: null },
    available: { label: 'tras P5', flag: 'p5_restored' }, abilities: ['climb'], cellStage: 'E', night: true,
    steps: [
      step('Nilo, en el Neblino', 'Nilo, técnico de Genesis, se esconde en el Bosque Neblino, aterrado.', 'Nilo'),
      step('Ruta 10', 'Su cuadrilla subió a la Ruta 10 y no ha vuelto.', 'Nilo'),
    ],
  }),
  arc({
    id: 'T11', title: 'La noche de los farolillos', tablet: 'PIXIEPLATE', place: 'Islote Lumbre', zone: 'islote_lumbre', block: 'B13',
    opens: { block: 'B09', by: 'El farero Ramón, en Caleta Sonda (en cola hasta tener Nadar)', flag: null },
    available: { label: 'tras P6', flag: 'p6_restored' }, abilities: ['swim'], queueUntil: { ability: 'swim' }, cellStage: 'F', night: true,
    steps: [
      step('Ramón, el farero', 'Ramón: «En el islote bailan luces desde que la luna está rara.»'),
      step('Islote Lumbre', 'Lucía, la nieta de Ramón, siguió a los Clefairy hasta el islote y no ha vuelto. «Bailan sin parar.»', 'Ramón'),
    ],
  }),
  arc({
    id: 'T12', title: 'La forja fría', tablet: 'FLAMEPLATE', place: 'Volcán Tizón', zone: 'volcan_tizon', block: 'B13',
    opens: { block: 'B09', by: 'El mercado de Nexo (en cola hasta tener Nadar)', flag: null },
    available: { label: 'tras P6', flag: 'p6_restored' }, abilities: ['swim'], queueUntil: { ability: 'swim' }, cellStage: 'F',
    steps: [
      step('Mercado de Nexo', 'En el mercado de Nexo dicen que los herreros de Tizón ya no mandan picos.'),
      step('Volcán Tizón', 'La Maestra Brasa: el fuego de la forja, que se alimenta del respiradero del volcán, se ha apagado.', 'La Maestra Brasa'),
    ],
  }),
  arc({
    id: 'T13', title: 'La torre de hielo', tablet: 'ICICLEPLATE', place: 'Villa Boreal', zone: 'villa_boreal', block: 'B15',
    opens: { block: 'B14', by: 'Inscripción del núcleo del P7', flag: 'p7_restored' },
    available: { label: 'tras P7', flag: 'p7_restored' }, abilities: ['ram'], cellStage: 'H',
    steps: [
      step('Inscripción del P7', '«La decimotercera tabla espera en el hielo más viejo.»'),
      step('Villa Boreal', 'El tallista Rosendo no reconoce el hielo del lago: tiene capas antiguas.', 'Rosendo'),
    ],
  }),
  arc({
    id: 'T14', title: 'La carta sin destino', tablet: 'SKYPLATE', place: 'Ciudad Nexo → Mesa de los Vientos', zone: 'mesa_vientos', block: 'B17',
    opens: { block: 'B16', by: 'Don Evaristo, en Correos de Nexo (tras P8)', flag: null },
    available: { label: 'tras P8', flag: 'p8_restored' }, abilities: ['fly'], cellStage: 'Completa',
    steps: [
      step('Don Evaristo, en Correos', 'Una carta de hace 60 años dirigida «a la Mesa de los Vientos», devuelta otra vez.', 'Don Evaristo'),
      step('El acertijo del sobre', '«Entre el rayo y la sal, donde el sol de las cinco no hace sombra.»'),
    ],
  }),
  arc({
    id: 'T15', title: 'La Calzada del Rey', tablet: 'DRACOPLATE', place: 'Calzada del Rey (Sima del Eje)', zone: 'calzada_rey', block: 'B19',
    opens: { block: 'B18', by: 'Inscripción del núcleo del P9', flag: 'p9_restored' },
    available: { label: 'tras P9', flag: 'p9_restored' }, abilities: ['rebuild'], cellStage: 'Completa',
    steps: [
      step('Inscripción del P9', '«La última tabla está donde el rey trabajó.»'),
      step('Calzada del Rey', 'Los Peregrinos del Rey, dirigidos por Casandra, levantan la Calzada con un trozo del Resonador.', 'Casandra'),
    ],
  }),
]);

const BY_ID = new Map(CLUE_ARCS.map((x) => [x.id, x]));

/** Arco de pista por id ('T01'…'T15') o null. */
export function clueArc(id) {
  return BY_ID.get(id) || null;
}

/** Arco al que pertenece una Tablilla (o null). */
export function clueArcForTablet(tabletId) {
  return CLUE_ARCS.find((x) => x.tablet === tabletId) || null;
}
