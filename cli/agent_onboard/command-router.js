'use strict';

const {
  PACKAGE_NAME,
  ROUTER_COMMAND_ORDER
} = require('./runtime-contracts');

const ROUTER_SEED = Object.freeze({
  schema: 'agent-onboard-public-thin-cli-router-seed-module-001',
  package_name: PACKAGE_NAME,
  role: 'packaged_thin_cli_router_seed',
  entrypoint_target: 'cli/agent-onboard.js',
  planned_router_path: 'cli/agent_onboard/command-router.js',
  dispatch_contract: 'argv_array_to_compatibility_port',
  supported_top_level_commands: ROUTER_COMMAND_ORDER,
  boundary: Object.freeze({
    used_by_runtime_entrypoint_in_this_gate: true,
    packaged_in_npm_tarball_in_this_gate: true,
    no_side_effect_on_require: true,
    no_file_writes: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    delegates_to_compatibility_port_only: true
  })
});

function describeRouterSeed() {
  return ROUTER_SEED;
}

function normalizeCreateEntrypointArgv(argv) {
  if (!Array.isArray(argv)) return argv;
  const raw = argv[1] || '';
  const invoked = String(raw).split(/[\\/]/).pop();
  if (invoked === 'create-agent-onboard' && argv[2] !== 'create') {
    return [argv[0], argv[1], 'create', ...argv.slice(2)];
  }
  return argv;
}

function route(argv, compatibilityPort) {
  if (!Array.isArray(argv)) {
    return Object.freeze({
      schema: 'agent-onboard-public-thin-cli-router-route-result-001',
      status: 'error',
      reason: 'argv must be an array',
      writes_files: false
    });
  }
  if (!compatibilityPort || typeof compatibilityPort.run !== 'function') {
    return Object.freeze({
      schema: 'agent-onboard-public-thin-cli-router-route-result-001',
      status: 'error',
      reason: 'compatibility port with run(argv) is required',
      writes_files: false
    });
  }
  return compatibilityPort.run(normalizeCreateEntrypointArgv(argv));
}

module.exports = Object.freeze({
  ROUTER_SEED,
  describeRouterSeed,
  normalizeCreateEntrypointArgv,
  route
});
