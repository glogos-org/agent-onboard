#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const runtimePath = path.join(root, 'cli/agent_onboard/runtime-composer.js');
const servicePath = path.join(root, 'cli/agent_onboard/domains/core/services/public-runtime-mcp-bridge-service.js');
const packagePath = path.join(root, 'package.json');
const contractsPath = path.join(root, 'cli/agent_onboard/runtime-contracts.js');
const artifactPath = path.join(root, '.agent-onboard/runtime-mcp-bridge-service-decomposition.json');

function read(relOrAbs) {
  return fs.readFileSync(relOrAbs, 'utf8');
}

function fail(errors) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}

const errors = [];
if (!fs.existsSync(servicePath)) errors.push('MCP bridge service file is missing');
if (!fs.existsSync(artifactPath)) errors.push('gate artifact is missing');

const runtime = read(runtimePath);
const service = fs.existsSync(servicePath) ? read(servicePath) : '';
const pkg = JSON.parse(read(packagePath));
const contracts = read(contractsPath);
const rel = 'cli/agent_onboard/domains/core/services/public-runtime-mcp-bridge-service.js';

if (!runtime.includes("require('./domains/core/services/public-runtime-mcp-bridge-service')")) errors.push('runtime composer must require the extracted MCP bridge service');
if (runtime.includes('const MCP_TOOL_CANDIDATES = Object.freeze([')) errors.push('runtime composer still owns MCP tool candidates');
if (runtime.includes('function mcpBridgePlanCatalog(')) errors.push('runtime composer still owns MCP plan catalog');
if (runtime.includes('function mcpBridgePlanText(')) errors.push('runtime composer still owns MCP text renderer');
if (runtime.includes('function runMcp(args = [])')) errors.push('runtime composer still owns the MCP command runner body');
if (!service.includes('function createPublicRuntimeMcpBridgeService(')) errors.push('service must export createPublicRuntimeMcpBridgeService');
if (!service.includes('const MCP_TOOL_CANDIDATES = Object.freeze([')) errors.push('service must own MCP tool candidates');
if (/\bprocess\./.test(service)) errors.push('service must not access process.* directly');
if (!pkg.files.includes(rel)) errors.push('package.json#files must include the MCP bridge service');
if (!contracts.includes(rel)) errors.push('runtime contracts must include the MCP bridge service in packaged files');
if (!contracts.includes("public-runtime-mcp-bridge-service.js")) errors.push('runtime contracts must retain the MCP bridge service projection');

const jsonResult = spawnSync(process.execPath, ['cli/agent-onboard.js', 'mcp', '--json'], { cwd: root, encoding: 'utf8' });
if (jsonResult.status !== 0) errors.push(`mcp --json failed with exit ${jsonResult.status}: ${jsonResult.stderr || jsonResult.stdout}`);
else {
  try {
    const output = JSON.parse(jsonResult.stdout);
    if (output.schema !== 'agent-onboard-public-mcp-bridge-plan-001') errors.push('mcp --json must preserve the MCP bridge plan schema');
    if (output.status !== 'ok') errors.push('mcp --json status must be ok');
    if (output.version !== pkg.version) errors.push('mcp --json version must track package.json#version');
    if (!contracts.includes(`const RELEASE_LINE = '${output.release_line}';`)) errors.push('mcp --json release line must track runtime contracts');
    if (!Number.isInteger(output.tool_candidate_count) || output.tool_candidate_count < 20) errors.push('mcp --json must preserve the tool candidate catalog');
    if (!output.boundary || output.boundary.starts_server !== false || output.boundary.writes_files !== false) errors.push('mcp boundary must remain read-only and no-server');
  } catch (error) {
    errors.push(`mcp --json did not return parseable JSON: ${error.message}`);
  }
}

const deniedResult = spawnSync(process.execPath, ['cli/agent-onboard.js', 'mcp', '--serve'], { cwd: root, encoding: 'utf8' });
if (deniedResult.status !== 2) errors.push(`mcp --serve must remain not-admitted exit 2, got ${deniedResult.status}`);
else {
  try {
    const output = JSON.parse(deniedResult.stdout);
    if (output.reason !== 'not_admitted') errors.push('mcp --serve must return reason not_admitted');
    if (output.starts_server !== false || output.writes_files !== false) errors.push('mcp --serve error boundary must remain no-server/no-write');
  } catch (error) {
    errors.push(`mcp --serve did not return parseable JSON: ${error.message}`);
  }
}

if (errors.length > 0) fail(errors);
process.stdout.write('runtime MCP bridge service decomposition check passed\n');
