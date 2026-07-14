'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function createPublicAuthorityStateShardService(deps) {
  const {
    version: VERSION,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    packageRoot,
    sourceContext,
    readJson
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    packageRoot,
    sourceContext,
    readJson
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicAuthorityStateShardService missing dependency: ${name}`);
  }

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function digestBuffer(buffer) {
  return `ni:///sha-256;${base64Url(crypto.createHash('sha256').update(buffer).digest())}`;
}

function digestJson(value) {
  return digestBuffer(Buffer.from(stableSerialize(value), 'utf8'));
}

function safeAuthorityFileDigest(root, rel) {
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(root, rel);
  const rootWithSep = absoluteRoot + path.sep;
  if (absolute !== absoluteRoot && !absolute.startsWith(rootWithSep)) {
    return {
      file_path: rel,
      present: false,
      kind: 'invalid_path',
      bytes: null,
      file_id: null,
      content_inlined: false
    };
  }
  if (!fs.existsSync(absolute)) {
    return {
      file_path: rel,
      present: false,
      kind: 'missing',
      bytes: null,
      file_id: null,
      content_inlined: false
    };
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) {
    return {
      file_path: rel,
      present: true,
      kind: stat.isDirectory() ? 'directory' : 'other',
      bytes: null,
      file_id: null,
      content_inlined: false
    };
  }
  const bytes = fs.readFileSync(absolute);
  return {
    file_path: rel,
    present: true,
    kind: 'file',
    bytes: stat.size,
    file_id: digestBuffer(bytes),
    content_inlined: false
  };
}


const PUBLIC_AUTHORITY_STATE_SHARDING_SEED = Object.freeze({
  schema: 'agent-onboard-public-authority-state-sharding-seed-001',
  package_name: 'agent-onboard',
  release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
  command: 'agent-onboard authority --state',
  check_command: 'agent-onboard authority --state-check',
  state_root: '.agent-onboard/state',
  shard_paths: Object.freeze([
    '.agent-onboard/state/live-authority.json',
    '.agent-onboard/state/policies.json',
    '.agent-onboard/state/indexes.json',
    '.agent-onboard/state/closed-gates.jsonl'
  ]),
  json_shards: Object.freeze([
    '.agent-onboard/state/live-authority.json',
    '.agent-onboard/state/policies.json',
    '.agent-onboard/state/indexes.json'
  ]),
  jsonl_shards: Object.freeze([
    '.agent-onboard/state/closed-gates.jsonl'
  ]),
  max_total_bytes: 24576,
  max_json_shard_bytes: 8192,
  max_jsonl_shard_bytes: 8192,
  boundary: Object.freeze({
    writes_files: false,
    state_command_writes_files: false,
    state_check_command_writes_files: false,
    state_shards_packaged_in_npm_tarball: false,
    raw_authority_loaded_by_default: false,
    file_contents_inlined: false,
    writes_source_state: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    network: false
  })
});

function maybeReadJson(root, rel) {
  const absolute = path.join(root, rel);
  if (!fs.existsSync(absolute)) return null;
  try {
    return readJson(absolute);
  } catch (_error) {
    return null;
  }
}

function fileDigestSummary(root, rel) {
  const absolute = path.join(root, rel);
  if (!fs.existsSync(absolute)) {
    return { file_path: rel, present: false, bytes: 0, file_id: null, content_inlined: false };
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) {
    return { file_path: rel, present: true, kind: stat.isDirectory() ? 'directory' : 'other', bytes: 0, file_id: null, content_inlined: false };
  }
  return { file_path: rel, present: true, kind: 'file', bytes: stat.size, file_id: digestBuffer(fs.readFileSync(absolute)), content_inlined: false };
}

function compactIndexSummary(root, rel, kind) {
  const value = maybeReadJson(root, rel);
  const digest = fileDigestSummary(root, rel);
  return {
    file_path: rel,
    kind,
    present: digest.present === true,
    bytes: digest.bytes,
    file_id: digest.file_id,
    schema: value && typeof value.schema === 'string' ? value.schema : null,
    status: value && typeof value.status === 'string' ? value.status : null,
    raw_registry_loaded_by_default: value && Object.prototype.hasOwnProperty.call(value, 'raw_registry_loaded_by_default') ? value.raw_registry_loaded_by_default : null,
    content_inlined: false
  };
}

function latestClosedWorkItems(root, limit = 5) {
  const workIndex = maybeReadJson(root, '.agent-onboard/work-items.index.json');
  if (workIndex && Array.isArray(workIndex.latest_closed_work_items)) return workIndex.latest_closed_work_items.slice(-limit);
  const workItems = maybeReadJson(root, '.agent-onboard/work-items.json');
  if (!workItems || !Array.isArray(workItems.work_items)) return [];
  return workItems.work_items.filter((item) => item && item.status === 'closed').slice(-limit).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    milestone_id: item.milestone_id || null,
    domain: item.domain || null
  }));
}

function currentWorkItemSummary(root) {
  const latest = latestClosedWorkItems(root, 1);
  const last = latest.length ? latest[latest.length - 1] : null;
  return {
    current_work_item: last ? last.id : null,
    current_work_item_title: last ? last.title : null,
    last_closed_work_item: last ? last.id : null,
    last_closed_title: last ? last.title : null
  };
}

function publicAuthorityStateShardPayloads(root = packageRoot()) {
  const current = currentWorkItemSummary(root);
  const workIndex = maybeReadJson(root, '.agent-onboard/work-items.index.json');
  const claimsIndex = maybeReadJson(root, '.agent-onboard/claims.index.json');
  const compactIndexDigest = fileDigestSummary(root, '.agent-onboard/authority-index.json');
  const workItemsIndexDigest = fileDigestSummary(root, '.agent-onboard/work-items.index.json');
  const claimsIndexDigest = fileDigestSummary(root, '.agent-onboard/claims.index.json');
  const workItemsLedgerDigest = fileDigestSummary(root, '.agent-onboard/work-items.json');
  const claimsLedgerDigest = fileDigestSummary(root, '.agent-onboard/claims.jsonl');
  const closed = latestClosedWorkItems(root, 5).map((item) => ({
    key: String(item.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    work_item_id: item.id,
    title: item.title,
    status: item.status,
    milestone_id: item.milestone_id || null
  }));
  const liveAuthority = {
    schema: 'agent-onboard-public-authority-live-state-shard-001',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    package_version_source: 'package.json#version',
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    authority_state_source_layout: 'sharded_seed',
    state_root: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.state_root,
    current_work_item: current.current_work_item,
    current_work_item_title: current.current_work_item_title,
    last_closed_work_item: current.last_closed_work_item,
    last_closed_title: current.last_closed_title,
    default_first_read: true,
    compact_authority_index_file: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_file,
    state_command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.command,
    state_check_command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.check_command,
    raw_authority_loaded_by_default: false,
    raw_growth_files_loaded_by_default: false,
    file_contents_inlined: false,
    latest_closed_work_items: latestClosedWorkItems(root, 5)
  };
  const policies = {
    schema: 'agent-onboard-public-authority-policies-state-shard-001',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    policies: {
      first_read: {
        default_first_read: true,
        raw_authority_loaded_by_default: false,
        raw_growth_files_loaded_by_default: false,
        max_compact_index_bytes: PUBLIC_AUTHORITY_FIRST_READ_INDEX.compact_index_budget.max_bytes
      },
      authority_state_shards: {
        state_root: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.state_root,
        shard_paths: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.shard_paths.slice(),
        packaged_in_npm_tarball: false,
        command_writes_files: false,
        check_command_writes_files: false,
        json_shard_max_bytes: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_json_shard_bytes,
        jsonl_shard_max_bytes: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_jsonl_shard_bytes
      },
      mutation_boundary: {
        authority_state_check_writes_files: false,
        git_mutation: false,
        installs_dependencies: false,
        runs_package_manager: false,
        publishes_package: false,
        network: false
      }
    }
  };
  const indexes = {
    schema: 'agent-onboard-public-authority-indexes-state-shard-001',
    package_name: PUBLIC_AUTHORITY_FIRST_READ_INDEX.package_name,
    release_line: PUBLIC_AUTHORITY_FIRST_READ_INDEX.release_line,
    raw_registries_loaded_by_default: false,
    file_contents_inlined: false,
    indexes: [
      Object.assign(compactIndexSummary(root, '.agent-onboard/authority-index.json', 'compact_authority_index'), { primary: true }),
      Object.assign(compactIndexSummary(root, '.agent-onboard/work-items.index.json', 'work_items_compact_index'), { item_count: workIndex && Number.isFinite(workIndex.item_count) ? workIndex.item_count : null, open_count: workIndex && Number.isFinite(workIndex.open_count) ? workIndex.open_count : null, closed_count: workIndex && Number.isFinite(workIndex.closed_count) ? workIndex.closed_count : null }),
      Object.assign(compactIndexSummary(root, '.agent-onboard/claims.index.json', 'claims_compact_index'), { event_count: claimsIndex && Number.isFinite(claimsIndex.event_count) ? claimsIndex.event_count : null, claim_count: claimsIndex && Number.isFinite(claimsIndex.claim_count) ? claimsIndex.claim_count : null })
    ],
    raw_growth_ledgers: [
      Object.assign(workItemsLedgerDigest, { kind: 'work_items_raw_ledger', loaded_by_default: false }),
      Object.assign(claimsLedgerDigest, { kind: 'claims_raw_ledger', loaded_by_default: false })
    ],
    authority_index_digest: compactIndexDigest.file_id,
    work_items_index_digest: workItemsIndexDigest.file_id,
    claims_index_digest: claimsIndexDigest.file_id
  };
  const closedGatesJsonl = closed.map((item) => JSON.stringify({
    schema: 'agent-onboard-public-authority-closed-gate-event-001',
    key: item.key,
    work_item_id: item.work_item_id,
    title: item.title,
    status: item.status,
    milestone_id: item.milestone_id,
    source: 'work-items.index.json',
    raw_evidence_loaded_by_default: false
  })).join('\n') + (closed.length ? '\n' : '');
  return {
    live_authority: liveAuthority,
    policies,
    indexes,
    closed_gates_jsonl: closedGatesJsonl
  };
}

function authorityStateExpectedForPath(root, rel) {
  const payloads = publicAuthorityStateShardPayloads(root);
  if (rel === '.agent-onboard/state/live-authority.json') return payloads.live_authority;
  if (rel === '.agent-onboard/state/policies.json') return payloads.policies;
  if (rel === '.agent-onboard/state/indexes.json') return payloads.indexes;
  if (rel === '.agent-onboard/state/closed-gates.jsonl') return payloads.closed_gates_jsonl;
  return null;
}

function authorityStateShardStatus(root, rel) {
  const expected = authorityStateExpectedForPath(root, rel);
  const absolute = path.join(root, rel);
  const isJsonl = rel.endsWith('.jsonl');
  const generatedBytes = Buffer.byteLength(isJsonl ? String(expected || '') : JSON.stringify(expected), 'utf8');
  if (!fs.existsSync(absolute)) {
    return { file_path: rel, present: false, status: 'missing', generated_bytes: generatedBytes, stored_bytes: 0, generated_file_id: isJsonl ? digestBuffer(Buffer.from(String(expected || ''), 'utf8')) : digestJson(expected), stored_file_id: null, content_inlined: false };
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) {
    return { file_path: rel, present: true, status: 'not_file', generated_bytes: generatedBytes, stored_bytes: 0, generated_file_id: null, stored_file_id: null, content_inlined: false };
  }
  const raw = fs.readFileSync(absolute, 'utf8');
  let fresh = false;
  let schema = null;
  let error = null;
  if (isJsonl) {
    fresh = raw.trimEnd() === String(expected || '').trimEnd();
    schema = 'agent-onboard-public-authority-closed-gate-event-001';
  } else {
    try {
      const parsed = JSON.parse(raw);
      schema = parsed && parsed.schema ? parsed.schema : null;
      fresh = stableSerialize(parsed) === stableSerialize(expected);
    } catch (parseError) {
      error = parseError && parseError.message ? parseError.message : String(parseError);
    }
  }
  return {
    file_path: rel,
    present: true,
    status: error ? 'invalid_json' : (fresh ? 'fresh' : 'stale'),
    schema,
    generated_bytes: generatedBytes,
    stored_bytes: stat.size,
    generated_file_id: isJsonl ? digestBuffer(Buffer.from(String(expected || ''), 'utf8')) : digestJson(expected),
    stored_file_id: digestBuffer(Buffer.from(raw, 'utf8')),
    content_inlined: false,
    error
  };
}

function publicAuthorityStateShardingSeed(root = packageRoot()) {
  const payloads = publicAuthorityStateShardPayloads(root);
  const packageContext = sourceContext(root).package_context;
  const shardFiles = PUBLIC_AUTHORITY_STATE_SHARDING_SEED.shard_paths.map((rel) => authorityStateShardStatus(root, rel));
  const totalGeneratedBytes = shardFiles.reduce((sum, entry) => sum + entry.generated_bytes, 0);
  const totalStoredBytes = shardFiles.reduce((sum, entry) => sum + entry.stored_bytes, 0);
  const jsonShardBytesOk = shardFiles.filter((entry) => entry.file_path.endsWith('.json')).every((entry) => entry.generated_bytes <= PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_json_shard_bytes);
  const jsonlShardBytesOk = shardFiles.filter((entry) => entry.file_path.endsWith('.jsonl')).every((entry) => entry.generated_bytes <= PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_jsonl_shard_bytes);
  return {
    schema: 'agent-onboard-public-authority-state-sharding-seed-result-001',
    status: 'ok',
    package_name: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.package_name,
    version: VERSION,
    release_line: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.release_line,
    command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.command,
    check_command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.check_command,
    package_context: packageContext,
    state_root: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.state_root,
    shard_paths: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.shard_paths.slice(),
    shard_files: shardFiles,
    generated_state_shards: payloads,
    summary: {
      shard_count: shardFiles.length,
      present_shard_count: shardFiles.filter((entry) => entry.present).length,
      fresh_shard_count: shardFiles.filter((entry) => entry.status === 'fresh').length,
      total_generated_bytes: totalGeneratedBytes,
      total_stored_bytes: totalStoredBytes,
      max_total_bytes: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_total_bytes,
      raw_authority_loaded_by_default: false,
      file_contents_inlined: false
    },
    validated: {
      total_budget: totalGeneratedBytes <= PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_total_bytes,
      json_shard_budget: jsonShardBytesOk,
      jsonl_shard_budget: jsonlShardBytesOk,
      state_commands_no_write: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary.state_command_writes_files === false && PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary.state_check_command_writes_files === false,
      state_shards_not_packaged: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary.state_shards_packaged_in_npm_tarball === false,
      raw_authority_loaded_by_default: false,
      file_contents_inlined: false
    },
    boundary: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary
  };
}

function publicAuthorityStateShardingSeedCheck(root = packageRoot()) {
  const result = publicAuthorityStateShardingSeed(root);
  const errors = [];
  if (result.summary.total_generated_bytes > PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_total_bytes) errors.push(`authority state shards exceed ${PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_total_bytes} bytes`);
  for (const shard of result.shard_files) {
    if (shard.file_path.endsWith('.json') && shard.generated_bytes > PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_json_shard_bytes) errors.push(`${shard.file_path} exceeds json shard budget`);
    if (shard.file_path.endsWith('.jsonl') && shard.generated_bytes > PUBLIC_AUTHORITY_STATE_SHARDING_SEED.max_jsonl_shard_bytes) errors.push(`${shard.file_path} exceeds jsonl shard budget`);
    if (result.package_context === 'source_repository') {
      if (!shard.present) errors.push(`authority state shard missing: ${shard.file_path}`);
      if (shard.status === 'stale') errors.push(`authority state shard stale: ${shard.file_path}`);
      if (shard.status === 'invalid_json') errors.push(`authority state shard invalid JSON: ${shard.file_path}: ${shard.error}`);
      if (shard.status === 'not_file') errors.push(`authority state shard is not a file: ${shard.file_path}`);
    }
  }
  if (PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary.state_command_writes_files !== false) errors.push('authority --state command must remain no-write');
  if (PUBLIC_AUTHORITY_STATE_SHARDING_SEED.boundary.state_check_command_writes_files !== false) errors.push('authority --state-check command must remain no-write');
  return Object.assign({}, result, {
    schema: 'agent-onboard-public-authority-state-sharding-seed-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    command: PUBLIC_AUTHORITY_STATE_SHARDING_SEED.check_command,
    errors,
    validated: Object.assign({}, result.validated, {
      stored_shards_fresh_or_installed_context_allowed: result.package_context === 'installed_package' || result.shard_files.every((entry) => entry.status === 'fresh'),
      source_shards_present_or_installed_context_allowed: result.package_context === 'installed_package' || result.shard_files.every((entry) => entry.present)
    })
  });
}

  return Object.freeze({
    stableSerialize,
    digestJson,
    safeAuthorityFileDigest,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck,
    publicAuthorityStateShardingSeedContract: PUBLIC_AUTHORITY_STATE_SHARDING_SEED
  });
}

module.exports = Object.freeze({
  createPublicAuthorityStateShardService
});
