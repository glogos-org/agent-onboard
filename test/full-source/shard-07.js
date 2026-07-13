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

  fullSourceTest('full source block line 1508', () => {

    const rootLedger = JSON.parse(fs.readFileSync(path.join(ROOT, '.agent-onboard', 'work-items.json'), 'utf8'));

    const closureArchiveByRef = readClosureArchiveByRef(ROOT);
    const closureOf = (item) => item.closure || closureArchiveByRef.get(item.closure_ref) || null;

    const errors = require(path.join(ROOT, 'cli', 'agent-onboard.js')).validateWorkItems(rootLedger);

    assert.deepStrictEqual(errors, []);

    const findById = (items, id) => items.find((item) => item.id === id);

    const program = findById(rootLedger.programs, ['P', 1].join(''));

    const stage = findById(rootLedger.stages, ['P', 1, 'S', 1].join(''));

    const milestone = findById(rootLedger.milestones, ['P', 1, 'S', 1, 'M', 1].join(''));

    const releaseMilestone = findById(rootLedger.milestones, ['P', 1, 'S', 1, 'M', 2].join(''));

    const targetStage = findById(rootLedger.stages, ['P', 1, 'S', 2].join(''));

    const targetMilestone = findById(rootLedger.milestones, ['P', 1, 'S', 2, 'M', 1].join(''));

    const w1 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 1, 'W', 1].join(''));

    const w2 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 1, 'W', 2].join(''));

    const w3 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 1, 'W', 3].join(''));

    const w4 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 1, 'W', 4].join(''));

    const w5 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 1, 'W', 5].join(''));

    const m2w1 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 2, 'W', 1].join(''));

    const m2w2 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 2, 'W', 2].join(''));

    const m2w3 = findById(rootLedger.work_items, ['P', 1, 'S', 1, 'M', 2, 'W', 3].join(''));

    const s2m1w1 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 1].join(''));

    const s2m1w2 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 2].join(''));

    const s2m1w3 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 3].join(''));

    const s2m1w4 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 4].join(''));

    const s2m1w5 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 5].join(''));
    const s2m1w6 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 6].join(''));

    assert.ok(program);

    assert.ok(stage);

    assert.ok(milestone);

    assert.strictEqual(milestone.status, 'closed');

    assert.ok(releaseMilestone);

    assert.strictEqual(releaseMilestone.status, 'closed');

    assert.ok(targetStage);

    assert.strictEqual(targetStage.status, 'closed');

    assert.ok(targetMilestone);

    assert.strictEqual(targetMilestone.status, 'closed');

    assert.ok(w1);

    assert.strictEqual(w1.status, 'closed');

    assert.ok(w2);

    assert.strictEqual(w2.status, 'closed');

    assert.strictEqual(closureOf(w2).actor, 'release-maintainer');

    assert.ok(w3);

    assert.strictEqual(w3.status, 'closed');

    assert.strictEqual(closureOf(w3).actor, 'release-maintainer');

    assert.match(closureOf(w3).summary, /agent-onboard@0\.0\.15/);

    assert.ok(w4);

    assert.strictEqual(w4.title, 'Public source closure test fixture alignment gate');

    assert.strictEqual(w4.status, 'closed');

    assert.strictEqual(closureOf(w4).actor, 'release-maintainer');

    assert.match(closureOf(w4).summary, /agent-onboard@0\.0\.16/);

    assert.ok(w5);

    assert.strictEqual(w5.title, 'Public package publish verification gate');

    assert.strictEqual(w5.status, 'closed');

    assert.strictEqual(closureOf(w5).actor, 'release-maintainer');

    assert.match(closureOf(w5).summary, /agent-onboard@0\.0\.17/);

    assert.ok(m2w1);

    assert.strictEqual(m2w1.title, 'Public release contract integration gate');

    assert.strictEqual(m2w1.status, 'closed');

    assert.strictEqual(closureOf(m2w1).actor, 'release-maintainer');

    assert.match(closureOf(m2w1).summary, /agent-onboard@0\.0\.18/);

    assert.ok(m2w2);

    assert.strictEqual(m2w2.title, 'Public package contract fixture gate');

    assert.strictEqual(m2w2.status, 'closed');

    assert.strictEqual(closureOf(m2w2).actor, 'release-maintainer');

    assert.match(closureOf(m2w2).summary, /agent-onboard@0\.0\.19/);

    assert.ok(m2w3);

    assert.strictEqual(m2w3.title, 'Public installed package parity smoke gate');

    assert.strictEqual(m2w3.status, 'closed');

    assert.strictEqual(closureOf(m2w3).actor, 'release-maintainer');

    assert.match(closureOf(m2w3).summary, /agent-onboard@0\.0\.20/);

    assert.ok(s2m1w1);

    assert.strictEqual(s2m1w1.title, 'Public target onboarding surface planning gate');

    assert.strictEqual(s2m1w1.status, 'closed');

    assert.strictEqual(closureOf(s2m1w1).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w1).summary, /agent-onboard@0\.0\.21/);

    assert.ok(s2m1w2);

    assert.strictEqual(s2m1w2.title, 'Public target onboarding dry-run fixture gate');

    assert.strictEqual(s2m1w2.status, 'closed');

    assert.strictEqual(closureOf(s2m1w2).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w2).summary, /agent-onboard@0\.0\.22/);


    assert.ok(s2m1w3);

    assert.strictEqual(s2m1w3.title, 'Public target onboarding explicit write boundary gate');

    assert.strictEqual(s2m1w3.status, 'closed');

    assert.strictEqual(closureOf(s2m1w3).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w3).summary, /agent-onboard@0\.0\.23/);

    assert.ok(s2m1w4);

    assert.strictEqual(s2m1w4.title, 'Public target onboarding installed package smoke gate');

    assert.strictEqual(s2m1w4.status, 'closed');

    assert.strictEqual(closureOf(s2m1w4).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w4).summary, /agent-onboard@0\.0\.24/);

    assert.ok(s2m1w5);

    assert.strictEqual(s2m1w5.title, 'Public target onboarding post-publish verification handoff gate');

    assert.strictEqual(s2m1w5.status, 'closed');

    assert.strictEqual(closureOf(s2m1w5).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w5).summary, /agent-onboard@0\.0\.25/);

    assert.ok(s2m1w6);

    assert.strictEqual(s2m1w6.title, 'Public target onboarding published package acceptance gate');

    assert.strictEqual(s2m1w6.status, 'closed');

    assert.strictEqual(closureOf(s2m1w6).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w6).summary, /agent-onboard@0\.0\.26/);

    const s2m1w7 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 7].join(''));
    const s2m1w8 = findById(rootLedger.work_items, ['P', 1, 'S', 2, 'M', 1, 'W', 8].join(''));

    assert.ok(s2m1w7);

    assert.strictEqual(s2m1w7.title, 'Public target onboarding real target repo trial gate');

    assert.strictEqual(s2m1w7.status, 'closed');

    assert.strictEqual(closureOf(s2m1w7).actor, 'release-maintainer');

    assert.match(closureOf(s2m1w7).summary, /agent-onboard@0\.0\.27/);

    assert.ok(s2m1w8);

    assert.strictEqual(s2m1w8.title, 'Public target onboarding owner handoff evidence gate');

    assert.strictEqual(s2m1w8.status, 'closed');

    const s3m1w1 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 1].join(''));
    const s3m1w2 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 2].join(''));

    assert.ok(s3m1w1);

    assert.strictEqual(s3m1w1.title, 'Public architecture map gate');

    assert.strictEqual(s3m1w1.status, 'closed');

    assert.match(closureOf(s3m1w1).summary, /agent-onboard@0\.0\.28/);

    assert.ok(s3m1w2);

    assert.strictEqual(s3m1w2.title, 'Public command router boundary gate');

    assert.strictEqual(s3m1w2.status, 'closed');

    assert.match(closureOf(s3m1w2).summary, /agent-onboard@0\.0\.29/);

    const s3m1w3 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 3].join(''));

    assert.ok(s3m1w3);

    assert.strictEqual(s3m1w3.title, 'Public domain service facade gate');

    assert.strictEqual(s3m1w3.status, 'closed');

    assert.match(closureOf(s3m1w3).summary, /agent-onboard@0\.0\.30/);

    const s3m1w4 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 4].join(''));

    assert.ok(s3m1w4);

    assert.strictEqual(s3m1w4.title, 'Public authority first-read index gate');

    assert.strictEqual(s3m1w4.status, 'closed');

    assert.match(closureOf(s3m1w4).summary, /agent-onboard@0\.0\.31/);

    const s3m1w5 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 5].join(''));

    assert.ok(s3m1w5);

    assert.strictEqual(s3m1w5.title, 'Public target runtime namespace gate');

    assert.strictEqual(s3m1w5.status, 'closed');

    assert.match(closureOf(s3m1w5).summary, /agent-onboard@0\.0\.32/);

    const s3m1w6 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 6].join(''));

    assert.ok(s3m1w6);

    assert.strictEqual(s3m1w6.title, 'Public package surface preservation gate');

    assert.strictEqual(s3m1w6.status, 'closed');

    assert.match(closureOf(s3m1w6).summary, /agent-onboard@0\.0\.33/);

    const s3m1w7 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 7].join(''));

    assert.ok(s3m1w7);

    assert.strictEqual(s3m1w7.title, 'Public installed parity architecture smoke gate');

    assert.strictEqual(s3m1w7.status, 'closed');

    assert.match(closureOf(s3m1w7).summary, /agent-onboard@0\.0\.34/);

    const s3m1w8 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 8].join(''));

    assert.ok(s3m1w8);

    assert.strictEqual(s3m1w8.title, 'Public source domain module partition planning gate');

    assert.strictEqual(s3m1w8.status, 'closed');

    assert.match(closureOf(s3m1w8).summary, /agent-onboard@0\.0\.35/);

    const s3m1w9 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 9].join(''));

    assert.ok(s3m1w9);

    assert.strictEqual(s3m1w9.title, 'Public source domain extraction rehearsal gate');

    assert.strictEqual(s3m1w9.status, 'closed');

    assert.match(closureOf(s3m1w9).summary, /agent-onboard@0\.0\.36/);

    const s3m1w10 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 10].join(''));

    assert.ok(s3m1w10);

    assert.strictEqual(s3m1w10.title, 'Public source extraction golden output freeze gate');

    assert.strictEqual(s3m1w10.status, 'closed');

    const s3m1w11 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 11].join(''));

    assert.ok(s3m1w11);

    assert.strictEqual(s3m1w11.title, 'Public source module extraction adapter boundary gate');

    assert.strictEqual(s3m1w11.status, 'closed');

    const s3m1w12 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 12].join(''));

    assert.ok(s3m1w12);

    assert.strictEqual(s3m1w12.title, 'Public source module extraction first slice gate');

    assert.strictEqual(s3m1w12.status, 'closed');

    const s3m1w13 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 13].join(''));

    assert.ok(s3m1w13);

    assert.strictEqual(s3m1w13.title, 'Public source module extraction bundle parity gate');

    assert.strictEqual(s3m1w13.status, 'closed');

    const s3m1w14 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 14].join(''));

    assert.ok(s3m1w14);

    assert.strictEqual(s3m1w14.title, 'Public source module extraction runtime bridge gate');

    assert.strictEqual(s3m1w14.status, 'closed');

    const s3m1w15 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 15].join(''));

    assert.ok(s3m1w15);

    assert.strictEqual(s3m1w15.title, 'Public source module extraction installed fallback smoke gate');

    assert.strictEqual(s3m1w15.status, 'closed');

    const s3m1w16 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 16].join(''));

    assert.ok(s3m1w16);

    assert.strictEqual(s3m1w16.title, 'Public source module extraction second slice planning gate');

    assert.strictEqual(s3m1w16.status, 'closed');

    const s3m1w17 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 17].join(''));

    assert.ok(s3m1w17);

    assert.strictEqual(s3m1w17.title, 'Public source module extraction second slice first-slice gate');

    assert.strictEqual(s3m1w17.status, 'closed');

    const s3m1w18 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 18].join(''));

    assert.ok(s3m1w18);

    assert.strictEqual(s3m1w18.title, 'Public source module extraction authority bundle parity gate');

    assert.strictEqual(s3m1w18.status, 'closed');

    const s3m1w19 = findById(rootLedger.work_items, ['P', 1, 'S', 3, 'M', 1, 'W', 19].join(''));

    assert.ok(s3m1w19);

    assert.strictEqual(s3m1w19.title, 'Public source module extraction authority runtime bridge gate');

    assert.strictEqual(s3m1w19.status, 'closed');
    assert.ok(closureOf(s3m1w19));
    assert.ok(closureOf(s3m1w19).summary.includes('authority runtime bridge'));

    assert.ok(fs.existsSync(path.join(ROOT, 'AGENTS.md')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard/target.json')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'project.json')));

    assert.ok(fs.existsSync(path.join(ROOT, 'llms.txt')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'authority-path.json')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-partition-plan.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-extraction-rehearsal.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-adapter-boundary.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-first-slice.json')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-bundle-parity.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-runtime-bridge.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-installed-fallback-smoke.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-second-slice-plan.json')));
    assert.ok(fs.existsSync(path.join(ROOT, 'src', 'domains', 'authority.js')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-second-slice-first-slice.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-authority-bundle-parity.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-authority-runtime-bridge.json')));
    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'source-module-extraction-second-slice-plan.json')));
    assert.ok(fs.existsSync(path.join(ROOT, 'src', 'domains', 'core.js')));

    assert.ok(fs.existsSync(path.join(ROOT, '.agent-onboard', 'runtime-namespace.json')));

  });


  fullSourceTest('full source block line 1926', () => {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    assert.ok(!/^\.agent-onboard\/\s*$/m.test(gitignore));
    assert.ok(!/^\.agent-onboard\/\*\s*$/m.test(gitignore));
    assert.ok(!/^!\.agent-onboard\/source-module-extraction-.*\.json\s*$/m.test(gitignore));
    assert.ok(/^\.agent-onboard\/tmp\/\s*$/m.test(gitignore));
    assert.ok(/^\.agent-onboard\/cache\/\s*$/m.test(gitignore));
    assert.ok(/^\.agent-onboard\/local\/\s*$/m.test(gitignore));
  });


  fullSourceTest('full source block line 1936', () => {
    const pack = runNpmPackDryRun();
    assert.strictEqual(pack.status, 0, pack.stderr || pack.stdout || (pack.error && pack.error.message));
    const parsed = JSON.parse(pack.stdout);
    assert.strictEqual(parsed.length, 1);
    const files = parsed[0].files.map((item) => item.path).sort();
    assert.deepStrictEqual(files, EXPECTED_PACK_FILES_SORTED);
    const forbiddenConcreteWorkItem = new RegExp('P\\d+S\\d+M\\d+W\\d+');
    for (const rel of files) {
      const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.strictEqual(forbiddenConcreteWorkItem.test(text), false, `${rel} contains concrete work-item id`);
    }
  });


  fullSourceTest('full source block line 1951', () => {
    const result = run(['guard', '--plan']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.admitted_command, 'agent-onboard guard --check-boundary');
    assert.strictEqual(output.writes_files, false);
  });


  fullSourceTest('full source block line 1959', () => {
    const dir = tempRepo();
    const init = run(['init', '--write'], { cwd: dir });
    readJsonOutput(init);
    const result = run(['guard', '--check-boundary'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'pass');
    assert.strictEqual(output.reads_target_config, true);
    assert.strictEqual(output.blocked_violation_count, 0);
    assert.strictEqual(output.writes_files, false);
    assert.strictEqual(output.git_mutation, false);
  });


  fullSourceTest('full source block line 1972', () => {
    const dir = tempRepo();
    const result = run(['guard', '--check-boundary'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(result.status, 2);
    assert.strictEqual(output.status, 'blocked');
    assert.strictEqual(output.reason, `missing ${TARGET_CONFIG_FILE} in current target repo`);
    assert.strictEqual(output.writes_files, false);
  });


  fullSourceTest('full source block line 1982', () => {
    const dir = tempRepo();
    const config = cliTargetConfigForTest(dir);
    config.control.requested_mode = 'target_write';
    config.boundaries.writes_allowed = true;
    writeTargetConfig(dir, JSON.stringify(config, null, 2) + '\n');
    const result = run(['guard', '--check-boundary'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(result.status, 2);
    assert.strictEqual(output.status, 'blocked');
    assert.ok(output.violations.some((violation) => violation.path === 'control.requested_mode'));
    assert.ok(output.violations.some((violation) => violation.path === 'boundaries.writes_allowed'));
    assert.strictEqual(output.installs_dependencies, false);
    assert.strictEqual(output.runs_managed_project_commands, false);
  });


  fullSourceTest('full source block line 1998', () => {
    const dir = tempRepo();
    writeTargetConfig(dir, '{not-json}\n');
    const result = run(['guard', '--check-boundary'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(result.status, 2);
    assert.strictEqual(output.status, 'blocked');
    assert.strictEqual(output.reads_target_config, true);
  });


  fullSourceTest('full source block line 2008', () => {
    const cli = require(path.join(ROOT, 'cli', 'agent-onboard.js'));
    const invalid = cli.targetConfigTemplate();
    delete invalid.boundaries.writes_allowed;
    const errors = cli.validateTargetConfig(invalid);
    assert.ok(errors.some((error) => error.includes('writes_allowed')));
    const generatedAgents = cli.agentsMdTemplate(tempRepo());
    assert.ok(generatedAgents.includes('AGENTS.md'));
    assert.ok(generatedAgents.includes('Follow the public participation lifecycle'));
    assert.ok(cli.participationLifecycleNextSteps().some((step) => step.startsWith('discover:')));
    assert.ok(cli.handoffEvidenceChecklist().some((step) => step.startsWith('summary:')));
    assert.strictEqual(cli.sourceContext().package_context, 'source_repository');
    assert.strictEqual(cli.sourceWorkItemsLedgerCheck().present, true);

    const installedLike = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-installed-like-'));
    copyExpectedPackFiles(installedLike);
    const installedContext = cli.sourceContext(installedLike);
    const installedLedger = cli.sourceWorkItemsLedgerCheck(installedLike);
    assert.strictEqual(installedContext.package_context, 'installed_package');
    assert.strictEqual(installedLedger.present, false);
    assert.strictEqual(installedLedger.status, 'skipped');
    assert.strictEqual(cli.PUBLIC_RELEASE_FIXTURE_MATRIX.schema, 'agent-onboard-public-release-fixture-matrix-022');
    assert.ok(cli.PUBLIC_RELEASE_FIXTURE_MATRIX.fixtures.some((fixture) => fixture.id === 'public_work_items_domain_source_extraction_plan'));
    assert.ok(cli.PUBLIC_RELEASE_FIXTURE_MATRIX.fixtures.some((fixture) => fixture.id === 'target_onboarding_dry_run_fixture_matrix'));
    assert.strictEqual(cli.TARGET_ONBOARDING_SURFACE_PLAN.schema, 'agent-onboard-public-target-onboarding-surface-plan-001');
    assert.strictEqual(cli.targetOnboardingSurfacePlan(tempRepo()).status, 'ok');
    assert.strictEqual(cli.TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX.schema, 'agent-onboard-public-target-onboarding-fixture-matrix-002');
    assert.strictEqual(cli.targetOnboardingDryRunFixture(tempRepo()).status, 'ok');
    const trialRepo = tempRepo();
    const trialResult = cli.targetOnboardingRealTargetTrial(trialRepo);
    assert.strictEqual(trialResult.status, 'ok');
    assert.strictEqual(trialResult.ready_for_explicit_write, true);
    assert.strictEqual(trialResult.writes_performed, false);
    assert.strictEqual(cli.publicTargetOnboardingRealTargetRepoTrial().status, 'ok');
    assert.deepStrictEqual(cli.planTargetOnboardingWritesForRoot(tempRepo()).map((item) => item.path), ['.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'AGENTS.md', 'llms.txt', '.agent-onboard/authority-path.json']);
  });
};
