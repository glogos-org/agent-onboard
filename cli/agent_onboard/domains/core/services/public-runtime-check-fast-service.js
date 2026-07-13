'use strict';

function createPublicRuntimeCheckFastService(deps = {}) {
  const {
    PACKAGE_NAME,
    VERSION,
    RELEASE_LINE,
    packageRoot,
    resolveTargetRoot = () => { throw new Error('createPublicRuntimeCheckFastService requires resolveTargetRoot'); },
    writeProgressLine = () => {},
    commandSurfaceService,
    operatorGuideService,
    quickstartService,
    discoveryService,
    createDryRunService,
    issueIntakeService,
    contributorAdmissionService,
    publicContractsService,
    targetRuntimeService,
    targetMemoryService,
    ciSurfaceService,
    mcpBridgePlanService,
    publicPackageSourceManifestCheck,
    publicCleanCompactionBaselineCheck,
    publicCleanCompactionCatalogCheck,
    publicPackageKeywordTaxonomyCompactionCheck,
    publicReadmeFirstReadHistorySplitPlanCheck,
    publicReadmeHistoryArchiveSplitDryRunCheck,
    publicReadmeHistoryArchiveSplitApplyCheck,
    publicClosedGateArtifactCompactionPlanCheck,
    publicClosedGateArtifactCompactionDryRunCheck,
    publicClosedGateArtifactCompactionApplyCheck,
    publicClosedGateArchiveReaderCheck,
    publicClosedGateRawArtifactPrunePlanningCheck,
    publicClosedGateRawArtifactPruneDryRunCheck,
    publicFullTestRunnerCompletionCheck,
    publicPackageSurfaceCheck,
    publicReleaseCheck
  } = deps;

  if (typeof packageRoot !== 'function') throw new Error('createPublicRuntimeCheckFastService requires packageRoot');

const CHECK_FAST_ENGINE = Object.freeze({
  schema: 'agent-onboard-public-package-fast-runner-engine-001',
  engine_id: 'public-package-fast-runner-engine',
  result_shape: 'agent-onboard-public-package-fast-runner-result-compact-v1',
  progress_shape: 'agent-onboard-public-package-fast-runner-progress-jsonl-v1',
  plan_mode: 'default-fast',
  runner_type: 'in_process_public_runtime_runner',
  global_timeout_ms: 30000,
  command_timeout_ms: 5000,
  max_concurrency: 1,
  command_dedupe_enabled: true,
  progress_jsonl_supported: true,
  progress_jsonl_stream: 'stderr',
  output_budget: Object.freeze({
    shape: 'agent-onboard-public-package-fast-runner-output-budget-v1',
    stdout_json_budget_bytes: 32768,
    progress_stderr_jsonl_budget_bytes: 16384
  })
});

const CHECK_FAST_SLOW_REASON_TAXONOMY = Object.freeze({
  external_test_runner: 'external test runner is intentionally outside the no-shell in-process fast runner',
  package_manager_projection: 'package manager projection is intentionally outside check --fast and belongs in release or CI audit',
  git_worktree_audit: 'Git working tree audit is omitted because ZIP and package contexts may not have .git',
  registry_mutation: 'registry mutation is never part of check --fast'
});

const CHECK_FAST_REGISTRY = Object.freeze([
  Object.freeze({ id: 'release-clean-check', command: 'agent-onboard release --clean-check', scope: 'source_clean_compaction_baseline', slow: false }),
  Object.freeze({ id: 'release-clean-catalog-check', command: 'agent-onboard release --clean-catalog-check', scope: 'source_clean_compaction_catalog', slow: false }),
  Object.freeze({ id: 'release-keyword-taxonomy-check', command: 'agent-onboard release --keyword-taxonomy-check', scope: 'source_package_keyword_taxonomy', slow: false }),
  Object.freeze({ id: 'release-readme-plan-check', command: 'agent-onboard release --readme-plan-check', scope: 'source_readme_first_read_history_split_plan', slow: false }),
  Object.freeze({ id: 'release-readme-dry-run-check', command: 'agent-onboard release --readme-dry-run-check', scope: 'source_readme_history_archive_split_dry_run', slow: false }),
  Object.freeze({ id: 'release-readme-apply-check', command: 'agent-onboard release --readme-apply-check', scope: 'source_readme_history_archive_split_apply', slow: false }),
  Object.freeze({ id: 'release-closed-gates-plan-check', command: 'agent-onboard release --closed-gates-plan-check', scope: 'source_closed_gate_artifact_compaction_plan', slow: false }),
  Object.freeze({ id: 'release-closed-gates-dry-run-check', command: 'agent-onboard release --closed-gates-dry-run-check', scope: 'source_closed_gate_artifact_compaction_dry_run', slow: false }),
  Object.freeze({ id: 'release-closed-gates-apply-check', command: 'agent-onboard release --closed-gates-apply-check', scope: 'source_closed_gate_artifact_compaction_apply', slow: false }),
  Object.freeze({ id: 'release-closed-gates-read-check', command: 'agent-onboard release --closed-gates-read-check', scope: 'source_closed_gate_archive_reader', slow: false }),
  Object.freeze({ id: 'release-closed-gates-prune-plan-check', command: 'agent-onboard release --closed-gates-prune-plan-check', scope: 'source_closed_gate_raw_artifact_prune_planning', slow: false }),
  Object.freeze({ id: 'release-closed-gates-prune-dry-run-check', command: 'agent-onboard release --closed-gates-prune-dry-run-check', scope: 'source_closed_gate_raw_artifact_prune_dry_run', slow: false }),
  Object.freeze({ id: 'release-full-test-runner-check', command: 'agent-onboard release --full-test-runner-check', scope: 'source_full_test_runner_completion', slow: false }),
  Object.freeze({ id: 'command-surface-catalog', command: 'agent-onboard commands --json', scope: 'product_discovery', slow: false }),
  Object.freeze({ id: 'operator-guide', command: 'agent-onboard guide --json', scope: 'operator_orientation', slow: false }),
  Object.freeze({ id: 'quickstart', command: 'agent-onboard quickstart --json', scope: 'first_run_recipe', slow: false }),
  Object.freeze({ id: 'ai-discovery', command: 'agent-onboard discovery --json', scope: 'ai_readable_entrypoint', slow: false }),
  Object.freeze({ id: 'create-dry-run', command: 'agent-onboard create --dry-run', scope: 'consumer_create_preview', slow: false }),
  Object.freeze({ id: 'issue-intake-dry-run', command: 'agent-onboard issue --classify-dry-run', scope: 'external_issue_preview', slow: false }),
  Object.freeze({ id: 'contributor-admission-dry-run', command: 'agent-onboard contributor --admission-dry-run', scope: 'contributor_preview', slow: false }),
  Object.freeze({ id: 'public-contract-spine-check', command: 'agent-onboard contracts --check', scope: 'public_contract_spine', slow: false }),
  Object.freeze({ id: 'target-inventory-preview', command: 'agent-onboard target inventory --preview', scope: 'target_runtime_inventory', slow: false }),
  Object.freeze({ id: 'target-memory-preview', command: 'agent-onboard target memory --preview', scope: 'target_memory_descriptor', slow: false }),
  Object.freeze({ id: 'target-work-items-preview', command: 'agent-onboard target work-items --preview', scope: 'target_work_items_preview', slow: false }),
  Object.freeze({ id: 'target-governance-preview', command: 'agent-onboard target governance --preview', scope: 'target_governance_preview', slow: false }),
  Object.freeze({ id: 'target-governance-materialization-dry-run', command: 'agent-onboard target governance --materialize-dry-run', scope: 'target_governance_index_materialization', slow: false }),
  Object.freeze({ id: 'target-governance-index-drift-check', command: 'agent-onboard target governance --check', scope: 'target_governance_index_drift_check', slow: false }),
  Object.freeze({ id: 'target-governance-budget-contract', command: 'agent-onboard target governance --budget-contract', scope: 'target_governance_budget_contract', slow: false }),
  Object.freeze({ id: 'target-governance-budget-check', command: 'agent-onboard target governance --budget-check', scope: 'target_governance_budget_check', slow: false }),
  Object.freeze({ id: 'target-handoff-preview', command: 'agent-onboard target handoff --preview', scope: 'target_handoff_preview', slow: false }),
  Object.freeze({ id: 'target-handoff-readiness-check', command: 'agent-onboard target handoff --readiness-check', scope: 'target_handoff_readiness_check', slow: false }),
  Object.freeze({ id: 'release-source-manifest-check', command: 'agent-onboard release --source-manifest-check', scope: 'package_source_manifest', slow: false }),
  Object.freeze({ id: 'release-surface-check', command: 'agent-onboard release --surface-check', scope: 'package_surface', slow: false }),
  Object.freeze({ id: 'release-check', command: 'agent-onboard release --check', scope: 'release_integrity', slow: false }),
  Object.freeze({ id: 'ci-surface', command: 'agent-onboard ci --json', scope: 'ci_recipe_surface', slow: false }),
  Object.freeze({ id: 'mcp-bridge-plan', command: 'agent-onboard mcp --json', scope: 'agent_client_bridge_plan', slow: false })
]);

const CHECK_FAST_OMITTED_SLOW = Object.freeze([
  Object.freeze({ id: 'npm-test', command: 'npm test', reason_key: 'external_test_runner', reason: CHECK_FAST_SLOW_REASON_TAXONOMY.external_test_runner }),
  Object.freeze({ id: 'npm-pack-dry-run', command: 'npm pack --dry-run --json', reason_key: 'package_manager_projection', reason: CHECK_FAST_SLOW_REASON_TAXONOMY.package_manager_projection }),
  Object.freeze({ id: 'release-artifact-oracle', command: 'agent-onboard release --artifact-oracle', reason_key: 'package_manager_projection', reason: CHECK_FAST_SLOW_REASON_TAXONOMY.package_manager_projection }),
  Object.freeze({ id: 'git-diff-check', command: 'git diff --check', reason_key: 'git_worktree_audit', reason: CHECK_FAST_SLOW_REASON_TAXONOMY.git_worktree_audit }),
  Object.freeze({ id: 'publish', command: 'npm publish --access public', reason_key: 'registry_mutation', reason: CHECK_FAST_SLOW_REASON_TAXONOMY.registry_mutation })
]);

function checkFastBoundary() {
  return {
    writes_files: false,
    writes_target_repository_state: false,
    creates_agent_onboard_runtime_state: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_shell: false,
    child_process_spawn: false,
    runs_build_test_deploy: false,
    runs_managed_project_commands: false,
    publishes_package: false,
    mutates_registry: false,
    git_mutation: false,
    network: false,
    progress_jsonl_writes_files: false,
    progress_jsonl_stream: CHECK_FAST_ENGINE.progress_jsonl_stream
  };
}

function checkFastCacheKey(entry) {
  return `${entry.command}::${entry.scope}`;
}

function checkFastOutputBudgetMetadata() {
  return {
    ...CHECK_FAST_ENGINE.output_budget,
    compact_output_enabled: true,
    raw_command_output_inlined: false,
    raw_target_state_inlined: false
  };
}

function checkPlanCatalog() {
  const uniqueCommandCount = new Set(CHECK_FAST_REGISTRY.map((entry) => checkFastCacheKey(entry))).size;
  return {
    schema: 'agent-onboard-public-check-plan-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard check --plan',
    purpose: 'deterministic public fast-check plan for packaged product surfaces and release integrity probes',
    plan_mode: CHECK_FAST_ENGINE.plan_mode,
    runner_type: CHECK_FAST_ENGINE.runner_type,
    runner_engine: {
      schema: CHECK_FAST_ENGINE.schema,
      engine_id: CHECK_FAST_ENGINE.engine_id,
      result_shape: CHECK_FAST_ENGINE.result_shape,
      progress_shape: CHECK_FAST_ENGINE.progress_shape,
      global_timeout_ms: CHECK_FAST_ENGINE.global_timeout_ms,
      command_timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
      max_concurrency: CHECK_FAST_ENGINE.max_concurrency,
      command_dedupe_enabled: CHECK_FAST_ENGINE.command_dedupe_enabled,
      progress_jsonl_supported: CHECK_FAST_ENGINE.progress_jsonl_supported,
      progress_jsonl_stream: CHECK_FAST_ENGINE.progress_jsonl_stream,
      output_budget: checkFastOutputBudgetMetadata()
    },
    recursive_make_spawn: false,
    deterministic_order: true,
    check_count: CHECK_FAST_REGISTRY.length,
    slow_check_count: CHECK_FAST_OMITTED_SLOW.length,
    runnable_command_count: CHECK_FAST_REGISTRY.length,
    unique_command_count: uniqueCommandCount,
    dedupable_command_count: CHECK_FAST_REGISTRY.length - uniqueCommandCount,
    slow_reason_taxonomy: CHECK_FAST_SLOW_REASON_TAXONOMY,
    checks: CHECK_FAST_REGISTRY.map((entry, index) => Object.freeze({
      ordinal: index + 1,
      id: entry.id,
      command: entry.command,
      cache_key: checkFastCacheKey(entry),
      scope: entry.scope,
      slow: entry.slow,
      timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
      writes_files: false,
      network: false,
      git_mutation: false,
      publishes_package: false
    })),
    omitted_slow_checks: CHECK_FAST_OMITTED_SLOW.map((entry) => Object.freeze(Object.assign({}, entry))),
    boundary: checkFastBoundary()
  };
}

function checkPlanText(plan = checkPlanCatalog()) {
  const lines = [
    `agent-onboard check plan ${plan.version}`,
    `Mode: ${plan.plan_mode}`,
    `Runner: ${plan.runner_type}`,
    `Runner engine: ${plan.runner_engine.engine_id}`,
    `Runnable checks: ${plan.check_count}`,
    `Unique commands: ${plan.unique_command_count}`,
    `Timeouts: global ${plan.runner_engine.global_timeout_ms}ms, per-check ${plan.runner_engine.command_timeout_ms}ms`,
    '',
    'Checks:'
  ];
  for (const item of plan.checks) lines.push(`- ${item.id}: ${item.command}`);
  lines.push('', 'Omitted slow/external checks:');
  for (const item of plan.omitted_slow_checks) lines.push(`- ${item.id} [${item.reason_key}]: ${item.reason}`);
  lines.push('', 'Boundary: no files, no shell spawn, no npm, no Git, no network, no publish.');
  lines.push('Use `agent-onboard check --fast --json` to run the in-process fast runner.');
  lines.push('Use `agent-onboard check --fast --json --progress-jsonl` to emit compact progress JSONL on stderr.');
  return lines.join('\n') + '\n';
}

function checkFastAdvisories(id, output) {
  if (id !== 'target-governance-index-drift-check' || !output || !output.drift_check) return [];
  const drift = output.drift_check;
  const state = drift.overall_state || 'unknown';
  const severity = state === 'fresh' ? 'info' : (state === 'blocked' ? 'error' : 'warning');
  const advisory = {
    id: 'target-governance-index-stale-read',
    source_check_id: id,
    severity,
    state,
    refresh_required: drift.refresh_required === true,
    message: state === 'fresh'
      ? 'stored governance indexes are fresh against the derived payloads'
      : `stored governance indexes are ${state}; do not treat them as fresh first-read state before refreshing or rechecking`,
    materialize_command: drift.materialize_command || 'agent-onboard target governance --materialize --write --force',
    no_write_check: true
  };
  return [Object.freeze(advisory)];
}

function createCheckFastProgressReporter(enabled) {
  let seq = 0;
  let bytes = 0;
  const events = [];
  function emit(payload = {}) {
    const record = {};
    if (seq === 0) {
      record.schema = 'agent-onboard-public-check-fast-progress-jsonl-001';
      record.package_name = PACKAGE_NAME;
      record.version = VERSION;
      record.release_line = RELEASE_LINE;
      record.runner_engine = CHECK_FAST_ENGINE.engine_id;
      record.progress_shape = CHECK_FAST_ENGINE.progress_shape;
      record.compact_progress_event_shape_enabled = true;
    }
    record.seq = seq;
    record.event = payload.event || 'progress';
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'event') continue;
      if (value !== null && value !== undefined && value !== false) record[key] = value;
    }
    seq += 1;
    events.push(record);
    if (enabled) {
      const line = `${JSON.stringify(record)}\n`;
      bytes += Buffer.byteLength(line, 'utf8');
      writeProgressLine(line);
    }
  }
  return {
    emit,
    summary() {
      return {
        progress_shape: CHECK_FAST_ENGINE.progress_shape,
        progress_jsonl_enabled: enabled === true,
        progress_jsonl_stream: CHECK_FAST_ENGINE.progress_jsonl_stream,
        event_count: events.length,
        emitted_stderr_bytes: bytes,
        emitted_stderr_budget_bytes: CHECK_FAST_ENGINE.output_budget.progress_stderr_jsonl_budget_bytes,
        compact_progress_event_shape_enabled: true
      };
    }
  };
}

function timedCheck(entry, fn, context) {
  const started = Date.now();
  context.emit({ event: 'check_start', check_id: entry.id, ordinal: entry.ordinal, timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms });
  try {
    const output = fn();
    const elapsed = Date.now() - started;
    const ok = output && (output.status === 'ok' || output.status === 'pass');
    const timeoutExceeded = elapsed > CHECK_FAST_ENGINE.command_timeout_ms;
    const advisories = checkFastAdvisories(entry.id, output);
    const status = ok && !timeoutExceeded ? 'ok' : 'error';
    context.emit({ event: 'check_end', check_id: entry.id, status, elapsed_ms: elapsed });
    return {
      id: entry.id,
      command: entry.command,
      cache_key: entry.cache_key,
      status,
      elapsed_ms: elapsed,
      timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
      output_schema: output && output.schema ? output.schema : null,
      output_status: output && output.status ? output.status : null,
      raw_output_inlined: false,
      errors: timeoutExceeded
        ? [`${entry.id} exceeded fast-runner per-check timeout (${elapsed}ms > ${CHECK_FAST_ENGINE.command_timeout_ms}ms)`]
        : (output && Array.isArray(output.errors) ? output.errors : []),
      advisories
    };
  } catch (error) {
    const elapsed = Date.now() - started;
    context.emit({ event: 'check_end', check_id: entry.id, status: 'error', elapsed_ms: elapsed });
    return {
      id: entry.id,
      command: entry.command,
      cache_key: entry.cache_key,
      status: 'error',
      elapsed_ms: elapsed,
      timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
      output_schema: null,
      output_status: null,
      raw_output_inlined: false,
      errors: [error && error.message ? error.message : String(error)],
      advisories: []
    };
  }
}

function jsonSizeBytes(value) {
  return Buffer.byteLength(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function attachCheckFastOutputMeasurement(result) {
  const measured = jsonSizeBytes(result);
  const budget = CHECK_FAST_ENGINE.output_budget.stdout_json_budget_bytes;
  return {
    ...result,
    output_budget: {
      ...checkFastOutputBudgetMetadata(),
      stdout_json_bytes: measured,
      stdout_json_budget_status: measured <= budget ? 'ok' : 'error'
    }
  };
}

function runCheckFastPlan(root = packageRoot(), options = {}) {
  const targetRoot = resolveTargetRoot();
  const progress = createCheckFastProgressReporter(options.progressJsonl === true);
  const runners = Object.freeze({
    'command-surface-catalog': () => commandSurfaceService.catalog(),
    'operator-guide': () => operatorGuideService.catalog(),
    quickstart: () => quickstartService.catalog(),
    'ai-discovery': () => discoveryService.catalog(),
    'create-dry-run': () => createDryRunService.catalog(),
    'issue-intake-dry-run': () => issueIntakeService.classify(issueIntakeService.input(['--classify-dry-run']).input),
    'contributor-admission-dry-run': () => contributorAdmissionService.preview(contributorAdmissionService.input(['--admission-dry-run']).input),
    'public-contract-spine-check': () => publicContractsService.check(),
    'target-inventory-preview': () => targetRuntimeService.targetInventory(targetRoot),
    'target-memory-preview': () => targetMemoryService.descriptor(targetRoot),
    'target-work-items-preview': () => targetRuntimeService.targetWorkItemsPreview(targetRoot),
    'target-governance-preview': () => targetRuntimeService.targetGovernancePreview(targetRoot),
    'target-governance-materialization-dry-run': () => targetRuntimeService.targetGovernanceIndexMaterializationDryRun(targetRoot),
    'target-governance-index-drift-check': () => targetRuntimeService.targetGovernanceIndexDriftCheck(targetRoot),
    'target-governance-budget-contract': () => targetRuntimeService.targetGovernanceBudgetContract(),
    'target-governance-budget-check': () => targetRuntimeService.targetGovernanceBudgetCheck(targetRoot),
    'target-handoff-preview': () => targetRuntimeService.targetHandoffPreview(targetRoot),
    'target-handoff-readiness-check': () => targetRuntimeService.targetHandoffReadinessCheck(targetRoot),
    'release-source-manifest-check': () => publicPackageSourceManifestCheck(root),
    'release-clean-check': () => publicCleanCompactionBaselineCheck(root),
    'release-clean-catalog-check': () => publicCleanCompactionCatalogCheck(root),
    'release-keyword-taxonomy-check': () => publicPackageKeywordTaxonomyCompactionCheck(root),
    'release-readme-plan-check': () => publicReadmeFirstReadHistorySplitPlanCheck(root),
    'release-readme-dry-run-check': () => publicReadmeHistoryArchiveSplitDryRunCheck(root),
    'release-readme-apply-check': () => publicReadmeHistoryArchiveSplitApplyCheck(root),
    'release-closed-gates-plan-check': () => publicClosedGateArtifactCompactionPlanCheck(root),
    'release-closed-gates-dry-run-check': () => publicClosedGateArtifactCompactionDryRunCheck(root),
    'release-closed-gates-apply-check': () => publicClosedGateArtifactCompactionApplyCheck(root),
    'release-closed-gates-read-check': () => publicClosedGateArchiveReaderCheck(root),
    'release-closed-gates-prune-plan-check': () => publicClosedGateRawArtifactPrunePlanningCheck(root),
    'release-closed-gates-prune-dry-run-check': () => publicClosedGateRawArtifactPruneDryRunCheck(root),
    'release-full-test-runner-check': () => publicFullTestRunnerCompletionCheck(root),
    'release-surface-check': () => publicPackageSurfaceCheck(root),
    'release-check': () => publicReleaseCheck(root),
    'ci-surface': () => ciSurfaceService.catalog(),
    'mcp-bridge-plan': () => mcpBridgePlanService.catalog()
  });
  const plan = checkPlanCatalog();
  const started = Date.now();
  const checks = [];
  const commandCache = new Map();
  let executedCommandCount = 0;
  let reusedCommandCount = 0;
  progress.emit({
    event: 'runner_start',
    check_count: plan.check_count,
    unique_command_count: plan.unique_command_count,
    global_timeout_ms: CHECK_FAST_ENGINE.global_timeout_ms,
    command_timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
    command_dedupe_enabled: true,
    max_concurrency: CHECK_FAST_ENGINE.max_concurrency
  });
  for (const entry of plan.checks) {
    const elapsedTotalMs = Date.now() - started;
    if (elapsedTotalMs > CHECK_FAST_ENGINE.global_timeout_ms) {
      checks.push({
        id: entry.id,
        command: entry.command,
        cache_key: entry.cache_key,
        status: 'error',
        elapsed_ms: 0,
        timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
        output_schema: null,
        output_status: null,
        raw_output_inlined: false,
        errors: [`global timeout exceeded before ${entry.id} (${elapsedTotalMs}ms > ${CHECK_FAST_ENGINE.global_timeout_ms}ms)`],
        advisories: []
      });
      continue;
    }
    const cached = commandCache.get(entry.cache_key);
    if (cached) {
      reusedCommandCount += 1;
      checks.push({
        ...cached,
        id: entry.id,
        command: entry.command,
        cache_key: entry.cache_key,
        reused: true,
        reused_from: cached.id,
        elapsed_ms: 0
      });
      progress.emit({ event: 'command_reuse', check_id: entry.id, reused_from: cached.id });
      continue;
    }
    executedCommandCount += 1;
    const result = timedCheck(entry, runners[entry.id], { emit: progress.emit });
    commandCache.set(entry.cache_key, result);
    checks.push(result);
  }
  const errors = checks.flatMap((item) => item.status === 'ok' ? [] : item.errors.map((error) => `${item.id}: ${error}`));
  const advisories = checks.flatMap((item) => Array.isArray(item.advisories) ? item.advisories : []);
  const elapsed = Date.now() - started;
  progress.emit({ event: 'runner_end', status: errors.length === 0 ? 'ok' : 'error', elapsed_ms: elapsed, executed_command_count: executedCommandCount, reused_command_count: reusedCommandCount });
  const baseResult = {
    schema: 'agent-onboard-public-check-fast-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    result: errors.length === 0 ? 'pass' : 'fail',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard check --fast',
    plan_mode: CHECK_FAST_ENGINE.plan_mode,
    runner_type: CHECK_FAST_ENGINE.runner_type,
    runner_engine: {
      schema: CHECK_FAST_ENGINE.schema,
      engine_id: CHECK_FAST_ENGINE.engine_id,
      result_shape: CHECK_FAST_ENGINE.result_shape,
      progress_shape: CHECK_FAST_ENGINE.progress_shape,
      global_timeout_ms: CHECK_FAST_ENGINE.global_timeout_ms,
      command_timeout_ms: CHECK_FAST_ENGINE.command_timeout_ms,
      max_concurrency: CHECK_FAST_ENGINE.max_concurrency,
      command_dedupe_enabled: CHECK_FAST_ENGINE.command_dedupe_enabled,
      progress_jsonl_supported: CHECK_FAST_ENGINE.progress_jsonl_supported,
      progress_jsonl_stream: CHECK_FAST_ENGINE.progress_jsonl_stream
    },
    compact_result_shape_enabled: true,
    package_root: root,
    target_root: targetRoot,
    elapsed_ms: elapsed,
    check_count: checks.length,
    command_count: plan.runnable_command_count,
    unique_command_count: plan.unique_command_count,
    executed_command_count: executedCommandCount,
    reused_command_count: reusedCommandCount,
    dedupe_saved_command_count: reusedCommandCount,
    passed_count: checks.filter((item) => item.status === 'ok').length,
    failed_count: checks.filter((item) => item.status !== 'ok').length,
    skipped_slow_check_count: CHECK_FAST_OMITTED_SLOW.length,
    advisory_count: advisories.length,
    advisory_warning_count: advisories.filter((item) => item.severity === 'warning').length,
    advisory_error_count: advisories.filter((item) => item.severity === 'error').length,
    advisories,
    progress: progress.summary(),
    deterministic_order: true,
    recursive_make_spawn: false,
    checks,
    skipped_slow_checks: CHECK_FAST_OMITTED_SLOW.map((entry) => Object.freeze(Object.assign({}, entry))),
    boundary: checkFastBoundary(),
    errors
  };
  return attachCheckFastOutputMeasurement(baseResult);
}

function checkFastText(result = runCheckFastPlan()) {
  const lines = [
    `agent-onboard check fast ${result.version}`,
    `Result: ${result.result}`,
    `Runner engine: ${result.runner_engine.engine_id}`,
    `Checks: ${result.passed_count}/${result.check_count} passed`,
    `Commands: ${result.executed_command_count} executed, ${result.reused_command_count} reused`,
    `Skipped slow/external checks: ${result.skipped_slow_check_count}`,
    `Advisories: ${result.advisory_count || 0}`,
    `Output budget: ${result.output_budget.stdout_json_bytes}/${result.output_budget.stdout_json_budget_bytes} bytes`,
    '',
    'Executed checks:'
  ];
  for (const item of result.checks) {
    const reuse = item.reused ? ` reused from ${item.reused_from}` : '';
    lines.push(`- ${item.status}: ${item.id} (${item.elapsed_ms}ms${reuse})`);
  }
  if (Array.isArray(result.advisories) && result.advisories.length > 0) {
    lines.push('', 'Advisories:');
    for (const advisory of result.advisories) lines.push(`- ${advisory.severity}: ${advisory.id} (${advisory.state}) - ${advisory.message}`);
  }
  if (result.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  lines.push('', 'Boundary: no files written, no shell spawn, no npm, no Git mutation, no network, no publish.');
  return lines.join('\n') + '\n';
}

const checkPlanFastService = Object.freeze({
  plan: checkPlanCatalog,
  planText: checkPlanText,
  fast: runCheckFastPlan,
  fastText: checkFastText
});


  return Object.freeze({
    plan: checkPlanCatalog,
    planText: checkPlanText,
    fast: runCheckFastPlan,
    fastText: checkFastText
  });
}

module.exports = Object.freeze({
  createPublicRuntimeCheckFastService
});
