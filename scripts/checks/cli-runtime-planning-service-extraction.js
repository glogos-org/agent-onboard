#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-cli-runtime-planning-service.js';
const ARTIFACT_REL = '.agent-onboard/cli-runtime-planning-service-extraction.json';
const MAX_COMPOSER_LINES = 4338;
const MAX_COMPOSER_BYTES = 240173;
const MAX_SERVICE_LINES = 210;
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

  if (artifact.schema !== 'agent-onboard-public-cli-runtime-planning-service-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W11') failures.push('artifact work_item_id must be P1S3M7W11');
  if (artifact.version !== '0.0.194') failures.push('artifact version must record W11 closure version 0.0.194');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record W11 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record W11 ratchet baseline');
  if (!composer.includes('createPublicCliRuntimePlanningService')) failures.push(`${COMPOSER_REL} must compose the CLI runtime planning service`);
  if (composer.includes('function publicCliRuntimeDeMonolithPlanning')) failures.push(`${COMPOSER_REL} still owns publicCliRuntimeDeMonolithPlanning implementation`);
  if (composer.includes('function publicCliRuntimeDeMonolithPlanningCheck')) failures.push(`${COMPOSER_REL} still owns publicCliRuntimeDeMonolithPlanningCheck implementation`);
  if (!serviceText.includes('function createPublicCliRuntimePlanningService')) failures.push(`${SERVICE_REL} must export the service factory`);
  if (!serviceText.includes('cli_runtime_de_monolith_plan_admitted')) failures.push(`${SERVICE_REL} must own CLI runtime planning validation behavior`);
  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicCliRuntimePlanningService !== 'function') failures.push(`${SERVICE_REL} must export createPublicCliRuntimePlanningService`);

  const planSmoke = run(['architecture', '--cli-runtime-plan']);
  const checkSmoke = run(['architecture', '--cli-runtime-check']);
  if (planSmoke.status !== 0) failures.push(`architecture --cli-runtime-plan failed: ${planSmoke.stderr || planSmoke.stdout}`);
  if (checkSmoke.status !== 0) failures.push(`architecture --cli-runtime-check failed: ${checkSmoke.stderr || checkSmoke.stdout}`);
  else {
    const output = parseJson(checkSmoke.stdout, 'architecture --cli-runtime-check');
    if (output.schema !== 'agent-onboard-public-cli-runtime-de-monolith-planning-check-result-001') failures.push('architecture --cli-runtime-check schema drifted');
    if (output.status !== 'ok') failures.push(`architecture --cli-runtime-check returned ${JSON.stringify(output.status)}`);
  }

  const result = {
    schema: 'agent-onboard-public-cli-runtime-planning-service-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W11',
    composer: composerMetric,
    extracted_cli_runtime_planning_service: serviceMetric,
    smoke_count: 2,
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
