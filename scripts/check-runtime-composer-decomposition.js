#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SERVICE_REL = 'cli/agent_onboard/domains/core/services/public-runtime-surface-service.js';
const PACKAGE_JSON = require(path.join(ROOT, 'package.json'));
const CONTRACTS = require(path.join(ROOT, 'cli/agent_onboard/runtime-contracts'));

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

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).filter((_, index, arr) => index < arr.length - 1 || arr[index] !== '').length;
}

function byteSize(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function main() {
  const failures = [];
  const composerText = read(COMPOSER_REL);
  const serviceText = read(SERVICE_REL);
  const service = require(path.join(ROOT, SERVICE_REL));
  const composerLines = lineCount(composerText);
  const serviceLines = lineCount(serviceText);
  const composerBudget = 13500;

  if (!fs.existsSync(path.join(ROOT, SERVICE_REL))) failures.push(`${SERVICE_REL} must exist`);
  if (composerLines > composerBudget) failures.push(`${COMPOSER_REL} line count ${composerLines} exceeds decomposition budget ${composerBudget}`);
  if (!composerText.includes("require('./domains/core/services/public-runtime-surface-service')")) failures.push(`${COMPOSER_REL} must import the public runtime surface service module`);
  for (const legacyFunction of ['function commandSurfaceCatalog(', 'function operatorGuideCatalog(', 'function quickstartCatalog(', 'function issueIntakeClassification(', 'function contributorAdmissionPreview(', 'function ciSurfaceCatalog(']) {
    if (composerText.includes(legacyFunction)) failures.push(`${COMPOSER_REL} still owns extracted function ${legacyFunction}`);
  }
  for (const name of EXPECTED_EXPORTS) {
    if (!Object.prototype.hasOwnProperty.call(service, name)) failures.push(`${SERVICE_REL} must export ${name}`);
  }
  if (!Array.isArray(PACKAGE_JSON.files) || !PACKAGE_JSON.files.includes(SERVICE_REL)) failures.push('package.json files must include the public runtime surface service module');
  if (!CONTRACTS.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)) failures.push('runtime contracts package file list must include the public runtime surface service module');

  const result = {
    schema: 'agent-onboard-runtime-composer-decomposition-check-001',
    status: failures.length === 0 ? 'ok' : 'fail',
    package_name: PACKAGE_JSON.name,
    version: PACKAGE_JSON.version,
    decomposition: {
      composer: {
        path: COMPOSER_REL,
        lines: composerLines,
        bytes: byteSize(COMPOSER_REL),
        max_lines: composerBudget,
        imported_public_runtime_surface_service: composerText.includes("require('./domains/core/services/public-runtime-surface-service')")
      },
      extracted_service: {
        path: SERVICE_REL,
        lines: serviceLines,
        bytes: byteSize(SERVICE_REL),
        exports: Object.keys(service).sort()
      },
      packaged: {
        package_json_files_includes_service: Array.isArray(PACKAGE_JSON.files) && PACKAGE_JSON.files.includes(SERVICE_REL),
        runtime_contracts_includes_service: CONTRACTS.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(SERVICE_REL)
      }
    },
    boundary: {
      storage_backend_changed: false,
      binary_database_added: false,
      public_cli_behavior_changed_intentionally: false,
      git_mutation: false,
      network: false,
      package_publish: false
    },
    failures
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (failures.length > 0) process.exitCode = 1;
}

main();
