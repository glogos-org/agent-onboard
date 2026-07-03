#!/usr/bin/env node
'use strict';

const { route: routeCommand } = require('./agent_onboard/command-router');
const { createCompatibilityCommandPort } = require('./agent_onboard/adapters/compatibility-command-port');
const composer = require('./agent_onboard/runtime-composer');
const { createRuntimeCompatibilityPort } = composer;

function main(argv = process.argv) {
  return routeCommand(argv, createRuntimeCompatibilityPort());
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    const json = { schema: 'agent-onboard-cli-error-001', status: 'error', message: error.stack || String(error) };
    process.stdout.write(JSON.stringify(json, null, 2) + '\n');
    process.exitCode = 1;
  }
}

module.exports = Object.assign({ main, createCompatibilityCommandPort, routeCommand }, composer);
