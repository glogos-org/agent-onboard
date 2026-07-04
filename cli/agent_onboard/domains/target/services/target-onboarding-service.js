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

function createTargetOnboardingService(deps) {
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

  function targetOnboardingDryRunFixture(cwd = process.cwd()) {
    const [name, kind] = targetName(cwd);
    const bootstrapPlan = planWritesForRoot(cwd, [[TARGET_CONFIG_FILE, targetConfigTemplate(cwd)]], { force: false });
    const bootstrapForcePlan = planWritesForRoot(cwd, [[TARGET_CONFIG_FILE, targetConfigTemplate(cwd)]], { force: true });
    const instancePlan = planWritesForRoot(cwd, [
      ['.agent-onboard/runtime-namespace.json', targetRuntimeNamespaceTemplate(cwd)],
      ['.agent-onboard/project.json', runtimeProjectTemplate(cwd)],
      ['.agent-onboard/work-items.json', workItemsTemplate()]
    ], { force: false });
    const agentsPlan = planTextWritesForRoot(cwd, [['AGENTS.md', agentsMdTemplate(cwd)]], { force: false });
    const onboardingWritePlan = planTargetOnboardingWritesForRoot(cwd, { force: false });
    return {
      schema: 'agent-onboard-public-target-onboarding-dry-run-fixture-result-001',
      status: 'ok',
      package_name: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.package_name,
      version: VERSION,
      release_line: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.release_line,
      command: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.command,
      contract_schema: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.schema,
      target: { name, kind, root: '.' },
      fixture_matrix: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
      observed_target_projection: {
        target_bootstrap_dry_run: {
          command: 'agent-onboard target bootstrap --dry-run',
          writes_performed: false,
          planned_writes: summarizePlan(bootstrapPlan),
          conflicts: bootstrapPlan.filter((item) => item.action === 'conflict').map((item) => item.path)
        },
        target_instance_takeover_dry_run: {
          command: 'agent-onboard target-instance takeover --dry-run',
          writes_performed: false,
          planned_writes: summarizePlan(instancePlan),
          conflicts: instancePlan.filter((item) => item.action === 'conflict').map((item) => item.path)
        },
        agents_preview: {
          command: 'agent-onboard agents --preview',
          writes_performed: false,
          planned_writes: summarizePlan(agentsPlan),
          conflicts: agentsPlan.filter((item) => item.action === 'conflict').map((item) => item.path)
        },
        target_onboarding_explicit_write_projection: {
          command: 'agent-onboard target onboarding --write',
          writes_performed: false,
          planned_writes: summarizePlan(onboardingWritePlan),
          conflicts: onboardingWritePlan.filter((item) => item.action === 'conflict').map((item) => item.path),
          would_write_only_canonical_files: true
        },
        target_bootstrap_force_dry_run: {
          command: 'agent-onboard target bootstrap --dry-run --force',
          writes_performed: false,
          planned_writes: summarizePlan(bootstrapForcePlan),
          conflicts: bootstrapForcePlan.filter((item) => item.action === 'conflict').map((item) => item.path)
        }
      },
      boundary: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.boundary,
      next_candidate_gate: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.next_candidate_gate
    };
  }

  function targetOnboardingRealTargetTrial(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot);
    const errors = [];
    if (!fs.existsSync(absoluteTargetRoot)) errors.push(`target path does not exist: ${absoluteTargetRoot}`);
    else if (!fs.statSync(absoluteTargetRoot).isDirectory()) errors.push(`target path is not a directory: ${absoluteTargetRoot}`);
  
    let name = path.basename(absoluteTargetRoot) || 'target-repo';
    let kind = 'generic';
    let surfacePlan = null;
    let fixture = null;
    let plannedWrites = [];
    if (errors.length === 0) {
      [name, kind] = targetName(absoluteTargetRoot);
      surfacePlan = targetOnboardingSurfacePlan(absoluteTargetRoot);
      fixture = targetOnboardingDryRunFixture(absoluteTargetRoot);
      plannedWrites = planTargetOnboardingWritesForRoot(absoluteTargetRoot, { force: false });
      if (!surfacePlan || surfacePlan.status !== 'ok') errors.push('target onboarding plan must pass for real target trial');
      if (!fixture || fixture.status !== 'ok') errors.push('target onboarding fixture must pass for real target trial');
    }
  
    const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
    const nonCanonical = plannedWrites.filter((item) => !TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.includes(item.path));
    const ready = errors.length === 0 && conflicts.length === 0 && nonCanonical.length === 0;
    return {
      schema: 'agent-onboard-public-target-onboarding-real-target-trial-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: 'agent-onboard target onboarding --trial',
      command_family: 'target onboarding',
      mode: 'trial',
      target: { name, kind, root: absoluteTargetRoot },
      writes_performed: false,
      ready_for_explicit_write: ready,
      trial_outcome: ready ? 'ready_for_explicit_write' : 'blocked_by_existing_non_identical_files',
      planned_writes: summarizePlan(plannedWrites),
      conflicts: conflicts.map((item) => item.path),
      non_canonical_planned_writes: nonCanonical.map((item) => item.path),
      observed: {
        target_exists: fs.existsSync(absoluteTargetRoot),
        target_is_directory: fs.existsSync(absoluteTargetRoot) && fs.statSync(absoluteTargetRoot).isDirectory(),
        surface_plan_status: surfacePlan ? surfacePlan.status : 'not_run',
        dry_run_fixture_status: fixture ? fixture.status : 'not_run',
        planned_canonical_file_count: plannedWrites.length,
        conflict_count: conflicts.length
      },
      validated: {
        target_path_readable: errors.length === 0,
        target_onboarding_plan: surfacePlan ? surfacePlan.status === 'ok' : false,
        target_onboarding_fixture: fixture ? fixture.status === 'ok' : false,
        trial_writes_no_files: true,
        planned_writes_are_canonical_only: nonCanonical.length === 0,
        conflicts_reported_before_write: true
      },
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        explicit_write_still_requires_target_onboarding_write: true,
        git_mutation: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        mutates_registry: false
      },
      next_steps: ready ? [
        'operator may run target onboarding --write only after explicit owner authorization',
        'run guard --check-boundary after canonical onboarding files exist',
        'record changed files and checks in the handoff if the trial proceeds to write'
      ] : [
        'inspect conflicts before writing',
        'merge existing target files manually or rerun the explicit write with --force only when the owner authorizes replacement'
      ],
      errors
    };
  }

  function publicTargetOnboardingRealTargetRepoTrial(root = packageRoot()) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-real-target-trial-'));
    let cleanedUp = false;
    const errors = [];
    let trial = null;
    try {
      fs.writeFileSync(path.join(tempRoot, 'package.json'), stableJson({ name: 'real-target-trial-fixture', private: true }));
      fs.writeFileSync(path.join(tempRoot, 'README.md'), '# Real target trial fixture\n');
      fs.mkdirSync(path.join(tempRoot, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, 'src', 'index.js'), '\'use strict\';\n');
      trial = targetOnboardingRealTargetTrial(tempRoot);
      if (!trial || trial.status !== 'ok') errors.push('real target trial command must return ok for the realistic fixture target');
      if (!trial || trial.ready_for_explicit_write !== true) errors.push('real target trial fixture must be ready for explicit write');
      if (!trial || trial.writes_performed !== false) errors.push('real target trial must not write files');
      const canonical = TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice().sort();
      const planned = trial ? trial.planned_writes.map((item) => item.path).sort() : [];
      if (!arrayEquals(planned, canonical)) errors.push(`real target trial must project canonical files ${canonical.join(', ')}`);
      for (const rel of canonical) {
        if (fs.existsSync(path.join(tempRoot, rel))) errors.push(`real target trial unexpectedly wrote ${rel}`);
      }
    } catch (error) {
      errors.push(error && error.message ? error.message : String(error));
    } finally {
      try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
        cleanedUp = !fs.existsSync(tempRoot);
      } catch (error) {
        cleanedUp = false;
        errors.push(error && error.message ? error.message : String(error));
      }
    }
    if (!cleanedUp) errors.push('temporary real target trial fixture was not cleaned up');
  
    return {
      schema: 'agent-onboard-public-target-onboarding-real-target-repo-trial-gate-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: PUBLIC_RELEASE_CONTRACT.package_name,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
      command: PUBLIC_RELEASE_CONTRACT.real_target_trial_command,
      package_root: root,
      source_context: sourceContext(root),
      observed: {
        temporary_target_root: tempRoot,
        temporary_target_cleanup: cleanedUp,
        trial_status: trial ? trial.status : 'not_run',
        trial_ready_for_explicit_write: trial ? trial.ready_for_explicit_write : false,
        trial_conflicts: trial ? trial.conflicts : []
      },
      validated: {
        realistic_target_fixture_created: true,
        target_onboarding_trial_status: trial ? trial.status === 'ok' : false,
        target_ready_for_explicit_write: trial ? trial.ready_for_explicit_write === true : false,
        canonical_files_projected_only: trial ? trial.non_canonical_planned_writes.length === 0 : false,
        trial_writes_no_files: trial ? trial.writes_performed === false : false,
        temporary_target_cleanup: cleanedUp
      },
      boundary: {
        writes_package_root: false,
        writes_target_repository_state: false,
        creates_temp_target_repository: true,
        cleans_up_temp_target_repository: cleanedUp,
        git_mutation: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        publishes_package: false,
        mutates_registry: false
      },
      target_trial_command: 'agent-onboard target onboarding --trial --target <target-repo-path>',
      next_candidate_gate: {
        title: 'Public architecture map gate',
        intent: 'Declare the public architecture kernel before source code is physically partitioned.'
      },
      errors
    };
  }

  function targetOnboardingSurfacePlan(cwd = process.cwd()) {
    const [name, kind] = targetName(cwd);
    const plannedFiles = targetOnboardingWriteSet(cwd).map((item) => ({
      path: item.path,
      kind: item.kind,
      already_exists: fs.existsSync(path.join(cwd, item.path)),
      schema: item.schema || null
    }));
    return {
      schema: TARGET_ONBOARDING_SURFACE_PLAN.schema,
      status: 'ok',
      package_name: TARGET_ONBOARDING_SURFACE_PLAN.package_name,
      version: VERSION,
      release_line: TARGET_ONBOARDING_SURFACE_PLAN.release_line,
      command: TARGET_ONBOARDING_SURFACE_PLAN.command,
      target: { name, kind, root: '.' },
      canonical_files: TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice(),
      phases: TARGET_ONBOARDING_SURFACE_PLAN.phases,
      planned_files: plannedFiles,
      boundary: TARGET_ONBOARDING_SURFACE_PLAN.boundary,
      next_candidate_gate: TARGET_ONBOARDING_SURFACE_PLAN.next_candidate_gate
    };
  }

  function planTargetOnboardingWritesForRoot(root, options = {}) {
    const force = options.force === true;
    return targetOnboardingWriteSet(root).map((entry) => {
      const absolutePath = path.join(root, entry.path);
      const desired = entry.kind === 'json' ? stableJson(entry.value) : entry.content;
      const exists = fs.existsSync(absolutePath);
      const current = exists ? fs.readFileSync(absolutePath, 'utf8') : null;
      const identical = exists && current === desired;
      const conflict = exists && !identical && !force;
      let action = 'create';
      if (identical) action = 'keep';
      else if (exists && force) action = 'overwrite';
      else if (conflict) action = 'conflict';
      return {
        path: entry.path,
        kind: entry.kind,
        schema: entry.schema,
        exists,
        action,
        safe_to_write: action !== 'conflict',
        value: entry.value,
        content: entry.content
      };
    });
  }

  function planTargetOnboardingWrites(options = {}) {
    return planTargetOnboardingWritesForRoot(process.cwd(), options);
  }

  function performTargetOnboardingWrites(plannedWrites, root = process.cwd()) {
    for (const item of plannedWrites) {
      if (item.action !== 'create' && item.action !== 'overwrite') continue;
      const absolutePath = path.join(root, item.path);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      if (item.kind === 'json') fs.writeFileSync(absolutePath, stableJson(item.value));
      else fs.writeFileSync(absolutePath, item.content);
    }
  }

  return Object.freeze({
    targetOnboardingDryRunFixture,
    targetOnboardingRealTargetTrial,
    publicTargetOnboardingRealTargetRepoTrial,
    targetOnboardingSurfacePlan,
    planTargetOnboardingWritesForRoot,
    planTargetOnboardingWrites,
    performTargetOnboardingWrites
  });
}

module.exports = {
  createTargetOnboardingService
};
