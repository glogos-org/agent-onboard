#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/package/services/target-onboarding-acceptance-service.js';
const CLEAN_RUNTIME_REL = 'cli/agent_onboard/domains/package/services/release-clean-closed-gates/clean-compaction-runtime.js';
const ARTIFACT_REL = '.agent-onboard/target-onboarding-acceptance-service-extraction.json';
const MAX_COMPOSER_LINES = 5650;
const MAX_COMPOSER_BYTES = 309900;
const MAX_SERVICE_LINES = 700;
const MAX_SERVICE_BYTES = 40000;

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runCli(args) {
  const result = spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 12
  });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const composer = read(COMPOSER_REL);
  const serviceText = read(SERVICE_REL);
  const cleanRuntime = read(CLEAN_RUNTIME_REL);
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const composerMetric = metric(COMPOSER_REL);
  const serviceMetric = metric(SERVICE_REL);

  if (artifact.schema !== 'agent-onboard-public-target-onboarding-acceptance-service-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W4') failures.push('artifact work_item_id must be P1S3M7W4');
  if (artifact.version !== '0.0.187') failures.push('artifact version must record W4 closure version 0.0.187');
  if (pkg.version !== '0.0.187') failures.push('package version must be 0.0.187');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);

  if (artifact.reduction.runtime_composer_after.lines !== composerMetric.lines) failures.push('artifact runtime_composer_after.lines is stale');
  if (artifact.reduction.runtime_composer_after.bytes !== composerMetric.bytes) failures.push('artifact runtime_composer_after.bytes is stale');
  if (!composer.includes('createPublicTargetOnboardingAcceptanceService')) failures.push(`${COMPOSER_REL} must compose the target onboarding acceptance service`);
  if (!composer.includes('publicTargetOnboardingAcceptanceService')) failures.push(`${COMPOSER_REL} must retain a named target onboarding acceptance service facade`);
  for (const forbidden of [
    'function publicInstalledPackageParitySmoke(',
    'function publicInstalledParityArchitectureSmoke(',
    'function publicTargetOnboardingInstalledPackageSmoke(',
    'function publicTargetOnboardingPostPublishHandoff(',
    'function publicTargetOnboardingPublishedAcceptance(',
    'function publicReleaseTargetRepoProductCheck('
  ]) {
    if (composer.includes(forbidden)) failures.push(`${COMPOSER_REL} still owns target onboarding acceptance residual: ${forbidden}`);
  }
  if (!serviceText.includes('function createPublicTargetOnboardingAcceptanceService(')) failures.push(`${SERVICE_REL} must export createPublicTargetOnboardingAcceptanceService`);
  if (!serviceText.includes('creates_temp_target_repository: true')) failures.push(`${SERVICE_REL} must preserve temporary target smoke boundary`);
  if (!serviceText.includes('network_registry_read_required_before_operator_acceptance: true')) failures.push(`${SERVICE_REL} must preserve post-publish registry-read boundary`);
  if (!cleanRuntime.includes('max_projected_pack_files: 91') || !cleanRuntime.includes('max_source_files: 260') || !cleanRuntime.includes('max_agent_onboard_files: 113')) failures.push(`${CLEAN_RUNTIME_REL} must admit the extracted packaged service in clean compaction budgets`);

  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicTargetOnboardingAcceptanceService !== 'function') failures.push(`${SERVICE_REL} must export createPublicTargetOnboardingAcceptanceService`);

  const smokes = [
    runCli(['release', '--target-onboarding-smoke']),
    runCli(['release', '--published-acceptance']),
    runCli(['release', '--check'])
  ];
  for (const smoke of smokes) {
    if (smoke.status !== 0) failures.push(`CLI smoke failed for ${smoke.args.join(' ')}: ${smoke.stderr || smoke.stdout}`);
  }

  const result = {
    schema: 'agent-onboard-public-target-onboarding-acceptance-service-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W4',
    composer: composerMetric,
    extracted_target_onboarding_acceptance_service: serviceMetric,
    smoke_count: smokes.length,
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
