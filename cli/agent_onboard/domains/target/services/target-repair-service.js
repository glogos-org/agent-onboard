'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const targetConstants = require('./target-constants');
const {
  PACKAGE_NAME,
  TARGET_DOCTOR,
  TARGET_REPAIR,
  TARGET_PROFILE,
  TARGET_DOCTOR_FILE,
  TARGET_DOCTOR_SCHEMA,
  TARGET_DOCTOR_PACKAGE_MANAGER_FILES,
  TARGET_DOCTOR_LANGUAGE_MARKERS,
  TARGET_DOCTOR_FRAMEWORK_PACKAGES,
  TARGET_DOCTOR_CI_FILES,
  TARGET_DOCTOR_DOC_FILES,
  TARGET_PROFILE_SCRIPT_MARKERS
} = targetConstants;

function createTargetRepairService(deps) {
  const {
    version: VERSION,
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
    arrayEquals,
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
    guardResultBase
  } = deps;

  const targetOnboardingDryRunFixture = (...args) => deps.targetOnboardingDryRunFixture(...args);
  const targetOnboardingRealTargetTrial = (...args) => deps.targetOnboardingRealTargetTrial(...args);
  const publicTargetOnboardingRealTargetRepoTrial = (...args) => deps.publicTargetOnboardingRealTargetRepoTrial(...args);
  const targetOnboardingSurfacePlan = (...args) => deps.targetOnboardingSurfacePlan(...args);
  const planTargetOnboardingWritesForRoot = (...args) => deps.planTargetOnboardingWritesForRoot(...args);
  const planTargetOnboardingWrites = (...args) => deps.planTargetOnboardingWrites(...args);
  const performTargetOnboardingWrites = (...args) => deps.performTargetOnboardingWrites(...args);
  const dependencyNames = (...args) => deps.dependencyNames(...args);
  const packageJsonProfile = (...args) => deps.packageJsonProfile(...args);
  const detectedPackageManagers = (...args) => deps.detectedPackageManagers(...args);
  const detectedMarkers = (...args) => deps.detectedMarkers(...args);
  const detectedFrameworks = (...args) => deps.detectedFrameworks(...args);
  const detectedCi = (...args) => deps.detectedCi(...args);
  const detectedScripts = (...args) => deps.detectedScripts(...args);
  const targetProfileData = (...args) => deps.targetProfileData(...args);
  const targetDoctorProfile = (...args) => deps.targetDoctorProfile(...args);
  const targetProfileSummary = (...args) => deps.targetProfileSummary(...args);
  const targetProfile = (...args) => deps.targetProfile(...args);
  const targetDoctorChecks = (...args) => deps.targetDoctorChecks(...args);
  const targetDoctorCanonicalFiles = (...args) => deps.targetDoctorCanonicalFiles(...args);
  const targetDoctorReadiness = (...args) => deps.targetDoctorReadiness(...args);
  const targetDoctorNextSteps = (...args) => deps.targetDoctorNextSteps(...args);
  const targetDoctor = (...args) => deps.targetDoctor(...args);
  const agentsMdTemplate = (...args) => deps.agentsMdTemplate(...args);
  const firstReadOrder = (...args) => deps.firstReadOrder(...args);
  const llmsTxtTemplate = (...args) => deps.llmsTxtTemplate(...args);
  const authorityPathTemplate = (...args) => deps.authorityPathTemplate(...args);
  const targetName = (...args) => deps.targetName(...args);
  const targetConfigTemplate = (...args) => deps.targetConfigTemplate(...args);
  const targetRuntimeNamespaceTemplate = (...args) => deps.targetRuntimeNamespaceTemplate(...args);
  const runtimeProjectTemplate = (...args) => deps.runtimeProjectTemplate(...args);
  const workItemsTemplate = (...args) => deps.workItemsTemplate(...args);
  const initWriteSet = (...args) => deps.initWriteSet(...args);
  const targetOnboardingWriteSet = (...args) => deps.targetOnboardingWriteSet(...args);
  const planWritesForRoot = (...args) => deps.planWritesForRoot(...args);
  const planWrites = (...args) => deps.planWrites(...args);
  const performPlannedWrites = (...args) => deps.performPlannedWrites(...args);
  const planTextWritesForRoot = (...args) => deps.planTextWritesForRoot(...args);
  const planTextWrites = (...args) => deps.planTextWrites(...args);
  const performPlannedTextWrites = (...args) => deps.performPlannedTextWrites(...args);
  const summarizePlan = (...args) => deps.summarizePlan(...args);
  const existingRelativeFiles = (...args) => deps.existingRelativeFiles(...args);
  const readJsonReport = (...args) => deps.readJsonReport(...args);
  const publicJsonReport = (...args) => deps.publicJsonReport(...args);
  const textFileReport = (...args) => deps.textFileReport(...args);

  function targetRepairCommand(mode, force) {
    const base = `agent-onboard target repair --${mode}`;
    return force ? `${base} --force` : base;
  }

  function targetRepairPlanForRoot(root, options = {}) {
    return planTargetOnboardingWritesForRoot(root, { force: options.force === true }).map((item) => {
      if (item.action !== 'conflict') {
        return {
          ...item,
          will_write: item.action === TARGET_REPAIR.action.create || item.action === TARGET_REPAIR.action.overwrite,
          skipped_reason: null
        };
      }
      return {
        ...item,
        action: TARGET_REPAIR.action.skipExisting,
        safe_to_write: true,
        will_write: false,
        skipped_reason: TARGET_REPAIR.skippedReason.existingNonIdenticalFile
      };
    });
  }

  function targetRepairPlan(options = {}) {
    return targetRepairPlanForRoot(process.cwd(), options);
  }

  function summarizeRepairPlan(plannedWrites) {
    return plannedWrites.map((item) => ({
      path: item.path,
      kind: item.kind,
      schema: item.schema || null,
      exists: item.exists,
      action: item.action,
      will_write: item.will_write === true,
      safe_to_write: item.safe_to_write,
      skipped_reason: item.skipped_reason || null
    }));
  }

  function repairActionFiles(plannedWrites, action) {
    return plannedWrites.filter((item) => item.action === action).map((item) => item.path);
  }

  function performTargetRepairWrites(plannedWrites, root = process.cwd()) {
    const writable = plannedWrites.filter((item) => item.action === TARGET_REPAIR.action.create || item.action === TARGET_REPAIR.action.overwrite);
    performTargetOnboardingWrites(writable, root);
    return writable.map((item) => item.path);
  }

  function targetRepair(targetRoot = process.cwd(), options = {}) {
    const mode = options.write === true ? TARGET_REPAIR.mode.write : TARGET_REPAIR.mode.plan;
    const force = options.force === true;
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot)) {
      return {
        schema: TARGET_REPAIR.schema,
        status: TARGET_REPAIR.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: targetRepairCommand(mode, force),
        command_family: TARGET_REPAIR.commandFamily,
        mode,
        force,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path does not exist: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
    if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: TARGET_REPAIR.schema,
        status: TARGET_REPAIR.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: targetRepairCommand(mode, force),
        command_family: TARGET_REPAIR.commandFamily,
        mode,
        force,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path is not a directory: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
  
    const [name, kind] = targetName(absoluteTargetRoot);
    const repairPlan = targetRepairPlanForRoot(absoluteTargetRoot, { force });
    const writtenFiles = mode === TARGET_REPAIR.mode.write ? performTargetRepairWrites(repairPlan, absoluteTargetRoot) : [];
    const createdFiles = repairActionFiles(repairPlan, TARGET_REPAIR.action.create);
    const overwrittenFiles = repairActionFiles(repairPlan, TARGET_REPAIR.action.overwrite);
    const skippedExistingFiles = repairActionFiles(repairPlan, TARGET_REPAIR.action.skipExisting);
    const keptFiles = repairActionFiles(repairPlan, TARGET_REPAIR.action.keep);
  
    return {
      schema: TARGET_REPAIR.schema,
      status: TARGET_REPAIR.status.ok,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: targetRepairCommand(mode, force),
      command_family: TARGET_REPAIR.commandFamily,
      mode,
      force,
      target: { name, kind, root: absoluteTargetRoot },
      writes_performed: writtenFiles.length > 0,
      written_files: writtenFiles,
      created_files: createdFiles,
      overwritten_files: overwrittenFiles,
      skipped_existing_files: skippedExistingFiles,
      kept_files: keptFiles,
      repair_plan: summarizeRepairPlan(repairPlan),
      repair_outcome: skippedExistingFiles.length > 0 && !force ? 'partial_existing_files_preserved' : 'canonical_files_repaired',
      next_steps: [
        `run ${PACKAGE_NAME} target doctor --json --target ${absoluteTargetRoot}`,
        `run ${PACKAGE_NAME} guard --check-boundary after ${TARGET_CONFIG_FILE} is valid`,
        'use --force only with explicit owner authorization to overwrite existing non-identical onboarding files'
      ],
      validated: {
        target_path_readable: true,
        target_is_directory: true,
        writes_require_explicit_write_mode: true,
        plan_mode_writes_no_files: mode === TARGET_REPAIR.mode.plan,
        writes_only_canonical_target_onboarding_files: true,
        skipped_existing_non_identical_files_without_force: !force,
        managed_project_commands_not_run: true,
        dependency_install_not_run: true,
        build_test_deploy_not_run: true,
        publish_push_not_run: true
      },
      boundary: {
        writes_files: mode === TARGET_REPAIR.mode.write,
        writes_target_repository_state: mode === TARGET_REPAIR.mode.write,
        creates_agent_onboard_runtime_state: mode === TARGET_REPAIR.mode.write && writtenFiles.some((file) => file.startsWith('.agent-onboard/')),
        reads_target_repository_state: true,
        runs_managed_project_commands: false,
        managed_project_commands_executed: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        publishes_package: false,
        publishes_or_pushes: false,
        git_mutation: false,
        mutates_registry: false,
        writes_only_canonical_target_onboarding_files: true,
        overwrites_existing_files: overwrittenFiles.length > 0,
        skips_existing_non_identical_files_by_default: !force
      },
      errors: []
    };
  }

  return Object.freeze({
    targetRepairCommand,
    targetRepairPlanForRoot,
    targetRepairPlan,
    summarizeRepairPlan,
    repairActionFiles,
    performTargetRepairWrites,
    targetRepair
  });
}

module.exports = {
  createTargetRepairService
};
