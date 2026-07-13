#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATIC_CATALOG = 'cli/agent_onboard/domains/architecture/static-catalog.js';
const SHARD_DIR = 'cli/agent_onboard/domains/architecture/catalog-shards';
const SHARDS = Object.freeze([
  'public-architecture-map-catalog.js',
  'public-architecture-boundary-catalog.js',
  'public-source-kernel-catalog.js',
  'public-source-authority-catalog.js',
  'public-work-items-source-catalog.js',
  'public-claims-source-catalog.js',
  'public-release-contract-catalog.js',
  'public-release-fixture-catalog.js'
]);
const EXPECTED_CATALOG_KEYS = Object.freeze([
  'PUBLIC_ARCHITECTURE_MAP',
  'PUBLIC_COMMAND_ROUTER',
  'PUBLIC_DOMAIN_SERVICE_FACADES',
  'PUBLIC_AUTHORITY_FIRST_READ_INDEX',
  'PUBLIC_TARGET_RUNTIME_NAMESPACE',
  'PUBLIC_PACKAGE_SURFACE_PRESERVATION',
  'PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE',
  'PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN',
  'PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL',
  'PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY',
  'PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE',
  'PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED',
  'PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN',
  'PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE',
  'PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY',
  'PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE',
  'PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE',
  'PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN',
  'PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE',
  'PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY',
  'PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE',
  'PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE',
  'PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW',
  'PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING',
  'PUBLIC_THIN_CLI_ROUTER_SEED',
  'PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED',
  'PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION',
  'PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION',
  'PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION',
  'PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION',
  'PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN',
  'PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION',
  'PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL',
  'PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION',
  'PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION',
  'PUBLIC_VERSION_REFERENCE_POLICY',
  'PUBLIC_RELEASE_CONTRACT',
  'PUBLIC_RELEASE_FIXTURE_MATRIX'
]);
const MAX_STATIC_CATALOG_LINES = 120;
const MAX_STATIC_CATALOG_BYTES = 16384;
const MAX_SHARD_LINES = 500;
const MAX_SHARD_BYTES = 65536;

function rel(...parts) {
  return path.join(...parts).split(path.sep).join('/');
}

function abs(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(abs(relativePath), 'utf8');
}

function lineCount(text) {
  return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function metric(relativePath) {
  const text = read(relativePath);
  return { path: relativePath, lines: lineCount(text), bytes: fs.statSync(abs(relativePath)).size };
}

function pushIf(condition, failures, message) {
  if (condition) failures.push(message);
}

function main() {
  const failures = [];
  const pkg = JSON.parse(read('package.json'));
  const packageFiles = new Set(Array.isArray(pkg.files) ? pkg.files : []);
  const staticText = read(STATIC_CATALOG);
  const staticMetric = metric(STATIC_CATALOG);

  pushIf(staticMetric.lines > MAX_STATIC_CATALOG_LINES, failures, `${STATIC_CATALOG} has ${staticMetric.lines} lines; maximum is ${MAX_STATIC_CATALOG_LINES}`);
  pushIf(staticMetric.bytes > MAX_STATIC_CATALOG_BYTES, failures, `${STATIC_CATALOG} has ${staticMetric.bytes} bytes; maximum is ${MAX_STATIC_CATALOG_BYTES}`);
  for (const forbidden of [
    'const PUBLIC_ARCHITECTURE_MAP = Object.freeze({',
    'const PUBLIC_RELEASE_CONTRACT = Object.freeze({',
    'const PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN = Object.freeze({'
  ]) {
    pushIf(staticText.includes(forbidden), failures, `${STATIC_CATALOG} must not retain catalog payload ${forbidden}`);
  }

  const shardMetrics = SHARDS.map((name) => {
    const relativePath = rel(SHARD_DIR, name);
    const present = fs.existsSync(abs(relativePath));
    pushIf(!present, failures, `${relativePath} is missing`);
    pushIf(!packageFiles.has(relativePath), failures, `package.json#files must include ${relativePath}`);
    if (!present) return { path: relativePath, present: false, lines: 0, bytes: 0 };
    const m = metric(relativePath);
    pushIf(m.lines > MAX_SHARD_LINES, failures, `${relativePath} has ${m.lines} lines; maximum is ${MAX_SHARD_LINES}`);
    pushIf(m.bytes > MAX_SHARD_BYTES, failures, `${relativePath} has ${m.bytes} bytes; maximum is ${MAX_SHARD_BYTES}`);
    pushIf(!read(relativePath).includes('module.exports = Object.freeze'), failures, `${relativePath} must expose a frozen module export`);
    return { ...m, present: true };
  });

  for (const name of SHARDS) {
    const requireToken = `./catalog-shards/${name.replace(/\.js$/u, '')}`;
    pushIf(!staticText.includes(requireToken), failures, `${STATIC_CATALOG} must require ${requireToken}`);
  }

  const { createPublicArchitectureCatalog } = require(abs(STATIC_CATALOG));
  const catalog = createPublicArchitectureCatalog({
    releaseLine: 'public_architecture_catalog_sharding_gate_check',
    publicPackagedRouterPortPackFiles: pkg.files,
    publicPackagedRouterPortModuleFiles: pkg.files.filter((file) => file.endsWith('.js'))
  });
  for (const key of EXPECTED_CATALOG_KEYS) {
    pushIf(!Object.prototype.hasOwnProperty.call(catalog, key), failures, `catalog export missing ${key}`);
  }
  pushIf(catalog.PUBLIC_ARCHITECTURE_MAP && catalog.PUBLIC_ARCHITECTURE_MAP.schema !== 'agent-onboard-public-architecture-map-001', failures, 'architecture map schema changed unexpectedly');
  pushIf(catalog.PUBLIC_RELEASE_CONTRACT && catalog.PUBLIC_RELEASE_CONTRACT.schema !== 'agent-onboard-public-release-contract-039', failures, 'release contract schema changed unexpectedly');
  pushIf(catalog.PUBLIC_RELEASE_FIXTURE_MATRIX && catalog.PUBLIC_RELEASE_FIXTURE_MATRIX.contract_schema !== 'agent-onboard-public-release-contract-039', failures, 'release fixture matrix no longer binds to release contract schema');

  const sourceSizeBudget = JSON.parse(read('.agent-onboard/source-size-budget-ratchet.json'));
  const staticBudget = sourceSizeBudget.tracked_files && sourceSizeBudget.tracked_files[STATIC_CATALOG];
  pushIf(!staticBudget, failures, `.agent-onboard/source-size-budget-ratchet.json must track ${STATIC_CATALOG}`);
  if (staticBudget) {
    pushIf(staticBudget.max_lines > MAX_STATIC_CATALOG_LINES, failures, `${STATIC_CATALOG} ratchet max_lines must not exceed ${MAX_STATIC_CATALOG_LINES}`);
    pushIf(staticBudget.max_bytes > MAX_STATIC_CATALOG_BYTES, failures, `${STATIC_CATALOG} ratchet max_bytes must not exceed ${MAX_STATIC_CATALOG_BYTES}`);
  }

  const joined = [staticText, ...SHARDS.map((name) => read(rel(SHARD_DIR, name)))].join('\n').toLowerCase();
  for (const forbidden of ['sqlite', 'lmdb', 'mdbx', 'better-sqlite3']) {
    pushIf(joined.includes(`require('${forbidden}')`) || joined.includes(`from '${forbidden}'`), failures, `architecture catalog sharding must not import ${forbidden}`);
  }

  const status = failures.length === 0 ? 'ok' : 'error';
  process.stdout.write(`${JSON.stringify({
    schema: 'agent-onboard-public-architecture-catalog-sharding-check-001',
    status,
    package_name: pkg.name,
    version: pkg.version,
    work_item_id: 'P1S3M6W27',
    static_catalog: staticMetric,
    shard_count: SHARDS.length,
    shards: shardMetrics,
    expected_catalog_key_count: EXPECTED_CATALOG_KEYS.length,
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
