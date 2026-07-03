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

function createTargetDoctorService(deps) {
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
  const targetRepairCommand = (...args) => deps.targetRepairCommand(...args);
  const targetRepairPlanForRoot = (...args) => deps.targetRepairPlanForRoot(...args);
  const targetRepairPlan = (...args) => deps.targetRepairPlan(...args);
  const summarizeRepairPlan = (...args) => deps.summarizeRepairPlan(...args);
  const repairActionFiles = (...args) => deps.repairActionFiles(...args);
  const performTargetRepairWrites = (...args) => deps.performTargetRepairWrites(...args);
  const targetRepair = (...args) => deps.targetRepair(...args);
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

  function targetDoctorChecks(root) {
    const targetConfig = readJsonReport(root, TARGET_CONFIG_FILE, validateTargetConfig);
    const runtimeNamespace = readJsonReport(root, TARGET_DOCTOR_FILE.runtimeNamespace, null, TARGET_DOCTOR_SCHEMA.runtimeNamespace);
    const runtimeProject = readJsonReport(root, TARGET_DOCTOR_FILE.runtimeProject, null, TARGET_DOCTOR_SCHEMA.runtimeProject);
    const workItems = readJsonReport(root, TARGET_DOCTOR_FILE.workItems, validateWorkItems);
    const authorityPath = readJsonReport(root, TARGET_DOCTOR_FILE.authorityPath, null, TARGET_DOCTOR_SCHEMA.authorityPath);
    const boundaryViolations = targetConfig.value ? evaluateTargetBoundaryConfig(targetConfig.value) : [];
  
    return {
      target_config: publicJsonReport(targetConfig),
      runtime_namespace: publicJsonReport(runtimeNamespace),
      runtime_project: publicJsonReport(runtimeProject),
      work_items: {
        ...publicJsonReport(workItems),
        counts: workItems.value ? workItemCounts(workItems.value) : null
      },
      agents_md: textFileReport(root, TARGET_DOCTOR_FILE.agentsMd),
      llms_txt: textFileReport(root, TARGET_DOCTOR_FILE.llmsTxt),
      authority_path: publicJsonReport(authorityPath),
      boundary_config: {
        path: TARGET_CONFIG_FILE,
        status: targetConfig.present
          ? (targetConfig.status === TARGET_DOCTOR.status.valid && boundaryViolations.length === 0 ? TARGET_DOCTOR.status.valid : TARGET_DOCTOR.status.invalid)
          : TARGET_DOCTOR.status.missing,
        violations: boundaryViolations
      }
    };
  }

  function targetDoctorCanonicalFiles(root) {
    return planTargetOnboardingWritesForRoot(root, { force: false }).map((item) => {
      const textFile = item.kind === 'text';
      const status = item.exists
        ? (item.action === 'keep' || textFile ? TARGET_DOCTOR.status.present : TARGET_DOCTOR.status.customized)
        : TARGET_DOCTOR.status.missing;
      return {
        path: item.path,
        kind: item.kind,
        schema: item.schema || null,
        present: item.exists,
        action: item.action,
        status,
        safe_to_write: item.safe_to_write
      };
    });
  }

  function targetDoctorReadiness(canonicalFiles, checks) {
    const missingFiles = canonicalFiles.filter((item) => !item.present).map((item) => item.path);
    const invalidChecks = Object.entries(checks)
      .filter(([, check]) => check && check.status === TARGET_DOCTOR.status.invalid)
      .map(([name]) => name);
    const readiness = invalidChecks.length > 0
      ? TARGET_DOCTOR.readiness.blocked
      : (missingFiles.length > 0 ? TARGET_DOCTOR.readiness.needsOnboarding : TARGET_DOCTOR.readiness.ready);
    const possible = canonicalFiles.length + Object.keys(checks).length;
    const passed = Math.max(0, possible - missingFiles.length - invalidChecks.length);
    return {
      status: readiness,
      score: possible === 0 ? 0 : Math.round((passed / possible) * 100),
      missing_files: missingFiles,
      invalid_checks: invalidChecks
    };
  }

  function targetDoctorNextSteps(readiness, root) {
    if (readiness.status === TARGET_DOCTOR.readiness.ready) {
      return [
        `run ${PACKAGE_NAME} guard --check-boundary before broad write, build, publish, or push actions`,
        `run ${PACKAGE_NAME} work-items --list before claiming target repo work`
      ];
    }
    if (readiness.status === TARGET_DOCTOR.readiness.blocked) {
      return [
        'inspect invalid target onboarding JSON before writing',
        `run ${PACKAGE_NAME} target onboarding --trial to preview the canonical repair path`,
        'write or overwrite target onboarding files only with explicit owner authorization'
      ];
    }
    return [
      `run ${PACKAGE_NAME} target onboarding --trial --target ${root}`,
      `run ${PACKAGE_NAME} target onboarding --write only after explicit owner authorization`,
      `rerun ${PACKAGE_NAME} target doctor --json after onboarding files exist`
    ];
  }

  function targetDoctor(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot)) {
      return {
        schema: TARGET_DOCTOR.schema,
        status: TARGET_DOCTOR.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_DOCTOR.commandWithJson,
        command_family: TARGET_DOCTOR.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path does not exist: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
    if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: TARGET_DOCTOR.schema,
        status: TARGET_DOCTOR.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_DOCTOR.commandWithJson,
        command_family: TARGET_DOCTOR.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path is not a directory: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
  
    const [name, kind] = targetName(absoluteTargetRoot);
    const canonicalFiles = targetDoctorCanonicalFiles(absoluteTargetRoot);
    const checks = targetDoctorChecks(absoluteTargetRoot);
    const readiness = targetDoctorReadiness(canonicalFiles, checks);
    return {
      schema: TARGET_DOCTOR.schema,
      status: TARGET_DOCTOR.status.ok,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_DOCTOR.commandWithJson,
      command_family: TARGET_DOCTOR.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      readiness,
      profile: targetDoctorProfile(absoluteTargetRoot),
      canonical_files: canonicalFiles,
      checks,
      next_steps: targetDoctorNextSteps(readiness, absoluteTargetRoot),
      writes_performed: false,
      validated: {
        target_path_readable: true,
        target_is_directory: true,
        no_writes_performed: true,
        canonical_files_checked: canonicalFiles.length === TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.length,
        managed_project_commands_not_run: true,
        dependency_install_not_run: true,
        build_test_deploy_not_run: true,
        publish_push_not_run: true
      },
      boundary: {
        ...noMutationBoundary(),
        reads_target_repository_state: true,
        runs_package_manager: false,
        mutates_registry: false
      },
      errors: []
    };
  }

  return Object.freeze({
    targetDoctorChecks,
    targetDoctorCanonicalFiles,
    targetDoctorReadiness,
    targetDoctorNextSteps,
    targetDoctor
  });
}

module.exports = {
  createTargetDoctorService
};
