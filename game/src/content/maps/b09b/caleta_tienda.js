// Tienda de pesca de Caleta Sonda (docs/CAMPANA.md B09 paso 5: «Tienda de pesca: Supercaña»; X17). Vende las Balls
// útiles junto al agua (services/shop.js, tabla `fishing`) y el viejo pescador de la trastienda regala la Supercaña.
import { shopMap } from '../../services/shop.js';
import { BUILDINGS } from './caleta_layout.js';
import { F, SPRITE, lines } from '../../events/b09b_common.js';

const door = BUILDINGS.tienda.door;

export const SUPERROD_TEXT = Object.freeze({
  intro: [
    'Una caña no se compra: se gana. Eso decía mi padre, que fundó esta tienda.',
    'Tú tienes cara de haber pescado desde la Marisma hasta el muelle de Nexo. ¿A que sí?',
    'Toma. Con esta, lo que pica ya no es un pez cualquiera.',
  ],
  after: [
    'Con la Supercaña, desde el muelle de buzos pican hasta Gyarados. Y si tienes suerte, algún Dondozo.',
  ],
});

async function superRodTalk(ctx) {
  if (ctx.flag(F.superRod)) { await lines(ctx, 'Pescador veterano', SUPERROD_TEXT.after); return; }
  await lines(ctx, 'Pescador veterano', SUPERROD_TEXT.intro);
  await ctx.giveItem('SUPERROD', 1);
  ctx.setFlag(F.superRod);
  await lines(ctx, 'Pescador veterano', SUPERROD_TEXT.after);
}

export default shopMap({
  id: 'caleta_tienda',
  exit: { map: 'caleta_sonda', x: door.x, y: door.y + 1 },
  list: 'fishing',
  greeting: 'Tienda de pesca de Caleta. Aquí las Balls saben nadar.',
  events: [
    { id: 'pescador_supercana', x: 3, y: 6, name: 'Pescador veterano', sprite: SPRITE.fisher, dir: 6, move: 'look', script: superRodTalk },
  ],
});
