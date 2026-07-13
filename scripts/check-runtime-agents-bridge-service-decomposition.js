#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const runtimePath = path.join(root, 'cli/agent_onboard/runtime-composer.js');
const servicePath = path.join(root, 'cli/agent_onboard/domains/authority/services/public-runtime-agents-bridge-service.js');
const packagePath = path.join(root, 'package.json');
const contractsPath = path.join(root, 'cli/agent_onboard/runtime-contracts.js');
const artifactPath = path.join(root, '.agent-onboard/runtime-agents-bridge-service-decomposition.json');
const rel = 'cli/agent_onboard/domains/authority/services/public-runtime-agents-bridge-service.js';
const expectedVersion = '0.0.171';
const expectedReleaseLine = 'public_runtime_agents_bridge_service_decomposition_gate';

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
if (!fs.existsSync(servicePath)) errors.push('AGENTS bridge service file is missing');
if (!fs.existsSync(artifactPath)) errors.push('gate artifact is missing');

const runtime = read(runtimePath);
const service = fs.existsSync(servicePath) ? read(servicePath) : '';
const pkg = JSON.parse(read(packagePath));
const contracts = read(contractsPath);

if (!runtime.includes("require('./domains/authority/services/public-runtime-agents-bridge-service')")) errors.push('runtime composer must require the extracted AGENTS bridge service');
if (runtime.includes("const BRIDGE_MARKER_START = '<!-- agent-onboard:bridge:start -->';")) errors.push('runtime composer still owns AGENTS bridge marker constants');
if (runtime.includes('function bridgeMarkerBlock(')) errors.push('runtime composer still owns the AGENTS bridge marker block body');
if (runtime.includes('function bridgePlan(')) errors.push('runtime composer still owns the AGENTS bridge plan body');
if (runtime.includes('function bridgeCheck(')) errors.push('runtime composer still owns the AGENTS bridge check body');
if (runtime.includes('function bridgeWrite(')) errors.push('runtime composer still owns the AGENTS bridge write body');
if (runtime.includes('function runBridge(args = [])')) errors.push('runtime composer still owns the AGENTS bridge command runner body');
if (runtime.includes('function runAgents(args)')) errors.push('runtime composer still owns the AGENTS command runner body');
if (!service.includes('function createPublicRuntimeAgentsBridgeService(')) errors.push('service must export createPublicRuntimeAgentsBridgeService');
if (!service.includes("const BRIDGE_MARKER_START = '<!-- agent-onboard:bridge:start -->';")) errors.push('service must own AGENTS bridge marker constants');
if (!service.includes('function runAgents(args = [])')) errors.push('service must own the agents command runner');
if (!service.includes('function runBridge(args = [])')) errors.push('service must own the bridge command runner');
if (/\bprocess\./.test(service)) errors.push('service must not access process.* directly');
if (!pkg.files.includes(rel)) errors.push('package.json#files must include the AGENTS bridge service');
if (!contracts.includes(rel)) errors.push('runtime contracts must include the AGENTS bridge service in packaged files');
if (pkg.version !== expectedVersion) errors.push(`package.json#version must be ${expectedVersion} for this gate`);
if (!contracts.includes(expectedReleaseLine)) errors.push('runtime contracts release line must name the AGENTS bridge decomposition gate');

const bridgePlanResult = parseJsonOutput(spawnSync(process.execPath, ['cli/agent-onboard.js', 'bridge', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' }), 'bridge --dry-run --json', errors);
if (bridgePlanResult) {
  if (bridgePlanResult.schema !== 'agent-onboard-public-agents-bridge-plan-001') errors.push('bridge --dry-run must preserve the AGENTS bridge plan schema');
  if (bridgePlanResult.status !== 'ok') errors.push('bridge --dry-run status must be ok');
  if (bridgePlanResult.version !== expectedVersion) errors.push(`bridge --dry-run version must be ${expectedVersion}`);
  if (bridgePlanResult.release_line !== expectedReleaseLine) errors.push('bridge --dry-run release line must be updated');
  if (!bridgePlanResult.boundary || bridgePlanResult.boundary.installs_dependencies !== false || bridgePlanResult.boundary.network !== false || bridgePlanResult.boundary.git_mutation !== false) errors.push('bridge boundary must remain no-install/no-network/no-Git');
  if (!String(bridgePlanResult.bridge_block || '').includes('Forbidden by default')) errors.push('bridge marker block must preserve forbidden-by-default text');
}

const bridgeText = spawnSync(process.execPath, ['cli/agent-onboard.js', 'bridge', '--dry-run', '--text'], { cwd: root, encoding: 'utf8' });
if (bridgeText.status !== 0) errors.push(`bridge --dry-run --text failed with exit ${bridgeText.status}: ${bridgeText.stderr || bridgeText.stdout}`);
else if (!bridgeText.stdout.includes('agent-onboard AGENTS bridge') || !bridgeText.stdout.includes('Boundary: marker block only')) errors.push('bridge --dry-run --text must preserve human-readable bridge output');

const agentsPreview = parseJsonOutput(spawnSync(process.execPath, ['cli/agent-onboard.js', 'agents', '--preview', '--force'], { cwd: root, encoding: 'utf8' }), 'agents --preview --force', errors);
if (agentsPreview) {
  if (agentsPreview.schema !== 'agent-onboard-agents-result-001') errors.push('agents --preview must preserve the agents result schema');
  if (agentsPreview.status !== 'ok') errors.push('agents --preview --force status must be ok');
  if (agentsPreview.writes_performed !== false) errors.push('agents --preview must not write files');
  if (!agentsPreview.boundary || agentsPreview.boundary.modifies_only_canonical_agents_file !== false) errors.push('agents preview boundary must remain read-only');
  if (!String(agentsPreview.agents_md || '').includes('Agent-Onboard target repository rules')) errors.push('agents preview must preserve AGENTS.md template content');
}

if (errors.length > 0) fail(errors);
process.stdout.write('runtime AGENTS bridge service decomposition check passed\n');
