// Puerta temporal: recorta el panel YA pintado por el atlas. No modifica tiles ni eventos.
import * as THREE from 'three';
import { anchoredQuad, spriteMaterial } from './characterSprite.js';
import { GROUND_ORDER } from './tilemapView.js';

function intersection(a, b) {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
}

export function createDoorPanel(entry, descriptor, parent) {
  const { rect, slices, shade, mode } = descriptor;
  const texture = entry.res?.atlasTex;
  const [aw, ah] = entry.res?.atlasSize || [];
  if (!texture || !parent || !aw || !ah || !slices?.length || ![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) || rect.w <= 0 || rect.h <= 0) {
    throw new Error('Panel de puerta incompleto');
  }
  const regions = descriptor.regions || [{ x: 0, y: 0, w: rect.w, h: rect.h }];
  if (!regions.length || regions.some((r) => ![r.x, r.y, r.w, r.h].every(Number.isFinite) || r.x < 0 || r.y < 0 || r.w <= 0 || r.h <= 0 || r.x + r.w > rect.w || r.y + r.h > rect.h)) {
    throw new Error('Máscara de puerta fuera del panel');
  }
  const geometry = anchoredQuad();
  const group = new THREE.Group();
  group.name = 'door-panel';
  group.userData.stamp = descriptor.stamp;
  const ox = (entry.offset?.x || 0) * 32, oy = (entry.offset?.y || 0) * 32;
  const order = GROUND_ORDER + (entry.offset?.y || 0) + 0.25;
  const materials = [];
  const mesh = (rank) => {
    const material = spriteMaterial(texture);
    materials.push(material);
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    quad.renderOrder = order + rank;
    group.add(quad);
    return quad;
  };
  const place = (quad, x, y, w, h) => {
    quad.visible = w > 0 && h > 0;
    quad.scale.set(w, h, 1);
    quad.position.set(rect.x + ox + x + w / 2, rect.y + oy + y + h, 0);
  };
  const uv = (quad, x, y, w, h) => quad.material.uniforms.uRect.value.set(x / aw, y / ah, (x + w) / aw, (y + h) / ah);
  for (const r of regions) {
    const background = mesh(0);
    place(background, r.x, r.y, r.w, r.h);
    uv(background, shade.x + 0.5, shade.y + 0.5, 0, 0);
    // Sombra del interior: conserva el matiz del atlas, sin un gráfico sustituto.
    background.material.uniforms.uColor.value.set(0, 0, 0, 0.65);
  }
  const pieces = [];
  for (const s of slices) {
    const leaves = mode === 'slide' ? [[0, rect.w / 2, -1], [rect.w / 2, rect.w, 1]] : [[0, rect.w, 0]];
    for (const [start, end, side] of leaves) {
      const leaf = intersection(s, { x: start, y: 0, w: end - start, h: rect.h });
      for (const sourceMask of regions) {
        const source = intersection(leaf, sourceMask);
        if (!source.w || !source.h) continue;
        for (const targetMask of regions) pieces.push({ ...source,
          atlasX: s.atlasX + source.x - s.x, atlasY: s.atlasY + source.y - s.y,
          targetMask, side, quad: mesh(0.01) });
      }
    }
  }
  let disposed = false;
  const setProgress = (value) => {
    if (disposed) return;
    const p = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    group.userData.progress = p;
    const remaining = Math.round(rect.w * (1 - p));
    for (const s of pieces) {
      let moved;
      if (mode === 'slide') moved = { x: s.x + s.side * Math.round(rect.w / 2 * p), y: s.y, w: s.w, h: s.h };
      else if (mode === 'lift') moved = { x: s.x, y: s.y - Math.round(rect.h * p), w: s.w, h: s.h };
      else {
        const left = Math.round(s.x * remaining / rect.w), right = Math.round((s.x + s.w) * remaining / rect.w);
        moved = { x: rect.w - remaining + left, y: s.y, w: right - left, h: s.h };
      }
      const clip = intersection(moved, s.targetMask);
      place(s.quad, clip.x, clip.y, clip.w, clip.h);
      if (!clip.w || !clip.h) continue;
      const kx = s.w / moved.w, ky = s.h / moved.h;
      uv(s.quad, s.atlasX + (clip.x - moved.x) * kx, s.atlasY + (clip.y - moved.y) * ky, clip.w * kx, clip.h * ky);
    }
  };
  setProgress(0);
  parent.add(group);
  return {
    group, setProgress,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const material of materials) material.dispose();
      geometry.dispose();
    },
  };
}
