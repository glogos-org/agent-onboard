#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { CHECK_MODULES, checkIds, checkModulePath } = require('./registry');

const ROOT = path.resolve(__dirname, '..', '..');
const DISPATCHER_REL = 'scripts/check.js';
const REGISTRY_REL = 'scripts/checks/registry.js';
const CHECKS_DIR_REL = 'scripts/checks';
const WORK_ITEM_ID = 'P1S3M6W33';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function metric(rel) {
  const text = read(rel);
  return { path: rel, lines: lineCount(text), bytes: fs.statSync(path.join(ROOT, rel)).size };
}

function listTopLevelCheckScripts() {
  return fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter((entry) => /^check-.+\.js$/u.test(entry))
    .sort();
}

function runRegistryCheck(id) {
  const result = spawnSync(process.execPath, [path.join(ROOT, DISPATCHER_REL), id], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 20 * 1024 * 1024
  });
  return {
    id,
    status: result.status,
    stdout_prefix: String(result.stdout || '').slice(0, 240),
    stderr_prefix: String(result.stderr || '').slice(0, 240)
  };
}

function main() {
  const failures = [];
  const pkg = JSON.parse(read('package.json'));
  const runTests = read('test/run-tests.js');
  const dispatcherText = read(DISPATCHER_REL);
  const registryText = read(REGISTRY_REL);
  const sourceBudget = JSON.parse(read('.agent-onboard/source-size-budget-ratchet.json'));
  const topLevelCheckScripts = listTopLevelCheckScripts();
  const canonicalModuleFiles = Array.from(new Set(Object.values(CHECK_MODULES))).sort();
  const canonicalModuleMetrics = canonicalModuleFiles.map((file) => metric(`${CHECKS_DIR_REL}/${file}`));
  const smokeIds = [
    'source-size-budget',
    'work-item-ledger-compaction',
    'closure-payload-reference-compaction'
  ];
  const smokes = smokeIds.map(runRegistryCheck);

  if (!fs.existsSync(path.join(ROOT, DISPATCHER_REL))) failures.push(`${DISPATCHER_REL} must exist`);
  if (!fs.existsSync(path.join(ROOT, REGISTRY_REL))) failures.push(`${REGISTRY_REL} must exist`);
  if (topLevelCheckScripts.length !== 0) failures.push(`top-level scripts/check-*.js wrappers must be moved behind the registry; found ${topLevelCheckScripts.join(', ')}`);
  if (!dispatcherText.includes("require('./checks/registry')")) failures.push(`${DISPATCHER_REL} must load ${REGISTRY_REL}`);
  if (!registryText.includes('CHECK_MODULES')) failures.push(`${REGISTRY_REL} must declare CHECK_MODULES`);
  if (canonicalModuleFiles.length < 20) failures.push(`check registry must own at least 20 canonical modules; found ${canonicalModuleFiles.length}`);
  for (const file of canonicalModuleFiles) {
    if (!fs.existsSync(path.join(ROOT, CHECKS_DIR_REL, file))) failures.push(`registered check module missing: ${file}`);
  }
  for (const checkId of ['source-size-budget', 'runtime-command-registry-extraction', 'closure-payload-reference-compaction', 'check-registry-compaction']) {
    if (!checkModulePath(checkId)) failures.push(`registry must resolve ${checkId}`);
  }
  for (const [name, command] of Object.entries(pkg.scripts || {})) {
    if (name.startsWith('check:') && !/^node scripts\/check\.js /u.test(command)) {
      failures.push(`package script ${name} must route through scripts/check.js; found ${command}`);
    }
  }
  if (/nodeTask\('[^']*check[^']*', \[path\.join\(ROOT, 'scripts', 'check-/u.test(runTests)) {
    failures.push('test/run-tests.js must not call top-level scripts/check-*.js directly');
  }
  if (!runTests.includes("checkRegistryTask('source size budget ratchet check', 'source-size-budget')")) {
    failures.push('test/run-tests.js must route quick registry checks through checkRegistryTask');
  }
  for (const smoke of smokes) {
    if (smoke.status !== 0) failures.push(`registry smoke ${smoke.id} failed with status ${smoke.status}: ${smoke.stderr_prefix || smoke.stdout_prefix}`);
  }

  for (const trackedPath of [DISPATCHER_REL, REGISTRY_REL]) {
    const tracked = sourceBudget.tracked_files && sourceBudget.tracked_files[trackedPath];
    if (!tracked) failures.push(`source-size ratchet must track ${trackedPath}`);
  }
  for (const item of canonicalModuleMetrics) {
    if (item.lines > 400) failures.push(`${item.path} has ${item.lines} lines; check modules must stay below 400 lines`);
    if (item.bytes > 49152) failures.push(`${item.path} has ${item.bytes} bytes; check modules must stay below 49152 bytes`);
  }
  const joined = [dispatcherText, registryText, ...canonicalModuleFiles.map((file) => read(`${CHECKS_DIR_REL}/${file}`))].join('\n').toLowerCase();
  const forbiddenImports = [
    ['require(\'', 'better', '-sqlite3', '\')'].join(''),
    ['require("', 'better', '-sqlite3', '")'].join(''),
    ['require(\'', 'sqlite'].join(''),
    ['require(\'', 'lmdb'].join(''),
    ['require(\'', 'mdbx'].join('')
  ];
  for (const forbidden of forbiddenImports) {
    if (joined.includes(forbidden)) failures.push(`check registry compaction must not introduce ${forbidden}`);
  }

  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-check-registry-compaction-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: WORK_ITEM_ID,
    dispatcher: metric(DISPATCHER_REL),
    registry: metric(REGISTRY_REL),
    canonical_module_count: canonicalModuleFiles.length,
    alias_count: checkIds().length - canonicalModuleFiles.length,
    top_level_check_scripts: topLevelCheckScripts,
    canonical_module_metrics: canonicalModuleMetrics,
    smoke_checks: smokes,
    boundary: {
      writes_files: false,
      package_publish: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false,
      network: false
    },
    failures
  }, null, 2)}\n`);
  if (status !== 'ok') process.exitCode = 1;
}

main();
