'use strict';

const CORE_COMMAND_ADAPTER_EXTRACTION = Object.freeze({
  schema: 'agent-onboard-public-core-command-adapter-extraction-module-001',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_core_command_adapter',
  planned_adapter_path: 'cli/agent_onboard/adapters/commands/core.js',
  compatibility_port_group: 'core',
  owned_top_level_commands: Object.freeze(['help', 'version', 'status']),
  excluded_top_level_commands: Object.freeze(['architecture', 'release', 'authority', 'work-items', 'target', 'target-instance', 'init', 'agents', 'bridge', 'guard', 'target-config']),
  output_contract: Object.freeze({
    help: 'delegates to packaged CLI help output through injected bundled handler',
    version: 'delegates to packaged CLI version output through injected bundled handler',
    status: 'delegates to packaged CLI status JSON through injected bundled handler'
  }),
  boundary: Object.freeze({
    used_by_runtime_entrypoint_in_this_gate: true,
    packaged_in_npm_tarball_in_this_gate: true,
    no_side_effect_on_require: true,
    no_file_writes: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true
  })
});

function describeCoreCommandAdapterExtraction() {
  return CORE_COMMAND_ADAPTER_EXTRACTION;
}

function createCoreCommandAdapter(options = Object.freeze({})) {
  const version = typeof options.version === 'string' && options.version ? options.version : '0.0.0';
  const releaseLine = typeof options.releaseLine === 'string' && options.releaseLine ? options.releaseLine : 'source_only_core_adapter';
  const handlers = options.handlers && typeof options.handlers === 'object' ? options.handlers : Object.freeze({});
  function delegate(name, argv) {
    if (typeof handlers[name] === 'function') return handlers[name](Array.isArray(argv) ? argv.slice(3) : []);
    return null;
  }
  return Object.freeze({
    schema: 'agent-onboard-public-core-command-adapter-instance-001',
    adapter: CORE_COMMAND_ADAPTER_EXTRACTION,
    commands: CORE_COMMAND_ADAPTER_EXTRACTION.owned_top_level_commands,
    help() {
      const delegated = delegate('help', arguments[0]);
      if (delegated !== null) return delegated;
      return Object.freeze({
        schema: 'agent-onboard-public-core-command-adapter-help-result-001',
        status: 'source_only_seed',
        writes_files: false
      });
    },
    version() {
      const delegated = delegate('version', arguments[0]);
      if (delegated !== null) return delegated;
      return `agent-onboard ${version}`;
    },
    status() {
      const delegated = delegate('status', arguments[0]);
      if (delegated !== null) return delegated;
      return Object.freeze({
        schema: 'agent-onboard-status-001',
        status: 'ok',
        version,
        release_line: releaseLine
      });
    },
    run(argv) {
      const command = Array.isArray(argv) ? (argv[2] || 'help') : 'help';
      if (command === 'version' || command === '--version' || command === '-v') return this.version(argv);
      if (command === 'status') return this.status(argv);
      if (command === 'help' || command === '--help' || command === '-h') return this.help(argv);
      return Object.freeze({
        schema: 'agent-onboard-public-core-command-adapter-run-result-001',
        status: 'unhandled_source_only_core_adapter',
        command,
        writes_files: false
      });
    }
  });
}

module.exports = Object.freeze({
  CORE_COMMAND_ADAPTER_EXTRACTION,
  describeCoreCommandAdapterExtraction,
  createCoreCommandAdapter
});
