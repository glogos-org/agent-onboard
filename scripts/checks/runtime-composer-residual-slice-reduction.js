#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const TARGET_MEMORY_REL = 'cli/agent_onboard/domains/target/services/target-memory-service.js';
const TARGET_SERVICE_REL = 'cli/agent_onboard/domains/target/services/target-service.js';
const ARTIFACT_REL = '.agent-onboard/runtime-composer-residual-slice-reduction.json';
const MAX_COMPOSER_LINES = 7008;
const MAX_COMPOSER_BYTES = 384741;
const REMOVED_DEAD_DUPLICATE_NAMES = Object.freeze([
  'publicArchitectureMap',
  'publicSourceModuleExtractionInstalledFallbackSmoke',
  'publicSourceModuleExtractionInstalledFallbackSmokeCheck',
  'publicSourceModuleExtractionSecondSlicePlan',
  'publicSourceModuleExtractionSecondSlicePlanCheck',
  'publicSourceModuleExtractionSecondSliceFirstSlice',
  'publicSourceModuleExtractionSecondSliceFirstSliceCheck',
  'publicSourceModuleExtractionAuthorityBundleParity',
  'publicSourceModuleExtractionAuthorityBundleParityCheck'
]);

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function regexCount(text, re) { const matches = text.match(re); return matches ? matches.length : 0; }

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const composer = read(COMPOSER_REL);
  const targetService = read(TARGET_SERVICE_REL);
  const artifact = readJson(ARTIFACT_REL);
  const composerMetric = metric(COMPOSER_REL);
  const targetMemoryMetric = metric(TARGET_MEMORY_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);

  if (artifact.schema !== 'agent-onboard-public-runtime-composer-residual-slice-reduction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W1') failures.push('artifact work_item_id must be P1S3M7W1');
  if (artifact.version !== '0.0.184') failures.push('artifact version must record the W1 closure version 0.0.184');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines > composerMetric.lines) {
    // Later clean-compaction gates may reduce the composer below the W1 closure point; W1 remains a historical closure artifact.
  }
  if (composerMetric.lines > artifact.reduction.runtime_composer_after.lines) failures.push('runtime composer grew beyond W1 artifact line budget');
  if (composerMetric.bytes > artifact.reduction.runtime_composer_after.bytes) failures.push('runtime composer grew beyond W1 artifact byte budget');

  for (const name of REMOVED_DEAD_DUPLICATE_NAMES) {
    const count = regexCount(composer, new RegExp(`function\\s+${name}\\s*\\(`, 'g'));
    if (count !== 1) failures.push(`${COMPOSER_REL} must contain exactly one ${name} definition; found ${count}`);
  }
  for (const oldOwner of [
    'const TARGET_MEMORY_SURFACE_CANDIDATES',
    'const TARGET_ROOT_MANIFEST_CANDIDATES',
    'function safeRelativeStat(',
    'function targetMemoryRootManifest(',
    'function targetMemoryDescriptor(',
    'function targetMemoryText('
  ]) {
    if (composer.includes(oldOwner)) failures.push(`${COMPOSER_REL} still owns target memory slice: ${oldOwner}`);
  }

  if (!fs.existsSync(abs(TARGET_MEMORY_REL))) failures.push(`${TARGET_MEMORY_REL} is missing`);
  if (!targetService.includes("require('./target-memory-service')")) failures.push(`${TARGET_SERVICE_REL} must compose target-memory-service`);
  if (!packageFiles.has(TARGET_MEMORY_REL)) failures.push('package.json#files must include target-memory-service');
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(TARGET_MEMORY_REL)) failures.push('runtime contracts must include target-memory-service in pack files');
  const targetMemoryService = require(abs(TARGET_MEMORY_REL));
  if (typeof targetMemoryService.createTargetMemoryService !== 'function') failures.push(`${TARGET_MEMORY_REL} must export createTargetMemoryService`);
  if (targetMemoryMetric.lines > 300 || targetMemoryMetric.bytes > 32768) failures.push(`${TARGET_MEMORY_REL} must remain a bounded extracted slice`);

  const result = {
    schema: 'agent-onboard-public-runtime-composer-residual-slice-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W1',
    composer: composerMetric,
    extracted_target_memory_service: targetMemoryMetric,
    removed_dead_duplicate_function_count: REMOVED_DEAD_DUPLICATE_NAMES.length,
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
