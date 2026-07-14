#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-router-seed-service.js';
const ARTIFACT_REL = '.agent-onboard/router-seed-service-extraction.json';
const MAX_COMPOSER_LINES = 3946;
const MAX_COMPOSER_BYTES = 216148;
const MAX_SERVICE_LINES = 470;
const MAX_SERVICE_BYTES = 29000;

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

  if (artifact.schema !== 'agent-onboard-public-router-seed-service-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W12') failures.push('artifact work_item_id must be P1S3M7W12');
  if (artifact.version !== '0.0.195') failures.push('artifact version must record W12 closure version 0.0.195');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record W12 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record W12 ratchet baseline');
  if (!composer.includes('createPublicRouterSeedService')) failures.push(`${COMPOSER_REL} must compose the router seed service`);
  if (composer.includes('function publicThinCliRouterSeed')) failures.push(`${COMPOSER_REL} still owns publicThinCliRouterSeed implementation`);
  if (composer.includes('function publicCompatibilityCommandPortSeed')) failures.push(`${COMPOSER_REL} still owns publicCompatibilityCommandPortSeed implementation`);
  if (!serviceText.includes('function createPublicRouterSeedService')) failures.push(`${SERVICE_REL} must export the service factory`);
  if (!serviceText.includes('thin_cli_router_seed_admitted')) failures.push(`${SERVICE_REL} must own thin router seed validation behavior`);
  if (!serviceText.includes('compatibility_command_port_seed_admitted')) failures.push(`${SERVICE_REL} must own compatibility port seed validation behavior`);
  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicRouterSeedService !== 'function') failures.push(`${SERVICE_REL} must export createPublicRouterSeedService`);

  const thinPlanSmoke = run(['architecture', '--thin-router']);
  const thinCheckSmoke = run(['architecture', '--thin-router-check']);
  const compatibilityPlanSmoke = run(['architecture', '--compatibility-port']);
  const compatibilityCheckSmoke = run(['architecture', '--compatibility-port-check']);
  const fastSmoke = run(['check', '--fast', '--json']);
  const releaseSmoke = run(['release', '--check']);
  const packSmoke = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 16 });
  if (thinPlanSmoke.status !== 0) failures.push(`architecture --thin-router failed: ${thinPlanSmoke.stderr || thinPlanSmoke.stdout}`);
  if (thinCheckSmoke.status !== 0) failures.push(`architecture --thin-router-check failed: ${thinCheckSmoke.stderr || thinCheckSmoke.stdout}`);
  else {
    const output = parseJson(thinCheckSmoke.stdout, 'architecture --thin-router-check');
    if (output.schema !== 'agent-onboard-public-thin-cli-router-seed-check-result-001') failures.push('architecture --thin-router-check schema drifted');
    if (output.status !== 'ok') failures.push(`architecture --thin-router-check returned ${JSON.stringify(output.status)}`);
  }
  if (compatibilityPlanSmoke.status !== 0) failures.push(`architecture --compatibility-port failed: ${compatibilityPlanSmoke.stderr || compatibilityPlanSmoke.stdout}`);
  if (compatibilityCheckSmoke.status !== 0) failures.push(`architecture --compatibility-port-check failed: ${compatibilityCheckSmoke.stderr || compatibilityCheckSmoke.stdout}`);
  else {
    const output = parseJson(compatibilityCheckSmoke.stdout, 'architecture --compatibility-port-check');
    if (output.schema !== 'agent-onboard-public-compatibility-command-port-seed-check-result-001') failures.push('architecture --compatibility-port-check schema drifted');
    if (output.status !== 'ok') failures.push(`architecture --compatibility-port-check returned ${JSON.stringify(output.status)}`);
  }
  if (fastSmoke.status !== 0) failures.push(`check --fast --json failed: ${fastSmoke.stderr || fastSmoke.stdout}`);
  if (releaseSmoke.status !== 0) failures.push(`release --check failed: ${releaseSmoke.stderr || releaseSmoke.stdout}`);
  if (packSmoke.status !== 0) failures.push(`npm pack --dry-run --json failed: ${packSmoke.stderr || packSmoke.stdout}`);

  const result = {
    schema: 'agent-onboard-public-router-seed-service-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W12',
    composer: composerMetric,
    extracted_router_seed_service: serviceMetric,
    smoke_count: 7,
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
