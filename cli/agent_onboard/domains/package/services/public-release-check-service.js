'use strict';

function createPublicReleaseCheckService(deps = {}) {
  const {
    VERSION,
    PUBLIC_RELEASE_CONTRACT,
    path,
    readJson,
    packageRoot,
    arrayEquals,
    sourceContext,
    packageJsonReleaseErrors,
    packageJsonProjectedPackFiles,
    publicArtifactMessagingErrors,
    sourceWorkItemsLedgerCheck,
    publicArchitectureCheck,
    publicPackageSurfaceCheck,
    publicVersionReferencePolicyCheck,
    publicCleanCompactionBaselineCheck,
    publicCleanCompactionCatalogCheck,
    publicPackageKeywordTaxonomyCompactionCheck,
    publicReadmeFirstReadHistorySplitPlanCheck,
    publicReadmeHistoryArchiveSplitDryRunCheck,
    publicReadmeHistoryArchiveSplitApplyCheck,
    publicClosedGateArtifactCompactionPlanCheck,
    publicClosedGateArtifactCompactionDryRunCheck,
    publicClosedGateArtifactCompactionApplyCheck,
    publicClosedGateArchiveReaderCheck,
    publicFullTestRunnerCompletionCheck,
    publicClosedGateRawArtifactPrunePlanningCheck,
    publicClosedGateRawArtifactPruneDryRunCheck,
    publicClosedGateRawArtifactPruneApplyCheck,
    publicInstalledAuthorityStateShardParity,
    publicReleaseTargetRepoProductCheck,
    publicCliRuntimeDeMonolithPlanningCheck,
    publicThinCliRouterSeedCheck,
    publicCompatibilityCommandPortSeedCheck,
    publicCoreCommandAdapterExtractionCheck,
    publicPackageCommandAdapterExtractionCheck,
    publicArchitectureCommandAdapterExtractionCheck,
    publicAuthorityCommandAdapterExtractionCheck,
    publicModularRuntimePackageInclusionPlanCheck,
    publicPackagedRouterPortInclusionCheck,
    publicThinEntrypointRouterCutoverRehearsalCheck,
    publicThinEntrypointRouterCutoverApplicationCheck,
    publicRouterCommandAdapterDelegationExpansionCheck,
    publicReleasePostPublishCommands
  } = deps;

function publicReleaseCheck(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const metadataErrors = packageJsonReleaseErrors(pkg, root);
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const packErrors = arrayEquals(projectedPackFiles, expectedPackFiles) ? [] : [
    `projected npm pack files must match ${expectedPackFiles.join(', ')}`
  ];
  const messagingErrors = publicArtifactMessagingErrors(root, expectedPackFiles);
  const sourceLedger = sourceWorkItemsLedgerCheck(root);
  const sourceLedgerErrors = sourceLedger.present ? sourceLedger.errors.map((error) => `source ledger: ${error}`) : [];
  const architecture = publicArchitectureCheck(root);
  const architectureErrors = architecture.errors.map((error) => `architecture: ${error}`);
  const packageSurface = publicPackageSurfaceCheck(root);
  const versionPolicy = publicVersionReferencePolicyCheck(root);
  const versionPolicyErrors = versionPolicy.errors.map((error) => `version reference policy: ${error}`);
  const cleanCompaction = publicCleanCompactionBaselineCheck(root);
  const cleanCompactionErrors = cleanCompaction.errors.map((error) => `clean compaction baseline: ${error}`);
  const cleanCompactionCatalog = publicCleanCompactionCatalogCheck(root);
  const cleanCompactionCatalogErrors = cleanCompactionCatalog.errors.map((error) => `clean compaction catalog: ${error}`);
  const keywordTaxonomy = publicPackageKeywordTaxonomyCompactionCheck(root);
  const keywordTaxonomyErrors = keywordTaxonomy.errors.map((error) => `package keyword taxonomy: ${error}`);
  const readmePlan = publicReadmeFirstReadHistorySplitPlanCheck(root);
  const readmePlanErrors = readmePlan.errors.map((error) => `README first-read/history split plan: ${error}`);
  const readmeDryRun = publicReadmeHistoryArchiveSplitDryRunCheck(root);
  const readmeDryRunErrors = readmeDryRun.errors.map((error) => `README history archive split dry-run: ${error}`);
  const readmeApply = publicReadmeHistoryArchiveSplitApplyCheck(root);
  const readmeApplyErrors = readmeApply.errors.map((error) => `README history archive split apply: ${error}`);
  const closedGatePlan = publicClosedGateArtifactCompactionPlanCheck(root);
  const closedGatePlanErrors = closedGatePlan.errors.map((error) => `closed gate artifact compaction plan: ${error}`);
  const closedGateDryRun = publicClosedGateArtifactCompactionDryRunCheck(root);
  const closedGateDryRunErrors = closedGateDryRun.errors.map((error) => `closed gate artifact compaction dry-run: ${error}`);
  const closedGateApply = publicClosedGateArtifactCompactionApplyCheck(root);
  const closedGateApplyErrors = closedGateApply.errors.map((error) => `closed gate artifact compaction apply: ${error}`);
  const closedGateArchiveReader = publicClosedGateArchiveReaderCheck(root);
  const closedGateArchiveReaderErrors = closedGateArchiveReader.errors.map((error) => `closed gate archive reader: ${error}`);
  const fullTestRunner = publicFullTestRunnerCompletionCheck(root);
  const fullTestRunnerErrors = fullTestRunner.errors.map((error) => `full-test runner completion: ${error}`);
  const rawArtifactPrunePlan = publicClosedGateRawArtifactPrunePlanningCheck(root);
  const rawArtifactPrunePlanErrors = rawArtifactPrunePlan.errors.map((error) => `closed gate raw artifact prune planning: ${error}`);
  const rawArtifactPruneDryRun = publicClosedGateRawArtifactPruneDryRunCheck(root);
  const rawArtifactPruneDryRunErrors = rawArtifactPruneDryRun.errors.map((error) => `closed gate raw artifact prune dry-run: ${error}`);
  const rawArtifactPruneApply = publicClosedGateRawArtifactPruneApplyCheck(root);
  const rawArtifactPruneApplyErrors = rawArtifactPruneApply.errors.map((error) => `closed gate raw artifact prune apply: ${error}`);
  const packageSurfaceErrors = packageSurface.errors.map((error) => `package surface: ${error}`);
  const architectureParity = { status: architecture.status === 'ok' ? 'ok' : 'error', errors: [] };
  const installedAuthorityStateParity = publicInstalledAuthorityStateShardParity(root);
  const installedAuthorityStateParityErrors = installedAuthorityStateParity.errors.map((error) => `installed authority state parity: ${error}`);
  const targetRepoProduct = publicReleaseTargetRepoProductCheck(root);
  const targetRepoProductErrors = targetRepoProduct.errors.map((error) => `target repo product: ${error}`);
  const retiredReleaseChecks = Object.freeze([
    'source_module_extraction_installed_fallback_smoke',
    'source_module_extraction_second_slice_plan',
    'source_module_extraction_second_slice_first_slice',
    'source_module_extraction_authority_bundle_parity',
    'source_module_extraction_authority_runtime_bridge',
    'work_items_domain_source_extraction_plan',
    'work_items_domain_source_extraction_first_slice',
    'work_items_domain_source_extraction_bundle_parity',
    'work_items_domain_source_extraction_runtime_bridge',
    'work_items_domain_source_extraction_installed_fallback_smoke',
    'claims_domain_source_extraction_plan',
    'claims_domain_source_extraction_first_slice',
    'claims_domain_source_extraction_bundle_parity',
    'claims_domain_source_extraction_runtime_bridge',
    'claims_domain_source_extraction_installed_fallback_smoke',
    'source_domain_extraction_stabilization_closure_review'
  ]);
  const cliRuntimePlan = publicCliRuntimeDeMonolithPlanningCheck(root);
  const cliRuntimePlanErrors = cliRuntimePlan.errors.map((error) => `cli runtime de-monolith planning: ${error}`);
  const thinCliRouter = publicThinCliRouterSeedCheck(root);
  const thinCliRouterErrors = thinCliRouter.errors.map((error) => `thin CLI router seed: ${error}`);
  const compatibilityPort = publicCompatibilityCommandPortSeedCheck(root);
  const compatibilityPortErrors = compatibilityPort.errors.map((error) => `compatibility command port seed: ${error}`);
  const coreAdapter = publicCoreCommandAdapterExtractionCheck(root);
  const coreAdapterErrors = coreAdapter.errors.map((error) => `core command adapter extraction: ${error}`);
  const packageAdapter = publicPackageCommandAdapterExtractionCheck(root);
  const packageAdapterErrors = packageAdapter.errors.map((error) => `package command adapter extraction: ${error}`);
  const architectureAdapter = publicArchitectureCommandAdapterExtractionCheck(root);
  const architectureAdapterErrors = architectureAdapter.errors.map((error) => `architecture command adapter extraction: ${error}`);
  const authorityAdapter = publicAuthorityCommandAdapterExtractionCheck(root);
  const authorityAdapterErrors = authorityAdapter.errors.map((error) => `authority command adapter extraction: ${error}`);
  const moduleInclusionPlan = publicModularRuntimePackageInclusionPlanCheck(root);
  const moduleInclusionPlanErrors = moduleInclusionPlan.errors.map((error) => `modular runtime package inclusion plan: ${error}`);
  const packagedRouterPort = publicPackagedRouterPortInclusionCheck(root);
  const packagedRouterPortErrors = packagedRouterPort.errors.map((error) => `packaged router port inclusion: ${error}`);
  const thinEntrypointRehearsal = publicThinEntrypointRouterCutoverRehearsalCheck(root);
  const thinEntrypointRehearsalErrors = thinEntrypointRehearsal.errors.map((error) => `thin entrypoint rehearsal: ${error}`);
  const thinEntrypointCutover = publicThinEntrypointRouterCutoverApplicationCheck(root);
  const thinEntrypointCutoverErrors = thinEntrypointCutover.errors.map((error) => `thin entrypoint cutover: ${error}`);
  const routerAdapterDelegation = publicRouterCommandAdapterDelegationExpansionCheck(root);
  const routerAdapterDelegationErrors = routerAdapterDelegation.errors.map((error) => `router adapter delegation: ${error}`);
  const architectureParityErrors = architectureParity.errors.map((error) => `installed architecture parity: ${error}`);
  const errors = [...metadataErrors, ...packErrors, ...messagingErrors, ...sourceLedgerErrors, ...architectureErrors, ...packageSurfaceErrors, ...architectureParityErrors, ...installedAuthorityStateParityErrors, ...targetRepoProductErrors, ...cliRuntimePlanErrors, ...thinCliRouterErrors, ...compatibilityPortErrors, ...coreAdapterErrors, ...packageAdapterErrors, ...architectureAdapterErrors, ...authorityAdapterErrors, ...moduleInclusionPlanErrors, ...packagedRouterPortErrors, ...thinEntrypointRehearsalErrors, ...thinEntrypointCutoverErrors, ...routerAdapterDelegationErrors, ...versionPolicyErrors, ...cleanCompactionErrors, ...cleanCompactionCatalogErrors, ...keywordTaxonomyErrors, ...readmePlanErrors, ...readmeDryRunErrors, ...readmeApplyErrors, ...closedGatePlanErrors, ...closedGateDryRunErrors, ...closedGateApplyErrors, ...closedGateArchiveReaderErrors, ...fullTestRunnerErrors, ...rawArtifactPrunePlanErrors, ...rawArtifactPruneDryRunErrors];
  return {
    schema: 'agent-onboard-public-release-check-result-019',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    package_root: root,
    command: PUBLIC_RELEASE_CONTRACT.command,
    contract_command: PUBLIC_RELEASE_CONTRACT.contract_command,
    source_context: sourceContext(root),
    source_work_items_ledger: sourceLedger,
    validated: {
      package_metadata: metadataErrors.length === 0,
      projected_pack_allowlist: packErrors.length === 0,
      public_artifact_messaging: messagingErrors.length === 0,
      bin_entrypoints_exist: metadataErrors.filter((error) => error.includes('points to missing file')).length === 0,
      source_work_items_ledger: sourceLedger.validated,
      public_architecture_map: architecture.status === 'ok',
      public_command_router: architecture.command_router && architecture.command_router.status === 'ok',
      public_domain_service_facades: architecture.domain_service_facades && architecture.domain_service_facades.status === 'ok',
      public_authority_first_read_index: architecture.authority_first_read_index && architecture.authority_first_read_index.status === 'ok',
      public_target_runtime_namespace: architecture.target_runtime_namespace && architecture.target_runtime_namespace.status === 'ok',
      target_repo_product_surface: targetRepoProduct.status === 'ok',
      target_doctor: targetRepoProduct.validated.target_doctor,
      target_profile: targetRepoProduct.validated.target_profile,
      target_repair_plan: targetRepoProduct.validated.target_repair_plan,
      target_onboarding_plan: targetRepoProduct.validated.target_onboarding_plan,
      target_onboarding_fixture: targetRepoProduct.validated.target_onboarding_fixture,
      historical_source_extraction_release_checks_retired: retiredReleaseChecks.length > 0,
      cli_runtime_de_monolith_planning: cliRuntimePlan.status === 'ok',
      thin_cli_router_seed: thinCliRouter.status === 'ok',
      compatibility_command_port_seed: compatibilityPort.status === 'ok',
      core_command_adapter_extraction: coreAdapter.status === 'ok',
      package_command_adapter_extraction: packageAdapter.status === 'ok',
      architecture_command_adapter_extraction: architectureAdapter.status === 'ok',
      authority_command_adapter_extraction: authorityAdapter.status === 'ok',
      modular_runtime_package_inclusion_plan: moduleInclusionPlan.status === 'ok',
      packaged_router_port_inclusion: packagedRouterPort.status === 'ok',
      thin_entrypoint_router_cutover_rehearsal: thinEntrypointRehearsal.status === 'ok',
      thin_entrypoint_router_cutover_application: thinEntrypointCutover.status === 'ok',
      router_command_adapter_delegation_expansion: routerAdapterDelegation.status === 'ok',
      public_version_reference_policy: versionPolicy.status === 'ok',
      public_package_surface_preservation: packageSurface.status === 'ok',
      public_installed_parity_architecture_smoke: architectureParity.status === 'ok',
      public_installed_authority_state_shard_parity: installedAuthorityStateParity.status === 'ok',
      public_clean_compaction_baseline: cleanCompaction.status === 'ok',
      public_clean_compaction_catalog: cleanCompactionCatalog.status === 'ok',
      public_package_keyword_taxonomy_compaction: keywordTaxonomy.status === 'ok',
      public_readme_first_read_history_split_plan: readmePlan.status === 'ok',
      public_readme_history_archive_split_dry_run: readmeDryRun.status === 'ok',
      public_readme_history_archive_split_apply: readmeApply.status === 'ok',
      public_closed_gate_artifact_compaction_plan: closedGatePlan.status === 'ok',
      public_closed_gate_artifact_compaction_dry_run: closedGateDryRun.status === 'ok',
      public_closed_gate_artifact_compaction_apply: closedGateApply.status === 'ok',
      public_closed_gate_archive_reader: closedGateArchiveReader.status === 'ok',
      public_closed_gate_raw_artifact_prune_planning: rawArtifactPrunePlan.status === 'ok',
      public_closed_gate_raw_artifact_prune_dry_run: rawArtifactPruneDryRun.status === 'ok',
      public_closed_gate_raw_artifact_prune_apply: rawArtifactPruneApply.status === 'ok',
      public_full_test_runner_completion: fullTestRunner.status === 'ok'
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    source_context_files: PUBLIC_RELEASE_CONTRACT.source_context_files.slice(),
    public_architecture: architecture,
    target_repo_product: targetRepoProduct,
    retired_release_checks: retiredReleaseChecks,
    cli_runtime_de_monolith_planning: cliRuntimePlan,
    thin_cli_router_seed: thinCliRouter,
    compatibility_command_port_seed: compatibilityPort,
    core_command_adapter_extraction: coreAdapter,
    package_command_adapter_extraction: packageAdapter,
    architecture_command_adapter_extraction: architectureAdapter,
    authority_command_adapter_extraction: authorityAdapter,
    modular_runtime_package_inclusion_plan: moduleInclusionPlan,
    packaged_router_port_inclusion: packagedRouterPort,
    thin_entrypoint_router_cutover_rehearsal: thinEntrypointRehearsal,
    thin_entrypoint_router_cutover_application: thinEntrypointCutover,
    router_command_adapter_delegation_expansion: routerAdapterDelegation,
    public_version_reference_policy: versionPolicy,
    public_package_surface_preservation: packageSurface,
    public_installed_parity_architecture_smoke: architectureParity,
    public_installed_authority_state_shard_parity: installedAuthorityStateParity,
    public_clean_compaction_baseline: cleanCompaction,
    public_clean_compaction_catalog: cleanCompactionCatalog,
    public_package_keyword_taxonomy_compaction: keywordTaxonomy,
    public_readme_first_read_history_split_plan: readmePlan,
    public_readme_history_archive_split_dry_run: readmeDryRun,
    public_readme_history_archive_split_apply: readmeApply,
    public_closed_gate_artifact_compaction_plan: closedGatePlan,
    public_closed_gate_artifact_compaction_dry_run: closedGateDryRun,
    public_closed_gate_artifact_compaction_apply: closedGateApply,
    public_closed_gate_archive_reader: closedGateArchiveReader,
    public_full_test_runner_completion: fullTestRunner,
    public_closed_gate_raw_artifact_prune_planning: rawArtifactPrunePlan,
    public_closed_gate_raw_artifact_prune_dry_run: rawArtifactPruneDryRun,
    public_closed_gate_raw_artifact_prune_apply: rawArtifactPruneApply,
    local_pre_publish_commands: PUBLIC_RELEASE_CONTRACT.local_pre_publish_commands.slice(),
    post_publish_verification_commands: publicReleasePostPublishCommands(VERSION),
    boundary: {
      writes_files: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_publish_required: false
    },
    errors
  };
}

  return Object.freeze({
    publicReleaseCheck
  });
}

module.exports = Object.freeze({
  createPublicReleaseCheckService
});
