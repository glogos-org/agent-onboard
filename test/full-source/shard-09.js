'use strict';

module.exports = function registerFullSourceShard(fullSourceTest, context) {
  const {
    assert,
    fs,
    os,
    path,
    spawnSync,
    ROOT,
    CLI,
    PACKAGE_JSON,
    EXPECTED_VERSION,
    EXPECTED_RELEASE_LINE,
    EXPECTED_VERSIONED_NPX,
    TARGET_CONFIG_FILE,
    EXPECTED_PACK_FILES,
    EXPECTED_PACK_FILES_SORTED,
    copyExpectedPackFiles,
    run,
    targetConfigPath,
    writeTargetConfig,
    readJsonOutput,
    readJsonFailure,
    readJsonlFile,
    readClosureArchiveByRef,
    runNpmPackDryRun,
    runNpm,
    packSourceTarball,
    runNodeScript,
    tempRepo,
    cliTargetConfigForTest,
    writeWorkItemsLedger
  } = context;

  fullSourceTest('full source block line 2601', () => {
    const result = run(['architecture', '--source-domain-closure-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-domain-extraction-stabilization-closure-review-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --source-domain-closure-check');
    assert.ok(output.validated.work_items_domain_closed);
    assert.ok(output.validated.claims_domain_closed);
    assert.ok(output.validated.m2_milestone_closed_or_installed_context_allowed);
    assert.ok(output.validated.m2_work_items_all_closed_or_installed_context_allowed);
    assert.ok(output.validated.m3_milestone_seeded_open_or_installed_context_allowed);
    assert.ok(output.validated.m3_seed_work_item_open_or_installed_context_allowed);
    assert.ok(output.validated.closure_review_file_present_or_installed_context_allowed);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.source_modules_remain_out_of_pack);
    assert.ok(output.validated.closure_review_commands_no_write);
    assert.strictEqual(output.source_closure_review_file.path, '.agent-onboard/source-domain-extraction-stabilization-closure-review.json');
    assert.strictEqual(output.source_closure_review_file.status, 'present_validated');
    assert.strictEqual(output.milestone_transition.closed_milestone.status, 'closed');
    assert.ok(['open', 'closed'].includes(output.milestone_transition.opened_milestone.status));
    assert.strictEqual(output.milestone_transition.seed_work_item.status, 'closed');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2628', () => {
    const result = run(['architecture', '--cli-runtime-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-cli-runtime-de-monolith-planning-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --cli-runtime-check');
    assert.ok(output.validated.monolith_debt_declared);
    assert.strictEqual(output.validated.cli_line_count_floor_observed, false);
    assert.ok(output.validated.architecture_service_extraction_line_count_observed);
    assert.ok(output.validated.controlled_source_module_inclusion_selected);
    assert.ok(output.validated.compact_pack_allowlist_unchanged_for_this_gate);
    assert.ok(output.validated.thin_entrypoint_budget_declared);
    assert.ok(output.validated.monolith_growth_blocked);
    assert.ok(output.validated.planning_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_router_gate_open_or_installed_context_allowed);
    assert.strictEqual(output.source_cli_runtime_plan_file.path, '.agent-onboard/cli-runtime-de-monolith-planning.json');
    assert.strictEqual(output.source_cli_runtime_plan_file.status, 'present_validated');
    assert.strictEqual(output.selected_package_strategy.id, 'controlled_source_module_inclusion');
    assert.strictEqual(output.cli_line_budget.target_entrypoint_max_lines, 300);
    assert.strictEqual(output.observed_runtime.extracted_service_line_count_ceiling, 9000);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2653', () => {
    const result = run(['architecture', '--thin-router-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-thin-cli-router-seed-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --thin-router-check');
    assert.ok(output.validated.router_seed_status_admitted);
    assert.ok(output.validated.router_module_present_or_installed_context_allowed);
    assert.ok(output.validated.router_module_requireable_when_present);
    assert.ok(output.validated.router_module_under_line_budget);
    assert.ok(output.validated.router_exports_contract);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.router_module_out_of_pack_for_this_gate);
    assert.ok(output.validated.seed_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_port_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.thin_router_commands_no_write);
    assert.strictEqual(output.router_module.path, 'cli/agent_onboard/command-router.js');
    assert.strictEqual(output.router_module.status, 'present_validated');
    assert.strictEqual(output.source_thin_router_seed_file.path, '.agent-onboard/thin-cli-router-seed.json');
    assert.strictEqual(output.source_thin_router_seed_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2682', () => {
    const result = run(['architecture', '--compatibility-port-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-compatibility-command-port-seed-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --compatibility-port-check');
    assert.ok(output.validated.compatibility_port_seed_status_admitted);
    assert.ok(output.validated.adapter_module_present_or_installed_context_allowed);
    assert.ok(output.validated.port_module_present_or_installed_context_allowed);
    assert.ok(output.validated.adapter_module_requireable_when_present);
    assert.ok(output.validated.port_module_requireable_when_present);
    assert.ok(output.validated.port_modules_under_line_budget);
    assert.ok(output.validated.adapter_exports_contract);
    assert.ok(output.validated.port_exports_contract);
    assert.ok(output.validated.command_group_contract);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.port_modules_out_of_pack_for_this_gate);
    assert.ok(output.validated.seed_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_adapter_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.compatibility_port_commands_no_write);
    assert.strictEqual(output.adapter_module.path, 'cli/agent_onboard/adapters/compatibility-command-port.js');
    assert.strictEqual(output.adapter_module.status, 'present_validated');
    assert.strictEqual(output.port_module.path, 'cli/agent_onboard/ports/compatibility-command-port.js');
    assert.strictEqual(output.port_module.status, 'present_validated');
    assert.strictEqual(output.source_compatibility_port_seed_file.path, '.agent-onboard/compatibility-command-port-seed.json');
    assert.strictEqual(output.source_compatibility_port_seed_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2717', () => {
    const result = run(['architecture', '--core-adapter-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-core-command-adapter-extraction-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --core-adapter-check');
    assert.ok(output.validated.core_adapter_extraction_status_admitted);
    assert.ok(output.validated.adapter_module_present_or_installed_context_allowed);
    assert.ok(output.validated.adapter_module_requireable_when_present);
    assert.ok(output.validated.adapter_module_under_line_budget);
    assert.ok(output.validated.adapter_exports_contract);
    assert.ok(output.validated.owned_core_commands_contract);
    assert.ok(output.validated.non_core_commands_excluded);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.core_adapter_module_out_of_pack_for_this_gate);
    assert.ok(output.validated.extraction_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_package_adapter_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.core_adapter_commands_no_write);
    assert.strictEqual(output.adapter_module.path, 'cli/agent_onboard/adapters/commands/core.js');
    assert.strictEqual(output.adapter_module.status, 'present_validated');
    assert.strictEqual(output.source_core_adapter_extraction_file.path, '.agent-onboard/core-command-adapter-extraction.json');
    assert.strictEqual(output.source_core_adapter_extraction_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2748', () => {
    const result = run(['architecture', '--package-adapter-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-package-command-adapter-extraction-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --package-adapter-check');
    assert.ok(output.validated.package_adapter_extraction_status_admitted);
    assert.ok(output.validated.adapter_module_present_or_installed_context_allowed);
    assert.ok(output.validated.adapter_module_requireable_when_present);
    assert.ok(output.validated.adapter_module_under_line_budget);
    assert.ok(output.validated.adapter_exports_contract);
    assert.ok(output.validated.owned_package_commands_contract);
    assert.ok(output.validated.non_package_commands_excluded);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.package_adapter_module_out_of_pack_for_this_gate);
    assert.ok(output.validated.extraction_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_architecture_adapter_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.package_adapter_commands_no_write);
    assert.strictEqual(output.adapter_module.path, 'cli/agent_onboard/adapters/commands/release-package.js');
    assert.strictEqual(output.adapter_module.status, 'present_validated');
    assert.strictEqual(output.source_package_adapter_extraction_file.path, '.agent-onboard/package-command-adapter-extraction.json');
    assert.strictEqual(output.source_package_adapter_extraction_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2778', () => {
    const result = run(['architecture', '--architecture-adapter-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-architecture-command-adapter-extraction-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --architecture-adapter-check');
    assert.ok(output.validated.architecture_adapter_extraction_status_admitted);
    assert.ok(output.validated.adapter_module_present_or_installed_context_allowed);
    assert.ok(output.validated.adapter_module_requireable_when_present);
    assert.ok(output.validated.adapter_module_under_line_budget);
    assert.ok(output.validated.adapter_exports_contract);
    assert.ok(output.validated.owned_architecture_commands_contract);
    assert.ok(output.validated.non_architecture_commands_excluded);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.architecture_adapter_module_out_of_pack_for_this_gate);
    assert.ok(output.validated.extraction_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_authority_adapter_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.architecture_adapter_commands_no_write);
    assert.strictEqual(output.adapter_module.path, 'cli/agent_onboard/adapters/commands/architecture.js');
    assert.strictEqual(output.adapter_module.status, 'present_validated');
    assert.strictEqual(output.source_architecture_adapter_extraction_file.path, '.agent-onboard/architecture-command-adapter-extraction.json');
    assert.strictEqual(output.source_architecture_adapter_extraction_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2808', () => {
    const result = run(['architecture', '--authority-adapter-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-authority-command-adapter-extraction-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --authority-adapter-check');
    assert.ok(output.validated.authority_adapter_extraction_status_admitted);
    assert.ok(output.validated.adapter_module_present_or_installed_context_allowed);
    assert.ok(output.validated.adapter_module_requireable_when_present);
    assert.ok(output.validated.adapter_module_under_line_budget);
    assert.ok(output.validated.adapter_exports_contract);
    assert.ok(output.validated.owned_authority_commands_contract);
    assert.ok(output.validated.non_authority_commands_excluded);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.authority_adapter_module_out_of_pack_for_this_gate);
    assert.ok(output.validated.extraction_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_work_items_adapter_gate_open_or_installed_context_allowed);
    assert.ok(output.validated.authority_adapter_commands_no_write);
    assert.strictEqual(output.adapter_module.path, 'cli/agent_onboard/adapters/commands/authority.js');
    assert.strictEqual(output.adapter_module.status, 'present_validated');
    assert.strictEqual(output.source_authority_adapter_extraction_file.path, '.agent-onboard/authority-command-adapter-extraction.json');
    assert.strictEqual(output.source_authority_adapter_extraction_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2838', () => {
    const result = run(['architecture', '--module-inclusion-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-modular-runtime-package-inclusion-plan-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --module-inclusion-check');
    assert.ok(output.validated.planning_status_admitted);
    assert.ok(output.validated.compact_pack_allowlist_preserved_for_planning_gate_or_superseded_by_admitted_inclusion);
    assert.ok(output.validated.future_package_allowlist_change_planned);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.public_cli_outputs_unchanged);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.planning_commands_no_write);
    assert.ok(output.validated.runtime_reference_shape_declared);
    assert.ok(output.validated.first_inclusion_slice_declared);
    assert.ok(output.validated.planning_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_packaged_router_inclusion_gate_open_or_installed_context_allowed);
    assert.strictEqual(output.source_modular_runtime_package_inclusion_plan_file.path, '.agent-onboard/modular-runtime-package-inclusion-plan.json');
    assert.strictEqual(output.source_modular_runtime_package_inclusion_plan_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2863', () => {
    const result = run(['architecture', '--packaged-router-port-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-packaged-router-port-inclusion-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --packaged-router-port-check');
    assert.ok(output.validated.inclusion_status_admitted);
    assert.ok(output.validated.projected_pack_files_match_inclusion_contract);
    assert.ok(output.validated.package_allowlist_expanded);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.public_cli_outputs_unchanged);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.packaged_router_port_commands_no_write);
    assert.ok(output.validated.module_files_present);
    assert.ok(output.validated.module_files_requireable);
    assert.ok(output.validated.module_exports_contract);
    assert.ok(output.validated.module_files_in_projected_pack);
    assert.ok(output.validated.inclusion_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_thin_entrypoint_cutover_gate_open_or_installed_context_allowed);
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.source_packaged_router_port_inclusion_file.path, '.agent-onboard/packaged-router-port-inclusion.json');
    assert.strictEqual(output.source_packaged_router_port_inclusion_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2892', () => {
    const result = run(['architecture', '--thin-entrypoint-rehearsal-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --thin-entrypoint-rehearsal-check');
    assert.ok(output.validated.rehearsal_status_admitted);
    assert.ok(output.validated.projected_pack_files_unchanged);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.runtime_cutover_not_applied);
    assert.ok(output.validated.public_cli_outputs_unchanged);
    assert.ok(output.validated.packaged_runtime_dependency_graph_unchanged);
    assert.ok(output.validated.packaged_router_and_port_present);
    assert.ok(output.validated.packaged_router_and_port_requireable);
    assert.ok(output.validated.module_files_in_projected_pack);
    assert.ok(output.validated.rehearsal_vectors_runnable);
    assert.ok(output.validated.rehearsal_vectors_match_expected_status);
    assert.ok(output.validated.rehearsal_commands_no_write);
    assert.ok(output.validated.rehearsal_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_cutover_gate_open_or_installed_context_allowed);
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.source_thin_entrypoint_rehearsal_file.path, '.agent-onboard/thin-entrypoint-router-cutover-rehearsal.json');
    assert.strictEqual(output.source_thin_entrypoint_rehearsal_file.status, 'present_validated');
    assert.deepStrictEqual(output.rehearsal_vector_reports.map((report) => report.actual_status), ['ok', 'ok', 'unhandled_source_only_seed']);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2923', () => {
    const result = run(['architecture', '--thin-entrypoint-cutover-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-thin-entrypoint-router-cutover-application-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --thin-entrypoint-cutover-check');
    assert.ok(output.validated.cutover_status_applied);
    assert.ok(output.validated.runtime_cutover_applied);
    assert.ok(output.validated.entrypoint_imports_packaged_router);
    assert.ok(output.validated.entrypoint_imports_packaged_compatibility_port);
    assert.ok(output.validated.entrypoint_main_delegates_to_router);
    assert.ok(output.validated.projected_pack_files_unchanged);
    assert.ok(output.validated.module_files_in_projected_pack);
    assert.ok(output.validated.main_smoke_status_ok);
    assert.ok(output.validated.main_smoke_version_ok);
    assert.ok(output.validated.cutover_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_gate_open_or_installed_context_allowed);
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.source_thin_entrypoint_cutover_file.path, '.agent-onboard/thin-entrypoint-router-cutover-application.json');
    assert.strictEqual(output.source_thin_entrypoint_cutover_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2950', () => {
    const result = run(['architecture', '--router-adapter-delegation-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-router-command-adapter-delegation-expansion-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --router-adapter-delegation-check');
    assert.ok(output.validated.delegation_status_expanded);
    assert.ok(output.validated.runtime_cutover_still_applied);
    assert.ok(output.validated.entrypoint_imports_packaged_adapters);
    assert.ok(output.validated.compatibility_port_delegates_to_adapters);
    assert.ok(output.validated.delegated_commands_match_contract);
    assert.ok(output.validated.adapter_modules_present);
    assert.ok(output.validated.adapter_modules_requireable);
    assert.ok(output.validated.adapter_modules_used_by_runtime);
    assert.ok(output.validated.adapter_modules_in_projected_pack);
    assert.ok(output.validated.runtime_smoke_vectors_pass);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.ok(output.validated.delegation_commands_no_write);
    assert.ok(output.validated.delegation_file_present_or_installed_context_allowed);
    assert.ok(output.validated.work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_gate_open_or_installed_context_allowed);
    assert.deepStrictEqual(output.compatibility_port.delegated_commands, ['--help', '--version', '-h', '-v', 'agents', 'architecture', 'authority', 'bridge', 'claim', 'guard', 'help', 'init', 'release', 'status', 'target', 'target-config', 'target-instance', 'version', 'work-items']);
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.source_router_command_adapter_delegation_file.path, '.agent-onboard/router-command-adapter-delegation-expansion.json');
    assert.strictEqual(output.source_router_command_adapter_delegation_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('package runtime service partition seed admits release package domain services', () => {
    const partitions = require(path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'service-partitions.js'));
    const packageDomain = require(path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package'));
    const seed = partitions.describeRuntimeServicePartitionSeed();
    const releasePackage = seed.seeded_domains.find((domain) => domain.id === 'release_package');
    assert.ok(releasePackage);
    assert.strictEqual(releasePackage.index, 'cli/agent_onboard/domains/package/index.js');
    assert.deepStrictEqual(releasePackage.services, [
      'cli/agent_onboard/domains/package/services/package-service.js',
      'cli/agent_onboard/domains/package/services/package-surface-service.js',
    'cli/agent_onboard/domains/package/services/public-runtime-release-service.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates-runtime-slice-service.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/clean-compaction-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/keyword-readme-plan-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/readme-history-archive-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/readme-history-apply-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-compaction-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-apply-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-reader-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-plan-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-dry-run-runtime.js',
    'cli/agent_onboard/domains/package/services/release-clean-closed-gates/closed-gate-prune-apply-runtime.js',
      'cli/agent_onboard/domains/package/services/source-manifest-service.js',
      'cli/agent_onboard/domains/package/services/package-coordinate-service.js',
      'cli/agent_onboard/domains/package/services/installed-first-read-contract.js'
    ]);
    assert.deepStrictEqual(releasePackage.fallback_commands, []);
    assert.ok(releasePackage.extracted_commands.includes('release --check'));
    assert.strictEqual(seed.boundary.no_legacy_release_package_fallback_commands, true);
    assert.strictEqual(typeof packageDomain.service.createPackageService, 'function');
    assert.strictEqual(typeof packageDomain.surface.createPackageSurfaceService, 'function');
    assert.strictEqual(typeof packageDomain.sourceManifest.describeSourceManifestServiceSeed, 'function');
    assert.strictEqual(typeof packageDomain.sourceManifest.createPackageSourceManifestService, 'function');
    const sourceManifestService = packageDomain.sourceManifest.createPackageSourceManifestService({
      packageName: 'agent-onboard',
      version: EXPECTED_VERSION,
      releaseLine: EXPECTED_RELEASE_LINE,
      expectedPackFiles: EXPECTED_PACK_FILES,
      sourceOnlyFiles: ['AGENTS.md', '.agent-onboard/work-items.json']
    });
    const sourceManifest = sourceManifestService.check(ROOT);
    assert.strictEqual(sourceManifest.status, 'ok');
    assert.strictEqual(sourceManifest.entry_count, EXPECTED_PACK_FILES.length);
    assert.strictEqual(sourceManifest.validated.raw_sha256_not_exposed, true);
    assert.strictEqual(sourceManifest.validated.hash_cache_not_projected_into_package, true);
    assert.strictEqual(sourceManifest.validated.hash_cache_budget_enforced, true);
    assert.strictEqual(sourceManifest.validated.hash_cache_is_not_existence_authority, true);
    assert.strictEqual(typeof packageDomain.sourceManifest.digestBytes(Buffer.from('agent-onboard')).file_id, 'string');
    assert.strictEqual(typeof packageDomain.sourceManifest.buildHashCache, 'function');
    assert.strictEqual(typeof packageDomain.sourceManifest.validateHashCacheBudget, 'function');
    assert.strictEqual(typeof packageDomain.coordinate.describePackageCoordinateServiceSeed, 'function');
    assert.strictEqual(typeof packageDomain.firstReadContract.describeInstalledFirstReadContractSeed, 'function');
  });


  fullSourceTest('core config guard service partition seed admits guard runtime service', () => {
    const partitions = require(path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'service-partitions.js'));
    const coreDomain = require(path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'core'));
    const seed = partitions.describeRuntimeServicePartitionSeed();
    const coreConfigGuard = seed.seeded_domains.find((domain) => domain.id === 'core_config_guard');
    assert.ok(coreConfigGuard);
    assert.strictEqual(coreConfigGuard.index, 'cli/agent_onboard/domains/core/index.js');
    assert.deepStrictEqual(coreConfigGuard.services, [
      'cli/agent_onboard/domains/core/services/config-guard-service.js'
    ]);
    assert.deepStrictEqual(coreConfigGuard.extracted_commands, ['guard --plan', 'guard --check-boundary']);
    assert.deepStrictEqual(coreConfigGuard.fallback_commands, []);
    assert.strictEqual(seed.boundary.no_legacy_core_config_guard_fallback_commands, true);
    assert.strictEqual(typeof coreDomain.configGuard.createCoreConfigGuardService, 'function');
    assert.strictEqual(typeof coreDomain.configGuard.describeConfigGuardServiceSeed, 'function');
  });


  fullSourceTest('public clean compaction baseline inventory and check are read-only', () => {
    const inventory = readJsonOutput(run(['release', '--clean-inventory']));
    assert.strictEqual(inventory.schema, 'agent-onboard-public-clean-compaction-baseline-result-001');
    assert.strictEqual(inventory.status, 'ok');
    assert.strictEqual(inventory.version, EXPECTED_VERSION);
    assert.strictEqual(inventory.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(inventory.command, 'agent-onboard release --clean-inventory');
    assert.strictEqual(inventory.boundary.writes_files, false);
    assert.ok(inventory.inventory.total_files >= EXPECTED_PACK_FILES.length);
    assert.ok(inventory.inventory.package.projected_pack_file_count >= EXPECTED_PACK_FILES.length);
    assert.ok(inventory.compaction_candidates.some((candidate) => candidate.surface === 'README.md'));

    const check = readJsonOutput(run(['release', '--clean-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-clean-compaction-baseline-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --clean-check');
    assert.strictEqual(check.validated.no_write_boundary, true);
    assert.strictEqual(check.validated.m5_closed_m6_open, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
    assert.strictEqual(check.boundary.writes_files, false);
  });


  fullSourceTest('public clean compaction catalog classifies candidates before writes', () => {
    const catalog = readJsonOutput(run(['release', '--clean-catalog']));
    assert.strictEqual(catalog.schema, 'agent-onboard-public-clean-compaction-catalog-result-001');
    assert.strictEqual(catalog.status, 'ok');
    assert.strictEqual(catalog.version, EXPECTED_VERSION);
    assert.strictEqual(catalog.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(catalog.command, 'agent-onboard release --clean-catalog');
    assert.strictEqual(catalog.classification_policy.delete_or_move_allowed_now, false);
    assert.strictEqual(catalog.classification_policy.future_write_must_name_exact_surface_id, true);
    assert.strictEqual(catalog.entries.length, 6);
    assert.ok(catalog.entries.some((entry) => entry.id === 'closed-gate-artifacts'));
    assert.ok(catalog.entries.every((entry) => entry.future_write_requires_admitted_work_item === true));
    assert.strictEqual(catalog.boundary.writes_files, false);
    assert.strictEqual(catalog.boundary.deletes_files, false);

    const check = readJsonOutput(run(['release', '--clean-catalog-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-clean-compaction-catalog-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --clean-catalog-check');
    assert.strictEqual(check.validated.baseline_check_passes, true);
    assert.strictEqual(check.validated.required_candidate_count, true);
    assert.strictEqual(check.validated.every_entry_requires_future_admission, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
    assert.strictEqual(check.boundary.writes_files, false);
  });


  fullSourceTest('public package keyword taxonomy is compacted and release-checked', () => {
    const taxonomy = readJsonOutput(run(['release', '--keyword-taxonomy']));
    assert.strictEqual(taxonomy.schema, 'agent-onboard-public-package-keyword-taxonomy-compaction-result-001');
    assert.strictEqual(taxonomy.status, 'ok');
    assert.strictEqual(taxonomy.version, EXPECTED_VERSION);
    assert.strictEqual(taxonomy.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(taxonomy.command, 'agent-onboard release --keyword-taxonomy');
    assert.strictEqual(taxonomy.current.keyword_count, PACKAGE_JSON.keywords.length);
    assert.ok(taxonomy.current.keyword_count <= 80);
    assert.ok(taxonomy.current.reduction.reduced_by > 0);
    assert.strictEqual(taxonomy.current.group_coverage.package_identity.complete, true);
    assert.strictEqual(taxonomy.current.group_coverage.clean_compaction.complete, true);
    assert.strictEqual(taxonomy.catalog_surface.surface_present, true);
    assert.strictEqual(taxonomy.boundary.command_writes_files, false);

    const check = readJsonOutput(run(['release', '--keyword-taxonomy-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-package-keyword-taxonomy-compaction-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --keyword-taxonomy-check');
    assert.strictEqual(check.validated.keyword_count_within_compact_budget, true);
    assert.strictEqual(check.validated.keyword_count_reduced_from_previous_observation, true);
    assert.strictEqual(check.validated.every_required_group_complete, true);
    assert.strictEqual(check.validated.release_era_keywords_removed, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
    assert.strictEqual(check.boundary.check_command_writes_files, false);
  });


  fullSourceTest('public README first-read history split planning is read-only and release-checked', () => {
    const plan = readJsonOutput(run(['release', '--readme-plan']));
    assert.strictEqual(plan.schema, 'agent-onboard-public-readme-first-read-history-split-plan-result-001');
    assert.strictEqual(plan.status, 'ok');
    assert.strictEqual(plan.version, EXPECTED_VERSION);
    assert.strictEqual(plan.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(plan.command, 'agent-onboard release --readme-plan');
    assert.strictEqual(plan.catalog_surface.surface_present, true);
    assert.strictEqual(plan.prerequisite_checks.keyword_taxonomy_check, 'ok');
    assert.strictEqual(plan.current.readme_present, true);
    assert.strictEqual(plan.current.future_history_archive_present, true);
    assert.strictEqual(plan.split_plan.no_write_in_this_gate, true);
    assert.strictEqual(plan.boundary.command_writes_files, false);
    assert.strictEqual(plan.boundary.creates_history_archive, false);

    const check = readJsonOutput(run(['release', '--readme-plan-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-readme-first-read-history-split-plan-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --readme-plan-check');
    assert.strictEqual(check.validated.catalog_check_passes, true);
    assert.strictEqual(check.validated.keyword_taxonomy_check_passes, true);
    assert.strictEqual(check.validated.all_first_read_markers_present, true);
    assert.strictEqual(check.validated.future_archive_not_created, true);
    assert.strictEqual(check.validated.future_index_not_created, true);
    assert.strictEqual(check.validated.readme_history_apply_gate_admitted, true);
    assert.strictEqual(check.validated.no_archive_delete_move_or_rewrite, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
    assert.strictEqual(check.boundary.check_command_writes_files, false);
  });


  fullSourceTest('public README history archive split dry-run is exact and read-only', () => {
    const dryRun = readJsonOutput(run(['release', '--readme-dry-run']));
    assert.strictEqual(dryRun.schema, 'agent-onboard-public-readme-history-archive-split-dry-run-result-001');
    assert.strictEqual(dryRun.status, 'ok');
    assert.strictEqual(dryRun.version, EXPECTED_VERSION);
    assert.strictEqual(dryRun.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(dryRun.command, 'agent-onboard release --readme-dry-run');
    assert.strictEqual(dryRun.plan_gate_check, 'ok');
    assert.ok(dryRun.archive_preview.section_count >= 5);
    assert.ok(dryRun.archive_preview.source_sections.every((section) => section.start_line > 0 && section.end_line >= section.start_line));
    assert.ok(dryRun.archive_preview.file_id.startsWith('ni:///sha-256;'));
    assert.ok(dryRun.live_readme_preview.file_id.startsWith('ni:///sha-256;'));
    assert.ok(dryRun.index_preview.file_id.startsWith('ni:///sha-256;'));
    assert.strictEqual(dryRun.current.history_archive_present, true);
    assert.strictEqual(dryRun.current.history_index_present, true);
    assert.strictEqual(dryRun.current.apply_gate_applied, true);
    assert.strictEqual(dryRun.replay_mode, 'post_apply_replay_from_archive_index');
    assert.strictEqual(dryRun.diff_preview.writes_files_now, false);
    assert.deepStrictEqual(dryRun.diff_preview.would_write_files_after_future_admission, ['README.md', 'docs/release-history.md', '.agent-onboard/readme-history.index.json']);
    assert.strictEqual(dryRun.live_readme_preview.retained_first_read_markers.every((marker) => marker.present_in_live_candidate), true);

    const check = readJsonOutput(run(['release', '--readme-dry-run-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-readme-history-archive-split-dry-run-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --readme-dry-run-check');
    assert.strictEqual(check.validated.plan_gate_check_passes, true);
    assert.strictEqual(check.validated.enough_history_sections_identified, true);
    assert.strictEqual(check.validated.future_archive_not_created, true);
    assert.strictEqual(check.validated.future_index_not_created, true);
    assert.strictEqual(check.validated.apply_gate_admitted_when_archive_present, true);
    assert.strictEqual(check.validated.live_readme_candidate_retains_first_read_markers, true);
    assert.strictEqual(check.validated.no_archive_index_readme_write, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
    assert.strictEqual(check.boundary.check_command_writes_files, false);
  });


  fullSourceTest('public README history archive split apply is applied and release-checked', () => {
    const apply = readJsonOutput(run(['release', '--readme-apply']));
    assert.strictEqual(apply.schema, 'agent-onboard-public-readme-history-archive-split-apply-result-001');
    assert.strictEqual(apply.status, 'ok');
    assert.strictEqual(apply.version, EXPECTED_VERSION);
    assert.strictEqual(apply.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(apply.command, 'agent-onboard release --readme-apply');
    assert.strictEqual(apply.current.applied, true);
    assert.strictEqual(apply.live_readme.release_history_pointer_present, true);
    assert.strictEqual(apply.live_readme.archived_history_sections_remaining, 0);
    assert.ok(apply.archive.section_count >= 5);
    assert.strictEqual(apply.index.section_count, apply.archive.section_count);
    assert.strictEqual(apply.boundary.deletes_files, false);
    assert.strictEqual(apply.boundary.moves_files, false);

    const check = readJsonOutput(run(['release', '--readme-apply-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-readme-history-archive-split-apply-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --readme-apply-check');
    assert.strictEqual(check.validated.apply_state_present, true);
    assert.strictEqual(check.validated.apply_artifact_present, true);
    assert.strictEqual(check.validated.readme_archived_sections_removed, true);
    assert.strictEqual(check.validated.archive_present, true);
    assert.strictEqual(check.validated.index_present_valid_json, true);
    assert.strictEqual(check.validated.index_live_readme_digest_matches, true);
    assert.strictEqual(check.validated.index_archive_digest_matches, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });
};
