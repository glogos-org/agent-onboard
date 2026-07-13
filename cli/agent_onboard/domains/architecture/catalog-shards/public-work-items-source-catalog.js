'use strict';

function createPublicWorkItemsSourceCatalog({ releaseLine } = Object.freeze({})) {
  const RELEASE_LINE = releaseLine;

const PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN = Object.freeze({
  schema: 'agent-onboard-public-work-items-domain-source-extraction-plan-001',
  title: 'Agent-Onboard Public Work-Items Domain Source Extraction Planning Gate',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --work-items-plan',
  check_command: 'agent-onboard architecture --work-items-check',
  plan_file: '.agent-onboard/source-module-extraction-work-items-plan.json',
  milestone_id: 'P1S3M2',
  work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 2].join(''),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 3].join(''),
  domain: Object.freeze({
    id: 'work_items',
    facade: 'workItemsService',
    command: 'work-items',
    state_file: '.agent-onboard/work-items.json',
    planned_module: 'src/domains/work-items.js',
    planned_contract_schema: 'agent-onboard-public-source-module-work-items-first-slice-001',
    planned_status: 'planned_not_created_by_this_gate'
  }),
  prerequisites: Object.freeze({
    architecture_m1_closure_m2_seed_check: 'agent-onboard architecture --m2-seed-check',
    authority_runtime_bridge_check: 'agent-onboard architecture --authority-runtime-bridge-check',
    package_surface_check: 'agent-onboard release --surface-check'
  }),
  extraction_scope: Object.freeze([
    'work item vocabulary schema and validator metadata',
    'work item list and source ledger read path',
    'work item append/init dry-run and explicit write boundary metadata',
    'claim and close command ownership remains shared with the claims domain until a later claims-domain gate'
  ]),
  excluded_scope: Object.freeze([
    'do not create src/domains/work-items.js in this planning gate',
    'do not move validateWorkItems or work-items command handlers in this planning gate',
    'do not extract claims-domain behavior from work-items --claim or work-items --close yet',
    'do not expand the npm package allowlist',
    'do not change public CLI output contracts'
  ]),
  followup_work_items: Object.freeze([
    Object.freeze({ id: ['P', 1, 'S', 3, 'M', 2, 'W', 3].join(''), title: 'Public work-items domain source extraction first-slice gate', expected_status: 'open' })
  ]),
  boundary: Object.freeze({
    work_items_plan_command_writes_files: false,
    work_items_check_command_writes_files: false,
    creates_source_modules: false,
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


const PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-work-items-first-slice-001',
  title: 'Agent-Onboard Public Work-Items Domain Source Extraction First Slice',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --work-items-first-slice',
  check_command: 'agent-onboard architecture --work-items-first-slice-check',
  first_slice_file: '.agent-onboard/source-module-extraction-work-items-first-slice.json',
  source_module: 'src/domains/work-items.js',
  prerequisite_plan_file: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.plan_file,
  first_slice_status: 'source_only_shadow_module_applied',
  extracted_domain: Object.freeze({
    id: 'work_items',
    facade: 'workItemsService',
    service: 'workItemsService',
    module: 'src/domains/work-items.js',
    state_file: '.agent-onboard/work-items.json',
    runtime_dependency_status: 'not_required_by_published_cli_runtime',
    extraction_scope: 'work item vocabulary, schema/view metadata, list/read validation surface, and explicit init/append write-boundary metadata only; claim and close behavior remains excluded'
  }),
  expected_module_export_names: Object.freeze(['WORK_ITEMS_DOMAIN_FIRST_SLICE', 'getWorkItemsDomainFirstSlice']),
  expected_owned_commands: Object.freeze([
    'work-items --schema',
    'work-items --template',
    'work-items --validate-template',
    'work-items --validate',
    'work-items --list',
    'work-items --init',
    'work-items --append'
  ]),
  excluded_commands: Object.freeze(['work-items --claim', 'work-items --close']),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 4].join(''),
  boundary: Object.freeze({
    work_items_first_slice_command_writes_files: false,
    work_items_first_slice_check_command_writes_files: false,
    creates_exactly_one_source_module: true,
    created_source_module: 'src/domains/work-items.js',
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    excludes_claim_and_close_commands: true,
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


const PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY = Object.freeze({
  schema: 'agent-onboard-public-source-module-work-items-bundle-parity-001',
  title: 'Agent-Onboard Public Work-Items Domain Source Extraction Bundle Parity',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --work-items-bundle-parity',
  check_command: 'agent-onboard architecture --work-items-bundle-parity-check',
  bundle_parity_file: '.agent-onboard/source-module-extraction-work-items-bundle-parity.json',
  source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.source_module,
  prerequisite_first_slice_file: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.first_slice_file,
  parity_status: 'work_items_source_slice_matches_bundled_cli_view',
  purpose: 'Prove that the source-only work_items first slice and the bundled CLI work-items architecture view remain equivalent before admitting a runtime bridge or deeper claims-domain extraction.',
  parity_scope: Object.freeze([
    'work_items domain id, facade, schema id, and state file match between source slice and bundled CLI view',
    'work_items read/list/init/append surface metadata matches the bundled CLI view',
    'claim and close remain excluded for a later claims-domain extraction gate',
    'source module remains source-only and excluded from npm package allowlist',
    'installed package context may omit source-only modules while bundled CLI checks still pass'
  ]),
  bundled_view: Object.freeze({
    source_of_truth: 'cli/agent-onboard.js bundled work-items runtime metadata',
    public_bin_entrypoint: 'cli/agent-onboard.js',
    published_package_file_count: 4
  }),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 5].join(''),
  boundary: Object.freeze({
    work_items_bundle_parity_command_writes_files: false,
    work_items_bundle_parity_check_command_writes_files: false,
    creates_bundle_artifact: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    includes_claim_and_close_commands: false,
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


const PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE = Object.freeze({
  schema: 'agent-onboard-public-source-module-work-items-runtime-bridge-001',
  title: 'Agent-Onboard Public Work-Items Domain Source Extraction Runtime Bridge',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --work-items-runtime-bridge',
  check_command: 'agent-onboard architecture --work-items-runtime-bridge-check',
  runtime_bridge_file: '.agent-onboard/source-module-extraction-work-items-runtime-bridge.json',
  source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY.source_module,
  prerequisite_bundle_parity_file: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY.bundle_parity_file,
  bridge_status: 'work_items_source_context_optional_runtime_bridge_applied',
  purpose: 'Admit a guarded runtime bridge that may load the source-only work_items module in source repository context while falling back to bundled CLI work-items metadata in installed package context.',
  bridge_resolution_order: Object.freeze([
    'source repository context: try src/domains/work-items.js through guarded optional require',
    'installed package context: use bundled CLI work-items metadata fallback',
    'failure mode: fail closed if source module is present but invalid'
  ]),
  runtime_bridge: Object.freeze({
    bridge_function: 'resolveWorkItemsDomainRuntimeBridge',
    source_context_loads_module_when_present: true,
    installed_context_allows_missing_source_module: true,
    fallback: 'bundledWorkItemsDomainForParity',
    public_import_api: false,
    writes_files: false,
    state_writer: false,
    includes_claim_and_close_commands: false
  }),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 6].join(''),
  boundary: Object.freeze({
    work_items_runtime_bridge_command_writes_files: false,
    work_items_runtime_bridge_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    source_context_optional_require_only: true,
    installed_context_fallback_required: true,
    includes_claim_and_close_commands: false,
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

const PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE = Object.freeze({
  schema: 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-001',
  title: 'Agent-Onboard Public Work-Items Domain Source Extraction Installed Fallback Smoke',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --work-items-installed-fallback-smoke',
  check_command: 'agent-onboard architecture --work-items-installed-fallback-check',
  installed_fallback_smoke_file: '.agent-onboard/source-module-extraction-work-items-installed-fallback-smoke.json',
  source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
  prerequisite_runtime_bridge_file: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.runtime_bridge_file,
  purpose: 'Freeze an installed-package fallback smoke contract proving the compact npm tarball can omit the source-only work_items module while architecture and release checks still fall back to bundled CLI metadata.',
  smoke_status: 'work_items_installed_fallback_smoke_admitted',
  projected_installed_context: Object.freeze({
    package_context: 'installed_package',
    source_module_present: false,
    runtime_bridge_resolution_mode: 'bundled_fallback',
    source_module_must_remain_out_of_pack: true,
    claim_and_close_commands_remain_excluded: true,
    architecture_checks_do_not_require_source_context_files: true
  }),
  validated_surfaces: Object.freeze([
    'architecture --work-items-runtime-bridge-check',
    'architecture --work-items-installed-fallback-check',
    'architecture --check',
    'release --surface-check',
    'release --architecture-parity-smoke',
    'release --check'
  ]),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 7].join(''),
  boundary: Object.freeze({
    work_items_installed_fallback_smoke_command_writes_files: false,
    work_items_installed_fallback_check_command_writes_files: false,
    claims_plan_command_writes_files: false,
    claims_check_command_writes_files: false,
    creates_temp_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    source_modules_remain_out_of_npm_pack: true,
    installed_context_fallback_required: true,
    includes_claim_and_close_commands: false,
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
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE
  });
}

module.exports = Object.freeze({
  createPublicWorkItemsSourceCatalog
});
