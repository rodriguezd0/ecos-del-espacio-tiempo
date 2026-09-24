// Mapa de PRUEBA de los sistemas narrativos (sin canon): Libreta y cola de pistas, Tablillas, «Pilar
// restaurado», fase de crisis, Clave Glífica, descanso y transporte. Textos genéricos de prueba.
// ?scene=map&map=dev_story&debug   (con ?vars=crisis_phase:3 se fuerza el eclipse)
import { DEV_FALLBACK_7 } from './dev_fallback.js';
import {
  openClue, advanceClue, giveTablet, restorePillar, setCrisisPhase,
} from '../story/api.js';
import { CAMPAIGN_TABLETS, ARCEUS_TABLETS } from '../story/tablets.js';
import { PILLAR_COUNT } from '../story/fragments.js';
import { CRISIS_PHASES } from '../story/crisis.js';
import { GLYPH_KEY } from '../story/verses.js';
import { takeTransport, markStation } from '../../world/transport.js';

const W = 32;
const H = 24;
const GUIDE = 'Guía de pruebas';

/** Redes de prueba con la misma forma que TRAIN/FERRY (world/transport.js). */
const DEV_TRAIN = {
  kind: 'train', name: 'Tren de pruebas', unlockFlag: 'p4_restored', needsVisit: true, routes: null,
  stops: [
    { id: 'historia', name: 'Zona de historia', map: 'dev_story', arrival: { x: 19, y: 17, dir: 8 } },
    { id: 'pruebas', name: 'Zona de pruebas', map: 'dev_test', arrival: { x: 10, y: 21, dir: 2 } },
  ],
};
const DEV_FERRY = {
  kind: 'ferry', name: 'Ferri de pruebas', unlockFlag: 'p7_restored', needsVisit: false,
  stops: [
    { id: 'historia', name: 'Zona de historia', map: 'dev_story', arrival: { x: 23, y: 17, dir: 8 } },
    { id: 'casa', name: 'Casa de pruebas', map: 'dev_test_casa', arrival: null },
  ],
  routes: [['historia', 'casa']],
};

async function guideMenu(ctx) {
  const options = ['Libreta y pistas T01–T04', 'Segunda pista de T01', 'Descubrir T07 (directo)', 'Abrir la Libreta', 'Activar tren y ferris', 'Nada'];
  const i = await ctx.choice(options, { message: '¿Qué quieres probar?', cancel: options.length - 1 });
  if (i === 0) {
    if (!ctx.state.hasKeyItem('CLUENOTEBOOK')) await ctx.giveItem('CLUENOTEBOOK');
    for (const id of ['T01', 'T02', 'T03', 'T04']) {
      const status = await openClue(ctx, id, { silent: true });
      await ctx.say(`${id}: ${status === 'queued' ? 'en espera (ya hay 3 abiertas)' : status === 'solved' ? 'resuelta' : 'abierta'}.`, { speaker: GUIDE });
    }
  } else if (i === 1) {
    await advanceClue(ctx, 'T01', 2);
    await ctx.say('T01 pasa a su segunda pista: aparece la zona.', { speaker: GUIDE });
  } else if (i === 2) {
    await openClue(ctx, 'T07', { direct: true });
    await ctx.say('Descubrimiento directo: T07 se abre aunque ya haya 3.', { speaker: GUIDE });
  } else if (i === 3) {
    await ctx.ui.openClues();
  } else if (i === 4) {
    ctx.setFlag('p4_restored');
    ctx.setFlag('p7_restored');
    markStation(ctx.state, 'pruebas', DEV_TRAIN);
    await ctx.say('Flags p4_restored y p7_restored activados; la estación de la Zona de pruebas cuenta como visitada.', { speaker: GUIDE });
  }
}

async function tabletGiver(ctx) {
  const owned = ctx.state.data.tablets || [];
  const next = [...CAMPAIGN_TABLETS, ...ARCEUS_TABLETS].find((t) => !owned.includes(t.id));
  if (!next) { await ctx.say('Ya tienes las dieciocho Tablillas.', { speaker: 'Arqueóloga' }); return; }
  if (!(await ctx.confirm(`¿Quieres la ${next.name} (${next.arc || 'Arceus'})?`))) return;
  await giveTablet(ctx, next.id);
}

async function testCore(ctx) {
  const n = (ctx.state.data.fragments || []).length + 1;
  if (n > PILLAR_COUNT) { await ctx.say('Los diez Pilares de prueba ya están restaurados.'); return; }
  if (!(await ctx.confirm(`¿Restaurar el Pilar ${n} de prueba?`))) return;
  await restorePillar(ctx, n, {
    core: { x: 15, y: 7 },
    force: true,
    onRestored: async (c, fr) => { await c.say(`Efecto local (prueba): ${fr.localEffect}`); },
  });
}

async function skyMenu(ctx) {
  const names = ['Según la historia', ...CRISIS_PHASES.map((p) => `${p.phase} · ${p.name}`)];
  const i = await ctx.choice([...names, 'Nada'], { message: '¿Qué cielo quieres ver?', cancel: names.length });
  if (i < 0 || i >= names.length) return;
  const phase = setCrisisPhase(ctx, i === 0 ? null : i - 1);
  await ctx.say(`Fase de crisis: ${phase}.`, { speaker: 'Científica' });
}

async function glyphToggle(ctx) {
  if (ctx.state.hasKeyItem(GLYPH_KEY)) {
    ctx.state.removeKeyItem(GLYPH_KEY);
    await ctx.say('Te devuelvo a la traducción parcial de la Pokédex.', { speaker: 'Glifólogo' });
  } else {
    await ctx.giveItem(GLYPH_KEY);
  }
}

export default {
  id: 'dev_story',
  name: 'Zona de historia',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 1',
  battleback: 'field',
  start: { x: 15, y: 12, dir: 2 },
  fallback: DEV_FALLBACK_7,
  build(b) {
    b.fill(null, 'cesped');
    b.rect(null, 0, 0, W, 4, 'bosque');
    b.rect(null, 0, H - 4, W, 4, 'bosque');
    b.rect(null, 0, 4, 4, H - 8, 'bosque');
    b.rect(null, W - 4, 4, 4, H - 8, 'bosque');
    const path = [];
    for (let y = 11; y <= 13; y++) for (let x = 4; x < W - 4; x++) path.push([x, y]);
    b.paint('camino_arena', path);
    if (b.hasStamp('placa_piedra')) b.stamp('placa_piedra', 13, 9);
    if (b.hasStamp('cristal_grande')) b.stamp('cristal_grande', 15, 6);
    if (b.hasStamp('troncos')) b.stamp('troncos', 9, 15);
    if (b.hasStamp('banco')) b.stamp('banco', 12, 16);
    b.stamp('cartel_madera', 5, 10);
    b.stamp('flores_rosas', 7, 7);
    b.stamp('flores_blancas', 24, 7);
    b.stamp('macizo_flores', 20, 16);
  },
  events: [
    {
      id: 'cartel', type: 'sign', x: 5, y: 10,
      text: 'ZONA DE HISTORIA (PRUEBAS)\nGuía: pistas · Arqueóloga: Tablillas · Cristal: Pilar · Científica: cielo.',
    },
    { id: 'guia', x: 7, y: 9, sprite: 'anil:estudiante', dir: 2, script: guideMenu },
    { id: 'arqueologa', x: 11, y: 9, sprite: 'anil:cientifica', dir: 2, script: tabletGiver },
    { id: 'nucleo', x: 15, y: 7, sprite: '', solid: true, trigger: 'action', noOver: true, script: testCore },
    { id: 'nucleo_b', x: 16, y: 7, sprite: '', solid: true, trigger: 'action', noOver: true, script: testCore },
    { id: 'cientifica', x: 20, y: 9, sprite: 'anil:cientifico', dir: 2, script: skyMenu },
    { id: 'glifologo', x: 24, y: 9, sprite: 'anil:cerebrito', dir: 2, script: glyphToggle },
    {
      id: 'cama', x: 6, y: 15, sprite: 'vecina', dir: 2,
      script: (ctx) => ctx.rest({ kind: 'home', message: 'Cama de casa (prueba). ¿Qué quieres hacer?' }),
    },
    {
      id: 'campamento', x: 9, y: 16, sprite: '', solid: true, trigger: 'action', noOver: true,
      script: (ctx) => ctx.rest({ kind: 'camp', message: 'Campamento (prueba). ¿Qué quieres hacer?' }),
    },
    {
      id: 'posadera', x: 15, y: 15, sprite: 'anil:dama', dir: 2,
      script: (ctx) => ctx.rest({ kind: 'inn', storm: true, message: 'Posada marcada (prueba). ¿Qué quieres hacer?' }),
    },
    { id: 'taquilla', x: 19, y: 15, sprite: 'anil:marinero', dir: 2, script: (ctx) => takeTransport(ctx, 'historia', { network: DEV_TRAIN, speaker: 'Taquilla' }) },
    { id: 'muelle', x: 23, y: 15, sprite: 'anil:marinero', dir: 2, script: (ctx) => takeTransport(ctx, 'historia', { network: DEV_FERRY, speaker: 'Muelle' }) },
  ],
};
