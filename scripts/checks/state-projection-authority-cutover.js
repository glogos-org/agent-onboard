#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = Object.freeze({
  manifest: '.agent-onboard/state/authority/work-items/manifest.json',
  vocabulary: '.agent-onboard/state/authority/work-items/vocabulary.json',
  programs: '.agent-onboard/state/authority/work-items/programs.json',
  stages: '.agent-onboard/state/authority/work-items/stages.json',
  milestones: '.agent-onboard/state/authority/work-items/milestones.json',
  itemIndex: '.agent-onboard/state/authority/work-items/items/index.json',
  legacyProjection: '.agent-onboard/work-items.json',
  legacyProjectionSidecar: '.agent-onboard/work-items.projection.json',
  liveProjection: '.agent-onboard/state/live/work-items.json',
  derivedIndex: '.agent-onboard/state/indexes/work-items.index.json',
  closureArchive: '.agent-onboard/state/closures/work-items-closures.jsonl',
  storagePolicy: '.agent-onboard/storage-backend-policy.json'
});

function abs(rel) { return path.join(ROOT, rel); }
function readText(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(readText(rel)); }
function readJsonl(rel) {
  return readText(rel).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}
function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function fileMetric(rel) { const text = readText(rel); return { path: rel, lines: lineCount(text), bytes: Buffer.byteLength(text), sha256: sha256(text) }; }
function stable(value) { return JSON.stringify(value); }
function normalizeItems(items) { return Array.isArray(items) ? items.slice().sort((a, b) => String(a.id).localeCompare(String(b.id))) : []; }
function ids(items) { return normalizeItems(items).map((item) => item.id); }
function countByStatus(items) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { open: 0, claimed: 0, closed: 0 });
}

function main() {
  const errors = [];
  const required = Object.values(FILES);
  for (const rel of required) {
    if (!fs.existsSync(abs(rel))) errors.push(`missing required file: ${rel}`);
  }

  let manifest = null;
  let itemIndex = null;
  let legacy = null;
  let live = null;
  let derived = null;
  let sidecar = null;
  let storagePolicy = null;
  let closures = [];
  try { manifest = readJson(FILES.manifest); } catch (error) { errors.push(`${FILES.manifest} is invalid JSON: ${error.message}`); }
  try { itemIndex = readJson(FILES.itemIndex); } catch (error) { errors.push(`${FILES.itemIndex} is invalid JSON: ${error.message}`); }
  try { legacy = readJson(FILES.legacyProjection); } catch (error) { errors.push(`${FILES.legacyProjection} is invalid JSON: ${error.message}`); }
  try { live = readJson(FILES.liveProjection); } catch (error) { errors.push(`${FILES.liveProjection} is invalid JSON: ${error.message}`); }
  try { derived = readJson(FILES.derivedIndex); } catch (error) { errors.push(`${FILES.derivedIndex} is invalid JSON: ${error.message}`); }
  try { sidecar = readJson(FILES.legacyProjectionSidecar); } catch (error) { errors.push(`${FILES.legacyProjectionSidecar} is invalid JSON: ${error.message}`); }
  try { storagePolicy = readJson(FILES.storagePolicy); } catch (error) { errors.push(`${FILES.storagePolicy} is invalid JSON: ${error.message}`); }
  try { closures = readJsonl(FILES.closureArchive); } catch (error) { errors.push(`${FILES.closureArchive} is invalid JSONL: ${error.message}`); }

  const shardMetrics = [];
  const rebuilt = {
    schema: legacy && legacy.schema,
    package_name: legacy && legacy.package_name,
    vocabulary: null,
    programs: [],
    stages: [],
    milestones: [],
    work_items: []
  };

  try { rebuilt.vocabulary = readJson(FILES.vocabulary).items; shardMetrics.push(fileMetric(FILES.vocabulary)); } catch (error) { errors.push(`cannot read vocabulary shard: ${error.message}`); }
  for (const [key, rel] of Object.entries({ programs: FILES.programs, stages: FILES.stages, milestones: FILES.milestones })) {
    try {
      rebuilt[key] = readJson(rel).items;
      shardMetrics.push(fileMetric(rel));
    } catch (error) {
      errors.push(`cannot read ${key} shard: ${error.message}`);
    }
  }

  const itemShardRecords = itemIndex && Array.isArray(itemIndex.item_shards) ? itemIndex.item_shards : [];
  if (itemShardRecords.length === 0) errors.push('item index must contain item_shards');
  const seenMilestones = new Set();
  for (const record of itemShardRecords) {
    if (!record || typeof record.path !== 'string') {
      errors.push('item shard record missing path');
      continue;
    }
    if (seenMilestones.has(record.milestone_id)) errors.push(`duplicate item shard milestone: ${record.milestone_id}`);
    seenMilestones.add(record.milestone_id);
    let shard = null;
    try {
      shard = readJson(record.path);
      shardMetrics.push(fileMetric(record.path));
    } catch (error) {
      errors.push(`cannot read item shard ${record.path}: ${error.message}`);
      continue;
    }
    if (shard.milestone_id !== record.milestone_id) errors.push(`${record.path}: milestone_id mismatch`);
    if (!Array.isArray(shard.items)) errors.push(`${record.path}: items must be an array`);
    else rebuilt.work_items.push(...shard.items);
    if (Array.isArray(shard.items) && shard.items.length !== record.item_count) errors.push(`${record.path}: item_count mismatch`);
    const metric = fileMetric(record.path);
    if (record.file_id && manifest && !manifest.shards.some((entry) => entry.path === record.path && entry.file_id === record.file_id)) {
      errors.push(`${record.path}: item index file_id is absent from manifest shards`);
    }
    if (metric.lines > 700) errors.push(`${record.path}: item shard exceeds 700-line budget`);
  }

  if (manifest) {
    if (manifest.schema !== 'agent-onboard-work-items-state-projection-authority-cutover-001') errors.push('manifest schema mismatch');
    if (manifest.work_item_id !== 'P1S3M6W31') errors.push('manifest work_item_id must be P1S3M6W31');
    if (manifest.authority_role !== 'canonical_sharded_work_items_authority') errors.push('manifest must mark canonical sharded authority role');
    const policy = manifest.projection_policy || {};
    if (policy.legacy_root_projection_remains_for_target_compatibility !== true) errors.push('legacy root projection compatibility policy must be true');
    if (policy.live_projection_is_rebuildable_from_shards !== true) errors.push('live projection must be rebuildable from shards');
    if (policy.sqlite_current_source_of_truth !== false) errors.push('SQLite must not be current source of truth');
    if (policy.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('Lightning Memory-Mapped Database must not be current source of truth');
    if (policy.mdbx_current_source_of_truth !== false) errors.push('MDBX must not be current source of truth');
  }

  if (live) {
    if (live.schema !== 'agent-onboard-work-items-live-projection-002') errors.push('live work-items projection schema mismatch');
    if (Array.isArray(live.items)) errors.push('live projection must not inline full work item records after W31');
    if (live.source !== FILES.manifest) errors.push('live projection source must point to sharded authority manifest');
  }
  if (sidecar && sidecar.canonical_authority !== FILES.manifest) errors.push('legacy projection sidecar must point to sharded authority manifest');

  const legacyItems = legacy && Array.isArray(legacy.work_items) ? legacy.work_items : [];
  const rebuiltItems = normalizeItems(rebuilt.work_items);
  const legacySorted = normalizeItems(legacyItems);
  if (stable(rebuilt.vocabulary) !== stable(legacy && legacy.vocabulary)) errors.push('rebuilt vocabulary must match legacy projection');
  for (const key of ['programs', 'stages', 'milestones']) {
    if (stable(rebuilt[key]) !== stable(legacy && legacy[key])) errors.push(`rebuilt ${key} must match legacy projection`);
  }
  if (stable(rebuiltItems) !== stable(legacySorted)) errors.push('rebuilt work items from shards must match legacy root projection');

  const statusCounts = countByStatus(legacyItems);
  if (itemIndex) {
    if (itemIndex.counts && itemIndex.counts.work_items !== legacyItems.length) errors.push('item index work item count mismatch');
    for (const [status, count] of Object.entries(statusCounts)) {
      if (itemIndex.counts && itemIndex.counts[status] !== count) errors.push(`item index ${status} count mismatch`);
      const indexedIds = itemIndex.by_status && Array.isArray(itemIndex.by_status[status]) ? itemIndex.by_status[status].slice().sort() : [];
      const actualIds = legacyItems.filter((item) => item.status === status).map((item) => item.id).sort();
      if (stable(indexedIds) !== stable(actualIds)) errors.push(`item index by_status.${status} mismatch`);
    }
  }
  if (derived) {
    if (derived.schema !== 'agent-onboard-work-items-derived-index-002') errors.push('derived index schema mismatch');
    if (derived.source !== FILES.manifest) errors.push('derived index source must be sharded authority manifest');
    if (derived.item_count !== legacyItems.length) errors.push('derived index item_count mismatch');
    if (derived.archived_closure_count !== closures.length) errors.push('derived index archived_closure_count mismatch');
  }

  const storage = storagePolicy && storagePolicy.policy ? storagePolicy.policy : {};
  if (storage.current_canonical_backend !== 'json_and_jsonl_text_first') errors.push('storage backend must remain JSON/JSONL text-first');
  if (storage.sqlite_current_source_of_truth !== false) errors.push('storage policy must keep SQLite non-authoritative');
  if (storage.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('storage policy must keep Lightning Memory-Mapped Database non-authoritative');
  if (storage.mdbx_current_source_of_truth !== false) errors.push('storage policy must keep MDBX non-authoritative');

  const liveMetric = fs.existsSync(abs(FILES.liveProjection)) ? fileMetric(FILES.liveProjection) : null;
  if (liveMetric && liveMetric.lines >= 500) errors.push('live work-items projection must stay below 500 lines after W31');
  const oversizedShards = shardMetrics.filter((metric) => metric.lines > 700 || metric.bytes > 131072);
  for (const metric of oversizedShards) errors.push(`${metric.path}: shard budget exceeded`);

  const result = {
    schema: 'agent-onboard-state-projection-authority-cutover-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: 'agent-onboard',
    work_item_id: 'P1S3M6W31',
    authority_manifest: FILES.manifest,
    legacy_root_projection: FILES.legacyProjection,
    live_projection: FILES.liveProjection,
    counts: {
      work_items: legacyItems.length,
      open: statusCounts.open || 0,
      claimed: statusCounts.claimed || 0,
      closed: statusCounts.closed || 0,
      closure_archive_records: closures.length,
      item_shards: itemShardRecords.length
    },
    live_projection_metric: liveMetric,
    largest_shards: shardMetrics.slice().sort((a, b) => (b.lines - a.lines) || (b.bytes - a.bytes)).slice(0, 8),
    errors,
    boundary: {
      writes_files: false,
      mutates_git: false,
      network: false,
      publishes_package: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lightning_memory_mapped_database_introduced: false,
      mdbx_introduced: false,
      legacy_root_projection_retained_for_compatibility: true,
      live_projection_inlines_full_records: false
    }
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
