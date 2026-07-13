#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const REGISTRY_REL = 'cli/agent_onboard/runtime-command-registry.js';
const ARTIFACT_REL = '.agent-onboard/runtime-command-registry-extraction.json';
const PACKAGE_JSON = require(path.join(ROOT, 'package.json'));
const CONTRACTS = require(path.join(ROOT, 'cli/agent_onboard/runtime-contracts'));

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function byteSize(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function runCli(args) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'cli/agent-onboard.js'), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 4 * 1024 * 1024
  });
  return Object.freeze({
    args,
    status: result.status,
    stdout_prefix: String(result.stdout || '').slice(0, 240),
    stderr_prefix: String(result.stderr || '').slice(0, 240)
  });
}

function main() {
  const failures = [];
  const composerText = read(COMPOSER_REL);
  const registryText = read(REGISTRY_REL);
  const registry = require(path.join(ROOT, REGISTRY_REL));
  const artifact = fs.existsSync(path.join(ROOT, ARTIFACT_REL)) ? JSON.parse(read(ARTIFACT_REL)) : null;
  const composerLines = lineCount(composerText);
  const registryLines = lineCount(registryText);
  const statusSmoke = runCli(['status']);
  const versionSmoke = runCli(['--version']);
  const summarySmoke = runCli(['work-items', '--summary', '--json']);

  if (!fs.existsSync(path.join(ROOT, REGISTRY_REL))) failures.push(`${REGISTRY_REL} must exist`);
  if (!composerText.includes("require('./runtime-command-registry')")) failures.push(`${COMPOSER_REL} must import the runtime command registry module`);
  if (composerText.includes('const COMMAND_ROUTE_HANDLERS = Object.freeze({')) failures.push(`${COMPOSER_REL} must not own COMMAND_ROUTE_HANDLERS after registry extraction`);
  if (composerText.includes('function dispatchCommand(')) failures.push(`${COMPOSER_REL} must not own dispatchCommand after registry extraction`);
  for (const forbidden of [
    /const\s+\{\s*createCoreCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/core'\)/,
    /const\s+\{\s*createPackageCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/release-package'\)/,
    /const\s+\{\s*createArchitectureCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/architecture'\)/,
    /const\s+\{\s*createAuthorityCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/authority'\)/,
    /const\s+\{\s*createTargetCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/target'\)/,
    /const\s+\{\s*createWorkItemsCommandAdapter[\s\S]*require\('\.\/adapters\/commands\/work-items'\)/,
    /const\s+\{\s*createWorkItemsService[\s\S]*require\('\.\/domains\/work-items'\)/,
    /const\s+\{\s*service:\s*packageDomain[\s\S]*require\('\.\/domains\/package'\)/
  ]) {
    if (forbidden.test(composerText)) failures.push(`${COMPOSER_REL} must not retain extracted registry dependency ${forbidden}`);
  }
  if (composerLines >= 11753) failures.push(`${COMPOSER_REL} must be smaller than the W24 baseline 11753 lines; found ${composerLines}`);
  if (registryLines > 600) failures.push(`${REGISTRY_REL} line count ${registryLines} exceeds new runtime source budget 600`);
  for (const name of [
    'RUNTIME_COMMAND_REGISTRY_EXTRACTION',
    'describeRuntimeCommandRegistryExtraction',
    'normalizeCommand',
    'createCommandRouteHandlers',
    'dispatchCommandFromRegistry',
    'createRuntimeCompatibilityPortFromRegistry'
  ]) {
    if (!Object.prototype.hasOwnProperty.call(registry, name)) failures.push(`${REGISTRY_REL} must export ${name}`);
  }
  if (!artifact) failures.push(`${ARTIFACT_REL} must exist as source-only admission evidence`);
  else if (artifact.work_item_id !== 'P1S3M6W25') failures.push(`${ARTIFACT_REL} must identify P1S3M6W25`);
  if (registryText.includes('P1S3M6W25')) failures.push(`${REGISTRY_REL} must not expose concrete work item tokens in the packaged runtime surface`);
  if (!Array.isArray(PACKAGE_JSON.files) || !PACKAGE_JSON.files.includes(REGISTRY_REL)) failures.push('package.json files must include runtime command registry module');
  if (!CONTRACTS.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(REGISTRY_REL)) failures.push('runtime contracts package file list must include runtime command registry module');
  if (statusSmoke.status !== 0) failures.push('status smoke through extracted registry must return 0');
  if (versionSmoke.status !== 0) failures.push('version smoke through extracted registry must return 0');
  if (summarySmoke.status !== 0) failures.push('work-items summary smoke through extracted registry must return 0');

  const result = {
    schema: 'agent-onboard-public-runtime-command-registry-extraction-check-001',
    status: failures.length === 0 ? 'ok' : 'fail',
    package_name: PACKAGE_JSON.name,
    version: PACKAGE_JSON.version,
    work_item_id: 'P1S3M6W25',
    extraction: {
      composer: {
        path: COMPOSER_REL,
        lines: composerLines,
        bytes: byteSize(COMPOSER_REL),
        below_w24_baseline_lines: composerLines < 11753,
        imports_runtime_command_registry: composerText.includes("require('./runtime-command-registry')"),
        owns_command_route_handlers: composerText.includes('const COMMAND_ROUTE_HANDLERS = Object.freeze({')
      },
      registry: {
        path: REGISTRY_REL,
        lines: registryLines,
        bytes: byteSize(REGISTRY_REL),
        exported_keys: Object.keys(registry).sort()
      },
      source_artifact: artifact ? {
        path: ARTIFACT_REL,
        schema: artifact.schema,
        work_item_id: artifact.work_item_id,
        packaged_surface_excludes_work_item_token: !registryText.includes('P1S3M6W25')
      } : null,
      packaged: {
        package_json_files_includes_registry: Array.isArray(PACKAGE_JSON.files) && PACKAGE_JSON.files.includes(REGISTRY_REL),
        runtime_contracts_includes_registry: CONTRACTS.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes(REGISTRY_REL)
      },
      smoke: {
        status: statusSmoke,
        version: versionSmoke,
        work_items_summary: summarySmoke
      }
    },
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
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (failures.length > 0) process.exitCode = 1;
}

main();
