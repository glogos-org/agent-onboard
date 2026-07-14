#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/runtime-composer-god-file-exit.json';
const COMPOSER_REL = 'cli/agent_onboard/runtime-composer.js';
const SHARED_CONTEXT_REL = 'cli/agent_onboard/runtime-shared-context-service.js';
const ARCH_COMPOSITION_REL = 'cli/agent_onboard/domains/architecture/services/runtime/public-architecture-composition-service.js';
const REQUIRED_PACK_FILES = Object.freeze([SHARED_CONTEXT_REL, ARCH_COMPOSITION_REL]);
const REQUIRED_EXPORTS = Object.freeze([
  'createRuntimeCompatibilityPort',
  'createRuntimeSharedContextService',
  'createPublicArchitectureCompositionService'
]);

function abs(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function metric(rel) { const text = read(rel); return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size }; }
function runNode(args, timeout = 120000) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 * 16 });
  return { args, status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function parseJsonCommand(errors, label, args, timeout) {
  const result = runNode(args, timeout);
  if (result.status !== 0) {
    errors.push(`${label} failed: ${result.stderr || result.stdout}`);
    return null;
  }
  try { return JSON.parse(result.stdout); } catch (error) {
    errors.push(`${label} did not print JSON: ${error.message}`);
    return null;
  }
}
function requireOk(errors, label, args, timeout) {
  const output = parseJsonCommand(errors, label, args, timeout);
  if (output && output.status !== 'ok') errors.push(`${label} returned status ${JSON.stringify(output.status)}`);
  return output;
}

function main() {
  const errors = [];
  const pkg = readJson('package.json');
  const contracts = require(abs('cli/agent_onboard/runtime-contracts.js'));
  const artifact = fs.existsSync(abs(ARTIFACT_REL)) ? readJson(ARTIFACT_REL) : null;
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const contractPackFiles = new Set(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES || []);
  const composer = metric(COMPOSER_REL);
  const sharedContext = metric(SHARED_CONTEXT_REL);
  const architectureComposition = metric(ARCH_COMPOSITION_REL);
  const composerText = read(COMPOSER_REL);

  if (!artifact) errors.push(`${ARTIFACT_REL} missing`);
  else {
    if (artifact.schema !== 'agent-onboard-public-runtime-composer-god-file-exit-closure-001') errors.push('artifact schema mismatch');
    if (artifact.work_item_id !== 'P1S3M7W21') errors.push('artifact work_item_id must be P1S3M7W21');
    if (artifact.version !== '0.0.204') errors.push('artifact version must be 0.0.204');
    if (!artifact.closure_result || artifact.closure_result.runtime_composer_removed_from_god_files !== true) errors.push('artifact must record runtime composer god-file exit');
  }
  if (!pkg.version) errors.push('package.json version missing');
  if (typeof contracts.RELEASE_LINE !== 'string' || contracts.RELEASE_LINE.length === 0) errors.push('runtime release line missing');
  if (composer.lines >= 1000 || composer.bytes >= 102400) errors.push(`${COMPOSER_REL} remains a god file`);
  if (composer.lines > 950) errors.push(`${COMPOSER_REL} has ${composer.lines} lines; W21 maximum is 950`);
  if (composer.bytes > 51200) errors.push(`${COMPOSER_REL} has ${composer.bytes} bytes; W21 maximum is 51200`);
  if (sharedContext.lines > 250 || sharedContext.bytes > 16384) errors.push(`${SHARED_CONTEXT_REL} exceeds bounded shared-context budget`);
  if (architectureComposition.lines > 600 || architectureComposition.bytes > 51200) errors.push(`${ARCH_COMPOSITION_REL} exceeds bounded architecture-composition budget`);
  for (const rel of REQUIRED_PACK_FILES) {
    if (!fs.existsSync(abs(rel))) errors.push(`required extracted service missing: ${rel}`);
    if (!packageFiles.has(rel)) errors.push(`package.json#files missing ${rel}`);
    if (!contractPackFiles.has(rel)) errors.push(`runtime contracts pack files missing ${rel}`);
  }
  for (const token of ['function sourceContext(', 'function publicArchitectureRuntimeMapCheck(', 'function publicArchitectureRuntimeBoundaryCheck(']) {
    if (composerText.includes(token)) errors.push(`${COMPOSER_REL} still owns extracted residual ${token}`);
  }
  for (const name of REQUIRED_EXPORTS) {
    const mod = name === 'createRuntimeSharedContextService'
      ? require(abs(SHARED_CONTEXT_REL))
      : name === 'createPublicArchitectureCompositionService'
        ? require(abs(ARCH_COMPOSITION_REL))
        : require(abs(COMPOSER_REL));
    if (typeof mod[name] !== 'function') errors.push(`missing runtime export ${name}`);
  }

  const sourceBudget = requireOk(errors, 'source-size-budget', ['scripts/check.js', 'source-size-budget']);
  if (sourceBudget) {
    if (!sourceBudget.runtime_composer || sourceBudget.runtime_composer.lines !== composer.lines) errors.push('source-size-budget runtime composer metric drifted');
    if (!sourceBudget.counts || sourceBudget.counts.god_files > 3) errors.push('source-size-budget must ratchet god files to at most 3');
  }
  requireOk(errors, 'god-file-budget-enforcement-closure', ['scripts/check.js', 'god-file-budget-enforcement-closure']);
  requireOk(errors, 'architecture --check', ['cli/agent-onboard.js', 'architecture', '--check']);

  const result = {
    schema: 'agent-onboard-public-runtime-composer-god-file-exit-check-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W21',
    runtime_composer: composer,
    extracted_services: [sharedContext, architectureComposition],
    source_size_budget_counts: sourceBudget && sourceBudget.counts || null,
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
    errors
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
