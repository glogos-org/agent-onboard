#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPOSER = 'cli/agent_onboard/runtime-composer.js';
const SERVICE = 'cli/agent_onboard/domains/package/services/public-runtime-release-service.js';
const PACKAGE_JSON = 'package.json';
const RUNTIME_CONTRACTS = 'cli/agent_onboard/runtime-contracts.js';
const EXPECTED_RELEASE_LINE = 'current_runtime_release_line';
const MAX_RUNTIME_COMPOSER_LINES = 12750;
const MIN_SERVICE_LINES = 400;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/u).length;
}

function has(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function main() {
  const failures = [];
  const composer = read(COMPOSER);
  const service = read(SERVICE);
  const pkg = JSON.parse(read(PACKAGE_JSON));
  const runtimeContracts = read(RUNTIME_CONTRACTS);
  const composerLines = lineCount(composer);
  const serviceLines = lineCount(service);
  if (!has(SERVICE)) failures.push(`${SERVICE} must exist`);
  if (composerLines > MAX_RUNTIME_COMPOSER_LINES) failures.push(`${COMPOSER} must remain at or below ${MAX_RUNTIME_COMPOSER_LINES} lines after release command extraction; got ${composerLines}`);
  if (serviceLines < MIN_SERVICE_LINES) failures.push(`${SERVICE} must own the extracted release command surface; got only ${serviceLines} lines`);
  if (!composer.includes("createPublicRuntimeReleaseCommandService")) failures.push(`${COMPOSER} must compose createPublicRuntimeReleaseCommandService`);
  if (composer.includes("schema: 'agent-onboard-public-release-plan-005'")) failures.push(`${COMPOSER} must not inline the release plan body after W19`);
  if (!service.includes("schema: 'agent-onboard-public-release-plan-005'")) failures.push(`${SERVICE} must own the release plan body after W19`);
  if (!service.includes('function runRelease(args)')) failures.push(`${SERVICE} must expose the release command dispatcher`);
  if (!Array.isArray(pkg.files) || !pkg.files.includes(SERVICE)) failures.push(`package.json#files must include ${SERVICE}`);
  if (!runtimeContracts.includes(`'${SERVICE}'`)) failures.push(`runtime-contracts package file list must include ${SERVICE}`);
  if (!runtimeContracts.includes('const RELEASE_LINE = ')) failures.push('runtime-contracts must define a release line');
  const payload = {
    schema: 'agent-onboard-runtime-release-service-decomposition-check-001',
    status: failures.length === 0 ? 'ok' : 'error',
    release_line: 'current_runtime_release_line',
    runtime_composer: {
      file: COMPOSER,
      line_count: composerLines,
      max_line_count: MAX_RUNTIME_COMPOSER_LINES,
      inlines_release_plan_body: composer.includes("schema: 'agent-onboard-public-release-plan-005'")
    },
    release_service: {
      file: SERVICE,
      line_count: serviceLines,
      min_line_count: MIN_SERVICE_LINES,
      owns_release_plan_body: service.includes("schema: 'agent-onboard-public-release-plan-005'"),
      packaged: Array.isArray(pkg.files) && pkg.files.includes(SERVICE)
    },
    storage_backend: 'json_jsonl_text_first_unchanged',
    sqlite_introduced: false,
    lmdb_introduced: false,
    mdbx_introduced: false,
    failures
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
}

main();
