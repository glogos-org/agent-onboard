#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AGGREGATOR = 'test/agent-onboard.test.js';
const CONTEXT = 'test/support/full-source-context.js';
const SHARD_DIR = 'test/full-source';
const EXPECTED_SHARD_COUNT = 10;
const MIN_FULL_SOURCE_TEST_COUNT = 166;
const MAX_AGGREGATOR_LINES = 120;
const MAX_CONTEXT_LINES = 250;
const MAX_SHARD_LINES = 800;
const MAX_SHARD_BYTES = 131072;

function abs(rel) {
  return path.join(ROOT, rel);
}

function read(rel) {
  return fs.readFileSync(abs(rel), 'utf8');
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function metric(rel) {
  const text = read(rel);
  return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size };
}

function pushIf(condition, failures, message) {
  if (condition) failures.push(message);
}

function listShardFiles() {
  if (!fs.existsSync(abs(SHARD_DIR))) return [];
  return fs.readdirSync(abs(SHARD_DIR))
    .filter((entry) => /^shard-\d{2}\.js$/u.test(entry))
    .map((entry) => `${SHARD_DIR}/${entry}`)
    .sort();
}

function parseTestList() {
  const result = spawnSync(process.execPath, [abs(AGGREGATOR), '--list'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 50 * 1024 * 1024
  });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || (result.error && result.error.message) || `exit ${result.status}`, tests: [] };
  }
  try {
    const tests = JSON.parse(result.stdout);
    return { ok: Array.isArray(tests), error: Array.isArray(tests) ? null : 'test list is not an array', tests: Array.isArray(tests) ? tests : [] };
  } catch (error) {
    return { ok: false, error: error.message, tests: [] };
  }
}

function main() {
  const failures = [];
  const pkg = JSON.parse(read('package.json'));
  const aggregatorText = read(AGGREGATOR);
  const contextText = read(CONTEXT);
  const shardFiles = listShardFiles();
  const aggregatorMetric = metric(AGGREGATOR);
  const contextMetric = metric(CONTEXT);
  const shardMetrics = shardFiles.map(metric);

  pushIf(aggregatorMetric.lines > MAX_AGGREGATOR_LINES, failures, `${AGGREGATOR} has ${aggregatorMetric.lines} lines; maximum is ${MAX_AGGREGATOR_LINES}`);
  pushIf(contextMetric.lines > MAX_CONTEXT_LINES, failures, `${CONTEXT} has ${contextMetric.lines} lines; maximum is ${MAX_CONTEXT_LINES}`);
  pushIf(shardFiles.length !== EXPECTED_SHARD_COUNT, failures, `${SHARD_DIR} must contain ${EXPECTED_SHARD_COUNT} shard files; found ${shardFiles.length}`);
  pushIf(!aggregatorText.includes('FULL_SOURCE_SHARDS'), failures, `${AGGREGATOR} must register FULL_SOURCE_SHARDS`);
  pushIf(aggregatorText.includes("fullSourceTest('public runtime contracts module centralizes"), failures, `${AGGREGATOR} must not retain full source test bodies`);
  pushIf(!contextText.includes("const EXPECTED_PACK_FILES = Array.from(new Set(PACKAGE_JSON.files.concat(['package.json'])));"), failures, `${CONTEXT} must derive expected pack files from package.json#files`);

  for (const shard of shardMetrics) {
    pushIf(shard.lines > MAX_SHARD_LINES, failures, `${shard.path} has ${shard.lines} lines; maximum is ${MAX_SHARD_LINES}`);
    pushIf(shard.bytes > MAX_SHARD_BYTES, failures, `${shard.path} has ${shard.bytes} bytes; maximum is ${MAX_SHARD_BYTES}`);
    const text = read(shard.path);
    pushIf(!text.includes('module.exports = function registerFullSourceShard'), failures, `${shard.path} must export registerFullSourceShard`);
    pushIf(!/^\s*fullSourceTest\(/mu.test(text), failures, `${shard.path} must register at least one fullSourceTest`);
  }

  const listed = parseTestList();
  pushIf(!listed.ok, failures, `full source test list failed: ${listed.error}`);
  pushIf(listed.tests.length < MIN_FULL_SOURCE_TEST_COUNT, failures, `full source test list has ${listed.tests.length}; expected at least ${MIN_FULL_SOURCE_TEST_COUNT}`);
  const names = new Set(listed.tests.map((test) => test.name));
  pushIf(names.size !== listed.tests.length, failures, 'full source test list contains duplicate names');
  pushIf(!names.has('public runtime contracts module centralizes command and package constants'), failures, 'full source test list lost runtime contracts test');
  pushIf(!names.has('work item ledger compaction checker validates closure archive references'), failures, 'full source test list lost ledger compaction checker test');

  const sourceSizeBudget = JSON.parse(read('.agent-onboard/source-size-budget-ratchet.json'));
  const tracked = sourceSizeBudget.tracked_files && sourceSizeBudget.tracked_files[AGGREGATOR];
  pushIf(!tracked, failures, `.agent-onboard/source-size-budget-ratchet.json must track ${AGGREGATOR}`);
  if (tracked) {
    pushIf(tracked.max_lines !== aggregatorMetric.lines, failures, `${AGGREGATOR} ratchet max_lines must equal current aggregator line count ${aggregatorMetric.lines}`);
    pushIf(tracked.max_bytes !== aggregatorMetric.bytes, failures, `${AGGREGATOR} ratchet max_bytes must equal current aggregator byte count ${aggregatorMetric.bytes}`);
    pushIf(!Array.isArray(tracked.ratchet_history) || !tracked.ratchet_history.some((entry) => entry.work_item_id === 'P1S3M6W30'), failures, `${AGGREGATOR} ratchet history must record P1S3M6W30`);
  }

  const joined = [aggregatorText, contextText, ...shardFiles.map(read)].join('\n').toLowerCase();
  for (const forbidden of ['sqlite', 'lmdb', 'mdbx', 'better-sqlite3']) {
    pushIf(joined.includes(`require('${forbidden}')`) || joined.includes(`from '${forbidden}'`), failures, `test suite sharding must not import ${forbidden}`);
  }

  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-test-suite-sharding-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M6W30',
    aggregator: aggregatorMetric,
    context: contextMetric,
    shard_count: shardFiles.length,
    shard_metrics: shardMetrics,
    full_source_test_count: listed.tests.length,
    boundary: {
      writes_files: false,
      package_publish: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false,
      network: false
    },
    failures
  }, null, 2)}\n`);
  if (status !== 'ok') process.exitCode = 1;
}

main();
