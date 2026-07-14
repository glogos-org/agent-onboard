'use strict';

const { PACKAGE_NAME, RELEASE_LINE, VERSION } = require('./public-runtime-surface-common');

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

module.exports = Object.freeze({ ciSurfaceService });
