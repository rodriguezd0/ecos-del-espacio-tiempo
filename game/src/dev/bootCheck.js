// Escena de verificación de arranque: Three.js, /anil/ y capa UI.
import * as THREE from 'three';
import { engine, SCREEN_W, SCREEN_H } from '../core/engine.js';
import { Scene } from '../core/scenes.js';

export default class BootCheckScene extends Scene {
  async enter() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -100, 100);
    this.root = new THREE.Group();
    this.root.scale.y = -1;
    this.scene.add(this.root);
    const tex = await engine.assets.texture(engine.assets.anil('Graphics/Pokemon/Front/ZYGARDE_1.png'));
    this.frames = Math.max(1, Math.round(tex.image.width / tex.image.height));
    tex.repeat.set(1 / this.frames, 1);
    this.tex = tex;
    const size = tex.image.height * 2;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    this.sprite.position.set(SCREEN_W / 2, SCREEN_H / 2 - 10, 0);
    this.root.add(this.sprite);
    this.t = 0;
  }
  exit() {
    this.sprite.geometry.dispose();
    this.sprite.material.dispose();
  }
  update() {
    this.t += 1;
    this.tex.offset.x = (Math.floor(this.t / 3) % this.frames) / this.frames;
  }
  render(r) {
    r.render(this.scene, this.camera);
  }
  drawUI(g) {
    g.textAlign = 'center';
    g.fillStyle = '#b9ff66';
    g.font = '24px "Power Green", monospace';
    g.fillText('Pokémon: Ecos del Espacio-Tiempo', SCREEN_W / 2, 40);
    g.fillStyle = '#ffffff';
    g.font = '18px "Power Green", monospace';
    g.fillText(`Datos: ${Object.keys(engine.data.species).length} especies · ${engine.data.dex.entries.length} en inventario Axis`, SCREEN_W / 2, SCREEN_H - 30);
    g.fillText('En construcción: el primer bloque jugable está en desarrollo.', SCREEN_W / 2, SCREEN_H - 56);
    g.textAlign = 'left';
  }
}
