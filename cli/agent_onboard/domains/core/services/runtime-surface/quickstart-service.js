'use strict';

const { PACKAGE_NAME, RELEASE_LINE, VERSION } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ quickstartService });
