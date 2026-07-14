'use strict';

const { PACKAGE_NAME, RELEASE_LINE, VERSION, discoveryFirstReadOrder } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ operatorGuideService });
