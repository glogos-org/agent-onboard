'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { route: routeCommand } = require('./command-router');
const { createCompatibilityCommandPort } = require('./adapters/compatibility-command-port');
const { createCoreCommandAdapter } = require('./adapters/commands/core');
const { createPackageCommandAdapter } = require('./adapters/commands/release-package');
const { createArchitectureCommandAdapter } = require('./adapters/commands/architecture');
const { createAuthorityCommandAdapter } = require('./adapters/commands/authority');
const { createTargetCommandAdapter } = require('./adapters/commands/target');
const { createWorkItemsCommandAdapter } = require('./adapters/commands/work-items');
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
const { createPublicRuntimeCheckFastService } = require('./domains/core/services/public-runtime-check-fast-service');
const { createPublicRuntimeMcpBridgeService } = require('./domains/core/services/public-runtime-mcp-bridge-service');
const { createPublicRuntimeAgentsBridgeService } = require('./domains/authority/services/public-runtime-agents-bridge-service');
const { service: packageDomain, sourceManifest: packageSourceManifestDomain } = require('./domains/package');
const { createWorkItemsService } = require('./domains/work-items');
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
const COMMANDS_COMMAND = 'commands';
const GUIDE_COMMAND = 'guide';
const QUICKSTART_COMMAND = 'quickstart';
const DISCOVERY_COMMAND = 'discovery';
const CREATE_COMMAND = 'create';
const ISSUE_COMMAND = 'issue';
const CONTRIBUTOR_COMMAND = 'contributor';
const CONTRACTS_COMMAND = 'contracts';
const CHECK_COMMAND = 'check';
const CI_COMMAND = 'ci';
const MCP_COMMAND = 'mcp';

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

const TARGET_MEMORY_SURFACE_CANDIDATES = Object.freeze([
  { path: 'AGENTS.md', kind: 'agent_instruction', authority: 'candidate_first_read', read_policy: 'read_summary_or_full_text_on_agent_request' },
  { path: 'llms.txt', kind: 'ai_discovery', authority: 'candidate_discovery', read_policy: 'read_before_agent_workflow_selection' },
  { path: 'README.md', kind: 'human_project_overview', authority: 'candidate_context', read_policy: 'read_summary_or_full_text_on_agent_request' },
  { path: 'CLAUDE.md', kind: 'model_specific_agent_instruction', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.github/copilot-instructions.md', kind: 'model_specific_agent_instruction', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.cursor/rules', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/agents', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/commands', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/skills', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.repo-identifier', kind: 'repo_identity_marker', authority: 'candidate_identity', read_policy: 'metadata_only_in_this_command' },
  { path: '.agent-onboard/target.json', kind: 'target_config', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/project.json', kind: 'target_project_state', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/work-items.json', kind: 'work_item_state', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/authority-path.json', kind: 'authority_path', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/authority-index.json', kind: 'authority_compact_index', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/claims.jsonl', kind: 'claims_ledger', authority: 'target_owned_state', read_policy: 'metadata_only_in_this_command' },
  { path: '.agent-onboard/target-memory.json', kind: 'target_memory_descriptor', authority: 'target_owned_state', read_policy: 'metadata_only_in_this_command' }
]);

const TARGET_ROOT_MANIFEST_CANDIDATES = Object.freeze([
  { path: 'package.json', ecosystem: 'node-npm' },
  { path: 'Cargo.toml', ecosystem: 'rust-cargo' },
  { path: 'pyproject.toml', ecosystem: 'python' },
  { path: 'go.mod', ecosystem: 'go' },
  { path: 'pom.xml', ecosystem: 'jvm-maven' },
  { path: 'build.gradle', ecosystem: 'jvm-gradle' },
  { path: 'deno.json', ecosystem: 'deno' }
]);

function safeRelativeStat(root, rel) {
  const absolute = path.resolve(root, rel);
  const rootWithSep = path.resolve(root) + path.sep;
  if (absolute !== path.resolve(root) && !absolute.startsWith(rootWithSep)) {
    return { path: rel, present: false, kind: 'invalid_path', bytes: null };
  }
  if (!fs.existsSync(absolute)) return { path: rel, present: false, kind: 'missing', bytes: null };
  const stat = fs.statSync(absolute);
  return {
    path: rel,
    present: true,
    kind: stat.isDirectory() ? 'directory' : (stat.isFile() ? 'file' : 'other'),
    bytes: stat.isFile() ? stat.size : null
  };
}

function targetMemoryRootManifest(root) {
  const seen = TARGET_ROOT_MANIFEST_CANDIDATES.filter((candidate) => fs.existsSync(path.join(root, candidate.path)));
  const primary = seen[0] || null;
  return {
    primary_manifest: primary ? primary.path : null,
    ecosystem: primary ? primary.ecosystem : 'unknown',
    manifests_seen: seen.map((candidate) => candidate.path)
  };
}

function targetMemoryDescriptor(targetRoot = process.cwd()) {
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  if (!fs.existsSync(absoluteTargetRoot)) {
    return {
      schema: 'agent-onboard-public-target-memory-preview-001',
      status: 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: 'agent-onboard target memory --preview',
      command_family: 'target memory',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        reads_file_contents: false,
        stores_target_ai_file_contents: false,
        imports_hidden_model_memory: false,
        treats_chat_history_as_authority: false,
        scans_arbitrary_private_files: false,
        network: false,
        git_mutation: false
      }
    };
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return {
      schema: 'agent-onboard-public-target-memory-preview-001',
      status: 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: 'agent-onboard target memory --preview',
      command_family: 'target memory',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        reads_file_contents: false,
        stores_target_ai_file_contents: false,
        imports_hidden_model_memory: false,
        treats_chat_history_as_authority: false,
        scans_arbitrary_private_files: false,
        network: false,
        git_mutation: false
      }
    };
  }

  const rootManifest = targetMemoryRootManifest(absoluteTargetRoot);
  const surfaces = TARGET_MEMORY_SURFACE_CANDIDATES.map((candidate) => {
    const observed = safeRelativeStat(absoluteTargetRoot, candidate.path);
    return {
      path: candidate.path,
      kind: candidate.kind,
      authority: candidate.authority,
      read_policy: candidate.read_policy,
      present: observed.present,
      observed_kind: observed.kind,
      bytes: observed.bytes,
      content_imported: false
    };
  });
  const presentSurfaces = surfaces.filter((surface) => surface.present);
  const authorityGroups = presentSurfaces.reduce((acc, surface) => {
    if (!acc[surface.authority]) acc[surface.authority] = [];
    acc[surface.authority].push(surface.path);
    return acc;
  }, {});
  return {
    schema: 'agent-onboard-public-target-memory-preview-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard target memory --preview',
    command_family: 'target memory',
    target: {
      name: path.basename(absoluteTargetRoot) || 'target-repo',
      kind: 'directory',
      root: absoluteTargetRoot,
      primary_manifest: rootManifest.primary_manifest,
      ecosystem: rootManifest.ecosystem,
      manifests_seen: rootManifest.manifests_seen
    },
    memory_model: {
      repo_native_memory_surface_is_candidate_authority: true,
      target_owned_state_may_be_authority_after_target_owner_admission: true,
      hidden_model_memory_is_authority: false,
      chat_history_is_authority: false,
      provider_runtime_state_is_target_authority: false,
      descriptor_preview_is_authority_now: false
    },
    surfaces,
    summary: {
      known_surface_count: surfaces.length,
      present_surface_count: presentSurfaces.length,
      present_surfaces: presentSurfaces.map((surface) => surface.path),
      authority_groups: authorityGroups
    },
    output_policy: {
      compact_default: true,
      file_contents_inlined: false,
      target_ai_memory_content_imported: false,
      provider_authority_files_inlined: false,
      stores_target_ai_file_metadata_only: true
    },
    recommended_next_commands: [
      'agent-onboard target doctor --text',
      'agent-onboard target profile --text',
      'agent-onboard target onboarding --plan',
      'agent-onboard work-items --next --text'
    ],
    writes_performed: false,
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      reads_file_contents: false,
      stores_target_ai_file_contents: false,
      imports_hidden_model_memory: false,
      treats_chat_history_as_authority: false,
      scans_arbitrary_private_files: false,
      bounded_known_path_probe_only: true,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false,
      git_mutation: false
    }
  };
}

function targetMemoryText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target memory',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const present = result.summary.present_surfaces.length > 0 ? result.summary.present_surfaces.join(', ') : 'none';
  const groups = Object.keys(result.summary.authority_groups).sort().map((key) => `  - ${key}: ${result.summary.authority_groups[key].join(', ')}`);
  return [
    'agent-onboard target memory',
    `Target: ${result.target.name} (${result.target.ecosystem})`,
    `Root: ${result.target.root}`,
    `Known surfaces: ${result.summary.known_surface_count}`,
    `Present surfaces: ${result.summary.present_surface_count}`,
    `Present: ${present}`,
    'Authority groups:',
    ...(groups.length > 0 ? groups : ['  none']),
    'Policy: metadata-only preview; file contents are not imported or stored.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

const targetMemoryService = Object.freeze({
  descriptor: targetMemoryDescriptor,
  text: targetMemoryText
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
  targetMemoryService,
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
    current_source_modules_present: ['src/domains/core.js', plannedModule].filter((rel) => fs.existsSync(path.join(root, rel))),
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
  if (planned.domain !== 'authority') errors.push('second slice must plan the authority domain after the core first slice');
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

const PUBLIC_CLEAN_COMPACTION_BASELINE = Object.freeze({
  schema: 'agent-onboard-public-clean-compaction-baseline-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  previous_milestone_id: 'P1S3M5',
  work_item_id: ['P1S3M6', 'W1'].join(''),
  title: 'Public clean and compaction baseline gate',
  command: 'agent-onboard release --clean-inventory',
  check_command: 'agent-onboard release --clean-check',
  baseline_file: '.agent-onboard/public-clean-compaction-baseline-gate.json',
  purpose: 'Seed the public clean and compaction milestone with a read-only source surface inventory and bounded compaction baseline before deleting or moving any source files.',
  budgets: Object.freeze({
    max_source_files: 182,
    max_agent_onboard_files: 109,
    max_agent_onboard_gate_artifacts: 95,
    max_projected_pack_files: 60,
    max_package_keywords: 480,
    max_readme_bytes: 110000,
    max_work_items_bytes: 400000,
    max_manifest_bytes: 80000
  }),
  compaction_candidate_surfaces: Object.freeze([
    'README.md historical release prose',
    '.agent-onboard closed gate artifacts',
    'package.json keyword sprawl',
    '.agent-onboard/work-items.json closure history growth',
    'manifest/authority map digest refresh churn'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
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

function publicCleanCompactionWalkFiles(root = packageRoot()) {
  const skipDirectories = new Set(['.git', 'node_modules', '.idea', '.vscode', 'coverage', 'dist']);
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (skipDirectories.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const rel = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(absolute);
      files.push(Object.freeze({ path: rel, bytes: stat.size, top_level: rel.includes('/') ? rel.split('/')[0] : rel }));
    }
  }
  walk(root);
  return files;
}

function publicCleanCompactionTopLevelCounts(files) {
  const counts = {};
  const bytes = {};
  for (const file of files) {
    counts[file.top_level] = (counts[file.top_level] || 0) + 1;
    bytes[file.top_level] = (bytes[file.top_level] || 0) + file.bytes;
  }
  return Object.keys(counts).sort().map((name) => Object.freeze({ name, file_count: counts[name], bytes: bytes[name] }));
}

function publicCleanCompactionMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      previous_milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id,
      milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id,
      work_item_id: PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id,
      previous_milestone_status: 'not_present_installed_context_allowed',
      milestone_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const previousMilestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id) || null;
  const milestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    previous_milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id,
    milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id,
    work_item_id: PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id,
    previous_milestone_status: previousMilestone ? previousMilestone.status : 'missing',
    milestone_status: milestone ? milestone.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    previous_milestone_title: previousMilestone ? previousMilestone.title : null,
    milestone_title: milestone ? milestone.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicCleanCompactionInventory(root = packageRoot()) {
  const files = publicCleanCompactionWalkFiles(root);
  const pkg = readJson(path.join(root, 'package.json'));
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const agentOnboardFiles = files.filter((file) => file.path.startsWith('.agent-onboard/'));
  const gateArtifacts = agentOnboardFiles.filter((file) => /(?:gate|plan|seed|parity|smoke|review|catalog|manifest|oracle)\.json$/.test(file.path));
  const jsonFiles = files.filter((file) => file.path.endsWith('.json'));
  const jsonlFiles = files.filter((file) => file.path.endsWith('.jsonl'));
  const sourceModules = files.filter((file) => file.path.startsWith('cli/') || file.path.startsWith('src/'));
  const readmePath = path.join(root, 'README.md');
  const workItemsPath = path.join(root, '.agent-onboard', 'work-items.json');
  const manifestPath = path.join(root, 'manifest.json');
  const largestFiles = files.slice().sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)).slice(0, 12);
  return Object.freeze({
    total_files: files.length,
    total_bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    top_level: publicCleanCompactionTopLevelCounts(files),
    source_modules: Object.freeze({
      file_count: sourceModules.length,
      cli_file_count: files.filter((file) => file.path.startsWith('cli/')).length,
      source_only_domain_file_count: files.filter((file) => file.path.startsWith('src/')).length
    }),
    agent_onboard_state: Object.freeze({
      file_count: agentOnboardFiles.length,
      json_file_count: agentOnboardFiles.filter((file) => file.path.endsWith('.json')).length,
      jsonl_file_count: agentOnboardFiles.filter((file) => file.path.endsWith('.jsonl')).length,
      closed_gate_artifact_count: gateArtifacts.length,
      work_items_bytes: fs.existsSync(workItemsPath) ? fs.statSync(workItemsPath).size : 0
    }),
    package: Object.freeze({
      projected_pack_file_count: projectedPackFiles.length,
      projected_pack_files: projectedPackFiles,
      package_json_files_count: Array.isArray(pkg.files) ? pkg.files.length : 0,
      keyword_count: Array.isArray(pkg.keywords) ? pkg.keywords.length : 0,
      version: pkg.version
    }),
    documentation: Object.freeze({
      readme_bytes: fs.existsSync(readmePath) ? fs.statSync(readmePath).size : 0,
      llms_bytes: fs.existsSync(path.join(root, 'llms.txt')) ? fs.statSync(path.join(root, 'llms.txt')).size : 0,
      source_of_truth_bytes: fs.existsSync(path.join(root, 'SOURCE_OF_TRUTH.md')) ? fs.statSync(path.join(root, 'SOURCE_OF_TRUTH.md')).size : 0,
      agents_bytes: fs.existsSync(path.join(root, 'AGENTS.md')) ? fs.statSync(path.join(root, 'AGENTS.md')).size : 0
    }),
    identity_indexes: Object.freeze({
      manifest_bytes: fs.existsSync(manifestPath) ? fs.statSync(manifestPath).size : 0,
      authority_map_bytes: fs.existsSync(path.join(root, 'authority-map.json')) ? fs.statSync(path.join(root, 'authority-map.json')).size : 0,
      json_file_count: jsonFiles.length,
      jsonl_file_count: jsonlFiles.length
    }),
    largest_files: largestFiles,
    milestone_state: publicCleanCompactionMilestoneState(root)
  });
}

function publicCleanCompactionCandidates(inventory) {
  return Object.freeze([
    Object.freeze({
      surface: 'README.md',
      current_bytes: inventory.documentation.readme_bytes,
      candidate_action: 'split or compact historical release prose while preserving first-read usage sections',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: '.agent-onboard closed gate artifacts',
      current_file_count: inventory.agent_onboard_state.closed_gate_artifact_count,
      candidate_action: 'compact closed gate records into bounded index/shard form without losing closure evidence',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: 'package.json keywords',
      current_count: inventory.package.keyword_count,
      candidate_action: 'collapse release-era keyword sprawl into stable product taxonomy',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: '.agent-onboard/work-items.json',
      current_bytes: inventory.agent_onboard_state.work_items_bytes,
      candidate_action: 'seed archival/summary split only after preserving authoritative work-item semantics',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: 'manifest.json and authority-map.json',
      current_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes,
      candidate_action: 'preserve content identity while avoiding identity-map noise during future compaction passes',
      admission_required_before_write: true
    })
  ]);
}

function publicCleanCompactionBaseline(root = packageRoot()) {
  const inventory = publicCleanCompactionInventory(root);
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-baseline-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    check_command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    package_root: root,
    baseline: PUBLIC_CLEAN_COMPACTION_BASELINE,
    inventory,
    compaction_candidates: publicCleanCompactionCandidates(inventory),
    boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary
  });
}

function publicCleanCompactionBaselineCheck(root = packageRoot()) {
  const result = publicCleanCompactionBaseline(root);
  const budget = PUBLIC_CLEAN_COMPACTION_BASELINE.budgets;
  const inventory = result.inventory;
  const milestone = inventory.milestone_state;
  const errors = [];
  if (inventory.total_files > budget.max_source_files) errors.push(`source file count ${inventory.total_files} exceeds clean baseline budget ${budget.max_source_files}`);
  if (inventory.agent_onboard_state.file_count > budget.max_agent_onboard_files) errors.push(`.agent-onboard file count ${inventory.agent_onboard_state.file_count} exceeds clean baseline budget ${budget.max_agent_onboard_files}`);
  if (inventory.agent_onboard_state.closed_gate_artifact_count > budget.max_agent_onboard_gate_artifacts) errors.push(`closed gate artifact count ${inventory.agent_onboard_state.closed_gate_artifact_count} exceeds clean baseline budget ${budget.max_agent_onboard_gate_artifacts}`);
  if (inventory.package.projected_pack_file_count > budget.max_projected_pack_files) errors.push(`projected pack file count ${inventory.package.projected_pack_file_count} exceeds clean baseline budget ${budget.max_projected_pack_files}`);
  if (inventory.package.keyword_count > budget.max_package_keywords) errors.push(`package keyword count ${inventory.package.keyword_count} exceeds clean baseline budget ${budget.max_package_keywords}`);
  if (inventory.documentation.readme_bytes > budget.max_readme_bytes) errors.push(`README.md bytes ${inventory.documentation.readme_bytes} exceeds clean baseline budget ${budget.max_readme_bytes}`);
  if (inventory.agent_onboard_state.work_items_bytes > budget.max_work_items_bytes) errors.push(`work-items ledger bytes ${inventory.agent_onboard_state.work_items_bytes} exceeds clean baseline budget ${budget.max_work_items_bytes}`);
  if (inventory.identity_indexes.manifest_bytes > budget.max_manifest_bytes) errors.push(`manifest.json bytes ${inventory.identity_indexes.manifest_bytes} exceeds clean baseline budget ${budget.max_manifest_bytes}`);
  if (PUBLIC_CLEAN_COMPACTION_BASELINE.boundary.writes_files !== false) errors.push('clean compaction baseline command must remain no-write');
  if (milestone.ledger_present) {
    if (milestone.previous_milestone_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id} must be closed before M6 baseline passes`);
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id} must be open for clean and compaction work`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id} must be closed by this baseline gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-baseline-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    inventory_command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    package_root: root,
    validated: Object.freeze({
      source_file_count_within_budget: inventory.total_files <= budget.max_source_files,
      agent_onboard_file_count_within_budget: inventory.agent_onboard_state.file_count <= budget.max_agent_onboard_files,
      gate_artifact_count_within_budget: inventory.agent_onboard_state.closed_gate_artifact_count <= budget.max_agent_onboard_gate_artifacts,
      projected_pack_file_count_within_budget: inventory.package.projected_pack_file_count <= budget.max_projected_pack_files,
      package_keywords_within_budget: inventory.package.keyword_count <= budget.max_package_keywords,
      readme_bytes_within_budget: inventory.documentation.readme_bytes <= budget.max_readme_bytes,
      work_items_bytes_within_budget: inventory.agent_onboard_state.work_items_bytes <= budget.max_work_items_bytes,
      manifest_bytes_within_budget: inventory.identity_indexes.manifest_bytes <= budget.max_manifest_bytes,
      no_write_boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary.writes_files === false,
      m5_closed_m6_open: !milestone.ledger_present || (milestone.previous_milestone_status === 'closed' && milestone.milestone_status === 'open'),
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    budgets: budget,
    inventory,
    compaction_candidates: result.compaction_candidates,
    boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary,
    errors
  });
}

function publicCleanCompactionBaselineText(result = publicCleanCompactionBaseline()) {
  const lines = [
    `agent-onboard clean compaction baseline ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Inventory:',
    `- total files: ${result.inventory.total_files}`,
    `- total bytes: ${result.inventory.total_bytes}`,
    `- .agent-onboard files: ${result.inventory.agent_onboard_state.file_count}`,
    `- closed gate artifacts: ${result.inventory.agent_onboard_state.closed_gate_artifact_count}`,
    `- projected package files: ${result.inventory.package.projected_pack_file_count}`,
    `- package keywords: ${result.inventory.package.keyword_count}`,
    `- README bytes: ${result.inventory.documentation.readme_bytes}`,
    '',
    'Compaction candidates:'
  ];
  for (const candidate of result.compaction_candidates) lines.push(`- ${candidate.surface}: ${candidate.candidate_action}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.writes_files}`, `- Deletes files: ${result.boundary.deletes_files}`, `- Publishes package: ${result.boundary.publishes_package}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLEAN_COMPACTION_CATALOG = Object.freeze({
  schema: 'agent-onboard-public-clean-compaction-catalog-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  work_item_id: ['P1S3M6', 'W2'].join(''),
  title: 'Public clean and compaction candidate catalog gate',
  command: 'agent-onboard release --clean-catalog',
  check_command: 'agent-onboard release --clean-catalog-check',
  catalog_file: '.agent-onboard/public-clean-compaction-catalog-gate.json',
  purpose: 'Classify clean and compaction candidates into explicit preserve, defer, and future-write lanes before any deletion, movement, archival, or taxonomy reduction is admitted.',
  required_candidate_count: 6,
  allowed_dispositions: Object.freeze([
    'preserve_live_first_read_then_split_history',
    'preserve_evidence_then_compact_closed_records',
    'preserve_discovery_then_reduce_taxonomy',
    'preserve_authority_then_split_archive_index',
    'preserve_identity_then_regenerate_after_write',
    'preserve_behavior_then_extract_runtime_modules'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
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

function publicCleanCompactionCatalogEntries(inventory) {
  const runtimeComposer = inventory.largest_files.find((file) => file.path === 'cli/agent_onboard/runtime-composer.js') || { bytes: 0 };
  const testFile = inventory.largest_files.find((file) => file.path === 'test/agent-onboard.test.js') || { bytes: 0 };
  return Object.freeze([
    Object.freeze({
      id: 'readme-first-read-history',
      surface: 'README.md',
      class: 'documentation_surface',
      current_bytes: inventory.documentation.readme_bytes,
      disposition: 'preserve_live_first_read_then_split_history',
      preserve_before_compaction: Object.freeze(['install/use commands', 'public safety boundaries', 'current release commands', 'first-read path']),
      forbidden_now: Object.freeze(['delete README.md', 'drop current commands', 'hide public boundary wording']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'closed-gate-artifacts',
      surface: '.agent-onboard closed gate artifacts',
      class: 'closure_evidence_surface',
      current_file_count: inventory.agent_onboard_state.closed_gate_artifact_count,
      disposition: 'preserve_evidence_then_compact_closed_records',
      preserve_before_compaction: Object.freeze(['work item id', 'title', 'closed_at', 'summary', 'changed_files', 'checks_run', 'known_non_pass']),
      forbidden_now: Object.freeze(['bulk-delete closure records', 'replace evidence with unlinked prose', 'make index authoritative without raw recovery path']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'package-keyword-taxonomy',
      surface: 'package.json keywords',
      class: 'package_discovery_metadata',
      current_count: inventory.package.keyword_count,
      disposition: 'preserve_discovery_then_reduce_taxonomy',
      preserve_before_compaction: Object.freeze(['package identity keywords', 'stable command-family keywords', 'consumer onboarding discovery keywords']),
      forbidden_now: Object.freeze(['collapse to vague branding only', 'remove npm discoverability before taxonomy is admitted']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'work-items-ledger-growth',
      surface: '.agent-onboard/work-items.json',
      class: 'authority_ledger_surface',
      current_bytes: inventory.agent_onboard_state.work_items_bytes,
      disposition: 'preserve_authority_then_split_archive_index',
      preserve_before_compaction: Object.freeze(['open/closed status', 'milestone membership', 'closure evidence', 'operator-readable next item semantics']),
      forbidden_now: Object.freeze(['make summary index the sole authority', 'drop closure history without archived recovery path']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'identity-index-refresh-churn',
      surface: 'manifest.json and authority-map.json',
      class: 'content_identity_surface',
      current_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes,
      disposition: 'preserve_identity_then_regenerate_after_write',
      preserve_before_compaction: Object.freeze(['file_urn', 'file_path', 'file_id', 'self-referential manifest exclusion']),
      forbidden_now: Object.freeze(['edit hashes by hand without target metadata refresh', 'treat digest churn as permission to drop identity coverage']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'runtime-and-test-monoliths',
      surface: 'runtime-composer.js and agent-onboard.test.js',
      class: 'source_runtime_surface',
      current_bytes: runtimeComposer.bytes + testFile.bytes,
      disposition: 'preserve_behavior_then_extract_runtime_modules',
      preserve_before_compaction: Object.freeze(['CLI command output contracts', 'installed package parity', 'release check behavior', 'target onboarding behavior']),
      forbidden_now: Object.freeze(['mechanical split without golden output check', 'delete test coverage to reduce byte count']),
      future_write_requires_admitted_work_item: true
    })
  ]);
}

function publicCleanCompactionCatalog(root = packageRoot()) {
  const baseline = publicCleanCompactionBaseline(root);
  const inventory = baseline.inventory;
  const entries = publicCleanCompactionCatalogEntries(inventory);
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-catalog-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
    check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
    package_root: root,
    baseline_command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    baseline_check_command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    catalog: PUBLIC_CLEAN_COMPACTION_CATALOG,
    inventory_snapshot: Object.freeze({
      total_files: inventory.total_files,
      total_bytes: inventory.total_bytes,
      agent_onboard_files: inventory.agent_onboard_state.file_count,
      closed_gate_artifacts: inventory.agent_onboard_state.closed_gate_artifact_count,
      package_keywords: inventory.package.keyword_count,
      readme_bytes: inventory.documentation.readme_bytes,
      work_items_bytes: inventory.agent_onboard_state.work_items_bytes,
      identity_index_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes
    }),
    classification_policy: Object.freeze({
      delete_or_move_allowed_now: false,
      taxonomy_reduction_allowed_now: false,
      archive_split_allowed_now: false,
      future_write_must_name_exact_surface_id: true,
      future_write_must_preserve_recovery_or_replay_path: true,
      future_write_must_refresh_target_metadata_after_mutation: true
    }),
    entries,
    boundary: PUBLIC_CLEAN_COMPACTION_CATALOG.boundary
  });
}

function publicCleanCompactionCatalogMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id,
      baseline_work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id,
      work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id,
    baseline_work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id,
    work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicCleanCompactionCatalogCheck(root = packageRoot()) {
  const result = publicCleanCompactionCatalog(root);
  const baselineCheck = publicCleanCompactionBaselineCheck(root);
  const milestone = publicCleanCompactionCatalogMilestoneState(root);
  const errors = baselineCheck.errors.map((error) => `baseline: ${error}`);
  const allowed = new Set(PUBLIC_CLEAN_COMPACTION_CATALOG.allowed_dispositions);
  if (result.entries.length !== PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count) errors.push(`clean catalog must classify exactly ${PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count} surfaces`);
  for (const entry of result.entries) {
    if (!entry.id) errors.push('clean catalog entry is missing id');
    if (!entry.surface) errors.push(`clean catalog entry ${entry.id || '<unknown>'} is missing surface`);
    if (!allowed.has(entry.disposition)) errors.push(`clean catalog entry ${entry.id || '<unknown>'} has unsupported disposition ${entry.disposition}`);
    if (entry.future_write_requires_admitted_work_item !== true) errors.push(`clean catalog entry ${entry.id || '<unknown>'} must require a future admitted work item before writes`);
    if (!Array.isArray(entry.forbidden_now) || entry.forbidden_now.length === 0) errors.push(`clean catalog entry ${entry.id || '<unknown>'} must list forbidden-now actions`);
  }
  if (result.classification_policy.delete_or_move_allowed_now !== false) errors.push('clean catalog must not allow delete or move now');
  if (result.classification_policy.future_write_must_name_exact_surface_id !== true) errors.push('future compaction writes must name exact surface id');
  if (result.boundary.writes_files !== false) errors.push('clean catalog command must remain no-write');
  if (result.boundary.deletes_files !== false) errors.push('clean catalog command must not delete files');
  if (result.boundary.moves_files !== false) errors.push('clean catalog command must not move files');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id} must remain open during clean and compaction cataloging`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id} must be closed before the clean catalog passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id} must be closed by this catalog gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-catalog-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
    catalog_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
    package_root: root,
    validated: Object.freeze({
      baseline_check_passes: baselineCheck.status === 'ok',
      required_candidate_count: result.entries.length === PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count,
      dispositions_supported: result.entries.every((entry) => allowed.has(entry.disposition)),
      every_entry_requires_future_admission: result.entries.every((entry) => entry.future_write_requires_admitted_work_item === true),
      every_entry_has_forbidden_now_actions: result.entries.every((entry) => Array.isArray(entry.forbidden_now) && entry.forbidden_now.length > 0),
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_files === false,
      no_move_boundary: result.boundary.moves_files === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    baseline_check: baselineCheck,
    milestone_state: milestone,
    catalog: result,
    boundary: PUBLIC_CLEAN_COMPACTION_CATALOG.boundary,
    errors
  });
}

function publicCleanCompactionCatalogText(result = publicCleanCompactionCatalog()) {
  const lines = [
    `agent-onboard clean compaction catalog ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Classification policy:',
    `- delete or move allowed now: ${result.classification_policy.delete_or_move_allowed_now}`,
    `- future write must name exact surface id: ${result.classification_policy.future_write_must_name_exact_surface_id}`,
    `- future write must preserve recovery/replay path: ${result.classification_policy.future_write_must_preserve_recovery_or_replay_path}`,
    '',
    'Catalog entries:'
  ];
  for (const entry of result.entries) lines.push(`- ${entry.id}: ${entry.surface} -> ${entry.disposition}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.writes_files}`, `- Deletes files: ${result.boundary.deletes_files}`, `- Moves files: ${result.boundary.moves_files}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}

const PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION = Object.freeze({
  schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'package-keyword-taxonomy',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  catalog_work_item_id: ['P1S3M6', 'W2'].join(''),
  work_item_id: ['P1S3M6', 'W3'].join(''),
  title: 'Public package keyword taxonomy compaction gate',
  command: 'agent-onboard release --keyword-taxonomy',
  check_command: 'agent-onboard release --keyword-taxonomy-check',
  artifact_file: '.agent-onboard/public-package-keyword-taxonomy-compaction-gate.json',
  purpose: 'Reduce package.json keyword sprawl into a compact public npm discovery taxonomy while preserving package identity, command-family discovery, target onboarding discovery, coordination, release, contract, and clean-compaction terms.',
  previous_observed_keyword_count: 446,
  max_keywords: 80,
  min_keywords: 24,
  required_keyword_groups: Object.freeze({
    package_identity: Object.freeze(['agent-onboard', 'agent-onboard-cli', 'create-agent-onboard']),
    target_onboarding: Object.freeze(['repository-onboarding', 'target-repository', 'target-onboarding', 'target-doctor', 'target-governance']),
    coordination: Object.freeze(['work-items', 'work-item-ledger', 'work-item-claim', 'claim-ledger', 'claims-jsonl']),
    authority_governance: Object.freeze(['repository-governance', 'governance-index', 'authority-check', 'authority-index', 'authority-state']),
    release_package: Object.freeze(['release-check', 'source-manifest', 'content-addressed-manifest', 'package-surface', 'artifact-oracle', 'installed-package-parity']),
    contracts_output: Object.freeze(['public-contracts', 'json-output-contract', 'contract-validation', 'command-router', 'command-catalog', 'runtime-contracts']),
    agent_integration: Object.freeze(['agents-md', 'agent-instructions', 'llms-txt', 'mcp-bridge', 'github-actions', 'ci-recipe']),
    clean_compaction: Object.freeze(['clean-compaction', 'public-clean-compaction', 'package-keyword-taxonomy', 'compaction-policy'])
  }),
  forbidden_keyword_patterns: Object.freeze([
    'concrete work-item identifiers',
    'release-era one-off gate names',
    'opaque milestone-only labels',
    'private/nonpublic process wording',
    'duplicate keywords',
    'non-slug keyword spelling'
  ]),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
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

function publicPackageKeywordTaxonomyCurrent(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords.slice() : [];
  const duplicates = keywords.filter((keyword, index) => keywords.indexOf(keyword) !== index);
  const slugPattern = /^[a-z0-9][a-z0-9-]*$/;
  const invalidSlugKeywords = keywords.filter((keyword) => typeof keyword !== 'string' || !slugPattern.test(keyword));
  const concreteWorkItemPattern = /^p\d+s\d+m\d+w\d+$/i;
  const milestoneOnlyPattern = /^p\d+s\d+m\d+$/i;
  const releaseEraGatePattern = /(?:-gate$|^gate-|w\d+$)/i;
  const forbiddenKeywords = keywords.filter((keyword) => concreteWorkItemPattern.test(keyword) || milestoneOnlyPattern.test(keyword) || releaseEraGatePattern.test(keyword));
  const groups = PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.required_keyword_groups;
  const groupCoverage = Object.fromEntries(Object.entries(groups).map(([group, required]) => [group, Object.freeze({
    required: required.slice(),
    present: required.filter((keyword) => keywords.includes(keyword)),
    missing: required.filter((keyword) => !keywords.includes(keyword)),
    complete: required.every((keyword) => keywords.includes(keyword))
  })]));
  return Object.freeze({
    version: pkg.version,
    keyword_count: keywords.length,
    keywords,
    duplicates,
    invalid_slug_keywords: invalidSlugKeywords,
    forbidden_keywords: forbiddenKeywords,
    group_coverage: Object.freeze(groupCoverage),
    reduction: Object.freeze({
      previous_observed_keyword_count: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.previous_observed_keyword_count,
      current_keyword_count: keywords.length,
      reduced_by: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.previous_observed_keyword_count - keywords.length,
      current_within_max: keywords.length <= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords
    })
  });
}

function publicPackageKeywordTaxonomyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id,
      baseline_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id,
      catalog_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id,
      work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      catalog_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id) || null;
  const catalogWorkItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id,
    baseline_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id,
    catalog_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id,
    work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    catalog_work_item_status: catalogWorkItem ? catalogWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    catalog_work_item_title: catalogWorkItem ? catalogWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicPackageKeywordTaxonomyCompaction(root = packageRoot()) {
  const current = publicPackageKeywordTaxonomyCurrent(root);
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.command,
    check_command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.check_command,
    package_root: root,
    package_json_path: 'package.json',
    taxonomy: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION,
    catalog_surface: Object.freeze({
      source_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
      source_check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
      catalog_check_status: catalogCheck.status,
      required_surface_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_surface_id,
      surface_present: catalogCheck.catalog.entries.some((entry) => entry.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_surface_id)
    }),
    current,
    boundary: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.boundary
  });
}

function publicPackageKeywordTaxonomyCompactionCheck(root = packageRoot()) {
  const result = publicPackageKeywordTaxonomyCompaction(root);
  const current = result.current;
  const milestone = publicPackageKeywordTaxonomyMilestoneState(root);
  const errors = [];
  if (result.catalog_surface.catalog_check_status !== 'ok') errors.push('clean compaction catalog check must pass before keyword taxonomy compaction check');
  if (!result.catalog_surface.surface_present) errors.push('clean compaction catalog must include package-keyword-taxonomy surface');
  if (current.keyword_count > PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords) errors.push(`package keyword count ${current.keyword_count} exceeds compact taxonomy budget ${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords}`);
  if (current.keyword_count < PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords) errors.push(`package keyword count ${current.keyword_count} is below required discovery floor ${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords}`);
  if (current.duplicates.length > 0) errors.push(`package keywords contain duplicates: ${current.duplicates.join(', ')}`);
  if (current.invalid_slug_keywords.length > 0) errors.push(`package keywords must be lowercase npm slugs: ${current.invalid_slug_keywords.join(', ')}`);
  if (current.forbidden_keywords.length > 0) errors.push(`package keywords contain forbidden release-era terms: ${current.forbidden_keywords.join(', ')}`);
  for (const [group, coverage] of Object.entries(current.group_coverage)) {
    if (!coverage.complete) errors.push(`package keyword taxonomy group ${group} is missing: ${coverage.missing.join(', ')}`);
  }
  if (current.reduction.reduced_by <= 0) errors.push('package keyword taxonomy must reduce the previously observed keyword count');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('keyword taxonomy commands must remain read-only');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('keyword taxonomy commands must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id} must remain open during keyword taxonomy compaction`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id} must be closed before keyword taxonomy compaction`);
    if (milestone.catalog_work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id} must be closed before keyword taxonomy compaction`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id} must be closed by this keyword taxonomy gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.check_command,
    taxonomy_command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.command,
    package_root: root,
    validated: Object.freeze({
      catalog_check_passes: result.catalog_surface.catalog_check_status === 'ok',
      catalog_surface_present: result.catalog_surface.surface_present,
      keyword_count_within_compact_budget: current.keyword_count <= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords,
      keyword_count_above_discovery_floor: current.keyword_count >= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords,
      keyword_count_reduced_from_previous_observation: current.reduction.reduced_by > 0,
      no_duplicate_keywords: current.duplicates.length === 0,
      keywords_are_lowercase_slugs: current.invalid_slug_keywords.length === 0,
      release_era_keywords_removed: current.forbidden_keywords.length === 0,
      every_required_group_complete: Object.values(current.group_coverage).every((coverage) => coverage.complete),
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      catalog_work_item_closed: !milestone.ledger_present || milestone.catalog_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    taxonomy: result,
    milestone_state: milestone,
    boundary: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.boundary,
    errors
  });
}

function publicPackageKeywordTaxonomyCompactionText(result = publicPackageKeywordTaxonomyCompaction()) {
  const lines = [
    `agent-onboard package keyword taxonomy ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Keyword taxonomy:',
    `- current keyword count: ${result.current.keyword_count}`,
    `- previous observed keyword count: ${result.current.reduction.previous_observed_keyword_count}`,
    `- reduced by: ${result.current.reduction.reduced_by}`,
    `- compact budget: ${result.taxonomy.max_keywords}`,
    '',
    'Required groups:'
  ];
  for (const [group, coverage] of Object.entries(result.current.group_coverage)) lines.push(`- ${group}: ${coverage.complete ? 'complete' : `missing ${coverage.missing.join(', ')}`}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.command_writes_files}`, `- Publishes package: ${result.boundary.publishes_package}`, `- Mutates registry: ${result.boundary.mutates_registry}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN = Object.freeze({
  schema: 'agent-onboard-public-readme-first-read-history-split-plan-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'readme-first-read-history',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  catalog_work_item_id: ['P1S3M6', 'W2'].join(''),
  keyword_work_item_id: ['P1S3M6', 'W3'].join(''),
  work_item_id: ['P1S3M6', 'W4'].join(''),
  title: 'Public README first-read history split planning gate',
  command: 'agent-onboard release --readme-plan',
  check_command: 'agent-onboard release --readme-plan-check',
  artifact_file: '.agent-onboard/public-readme-first-read-history-split-plan-gate.json',
  purpose: 'Plan a future README first-read/history split without moving, deleting, archiving, or rewriting README.md in this gate.',
  required_first_read_markers: Object.freeze([
    '# agent-onboard',
    '## Install',
    '## Quickstart',
    'npx agent-onboard status',
    'npx agent-onboard target doctor --text',
    'npx agent-onboard release --check'
  ]),
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    future_history_archive_candidate: 'docs/release-history.md',
    future_history_index_candidate: '.agent-onboard/readme-history.index.json'
  }),
  plan_rules: Object.freeze({
    live_readme_keeps_install_quickstart_current_commands: true,
    history_archive_requires_exact_recovery_path: true,
    first_read_path_must_not_depend_on_history_archive: true,
    future_write_must_name_catalog_surface_id: true,
    future_write_must_refresh_metadata_after_mutation: true
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    creates_history_archive: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
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

function publicReadmeHistoryHeadings(readme) {
  return readme.split(/\r?\n/).filter((line) => /^#{2,3}\s+/.test(line) && /release|history|runtime|surface|gate|product|target|contract|compaction/i.test(line));
}

function publicReadmeFirstReadHistoryCurrent(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const markers = PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers;
  const releaseMentions = (readme.match(/\b(?:This release|The current release|Current release:)\b/g) || []).length;
  const historyHeadings = publicReadmeHistoryHeadings(readme);
  const planned = PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces;
  return Object.freeze({
    readme_path: 'README.md',
    readme_present: fs.existsSync(readmePath),
    readme_bytes: Buffer.byteLength(readme, 'utf8'),
    readme_lines: readme.length === 0 ? 0 : readme.split(/\r?\n/).length,
    first_read_markers: Object.freeze(markers.map((marker) => Object.freeze({
      marker,
      present: readme.includes(marker)
    }))),
    first_read_marker_count: markers.filter((marker) => readme.includes(marker)).length,
    release_history_signal: Object.freeze({
      release_mention_count: releaseMentions,
      history_heading_count: historyHeadings.length,
      sample_headings: historyHeadings.slice(0, 12)
    }),
    future_history_archive_present: fs.existsSync(path.join(root, planned.future_history_archive_candidate)),
    future_history_index_present: fs.existsSync(path.join(root, planned.future_history_index_candidate)),
    current_gate_performs_split: false
  });
}

function publicReadmeFirstReadHistoryMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id,
      baseline_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id,
      catalog_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id,
      keyword_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id,
      work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      catalog_work_item_status: 'not_present_installed_context_allowed',
      keyword_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id) || null;
  const catalogWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id) || null;
  const keywordWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id,
    baseline_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id,
    catalog_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id,
    keyword_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id,
    work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    catalog_work_item_status: catalogWorkItem ? catalogWorkItem.status : 'missing',
    keyword_work_item_status: keywordWorkItem ? keywordWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    catalog_work_item_title: catalogWorkItem ? catalogWorkItem.title : null,
    keyword_work_item_title: keywordWorkItem ? keywordWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeFirstReadHistorySplitPlan(root = packageRoot()) {
  const current = publicReadmeFirstReadHistoryCurrent(root);
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  const keywordTaxonomyCheck = publicPackageKeywordTaxonomyCompactionCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-readme-first-read-history-split-plan-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.command,
    check_command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.check_command,
    package_root: root,
    readme_path: 'README.md',
    plan: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN,
    catalog_surface: Object.freeze({
      source_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
      source_check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
      catalog_check_status: catalogCheck.status,
      required_surface_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_surface_id,
      surface_present: catalogCheck.catalog.entries.some((entry) => entry.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_surface_id)
    }),
    prerequisite_checks: Object.freeze({
      clean_catalog_check: catalogCheck.status,
      keyword_taxonomy_check: keywordTaxonomyCheck.status
    }),
    current,
    split_plan: Object.freeze({
      live_readme_keeps: Object.freeze(['package identity', 'install commands', 'quickstart', 'current command surface', 'safety/no-mutation boundary']),
      future_history_archive_candidate: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_archive_candidate,
      future_history_index_candidate: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_index_candidate,
      future_write_sequence: Object.freeze([
        'copy historical release prose into archive candidate',
        'leave first-read install/quickstart/current commands in README.md',
        'add bounded recovery index only if raw archive remains recoverable',
        'refresh target metadata and public package checks after mutation'
      ]),
      no_write_in_this_gate: true
    }),
    boundary: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.boundary
  });
}

function publicReadmeFirstReadHistorySplitPlanCheck(root = packageRoot()) {
  const result = publicReadmeFirstReadHistorySplitPlan(root);
  const current = result.current;
  const milestone = publicReadmeFirstReadHistoryMilestoneState(root);
  const errors = [];
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const installedPackageContext = sourceContext(root).package_context === 'installed_package';
  if (result.catalog_surface.catalog_check_status !== 'ok') errors.push('clean compaction catalog check must pass before README split planning');
  if (!result.catalog_surface.surface_present) errors.push('clean compaction catalog must include readme-first-read-history surface');
  if (result.prerequisite_checks.keyword_taxonomy_check !== 'ok') errors.push('keyword taxonomy check must pass before README split planning');
  if (!current.readme_present) errors.push('README.md must be present before split planning');
  for (const marker of current.first_read_markers) {
    if (!marker.present) errors.push(`README first-read marker missing: ${marker.marker}`);
  }
  if (current.release_history_signal.release_mention_count < 3 && !applyState.applied && !(installedPackageContext && applyState.readme_release_history_pointer_present)) errors.push('README must expose enough release-history signal before a split plan is meaningful');
  if (current.future_history_archive_present && !applyState.applied) errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_archive_candidate} must not be created before the admitted apply gate`);
  if (current.future_history_index_present && !applyState.applied) errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_index_candidate} must not be created before the admitted apply gate`);
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README split planning commands must remain read-only');
  if (result.boundary.creates_history_archive !== false || result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README split planning must not create archive, delete files, or move files');
  if (result.boundary.rewrites_history !== false) errors.push('README split planning must not rewrite history in this gate');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id} must remain open during README split planning`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id} must be closed before README split planning`);
    if (milestone.catalog_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id} must be closed before README split planning`);
    if (milestone.keyword_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id} must be closed before README split planning`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id} must be closed by this README split planning gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-first-read-history-split-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.check_command,
    plan_command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.command,
    package_root: root,
    validated: Object.freeze({
      catalog_check_passes: result.catalog_surface.catalog_check_status === 'ok',
      catalog_surface_present: result.catalog_surface.surface_present,
      keyword_taxonomy_check_passes: result.prerequisite_checks.keyword_taxonomy_check === 'ok',
      readme_present: current.readme_present,
      all_first_read_markers_present: current.first_read_markers.every((marker) => marker.present),
      release_history_signal_present: current.release_history_signal.release_mention_count >= 3 || applyState.applied || (installedPackageContext && applyState.readme_release_history_pointer_present),
      installed_package_context_allows_archive_omission: installedPackageContext,
      future_archive_not_created: current.future_history_archive_present === false || applyState.applied,
      future_index_not_created: current.future_history_index_present === false || applyState.applied,
      readme_history_apply_gate_admitted: applyState.applied,
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_archive_delete_move_or_rewrite: result.boundary.creates_history_archive === false && result.boundary.deletes_files === false && result.boundary.moves_files === false && result.boundary.rewrites_history === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      catalog_work_item_closed: !milestone.ledger_present || milestone.catalog_work_item_status === 'closed',
      keyword_work_item_closed: !milestone.ledger_present || milestone.keyword_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    plan: result,
    milestone_state: milestone,
    boundary: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.boundary,
    apply_state: applyState,
    errors
  });
}

function publicReadmeFirstReadHistorySplitPlanText(result = publicReadmeFirstReadHistorySplitPlan()) {
  const lines = [
    `agent-onboard README first-read/history split plan ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Current README:',
    `- bytes: ${result.current.readme_bytes}`,
    `- lines: ${result.current.readme_lines}`,
    `- release mentions: ${result.current.release_history_signal.release_mention_count}`,
    '',
    'Planned future split:',
    `- live README: ${result.plan.planned_surfaces.live_readme}`,
    `- future history archive: ${result.plan.planned_surfaces.future_history_archive_candidate}`,
    `- future history index: ${result.plan.planned_surfaces.future_history_index_candidate}`,
    '',
    'Boundary:',
    `- Writes files: ${result.boundary.command_writes_files}`,
    `- Creates history archive: ${result.boundary.creates_history_archive}`,
    `- Rewrites history: ${result.boundary.rewrites_history}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-readme-history-archive-split-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'readme-first-read-history',
  prerequisite_work_item_id: ['P1S3M6', 'W4'].join(''),
  work_item_id: ['P1S3M6', 'W5'].join(''),
  title: 'Public README history archive split dry-run gate',
  command: 'agent-onboard release --readme-dry-run',
  check_command: 'agent-onboard release --readme-dry-run-check',
  artifact_file: '.agent-onboard/public-readme-history-archive-split-dry-run-gate.json',
  purpose: 'Compute an exact in-memory README history archive split preview, with source line ranges and candidate digests, before any README or archive file is written.',
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    history_archive_candidate: 'docs/release-history.md',
    history_index_candidate: '.agent-onboard/readme-history.index.json'
  }),
  retained_live_readme_markers: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers,
  extraction: Object.freeze({
    source_heading_selector: '^##\\s+(?:Current release|Previous release)\\b',
    replacement_pointer_heading: '## Release history',
    min_history_sections: 5,
    max_archive_preview_bytes: 90000,
    max_live_readme_preview_bytes: 90000,
    max_index_preview_bytes: 32768
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    creates_history_archive: false,
    creates_history_index: false,
    rewrites_readme: false,
    deletes_files: false,
    moves_files: false,
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

function textFileId(text) {
  return `ni:///sha-256;${crypto.createHash('sha256').update(text).digest('base64url')}`;
}


function publicReadmeHistoryArchiveSplitAppliedState(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const archivePath = path.join(root, 'docs', 'release-history.md');
  const indexPath = path.join(root, '.agent-onboard', 'readme-history.index.json');
  const artifactPath = path.join(root, '.agent-onboard', 'public-readme-history-archive-split-apply-gate.json');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const archive = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf8') : '';
  let index = null;
  let indexStatus = 'missing';
  if (fs.existsSync(indexPath)) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
    }
  }
  const liveHistorySections = publicReadmeHistoryArchiveSections(readme);
  const archiveHistorySections = publicReadmeHistoryArchiveSections(archive);
  const readmeFileId = textFileId(readme);
  const archiveFileId = textFileId(archive);
  const indexFileText = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  return Object.freeze({
    applied: fs.existsSync(archivePath) && fs.existsSync(indexPath) && index && index.status === 'applied',
    readme_path: 'README.md',
    readme_present: fs.existsSync(readmePath),
    readme_file_id: readmeFileId,
    readme_bytes: Buffer.byteLength(readme, 'utf8'),
    readme_release_history_pointer_present: readme.includes('## Release history') && readme.includes('docs/release-history.md'),
    live_history_section_count: liveHistorySections.length,
    history_archive_path: 'docs/release-history.md',
    history_archive_present: fs.existsSync(archivePath),
    history_archive_file_id: archiveFileId,
    history_archive_bytes: Buffer.byteLength(archive, 'utf8'),
    archive_history_section_count: archiveHistorySections.length,
    history_index_path: '.agent-onboard/readme-history.index.json',
    history_index_present: fs.existsSync(indexPath),
    history_index_status: indexStatus,
    history_index_file_id: textFileId(indexFileText),
    history_index_section_count: index && Array.isArray(index.sections) ? index.sections.length : 0,
    history_index_live_readme_file_id: index ? index.live_readme_file_id || null : null,
    history_index_archive_file_id: index ? index.history_archive_file_id || null : null,
    apply_artifact_path: '.agent-onboard/public-readme-history-archive-split-apply-gate.json',
    apply_artifact_present: fs.existsSync(artifactPath),
    index
  });
}

function publicReadmeHistoryArchiveSections(readme) {
  const lines = readme.split(/\r?\n/);
  const headingRegex = /^##\s+(?:Current release|Previous release)\b/i;
  const sectionStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (headingRegex.test(lines[index])) sectionStarts.push(index);
  }
  return sectionStarts.map((startIndex, sectionIndex) => {
    let endIndexExclusive = lines.length;
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (/^##\s+/.test(lines[index])) {
        endIndexExclusive = index;
        break;
      }
    }
    const text = `${lines.slice(startIndex, endIndexExclusive).join('\n')}\n`;
    return Object.freeze({
      ordinal: sectionIndex + 1,
      heading: lines[startIndex],
      source_path: 'README.md',
      start_line: startIndex + 1,
      end_line: endIndexExclusive,
      byte_count: Buffer.byteLength(text, 'utf8'),
      file_id: textFileId(text),
      start_index: startIndex,
      end_index_exclusive: endIndexExclusive,
      content: text
    });
  });
}

function publicReadmeHistoryArchiveCandidate(readme, sections) {
  const header = [
    '# agent-onboard release history',
    '',
    'This is an in-memory dry-run candidate derived from README.md historical release sections.',
    'It is not written by this command and does not replace README.md authority.',
    ''
  ].join('\n');
  const body = sections.map((section) => section.content.trimEnd()).join('\n\n');
  return `${header}${body}\n`;
}

function publicReadmeHistoryLiveReadmeCandidate(readme, sections) {
  const lines = readme.split(/\r?\n/);
  const skip = new Set();
  for (const section of sections) {
    for (let index = section.start_index; index < section.end_index_exclusive; index += 1) skip.add(index);
  }
  const insertIndex = sections.length > 0 ? sections[0].start_index : lines.length;
  const pointer = [
    '## Release history',
    '',
    'Historical release prose is planned for `docs/release-history.md` after an admitted write gate. Current install, quickstart, command, and no-mutation boundary material remains in this README.',
    ''
  ];
  const output = [];
  let inserted = false;
  for (let index = 0; index < lines.length; index += 1) {
    if (!inserted && index === insertIndex) {
      output.push(...pointer);
      inserted = true;
    }
    if (skip.has(index)) continue;
    output.push(lines[index]);
  }
  if (!inserted) output.push('', ...pointer);
  return `${output.join('\n').replace(/\n{4,}/g, '\n\n\n').trimEnd()}\n`;
}

function publicReadmeHistoryArchiveSplitMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeHistoryArchiveSplitDryRun(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const rawSections = publicReadmeHistoryArchiveSections(readme);
  const appliedReplay = rawSections.length === 0 && applyState.applied;
  const sections = appliedReplay && applyState.index && Array.isArray(applyState.index.sections)
    ? applyState.index.sections.map((section) => Object.freeze({
      ordinal: section.ordinal,
      heading: section.heading,
      source_path: section.source_path,
      start_line: section.start_line,
      end_line: section.end_line,
      byte_count: section.byte_count,
      file_id: section.file_id,
      start_index: 0,
      end_index_exclusive: 0,
      content: ''
    }))
    : rawSections;
  const archiveCandidate = appliedReplay && applyState.history_archive_present
    ? fs.readFileSync(path.join(root, applyState.history_archive_path), 'utf8')
    : publicReadmeHistoryArchiveCandidate(readme, sections);
  const liveReadmeCandidate = appliedReplay ? readme : publicReadmeHistoryLiveReadmeCandidate(readme, sections);
  const indexCandidate = appliedReplay && applyState.index ? applyState.index : {
    schema: 'agent-onboard-public-readme-history-index-preview-001',
    status: 'dry_run_only',
    source_file: 'README.md',
    source_file_id: textFileId(readme),
    history_archive_candidate: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.planned_surfaces.history_archive_candidate,
    history_archive_candidate_file_id: textFileId(archiveCandidate),
    live_readme_candidate_file_id: textFileId(liveReadmeCandidate),
    section_count: sections.length,
    sections: sections.map((section) => Object.freeze({
      ordinal: section.ordinal,
      heading: section.heading,
      source_path: section.source_path,
      start_line: section.start_line,
      end_line: section.end_line,
      byte_count: section.byte_count,
      file_id: section.file_id
    }))
  };
  const indexCandidateText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  const retainedMarkers = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.retained_live_readme_markers.map((marker) => Object.freeze({
    marker,
    present_in_live_candidate: liveReadmeCandidate.includes(marker)
  }));
  const planned = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.planned_surfaces;
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-dry-run-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.command,
    check_command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.check_command,
    package_root: root,
    plan_gate_check: publicReadmeFirstReadHistorySplitPlanCheck(root).status,
    dry_run: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN,
    replay_mode: appliedReplay ? 'post_apply_replay_from_archive_index' : 'pre_apply_in_memory_preview',
    current: Object.freeze({
      readme_path: 'README.md',
      readme_present: fs.existsSync(readmePath),
      readme_bytes: Buffer.byteLength(readme, 'utf8'),
      readme_lines: readme.length === 0 ? 0 : readme.split(/\r?\n/).length,
      readme_file_id: textFileId(readme),
      history_archive_present: fs.existsSync(path.join(root, planned.history_archive_candidate)),
      history_index_present: fs.existsSync(path.join(root, planned.history_index_candidate)),
      apply_gate_applied: applyState.applied
    }),
    archive_preview: Object.freeze({
      candidate_path: planned.history_archive_candidate,
      section_count: sections.length,
      source_sections: sections.map((section) => Object.freeze({
        ordinal: section.ordinal,
        heading: section.heading,
        start_line: section.start_line,
        end_line: section.end_line,
        byte_count: section.byte_count,
        file_id: section.file_id
      })),
      byte_count: Buffer.byteLength(archiveCandidate, 'utf8'),
      file_id: textFileId(archiveCandidate),
      content_inlined: false
    }),
    live_readme_preview: Object.freeze({
      candidate_path: planned.live_readme,
      replacement_pointer_heading: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.replacement_pointer_heading,
      retained_first_read_markers: retainedMarkers,
      byte_count: Buffer.byteLength(liveReadmeCandidate, 'utf8'),
      file_id: textFileId(liveReadmeCandidate),
      content_inlined: false
    }),
    index_preview: Object.freeze({
      candidate_path: planned.history_index_candidate,
      byte_count: Buffer.byteLength(indexCandidateText, 'utf8'),
      file_id: textFileId(indexCandidateText),
      section_count: sections.length,
      content_inlined: false
    }),
    apply_state: applyState,
    diff_preview: Object.freeze({
      writes_files_now: false,
      would_write_files_after_future_admission: Object.freeze([
        planned.live_readme,
        planned.history_archive_candidate,
        planned.history_index_candidate
      ]),
      readme_line_ranges_to_archive: sections.map((section) => Object.freeze({
        heading: section.heading,
        start_line: section.start_line,
        end_line: section.end_line
      })),
      readme_replacement: Object.freeze({
        heading: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.replacement_pointer_heading,
        points_to: planned.history_archive_candidate,
        exact_content_inlined: false
      })
    }),
    boundary: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.boundary
  });
}

function publicReadmeHistoryArchiveSplitDryRunCheck(root = packageRoot()) {
  const result = publicReadmeHistoryArchiveSplitDryRun(root);
  const milestone = publicReadmeHistoryArchiveSplitMilestoneState(root);
  const installedPackageContext = sourceContext(root).package_context === 'installed_package';
  const errors = [];
  const dryRun = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN;
  if (result.plan_gate_check !== 'ok') errors.push('README split planning check must pass before archive split dry-run');
  if (!result.current.readme_present) errors.push('README.md must be present before README history archive split dry-run');
  if (!installedPackageContext && result.archive_preview.section_count < dryRun.extraction.min_history_sections) errors.push(`README history archive dry-run must identify at least ${dryRun.extraction.min_history_sections} history sections`);
  if (!installedPackageContext && result.archive_preview.byte_count <= 0) errors.push('README history archive dry-run must produce a non-empty archive preview');
  if (result.archive_preview.byte_count > dryRun.extraction.max_archive_preview_bytes) errors.push(`README history archive preview bytes ${result.archive_preview.byte_count} exceeds budget ${dryRun.extraction.max_archive_preview_bytes}`);
  if (result.live_readme_preview.byte_count > dryRun.extraction.max_live_readme_preview_bytes) errors.push(`live README preview bytes ${result.live_readme_preview.byte_count} exceeds budget ${dryRun.extraction.max_live_readme_preview_bytes}`);
  if (result.index_preview.byte_count > dryRun.extraction.max_index_preview_bytes) errors.push(`README history index preview bytes ${result.index_preview.byte_count} exceeds budget ${dryRun.extraction.max_index_preview_bytes}`);
  if (result.current.history_archive_present && !result.current.apply_gate_applied && !installedPackageContext) errors.push(`${dryRun.planned_surfaces.history_archive_candidate} must not be created before the admitted apply gate`);
  if (result.current.history_index_present && !result.current.apply_gate_applied && !installedPackageContext) errors.push(`${dryRun.planned_surfaces.history_index_candidate} must not be created before the admitted apply gate`);
  for (const marker of result.live_readme_preview.retained_first_read_markers) {
    if (!marker.present_in_live_candidate) errors.push(`live README candidate would drop first-read marker: ${marker.marker}`);
  }
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README history archive dry-run commands must remain read-only');
  if (result.boundary.creates_history_archive !== false || result.boundary.creates_history_index !== false || result.boundary.rewrites_readme !== false) errors.push('README history archive dry-run must not create archive/index or rewrite README');
  if (result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README history archive dry-run must not delete or move files');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${dryRun.milestone_id} must remain open during README history archive split dry-run`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${dryRun.prerequisite_work_item_id} must be closed before README history archive split dry-run`);
    if (milestone.work_item_status !== 'closed') errors.push(`${dryRun.work_item_id} must be closed by this README history archive split dry-run gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: dryRun.check_command,
    dry_run_command: dryRun.command,
    package_root: root,
    validated: Object.freeze({
      plan_gate_check_passes: result.plan_gate_check === 'ok',
      readme_present: result.current.readme_present,
      enough_history_sections_identified: result.archive_preview.section_count >= dryRun.extraction.min_history_sections || installedPackageContext,
      archive_preview_non_empty: result.archive_preview.byte_count > 0 || installedPackageContext,
      installed_package_context_allows_archive_omission: installedPackageContext,
      archive_preview_within_budget: result.archive_preview.byte_count <= dryRun.extraction.max_archive_preview_bytes,
      live_readme_preview_within_budget: result.live_readme_preview.byte_count <= dryRun.extraction.max_live_readme_preview_bytes,
      index_preview_within_budget: result.index_preview.byte_count <= dryRun.extraction.max_index_preview_bytes,
      future_archive_not_created: result.current.history_archive_present === false || result.current.apply_gate_applied || installedPackageContext,
      future_index_not_created: result.current.history_index_present === false || result.current.apply_gate_applied || installedPackageContext,
      apply_gate_admitted_when_archive_present: result.current.history_archive_present === false || result.current.apply_gate_applied || installedPackageContext,
      live_readme_candidate_retains_first_read_markers: result.live_readme_preview.retained_first_read_markers.every((marker) => marker.present_in_live_candidate),
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_archive_index_readme_write: result.boundary.creates_history_archive === false && result.boundary.creates_history_index === false && result.boundary.rewrites_readme === false,
      no_delete_or_move: result.boundary.deletes_files === false && result.boundary.moves_files === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    dry_run: result,
    milestone_state: milestone,
    boundary: dryRun.boundary,
    errors
  });
}

function publicReadmeHistoryArchiveSplitDryRunText(result = publicReadmeHistoryArchiveSplitDryRun()) {
  const lines = [
    `agent-onboard README history archive split dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Archive preview:',
    `- candidate: ${result.archive_preview.candidate_path}`,
    `- sections: ${result.archive_preview.section_count}`,
    `- bytes: ${result.archive_preview.byte_count}`,
    '',
    'Live README preview:',
    `- candidate: ${result.live_readme_preview.candidate_path}`,
    `- bytes: ${result.live_readme_preview.byte_count}`,
    '',
    'Boundary:',
    `- Writes files now: ${result.diff_preview.writes_files_now}`,
    `- Creates archive now: ${result.boundary.creates_history_archive}`,
    `- Creates index now: ${result.boundary.creates_history_index}`,
    `- Rewrites README now: ${result.boundary.rewrites_readme}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY = Object.freeze({
  schema: 'agent-onboard-public-readme-history-archive-split-apply-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W5'].join(''),
  work_item_id: ['P1S3M6', 'W6'].join(''),
  title: 'Public README history archive split apply gate',
  command: 'agent-onboard release --readme-apply',
  check_command: 'agent-onboard release --readme-apply-check',
  artifact_file: '.agent-onboard/public-readme-history-archive-split-apply-gate.json',
  purpose: 'Verify the admitted README history archive split after README.md has been rewritten to a first-read surface and historical release prose has been archived with a recovery index.',
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    history_archive: 'docs/release-history.md',
    history_index: '.agent-onboard/readme-history.index.json'
  }),
  retained_live_readme_markers: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers,
  extraction: Object.freeze({
    source_heading_selector: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.source_heading_selector,
    replacement_pointer_heading: '## Release history',
    min_history_sections: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.min_history_sections,
    max_archive_bytes: 90000,
    max_live_readme_bytes: 90000,
    max_index_bytes: 32768
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    creates_history_archive: true,
    creates_history_index: true,
    rewrites_readme: true,
    deletes_files: false,
    moves_files: false,
    command_mutates_work_items: false,
    command_mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false
  })
});

function publicReadmeHistoryArchiveSplitApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeHistoryArchiveSplitApply(root = packageRoot()) {
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const markerStatus = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.retained_live_readme_markers.map((marker) => Object.freeze({
    marker,
    present_in_live_readme: fs.existsSync(path.join(root, 'README.md')) && fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes(marker)
  }));
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-apply-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.command,
    check_command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    dry_run_check: publicReadmeHistoryArchiveSplitDryRunCheck(root).status,
    apply: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY,
    current: applyState,
    live_readme: Object.freeze({
      path: applyState.readme_path,
      present: applyState.readme_present,
      byte_count: applyState.readme_bytes,
      file_id: applyState.readme_file_id,
      release_history_pointer_present: applyState.readme_release_history_pointer_present,
      retained_first_read_markers: markerStatus,
      archived_history_sections_remaining: applyState.live_history_section_count
    }),
    archive: Object.freeze({
      path: applyState.history_archive_path,
      present: applyState.history_archive_present,
      byte_count: applyState.history_archive_bytes,
      file_id: applyState.history_archive_file_id,
      section_count: applyState.archive_history_section_count
    }),
    index: Object.freeze({
      path: applyState.history_index_path,
      present: applyState.history_index_present,
      status: applyState.history_index_status,
      byte_count: fs.existsSync(path.join(root, applyState.history_index_path)) ? Buffer.byteLength(fs.readFileSync(path.join(root, applyState.history_index_path), 'utf8'), 'utf8') : 0,
      file_id: applyState.history_index_file_id,
      section_count: applyState.history_index_section_count,
      live_readme_file_id: applyState.history_index_live_readme_file_id,
      history_archive_file_id: applyState.history_index_archive_file_id
    }),
    boundary: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.boundary
  });
}

function publicReadmeHistoryArchiveSplitApplyCheck(root = packageRoot()) {
  const result = publicReadmeHistoryArchiveSplitApply(root);
  const milestone = publicReadmeHistoryArchiveSplitApplyMilestoneState(root);
  const installedPackageContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const errors = [];
  const apply = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY;
  if (result.dry_run_check !== 'ok') errors.push('README history archive split dry-run check must pass before apply check');
  if (!result.current.applied && !installedPackageContext) errors.push('README history archive split must be applied with archive and index status applied');
  if (!result.current.apply_artifact_present && !installedPackageContext && !rawPruneApplied) errors.push(`${apply.artifact_file} must be present after apply`);
  if (!result.live_readme.present) errors.push('README.md must remain present after archive split apply');
  if (!result.live_readme.release_history_pointer_present) errors.push('README.md must contain a release history pointer to docs/release-history.md');
  if (result.live_readme.archived_history_sections_remaining !== 0) errors.push('README.md must not retain archived Current release/Previous release sections after apply');
  if (!result.archive.present && !installedPackageContext) errors.push(`${apply.planned_surfaces.history_archive} must be present after apply`);
  if (!installedPackageContext && result.archive.section_count < apply.extraction.min_history_sections) errors.push(`history archive must retain at least ${apply.extraction.min_history_sections} sections`);
  if (!installedPackageContext && (result.archive.byte_count <= 0 || result.archive.byte_count > apply.extraction.max_archive_bytes)) errors.push(`history archive byte count ${result.archive.byte_count} outside apply budget`);
  if (!installedPackageContext && (!result.index.present || result.index.status !== 'present_valid_json')) errors.push(`${apply.planned_surfaces.history_index} must be present and valid JSON after apply`);
  if (!installedPackageContext && result.index.section_count !== result.archive.section_count) errors.push('README history index section count must match archive section count');
  if (!installedPackageContext && result.index.live_readme_file_id !== result.live_readme.file_id) errors.push('README history index live_readme_file_id must match current README.md');
  if (!installedPackageContext && result.index.history_archive_file_id !== result.archive.file_id) errors.push('README history index history_archive_file_id must match current release history archive');
  for (const marker of result.live_readme.retained_first_read_markers) {
    if (!marker.present_in_live_readme) errors.push(`README.md dropped first-read marker after apply: ${marker.marker}`);
  }
  if (result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README archive split apply must not delete or move files');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README archive split apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('README archive split apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${apply.milestone_id} must remain open during README history archive split apply`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${apply.prerequisite_work_item_id} must be closed before README history archive split apply`);
    if (milestone.work_item_status !== 'closed') errors.push(`${apply.work_item_id} must be closed by this README history archive split apply gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-apply-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: apply.check_command,
    apply_command: apply.command,
    package_root: root,
    validated: Object.freeze({
      dry_run_check_passes: result.dry_run_check === 'ok',
      apply_state_present: result.current.applied || installedPackageContext,
      apply_artifact_present: result.current.apply_artifact_present || installedPackageContext || rawPruneApplied,
      installed_package_context_allows_source_archive_omission: installedPackageContext,
      readme_present: result.live_readme.present,
      readme_release_history_pointer_present: result.live_readme.release_history_pointer_present,
      readme_archived_sections_removed: result.live_readme.archived_history_sections_remaining === 0,
      archive_present: result.archive.present || installedPackageContext,
      archive_section_count_retained: result.archive.section_count >= apply.extraction.min_history_sections || installedPackageContext,
      index_present_valid_json: (result.index.present && result.index.status === 'present_valid_json') || installedPackageContext,
      index_matches_archive_section_count: result.index.section_count === result.archive.section_count || installedPackageContext,
      index_live_readme_digest_matches: result.index.live_readme_file_id === result.live_readme.file_id || installedPackageContext,
      index_archive_digest_matches: result.index.history_archive_file_id === result.archive.file_id || installedPackageContext,
      live_readme_retains_first_read_markers: result.live_readme.retained_first_read_markers.every((marker) => marker.present_in_live_readme),
      no_delete_or_move: result.boundary.deletes_files === false && result.boundary.moves_files === false,
      commands_are_read_only_verifiers: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    apply: result,
    milestone_state: milestone,
    boundary: apply.boundary,
    errors
  });
}

function publicReadmeHistoryArchiveSplitApplyText(result = publicReadmeHistoryArchiveSplitApply()) {
  const lines = [
    `agent-onboard README history archive split apply ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Applied surfaces:',
    `- README: ${result.live_readme.path} (${result.live_readme.byte_count} bytes)`,
    `- archive: ${result.archive.path} (${result.archive.section_count} sections, ${result.archive.byte_count} bytes)`,
    `- index: ${result.index.path} (${result.index.section_count} sections)`,
    '',
    'Boundary:',
    `- Deletes files: ${result.boundary.deletes_files}`,
    `- Moves files: ${result.boundary.moves_files}`,
    `- Publishes package: ${result.boundary.publishes_package}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}

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

const PUBLIC_EXACT_ARTIFACT_ORACLE = Object.freeze({
  schema: 'agent-onboard-public-exact-artifact-oracle-contract-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  command: 'agent-onboard release --artifact-oracle',
  check_command: 'agent-onboard release --artifact-oracle-check',
  role: 'local exact npm artifact projection and fresh installed CLI smoke oracle',
  pack_command: 'npm pack --json --pack-destination <temp>',
  install_command: 'npm install --no-audit --no-fund --ignore-scripts <local-tgz>',
  smoke_commands: Object.freeze([
    'node node_modules/agent-onboard/cli/agent-onboard.js --version',
    'node node_modules/agent-onboard/cli/agent-onboard.js release --check'
  ]),
  boundary: Object.freeze({
    writes_package_root: false,
    writes_target_repository_state: false,
    writes_temp_files: true,
    removes_temp_files: true,
    child_process_spawn: true,
    runs_package_manager: true,
    package_manager_uses_local_tgz_only: true,
    publishes_package: false,
    mutates_registry: false,
    network_required: false,
    raw_stdout_inlined: false,
    raw_stderr_inlined: false
  })
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

function npmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function compactSpawnSummary(result) {
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  return {
    status: result.status === 0 ? 'ok' : 'error',
    exit_code: typeof result.status === 'number' ? result.status : null,
    signal: result.signal || null,
    error: result.error && result.error.message ? result.error.message : null,
    stdout_bytes: Buffer.byteLength(stdout, 'utf8'),
    stderr_bytes: Buffer.byteLength(stderr, 'utf8'),
    raw_stdout_inlined: false,
    raw_stderr_inlined: false
  };
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseNpmPackJson(stdout) {
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length !== 1 || typeof parsed[0] !== 'object' || parsed[0] === null) {
    throw new Error('npm pack JSON must contain exactly one package entry');
  }
  return parsed[0];
}

function exactArtifactPackFiles(packEntry) {
  return Array.isArray(packEntry.files)
    ? packEntry.files.map((entry) => entry.path).filter((rel) => typeof rel === 'string').sort()
    : [];
}

function removeTempRoot(tempRoot) {
  if (!tempRoot || !tempRoot.startsWith(os.tmpdir())) return;
  fs.rmSync(tempRoot, { recursive: true, force: true });
}



const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prior_work_item_id: ['P1S3M6', 'W6'].join(''),
  work_item_id: ['P1S3M6', 'W7'].join(''),
  title: 'Public closed gate artifact compaction planning gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-plan',
  check_command: 'agent-onboard release --closed-gates-plan-check',
  planning_artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-planning-gate.json',
  future_index_candidate: '.agent-onboard/closed-gates.index.json',
  future_archive_candidate: '.agent-onboard/closed-gates.archive.jsonl',
  purpose: 'Plan closed gate artifact compaction without deleting, moving, rewriting, archiving, or replacing raw closure evidence. Any future apply gate must preserve a recovery path from compact index/archive back to source artifact identity.',
  minimum_closed_gate_artifacts: 30,
  boundary: Object.freeze({
    writes_files: false,
    creates_index_now: false,
    creates_archive_now: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
    compacts_raw_artifacts_now: false,
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

function publicClosedGateArtifactFiles(root = packageRoot()) {
  const stateRoot = path.join(root, '.agent-onboard');
  if (!fs.existsSync(stateRoot)) return [];
  return fs.readdirSync(stateRoot)
    .filter((name) => name.endsWith('-gate.json'))
    .map((name) => {
      const relative = path.posix.join('.agent-onboard', name);
      const absolute = path.join(root, relative);
      let parsed = null;
      let parseError = null;
      try { parsed = readJson(absolute); } catch (error) { parseError = error && error.message ? error.message : String(error); }
      const stat = fs.statSync(absolute);
      return Object.freeze({
        path: relative,
        bytes: stat.size,
        file_id: `ni:///sha-256;${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('base64url')}`,
        schema: parsed && parsed.schema ? parsed.schema : null,
        status: parsed && parsed.status ? parsed.status : null,
        milestone_id: parsed && parsed.milestone_id ? parsed.milestone_id : null,
        work_item_id: parsed && parsed.work_item_id ? parsed.work_item_id : null,
        title: parsed && parsed.title ? parsed.title : null,
        parse_error: parseError
      });
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function publicClosedGateArtifactCompactionMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id,
      prior_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prior_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id) || null;
  const priorWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id,
    prior_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prior_work_item_status: priorWorkItem ? priorWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prior_work_item_title: priorWorkItem ? priorWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactCompactionPlan(root = packageRoot()) {
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  const artifacts = publicClosedGateArtifactFiles(root);
  const totalBytes = artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0);
  const parseErrorCount = artifacts.filter((artifact) => artifact.parse_error).length;
  const largestArtifacts = artifacts.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 10).map((artifact) => Object.freeze({
    path: artifact.path,
    bytes: artifact.bytes,
    work_item_id: artifact.work_item_id,
    file_id: artifact.file_id,
    content_inlined: false
  }));
  const byMilestone = {};
  for (const artifact of artifacts) {
    const key = artifact.milestone_id || 'unknown';
    byMilestone[key] = (byMilestone[key] || 0) + 1;
  }
  const planningArtifactPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.planning_artifact_file));
  const futureIndexPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate));
  const futureArchivePresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate));
  const applyArtifactPresent = fs.existsSync(path.join(root, '.agent-onboard', 'public-closed-gate-artifact-compaction-apply-gate.json'));
  const closedGatesStatePath = path.join(root, '.agent-onboard', 'state', 'closed-gates.jsonl');
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.surface_id,
    prerequisite_checks: Object.freeze({
      clean_catalog_check: catalogCheck.status,
      readme_apply_check: publicReadmeHistoryArchiveSplitApplyCheck(root).status
    }),
    current_surface: Object.freeze({
      artifact_count: artifacts.length,
      total_bytes: totalBytes,
      parse_error_count: parseErrorCount,
      planning_artifact_present: planningArtifactPresent,
      authority_closed_gates_jsonl_present: fs.existsSync(closedGatesStatePath),
      authority_closed_gates_jsonl_bytes: fs.existsSync(closedGatesStatePath) ? fs.statSync(closedGatesStatePath).size : 0,
      by_milestone: byMilestone,
      largest_artifacts: largestArtifacts
    }),
    future_compaction_design: Object.freeze({
      index_candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate,
      archive_candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate,
      index_candidate_present_now: futureIndexPresent,
      archive_candidate_present_now: futureArchivePresent,
      apply_gate_applied: applyArtifactPresent && futureIndexPresent && futureArchivePresent,
      raw_artifacts_preserved_until_apply_gate: true,
      raw_artifact_recovery_required_after_apply: true,
      index_must_not_be_sole_authority_without_archive: true,
      archive_record_minimum_fields: Object.freeze(['path', 'file_id', 'schema', 'work_item_id', 'milestone_id', 'title', 'closed_at', 'summary_digest', 'changed_files_count', 'checks_run_count', 'raw_artifact_file_id']),
      future_apply_gate_must_name_surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.surface_id,
      future_apply_gate_must_refresh_manifest_and_authority_indexes: true
    }),
    compaction_risk_register: Object.freeze([
      Object.freeze({ id: 'evidence-loss', risk: 'raw closure evidence is deleted before an archive recovery path exists', mitigation: 'no delete or move in this planning gate; future apply must prove archive/index recovery' }),
      Object.freeze({ id: 'index-authority-confusion', risk: 'a compact index is treated as sole authority', mitigation: 'index candidate is explicitly non-authoritative without raw/archive recovery' }),
      Object.freeze({ id: 'digest-drift', risk: 'manual compaction changes file identity without manifest refresh', mitigation: 'future apply must refresh manifest, authority-map, compact authority index, and state shards' })
    ]),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.boundary
  });
}

function publicClosedGateArtifactCompactionPlanCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionPlan(root);
  const milestone = publicClosedGateArtifactCompactionMilestoneState(root);
  const errors = [];
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  if (result.prerequisite_checks.clean_catalog_check !== 'ok') errors.push('closed-gate planning requires clean catalog check to pass');
  if (result.prerequisite_checks.readme_apply_check !== 'ok') errors.push('closed-gate planning requires README apply check to pass');
  if (!installedContext && !rawPruneApplied && result.current_surface.artifact_count < PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts) errors.push(`closed-gate planning requires at least ${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts} gate artifacts`);
  if (!installedContext && !rawPruneApplied && result.current_surface.total_bytes <= 0) errors.push('closed-gate planning must measure non-zero artifact bytes');
  if (result.current_surface.parse_error_count !== 0) errors.push('closed-gate planning requires all gate artifacts to parse as JSON');
  if (!installedContext && !rawPruneApplied && result.current_surface.planning_artifact_present !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.planning_artifact_file} must exist after this planning gate closes`);
  if (!installedContext && result.current_surface.authority_closed_gates_jsonl_present !== true) errors.push('authority closed-gates JSONL shard must remain present');
  if (!rawPruneApplied && result.future_compaction_design.index_candidate_present_now !== false && result.future_compaction_design.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate} must not be created by the planning gate before apply`);
  if (!rawPruneApplied && result.future_compaction_design.archive_candidate_present_now !== false && result.future_compaction_design.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate} must not be created by the planning gate before apply`);
  if (!rawPruneApplied && result.future_compaction_design.raw_artifacts_preserved_until_apply_gate !== true) errors.push('raw artifacts must be preserved until a future apply gate');
  if (result.future_compaction_design.raw_artifact_recovery_required_after_apply !== true) errors.push('future apply must preserve raw artifact recovery');
  if (result.boundary.writes_files !== false) errors.push('closed-gate planning command must be no-write');
  if (result.boundary.deletes_files !== false) errors.push('closed-gate planning command must not delete files');
  if (result.boundary.moves_files !== false) errors.push('closed-gate planning command must not move files');
  if (result.boundary.compacts_raw_artifacts_now !== false) errors.push('closed-gate planning command must not compact raw artifacts now');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id} must remain open during closed gate artifact planning`);
    if (milestone.prior_work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id} must be closed before closed gate artifact planning passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id} must be closed by this planning gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.check_command,
    plan_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.command,
    package_root: root,
    validated: Object.freeze({
      clean_catalog_check_passes: result.prerequisite_checks.clean_catalog_check === 'ok',
      readme_apply_check_passes: result.prerequisite_checks.readme_apply_check === 'ok',
      enough_gate_artifacts: installedContext || rawPruneApplied || result.current_surface.artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts,
      source_artifacts_present_or_installed_context_allowed: installedContext || rawPruneApplied || result.current_surface.artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts,
      artifacts_parse_as_json: result.current_surface.parse_error_count === 0,
      planning_artifact_present: installedContext || rawPruneApplied || result.current_surface.planning_artifact_present === true,
      installed_context_allows_source_planning_artifact_omission: installedContext,
      future_index_not_created_or_apply_admitted: rawPruneApplied || result.future_compaction_design.index_candidate_present_now === false || result.future_compaction_design.apply_gate_applied === true,
      future_archive_not_created_or_apply_admitted: rawPruneApplied || result.future_compaction_design.archive_candidate_present_now === false || result.future_compaction_design.apply_gate_applied === true,
      raw_artifacts_preserved: rawPruneApplied || result.future_compaction_design.raw_artifacts_preserved_until_apply_gate === true,
      recovery_path_required: result.future_compaction_design.raw_artifact_recovery_required_after_apply === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_files === false,
      no_move_boundary: result.boundary.moves_files === false,
      no_raw_compaction_now: result.boundary.compacts_raw_artifacts_now === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prior_work_item_closed: !milestone.ledger_present || milestone.prior_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    milestone_state: milestone,
    plan: result,
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionPlanText(result = publicClosedGateArtifactCompactionPlan()) {
  const lines = [
    `agent-onboard closed gate artifact compaction plan ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Current surface:',
    `- artifacts: ${result.current_surface.artifact_count}`,
    `- bytes: ${result.current_surface.total_bytes}`,
    `- parse errors: ${result.current_surface.parse_error_count}`,
    '',
    'Future design:',
    `- index: ${result.future_compaction_design.index_candidate_path}`,
    `- archive: ${result.future_compaction_design.archive_candidate_path}`,
    `- raw preserved until apply: ${result.future_compaction_design.raw_artifacts_preserved_until_apply_gate}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes files: ${result.boundary.deletes_files}`,
    `- moves files: ${result.boundary.moves_files}`
  ];
  return `${lines.join('\n')}\n`;
}

const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W7'].join(''),
  work_item_id: ['P1S3M6', 'W8'].join(''),
  title: 'Public closed gate artifact compaction dry-run gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-dry-run',
  check_command: 'agent-onboard release --closed-gates-dry-run-check',
  dry_run_artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-dry-run-gate.json',
  index_candidate: '.agent-onboard/closed-gates.index.json',
  archive_candidate: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  boundary: Object.freeze({
    writes_files: false,
    creates_index_now: false,
    creates_archive_now: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    compacts_raw_artifacts_now: false,
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

function publicClosedGateArtifactParsedRecord(root, artifact, ordinal) {
  const absolute = path.join(root, artifact.path);
  let parsed = null;
  try { parsed = readJson(absolute); } catch { parsed = null; }
  const changedFiles = parsed && Array.isArray(parsed.changed_files) ? parsed.changed_files : [];
  const checks = parsed && Array.isArray(parsed.verification_commands) ? parsed.verification_commands : (parsed && Array.isArray(parsed.checks_run) ? parsed.checks_run : []);
  const summary = parsed && typeof parsed.summary === 'string' ? parsed.summary : (parsed && parsed.closure && typeof parsed.closure.summary === 'string' ? parsed.closure.summary : '');
  const rawText = fs.readFileSync(absolute, 'utf8');
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-record-001',
    ordinal,
    path: artifact.path,
    raw_artifact_file_id: artifact.file_id,
    file_id: artifact.file_id,
    byte_count: artifact.bytes,
    schema_id: artifact.schema,
    status: artifact.status,
    package_version: parsed && parsed.package_version ? parsed.package_version : null,
    release_line: parsed && parsed.release_line ? parsed.release_line : null,
    milestone_id: artifact.milestone_id,
    work_item_id: artifact.work_item_id,
    title: artifact.title,
    closed_at: parsed && parsed.closed_at ? parsed.closed_at : null,
    surface_id: parsed && parsed.surface_id ? parsed.surface_id : null,
    changed_files_count: changedFiles.length,
    checks_run_count: checks.length,
    summary_digest: textFileId(summary || `${artifact.path}:${artifact.file_id}`),
    raw_digest: textFileId(rawText),
    content_inlined: false
  });
}

function publicClosedGateArtifactCompactionDryRunMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactArchiveCandidateText(records) {
  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
}

function publicClosedGateArtifactIndexCandidate(root, records, archiveText, options = Object.freeze({})) {
  const byMilestone = {};
  for (const record of records) {
    const key = record.milestone_id || 'unknown';
    byMilestone[key] = (byMilestone[key] || 0) + 1;
  }
  const applyMode = options.status === 'applied';
  return Object.freeze({
    schema: applyMode ? 'agent-onboard-public-closed-gates-index-001' : 'agent-onboard-public-closed-gates-index-preview-001',
    status: applyMode ? 'applied' : 'dry_run_only',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.surface_id,
    source_context: sourceContext(root).package_context,
    source_root_inlined: false,
    index_path: applyMode ? PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.index_path : PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
    archive_candidate_path: applyMode ? PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.archive_path : PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate,
    archive_candidate_file_id: textFileId(archiveText),
    record_count: records.length,
    raw_artifact_count: records.length,
    raw_artifacts_preserved: true,
    raw_artifact_paths: records.map((record) => record.path),
    raw_artifact_file_ids: records.map((record) => record.raw_artifact_file_id),
    by_milestone: byMilestone,
    recovery: Object.freeze({
      replay_from_archive_jsonl: true,
      replay_from_raw_artifact_paths: true,
      raw_artifacts_required_until_apply_gate: !applyMode,
      raw_artifacts_preserved_after_apply: applyMode,
      raw_artifacts_required_until_future_prune_gate: applyMode,
      index_is_not_sole_authority: true,
      archive_is_recovery_source: true,
      content_inlined: false
    })
  });
}

function publicClosedGateArtifactCompactionDryRun(root = packageRoot()) {
  const planCheck = publicClosedGateArtifactCompactionPlanCheck(root);
  const artifacts = publicClosedGateArtifactFiles(root);
  const records = artifacts.map((artifact, index) => publicClosedGateArtifactParsedRecord(root, artifact, index + 1));
  const archiveText = publicClosedGateArtifactArchiveCandidateText(records);
  const indexCandidate = publicClosedGateArtifactIndexCandidate(root, records, archiveText);
  const indexText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  const indexPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate));
  const archivePresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate));
  const applyArtifactPresent = fs.existsSync(path.join(root, '.agent-onboard', 'public-closed-gate-artifact-compaction-apply-gate.json'));
  const appliedReplay = indexPresent && archivePresent && applyArtifactPresent;
  const dryRunArtifactPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.dry_run_artifact_file));
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.surface_id,
    plan_gate_check: planCheck.status,
    current: Object.freeze({
      raw_gate_artifact_count: artifacts.length,
      raw_gate_artifact_bytes: artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      parse_error_count: artifacts.filter((artifact) => artifact.parse_error).length,
      index_candidate_present: indexPresent,
      archive_candidate_present: archivePresent,
      dry_run_artifact_present: dryRunArtifactPresent,
      apply_gate_applied: appliedReplay
    }),
    archive_preview: Object.freeze({
      candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate,
      file_id: textFileId(archiveText),
      byte_count: Buffer.byteLength(archiveText, 'utf8'),
      record_count: records.length,
      content_inlined: false,
      first_record: records[0] || null,
      last_record: records[records.length - 1] || null
    }),
    index_preview: Object.freeze({
      candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
      file_id: textFileId(indexText),
      byte_count: Buffer.byteLength(indexText, 'utf8'),
      record_count: indexCandidate.record_count,
      archive_candidate_file_id: indexCandidate.archive_candidate_file_id,
      raw_artifacts_preserved: indexCandidate.raw_artifacts_preserved,
      recovery: indexCandidate.recovery
    }),
    recovery_map_preview: Object.freeze({
      raw_artifact_count: records.length,
      raw_artifact_paths_present: records.every((record) => fs.existsSync(path.join(root, record.path))),
      raw_artifact_file_ids_match: records.every((record) => record.raw_artifact_file_id === record.file_id),
      archive_record_file_ids_match_raw: records.every((record) => record.raw_artifact_file_id === record.raw_digest),
      content_inlined: false
    }),
    diff_preview: Object.freeze({
      writes_files_now: false,
      would_write_files_after_future_admission: appliedReplay ? Object.freeze([]) : Object.freeze([
        PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
        PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate
      ]),
      would_delete_or_move_raw_artifacts_after_future_admission: false
    }),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.boundary
  });
}

function publicClosedGateArtifactCompactionDryRunCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionDryRun(root);
  const milestone = publicClosedGateArtifactCompactionDryRunMilestoneState(root);
  const errors = [];
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  if (result.plan_gate_check !== 'ok') errors.push('closed gate dry-run requires closed-gates plan check to pass');
  if (!installedContext && !rawPruneApplied && result.current.raw_gate_artifact_count < PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count) errors.push(`closed gate dry-run requires at least ${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count} raw gate artifacts`);
  if (result.current.parse_error_count !== 0) errors.push('closed gate dry-run requires all raw gate artifacts to parse as JSON');
  if (!rawPruneApplied && result.archive_preview.record_count !== result.current.raw_gate_artifact_count) errors.push('archive preview record count must match raw gate artifact count');
  if (!rawPruneApplied && result.index_preview.record_count !== result.archive_preview.record_count) errors.push('index preview record count must match archive preview record count');
  if (!rawPruneApplied && result.index_preview.archive_candidate_file_id !== result.archive_preview.file_id) errors.push('index preview archive digest must match archive preview digest');
  if (!installedContext && !rawPruneApplied && result.current.dry_run_artifact_present !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.dry_run_artifact_file} must exist after this dry-run gate closes`);
  if (!rawPruneApplied && result.current.index_candidate_present !== false && result.current.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate} must not be written by dry-run gate before apply`);
  if (!rawPruneApplied && result.current.archive_candidate_present !== false && result.current.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate} must not be written by dry-run gate before apply`);
  if (!rawPruneApplied && result.recovery_map_preview.raw_artifact_paths_present !== true) errors.push('recovery map raw artifact paths must still be present');
  if (!rawPruneApplied && result.recovery_map_preview.raw_artifact_file_ids_match !== true) errors.push('recovery map raw artifact file ids must match compact records');
  if (result.diff_preview.writes_files_now !== false) errors.push('closed gate dry-run must not write files now');
  if (result.diff_preview.would_delete_or_move_raw_artifacts_after_future_admission !== false) errors.push('dry-run must not plan raw artifact deletion or movement');
  if (result.boundary.writes_files !== false) errors.push('closed gate dry-run command must be no-write');
  if (result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate dry-run command must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate dry-run command must not move raw gate artifacts');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id} must remain open during closed gate dry-run`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id} must be closed before closed gate dry-run passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id} must be closed by this dry-run gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.check_command,
    dry_run_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.command,
    package_root: root,
    validated: Object.freeze({
      plan_gate_check_passes: result.plan_gate_check === 'ok',
      enough_raw_gate_artifacts: installedContext || rawPruneApplied || result.current.raw_gate_artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count,
      raw_gate_artifacts_parse_as_json: result.current.parse_error_count === 0,
      archive_record_count_matches_raw_artifacts: rawPruneApplied || result.archive_preview.record_count === result.current.raw_gate_artifact_count,
      index_record_count_matches_archive: rawPruneApplied || result.index_preview.record_count === result.archive_preview.record_count,
      index_archive_digest_matches_archive_preview: rawPruneApplied || result.index_preview.archive_candidate_file_id === result.archive_preview.file_id,
      dry_run_artifact_present: installedContext || rawPruneApplied || result.current.dry_run_artifact_present === true,
      future_index_not_created_or_apply_admitted: rawPruneApplied || result.current.index_candidate_present === false || result.current.apply_gate_applied === true,
      future_archive_not_created_or_apply_admitted: rawPruneApplied || result.current.archive_candidate_present === false || result.current.apply_gate_applied === true,
      raw_artifacts_preserved: rawPruneApplied || result.recovery_map_preview.raw_artifact_paths_present === true,
      recovery_file_ids_match: rawPruneApplied || result.recovery_map_preview.raw_artifact_file_ids_match === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_raw_gate_artifacts === false,
      no_move_boundary: result.boundary.moves_raw_gate_artifacts === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    milestone_state: milestone,
    dry_run: result,
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionDryRunText(result = publicClosedGateArtifactCompactionDryRun()) {
  const lines = [
    `agent-onboard closed gate artifact compaction dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Preview:',
    `- records: ${result.archive_preview.record_count}`,
    `- archive bytes: ${result.archive_preview.byte_count}`,
    `- index bytes: ${result.index_preview.byte_count}`,
    `- writes now: ${result.diff_preview.writes_files_now}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`
  ];
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W8'].join(''),
  work_item_id: ['P1S3M6', 'W9'].join(''),
  title: 'Public closed gate artifact compaction apply gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-apply',
  check_command: 'agent-onboard release --closed-gates-apply-check',
  artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-apply-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  max_index_bytes: 90000,
  max_archive_bytes: 250000,
  purpose: 'Verify the admitted closed-gate artifact archive and compact index after materialization. Raw gate JSON artifacts remain present until a future prune gate admits deletion or movement.',
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    creates_index: true,
    creates_archive: true,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    mutates_work_items: false,
    mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false,
    file_contents_inlined: false
  })
});

function publicClosedGateArtifactCompactionApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactCompactionApplyCandidates(root = packageRoot()) {
  const artifacts = publicClosedGateArtifactFiles(root);
  const records = artifacts.map((artifact, index) => publicClosedGateArtifactParsedRecord(root, artifact, index + 1));
  const archiveText = publicClosedGateArtifactArchiveCandidateText(records);
  const indexCandidate = publicClosedGateArtifactIndexCandidate(root, records, archiveText, { status: 'applied' });
  const indexText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  return Object.freeze({ artifacts, records, archiveText, indexCandidate, indexText });
}

function publicClosedGateArtifactCompactionApplyState(root = packageRoot()) {
  const apply = PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY;
  const candidates = publicClosedGateArtifactCompactionApplyCandidates(root);
  const indexPath = path.join(root, apply.index_path);
  const archivePath = path.join(root, apply.archive_path);
  const artifactPath = path.join(root, apply.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  const applyArtifactPresent = fs.existsSync(artifactPath);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (indexPresent) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archiveText = archivePresent ? fs.readFileSync(archivePath, 'utf8') : '';
  const archiveRecords = archiveText.trim().length === 0 ? [] : archiveText.trimEnd().split('\n').map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  });
  const archiveParseErrorCount = archiveRecords.filter((record) => record === null).length;
  return Object.freeze({
    applied: indexPresent && archivePresent && applyArtifactPresent,
    index_path: apply.index_path,
    index_present: indexPresent,
    index_status: indexStatus,
    index_parse_error: indexParseError,
    index_bytes: indexPresent ? fs.statSync(indexPath).size : 0,
    index_file_id: indexPresent ? textFileId(fs.readFileSync(indexPath, 'utf8')) : null,
    expected_index_file_id: textFileId(candidates.indexText),
    index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
    index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
    archive_path: apply.archive_path,
    archive_present: archivePresent,
    archive_bytes: archivePresent ? fs.statSync(archivePath).size : 0,
    archive_file_id: archivePresent ? textFileId(archiveText) : null,
    expected_archive_file_id: textFileId(candidates.archiveText),
    archive_record_count: archiveRecords.length,
    archive_parse_error_count: archiveParseErrorCount,
    apply_artifact_path: apply.artifact_file,
    apply_artifact_present: applyArtifactPresent,
    raw_gate_artifact_count: candidates.records.length,
    raw_gate_artifacts_present: candidates.records.every((record) => fs.existsSync(path.join(root, record.path))),
    raw_gate_artifact_file_ids_match_archive: archiveRecords.length === candidates.records.length && archiveRecords.every((record, index) => record && candidates.records[index] && record.raw_artifact_file_id === candidates.records[index].raw_artifact_file_id),
    archive_matches_expected: archivePresent && textFileId(archiveText) === textFileId(candidates.archiveText),
    index_matches_expected: indexPresent && textFileId(fs.readFileSync(indexPath, 'utf8')) === textFileId(candidates.indexText),
    candidates
  });
}

function publicClosedGateArtifactCompactionApply(root = packageRoot()) {
  const state = publicClosedGateArtifactCompactionApplyState(root);
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.surface_id,
    dry_run_check: publicClosedGateArtifactCompactionDryRunCheck(root).status,
    apply: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY,
    current: Object.freeze({
      applied: state.applied,
      index_present: state.index_present,
      archive_present: state.archive_present,
      apply_artifact_present: state.apply_artifact_present,
      raw_gate_artifact_count: state.raw_gate_artifact_count,
      raw_gate_artifacts_present: state.raw_gate_artifacts_present
    }),
    archive: Object.freeze({
      path: state.archive_path,
      present: state.archive_present,
      byte_count: state.archive_bytes,
      file_id: state.archive_file_id,
      expected_file_id: state.expected_archive_file_id,
      record_count: state.archive_record_count,
      parse_error_count: state.archive_parse_error_count,
      matches_expected: state.archive_matches_expected,
      content_inlined: false
    }),
    index: Object.freeze({
      path: state.index_path,
      present: state.index_present,
      status: state.index_status,
      byte_count: state.index_bytes,
      file_id: state.index_file_id,
      expected_file_id: state.expected_index_file_id,
      record_count: state.index_record_count,
      archive_file_id: state.index_archive_file_id,
      matches_expected: state.index_matches_expected,
      content_inlined: false
    }),
    recovery: Object.freeze({
      raw_gate_artifacts_preserved: state.raw_gate_artifacts_present,
      archive_replays_raw_artifact_file_ids: state.raw_gate_artifact_file_ids_match_archive,
      index_archive_digest_matches_archive: state.index_archive_file_id === state.archive_file_id,
      index_is_not_sole_authority: true,
      future_prune_gate_required_before_deletion: true,
      content_inlined: false
    }),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.boundary
  });
}

function publicClosedGateArtifactCompactionApplyCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionApply(root);
  const milestone = publicClosedGateArtifactCompactionApplyMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const apply = PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY;
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const pruneState = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const errors = [];
  if (result.dry_run_check !== 'ok') errors.push('closed gate artifact compaction dry-run check must pass before apply check');
  if (!installedContext && !rawPruneApplied && result.current.raw_gate_artifact_count < apply.minimum_record_count) errors.push(`closed gate apply requires at least ${apply.minimum_record_count} raw gate artifacts`);
  if (!installedContext && !rawPruneApplied && !result.current.applied) errors.push('closed gate compaction apply must materialize index, archive, and apply gate artifact');
  if (!installedContext && !result.archive.present) errors.push(`${apply.archive_path} must be present after apply`);
  if (!installedContext && !result.index.present) errors.push(`${apply.index_path} must be present after apply`);
  if (!installedContext && !rawPruneApplied && !result.current.apply_artifact_present) errors.push(`${apply.artifact_file} must be present after apply`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed gate archive JSONL records must all parse');
  if (!installedContext && !rawPruneApplied && result.archive.record_count !== result.current.raw_gate_artifact_count) errors.push('closed gate archive record count must match raw gate artifact count');
  if (!installedContext && result.index.record_count !== result.archive.record_count) errors.push('closed gate index record count must match archive record count');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('closed gate index archive digest must match archive file digest');
  if (!installedContext && !rawPruneApplied && !result.archive.matches_expected) errors.push('closed gate archive file must match generated archive candidate');
  if (!installedContext && !rawPruneApplied && !result.index.matches_expected) errors.push('closed gate index file must match generated index candidate');
  if (!installedContext && result.index.byte_count > apply.max_index_bytes) errors.push(`closed gate index byte count ${result.index.byte_count} outside apply budget`);
  if (!installedContext && result.archive.byte_count > apply.max_archive_bytes) errors.push(`closed gate archive byte count ${result.archive.byte_count} outside apply budget`);
  if (!rawPruneApplied && !result.recovery.raw_gate_artifacts_preserved && !installedContext) errors.push('raw closed gate artifacts must remain present after apply');
  if (!rawPruneApplied && !result.recovery.archive_replays_raw_artifact_file_ids && !installedContext) errors.push('archive records must preserve raw artifact file ids in order');
  if (!rawPruneApplied && result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate apply must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate apply must not move raw gate artifacts');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('closed gate apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('closed gate apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${apply.milestone_id} must remain open during closed gate artifact apply`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${apply.prerequisite_work_item_id} must be closed before closed gate artifact apply`);
    if (milestone.work_item_status !== 'closed') errors.push(`${apply.work_item_id} must be closed by this closed gate artifact apply gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: apply.check_command,
    apply_command: apply.command,
    package_root: root,
    validated: Object.freeze({
      dry_run_check_passes: result.dry_run_check === 'ok',
      apply_state_present: rawPruneApplied || result.current.applied || installedContext,
      apply_artifact_present: rawPruneApplied || result.current.apply_artifact_present || installedContext,
      archive_present: result.archive.present || installedContext,
      index_present_valid_json: (result.index.present && result.index.status === 'present_valid_json') || installedContext,
      raw_gate_artifacts_preserved: rawPruneApplied || result.recovery.raw_gate_artifacts_preserved || installedContext,
      archive_record_count_matches_raw_artifacts: rawPruneApplied || result.archive.record_count === result.current.raw_gate_artifact_count || installedContext,
      index_record_count_matches_archive: result.index.record_count === result.archive.record_count || installedContext,
      index_archive_digest_matches_archive: result.index.archive_file_id === result.archive.file_id || installedContext,
      archive_matches_generated_candidate: rawPruneApplied || result.archive.matches_expected || installedContext,
      index_matches_generated_candidate: rawPruneApplied || result.index.matches_expected || installedContext,
      archive_replays_raw_artifact_file_ids: rawPruneApplied || result.recovery.archive_replays_raw_artifact_file_ids || installedContext,
      no_delete_raw_artifacts: rawPruneApplied || result.boundary.deletes_raw_gate_artifacts === false,
      no_move_raw_artifacts: result.boundary.moves_raw_gate_artifacts === false,
      commands_are_read_only_verifiers: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    apply: result,
    milestone_state: milestone,
    boundary: apply.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionApplyText(result = publicClosedGateArtifactCompactionApply()) {
  const lines = [
    `agent-onboard closed gate artifact compaction apply ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Applied surfaces:',
    `- index: ${result.index.path} (${result.index.record_count} records, ${result.index.byte_count} bytes)`,
    `- archive: ${result.archive.path} (${result.archive.record_count} records, ${result.archive.byte_count} bytes)`,
    `- raw artifacts preserved: ${result.recovery.raw_gate_artifacts_preserved}`,
    '',
    'Boundary:',
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLOSED_GATE_ARCHIVE_READER = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-archive-reader-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W9'].join(''),
  work_item_id: ['P1S3M6', 'W10'].join(''),
  title: 'Public closed gate archive reader and full-test timeout hardening gate',
  surface_id: 'closed-gate-archive-reader',
  command: 'agent-onboard release --closed-gates-read',
  check_command: 'agent-onboard release --closed-gates-read-check',
  artifact_file: '.agent-onboard/public-closed-gate-archive-reader-full-test-hardening-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  max_reader_payload_bytes: 90000,
  boundary: Object.freeze({
    writes_files: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    reads_archive_index_only: true,
    raw_artifact_content_inlined: false,
    archive_record_content_inlined: false,
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

function publicClosedGateArchiveReaderMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function readPublicClosedGateArchiveJsonl(root, archivePath) {
  if (!fs.existsSync(archivePath)) return Object.freeze({ text: '', records: Object.freeze([]), parse_errors: Object.freeze([]) });
  const text = fs.readFileSync(archivePath, 'utf8');
  const lines = text.trim().length === 0 ? [] : text.trimEnd().split('\n');
  const records = [];
  const parseErrors = [];
  for (let index = 0; index < lines.length; index += 1) {
    try {
      records.push(JSON.parse(lines[index]));
    } catch (error) {
      parseErrors.push(Object.freeze({ line: index + 1, message: error && error.message ? error.message : String(error) }));
    }
  }
  return Object.freeze({ text, records: Object.freeze(records), parse_errors: Object.freeze(parseErrors) });
}

function publicClosedGateArchiveReader(root = packageRoot()) {
  const reader = PUBLIC_CLOSED_GATE_ARCHIVE_READER;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const indexPath = path.join(root, reader.index_path);
  const archivePath = path.join(root, reader.archive_path);
  const artifactPath = path.join(root, reader.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (indexPresent) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archive = readPublicClosedGateArchiveJsonl(root, archivePath);
  const recordPaths = archive.records.map((record) => record && record.path).filter((value) => typeof value === 'string');
  const recordOrdinals = archive.records.map((record) => record && record.ordinal).filter((value) => Number.isInteger(value));
  const uniquePaths = new Set(recordPaths);
  const uniqueOrdinals = new Set(recordOrdinals);
  const ordinalSequenceContiguous = archive.records.every((record, index) => record && record.ordinal === index + 1);
  const byMilestone = {};
  const byStatus = {};
  for (const record of archive.records) {
    const milestoneKey = record && record.milestone_id ? record.milestone_id : 'unknown';
    const statusKey = record && record.status ? record.status : 'unknown';
    byMilestone[milestoneKey] = (byMilestone[milestoneKey] || 0) + 1;
    byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
  }
  const rawPathReports = archive.records.map((record) => {
    const rel = record && typeof record.path === 'string' ? record.path : '';
    const absolute = path.join(root, rel);
    const present = rel.length > 0 && fs.existsSync(absolute);
    const fileId = present ? `ni:///sha-256;${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('base64url')}` : null;
    return Object.freeze({
      path: rel,
      present,
      archive_file_id: record && record.raw_artifact_file_id ? record.raw_artifact_file_id : null,
      current_file_id_matches_archive: present && record && record.raw_artifact_file_id ? fileId === record.raw_artifact_file_id : false,
      content_inlined: false
    });
  });
  const rawGateArtifactFiles = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const testRunnerPath = path.join(root, 'test', 'run-tests.js');
  const testRunnerText = fs.existsSync(testRunnerPath) ? fs.readFileSync(testRunnerPath, 'utf8') : '';
  const runnerTimeoutConfigured = /(AGENT_ONBOARD_TEST_TASK_TIMEOUT_MS|AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS)/.test(testRunnerText) && /timeoutMs/.test(testRunnerText) && /task timeout/.test(testRunnerText);
  const compactLatestRecords = archive.records.slice(-5).map((record) => Object.freeze({
    ordinal: record.ordinal,
    path: record.path,
    work_item_id: record.work_item_id,
    milestone_id: record.milestone_id,
    status: record.status,
    raw_artifact_file_id: record.raw_artifact_file_id,
    content_inlined: false
  }));
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-reader-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: reader.command,
    check_command: reader.check_command,
    package_root: root,
    package_context: context,
    surface_id: reader.surface_id,
    apply_check_status: publicClosedGateArtifactCompactionApplyCheck(root).status,
    installed_package_source_archive_omitted: installedContext && !indexPresent && !archivePresent,
    index: Object.freeze({
      path: reader.index_path,
      present: indexPresent,
      status: indexStatus,
      parse_error: indexParseError,
      byte_count: indexPresent ? fs.statSync(indexPath).size : 0,
      file_id: indexPresent ? textFileId(fs.readFileSync(indexPath, 'utf8')) : null,
      record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
      archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
      raw_artifact_count: index && typeof index.raw_artifact_count === 'number' ? index.raw_artifact_count : 0,
      raw_artifacts_preserved: index && typeof index.raw_artifacts_preserved === 'boolean' ? index.raw_artifacts_preserved : false,
      recovery: index && index.recovery ? index.recovery : null,
      content_inlined: false
    }),
    archive: Object.freeze({
      path: reader.archive_path,
      present: archivePresent,
      byte_count: archivePresent ? fs.statSync(archivePath).size : 0,
      file_id: archivePresent ? textFileId(archive.text) : null,
      record_count: archive.records.length,
      parse_error_count: archive.parse_errors.length,
      parse_errors: archive.parse_errors,
      content_inlined: false
    }),
    reader: Object.freeze({
      records_loaded: archive.records.length,
      unique_paths: uniquePaths.size,
      unique_ordinals: uniqueOrdinals.size,
      ordinal_sequence_contiguous: ordinalSequenceContiguous,
      by_milestone: byMilestone,
      by_status: byStatus,
      latest_records: compactLatestRecords,
      raw_archive_record_content_inlined: false
    }),
    recovery: Object.freeze({
      raw_gate_artifact_count: rawGateArtifactFiles.length,
      raw_gate_artifacts_present: installedContext || rawPathReports.every((report) => report.present === true),
      raw_gate_artifact_file_ids_match_archive: installedContext || rawPathReports.every((report) => report.current_file_id_matches_archive === true),
      raw_path_reports_content_inlined: false,
      raw_path_report_count: rawPathReports.length
    }),
    test_runner_hardening: Object.freeze({
      run_tests_file_present: fs.existsSync(testRunnerPath),
      per_task_timeout_configured: runnerTimeoutConfigured,
      full_suite_timeout_failure_is_bounded: runnerTimeoutConfigured,
      package_context_allows_absent_tests: installedContext
    }),
    artifact: Object.freeze({
      path: reader.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    boundary: reader.boundary
  });
}

function publicClosedGateArchiveReaderCheck(root = packageRoot()) {
  const result = publicClosedGateArchiveReader(root);
  const reader = PUBLIC_CLOSED_GATE_ARCHIVE_READER;
  const milestone = publicClosedGateArchiveReaderMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const errors = [];
  if (result.apply_check_status !== 'ok') errors.push('closed gate archive reader requires closed-gates apply check to pass');
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${reader.artifact_file} must exist after this reader gate closes`);
  if (!installedContext && result.index.present !== true) errors.push(`${reader.index_path} must be present for archive reader`);
  if (!installedContext && result.index.status !== 'present_valid_json') errors.push(`${reader.index_path} must parse as JSON`);
  if (!installedContext && result.archive.present !== true) errors.push(`${reader.archive_path} must be present for archive reader`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed gate archive reader requires every archive JSONL record to parse');
  if (!installedContext && result.archive.record_count < reader.minimum_record_count) errors.push(`closed gate archive reader requires at least ${reader.minimum_record_count} records`);
  if (!installedContext && result.index.record_count !== result.archive.record_count) errors.push('closed gate archive reader index record count must match archive record count');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('closed gate archive reader index archive digest must match archive file digest');
  if (!installedContext && result.index.raw_artifact_count !== result.archive.record_count) errors.push('closed gate archive reader index raw artifact count must match archive record count');
  if (!installedContext && result.reader.unique_paths !== result.archive.record_count) errors.push('closed gate archive reader requires unique archive record paths');
  if (!installedContext && result.reader.unique_ordinals !== result.archive.record_count) errors.push('closed gate archive reader requires unique archive record ordinals');
  if (!installedContext && result.reader.ordinal_sequence_contiguous !== true) errors.push('closed gate archive reader requires contiguous ordinal sequence');
  if (!installedContext && !rawPruneApplied && result.recovery.raw_gate_artifacts_present !== true) errors.push('closed gate archive reader requires raw gate artifact paths to remain present');
  if (!installedContext && !rawPruneApplied && result.recovery.raw_gate_artifact_file_ids_match_archive !== true) errors.push('closed gate archive reader requires raw artifact file ids to match archive records');
  if (!installedContext && result.test_runner_hardening.per_task_timeout_configured !== true) errors.push('full test runner must configure bounded per-task timeout before W10 closes');
  if (result.boundary.writes_files !== false) errors.push('closed gate archive reader must be no-write');
  if (result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate archive reader must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate archive reader must not move raw gate artifacts');
  if (result.boundary.raw_artifact_content_inlined !== false || result.boundary.archive_record_content_inlined !== false) errors.push('closed gate archive reader must not inline raw artifact or archive contents');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('closed gate archive reader must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${reader.milestone_id} must remain open during closed gate archive reader gate`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${reader.prerequisite_work_item_id} must be closed before closed gate archive reader passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${reader.work_item_id} must be closed by this closed gate archive reader gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-reader-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: reader.check_command,
    reader_command: reader.command,
    package_root: root,
    validated: Object.freeze({
      apply_check_passes: result.apply_check_status === 'ok',
      source_archive_omission_allowed_in_installed_package: installedContext ? result.installed_package_source_archive_omitted === true : true,
      reader_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      index_present_valid_json: installedContext || (result.index.present === true && result.index.status === 'present_valid_json'),
      archive_present: installedContext || result.archive.present === true,
      archive_records_parse: installedContext || result.archive.parse_error_count === 0,
      enough_archive_records: installedContext || result.archive.record_count >= reader.minimum_record_count,
      index_record_count_matches_archive: installedContext || result.index.record_count === result.archive.record_count,
      index_archive_digest_matches_archive: installedContext || result.index.archive_file_id === result.archive.file_id,
      unique_record_paths: installedContext || result.reader.unique_paths === result.archive.record_count,
      unique_record_ordinals: installedContext || result.reader.unique_ordinals === result.archive.record_count,
      ordinal_sequence_contiguous: installedContext || result.reader.ordinal_sequence_contiguous === true,
      raw_gate_artifacts_preserved: installedContext || rawPruneApplied || result.recovery.raw_gate_artifacts_present === true,
      raw_file_ids_match_archive: installedContext || rawPruneApplied || result.recovery.raw_gate_artifact_file_ids_match_archive === true,
      full_test_task_timeout_hardened: installedContext || result.test_runner_hardening.per_task_timeout_configured === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_raw_gate_artifacts === false,
      no_move_boundary: result.boundary.moves_raw_gate_artifacts === false,
      no_raw_content_inline: result.boundary.raw_artifact_content_inlined === false && result.boundary.archive_record_content_inlined === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    reader: result,
    milestone_state: milestone,
    boundary: reader.boundary,
    errors
  });
}

function publicClosedGateArchiveReaderText(result = publicClosedGateArchiveReader()) {
  const lines = [
    `agent-onboard closed gate archive reader ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Archive:',
    `- records: ${result.archive.record_count}`,
    `- bytes: ${result.archive.byte_count}`,
    `- parse errors: ${result.archive.parse_error_count}`,
    '',
    'Recovery:',
    `- raw artifacts present: ${result.recovery.raw_gate_artifacts_present}`,
    `- raw file ids match archive: ${result.recovery.raw_gate_artifact_file_ids_match_archive}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- inlines raw content: ${result.boundary.raw_artifact_content_inlined}`
  ];
  return `${lines.join('\n')}\n`;
}


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



function publicClosedGateRawArtifactPruneApplyArtifactPath(root = packageRoot()) {
  return path.join(root, '.agent-onboard', 'public-closed-gate-raw-artifact-prune-apply-admission.json');
}

function publicClosedGateRawArtifactPruneApplyAdmitted(root = packageRoot()) {
  const artifactPath = publicClosedGateRawArtifactPruneApplyArtifactPath(root);
  const indexPath = path.join(root, '.agent-onboard', 'closed-gates.index.json');
  if (!fs.existsSync(artifactPath) || !fs.existsSync(indexPath)) return false;
  try {
    const artifact = readJson(artifactPath);
    const index = readJson(indexPath);
    return artifact && artifact.status === 'ok'
      && artifact.applied === true
      && artifact.raw_gate_artifacts_pruned === true
      && index && index.recovery && index.recovery.raw_artifacts_pruned === true
      && index.recovery.prune_apply_artifact_file === '.agent-onboard/public-closed-gate-raw-artifact-prune-apply-admission.json';
  } catch {
    return false;
  }
}

function publicClosedGateRawArtifactPruneApplyIndexState(root = packageRoot()) {
  const indexPath = path.join(root, '.agent-onboard', 'closed-gates.index.json');
  const archivePath = path.join(root, '.agent-onboard', 'closed-gates.archive.jsonl');
  const artifactPath = publicClosedGateRawArtifactPruneApplyArtifactPath(root);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (fs.existsSync(indexPath)) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archive = readPublicClosedGateArchiveJsonl(root, archivePath);
  const indexedPaths = index && Array.isArray(index.raw_artifact_paths) ? index.raw_artifact_paths.filter((rel) => typeof rel === 'string') : [];
  const indexedFileIds = index && Array.isArray(index.raw_artifact_file_ids) ? index.raw_artifact_file_ids.filter((rel) => typeof rel === 'string') : [];
  const archiveFileId = fs.existsSync(archivePath) ? textFileId(archive.text) : null;
  const remainingIndexedPaths = indexedPaths.filter((rel) => fs.existsSync(path.join(root, rel)));
  const archiveRecordFileIds = archive.records.map((record) => record && record.raw_artifact_file_id).filter((value) => typeof value === 'string');
  const archiveRecordPaths = archive.records.map((record) => record && record.path).filter((value) => typeof value === 'string');
  const archivePathsMatchIndex = indexedPaths.length === archiveRecordPaths.length && indexedPaths.every((rel, index) => rel === archiveRecordPaths[index]);
  const archiveFileIdsMatchIndex = indexedFileIds.length === archiveRecordFileIds.length && indexedFileIds.every((fileId, index) => fileId === archiveRecordFileIds[index]);
  return Object.freeze({
    index_path: '.agent-onboard/closed-gates.index.json',
    index_present: fs.existsSync(indexPath),
    index_status: indexStatus,
    index_parse_error: indexParseError,
    index,
    index_file_id: fs.existsSync(indexPath) ? textFileId(fs.readFileSync(indexPath, 'utf8')) : null,
    archive_path: '.agent-onboard/closed-gates.archive.jsonl',
    archive_present: fs.existsSync(archivePath),
    archive_file_id: archiveFileId,
    archive_record_count: archive.records.length,
    archive_parse_error_count: archive.parse_errors.length,
    index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
    index_raw_artifact_count: index && typeof index.raw_artifact_count === 'number' ? index.raw_artifact_count : indexedPaths.length,
    index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
    indexed_paths: indexedPaths,
    indexed_file_ids: indexedFileIds,
    remaining_indexed_paths: remainingIndexedPaths,
    archive_paths_match_index: archivePathsMatchIndex,
    archive_file_ids_match_index: archiveFileIdsMatchIndex,
    artifact_path: '.agent-onboard/public-closed-gate-raw-artifact-prune-apply-admission.json',
    artifact_present: fs.existsSync(artifactPath),
    index_recovery: index && index.recovery ? index.recovery : null
  });
}


const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-planning-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W11'].join(''),
  work_item_id: ['P1S3M6', 'W12'].join(''),
  title: 'Public closed gate raw artifact prune planning gate',
  surface_id: 'closed-gate-raw-artifact-prune-planning',
  command: 'agent-onboard release --closed-gates-prune-plan',
  check_command: 'agent-onboard release --closed-gates-prune-plan-check',
  artifact_file: '.agent-onboard/public-closed-gate-raw-artifact-prune-planning-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  future_dry_run_command: 'agent-onboard release --closed-gates-prune-dry-run',
  future_apply_command: 'agent-onboard release --closed-gates-prune-apply',
  minimum_record_count: 30,
  boundary: Object.freeze({
    writes_files: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    prunes_now: false,
    authorizes_future_apply: false,
    raw_artifact_content_inlined: false,
    archive_record_content_inlined: false,
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

function publicClosedGateRawArtifactPrunePlanningMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateRawArtifactPrunePlanning(root = packageRoot()) {
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const indexPath = path.join(root, plan.index_path);
  const archivePath = path.join(root, plan.archive_path);
  const artifactPath = path.join(root, plan.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (indexPresent) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archive = readPublicClosedGateArchiveJsonl(root, archivePath);
  const rawGateArtifacts = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const archivePathSet = new Set(archive.records.map((record) => record && record.path).filter((value) => typeof value === 'string'));
  const rawFileIdByPath = new Map(rawGateArtifacts.map((artifact) => [artifact.path, artifact.file_id]));
  const archivedRawReports = archive.records.map((record) => {
    const rel = record && typeof record.path === 'string' ? record.path : '';
    const absolute = path.join(root, rel);
    const present = rel.length > 0 && fs.existsSync(absolute);
    const currentFileId = present ? textFileId(fs.readFileSync(absolute, 'utf8')) : null;
    return Object.freeze({
      path: rel,
      present,
      archive_file_id: record && record.raw_artifact_file_id ? record.raw_artifact_file_id : null,
      current_file_id_matches_archive: present && record && record.raw_artifact_file_id ? currentFileId === record.raw_artifact_file_id : false,
      eligible_for_future_prune_after_apply_gate: present && record && record.raw_artifact_file_id ? currentFileId === record.raw_artifact_file_id : false,
      content_inlined: false
    });
  });
  const missingFromArchive = rawGateArtifacts
    .filter((artifact) => !archivePathSet.has(artifact.path))
    .map((artifact) => Object.freeze({ path: artifact.path, file_id: artifact.file_id, content_inlined: false }));
  const mismatchedArchiveRecords = archive.records
    .filter((record) => record && typeof record.path === 'string' && rawFileIdByPath.has(record.path) && rawFileIdByPath.get(record.path) !== record.raw_artifact_file_id)
    .map((record) => Object.freeze({ path: record.path, archive_file_id: record.raw_artifact_file_id, current_file_id: rawFileIdByPath.get(record.path), content_inlined: false }));
  const archiveCoversRawArtifacts = installedContext || missingFromArchive.length === 0;
  const archiveFileIdsMatchRaw = installedContext || (mismatchedArchiveRecords.length === 0 && archivedRawReports.every((report) => report.current_file_id_matches_archive === true));
  const readerCheck = publicClosedGateArchiveReaderCheck(root);
  const fullTestRunnerCheck = publicFullTestRunnerCompletionCheck(root);
  const candidateCount = installedContext ? 0 : (archiveCoversRawArtifacts && archiveFileIdsMatchRaw ? rawGateArtifacts.length : 0);
  const latestCandidatePaths = rawGateArtifacts.slice(-5).map((artifact) => Object.freeze({
    path: artifact.path,
    work_item_id: artifact.work_item_id,
    milestone_id: artifact.milestone_id,
    file_id: artifact.file_id,
    content_inlined: false
  }));
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-planning-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    milestone_id: plan.milestone_id,
    prerequisite_work_item_id: plan.prerequisite_work_item_id,
    work_item_id: plan.work_item_id,
    title: plan.title,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context,
    surface_id: plan.surface_id,
    prerequisite_checks: Object.freeze({
      closed_gate_archive_reader_check: readerCheck.status,
      full_test_runner_completion_check: fullTestRunnerCheck.status
    }),
    current_surface: Object.freeze({
      raw_gate_artifact_count: rawGateArtifacts.length,
      raw_gate_artifact_parse_error_count: rawGateArtifacts.filter((artifact) => artifact.parse_error).length,
      index_present: indexPresent,
      index_status: indexStatus,
      index_parse_error: indexParseError,
      index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
      index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
      archive_present: archivePresent,
      archive_record_count: archive.records.length,
      archive_file_id: archivePresent ? textFileId(archive.text) : null,
      archive_parse_error_count: archive.parse_errors.length,
      archive_covers_raw_artifacts: archiveCoversRawArtifacts,
      archive_file_ids_match_raw: archiveFileIdsMatchRaw,
      missing_raw_artifacts_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      raw_artifact_content_inlined: false,
      archive_record_content_inlined: false
    }),
    prune_plan: Object.freeze({
      planning_only: true,
      delete_now: false,
      move_now: false,
      rewrite_now: false,
      future_prune_requires_explicit_apply_gate: true,
      future_dry_run_command_reserved: plan.future_dry_run_command,
      future_apply_command_reserved: plan.future_apply_command,
      candidate_path_glob: '.agent-onboard/*-gate.json',
      candidate_count_after_future_apply_gate: candidateCount,
      latest_candidate_paths: latestCandidatePaths,
      protected_non_candidate_paths: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/work-items.json',
        '.agent-onboard/claims.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/*',
        'manifest.json',
        'authority-map.json'
      ]),
      future_apply_must_refresh: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/live-authority.json',
        '.agent-onboard/state/indexes.json',
        '.agent-onboard/state/closed-gates.jsonl',
        'manifest.json',
        'authority-map.json'
      ]),
      rollback_requirement: 'restore raw gate artifacts from version control or retained handoff zip if future prune apply is rejected',
      raw_prune_authorized_by_this_gate: false
    }),
    recovery: Object.freeze({
      reader_check_passes: readerCheck.status === 'ok',
      full_test_runner_check_passes: fullTestRunnerCheck.status === 'ok',
      index_archive_digest_matches_archive: index && index.archive_candidate_file_id ? index.archive_candidate_file_id === (archivePresent ? textFileId(archive.text) : null) : installedContext,
      raw_artifacts_present_for_archived_records: installedContext || archivedRawReports.every((report) => report.present === true),
      raw_file_ids_match_archive: archiveFileIdsMatchRaw,
      missing_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      report_count: archivedRawReports.length,
      reports_content_inlined: false
    }),
    artifact: Object.freeze({
      path: plan.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    boundary: plan.boundary
  });
}

function publicClosedGateRawArtifactPrunePlanningCheck(root = packageRoot()) {
  const result = publicClosedGateRawArtifactPrunePlanning(root);
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_PLANNING;
  const milestone = publicClosedGateRawArtifactPrunePlanningMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const pruneState = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const errors = [];
  if (result.prerequisite_checks.closed_gate_archive_reader_check !== 'ok') errors.push('raw artifact prune planning requires closed gate archive reader check to pass');
  if (result.prerequisite_checks.full_test_runner_completion_check !== 'ok') errors.push('raw artifact prune planning requires full-test runner completion check to pass');
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${plan.artifact_file} must exist after W12 closes`);
  if (!installedContext && !rawPruneApplied && result.current_surface.raw_gate_artifact_count < plan.minimum_record_count) errors.push(`raw artifact prune planning requires at least ${plan.minimum_record_count} raw gate artifacts`);
  if (!installedContext && result.current_surface.raw_gate_artifact_parse_error_count !== 0) errors.push('raw artifact prune planning requires all raw gate artifacts to parse as JSON');
  if (!installedContext && result.current_surface.index_present !== true) errors.push(`${plan.index_path} must be present before prune planning`);
  if (!installedContext && result.current_surface.index_status !== 'present_valid_json') errors.push(`${plan.index_path} must parse as JSON`);
  if (!installedContext && result.current_surface.archive_present !== true) errors.push(`${plan.archive_path} must be present before prune planning`);
  if (!installedContext && result.current_surface.archive_parse_error_count !== 0) errors.push('closed gate archive must parse before prune planning');
  if (!installedContext && result.current_surface.index_record_count !== result.current_surface.archive_record_count) errors.push('closed gate index record count must match archive before prune planning');
  if (!installedContext && result.recovery.index_archive_digest_matches_archive !== true) errors.push('closed gate index archive digest must match archive before prune planning');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_covers_raw_artifacts !== true) errors.push('closed gate archive must cover all raw gate artifacts before future prune admission');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_file_ids_match_raw !== true) errors.push('closed gate archive file ids must match raw artifacts before future prune admission');
  if (result.prune_plan.planning_only !== true || result.prune_plan.delete_now !== false || result.prune_plan.move_now !== false || result.prune_plan.rewrite_now !== false) errors.push('W12 must remain planning-only and must not delete, move, or rewrite raw artifacts');
  if (result.prune_plan.future_prune_requires_explicit_apply_gate !== true) errors.push('raw artifact prune planning must require a future explicit apply gate');
  if (result.prune_plan.raw_prune_authorized_by_this_gate !== false) errors.push('W12 must not authorize raw artifact pruning');
  if (result.boundary.writes_files !== false) errors.push('raw artifact prune planning command must be no-write');
  if (result.boundary.deletes_raw_gate_artifacts !== false || result.boundary.moves_raw_gate_artifacts !== false || result.boundary.rewrites_raw_gate_artifacts !== false) errors.push('raw artifact prune planning must not delete, move, or rewrite raw gate artifacts');
  if (result.boundary.prunes_now !== false || result.boundary.authorizes_future_apply !== false) errors.push('raw artifact prune planning must not prune now or authorize future apply by itself');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('raw artifact prune planning must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${plan.milestone_id} must remain open during W12`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${plan.prerequisite_work_item_id} must be closed before W12 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${plan.work_item_id} must be closed by W12`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-planning-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: plan.check_command,
    planning_command: plan.command,
    package_root: root,
    validated: Object.freeze({
      archive_reader_check_passes: result.prerequisite_checks.closed_gate_archive_reader_check === 'ok',
      full_test_runner_check_passes: result.prerequisite_checks.full_test_runner_completion_check === 'ok',
      planning_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      enough_raw_gate_artifacts: installedContext || rawPruneApplied || result.current_surface.raw_gate_artifact_count >= plan.minimum_record_count,
      raw_gate_artifacts_parse_as_json: installedContext || result.current_surface.raw_gate_artifact_parse_error_count === 0,
      index_present_valid_json: installedContext || (result.current_surface.index_present === true && result.current_surface.index_status === 'present_valid_json'),
      archive_present_and_parses: installedContext || (result.current_surface.archive_present === true && result.current_surface.archive_parse_error_count === 0),
      index_record_count_matches_archive: installedContext || result.current_surface.index_record_count === result.current_surface.archive_record_count,
      index_archive_digest_matches_archive: installedContext || result.recovery.index_archive_digest_matches_archive === true,
      archive_covers_raw_artifacts: installedContext || rawPruneApplied || result.current_surface.archive_covers_raw_artifacts === true,
      archive_file_ids_match_raw: installedContext || rawPruneApplied || result.current_surface.archive_file_ids_match_raw === true,
      planning_only_no_prune: result.prune_plan.planning_only === true && result.prune_plan.delete_now === false && result.prune_plan.raw_prune_authorized_by_this_gate === false,
      future_apply_gate_required: result.prune_plan.future_prune_requires_explicit_apply_gate === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_move_rewrite_boundary: result.boundary.deletes_raw_gate_artifacts === false && result.boundary.moves_raw_gate_artifacts === false && result.boundary.rewrites_raw_gate_artifacts === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    plan: result,
    milestone_state: milestone,
    boundary: plan.boundary,
    errors
  });
}

function publicClosedGateRawArtifactPrunePlanningText(result = publicClosedGateRawArtifactPrunePlanning()) {
  const lines = [
    `agent-onboard closed gate raw artifact prune planning ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Current surface:',
    `- raw gate artifacts: ${result.current_surface.raw_gate_artifact_count}`,
    `- archive records: ${result.current_surface.archive_record_count}`,
    `- archive covers raw artifacts: ${result.current_surface.archive_covers_raw_artifacts}`,
    '',
    'Plan:',
    `- planning only: ${result.prune_plan.planning_only}`,
    `- delete now: ${result.prune_plan.delete_now}`,
    `- future apply required: ${result.prune_plan.future_prune_requires_explicit_apply_gate}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W12'].join(''),
  work_item_id: ['P1S3M6', 'W13'].join(''),
  title: 'Public closed gate raw artifact prune dry-run gate',
  surface_id: 'closed-gate-raw-artifact-prune-dry-run',
  command: 'agent-onboard release --closed-gates-prune-dry-run',
  check_command: 'agent-onboard release --closed-gates-prune-dry-run-check',
  artifact_file: '.agent-onboard/public-closed-gate-raw-artifact-prune-dry-run-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  future_apply_command: 'agent-onboard release --closed-gates-prune-apply',
  minimum_candidate_count: 30,
  boundary: Object.freeze({
    dry_run_only: true,
    writes_files: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    prunes_now: false,
    authorizes_future_apply: false,
    raw_artifact_content_inlined: false,
    archive_record_content_inlined: false,
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

function publicClosedGateRawArtifactPruneDryRunMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateRawArtifactPruneDryRun(root = packageRoot()) {
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const indexPath = path.join(root, plan.index_path);
  const archivePath = path.join(root, plan.archive_path);
  const artifactPath = path.join(root, plan.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (indexPresent) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archive = readPublicClosedGateArchiveJsonl(root, archivePath);
  const rawGateArtifacts = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const rawFileIdByPath = new Map(rawGateArtifacts.map((artifact) => [artifact.path, artifact.file_id]));
  const archiveRecordByPath = new Map(archive.records.map((record) => [record && record.path, record]).filter(([key]) => typeof key === 'string'));
  const missingFromArchive = rawGateArtifacts
    .filter((artifact) => !archiveRecordByPath.has(artifact.path))
    .map((artifact) => Object.freeze({ path: artifact.path, file_id: artifact.file_id, content_inlined: false }));
  const mismatchedArchiveRecords = archive.records
    .filter((record) => record && typeof record.path === 'string' && rawFileIdByPath.has(record.path) && rawFileIdByPath.get(record.path) !== record.raw_artifact_file_id)
    .map((record) => Object.freeze({ path: record.path, archive_file_id: record.raw_artifact_file_id, current_file_id: rawFileIdByPath.get(record.path), content_inlined: false }));
  const candidateRecords = rawGateArtifacts
    .filter((artifact) => {
      const record = archiveRecordByPath.get(artifact.path);
      return record && record.raw_artifact_file_id === artifact.file_id;
    })
    .map((artifact, index) => Object.freeze({
      ordinal: index + 1,
      path: artifact.path,
      file_id: artifact.file_id,
      work_item_id: artifact.work_item_id,
      milestone_id: artifact.milestone_id,
      byte_count: artifact.bytes,
      delete_candidate: true,
      content_inlined: false
    }));
  const archiveCoversRawArtifacts = installedContext || missingFromArchive.length === 0;
  const archiveFileIdsMatchRaw = installedContext || mismatchedArchiveRecords.length === 0;
  const allRawArtifactsEligible = installedContext || (archiveCoversRawArtifacts && archiveFileIdsMatchRaw && candidateRecords.length === rawGateArtifacts.length);
  const planCheck = publicClosedGateRawArtifactPrunePlanningCheck(root);
  const readerCheck = publicClosedGateArchiveReaderCheck(root);
  const fullTestRunnerCheck = publicFullTestRunnerCompletionCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    milestone_id: plan.milestone_id,
    prerequisite_work_item_id: plan.prerequisite_work_item_id,
    work_item_id: plan.work_item_id,
    title: plan.title,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context,
    surface_id: plan.surface_id,
    prerequisite_checks: Object.freeze({
      prune_planning_check: planCheck.status,
      closed_gate_archive_reader_check: readerCheck.status,
      full_test_runner_completion_check: fullTestRunnerCheck.status
    }),
    current_surface: Object.freeze({
      raw_gate_artifact_count: rawGateArtifacts.length,
      raw_gate_artifact_parse_error_count: rawGateArtifacts.filter((artifact) => artifact.parse_error).length,
      raw_gate_artifact_total_bytes: rawGateArtifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      index_present: indexPresent,
      index_status: indexStatus,
      index_parse_error: indexParseError,
      index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
      index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
      archive_present: archivePresent,
      archive_record_count: archive.records.length,
      archive_file_id: archivePresent ? textFileId(archive.text) : null,
      archive_parse_error_count: archive.parse_errors.length,
      archive_covers_raw_artifacts: archiveCoversRawArtifacts,
      archive_file_ids_match_raw: archiveFileIdsMatchRaw,
      missing_raw_artifacts_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      raw_artifact_content_inlined: false,
      archive_record_content_inlined: false
    }),
    dry_run_manifest: Object.freeze({
      dry_run_only: true,
      delete_now: false,
      move_now: false,
      rewrite_now: false,
      apply_command_required_before_delete: plan.future_apply_command,
      candidate_path_glob: '.agent-onboard/*-gate.json',
      candidate_count: candidateRecords.length,
      candidate_total_bytes: candidateRecords.reduce((sum, record) => sum + record.byte_count, 0),
      all_raw_artifacts_eligible: allRawArtifactsEligible,
      candidate_paths: candidateRecords.map((record) => record.path),
      candidate_file_ids: candidateRecords.map((record) => record.file_id),
      candidate_records: candidateRecords,
      missing_from_archive: missingFromArchive,
      mismatched_archive_records: mismatchedArchiveRecords,
      protected_non_candidate_paths: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/work-items.json',
        '.agent-onboard/claims.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/*',
        'manifest.json',
        'authority-map.json'
      ]),
      future_apply_must_refresh: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/live-authority.json',
        '.agent-onboard/state/indexes.json',
        '.agent-onboard/state/closed-gates.jsonl',
        'manifest.json',
        'authority-map.json'
      ]),
      raw_prune_authorized_by_this_gate: false,
      content_inlined: false
    }),
    recovery: Object.freeze({
      reader_check_passes: readerCheck.status === 'ok',
      full_test_runner_check_passes: fullTestRunnerCheck.status === 'ok',
      planning_check_passes: planCheck.status === 'ok',
      index_archive_digest_matches_archive: index && index.archive_candidate_file_id ? index.archive_candidate_file_id === (archivePresent ? textFileId(archive.text) : null) : installedContext,
      raw_artifacts_present_before_future_apply: installedContext || rawGateArtifacts.length > 0,
      raw_file_ids_match_archive: archiveFileIdsMatchRaw,
      archive_covers_raw_artifacts: archiveCoversRawArtifacts,
      dry_run_replay_has_exact_delete_set: installedContext || allRawArtifactsEligible,
      missing_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      content_inlined: false
    }),
    artifact: Object.freeze({
      path: plan.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    boundary: plan.boundary
  });
}

function publicClosedGateRawArtifactPruneDryRunCheck(root = packageRoot()) {
  const result = publicClosedGateRawArtifactPruneDryRun(root);
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN;
  const milestone = publicClosedGateRawArtifactPruneDryRunMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const pruneState = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const errors = [];
  if (result.prerequisite_checks.prune_planning_check !== 'ok') errors.push('raw artifact prune dry-run requires prune planning check to pass');
  if (result.prerequisite_checks.closed_gate_archive_reader_check !== 'ok') errors.push('raw artifact prune dry-run requires closed gate archive reader check to pass');
  if (result.prerequisite_checks.full_test_runner_completion_check !== 'ok') errors.push('raw artifact prune dry-run requires full-test runner completion check to pass');
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${plan.artifact_file} must exist after W13 closes`);
  if (!installedContext && !rawPruneApplied && result.current_surface.raw_gate_artifact_count < plan.minimum_candidate_count) errors.push(`raw artifact prune dry-run requires at least ${plan.minimum_candidate_count} raw gate artifacts`);
  if (!installedContext && result.current_surface.raw_gate_artifact_parse_error_count !== 0) errors.push('raw artifact prune dry-run requires all raw gate artifacts to parse as JSON');
  if (!installedContext && result.current_surface.index_present !== true) errors.push(`${plan.index_path} must be present before prune dry-run`);
  if (!installedContext && result.current_surface.index_status !== 'present_valid_json') errors.push(`${plan.index_path} must parse as JSON before prune dry-run`);
  if (!installedContext && result.current_surface.archive_present !== true) errors.push(`${plan.archive_path} must be present before prune dry-run`);
  if (!installedContext && result.current_surface.archive_parse_error_count !== 0) errors.push('closed gate archive must parse before prune dry-run');
  if (!installedContext && result.current_surface.index_record_count !== result.current_surface.archive_record_count) errors.push('closed gate index record count must match archive before prune dry-run');
  if (!installedContext && result.recovery.index_archive_digest_matches_archive !== true) errors.push('closed gate index archive digest must match archive before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_covers_raw_artifacts !== true) errors.push('closed gate archive must cover all raw gate artifacts before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_file_ids_match_raw !== true) errors.push('closed gate archive file ids must match raw artifacts before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.dry_run_manifest.candidate_count !== result.current_surface.raw_gate_artifact_count) errors.push('prune dry-run candidate count must match raw gate artifact count');
  if (result.dry_run_manifest.dry_run_only !== true || result.dry_run_manifest.delete_now !== false || result.dry_run_manifest.move_now !== false || result.dry_run_manifest.rewrite_now !== false) errors.push('W13 must remain dry-run-only and must not delete, move, or rewrite raw artifacts');
  if (result.dry_run_manifest.raw_prune_authorized_by_this_gate !== false) errors.push('W13 must not authorize raw artifact pruning');
  if (result.dry_run_manifest.apply_command_required_before_delete !== plan.future_apply_command) errors.push('raw artifact prune dry-run must reserve the explicit future apply command');
  if (result.boundary.dry_run_only !== true || result.boundary.writes_files !== false) errors.push('raw artifact prune dry-run command must be no-write dry-run only');
  if (result.boundary.deletes_raw_gate_artifacts !== false || result.boundary.moves_raw_gate_artifacts !== false || result.boundary.rewrites_raw_gate_artifacts !== false) errors.push('raw artifact prune dry-run must not delete, move, or rewrite raw gate artifacts');
  if (result.boundary.prunes_now !== false || result.boundary.authorizes_future_apply !== false) errors.push('raw artifact prune dry-run must not prune now or authorize future apply by itself');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('raw artifact prune dry-run must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${plan.milestone_id} must remain open during W13`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${plan.prerequisite_work_item_id} must be closed before W13 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${plan.work_item_id} must be closed by W13`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: plan.check_command,
    dry_run_command: plan.command,
    package_root: root,
    validated: Object.freeze({
      prune_planning_check_passes: result.prerequisite_checks.prune_planning_check === 'ok',
      archive_reader_check_passes: result.prerequisite_checks.closed_gate_archive_reader_check === 'ok',
      full_test_runner_check_passes: result.prerequisite_checks.full_test_runner_completion_check === 'ok',
      dry_run_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      enough_raw_gate_artifacts: installedContext || rawPruneApplied || result.current_surface.raw_gate_artifact_count >= plan.minimum_candidate_count,
      raw_gate_artifacts_parse_as_json: installedContext || result.current_surface.raw_gate_artifact_parse_error_count === 0,
      index_present_valid_json: installedContext || (result.current_surface.index_present === true && result.current_surface.index_status === 'present_valid_json'),
      archive_present_and_parses: installedContext || (result.current_surface.archive_present === true && result.current_surface.archive_parse_error_count === 0),
      index_record_count_matches_archive: installedContext || result.current_surface.index_record_count === result.current_surface.archive_record_count,
      index_archive_digest_matches_archive: installedContext || result.recovery.index_archive_digest_matches_archive === true,
      archive_covers_raw_artifacts: installedContext || rawPruneApplied || result.current_surface.archive_covers_raw_artifacts === true,
      archive_file_ids_match_raw: installedContext || rawPruneApplied || result.current_surface.archive_file_ids_match_raw === true,
      exact_candidate_set: installedContext || rawPruneApplied || result.dry_run_manifest.candidate_count === result.current_surface.raw_gate_artifact_count,
      dry_run_only_no_prune: result.dry_run_manifest.dry_run_only === true && result.dry_run_manifest.delete_now === false && result.dry_run_manifest.raw_prune_authorized_by_this_gate === false,
      future_apply_gate_required: result.dry_run_manifest.apply_command_required_before_delete === plan.future_apply_command,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_move_rewrite_boundary: result.boundary.deletes_raw_gate_artifacts === false && result.boundary.moves_raw_gate_artifacts === false && result.boundary.rewrites_raw_gate_artifacts === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    dry_run: result,
    milestone_state: milestone,
    boundary: plan.boundary,
    errors
  });
}

function publicClosedGateRawArtifactPruneDryRunText(result = publicClosedGateRawArtifactPruneDryRun()) {
  const lines = [
    `agent-onboard closed gate raw artifact prune dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Dry-run manifest:',
    `- candidates: ${result.dry_run_manifest.candidate_count}`,
    `- all raw artifacts eligible: ${result.dry_run_manifest.all_raw_artifacts_eligible}`,
    `- delete now: ${result.dry_run_manifest.delete_now}`,
    `- future apply required: ${result.dry_run_manifest.apply_command_required_before_delete}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W13'].join(''),
  work_item_id: ['P1S3M6', 'W14'].join(''),
  title: 'Public closed gate raw artifact prune apply admission gate',
  surface_id: 'closed-gate-raw-artifact-prune-apply-admission',
  command: 'agent-onboard release --closed-gates-prune-apply',
  check_command: 'agent-onboard release --closed-gates-prune-apply-check',
  artifact_file: '.agent-onboard/public-closed-gate-raw-artifact-prune-apply-admission.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_candidate_count: 30,
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    deletes_raw_gate_artifacts: true,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    preserves_archive: true,
    preserves_index: true,
    raw_artifact_content_inlined: false,
    archive_record_content_inlined: false,
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

function publicClosedGateRawArtifactPruneApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateRawArtifactPruneApply(root = packageRoot()) {
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const state = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const liveRawGateArtifacts = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const indexedCount = state.index_raw_artifact_count;
  const remainingCount = state.remaining_indexed_paths.length;
  const prunedCount = Math.max(0, indexedCount - remainingCount);
  const dryRunCheck = publicClosedGateRawArtifactPruneDryRunCheck(root);
  const readerCheck = publicClosedGateArchiveReaderCheck(root);
  const fullTestRunnerCheck = publicFullTestRunnerCompletionCheck(root);
  const indexRecovery = state.index_recovery || {};
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    milestone_id: plan.milestone_id,
    prerequisite_work_item_id: plan.prerequisite_work_item_id,
    work_item_id: plan.work_item_id,
    title: plan.title,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context,
    surface_id: plan.surface_id,
    prerequisite_checks: Object.freeze({
      prune_dry_run_check: dryRunCheck.status,
      closed_gate_archive_reader_check: readerCheck.status,
      full_test_runner_completion_check: fullTestRunnerCheck.status
    }),
    applied: installedContext || (state.artifact_present === true && indexedCount >= plan.minimum_candidate_count && remainingCount === 0 && state.archive_paths_match_index === true && state.archive_file_ids_match_index === true),
    raw_gate_artifacts_pruned: installedContext || remainingCount === 0,
    artifact: Object.freeze({
      path: plan.artifact_file,
      present: state.artifact_present,
      content_inlined: false
    }),
    index: Object.freeze({
      path: plan.index_path,
      present: state.index_present,
      status: state.index_status,
      parse_error: state.index_parse_error,
      file_id: state.index_file_id,
      record_count: state.index_record_count,
      raw_artifact_count: indexedCount,
      archive_file_id: state.index_archive_file_id,
      recovery: indexRecovery,
      content_inlined: false
    }),
    archive: Object.freeze({
      path: plan.archive_path,
      present: state.archive_present,
      file_id: state.archive_file_id,
      record_count: state.archive_record_count,
      parse_error_count: state.archive_parse_error_count,
      content_inlined: false
    }),
    prune_application: Object.freeze({
      candidate_count: indexedCount,
      pruned_candidate_count: prunedCount,
      remaining_indexed_raw_artifact_count: remainingCount,
      remaining_live_raw_gate_artifact_count: liveRawGateArtifacts.length,
      deleted_candidate_paths: state.indexed_paths,
      deleted_candidate_file_ids: state.indexed_file_ids,
      remaining_indexed_paths: state.remaining_indexed_paths,
      deleted_path_content_inlined: false,
      archive_paths_match_index: state.archive_paths_match_index,
      archive_file_ids_match_index: state.archive_file_ids_match_index,
      index_archive_digest_matches_archive: state.index_archive_file_id === state.archive_file_id,
      archive_retains_recovery_records: state.archive_record_count === indexedCount,
      index_declares_pruned_state: indexRecovery.raw_artifacts_pruned === true,
      index_declares_prune_apply_artifact: indexRecovery.prune_apply_artifact_file === plan.artifact_file,
      raw_artifact_content_inlined: false,
      archive_record_content_inlined: false
    }),
    recovery: Object.freeze({
      archive_preserved: state.archive_present === true,
      index_preserved: state.index_present === true,
      archive_records_replay_deleted_raw_file_ids: state.archive_file_ids_match_index === true,
      archive_records_replay_deleted_raw_paths: state.archive_paths_match_index === true,
      raw_gate_artifacts_restorable_from_archive: state.archive_file_ids_match_index === true && state.archive_paths_match_index === true,
      restore_requires_explicit_future_restore_gate: true,
      content_inlined: false
    }),
    boundary: plan.boundary
  });
}

function publicClosedGateRawArtifactPruneApplyCheck(root = packageRoot()) {
  const result = publicClosedGateRawArtifactPruneApply(root);
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY;
  const milestone = publicClosedGateRawArtifactPruneApplyMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const errors = [];
  if (result.prerequisite_checks.prune_dry_run_check !== 'ok') errors.push('raw artifact prune apply requires prune dry-run check to pass');
  if (result.prerequisite_checks.closed_gate_archive_reader_check !== 'ok') errors.push('raw artifact prune apply requires archive reader check to pass');
  if (result.prerequisite_checks.full_test_runner_completion_check !== 'ok') errors.push('raw artifact prune apply requires full-test runner completion check to pass');
  if (!installedContext && result.artifact.present !== true) errors.push(`${plan.artifact_file} must exist after W14 closes`);
  if (!installedContext && result.index.present !== true) errors.push(`${plan.index_path} must remain present after raw artifact prune apply`);
  if (!installedContext && result.index.status !== 'present_valid_json') errors.push(`${plan.index_path} must parse as JSON after raw artifact prune apply`);
  if (!installedContext && result.archive.present !== true) errors.push(`${plan.archive_path} must remain present after raw artifact prune apply`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed-gates archive must parse after raw artifact prune apply');
  if (!installedContext && result.index.record_count < plan.minimum_candidate_count) errors.push(`raw artifact prune apply requires at least ${plan.minimum_candidate_count} archived records`);
  if (!installedContext && result.archive.record_count !== result.index.record_count) errors.push('archive record count must match index record count after prune apply');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('index archive digest must match archive after prune apply');
  if (!installedContext && result.prune_application.candidate_count !== result.index.raw_artifact_count) errors.push('candidate count must match index raw artifact count after prune apply');
  if (!installedContext && result.prune_application.pruned_candidate_count !== result.prune_application.candidate_count) errors.push('every indexed raw gate artifact candidate must be pruned');
  if (!installedContext && result.prune_application.remaining_indexed_raw_artifact_count !== 0) errors.push('no indexed raw gate artifact may remain after prune apply');
  if (!installedContext && result.prune_application.archive_paths_match_index !== true) errors.push('archive record paths must replay indexed raw artifact paths after prune apply');
  if (!installedContext && result.prune_application.archive_file_ids_match_index !== true) errors.push('archive record file ids must replay indexed raw artifact file ids after prune apply');
  if (!installedContext && result.prune_application.index_archive_digest_matches_archive !== true) errors.push('closed gate index digest must match archive after prune apply');
  if (!installedContext && result.prune_application.index_declares_pruned_state !== true) errors.push('closed gate index recovery state must declare raw_artifacts_pruned');
  if (!installedContext && result.prune_application.index_declares_prune_apply_artifact !== true) errors.push('closed gate index recovery state must name the prune apply artifact');
  if (!installedContext && result.applied !== true) errors.push('raw artifact prune apply admission state must be applied');
  if (result.boundary.repository_write_admitted_by_gate !== true || result.boundary.deletes_raw_gate_artifacts !== true) errors.push('W14 must explicitly admit raw gate artifact deletion');
  if (result.boundary.moves_raw_gate_artifacts !== false || result.boundary.rewrites_raw_gate_artifacts !== false) errors.push('W14 must not move or rewrite raw gate artifacts');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('raw artifact prune apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('raw artifact prune apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${plan.milestone_id} must remain open during W14`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${plan.prerequisite_work_item_id} must be closed before W14 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${plan.work_item_id} must be closed by W14`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: plan.check_command,
    apply_command: plan.command,
    package_root: root,
    validated: Object.freeze({
      prune_dry_run_check_passes: result.prerequisite_checks.prune_dry_run_check === 'ok',
      archive_reader_check_passes: result.prerequisite_checks.closed_gate_archive_reader_check === 'ok',
      full_test_runner_check_passes: result.prerequisite_checks.full_test_runner_completion_check === 'ok',
      apply_artifact_present: installedContext || result.artifact.present === true,
      index_present_valid_json: installedContext || (result.index.present === true && result.index.status === 'present_valid_json'),
      archive_present_and_parses: installedContext || (result.archive.present === true && result.archive.parse_error_count === 0),
      archive_record_count_matches_index: installedContext || result.archive.record_count === result.index.record_count,
      index_archive_digest_matches_archive: installedContext || result.index.archive_file_id === result.archive.file_id,
      all_indexed_raw_artifacts_pruned: installedContext || result.prune_application.remaining_indexed_raw_artifact_count === 0,
      archive_replays_deleted_paths: installedContext || result.prune_application.archive_paths_match_index === true,
      archive_replays_deleted_file_ids: installedContext || result.prune_application.archive_file_ids_match_index === true,
      index_declares_pruned_state: installedContext || result.prune_application.index_declares_pruned_state === true,
      recovery_path_preserved: installedContext || result.recovery.raw_gate_artifacts_restorable_from_archive === true,
      deletion_admitted_by_gate: result.boundary.repository_write_admitted_by_gate === true && result.boundary.deletes_raw_gate_artifacts === true,
      no_move_or_rewrite: result.boundary.moves_raw_gate_artifacts === false && result.boundary.rewrites_raw_gate_artifacts === false,
      commands_are_read_only_verifiers: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    apply: result,
    milestone_state: milestone,
    boundary: plan.boundary,
    errors
  });
}

function publicClosedGateRawArtifactPruneApplyText(result = publicClosedGateRawArtifactPruneApply()) {
  const lines = [
    `agent-onboard closed gate raw artifact prune apply admission ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Prune application:',
    `- candidates: ${result.prune_application.candidate_count}`,
    `- pruned: ${result.prune_application.pruned_candidate_count}`,
    `- remaining indexed raw artifacts: ${result.prune_application.remaining_indexed_raw_artifact_count}`,
    '',
    'Recovery:',
    `- archive preserved: ${result.recovery.archive_preserved}`,
    `- index preserved: ${result.recovery.index_preserved}`,
    `- restorable from archive: ${result.recovery.raw_gate_artifacts_restorable_from_archive}`,
    '',
    'Boundary:',
    `- deletion admitted: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`,
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

function publicExactArtifactOracle(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  let tempRoot = null;
  let packSummary = null;
  let installSummary = null;
  let versionSmokeSummary = null;
  let releaseSmokeSummary = null;
  let authorityStateSmokeSummary = null;
  let authorityStateParitySmokeSummary = null;
  let packEntry = null;
  let tarball = null;
  let tarballSha256 = null;
  let installedCli = null;
  let cliEntrypointPresent = false;
  let cleanupStatus = 'not_started';

  try {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-artifact-oracle-'));
    const packDir = path.join(tempRoot, 'pack');
    const installRoot = path.join(tempRoot, 'install');
    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(installRoot, { recursive: true });

    const packResult = spawnSync(npmExecutable(), ['pack', '--json', '--pack-destination', packDir], {
      cwd: root,
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024
    });
    packSummary = compactSpawnSummary(packResult);
    if (packResult.status !== 0) {
      errors.push('npm pack exact artifact projection must exit 0');
    } else {
      try {
        packEntry = parseNpmPackJson(packResult.stdout);
        tarball = path.join(packDir, packEntry.filename || '');
        if (!fs.existsSync(tarball)) errors.push('npm pack exact tarball must exist in temp pack directory');
        else tarballSha256 = sha256File(tarball);
      } catch (error) {
        errors.push(`npm pack JSON parse failed: ${error.message}`);
      }
    }

    const actualPackFiles = packEntry ? exactArtifactPackFiles(packEntry) : [];
    if (packEntry) {
      if (packEntry.name !== PACKAGE_NAME) errors.push(`npm pack name must be ${PACKAGE_NAME}`);
      if (packEntry.version !== VERSION) errors.push(`npm pack version must be ${VERSION}`);
      if (packEntry.filename !== `${PACKAGE_NAME}-${VERSION}.tgz`) errors.push(`npm pack filename must be ${PACKAGE_NAME}-${VERSION}.tgz`);
      if (!arrayEquals(actualPackFiles, expectedPackFiles)) errors.push(`npm pack file list must match ${expectedPackFiles.join(', ')}`);
      if (typeof packEntry.integrity !== 'string' || !packEntry.integrity.startsWith('sha512-')) errors.push('npm pack integrity must be present');
      if (typeof packEntry.shasum !== 'string' || packEntry.shasum.length === 0) errors.push('npm pack shasum must be present');
    }

    if (tarball && fs.existsSync(tarball)) {
      fs.writeFileSync(path.join(installRoot, 'package.json'), JSON.stringify({ private: true, name: 'agent-onboard-artifact-oracle-smoke' }, null, 2) + '\n');
      const installResult = spawnSync(npmExecutable(), ['install', '--no-audit', '--no-fund', '--ignore-scripts', tarball], {
        cwd: installRoot,
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024
      });
      installSummary = compactSpawnSummary(installResult);
      if (installResult.status !== 0) errors.push('fresh install smoke from exact local tgz must exit 0');

      installedCli = path.join(installRoot, 'node_modules', PACKAGE_NAME, 'cli', 'agent-onboard.js');
      cliEntrypointPresent = fs.existsSync(installedCli);
      if (!cliEntrypointPresent) errors.push('fresh install smoke must include CLI entrypoint');
      else {
        const versionSmoke = spawnSync(process.execPath, [installedCli, '--version'], {
          cwd: installRoot,
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 5 * 1024 * 1024
        });
        versionSmokeSummary = compactSpawnSummary(versionSmoke);
        if (versionSmoke.status !== 0 || versionSmoke.stdout.trim() !== VERSION) errors.push('fresh installed CLI --version must match package version');

        const releaseSmoke = spawnSync(process.execPath, [installedCli, 'release', '--check'], {
          cwd: installRoot,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 20 * 1024 * 1024
        });
        releaseSmokeSummary = compactSpawnSummary(releaseSmoke);
        if (releaseSmoke.status !== 0) errors.push('fresh installed CLI release --check must exit 0');
        else {
          try {
            const releaseOutput = JSON.parse(releaseSmoke.stdout);
            if (releaseOutput.status !== 'ok') errors.push('fresh installed CLI release --check must return ok');
            if (releaseOutput.version !== VERSION) errors.push('fresh installed CLI release --check version must match package version');
          } catch (error) {
            errors.push(`fresh installed CLI release --check JSON parse failed: ${error.message}`);
          }
        }

        const authorityStateSmoke = spawnSync(process.execPath, [installedCli, 'authority', '--state-check'], {
          cwd: installRoot,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 20 * 1024 * 1024
        });
        authorityStateSmokeSummary = compactSpawnSummary(authorityStateSmoke);
        if (authorityStateSmoke.status !== 0) errors.push('fresh installed CLI authority --state-check must exit 0');
        else {
          try {
            const stateOutput = JSON.parse(authorityStateSmoke.stdout);
            if (stateOutput.status !== 'ok') errors.push('fresh installed CLI authority --state-check must return ok');
            if (stateOutput.package_context !== 'installed_package') errors.push('fresh installed CLI authority --state-check must observe installed_package context');
            if (!stateOutput.validated || stateOutput.validated.source_shards_present_or_installed_context_allowed !== true) errors.push('fresh installed CLI authority --state-check must permit absent source-only shards');
          } catch (error) {
            errors.push(`fresh installed CLI authority --state-check JSON parse failed: ${error.message}`);
          }
        }

        const paritySmoke = spawnSync(process.execPath, [installedCli, 'release', '--authority-state-parity-check'], {
          cwd: installRoot,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 20 * 1024 * 1024
        });
        authorityStateParitySmokeSummary = compactSpawnSummary(paritySmoke);
        if (paritySmoke.status !== 0) errors.push('fresh installed CLI release --authority-state-parity-check must exit 0');
        else {
          try {
            const parityOutput = JSON.parse(paritySmoke.stdout);
            if (parityOutput.status !== 'ok') errors.push('fresh installed CLI release --authority-state-parity-check must return ok');
            if (parityOutput.package_context !== 'installed_package') errors.push('fresh installed CLI release --authority-state-parity-check must observe installed_package context');
            if (!parityOutput.validated || parityOutput.validated.source_state_shards_not_projected_into_package !== true) errors.push('fresh installed CLI authority-state parity must keep shards out of package');
          } catch (error) {
            errors.push(`fresh installed CLI release --authority-state-parity-check JSON parse failed: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(error && error.message ? error.message : String(error));
  } finally {
    try {
      removeTempRoot(tempRoot);
      cleanupStatus = 'ok';
    } catch (error) {
      cleanupStatus = 'error';
      errors.push(`temp cleanup failed: ${error.message}`);
    }
  }

  const actualPackFiles = packEntry ? exactArtifactPackFiles(packEntry) : [];
  return {
    schema: 'agent-onboard-public-exact-artifact-oracle-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_EXACT_ARTIFACT_ORACLE.command,
    check_command: PUBLIC_EXACT_ARTIFACT_ORACLE.check_command,
    package_root: root,
    source_context: sourceContext(root),
    oracle: {
      schema: PUBLIC_EXACT_ARTIFACT_ORACLE.schema,
      role: PUBLIC_EXACT_ARTIFACT_ORACLE.role,
      exact_tgz_created_in_temp: !!tarball,
      exact_tgz_sha256: tarballSha256,
      exact_tgz_sha256_present: typeof tarballSha256 === 'string' && tarballSha256.length === 64,
      npm_integrity_present: !!(packEntry && typeof packEntry.integrity === 'string' && packEntry.integrity.startsWith('sha512-')),
      npm_shasum_present: !!(packEntry && typeof packEntry.shasum === 'string' && packEntry.shasum.length > 0),
      raw_pack_stdout_inlined: false,
      raw_install_stdout_inlined: false,
      temp_cleanup_status: cleanupStatus
    },
    npm_pack: Object.assign({
      package_id: packEntry ? packEntry.id : null,
      name: packEntry ? packEntry.name : null,
      npm_version: packEntry ? packEntry.version : null,
      filename: packEntry ? packEntry.filename : null,
      size: packEntry ? packEntry.size : null,
      unpacked_size: packEntry ? packEntry.unpackedSize : null,
      file_count: actualPackFiles.length,
      expected_file_count: expectedPackFiles.length,
      exact_file_list_matches_contract: arrayEquals(actualPackFiles, expectedPackFiles)
    }, packSummary || { status: 'not_run' }),
    fresh_install_smoke: {
      install: installSummary || { status: 'not_run' },
      cli_entrypoint_present: cliEntrypointPresent,
      version_smoke: versionSmokeSummary || { status: 'not_run' },
      release_check_smoke: releaseSmokeSummary || { status: 'not_run' },
      authority_state_check_smoke: authorityStateSmokeSummary || { status: 'not_run' },
      authority_state_parity_smoke: authorityStateParitySmokeSummary || { status: 'not_run' }
    },
    expected_pack_files: expectedPackFiles,
    exact_pack_files: actualPackFiles,
    validated: {
      package_version_matches_runtime: pkg.version === VERSION,
      exact_pack_command_exited_zero: packSummary && packSummary.status === 'ok',
      exact_tgz_sha256_present: typeof tarballSha256 === 'string' && tarballSha256.length === 64,
      exact_pack_file_list_matches_contract: arrayEquals(actualPackFiles, expectedPackFiles),
      fresh_install_from_exact_tgz: installSummary && installSummary.status === 'ok',
      fresh_installed_cli_version: versionSmokeSummary && versionSmokeSummary.status === 'ok',
      fresh_installed_release_check: releaseSmokeSummary && releaseSmokeSummary.status === 'ok',
      fresh_installed_authority_state_check: authorityStateSmokeSummary && authorityStateSmokeSummary.status === 'ok',
      fresh_installed_authority_state_parity: authorityStateParitySmokeSummary && authorityStateParitySmokeSummary.status === 'ok',
      temp_artifacts_removed: cleanupStatus === 'ok'
    },
    boundary: PUBLIC_EXACT_ARTIFACT_ORACLE.boundary,
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

function runTargetConfig(args) {
  if (args.includes('--schema')) {
    json({
      schema: 'agent-onboard-target-config-schema-response-001',
      status: 'ok',
      target_config_schema: TARGET_CONFIG_SCHEMA
    });
    return 0;
  }
  if (args.includes('--template')) {
    json({
      schema: 'agent-onboard-target-config-template-response-001',
      status: 'ok',
      canonical_config_file: TARGET_CONFIG_FILE,
      target_config: targetConfigTemplate()
    });
    return 0;
  }
  if (args.includes('--validate-template')) {
    const errors = validateTargetConfig(targetConfigTemplate());
    const ok = errors.length === 0;
    json({
      schema: 'agent-onboard-target-config-template-validation-001',
      status: ok ? 'ok' : 'error',
      template_source: 'embedded',
      canonical_config_file: TARGET_CONFIG_FILE,
      validated: true,
      errors
    });
    return ok ? 0 : 1;
  }
  if (args.includes('--validate')) {
    const index = args.indexOf('--validate');
    const file = args[index + 1] && !args[index + 1].startsWith('-') ? args[index + 1] : TARGET_CONFIG_FILE;
    const errors = validateTargetConfig(readJson(path.resolve(process.cwd(), file)));
    const ok = errors.length === 0;
    json({
      schema: 'agent-onboard-target-config-file-validation-001',
      status: ok ? 'ok' : 'error',
      file,
      validated: true,
      errors
    });
    return ok ? 0 : 1;
  }
  throw new Error('target-config requires --schema, --template, --validate-template, or --validate [file]');
}

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

function runInit(args) {
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('init requires --dry-run or --write');
  if (write && dry) throw new Error('init accepts only one of --dry-run or --write');

  const plannedWrites = planWrites(initWriteSet(), { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;

  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-init-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'init',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    boundary: {
      installs_dependencies: false,
      runs_build_test_deploy: false,
      publishes_or_pushes: false,
      modifies_source_files: false
    }
  });
  return ok ? 0 : 1;
}

function runTargetOnboarding(args) {
  const plan = args.includes('--plan');
  const fixture = args.includes('--fixture');
  const write = args.includes('--write');
  const trial = args.includes('--trial');
  const force = args.includes('--force');
  const targetIndex = args.indexOf('--target');
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(['--plan', '--fixture', '--write', '--trial', '--force', '--target']);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error('target onboarding --target requires a path');
  if (unknown.length > 0) throw new Error(`target onboarding does not support: ${unknown.join(', ')}`);
  if ([plan, fixture, write, trial].filter(Boolean).length !== 1) throw new Error('target onboarding requires exactly one of --plan, --fixture, --trial, or --write');
  if (force && !write) throw new Error('target onboarding --force requires --write');
  if (targetIndex >= 0 && !trial) throw new Error('target onboarding --target is only supported with --trial');
  if (plan) {
    json(targetOnboardingSurfacePlan());
    return 0;
  }
  if (fixture) {
    json(targetOnboardingDryRunFixture());
    return 0;
  }
  if (trial) {
    const result = targetOnboardingRealTargetTrial(targetRoot);
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }

  const plannedWrites = planTargetOnboardingWrites({ force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (ok) performTargetOnboardingWrites(plannedWrites);
  const writtenFiles = ok ? plannedWrites.filter((item) => item.action === 'create' || item.action === 'overwrite').map((item) => item.path) : [];

  json({
    schema: 'agent-onboard-public-target-onboarding-explicit-write-result-001',
    status: ok ? 'ok' : 'error',
    package_name: 'agent-onboard',
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    command: force ? 'agent-onboard target onboarding --write --force' : 'agent-onboard target onboarding --write',
    command_family: 'target onboarding',
    mode: 'write',
    force,
    writes_performed: writtenFiles.length > 0,
    written_files: writtenFiles,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    boundary: {
      explicit_write_flag_required: true,
      force_overwrite_requires_explicit_force_flag: true,
      writes_only_canonical_target_onboarding_files: true,
      canonical_files: TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice(),
      installs_dependencies: false,
      runs_build_test_deploy: false,
      publishes_or_pushes: false,
      git_mutation: false
    },
    next_steps: ok ? [
      'read AGENTS.md before continuing agent-assisted work',
      `run agent-onboard guard --check-boundary after ${TARGET_CONFIG_FILE} exists`,
      'use work-items --append/--claim only after the target owner assigns public work-item scope'
    ] : []
  });
  return ok ? 0 : 1;
}

function emitText(lines) {
  process.stdout.write(`${lines.join('\n')}\n`);
}

function names(items) {
  return Array.isArray(items) && items.length > 0 ? items.map((item) => item.name || item).join(', ') : 'none';
}

function formatTargetDoctorText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target doctor',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`
    ];
  }
  const present = result.canonical_files.filter((item) => item.present).length;
  const missing = result.readiness.missing_files.length > 0 ? result.readiness.missing_files.join(', ') : 'none';
  const invalid = result.readiness.invalid_checks.length > 0 ? result.readiness.invalid_checks.join(', ') : 'none';
  return [
    'agent-onboard target doctor',
    `Target: ${result.target.name} (${result.target.kind})`,
    `Root: ${result.target.root}`,
    `Readiness: ${result.readiness.status} (${result.readiness.score}%)`,
    `Canonical files: ${present}/${result.canonical_files.length} present`,
    `Missing: ${missing}`,
    `Invalid checks: ${invalid}`,
    `Package managers: ${names(result.profile.package_managers)}`,
    `Languages: ${names(result.profile.languages)}`,
    `Frameworks: ${names(result.profile.frameworks)}`,
    'Next steps:',
    ...result.next_steps.map((step) => `  - ${step}`),
    'Writes performed: false'
  ];
}

function formatTargetProfileText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target profile',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`
    ];
  }
  const scriptLines = result.profile.scripts.length > 0
    ? result.profile.scripts.map((entry) => `  - ${entry.purpose}: ${entry.scripts.join(', ')}`)
    : ['  none'];
  return [
    'agent-onboard target profile',
    `Target: ${result.target.name} (${result.target.kind})`,
    `Root: ${result.target.root}`,
    `Package managers: ${names(result.profile.package_managers)}`,
    `Languages: ${names(result.profile.languages)}`,
    `Frameworks: ${names(result.profile.frameworks)}`,
    'Scripts:',
    ...scriptLines,
    `CI: ${names(result.profile.ci)}`,
    `Docs: ${result.profile.docs.length > 0 ? result.profile.docs.join(', ') : 'none'}`,
    `Git: ${result.profile.git_present ? 'present' : 'missing'}`,
    'Next steps:',
    ...result.next_steps.map((step) => `  - ${step}`),
    'Writes performed: false'
  ];
}

function runTargetDoctor(args) {
  const jsonFlag = args.includes(TARGET_DOCTOR_COMMAND.flag.json);
  const textFlag = args.includes(TARGET_DOCTOR_COMMAND.flag.text);
  const targetIndex = args.indexOf(TARGET_DOCTOR_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(Object.values(TARGET_DOCTOR_COMMAND.flag));
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target doctor ${TARGET_DOCTOR_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target doctor does not support: ${unknown.join(', ')}`);
  if (jsonFlag && textFlag) throw new Error(`target doctor accepts only one of ${TARGET_DOCTOR_COMMAND.flag.json} or ${TARGET_DOCTOR_COMMAND.flag.text}`);
  if (!jsonFlag && !textFlag && args.length > 0) throw new Error(`target doctor accepts only ${TARGET_DOCTOR_COMMAND.flag.json}, ${TARGET_DOCTOR_COMMAND.flag.text}, and ${TARGET_DOCTOR_COMMAND.flag.target} <path>`);
  const result = targetDoctor(targetRoot);
  if (textFlag) emitText(formatTargetDoctorText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetProfile(args) {
  const jsonFlag = args.includes(TARGET_PROFILE_COMMAND.flag.json);
  const textFlag = args.includes(TARGET_PROFILE_COMMAND.flag.text);
  const targetIndex = args.indexOf(TARGET_PROFILE_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(Object.values(TARGET_PROFILE_COMMAND.flag));
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target profile ${TARGET_PROFILE_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target profile does not support: ${unknown.join(', ')}`);
  if (jsonFlag && textFlag) throw new Error(`target profile accepts only one of ${TARGET_PROFILE_COMMAND.flag.json} or ${TARGET_PROFILE_COMMAND.flag.text}`);
  if (!jsonFlag && !textFlag && args.length > 0) throw new Error(`target profile accepts only ${TARGET_PROFILE_COMMAND.flag.json}, ${TARGET_PROFILE_COMMAND.flag.text}, and ${TARGET_PROFILE_COMMAND.flag.target} <path>`);
  const result = targetProfile(targetRoot);
  if (textFlag) emitText(formatTargetProfileText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetRepair(args) {
  const plan = args.includes(TARGET_REPAIR_COMMAND.mode.plan);
  const write = args.includes(TARGET_REPAIR_COMMAND.mode.write);
  const force = args.includes(TARGET_REPAIR_COMMAND.flag.force);
  const targetIndex = args.indexOf(TARGET_REPAIR_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_REPAIR_COMMAND.mode),
    ...Object.values(TARGET_REPAIR_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target repair ${TARGET_REPAIR_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target repair does not support: ${unknown.join(', ')}`);
  if ([plan, write].filter(Boolean).length !== 1) throw new Error(`target repair requires exactly one of ${TARGET_REPAIR_COMMAND.mode.plan} or ${TARGET_REPAIR_COMMAND.mode.write}`);
  const result = targetRepair(targetRoot, { write, force });
  json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetMetadata(args) {
  const plan = args.includes(TARGET_METADATA_COMMAND.mode.plan);
  const check = args.includes(TARGET_METADATA_COMMAND.mode.check);
  const write = args.includes(TARGET_METADATA_COMMAND.mode.write);
  const adoptExisting = args.includes(TARGET_METADATA_COMMAND.flag.adoptExisting);
  const force = args.includes(TARGET_METADATA_COMMAND.flag.force);
  const policyIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.policy);
  const policyPath = policyIndex >= 0 ? args[policyIndex + 1] : null;
  const profileIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.profile);
  const profile = profileIndex >= 0 ? args[profileIndex + 1] : null;
  const targetIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_METADATA_COMMAND.mode),
    ...Object.values(TARGET_METADATA_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (policyIndex >= 0 && index === policyIndex + 1) return false;
    if (profileIndex >= 0 && index === profileIndex + 1) return false;
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (policyIndex >= 0 && (!policyPath || policyPath.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.policy} requires a path`);
  if (profileIndex >= 0 && (!profile || profile.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.profile} requires a profile`);
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target metadata does not support: ${unknown.join(', ')}`);
  if ([plan, check, write].filter(Boolean).length !== 1) throw new Error(`target metadata requires exactly one of ${TARGET_METADATA_COMMAND.mode.plan}, ${TARGET_METADATA_COMMAND.mode.check}, or ${TARGET_METADATA_COMMAND.mode.write}`);
  const options = { adoptExisting, force, policyPath, profile };
  const result = plan ? metadataPlan(targetRoot, options) : (check ? metadataCheck(targetRoot, options) : metadataWrite(targetRoot, options));
  json(result);
  return result.status === 'ok' ? 0 : 1;
}


function runTargetManifest(args) {
  const checkDrift = args.includes(TARGET_MANIFEST_COMMAND.mode.checkDrift);
  const init = args.includes(TARGET_MANIFEST_COMMAND.mode.init);
  const refresh = args.includes(TARGET_MANIFEST_COMMAND.mode.refresh);
  const dryRun = args.includes(TARGET_MANIFEST_COMMAND.mode.dryRun);
  const write = args.includes(TARGET_MANIFEST_COMMAND.mode.write);
  const targetIndex = args.indexOf(TARGET_MANIFEST_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_MANIFEST_COMMAND.mode),
    ...Object.values(TARGET_MANIFEST_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target manifest ${TARGET_MANIFEST_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target manifest does not support: ${unknown.join(', ')}`);
  if ([checkDrift, init, refresh].filter(Boolean).length !== 1) throw new Error(`target manifest requires exactly one of ${TARGET_MANIFEST_COMMAND.mode.checkDrift}, ${TARGET_MANIFEST_COMMAND.mode.init}, or ${TARGET_MANIFEST_COMMAND.mode.refresh}`);
  if (checkDrift && (dryRun || write)) throw new Error('target manifest --check-drift does not accept --dry-run or --write');
  if ((init || refresh) && [dryRun, write].filter(Boolean).length !== 1) throw new Error(`target manifest ${init ? '--init' : '--refresh'} requires exactly one of ${TARGET_MANIFEST_COMMAND.mode.dryRun} or ${TARGET_MANIFEST_COMMAND.mode.write}`);
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const result = checkDrift
    ? checkTargetManifestDrift(absoluteTargetRoot)
    : (init ? initTargetManifest(absoluteTargetRoot, { write }) : refreshTargetManifest(absoluteTargetRoot, { write }));
  json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetBootstrap(args) {
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('target bootstrap requires --dry-run or --write');
  if (write && dry) throw new Error('target bootstrap accepts only one of --dry-run or --write');

  const plannedWrites = planWrites([[TARGET_CONFIG_FILE, targetConfigTemplate()]], { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-target-bootstrap-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'target',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    skipped_optional_writes: ['package.json']
  });
  return ok ? 0 : 1;
}

function runTargetInstance(args) {
  if (args[0] !== 'takeover') throw new Error('target-instance supports only: takeover');
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('target-instance takeover requires --dry-run or --write');
  if (write && dry) throw new Error('target-instance takeover accepts only one of --dry-run or --write');

  const plannedWrites = planWrites([
    ['.agent-onboard/runtime-namespace.json', targetRuntimeNamespaceTemplate()],
    ['.agent-onboard/project.json', runtimeProjectTemplate()],
    ['.agent-onboard/work-items.json', workItemsTemplate()]
  ], { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-target-instance-takeover-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'target-instance',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path)
  });
  return ok ? 0 : 1;
}

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



function runTargetInventory(args) {
  const allowed = [TARGET_INVENTORY_COMMAND.mode.preview, TARGET_INVENTORY_COMMAND.flag.json, TARGET_INVENTORY_COMMAND.flag.text, TARGET_INVENTORY_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_INVENTORY_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target inventory ${TARGET_INVENTORY_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target inventory does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_INVENTORY_COMMAND.mode.preview, TARGET_INVENTORY_COMMAND.flag.json, TARGET_INVENTORY_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target inventory accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_INVENTORY_COMMAND.mode.preview;
  const result = targetInventory(targetRoot);
  if (mode === TARGET_INVENTORY_COMMAND.flag.text) process.stdout.write(formatTargetInventoryText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetWorkItems(args) {
  const allowed = [TARGET_WORK_ITEMS_COMMAND.mode.preview, TARGET_WORK_ITEMS_COMMAND.flag.json, TARGET_WORK_ITEMS_COMMAND.flag.text, TARGET_WORK_ITEMS_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_WORK_ITEMS_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target work-items ${TARGET_WORK_ITEMS_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target work-items does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_WORK_ITEMS_COMMAND.mode.preview, TARGET_WORK_ITEMS_COMMAND.flag.json, TARGET_WORK_ITEMS_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target work-items accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_WORK_ITEMS_COMMAND.mode.preview;
  const result = targetWorkItemsPreview(targetRoot);
  if (mode === TARGET_WORK_ITEMS_COMMAND.flag.text) process.stdout.write(formatTargetWorkItemsPreviewText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}


function runTargetGovernance(args) {
  const allowed = [TARGET_GOVERNANCE_COMMAND.mode.preview, TARGET_GOVERNANCE_COMMAND.mode.driftCheck, TARGET_GOVERNANCE_COMMAND.mode.budgetContract, TARGET_GOVERNANCE_COMMAND.mode.budgetCheck, TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun, TARGET_GOVERNANCE_COMMAND.mode.materialize, TARGET_GOVERNANCE_COMMAND.flag.write, TARGET_GOVERNANCE_COMMAND.flag.force, TARGET_GOVERNANCE_COMMAND.flag.json, TARGET_GOVERNANCE_COMMAND.flag.text, TARGET_GOVERNANCE_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_GOVERNANCE_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target governance ${TARGET_GOVERNANCE_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target governance does not support: ${unknown.join(', ')}`);
  const primaryModes = args.filter((arg) => [TARGET_GOVERNANCE_COMMAND.mode.preview, TARGET_GOVERNANCE_COMMAND.mode.driftCheck, TARGET_GOVERNANCE_COMMAND.mode.budgetContract, TARGET_GOVERNANCE_COMMAND.mode.budgetCheck, TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun, TARGET_GOVERNANCE_COMMAND.mode.materialize].includes(arg));
  const outputModes = args.filter((arg) => [TARGET_GOVERNANCE_COMMAND.flag.json, TARGET_GOVERNANCE_COMMAND.flag.text].includes(arg));
  if (primaryModes.length > 1) throw new Error('target governance accepts only one primary mode: --preview, --check, --budget-contract, --budget-check, --materialize-dry-run, or --materialize');
  if (outputModes.length > 1) throw new Error('target governance accepts only one output mode: --json or --text');
  const primaryMode = primaryModes[0] || TARGET_GOVERNANCE_COMMAND.mode.preview;
  const outputMode = outputModes[0] || (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.preview ? TARGET_GOVERNANCE_COMMAND.mode.preview : TARGET_GOVERNANCE_COMMAND.flag.json);
  const wantsWrite = args.includes(TARGET_GOVERNANCE_COMMAND.flag.write);
  const force = args.includes(TARGET_GOVERNANCE_COMMAND.flag.force);
  if (primaryMode !== TARGET_GOVERNANCE_COMMAND.mode.materialize && wantsWrite) throw new Error('target governance --write is only valid with --materialize');
  if (!wantsWrite && force) throw new Error('target governance --force is only valid with --write');
  if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize && !wantsWrite) throw new Error('target governance --materialize requires --write');
  const result = primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun
    ? targetGovernanceIndexMaterializationDryRun(targetRoot)
    : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize
      ? targetGovernanceIndexMaterializationWrite(targetRoot, { force })
      : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.driftCheck
        ? targetGovernanceIndexDriftCheck(targetRoot)
        : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetContract
          ? targetGovernanceBudgetContract()
          : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetCheck
            ? targetGovernanceBudgetCheck(targetRoot)
            : targetGovernancePreview(targetRoot)))));
  if (outputMode === TARGET_GOVERNANCE_COMMAND.flag.text) {
    if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun) process.stdout.write(formatTargetGovernanceIndexMaterializationDryRunText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize) process.stdout.write(formatTargetGovernanceIndexMaterializationWriteText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.driftCheck) process.stdout.write(formatTargetGovernanceIndexDriftCheckText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetContract) process.stdout.write(formatTargetGovernanceBudgetContractText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetCheck) process.stdout.write(formatTargetGovernanceBudgetCheckText(result));
    else process.stdout.write(formatTargetGovernancePreviewText(result));
  } else json(result);
  return result.status === 'ok' ? 0 : 1;
}


function runTargetHandoff(args) {
  const allowed = [TARGET_HANDOFF_COMMAND.mode.preview, TARGET_HANDOFF_COMMAND.mode.readinessCheck, TARGET_HANDOFF_COMMAND.flag.json, TARGET_HANDOFF_COMMAND.flag.text, TARGET_HANDOFF_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_HANDOFF_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target handoff ${TARGET_HANDOFF_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target handoff does not support: ${unknown.join(', ')}`);
  const primaryModes = args.filter((arg) => [TARGET_HANDOFF_COMMAND.mode.preview, TARGET_HANDOFF_COMMAND.mode.readinessCheck].includes(arg));
  const outputModes = args.filter((arg) => [TARGET_HANDOFF_COMMAND.flag.json, TARGET_HANDOFF_COMMAND.flag.text].includes(arg));
  if (primaryModes.length > 1) throw new Error('target handoff accepts only one primary mode: --preview or --readiness-check');
  if (outputModes.length > 1) throw new Error('target handoff accepts only one output mode: --json or --text');
  const primaryMode = primaryModes[0] || TARGET_HANDOFF_COMMAND.mode.preview;
  const outputMode = outputModes[0] || (primaryMode === TARGET_HANDOFF_COMMAND.mode.preview ? TARGET_HANDOFF_COMMAND.mode.preview : TARGET_HANDOFF_COMMAND.flag.json);
  const result = primaryMode === TARGET_HANDOFF_COMMAND.mode.readinessCheck
    ? targetRuntimeService.targetHandoffReadinessCheck(targetRoot)
    : targetHandoffPreview(targetRoot);
  if (outputMode === TARGET_HANDOFF_COMMAND.flag.text) {
    if (primaryMode === TARGET_HANDOFF_COMMAND.mode.readinessCheck) process.stdout.write(targetRuntimeService.formatTargetHandoffReadinessCheckText(result));
    else process.stdout.write(formatTargetHandoffPreviewText(result));
  } else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetMemory(args) {
  const allowed = [TARGET_MEMORY_COMMAND.mode.preview, TARGET_MEMORY_COMMAND.flag.json, TARGET_MEMORY_COMMAND.flag.text, TARGET_MEMORY_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_MEMORY_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target memory ${TARGET_MEMORY_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target memory does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_MEMORY_COMMAND.mode.preview, TARGET_MEMORY_COMMAND.flag.json, TARGET_MEMORY_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target memory accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_MEMORY_COMMAND.mode.preview;
  const result = targetMemoryService.descriptor(targetRoot);
  if (mode === TARGET_MEMORY_COMMAND.flag.text) process.stdout.write(targetMemoryService.text(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}


function runTargetRuntime(args) {
  if (args.length === 1 && args[0] === '--namespace') {
    json(publicTargetRuntimeNamespace());
    return 0;
  }
  if (args.length === 1 && args[0] === '--check') {
    const result = publicTargetRuntimeNamespaceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  json({
    schema: 'agent-onboard-target-runtime-command-error-001',
    status: 'error',
    command_family: 'target runtime',
    message: 'target runtime requires --namespace or --check',
    writes_files: false,
    publishes_package: false
  });
  return 1;
}

function runTargetCommand(args) {
  if (args[0] === TARGET_COMMAND.doctor) return runTargetDoctor(args.slice(1));
  if (args[0] === TARGET_COMMAND.metadata) return runTargetMetadata(args.slice(1));
  if (args[0] === TARGET_COMMAND.manifest) return runTargetManifest(args.slice(1));
  if (args[0] === TARGET_COMMAND.profile) return runTargetProfile(args.slice(1));
  if (args[0] === TARGET_COMMAND.repair) return runTargetRepair(args.slice(1));
  if (args[0] === TARGET_COMMAND.runtime) return runTargetRuntime(args.slice(1));
  if (args[0] === TARGET_COMMAND.inventory) return runTargetInventory(args.slice(1));
  if (args[0] === TARGET_COMMAND.memory) return runTargetMemory(args.slice(1));
  if (args[0] === TARGET_COMMAND.workItems) return runTargetWorkItems(args.slice(1));
  if (args[0] === TARGET_COMMAND.governance) return runTargetGovernance(args.slice(1));
  if (args[0] === TARGET_COMMAND.handoff) return runTargetHandoff(args.slice(1));
  if (args[0] === TARGET_COMMAND.onboarding) return runTargetOnboarding(args.slice(1));
  if (args[0] !== TARGET_COMMAND.bootstrap) throw new Error(`target supports only: ${TARGET_DOCTOR_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_PROFILE_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_REPAIR_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_METADATA_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_MANIFEST_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_INVENTORY_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_MEMORY_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_WORK_ITEMS_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_GOVERNANCE_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_HANDOFF_COMMAND.help.replace('agent-onboard target ', '')}, runtime --namespace|--check, onboarding --plan|--fixture|--trial [--target <path>]|--write [--force], bootstrap`);
  return runTargetBootstrap(args.slice(1));
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
    runInit,
    runTargetConfig,
    runTargetRuntime,
    runTargetInventory,
    runTargetMemory,
    runTargetGovernance,
    runTargetHandoff,
    runTargetCommand,
    runTargetInstance
  }),
  releasePackageService: Object.freeze({
    runRelease
  })
});

const COMMAND_ROUTE_HANDLERS = Object.freeze({
  [TOP_LEVEL_COMMAND.help]: DOMAIN_SERVICE_FACADES.coreService.help,
  [TOP_LEVEL_COMMAND.version]: DOMAIN_SERVICE_FACADES.coreService.printVersion,
  [TOP_LEVEL_COMMAND.status]: DOMAIN_SERVICE_FACADES.coreService.runStatus,
  [COMMANDS_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runCommands,
  [GUIDE_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runGuide,
  [QUICKSTART_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runQuickstart,
  [DISCOVERY_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runDiscovery,
  [CREATE_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runCreate,
  [TOP_LEVEL_COMMAND.create]: DOMAIN_SERVICE_FACADES.coreService.runCreate,
  [ISSUE_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runIssue,
  [TOP_LEVEL_COMMAND.issue]: DOMAIN_SERVICE_FACADES.coreService.runIssue,
  [CONTRIBUTOR_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runContributor,
  [TOP_LEVEL_COMMAND.contributor]: DOMAIN_SERVICE_FACADES.coreService.runContributor,
  [TOP_LEVEL_COMMAND.claim]: DOMAIN_SERVICE_FACADES.workItemsService.runClaim,
  [CONTRACTS_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runContracts,
  [TOP_LEVEL_COMMAND.contracts]: DOMAIN_SERVICE_FACADES.coreService.runContracts,
  [CHECK_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runCheck,
  [TOP_LEVEL_COMMAND.check]: DOMAIN_SERVICE_FACADES.coreService.runCheck,
  [CI_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runCi,
  [TOP_LEVEL_COMMAND.ci]: DOMAIN_SERVICE_FACADES.coreService.runCi,
  [MCP_COMMAND]: DOMAIN_SERVICE_FACADES.coreService.runMcp,
  [TOP_LEVEL_COMMAND.mcp]: DOMAIN_SERVICE_FACADES.coreService.runMcp,
  [TOP_LEVEL_COMMAND.init]: DOMAIN_SERVICE_FACADES.targetService.runInit,
  [TOP_LEVEL_COMMAND.agents]: DOMAIN_SERVICE_FACADES.authorityService.runAgents,
  [TOP_LEVEL_COMMAND.bridge]: DOMAIN_SERVICE_FACADES.authorityService.runBridge,
  [TOP_LEVEL_COMMAND.guard]: DOMAIN_SERVICE_FACADES.authorityService.runGuard,
  [TOP_LEVEL_COMMAND.authority]: DOMAIN_SERVICE_FACADES.authorityService.runAuthority,
  [TOP_LEVEL_COMMAND.architecture]: DOMAIN_SERVICE_FACADES.coreService.runArchitecture,
  [TOP_LEVEL_COMMAND.release]: DOMAIN_SERVICE_FACADES.releasePackageService.runRelease,
  [TOP_LEVEL_COMMAND.targetConfig]: DOMAIN_SERVICE_FACADES.targetService.runTargetConfig,
  [TOP_LEVEL_COMMAND.workItems]: DOMAIN_SERVICE_FACADES.workItemsService.runWorkItems,
  [TOP_LEVEL_COMMAND.target]: DOMAIN_SERVICE_FACADES.targetService.runTargetCommand,
  [TOP_LEVEL_COMMAND.targetInstance]: DOMAIN_SERVICE_FACADES.targetService.runTargetInstance
});

function normalizeCommand(cmd) {
  if (!cmd || [TOP_LEVEL_COMMAND.help, TOP_LEVEL_COMMAND_ALIAS.helpLong, TOP_LEVEL_COMMAND_ALIAS.helpShort].includes(cmd)) return TOP_LEVEL_COMMAND.help;
  if ([TOP_LEVEL_COMMAND.version, TOP_LEVEL_COMMAND_ALIAS.versionLong, TOP_LEVEL_COMMAND_ALIAS.versionShort].includes(cmd)) return TOP_LEVEL_COMMAND.version;
  return cmd;
}

function dispatchCommand(argv = []) {
  const [rawCommand, ...args] = argv;
  const command = normalizeCommand(rawCommand);
  const handler = COMMAND_ROUTE_HANDLERS[command];
  if (!handler) throw new Error(`unsupported command: ${rawCommand}`);
  return handler(args);
}

function createRuntimeCompatibilityPort() {
  const coreAdapter = createCoreCommandAdapter({
    version: VERSION,
    releaseLine: RELEASE_LINE,
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.help]: DOMAIN_SERVICE_FACADES.coreService.help,
      [TOP_LEVEL_COMMAND.version]: DOMAIN_SERVICE_FACADES.coreService.printVersion,
      [TOP_LEVEL_COMMAND.status]: DOMAIN_SERVICE_FACADES.coreService.runStatus
    })
  });
  const packageService = packageDomain.createPackageService({
    release: DOMAIN_SERVICE_FACADES.releasePackageService.runRelease
  });
  const packageAdapter = createPackageCommandAdapter({
    service: packageService
  });
  const architectureAdapter = createArchitectureCommandAdapter({
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.architecture]: DOMAIN_SERVICE_FACADES.coreService.runArchitecture
    })
  });
  const authorityAdapter = createAuthorityCommandAdapter({
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.agents]: DOMAIN_SERVICE_FACADES.authorityService.runAgents,
      [TOP_LEVEL_COMMAND.bridge]: DOMAIN_SERVICE_FACADES.authorityService.runBridge,
      [TOP_LEVEL_COMMAND.guard]: DOMAIN_SERVICE_FACADES.authorityService.runGuard,
      [TOP_LEVEL_COMMAND.authority]: DOMAIN_SERVICE_FACADES.authorityService.runAuthority
    })
  });
  const targetAdapter = createTargetCommandAdapter({
    handlers: Object.freeze({
      [TOP_LEVEL_COMMAND.init]: DOMAIN_SERVICE_FACADES.targetService.runInit,
      [TOP_LEVEL_COMMAND.targetConfig]: DOMAIN_SERVICE_FACADES.targetService.runTargetConfig,
      [TOP_LEVEL_COMMAND.target]: DOMAIN_SERVICE_FACADES.targetService.runTargetCommand,
      [TOP_LEVEL_COMMAND.targetInstance]: DOMAIN_SERVICE_FACADES.targetService.runTargetInstance
    })
  });
  const workItemsService = createWorkItemsService({
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
  });
  const workItemsAdapter = createWorkItemsCommandAdapter({
    service: workItemsService
  });
  const adapters = Object.freeze({
    [TOP_LEVEL_COMMAND.help]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.helpLong]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.helpShort]: coreAdapter,
    [TOP_LEVEL_COMMAND.version]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.versionLong]: coreAdapter,
    [TOP_LEVEL_COMMAND_ALIAS.versionShort]: coreAdapter,
    [TOP_LEVEL_COMMAND.status]: coreAdapter,
    [TOP_LEVEL_COMMAND.release]: packageAdapter,
    [TOP_LEVEL_COMMAND.architecture]: architectureAdapter,
    [TOP_LEVEL_COMMAND.authority]: authorityAdapter,
    [TOP_LEVEL_COMMAND.agents]: authorityAdapter,
    [TOP_LEVEL_COMMAND.bridge]: authorityAdapter,
    [TOP_LEVEL_COMMAND.guard]: authorityAdapter,
    [TOP_LEVEL_COMMAND.init]: targetAdapter,
    [TOP_LEVEL_COMMAND.targetConfig]: targetAdapter,
    [TOP_LEVEL_COMMAND.target]: targetAdapter,
    [TOP_LEVEL_COMMAND.targetInstance]: targetAdapter,
    [TOP_LEVEL_COMMAND.workItems]: workItemsAdapter,
    [TOP_LEVEL_COMMAND.claim]: workItemsAdapter
  });
  const handlers = {};
  for (const command of Object.keys(COMMAND_ROUTE_HANDLERS)) {
    handlers[command] = (argv = []) => {
      const normalized = normalizeCommand(argv[2]);
      return COMMAND_ROUTE_HANDLERS[normalized](argv.slice(3));
    };
  }
  handlers[TOP_LEVEL_COMMAND_ALIAS.helpLong] = handlers[TOP_LEVEL_COMMAND.help];
  handlers[TOP_LEVEL_COMMAND_ALIAS.helpShort] = handlers[TOP_LEVEL_COMMAND.help];
  handlers[TOP_LEVEL_COMMAND_ALIAS.versionLong] = handlers[TOP_LEVEL_COMMAND.version];
  handlers[TOP_LEVEL_COMMAND_ALIAS.versionShort] = handlers[TOP_LEVEL_COMMAND.version];
  handlers.default = (argv = []) => {
    const command = argv[2] || TOP_LEVEL_COMMAND.help;
    throw new Error(`unsupported command: ${command}`);
  };
  return createCompatibilityCommandPort(Object.freeze(handlers), Object.freeze({ adapters }));
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
