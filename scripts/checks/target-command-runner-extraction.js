#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const RUNNER_REL = 'cli/agent_onboard/domains/target/services/target-command-runner-service.js';
const TEXT_REL = 'cli/agent_onboard/domains/target/services/target-command-text-service.js';
const ARTIFACT_REL = '.agent-onboard/target-command-runner-extraction.json';
const MAX_COMPOSER_LINES = 6459;
const MAX_COMPOSER_BYTES = 353664;
const MAX_RUNNER_LINES = 600;
const MAX_RUNNER_BYTES = 49152;

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runCli(args) {
  const result = spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 * 4 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const composer = read(COMPOSER_REL);
  const runner = read(RUNNER_REL);
  const textService = read(TEXT_REL);
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const composerMetric = metric(COMPOSER_REL);
  const runnerMetric = metric(RUNNER_REL);
  const textMetric = metric(TEXT_REL);

  if (artifact.schema !== 'agent-onboard-public-target-command-runner-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W2') failures.push('artifact work_item_id must be P1S3M7W2');
  if (artifact.version !== '0.0.185') failures.push('artifact version must record the W2 closure version 0.0.185');
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) failures.push('package version must be present');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (runnerMetric.lines > MAX_RUNNER_LINES) failures.push(`${RUNNER_REL} line count ${runnerMetric.lines} exceeds ${MAX_RUNNER_LINES}`);
  if (runnerMetric.bytes > MAX_RUNNER_BYTES) failures.push(`${RUNNER_REL} byte size ${runnerMetric.bytes} exceeds ${MAX_RUNNER_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record the W2 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record the W2 ratchet baseline');
  if (composerMetric.lines > artifact.reduction.runtime_composer_after.lines) failures.push('runtime composer regressed above W2 line baseline');
  if (composerMetric.bytes > artifact.reduction.runtime_composer_after.bytes) failures.push('runtime composer regressed above W2 byte baseline');

  if (!composer.includes('createTargetCommandRunnerService')) failures.push(`${COMPOSER_REL} must compose target command runner service`);
  if (!composer.includes('targetCommandRunnerService.runTargetCommand')) failures.push(`${COMPOSER_REL} must delegate target command routing through the extracted service`);
  for (const owner of [
    'function runTargetConfig(',
    'function runTargetDoctor(',
    'function runTargetProfile(',
    'function runTargetMetadata(',
    'function runTargetManifest(',
    'function runTargetRuntime(',
    'function runTargetCommand(',
    'function runTargetInstance('
  ]) {
    if (composer.includes(owner)) failures.push(`${COMPOSER_REL} still owns target command runner slice: ${owner}`);
  }
  if (!runner.includes('function createTargetCommandRunnerService(')) failures.push(`${RUNNER_REL} must export createTargetCommandRunnerService`);
  if (!runner.includes("require('./target-command-text-service')")) failures.push(`${RUNNER_REL} must delegate target text formatters`);
  if (!textService.includes('function formatTargetDoctorText(') || !textService.includes('function formatTargetProfileText(')) failures.push(`${TEXT_REL} must own target command text formatters`);

  for (const rel of [RUNNER_REL, TEXT_REL]) {
    if (!packageFiles.has(rel)) failures.push(`package.json#files must include ${rel}`);
    if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(rel)) failures.push(`runtime contracts pack files must include ${rel}`);
  }
  const service = require(abs(RUNNER_REL));
  if (typeof service.createTargetCommandRunnerService !== 'function') failures.push(`${RUNNER_REL} must export createTargetCommandRunnerService`);
  const textExports = require(abs(TEXT_REL));
  if (typeof textExports.formatTargetDoctorText !== 'function' || typeof textExports.formatTargetProfileText !== 'function') failures.push(`${TEXT_REL} must export target text formatters`);

  const smokes = [
    runCli(['target', 'runtime', '--namespace']),
    runCli(['target', 'doctor', '--json']),
    runCli(['target', 'memory', '--text']),
    runCli(['target-config', '--template'])
  ];
  for (const smoke of smokes) {
    if (smoke.status !== 0) failures.push(`CLI smoke failed for ${smoke.args.join(' ')}: ${smoke.stderr || smoke.stdout}`);
  }

  const result = {
    schema: 'agent-onboard-public-target-command-runner-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W2',
    composer: composerMetric,
    extracted_target_command_runner: runnerMetric,
    extracted_target_command_text_service: textMetric,
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
