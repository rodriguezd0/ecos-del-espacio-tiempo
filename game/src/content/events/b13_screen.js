// Pantalla mural de Genesis (CAMPANA B13 punto 6: «Vértice aparece en una pantalla como Líder Supremo»): ventana con
// marco de monitor, líneas de barrido y el retrato de combate de un personaje (content/characters.js), encima del mapa
// y bajo los mensajes. Se abre con showScreen(id) → { close() } y se cierra a mano, como pbShowPicture de Essentials.
// Las dependencias de UI se cargan bajo demanda: en Node (sin DOM) devuelve un no-op.

const W = 236;
const H = 196;
const TOP = 14;

/**
 * Muestra la pantalla con el retrato `battleId` (p. ej. 'vertice_front') y un rótulo inferior.
 * @returns {Promise<{ close(): void }>}
 */
export async function showScreen(battleId, { caption = '' } = {}) {
  if (typeof document === 'undefined') return { close() {} };
  const [{ engine, SCREEN_W }, { UIScene }, { getBattleSprite }] = await Promise.all([
    import('../../core/engine.js'),
    import('../../ui/core/uiScene.js'),
    import('../characters.js'),
  ]);
  const sprite = getBattleSprite(battleId);
  let img = null;
  try {
    img = sprite ? await engine.assets.image(sprite.file) : null;
  } catch (err) {
    console.warn('[b13] Retrato de la pantalla', err);
  }
  const start = engine.frame;

  class ScreenScene extends UIScene {
    drawUI(g) {
      const t = engine.frame - start;
      const x = Math.round((SCREEN_W - W) / 2);
      const k = Math.min(1, t / 12); // encendido: la imagen se abre en vertical
      g.save();
      // Marco del monitor (carbón) con el piloto magenta de Genesis.
      g.fillStyle = '#2B2D31';
      g.fillRect(x - 6, TOP - 6, W + 12, H + 12);
      g.fillStyle = '#44474D';
      g.fillRect(x - 6, TOP - 6, W + 12, 3);
      g.fillStyle = (t >> 4) % 2 ? '#E266B8' : '#B03A8C';
      g.fillRect(x + W - 2, TOP + H + 1, 4, 3);
      // Fondo de la señal.
      const h = Math.max(2, Math.round(H * k));
      const y = TOP + Math.round((H - h) / 2);
      g.fillStyle = '#10222A';
      g.fillRect(x, y, W, h);
      if (img && k >= 1) {
        const fw = sprite.frameW || img.height;
        const fh = sprite.frameH || img.height;
        g.imageSmoothingEnabled = false;
        g.globalAlpha = 0.92 + 0.08 * Math.sin(t / 5);
        g.drawImage(img, 0, 0, fw, fh, x + Math.round((W - fw) / 2), TOP + 8, fw, fh);
        g.globalAlpha = 1;
      }
      // Líneas de barrido y banda que baja.
      g.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let sy = y; sy < y + h; sy += 3) g.fillRect(x, sy, W, 1);
      const band = TOP + ((t * 2) % H);
      g.fillStyle = 'rgba(176, 58, 140, 0.18)';
      g.fillRect(x, band, W, 6);
      if (caption && k >= 1) {
        g.fillStyle = 'rgba(16, 20, 24, 0.8)';
        g.fillRect(x, TOP + H - 20, W, 20);
        g.fillStyle = '#F2F4F5';
        g.font = '12px monospace';
        g.textAlign = 'center';
        g.fillText(caption, x + W / 2, TOP + H - 6);
      }
      g.restore();
    }
  }

  const scene = new ScreenScene();
  engine.scenes.push(scene).catch((err) => engine.reportError(err));
  for (let i = 0; i < 30 && !engine.scenes.stack.some((e) => e.scene === scene); i++) {
    await new Promise((r) => setTimeout(r, 16));
  }
  return { close: () => scene.close() };
}
