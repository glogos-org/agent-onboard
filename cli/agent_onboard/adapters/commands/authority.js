'use strict';

const AUTHORITY_COMMAND_ADAPTER_EXTRACTION = Object.freeze({
  schema: 'agent-onboard-public-authority-command-adapter-extraction-module-001',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_authority_command_adapter',
  planned_adapter_path: 'cli/agent_onboard/adapters/commands/authority.js',
  compatibility_port_group: 'authority',
  owned_top_level_commands: Object.freeze(['authority', 'agents', 'guard']),
  excluded_top_level_commands: Object.freeze(['help', 'version', 'status', 'commands', 'architecture', 'release', 'work-items', 'target', 'target-instance', 'init', 'target-config']),
  output_contract: Object.freeze({
    authority: 'delegates to packaged CLI authority command family through injected bundled handler',
    agents: 'agents remains bundled CLI output behind the command adapter',
    guard: 'guard remains bundled CLI output behind the command adapter'
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

function describeAuthorityCommandAdapterExtraction() {
  return AUTHORITY_COMMAND_ADAPTER_EXTRACTION;
}

function createAuthorityCommandAdapter(options = Object.freeze({})) {
  const handlers = options.handlers && typeof options.handlers === 'object' ? options.handlers : Object.freeze({});
  return Object.freeze({
    schema: 'agent-onboard-public-authority-command-adapter-instance-001',
    adapter: AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
    commands: AUTHORITY_COMMAND_ADAPTER_EXTRACTION.owned_top_level_commands,
    authority(argv) {
      const command = Array.isArray(argv) ? (argv[2] || 'authority') : 'authority';
      if (typeof handlers[command] === 'function') return handlers[command](Array.isArray(argv) ? argv.slice(3) : []);
      return Object.freeze({
        schema: 'agent-onboard-public-authority-command-adapter-authority-result-001',
        status: 'source_only_seed',
        writes_files: false,
        publishes_package: false,
        mutates_registry: false
      });
    },
    run(argv) {
      const command = Array.isArray(argv) ? (argv[2] || 'help') : 'help';
      if (AUTHORITY_COMMAND_ADAPTER_EXTRACTION.owned_top_level_commands.includes(command)) return this.authority(argv);
      return Object.freeze({
        schema: 'agent-onboard-public-authority-command-adapter-run-result-001',
        status: 'unhandled_source_only_authority_adapter',
        command,
        writes_files: false,
        publishes_package: false,
        mutates_registry: false
      });
    }
  });
}

module.exports = Object.freeze({
  AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
  describeAuthorityCommandAdapterExtraction,
  createAuthorityCommandAdapter
});
