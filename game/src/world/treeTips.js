// Sellado de puntas de copa (módulo puro; docs/stamps.md «Bosques»). La fila de arriba del todo de un árbol (su punta)
// se pasa por detrás, como en Añil, SOLO si encima no hay nada que impida estar ahí: con otro árbol encima, un
// obstáculo de tiles (acantilado, agua, valla, edificio…), un evento o el borde del mapa, la punta vuelve a bloquear:
// se cambia por su copia «sellada» (mismo dibujo, pasaje 0x0F; tools/tree_tips.mjs → tilesets.json `sealedTips`) o,
// si el tileset no la tiene, se pone el tile invisible del pincel (`blocker`, 503) en la capa 1 libre. Así la franja
// de puntas nunca une zonas que antes no estaban unidas: cada punta libre tiene encima una casilla que ya se pisaba.
//   sealTreeTips(built, tileset, def) → nº de puntas selladas (modifica built.layers)

/** ¿Se pisa la casilla `i` solo por sus tiles? (Game_Map#passableStrict sin eventos) */
function walkable(layers, i, tileset) {
  for (let L = 2; L >= 0; L--) {
    const id = layers[L][i];
    if (!id) continue;
    const tag = tileset.terrainTags?.[id] || 0;
    if (tag === 13) continue; // Neutral: no cuenta para el paso
    if ((tileset.passages[id] || 0) & 0x0f) return false;
    if (!(tileset.priorities[id] || 0)) return true;
  }
  return true;
}

export function sealTreeTips(built, tileset, def = null) {
  const list = built?.treeTiles;
  if (!list?.length || !tileset?.passages) return 0;
  const W = built.width;
  const layers = built.layers;
  const live = (t) => layers[t.layer][t.i] === t.id;
  const body = new Set();
  for (const t of list) if (!t.tip && live(t)) body.add(t.i);
  const events = new Set();
  for (const e of def?.events || []) {
    if (Number.isInteger(e?.x) && Number.isInteger(e?.y)) events.add(e.x + e.y * W);
  }
  const twins = tileset.sealedTips?.map || {};
  let sealed = 0;
  for (const t of list) {
    if (!t.tip || !live(t)) continue;
    const above = t.i - W;
    const blocked = above < 0 || body.has(above) || events.has(above) || !walkable(layers, above, tileset);
    if (!blocked) continue;
    const twin = twins[t.id];
    if (twin) layers[t.layer][t.i] = twin; // misma punta, pasaje 0x0F (tools/tree_tips.mjs)
    else if (t.blocker && !layers[1][t.i] && t.layer !== 1) layers[1][t.i] = t.blocker;
    else continue;
    sealed++;
  }
  return sealed;
}
