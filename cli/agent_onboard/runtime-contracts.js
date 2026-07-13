'use strict';

const PACKAGE_NAME = 'agent-onboard';
const TARGET_CONFIG_FILE = '.agent-onboard/target.json';
const RELEASE_LINE = 'public_runtime_composer_decomposition_gate';

const TOP_LEVEL_COMMAND = Object.freeze({
  agents: 'agents',
  bridge: 'bridge',
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
  issue: 'issue',
  contributor: 'contributor',
  claim: 'claim',
  check: 'check',
  ci: 'ci',
  mcp: 'mcp',
  version: 'version',
  workItems: 'work-items',
  contracts: 'contracts'
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
  TOP_LEVEL_COMMAND.issue,
  TOP_LEVEL_COMMAND.contributor,
  TOP_LEVEL_COMMAND.claim,
  TOP_LEVEL_COMMAND.contracts,
  TOP_LEVEL_COMMAND.check,
  TOP_LEVEL_COMMAND.ci,
  TOP_LEVEL_COMMAND.mcp,
  TOP_LEVEL_COMMAND.init,
  TOP_LEVEL_COMMAND.agents,
  TOP_LEVEL_COMMAND.bridge,
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
    TOP_LEVEL_COMMAND.create,
    TOP_LEVEL_COMMAND.issue,
    TOP_LEVEL_COMMAND.contributor,
    TOP_LEVEL_COMMAND.claim,
    TOP_LEVEL_COMMAND.contracts,
    TOP_LEVEL_COMMAND.check,
    TOP_LEVEL_COMMAND.ci,
    TOP_LEVEL_COMMAND.mcp
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
    TOP_LEVEL_COMMAND.bridge,
    TOP_LEVEL_COMMAND.guard
  ]),
  onboarding: Object.freeze([
    TOP_LEVEL_COMMAND.agents,
    TOP_LEVEL_COMMAND.bridge,
    TOP_LEVEL_COMMAND.guard
  ]),
  target: Object.freeze([
    TOP_LEVEL_COMMAND.init,
    TOP_LEVEL_COMMAND.targetConfig,
    TOP_LEVEL_COMMAND.target,
    TOP_LEVEL_COMMAND.targetInstance
  ]),
  workItems: Object.freeze([
    TOP_LEVEL_COMMAND.workItems,
    TOP_LEVEL_COMMAND.claim
  ]),
  coordination: Object.freeze([
    TOP_LEVEL_COMMAND.authority,
    TOP_LEVEL_COMMAND.workItems,
    TOP_LEVEL_COMMAND.claim,
    TOP_LEVEL_COMMAND.issue,
    TOP_LEVEL_COMMAND.contributor
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
  inventory: 'inventory',
  memory: 'memory',
  workItems: 'work-items',
  governance: 'governance',
  handoff: 'handoff',
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
    target: TARGET_OPTION.target,
    write: '--write',
    force: '--force'
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

const TARGET_INVENTORY_COMMAND = Object.freeze({
  help: 'agent-onboard target inventory --preview|--json|--text [--target <path>]',
  mode: Object.freeze({
    preview: '--preview',
    readinessCheck: '--readiness-check'
  }),
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target
  })
});

const TARGET_MEMORY_COMMAND = Object.freeze({
  help: 'agent-onboard target memory --preview|--json|--text [--target <path>]',
  mode: Object.freeze({
    preview: '--preview'
  }),
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target
  })
});

const TARGET_WORK_ITEMS_COMMAND = Object.freeze({
  help: 'agent-onboard target work-items --preview|--json|--text [--target <path>]',
  mode: Object.freeze({
    preview: '--preview'
  }),
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target
  })
});

const TARGET_GOVERNANCE_COMMAND = Object.freeze({
  help: 'agent-onboard target governance --preview|--check|--budget-contract|--budget-check|--materialize-dry-run|--materialize --write [--force]|--json|--text [--target <path>]',
  mode: Object.freeze({
    preview: '--preview',
    materializeDryRun: '--materialize-dry-run',
    driftCheck: '--check',
    budgetContract: '--budget-contract',
    budgetCheck: '--budget-check',
    materialize: '--materialize'
  }),
  flag: Object.freeze({
    json: OUTPUT_FLAG.json,
    text: OUTPUT_FLAG.text,
    target: TARGET_OPTION.target,
    write: '--write',
    force: '--force'
  })
});

const TARGET_HANDOFF_COMMAND = Object.freeze({
  help: 'agent-onboard target handoff --preview|--readiness-check|--json|--text [--target <path>]',
  mode: Object.freeze({
    preview: '--preview',
    readinessCheck: '--readiness-check'
  }),
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
  'agent-onboard issue --classify-dry-run|--json|--text [--title <title>] [--label <label>] [--actor <kind>] [--source <kind>] [--repo <owner/name>] [--issue-number <number>]',
  'agent-onboard contributor --admission-dry-run|--json|--text [--actor <kind>] [--handle <handle>] [--email <email>] [--repo <owner/name>] [--identity-surface <surface>] [--agreement <surface>] [--ai-assisted yes|no] [--assisted-by <trailer>]',
  'agent-onboard claim --validate-ledger [--file <path>] [--json|--text]',
  'agent-onboard claim --lifecycle-check [--file <path>] [--stale-hours <hours>] [--json|--text]',
  'agent-onboard claim --append --dry-run|--write --work-item-id <id> --actor <actor> [--event-type claim_proposed|claim_merged] [--claim-id <id>] [--note <note>]',
  'agent-onboard contracts --json|--text|--check|--validate-output --contract <id> --file <path>',
  'agent-onboard check --plan|--fast [--json|--text]',
  'agent-onboard ci --github-action|--json|--text',
  'agent-onboard mcp --plan|--json|--text',
  TARGET_DOCTOR_COMMAND.help,
  TARGET_PROFILE_COMMAND.help,
  TARGET_INVENTORY_COMMAND.help,
  TARGET_MEMORY_COMMAND.help,
  TARGET_WORK_ITEMS_COMMAND.help,
  TARGET_GOVERNANCE_COMMAND.help,
  TARGET_HANDOFF_COMMAND.help,
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
  'agent-onboard bridge --dry-run|--check|--write [--target <path>] [--json|--text]',
  'agent-onboard guard --plan|--check-boundary',
  'agent-onboard authority --first-read|--check|--index|--index-check|--state|--state-check',
  'agent-onboard architecture --map|--router|--facades|--check',
  'agent-onboard release --plan|--surface|--surface-check|--source-manifest|--source-manifest-check|--artifact-oracle|--artifact-oracle-check|--authority-state-parity|--authority-state-parity-check|--clean-inventory|--clean-check|--clean-catalog|--clean-catalog-check|--keyword-taxonomy|--keyword-taxonomy-check|--readme-plan|--readme-plan-check|--readme-dry-run|--readme-dry-run-check|--readme-apply|--readme-apply-check|--closed-gates-plan|--closed-gates-plan-check|--closed-gates-dry-run|--closed-gates-dry-run-check|--closed-gates-apply|--closed-gates-apply-check|--closed-gates-read|--closed-gates-read-check|--closed-gates-prune-plan|--closed-gates-prune-plan-check|--closed-gates-prune-dry-run|--closed-gates-prune-dry-run-check|--closed-gates-prune-apply|--closed-gates-prune-apply-check|--full-test-runner|--full-test-runner-check|--target-onboarding-smoke|--real-target-trial|--check',
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
  'cli/agent_onboard/contracts/public-contracts.js',
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
  'cli/agent_onboard/domains/core/services/public-runtime-surface-service.js',
  'cli/agent_onboard/domains/package/index.js',
  'cli/agent_onboard/domains/package/services/installed-first-read-contract.js',
  'cli/agent_onboard/domains/package/services/package-coordinate-service.js',
  'cli/agent_onboard/domains/package/services/package-service.js',
  'cli/agent_onboard/domains/package/services/package-surface-service.js',
  'cli/agent_onboard/domains/package/services/source-manifest-service.js',
  'cli/agent_onboard/domains/service-partitions.js',
  'cli/agent_onboard/domains/target/services/target-constants.js',
  'cli/agent_onboard/domains/target/services/target-doctor-service.js',
  'cli/agent_onboard/domains/target/services/target-governance-service.js',
  'cli/agent_onboard/domains/target/services/target-handoff-service.js',
  'cli/agent_onboard/domains/target/services/target-inventory-service.js',
  'cli/agent_onboard/domains/target/services/target-manifest-service.js',
  'cli/agent_onboard/domains/target/services/target-metadata-service.js',
  'cli/agent_onboard/domains/target/services/target-onboarding-service.js',
  'cli/agent_onboard/domains/target/services/target-profile-service.js',
  'cli/agent_onboard/domains/target/services/target-repair-service.js',
  'cli/agent_onboard/domains/target/services/target-runtime-utilities.js',
  'cli/agent_onboard/domains/target/services/target-service.js',
  'cli/agent_onboard/domains/target/services/target-templates-service.js',
  'cli/agent_onboard/domains/target/services/target-work-items-service.js',
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
  TARGET_GOVERNANCE_COMMAND,
  TARGET_HANDOFF_COMMAND,
  TARGET_INVENTORY_COMMAND,
  TARGET_METADATA_COMMAND,
  TARGET_MANIFEST_COMMAND,
  TARGET_MEMORY_COMMAND,
  TARGET_WORK_ITEMS_COMMAND,
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
