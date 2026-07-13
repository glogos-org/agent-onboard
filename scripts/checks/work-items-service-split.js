#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MAIN_SERVICE = 'cli/agent_onboard/domains/work-items/services/work-items-service.js';
const SPLIT_MODULES = Object.freeze([
  'cli/agent_onboard/domains/work-items/services/work-items-mutation-service.js',
  'cli/agent_onboard/domains/work-items/services/work-items-claim-ledger-service.js'
]);
const MAX_MAIN_LINES = 800;
const MAX_MAIN_BYTES = 65536;
const MAX_SPLIT_MODULE_LINES = 500;
const MAX_SPLIT_MODULE_BYTES = 65536;

function abs(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(abs(relativePath), 'utf8');
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function metric(relativePath) {
  const text = read(relativePath);
  return { path: relativePath, lines: lineCount(text), bytes: fs.statSync(abs(relativePath)).size };
}

function pushIf(condition, failures, message) {
  if (condition) failures.push(message);
}

function main() {
  const failures = [];
  const pkg = JSON.parse(read('package.json'));
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const mainText = read(MAIN_SERVICE);
  const mainMetric = metric(MAIN_SERVICE);

  pushIf(mainMetric.lines > MAX_MAIN_LINES, failures, `${MAIN_SERVICE} has ${mainMetric.lines} lines; maximum is ${MAX_MAIN_LINES}`);
  pushIf(mainMetric.bytes > MAX_MAIN_BYTES, failures, `${MAIN_SERVICE} has ${mainMetric.bytes} bytes; maximum is ${MAX_MAIN_BYTES}`);
  pushIf(!mainText.includes("require('./work-items-mutation-service')"), failures, `${MAIN_SERVICE} must delegate write boundary commands to work-items-mutation-service`);
  pushIf(!mainText.includes("require('./work-items-claim-ledger-service')"), failures, `${MAIN_SERVICE} must delegate claim ledger commands to work-items-claim-ledger-service`);
  for (const forbidden of [
    'function append(args) {',
    'function init(args) {',
    'function claim(args) {',
    'function close(args) {',
    'function parseClaimsLedger(file) {',
    'function appendClaimLedger(args) {'
  ]) {
    pushIf(mainText.includes(forbidden), failures, `${MAIN_SERVICE} must not retain split implementation ${forbidden}`);
  }

  const splitMetrics = SPLIT_MODULES.map((relativePath) => {
    const present = fs.existsSync(abs(relativePath));
    pushIf(!present, failures, `${relativePath} is missing`);
    pushIf(!packageFiles.has(relativePath), failures, `package.json#files must include ${relativePath}`);
    if (!present) return { path: relativePath, present: false, lines: 0, bytes: 0 };
    const m = metric(relativePath);
    pushIf(m.lines > MAX_SPLIT_MODULE_LINES, failures, `${relativePath} has ${m.lines} lines; maximum is ${MAX_SPLIT_MODULE_LINES}`);
    pushIf(m.bytes > MAX_SPLIT_MODULE_BYTES, failures, `${relativePath} has ${m.bytes} bytes; maximum is ${MAX_SPLIT_MODULE_BYTES}`);
    pushIf(!read(relativePath).includes('module.exports = Object.freeze'), failures, `${relativePath} must expose frozen exports`);
    return { ...m, present: true };
  });

  const service = require(abs(MAIN_SERVICE));
  const seed = service.describeWorkItemsServiceSeed();
  pushIf(!seed || seed.service_path !== MAIN_SERVICE, failures, 'work-items service seed path changed unexpectedly');
  const instance = service.createWorkItemsService();
  for (const method of ['schema', 'template', 'validateTemplate', 'validate', 'list', 'summary', 'next', 'mine', 'init', 'append', 'claim', 'close', 'validateClaimLedger', 'claimLifecycleCheck', 'appendClaimLedger']) {
    pushIf(typeof instance[method] !== 'function', failures, `work-items service instance missing ${method}`);
  }

  const sourceSizeBudget = JSON.parse(read('.agent-onboard/source-size-budget-ratchet.json'));
  const tracked = sourceSizeBudget.tracked_files && sourceSizeBudget.tracked_files[MAIN_SERVICE];
  pushIf(!tracked, failures, `.agent-onboard/source-size-budget-ratchet.json must track ${MAIN_SERVICE}`);
  if (tracked) {
    pushIf(tracked.max_lines !== mainMetric.lines, failures, `${MAIN_SERVICE} ratchet max_lines must equal current reduced line count ${mainMetric.lines}`);
    pushIf(tracked.max_bytes !== mainMetric.bytes, failures, `${MAIN_SERVICE} ratchet max_bytes must equal current reduced byte count ${mainMetric.bytes}`);
    pushIf(!Array.isArray(tracked.ratchet_history) || !tracked.ratchet_history.some((entry) => entry.work_item_id === 'P1S3M6W28'), failures, `${MAIN_SERVICE} ratchet history must record P1S3M6W28`);
  }

  const joined = [mainText, ...SPLIT_MODULES.map(read)].join('\n').toLowerCase();
  for (const forbidden of ['sqlite', 'lmdb', 'mdbx', 'better-sqlite3']) {
    pushIf(joined.includes(`require('${forbidden}')`) || joined.includes(`from '${forbidden}'`), failures, `work-items service split must not import ${forbidden}`);
  }

  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-work-items-service-split-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M6W28',
    main_service: mainMetric,
    split_modules: splitMetrics,
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
