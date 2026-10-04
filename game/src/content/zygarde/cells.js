// Registro de las 100 Células de Zygarde (docs/CAMPANA.md §2.3, D10 DECIDIDO-DEV).
// Cada célula: { id: 'C###', key: 'cell_<mapa>_<n>' (clave de evento persistente = lo que se guarda en
// state.data.zygarde.cells), map (id de mapa previsto), area (nombre legible), stage 'A'–'H', where,
// required (camino obligatorio o entregada por guion), scripted (la da un guion, sin evento en el mundo) }.
//
// `map` es el id PREVISTO del mapa donde irá el evento (§3 de CAMPANA). Si un bloque crea el mapa con otro id
// (p. ej. un mapa submarino propio), se actualiza aquí: tests/zygarde_content.test.mjs comprueba que las
// células colocadas en mapas registrados coinciden con este registro.
// Datos puros (sin DOM). Umbrales y núcleos en ./thresholds.js.
import { STAGE_KEYS, TOTAL_CELLS } from './thresholds.js';

const cells = [];
let next = 1;

/**
 * Añade `places.length` células consecutivas con clave `cell_<base>_<first+i>`.
 * places: [where | { where, required, map, area, scripted }]
 */
function add(base, first, map, area, stage, places, { required = false, scripted = false } = {}) {
  places.forEach((p, i) => {
    const spec = typeof p === 'string' ? { where: p } : p;
    cells.push(Object.freeze({
      id: `C${String(next).padStart(3, '0')}`,
      key: `cell_${base}_${first + i}`,
      map: spec.map ?? map,
      area: spec.area ?? area,
      stage,
      where: spec.where,
      required: spec.required ?? required,
      scripted: spec.scripted ?? scripted,
    }));
    next += 1;
  });
}

// ---- Etapa A: sin capacidad (14; obligatorias antes del núcleo del P1: C001–C005, C008–C012)
add('villa_alba', 1, 'villa_alba', 'Villa Alba', 'A', ['Parterre central (escena al salir del laboratorio con la Pokédex)'], { required: true });
add('ruta_1', 1, 'ruta_1', 'Ruta 1', 'A', [
  { where: 'Puente de troncos del primer arroyo', required: true },
  { where: 'Estrechamiento entre rocas junto a la hierba alta', required: true },
  { where: 'Junto al Bichero Luis', required: true },
  { where: 'Junto al cartel «Pilar del Umbral»', required: true },
  'Claro del este',
]);
add('ruta_10', 1, 'ruta_10', 'Ruta 10 (baja)', 'A', ['Orilla del Albo']);
add('zaguan', 1, 'villa_zaguan', 'Villa Zaguán', 'A', [
  { where: 'Calle principal, junto a la Arboleda', required: true },
  { where: 'Regalo de Casilda al aceptar acompañar («Esto brillaba en el patio»)', required: true, scripted: true, area: 'Villa Zaguán (Casilda)' },
]);
add('umbral', 1, 'ruinas_dintel', 'Pilar del Umbral', 'A', ['Antesala', 'Galería de los Dinteles', 'Cámara de Geodude'], { required: true });
add('ruta_2', 1, 'ruta_2', 'Ruta 2', 'A', ['Bajo el puente']);
add('caudal', 1, 'ciudad_caudal', 'Ciudad Caudal', 'A', ['Esclusa mayor']);

// ---- Etapa B: Correr (10)
add('ruta_2', 2, 'ruta_2', 'Ruta 2', 'B', ['Rampa de grava']);
add('ruta_3', 1, 'ruta_3', 'Ruta 3', 'B', [
  { where: 'Primera cuesta de grava', required: true }, 'Segunda cuesta de grava', 'Tercera cuesta de grava',
]);
add('garganta', 1, 'garganta_albo', 'Garganta del Albo', 'B', ['Repisa de la cascada pequeña', 'Molino abandonado']);
add('corriente', 1, 'pilar_corriente', 'Pilar de la Corriente', 'B', [
  'Fondo del estanque vaciado E1', 'Fondo del estanque vaciado E4', 'Fondo del estanque vaciado E6',
], { required: true });
add('ruta_1', 6, 'ruta_1', 'Ruta 1', 'B', ['Cuesta de grava al mirador']);

// ---- Etapa C: tras P2 / Embestida (10)
add('ruta_4', 1, 'ruta_4', 'Ruta 4', 'C', ['Vega', 'Tras una roca agrietada']);
add('brontia', 1, 'villa_brontia', 'Villa Brontia', 'C', ['Molino de la puerta atascada']);
add('ruta_5', 1, 'ruta_5', 'Ruta 5', 'C', ['Tras los troncos']);
add('colector', 1, 'parque_eolico', 'Parque Eólico (Colector)', 'C', [
  'Liberada al romper el Colector', 'Liberada al romper el Colector', 'Liberada al romper el Colector', 'Liberada al romper el Colector',
], { required: true, scripted: true });
add('impulso', 1, 'galerias_soplo', 'Pilar del Impulso', 'C', [
  'Galería de las Flechas', { where: 'Sala de las Campanas', map: 'anillo_vientos' },
], { required: true });

// ---- Etapa D: Terreno (tras P3/P4) (12)
add('ruta_6', 1, 'ruta_6', 'Ruta 6', 'D', ['Bancal de la Cantería']);
add('mina_galena', 1, 'mina_galena', 'Mina Galena', 'D', ['Veta de cristal']);
add('dunas', 1, 'dunas_ceniza', 'Dunas de Ceniza', 'D', ['Arena profunda', 'Arena profunda']);
add('masa', 1, 'camara_contrapesos', 'Pilar de la Masa', 'D', ['Galería inferior', 'Junto a la Gran Balanza'], { required: true });
add('ruta_7', 1, 'ruta_7', 'Ruta 7', 'D', ['Bajo el andén abandonado']);
add('lumina', 1, 'ciudad_lumina', 'Ciudad Lúmina', 'D', ['Parque de las Eras']);
add('reserva', 1, 'ruta_14_reserva', 'Reserva del Delta', 'D', ['Huerto']);
add('marisma', 1, 'ruta_8_marisma', 'Ruta 8 (Marisma)', 'D', ['Barro junto a una bomba del Consorcio']);
add('mnemos', 1, 'aldea_mnemos', 'Aldea Mnemos', 'D', ['Bambú tras la casa de té']);
add('memoria', 1, 'archivo_hondo', 'Pilar de la Memoria', 'D', ['Estancia de los Rollos'], { required: true });

// ---- Etapa E: Trepar (10)
add('neblino', 1, 'ruta_9_neblino', 'Ruta 9 y Neblino', 'E', ['Copa de un tronco hueco', 'Repisa de cristal']);
add('ruta_10', 2, 'ruta_10', 'Ruta 10 (alta)', 'E', ['Pared de raíces']);
add('monte', 1, 'montana_portal', 'Monte del Portal', 'E', ['Explanada quemada', { where: 'Mitad de la escalinata', required: true }]);
add('invertido', 1, 'pilar_invertido', 'Pilar Invertido', 'E', [
  { where: 'La Cara Vuelta', map: 'pilar_invertido_cara_2_giro' }, { where: 'El Sumidero', map: 'pilar_invertido_sumidero' },
], { required: true }); // B12: mapas propios del gemelo girado de la 2.ª sala y del Sumidero
add('cerro_alba', 1, 'cerro_alba', 'Cerro del Alba', 'E', ['Cornisa']);
add('garganta', 3, 'garganta_albo', 'Garganta del Albo', 'E', ['Pared']);
add('ruta_6', 2, 'ruta_6', 'Ruta 6', 'E', ['Pared del cañón']);

// ---- Etapa F: Nadar (20)
add('mar_sur', 1, 'mar_del_sur', 'Mar del Sur (centro)', 'F', ['Escollos camino de Talasa', 'Escollos camino de Talasa']);
add('talasa', 1, 'estacion_talasa', 'Estación Talasa', 'F', [
  { where: 'Cubiertas (siguen accesibles tras el asalto)', required: true }, 'Cubiertas (siguen accesibles tras el asalto)',
]);
add('mar_sur', 3, 'mar_del_sur', 'Mar del Sur (oeste)', 'F', ['Frente a Caleta Sonda', 'Frente a Caleta Sonda']);
add('lumbre', 1, 'lumbre_gruta', 'Islote Lumbre', 'F', ['Gruta de la luna']); // mapa propio de la gruta (B13)
add('caleta', 1, 'caleta_sonda', 'Caleta Sonda', 'F', ['Muelle de buzos']);
add('mar_sur', 5, 'mar_del_sur', 'Mar del Sur (este)', 'F', ['Islas de basalto', 'Islas de basalto']);
add('tizon', 1, 'volcan_tizon', 'Volcán Tizón', 'F', ['Forja fría']);
add('caudal', 2, 'ciudad_caudal', 'Ciudad Caudal', 'F', ['Bajo el tercer puente (canal)']);
add('garganta', 4, 'garganta_albo', 'Garganta del Albo', 'F', ['Poza grande']);
add('zaguan', 3, 'ruta_2', 'Ruta 2 / Zaguán', 'F', ['Estanque']);
add('reserva', 2, 'ruta_14_reserva', 'Reserva del Delta', 'F', ['Laguna']);
add('marisma', 2, 'ruta_8_marisma', 'Ruta 8 (Marisma)', 'F', ['Aguas hondas']);
add('ruta_4', 3, 'ruta_4', 'Ruta 4', 'F', ['Río']);
add('mnemos', 2, 'aldea_mnemos', 'Aldea Mnemos', 'F', ['Estanque de lotos']);
add('nexo', 1, 'ciudad_nexo', 'Ciudad Nexo', 'F', ['Desembocadura del Albo en el Delta']);
add('monte', 3, 'montana_portal', 'Monte del Portal', 'F', ['Poza al pie de la gran cascada']);

// ---- Etapa G: Buceo (12)
add('fondo_sur', 1, 'fondo_mar_sur', 'Fondo del Mar del Sur (centro)', 'G', ['Praderas de algas', 'Praderas de algas']);
add('fondo_sur', 3, 'fondo_mar_sur', 'Fondo del Mar del Sur (oeste)', 'G', ['Bajo el Islote Lumbre', 'Bajo el Islote Lumbre']);
add('fondo_sur', 5, 'fondo_mar_sur', 'Fosa Abisal (este)', 'G', ['Borde de la Fosa']);
add('ecos', 1, 'arrecife_eco', 'Pilar de los Ecos (capa presente)', 'G', [
  // B14: capa presente de las Ruinas de Antea (mapas antea_<sala>_presente); las caracolas siguen funcionando tras P7.
  { where: 'Sala 1, Plaza de la Caracola (capa presente)', map: 'antea_1_presente' },
  { where: 'Sala 3, terraza alta del Barrio Alto (capa presente)', map: 'antea_3_presente' },
  { where: 'Sala 4, ante la boca de la Fosa (capa presente)', map: 'antea_4_presente' },
], { required: true });
add('garganta', 5, 'pozo_albo', 'Pozo del Albo', 'G', ['Fondo del pozo']); // mapa submarino propio (B04)
add('caleta', 2, 'caleta_algas', 'Caleta Sonda', 'G', ['Bosque de algas']); // mapa submarino propio (B09b)
add('talasa', 3, 'talasa_pilotes', 'Estación Talasa', 'G', ['Pilotes']); // mapa submarino propio (B13)
add('reserva', 3, 'reserva_fondo', 'Reserva del Delta', 'G', ['Fondo de la laguna']); // mapa submarino propio (B09a)

// ---- Etapa H: tras P7 (12)
add('ruta_11', 1, 'ruta_11', 'Ruta 11', 'H', ['Nieve de la vertiente', 'Nieve de la vertiente']);
add('ruta_13', 1, 'ruta_13', 'Ruta 13', 'H', ['Nieve profunda', 'Nieve profunda']);
add('boreal', 1, 'villa_boreal', 'Villa Boreal', 'H', [{ where: 'Tejado del Observatorio', map: 'boreal_observatorio_terraza' }]); // B15: terraza propia
add('escarcha', 1, 'gruta_escarcha', 'Gruta Escarcha', 'H', ['Lago helado']);
add('lagos', 1, 'lagos_alma', 'Lagos del Alma', 'H', ['Islote del Lago del Sentir']);
add('mar_boreal', 1, 'mar_boreal', 'Mar Boreal', 'H', ['Témpano']);
add('alma', 1, 'santuario_alma', 'Pilar del Alma', 'H', [
  'Ala del Saber',
  { where: 'Ala del Sentir', map: 'santuario_alma_sentir' },
  { where: 'Ala del Querer', map: 'santuario_alma_querer' },
  { where: 'Telar del Alma', map: 'santuario_alma_querer' },
], { required: true });

if (cells.length !== TOTAL_CELLS) throw new Error(`Registro de células: se esperaban ${TOTAL_CELLS} y hay ${cells.length}`);

/** Las 100 células, en orden de catálogo. */
export const CELLS = Object.freeze(cells);

const BY_KEY = new Map(CELLS.map((c) => [c.key, c]));
const BY_ID = new Map(CELLS.map((c) => [c.id, c]));

/** Célula por clave de evento ('cell_ruta_1_1') o null. */
export const cellByKey = (key) => BY_KEY.get(key) || null;
/** Célula por ID de catálogo ('C001') o null. */
export const cellById = (id) => BY_ID.get(id) || null;
/** Células previstas en un mapa. */
export const cellsOnMap = (mapId) => CELLS.filter((c) => c.map === mapId);
/** Células de una etapa. */
export const cellsInStage = (stage) => CELLS.filter((c) => c.stage === stage);
/** Ids de mapa con células, sin repetir, en orden de catálogo. */
export const CELL_MAPS = Object.freeze([...new Set(CELLS.map((c) => c.map))]);

/** Recuento por etapa del registro (para tests y la pantalla). */
export function stageCounts() {
  return Object.fromEntries(STAGE_KEYS.map((s) => [s, cellsInStage(s).length]));
}
