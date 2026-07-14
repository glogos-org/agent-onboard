#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-source-module-residual-extraction-service.js';
const SECOND_SLICE_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-source-module-second-slice-service.js';
const AUTHORITY_BUNDLE_PARITY_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-source-module-authority-bundle-parity-service.js';
const ARTIFACT_REL = '.agent-onboard/source-module-residual-service-extraction.json';
const MAX_COMPOSER_LINES = 1630;
const MAX_COMPOSER_BYTES = 65922;
const MAX_SERVICE_LINES = 300;
const MAX_SERVICE_BYTES = 20000;
const MAX_SECOND_SLICE_SERVICE_LINES = 380;
const MAX_SECOND_SLICE_SERVICE_BYTES = 25000;
const MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_LINES = 210;
const MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_BYTES = 15000;

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function run(args) {
  const result = spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function parseJson(stdout, label) {
  try { return JSON.parse(stdout); } catch (error) { throw new Error(`${label} did not print valid JSON: ${error.message}`); }
}
function requireOkCommand(failures, args, expectedSchema) {
  const smoke = run(args);
  const label = args.join(' ');
  if (smoke.status !== 0) {
    failures.push(`${label} failed: ${smoke.stderr || smoke.stdout}`);
    return;
  }
  const output = parseJson(smoke.stdout, label);
  if (output.schema !== expectedSchema) failures.push(`${label} schema drifted`);
  if (output.status !== 'ok') failures.push(`${label} returned ${JSON.stringify(output.status)}`);
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const composer = read(COMPOSER_REL);
  const serviceTexts = [SERVICE_REL, SECOND_SLICE_SERVICE_REL, AUTHORITY_BUNDLE_PARITY_SERVICE_REL].map((rel) => read(rel)).join('\n');
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const composerMetric = metric(COMPOSER_REL);
  const serviceMetric = metric(SERVICE_REL);
  const secondSliceServiceMetric = metric(SECOND_SLICE_SERVICE_REL);
  const authorityBundleParityServiceMetric = metric(AUTHORITY_BUNDLE_PARITY_SERVICE_REL);

  if (artifact.schema !== 'agent-onboard-public-source-module-residual-service-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W15') failures.push('artifact work_item_id must be P1S3M7W15');
  if (artifact.version !== '0.0.198') failures.push('artifact version must record W15 closure version 0.0.198');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (secondSliceServiceMetric.lines > MAX_SECOND_SLICE_SERVICE_LINES) failures.push(`${SECOND_SLICE_SERVICE_REL} line count ${secondSliceServiceMetric.lines} exceeds ${MAX_SECOND_SLICE_SERVICE_LINES}`);
  if (secondSliceServiceMetric.bytes > MAX_SECOND_SLICE_SERVICE_BYTES) failures.push(`${SECOND_SLICE_SERVICE_REL} byte size ${secondSliceServiceMetric.bytes} exceeds ${MAX_SECOND_SLICE_SERVICE_BYTES}`);
  if (authorityBundleParityServiceMetric.lines > MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_LINES) failures.push(`${AUTHORITY_BUNDLE_PARITY_SERVICE_REL} line count ${authorityBundleParityServiceMetric.lines} exceeds ${MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_LINES}`);
  if (authorityBundleParityServiceMetric.bytes > MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_BYTES) failures.push(`${AUTHORITY_BUNDLE_PARITY_SERVICE_REL} byte size ${authorityBundleParityServiceMetric.bytes} exceeds ${MAX_AUTHORITY_BUNDLE_PARITY_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record W15 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record W15 ratchet baseline');
  if (!composer.includes('createPublicSourceModuleResidualExtractionService')) failures.push(`${COMPOSER_REL} must compose the source module residual extraction service`);
  for (const name of [
    'publicSourceModuleExtractionInstalledFallbackSmoke',
    'publicSourceModuleExtractionSecondSlicePlan',
    'publicSourceModuleExtractionSecondSliceFirstSlice',
    'publicSourceModuleExtractionAuthorityBundleParity',
    'gitignoreSecondSlicePolicy',
    'loadAuthoritySecondSliceModule'
  ]) {
    if (composer.includes(`function ${name}(`)) failures.push(`${COMPOSER_REL} still owns ${name} implementation`);
  }
  for (const token of [
    'installed_fallback_smoke_admitted',
    'planned_not_created',
    'source_only_shadow_module_applied',
    'authority_source_slice_matches_bundled_cli_view'
  ]) {
    if (!serviceTexts.includes(token)) failures.push(`source module residual service set must own ${token} validation behavior`);
    if (composer.includes(token)) failures.push(`${COMPOSER_REL} still contains ${token} residual validation behavior`);
  }
  for (const rel of [SERVICE_REL, SECOND_SLICE_SERVICE_REL, AUTHORITY_BUNDLE_PARITY_SERVICE_REL]) {
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicSourceModuleResidualExtractionService !== 'function') failures.push(`${SERVICE_REL} must export createPublicSourceModuleResidualExtractionService`);

  requireOkCommand(failures, ['architecture', '--map'], 'agent-onboard-public-architecture-map-result-001');
  requireOkCommand(failures, ['architecture', '--installed-fallback-check'], 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-check-result-001');
  requireOkCommand(failures, ['architecture', '--second-slice-check'], 'agent-onboard-public-source-module-extraction-second-slice-plan-check-result-001');
  requireOkCommand(failures, ['architecture', '--second-slice-first-slice-check'], 'agent-onboard-public-source-module-extraction-second-slice-first-slice-check-result-001');
  requireOkCommand(failures, ['architecture', '--authority-bundle-parity-check'], 'agent-onboard-public-source-module-extraction-authority-bundle-parity-check-result-001');
  requireOkCommand(failures, ['architecture', '--check'], 'agent-onboard-public-architecture-check-result-001');
  const fastSmoke = run(['check', '--fast', '--json']);
  const releaseSmoke = run(['release', '--check']);
  const packSmoke = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  if (fastSmoke.status !== 0) failures.push(`check --fast --json failed: ${fastSmoke.stderr || fastSmoke.stdout}`);
  if (releaseSmoke.status !== 0) failures.push(`release --check failed: ${releaseSmoke.stderr || releaseSmoke.stdout}`);
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-source-module-residual-service-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W15',
    composer: composerMetric,
    extracted_source_module_residual_service: serviceMetric,
    extracted_source_module_second_slice_service: secondSliceServiceMetric,
    extracted_source_module_authority_bundle_parity_service: authorityBundleParityServiceMetric,
    smoke_count: 9,
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
