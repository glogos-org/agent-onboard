#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { CHECK_MODULES, checkIds, checkModulePath, normalizeCheckId } = require('./checks/registry');

function printUsage() {
  process.stderr.write('usage: node scripts/check.js <check-id> [args...]\n');
  process.stderr.write('       node scripts/check.js --list\n');
}

function main(argv = process.argv.slice(2)) {
  const [rawId, ...rest] = argv;
  if (!rawId || rawId === '--help' || rawId === '-h') {
    printUsage();
    process.exitCode = rawId ? 0 : 1;
    return;
  }
  if (rawId === '--list' || rawId === 'list') {
    process.stdout.write(`${JSON.stringify({
      schema: 'agent-onboard-check-registry-list-001',
      status: 'ok',
      checks: checkIds(),
      canonical_module_count: new Set(Object.values(CHECK_MODULES)).size
    }, null, 2)}\n`);
    return;
  }

  const id = normalizeCheckId(rawId);
  const modulePath = checkModulePath(id);
  if (!modulePath) {
    process.stderr.write(`unknown check id: ${rawId}\n`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = spawnSync(process.execPath, [modulePath, ...rest], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    windowsHide: true
  });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = typeof result.status === 'number' ? result.status : 1;
}

main();
