#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/core/services/public-core-surface-command-runner-service.js';
const CLEAN_RUNTIME_REL = 'cli/agent_onboard/domains/package/services/release-clean-closed-gates/clean-compaction-runtime.js';
const ARTIFACT_REL = '.agent-onboard/core-surface-command-runner-extraction.json';
const MAX_COMPOSER_LINES = 5303;
const MAX_COMPOSER_BYTES = 298982;
const MAX_SERVICE_LINES = 350;
const MAX_SERVICE_BYTES = 20000;

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runCli(args) {
  const result = spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 8 });
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

  if (artifact.schema !== 'agent-onboard-public-core-surface-command-runner-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W5') failures.push('artifact work_item_id must be P1S3M7W5');
  if (artifact.version !== '0.0.188') failures.push('artifact version must record W5 closure version 0.0.188');
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) failures.push('package version must be present');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record the W5 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record the W5 ratchet baseline');
  if (!composer.includes('createPublicCoreSurfaceCommandRunnerService')) failures.push(`${COMPOSER_REL} must compose the core surface command runner service`);
  if (!composer.includes('coreSurfaceCommandRunnerService.runCommands')) failures.push(`${COMPOSER_REL} must delegate core surface commands through extracted service`);
  for (const forbidden of [
    'function help(',
    'function printVersion(',
    'function runStatus(',
    'function runCommands(',
    'function runGuide(',
    'function runQuickstart(',
    'function runDiscovery(',
    'function runCreate(',
    'function runIssue(',
    'function runContributor(',
    'function runCi(',
    'function runCheck('
  ]) {
    if (composer.includes(forbidden)) failures.push(`${COMPOSER_REL} still owns core surface command runner residual: ${forbidden}`);
  }
  if (!serviceText.includes('function createPublicCoreSurfaceCommandRunnerService(')) failures.push(`${SERVICE_REL} must export createPublicCoreSurfaceCommandRunnerService`);
  if (!serviceText.includes('checkPlanFastService.fast(packageRoot()')) failures.push(`${SERVICE_REL} must own check fast runner dispatch`);
  if (!serviceText.includes('create --write, init, dependency installation')) failures.push(`${SERVICE_REL} must preserve create command non-admission boundary`);

  const cleanPackBudget = Number((cleanRuntime.match(/max_projected_pack_files: (\d+)/u) || [])[1]);
  const cleanSourceBudget = Number((cleanRuntime.match(/max_source_files: (\d+)/u) || [])[1]);
  const cleanAgentOnboardBudget = Number((cleanRuntime.match(/max_agent_onboard_files: (\d+)/u) || [])[1]);
  if (!(cleanPackBudget >= 92) || !(cleanSourceBudget >= 263) || !(cleanAgentOnboardBudget >= 114)) failures.push(`${CLEAN_RUNTIME_REL} must admit the extracted packaged service in clean compaction budgets`);
  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicCoreSurfaceCommandRunnerService !== 'function') failures.push(`${SERVICE_REL} must export createPublicCoreSurfaceCommandRunnerService`);

  const smokes = [
    runCli(['commands', '--json']),
    runCli(['guide', '--text']),
    runCli(['check', '--fast', '--json']),
    runCli(['ci', '--github-action'])
  ];
  for (const smoke of smokes) {
    if (smoke.status !== 0) failures.push(`CLI smoke failed for ${smoke.args.join(' ')}: ${smoke.stderr || smoke.stdout}`);
  }

  const result = {
    schema: 'agent-onboard-public-core-surface-command-runner-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W5',
    composer: composerMetric,
    extracted_core_surface_command_runner_service: serviceMetric,
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
