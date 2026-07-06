'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'agent-onboard';
const TARGET_WORK_ITEMS_SCHEMA = 'agent-onboard-public-target-work-items-preview-001';
const TARGET_WORK_ITEMS_COMMAND = 'agent-onboard target work-items --preview';
const TARGET_WORK_ITEMS_FAMILY = 'target work-items';
const RELATIVE_WORK_ITEMS_PATH = '.agent-onboard/work-items.json';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return { status: 'missing', value: null, error: null };
  try {
    return { status: 'ok', value: JSON.parse(fs.readFileSync(filePath, 'utf8')), error: null };
  } catch (error) {
    return { status: 'invalid_json', value: null, error: error && error.message ? error.message : String(error) };
  }
}

function itemList(document) {
  if (Array.isArray(document && document.work_items)) return document.work_items;
  if (Array.isArray(document && document.items)) return document.items;
  return [];
}

function admissionQueue(document) {
  if (Array.isArray(document && document.admission_queue)) return document.admission_queue;
  return [];
}

function safeString(value) {
  return typeof value === 'string' ? value : null;
}

function itemProjection(item) {
  if (!isPlainObject(item)) return null;
  return Object.freeze({
    id: safeString(item.id),
    title: safeString(item.title),
    status: safeString(item.status),
    milestone_id: safeString(item.milestone_id),
    domain: safeString(item.domain),
    queue_policy: safeString(item.queue_policy),
    has_closure: isPlainObject(item.closure),
    has_claim: isPlainObject(item.claim)
  });
}

function candidateProjection(candidate, existingIds, queueIndex) {
  const projected = itemProjection(candidate);
  if (!projected || !projected.id) return null;
  return Object.freeze({
    ...projected,
    queue_index: queueIndex,
    already_exists_in_work_items: existingIds.has(projected.id),
    explicit_candidate: true,
    would_be_written_by_this_command: false
  });
}

function countStatuses(items) {
  const counts = {};
  for (const item of items) {
    const status = safeString(item && item.status) || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0])));
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    const id = safeString(item && item.id);
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return Array.from(duplicates).sort();
}

function lastClosedItem(items) {
  const closed = items.filter((item) => item && item.status === 'closed');
  return itemProjection(closed[closed.length - 1] || null);
}

function firstOpenItem(items) {
  return itemProjection(items.find((item) => item && item.status === 'open') || null);
}

function nextQueuedCandidate(items, queue) {
  const existingIds = new Set(items.map((item) => safeString(item && item.id)).filter(Boolean));
  for (let index = 0; index < queue.length; index += 1) {
    const projected = candidateProjection(queue[index], existingIds, index);
    if (projected && !projected.already_exists_in_work_items) return projected;
  }
  return null;
}

function targetWorkItemsPreview(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_target_work_items_preview_product_gate';
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const base = {
    schema: TARGET_WORK_ITEMS_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_WORK_ITEMS_COMMAND,
    command_family: TARGET_WORK_ITEMS_FAMILY
  };

  if (!fs.existsSync(absoluteTargetRoot)) {
    return Object.assign(base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'missing' },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: { writes_files: false, writes_target_repository_state: false, scans_target_repository: false, git_mutation: false, network: false, publishes_package: false }
    });
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return Object.assign(base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'file' },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: { writes_files: false, writes_target_repository_state: false, scans_target_repository: false, git_mutation: false, network: false, publishes_package: false }
    });
  }

  const workItemsPath = path.join(absoluteTargetRoot, RELATIVE_WORK_ITEMS_PATH);
  const readResult = safeReadJson(workItemsPath);
  const target = { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'target-repo' };

  if (readResult.status === 'missing') {
    return Object.assign(base, {
      status: 'ok',
      target,
      work_items_file: { path: RELATIVE_WORK_ITEMS_PATH, present: false, parse_status: 'missing' },
      summary: {
        total_work_items: 0,
        status_counts: {},
        admission_queue_count: 0,
        open_work_item: null,
        last_closed_work_item: null,
        next_admission_candidate: null,
        next_action_state: 'no_target_work_items_file'
      },
      queue_preview: [],
      validation: {
        target_path_readable: true,
        target_is_directory: true,
        work_items_file_present: false,
        work_items_json_parseable: false,
        duplicate_ids: [],
        explicit_queue_candidate_available: false,
        synthesizes_next_id: false,
        no_writes_performed: true
      },
      recommended_next_commands: [
        'agent-onboard target doctor --text',
        'agent-onboard target inventory --text',
        'agent-onboard target onboarding --plan'
      ],
      writes_performed: false,
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        creates_agent_onboard_runtime_state: false,
        scans_target_repository: true,
        reads_target_work_items_metadata: true,
        inlines_file_contents: false,
        admits_or_closes_work_items: false,
        synthesizes_next_id: false,
        installs_dependencies: false,
        runs_managed_project_commands: false,
        publishes_package: false,
        git_mutation: false,
        network: false
      },
      errors: []
    });
  }

  if (readResult.status !== 'ok') {
    return Object.assign(base, {
      status: 'error',
      target,
      work_items_file: { path: RELATIVE_WORK_ITEMS_PATH, present: true, parse_status: readResult.status },
      errors: [`could not parse ${RELATIVE_WORK_ITEMS_PATH}: ${readResult.error}`],
      writes_performed: false,
      boundary: { writes_files: false, writes_target_repository_state: false, scans_target_repository: true, git_mutation: false, network: false, publishes_package: false }
    });
  }

  const document = isPlainObject(readResult.value) ? readResult.value : {};
  const items = itemList(document).filter(isPlainObject);
  const queue = admissionQueue(document).filter(isPlainObject);
  const duplicates = duplicateIds(items);
  const open = firstOpenItem(items);
  const lastClosed = lastClosedItem(items);
  const nextCandidate = nextQueuedCandidate(items, queue);
  const statusCounts = countStatuses(items);
  const queuePreview = queue.map((candidate, index) => candidateProjection(candidate, new Set(items.map((item) => safeString(item && item.id)).filter(Boolean)), index)).filter(Boolean).slice(0, 25);
  const nextActionState = open ? 'continue_open_work_item'
    : nextCandidate ? 'explicit_admission_candidate_available'
      : lastClosed ? 'no_open_or_queued_candidate'
        : 'no_closed_baseline_work_item';

  return Object.assign(base, {
    status: 'ok',
    target,
    work_items_file: {
      path: RELATIVE_WORK_ITEMS_PATH,
      present: true,
      parse_status: 'ok',
      schema: safeString(document.schema),
      item_array_field: Array.isArray(document.work_items) ? 'work_items' : (Array.isArray(document.items) ? 'items' : null),
      admission_queue_field: Array.isArray(document.admission_queue) ? 'admission_queue' : null
    },
    summary: {
      total_work_items: items.length,
      status_counts: statusCounts,
      admission_queue_count: queue.length,
      open_work_item: open,
      last_closed_work_item: lastClosed,
      next_admission_candidate: nextCandidate,
      next_action_state: nextActionState
    },
    queue_preview: queuePreview,
    validation: {
      target_path_readable: true,
      target_is_directory: true,
      work_items_file_present: true,
      work_items_json_parseable: true,
      known_item_array: Array.isArray(document.work_items) || Array.isArray(document.items),
      duplicate_ids: duplicates,
      explicit_queue_candidate_available: Boolean(nextCandidate),
      open_work_item_blocks_next_admission: Boolean(open),
      synthesizes_next_id: false,
      no_writes_performed: true
    },
    recommended_next_commands: [
      open ? 'continue the open target work item before admitting another one' : 'agent-onboard work-items --next --text',
      'agent-onboard target inventory --text',
      'agent-onboard target memory --text',
      'agent-onboard check --fast --text'
    ],
    writes_performed: false,
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_target_repository: true,
      reads_target_work_items_metadata: true,
      inlines_file_contents: false,
      admits_or_closes_work_items: false,
      synthesizes_next_id: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      git_mutation: false,
      network: false
    },
    errors: []
  });
}

function targetWorkItemsPreviewText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target work-items',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const counts = Object.entries(result.summary.status_counts || {}).map(([status, count]) => `${status}:${count}`).join(', ') || 'none';
  const open = result.summary.open_work_item ? `${result.summary.open_work_item.id} — ${result.summary.open_work_item.title || 'untitled'}` : 'none';
  const lastClosed = result.summary.last_closed_work_item ? `${result.summary.last_closed_work_item.id} — ${result.summary.last_closed_work_item.title || 'untitled'}` : 'none';
  const candidate = result.summary.next_admission_candidate ? `${result.summary.next_admission_candidate.id} — ${result.summary.next_admission_candidate.title || 'untitled'}` : 'none';
  return [
    'agent-onboard target work-items',
    `Target: ${result.target.name}`,
    `Root: ${result.target.root}`,
    `Work-items file: ${result.work_items_file.present ? result.work_items_file.path : 'missing'}`,
    `Total items: ${result.summary.total_work_items}`,
    `Status counts: ${counts}`,
    `Open item: ${open}`,
    `Last closed item: ${lastClosed}`,
    `Admission queue: ${result.summary.admission_queue_count}`,
    `Next queued candidate: ${candidate}`,
    `Next action state: ${result.summary.next_action_state}`,
    'Boundary: read-only preview; no work-item admission, no closure, no synthetic next id, no Git mutation, no network, no writes.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

function createTargetWorkItemsService(deps = {}) {
  const releaseLine = deps.publicReleaseContract && deps.publicReleaseContract.release_line ? deps.publicReleaseContract.release_line : deps.releaseLine;
  return Object.freeze({
    targetWorkItemsPreview: (targetRoot) => targetWorkItemsPreview(targetRoot, { version: deps.version, releaseLine }),
    formatTargetWorkItemsPreviewText: targetWorkItemsPreviewText,
    itemList,
    admissionQueue
  });
}

module.exports = {
  createTargetWorkItemsService,
  targetWorkItemsPreview,
  targetWorkItemsPreviewText,
  itemList,
  admissionQueue
};
