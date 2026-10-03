// Elenco de sprites provisionales: qué hojas se generan para cada personaje.
import { PALETTES } from './palettes.mjs';
import { WALK } from './body_jacket.mjs';
import { COAT, SKIRT, APRON } from './overlays.mjs';
import { walkSheet, runSheet } from './rider.mjs';
import { GAEL, PROFESOR, POLICIA, VECINO, VECINA, ANCIANO } from './heads_cast.mjs';
import { MADRE, AYUDANTE, GUARDIANA } from './heads_b01.mjs';
import { KID_WALK, KID_SKIRT, NINO, NINA } from './kids.mjs';
import { buildCoreSheet, buildCellSheet } from './zygarde.mjs';
import { buildBackStrip, BACK_SIZE } from './battle_back.mjs';
import { buildGaelFront, buildProfesorFront, FRONT_SIZE } from './battle_front.mjs';
import { buildGuardianaFront } from './battle_front_b01.mjs';
import { buildRide10Sheet, buildRide50Sheet, MOUNT_SIZE } from './mounts.mjs';
import { buildDiveSheet, buildClimbSheet, buildFishSheet, ACTION_SIZE } from './actions.mjs';
import { buildFlightStrip, buildHexParticles } from './flight.mjs';
import { CAMPAIGN_PALETTES } from './palettes_campaign.mjs';
import { recolorOverlay, recolorPoses, PETO, CAPE, CASE } from './overlays.mjs';
import { LEANDRO, ABRIL, FERMIN, OLVIDO, SOL, MOLINERO, BUZO, ENFERMERA, DEPENDIENTE, ARCHIVISTA } from './heads_campaign.mjs';
import { VERTICE, CASIA, GARRIDO, TECNICO, TECNICA, INVESTIGADOR, INVESTIGADORA } from './heads_genesis.mjs';
import {
  buildLeandroFront, buildAbrilFront, buildFerminFront, buildOlvidoFront, buildSolFront, buildVerticeFront,
  buildCasiaFront, buildGarridoFront, buildTecnicoFrontM, buildTecnicoFrontF,
} from './battle_front_campaign.mjs';

const backSheet = (id) => ({ id: `${id}_back`, kind: 'battle_back', grid: BACK_SIZE, build: () => buildBackStrip(id) });

const human = (id, heads, extra = {}) => ({
  id,
  palette: PALETTES[id],
  heads,
  sheets: [{ id, poses: WALK }],
  ...extra,
});

// Elenco de la campaña: paleta de palettes_campaign.mjs; `withFront` añade el sprite frontal de combate.
const cast = (id, heads, extra = {}) => ({
  id, palette: CAMPAIGN_PALETTES[id], heads, sheets: [{ id, poses: WALK }], ...extra,
});
const withFront = (id, build, poses = WALK) => [
  { id, poses },
  { id: `${id}_front`, kind: 'battle_front', grid: FRONT_SIZE, build },
];
// Guantes carbón de los técnicos de Genesis: las manos del cuerpo pasan a Y/y.
const GLOVES = recolorPoses(WALK, { S: 'Y', s: 'y' });

/** Hojas de monturas y acciones de Zygarde de un protagonista (CAMPANA §2.7–2.8, §1.7). */
const fieldSheets = (id) => [
  { id: `${id}_ride10`, grid: MOUNT_SIZE, build: () => buildRide10Sheet(id) },
  { id: `${id}_ride50`, grid: MOUNT_SIZE, build: () => buildRide50Sheet(id) },
  { id: `${id}_dive`, grid: ACTION_SIZE, build: () => buildDiveSheet(id) },
  { id: `${id}_climb`, build: () => buildClimbSheet(id) },
  { id: `${id}_fish_offset`, grid: ACTION_SIZE, build: () => buildFishSheet(id) },
  { id: `${id}_vuelo`, kind: 'effect', grid: ACTION_SIZE, build: () => buildFlightStrip(id) },
];

/** Todas las hojas de un protagonista del kit recuperado (prota_kit.mjs; docs/arte.md §9). */
const protagonist = (id) => ({
  id,
  sheets: [
    { id, build: () => walkSheet(id) },
    { id: `${id}_run`, build: () => runSheet(id) },
    backSheet(id),
    ...fieldSheets(id),
  ],
});

export const CHARACTERS = [
  // Protagonistas con mochila (D06, 24-09-2026), los dos con el kit de protagonistas (rider.mjs → PROTAS).
  protagonist('protagonista_m'),
  protagonist('protagonista_f'),
  human('gael', GAEL, {
    sheets: [
      { id: 'gael', poses: WALK },
      { id: 'gael_front', kind: 'battle_front', grid: FRONT_SIZE, build: buildGaelFront },
    ],
  }),
  human('profesor', PROFESOR, {
    tall: 1,
    overlays: [COAT],
    sheets: [
      { id: 'profesor', poses: WALK },
      { id: 'profesor_front', kind: 'battle_front', grid: FRONT_SIZE, build: buildProfesorFront },
    ],
  }),
  human('policia', POLICIA, { tall: 1 }),
  human('vecino', VECINO, { tall: 1 }),
  human('vecina', VECINA, { overlays: [SKIRT] }), // sin estirar: el moño no cabría en los pasos
  human('anciano', ANCIANO, { headLift: 1 }),
  // Elenco nuevo de los bloques 1–2.
  human('madre', MADRE, { tall: 1, overlays: [APRON] }),
  human('ayudante', AYUDANTE, { tall: 1, overlays: [COAT] }),
  human('guardiana', GUARDIANA, {
    tall: 1,
    sheets: [
      { id: 'guardiana', poses: WALK },
      { id: 'guardiana_front', kind: 'battle_front', grid: FRONT_SIZE, build: buildGuardianaFront },
    ],
  }),
  human('nino', NINO, { headLift: 4, sheets: [{ id: 'nino', poses: KID_WALK }] }),
  human('nina', NINA, { headLift: 4, overlays: [KID_SKIRT], sheets: [{ id: 'nina', poses: KID_WALK }] }),
  // Elenco de la campaña (CAMPANA §3, §5, §6; docs/arte.md §7).
  cast('leandro', LEANDRO, { tall: 1, overlays: [COAT], sheets: withFront('leandro', buildLeandroFront) }),
  cast('abril', ABRIL, { sheets: withFront('abril', buildAbrilFront) }),
  cast('fermin', FERMIN, { tall: 1, sheets: withFront('fermin', buildFerminFront) }),
  cast('olvido', OLVIDO, { headLift: 1, overlays: [SKIRT], sheets: withFront('olvido', buildOlvidoFront) }),
  cast('sol', SOL, { sheets: withFront('sol', buildSolFront) }),
  cast('vertice', VERTICE, { tall: 1, sheets: withFront('vertice', buildVerticeFront) }),
  cast('vertice_lider', VERTICE, { tall: 1, overlays: [COAT, CAPE] }),
  cast('casia', CASIA, { tall: 1, overlays: [COAT], sheets: withFront('casia', buildCasiaFront) }),
  cast('garrido', GARRIDO, { tall: 1, overlays: [COAT], sheets: withFront('garrido', buildGarridoFront) }),
  cast('genesis_tecnico', TECNICO, { tall: 1, overlays: [PETO, CASE], sheets: withFront('genesis_tecnico', buildTecnicoFrontM, GLOVES) }),
  cast('genesis_tecnica', TECNICA, { overlays: [PETO, CASE], sheets: withFront('genesis_tecnica', buildTecnicoFrontF, GLOVES) }),
  cast('genesis_investigador', INVESTIGADOR, { tall: 1, overlays: [COAT] }),
  cast('genesis_investigadora', INVESTIGADORA, { tall: 1, overlays: [COAT] }),
  cast('enfermera', ENFERMERA, { overlays: [SKIRT, recolorOverlay(APRON, { C: 'Y', c: 'y', x: 'Z' })] }),
  cast('dependiente', DEPENDIENTE, { tall: 1, overlays: [APRON] }),
  cast('molinero', MOLINERO, { headLift: 1, overlays: [APRON] }),
  cast('buzo', BUZO),
  cast('archivista', ARCHIVISTA),
  { id: 'zygarde_core', sheets: [{ id: 'zygarde_core', build: buildCoreSheet }] },
  { id: 'zygarde_celula', sheets: [{ id: 'zygarde_celula', build: buildCellSheet }] },
  { id: 'zygarde_hex', sheets: [{ id: 'zygarde_hex', kind: 'effect', grid: 16, build: buildHexParticles }] },
];
