#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = Object.freeze({
  ledger: '.agent-onboard/work-items.json',
  live: '.agent-onboard/state/live/work-items.json',
  events: '.agent-onboard/state/events/work-items.jsonl',
  closures: '.agent-onboard/state/closures/work-items-closures.jsonl',
  index: '.agent-onboard/state/indexes/work-items.index.json',
  gate: '.agent-onboard/work-item-ledger-compaction-migration.json'
});

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function hasInlineClosure(item) {
  return Object.prototype.hasOwnProperty.call(item, 'closure');
}

function main() {
  const errors = [];
  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(path.join(ROOT, file))) errors.push(`missing required file: ${file}`);
  }

  let ledger = null;
  let live = null;
  let events = [];
  let closures = [];
  let index = null;
  let gate = null;

  try { ledger = readJson(FILES.ledger); } catch (error) { errors.push(`${FILES.ledger} is not valid JSON: ${error.message}`); }
  try { live = readJson(FILES.live); } catch (error) { errors.push(`${FILES.live} is not valid JSON: ${error.message}`); }
  try { events = readJsonl(FILES.events); } catch (error) { errors.push(`${FILES.events} is not valid JSONL: ${error.message}`); }
  try { closures = readJsonl(FILES.closures); } catch (error) { errors.push(`${FILES.closures} is not valid JSONL: ${error.message}`); }
  try { index = readJson(FILES.index); } catch (error) { errors.push(`${FILES.index} is not valid JSON: ${error.message}`); }
  try { gate = readJson(FILES.gate); } catch (error) { errors.push(`${FILES.gate} is not valid JSON: ${error.message}`); }

  const items = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const liveItems = live && Array.isArray(live.items) ? live.items : [];
  const liveItemCount = live && Number.isInteger(live.item_count) ? live.item_count : liveItems.length;
  const liveProjectionMode = live && live.schema === 'agent-onboard-work-items-live-projection-002';
  const closureByRef = new Map();
  for (const record of closures) {
    if (!record || typeof record.closure_id !== 'string') {
      errors.push('closure archive record missing closure_id');
      continue;
    }
    if (closureByRef.has(record.closure_id)) errors.push(`duplicate closure_id in archive: ${record.closure_id}`);
    closureByRef.set(record.closure_id, record);
    if (record.content_inlined_in_live_registry !== false) errors.push(`${record.closure_id}: content_inlined_in_live_registry must be false`);
  }

  const inlineClosureItems = items.filter(hasInlineClosure);
  if (inlineClosureItems.length > 0) errors.push(`compatibility ledger must not inline closure payloads after W16: ${inlineClosureItems.map((item) => item.id).join(', ')}`);
  if (liveItems.some(hasInlineClosure)) errors.push('live work-items snapshot must not inline closure payloads');
  if (liveProjectionMode && Array.isArray(live.items)) errors.push('W31 live projection must not inline full work item records');
  if (ledger && live && items.length !== liveItemCount) errors.push(`ledger item count ${items.length} does not match live item count ${liveItemCount}`);

  const closedWithRefs = items.filter((item) => item.status === 'closed' && item.closure_ref);
  for (const item of closedWithRefs) {
    if (item.closure_ref !== `closures:${item.id}`) errors.push(`${item.id}: closure_ref must be closures:${item.id}`);
    if (!closureByRef.has(item.closure_ref)) errors.push(`${item.id}: closure_ref ${item.closure_ref} is missing from archive`);
  }

  if (index) {
    if (index.item_count !== items.length) errors.push('state index item_count must match compact ledger count');
    if (index.inline_closure_count !== 0) errors.push('state index inline_closure_count must be 0');
    if (index.archived_closure_count !== closures.length) errors.push('state index archived_closure_count must match closure archive rows');
  }

  if (gate) {
    if (gate.work_item_id !== 'P1S3M6W16') errors.push('gate artifact must identify P1S3M6W16');
    if (gate.migration && gate.migration.inline_closure_count_after !== 0) errors.push('gate migration inline_closure_count_after must be 0');
    if (gate.storage_backend_policy) {
      if (gate.storage_backend_policy.sqlite_current_source_of_truth !== false) errors.push('SQLite must not be current source of truth');
      if (gate.storage_backend_policy.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('Lightning Memory-Mapped Database must not be current source of truth');
      if (gate.storage_backend_policy.mdbx_current_source_of_truth !== false) errors.push('MDBX must not be current source of truth');
    }
  }

  if (!events.some((event) => event.event_type === 'work_items_ledger_compacted' && event.work_item_id === 'P1S3M6W16')) {
    errors.push('event log must contain work_items_ledger_compacted for P1S3M6W16');
  }
  if (!closures.some((record) => record.work_item_id === 'P1S3M6W16')) {
    errors.push('closure archive must contain P1S3M6W16 closure record');
  }

  const payload = {
    schema: 'agent-onboard-work-item-ledger-compaction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    ledger_path: FILES.ledger,
    live_snapshot_path: FILES.live,
    live_projection_mode: liveProjectionMode,
    closure_archive_path: FILES.closures,
    item_count: items.length,
    archived_closure_count: closures.length,
    inline_closure_count: inlineClosureItems.length,
    closure_ref_count: items.filter((item) => item.closure_ref).length,
    errors,
    boundary: {
      writes_files: false,
      mutates_git: false,
      network: false,
      publishes_package: false,
      admits_sqlite_now: false,
      admits_lightning_memory_mapped_database_now: false,
      admits_mdbx_now: false
    }
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
