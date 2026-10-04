// Piloto de decisiones sobre el motor real. El equipo de Rayquaza recupera las capturas reales del PC.
import { installB22dHelpers } from './e2e_b22d_page.mjs';

export async function installB22cHelpers(page, opts = {}) {
  await installB22dHelpers(page, opts);
  await page.evaluate(async () => {
    const { Autopilot } = await import('/src/battle/scene/autopilot.js');
    const { engine } = await import('/src/core/engine.js');
    const { stormActive } = await import('/src/world/rest.js');
    const s = engine.state, base = window.__b22d, action = Autopilot.prototype.action;
    Autopilot.prototype.action = function (battler, ctx, bag) {
      return ctx.wild && base.pilot.mode === 'run' ? 'run' : action.call(this, battler, ctx, bag);
    };
    const weatherParty = () => {
      base.combatTeam();
      for (const species of ['KYOGRE', 'GROUDON']) {
        const box = s.boxes.findIndex(b => b.some(p => p?.species === species));
        if (box < 0) throw new Error(`Falta la captura real de ${species}`);
        const slot = s.boxes[box].findIndex(p => p?.species === species), pokemon = s.boxes[box][slot];
        s.setBoxPokemon(box, slot, null); s.addPokemon(pokemon);
      }
      window.__map.refreshFollower?.(); window.__map.world.refreshEvents();
    };
    window.__b22c = { ...base, weatherParty, snap: () => ({ ...base.snap(), storm: stormActive(s),
      dive: window.__map.zygarde?.dive ? { segments: window.__map.zygarde.dive.meter?.segments } : null,
      party: s.party.map(p => ({ species: p.species, moves: p.moves.map(m => m.id), level: p.level })),
      visible: window.__map.world.events.filter(e => e.page && e.characterName).map(e => e.id),
    }) };
  });
}
