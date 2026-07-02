'use strict';

function createPublicArchitectureAggregateCheckService(deps) {
  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    arrayEquals,
    publicArchitectureMap,
    publicCommandRouterCheck,
    publicDomainServiceFacadesCheck,
    publicAuthorityFirstReadCheck,
    publicTargetRuntimeNamespaceCheck,
    publicSourceDomainModulePartitionPlanCheck,
    publicSourceDomainExtractionRehearsalCheck,
    publicSourceExtractionGoldenOutputFreezeCheck,
    publicSourceModuleExtractionAdapterBoundaryCheck,
    publicSourceModuleExtractionFirstSliceCheck,
    publicSourceModuleExtractionBundleParityCheck,
    publicSourceModuleExtractionRuntimeBridgeCheck,
    publicSourceModuleExtractionInstalledFallbackSmokeCheck,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck,
    publicSourceModuleExtractionAuthorityBundleParityCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicArchitectureM1ClosureM2SeedCheck,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicSourceDomainExtractionStabilizationClosureReviewCheck,
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
    publicRouterCommandAdapterDelegationExpansionCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_ARCHITECTURE_MAP,
    arrayEquals,
    publicArchitectureMap,
    publicCommandRouterCheck,
    publicDomainServiceFacadesCheck,
    publicAuthorityFirstReadCheck,
    publicTargetRuntimeNamespaceCheck,
    publicSourceDomainModulePartitionPlanCheck,
    publicSourceDomainExtractionRehearsalCheck,
    publicSourceExtractionGoldenOutputFreezeCheck,
    publicSourceModuleExtractionAdapterBoundaryCheck,
    publicSourceModuleExtractionFirstSliceCheck,
    publicSourceModuleExtractionBundleParityCheck,
    publicSourceModuleExtractionRuntimeBridgeCheck,
    publicSourceModuleExtractionInstalledFallbackSmokeCheck,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck,
    publicSourceModuleExtractionAuthorityBundleParityCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicArchitectureM1ClosureM2SeedCheck,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicSourceDomainExtractionStabilizationClosureReviewCheck,
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
    publicRouterCommandAdapterDelegationExpansionCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureAggregateCheckService missing dependency: ${name}`);
  }

  function publicArchitectureCheck(root) {
  const map = publicArchitectureMap(root);
  const expectedDomains = ['core', 'authority', 'work_items', 'claims', 'target', 'release_package'];
  const domainIds = map.map.canonical_domains.map((domain) => domain.id);
  const expectedPackFiles = map.map.public_source_shape.expected_pack_files.slice().sort();
  const projectedPackFiles = map.current_runtime.projected_pack_files;
  const router = publicCommandRouterCheck(root);
  const routerErrors = router.errors.map((error) => `command router: ${error}`);
  const facades = publicDomainServiceFacadesCheck(root);
  const facadeErrors = facades.errors.map((error) => `domain service facades: ${error}`);
  const authority = publicAuthorityFirstReadCheck(root);
  const authorityErrors = authority.errors.map((error) => `authority: ${error}`);
  const targetRuntime = publicTargetRuntimeNamespaceCheck(root);
  const targetRuntimeErrors = targetRuntime.errors.map((error) => `target runtime: ${error}`);
  const sourcePartition = publicSourceDomainModulePartitionPlanCheck(root);
  const sourcePartitionErrors = sourcePartition.errors.map((error) => `source partition: ${error}`);
  const sourceExtraction = publicSourceDomainExtractionRehearsalCheck(root);
  const sourceExtractionErrors = sourceExtraction.errors.map((error) => `source extraction: ${error}`);
  const goldenOutputs = publicSourceExtractionGoldenOutputFreezeCheck(root);
  const goldenOutputErrors = goldenOutputs.errors.map((error) => `golden outputs: ${error}`);
  const adapterBoundary = publicSourceModuleExtractionAdapterBoundaryCheck(root);
  const adapterBoundaryErrors = adapterBoundary.errors.map((error) => `adapter boundary: ${error}`);
  const firstSlice = publicSourceModuleExtractionFirstSliceCheck(root);
  const firstSliceErrors = firstSlice.errors.map((error) => `first slice: ${error}`);
  const bundleParity = publicSourceModuleExtractionBundleParityCheck(root);
  const bundleParityErrors = bundleParity.errors.map((error) => `bundle parity: ${error}`);
  const runtimeBridge = publicSourceModuleExtractionRuntimeBridgeCheck(root);
  const runtimeBridgeErrors = runtimeBridge.errors.map((error) => `runtime bridge: ${error}`);
  const installedFallbackSmoke = publicSourceModuleExtractionInstalledFallbackSmokeCheck(root);
  const installedFallbackSmokeErrors = installedFallbackSmoke.errors.map((error) => `installed fallback smoke: ${error}`);
  const secondSlicePlan = publicSourceModuleExtractionSecondSlicePlanCheck(root);
  const secondSlicePlanErrors = secondSlicePlan.errors.map((error) => `second slice plan: ${error}`);
  const secondSliceFirstSlice = publicSourceModuleExtractionSecondSliceFirstSliceCheck(root);
  const secondSliceFirstSliceErrors = secondSliceFirstSlice.errors.map((error) => `second slice first-slice: ${error}`);
  const authorityBundleParity = publicSourceModuleExtractionAuthorityBundleParityCheck(root);
  const authorityBundleParityErrors = authorityBundleParity.errors.map((error) => `authority bundle parity: ${error}`);
  const authorityRuntimeBridge = publicSourceModuleExtractionAuthorityRuntimeBridgeCheck(root);
  const authorityRuntimeBridgeErrors = authorityRuntimeBridge.errors.map((error) => `authority runtime bridge: ${error}`);
  const m2Seed = publicArchitectureM1ClosureM2SeedCheck(root);
  const m2SeedErrors = m2Seed.errors.map((error) => `m2 seed: ${error}`);
  const workItemsPlan = publicWorkItemsDomainSourceExtractionPlanCheck(root);
  const workItemsPlanErrors = workItemsPlan.errors.map((error) => `work-items source extraction plan: ${error}`);
  const workItemsFirstSlice = publicWorkItemsDomainSourceExtractionFirstSliceCheck(root);
  const workItemsFirstSliceErrors = workItemsFirstSlice.errors.map((error) => `work-items first-slice: ${error}`);
  const workItemsBundleParity = publicWorkItemsDomainSourceExtractionBundleParityCheck(root);
  const workItemsBundleParityErrors = workItemsBundleParity.errors.map((error) => `work-items bundle parity: ${error}`);
  const workItemsRuntimeBridge = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root);
  const workItemsRuntimeBridgeErrors = workItemsRuntimeBridge.errors.map((error) => `work-items runtime bridge: ${error}`);
  const workItemsInstalledFallback = publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck(root);
  const workItemsInstalledFallbackErrors = workItemsInstalledFallback.errors.map((error) => `work-items installed fallback smoke: ${error}`);
  const claimsPlan = publicClaimsDomainSourceExtractionPlanCheck(root);
  const claimsPlanErrors = claimsPlan.errors.map((error) => `claims source extraction plan: ${error}`);
  const claimsFirstSlice = publicClaimsDomainSourceExtractionFirstSliceCheck(root);
  const claimsFirstSliceErrors = claimsFirstSlice.errors.map((error) => `claims first-slice: ${error}`);
  const claimsBundleParity = publicClaimsDomainSourceExtractionBundleParityCheck(root);
  const claimsBundleParityErrors = claimsBundleParity.errors.map((error) => `claims bundle parity: ${error}`);
  const claimsRuntimeBridge = publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root);
  const claimsRuntimeBridgeErrors = claimsRuntimeBridge.errors.map((error) => `claims runtime bridge: ${error}`);
  const claimsInstalledFallback = publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck(root);
  const claimsInstalledFallbackErrors = claimsInstalledFallback.errors.map((error) => `claims installed fallback smoke: ${error}`);
  const sourceDomainClosureReview = publicSourceDomainExtractionStabilizationClosureReviewCheck(root);
  const sourceDomainClosureReviewErrors = sourceDomainClosureReview.errors.map((error) => `source-domain closure review: ${error}`);
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
  const errors = [];
  if (!arrayEquals(domainIds, expectedDomains)) errors.push(`architecture domain order must be ${expectedDomains.join(', ')}`);
  if (new Set(domainIds).size !== domainIds.length) errors.push('architecture domain ids must be unique');
  if (map.map.canonical_domains.length !== 6) errors.push('architecture map must declare exactly 6 public domains');
  if (!map.current_runtime.entrypoint_exists) errors.push(`architecture entrypoint is missing: ${map.current_runtime.entrypoint}`);
  if (!arrayEquals(projectedPackFiles, expectedPackFiles)) errors.push(`projected npm pack files must match architecture package boundary ${expectedPackFiles.join(', ')}`);
  if (map.map.package_boundary.architecture_map_command_writes_files !== false) errors.push('architecture map command must remain no-write');
  if (map.map.package_boundary.architecture_check_command_writes_files !== false) errors.push('architecture check command must remain no-write');
  if (map.map.package_boundary.architecture_router_command_writes_files !== false) errors.push('architecture router command must remain no-write');
  if (map.map.package_boundary.architecture_facades_command_writes_files !== false) errors.push('architecture facades command must remain no-write');
  if (map.map.package_boundary.architecture_partition_plan_command_writes_files !== false) errors.push('architecture partition plan command must remain no-write');
  if (map.map.package_boundary.architecture_partition_check_command_writes_files !== false) errors.push('architecture partition check command must remain no-write');
  if (map.map.package_boundary.architecture_extraction_rehearsal_command_writes_files !== false) errors.push('architecture extraction rehearsal command must remain no-write');
  if (map.map.package_boundary.architecture_extraction_check_command_writes_files !== false) errors.push('architecture extraction check command must remain no-write');
  if (map.map.package_boundary.architecture_golden_outputs_command_writes_files !== false) errors.push('architecture golden outputs command must remain no-write');
  if (map.map.package_boundary.architecture_golden_check_command_writes_files !== false) errors.push('architecture golden check command must remain no-write');
  if (map.map.package_boundary.architecture_adapter_boundary_command_writes_files !== false) errors.push('architecture adapter boundary command must remain no-write');
  if (map.map.package_boundary.architecture_adapter_check_command_writes_files !== false) errors.push('architecture adapter check command must remain no-write');
  if (map.map.package_boundary.architecture_first_slice_command_writes_files !== false) errors.push('architecture first slice command must remain no-write');
  if (map.map.package_boundary.architecture_first_slice_check_command_writes_files !== false) errors.push('architecture first slice check command must remain no-write');
  if (map.map.package_boundary.architecture_bundle_parity_command_writes_files !== false) errors.push('architecture bundle parity command must remain no-write');
  if (map.map.package_boundary.architecture_bundle_parity_check_command_writes_files !== false) errors.push('architecture bundle parity check command must remain no-write');
  if (map.map.package_boundary.architecture_runtime_bridge_command_writes_files !== false) errors.push('architecture runtime bridge command must remain no-write');
  if (map.map.package_boundary.architecture_runtime_bridge_check_command_writes_files !== false) errors.push('architecture runtime bridge check command must remain no-write');
  if (map.map.package_boundary.architecture_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture installed fallback smoke command must remain no-write');
  if (map.map.package_boundary.architecture_installed_fallback_check_command_writes_files !== false) errors.push('architecture installed fallback check command must remain no-write');
  if (map.map.package_boundary.architecture_second_slice_plan_command_writes_files !== false) errors.push('architecture second slice plan command must remain no-write');
  if (map.map.package_boundary.architecture_second_slice_check_command_writes_files !== false) errors.push('architecture second slice check command must remain no-write');
  if (map.map.package_boundary.architecture_second_slice_first_slice_command_writes_files !== false) errors.push('architecture second slice first-slice command must remain no-write');
  if (map.map.package_boundary.architecture_second_slice_first_slice_check_command_writes_files !== false) errors.push('architecture second slice first-slice check command must remain no-write');
  if (map.map.package_boundary.architecture_authority_bundle_parity_command_writes_files !== false) errors.push('architecture authority bundle parity command must remain no-write');
  if (map.map.package_boundary.architecture_authority_bundle_parity_check_command_writes_files !== false) errors.push('architecture authority bundle parity check command must remain no-write');
  if (map.map.package_boundary.architecture_authority_runtime_bridge_command_writes_files !== false) errors.push('architecture authority runtime bridge command must remain no-write');
  if (map.map.package_boundary.architecture_authority_runtime_bridge_check_command_writes_files !== false) errors.push('architecture authority runtime bridge check command must remain no-write');
  if (map.map.package_boundary.architecture_m2_seed_command_writes_files !== false) errors.push('architecture m2 seed command must remain no-write');
  if (map.map.package_boundary.architecture_m2_seed_check_command_writes_files !== false) errors.push('architecture m2 seed check command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_plan_command_writes_files !== false) errors.push('architecture work-items plan command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_check_command_writes_files !== false) errors.push('architecture work-items check command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_first_slice_command_writes_files !== false) errors.push('architecture work-items first-slice command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_first_slice_check_command_writes_files !== false) errors.push('architecture work-items first-slice check command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_bundle_parity_command_writes_files !== false) errors.push('architecture work-items bundle parity command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_bundle_parity_check_command_writes_files !== false) errors.push('architecture work-items bundle parity check command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_runtime_bridge_command_writes_files !== false) errors.push('architecture work-items runtime bridge command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_runtime_bridge_check_command_writes_files !== false) errors.push('architecture work-items runtime bridge check command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture work-items installed fallback smoke command must remain no-write');
  if (map.map.package_boundary.architecture_work_items_installed_fallback_check_command_writes_files !== false) errors.push('architecture work-items installed fallback check command must remain no-write');
  if (map.map.package_boundary.architecture_claims_plan_command_writes_files !== false) errors.push('architecture claims plan command must remain no-write');
  if (map.map.package_boundary.architecture_claims_check_command_writes_files !== false) errors.push('architecture claims check command must remain no-write');
  if (map.map.package_boundary.architecture_claims_first_slice_command_writes_files !== false) errors.push('architecture claims first-slice command must remain no-write');
  if (map.map.package_boundary.architecture_claims_first_slice_check_command_writes_files !== false) errors.push('architecture claims first-slice check command must remain no-write');
  if (map.map.package_boundary.architecture_claims_bundle_parity_command_writes_files !== false) errors.push('architecture claims bundle parity command must remain no-write');
  if (map.map.package_boundary.architecture_claims_bundle_parity_check_command_writes_files !== false) errors.push('architecture claims bundle parity check command must remain no-write');
  if (map.map.package_boundary.architecture_claims_runtime_bridge_command_writes_files !== false) errors.push('architecture claims runtime bridge command must remain no-write');
  if (map.map.package_boundary.architecture_claims_runtime_bridge_check_command_writes_files !== false) errors.push('architecture claims runtime bridge check command must remain no-write');
  if (map.map.package_boundary.architecture_claims_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture claims installed fallback smoke command must remain no-write');
  if (map.map.package_boundary.architecture_claims_installed_fallback_check_command_writes_files !== false) errors.push('architecture claims installed fallback check command must remain no-write');
  if (map.map.package_boundary.architecture_source_domain_closure_review_command_writes_files !== false) errors.push('architecture source-domain closure review command must remain no-write');
  if (map.map.package_boundary.architecture_source_domain_closure_check_command_writes_files !== false) errors.push('architecture source-domain closure check command must remain no-write');
  if (map.map.package_boundary.architecture_cli_runtime_plan_command_writes_files !== false) errors.push('architecture CLI runtime plan command must remain no-write');
  if (map.map.package_boundary.architecture_cli_runtime_check_command_writes_files !== false) errors.push('architecture CLI runtime check command must remain no-write');
  if (map.map.package_boundary.architecture_thin_router_command_writes_files !== false) errors.push('architecture thin router command must remain no-write');
  if (map.map.package_boundary.architecture_thin_router_check_command_writes_files !== false) errors.push('architecture thin router check command must remain no-write');
  if (map.map.package_boundary.architecture_compatibility_port_command_writes_files !== false) errors.push('architecture compatibility port command must remain no-write');
  if (map.map.package_boundary.architecture_compatibility_port_check_command_writes_files !== false) errors.push('architecture compatibility port check command must remain no-write');
  if (map.map.package_boundary.architecture_core_adapter_command_writes_files !== false) errors.push('architecture core adapter command must remain no-write');
  if (map.map.package_boundary.architecture_core_adapter_check_command_writes_files !== false) errors.push('architecture core adapter check command must remain no-write');
  if (map.map.package_boundary.architecture_package_adapter_command_writes_files !== false) errors.push('architecture package adapter command must remain no-write');
  if (map.map.package_boundary.architecture_package_adapter_check_command_writes_files !== false) errors.push('architecture package adapter check command must remain no-write');
  if (map.map.package_boundary.architecture_architecture_adapter_command_writes_files !== false) errors.push('architecture architecture adapter command must remain no-write');
  if (map.map.package_boundary.architecture_architecture_adapter_check_command_writes_files !== false) errors.push('architecture architecture adapter check command must remain no-write');
  if (map.map.package_boundary.architecture_authority_adapter_command_writes_files !== false) errors.push('architecture authority adapter command must remain no-write');
  if (map.map.package_boundary.architecture_authority_adapter_check_command_writes_files !== false) errors.push('architecture authority adapter check command must remain no-write');
  if (map.map.package_boundary.architecture_module_inclusion_plan_command_writes_files !== false) errors.push('architecture module inclusion plan command must remain no-write');
  if (map.map.package_boundary.architecture_module_inclusion_check_command_writes_files !== false) errors.push('architecture module inclusion check command must remain no-write');
  if (map.map.package_boundary.architecture_router_adapter_delegation_command_writes_files !== false) errors.push('architecture router adapter delegation command must remain no-write');
  if (map.map.package_boundary.architecture_router_adapter_delegation_check_command_writes_files !== false) errors.push('architecture router adapter delegation check command must remain no-write');
  if (map.map.package_boundary.version_sprawl_check_command_writes_files !== false) errors.push('version sprawl check command must remain no-write');
  if (map.map.package_boundary.authority_first_read_command_writes_files !== false) errors.push('authority first-read command must remain no-write');
  if (map.map.package_boundary.authority_check_command_writes_files !== false) errors.push('authority check command must remain no-write');
  if (map.map.package_boundary.target_runtime_namespace_command_writes_files !== false) errors.push('target runtime namespace command must remain no-write');
  if (map.map.package_boundary.target_runtime_check_command_writes_files !== false) errors.push('target runtime check command must remain no-write');
  errors.push(...routerErrors, ...facadeErrors, ...authorityErrors, ...targetRuntimeErrors, ...sourcePartitionErrors, ...sourceExtractionErrors, ...goldenOutputErrors, ...adapterBoundaryErrors, ...firstSliceErrors, ...bundleParityErrors, ...runtimeBridgeErrors, ...installedFallbackSmokeErrors, ...secondSlicePlanErrors, ...secondSliceFirstSliceErrors, ...authorityBundleParityErrors, ...authorityRuntimeBridgeErrors, ...m2SeedErrors, ...workItemsPlanErrors, ...workItemsFirstSliceErrors, ...workItemsBundleParityErrors, ...workItemsRuntimeBridgeErrors, ...workItemsInstalledFallbackErrors, ...claimsPlanErrors, ...claimsFirstSliceErrors, ...claimsBundleParityErrors, ...claimsRuntimeBridgeErrors, ...claimsInstalledFallbackErrors, ...sourceDomainClosureReviewErrors, ...cliRuntimePlanErrors, ...thinCliRouterErrors, ...compatibilityPortErrors, ...coreAdapterErrors, ...packageAdapterErrors, ...architectureAdapterErrors, ...authorityAdapterErrors, ...moduleInclusionPlanErrors, ...packagedRouterPortErrors, ...thinEntrypointRehearsalErrors, ...thinEntrypointCutoverErrors, ...routerAdapterDelegationErrors);
  return {
    schema: 'agent-onboard-public-architecture-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_ARCHITECTURE_MAP.package_name,
    version: VERSION,
    release_line: PUBLIC_ARCHITECTURE_MAP.release_line,
    command: PUBLIC_ARCHITECTURE_MAP.check_command,
    package_root: root,
    validated: {
      domain_count: map.map.canonical_domains.length === 6,
      domain_order: arrayEquals(domainIds, expectedDomains),
      domain_ids_unique: new Set(domainIds).size === domainIds.length,
      runtime_entrypoint_present: map.current_runtime.entrypoint_exists,
      compact_package_boundary: arrayEquals(projectedPackFiles, expectedPackFiles),
      architecture_commands_no_write: map.map.package_boundary.architecture_map_command_writes_files === false && map.map.package_boundary.architecture_check_command_writes_files === false && map.map.package_boundary.architecture_router_command_writes_files === false && map.map.package_boundary.architecture_facades_command_writes_files === false && map.map.package_boundary.architecture_partition_plan_command_writes_files === false && map.map.package_boundary.architecture_partition_check_command_writes_files === false && map.map.package_boundary.architecture_extraction_rehearsal_command_writes_files === false && map.map.package_boundary.architecture_extraction_check_command_writes_files === false && map.map.package_boundary.architecture_golden_outputs_command_writes_files === false && map.map.package_boundary.architecture_golden_check_command_writes_files === false && map.map.package_boundary.architecture_adapter_boundary_command_writes_files === false && map.map.package_boundary.architecture_adapter_check_command_writes_files === false && map.map.package_boundary.architecture_first_slice_command_writes_files === false && map.map.package_boundary.architecture_first_slice_check_command_writes_files === false && map.map.package_boundary.architecture_bundle_parity_command_writes_files === false && map.map.package_boundary.architecture_bundle_parity_check_command_writes_files === false && map.map.package_boundary.architecture_runtime_bridge_command_writes_files === false && map.map.package_boundary.architecture_runtime_bridge_check_command_writes_files === false && map.map.package_boundary.architecture_installed_fallback_smoke_command_writes_files === false && map.map.package_boundary.architecture_installed_fallback_check_command_writes_files === false && map.map.package_boundary.architecture_second_slice_plan_command_writes_files === false && map.map.package_boundary.architecture_second_slice_check_command_writes_files === false && map.map.package_boundary.architecture_second_slice_first_slice_command_writes_files === false && map.map.package_boundary.architecture_second_slice_first_slice_check_command_writes_files === false && map.map.package_boundary.architecture_authority_bundle_parity_command_writes_files === false && map.map.package_boundary.architecture_authority_bundle_parity_check_command_writes_files === false && map.map.package_boundary.architecture_authority_runtime_bridge_command_writes_files === false && map.map.package_boundary.architecture_authority_runtime_bridge_check_command_writes_files === false && map.map.package_boundary.architecture_m2_seed_command_writes_files === false && map.map.package_boundary.architecture_m2_seed_check_command_writes_files === false && map.map.package_boundary.architecture_work_items_plan_command_writes_files === false && map.map.package_boundary.architecture_work_items_check_command_writes_files === false && map.map.package_boundary.architecture_work_items_first_slice_command_writes_files === false && map.map.package_boundary.architecture_work_items_first_slice_check_command_writes_files === false && map.map.package_boundary.architecture_work_items_bundle_parity_command_writes_files === false && map.map.package_boundary.architecture_work_items_bundle_parity_check_command_writes_files === false && map.map.package_boundary.architecture_work_items_runtime_bridge_command_writes_files === false && map.map.package_boundary.architecture_work_items_runtime_bridge_check_command_writes_files === false && map.map.package_boundary.architecture_work_items_installed_fallback_smoke_command_writes_files === false && map.map.package_boundary.architecture_work_items_installed_fallback_check_command_writes_files === false && map.map.package_boundary.architecture_claims_plan_command_writes_files === false && map.map.package_boundary.architecture_claims_check_command_writes_files === false && map.map.package_boundary.architecture_claims_first_slice_command_writes_files === false && map.map.package_boundary.architecture_claims_first_slice_check_command_writes_files === false && map.map.package_boundary.architecture_claims_bundle_parity_command_writes_files === false && map.map.package_boundary.architecture_claims_bundle_parity_check_command_writes_files === false && map.map.package_boundary.architecture_claims_runtime_bridge_command_writes_files === false && map.map.package_boundary.architecture_claims_runtime_bridge_check_command_writes_files === false && map.map.package_boundary.architecture_claims_installed_fallback_smoke_command_writes_files === false && map.map.package_boundary.architecture_claims_installed_fallback_check_command_writes_files === false && map.map.package_boundary.architecture_core_adapter_command_writes_files === false && map.map.package_boundary.architecture_core_adapter_check_command_writes_files === false && map.map.package_boundary.architecture_package_adapter_command_writes_files === false && map.map.package_boundary.architecture_package_adapter_check_command_writes_files === false && map.map.package_boundary.architecture_architecture_adapter_command_writes_files === false && map.map.package_boundary.architecture_architecture_adapter_check_command_writes_files === false && map.map.package_boundary.architecture_authority_adapter_command_writes_files === false && map.map.package_boundary.architecture_authority_adapter_check_command_writes_files === false && map.map.package_boundary.architecture_module_inclusion_plan_command_writes_files === false && map.map.package_boundary.architecture_module_inclusion_check_command_writes_files === false && map.map.package_boundary.version_sprawl_check_command_writes_files === false && map.map.package_boundary.authority_first_read_command_writes_files === false && map.map.package_boundary.authority_check_command_writes_files === false,
      command_router_boundary: router.status === 'ok',
      domain_service_facades: facades.status === 'ok',
      authority_first_read_index: authority.status === 'ok',
      target_runtime_namespace: targetRuntime.status === 'ok',
      source_domain_module_partition_plan: sourcePartition.status === 'ok',
      source_domain_extraction_rehearsal: sourceExtraction.status === 'ok',
      source_extraction_golden_output_freeze: goldenOutputs.status === 'ok',
      source_module_extraction_adapter_boundary: adapterBoundary.status === 'ok',
      source_module_extraction_first_slice: firstSlice.status === 'ok',
      source_module_extraction_bundle_parity: bundleParity.status === 'ok',
      source_module_extraction_runtime_bridge: runtimeBridge.status === 'ok',
      source_module_extraction_installed_fallback_smoke: installedFallbackSmoke.status === 'ok',
      source_module_extraction_second_slice_plan: secondSlicePlan.status === 'ok',
      source_module_extraction_second_slice_first_slice: secondSliceFirstSlice.status === 'ok',
      source_module_extraction_authority_bundle_parity: authorityBundleParity.status === 'ok',
      source_module_extraction_authority_runtime_bridge: authorityRuntimeBridge.status === 'ok',
      architecture_m1_closure_m2_seed: m2Seed.status === 'ok',
      work_items_domain_source_extraction_plan: workItemsPlan.status === 'ok',
      work_items_domain_source_extraction_first_slice: workItemsFirstSlice.status === 'ok',
      work_items_domain_source_extraction_bundle_parity: workItemsBundleParity.status === 'ok',
      work_items_domain_source_extraction_runtime_bridge: workItemsRuntimeBridge.status === 'ok',
      work_items_domain_source_extraction_installed_fallback_smoke: workItemsInstalledFallback.status === 'ok',
      claims_domain_source_extraction_plan: claimsPlan.status === 'ok',
      claims_domain_source_extraction_first_slice: claimsFirstSlice.status === 'ok',
      claims_domain_source_extraction_bundle_parity: claimsBundleParity.status === 'ok',
      claims_domain_source_extraction_runtime_bridge: claimsRuntimeBridge.status === 'ok',
      claims_domain_source_extraction_installed_fallback_smoke: claimsInstalledFallback.status === 'ok',
      source_domain_extraction_stabilization_closure_review: sourceDomainClosureReview.status === 'ok',
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
      router_command_adapter_delegation_expansion: routerAdapterDelegation.status === 'ok'
    },
    domain_ids: domainIds,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    command_router: router,
    domain_service_facades: facades,
    authority_first_read_index: authority,
    target_runtime_namespace: targetRuntime,
    source_domain_module_partition_plan: sourcePartition,
    source_domain_extraction_rehearsal: sourceExtraction,
    source_extraction_golden_output_freeze: goldenOutputs,
    source_module_extraction_adapter_boundary: adapterBoundary,
    source_module_extraction_first_slice: firstSlice,
    source_module_extraction_bundle_parity: bundleParity,
    source_module_extraction_runtime_bridge: runtimeBridge,
    source_module_extraction_installed_fallback_smoke: installedFallbackSmoke,
    source_module_extraction_second_slice_plan: secondSlicePlan,
    source_module_extraction_second_slice_first_slice: secondSliceFirstSlice,
    source_module_extraction_authority_bundle_parity: authorityBundleParity,
    source_module_extraction_authority_runtime_bridge: authorityRuntimeBridge,
    public_architecture_m1_closure_m2_seed: m2Seed,
    work_items_domain_source_extraction_plan: workItemsPlan,
    work_items_domain_source_extraction_first_slice: workItemsFirstSlice,
    work_items_domain_source_extraction_bundle_parity: workItemsBundleParity,
    work_items_domain_source_extraction_runtime_bridge: workItemsRuntimeBridge,
    work_items_domain_source_extraction_installed_fallback_smoke: workItemsInstalledFallback,
    claims_domain_source_extraction_plan: claimsPlan,
    claims_domain_source_extraction_first_slice: claimsFirstSlice,
    claims_domain_source_extraction_bundle_parity: claimsBundleParity,
    claims_domain_source_extraction_runtime_bridge: claimsRuntimeBridge,
    claims_domain_source_extraction_installed_fallback_smoke: claimsInstalledFallback,
    source_domain_extraction_stabilization_closure_review: sourceDomainClosureReview,
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
    boundary: map.boundary,
    errors
  };
}

  return Object.freeze({
    publicArchitectureCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureAggregateCheckService
});
