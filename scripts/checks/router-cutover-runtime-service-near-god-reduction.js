#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/router-cutover-runtime-service-near-god-reduction.json';
const FACADE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-router-cutover-service.js';
const MODULAR_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-modular-runtime-package-inclusion-service.js';
const PACKAGED_PORT_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-packaged-router-port-inclusion-service.js';
const THIN_REHEARSAL_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-thin-entrypoint-rehearsal-service.js';
const THIN_CUTOVER_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-thin-entrypoint-cutover-service.js';
const ROUTER_ADAPTER_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-router-adapter-delegation-service.js';
const EXTRACTED_SERVICE_RELS = Object.freeze([
  MODULAR_SERVICE_REL,
  PACKAGED_PORT_SERVICE_REL,
  THIN_REHEARSAL_SERVICE_REL,
  THIN_CUTOVER_SERVICE_REL,
  ROUTER_ADAPTER_SERVICE_REL
]);
const ALL_SERVICE_RELS = Object.freeze([FACADE_REL, ...EXTRACTED_SERVICE_RELS]);
const MAX_LINES = Object.freeze({
  [FACADE_REL]: 32,
  [MODULAR_SERVICE_REL]: 177,
  [PACKAGED_PORT_SERVICE_REL]: 210,
  [THIN_REHEARSAL_SERVICE_REL]: 279,
  [THIN_CUTOVER_SERVICE_REL]: 227,
  [ROUTER_ADAPTER_SERVICE_REL]: 305
});
const MAX_BYTES = Object.freeze({
  [FACADE_REL]: 2527,
  [MODULAR_SERVICE_REL]: 11275,
  [PACKAGED_PORT_SERVICE_REL]: 11594,
  [THIN_REHEARSAL_SERVICE_REL]: 15037,
  [THIN_CUTOVER_SERVICE_REL]: 12295,
  [ROUTER_ADAPTER_SERVICE_REL]: 19490
});

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runNode(args, timeout = 120000) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function runNpm(args, timeout = 120000) {
  const result = spawnSync('npm', args, { cwd: ROOT, encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 * 16 });
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
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const runtimeContractsPackFiles = new Set(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES || []);
  const facadeText = read(FACADE_REL);
  const extractedText = EXTRACTED_SERVICE_RELS.map((rel) => read(rel)).join('\n');
  const metrics = ALL_SERVICE_RELS.map(metric);

  if (artifact.schema !== 'agent-onboard-public-router-cutover-runtime-service-near-god-reduction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W18') failures.push('artifact work_item_id must be P1S3M7W18');
  if (artifact.version !== '0.0.201') failures.push('artifact version must record W18 closure version 0.0.201');
  if (pkg.version !== '0.0.201') failures.push('package.json version must be 0.0.201');
  if (contracts.RELEASE_LINE !== 'public_router_cutover_runtime_service_near_god_reduction_gate') failures.push('runtime release line must record W18 gate');

  for (const item of metrics) {
    if (item.lines > MAX_LINES[item.path]) failures.push(`${item.path} line count ${item.lines} exceeds ${MAX_LINES[item.path]}`);
    if (item.bytes > MAX_BYTES[item.path]) failures.push(`${item.path} byte size ${item.bytes} exceeds ${MAX_BYTES[item.path]}`);
  }
  if (artifact.reduction.router_cutover_service_before.lines <= artifact.reduction.router_cutover_facade_after.lines) failures.push('artifact must record a router-cutover service line reduction');
  if (artifact.reduction.router_cutover_facade_after.lines !== MAX_LINES[FACADE_REL]) failures.push('artifact facade after line count must match ratchet baseline');
  if (artifact.reduction.near_god_file_removed !== true) failures.push('artifact must record near-god file removal');

  for (const rel of EXTRACTED_SERVICE_RELS) {
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!runtimeContractsPackFiles.has(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  for (const token of [
    'function publicModularRuntimePackageInclusionPlan(',
    'function publicPackagedRouterPortInclusion(',
    'function publicThinEntrypointRouterCutoverRehearsal(',
    'function publicThinEntrypointRouterCutoverApplication(',
    'function publicRouterCommandAdapterDelegationExpansion('
  ]) {
    if (facadeText.includes(token)) failures.push(`${FACADE_REL} still owns residual implementation: ${token}`);
  }
  for (const token of [
    'createPublicModularRuntimePackageInclusionService',
    'createPublicPackagedRouterPortInclusionService',
    'createPublicThinEntrypointRehearsalService',
    'createPublicThinEntrypointCutoverService',
    'createPublicRouterAdapterDelegationService'
  ]) {
    if (!facadeText.includes(token)) failures.push(`${FACADE_REL} must compose ${token}`);
  }
  for (const token of [
    'modular_runtime_package_inclusion_plan_admitted',
    'packaged_router_port_inclusion_admitted',
    'thin_entrypoint_router_cutover_rehearsed_not_applied',
    'thin_entrypoint_router_cutover_applied',
    'router_command_adapter_delegation_expanded'
  ]) {
    if (!extractedText.includes(token)) failures.push(`extracted router-cutover service set must own ${token} behavior`);
  }

  requireOkCommand(failures, ['architecture', '--module-inclusion-check'], 'agent-onboard-public-modular-runtime-package-inclusion-plan-check-result-001');
  requireOkCommand(failures, ['architecture', '--packaged-router-port-check'], 'agent-onboard-public-packaged-router-port-inclusion-check-result-001');
  requireOkCommand(failures, ['architecture', '--thin-entrypoint-rehearsal-check'], 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-check-result-001');
  requireOkCommand(failures, ['architecture', '--thin-entrypoint-cutover-check'], 'agent-onboard-public-thin-entrypoint-router-cutover-application-check-result-001');
  requireOkCommand(failures, ['architecture', '--router-adapter-delegation-check'], 'agent-onboard-public-router-command-adapter-delegation-expansion-check-result-001');
  requireOkCommand(failures, ['architecture', '--check'], 'agent-onboard-public-architecture-check-result-001');
  requireOkCommand(failures, ['check', '--fast', '--json'], 'agent-onboard-public-check-fast-result-001');

  const sourceSizeBudget = runNode(['scripts/check.js', 'source-size-budget']);
  if (sourceSizeBudget.status !== 0) failures.push(`source-size-budget failed: ${sourceSizeBudget.stderr || sourceSizeBudget.stdout}`);
  const godBudget = runNode(['scripts/check.js', 'god-file-budget-enforcement-closure']);
  if (godBudget.status !== 0) failures.push(`god-file-budget-enforcement-closure failed: ${godBudget.stderr || godBudget.stdout}`);
  const authorityState = runNode(['cli/agent-onboard.js', 'authority', '--state-check']);
  if (authorityState.status !== 0) failures.push(`authority --state-check failed: ${authorityState.stderr || authorityState.stdout}`);
  const releaseCheck = runNode(['cli/agent-onboard.js', 'release', '--check']);
  if (releaseCheck.status !== 0) failures.push(`release --check failed: ${releaseCheck.stderr || releaseCheck.stdout}`);
  const packSmoke = runNpm(['pack', '--dry-run', '--json']);
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-router-cutover-runtime-service-near-god-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W18',
    router_cutover_facade: metrics[0],
    extracted_services: metrics.slice(1),
    smoke_count: 12,
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
