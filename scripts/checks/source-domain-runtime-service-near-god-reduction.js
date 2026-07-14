#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/source-domain-runtime-service-near-god-reduction.json';
const CLAIMS_FACADE_REL = 'cli/agent_onboard/domains/architecture/services/source-domains/claims-source-domain-service.js';
const WORK_ITEMS_FACADE_REL = 'cli/agent_onboard/domains/architecture/services/source-domains/work-items-source-domain-service.js';
const SERVICE_RELS = Object.freeze([
  'cli/agent_onboard/domains/architecture/services/source-domains/claims/plan-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/claims/first-slice-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/claims/bundle-parity-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/claims/runtime-bridge-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/claims/installed-fallback-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items/plan-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items/first-slice-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items/bundle-parity-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items/runtime-bridge-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items/installed-fallback-service.js'
]);
const COMMAND_SMOKES = Object.freeze([
  [['architecture', '--work-items-check'], 'agent-onboard-public-work-items-domain-source-extraction-plan-check-result-001'],
  [['architecture', '--work-items-first-slice-check'], 'agent-onboard-public-source-module-work-items-first-slice-check-result-001'],
  [['architecture', '--work-items-bundle-parity-check'], 'agent-onboard-public-source-module-work-items-bundle-parity-check-result-001'],
  [['architecture', '--work-items-runtime-bridge-check'], 'agent-onboard-public-source-module-work-items-runtime-bridge-check-result-001'],
  [['architecture', '--work-items-installed-fallback-check'], 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-check-result-001'],
  [['architecture', '--claims-check'], 'agent-onboard-public-claims-domain-source-extraction-plan-check-result-001'],
  [['architecture', '--claims-first-slice-check'], 'agent-onboard-public-source-module-claims-first-slice-check-result-001'],
  [['architecture', '--claims-bundle-parity-check'], 'agent-onboard-public-source-module-claims-bundle-parity-check-result-001'],
  [['architecture', '--claims-runtime-bridge-check'], 'agent-onboard-public-source-module-claims-runtime-bridge-check-result-001'],
  [['architecture', '--claims-installed-fallback-check'], 'agent-onboard-public-source-module-claims-installed-fallback-smoke-check-result-001'],
  [['architecture', '--source-domain-closure-check'], 'agent-onboard-public-source-domain-extraction-stabilization-closure-review-check-result-001']
]);

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runNode(args, timeout = 120000) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function requireOkCommand(failures, args, expectedSchema) {
  const smoke = runNode(['cli/agent-onboard.js', ...args]);
  const label = ['agent-onboard', ...args].join(' ');
  if (smoke.status !== 0) {
    failures.push(`${label} failed: ${smoke.stderr || smoke.stdout}`);
    return;
  }
  let output;
  try {
    output = JSON.parse(smoke.stdout);
  } catch (error) {
    failures.push(`${label} did not print valid JSON: ${error.message}`);
    return;
  }
  if (output.schema !== expectedSchema) failures.push(`${label} schema drifted`);
  if (output.status !== 'ok') failures.push(`${label} returned ${JSON.stringify(output.status)}`);
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const artifact = fs.existsSync(abs(ARTIFACT_REL)) ? readJson(ARTIFACT_REL) : null;
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const runtimeContractsPackFiles = new Set(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES || []);
  const claimsFacade = read(CLAIMS_FACADE_REL);
  const workItemsFacade = read(WORK_ITEMS_FACADE_REL);
  const serviceMetrics = SERVICE_RELS.map(metric);

  if (!artifact) failures.push(`${ARTIFACT_REL} missing`);
  else {
    if (artifact.schema !== 'agent-onboard-public-source-domain-runtime-service-near-god-reduction-closure-001') failures.push('artifact schema mismatch');
    if (artifact.work_item_id !== 'P1S3M7W20') failures.push('artifact work_item_id must be P1S3M7W20');
    if (artifact.version !== '0.0.203') failures.push('artifact version must record W20 closure version 0.0.203');
  }
  if (pkg.version !== '0.0.203') failures.push(`package.json version must be 0.0.203, got ${pkg.version}`);
  if (contracts.RELEASE_LINE !== 'public_source_domain_runtime_service_near_god_reduction_gate') failures.push('runtime release line must record W20 gate');

  for (const rel of SERVICE_RELS) {
    if (!fs.existsSync(abs(rel))) failures.push(`extracted service missing: ${rel}`);
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!runtimeContractsPackFiles.has(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  for (const item of [metric(CLAIMS_FACADE_REL), metric(WORK_ITEMS_FACADE_REL), ...serviceMetrics]) {
    if (item.lines > 500) failures.push(`${item.path} has ${item.lines} lines; source-domain services must stay below 500 lines`);
    if (item.bytes > 51200) failures.push(`${item.path} has ${item.bytes} bytes; source-domain services must stay below near-god byte threshold`);
  }
  for (const token of [
    'function publicClaimsDomainSourceExtractionPlan(',
    'function publicClaimsDomainSourceExtractionFirstSlice(',
    'function publicClaimsDomainSourceExtractionBundleParity(',
    'function publicClaimsDomainSourceExtractionRuntimeBridge(',
    'function publicClaimsDomainSourceExtractionInstalledFallbackSmoke('
  ]) {
    if (claimsFacade.includes(token)) failures.push(`${CLAIMS_FACADE_REL} still owns residual implementation ${token}`);
  }
  for (const token of [
    'function publicWorkItemsDomainSourceExtractionPlan(',
    'function publicWorkItemsDomainSourceExtractionFirstSlice(',
    'function publicWorkItemsDomainSourceExtractionBundleParity(',
    'function publicWorkItemsDomainSourceExtractionRuntimeBridge(',
    'function publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke('
  ]) {
    if (workItemsFacade.includes(token)) failures.push(`${WORK_ITEMS_FACADE_REL} still owns residual implementation ${token}`);
  }
  for (const [args, schema] of COMMAND_SMOKES) requireOkCommand(failures, args, schema);

  const sourceSizeBudget = runNode(['scripts/check.js', 'source-size-budget']);
  if (sourceSizeBudget.status !== 0) failures.push(`source-size-budget failed: ${sourceSizeBudget.stderr || sourceSizeBudget.stdout}`);
  const godBudget = runNode(['scripts/check.js', 'god-file-budget-enforcement-closure']);
  if (godBudget.status !== 0) failures.push(`god-file-budget-enforcement-closure failed: ${godBudget.stderr || godBudget.stdout}`);
  const releaseCheck = runNode(['cli/agent-onboard.js', 'release', '--check']);
  if (releaseCheck.status !== 0) failures.push(`release --check failed: ${releaseCheck.stderr || releaseCheck.stdout}`);

  const result = {
    schema: 'agent-onboard-public-source-domain-runtime-service-near-god-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W20',
    facades: [metric(CLAIMS_FACADE_REL), metric(WORK_ITEMS_FACADE_REL)],
    extracted_services: serviceMetrics,
    smoke_count: COMMAND_SMOKES.length + 3,
    boundary: {
      writes_files: false,
      mutates_git: false,
      network: false,
      publishes_package: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false
    },
    failures
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
}

main();
