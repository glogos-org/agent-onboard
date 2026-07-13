'use strict';

const fs = require('fs');
const path = require('path');
const {
  PACKAGE_NAME,
  TARGET_GOVERNANCE_MATERIALIZATION_SCHEMA,
  TARGET_GOVERNANCE_MATERIALIZATION_WRITE_SCHEMA,
  TARGET_GOVERNANCE_REFRESH_SCHEMA,
  TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_SCHEMA,
  TARGET_GOVERNANCE_MATERIALIZATION_COMMAND,
  TARGET_GOVERNANCE_MATERIALIZATION_WRITE_COMMAND,
  TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_COMMAND,
  TARGET_GOVERNANCE_FAMILY,
  WORK_ITEMS_PATH,
  CLAIMS_PATH,
  WORK_ITEMS_INDEX_PATH,
  CLAIMS_INDEX_PATH,
  MAX_INDEX_BYTES_EACH,
  MAX_COMBINED_INDEX_BYTES,
  ALLOWED_INDEX_WRITE_PATHS,
  isPlainObject,
  safeString,
  safeReadJson,
  parseClaimsLedger,
  buildWorkItemsIndex,
  buildClaimsIndex,
  writePlannedIndexIfChanged,
  materializationPlan,
  isAllowedIndexWritePath,
  materializationBoundary,
  noMutationBoundary
} = require('./target-governance-core');

function indexDriftCheckState(plannedWrite) {
  if (!plannedWrite || plannedWrite.existing_present !== true) return 'missing';
  if (plannedWrite.existing_kind !== 'file') return 'blocked';
  return plannedWrite.action === 'keep' ? 'fresh' : 'stale';
}

function indexDriftCheckEntry(plannedWrite) {
  const state = indexDriftCheckState(plannedWrite);
  return Object.freeze({
    path: plannedWrite.path,
    state,
    stored_index_present: plannedWrite.existing_present === true,
    stored_index_kind: plannedWrite.existing_kind,
    compare_action: plannedWrite.action,
    would_refresh_on_materialize: plannedWrite.would_write === true,
    derived_schema: plannedWrite.schema,
    derived_bytes: plannedWrite.bytes
  });
}

function indexDriftOverallState(entries, errors) {
  if (Array.isArray(errors) && errors.length > 0) return 'blocked';
  if (entries.some((entry) => entry.state === 'blocked')) return 'blocked';
  if (entries.some((entry) => entry.state === 'stale')) return 'stale';
  if (entries.some((entry) => entry.state === 'missing')) return 'missing';
  return 'fresh';
}

function targetGovernanceIndexDriftCheck(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const plan = targetGovernanceIndexMaterializationDryRun(targetRoot, { version, releaseLine, updatedAt: safeString(deps.updatedAt) || new Date().toISOString() });
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY
  });

  if (plan.status !== 'ok') {
    return Object.assign({}, base, {
      status: plan.status,
      target: plan.target || { name: 'target-repo', root: path.resolve(targetRoot || process.cwd()), kind: 'unknown' },
      drift_check: {
        purpose: 'no-write comparison of stored governance indexes against freshly derived target governance index payloads',
        mode: 'no_write_check',
        overall_state: 'blocked',
        index_states: [],
        refresh_required: true,
        materialize_command: 'agent-onboard target governance --materialize --write --force'
      },
      recommended_next_commands: [
        'agent-onboard target governance --materialize-dry-run --text',
        'agent-onboard target governance --text',
        'agent-onboard check --fast --text'
      ],
      writes_performed: false,
      boundary: noMutationBoundary(Boolean(plan.target && plan.target.kind === 'target-repo')),
      errors: plan.errors || []
    });
  }

  const entries = (plan.materialization.planned_writes || []).map(indexDriftCheckEntry);
  const overallState = indexDriftOverallState(entries, plan.errors || []);
  const refreshRequired = overallState !== 'fresh';
  const warnings = [];
  if (overallState === 'missing') warnings.push('stored_governance_index_missing_materialization_available');
  if (overallState === 'stale') warnings.push('stored_governance_index_stale_refresh_recommended');

  return Object.assign({}, base, {
    status: overallState === 'blocked' ? 'blocked' : 'ok',
    target: plan.target,
    drift_check: {
      purpose: 'no-write comparison of stored governance indexes against freshly derived target governance index payloads',
      mode: 'no_write_check',
      overall_state: overallState,
      index_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
      raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
      index_states: entries,
      refresh_required: refreshRequired,
      materialize_command: 'agent-onboard target governance --materialize --write --force',
      budget_status: plan.materialization.budget_status,
      combined_index_bytes: plan.materialization.combined_index_bytes,
      max_combined_index_bytes: plan.materialization.max_combined_index_bytes,
      warnings,
      authority_policy: {
        indexes_are_first_read_cache: true,
        work_items_json_remains_authoritative: true,
        claims_jsonl_remains_authoritative: true,
        drift_check_does_not_refresh_or_write_indexes: true,
        stale_or_missing_index_is_not_authority_failure: true
      }
    },
    recommended_next_commands: refreshRequired ? [
      'agent-onboard target governance --materialize-dry-run --text',
      'agent-onboard target governance --materialize --write --force --text',
      'agent-onboard target governance --text',
      'agent-onboard check --fast --text'
    ] : [
      'agent-onboard target governance --text',
      'agent-onboard target handoff --text',
      'agent-onboard check --fast --text'
    ],
    output_policy: {
      compact_default: true,
      raw_work_items_file_inlined: false,
      raw_claims_ledger_inlined: false,
      planned_index_payloads_inlined: false,
      target_ai_memory_content_inlined: false,
      provider_private_state_inlined: false
    },
    writes_performed: false,
    boundary: Object.assign({}, noMutationBoundary(true), {
      compares_stored_indexes_with_derived_payloads: true,
      refreshes_governance_indexes: false,
      writes_governance_indexes: false
    }),
    errors: plan.errors || []
  });
}


function targetGovernanceIndexDriftSummary(result) {
  const drift = result && result.drift_check ? result.drift_check : null;
  if (!drift) {
    return Object.freeze({
      status: result && result.status ? result.status : 'unavailable',
      overall_state: 'unavailable',
      refresh_required: false,
      stale_read_risk: false,
      index_states: [],
      warnings: [],
      materialize_command: 'agent-onboard target governance --materialize --write --force'
    });
  }
  const overallState = safeString(drift.overall_state) || 'unavailable';
  const refreshRequired = drift.refresh_required === true;
  return Object.freeze({
    status: result.status || 'unknown',
    overall_state: overallState,
    refresh_required: refreshRequired,
    stale_read_risk: ['stale', 'missing', 'blocked'].includes(overallState),
    index_states: Array.isArray(drift.index_states)
      ? drift.index_states.map((item) => Object.freeze({
        path: safeString(item.path) || 'unknown',
        state: safeString(item.state) || 'unknown',
        compare_action: safeString(item.compare_action) || 'unknown',
        would_refresh_on_materialize: item.would_refresh_on_materialize === true
      }))
      : [],
    warnings: Array.isArray(drift.warnings) ? drift.warnings.slice() : [],
    materialize_command: safeString(drift.materialize_command) || 'agent-onboard target governance --materialize --write --force'
  });
}

function targetGovernanceIndexDriftCheckText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target governance drift check',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const drift = result.drift_check;
  return [
    'agent-onboard target governance drift check',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Index state: ${drift.overall_state}`,
    `Refresh required: ${drift.refresh_required ? 'true' : 'false'}`,
    ...drift.index_states.map((item) => `  - ${item.path}: ${item.state}; compare ${item.compare_action}; would refresh ${item.would_refresh_on_materialize ? 'yes' : 'no'}; schema ${item.derived_schema || 'unknown'}`),
    `Budget: ${drift.budget_status}; ${drift.combined_index_bytes}/${drift.max_combined_index_bytes} bytes combined`,
    `Warnings: ${drift.warnings.length > 0 ? drift.warnings.join(', ') : 'none'}`,
    'Boundary: no-write drift check only; stored indexes are compared against derived payloads; raw work-items/claims remain authoritative; no refresh, no admission, no claims, no Git mutation, no network.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

function targetGovernanceIndexMaterializationDryRun(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const updatedAt = safeString(deps.updatedAt) || new Date().toISOString();
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_MATERIALIZATION_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_GOVERNANCE_MATERIALIZATION_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY
  });

  if (!fs.existsSync(absoluteTargetRoot)) {
    return Object.assign({}, base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'missing' },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: materializationBoundary(false)
    });
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return Object.assign({}, base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'file' },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: materializationBoundary(false)
    });
  }

  const rawWorkItemsRead = safeReadJson(absoluteTargetRoot, WORK_ITEMS_PATH);
  const rawClaimsRead = parseClaimsLedger(absoluteTargetRoot, CLAIMS_PATH);
  const errors = [];
  const warnings = [];
  if (!['ok', 'missing'].includes(rawWorkItemsRead.status)) errors.push(`cannot derive work-items index from ${WORK_ITEMS_PATH}: ${rawWorkItemsRead.status}`);
  if (!['ok', 'missing', 'malformed_lines'].includes(rawClaimsRead.status)) errors.push(`cannot derive claims index from ${CLAIMS_PATH}: ${rawClaimsRead.status}`);
  if (rawWorkItemsRead.status === 'missing') warnings.push('work_items_registry_missing_empty_index_planned');
  if (rawClaimsRead.status === 'missing') warnings.push('claims_ledger_missing_empty_index_planned');
  if (rawClaimsRead.status === 'malformed_lines') warnings.push('claims_ledger_has_malformed_lines_index_uses_parseable_entries_only');

  const workItemsDocument = rawWorkItemsRead.status === 'ok' && isPlainObject(rawWorkItemsRead.value) ? rawWorkItemsRead.value : {};
  const claimsEntries = rawClaimsRead.status === 'ok' || rawClaimsRead.status === 'malformed_lines' ? rawClaimsRead.entries : [];
  const workItemsIndex = buildWorkItemsIndex(workItemsDocument, { status: 'active', updatedAt });
  const claimsIndexBase = buildClaimsIndex(claimsEntries, { status: rawClaimsRead.status === 'malformed_lines' ? 'malformed_ledger' : 'active', updatedAt });
  const claimsIndex = rawClaimsRead.malformed_line_count > 0
    ? Object.freeze(Object.assign({}, claimsIndexBase, { malformed_line_count: rawClaimsRead.malformed_line_count }))
    : claimsIndexBase;
  const plannedWrites = [
    materializationPlan(absoluteTargetRoot, WORK_ITEMS_INDEX_PATH, workItemsIndex),
    materializationPlan(absoluteTargetRoot, CLAIMS_INDEX_PATH, claimsIndex)
  ];
  const totalBytes = plannedWrites.reduce((sum, item) => sum + item.bytes, 0);
  const oversized = plannedWrites.filter((item) => item.bytes > MAX_INDEX_BYTES_EACH).map((item) => item.path);
  if (oversized.length > 0) errors.push(`planned index exceeds ${MAX_INDEX_BYTES_EACH} byte per-file budget: ${oversized.join(', ')}`);
  if (totalBytes > MAX_COMBINED_INDEX_BYTES) errors.push(`planned indexes exceed ${MAX_COMBINED_INDEX_BYTES} byte combined budget`);

  return Object.assign({}, base, {
    status: errors.length > 0 ? 'blocked' : 'ok',
    target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'target-repo' },
    materialization: {
      purpose: 'dry-run target governance index materialization plan',
      mode: 'dry_run',
      index_paths: [WORK_ITEMS_INDEX_PATH, CLAIMS_INDEX_PATH],
      raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
      planned_writes: plannedWrites,
      changed_path_count: plannedWrites.filter((item) => item.would_write).length,
      max_index_bytes_each: MAX_INDEX_BYTES_EACH,
      max_combined_index_bytes: MAX_COMBINED_INDEX_BYTES,
      combined_index_bytes: totalBytes,
      budget_status: errors.length > 0 ? 'blocked' : 'within_budget',
      warnings,
      authority_policy: {
        indexes_are_first_read_cache: true,
        work_items_json_remains_authoritative: true,
        claims_jsonl_remains_authoritative: true,
        index_payloads_do_not_admit_or_close_work_items: true,
        index_payloads_do_not_create_claims: true
      }
    },
    recommended_next_commands: [
      'agent-onboard target governance --text',
      'agent-onboard target handoff --text',
      'agent-onboard check --fast --text'
    ],
    output_policy: {
      compact_default: true,
      raw_work_items_file_inlined: false,
      raw_claims_ledger_inlined: false,
      planned_index_payloads_inlined: true,
      target_ai_memory_content_inlined: false,
      provider_private_state_inlined: false
    },
    writes_performed: false,
    boundary: materializationBoundary(true),
    errors
  });
}

function targetGovernanceIndexMaterializationDryRunText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target governance materialization dry-run',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const materialization = result.materialization;
  return [
    'agent-onboard target governance materialization dry-run',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Budget: ${materialization.budget_status}; ${materialization.combined_index_bytes}/${materialization.max_combined_index_bytes} bytes combined`,
    `Planned writes: ${materialization.changed_path_count}`,
    ...materialization.planned_writes.map((item) => `  - ${item.path}: ${item.action}, ${item.bytes} bytes, schema ${item.schema}`),
    `Warnings: ${materialization.warnings.length > 0 ? materialization.warnings.join(', ') : 'none'}`,
    'Boundary: dry-run only; index payloads are first-read cache, raw work-items/claims remain authoritative; no admission, no claims, no Git mutation, no network, no writes.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}


function targetGovernanceIndexMaterializationWrite(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const force = deps.force === true;
  const updatedAt = safeString(deps.updatedAt) || new Date().toISOString();
  const plan = targetGovernanceIndexMaterializationDryRun(targetRoot, { version, releaseLine, updatedAt });
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_MATERIALIZATION_WRITE_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: force ? `${TARGET_GOVERNANCE_MATERIALIZATION_WRITE_COMMAND} --force` : TARGET_GOVERNANCE_MATERIALIZATION_WRITE_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY
  });

  if (!force) {
    return Object.assign({}, base, {
      status: 'error',
      target: plan.target || { name: 'target-repo', root: path.resolve(targetRoot || process.cwd()), kind: 'unknown' },
      errors: ['target governance materialize write requires --force'],
      writes_performed: false,
      boundary: materializationBoundary(Boolean(plan.target && plan.target.kind === 'target-repo'), false)
    });
  }

  if (plan.status !== 'ok') {
    return Object.assign({}, base, {
      status: plan.status,
      target: plan.target,
      materialization: plan.materialization || null,
      errors: plan.errors || [],
      writes_performed: false,
      boundary: materializationBoundary(Boolean(plan.target && plan.target.kind === 'target-repo'), false)
    });
  }

  const invalidPlannedWrites = (plan.materialization.planned_writes || [])
    .filter((item) => !isAllowedIndexWritePath(item.path) || (item.existing_present && item.existing_kind !== 'file'))
    .map((item) => `${item.path}: ${!isAllowedIndexWritePath(item.path) ? 'not_allowlisted' : `existing_${item.existing_kind}`}`);
  if (invalidPlannedWrites.length > 0) {
    return Object.assign({}, base, {
      status: 'blocked',
      target: plan.target,
      materialization: Object.assign({}, plan.materialization, {
        mode: 'explicit_write_blocked',
        write_results: [],
        changed_path_count: 0
      }),
      errors: invalidPlannedWrites.map((item) => `cannot write governance index: ${item}`),
      writes_performed: false,
      boundary: materializationBoundary(true, false)
    });
  }

  const writeResults = (plan.materialization.planned_writes || []).map((item) => writePlannedIndexIfChanged(plan.target.root, item));
  const writeErrors = writeResults.filter((item) => item.error).map((item) => `${item.path}: ${item.error}`);
  const changedPathCount = writeResults.filter((item) => item.wrote).length;

  return Object.assign({}, base, {
    status: writeErrors.length > 0 ? 'blocked' : 'ok',
    target: plan.target,
    materialization: {
      purpose: 'explicit target governance index materialization write',
      mode: 'explicit_write',
      index_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
      raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
      planned_writes: plan.materialization.planned_writes,
      write_results: writeResults,
      changed_path_count: changedPathCount,
      max_index_bytes_each: MAX_INDEX_BYTES_EACH,
      max_combined_index_bytes: MAX_COMBINED_INDEX_BYTES,
      combined_index_bytes: plan.materialization.combined_index_bytes,
      budget_status: plan.materialization.budget_status,
      warnings: plan.materialization.warnings,
      authority_policy: Object.assign({}, plan.materialization.authority_policy, {
        indexes_are_written_as_first_read_cache_only: true,
        raw_authority_files_are_not_modified: true
      })
    },
    recommended_next_commands: [
      'agent-onboard target governance --text',
      'agent-onboard target handoff --text',
      'agent-onboard check --fast --text'
    ],
    output_policy: {
      compact_default: true,
      raw_work_items_file_inlined: false,
      raw_claims_ledger_inlined: false,
      planned_index_payloads_inlined: true,
      target_ai_memory_content_inlined: false,
      provider_private_state_inlined: false
    },
    writes_performed: changedPathCount > 0,
    boundary: materializationBoundary(true, true),
    errors: writeErrors
  });
}


function targetGovernanceIndexRefreshBoundary(writeBoundary, triggered) {
  return Object.freeze({
    writes_files: Boolean(writeBoundary && writeBoundary.writes_files),
    writes_target_repository_state: Boolean(writeBoundary && writeBoundary.writes_target_repository_state),
    creates_agent_onboard_runtime_state: Boolean(writeBoundary && writeBoundary.creates_agent_onboard_runtime_state),
    scans_target_repository: true,
    bounded_to_known_governance_files: true,
    allowed_write_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
    refreshes_governance_indexes_after_admitted_mutation: Boolean(triggered),
    writes_governance_indexes: Boolean(writeBoundary && writeBoundary.writes_governance_indexes),
    compare_before_write: true,
    inlines_raw_work_items_file: false,
    inlines_raw_claims_ledger: false,
    mutates_raw_work_items_file: false,
    mutates_claims_ledger: false,
    admits_or_closes_work_items: false,
    creates_claims: false,
    installs_dependencies: false,
    runs_build_test_deploy: false,
    runs_managed_project_commands: false,
    publishes_package: false,
    network: false,
    git_mutation: false
  });
}

function targetGovernanceIndexRefreshAfterMutation(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const trigger = isPlainObject(deps.trigger) ? deps.trigger : {};
  const command = safeString(trigger.command) || 'unknown write command';
  const file = safeString(trigger.file) || WORK_ITEMS_PATH;
  const canonicalWorkItemsFile = file === WORK_ITEMS_PATH;
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_REFRESH_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: `${command} -> target governance index refresh`,
    command_family: TARGET_GOVERNANCE_FAMILY,
    trigger: Object.freeze({
      command,
      file,
      canonical_work_items_file: canonicalWorkItemsFile,
      admitted_write_completed: trigger.admitted_write_completed === true
    })
  });

  if (trigger.admitted_write_completed !== true) {
    return Object.assign({}, base, {
      status: 'skipped',
      reason: 'governance index refresh requires a completed admitted write',
      materialization: null,
      writes_performed: false,
      boundary: targetGovernanceIndexRefreshBoundary(materializationBoundary(false, false), false),
      errors: []
    });
  }

  if (!canonicalWorkItemsFile) {
    return Object.assign({}, base, {
      status: 'skipped',
      reason: `governance index refresh is bound to ${WORK_ITEMS_PATH}`,
      materialization: null,
      writes_performed: false,
      boundary: targetGovernanceIndexRefreshBoundary(materializationBoundary(false, false), false),
      errors: []
    });
  }

  const writeResult = targetGovernanceIndexMaterializationWrite(targetRoot, {
    version,
    releaseLine,
    force: true,
    updatedAt: safeString(deps.updatedAt)
  });
  return Object.assign({}, base, {
    status: writeResult.status,
    reason: writeResult.status === 'ok' ? 'governance indexes refreshed after admitted write' : 'governance index refresh failed after admitted write',
    materialization: writeResult.materialization,
    refresh_result_schema: writeResult.schema,
    refresh_changed_path_count: writeResult.materialization && typeof writeResult.materialization.changed_path_count === 'number' ? writeResult.materialization.changed_path_count : 0,
    writes_performed: writeResult.writes_performed === true,
    boundary: targetGovernanceIndexRefreshBoundary(writeResult.boundary, true),
    errors: Array.isArray(writeResult.errors) ? writeResult.errors : []
  });
}

function targetGovernanceIndexMaterializationWriteText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target governance materialization write',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      `Writes performed: ${result.writes_performed === true ? 'true' : 'false'}`
    ].join('\n') + '\n';
  }
  const materialization = result.materialization;
  return [
    'agent-onboard target governance materialization write',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Budget: ${materialization.budget_status}; ${materialization.combined_index_bytes}/${materialization.max_combined_index_bytes} bytes combined`,
    `Changed paths: ${materialization.changed_path_count}`,
    ...materialization.write_results.map((item) => `  - ${item.path}: ${item.action}, wrote ${item.wrote ? 'yes' : 'no'}, ${item.bytes || 0} bytes, schema ${item.schema || 'unknown'}`),
    `Warnings: ${materialization.warnings.length > 0 ? materialization.warnings.join(', ') : 'none'}`,
    'Boundary: explicit governance index write only; allowlisted index paths only; compare-before-write; raw work-items/claims remain authoritative; no admission, no claims, no Git mutation, no network.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    `Writes performed: ${result.writes_performed === true ? 'true' : 'false'}`
  ].join('\n') + '\n';
}

module.exports = {
  targetGovernanceIndexDriftCheck,
  targetGovernanceIndexDriftCheckText,
  targetGovernanceIndexDriftSummary,
  targetGovernanceIndexMaterializationDryRun,
  targetGovernanceIndexMaterializationDryRunText,
  targetGovernanceIndexMaterializationWrite,
  targetGovernanceIndexMaterializationWriteText,
  targetGovernanceIndexRefreshAfterMutation
};
