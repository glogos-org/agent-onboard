#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/package/services/full-test-runner-service.js';
const ARTIFACT_REL = '.agent-onboard/full-test-runner-service-extraction.json';
const MAX_COMPOSER_LINES = 4487;
const MAX_COMPOSER_BYTES = 250876;
const MAX_SERVICE_LINES = 230;
const MAX_SERVICE_BYTES = 14000;

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function run(args) {
  const result = spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const composer = read(COMPOSER_REL);
  const serviceText = read(SERVICE_REL);
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const composerMetric = metric(COMPOSER_REL);
  const serviceMetric = metric(SERVICE_REL);

  if (artifact.schema !== 'agent-onboard-public-full-test-runner-service-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W10') failures.push('artifact work_item_id must be P1S3M7W10');
  if (artifact.version !== '0.0.193') failures.push('artifact version must record W10 closure version 0.0.193');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record W10 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record W10 ratchet baseline');
  if (!composer.includes('createPublicFullTestRunnerService')) failures.push(`${COMPOSER_REL} must compose the full-test runner service`);
  if (composer.includes('function publicFullTestRunnerCompletion')) failures.push(`${COMPOSER_REL} still owns publicFullTestRunnerCompletion implementation`);
  if (composer.includes('const PUBLIC_FULL_TEST_RUNNER_COMPLETION')) failures.push(`${COMPOSER_REL} still owns full-test runner completion contract`);
  if (!serviceText.includes('function createPublicFullTestRunnerService')) failures.push(`${SERVICE_REL} must export the service factory`);
  if (!serviceText.includes('completionCheck')) failures.push(`${SERVICE_REL} must own full-test runner check behavior`);
  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicFullTestRunnerService !== 'function') failures.push(`${SERVICE_REL} must export createPublicFullTestRunnerService`);

  const fullRunnerSmoke = run(['release', '--full-test-runner']);
  const fullRunnerCheckSmoke = run(['release', '--full-test-runner-check']);
  const fastSmoke = run(['check', '--fast', '--json']);
  const releaseSmoke = run(['release', '--check']);
  const packSmoke = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  if (fullRunnerSmoke.status !== 0) failures.push(`release --full-test-runner failed: ${fullRunnerSmoke.stderr || fullRunnerSmoke.stdout}`);
  if (fullRunnerCheckSmoke.status !== 0) failures.push(`release --full-test-runner-check failed: ${fullRunnerCheckSmoke.stderr || fullRunnerCheckSmoke.stdout}`);
  if (fastSmoke.status !== 0) failures.push(`check --fast --json failed: ${fastSmoke.stderr || fastSmoke.stdout}`);
  if (releaseSmoke.status !== 0) failures.push(`release --check failed: ${releaseSmoke.stderr || releaseSmoke.stdout}`);
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-full-test-runner-service-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W10',
    composer: composerMetric,
    extracted_full_test_runner_service: serviceMetric,
    smoke_count: 5,
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
