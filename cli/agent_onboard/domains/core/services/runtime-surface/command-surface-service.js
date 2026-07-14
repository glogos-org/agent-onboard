'use strict';

const { PACKAGE_NAME, PRODUCT_HELP_LINES, RELEASE_LINE, ROUTER_COMMAND_ORDER, RUNTIME_COMMAND_GROUP, TOP_LEVEL_COMMAND_ALIAS, VERSION } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ commandSurfaceService });
