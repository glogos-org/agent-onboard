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

  fullSourceTest('target doctor reports ready after explicit target onboarding write', () => {
    const dir = tempRepo();
    const write = run(['target', 'onboarding', '--write'], { cwd: dir });
    const writeOutput = readJsonOutput(write);
    assert.strictEqual(writeOutput.status, 'ok');

    const result = run(['target', 'doctor', '--json', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.readiness.status, 'ready');
    assert.strictEqual(output.readiness.score, 100);
    assert.deepStrictEqual(output.readiness.missing_files, []);
    assert.deepStrictEqual(output.readiness.invalid_checks, []);
    assert.ok(output.canonical_files.every((item) => item.present));
    assert.strictEqual(output.checks.target_config.status, 'valid');
    assert.strictEqual(output.checks.boundary_config.status, 'valid');
    assert.strictEqual(output.checks.work_items.status, 'valid');
    assert.deepStrictEqual(output.checks.work_items.counts, { programs: 0, stages: 0, milestones: 0, work_items: 0 });
    assert.strictEqual(output.validated.no_writes_performed, true);
  });


  fullSourceTest('target repair plans missing onboarding files without writes', () => {
    const dir = tempRepo();
    const result = run(['target', 'repair', '--plan', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-target-repair-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.command, 'agent-onboard target repair --plan');
    assert.strictEqual(output.command_family, 'target repair');
    assert.strictEqual(output.mode, 'plan');
    assert.strictEqual(output.force, false);
    assert.strictEqual(output.target.name, 'target-fixture');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.created_files.length, 7);
    assert.deepStrictEqual(output.skipped_existing_files, []);
    assert.ok(output.repair_plan.every((item) => item.action === 'create'));
    assert.ok(output.repair_plan.every((item) => item.will_write === true));
    assert.strictEqual(output.validated.plan_mode_writes_no_files, true);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard')), false);
  });


  fullSourceTest('target repair write preserves existing non-identical onboarding files by default', () => {
    const dir = tempRepo();
    const existingConfig = '{}\n';
    writeTargetConfig(dir, existingConfig);

    const result = run(['target', 'repair', '--write', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.force, false);
    assert.strictEqual(output.writes_performed, true);
    assert.strictEqual(output.repair_outcome, 'partial_existing_files_preserved');
    assert.ok(output.skipped_existing_files.includes('.agent-onboard/target.json'));
    assert.ok(!output.written_files.includes('.agent-onboard/target.json'));
    assert.strictEqual(output.created_files.length, 6);
    assert.strictEqual(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'), existingConfig);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.json')), true);
    assert.strictEqual(output.boundary.skips_existing_non_identical_files_by_default, true);
    assert.strictEqual(output.boundary.overwrites_existing_files, false);
  });


  fullSourceTest('target repair force overwrites existing non-identical onboarding files only when explicit', () => {
    const dir = tempRepo();
    writeTargetConfig(dir, '{}\n');

    const result = run(['target', 'repair', '--write', '--force', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.force, true);
    assert.ok(output.overwritten_files.includes('.agent-onboard/target.json'));
    assert.ok(output.written_files.includes('.agent-onboard/target.json'));
    assert.deepStrictEqual(output.skipped_existing_files, []);
    const config = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'));
    assert.strictEqual(config.schema, 'agent-onboard-target-config-001');
    assert.strictEqual(output.boundary.overwrites_existing_files, true);
  });


  fullSourceTest('full source block line 865', () => {
    const dir = tempRepo();
    const result = run(['target', 'onboarding', '--fixture'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-dry-run-fixture-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target onboarding --fixture');
    assert.strictEqual(output.fixture_matrix.schema, 'agent-onboard-public-target-onboarding-fixture-matrix-002');
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_bootstrap_dry_run_empty_target'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_bootstrap_conflict_dry_run'));
    assert.ok(output.fixture_matrix.fixtures.some((fixture) => fixture.id === 'target_onboarding_explicit_write_empty_target'));
    assert.strictEqual(output.boundary.fixture_writes_files, false);
    assert.strictEqual(output.boundary.validates_force_preview_without_write, true);
    assert.deepStrictEqual(output.observed_target_projection.target_bootstrap_dry_run.planned_writes.map((item) => item.action), ['create']);
    assert.deepStrictEqual(output.observed_target_projection.target_instance_takeover_dry_run.planned_writes.map((item) => item.action), ['create', 'create', 'create']);
    assert.deepStrictEqual(output.observed_target_projection.agents_preview.planned_writes.map((item) => item.action), ['create']);
    assert.deepStrictEqual(output.observed_target_projection.target_onboarding_explicit_write_projection.planned_writes.map((item) => item.action), ['create', 'create', 'create', 'create', 'create', 'create', 'create']);
    assert.strictEqual(output.observed_target_projection.target_onboarding_explicit_write_projection.writes_performed, false);
    assert.deepStrictEqual(output.observed_target_projection.target_bootstrap_force_dry_run.planned_writes.map((item) => item.action), ['create']);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'project.json')), false);
    assert.strictEqual(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  });


  fullSourceTest('full source block line 891', () => {
    const dir = tempRepo();
    writeTargetConfig(dir, '{}\n');
    const conflict = run(['target', 'bootstrap', '--dry-run'], { cwd: dir, expectFailure: true });
    const conflictOutput = readJsonFailure(conflict);
    assert.strictEqual(conflictOutput.status, 'error');
    assert.strictEqual(conflictOutput.writes_performed, false);
    assert.deepStrictEqual(conflictOutput.conflicts, ['.agent-onboard/target.json']);
    assert.strictEqual(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'), '{}\n');

    const force = run(['target', 'bootstrap', '--dry-run', '--force'], { cwd: dir });
    const forceOutput = readJsonOutput(force);
    assert.strictEqual(forceOutput.status, 'ok');
    assert.strictEqual(forceOutput.writes_performed, false);
    assert.deepStrictEqual(forceOutput.planned_writes.map((item) => item.action), ['overwrite']);
    assert.strictEqual(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'), '{}\n');
  });


  fullSourceTest('full source block line 909', () => {
    const dir = tempRepo();
    const bootstrap = run(['target', 'bootstrap', '--dry-run'], { cwd: dir });
    const bootstrapOutput = readJsonOutput(bootstrap);
    assert.strictEqual(bootstrapOutput.status, 'ok');
    assert.strictEqual(bootstrapOutput.writes_performed, false);
    assert.deepStrictEqual(bootstrapOutput.planned_writes.map((item) => item.path), ['.agent-onboard/target.json']);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), false);

    const takeover = run(['target-instance', 'takeover', '--dry-run'], { cwd: dir });
    const takeoverOutput = readJsonOutput(takeover);
    assert.strictEqual(takeoverOutput.status, 'ok');
    assert.strictEqual(takeoverOutput.writes_performed, false);
    assert.deepStrictEqual(takeoverOutput.planned_writes.map((item) => item.path), ['.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json']);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard')), false);

    const agentsPreview = run(['agents', '--preview'], { cwd: dir });
    const agentsOutput = readJsonOutput(agentsPreview);
    assert.strictEqual(agentsOutput.status, 'ok');
    assert.strictEqual(agentsOutput.writes_performed, false);
    assert.deepStrictEqual(agentsOutput.planned_writes.map((item) => item.path), ['AGENTS.md']);
    assert.strictEqual(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  });


  fullSourceTest('full source block line 933', () => {
    const dir = tempRepo();
    const result = run(['target', 'onboarding', '--trial'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-real-target-trial-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.ready_for_explicit_write, true);
    assert.deepStrictEqual(output.conflicts, []);
    assert.deepStrictEqual(output.planned_writes.map((item) => item.path), ['.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'AGENTS.md', 'llms.txt', '.agent-onboard/authority-path.json']);
    assert.strictEqual(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  });


  fullSourceTest('full source block line 946', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Existing target instructions\n');
    const result = run(['target', 'onboarding', '--trial', '--target', dir], { cwd: ROOT });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.ready_for_explicit_write, false);
    assert.deepStrictEqual(output.conflicts, ['AGENTS.md']);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), '# Existing target instructions\n');
  });


  fullSourceTest('full source block line 958', () => {
    const dir = tempRepo();
    const result = run(['target', 'onboarding', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-onboarding-explicit-write-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.force, false);
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.written_files, ['.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'AGENTS.md', 'llms.txt', '.agent-onboard/authority-path.json']);
    assert.deepStrictEqual(output.planned_writes.map((item) => item.action), ['create', 'create', 'create', 'create', 'create', 'create', 'create']);
    assert.strictEqual(output.boundary.explicit_write_flag_required, true);
    assert.strictEqual(output.boundary.writes_only_canonical_target_onboarding_files, true);
    assert.strictEqual(output.boundary.git_mutation, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'runtime-namespace.json')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'project.json')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.json')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, 'llms.txt')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'authority-path.json')), true);
  });


  fullSourceTest('full source block line 982', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# custom instructions\n');
    const conflict = run(['target', 'onboarding', '--write'], { cwd: dir });
    const conflictOutput = readJsonFailure(conflict);
    assert.strictEqual(conflictOutput.status, 'error');
    assert.deepStrictEqual(conflictOutput.conflicts, ['AGENTS.md']);
    assert.strictEqual(conflictOutput.writes_performed, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard/target.json')), false);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), '# custom instructions\n');

    const force = run(['target', 'onboarding', '--write', '--force'], { cwd: dir });
    const forceOutput = readJsonOutput(force);
    assert.strictEqual(forceOutput.status, 'ok');
    assert.strictEqual(forceOutput.force, true);
    assert.ok(forceOutput.written_files.includes('AGENTS.md'));
    assert.deepStrictEqual(forceOutput.planned_writes.map((item) => item.action), ['create', 'create', 'create', 'create', 'overwrite', 'create', 'create']);
    assert.ok(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').includes('Agent-Onboard target repository rules'));
  });


  fullSourceTest('full source block line 1002', () => {
    const result = run(['target-config', '--validate-template']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.validated, true);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 1010', () => {
    const result = run(['work-items', '--schema']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.work_items_schema.$id, 'agent-onboard-target-work-items-001');
  });


  fullSourceTest('full source block line 1017', () => {
    const result = run(['work-items', '--template']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.canonical_file, '.agent-onboard/work-items.json');
    assert.strictEqual(output.work_items.vocabulary.program.prefix, 'P');
    assert.deepStrictEqual(output.work_items.programs, []);
    assert.deepStrictEqual(output.work_items.stages, []);
    assert.deepStrictEqual(output.work_items.milestones, []);
    assert.deepStrictEqual(output.work_items.work_items, []);
  });


  fullSourceTest('full source block line 1029', () => {
    const result = run(['work-items', '--validate-template']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.validated, true);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 1038', () => {
    const dir = tempRepo();
    const result = run(['work-items', '--init', '--dry-run'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'dry-run');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.canonical_file, '.agent-onboard/work-items.json');
    assert.strictEqual(output.planned_writes.length, 1);
    assert.strictEqual(output.planned_writes[0].path, '.agent-onboard/work-items.json');
    assert.strictEqual(output.validated_template, true);
    assert.strictEqual(output.counts.work_items, 0);
    assert.ok(!fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.json')));
  });


  fullSourceTest('full source block line 1053', () => {
    const dir = tempRepo();
    const result = run(['work-items', '--init', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    const file = path.join(dir, '.agent-onboard', 'work-items.json');
    assert.ok(fs.existsSync(file));
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.strictEqual(value.schema, 'agent-onboard-target-work-items-001');
    assert.strictEqual(value.package_name, 'agent-onboard');
    assert.deepStrictEqual(value.work_items, []);
    const validate = run(['work-items', '--validate'], { cwd: dir });
    const validation = readJsonOutput(validate);
    assert.strictEqual(validation.status, 'ok');
  });


  fullSourceTest('full source block line 1072', () => {
    const dir = tempRepo();
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), '{"foreign":true}\n');
    const result = run(['work-items', '--init', '--write'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.deepStrictEqual(output.conflicts, ['.agent-onboard/work-items.json']);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8')).foreign, true);
  });


  fullSourceTest('full source block line 1084', () => {
    const dir = tempRepo();
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), '{"foreign":true}\n');
    const result = run(['work-items', '--init', '--write', '--force'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    const value = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(value.schema, 'agent-onboard-target-work-items-001');
  });


  fullSourceTest('full source block line 1097', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const result = run([
      'work-items', '--append', '--dry-run',
      '--id', id,
      '--title', 'Public append dry-run seed',
      '--program-title', 'Public program seed',
      '--stage-title', 'Public stage seed',
      '--milestone-title', 'Public milestone seed'
    ], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'dry-run');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.counts_before.work_items, 0);
    assert.strictEqual(output.counts_after.programs, 1);
    assert.strictEqual(output.counts_after.stages, 1);
    assert.strictEqual(output.counts_after.milestones, 1);
    assert.strictEqual(output.counts_after.work_items, 1);
    assert.strictEqual(output.added.work_items[0].id, id);
    assert.strictEqual(output.proposed_ledger.work_items[0].title, 'Public append dry-run seed');
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.work_items.length, 0);
  });


  fullSourceTest('full source block line 1124', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const first = run(['work-items', '--append', '--dry-run', '--id', id, '--title', 'First'], { cwd: dir });
    const proposal = readJsonOutput(first).proposed_ledger;
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(proposal, null, 2) + '\n');
    const second = run(['work-items', '--append', '--dry-run', '--id', id, '--title', 'Duplicate'], { cwd: dir });
    const output = readJsonFailure(second);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.reason.includes('duplicate'));
  });


  fullSourceTest('full source block line 1138', () => {
    const dir = tempRepo();
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const result = run(['work-items', '--append', '--dry-run', '--id', id, '--title', 'Missing ledger'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.reason.includes('missing'));
  });


  fullSourceTest('full source block line 1148', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const result = run([
      'work-items', '--append', '--write',
      '--id', id,
      '--title', 'Public append write seed',
      '--program-title', 'Public program write seed',
      '--stage-title', 'Public stage write seed',
      '--milestone-title', 'Public milestone write seed'
    ], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.writes_performed, true);
    assert.strictEqual(output.boundary.modifies_work_items_file, true);
    assert.strictEqual(output.boundary.modifies_only_canonical_work_items_file, false);
    assert.strictEqual(output.boundary.refreshes_governance_indexes, true);
    assert.strictEqual(output.boundary.governance_index_refresh_after_admitted_write, true);
    assert.strictEqual(output.governance_index_refresh.schema, 'agent-onboard-public-target-governance-index-refresh-after-mutation-001');
    assert.strictEqual(output.governance_index_refresh.status, 'ok');
    assert.strictEqual(output.governance_index_refresh.trigger.command, 'agent-onboard work-items --append --write');
    assert.strictEqual(output.governance_index_refresh.trigger.canonical_work_items_file, true);
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.index.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'claims.index.json')));
    const refreshedWorkIndex = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.index.json'), 'utf8'));
    assert.strictEqual(refreshedWorkIndex.item_count, 1);
    assert.strictEqual(refreshedWorkIndex.next_open_work_item.id, id);
    assert.strictEqual(output.counts_before.work_items, 0);
    assert.strictEqual(output.counts_after.work_items, 1);
    assert.strictEqual(output.added.work_items[0].id, id);
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.programs[0].title, 'Public program write seed');
    assert.strictEqual(persisted.stages[0].title, 'Public stage write seed');
    assert.strictEqual(persisted.milestones[0].title, 'Public milestone write seed');
    assert.strictEqual(persisted.work_items[0].title, 'Public append write seed');
    const validate = readJsonOutput(run(['work-items', '--validate'], { cwd: dir }));
    assert.strictEqual(validate.status, 'ok');
    assert.strictEqual(validate.counts.work_items, 1);
  });


  fullSourceTest('full source block line 1179', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    readJsonOutput(run(['work-items', '--append', '--write', '--id', id, '--title', 'First'], { cwd: dir }));
    const duplicate = run(['work-items', '--append', '--write', '--id', id, '--title', 'Duplicate'], { cwd: dir });
    const output = readJsonFailure(duplicate);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.reason.includes('duplicate'));
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.work_items.length, 1);
    assert.strictEqual(persisted.work_items[0].title, 'First');
  });


  fullSourceTest('full source block line 1194', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    readJsonOutput(run(['work-items', '--append', '--write', '--id', id, '--title', 'Claim seed'], { cwd: dir }));
    const result = run([
      'work-items', '--claim', '--dry-run',
      '--id', id,
      '--actor', 'public-actor',
      '--claimed-at', '2026-01-01T00:00:00.000Z',
      '--note', 'dry-run only'
    ], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'dry-run');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.boundary.modifies_work_items_file, false);
    assert.strictEqual(output.claimed.work_item_id, id);
    assert.strictEqual(output.claimed.actor, 'public-actor');
    assert.ok(Array.isArray(output.next_steps));
    assert.ok(output.next_steps.some((step) => step.startsWith('handoff:')));
    assert.strictEqual(output.proposed_ledger.work_items[0].status, 'claimed');
    assert.strictEqual(output.proposed_ledger.work_items[0].claim.actor, 'public-actor');
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.work_items[0].status, 'open');
    assert.ok(!Object.prototype.hasOwnProperty.call(persisted.work_items[0], 'claim'));
  });


  fullSourceTest('full source block line 1222', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    readJsonOutput(run(['work-items', '--append', '--write', '--id', id, '--title', 'Claim seed'], { cwd: dir }));
    const first = readJsonOutput(run(['work-items', '--claim', '--dry-run', '--id', id, '--actor', 'public-actor'], { cwd: dir }));
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(first.proposed_ledger, null, 2) + '\n');
    const second = run(['work-items', '--claim', '--dry-run', '--id', id, '--actor', 'other-actor'], { cwd: dir });
    const output = readJsonFailure(second);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.reason.includes('already claimed'));
  });


  fullSourceTest('full source block line 1236', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const result = run(['work-items', '--claim', '--dry-run', '--id', id, '--actor', 'public-actor'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.reason.includes('existing'));
  });


  fullSourceTest('full source block line 1247', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 1].join('');
    const result = run(['work-items', '--append', '--dry-run', '--write', '--id', id, '--title', 'Invalid mode'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.ok(output.message.includes('only one'));
  });


  fullSourceTest('full source block line 1257', () => {
    const result = run(['target-config', '--template'], { cwd: tempRepo() });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.target_config.project.name, 'target-fixture');
    assert.ok(output.target_config.surfaces.include.includes('AGENTS.md'));
  });


  fullSourceTest('full source block line 1265', () => {
    const dir = tempRepo();
    const result = run(['agents', '--preview'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'preview');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.canonical_file, 'AGENTS.md');
    assert.ok(output.agents_md.includes('Forbidden by default'));
    assert.ok(output.agents_md.includes('guard --check-boundary'));
    assert.ok(output.agents_md.includes('authority --first-read'));
    assert.ok(output.agents_md.includes('llms.txt'));
    assert.ok(output.agents_md.includes('target-fixture'));
    assert.ok(!fs.existsSync(path.join(dir, 'AGENTS.md')));
  });


  fullSourceTest('full source block line 1281', () => {
    const dir = tempRepo();
    const result = run(['agents', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.ok(agents.includes('Agent-Onboard target repository rules'));
    assert.ok(agents.includes('target-fixture'));
  });


  fullSourceTest('full source block line 1293', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Existing instructions\n');
    const result = run(['agents', '--write'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.deepStrictEqual(output.conflicts, ['AGENTS.md']);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), '# Existing instructions\n');
  });


  fullSourceTest('full source block line 1303', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Existing instructions\n');
    const result = run(['agents', '--write', '--force'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.deepStrictEqual(output.conflicts, []);
    assert.ok(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').includes('Agent-Onboard target repository rules'));
  });


  fullSourceTest('bridge dry-run previews marker block without writing AGENTS.md', () => {
    const dir = tempRepo();
    const result = run(['bridge', '--dry-run', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'dry-run');
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.canonical_file, 'AGENTS.md');
    assert.ok(output.bridge_block.includes('agent-onboard:bridge:start'));
    assert.ok(output.bridge_block.includes('node_modules/agent-onboard/AGENTS.md'));
    assert.ok(output.bridge_block.includes('does not grant write authority'));
    assert.ok(output.validation.valid);
    assert.strictEqual(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  });


  fullSourceTest('bridge write appends marker block and preserves existing AGENTS.md content', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Existing target instructions\n');
    const result = run(['bridge', '--write', '--target', dir]);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.writes_performed, true);
    assert.strictEqual(output.planned_writes[0].action, 'append_marker_block');
    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.ok(agents.startsWith('# Existing target instructions'));
    assert.strictEqual((agents.match(/agent-onboard:bridge:start/g) || []).length, 1);
    assert.strictEqual((agents.match(/agent-onboard:bridge:end/g) || []).length, 1);
    assert.ok(agents.includes('Forbidden by default'));
    assert.ok(agents.includes('do not install or fetch packages solely for this bridge'));
  });


  fullSourceTest('bridge write is idempotent and bridge check validates exactly one marker block', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Existing target instructions\n');
    readJsonOutput(run(['bridge', '--write', '--target', dir]));
    const first = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    const secondOutput = readJsonOutput(run(['bridge', '--write', '--target', dir]));
    const second = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.strictEqual(secondOutput.planned_writes[0].action, 'keep');
    assert.strictEqual(secondOutput.writes_performed, false);
    assert.strictEqual(second, first);
    const check = readJsonOutput(run(['bridge', '--check', '--target', dir]));
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.validation.start_count, 1);
    assert.strictEqual(check.validation.end_count, 1);
    assert.strictEqual(check.validation.valid, true);
  });


  fullSourceTest('bridge write refuses malformed duplicate marker blocks', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '<!-- agent-onboard:bridge:start -->\npartial\n');
    const result = run(['bridge', '--write', '--target', dir]);
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
    assert.ok(output.errors.some((error) => error.includes('missing required text') || error.includes('missing')));
    assert.strictEqual(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), '<!-- agent-onboard:bridge:start -->\npartial\n');
  });


  fullSourceTest('full source block line 1313', () => {
    const dir = tempRepo();
    const result = run(['init', '--dry-run'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.planned_writes.length, 4);
    assert.ok(!fs.existsSync(path.join(dir, '.agent-onboard/target.json')));
    assert.ok(!fs.existsSync(path.join(dir, '.agent-onboard', 'runtime-namespace.json')));
    assert.ok(!fs.existsSync(path.join(dir, '.agent-onboard', 'project.json')));
  });
};
