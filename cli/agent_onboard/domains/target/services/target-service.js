'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createTargetRuntimeUtilities } = require('./target-runtime-utilities');

function freezeEntries(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

const PACKAGE_NAME = 'agent-onboard';

const TARGET_DOCTOR = Object.freeze({
  schema: 'agent-onboard-target-doctor-result-001',
  command: 'agent-onboard target doctor',
  commandWithJson: 'agent-onboard target doctor --json',
  commandFamily: 'target doctor',
  flag: Object.freeze({
    json: '--json',
    target: '--target'
  }),
  readiness: Object.freeze({
    ready: 'ready',
    needsOnboarding: 'needs_onboarding',
    blocked: 'blocked'
  }),
  status: Object.freeze({
    ok: 'ok',
    error: 'error',
    present: 'present',
    missing: 'missing',
    valid: 'valid',
    invalid: 'invalid',
    notApplicable: 'not_applicable',
    customized: 'customized'
  })
});

const TARGET_REPAIR = Object.freeze({
  schema: 'agent-onboard-target-repair-result-001',
  commandFamily: 'target repair',
  mode: Object.freeze({
    plan: 'plan',
    write: 'write'
  }),
  status: Object.freeze({
    ok: 'ok',
    error: 'error'
  }),
  action: Object.freeze({
    create: 'create',
    keep: 'keep',
    overwrite: 'overwrite',
    skipExisting: 'skip_existing'
  }),
  skippedReason: Object.freeze({
    existingNonIdenticalFile: 'existing_non_identical_file'
  })
});

const TARGET_PROFILE = Object.freeze({
  schema: 'agent-onboard-target-profile-result-001',
  command: 'agent-onboard target profile --json',
  commandFamily: 'target profile',
  status: Object.freeze({
    ok: 'ok',
    error: 'error'
  }),
  scriptPurpose: Object.freeze({
    test: 'test',
    build: 'build',
    lint: 'lint',
    format: 'format',
    start: 'start',
    dev: 'dev'
  })
});

const TARGET_DOCTOR_FILE = Object.freeze({
  packageJson: 'package.json',
  runtimeNamespace: '.agent-onboard/runtime-namespace.json',
  runtimeProject: '.agent-onboard/project.json',
  workItems: '.agent-onboard/work-items.json',
  agentsMd: 'AGENTS.md',
  llmsTxt: 'llms.txt',
  authorityPath: '.agent-onboard/authority-path.json'
});

const TARGET_DOCTOR_SCHEMA = Object.freeze({
  runtimeNamespace: 'agent-onboard-target-runtime-namespace-001',
  runtimeProject: 'agent-onboard-target-runtime-project-001',
  workItems: 'agent-onboard-target-work-items-001',
  authorityPath: 'agent-onboard-authority-path-001'
});

const TARGET_DOCTOR_PACKAGE_MANAGER_FILES = freezeEntries([
  { name: 'npm', file: 'package-lock.json' },
  { name: 'pnpm', file: 'pnpm-lock.yaml' },
  { name: 'yarn', file: 'yarn.lock' },
  { name: 'bun', file: 'bun.lockb' },
  { name: 'bun', file: 'bun.lock' }
]);

const TARGET_DOCTOR_LANGUAGE_MARKERS = freezeEntries([
  { name: 'node', files: Object.freeze(['package.json']) },
  { name: 'typescript', files: Object.freeze(['tsconfig.json']) },
  { name: 'python', files: Object.freeze(['pyproject.toml', 'requirements.txt', 'Pipfile']) },
  { name: 'go', files: Object.freeze(['go.mod']) },
  { name: 'rust', files: Object.freeze(['Cargo.toml']) },
  { name: 'java', files: Object.freeze(['pom.xml', 'build.gradle', 'build.gradle.kts']) },
  { name: 'dotnet', files: Object.freeze(['global.json']) },
  { name: 'php', files: Object.freeze(['composer.json']) }
]);

const TARGET_DOCTOR_FRAMEWORK_PACKAGES = freezeEntries([
  { name: 'react', packages: Object.freeze(['react']) },
  { name: 'next', packages: Object.freeze(['next']) },
  { name: 'vue', packages: Object.freeze(['vue']) },
  { name: 'svelte', packages: Object.freeze(['svelte']) },
  { name: 'angular', packages: Object.freeze(['@angular/core']) },
  { name: 'vite', packages: Object.freeze(['vite']) },
  { name: 'express', packages: Object.freeze(['express']) },
  { name: 'fastify', packages: Object.freeze(['fastify']) },
  { name: 'nestjs', packages: Object.freeze(['@nestjs/core']) },
  { name: 'jest', packages: Object.freeze(['jest']) },
  { name: 'vitest', packages: Object.freeze(['vitest']) }
]);

const TARGET_DOCTOR_CI_FILES = freezeEntries([
  { name: 'github_actions', file: '.github/workflows' },
  { name: 'gitlab_ci', file: '.gitlab-ci.yml' },
  { name: 'circleci', file: '.circleci/config.yml' },
  { name: 'azure_pipelines', file: 'azure-pipelines.yml' }
]);

const TARGET_DOCTOR_DOC_FILES = Object.freeze(['README.md', TARGET_DOCTOR_FILE.agentsMd, TARGET_DOCTOR_FILE.llmsTxt, 'CONTRIBUTING.md']);

const TARGET_PROFILE_SCRIPT_MARKERS = freezeEntries([
  { purpose: TARGET_PROFILE.scriptPurpose.test, names: Object.freeze(['test', 'test:unit', 'test:ci', 'test:e2e']) },
  { purpose: TARGET_PROFILE.scriptPurpose.build, names: Object.freeze(['build', 'compile']) },
  { purpose: TARGET_PROFILE.scriptPurpose.lint, names: Object.freeze(['lint', 'lint:fix']) },
  { purpose: TARGET_PROFILE.scriptPurpose.format, names: Object.freeze(['format', 'fmt']) },
  { purpose: TARGET_PROFILE.scriptPurpose.start, names: Object.freeze(['start', 'serve']) },
  { purpose: TARGET_PROFILE.scriptPurpose.dev, names: Object.freeze(['dev', 'develop']) }
]);

function createTargetRuntimeService(deps) {
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
    arrayEquals
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    TARGET_ONBOARDING_SURFACE_PLAN,
    TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
    TARGET_CONFIG_FILE,
    TARGET_CONFIG_SCHEMA,
    WORK_ITEMS_SCHEMA,
    BOUNDARY_GUARD_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals
  })) {
    if (value === undefined || value === null) throw new Error(`createTargetRuntimeService missing dependency: ${name}`);
  }
function targetOnboardingDryRunFixture(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  const bootstrapPlan = planWritesForRoot(cwd, [['agent-onboard.target.json', targetConfigTemplate(cwd)]], { force: false });
  const bootstrapForcePlan = planWritesForRoot(cwd, [['agent-onboard.target.json', targetConfigTemplate(cwd)]], { force: true });
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

function agentsMdTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return `# AGENTS.md

## Agent-Onboard target repository rules

This is a target repository for agent-assisted work. Agents should treat this file as the first human-readable operating guide and treat \`agent-onboard.target.json\` as the machine-readable boundary declaration when it exists.

Target identity:

- name: \`${name}\`
- kind: \`${kind}\`
- control package: \`${PACKAGE_NAME}\`

## Read order

Before proposing or making changes, read these files when present:

1. \`AGENTS.md\`
2. \`llms.txt\`
3. \`.agent-onboard/authority-path.json\`
4. \`agent-onboard.target.json\`
5. \`.agent-onboard/project.json\`
6. \`.agent-onboard/work-items.json\`

If \`node_modules\` is missing, do not assume the package is installed locally. Prefer \`npx ${PACKAGE_NAME}@${VERSION} status\` or the package version requested by the repository owner.

## Default boundary

Forbidden by default unless the repository owner explicitly authorizes the action:

- installing, removing, or upgrading dependencies;
- running builds, tests, deploys, publishes, or pushes;
- modifying source files outside the requested scope;
- overwriting non-identical files;
- creating or mutating runtime state under \`.agent-onboard/\` except through an explicit \`agent-onboard\` command or owner request;
- treating declarative boundary files as proof that enforcement already exists.

## Operating mode

Start in read-only preview mode. Prefer a dry-run plan before writes. Use explicit write commands only when the owner requests them.

Before any dependency install, build, test, deploy, publish, push, or broad write operation, run the boundary check when \`agent-onboard.target.json\` is present:

\`\`\`sh
npx ${PACKAGE_NAME}@${VERSION} guard --check-boundary
\`\`\`

Treat a blocked guard result as a stop condition until the repository owner explicitly changes the boundary.

Inspect the public work-item ledger when present:

\`\`\`sh
npx ${PACKAGE_NAME}@${VERSION} authority --first-read

# then inspect the public work-item ledger
npx ${PACKAGE_NAME}@${VERSION} work-items --list
\`\`\`

Follow the public participation lifecycle:

1. Discover: read the operating surface listed above.
2. Inspect: understand the assigned public work item and relevant files before editing.
3. Claim: use \`work-items --claim --dry-run\` first, then \`--write\` only when explicitly authorized.
4. Work: edit only files needed for the claimed work item.
5. Validate: run only checks authorized by the owner or clearly permitted by the task.
6. Handoff: report files changed, checks run, checks not run, and known non-pass states.

If \`agents --write\` reports an existing non-identical \`AGENTS.md\`, treat that as expected overwrite protection. Do not force overwrite unless the repository owner explicitly asks for replacement.

When reporting work, distinguish clearly between:

- files inspected;
- files changed;
- checks actually run;
- checks not run;
- known non-pass states.

Do not claim a check passed unless it was actually executed in the current workspace.

## Agent-Onboard commands

Preview target initialization:

\`\`\`sh
npx ${PACKAGE_NAME}@${VERSION} init --dry-run
\`\`\`

Preview this file:

\`\`\`sh
npx ${PACKAGE_NAME}@${VERSION} agents --preview
\`\`\`

Write this file when explicitly requested:

\`\`\`sh
npx ${PACKAGE_NAME}@${VERSION} agents --write
\`\`\`

## Scope note

In the current \`0.0.x\` line, \`${PACKAGE_NAME}\` emits conventions and reference files. It does not sandbox other tools by itself and does not enforce filesystem, network, shell, Git, package-manager, CI, deployment, or publication policy for external tools.
`;
}


function firstReadOrder() {
  return PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((entry) => ({
    order: entry.order,
    path: entry.path,
    role: entry.role,
    required_when_present: entry.required_when_present
  }));
}

function llmsTxtTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return `# ${name} agent-onboard first-read entrypoint

This repository uses ${PACKAGE_NAME} public authority ordering for human and AI-assisted work.

Target:

- name: ${name}
- kind: ${kind}
- control package: ${PACKAGE_NAME}@${VERSION}

First-read order:

1. AGENTS.md ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â human and agent operating rules.
2. llms.txt ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â AI-readable public entrypoint.
3. .agent-onboard/authority-path.json ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â machine-readable authority path index.
4. agent-onboard.target.json ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â target boundary declaration.
5. .agent-onboard/runtime-namespace.json ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â target runtime namespace declaration.
6. .agent-onboard/project.json ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â target runtime identity.
7. .agent-onboard/work-items.json ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â public work item ledger.
8. README.md ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â public package or repository documentation.
9. Raw evidence/source files ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â on demand only after the authority files above.

Default boundary: start read-only. Do not install dependencies, run builds/tests/deploys, publish, push, or overwrite non-identical files unless the repository owner explicitly authorizes that action.
`;
}

function authorityPathTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return {
    schema: 'agent-onboard-authority-path-001',
    package_name: PACKAGE_NAME,
    package_version: VERSION,
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    target: { name, root: '.', kind },
    command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.command,
    check_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.check_command,
    first_read_order: firstReadOrder(),
    canonical_authority_files: PUBLIC_AUTHORITY_FIRST_READ_INDEX.source_files.slice(),
    boundary: {
      start_mode: 'read_only_preview',
      writes_require_explicit_owner_authorization: true,
      dependency_install_requires_owner_authorization: true,
      build_test_deploy_requires_owner_authorization: true,
      publish_push_requires_owner_authorization: true,
      raw_evidence_is_on_demand_only: true
    }
  };
}

  const targetRuntimeUtilities = createTargetRuntimeUtilities({
    version: VERSION,
    targetConfigFile: TARGET_CONFIG_FILE,
    targetConfigSchema: TARGET_CONFIG_SCHEMA,
    workItemsSchema: WORK_ITEMS_SCHEMA,
    boundaryGuardContract: BOUNDARY_GUARD_CONTRACT
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
    guardResultBase
  } = targetRuntimeUtilities;
function targetName(cwd) {
  try {
    const pkg = readJson(path.join(cwd, 'package.json'));
    return [pkg.name || path.basename(cwd), 'node'];
  } catch {
    return [path.basename(cwd) || 'target-repo', 'generic'];
  }
}

function targetConfigTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return {
    schema: 'agent-onboard-target-config-001',
    control: {
      package_name: PACKAGE_NAME,
      requested_mode: 'target_dry_run',
      authority_level: 'L1_read_only_preview'
    },
    project: { name, kind },
    boundaries: {
      writes_allowed: false,
      managed_project_commands_allowed: 0,
      create_agent_onboard_runtime_state: false,
      install_dependencies: false,
      run_build_test_deploy: false,
      publish_or_push: false
    },
    surfaces: {
      include: [
        'package.json',
        'agent-onboard.target.json',
        '.agent-onboard/runtime-namespace.json',
        '.agent-onboard/project.json',
        '.agent-onboard/work-items.json',
        'AGENTS.md',
        'llms.txt',
        '.agent-onboard/authority-path.json'
      ],
      exclude: ['node_modules', '.git', 'dist', 'build', '.venv', '.lake']
    }
  };
}

function targetRuntimeNamespaceTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return {
    schema: 'agent-onboard-target-runtime-namespace-001',
    package_name: PACKAGE_NAME,
    package_version: VERSION,
    release_line: PUBLIC_TARGET_RUNTIME_NAMESPACE.release_line,
    target: { name, root: '.', kind },
    command: PUBLIC_TARGET_RUNTIME_NAMESPACE.command,
    check_command: PUBLIC_TARGET_RUNTIME_NAMESPACE.check_command,
    namespace_root: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_root,
    namespace_file: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file,
    canonical_runtime_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.canonical_runtime_files.map((entry) => ({
      path: entry.path,
      domain: entry.domain,
      role: entry.role,
      kind: entry.kind,
      required: entry.required,
      written_by: entry.written_by
    })),
    top_level_authority_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.top_level_authority_files.slice(),
    reserved_future_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.reserved_future_files.map((entry) => ({
      path: entry.path,
      domain: entry.domain,
      status: entry.status
    })),
    boundary: {
      writes_require_explicit_write_flag: true,
      reserved_future_files_not_written_by_target_onboarding: true,
      dependency_install_requires_owner_authorization: true,
      build_test_deploy_requires_owner_authorization: true,
      publish_push_requires_owner_authorization: true
    }
  };
}

function runtimeProjectTemplate(cwd = process.cwd()) {
  const [name, kind] = targetName(cwd);
  return {
    schema: 'agent-onboard-target-runtime-project-001',
    package_name: PACKAGE_NAME,
    target: { name, root: '.', kind },
    authority: {
      level: 'L1_read_only_preview',
      writes_require_explicit_write_flag: true
    }
  };
}

function workItemsTemplate() {
  return {
    schema: 'agent-onboard-target-work-items-001',
    package_name: PACKAGE_NAME,
    vocabulary: {
      program: {
        prefix: 'P',
        name: 'Program',
        description: 'A top-level line of coordinated work inside a target repo.'
      },
      stage: {
        prefix: 'S',
        name: 'Stage',
        description: 'A phase within a program.'
      },
      milestone: {
        prefix: 'M',
        name: 'Milestone',
        description: 'A bounded delivery checkpoint within a stage.'
      },
      work_item: {
        prefix: 'W',
        name: 'Work Item',
        description: 'A concrete unit of agent-addressable work within a milestone.'
      }
    },
    programs: [],
    stages: [],
    milestones: [],
    work_items: []
  };
}

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
    targetRepair,
    targetProfile,
    targetProfileData,
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
    targetRepairPlanForRoot,
    targetRepairPlan,
    performTargetRepairWrites,
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
  });
}

module.exports = {
  createTargetRuntimeService
};
