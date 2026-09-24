// Paletas del elenco de la campaña (CAMPANA §3 B02–B21, §5 Genesis, §6). PROVISIONALES (D30).
// Mismos símbolos que palettes.mjs; nuevos en cabezas: F/f barba · g/l gafas (montura/cristal) ·
// U/u/v/V gorra o casco · Y/y lámpara o guantes (según personaje) · X visor · i sombra del cristal.
// En cuerpos: M/m maletín · Y/y/Z capa corta o delantal secundario.
// Genesis (CAMPANA §5.1, biblia §13.6): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31 y
// magenta-violeta #B03A8C. NUNCA el verde de Zygarde.
import { SKIN_LIGHT, SKIN_MID, SKIN_TAN } from './palettes.mjs';

export const GENESIS = Object.freeze({
  petroleo: '#1F4E5A', clinico: '#F2F4F5', carbon: '#2B2D31', magenta: '#B03A8C',
});

const BATA = { L: '#FFFFFF', J: GENESIS.clinico, j: '#C8CED4', d: '#8A9098', C: GENESIS.clinico, c: '#C8CED4', x: '#8A9098' };
const CHARCOAL_LEGS = { P: '#3A3C42', p: '#26272C', Q: '#3A3C42', q: '#26272C', B: '#1A1A1E', b: '#0E0E12', W: '#3A3A44' };
const VERTICE_HEAD = {
  k: '#16161C', H: '#F4F4F8', h: '#C8CAD2', m: '#9A9CA8', n: '#686A78', ...SKIN_LIGHT,
  F: '#F0F0F4', f: '#C4C6D0', g: '#3A2A4A', l: '#A078C8',
};
const TECNICO_BODY = {
  U: '#2A6070', u: GENESIS.petroleo, v: '#163A44', V: '#0E262E', X: GENESIS.magenta, G: GENESIS.magenta,
  L: '#2E6878', J: GENESIS.petroleo, j: '#163A44', d: '#0E262E',
  C: GENESIS.clinico, c: '#D0D6DA', x: '#A0A8B0', T: GENESIS.clinico, t: '#D0D6DA',
  Y: '#3E4046', y: GENESIS.carbon, P: GENESIS.petroleo, p: '#163A44', Q: GENESIS.petroleo, q: '#163A44',
  B: GENESIS.carbon, b: '#1A1B1F', W: '#4A4C52', M: '#A8B0B8', m: '#6A727C',
};
const INVESTIGADOR_BODY = {
  ...BATA, G: GENESIS.magenta, g: GENESIS.carbon, l: '#D070B0', T: GENESIS.petroleo, t: '#163A44',
  P: GENESIS.petroleo, p: '#163A44', Q: GENESIS.petroleo, q: '#163A44', B: GENESIS.carbon, b: '#1A1B1F', W: '#4A4C52',
};

export const CAMPAIGN_PALETTES = {
  // Leandro Alcántara (38, orgullo), Maestre de Esclusas de Caudal: levita azul río con botones de
  // latón, camisa blanca, pantalón oscuro y botas de agua.
  leandro: {
    k: '#161A22', H: '#6A5448', h: '#4A382E', m: '#32241C', n: '#1E1410', ...SKIN_TAN, F: '#5A4034', f: '#3E2C22',
    L: '#5A8CC4', J: '#3A6AA4', j: '#28507E', d: '#183456', C: '#3A6AA4', c: '#28507E', x: '#183456',
    G: '#E8C050', T: '#F4F4EE', t: '#C8C8C0', P: '#3A3A48', p: '#26262F', Q: '#2E4E50', q: '#1E3436',
    B: '#2E4E50', b: '#1E3436', W: '#4E6E70',
  },
  // Abril Céspedes (19, tedio), Guardiana del Impulso: rubio ceniza revuelto por el viento, cortavientos
  // mostaza con capucha gris, auriculares cian al cuello, pantalón corto, mallas y zapatillas.
  abril: {
    k: '#1C1820', H: '#E6D8B0', h: '#C4B080', m: '#98845A', n: '#665838', ...SKIN_LIGHT,
    L: '#F2C850', J: '#D8A830', j: '#A87C1C', d: '#6E500E', G: '#58D0E0', T: '#D8DCE0', t: '#A8AEB4',
    P: '#6A7078', p: '#4A5058', Q: '#2E2C3A', q: '#1E1C28', B: '#F0F0F0', b: '#B8B8C0', W: '#D0D0D8',
  },
  // Fermín Galena (51, carga familiar), Guardián de la Masa: casco de minero ocre con lámpara, barba
  // canosa, chaqueta de faena gris plomo con banda reflectante, pantalón azul gastado y botas.
  fermin: {
    k: '#1A1816', H: '#8A8480', h: '#6A625C', m: '#4A4440', n: '#2E2A28', ...SKIN_TAN, F: '#B8B2AC', f: '#7E7872',
    U: '#E0B040', u: '#B88A20', v: '#7A5A10', Y: '#FFF4B0', y: '#C8B878',
    L: '#8A9098', J: '#6A7078', j: '#4E545C', d: '#34383E', G: '#F08030', T: '#E0E0D8', t: '#B0B0A8',
    P: '#4A5A78', p: '#34405A', Q: '#4A5A78', q: '#34405A', B: '#6A4A30', b: '#44301E', W: '#8A6A50',
  },
  // Olvido Arrieta (78, fascinación), Guardiana de la Memoria: moño bajo cano con un lápiz, gafas
  // redondas, rebeca sepia sobre blusa crema y falda larga granate.
  olvido: {
    k: '#1C1614', H: '#F4F4F8', h: '#D4D4DE', m: '#A8A8B8', n: '#747486', ...SKIN_LIGHT, g: '#6A4A30', l: '#E0F0F8',
    U: '#F0C040', L: '#D8A860', J: '#B88840', j: '#8A6428', d: '#5A4018', G: '#B88840', T: '#F4ECD8', t: '#D0C4A8',
    C: '#8A3A48', c: '#6A2A36', x: '#4A1A24', P: '#8A3A48', p: '#6A2A36', Q: '#4A3A38', q: '#2E2422',
    B: '#5A3A28', b: '#3A2418', W: '#7A5A48',
  },
  // Sol Galena, hija de Fermín (TABLILLAS T05): casco blanco con lámpara, trenza, chaqueta teja con
  // banda amarilla, pantalón gris y botas.
  sol: {
    k: '#1C1614', H: '#6A4430', h: '#4A2E20', m: '#321E14', n: '#1E120A', ...SKIN_MID,
    U: '#F4F4F0', u: '#CACAC4', v: '#8C8C88', Y: '#FFF4B0', y: '#C8B878',
    L: '#E88A4C', J: '#C86A30', j: '#984C20', d: '#603014', G: '#F8E048', T: '#F0F0E8', t: '#C0C0B8',
    P: '#5A5E68', p: '#3E424A', Q: '#5A5E68', q: '#3E424A', B: '#6A4A30', b: '#44301E', W: '#8A6A50',
  },
  // Molinero (Anselmo, 70, TABLILLAS T02): boina parda, bigote y cejas blancas, chaleco marrón,
  // camisa blanca y delantal enharinado.
  molinero: {
    k: '#1C1814', H: '#F2F2F4', h: '#CACAD4', m: '#9A9AAA', n: '#6A6A7A', ...SKIN_MID,
    U: '#8A7058', u: '#6A5440', v: '#4A3A2C', V: '#3A2C20',
    L: '#9A7454', J: '#7A5638', j: '#5A3E26', d: '#3A2818', G: '#7A5638', T: '#F4F0E4', t: '#CCC6B4',
    C: '#FAF6EC', c: '#E0D8C8', x: '#B0A690', P: '#6A5A48', p: '#4A3E30', Q: '#6A5A48', q: '#4A3E30',
    B: '#3A2A1E', b: '#241A12', W: '#5A4A3A',
  },
  // Buzo (Fausto y los buzos de Caleta Sonda): pelo mojado, gafas de buceo subidas a la frente y
  // traje de neopreno con franja cian.
  buzo: {
    k: '#101418', H: '#4A4A5E', h: '#2E2E3A', m: '#1E1E28', n: '#0A0A12', ...SKIN_TAN,
    U: '#243060', v: '#384070', l: '#8CE0F0', i: '#58B0D0',
    L: '#3A4A60', J: '#26303E', j: '#1A2230', d: '#10161E', G: '#38C8E8', T: '#26303E', t: '#1A2230',
    P: '#26303E', p: '#1A2230', Q: '#26303E', q: '#1A2230', B: '#1A2230', b: '#10161E', W: '#3A4A60',
  },
  // Enfermera de los Centros Pokémon de Axis: cofia blanca con banda rosa, moño castaño, uniforme rosa
  // pálido con delantal blanco (diseño propio, no el de Añil).
  enfermera: {
    k: '#1C1418', H: '#7A4A34', h: '#5A3424', m: '#3E2218', n: '#26140E', ...SKIN_LIGHT,
    U: '#FFFFFF', u: '#DCDCE4', v: '#F07898',
    L: '#F8C8D4', J: '#E8A0B4', j: '#C07890', d: '#8A4C62', G: '#E8A0B4', T: '#FFFFFF', t: '#D8D8E0',
    C: '#F8C8D4', c: '#E8A0B4', x: '#C07890', Y: '#FFFFFF', y: '#E0E0E8', Z: '#B8B8C4',
    P: '#F8C8D4', p: '#E8A0B4', Q: '#F4EEF0', q: '#D8D0D4', B: '#F4F4F8', b: '#C8C8D0', W: '#FFFFFF',
  },
  // Dependiente de tienda: camisa celeste, delantal azul marino, pantalón caqui.
  dependiente: {
    k: '#161820', H: '#3A3A48', h: '#24242E', m: '#16161E', n: '#0C0C12', ...SKIN_MID,
    L: '#A8D4F0', J: '#80B8E0', j: '#5890C0', d: '#386890', G: '#80B8E0', T: '#FFFFFF', t: '#D0D8E0',
    C: '#3A4A7A', c: '#2A365C', x: '#1A2240', P: '#C8B488', p: '#9C8860', Q: '#C8B488', q: '#9C8860',
    B: '#5A3E28', b: '#3A2818', W: '#7A5A40',
  },
  // Archivista (Archivo Hondo de Mnemos, museo): gafas redondas, chaleco sepia sobre camisa blanca.
  archivista: {
    k: '#1C1814', H: '#8A6440', h: '#664628', m: '#48301A', n: '#2E1E10', ...SKIN_LIGHT, g: '#3A3030', l: '#E8F0F8',
    L: '#B8986A', J: '#98784C', j: '#725834', d: '#4C3A20', G: '#98784C', T: '#F4F0E8', t: '#C8C0B4',
    P: '#4A3A30', p: '#342820', Q: '#4A3A30', q: '#342820', B: '#2A2020', b: '#181212', W: '#4A3E3A',
  },
  // Dr. Aurelio Vértice (63, D14): traje carbón con alfiler magenta, pelo plateado hacia atrás, barba
  // blanca corta y gafas redondas con tinte violeta.
  vertice: {
    ...VERTICE_HEAD, ...CHARCOAL_LEGS,
    L: '#5E626C', J: '#44474F', j: GENESIS.carbon, d: '#1A1B1F', G: GENESIS.magenta, T: GENESIS.clinico, t: '#C8CCD0',
  },
  // Vértice como Líder Supremo (Talasa, P9): bata blanca y capa corta carbón.
  vertice_lider: {
    ...VERTICE_HEAD, ...CHARCOAL_LEGS, ...BATA, G: GENESIS.magenta, T: GENESIS.carbon, t: '#1A1B1F',
    Y: '#44474F', y: GENESIS.carbon, Z: '#1A1B1F',
  },
  // Dra. Casia Varela (41, directora de Investigación): melena lisa con raya, bata blanca larga con
  // solapas carbón y ribete magenta, jersey carbón.
  casia: {
    k: '#18141C', H: '#4A3A5A', h: '#30243E', m: '#20182A', n: '#120C18', ...SKIN_LIGHT,
    ...BATA, d: GENESIS.carbon, x: GENESIS.magenta, G: GENESIS.magenta, T: GENESIS.carbon, t: '#1A1B1F',
    P: GENESIS.carbon, p: '#1A1B1F', Q: GENESIS.carbon, q: '#1A1B1F', B: '#3A2A3A', b: '#22181E', W: '#5A4A5A',
  },
  // Ulises Garrido (47, director de Operaciones, excapataz): pelo gris al rape, barba de días, bata de
  // director sobre ropa de trabajo carbón.
  garrido: {
    k: '#18181A', H: '#B4B4BC', h: '#8E8E98', m: '#6A6A74', n: '#46464E', ...SKIN_TAN, F: '#6A6A70', f: '#4A4A50',
    ...BATA, d: GENESIS.carbon, x: GENESIS.magenta, G: GENESIS.magenta, T: GENESIS.carbon, t: '#1A1B1F',
    P: '#34363C', p: '#22242A', Q: '#34363C', q: '#22242A', B: GENESIS.carbon, b: '#18191C', W: '#4A4C52',
  },
  // Técnicos de campo de Genesis: gorra y mono petróleo con visor magenta, peto blanco clínico con el
  // emblema, guantes y botas carbón, maletín de instrumentos.
  genesis_tecnico: {
    k: '#121A1E', H: '#4A3A30', h: '#32261E', m: '#221812', n: '#140E0A', ...SKIN_MID, ...TECNICO_BODY,
  },
  genesis_tecnica: {
    k: '#121A1E', H: '#7A3A2A', h: '#5A2A1E', m: '#3E1C14', n: '#26100A', ...SKIN_LIGHT, ...TECNICO_BODY,
  },
  // Investigadores de Genesis: bata corta blanca con el emblema sobre ropa petróleo y gafas-visor magenta.
  genesis_investigador: {
    k: '#141A1E', H: '#5A4A3C', h: '#3E3228', m: '#2A2018', n: '#18120E', ...SKIN_LIGHT, ...INVESTIGADOR_BODY,
  },
  genesis_investigadora: {
    k: '#141A1E', H: '#4A4660', h: '#2E2A3E', m: '#1E1A2A', n: '#100E18', ...SKIN_TAN, ...INVESTIGADOR_BODY,
  },
};
