// Hojas de contacto a escala de juego, métricas y comparación opcional con PNG anteriores.
// node tools/review_battle_art.mjs [--before=carpeta] [--out=tools/cache/arte-final]
import fs from 'node:fs';
import path from 'node:path';
import { Img } from './pixel.mjs';
import { drawText } from './stamps_font.mjs';
import { CHARACTERS } from './pixel_chars/roster.mjs';

const arg = (name, fallback = null) => process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const out = arg('out', 'tools/cache/arte-final');
const before = arg('before');
fs.mkdirSync(out, { recursive: true });
const fronts = CHARACTERS.flatMap((c) => c.sheets.filter((s) => s.kind === 'battle_front'));
const backs = CHARACTERS.flatMap((c) => c.sheets.filter((s) => s.kind === 'battle_back'));
const labels = (image) => ({ width: image.w, height: image.h, data: image.data });
const background = [232, 226, 204, 255];
const ink = [24, 24, 32, 255];
const metrics = (image) => {
  const bounds = image.bbox();
  let opaque = 0;
  for (let y = 0; y < image.h; y++) for (let x = 0; x < image.w; x++) if (image.alpha(x, y)) opaque++;
  return { bounds, colors: image.colors().length, fill: Number((opaque / (bounds.w * bounds.h)).toFixed(3)) };
};
const entries = fronts.map((s) => ({ id: s.id, image: s.build().scale(2) }));
for (const id of ['CHICO', 'CAZABICHOS', 'CIENTIFICO']) entries.push({ id: `anil:${id}`, image: Img.load(`Pokemon Anil V4.13/Graphics/Trainers/${id}.png`) });
const cellW = before ? 320 : 160;
const contact = new Img(cellW * 4, Math.ceil(entries.length / 4) * 192).fill(background);
const records = [];
entries.forEach(({ id, image }, i) => {
  const x = i % 4 * cellW;
  const y = Math.floor(i / 4) * 192;
  const oldFile = before && !id.startsWith('anil:') ? path.join(before, `${id}.png`) : null;
  if (oldFile && fs.existsSync(oldFile)) {
    const old = Img.load(oldFile);
    contact.blit(old, x, y + 16);
    drawText(labels(contact), x + 6, y + 179, 'ANTERIOR', ink);
    records.push({ id, before: metrics(old), after: metrics(image) });
  } else records.push({ id, after: metrics(image) });
  const ix = x + (before ? 160 : 0);
  contact.blit(image, ix, y + 16);
  drawText(labels(contact), x + 6, y + 4, id.replace('_front', ''), ink);
  drawText(labels(contact), ix + 6, y + 179, id.startsWith('anil:') ? 'REFERENCIA ANIL' : 'POSE REVISADA', ink);
});
contact.save(path.join(out, 'fronts.png'));
const backReview = new Img(800, backs.length * (before ? 360 : 180)).fill(background);
backs.forEach((s, i) => {
  const y = i * (before ? 360 : 180);
  drawText(labels(backReview), 6, y + 4, s.id, ink);
  if (before) backReview.blit(Img.load(path.join(before, `${s.id}.png`)), 0, y + 16);
  backReview.blit(s.build().scale(2), 0, y + (before ? 196 : 16));
});
backReview.save(path.join(out, 'backs.png'));
fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(records, null, 2) + '\n');
console.log(`13 frontales, 2 lanzamientos y 3 referencias de Añil: ${out}`);
