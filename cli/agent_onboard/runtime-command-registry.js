'use strict';

const { createCompatibilityCommandPort } = require('./adapters/compatibility-command-port');
const { createCoreCommandAdapter } = require('./adapters/commands/core');
const { createPackageCommandAdapter } = require('./adapters/commands/release-package');
const { createArchitectureCommandAdapter } = require('./adapters/commands/architecture');
const { createAuthorityCommandAdapter } = require('./adapters/commands/authority');
const { createTargetCommandAdapter } = require('./adapters/commands/target');
const { createWorkItemsCommandAdapter } = require('./adapters/commands/work-items');
const { service: packageDomain } = require('./domains/package');
const { createWorkItemsService } = require('./domains/work-items');
const {
  PACKAGE_NAME,
  RELEASE_LINE,
  TOP_LEVEL_COMMAND,
  TOP_LEVEL_COMMAND_ALIAS
} = require('./runtime-contracts');

const COMMANDS_COMMAND = 'commands';
const GUIDE_COMMAND = 'guide';
const QUICKSTART_COMMAND = 'quickstart';
const DISCOVERY_COMMAND = 'discovery';
const CREATE_COMMAND = 'create';
const ISSUE_COMMAND = 'issue';
const CONTRIBUTOR_COMMAND = 'contributor';
const CONTRACTS_COMMAND = 'contracts';
const CHECK_COMMAND = 'check';
const CI_COMMAND = 'ci';
const MCP_COMMAND = 'mcp';

const RUNTIME_COMMAND_REGISTRY_EXTRACTION = Object.freeze({
  schema: 'agent-onboard-public-runtime-command-registry-extraction-001',
  package_name: PACKAGE_NAME,
  extraction_gate: 'public_runtime_command_registry_extraction',
  release_line: RELEASE_LINE,
  role: 'packaged_runtime_command_registry',
  module_path: 'cli/agent_onboard/runtime-command-registry.js',
  extracted_from: 'cli/agent_onboard/runtime-composer.js',
  owns: Object.freeze([
    'top-level command route handler table',
    'command alias normalization',
    'runtime compatibility port assembly',
    'command adapter assembly'
  ]),
  boundary: Object.freeze({
    no_side_effect_on_require: true,
    no_file_writes_on_require: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true,
    storage_backend_changed: false,
    sqlite_introduced: false,
    lmdb_introduced: false,
    mdbx_introduced: false
  })
});

function describeRuntimeCommandRegistryExtraction() {
  return RUNTIME_COMMAND_REGISTRY_EXTRACTION;
}

function normalizeCommand(cmd) {
  if (!cmd || [TOP_LEVEL_COMMAND.help, TOP_LEVEL_COMMAND_ALIAS.helpLong, TOP_LEVEL_COMMAND_ALIAS.helpShort].includes(cmd)) return TOP_LEVEL_COMMAND.help;
  if ([TOP_LEVEL_COMMAND.version, TOP_LEVEL_COMMAND_ALIAS.versionLong, TOP_LEVEL_COMMAND_ALIAS.versionShort].includes(cmd)) return TOP_LEVEL_COMMAND.version;
  return cmd;
}

function requireFacade(facades, group, method) {
  const facade = facades && facades[group];
  const value = facade && facade[method];
  if (typeof value !== 'function') throw new Error(`runtime command registry requires facades.${group}.${method}`);
  return value;
}

function createCommandRouteHandlers(facades) {
  return Object.freeze({
    [TOP_LEVEL_COMMAND.help]: requireFacade(facades, 'coreService', 'help'),
    [TOP_LEVEL_COMMAND.version]: requireFacade(facades, 'coreService', 'printVersion'),
    [TOP_LEVEL_COMMAND.status]: requireFacade(facades, 'coreService', 'runStatus'),
    [COMMANDS_COMMAND]: requireFacade(facades, 'coreService', 'runCommands'),
    [GUIDE_COMMAND]: requireFacade(facades, 'coreService', 'runGuide'),
    [QUICKSTART_COMMAND]: requireFacade(facades, 'coreService', 'runQuickstart'),
    [DISCOVERY_COMMAND]: requireFacade(facades, 'coreService', 'runDiscovery'),
    [CREATE_COMMAND]: requireFacade(facades, 'coreService', 'runCreate'),
    [TOP_LEVEL_COMMAND.create]: requireFacade(facades, 'coreService', 'runCreate'),
    [ISSUE_COMMAND]: requireFacade(facades, 'coreService', 'runIssue'),
    [TOP_LEVEL_COMMAND.issue]: requireFacade(facades, 'coreService', 'runIssue'),
    [CONTRIBUTOR_COMMAND]: requireFacade(facades, 'coreService', 'runContributor'),
    [TOP_LEVEL_COMMAND.contributor]: requireFacade(facades, 'coreService', 'runContributor'),
    [TOP_LEVEL_COMMAND.claim]: requireFacade(facades, 'workItemsService', 'runClaim'),
    [CONTRACTS_COMMAND]: requireFacade(facades, 'coreService', 'runContracts'),
    [TOP_LEVEL_COMMAND.contracts]: requireFacade(facades, 'coreService', 'runContracts'),
    [CHECK_COMMAND]: requireFacade(facades, 'coreService', 'runCheck'),
    [TOP_LEVEL_COMMAND.check]: requireFacade(facades, 'coreService', 'runCheck'),
    [CI_COMMAND]: requireFacade(facades, 'coreService', 'runCi'),
    [TOP_LEVEL_COMMAND.ci]: requireFacade(facades, 'coreService', 'runCi'),
    [MCP_COMMAND]: requireFacade(facades, 'coreService', 'runMcp'),
    [TOP_LEVEL_COMMAND.mcp]: requireFacade(facades, 'coreService', 'runMcp'),
    [TOP_LEVEL_COMMAND.init]: requireFacade(facades, 'targetService', 'runInit'),
    [TOP_LEVEL_COMMAND.agents]: requireFacade(facades, 'authorityService', 'runAgents'),
    [TOP_LEVEL_COMMAND.bridge]: requireFacade(facades, 'authorityService', 'runBridge'),
    [TOP_LEVEL_COMMAND.guard]: requireFacade(facades, 'authorityService', 'runGuard'),
    [TOP_LEVEL_COMMAND.authority]: requireFacade(facades, 'authorityService', 'runAuthority'),
    [TOP_LEVEL_COMMAND.architecture]: requireFacade(facades, 'coreService', 'runArchitecture'),
    [TOP_LEVEL_COMMAND.release]: requireFacade(facades, 'releasePackageService', 'runRelease'),
    [TOP_LEVEL_COMMAND.targetConfig]: requireFacade(facades, 'targetService', 'runTargetConfig'),
    [TOP_LEVEL_COMMAND.workItems]: requireFacade(facades, 'workItemsService', 'runWorkItems'),
    [TOP_LEVEL_COMMAND.target]: requireFacade(facades, 'targetService', 'runTargetCommand'),
    [TOP_LEVEL_COMMAND.targetInstance]: requireFacade(facades, 'targetService', 'runTargetInstance')
  });
}

function dispatchCommandFromRegistry(argv = [], handlers = Object.freeze({})) {
  const [rawCommand, ...args] = argv;
  const command = normalizeCommand(rawCommand);
  const handler = handlers[command];
  if (!handler) throw new Error(`unsupported command: ${rawCommand}`);
  return handler(args);
}

function createRuntimeAdapters({ facades, handlers, version, releaseLine, workItemsDependencies }) {
  const coreAdapter = createCoreCommandAdapter({
    version,
    releaseLine,
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.help]: handlers[TOP_LEVEL_COMMAND.help],
      [TOP_LEVEL_COMMAND.version]: handlers[TOP_LEVEL_COMMAND.version],
      [TOP_LEVEL_COMMAND.status]: handlers[TOP_LEVEL_COMMAND.status]
    })
  });
  const packageAdapter = createPackageCommandAdapter({
    service: packageDomain.createPackageService({
      release: requireFacade(facades, 'releasePackageService', 'runRelease')
    })
  });
  const architectureAdapter = createArchitectureCommandAdapter({
    handlers: Object.freeze({ [TOP_LEVEL_COMMAND.architecture]: handlers[TOP_LEVEL_COMMAND.architecture] })
  });
  const authorityAdapter = createAuthorityCommandAdapter({
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.agents]: handlers[TOP_LEVEL_COMMAND.agents],
      [TOP_LEVEL_COMMAND.bridge]: handlers[TOP_LEVEL_COMMAND.bridge],
      [TOP_LEVEL_COMMAND.guard]: handlers[TOP_LEVEL_COMMAND.guard],
      [TOP_LEVEL_COMMAND.authority]: handlers[TOP_LEVEL_COMMAND.authority]
    })
  });
  const targetAdapter = createTargetCommandAdapter({
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.init]: handlers[TOP_LEVEL_COMMAND.init],
      [TOP_LEVEL_COMMAND.targetConfig]: handlers[TOP_LEVEL_COMMAND.targetConfig],
      [TOP_LEVEL_COMMAND.target]: handlers[TOP_LEVEL_COMMAND.target],
      [TOP_LEVEL_COMMAND.targetInstance]: handlers[TOP_LEVEL_COMMAND.targetInstance]
    })
  });
  const workItemsService = createWorkItemsService(workItemsDependencies || Object.freeze({}));
  const workItemsAdapter = createWorkItemsCommandAdapter({ service: workItemsService });
  return Object.freeze({
    [TOP_LEVEL_COMMAND.help]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.helpLong]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.helpShort]: coreAdapter,
    [TOP_LEVEL_COMMAND.version]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.versionLong]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.versionShort]: coreAdapter,
    [TOP_LEVEL_COMMAND.status]: coreAdapter,
    [TOP_LEVEL_COMMAND.release]: packageAdapter,
    [TOP_LEVEL_COMMAND.architecture]: architectureAdapter,
    [TOP_LEVEL_COMMAND.authority]: authorityAdapter,
    [TOP_LEVEL_COMMAND.agents]: authorityAdapter,
    [TOP_LEVEL_COMMAND.bridge]: authorityAdapter,
    [TOP_LEVEL_COMMAND.guard]: authorityAdapter,
    [TOP_LEVEL_COMMAND.init]: targetAdapter,
    [TOP_LEVEL_COMMAND.targetConfig]: targetAdapter,
    [TOP_LEVEL_COMMAND.target]: targetAdapter,
    [TOP_LEVEL_COMMAND.targetInstance]: targetAdapter,
    [TOP_LEVEL_COMMAND.workItems]: workItemsAdapter,
    [TOP_LEVEL_COMMAND.claim]: workItemsAdapter
  });
}

function createRuntimeCompatibilityPortFromRegistry(options = Object.freeze({})) {
  const facades = options.facades || Object.freeze({});
  const handlers = createCommandRouteHandlers(facades);
  const adapters = createRuntimeAdapters({
    facades,
    handlers,
    version: options.version,
    releaseLine: options.releaseLine,
    workItemsDependencies: options.workItemsDependencies
  });
  const portHandlers = {};
  for (const command of Object.keys(handlers)) {
    portHandlers[command] = (argv = []) => {
      const normalized = normalizeCommand(argv[2]);
      return handlers[normalized](argv.slice(3));
    };
  }
  portHandlers[TOP_LEVEL_COMMAND_ALIAS.helpLong] = portHandlers[TOP_LEVEL_COMMAND.help];
  portHandlers[TOP_LEVEL_COMMAND_ALIAS.helpShort] = portHandlers[TOP_LEVEL_COMMAND.help];
  portHandlers[TOP_LEVEL_COMMAND_ALIAS.versionLong] = portHandlers[TOP_LEVEL_COMMAND.version];
  portHandlers[TOP_LEVEL_COMMAND_ALIAS.versionShort] = portHandlers[TOP_LEVEL_COMMAND.version];
  portHandlers.default = (argv = []) => {
    const command = argv[2] || TOP_LEVEL_COMMAND.help;
    throw new Error(`unsupported command: ${command}`);
  };
  return createCompatibilityCommandPort(Object.freeze(portHandlers), Object.freeze({ adapters }));
}

module.exports = Object.freeze({
  RUNTIME_COMMAND_REGISTRY_EXTRACTION,
  describeRuntimeCommandRegistryExtraction,
  normalizeCommand,
  createCommandRouteHandlers,
  dispatchCommandFromRegistry,
  createRuntimeCompatibilityPortFromRegistry
});
