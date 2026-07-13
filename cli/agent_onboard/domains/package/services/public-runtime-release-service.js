'use strict';

function createPublicRuntimeReleaseCommandService(deps = {}) {
  const {
    PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
    PUBLIC_ARCHITECTURE_MAP,
    PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_CLEAN_COMPACTION_BASELINE,
    PUBLIC_CLEAN_COMPACTION_CATALOG,
    PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
    PUBLIC_COMMAND_ROUTER,
    PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY,
    PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
    PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
    PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
    PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
    PUBLIC_PACKAGE_SURFACE_PRESERVATION,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_RELEASE_FIXTURE_MATRIX,
    PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
    PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
    PUBLIC_VERSION_REFERENCE_POLICY,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    VERSION,
    json,
    sourceContext,
    publicReleasePostPublishCommands,
    publicPackageSurface,
    publicPackageSurfaceCheck,
    publicPackageSourceManifest,
    publicPackageSourceManifestCheck,
    publicExactArtifactOracle,
    publicInstalledAuthorityStateShardParity,
    publicCleanCompactionBaseline,
    publicCleanCompactionBaselineCheck,
    publicCleanCompactionCatalog,
    publicCleanCompactionCatalogCheck,
    publicPackageKeywordTaxonomyCompaction,
    publicPackageKeywordTaxonomyCompactionCheck,
    publicReadmeFirstReadHistorySplitPlan,
    publicReadmeFirstReadHistorySplitPlanCheck,
    publicReadmeHistoryArchiveSplitDryRun,
    publicReadmeHistoryArchiveSplitDryRunCheck,
    publicReadmeHistoryArchiveSplitApply,
    publicReadmeHistoryArchiveSplitApplyCheck,
    publicClosedGateArtifactCompactionPlan,
    publicClosedGateArtifactCompactionPlanCheck,
    publicClosedGateArtifactCompactionDryRun,
    publicClosedGateArtifactCompactionDryRunCheck,
    publicClosedGateArtifactCompactionApply,
    publicClosedGateArtifactCompactionApplyCheck,
    publicClosedGateArchiveReader,
    publicClosedGateArchiveReaderCheck,
    publicClosedGateRawArtifactPrunePlanning,
    publicClosedGateRawArtifactPrunePlanningCheck,
    publicClosedGateRawArtifactPruneDryRun,
    publicClosedGateRawArtifactPruneDryRunCheck,
    publicClosedGateRawArtifactPruneApply,
    publicClosedGateRawArtifactPruneApplyCheck,
    publicFullTestRunnerCompletion,
    publicFullTestRunnerCompletionCheck,
    publicVersionReferencePolicyCheck,
    publicInstalledPackageParitySmoke,
    publicInstalledParityArchitectureSmoke,
    publicTargetOnboardingInstalledPackageSmoke,
    publicTargetOnboardingPostPublishHandoff,
    publicTargetOnboardingPublishedAcceptance,
    publicTargetOnboardingRealTargetRepoTrial,
    publicReleaseCheck
  } = deps;

function runRelease(args) {
  if (args.length === 1 && args[0] === '--plan') {
    json({
      schema: 'agent-onboard-public-release-plan-005',
      status: 'ok',
      package_name: PUBLIC_RELEASE_CONTRACT.package_name,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
      contract_command: PUBLIC_RELEASE_CONTRACT.contract_command,
      fixture_command: PUBLIC_RELEASE_CONTRACT.fixture_command,
      parity_smoke_command: PUBLIC_RELEASE_CONTRACT.parity_smoke_command,
      architecture_parity_smoke_command: PUBLIC_RELEASE_CONTRACT.architecture_parity_smoke_command,
      target_onboarding_smoke_command: PUBLIC_RELEASE_CONTRACT.target_onboarding_smoke_command,
      post_publish_handoff_command: PUBLIC_RELEASE_CONTRACT.post_publish_handoff_command,
      published_acceptance_command: PUBLIC_RELEASE_CONTRACT.published_acceptance_command,
      real_target_trial_command: PUBLIC_RELEASE_CONTRACT.real_target_trial_command,
      architecture_map_command: PUBLIC_RELEASE_CONTRACT.architecture_map_command,
      architecture_router_command: PUBLIC_RELEASE_CONTRACT.architecture_router_command,
      architecture_facades_command: PUBLIC_RELEASE_CONTRACT.architecture_facades_command,
      architecture_partition_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_partition_plan_command,
      architecture_partition_check_command: PUBLIC_RELEASE_CONTRACT.architecture_partition_check_command,
      architecture_extraction_rehearsal_command: PUBLIC_RELEASE_CONTRACT.architecture_extraction_rehearsal_command,
      architecture_extraction_check_command: PUBLIC_RELEASE_CONTRACT.architecture_extraction_check_command,
      architecture_golden_outputs_command: PUBLIC_RELEASE_CONTRACT.architecture_golden_outputs_command,
      architecture_golden_check_command: PUBLIC_RELEASE_CONTRACT.architecture_golden_check_command,
      architecture_adapter_boundary_command: PUBLIC_RELEASE_CONTRACT.architecture_adapter_boundary_command,
      architecture_adapter_check_command: PUBLIC_RELEASE_CONTRACT.architecture_adapter_check_command,
      architecture_first_slice_command: PUBLIC_RELEASE_CONTRACT.architecture_first_slice_command,
      architecture_first_slice_check_command: PUBLIC_RELEASE_CONTRACT.architecture_first_slice_check_command,
      architecture_bundle_parity_command: PUBLIC_RELEASE_CONTRACT.architecture_bundle_parity_command,
      architecture_bundle_parity_check_command: PUBLIC_RELEASE_CONTRACT.architecture_bundle_parity_check_command,
      architecture_runtime_bridge_command: PUBLIC_RELEASE_CONTRACT.architecture_runtime_bridge_command,
      architecture_runtime_bridge_check_command: PUBLIC_RELEASE_CONTRACT.architecture_runtime_bridge_check_command,
      architecture_installed_fallback_smoke_command: PUBLIC_RELEASE_CONTRACT.architecture_installed_fallback_smoke_command,
      architecture_installed_fallback_check_command: PUBLIC_RELEASE_CONTRACT.architecture_installed_fallback_check_command,
      architecture_second_slice_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_second_slice_plan_command,
      architecture_second_slice_check_command: PUBLIC_RELEASE_CONTRACT.architecture_second_slice_check_command,
      architecture_second_slice_first_slice_command: PUBLIC_RELEASE_CONTRACT.architecture_second_slice_first_slice_command,
      architecture_second_slice_first_slice_check_command: PUBLIC_RELEASE_CONTRACT.architecture_second_slice_first_slice_check_command,
      architecture_authority_bundle_parity_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_bundle_parity_command,
      architecture_authority_bundle_parity_check_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_bundle_parity_check_command,
      architecture_authority_runtime_bridge_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_runtime_bridge_command,
      architecture_authority_runtime_bridge_check_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_runtime_bridge_check_command,
      architecture_work_items_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_plan_command,
      architecture_work_items_check_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_check_command,
      architecture_work_items_first_slice_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_first_slice_command,
      architecture_work_items_first_slice_check_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_first_slice_check_command,
      architecture_work_items_bundle_parity_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_bundle_parity_command,
      architecture_work_items_bundle_parity_check_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_bundle_parity_check_command,
      architecture_work_items_runtime_bridge_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_runtime_bridge_command,
      architecture_work_items_runtime_bridge_check_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_runtime_bridge_check_command,
      architecture_work_items_installed_fallback_smoke_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_installed_fallback_smoke_command,
      architecture_work_items_installed_fallback_check_command: PUBLIC_RELEASE_CONTRACT.architecture_work_items_installed_fallback_check_command,
      architecture_claims_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_plan_command,
      architecture_claims_check_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_check_command,
      architecture_claims_first_slice_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_first_slice_command,
      architecture_claims_first_slice_check_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_first_slice_check_command,
      architecture_claims_bundle_parity_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_bundle_parity_command,
      architecture_claims_bundle_parity_check_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_bundle_parity_check_command,
      architecture_claims_runtime_bridge_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_runtime_bridge_command,
      architecture_claims_runtime_bridge_check_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_runtime_bridge_check_command,
      architecture_claims_installed_fallback_smoke_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_installed_fallback_smoke_command,
      architecture_claims_installed_fallback_check_command: PUBLIC_RELEASE_CONTRACT.architecture_claims_installed_fallback_check_command,
      architecture_source_domain_closure_review_command: PUBLIC_RELEASE_CONTRACT.architecture_source_domain_closure_review_command,
      architecture_source_domain_closure_check_command: PUBLIC_RELEASE_CONTRACT.architecture_source_domain_closure_check_command,
      architecture_cli_runtime_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_cli_runtime_plan_command,
      architecture_cli_runtime_check_command: PUBLIC_RELEASE_CONTRACT.architecture_cli_runtime_check_command,
      architecture_thin_router_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_router_command,
      architecture_thin_router_check_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_router_check_command,
      architecture_compatibility_port_command: PUBLIC_RELEASE_CONTRACT.architecture_compatibility_port_command,
      architecture_compatibility_port_check_command: PUBLIC_RELEASE_CONTRACT.architecture_compatibility_port_check_command,
      architecture_core_adapter_command: PUBLIC_RELEASE_CONTRACT.architecture_core_adapter_command,
      architecture_core_adapter_check_command: PUBLIC_RELEASE_CONTRACT.architecture_core_adapter_check_command,
      architecture_package_adapter_command: PUBLIC_RELEASE_CONTRACT.architecture_package_adapter_command,
      architecture_package_adapter_check_command: PUBLIC_RELEASE_CONTRACT.architecture_package_adapter_check_command,
      architecture_architecture_adapter_command: PUBLIC_RELEASE_CONTRACT.architecture_architecture_adapter_command,
      architecture_architecture_adapter_check_command: PUBLIC_RELEASE_CONTRACT.architecture_architecture_adapter_check_command,
      architecture_authority_adapter_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_adapter_command,
      architecture_authority_adapter_check_command: PUBLIC_RELEASE_CONTRACT.architecture_authority_adapter_check_command,
      architecture_module_inclusion_plan_command: PUBLIC_RELEASE_CONTRACT.architecture_module_inclusion_plan_command,
      architecture_module_inclusion_check_command: PUBLIC_RELEASE_CONTRACT.architecture_module_inclusion_check_command,
      architecture_packaged_router_port_command: PUBLIC_RELEASE_CONTRACT.architecture_packaged_router_port_command,
      architecture_packaged_router_port_check_command: PUBLIC_RELEASE_CONTRACT.architecture_packaged_router_port_check_command,
      architecture_thin_entrypoint_rehearsal_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_entrypoint_rehearsal_command,
      architecture_thin_entrypoint_rehearsal_check_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_entrypoint_rehearsal_check_command,
      architecture_thin_entrypoint_cutover_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_entrypoint_cutover_command,
      architecture_thin_entrypoint_cutover_check_command: PUBLIC_RELEASE_CONTRACT.architecture_thin_entrypoint_cutover_check_command,
      architecture_router_adapter_delegation_command: PUBLIC_RELEASE_CONTRACT.architecture_router_adapter_delegation_command,
      architecture_router_adapter_delegation_check_command: PUBLIC_RELEASE_CONTRACT.architecture_router_adapter_delegation_check_command,
      version_sprawl_check_command: PUBLIC_RELEASE_CONTRACT.version_sprawl_check_command,
      clean_compaction_baseline_command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
      clean_compaction_baseline_check_command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
      clean_compaction_catalog_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
      clean_compaction_catalog_check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
      architecture_check_command: PUBLIC_RELEASE_CONTRACT.architecture_check_command,
      authority_first_read_command: PUBLIC_RELEASE_CONTRACT.authority_first_read_command,
      authority_check_command: PUBLIC_RELEASE_CONTRACT.authority_check_command,
      authority_compact_index_command: PUBLIC_RELEASE_CONTRACT.authority_compact_index_command,
      authority_compact_index_check_command: PUBLIC_RELEASE_CONTRACT.authority_compact_index_check_command,
      target_runtime_namespace_command: PUBLIC_RELEASE_CONTRACT.target_runtime_namespace_command,
      target_runtime_check_command: PUBLIC_RELEASE_CONTRACT.target_runtime_check_command,
      package_surface_command: PUBLIC_RELEASE_CONTRACT.package_surface_command,
      package_surface_check_command: PUBLIC_RELEASE_CONTRACT.package_surface_check_command,
      check_command: PUBLIC_RELEASE_CONTRACT.command,
      contract: PUBLIC_RELEASE_CONTRACT,
      fixture_matrix: PUBLIC_RELEASE_FIXTURE_MATRIX,
      architecture_map: PUBLIC_ARCHITECTURE_MAP,
      command_router: PUBLIC_COMMAND_ROUTER,
      domain_service_facades: PUBLIC_DOMAIN_SERVICE_FACADES,
      source_domain_module_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
      source_domain_extraction_rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
      source_extraction_golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
      source_module_extraction_adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
      source_module_extraction_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    source_module_extraction_runtime_bridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_second_slice_plan: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
      source_module_extraction_second_slice_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
      source_module_extraction_work_items_plan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_work_items_first_slice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_work_items_bundle_parity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_work_items_runtime_bridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_work_items_installed_fallback_smoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_module_extraction_claims_plan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_claims_first_slice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_claims_bundle_parity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_claims_runtime_bridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_claims_installed_fallback_smoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_domain_extraction_stabilization_closure_review: PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
      cli_runtime_de_monolith_planning: PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
      core_command_adapter_extraction: PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
      package_command_adapter_extraction: PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
      architecture_command_adapter_extraction: PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
      authority_command_adapter_extraction: PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
      modular_runtime_package_inclusion_plan: PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
      packaged_router_port_inclusion: PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
      thin_entrypoint_router_cutover_rehearsal: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
      thin_entrypoint_router_cutover_application: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
      router_command_adapter_delegation_expansion: PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
      version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
      authority_first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
      target_runtime_namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
      package_surface_preservation: PUBLIC_PACKAGE_SURFACE_PRESERVATION,
      installed_parity_architecture_smoke: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
      installed_authority_state_shard_parity: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY,
      source_context: sourceContext(),
      post_publish_verification_commands: publicReleasePostPublishCommands(VERSION),
      boundary: {
        writes_files: false,
        git_mutation: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_package: false,
        mutates_registry: false
      }
    });
    return 0;
  }
  if (args.length === 1 && args[0] === '--contract') {
    json({
      schema: 'agent-onboard-public-release-contract-response-001',
      status: 'ok',
      package_name: PUBLIC_RELEASE_CONTRACT.package_name,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      contract: PUBLIC_RELEASE_CONTRACT,
      fixture_matrix: PUBLIC_RELEASE_FIXTURE_MATRIX,
      architecture_map: PUBLIC_ARCHITECTURE_MAP,
      command_router: PUBLIC_COMMAND_ROUTER,
      domain_service_facades: PUBLIC_DOMAIN_SERVICE_FACADES,
      source_domain_module_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
      source_domain_extraction_rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
      source_extraction_golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
      source_module_extraction_adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
      source_module_extraction_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    source_module_extraction_runtime_bridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_second_slice_plan: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
      source_module_extraction_second_slice_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
      source_module_extraction_work_items_plan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_work_items_first_slice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_work_items_bundle_parity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_work_items_runtime_bridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_work_items_installed_fallback_smoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_module_extraction_claims_plan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_claims_first_slice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_claims_bundle_parity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_claims_runtime_bridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_claims_installed_fallback_smoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_domain_extraction_stabilization_closure_review: PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
      cli_runtime_de_monolith_planning: PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
      core_command_adapter_extraction: PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
      package_command_adapter_extraction: PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
      architecture_command_adapter_extraction: PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
      authority_command_adapter_extraction: PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
      modular_runtime_package_inclusion_plan: PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
      packaged_router_port_inclusion: PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
      thin_entrypoint_router_cutover_rehearsal: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
      thin_entrypoint_router_cutover_application: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
      router_command_adapter_delegation_expansion: PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
      version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
      authority_first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
      target_runtime_namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
      package_surface_preservation: PUBLIC_PACKAGE_SURFACE_PRESERVATION,
      installed_parity_architecture_smoke: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
      installed_authority_state_shard_parity: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY,
      source_context: sourceContext(),
      writes_files: false,
      publishes_package: false,
      mutates_registry: false
    });
    return 0;
  }
  if (args.length === 1 && args[0] === '--fixture') {
    json({
      schema: 'agent-onboard-public-release-fixture-response-001',
      status: 'ok',
      package_name: PUBLIC_RELEASE_CONTRACT.package_name,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
      fixture_matrix: PUBLIC_RELEASE_FIXTURE_MATRIX,
      architecture_map: PUBLIC_ARCHITECTURE_MAP,
      command_router: PUBLIC_COMMAND_ROUTER,
      domain_service_facades: PUBLIC_DOMAIN_SERVICE_FACADES,
      source_domain_module_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
      source_domain_extraction_rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
      source_extraction_golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
      source_module_extraction_adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
      source_module_extraction_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    source_module_extraction_runtime_bridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_second_slice_plan: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
      source_module_extraction_second_slice_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
      source_module_extraction_work_items_plan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_work_items_first_slice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_work_items_bundle_parity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_work_items_runtime_bridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_work_items_installed_fallback_smoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_module_extraction_claims_plan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_module_extraction_claims_first_slice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
      source_module_extraction_claims_bundle_parity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
      source_module_extraction_claims_runtime_bridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
      source_module_extraction_claims_installed_fallback_smoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
      source_domain_extraction_stabilization_closure_review: PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
      cli_runtime_de_monolith_planning: PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
      core_command_adapter_extraction: PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
      package_command_adapter_extraction: PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
      architecture_command_adapter_extraction: PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
      authority_command_adapter_extraction: PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
      modular_runtime_package_inclusion_plan: PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
      packaged_router_port_inclusion: PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
      thin_entrypoint_router_cutover_rehearsal: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
      thin_entrypoint_router_cutover_application: PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
      router_command_adapter_delegation_expansion: PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
      version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
      authority_first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
      target_runtime_namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
      package_surface_preservation: PUBLIC_PACKAGE_SURFACE_PRESERVATION,
      installed_parity_architecture_smoke: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
      installed_authority_state_shard_parity: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY,
      source_context: sourceContext(),
      writes_files: false,
      publishes_package: false,
      mutates_registry: false
    });
    return 0;
  }
  if (args.length === 1 && args[0] === '--surface') {
    json(publicPackageSurface());
    return 0;
  }
  if (args.length === 1 && args[0] === '--surface-check') {
    const result = publicPackageSurfaceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--source-manifest') {
    const result = publicPackageSourceManifest();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--source-manifest-check') {
    const result = publicPackageSourceManifestCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--artifact-oracle' || args[0] === '--artifact-oracle-check')) {
    const result = publicExactArtifactOracle();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--clean-inventory' || args[0] === '--clean-check')) {
    const checkMode = args[0] === '--clean-check';
    const result = checkMode ? publicCleanCompactionBaselineCheck() : publicCleanCompactionBaseline();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--clean-catalog' || args[0] === '--clean-catalog-check')) {
    const checkMode = args[0] === '--clean-catalog-check';
    const result = checkMode ? publicCleanCompactionCatalogCheck() : publicCleanCompactionCatalog();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--keyword-taxonomy' || args[0] === '--keyword-taxonomy-check')) {
    const checkMode = args[0] === '--keyword-taxonomy-check';
    const result = checkMode ? publicPackageKeywordTaxonomyCompactionCheck() : publicPackageKeywordTaxonomyCompaction();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--readme-plan' || args[0] === '--readme-plan-check')) {
    const checkMode = args[0] === '--readme-plan-check';
    const result = checkMode ? publicReadmeFirstReadHistorySplitPlanCheck() : publicReadmeFirstReadHistorySplitPlan();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--readme-dry-run' || args[0] === '--readme-dry-run-check')) {
    const checkMode = args[0] === '--readme-dry-run-check';
    const result = checkMode ? publicReadmeHistoryArchiveSplitDryRunCheck() : publicReadmeHistoryArchiveSplitDryRun();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--readme-apply' || args[0] === '--readme-apply-check')) {
    const checkMode = args[0] === '--readme-apply-check';
    const result = checkMode ? publicReadmeHistoryArchiveSplitApplyCheck() : publicReadmeHistoryArchiveSplitApply();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-plan' || args[0] === '--closed-gates-plan-check')) {
    const checkMode = args[0] === '--closed-gates-plan-check';
    const result = checkMode ? publicClosedGateArtifactCompactionPlanCheck() : publicClosedGateArtifactCompactionPlan();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-dry-run' || args[0] === '--closed-gates-dry-run-check')) {
    const checkMode = args[0] === '--closed-gates-dry-run-check';
    const result = checkMode ? publicClosedGateArtifactCompactionDryRunCheck() : publicClosedGateArtifactCompactionDryRun();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-apply' || args[0] === '--closed-gates-apply-check')) {
    const checkMode = args[0] === '--closed-gates-apply-check';
    const result = checkMode ? publicClosedGateArtifactCompactionApplyCheck() : publicClosedGateArtifactCompactionApply();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-read' || args[0] === '--closed-gates-read-check')) {
    const checkMode = args[0] === '--closed-gates-read-check';
    const result = checkMode ? publicClosedGateArchiveReaderCheck() : publicClosedGateArchiveReader();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-prune-plan' || args[0] === '--closed-gates-prune-plan-check')) {
    const checkMode = args[0] === '--closed-gates-prune-plan-check';
    const result = checkMode ? publicClosedGateRawArtifactPrunePlanningCheck() : publicClosedGateRawArtifactPrunePlanning();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-prune-dry-run' || args[0] === '--closed-gates-prune-dry-run-check')) {
    const checkMode = args[0] === '--closed-gates-prune-dry-run-check';
    const result = checkMode ? publicClosedGateRawArtifactPruneDryRunCheck() : publicClosedGateRawArtifactPruneDryRun();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--closed-gates-prune-apply' || args[0] === '--closed-gates-prune-apply-check')) {
    const checkMode = args[0] === '--closed-gates-prune-apply-check';
    const result = checkMode ? publicClosedGateRawArtifactPruneApplyCheck() : publicClosedGateRawArtifactPruneApply();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--full-test-runner' || args[0] === '--full-test-runner-check')) {
    const checkMode = args[0] === '--full-test-runner-check';
    const result = checkMode ? publicFullTestRunnerCompletionCheck() : publicFullTestRunnerCompletion();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && (args[0] === '--authority-state-parity' || args[0] === '--authority-state-parity-check')) {
    const result = publicInstalledAuthorityStateShardParity();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--version-sprawl-check') {
    const result = publicVersionReferencePolicyCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--parity-smoke') {
    const result = publicInstalledPackageParitySmoke();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--architecture-parity-smoke') {
    const result = publicInstalledParityArchitectureSmoke();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--target-onboarding-smoke') {
    const result = publicTargetOnboardingInstalledPackageSmoke();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--post-publish-handoff') {
    const result = publicTargetOnboardingPostPublishHandoff();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--published-acceptance') {
    const result = publicTargetOnboardingPublishedAcceptance();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--real-target-trial') {
    const result = publicTargetOnboardingRealTargetRepoTrial();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--check') {
    const result = publicReleaseCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  json({
    schema: 'agent-onboard-release-command-error-001',
    status: 'error',
    command_family: 'release',
    message: 'release requires --plan, --contract, --fixture, --surface, --surface-check, --source-manifest, --source-manifest-check, --artifact-oracle, --artifact-oracle-check, --authority-state-parity, --authority-state-parity-check, --clean-inventory, --clean-check, --clean-catalog, --clean-catalog-check, --keyword-taxonomy, --keyword-taxonomy-check, --readme-plan, --readme-plan-check, --readme-dry-run, --readme-dry-run-check, --readme-apply, --readme-apply-check, --closed-gates-plan, --closed-gates-plan-check, --closed-gates-dry-run, --closed-gates-dry-run-check, --closed-gates-apply, --closed-gates-apply-check, --closed-gates-read, --closed-gates-read-check, --closed-gates-prune-plan, --closed-gates-prune-plan-check, --closed-gates-prune-dry-run, --closed-gates-prune-dry-run-check, --closed-gates-prune-apply, --closed-gates-prune-apply-check, --full-test-runner, --full-test-runner-check, --version-sprawl-check, --parity-smoke, --architecture-parity-smoke, --target-onboarding-smoke, --post-publish-handoff, --published-acceptance, --real-target-trial, or --check',
    writes_files: false,
    publishes_package: false
  });
  return 1;
}



  return Object.freeze({
    runRelease
  });
}

module.exports = Object.freeze({
  createPublicRuntimeReleaseCommandService
});
