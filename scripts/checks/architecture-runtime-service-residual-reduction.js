#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/architecture-runtime-service-residual-reduction.json';
const ARCHITECTURE_RUNTIME_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/architecture-runtime-service.js';
const ROUTER_FACADE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-architecture-router-facade-service.js';
const AUTHORITY_STATE_SHARD_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-authority-state-shard-service.js';
const AUTHORITY_FIRST_READ_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-authority-first-read-service.js';
const TARGET_RUNTIME_NAMESPACE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-target-runtime-namespace-service.js';
const SOURCE_DOMAIN_REHEARSAL_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-source-domain-rehearsal-service.js';
const ARCHITECTURE_TRANSITION_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-architecture-transition-service.js';
const NEW_SERVICE_RELS = Object.freeze([
  ROUTER_FACADE_SERVICE_REL,
  AUTHORITY_STATE_SHARD_SERVICE_REL,
  AUTHORITY_FIRST_READ_SERVICE_REL,
  TARGET_RUNTIME_NAMESPACE_SERVICE_REL,
  SOURCE_DOMAIN_REHEARSAL_SERVICE_REL,
  ARCHITECTURE_TRANSITION_SERVICE_REL
]);
const MAX_LINES = Object.freeze({
  [ARCHITECTURE_RUNTIME_SERVICE_REL]: 297,
  [ROUTER_FACADE_SERVICE_REL]: 331,
  [AUTHORITY_STATE_SHARD_SERVICE_REL]: 436,
  [AUTHORITY_FIRST_READ_SERVICE_REL]: 314,
  [TARGET_RUNTIME_NAMESPACE_SERVICE_REL]: 164,
  [SOURCE_DOMAIN_REHEARSAL_SERVICE_REL]: 183,
  [ARCHITECTURE_TRANSITION_SERVICE_REL]: 225
});
const MAX_BYTES = Object.freeze({
  [ARCHITECTURE_RUNTIME_SERVICE_REL]: 11870,
  [ROUTER_FACADE_SERVICE_REL]: 17744,
  [AUTHORITY_STATE_SHARD_SERVICE_REL]: 19326,
  [AUTHORITY_FIRST_READ_SERVICE_REL]: 16011,
  [TARGET_RUNTIME_NAMESPACE_SERVICE_REL]: 8629,
  [SOURCE_DOMAIN_REHEARSAL_SERVICE_REL]: 11394,
  [ARCHITECTURE_TRANSITION_SERVICE_REL]: 13202
});

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function runCli(args) { return runNode(['cli/agent-onboard.js', ...args]); }
function requireOkCommand(failures, args, expectedSchema) {
  const smoke = runCli(args);
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
  const runtimeText = read(ARCHITECTURE_RUNTIME_SERVICE_REL);
  const serviceTexts = NEW_SERVICE_RELS.map((rel) => read(rel)).join('\n');
  const metrics = [ARCHITECTURE_RUNTIME_SERVICE_REL, ...NEW_SERVICE_RELS].map(metric);

  if (artifact.schema !== 'agent-onboard-public-architecture-runtime-service-residual-reduction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W16') failures.push('artifact work_item_id must be P1S3M7W16');
  if (artifact.version !== '0.0.199') failures.push('artifact version must record W16 closure version 0.0.199');
  if (pkg.version !== '0.0.199') failures.push('package.json version must be 0.0.199');
  if (contracts.RELEASE_LINE !== 'public_architecture_runtime_service_residual_reduction_gate') failures.push('runtime release line must record W16 gate');

  for (const item of metrics) {
    if (item.lines > MAX_LINES[item.path]) failures.push(`${item.path} line count ${item.lines} exceeds ${MAX_LINES[item.path]}`);
    if (item.bytes > MAX_BYTES[item.path]) failures.push(`${item.path} byte size ${item.bytes} exceeds ${MAX_BYTES[item.path]}`);
  }
  if (artifact.reduction.architecture_runtime_service_after.lines !== MAX_LINES[ARCHITECTURE_RUNTIME_SERVICE_REL]) failures.push('artifact architecture_runtime_service_after.lines must record W16 ratchet baseline');
  if (artifact.reduction.architecture_runtime_service_before.lines <= artifact.reduction.architecture_runtime_service_after.lines) failures.push('artifact must record a line reduction');

  for (const rel of NEW_SERVICE_RELS) {
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!runtimeContractsPackFiles.has(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  for (const token of [
    'function publicAuthorityStateShardingSeed(',
    'function publicAuthorityCompactIndex(',
    'function publicAuthorityFirstRead(',
    'function publicTargetRuntimeNamespace(',
    'function publicSourceDomainExtractionRehearsal(',
    'function publicArchitectureM1ClosureM2Seed('
  ]) {
    if (runtimeText.includes(token)) failures.push(`${ARCHITECTURE_RUNTIME_SERVICE_REL} still owns residual implementation: ${token}`);
  }
  for (const token of [
    'authority_state_shards',
    'compact_authority_index',
    'target_runtime_namespace',
    'rehearsed_not_applied',
    'milestone_transition'
  ]) {
    if (!serviceTexts.includes(token)) failures.push(`extracted architecture runtime service set must own ${token} behavior`);
  }

  requireOkCommand(failures, ['architecture', '--check'], 'agent-onboard-public-architecture-check-result-001');
  requireOkCommand(failures, ['authority', '--check'], 'agent-onboard-public-authority-first-read-check-result-001');
  requireOkCommand(failures, ['authority', '--index-check'], 'agent-onboard-public-authority-compact-index-check-result-001');
  requireOkCommand(failures, ['authority', '--state-check'], 'agent-onboard-public-authority-state-sharding-seed-check-result-001');
  requireOkCommand(failures, ['target', 'runtime', '--check'], 'agent-onboard-public-target-runtime-namespace-check-result-001');
  requireOkCommand(failures, ['check', '--fast', '--json'], 'agent-onboard-public-check-fast-result-001');

  const sourceSizeBudget = runNode(['scripts/check.js', 'source-size-budget']);
  if (sourceSizeBudget.status !== 0) failures.push(`source-size-budget failed: ${sourceSizeBudget.stderr || sourceSizeBudget.stdout}`);
  const packSmoke = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-architecture-runtime-service-residual-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W16',
    architecture_runtime_service: metrics[0],
    extracted_services: metrics.slice(1),
    smoke_count: 8,
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
