// Catálogo de mapas de Axis por zona (docs/CAMPANA.md §1.3–1.6, «Mapas:» de cada bloque y §1.8):
// nombre visible, música (BGM) y fondo de combate por defecto, y lugar del atlas al que pertenece
// (ui/logic/regionMapData.js). Módulo PURO y fuente única de estos datos: lo usan los mapas
// (`...zoneDefaults('villa_zaguan')`), ui/core/mapNames.js y las plantillas de servicios.
//
// Música y fondos: TÉCNICO provisional (X04/X20). Donde CAMPANA no fija un valor se deja null: el mapa
// decide o el combate usa el entorno del terreno. Los interiores se resuelven por prefijo
// ('zaguan_centro' → Villa Zaguán) y heredan nombre y música de su población.

/**
 * Grupo: lugar del atlas + valores por defecto + mapas exactos y prefijos de interiores.
 * maps: 'id' o ['id', { name?, bgm?, battleback? }] para excepciones dentro del grupo.
 */
const G = (place, name, bgm, battleback, maps, prefixes = []) => ({ place, name, bgm, battleback, maps, prefixes });

export const MAP_GROUPS = Object.freeze([
  // ── Poblaciones (§1.3) ──────────────────────────────────────────────────────────────────────
  G('villa_alba', 'Villa Alba', 'town_start', 'Bosque',
    ['villa_alba', 'casa_prota_1f', 'casa_prota_2f', 'casa_gael', 'casa_vecinos_n', 'casa_vecinos_se', 'laboratorio_alerce',
      ['alerce_cuarto_fondo', { name: 'Archivo del laboratorio' }]], ['alba_']),
  G('villa_zaguan', 'Villa Zaguán', 'PrismaVilla2', 'Pradera', ['villa_zaguan', 'zaguan_centro', 'casa_dintel'], ['zaguan_']),
  G('ciudad_caudal', 'Ciudad Caudal', 'CiudadCeleste', 'water_rio', ['ciudad_caudal', 'molino_diezmo'], ['caudal_']),
  G('villa_brontia', 'Villa Brontia', 'PuebloMarengo', null, ['villa_brontia'], ['brontia_']),
  G('ciudad_estrato', 'Ciudad Estrato', 'CiudadVerde', null, ['ciudad_estrato'], ['estrato_']),
  G('ciudad_lumina', 'Ciudad Lúmina', 'CiudadAzulona', null, ['ciudad_lumina'], ['lumina_']),
  G('aldea_mnemos', 'Aldea Mnemos', 'PrismaVilla1', null, ['aldea_mnemos'], ['mnemos_']),
  G('ciudad_nexo', 'Ciudad Nexo', 'CiudadCarmin', null, ['ciudad_nexo'], ['nexo_']),
  G('caleta_sonda', 'Caleta Sonda', 'Azul Tema', null, ['caleta_sonda'], ['caleta_']),
  G('villa_boreal', 'Villa Boreal', 'Emociones', 'snow', ['villa_boreal'], ['boreal_']),
  G('mesa_vientos', 'Mesa de los Vientos', 'viento', null, ['mesa_vientos'], ['mesa_vientos_']),
  G('bastion_axis', 'Bastión Axis', 'Torre Batalla', null, ['bastion_axis'], ['bastion_']),
  G('almenara', 'Península de Almenara', 'Azul Tema', 'Playa', [
    ['puerto_almenara', { name: 'Puerto Almenara' }], ['almenara_centro', { name: 'Centro Pokémon de Almenara' }],
    ['ruta_a1', { name: 'Ruta A1' }], ['ruta_a2', { name: 'Ruta A2', battleback: 'Desierto' }],
    ['oasis_vaso', { name: 'Oasis del Vaso', battleback: 'Desierto' }], ['monte_candil', { name: 'Monte Candil', bgm: 'Amenaza', battleback: 'Monte' }],
    ['el_crisol', { name: 'El Crisol', bgm: 'GuaridaRocket', battleback: 'BaseVillano' }], ['torre_crisol', { name: 'Torre del Crisol', bgm: 'Amenaza', battleback: 'BaseVillano' }],
  ]),
  G('ciudad_nexo', 'Registro de Expediciones', null, null, [
    ['b24_aduana_vieja', { name: 'Aduana Vieja' }],
  ]),
  G('isla_petalo', 'Isla Pétalo', null, 'PraderaFlores', ['b24_isla_petalo']),
  G('isla_estandarte', 'Isla Estandarte', null, 'Playa', ['b24_isla_estandarte']),
  G('ruta_9_neblino', 'Bosque Neblino', null, 'BosqueLila', [
    ['b24_santuario_neblino', { name: 'Santuario del Neblino' }], ['b24_claro_justicia', { name: 'Claro de la Justicia' }],
  ]),
  G('cerro_del_alba', 'Cráter del Lucero', null, null, ['b24_crater_lucero',
    ['b24_ultra_cristal', { name: 'Ultrazona Cristal' }], ['b24_ultra_selva', { name: 'Ultrazona Selva' }],
    ['b24_ultra_tormenta', { name: 'Ultrazona Tormenta' }], ['b24_ultra_cielo', { name: 'Ultrazona Cielo Alto' }],
    ['b24_ultra_abismo', { name: 'Ultrazona Abismo' }], ['b24_ultra_fortaleza', { name: 'Ultrazona Fortaleza' }], ['b24_ultra_veneno', { name: 'Ultrazona Veneno' }],
  ]),
  G('arrecife_eco', 'Cuna de Coral', null, 'Sub', ['b24_cuna_coral']),
  G('canteria_solano', 'Apuntalamientos de la Cantería', null, 'Cueva', ['b24_canteria_justicia']),
  G('dunas_ceniza', 'Cueva de las Dunas', null, 'Cueva', ['b24_cueva_dunas']),
  G('ciudad_estrato', 'Galería de Diamante', null, 'Cueva', ['b24_mina_diamante']),
  G('volcan_tizon', 'Termas de Tizón', null, 'Cueva', ['b24_termas_tizon']),
  G('sima_eje', 'Sala de los dos Ideales', null, 'Espacio', ['b24_dos_ideales']),

  // ── Rutas y zonas (§1.4) ────────────────────────────────────────────────────────────────────
  G('ruta_1', 'Ruta 1', 'Ruta 1', 'Bosque', ['ruta_1']),
  G('laberinto_profundidad', 'Laberinto de la Profundidad', 'Amenaza', null, ['laberinto_profundidad', 'laberinto_setos']),
  G('ruta_2', 'Ruta 2', 'Ruta 2', 'PraderaFlores', ['ruta_2']),
  G('ruta_3', 'Ruta 3', 'PrismaRuta1', null, ['ruta_3']),
  G('garganta_albo', 'Garganta del Albo', 'PrismaRuta1', 'water_rio', ['garganta_albo',
    ['gruta_albo', { name: 'Gruta del Albo', bgm: 'cave', battleback: 'Cueva' }],
    ['pozo_albo', { name: 'Pozo del Albo', bgm: 'Emociones', battleback: 'Sub' }]]),
  G('ruta_4', 'Ruta 4', 'Ruta 3', null, ['ruta_4']),
  G('ruta_5', 'Ruta 5', 'viento', 'Acantilado', ['ruta_5']),
  G('meseta_impulso', 'Meseta del Impulso', 'viento', 'Acantilado',
    ['meseta_impulso', ['parque_eolico', { name: 'Parque Eólico', battleback: 'Central' }]], ['parque_eolico_']),
  G('ruta_6', 'Ruta 6', 'PrismaRuta2', 'ZonaEscarpada', ['ruta_6']),
  G('canteria_solano', 'Cantería Solano', 'PrismaRuta2', 'ZonaEscarpada', ['canteria_solano'], ['canteria_']),
  G('dunas_ceniza', 'Dunas de Ceniza', 'IslaCanela', 'Desierto',
    ['dunas_ceniza', ['dunas_cueva', { name: 'Cueva de las Dunas', bgm: 'Cueva', battleback: 'Cueva' }]]),
  G('ruta_7', 'Ruta 7', 'Ruta 3', 'Desierto', ['ruta_7']),
  G('ruta_14_reserva', 'Ruta 14', 'ZonaSafari', 'Pradera3', ['ruta_14_reserva'], ['reserva_']),
  G('ruta_8_marisma', 'Ruta 8', 'PuebloLavanda', 'Pradera2', ['ruta_8_marisma'], ['palafitos_']),
  G('ruta_9_neblino', 'Ruta 9', 'PrismaBosqueArcoiris', 'BosqueLila', ['ruta_9_neblino']),
  G('ruta_10', 'Ruta 10', 'BosqueVerde', 'Bosque', ['ruta_10']),
  G('montana_portal', 'Monte del Portal', 'Intro', 'Monte', ['montana_portal', 'campamento_monte',
    ['monte_gruta', { name: 'Gruta del Monte', bgm: 'cave', battleback: 'Cueva' }]]), // B12: gruta de la repisa
  G('cerro_del_alba', 'Cerro del Alba', 'Ruta 1', null, ['cerro_alba', 'cerro_del_alba']),
  G('ruta_11', 'Ruta 11', 'PrismaRuta2', 'snow', ['ruta_11']),
  G('paso_del_norte', 'Paso del Norte', 'PrismaRuta2', 'snow', ['paso_del_norte', 'paso_refugio']), // B15: refugio
  G('ruta_12_senda_lazo', 'Ruta 12', 'Transicion', 'CimaNevada', ['ruta_12_senda_lazo']),
  G('ruta_13', 'Ruta 13', 'Ruta 2', 'snow', ['ruta_13']),
  G('lagos_alma', 'Lagos del Alma', 'VinculoSupremo', 'Agua', ['lagos_alma'], ['lagos_']),
  G('gruta_escarcha', 'Gruta Escarcha', 'Cueva', 'CuevaHielo', ['gruta_escarcha',
    ['escarcha_lago_interior', { name: 'Lago interior de Escarcha' }]], ['gruta_escarcha_']),
  G('mar_boreal', 'Mar Boreal', 'Azul Tema', 'water', ['mar_boreal']),
  G('mar_boreal', 'Fondo del Mar Boreal', 'Emociones', 'Sub', ['mar_boreal_fondo']), // B15: fondo bajo el remolino
  G('ruta_15', 'Ruta 15', 'Azul Tema', 'Playa', ['ruta_15']),
  G('mar_del_sur', 'Mar del Sur', 'Azul Tema', 'water', ['mar_del_sur',
    ['carguero', { name: 'Carguero', bgm: 'Barco' }]]), // B21: escena del epílogo (Vértice deja Axis por mar)
  G('mar_del_sur', 'Fondo del Mar del Sur', 'Emociones', 'Sub', ['fondo_mar_sur']),
  G('estacion_talasa', 'Sima Marina', 'Cueva', 'Sub', ['sima_marina']),
  G('mar_del_sur', 'Fosa Abisal', 'Cueva', 'Sub', ['fosa_abisal']),
  G('volcan_tizon', 'Veta Magmática', 'MansionQuemada', 'Volcan', ['veta_magmatica']),
  G('cumbre_azur', 'Balcón del Cielo', 'Transicion', 'CimaNevada', ['balcon_cielo']),
  G('islote_lumbre', 'Islote Lumbre', 'Pokeflauta', null, ['islote_lumbre'], ['lumbre_']), // lumbre_gruta (B13)
  G('volcan_tizon', 'Volcán Tizón', 'MansionQuemada', 'Volcan', ['volcan_tizon'], ['volcan_tizon_', 'tizon_']),
  G('estacion_talasa', 'Estación Talasa', 'GuaridaRocket', 'BaseVillano', ['estacion_talasa', ['ruinas_talasa', { name: 'Ruinas de Talasa' }]], ['estacion_talasa_', 'talasa_']),
  G('arrecife_eco', 'Arrecife del Eco', 'Emociones', 'Sub', ['arrecife_eco',
    ['arrecife_campana', { name: 'Campana de dragado', bgm: 'GuaridaRocket', battleback: 'BaseVillano' }]]), // B14: interior de Genesis
  G('sima_eje', 'Sima del Eje', 'Amenaza', 'Espacio', ['sima_eje']),
  G('senda_mirador', 'Senda del Mirador', 'Amenaza', 'Espacio', ['senda_mirador']),
  G('mirador_sur', 'Mirador Sur', null, 'Espacio', ['mirador_sur', ['grieta_porvenir', { name: 'Grieta del Porvenir' }]]),
  G('calzada_rey', 'Calzada del Rey', null, 'Espacio', ['calzada_rey',
    ['calzada_taller', { name: 'Taller del Rey', battleback: 'Cueva' }]]), // B19: el taller de la Peña del Rey
  G('cumbre_azur', 'Columna Lanza', 'Final2', 'ColumnaLanza', ['columna_lanza', ['cumbre_azur', { name: 'Cumbre Azur' }]]),
  G('instalacion_cierzo', 'Instalación Cierzo', null, null, ['instalacion_cierzo'], ['cierzo_']),

  // ── Pilares (§1.5) ──────────────────────────────────────────────────────────────────────────
  G('ruinas_dintel', 'Pilar del Umbral', null, 'Templo', ['explanada_umbral', 'ruinas_dintel'], ['ruinas_dintel_']),
  G('garganta_albo', 'Pilar de la Corriente', null, 'CuevaAzul', ['pilar_corriente'], ['pilar_corriente_']),
  G('meseta_impulso', 'Pilar del Impulso', null, 'Acantilado', ['anillo_vientos', 'galerias_soplo'], ['anillo_vientos_', 'galerias_soplo_']),
  G('cerro_plomo', 'Pilar de la Masa', null, 'Cueva', ['cerro_plomo', 'camara_contrapesos'], ['camara_contrapesos_']),
  G('ciudad_estrato', 'Mina Galena', null, 'CuevaOscura', ['mina_galena'], ['mina_galena_']),
  G('archivo_hondo', 'Pilar de la Memoria', null, 'Templo', ['archivo_hondo',
    ['archivo_coloso', { name: 'Archivo del Coloso' }]], ['archivo_hondo_']),
  G('aljibe_portal', 'Pilar Invertido', 'distortion', 'MundoDistorsion', ['aljibe_portal'], ['pilar_invertido']),
  G('aljibe_portal', 'Hondura de la Distorsión', 'distortion', 'MundoDistorsion',
    ['distorsion_honda', ['distorsion_corazon', { name: 'Corazón de la Distorsión' }]]),
  G('arrecife_eco', 'Pilar de los Ecos', null, 'Templo', ['fosa_eco'], ['antea_']),
  G('lagos_alma', 'Pilar del Alma', null, 'Templo', ['santuario_alma'], ['santuario_alma_']),
  G('sima_eje', 'Pilar de la Convergencia', null, 'Espacio', ['puente_convergencia', 'camara_cruce'], ['camara_cruce_']),
  G('sima_eje', 'Pilar del Origen', null, 'Cielo', ['puerta_quince', 'senda_origen', 'cielo_interior', 'terraza_ultimo_sello', 'nucleo_origen'], ['senda_origen_']), // B20: tramos senda_origen_1…9 (+ capas)
]);

function compile() {
  const exact = new Map();
  const prefixes = [];
  for (const g of MAP_GROUPS) {
    const base = { place: g.place, name: g.name, bgm: g.bgm ?? null, battleback: g.battleback ?? null };
    for (const m of g.maps) {
      const [id, over] = Array.isArray(m) ? m : [m, {}];
      if (exact.has(id)) throw new Error(`zones: mapa repetido en el catálogo: ${id}`);
      exact.set(id, Object.freeze({ id, ...base, ...over }));
    }
    for (const p of g.prefixes) prefixes.push({ prefix: p, info: base });
  }
  prefixes.sort((a, b) => b.prefix.length - a.prefix.length);
  return { exact, prefixes };
}

const { exact: EXACT, prefixes: PREFIXES } = compile();

/** Ids de mapa exactos del catálogo (orden de declaración). */
export const CATALOG_MAP_IDS = Object.freeze([...EXACT.keys()]);

/**
 * Datos por defecto del mapa: { id, place, name, bgm, battleback } o null si no es de Axis
 * (mapas de prueba, ids desconocidos). Busca el id exacto y, si no, el prefijo más largo.
 */
export function mapInfo(mapId) {
  if (!mapId || typeof mapId !== 'string') return null;
  const hit = EXACT.get(mapId);
  if (hit) return hit;
  const p = PREFIXES.find((e) => mapId.startsWith(e.prefix));
  return p ? { id: mapId, ...p.info } : null;
}

/**
 * Valores por defecto para una definición de mapa: { name, bgm, battleback } (sin nulls: los campos
 * sin dato no aparecen). Uso: `export default { id: 'ruta_4', ...zoneDefaults('ruta_4'), … }`.
 */
export function zoneDefaults(mapId) {
  const info = mapInfo(mapId);
  if (!info) return {};
  const out = {};
  for (const k of ['name', 'bgm', 'battleback']) if (info[k]) out[k] = info[k];
  return out;
}

/** Nombre visible de un mapa ('' si no está en el catálogo). */
export function mapDisplayName(mapId) {
  return mapInfo(mapId)?.name || '';
}

/** Lugar del atlas al que pertenece el mapa (id de REGION_MAP.places) o null. */
export function mapPlace(mapId) {
  return mapInfo(mapId)?.place || null;
}
