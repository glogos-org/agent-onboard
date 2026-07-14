'use strict';

const fs = require('fs');
const path = require('path');
const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, discoveryFirstReadOrder, discoveryStableCommands } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ discoveryService, discoveryFirstReadOrder, discoveryStableCommands });
