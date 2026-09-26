// Ayudantes que tools/e2e_b02.mjs instala DENTRO de la página: los de tools/e2e_b01_page.mjs (estado resumido,
// rutas a pie, transcripción de diálogos y piloto automático de combate) más consultas del Bloque 2 (objetos
// clave, pistas, forma de Zygarde, variables, eventos) y cambio de equipo para probar el reintento sin pérdida.
import { installHelpers } from './e2e_b01_page.mjs';

export async function installB02Helpers(page) {
  await installHelpers(page);
  await page.evaluate(async () => {
    const [{ engine }, { createPokemon }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/core/pokemon.js'),
    ]);
    const map = () => window.__map;
    Object.assign(window.__e2e, {
      /** Resumen del Bloque 2. */
      b02() {
        const st = engine.state;
        if (!st) return {}; // aún cargando (título/arranque)
        const z = st?.data?.zygarde || {};
        return {
          keyItems: ['ZYGARDECUBE', 'CLUENOTEBOOK', 'AZUREFRAGMENT', 'ESCAPEROPE'].filter((k) => st.hasKeyItem(k) || st.itemCount(k) > 0),
          potions: st.itemCount('POTION'),
          fragments: [...(st.data.fragments || [])],
          clues: (st.clues || []).map((c) => `${c.id}:${c.status || (c.solved ? 'solved' : 'active')}`),
          form: z.form || null,
          run: Boolean(z.abilities?.run),
          room: st.var('b02_casilda_sala', 0),
          hour: st.hour,
          party: st.party.map((p) => `${p.species}:${p.level}:${p.hp}`),
          healPoint: st.healPoint,
          stones: ['piedra_alba', 'piedra_agua', 'piedra_entrada'].map((id) => st.var(`b02_${id}`, 8)),
        };
      },
      /** Evento del mapa actual: posición, página y si está borrado. */
      eventInfo(id) {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, page: ev.pageIndex, erased: ev.erased, sprite: ev.characterName } : null;
      },
      /** Sustituye el equipo (p. ej. 'MAGIKARP:2' para perder a propósito, 'TURTWIG:16' para ganar). */
      setParty(spec) {
        const st = engine.state;
        const list = spec.split(',').map((s) => {
          const [sp, lv] = s.split(':');
          return createPokemon(engine.data, sp, Number(lv) || 5, { ot: { name: st.player.name, id: st.player.id } });
        });
        st.setParty(list);
        map()?.refreshFollower?.();
        return list.length;
      },
      /** Posición del Core de Zygarde. */
      corePos() {
        const c = map()?.world?.core;
        return c ? { x: c.x, y: c.y, visible: c.visible } : null;
      },
    });
  });
}
