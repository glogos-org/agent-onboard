#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const FACADE_REL = 'cli/agent_onboard/domains/core/services/public-runtime-surface-service.js';
const SERVICE_RELS = Object.freeze([
  'cli/agent_onboard/domains/core/services/runtime-surface/public-runtime-surface-common.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/command-surface-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/operator-guide-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/quickstart-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/discovery-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/create-dry-run-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/issue-intake-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/contributor-admission-service.js',
  'cli/agent_onboard/domains/core/services/runtime-surface/ci-surface-service.js'
]);
const EXPECTED_EXPORTS = Object.freeze([
  'commandSurfaceService',
  'operatorGuideService',
  'quickstartService',
  'discoveryService',
  'createDryRunService',
  'issueIntakeService',
  'contributorAdmissionService',
  'ciSurfaceService'
]);
const COMMAND_SMOKES = Object.freeze([
  ['commands', '--json'],
  ['guide', '--json'],
  ['quickstart', '--json'],
  ['discovery', '--json'],
  ['create', '--dry-run'],
  ['issue', '--classify-dry-run', '--text'],
  ['contributor', '--admission-dry-run', '--text'],
  ['ci', '--json']
]);

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function byteSize(rel) { return fs.statSync(abs(rel)).size; }
function runCli(args) {
  return spawnSync(process.execPath, ['cli/agent-onboard.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 4
  });
}

function main() {
  const failures = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const facadeText = read(FACADE_REL);
  const facadeModule = require(abs(FACADE_REL));
  const serviceMetrics = SERVICE_RELS.map((rel) => ({ path: rel, lines: lineCount(read(rel)), bytes: byteSize(rel) }));

  if (pkg.version !== '0.0.202') failures.push(`package version must be 0.0.202, got ${pkg.version}`);
  if (lineCount(facadeText) > 80) failures.push(`${FACADE_REL} must remain a bounded facade`);
  for (const legacyFunction of [
    'function commandSurfaceCatalog(',
    'function operatorGuideCatalog(',
    'function quickstartCatalog(',
    'function discoveryCatalog(',
    'function createDryRunCatalog(',
    'function issueIntakeClassification(',
    'function contributorAdmissionPreview(',
    'function ciSurfaceCatalog('
  ]) {
    if (facadeText.includes(legacyFunction)) failures.push(`${FACADE_REL} still owns extracted implementation ${legacyFunction}`);
  }
  for (const name of EXPECTED_EXPORTS) {
    if (!Object.prototype.hasOwnProperty.call(facadeModule, name)) failures.push(`${FACADE_REL} must export ${name}`);
  }
  for (const rel of SERVICE_RELS) {
    if (!fs.existsSync(abs(rel))) failures.push(`extracted service missing: ${rel}`);
    if (!pkg.files.includes(rel)) failures.push(`package.json files must include ${rel}`);
    if (!contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(rel)) failures.push(`runtime contracts package list must include ${rel}`);
  }
  for (const metric of serviceMetrics) {
    if (metric.lines > 500) failures.push(`${metric.path} has ${metric.lines} lines; extracted runtime-surface services must stay below 500 lines`);
    if (metric.bytes > 51200) failures.push(`${metric.path} has ${metric.bytes} bytes; extracted runtime-surface services must stay below near-god byte threshold`);
  }
  for (const args of COMMAND_SMOKES) {
    const result = runCli(args);
    if (result.status !== 0) failures.push(`agent-onboard ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }

  const result = {
    schema: 'agent-onboard-public-runtime-surface-service-residual-reduction-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W19',
    facade: {
      path: FACADE_REL,
      lines: lineCount(facadeText),
      bytes: byteSize(FACADE_REL),
      exports: Object.keys(facadeModule).sort()
    },
    extracted_services: serviceMetrics,
    package_projection: {
      package_json_includes_all_services: SERVICE_RELS.every((rel) => pkg.files.includes(rel)),
      runtime_contracts_includes_all_services: SERVICE_RELS.every((rel) => contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(rel))
    },
    command_smokes: COMMAND_SMOKES.map((args) => `agent-onboard ${args.join(' ')}`),
    boundary: {
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false,
      git_mutation: false,
      network: false,
      package_publish: false
    },
    failures
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
}

main();
