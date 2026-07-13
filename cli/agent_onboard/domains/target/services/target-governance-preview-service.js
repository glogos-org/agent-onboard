'use strict';

const fs = require('fs');
const path = require('path');
const {
  PACKAGE_NAME,
  TARGET_GOVERNANCE_SCHEMA,
  TARGET_GOVERNANCE_COMMAND,
  TARGET_GOVERNANCE_FAMILY,
  WORK_ITEMS_PATH,
  CLAIMS_PATH,
  WORK_ITEMS_INDEX_PATH,
  CLAIMS_INDEX_PATH,
  DEFAULT_LATEST_LIMIT,
  MAX_LEDGER_BYTES,
  isPlainObject,
  safeReadJson,
  parseClaimsLedger,
  buildWorkItemsIndex,
  buildClaimsIndex,
  indexSummary,
  governanceReadiness,
  noMutationBoundary
} = require('./target-governance-core');

function targetGovernancePreview(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_authority_compact_index_drift_guard_gate';
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const base = Object.freeze({
    schema: TARGET_GOVERNANCE_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_GOVERNANCE_COMMAND,
    command_family: TARGET_GOVERNANCE_FAMILY
  });

  if (!fs.existsSync(absoluteTargetRoot)) {
    return Object.assign({}, base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'missing' },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: noMutationBoundary(false)
    });
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return Object.assign({}, base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'file' },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: noMutationBoundary(false)
    });
  }

  const workIndexRead = safeReadJson(absoluteTargetRoot, WORK_ITEMS_INDEX_PATH);
  const claimsIndexRead = safeReadJson(absoluteTargetRoot, CLAIMS_INDEX_PATH);
  const rawWorkItemsRead = safeReadJson(absoluteTargetRoot, WORK_ITEMS_PATH);
  const rawClaimsRead = parseClaimsLedger(absoluteTargetRoot, CLAIMS_PATH);
  const derivedWorkIndex = rawWorkItemsRead.status === 'ok' && isPlainObject(rawWorkItemsRead.value) ? buildWorkItemsIndex(rawWorkItemsRead.value) : null;
  const derivedClaimsIndex = rawClaimsRead.status === 'ok' ? buildClaimsIndex(rawClaimsRead.entries) : null;
  const workIndex = indexSummary(workIndexRead, derivedWorkIndex, WORK_ITEMS_INDEX_PATH, 'agent-onboard-target-work-items-index-001');
  const claimsIndex = indexSummary(claimsIndexRead, derivedClaimsIndex, CLAIMS_INDEX_PATH, 'agent-onboard-target-claims-index-001');
  const readiness = governanceReadiness(workIndex, claimsIndex, rawWorkItemsRead, rawClaimsRead);

  return Object.assign({}, base, {
    status: 'ok',
    target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'target-repo' },
    governance: {
      purpose: 'compact read-only governance preview for target work-item and claim surfaces',
      index_paths: [WORK_ITEMS_INDEX_PATH, CLAIMS_INDEX_PATH],
      raw_growth_files_on_demand_only: [WORK_ITEMS_PATH, CLAIMS_PATH],
      work_items_index: workIndex,
      claims_index: claimsIndex,
      readiness,
      budget_policy: {
        compact_first_read_indexes_preferred: true,
        raw_growth_files_loaded_by_default: false,
        command_may_derive_preview_from_raw_files_on_explicit_user_request: true,
        max_claims_ledger_bytes_for_preview: MAX_LEDGER_BYTES,
        latest_limit: DEFAULT_LATEST_LIMIT
      }
    },
    recommended_next_commands: [
      'agent-onboard target governance --materialize-dry-run --text',
      'agent-onboard target handoff --text',
      'agent-onboard target work-items --text',
      'agent-onboard target inventory --text',
      'agent-onboard check --fast --text'
    ],
    output_policy: {
      compact_default: true,
      raw_work_items_file_inlined: false,
      raw_claims_ledger_inlined: false,
      target_ai_memory_content_inlined: false,
      provider_private_state_inlined: false
    },
    writes_performed: false,
    boundary: noMutationBoundary(true),
    errors: []
  });
}

function targetGovernancePreviewText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target governance',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const governance = result.governance;
  const work = governance.work_items_index;
  const claims = governance.claims_index;
  const open = work.next_open_work_item ? `${work.next_open_work_item.id} — ${work.next_open_work_item.title || 'untitled'}` : 'none';
  const queued = work.next_admission_candidate ? `${work.next_admission_candidate.id} — ${work.next_admission_candidate.title || 'untitled'}` : 'none';
  return [
    'agent-onboard target governance',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Readiness: ${governance.readiness.status}`,
    `Work-items index: ${work.present ? 'present' : work.source}`,
    `Work-items: total ${work.item_count || 0}, open ${work.open_count || 0}, closed ${work.closed_count || 0}, queue ${work.admission_queue_count || 0}`,
    `Next open item: ${open}`,
    `Next queued candidate: ${queued}`,
    `Claims index: ${claims.present ? 'present' : claims.source}`,
    `Claims: total ${claims.claim_count || 0}, proposed ${claims.proposed_count || 0}, merged ${claims.merged_count || 0}`,
    `Warnings: ${governance.readiness.warnings.length > 0 ? governance.readiness.warnings.join(', ') : 'none'}`,
    'Boundary: read-only governance preview; compact indexes preferred; raw growth files are on-demand only; no admission, no claims, no Git mutation, no network, no writes.',
    'Next commands:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

module.exports = {
  targetGovernancePreview,
  targetGovernancePreviewText
};
