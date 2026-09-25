// Constantes y utilidades del Bloque 13 — Interludio 6: Estación Talasa, Islote Lumbre y Volcán Tizón
// (docs/CAMPANA.md B13, §2.3–2.6, §5; TABLILLAS T11 y T12). Módulo puro (se importa en Node desde las definiciones
// de mapa): flags, variables, hablantes, gráficos, música y ayudas de guion. Los combates de guion usan el helper
// común content/common/bossBattle.js (docs/BALANCE.md). Las ayudas genéricas se reutilizan de B09b (solo lectura).
import { getCharacter } from '../characters.js';
import { bossBattle } from '../common/bossBattle.js';
import { MAPS } from '../maps/index.js';

export { bossBattle };
export { when, lines, zygardeSays, byGender, examine, blockers, rectCells, routeTo, pause } from './b09b_common.js';

/**
 * Flags del bloque (prefijo b13_). Las claves de este objeto son únicas en el proyecto (el validador resuelve
 * `F.clave` por nombre). Globales que se leen: p6_restored, zyg_50 (entrada), b11_planos_talasa y b11_nilo_desertor
 * (B11), zyg_core_4 (lo pone grantCore), b13_dive_resonance (hito del Buceo, thresholds.js), zyg_dive (al activarse).
 */
export const F = Object.freeze({
  // Mar del Sur y Estación Talasa
  marCall: 'b13_mar_llamada', // Alerce llama por la Pokédex al entrar por primera vez en el mar
  talArrival: 'b13_talasa_llegada', // Alerce llega en barca al embarcadero: «Esta vez voy yo.»
  talGate: 'b13_talasa_control', // el técnico del control del embarcadero, vencido
  talGreenhouse: 'b13_talasa_invernadero', // escena de los cultivos de Solosis
  talCard: 'b13_talasa_tarjeta', // tarjeta de dirección (abre el laboratorio)
  talPhoto: 'b13_talasa_foto', // el jugador ha mirado la foto del «Proyecto Laguna»
  talLabIn: 'b13_talasa_lab_dentro', // Casia y Garrido junto al tanque (antes del combate)
  talBattle: 'b13_talasa_combate', // combate doble ganado
  talN4: 'b13_talasa_n4', // N4 se une al Core
  talPorygon: 'b13_nilo_porygon', // Nilo entrega el Porygon
  talDone: 'b13_talasa', // SALIDA del bloque (content/story/journal.js)
  talGaelLine: 'b13_alerce_gael', // «Ha dejado de contestar.»
  // Caleta Sonda: resonancia del Buceo
  diveHint: 'b13_buceo_pista', // aviso del Core en el muelle antes de tener N4
  diveScene: 'b13_buceo_escena', // escena de la resonancia vista (el hito es b13_dive_resonance)
  // T11 · «La noche de los farolillos» (Islote Lumbre)
  lumRamon: 'b13_t11_ramon', // segunda pista (Lucía no ha vuelto)
  lumArrival: 'b13_t11_islote', // primera visita al islote
  lumDance: 'b13_t11_baile', // baile imitado: se abre la gruta de la luna
  lumLucia: 'b13_t11_lucia', // Lucía, encontrada en la gruta
  lumPlate: 'b13_t11_tablilla', // Tabla Duende
  lumFeast: 'b13_t11_fiesta', // fiesta de los farolillos: Ramón da la pista del P7 y la Clefablita
  // T12 · «La forja fría» (Volcán Tizón)
  tizArrival: 'b13_t12_llegada', // primera llegada al caserío
  tizBrasa: 'b13_t12_brasa', // segunda pista (la Maestra Brasa)
  tizVent: (n) => `b13_t12_respiradero_${n}`, // respiradero n (1–3) reabierto
  tizVents: 'b13_t12_respiraderos', // los tres reabiertos
  tizChief: 'b13_t12_jefa', // la jefa de perforación, vencida: Genesis se retira del cráter
  tizPlate: 'b13_t12_tablilla', // Tabla Llama
  tizForge: 'b13_t12_forja', // la forja vuelve a arder: crisol y Houndoomita
  // Globales (otros bloques)
  p6: 'p6_restored',
  swimForm: 'zyg_50',
  core4: 'zyg_core_4',
  diveMilestone: 'b13_dive_resonance',
  plans: 'b11_planos_talasa',
  niloDeserted: 'b11_nilo_desertor',
  p7: 'p7_restored',
});

/** Variables del bloque. */
export const V = Object.freeze({
  dance: 'b13_baile', // pasos acertados del baile en curso (0–8)
  lava: (room) => `b13_colada_${room}`, // estado de la sala de coladas (b13_lava_logic.js)
  restCount: 'rest_count',
});

export const SPEAKER = Object.freeze({
  alerce: 'Prof. Alerce',
  nilo: 'Nilo',
  casia: 'Casia',
  garrido: 'Garrido',
  vertice: 'Vértice',
  tech: 'Técnico',
  techF: 'Técnica',
  ramon: 'Ramón',
  lucia: 'Lucía',
  diver: 'Buzo',
  brasa: 'Maestra Brasa',
  smith: 'Herrero',
  smithF: 'Herrera',
  apprentice: 'Aprendiz',
  chief: 'Jefa de perforación',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js, alias de characters_campaign.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  alerce: spriteOr('alerce', spriteOr('profesor', 'anil:cientifico')),
  nilo: spriteOr('nilo', spriteOr('genesis_tecnico', 'anil:cientifico')),
  casia: spriteOr('casia', 'anil:cientifica'),
  garrido: spriteOr('garrido', 'anil:cientifico'),
  vertice: spriteOr('vertice_lider', spriteOr('vertice', 'anil:giovanni')),
  tech: spriteOr('genesis_tecnico', 'anil:cientifico'),
  techF: spriteOr('genesis_tecnica', 'anil:cientifica'),
  researcher: spriteOr('genesis_investigador', 'anil:cientifico'),
  researcherF: spriteOr('genesis_investigadora', 'anil:cientifica'),
  ramon: spriteOr('ramon', 'anil:capitan'),
  lucia: 'anil:nina',
  diver: spriteOr('buzo', 'anil:nadador'),
  brasa: 'anil:veterana',
  smith: 'anil:operario',
  smithF: 'anil:operaria',
  apprentice: 'anil:chaval2',
  neighbor: spriteOr('vecina', 'anil:mujer1'),
  neighborM: spriteOr('vecino', 'anil:hombre1'),
  kid: spriteOr('nino', 'anil:nino'),
  sailor: 'anil:marinero',
  clefairy: 'follower:CLEFAIRY:0:0',
  cleffa: 'follower:CLEFFA:0:0',
  wingull: 'follower:WINGULL:0:0',
  solosis: 'follower:SOLOSIS:0:0',
  houndour: 'follower:HOUNDOUR:0:0',
  porygon: 'follower:PORYGON:0:0',
});

/** Objetos con arte propio (tools/b13_assets.mjs) y de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  boat: 'asset:objects/b13_barca.png', // barca de Alerce (fila 2 amarrada · 4 con el motor en marcha)
  tank: 'asset:objects/b13_tanque.png', // tanque de presión «Muestra Z-4» (2 lleno · 4 abierto · 6 vacío)
  screen: 'asset:objects/b13_pantalla.png', // pantalla mural (2 apagada · 4 señal · 6 Vértice)
  vat: 'asset:objects/b13_cultivo.png', // tanque de cultivo con Solosis (fila = variante)
  photo: 'asset:objects/b13_foto.png', // foto enmarcada con el rostro rascado
  plate: 'asset:objects/b13_tablilla.png', // Tablilla en el suelo (2 Duende · 4 Llama)
  stone: 'asset:objects/b13_piedra_baile.png', // piedra del corro (2 apagada · 4 encendida · 6 guía)
  lantern: 'asset:objects/b13_farolillo.png', // farolillo de papel (2 apagado · 4 encendido)
  moonRock: 'asset:objects/b13_roca_luna.png', // roca con una luna grabada que cierra la gruta (2 cerrada · 4 abierta)
  block: 'asset:objects/b13_obsidiana.png', // bloque de obsidiana que se empuja
  vent: 'asset:objects/b13_respiradero.png', // respiradero (2 taponado · 4 humea · 6 reabierto)
  lava: 'asset:objects/b13_colada.png', // colada de lava (2 viva · 4 costra enfriada)
  drill: 'asset:objects/b13_sonda.png', // sonda de perforación de Genesis (2 en marcha · 4 parada)
  shutter: 'asset:objects/b13_compuerta.png', // compuerta de seguridad (2 cerrada · 4 recogida)
  forge: 'asset:objects/b13_fragua.png', // fragua (2 fría · 4 encendida)
  pile: 'asset:objects/b13_pilote.png', // pilote de hormigón que asoma del agua
  buoy: 'asset:objects/b09b_boya.png', // boya (arte de B09b)
  kit: 'asset:objects/b09b_maletin.png', // maletín de instrumentos (arte de B09b)
  fire: 'asset:objects/hoguera.png', // hoguera (arte de B06)
});

/** Música (nombres de Añil o del catálogo, provisionales X04/X20; CAMPANA §1.8). */
export const MUSIC = Object.freeze({
  genesis: 'GuaridaRocket',
  grunt: 'EncuentroRocket',
  commander: 'CombateComandante',
  tension: 'Amenaza',
  lumbre: 'Pokeflauta',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** ¿Está registrado el mapa? (enlaces con bloques futuros: fondo del mar, Arrecife del Eco…). */
export const mapRegistered = (id) => Object.hasOwn(MAPS, id);

/** Noche de juego (20:00–5:59, GameState.isDay). */
export const isNight = (s) => Boolean(s) && typeof s.isDay === 'function' && !s.isDay();

/** Busca un evento vivo del mapa actual por id. */
export const findEvent = (ctx, id) => ctx.world?.events?.find((e) => e.id === id && !e.erased) || null;

/** Personaje de escena por el suelo (rodeando obstáculos): la ruta ortogonal simple si no hay mapa. */
export async function walkTo(ctx, ev, x, y, opts = {}) {
  if (!ev || (ev.x === x && ev.y === y)) return;
  const { stageRoute } = await import('./b07_path.js');
  const route = stageRoute(ctx, ev, x, y);
  if (route?.length) await ctx.move(ev, route, { through: false, ...opts });
}

/** Recoloca al jugador (y su cadena de seguidores) en una casilla del mapa actual sin warp. */
export async function placePlayer(ctx, { x, y, dir = 2 }) {
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten();
  const { placeChainBehind } = await import('../../world/follower.js');
  placeChainBehind(p, ctx.world.followers);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** Sprite de evento fijo (hoja 4×4 de un objeto: `dir` = fila, sin animar al andar). */
export const objectPage = (sprite, dir = 2, extra = {}) => ({ sprite, dir, directionFix: true, walkAnime: false, ...extra });
