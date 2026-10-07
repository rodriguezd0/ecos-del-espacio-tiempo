// Empaquetado de los recursos originales necesarios para la entrega de Ecos.
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

export const ARCHIVE_ROOT = 'Pokemon Anil V4.13';
export const REQUIRED_FILES = [
  'PBS/pokemon.txt', 'PBS/pokemon_forms.txt', 'PBS/moves.txt', 'PBS/abilities.txt',
  'PBS/items.txt', 'PBS/types.txt', 'PBS/trainer_types.txt',
  'Data/species_metrics.dat', 'Data/Tilesets.rxdata', 'Data/PkmnAnimations.rxdata',
];
const ZIP_NAME = 'ecos-anil-resources.zip';
const MANIFEST_NAME = 'ecos-anil-resources.manifest.json';
const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(PROJECT, 'tools', 'cache', 'publicacion');
const MEDIA = {
  Graphics: new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']),
  Audio: new Set(['.ogg', '.wav', '.mp3', '.mid', '.midi']),
  Fonts: new Set(['.ttf', '.otf', '.woff', '.woff2']),
};
const PERSONAL_DIRS = new Set(['cache', '.cache', 'saves', 'save', 'profiles', 'userdata', 'user_data',
  'backup', 'backups', 'node_modules', '.git', '.tools']);

function personalDirectory(relative) {
  // Save contiene panels.png de la interfaz original de Añil, no partidas del jugador.
  return relative !== 'Graphics/UI/Save' && PERSONAL_DIRS.has(path.posix.basename(relative).toLowerCase());
}

function allowedFile(relative) {
  const parts = relative.split('/');
  if (parts.slice(0, -1).some((_, index) => personalDirectory(parts.slice(0, index + 1).join('/')))) return false;
  return REQUIRED_FILES.includes(relative) || Boolean(MEDIA[parts[0]]?.has(path.posix.extname(relative).toLowerCase()));
}

export function assertArchivePath(relative) {
  if (typeof relative !== 'string' || !relative.startsWith(`${ARCHIVE_ROOT}/`)
      || /[\\\x00-\x1f:]/.test(relative)
      || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe archive path');
  }
  return relative;
}

export async function scanHandoffAssets(sourceDir) {
  const files = [], excluded = { links: 0, personalDirectories: 0, unsupportedFiles: 0 };
  async function regularDirectory(absolute, label) {
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} must be a regular directory, not a link`);
  }
  await regularDirectory(sourceDir, 'Source');
  async function walk(relative) {
    const absolute = path.join(sourceDir, relative), stat = await fs.lstat(absolute);
    const portable = relative.split(path.sep).join('/');
    if (stat.isSymbolicLink()) { excluded.links++; return; }
    if (stat.isDirectory()) {
      if (personalDirectory(portable)) { excluded.personalDirectories++; return; }
      for (const name of await fs.readdir(absolute)) await walk(path.join(relative, name));
    } else if (stat.isFile() && allowedFile(portable)) {
      files.push({ path: assertArchivePath(`${ARCHIVE_ROOT}/${portable}`), bytes: stat.size });
    } else {
      excluded.unsupportedFiles++;
    }
  }
  for (const category of Object.keys(MEDIA)) {
    await regularDirectory(path.join(sourceDir, category), `Required resource directory ${category}`);
    await walk(category);
    if (!files.some(file => file.path.startsWith(`${ARCHIVE_ROOT}/${category}/`))) throw new Error(`Required resource directory ${category} is empty`);
  }
  for (const category of ['PBS', 'Data']) await regularDirectory(path.join(sourceDir, category), `Required resource directory ${category}`);
  for (const relative of REQUIRED_FILES) {
    let stat;
    try { stat = await fs.lstat(path.join(sourceDir, relative)); }
    catch (err) { throw new Error(`Required file ${relative} is missing`, { cause: err }); }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Required file ${relative} must be a regular file, not a link`);
    files.push({ path: assertArchivePath(`${ARCHIVE_ROOT}/${relative}`), bytes: stat.size });
  }
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return { files, excluded, total: { files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0) } };
}

async function hashFile(absolute) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(absolute)) { bytes += chunk.length; hash.update(chunk); }
  return { bytes, sha256: hash.digest('hex') };
}

async function runProcess(command, args, { env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, shell: false, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-65536); });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(stdout) : reject(new Error(`${path.basename(command)} exited ${code}: ${stderr.trim()}`)));
  });
}

function validateManifest(manifest) {
  if (manifest?.schema !== 'ecos-handoff-assets-v1' || manifest.archive?.root !== `${ARCHIVE_ROOT}/`
      || manifest.archive.file !== ZIP_NAME || !Array.isArray(manifest.files)) throw new Error('Invalid handoff manifest');
  const paths = new Set();
  let bytes = 0;
  for (const file of manifest.files) {
    assertArchivePath(file.path);
    if (!allowedFile(file.path.slice(ARCHIVE_ROOT.length + 1)) || paths.has(file.path)
        || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) {
      throw new Error(`Invalid or duplicate manifest file: ${file.path}`);
    }
    paths.add(file.path); bytes += file.bytes;
  }
  for (const relative of REQUIRED_FILES) if (!paths.has(`${ARCHIVE_ROOT}/${relative}`)) throw new Error(`Required manifest file ${relative} is missing`);
  for (const category of Object.keys(MEDIA)) {
    if (!manifest.files.some(file => file.path.startsWith(`${ARCHIVE_ROOT}/${category}/`))) throw new Error(`Required manifest category ${category} is missing`);
  }
  if (manifest.total?.files !== paths.size || manifest.total.bytes !== bytes
      || !Number.isSafeInteger(manifest.archive.bytes) || manifest.archive.bytes < 0
      || !/^[a-f0-9]{64}$/.test(manifest.archive.sha256)) throw new Error('Invalid manifest totals or archive hash');
}

// Scripts fijos: las rutas son datos de entorno, nunca se interpolan en órdenes de PowerShell.
// bsdtar de Windows no lee nombres Unicode de -T correctamente. ZipArchive conserva esos nombres.
const CREATE_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
function New-HandoffZip {
  Add-Type -AssemblyName System.IO.Compression
  $manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $env:ECOS_HANDOFF_MANIFEST | ConvertFrom-Json
  $output = [System.IO.File]::Open($env:ECOS_HANDOFF_ZIP, [System.IO.FileMode]::CreateNew)
  $archive = [System.IO.Compression.ZipArchive]::new($output, [System.IO.Compression.ZipArchiveMode]::Create, $false, [System.Text.Encoding]::UTF8)
  try {
    foreach ($file in $manifest.files) {
      $relative = $file.path.Substring($manifest.archive.root.Length)
      $absolute = [System.IO.Path]::Combine($env:ECOS_HANDOFF_SOURCE, $relative)
      $entry = $archive.CreateEntry($file.path, [System.IO.Compression.CompressionLevel]::Fastest)
      $input = [System.IO.File]::OpenRead($absolute)
      $stream = $entry.Open()
      try { $input.CopyTo($stream) } finally { $stream.Dispose(); $input.Dispose() }
    }
  } finally { $archive.Dispose(); $output.Dispose() }
}
try { New-HandoffZip } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
`;

// ZipArchive lee cada entrada sin extraerla y comprueba también su contenido, no sólo el hash del ZIP.
const VERIFY_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
function Test-HandoffZip {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $env:ECOS_HANDOFF_MANIFEST | ConvertFrom-Json
  $expected = [System.Collections.Generic.Dictionary[string,object]]::new([System.StringComparer]::Ordinal)
  foreach ($file in $manifest.files) { $expected.Add([string]$file.path, $file) }
  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  $archive = [System.IO.Compression.ZipFile]::OpenRead($env:ECOS_HANDOFF_ZIP)
  $total = [long]0
  try {
    foreach ($entry in $archive.Entries) {
      if (!$expected.ContainsKey($entry.FullName)) { throw "Unexpected archive entry: $($entry.FullName)" }
      if (!$seen.Add($entry.FullName)) { throw "Duplicate archive entry: $($entry.FullName)" }
      if ((($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw "Linked archive entry: $($entry.FullName)" }
      $file = $expected[$entry.FullName]
      if ($entry.Length -ne [long]$file.bytes) { throw "Content bytes mismatch: $($entry.FullName)" }
      $stream = $entry.Open()
      $sha = [System.Security.Cryptography.SHA256]::Create()
      try { $actual = [System.BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
      finally { $sha.Dispose(); $stream.Dispose() }
      if ($actual -cne [string]$file.sha256) { throw "Content hash mismatch: $($entry.FullName)" }
      $total += $entry.Length
    }
    if ($seen.Count -ne $expected.Count) { throw 'Archive is missing manifest entries' }
    [pscustomobject]@{files=$seen.Count;bytes=$total} | ConvertTo-Json -Compress
  } finally { $archive.Dispose() }
}
try { Test-HandoffZip } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
`;

export async function verifyHandoffAssets({ zipPath = path.join(OUTPUT, ZIP_NAME),
  manifestPath = path.join(OUTPUT, MANIFEST_NAME), powershell = 'powershell.exe' } = {}) {
  const [manifestText, zipStat] = await Promise.all([fs.readFile(manifestPath, 'utf8'), fs.lstat(zipPath)]);
  const manifest = JSON.parse(manifestText);
  validateManifest(manifest);
  if (!zipStat.isFile() || zipStat.isSymbolicLink()) throw new Error('ZIP must be a regular file, not a link');
  const hashed = await hashFile(zipPath);
  if (hashed.bytes !== manifest.archive.bytes || hashed.sha256 !== manifest.archive.sha256) throw new Error('ZIP bytes or SHA256 mismatch');
  const result = await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-Command', VERIFY_SCRIPT], {
    env: { ...process.env, ECOS_HANDOFF_ZIP: path.resolve(zipPath), ECOS_HANDOFF_MANIFEST: path.resolve(manifestPath) },
  });
  const checked = JSON.parse(result.trim());
  if (checked.files !== manifest.total.files || checked.bytes !== manifest.total.bytes) throw new Error('ZIP listing does not match manifest totals');
  return { ...checked, sha256: hashed.sha256 };
}

export async function buildHandoffAssets({ sourceDir = path.join(PROJECT, ARCHIVE_ROOT), outputDir = OUTPUT,
  powershell = 'powershell.exe', onProgress = () => {} } = {}) {
  sourceDir = path.resolve(sourceDir); outputDir = path.resolve(outputDir);
  if (path.basename(sourceDir) !== ARCHIVE_ROOT) throw new Error(`Source directory must be named ${ARCHIVE_ROOT}`);
  const selection = await scanHandoffAssets(sourceDir);
  onProgress(`Seleccionados ${selection.total.files} archivos (${selection.total.bytes} bytes). Calculando SHA256.`);
  let next = 0;
  const files = new Array(selection.files.length);
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < files.length) {
      const index = next++, file = selection.files[index];
      const absolute = path.join(sourceDir, ...file.path.slice(ARCHIVE_ROOT.length + 1).split('/'));
      const stat = await fs.lstat(absolute);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Source file changed: ${file.path}`);
      const hashed = await hashFile(absolute);
      if (hashed.bytes !== file.bytes) throw new Error(`Source file bytes changed: ${file.path}`);
      files[index] = { ...file, sha256: hashed.sha256 };
    }
  }));
  await fs.mkdir(outputDir, { recursive: true });
  const outputStat = await fs.lstat(outputDir);
  if (!outputStat.isDirectory() || outputStat.isSymbolicLink()) throw new Error('Output must be a regular directory, not a link');
  const stage = await fs.mkdtemp(path.join(outputDir, '.handoff-build-'));
  try {
    const zipPath = path.join(stage, ZIP_NAME), manifestPath = path.join(stage, MANIFEST_NAME);
    const manifest = { schema: 'ecos-handoff-assets-v1', sourceVersion: 'Añil 4.13', createdAt: new Date().toISOString(),
      archive: { file: ZIP_NAME, root: `${ARCHIVE_ROOT}/` }, total: selection.total,
      excluded: selection.excluded, files };
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    onProgress('Creando ZIP con nombres Unicode.');
    await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-Command', CREATE_SCRIPT], {
      env: { ...process.env, ECOS_HANDOFF_ZIP: zipPath, ECOS_HANDOFF_MANIFEST: manifestPath, ECOS_HANDOFF_SOURCE: sourceDir },
    });
    Object.assign(manifest.archive, await hashFile(zipPath));
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    onProgress('Verificando todas las entradas y su contenido.');
    const verified = await verifyHandoffAssets({ zipPath, manifestPath, powershell });
    const finalZip = path.join(outputDir, ZIP_NAME), finalManifest = path.join(outputDir, MANIFEST_NAME);
    await fs.rename(zipPath, finalZip);
    await fs.rename(manifestPath, finalManifest);
    return { zipPath: finalZip, manifestPath: finalManifest, archive: manifest.archive, total: manifest.total, excluded: manifest.excluded, verified };
  } finally {
    // Antes de eliminar recursivamente, verifica que sólo se retire nuestra carpeta temporal de salida.
    if (path.dirname(path.resolve(stage)) !== outputDir || !path.basename(stage).startsWith('.handoff-build-')) throw new Error('Unsafe staging cleanup path');
    await fs.rm(stage, { recursive: true, force: true });
  }
}

async function main(args) {
  if (args.length > 1 || args.some(arg => !['--check', '--list', '--verify'].includes(arg))) throw new Error('Uso: node tools/package_handoff_assets.mjs [--check|--list|--verify]');
  if (args[0] === '--verify') {
    console.log(JSON.stringify(await verifyHandoffAssets(), null, 2));
  } else if (args[0] === '--check' || args[0] === '--list') {
    const selection = await scanHandoffAssets(path.join(PROJECT, ARCHIVE_ROOT));
    if (args[0] === '--list') for (const file of selection.files) console.log(`${file.bytes}\t${file.path}`);
    else console.log(JSON.stringify({ archiveRoot: `${ARCHIVE_ROOT}/`, total: selection.total, excluded: selection.excluded,
      zip: 'tools/cache/publicacion/' + ZIP_NAME, manifest: 'tools/cache/publicacion/' + MANIFEST_NAME }, null, 2));
  } else {
    console.log(JSON.stringify(await buildHandoffAssets({ onProgress: console.log }), null, 2));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(err => { console.error(err.message); process.exitCode = 1; });
}
