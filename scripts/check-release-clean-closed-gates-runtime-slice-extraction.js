#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULES = Object.freeze([
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates-runtime-slice-service.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/clean-compaction-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/keyword-readme-plan-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/readme-history-archive-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/readme-history-apply-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-compaction-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-apply-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-reader-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-plan-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-dry-run-runtime.js',
  'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-apply-runtime.js'
]);
const COMPOSER = 'cli/agent_onboard/runtime-composer.js';
const AGGREGATOR = MODULES[0];
const MAX_COMPOSER_LINES = 7906;
const MAX_COMPOSER_BYTES = 440574;
const MAX_SLICE_MODULE_LINES = 600;
const MAX_SLICE_MODULE_BYTES = 81920;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lines(text) {
  return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function bytes(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function failIf(condition, failures, message) {
  if (condition) failures.push(message);
}

function main() {
  const failures = [];
  const pkg = JSON.parse(read('package.json'));
  const composer = read(COMPOSER);
  const composerLines = lines(composer);
  const composerBytes = bytes(COMPOSER);
  failIf(composerLines > MAX_COMPOSER_LINES, failures, `${COMPOSER} has ${composerLines} lines; maximum is ${MAX_COMPOSER_LINES}`);
  failIf(composerBytes > MAX_COMPOSER_BYTES, failures, `${COMPOSER} has ${composerBytes} bytes; maximum is ${MAX_COMPOSER_BYTES}`);
  failIf(!composer.includes('createPublicReleaseCleanClosedGatesRuntimeSliceService'), failures, `${COMPOSER} must compose the extracted release clean closed gates slice`);
  for (const forbidden of [
    'const PUBLIC_CLEAN_COMPACTION_BASELINE',
    'const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN',
    'const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY'
  ]) {
    failIf(composer.includes(forbidden), failures, `${COMPOSER} must not retain ${forbidden}`);
  }
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const moduleReports = MODULES.map((rel) => {
    const present = fs.existsSync(path.join(ROOT, rel));
    const text = present ? read(rel) : '';
    const metric = { path: rel, present, lines: present ? lines(text) : 0, bytes: present ? bytes(rel) : 0 };
    failIf(!present, failures, `${rel} is missing`);
    failIf(present && metric.lines > MAX_SLICE_MODULE_LINES, failures, `${rel} has ${metric.lines} lines; maximum is ${MAX_SLICE_MODULE_LINES}`);
    failIf(present && metric.bytes > MAX_SLICE_MODULE_BYTES, failures, `${rel} has ${metric.bytes} bytes; maximum is ${MAX_SLICE_MODULE_BYTES}`);
    failIf(!packageFiles.has(rel), failures, `package.json#files must include ${rel}`);
    return metric;
  });
  const aggregator = read(AGGREGATOR);
  failIf(!aggregator.includes('release-clean-closed-gates/clean-compaction-runtime'), failures, 'aggregator must load clean compaction runtime slice module');
  failIf(!aggregator.includes('release-clean-closed-gates/closed-gate-prune-apply-runtime'), failures, 'aggregator must load closed gate prune apply runtime slice module');
  const joined = MODULES.map(read).join('\n').toLowerCase();
  for (const forbidden of ['sqlite', 'lmdb', 'mdbx', 'better-sqlite3']) {
    const requireToken = `require('${forbidden}')`;
    const importToken = `from '${forbidden}'`;
    failIf(joined.includes(requireToken) || joined.includes(importToken), failures, `release clean closed gates slice must not import ${forbidden}`);
  }
  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-release-clean-closed-gates-runtime-slice-extraction-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M6W26',
    composer: { path: COMPOSER, lines: composerLines, bytes: composerBytes, max_lines: MAX_COMPOSER_LINES, max_bytes: MAX_COMPOSER_BYTES },
    extracted_module_count: MODULES.length,
    modules: moduleReports,
    boundary: {
      writes_files: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false,
      network: false,
      package_publish: false
    },
    failures
  }, null, 2)}\n`);
  if (status !== 'ok') process.exitCode = 1;
}

main();
