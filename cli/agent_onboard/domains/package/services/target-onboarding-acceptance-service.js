'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function createPublicTargetOnboardingAcceptanceService(deps) {
  const {
    VERSION,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE,
    PUBLIC_PACKAGE_SURFACE_PRESERVATION,
    TARGET_ONBOARDING_SURFACE_PLAN,
    TARGET_CONFIG_FILE,
    packageRoot,
    sourceContext,
    sourceWorkItemsLedgerCheck,
    publicReleaseCheck,
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
  } = deps;

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
  return Object.freeze({
    publicReleaseTargetRepoProductCheck,
    publicInstalledPackageParitySmoke,
    publicInstalledParityArchitectureSmoke,
    publicTargetOnboardingInstalledPackageSmoke,
    publicTargetOnboardingPostPublishHandoff,
    publicTargetOnboardingPublishedAcceptance
  });
}

module.exports = Object.freeze({
  createPublicTargetOnboardingAcceptanceService
});
