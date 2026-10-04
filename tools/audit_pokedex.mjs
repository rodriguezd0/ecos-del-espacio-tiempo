// Obtención regional sobre MAPS efectivo, motor de evolución y crianza reales.
// node tools/audit_pokedex.mjs [--out=tools/cache/pokedex_obtainability] [--solo]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPokemon, evolutionTarget, speciesData } from '../game/src/battle/core/pokemon.js';
import { useItemOnPokemon } from '../game/src/ui/logic/fieldItems.js';
import { compatibility, emptyDaycare, generateEgg } from '../game/src/world/daycare.js';
import { normalizeEntry } from '../game/src/world/encounters.js';
import { GameState } from '../game/src/core/state.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[A-Z][A-Z0-9]*$/;
const keyOf = (sp, form = 0) => `${sp}:${form}`;
const pages = e => [e, ...(e.pages || [])];
const scripts = e => pages(e).filter(p => typeof p.script === 'function').map(p => p.script);
const production = id => typeof id === 'string' && !id.startsWith('dev');
const readData = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'game/data', name), 'utf8'));
const supportedEvolutionMethods = () => new Set([...String(evolutionTarget).matchAll(/case '([^']+)'/g)].map(m => m[1]));

export async function loadRegisteredMaps(registry) {
  if (!registry || typeof registry !== 'object') throw new Error('Registro de mapas inválido');
  const maps = [];
  for (const [id, load] of Object.entries(registry)) {
    if (!production(id)) continue;
    if (typeof load !== 'function') throw new Error(`Importador inválido de ${id}`);
    const def = (await load()).default;
    if (!def || def.id !== id) throw new Error(`Definición registrada inválida: ${id}`);
    maps.push(def);
  }
  return maps;
}

export function collectWildMethods(maps, db) {
  const out = [];
  for (const def of maps) {
    if (!production(def.id)) continue;
    const tables = [{ tables: def.encounters, zone: null }, ...(def.encounterZones || []).map((z, i) => ({ tables: z.encounters, zone: i }))];
    for (const { tables: enc, zone } of tables) for (const [type, rows] of Object.entries(enc || {})) {
      if (!/^(grass|cave|water|fish_old|fish_good|fish_super)(Morning|Afternoon|Evening|Day|Night)?$/.test(type) || !Array.isArray(rows)) continue;
      const base = type.startsWith('fish_') ? type : type.match(/^(grass|cave|water)/)[0];
      if (!type.startsWith('fish_') && enc.stepChance?.[base] === 0) continue;
      for (const raw of rows) {
        const weight = Array.isArray(raw) ? Number(raw[0]) : raw?.weight ?? 1;
        if (!(weight > 0)) continue;
        const e = normalizeEntry(raw);
        if (!ID.test(e.species) || !Object.hasOwn(db.species, e.species) || !Number.isFinite(e.min) || e.min < 1 || e.max > 100) throw new Error(`Encuentro inválido: ${def.id}/${type}`);
        out.push({ species: e.species, form: e.form, kind: type.startsWith('fish_') ? 'fishing' : 'wild', map: def.id, table: type, zone, levels: [e.min, e.max], source: `MAPS:${def.id}.encounters` });
      }
    }
  }
  return out;
}

function validateAudit({ db, dex, maps, methods, resources }) {
  if (!db?.species || !Array.isArray(dex) || !Array.isArray(maps) || !Array.isArray(methods) || !Array.isArray(resources)) throw new Error('Datos de auditoría inválidos');
  const ids = new Set();
  for (const e of dex) {
    if (!ID.test(e?.id) || !Object.hasOwn(db.species, e.id)) throw new Error(`Especie/ID inválido: ${e?.id}`);
    if (ids.has(e.id)) throw new Error(`Especie duplicada: ${e.id}`);
    ids.add(e.id);
  }
  const mapIds = maps.filter(m => production(m.id)).map(m => m.id);
  if (new Set(mapIds).size !== mapIds.length) throw new Error('Mapas duplicados');
  return new Set(mapIds);
}

function acceptedMethod(m, db, mapIds) {
  if (!ID.test(m?.species) || !Object.hasOwn(db.species, m.species) || !mapIds.has(m.map)) return false;
  if (!['wild', 'fishing', 'capture', 'gift', 'egg', 'fossil', 'assembly'].includes(m.kind)) return false;
  if (m.request && (m.request.type !== 'wild' || m.request.rules?.canCatch === false || m.request.exhibition || m.request.rules?.exhibition)) return false;
  return Number.isInteger(m.form ?? 0) && (m.form ?? 0) >= 0;
}

function register(reached, m) {
  const key = keyOf(m.species, m.form);
  const old = reached.get(key);
  const signature = JSON.stringify(m);
  if (old?.methods.some(x => JSON.stringify(x) === signature)) return false;
  reached.set(key, { species: m.species, form: m.form || 0, methods: [...(old?.methods || []), m] });
  return !old;
}

function evolutionCandidate(db, from, form, target, method, param, resources, allowTrade) {
  const sp = speciesData(db, from, form);
  const resource = /^(Item|ItemMale|ItemFemale|HoldItem|DayHoldItem|NightHoldItem|TradeItem)$/.test(method) ? param : null;
  const basic = { kind: 'evolution', species: target, form: 0, from, fromForm: form, method, param, resource, source: `species.json:${from}:${form}.evolutions` };
  if (resource && !resources.has(resource)) return { blocked: { ...basic, reason: 'missing_item' } };
  if (!supportedEvolutionMethods().has(method)) return { blocked: { ...basic, reason: 'unsupported_method' } };
  if (method.startsWith('Trade') && !allowTrade) return { blocked: { ...basic, reason: 'requires_online' } };
  const gender = method.endsWith('Female') ? 'F' : method.endsWith('Male') ? 'M' : sp.genderRatio === 'AlwaysFemale' ? 'F' : 'M';
  const personality = method === 'Silcoon' ? 0 : method === 'Cascoon' ? 0x00050000 : undefined;
  const p = createPokemon(db, from, Math.min(100, Math.max(2, Number(param) || 50)), { form, gender, rng: () => 0.5, personality });
  const pokemon = { ...p, happiness: method.startsWith('Happiness') ? 255 : 0, heldItem: resource, moves: method === 'HasMove' ? [{ id: param, pp: 1, ppUps: 0 }] : p.moves };
  const ctx = { trigger: method.startsWith('Item') ? 'item' : method.startsWith('Trade') ? 'trade' : 'level', item: param, isDay: !(method.endsWith('Night') || method.startsWith('Night')) };
  const actual = ctx.trigger === 'item' ? useItemOnPokemon(db, param, pokemon, { isDay: ctx.isDay }).evolveTo : evolutionTarget(db, pokemon, ctx);
  return actual === target ? { method: { ...basic, ...(ctx.trigger === 'trade' ? { requiresOnline: true } : {}) } } : { blocked: { ...basic, reason: 'engine_rejects' } };
}

function evolutionEdges(db, reached, resources, allowTrade) {
  const out = [], blocked = [];
  for (const node of reached.values()) for (const [target, method, param] of speciesData(db, node.species, node.form).evolutions || []) {
    if (!Object.hasOwn(db.species, target) || method === 'None') continue;
    const result = evolutionCandidate(db, node.species, node.form, target, method, param, resources, allowTrade);
    if (result.method) out.push(result.method); else blocked.push(result.blocked);
  }
  return { out, blocked };
}

function breedWith(db, a, b, resourceIds) {
  const options = { rng: () => 0.5, metMap: 'lumina_guarderia', ot: { name: 'Auditoría', id: 1 } };
  const make = (node, gender) => createPokemon(db, node.species, 50, { form: node.form, gender, rng: () => 0.5 });
  const out = [];
  for (const genders of [['F', 'M'], ['M', 'F']]) {
    const first = make(a, genders[0]), second = make(b, genders[1]);
    const pa = speciesData(db, first.species, first.form).genderRatio === 'Genderless' ? { ...first, gender: null } : first;
    const pb = speciesData(db, second.species, second.form).genderRatio === 'Genderless' ? { ...second, gender: null } : second;
    const dc = { ...emptyDaycare(), slots: [{ pokemon: pa }, { pokemon: pb }] };
    if (!compatibility(db, dc)) continue;
    for (const withStone of resourceIds.has('EVERSTONE') ? [false, true] : [false]) {
      const egg = generateEgg(db, withStone ? { ...pa, heldItem: 'EVERSTONE' } : pa, pb, options);
      out.push({ kind: 'breeding', species: egg.species, form: egg.form, parents: [a.species, b.species], parentForms: [a.form, b.form], source: 'world/daycare.js:compatibility + generateEgg', ...(withStone ? { resource: 'EVERSTONE' } : {}) });
    }
  }
  return out;
}

function breedingEdges(db, reached, resources) {
  const nodes = [...reached.values()], ditto = nodes.find(n => n.species === 'DITTO'), out = [];
  for (const node of nodes) {
    if (ditto && node !== ditto) out.push(...breedWith(db, node, ditto, resources));
    const sp = speciesData(db, node.species, node.form);
    if (!['AlwaysMale', 'AlwaysFemale', 'Genderless'].includes(sp.genderRatio)) out.push(...breedWith(db, node, node, resources));
  }
  return out;
}

export function auditObtainability({ db, dex, maps, methods = [], resources = [], daycare = false, allowTrade = false }) {
  const mapIds = validateAudit({ db, dex, maps, methods, resources });
  const itemSources = resources.filter(r => ID.test(r?.id) && Object.hasOwn(db.items, r.id) && mapIds.has(r.map));
  const itemIds = new Set(itemSources.map(r => r.id));
  const reached = new Map(), blockedSeeds = [];
  for (const m of [...collectWildMethods(maps, db), ...methods]) {
    if (!acceptedMethod(m, db, mapIds)) continue;
    const missing = (m.requires || []).filter(id => !itemIds.has(id));
    if (missing.length) { blockedSeeds.push({ ...m, reason: 'missing_item', resource: missing[0] }); continue; }
    register(reached, { ...m, form: m.form || 0 });
  }
  let blocked = [];
  for (let round = 0; round <= Object.keys(db.species).length; round++) {
    const edges = evolutionEdges(db, reached, itemIds, allowTrade);
    blocked = edges.blocked;
    const added = [...edges.out, ...(daycare ? breedingEdges(db, reached, itemIds) : [])].map(m => register(reached, m)).some(Boolean);
    if (!added) break;
  }
  const rows = dex.map(e => {
    const nodes = [...reached.values()].filter(n => n.species === e.id);
    return { ...e, status: nodes.length ? 'obtainable' : 'missing', methods: nodes.flatMap(n => n.methods), blocked: [...blockedSeeds, ...blocked].filter(b => b.species === e.id) };
  });
  const missing = rows.filter(e => e.status === 'missing');
  return { summary: { total: rows.length, obtainable: rows.length - missing.length, missing: missing.length, registeredMaps: mapIds.size, daycare, allowTrade }, rows, missing, itemSources, reachableForms: [...reached.keys()] };
}

export function renderReport(report) {
  const s = report.summary;
  const lines = ['# Auditoría de obtención de la Pokédex', '', `${s.obtainable}/${s.total} especies con método conectado; ${s.missing} sin método demostrado. Mapas de producción registrados: ${s.registeredMaps}.`, '',
    'Se excluyen mapas de desarrollo, equipos de entrenadores, exhibiciones y combates sin captura. Evoluciones y huevos se comprueban con el motor real; los objetos requieren una fuente jugable.', '', '## Especies sin método demostrado', '', '| Especie | Obstáculo |', '|---|---|'];
  for (const e of report.missing) lines.push(`| ${e.id} | ${e.blocked.map(b => `${b.from || b.map}: ${b.method || b.kind} → ${b.reason}${b.resource ? ' (' + b.resource + ')' : ''}`).join('; ') || 'Sin captura, regalo, huevo o evolución conectada'} |`);
  lines.push('', '## Evidencia por especie', '', '| N.º | Especie | Estado | Métodos |', '|---|---|---|---|');
  for (const e of report.rows) lines.push(`| ${e.n} | ${e.id} | ${e.status} | ${[...new Set(e.methods.map(m => `${m.kind}: ${m.map || m.from || m.parents?.join(' + ')}${m.eventId ? ' / ' + m.eventId : ''}${m.requiresOnline ? ' (online)' : ''}`))].join('; ')} |`);
  return lines.join('\n') + '\n';
}

// Cada adaptador exige evento + guion concretos en MAPS efectivo. Las peticiones
// proceden de las mismas factorías que consume ese guion, incluidas sus reglas.
function bindRequest(out, maps, match, request, source) {
  for (const def of maps.filter(m => production(m.id))) for (const event of def.events || []) {
    if (!match(def, event)) continue;
    const spec = request.wild;
    if (!spec || request.type !== 'wild' || request.rules?.canCatch === false || request.exhibition) continue;
    out.push({ kind: 'capture', species: spec.species, form: spec.form || 0, levels: [spec.level, spec.level], map: def.id, eventId: event.id, request, source });
  }
}
const hasScript = (event, marker) => scripts(event).some(fn => marker.test(String(fn)));
const eventMatch = (map, id, marker) => (def, e) => def.id === map && e.id === id && hasScript(e, marker);

async function legendMethods(maps, db, state) {
  const out = [];
  const [b, c, cEnc, a, d, e, eEnc, dlc, hoopa, p9] = await Promise.all([
    import('../game/src/content/events/b22b_common.js'), import('../game/src/content/events/b22c_common.js'),
    import('../game/src/content/events/b22c_encounters.js'), import('../game/src/content/events/b22a_legends.js'),
    import('../game/src/content/events/b22d_battle.js'), import('../game/src/content/events/b22e_grieta_logic.js'),
    import('../game/src/content/events/b22e_grieta_battle.js'), import('../game/src/content/events/b24_conditions.js'),
    import('../game/src/content/events/b23_hoopa.js'), import('../game/src/content/events/b18_nucleo.js'),
  ]);
  for (const key of Object.keys(b.LEGENDS)) bindRequest(out, maps, (_, ev) => ev.id === `b22b_${key}` && hasScript(ev, /legendFight/), b.encounterRequest(key), 'events/b22b_common.js:encounterRequest');
  for (const key of Object.keys(c.LEGENDS)) bindRequest(out, maps, (_, ev) => new RegExp(`^b22c_(?:reflejo_)?${key}(?:_[0-9]+)?$`).test(ev.id) && hasScript(ev, /fightLegend/), cEnc.requestFor(key), 'events/b22c_encounters.js:requestFor');
  for (const p of e.PARADOXES) bindRequest(out, maps, eventMatch('grieta_porvenir', `b22e_${p.key}`, /paradoxBattle/), eEnc.paradoxRequest(p.key), 'events/b22e_grieta_battle.js:paradoxRequest');
  for (const sp of Object.keys(dlc.LEGENDS)) bindRequest(out, maps, (_, ev) => ev.id === `dlc2_${sp.toLowerCase()}` && hasScript(ev, /legendFight/), dlc.encounterRequest(sp), 'events/b24_conditions.js:encounterRequest');
  const fixed = [
    ['distorsion_corazon', 'b22a_giratina', /giratinaTalk/, a.giratinaRequest()],
    ...['DIALGA', 'PALKIA'].map(choice => ['camara_cruce_nucleo', 'nucleo_p9', /fightChosen/, p9.boundRequest(choice)]),
    ...['DIALGA', 'PALKIA'].map(choice => ['columna_lanza', `b22a_plataforma_${a.OTHER[choice].toLowerCase()}`, /platformScript/, a.unchosenRequest(choice)]),
    ['columna_lanza', 'b21_arceus', /arceusRematch/, a.arceusRematchRequest(db)],
    ['santuario_alma', 'uxie', /uxieScript/, a.trioRequest('uxie')],
    ['santuario_alma_sentir', 'mesprit_pregunta', /mespritQuestion/, a.trioRequest('mesprit')],
    ['santuario_alma_querer', 'azelf', /azelfScript/, a.trioRequest('azelf')],
    ['torre_crisol', 'b23_hoopa', /hoopaFight/, hoopa.hoopaRequest({ flag: () => true, itemCount: () => 1 })],
  ];
  for (const [map, id, marker, request] of fixed) bindRequest(out, maps, eventMatch(map, id, marker), request, 'events:factoría de captura registrada');
  const modules = [['regirock','regirock'], ['regice','regice'], ['registeel','registeel'], ['regigigas','regigigas'], ['heatran','heatran'], ['suenos','darkrai'], ['suenos','cresselia'], ['cierzo','mewtwo'], ['marshadow','marshadow']];
  for (const [file, key] of modules) {
    const mod = await import(`../game/src/content/events/b22d_${file}.js`);
    bindRequest(out, maps, (_, ev) => ev.id === key && hasScript(ev, /legendBattle/), d.legendRequest(mod[`${key.toUpperCase()}_SPEC`]), `events/b22d_${file}.js:${key.toUpperCase()}_SPEC + legendRequest`);
  }
  return out;
}

function bindTable(out, maps, map, idPattern, marker, table, source, extra = {}) {
  for (const def of maps.filter(d => d.id === map)) for (const ev of def.events || []) {
    if (!idPattern.test(ev.id) || !hasScript(ev, marker)) continue;
    for (const method of collectWildMethods([{ id: def.id, encounters: { grass: table } }], extra.db)) out.push({ ...method, ...extra, db: undefined, eventId: ev.id, source });
  }
}

async function specialMethods(maps, db, state) {
  const out = [];
  const [b3,b5,b6,b9a,b9b,b10,b14,zyg] = await Promise.all(['b03','b05','b06','b09a','b09b','b10','b14'].map(id => import(`../game/src/content/encounters/${id}.js`)).concat(import('../game/src/content/events/b21_zygarde.js')));
  const tables = [
    ['ruta_2', /^arbol_miel$/, /wildBattle/, b3.RUTA_2_HONEY, 'b03:RUTA_2_HONEY', ['HONEY']],
    ['ruta_4', /^arbol_miel$/, /wildBattle/, b5.RUTA_4_HONEY, 'b05:RUTA_4_HONEY', ['HONEY']],
    ['ruta_4', /^hierba_agitada_/, /wildBattle/, b5.RUTA_4_RUSTLE, 'b05:RUTA_4_RUSTLE', []],
    ['ruta_7', /^hierba_agitada_/, /wildBattle/, b9a.RUTA_7_RUSTLE, 'b09a:RUTA_7_RUSTLE', []],
    ['ruta_14_reserva', /^arbol_miel$/, /wildBattle/, b9a.RESERVA_HONEY, 'b09a:RESERVA_HONEY', ['HONEY']],
    ['aldea_mnemos', /^arbol_miel$/, /wildBattle/, b10.MNEMOS_HONEY, 'b10:MNEMOS_HONEY', ['HONEY']],
    ...['caleta_sonda','ruta_15'].map(map => [map, /^binacle_/, /wildBattle/, b9b.COAST_ROCKS, 'b09b:COAST_ROCKS', []]),
    ['ruta_8_marisma', /^lluvia_juncal$/, /MARISMA_GRASS_RAIN/, b9b.MARISMA_GRASS_RAIN, 'b09b:MARISMA_GRASS_RAIN (lluvia)', []],
  ];
  for (const [map, ids, marker, table, source, requires] of tables) bindTable(out, maps, map, ids, marker, table, source, { db, requires });
  for (const [map,id,marker,spec] of [
    ['meseta_impulso','cyclizar',/wildBattle/,b6.CYCLIZAR], ['ruta_14_reserva','applin',/wildBattle/,b9a.APPLIN],
    ['aldea_mnemos','losa_olvido',/wildBattle/,b10.SPIRITOMB], ['fosa_eco','bramaluna_real',/realFight/,b14.BRAMALUNA_REAL],
    ['ruinas_talasa','ditto_talasa',/dittoBattle/,{species:'DITTO',level:65}],
  ]) bindRequest(out, maps, eventMatch(map,id,marker), {type:'wild',wild:{...spec}}, `encounters:${map}/${id} (guion de captura)`);
  for (const def of maps.filter(d => typeof d.fishingAt === 'function' && production(d.id))) {
    const seen = new Set();
    for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) {
      const enc = def.fishingAt(state,x,y);
      if (!enc) continue;
      const signature = JSON.stringify(enc);
      if (seen.has(signature)) continue;
      seen.add(signature);
      out.push(...collectWildMethods([{id:def.id,encounters:enc}],db).map(m => ({...m,at:{x,y},source:`MAPS:${def.id}.fishingAt(state,${x},${y})`})));
    }
  }
  const teamZyg = zyg.createTeamZygarde(db,state,{rng:()=>0.5});
  for (const def of maps.filter(d=>d.id==='columna_lanza')) for (const ev of def.events || []) if (/^b21_pregunta_/.test(ev.id) && hasScript(ev,/captureZygarde/)) out.push({kind:'assembly',species:teamZyg.species,form:teamZyg.form,map:def.id,eventId:ev.id,source:'events/b21_zygarde.js:createTeamZygarde + captureZygarde'});
  return out;
}

function giftMethods(maps) {
  const out = [];
  for (const def of maps.filter(d => production(d.id))) for (const ev of def.events || []) for (const fn of scripts(ev)) {
    for (const match of String(fn).matchAll(/\.givePokemon\(\s*\{\s*species:\s*['"]([A-Z][A-Z0-9]*)['"]/g)) out.push({kind:'gift',species:match[1],form:0,map:def.id,eventId:ev.id,source:`MAPS:${def.id}/${ev.id}:givePokemon literal`});
  }
  const helpers = [
    ['mnemos_casa_te', /^sabina$/, /sinisteaGift/, 'SINISTEA', 'gift', 'b10_notes.js:sinisteaGift'],
    ['casa_prota_1f', /^b11_huevo$/, /giveEgg/, 'TOGEPI', 'egg', 'b11_home.js:giveEgg'],
    ['b24_cuna_coral', /^dlc2_cuna$/, /collectManaphy/, 'MANAPHY', 'egg', 'b24_actions.js:collectManaphy'],
    ['b24_crater_lucero', /^dlc2_rescate_cosmog$/, /rescueCosmog/, 'COSMOG', 'gift', 'b24_actions.js:rescueCosmog'],
  ];
  for (const [map,ids,marker,species,kind,source] of helpers) for (const def of maps.filter(m=>m.id===map)) for(const ev of def.events||[]) if(ids.test(ev.id) && hasScript(ev,marker)) out.push({kind,species:species||ev.id.replace('bola_',''),form:0,map,eventId:ev.id,source});
  for (const def of maps.filter(m=>m.id==='lumina_museo')) for (const ev of def.events||[]) if(ev.id==='paleontologo' && hasScript(ev,/reviveFossil/)) for(const [species,item]of[['CRANIDOS','SKULLFOSSIL'],['SHIELDON','ARMORFOSSIL']]) out.push({kind:'fossil',species,form:0,map:def.id,eventId:ev.id,requires:[item],source:'events/b09a_museo.js:FOSSILS + reviveFossil'});
  return out;
}

async function starterMethods(maps,state) {
  const { STARTERS, ADVANTAGE, unchosenStarter } = await import('../game/src/content/events/b04_common.js');
  const { gaelEggSpecies } = await import('../game/src/content/events/b21_epilogo.js');
  const chosen = STARTERS.includes(state.var('starter')) ? state.var('starter') : STARTERS[0];
  const witness = {var:(key,fallback)=>key==='starter'?chosen:key==='gael_starter'?ADVANTAGE[chosen]:state.var(key,fallback)};
  const routes = [
    ['laboratorio_alerce', `bola_${chosen}`, /pick\(ctx/, chosen, 'gift', 'b01_town_lab.js:chooseStarter'],
    ['ciudad_caudal','b04_gracias_plaza',/thanksScene/,unchosenStarter(witness),'gift','b04_caudal.js:givenStarter + unchosenStarter'],
    ['casa_gael','b21_nota_gael',/giveGaelEgg/,gaelEggSpecies(witness),'egg','b21_epilogo.js:giveGaelEgg + gaelEggSpecies'],
  ];
  const out=[];
  for(const [map,id,marker,species,kind,source] of routes) for(const def of maps.filter(m=>m.id===map)) for(const ev of def.events||[]) if(ev.id===id&&hasScript(ev,marker))out.push({kind,species,form:0,map,eventId:id,source,initialChoice:chosen});
  return out;
}

export async function collectScriptedMethods(maps, db, { state = GameState.create({name:'Auditoría'}) } = {}) {
  return [...await legendMethods(maps,db,state), ...await specialMethods(maps,db,state), ...giftMethods(maps), ...await starterMethods(maps,state)];
}

export async function collectItemSources(maps, db) {
  const out = [], valid = id => ID.test(id) && Object.hasOwn(db.items,id);
  for (const def of maps.filter(m=>production(m.id))) for (const ev of def.events || []) {
    if (ev.type === 'item' && valid(ev.item)) out.push({id:ev.item,map:def.id,eventId:ev.id,source:'Evento de objeto recogible'});
    for (const fn of scripts(ev)) {
      for (const m of String(fn).matchAll(/\.giveItem\(\s*['"]([A-Z][A-Z0-9]*)['"]/g)) if(valid(m[1])) out.push({id:m[1],map:def.id,eventId:ev.id,source:'Guion registrado: giveItem literal'});
      if (!/openMart\(ctx, shop\)/.test(String(fn))) continue;
      await fn({state:{flag:()=>true},say:async()=>{},ui:{openShop:async stock=>{for(const id of stock)if(valid(id))out.push({id,map:def.id,eventId:ev.id,source:'Dependiente registrado: openShop(stock) real'});}}});
    }
  }
  return out;
}

export async function runAudit({ registry, db, dex, allowTrade = false }) {
  const maps = await loadRegisteredMaps(registry);
  const [methods, resources] = await Promise.all([collectScriptedMethods(maps,db),collectItemSources(maps,db)]);
  const daycare = maps.some(m=>m.id==='lumina_guarderia' && (m.events||[]).some(e=>e.id==='criadora'&&hasScript(e,/runDaycare/)));
  return auditObtainability({db,dex,maps,methods,resources,daycare,allowTrade});
}

export async function main(args = process.argv.slice(2)) {
  const output = args.find(s=>s.startsWith('--out='))?.slice(6) || 'tools/cache/pokedex_obtainability';
  const target = path.resolve(ROOT,output), cache = path.join(ROOT,'tools','cache');
  if (!target.startsWith(cache+path.sep) || path.basename(target)==='') throw new Error('La salida debe estar dentro de tools/cache');
  if(args.some(s=>s!=='--solo'&&!s.startsWith('--out=')))throw new Error('Opción desconocida del auditor');
  const { MAPS } = await import('../game/src/content/maps/index.js');
  const db = { species:readData('species.json'), moves:readData('moves.json'), types:readData('types.json'), abilities:readData('abilities.json'), items:{...readData('items.json'),...readData('items_axis.json')} };
  const report = await runAudit({registry:MAPS,db,dex:readData('dex_axis.json').entries,allowTrade:!args.includes('--solo')});
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target+'.json',JSON.stringify(report,null,2)+'\n','utf8');
  fs.writeFileSync(target+'.md',renderReport(report),'utf8');
  console.log(JSON.stringify(report.summary));
  if(report.missing.length)console.log('Sin método demostrado: '+report.missing.map(r=>r.id).join(', '));
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch(err=>{console.error(err.message);process.exitCode=1;});
