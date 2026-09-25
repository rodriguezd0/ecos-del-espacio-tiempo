// Selector de archivo del navegador (input type=file) que SIEMPRE se resuelve: con el archivo elegido o con null si
// el jugador cancela. Al cancelar, `change` no llega nunca: se escucha el evento `cancel` (Chrome 113+, Firefox 91+,
// Safari 16.4+) y, como respaldo, la vuelta del foco a la ventana (si tras un momento no hay archivo, se canceló).

/** Margen tras recuperar el foco antes de dar por cancelado (el `change` puede llegar un poco después). */
export const FOCUS_GRACE_MS = 400;

/**
 * Pide un archivo al usuario. opts: { accept, doc = document, win = window, graceMs }.
 * → Promise<File|null> (null al cancelar). doc/win son inyectables para las pruebas.
 */
export function pickFile({ accept = '', doc = globalThis.document, win = globalThis.window, graceMs = FOCUS_GRACE_MS } = {}) {
  return new Promise((resolve) => {
    const input = doc.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    if (input.style) input.style.display = 'none';
    let settled = false;
    let focusTimer = null;
    const cleanup = () => {
      win?.removeEventListener?.('focus', onFocus);
      if (focusTimer !== null) clearTimeout(focusTimer);
      input.remove?.();
    };
    const finish = (file) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(file || null);
    };
    const chosen = () => (input.files && input.files[0] ? input.files[0] : null);
    const onFocus = () => {
      focusTimer = setTimeout(() => finish(chosen()), graceMs);
    };
    input.addEventListener('change', () => finish(chosen()));
    input.addEventListener('cancel', () => finish(null));
    doc.body?.appendChild?.(input);
    // El foco vuelve a la ventana cuando se cierra el diálogo (con o sin archivo); se engancha después de abrirlo.
    setTimeout(() => win?.addEventListener?.('focus', onFocus, { once: true }), 0);
    input.click();
  });
}
