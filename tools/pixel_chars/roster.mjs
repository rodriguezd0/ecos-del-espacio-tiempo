// Elenco de sprites provisionales: qué hojas se generan para cada personaje.
import { PALETTES } from './palettes.mjs';
import { WALK } from './body_jacket.mjs';
import { RUN } from './body_run.mjs';
import { COAT, SKIRT, APRON } from './overlays.mjs';
import { withBackpack } from './backpack.mjs';
import { PROTA_M, PROTA_F } from './heads_protas.mjs';
import { GAEL, PROFESOR, POLICIA, VECINO, VECINA, ANCIANO } from './heads_cast.mjs';
import { MADRE, AYUDANTE, GUARDIANA } from './heads_b01.mjs';
import { KID_WALK, KID_SKIRT, NINO, NINA } from './kids.mjs';
import { buildCoreSheet, buildCellSheet } from './zygarde.mjs';
import { buildBackStrip, BACK_SIZE } from './battle_back.mjs';
import { buildGaelFront, buildProfesorFront, FRONT_SIZE } from './battle_front.mjs';
import { buildGuardianaFront } from './battle_front_b01.mjs';

const backSheet = (id) => ({ id: `${id}_back`, kind: 'battle_back', grid: BACK_SIZE, build: () => buildBackStrip(id) });

const human = (id, heads, extra = {}) => ({
  id,
  palette: PALETTES[id],
  heads,
  sheets: [{ id, poses: WALK }],
  ...extra,
});

// Protagonistas con mochila (D06, 24-09-2026).
const WALK_BAG = withBackpack(WALK);
const RUN_BAG = withBackpack(RUN);

export const CHARACTERS = [
  human('protagonista_m', PROTA_M, {
    sheets: [
      { id: 'protagonista_m', poses: WALK_BAG },
      { id: 'protagonista_m_run', poses: RUN_BAG },
      backSheet('protagonista_m'),
    ],
  }),
  human('protagonista_f', PROTA_F, {
    sheets: [
      { id: 'protagonista_f', poses: WALK_BAG },
      { id: 'protagonista_f_run', poses: RUN_BAG },
      backSheet('protagonista_f'),
    ],
  }),
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
  { id: 'zygarde_core', sheets: [{ id: 'zygarde_core', build: buildCoreSheet }] },
  { id: 'zygarde_celula', sheets: [{ id: 'zygarde_celula', build: buildCellSheet }] },
];
