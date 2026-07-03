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

function createTargetWriteService(deps) {
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

  function initWriteSet(cwd = process.cwd()) {
    return [
      ['agent-onboard.target.json', targetConfigTemplate(cwd)],
      ['.agent-onboard/runtime-namespace.json', targetRuntimeNamespaceTemplate(cwd)],
      ['.agent-onboard/project.json', runtimeProjectTemplate(cwd)],
      ['.agent-onboard/work-items.json', workItemsTemplate()]
    ];
  }

  function targetOnboardingWriteSet(cwd = process.cwd()) {
    return [
      {
        path: 'agent-onboard.target.json',
        kind: 'json',
        schema: 'agent-onboard-target-config-001',
        value: targetConfigTemplate(cwd)
      },
      {
        path: '.agent-onboard/runtime-namespace.json',
        kind: 'json',
        schema: 'agent-onboard-target-runtime-namespace-001',
        value: targetRuntimeNamespaceTemplate(cwd)
      },
      {
        path: '.agent-onboard/project.json',
        kind: 'json',
        schema: 'agent-onboard-target-runtime-project-001',
        value: runtimeProjectTemplate(cwd)
      },
      {
        path: '.agent-onboard/work-items.json',
        kind: 'json',
        schema: 'agent-onboard-target-work-items-001',
        value: workItemsTemplate()
      },
      {
        path: 'AGENTS.md',
        kind: 'text',
        schema: null,
        content: agentsMdTemplate(cwd)
      },
      {
        path: 'llms.txt',
        kind: 'text',
        schema: null,
        content: llmsTxtTemplate(cwd)
      },
      {
        path: '.agent-onboard/authority-path.json',
        kind: 'json',
        schema: 'agent-onboard-authority-path-001',
        value: authorityPathTemplate(cwd)
      }
    ];
  }

  function planWritesForRoot(root, writeSet, options = {}) {
    const force = options.force === true;
    return writeSet.map(([relativePath, value]) => {
      const absolutePath = path.join(root, relativePath);
      const desired = stableJson(value);
      const exists = fs.existsSync(absolutePath);
      const current = exists ? fs.readFileSync(absolutePath, 'utf8') : null;
      const identical = exists && current === desired;
      const conflict = exists && !identical && !force;
      let action = 'create';
      if (identical) action = 'keep';
      else if (exists && force) action = 'overwrite';
      else if (conflict) action = 'conflict';
      return {
        path: relativePath,
        exists,
        action,
        safe_to_write: action !== 'conflict',
        value
      };
    });
  }

  function planWrites(writeSet, options = {}) {
    return planWritesForRoot(process.cwd(), writeSet, options);
  }

  function performPlannedWrites(plannedWrites) {
    for (const item of plannedWrites) {
      if (item.action === 'create' || item.action === 'overwrite') {
        writeJson(path.join(process.cwd(), item.path), item.value);
      }
    }
  }

  function planTextWritesForRoot(root, writeSet, options = {}) {
    const force = options.force === true;
    return writeSet.map(([relativePath, content]) => {
      const absolutePath = path.join(root, relativePath);
      const exists = fs.existsSync(absolutePath);
      const current = exists ? fs.readFileSync(absolutePath, 'utf8') : null;
      const identical = exists && current === content;
      const conflict = exists && !identical && !force;
      let action = 'create';
      if (identical) action = 'keep';
      else if (exists && force) action = 'overwrite';
      else if (conflict) action = 'conflict';
      return {
        path: relativePath,
        exists,
        action,
        safe_to_write: action !== 'conflict',
        content
      };
    });
  }

  function planTextWrites(writeSet, options = {}) {
    return planTextWritesForRoot(process.cwd(), writeSet, options);
  }

  function performPlannedTextWrites(plannedWrites) {
    for (const item of plannedWrites) {
      if (item.action === 'create' || item.action === 'overwrite') {
        fs.mkdirSync(path.dirname(path.join(process.cwd(), item.path)), { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), item.path), item.content);
      }
    }
  }

  function summarizePlan(plannedWrites) {
    return plannedWrites.map((item) => ({
      path: item.path,
      exists: item.exists,
      action: item.action,
      safe_to_write: item.safe_to_write
    }));
  }

  function existingRelativeFiles(root, relativeFiles) {
    return relativeFiles.filter((relativePath) => fs.existsSync(path.join(root, relativePath))).sort();
  }

  function readJsonReport(root, relativePath, validate, expectedSchema) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      return {
        path: relativePath,
        present: false,
        status: TARGET_DOCTOR.status.missing,
        errors: []
      };
    }
    try {
      const value = readJson(absolutePath);
      const errors = [];
      if (expectedSchema && (!value || value.schema !== expectedSchema)) {
        errors.push(`$.schema: expected ${expectedSchema}`);
      }
      if (typeof validate === 'function') errors.push(...validate(value));
      return {
        path: relativePath,
        present: true,
        status: errors.length === 0 ? TARGET_DOCTOR.status.valid : TARGET_DOCTOR.status.invalid,
        errors,
        value
      };
    } catch (error) {
      return {
        path: relativePath,
        present: true,
        status: TARGET_DOCTOR.status.invalid,
        errors: [error && error.message ? error.message : String(error)]
      };
    }
  }

  function publicJsonReport(report) {
    const { value, ...publicReport } = report;
    return publicReport;
  }

  function textFileReport(root, relativePath) {
    const present = fs.existsSync(path.join(root, relativePath));
    return {
      path: relativePath,
      present,
      status: present ? TARGET_DOCTOR.status.present : TARGET_DOCTOR.status.missing
    };
  }

  return Object.freeze({
    initWriteSet,
    targetOnboardingWriteSet,
    planWritesForRoot,
    planWrites,
    performPlannedWrites,
    planTextWritesForRoot,
    planTextWrites,
    performPlannedTextWrites,
    summarizePlan,
    existingRelativeFiles,
    readJsonReport,
    publicJsonReport,
    textFileReport
  });
}

module.exports = {
  createTargetWriteService
};
