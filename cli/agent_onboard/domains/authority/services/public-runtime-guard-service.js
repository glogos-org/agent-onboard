'use strict';

const { createCoreConfigGuardService, CONFIG_GUARD_SERVICE_SEED } = require('../../core/services/config-guard-service');

const PUBLIC_RUNTIME_GUARD_SERVICE_DECOMPOSITION = Object.freeze({
  schema: 'agent-onboard-public-runtime-guard-service-decomposition-001',
  package_name: 'agent-onboard',
  domain_id: 'authority',
  service_id: 'public_runtime_guard_service',
  role: 'public_runtime_guard_command_surface',
  extracted_from: 'cli/agent_onboard/runtime-composer.js',
  service_path: 'cli/agent_onboard/domains/authority/services/public-runtime-guard-service.js',
  owned_commands: Object.freeze(['guard --plan', 'guard --check-boundary']),
  delegates_to: CONFIG_GUARD_SERVICE_SEED.service_id,
  boundary: Object.freeze({
    no_side_effect_on_require: true,
    no_file_writes: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true,
    target_config_reads_only_for_check_boundary: true
  })
});

function createPublicRuntimeGuardService(options = Object.freeze({})) {
  const emit = typeof options.json === 'function' ? options.json : options.emit;
  const guardService = createCoreConfigGuardService({
    emit,
    cwd: options.cwd,
    path: options.path,
    exists: options.exists,
    readJson: options.readJson,
    validateTargetConfig: options.validateTargetConfig,
    evaluateTargetBoundaryConfig: options.evaluateTargetBoundaryConfig,
    noMutationBoundary: options.noMutationBoundary,
    guardResultBase: options.guardResultBase,
    targetConfigFile: options.targetConfigFile,
    boundaryGuardContract: options.boundaryGuardContract
  });

  function runGuard(args = []) {
    return guardService.runGuard(args);
  }

  return Object.freeze({
    schema: 'agent-onboard-public-runtime-guard-service-instance-001',
    decomposition: PUBLIC_RUNTIME_GUARD_SERVICE_DECOMPOSITION,
    core_seed: CONFIG_GUARD_SERVICE_SEED,
    runGuard
  });
}

module.exports = Object.freeze({
  PUBLIC_RUNTIME_GUARD_SERVICE_DECOMPOSITION,
  createPublicRuntimeGuardService
});
