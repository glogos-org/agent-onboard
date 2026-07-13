'use strict';

const context = require('./support/full-source-context.js');

const FULL_SOURCE_TESTS = [];

function fullSourceTest(name, fn) {
  FULL_SOURCE_TESTS.push({ name, fn });
}

function parseFullSourceTestSelection(argv) {
  const selection = { list: false, shardIndex: 0, shardTotal: 1, onlyIndex: null, excludeIndexes: new Set() };
  for (const arg of argv.slice(2)) {
    if (arg === '--list') selection.list = true;
    if (arg.startsWith('--only-index=')) {
      const value = Number.parseInt(arg.slice('--only-index='.length), 10);
      if (!Number.isInteger(value) || value < 0) throw new Error('expected --only-index=<non-negative integer>');
      selection.onlyIndex = value;
    }
    if (arg.startsWith('--exclude-index=')) {
      const value = Number.parseInt(arg.slice('--exclude-index='.length), 10);
      if (!Number.isInteger(value) || value < 0) throw new Error('expected --exclude-index=<non-negative integer>');
      selection.excludeIndexes.add(value);
    }
    if (arg.startsWith('--shard=')) {
      const match = /^--shard=(\d+)\/(\d+)$/.exec(arg);
      if (!match) throw new Error('expected --shard=<index>/<total>');
      selection.shardIndex = Number.parseInt(match[1], 10);
      selection.shardTotal = Number.parseInt(match[2], 10);
    }
  }
  if (!Number.isInteger(selection.shardIndex) || !Number.isInteger(selection.shardTotal) || selection.shardTotal < 1 || selection.shardIndex < 0 || selection.shardIndex >= selection.shardTotal) {
    throw new Error('invalid full source test shard selection');
  }
  return selection;
}

function selectedFullSourceTests(selection) {
  if (selection.onlyIndex !== null) {
    return FULL_SOURCE_TESTS
      .map((test, index) => Object.assign({ index }, test))
      .filter((test) => test.index === selection.onlyIndex && !selection.excludeIndexes.has(test.index));
  }
  return FULL_SOURCE_TESTS
    .map((test, index) => Object.assign({ index }, test))
    .filter((test) => indexMatchesSelection(test.index, selection));
}

function indexMatchesSelection(index, selection) {
  return index % selection.shardTotal === selection.shardIndex && !selection.excludeIndexes.has(index);
}

function runSelectedFullSourceTests() {
  const selection = parseFullSourceTestSelection(process.argv);
  if (selection.list) {
    process.stdout.write(JSON.stringify(FULL_SOURCE_TESTS.map((test, index) => ({ index, name: test.name })), null, 2) + '\n');
    return;
  }
  const tests = selectedFullSourceTests(selection);
  for (const test of tests) test.fn();
  const shardLabel = selection.onlyIndex !== null
    ? ` index ${selection.onlyIndex}`
    : (selection.shardTotal > 1 ? ` shard ${selection.shardIndex}/${selection.shardTotal}` : '');
  console.log(`agent-onboard full source tests passed${shardLabel} (${tests.length}/${FULL_SOURCE_TESTS.length})`);
  if (process.env.AGENT_ONBOARD_FULL_SOURCE_FORCE_EXIT !== '0') process.exit(0);
}

const FULL_SOURCE_SHARDS = [
  require('./full-source/shard-01.js'),
  require('./full-source/shard-02.js'),
  require('./full-source/shard-03.js'),
  require('./full-source/shard-04.js'),
  require('./full-source/shard-05.js'),
  require('./full-source/shard-06.js'),
  require('./full-source/shard-07.js'),
  require('./full-source/shard-08.js'),
  require('./full-source/shard-09.js'),
  require('./full-source/shard-10.js'),
];

for (const registerShard of FULL_SOURCE_SHARDS) registerShard(fullSourceTest, context);

runSelectedFullSourceTests();
