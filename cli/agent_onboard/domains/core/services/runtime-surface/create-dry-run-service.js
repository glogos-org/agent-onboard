'use strict';

const { PACKAGE_NAME, RELEASE_LINE, VERSION } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ createDryRunService });
