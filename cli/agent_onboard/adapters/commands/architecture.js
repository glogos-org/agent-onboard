'use strict';

const ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION = Object.freeze({
  schema: 'agent-onboard-public-architecture-command-adapter-extraction-module-001',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_architecture_command_adapter',
  planned_adapter_path: 'cli/agent_onboard/adapters/commands/architecture.js',
  compatibility_port_group: 'architecture',
  owned_top_level_commands: Object.freeze(['architecture']),
  excluded_top_level_commands: Object.freeze(['help', 'version', 'status', 'commands', 'release', 'authority', 'work-items', 'target', 'target-instance', 'init', 'agents', 'guard', 'target-config']),
  output_contract: Object.freeze({
    architecture: 'delegates to packaged CLI architecture command family through injected bundled handler',
    map: 'architecture --map remains bundled CLI output behind the command adapter',
    check: 'architecture --check remains bundled CLI output behind the command adapter'
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

function describeArchitectureCommandAdapterExtraction() {
  return ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION;
}

function createArchitectureCommandAdapter(options = Object.freeze({})) {
  const handlers = options.handlers && typeof options.handlers === 'object' ? options.handlers : Object.freeze({});
  return Object.freeze({
    schema: 'agent-onboard-public-architecture-command-adapter-instance-001',
    adapter: ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
    commands: ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION.owned_top_level_commands,
    architecture(argv) {
      if (typeof handlers.architecture === 'function') return handlers.architecture(Array.isArray(argv) ? argv.slice(3) : []);
      return Object.freeze({
        schema: 'agent-onboard-public-architecture-command-adapter-architecture-result-001',
        status: 'source_only_seed',
        writes_files: false,
        publishes_package: false,
        mutates_registry: false
      });
    },
    run(argv) {
      const command = Array.isArray(argv) ? (argv[2] || 'help') : 'help';
      if (command === 'architecture') return this.architecture(argv);
      return Object.freeze({
        schema: 'agent-onboard-public-architecture-command-adapter-run-result-001',
        status: 'unhandled_source_only_architecture_adapter',
        command,
        writes_files: false,
        publishes_package: false,
        mutates_registry: false
      });
    }
  });
}

module.exports = Object.freeze({
  ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
  describeArchitectureCommandAdapterExtraction,
  createArchitectureCommandAdapter
});
