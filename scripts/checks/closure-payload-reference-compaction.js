#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = Object.freeze({
  compactArchive: '.agent-onboard/state/closures/work-items-closures.jsonl',
  manifest: '.agent-onboard/state/closures/work-items/manifest.json',
  index: '.agent-onboard/state/closures/work-items/index.json',
  legacyProjection: '.agent-onboard/work-items.json',
  derivedIndex: '.agent-onboard/state/indexes/work-items.index.json',
  storagePolicy: '.agent-onboard/storage-backend-policy.json'
});
const MAX_COMPACT_ARCHIVE_BYTES = 98304;
const MAX_PAYLOAD_SHARD_BYTES = 81920;

function abs(rel) { return path.join(ROOT, rel); }
function readJson(rel) { return JSON.parse(fs.readFileSync(abs(rel), 'utf8')); }
function readJsonl(rel) {
  return fs.readFileSync(abs(rel), 'utf8')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
function fileBytes(rel) { return fs.statSync(abs(rel)).size; }
function lineCount(rel) {
  const text = fs.readFileSync(abs(rel), 'utf8');
  return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}
function base64Url(buffer) { return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function fileId(rel) { return `ni:///sha-256;${base64Url(crypto.createHash('sha256').update(fs.readFileSync(abs(rel))).digest())}`; }
function stable(value) { return JSON.stringify(value, Object.keys(value || {}).sort()); }
function payloadKey(record) { return `${record.closure_id || ''}\u0000${record.work_item_id || ''}`; }

function main() {
  const errors = [];
  for (const rel of Object.values(FILES)) {
    if (!fs.existsSync(abs(rel))) errors.push(`missing required file: ${rel}`);
  }

  let compactArchive = [];
  let manifest = null;
  let index = null;
  let legacy = null;
  let derived = null;
  let storagePolicy = null;
  try { compactArchive = readJsonl(FILES.compactArchive); } catch (error) { errors.push(`${FILES.compactArchive} is invalid JSONL: ${error.message}`); }
  try { manifest = readJson(FILES.manifest); } catch (error) { errors.push(`${FILES.manifest} is invalid JSON: ${error.message}`); }
  try { index = readJson(FILES.index); } catch (error) { errors.push(`${FILES.index} is invalid JSON: ${error.message}`); }
  try { legacy = readJson(FILES.legacyProjection); } catch (error) { errors.push(`${FILES.legacyProjection} is invalid JSON: ${error.message}`); }
  try { derived = readJson(FILES.derivedIndex); } catch (error) { errors.push(`${FILES.derivedIndex} is invalid JSON: ${error.message}`); }
  try { storagePolicy = readJson(FILES.storagePolicy); } catch (error) { errors.push(`${FILES.storagePolicy} is invalid JSON: ${error.message}`); }

  if (manifest) {
    if (manifest.schema !== 'agent-onboard-work-item-closure-payload-reference-compaction-001') errors.push('closure payload manifest schema mismatch');
    if (manifest.work_item_id !== 'P1S3M6W32') errors.push('closure payload manifest work_item_id must be P1S3M6W32');
    if (manifest.authority_role !== 'compact_closure_archive_with_external_payload_shards') errors.push('closure payload manifest authority role mismatch');
    const policy = manifest.storage_backend_policy || {};
    if (policy.current_canonical_backend !== 'json_and_jsonl_text_first') errors.push('storage backend must remain JSON/JSONL text-first');
    if (policy.sqlite_current_source_of_truth !== false) errors.push('SQLite must not be current source of truth');
    if (policy.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('Lightning Memory-Mapped Database must not be current source of truth');
    if (policy.mdbx_current_source_of_truth !== false) errors.push('MDBX must not be current source of truth');
  }

  const payloadShardRecords = [];
  const manifestShards = manifest && Array.isArray(manifest.payload_shards) ? manifest.payload_shards : [];
  if (manifestShards.length === 0) errors.push('manifest must list payload_shards');
  for (const shard of manifestShards) {
    if (!shard || typeof shard.path !== 'string') {
      errors.push('payload shard entry missing path');
      continue;
    }
    if (!fs.existsSync(abs(shard.path))) {
      errors.push(`payload shard missing: ${shard.path}`);
      continue;
    }
    const bytes = fileBytes(shard.path);
    if (bytes > MAX_PAYLOAD_SHARD_BYTES) errors.push(`${shard.path}: payload shard has ${bytes} bytes; maximum is ${MAX_PAYLOAD_SHARD_BYTES}`);
    if (shard.file_id && shard.file_id !== fileId(shard.path)) errors.push(`${shard.path}: file_id is stale`);
    const rows = readJsonl(shard.path);
    if (Number.isInteger(shard.record_count) && shard.record_count !== rows.length) errors.push(`${shard.path}: record_count mismatch`);
    for (const record of rows) {
      if (!record || typeof record.closure_id !== 'string') errors.push(`${shard.path}: payload record missing closure_id`);
      payloadShardRecords.push(Object.assign({ __payload_path: shard.path }, record));
    }
  }

  const compactBytes = fs.existsSync(abs(FILES.compactArchive)) ? fileBytes(FILES.compactArchive) : 0;
  if (compactBytes > MAX_COMPACT_ARCHIVE_BYTES) errors.push(`compact closure archive has ${compactBytes} bytes; maximum is ${MAX_COMPACT_ARCHIVE_BYTES}`);

  const compactByRef = new Map();
  for (const record of compactArchive) {
    if (!record || typeof record.closure_id !== 'string') {
      errors.push('compact closure archive record missing closure_id');
      continue;
    }
    if (compactByRef.has(record.closure_id)) errors.push(`duplicate compact closure record: ${record.closure_id}`);
    compactByRef.set(record.closure_id, record);
    if (record.schema !== 'agent-onboard-work-item-closure-compact-reference-001') errors.push(`${record.closure_id}: compact record schema mismatch`);
    if (record.content_inlined_in_live_registry !== false) errors.push(`${record.closure_id}: content_inlined_in_live_registry must be false`);
    if (record.payload_inlined_in_compact_archive !== false) errors.push(`${record.closure_id}: payload_inlined_in_compact_archive must be false`);
    const refPath = typeof record.payload_ref === 'string' ? record.payload_ref : record.payload_ref && record.payload_ref.path;
    const refFileId = typeof record.payload_file_id === 'string' ? record.payload_file_id : record.payload_ref && record.payload_ref.file_id;
    if (typeof refPath !== 'string') errors.push(`${record.closure_id}: payload_ref missing`);
    if (typeof refFileId !== 'string' || !refFileId.startsWith('ni:///sha-256;')) errors.push(`${record.closure_id}: payload_file_id must be ni:///sha-256;...`);
    if (record.changed_files || record.checks_run || record.checks_not_run || record.known_non_pass) errors.push(`${record.closure_id}: compact archive must not inline closure payload arrays`);
  }

  const payloadByRef = new Map();
  for (const record of payloadShardRecords) {
    const key = record.closure_id;
    if (payloadByRef.has(key)) errors.push(`duplicate payload closure record: ${key}`);
    payloadByRef.set(key, record);
    if (record.payload_ref || record.payload_inlined_in_compact_archive) errors.push(`${key}: payload shard must contain payload, not a compact reference`);
  }

  for (const record of compactArchive) {
    const payload = payloadByRef.get(record.closure_id);
    if (!payload) {
      errors.push(`${record.closure_id}: payload record missing from shards`);
      continue;
    }
    if (record.work_item_id !== payload.work_item_id) errors.push(`${record.closure_id}: work_item_id mismatch between compact record and payload`);
    const refPath = typeof record.payload_ref === 'string' ? record.payload_ref : record.payload_ref && record.payload_ref.path;
    const refFileId = typeof record.payload_file_id === 'string' ? record.payload_file_id : record.payload_ref && record.payload_ref.file_id;
    if (refPath !== payload.__payload_path) errors.push(`${record.closure_id}: payload_ref does not point at containing shard`);
    if (refFileId !== fileId(payload.__payload_path)) errors.push(`${record.closure_id}: payload_file_id is stale`);
  }

  const compactPayloadKeys = compactArchive.map(payloadKey).sort();
  const fullPayloadKeys = payloadShardRecords.map(payloadKey).sort();
  if (stable(compactPayloadKeys) !== stable(fullPayloadKeys)) errors.push('compact archive and payload shard record sets differ');

  const legacyItems = legacy && Array.isArray(legacy.work_items) ? legacy.work_items : [];
  const closureRefs = legacyItems.map((item) => item && item.closure_ref).filter((value) => typeof value === 'string');
  for (const ref of closureRefs) {
    if (!compactByRef.has(ref)) errors.push(`legacy closure_ref is missing compact archive row: ${ref}`);
  }

  if (index) {
    if (index.schema !== 'agent-onboard-work-item-closure-payload-reference-index-001') errors.push('closure payload index schema mismatch');
    if (index.manifest !== FILES.manifest) errors.push('closure payload index must point to manifest');
    if (index.counts && index.counts.closures !== compactArchive.length) errors.push('closure payload index closure count mismatch');
  }
  if (derived) {
    if (derived.schema !== 'agent-onboard-work-items-derived-index-002') errors.push('derived index schema mismatch');
    if (derived.closure_payload_authority !== FILES.manifest) errors.push('derived index must point to closure payload authority manifest');
    if (derived.archived_closure_count !== compactArchive.length) errors.push('derived index archived_closure_count mismatch');
    if (derived.closure_payload_shard_count !== manifestShards.length) errors.push('derived index closure_payload_shard_count mismatch');
  }

  const storage = storagePolicy && storagePolicy.policy ? storagePolicy.policy : {};
  if (storage.current_canonical_backend !== 'json_and_jsonl_text_first') errors.push('storage policy must remain JSON/JSONL text-first');
  if (storage.sqlite_current_source_of_truth !== false) errors.push('storage policy must keep SQLite non-authoritative');
  if (storage.lightning_memory_mapped_database_current_source_of_truth !== false) errors.push('storage policy must keep Lightning Memory-Mapped Database non-authoritative');
  if (storage.mdbx_current_source_of_truth !== false) errors.push('storage policy must keep MDBX non-authoritative');

  const result = {
    schema: 'agent-onboard-work-item-closure-payload-reference-compaction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: 'agent-onboard',
    work_item_id: 'P1S3M6W32',
    compact_archive: {
      path: FILES.compactArchive,
      records: compactArchive.length,
      lines: fs.existsSync(abs(FILES.compactArchive)) ? lineCount(FILES.compactArchive) : 0,
      bytes: compactBytes,
      max_bytes: MAX_COMPACT_ARCHIVE_BYTES,
      file_id: fs.existsSync(abs(FILES.compactArchive)) ? fileId(FILES.compactArchive) : null,
      payload_arrays_inlined: false
    },
    payload_authority_manifest: FILES.manifest,
    payload_shards: manifestShards.map((shard) => ({
      path: shard.path,
      record_count: shard.record_count,
      bytes: fs.existsSync(abs(shard.path)) ? fileBytes(shard.path) : 0,
      file_id: fs.existsSync(abs(shard.path)) ? fileId(shard.path) : null
    })),
    counts: {
      compact_records: compactArchive.length,
      payload_records: payloadShardRecords.length,
      legacy_closure_refs: closureRefs.length,
      payload_shards: manifestShards.length,
      failures: errors.length
    },
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
      compact_archive_inlines_payload_arrays: false
    }
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
