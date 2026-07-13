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

  fullSourceTest('full source block line 261', () => {
    const result = run(['release', '--contract']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.schema, 'agent-onboard-public-release-contract-response-001');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.contract.schema, 'agent-onboard-public-release-contract-039');
    assert.strictEqual(output.contract.contract_command, 'agent-onboard release --contract');
    assert.strictEqual(output.contract.fixture_command, 'agent-onboard release --fixture');
    assert.strictEqual(output.contract.parity_smoke_command, 'agent-onboard release --parity-smoke');
    assert.strictEqual(output.contract.architecture_parity_smoke_command, 'agent-onboard release --architecture-parity-smoke');
    assert.strictEqual(output.contract.target_onboarding_smoke_command, 'agent-onboard release --target-onboarding-smoke');
    assert.strictEqual(output.contract.post_publish_handoff_command, 'agent-onboard release --post-publish-handoff');
    assert.strictEqual(output.contract.published_acceptance_command, 'agent-onboard release --published-acceptance');
    assert.strictEqual(output.contract.real_target_trial_command, 'agent-onboard release --real-target-trial');
    assert.strictEqual(output.contract.architecture_map_command, 'agent-onboard architecture --map');
    assert.strictEqual(output.contract.architecture_router_command, 'agent-onboard architecture --router');
    assert.strictEqual(output.contract.architecture_facades_command, 'agent-onboard architecture --facades');
    assert.strictEqual(output.contract.architecture_partition_plan_command, 'agent-onboard architecture --partition-plan');
    assert.strictEqual(output.contract.architecture_partition_check_command, 'agent-onboard architecture --partition-check');
    assert.strictEqual(output.contract.architecture_extraction_rehearsal_command, 'agent-onboard architecture --extraction-rehearsal');
    assert.strictEqual(output.contract.architecture_extraction_check_command, 'agent-onboard architecture --extraction-check');
    assert.strictEqual(output.contract.architecture_first_slice_command, 'agent-onboard architecture --first-slice');
    assert.strictEqual(output.contract.architecture_first_slice_check_command, 'agent-onboard architecture --first-slice-check');
    assert.strictEqual(output.contract.architecture_bundle_parity_command, 'agent-onboard architecture --bundle-parity');
    assert.strictEqual(output.contract.architecture_bundle_parity_check_command, 'agent-onboard architecture --bundle-parity-check');
    assert.strictEqual(output.contract.architecture_runtime_bridge_command, 'agent-onboard architecture --runtime-bridge');
    assert.strictEqual(output.contract.architecture_runtime_bridge_check_command, 'agent-onboard architecture --runtime-bridge-check');
    assert.strictEqual(output.contract.architecture_installed_fallback_smoke_command, 'agent-onboard architecture --installed-fallback-smoke');
    assert.strictEqual(output.contract.architecture_installed_fallback_check_command, 'agent-onboard architecture --installed-fallback-check');
    assert.strictEqual(output.contract.architecture_second_slice_plan_command, 'agent-onboard architecture --second-slice-plan');
    assert.strictEqual(output.contract.architecture_second_slice_check_command, 'agent-onboard architecture --second-slice-check');
    assert.strictEqual(output.contract.architecture_second_slice_first_slice_command, 'agent-onboard architecture --second-slice-first-slice');
    assert.strictEqual(output.contract.architecture_second_slice_first_slice_check_command, 'agent-onboard architecture --second-slice-first-slice-check');
    assert.strictEqual(output.contract.architecture_authority_bundle_parity_command, 'agent-onboard architecture --authority-bundle-parity');
    assert.strictEqual(output.contract.architecture_authority_bundle_parity_check_command, 'agent-onboard architecture --authority-bundle-parity-check');
    assert.strictEqual(output.contract.architecture_authority_runtime_bridge_command, 'agent-onboard architecture --authority-runtime-bridge');
    assert.strictEqual(output.contract.architecture_authority_runtime_bridge_check_command, 'agent-onboard architecture --authority-runtime-bridge-check');
    assert.strictEqual(output.contract.architecture_work_items_plan_command, 'agent-onboard architecture --work-items-plan');
    assert.strictEqual(output.contract.architecture_work_items_check_command, 'agent-onboard architecture --work-items-check');
    assert.strictEqual(output.contract.architecture_work_items_first_slice_command, 'agent-onboard architecture --work-items-first-slice');
    assert.strictEqual(output.contract.architecture_work_items_first_slice_check_command, 'agent-onboard architecture --work-items-first-slice-check');
    assert.strictEqual(output.contract.architecture_work_items_bundle_parity_command, 'agent-onboard architecture --work-items-bundle-parity');
    assert.strictEqual(output.contract.architecture_work_items_bundle_parity_check_command, 'agent-onboard architecture --work-items-bundle-parity-check');
    assert.strictEqual(output.contract.architecture_work_items_runtime_bridge_command, 'agent-onboard architecture --work-items-runtime-bridge');
    assert.strictEqual(output.contract.architecture_work_items_runtime_bridge_check_command, 'agent-onboard architecture --work-items-runtime-bridge-check');
    assert.strictEqual(output.contract.architecture_work_items_installed_fallback_smoke_command, 'agent-onboard architecture --work-items-installed-fallback-smoke');
    assert.strictEqual(output.contract.architecture_work_items_installed_fallback_check_command, 'agent-onboard architecture --work-items-installed-fallback-check');
    assert.strictEqual(output.contract.architecture_claims_plan_command, 'agent-onboard architecture --claims-plan');
    assert.strictEqual(output.contract.architecture_claims_check_command, 'agent-onboard architecture --claims-check');
    assert.strictEqual(output.contract.architecture_claims_first_slice_command, 'agent-onboard architecture --claims-first-slice');
    assert.strictEqual(output.contract.architecture_claims_first_slice_check_command, 'agent-onboard architecture --claims-first-slice-check');
    assert.strictEqual(output.contract.architecture_claims_bundle_parity_command, 'agent-onboard architecture --claims-bundle-parity');
    assert.strictEqual(output.contract.architecture_claims_bundle_parity_check_command, 'agent-onboard architecture --claims-bundle-parity-check');
    assert.strictEqual(output.contract.architecture_claims_runtime_bridge_command, 'agent-onboard architecture --claims-runtime-bridge');
    assert.strictEqual(output.contract.architecture_claims_runtime_bridge_check_command, 'agent-onboard architecture --claims-runtime-bridge-check');
    assert.strictEqual(output.contract.architecture_claims_installed_fallback_smoke_command, 'agent-onboard architecture --claims-installed-fallback-smoke');
    assert.strictEqual(output.contract.architecture_claims_installed_fallback_check_command, 'agent-onboard architecture --claims-installed-fallback-check');
    assert.strictEqual(output.contract.architecture_source_domain_closure_review_command, 'agent-onboard architecture --source-domain-closure-review');
    assert.strictEqual(output.contract.architecture_source_domain_closure_check_command, 'agent-onboard architecture --source-domain-closure-check');
    assert.strictEqual(output.contract.architecture_cli_runtime_plan_command, 'agent-onboard architecture --cli-runtime-plan');
    assert.strictEqual(output.contract.architecture_cli_runtime_check_command, 'agent-onboard architecture --cli-runtime-check');
    assert.strictEqual(output.contract.architecture_compatibility_port_command, 'agent-onboard architecture --compatibility-port');
    assert.strictEqual(output.contract.architecture_compatibility_port_check_command, 'agent-onboard architecture --compatibility-port-check');
    assert.strictEqual(output.contract.architecture_core_adapter_command, 'agent-onboard architecture --core-adapter');
    assert.strictEqual(output.contract.architecture_core_adapter_check_command, 'agent-onboard architecture --core-adapter-check');
    assert.strictEqual(output.contract.architecture_package_adapter_command, 'agent-onboard architecture --package-adapter');
    assert.strictEqual(output.contract.architecture_package_adapter_check_command, 'agent-onboard architecture --package-adapter-check');
    assert.strictEqual(output.contract.architecture_architecture_adapter_command, 'agent-onboard architecture --architecture-adapter');
    assert.strictEqual(output.contract.architecture_architecture_adapter_check_command, 'agent-onboard architecture --architecture-adapter-check');
    assert.strictEqual(output.contract.architecture_authority_adapter_command, 'agent-onboard architecture --authority-adapter');
    assert.strictEqual(output.contract.architecture_authority_adapter_check_command, 'agent-onboard architecture --authority-adapter-check');
    assert.strictEqual(output.contract.architecture_module_inclusion_plan_command, 'agent-onboard architecture --module-inclusion-plan');
    assert.strictEqual(output.contract.architecture_module_inclusion_check_command, 'agent-onboard architecture --module-inclusion-check');
    assert.strictEqual(output.contract.architecture_packaged_router_port_command, 'agent-onboard architecture --packaged-router-port');
    assert.strictEqual(output.contract.architecture_packaged_router_port_check_command, 'agent-onboard architecture --packaged-router-port-check');
    assert.strictEqual(output.contract.architecture_thin_entrypoint_rehearsal_command, 'agent-onboard architecture --thin-entrypoint-rehearsal');
    assert.strictEqual(output.contract.architecture_thin_entrypoint_rehearsal_check_command, 'agent-onboard architecture --thin-entrypoint-rehearsal-check');
    assert.strictEqual(output.contract.architecture_thin_entrypoint_cutover_command, 'agent-onboard architecture --thin-entrypoint-cutover');
    assert.strictEqual(output.contract.architecture_thin_entrypoint_cutover_check_command, 'agent-onboard architecture --thin-entrypoint-cutover-check');
    assert.strictEqual(output.contract.architecture_router_adapter_delegation_command, 'agent-onboard architecture --router-adapter-delegation');
    assert.strictEqual(output.contract.architecture_router_adapter_delegation_check_command, 'agent-onboard architecture --router-adapter-delegation-check');
    assert.strictEqual(output.contract.architecture_check_command, 'agent-onboard architecture --check');
    assert.strictEqual(output.contract.authority_first_read_command, 'agent-onboard authority --first-read');
    assert.strictEqual(output.contract.authority_check_command, 'agent-onboard authority --check');
    assert.strictEqual(output.contract.authority_compact_index_command, 'agent-onboard authority --index');
    assert.strictEqual(output.contract.authority_compact_index_check_command, 'agent-onboard authority --index-check');
    assert.strictEqual(output.contract.target_runtime_namespace_command, 'agent-onboard target runtime --namespace');
    assert.strictEqual(output.contract.target_runtime_check_command, 'agent-onboard target runtime --check');
    assert.strictEqual(output.contract.package_surface_command, 'agent-onboard release --surface');
    assert.strictEqual(output.contract.package_surface_check_command, 'agent-onboard release --surface-check');
    assert.deepStrictEqual(output.contract.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.publishes_package, false);
  });


  fullSourceTest('full source block line 355', () => {
    const result = run(['release', '--fixture']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.schema, 'agent-onboard-public-release-fixture-response-001');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.contract_schema, 'agent-onboard-public-release-contract-039');
    assert.strictEqual(output.fixture_matrix.schema, 'agent-onboard-public-release-fixture-matrix-022');
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'stale_package_version_contract'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'pack_allowlist_drift_contract'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'missing_bin_entrypoint_contract'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'projected_installed_package_parity_smoke'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_onboarding_installed_package_smoke'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_onboarding_post_publish_handoff'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_onboarding_real_target_repo_trial'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_architecture_map'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_command_router_boundary'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_domain_service_facades'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_authority_first_read_index'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_target_runtime_namespace'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_package_surface_preservation'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_installed_parity_architecture_smoke'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_domain_module_partition_plan'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_domain_extraction_rehearsal'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_extraction_golden_output_freeze'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_adapter_boundary'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_first_slice'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_bundle_parity'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_runtime_bridge'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_installed_fallback_smoke'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_second_slice_plan'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_second_slice_first_slice'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_authority_bundle_parity'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_source_module_extraction_authority_runtime_bridge'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_work_items_domain_source_extraction_plan'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_work_items_domain_source_extraction_first_slice'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_work_items_domain_source_extraction_bundle_parity'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_work_items_domain_source_extraction_installed_fallback_smoke'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_architecture_m1_closure_m2_seed'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'public_version_reference_policy'));
    assert.strictEqual(output.writes_files, false);
    assert.strictEqual(output.publishes_package, false);
  });


  fullSourceTest('full source block line 401', () => {
    const result = run(['architecture', '--map']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-architecture-map-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --map');
    assert.strictEqual(output.map.public_source_shape.source_partition_plan_file, '.agent-onboard/source-partition-plan.json');
    assert.strictEqual(output.map.public_source_shape.source_extraction_rehearsal_file, '.agent-onboard/source-extraction-rehearsal.json');
    assert.strictEqual(output.map.public_source_shape.physical_domain_split_status, 'cli_runtime_de_monolith_planning_applied');
    assert.strictEqual(output.map.public_source_shape.source_extraction_golden_outputs_file, '.agent-onboard/source-extraction-golden-outputs.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_adapter_boundary_file, '.agent-onboard/source-module-extraction-adapter-boundary.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_first_slice_file, '.agent-onboard/source-module-extraction-first-slice.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_bundle_parity_file, '.agent-onboard/source-module-extraction-bundle-parity.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_runtime_bridge_file, '.agent-onboard/source-module-extraction-runtime-bridge.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_installed_fallback_smoke_file, '.agent-onboard/source-module-extraction-installed-fallback-smoke.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_second_slice_plan_file, '.agent-onboard/source-module-extraction-second-slice-plan.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_second_slice_first_slice_file, '.agent-onboard/source-module-extraction-second-slice-first-slice.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_second_slice_first_slice_module, 'src/domains/authority.js');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_authority_bundle_parity_file, '.agent-onboard/source-module-extraction-authority-bundle-parity.json');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_authority_runtime_bridge_file, '.agent-onboard/source-module-extraction-authority-runtime-bridge.json');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_plan_file, '.agent-onboard/source-module-extraction-work-items-plan.json');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_planned_module, 'src/domains/work-items.js');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_first_slice_file, '.agent-onboard/source-module-extraction-work-items-first-slice.json');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_bundle_parity_file, '.agent-onboard/source-module-extraction-work-items-bundle-parity.json');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_runtime_bridge_file, '.agent-onboard/source-module-extraction-work-items-runtime-bridge.json');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_installed_fallback_smoke_file, '.agent-onboard/source-module-extraction-work-items-installed-fallback-smoke.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_plan_file, '.agent-onboard/source-module-extraction-claims-plan.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_first_slice_file, '.agent-onboard/source-module-extraction-claims-first-slice.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_bundle_parity_file, '.agent-onboard/source-module-extraction-claims-bundle-parity.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_runtime_bridge_file, '.agent-onboard/source-module-extraction-claims-runtime-bridge.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_installed_fallback_smoke_file, '.agent-onboard/source-module-extraction-claims-installed-fallback-smoke.json');
    assert.strictEqual(output.map.public_source_shape.source_domain_extraction_stabilization_closure_review_file, '.agent-onboard/source-domain-extraction-stabilization-closure-review.json');
    assert.strictEqual(output.map.public_source_shape.claims_domain_source_extraction_module, 'src/domains/claims.js');
    assert.strictEqual(output.map.public_source_shape.work_items_domain_source_extraction_module, 'src/domains/work-items.js');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_authority_bundle_parity_module, 'src/domains/authority.js');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_second_slice_planned_module, 'src/domains/authority.js');
    assert.strictEqual(output.map.public_source_shape.source_module_extraction_first_slice_module, 'src/domains/core.js');
    assert.deepStrictEqual(output.map.canonical_domains.map((domain) => domain.id), ['core', 'authority', 'work_items', 'claims', 'target', 'release_package']);
    assert.deepStrictEqual(output.current_runtime.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.writes_target_repository_state, false);
  });


  fullSourceTest('full source block line 446', () => {
    const result = run(['architecture', '--router']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-command-router-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --router');
    assert.strictEqual(output.router.dispatch_mode, 'table_driven_top_level_router');
    assert.strictEqual(output.router.dispatcher, 'dispatchCommand');
    assert.deepStrictEqual(output.route_commands, ['help', 'version', 'status', 'init', 'agents', 'guard', 'authority', 'architecture', 'release', 'target-config', 'work-items', 'target', 'target-instance']);
    assert.strictEqual(output.router.boundary.unsupported_commands_fail_closed, true);
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('full source block line 461', () => {
    const result = run(['architecture', '--facades']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-domain-service-facades-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --facades');
    assert.deepStrictEqual(output.facade_ids, ['core', 'authority', 'work_items', 'claims', 'target', 'release_package']);
    assert.deepStrictEqual(output.service_names, ['coreService', 'authorityService', 'workItemsService', 'claimsService', 'targetService', 'releasePackageService']);
    assert.ok(output.router_routes.every((route) => route.facade));
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('full source block line 475', () => {
    const result = run(['architecture', '--partition-plan']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-domain-module-partition-plan-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --partition-plan');
    assert.strictEqual(output.plan_file, '.agent-onboard/source-partition-plan.json');
    assert.strictEqual(output.plan.current_shape.physical_module_partition_status, 'planned_not_applied');
    assert.deepStrictEqual(output.plan.planned_source_modules.map((module) => module.domain), ['core', 'authority', 'work_items', 'claims', 'target', 'release_package']);
    assert.strictEqual(output.plan.boundary.moves_source_files, false);
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('full source block line 490', () => {
    const result = run(['architecture', '--partition-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-domain-module-partition-plan-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.validated.planned_module_count, true);
    assert.strictEqual(output.validated.planned_modules_map_to_facades, true);
    assert.strictEqual(output.validated.physical_partition_not_applied, true);
    assert.strictEqual(output.validated.partition_commands_no_write, true);
    assert.strictEqual(output.validated.package_allowlist_unchanged, true);
    assert.strictEqual(output.validated.source_plan_file, true);
    assert.strictEqual(output.source_plan_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 506', () => {
    const result = run(['architecture', '--extraction-rehearsal']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-domain-extraction-rehearsal-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --extraction-rehearsal');
    assert.strictEqual(output.rehearsal_file, '.agent-onboard/source-extraction-rehearsal.json');
    assert.strictEqual(output.rehearsal.rehearsal_status, 'rehearsed_not_applied');
    assert.strictEqual(output.rehearsal.extraction_rehearsal_units.length, 6);
    assert.deepStrictEqual(output.physical_module_paths_present, ['src/domains/core.js', 'src/domains/authority.js', 'src/domains/work-items.js', 'src/domains/claims.js']);
    assert.strictEqual(output.boundary.creates_source_modules, false);
  });


  fullSourceTest('full source block line 521', () => {
    const result = run(['architecture', '--extraction-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-domain-extraction-rehearsal-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.validated.partition_plan, true);
    assert.strictEqual(output.validated.rehearsal_unit_count, true);
    assert.strictEqual(output.validated.no_physical_modules_created, true);
    assert.strictEqual(output.validated.extraction_commands_no_write, true);
    assert.strictEqual(output.validated.package_allowlist_unchanged, true);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 535', () => {
    const result = run(['authority', '--first-read']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-authority-first-read-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard authority --first-read');
    assert.deepStrictEqual(output.read_order.map((entry) => entry.path), ['AGENTS.md', 'SOURCE_OF_TRUTH.md', '.agent-onboard/authority-path.json', '.agent-onboard/authority-index.json', 'llms.txt', 'package.json', 'authority-map.json', 'manifest.json', '.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'README.md', 'raw evidence/source files']);
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('full source block line 547', () => {
    const result = run(['authority', '--check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-authority-first-read-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.validated.first_read_order, true);
    assert.strictEqual(output.validated.authority_commands_no_write, true);
    assert.strictEqual(output.validated.source_authority_files, true);
    assert.ok(output.source_files_present.includes('llms.txt'));
    assert.ok(output.source_files_present.includes('.agent-onboard/authority-path.json'));
    assert.strictEqual(output.validated.compact_authority_index, true);
    assert.strictEqual(output.validated.authority_state_shards, true);
    assert.strictEqual(output.compact_authority_index_check.index_file_status, 'fresh');
    assert.strictEqual(output.authority_state_sharding_check.status, 'ok');
  });


  fullSourceTest('public authority compact index command reports digest-only drift guard', () => {
    const result = run(['authority', '--index']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-authority-compact-index-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.command, 'agent-onboard authority --index');
    assert.strictEqual(output.authority_index.schema, 'agent-onboard-public-authority-compact-index-001');
    assert.strictEqual(output.authority_index.raw_authority_loaded_by_default, false);
    assert.strictEqual(output.authority_index.file_contents_inlined, false);
    assert.ok(output.authority_index.indexed_authority_files.every((entry) => entry.content_inlined === false));
    assert.ok(output.authority_index.indexed_authority_files.some((entry) => entry.file_path === 'AGENTS.md' && entry.file_id.startsWith('ni:///sha-256;')));
  });


  fullSourceTest('public authority compact index check validates stored index freshness', () => {
    const result = run(['authority', '--index-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-authority-compact-index-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.index_file, '.agent-onboard/authority-index.json');
    assert.strictEqual(output.index_file_status, 'fresh');
    assert.strictEqual(output.validated.stored_index_fresh_or_installed_context_allowed, true);
    assert.strictEqual(output.validated.raw_authority_loaded_by_default, true);
    assert.strictEqual(output.validated.file_contents_not_inlined, true);
    assert.strictEqual(output.validated.within_budget, true);
  });


  fullSourceTest('public authority state sharding seed validates compact shards', () => {
    const state = readJsonOutput(run(['authority', '--state']));
    assert.strictEqual(state.schema, 'agent-onboard-public-authority-state-sharding-seed-result-001');
    assert.strictEqual(state.status, 'ok');
    assert.strictEqual(state.command, 'agent-onboard authority --state');
    assert.strictEqual(state.check_command, 'agent-onboard authority --state-check');
    assert.ok(state.shard_paths.includes('.agent-onboard/state/live-authority.json'));
    assert.ok(state.shard_paths.includes('.agent-onboard/state/closed-gates.jsonl'));
    assert.strictEqual(state.summary.raw_authority_loaded_by_default, false);
    assert.strictEqual(state.summary.file_contents_inlined, false);
    assert.strictEqual(state.boundary.writes_files, false);
    assert.strictEqual(state.boundary.state_shards_packaged_in_npm_tarball, false);

    const check = readJsonOutput(run(['authority', '--state-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-authority-state-sharding-seed-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard authority --state-check');
    assert.strictEqual(check.validated.stored_shards_fresh_or_installed_context_allowed, true);
    assert.strictEqual(check.validated.source_shards_present_or_installed_context_allowed, true);
    assert.ok(check.shard_files.every((entry) => entry.status === 'fresh'));
    assert.deepStrictEqual(check.errors, []);
  });


  fullSourceTest('full source block line 559', () => {
    const result = run(['target', 'runtime', '--namespace']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-runtime-namespace-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target runtime --namespace');
    assert.strictEqual(output.namespace_root, '.agent-onboard');
    assert.strictEqual(output.namespace_file, '.agent-onboard/runtime-namespace.json');
    assert.deepStrictEqual(output.canonical_runtime_files.map((entry) => entry.path), ['.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', '.agent-onboard/authority-path.json']);
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('full source block line 573', () => {
    const result = run(['target', 'runtime', '--check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-runtime-namespace-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.validated.namespace_root, true);
    assert.strictEqual(output.validated.namespace_file, true);
    assert.strictEqual(output.validated.runtime_file_order, true);
    assert.strictEqual(output.validated.target_onboarding_canonical_file, true);
    assert.strictEqual(output.validated.target_onboarding_write_set, true);
    assert.strictEqual(output.validated.reserved_future_files_not_written, true);
    assert.strictEqual(output.validated.runtime_commands_no_write, true);
    assert.strictEqual(output.validated.source_runtime_namespace_file, true);
    assert.ok(output.target_onboarding_canonical_files.includes('.agent-onboard/runtime-namespace.json'));
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 591', () => {
    const result = run(['release', '--surface']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-package-surface-preservation-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --surface');
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.ok(output.source_only_files.includes('AGENTS.md'));
    assert.ok(output.source_only_files.includes('.agent-onboard/work-items.json'));
    assert.strictEqual(output.source_only_files_projected_into_pack.length, 0);
    assert.strictEqual(output.boundary.runs_package_manager, false);
  });


  fullSourceTest('full source block line 607', () => {
    const result = run(['release', '--surface-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-package-surface-preservation-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.validated.controlled_modular_package_surface, true);
    assert.strictEqual(output.validated.package_json_files_allowlist, true);
    assert.strictEqual(output.validated.source_only_context_excluded_from_pack, true);
    assert.strictEqual(output.validated.bin_entrypoints_in_pack, true);
    assert.strictEqual(output.validated.public_artifact_messaging, true);
    assert.strictEqual(output.validated.package_source_manifest, true);
    assert.strictEqual(output.validated.package_source_manifest_content_addressed, true);
    assert.strictEqual(output.validated.package_source_manifest_hash_cache_excluded, true);
    assert.strictEqual(output.validated.surface_commands_no_write, true);
    assert.strictEqual(output.package_source_manifest.schema, 'agent-onboard-public-package-source-manifest-check-result-001');
    assert.strictEqual(output.package_source_manifest.status, 'ok');
    assert.strictEqual(output.package_source_manifest.entry_count, EXPECTED_PACK_FILES.length);
    assert.ok(output.package_source_manifest.sample_entries[0].file_id.startsWith('ni:///sha-256;'));
    assert.strictEqual(output.package_source_manifest.hash_cache.cache_file_projected_into_pack, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('package source manifest command is explicit, content-addressed, and read-only', () => {
    const result = run(['release', '--source-manifest']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-package-source-manifest-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --source-manifest');
    assert.strictEqual(output.entry_count, EXPECTED_PACK_FILES.length);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.files.length, EXPECTED_PACK_FILES.length);
    assert.ok(output.files.every((entry) => entry.file_id.startsWith('ni:///sha-256;')));
    assert.ok(output.files.every((entry) => !Object.prototype.hasOwnProperty.call(entry, 'sha256')));
    assert.strictEqual(output.hash_cache.cache_file_projected_into_pack, false);
    assert.strictEqual(output.hash_cache_budget.status, 'ok');
    assert.strictEqual(output.hash_cache_budget.required_for_public_package_manifest, false);
    assert.strictEqual(output.hash_cache_budget.authority_for_file_existence, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.runs_package_manager, false);
  });


  fullSourceTest('package source manifest check command validates drift guard shape without writes', () => {
    const result = run(['release', '--source-manifest-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-package-source-manifest-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --source-manifest-check');
    assert.strictEqual(output.entry_count, EXPECTED_PACK_FILES.length);
    assert.strictEqual(output.validated.package_files_are_content_addressed, true);
    assert.strictEqual(output.validated.raw_sha256_not_exposed, true);
    assert.strictEqual(output.validated.hash_cache_not_projected_into_package, true);
    assert.strictEqual(output.validated.hash_cache_budget_enforced, true);
    assert.strictEqual(output.validated.hash_cache_is_not_existence_authority, true);
    assert.strictEqual(output.hash_cache_budget.status, 'ok');
    assert.strictEqual(output.validated.command_is_read_only, true);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('exact artifact oracle packs and fresh-installs the local candidate without registry mutation', () => {
    const result = run(['release', '--artifact-oracle-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-exact-artifact-oracle-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --artifact-oracle');
    assert.strictEqual(output.check_command, 'agent-onboard release --artifact-oracle-check');
    assert.strictEqual(output.npm_pack.status, 'ok');
    assert.strictEqual(output.npm_pack.name, 'agent-onboard');
    assert.strictEqual(output.npm_pack.npm_version, EXPECTED_VERSION);
    assert.strictEqual(output.npm_pack.filename, `agent-onboard-${EXPECTED_VERSION}.tgz`);
    assert.strictEqual(output.npm_pack.file_count, EXPECTED_PACK_FILES.length);
    assert.strictEqual(output.npm_pack.exact_file_list_matches_contract, true);
    assert.deepStrictEqual(output.exact_pack_files, EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.oracle.exact_tgz_sha256_present, true);
    assert.strictEqual(output.oracle.npm_integrity_present, true);
    assert.strictEqual(output.oracle.raw_pack_stdout_inlined, false);
    assert.strictEqual(output.fresh_install_smoke.install.status, 'ok');
    assert.strictEqual(output.fresh_install_smoke.cli_entrypoint_present, true);
    assert.strictEqual(output.fresh_install_smoke.version_smoke.status, 'ok');
    assert.strictEqual(output.fresh_install_smoke.release_check_smoke.status, 'ok');
    assert.strictEqual(output.fresh_install_smoke.authority_state_check_smoke.status, 'ok');
    assert.strictEqual(output.fresh_install_smoke.authority_state_parity_smoke.status, 'ok');
    assert.strictEqual(output.validated.exact_pack_file_list_matches_contract, true);
    assert.strictEqual(output.validated.fresh_install_from_exact_tgz, true);
    assert.strictEqual(output.validated.fresh_installed_release_check, true);
    assert.strictEqual(output.validated.fresh_installed_authority_state_check, true);
    assert.strictEqual(output.validated.fresh_installed_authority_state_parity, true);
    assert.strictEqual(output.boundary.writes_package_root, false);
    assert.strictEqual(output.boundary.writes_temp_files, true);
    assert.strictEqual(output.boundary.runs_package_manager, true);
    assert.strictEqual(output.boundary.mutates_registry, false);
    assert.strictEqual(output.boundary.network_required, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('installed authority state shard parity keeps source shards out of packaged runtime', () => {
    const result = run(['release', '--authority-state-parity-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-installed-authority-state-shard-parity-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --authority-state-parity');
    assert.strictEqual(output.check_command, 'agent-onboard release --authority-state-parity-check');
    assert.strictEqual(output.validated.source_state_shards_not_projected_into_package, true);
    assert.strictEqual(output.validated.source_state_shards_present_or_installed_context_allowed, true);
    assert.strictEqual(output.validated.source_authority_state_check_ok, true);
    assert.strictEqual(output.validated.installed_context_allows_absent_state_shards, true);
    assert.strictEqual(output.validated.raw_authority_loaded_by_default, false);
    assert.strictEqual(output.validated.file_contents_not_inlined, true);
    assert.strictEqual(output.boundary.state_shards_packaged_in_npm_tarball, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('package source manifest hash cache budget is optional, strict, and source-only', () => {
    const sourceManifestModule = require(path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'source-manifest-service.js'));
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-hash-cache-'));
    copyExpectedPackFiles(tempRoot);
    fs.mkdirSync(path.join(tempRoot, '.agent-onboard'), { recursive: true });
    const service = sourceManifestModule.createPackageSourceManifestService({
      packageName: 'agent-onboard',
      version: EXPECTED_VERSION,
      releaseLine: EXPECTED_RELEASE_LINE,
      expectedPackFiles: EXPECTED_PACK_FILES,
      sourceOnlyFiles: ['.agent-onboard/source-manifest.hash-cache.json']
    });
    const absent = service.check(tempRoot);
    assert.strictEqual(absent.status, 'ok');
    assert.strictEqual(absent.hash_cache_budget.cache_present, false);
    assert.strictEqual(absent.hash_cache_budget.cache_absent_is_valid, true);
    const cache = sourceManifestModule.buildHashCache(tempRoot, EXPECTED_PACK_FILES);
    const cachePath = path.join(tempRoot, '.agent-onboard', 'source-manifest.hash-cache.json');
    fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
    const cached = service.check(tempRoot);
    assert.strictEqual(cached.status, 'ok');
    assert.strictEqual(cached.hash_cache_budget.cache_present, true);
    assert.strictEqual(cached.hash_cache_budget.entry_count, EXPECTED_PACK_FILES.length);
    assert.strictEqual(cached.hash_cache.hits, EXPECTED_PACK_FILES.length);
    assert.strictEqual(cached.hash_cache.misses, 0);
    assert.strictEqual(cached.hash_cache_budget.cache_file_projected_into_pack, false);
    const stale = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    stale.entries['__extra__/not-a-package-file.txt'] = {
      file_id: 'ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      stat: { bytes: 1, mtime_ms: '1', ctime_ms: '1', dev: '1', ino: '1' }
    };
    fs.writeFileSync(cachePath, `${JSON.stringify(stale, null, 2)}\n`);
    const failed = service.check(tempRoot);
    assert.strictEqual(failed.status, 'error');
    assert.ok(failed.errors.some((error) => error.includes('source manifest hash cache budget failed')));
    assert.deepStrictEqual(failed.hash_cache_budget.extra_paths, ['__extra__/not-a-package-file.txt']);
  });


  fullSourceTest('full source block line 622', () => {
    const result = run(['architecture', '--check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-architecture-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.check_scope.mode, 'retired_m3_checker_reduced');
    assert.strictEqual(output.validated.retired_architecture_checker_reduced, true);
    assert.strictEqual(output.validated.historical_source_extraction_checks_retired, true);
    assert.strictEqual(output.validated.domain_count, true);
    assert.strictEqual(output.validated.domain_order, true);
    assert.strictEqual(output.validated.compact_package_boundary, true);
    assert.strictEqual(output.pack_file_count, EXPECTED_PACK_FILES.length);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(output, 'projected_pack_files'), false);
    assert.strictEqual(output.validated.architecture_commands_no_write, true);
    assert.strictEqual(output.validated.command_router_boundary, true);
    assert.strictEqual(output.validated.domain_service_facades, true);
    assert.strictEqual(output.validated.target_runtime_namespace, true);
    assert.strictEqual(output.validated.packaged_router_port, true);
    assert.ok(output.retired_checks.includes('source_extraction_rehearsals'));
    assert.strictEqual(output.command_router.status, 'ok');
    assert.strictEqual(output.command_router.route_count, 13);
    assert.strictEqual(output.domain_service_facades.status, 'ok');
    assert.strictEqual(output.domain_service_facades.facade_count, 6);
    assert.strictEqual(output.target_runtime_namespace.status, 'ok');
    assert.strictEqual(output.packaged_router_port.status, 'ok');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(output.domain_service_facades, 'router_routes'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(output.packaged_router_port, 'module_reports'), false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 646', () => {
    const result = run(['release', '--parity-smoke']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-installed-package-parity-smoke-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --parity-smoke');
    assert.strictEqual(output.parity.source_candidate_release_check, true);
    assert.strictEqual(output.parity.source_context_excluded_from_pack, true);
    assert.strictEqual(output.parity.bin_entrypoints_in_pack, true);
    assert.strictEqual(output.parity.runtime_version_matches_package_json, true);
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.strictEqual(output.boundary.creates_temp_files, false);
  });
};
