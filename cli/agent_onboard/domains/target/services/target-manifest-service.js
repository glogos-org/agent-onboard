'use strict';

const fs = require('fs');
const path = require('path');
const { digestBytes, parseNi } = require('../../core/services/ni-uri-service');

const TARGET_MANIFEST_REL = '.agent-onboard/target-manifest.json';
const TARGET_MANIFEST_SCHEMA = 'agent-onboard-target-manifest-001';
const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.git',
  '.lake',
  '.pytest_cache',
  '.venv',
  '__pycache__',
  'audit',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target'
]);
const EXCLUDED_SUFFIXES = ['.zip', '.tgz', '.pyc'];
const MANIFEST_SELF = new Set([TARGET_MANIFEST_REL]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function normalizeRel(root, absolutePath) {
  return toPosix(path.relative(root, absolutePath));
}

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!!rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolveTargetRoot(value) {
  const requested = typeof value === 'string' && value.trim().length > 0 ? value : process.cwd();
  const resolved = path.resolve(process.cwd(), requested);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`target root is not an existing directory: ${requested}`);
  }
  return resolved;
}

function shouldIncludeTargetFile(root, absolutePath) {
  if (!fs.statSync(absolutePath).isFile()) return false;
  const relativePath = normalizeRel(root, absolutePath);
  if (MANIFEST_SELF.has(relativePath)) return false;
  const parts = relativePath.split('/');
  if (parts.some((part) => EXCLUDED_DIRECTORY_NAMES.has(part))) return false;
  if (EXCLUDED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix))) return false;
  return true;
}

function walkFiles(root, current = root, acc = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORY_NAMES.has(entry.name)) walkFiles(root, absolutePath, acc);
      continue;
    }
    if (entry.isFile() && shouldIncludeTargetFile(root, absolutePath)) acc.push(absolutePath);
  }
  return acc;
}

function buildTargetManifestEntries(targetRoot) {
  return walkFiles(targetRoot)
    .sort((left, right) => normalizeRel(targetRoot, left).localeCompare(normalizeRel(targetRoot, right)))
    .map((absolutePath) => {
      const bytes = fs.readFileSync(absolutePath);
      const digest = digestBytes(bytes);
      return Object.freeze({
        file_path: normalizeRel(targetRoot, absolutePath),
        bytes: fs.statSync(absolutePath).size,
        file_id: digest.file_id
      });
    });
}

function buildTargetManifest(targetRoot) {
  return Object.freeze({
    algorithm: 'sha-256',
    entries: buildTargetManifestEntries(targetRoot),
    schema: TARGET_MANIFEST_SCHEMA,
    target: Object.freeze({
      kind: 'target-repo',
      root: '.'
    })
  });
}

function entryMap(manifest) {
  const map = new Map();
  for (const entry of Array.isArray(manifest && manifest.entries) ? manifest.entries : []) {
    if (entry && typeof entry.file_path === 'string') map.set(entry.file_path, entry);
  }
  return map;
}

function compareTargetManifests(expected, actual) {
  const expectedMap = entryMap(expected);
  const actualMap = entryMap(actual);
  const expectedPaths = Array.from(expectedMap.keys()).sort();
  const actualPaths = Array.from(actualMap.keys()).sort();
  const expectedSet = new Set(expectedPaths);
  const actualSet = new Set(actualPaths);
  const changedEntries = [];
  for (const filePath of expectedPaths) {
    if (!actualSet.has(filePath)) continue;
    const expectedEntry = expectedMap.get(filePath);
    const actualEntry = actualMap.get(filePath);
    if (JSON.stringify(expectedEntry) !== JSON.stringify(actualEntry)) {
      changedEntries.push(Object.freeze({ file_path: filePath, expected: expectedEntry, actual: actualEntry }));
    }
  }
  const metadataMismatches = [];
  for (const field of ['algorithm', 'schema', 'target']) {
    if (JSON.stringify(expected[field]) !== JSON.stringify(actual && actual[field])) {
      metadataMismatches.push(Object.freeze({ field, expected: expected[field], actual: actual && actual[field] }));
    }
  }
  return Object.freeze({
    missing_file_paths: expectedPaths.filter((filePath) => !actualSet.has(filePath)),
    extra_file_paths: actualPaths.filter((filePath) => !expectedSet.has(filePath)),
    changed_entries: changedEntries,
    metadata_mismatches: metadataMismatches
  });
}

function targetManifestHasDrift(diff) {
  return diff.missing_file_paths.length > 0
    || diff.extra_file_paths.length > 0
    || diff.changed_entries.length > 0
    || diff.metadata_mismatches.length > 0;
}

function validateTargetManifestShape(manifest) {
  const violations = [];
  const root = manifest && typeof manifest === 'object' && !Array.isArray(manifest) ? manifest : {};
  const topKeys = Object.keys(root).sort();
  const expectedTopKeys = ['algorithm', 'entries', 'schema', 'target'];
  if (JSON.stringify(topKeys) !== JSON.stringify(expectedTopKeys)) {
    violations.push({ field: 'top_level_keys', expected: expectedTopKeys, actual: topKeys });
  }
  if (root.schema !== TARGET_MANIFEST_SCHEMA) violations.push({ field: 'schema', expected: TARGET_MANIFEST_SCHEMA, actual: root.schema });
  if (root.algorithm !== 'sha-256') violations.push({ field: 'algorithm', expected: 'sha-256', actual: root.algorithm });
  if (!root.target || typeof root.target !== 'object' || Array.isArray(root.target)) {
    violations.push({ field: 'target', expected: 'object', actual: root.target });
  } else {
    const targetKeys = Object.keys(root.target).sort();
    const expectedTargetKeys = ['kind', 'root'];
    if (JSON.stringify(targetKeys) !== JSON.stringify(expectedTargetKeys)) {
      violations.push({ field: 'target.keys', expected: expectedTargetKeys, actual: targetKeys });
    }
    if (root.target.kind !== 'target-repo') violations.push({ field: 'target.kind', expected: 'target-repo', actual: root.target.kind });
    if (root.target.root !== '.') violations.push({ field: 'target.root', expected: '.', actual: root.target.root });
  }
  if (!Array.isArray(root.entries)) {
    violations.push({ field: 'entries', expected: 'array', actual: typeof root.entries });
  } else {
    root.entries.forEach((entry, index) => {
      const keys = Object.keys(entry || {}).sort();
      const expectedEntryKeys = ['bytes', 'file_id', 'file_path'];
      if (JSON.stringify(keys) !== JSON.stringify(expectedEntryKeys)) {
        violations.push({ field: `entries[${index}].keys`, expected: expectedEntryKeys, actual: keys });
      }
      if (typeof entry.file_path !== 'string' || entry.file_path.trim() === '' || entry.file_path.startsWith('/') || entry.file_path.includes('..')) {
        violations.push({ field: `entries[${index}].file_path`, expected: 'safe non-empty relative file path', actual: entry.file_path });
      }
      if (typeof entry.bytes !== 'number' || !Number.isInteger(entry.bytes) || entry.bytes < 0) {
        violations.push({ field: `entries[${index}].bytes`, expected: 'non-negative integer', actual: entry.bytes });
      }
      try {
        const parsed = parseNi(entry.file_id);
        if (parsed.algorithm !== 'sha-256') {
          violations.push({ field: `entries[${index}].file_id.algorithm`, expected: 'sha-256', actual: parsed.algorithm });
        }
      } catch (error) {
        violations.push({ field: `entries[${index}].file_id`, expected: 'valid ni uri', actual: entry.file_id, error: error.message });
      }
      for (const forbiddenField of ['path', 'urn', 'sha256', 'ni']) {
        if (Object.prototype.hasOwnProperty.call(entry || {}, forbiddenField)) {
          violations.push({ field: `entries[${index}].${forbiddenField}`, expected: 'absent', actual: entry[forbiddenField] });
        }
      }
    });
  }
  return violations;
}

function readExistingManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return Object.freeze({ exists: false, value: null, parse_error: null });
  try {
    return Object.freeze({ exists: true, value: JSON.parse(fs.readFileSync(manifestPath, 'utf8')), parse_error: null });
  } catch (error) {
    return Object.freeze({ exists: true, value: null, parse_error: error.message });
  }
}

function writeJsonAtomic(filePath, value, stableJson) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, stableJson(value));
  fs.renameSync(tmp, filePath);
}

function createTargetManifestService(deps) {
  const { version: VERSION, releaseLine: RELEASE_LINE, stableJson, noMutationBoundary } = deps;

  function basePayload(targetRoot, command) {
    return {
      package_name: 'agent-onboard',
      version: VERSION,
      release_line: RELEASE_LINE,
      command,
      command_family: 'target manifest',
      target: {
        kind: 'target-repo',
        root: targetRoot
      },
      manifest_path: TARGET_MANIFEST_REL,
      target_manifest_schema: TARGET_MANIFEST_SCHEMA
    };
  }

  function manifestCommandBoundary(writes) {
    return {
      ...noMutationBoundary(),
      reads_target_repository_state: true,
      writes_files: writes,
      writes_target_repository_state: writes,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      git_mutation: false,
      publishes_package: false,
      mutates_registry: false
    };
  }

  function checkTargetManifestDrift(targetRoot) {
    const manifestPath = path.join(targetRoot, TARGET_MANIFEST_REL);
    if (!isInside(targetRoot, manifestPath)) throw new Error('target manifest path escaped target root');
    const current = buildTargetManifest(targetRoot);
    const existing = readExistingManifest(manifestPath);
    const errors = [];
    let shapeViolations = [];
    let diff = null;
    if (!existing.exists) errors.push('target manifest is missing; run target manifest --init first');
    else if (existing.parse_error) errors.push(`target manifest is not valid JSON: ${existing.parse_error}`);
    else {
      shapeViolations = validateTargetManifestShape(existing.value);
      if (shapeViolations.length > 0) errors.push('target manifest shape is invalid');
      else {
        diff = compareTargetManifests(current, existing.value);
        if (targetManifestHasDrift(diff)) errors.push('target manifest drift detected');
      }
    }
    return {
      ...basePayload(targetRoot, 'agent-onboard target manifest --check-drift'),
      schema: 'agent-onboard-target-manifest-drift-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      manifest_exists: existing.exists,
      entry_count: current.entries.length,
      drift_detected: diff ? targetManifestHasDrift(diff) : true,
      diff,
      shape_violations: shapeViolations,
      manifest_written: false,
      boundary: manifestCommandBoundary(false),
      errors
    };
  }

  function initTargetManifest(targetRoot, options = {}) {
    const write = options.write === true;
    const manifestPath = path.join(targetRoot, TARGET_MANIFEST_REL);
    if (!isInside(targetRoot, manifestPath)) throw new Error('target manifest path escaped target root');
    const manifest = buildTargetManifest(targetRoot);
    const existing = readExistingManifest(manifestPath);
    const errors = existing.exists ? ['target manifest already exists; use target manifest --refresh to update it'] : [];
    if (write && errors.length === 0) writeJsonAtomic(manifestPath, manifest, stableJson);
    return {
      ...basePayload(targetRoot, write ? 'agent-onboard target manifest --init --write' : 'agent-onboard target manifest --init --dry-run'),
      schema: 'agent-onboard-target-manifest-init-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      mode: write ? 'write' : 'dry-run',
      manifest_exists: existing.exists,
      entry_count: manifest.entries.length,
      manifest_preview: write ? undefined : manifest,
      manifest_written: write && errors.length === 0,
      boundary: manifestCommandBoundary(write && errors.length === 0),
      errors
    };
  }

  function refreshTargetManifest(targetRoot, options = {}) {
    const write = options.write === true;
    const manifestPath = path.join(targetRoot, TARGET_MANIFEST_REL);
    if (!isInside(targetRoot, manifestPath)) throw new Error('target manifest path escaped target root');
    const manifest = buildTargetManifest(targetRoot);
    const existing = readExistingManifest(manifestPath);
    const errors = [];
    let shapeViolations = [];
    let diff = null;
    if (!existing.exists) errors.push('target manifest is missing; run target manifest --init first');
    else if (existing.parse_error) errors.push(`target manifest is not valid JSON: ${existing.parse_error}`);
    else {
      shapeViolations = validateTargetManifestShape(existing.value);
      if (shapeViolations.length > 0) errors.push('target manifest shape is invalid');
      else diff = compareTargetManifests(manifest, existing.value);
    }
    const drift = diff ? targetManifestHasDrift(diff) : true;
    if (write && errors.length === 0 && drift) writeJsonAtomic(manifestPath, manifest, stableJson);
    const postWriteDrift = write && errors.length === 0 && drift ? checkTargetManifestDrift(targetRoot).drift_detected : drift;
    return {
      ...basePayload(targetRoot, write ? 'agent-onboard target manifest --refresh --write' : 'agent-onboard target manifest --refresh --dry-run'),
      schema: 'agent-onboard-target-manifest-refresh-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      mode: write ? 'write' : 'dry-run',
      manifest_exists: existing.exists,
      entry_count: manifest.entries.length,
      drift_detected: drift,
      diff,
      shape_violations: shapeViolations,
      manifest_preview: write ? undefined : manifest,
      manifest_written: write && errors.length === 0 && drift,
      idempotent_noop: errors.length === 0 && !drift,
      drift_after_write: postWriteDrift,
      boundary: manifestCommandBoundary(write && errors.length === 0 && drift),
      errors
    };
  }

  return Object.freeze({
    TARGET_MANIFEST_REL,
    TARGET_MANIFEST_SCHEMA,
    buildTargetManifest,
    checkTargetManifestDrift,
    initTargetManifest,
    refreshTargetManifest,
    validateTargetManifestShape,
    compareTargetManifests,
    targetManifestHasDrift
  });
}

module.exports = Object.freeze({
  TARGET_MANIFEST_REL,
  TARGET_MANIFEST_SCHEMA,
  buildTargetManifest,
  buildTargetManifestEntries,
  compareTargetManifests,
  createTargetManifestService,
  targetManifestHasDrift,
  validateTargetManifestShape
});
