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

  fullSourceTest('full source block line 1324', () => {
    const dir = tempRepo();
    const result = run(['init', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard/target.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'runtime-namespace.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'project.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.json')));
    const workItems = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(workItems.schema, 'agent-onboard-target-work-items-001');
    assert.strictEqual(workItems.vocabulary.work_item.prefix, 'W');
    assert.deepStrictEqual(workItems.programs, []);
    assert.deepStrictEqual(workItems.stages, []);
    assert.deepStrictEqual(workItems.milestones, []);
    assert.deepStrictEqual(workItems.work_items, []);
    const targetConfig = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'));
    assert.strictEqual(targetConfig.project.name, 'target-fixture');
    assert.strictEqual(targetConfig.control.requested_mode, 'target_dry_run');
    assert.strictEqual(targetConfig.control.authority_level, 'L1_read_only_preview');

    const validate = run(['target-config', '--validate'], { cwd: dir });
    const validation = readJsonOutput(validate);
    assert.strictEqual(validation.status, 'ok');

    const validateWorkItems = run(['work-items', '--validate'], { cwd: dir });
    const workItemsValidation = readJsonOutput(validateWorkItems);
    assert.strictEqual(workItemsValidation.status, 'ok');
    assert.strictEqual(workItemsValidation.counts.work_items, 0);

    const listWorkItems = run(['work-items', '--list'], { cwd: dir });
    const workItemsList = readJsonOutput(listWorkItems);
    assert.strictEqual(workItemsList.status, 'ok');
    assert.strictEqual(workItemsList.counts.programs, 0);
  });


  fullSourceTest('full source block line 1361', () => {
    const dir = tempRepo();
    writeTargetConfig(dir, '{"foreign":true}\n');
    const result = run(['init', '--write'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.deepStrictEqual(output.conflicts, ['.agent-onboard/target.json']);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8')).foreign, true);
  });


  fullSourceTest('full source block line 1371', () => {
    const dir = tempRepo();
    writeTargetConfig(dir, '{"foreign":true}\n');
    const result = run(['init', '--write', '--force'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, true);
    assert.deepStrictEqual(output.conflicts, []);
    const targetConfig = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'));
    assert.strictEqual(targetConfig.schema, 'agent-onboard-target-config-001');
  });


  fullSourceTest('full source block line 1382', () => {
    const result = run(['target', 'bootstrap', '--dry-run'], { cwd: tempRepo() });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(output.planned_writes.length, 1);
  });


  fullSourceTest('full source block line 1389', () => {
    const dir = tempRepo();
    const result = run(['target', 'bootstrap', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, true);
    const targetConfig = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard/target.json'), 'utf8'));
    assert.strictEqual(targetConfig.project.name, 'target-fixture');
    assert.strictEqual(targetConfig.control.requested_mode, 'target_dry_run');
    assert.strictEqual(targetConfig.control.authority_level, 'L1_read_only_preview');
  });


  fullSourceTest('full source block line 1400', () => {
    const dir = tempRepo();
    const result = run(['target-instance', 'takeover', '--write'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.writes_performed, true);
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'runtime-namespace.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'project.json')));
    assert.ok(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.json')));
  });


  fullSourceTest('full source block line 1410', () => {
    const dir = tempRepo();
    const missing = run(['work-items', '--list'], { cwd: dir });
    const output = readJsonFailure(missing);
    assert.strictEqual(output.status, 'error');
    assert.strictEqual(output.writes_performed, false);
  });


  fullSourceTest('full source block line 1418', () => {
    const dir = tempRepo();
    const ledger = require(path.join(ROOT, 'cli', 'agent-onboard.js')).workItemsTemplate();
    const validProgramId = ['P', 1].join('');
    const validStageId = [validProgramId, 'S', 1].join('');
    const validMilestoneId = [validStageId, 'M', 1].join('');
    const validWorkItemId = [validMilestoneId, 'W', 1].join('');
    ledger.programs.push({ id: validProgramId, title: 'Program seed', status: 'open' });
    ledger.stages.push({ id: validStageId, program_id: validProgramId, title: 'Stage seed', status: 'open' });
    ledger.milestones.push({ id: validMilestoneId, stage_id: validStageId, title: 'Milestone seed', status: 'open' });
    ledger.work_items.push({ id: validWorkItemId, milestone_id: validMilestoneId, title: 'Work item seed', status: 'open' });
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(ledger, null, 2) + '\n');
    const result = run(['work-items', '--list'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.counts.work_items, 1);
  });


  fullSourceTest('work-items usability views expose summary, next, and mine as read-only JSON', () => {
    const dir = tempRepo();
    const ledger = require(path.join(ROOT, 'cli', 'agent-onboard.js')).workItemsTemplate();
    const programId = ['P', 1].join('');
    const stageId = [programId, 'S', 1].join('');
    const milestoneId = [stageId, 'M', 1].join('');
    const openId = [milestoneId, 'W', 1].join('');
    const claimedId = [milestoneId, 'W', 2].join('');
    const closedId = [milestoneId, 'W', 3].join('');
    ledger.programs.push({ id: programId, title: 'Usability program', status: 'open' });
    ledger.stages.push({ id: stageId, program_id: programId, title: 'Usability stage', status: 'open' });
    ledger.milestones.push({ id: milestoneId, stage_id: stageId, title: 'Usability milestone', status: 'open' });
    ledger.work_items.push(
      { id: openId, milestone_id: milestoneId, title: 'Open usability item', status: 'open' },
      {
        id: claimedId,
        milestone_id: milestoneId,
        title: 'Claimed usability item',
        status: 'claimed',
        claim: { actor: 'alice', claimed_at: '2026-07-03T00:00:00.000Z' }
      },
      {
        id: closedId,
        milestone_id: milestoneId,
        title: 'Closed usability item',
        status: 'closed',
        claim: { actor: 'alice', claimed_at: '2026-07-03T00:10:00.000Z' },
        closure: {
          actor: 'alice',
          closed_at: '2026-07-03T00:20:00.000Z',
          summary: 'Closed the usability item',
          changed_files: ['README.md'],
          checks_run: ['npm test'],
          checks_not_run: [],
          known_non_pass: []
        }
      }
    );
    writeWorkItemsLedger(dir, ledger);

    const summary = readJsonOutput(run(['work-items', '--summary'], { cwd: dir }));
    assert.strictEqual(summary.schema, 'agent-onboard-work-items-summary-response-001');
    assert.strictEqual(summary.status, 'ok');
    assert.strictEqual(summary.writes_performed, false);
    assert.deepStrictEqual(summary.work_item_status_counts, { open: 1, claimed: 1, closed: 1 });
    assert.strictEqual(summary.counts.work_items, 3);
    assert.strictEqual(summary.open_work_items[0].id, openId);
    assert.strictEqual(summary.claimed_work_items[0].id, claimedId);
    assert.strictEqual(summary.next_open_work_item.id, openId);
    assert.strictEqual(summary.next_open_work_item.program.title, 'Usability program');

    const next = readJsonOutput(run(['work-items', '--next'], { cwd: dir }));
    assert.strictEqual(next.schema, 'agent-onboard-work-items-next-response-001');
    assert.strictEqual(next.status, 'ok');
    assert.strictEqual(next.selection.strategy, 'first_open_work_item_by_ledger_order');
    assert.strictEqual(next.selection.found, true);
    assert.strictEqual(next.next_work_item.id, openId);
    assert.strictEqual(next.claim_command, `agent-onboard work-items --claim --dry-run --id ${openId} --actor <actor>`);
    assert.strictEqual(next.writes_performed, false);

    const mine = readJsonOutput(run(['work-items', '--mine', '--actor', 'alice'], { cwd: dir }));
    assert.strictEqual(mine.schema, 'agent-onboard-work-items-mine-response-001');
    assert.strictEqual(mine.status, 'ok');
    assert.strictEqual(mine.actor, 'alice');
    assert.deepStrictEqual(mine.claimed_work_items.map((item) => item.id), [claimedId]);
    assert.deepStrictEqual(mine.closed_work_items.map((item) => item.id), [closedId]);
    assert.deepStrictEqual(mine.counts, { claimed: 1, closed: 1, total: 2 });
    assert.strictEqual(mine.writes_performed, false);

    const summaryText = run(['work-items', '--summary', '--text'], { cwd: dir });
    assert.strictEqual(summaryText.status, 0, summaryText.stderr || summaryText.stdout);
    assert.ok(summaryText.stdout.includes('agent-onboard work-items summary'));
    assert.ok(summaryText.stdout.includes('Items: 3 total, 1 open, 1 claimed, 1 closed'));
    assert.ok(summaryText.stdout.includes(`${openId} [open] Open usability item`));

    const nextText = run(['work-items', '--next', '--text'], { cwd: dir });
    assert.strictEqual(nextText.status, 0, nextText.stderr || nextText.stdout);
    assert.ok(nextText.stdout.includes('agent-onboard next work item'));
    assert.ok(nextText.stdout.includes(`Next: ${openId} [open] Open usability item`));
    assert.ok(nextText.stdout.includes(`Claim dry-run: agent-onboard work-items --claim --dry-run --id ${openId} --actor <actor>`));

    const mineText = run(['work-items', '--mine', '--actor', 'alice', '--text'], { cwd: dir });
    assert.strictEqual(mineText.status, 0, mineText.stderr || mineText.stdout);
    assert.ok(mineText.stdout.includes('agent-onboard work items for alice'));
    assert.ok(mineText.stdout.includes(`Claimed: 1`));
    assert.ok(mineText.stdout.includes(`${claimedId} [claimed] Claimed usability item`));
    assert.ok(mineText.stdout.includes(`Closed: 1`));
    assert.ok(mineText.stdout.includes(`${closedId} [closed] Closed usability item`));
  });


  fullSourceTest('full source block line 1437', () => {
    const dir = tempRepo();
    const ledger = require(path.join(ROOT, 'cli', 'agent-onboard.js')).workItemsTemplate();
    ledger.work_items.push({ id: ['not', 'valid'].join('-'), milestone_id: ['also', 'bad'].join('-'), title: 'Invalid', status: 'open' });
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(ledger, null, 2) + '\n');
    const result = run(['work-items', '--validate'], { cwd: dir });
    const output = readJsonFailure(result);
    assert.strictEqual(output.status, 'error');
    assert.ok(output.errors.some((error) => error.includes('expected pattern')));
  });


  fullSourceTest('full source block line 1450', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 2].join('');
    readJsonOutput(run(['work-items', '--append', '--write', '--id', id, '--title', 'Claim write target'], { cwd: dir }));
    const result = run(['work-items', '--claim', '--write', '--id', id, '--actor', 'test-agent', '--claimed-at', '2026-06-30T00:00:00.000Z'], { cwd: dir });
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.mode, 'write');
    assert.strictEqual(output.writes_performed, true);
    assert.strictEqual(output.boundary.modifies_work_items_file, true);
    assert.strictEqual(output.boundary.refreshes_governance_indexes, true);
    assert.strictEqual(output.governance_index_refresh.status, 'ok');
    assert.strictEqual(output.governance_index_refresh.trigger.command, 'agent-onboard work-items --claim --write');
    assert.ok(output.next_steps.some((step) => step.startsWith('validate:')));
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.work_items[0].status, 'claimed');
    assert.strictEqual(persisted.work_items[0].claim.actor, 'test-agent');
  });


  fullSourceTest('full source block line 1467', () => {
    const dir = tempRepo();
    readJsonOutput(run(['work-items', '--init', '--write'], { cwd: dir }));
    const id = ['P', 1, 'S', 1, 'M', 1, 'W', 3].join('');
    readJsonOutput(run(['work-items', '--append', '--write', '--id', id, '--title', 'Close write target'], { cwd: dir }));
    const dry = run([
      'work-items', '--close', '--dry-run',
      '--id', id,
      '--actor', 'test-agent',
      '--closed-at', '2026-06-30T00:00:00.000Z',
      '--summary', 'Completed the close target',
      '--changed-file', 'README.md',
      '--check', 'npm test',
      '--check-not-run', 'npm publish',
      '--known-non-pass', 'none'
    ], { cwd: dir });
    const dryOutput = readJsonOutput(dry);
    assert.strictEqual(dryOutput.status, 'ok');
    assert.strictEqual(dryOutput.writes_performed, false);
    assert.strictEqual(dryOutput.closed.work_item_id, id);
    assert.strictEqual(dryOutput.handoff_evidence.closure.changed_files[0], 'README.md');
    assert.ok(dryOutput.handoff_evidence.checklist.some((step) => step.startsWith('summary:')));

    const write = run([
      'work-items', '--close', '--write',
      '--id', id,
      '--actor', 'test-agent',
      '--closed-at', '2026-06-30T00:00:00.000Z',
      '--summary', 'Completed the close target',
      '--changed-file', 'README.md',
      '--check', 'npm test'
    ], { cwd: dir });
    const writeOutput = readJsonOutput(write);
    assert.strictEqual(writeOutput.status, 'ok');
    assert.strictEqual(writeOutput.writes_performed, true);
    assert.strictEqual(writeOutput.boundary.modifies_work_items_file, true);
    assert.strictEqual(writeOutput.boundary.refreshes_governance_indexes, true);
    assert.strictEqual(writeOutput.governance_index_refresh.status, 'ok');
    assert.strictEqual(writeOutput.governance_index_refresh.trigger.command, 'agent-onboard work-items --close --write');
    const closeWorkIndex = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.index.json'), 'utf8'));
    assert.strictEqual(closeWorkIndex.closed_count, 1);
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    assert.strictEqual(persisted.work_items[0].status, 'closed');
    assert.strictEqual(persisted.work_items[0].closure_ref, `closures:${id}`);
    assert.ok(!Object.prototype.hasOwnProperty.call(persisted.work_items[0], 'closure'));
    const closureArchive = readClosureArchiveByRef(dir);
    assert.strictEqual(closureArchive.get(`closures:${id}`).summary, 'Completed the close target');
  });
};
