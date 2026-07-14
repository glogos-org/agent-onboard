'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { route: routeCommand } = require('./command-router');
const { createRuntimeCompatibilityPortFromRegistry } = require('./runtime-command-registry');
const { createRuntimeSharedContextService } = require('./runtime-shared-context-service');
const { createPublicRuntimeGuardService } = require('./domains/authority/services/public-runtime-guard-service');
const {
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  contributorAdmissionService,
  ciSurfaceService
} = require('./domains/core/services/public-runtime-surface-service');
const { createPublicRuntimeReleaseCommandService } = require('./domains/package/services/public-runtime-release-service');
const { createPublicReleaseCheckService } = require('./domains/package/services/public-release-check-service');
const { createPublicContractsCommandService } = require('./domains/package/services/public-contracts-command-service');
const { createPackageSurfaceService } = require('./domains/package/services/package-surface-service');
const { createPublicFullTestRunnerService } = require('./domains/package/services/full-test-runner-service');
const { createPublicExactArtifactOracleService } = require('./domains/package/services/exact-artifact-oracle-service');
const { createPublicTargetOnboardingAcceptanceService } = require('./domains/package/services/target-onboarding-acceptance-service');
const { createPublicReleaseCleanClosedGatesRuntimeSliceService } = require('./domains/package/services/release-clean-closed-gates-runtime-slice-service');
const { createPublicRuntimeCheckFastService } = require('./domains/core/services/public-runtime-check-fast-service');
const { createPublicRuntimeMcpBridgeService } = require('./domains/core/services/public-runtime-mcp-bridge-service');
const { createPublicCoreSurfaceCommandRunnerService } = require('./domains/core/services/public-core-surface-command-runner-service');
const { createPublicRuntimeAgentsBridgeService } = require('./domains/authority/services/public-runtime-agents-bridge-service');
const {
  OUTPUT_FLAG,
  PACKAGE_NAME,
  PRODUCT_HELP_LINES,
  PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES,
  PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  RELEASE_LINE,
  ROUTER_COMMAND_ORDER,
  RUNTIME_COMMAND_GROUP,
  RUNTIME_CONTRACTS,
  TARGET_COMMAND,
  TARGET_CONFIG_FILE,
  TARGET_DOCTOR_COMMAND,
  TARGET_GOVERNANCE_COMMAND,
  TARGET_HANDOFF_COMMAND,
  TARGET_INVENTORY_COMMAND,
  TARGET_METADATA_COMMAND,
  TARGET_MANIFEST_COMMAND,
  TARGET_MEMORY_COMMAND,
  TARGET_PROFILE_COMMAND,
  TARGET_WORK_ITEMS_COMMAND,
  TARGET_REPAIR_COMMAND,
  TOP_LEVEL_COMMAND,
  TOP_LEVEL_COMMAND_ALIAS
} = require('./runtime-contracts');
const VERSION = require('../../package.json').version;

process.stdout.on('error', (error) => {
  if (error && error.code === 'EPIPE') process.exit(0);
  throw error;
});

const { createPublicArchitectureCatalog } = require('./domains/architecture/static-catalog');
const { createPublicTargetStaticCatalog } = require('./domains/target/static-catalog');
const { createPublicArchitectureCompositionService } = require('./domains/architecture/services/runtime/public-architecture-composition-service');
const { createPublicCliRuntimePlanningService } = require('./domains/architecture/services/runtime/public-cli-runtime-planning-service');
const { createTargetRuntimeService } = require('./domains/target/services/target-service');
const { createTargetCommandRunnerService } = require('./domains/target/services/target-command-runner-service');

const { TARGET_CONFIG_SCHEMA, BOUNDARY_GUARD_CONTRACT } = require('./domains/target/static-catalog');
const { WORK_ITEMS_SCHEMA } = require('./domains/work-items/static-catalog');
const {
  PUBLIC_ARCHITECTURE_MAP,
  PUBLIC_COMMAND_ROUTER,
  PUBLIC_DOMAIN_SERVICE_FACADES,
  PUBLIC_AUTHORITY_FIRST_READ_INDEX,
  PUBLIC_TARGET_RUNTIME_NAMESPACE,
  PUBLIC_PACKAGE_SURFACE_PRESERVATION,
  PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
  PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
  PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
  PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
  PUBLIC_VERSION_REFERENCE_POLICY,
  PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
  PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
  PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
  PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
  PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
  PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
  PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
  PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
  PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
  PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
  PUBLIC_THIN_CLI_ROUTER_SEED,
  PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED,
  PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
  PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
  PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_RELEASE_FIXTURE_MATRIX
} = createPublicArchitectureCatalog({
  releaseLine: RELEASE_LINE,
  publicPackagedRouterPortPackFiles: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  publicPackagedRouterPortModuleFiles: PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES
});

const {
  TARGET_ONBOARDING_SURFACE_PLAN,
  TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX
} = createPublicTargetStaticCatalog({
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT
});


let targetRuntimeService;
const runtimeSharedContextService = createRuntimeSharedContextService({
  fs,
  path,
  runtimeDir: __dirname,
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  readJson: (...args) => readJson(...args),
  getPathValue: (...args) => targetRuntimeService.getPathValue(...args),
  validateWorkItems: (...args) => targetRuntimeService.validateWorkItems(...args),
  workItemCounts: (...args) => targetRuntimeService.workItemCounts(...args)
});
const {
  listRelativeFiles,
  packageRoot,
  arrayEquals,
  publicReleasePostPublishCommands,
  packageJsonReleaseErrors,
  packageJsonProjectedPackFiles,
  publicArtifactMessagingErrors,
  sourceWorkItemsLedgerCheck,
  sourceContext
} = runtimeSharedContextService;

targetRuntimeService = createTargetRuntimeService({
  version: VERSION,
  releaseLine: RELEASE_LINE,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
  publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
  targetOnboardingSurfacePlanContract: TARGET_ONBOARDING_SURFACE_PLAN,
  targetOnboardingDryRunFixtureMatrix: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
  targetConfigFile: TARGET_CONFIG_FILE,
  targetConfigSchema: TARGET_CONFIG_SCHEMA,
  workItemsSchema: WORK_ITEMS_SCHEMA,
  boundaryGuardContract: BOUNDARY_GUARD_CONTRACT,
  packageRoot,
  sourceContext,
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  arrayEquals
});
const mcpBridgePlanService = createPublicRuntimeMcpBridgeService({
  PACKAGE_NAME,
  VERSION,
  RELEASE_LINE,
  OUTPUT_FLAG,
  json: (value) => process.stdout.write(JSON.stringify(value, null, 2) + '\n'),
  writeText: (value) => process.stdout.write(value)
});
const runMcp = (args = []) => mcpBridgePlanService.run(args);

const {
  json,
  readJson,
  stableJson,
  writeJson,
  isPlainObject,
  validateJsonSchema,
  validateTargetConfig,
  validateWorkItems,
  workItemCounts,
  parseOption,
  parseRepeatedOption,
  cloneJson,
  uniqueIdErrors,
  validateWorkItemsGraph,
  validateWorkItemsDocument,
  deriveWorkItemIds,
  appendWorkItemDryRun,
  participationLifecycleNextSteps,
  claimWorkItemDryRun,
  handoffEvidenceChecklist,
  closeWorkItemDryRun,
  getPathValue,
  evaluateTargetBoundaryConfig,
  noMutationBoundary,
  guardResultBase,
  targetOnboardingDryRunFixture,
  targetOnboardingRealTargetTrial,
  publicTargetOnboardingRealTargetRepoTrial,
  targetOnboardingSurfacePlan,
  targetDoctor,
  metadataPlan,
  metadataCheck,
  metadataWrite,
  checkTargetManifestDrift,
  initTargetManifest,
  refreshTargetManifest,
  targetRepair,
  targetProfile,
  targetInventory,
  formatTargetInventoryText,
  targetWorkItemsPreview,
  formatTargetWorkItemsPreviewText,
  targetGovernancePreview,
  formatTargetGovernancePreviewText,
  targetGovernanceBudgetContract,
  formatTargetGovernanceBudgetContractText,
  targetGovernanceBudgetCheck,
  formatTargetGovernanceBudgetCheckText,
  targetGovernanceIndexMaterializationDryRun,
  formatTargetGovernanceIndexMaterializationDryRunText,
  targetGovernanceIndexMaterializationWrite,
  formatTargetGovernanceIndexMaterializationWriteText,
  targetGovernanceIndexDriftCheck,
  formatTargetGovernanceIndexDriftCheckText,
  targetGovernanceIndexRefreshAfterMutation,
  targetHandoffPreview,
  formatTargetHandoffPreviewText,
  agentsMdTemplate,
  firstReadOrder,
  llmsTxtTemplate,
  authorityPathTemplate,
  targetName,
  targetConfigTemplate,
  targetRuntimeNamespaceTemplate,
  runtimeProjectTemplate,
  workItemsTemplate,
  initWriteSet,
  targetOnboardingWriteSet,
  planTargetOnboardingWritesForRoot,
  planTargetOnboardingWrites,
  performTargetOnboardingWrites,
  planWritesForRoot,
  planWrites,
  performPlannedWrites,
  planTextWritesForRoot,
  planTextWrites,
  performPlannedTextWrites,
  summarizePlan
} = targetRuntimeService;

const publicContractsService = createPublicContractsCommandService({
  VERSION,
  RELEASE_LINE,
  readJson,
  json,
  targetRuntimeService,
  cwd: () => process.cwd()
});
const publicContractsCatalog = (...args) => publicContractsService.catalog(...args);
const publicContractsCheck = (...args) => publicContractsService.check(...args);
const runContracts = (args = []) => publicContractsService.runContracts(args);

const publicCliRuntimePlanningService = createPublicCliRuntimePlanningService({
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
  packageRoot,
  readJson,
  sourceContext,
  packageJsonProjectedPackFiles,
  arrayEquals
});
const publicCliRuntimeDeMonolithPlanning = (...args) => publicCliRuntimePlanningService.plan(...args);
const publicCliRuntimeDeMonolithPlanningCheck = (...args) => publicCliRuntimePlanningService.check(...args);

const packageSurfaceService = createPackageSurfaceService({
  version: VERSION,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  publicPackageSurfacePreservation: PUBLIC_PACKAGE_SURFACE_PRESERVATION,
  packageRoot,
  readJson,
  packageJsonProjectedPackFiles,
  sourceContext,
  publicArtifactMessagingErrors,
  arrayEquals
});
const publicPackageSurface = packageSurfaceService.surface;
const publicPackageSurfaceCheck = packageSurfaceService.surfaceCheck;
const publicPackageSourceManifest = packageSurfaceService.sourceManifest;
const publicPackageSourceManifestCheck = packageSurfaceService.sourceManifestCheck;


const publicExactArtifactOracleService = createPublicExactArtifactOracleService({
  PACKAGE_NAME,
  VERSION,
  RELEASE_LINE,
  PUBLIC_RELEASE_CONTRACT,
  sourceContext,
  readJson,
  arrayEquals,
  packageRoot
});
const publicExactArtifactOracle = publicExactArtifactOracleService.publicExactArtifactOracle;


const architectureCompositionService = createPublicArchitectureCompositionService({ VERSION, PUBLIC_ARCHITECTURE_MAP, PUBLIC_COMMAND_ROUTER, PUBLIC_DOMAIN_SERVICE_FACADES, PUBLIC_AUTHORITY_FIRST_READ_INDEX, PUBLIC_TARGET_RUNTIME_NAMESPACE, PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN, PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL, PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE, PUBLIC_VERSION_REFERENCE_POLICY, PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY, PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE, PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY, PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE, PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE, PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW, PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING, PUBLIC_THIN_CLI_ROUTER_SEED, PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED, PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION, PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION, PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION, PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION, PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN, PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION, PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL, PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION, PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION, PUBLIC_RELEASE_CONTRACT, TARGET_ONBOARDING_SURFACE_PLAN, packageRoot, sourceContext, commandSurfaceService, operatorGuideService, quickstartService, discoveryService, createDryRunService, arrayEquals, readJson, packageJsonProjectedPackFiles, firstReadOrder, llmsTxtTemplate, authorityPathTemplate, targetRuntimeNamespaceTemplate, targetOnboardingWriteSet, publicPackageSurfaceCheck, publicCliRuntimeDeMonolithPlanning, publicCliRuntimeDeMonolithPlanningCheck, routeCommand, createRuntimeCompatibilityPort, json });
const { publicArchitectureMap, bundledAuthorityDomainForParity, publicSourceModuleExtractionAuthorityBundleParityCheck, publicCommandRouter, publicCommandRouterCheck, publicDomainServiceFacades, publicDomainServiceFacadesCheck, publicSourceDomainModulePartitionPlan, plainClone, publicSourceDomainModulePartitionPlanCheck, publicAuthorityFirstRead, publicAuthorityFirstReadCheck, publicAuthorityCompactIndexResult, publicAuthorityCompactIndexCheck, publicAuthorityStateShardingSeed, publicAuthorityStateShardingSeedCheck, publicTargetRuntimeNamespace, publicTargetRuntimeNamespaceCheck, publicSourceDomainExtractionRehearsal, publicSourceDomainExtractionRehearsalCheck, publicSourceExtractionGoldenOutputs, scanCurrentVersionLiterals, publicVersionReferencePolicyCheck, publicSourceExtractionGoldenOutputFreezeCheck, publicSourceModuleExtractionAdapterBoundary, publicSourceModuleExtractionAdapterBoundaryCheck, loadCoreFirstSliceModule, publicSourceModuleExtractionFirstSlice, publicSourceModuleExtractionFirstSliceCheck, bundledCoreDomainForParity, publicSourceModuleExtractionBundleParity, publicSourceModuleExtractionBundleParityCheck, resolveCoreDomainRuntimeBridge, publicSourceModuleExtractionRuntimeBridge, publicSourceModuleExtractionRuntimeBridgeCheck, resolveAuthorityDomainRuntimeBridge, publicSourceModuleExtractionAuthorityRuntimeBridge, publicSourceModuleExtractionAuthorityRuntimeBridgeCheck, publicArchitectureM1ClosureM2Seed, workItemIdFromComponents, workItemIdsFromComponentList, publicArchitectureM1ClosureM2SeedCheck, publicSourceModuleExtractionInstalledFallbackSmoke, publicSourceModuleExtractionInstalledFallbackSmokeCheck, gitignoreSecondSlicePolicy, publicSourceModuleExtractionSecondSlicePlan, publicSourceModuleExtractionSecondSlicePlanCheck, loadAuthoritySecondSliceModule, publicSourceModuleExtractionSecondSliceFirstSlice, publicSourceModuleExtractionSecondSliceFirstSliceCheck, publicSourceModuleExtractionAuthorityBundleParity, publicWorkItemsDomainSourceExtractionPlan, publicWorkItemsDomainSourceExtractionPlanCheck, loadWorkItemsFirstSliceModule, publicWorkItemsDomainSourceExtractionFirstSlice, publicWorkItemsDomainSourceExtractionFirstSliceCheck, bundledWorkItemsDomainForParity, publicWorkItemsDomainSourceExtractionBundleParity, publicWorkItemsDomainSourceExtractionBundleParityCheck, resolveWorkItemsDomainRuntimeBridge, publicWorkItemsDomainSourceExtractionRuntimeBridge, publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck, publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke, publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck, publicClaimsDomainSourceExtractionPlan, publicClaimsDomainSourceExtractionPlanCheck, loadClaimsFirstSliceModule, publicClaimsDomainSourceExtractionFirstSlice, publicClaimsDomainSourceExtractionFirstSliceCheck, bundledClaimsDomainForParity, publicClaimsDomainSourceExtractionBundleParity, publicClaimsDomainSourceExtractionBundleParityCheck, resolveClaimsDomainRuntimeBridge, publicClaimsDomainSourceExtractionRuntimeBridge, publicClaimsDomainSourceExtractionRuntimeBridgeCheck, publicClaimsDomainSourceExtractionInstalledFallbackSmoke, publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck, publicSourceDomainExtractionStabilizationClosureReview, publicSourceDomainExtractionStabilizationClosureReviewCheck, publicThinCliRouterSeed, publicThinCliRouterSeedCheck, publicCompatibilityCommandPortSeed, publicCompatibilityCommandPortSeedCheck, publicCoreCommandAdapterExtraction, publicCoreCommandAdapterExtractionCheck, publicPackageCommandAdapterExtraction, publicPackageCommandAdapterExtractionCheck, publicArchitectureCommandAdapterExtraction, publicArchitectureCommandAdapterExtractionCheck, publicAuthorityCommandAdapterExtraction, publicAuthorityCommandAdapterExtractionCheck, publicModularRuntimePackageInclusionPlan, publicModularRuntimePackageInclusionPlanCheck, publicPackagedRouterPortInclusion, publicPackagedRouterPortInclusionCheck, publicThinEntrypointRouterCutoverRehearsal, publicThinEntrypointRouterCutoverRehearsalCheck, publicThinEntrypointRouterCutoverApplication, publicThinEntrypointRouterCutoverApplicationCheck, publicRouterCommandAdapterDelegationExpansion, publicRouterCommandAdapterDelegationExpansionCheck, publicArchitectureCheck, runArchitecture } = architectureCompositionService;

const targetCommandRunnerService = createTargetCommandRunnerService({
  version: VERSION,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  targetOnboardingSurfacePlanContract: TARGET_ONBOARDING_SURFACE_PLAN,
  targetConfigSchema: TARGET_CONFIG_SCHEMA,
  targetRuntimeService,
  publicTargetRuntimeNamespace,
  publicTargetRuntimeNamespaceCheck,
  json,
  writeText: (value) => process.stdout.write(value)
});

const publicReleaseCleanClosedGatesRuntimeSliceService = createPublicReleaseCleanClosedGatesRuntimeSliceService({
  PACKAGE_NAME,
  RELEASE_LINE,
  VERSION,
  packageRoot,
  readJson,
  sourceContext,
  publicFullTestRunnerCompletionCheck: (...args) => publicFullTestRunnerCompletionCheck(...args),
  packageJsonProjectedPackFiles
});
const {
  PUBLIC_CLEAN_COMPACTION_BASELINE,
  PUBLIC_CLEAN_COMPACTION_CATALOG,
  PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION,
  PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN,
  PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN,
  PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY,
  PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN,
  PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN,
  PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY,
  PUBLIC_CLOSED_GATE_ARCHIVE_READER,
  PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING,
  PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN,
  PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY,
  publicCleanCompactionBaseline,
  publicCleanCompactionBaselineCheck,
  publicCleanCompactionBaselineText,
  publicCleanCompactionCatalog,
  publicCleanCompactionCatalogCheck,
  publicCleanCompactionCatalogText,
  publicPackageKeywordTaxonomyCompaction,
  publicPackageKeywordTaxonomyCompactionCheck,
  publicPackageKeywordTaxonomyCompactionText,
  publicReadmeFirstReadHistorySplitPlan,
  publicReadmeFirstReadHistorySplitPlanCheck,
  publicReadmeFirstReadHistorySplitPlanText,
  publicReadmeHistoryArchiveSplitDryRun,
  publicReadmeHistoryArchiveSplitDryRunCheck,
  publicReadmeHistoryArchiveSplitDryRunText,
  publicReadmeHistoryArchiveSplitApply,
  publicReadmeHistoryArchiveSplitApplyCheck,
  publicReadmeHistoryArchiveSplitApplyText,
  publicClosedGateArtifactCompactionPlan,
  publicClosedGateArtifactCompactionPlanCheck,
  publicClosedGateArtifactCompactionPlanText,
  publicClosedGateArtifactCompactionDryRun,
  publicClosedGateArtifactCompactionDryRunCheck,
  publicClosedGateArtifactCompactionDryRunText,
  publicClosedGateArtifactCompactionApply,
  publicClosedGateArtifactCompactionApplyCheck,
  publicClosedGateArtifactCompactionApplyText,
  publicClosedGateArchiveReader,
  publicClosedGateArchiveReaderCheck,
  publicClosedGateArchiveReaderText,
  publicClosedGateRawArtifactPrunePlanning,
  publicClosedGateRawArtifactPrunePlanningCheck,
  publicClosedGateRawArtifactPrunePlanningText,
  publicClosedGateRawArtifactPruneDryRun,
  publicClosedGateRawArtifactPruneDryRunCheck,
  publicClosedGateRawArtifactPruneDryRunText,
  publicClosedGateRawArtifactPruneApply,
  publicClosedGateRawArtifactPruneApplyCheck,
  publicClosedGateRawArtifactPruneApplyText,
  publicClosedGateRawArtifactPruneApplyAdmitted,
  publicClosedGateRawArtifactPruneApplyIndexState
} = publicReleaseCleanClosedGatesRuntimeSliceService;

const checkPlanFastService = createPublicRuntimeCheckFastService({
  PACKAGE_NAME,
  VERSION,
  RELEASE_LINE,
  packageRoot,
  resolveTargetRoot: () => process.cwd(),
  writeProgressLine: (line) => process.stderr.write(line),
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  contributorAdmissionService,
  publicContractsService,
  targetRuntimeService,
  targetMemoryService: Object.freeze({
    descriptor: targetRuntimeService.targetMemoryDescriptor,
    text: targetRuntimeService.targetMemoryText
  }),
  ciSurfaceService,
  mcpBridgePlanService,
  publicPackageSourceManifestCheck,
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
  publicClosedGateRawArtifactPrunePlanningCheck,
  publicClosedGateRawArtifactPruneDryRunCheck,
  publicFullTestRunnerCompletionCheck: (...args) => publicFullTestRunnerCompletionCheck(...args),
  publicPackageSurfaceCheck,
  publicReleaseCheck
});


const PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY = Object.freeze({
  schema: 'agent-onboard-public-installed-authority-state-shard-parity-contract-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  command: 'agent-onboard release --authority-state-parity',
  check_command: 'agent-onboard release --authority-state-parity-check',
  role: 'installed package authority-state shard boundary parity without packaging source shards',
  installed_smoke_commands: Object.freeze([
    'node node_modules/agent-onboard/cli/agent-onboard.js authority --state-check',
    'node node_modules/agent-onboard/cli/agent-onboard.js release --authority-state-parity-check'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    creates_temp_files: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network_required: false,
    raw_authority_loaded_by_default: false,
    file_contents_inlined: false,
    state_shards_packaged_in_npm_tarball: false
  })
});

const publicFullTestRunnerService = createPublicFullTestRunnerService({
  PACKAGE_NAME,
  VERSION,
  RELEASE_LINE,
  packageRoot,
  readJson,
  sourceContext,
  publicClosedGateRawArtifactPruneApplyAdmitted
});
const publicFullTestRunnerCompletion = publicFullTestRunnerService.completion;
const publicFullTestRunnerCompletionCheck = publicFullTestRunnerService.completionCheck;
const publicFullTestRunnerCompletionText = publicFullTestRunnerService.completionText;



function publicInstalledAuthorityStateShardParity(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg).slice().sort();
  const stateShardPaths = PUBLIC_AUTHORITY_FIRST_READ_INDEX.state_shard_paths.slice();
  const sourceShardReports = stateShardPaths.map((rel) => ({
    file_path: rel,
    source_present: fs.existsSync(path.join(root, rel)),
    projected_in_pack: expectedPackFiles.includes(rel) || projectedPackFiles.includes(rel)
  }));
  const sourceStateCheck = publicAuthorityStateShardingSeedCheck(root);
  const errors = [];
  if (!arrayEquals(projectedPackFiles, expectedPackFiles)) errors.push('projected npm pack files must match release contract');
  for (const report of sourceShardReports) {
    if (report.projected_in_pack) errors.push(`authority state shard must not be projected into npm package: ${report.file_path}`);
    if (context.package_context === 'source_repository' && !report.source_present) errors.push(`authority state shard missing in source repository: ${report.file_path}`);
  }
  if (sourceStateCheck.status !== 'ok') errors.push(...sourceStateCheck.errors.map((error) => `authority --state-check: ${error}`));
  const installedProjection = {
    package_context: 'installed_package',
    state_shards_expected_absent: stateShardPaths,
    authority_state_check_expected_status: 'ok',
    authority_state_check_expected_reason: 'installed package context permits absent source-only state shards',
    raw_authority_loaded_by_default: false,
    file_contents_inlined: false
  };
  return {
    schema: 'agent-onboard-public-installed-authority-state-shard-parity-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY.command,
    check_command: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY.check_command,
    package_root: root,
    package_context: context.package_context,
    source_context: context,
    state_shard_paths: stateShardPaths,
    source_shards: sourceShardReports,
    installed_projection: installedProjection,
    source_authority_state_check: {
      status: sourceStateCheck.status,
      package_context: sourceStateCheck.package_context,
      summary: sourceStateCheck.summary,
      errors: sourceStateCheck.errors
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    validated: {
      package_version_matches_runtime: pkg.version === VERSION,
      projected_pack_files_match_contract: arrayEquals(projectedPackFiles, expectedPackFiles),
      source_state_shards_not_projected_into_package: sourceShardReports.every((report) => report.projected_in_pack === false),
      source_state_shards_present_or_installed_context_allowed: context.package_context === 'installed_package' || sourceShardReports.every((report) => report.source_present === true),
      source_authority_state_check_ok: sourceStateCheck.status === 'ok',
      installed_context_allows_absent_state_shards: true,
      raw_authority_loaded_by_default: false,
      file_contents_not_inlined: true,
      command_is_read_only: true
    },
    boundary: PUBLIC_INSTALLED_AUTHORITY_STATE_SHARD_PARITY.boundary,
    errors
  };
}

const publicTargetOnboardingAcceptanceService = createPublicTargetOnboardingAcceptanceService({
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
  PUBLIC_PACKAGE_SURFACE_PRESERVATION,
  TARGET_ONBOARDING_SURFACE_PLAN,
  TARGET_CONFIG_FILE,
  packageRoot,
  sourceContext,
  sourceWorkItemsLedgerCheck,
  publicReleaseCheck: (...args) => publicReleaseCheck(...args),
  publicReleasePostPublishCommands,
  packageJsonProjectedPackFiles,
  packageJsonReleaseErrors,
  publicArtifactMessagingErrors,
  publicArchitectureCheck,
  publicTargetRuntimeNamespaceCheck,
  publicPackageSurfaceCheck,
  publicClaimsDomainSourceExtractionPlanCheck,
  publicSourceModuleExtractionInstalledFallbackSmokeCheck,
  publicTargetOnboardingRealTargetRepoTrial,
  targetDoctor,
  targetProfile,
  targetRepair,
  targetOnboardingSurfacePlan,
  targetOnboardingDryRunFixture,
  targetOnboardingRealTargetTrial,
  planTargetOnboardingWritesForRoot,
  performTargetOnboardingWrites,
  evaluateTargetBoundaryConfig,
  listRelativeFiles,
  stableJson,
  readJson,
  summarizePlan,
  arrayEquals
});
const {
  publicReleaseTargetRepoProductCheck,
  publicInstalledPackageParitySmoke,
  publicInstalledParityArchitectureSmoke,
  publicTargetOnboardingInstalledPackageSmoke,
  publicTargetOnboardingPostPublishHandoff,
  publicTargetOnboardingPublishedAcceptance
} = publicTargetOnboardingAcceptanceService;


const publicReleaseCheckService = createPublicReleaseCheckService({
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
});

function publicReleaseCheck(root = packageRoot()) {
  return publicReleaseCheckService.publicReleaseCheck(root);
}

function runAuthority(args) {
  if (args.length === 1 && args[0] === '--first-read') {
    json(publicAuthorityFirstRead());
    return 0;
  }
  if (args.length === 1 && args[0] === '--check') {
    const result = publicAuthorityFirstReadCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--index') {
    json(publicAuthorityCompactIndexResult());
    return 0;
  }
  if (args.length === 1 && args[0] === '--index-check') {
    const result = publicAuthorityCompactIndexCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--state') {
    json(publicAuthorityStateShardingSeed());
    return 0;
  }
  if (args.length === 1 && args[0] === '--state-check') {
    const result = publicAuthorityStateShardingSeedCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  json({
    schema: 'agent-onboard-authority-command-error-001',
    status: 'error',
    command_family: 'authority',
    message: 'authority requires --first-read, --check, --index, --index-check, --state, or --state-check',
    writes_files: false,
    publishes_package: false
  });
  return 1;
}

const PUBLIC_RUNTIME_RELEASE_COMMAND_SERVICE = createPublicRuntimeReleaseCommandService({
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
    PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
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
});

function runRelease(args) {
  return PUBLIC_RUNTIME_RELEASE_COMMAND_SERVICE.runRelease(args);
}

const publicRuntimeGuardService = createPublicRuntimeGuardService({
  json,
  cwd: () => process.cwd(),
  path,
  exists: fs.existsSync,
  readJson,
  validateTargetConfig,
  evaluateTargetBoundaryConfig,
  noMutationBoundary,
  guardResultBase,
  targetConfigFile: TARGET_CONFIG_FILE,
  boundaryGuardContract: BOUNDARY_GUARD_CONTRACT
});
const runGuard = (args = []) => publicRuntimeGuardService.runGuard(args);

function runWorkItems() {
  throw new Error('work-items is served by the packaged work-items runtime service; no legacy work-items fallback is available');
}

function runClaim() {
  throw new Error('claim is served by the packaged work-items runtime service; no legacy claim fallback is available');
}


const agentsBridgeService = createPublicRuntimeAgentsBridgeService({
  fs,
  path,
  PACKAGE_NAME,
  VERSION,
  RELEASE_LINE,
  OUTPUT_FLAG,
  cwd: () => process.cwd(),
  json: (value) => process.stdout.write(JSON.stringify(value, null, 2) + '\n'),
  writeText: (value) => process.stdout.write(value),
  agentsMdTemplate,
  planTextWrites,
  performPlannedTextWrites,
  summarizePlan
});

const bridgeMarkerBlock = (...args) => agentsBridgeService.bridgeMarkerBlock(...args);
const bridgePlan = (...args) => agentsBridgeService.bridgePlan(...args);
const bridgeCheck = (...args) => agentsBridgeService.bridgeCheck(...args);
const bridgeWrite = (...args) => agentsBridgeService.bridgeWrite(...args);
const runBridge = (args = []) => agentsBridgeService.runBridge(args);
const runAgents = (args = []) => agentsBridgeService.runAgents(args);


const coreSurfaceCommandRunnerService = createPublicCoreSurfaceCommandRunnerService({
  VERSION,
  RELEASE_LINE,
  PUBLIC_RELEASE_CONTRACT,
  PRODUCT_HELP_LINES,
  OUTPUT_FLAG,
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  contributorAdmissionService,
  ciSurfaceService,
  checkPlanFastService,
  packageRoot,
  json,
  writeText: (value) => process.stdout.write(value)
});






const DOMAIN_SERVICE_FACADES = Object.freeze({
  coreService: Object.freeze({
    help: coreSurfaceCommandRunnerService.help,
    printVersion: coreSurfaceCommandRunnerService.printVersion,
    runStatus: coreSurfaceCommandRunnerService.runStatus,
    runCommands: coreSurfaceCommandRunnerService.runCommands,
    runGuide: coreSurfaceCommandRunnerService.runGuide,
    runQuickstart: coreSurfaceCommandRunnerService.runQuickstart,
    runDiscovery: coreSurfaceCommandRunnerService.runDiscovery,
    runCreate: coreSurfaceCommandRunnerService.runCreate,
    runIssue: coreSurfaceCommandRunnerService.runIssue,
    runContributor: coreSurfaceCommandRunnerService.runContributor,
    runContracts,
    runCheck: coreSurfaceCommandRunnerService.runCheck,
    runCi: coreSurfaceCommandRunnerService.runCi,
    runMcp,
    runArchitecture
  }),
  authorityService: Object.freeze({
    runAgents,
    runBridge,
    runGuard,
    runAuthority
  }),
  workItemsService: Object.freeze({
    runWorkItems,
    runClaim
  }),
  claimsService: Object.freeze({
    runClaim
  }),
  targetService: Object.freeze({
    runInit: targetCommandRunnerService.runInit,
    runTargetConfig: targetCommandRunnerService.runTargetConfig,
    runTargetRuntime: targetCommandRunnerService.runTargetRuntime,
    runTargetInventory: targetCommandRunnerService.runTargetInventory,
    runTargetMemory: targetCommandRunnerService.runTargetMemory,
    runTargetGovernance: targetCommandRunnerService.runTargetGovernance,
    runTargetHandoff: targetCommandRunnerService.runTargetHandoff,
    runTargetCommand: targetCommandRunnerService.runTargetCommand,
    runTargetInstance: targetCommandRunnerService.runTargetInstance
  }),
  releasePackageService: Object.freeze({
    runRelease
  })
});

function createRuntimeCompatibilityPort() {
  return createRuntimeCompatibilityPortFromRegistry({
    version: VERSION,
    releaseLine: RELEASE_LINE,
    facades: DOMAIN_SERVICE_FACADES,
    workItemsDependencies: Object.freeze({
      cwd: () => process.cwd(),
      emit: json,
      readJson,
      validateWorkItems,
      workItemCounts,
      workItemsSchema: () => WORK_ITEMS_SCHEMA,
      workItemsTemplate,
      appendWorkItemDryRun,
      claimWorkItemDryRun,
      closeWorkItemDryRun,
      refreshGovernanceIndexesAfterWorkItemsWrite: ({ target_root, trigger }) => targetRuntimeService.targetGovernanceIndexRefreshAfterMutation(target_root, { trigger }),
      planWrites,
      performPlannedWrites,
      summarizePlan,
      writeJson,
      exists: fs.existsSync
    })
  });
}

module.exports = { targetConfigTemplate, validateTargetConfig, validateWorkItems, validateWorkItemsGraph, appendWorkItemDryRun, claimWorkItemDryRun, closeWorkItemDryRun, publicContractsCatalog, publicContractsCheck, handoffEvidenceChecklist, participationLifecycleNextSteps, workItemsTemplate, initWriteSet, planWrites, agentsMdTemplate, bridgeMarkerBlock, bridgePlan, bridgeCheck, bridgeWrite, evaluateTargetBoundaryConfig, sourceWorkItemsLedgerCheck, sourceContext, commandSurfaceService, operatorGuideService, quickstartService, discoveryService, createDryRunService, issueIntakeService, ciSurfaceService, publicReleaseCheck, publicCleanCompactionBaseline, publicCleanCompactionBaselineCheck, publicCleanCompactionBaselineText, publicClosedGateArtifactCompactionPlan, publicClosedGateArtifactCompactionPlanCheck, publicClosedGateArtifactCompactionPlanText, publicClosedGateArtifactCompactionDryRun, publicClosedGateArtifactCompactionDryRunCheck, publicClosedGateArtifactCompactionDryRunText, publicClosedGateArtifactCompactionApply, publicClosedGateArtifactCompactionApplyCheck, publicClosedGateRawArtifactPruneApply, publicClosedGateRawArtifactPruneApplyCheck, publicClosedGateArchiveReader, publicClosedGateArchiveReaderCheck, publicClosedGateArchiveReaderText, publicArchitectureMap, publicCommandRouter, publicCommandRouterCheck, publicArchitectureCheck, publicAuthorityFirstRead, publicAuthorityFirstReadCheck, publicAuthorityCompactIndexResult, publicAuthorityCompactIndexCheck, publicSourceDomainExtractionRehearsal, publicSourceDomainExtractionRehearsalCheck, publicSourceModuleExtractionAuthorityBundleParity, publicSourceModuleExtractionAuthorityBundleParityCheck, publicWorkItemsDomainSourceExtractionPlan, publicWorkItemsDomainSourceExtractionPlanCheck, publicWorkItemsDomainSourceExtractionFirstSlice, publicWorkItemsDomainSourceExtractionFirstSliceCheck, publicWorkItemsDomainSourceExtractionBundleParity, publicWorkItemsDomainSourceExtractionBundleParityCheck, publicWorkItemsDomainSourceExtractionRuntimeBridge, publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck, publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke, publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck, publicArchitectureCommandAdapterExtraction, publicArchitectureCommandAdapterExtractionCheck, publicAuthorityCommandAdapterExtraction, publicAuthorityCommandAdapterExtractionCheck, publicModularRuntimePackageInclusionPlan, publicModularRuntimePackageInclusionPlanCheck, publicPackagedRouterPortInclusion, publicPackagedRouterPortInclusionCheck, publicThinEntrypointRouterCutoverRehearsal, publicThinEntrypointRouterCutoverRehearsalCheck, publicThinEntrypointRouterCutoverApplication, publicThinEntrypointRouterCutoverApplicationCheck, publicRouterCommandAdapterDelegationExpansion, publicRouterCommandAdapterDelegationExpansionCheck, publicClaimsDomainSourceExtractionPlan, publicClaimsDomainSourceExtractionPlanCheck, publicClaimsDomainSourceExtractionFirstSlice, publicClaimsDomainSourceExtractionFirstSliceCheck, publicClaimsDomainSourceExtractionBundleParity, publicClaimsDomainSourceExtractionBundleParityCheck, publicClaimsDomainSourceExtractionRuntimeBridge, publicClaimsDomainSourceExtractionRuntimeBridgeCheck, publicClaimsDomainSourceExtractionInstalledFallbackSmoke, publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck, publicInstalledPackageParitySmoke, publicInstalledParityArchitectureSmoke, publicTargetOnboardingInstalledPackageSmoke, publicTargetOnboardingPostPublishHandoff, publicTargetOnboardingPublishedAcceptance, publicTargetOnboardingRealTargetRepoTrial, targetOnboardingSurfacePlan, targetOnboardingDryRunFixture, targetOnboardingRealTargetTrial, targetOnboardingWriteSet, targetDoctor, targetRepair, targetProfile, targetInventory, formatTargetInventoryText, targetWorkItemsPreview, formatTargetWorkItemsPreviewText, targetGovernancePreview, formatTargetGovernancePreviewText, targetGovernanceBudgetContract, formatTargetGovernanceBudgetContractText, targetGovernanceBudgetCheck, formatTargetGovernanceBudgetCheckText, targetGovernanceIndexMaterializationDryRun, formatTargetGovernanceIndexMaterializationDryRunText, targetGovernanceIndexMaterializationWrite, formatTargetGovernanceIndexMaterializationWriteText, targetGovernanceIndexDriftCheck, formatTargetGovernanceIndexDriftCheckText, targetGovernanceIndexRefreshAfterMutation, targetHandoffPreview, formatTargetHandoffPreviewText, targetRuntimeNamespaceTemplate, planTargetOnboardingWritesForRoot, TARGET_ONBOARDING_SURFACE_PLAN, TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX, PUBLIC_RELEASE_FIXTURE_MATRIX, RUNTIME_CONTRACTS, PUBLIC_ARCHITECTURE_MAP, PUBLIC_COMMAND_ROUTER, PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL, PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE, PUBLIC_TARGET_RUNTIME_NAMESPACE, PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE, PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION, PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING, PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION, PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION, PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN, PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION, PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL, PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION, createRuntimeCompatibilityPort };
