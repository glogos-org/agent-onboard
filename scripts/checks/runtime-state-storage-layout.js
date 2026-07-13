#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const requiredFiles = [
  '.agent-onboard/storage-backend-policy.json',
  '.agent-onboard/state/live/work-items.json',
  '.agent-onboard/state/events/work-items.jsonl',
  '.agent-onboard/state/closures/work-items-closures.jsonl',
  '.agent-onboard/state/indexes/work-items.index.json'
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readJsonl(relativePath) {
  const full = path.join(ROOT, relativePath);
  return fs.readFileSync(full, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else out.push(path.relative(ROOT, absolute).split(path.sep).join('/'));
  }
  return out;
}

function main() {
  const errors = [];
  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`missing required runtime state storage file: ${rel}`);
  }

  let policy = null;
  let legacy = null;
  let live = null;
  let events = [];
  let closures = [];
  let index = null;
  try { policy = readJson('.agent-onboard/storage-backend-policy.json'); } catch (error) { errors.push(`storage policy is not valid JSON: ${error.message}`); }
  try { legacy = readJson('.agent-onboard/work-items.json'); } catch (error) { errors.push(`legacy work-items ledger is not valid JSON: ${error.message}`); }
  try { live = readJson('.agent-onboard/state/live/work-items.json'); } catch (error) { errors.push(`live work-items state is not valid JSON: ${error.message}`); }
  try { events = readJsonl('.agent-onboard/state/events/work-items.jsonl'); } catch (error) { errors.push(`work-items event log is not valid JSONL: ${error.message}`); }
  try { closures = readJsonl('.agent-onboard/state/closures/work-items-closures.jsonl'); } catch (error) { errors.push(`work-items closure archive is not valid JSONL: ${error.message}`); }
  try { index = readJson('.agent-onboard/state/indexes/work-items.index.json'); } catch (error) { errors.push(`work-items derived index is not valid JSON: ${error.message}`); }

  if (policy) {
    const p = policy.policy || {};
    if (p.current_canonical_backend !== 'json_and_jsonl_text_first') errors.push('current storage backend must remain json_and_jsonl_text_first');
    if (p.sqlite_current_source_of_truth !== false) errors.push('SQLite must not be current source of truth in this gate');
    if (p.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('Lightning Memory-Mapped Database must not be current source of truth in this gate');
    if (p.mdbx_current_source_of_truth !== false) errors.push('MDBX must not be current source of truth in this gate');
    if (p.binary_storage_admitted_now !== false) errors.push('binary storage must not be admitted in this gate');
  }

  const legacyItems = legacy && Array.isArray(legacy.work_items) ? legacy.work_items : [];
  const liveItems = live && Array.isArray(live.items) ? live.items : [];
  const liveItemCount = live && Number.isInteger(live.item_count) ? live.item_count : liveItems.length;
  const liveProjectionMode = live && live.schema === 'agent-onboard-work-items-live-projection-002';
  if (liveProjectionMode && Array.isArray(live.items)) errors.push('W31 live projection must not inline full work item records');
  if (legacy && live && legacyItems.length !== liveItemCount) errors.push(`live item count ${liveItemCount} does not match legacy count ${legacyItems.length}`);
  if (index && live && index.item_count !== liveItemCount) errors.push('derived index item count must match live item count');
  if (events.length === 0) errors.push('event log must contain at least one event');
  if (!events.some((event) => event.event_type === 'work_items_parallel_storage_seeded')) errors.push('event log must contain work_items_parallel_storage_seeded');
  if (!closures.some((record) => record.work_item_id === 'P1S3M6W15')) errors.push('closure archive must contain the growth arrest closure record');

  const binaryPattern = /\.(sqlite|sqlite3|db|mdb|mdbx|lmdb)$/i;
  const binaryStateFiles = walk(path.join(ROOT, '.agent-onboard', 'state')).filter((rel) => binaryPattern.test(rel));
  if (binaryStateFiles.length > 0) errors.push(`binary storage files are not admitted: ${binaryStateFiles.join(', ')}`);

  const payload = {
    schema: 'agent-onboard-runtime-state-storage-layout-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    required_files: requiredFiles,
    legacy_item_count: legacyItems.length,
    live_item_count: liveItemCount,
    live_projection_mode: liveProjectionMode,
    event_count: events.length,
    closure_record_count: closures.length,
    binary_state_files: binaryStateFiles,
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
