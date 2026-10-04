// Datos de dibujo, nunca estado de partida. Las máscaras se revisan por gráfico de edificio.
import { regularTileAtlasPos } from '../shared/autotile.js';
import { createDoorPanel } from '../render/doorPanel.js';

const wood = { images: ['ExteriorBosqueCeleste', 'Exterior1'], rect: [-2, -4, 36, 34], shade: [-4, 0], mode: 'hinge-right' };
const center = { images: ['ExteriorBosqueCeleste', 'Exterior1', 'Exterior2', 'Exterior3', 'ExteriorPrisma'], rect: [7, -4, 20, 32], shade: [-8, -8], mode: 'slide' };
const green = { images: ['Exterior1', 'Exterior2', 'ExteriorPrisma'], rect: [-2, -4, 40, 34], shade: [0, -2], mode: 'hinge-right' };
const turquoise = { images: ['Exterior1', 'Exterior2', 'Exterior3'], rect: [0, 8, 32, 22], shade: [2, 10], mode: 'hinge-right' };
export const DOOR_MASKS = Object.freeze({
  casa_verde: wood, casa_verde_pequena: wood, centro_pokemon: center,
  casa_roja: { images: ['ExteriorBosqueCeleste', 'Exterior1'], rect: [0, -8, 30, 32], shade: [2, -8], mode: 'hinge-right',
    regions: [{ x: 2, y: 0, w: 28, h: 32 }, { x: 0, y: 16, w: 2, h: 8 }] },
  casa_naranja: { images: ['Exterior1'], rect: [-25, -16, 44, 48], shade: [-23, -14], mode: 'hinge-right' },
  casa_naranja_ancha: { images: ['Exterior1'], rect: [9, -16, 46, 48], shade: [9, -14], mode: 'hinge-right' },
  edificio_naranja: { images: ['Exterior1'], rect: [7, -48, 44, 46], shade: [7, -46], mode: 'hinge-right' },
  tienda_torre: { images: ['Exterior2'], rect: [-4, -4, 58, 32], shade: [-4, -4], mode: 'slide' },
  casa_grande_pizarra: { images: ['Exterior2'], rect: [-4, -10, 40, 34], shade: [-6, 0], mode: 'hinge-right' },
  casa_granate: green, casa_rosa: green,
  casa_turquesa_grande: turquoise, edificio_turquesa_ancho: turquoise,
  casa_turquesa_balcon: { images: ['Exterior1'], rect: [-4, -12, 40, 44], shade: [6, -2], mode: 'hinge-right' },
  central: { images: ['Exterior1'], rect: [4, -2, 34, 28], shade: [4, -2], mode: 'lift' },
  estacion_tren: { images: ['Exterior3'], rect: [-26, -10, 58, 34], shade: [-26, -10], mode: 'slide' },
  casa_cupula: { images: ['Exterior3', 'Exterior1'], rect: [0, 0, 34, 28], shade: [0, 0], mode: 'hinge-right',
    variants: { Exterior1: { rect: [2, -2, 28, 32], shade: [2, -2] } } },
  restaurante: { images: ['Exterior2'], rect: [-1, 0, 34, 28], shade: [-1, 0], mode: 'hinge-right' },
  torre_cristal: { images: ['Exterior1'], rect: [-8, -12, 20, 38], shade: [-8, -12], mode: 'slide' },
  casa_azul: { images: ['Exterior1'], rect: [-22, -6, 46, 38], shade: [-22, -6], mode: 'hinge-right' },
  pabellon_verde: { images: ['ExteriorPrisma'], rect: [-4, -26, 40, 50], shade: [-4, -26], mode: 'slide' },
  pabellon_verde_2: { images: ['ExteriorPrisma'], rect: [10, -26, 12, 48], shade: [10, -26], mode: 'hinge-right' },
  casa_oriental_rosa: { images: ['ExteriorPrisma'], rect: [-2, -26, 40, 50], shade: [-2, -26], mode: 'slide' },
  pabellon_rosa: { images: ['ExteriorPrisma'], rect: [12, -26, 12, 48], shade: [12, -26], mode: 'hinge-right' },
  templo_oscuro: { images: ['ExteriorPrisma'], rect: [-4, -24, 40, 50], shade: [-4, -24], mode: 'slide' },
  bloque_morado: { images: ['Exterior3'], rect: [4, -6, 40, 36], shade: [4, -6], mode: 'hinge-right' },
  cabana_turquesa: { images: ['Exterior1'], rect: [-4, -12, 40, 40], shade: [-4, -12], mode: 'hinge-right' },
  laboratorio_rojo: { images: ['Exterior1'], rect: [-2, -4, 70, 36], shade: [-2, -4], mode: 'slide' },
});

function sourcePixel(map, px, py) {
  const tx = Math.floor(px / 32), ty = Math.floor(py / 32);
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return null;
  const id = map.layers[2][tx + ty * map.width];
  if (id < 384 || (map.priorities[id] || 0) !== 0) return null;
  const p = regularTileAtlasPos(id);
  return { x: p.x + px - tx * 32, y: p.y + py - ty * 32 };
}

export function resolveDoorPanel(entry, x, y) {
  if (!entry?.map || !Number.isInteger(x) || !Number.isInteger(y)) return null;
  const marker = entry.map.markers.find((m) => m.kind === 'door' && m.x === x && m.y === y);
  const base = Object.hasOwn(DOOR_MASKS, marker?.stamp) ? DOOR_MASKS[marker.stamp] : null;
  if (!base || !base.images.includes(entry.map.tileset.image)) return null;
  const spec = { ...base, ...base.variants?.[entry.map.tileset.image] };
  const [dx, dy, w, h] = spec.rect;
  const rect = { x: x * 32 + dx, y: y * 32 + dy, w, h };
  const shade = sourcePixel(entry.map, x * 32 + spec.shade[0], y * 32 + spec.shade[1]);
  if (!shade) return null;
  const slices = [];
  for (let sy = 0; sy < h;) {
    const py = rect.y + sy, sh = Math.min(h - sy, 32 - ((py % 32 + 32) % 32));
    for (let sx = 0; sx < w;) {
      const px = rect.x + sx, sw = Math.min(w - sx, 32 - ((px % 32 + 32) % 32));
      const source = sourcePixel(entry.map, px, py);
      if (!source) return null;
      slices.push({ x: sx, y: sy, w: sw, h: sh, atlasX: source.x, atlasY: source.y });
      sx += sw;
    }
    sy += sh;
  }
  return { stamp: marker.stamp, rect, slices, shade, mode: spec.mode, regions: spec.regions?.map((r) => ({ ...r })) };
}

export class DoorAnimation {
  constructor(scene, source, targetMap, arrival = null) {
    this.scene = scene;
    this.source = source;
    this.originMap = scene.world.current?.id;
    this.targetMap = targetMap;
    this.arrival = arrival;
    this.panel = null;
    this.cancelled = false;
  }

  attach(entry, descriptor, progress) {
    if (!descriptor || !entry.res?.atlasTex || !this.scene.worldView?.fxGroup || this.cancelled) return false;
    this.clear();
    this.panel = createDoorPanel(entry, descriptor, this.scene.worldView.fxGroup);
    this.panel.setProgress(progress);
    return true;
  }

  async open() {
    const entry = this.scene.world.current;
    if (entry?.id !== this.originMap || !this.source || !this.attach(entry, resolveDoorPanel(entry, this.source.x, this.source.y), 0)) return;
    for (const p of [0, 1 / 3, 2 / 3, 1]) {
      if (this.cancelled) return;
      this.panel.setProgress(p);
      await this.scene.runner.wait(4);
    }
  }

  prepareArrival() {
    const entry = this.scene.world.current;
    const p = this.scene.world.player;
    if (entry?.id !== this.targetMap || p.direction !== 2) return;
    if (this.arrival) {
      this.attach(entry, resolveDoorPanel(entry, this.arrival.x, this.arrival.y), 1);
      return;
    }
    const w = (entry.def.warps || []).find((w) => w.door && w.to === this.originMap && w.x === p.x && w.y + 1 === p.y);
    if (w) this.attach(entry, resolveDoorPanel(entry, w.x, w.y), 1);
  }

  async close() {
    if (!this.panel) return;
    for (const p of [1, 2 / 3, 1 / 3, 0]) {
      if (this.cancelled) return;
      this.panel.setProgress(p);
      await this.scene.runner.wait(4);
    }
    this.clear();
  }

  clear() { this.panel?.dispose(); this.panel = null; }
  dispose() { this.cancelled = true; this.clear(); }
}
