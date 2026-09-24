// Arranque de Pokémon: Ecos del Espacio-Tiempo.
import * as THREE from 'three';
import { engine, SCREEN_W, SCREEN_H } from './core/engine.js';
import { Scene } from './core/scenes.js';

async function loadDatabase() {
  const a = engine.assets;
  const [species, moves, abilities, items, types, trainerTypes, tilesets, dex] = await Promise.all([
    a.json('data/species.json'), a.json('data/moves.json'), a.json('data/abilities.json'), a.json('data/items.json'),
    a.json('data/types.json'), a.json('data/trainer_types.json'), a.json('data/tilesets.json'), a.json('data/dex_axis.json'),
  ]);
  return { species, moves, abilities, items, types, trainerTypes, tilesets, dex };
}

/** Escena provisional de arranque: verifica Three.js, /anil/ y la capa UI. */
class BootCheckScene extends Scene {
  async enter() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -100, 100);
    this.root = new THREE.Group();
    this.root.scale.y = -1; // coordenadas en píxeles con y hacia abajo
    this.scene.add(this.root);
    const tex = await engine.assets.texture(engine.assets.anil('Graphics/Pokemon/Front/ZYGARDE_1.png'));
    this.frames = Math.max(1, Math.round(tex.image.width / tex.image.height));
    this.size = tex.image.height;
    tex.repeat.set(1 / this.frames, 1);
    this.tex = tex;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(this.size * 2, this.size * 2), mat);
    this.sprite.position.set(SCREEN_W / 2, SCREEN_H / 2 - 10, 0);
    this.root.add(this.sprite);
    this.t = 0;
  }
  update() {
    this.t += 1;
    const f = Math.floor(this.t / 3) % this.frames;
    this.tex.offset.x = f / this.frames;
  }
  render(r) {
    r.render(this.scene, this.camera);
  }
  drawUI(g) {
    g.fillStyle = '#b9ff66';
    g.font = '24px "Power Green", monospace';
    g.textAlign = 'center';
    g.fillText('Pokémon: Ecos del Espacio-Tiempo', SCREEN_W / 2, 40);
    g.font = '18px "Power Green", monospace';
    g.fillStyle = '#ffffff';
    g.fillText(`Datos: ${Object.keys(engine.data.species).length} especies · ${engine.data.dex.entries.length} en inventario Axis`, SCREEN_W / 2, SCREEN_H - 30);
    g.textAlign = 'left';
  }
}

async function main() {
  engine.init();
  try {
    await engine.assets.font('Power Green', engine.assets.anil('Fonts/power green.ttf'));
    engine.data = await loadDatabase();
    document.getElementById('boot')?.remove();
    engine.start();
    await engine.scenes.push(new BootCheckScene());
  } catch (err) {
    engine.reportError(err);
  }
}

main();
