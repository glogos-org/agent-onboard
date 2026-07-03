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

function createTargetTemplatesService(deps) {
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

  return Object.freeze({
    agentsMdTemplate,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    targetName,
    targetConfigTemplate,
    targetRuntimeNamespaceTemplate,
    runtimeProjectTemplate,
    workItemsTemplate
  });
}

module.exports = {
  createTargetTemplatesService
};
