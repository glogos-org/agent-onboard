'use strict';

const PACKAGE_NAME = 'agent-onboard';
const TARGET_CONFIG_FILE = '.agent-onboard/target.json';
const RELEASE_LINE = 'public_create_dry_run_product_gate';

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
  create: 'create',
  version: 'version',
  workItems: 'work-items'
});

const TOP_LEVEL_COMMAND_ALIAS = Object.freeze({
  helpLong: '--help',
  helpShort: '-h',
  versionLong: '--version',
  versionShort: '-v'
});

const ROUTER_COMMAND_ORDER = Object.freeze([
  TOP_LEVEL_COMMAND.help,
  TOP_LEVEL_COMMAND.version,
  TOP_LEVEL_COMMAND.status,
  TOP_LEVEL_COMMAND.create,
  TOP_LEVEL_COMMAND.init,
  TOP_LEVEL_COMMAND.agents,
  TOP_LEVEL_COMMAND.guard,
  TOP_LEVEL_COMMAND.authority,
  TOP_LEVEL_COMMAND.architecture,
  TOP_LEVEL_COMMAND.release,
  TOP_LEVEL_COMMAND.targetConfig,
  TOP_LEVEL_COMMAND.workItems,
  TOP_LEVEL_COMMAND.target,
  TOP_LEVEL_COMMAND.targetInstance
]);

const RUNTIME_COMMAND_GROUP = Object.freeze({
  core: Object.freeze([
    TOP_LEVEL_COMMAND.help,
    TOP_LEVEL_COMMAND.version,
    TOP_LEVEL_COMMAND.status,
    TOP_LEVEL_COMMAND.create
  ]),
  architecture: Object.freeze([
    TOP_LEVEL_COMMAND.architecture
  ]),
  releasePackage: Object.freeze([
    TOP_LEVEL_COMMAND.release
  ]),
  authority: Object.freeze([
    TOP_LEVEL_COMMAND.authority,
    TOP_LEVEL_COMMAND.agents,
    TOP_LEVEL_COMMAND.guard
  ]),
  onboarding: Object.freeze([
    TOP_LEVEL_COMMAND.agents,
    TOP_LEVEL_COMMAND.guard
  ]),
  target: Object.freeze([
    TOP_LEVEL_COMMAND.init,
    TOP_LEVEL_COMMAND.targetConfig,
    TOP_LEVEL_COMMAND.target,
    TOP_LEVEL_COMMAND.targetInstance
  ]),
  workItems: Object.freeze([
    TOP_LEVEL_COMMAND.workItems
  ]),
  coordination: Object.freeze([
    TOP_LEVEL_COMMAND.authority,
    TOP_LEVEL_COMMAND.workItems
  ])
});

const RUNTIME_ADAPTER_GROUP = Object.freeze({
  core: Object.freeze([
    TOP_LEVEL_COMMAND.help,
    TOP_LEVEL_COMMAND_ALIAS.helpLong,
    TOP_LEVEL_COMMAND_ALIAS.helpShort,
    TOP_LEVEL_COMMAND.version,
    TOP_LEVEL_COMMAND_ALIAS.versionLong,
    TOP_LEVEL_COMMAND_ALIAS.versionShort,
    TOP_LEVEL_COMMAND.status
  ]),
  architecture: RUNTIME_COMMAND_GROUP.architecture,
  releasePackage: RUNTIME_COMMAND_GROUP.releasePackage,
  authority: RUNTIME_COMMAND_GROUP.authority,
  target: RUNTIME_COMMAND_GROUP.target,
  workItems: RUNTIME_COMMAND_GROUP.workItems
});

const TARGET_COMMAND = Object.freeze({
  doctor: 'doctor',
  metadata: 'metadata',
  manifest: 'manifest',
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
  adoptExisting: '--adopt-existing',
  force: '--force',
  policy: '--policy',
  profile: '--profile',
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

const TARGET_METADATA_COMMAND = Object.freeze({
  help: 'agent-onboard target metadata --plan|--check|--write [--profile default] [--policy <path>] [--adopt-existing] [--force] [--target <path>]',
  mode: Object.freeze({
    plan: '--plan',
    check: '--check',
    write: '--write'
  }),
  flag: Object.freeze({
    adoptExisting: TARGET_OPTION.adoptExisting,
    force: TARGET_OPTION.force,
    policy: TARGET_OPTION.policy,
    profile: TARGET_OPTION.profile,
    target: TARGET_OPTION.target
  })
});


const TARGET_MANIFEST_COMMAND = Object.freeze({
  help: 'agent-onboard target manifest --check-drift|--init|--refresh [--dry-run|--write] [--target <path>]',
  mode: Object.freeze({
    checkDrift: '--check-drift',
    init: '--init',
    refresh: '--refresh',
    dryRun: '--dry-run',
    write: '--write'
  }),
  flag: Object.freeze({
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

const PRODUCT_HELP_LINES = Object.freeze([
  'agent-onboard status',
  'agent-onboard commands --json|--text',
  'agent-onboard guide --json|--text',
  'agent-onboard quickstart --json|--text|--dry-run',
  'agent-onboard discovery --llms|--json|--text',
  'agent-onboard create --dry-run|--json|--text',
  TARGET_DOCTOR_COMMAND.help,
  TARGET_PROFILE_COMMAND.help,
  TARGET_REPAIR_COMMAND.help,
  TARGET_METADATA_COMMAND.help,
  TARGET_MANIFEST_COMMAND.help,
  'agent-onboard target onboarding --plan|--fixture|--trial [--target <path>]|--write [--force]',
  'agent-onboard target bootstrap --dry-run|--write [--force]',
  'agent-onboard target-instance takeover --dry-run|--write [--force]',
  'agent-onboard work-items --list [.agent-onboard/work-items.json]',
  ...WORK_ITEMS_USABILITY_HELP_LINES,
  'agent-onboard work-items --init --dry-run|--write [--force]',
  'agent-onboard work-items --append --dry-run|--write --id <public-work-item-id> --title <title>',
  'agent-onboard work-items --claim --dry-run|--write --id <public-work-item-id> --actor <actor>',
  'agent-onboard work-items --close --dry-run|--write --id <public-work-item-id> --actor <actor> --summary <summary>',
  'agent-onboard init --dry-run|--write [--force]',
  'agent-onboard agents --preview|--write [--force]',
  'agent-onboard guard --plan|--check-boundary',
  'agent-onboard authority --first-read|--check',
  'agent-onboard architecture --map|--router|--facades|--check',
  'agent-onboard release --plan|--surface|--surface-check|--source-manifest|--source-manifest-check|--target-onboarding-smoke|--real-target-trial|--check',
  'agent-onboard target-config --schema|--template|--validate-template|--validate [.agent-onboard/target.json]'
]);

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
  'cli/agent_onboard/domains/core/services/ni-uri-service.js',
  'cli/agent_onboard/domains/package/index.js',
  'cli/agent_onboard/domains/package/services/installed-first-read-contract.js',
  'cli/agent_onboard/domains/package/services/package-coordinate-service.js',
  'cli/agent_onboard/domains/package/services/package-service.js',
  'cli/agent_onboard/domains/package/services/package-surface-service.js',
  'cli/agent_onboard/domains/package/services/source-manifest-service.js',
  'cli/agent_onboard/domains/service-partitions.js',
  'cli/agent_onboard/domains/target/services/target-constants.js',
  'cli/agent_onboard/domains/target/services/target-doctor-service.js',
  'cli/agent_onboard/domains/target/services/target-manifest-service.js',
  'cli/agent_onboard/domains/target/services/target-metadata-service.js',
  'cli/agent_onboard/domains/target/services/target-onboarding-service.js',
  'cli/agent_onboard/domains/target/services/target-profile-service.js',
  'cli/agent_onboard/domains/target/services/target-repair-service.js',
  'cli/agent_onboard/domains/target/services/target-runtime-utilities.js',
  'cli/agent_onboard/domains/target/services/target-service.js',
  'cli/agent_onboard/domains/target/services/target-templates-service.js',
  'cli/agent_onboard/domains/target/services/target-write-service.js',
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
  top_level_commands: ROUTER_COMMAND_ORDER,
  top_level_aliases: TOP_LEVEL_COMMAND_ALIAS,
  runtime_command_groups: RUNTIME_COMMAND_GROUP
});

module.exports = Object.freeze({
  OUTPUT_FLAG,
  PACKAGE_NAME,
  PRODUCT_HELP_LINES,
  PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES,
  PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  RELEASE_LINE,
  RUNTIME_CONTRACTS,
  TARGET_COMMAND,
  TARGET_CONFIG_FILE,
  TARGET_DOCTOR_COMMAND,
  TARGET_METADATA_COMMAND,
  TARGET_MANIFEST_COMMAND,
  TARGET_OPTION,
  TARGET_PROFILE_COMMAND,
  TARGET_REPAIR_COMMAND,
  ROUTER_COMMAND_ORDER,
  RUNTIME_ADAPTER_GROUP,
  RUNTIME_COMMAND_GROUP,
  TOP_LEVEL_COMMAND,
  TOP_LEVEL_COMMAND_ALIAS,
  WORK_ITEMS_USABILITY_HELP_LINES
});
