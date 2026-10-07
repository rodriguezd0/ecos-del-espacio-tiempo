import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { publishHandoff } from '../tools/publish_handoff.mjs';

// The command is executed against fake subprocesses/files, including Git and gh.
// Nothing in this fixture writes an index, creates a repository, or contacts GitHub.
const DESTINATION = 'rodriguezd0/ecos-del-espacio-tiempo';
const ORIGIN = `https://github.com/${DESTINATION}.git`;
const COMMIT = 'a'.repeat(40);
const HISTORY = 'b'.repeat(40);
const TAG = `handoff-${COMMIT.slice(0, 12)}`;
const ZIP = Buffer.from('verified archive fixture');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const MANIFEST = Buffer.from(JSON.stringify({
  schema: 'ecos-handoff-assets-v1',
  archive: { file: 'ecos-anil-resources.zip', root: 'Pokemon Anil V4.13/', bytes: ZIP.length, sha256: hash(ZIP) },
  total: { files: 13, bytes: 1024 },
}));
const assets = () => [
  { id: 101, name: 'ecos-anil-resources.zip', state: 'uploaded', size: ZIP.length, digest: `sha256:${hash(ZIP)}` },
  { id: 102, name: 'ecos-anil-resources.manifest.json', state: 'uploaded', size: MANIFEST.length, digest: `sha256:${hash(MANIFEST)}` },
];

function gitArgs(call) {
  const args = [...call.args];
  while (args[0] === '-c' || args[0] === '-C') args.splice(0, 2);
  return args;
}

function isGit(call) { return /^git(?:\.exe)?$/i.test(path.basename(call.executable)); }
function isGh(call) { return /^gh(?:\.exe)?$/i.test(path.basename(call.executable)); }
function writesRemoteOrGit(call) {
  if (isGit(call)) {
    const args = gitArgs(call);
    return ['add', 'commit', 'push'].includes(args[0]) || (args[0] === 'remote' && args[1] === 'add');
  }
  return isGh(call) && ((call.args[0] === 'repo' && ['create', 'edit'].includes(call.args[1]))
    || (call.args[0] === 'release' && ['create', 'upload', 'delete'].includes(call.args[1]))
    || (call.args[0] === 'auth' && call.args[1] === 'setup-git'));
}

function result(stdout = '', status = 0, stderr = '') {
  return { stdout, stderr, status, signal: null, pid: 1, output: [null, stdout, stderr] };
}

async function publish(options = {}) {
  const calls = [], writes = [], logs = [], errors = [];
  let currentAssets = structuredClone(options.existingAssets ?? []);
  let releaseExists = options.releaseExists ?? false;
  const release = () => ({ id: 1, tag_name: TAG, target_commitish: COMMIT, draft: false,
    html_url: `https://github.com/${DESTINATION}/releases/tag/${TAG}`, assets: currentAssets });
  const emit = (args, value) => {
    const jq = args.indexOf('--jq');
    if (jq < 0) return result(JSON.stringify(value));
    const query = args[jq + 1];
    if (query === '.login') return result(value.login);
    if (query === '.object.sha') return result(value.object.sha);
    if (query === '.assets') return result(JSON.stringify(value.assets));
    if (query === '.url' || query === '.html_url') return result(value.html_url);
    return result(JSON.stringify(value));
  };
  function fakeSpawn(executable, args, spawnOptions) {
    const call = { executable: String(executable), args: [...args], options: spawnOptions };
    calls.push(call);
    assert.notEqual(spawnOptions.shell, true, 'publication must not use a shell');
    if (isGit(call)) {
      const command = gitArgs(call);
      if (command[0] === 'branch') return result(options.branch ?? 'master');
      if (command[0] === 'remote' && command.length === 1) return result(options.noOrigin ? '' : 'origin\n');
      if (command[0] === 'remote' && command[1] === 'get-url') {
        const urls = command.includes('--push') ? (options.pushOrigin ?? ORIGIN) : (options.origin ?? ORIGIN);
        return result(command.includes('--all') ? urls : urls.split('\n')[0]);
      }
      if (command[0] === 'diff') {
        if (command.includes('--diff-filter=U')) return result(options.conflicts ? 'server.mjs\n' : '');
        if (command.includes('--quiet')) return result('', options.noCommit ? 0 : 1);
        const files = command.includes('--cached') ? (options.index ?? ['README.md']) : (options.changed ?? ['README.md']);
        return result(files.join('\0') + (files.length ? '\0' : ''));
      }
      if (command[0] === 'ls-files') {
        const files = options.untracked ?? [];
        return result(files.join('\0') + (files.length ? '\0' : ''));
      }
      if (command[0] === 'show-ref') return result('', options.noHistory ? 1 : 0);
      if (command[0] === 'rev-parse') return result(command.some(arg => arg.includes('wip-pausa-25-09')) ? HISTORY : COMMIT);
      if (command[0] === 'ls-remote') return result(`${COMMIT}\trefs/heads/master\n${HISTORY}\trefs/heads/wip-pausa-25-09\n`);
      if (['add', 'commit', 'push'].includes(command[0]) || (command[0] === 'remote' && command[1] === 'add')) return result();
      throw new Error(`Unexpected simulated Git command: ${command.join(' ')}`);
    }
    if (isGh(call)) {
      if (args[0] === 'api') {
        const endpoint = args[1];
        if (endpoint === 'user') return options.noAuth ? result('', 4, 'authentication required') : emit(args, { login: options.login ?? 'rodriguezd0' });
        if (endpoint === `repos/${DESTINATION}`) return options.repoAbsent ? result('', 1, 'HTTP 404: Not Found') : result('{}');
        if (endpoint === `repos/${DESTINATION}/git/ref/heads/master`) return emit(args, { object: { type: 'commit', sha: options.remoteCommit ?? COMMIT } });
        if (endpoint === `repos/${DESTINATION}/git/ref/heads/wip-pausa-25-09`) return emit(args, { object: { type: 'commit', sha: HISTORY } });
        if (endpoint === `repos/${DESTINATION}/git/ref/tags/${TAG}`) return emit(args, { object: { type: options.annotatedTag ? 'tag' : 'commit', sha: options.annotatedTag ? HISTORY : options.tagCommit ?? COMMIT } });
        if (endpoint === `repos/${DESTINATION}/git/tags/${HISTORY}`) return emit(args, { object: { type: 'commit', sha: options.tagCommit ?? COMMIT } });
        if (endpoint === `repos/${DESTINATION}/releases/tags/${TAG}`) return releaseExists ? emit(args, release()) : result('', 1, 'HTTP 404: Not Found');
        throw new Error(`Unexpected simulated GitHub endpoint: ${endpoint}`);
      }
      if (args[0] === 'release' && args[1] === 'create') {
        releaseExists = true;
        currentAssets = structuredClone(options.uploadedAssets ?? assets());
        return result();
      }
      if (args[0] === 'release' && args[1] === 'upload') {
        for (const expected of assets()) {
          if (args.some(arg => path.basename(arg) === expected.name)) currentAssets.push(structuredClone(expected));
        }
        return result();
      }
      if (args[0] === 'release' && args[1] === 'view') return emit(args, { ...release(), url: release().html_url });
      if ((args[0] === 'repo' && ['create', 'edit'].includes(args[1])) || (args[0] === 'auth' && args[1] === 'setup-git')) return result();
      throw new Error(`Unexpected simulated gh command: ${args.join(' ')}`);
    }
    if (args[0] === 'tools/package_handoff_assets.mjs') return result('', options.packageFails ? 1 : 0);
    throw new Error(`Unexpected simulated process: ${executable}`);
  }
  const originals = {
    spawnSync: childProcess.spawnSync, existsSync: fs.existsSync, statSync: fs.statSync,
    readFileSync: fs.readFileSync, writeFileSync: fs.writeFileSync,
    argv: process.argv, exitCode: process.exitCode, log: console.log, error: console.error,
  };
  childProcess.spawnSync = fakeSpawn;
  fs.existsSync = filename => /ecos-anil-resources\.(?:zip|manifest\.json)$/.test(String(filename));
  fs.statSync = filename => {
    const name = path.basename(String(filename));
    if (name === options.missingFile) throw Object.assign(new Error(`ENOENT: ${name}`), { code: 'ENOENT' });
    return { isFile: () => true, size: name.endsWith('.zip') ? ZIP.length : name.endsWith('.manifest.json') ? MANIFEST.length : 100 };
  };
  fs.readFileSync = (filename, encoding) => {
    const name = path.basename(String(filename));
    const content = name === 'ecos-anil-resources.manifest.json' ? MANIFEST : name === 'ecos-anil-resources.zip' ? ZIP : null;
    return content ? (encoding ? content.toString(encoding) : content) : originals.readFileSync(filename, encoding);
  };
  fs.writeFileSync = (...args) => { writes.push(args); };
  process.argv = ['node', 'tools/publish_handoff.mjs'];
  process.exitCode = 0;
  console.log = (...args) => { logs.push(args.join(' ')); };
  console.error = (...args) => { errors.push(args.join(' ')); };
  syncBuiltinESMExports();
  try {
    publishHandoff();
    return { calls, writes, logs, errors, exitCode: process.exitCode, assets: currentAssets };
  } finally {
    childProcess.spawnSync = originals.spawnSync;
    fs.existsSync = originals.existsSync;
    fs.statSync = originals.statSync;
    fs.readFileSync = originals.readFileSync;
    fs.writeFileSync = originals.writeFileSync;
    process.argv = originals.argv;
    process.exitCode = originals.exitCode;
    console.log = originals.log;
    console.error = originals.error;
    syncBuiltinESMExports();
  }
}

function assertClosed(observed, expression) {
  assert.equal(observed.exitCode, 1, observed.errors.join('\n'));
  assert.match(observed.errors.join('\n'), expression);
  assert.deepEqual(observed.calls.filter(writesRemoteOrGit), [], 'validation must stop before any Git/GitHub mutation');
  assert.deepEqual(observed.writes, [], 'validation must not write release notes');
}

test('missing authentication or the wrong GitHub account stops before publication', async () => {
  assertClosed(await publish({ noAuth: true }), /gh|auth/i);
  assertClosed(await publish({ login: 'other-account' }), /cuenta|rodriguezd0/i);
});

test('a different branch or unresolved conflict stops before publication', async () => {
  assertClosed(await publish({ branch: 'feature' }), /master|rama/i);
  assertClosed(await publish({ conflicts: true }), /conflicto/i);
});

test('an unrelated fetch remote is rejected before any changes', async () => {
  assertClosed(await publish({ origin: 'https://github.com/other/project.git' }), /origin|destino/i);
});

test('a correct fetch URL cannot hide a different push destination', async () => {
  assertClosed(await publish({ pushOrigin: 'https://github.com/other/project.git' }), /origin|push|destino/i);
});

test('all configured push URLs must point to the delivery repository', async () => {
  assertClosed(await publish({ pushOrigin: `${ORIGIN}\nhttps://github.com/other/project.git` }), /origin|push|destino/i);
});

test('foreign worktree and untracked changes stop before staging', async () => {
  assertClosed(await publish({ changed: ['server.mjs'] }), /fuera|entrega|cambio/i);
  assertClosed(await publish({ untracked: ['private-save.json'] }), /fuera|entrega|cambio/i);
});

test('a foreign staged change cannot hide behind a restored worktree', async () => {
  assertClosed(await publish({ changed: [], index: ['server.mjs'] }), /fuera|entrega|índice|cambio/i);
});

test('missing delivery files and failed package verification stop before Git mutations', async () => {
  assertClosed(await publish({ missingFile: 'README.md' }), /ENOENT|archivo/i);
  assertClosed(await publish({ packageFails: true }), /node|package|falló/i);
});

test('a valid delivery commits only known files and pushes both branches without force', async () => {
  const observed = await publish({ repoAbsent: true, noOrigin: true });
  assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
  const git = observed.calls.filter(isGit).map(gitArgs);
  const staged = git.find(args => args[0] === 'add').slice(2);
  assert.ok(staged.includes('tests/publish_handoff.test.mjs'), 'the publication regression belongs in the delivery');
  assert.ok(staged.every(file => /^(README\.md|AGENTS\.md|docs\/(CONTINUIDAD_CODEX|RECURSOS_EXTERNOS|COBERTURA)\.md|game\/vendor\/LICENSE\.three\.txt|tools\/(vendor|package_handoff_assets|publish_handoff)\.mjs|tests\/(handoff_assets|publish_handoff)\.test\.mjs)$/.test(file)));
  assert.equal(git.filter(args => args[0] === 'commit').length, 1);
  const pushes = git.filter(args => args[0] === 'push');
  assert.equal(pushes.length, 2);
  assert.ok(pushes.some(args => args.some(arg => /master/.test(arg))));
  assert.ok(pushes.some(args => args.some(arg => /wip-pausa-25-09/.test(arg))));
  assert.ok(pushes.every(args => !args.some(arg => arg === '-f' || arg.startsWith('+') || /^--force|^--mirror/.test(arg))));
  const release = observed.calls.find(call => isGh(call) && call.args[0] === 'release' && call.args[1] === 'create');
  assert.equal(release.args[release.args.indexOf('--target') + 1], COMMIT);
  assert.ok(observed.calls.some(call => isGh(call) && call.args.includes(`repos/${DESTINATION}/git/ref/heads/master`)));
  assert.match(observed.logs.join('\n'), new RegExp(COMMIT));
});

test('a clean delivery does not make another commit', async () => {
  const observed = await publish({ noCommit: true, changed: [], index: [] });
  assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
  assert.equal(observed.calls.filter(call => isGit(call) && gitArgs(call)[0] === 'commit').length, 0);
});

test('a mismatched master on GitHub prevents Release creation', async () => {
  const observed = await publish({ remoteCommit: HISTORY });
  assert.equal(observed.exitCode, 1);
  assert.match(observed.errors.join('\n'), /HEAD|remoto|commit/i);
  assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release').length, 0);
});

test('an incomplete or differently sized upload is not reported as successful', async () => {
  for (const uploadedAssets of [assets().slice(0, 1), assets().map(asset => ({ ...asset, size: asset.size + 1 }))]) {
    const observed = await publish({ uploadedAssets });
    assert.equal(observed.exitCode, 1);
    assert.match(observed.errors.join('\n'), /subida|asset|recurso|tamaño|complet/i);
    assert.deepEqual(observed.logs, []);
  }
});

test('rerunning a fully uploaded Release recognizes the completed delivery', async () => {
  const observed = await publish({ noCommit: true, changed: [], index: [], releaseExists: true, existingAssets: assets() });
  assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
  assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && ['create', 'upload'].includes(call.args[1])).length, 0);
  assert.match(observed.logs.join('\n'), /Recursos|https:\/\/github/i);
});

test('a partial Release uploads only the missing resource without replacing the ZIP', async () => {
  const observed = await publish({ noCommit: true, changed: [], index: [], releaseExists: true, existingAssets: assets().slice(0, 1) });
  assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
  const uploads = observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && call.args[1] === 'upload');
  assert.equal(uploads.length, 1);
  assert.ok(uploads[0].args.some(arg => path.basename(arg) === 'ecos-anil-resources.manifest.json'));
  assert.ok(!uploads[0].args.some(arg => path.basename(arg) === 'ecos-anil-resources.zip' || arg === '--clobber'));
  assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && call.args[1] === 'create').length, 0);
  assert.equal(observed.assets.length, 2);
});

test('an existing resource with the same size but a different digest fails without replacement', async () => {
  const existingAssets = assets();
  existingAssets[0].digest = `sha256:${'0'.repeat(64)}`;
  const observed = await publish({ releaseExists: true, existingAssets });
  assert.equal(observed.exitCode, 1);
  assert.match(observed.errors.join('\n'), /digest|SHA256|contenido/i);
  assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && ['upload', 'delete'].includes(call.args[1])).length, 0);
});

test('a Release tag for a different commit is not reused', async () => {
  const observed = await publish({ releaseExists: true, existingAssets: assets(), tagCommit: HISTORY });
  assert.equal(observed.exitCode, 1);
  assert.match(observed.errors.join('\n'), /tag|commit/i);
  assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && ['create', 'upload'].includes(call.args[1])).length, 0);
});

test('SSH remotes stop before staging because the configured gh helper authenticates HTTPS', async () => {
  assertClosed(await publish({ origin: `git@github.com:${DESTINATION}.git` }), /HTTPS|origin|destino/i);
});

test('the GitHub host is pinned even when the caller configured another host', async () => {
  const oldHost = process.env.GH_HOST;
  process.env.GH_HOST = 'enterprise.invalid';
  try {
    const observed = await publish();
    assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
    assert.ok(observed.calls.filter(isGh).every(call => call.options.env?.GH_HOST === 'github.com'));
    const setup = observed.calls.find(call => isGh(call) && call.args[0] === 'auth' && call.args[1] === 'setup-git');
    const packageIndex = observed.calls.findIndex(call => call.args[0] === 'tools/package_handoff_assets.mjs');
    const stageIndex = observed.calls.findIndex(call => isGit(call) && gitArgs(call)[0] === 'add');
    assert.ok(observed.calls.indexOf(setup) > packageIndex && observed.calls.indexOf(setup) < stageIndex);
    assert.equal(setup.args[setup.args.indexOf('--hostname') + 1], 'github.com');
  } finally {
    if (oldHost === undefined) delete process.env.GH_HOST;
    else process.env.GH_HOST = oldHost;
  }
});

test('duplicated or unfinished assets block resume without clobbering resources', async () => {
  for (const existingAssets of [[...assets(), assets()[0]], assets().map(asset => ({ ...asset, state: 'starter' }))]) {
    const observed = await publish({ releaseExists: true, existingAssets });
    assert.equal(observed.exitCode, 1);
    assert.match(observed.errors.join('\n'), /subida|complet|estado|starter|duplic/i);
    assert.equal(observed.calls.filter(call => isGh(call) && call.args[0] === 'release' && ['upload', 'delete'].includes(call.args[1])).length, 0);
  }
});

test('a newly uploaded asset requires the expected digest rather than just the right size', async () => {
  for (const wrongDigest of [null, `sha256:${'0'.repeat(64)}`]) {
    const uploadedAssets = assets();
    uploadedAssets[0].digest = wrongDigest;
    const observed = await publish({ uploadedAssets });
    assert.equal(observed.exitCode, 1);
    assert.match(observed.errors.join('\n'), /digest|SHA256|contenido/i);
    assert.deepEqual(observed.logs, []);
  }
});

test('an annotated Release tag is resolved to its commit before recognizing a completed upload', async () => {
  const observed = await publish({ releaseExists: true, existingAssets: assets(), annotatedTag: true });
  assert.equal(observed.exitCode, 0, observed.errors.join('\n'));
  assert.ok(observed.calls.some(call => isGh(call) && call.args.includes(`repos/${DESTINATION}/git/tags/${HISTORY}`)));
});
