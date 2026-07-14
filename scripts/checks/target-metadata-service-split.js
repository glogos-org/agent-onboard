#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/target-metadata-service-split.json';
const SERVICE_REL = 'cli/agent_onboard/domains/target/services/target-metadata-service.js';
const CONSTANTS_REL = 'cli/agent_onboard/domains/target/services/target-metadata-constants.js';
const IDENTITY_REL = 'cli/agent_onboard/domains/target/services/target-metadata-identity-service.js';
const REQUIRED_PACK_FILES = Object.freeze([CONSTANTS_REL, IDENTITY_REL, SERVICE_REL]);

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
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const contractPackFiles = new Set(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES || []);
  const artifact = fs.existsSync(abs(ARTIFACT_REL)) ? readJson(ARTIFACT_REL) : null;
  const service = metric(SERVICE_REL);
  const constants = metric(CONSTANTS_REL);
  const identity = metric(IDENTITY_REL);
  const serviceText = read(SERVICE_REL);

  if (!artifact) errors.push(`${ARTIFACT_REL} missing`);
  else {
    if (artifact.schema !== 'agent-onboard-public-target-metadata-service-split-closure-001') errors.push('artifact schema mismatch');
    if (artifact.work_item_id !== 'P1S3M7W22') errors.push('artifact work_item_id must be P1S3M7W22');
    if (artifact.version !== '0.0.205') errors.push('artifact version must be 0.0.205');
    if (!artifact.closure_result || artifact.closure_result.target_metadata_service_split !== true) errors.push('artifact must record target metadata service split');
  }
  if (pkg.version !== '0.0.205') errors.push(`package.json version must be 0.0.205, got ${pkg.version}`);
  if (contracts.RELEASE_LINE !== 'public_target_metadata_service_split_gate') errors.push('runtime release line must record W22 gate');
  if (service.lines > 730) errors.push(`${SERVICE_REL} has ${service.lines} lines; W22 maximum is 730`);
  if (service.bytes > 33000) errors.push(`${SERVICE_REL} has ${service.bytes} bytes; W22 maximum is 33000`);
  if (constants.lines > 120 || constants.bytes > 8192) errors.push(`${CONSTANTS_REL} exceeds bounded constants budget`);
  if (identity.lines > 160 || identity.bytes > 8192) errors.push(`${IDENTITY_REL} exceeds bounded identity budget`);
  for (const rel of REQUIRED_PACK_FILES) {
    if (!fs.existsSync(abs(rel))) errors.push(`required target metadata split file missing: ${rel}`);
    if (!packageFiles.has(rel)) errors.push(`package.json#files missing ${rel}`);
    if (!contractPackFiles.has(rel)) errors.push(`runtime contracts pack files missing ${rel}`);
  }
  for (const token of ["const crypto = require('crypto')", 'function slugify(', 'function walkFiles(', 'function normalizeUrnNamespace(']) {
    if (serviceText.includes(token)) errors.push(`${SERVICE_REL} still owns extracted metadata identity residual ${token}`);
  }

  const constantsModule = require(abs(CONSTANTS_REL));
  const identityModule = require(abs(IDENTITY_REL));
  if (constantsModule.PACKAGE_NAME !== 'agent-onboard') errors.push('metadata constants must export PACKAGE_NAME');
  if (!constantsModule.METADATA_FILES || constantsModule.METADATA_FILES.manifest !== 'manifest.json') errors.push('metadata constants must export manifest metadata file');
  for (const name of ['fileId', 'fileUrn', 'walkFiles', 'normalizeUrnNamespace', 'namespaceFromFileUrn']) {
    if (typeof identityModule[name] !== 'function') errors.push(`metadata identity module missing ${name}`);
  }
  const ni = identityModule.fileId(Buffer.from('target-metadata-service-split', 'utf8'));
  if (!ni.startsWith('ni:///sha-256;') || ni.includes('+') || ni.includes('/sha-256;/')) errors.push('metadata identity fileId must remain ni:///sha-256 base64url');
  const urn = identityModule.fileUrn('urn:agent-onboard:file', 'README.md');
  if (!urn.startsWith('urn:agent-onboard:file:readme-md-')) errors.push('metadata identity fileUrn must remain stable namespace-prefixed URN');

  const plan = requireOk(errors, 'target metadata plan', ['cli/agent-onboard.js', 'target', 'metadata', '--plan', '--target', '.']);
  if (plan && plan.command !== 'agent-onboard target metadata --plan') errors.push('target metadata plan command drifted');
  const check = parseJsonCommand(errors, 'target metadata check', ['cli/agent-onboard.js', 'target', 'metadata', '--check', '--target', '.']);
  if (check && !['ok', 'error'].includes(check.status)) errors.push('target metadata check returned invalid status shape');
  const sourceBudget = requireOk(errors, 'source-size-budget', ['scripts/check.js', 'source-size-budget']);
  if (sourceBudget) {
    const targetMetadata = (sourceBudget.largest_files || []).find((item) => item.path === SERVICE_REL);
    if (targetMetadata && targetMetadata.lines !== service.lines) errors.push('source-size-budget target metadata metric drifted');
    if (!sourceBudget.counts || sourceBudget.counts.god_files > 3) errors.push('source-size-budget must preserve god files at most 3');
  }

  const result = {
    schema: 'agent-onboard-public-target-metadata-service-split-check-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M7W22',
    target_metadata_service: service,
    extracted_services: [constants, identity],
    target_metadata_plan_status: plan && plan.status || null,
    target_metadata_check_status: check && check.status || null,
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
