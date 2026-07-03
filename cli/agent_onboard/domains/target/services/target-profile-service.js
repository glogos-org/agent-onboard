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

function createTargetProfileService(deps) {
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
  const targetDoctorChecks = (...args) => deps.targetDoctorChecks(...args);
  const targetDoctorCanonicalFiles = (...args) => deps.targetDoctorCanonicalFiles(...args);
  const targetDoctorReadiness = (...args) => deps.targetDoctorReadiness(...args);
  const targetDoctorNextSteps = (...args) => deps.targetDoctorNextSteps(...args);
  const targetDoctor = (...args) => deps.targetDoctor(...args);
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

  function dependencyNames(pkg) {
    if (!isPlainObject(pkg)) return [];
    const buckets = [
      pkg.dependencies,
      pkg.devDependencies,
      pkg.peerDependencies,
      pkg.optionalDependencies
    ].filter(isPlainObject);
    return Array.from(new Set(buckets.flatMap((bucket) => Object.keys(bucket)))).sort();
  }

  function packageJsonProfile(root) {
    const report = readJsonReport(root, TARGET_DOCTOR_FILE.packageJson);
    if (!report.present || report.status !== TARGET_DOCTOR.status.valid || !isPlainObject(report.value)) {
      return {
        present: report.present,
        valid: report.status === TARGET_DOCTOR.status.valid,
        status: report.status,
        errors: report.errors
      };
    }
    return {
      present: true,
      valid: true,
      status: TARGET_DOCTOR.status.valid,
      name: typeof report.value.name === 'string' ? report.value.name : null,
      private: report.value.private === true,
      package_manager: typeof report.value.packageManager === 'string' ? report.value.packageManager : null,
      scripts: isPlainObject(report.value.scripts) ? Object.keys(report.value.scripts).sort() : [],
      dependency_names: dependencyNames(report.value)
    };
  }

  function detectedPackageManagers(root, pkgProfile) {
    const lockfiles = TARGET_DOCTOR_PACKAGE_MANAGER_FILES
      .filter((entry) => fs.existsSync(path.join(root, entry.file)))
      .map((entry) => ({ name: entry.name, source: entry.file }));
    if (pkgProfile.package_manager) {
      lockfiles.push({ name: pkgProfile.package_manager.split('@')[0], source: 'package.json#packageManager' });
    }
    const unique = new Map();
    for (const entry of lockfiles) unique.set(`${entry.name}:${entry.source}`, entry);
    return Array.from(unique.values()).sort((left, right) => `${left.name}:${left.source}`.localeCompare(`${right.name}:${right.source}`));
  }

  function detectedMarkers(root, markers) {
    return markers
      .map((marker) => ({
        name: marker.name,
        evidence: marker.files.filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
      }))
      .filter((marker) => marker.evidence.length > 0);
  }

  function detectedFrameworks(pkgProfile) {
    const dependencySet = new Set(Array.isArray(pkgProfile.dependency_names) ? pkgProfile.dependency_names : []);
    return TARGET_DOCTOR_FRAMEWORK_PACKAGES
      .filter((entry) => entry.packages.some((packageName) => dependencySet.has(packageName)))
      .map((entry) => ({
        name: entry.name,
        evidence: entry.packages.filter((packageName) => dependencySet.has(packageName))
      }));
  }

  function detectedCi(root) {
    return TARGET_DOCTOR_CI_FILES
      .filter((entry) => fs.existsSync(path.join(root, entry.file)))
      .map((entry) => ({ name: entry.name, source: entry.file }));
  }

  function detectedScripts(pkgProfile) {
    const scripts = Array.isArray(pkgProfile.scripts) ? pkgProfile.scripts : [];
    return TARGET_PROFILE_SCRIPT_MARKERS
      .map((marker) => ({
        purpose: marker.purpose,
        scripts: marker.names.filter((scriptName) => scripts.includes(scriptName))
      }))
      .filter((marker) => marker.scripts.length > 0);
  }

  function targetProfileData(root) {
    const pkgProfile = packageJsonProfile(root);
    return {
      package_json: pkgProfile,
      package_managers: detectedPackageManagers(root, pkgProfile),
      languages: detectedMarkers(root, TARGET_DOCTOR_LANGUAGE_MARKERS),
      frameworks: detectedFrameworks(pkgProfile),
      scripts: detectedScripts(pkgProfile),
      ci: detectedCi(root),
      docs: existingRelativeFiles(root, TARGET_DOCTOR_DOC_FILES),
      git_present: fs.existsSync(path.join(root, '.git'))
    };
  }

  function targetDoctorProfile(root) {
    return targetProfileData(root);
  }

  function targetProfileSummary(profile) {
    return {
      package_managers: profile.package_managers.length,
      languages: profile.languages.length,
      frameworks: profile.frameworks.length,
      script_purposes: profile.scripts.length,
      ci: profile.ci.length,
      docs: profile.docs.length,
      has_git: profile.git_present === true
    };
  }

  function targetProfile(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot)) {
      return {
        schema: TARGET_PROFILE.schema,
        status: TARGET_PROFILE.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_PROFILE.command,
        command_family: TARGET_PROFILE.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path does not exist: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
    if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: TARGET_PROFILE.schema,
        status: TARGET_PROFILE.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_PROFILE.command,
        command_family: TARGET_PROFILE.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
        writes_performed: false,
        errors: [`target path is not a directory: ${absoluteTargetRoot}`],
        boundary: noMutationBoundary()
      };
    }
  
    const [name, kind] = targetName(absoluteTargetRoot);
    const profile = targetProfileData(absoluteTargetRoot);
    return {
      schema: TARGET_PROFILE.schema,
      status: TARGET_PROFILE.status.ok,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_PROFILE.command,
      command_family: TARGET_PROFILE.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      profile,
      summary: targetProfileSummary(profile),
      next_steps: [
        `run ${PACKAGE_NAME} target doctor --json --target ${absoluteTargetRoot}`,
        `run ${PACKAGE_NAME} target repair --plan --target ${absoluteTargetRoot}`,
        'confirm with the repository owner before running detected package scripts'
      ],
      writes_performed: false,
      validated: {
        target_path_readable: true,
        target_is_directory: true,
        no_writes_performed: true,
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
    dependencyNames,
    packageJsonProfile,
    detectedPackageManagers,
    detectedMarkers,
    detectedFrameworks,
    detectedCi,
    detectedScripts,
    targetProfileData,
    targetDoctorProfile,
    targetProfileSummary,
    targetProfile
  });
}

module.exports = {
  createTargetProfileService
};
