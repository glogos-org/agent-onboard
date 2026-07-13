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

  fullSourceTest('public target work-items preview is directly usable', () => {
    const dir = tempRepo();
    const milestoneId = ['P9', 'S1', 'M1'].join('');
    const closedId = [milestoneId, 'W1'].join('');
    const queuedId = [milestoneId, 'W2'].join('');
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify({
      schema: 'target-work-items-fixture',
      work_items: [
        { id: closedId, title: 'Closed fixture gate', status: 'closed', milestone_id: milestoneId }
      ],
      admission_queue: [
        { id: queuedId, title: 'Queued fixture gate', status: 'planned', milestone_id: milestoneId, queue_policy: 'explicit_candidate_required' }
      ]
    }, null, 2) + '\n');

    const jsonResult = run(['target', 'work-items', '--json', '--target', dir]);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-work-items-preview-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target work-items --preview');
    assert.strictEqual(output.command_family, 'target work-items');
    assert.strictEqual(output.work_items_file.present, true);
    assert.strictEqual(output.summary.total_work_items, 1);
    assert.strictEqual(output.summary.status_counts.closed, 1);
    assert.strictEqual(output.summary.admission_queue_count, 1);
    assert.strictEqual(output.summary.last_closed_work_item.id, closedId);
    assert.strictEqual(output.summary.next_admission_candidate.id, queuedId);
    assert.strictEqual(output.summary.next_action_state, 'explicit_admission_candidate_available');
    assert.strictEqual(output.validation.synthesizes_next_id, false);
    assert.strictEqual(output.boundary.admits_or_closes_work_items, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);
    assert.strictEqual(output.writes_performed, false);

    const textResult = run(['target', 'work-items', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target work-items'));
    assert.ok(textResult.stdout.includes(`Next queued candidate: ${queuedId}`));
    assert.ok(textResult.stdout.includes('no work-item admission'));
    assert.ok(textResult.stdout.includes('Writes performed: false'));

    const missingDir = tempRepo();
    const missingResult = run(['target', 'work-items', '--preview', '--target', missingDir]);
    const missingOutput = readJsonOutput(missingResult);
    assert.strictEqual(missingOutput.status, 'ok');
    assert.strictEqual(missingOutput.work_items_file.present, false);
    assert.strictEqual(missingOutput.summary.next_action_state, 'no_target_work_items_file');

    const refused = run(['target', 'work-items', '--write', '--target', dir]);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 1);
    assert.strictEqual(refusedOutput.status, 'error');
  });


  fullSourceTest('public target governance preview is directly usable', () => {
    const dir = tempRepo();
    const milestoneId = ['P7', 'S1', 'M1'].join('');
    const openId = [milestoneId, 'W1'].join('');
    const queuedId = [milestoneId, 'W2'].join('');
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify({
      schema: 'target-work-items-fixture',
      work_items: [
        { id: openId, title: 'Open governance fixture', status: 'open', milestone_id: milestoneId },
        { id: [milestoneId, 'W0'].join(''), title: 'Closed governance fixture', status: 'closed', milestone_id: milestoneId }
      ],
      admission_queue: [
        { id: queuedId, title: 'Queued governance fixture', status: 'planned', milestone_id: milestoneId }
      ]
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'claims.jsonl'), [
      JSON.stringify({ event_type: 'claim_proposed', work_item_id: openId, claim_id: 'claim-001', claim_status: 'proposed', actor: 'agent-a', created_at: '2026-07-04T00:00:00.000Z' }),
      JSON.stringify({ event_type: 'claim_merged', work_item_id: [milestoneId, 'W0'].join(''), claim_id: 'claim-000', claim_status: 'merged', actor: 'agent-a', created_at: '2026-07-04T00:01:00.000Z' })
    ].join('\n') + '\n');

    const jsonResult = run(['target', 'governance', '--json', '--target', dir]);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-governance-preview-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target governance --preview');
    assert.strictEqual(output.command_family, 'target governance');
    assert.strictEqual(output.governance.work_items_index.source, 'derived_preview');
    assert.strictEqual(output.governance.claims_index.source, 'derived_preview');
    assert.strictEqual(output.governance.work_items_index.item_count, 2);
    assert.strictEqual(output.governance.work_items_index.open_count, 1);
    assert.strictEqual(output.governance.work_items_index.closed_count, 1);
    assert.strictEqual(output.governance.work_items_index.next_open_work_item.id, openId);
    assert.strictEqual(output.governance.work_items_index.next_admission_candidate.id, queuedId);
    assert.strictEqual(output.governance.claims_index.claim_count, 2);
    assert.strictEqual(output.governance.claims_index.proposed_count, 1);
    assert.strictEqual(output.governance.claims_index.merged_count, 1);
    assert.ok(output.governance.readiness.warnings.includes('stored_work_items_index_missing_derived_preview_used'));
    assert.strictEqual(output.governance.budget_policy.raw_growth_files_loaded_by_default, false);
    assert.strictEqual(output.output_policy.raw_claims_ledger_inlined, false);
    assert.strictEqual(output.boundary.admits_or_closes_work_items, false);
    assert.strictEqual(output.boundary.creates_claims, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);
    assert.strictEqual(output.writes_performed, false);

    const textResult = run(['target', 'governance', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target governance'));
    assert.ok(textResult.stdout.includes('Work-items index: derived_preview'));
    assert.ok(textResult.stdout.includes(`Next queued candidate: ${queuedId}`));
    assert.ok(textResult.stdout.includes('raw growth files are on-demand only'));
    assert.strictEqual(textResult.stdout.includes('claim-001'), false);

    const previewResult = run(['target', 'governance', '--preview', '--target', dir]);
    assert.strictEqual(readJsonOutput(previewResult).schema, 'agent-onboard-public-target-governance-preview-001');

    const budgetContractResult = run(['target', 'governance', '--budget-contract', '--json', '--target', dir]);
    const budgetContract = readJsonOutput(budgetContractResult);
    assert.strictEqual(budgetContract.schema, 'agent-onboard-public-target-governance-budget-contract-001');
    assert.strictEqual(budgetContract.status, 'ok');
    assert.strictEqual(budgetContract.version, EXPECTED_VERSION);
    assert.strictEqual(budgetContract.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(budgetContract.command, 'agent-onboard target governance --budget-contract');
    assert.deepStrictEqual(budgetContract.target_first_read_indexes, ['.agent-onboard/work-items.index.json', '.agent-onboard/claims.index.json']);
    assert.deepStrictEqual(budgetContract.raw_growth_files_on_demand_only, ['.agent-onboard/work-items.json', '.agent-onboard/claims.jsonl']);
    assert.strictEqual(budgetContract.raw_growth_files_loaded_by_default, false);
    assert.strictEqual(budgetContract.indexes_are_first_read_cache, true);
    assert.strictEqual(budgetContract.work_items_json_remains_authoritative, true);
    assert.strictEqual(budgetContract.claims_jsonl_remains_authoritative, true);
    assert.strictEqual(budgetContract.max_index_bytes_each, 4096);
    assert.strictEqual(budgetContract.max_combined_index_bytes, 8192);
    assert.strictEqual(budgetContract.write_policy.explicit_write_required, true);
    assert.strictEqual(budgetContract.write_policy.drift_check_writes_files, false);
    assert.strictEqual(budgetContract.boundary.writes_files, false);
    assert.strictEqual(budgetContract.boundary.scans_target_repository, false);
    assert.strictEqual(budgetContract.writes_performed, false);

    const budgetContractText = run(['target', 'governance', '--budget-contract', '--text', '--target', dir]);
    assert.strictEqual(budgetContractText.status, 0, budgetContractText.stderr || budgetContractText.stdout);
    assert.ok(budgetContractText.stdout.includes('agent-onboard target governance budget contract'));
    assert.ok(budgetContractText.stdout.includes('indexes are compact first-read cache'));
    assert.ok(budgetContractText.stdout.includes('explicit materialize --write --force only'));
    assert.ok(budgetContractText.stdout.includes('Writes performed: false'));

    const budgetCheckResult = run(['target', 'governance', '--budget-check', '--json', '--target', dir]);
    const budgetCheck = readJsonOutput(budgetCheckResult);
    assert.strictEqual(budgetCheck.schema, 'agent-onboard-public-target-governance-budget-check-001');
    assert.strictEqual(budgetCheck.status, 'ok');
    assert.strictEqual(budgetCheck.version, EXPECTED_VERSION);
    assert.strictEqual(budgetCheck.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(budgetCheck.command, 'agent-onboard target governance --budget-check');
    assert.strictEqual(budgetCheck.budget_check.mode, 'no_write_budget_check');
    assert.strictEqual(budgetCheck.budget_check.overall_state, 'within_budget');
    assert.strictEqual(budgetCheck.budget_check.budget_within_contract, true);
    assert.deepStrictEqual(budgetCheck.budget_check.index_states.map((item) => item.path), ['.agent-onboard/work-items.index.json', '.agent-onboard/claims.index.json']);
    assert.strictEqual(budgetCheck.budget_check.index_states.every((item) => item.within_budget === true), true);
    assert.strictEqual(budgetCheck.budget_check.combined_index_bytes <= budgetCheck.budget_check.max_combined_index_bytes, true);
    assert.strictEqual(budgetCheck.output_policy.planned_index_payloads_inlined, false);
    assert.strictEqual(JSON.stringify(budgetCheck).includes('claim-001'), false);
    assert.strictEqual(budgetCheck.boundary.validates_governance_index_byte_budgets, true);
    assert.strictEqual(budgetCheck.boundary.writes_files, false);
    assert.strictEqual(budgetCheck.boundary.inlines_planned_index_payloads, false);
    assert.strictEqual(budgetCheck.writes_performed, false);

    const budgetCheckText = run(['target', 'governance', '--budget-check', '--text', '--target', dir]);
    assert.strictEqual(budgetCheckText.status, 0, budgetCheckText.stderr || budgetCheckText.stdout);
    assert.ok(budgetCheckText.stdout.includes('agent-onboard target governance budget check'));
    assert.ok(budgetCheckText.stdout.includes('Budget state: within_budget'));
    assert.ok(budgetCheckText.stdout.includes('planned index payloads are not inlined'));
    assert.ok(budgetCheckText.stdout.includes('Writes performed: false'));

    const largeLedgerDir = tempRepo();
    fs.mkdirSync(path.join(largeLedgerDir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(largeLedgerDir, '.agent-onboard', 'work-items.json'), JSON.stringify({ schema: 'target-work-items-fixture', work_items: [] }, null, 2) + '\n');
    const largeClaimsLine = JSON.stringify({ schema: 'claim-fixture', claim_status: 'proposed', work_item_id: 'fixture-oversized-work-item', claim_id: 'oversized', actor: 'fixture', note: 'x'.repeat(4096) }) + '\n';
    fs.writeFileSync(path.join(largeLedgerDir, '.agent-onboard', 'claims.jsonl'), largeClaimsLine.repeat(40));
    const largeBudgetResult = run(['target', 'governance', '--budget-check', '--json', '--target', largeLedgerDir]);
    const largeBudget = readJsonFailure(largeBudgetResult);
    assert.strictEqual(largeBudget.status, 'blocked');
    assert.strictEqual(largeBudget.budget_check.budget_within_contract, false);
    assert.strictEqual(largeBudget.budget_check.planned_index_payloads_are_not_inlined || largeBudget.budget_check.authority_policy.planned_index_payloads_are_not_inlined, true);
    assert.strictEqual(largeBudget.boundary.writes_files, false);
    assert.strictEqual(largeBudget.writes_performed, false);
    assert.ok(largeBudget.errors.some((item) => item.includes('too_large_for_preview')));

    const materializeResult = run(['target', 'governance', '--materialize-dry-run', '--target', dir]);
    const materializeOutput = readJsonOutput(materializeResult);
    assert.strictEqual(materializeOutput.schema, 'agent-onboard-public-target-governance-index-materialization-dry-run-001');
    assert.strictEqual(materializeOutput.status, 'ok');
    assert.strictEqual(materializeOutput.version, EXPECTED_VERSION);
    assert.strictEqual(materializeOutput.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(materializeOutput.command, 'agent-onboard target governance --materialize-dry-run');
    assert.strictEqual(materializeOutput.materialization.mode, 'dry_run');
    assert.strictEqual(materializeOutput.materialization.planned_writes.length, 2);
    assert.strictEqual(materializeOutput.materialization.planned_writes[0].path, '.agent-onboard/work-items.index.json');
    assert.strictEqual(materializeOutput.materialization.planned_writes[0].payload.status, 'active');
    assert.strictEqual(materializeOutput.materialization.planned_writes[0].payload.item_count, 2);
    assert.strictEqual(materializeOutput.materialization.planned_writes[1].path, '.agent-onboard/claims.index.json');
    assert.strictEqual(materializeOutput.materialization.planned_writes[1].payload.status, 'active');
    assert.strictEqual(materializeOutput.materialization.planned_writes[1].payload.claim_count, 2);
    assert.strictEqual(materializeOutput.materialization.budget_status, 'within_budget');
    assert.strictEqual(materializeOutput.materialization.authority_policy.work_items_json_remains_authoritative, true);
    assert.strictEqual(materializeOutput.materialization.authority_policy.claims_jsonl_remains_authoritative, true);
    assert.strictEqual(materializeOutput.output_policy.raw_claims_ledger_inlined, false);
    assert.strictEqual(materializeOutput.output_policy.planned_index_payloads_inlined, true);
    assert.strictEqual(materializeOutput.boundary.plans_index_materialization, true);
    assert.strictEqual(materializeOutput.boundary.writes_files, false);
    assert.strictEqual(materializeOutput.writes_performed, false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.index.json')), false);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'claims.index.json')), false);

    const missingDriftResult = run(['target', 'governance', '--check', '--target', dir]);
    const missingDriftOutput = readJsonOutput(missingDriftResult);
    assert.strictEqual(missingDriftOutput.schema, 'agent-onboard-public-target-governance-index-drift-check-001');
    assert.strictEqual(missingDriftOutput.status, 'ok');
    assert.strictEqual(missingDriftOutput.command, 'agent-onboard target governance --check');
    assert.strictEqual(missingDriftOutput.drift_check.overall_state, 'missing');
    assert.strictEqual(missingDriftOutput.drift_check.refresh_required, true);
    assert.deepStrictEqual(missingDriftOutput.drift_check.index_states.map((item) => item.state), ['missing', 'missing']);
    assert.strictEqual(missingDriftOutput.boundary.compares_stored_indexes_with_derived_payloads, true);
    assert.strictEqual(missingDriftOutput.boundary.writes_files, false);
    assert.strictEqual(missingDriftOutput.writes_performed, false);

    const missingDriftText = run(['target', 'governance', '--check', '--text', '--target', dir]);
    assert.strictEqual(missingDriftText.status, 0, missingDriftText.stderr || missingDriftText.stdout);
    assert.ok(missingDriftText.stdout.includes('agent-onboard target governance drift check'));
    assert.ok(missingDriftText.stdout.includes('Index state: missing'));
    assert.ok(missingDriftText.stdout.includes('no-write drift check only'));

    const materializeText = run(['target', 'governance', '--materialize-dry-run', '--text', '--target', dir]);
    assert.strictEqual(materializeText.status, 0, materializeText.stderr || materializeText.stdout);
    assert.ok(materializeText.stdout.includes('agent-onboard target governance materialization dry-run'));
    assert.ok(materializeText.stdout.includes('Planned writes: 2'));
    assert.ok(materializeText.stdout.includes('raw work-items/claims remain authoritative'));
    assert.ok(materializeText.stdout.includes('Writes performed: false'));

    const refused = run(['target', 'governance', '--write', '--target', dir]);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 1);
    assert.strictEqual(refusedOutput.status, 'error');

    const writeWithoutForce = run(['target', 'governance', '--materialize', '--write', '--target', dir]);
    const writeWithoutForceOutput = readJsonFailure(writeWithoutForce);
    assert.strictEqual(writeWithoutForce.status, 1);
    assert.strictEqual(writeWithoutForceOutput.schema, 'agent-onboard-public-target-governance-index-materialization-write-001');
    assert.strictEqual(writeWithoutForceOutput.status, 'error');
    assert.strictEqual(writeWithoutForceOutput.writes_performed, false);

    const writeResult = run(['target', 'governance', '--materialize', '--write', '--force', '--target', dir]);
    const writeOutput = readJsonOutput(writeResult);
    assert.strictEqual(writeOutput.schema, 'agent-onboard-public-target-governance-index-materialization-write-001');
    assert.strictEqual(writeOutput.status, 'ok');
    assert.strictEqual(writeOutput.command, 'agent-onboard target governance --materialize --write --force');
    assert.strictEqual(writeOutput.materialization.mode, 'explicit_write');
    assert.strictEqual(writeOutput.materialization.index_paths.length, 2);
    assert.strictEqual(writeOutput.materialization.changed_path_count, 2);
    assert.deepStrictEqual(writeOutput.materialization.write_results.map((item) => item.path), ['.agent-onboard/work-items.index.json', '.agent-onboard/claims.index.json']);
    assert.deepStrictEqual(writeOutput.materialization.write_results.map((item) => item.wrote), [true, true]);
    assert.strictEqual(writeOutput.materialization.authority_policy.raw_authority_files_are_not_modified, true);
    assert.strictEqual(writeOutput.boundary.writes_files, true);
    assert.deepStrictEqual(writeOutput.boundary.allowed_write_paths, ['.agent-onboard/work-items.index.json', '.agent-onboard/claims.index.json']);
    assert.strictEqual(writeOutput.boundary.compare_before_write, true);
    assert.strictEqual(writeOutput.boundary.mutates_raw_work_items_file, false);
    assert.strictEqual(writeOutput.boundary.mutates_claims_ledger, false);
    assert.strictEqual(writeOutput.boundary.admits_or_closes_work_items, false);
    assert.strictEqual(writeOutput.boundary.creates_claims, false);
    assert.strictEqual(writeOutput.writes_performed, true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'work-items.index.json')), true);
    assert.strictEqual(fs.existsSync(path.join(dir, '.agent-onboard', 'claims.index.json')), true);

    const writeAgain = run(['target', 'governance', '--materialize', '--write', '--force', '--target', dir]);
    const writeAgainOutput = readJsonOutput(writeAgain);
    assert.strictEqual(writeAgainOutput.status, 'ok');
    assert.strictEqual(writeAgainOutput.materialization.changed_path_count, 0);
    assert.deepStrictEqual(writeAgainOutput.materialization.write_results.map((item) => item.action), ['keep', 'keep']);
    assert.deepStrictEqual(writeAgainOutput.materialization.write_results.map((item) => item.wrote), [false, false]);
    assert.strictEqual(writeAgainOutput.writes_performed, false);

    const freshDriftResult = run(['target', 'governance', '--check', '--target', dir]);
    const freshDriftOutput = readJsonOutput(freshDriftResult);
    assert.strictEqual(freshDriftOutput.status, 'ok');
    assert.strictEqual(freshDriftOutput.drift_check.overall_state, 'fresh');
    assert.strictEqual(freshDriftOutput.drift_check.refresh_required, false);
    assert.deepStrictEqual(freshDriftOutput.drift_check.index_states.map((item) => item.state), ['fresh', 'fresh']);

    const mutatedWorkItems = JSON.parse(fs.readFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), 'utf8'));
    mutatedWorkItems.work_items.push({ id: [milestoneId, 'W3'].join(''), title: 'Late raw governance fixture', status: 'open', milestone_id: milestoneId });
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify(mutatedWorkItems, null, 2) + '\n');
    const staleDriftResult = run(['target', 'governance', '--check', '--target', dir]);
    const staleDriftOutput = readJsonOutput(staleDriftResult);
    assert.strictEqual(staleDriftOutput.status, 'ok');
    assert.strictEqual(staleDriftOutput.drift_check.overall_state, 'stale');
    assert.strictEqual(staleDriftOutput.drift_check.refresh_required, true);
    assert.strictEqual(staleDriftOutput.drift_check.index_states[0].state, 'stale');
    assert.strictEqual(staleDriftOutput.drift_check.index_states[0].would_refresh_on_materialize, true);
    assert.strictEqual(staleDriftOutput.drift_check.authority_policy.drift_check_does_not_refresh_or_write_indexes, true);

    const writeText = run(['target', 'governance', '--materialize', '--write', '--force', '--text', '--target', dir]);
    assert.strictEqual(writeText.status, 0, writeText.stderr || writeText.stdout);
    assert.ok(writeText.stdout.includes('agent-onboard target governance materialization write'));
    assert.ok(writeText.stdout.includes('allowlisted index paths only'));
    assert.ok(writeText.stdout.includes('Writes performed: true'));
  });


  fullSourceTest('public target handoff preview is directly usable', () => {
    const dir = tempRepo();
    const milestoneId = ['P8', 'S1', 'M1'].join('');
    const openId = [milestoneId, 'W1'].join('');
    const queuedId = [milestoneId, 'W2'].join('');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'target instructions must not be inlined\n');
    fs.writeFileSync(path.join(dir, 'llms.txt'), '# target llms entrypoint\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'handoff-fixture', version: '1.0.0', scripts: { test: 'node src/index.js' } }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, '.agent-onboard', 'work-items.json'), JSON.stringify({
      schema: 'target-work-items-fixture',
      work_items: [
        { id: openId, title: 'Open fixture gate', status: 'open', milestone_id: milestoneId }
      ],
      admission_queue: [
        { id: queuedId, title: 'Queued fixture gate', status: 'planned', milestone_id: milestoneId }
      ]
    }, null, 2) + '\n');

    const jsonResult = run(['target', 'handoff', '--json', '--target', dir]);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-handoff-preview-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target handoff --preview');
    assert.strictEqual(output.command_family, 'target handoff');
    assert.strictEqual(output.target.name, 'handoff-fixture');
    assert.strictEqual(output.handoff.inventory_summary.files_seen > 0, true);
    assert.ok(output.handoff.inventory_summary.script_names.includes('test'));
    assert.ok(output.handoff.memory_surface_summary.present_paths.includes('AGENTS.md'));
    assert.ok(output.handoff.memory_surface_summary.present_paths.includes('llms.txt'));
    assert.strictEqual(output.handoff.memory_surface_summary.file_contents_inlined, false);
    assert.strictEqual(output.handoff.work_items_summary.open_work_item.id, openId);
    assert.strictEqual(output.handoff.work_items_summary.next_admission_candidate.id, queuedId);
    assert.strictEqual(output.handoff.readiness.next_agent_ready, true);
    assert.ok(output.handoff.readiness.reason_codes.includes('open_target_work_item_should_be_continued_before_new_admission'));
    assert.ok(output.handoff.readiness.reason_codes.includes('governance_index_missing_stale_read_risk'));
    assert.ok(output.handoff.readiness.reasons.some((entry) => entry.code === 'governance_index_missing_stale_read_risk' && entry.severity === 'warning' && entry.next_command.includes('target governance')));
    assert.strictEqual(output.handoff.governance_budget_summary.overall_state, 'within_budget');
    assert.strictEqual(output.handoff.governance_budget_summary.budget_within_contract, true);
    assert.strictEqual(output.handoff.governance_budget_summary.combined_index_bytes <= output.handoff.governance_budget_summary.max_combined_index_bytes, true);
    assert.strictEqual(output.handoff.governance_budget_summary.index_states.every((item) => item.within_budget === true), true);
    assert.strictEqual(output.handoff.governance_index_drift_summary.overall_state, 'missing');
    assert.strictEqual(output.handoff.governance_index_drift_summary.refresh_required, true);
    assert.ok(output.handoff.readiness.warnings.includes('open_target_work_item_should_be_continued_before_new_admission'));
    assert.ok(output.handoff.readiness.warnings.includes('governance_index_missing_stale_read_risk'));
    assert.strictEqual(output.output_policy.file_contents_inlined, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.admits_or_closes_work_items, false);
    assert.strictEqual(output.boundary.network, false);
    assert.strictEqual(output.writes_performed, false);
    assert.strictEqual(jsonResult.stdout.includes('target instructions must not be inlined'), false);

    const textResult = run(['target', 'handoff', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target handoff'));
    assert.ok(textResult.stdout.includes('Readiness: usable_with_warnings'));
    assert.ok(textResult.stdout.includes('Readiness reasons: warning:open_target_work_item_should_be_continued_before_new_admission'));
    assert.ok(textResult.stdout.includes(`Next queued candidate: ${queuedId}`));
    assert.ok(textResult.stdout.includes('Governance budget: within_budget'));
    assert.ok(textResult.stdout.includes('Governance index drift: missing; refresh required true'));
    assert.ok(textResult.stdout.includes('target governance --budget-check --text'));
    assert.ok(textResult.stdout.includes('no file content import'));
    assert.strictEqual(textResult.stdout.includes('target instructions must not be inlined'), false);

    const previewResult = run(['target', 'handoff', '--preview', '--target', dir]);
    assert.strictEqual(readJsonOutput(previewResult).schema, 'agent-onboard-public-target-handoff-preview-001');

    const readinessCheckResult = run(['target', 'handoff', '--readiness-check', '--json', '--target', dir]);
    const readinessCheck = readJsonOutput(readinessCheckResult);
    assert.strictEqual(readinessCheck.schema, 'agent-onboard-public-target-handoff-readiness-check-001');
    assert.strictEqual(readinessCheck.status, 'ok');
    assert.strictEqual(readinessCheck.version, EXPECTED_VERSION);
    assert.strictEqual(readinessCheck.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(readinessCheck.command, 'agent-onboard target handoff --readiness-check');
    assert.strictEqual(readinessCheck.readiness_check.status, 'usable_with_warnings');
    assert.strictEqual(readinessCheck.readiness_check.next_agent_ready, true);
    assert.strictEqual(readinessCheck.readiness_check.stable_reason_code_surface, true);
    assert.strictEqual(readinessCheck.readiness_check.fail_closed_on_blocker, true);
    assert.strictEqual(readinessCheck.readiness_check.warnings_do_not_fail_check, true);
    assert.ok(readinessCheck.readiness_check.warning_reason_codes.includes('open_target_work_item_should_be_continued_before_new_admission'));
    assert.deepStrictEqual(readinessCheck.readiness_check.blocker_reason_codes, []);
    assert.strictEqual(readinessCheck.output_policy.raw_work_items_file_inlined, false);
    assert.strictEqual(readinessCheck.output_policy.planned_index_payloads_inlined, false);
    assert.strictEqual(readinessCheck.boundary.writes_files, false);
    assert.strictEqual(readinessCheck.writes_performed, false);
    assert.strictEqual(JSON.stringify(readinessCheck).includes('target instructions must not be inlined'), false);

    const readinessCheckText = run(['target', 'handoff', '--readiness-check', '--text', '--target', dir]);
    assert.strictEqual(readinessCheckText.status, 0, readinessCheckText.stderr || readinessCheckText.stdout);
    assert.ok(readinessCheckText.stdout.includes('agent-onboard target handoff readiness check'));
    assert.ok(readinessCheckText.stdout.includes('Next-agent ready: true'));
    assert.ok(readinessCheckText.stdout.includes('warning:open_target_work_item_should_be_continued_before_new_admission'));
    assert.ok(readinessCheckText.stdout.includes('no-write readiness check'));

    const largeLedgerDir = tempRepo();
    fs.mkdirSync(path.join(largeLedgerDir, '.agent-onboard'), { recursive: true });
    fs.writeFileSync(path.join(largeLedgerDir, '.agent-onboard', 'work-items.json'), JSON.stringify({ schema: 'target-work-items-fixture', work_items: [] }, null, 2) + '\n');
    const largeClaimsLine = JSON.stringify({ schema: 'claim-fixture', claim_status: 'proposed', work_item_id: 'fixture-oversized-work-item', claim_id: 'oversized', actor: 'fixture', note: 'x'.repeat(4096) }) + '\n';
    fs.writeFileSync(path.join(largeLedgerDir, '.agent-onboard', 'claims.jsonl'), largeClaimsLine.repeat(40));
    const blockedBudgetHandoff = readJsonOutput(run(['target', 'handoff', '--json', '--target', largeLedgerDir]));
    assert.strictEqual(blockedBudgetHandoff.status, 'ok');
    assert.strictEqual(blockedBudgetHandoff.handoff.governance_budget_summary.status, 'blocked');
    assert.strictEqual(blockedBudgetHandoff.handoff.governance_budget_summary.budget_within_contract, false);
    assert.ok(blockedBudgetHandoff.handoff.readiness.blockers.includes('governance_budget_check_blocked') || blockedBudgetHandoff.handoff.readiness.blockers.includes('governance_budget_over_contract'));
    assert.ok(blockedBudgetHandoff.handoff.readiness.reason_codes.includes('governance_budget_check_blocked') || blockedBudgetHandoff.handoff.readiness.reason_codes.includes('governance_budget_over_contract'));
    assert.ok(blockedBudgetHandoff.handoff.readiness.reasons.some((entry) => entry.severity === 'blocker' && entry.next_command === 'agent-onboard target governance --budget-check --text'));
    assert.strictEqual(JSON.stringify(blockedBudgetHandoff).includes('oversized'), false);

    const blockedReadinessCheck = readJsonFailure(run(['target', 'handoff', '--readiness-check', '--json', '--target', largeLedgerDir]));
    assert.strictEqual(blockedReadinessCheck.schema, 'agent-onboard-public-target-handoff-readiness-check-001');
    assert.strictEqual(blockedReadinessCheck.status, 'blocked');
    assert.strictEqual(blockedReadinessCheck.readiness_check.next_agent_ready, false);
    assert.ok(blockedReadinessCheck.readiness_check.blocker_reason_codes.includes('governance_budget_check_blocked') || blockedReadinessCheck.readiness_check.blocker_reason_codes.includes('governance_budget_over_contract'));
    assert.strictEqual(blockedReadinessCheck.output_policy.raw_claims_ledger_inlined, false);
    assert.strictEqual(JSON.stringify(blockedReadinessCheck).includes('oversized'), false);

    const refused = run(['target', 'handoff', '--write', '--target', dir]);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 1);
    assert.strictEqual(refusedOutput.status, 'error');
  });


  fullSourceTest('public create dry-run is directly usable', () => {
    const dryRunResult = run(['create', '--dry-run']);
    const dryRunOutput = readJsonOutput(dryRunResult);
    assert.strictEqual(dryRunOutput.schema, 'agent-onboard-public-create-dry-run-001');
    assert.strictEqual(dryRunOutput.status, 'ok');
    assert.strictEqual(dryRunOutput.version, EXPECTED_VERSION);
    assert.strictEqual(dryRunOutput.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(dryRunOutput.command, 'agent-onboard create --dry-run');
    assert.strictEqual(dryRunOutput.mode, 'dry-run');
    assert.ok(dryRunOutput.preview.planned_files.some((item) => item.path === '.agent-onboard/work-items.json'));
    assert.strictEqual(dryRunOutput.boundary.writes_files, false);
    assert.strictEqual(dryRunOutput.boundary.installs_dependencies, false);
    assert.strictEqual(dryRunOutput.boundary.git_mutation, false);

    const jsonResult = run(['create', '--json']);
    const jsonOutput = readJsonOutput(jsonResult);
    assert.strictEqual(jsonOutput.schema, 'agent-onboard-public-create-dry-run-001');

    const textResult = run(['create', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard create dry-run'));
    assert.ok(textResult.stdout.includes('create-agent-onboard --dry-run'));

    const refused = run(['create', '--write']);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 2);
    assert.strictEqual(refusedOutput.status, 'not_admitted');
  });


  fullSourceTest('public quickstart is directly usable', () => {
    const jsonResult = run(['quickstart', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-quickstart-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.ok(output.modes.includes('--dry-run'));
    assert.ok(output.primary_recipe.some((item) => item.command === 'agent-onboard target bootstrap --dry-run'));
    assert.ok(output.minimum_target_files.includes('.agent-onboard/target.json'));
    assert.strictEqual(output.write_after_preview.requires_owner_authorization, true);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);

    const dryRunResult = run(['quickstart', '--dry-run']);
    const dryRunOutput = readJsonOutput(dryRunResult);
    assert.strictEqual(dryRunOutput.schema, 'agent-onboard-public-quickstart-001');

    const textResult = run(['quickstart', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard quickstart'));
    assert.ok(textResult.stdout.includes('Read-only first-run recipe'));
    assert.ok(textResult.stdout.includes('agent-onboard target bootstrap --dry-run'));
  });


  fullSourceTest('public operator guide is directly usable', () => {
    const jsonResult = run(['guide', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-operator-guide-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.ok(output.first_read_order.includes('README.md'));
    assert.ok(output.first_read_order.includes('llms.txt'));
    assert.ok(output.workflows.new_agent_orientation.commands.includes('agent-onboard commands --text'));
    assert.ok(output.workflows.new_agent_orientation.commands.includes('agent-onboard quickstart --text'));
    assert.ok(output.workflows.target_repo_triage.commands.includes('agent-onboard target doctor --text'));
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);

    const textResult = run(['guide', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard operator guide'));
    assert.ok(textResult.stdout.includes('New agent orientation'));
    assert.ok(textResult.stdout.includes('Target repo triage'));
  });


  fullSourceTest('full source block line 161', () => {
    const result = run(['status']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
  });


  fullSourceTest('full source block line 169', () => {
    const result = run(['release', '--plan']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.schema, 'agent-onboard-public-release-plan-005');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.boundary.publishes_package, false);
    assert.ok(output.post_publish_verification_commands.some((command) => command.includes(`agent-onboard@${EXPECTED_VERSION}`)));
    assert.strictEqual(output.contract_schema, 'agent-onboard-public-release-contract-039');
    assert.strictEqual(output.contract_command, 'agent-onboard release --contract');
    assert.strictEqual(output.fixture_command, 'agent-onboard release --fixture');
    assert.strictEqual(output.parity_smoke_command, 'agent-onboard release --parity-smoke');
    assert.strictEqual(output.architecture_parity_smoke_command, 'agent-onboard release --architecture-parity-smoke');
    assert.strictEqual(output.target_onboarding_smoke_command, 'agent-onboard release --target-onboarding-smoke');
    assert.strictEqual(output.post_publish_handoff_command, 'agent-onboard release --post-publish-handoff');
    assert.strictEqual(output.published_acceptance_command, 'agent-onboard release --published-acceptance');
    assert.strictEqual(output.real_target_trial_command, 'agent-onboard release --real-target-trial');
    assert.strictEqual(output.architecture_map_command, 'agent-onboard architecture --map');
    assert.strictEqual(output.architecture_router_command, 'agent-onboard architecture --router');
    assert.strictEqual(output.architecture_facades_command, 'agent-onboard architecture --facades');
    assert.strictEqual(output.architecture_partition_plan_command, 'agent-onboard architecture --partition-plan');
    assert.strictEqual(output.architecture_partition_check_command, 'agent-onboard architecture --partition-check');
    assert.strictEqual(output.architecture_extraction_rehearsal_command, 'agent-onboard architecture --extraction-rehearsal');
    assert.strictEqual(output.architecture_extraction_check_command, 'agent-onboard architecture --extraction-check');
    assert.strictEqual(output.architecture_first_slice_command, 'agent-onboard architecture --first-slice');
    assert.strictEqual(output.architecture_first_slice_check_command, 'agent-onboard architecture --first-slice-check');
    assert.strictEqual(output.architecture_bundle_parity_command, 'agent-onboard architecture --bundle-parity');
    assert.strictEqual(output.architecture_bundle_parity_check_command, 'agent-onboard architecture --bundle-parity-check');
    assert.strictEqual(output.architecture_runtime_bridge_command, 'agent-onboard architecture --runtime-bridge');
    assert.strictEqual(output.architecture_runtime_bridge_check_command, 'agent-onboard architecture --runtime-bridge-check');
    assert.strictEqual(output.architecture_installed_fallback_smoke_command, 'agent-onboard architecture --installed-fallback-smoke');
    assert.strictEqual(output.architecture_installed_fallback_check_command, 'agent-onboard architecture --installed-fallback-check');
    assert.strictEqual(output.architecture_second_slice_plan_command, 'agent-onboard architecture --second-slice-plan');
    assert.strictEqual(output.architecture_second_slice_check_command, 'agent-onboard architecture --second-slice-check');
    assert.strictEqual(output.architecture_second_slice_first_slice_command, 'agent-onboard architecture --second-slice-first-slice');
    assert.strictEqual(output.architecture_second_slice_first_slice_check_command, 'agent-onboard architecture --second-slice-first-slice-check');
    assert.strictEqual(output.architecture_authority_bundle_parity_command, 'agent-onboard architecture --authority-bundle-parity');
    assert.strictEqual(output.architecture_authority_bundle_parity_check_command, 'agent-onboard architecture --authority-bundle-parity-check');
    assert.strictEqual(output.architecture_authority_runtime_bridge_command, 'agent-onboard architecture --authority-runtime-bridge');
    assert.strictEqual(output.architecture_authority_runtime_bridge_check_command, 'agent-onboard architecture --authority-runtime-bridge-check');
    assert.strictEqual(output.architecture_work_items_plan_command, 'agent-onboard architecture --work-items-plan');
    assert.strictEqual(output.architecture_work_items_check_command, 'agent-onboard architecture --work-items-check');
    assert.strictEqual(output.architecture_work_items_first_slice_command, 'agent-onboard architecture --work-items-first-slice');
    assert.strictEqual(output.architecture_work_items_first_slice_check_command, 'agent-onboard architecture --work-items-first-slice-check');
    assert.strictEqual(output.architecture_work_items_bundle_parity_command, 'agent-onboard architecture --work-items-bundle-parity');
    assert.strictEqual(output.architecture_work_items_bundle_parity_check_command, 'agent-onboard architecture --work-items-bundle-parity-check');
    assert.strictEqual(output.architecture_work_items_runtime_bridge_command, 'agent-onboard architecture --work-items-runtime-bridge');
    assert.strictEqual(output.architecture_work_items_runtime_bridge_check_command, 'agent-onboard architecture --work-items-runtime-bridge-check');
    assert.strictEqual(output.architecture_work_items_installed_fallback_smoke_command, 'agent-onboard architecture --work-items-installed-fallback-smoke');
    assert.strictEqual(output.architecture_work_items_installed_fallback_check_command, 'agent-onboard architecture --work-items-installed-fallback-check');
    assert.strictEqual(output.architecture_claims_plan_command, 'agent-onboard architecture --claims-plan');
    assert.strictEqual(output.architecture_claims_check_command, 'agent-onboard architecture --claims-check');
    assert.strictEqual(output.architecture_claims_first_slice_command, 'agent-onboard architecture --claims-first-slice');
    assert.strictEqual(output.architecture_claims_first_slice_check_command, 'agent-onboard architecture --claims-first-slice-check');
    assert.strictEqual(output.architecture_claims_bundle_parity_command, 'agent-onboard architecture --claims-bundle-parity');
    assert.strictEqual(output.architecture_claims_bundle_parity_check_command, 'agent-onboard architecture --claims-bundle-parity-check');
    assert.strictEqual(output.architecture_claims_runtime_bridge_command, 'agent-onboard architecture --claims-runtime-bridge');
    assert.strictEqual(output.architecture_claims_runtime_bridge_check_command, 'agent-onboard architecture --claims-runtime-bridge-check');
    assert.strictEqual(output.architecture_claims_installed_fallback_smoke_command, 'agent-onboard architecture --claims-installed-fallback-smoke');
    assert.strictEqual(output.architecture_claims_installed_fallback_check_command, 'agent-onboard architecture --claims-installed-fallback-check');
    assert.strictEqual(output.architecture_source_domain_closure_review_command, 'agent-onboard architecture --source-domain-closure-review');
    assert.strictEqual(output.architecture_source_domain_closure_check_command, 'agent-onboard architecture --source-domain-closure-check');
    assert.strictEqual(output.architecture_cli_runtime_plan_command, 'agent-onboard architecture --cli-runtime-plan');
    assert.strictEqual(output.architecture_cli_runtime_check_command, 'agent-onboard architecture --cli-runtime-check');
    assert.strictEqual(output.architecture_compatibility_port_command, 'agent-onboard architecture --compatibility-port');
    assert.strictEqual(output.architecture_compatibility_port_check_command, 'agent-onboard architecture --compatibility-port-check');
    assert.strictEqual(output.architecture_core_adapter_command, 'agent-onboard architecture --core-adapter');
    assert.strictEqual(output.architecture_core_adapter_check_command, 'agent-onboard architecture --core-adapter-check');
    assert.strictEqual(output.architecture_package_adapter_command, 'agent-onboard architecture --package-adapter');
    assert.strictEqual(output.architecture_package_adapter_check_command, 'agent-onboard architecture --package-adapter-check');
    assert.strictEqual(output.architecture_architecture_adapter_command, 'agent-onboard architecture --architecture-adapter');
    assert.strictEqual(output.architecture_architecture_adapter_check_command, 'agent-onboard architecture --architecture-adapter-check');
    assert.strictEqual(output.architecture_authority_adapter_command, 'agent-onboard architecture --authority-adapter');
    assert.strictEqual(output.architecture_authority_adapter_check_command, 'agent-onboard architecture --authority-adapter-check');
    assert.strictEqual(output.architecture_module_inclusion_plan_command, 'agent-onboard architecture --module-inclusion-plan');
    assert.strictEqual(output.architecture_module_inclusion_check_command, 'agent-onboard architecture --module-inclusion-check');
    assert.strictEqual(output.architecture_packaged_router_port_command, 'agent-onboard architecture --packaged-router-port');
    assert.strictEqual(output.architecture_packaged_router_port_check_command, 'agent-onboard architecture --packaged-router-port-check');
    assert.strictEqual(output.architecture_thin_entrypoint_rehearsal_command, 'agent-onboard architecture --thin-entrypoint-rehearsal');
    assert.strictEqual(output.architecture_thin_entrypoint_rehearsal_check_command, 'agent-onboard architecture --thin-entrypoint-rehearsal-check');
    assert.strictEqual(output.architecture_thin_entrypoint_cutover_command, 'agent-onboard architecture --thin-entrypoint-cutover');
    assert.strictEqual(output.architecture_thin_entrypoint_cutover_check_command, 'agent-onboard architecture --thin-entrypoint-cutover-check');
    assert.strictEqual(output.architecture_router_adapter_delegation_command, 'agent-onboard architecture --router-adapter-delegation');
    assert.strictEqual(output.architecture_router_adapter_delegation_check_command, 'agent-onboard architecture --router-adapter-delegation-check');
    assert.strictEqual(output.architecture_check_command, 'agent-onboard architecture --check');
    assert.strictEqual(output.authority_first_read_command, 'agent-onboard authority --first-read');
    assert.strictEqual(output.authority_check_command, 'agent-onboard authority --check');
    assert.strictEqual(output.authority_compact_index_command, 'agent-onboard authority --index');
    assert.strictEqual(output.authority_compact_index_check_command, 'agent-onboard authority --index-check');
  });
};
