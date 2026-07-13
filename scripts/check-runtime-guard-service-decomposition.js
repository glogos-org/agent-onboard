#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const runtimePath = path.join(root, 'cli/agent_onboard/runtime-composer.js');
const servicePath = path.join(root, 'cli/agent_onboard/domains/authority/services/public-runtime-guard-service.js');
const packagePath = path.join(root, 'package.json');
const contractsPath = path.join(root, 'cli/agent_onboard/runtime-contracts.js');
const artifactPath = path.join(root, '.agent-onboard/runtime-guard-service-decomposition.json');
const rel = 'cli/agent_onboard/domains/authority/services/public-runtime-guard-service.js';
const expectedVersion = '0.0.172';
const expectedReleaseLine = 'public_runtime_guard_service_decomposition_gate';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function fail(errors) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}

function parseJsonOutput(result, commandName, errors) {
  if (result.status !== 0) {
    errors.push(`${commandName} failed with exit ${result.status}: ${result.stderr || result.stdout}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    errors.push(`${commandName} did not return parseable JSON: ${error.message}`);
    return null;
  }
}

const errors = [];
if (!fs.existsSync(servicePath)) errors.push('guard service file is missing');
if (!fs.existsSync(artifactPath)) errors.push('gate artifact is missing');

const runtime = read(runtimePath);
const service = fs.existsSync(servicePath) ? read(servicePath) : '';
const pkg = JSON.parse(read(packagePath));
const contracts = read(contractsPath);

if (!runtime.includes("require('./domains/authority/services/public-runtime-guard-service')")) errors.push('runtime composer must require the extracted guard service');
if (runtime.includes('coreConfigGuardDomain.createCoreConfigGuardService')) errors.push('runtime composer must not instantiate the core config guard directly');
if (runtime.includes('function runGuard(args)')) errors.push('runtime composer still owns the guard command runner body');
if (!service.includes('function createPublicRuntimeGuardService(')) errors.push('service must export createPublicRuntimeGuardService');
if (!service.includes('createCoreConfigGuardService')) errors.push('service must delegate to the core config guard service');
if (!service.includes('PUBLIC_RUNTIME_GUARD_SERVICE_DECOMPOSITION')) errors.push('service must expose a decomposition contract');
if (/\bprocess\./.test(service)) errors.push('service must not access process.* directly');
if (!pkg.files.includes(rel)) errors.push('package.json#files must include the guard service');
if (!contracts.includes(rel)) errors.push('runtime contracts must include the guard service in packaged files');
if (pkg.version !== expectedVersion) errors.push(`package.json#version must be ${expectedVersion} for this gate`);
if (!contracts.includes(expectedReleaseLine)) errors.push('runtime contracts release line must name the guard decomposition gate');

const plan = parseJsonOutput(spawnSync(process.execPath, ['cli/agent-onboard.js', 'guard', '--plan'], { cwd: root, encoding: 'utf8' }), 'guard --plan', errors);
if (plan) {
  if (plan.schema !== 'agent-onboard-guard-plan-001') errors.push('guard --plan must preserve the guard plan schema');
  if (plan.status !== 'ok') errors.push('guard --plan status must be ok');
  if (plan.canonical_config_file !== '.agent-onboard/target.json') errors.push('guard --plan must preserve canonical target config file');
  if (plan.writes_files !== false || plan.git_mutation !== false || plan.installs_dependencies !== false) errors.push('guard --plan must remain read-only/no-Git/no-install');
}

const boundaryCheck = spawnSync(process.execPath, ['cli/agent-onboard.js', 'guard', '--check-boundary'], { cwd: root, encoding: 'utf8' });
if (![0, 2].includes(boundaryCheck.status)) errors.push(`guard --check-boundary must return pass or blocked, got ${boundaryCheck.status}`);
else {
  try {
    const output = JSON.parse(boundaryCheck.stdout);
    if (output.schema !== 'agent-onboard-guard-boundary-check-result-001') errors.push('guard --check-boundary must preserve guard result schema');
    if (!['pass', 'blocked'].includes(output.status)) errors.push('guard --check-boundary status must be pass or blocked');
    if (output.reads_target_config !== true) errors.push('guard --check-boundary must read target config when it is present');
    if (output.writes_files !== false || output.git_mutation !== false) errors.push('guard --check-boundary must remain no-write/no-Git');
  } catch (error) {
    errors.push(`guard --check-boundary did not return parseable JSON: ${error.message}`);
  }
}

if (errors.length > 0) fail(errors);
process.stdout.write('runtime guard service decomposition check passed\n');
