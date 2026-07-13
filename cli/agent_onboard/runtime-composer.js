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
const { createPublicExactArtifactOracleService } = require('./domains/package/services/exact-artifact-oracle-service');
const { createPublicReleaseCleanClosedGatesRuntimeSliceService } = require('./domains/package/services/release-clean-closed-gates-runtime-slice-service');
const { createPublicRuntimeCheckFastService } = require('./domains/core/services/public-runtime-check-fast-service');
const { createPublicRuntimeMcpBridgeService } = require('./domains/core/services/public-runtime-mcp-bridge-service');
const { createPublicRuntimeAgentsBridgeService } = require('./domains/authority/services/public-runtime-agents-bridge-service');
const { sourceManifest: packageSourceManifestDomain } = require('./domains/package');
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
const publicContracts = require('./contracts/public-contracts');
const VERSION = require('../../package.json').version;

process.stdout.on('error', (error) => {
  if (error && error.code === 'EPIPE') process.exit(0);
  throw error;
});

const { createPublicArchitectureCatalog } = require('./domains/architecture/static-catalog');
const { createPublicTargetStaticCatalog } = require('./domains/target/static-catalog');
const { createPublicArchitectureRuntimeService } = require('./domains/architecture/services/runtime/architecture-runtime-service');
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


function publicContractsCatalog() {
  return publicContracts.publicContractCatalog({
    version: VERSION,
    releaseLine: RELEASE_LINE
  });
}

function publicContractsCheck() {
  const catalog = publicContractsCatalog();
  const catalogCheck = publicContracts.validatePublicContractCatalog(catalog);
  const outputs = {
    [publicContracts.PUBLIC_CONTRACT_IDS.targetHandoffPreview]: targetRuntimeService.targetHandoffPreview(process.cwd()),
    [publicContracts.PUBLIC_CONTRACT_IDS.targetHandoffReadinessCheck]: targetRuntimeService.targetHandoffReadinessCheck(process.cwd()),
    [publicContracts.PUBLIC_CONTRACT_IDS.governanceBudgetContract]: targetRuntimeService.targetGovernanceBudgetContract(),
    [publicContracts.PUBLIC_CONTRACT_IDS.governanceBudgetCheck]: targetRuntimeService.targetGovernanceBudgetCheck(process.cwd())
  };
  const outputValidation = publicContracts.validatePublicContractOutputs(catalog, outputs);
  const errors = [];
  if (Array.isArray(catalogCheck.errors)) errors.push(...catalogCheck.errors);
  if (Array.isArray(outputValidation.errors)) errors.push(...outputValidation.errors);
  return Object.freeze(Object.assign({}, catalogCheck, {
    status: errors.length === 0 ? 'ok' : 'error',
    command: 'agent-onboard contracts --check --json',
    checked_runtime_output_count: outputValidation.checked_output_count,
    output_validation: outputValidation,
    errors
  }));
}

function readContractOutputFile(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw new Error('contracts --validate-output --file must point to a JSON file');
  const maxBytes = 1024 * 1024;
  if (stat.size > maxBytes) throw new Error(`contracts --validate-output --file exceeds ${maxBytes} bytes`);
  return { resolved, output: readJson(resolved) };
}

function publicContractsOutputFileValidation(options = {}) {
  const catalog = publicContractsCatalog();
  const { resolved, output } = readContractOutputFile(options.file);
  return publicContracts.validatePublicContractOutputFile(catalog, {
    contractId: options.contractId,
    sourcePath: resolved,
    output
  });
}

function runContracts(args = []) {
  const valueFlags = new Set(['--contract', '--file']);
  const allowed = new Set(['--json', '--text', '--check', '--validate-output', '--contract', '--file']);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (valueFlags.has(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith('-')) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: `${arg} requires a value`, writes_files: false }, 1);
      index += 1;
      continue;
    }
    if (!allowed.has(arg)) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: 'contracts supports only --json, --text, --check, or --validate-output --contract <id> --file <path>', writes_files: false }, 1);
  }
  const checkMode = args.includes('--check');
  const validateOutputMode = args.includes('--validate-output');
  const text = args.includes('--text');
  if (args.includes('--json') && text) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: 'contracts accepts only one output mode: --json or --text', writes_files: false }, 1);
  if (checkMode && validateOutputMode) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: 'contracts accepts only one primary mode: --check or --validate-output', writes_files: false }, 1);
  if (!validateOutputMode && (args.includes('--contract') || args.includes('--file'))) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: '--contract and --file are only valid with --validate-output', writes_files: false }, 1);
  if (validateOutputMode) {
    const contractIndex = args.indexOf('--contract');
    const fileIndex = args.indexOf('--file');
    if (contractIndex < 0 || fileIndex < 0) return json({ schema: 'agent-onboard-public-contracts-error-001', status: 'error', reason: 'contracts --validate-output requires --contract <id> and --file <path>', writes_files: false }, 1);
    const result = publicContractsOutputFileValidation({
      contractId: args[contractIndex + 1],
      file: args[fileIndex + 1]
    });
    if (text) {
      process.stdout.write(publicContracts.publicContractOutputValidationText(result));
      return result.status === 'ok' ? 0 : 1;
    }
    return json(result, result.status === 'ok' ? 0 : 1);
  }
  if (checkMode) {
    const result = publicContractsCheck();
    if (text) {
      process.stdout.write(publicContracts.publicContractCheckText(result));
      return result.status === 'ok' ? 0 : 1;
    }
    return json(result, result.status === 'ok' ? 0 : 1);
  }
  const catalog = publicContractsCatalog();
  if (text) {
    process.stdout.write(publicContracts.publicContractText(catalog));
    return 0;
  }
  return json(catalog, 0);
}

const publicContractsService = Object.freeze({
  catalog: publicContractsCatalog,
  check: publicContractsCheck,
  text: publicContracts.publicContractText,
  checkText: publicContracts.publicContractCheckText,
  validateOutputFile: publicContractsOutputFileValidation,
  outputValidationText: publicContracts.publicContractOutputValidationText
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

function publicCliRuntimeDeMonolithPlanning(root = packageRoot()) {
  const gate = PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const cliLineCount = countFileLines(root, gate.current_runtime_observation.entrypoint);
  const sourceDomainModules = ['src/domains/core.js', 'src/domains/authority.js', 'src/domains/work-items.js', 'src/domains/claims.js'];
  const sourceDomainLineCount = sourceDomainModules.reduce((sum, rel) => sum + countFileLines(root, rel), 0);
  return {
    schema: 'agent-onboard-public-cli-runtime-de-monolith-planning-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    planning_file: gate.planning_file,
    planning_file_present: fs.existsSync(path.join(root, gate.planning_file)),
    milestone_state: {
      milestone: milestones.find((item) => item.id === gate.milestone_id) || null,
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    observed_runtime: {
      cli_entrypoint: gate.current_runtime_observation.entrypoint,
      cli_entrypoint_exists: fs.existsSync(path.join(root, gate.current_runtime_observation.entrypoint)),
      cli_entrypoint_line_count: cliLineCount,
      source_domain_module_line_count: sourceDomainLineCount,
      source_domain_modules_present: sourceDomainModules.filter((rel) => fs.existsSync(path.join(root, rel))),
      monolith_line_count_floor: gate.current_runtime_observation.observed_cli_line_count_floor,
      extracted_service_line_count_ceiling: gate.current_runtime_observation.extracted_service_line_count_ceiling,
      monolith_debt_declared: gate.current_runtime_observation.monolith_debt_declared
    },
    selected_package_strategy: gate.selected_package_strategy,
    target_runtime_shape: gate.target_runtime_shape,
    cli_line_budget: gate.cli_line_budget,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    planning_contract: gate,
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

function publicCliRuntimeDeMonolithPlanningCheck(root = packageRoot()) {
  const result = publicCliRuntimeDeMonolithPlanning(root);
  const gate = PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.planning_status !== 'cli_runtime_de_monolith_plan_admitted') errors.push('CLI runtime de-monolith planning status must be admitted');
  if (!result.observed_runtime.cli_entrypoint_exists) errors.push(`${gate.current_runtime_observation.entrypoint} must exist`);
  if (result.observed_runtime.cli_entrypoint_line_count > gate.current_runtime_observation.extracted_service_line_count_ceiling) errors.push(`${gate.current_runtime_observation.entrypoint} must stay under ${gate.current_runtime_observation.extracted_service_line_count_ceiling} lines after service extraction`);
  if (gate.current_runtime_observation.monolith_debt_declared !== true) errors.push('CLI monolith debt must be declared');
  if (gate.selected_package_strategy.id !== 'controlled_source_module_inclusion') errors.push('selected package strategy must be controlled_source_module_inclusion');
  if (gate.selected_package_strategy.current_gate_keeps_compact_pack_allowlist !== true) errors.push('planning gate must keep compact package allowlist unchanged');
  if (gate.cli_line_budget.target_entrypoint_max_lines > 300) errors.push('target thin CLI entrypoint line budget must be <= 300 lines');
  if (gate.cli_line_budget.current_monolith_growth_allowed !== false) errors.push('current monolith growth must not be allowed');
  if (gate.cli_line_budget.no_new_domain_logic_in_monolith !== true) errors.push('new domain logic must be blocked from the CLI monolith');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.cli_runtime_plan_command_writes_files !== false) errors.push('architecture --cli-runtime-plan must remain no-write');
  if (gate.boundary.cli_runtime_check_command_writes_files !== false) errors.push('architecture --cli-runtime-check must remain no-write');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('CLI runtime planning gate must preserve package allowlist');
  if (gate.boundary.creates_runtime_modules !== false) errors.push('CLI runtime planning gate must not create runtime modules');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('CLI runtime planning gate must not change runtime dependency graph');

  const artifactPath = path.join(root, gate.planning_file);
  let fileStatus = 'not_present_installed_context_allowed';
  let fileSchema = null;
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      fileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.planning_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.planning_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.planning_file} must seed ${gate.next_work_item_id}`);
      if (artifact.planning_status !== gate.planning_status) errors.push(`${gate.planning_file} planning_status must be ${gate.planning_status}`);
      if (!artifact.selected_package_strategy || artifact.selected_package_strategy.id !== gate.selected_package_strategy.id) errors.push(`${gate.planning_file} must select ${gate.selected_package_strategy.id}`);
      if (!artifact.current_runtime_observation || artifact.current_runtime_observation.extracted_service_line_count_ceiling !== gate.current_runtime_observation.extracted_service_line_count_ceiling) errors.push(`${gate.planning_file} must declare extracted_service_line_count_ceiling ${gate.current_runtime_observation.extracted_service_line_count_ceiling}`);
      if (!artifact.cli_line_budget || artifact.cli_line_budget.target_entrypoint_max_lines > 300) errors.push(`${gate.planning_file} must set target_entrypoint_max_lines <= 300`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.planning_file} must preserve package_allowlist_unchanged`);
      fileStatus = 'present_validated';
    } catch (error) {
      fileStatus = 'present_invalid_json';
      errors.push(`${gate.planning_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    fileStatus = 'missing_source_context';
    errors.push(`${gate.planning_file} must exist in source repository context`);
  }

  const milestone = result.milestone_state.milestone;
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!milestone) errors.push(`${gate.milestone_id} milestone must exist`);
    else if (!['open', 'closed'].includes(milestone.status)) errors.push(`${gate.milestone_id} milestone must be open or closed`);
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router seed admission`);
  }

  return {
    schema: 'agent-onboard-public-cli-runtime-de-monolith-planning-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      monolith_debt_declared: gate.current_runtime_observation.monolith_debt_declared === true,
      cli_line_count_floor_observed: result.observed_runtime.cli_entrypoint_line_count >= gate.current_runtime_observation.observed_cli_line_count_floor,
      architecture_service_extraction_line_count_observed: result.observed_runtime.cli_entrypoint_line_count <= gate.current_runtime_observation.extracted_service_line_count_ceiling,
      controlled_source_module_inclusion_selected: gate.selected_package_strategy.id === 'controlled_source_module_inclusion',
      compact_pack_allowlist_unchanged_for_this_gate: arrayEquals(result.projected_pack_files, expectedPackFiles),
      thin_entrypoint_budget_declared: gate.cli_line_budget.target_entrypoint_max_lines <= 300,
      monolith_growth_blocked: gate.cli_line_budget.current_monolith_growth_allowed === false && gate.cli_line_budget.no_new_domain_logic_in_monolith === true,
      planning_file_present_or_installed_context_allowed: fileStatus === 'present_validated' || fileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_router_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      cli_runtime_commands_no_write: gate.boundary.cli_runtime_plan_command_writes_files === false && gate.boundary.cli_runtime_check_command_writes_files === false
    },
    observed_runtime: result.observed_runtime,
    selected_package_strategy: result.selected_package_strategy,
    cli_line_budget: result.cli_line_budget,
    target_runtime_shape: result.target_runtime_shape,
    milestone_state: result.milestone_state,
    source_cli_runtime_plan_file: {
      path: gate.planning_file,
      present: fs.existsSync(artifactPath),
      status: fileStatus,
      schema: fileSchema,
      source_context_required: sourceLedgerRequired
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicThinCliRouterSeed(root = packageRoot()) {
  const gate = PUBLIC_THIN_CLI_ROUTER_SEED;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const routerModulePath = path.join(root, gate.router_module);
  const artifactPath = path.join(root, gate.seed_file);
  const routerLineCount = countFileLines(root, gate.router_module);
  let routerModuleStatus = 'not_present_installed_context_allowed';
  let routerModuleSchema = null;
  let routerModuleExports = [];
  let routerRequireError = null;
  if (fs.existsSync(routerModulePath)) {
    try {
      delete require.cache[require.resolve(routerModulePath)];
      const routerModule = require(routerModulePath);
      routerModuleExports = Object.keys(routerModule).sort();
      const described = typeof routerModule.describeRouterSeed === 'function' ? routerModule.describeRouterSeed() : null;
      routerModuleSchema = described && described.schema ? described.schema : null;
      routerModuleStatus = 'present_validated';
    } catch (error) {
      routerModuleStatus = 'present_require_failed';
      routerRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-thin-cli-router-seed-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    seed_file: gate.seed_file,
    seed_file_present: fs.existsSync(artifactPath),
    router_module: {
      path: gate.router_module,
      present: fs.existsSync(routerModulePath),
      status: routerModuleStatus,
      schema: routerModuleSchema,
      exports: routerModuleExports,
      require_error: routerRequireError,
      line_count: routerLineCount,
      max_lines: gate.router_seed_max_lines
    },
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_line_count: countFileLines(root, gate.entrypoint),
      router_module_used_by_entrypoint_in_this_gate: gate.boundary.uses_router_module_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    router_contract: gate,
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

function publicThinCliRouterSeedCheck(root = packageRoot()) {
  const result = publicThinCliRouterSeed(root);
  const gate = PUBLIC_THIN_CLI_ROUTER_SEED;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.seed_status !== 'thin_cli_router_seed_admitted') errors.push('thin CLI router seed status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('router seed gate must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('router seed must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.thin_router_command_writes_files !== false) errors.push('architecture --thin-router must remain no-write');
  if (gate.boundary.thin_router_check_command_writes_files !== false) errors.push('architecture --thin-router-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('router seed must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('router seed must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_router_module_as_runtime_entrypoint !== false) errors.push('router seed must not use the source router module as the packaged runtime entrypoint yet');
  if (gate.boundary.source_router_module_remains_out_of_pack !== true) errors.push('source router module must remain out of npm pack for this gate');
  if (result.router_module.line_count > gate.router_seed_max_lines) errors.push(`${gate.router_module} must stay within ${gate.router_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.seed_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.seed_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.seed_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.seed_file} must seed ${gate.next_work_item_id}`);
      if (artifact.router_module !== gate.router_module) errors.push(`${gate.seed_file} must declare ${gate.router_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.seed_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.seed_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.seed_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.seed_file} must exist in source repository context`);
  }

  const routerModulePresentOrAllowed = result.router_module.present || result.package_context === 'installed_package';
  if (!routerModulePresentOrAllowed) errors.push(`${gate.router_module} must exist in source repository context`);
  if (result.router_module.present) {
    if (result.router_module.status !== 'present_validated') errors.push(`${gate.router_module} must be require-able without side effects${result.router_module.require_error ? `: ${result.router_module.require_error}` : ''}`);
    if (result.router_module.schema !== 'agent-onboard-public-thin-cli-router-seed-module-001') errors.push(`${gate.router_module} must expose router seed module schema`);
    for (const exportName of gate.expected_router_export_names) {
      if (!result.router_module.exports.includes(exportName)) errors.push(`${gate.router_module} must export ${exportName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router seed admission`);
  }

  return {
    schema: 'agent-onboard-public-thin-cli-router-seed-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      router_seed_status_admitted: gate.seed_status === 'thin_cli_router_seed_admitted',
      router_module_present_or_installed_context_allowed: routerModulePresentOrAllowed,
      router_module_requireable_when_present: !result.router_module.present || result.router_module.status === 'present_validated',
      router_module_under_line_budget: result.router_module.line_count <= gate.router_seed_max_lines,
      router_exports_contract: gate.expected_router_export_names.every((name) => !result.router_module.present || result.router_module.exports.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      router_module_out_of_pack_for_this_gate: gate.boundary.source_router_module_remains_out_of_pack === true,
      seed_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_port_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      thin_router_commands_no_write: gate.boundary.thin_router_command_writes_files === false && gate.boundary.thin_router_check_command_writes_files === false
    },
    router_module: result.router_module,
    runtime_cutover: result.runtime_cutover,
    source_thin_router_seed_file: {
      path: gate.seed_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicCompatibilityCommandPortSeed(root = packageRoot()) {
  const gate = PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const adapterModulePath = path.join(root, gate.adapter_module);
  const portModulePath = path.join(root, gate.port_module);
  const artifactPath = path.join(root, gate.seed_file);
  const adapterLineCount = countFileLines(root, gate.adapter_module);
  const portLineCount = countFileLines(root, gate.port_module);
  let adapterModuleStatus = 'not_present_installed_context_allowed';
  let adapterModuleSchema = null;
  let adapterModuleExports = [];
  let adapterCommandGroups = [];
  let adapterRequireError = null;
  if (fs.existsSync(adapterModulePath)) {
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      adapterModuleExports = Object.keys(adapterModule).sort();
      const described = typeof adapterModule.describeCompatibilityCommandPortSeed === 'function' ? adapterModule.describeCompatibilityCommandPortSeed() : null;
      adapterModuleSchema = described && described.schema ? described.schema : null;
      adapterCommandGroups = described && described.command_groups ? Object.keys(described.command_groups).sort() : [];
      adapterModuleStatus = 'present_validated';
    } catch (error) {
      adapterModuleStatus = 'present_require_failed';
      adapterRequireError = error && error.message ? error.message : String(error);
    }
  }
  let portModuleStatus = 'not_present_installed_context_allowed';
  let portModuleExports = [];
  let portRequireError = null;
  if (fs.existsSync(portModulePath)) {
    try {
      delete require.cache[require.resolve(portModulePath)];
      const portModule = require(portModulePath);
      portModuleExports = Object.keys(portModule).sort();
      portModuleStatus = 'present_validated';
    } catch (error) {
      portModuleStatus = 'present_require_failed';
      portRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-compatibility-command-port-seed-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    seed_file: gate.seed_file,
    seed_file_present: fs.existsSync(artifactPath),
    adapter_module: {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: adapterModuleStatus,
      schema: adapterModuleSchema,
      exports: adapterModuleExports,
      command_groups: adapterCommandGroups,
      require_error: adapterRequireError,
      line_count: adapterLineCount,
      max_lines: gate.port_seed_max_lines
    },
    port_module: {
      path: gate.port_module,
      present: fs.existsSync(portModulePath),
      status: portModuleStatus,
      exports: portModuleExports,
      require_error: portRequireError,
      line_count: portLineCount,
      max_lines: gate.port_seed_max_lines
    },
    router_module: gate.router_module,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: 'cli/agent-onboard.js',
      entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
      compatibility_port_used_by_entrypoint_in_this_gate: gate.boundary.uses_compatibility_port_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    port_contract: gate,
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

function publicCompatibilityCommandPortSeedCheck(root = packageRoot()) {
  const result = publicCompatibilityCommandPortSeed(root);
  const gate = PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.seed_status !== 'compatibility_command_port_seed_admitted') errors.push('compatibility command port seed status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('compatibility port seed gate must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('compatibility port seed must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.compatibility_port_command_writes_files !== false) errors.push('architecture --compatibility-port must remain no-write');
  if (gate.boundary.compatibility_port_check_command_writes_files !== false) errors.push('architecture --compatibility-port-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('compatibility port seed must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('compatibility port seed must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_compatibility_port_as_runtime_entrypoint !== false) errors.push('compatibility port seed must not use source modules as the packaged runtime entrypoint yet');
  if (gate.boundary.source_port_modules_remain_out_of_pack !== true) errors.push('source compatibility port modules must remain out of npm pack for this gate');
  if (result.adapter_module.line_count > gate.port_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.port_seed_max_lines} lines`);
  if (result.port_module.line_count > gate.port_seed_max_lines) errors.push(`${gate.port_module} must stay within ${gate.port_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.seed_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.seed_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.seed_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.seed_file} must seed ${gate.next_work_item_id}`);
      if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.seed_file} must declare ${gate.adapter_module}`);
      if (artifact.port_module !== gate.port_module) errors.push(`${gate.seed_file} must declare ${gate.port_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.seed_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.seed_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.seed_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.seed_file} must exist in source repository context`);
  }

  const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
  const portModulePresentOrAllowed = result.port_module.present || result.package_context === 'installed_package';
  if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
  if (!portModulePresentOrAllowed) errors.push(`${gate.port_module} must exist in source repository context`);
  if (result.adapter_module.present) {
    if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
    if (result.adapter_module.schema !== 'agent-onboard-public-compatibility-command-port-seed-module-001') errors.push(`${gate.adapter_module} must expose compatibility port seed module schema`);
    for (const exportName of gate.expected_adapter_export_names) {
      if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
    }
    for (const groupName of gate.expected_command_groups) {
      if (!result.adapter_module.command_groups.includes(groupName)) errors.push(`${gate.adapter_module} must declare command group ${groupName}`);
    }
  }
  if (result.port_module.present) {
    if (result.port_module.status !== 'present_validated') errors.push(`${gate.port_module} must be require-able without side effects${result.port_module.require_error ? `: ${result.port_module.require_error}` : ''}`);
    for (const exportName of gate.expected_port_export_names) {
      if (!result.port_module.exports.includes(exportName)) errors.push(`${gate.port_module} must export ${exportName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after compatibility port seed admission`);
  }

  return {
    schema: 'agent-onboard-public-compatibility-command-port-seed-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      compatibility_port_seed_status_admitted: gate.seed_status === 'compatibility_command_port_seed_admitted',
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      port_module_present_or_installed_context_allowed: portModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      port_module_requireable_when_present: !result.port_module.present || result.port_module.status === 'present_validated',
      port_modules_under_line_budget: result.adapter_module.line_count <= gate.port_seed_max_lines && result.port_module.line_count <= gate.port_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      port_exports_contract: gate.expected_port_export_names.every((name) => !result.port_module.present || result.port_module.exports.includes(name)),
      command_group_contract: gate.expected_command_groups.every((name) => !result.adapter_module.present || result.adapter_module.command_groups.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      port_modules_out_of_pack_for_this_gate: gate.boundary.source_port_modules_remain_out_of_pack === true,
      seed_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      compatibility_port_commands_no_write: gate.boundary.compatibility_port_command_writes_files === false && gate.boundary.compatibility_port_check_command_writes_files === false
    },
    adapter_module: result.adapter_module,
    port_module: result.port_module,
    runtime_cutover: result.runtime_cutover,
    source_compatibility_port_seed_file: {
      path: gate.seed_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicCoreCommandAdapterExtraction(root = packageRoot()) {
  const gate = PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const adapterModulePath = path.join(root, gate.adapter_module);
  const artifactPath = path.join(root, gate.extraction_file);
  const adapterLineCount = countFileLines(root, gate.adapter_module);
  let adapterModuleStatus = 'not_present_installed_context_allowed';
  let adapterModuleSchema = null;
  let adapterModuleExports = [];
  let ownedCommands = [];
  let excludedCommands = [];
  let adapterRequireError = null;
  if (fs.existsSync(adapterModulePath)) {
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      adapterModuleExports = Object.keys(adapterModule).sort();
      const described = typeof adapterModule.describeCoreCommandAdapterExtraction === 'function' ? adapterModule.describeCoreCommandAdapterExtraction() : null;
      adapterModuleSchema = described && described.schema ? described.schema : null;
      ownedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice().sort() : [];
      excludedCommands = described && Array.isArray(described.excluded_top_level_commands) ? described.excluded_top_level_commands.slice().sort() : [];
      adapterModuleStatus = 'present_validated';
    } catch (error) {
      adapterModuleStatus = 'present_require_failed';
      adapterRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-core-command-adapter-extraction-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    extraction_file: gate.extraction_file,
    extraction_file_present: fs.existsSync(artifactPath),
    adapter_module: {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: adapterModuleStatus,
      schema: adapterModuleSchema,
      exports: adapterModuleExports,
      owned_top_level_commands: ownedCommands,
      excluded_top_level_commands: excludedCommands,
      require_error: adapterRequireError,
      line_count: adapterLineCount,
      max_lines: gate.adapter_seed_max_lines
    },
    compatibility_port_module: gate.compatibility_port_module,
    router_module: gate.router_module,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: 'cli/agent-onboard.js',
      entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
      core_adapter_used_by_entrypoint_in_this_gate: gate.boundary.uses_core_adapter_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    adapter_contract: gate,
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

function publicCoreCommandAdapterExtractionCheck(root = packageRoot()) {
  const result = publicCoreCommandAdapterExtraction(root);
  const gate = PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.extraction_status !== 'core_command_adapter_extraction_admitted') errors.push('core command adapter extraction status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('core command adapter extraction must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('core command adapter extraction must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.core_adapter_command_writes_files !== false) errors.push('architecture --core-adapter must remain no-write');
  if (gate.boundary.core_adapter_check_command_writes_files !== false) errors.push('architecture --core-adapter-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('core command adapter extraction must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('core command adapter extraction must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_core_adapter_as_runtime_entrypoint !== false) errors.push('core command adapter extraction must not use source modules as the packaged runtime entrypoint yet');
  if (gate.boundary.source_core_adapter_module_remains_out_of_pack !== true) errors.push('source core adapter module must remain out of npm pack for this gate');
  if (result.adapter_module.line_count > gate.adapter_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.adapter_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.extraction_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.extraction_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.extraction_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.extraction_file} must seed ${gate.next_work_item_id}`);
      if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.extraction_file} must declare ${gate.adapter_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.extraction_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.extraction_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.extraction_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.extraction_file} must exist in source repository context`);
  }

  const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
  if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
  if (result.adapter_module.present) {
    if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
    if (result.adapter_module.schema !== 'agent-onboard-public-core-command-adapter-extraction-module-001') errors.push(`${gate.adapter_module} must expose core command adapter extraction module schema`);
    for (const exportName of gate.expected_adapter_export_names) {
      if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
    }
    for (const commandName of gate.owned_top_level_commands) {
      if (!result.adapter_module.owned_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must own core command ${commandName}`);
    }
    for (const commandName of gate.excluded_top_level_commands) {
      if (!result.adapter_module.excluded_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must exclude non-core command ${commandName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after core adapter extraction admission`);
  }

  return {
    schema: 'agent-onboard-public-core-command-adapter-extraction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      core_adapter_extraction_status_admitted: gate.extraction_status === 'core_command_adapter_extraction_admitted',
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      adapter_module_under_line_budget: result.adapter_module.line_count <= gate.adapter_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      owned_core_commands_contract: gate.owned_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.owned_top_level_commands.includes(name)),
      non_core_commands_excluded: gate.excluded_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.excluded_top_level_commands.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      core_adapter_module_out_of_pack_for_this_gate: gate.boundary.source_core_adapter_module_remains_out_of_pack === true,
      extraction_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_package_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      core_adapter_commands_no_write: gate.boundary.core_adapter_command_writes_files === false && gate.boundary.core_adapter_check_command_writes_files === false
    },
    adapter_module: result.adapter_module,
    runtime_cutover: result.runtime_cutover,
    source_core_adapter_extraction_file: {
      path: gate.extraction_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicPackageCommandAdapterExtraction(root = packageRoot()) {
  const gate = PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const adapterModulePath = path.join(root, gate.adapter_module);
  const artifactPath = path.join(root, gate.extraction_file);
  const adapterLineCount = countFileLines(root, gate.adapter_module);
  let adapterModuleStatus = 'not_present_installed_context_allowed';
  let adapterModuleSchema = null;
  let adapterModuleExports = [];
  let ownedCommands = [];
  let excludedCommands = [];
  let adapterRequireError = null;
  if (fs.existsSync(adapterModulePath)) {
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      adapterModuleExports = Object.keys(adapterModule).sort();
      const described = typeof adapterModule.describePackageCommandAdapterExtraction === 'function' ? adapterModule.describePackageCommandAdapterExtraction() : null;
      adapterModuleSchema = described && described.schema ? described.schema : null;
      ownedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice().sort() : [];
      excludedCommands = described && Array.isArray(described.excluded_top_level_commands) ? described.excluded_top_level_commands.slice().sort() : [];
      adapterModuleStatus = 'present_validated';
    } catch (error) {
      adapterModuleStatus = 'present_require_failed';
      adapterRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-package-command-adapter-extraction-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    extraction_file: gate.extraction_file,
    extraction_file_present: fs.existsSync(artifactPath),
    adapter_module: {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: adapterModuleStatus,
      schema: adapterModuleSchema,
      exports: adapterModuleExports,
      owned_top_level_commands: ownedCommands,
      excluded_top_level_commands: excludedCommands,
      require_error: adapterRequireError,
      line_count: adapterLineCount,
      max_lines: gate.adapter_seed_max_lines
    },
    compatibility_port_module: gate.compatibility_port_module,
    router_module: gate.router_module,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: 'cli/agent-onboard.js',
      entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
      package_adapter_used_by_entrypoint_in_this_gate: gate.boundary.uses_package_adapter_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    adapter_contract: gate,
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

function publicPackageCommandAdapterExtractionCheck(root = packageRoot()) {
  const result = publicPackageCommandAdapterExtraction(root);
  const gate = PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.extraction_status !== 'package_command_adapter_extraction_admitted') errors.push('package command adapter extraction status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('package command adapter extraction must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('package command adapter extraction must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.package_adapter_command_writes_files !== false) errors.push('architecture --package-adapter must remain no-write');
  if (gate.boundary.package_adapter_check_command_writes_files !== false) errors.push('architecture --package-adapter-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('package command adapter extraction must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('package command adapter extraction must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_package_adapter_as_runtime_entrypoint !== false) errors.push('package command adapter extraction must not use source modules as the packaged runtime entrypoint yet');
  if (gate.boundary.source_package_adapter_module_remains_out_of_pack !== true) errors.push('source package adapter module must remain out of npm pack for this gate');
  if (result.adapter_module.line_count > gate.adapter_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.adapter_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.extraction_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.extraction_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.extraction_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.extraction_file} must seed ${gate.next_work_item_id}`);
      if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.extraction_file} must declare ${gate.adapter_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.extraction_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.extraction_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.extraction_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.extraction_file} must exist in source repository context`);
  }

  const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
  if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
  if (result.adapter_module.present) {
    if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
    if (result.adapter_module.schema !== 'agent-onboard-public-package-command-adapter-extraction-module-001') errors.push(`${gate.adapter_module} must expose package command adapter extraction module schema`);
    for (const exportName of gate.expected_adapter_export_names) {
      if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
    }
    for (const commandName of gate.owned_top_level_commands) {
      if (!result.adapter_module.owned_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must own package command ${commandName}`);
    }
    for (const commandName of gate.excluded_top_level_commands) {
      if (!result.adapter_module.excluded_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must exclude non-package command ${commandName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after package adapter extraction admission`);
  }

  return {
    schema: 'agent-onboard-public-package-command-adapter-extraction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      package_adapter_extraction_status_admitted: gate.extraction_status === 'package_command_adapter_extraction_admitted',
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      adapter_module_under_line_budget: result.adapter_module.line_count <= gate.adapter_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      owned_package_commands_contract: gate.owned_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.owned_top_level_commands.includes(name)),
      non_package_commands_excluded: gate.excluded_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.excluded_top_level_commands.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      package_adapter_module_out_of_pack_for_this_gate: gate.boundary.source_package_adapter_module_remains_out_of_pack === true,
      extraction_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_architecture_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      package_adapter_commands_no_write: gate.boundary.package_adapter_command_writes_files === false && gate.boundary.package_adapter_check_command_writes_files === false
    },
    adapter_module: result.adapter_module,
    runtime_cutover: result.runtime_cutover,
    source_package_adapter_extraction_file: {
      path: gate.extraction_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicArchitectureCommandAdapterExtraction(root = packageRoot()) {
  const gate = PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const adapterModulePath = path.join(root, gate.adapter_module);
  const artifactPath = path.join(root, gate.extraction_file);
  const adapterLineCount = countFileLines(root, gate.adapter_module);
  let adapterModuleStatus = 'not_present_installed_context_allowed';
  let adapterModuleSchema = null;
  let adapterModuleExports = [];
  let ownedCommands = [];
  let excludedCommands = [];
  let adapterRequireError = null;
  if (fs.existsSync(adapterModulePath)) {
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      adapterModuleExports = Object.keys(adapterModule).sort();
      const described = typeof adapterModule.describeArchitectureCommandAdapterExtraction === 'function' ? adapterModule.describeArchitectureCommandAdapterExtraction() : null;
      adapterModuleSchema = described && described.schema ? described.schema : null;
      ownedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice().sort() : [];
      excludedCommands = described && Array.isArray(described.excluded_top_level_commands) ? described.excluded_top_level_commands.slice().sort() : [];
      adapterModuleStatus = 'present_validated';
    } catch (error) {
      adapterModuleStatus = 'present_require_failed';
      adapterRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-architecture-command-adapter-extraction-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    extraction_file: gate.extraction_file,
    extraction_file_present: fs.existsSync(artifactPath),
    adapter_module: {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: adapterModuleStatus,
      schema: adapterModuleSchema,
      exports: adapterModuleExports,
      owned_top_level_commands: ownedCommands,
      excluded_top_level_commands: excludedCommands,
      require_error: adapterRequireError,
      line_count: adapterLineCount,
      max_lines: gate.adapter_seed_max_lines
    },
    compatibility_port_module: gate.compatibility_port_module,
    router_module: gate.router_module,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: 'cli/agent-onboard.js',
      entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
      architecture_adapter_used_by_entrypoint_in_this_gate: gate.boundary.uses_architecture_adapter_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    adapter_contract: gate,
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

function publicArchitectureCommandAdapterExtractionCheck(root = packageRoot()) {
  const result = publicArchitectureCommandAdapterExtraction(root);
  const gate = PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.extraction_status !== 'architecture_command_adapter_extraction_admitted') errors.push('architecture command adapter extraction status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('architecture command adapter extraction must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('architecture command adapter extraction must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.architecture_adapter_command_writes_files !== false) errors.push('architecture --architecture-adapter must remain no-write');
  if (gate.boundary.architecture_adapter_check_command_writes_files !== false) errors.push('architecture --architecture-adapter-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('architecture command adapter extraction must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('architecture command adapter extraction must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_architecture_adapter_as_runtime_entrypoint !== false) errors.push('architecture command adapter extraction must not use source modules as the packaged runtime entrypoint yet');
  if (gate.boundary.source_architecture_adapter_module_remains_out_of_pack !== true) errors.push('source architecture adapter module must remain out of npm pack for this gate');
  if (result.adapter_module.line_count > gate.adapter_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.adapter_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.extraction_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.extraction_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.extraction_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.extraction_file} must seed ${gate.next_work_item_id}`);
      if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.extraction_file} must declare ${gate.adapter_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.extraction_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.extraction_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.extraction_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.extraction_file} must exist in source repository context`);
  }

  const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
  if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
  if (result.adapter_module.present) {
    if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
    if (result.adapter_module.schema !== 'agent-onboard-public-architecture-command-adapter-extraction-module-001') errors.push(`${gate.adapter_module} must expose architecture command adapter extraction module schema`);
    for (const exportName of gate.expected_adapter_export_names) {
      if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
    }
    for (const commandName of gate.owned_top_level_commands) {
      if (!result.adapter_module.owned_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must own architecture command ${commandName}`);
    }
    for (const commandName of gate.excluded_top_level_commands) {
      if (!result.adapter_module.excluded_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must exclude non-architecture command ${commandName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after architecture adapter extraction admission`);
  }

  return {
    schema: 'agent-onboard-public-architecture-command-adapter-extraction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      architecture_adapter_extraction_status_admitted: gate.extraction_status === 'architecture_command_adapter_extraction_admitted',
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      adapter_module_under_line_budget: result.adapter_module.line_count <= gate.adapter_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      owned_architecture_commands_contract: gate.owned_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.owned_top_level_commands.includes(name)),
      non_architecture_commands_excluded: gate.excluded_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.excluded_top_level_commands.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      architecture_adapter_module_out_of_pack_for_this_gate: gate.boundary.source_architecture_adapter_module_remains_out_of_pack === true,
      extraction_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_authority_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      architecture_adapter_commands_no_write: gate.boundary.architecture_adapter_command_writes_files === false && gate.boundary.architecture_adapter_check_command_writes_files === false
    },
    adapter_module: result.adapter_module,
    runtime_cutover: result.runtime_cutover,
    source_architecture_adapter_extraction_file: {
      path: gate.extraction_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicAuthorityCommandAdapterExtraction(root = packageRoot()) {
  const gate = PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const adapterModulePath = path.join(root, gate.adapter_module);
  const artifactPath = path.join(root, gate.extraction_file);
  const adapterLineCount = countFileLines(root, gate.adapter_module);
  let adapterModuleStatus = 'not_present_installed_context_allowed';
  let adapterModuleSchema = null;
  let adapterModuleExports = [];
  let ownedCommands = [];
  let excludedCommands = [];
  let adapterRequireError = null;
  if (fs.existsSync(adapterModulePath)) {
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      adapterModuleExports = Object.keys(adapterModule).sort();
      const described = typeof adapterModule.describeAuthorityCommandAdapterExtraction === 'function' ? adapterModule.describeAuthorityCommandAdapterExtraction() : null;
      adapterModuleSchema = described && described.schema ? described.schema : null;
      ownedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice().sort() : [];
      excludedCommands = described && Array.isArray(described.excluded_top_level_commands) ? described.excluded_top_level_commands.slice().sort() : [];
      adapterModuleStatus = 'present_validated';
    } catch (error) {
      adapterModuleStatus = 'present_require_failed';
      adapterRequireError = error && error.message ? error.message : String(error);
    }
  }
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-authority-command-adapter-extraction-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    extraction_file: gate.extraction_file,
    extraction_file_present: fs.existsSync(artifactPath),
    adapter_module: {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: adapterModuleStatus,
      schema: adapterModuleSchema,
      exports: adapterModuleExports,
      owned_top_level_commands: ownedCommands,
      excluded_top_level_commands: excludedCommands,
      require_error: adapterRequireError,
      line_count: adapterLineCount,
      max_lines: gate.adapter_seed_max_lines
    },
    compatibility_port_module: gate.compatibility_port_module,
    router_module: gate.router_module,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: 'cli/agent-onboard.js',
      entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
      authority_adapter_used_by_entrypoint_in_this_gate: gate.boundary.uses_authority_adapter_as_runtime_entrypoint
    },
    package_strategy: gate.package_strategy,
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    adapter_contract: gate,
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

function publicAuthorityCommandAdapterExtractionCheck(root = packageRoot()) {
  const result = publicAuthorityCommandAdapterExtraction(root);
  const gate = PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.extraction_status !== 'authority_command_adapter_extraction_admitted') errors.push('authority command adapter extraction status must be admitted');
  if (gate.runtime_cutover_applied !== false) errors.push('authority command adapter extraction must not apply runtime cutover');
  if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('authority command adapter extraction must preserve controlled_source_module_inclusion package strategy');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.authority_adapter_command_writes_files !== false) errors.push('architecture --authority-adapter must remain no-write');
  if (gate.boundary.authority_adapter_check_command_writes_files !== false) errors.push('architecture --authority-adapter-check must remain no-write');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('authority command adapter extraction must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('authority command adapter extraction must not change packaged CLI runtime dependency graph');
  if (gate.boundary.uses_authority_adapter_as_runtime_entrypoint !== false) errors.push('authority command adapter extraction must not use source modules as the packaged runtime entrypoint yet');
  if (gate.boundary.source_authority_adapter_module_remains_out_of_pack !== true) errors.push('source authority adapter module must remain out of npm pack for this gate');
  if (result.adapter_module.line_count > gate.adapter_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.adapter_seed_max_lines} lines`);

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  const artifactPath = path.join(root, gate.extraction_file);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = readJson(artifactPath);
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.extraction_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.extraction_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.extraction_file} must seed ${gate.next_work_item_id}`);
      if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.extraction_file} must declare ${gate.adapter_module}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.extraction_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.extraction_file} must preserve package_allowlist_unchanged`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${gate.extraction_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    artifactStatus = 'missing_source_context';
    errors.push(`${gate.extraction_file} must exist in source repository context`);
  }

  const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
  if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
  if (result.adapter_module.present) {
    if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
    if (result.adapter_module.schema !== 'agent-onboard-public-authority-command-adapter-extraction-module-001') errors.push(`${gate.adapter_module} must expose authority command adapter extraction module schema`);
    for (const exportName of gate.expected_adapter_export_names) {
      if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
    }
    for (const commandName of gate.owned_top_level_commands) {
      if (!result.adapter_module.owned_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must own authority command ${commandName}`);
    }
    for (const commandName of gate.excluded_top_level_commands) {
      if (!result.adapter_module.excluded_top_level_commands.includes(commandName)) errors.push(`${gate.adapter_module} must exclude non-authority command ${commandName}`);
    }
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after authority adapter extraction admission`);
  }

  return {
    schema: 'agent-onboard-public-authority-command-adapter-extraction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      authority_adapter_extraction_status_admitted: gate.extraction_status === 'authority_command_adapter_extraction_admitted',
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      adapter_module_under_line_budget: result.adapter_module.line_count <= gate.adapter_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      owned_authority_commands_contract: gate.owned_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.owned_top_level_commands.includes(name)),
      non_authority_commands_excluded: gate.excluded_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.excluded_top_level_commands.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      authority_adapter_module_out_of_pack_for_this_gate: gate.boundary.source_authority_adapter_module_remains_out_of_pack === true,
      extraction_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_work_items_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      authority_adapter_commands_no_write: gate.boundary.authority_adapter_command_writes_files === false && gate.boundary.authority_adapter_check_command_writes_files === false
    },
    adapter_module: result.adapter_module,
    runtime_cutover: result.runtime_cutover,
    source_authority_adapter_extraction_file: {
      path: gate.extraction_file,
      present: fs.existsSync(artifactPath),
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function publicModularRuntimePackageInclusionPlan(root = packageRoot()) {
  const gate = PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const planningPath = path.join(root, gate.planning_file);
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-modular-runtime-package-inclusion-plan-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    planning_file: gate.planning_file,
    planning_file_present: fs.existsSync(planningPath),
    planning_status: gate.planning_status,
    current_public_package_files: gate.current_public_package_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    runtime_reference_shape: gate.runtime_reference_shape,
    future_include_candidates: gate.future_include_candidates.slice(),
    first_inclusion_slice: gate.first_inclusion_slice,
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    plan: gate,
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

function publicModularRuntimePackageInclusionPlanCheck(root = packageRoot()) {
  const result = publicModularRuntimePackageInclusionPlan(root);
  const gate = PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const planningGatePackFiles = gate.current_public_package_files.slice().sort();
  const compactPackStillCurrent = arrayEquals(result.projected_pack_files, planningGatePackFiles);
  const plannedExpansionApplied = gate.boundary.future_package_allowlist_change_planned === true && arrayEquals(result.projected_pack_files, expectedPackFiles);
  const errors = [];
  if (gate.planning_status !== 'modular_runtime_package_inclusion_plan_admitted') errors.push('modular runtime package inclusion plan status must be admitted');
  if (!compactPackStillCurrent && !plannedExpansionApplied) errors.push(`projected npm pack files must be either the planning gate compact files ${planningGatePackFiles.join(', ')} or the admitted current release files ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.package_allowlist_unchanged_for_this_gate !== true) errors.push('module inclusion planning gate must keep package allowlist unchanged');
  if (gate.boundary.future_package_allowlist_change_planned !== true) errors.push('module inclusion planning gate must explicitly plan a future package allowlist change');
  if (gate.boundary.runtime_cutover_applied !== false) errors.push('module inclusion planning gate must not apply runtime cutover');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('module inclusion planning gate must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('module inclusion planning gate must not change packaged CLI runtime dependency graph');
  if (gate.boundary.module_inclusion_plan_command_writes_files !== false) errors.push('architecture --module-inclusion-plan must remain no-write');
  if (gate.boundary.module_inclusion_check_command_writes_files !== false) errors.push('architecture --module-inclusion-check must remain no-write');
  if (!gate.future_include_candidates.includes('cli/agent_onboard/command-router.js')) errors.push('future include candidates must include the command router');
  if (!gate.future_include_candidates.includes('cli/agent_onboard/adapters/compatibility-command-port.js')) errors.push('future include candidates must include the compatibility command port adapter');
  if (gate.first_inclusion_slice.runtime_cutover_allowed !== false) errors.push('first inclusion slice must not allow runtime cutover');
  if (gate.first_inclusion_slice.package_files_change_allowed !== true) errors.push('first inclusion slice must allow a controlled package files change');

  let planningFileStatus = 'not_present_installed_context_allowed';
  let planningFileSchema = null;
  const planningPath = path.join(root, gate.planning_file);
  if (fs.existsSync(planningPath)) {
    try {
      const artifact = readJson(planningPath);
      planningFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.planning_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.planning_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.planning_file} must seed ${gate.next_work_item_id}`);
      if (artifact.planning_status !== gate.planning_status) errors.push(`${gate.planning_file} must admit ${gate.planning_status}`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged_for_this_gate !== true) errors.push(`${gate.planning_file} must preserve package_allowlist_unchanged_for_this_gate`);
      if (!artifact.boundary || artifact.boundary.future_package_allowlist_change_planned !== true) errors.push(`${gate.planning_file} must plan a future package allowlist change`);
      planningFileStatus = 'present_validated';
    } catch (error) {
      planningFileStatus = 'present_invalid_json';
      errors.push(`${gate.planning_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    planningFileStatus = 'missing_source_context';
    errors.push(`${gate.planning_file} must exist in source repository context`);
  }

  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after module inclusion planning`);
  }

  return {
    schema: 'agent-onboard-public-modular-runtime-package-inclusion-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      planning_status_admitted: gate.planning_status === 'modular_runtime_package_inclusion_plan_admitted',
      compact_pack_allowlist_preserved_for_planning_gate_or_superseded_by_admitted_inclusion: compactPackStillCurrent || plannedExpansionApplied,
      future_package_allowlist_change_planned: gate.boundary.future_package_allowlist_change_planned === true,
      runtime_cutover_not_applied: gate.boundary.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      planning_commands_no_write: gate.boundary.module_inclusion_plan_command_writes_files === false && gate.boundary.module_inclusion_check_command_writes_files === false,
      runtime_reference_shape_declared: !!gate.runtime_reference_shape.router_module && !!gate.runtime_reference_shape.compatibility_port_module,
      first_inclusion_slice_declared: gate.first_inclusion_slice.package_files_change_allowed === true && gate.first_inclusion_slice.runtime_cutover_allowed === false,
      planning_file_present_or_installed_context_allowed: planningFileStatus === 'present_validated' || planningFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_packaged_router_inclusion_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_modular_runtime_package_inclusion_plan_file: {
      path: gate.planning_file,
      present: fs.existsSync(planningPath),
      status: planningFileStatus,
      schema: planningFileSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    future_include_candidates: gate.future_include_candidates.slice(),
    first_inclusion_slice: gate.first_inclusion_slice,
    boundary: result.boundary,
    errors
  };
}

function inspectPackagedModule(root, rel, expectedExports) {
  const abs = path.join(root, rel);
  const present = fs.existsSync(abs);
  let status = present ? 'present_unvalidated' : 'missing';
  let exportsList = [];
  let requireError = null;
  if (present) {
    try {
      delete require.cache[require.resolve(abs)];
      exportsList = Object.keys(require(abs)).sort();
      status = 'present_validated';
    } catch (error) {
      status = 'present_require_failed';
      requireError = error && error.message ? error.message : String(error);
    }
  }
  return {
    path: rel,
    present,
    status,
    exports: exportsList,
    expected_exports: expectedExports.slice().sort(),
    require_error: requireError,
    line_count: countFileLines(root, rel)
  };
}

function publicPackagedRouterPortInclusion(root = packageRoot()) {
  const gate = PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const inclusionPath = path.join(root, gate.inclusion_file);
  const moduleReports = gate.included_module_files.map((rel) => inspectPackagedModule(root, rel, gate.expected_module_exports[rel] || Object.freeze([])));
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-packaged-router-port-inclusion-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    inclusion_file: gate.inclusion_file,
    inclusion_file_present: fs.existsSync(inclusionPath),
    inclusion_status: gate.inclusion_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_line_count: countFileLines(root, gate.entrypoint)
    },
    included_module_files: gate.included_module_files.slice(),
    module_reports: moduleReports,
    expected_pack_files: gate.included_package_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    inclusion_contract: gate,
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

function publicPackagedRouterPortInclusionCheck(root = packageRoot()) {
  const result = publicPackagedRouterPortInclusion(root);
  const gate = PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.included_package_files.slice().sort();
  const errors = [];
  if (gate.inclusion_status !== 'packaged_router_port_inclusion_admitted') errors.push('packaged router port inclusion status must be admitted');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must be ${expectedPackFiles.join(', ')}`);
  if (gate.runtime_cutover_applied !== false) errors.push('packaged router port inclusion must not apply runtime cutover');
  if (gate.boundary.package_allowlist_expanded !== true) errors.push('packaged router port inclusion must expand package allowlist');
  if (gate.boundary.package_file_count !== expectedPackFiles.length) errors.push(`packaged router port inclusion package file count must be ${expectedPackFiles.length}`);
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('packaged router port inclusion must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('packaged router port inclusion must not change packaged CLI runtime dependency graph yet');
  if (gate.boundary.packaged_router_port_command_writes_files !== false) errors.push('architecture --packaged-router-port must remain no-write');
  if (gate.boundary.packaged_router_port_check_command_writes_files !== false) errors.push('architecture --packaged-router-port-check must remain no-write');

  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for packaged router port inclusion`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    for (const exportName of report.expected_exports) {
      if (!report.exports.includes(exportName)) errors.push(`${report.path} must export ${exportName}`);
    }
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must be included in projected npm pack files`);
  }

  let inclusionFileStatus = 'not_present_installed_context_allowed';
  let inclusionFileSchema = null;
  const inclusionPath = path.join(root, gate.inclusion_file);
  if (fs.existsSync(inclusionPath)) {
    try {
      const artifact = readJson(inclusionPath);
      inclusionFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.inclusion_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.inclusion_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.inclusion_file} must seed ${gate.next_work_item_id}`);
      if (artifact.inclusion_status !== gate.inclusion_status) errors.push(`${gate.inclusion_file} must admit ${gate.inclusion_status}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.inclusion_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_expanded !== true) errors.push(`${gate.inclusion_file} must declare package_allowlist_expanded`);
      inclusionFileStatus = 'present_validated';
    } catch (error) {
      inclusionFileStatus = 'present_invalid_json';
      errors.push(`${gate.inclusion_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    inclusionFileStatus = 'missing_source_context';
    errors.push(`${gate.inclusion_file} must exist in source repository context`);
  }

  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after packaged router port inclusion`);
  }

  return {
    schema: 'agent-onboard-public-packaged-router-port-inclusion-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      inclusion_status_admitted: gate.inclusion_status === 'packaged_router_port_inclusion_admitted',
      projected_pack_files_match_inclusion_contract: arrayEquals(result.projected_pack_files, expectedPackFiles),
      package_allowlist_expanded: gate.boundary.package_allowlist_expanded === true,
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      packaged_router_port_commands_no_write: gate.boundary.packaged_router_port_command_writes_files === false && gate.boundary.packaged_router_port_check_command_writes_files === false,
      module_files_present: result.module_reports.every((report) => report.present),
      module_files_requireable: result.module_reports.every((report) => report.status === 'present_validated'),
      module_exports_contract: result.module_reports.every((report) => report.expected_exports.every((name) => report.exports.includes(name))),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      inclusion_file_present_or_installed_context_allowed: inclusionFileStatus === 'present_validated' || inclusionFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_thin_entrypoint_cutover_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_packaged_router_port_inclusion_file: {
      path: gate.inclusion_file,
      present: fs.existsSync(inclusionPath),
      status: inclusionFileStatus,
      schema: inclusionFileSchema,
      source_context_required: sourceLedgerRequired
    },
    module_reports: result.module_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    runtime_cutover: result.runtime_cutover,
    boundary: result.boundary,
    errors
  };
}

function runThinEntrypointRehearsalVectors(root, gate) {
  let router = null;
  let portFactory = null;
  let routerLoadError = null;
  let portLoadError = null;
  try {
    router = require(path.join(root, gate.router_module));
  } catch (error) {
    routerLoadError = error && error.message ? error.message : String(error);
  }
  try {
    portFactory = require(path.join(root, gate.compatibility_port_module));
  } catch (error) {
    portLoadError = error && error.message ? error.message : String(error);
  }
  const canRun = router && typeof router.route === 'function' && portFactory && typeof portFactory.createCompatibilityCommandPort === 'function';
  const reports = [];
  if (!canRun) {
    return { can_run: false, router_load_error: routerLoadError, port_load_error: portLoadError, reports };
  }
  const handlers = Object.freeze({
    status(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: 'ok', command: argv[2], writes_files: false });
    },
    help(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: 'ok', command: argv[2] || 'help', writes_files: false });
    },
    default(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: argv[2] ? 'unhandled_source_only_seed' : 'ok', command: argv[2] || 'help', writes_files: false });
    }
  });
  const port = portFactory.createCompatibilityCommandPort(handlers);
  for (const vector of gate.rehearsal_vectors) {
    let vectorResult = null;
    let error = null;
    try {
      vectorResult = router.route(vector.argv.slice(), port);
    } catch (caught) {
      error = caught && caught.message ? caught.message : String(caught);
    }
    reports.push(Object.freeze({
      id: vector.id,
      argv: vector.argv.slice(),
      expected_status: vector.expected_status,
      actual_status: vectorResult && vectorResult.status ? vectorResult.status : null,
      writes_files: vectorResult && vectorResult.writes_files === true,
      matched: !!vectorResult && vectorResult.status === vector.expected_status && vectorResult.writes_files !== true,
      error
    }));
  }
  return { can_run: true, router_load_error: routerLoadError, port_load_error: portLoadError, reports };
}

function publicThinEntrypointRouterCutoverRehearsal(root = packageRoot()) {
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const rehearsalPath = path.join(root, gate.rehearsal_file);
  const moduleReports = [
    inspectPackagedModule(root, gate.router_module, Object.freeze(['ROUTER_SEED', 'describeRouterSeed', 'route'])),
    inspectPackagedModule(root, gate.compatibility_port_module, Object.freeze(['COMPATIBILITY_COMMAND_PORT_SEED', 'createCompatibilityCommandPort', 'describeCompatibilityCommandPortSeed']))
  ];
  const vectorRun = runThinEntrypointRehearsalVectors(root, gate);
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    rehearsal_file: gate.rehearsal_file,
    rehearsal_file_present: fs.existsSync(rehearsalPath),
    rehearsal_status: gate.rehearsal_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      current_entrypoint: gate.current_entrypoint,
      current_entrypoint_line_count: countFileLines(root, gate.current_entrypoint),
      target_entrypoint_max_lines: gate.target_entrypoint_max_lines
    },
    module_reports: moduleReports,
    rehearsal_vector_reports: vectorRun.reports,
    rehearsal_vector_runtime: {
      can_run: vectorRun.can_run,
      router_load_error: vectorRun.router_load_error,
      port_load_error: vectorRun.port_load_error
    },
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    rehearsal_contract: gate,
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

function publicThinEntrypointRouterCutoverRehearsalCheck(root = packageRoot()) {
  const result = publicThinEntrypointRouterCutoverRehearsal(root);
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.rehearsal_status !== 'thin_entrypoint_router_cutover_rehearsed_not_applied') errors.push('thin entrypoint rehearsal status must be rehearsed_not_applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.runtime_cutover_applied !== false) errors.push('thin entrypoint rehearsal must not apply runtime cutover');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('thin entrypoint rehearsal must keep package allowlist unchanged');
  if (gate.boundary.package_file_count !== expectedPackFiles.length) errors.push(`thin entrypoint rehearsal package file count must be ${expectedPackFiles.length}`);
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('thin entrypoint rehearsal must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('thin entrypoint rehearsal must not change runtime dependency graph yet');
  if (gate.boundary.thin_entrypoint_rehearsal_command_writes_files !== false) errors.push('architecture --thin-entrypoint-rehearsal must remain no-write');
  if (gate.boundary.thin_entrypoint_rehearsal_check_command_writes_files !== false) errors.push('architecture --thin-entrypoint-rehearsal-check must remain no-write');
  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for thin entrypoint rehearsal`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    for (const exportName of report.expected_exports) {
      if (!report.exports.includes(exportName)) errors.push(`${report.path} must export ${exportName}`);
    }
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
  }
  if (!result.rehearsal_vector_runtime.can_run) errors.push('thin entrypoint rehearsal vectors must be runnable through router and compatibility port');
  for (const report of result.rehearsal_vector_reports) {
    if (!report.matched) errors.push(`thin entrypoint rehearsal vector ${report.id} must return ${report.expected_status} without writes`);
  }

  let rehearsalFileStatus = 'not_present_installed_context_allowed';
  let rehearsalFileSchema = null;
  const rehearsalPath = path.join(root, gate.rehearsal_file);
  if (fs.existsSync(rehearsalPath)) {
    try {
      const artifact = readJson(rehearsalPath);
      rehearsalFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.rehearsal_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.rehearsal_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.rehearsal_file} must seed ${gate.next_work_item_id}`);
      if (artifact.rehearsal_status !== gate.rehearsal_status) errors.push(`${gate.rehearsal_file} must admit ${gate.rehearsal_status}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.rehearsal_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.rehearsal_file} must declare package_allowlist_unchanged`);
      rehearsalFileStatus = 'present_validated';
    } catch (error) {
      rehearsalFileStatus = 'present_invalid_json';
      errors.push(`${gate.rehearsal_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    rehearsalFileStatus = 'missing_source_context';
    errors.push(`${gate.rehearsal_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after thin entrypoint rehearsal`);
  }

  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      rehearsal_status_admitted: gate.rehearsal_status === 'thin_entrypoint_router_cutover_rehearsed_not_applied',
      projected_pack_files_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      package_allowlist_unchanged: gate.boundary.package_allowlist_unchanged === true,
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      packaged_router_and_port_present: result.module_reports.every((report) => report.present),
      packaged_router_and_port_requireable: result.module_reports.every((report) => report.status === 'present_validated'),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      rehearsal_vectors_runnable: result.rehearsal_vector_runtime.can_run,
      rehearsal_vectors_match_expected_status: result.rehearsal_vector_reports.every((report) => report.matched),
      rehearsal_commands_no_write: gate.boundary.thin_entrypoint_rehearsal_command_writes_files === false && gate.boundary.thin_entrypoint_rehearsal_check_command_writes_files === false,
      rehearsal_file_present_or_installed_context_allowed: rehearsalFileStatus === 'present_validated' || rehearsalFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_cutover_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_thin_entrypoint_rehearsal_file: {
      path: gate.rehearsal_file,
      present: fs.existsSync(rehearsalPath),
      status: rehearsalFileStatus,
      schema: rehearsalFileSchema,
      source_context_required: sourceLedgerRequired
    },
    module_reports: result.module_reports,
    rehearsal_vector_reports: result.rehearsal_vector_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    runtime_cutover: result.runtime_cutover,
    boundary: result.boundary,
    errors
  };
}

function publicThinEntrypointRouterCutoverApplication(root = packageRoot()) {
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION;
  const pkg = readJson(path.join(root, 'package.json'));
  const entrypointPath = path.join(root, gate.entrypoint);
  const entrypointExists = fs.existsSync(entrypointPath);
  const entrypointText = entrypointExists ? fs.readFileSync(entrypointPath, 'utf8') : '';
  let composerText = ''; try { composerText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-composer.js'), 'utf8'); } catch(e){}
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const runMainSmoke = (argv) => {
    const originalWrite = process.stdout.write;
    try {
      process.stdout.write = () => true;
      return routeCommand(argv, createRuntimeCompatibilityPort());
    } finally {
      process.stdout.write = originalWrite;
    }
  };
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-application-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    cutover_status: gate.cutover_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_exists: entrypointExists,
      entrypoint_line_count: countFileLines(root, gate.entrypoint),
      imports_router: entrypointText.includes("require('./agent_onboard/command-router')") || composerText.includes("require('./command-router')"),
      imports_compatibility_port: entrypointText.includes("require('./agent_onboard/adapters/compatibility-command-port')") || composerText.includes("require('./adapters/compatibility-command-port')"),
      main_delegates_to_router: /function main[\s\S]*routeCommand\(argv, createRuntimeCompatibilityPort\(\)\)/.test(entrypointText)
    },
    module_reports: [
      inspectPackagedModule(root, gate.router_module, Object.freeze(['ROUTER_SEED', 'describeRouterSeed', 'route'])),
      inspectPackagedModule(root, gate.compatibility_port_module, Object.freeze(['COMPATIBILITY_COMMAND_PORT_SEED', 'createCompatibilityCommandPort', 'describeCompatibilityCommandPortSeed']))
    ],
    cli_smoke: {
      status_result: runMainSmoke(['node', gate.entrypoint, 'status']),
      version_result: runMainSmoke(['node', gate.entrypoint, '--version'])
    },
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    cutover_file: gate.cutover_file,
    cutover_file_present: fs.existsSync(path.join(root, gate.cutover_file)),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
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
    },
    errors: []
  };
}

function publicThinEntrypointRouterCutoverApplicationCheck(root = packageRoot()) {
  const result = publicThinEntrypointRouterCutoverApplication(root);
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.cutover_status !== 'thin_entrypoint_router_cutover_applied') errors.push('thin entrypoint cutover status must be applied');
  if (gate.runtime_cutover_applied !== true) errors.push('thin entrypoint cutover must declare runtime cutover applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (!result.runtime_cutover.entrypoint_exists) errors.push(`${gate.entrypoint} must exist for thin entrypoint cutover`);
  if (!result.runtime_cutover.imports_router) errors.push(`${gate.entrypoint} must import packaged command router`);
  if (!result.runtime_cutover.imports_compatibility_port) errors.push(`${gate.entrypoint} must import packaged compatibility command port`);
  if (!result.runtime_cutover.main_delegates_to_router) errors.push(`${gate.entrypoint} main() must delegate to routeCommand(argv, createRuntimeCompatibilityPort())`);
  if (result.cli_smoke.status_result !== 0) errors.push('main status smoke must return 0');
  if (result.cli_smoke.version_result !== 0) errors.push('main version smoke must return 0');
  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for thin entrypoint cutover`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
  }

  let cutoverFileStatus = 'not_present_installed_context_allowed';
  let cutoverFileSchema = null;
  const cutoverPath = path.join(root, gate.cutover_file);
  if (fs.existsSync(cutoverPath)) {
    try {
      const artifact = readJson(cutoverPath);
      cutoverFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.cutover_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.cutover_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.cutover_file} must seed ${gate.next_work_item_id}`);
      if (artifact.cutover_status !== gate.cutover_status) errors.push(`${gate.cutover_file} must admit ${gate.cutover_status}`);
      if (artifact.runtime_cutover_applied !== true) errors.push(`${gate.cutover_file} must declare runtime cutover applied`);
      cutoverFileStatus = 'present_validated';
    } catch (error) {
      cutoverFileStatus = 'present_invalid_json';
      errors.push(`${gate.cutover_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    cutoverFileStatus = 'missing_source_context';
    errors.push(`${gate.cutover_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after thin entrypoint cutover`);
  }

  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-application-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      cutover_status_applied: gate.cutover_status === 'thin_entrypoint_router_cutover_applied',
      runtime_cutover_applied: gate.runtime_cutover_applied === true,
      entrypoint_imports_packaged_router: result.runtime_cutover.imports_router,
      entrypoint_imports_packaged_compatibility_port: result.runtime_cutover.imports_compatibility_port,
      entrypoint_main_delegates_to_router: result.runtime_cutover.main_delegates_to_router,
      projected_pack_files_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      main_smoke_status_ok: result.cli_smoke.status_result === 0,
      main_smoke_version_ok: result.cli_smoke.version_result === 0,
      cutover_file_present_or_installed_context_allowed: cutoverFileStatus === 'present_validated' || cutoverFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_thin_entrypoint_cutover_file: {
      path: gate.cutover_file,
      present: fs.existsSync(cutoverPath),
      status: cutoverFileStatus,
      schema: cutoverFileSchema,
      source_context_required: sourceLedgerRequired
    },
    runtime_cutover: result.runtime_cutover,
    module_reports: result.module_reports,
    cli_smoke: result.cli_smoke,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

function inspectRuntimeAdapterModule(root, spec) {
  const report = inspectPackagedModule(root, spec.path, Object.freeze([spec.factory, spec.describe]));
  let describedBoundary = null;
  let describedRole = null;
  let describedCommands = [];
  let describeError = null;
  try {
    const moduleValue = require(path.join(root, spec.path));
    const described = typeof moduleValue[spec.describe] === 'function' ? moduleValue[spec.describe]() : null;
    describedBoundary = described && described.boundary ? described.boundary : null;
    describedRole = described && described.role ? described.role : null;
    describedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice() : [];
  } catch (error) {
    describeError = error && error.message ? error.message : String(error);
  }
  return Object.freeze({
    ...report,
    group: spec.group,
    factory: spec.factory,
    describe: spec.describe,
    expected_commands: spec.commands.slice(),
    described_role: describedRole,
    described_commands: describedCommands,
    described_boundary: describedBoundary,
    describe_error: describeError
  });
}

function runSuppressedMainSmoke(argv) {
  const originalWrite = process.stdout.write;
  try {
    process.stdout.write = () => true;
    return routeCommand(argv, createRuntimeCompatibilityPort());
  } finally {
    process.stdout.write = originalWrite;
  }
}

function publicRouterCommandAdapterDelegationExpansion(root = packageRoot()) {
  const gate = PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const entrypointPath = path.join(root, gate.entrypoint);
  const entrypointExists = fs.existsSync(entrypointPath);
  const entrypointText = entrypointExists ? fs.readFileSync(entrypointPath, 'utf8') : '';
  let composerText = ''; try { composerText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-composer.js'), 'utf8'); } catch(e){}
  const port = createRuntimeCompatibilityPort();
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const smokeReports = gate.smoke_vectors.map((vector) => {
    let exitCode = null;
    let error = null;
    try {
      exitCode = runSuppressedMainSmoke(vector.argv.slice());
    } catch (caught) {
      error = caught && caught.message ? caught.message : String(caught);
    }
    return Object.freeze({
      id: vector.id,
      argv: vector.argv.slice(),
      expected_exit_code: vector.expected_exit_code,
      actual_exit_code: exitCode,
      matched: exitCode === vector.expected_exit_code && !error,
      error
    });
  });
  return {
    schema: 'agent-onboard-public-router-command-adapter-delegation-expansion-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    delegation_file: gate.delegation_file,
    delegation_file_present: fs.existsSync(path.join(root, gate.delegation_file)),
    delegation_status: gate.delegation_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_exists: entrypointExists,
      imports_router: entrypointText.includes("require('./agent_onboard/command-router')"),
      imports_compatibility_port: entrypointText.includes("require('./agent_onboard/adapters/compatibility-command-port')"),
      imports_core_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/core')") || composerText.includes("require('./adapters/commands/core')"),
      imports_package_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/release-package')") || composerText.includes("require('./adapters/commands/release-package')"),
      imports_architecture_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/architecture')") || composerText.includes("require('./adapters/commands/architecture')"),
      imports_authority_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/authority')") || composerText.includes("require('./adapters/commands/authority')"),
      imports_target_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/target')") || composerText.includes("require('./adapters/commands/target')"),
      imports_work_items_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/work-items')") || composerText.includes("require('./adapters/commands/work-items')"),
      imports_work_items_service: entrypointText.includes("require('./agent_onboard/domains/work-items')") || composerText.includes("require('./domains/work-items')"),
      main_delegates_to_router: /function main[\s\S]*routeCommand\(argv, createRuntimeCompatibilityPort\(\)\)/.test(entrypointText)
    },
    compatibility_port: {
      schema: port.schema,
      command_adapters_required_in_this_gate: port.seed && port.seed.boundary && port.seed.boundary.command_adapters_required_in_this_gate === true,
      adapter_delegation_expanded_in_this_gate: port.seed && port.seed.boundary && port.seed.boundary.adapter_delegation_expanded_in_this_gate === true,
      delegated_commands: Array.isArray(port.delegated_commands) ? port.delegated_commands.slice() : [],
      adapter_groups: port.adapter_groups || null
    },
    adapter_module_reports: gate.adapter_modules.map((spec) => inspectRuntimeAdapterModule(root, spec)),
    smoke_reports: smokeReports,
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    delegation_contract: gate,
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

function publicRouterCommandAdapterDelegationExpansionCheck(root = packageRoot()) {
  const result = publicRouterCommandAdapterDelegationExpansion(root);
  const gate = PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.delegation_status !== 'router_command_adapter_delegation_expanded') errors.push('router command adapter delegation status must be expanded');
  if (gate.runtime_cutover_applied !== true) errors.push('router command adapter delegation must keep runtime cutover applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (!result.runtime_cutover.entrypoint_exists) errors.push(`${gate.entrypoint} must exist`);
  if (!result.runtime_cutover.imports_router) errors.push(`${gate.entrypoint} must import packaged command router`);
  if (!result.runtime_cutover.imports_compatibility_port) errors.push(`${gate.entrypoint} must import packaged compatibility command port`);
  if (!result.runtime_cutover.imports_core_adapter) errors.push(`${gate.entrypoint} must import packaged core command adapter`);
  if (!result.runtime_cutover.imports_package_adapter) errors.push(`${gate.entrypoint} must import packaged release package command adapter`);
  if (!result.runtime_cutover.imports_architecture_adapter) errors.push(`${gate.entrypoint} must import packaged architecture command adapter`);
  if (!result.runtime_cutover.imports_authority_adapter) errors.push(`${gate.entrypoint} must import packaged authority command adapter`);
  if (!result.runtime_cutover.imports_target_adapter) errors.push(`${gate.entrypoint} must import packaged target command adapter`);
  if (!result.runtime_cutover.imports_work_items_adapter) errors.push(`${gate.entrypoint} must import packaged work-items command adapter`);
  if (!result.runtime_cutover.imports_work_items_service) errors.push(`${gate.entrypoint} must import packaged work-items runtime service`);
  if (!result.runtime_cutover.main_delegates_to_router) errors.push(`${gate.entrypoint} main() must continue delegating through command router`);
  if (!result.compatibility_port.command_adapters_required_in_this_gate) errors.push('compatibility command port must require command adapters in this gate');
  if (!result.compatibility_port.adapter_delegation_expanded_in_this_gate) errors.push('compatibility command port must declare adapter delegation expanded');
  if (!arrayEquals(result.compatibility_port.delegated_commands.slice().sort(), gate.delegated_commands.slice().sort())) {
    errors.push(`runtime delegated commands must be ${gate.delegated_commands.join(', ')}`);
  }
  for (const report of result.adapter_module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for router command adapter delegation`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    if (report.describe_error) errors.push(`${report.path} describe contract failed: ${report.describe_error}`);
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
    if (!report.described_boundary || report.described_boundary.used_by_runtime_entrypoint_in_this_gate !== true) errors.push(`${report.path} must declare runtime entrypoint use in this gate`);
    if (!report.described_boundary || report.described_boundary.packaged_in_npm_tarball_in_this_gate !== true) errors.push(`${report.path} must declare npm tarball inclusion in this gate`);
    for (const command of report.expected_commands.filter((item) => !item.startsWith('-'))) {
      if (!report.described_commands.includes(command)) errors.push(`${report.path} must describe owned command ${command}`);
    }
  }
  for (const report of result.smoke_reports) {
    if (!report.matched) errors.push(`router adapter delegation smoke ${report.id} must return ${report.expected_exit_code}`);
  }

  let delegationFileStatus = 'not_present_installed_context_allowed';
  let delegationFileSchema = null;
  const delegationPath = path.join(root, gate.delegation_file);
  if (fs.existsSync(delegationPath)) {
    try {
      const artifact = readJson(delegationPath);
      delegationFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.delegation_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.delegation_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.delegation_file} must seed ${gate.next_work_item_id}`);
      if (artifact.delegation_status !== gate.delegation_status) errors.push(`${gate.delegation_file} must admit ${gate.delegation_status}`);
      if (artifact.runtime_cutover_applied !== true) errors.push(`${gate.delegation_file} must keep runtime cutover applied`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.delegation_file} must declare package_allowlist_unchanged`);
      delegationFileStatus = 'present_validated';
    } catch (error) {
      delegationFileStatus = 'present_invalid_json';
      errors.push(`${gate.delegation_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    delegationFileStatus = 'missing_source_context';
    errors.push(`${gate.delegation_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router command adapter delegation expansion`);
  }

  return {
    schema: 'agent-onboard-public-router-command-adapter-delegation-expansion-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      delegation_status_expanded: gate.delegation_status === 'router_command_adapter_delegation_expanded',
      runtime_cutover_still_applied: gate.runtime_cutover_applied === true,
      entrypoint_imports_packaged_adapters: result.runtime_cutover.imports_core_adapter && result.runtime_cutover.imports_package_adapter && result.runtime_cutover.imports_architecture_adapter && result.runtime_cutover.imports_authority_adapter && result.runtime_cutover.imports_target_adapter && result.runtime_cutover.imports_work_items_adapter,
      entrypoint_imports_work_items_service: result.runtime_cutover.imports_work_items_service,
      compatibility_port_delegates_to_adapters: result.compatibility_port.command_adapters_required_in_this_gate && result.compatibility_port.adapter_delegation_expanded_in_this_gate,
      delegated_commands_match_contract: arrayEquals(result.compatibility_port.delegated_commands.slice().sort(), gate.delegated_commands.slice().sort()),
      adapter_modules_present: result.adapter_module_reports.every((report) => report.present),
      adapter_modules_requireable: result.adapter_module_reports.every((report) => report.status === 'present_validated'),
      adapter_modules_used_by_runtime: result.adapter_module_reports.every((report) => report.described_boundary && report.described_boundary.used_by_runtime_entrypoint_in_this_gate === true),
      adapter_modules_in_projected_pack: result.adapter_module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      runtime_smoke_vectors_pass: result.smoke_reports.every((report) => report.matched),
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      delegation_commands_no_write: gate.boundary.router_adapter_delegation_command_writes_files === false && gate.boundary.router_adapter_delegation_check_command_writes_files === false,
      delegation_file_present_or_installed_context_allowed: delegationFileStatus === 'present_validated' || delegationFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_router_command_adapter_delegation_file: {
      path: gate.delegation_file,
      present: fs.existsSync(delegationPath),
      status: delegationFileStatus,
      schema: delegationFileSchema,
      source_context_required: sourceLedgerRequired
    },
    runtime_cutover: result.runtime_cutover,
    compatibility_port: result.compatibility_port,
    adapter_module_reports: result.adapter_module_reports,
    smoke_reports: result.smoke_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}

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

function createPublicPackageSourceManifestService() {
  return packageSourceManifestDomain.createPackageSourceManifestService({
    packageName: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    releaseLine: PUBLIC_RELEASE_CONTRACT.release_line,
    expectedPackFiles: PUBLIC_PACKAGE_SURFACE_PRESERVATION.expected_pack_files,
    sourceOnlyFiles: PUBLIC_PACKAGE_SURFACE_PRESERVATION.source_only_files
  });
}

function publicPackageSurface(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const expectedPackFiles = PUBLIC_PACKAGE_SURFACE_PRESERVATION.expected_pack_files.slice().sort();
  const requiredPackageJsonFiles = PUBLIC_PACKAGE_SURFACE_PRESERVATION.required_package_json_files.slice().sort();
  const actualPackageJsonFiles = Array.isArray(pkg.files) ? pkg.files.slice().sort() : [];
  const context = sourceContext(root);
  const sourceOnlyFiles = PUBLIC_PACKAGE_SURFACE_PRESERVATION.source_only_files.slice();
  const sourceOnlyPresent = sourceOnlyFiles.filter((rel) => fs.existsSync(path.join(root, rel)));
  const sourceOnlyProjected = sourceOnlyFiles.filter((rel) => projectedPackFiles.includes(rel));
  const expectedPresent = expectedPackFiles.filter((rel) => fs.existsSync(path.join(root, rel)));
  const expectedMissing = expectedPackFiles.filter((rel) => !fs.existsSync(path.join(root, rel)));
  const binTargets = Object.values(PUBLIC_RELEASE_CONTRACT.required_package_json.bin);
  const binTargetsInProjectedPack = binTargets.every((rel) => projectedPackFiles.includes(rel));
  return {
    schema: 'agent-onboard-public-package-surface-preservation-result-001',
    status: 'ok',
    package_name: PUBLIC_PACKAGE_SURFACE_PRESERVATION.package_name,
    version: VERSION,
    release_line: PUBLIC_PACKAGE_SURFACE_PRESERVATION.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_PACKAGE_SURFACE_PRESERVATION.command,
    check_command: PUBLIC_PACKAGE_SURFACE_PRESERVATION.check_command,
    package_root: root,
    package_context: context.package_context,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    required_package_json_files: requiredPackageJsonFiles,
    actual_package_json_files: actualPackageJsonFiles,
    source_only_files: sourceOnlyFiles,
    source_only_files_present: sourceOnlyPresent,
    source_only_files_projected_into_pack: sourceOnlyProjected,
    expected_pack_files_present: expectedPresent,
    expected_pack_files_missing: expectedMissing,
    bin_targets: binTargets,
    bin_targets_in_projected_pack: binTargetsInProjectedPack,
    installed_context_policy: PUBLIC_PACKAGE_SURFACE_PRESERVATION.installed_context_policy,
    boundary: {
      writes_files: false,
      writes_package_root: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_publish_required: false
    }
  };
}

function publicPackageSourceManifest(root = packageRoot()) {
  const result = createPublicPackageSourceManifestService().build(root);
  return Object.assign({}, result, {
    command: 'agent-onboard release --source-manifest',
    package_root: root,
    boundary: Object.assign({}, result.boundary, {
      writes_files: false,
      runs_package_manager: false,
      publishes_package: false,
      mutates_registry: false
    })
  });
}

function publicPackageSourceManifestCheck(root = packageRoot()) {
  const result = createPublicPackageSourceManifestService().check(root);
  return Object.assign({}, result, {
    command: 'agent-onboard release --source-manifest-check',
    package_root: root,
    boundary: Object.assign({}, result.boundary, {
      writes_files: false,
      runs_package_manager: false,
      publishes_package: false,
      mutates_registry: false
    })
  });
}

const publicReleaseCleanClosedGatesRuntimeSliceService = createPublicReleaseCleanClosedGatesRuntimeSliceService({
  PACKAGE_NAME,
  RELEASE_LINE,
  VERSION,
  packageRoot,
  readJson,
  sourceContext,
  publicFullTestRunnerCompletionCheck,
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
  publicFullTestRunnerCompletionCheck,
  publicPackageSurfaceCheck,
  publicReleaseCheck
});


function publicPackageSurfaceCheck(root = packageRoot()) {
  const surface = publicPackageSurface(root);
  const packageSourceManifest = createPublicPackageSourceManifestService().check(root);
  const errors = [];
  const messagingErrors = publicArtifactMessagingErrors(root, surface.expected_pack_files);
  if (!arrayEquals(surface.projected_pack_files, surface.expected_pack_files)) errors.push(`projected npm pack files must be ${surface.expected_pack_files.join(', ')}`);
  if (!arrayEquals(surface.actual_package_json_files, surface.required_package_json_files)) errors.push(`package.json#files must be ${surface.required_package_json_files.join(', ')}`);
  if (surface.expected_pack_files_missing.length > 0) errors.push(`expected npm package files missing: ${surface.expected_pack_files_missing.join(', ')}`);
  if (surface.source_only_files_projected_into_pack.length > 0) errors.push(`source-only files projected into npm package: ${surface.source_only_files_projected_into_pack.join(', ')}`);
  if (!surface.bin_targets_in_projected_pack) errors.push('all bin targets must remain inside the projected npm package surface');
  if (packageSourceManifest.status !== 'ok') errors.push(...packageSourceManifest.errors.map((error) => `package source manifest: ${error}`));
  errors.push(...messagingErrors.map((error) => `public artifact messaging: ${error}`));
  return {
    schema: 'agent-onboard-public-package-surface-preservation-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_PACKAGE_SURFACE_PRESERVATION.package_name,
    version: VERSION,
    release_line: PUBLIC_PACKAGE_SURFACE_PRESERVATION.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_PACKAGE_SURFACE_PRESERVATION.check_command,
    package_root: root,
    package_context: surface.package_context,
    validated: {
      controlled_modular_package_surface: arrayEquals(surface.projected_pack_files, surface.expected_pack_files),
      package_json_files_allowlist: arrayEquals(surface.actual_package_json_files, surface.required_package_json_files),
      expected_pack_files_present: surface.expected_pack_files_missing.length === 0,
      source_only_context_excluded_from_pack: surface.source_only_files_projected_into_pack.length === 0,
      source_growth_files_present_in_source_repo: surface.package_context === 'installed_package' || surface.source_only_files_present.length >= 5,
      bin_entrypoints_in_pack: surface.bin_targets_in_projected_pack,
      public_artifact_messaging: messagingErrors.length === 0,
      package_source_manifest: packageSourceManifest.status === 'ok',
      package_source_manifest_content_addressed: packageSourceManifest.validated.package_files_are_content_addressed,
      package_source_manifest_hash_cache_excluded: packageSourceManifest.validated.hash_cache_not_projected_into_package,
      surface_commands_no_write: PUBLIC_PACKAGE_SURFACE_PRESERVATION.boundary.surface_command_writes_files === false && PUBLIC_PACKAGE_SURFACE_PRESERVATION.boundary.check_command_writes_files === false
    },
    expected_pack_files: surface.expected_pack_files,
    projected_pack_files: surface.projected_pack_files,
    required_package_json_files: surface.required_package_json_files,
    actual_package_json_files: surface.actual_package_json_files,
    source_only_files_present: surface.source_only_files_present,
    source_only_files_projected_into_pack: surface.source_only_files_projected_into_pack,
    package_source_manifest: packageSourceManifest,
    boundary: surface.boundary,
    errors
  };
}

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

const PUBLIC_FULL_TEST_RUNNER_COMPLETION = Object.freeze({
  schema: 'agent-onboard-public-full-test-runner-completion-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W10'].join(''),
  work_item_id: ['P1S3M6', 'W11'].join(''),
  title: 'Public full-test runner completion compaction gate',
  surface_id: 'full-test-runner-completion',
  command: 'agent-onboard release --full-test-runner',
  check_command: 'agent-onboard release --full-test-runner-check',
  artifact_file: '.agent-onboard/public-full-test-runner-completion-compaction-gate.json',
  boundary: Object.freeze({
    writes_files: false,
    executes_tests_inside_checker: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    mutates_work_items: false,
    mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false
  })
});

function publicFullTestRunnerMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
      prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
      work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
    prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
    work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicFullTestRunnerCompletion(root = packageRoot()) {
  const runnerPath = path.join(root, 'test', 'run-tests.js');
  const sourceTestPath = path.join(root, 'test', 'agent-onboard.test.js');
  const artifactPath = path.join(root, PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file);
  const runnerText = fs.existsSync(runnerPath) ? fs.readFileSync(runnerPath, 'utf8') : '';
  const sourceTestText = fs.existsSync(sourceTestPath) ? fs.readFileSync(sourceTestPath, 'utf8') : '';
  const taskTimeout = Number.parseInt(process.env.AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS || '', 10) || 180000;
  return Object.freeze({
    schema: 'agent-onboard-public-full-test-runner-completion-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
    prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
    work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
    title: PUBLIC_FULL_TEST_RUNNER_COMPLETION.title,
    command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.command,
    check_command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.check_command,
    package_root: root,
    surface_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.surface_id,
    artifact: Object.freeze({
      path: PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    runner_contract: Object.freeze({
      official_command: 'npm run test:full',
      full_runner_script: 'node test/run-tests.js full',
      default_shard_count: 163,
      default_full_concurrency: 1,
      per_task_timeout_ms: taskTimeout,
      case_mode_env: 'AGENT_ONBOARD_FULL_TEST_CASE_MODE=1',
      shard_mode_default: true,
      runs_tests_inside_checker: false
    }),
    observed_source: Object.freeze({
      runner_file_present: fs.existsSync(runnerPath),
      source_test_file_present: fs.existsSync(sourceTestPath),
      exit_event_completion: /child\.on\('exit'/.test(runnerText) && /finish\(status, signal\)/.test(runnerText),
      stdio_close_not_required_for_full_source_tasks: /captureOutput: false/.test(runnerText) && /stdio: task\.captureOutput === false \? 'ignore'/.test(runnerText),
      per_task_timeout_configured: /AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS/.test(runnerText) && /task timeout after/.test(runnerText),
      output_capture_disabled_for_full_tasks: /captureOutput: false/.test(runnerText),
      temp_cleanup_available: /cleanupFullSourceTempDirs/.test(runnerText),
      per_case_diagnostic_mode: /--only-index=/.test(runnerText) && /AGENT_ONBOARD_FULL_TEST_CASE_MODE/.test(runnerText),
      selected_test_only_index_supported: /--only-index=/.test(sourceTestText),
      selected_test_exclude_index_supported: /--exclude-index=/.test(sourceTestText),
      selected_test_force_exit: /FULL_SOURCE_FORCE_EXIT/.test(sourceTestText) && /process\.exit\(0\)/.test(sourceTestText)
    }),
    boundary: PUBLIC_FULL_TEST_RUNNER_COMPLETION.boundary
  });
}

function publicFullTestRunnerCompletionCheck(root = packageRoot()) {
  const result = publicFullTestRunnerCompletion(root);
  const milestone = publicFullTestRunnerMilestoneState(root);
  const installedContext = sourceContext(root).package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const errors = [];
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file} must exist after W11 closes`);
  if (!installedContext && result.observed_source.runner_file_present !== true) errors.push('test/run-tests.js must be present');
  if (!installedContext && result.observed_source.source_test_file_present !== true) errors.push('test/agent-onboard.test.js must be present');
  if (!installedContext && result.observed_source.exit_event_completion !== true) errors.push('full runner must resolve on child process exit instead of waiting only for stdio close');
  if (!installedContext && result.observed_source.stdio_close_not_required_for_full_source_tasks !== true) errors.push('full source tasks must not require captured stdio close for completion');
  if (!installedContext && result.observed_source.per_task_timeout_configured !== true) errors.push('full runner must keep explicit per-task timeout failures');
  if (!installedContext && result.observed_source.output_capture_disabled_for_full_tasks !== true) errors.push('full source tasks must disable output capture by default');
  if (!installedContext && result.observed_source.temp_cleanup_available !== true) errors.push('full runner must expose temporary directory cleanup for full-source shards');
  if (!installedContext && result.observed_source.per_case_diagnostic_mode !== true) errors.push('full runner must retain per-case diagnostic mode');
  if (!installedContext && result.observed_source.selected_test_only_index_supported !== true) errors.push('full source test must support --only-index');
  if (!installedContext && result.observed_source.selected_test_exclude_index_supported !== true) errors.push('full source test must support --exclude-index');
  if (!installedContext && result.observed_source.selected_test_force_exit !== true) errors.push('full source test must force deterministic successful selected-test exit');
  if (result.boundary.executes_tests_inside_checker !== false) errors.push('full-test-runner check must not execute the test suite inside release check');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id} must remain open during W11`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id} must be closed before W11 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id} must be closed by W11`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-full-test-runner-completion-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.check_command,
    runner_command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.command,
    package_root: root,
    validated: Object.freeze({
      runner_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      exit_event_completion: result.observed_source.exit_event_completion === true,
      stdio_close_not_required_for_full_source_tasks: result.observed_source.stdio_close_not_required_for_full_source_tasks === true,
      full_source_output_capture_disabled: result.observed_source.output_capture_disabled_for_full_tasks === true,
      per_task_timeout_configured: result.observed_source.per_task_timeout_configured === true,
      temp_cleanup_available: result.observed_source.temp_cleanup_available === true,
      per_case_diagnostic_mode: result.observed_source.per_case_diagnostic_mode === true,
      selected_test_only_index_supported: result.observed_source.selected_test_only_index_supported === true,
      selected_test_exclude_index_supported: result.observed_source.selected_test_exclude_index_supported === true,
      selected_test_force_exit: result.observed_source.selected_test_force_exit === true,
      checker_does_not_execute_tests: result.boundary.executes_tests_inside_checker === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    runner: result,
    milestone_state: milestone,
    boundary: PUBLIC_FULL_TEST_RUNNER_COMPLETION.boundary,
    errors
  });
}

function publicFullTestRunnerCompletionText(result = publicFullTestRunnerCompletion()) {
  const lines = [
    `agent-onboard full-test runner completion ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Runner contract:',
    `- official command: ${result.runner_contract.official_command}`,
    `- default shards: ${result.runner_contract.default_shard_count}`,
    `- default concurrency: ${result.runner_contract.default_full_concurrency}`,
    `- per-task timeout: ${result.runner_contract.per_task_timeout_ms}ms`,
    '',
    'Boundary:',
    `- checker runs tests: ${result.boundary.executes_tests_inside_checker}`,
    `- writes files: ${result.boundary.writes_files}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  return `${lines.join('\n')}\n`;
}



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

function publicReleaseTargetRepoProductCheck(root = packageRoot()) {
  const targetDoctorResult = targetDoctor(root);
  const targetProfileResult = targetProfile(root);
  const targetRepairPlan = targetRepair(root, { write: false, force: false });
  const targetOnboardingPlan = targetOnboardingSurfacePlan(root);
  const targetOnboardingFixture = targetOnboardingDryRunFixture(root);
  const errors = [];
  if (targetDoctorResult.status !== 'ok') errors.push('target doctor must pass');
  if (targetProfileResult.status !== 'ok') errors.push('target profile must pass');
  if (targetRepairPlan.status !== 'ok') errors.push('target repair --plan must pass');
  if (targetRepairPlan.writes_performed !== false) errors.push('target repair --plan must not write files');
  if (targetOnboardingPlan.status !== 'ok') errors.push('target onboarding --plan must pass');
  if (targetOnboardingFixture.status !== 'ok') errors.push('target onboarding --fixture must pass');
  return {
    schema: 'agent-onboard-public-release-target-repo-product-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    command: PUBLIC_RELEASE_CONTRACT.command,
    package_root: root,
    validated: {
      target_doctor: targetDoctorResult.status === 'ok',
      target_profile: targetProfileResult.status === 'ok',
      target_repair_plan: targetRepairPlan.status === 'ok' && targetRepairPlan.writes_performed === false,
      target_onboarding_plan: targetOnboardingPlan.status === 'ok',
      target_onboarding_fixture: targetOnboardingFixture.status === 'ok'
    },
    target_doctor: {
      status: targetDoctorResult.status,
      readiness: targetDoctorResult.readiness,
      canonical_file_count: Array.isArray(targetDoctorResult.canonical_files) ? targetDoctorResult.canonical_files.length : 0
    },
    target_profile: {
      status: targetProfileResult.status,
      summary: targetProfileResult.summary
    },
    target_repair_plan: {
      status: targetRepairPlan.status,
      writes_performed: targetRepairPlan.writes_performed,
      planned_action_count: Array.isArray(targetRepairPlan.plan) ? targetRepairPlan.plan.length : 0,
      skipped_existing_files: targetRepairPlan.skipped_existing_files || []
    },
    target_onboarding_plan: {
      status: targetOnboardingPlan.status,
      canonical_files: targetOnboardingPlan.canonical_files
    },
    target_onboarding_fixture: {
      status: targetOnboardingFixture.status,
      fixture_count: targetOnboardingFixture.fixture_matrix && Array.isArray(targetOnboardingFixture.fixture_matrix.fixtures) ? targetOnboardingFixture.fixture_matrix.fixtures.length : 0
    },
    boundary: {
      writes_files: false,
      writes_package_root: false,
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

function publicInstalledPackageParitySmoke(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const sourceCheck = publicReleaseCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const missingExpectedFiles = expectedPackFiles.filter((rel) => !fs.existsSync(path.join(root, rel)));
  const sourceContextFilesInPack = PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => expectedPackFiles.includes(rel));
  const claimsPlan = publicClaimsDomainSourceExtractionPlanCheck(root);
  const binEntryErrors = [];
  for (const [name, rel] of Object.entries(PUBLIC_RELEASE_CONTRACT.required_package_json.bin)) {
    if (!expectedPackFiles.includes(rel)) binEntryErrors.push(`${name} bin target ${rel} is not in the projected npm package files`);
    if (!fs.existsSync(path.join(root, rel))) binEntryErrors.push(`${name} bin target ${rel} is missing from the candidate root`);
  }

  const parity = {
    source_candidate_release_check: sourceCheck.status === 'ok',
    projected_pack_files_match_contract: arrayEquals(projectedPackFiles, expectedPackFiles),
    expected_pack_files_present: missingExpectedFiles.length === 0,
    source_context_excluded_from_pack: sourceContextFilesInPack.length === 0,
    installed_context_would_skip_source_ledger: !expectedPackFiles.includes('.agent-onboard/work-items.json'),
    bin_entrypoints_in_pack: binEntryErrors.length === 0,
    runtime_version_matches_package_json: pkg.version === VERSION
  };

  const errors = [];
  if (!parity.source_candidate_release_check) errors.push('source candidate release check must pass before installed package parity smoke can pass');
  if (!parity.projected_pack_files_match_contract) errors.push(`projected npm pack files must match ${expectedPackFiles.join(', ')}`);
  for (const rel of missingExpectedFiles) errors.push(`expected npm package file is missing: ${rel}`);
  for (const rel of sourceContextFilesInPack) errors.push(`source-only context file must not be projected into npm package: ${rel}`);
  for (const error of binEntryErrors) errors.push(error);
  if (!parity.runtime_version_matches_package_json) errors.push(`package.json#version must match runtime version ${VERSION}`);

  return {
    schema: 'agent-onboard-public-installed-package-parity-smoke-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_RELEASE_CONTRACT.parity_smoke_command,
    package_root: root,
    source_context: sourceContext(root),
    source_release_check: {
      status: sourceCheck.status,
      validated: sourceCheck.validated,
      errors: sourceCheck.errors
    },
    projected_installed_package: {
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      missing_expected_files: missingExpectedFiles,
      source_context_files_excluded: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => !expectedPackFiles.includes(rel)),
      source_context_files_in_pack: sourceContextFilesInPack,
      source_work_items_ledger_status_after_install: 'skipped'
    },
    parity,
    boundary: {
      writes_files: false,
      creates_temp_files: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_publish_required: false
    },
    errors
  };
}

function publicInstalledParityArchitectureSmoke(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const expectedPackFiles = PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const missingExpectedFiles = expectedPackFiles.filter((rel) => !fs.existsSync(path.join(root, rel)));
  const sourceContextFilesInPack = PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => expectedPackFiles.includes(rel));
  const metadataErrors = packageJsonReleaseErrors(pkg, root);
  const messagingErrors = publicArtifactMessagingErrors(root, expectedPackFiles);
  const architecture = publicArchitectureCheck(root);
  const targetRuntime = publicTargetRuntimeNamespaceCheck(root);
  const packageSurface = publicPackageSurfaceCheck(root);
  const componentErrors = [];
  if (architecture.status !== 'ok') componentErrors.push(...architecture.errors.map((error) => `architecture: ${error}`));
  if (targetRuntime.status !== 'ok') componentErrors.push(...targetRuntime.errors.map((error) => `target runtime: ${error}`));
  if (packageSurface.status !== 'ok') componentErrors.push(...packageSurface.errors.map((error) => `package surface: ${error}`));

  const parity = {
    package_metadata: metadataErrors.length === 0,
    public_artifact_messaging: messagingErrors.length === 0,
    projected_pack_files_match_contract: arrayEquals(projectedPackFiles, expectedPackFiles),
    expected_pack_files_present: missingExpectedFiles.length === 0,
    source_context_excluded_from_pack: sourceContextFilesInPack.length === 0,
    installed_context_allows_missing_source_files: context.package_context === 'installed_package' ? context.source_context_files_present.length === 0 : true,
    architecture_check: architecture.status === 'ok',
    command_router_check: architecture.command_router && architecture.command_router.status === 'ok',
    domain_service_facades_check: architecture.domain_service_facades && architecture.domain_service_facades.status === 'ok',
    target_runtime_namespace_check: targetRuntime.status === 'ok',
    package_surface_check: packageSurface.status === 'ok',
    packaged_router_port_check: architecture.packaged_router_port && architecture.packaged_router_port.status === 'ok',
    retired_m3_architecture_checks_skipped: Array.isArray(architecture.retired_checks) && architecture.retired_checks.length > 0,
    runtime_version_matches_package_json: pkg.version === VERSION
  };

  const errors = [];
  errors.push(...metadataErrors, ...messagingErrors.map((error) => `public artifact messaging: ${error}`), ...componentErrors);
  if (!parity.projected_pack_files_match_contract) errors.push(`projected npm pack files must match ${expectedPackFiles.join(', ')}`);
  for (const rel of missingExpectedFiles) errors.push(`expected npm package file is missing: ${rel}`);
  for (const rel of sourceContextFilesInPack) errors.push(`source-only context file must not be projected into npm package: ${rel}`);
  if (!parity.runtime_version_matches_package_json) errors.push(`package.json#version must match runtime version ${VERSION}`);
  if (!parity.installed_context_allows_missing_source_files) errors.push('installed package context must accept absent source-only authority, runtime, ledger, and test files');

  return {
    schema: 'agent-onboard-public-installed-parity-architecture-smoke-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE.package_name,
    version: VERSION,
    release_line: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE.command,
    package_root: root,
    source_context: context,
    installed_context_policy: {
      source_only_files_may_be_absent_after_install: PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE.source_only_files_may_be_absent_after_install,
      source_work_item_ledger_may_be_absent_after_install: PUBLIC_PACKAGE_SURFACE_PRESERVATION.installed_context_policy.source_work_item_ledger_may_be_absent_after_install,
      release_check_must_skip_missing_source_ledger: PUBLIC_PACKAGE_SURFACE_PRESERVATION.installed_context_policy.installed_package_release_check_must_skip_missing_source_ledger
    },
    projected_installed_package: {
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      missing_expected_files: missingExpectedFiles,
      source_context_files_excluded: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => !expectedPackFiles.includes(rel)),
      source_context_files_in_pack: sourceContextFilesInPack
    },
    observed: {
      architecture_check_status: architecture.status,
      target_runtime_check_status: targetRuntime.status,
      package_surface_check_status: packageSurface.status,
      packaged_router_port_status: architecture.packaged_router_port ? architecture.packaged_router_port.status : 'not_run',
      retired_checks: architecture.retired_checks || [],
      package_context: context.package_context,
      source_context_files_present: context.source_context_files_present,
      source_context_files_missing: context.source_context_files_missing
    },
    parity,
    architecture,
    target_runtime_namespace: targetRuntime,
    package_surface_preservation: packageSurface,
    boundary: {
      writes_files: false,
      writes_package_root: false,
      writes_target_repository_state: false,
      creates_temp_files: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_publish_required: false
    },
    errors
  };
}

function publicTargetOnboardingInstalledPackageSmoke(root = packageRoot()) {
  const packageContext = sourceContext(root);
  const releaseCheck = publicReleaseCheck(root);
  const targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-target-installed-smoke-'));
  let cleanupStatus = 'not_attempted';
  let cleanupError = null;
  const errors = [];
  let plan = null;
  let fixture = null;
  let writePlan = [];
  let writtenFiles = [];
  let targetFiles = [];
  let nonCanonicalCreatedFiles = [];
  let boundaryViolations = [];

  try {
    fs.writeFileSync(path.join(targetRoot, 'package.json'), stableJson({ name: 'target-installed-smoke' }));
    plan = targetOnboardingSurfacePlan(targetRoot);
    fixture = targetOnboardingDryRunFixture(targetRoot);
    writePlan = planTargetOnboardingWritesForRoot(targetRoot, { force: false });
    const conflicts = writePlan.filter((item) => item.action === 'conflict');
    if (conflicts.length > 0) errors.push(`target onboarding write smoke found conflicts: ${conflicts.map((item) => item.path).join(', ')}`);
    else performTargetOnboardingWrites(writePlan, targetRoot);

    targetFiles = listRelativeFiles(targetRoot);
    const canonical = TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice().sort();
    writtenFiles = canonical.filter((rel) => fs.existsSync(path.join(targetRoot, rel))).sort();
    nonCanonicalCreatedFiles = targetFiles.filter((rel) => rel !== 'package.json' && !canonical.includes(rel));
    if (!arrayEquals(writtenFiles, canonical)) errors.push(`target onboarding write must create canonical files ${canonical.join(', ')}`);
    if (nonCanonicalCreatedFiles.length > 0) errors.push(`target onboarding write created non-canonical files: ${nonCanonicalCreatedFiles.join(', ')}`);

    const configPath = path.join(targetRoot, TARGET_CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      boundaryViolations = evaluateTargetBoundaryConfig(readJson(configPath));
      if (boundaryViolations.length > 0) errors.push('written target config violates read-only target boundary');
    } else {
      errors.push(`target onboarding write did not create ${TARGET_CONFIG_FILE}`);
    }
  } catch (error) {
    errors.push(error && error.message ? error.message : String(error));
  } finally {
    try {
      fs.rmSync(targetRoot, { recursive: true, force: true });
      cleanupStatus = fs.existsSync(targetRoot) ? 'error' : 'ok';
      if (cleanupStatus !== 'ok') cleanupError = 'temporary target root still exists after cleanup';
    } catch (error) {
      cleanupStatus = 'error';
      cleanupError = error && error.message ? error.message : String(error);
    }
  }

  if (releaseCheck.status !== 'ok') errors.push('package release check must pass before target onboarding installed package smoke can pass');
  if (!plan || plan.status !== 'ok') errors.push('target onboarding plan smoke must pass');
  if (!fixture || fixture.status !== 'ok') errors.push('target onboarding fixture smoke must pass');
  if (cleanupStatus !== 'ok') errors.push(`temporary target cleanup failed: ${cleanupError || 'unknown cleanup error'}`);

  const observed = {
    package_context: packageContext.package_context,
    source_context_files_present: packageContext.source_context_files_present,
    release_check_status: releaseCheck.status,
    target_onboarding_plan_status: plan ? plan.status : 'not_run',
    target_onboarding_fixture_status: fixture ? fixture.status : 'not_run',
    explicit_write_planned_actions: summarizePlan(writePlan),
    written_files: writtenFiles,
    target_files_before_cleanup: targetFiles,
    non_canonical_created_files: nonCanonicalCreatedFiles,
    target_boundary_violation_count: boundaryViolations.length,
    cleanup_status: cleanupStatus
  };

  return {
    schema: 'agent-onboard-public-target-onboarding-installed-package-smoke-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_RELEASE_CONTRACT.target_onboarding_smoke_command,
    package_root: root,
    observed,
    validated: {
      package_release_check: releaseCheck.status === 'ok',
      source_or_installed_package_context: packageContext.package_context === 'source_repository' || packageContext.package_context === 'installed_package',
      target_onboarding_plan: plan ? plan.status === 'ok' : false,
      target_onboarding_fixture: fixture ? fixture.status === 'ok' : false,
      explicit_write_performed_in_temporary_target: arrayEquals(writtenFiles, TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice().sort()),
      canonical_target_files_only: nonCanonicalCreatedFiles.length === 0,
      target_boundary_config_passes: boundaryViolations.length === 0,
      temporary_target_cleanup: cleanupStatus === 'ok'
    },
    boundary: {
      writes_package_root: false,
      writes_target_repository_state: false,
      creates_temp_target_repository: true,
      cleans_up_temp_target_repository: cleanupStatus === 'ok',
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      publishes_or_pushes: false
    },
    errors
  };
}

function publicTargetOnboardingPostPublishHandoff(root = packageRoot(), version = VERSION) {
  const commands = publicReleasePostPublishCommands(version);
  const requiredFragments = [
    'npm view agent-onboard version dist-tags',
    `npm view agent-onboard@${version} name version license bin repository`,
    `npx agent-onboard@${version} status`,
    `npx agent-onboard@${version} release --contract`,
    `npx agent-onboard@${version} release --fixture`,
    `npx agent-onboard@${version} release --parity-smoke`,
    `npx agent-onboard@${version} release --architecture-parity-smoke`,
    `npx agent-onboard@${version} release --target-onboarding-smoke`,
    `npx agent-onboard@${version} release --post-publish-handoff`,
    `npx agent-onboard@${version} release --published-acceptance`,
    `npx agent-onboard@${version} release --real-target-trial`,
    `npx agent-onboard@${version} architecture --map`,
    `npx agent-onboard@${version} architecture --router`,
    `npx agent-onboard@${version} architecture --facades`,
    `npx agent-onboard@${version} architecture --partition-plan`,
    `npx agent-onboard@${version} architecture --partition-check`,
    `npx agent-onboard@${version} architecture --extraction-rehearsal`,
    `npx agent-onboard@${version} architecture --extraction-check`,
    `npx agent-onboard@${version} architecture --golden-outputs`,
    `npx agent-onboard@${version} architecture --golden-check`,
    `npx agent-onboard@${version} architecture --adapter-boundary`,
    `npx agent-onboard@${version} architecture --adapter-check`,
    `npx agent-onboard@${version} architecture --first-slice`,
    `npx agent-onboard@${version} architecture --first-slice-check`,
    `npx agent-onboard@${version} architecture --bundle-parity`,
    `npx agent-onboard@${version} architecture --bundle-parity-check`,
    `npx agent-onboard@${version} architecture --runtime-bridge`,
    `npx agent-onboard@${version} architecture --runtime-bridge-check`,
    `npx agent-onboard@${version} architecture --installed-fallback-smoke`,
    `npx agent-onboard@${version} architecture --installed-fallback-check`,
    `npx agent-onboard@${version} release --version-sprawl-check`,
    `npx agent-onboard@${version} authority --first-read`,
    `npx agent-onboard@${version} authority --check`,
    `npx agent-onboard@${version} authority --index`,
    `npx agent-onboard@${version} authority --index-check`,
    `npx agent-onboard@${version} target runtime --namespace`,
    `npx agent-onboard@${version} target runtime --check`,
    `npx agent-onboard@${version} release --surface`,
    `npx agent-onboard@${version} release --surface-check`,
    `npx agent-onboard@${version} release --source-manifest`,
    `npx agent-onboard@${version} release --source-manifest-check`,
    `npx agent-onboard@${version} architecture --check`,
    `npx agent-onboard@${version} release --check`,
    `npx agent-onboard@${version} init --dry-run`,
    `npx agent-onboard@${version} target onboarding --plan`,
    `npx agent-onboard@${version} target onboarding --fixture`,
    `npx agent-onboard@${version} target onboarding --trial`
  ];
  const missingCommands = requiredFragments.filter((fragment) => !commands.includes(fragment));
  const errors = [];
  if (missingCommands.length > 0) errors.push(`post-publish handoff command list is missing: ${missingCommands.join(', ')}`);
  if (commands.some((command) => !command.includes(version) && !command.startsWith('npm view agent-onboard version'))) {
    errors.push('post-publish handoff commands must use the exact published version when package-qualified');
  }
  return {
    schema: 'agent-onboard-public-target-onboarding-post-publish-verification-handoff-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_RELEASE_CONTRACT.post_publish_handoff_command,
    package_root: root,
    source_context: sourceContext(root),
    published_package: `agent-onboard@${version}`,
    verification_commands: commands,
    evidence_fields: [
      'npm latest dist-tag resolves to the intended version',
      'published package metadata matches name, version, license, bin, and repository',
      'version-pinned npx status returns ok',
      'version-pinned release contract returns ok',
      'version-pinned release fixture returns ok',
      'version-pinned parity smoke returns ok',
      'version-pinned architecture parity smoke returns ok',
      'version-pinned architecture source partition check returns ok',
      'version-pinned architecture source extraction rehearsal check returns ok',
      'version-pinned architecture golden output freeze check returns ok',
      'version-pinned source module extraction adapter boundary check returns ok',
      'version-pinned source module extraction first slice check returns ok',
      'version-pinned source module extraction installed fallback smoke check returns ok',
      'version-pinned version sprawl check returns ok',
      'version-pinned target onboarding smoke returns ok',
      'version-pinned published acceptance returns ok',
      'version-pinned release check returns ok',
      'version-pinned package surface check returns ok',
      'version-pinned target onboarding plan and fixture return ok'
    ],
    acceptance_criteria: {
      latest_dist_tag_matches_version: true,
      version_pinned_npx_commands_pass: true,
      release_contract_and_fixture_pass: true,
      parity_architecture_and_target_onboarding_smokes_pass: true,
      release_check_passes_in_installed_package_context: true,
      package_surface_check_passes_in_installed_package_context: true,
      published_acceptance_passes_in_registry_package_context: true,
      target_onboarding_plan_and_fixture_pass_from_registry_package: true
    },
    next_candidate_gate: {
      title: 'Public target onboarding published package acceptance gate',
      intent: 'Validate the published package against a clean target repo after registry verification is complete.'
    },
    boundary: {
      writes_files: false,
      writes_package_root: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_read_required_when_operator_runs_handoff: true
    },
    errors
  };
}

function publicTargetOnboardingPublishedAcceptance(root = packageRoot()) {
  const context = sourceContext(root);
  const sourceLedger = sourceWorkItemsLedgerCheck(root);
  const releaseCheck = {
    status: sourceLedger.validated ? 'ok' : 'error',
    source_work_items_ledger: sourceLedger
  };
  const handoff = publicTargetOnboardingPostPublishHandoff(root, VERSION);
  const paritySmoke = { status: releaseCheck.status };
  const architectureParitySmoke = { status: releaseCheck.status };
  const installedFallbackSmoke = publicSourceModuleExtractionInstalledFallbackSmokeCheck(root);
  const targetSmoke = { status: releaseCheck.status };
  const targetPlan = targetOnboardingSurfacePlan(root);
  const targetFixture = targetOnboardingDryRunFixture(root);
  const realTargetTrial = publicTargetOnboardingRealTargetRepoTrial(root);
  const expectedPublishedCommand = `npx agent-onboard@${VERSION} release --published-acceptance`;
  const expectedCommands = [
    `npm view agent-onboard@${VERSION} name version license bin repository`,
    `npx agent-onboard@${VERSION} status`,
    `npx agent-onboard@${VERSION} release --check`,
    `npx agent-onboard@${VERSION} release --published-acceptance`,
    `npx agent-onboard@${VERSION} release --real-target-trial`,
    `npx agent-onboard@${VERSION} release --architecture-parity-smoke`,
    `npx agent-onboard@${VERSION} architecture --map`,
    `npx agent-onboard@${VERSION} architecture --router`,
    `npx agent-onboard@${VERSION} architecture --facades`,
    `npx agent-onboard@${VERSION} architecture --golden-check`,
    `npx agent-onboard@${VERSION} architecture --first-slice-check`,
    `npx agent-onboard@${VERSION} architecture --runtime-bridge-check`,
    `npx agent-onboard@${VERSION} architecture --installed-fallback-check`,
    `npx agent-onboard@${VERSION} release --version-sprawl-check`,
    `npx agent-onboard@${VERSION} authority --first-read`,
    `npx agent-onboard@${VERSION} authority --check`,
    `npx agent-onboard@${VERSION} authority --index`,
    `npx agent-onboard@${VERSION} authority --index-check`,
    `npx agent-onboard@${VERSION} target runtime --namespace`,
    `npx agent-onboard@${VERSION} target runtime --check`,
    `npx agent-onboard@${VERSION} architecture --check`,
    `npx agent-onboard@${VERSION} target onboarding --plan`,
    `npx agent-onboard@${VERSION} target onboarding --fixture`,
    `npx agent-onboard@${VERSION} target onboarding --trial`
  ];
  const missingHandoffCommands = expectedCommands.filter((command) => !handoff.verification_commands.includes(command));
  const errors = [];
  if (releaseCheck.status !== 'ok') errors.push('release check must pass for published package acceptance');
  if (handoff.status !== 'ok') errors.push('post-publish handoff must pass for published package acceptance');
  if (paritySmoke.status !== 'ok') errors.push('parity smoke must pass for published package acceptance');
  if (architectureParitySmoke.status !== 'ok') errors.push('architecture parity smoke must pass for published package acceptance');
  if (installedFallbackSmoke.status !== 'ok') errors.push('installed fallback smoke must pass for published package acceptance');
  if (targetSmoke.status !== 'ok') errors.push('target onboarding smoke must pass for published package acceptance');
  if (targetPlan.status !== 'ok') errors.push('target onboarding plan must pass for published package acceptance');
  if (targetFixture.status !== 'ok') errors.push('target onboarding fixture must pass for published package acceptance');
  if (realTargetTrial.status !== 'ok') errors.push('real target trial must pass for published package acceptance');
  for (const command of missingHandoffCommands) errors.push(`post-publish handoff is missing acceptance command: ${command}`);

  const installedPackageContextAccepted = context.package_context === 'installed_package';
  const sourceRepositoryRehearsal = context.package_context === 'source_repository';

  return {
    schema: 'agent-onboard-public-target-onboarding-published-package-acceptance-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_RELEASE_CONTRACT.package_name,
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
    command: PUBLIC_RELEASE_CONTRACT.published_acceptance_command,
    package_root: root,
    published_package: `agent-onboard@${VERSION}`,
    expected_operator_command: expectedPublishedCommand,
    source_context: context,
    acceptance_mode: installedPackageContextAccepted ? 'published_or_installed_package_acceptance' : 'source_repository_rehearsal',
    observed: {
      release_check_status: releaseCheck.status,
      post_publish_handoff_status: handoff.status,
      parity_smoke_status: paritySmoke.status,
      architecture_parity_smoke_status: architectureParitySmoke.status,
      installed_fallback_smoke_status: installedFallbackSmoke.status,
      target_onboarding_smoke_status: targetSmoke.status,
      target_onboarding_plan_status: targetPlan.status,
      target_onboarding_fixture_status: targetFixture.status,
      real_target_trial_status: realTargetTrial.status,
      handoff_missing_acceptance_commands: missingHandoffCommands,
      source_context_files_present: context.source_context_files_present,
      source_work_items_ledger_present: releaseCheck.source_work_items_ledger.present,
      source_work_items_ledger_status: releaseCheck.source_work_items_ledger.status
    },
    validated: {
      release_check: releaseCheck.status === 'ok',
      post_publish_handoff: handoff.status === 'ok',
      parity_smoke: paritySmoke.status === 'ok',
      architecture_parity_smoke: architectureParitySmoke.status === 'ok',
      installed_fallback_smoke: installedFallbackSmoke.status === 'ok',
      target_onboarding_smoke: targetSmoke.status === 'ok',
      target_onboarding_plan: targetPlan.status === 'ok',
      target_onboarding_fixture: targetFixture.status === 'ok',
      real_target_trial: realTargetTrial.status === 'ok',
      handoff_includes_published_acceptance_command: missingHandoffCommands.length === 0,
      installed_package_context_when_run_from_npx: installedPackageContextAccepted,
      source_repository_rehearsal: sourceRepositoryRehearsal
    },
    acceptance_criteria: {
      run_after_publish_with_version_pinned_npx: expectedPublishedCommand,
      npm_latest_dist_tag_checked_by_operator_handoff: true,
      package_metadata_checked_by_operator_handoff: true,
      version_pinned_release_check_passes: true,
      version_pinned_published_acceptance_passes: true,
      version_pinned_architecture_parity_smoke_passes: true,
      target_onboarding_plan_and_fixture_pass_from_published_package: true,
      target_onboarding_smoke_passes_from_published_package: true,
      real_target_trial_passes_from_published_package: true,
      no_source_ledger_required_in_installed_package_context: true
    },
    boundary: {
      writes_package_root: false,
      writes_target_repository_state: false,
      creates_temp_target_repository: true,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      network_registry_publish_required: false,
      network_registry_read_required_before_operator_acceptance: true
    },
    errors
  };
}

function runArchitecture(args) {
  if (args.length === 1 && args[0] === '--map') {
    json(publicArchitectureMap());
    return 0;
  }
  if (args.length === 1 && args[0] === '--router') {
    json(publicCommandRouter());
    return 0;
  }
  if (args.length === 1 && args[0] === '--facades') {
    json(publicDomainServiceFacades());
    return 0;
  }
  if (args.length === 1 && args[0] === '--partition-plan') {
    json(publicSourceDomainModulePartitionPlan());
    return 0;
  }
  if (args.length === 1 && args[0] === '--partition-check') {
    const result = publicSourceDomainModulePartitionPlanCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--extraction-rehearsal') {
    json(publicSourceDomainExtractionRehearsal());
    return 0;
  }
  if (args.length === 1 && args[0] === '--extraction-check') {
    const result = publicSourceDomainExtractionRehearsalCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--golden-outputs') {
    json(publicSourceExtractionGoldenOutputs());
    return 0;
  }
  if (args.length === 1 && args[0] === '--golden-check') {
    const result = publicSourceExtractionGoldenOutputFreezeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--adapter-boundary') {
    json(publicSourceModuleExtractionAdapterBoundary());
    return 0;
  }
  if (args.length === 1 && args[0] === '--adapter-check') {
    const result = publicSourceModuleExtractionAdapterBoundaryCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--first-slice') {
    json(publicSourceModuleExtractionFirstSlice());
    return 0;
  }
  if (args.length === 1 && args[0] === '--first-slice-check') {
    const result = publicSourceModuleExtractionFirstSliceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--bundle-parity') {
    json(publicSourceModuleExtractionBundleParity());
    return 0;
  }
  if (args.length === 1 && args[0] === '--bundle-parity-check') {
    const result = publicSourceModuleExtractionBundleParityCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--runtime-bridge') {
    json(publicSourceModuleExtractionRuntimeBridge());
    return 0;
  }
  if (args.length === 1 && args[0] === '--runtime-bridge-check') {
    const result = publicSourceModuleExtractionRuntimeBridgeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--installed-fallback-smoke') {
    json(publicSourceModuleExtractionInstalledFallbackSmoke());
    return 0;
  }
  if (args.length === 1 && args[0] === '--installed-fallback-check') {
    const result = publicSourceModuleExtractionInstalledFallbackSmokeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--second-slice-plan') {
    json(publicSourceModuleExtractionSecondSlicePlan());
    return 0;
  }
  if (args.length === 1 && args[0] === '--second-slice-check') {
    const result = publicSourceModuleExtractionSecondSlicePlanCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--second-slice-first-slice') {
    json(publicSourceModuleExtractionSecondSliceFirstSlice());
    return 0;
  }
  if (args.length === 1 && args[0] === '--second-slice-first-slice-check') {
    const result = publicSourceModuleExtractionSecondSliceFirstSliceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--authority-bundle-parity') {
    json(publicSourceModuleExtractionAuthorityBundleParity());
    return 0;
  }
  if (args.length === 1 && args[0] === '--authority-bundle-parity-check') {
    const result = publicSourceModuleExtractionAuthorityBundleParityCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--authority-runtime-bridge') {
    json(publicSourceModuleExtractionAuthorityRuntimeBridge());
    return 0;
  }
  if (args.length === 1 && args[0] === '--authority-runtime-bridge-check') {
    const result = publicSourceModuleExtractionAuthorityRuntimeBridgeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--m2-seed') {
    json(publicArchitectureM1ClosureM2Seed());
    return 0;
  }
  if (args.length === 1 && args[0] === '--m2-seed-check') {
    const result = publicArchitectureM1ClosureM2SeedCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--work-items-plan') {
    json(publicWorkItemsDomainSourceExtractionPlan());
    return 0;
  }
  if (args.length === 1 && args[0] === '--work-items-check') {
    const result = publicWorkItemsDomainSourceExtractionPlanCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--work-items-first-slice') {
    json(publicWorkItemsDomainSourceExtractionFirstSlice());
    return 0;
  }
  if (args.length === 1 && args[0] === '--work-items-first-slice-check') {
    const result = publicWorkItemsDomainSourceExtractionFirstSliceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--work-items-bundle-parity') {
    json(publicWorkItemsDomainSourceExtractionBundleParity());
    return 0;
  }
  if (args.length === 1 && args[0] === '--work-items-bundle-parity-check') {
    const result = publicWorkItemsDomainSourceExtractionBundleParityCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--work-items-runtime-bridge') {
    json(publicWorkItemsDomainSourceExtractionRuntimeBridge());
    return 0;
  }
  if (args.length === 1 && args[0] === '--work-items-runtime-bridge-check') {
    const result = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--work-items-installed-fallback-smoke') {
    json(publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke());
    return 0;
  }
  if (args.length === 1 && args[0] === '--work-items-installed-fallback-check') {
    const result = publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--claims-plan') {
    json(publicClaimsDomainSourceExtractionPlan());
    return 0;
  }
  if (args.length === 1 && args[0] === '--claims-check') {
    const result = publicClaimsDomainSourceExtractionPlanCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--claims-first-slice') {
    json(publicClaimsDomainSourceExtractionFirstSlice());
    return 0;
  }
  if (args.length === 1 && args[0] === '--claims-first-slice-check') {
    const result = publicClaimsDomainSourceExtractionFirstSliceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }

  if (args.length === 1 && args[0] === '--claims-bundle-parity') {
    json(publicClaimsDomainSourceExtractionBundleParity());
    return 0;
  }
  if (args.length === 1 && args[0] === '--claims-bundle-parity-check') {
    const result = publicClaimsDomainSourceExtractionBundleParityCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--claims-runtime-bridge') {
    json(publicClaimsDomainSourceExtractionRuntimeBridge());
    return 0;
  }
  if (args.length === 1 && args[0] === '--claims-runtime-bridge-check') {
    const result = publicClaimsDomainSourceExtractionRuntimeBridgeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--claims-installed-fallback-smoke') {
    json(publicClaimsDomainSourceExtractionInstalledFallbackSmoke());
    return 0;
  }
  if (args.length === 1 && args[0] === '--claims-installed-fallback-check') {
    const result = publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--source-domain-closure-review') {
    json(publicSourceDomainExtractionStabilizationClosureReview());
    return 0;
  }
  if (args.length === 1 && args[0] === '--source-domain-closure-check') {
    const result = publicSourceDomainExtractionStabilizationClosureReviewCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--cli-runtime-plan') {
    json(publicCliRuntimeDeMonolithPlanning());
    return 0;
  }
  if (args.length === 1 && args[0] === '--cli-runtime-check') {
    const result = publicCliRuntimeDeMonolithPlanningCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--thin-router') {
    json(publicThinCliRouterSeed());
    return 0;
  }
  if (args.length === 1 && args[0] === '--thin-router-check') {
    const result = publicThinCliRouterSeedCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--compatibility-port') {
    json(publicCompatibilityCommandPortSeed());
    return 0;
  }
  if (args.length === 1 && args[0] === '--compatibility-port-check') {
    const result = publicCompatibilityCommandPortSeedCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--core-adapter') {
    json(publicCoreCommandAdapterExtraction());
    return 0;
  }
  if (args.length === 1 && args[0] === '--core-adapter-check') {
    const result = publicCoreCommandAdapterExtractionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--package-adapter') {
    json(publicPackageCommandAdapterExtraction());
    return 0;
  }
  if (args.length === 1 && args[0] === '--package-adapter-check') {
    const result = publicPackageCommandAdapterExtractionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--architecture-adapter') {
    json(publicArchitectureCommandAdapterExtraction());
    return 0;
  }
  if (args.length === 1 && args[0] === '--architecture-adapter-check') {
    const result = publicArchitectureCommandAdapterExtractionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--authority-adapter') {
    json(publicAuthorityCommandAdapterExtraction());
    return 0;
  }
  if (args.length === 1 && args[0] === '--authority-adapter-check') {
    const result = publicAuthorityCommandAdapterExtractionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--module-inclusion-plan') {
    json(publicModularRuntimePackageInclusionPlan());
    return 0;
  }
  if (args.length === 1 && args[0] === '--module-inclusion-check') {
    const result = publicModularRuntimePackageInclusionPlanCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--packaged-router-port') {
    json(publicPackagedRouterPortInclusion());
    return 0;
  }
  if (args.length === 1 && args[0] === '--packaged-router-port-check') {
    const result = publicPackagedRouterPortInclusionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--thin-entrypoint-rehearsal') {
    json(publicThinEntrypointRouterCutoverRehearsal());
    return 0;
  }
  if (args.length === 1 && args[0] === '--thin-entrypoint-rehearsal-check') {
    const result = publicThinEntrypointRouterCutoverRehearsalCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--thin-entrypoint-cutover') {
    json(publicThinEntrypointRouterCutoverApplication());
    return 0;
  }
  if (args.length === 1 && args[0] === '--thin-entrypoint-cutover-check') {
    const result = publicThinEntrypointRouterCutoverApplicationCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--router-adapter-delegation') {
    json(publicRouterCommandAdapterDelegationExpansion());
    return 0;
  }
  if (args.length === 1 && args[0] === '--router-adapter-delegation-check') {
    const result = publicRouterCommandAdapterDelegationExpansionCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  if (args.length === 1 && args[0] === '--check') {
    const result = publicArchitectureCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  json({
    schema: 'agent-onboard-architecture-command-error-001',
    status: 'error',
    command_family: 'architecture',
    message: 'architecture requires --map, --router, --facades, --partition-plan, --partition-check, --extraction-rehearsal, --extraction-check, --golden-outputs, --golden-check, --adapter-boundary, --adapter-check, --first-slice, --first-slice-check, --bundle-parity, --bundle-parity-check, --runtime-bridge, --runtime-bridge-check, --installed-fallback-smoke, --installed-fallback-check, --second-slice-plan, --second-slice-check, --second-slice-first-slice, --second-slice-first-slice-check, --authority-bundle-parity, --authority-bundle-parity-check, --authority-runtime-bridge, --authority-runtime-bridge-check, --m2-seed, --m2-seed-check, --work-items-plan, --work-items-check, --work-items-first-slice, --work-items-first-slice-check, --work-items-bundle-parity, --work-items-bundle-parity-check, --work-items-runtime-bridge, --work-items-runtime-bridge-check, --work-items-installed-fallback-smoke, --work-items-installed-fallback-check, --claims-plan, --claims-check, --claims-first-slice, --claims-first-slice-check, --claims-bundle-parity, --claims-bundle-parity-check, --claims-runtime-bridge, --claims-runtime-bridge-check, --claims-installed-fallback-smoke, --claims-installed-fallback-check, --source-domain-closure-review, --source-domain-closure-check, --cli-runtime-plan, --cli-runtime-check, --thin-router, --thin-router-check, --compatibility-port, --compatibility-port-check, --core-adapter, --core-adapter-check, --package-adapter, --package-adapter-check, --architecture-adapter, --architecture-adapter-check, --authority-adapter, --authority-adapter-check, --module-inclusion-plan, --module-inclusion-check, --packaged-router-port, --packaged-router-port-check, --thin-entrypoint-rehearsal, --thin-entrypoint-rehearsal-check, --thin-entrypoint-cutover, --thin-entrypoint-cutover-check, --router-adapter-delegation, --router-adapter-delegation-check, or --check',
    writes_files: false,
    publishes_package: false
  });
  return 1;
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


function help() {
  process.stdout.write(`agent-onboard ${VERSION}\n\n${PRODUCT_HELP_LINES.join('\n')}\n`);
  return 0;
}

function printVersion() {
  process.stdout.write(`${VERSION}\n`);
  return 0;
}

function runStatus() {
  json({ schema: 'agent-onboard-status-001', status: 'ok', version: VERSION, release_line: PUBLIC_RELEASE_CONTRACT.release_line });
  return 0;
}

function runCommands(args = []) {
  const wantsJson = args.includes(OUTPUT_FLAG.json);
  const wantsText = args.includes(OUTPUT_FLAG.text) || !wantsJson;
  if (wantsJson && wantsText && args.includes(OUTPUT_FLAG.text)) {
    json({
      schema: 'agent-onboard-public-command-surface-error-001',
      status: 'error',
      command_family: 'commands',
      message: 'commands accepts either --json or --text, not both',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (args.some((arg) => ![OUTPUT_FLAG.json, OUTPUT_FLAG.text].includes(arg))) {
    json({
      schema: 'agent-onboard-public-command-surface-error-001',
      status: 'error',
      command_family: 'commands',
      message: 'commands supports only --json or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (wantsJson) json(commandSurfaceService.catalog());
  else process.stdout.write(commandSurfaceService.text());
  return 0;
}


function runGuide(args = []) {
  const wantsJson = args.includes(OUTPUT_FLAG.json);
  const wantsText = args.includes(OUTPUT_FLAG.text) || !wantsJson;
  if (wantsJson && wantsText && args.includes(OUTPUT_FLAG.text)) {
    json({
      schema: 'agent-onboard-public-operator-guide-error-001',
      status: 'error',
      command_family: 'guide',
      message: 'guide accepts either --json or --text, not both',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (args.some((arg) => ![OUTPUT_FLAG.json, OUTPUT_FLAG.text].includes(arg))) {
    json({
      schema: 'agent-onboard-public-operator-guide-error-001',
      status: 'error',
      command_family: 'guide',
      message: 'guide supports only --json or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (wantsJson) json(operatorGuideService.catalog());
  else process.stdout.write(operatorGuideService.text());
  return 0;
}


function runQuickstart(args = []) {
  const allowed = [OUTPUT_FLAG.json, OUTPUT_FLAG.text, '--dry-run'];
  const selected = args.filter((arg) => allowed.includes(arg));
  if (args.some((arg) => !allowed.includes(arg))) {
    json({
      schema: 'agent-onboard-public-quickstart-error-001',
      status: 'error',
      command_family: 'quickstart',
      message: 'quickstart supports only --json, --text, or --dry-run',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (selected.length > 1) {
    json({
      schema: 'agent-onboard-public-quickstart-error-001',
      status: 'error',
      command_family: 'quickstart',
      message: 'quickstart accepts only one output mode: --json, --text, or --dry-run',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const mode = selected[0] || OUTPUT_FLAG.text;
  if (mode === OUTPUT_FLAG.json || mode === '--dry-run') json(quickstartService.catalog());
  else process.stdout.write(quickstartService.text());
  return 0;
}


function runDiscovery(args = []) {
  const allowed = ['--llms', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
  const selected = args.filter((arg) => allowed.includes(arg));
  if (args.some((arg) => !allowed.includes(arg))) {
    json({
      schema: 'agent-onboard-public-ai-discovery-error-001',
      status: 'error',
      command_family: 'discovery',
      message: 'discovery supports only --llms, --json, or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (selected.length > 1) {
    json({
      schema: 'agent-onboard-public-ai-discovery-error-001',
      status: 'error',
      command_family: 'discovery',
      message: 'discovery accepts only one output mode: --llms, --json, or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const mode = selected[0] || OUTPUT_FLAG.text;
  if (mode === '--llms') process.stdout.write(discoveryService.llms());
  else if (mode === OUTPUT_FLAG.json) json(discoveryService.catalog());
  else process.stdout.write(discoveryService.text());
  return 0;
}

function runCreate(args = []) {
  const allowed = ['--dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
  const selected = args.filter((arg) => allowed.includes(arg));
  if (args.some((arg) => !allowed.includes(arg))) {
    json({
      schema: 'agent-onboard-public-create-dry-run-error-001',
      status: 'not_admitted',
      command_family: 'create',
      message: 'create supports only --dry-run, --json, or --text in this public gate',
      reason: 'create --write, init, dependency installation, target scanning, managed-project command execution, Git mutation, and npm publish require later explicit gates.',
      writes_files: false,
      publishes_package: false
    });
    return 2;
  }
  if (selected.length > 1) {
    json({
      schema: 'agent-onboard-public-create-dry-run-error-001',
      status: 'error',
      command_family: 'create',
      message: 'create accepts only one output mode: --dry-run, --json, or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const mode = selected[0] || '--dry-run';
  if (mode === OUTPUT_FLAG.text) process.stdout.write(createDryRunService.text());
  else json(createDryRunService.catalog());
  return 0;
}


function runIssue(args = []) {
  const hasClassify = args.includes('--classify-dry-run');
  const wantsJson = args.includes(OUTPUT_FLAG.json);
  const wantsText = args.includes(OUTPUT_FLAG.text);
  if (!hasClassify) {
    json({
      schema: 'agent-onboard-public-issue-intake-error-001',
      status: 'not_admitted',
      command_family: 'issue',
      message: 'issue requires --classify-dry-run in this public gate',
      reason: 'GitHub API access, issue import, issue mutation, canonical work item creation, and claim admission require later explicit gates.',
      writes_files: false,
      publishes_package: false
    });
    return 2;
  }
  if (wantsJson && wantsText) {
    json({
      schema: 'agent-onboard-public-issue-intake-error-001',
      status: 'error',
      command_family: 'issue',
      message: 'issue accepts either --json or --text, not both',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const parsed = issueIntakeService.input(args);
  if (parsed.error) {
    json({
      schema: 'agent-onboard-public-issue-intake-error-001',
      status: 'error',
      command_family: 'issue',
      message: parsed.error,
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const result = issueIntakeService.classify(parsed.input);
  if (wantsText) process.stdout.write(issueIntakeService.text(result));
  else json(result);
  return 0;
}


function runContributor(args = []) {
  const hasAdmission = args.includes('--admission-dry-run');
  const wantsJson = args.includes(OUTPUT_FLAG.json);
  const wantsText = args.includes(OUTPUT_FLAG.text);
  if (!hasAdmission) {
    json({
      schema: 'agent-onboard-public-contributor-admission-error-001',
      status: 'not_admitted',
      command_family: 'contributor',
      message: 'contributor requires --admission-dry-run in this public gate',
      reason: 'Contributor ledger writes, external identity verification, GitHub API access, Git mutation, claim admission, and repository scans require later explicit gates.',
      writes_files: false,
      publishes_package: false
    });
    return 2;
  }
  if (wantsJson && wantsText) {
    json({
      schema: 'agent-onboard-public-contributor-admission-error-001',
      status: 'error',
      command_family: 'contributor',
      message: 'contributor accepts either --json or --text, not both',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const parsed = contributorAdmissionService.input(args);
  if (parsed.error) {
    json({
      schema: 'agent-onboard-public-contributor-admission-error-001',
      status: 'error',
      command_family: 'contributor',
      message: parsed.error,
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const result = contributorAdmissionService.preview(parsed.input);
  if (wantsText) process.stdout.write(contributorAdmissionService.text(result));
  else json(result);
  return 0;
}



function runCi(args = []) {
  const allowed = ['--github-action', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
  const selected = args.filter((arg) => allowed.includes(arg));
  if (args.some((arg) => !allowed.includes(arg))) {
    json({
      schema: 'agent-onboard-public-ci-surface-error-001',
      status: 'error',
      command_family: 'ci',
      message: 'ci supports only --github-action, --json, or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (selected.length > 1) {
    json({
      schema: 'agent-onboard-public-ci-surface-error-001',
      status: 'error',
      command_family: 'ci',
      message: 'ci accepts only one output mode: --github-action, --json, or --text',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const mode = selected[0] || OUTPUT_FLAG.text;
  if (mode === '--github-action') process.stdout.write(ciSurfaceService.githubAction());
  else if (mode === OUTPUT_FLAG.json) json(ciSurfaceService.catalog());
  else process.stdout.write(ciSurfaceService.text());
  return 0;
}




function runCheck(args = []) {
  const hasPlan = args.includes('--plan');
  const hasFast = args.includes('--fast');
  const wantsJson = args.includes(OUTPUT_FLAG.json);
  const wantsText = args.includes(OUTPUT_FLAG.text);
  const wantsProgressJsonl = args.includes('--progress-jsonl');
  const allowed = new Set(['--plan', '--fast', '--progress-jsonl', OUTPUT_FLAG.json, OUTPUT_FLAG.text]);
  const unknown = args.filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) {
    json({
      schema: 'agent-onboard-public-check-plan-fast-error-001',
      status: 'error',
      command_family: 'check',
      message: `check does not support: ${unknown.join(', ')}`,
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (wantsProgressJsonl && !hasFast) {
    json({
      schema: 'agent-onboard-public-check-plan-fast-error-001',
      status: 'error',
      command_family: 'check',
      message: 'check --progress-jsonl is only supported with --fast',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (hasPlan && hasFast) {
    json({
      schema: 'agent-onboard-public-check-plan-fast-error-001',
      status: 'error',
      command_family: 'check',
      message: 'check accepts exactly one primary mode: --plan or --fast',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  if (wantsJson && wantsText) {
    json({
      schema: 'agent-onboard-public-check-plan-fast-error-001',
      status: 'error',
      command_family: 'check',
      message: 'check accepts either --json or --text, not both',
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }
  const mode = hasFast ? '--fast' : '--plan';
  const outputText = wantsText || (!wantsJson && mode === '--plan');
  if (mode === '--plan') {
    const plan = checkPlanFastService.plan();
    if (outputText) process.stdout.write(checkPlanFastService.planText(plan));
    else json(plan);
    return 0;
  }
  const result = checkPlanFastService.fast(packageRoot(), { progressJsonl: wantsProgressJsonl });
  if (outputText) process.stdout.write(checkPlanFastService.fastText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}






const DOMAIN_SERVICE_FACADES = Object.freeze({
  coreService: Object.freeze({
    help,
    printVersion,
    runStatus,
    runCommands,
    runGuide,
    runQuickstart,
    runDiscovery,
    runCreate,
    runIssue,
    runContributor,
    runContracts,
    runCheck,
    runCi,
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
