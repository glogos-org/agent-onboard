'use strict';

function createPublicArchitectureBoundaryCatalog({ releaseLine, publicPackagedRouterPortPackFiles } = Object.freeze({})) {
  const RELEASE_LINE = releaseLine;
  const PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES = publicPackagedRouterPortPackFiles;

const PUBLIC_COMMAND_ROUTER = Object.freeze({
  schema: 'agent-onboard-public-command-router-001',
  title: 'Agent-Onboard Public Command Router Boundary',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --router',
  check_command: 'agent-onboard architecture --check',
  dispatch_mode: 'table_driven_top_level_router',
  dispatcher: 'dispatchCommand',
  entrypoint: 'cli/agent-onboard.js',
  aliases: Object.freeze({
    help: Object.freeze(['', 'help', '--help', '-h']),
    version: Object.freeze(['version', '--version', '-v'])
  }),
  routes: Object.freeze([
    Object.freeze({ command: 'help', domain: 'core', facade: 'coreService', handler: 'help', aliases: Object.freeze(['', 'help', '--help', '-h']), nested: false, writes_files: false }),
    Object.freeze({ command: 'version', domain: 'core', facade: 'coreService', handler: 'printVersion', aliases: Object.freeze(['version', '--version', '-v']), nested: false, writes_files: false }),
    Object.freeze({ command: 'status', domain: 'core', facade: 'coreService', handler: 'runStatus', aliases: Object.freeze([]), nested: false, writes_files: false }),
    Object.freeze({ command: 'init', domain: 'target', facade: 'targetService', handler: 'runInit', aliases: Object.freeze([]), nested: false, writes_files: true }),
    Object.freeze({ command: 'agents', domain: 'authority', facade: 'authorityService', handler: 'runAgents', aliases: Object.freeze([]), nested: false, writes_files: true }),
    Object.freeze({ command: 'guard', domain: 'authority', facade: 'authorityService', handler: 'runGuard', aliases: Object.freeze([]), nested: false, writes_files: false }),
    Object.freeze({ command: 'authority', domain: 'authority', facade: 'authorityService', handler: 'runAuthority', aliases: Object.freeze([]), nested: true, nested_commands: Object.freeze(['--first-read', '--check', '--index', '--index-check', '--state', '--state-check']), writes_files: false }),
    Object.freeze({ command: 'architecture', domain: 'core', facade: 'coreService', handler: 'runArchitecture', aliases: Object.freeze([]), nested: false, writes_files: false }),
    Object.freeze({ command: 'release', domain: 'release_package', facade: 'releasePackageService', handler: 'runRelease', aliases: Object.freeze([]), nested: false, writes_files: false }),
    Object.freeze({ command: 'target-config', domain: 'target', facade: 'targetService', handler: 'runTargetConfig', aliases: Object.freeze([]), nested: false, writes_files: false }),
    Object.freeze({ command: 'work-items', domain: 'work_items', facade: 'workItemsService', handler: 'runWorkItems', aliases: Object.freeze([]), nested: false, writes_files: true }),
    Object.freeze({ command: 'target', domain: 'target', facade: 'targetService', handler: 'runTargetCommand', aliases: Object.freeze([]), nested: true, nested_commands: Object.freeze(['runtime', 'metadata', 'onboarding', 'bootstrap']), writes_files: true }),
    Object.freeze({ command: 'target-instance', domain: 'target', facade: 'targetService', handler: 'runTargetInstance', aliases: Object.freeze([]), nested: true, nested_commands: Object.freeze(['takeover']), writes_files: true })
  ]),
  boundary: Object.freeze({
    router_command_writes_files: false,
    router_command_writes_target_repository_state: false,
    router_command_runs_package_manager: false,
    router_command_publishes_package: false,
    dispatch_table_contains_functions: false,
    dispatch_table_declares_handler_names_only: true,
    routes_declare_domain_service_facades: true,
    no_dynamic_eval: true,
    unsupported_commands_fail_closed: true,
    nested_target_routes_are_explicit: true,
    package_allowlist_unchanged: true
  })
});

const PUBLIC_DOMAIN_SERVICE_FACADES = Object.freeze({
  schema: 'agent-onboard-public-domain-service-facades-001',
  title: 'Agent-Onboard Public Domain Service Facade Boundary',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --facades',
  check_command: 'agent-onboard architecture --check',
  purpose: 'Expose the admitted public domain service facade layer between the command router and state reader/writer boundaries without requiring a physical source module split.',
  dispatch_flow: Object.freeze([
    'dispatchCommand',
    'COMMAND_ROUTE_HANDLERS',
    'DOMAIN_SERVICE_FACADES',
    'domain service method',
    'state reader/writer boundary'
  ]),
  facades: Object.freeze([
    Object.freeze({ id: 'core', service: 'coreService', owns_commands: Object.freeze(['help', 'version', 'status', 'architecture']), writes_files: false, state_writer: false }),
    Object.freeze({ id: 'authority', service: 'authorityService', owns_commands: Object.freeze(['agents', 'guard', 'authority --first-read', 'authority --check', 'authority --index', 'authority --index-check', 'authority --state', 'authority --state-check']), writes_files: true, state_writer: true }),
    Object.freeze({ id: 'work_items', service: 'workItemsService', owns_commands: Object.freeze(['work-items']), writes_files: true, state_writer: true }),
    Object.freeze({ id: 'claims', service: 'claimsService', owns_commands: Object.freeze(['work-items --claim', 'work-items --close']), writes_files: true, state_writer: true, shares_ledger_with: 'work_items' }),
    Object.freeze({ id: 'target', service: 'targetService', owns_commands: Object.freeze(['init', 'target-config', 'target runtime --namespace', 'target runtime --check', 'target metadata --plan', 'target metadata --check', 'target metadata --write', 'target onboarding', 'target bootstrap', 'target-instance takeover']), writes_files: true, state_writer: true }),
    Object.freeze({ id: 'release_package', service: 'releasePackageService', owns_commands: Object.freeze(['release']), writes_files: false, state_writer: false })
  ]),
  boundary: Object.freeze({
    facades_command_writes_files: false,
    facades_command_writes_target_repository_state: false,
    facades_command_runs_package_manager: false,
    facades_command_publishes_package: false,
    every_public_domain_has_one_facade: true,
    every_command_route_declares_facade: true,
    route_facade_ids_must_match_canonical_domains: true,
    physical_partition_not_required_for_this_gate: true,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_AUTHORITY_FIRST_READ_INDEX = Object.freeze({
  schema: 'agent-onboard-public-authority-first-read-index-001',
  title: 'Agent-Onboard Public Authority First-Read Index',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard authority --first-read',
  check_command: 'agent-onboard authority --check',
  compact_index_command: 'agent-onboard authority --index',
  compact_index_check_command: 'agent-onboard authority --index-check',
  state_command: 'agent-onboard authority --state',
  state_check_command: 'agent-onboard authority --state-check',
  state_root: '.agent-onboard/state',
  state_shard_paths: Object.freeze(['.agent-onboard/state/live-authority.json', '.agent-onboard/state/policies.json', '.agent-onboard/state/indexes.json', '.agent-onboard/state/closed-gates.jsonl']),
  compact_index_file: '.agent-onboard/authority-index.json',
  purpose: 'Declare the canonical first-read order and compact authority index for human and AI operators before target repository writes, package publication, dependency changes, build/test/deploy runs, or Git mutation.',
  source_files: Object.freeze(['AGENTS.md', 'SOURCE_OF_TRUTH.md', '.agent-onboard/authority-path.json', 'llms.txt', 'package.json', 'authority-map.json', 'manifest.json', '.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json']),
  compact_index_source_files: Object.freeze(['AGENTS.md', 'SOURCE_OF_TRUTH.md', '.agent-onboard/authority-path.json', 'llms.txt', 'package.json', '.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json']),
  compact_index_excluded_files: Object.freeze([
    Object.freeze({ file_path: '.agent-onboard/authority-index.json', reason: 'self_referential_compact_index' }),
    Object.freeze({ file_path: 'authority-map.json', reason: 'authority_map_can_reference_compact_index_file_urn' }),
    Object.freeze({ file_path: 'manifest.json', reason: 'content_manifest_can_reference_compact_index_file_id' }),
    Object.freeze({ file_path: '.agent-onboard/state/live-authority.json', reason: 'state_shard_checked_by_authority_state_check' }),
    Object.freeze({ file_path: '.agent-onboard/state/policies.json', reason: 'state_shard_checked_by_authority_state_check' }),
    Object.freeze({ file_path: '.agent-onboard/state/indexes.json', reason: 'state_shard_can_reference_compact_index_digest' }),
    Object.freeze({ file_path: '.agent-onboard/state/closed-gates.jsonl', reason: 'state_shard_checked_by_authority_state_check' })
  ]),
  machine_index_file: '.agent-onboard/authority-path.json',
  compact_machine_index_file: '.agent-onboard/authority-index.json',
  ai_entrypoint_file: 'llms.txt',
  human_entrypoint_file: 'AGENTS.md',
  authority_summary_file: 'SOURCE_OF_TRUTH.md',
  package_metadata_file: 'package.json',
  stable_authority_map_file: 'authority-map.json',
  content_manifest_file: 'manifest.json',
  read_order: Object.freeze([
    Object.freeze({ order: 1, path: 'AGENTS.md', role: 'operating_rules_and_default_boundary', required_when_present: true }),
    Object.freeze({ order: 2, path: 'SOURCE_OF_TRUTH.md', role: 'human_readable_authority_precedence', required_when_present: true }),
    Object.freeze({ order: 3, path: '.agent-onboard/authority-path.json', role: 'machine_readable_authority_path_index', required_when_present: true }),
    Object.freeze({ order: 4, path: '.agent-onboard/authority-index.json', role: 'compact_authority_digest_and_drift_index', required_when_present: true }),
    Object.freeze({ order: 5, path: 'llms.txt', role: 'ai_readable_command_and_orientation_entrypoint', required_when_present: true }),
    Object.freeze({ order: 6, path: 'package.json', role: 'package_identity_scripts_and_pack_surface', required_when_present: true }),
    Object.freeze({ order: 7, path: 'authority-map.json', role: 'stable_file_urn_and_authority_registry', required_when_present: true }),
    Object.freeze({ order: 8, path: 'manifest.json', role: 'content_identity_and_file_coverage_index', required_when_present: true }),
    Object.freeze({ order: 9, path: '.agent-onboard/target.json', role: 'target_boundary_declaration', required_when_present: true }),
    Object.freeze({ order: 10, path: '.agent-onboard/runtime-namespace.json', role: 'target_runtime_namespace_declaration', required_when_present: true }),
    Object.freeze({ order: 11, path: '.agent-onboard/project.json', role: 'target_runtime_project_identity', required_when_present: true }),
    Object.freeze({ order: 12, path: '.agent-onboard/work-items.json', role: 'public_work_item_ledger', required_when_present: true }),
    Object.freeze({ order: 13, path: 'README.md', role: 'public_package_documentation', required_when_present: false }),
    Object.freeze({ order: 14, path: 'raw evidence/source files', role: 'on_demand_only_after_authority_and_scope_files', required_when_present: false })
  ]),
  compact_index_budget: Object.freeze({
    max_bytes: 8192,
    raw_authority_loaded_by_default: false,
    file_contents_inlined: false,
    digest_algorithm: 'sha-256',
    missing_source_file_budget: 0
  }),
  boundary: Object.freeze({
    first_read_command_writes_files: false,
    check_command_writes_files: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    raw_evidence_is_on_demand_only: true,
    raw_authority_loaded_by_default: false,
    compact_index_command_writes_files: false,
    compact_index_check_command_writes_files: false,
    compact_index_file_is_source_only: true,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_TARGET_RUNTIME_NAMESPACE = Object.freeze({
  schema: 'agent-onboard-public-target-runtime-namespace-001',
  title: 'Agent-Onboard Public Target Runtime Namespace',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard target runtime --namespace',
  check_command: 'agent-onboard target runtime --check',
  purpose: 'Declare the canonical public runtime namespace under .agent-onboard/ after the authority first-read index is admitted.',
  namespace_root: '.agent-onboard',
  namespace_file: '.agent-onboard/runtime-namespace.json',
  canonical_runtime_files: Object.freeze([
    Object.freeze({ path: '.agent-onboard/runtime-namespace.json', domain: 'target', role: 'machine_readable_runtime_namespace', kind: 'json', required: true, written_by: 'target onboarding --write' }),
    Object.freeze({ path: '.agent-onboard/project.json', domain: 'target', role: 'target_runtime_project_identity', kind: 'json', required: true, written_by: 'init --write or target onboarding --write or target-instance takeover --write' }),
    Object.freeze({ path: '.agent-onboard/work-items.json', domain: 'work_items', role: 'public_work_item_ledger', kind: 'json', required: true, written_by: 'work-items --init --write or target onboarding --write or target-instance takeover --write' }),
    Object.freeze({ path: '.agent-onboard/authority-path.json', domain: 'authority', role: 'authority_first_read_index', kind: 'json', required: true, written_by: 'target onboarding --write' })
  ]),
  top_level_authority_files: Object.freeze([
    'AGENTS.md',
    'llms.txt',
    '.agent-onboard/target.json'
  ]),
  reserved_future_files: Object.freeze([
    Object.freeze({ path: '.agent-onboard/claims.jsonl', domain: 'claims', status: 'reserved_not_written_by_this_gate' }),
    Object.freeze({ path: '.agent-onboard/events.jsonl', domain: 'target', status: 'reserved_not_written_by_this_gate' })
  ]),
  allowed_writers: Object.freeze([
    'target onboarding --write',
    'init --write',
    'work-items --init --write',
    'target-instance takeover --write'
  ]),
  boundary: Object.freeze({
    namespace_command_writes_files: false,
    check_command_writes_files: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    reserved_future_files_not_written: true,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_PACKAGE_SURFACE_PRESERVATION = Object.freeze({
  schema: 'agent-onboard-public-package-surface-preservation-001',
  title: 'Agent-Onboard Public Package Surface Preservation',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard release --surface',
  check_command: 'agent-onboard release --surface-check',
  purpose: 'Admit the first controlled modular runtime package inclusion slice while keeping cli/agent-onboard.js as the runtime entrypoint.',
  expected_pack_files: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  required_package_json_files: Object.freeze(PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES.filter((rel) => rel !== 'package.json')),
  source_only_files: Object.freeze([
    'AGENTS.md',
    'llms.txt',
    '.agent-onboard/target.json',
    '.agent-onboard/project.json',
    '.agent-onboard/work-items.json',
    '.agent-onboard/authority-path.json',
    '.agent-onboard/authority-index.json',
    '.agent-onboard/runtime-namespace.json',
    '.agent-onboard/source-manifest.hash-cache.json',
    '.agent-onboard/source-partition-plan.json',
    '.agent-onboard/source-extraction-rehearsal.json',
    '.agent-onboard/source-extraction-golden-outputs.json',
    '.agent-onboard/source-module-extraction-adapter-boundary.json',
    '.agent-onboard/source-module-extraction-first-slice.json',
    '.agent-onboard/source-module-extraction-bundle-parity.json',
    '.agent-onboard/source-module-extraction-runtime-bridge.json',
    '.agent-onboard/source-module-extraction-installed-fallback-smoke.json',
    '.agent-onboard/source-module-extraction-second-slice-plan.json',
    '.agent-onboard/source-module-extraction-second-slice-first-slice.json',
    '.agent-onboard/source-module-extraction-authority-bundle-parity.json',
    '.agent-onboard/source-module-extraction-authority-runtime-bridge.json',
    '.agent-onboard/public-architecture-m1-closure-m2-seed.json',
    '.agent-onboard/source-module-extraction-work-items-plan.json',
    '.agent-onboard/source-module-extraction-work-items-first-slice.json',
    '.agent-onboard/source-module-extraction-work-items-bundle-parity.json',
    '.agent-onboard/source-module-extraction-work-items-runtime-bridge.json',
    '.agent-onboard/source-module-extraction-work-items-installed-fallback-smoke.json',
    '.agent-onboard/source-module-extraction-claims-plan.json',
    '.agent-onboard/source-module-extraction-claims-first-slice.json',
    '.agent-onboard/source-module-extraction-claims-bundle-parity.json',
    '.agent-onboard/source-module-extraction-claims-runtime-bridge.json',
    '.agent-onboard/source-module-extraction-claims-installed-fallback-smoke.json',
    '.agent-onboard/source-domain-extraction-stabilization-closure-review.json',
    '.agent-onboard/cli-runtime-de-monolith-planning.json',
    '.agent-onboard/thin-cli-router-seed.json',
    '.agent-onboard/compatibility-command-port-seed.json',
    '.agent-onboard/core-command-adapter-extraction.json',
    '.agent-onboard/package-command-adapter-extraction.json',
    '.agent-onboard/architecture-command-adapter-extraction.json',
    '.agent-onboard/authority-command-adapter-extraction.json',
    '.agent-onboard/modular-runtime-package-inclusion-plan.json',
    '.agent-onboard/packaged-router-port-inclusion.json',
    '.agent-onboard/thin-entrypoint-router-cutover-rehearsal.json',
    '.agent-onboard/thin-entrypoint-router-cutover-application.json',
    'src/domains/core.js',
    'src/domains/authority.js',
    'src/domains/work-items.js',
    'src/domains/claims.js',
    'test/agent-onboard.test.js'
  ]),
  installed_context_policy: Object.freeze({
    source_context_files_required_in_source_repo: true,
    source_context_files_must_be_absent_from_npm_pack: true,
    source_work_item_ledger_may_be_absent_after_install: true,
    installed_package_release_check_must_skip_missing_source_ledger: true
  }),
  boundary: Object.freeze({
    surface_command_writes_files: false,
    check_command_writes_files: false,
    source_manifest_command_writes_files: false,
    source_manifest_check_command_writes_files: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: false,
    package_allowlist_expanded: true,
    source_context_files_stay_out_of_npm_pack: true
  })
});


const PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE = Object.freeze({
  schema: 'agent-onboard-public-installed-parity-architecture-smoke-001',
  title: 'Agent-Onboard Public Installed Parity Architecture Smoke',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard release --architecture-parity-smoke',
  check_command: 'agent-onboard release --check',
  purpose: 'Verify that the installed npm package exposes the admitted public architecture, authority, target runtime, package-surface checks, and the first packaged modular router/port slice.',
  validated_surfaces: Object.freeze([
    'release --check',
    'architecture --check',
    'architecture --partition-check',
    'architecture --extraction-check',
    'authority --check',
    'target runtime --check',
    'release --surface-check'
  ]),
  expected_pack_files: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
  source_only_files_may_be_absent_after_install: true,
  boundary: Object.freeze({
    architecture_parity_smoke_command_writes_files: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    creates_temp_files: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: false,
    package_allowlist_expanded: true,
    source_context_files_stay_out_of_npm_pack: true
  })
});

  return Object.freeze({
    PUBLIC_COMMAND_ROUTER,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    PUBLIC_PACKAGE_SURFACE_PRESERVATION,
    PUBLIC_INSTALLED_PARITY_ARCHITECTURE_SMOKE
  });
}

module.exports = Object.freeze({
  createPublicArchitectureBoundaryCatalog
});
