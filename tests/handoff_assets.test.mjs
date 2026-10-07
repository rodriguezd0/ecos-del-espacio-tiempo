import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ARCHIVE_ROOT, REQUIRED_FILES, assertArchivePath, scanHandoffAssets,
  buildHandoffAssets, verifyHandoffAssets } from '../tools/package_handoff_assets.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'handoff-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('handoff-test-'));
    await fs.rm(temp, { recursive: true, force: true });
  });
  const sourceDir = path.join(temp, ARCHIVE_ROOT), outputDir = path.join(temp, 'output');
  async function put(relative, bytes = `fixture ${relative}`) {
    const target = path.join(sourceDir, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
    return target;
  }
  for (const relative of REQUIRED_FILES) await put(relative);
  await put('Graphics/Characters/niño actual.png');
  await put('Audio/SE/Door enter.wav');
  await put('Fonts/power green.ttf');
  return { temp, sourceDir, outputDir, put };
}

function mutateArchive(zipPath, entry, source = '') {
  const script = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
try {
  $zip = [System.IO.Compression.ZipFile]::Open($env:HANDOFF_TEST_ZIP, [System.IO.Compression.ZipArchiveMode]::Update)
  try {
    $old = $zip.GetEntry($env:HANDOFF_TEST_ENTRY)
    if ($old) { $old.Delete() }
    if ($env:HANDOFF_TEST_SOURCE) {
      $entry = $zip.CreateEntry($env:HANDOFF_TEST_ENTRY)
      $input = [System.IO.File]::OpenRead($env:HANDOFF_TEST_SOURCE)
      $output = $entry.Open()
      try { $input.CopyTo($output) } finally { $output.Dispose(); $input.Dispose() }
    }
  } finally { $zip.Dispose() }
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true, shell: false, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, HANDOFF_TEST_ZIP: zipPath, HANDOFF_TEST_ENTRY: entry, HANDOFF_TEST_SOURCE: source },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
}

test('selection includes real media and exactly the extraction inputs under the portable archive root', async t => {
  const f = await fixture(t);
  const result = await scanHandoffAssets(f.sourceDir);
  assert.deepEqual(result.files.map(file => file.path).sort(), [
    ...REQUIRED_FILES, 'Graphics/Characters/niño actual.png', 'Audio/SE/Door enter.wav', 'Fonts/power green.ttf',
  ].map(relative => `${ARCHIVE_ROOT}/${relative}`).sort());
  assert.equal(result.total.files, 13);
  let bytes = 0;
  for (const file of result.files) {
    const actual = await fs.readFile(path.join(f.temp, file.path));
    assert.equal(file.bytes, actual.length);
    bytes += actual.length;
  }
  assert.equal(result.total.bytes, bytes);
});

test('programs, unrelated PBS/Data, and personal save/cache/profile files do not enter the handoff', async t => {
  const f = await fixture(t);
  const rejected = ['Audio/Game.EXE', 'Audio/library.dll', 'Audio/script.js', 'Audio/link.lnk',
    'Graphics/private.json', 'Graphics/cache/preview.png', 'Graphics/saves/slot.png',
    'Audio/profiles/private.wav', 'Fonts/backup/copy.ttf', 'PBS/trainers.txt', 'Data/Game.rxdata'];
  for (const relative of rejected) await f.put(relative);
  const result = await scanHandoffAssets(f.sourceDir);
  assert.equal(result.total.files, 13);
  for (const relative of rejected) assert.ok(!result.files.some(file => file.path === `${ARCHIVE_ROOT}/${relative}`), relative);
});

test('Save UI artwork belongs to the runtime while personal saves and nested cache remain excluded', async t => {
  const f = await fixture(t);
  await f.put('Graphics/UI/Save/panels.png', 'save interface panels');
  await f.put('Graphics/save/private.png', 'private save preview');
  await f.put('Graphics/UI/cache/preview.png', 'private cached preview');
  const result = await scanHandoffAssets(f.sourceDir);
  assert.ok(result.files.some(file => file.path === `${ARCHIVE_ROOT}/Graphics/UI/Save/panels.png`));
  assert.equal(result.total.files, 14);
  assert.ok(!result.files.some(file => /private\.png|preview\.png/.test(file.path)));
});

test('missing mandatory PBS/Data stops packaging instead of producing an incomplete regeneration bundle', async t => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.sourceDir, 'PBS/pokemon_forms.txt'));
  await assert.rejects(scanHandoffAssets(f.sourceDir), /required.*pokemon_forms\.txt/i);
});

test('directory links do not import files outside the installation or masquerade as the source root', async t => {
  const f = await fixture(t), outside = path.join(f.temp, 'private'), link = path.join(f.sourceDir, 'Graphics', 'linked');
  await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'secret.png'), 'private fixture');
  await fs.symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  const result = await scanHandoffAssets(f.sourceDir);
  assert.equal(result.total.files, 13);
  assert.ok(!result.files.some(file => /linked|secret/.test(file.path)));
  const rootLink = path.join(f.temp, 'source-link');
  await fs.symlink(f.sourceDir, rootLink, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(scanHandoffAssets(rootLink), /source.*(link|regular directory)/i);
});

test('archive paths reject absolute, traversing, drive, backslash, and multiline names', () => {
  assert.equal(assertArchivePath(`${ARCHIVE_ROOT}/Graphics/niño.png`), `${ARCHIVE_ROOT}/Graphics/niño.png`);
  for (const bad of ['/absolute.png', '../private.png', 'C:/secret.png', `${ARCHIVE_ROOT}/../secret.png`,
    `${ARCHIVE_ROOT}/Graphics//file.png`, `${ARCHIVE_ROOT}/Graphics\\file.png`, `${ARCHIVE_ROOT}/Graphics/file\nname.png`]) {
    assert.throws(() => assertArchivePath(bad), /unsafe/i);
  }
});

test('build produces a real ZIP with Unicode/spaces, matching content hashes and an independently verifiable manifest', async t => {
  const f = await fixture(t);
  const built = await buildHandoffAssets(f);
  const manifest = JSON.parse(await fs.readFile(built.manifestPath, 'utf8'));
  assert.equal(manifest.archive.file, 'ecos-anil-resources.zip');
  assert.equal(manifest.total.files, 13);
  assert.equal(manifest.archive.sha256, digest(await fs.readFile(built.zipPath)));
  assert.ok(!JSON.stringify(manifest).includes(f.temp), 'manifest must not expose machine-specific paths');
  for (const file of manifest.files) assert.equal(file.sha256, digest(await fs.readFile(path.join(f.temp, file.path))));
  const verified = await verifyHandoffAssets({ zipPath: built.zipPath, manifestPath: built.manifestPath });
  assert.equal(verified.files, 13);
  assert.equal(verified.bytes, manifest.total.bytes);
  assert.equal(verified.sha256, manifest.archive.sha256);
});

test('verification rejects a valid ZIP whose payload changed even when its whole-archive hash was refreshed', async t => {
  const f = await fixture(t), built = await buildHandoffAssets(f);
  const manifest = JSON.parse(await fs.readFile(built.manifestPath, 'utf8'));
  const originalAudio = await fs.readFile(path.join(f.sourceDir, 'Audio/SE/Door enter.wav'));
  await f.put('Audio/SE/Door enter.wav', Buffer.alloc(originalAudio.length, 120));
  mutateArchive(built.zipPath, `${ARCHIVE_ROOT}/Audio/SE/Door enter.wav`, path.join(f.sourceDir, 'Audio/SE/Door enter.wav'));
  manifest.archive.sha256 = digest(await fs.readFile(built.zipPath));
  manifest.archive.bytes = (await fs.stat(built.zipPath)).size;
  await fs.writeFile(built.manifestPath, JSON.stringify(manifest));
  await assert.rejects(verifyHandoffAssets({ zipPath: built.zipPath, manifestPath: built.manifestPath }), /content.*(hash|bytes|mismatch)/i);
});

test('verification rejects an unexpected archive entry rather than accepting matching listed resources', async t => {
  const f = await fixture(t), built = await buildHandoffAssets(f);
  const manifest = JSON.parse(await fs.readFile(built.manifestPath, 'utf8'));
  const extra = await f.put('Graphics/extra.png', 'extra fixture');
  mutateArchive(built.zipPath, `${ARCHIVE_ROOT}/Graphics/extra.png`, extra);
  manifest.archive.sha256 = digest(await fs.readFile(built.zipPath));
  manifest.archive.bytes = (await fs.stat(built.zipPath)).size;
  await fs.writeFile(built.manifestPath, JSON.stringify(manifest));
  await assert.rejects(verifyHandoffAssets({ zipPath: built.zipPath, manifestPath: built.manifestPath }), /unexpected.*entry/i);
});

for (const category of ['Graphics', 'Audio', 'Fonts']) {
  test(`verification rejects a coherent ZIP and manifest without runtime ${category}`, async t => {
    const f = await fixture(t), built = await buildHandoffAssets(f);
    const manifest = JSON.parse(await fs.readFile(built.manifestPath, 'utf8'));
    for (const file of manifest.files.filter(file => file.path.startsWith(`${ARCHIVE_ROOT}/${category}/`))) mutateArchive(built.zipPath, file.path);
    manifest.files = manifest.files.filter(file => !file.path.startsWith(`${ARCHIVE_ROOT}/${category}/`));
    manifest.total = { files: manifest.files.length, bytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0) };
    manifest.archive.sha256 = digest(await fs.readFile(built.zipPath));
    manifest.archive.bytes = (await fs.stat(built.zipPath)).size;
    await fs.writeFile(built.manifestPath, JSON.stringify(manifest));
    await assert.rejects(verifyHandoffAssets({ zipPath: built.zipPath, manifestPath: built.manifestPath }), new RegExp(`required.*${category}`, 'i'));
  });
}

test('verification reports missing artifacts and a failed generator leaves no deliverable or staging files', async t => {
  const f = await fixture(t);
  await assert.rejects(verifyHandoffAssets({ zipPath: path.join(f.outputDir, 'missing.zip'), manifestPath: path.join(f.outputDir, 'missing.json') }), /ENOENT|missing/i);
  await assert.rejects(buildHandoffAssets({ ...f, powershell: path.join(f.temp, 'missing-generator.exe') }), /ENOENT|generator/i);
  assert.deepEqual(await fs.readdir(f.outputDir), []);
});
