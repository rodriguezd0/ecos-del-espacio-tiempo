// Extracts text from a PDF preserving line breaks (groups items by y position).
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';

const [, , input, output] = process.argv;
const data = new Uint8Array(fs.readFileSync(input));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const out = [];
out.push(`# PAGES: ${doc.numPages}`);
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const lines = new Map();
  for (const it of tc.items) {
    if (!('str' in it)) continue;
    const y = Math.round(it.transform[5]);
    const x = it.transform[4];
    const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ x, s: it.str });
  }
  const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
  out.push(`\n===== PAGE ${p} =====`);
  for (const [, items] of sorted) {
    items.sort((a, b) => a.x - b.x);
    const text = items.map((i) => i.s).join('').replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
}
fs.writeFileSync(output, out.join('\n'), 'utf8');
console.log(`pages=${doc.numPages} chars=${out.join('\n').length}`);
