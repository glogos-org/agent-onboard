'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'agent-onboard';
const TARGET_GOVERNANCE_SCHEMA = 'agent-onboard-public-target-governance-preview-001';
const TARGET_GOVERNANCE_MATERIALIZATION_SCHEMA = 'agent-onboard-public-target-governance-index-materialization-dry-run-001';
const TARGET_GOVERNANCE_COMMAND = 'agent-onboard target governance --preview';
const TARGET_GOVERNANCE_MATERIALIZATION_COMMAND = 'agent-onboard target governance --materialize-dry-run';
const TARGET_GOVERNANCE_FAMILY = 'target governance';
const WORK_ITEMS_PATH = '.agent-onboard/work-items.json';
const CLAIMS_PATH = '.agent-onboard/claims.jsonl';
const WORK_ITEMS_INDEX_PATH = '.agent-onboard/work-items.index.json';
const CLAIMS_INDEX_PATH = '.agent-onboard/claims.index.json';
const DEFAULT_LATEST_LIMIT = 5;
const MAX_LEDGER_BYTES = 128 * 1024;
const MAX_INDEX_BYTES_EACH = 4096;
const MAX_COMBINED_INDEX_BYTES = 8192;

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
  const activeWorkItemIds = [];
  const latestMergedWorkItemIds = [];
  let proposedCount = 0;
  let mergedCount = 0;

  for (const entry of Array.isArray(entries) ? entries : []) {
    const status = safeString(entry.claim_status || entry.status) || 'unknown';
    pushBounded(latestClaims, compactClaim(entry), latestLimit);
    if (['proposed', 'claimed', 'active'].includes(status)) {
      proposedCount += 1;
      pushUniqueBounded(activeWorkItemIds, safeString(entry.work_item_id), latestLimit);
    } else if (status === 'merged') {
      mergedCount += 1;
      pushUniqueBounded(latestMergedWorkItemIds, safeString(entry.work_item_id), latestLimit);
    }
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
    latest_merged_work_item_ids: latestMergedWorkItemIds
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

function materializationPlan(root, relPath, payload) {
  const body = stableJson(payload);
  const observed = safeStat(root, relPath);
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
    schema: safeString(payload && payload.schema),
    payload
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


function targetGovernanceIndexMaterializationDryRun(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_target_governance_index_materialization_dry_run_gate';
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

function materializationBoundary(scansTargetRepository) {
  return Object.freeze({
    writes_files: false,
    writes_target_repository_state: false,
    creates_agent_onboard_runtime_state: false,
    scans_target_repository: Boolean(scansTargetRepository),
    bounded_to_known_governance_files: true,
    reads_target_work_items_metadata: Boolean(scansTargetRepository),
    reads_claims_ledger_metadata: Boolean(scansTargetRepository),
    plans_index_materialization: Boolean(scansTargetRepository),
    inlines_planned_index_payloads: Boolean(scansTargetRepository),
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

function targetGovernancePreview(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_target_governance_index_materialization_dry_run_gate';
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

function createTargetGovernanceService(deps = {}) {
  const releaseLine = deps.publicReleaseContract && deps.publicReleaseContract.release_line ? deps.publicReleaseContract.release_line : deps.releaseLine;
  return Object.freeze({
    targetGovernancePreview: (targetRoot) => targetGovernancePreview(targetRoot, { version: deps.version, releaseLine }),
    formatTargetGovernancePreviewText: targetGovernancePreviewText,
    targetGovernanceIndexMaterializationDryRun: (targetRoot) => targetGovernanceIndexMaterializationDryRun(targetRoot, { version: deps.version, releaseLine }),
    formatTargetGovernanceIndexMaterializationDryRunText: targetGovernanceIndexMaterializationDryRunText,
    buildTargetGovernanceWorkItemsIndex: buildWorkItemsIndex,
    buildTargetGovernanceClaimsIndex: buildClaimsIndex
  });
}

module.exports = {
  createTargetGovernanceService,
  targetGovernancePreview,
  targetGovernancePreviewText,
  targetGovernanceIndexMaterializationDryRun,
  targetGovernanceIndexMaterializationDryRunText,
  buildWorkItemsIndex,
  buildClaimsIndex
};
