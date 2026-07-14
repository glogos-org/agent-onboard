#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-architecture-command-runner-service.js';
const ARTIFACT_REL = '.agent-onboard/architecture-command-runner-extraction.json';
const CLEAN_RUNTIME_REL = 'cli/agent_onboard/domains/package/services/release-clean-closed-gates/clean-compaction-runtime.js';
const ARCHITECTURE_COMPOSITION_SERVICE_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-architecture-composition-service.js';
const MAX_COMPOSER_LINES = 5036;
const MAX_COMPOSER_BYTES = 288088;
const MAX_SERVICE_LINES = 150;
const MAX_SERVICE_BYTES = 14000;

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
  const architectureComposition = fs.existsSync(abs(ARCHITECTURE_COMPOSITION_SERVICE_REL)) ? read(ARCHITECTURE_COMPOSITION_SERVICE_REL) : '';
  const artifact = readJson(ARTIFACT_REL);
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const composerMetric = metric(COMPOSER_REL);
  const serviceMetric = metric(SERVICE_REL);

  if (artifact.schema !== 'agent-onboard-public-architecture-command-runner-extraction-001') failures.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M7W6') failures.push('artifact work_item_id must be P1S3M7W6');
  if (artifact.version !== '0.0.189') failures.push('artifact version must record W6 closure version 0.0.189');
  if (composerMetric.lines > MAX_COMPOSER_LINES) failures.push(`${COMPOSER_REL} line count ${composerMetric.lines} exceeds ${MAX_COMPOSER_LINES}`);
  if (composerMetric.bytes > MAX_COMPOSER_BYTES) failures.push(`${COMPOSER_REL} byte size ${composerMetric.bytes} exceeds ${MAX_COMPOSER_BYTES}`);
  if (serviceMetric.lines > MAX_SERVICE_LINES) failures.push(`${SERVICE_REL} line count ${serviceMetric.lines} exceeds ${MAX_SERVICE_LINES}`);
  if (serviceMetric.bytes > MAX_SERVICE_BYTES) failures.push(`${SERVICE_REL} byte size ${serviceMetric.bytes} exceeds ${MAX_SERVICE_BYTES}`);
  if (artifact.reduction.runtime_composer_after.lines !== MAX_COMPOSER_LINES) failures.push('artifact runtime_composer_after.lines must record the W6 ratchet baseline');
  if (artifact.reduction.runtime_composer_after.bytes !== MAX_COMPOSER_BYTES) failures.push('artifact runtime_composer_after.bytes must record the W6 ratchet baseline');
  const compositionSurface = `${composer}
${architectureComposition}`;
  if (!compositionSurface.includes('createPublicArchitectureCommandRunnerService')) failures.push(`runtime composition surface must compose the architecture command runner service`);
  if (!compositionSurface.includes('architectureCommandRunnerService.runArchitecture')) failures.push(`runtime composition surface must delegate architecture command routing through extracted service`);
  if (composer.includes('architecture requires --map, --router, --facades')) failures.push(`${COMPOSER_REL} still owns the long architecture command error message`);
  if (!serviceText.includes('ARCHITECTURE_COMMANDS')) failures.push(`${SERVICE_REL} must own architecture command flag registry`);
  if (!serviceText.includes("['--router-adapter-delegation-check'")) failures.push(`${SERVICE_REL} must preserve router adapter delegation check dispatch`);
  if (!serviceText.includes("['--check', 'publicArchitectureCheck', true]")) failures.push(`${SERVICE_REL} must preserve aggregate architecture check dispatch`);
  if (!packageFiles.has(SERVICE_REL)) failures.push(`package.json#files must include ${SERVICE_REL}`);
  if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push(`runtime contracts pack files must include ${SERVICE_REL}`);
  const service = require(abs(SERVICE_REL));
  if (typeof service.createPublicArchitectureCommandRunnerService !== 'function') failures.push(`${SERVICE_REL} must export createPublicArchitectureCommandRunnerService`);

  const cleanPackBudget = Number((cleanRuntime.match(/max_projected_pack_files: (\d+)/u) || [])[1]);
  const cleanSourceBudget = Number((cleanRuntime.match(/max_source_files: (\d+)/u) || [])[1]);
  const cleanAgentOnboardBudget = Number((cleanRuntime.match(/max_agent_onboard_files: (\d+)/u) || [])[1]);
  if (!(cleanPackBudget >= 93) || !(cleanSourceBudget >= 266) || !(cleanAgentOnboardBudget >= 115)) failures.push(`${CLEAN_RUNTIME_REL} must admit the extracted packaged service and W6 closure artifact in clean compaction budgets`);

  const smokes = [
    runCli(['architecture', '--map']),
    runCli(['architecture', '--check']),
    runCli(['architecture', '--thin-router-check']),
    runCli(['architecture', '--router-adapter-delegation-check'])
  ];
  for (const smoke of smokes) {
    if (smoke.status !== 0) failures.push(`CLI smoke failed for ${smoke.args.join(' ')}: ${smoke.stderr || smoke.stdout}`);
  }

  const result = {
    schema: 'agent-onboard-public-architecture-command-runner-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W6',
    composer: composerMetric,
    extracted_architecture_command_runner_service: serviceMetric,
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
