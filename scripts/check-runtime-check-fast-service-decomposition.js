#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPOSER = 'cli/agent_onboard/runtime-composer.js';
const SERVICE = 'cli/agent_onboard/domains/core/services/public-runtime-check-fast-service.js';
const PACKAGE_JSON = 'package.json';
const RUNTIME_CONTRACTS = 'cli/agent_onboard/runtime-contracts.js';
const EXPECTED_RELEASE_LINE = 'current_runtime_release_line';
const MAX_RUNTIME_COMPOSER_LINES = 12300;
const MIN_SERVICE_LINES = 450;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/u).length;
}

function main() {
  const failures = [];
  const composer = read(COMPOSER);
  const service = read(SERVICE);
  const pkg = JSON.parse(read(PACKAGE_JSON));
  const runtimeContracts = read(RUNTIME_CONTRACTS);
  const composerLines = lineCount(composer);
  const serviceLines = lineCount(service);
  const serviceExports = require(path.join(ROOT, SERVICE));
  if (!fs.existsSync(path.join(ROOT, SERVICE))) failures.push(`${SERVICE} must exist`);
  if (composerLines > MAX_RUNTIME_COMPOSER_LINES) failures.push(`${COMPOSER} must remain at or below ${MAX_RUNTIME_COMPOSER_LINES} lines after check-fast extraction; got ${composerLines}`);
  if (serviceLines < MIN_SERVICE_LINES) failures.push(`${SERVICE} must own the extracted check plan and fast runner; got only ${serviceLines} lines`);
  if (!composer.includes("createPublicRuntimeCheckFastService")) failures.push(`${COMPOSER} must compose createPublicRuntimeCheckFastService`);
  for (const legacy of ['const CHECK_FAST_ENGINE', 'const CHECK_FAST_REGISTRY', 'function runCheckFastPlan(', 'function checkPlanCatalog(', 'function checkFastText(']) {
    if (composer.includes(legacy)) failures.push(`${COMPOSER} must not inline ${legacy} after W20`);
  }
  for (const owned of ['const CHECK_FAST_ENGINE', 'const CHECK_FAST_REGISTRY', 'function runCheckFastPlan(', 'function checkPlanCatalog(', 'function checkFastText(']) {
    if (!service.includes(owned)) failures.push(`${SERVICE} must own ${owned}`);
  }
  if (service.includes('process.')) failures.push(`${SERVICE} must not use process directly; runtime-composer must inject process-bound ports`);
  if (typeof serviceExports.createPublicRuntimeCheckFastService !== 'function') failures.push(`${SERVICE} must export createPublicRuntimeCheckFastService`);
  if (!Array.isArray(pkg.files) || !pkg.files.includes(SERVICE)) failures.push(`package.json#files must include ${SERVICE}`);
  if (!runtimeContracts.includes(`'${SERVICE}'`)) failures.push(`runtime-contracts package file list must include ${SERVICE}`);
  if (!runtimeContracts.includes('const RELEASE_LINE = ')) failures.push('runtime-contracts must define a release line');
  const payload = {
    schema: 'agent-onboard-runtime-check-fast-service-decomposition-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    release_line: 'current_runtime_release_line',
    runtime_composer: {
      file: COMPOSER,
      line_count: composerLines,
      max_line_count: MAX_RUNTIME_COMPOSER_LINES,
      owns_check_fast_engine: composer.includes('const CHECK_FAST_ENGINE'),
      owns_check_fast_registry: composer.includes('const CHECK_FAST_REGISTRY')
    },
    check_fast_service: {
      file: SERVICE,
      line_count: serviceLines,
      min_line_count: MIN_SERVICE_LINES,
      owns_check_fast_engine: service.includes('const CHECK_FAST_ENGINE'),
      owns_check_fast_registry: service.includes('const CHECK_FAST_REGISTRY'),
      direct_process_access: service.includes('process.'),
      packaged: Array.isArray(pkg.files) && pkg.files.includes(SERVICE)
    },
    storage_backend: 'json_jsonl_text_first_unchanged',
    sqlite_introduced: false,
    lmdb_introduced: false,
    mdbx_introduced: false,
    failures
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  if (failures.length > 0) process.exitCode = 1;
}

main();
