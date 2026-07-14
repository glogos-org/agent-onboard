'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(ROOT, 'cli', 'agent-onboard.js');
const PACKAGE_JSON = require(path.join(ROOT, 'package.json'));
const EXPECTED_VERSION = PACKAGE_JSON.version;
const EXPECTED_RELEASE_LINE = 'public_source_module_residual_service_extraction_gate';
const EXPECTED_VERSIONED_NPX = `npx agent-onboard@${EXPECTED_VERSION}`;
const TARGET_CONFIG_FILE = '.agent-onboard/target.json';
const EXPECTED_PACK_FILES = Array.from(new Set(PACKAGE_JSON.files.concat(['package.json'])));
const EXPECTED_PACK_FILES_SORTED = EXPECTED_PACK_FILES.slice().sort();

function copyExpectedPackFiles(targetRoot) {
  for (const rel of EXPECTED_PACK_FILES) {
    const targetPath = path.join(targetRoot, rel);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), targetPath);
  }
}

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: opts.cwd || ROOT,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
  });
}

function targetConfigPath(root) {
  return path.join(root, TARGET_CONFIG_FILE);
}

function writeTargetConfig(root, content) {
  const file = targetConfigPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function readJsonOutput(result) {
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function readJsonFailure(result) {
  assert.notStrictEqual(result.status, 0, result.stderr || result.stdout || (result.error && result.error.message));
  return JSON.parse(result.stdout);
}

function readJsonlFile(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readClosureArchiveByRef(root) {
  const archivePath = path.join(root, '.agent-onboard', 'state', 'closures', 'work-items-closures.jsonl');
  const payloadCache = new Map();
  function payloadRows(rel) {
    if (!payloadCache.has(rel)) payloadCache.set(rel, readJsonlFile(path.join(root, rel)));
    return payloadCache.get(rel);
  }
  return new Map(readJsonlFile(archivePath).map((record) => {
    if (record && record.schema === 'agent-onboard-work-item-closure-compact-reference-001' && typeof record.payload_ref === 'string') {
      const rows = payloadRows(record.payload_ref);
      const payload = Number.isInteger(record.payload_record_index) ? rows[record.payload_record_index] : rows.find((row) => row.closure_id === record.closure_id);
      if (payload) return [record.closure_id, payload];
    }
    return [record.closure_id, record];
  }));
}

function runNpmPackDryRun() {
  // Avoid child_process shell=true for Node 24 DEP0190, while still handling
  // Windows npm.cmd correctly by invoking cmd.exe explicitly.
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm pack --dry-run --json'], {
      cwd: ROOT,
      encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
    });
  }
  return spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
  });
}

function runNpm(args, cwd) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', ['npm', ...args].join(' ')], {
      cwd,
      encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
    });
  }
  return spawnSync('npm', args, {
    cwd,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
  });
}

function packSourceTarball() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-pack-'));
  const pack = runNpm(['pack', ROOT, '--json'], dir);
  assert.strictEqual(pack.status, 0, pack.stderr || pack.stdout || (pack.error && pack.error.message));
  const parsed = JSON.parse(pack.stdout);
  assert.strictEqual(parsed.length, 1);
  return path.join(dir, parsed[0].filename);
}

function runNodeScript(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
  });
}

function tempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-test-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'target-fixture' }, null, 2) + '\n');
  return dir;
}

function cliTargetConfigForTest(dir) {
  const result = run(['target-config', '--template'], { cwd: dir });
  return readJsonOutput(result).target_config;
}

function writeWorkItemsLedger(dir, ledger) {
  fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(ledger, null, 2) + '\n');
}


module.exports = {
  assert,
  fs,
  os,
  path,
  spawnSync,
  ROOT,
  CLI,
  PACKAGE_JSON,
  EXPECTED_VERSION,
  EXPECTED_RELEASE_LINE,
  EXPECTED_VERSIONED_NPX,
  TARGET_CONFIG_FILE,
  EXPECTED_PACK_FILES,
  EXPECTED_PACK_FILES_SORTED,
  copyExpectedPackFiles,
  run,
  targetConfigPath,
  writeTargetConfig,
  readJsonOutput,
  readJsonFailure,
  readJsonlFile,
  readClosureArchiveByRef,
  runNpmPackDryRun,
  runNpm,
  packSourceTarball,
  runNodeScript,
  tempRepo,
  cliTargetConfigForTest,
  writeWorkItemsLedger
};
