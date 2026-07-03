'use strict';

const PACKAGE_NAME = 'agent-onboard';
const TARGET_CONFIG_FILE = 'agent-onboard.target.json';
const RELEASE_LINE = 'public_core_config_guard_service_extraction_gate';

const TOP_LEVEL_COMMAND = Object.freeze({
  agents: 'agents',
  architecture: 'architecture',
  authority: 'authority',
  guard: 'guard',
  help: 'help',
  init: 'init',
  release: 'release',
  status: 'status',
  target: 'target',
  targetConfig: 'target-config',
  targetInstance: 'target-instance',
  version: 'version',
  workItems: 'work-items'
});

const TARGET_COMMAND = Object.freeze({
  doctor: 'doctor',
  profile: 'profile',
  repair: 'repair',
  runtime: 'runtime',
  onboarding: 'onboarding',
  bootstrap: 'bootstrap'
});

const OUTPUT_FLAG = Object.freeze({
  json: '--json',
  text: '--text'
});

const TARGET_OPTION = Object.freeze({
  force: '--force',
  target: '--target'
});

const TARGET_PROFILE_COMMAND = Object.freeze({
  help: 'agent-onboard target profile --json|--text [--target <path>]',
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target
  })
});

const TARGET_REPAIR_COMMAND = Object.freeze({
  help: 'agent-onboard target repair --plan|--write [--force] [--target <path>]',
  mode: Object.freeze({
    plan: '--plan',
    write: '--write'
  }),
  flag: Object.freeze({
    force: TARGET_OPTION.force,
    target: TARGET_OPTION.target
  })
});

const WORK_ITEMS_USABILITY_HELP_LINES = Object.freeze([
  'agent-onboard work-items --summary [.agent-onboard/work-items.json] [--text]',
  'agent-onboard work-items --next [.agent-onboard/work-items.json] [--text]',
  'agent-onboard work-items --mine [.agent-onboard/work-items.json] --actor <actor> [--text]'
]);

const TARGET_DOCTOR_COMMAND = Object.freeze({
  help: 'agent-onboard target doctor --json|--text [--target <path>]',
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target
  })
});

const PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES = Object.freeze([
  'LICENSE',
  'README.md',
  'cli/agent-onboard.js',
  'cli/agent_onboard/adapters/commands/architecture.js',
  'cli/agent_onboard/adapters/commands/authority.js',
  'cli/agent_onboard/adapters/commands/core.js',
  'cli/agent_onboard/adapters/commands/release-package.js',
  'cli/agent_onboard/adapters/commands/target.js',
  'cli/agent_onboard/adapters/commands/work-items.js',
  'cli/agent_onboard/adapters/compatibility-command-port.js',
  'cli/agent_onboard/command-router.js',
  'cli/agent_onboard/domains/architecture/m3-runtime-catalog.js',
  'cli/agent_onboard/domains/architecture/services/checks/architecture-check-service.js',
  'cli/agent_onboard/domains/architecture/services/runtime/architecture-runtime-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/architecture-source-domain-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/claims-source-domain-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/source-domain-closure-service.js',
  'cli/agent_onboard/domains/architecture/services/source-domains/work-items-source-domain-service.js',
  'cli/agent_onboard/domains/architecture/services/source-extraction/architecture-source-extraction-service.js',
  'cli/agent_onboard/domains/architecture/static-catalog.js',
  'cli/agent_onboard/domains/core/index.js',
  'cli/agent_onboard/domains/core/services/config-guard-service.js',
  'cli/agent_onboard/domains/package/index.js',
  'cli/agent_onboard/domains/package/services/installed-first-read-contract.js',
  'cli/agent_onboard/domains/package/services/package-coordinate-service.js',
  'cli/agent_onboard/domains/package/services/package-service.js',
  'cli/agent_onboard/domains/package/services/package-surface-service.js',
  'cli/agent_onboard/domains/package/services/source-manifest-service.js',
  'cli/agent_onboard/domains/service-partitions.js',
  'cli/agent_onboard/domains/target/services/target-runtime-utilities.js',
  'cli/agent_onboard/domains/target/services/target-service.js',
  'cli/agent_onboard/domains/target/static-catalog.js',
  'cli/agent_onboard/domains/work-items/index.js',
  'cli/agent_onboard/domains/work-items/services/work-items-service.js',
  'cli/agent_onboard/domains/work-items/static-catalog.js',
  'cli/agent_onboard/ports/compatibility-command-port.js',
  'cli/agent_onboard/runtime-composer.js',
  'cli/agent_onboard/runtime-contracts.js',
  'package.json'
]);

const PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES = Object.freeze(
  PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.filter((rel) => rel.startsWith('cli/agent_onboard/'))
);

const RUNTIME_CONTRACTS = Object.freeze({
  schema: 'agent-onboard-public-runtime-contracts-001',
  package_name: PACKAGE_NAME,
  role: 'shared_packaged_runtime_contracts',
  package_files: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  top_level_commands: Object.freeze(Object.values(TOP_LEVEL_COMMAND))
});

module.exports = Object.freeze({
  OUTPUT_FLAG,
  PACKAGE_NAME,
  PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES,
  PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  RELEASE_LINE,
  RUNTIME_CONTRACTS,
  TARGET_COMMAND,
  TARGET_CONFIG_FILE,
  TARGET_DOCTOR_COMMAND,
  TARGET_OPTION,
  TARGET_PROFILE_COMMAND,
  TARGET_REPAIR_COMMAND,
  TOP_LEVEL_COMMAND,
  WORK_ITEMS_USABILITY_HELP_LINES
});
