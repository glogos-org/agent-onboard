'use strict';

const fs = require('fs');
const path = require('path');
const {
  OUTPUT_FLAG,
  PACKAGE_NAME,
  PRODUCT_HELP_LINES,
  RELEASE_LINE,
  ROUTER_COMMAND_ORDER,
  RUNTIME_COMMAND_GROUP,
  TOP_LEVEL_COMMAND_ALIAS
} = require('../../../runtime-contracts');
const VERSION = require('../../../../../package.json').version;
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

function packageRoot() {
  return path.resolve(__dirname, '../../../../..');
}

function commandLineFamily(line) {
  const match = /^agent-onboard\s+([^\s]+)/.exec(line);
  return match ? match[1] : 'other';
}

function groupCommandHelpLines(lines) {
  const groups = {};
  for (const line of lines) {
    const family = commandLineFamily(line);
    if (!groups[family]) groups[family] = [];
    groups[family].push(line);
  }
  return groups;
}

function commandMutatesRepository(line) {
  return /\s--write\b/.test(line) || /\s--force\b/.test(line);
}

function commandSurfaceCatalog() {
  const helpLines = PRODUCT_HELP_LINES.slice();
  return {
    schema: 'agent-onboard-public-command-surface-catalog-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard commands --json',
    purpose: 'machine-readable and human-readable catalog of the packaged public command surface',
    top_level_commands: ROUTER_COMMAND_ORDER.includes(COMMANDS_COMMAND) ? ROUTER_COMMAND_ORDER.slice() : [...ROUTER_COMMAND_ORDER.slice(0, 3), COMMANDS_COMMAND, GUIDE_COMMAND, QUICKSTART_COMMAND, DISCOVERY_COMMAND, ...ROUTER_COMMAND_ORDER.slice(3)],
    top_level_aliases: Object.assign({}, TOP_LEVEL_COMMAND_ALIAS),
    runtime_command_groups: Object.fromEntries(Object.entries(RUNTIME_COMMAND_GROUP).map(([key, value]) => [key, key === 'core' ? Array.from(new Set([...value, COMMANDS_COMMAND, GUIDE_COMMAND, QUICKSTART_COMMAND, DISCOVERY_COMMAND, CREATE_COMMAND, ISSUE_COMMAND, CONTRIBUTOR_COMMAND, CHECK_COMMAND, CI_COMMAND, MCP_COMMAND])) : value.slice()])),
    help_lines: helpLines,
    help_groups: groupCommandHelpLines(helpLines),
    command_lines: helpLines.map((line) => ({
      command: line,
      family: commandLineFamily(line),
      mutates_repository_when_write_flag_is_used: commandMutatesRepository(line)
    })),
    recommended_first_commands: [
      'agent-onboard commands --text',
      'agent-onboard guide --text',
      'agent-onboard quickstart --text',
      'agent-onboard discovery --llms',
      'agent-onboard create --dry-run',
      'agent-onboard issue --classify-dry-run --text',
      'agent-onboard contributor --admission-dry-run --text',
      'agent-onboard claim --validate-ledger --text',
      'agent-onboard claim --lifecycle-check --text',
      'agent-onboard contracts --text',
      'agent-onboard contracts --check --json',
      'agent-onboard contracts --validate-output --contract <id> --file <path> --json',
      'agent-onboard check --plan --text',
      'agent-onboard check --fast --text',
      'agent-onboard ci --github-action',
      'agent-onboard mcp --plan --text',
      'agent-onboard bridge --dry-run --text',
      'agent-onboard bridge --check --text',
      'agent-onboard status',
      'agent-onboard target doctor --text',
      'agent-onboard target inventory --text',
      'agent-onboard target memory --text',
      'agent-onboard target governance --text',
      'agent-onboard target governance --budget-contract --text',
      'agent-onboard target governance --budget-check --text',
      'agent-onboard target governance --materialize-dry-run --text',
      'agent-onboard target governance --check --text',
      'agent-onboard target work-items --text',
      'agent-onboard target handoff --text',
      'agent-onboard work-items --next --text',
      'agent-onboard release --authority-state-parity-check',
      'agent-onboard release --clean-check',
      'agent-onboard release --clean-catalog-check',
      'agent-onboard release --keyword-taxonomy-check',
      'agent-onboard release --readme-plan-check',
      'agent-onboard release --readme-dry-run-check',
      'agent-onboard release --readme-apply-check',
      'agent-onboard release --closed-gates-plan-check',
      'agent-onboard release --closed-gates-dry-run-check',
      'agent-onboard release --check'
    ],
    output_modes: ['--json', '--text'],
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      publishes_package: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false
    }
  };
}

function commandSurfaceText(catalog = commandSurfaceCatalog()) {
  const lines = [
    `agent-onboard command surface ${catalog.version}`,
    '',
    'Top-level commands:',
    ...catalog.top_level_commands.map((command) => `- ${command}`),
    '',
    'Recommended first commands:',
    ...catalog.recommended_first_commands.map((command) => `- ${command}`),
    '',
    'Public command lines:'
  ];
  for (const line of catalog.help_lines) lines.push(`- ${line}`);
  lines.push('', 'Use `agent-onboard commands --json` for machine-readable command discovery.');
  return `${lines.join('\n')}\n`;
}

const commandSurfaceService = Object.freeze({
  catalog: commandSurfaceCatalog,
  text: commandSurfaceText
});

function operatorGuideCatalog() {
  return {
    schema: 'agent-onboard-public-operator-guide-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard guide --json',
    purpose: 'compact operator and agent orientation guide for choosing the next public workflow',
    first_read_order: discoveryFirstReadOrder(),
    workflows: {
      new_agent_orientation: {
        goal: 'discover the CLI surface and repository authority before editing',
        commands: [
          'agent-onboard guide --text',
          'agent-onboard commands --text',
          'agent-onboard quickstart --text',
          'agent-onboard create --dry-run',
          'agent-onboard issue --classify-dry-run --text',
          'agent-onboard contributor --admission-dry-run --text',
          'agent-onboard check --plan --text',
          'agent-onboard mcp --plan --text',
          'agent-onboard bridge --dry-run --text',
          'agent-onboard authority --first-read',
          'agent-onboard work-items --next --text'
        ],
        writes_files: false
      },
      target_repo_triage: {
        goal: 'inspect an arbitrary target repository before onboarding or repair',
        commands: [
          'agent-onboard target doctor --text',
          'agent-onboard target profile --text',
          'agent-onboard target inventory --text',
          'agent-onboard target memory --text',
          'agent-onboard target governance --text',
          'agent-onboard target governance --budget-contract --text',
          'agent-onboard target governance --budget-check --text',
          'agent-onboard target governance --materialize-dry-run --text',
          'agent-onboard target work-items --text',
          'agent-onboard target metadata --plan',
          'agent-onboard target manifest --check-drift'
        ],
        writes_files: false
      },
      target_onboarding_preview: {
        goal: 'preview target onboarding files and conflicts before explicit writes',
        commands: [
          'agent-onboard quickstart --text',
          'agent-onboard target onboarding --plan',
          'agent-onboard target onboarding --fixture',
          'agent-onboard target bootstrap --dry-run',
          'agent-onboard target-instance takeover --dry-run',
          'agent-onboard bridge --dry-run --text'
        ],
        writes_files: false
      },
      create_entrypoint_preview: {
        goal: 'preview the future npm create onboarding write set without mutating the consuming repository',
        commands: [
          'agent-onboard create --dry-run',
          'create-agent-onboard --dry-run',
          'npm create agent-onboard@latest -- --dry-run'
        ],
        writes_files: false
      },
      mcp_bridge_planning: {
        goal: 'preview the MCP bridge contract before any server implementation or client wiring',
        commands: [
          'agent-onboard mcp --plan --text',
          'agent-onboard mcp --json',
          'agent-onboard commands --json',
          'agent-onboard check --fast --json'
        ],
        writes_files: false,
        starts_server: false
      },
      source_release_handoff: {
        goal: 'prepare a source package handoff without publishing or mutating the registry',
        commands: [
          'agent-onboard release --source-manifest',
          'agent-onboard release --source-manifest-check',
          'agent-onboard release --surface-check',
          'agent-onboard check --fast --text',
          'agent-onboard release --check'
        ],
        writes_files: false,
        publishes_package: false
      }
    },
    escalation_points: [
      'Use explicit --write commands only after owner authorization.',
      'Use --force only for intentional replacement of known canonical files.',
      'Run package publish or Git mutation outside this CLI after human release handoff.'
    ],
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      publishes_package: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false
    }
  };
}

function operatorGuideText(guide = operatorGuideCatalog()) {
  const lines = [
    `agent-onboard operator guide ${guide.version}`,
    '',
    'First read order:',
    ...guide.first_read_order.map((entry) => `- ${entry}`),
    ''
  ];
  const labels = {
    new_agent_orientation: 'New agent orientation',
    target_repo_triage: 'Target repo triage',
    target_onboarding_preview: 'Target onboarding preview',
    mcp_bridge_planning: 'MCP bridge planning',
    source_release_handoff: 'Source release handoff'
  };
  for (const [key, workflow] of Object.entries(guide.workflows)) {
    lines.push(labels[key] || key, `Goal: ${workflow.goal}`, 'Commands:');
    for (const command of workflow.commands) lines.push(`- ${command}`);
    lines.push('');
  }
  lines.push('Escalation points:');
  for (const point of guide.escalation_points) lines.push(`- ${point}`);
  lines.push('', 'Use `agent-onboard guide --json` for machine-readable workflow selection.');
  return `${lines.join('\n')}\n`;
}

const operatorGuideService = Object.freeze({
  catalog: operatorGuideCatalog,
  text: operatorGuideText
});

function quickstartCatalog() {
  return {
    schema: 'agent-onboard-public-quickstart-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard quickstart --json',
    purpose: 'read-only first-run recipe for orienting an operator or agent before target onboarding',
    modes: ['--text', '--json', '--dry-run'],
    primary_recipe: [
      {
        step: 1,
        command: 'agent-onboard guide --text',
        purpose: 'select the right public workflow before making changes',
        writes_files: false
      },
      {
        step: 2,
        command: 'agent-onboard commands --text',
        purpose: 'inspect the packaged CLI command surface',
        writes_files: false
      },
      {
        step: 3,
        command: 'agent-onboard target doctor --text',
        purpose: 'inspect target repository readiness without mutation',
        writes_files: false
      },
      {
        step: 4,
        command: 'agent-onboard target inventory --text',
        purpose: 'inventory package, source, command, and provenance surfaces without mutation',
        writes_files: false
      },
      {
        step: 5,
        command: 'agent-onboard target onboarding --plan',
        purpose: 'preview canonical target onboarding files and conflicts',
        writes_files: false
      },
      {
        step: 6,
        command: 'agent-onboard target bootstrap --dry-run',
        purpose: 'preview the explicit bootstrap write set before owner-approved writes',
        writes_files: false
      },
      {
        step: 7,
        command: 'agent-onboard create --dry-run',
        purpose: 'preview the npm create entrypoint write set without mutating the consuming repository',
        writes_files: false
      },
      {
        step: 8,
        command: 'agent-onboard issue --classify-dry-run --text',
        purpose: 'classify an external issue signal into a dry-run disposition without GitHub/API mutation',
        writes_files: false
      },
      {
        step: 9,
        command: 'agent-onboard contributor --admission-dry-run --text',
        purpose: 'preview contributor identity, provenance, and AI-assistance attribution before any authoritative admission',
        writes_files: false
      },
      {
        step: 10,
        command: 'agent-onboard mcp --plan --text',
        purpose: 'preview MCP tool bridge candidates without starting a server or adding dependencies',
        writes_files: false
      },
      {
        step: 11,
        command: 'agent-onboard work-items --next --text',
        purpose: 'read the next admitted work item when a ledger exists',
        writes_files: false
      }
    ],
    minimum_target_files: [
      'package.json',
      '.agent-onboard/target.json',
      'AGENTS.md'
    ],
    write_after_preview: {
      requires_owner_authorization: true,
      command: 'agent-onboard target bootstrap --write [--force]',
      use_force_only_for_known_canonical_replacement: true
    },
    escalation_points: [
      'Stop before --write unless the owner has authorized target state changes.',
      'Do not install dependencies, publish, push, or run managed project commands from quickstart.',
      'Use guide and commands outputs as the first-read surface for unfamiliar repositories.'
    ],
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      publishes_package: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false
    }
  };
}

function quickstartText(quickstart = quickstartCatalog()) {
  const lines = [
    `agent-onboard quickstart ${quickstart.version}`,
    '',
    'Read-only first-run recipe:',
  ];
  for (const item of quickstart.primary_recipe) {
    lines.push(`${item.step}. ${item.command}`);
    lines.push(`   ${item.purpose}`);
  }
  lines.push('', 'Minimum target files:', ...quickstart.minimum_target_files.map((entry) => `- ${entry}`));
  lines.push('', 'Write after preview:');
  lines.push(`- ${quickstart.write_after_preview.command}`);
  lines.push('- requires owner authorization');
  lines.push('', 'Escalation points:');
  for (const point of quickstart.escalation_points) lines.push(`- ${point}`);
  lines.push('', 'Use `agent-onboard quickstart --json` for machine-readable first-run guidance.');
  return `${lines.join('\n')}\n`;
}

const quickstartService = Object.freeze({
  catalog: quickstartCatalog,
  text: quickstartText
});


function discoveryFirstReadOrder() {
  return [
    'AGENTS.md',
    'SOURCE_OF_TRUTH.md',
    '.agent-onboard/authority-path.json',
    '.agent-onboard/authority-index.json',
    'llms.txt',
    'package.json',
    'authority-map.json',
    'manifest.json',
    '.agent-onboard/target.json',
    '.agent-onboard/runtime-namespace.json',
    '.agent-onboard/project.json',
    '.agent-onboard/work-items.json',
    'README.md'
  ];
}

function discoveryStableCommands() {
  return [
    'agent-onboard discovery --llms',
    'agent-onboard discovery --text',
    'agent-onboard discovery --json',
    'agent-onboard create --dry-run',
    'agent-onboard issue --classify-dry-run --text',
    'agent-onboard contributor --admission-dry-run --text',
    'agent-onboard contracts --text',
    'agent-onboard contracts --check --json',
    'agent-onboard contracts --validate-output --contract <id> --file <path> --json',
    'agent-onboard check --plan --text',
    'agent-onboard check --fast --text',
    'agent-onboard ci --github-action',
    'agent-onboard mcp --plan --text',
    'agent-onboard guide --text',
    'agent-onboard quickstart --text',
    'agent-onboard commands --text',
    'agent-onboard target doctor --text',
    'agent-onboard target governance --text',
    'agent-onboard target governance --budget-contract --text',
    'agent-onboard target governance --budget-check --text',
    'agent-onboard target governance --materialize-dry-run --text',
    'agent-onboard target onboarding --plan',
    'agent-onboard work-items --next --text',
    'agent-onboard release --source-manifest',
    'agent-onboard release --clean-inventory',
    'agent-onboard release --clean-check',
    'agent-onboard release --clean-catalog',
    'agent-onboard release --clean-catalog-check',
    'agent-onboard release --keyword-taxonomy',
    'agent-onboard release --keyword-taxonomy-check',
    'agent-onboard release --readme-plan',
    'agent-onboard release --readme-plan-check',
    'agent-onboard release --readme-dry-run',
    'agent-onboard release --readme-dry-run-check',
    'agent-onboard release --readme-apply',
    'agent-onboard release --readme-apply-check',
    'agent-onboard release --closed-gates-plan',
    'agent-onboard release --closed-gates-plan-check',
    'agent-onboard release --closed-gates-dry-run',
    'agent-onboard release --closed-gates-dry-run-check',
    'agent-onboard release --closed-gates-apply',
    'agent-onboard release --closed-gates-apply-check',
    'agent-onboard release --closed-gates-read',
    'agent-onboard release --closed-gates-read-check',
    'agent-onboard release --closed-gates-prune-plan',
    'agent-onboard release --closed-gates-prune-plan-check',
    'agent-onboard release --closed-gates-prune-dry-run',
    'agent-onboard release --closed-gates-prune-dry-run-check',
    'agent-onboard release --full-test-runner',
    'agent-onboard release --full-test-runner-check',
    'agent-onboard authority --index',
    'agent-onboard authority --index-check',
    'agent-onboard authority --state',
    'agent-onboard authority --state-check',
    'agent-onboard release --check'
  ];
}

function embeddedDiscoveryLlmsText() {
  const lines = [
    '# agent-onboard',
    '',
    'agent-onboard is the public npm package for AI-assisted repository onboarding, target-repo orientation, work-item coordination, and release-safe handoff.',
    '',
    'Canonical AI-readable files:',
    '- AGENTS.md',
    '- SOURCE_OF_TRUTH.md',
    '- .agent-onboard/authority-path.json',
    '- .agent-onboard/authority-index.json',
    '- llms.txt',
    '- package.json',
    '- authority-map.json',
    '- manifest.json',
    '- .agent-onboard/work-items.json',
    '- README.md',
    '',
    'Stable commands:',
    ...discoveryStableCommands().map((command) => `- ${command}`),
    '',
    'Default safety:',
    '- Start read-only.',
    '- Do not write files, install dependencies, publish, push, mutate Git, run managed project commands, or use network calls unless the repository owner explicitly authorizes that action.',
    '- Use explicit --write commands only after previewing the plan and receiving owner authorization.',
    '',
    'First-read order:',
    ...discoveryFirstReadOrder().map((entry, index) => `${index + 1}. ${entry}`),
    `${discoveryFirstReadOrder().length + 1}. raw evidence/source files`,
    '',
    'Source of truth order for agents: follow the First-read order above before raw evidence/source files.',
    '',
    'Use `agent-onboard discovery --llms` to print this AI-readable entrypoint from either the source repository or an installed package.'
  ];
  return `${lines.join('\n')}\n`;
}

function discoveryLlmsText(root = packageRoot()) {
  const sourceLlmsPath = path.join(root, 'llms.txt');
  if (fs.existsSync(sourceLlmsPath)) {
    const text = fs.readFileSync(sourceLlmsPath, 'utf8');
    return text.endsWith('\n') ? text : `${text}\n`;
  }
  return embeddedDiscoveryLlmsText();
}

function discoveryCatalog() {
  return {
    schema: 'agent-onboard-public-ai-discovery-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard discovery --json',
    purpose: 'machine-readable public AI discovery surface for first-read orientation',
    llms_command: 'agent-onboard discovery --llms',
    llms_txt_path: 'llms.txt',
    first_read_order: discoveryFirstReadOrder(),
    ai_readable_files: [
      'AGENTS.md',
      'SOURCE_OF_TRUTH.md',
      '.agent-onboard/authority-path.json',
      'llms.txt',
      'package.json',
      'authority-map.json',
      'manifest.json',
      '.agent-onboard/work-items.json',
      'README.md'
    ],
    stable_commands: discoveryStableCommands(),
    output_modes: ['--llms', '--json', '--text'],
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      validates_arbitrary_target_config_file: false,
      scans_target_repository: false,
      publishes_package: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false
    }
  };
}

function discoveryText(catalog = discoveryCatalog()) {
  const lines = [
    `agent-onboard AI discovery ${catalog.version}`,
    '',
    'AI-readable entrypoint:',
    `- ${catalog.llms_command}`,
    '',
    'First read order:',
    ...catalog.first_read_order.map((entry) => `- ${entry}`),
    '',
    'Stable commands:',
    ...catalog.stable_commands.map((command) => `- ${command}`),
    '',
    'Use `agent-onboard discovery --json` for the machine-readable discovery catalog.',
    'Use `agent-onboard discovery --llms` for the AI-readable text entrypoint.'
  ];
  return `${lines.join('\n')}\n`;
}

const discoveryService = Object.freeze({
  catalog: discoveryCatalog,
  text: discoveryText,
  llms: discoveryLlmsText
});


function createDryRunCatalog() {
  return {
    schema: 'agent-onboard-public-create-dry-run-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard create --dry-run',
    npm_create_command: 'npm create agent-onboard@latest -- --dry-run',
    bin_entrypoint: 'create-agent-onboard --dry-run',
    purpose: 'read-only npm create entrypoint preview for bootstrapping agent-onboard into a target repository',
    mode: 'dry-run',
    package_coordinate: `${PACKAGE_NAME}@${VERSION}`,
    preview: {
      target_root: '.',
      summary: 'Preview the canonical target onboarding files that a later owner-approved create/write gate may materialize.',
      planned_files: [
        {
          path: 'package.json',
          action: 'inspect_or_preserve',
          required_for_npm_project: true,
          writes_in_this_command: false
        },
        {
          path: 'AGENTS.md',
          action: 'would_create_or_preserve_agent_instructions',
          writes_in_this_command: false
        },
        {
          path: 'llms.txt',
          action: 'would_create_or_preserve_ai_readable_entrypoint',
          writes_in_this_command: false
        },
        {
          path: '.agent-onboard/target.json',
          action: 'would_create_target_config',
          writes_in_this_command: false
        },
        {
          path: '.agent-onboard/project.json',
          action: 'would_create_project_descriptor',
          writes_in_this_command: false
        },
        {
          path: '.agent-onboard/work-items.json',
          action: 'would_create_work_item_ledger',
          writes_in_this_command: false
        },
        {
          path: '.agent-onboard/authority-path.json',
          action: 'would_create_first_read_authority_index',
          writes_in_this_command: false
        }
      ],
      recommended_next_commands: [
        'agent-onboard guide --text',
        'agent-onboard target doctor --text',
        'agent-onboard target onboarding --plan',
        'agent-onboard target bootstrap --dry-run',
        'agent-onboard target bootstrap --write --force'
      ],
      write_mode_status: 'not_admitted_in_this_gate'
    },
    output_modes: ['--dry-run', '--json', '--text'],
    boundary: {
      writes_files: false,
      writes_consuming_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_consumer_repository: false,
      validates_arbitrary_target_config_file: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      publishes_package: false,
      network: false
    }
  };
}

function createDryRunText(catalog = createDryRunCatalog()) {
  const lines = [
    `agent-onboard create dry-run ${catalog.version}`,
    '',
    'Read-only npm create preview:',
    `- ${catalog.command}`,
    `- ${catalog.bin_entrypoint}`,
    `- ${catalog.npm_create_command}`,
    '',
    catalog.preview.summary,
    '',
    'Planned files for a later owner-approved write gate:'
  ];
  for (const file of catalog.preview.planned_files) {
    lines.push(`- ${file.path}: ${file.action}`);
  }
  lines.push('', 'Recommended next commands:');
  for (const command of catalog.preview.recommended_next_commands) lines.push(`- ${command}`);
  lines.push('', 'Boundary: no files written, no dependency install, no Git mutation, no publish, no network.');
  lines.push('Use `agent-onboard create --json` for the machine-readable preview.');
  return `${lines.join('\n')}\n`;
}
const createDryRunService = Object.freeze({
  catalog: createDryRunCatalog,
  text: createDryRunText
});



const ISSUE_INTAKE_DEFAULT = Object.freeze({
  source: Object.freeze({
    kind: 'github_issue',
    platform: 'github',
    repository: null,
    issue_number: null
  }),
  actor: Object.freeze({
    kind: 'human_contributor',
    handle: null,
    runtime: null,
    declared_authority: null
  }),
  issue: Object.freeze({
    title: 'External issue intake dry-run sample',
    labels: Object.freeze(['admission:needs-triage'])
  })
});

function issueIntakeValue(args = []) {
  const input = {
    source: Object.assign({}, ISSUE_INTAKE_DEFAULT.source),
    actor: Object.assign({}, ISSUE_INTAKE_DEFAULT.actor),
    issue: {
      title: ISSUE_INTAKE_DEFAULT.issue.title,
      labels: Array.from(ISSUE_INTAKE_DEFAULT.issue.labels)
    }
  };
  const allowed = new Set(['--classify-dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text, '--title', '--label', '--actor', '--source', '--repo', '--issue-number', '--runtime', '--handle']);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!allowed.has(arg)) {
      return { error: `issue supports only --classify-dry-run, --json, --text, --title, --label, --actor, --source, --repo, --issue-number, --runtime, or --handle in this public gate` };
    }
    if (arg === '--classify-dry-run' || arg === OUTPUT_FLAG.json || arg === OUTPUT_FLAG.text) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('-')) return { error: `issue ${arg} requires a value` };
    index += 1;
    if (arg === '--title') input.issue.title = value;
    else if (arg === '--label') input.issue.labels.push(value);
    else if (arg === '--actor') input.actor.kind = value;
    else if (arg === '--source') input.source.kind = value;
    else if (arg === '--repo') input.source.repository = value;
    else if (arg === '--issue-number') input.source.issue_number = value;
    else if (arg === '--runtime') input.actor.runtime = value;
    else if (arg === '--handle') input.actor.handle = value;
  }
  input.issue.labels = Array.from(new Set(input.issue.labels));
  return { input };
}

function issueDispositionFor(input) {
  const labels = Array.isArray(input.issue.labels) ? input.issue.labels : [];
  const actorKind = input.actor.kind || 'unknown';
  const sourceKind = input.source.kind || 'unknown';
  const permittedActorKinds = new Set(['human_contributor', 'maintainer', 'autonomous_agent', 'automation', 'unknown']);
  const permittedSignalKinds = new Set(['github_issue', 'gitlab_issue', 'external_signal', 'support_request', 'unknown']);
  if (!permittedSignalKinds.has(sourceKind) || !permittedActorKinds.has(actorKind)) return 'needs_triage';
  if (labels.includes('duplicate')) return 'duplicate';
  if (labels.includes('admission:rejected') || labels.includes('rejected')) return 'rejected';
  if (labels.includes('scope:consumer') || labels.includes('consumer-specific')) return 'consumer_specific';
  if (labels.includes('admission:upstream-candidate') || labels.includes('upstream-candidate')) return 'upstream_candidate';
  if (actorKind === 'autonomous_agent' || actorKind === 'automation' || labels.includes('admission:needs-triage')) return 'needs_generalization';
  return 'needs_triage';
}

function issueIntakeClassification(input) {
  const disposition = issueDispositionFor(input);
  const candidateEligible = disposition === 'needs_generalization' || disposition === 'upstream_candidate';
  const issueNumber = input.source.issue_number || 'unknown';
  return {
    schema: 'agent-onboard-public-issue-intake-classification-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard issue --classify-dry-run',
    mode: 'classify-dry-run',
    source: {
      kind: input.source.kind || null,
      platform: input.source.platform || null,
      repository: input.source.repository || null,
      issue_number: input.source.issue_number || null,
      authority: 'external_signal_only'
    },
    actor_classification: {
      kind: input.actor.kind || 'unknown',
      handle: input.actor.handle || null,
      runtime: input.actor.runtime || null,
      declared_authority: input.actor.declared_authority || null,
      authority: 'candidate_only',
      mutation_authority_granted: false
    },
    issue_classification: {
      title: input.issue.title || null,
      labels: Array.isArray(input.issue.labels) ? input.issue.labels.slice() : [],
      disposition,
      requires_generality_review: candidateEligible,
      candidate_work_item_preview_created: candidateEligible,
      canonical_work_item_created: false,
      admitted_claim_created: false,
      github_issue_mutated: false,
      github_api_used: false
    },
    work_item_candidate_preview: {
      candidate_id: `candidate:${input.source.kind || 'external_signal'}:${issueNumber}:work-item`,
      candidate_created_in_memory: candidateEligible,
      canonical_work_item_created: false,
      canonical_work_item_id: null,
      title: input.issue.title || 'External issue intake candidate',
      kind: 'upstream_generalization_candidate',
      source_disposition: disposition,
      requires_explicit_future_admission: true,
      mutation_authority_granted: false,
      admitted_claim_created: false
    },
    recommended_next_commands: [
      'agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>',
      'agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>',
      'agent-onboard contributor --admission-dry-run'
    ],
    boundary: {
      writes_files: false,
      writes_consuming_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_consumer_repository: false,
      imports_github_issue: false,
      github_api_dependency_now: false,
      github_issue_mutation_allowed_now: false,
      github_issue_is_canonical_work_item_now: false,
      canonical_work_item_creation_allowed_now: false,
      claim_admission_allowed_now: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false,
      git_mutation: false
    }
  };
}

function issueIntakeText(result) {
  return [
    'agent-onboard issue intake dry-run',
    `Source: ${result.source.kind}${result.source.repository ? ` ${result.source.repository}` : ''}${result.source.issue_number ? `#${result.source.issue_number}` : ''}`,
    `Actor: ${result.actor_classification.kind}${result.actor_classification.handle ? ` (${result.actor_classification.handle})` : ''}`,
    `Disposition: ${result.issue_classification.disposition}`,
    `Candidate preview: ${result.work_item_candidate_preview.candidate_created_in_memory ? result.work_item_candidate_preview.candidate_id : 'not created for this disposition'}`,
    'Authority: external signal only; no canonical work item or admitted claim created.',
    'Boundary: no files written, no GitHub API, no Git mutation, no network, no publish.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`)
  ].join('\n') + '\n';
}

const issueIntakeService = Object.freeze({
  input: issueIntakeValue,
  classify: issueIntakeClassification,
  text: issueIntakeText
});


const CONTRIBUTOR_ADMISSION_DEFAULT = Object.freeze({
  actor: Object.freeze({
    kind: 'human',
    handle: null,
    email: null,
    identity_surface: 'manual',
    agreement_surface: 'project-policy',
    repository_identifier: null,
    fingerprint: null
  }),
  ai_assistance: Object.freeze({
    used: false,
    assisted_by: null
  })
});

function parseBooleanLike(value) {
  if (['yes', 'true', '1', 'used'].includes(String(value).toLowerCase())) return true;
  if (['no', 'false', '0', 'none'].includes(String(value).toLowerCase())) return false;
  return null;
}

function contributorAdmissionValue(args = []) {
  const input = {
    actor: Object.assign({}, CONTRIBUTOR_ADMISSION_DEFAULT.actor),
    ai_assistance: Object.assign({}, CONTRIBUTOR_ADMISSION_DEFAULT.ai_assistance)
  };
  const allowed = new Set([
    '--admission-dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text,
    '--actor', '--handle', '--email', '--repo', '--repository', '--fingerprint',
    '--identity-surface', '--agreement', '--ai-assisted', '--assisted-by'
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!allowed.has(arg)) {
      return { error: 'contributor supports only --admission-dry-run, --json, --text, --actor, --handle, --email, --repo, --repository, --fingerprint, --identity-surface, --agreement, --ai-assisted, or --assisted-by in this public gate' };
    }
    if (arg === '--admission-dry-run' || arg === OUTPUT_FLAG.json || arg === OUTPUT_FLAG.text) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('-')) return { error: `contributor ${arg} requires a value` };
    index += 1;
    if (arg === '--actor') input.actor.kind = value;
    else if (arg === '--handle') input.actor.handle = value;
    else if (arg === '--email') input.actor.email = value;
    else if (arg === '--repo' || arg === '--repository') input.actor.repository_identifier = value;
    else if (arg === '--fingerprint') input.actor.fingerprint = value;
    else if (arg === '--identity-surface') input.actor.identity_surface = value;
    else if (arg === '--agreement') input.actor.agreement_surface = value;
    else if (arg === '--ai-assisted') {
      const parsed = parseBooleanLike(value);
      if (parsed === null) return { error: 'contributor --ai-assisted requires yes or no' };
      input.ai_assistance.used = parsed;
    } else if (arg === '--assisted-by') {
      input.ai_assistance.assisted_by = value;
      input.ai_assistance.used = true;
    }
  }
  return { input };
}

function contributorActorId(input) {
  const kind = input.actor.kind || 'unknown';
  if (input.actor.email) return `actor:${kind}:${input.actor.email}`;
  if (input.actor.handle) return `actor:${kind}:${input.actor.handle}`;
  return `actor:${kind}:unidentified`;
}

function contributorAdmissionPreview(input) {
  const actorKinds = new Set(['human', 'agent', 'automation', 'maintainer', 'unknown']);
  const identitySurfaces = new Set(['git-author', 'github-user', 'ssh-fingerprint', 'signing-fingerprint', 'manual', 'unknown']);
  const agreementSurfaces = new Set(['project-policy', 'external-policy', 'none', 'unknown']);
  const kind = actorKinds.has(input.actor.kind) ? input.actor.kind : 'unknown';
  const identitySurface = identitySurfaces.has(input.actor.identity_surface) ? input.actor.identity_surface : 'unknown';
  const agreementSurface = agreementSurfaces.has(input.actor.agreement_surface) ? input.actor.agreement_surface : 'unknown';
  const aiUsed = Boolean(input.ai_assistance.used);
  const assistedBy = input.ai_assistance.assisted_by || (aiUsed ? null : null);
  const missing = [];
  if (!input.actor.handle && !input.actor.email) missing.push('actor_handle_or_email');
  if (!input.actor.repository_identifier) missing.push('repository_identifier');
  if (aiUsed && !assistedBy) missing.push('assisted_by_trailer');
  const disposition = missing.length === 0 ? 'candidate_admission_preview_only' : 'needs_admission_evidence';
  return {
    schema: 'agent-onboard-public-contributor-admission-dry-run-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard contributor --admission-dry-run',
    mode: 'admission-dry-run',
    actor_record_preview: {
      actor_id: contributorActorId({ actor: Object.assign({}, input.actor, { kind }) }),
      actor_type: kind,
      handle: input.actor.handle || null,
      email: input.actor.email || null,
      identity_surface: identitySurface,
      agreement_surface: agreementSurface,
      repository_identifier: input.actor.repository_identifier || null,
      fingerprint: input.actor.fingerprint || null,
      authority: kind === 'maintainer' ? 'candidate_upstream_only' : 'candidate_only',
      local_actor_record_is_authority_now: false,
      mutation_authority_granted: false
    },
    ai_assistance_policy: {
      ai_assistance_may_be_disclosed: true,
      ai_assistance_used: aiUsed,
      permitted_ai_attribution_trailer: 'Assisted-by',
      assisted_by: assistedBy,
      assisted_by_required_when_ai_used: true,
      assisted_by_present: !aiUsed || Boolean(assistedBy),
      human_responsibility_required: true,
      ai_signed_off_by_allowed_now: false,
      ai_coauthor_claim_allowed_now: false,
      raw_ai_output_is_authority_now: false
    },
    admission_preview: {
      disposition,
      missing_evidence: missing,
      candidate_created_in_memory: true,
      canonical_contributor_record_created: false,
      contributor_ledger_written: false,
      work_item_created: false,
      admitted_claim_created: false,
      github_api_used: false,
      git_mutation: false,
      requires_explicit_future_admission: true
    },
    contribution_trailer_guidance: {
      signed_off_by_ai_allowed_now: false,
      assisted_by_required_when_ai_used: true,
      examples: aiUsed ? [assistedBy || 'Assisted-by: <tool-or-agent-name>'] : []
    },
    recommended_next_commands: [
      'agent-onboard issue --classify-dry-run --text',
      'agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>',
      'agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>'
    ],
    boundary: {
      writes_files: false,
      writes_consuming_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_consumer_repository: false,
      validates_arbitrary_consumer_config_file: false,
      contributor_ledger_write_allowed_now: false,
      canonical_contributor_record_creation_allowed_now: false,
      claim_admission_allowed_now: false,
      github_api_dependency_now: false,
      github_mutation_allowed_now: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false
    }
  };
}

function contributorAdmissionText(result) {
  return [
    'agent-onboard contributor admission dry-run',
    `Actor: ${result.actor_record_preview.actor_type}${result.actor_record_preview.handle ? ` (${result.actor_record_preview.handle})` : ''}`,
    `Identity surface: ${result.actor_record_preview.identity_surface}`,
    `Agreement surface: ${result.actor_record_preview.agreement_surface}`,
    `Disposition: ${result.admission_preview.disposition}`,
    `AI assistance used: ${result.ai_assistance_policy.ai_assistance_used}`,
    `Assisted-by present: ${result.ai_assistance_policy.assisted_by_present}`,
    'Authority: candidate only; no canonical contributor record, admitted claim, or ledger write created.',
    'Boundary: no files written, no GitHub API, no Git mutation, no network, no publish.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`)
  ].join('\n') + '\n';
}

const contributorAdmissionService = Object.freeze({
  input: contributorAdmissionValue,
  preview: contributorAdmissionPreview,
  text: contributorAdmissionText
});



function githubActionWorkflowYaml() {
  return [
    'name: Agent Onboard',
    '',
    'on:',
    '  pull_request:',
    '  push:',
    '    branches: [ main ]',
    '',
    'jobs:',
    '  agent-onboard:',
    '    runs-on: ubuntu-latest',
    '    permissions:',
    '      contents: read',
    '    steps:',
    '      - name: Checkout',
    '        uses: actions/checkout@v4',
    '      - name: Setup Node',
    '        uses: actions/setup-node@v4',
    '        with:',
    "          node-version: '20'",
    '      - name: Agent Onboard fast check',
    `        run: npx agent-onboard@${VERSION} check --fast --json`,
    '      - name: Agent Onboard release check',
    `        run: npx agent-onboard@${VERSION} release --check`
  ].join('\n') + '\n';
}

function ciSurfaceCatalog() {
  const workflow = githubActionWorkflowYaml();
  return {
    schema: 'agent-onboard-public-ci-surface-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard ci --json',
    purpose: 'copyable GitHub Actions and generic CI recipe surface for running agent-onboard public checks',
    workflow_path: '.github/workflows/agent-onboard.yml',
    github_action_command: 'agent-onboard ci --github-action',
    text_command: 'agent-onboard ci --text',
    json_command: 'agent-onboard ci --json',
    recommended_ci_commands: [
      `npx agent-onboard@${VERSION} check --fast --json`,
      `npx agent-onboard@${VERSION} release --check`
    ],
    local_source_rehearsal_commands: [
      'node cli/agent-onboard.js check --fast --json',
      'node cli/agent-onboard.js release --check'
    ],
    github_actions: {
      workflow_path: '.github/workflows/agent-onboard.yml',
      yaml: workflow,
      permissions: { contents: 'read' },
      checkout_action: 'actions/checkout@v4',
      setup_node_action: 'actions/setup-node@v4',
      node_version: '20',
      creates_or_updates_workflow: false,
      mutates_pull_request: false,
      admits_claims: false,
      creates_work_items: false,
      writes_ledgers: false
    },
    ci_role: {
      ci_is_authority: false,
      ci_can_report_evidence: true,
      ci_can_admit_claim: false,
      ci_can_create_canonical_work_item: false,
      ci_can_write_ledger: false,
      pull_request_is_external_signal: true,
      ci_report_is_evidence_not_admission: true
    },
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      creates_github_workflow_file: false,
      mutates_github_actions_state: false,
      github_api_dependency_now: false,
      installs_dependencies_now: false,
      runs_ci_now: false,
      runs_npm_now: false,
      runs_shell_now: false,
      git_mutation: false,
      network_now: false,
      publishes_package: false
    },
    template_execution_notes: [
      'The ci command only prints the workflow recipe; it does not create .github/workflows files.',
      'The printed GitHub Actions recipe uses npx and therefore may access the npm registry when the workflow is run by GitHub Actions.',
      'CI results are evidence carriers only; they do not create work items, admit claims, merge PRs, mutate issues, or write ledgers.'
    ]
  };
}

function ciSurfaceText(catalog = ciSurfaceCatalog()) {
  return [
    `agent-onboard CI surface ${catalog.version}`,
    `Workflow path: ${catalog.workflow_path}`,
    '',
    'Recommended CI commands:',
    ...catalog.recommended_ci_commands.map((command) => `- ${command}`),
    '',
    'CI role:',
    '- CI can report evidence: true',
    '- CI is authority: false',
    '- CI can admit claims or create work items: false',
    '- CI can write ledgers or mutate PRs/issues: false',
    '',
    'Use `agent-onboard ci --github-action` to print a copyable GitHub Actions workflow.',
    'Boundary: this command writes no files, calls no GitHub API, runs no npm, runs no shell, uses no network, mutates no Git state, and publishes nothing.'
  ].join('\n') + '\n';
}

const ciSurfaceService = Object.freeze({
  catalog: ciSurfaceCatalog,
  text: ciSurfaceText,
  githubAction: githubActionWorkflowYaml
});



module.exports = Object.freeze({
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  contributorAdmissionService,
  ciSurfaceService
});
