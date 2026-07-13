#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAIN_SERVICE = 'cli/agent_onboard/domains/target/services/target-governance-service.js';
const SPLIT_MODULES = Object.freeze([
  'cli/agent_onboard/domains/target/services/target-governance-core.js',
  'cli/agent_onboard/domains/target/services/target-governance-preview-service.js',
  'cli/agent_onboard/domains/target/services/target-governance-index-materialization-service.js',
  'cli/agent_onboard/domains/target/services/target-governance-budget-service.js'
]);
const MAX_MAIN_LINES = 120;
const MAX_MAIN_BYTES = 12000;
const MAX_SPLIT_MODULE_LINES = 600;
const MAX_SPLIT_MODULE_BYTES = 70000;

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
  pushIf(!mainText.includes("require('./target-governance-core')"), failures, `${MAIN_SERVICE} must import target-governance-core`);
  pushIf(!mainText.includes("require('./target-governance-preview-service')"), failures, `${MAIN_SERVICE} must import target-governance-preview-service`);
  pushIf(!mainText.includes("require('./target-governance-index-materialization-service')"), failures, `${MAIN_SERVICE} must import target-governance-index-materialization-service`);
  pushIf(!mainText.includes("require('./target-governance-budget-service')"), failures, `${MAIN_SERVICE} must import target-governance-budget-service`);
  for (const forbidden of [
    'function targetGovernancePreview(targetRoot',
    'function targetGovernanceBudgetCheck(targetRoot',
    'function targetGovernanceIndexMaterializationDryRun(targetRoot',
    'function targetGovernanceIndexDriftCheck(targetRoot',
    'function buildWorkItemsIndex(document',
    'function buildClaimsIndex(entries'
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
    pushIf(!read(relativePath).includes('module.exports'), failures, `${relativePath} must expose module exports`);
    return { ...m, present: true };
  });

  const service = require(abs(MAIN_SERVICE));
  const instance = service.createTargetGovernanceService({ version: pkg.version, releaseLine: 'public_target_governance_service_split_gate' });
  for (const method of [
    'targetGovernancePreview',
    'targetGovernanceBudgetContract',
    'targetGovernanceBudgetCheck',
    'targetGovernanceIndexMaterializationDryRun',
    'targetGovernanceIndexMaterializationWrite',
    'targetGovernanceIndexRefreshAfterMutation',
    'targetGovernanceIndexDriftCheck',
    'targetGovernanceIndexDriftSummary',
    'buildTargetGovernanceWorkItemsIndex',
    'buildTargetGovernanceClaimsIndex'
  ]) {
    pushIf(typeof instance[method] !== 'function', failures, `target governance service instance missing ${method}`);
  }

  const sourceSizeBudget = JSON.parse(read('.agent-onboard/source-size-budget-ratchet.json'));
  const tracked = sourceSizeBudget.tracked_files && sourceSizeBudget.tracked_files[MAIN_SERVICE];
  pushIf(!tracked, failures, `.agent-onboard/source-size-budget-ratchet.json must track ${MAIN_SERVICE}`);
  if (tracked) {
    pushIf(tracked.max_lines !== mainMetric.lines, failures, `${MAIN_SERVICE} ratchet max_lines must equal current reduced line count ${mainMetric.lines}`);
    pushIf(tracked.max_bytes !== mainMetric.bytes, failures, `${MAIN_SERVICE} ratchet max_bytes must equal current reduced byte count ${mainMetric.bytes}`);
    pushIf(!Array.isArray(tracked.ratchet_history) || !tracked.ratchet_history.some((entry) => entry.work_item_id === 'P1S3M6W29'), failures, `${MAIN_SERVICE} ratchet history must record P1S3M6W29`);
  }

  const joined = [mainText, ...SPLIT_MODULES.map(read)].join('\n').toLowerCase();
  for (const forbidden of ['sqlite', 'lmdb', 'mdbx', 'better-sqlite3']) {
    pushIf(joined.includes(`require('${forbidden}')`) || joined.includes(`from '${forbidden}'`), failures, `target governance service split must not import ${forbidden}`);
  }

  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-target-governance-service-split-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M6W29',
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
