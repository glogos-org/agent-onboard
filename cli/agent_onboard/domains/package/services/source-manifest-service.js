'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SOURCE_MANIFEST_SERVICE_SEED = Object.freeze({
  schema: 'agent-onboard-public-source-manifest-service-seed-003',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_source_manifest_service',
  service_path: 'cli/agent_onboard/domains/package/services/source-manifest-service.js',
  owned_surface: Object.freeze([
    'release fixture source/package context projection',
    'content-addressed npm package source manifest',
    'package source manifest drift guard input',
    'optional source manifest hash cache budget validation'
  ]),
  manifest_contract: Object.freeze({
    schema: 'agent-onboard-public-package-source-manifest-001',
    scope: 'projected npm package files',
    content_identity_field: 'file_id',
    content_identity_scheme: 'ni:///sha-256;...',
    forbidden_fields: Object.freeze(['sha256', 'path', 'urn']),
    package_manager_execution_required: false,
    command: 'agent-onboard release --source-manifest',
    check_command: 'agent-onboard release --source-manifest-check',
    writes_files: false,
    hash_cache: Object.freeze({
      cache_path: '.agent-onboard/source-manifest.hash-cache.json',
      required_for_public_package_manifest: false,
      max_bytes: 262144,
      stale_entry_budget: 0,
      extra_entry_budget: 0,
      missing_entry_budget: 0,
      invalid_entry_budget: 0,
      packaged_in_npm_tarball: false,
      authority_for_file_existence: false
    })
  }),
  boundary: Object.freeze({
    packaged_in_npm_tarball_in_this_gate: true,
    no_side_effect_on_require: true,
    no_file_writes_on_require: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true
  })
});

function describeSourceManifestServiceSeed() {
  return SOURCE_MANIFEST_SERVICE_SEED;
}

function toPosix(value) {
  return String(value).split(path.sep).join('/');
}

function stableUnique(values) {
  return Array.from(new Set(values.filter((item) => typeof item === 'string' && item.length > 0))).sort();
}

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function digestBytes(buffer) {
  return {
    algorithm: 'sha-256',
    file_id: `ni:///sha-256;${base64Url(crypto.createHash('sha256').update(buffer).digest())}`
  };
}


const HASH_CACHE_SCHEMA = 'agent-onboard.public-source-manifest.hash-cache.v1';
const HASH_CACHE_PATH = '.agent-onboard/source-manifest.hash-cache.json';
const HASH_CACHE_MAX_BYTES = 262144;

function statSignature(root, relativePath) {
  const stat = fs.statSync(path.join(root, relativePath));
  return {
    bytes: stat.size,
    mtime_ms: String(stat.mtimeMs),
    ctime_ms: String(stat.ctimeMs),
    dev: String(stat.dev),
    ino: String(stat.ino)
  };
}

function emptyHashCache() {
  return {
    schema: HASH_CACHE_SCHEMA,
    entries: {}
  };
}

function readHashCache(root) {
  const cachePath = path.join(root, HASH_CACHE_PATH);
  if (!fs.existsSync(cachePath)) return emptyHashCache();
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) return emptyHashCache();
    if (cache.schema !== HASH_CACHE_SCHEMA) return cache;
    if (!cache.entries || typeof cache.entries !== 'object' || Array.isArray(cache.entries)) return emptyHashCache();
    return cache;
  } catch (_error) {
    return emptyHashCache();
  }
}

function cacheEntryFor(root, relativePath, cacheEntries) {
  const entry = cacheEntries && typeof cacheEntries === 'object' ? cacheEntries[relativePath] : null;
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.file_id !== 'string' || !entry.file_id.startsWith('ni:///sha-256;')) return null;
  const stat = entry.stat && typeof entry.stat === 'object' ? entry.stat : null;
  if (!stat) return null;
  const expected = statSignature(root, relativePath);
  if (stat.bytes !== expected.bytes || stat.mtime_ms !== expected.mtime_ms || stat.ctime_ms !== expected.ctime_ms || stat.dev !== expected.dev || stat.ino !== expected.ino) return null;
  return entry;
}

function buildHashCache(root, relativePaths) {
  const absoluteRoot = path.resolve(root || process.cwd());
  const entries = {};
  for (const relativePath of stableUnique(relativePaths.map((item) => toPosix(item)))) {
    const absolutePath = path.join(absoluteRoot, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    const bytes = fs.readFileSync(absolutePath);
    entries[relativePath] = {
      file_id: digestBytes(bytes).file_id,
      stat: statSignature(absoluteRoot, relativePath)
    };
  }
  return {
    schema: HASH_CACHE_SCHEMA,
    entries
  };
}

function validateHashCacheBudget(root, cache, packageFiles, options = {}) {
  const absoluteRoot = path.resolve(root || process.cwd());
  const cachePath = path.join(absoluteRoot, HASH_CACHE_PATH);
  const cachePresent = fs.existsSync(cachePath);
  const projectedFiles = stableUnique(packageFiles.map((item) => toPosix(item)));
  const projectedSet = new Set(projectedFiles);
  const entries = cache && cache.entries && typeof cache.entries === 'object' && !Array.isArray(cache.entries) ? cache.entries : {};
  const cachePaths = Object.keys(entries).sort();
  const cacheSet = new Set(cachePaths);
  const missingPaths = cachePresent ? projectedFiles.filter((relativePath) => !cacheSet.has(relativePath)) : [];
  const extraPaths = cachePresent ? cachePaths.filter((relativePath) => !projectedSet.has(relativePath)) : [];
  const invalidEntries = [];
  const stalePaths = [];
  for (const relativePath of cachePaths) {
    const entry = entries[relativePath];
    const stat = entry && typeof entry === 'object' ? entry.stat : null;
    const validFileId = entry && typeof entry.file_id === 'string' && entry.file_id.startsWith('ni:///sha-256;');
    const validStat = stat && typeof stat === 'object'
      && Number.isFinite(stat.bytes)
      && typeof stat.mtime_ms === 'string'
      && typeof stat.ctime_ms === 'string'
      && typeof stat.dev === 'string'
      && typeof stat.ino === 'string';
    if (!validFileId || !validStat) {
      invalidEntries.push(relativePath);
      continue;
    }
    if (projectedSet.has(relativePath)) {
      const absolutePath = path.join(absoluteRoot, relativePath);
      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        stalePaths.push(relativePath);
        continue;
      }
      const actual = statSignature(absoluteRoot, relativePath);
      if (stat.bytes !== actual.bytes || stat.mtime_ms !== actual.mtime_ms || stat.ctime_ms !== actual.ctime_ms || stat.dev !== actual.dev || stat.ino !== actual.ino) stalePaths.push(relativePath);
    }
  }
  const cacheBytes = cachePresent ? fs.statSync(cachePath).size : 0;
  const schemaOk = !cachePresent || (cache && cache.schema === HASH_CACHE_SCHEMA);
  const bytesOk = !cachePresent || (cacheBytes > 0 && cacheBytes <= HASH_CACHE_MAX_BYTES);
  const cacheProjectedIntoPack = projectedSet.has(HASH_CACHE_PATH) || Boolean(options.cacheProjectedIntoPack);
  const status = schemaOk
    && bytesOk
    && missingPaths.length === 0
    && extraPaths.length === 0
    && invalidEntries.length === 0
    && stalePaths.length === 0
    && !cacheProjectedIntoPack
    ? 'ok'
    : 'error';
  return {
    schema: 'agent-onboard-public-source-manifest-hash-cache-budget-report-001',
    status,
    cache_path: HASH_CACHE_PATH,
    cache_present: cachePresent,
    cache_schema: cache && cache.schema ? cache.schema : null,
    expected_cache_schema: HASH_CACHE_SCHEMA,
    required_for_public_package_manifest: false,
    authority_for_file_existence: false,
    max_bytes: HASH_CACHE_MAX_BYTES,
    bytes: cacheBytes,
    package_file_count: projectedFiles.length,
    entry_count: cachePresent ? cachePaths.length : 0,
    max_entries: projectedFiles.length,
    stale_entry_budget: 0,
    extra_entry_budget: 0,
    missing_entry_budget: 0,
    invalid_entry_budget: 0,
    stale_paths: stalePaths,
    extra_paths: extraPaths,
    missing_paths: missingPaths,
    invalid_entries: invalidEntries,
    cache_file_projected_into_pack: cacheProjectedIntoPack,
    cache_omitted_from_package: !cacheProjectedIntoPack,
    cache_absent_is_valid: !cachePresent
  };
}

function readPackageJson(root) {
  const packagePath = path.join(root, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function projectedPackageFiles(pkg) {
  const files = Array.isArray(pkg && pkg.files) ? pkg.files : [];
  return stableUnique(files.concat(['package.json']).map((item) => toPosix(item)));
}

function entryForFile(root, relativePath, cacheEntries = null, stats = null) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return {
      file_path: relativePath,
      present: false,
      bytes: null,
      file_id: null,
      cache: 'miss'
    };
  }
  const cached = cacheEntryFor(root, relativePath, cacheEntries);
  if (cached) {
    if (stats) stats.hits += 1;
    return {
      file_path: relativePath,
      present: true,
      bytes: cached.stat.bytes,
      file_id: cached.file_id,
      cache: 'hit'
    };
  }
  if (stats) stats.misses += 1;
  const bytes = fs.readFileSync(absolutePath);
  const digest = digestBytes(bytes);
  return {
    file_path: relativePath,
    present: true,
    bytes: bytes.length,
    file_id: digest.file_id,
    cache: 'miss'
  };
}

function entryShapeErrors(entry, index) {
  const errors = [];
  const label = `source manifest entry ${index}`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [`${label} must be an object`];
  if (typeof entry.file_path !== 'string' || entry.file_path.length === 0) errors.push(`${label} must include file_path`);
  if (entry.present !== true) errors.push(`${label} must be present`);
  if (!Number.isFinite(entry.bytes) || entry.bytes < 0) errors.push(`${label} must include non-negative bytes`);
  if (typeof entry.file_id !== 'string' || !entry.file_id.startsWith('ni:///sha-256;')) errors.push(`${label} must include file_id using ni:///sha-256;`);
  if (Object.prototype.hasOwnProperty.call(entry, 'sha256')) errors.push(`${label} must not expose raw sha256`);
  if (Object.prototype.hasOwnProperty.call(entry, 'path')) errors.push(`${label} must use file_path instead of path`);
  if (Object.prototype.hasOwnProperty.call(entry, 'urn')) errors.push(`${label} must not use urn; package source identity is keyed by file_path plus file_id`);
  return errors;
}

function createPackageSourceManifestService(options = {}) {
  const packageName = typeof options.packageName === 'string' ? options.packageName : 'agent-onboard';
  const version = typeof options.version === 'string' ? options.version : null;
  const releaseLine = typeof options.releaseLine === 'string' ? options.releaseLine : null;
  const expectedPackFiles = Array.isArray(options.expectedPackFiles)
    ? stableUnique(options.expectedPackFiles.map((item) => toPosix(item)))
    : null;
  const sourceOnlyFiles = Array.isArray(options.sourceOnlyFiles)
    ? stableUnique(options.sourceOnlyFiles.map((item) => toPosix(item)))
    : [];

  function build(root = process.cwd()) {
    const absoluteRoot = path.resolve(root || process.cwd());
    const pkg = readPackageJson(absoluteRoot);
    const projectedFiles = projectedPackageFiles(pkg);
    const cache = readHashCache(absoluteRoot);
    const cacheStats = { enabled: true, hits: 0, misses: 0, cache_path: HASH_CACHE_PATH };
    const entries = projectedFiles.map((relativePath) => entryForFile(absoluteRoot, relativePath, cache.entries, cacheStats));
    const missingFiles = entries.filter((entry) => entry.present !== true).map((entry) => entry.file_path);
    const sourceOnlyProjected = sourceOnlyFiles.filter((relativePath) => projectedFiles.includes(relativePath));
    const hashCacheBudget = validateHashCacheBudget(absoluteRoot, cache, projectedFiles, {
      cacheProjectedIntoPack: projectedFiles.includes(HASH_CACHE_PATH)
    });
    return {
      schema: 'agent-onboard-public-package-source-manifest-001',
      status: missingFiles.length === 0 ? 'ok' : 'error',
      package_name: pkg.name || packageName,
      version: pkg.version || version,
      release_line: releaseLine,
      scope: 'projected_npm_package_files',
      algorithm: 'sha-256',
      entry_count: entries.length,
      files: entries,
      projected_pack_files: projectedFiles,
      expected_pack_files: expectedPackFiles ? expectedPackFiles.slice() : projectedFiles.slice(),
      source_only_files_projected_into_pack: sourceOnlyProjected,
      missing_files: missingFiles,
      hash_cache: {
        cache_path: HASH_CACHE_PATH,
        required_for_public_package_manifest: false,
        writes_cache: false,
        enabled: cacheStats.enabled,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        cache_present: hashCacheBudget.cache_present,
        cache_file_projected_into_pack: projectedFiles.includes(HASH_CACHE_PATH),
        authority_for_file_existence: false
      },
      hash_cache_budget: hashCacheBudget,
      boundary: {
        writes_files: false,
        writes_package_root: false,
        writes_target_repository_state: false,
        git_mutation: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        publishes_package: false,
        mutates_registry: false,
        network_registry_publish_required: false
      }
    };
  }

  function check(root = process.cwd()) {
    const manifest = build(root);
    const errors = [];
    const projectedFiles = manifest.projected_pack_files;
    const expectedFiles = manifest.expected_pack_files;
    const missingExpected = expectedFiles.filter((relativePath) => !projectedFiles.includes(relativePath));
    const unexpectedProjected = projectedFiles.filter((relativePath) => !expectedFiles.includes(relativePath));
    if (manifest.missing_files.length > 0) errors.push(`projected package files missing: ${manifest.missing_files.join(', ')}`);
    if (missingExpected.length > 0) errors.push(`expected package manifest files missing from package.json#files projection: ${missingExpected.join(', ')}`);
    if (unexpectedProjected.length > 0) errors.push(`unexpected package manifest files projected from package.json#files: ${unexpectedProjected.join(', ')}`);
    if (manifest.source_only_files_projected_into_pack.length > 0) errors.push(`source-only files projected into package source manifest: ${manifest.source_only_files_projected_into_pack.join(', ')}`);
    if (manifest.hash_cache.cache_file_projected_into_pack) errors.push('source manifest hash cache must stay source-only and out of the npm package projection');
    if (manifest.hash_cache_budget.status !== 'ok') {
      errors.push(`source manifest hash cache budget failed: ${[
        manifest.hash_cache_budget.missing_paths.length ? `missing=${manifest.hash_cache_budget.missing_paths.join(',')}` : null,
        manifest.hash_cache_budget.extra_paths.length ? `extra=${manifest.hash_cache_budget.extra_paths.join(',')}` : null,
        manifest.hash_cache_budget.stale_paths.length ? `stale=${manifest.hash_cache_budget.stale_paths.join(',')}` : null,
        manifest.hash_cache_budget.invalid_entries.length ? `invalid=${manifest.hash_cache_budget.invalid_entries.join(',')}` : null,
        manifest.hash_cache_budget.cache_file_projected_into_pack ? 'projected_into_pack=true' : null
      ].filter(Boolean).join(';') || 'budget status error'}`);
    }
    manifest.files.forEach((entry, index) => errors.push(...entryShapeErrors(entry, index)));
    return {
      schema: 'agent-onboard-public-package-source-manifest-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: manifest.package_name,
      version: manifest.version,
      release_line: manifest.release_line,
      manifest_schema: manifest.schema,
      entry_count: manifest.entry_count,
      validated: {
        package_files_are_content_addressed: manifest.files.length > 0 && manifest.files.every((entry) => typeof entry.file_id === 'string' && entry.file_id.startsWith('ni:///sha-256;')),
        projected_pack_files_match_expected: missingExpected.length === 0 && unexpectedProjected.length === 0,
        projected_pack_files_present: manifest.missing_files.length === 0,
        source_only_files_excluded_from_manifest: manifest.source_only_files_projected_into_pack.length === 0,
        raw_sha256_not_exposed: manifest.files.every((entry) => !Object.prototype.hasOwnProperty.call(entry, 'sha256')),
        hash_cache_not_projected_into_package: !manifest.hash_cache.cache_file_projected_into_pack,
        hash_cache_budget_enforced: manifest.hash_cache_budget.status === 'ok',
        hash_cache_is_not_existence_authority: manifest.hash_cache_budget.authority_for_file_existence === false,
        command_is_read_only: manifest.boundary.writes_files === false && manifest.boundary.runs_package_manager === false
      },
      projected_pack_files: projectedFiles,
      expected_pack_files: expectedFiles,
      missing_expected_files: missingExpected,
      unexpected_projected_files: unexpectedProjected,
      missing_files: manifest.missing_files,
      source_only_files_projected_into_pack: manifest.source_only_files_projected_into_pack,
      hash_cache: manifest.hash_cache,
      hash_cache_budget: manifest.hash_cache_budget,
      sample_entries: manifest.files.slice(0, 3),
      boundary: manifest.boundary,
      errors
    };
  }

  return Object.freeze({
    instance_schema: 'agent-onboard-public-package-source-manifest-service-instance-001',
    seed: SOURCE_MANIFEST_SERVICE_SEED,
    build,
    check
  });
}

module.exports = Object.freeze({
  SOURCE_MANIFEST_SERVICE_SEED,
  describeSourceManifestServiceSeed,
  createPackageSourceManifestService,
  digestBytes,
  projectedPackageFiles,
  buildHashCache,
  readHashCache,
  validateHashCacheBudget,
  HASH_CACHE_SCHEMA,
  HASH_CACHE_PATH,
  HASH_CACHE_MAX_BYTES
});
