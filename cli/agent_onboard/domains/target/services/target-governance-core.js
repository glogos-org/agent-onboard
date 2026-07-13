'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'agent-onboard';
const TARGET_GOVERNANCE_SCHEMA = 'agent-onboard-public-target-governance-preview-001';
const TARGET_GOVERNANCE_MATERIALIZATION_SCHEMA = 'agent-onboard-public-target-governance-index-materialization-dry-run-001';
const TARGET_GOVERNANCE_MATERIALIZATION_WRITE_SCHEMA = 'agent-onboard-public-target-governance-index-materialization-write-001';
const TARGET_GOVERNANCE_REFRESH_SCHEMA = 'agent-onboard-public-target-governance-index-refresh-after-mutation-001';
const TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_SCHEMA = 'agent-onboard-public-target-governance-index-drift-check-001';
const TARGET_GOVERNANCE_BUDGET_CONTRACT_SCHEMA = 'agent-onboard-public-target-governance-budget-contract-001';
const TARGET_GOVERNANCE_BUDGET_CHECK_SCHEMA = 'agent-onboard-public-target-governance-budget-check-001';
const TARGET_GOVERNANCE_COMMAND = 'agent-onboard target governance --preview';
const TARGET_GOVERNANCE_MATERIALIZATION_COMMAND = 'agent-onboard target governance --materialize-dry-run';
const TARGET_GOVERNANCE_MATERIALIZATION_WRITE_COMMAND = 'agent-onboard target governance --materialize --write';
const TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_COMMAND = 'agent-onboard target governance --check';
const TARGET_GOVERNANCE_BUDGET_CONTRACT_COMMAND = 'agent-onboard target governance --budget-contract';
const TARGET_GOVERNANCE_BUDGET_CHECK_COMMAND = 'agent-onboard target governance --budget-check';
const TARGET_GOVERNANCE_FAMILY = 'target governance';
const WORK_ITEMS_PATH = '.agent-onboard/work-items.json';
const CLAIMS_PATH = '.agent-onboard/claims.jsonl';
const WORK_ITEMS_INDEX_PATH = '.agent-onboard/work-items.index.json';
const CLAIMS_INDEX_PATH = '.agent-onboard/claims.index.json';
const DEFAULT_LATEST_LIMIT = 5;
const MAX_LEDGER_BYTES = 128 * 1024;
const MAX_INDEX_BYTES_EACH = 4096;
const MAX_COMBINED_INDEX_BYTES = 8192;
const ALLOWED_INDEX_WRITE_PATHS = Object.freeze([WORK_ITEMS_INDEX_PATH, CLAIMS_INDEX_PATH]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' ? value : null;
}

function compactText(value, maxChars = 96) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

function safeStat(root, relPath) {
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(absoluteRoot, relPath);
  const rootPrefix = absoluteRoot + path.sep;
  if (absolute !== absoluteRoot && !absolute.startsWith(rootPrefix)) {
    return Object.freeze({ path: relPath, present: false, kind: 'invalid_path', bytes: null });
  }
  if (!fs.existsSync(absolute)) return Object.freeze({ path: relPath, present: false, kind: 'missing', bytes: null });
  const stat = fs.statSync(absolute);
  return Object.freeze({
    path: relPath,
    present: true,
    kind: stat.isDirectory() ? 'directory' : (stat.isFile() ? 'file' : 'other'),
    bytes: stat.isFile() ? stat.size : null
  });
}

function safeReadJson(root, relPath) {
  const observed = safeStat(root, relPath);
  if (!observed.present) return Object.freeze({ status: 'missing', observed, value: null, error: null });
  if (observed.kind !== 'file') return Object.freeze({ status: 'not_file', observed, value: null, error: `${relPath} is not a file` });
  try {
    return Object.freeze({ status: 'ok', observed, value: JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8')), error: null });
  } catch (error) {
    return Object.freeze({ status: 'invalid_json', observed, value: null, error: error && error.message ? error.message : String(error) });
  }
}

function parseClaimsLedger(root, relPath) {
  const observed = safeStat(root, relPath);
  if (!observed.present) return Object.freeze({ status: 'missing', observed, entries: [], malformed_line_count: 0, truncated: false, error: null });
  if (observed.kind !== 'file') return Object.freeze({ status: 'not_file', observed, entries: [], malformed_line_count: 0, truncated: false, error: `${relPath} is not a file` });
  if (observed.bytes > MAX_LEDGER_BYTES) {
    return Object.freeze({ status: 'too_large_for_preview', observed, entries: [], malformed_line_count: 0, truncated: true, error: `ledger exceeds ${MAX_LEDGER_BYTES} byte preview limit` });
  }
  const entries = [];
  let malformed = 0;
  const raw = fs.readFileSync(path.join(root, relPath), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (isPlainObject(entry)) entries.push(entry);
    } catch (_error) {
      malformed += 1;
    }
  }
  return Object.freeze({ status: malformed === 0 ? 'ok' : 'malformed_lines', observed, entries, malformed_line_count: malformed, truncated: false, error: null });
}

function workItemArray(document) {
  if (Array.isArray(document && document.work_items)) return document.work_items;
  if (Array.isArray(document && document.items)) return document.items;
  return [];
}

function admissionQueue(document) {
  return Array.isArray(document && document.admission_queue) ? document.admission_queue : [];
}

function compactWorkItem(item) {
  if (!isPlainObject(item)) return null;
  return Object.freeze({
    id: compactText(item.id, 80),
    title: compactText(item.title),
    status: compactText(item.status, 40),
    milestone_id: compactText(item.milestone_id, 80),
    domain: compactText(item.domain, 80)
  });
}

function compactClaim(entry) {
  if (!isPlainObject(entry)) return null;
  return Object.freeze({
    event_type: compactText(entry.event_type || entry.type, 80),
    work_item_id: compactText(entry.work_item_id, 80),
    claim_id: compactText(entry.claim_id, 120),
    claim_status: compactText(entry.claim_status || entry.status, 40),
    actor: compactText(entry.actor, 80),
    created_at: compactText(entry.created_at || entry.timestamp, 40)
  });
}

function pushBounded(list, value, limit = DEFAULT_LATEST_LIMIT) {
  if (!value) return;
  list.push(value);
  if (list.length > limit) list.shift();
}

function pushUniqueBounded(list, value, limit = DEFAULT_LATEST_LIMIT) {
  if (!value || list.includes(value)) return;
  pushBounded(list, value, limit);
}

function buildWorkItemsIndex(document, options = {}) {
  const latestLimit = options.latestLimit || DEFAULT_LATEST_LIMIT;
  const status = safeString(options.status) || 'derived_preview';
  const updatedAt = safeString(options.updatedAt);
  const items = workItemArray(document).filter(isPlainObject);
  const queue = admissionQueue(document).filter(isPlainObject);
  const latestClosed = [];
  const activeWorkItemIds = [];
  const activeQueue = [];
  let openCount = 0;
  let closedCount = 0;
  let nextOpenWorkItem = null;

  for (const item of items) {
    const status = safeString(item.status) || 'unknown';
    if (status === 'open' || status === 'open_next_admitted') {
      openCount += 1;
      if (!nextOpenWorkItem) nextOpenWorkItem = compactWorkItem(item);
      pushUniqueBounded(activeWorkItemIds, safeString(item.id), latestLimit);
    } else if (status === 'closed') {
      closedCount += 1;
      pushBounded(latestClosed, compactWorkItem(item), latestLimit);
    }
  }
  for (const item of queue) pushBounded(activeQueue, compactWorkItem(item), latestLimit);

  const index = {
    schema: 'agent-onboard-target-work-items-index-001',
    status,
    registry_path: WORK_ITEMS_PATH,
    raw_registry_loaded_by_default: false,
    item_count: items.length,
    open_count: openCount,
    closed_count: closedCount,
    admission_queue_count: queue.length,
    active_work_item_ids: activeWorkItemIds,
    next_open_work_item: nextOpenWorkItem,
    next_admission_candidate: activeQueue[0] || null,
    active_admission_queue: activeQueue,
    latest_closed_limit: latestLimit,
    latest_closed_work_items: latestClosed
  };
  if (updatedAt) index.updated_at = updatedAt;
  return Object.freeze(index);
}

function buildClaimsIndex(entries, options = {}) {
  const latestLimit = options.latestLimit || DEFAULT_LATEST_LIMIT;
  const status = safeString(options.status) || 'derived_preview';
  const updatedAt = safeString(options.updatedAt);
  const latestClaims = [];
  const latestMergedWorkItemIds = [];
  const claimState = new Map();
  const activeWorkItemIds = [];
  const conflictWorkItemIds = [];
  let proposedCount = 0;
  let mergedCount = 0;

  for (const entry of Array.isArray(entries) ? entries : []) {
    const claimStatus = safeString(entry.claim_status || entry.status) || 'unknown';
    const eventType = safeString(entry.event_type || entry.type) || '';
    const claimId = safeString(entry.claim_id);
    const workItemId = safeString(entry.work_item_id);
    pushBounded(latestClaims, compactClaim(entry), latestLimit);
    if (['proposed', 'claimed', 'active'].includes(claimStatus) || eventType === 'claim_proposed') {
      proposedCount += 1;
      if (claimId) {
        claimState.set(claimId, {
          claim_id: claimId,
          work_item_id: workItemId,
          actor: compactText(entry.actor, 80),
          proposed_at: compactText(entry.created_at || entry.timestamp, 40),
          active: true
        });
      }
    } else if (claimStatus === 'merged' || eventType === 'claim_merged') {
      mergedCount += 1;
      pushUniqueBounded(latestMergedWorkItemIds, workItemId, latestLimit);
      if (claimId && claimState.has(claimId)) {
        const state = claimState.get(claimId);
        state.active = false;
        state.merged_at = compactText(entry.created_at || entry.timestamp, 40);
        claimState.set(claimId, state);
      } else if (claimId) {
        claimState.set(claimId, {
          claim_id: claimId,
          work_item_id: workItemId,
          actor: compactText(entry.actor, 80),
          proposed_at: null,
          active: false,
          merged_at: compactText(entry.created_at || entry.timestamp, 40)
        });
      }
    }
  }

  const activeClaimsByWorkItem = new Map();
  for (const state of claimState.values()) {
    if (!state.active || !state.work_item_id) continue;
    const active = activeClaimsByWorkItem.get(state.work_item_id) || [];
    active.push(state.claim_id);
    activeClaimsByWorkItem.set(state.work_item_id, active);
  }
  for (const [workItemId, claimIds] of activeClaimsByWorkItem.entries()) {
    pushUniqueBounded(activeWorkItemIds, workItemId, latestLimit);
    if (claimIds.length > 1) pushUniqueBounded(conflictWorkItemIds, workItemId, latestLimit);
  }

  const index = {
    schema: 'agent-onboard-target-claims-index-001',
    status,
    ledger_path: CLAIMS_PATH,
    raw_ledger_loaded_by_default: false,
    claim_count: Array.isArray(entries) ? entries.length : 0,
    proposed_count: proposedCount,
    merged_count: mergedCount,
    latest_claims_limit: latestLimit,
    latest_claims: latestClaims.filter(Boolean),
    active_work_item_ids: activeWorkItemIds,
    latest_merged_work_item_ids: latestMergedWorkItemIds,
    lifecycle: {
      active_claim_count: Array.from(activeClaimsByWorkItem.values()).reduce((sum, claimIds) => sum + claimIds.length, 0),
      active_work_item_count: activeClaimsByWorkItem.size,
      conflict_count: conflictWorkItemIds.length,
      conflict_work_item_ids: conflictWorkItemIds,
      lifecycle_check_command: 'agent-onboard claim --lifecycle-check --json'
    }
  };
  if (updatedAt) index.updated_at = updatedAt;
  return Object.freeze(index);
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function utf8Bytes(text) {
  return Buffer.byteLength(String(text || ''), 'utf8');
}


function isAllowedIndexWritePath(relPath) {
  return ALLOWED_INDEX_WRITE_PATHS.includes(relPath);
}

function writePlannedIndexIfChanged(root, plannedWrite) {
  const relPath = safeString(plannedWrite && plannedWrite.path);
  if (!isAllowedIndexWritePath(relPath)) {
    return Object.freeze({ path: relPath || 'unknown', action: 'blocked', wrote: false, error: 'path_not_allowlisted_for_governance_index_write' });
  }
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(absoluteRoot, relPath);
  const rootPrefix = absoluteRoot + path.sep;
  if (absolute !== absoluteRoot && !absolute.startsWith(rootPrefix)) {
    return Object.freeze({ path: relPath, action: 'blocked', wrote: false, error: 'resolved_path_escapes_target_root' });
  }
  const observed = safeStat(absoluteRoot, relPath);
  if (observed.present && observed.kind !== 'file') {
    return Object.freeze({ path: relPath, action: 'blocked', wrote: false, error: `existing path is not a file: ${observed.kind}` });
  }
  const body = stableJson(plannedWrite.payload);
  if (observed.present && fs.readFileSync(absolute, 'utf8') === body) {
    return Object.freeze({ path: relPath, action: 'keep', wrote: false, bytes: utf8Bytes(body), schema: safeString(plannedWrite.payload && plannedWrite.payload.schema) });
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, body, 'utf8');
  return Object.freeze({ path: relPath, action: observed.present ? 'replace' : 'create', wrote: true, bytes: utf8Bytes(body), schema: safeString(plannedWrite.payload && plannedWrite.payload.schema) });
}


function sameIndexPayloadExceptUpdatedAt(left, right) {
  if (!isPlainObject(left) || !isPlainObject(right)) return false;
  const normalize = (value) => {
    const copy = Object.assign({}, value);
    delete copy.updated_at;
    return JSON.stringify(copy);
  };
  return normalize(left) === normalize(right);
}

function materializationPlan(root, relPath, payload) {
  const observed = safeStat(root, relPath);
  let plannedPayload = payload;
  if (observed.present && observed.kind === 'file') {
    try {
      const existingText = fs.readFileSync(path.join(root, relPath), 'utf8');
      const existingPayload = JSON.parse(existingText);
      if (sameIndexPayloadExceptUpdatedAt(existingPayload, payload) && safeString(existingPayload.updated_at)) {
        plannedPayload = Object.freeze(Object.assign({}, payload, { updated_at: existingPayload.updated_at }));
      }
    } catch (_error) {
      plannedPayload = payload;
    }
  }
  const body = stableJson(plannedPayload);
  let existingMatches = false;
  if (observed.present && observed.kind === 'file') {
    try {
      existingMatches = fs.readFileSync(path.join(root, relPath), 'utf8') === body;
    } catch (_error) {
      existingMatches = false;
    }
  }
  return Object.freeze({
    path: relPath,
    action: existingMatches ? 'keep' : (observed.present ? 'replace' : 'create'),
    would_write: existingMatches ? false : true,
    existing_present: observed.present,
    existing_kind: observed.kind,
    bytes: utf8Bytes(body),
    schema: safeString(plannedPayload && plannedPayload.schema),
    payload: plannedPayload
  });
}

function indexSummary(readResult, derived, relPath, expectedSchema) {
  const source = readResult.status === 'ok' && isPlainObject(readResult.value) ? readResult.value : derived;
  const present = readResult.status === 'ok';
  return Object.freeze({
    path: relPath,
    present,
    parse_status: readResult.status,
    schema: safeString(source && source.schema),
    schema_matches_expected: source && source.schema === expectedSchema,
    source: present ? 'stored_index' : (derived ? 'derived_preview' : 'unavailable'),
    status: safeString(source && source.status) || (present ? 'active' : 'missing'),
    raw_loaded_by_default: source && (source.raw_registry_loaded_by_default === true || source.raw_ledger_loaded_by_default === true) ? true : false,
    item_count: typeof (source && source.item_count) === 'number' ? source.item_count : undefined,
    open_count: typeof (source && source.open_count) === 'number' ? source.open_count : undefined,
    closed_count: typeof (source && source.closed_count) === 'number' ? source.closed_count : undefined,
    admission_queue_count: typeof (source && source.admission_queue_count) === 'number' ? source.admission_queue_count : undefined,
    claim_count: typeof (source && source.claim_count) === 'number' ? source.claim_count : undefined,
    proposed_count: typeof (source && source.proposed_count) === 'number' ? source.proposed_count : undefined,
    merged_count: typeof (source && source.merged_count) === 'number' ? source.merged_count : undefined,
    active_work_item_ids: Array.isArray(source && source.active_work_item_ids) ? source.active_work_item_ids.slice(0, DEFAULT_LATEST_LIMIT) : [],
    next_open_work_item: source && source.next_open_work_item ? source.next_open_work_item : null,
    next_admission_candidate: source && source.next_admission_candidate ? source.next_admission_candidate : null,
    latest_claims: Array.isArray(source && source.latest_claims) ? source.latest_claims.slice(0, DEFAULT_LATEST_LIMIT) : [],
    latest_closed_work_items: Array.isArray(source && source.latest_closed_work_items) ? source.latest_closed_work_items.slice(-DEFAULT_LATEST_LIMIT) : []
  });
}

function governanceReadiness(workIndex, claimsIndex, rawWorkItems, rawClaims) {
  const warnings = [];
  if (!workIndex.present && rawWorkItems.status === 'ok') warnings.push('stored_work_items_index_missing_derived_preview_used');
  if (!claimsIndex.present && rawClaims.status === 'ok') warnings.push('stored_claims_index_missing_derived_preview_used');
  if (workIndex.present && workIndex.schema_matches_expected === false) warnings.push('stored_work_items_index_schema_mismatch');
  if (claimsIndex.present && claimsIndex.schema_matches_expected === false) warnings.push('stored_claims_index_schema_mismatch');
  if (rawClaims.status === 'too_large_for_preview') warnings.push('claims_ledger_too_large_for_preview_without_index');
  const blocked = [];
  if (rawWorkItems.status !== 'ok' && !workIndex.present && rawWorkItems.status !== 'missing') blocked.push('work_items_registry_unparseable_and_index_missing');
  if (rawClaims.status !== 'ok' && !claimsIndex.present && !['missing', 'too_large_for_preview'].includes(rawClaims.status)) blocked.push('claims_ledger_unparseable_and_index_missing');
  return Object.freeze({
    status: blocked.length > 0 ? 'blocked' : (warnings.length > 0 ? 'usable_with_warnings' : 'ready'),
    blockers: blocked,
    warnings,
    compact_first_read_available: workIndex.present || claimsIndex.present,
    derived_preview_available: Boolean(workIndex.source === 'derived_preview' || claimsIndex.source === 'derived_preview')
  });
}


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


function materializationBoundary(scansTargetRepository, writesFiles = false) {
  return Object.freeze({
    writes_files: Boolean(writesFiles),
    writes_target_repository_state: Boolean(writesFiles),
    creates_agent_onboard_runtime_state: Boolean(writesFiles),
    scans_target_repository: Boolean(scansTargetRepository),
    bounded_to_known_governance_files: true,
    allowed_write_paths: writesFiles ? ALLOWED_INDEX_WRITE_PATHS.slice() : [],
    reads_target_work_items_metadata: Boolean(scansTargetRepository),
    reads_claims_ledger_metadata: Boolean(scansTargetRepository),
    plans_index_materialization: Boolean(scansTargetRepository),
    writes_governance_indexes: Boolean(writesFiles),
    compare_before_write: Boolean(writesFiles),
    inlines_planned_index_payloads: Boolean(scansTargetRepository),
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

function noMutationBoundary(scansTargetRepository) {
  return Object.freeze({
    writes_files: false,
    writes_target_repository_state: false,
    creates_agent_onboard_runtime_state: false,
    scans_target_repository: Boolean(scansTargetRepository),
    bounded_to_known_governance_files: true,
    reads_target_work_items_metadata: Boolean(scansTargetRepository),
    reads_claims_ledger_metadata: Boolean(scansTargetRepository),
    inlines_raw_work_items_file: false,
    inlines_raw_claims_ledger: false,
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

module.exports = {
  PACKAGE_NAME,
  TARGET_GOVERNANCE_SCHEMA,
  TARGET_GOVERNANCE_MATERIALIZATION_SCHEMA,
  TARGET_GOVERNANCE_MATERIALIZATION_WRITE_SCHEMA,
  TARGET_GOVERNANCE_REFRESH_SCHEMA,
  TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_SCHEMA,
  TARGET_GOVERNANCE_BUDGET_CONTRACT_SCHEMA,
  TARGET_GOVERNANCE_BUDGET_CHECK_SCHEMA,
  TARGET_GOVERNANCE_COMMAND,
  TARGET_GOVERNANCE_MATERIALIZATION_COMMAND,
  TARGET_GOVERNANCE_MATERIALIZATION_WRITE_COMMAND,
  TARGET_GOVERNANCE_INDEX_DRIFT_CHECK_COMMAND,
  TARGET_GOVERNANCE_BUDGET_CONTRACT_COMMAND,
  TARGET_GOVERNANCE_BUDGET_CHECK_COMMAND,
  TARGET_GOVERNANCE_FAMILY,
  WORK_ITEMS_PATH,
  CLAIMS_PATH,
  WORK_ITEMS_INDEX_PATH,
  CLAIMS_INDEX_PATH,
  DEFAULT_LATEST_LIMIT,
  MAX_LEDGER_BYTES,
  MAX_INDEX_BYTES_EACH,
  MAX_COMBINED_INDEX_BYTES,
  ALLOWED_INDEX_WRITE_PATHS,
  isPlainObject,
  safeString,
  compactText,
  safeStat,
  safeReadJson,
  parseClaimsLedger,
  buildWorkItemsIndex,
  buildClaimsIndex,
  stableJson,
  utf8Bytes,
  isAllowedIndexWritePath,
  writePlannedIndexIfChanged,
  materializationPlan,
  indexSummary,
  governanceReadiness,
  materializationBoundary,
  noMutationBoundary
};
