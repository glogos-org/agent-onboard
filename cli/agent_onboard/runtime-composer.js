'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { route: routeCommand } = require('./command-router');
const { createRuntimeCompatibilityPortFromRegistry } = require('./runtime-command-registry');
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
const { createPublicArchitectureRuntimeService } = require('./domains/architecture/services/runtime/architecture-runtime-service');
const { createPublicArchitectureCommandRunnerService } = require('./domains/architecture/services/runtime/public-architecture-command-runner-service');
const { createPublicCliRuntimePlanningService } = require('./domains/architecture/services/runtime/public-cli-runtime-planning-service');
const { createPublicRouterSeedService } = require('./domains/architecture/services/runtime/public-router-seed-service');
const { createPublicCommandAdapterExtractionService } = require('./domains/architecture/services/runtime/public-command-adapter-extraction-service');
const { createPublicRouterCutoverService } = require('./domains/architecture/services/runtime/public-router-cutover-service');
const { createPublicArchitectureAggregateCheckService } = require('./domains/architecture/services/checks/architecture-check-service');
let createPublicArchitectureSourceDomainService = null;
try {
  createPublicArchitectureSourceDomainService = require('./domains/architecture/services/source-domains/architecture-source-domain-service').createPublicArchitectureSourceDomainService;
} catch (error) {
  // Source-only domain service is omitted in installed package context
}
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
  PUBLIC_VERSION_REFERENCE_POLICY,
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


const targetRuntimeService = createTargetRuntimeService({
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

function listRelativeFiles(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  if (fs.existsSync(root)) walk(root);
  return files.sort();
}

function packageRoot() {
  return path.resolve(__dirname, '../..');
}

function arrayEquals(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function publicReleasePostPublishCommands(version = VERSION) {
  return PUBLIC_RELEASE_CONTRACT.post_publish_verification_commands.map((command) => command.replaceAll('<version>', version));
}

function packageJsonReleaseErrors(pkg, root = packageRoot()) {
  const errors = [];
  const required = PUBLIC_RELEASE_CONTRACT.required_package_json;
  if (pkg.name !== required.name) errors.push(`package.json#name must be ${required.name}`);
  if (pkg.version !== VERSION) errors.push(`package.json#version must match runtime version ${VERSION}`);
  if (pkg.private === true) errors.push('package.json#private must not be true for a public package');
  if (pkg.license !== required.license) errors.push(`package.json#license must be ${required.license}`);
  if (pkg.type !== required.type) errors.push(`package.json#type must be ${required.type}`);
  if (!pkg.engines || pkg.engines.node !== required.node_engine) errors.push(`package.json#engines.node must be ${required.node_engine}`);
  for (const field of PUBLIC_RELEASE_CONTRACT.required_metadata_fields) {
    const value = getPathValue(pkg, field);
    const missing = Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';
    if (missing) errors.push(`package.json#${field} is required`);
  }
  if (!Array.isArray(pkg.keywords) || pkg.keywords.length < 5) errors.push('package.json#keywords must contain at least 5 discovery terms');
  const requiredBin = required.bin;
  for (const [name, rel] of Object.entries(requiredBin)) {
    if (!pkg.bin || pkg.bin[name] !== rel) errors.push(`package.json#bin.${name} must be ${rel}`);
    else if (!fs.existsSync(path.join(root, rel))) errors.push(`package.json#bin.${name} points to missing file ${rel}`);
  }
  const actualFiles = Array.isArray(pkg.files) ? pkg.files.slice().sort() : [];
  const expectedFiles = required.files.slice().sort();
  if (!arrayEquals(actualFiles, expectedFiles)) errors.push(`package.json#files must match ${expectedFiles.join(', ')}`);
  for (const rel of expectedFiles) {
    if (!fs.existsSync(path.join(root, rel))) errors.push(`package.json#files includes missing path ${rel}`);
  }
  return errors;
}

function packageJsonProjectedPackFiles(pkg) {
  const files = new Set(['package.json']);
  if (Array.isArray(pkg.files)) {
    for (const rel of pkg.files) files.add(rel);
  }
  return Array.from(files).sort();
}

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

function publicArtifactMessagingErrors(root = packageRoot(), files = PUBLIC_RELEASE_CONTRACT.expected_pack_files) {
  const errors = [];
  const forbiddenConcreteWorkItem = /P\d+S\d+M\d+W\d+/;
  const forbiddenKey = ['machine', 'identifier'].join('_');
  const forbiddenNarrativePatterns = [
    new RegExp(['pri', 'vate\\s*\\/\\s*pub', 'lic\\s+sp', 'lit'].join(''), 'i'),
    new RegExp(['in', 'ternal\\s+line'].join(''), 'i'),
    new RegExp(['rese', 'arch\\s+li', 'ne'].join(''), 'i'),
    new RegExp(['str', 'ipp?ed'].join(''), 'i'),
    new RegExp(['sani', 'ti[sz]ed'].join(''), 'i'),
    new RegExp(['\\b', 'le', 'ak(?:age|ed|s|ing)?\\b'].join(''), 'i')
  ];

  for (const rel of files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    const text = fs.readFileSync(abs, 'utf8');
    if (text.includes(forbiddenKey)) errors.push(`${rel} contains reserved implementation key token`);
    const workItemMatch = forbiddenConcreteWorkItem.exec(text);
    if (workItemMatch) errors.push(`${rel} contains concrete work-item token ${workItemMatch[0]}`);
    for (let index = 0; index < forbiddenNarrativePatterns.length; index += 1) {
      const match = forbiddenNarrativePatterns[index].exec(text);
      if (match) errors.push(`${rel} violates public artifact messaging rule ${index + 1}: ${match[0]}`);
    }
  }
  return errors;
}

function sourceWorkItemsLedgerCheck(root = packageRoot()) {
  const file = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(file)) {
    return {
      present: false,
      status: 'skipped',
      reason: 'source work-item ledger is not present in this package context',
      validated: true,
      file: '.agent-onboard/work-items.json',
      counts: null,
      errors: []
    };
  }
  let value;
  try {
    value = readJson(file);
  } catch (error) {
    return {
      present: true,
      status: 'error',
      reason: 'source work-item ledger is not valid JSON',
      validated: false,
      file: '.agent-onboard/work-items.json',
      counts: null,
      errors: [error && error.message ? error.message : String(error)]
    };
  }
  const errors = validateWorkItems(value);
  const counts = workItemCounts(value);
  return {
    present: true,
    status: errors.length === 0 ? 'ok' : 'error',
    reason: errors.length === 0 ? 'source work-item ledger validates' : 'source work-item ledger validation failed',
    validated: errors.length === 0,
    file: '.agent-onboard/work-items.json',
    counts,
    open_work_items: Array.isArray(value.work_items) ? value.work_items.filter((item) => item.status !== 'closed').map((item) => ({ id: item.id, title: item.title, status: item.status })) : [],
    errors
  };
}

function sourceContext(root = packageRoot()) {
  const sourceFiles = PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => fs.existsSync(path.join(root, rel)));
  return {
    package_context: sourceFiles.length > 0 ? 'source_repository' : 'installed_package',
    source_context_files_present: sourceFiles,
    source_context_files_missing: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => !sourceFiles.includes(rel))
  };
}

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

const publicArchitectureRuntimeService = createPublicArchitectureRuntimeService({
  version: VERSION,
  publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
  publicCommandRouter: PUBLIC_COMMAND_ROUTER,
  publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
  publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
  publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
  publicSourceDomainModulePartitionPlan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
  publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
  publicSourceExtractionGoldenOutputFreeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
  publicVersionReferencePolicy: PUBLIC_VERSION_REFERENCE_POLICY,
  publicSourceModuleExtractionAdapterBoundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
  publicSourceModuleExtractionFirstSlice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
  publicSourceModuleExtractionBundleParity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
  publicSourceModuleExtractionRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
  publicSourceModuleExtractionAuthorityRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
  publicArchitectureM1ClosureM2Seed: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  targetOnboardingSurfacePlan: TARGET_ONBOARDING_SURFACE_PLAN,
  packageRoot,
  sourceContext,
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles,
  firstReadOrder,
  llmsTxtTemplate,
  authorityPathTemplate,
  targetRuntimeNamespaceTemplate,
  targetOnboardingWriteSet,
  publicArchitectureMap,
  bundledAuthorityDomainForParity,
  publicSourceModuleExtractionAuthorityBundleParityCheck
});
const {
  publicCommandRouter,
  publicCommandRouterCheck,
  publicDomainServiceFacades,
  publicDomainServiceFacadesCheck,
  publicSourceDomainModulePartitionPlan,
  plainClone,
  publicSourceDomainModulePartitionPlanCheck,
  publicAuthorityFirstRead,
  publicAuthorityFirstReadCheck,
  publicAuthorityCompactIndexResult,
  publicAuthorityCompactIndexCheck,
  publicAuthorityStateShardingSeed,
  publicAuthorityStateShardingSeedCheck,
  publicTargetRuntimeNamespace,
  publicTargetRuntimeNamespaceCheck,
  publicSourceDomainExtractionRehearsal,
  publicSourceDomainExtractionRehearsalCheck,
  publicSourceExtractionGoldenOutputs,
  scanCurrentVersionLiterals,
  publicVersionReferencePolicyCheck,
  publicSourceExtractionGoldenOutputFreezeCheck,
  publicSourceModuleExtractionAdapterBoundary,
  publicSourceModuleExtractionAdapterBoundaryCheck,
  loadCoreFirstSliceModule,
  publicSourceModuleExtractionFirstSlice,
  publicSourceModuleExtractionFirstSliceCheck,
  bundledCoreDomainForParity,
  publicSourceModuleExtractionBundleParity,
  publicSourceModuleExtractionBundleParityCheck,
  resolveCoreDomainRuntimeBridge,
  publicSourceModuleExtractionRuntimeBridge,
  publicSourceModuleExtractionRuntimeBridgeCheck,
  resolveAuthorityDomainRuntimeBridge,
  publicSourceModuleExtractionAuthorityRuntimeBridge,
  publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
  publicArchitectureM1ClosureM2Seed,
  workItemIdFromComponents,
  workItemIdsFromComponentList,
  publicArchitectureM1ClosureM2SeedCheck
} = publicArchitectureRuntimeService;

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

const publicArchitectureSourceDomainService = typeof createPublicArchitectureSourceDomainService === 'function' ? createPublicArchitectureSourceDomainService({
  version: VERSION,
  publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  publicWorkItemsDomainSourceExtractionPlan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  publicWorkItemsDomainSourceExtractionFirstSlice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  publicWorkItemsDomainSourceExtractionBundleParity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  publicWorkItemsDomainSourceExtractionRuntimeBridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
  publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  publicClaimsDomainSourceExtractionPlan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  publicClaimsDomainSourceExtractionFirstSlice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  publicClaimsDomainSourceExtractionBundleParity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  publicClaimsDomainSourceExtractionRuntimeBridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
  publicClaimsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  publicSourceDomainExtractionStabilizationClosureReview: PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
  publicDomainServiceFacadesContract: PUBLIC_DOMAIN_SERVICE_FACADES,
  packageRoot,
  sourceContext,
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles,
  publicDomainServiceFacades,
  publicArchitectureMap,
  workItemIdFromComponents,
  publicArchitectureM1ClosureM2SeedCheck,
  publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
  publicPackageSurfaceCheck,
  publicVersionReferencePolicyCheck
}) : {};
const {
  publicWorkItemsDomainSourceExtractionPlan,
  publicWorkItemsDomainSourceExtractionPlanCheck,
  loadWorkItemsFirstSliceModule,
  publicWorkItemsDomainSourceExtractionFirstSlice,
  publicWorkItemsDomainSourceExtractionFirstSliceCheck,
  bundledWorkItemsDomainForParity,
  publicWorkItemsDomainSourceExtractionBundleParity,
  publicWorkItemsDomainSourceExtractionBundleParityCheck,
  resolveWorkItemsDomainRuntimeBridge,
  publicWorkItemsDomainSourceExtractionRuntimeBridge,
  publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
  publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke,
  publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
  publicClaimsDomainSourceExtractionPlan,
  publicClaimsDomainSourceExtractionPlanCheck,
  loadClaimsFirstSliceModule,
  publicClaimsDomainSourceExtractionFirstSlice,
  publicClaimsDomainSourceExtractionFirstSliceCheck,
  bundledClaimsDomainForParity,
  publicClaimsDomainSourceExtractionBundleParity,
  publicClaimsDomainSourceExtractionBundleParityCheck,
  resolveClaimsDomainRuntimeBridge,
  publicClaimsDomainSourceExtractionRuntimeBridge,
  publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
  publicClaimsDomainSourceExtractionInstalledFallbackSmoke,
  publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck,
  publicSourceDomainExtractionStabilizationClosureReview,
  publicSourceDomainExtractionStabilizationClosureReviewCheck
} = publicArchitectureSourceDomainService;

function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}

const publicRouterSeedService = createPublicRouterSeedService({
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_THIN_CLI_ROUTER_SEED,
  PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED,
  packageRoot,
  sourceContext,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles
});
const {
  publicThinCliRouterSeed,
  publicThinCliRouterSeedCheck,
  publicCompatibilityCommandPortSeed,
  publicCompatibilityCommandPortSeedCheck
} = publicRouterSeedService;

const publicCommandAdapterExtractionService = createPublicCommandAdapterExtractionService({
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
  packageRoot,
  sourceContext,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles
});
const {
  publicCoreCommandAdapterExtraction,
  publicCoreCommandAdapterExtractionCheck,
  publicPackageCommandAdapterExtraction,
  publicPackageCommandAdapterExtractionCheck,
  publicArchitectureCommandAdapterExtraction,
  publicArchitectureCommandAdapterExtractionCheck,
  publicAuthorityCommandAdapterExtraction,
  publicAuthorityCommandAdapterExtractionCheck
} = publicCommandAdapterExtractionService;

const publicRouterCutoverService = createPublicRouterCutoverService({
  VERSION,
  PUBLIC_RELEASE_CONTRACT,
  PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
  PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
  PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
  packageRoot,
  sourceContext,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles,
  routeCommand,
  createRuntimeCompatibilityPort
});
const {
  publicModularRuntimePackageInclusionPlan,
  publicModularRuntimePackageInclusionPlanCheck,
  publicPackagedRouterPortInclusion,
  publicPackagedRouterPortInclusionCheck,
  publicThinEntrypointRouterCutoverRehearsal,
  publicThinEntrypointRouterCutoverRehearsalCheck,
  publicThinEntrypointRouterCutoverApplication,
  publicThinEntrypointRouterCutoverApplicationCheck,
  publicRouterCommandAdapterDelegationExpansion,
  publicRouterCommandAdapterDelegationExpansionCheck
} = publicRouterCutoverService;

function publicArchitectureMap(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  return {
    schema: 'agent-onboard-public-architecture-map-result-001',
    status: 'ok',
    package_name: PUBLIC_ARCHITECTURE_MAP.package_name,
    version: VERSION,
    release_line: PUBLIC_ARCHITECTURE_MAP.release_line,
    command: PUBLIC_ARCHITECTURE_MAP.command,
    check_command: PUBLIC_ARCHITECTURE_MAP.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    package_json_version: pkg.version,
    map: PUBLIC_ARCHITECTURE_MAP,
    command_router: PUBLIC_COMMAND_ROUTER,
    domain_service_facades: PUBLIC_DOMAIN_SERVICE_FACADES,
    source_domain_module_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    source_domain_extraction_rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    source_extraction_golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
      source_module_extraction_adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    source_module_extraction_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    source_module_extraction_second_slice_plan: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
    version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
    authority_first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    target_runtime_namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    current_runtime: {
      entrypoint: PUBLIC_ARCHITECTURE_MAP.public_source_shape.current_entrypoint,
      entrypoint_exists: fs.existsSync(path.join(root, PUBLIC_ARCHITECTURE_MAP.public_source_shape.current_entrypoint)),
      physical_domain_split_status: PUBLIC_ARCHITECTURE_MAP.public_source_shape.physical_domain_split_status,
      expected_pack_files: PUBLIC_ARCHITECTURE_MAP.public_source_shape.expected_pack_files.slice(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg)
    },
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function publicSourceModuleExtractionInstalledFallbackSmoke(root = packageRoot()) {
  const runtimeBridge = publicSourceModuleExtractionRuntimeBridgeCheck(root);
  const packageSurface = publicPackageSurfaceCheck(root);
  const context = sourceContext(root);
  const pkg = readJson(path.join(root, 'package.json'));
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg).slice().sort();
  const sourceModuleRel = PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.source_module;
  const sourceModulePresent = fs.existsSync(path.join(root, sourceModuleRel));
  const sourceModuleInPack = expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel);
  const projectedInstalledRuntimeBridge = {
    context: 'installed_package',
    source_module_present: false,
    source_module: sourceModuleRel,
    mode: 'bundled_fallback',
    fallback_source: 'cli/agent-onboard.js',
    allowed_because_source_module_is_not_in_npm_pack: !sourceModuleInPack
  };
  return {
    schema: 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.check_command,
    package_root: root,
    source_context: context,
    installed_fallback_smoke_file: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file,
    installed_fallback_smoke_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file)),
    source_module: sourceModuleRel,
    source_module_present: sourceModulePresent,
    projected_installed_runtime_bridge: projectedInstalledRuntimeBridge,
    observed: {
      runtime_bridge_check_status: runtimeBridge.status,
      runtime_bridge_resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
      package_surface_check_status: packageSurface.status,
      source_module_in_expected_pack_files: expectedPackFiles.includes(sourceModuleRel),
      source_module_in_projected_pack_files: projectedPackFiles.includes(sourceModuleRel),
      source_context_files_in_pack: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => projectedPackFiles.includes(rel))
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    installed_fallback_contract: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    },
    errors: []
  };
}

function publicSourceModuleExtractionInstalledFallbackSmokeCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionInstalledFallbackSmoke(root);
  const runtimeBridge = publicSourceModuleExtractionRuntimeBridgeCheck(root);
  const packageSurface = publicPackageSurfaceCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json'))).slice().sort();
  const sourceModuleRel = PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.source_module;
  const artifactPath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file);
  const context = sourceContext(root);
  const errors = [];
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.smoke_status !== 'installed_fallback_smoke_admitted') errors.push('installed fallback smoke status must be installed_fallback_smoke_admitted');
  if (runtimeBridge.status !== 'ok') errors.push('runtime bridge check must pass before installed fallback smoke');
  if (packageSurface.status !== 'ok') errors.push('package surface check must pass before installed fallback smoke');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('runtime bridge must require installed-context fallback');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('source modules must remain out of npm pack');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_check_command_writes_files !== false) errors.push('installed fallback check must remain no-write');
  if (!arrayEquals(expectedPackFiles, projectedPackFiles)) errors.push('projected pack files must match the compact expected pack files');
  if (expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel)) errors.push(`${sourceModuleRel} must remain outside the npm package allowlist`);
  if (context.package_context === 'installed_package' && fs.existsSync(path.join(root, sourceModuleRel))) errors.push(`${sourceModuleRel} must be absent from installed package context`);
  if (context.package_context === 'installed_package' && runtimeBridge.runtime_bridge_resolution.mode !== 'bundled_fallback') errors.push('installed package runtime bridge must resolve through bundled_fallback');
  if (context.package_context === 'source_repository' && !fs.existsSync(artifactPath)) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must exist in source repository context`);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      if (artifact.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema}`);
      if (artifact.source_module !== sourceModuleRel) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} source_module must be ${sourceModuleRel}`);
      if (!artifact.projected_installed_context || artifact.projected_installed_context.runtime_bridge_resolution_mode !== 'bundled_fallback') errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must declare bundled_fallback projected installed context`);
    } catch (error) {
      errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must be valid JSON: ${error.message}`);
    }
  }
  return {
    schema: 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.check_command,
    package_root: root,
    source_context: context,
    validated: {
      runtime_bridge_check: runtimeBridge.status === 'ok',
      package_surface_check: packageSurface.status === 'ok',
      installed_fallback_smoke_status: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.smoke_status === 'installed_fallback_smoke_admitted',
      source_module_out_of_pack: !expectedPackFiles.includes(sourceModuleRel) && !projectedPackFiles.includes(sourceModuleRel),
      projected_pack_allowlist_unchanged: arrayEquals(expectedPackFiles, projectedPackFiles),
      installed_context_uses_bundled_fallback: context.package_context === 'installed_package' ? runtimeBridge.runtime_bridge_resolution.mode === 'bundled_fallback' : result.projected_installed_runtime_bridge.mode === 'bundled_fallback',
      source_artifact_present_or_installed_context_allowed: fs.existsSync(artifactPath) || context.package_context === 'installed_package',
      installed_fallback_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_smoke_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_check_command_writes_files === false,
      package_allowlist_unchanged: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.package_allowlist_unchanged === true
    },
    observed: result.observed,
    runtime_bridge: {
      status: runtimeBridge.status,
      resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
      source_module_present: runtimeBridge.runtime_bridge_resolution.source_module_present
    },
    source_installed_fallback_file: {
      path: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file,
      present: fs.existsSync(artifactPath),
      status: fs.existsSync(artifactPath) ? 'present_validated' : (context.package_context === 'installed_package' ? 'not_present_installed_context_allowed' : 'missing'),
      schema: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema,
      source_context_required: true
    },
    projected_installed_runtime_bridge: result.projected_installed_runtime_bridge,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    },
    errors
  };
}

function gitignoreSecondSlicePolicy(root = packageRoot()) {
  const rel = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.gitignore_policy.gitignore_file;
  const file = path.join(root, rel);
  const present = fs.existsSync(file);
  const content = present ? fs.readFileSync(file, 'utf8') : '';
  const entries = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith('#'));
  const forbidden = ['.agent-onboard/', '.agent-onboard/*', 'src/', 'src/**', 'src/domains/', 'src/domains/*', 'src/domains/**'];
  const localStateEntries = ['.agent-onboard/tmp/', '.agent-onboard/cache/', '.agent-onboard/local/'];
  const perArtifactUnignoreEntries = entries.filter((entry) => /^!\.agent-onboard\/source-module-extraction-.*\.json$/.test(entry));
  return {
    file: rel,
    present,
    policy: 'track canonical .agent-onboard source JSON by default; ignore only local/runtime/cache state',
    required_unignore_entries: [],
    missing_required_unignore_entries: [],
    forbidden_ignore_entries: forbidden,
    present_forbidden_ignore_entries: forbidden.filter((entry) => entries.includes(entry)),
    local_state_ignore_entries: localStateEntries,
    missing_local_state_ignore_entries: localStateEntries.filter((entry) => !entries.includes(entry)),
    per_artifact_unignore_entries: perArtifactUnignoreEntries,
    entries
  };
}

function publicSourceModuleExtractionSecondSlicePlan(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const plan = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN;
  const plannedModule = plan.planned_second_slice.planned_module;
  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-plan-result-001',
    status: 'ok',
    package_name: plan.package_name,
    version: VERSION,
    release_line: plan.release_line,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    second_slice_plan_file: plan.second_slice_plan_file,
    second_slice_plan_file_present: fs.existsSync(path.join(root, plan.second_slice_plan_file)),
    prerequisite_installed_fallback_smoke_file: plan.prerequisite_installed_fallback_smoke_file,
    planned_second_slice: plan.planned_second_slice,
    planned_module: plannedModule,
    planned_module_present: fs.existsSync(path.join(root, plannedModule)),
    current_source_modules_present: ['src/domains/package.js', plannedModule].filter((rel) => fs.existsSync(path.join(root, rel))),
    gitignore_policy: gitignoreSecondSlicePolicy(root),
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    second_slice_plan: plan,
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function publicSourceModuleExtractionSecondSlicePlanCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionSecondSlicePlan(root);
  const installedFallback = publicSourceModuleExtractionInstalledFallbackSmokeCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const planned = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.planned_second_slice;
  const partitionPlan = PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.planned_source_modules.find((module) => module.domain === planned.domain);
  const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === planned.domain);
  const artifactPath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file);
  const errors = [];
  if (installedFallback.status !== 'ok') errors.push(...installedFallback.errors.map((error) => `installed fallback smoke: ${error}`));
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_status !== 'planned_not_created') errors.push('second slice status must remain planned_not_created for this gate');
  if (planned.domain !== 'authority') errors.push('second slice must plan the authority domain after the package first slice');
  if (!partitionPlan) errors.push('second slice domain must exist in the source partition plan');
  if (partitionPlan && partitionPlan.planned_module !== planned.planned_module) errors.push(`second slice planned module must match partition plan module ${partitionPlan.planned_module}`);
  if (!facade || facade.service !== planned.facade) errors.push('second slice must map to authorityService facade');
  if (planned.source_module_created_by_this_gate !== false) errors.push('second slice planning gate must not create the authority source module');
  if (planned.published_import_api !== false) errors.push('second slice source module must not be admitted as public import API');
  const followupFirstSliceFilePresent = fs.existsSync(path.join(root, '.agent-onboard/source-module-extraction-second-slice-first-slice.json'));
  if (result.planned_module_present && !followupFirstSliceFilePresent) errors.push(`${planned.planned_module} must not be created until the second slice first-slice gate is admitted`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (result.projected_pack_files.includes(planned.planned_module)) errors.push(`${planned.planned_module} must stay outside the npm package allowlist`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_plan_command_writes_files !== false) errors.push('architecture --second-slice-plan must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_check_command_writes_files !== false) errors.push('architecture --second-slice-check must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.package_allowlist_unchanged !== true) errors.push('second slice planning must preserve package allowlist');

  let planFileStatus = 'not_present_installed_context_allowed';
  let planFileSchema = null;
  if (result.second_slice_plan_file_present) {
    try {
      const artifact = readJson(artifactPath);
      planFileSchema = artifact.schema || null;
      if (artifact.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.schema) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.schema}`);
      if (artifact.second_slice_status !== 'planned_not_created') errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must declare planned_not_created`);
      if (!artifact.planned_second_slice || artifact.planned_second_slice.domain !== planned.domain) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must plan ${planned.domain}`);
      if (!artifact.planned_second_slice || artifact.planned_second_slice.planned_module !== planned.planned_module) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} planned module must be ${planned.planned_module}`);
      planFileStatus = 'present_validated';
    } catch (error) {
      planFileStatus = 'present_invalid_json';
      errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    planFileStatus = 'missing_source_context';
    errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must exist in source repository context`);
  }

  const gitignore = result.gitignore_policy;
  if (result.package_context === 'source_repository') {
    if (!gitignore.present) errors.push('.gitignore must exist in source repository context');
    for (const entry of gitignore.missing_required_unignore_entries) errors.push(`.gitignore must unignore ${entry}`);
    for (const entry of gitignore.present_forbidden_ignore_entries) errors.push(`.gitignore must not ignore source module path with ${entry}`);
    for (const entry of gitignore.per_artifact_unignore_entries) errors.push(`.gitignore must not use per-artifact unignore sprawl: ${entry}`);
    for (const entry of gitignore.missing_local_state_ignore_entries) errors.push(`.gitignore must ignore local state entry ${entry}`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.check_command,
    package_root: root,
    source_context: result.source_context,
    validated: {
      installed_fallback_smoke: installedFallback.status === 'ok',
      second_slice_status: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_status === 'planned_not_created',
      planned_domain_is_authority: planned.domain === 'authority',
      planned_domain_maps_to_facade: !!facade && facade.service === planned.facade,
      planned_module_matches_partition_plan: !!partitionPlan && partitionPlan.planned_module === planned.planned_module,
      authority_module_not_created_by_this_gate: !result.planned_module_present || followupFirstSliceFilePresent,
      second_slice_plan_file_present_or_installed_context_allowed: planFileStatus === 'present_validated' || planFileStatus === 'not_present_installed_context_allowed',
      gitignore_tracks_source_artifacts: result.package_context === 'installed_package' || (gitignore.present && gitignore.missing_required_unignore_entries.length === 0),
      gitignore_does_not_ignore_src_domains: result.package_context === 'installed_package' || gitignore.present_forbidden_ignore_entries.length === 0,
      gitignore_uses_compact_local_state_policy: result.package_context === 'installed_package' || (gitignore.present && gitignore.per_artifact_unignore_entries.length === 0 && gitignore.missing_local_state_ignore_entries.length === 0),
      second_slice_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_plan_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    planned_second_slice: planned,
    second_slice_plan_file: {
      path: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file,
      present: result.second_slice_plan_file_present,
      status: planFileStatus,
      schema: planFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    gitignore_policy: gitignore,
    prerequisite_installed_fallback_smoke: {
      status: installedFallback.status,
      errors: installedFallback.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

function loadAuthoritySecondSliceModule(root = packageRoot()) {
  const modulePath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.source_module);
  if (!fs.existsSync(modulePath)) return null;
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function publicSourceModuleExtractionSecondSliceFirstSlice(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE;
  let module_exports = [];
  let module_value = null;
  let module_load_error = null;
  try {
    const loaded = loadAuthoritySecondSliceModule(root);
    if (loaded) {
      module_exports = Object.keys(loaded).sort();
      if (typeof loaded.getAuthorityDomainSecondSlice === 'function') {
        module_value = loaded.getAuthorityDomainSecondSlice();
      } else if (loaded.AUTHORITY_DOMAIN_SECOND_SLICE) {
        module_value = loaded.AUTHORITY_DOMAIN_SECOND_SLICE;
      }
    }
  } catch (error) {
    module_load_error = error && error.message ? error.message : String(error);
  }
  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-first-slice-result-001',
    status: module_load_error ? 'error' : 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    second_slice_first_slice_file: gate.second_slice_first_slice_file,
    second_slice_first_slice_file_present: fs.existsSync(path.join(root, gate.second_slice_first_slice_file)),
    source_module: gate.source_module,
    source_module_present: fs.existsSync(path.join(root, gate.source_module)),
    source_module_exports: module_exports,
    source_module_value: module_value,
    source_module_load_error: module_load_error,
    prerequisite_second_slice_plan_file: gate.prerequisite_second_slice_plan_file,
    second_slice_first_slice: gate,
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function publicSourceModuleExtractionSecondSliceFirstSliceCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionSecondSliceFirstSlice(root);
  const plan = publicSourceModuleExtractionSecondSlicePlanCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE;
  const expectedExports = gate.expected_module_export_names.slice().sort();
  const expectedReadOrder = gate.expected_read_order_paths.slice();
  const errors = [];
  if (plan.status !== 'ok') errors.push(...plan.errors.map((error) => `second slice plan: ${error}`));
  if (result.status !== 'ok') errors.push(`second slice first-slice module load failed: ${result.source_module_load_error}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.second_slice_first_slice_status !== 'source_only_shadow_module_applied') errors.push('second slice first-slice status must be source_only_shadow_module_applied');
  if (gate.extracted_domain.id !== 'authority') errors.push('second slice first-slice must extract the authority domain');
  if (gate.boundary.created_source_module !== 'src/domains/authority.js') errors.push('second slice created source module must be src/domains/authority.js');
  if (gate.boundary.creates_exactly_one_source_module !== true) errors.push('second slice first-slice must create exactly one source module');
  if (gate.boundary.excludes_write_capable_agents_command !== true) errors.push('second slice first-slice must exclude write-capable agents command extraction');
  if (gate.boundary.moves_existing_source_files !== false) errors.push('second slice first-slice must not move existing source files');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('second slice first-slice must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('second slice first-slice must not make CLI runtime require source modules');
  if (gate.boundary.exports_source_module_as_public_api !== false) errors.push('second slice first-slice must not expose source module as public import API');
  if (gate.boundary.second_slice_first_slice_command_writes_files !== false) errors.push('architecture --second-slice-first-slice must remain no-write');
  if (gate.boundary.second_slice_first_slice_check_command_writes_files !== false) errors.push('architecture --second-slice-first-slice-check must remain no-write');

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  if (result.second_slice_first_slice_file_present) {
    try {
      const artifact = readJson(path.join(root, result.second_slice_first_slice_file));
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${result.second_slice_first_slice_file} schema must be ${gate.schema}`);
      if (!artifact.extracted_domain || artifact.extracted_domain.id !== 'authority') errors.push(`${result.second_slice_first_slice_file} must declare extracted_domain.id authority`);
      if (artifact.source_module !== 'src/domains/authority.js') errors.push(`${result.second_slice_first_slice_file} source_module must be src/domains/authority.js`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${result.second_slice_first_slice_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    artifactStatus = 'missing_source_context';
    errors.push(`${result.second_slice_first_slice_file} must be present in source repository context`);
  }

  let sourceModuleStatus = 'not_present_installed_context_allowed';
  const moduleValue = result.source_module_value || {};
  const moduleExportsSorted = result.source_module_exports.slice().sort();
  if (result.source_module_present) {
    if (!arrayEquals(moduleExportsSorted, expectedExports)) errors.push(`${result.source_module} exports must be ${expectedExports.join(', ')}`);
    if (moduleValue.schema !== 'agent-onboard-public-source-module-authority-second-slice-001') errors.push(`${result.source_module} must export authority second-slice schema`);
    if (moduleValue.domain !== 'authority') errors.push(`${result.source_module} domain must be authority`);
    if (moduleValue.facade !== 'authorityService') errors.push(`${result.source_module} facade must be authorityService`);
    if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
    if (moduleValue.runtime_dependency_status !== gate.extracted_domain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
    if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
    if (moduleValue.includes_write_capable_agents_command !== false) errors.push(`${result.source_module} must exclude write-capable agents command extraction`);
    if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
    if (!arrayEquals((moduleValue.read_order_paths || []), expectedReadOrder)) errors.push(`${result.source_module} read_order_paths must match authority first-read order`);
    sourceModuleStatus = 'present_validated';
  } else if (result.package_context === 'source_repository') {
    sourceModuleStatus = 'missing_source_context';
    errors.push(`${result.source_module} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-first-slice-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    validated: {
      second_slice_plan: plan.status === 'ok',
      second_slice_status: gate.second_slice_first_slice_status === 'source_only_shadow_module_applied',
      extracted_domain_is_authority: gate.extracted_domain.id === 'authority',
      source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
      second_slice_first_slice_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      write_capable_agents_command_excluded: moduleValue.includes_write_capable_agents_command === false || sourceModuleStatus === 'not_present_installed_context_allowed',
      commands_no_write: gate.boundary.second_slice_first_slice_command_writes_files === false && gate.boundary.second_slice_first_slice_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    source_module: {
      path: result.source_module,
      present: result.source_module_present,
      status: sourceModuleStatus,
      exports: result.source_module_exports,
      value: result.source_module_value,
      source_context_required: result.package_context === 'source_repository'
    },
    second_slice_first_slice_file: {
      path: result.second_slice_first_slice_file,
      present: result.second_slice_first_slice_file_present,
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_second_slice_plan: {
      status: plan.status,
      errors: plan.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

function bundledAuthorityDomainForParity(root = packageRoot()) {
  const map = publicArchitectureMap(root);
  const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'authority');
  const domain = map.map.canonical_domains.find((item) => item.id === 'authority');
  return {
    schema: 'agent-onboard-public-bundled-authority-domain-view-001',
    domain: domain ? domain.id : null,
    facade: facade ? facade.service : null,
    service: facade ? facade.service : null,
    source: 'cli/agent-onboard.js',
    owns_commands: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.expected_owned_commands.slice(),
    excluded_commands: ['agents --write', 'agents --preview'],
    writes_files: false,
    state_writer: false,
    state_files: domain ? domain.state_files.slice() : [],
    read_order_paths: PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((item) => item.path),
    package_context: sourceContext(root).package_context
  };
}

function publicSourceModuleExtractionAuthorityBundleParity(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const sourceSlice = publicSourceModuleExtractionSecondSliceFirstSlice(root);
  const bundledAuthority = bundledAuthorityDomainForParity(root);
  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-bundle-parity-result-001',
    status: sourceSlice.status,
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    authority_bundle_parity_file: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.authority_bundle_parity_file,
    authority_bundle_parity_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.authority_bundle_parity_file)),
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.source_module,
    source_module_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.source_module)),
    source_slice_value: sourceSlice.source_module_value,
    source_slice_load_error: sourceSlice.source_module_load_error,
    bundled_authority_view: bundledAuthority,
    authority_bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function publicSourceModuleExtractionAuthorityBundleParityCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionAuthorityBundleParity(root);
  const firstSlice = publicSourceModuleExtractionSecondSliceFirstSliceCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY;
  const errors = [];
  if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `second slice first-slice: ${error}`));
  if (result.status !== 'ok') errors.push(`authority source slice module load failed: ${result.source_slice_load_error}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.parity_status !== 'authority_source_slice_matches_bundled_cli_view') errors.push('authority bundle parity status must remain authority_source_slice_matches_bundled_cli_view');
  if (gate.boundary.authority_bundle_parity_command_writes_files !== false) errors.push('architecture --authority-bundle-parity must remain no-write');
  if (gate.boundary.authority_bundle_parity_check_command_writes_files !== false) errors.push('architecture --authority-bundle-parity-check must remain no-write');
  if (gate.boundary.creates_bundle_artifact !== false) errors.push('authority bundle parity gate must not create bundle artifacts');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('authority bundle parity gate must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('authority bundle parity gate must not change CLI runtime dependency graph');
  if (gate.boundary.includes_write_capable_agents_command !== false) errors.push('authority bundle parity gate must exclude write-capable agents command extraction');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('authority bundle parity gate must preserve package allowlist');

  let parityFileStatus = 'not_present_installed_context_allowed';
  let parityFileSchema = null;
  if (result.authority_bundle_parity_file_present) {
    try {
      const parityFile = readJson(path.join(root, result.authority_bundle_parity_file));
      parityFileSchema = parityFile.schema || null;
      if (parityFile.schema !== gate.schema) errors.push(`${result.authority_bundle_parity_file} schema must be ${gate.schema}`);
      if (parityFile.source_module !== gate.source_module) errors.push(`${result.authority_bundle_parity_file} source_module must be ${gate.source_module}`);
      if (parityFile.parity_status !== gate.parity_status) errors.push(`${result.authority_bundle_parity_file} parity_status must be ${gate.parity_status}`);
      if (!parityFile.boundary || parityFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.authority_bundle_parity_file} must preserve package_allowlist_unchanged`);
      if (!parityFile.boundary || parityFile.boundary.includes_write_capable_agents_command !== false) errors.push(`${result.authority_bundle_parity_file} must exclude write-capable agents command extraction`);
      parityFileStatus = 'present_validated';
    } catch (error) {
      parityFileStatus = 'present_invalid_json';
      errors.push(`${result.authority_bundle_parity_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    parityFileStatus = 'missing_source_context';
    errors.push(`${result.authority_bundle_parity_file} must be present in source repository context`);
  }

  const sourceSlice = result.source_slice_value || null;
  const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
  const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], result.bundled_authority_view.owns_commands));
  const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === result.bundled_authority_view.domain);
  const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === result.bundled_authority_view.facade);
  const readOrderParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.read_order_paths || [], result.bundled_authority_view.read_order_paths));
  const excludedAgentsParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.includes_write_capable_agents_command === false && arrayEquals(sourceSlice.excluded_commands || [], result.bundled_authority_view.excluded_commands));
  const writeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === result.bundled_authority_view.writes_files && sourceSlice.state_writer === result.bundled_authority_view.state_writer);
  if (!domainParity) errors.push('authority source slice domain must match bundled authority domain view');
  if (!facadeParity) errors.push('authority source slice facade must match bundled authority facade view');
  if (!commandParity) errors.push('authority source slice owned commands must match bundled authority command routes');
  if (!readOrderParity) errors.push('authority source slice read order must match bundled first-read index');
  if (!excludedAgentsParity) errors.push('authority source slice must exclude write-capable agents commands');
  if (!writeParity) errors.push('authority source slice read/write boundary must match bundled authority view');

  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-bundle-parity-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    validated: {
      second_slice_first_slice: firstSlice.status === 'ok',
      authority_bundle_parity_status: gate.parity_status === 'authority_source_slice_matches_bundled_cli_view',
      source_slice_domain_matches_bundled_authority: domainParity,
      source_slice_facade_matches_bundled_authority: facadeParity,
      source_slice_commands_match_bundled_authority: commandParity,
      source_slice_read_order_matches_bundled_first_read: readOrderParity,
      write_capable_agents_command_excluded: excludedAgentsParity,
      source_slice_write_boundary_matches_bundled_authority: writeParity,
      source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
      authority_bundle_parity_file_present_or_installed_context_allowed: parityFileStatus === 'present_validated' || parityFileStatus === 'not_present_installed_context_allowed',
      authority_bundle_parity_commands_no_write: gate.boundary.authority_bundle_parity_command_writes_files === false && gate.boundary.authority_bundle_parity_check_command_writes_files === false,
      public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
      cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    source_slice: result.source_slice_value,
    bundled_authority_view: result.bundled_authority_view,
    source_authority_bundle_parity_file: {
      path: result.authority_bundle_parity_file,
      present: result.authority_bundle_parity_file_present,
      status: parityFileStatus,
      schema: parityFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_second_slice_first_slice: {
      status: firstSlice.status,
      errors: firstSlice.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

const publicArchitectureAggregateCheckService = createPublicArchitectureAggregateCheckService({
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
});
const { publicArchitectureCheck } = publicArchitectureAggregateCheckService;


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

const architectureCommandRunnerService = createPublicArchitectureCommandRunnerService({
  json,
  handlers: Object.freeze({
    publicArchitectureMap,
    publicCommandRouter,
    publicDomainServiceFacades,
    publicSourceDomainModulePartitionPlan,
    publicSourceDomainModulePartitionPlanCheck,
    publicSourceDomainExtractionRehearsal,
    publicSourceDomainExtractionRehearsalCheck,
    publicSourceExtractionGoldenOutputs,
    publicSourceExtractionGoldenOutputFreezeCheck,
    publicSourceModuleExtractionAdapterBoundary,
    publicSourceModuleExtractionAdapterBoundaryCheck,
    publicSourceModuleExtractionFirstSlice,
    publicSourceModuleExtractionFirstSliceCheck,
    publicSourceModuleExtractionBundleParity,
    publicSourceModuleExtractionBundleParityCheck,
    publicSourceModuleExtractionRuntimeBridge,
    publicSourceModuleExtractionRuntimeBridgeCheck,
    publicSourceModuleExtractionInstalledFallbackSmoke,
    publicSourceModuleExtractionInstalledFallbackSmokeCheck,
    publicSourceModuleExtractionSecondSlicePlan,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    publicSourceModuleExtractionSecondSliceFirstSlice,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck,
    publicSourceModuleExtractionAuthorityBundleParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridge,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicArchitectureM1ClosureM2Seed,
    publicArchitectureM1ClosureM2SeedCheck,
    publicWorkItemsDomainSourceExtractionPlan,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSlice,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParity,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlan,
    publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSlice,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParity,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmoke,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicSourceDomainExtractionStabilizationClosureReview,
    publicSourceDomainExtractionStabilizationClosureReviewCheck,
    publicCliRuntimeDeMonolithPlanning,
    publicCliRuntimeDeMonolithPlanningCheck,
    publicThinCliRouterSeed,
    publicThinCliRouterSeedCheck,
    publicCompatibilityCommandPortSeed,
    publicCompatibilityCommandPortSeedCheck,
    publicCoreCommandAdapterExtraction,
    publicCoreCommandAdapterExtractionCheck,
    publicPackageCommandAdapterExtraction,
    publicPackageCommandAdapterExtractionCheck,
    publicArchitectureCommandAdapterExtraction,
    publicArchitectureCommandAdapterExtractionCheck,
    publicAuthorityCommandAdapterExtraction,
    publicAuthorityCommandAdapterExtractionCheck,
    publicModularRuntimePackageInclusionPlan,
    publicModularRuntimePackageInclusionPlanCheck,
    publicPackagedRouterPortInclusion,
    publicPackagedRouterPortInclusionCheck,
    publicThinEntrypointRouterCutoverRehearsal,
    publicThinEntrypointRouterCutoverRehearsalCheck,
    publicThinEntrypointRouterCutoverApplication,
    publicThinEntrypointRouterCutoverApplicationCheck,
    publicRouterCommandAdapterDelegationExpansion,
    publicRouterCommandAdapterDelegationExpansionCheck,
    publicArchitectureCheck
  })
});

function runArchitecture(args = []) {
  return architectureCommandRunnerService.runArchitecture(args);
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

module.exports = {
  targetConfigTemplate,
  validateTargetConfig,
  validateWorkItems,
  validateWorkItemsGraph,
  appendWorkItemDryRun,
  claimWorkItemDryRun,
  closeWorkItemDryRun,
  publicContractsCatalog,
  publicContractsCheck,
  handoffEvidenceChecklist,
  participationLifecycleNextSteps,
  workItemsTemplate,
  initWriteSet,
  planWrites,
  agentsMdTemplate,
  bridgeMarkerBlock,
  bridgePlan,
  bridgeCheck,
  bridgeWrite,
  evaluateTargetBoundaryConfig,
  sourceWorkItemsLedgerCheck,
  sourceContext,
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  ciSurfaceService,
  publicReleaseCheck,
  publicCleanCompactionBaseline,
  publicCleanCompactionBaselineCheck,
  publicCleanCompactionBaselineText,
  publicClosedGateArtifactCompactionPlan,
  publicClosedGateArtifactCompactionPlanCheck,
  publicClosedGateArtifactCompactionPlanText,
  publicClosedGateArtifactCompactionDryRun,
  publicClosedGateArtifactCompactionDryRunCheck,
  publicClosedGateArtifactCompactionDryRunText,
  publicClosedGateArtifactCompactionApply,
  publicClosedGateArtifactCompactionApplyCheck,
  publicClosedGateRawArtifactPruneApply,
  publicClosedGateRawArtifactPruneApplyCheck,
  publicClosedGateArchiveReader,
  publicClosedGateArchiveReaderCheck,
  publicClosedGateArchiveReaderText,
  publicArchitectureMap,
  publicCommandRouter,
  publicCommandRouterCheck,
  publicArchitectureCheck,
  publicAuthorityFirstRead,
  publicAuthorityFirstReadCheck,
  publicAuthorityCompactIndexResult,
  publicAuthorityCompactIndexCheck,
  publicSourceDomainExtractionRehearsal,
  publicSourceDomainExtractionRehearsalCheck,
  publicSourceModuleExtractionAuthorityBundleParity,
  publicSourceModuleExtractionAuthorityBundleParityCheck,
  publicWorkItemsDomainSourceExtractionPlan,
  publicWorkItemsDomainSourceExtractionPlanCheck,
  publicWorkItemsDomainSourceExtractionFirstSlice,
  publicWorkItemsDomainSourceExtractionFirstSliceCheck,
  publicWorkItemsDomainSourceExtractionBundleParity,
  publicWorkItemsDomainSourceExtractionBundleParityCheck,
  publicWorkItemsDomainSourceExtractionRuntimeBridge,
  publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
  publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke,
  publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
  publicArchitectureCommandAdapterExtraction,
  publicArchitectureCommandAdapterExtractionCheck,
  publicAuthorityCommandAdapterExtraction,
  publicAuthorityCommandAdapterExtractionCheck,
  publicModularRuntimePackageInclusionPlan,
  publicModularRuntimePackageInclusionPlanCheck,
  publicPackagedRouterPortInclusion,
  publicPackagedRouterPortInclusionCheck,
  publicThinEntrypointRouterCutoverRehearsal,
  publicThinEntrypointRouterCutoverRehearsalCheck,
  publicThinEntrypointRouterCutoverApplication,
  publicThinEntrypointRouterCutoverApplicationCheck,
  publicRouterCommandAdapterDelegationExpansion,
  publicRouterCommandAdapterDelegationExpansionCheck,
  publicClaimsDomainSourceExtractionPlan,
  publicClaimsDomainSourceExtractionPlanCheck,
  publicClaimsDomainSourceExtractionFirstSlice,
  publicClaimsDomainSourceExtractionFirstSliceCheck,
  publicClaimsDomainSourceExtractionBundleParity,
  publicClaimsDomainSourceExtractionBundleParityCheck,
  publicClaimsDomainSourceExtractionRuntimeBridge,
  publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
  publicClaimsDomainSourceExtractionInstalledFallbackSmoke,
  publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck,
  publicInstalledPackageParitySmoke,
  publicInstalledParityArchitectureSmoke,
  publicTargetOnboardingInstalledPackageSmoke,
  publicTargetOnboardingPostPublishHandoff,
  publicTargetOnboardingPublishedAcceptance,
  publicTargetOnboardingRealTargetRepoTrial,
  targetOnboardingSurfacePlan,
  targetOnboardingDryRunFixture,
  targetOnboardingRealTargetTrial,
  targetOnboardingWriteSet,
  targetDoctor,
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
  targetRuntimeNamespaceTemplate,
  planTargetOnboardingWritesForRoot,
  TARGET_ONBOARDING_SURFACE_PLAN,
  TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
  PUBLIC_RELEASE_FIXTURE_MATRIX,
  RUNTIME_CONTRACTS,
  PUBLIC_ARCHITECTURE_MAP,
  PUBLIC_COMMAND_ROUTER,
  PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
  PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
  PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
  PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
  PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
  PUBLIC_TARGET_RUNTIME_NAMESPACE,
  PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
  PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION,
  PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING,
  PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
  PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN,
  PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL,
  PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION,
  createRuntimeCompatibilityPort
};
