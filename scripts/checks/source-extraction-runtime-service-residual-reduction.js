#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/source-extraction-runtime-service-residual-reduction.json';
const FACADE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/architecture-source-extraction-service.js';
const GOLDEN_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/public-source-extraction-golden-service.js';
const ADAPTER_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/public-source-module-adapter-boundary-service.js';
const CORE_SLICE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/public-source-module-core-slice-service.js';
const CORE_RUNTIME_BRIDGE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/public-source-module-core-runtime-bridge-service.js';
const AUTHORITY_RUNTIME_BRIDGE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/source-extraction/public-source-module-authority-runtime-bridge-service.js';
const EXTRACTED_SERVICE_RELS = Object.freeze([
  GOLDEN_SERVICE_REL,
  ADAPTER_SERVICE_REL,
  CORE_SLICE_SERVICE_REL,
  CORE_RUNTIME_BRIDGE_SERVICE_REL,
  AUTHORITY_RUNTIME_BRIDGE_SERVICE_REL
]);
const ALL_SERVICE_RELS = Object.freeze([FACADE_REL, ...EXTRACTED_SERVICE_RELS]);
const MAX_LINES = Object.freeze({
  [FACADE_REL]: 143,
  [GOLDEN_SERVICE_REL]: 210,
  [ADAPTER_SERVICE_REL]: 162,
  [CORE_SLICE_SERVICE_REL]: 372,
  [CORE_RUNTIME_BRIDGE_SERVICE_REL]: 227,
  [AUTHORITY_RUNTIME_BRIDGE_SERVICE_REL]: 262
});
const MAX_BYTES = Object.freeze({
  [FACADE_REL]: 6068,
  [GOLDEN_SERVICE_REL]: 10568,
  [ADAPTER_SERVICE_REL]: 9273,
  [CORE_SLICE_SERVICE_REL]: 23151,
  [CORE_RUNTIME_BRIDGE_SERVICE_REL]: 12455,
  [AUTHORITY_RUNTIME_BRIDGE_SERVICE_REL]: 17065
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

  if (artifact.schema !== 'agent-onboard-public-source-extraction-runtime-service-residual-reduction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W17') failures.push('artifact work_item_id must be P1S3M7W17');
  if (artifact.version !== '0.0.200') failures.push('artifact version must record W17 closure version 0.0.200');
  if (pkg.version !== '0.0.200') failures.push('package.json version must be 0.0.200');
  if (contracts.RELEASE_LINE !== 'public_source_extraction_runtime_service_residual_reduction_gate') failures.push('runtime release line must record W17 gate');

  for (const item of metrics) {
    if (item.lines > MAX_LINES[item.path]) failures.push(`${item.path} line count ${item.lines} exceeds ${MAX_LINES[item.path]}`);
    if (item.bytes > MAX_BYTES[item.path]) failures.push(`${item.path} byte size ${item.bytes} exceeds ${MAX_BYTES[item.path]}`);
  }
  if (artifact.reduction.source_extraction_service_before.lines <= artifact.reduction.source_extraction_facade_after.lines) failures.push('artifact must record a source-extraction service line reduction');
  if (artifact.reduction.source_extraction_facade_after.lines !== MAX_LINES[FACADE_REL]) failures.push('artifact facade after line count must match ratchet baseline');

  for (const rel of EXTRACTED_SERVICE_RELS) {
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!runtimeContractsPackFiles.has(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  for (const token of [
    'function publicSourceExtractionGoldenOutputs(',
    'function publicSourceModuleExtractionAdapterBoundary(',
    'function publicSourceModuleExtractionFirstSlice(',
    'function publicSourceModuleExtractionRuntimeBridge(',
    'function publicSourceModuleExtractionAuthorityRuntimeBridge('
  ]) {
    if (facadeText.includes(token)) failures.push(`${FACADE_REL} still owns residual implementation: ${token}`);
  }
  for (const token of [
    'createPublicSourceExtractionGoldenService',
    'createPublicSourceModuleAdapterBoundaryService',
    'createPublicSourceModuleCoreSliceService',
    'createPublicSourceModuleCoreRuntimeBridgeService',
    'createPublicSourceModuleAuthorityRuntimeBridgeService'
  ]) {
    if (!facadeText.includes(token)) failures.push(`${FACADE_REL} must compose ${token}`);
  }
  for (const token of [
    'golden_output_freeze',
    'adapter_boundary',
    'source_only_shadow_module_applied',
    'source_context_optional_runtime_bridge_applied',
    'authority_source_context_optional_runtime_bridge_applied'
  ]) {
    if (!extractedText.includes(token)) failures.push(`extracted source-extraction service set must own ${token} behavior`);
  }

  requireOkCommand(failures, ['architecture', '--golden-check'], 'agent-onboard-public-source-extraction-golden-output-freeze-check-result-001');
  requireOkCommand(failures, ['architecture', '--adapter-check'], 'agent-onboard-public-source-module-extraction-adapter-boundary-check-result-001');
  requireOkCommand(failures, ['architecture', '--first-slice-check'], 'agent-onboard-public-source-module-extraction-first-slice-check-result-001');
  requireOkCommand(failures, ['architecture', '--bundle-parity-check'], 'agent-onboard-public-source-module-extraction-bundle-parity-check-result-001');
  requireOkCommand(failures, ['architecture', '--runtime-bridge-check'], 'agent-onboard-public-source-module-extraction-runtime-bridge-check-result-001');
  requireOkCommand(failures, ['architecture', '--authority-runtime-bridge-check'], 'agent-onboard-public-source-module-extraction-authority-runtime-bridge-check-result-001');
  requireOkCommand(failures, ['architecture', '--check'], 'agent-onboard-public-architecture-check-result-001');
  requireOkCommand(failures, ['check', '--fast', '--json'], 'agent-onboard-public-check-fast-result-001');

  const sourceSizeBudget = runNode(['scripts/check.js', 'source-size-budget']);
  if (sourceSizeBudget.status !== 0) failures.push(`source-size-budget failed: ${sourceSizeBudget.stderr || sourceSizeBudget.stdout}`);
  const godBudget = runNode(['scripts/check.js', 'god-file-budget-enforcement-closure']);
  if (godBudget.status !== 0) failures.push(`god-file-budget-enforcement-closure failed: ${godBudget.stderr || godBudget.stdout}`);
  const releaseCheck = runNode(['cli/agent-onboard.js', 'release', '--check']);
  if (releaseCheck.status !== 0) failures.push(`release --check failed: ${releaseCheck.stderr || releaseCheck.stdout}`);
  const packSmoke = runNpm(['pack', '--dry-run', '--json']);
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-source-extraction-runtime-service-residual-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W17',
    source_extraction_facade: metrics[0],
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
