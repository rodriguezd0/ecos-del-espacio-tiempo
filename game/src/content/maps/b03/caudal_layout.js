// Ciudad Caudal (CAMPANA §1.3: 64×56, tileset 3 Exterior2 + agua): FUENTE ÚNICA de las coordenadas del mapa
// (puertas, puentes, esclusa, canales, salidas y puestos de los personajes). La usan la construcción
// (ciudad_caudal_build.js), la definición (ciudad_caudal.js), los eventos (content/events/b03_caudal*.js) y los
// interiores (sus salidas). Módulo puro.
//
// Hidrografía: el Río Albo entra por el oeste (y 10–13), pasa bajo el puente dorado de la entrada y por la
// Esclusa mayor, y gira al sur (x 49–52) hacia la Sima. El Canal de los Molinos (x 8–10) baja desde el paseo
// y se une al Canal del Mercado (y 40–42), que muere contra el río en su propia compuerta.

export const W = 64;
export const H = 56;

/** Entrada desde la Ruta 2 (norte): x 30–33 (= x 13–16 de la Ruta 2). */
export const NORTH_ENTRY = Object.freeze({ x0: 30, x1: 33, offset: 17 });
/** Salidas pendientes de otros bloques (maps/b03/pending_links.js). */
export const WEST_EXIT = Object.freeze({ y0: 3, y1: 5 }); // Ruta 3 (B04), sendero de la ribera río arriba
/** Paseo del Albo (orilla norte), del sendero de la ribera a la Esclusa mayor. */
export const PROMENADE = Object.freeze({ y0: 8, y1: 9, x1: 48 });
export const EAST_EXIT = Object.freeze({ y0: 29, y1: 30 }); // Ruta 4 (B05), la vega
export const SOUTH_EXIT = Object.freeze({ x0: 44, x1: 47, gate: { x: 44, y: 52 } }); // Senda del Mirador

/** Río Albo: tramo horizontal y codo hacia el sur. */
export const RIVER = Object.freeze({ h: { x0: 0, x1: 52, y0: 10, y1: 13 }, v: { x0: 49, x1: 52, y0: 10, y1: 55 } });
/** Canales (agua quieta, marco de tierra). */
export const CANALS = Object.freeze({
  mills: { x0: 8, x1: 10, y0: 17, y1: 42 }, // Canal de los Molinos
  market: { x0: 8, x1: 46, y0: 40, y1: 42 }, // Canal del Mercado
});

/** Puentes. golden = puente dorado N–S (entrada y tercer puente); plank = tablones E–O. */
export const BRIDGES = Object.freeze({
  entrance: { kind: 'golden', x: 28, y0: 9, y1: 14 }, // primer puente: Gael espera aquí (B2)
  mills: { kind: 'plank', y: 26, x0: 7, x1: 11 }, // segundo puente, Barrio de los Molinos
  market: { kind: 'golden', x: 26, y0: 39, y1: 43 }, // tercer puente (C068 debajo, en el canal)
  east: { kind: 'plank', y: 28, x0: 48, x1: 53 }, // cuarto puente: hacia la vega (Ruta 4)
});

/** Esclusa mayor: dos pasarelas de tablones sobre el río y sus compuertas aguas abajo. */
export const LOCK = Object.freeze({
  walks: [{ x: 37, y0: 9, y1: 14 }, { x: 43, y0: 9, y1: 14 }], // 3 de ancho (x..x+2)
  gates: [{ x: 40, y0: 10, y1: 13 }, { x: 46, y0: 10, y1: 13 }],
  sign: { x: 36, y: 8 },
  winch: { x: 40, y: 9 },
});

/** Edificios (esquina superior izquierda del stamp) y sus puertas. */
export const BUILDINGS = Object.freeze({
  centro: { stamp: 'centro_pokemon', x: 17, y: 16, door: { x: 20, y: 24 } },
  tienda: { stamp: 'tienda_torre', x: 38, y: 16, door: { x: 41, y: 29 } },
  esclusas: { stamp: 'casa_grande_pizarra', x: 40, y: 2, door: { x: 44, y: 7 } }, // Casa de las Esclusas (Leandro)
  casaNorte: { stamp: 'casa_pizarra', x: 10, y: 2, door: { x: 12, y: 7 } },
  molino: { stamp: 'granero_verde', x: 3, y: 18, door: { x: 5, y: 23 } }, // molino harinero (interior)
  molino2: { stamp: 'cabana_roja', x: 11, y: 17, door: { x: 14, y: 22 } }, // molino de la Aceña (cerrado)
  diezmo: { stamp: 'casa_turquesa_grande', x: 11, y: 30, door: { x: 14, y: 35 } }, // Molino del Diezmo (T02, B05)
  taberna: { stamp: 'restaurante', x: 2, y: 31, door: { x: 4, y: 37 } }, // Casa de comidas del canal
  // Estación (tren tras P4). La entrada del stamp está en su fila 10 (la 9 del catálogo no es transitable).
  estacion: { stamp: 'grandes_almacenes', x: 54, y: 33, door: { x: 57, y: 43 } },
  bajo1: { stamp: 'casa_granate', x: 28, y: 44, door: { x: 29, y: 47 } }, // Barrio bajo (interior)
  bajo2: { stamp: 'casa_granate', x: 34, y: 44, door: { x: 35, y: 47 } },
  bajo3: { stamp: 'casa_granate', x: 40, y: 44, door: { x: 41, y: 47 } },
  este: { stamp: 'bloque_verde_puerta', x: 55, y: 14, door: { x: 57, y: 19 } }, // vivienda al este del río
});

/** Ruedas de molino (evento noria.png) junto a los molinos. */
export const WHEELS = Object.freeze({
  molino: { x: 8, y: 22 },
  molino2: { x: 10, y: 19 },
  diezmo: { x: 10, y: 35 },
});

/**
 * Escena de Gael (B2): Gael en el puente dorado; franja que dispara la escena al pisar el puente. `entry` = boca de
 * la entrada norte (y 1, x 28–35), por la que pasa toda llegada desde la Ruta 2: Gael llama desde el puente y el
 * jugador baja hasta `meet` (así no se puede rodear la escena por el Paseo del Albo y las pasarelas de la esclusa).
 */
export const GAEL = Object.freeze({
  stand: { x: 31, y: 12, dir: 8 },
  trigger: { y: 9, x0: 29, x1: 33 },
  entry: { y: 1, x0: 28, x1: 35 },
  meet: { x: 31, y: 8 },
  exit: { x: 31, y: 14 },
});

/** Personajes y puntos de interés. */
export const SPOTS = Object.freeze({
  anselmo: { x: 16, y: 38, dir: 4 },
  pescador: { x: 37, y: 41, dir: 2 }, // punta del embarcadero del mercado (Caña Vieja)
  pier: { x: 36, y: 39, w: 3, h: 3 },
  tutor: { x: 27, y: 37, dir: 2 },
  mercader: { x: 24, y: 37, dir: 2 }, // mostrador del puesto rosa (miel y bayas; el tendero es del stamp)
  puestoPescado: { x: 20, y: 37 }, // mostrador del puesto azul
  puestoCanas: { x: 45, y: 37 }, // mostrador del puesto azul del este
  leandro: { x: 36, y: 9, dir: 2 }, // no se usa fuera (Leandro está en su casa antes de P2)
  roseton: { x: 29, y: 20 },
});

/** Llegada del tren (world/transport.js, TRAIN.caudal): delante de la estación. */
export const TRAIN_ARRIVAL = Object.freeze({ x: 57, y: 44, dir: 2 });
/** Jardín del Canal (suroeste), al que se llega por el tercer puente y el Barrio bajo. */
export const GARDEN = Object.freeze({ x: 2, y: 43, w: 20, h: 9 });
/** Punto de Vuelo (ui/logic/regionMapData.js#resolveFlyTarget): delante del Centro Pokémon. */
export const FLY_POINT = Object.freeze({ x: 20, y: 25, dir: 2 });
