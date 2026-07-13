#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REQUIRED_FILES = [
  '.agent-onboard/closed-gates.archive.jsonl',
  '.agent-onboard/closed-gates.index.json',
  '.agent-onboard/state/live/closed-gates.json',
  '.agent-onboard/state/events/closed-gates.jsonl',
  '.agent-onboard/state/closures/closed-gate-closures.jsonl',
  '.agent-onboard/state/indexes/closed-gates.index.json'
];

function niForBuffer(buffer) {
  return `ni:///sha-256;${crypto.createHash('sha256').update(buffer).digest('base64url')}`;
}

function fileId(relativePath) {
  return niForBuffer(fs.readFileSync(path.join(ROOT, relativePath)));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function main() {
  const errors = [];
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) errors.push(`missing required closed gate state file: ${file}`);
  }

  let legacyArchive = [];
  let legacyIndex = null;
  let live = null;
  let events = [];
  let closures = [];
  let index = null;
  try { legacyArchive = readJsonl('.agent-onboard/closed-gates.archive.jsonl'); } catch (error) { errors.push(`legacy closed-gates archive is not valid JSONL: ${error.message}`); }
  try { legacyIndex = readJson('.agent-onboard/closed-gates.index.json'); } catch (error) { errors.push(`legacy closed-gates index is not valid JSON: ${error.message}`); }
  try { live = readJson('.agent-onboard/state/live/closed-gates.json'); } catch (error) { errors.push(`live closed-gates state is not valid JSON: ${error.message}`); }
  try { events = readJsonl('.agent-onboard/state/events/closed-gates.jsonl'); } catch (error) { errors.push(`closed-gates event log is not valid JSONL: ${error.message}`); }
  try { closures = readJsonl('.agent-onboard/state/closures/closed-gate-closures.jsonl'); } catch (error) { errors.push(`closed-gates closure archive is not valid JSONL: ${error.message}`); }
  try { index = readJson('.agent-onboard/state/indexes/closed-gates.index.json'); } catch (error) { errors.push(`closed-gates derived index is not valid JSON: ${error.message}`); }

  const legacyCount = legacyArchive.length;
  const closureCount = closures.length;
  const legacyIndexCount = legacyIndex && legacyIndex.record_count;
  if (legacyIndex && legacyIndex.schema !== 'agent-onboard-public-closed-gates-index-001') errors.push('legacy closed-gates index schema changed unexpectedly');
  if (legacyCount === 0) errors.push('legacy closed-gates archive must not be empty');
  if (legacyIndex && legacyIndexCount !== legacyCount) errors.push(`legacy index record_count ${legacyIndexCount} does not match archive count ${legacyCount}`);
  if (closureCount !== legacyCount) errors.push(`state closure archive count ${closureCount} does not match legacy archive count ${legacyCount}`);
  if (live && live.record_count !== legacyCount) errors.push(`live record_count ${live.record_count} does not match legacy archive count ${legacyCount}`);
  if (index && index.record_count !== legacyCount) errors.push(`derived index record_count ${index.record_count} does not match legacy archive count ${legacyCount}`);
  if (index && legacyIndex && index.legacy_index_record_count !== legacyIndex.record_count) errors.push('derived index must preserve the legacy index record count');
  if (!events.some((event) => event.event_type === 'closed_gate_state_layout_migrated' && event.work_item_id === 'P1S3M6W17')) {
    errors.push('event log must contain closed_gate_state_layout_migrated for P1S3M6W17');
  }

  let legacyArchiveFileId = null;
  let stateClosureFileId = null;
  try { legacyArchiveFileId = fileId('.agent-onboard/closed-gates.archive.jsonl'); } catch {}
  try { stateClosureFileId = fileId('.agent-onboard/state/closures/closed-gate-closures.jsonl'); } catch {}
  if (live && legacyArchiveFileId && live.compatibility_archive_file_id !== legacyArchiveFileId) errors.push('live compatibility archive file id is stale');
  if (live && stateClosureFileId && live.closure_archive_file_id !== stateClosureFileId) errors.push('live closure archive file id is stale');

  const binaryPattern = /\.(sqlite|sqlite3|db|mdb|mdbx|lmdb)$/i;
  const stateRoot = path.join(ROOT, '.agent-onboard', 'state');
  const binaryStateFiles = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (binaryPattern.test(entry.name)) binaryStateFiles.push(path.relative(ROOT, absolute).split(path.sep).join('/'));
    }
  }
  walk(stateRoot);
  if (binaryStateFiles.length > 0) errors.push(`binary storage files are not admitted: ${binaryStateFiles.join(', ')}`);

  const payload = {
    schema: 'agent-onboard-closed-gate-state-layout-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    required_files: REQUIRED_FILES,
    legacy_archive_count: legacyCount,
    state_closure_count: closureCount,
    event_count: events.length,
    legacy_archive_file_id: legacyArchiveFileId,
    state_closure_file_id: stateClosureFileId,
    binary_state_files: binaryStateFiles,
    validated: {
      legacy_archive_retained: fs.existsSync(path.join(ROOT, '.agent-onboard/closed-gates.archive.jsonl')),
      legacy_index_retained: fs.existsSync(path.join(ROOT, '.agent-onboard/closed-gates.index.json')),
      counts_match: legacyCount > 0 && legacyCount === closureCount && (!legacyIndex || legacyIndex.record_count === legacyCount),
      no_binary_storage: binaryStateFiles.length === 0,
      content_inlined: false,
      raw_growth_loaded_by_default: false
    },
    boundary: {
      writes_files: false,
      mutates_git: false,
      network: false,
      publishes_package: false,
      deletes_legacy_archive: false,
      deletes_legacy_index: false,
      admits_sqlite_now: false,
      admits_lightning_memory_mapped_database_now: false,
      admits_mdbx_now: false
    },
    errors
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
