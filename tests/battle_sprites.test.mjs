// Sprites de combate como en Añil (Essentials 21.1 + plugin "Pokémon Animados para DBK"): métricas compiladas,
// posición y sombra, velocidad de animación, rutas de sprites, cámara pixel-perfect y fondos de baja resolución.
// Correcciones del creador del 25-09-2026 («Litten flota», «fondo muy pixelado», «humanos muy cuadrados»).
import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './battle_helpers.mjs';
import {
  battlerPosition, shadowPlacement, spriteOffset, spriteFrameTicks, spriteScale, speciesMetrics, spriteFileCandidates,
  stripFrames,
} from '../game/src/battle/scene/layout.js';
import { BattleCamera, CAMERA_PRESETS, MAX_PAN, pixelPerfectView } from '../game/src/battle/scene/camera.js';
import { isLowResBackdrop, resolveBackdrop } from '../game/src/battle/scene/setup.js';
import { metricsFromCompiled } from '../tools/lib/speciesMetrics.mjs';

test('métricas compiladas de Añil (species_metrics.dat) en species.json', () => {
  // Litten: AnimationSpeed = 1,2 → espalda 1, frente 2
  assert.deepEqual(db.species.LITTEN.metrics, { back: [3, 47], front: [2, 30], shadow: [1, -19, -11], animSpeed: 1, animSpeedFront: 2 });
  // El .dat difiere del PBS en ~25 especies: Venusaur usa BackSprite 5,14 (el PBS dice 5,32)
  assert.deepEqual(db.species.VENUSAUR.metrics.back, [5, 14]);
  assert.deepEqual(db.species.PIKACHU.metricsFemale.front, [8, 3]);
  assert.deepEqual(db.species.TERAPAGOS.forms[2].metrics.back, [4, 27, 2], 'escala propia de la espalda');
});

test('metricsFromCompiled: velocidades y valores por defecto de DBK', () => {
  const m = metricsFromCompiled({ back_sprite: [1, 2, null], front_sprite: [3, 4, null], shadow_sprite: [0, 1, 2], shadow_size: 1, front_sprite_altitude: 0, animation_speed: [1, null] });
  assert.deepEqual(m, { back: [1, 2], front: [3, 4], shadow: [0, 1, 2], animSpeed: 1 }, 'front_sprite_speed = [1] || [0]');
  const n = metricsFromCompiled({ back_sprite: [0, 0, 2], front_sprite: [0, 0, null], shadow_size: 0, front_sprite_altitude: 3, animation_speed: [2, 3] });
  assert.equal(n.shadowSize, 0);
  assert.equal(n.altitude, 3);
  assert.deepEqual(n.back, [0, 0, 2]);
  assert.equal(n.animSpeedFront, 3);
});

test('speciesMetrics: hembra solo con HasGenderedSprites, forma completa o la de la especie base', () => {
  const pika = db.species.PIKACHU;
  assert.ok((pika.flags || []).includes('HasGenderedSprites'));
  assert.equal(speciesMetrics(db, 'PIKACHU', 0, true), pika.metricsFemale);
  assert.equal(speciesMetrics(db, 'PIKACHU', 0, false), pika.metrics);
  assert.equal(speciesMetrics(db, 'LITTEN', 0, true), db.species.LITTEN.metrics, 'sin sprites por sexo');
  assert.equal(speciesMetrics(db, 'VENUSAUR', 1), db.species.VENUSAUR.forms[1].metrics, 'la forma es una entrada completa');
  assert.equal(speciesMetrics(db, 'LITTEN', 7), db.species.LITTEN.metrics, 'forma sin métricas → especie base');
  assert.deepEqual(speciesMetrics(db, 'NOEXISTE'), {});
});

test('Litten por delante y por detrás: pies y sombra en su sitio (DBK)', () => {
  const m = speciesMetrics(db, 'LITTEN', 0);
  // Frente (×2, frames de 96): base en battlerPosition + FrontSprite×2; los pies del arte están 28 px sobre el borde.
  const foe = battlerPosition(1);
  const front = spriteOffset(m, 1);
  const feetY = foe.y + front.dy - 28 * 2;
  const sh = shadowPlacement(m, 1, 96 * 2);
  assert.equal(sh.dy, 30 * 2 - 11 * 2 - 48);
  // La silueta aplastada (alto 192 × 0,25 = 48) centrada en la sombra cubre la línea de los pies.
  const shadowCenter = foe.y + sh.dy;
  assert.ok(Math.abs(shadowCenter + 48 / 2 * (67 / 96 - 0.5) * 2 - feetY) < 8, `pies ${feetY}, sombra ${shadowCenter}`);
  // Espalda (×3): la sombra queda por encima del borde inferior del sprite (bajo los pies), no por debajo.
  const back = shadowPlacement(m, 0, 96 * 3);
  assert.equal(back.dy, 47 * 2 - 19 * 2 - 72);
  assert.ok(back.dy < spriteOffset(m, 0).dy);
});

test('sombra: tamaño, ShadowSize negativo y 0, división entera de Ruby', () => {
  assert.equal(shadowPlacement({ front: [0, 0] }, 1, 182).dy, -45);
  assert.equal(shadowPlacement({ front: [0, 0] }, 1, 294).dy, -73, '294/4 = 73 (no 74)');
  const big = shadowPlacement({ shadowSize: 3 }, 1, 100);
  assert.ok(Math.abs(big.zoomX - 1.2) < 1e-9 && Math.abs(big.zoomY - 0.3) < 1e-9);
  assert.ok(Math.abs(shadowPlacement({ shadowSize: -1 }, 1, 100).zoomX - 0.9) < 1e-9, 'ShadowSize negativo encoge');
  assert.equal(shadowPlacement({ shadowSize: 0 }, 1, 100).visible, false);
});

test('escala y velocidad de animación (DeluxeBitmapWrapper)', () => {
  assert.equal(spriteScale(0), 3);
  assert.equal(spriteScale(1), 2);
  assert.equal(spriteScale(0, { back: [4, 27, 2] }), 2);
  assert.equal(spriteScale(1, { front: [4, 27] }), 2);
  assert.equal(spriteFrameTicks({ animSpeed: 2 }), 4, 'ceil(60 ms × 60)');
  assert.equal(spriteFrameTicks({ animSpeed: 3 }), 6);
  assert.equal(spriteFrameTicks({ animSpeed: 1 }), 2);
  assert.equal(spriteFrameTicks({ animSpeed: 0 }), 0);
  assert.equal(spriteFrameTicks({ animSpeed: 1, animSpeedFront: 2 }, true), 2, 'espalda');
  assert.equal(spriteFrameTicks({ animSpeed: 1, animSpeedFront: 2 }, false), 4, 'frente');
});

test('frames de la hoja y rutas de sprites (check_graphic_file de Essentials)', () => {
  assert.deepEqual(stripFrames(11328, 96), { frames: 118, fw: 96, fh: 96 });
  assert.deepEqual(stripFrames(80, 64), { frames: 1, fw: 80, fh: 64 });
  assert.deepEqual(stripFrames(150, 64), { frames: 3, fw: 64, fh: 64 }, 'última tira incompleta: ceil');
  assert.deepEqual(spriteFileCandidates({ species: 'PIKACHU', female: true, shiny: true }, 'Front'), [
    'Graphics/Pokemon/Front shiny/PIKACHU_female.png', 'Graphics/Pokemon/Front/PIKACHU_female.png',
    'Graphics/Pokemon/Front shiny/PIKACHU.png', 'Graphics/Pokemon/Front/PIKACHU.png',
  ]);
  assert.deepEqual(spriteFileCandidates({ species: 'VENUSAUR', form: 1 }, 'Back'), [
    'Graphics/Pokemon/Back/VENUSAUR_1.png', 'Graphics/Pokemon/Back/VENUSAUR.png',
  ]);
  assert.deepEqual(spriteFileCandidates({ species: 'ONIX' }, 'Back'), ['Graphics/Pokemon/Back/ONIX.png']);
});

test('cámara pixel-perfect: zoom siempre 1 y paneo limitado', () => {
  for (const p of Object.values(CAMERA_PRESETS)) {
    const v = pixelPerfectView(p);
    assert.equal(v.zoom, 1);
    assert.ok(Math.abs(v.x - 256) <= MAX_PAN.x && Math.abs(v.y - 192) <= MAX_PAN.y);
  }
  const cam = new BattleCamera();
  cam.to({ x: 128, y: 300, zoom: 1.4 }, 1);
  assert.deepEqual(cam.target, { x: 256 - MAX_PAN.x, y: 192 + MAX_PAN.y, zoom: 1 });
  cam.focusBetween({ x: 128, y: 250 }, { x: 384, y: 140 }, 1.1);
  assert.equal(cam.target.zoom, 1);
});

test('fondos de baja resolución ampliada (Templo de las ruinas)', () => {
  assert.equal(resolveBackdrop({ battleback: 'ruins' }).name, 'Templo');
  assert.equal(isLowResBackdrop('Templo'), true);
  assert.equal(isLowResBackdrop('Pradera'), false);
});
