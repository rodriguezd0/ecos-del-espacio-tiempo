// Elenco de sprites provisionales: qué hojas se generan para cada personaje.
import { PALETTES } from './palettes.mjs';
import { WALK } from './body_jacket.mjs';
import { RUN } from './body_run.mjs';
import { COAT, SKIRT } from './overlays.mjs';
import { PROTA_M, PROTA_F } from './heads_protas.mjs';
import { GAEL, PROFESOR, POLICIA, VECINO, VECINA, ANCIANO } from './heads_cast.mjs';
import { buildCoreSheet, buildCellSheet } from './zygarde.mjs';
import { buildBackStrip, BACK_SIZE } from './battle_back.mjs';
import { buildGaelFront, buildProfesorFront, FRONT_SIZE } from './battle_front.mjs';

const backSheet = (id) => ({ id: `${id}_back`, kind: 'battle_back', grid: BACK_SIZE, build: () => buildBackStrip(id) });

const human = (id, heads, extra = {}) => ({
  id,
  palette: PALETTES[id],
  heads,
  sheets: [{ id, poses: WALK }],
  ...extra,
});

export const CHARACTERS = [
  human('protagonista_m', PROTA_M, {
    sheets: [
      { id: 'protagonista_m', poses: WALK },
      { id: 'protagonista_m_run', poses: RUN },
      backSheet('protagonista_m'),
    ],
  }),
  human('protagonista_f', PROTA_F, {
    sheets: [
      { id: 'protagonista_f', poses: WALK },
      { id: 'protagonista_f_run', poses: RUN },
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
  { id: 'zygarde_core', sheets: [{ id: 'zygarde_core', build: buildCoreSheet }] },
  { id: 'zygarde_celula', sheets: [{ id: 'zygarde_celula', build: buildCellSheet }] },
];
