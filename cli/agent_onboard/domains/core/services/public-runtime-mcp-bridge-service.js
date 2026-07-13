'use strict';

function createPublicRuntimeMcpBridgeService(deps = {}) {
  const {
    PACKAGE_NAME = 'agent-onboard',
    VERSION,
    RELEASE_LINE,
    OUTPUT_FLAG = Object.freeze({ json: '--json', text: '--text' }),
    json = () => { throw new Error('createPublicRuntimeMcpBridgeService requires json'); },
    writeText = () => { throw new Error('createPublicRuntimeMcpBridgeService requires writeText'); }
  } = deps;

  if (!VERSION) throw new Error('createPublicRuntimeMcpBridgeService requires VERSION');
  if (!RELEASE_LINE) throw new Error('createPublicRuntimeMcpBridgeService requires RELEASE_LINE');

  const MCP_TOOL_CANDIDATES = Object.freeze([
    Object.freeze({ name: 'agent_onboard_get_commands', command: 'agent-onboard commands --json', output_schema: 'agent-onboard-public-command-surface-catalog-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_guide', command: 'agent-onboard guide --json', output_schema: 'agent-onboard-public-operator-guide-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_quickstart', command: 'agent-onboard quickstart --json', output_schema: 'agent-onboard-public-quickstart-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_discovery', command: 'agent-onboard discovery --json', output_schema: 'agent-onboard-public-ai-discovery-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_create', command: 'agent-onboard create --dry-run', output_schema: 'agent-onboard-public-create-dry-run-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_classify_issue', command: 'agent-onboard issue --classify-dry-run --json', output_schema: 'agent-onboard-public-issue-intake-classification-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_contributor', command: 'agent-onboard contributor --admission-dry-run --json', output_schema: 'agent-onboard-public-contributor-admission-dry-run-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_check_public_contracts', command: 'agent-onboard contracts --check --json', output_schema: 'agent-onboard-public-contract-check-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_validate_public_contract_output_file', command: 'agent-onboard contracts --validate-output --contract <id> --file <path> --json', output_schema: 'agent-onboard-public-contract-output-file-validation-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_target_inventory', command: 'agent-onboard target inventory --json', output_schema: 'agent-onboard-public-target-runtime-inventory-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_target_memory', command: 'agent-onboard target memory --json', output_schema: 'agent-onboard-public-target-memory-descriptor-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_target_work_items', command: 'agent-onboard target work-items --json', output_schema: 'agent-onboard-public-target-work-items-preview-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_target_governance', command: 'agent-onboard target governance --json', output_schema: 'agent-onboard-public-target-governance-preview-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_target_governance_budget_contract', command: 'agent-onboard target governance --budget-contract --json', output_schema: 'agent-onboard-public-target-governance-budget-contract-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_check_target_governance_budget', command: 'agent-onboard target governance --budget-check --json', output_schema: 'agent-onboard-public-target-governance-budget-check-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_dry_run_target_governance_indexes', command: 'agent-onboard target governance --materialize-dry-run --json', output_schema: 'agent-onboard-public-target-governance-index-materialization-dry-run-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_check_target_governance_index_drift', command: 'agent-onboard target governance --check --json', output_schema: 'agent-onboard-public-target-governance-index-drift-check-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_preview_target_handoff', command: 'agent-onboard target handoff --json', output_schema: 'agent-onboard-public-target-handoff-preview-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_check_target_handoff_readiness', command: 'agent-onboard target handoff --readiness-check --json', output_schema: 'agent-onboard-public-target-handoff-readiness-check-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_run_fast_check', command: 'agent-onboard check --fast --json', output_schema: 'agent-onboard-public-check-fast-result-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_ci_recipe', command: 'agent-onboard ci --json', output_schema: 'agent-onboard-public-ci-surface-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_get_source_manifest', command: 'agent-onboard release --source-manifest', output_schema: 'agent-onboard-public-package-source-manifest-001', mutates: false }),
    Object.freeze({ name: 'agent_onboard_run_release_check', command: 'agent-onboard release --check', output_schema: 'agent-onboard-public-release-check-001', mutates: false })
  ]);

  function catalog() {
    return {
      schema: 'agent-onboard-public-mcp-bridge-plan-001',
      status: 'ok',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: 'agent-onboard mcp --json',
      purpose: 'read-only MCP bridge plan and tool-candidate skeleton for agent clients',
      plan_command: 'agent-onboard mcp --plan',
      text_command: 'agent-onboard mcp --text',
      json_command: 'agent-onboard mcp --json',
      bridge_status: {
        server_implemented_now: false,
        server_started_now: false,
        stdio_transport_started_now: false,
        socket_listener_started_now: false,
        mcp_dependency_added_now: false,
        tool_invocation_runtime_added_now: false,
        plan_only_in_this_gate: true
      },
      tool_candidate_count: MCP_TOOL_CANDIDATES.length,
      tool_candidates: MCP_TOOL_CANDIDATES.map((tool, index) => Object.freeze(Object.assign({ ordinal: index + 1 }, tool, {
        writes_files: false,
        network: false,
        git_mutation: false,
        publishes_package: false
      }))),
      client_guidance: {
        intended_clients: ['Codex-style CLI agents', 'IDE coding agents', 'terminal agent runners', 'future MCP hosts'],
        integration_model: 'map each MCP tool candidate to an existing read-only CLI command until a server is admitted by a later work item',
        first_tool_to_call: 'agent_onboard_get_discovery',
        authority_rule: 'MCP client output is evidence and orientation; it cannot admit claims, create canonical work items, write ledgers, mutate Git, or publish packages.'
      },
      later_admission_candidates: [
        'stdio MCP server entrypoint',
        'tool invocation envelope schema',
        'capability allowlist and output budget',
        'installed package smoke for server startup',
        'client example config generator'
      ],
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        creates_agent_onboard_runtime_state: false,
        starts_server: false,
        opens_socket: false,
        starts_stdio_transport: false,
        adds_runtime_dependency: false,
        invokes_mcp_tools_now: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_shell: false,
        runs_managed_project_commands: false,
        git_mutation: false,
        network: false,
        publishes_package: false
      }
    };
  }

  function text(plan = catalog()) {
    const lines = [
      `agent-onboard MCP bridge plan ${plan.version}`,
      '',
      'Status:',
      '- plan only: true',
      '- server implemented now: false',
      '- server started now: false',
      '- runtime dependency added now: false',
      '',
      'Tool candidates:'
    ];
    for (const tool of plan.tool_candidates) lines.push(`- ${tool.name}: ${tool.command}`);
    lines.push('', 'Later admission candidates:');
    for (const item of plan.later_admission_candidates) lines.push(`- ${item}`);
    lines.push('', 'Boundary: no server, no socket, no stdio transport, no dependency install, no files, no Git, no network, no publish.');
    lines.push('Use `agent-onboard mcp --json` for the machine-readable bridge contract.');
    return lines.join('\n') + '\n';
  }

  function run(args = []) {
    const allowed = ['--plan', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
    const selected = args.filter((arg) => allowed.includes(arg));
    const unknown = args.filter((arg) => !allowed.includes(arg));
    if (unknown.length > 0) {
      const notAdmitted = unknown.some((arg) => ['--serve', '--server', '--write', '--stdio'].includes(arg));
      json({
        schema: 'agent-onboard-public-mcp-bridge-plan-error-001',
        status: 'error',
        command_family: 'mcp',
        reason: notAdmitted ? 'not_admitted' : 'unsupported_argument',
        message: notAdmitted ? 'mcp server/write modes are not admitted in this public gate' : `mcp does not support: ${unknown.join(', ')}`,
        writes_files: false,
        starts_server: false,
        publishes_package: false
      });
      return notAdmitted ? 2 : 1;
    }
    if (selected.length > 1) {
      json({
        schema: 'agent-onboard-public-mcp-bridge-plan-error-001',
        status: 'error',
        command_family: 'mcp',
        reason: 'ambiguous_output_mode',
        message: 'mcp accepts only one output mode: --plan, --json, or --text',
        writes_files: false,
        starts_server: false,
        publishes_package: false
      });
      return 1;
    }
    const mode = selected[0] || '--plan';
    if (mode === OUTPUT_FLAG.json) json(catalog());
    else writeText(text());
    return 0;
  }

  return Object.freeze({
    catalog,
    text,
    run,
    toolCandidates: () => MCP_TOOL_CANDIDATES.slice()
  });
}

module.exports = Object.freeze({
  createPublicRuntimeMcpBridgeService
});
