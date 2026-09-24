// Servicios de pueblo de Axis (agente services): punto de entrada único para los mapas.
//   import { pokemonCenterMap, shopMap, clerkEvent, innkeeperEvent, moveTutorEvent, zoneDefaults } from '../../services/index.js';
// Detalle y ejemplos: docs/ARCHITECTURE.md §7e.
export {
  pokemonCenterMap, buildCenter, nurseEvent, pokemonCenterHeal, pcEvents, usePC, CENTER_LAYOUT, CENTER_ENTRY,
} from './pokecenter.js';
export { playHealMachine, ballsFrame, ballCount } from './healMachine.js';
export {
  shopMap, clerkEvent, openMart, shopStock, STOCK_TABLES, SHOP_LAYOUT,
} from './shop.js';
export { innkeeperEvent, restSpotEvent, runInn, runRest } from './inn.js';
export {
  moveTutorEvent, moveReminderEvent, runMoveTutor, runMoveReminder, relearnableMoves, tutorCanLearn, teachMove,
} from './moveTeaching.js';
export {
  zoneDefaults, mapInfo, mapDisplayName, mapPlace, MAP_GROUPS, CATALOG_MAP_IDS,
} from './zones.js';
export { restoredPillars, campaignProgress, meetsProgress, PILLAR_FLAGS } from './stages.js';
export {
  SERVICE_BRUSHES, SERVICE_STAMPS, exitWarps, exitArrowEvents, examineEvent, furnitureEvents,
} from './interior.js';
