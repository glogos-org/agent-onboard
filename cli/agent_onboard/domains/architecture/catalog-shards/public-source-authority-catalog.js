'use strict';

function createPublicSourceAuthorityCatalog({ releaseLine, PUBLIC_AUTHORITY_FIRST_READ_INDEX, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE } = Object.freeze({})) {
  const RELEASE_LINE = releaseLine;

const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-second-slice-plan-001',
  title: 'Agent-Onboard Public Source Module Extraction Second Slice Plan',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --second-slice-plan',
  check_command: 'agent-onboard architecture --second-slice-check',
  second_slice_plan_file: '.agent-onboard/source-module-extraction-second-slice-plan.json',
  prerequisite_installed_fallback_smoke_file: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file,
  purpose: 'Plan the second source-domain module slice after the core first slice while preserving installed-package fallback, compact npm surface, and source artifact git tracking.',
  second_slice_status: 'planned_not_created',
  planned_second_slice: Object.freeze({
    domain: 'authority',
    facade: 'authorityService',
    service: 'authorityService',
    planned_module: 'src/domains/authority.js',
    extraction_scope: 'authority read-order, first-read, and guard metadata only; write-capable agents command extraction stays out of this slice',
    source_module_created_by_this_gate: false,
    published_import_api: false,
    writes_files: false,
    state_writer: false
  }),
  gitignore_policy: Object.freeze({
    gitignore_file: '.gitignore',
    required_unignore_entries: Object.freeze([
      '!.agent-onboard/source-partition-plan.json',
      '!.agent-onboard/source-extraction-rehearsal.json',
      '!.agent-onboard/source-extraction-golden-outputs.json',
      '!.agent-onboard/source-module-extraction-adapter-boundary.json',
      '!.agent-onboard/source-module-extraction-first-slice.json',
      '!.agent-onboard/source-module-extraction-bundle-parity.json',
      '!.agent-onboard/source-module-extraction-runtime-bridge.json',
      '!.agent-onboard/source-module-extraction-installed-fallback-smoke.json',
      '!.agent-onboard/source-module-extraction-second-slice-plan.json',
      '!.agent-onboard/source-module-extraction-second-slice-first-slice.json',
      '!src/',
      '!src/domains/',
      '!src/domains/*.js'
    ]),
    forbidden_ignore_entries: Object.freeze(['src/', 'src/**', 'src/domains/', 'src/domains/*', 'src/domains/**'])
  }),
  boundary: Object.freeze({
    second_slice_plan_command_writes_files: false,
    second_slice_check_command_writes_files: false,
    creates_source_module: false,
    created_source_module: null,
    planned_module_must_be_absent_in_this_gate: true,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    exports_source_module_as_public_api: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-second-slice-first-slice-001',
  title: 'Agent-Onboard Public Source Module Extraction Second Slice First Slice',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --second-slice-first-slice',
  check_command: 'agent-onboard architecture --second-slice-first-slice-check',
  second_slice_first_slice_file: '.agent-onboard/source-module-extraction-second-slice-first-slice.json',
  source_module: 'src/domains/authority.js',
  prerequisite_second_slice_plan_file: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file,
  purpose: 'Create the authority source-only domain module slice after the second slice plan while preserving installed-package fallback, compact npm surface, and CLI adapter output stability.',
  second_slice_first_slice_status: 'source_only_shadow_module_applied',
  extracted_domain: Object.freeze({
    id: 'authority',
    facade: 'authorityService',
    service: 'authorityService',
    module: 'src/domains/authority.js',
    runtime_dependency_status: 'not_required_by_published_cli_runtime',
    extraction_scope: 'authority read-order, first-read, and guard metadata only; write-capable agents command extraction remains excluded'
  }),
  expected_module_export_names: Object.freeze(['AUTHORITY_DOMAIN_SECOND_SLICE', 'getAuthorityDomainSecondSlice']),
  expected_read_order_paths: Object.freeze(PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((item) => item.path)),
  expected_owned_commands: Object.freeze(['authority --first-read', 'authority --check', 'authority --index', 'authority --index-check', 'authority --state', 'authority --state-check', 'guard --plan', 'guard --check-boundary']),
  boundary: Object.freeze({
    second_slice_first_slice_command_writes_files: false,
    second_slice_first_slice_check_command_writes_files: false,
    creates_exactly_one_source_module: true,
    created_source_module: 'src/domains/authority.js',
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    excludes_write_capable_agents_command: true,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-authority-bundle-parity-001',
  title: 'Agent-Onboard Public Source Module Extraction Authority Bundle Parity',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --authority-bundle-parity',
  check_command: 'agent-onboard architecture --authority-bundle-parity-check',
  authority_bundle_parity_file: '.agent-onboard/source-module-extraction-authority-bundle-parity.json',
  source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.source_module,
  purpose: 'Prove that the source-only authority domain slice and the bundled CLI architecture/authority view remain equivalent before any authority runtime bridge is admitted.',
  prerequisite_second_slice_first_slice_file: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.second_slice_first_slice_file,
  parity_status: 'authority_source_slice_matches_bundled_cli_view',
  parity_scope: Object.freeze([
    'authority domain id and facade match between source slice and bundled architecture map',
    'authority-owned read-only command set matches bundled command router authority and guard routes admitted for this slice',
    'authority read order matches the bundled first-read index',
    'write-capable agents command extraction remains excluded',
    'source module remains source-only and excluded from npm package allowlist',
    'installed package context may omit source-only modules while bundled CLI checks still pass'
  ]),
  bundled_view: Object.freeze({
    source_of_truth: 'cli/agent-onboard.js bundled authority and architecture metadata',
    public_bin_entrypoint: 'cli/agent-onboard.js',
    published_package_file_count: 4
  }),
  boundary: Object.freeze({
    authority_bundle_parity_command_writes_files: false,
    authority_bundle_parity_check_command_writes_files: false,
    creates_bundle_artifact: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    includes_write_capable_agents_command: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-authority-runtime-bridge-001',
  title: 'Agent-Onboard Public Source Module Extraction Authority Runtime Bridge',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --authority-runtime-bridge',
  check_command: 'agent-onboard architecture --authority-runtime-bridge-check',
  authority_runtime_bridge_file: '.agent-onboard/source-module-extraction-authority-runtime-bridge.json',
  source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.source_module,
  purpose: 'Admit a guarded runtime bridge that may load the source-only authority module in source repository context while falling back to bundled CLI authority metadata in installed package context.',
  prerequisite_authority_bundle_parity_file: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.authority_bundle_parity_file,
  bridge_status: 'authority_source_context_optional_runtime_bridge_applied',
  bridge_resolution_order: Object.freeze([
    'source repository context: try src/domains/authority.js through guarded optional require',
    'installed package context: use bundled CLI authority metadata fallback',
    'failure mode: fail closed if source module is present but invalid'
  ]),
  runtime_bridge: Object.freeze({
    bridge_function: 'resolveAuthorityDomainRuntimeBridge',
    source_context_loads_module_when_present: true,
    installed_context_allows_missing_source_module: true,
    fallback: 'bundledAuthorityDomainForParity',
    public_import_api: false,
    writes_files: false,
    state_writer: false,
    includes_write_capable_agents_command: false
  }),
  gitignore_policy: Object.freeze({
    policy: 'track canonical source JSON by default; ignore only local/runtime/cache subtrees',
    forbidden_sprawl: 'do not add one .gitignore unignore line per future .agent-onboard artifact',
    canonical_source_namespace_trackable: '.agent-onboard/*.json',
    local_state_ignored: Object.freeze(['.agent-onboard/tmp/', '.agent-onboard/cache/', '.agent-onboard/local/', '.agent-onboard/*.local.json', '.agent-onboard/*.tmp.json', '.agent-onboard/*.log'])
  }),
  boundary: Object.freeze({
    authority_runtime_bridge_command_writes_files: false,
    authority_runtime_bridge_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    exports_source_module_as_public_api: false,
    source_context_optional_require_only: true,
    installed_context_fallback_required: true,
    includes_write_capable_agents_command: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: true
  })
});


const PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED = Object.freeze({
  schema: 'agent-onboard-public-architecture-m1-closure-m2-seed-001',
  title: 'Agent-Onboard Public Architecture M1 Closure And M2 Seed Gate',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --m2-seed',
  check_command: 'agent-onboard architecture --m2-seed-check',
  transition_file: '.agent-onboard/public-architecture-m1-closure-m2-seed.json',
  stage_id: 'P1S3',
  closed_milestone_id: 'P1S3M1',
  opened_milestone_id: 'P1S3M2',
  seed_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 1].join(''),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 2].join(''),
  closed_milestone_title: 'Public architecture kernel milestone',
  opened_milestone_title: 'Public source-domain extraction stabilization milestone',
  purpose: 'Close the public architecture kernel milestone after core and authority runtime bridges are admitted, then seed M2 as the stabilization line for the remaining public source-domain extraction work.',
  prerequisite_closed_work_items: Object.freeze(Array.from({ length: 19 }, (_, index) => ['P', 1, 'S', 3, 'M', 1, 'W', index + 1].join(''))),
  m2_initial_scope: Object.freeze([
    Object.freeze({
      id: ['P', 1, 'S', 3, 'M', 2, 'W', 1].join(''),
      title: 'Public architecture M1 closure and M2 seed gate',
      expected_status: 'closed',
      role: 'transition gate'
    }),
    Object.freeze({
      id: ['P', 1, 'S', 3, 'M', 2, 'W', 2].join(''),
      title: 'Public work-items domain source extraction planning gate',
      expected_status: 'open',
      role: 'next executable source-domain extraction gate'
    })
  ]),
  m2_non_goals: Object.freeze([
    'do not create src/domains/work-items.js in the transition gate',
    'do not expand the npm package allowlist',
    'do not change public CLI output contracts beyond this explicit transition surface',
    'do not publish, tag, push, or mutate registry state'
  ]),
  boundary: Object.freeze({
    m2_seed_command_writes_files: false,
    m2_seed_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    exports_source_module_as_public_api: false,
    changes_command_router: false,
    changes_existing_runtime_outputs: false,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    package_allowlist_unchanged: true
  })
});

  return Object.freeze({
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED
  });
}

module.exports = Object.freeze({
  createPublicSourceAuthorityCatalog
});
