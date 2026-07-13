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

  fullSourceTest('public runtime contracts module centralizes command and package constants', () => {
    const contracts = require(path.join(ROOT, 'cli', 'agent_onboard', 'runtime-contracts.js'));
    const composer = require(path.join(ROOT, 'cli', 'agent_onboard', 'runtime-composer.js'));
    assert.strictEqual(contracts.RUNTIME_CONTRACTS.schema, 'agent-onboard-public-runtime-contracts-001');
    assert.strictEqual(contracts.RUNTIME_CONTRACTS.package_name, 'agent-onboard');
    assert.strictEqual(contracts.RELEASE_LINE, EXPECTED_RELEASE_LINE);
    assert.strictEqual(contracts.TOP_LEVEL_COMMAND.contracts, 'contracts');
    assert.ok(contracts.PRODUCT_HELP_LINES.includes('agent-onboard contracts --json|--text|--check|--validate-output --contract <id> --file <path>'));
    assert.ok(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.includes('cli/agent_onboard/contracts/public-contracts.js'));
    assert.strictEqual(contracts.TARGET_CONFIG_FILE, '.agent-onboard/target.json');
    assert.strictEqual(contracts.TARGET_COMMAND.doctor, 'doctor');
    assert.strictEqual(contracts.TARGET_COMMAND.metadata, 'metadata');
    assert.strictEqual(contracts.TARGET_COMMAND.memory, 'memory');
    assert.strictEqual(contracts.TARGET_COMMAND.workItems, 'work-items');
    assert.strictEqual(contracts.TARGET_COMMAND.handoff, 'handoff');
    assert.strictEqual(contracts.TARGET_DOCTOR_COMMAND.flag.text, '--text');
    assert.strictEqual(contracts.TARGET_METADATA_COMMAND.flag.target, '--target');
    assert.strictEqual(contracts.TARGET_WORK_ITEMS_COMMAND.flag.text, '--text');
    assert.strictEqual(contracts.TARGET_HANDOFF_COMMAND.flag.text, '--text');
    assert.strictEqual(contracts.TARGET_METADATA_COMMAND.mode.write, '--write');
    assert.strictEqual(contracts.TARGET_PROFILE_COMMAND.flag.target, '--target');
    assert.ok(Object.isFrozen(contracts.TARGET_COMMAND));
    assert.ok(contracts.RUNTIME_CONTRACTS.top_level_commands.includes('target'));
    assert.deepStrictEqual(contracts.ROUTER_COMMAND_ORDER, ['help', 'version', 'status', 'create', 'issue', 'contributor', 'claim', 'contracts', 'check', 'ci', 'mcp', 'init', 'agents', 'bridge', 'guard', 'authority', 'architecture', 'release', 'target-config', 'work-items', 'target', 'target-instance']);
    assert.strictEqual(contracts.TOP_LEVEL_COMMAND_ALIAS.helpLong, '--help');
    assert.deepStrictEqual(contracts.RUNTIME_COMMAND_GROUP.target, ['init', 'target-config', 'target', 'target-instance']);
    assert.deepStrictEqual(contracts.RUNTIME_ADAPTER_GROUP.core, ['help', '--help', '-h', 'version', '--version', '-v', 'status']);
    assert.ok(contracts.PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES.includes('cli/agent_onboard/runtime-contracts.js'));
    assert.deepStrictEqual(contracts.PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.slice().sort(), EXPECTED_PACK_FILES_SORTED);
    assert.strictEqual(composer.RUNTIME_CONTRACTS, contracts.RUNTIME_CONTRACTS);
  });


  fullSourceTest('public command surface catalog is directly discoverable', () => {
    const jsonResult = run(['commands', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-command-surface-catalog-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.deepStrictEqual(output.top_level_commands, ['help', 'version', 'status', 'commands', 'guide', 'quickstart', 'discovery', 'create', 'issue', 'contributor', 'claim', 'contracts', 'check', 'ci', 'mcp', 'init', 'agents', 'bridge', 'guard', 'authority', 'architecture', 'release', 'target-config', 'work-items', 'target', 'target-instance']);
    assert.ok(output.runtime_command_groups.core.includes('commands'));
    assert.ok(output.runtime_command_groups.core.includes('quickstart'));
    assert.ok(output.runtime_command_groups.core.includes('discovery'));
    assert.ok(output.runtime_command_groups.core.includes('create'));
    assert.ok(output.runtime_command_groups.core.includes('issue'));
    assert.ok(output.runtime_command_groups.core.includes('contributor'));
    assert.ok(output.runtime_command_groups.core.includes('check'));
    assert.ok(output.runtime_command_groups.core.includes('ci'));
    assert.ok(output.runtime_command_groups.core.includes('mcp'));
    assert.ok(output.help_lines.includes('agent-onboard commands --json|--text'));
    assert.ok(output.help_lines.includes('agent-onboard guide --json|--text'));
    assert.ok(output.help_lines.includes('agent-onboard quickstart --json|--text|--dry-run'));
    assert.ok(output.help_lines.includes('agent-onboard discovery --llms|--json|--text'));
    assert.ok(output.help_lines.includes('agent-onboard create --dry-run|--json|--text'));
    assert.ok(output.help_lines.some((line) => line.startsWith('agent-onboard issue --classify-dry-run|--json|--text')));
    assert.ok(output.help_lines.some((line) => line.startsWith('agent-onboard contributor --admission-dry-run|--json|--text')));
    assert.ok(output.help_lines.includes('agent-onboard claim --validate-ledger [--file <path>] [--json|--text]'));
    assert.ok(output.help_lines.some((line) => line.includes('--artifact-oracle|--artifact-oracle-check')));
    assert.ok(output.help_lines.some((line) => line.includes('--authority-state-parity|--authority-state-parity-check')));
    assert.ok(output.help_lines.some((line) => line.includes('authority --first-read|--check|--index|--index-check|--state|--state-check')));
    assert.ok(output.help_lines.some((line) => line.startsWith('agent-onboard claim --append --dry-run|--write')));
    assert.ok(output.help_lines.includes('agent-onboard check --plan|--fast [--json|--text]'));
    assert.ok(output.help_lines.includes('agent-onboard ci --github-action|--json|--text'));
    assert.ok(output.help_lines.includes('agent-onboard mcp --plan|--json|--text'));
    assert.ok(output.help_lines.includes('agent-onboard target inventory --preview|--json|--text [--target <path>]'));
    assert.ok(output.help_lines.includes('agent-onboard target memory --preview|--json|--text [--target <path>]'));
    assert.ok(output.help_lines.includes('agent-onboard target work-items --preview|--json|--text [--target <path>]'));
    assert.ok(output.help_lines.includes('agent-onboard target governance --preview|--check|--budget-contract|--budget-check|--materialize-dry-run|--materialize --write [--force]|--json|--text [--target <path>]'));
    assert.ok(output.help_lines.includes('agent-onboard target handoff --preview|--readiness-check|--json|--text [--target <path>]'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard commands --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard guide --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard quickstart --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard discovery --llms'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard create --dry-run'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard issue --classify-dry-run --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard contributor --admission-dry-run --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard claim --validate-ledger --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard check --plan --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard check --fast --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard ci --github-action'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard mcp --plan --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard target inventory --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard target memory --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard target governance --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard target work-items --text'));
    assert.ok(output.recommended_first_commands.includes('agent-onboard target handoff --text'));
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.publishes_package, false);

    const textResult = run(['commands', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard command surface'));
    assert.ok(textResult.stdout.includes('agent-onboard commands --json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard guide --json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard quickstart --json|--text|--dry-run'));
    assert.ok(textResult.stdout.includes('agent-onboard discovery --llms|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard create --dry-run|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard issue --classify-dry-run|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard contributor --admission-dry-run|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard claim --validate-ledger [--file <path>] [--json|--text]'));
    assert.ok(textResult.stdout.includes('agent-onboard claim --lifecycle-check [--file <path>] [--stale-hours <hours>] [--json|--text]'));
    assert.ok(textResult.stdout.includes('agent-onboard check --plan|--fast [--json|--text]'));
    assert.ok(textResult.stdout.includes('agent-onboard authority --first-read|--check|--index|--index-check|--state|--state-check'));
    assert.ok(textResult.stdout.includes('agent-onboard ci --github-action|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard mcp --plan|--json|--text'));
    assert.ok(textResult.stdout.includes('agent-onboard target inventory --preview|--json|--text [--target <path>]'));
    assert.ok(textResult.stdout.includes('agent-onboard target memory --preview|--json|--text [--target <path>]'));
    assert.ok(textResult.stdout.includes('agent-onboard target work-items --preview|--json|--text [--target <path>]'));
    assert.ok(textResult.stdout.includes('agent-onboard target governance --preview|--check|--budget-contract|--budget-check|--materialize-dry-run|--materialize --write [--force]|--json|--text [--target <path>]'));
    assert.ok(textResult.stdout.includes('agent-onboard target handoff --preview|--readiness-check|--json|--text [--target <path>]'));
  });


  fullSourceTest('public claim ledger JSONL command validates and appends explicitly', () => {
    const dir = tempRepo();
    const ledgerFile = path.join(dir, '.agent-onboard', 'claims.jsonl');
    fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
    fs.writeFileSync(ledgerFile, [
      JSON.stringify({ schema: 'agent-onboard-public-claim-ledger-entry-001', event_type: 'claim_proposed', claim_status: 'proposed', claim_id: 'claim-fixture-001', work_item_id: 'P1S3M5W37', actor: 'agent-a', created_at: '2026-07-06T00:00:00.000Z' }),
      JSON.stringify({ schema: 'agent-onboard-public-claim-ledger-entry-001', event_type: 'claim_merged', claim_status: 'merged', claim_id: 'claim-fixture-001', work_item_id: 'P1S3M5W37', actor: 'agent-a', created_at: '2026-07-06T00:01:00.000Z' })
    ].join('\n') + '\n');

    const validateResult = run(['claim', '--validate-ledger', '--json'], { cwd: dir });
    const output = readJsonOutput(validateResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-claim-ledger-validation-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.file, '.agent-onboard/claims.jsonl');
    assert.strictEqual(output.line_count, 2);
    assert.strictEqual(output.event_counts.claim_proposed, 1);
    assert.strictEqual(output.event_counts.claim_merged, 1);
    assert.strictEqual(output.output_policy.raw_claims_ledger_inlined, false);
    assert.strictEqual(output.output_policy.compact_lifecycle_only, true);
    assert.strictEqual(output.lifecycle.status, 'ok');
    assert.strictEqual(output.lifecycle.conflict_count, 0);
    assert.strictEqual(output.boundary.writes_files, false);

    const textResult = run(['claim', '--validate-ledger', '--text'], { cwd: dir });
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard claim ledger validation'));
    assert.ok(textResult.stdout.includes('Writes performed: false'));

    const lifecycleResult = run(['claim', '--lifecycle-check', '--json', '--now', '2026-07-06T00:02:00.000Z'], { cwd: dir });
    const lifecycleOutput = readJsonOutput(lifecycleResult);
    assert.strictEqual(lifecycleOutput.schema, 'agent-onboard-public-claim-ledger-lifecycle-result-001');
    assert.strictEqual(lifecycleOutput.status, 'ok');
    assert.strictEqual(lifecycleOutput.active_claim_count, 0);
    assert.strictEqual(lifecycleOutput.conflict_count, 0);
    assert.strictEqual(lifecycleOutput.boundary.writes_files, false);

    const dryRun = run(['claim', '--append', '--dry-run', '--work-item-id', 'P1S3M5W38', '--actor', 'agent-b', '--event-type', 'claim_proposed', '--claim-id', 'claim-fixture-002', '--created-at', '2026-07-06T00:02:00.000Z'], { cwd: dir });
    const dryOutput = readJsonOutput(dryRun);
    assert.strictEqual(dryOutput.schema, 'agent-onboard-public-claim-ledger-append-result-001');
    assert.strictEqual(dryOutput.status, 'ok');
    assert.strictEqual(dryOutput.writes_performed, false);
    assert.strictEqual(fs.readFileSync(ledgerFile, 'utf8').trim().split(/\r?\n/).length, 2);

    const write = run(['claim', '--append', '--write', '--work-item-id', 'P1S3M5W38', '--actor', 'agent-b', '--event-type', 'claim_proposed', '--claim-id', 'claim-fixture-002', '--created-at', '2026-07-06T00:02:00.000Z'], { cwd: dir });
    const writeOutput = readJsonOutput(write);
    assert.strictEqual(writeOutput.status, 'ok');
    assert.strictEqual(writeOutput.writes_performed, true);
    assert.strictEqual(writeOutput.boundary.mutates_only_claims_ledger, true);
    assert.strictEqual(fs.readFileSync(ledgerFile, 'utf8').trim().split(/\r?\n/).length, 3);
  });


  fullSourceTest('public claim lifecycle check detects active claim conflicts and append refuses them', () => {
    const dir = tempRepo();
    const ledgerFile = path.join(dir, '.agent-onboard', 'claims.jsonl');
    fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
    fs.writeFileSync(ledgerFile, [
      JSON.stringify({ schema: 'agent-onboard-public-claim-ledger-entry-001', event_type: 'claim_proposed', claim_status: 'proposed', claim_id: 'claim-conflict-a', work_item_id: 'P1S3M5W42', actor: 'agent-a', created_at: '2026-07-06T00:00:00.000Z' }),
      JSON.stringify({ schema: 'agent-onboard-public-claim-ledger-entry-001', event_type: 'claim_proposed', claim_status: 'proposed', claim_id: 'claim-conflict-b', work_item_id: 'P1S3M5W42', actor: 'agent-b', created_at: '2026-07-06T00:01:00.000Z' })
    ].join('\n') + '\n');

    const lifecycle = run(['claim', '--lifecycle-check', '--json', '--now', '2026-07-06T00:02:00.000Z'], { cwd: dir });
    assert.notStrictEqual(lifecycle.status, 0);
    const lifecycleOutput = readJsonFailure(lifecycle);
    assert.strictEqual(lifecycleOutput.status, 'error');
    assert.strictEqual(lifecycleOutput.conflict_count, 1);
    assert.strictEqual(lifecycleOutput.active_claim_count, 2);
    assert.strictEqual(lifecycleOutput.output_policy.raw_claims_ledger_inlined, false);

    fs.writeFileSync(ledgerFile, JSON.stringify({ schema: 'agent-onboard-public-claim-ledger-entry-001', event_type: 'claim_proposed', claim_status: 'proposed', claim_id: 'claim-active-a', work_item_id: 'P1S3M5W43', actor: 'agent-a', created_at: '2026-07-06T00:00:00.000Z' }) + '\n');
    const rejected = run(['claim', '--append', '--dry-run', '--work-item-id', 'P1S3M5W43', '--actor', 'agent-b', '--event-type', 'claim_proposed', '--claim-id', 'claim-active-b', '--created-at', '2026-07-06T00:01:00.000Z', '--now', '2026-07-06T00:02:00.000Z'], { cwd: dir });
    assert.notStrictEqual(rejected.status, 0);
    const rejectedOutput = readJsonFailure(rejected);
    assert.strictEqual(rejectedOutput.status, 'error');
    assert.strictEqual(rejectedOutput.writes_performed, false);
    assert.strictEqual(rejectedOutput.planned_lifecycle.conflict_count, 1);
  });


  fullSourceTest('public discovery is directly usable', () => {
    const jsonResult = run(['discovery', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-ai-discovery-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.llms_command, 'agent-onboard discovery --llms');
    assert.ok(output.first_read_order.includes('llms.txt'));
    assert.ok(output.stable_commands.includes('agent-onboard guide --text'));
    assert.ok(output.stable_commands.includes('agent-onboard quickstart --text'));
    assert.ok(output.stable_commands.includes('agent-onboard issue --classify-dry-run --text'));
    assert.ok(output.stable_commands.includes('agent-onboard contributor --admission-dry-run --text'));
    assert.ok(output.stable_commands.includes('agent-onboard check --plan --text'));
    assert.ok(output.stable_commands.includes('agent-onboard check --fast --text'));
    assert.ok(output.stable_commands.includes('agent-onboard ci --github-action'));
    assert.ok(output.stable_commands.includes('agent-onboard mcp --plan --text'));
    assert.ok(output.stable_commands.includes('agent-onboard commands --text'));
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);

    const textResult = run(['discovery', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard AI discovery'));
    assert.ok(textResult.stdout.includes('agent-onboard discovery --llms'));

    const llmsResult = run(['discovery', '--llms']);
    assert.strictEqual(llmsResult.status, 0, llmsResult.stderr || llmsResult.stdout);
    assert.ok(llmsResult.stdout.includes('# agent-onboard'));
    assert.ok(llmsResult.stdout.includes('Stable commands:'));
    assert.ok(llmsResult.stdout.includes('discovery --llms'));
  });


  fullSourceTest('public issue intake dry-run is directly usable', () => {
    const jsonResult = run(['issue', '--classify-dry-run', '--json', '--title', 'Generalize agent claim handling', '--label', 'admission:upstream-candidate', '--actor', 'autonomous_agent', '--repo', 'glogos-org/agent-onboard', '--issue-number', '42']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-issue-intake-classification-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard issue --classify-dry-run');
    assert.strictEqual(output.source.repository, 'glogos-org/agent-onboard');
    assert.strictEqual(output.source.issue_number, '42');
    assert.strictEqual(output.actor_classification.kind, 'autonomous_agent');
    assert.strictEqual(output.issue_classification.disposition, 'upstream_candidate');
    assert.strictEqual(output.issue_classification.canonical_work_item_created, false);
    assert.strictEqual(output.issue_classification.admitted_claim_created, false);
    assert.strictEqual(output.work_item_candidate_preview.candidate_created_in_memory, true);
    assert.strictEqual(output.work_item_candidate_preview.canonical_work_item_created, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.github_api_dependency_now, false);
    assert.strictEqual(output.boundary.network, false);

    const textResult = run(['issue', '--classify-dry-run', '--text', '--label', 'duplicate']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard issue intake dry-run'));
    assert.ok(textResult.stdout.includes('Disposition: duplicate'));

    const refused = run(['issue', '--write']);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 2);
    assert.strictEqual(refusedOutput.status, 'not_admitted');
  });


  fullSourceTest('public contributor admission dry-run is directly usable', () => {
    const jsonResult = run(['contributor', '--admission-dry-run', '--json', '--actor', 'agent', '--handle', 'review-bot', '--repo', 'glogos-org/agent-onboard', '--identity-surface', 'github-user', '--agreement', 'project-policy', '--ai-assisted', 'yes', '--assisted-by', 'Assisted-by: review-bot:example-model']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-contributor-admission-dry-run-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard contributor --admission-dry-run');
    assert.strictEqual(output.actor_record_preview.actor_type, 'agent');
    assert.strictEqual(output.actor_record_preview.handle, 'review-bot');
    assert.strictEqual(output.actor_record_preview.repository_identifier, 'glogos-org/agent-onboard');
    assert.strictEqual(output.ai_assistance_policy.ai_assistance_used, true);
    assert.strictEqual(output.ai_assistance_policy.assisted_by_present, true);
    assert.strictEqual(output.ai_assistance_policy.ai_signed_off_by_allowed_now, false);
    assert.strictEqual(output.admission_preview.canonical_contributor_record_created, false);
    assert.strictEqual(output.admission_preview.contributor_ledger_written, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.github_api_dependency_now, false);
    assert.strictEqual(output.boundary.network, false);

    const textResult = run(['contributor', '--admission-dry-run', '--text', '--actor', 'human', '--handle', 'alice']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard contributor admission dry-run'));
    assert.ok(textResult.stdout.includes('Authority: candidate only'));

    const refused = run(['contributor', '--write']);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 2);
    assert.strictEqual(refusedOutput.status, 'not_admitted');
  });


  fullSourceTest('public check plan and fast runner are directly usable', () => {
    const planResult = run(['check', '--plan', '--json']);
    const plan = readJsonOutput(planResult);
    assert.strictEqual(plan.schema, 'agent-onboard-public-check-plan-001');
    assert.strictEqual(plan.status, 'ok');
    assert.strictEqual(plan.version, EXPECTED_VERSION);
    assert.strictEqual(plan.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(plan.command, 'agent-onboard check --plan');
    assert.strictEqual(plan.plan_mode, 'default-fast');
    assert.strictEqual(plan.runner_type, 'in_process_public_runtime_runner');
    assert.strictEqual(plan.runner_engine.engine_id, 'public-package-fast-runner-engine');
    assert.strictEqual(plan.runner_engine.command_dedupe_enabled, true);
    assert.strictEqual(plan.runner_engine.progress_jsonl_supported, true);
    assert.strictEqual(plan.runner_engine.output_budget.shape, 'agent-onboard-public-package-fast-runner-output-budget-v1');
    assert.strictEqual(plan.unique_command_count, plan.runnable_command_count);
    assert.ok(plan.omitted_slow_checks.every((item) => typeof item.reason_key === 'string'));
    assert.ok(plan.checks.some((item) => item.id === 'release-check'));
    assert.ok(plan.omitted_slow_checks.some((item) => item.id === 'npm-pack-dry-run'));
    assert.ok(plan.omitted_slow_checks.some((item) => item.id === 'release-artifact-oracle' && item.command === 'agent-onboard release --artifact-oracle'));
    assert.strictEqual(plan.boundary.writes_files, false);
    assert.strictEqual(plan.boundary.child_process_spawn, false);
    assert.strictEqual(plan.boundary.runs_package_manager, false);
    assert.strictEqual(plan.boundary.network, false);

    const planText = run(['check', '--plan', '--text']);
    assert.strictEqual(planText.status, 0, planText.stderr || planText.stdout);
    assert.ok(planText.stdout.includes('agent-onboard check plan'));
    assert.ok(planText.stdout.includes('release-check'));

    const fastResult = run(['check', '--fast', '--json']);
    const fast = readJsonOutput(fastResult);
    assert.strictEqual(fast.schema, 'agent-onboard-public-check-fast-result-001');
    assert.strictEqual(fast.status, 'ok');
    assert.strictEqual(fast.result, 'pass');
    assert.strictEqual(fast.version, EXPECTED_VERSION);
    assert.strictEqual(fast.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(fast.command, 'agent-onboard check --fast');
    assert.strictEqual(fast.runner_engine.engine_id, 'public-package-fast-runner-engine');
    assert.strictEqual(fast.compact_result_shape_enabled, true);
    assert.strictEqual(fast.executed_command_count, fast.unique_command_count);
    assert.strictEqual(fast.reused_command_count, 0);
    assert.strictEqual(fast.output_budget.stdout_json_budget_status, 'ok');
    assert.strictEqual(fast.progress.progress_jsonl_enabled, false);
    assert.strictEqual(fast.failed_count, 0);
    assert.strictEqual(fast.passed_count, fast.check_count);
    assert.ok(Array.isArray(fast.advisories));
    assert.ok(fast.advisories.some((item) => item.id === 'target-governance-index-stale-read'));
    assert.ok(fast.checks.some((item) => item.id === 'target-memory-preview'));
    assert.ok(fast.checks.some((item) => item.id === 'target-governance-budget-contract'));
    assert.ok(fast.checks.some((item) => item.id === 'target-governance-budget-check'));
    assert.ok(fast.checks.some((item) => item.id === 'target-governance-materialization-dry-run'));
    assert.ok(fast.checks.some((item) => item.id === 'target-governance-index-drift-check'));
    assert.ok(fast.checks.some((item) => item.id === 'target-handoff-preview'));
    assert.ok(fast.checks.some((item) => item.id === 'target-handoff-readiness-check'));
    assert.ok(fast.checks.some((item) => item.id === 'release-source-manifest-check'));
    assert.ok(fast.checks.some((item) => item.id === 'release-check'));
    assert.strictEqual(fast.boundary.writes_files, false);
    assert.strictEqual(fast.boundary.child_process_spawn, false);
    assert.strictEqual(fast.boundary.runs_package_manager, false);
    assert.strictEqual(fast.boundary.git_mutation, false);
    assert.strictEqual(fast.boundary.network, false);

    const fastText = run(['check', '--fast', '--text']);
    assert.strictEqual(fastText.status, 0, fastText.stderr || fastText.stdout);
    assert.ok(fastText.stdout.includes('agent-onboard check fast'));
    assert.ok(fastText.stdout.includes('Result: pass'));
    assert.ok(fastText.stdout.includes('Runner engine: public-package-fast-runner-engine'));
    assert.ok(fastText.stdout.includes('Output budget:'));
    assert.ok(fastText.stdout.includes('Advisories:'));

    const progressResult = run(['check', '--fast', '--json', '--progress-jsonl']);
    const progressFast = readJsonOutput(progressResult);
    assert.strictEqual(progressFast.status, 'ok');
    assert.strictEqual(progressFast.progress.progress_jsonl_enabled, true);
    assert.ok(progressResult.stderr.includes('agent-onboard-public-check-fast-progress-jsonl-001'));
    assert.ok(progressResult.stderr.includes('runner_start'));

    const missingIndexTarget = tempRepo();
    fs.mkdirSync(path.join(missingIndexTarget, '.agent-onboard'), { recursive: true });
    const missingIndexMilestoneId = ['P9', 'S1', 'M1'].join('');
    fs.writeFileSync(path.join(missingIndexTarget, '.agent-onboard', 'work-items.json'), JSON.stringify({
      schema: 'target-work-items-fixture',
      work_items: [
        { id: [missingIndexMilestoneId, 'W1'].join(''), title: 'Missing index fixture', status: 'open', milestone_id: missingIndexMilestoneId }
      ],
      admission_queue: []
    }, null, 2) + '\n');
    const missingFastResult = run(['check', '--fast', '--json'], { cwd: missingIndexTarget });
    const missingFast = readJsonOutput(missingFastResult);
    assert.strictEqual(missingFast.result, 'pass');
    assert.strictEqual(missingFast.advisory_warning_count, 1);
    assert.ok(missingFast.advisories.some((item) => item.id === 'target-governance-index-stale-read' && item.state === 'missing' && item.refresh_required === true));
    const missingFastText = run(['check', '--fast', '--text'], { cwd: missingIndexTarget });
    assert.strictEqual(missingFastText.status, 0, missingFastText.stderr || missingFastText.stdout);
    assert.ok(missingFastText.stdout.includes('target-governance-index-stale-read (missing)'));

    const bad = run(['check', '--plan', '--fast']);
    const badOutput = readJsonFailure(bad);
    assert.strictEqual(bad.status, 1);
    assert.strictEqual(badOutput.status, 'error');
  });


  fullSourceTest('public contract spine is directly usable and validates runtime outputs', () => {
    const contractsModule = require(path.join(ROOT, 'cli', 'agent_onboard', 'contracts', 'public-contracts.js'));
    const catalog = contractsModule.publicContractCatalog({ version: EXPECTED_VERSION, releaseLine: EXPECTED_RELEASE_LINE });
    assert.strictEqual(catalog.schema, 'agent-onboard-public-contract-spine-001');
    assert.strictEqual(catalog.status, 'ok');
    assert.strictEqual(catalog.version, EXPECTED_VERSION);
    assert.strictEqual(catalog.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(catalog.contract_model.typescript_required, false);
    assert.strictEqual(catalog.contract_model.abstract_classes_required, false);
    assert.strictEqual(catalog.contract_model.source_contract_archive_exported, false);
    assert.ok(catalog.contracts.some((entry) => entry.id === 'target_handoff_readiness_check_output'));
    assert.ok(catalog.stable_reason_codes.includes('governance_budget_over_contract'));

    const catalogCheck = contractsModule.validatePublicContractCatalog(catalog);
    assert.strictEqual(catalogCheck.status, 'ok');
    assert.strictEqual(catalogCheck.validated.required_contracts_present, true);
    assert.strictEqual(catalogCheck.validated.no_mutation_boundaries_declared, true);

    const jsonResult = run(['contracts', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-contract-spine-001');
    assert.strictEqual(output.contract_count, 6);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.network, false);

    const checkResult = run(['contracts', '--check', '--json']);
    const check = readJsonOutput(checkResult);
    assert.strictEqual(check.schema, 'agent-onboard-public-contract-check-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.checked_runtime_output_count, 4);
    assert.strictEqual(check.output_validation.status, 'ok');
    assert.strictEqual(check.validated.readiness_reason_codes_stable, true);
    assert.deepStrictEqual(check.errors, []);

    const textResult = run(['contracts', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard public contracts'));
    assert.ok(textResult.stdout.includes('target_handoff_readiness_check_output'));

    const checkTextResult = run(['contracts', '--check', '--text']);
    assert.strictEqual(checkTextResult.status, 0, checkTextResult.stderr || checkTextResult.stdout);
    assert.ok(checkTextResult.stdout.includes('agent-onboard public contract check'));
    assert.ok(checkTextResult.stdout.includes('Status: ok'));

    const samplePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aob-contract-output-')), 'readiness.json');
    const readinessJson = run(['target', 'handoff', '--readiness-check', '--json']);
    assert.strictEqual(readinessJson.status, 0, readinessJson.stderr || readinessJson.stdout);
    fs.writeFileSync(samplePath, readinessJson.stdout);

    const validationResult = run(['contracts', '--validate-output', '--contract', 'target_handoff_readiness_check_output', '--file', samplePath, '--json']);
    const validation = readJsonOutput(validationResult);
    assert.strictEqual(validation.schema, 'agent-onboard-public-contract-output-file-validation-001');
    assert.strictEqual(validation.status, 'ok');
    assert.strictEqual(validation.contract_id, 'target_handoff_readiness_check_output');
    assert.strictEqual(validation.validated.no_mutation_boundary, true);
    assert.strictEqual(validation.source.file_contents_reemitted, false);

    const validationTextResult = run(['contracts', '--validate-output', '--contract', 'target_handoff_readiness_check_output', '--file', samplePath, '--text']);
    assert.strictEqual(validationTextResult.status, 0, validationTextResult.stderr || validationTextResult.stdout);
    assert.ok(validationTextResult.stdout.includes('agent-onboard public contract output validation'));
    assert.ok(validationTextResult.stdout.includes('Status: ok'));

    const badPath = path.join(path.dirname(samplePath), 'bad.json');
    fs.writeFileSync(badPath, JSON.stringify({ schema: 'wrong', status: 'ok' }, null, 2));
    const badValidationResult = run(['contracts', '--validate-output', '--contract', 'target_handoff_readiness_check_output', '--file', badPath, '--json']);
    const badValidation = readJsonFailure(badValidationResult);
    assert.strictEqual(badValidationResult.status, 1);
    assert.strictEqual(badValidation.status, 'error');
    assert.ok(badValidation.errors.some((error) => error.includes('output schema must be')));

    const bad = run(['contracts', '--write']);
    const badOutput = readJsonFailure(bad);
    assert.strictEqual(bad.status, 1);
    assert.strictEqual(badOutput.status, 'error');
  });


  fullSourceTest('public CI surface is directly usable', () => {
    const jsonResult = run(['ci', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-ci-surface-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.workflow_path, '.github/workflows/agent-onboard.yml');
    assert.strictEqual(output.github_action_command, 'agent-onboard ci --github-action');
    assert.ok(output.recommended_ci_commands.includes(`npx agent-onboard@${EXPECTED_VERSION} check --fast --json`));
    assert.ok(output.recommended_ci_commands.includes(`npx agent-onboard@${EXPECTED_VERSION} release --check`));
    assert.strictEqual(output.github_actions.creates_or_updates_workflow, false);
    assert.strictEqual(output.ci_role.ci_is_authority, false);
    assert.strictEqual(output.ci_role.ci_can_report_evidence, true);
    assert.strictEqual(output.ci_role.ci_can_admit_claim, false);
    assert.strictEqual(output.ci_role.ci_can_create_canonical_work_item, false);
    assert.strictEqual(output.ci_role.ci_can_write_ledger, false);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.github_api_dependency_now, false);
    assert.strictEqual(output.boundary.runs_npm_now, false);
    assert.strictEqual(output.boundary.network_now, false);

    const textResult = run(['ci', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard CI surface'));
    assert.ok(textResult.stdout.includes('CI is authority: false'));
    assert.ok(textResult.stdout.includes('agent-onboard ci --github-action'));

    const yamlResult = run(['ci', '--github-action']);
    assert.strictEqual(yamlResult.status, 0, yamlResult.stderr || yamlResult.stdout);
    assert.ok(yamlResult.stdout.includes('name: Agent Onboard'));
    assert.ok(yamlResult.stdout.includes('uses: actions/checkout@v4'));
    assert.ok(yamlResult.stdout.includes(`npx agent-onboard@${EXPECTED_VERSION} check --fast --json`));
    assert.ok(yamlResult.stdout.includes(`npx agent-onboard@${EXPECTED_VERSION} release --check`));
  });


  fullSourceTest('public MCP bridge plan surface is directly usable', () => {
    const jsonResult = run(['mcp', '--json']);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-mcp-bridge-plan-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard mcp --json');
    assert.strictEqual(output.plan_command, 'agent-onboard mcp --plan');
    assert.strictEqual(output.bridge_status.server_implemented_now, false);
    assert.strictEqual(output.bridge_status.server_started_now, false);
    assert.strictEqual(output.bridge_status.mcp_dependency_added_now, false);
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_get_discovery'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_preview_target_inventory'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_dry_run_target_governance_indexes'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_check_target_governance_index_drift'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_check_target_governance_budget'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_check_target_handoff_readiness'));
    assert.ok(output.tool_candidates.some((tool) => tool.name === 'agent_onboard_run_fast_check'));
    assert.ok(output.tool_candidates.some((tool) => tool.command === 'agent-onboard release --check'));
    assert.strictEqual(output.client_guidance.authority_rule.includes('cannot admit claims'), true);
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.starts_server, false);
    assert.strictEqual(output.boundary.starts_stdio_transport, false);
    assert.strictEqual(output.boundary.adds_runtime_dependency, false);
    assert.strictEqual(output.boundary.network, false);

    const textResult = run(['mcp', '--text']);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard MCP bridge plan'));
    assert.ok(textResult.stdout.includes('server implemented now: false'));
    assert.ok(textResult.stdout.includes('agent_onboard_get_discovery'));

    const planResult = run(['mcp', '--plan']);
    assert.strictEqual(planResult.status, 0, planResult.stderr || planResult.stdout);
    assert.ok(planResult.stdout.includes('Tool candidates:'));

    const refused = run(['mcp', '--serve']);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 2);
    assert.strictEqual(refusedOutput.reason, 'not_admitted');
    assert.strictEqual(refusedOutput.starts_server, false);
  });


  fullSourceTest('public target inventory preview is directly usable', () => {
    const dir = tempRepo();
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(dir, 'README.md'), '# Target fixture\n\n```sh\nnpm test\nnode src/index.js\n```\n');
    fs.writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI\njobs:\n  test:\n    steps:\n      - run: npm test\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'inventory-fixture', version: '1.2.3', scripts: { test: 'node src/index.js', build: 'echo build' } }, null, 2) + '\n');

    const jsonResult = run(['target', 'inventory', '--json', '--target', dir]);
    const output = readJsonOutput(jsonResult);
    assert.strictEqual(output.schema, 'agent-onboard-public-target-runtime-inventory-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard target inventory --preview');
    assert.strictEqual(output.target.name, 'inventory-fixture');
    assert.strictEqual(output.target.ecosystem, 'node-npm');
    assert.ok(output.inventory.source_surface.source_roots.some((entry) => entry.path === 'src/' && entry.role === 'source'));
    assert.ok(output.inventory.package_surface.script_names.includes('test'));
    assert.ok(output.inventory.command_surface.ci_commands.some((entry) => entry.command === 'npm test'));
    assert.ok(output.inventory.command_surface.readme_usage_commands.some((entry) => entry.command === 'npm test'));
    assert.strictEqual(output.boundary.writes_files, false);
    assert.strictEqual(output.boundary.runs_managed_project_commands, false);
    assert.strictEqual(output.boundary.network, false);
    assert.strictEqual(output.writes_performed, false);

    const textResult = run(['target', 'inventory', '--text', '--target', dir]);
    assert.strictEqual(textResult.status, 0, textResult.stderr || textResult.stdout);
    assert.ok(textResult.stdout.includes('agent-onboard target inventory'));
    assert.ok(textResult.stdout.includes('Package manager: unknown'));
    assert.ok(textResult.stdout.includes('Scripts: build, test'));

    const previewResult = run(['target', 'inventory', '--preview', '--target', dir]);
    const previewOutput = readJsonOutput(previewResult);
    assert.strictEqual(previewOutput.schema, 'agent-onboard-public-target-runtime-inventory-001');

    const refused = run(['target', 'inventory', '--write', '--target', dir]);
    const refusedOutput = readJsonFailure(refused);
    assert.strictEqual(refused.status, 1);
    assert.strictEqual(refusedOutput.status, 'error');
  });
};
