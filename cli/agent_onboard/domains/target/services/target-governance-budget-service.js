'use strict';

const path = require('path');
const {
  PACKAGE_NAME,
  TARGET_GOVERNANCE_BUDGET_CONTRACT_SCHEMA,
  TARGET_GOVERNANCE_BUDGET_CHECK_SCHEMA,
  TARGET_GOVERNANCE_BUDGET_CONTRACT_COMMAND,
  TARGET_GOVERNANCE_BUDGET_CHECK_COMMAND,
  TARGET_GOVERNANCE_FAMILY,
  WORK_ITEMS_INDEX_PATH,
  CLAIMS_INDEX_PATH,
  WORK_ITEMS_PATH,
  CLAIMS_PATH,
  MAX_LEDGER_BYTES,
  MAX_INDEX_BYTES_EACH,
  MAX_COMBINED_INDEX_BYTES,
  ALLOWED_INDEX_WRITE_PATHS,
  DEFAULT_LATEST_LIMIT,
  safeString,
  noMutationBoundary
} = require('./target-governance-core');
const { targetGovernanceIndexMaterializationDryRun } = require('./target-governance-index-materialization-service');

function targetGovernanceBudgetContract(deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  return Object.freeze({
    schema: TARGET_GOVERNANCE_BUDGET_CONTRACT_SCHEMA,
    status: 'ok',
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_GOVERNANCE_BUDGET_CONTRACT_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY,
    purpose: 'stable public contract for compact target governance first-read indexes and raw growth-file authority boundaries',
    target_first_read_indexes: Object.freeze([WORK_ITEMS_INDEX_PATH, CLAIMS_INDEX_PATH]),
    raw_growth_files_on_demand_only: Object.freeze([WORK_ITEMS_PATH, CLAIMS_PATH]),
    raw_growth_files_loaded_by_default: false,
    compact_first_read_indexes_preferred: true,
    indexes_are_first_read_cache: true,
    work_items_json_remains_authoritative: true,
    claims_jsonl_remains_authoritative: true,
    max_index_bytes_each: MAX_INDEX_BYTES_EACH,
    max_combined_index_bytes: MAX_COMBINED_INDEX_BYTES,
    max_claims_ledger_bytes_for_preview: MAX_LEDGER_BYTES,
    latest_limit: DEFAULT_LATEST_LIMIT,
    write_policy: Object.freeze({
      allowed_write_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
      explicit_write_required: true,
      materialize_requires_write_and_force: true,
      compare_before_write: true,
      drift_check_writes_files: false,
      budget_contract_writes_files: false,
      raw_work_items_file_mutated_by_governance_commands: false,
      claims_ledger_mutated_by_governance_commands: false
    }),
    output_policy: Object.freeze({
      compact_default: true,
      raw_work_items_file_inlined: false,
      raw_claims_ledger_inlined: false,
      planned_index_payloads_inlined_by_contract: false,
      target_ai_memory_content_inlined: false,
      provider_private_state_inlined: false
    }),
    recommended_next_commands: Object.freeze([
      'agent-onboard target governance --text',
      'agent-onboard target governance --check --text',
      'agent-onboard target governance --materialize-dry-run --text',
      'agent-onboard check --fast --text'
    ]),
    writes_performed: false,
    boundary: noMutationBoundary(false),
    errors: Object.freeze([])
  });
}

function targetGovernanceBudgetContractText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target governance budget contract',
      `Status: ${result.status}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  return [
    'agent-onboard target governance budget contract',
    `Package: ${result.package_name}@${result.version}`,
    `Release line: ${result.release_line}`,
    `First-read indexes: ${result.target_first_read_indexes.join(', ')}`,
    `Raw authority files: ${result.raw_growth_files_on_demand_only.join(', ')} (on-demand only)`,
    `Index budget: ${result.max_index_bytes_each} bytes each; ${result.max_combined_index_bytes} bytes combined`,
    `Claims preview limit: ${result.max_claims_ledger_bytes_for_preview} bytes`,
    `Latest item limit: ${result.latest_limit}`,
    'Authority: indexes are compact first-read cache; raw work-items and claims ledger remain authoritative.',
    'Write policy: explicit materialize --write --force only; compare-before-write; allowlisted index paths only.',
    'Boundary: contract read only; no target scan, no raw file import, no admission, no claims, no Git mutation, no network, no writes.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}


function budgetCheckEntry(plannedWrite) {
  const bytes = typeof (plannedWrite && plannedWrite.bytes) === 'number' ? plannedWrite.bytes : null;
  return Object.freeze({
    path: safeString(plannedWrite && plannedWrite.path) || 'unknown',
    schema: safeString(plannedWrite && plannedWrite.schema),
    bytes,
    max_bytes: MAX_INDEX_BYTES_EACH,
    within_budget: typeof bytes === 'number' ? bytes <= MAX_INDEX_BYTES_EACH : false,
    compare_action: safeString(plannedWrite && plannedWrite.action) || 'unknown',
    existing_present: plannedWrite && plannedWrite.existing_present === true,
    existing_kind: safeString(plannedWrite && plannedWrite.existing_kind) || 'unknown',
    would_write_on_materialize: plannedWrite && plannedWrite.would_write === true
  });
}

function targetGovernanceBudgetCheck(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const plan = targetGovernanceIndexMaterializationDryRun(targetRoot, { version, releaseLine, updatedAt: safeString(deps.updatedAt) || new Date().toISOString() });
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_BUDGET_CHECK_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_GOVERNANCE_BUDGET_CHECK_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY
  });

  if (plan.status !== 'ok') {
    const entries = plan.materialization && Array.isArray(plan.materialization.planned_writes)
      ? plan.materialization.planned_writes.map(budgetCheckEntry)
      : [];
    return Object.assign({}, base, {
      status: 'blocked',
      target: plan.target || { name: 'target-repo', root: path.resolve(targetRoot || process.cwd()), kind: 'unknown' },
      budget_check: {
        purpose: 'compact no-write validation of target governance index byte budgets without inlining planned index payloads',
        mode: 'no_write_budget_check',
        overall_state: 'blocked',
        budget_within_contract: false,
        index_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
        raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
        index_states: entries,
        combined_index_bytes: plan.materialization && typeof plan.materialization.combined_index_bytes === 'number' ? plan.materialization.combined_index_bytes : null,
        max_index_bytes_each: MAX_INDEX_BYTES_EACH,
        max_combined_index_bytes: MAX_COMBINED_INDEX_BYTES,
        materialization_status: plan.status,
        materialize_command: 'agent-onboard target governance --materialize --write --force',
        warnings: plan.materialization && Array.isArray(plan.materialization.warnings) ? plan.materialization.warnings : [],
        authority_policy: {
          indexes_are_first_read_cache: true,
          work_items_json_remains_authoritative: true,
          claims_jsonl_remains_authoritative: true,
          budget_check_does_not_refresh_or_write_indexes: true,
          planned_index_payloads_are_not_inlined: true
        }
      },
      recommended_next_commands: [
        'agent-onboard target governance --budget-contract --text',
        'agent-onboard target governance --materialize-dry-run --text',
        'agent-onboard target governance --text',
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
      boundary: Object.assign({}, noMutationBoundary(Boolean(plan.target && plan.target.kind === 'target-repo')), {
        validates_governance_index_byte_budgets: true,
        refreshes_governance_indexes: false,
        writes_governance_indexes: false,
        inlines_planned_index_payloads: false
      }),
      errors: Array.isArray(plan.errors) ? plan.errors : []
    });
  }

  const entries = (plan.materialization.planned_writes || []).map(budgetCheckEntry);
  const combinedBytes = plan.materialization.combined_index_bytes;
  const perIndexOk = entries.every((entry) => entry.within_budget === true);
  const combinedOk = typeof combinedBytes === 'number' && combinedBytes <= MAX_COMBINED_INDEX_BYTES;
  const withinContract = perIndexOk && combinedOk;
  const warnings = Array.isArray(plan.materialization.warnings) ? plan.materialization.warnings.slice() : [];
  if (!perIndexOk) warnings.push('governance_index_per_file_budget_exceeded');
  if (!combinedOk) warnings.push('governance_index_combined_budget_exceeded');

  return Object.assign({}, base, {
    status: withinContract ? 'ok' : 'blocked',
    target: plan.target,
    budget_check: {
      purpose: 'compact no-write validation of target governance index byte budgets without inlining planned index payloads',
      mode: 'no_write_budget_check',
      overall_state: withinContract ? 'within_budget' : 'over_budget',
      budget_within_contract: withinContract,
      index_paths: ALLOWED_INDEX_WRITE_PATHS.slice(),
      raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
      index_states: entries,
      combined_index_bytes: combinedBytes,
      max_index_bytes_each: MAX_INDEX_BYTES_EACH,
      max_combined_index_bytes: MAX_COMBINED_INDEX_BYTES,
      materialization_status: plan.status,
      materialize_command: 'agent-onboard target governance --materialize --write --force',
      warnings,
      authority_policy: {
        indexes_are_first_read_cache: true,
        work_items_json_remains_authoritative: true,
        claims_jsonl_remains_authoritative: true,
        budget_check_does_not_refresh_or_write_indexes: true,
        planned_index_payloads_are_not_inlined: true
      }
    },
    recommended_next_commands: withinContract ? [
      'agent-onboard target governance --check --text',
      'agent-onboard target governance --text',
      'agent-onboard check --fast --text'
    ] : [
      'agent-onboard target governance --budget-contract --text',
      'agent-onboard target governance --materialize-dry-run --text',
      'agent-onboard target governance --text',
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
      validates_governance_index_byte_budgets: true,
      refreshes_governance_indexes: false,
      writes_governance_indexes: false,
      inlines_planned_index_payloads: false
    }),
    errors: withinContract ? [] : warnings.filter((item) => String(item).includes('budget_exceeded'))
  });
}

function targetGovernanceBudgetCheckText(result) {
  if (result.status !== 'ok') {
    const budget = result.budget_check || {};
    const entries = Array.isArray(budget.index_states) ? budget.index_states : [];
    return [
      'agent-onboard target governance budget check',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Budget state: ${budget.overall_state || 'unknown'}`,
      ...entries.map((item) => `  - ${item.path}: ${item.bytes === null ? 'unknown' : item.bytes}/${item.max_bytes} bytes; within budget ${item.within_budget ? 'yes' : 'no'}`),
      `Combined: ${budget.combined_index_bytes === null || budget.combined_index_bytes === undefined ? 'unknown' : budget.combined_index_bytes}/${budget.max_combined_index_bytes || MAX_COMBINED_INDEX_BYTES} bytes`,
      `Warnings: ${Array.isArray(budget.warnings) && budget.warnings.length > 0 ? budget.warnings.join(', ') : 'none'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Boundary: no-write budget check only; planned index payloads are not inlined; raw work-items/claims remain authoritative; no refresh, no admission, no claims, no Git mutation, no network.',
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const budget = result.budget_check;
  return [
    'agent-onboard target governance budget check',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Budget state: ${budget.overall_state}`,
    ...budget.index_states.map((item) => `  - ${item.path}: ${item.bytes}/${item.max_bytes} bytes; within budget ${item.within_budget ? 'yes' : 'no'}; compare ${item.compare_action}`),
    `Combined: ${budget.combined_index_bytes}/${budget.max_combined_index_bytes} bytes`,
    `Warnings: ${budget.warnings.length > 0 ? budget.warnings.join(', ') : 'none'}`,
    'Boundary: no-write budget check only; planned index payloads are not inlined; raw work-items/claims remain authoritative; no refresh, no admission, no claims, no Git mutation, no network.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

module.exports = {
  targetGovernanceBudgetContract,
  targetGovernanceBudgetContractText,
  targetGovernanceBudgetCheck,
  targetGovernanceBudgetCheckText
};
