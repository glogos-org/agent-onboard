'use strict';

const fs = require('fs');
const path = require('path');

function createPublicAuthorityFirstReadService(deps) {
  const {
    version: VERSION,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    publicAuthorityStateShardingSeedContract: PUBLIC_AUTHORITY_STATE_SHARDING_SEED,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    stableSerialize,
    digestJson,
    safeAuthorityFileDigest,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_AUTHORITY_STATE_SHARDING_SEED,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    stableSerialize,
    digestJson,
    safeAuthorityFileDigest,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicAuthorityFirstReadService missing dependency: ${name}`);
  }

function publicAuthorityCompactIndex(root = packageRoot()) {
  const packageContext = sourceContext(root);
  const files = PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_source_files.map((rel) => safeAuthorityFileDigest(root, rel));
  const presentFiles = files.filter((entry) => entry.present && entry.kind === 'file');
  const missingFiles = files.filter((entry) => !entry.present).map((entry) => entry.file_path);
  const readOrder = PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((entry) => ({
    order: entry.order,
    path: entry.path,
    role: entry.role,
    required_when_present: entry.required_when_present
  }));
  const compactIndex = {
    schema: 'agent-onboard-public-authority-compact-index-001',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    package_version_source: 'package.json#version',
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    index_file: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_file,
    first_read_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.command,
    check_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.check_command,
    compact_index_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_command,
    compact_index_check_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_check_command,
    state_command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.command,
    state_check_command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.check_command,
    state_shard_root: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.state_root,
    state_shard_paths: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.shard_paths.slice(),
    default_first_read: true,
    raw_authority_loaded_by_default: false,
    file_contents_inlined: false,
    max_bytes: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_budget.max_bytes,
    first_read_order: readOrder,
    first_read_order_file_id: digestJson(readOrder),
    indexed_authority_files: files,
    excluded_authority_index_files: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_excluded_files,
    summary: {
      indexed_file_count: files.length,
      present_file_count: presentFiles.length,
      missing_file_count: missingFiles.length,
      present_bytes: presentFiles.reduce((sum, entry) => sum + entry.bytes, 0),
      missing_files: missingFiles,
      excluded_file_count: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_excluded_files.length,
      state_shard_count: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.shard_paths.length,
      raw_evidence_is_on_demand_only: true
    },
    drift_guard: {
      compares_stored_index_to_live_file_digests: true,
      digest_algorithm: 'sha-256',
      raw_file_contents_inlined: false,
      raw_authority_loaded_by_default: false,
      self_and_cross_index_files_excluded: true,
      index_file_is_source_only: true,
      state_shards_checked_by_authority_state_check: true
    },
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false,
      raw_authority_loaded_by_default: false,
      file_contents_inlined: false
    }
  };
  return compactIndex;
}

function publicAuthorityCompactIndexResult(root = packageRoot()) {
  const authorityIndex = publicAuthorityCompactIndex(root);
  return {
    schema: 'agent-onboard-public-authority-compact-index-result-001',
    status: 'ok',
    package_name: authorityIndex.package_name,
    version: VERSION,
    release_line: authorityIndex.release_line,
    command: authorityIndex.compact_index_command,
    check_command: authorityIndex.compact_index_check_command,
    package_context: sourceContext(root).package_context,
    authority_index: authorityIndex,
    boundary: authorityIndex.boundary
  };
}

function publicAuthorityCompactIndexCheck(root = packageRoot()) {
  const index = publicAuthorityCompactIndex(root);
  const context = sourceContext(root);
  const errors = [];
  const indexBytes = Buffer.byteLength(JSON.stringify(index), 'utf8');
  const indexPath = path.join(root, PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_file);
  let storedIndex = null;
  let storedIndexStatus = context.package_context === 'source_repository' ? 'missing' : 'not_required_installed_package_context';
  if (fs.existsSync(indexPath)) {
    try {
      storedIndex = readJson(indexPath);
      storedIndexStatus = stableSerialize(storedIndex) === stableSerialize(index) ? 'fresh' : 'stale';
    } catch (error) {
      storedIndexStatus = 'invalid_json';
      errors.push(`authority compact index is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  }
  if (index.schema !== 'agent-onboard-public-authority-compact-index-001') errors.push('authority compact index schema must be agent-onboard-public-authority-compact-index-001');
  if (index.raw_authority_loaded_by_default !== false) errors.push('authority compact index must keep raw authority unloaded by default');
  if (index.file_contents_inlined !== false) errors.push('authority compact index must not inline file contents');
  if (indexBytes > PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_budget.max_bytes) errors.push(`authority compact index exceeds ${PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_budget.max_bytes} bytes`);
  if (context.package_context === 'source_repository') {
    if (!fs.existsSync(indexPath)) errors.push(`authority compact index file missing: ${PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_file}`);
    if (storedIndexStatus === 'stale') errors.push('authority compact index is stale against live authority file digests');
  }
  const missingCount = index.summary.missing_file_count;
  if (context.package_context === 'source_repository' && missingCount > PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_budget.missing_source_file_budget) {
    errors.push(`authority compact index source files missing: ${index.summary.missing_files.join(', ')}`);
  }
  if (index.indexed_authority_files.some((entry) => entry.content_inlined !== false)) errors.push('authority compact index entries must not inline file contents');
  return {
    schema: 'agent-onboard-public-authority-compact-index-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: index.package_name,
    version: VERSION,
    release_line: index.release_line,
    command: index.compact_index_check_command,
    package_context: context.package_context,
    index_file: index.index_file,
    index_file_present: fs.existsSync(indexPath),
    index_file_status: storedIndexStatus,
    index_bytes: indexBytes,
    max_bytes: index.max_bytes,
    validated: {
      schema: index.schema === 'agent-onboard-public-authority-compact-index-001',
      stored_index_fresh_or_installed_context_allowed: context.package_context === 'installed_package' || storedIndexStatus === 'fresh',
      raw_authority_loaded_by_default: index.raw_authority_loaded_by_default === false,
      file_contents_not_inlined: index.file_contents_inlined === false && index.indexed_authority_files.every((entry) => entry.content_inlined === false),
      within_budget: indexBytes <= index.max_bytes,
      source_files_present_or_installed_context_allowed: context.package_context === 'installed_package' || missingCount === 0,
      compact_index_commands_no_write: PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.compact_index_command_writes_files === false && PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.compact_index_check_command_writes_files === false
    },
    authority_index: index,
    boundary: index.boundary,
    errors
  };
}


function publicAuthorityFirstRead(root = packageRoot()) {
  const packageContext = sourceContext(root);
  const sourceFilesPresent = PUBLIC_AUTHORITY_FIRST_READ_INDEX.source_files.filter((rel) => fs.existsSync(path.join(root, rel)));
  const sourceFilesMissing = PUBLIC_AUTHORITY_FIRST_READ_INDEX.source_files.filter((rel) => !sourceFilesPresent.includes(rel));
  return {
    schema: 'agent-onboard-public-authority-first-read-result-001',
    status: 'ok',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    version: VERSION,
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.command,
    check_command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.check_command,
    package_root: root,
    package_context: packageContext.package_context,
    first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    compact_authority_index: publicAuthorityCompactIndex(root),
    authority_state_shards: publicAuthorityStateShardingSeed(root),
    read_order: firstReadOrder(),
    source_files_present: sourceFilesPresent,
    source_files_missing: sourceFilesMissing,
    projected_templates: {
      llms_txt: llmsTxtTemplate(root),
      authority_path: authorityPathTemplate(root)
    },
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function publicAuthorityFirstReadCheck(root = packageRoot()) {
  const result = publicAuthorityFirstRead(root);
  const expectedOrder = PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((entry) => entry.path);
  const actualOrder = result.read_order.map((entry) => entry.path);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json')));
  const errors = [];
  if (!arrayEquals(actualOrder, expectedOrder)) errors.push(`authority first-read order must be ${expectedOrder.join(', ')}`);
  if (new Set(actualOrder).size !== actualOrder.length) errors.push('authority first-read paths must be unique');
  if (PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.first_read_command_writes_files !== false) errors.push('authority --first-read command must remain no-write');
  if (PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.check_command_writes_files !== false) errors.push('authority --check command must remain no-write');
  const compactIndexCheck = publicAuthorityCompactIndexCheck(root);
  if (compactIndexCheck.status !== 'ok') errors.push(...compactIndexCheck.errors.map((error) => `authority compact index: ${error}`));
  const stateShardingCheck = publicAuthorityStateShardingSeedCheck(root);
  if (stateShardingCheck.status !== 'ok') errors.push(...stateShardingCheck.errors.map((error) => `authority state shards: ${error}`));
  if (!arrayEquals(projectedPackFiles, expectedPackFiles)) errors.push(`projected npm pack files must stay compact: ${expectedPackFiles.join(', ')}`);
  if (result.package_context === 'source_repository') {
    if (result.source_files_missing.length > 0) errors.push(`source authority files missing: ${result.source_files_missing.join(', ')}`);
    const llmsPath = path.join(root, 'llms.txt');
    const authorityPath = path.join(root, '.agent-onboard', 'authority-path.json');
    if (fs.existsSync(llmsPath)) {
      const llms = fs.readFileSync(llmsPath, 'utf8');
      if (!llms.includes('First-read order')) errors.push('llms.txt must contain First-read order');
      if (!llms.includes('.agent-onboard/authority-path.json')) errors.push('llms.txt must reference .agent-onboard/authority-path.json');
      if (!llms.includes('.agent-onboard/authority-index.json')) errors.push('llms.txt must reference .agent-onboard/authority-index.json');
      if (!llms.includes('manifest.json')) errors.push('llms.txt must reference manifest.json');
      if (!llms.includes('SOURCE_OF_TRUTH.md')) errors.push('llms.txt must reference SOURCE_OF_TRUTH.md');
    }
    if (fs.existsSync(authorityPath)) {
      try {
        const value = readJson(authorityPath);
        const paths = Array.isArray(value.first_read_order) ? value.first_read_order.map((entry) => entry.path) : [];
        if (value.schema !== 'agent-onboard-authority-path-001') errors.push('authority-path schema must be agent-onboard-authority-path-001');
        if (!arrayEquals(paths, expectedOrder)) errors.push('authority-path first_read_order must match canonical order');
        if (value.compact_authority_index_file !== PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_file) errors.push('authority-path must declare compact_authority_index_file');
      } catch (error) {
        errors.push(`authority-path is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    }
  }
  return {
    schema: 'agent-onboard-public-authority-first-read-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    version: VERSION,
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    command: PUBLIC_AUTHORITY_FIRST_READ_INDEX.check_command,
    package_root: root,
    validated: {
      first_read_order: arrayEquals(actualOrder, expectedOrder),
      first_read_paths_unique: new Set(actualOrder).size === actualOrder.length,
      authority_commands_no_write: PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.first_read_command_writes_files === false && PUBLIC_AUTHORITY_FIRST_READ_INDEX.boundary.check_command_writes_files === false,
      source_authority_files: result.package_context === 'source_repository' ? result.source_files_missing.length === 0 : true,
      compact_package_boundary: arrayEquals(projectedPackFiles, expectedPackFiles),
      compact_authority_index: compactIndexCheck.status === 'ok',
      authority_state_shards: stateShardingCheck.status === 'ok',
      installed_package_context_skips_source_files: result.package_context === 'installed_package' ? result.source_files_present.length === 0 : true
    },
    expected_read_order: expectedOrder,
    read_order: actualOrder,
    source_files_present: result.source_files_present,
    source_files_missing: result.source_files_missing,
    package_context: result.package_context,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    compact_authority_index_check: compactIndexCheck,
    authority_state_sharding_check: stateShardingCheck,
    boundary: result.boundary,
    errors
  };
}


  return Object.freeze({
    publicAuthorityFirstRead,
    publicAuthorityFirstReadCheck,
    publicAuthorityCompactIndexResult,
    publicAuthorityCompactIndexCheck
  });
}

module.exports = Object.freeze({
  createPublicAuthorityFirstReadService
});
