// Ejecutar en una terminal con Git escribible y GitHub autenticado. No utiliza shell.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const owner = 'rodriguezd0';
const repository = 'ecos-del-espacio-tiempo';
const destination = `${owner}/${repository}`;
const url = `https://github.com/${destination}.git`;
const portableGh = path.join(root, '.tools/gh-2.102.0/bin/gh.exe');
const gh = fs.existsSync(portableGh) ? portableGh : 'gh';
const deliveryFiles = [
  'README.md', 'AGENTS.md',
  'docs/CONTINUIDAD_CODEX.md', 'docs/RECURSOS_EXTERNOS.md',
  'docs/COBERTURA.md', 'game/vendor/LICENSE.three.txt',
  'tools/vendor.mjs', 'tools/package_handoff_assets.mjs',
  'tests/handoff_assets.test.mjs', 'tests/publish_handoff.test.mjs', 'tools/publish_handoff.mjs',
];

function run(executable, args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync(executable, args, {
    cwd: root, windowsHide: true, encoding: 'utf8',
    env: { ...process.env, GH_HOST: 'github.com' },
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw new Error(`No se pudo ejecutar ${path.basename(executable)}: ${result.error.code}`);
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${path.basename(executable)} ${args[0]} falló (código ${result.status}).`);
  }
  return result;
}

function read(executable, args) {
  return run(executable, args, { capture: true }).stdout.trim();
}

function readGitFiles(args) {
  return run('git', [...args, '-z'], { capture: true }).stdout.split('\0').filter(Boolean);
}

function validateOrigin() {
  const accepted = [url, url.replace(/\.git$/, '')];
  for (const mode of [[], ['--push']]) {
    const urls = read('git', ['remote', 'get-url', ...mode, '--all', 'origin']).split(/\r?\n/);
    if (!urls.length || urls.some(value => !accepted.includes(value))) {
      throw new Error('origin tiene un destino fetch/push diferente o no usa HTTPS.');
    }
  }
}

function confirmTag(tag, commit) {
  let object = JSON.parse(read(gh, ['api', `repos/${destination}/git/ref/tags/${tag}`])).object;
  let depth = 0;
  while (object?.type === 'tag' && depth++ < 5) {
    object = JSON.parse(read(gh, ['api', `repos/${destination}/git/tags/${object.sha}`])).object;
  }
  if (object?.type !== 'commit' || object.sha !== commit) throw new Error('El tag de la Release corresponde a otro commit.');
}

function checkAssets(assets, expected, { allowMissing = false } = {}) {
  const missing = [];
  for (const file of expected) {
    const matches = assets.filter(asset => asset.name === file.name);
    if (!matches.length && allowMissing) { missing.push(file.path); continue; }
    if (matches.length !== 1 || matches[0].state !== 'uploaded' || matches[0].size !== file.bytes) {
      throw new Error(`No se confirmó la subida completa de ${file.name}.`);
    }
    if (matches[0].digest !== `sha256:${file.sha256}`) {
      throw new Error(`El digest SHA256 de ${file.name} no coincide con el contenido local.`);
    }
  }
  return missing;
}

function main() {
  if (process.argv.length !== 2) throw new Error('Uso: node tools/publish_handoff.mjs');
  const login = read(gh, ['api', 'user', '--jq', '.login']);
  if (login !== owner) throw new Error(`La cuenta autenticada es ${login}; se esperaba ${owner}.`);
  const branch = read('git', ['branch', '--show-current']);
  if (branch !== 'master') throw new Error(`Se esperaba master; rama actual: ${branch}.`);
  if (read('git', ['diff', '--name-only', '--diff-filter=U'])) throw new Error('Resolver conflictos antes de publicar.');

  const remotes = read('git', ['remote']).split(/\r?\n/).filter(Boolean);
  if (remotes.includes('origin')) validateOrigin();
  const changed = readGitFiles(['diff', '--name-only', 'HEAD']);
  const indexed = readGitFiles(['diff', '--cached', '--name-only']);
  const untracked = readGitFiles(['ls-files', '--others', '--exclude-standard']);
  const unexpected = [...new Set([...changed, ...indexed, ...untracked])].filter(file => !deliveryFiles.includes(file));
  if (unexpected.length) throw new Error(`Revisar cambios fuera de la entrega: ${unexpected.join(', ')}`);
  for (const file of deliveryFiles) {
    if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Falta archivo de entrega: ${file}`);
  }

  const output = path.join(root, 'tools/cache/publicacion');
  const archive = path.join(output, 'ecos-anil-resources.zip');
  const manifest = path.join(output, 'ecos-anil-resources.manifest.json');
  const packageArgs = fs.existsSync(archive) && fs.existsSync(manifest) ? ['--verify'] : [];
  run(process.execPath, ['tools/package_handoff_assets.mjs', ...packageArgs]);
  const manifestBytes = fs.readFileSync(manifest);
  const manifestData = JSON.parse(manifestBytes.toString('utf8'));
  const expectedAssets = [
    { path: archive, name: path.basename(archive), bytes: fs.statSync(archive).size, sha256: manifestData.archive.sha256 },
    { path: manifest, name: path.basename(manifest), bytes: manifestBytes.length,
      sha256: createHash('sha256').update(manifestBytes).digest('hex') },
  ];
  run(gh, ['auth', 'setup-git', '--hostname', 'github.com']);

  run('git', ['add', '--', ...deliveryFiles]);
  const staged = run('git', ['diff', '--cached', '--quiet'], { capture: true, allowFailure: true });
  if (staged.status === 1) run('git', ['commit', '-m', 'chore: prepare GitHub handoff and portable resources']);
  else if (staged.status !== 0) throw new Error('No se pudo comprobar el índice de Git.');
  const commit = read('git', ['rev-parse', 'HEAD']);

  const existing = run(gh, ['api', `repos/${destination}`, '--silent'], { capture: true, allowFailure: true });
  if (existing.status !== 0) {
    if (!existing.stderr.includes('HTTP 404')) throw new Error('No se pudo consultar el destino de GitHub.');
    run(gh, ['repo', 'create', destination, '--public', '--description',
      'Pokemon: Ecos del Espacio-Tiempo - region Axis']);
  }
  if (!remotes.includes('origin')) run('git', ['remote', 'add', 'origin', url]);
  validateOrigin();
  run('git', ['push', '-u', 'origin', 'master']);
  const historical = run('git', ['show-ref', '--verify', '--quiet', 'refs/heads/wip-pausa-25-09'],
    { capture: true, allowFailure: true });
  if (historical.status === 0) run('git', ['push', 'origin', 'wip-pausa-25-09']);
  else if (historical.status !== 1) throw new Error('No se pudo comprobar la rama histórica.');
  run(gh, ['repo', 'edit', destination, '--default-branch', 'master']);
  const remoteCommit = read(gh, ['api', `repos/${destination}/git/ref/heads/master`, '--jq', '.object.sha']);
  if (remoteCommit !== commit) throw new Error('El HEAD remoto no coincide con el commit local.');

  const tag = `handoff-${commit.slice(0, 12)}`;
  const existingRelease = run(gh, ['api', `repos/${destination}/releases/tags/${tag}`],
    { capture: true, allowFailure: true });
  if (existingRelease.status === 0) {
    confirmTag(tag, commit);
    const missing = checkAssets(JSON.parse(existingRelease.stdout).assets, expectedAssets, { allowMissing: true });
    if (missing.length) run(gh, ['release', 'upload', tag, ...missing, '--repo', destination]);
  } else {
    if (!existingRelease.stderr.includes('HTTP 404')) throw new Error('No se pudo consultar la Release.');
    const notes = path.join(output, 'release-notes.txt');
    fs.writeFileSync(notes, [
      'Entrega para continuar el proyecto en otro Codex. Leer README.md, AGENTS.md y docs/CONTINUIDAD_CODEX.md.',
      'Extraer ecos-anil-resources.zip en la raíz del clon; comprobar el manifiesto adjunto.',
      'Las partidas personales y la evidencia local de QA no están incluidas.',
      '',
    ].join('\n'));
    run(gh, ['release', 'create', tag, archive, manifest, '--repo', destination,
      '--target', commit, '--title', 'Entrega de continuidad', '--notes-file', notes]);
  }
  confirmTag(tag, commit);
  const assets = JSON.parse(read(gh, ['api', `repos/${destination}/releases/tags/${tag}`, '--jq', '.assets']));
  checkAssets(assets, expectedAssets);
  const releaseUrl = read(gh, ['release', 'view', tag, '--repo', destination, '--json', 'url', '--jq', '.url']);
  console.log(`Repositorio: https://github.com/${destination}\nCommit: ${commit}\nRecursos: ${releaseUrl}`);
}

export function publishHandoff() {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) publishHandoff();
