'use strict';

module.exports = function registerFullSourceShard(fullSourceTest, context) {
  const {
    assert,
    fs,
    os,
    path,
    spawnSync,
    ROOT,
    CLI,
    PACKAGE_JSON,
    EXPECTED_VERSION,
    EXPECTED_RELEASE_LINE,
    EXPECTED_VERSIONED_NPX,
    TARGET_CONFIG_FILE,
    EXPECTED_PACK_FILES,
    EXPECTED_PACK_FILES_SORTED,
    copyExpectedPackFiles,
    run,
    targetConfigPath,
    writeTargetConfig,
    readJsonOutput,
    readJsonFailure,
    readJsonlFile,
    readClosureArchiveByRef,
    runNpmPackDryRun,
    runNpm,
    packSourceTarball,
    runNodeScript,
    tempRepo,
    cliTargetConfigForTest,
    writeWorkItemsLedger
  } = context;

  fullSourceTest('full source block line 662', () => {
    const result = run(['release', '--architecture-parity-smoke']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-installed-parity-architecture-smoke-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --architecture-parity-smoke');
    assert.strictEqual(output.parity.architecture_check, true);
    assert.strictEqual(output.parity.target_runtime_namespace_check, true);
    assert.strictEqual(output.parity.package_surface_check, true);
    assert.strictEqual(output.parity.packaged_router_port_check, true);
    assert.strictEqual(output.parity.retired_m3_architecture_checks_skipped, true);
    assert.strictEqual(output.observed.packaged_router_port_status, 'ok');
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.strictEqual(output.boundary.creates_temp_files, false);
  });


  fullSourceTest('full source block line 681', () => {
    const result = run(['release', '--target-onboarding-smoke']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-installed-package-smoke-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --target-onboarding-smoke');
    assert.strictEqual(output.observed.package_context, 'source_repository');
    assert.strictEqual(output.validated.package_release_check, true);
    assert.strictEqual(output.validated.target_onboarding_plan, true);
    assert.strictEqual(output.validated.target_onboarding_fixture, true);
    assert.strictEqual(output.validated.explicit_write_performed_in_temporary_target, true);
    assert.strictEqual(output.validated.canonical_target_files_only, true);
    assert.strictEqual(output.validated.target_boundary_config_passes, true);
    assert.strictEqual(output.validated.temporary_target_cleanup, true);
    assert.strictEqual(output.boundary.writes_package_root, false);
    assert.strictEqual(output.boundary.creates_temp_target_repository, true);
    assert.strictEqual(output.boundary.cleans_up_temp_target_repository, true);
    assert.strictEqual(output.boundary.runs_package_manager, false);
  });


  fullSourceTest('full source block line 703', () => {
    const result = run(['release', '--post-publish-handoff']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-post-publish-verification-handoff-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --post-publish-handoff');
    assert.strictEqual(output.source_context.package_context, 'source_repository');
    assert.ok(output.verification_commands.includes('npm view agent-onboard version dist-tags'));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --post-publish-handoff`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --published-acceptance`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --real-target-trial`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --architecture-parity-smoke`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --target-onboarding-smoke`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --partition-plan`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --partition-check`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --extraction-rehearsal`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --extraction-check`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target runtime --namespace`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target runtime --check`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --surface`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --surface-check`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --source-manifest`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --source-manifest-check`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target onboarding --plan`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target onboarding --fixture`));
    assert.ok(output.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target onboarding --trial`));
    assert.strictEqual(output.acceptance_criteria.latest_dist_tag_matches_version, true);
    assert.strictEqual(output.acceptance_criteria.target_onboarding_plan_and_fixture_pass_from_registry_package, true);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.strictEqual(output.boundary.mutates_registry, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 738', () => {
    const result = run(['release', '--published-acceptance']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-published-package-acceptance-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --published-acceptance');
    assert.strictEqual(output.source_context.package_context, 'source_repository');
    assert.strictEqual(output.acceptance_mode, 'source_repository_rehearsal');
    assert.strictEqual(output.validated.release_check, true);
    assert.strictEqual(output.validated.post_publish_handoff, true);
    assert.strictEqual(output.validated.parity_smoke, true);
    assert.strictEqual(output.validated.architecture_parity_smoke, true);
    assert.strictEqual(output.validated.target_onboarding_smoke, true);
    assert.strictEqual(output.validated.target_onboarding_plan, true);
    assert.strictEqual(output.validated.target_onboarding_fixture, true);
    assert.strictEqual(output.validated.real_target_trial, true);
    assert.strictEqual(output.validated.handoff_includes_published_acceptance_command, true);
    assert.strictEqual(output.acceptance_criteria.run_after_publish_with_version_pinned_npx, `${EXPECTED_VERSIONED_NPX} release --published-acceptance`);
    assert.strictEqual(output.boundary.mutates_registry, false);
    assert.strictEqual(output.boundary.installs_dependencies, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 763', () => {
    const result = run(['release', '--real-target-trial']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-real-target-repo-trial-gate-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard release --real-target-trial');
    assert.strictEqual(output.validated.target_onboarding_trial_status, true);
    assert.strictEqual(output.validated.target_ready_for_explicit_write, true);
    assert.strictEqual(output.validated.canonical_files_projected_only, true);
    assert.strictEqual(output.validated.trial_writes_no_files, true);
    assert.strictEqual(output.boundary.writes_target_repository_state, false);
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 780', () => {
    const result = run(['release', '--check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.schema, 'agent-onboard-public-release-check-result-019');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.validated.package_metadata, true);
    assert.strictEqual(output.validated.projected_pack_allowlist, true);
    assert.strictEqual(output.validated.public_artifact_messaging, true);
    assert.strictEqual(output.validated.source_work_items_ledger, true);
    assert.strictEqual(output.source_context.package_context, 'source_repository');
    assert.strictEqual(output.source_work_items_ledger.present, true);
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.id === ['P', 1, 'S', 3, 'M', 3, 'W', 19].join(''))); // W19 closed before this gate
    assert.ok(output.validated.public_package_surface_preservation);
    assert.ok(output.validated.public_installed_parity_architecture_smoke);
    assert.ok(output.validated.public_architecture_map);
    assert.ok(output.validated.public_command_router);
    assert.ok(output.validated.public_domain_service_facades);
    assert.ok(output.validated.public_target_runtime_namespace);
    assert.ok(output.validated.target_repo_product_surface);
    assert.ok(output.validated.target_doctor);
    assert.ok(output.validated.target_profile);
    assert.ok(output.validated.target_repair_plan);
    assert.ok(output.validated.target_onboarding_plan);
    assert.ok(output.validated.target_onboarding_fixture);
    assert.ok(output.validated.historical_source_extraction_release_checks_retired);
    assert.strictEqual(output.target_repo_product.status, 'ok');
    assert.strictEqual(output.target_repo_product.target_doctor.readiness.status, 'ready');
    assert.strictEqual(output.target_repo_product.target_repair_plan.writes_performed, false);
    assert.ok(output.retired_release_checks.includes('source_module_extraction_installed_fallback_smoke'));
    assert.ok(output.retired_release_checks.includes('claims_domain_source_extraction_plan'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.id === ['P', 1, 'S', 3, 'M', 2, 'W', 12].join('')));
    assert.ok(output.validated.public_version_reference_policy);
    assert.strictEqual(output.public_architecture.status, 'ok');
    assert.strictEqual(output.public_architecture.check_scope.mode, 'retired_m3_checker_reduced');
    assert.strictEqual(output.public_architecture.validated.historical_source_extraction_checks_retired, true);
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public installed parity architecture smoke gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding real target repo trial gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding published package acceptance gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding post-publish verification handoff gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding installed package smoke gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding explicit write boundary gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public target onboarding surface planning gate'));
    assert.ok(!output.source_work_items_ledger.open_work_items.some((item) => item.title === 'Public installed package parity smoke gate'));
    assert.deepStrictEqual(output.expected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.deepStrictEqual(output.projected_pack_files.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(output.boundary.mutates_registry, false);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 840', () => {
    const dir = tempRepo();
    const result = run(['target', 'onboarding', '--plan'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-surface-plan-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target onboarding --plan');
    assert.strictEqual(output.target.name, 'target-fixture');
    assert.ok(output.canonical_files.includes('.agent-onboard/target.json'));
    assert.ok(output.canonical_files.includes('.agent-onboard/runtime-namespace.json'));
    assert.ok(output.canonical_files.includes('.agent-onboard/project.json'));
    assert.ok(output.canonical_files.includes('.agent-onboard/work-items.json'));
    assert.ok(output.canonical_files.includes('AGENTS.md'));
    assert.ok(output.phases.some((phase) => phase.id === 'discover_target_surface'));
    assert.ok(output.phases.some((phase) => phase.command === 'agent-onboard init --dry-run'));
    assert.ok(output.phases.some((phase) => phase.command === 'agent-onboard target bootstrap --write'));
    assert.strictEqual(output.boundary.plan_writes_files, false);
    assert.strictEqual(output.boundary.write_commands_require_explicit_write_flag, true);
    assert.ok(output.phases.some((phase) => phase.command === 'agent-onboard target onboarding --write'));
    assert.strictEqual(output.planned_files.length, 7);
    assert.deepStrictEqual(output.planned_files.map((item) => item.path), ['.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'AGENTS.md', 'llms.txt', '.agent-onboard/authority-path.json']);
  });


  fullSourceTest('target memory previews bounded repo memory surfaces without importing contents', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'agent instructions should not be copied into the descriptor\n');
    fs.writeFileSync(path.join(dir, 'llms.txt'), '# target ai entrypoint\n');
    fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'copilot-instructions.md'), 'copilot instructions should stay out of stdout\n');
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify({ schema: 'fixture', work_items: [] }, null, 2) + '\n');

    const result = run(['target', 'memory', '--preview', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-memory-preview-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target memory --preview');
    assert.strictEqual(output.command_family, 'target memory');
    assert.strictEqual(output.target.primary_manifest, 'package.json');
    assert.strictEqual(output.target.ecosystem, 'node-npm');
    assert.ok(output.surfaces.some((surface) => surface.path === 'AGENTS.md' && surface.present && surface.content_imported === false));
    assert.ok(output.surfaces.some((surface) => surface.path === 'llms.txt' && surface.present && surface.authority === 'candidate_discovery'));
    assert.ok(output.surfaces.some((surface) => surface.path === '.github/copilot-instructions.md' && surface.present && surface.read_policy === 'metadata_only_in_this_command'));
    assert.ok(output.summary.present_surfaces.includes('.agent-onboard/work-items.json'));
    assert.strictEqual(output.memory_model.hidden_model_memory_is_authority, false);
    assert.strictEqual(output.memory_model.chat_history_is_authority, false);
    assert.strictEqual(output.output_policy.file_contents_inlined, false);
    assert.strictEqual(output.boundary.reads_file_contents, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.scans_arbitrary_private_files, false);
    assert.strictEqual(output.boundary.network, false);
    assert.strictEqual(result.stdout.includes('agent instructions should not be copied'), false);
    assert.strictEqual(result.stdout.includes('copilot instructions should stay out'), false);

    const jsonResult = run(['target', 'memory', '--json', '--target', dir]);
    assert.strictEqual(readJsonOutput(jsonResult).schema, 'agent-onboard-public-target-memory-preview-001');

    const textResult = run(['target', 'memory', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target memory'));
    assert.ok(textResult.stdout.includes('metadata-only preview'));
    assert.ok(textResult.stdout.includes('AGENTS.md'));
    assert.strictEqual(textResult.stdout.includes('agent instructions should not be copied'), false);
  });


  fullSourceTest('target doctor reports target repo readiness without writes', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'target-fixture',
      private: true,
      packageManager: 'npm@10.0.0',
      scripts: { test: 'node test.js' },
      dependencies: { react: '^19.0.0' },
      devDependencies: { vite: '^7.0.0' }
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}\n');
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}\n');

    const result = run(['target', 'doctor', '--json', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-target-doctor-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.command, 'agent-onboard target doctor --json');
    assert.strictEqual(output.command_family, 'target doctor');
    assert.strictEqual(output.target.name, 'target-fixture');
    assert.strictEqual(output.readiness.status, 'needs_onboarding');
    assert.ok(output.readiness.missing_files.includes('.agent-onboard/target.json'));
    assert.ok(output.readiness.missing_files.includes('.agent-onboard/work-items.json'));
    assert.ok(output.profile.package_managers.some((manager) => manager.name === 'npm'));
    assert.ok(output.profile.languages.some((language) => language.name === 'node'));
    assert.ok(output.profile.languages.some((language) => language.name === 'typescript'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'react'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'vite'));
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.strictEqual(output.boundary.runs_build_test_deploy, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard')), false);

    const textResult = run(['target', 'doctor', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target doctor'));
    assert.ok(textResult.stdout.includes('Readiness: needs_onboarding'));
    assert.ok(textResult.stdout.includes('Missing: .agent-onboard/target.json'));
    assert.ok(textResult.stdout.includes('Writes performed: false'));
  });


  fullSourceTest('target profile detects stack markers without running target commands', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'profile-fixture',
      private: true,
      packageManager: 'npm@10.0.0',
      scripts: {
        test: 'vitest run',
        build: 'vite build',
        lint: 'eslint .',
        dev: 'vite'
      },
      dependencies: {
        react: '^19.0.0',
        next: '^15.0.0'
      },
      devDependencies: {
        vite: '^7.0.0',
        vitest: '^3.0.0'
      }
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}\n');
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}\n');
    fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'README.md'), '# Profile fixture\n');

    const result = run(['target', 'profile', '--json', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-target-profile-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.command, 'agent-onboard target profile --json');
    assert.strictEqual(output.command_family, 'target profile');
    assert.strictEqual(output.target.name, 'profile-fixture');
    assert.ok(output.profile.package_managers.some((manager) => manager.name === 'npm'));
    assert.ok(output.profile.languages.some((language) => language.name === 'node'));
    assert.ok(output.profile.languages.some((language) => language.name === 'typescript'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'react'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'next'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'vite'));
    assert.ok(output.profile.frameworks.some((framework) => framework.name === 'vitest'));
    assert.ok(output.profile.scripts.some((entry) => entry.purpose === 'test' && entry.scripts.includes('test')));
    assert.ok(output.profile.scripts.some((entry) => entry.purpose === 'build' && entry.scripts.includes('build')));
    assert.ok(output.profile.scripts.some((entry) => entry.purpose === 'lint' && entry.scripts.includes('lint')));
    assert.ok(output.profile.scripts.some((entry) => entry.purpose === 'dev' && entry.scripts.includes('dev')));
    assert.ok(output.profile.ci.some((entry) => entry.name === 'github_actions'));
    assert.ok(output.profile.docs.includes('README.md'));
    assert.strictEqual(output.summary.frameworks, 4);
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.boundary.runs_package_manager, false);
    assert.strictEqual(output.boundary.runs_build_test_deploy, false);
    assert.strictEqual(output.validated.managed_project_commands_not_run, true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard')), false);

    const textResult = run(['target', 'profile', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target profile'));
    assert.ok(textResult.stdout.includes('Package managers: npm'));
    assert.ok(textResult.stdout.includes('Frameworks: react, next, vite, vitest'));
    assert.ok(textResult.stdout.includes('  - test: test'));
    assert.ok(textResult.stdout.includes('Writes performed: false'));
  });


  fullSourceTest('target metadata validates pilot-style manifest and comment-header metadata without writes', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'README.md'), [
      '<!--',
      'file_urn: urn:pilot:file:readme-md-test',
      'metadata:',
      '  role: root navigation portal',
      '-->',
      '# Target fixture',
      ''
    ].join('\n'));
    fs.writeFileSync(path.join(dir, 'SOURCE_OF_TRUTH.md'), [
      '<!--',
      'file_urn: urn:pilot:source-of-truth-test',
      'metadata:',
      '  current_work_item: none',
      '-->',
      '# Source of Truth',
      ''
    ].join('\n'));
    fs.writeFileSync(path.join(dir, 'llms.txt'), 'Target metadata fixture\n');
    fs.writeFileSync(path.join(dir, 'authority-map.json'), JSON.stringify({
      authorities: {
        'urn:pilot:file:readme-md-test': { file_path: 'README.md' },
        'urn:pilot:source-of-truth-test': { file_path: 'SOURCE_OF_TRUTH.md' }
      }
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
      schema: 'pilot-repo-content-manifest-002',
      files: {
        'urn:pilot:file:readme-md-test': {
          file_urn: 'urn:pilot:file:readme-md-test',
          file_path: 'README.md',
          file_id: 'ni:///sha-256;abc'
        },
        'urn:pilot:source-of-truth-test': {
          file_urn: 'urn:pilot:source-of-truth-test',
          file_path: 'SOURCE_OF_TRUTH.md',
          file_id: 'ni:///sha-256;def'
        }
      },
      exclusions: [
        { file_path: 'manifest.json', reason: 'generated manifest' }
      ]
    }, null, 2) + '\n');

    const plan = readJsonOutput(run(['target', 'metadata', '--plan', '--target', dir]));
    assert.strictEqual(plan.schema, 'agent-onboard-target-metadata-plan-result-001');
    assert.strictEqual(plan.status, 'ok');
    assert.strictEqual(plan.manifest_contract.files_shape, 'object_keyed_by_file_urn');
    assert.strictEqual(plan.metadata_policy.profile, 'default');
    assert.strictEqual(plan.metadata_policy.adopt_existing, false);
    assert.ok(plan.next_steps.some((step) => step.includes('target metadata --check')));

    const result = run(['target', 'metadata', '--check', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-target-metadata-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.command, 'agent-onboard target metadata --check');
    assert.strictEqual(output.command_family, 'target metadata');
    assert.strictEqual(output.validated.manifest_absent_or_v2_shape, true);
    assert.strictEqual(output.validated.authority_map_absent_or_valid, true);
    assert.strictEqual(output.validated.markdown_admin_metadata_not_visible, true);
    assert.strictEqual(output.validated.work_item_semantics_delegated_to_agent_onboard, true);
    assert.strictEqual(output.manifest.file_count, 2);
    assert.strictEqual(output.manifest.keyed_by_file_urn, true);
    assert.strictEqual(output.authority_map.authority_count, 2);
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.boundary.writes_files, false);
  });


  fullSourceTest('target metadata flags legacy manifest fields and visible markdown admin metadata', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'README.md'), [
      '---',
      'file_urn: urn:pilot:file:readme-md-test',
      'status: draft',
      '---',
      '# Target fixture',
      ''
    ].join('\n'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
      schema: 'pilot-repo-content-manifest-001',
      files: [
        {
          urn: 'urn:pilot:file:readme-md-test',
          path: 'README.md',
          file_id: 'ni:///sha-256;abc',
          sha256: 'abc'
        }
      ],
      exclusions: [
        { path: 'manifest.json', reason: 'generated manifest' }
      ]
    }, null, 2) + '\n');

    const result = run(['target', 'metadata', '--check', '--target', dir]);
    const output = readJsonFailure(result);
    assert.strictEqual(result.status, 1);
    assert.strictEqual(output.status, 'error');
    assert.ok(output.errors.some((error) => error.includes('files must not be a legacy array')));
    assert.ok(output.errors.some((error) => error.includes('README.md must keep file_urn')));
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard')), false);
  });


  fullSourceTest('target metadata write generates manifest authority files and refuses conflicts', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'README.md'), '# Target fixture\n');
    const write = run(['target', 'metadata', '--write', '--target', dir]);
    const output = readJsonOutput(write);
    assert.strictEqual(output.schema, 'agent-onboard-target-metadata-write-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.command, 'agent-onboard target metadata --write');
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    assert.ok(fs.existsSync(path.join(dir, 'SOURCE_OF_TRUTH.md')));
    assert.ok(fs.existsSync(path.join(dir, 'authority-map.json')));
    assert.ok(fs.existsSync(path.join(dir, 'manifest.json')));

    const check = readJsonOutput(run(['target', 'metadata', '--check', '--target', dir]));
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.metadata_surface_present, true);
    assert.ok(check.manifest.file_count >= 4);

    fs.writeFileSync(path.join(dir, 'manifest.json'), '{}\n');
    const conflict = readJsonFailure(run(['target', 'metadata', '--write', '--target', dir]));
    assert.strictEqual(conflict.status, 'error');
    assert.deepStrictEqual(conflict.conflicts, ['manifest.json']);
    assert.strictEqual(conflict.writes_performed, false);

    const force = readJsonOutput(run(['target', 'metadata', '--write', '--force', '--target', dir]));
    assert.strictEqual(force.status, 'ok');
    assert.strictEqual(force.force, true);
  });


  fullSourceTest('target metadata write respects target policy and preserves target-owned source authority', () => {
    const dir = tempRepo();
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'README.md'), '# Target fixture\n');
    const sourceOfTruthPath = path.join(dir, 'SOURCE_OF_TRUTH.md');
    const sourceOfTruth = [
      '# Pilot Source',
      '',
      'Target-owned authority semantics stay here.',
      ''
    ].join('\n');
    fs.writeFileSync(sourceOfTruthPath, sourceOfTruth);
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'metadata-policy.json'), JSON.stringify({
      metadata: {
        manifest_schema: 'pilot-repo-content-manifest-002',
        authority_map_schema: 'pilot-authority-and-file-urn-map-002',
        urn_namespace: 'urn:pilot:file',
        include_control_state: true,
        include_manifest_in_authority_map: true,
        preserve_source_of_truth: true
      }
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'authority-map.json'), JSON.stringify({
      schema: 'legacy-pilot-authority-map',
      authorities: [
        {
          class: 'source-of-truth',
          path: 'SOURCE_OF_TRUTH.md',
          urn: 'urn:pilot:source-of-truth'
        }
      ],
      metadata_policy: {
        authority_semantics: 'target_owned'
      }
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
      schema: 'legacy-pilot-manifest',
      files: {}
    }, null, 2) + '\n');

    const result = run(['target', 'metadata', '--write', '--policy', '.agent-onboard/metadata-policy.json', '--adopt-existing', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.metadata_policy.source, 'explicit_policy_file');
    assert.strictEqual(output.metadata_policy.urn_namespace, 'urn:pilot:file');
    assert.strictEqual(output.metadata_policy.manifest_schema, 'pilot-repo-content-manifest-002');
    assert.strictEqual(output.metadata_policy.authority_map_schema, 'pilot-authority-and-file-urn-map-002');
    assert.strictEqual(output.adopt_existing, true);
    assert.strictEqual(fs.readFileSync(sourceOfTruthPath, 'utf8'), sourceOfTruth);

    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    assert.strictEqual(manifest.schema, 'pilot-repo-content-manifest-002');
    assert.ok(Object.keys(manifest.files).some((urn) => urn.startsWith('urn:pilot:file:readme-md-')));
    assert.ok(Object.values(manifest.files).every((entry) => entry.file_id.startsWith('ni:///sha-256;')));

    const authorityMap = JSON.parse(fs.readFileSync(path.join(dir, 'authority-map.json'), 'utf8'));
    assert.strictEqual(authorityMap.schema, 'pilot-authority-and-file-urn-map-002');
    assert.strictEqual(authorityMap.authorities[0].urn, 'urn:pilot:source-of-truth');
    assert.strictEqual(authorityMap.metadata_policy.authority_semantics, 'target_owned');
    assert.ok(authorityMap.file_urns.some((entry) => entry.file_path === 'manifest.json' && entry.file_urn.startsWith('urn:pilot:file:manifest-json-')));
  });


  fullSourceTest('target manifest initializes, detects drift, and refreshes content-addressed file ids', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-target-manifest-'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'manifest-fixture' }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), "console.log('one');\n");
    fs.mkdirSync(path.join(dir, 'node_modules', 'ignored'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'ignored', 'file.js'), 'ignored\n');

    const missing = readJsonFailure(run(['target', 'manifest', '--check-drift', '--target', dir]));
    assert.strictEqual(missing.schema, 'agent-onboard-target-manifest-drift-check-result-001');
    assert.strictEqual(missing.status, 'error');
    assert.strictEqual(missing.manifest_exists, false);
    assert.strictEqual(missing.drift_detected, true);

    const dryRun = readJsonOutput(run(['target', 'manifest', '--init', '--target', dir, '--dry-run']));
    assert.strictEqual(dryRun.status, 'ok');
    assert.strictEqual(dryRun.mode, 'dry-run');
    assert.strictEqual(dryRun.manifest_written, false);
    assert.ok(dryRun.manifest_preview.entries.some((entry) => entry.file_path === 'src/index.js'));
    assert.ok(dryRun.manifest_preview.entries.every((entry) => entry.file_id.startsWith('ni:///sha-256;')));
    assert.ok(dryRun.manifest_preview.entries.every((entry) => !Object.prototype.hasOwnProperty.call(entry, 'sha256')));
    assert.ok(dryRun.manifest_preview.entries.every((entry) => !entry.file_path.startsWith('node_modules/')));

    const init = readJsonOutput(run(['target', 'manifest', '--init', '--target', dir, '--write']));
    assert.strictEqual(init.status, 'ok');
    assert.strictEqual(init.manifest_written, true);
    const manifestPath = path.join(dir, '.agent-onboard', 'target-manifest.json');
    assert.ok(fs.existsSync(manifestPath));

    const clean = readJsonOutput(run(['target', 'manifest', '--check-drift', '--target', dir]));
    assert.strictEqual(clean.status, 'ok');
    assert.strictEqual(clean.drift_detected, false);

    fs.writeFileSync(path.join(dir, 'src', 'index.js'), "console.log('two');\n");
    const drift = readJsonFailure(run(['target', 'manifest', '--check-drift', '--target', dir]));
    assert.strictEqual(drift.status, 'error');
    assert.strictEqual(drift.drift_detected, true);
    assert.ok(drift.diff.changed_entries.some((entry) => entry.file_path === 'src/index.js'));

    const refresh = readJsonOutput(run(['target', 'manifest', '--refresh', '--target', dir, '--write']));
    assert.strictEqual(refresh.status, 'ok');
    assert.strictEqual(refresh.manifest_written, true);
    assert.strictEqual(refresh.drift_after_write, false);

    const cleanAgain = readJsonOutput(run(['target', 'manifest', '--check-drift', '--target', dir]));
    assert.strictEqual(cleanAgain.status, 'ok');
    assert.strictEqual(cleanAgain.drift_detected, false);
  });


  fullSourceTest('source repo target metadata surface validates without package expansion', () => {
    const result = run(['target', 'metadata', '--check', '--target', ROOT]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.target.name, 'agent-onboard');
    assert.strictEqual(output.metadata_surface_present, true);
    assert.strictEqual(output.manifest.path, 'manifest.json');
    assert.ok(output.manifest.file_count >= 7);
    assert.strictEqual(output.authority_map.path, 'authority-map.json');
    assert.ok(Number.isInteger(output.authority_map.authority_count));
    assert.ok(output.authority_map.file_urn_count >= 7);
    assert.strictEqual(output.validated.no_writes_performed, true);
    assert.strictEqual(output.validated.work_item_semantics_delegated_to_agent_onboard, true);
  });
};
