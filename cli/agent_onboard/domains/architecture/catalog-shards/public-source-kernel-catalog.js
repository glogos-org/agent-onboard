'use strict';

function createPublicSourceKernelCatalog({ releaseLine } = Object.freeze({})) {
  const RELEASE_LINE = releaseLine;

const PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN = Object.freeze({
  schema: 'agent-onboard-public-source-domain-module-partition-plan-001',
  title: 'Agent-Onboard Public Source Domain Module Partition Plan',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --partition-plan',
  check_command: 'agent-onboard architecture --partition-check',
  plan_file: '.agent-onboard/source-partition-plan.json',
  purpose: 'Declare the future public source-domain module partition before moving code out of the compact CLI entrypoint or expanding the npm package surface.',
  current_shape: Object.freeze({
    entrypoint: 'cli/agent-onboard.js',
    physical_module_partition_status: 'planned_not_applied',
    implementation_strategy: 'single_file_runtime_with_declared_domain_boundaries',
    package_surface_status: 'compact_four_file_npm_package_preserved'
  }),
  planned_source_modules: Object.freeze([
    Object.freeze({ domain: 'core', planned_module: 'src/domains/core.js', facade: 'coreService', package_surface: 'bundled_into_cli_entrypoint_before_publish' }),
    Object.freeze({ domain: 'authority', planned_module: 'src/domains/authority.js', facade: 'authorityService', package_surface: 'source_only_or_bundled_before_publish' }),
    Object.freeze({ domain: 'work_items', planned_module: 'src/domains/work-items.js', facade: 'workItemsService', package_surface: 'source_only_or_bundled_before_publish' }),
    Object.freeze({ domain: 'claims', planned_module: 'src/domains/claims.js', facade: 'claimsService', package_surface: 'source_only_or_bundled_before_publish' }),
    Object.freeze({ domain: 'target', planned_module: 'src/domains/target.js', facade: 'targetService', package_surface: 'source_only_or_bundled_before_publish' }),
    Object.freeze({ domain: 'release_package', planned_module: 'src/domains/release-package.js', facade: 'releasePackageService', package_surface: 'source_only_or_bundled_before_publish' })
  ]),
  partition_sequence: Object.freeze([
    Object.freeze({ order: 1, gate: 'plan', action: 'declare module boundaries and checks without moving files' }),
    Object.freeze({ order: 2, gate: 'extract-no-behavior-change', action: 'move pure constants/helpers behind source modules with golden output tests' }),
    Object.freeze({ order: 3, gate: 'adapter-preservation', action: 'keep cli/agent-onboard.js as the only published executable adapter' }),
    Object.freeze({ order: 4, gate: 'bundle-or-allowlist', action: 'either bundle modules into cli/agent-onboard.js before publish or explicitly admit any additional published files' }),
    Object.freeze({ order: 5, gate: 'installed-parity', action: 'prove npx installed package outputs match source architecture checks' })
  ]),
  invariants: Object.freeze({
    command_router_remains_table_driven: true,
    every_canonical_domain_has_one_facade: true,
    every_planned_module_maps_to_canonical_domain: true,
    cli_entrypoint_remains_published_bin_target: true,
    npm_package_allowlist_unchanged_for_this_gate: true,
    physical_partition_not_applied_by_this_gate: true,
    source_plan_file_is_source_only: true
  }),
  boundary: Object.freeze({
    partition_plan_command_writes_files: false,
    partition_check_command_writes_files: false,
    moves_source_files: false,
    creates_source_modules: false,
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


const PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL = Object.freeze({
  schema: 'agent-onboard-public-source-domain-extraction-rehearsal-001',
  title: 'Agent-Onboard Public Source Domain Extraction Rehearsal',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --extraction-rehearsal',
  check_command: 'agent-onboard architecture --extraction-check',
  rehearsal_file: '.agent-onboard/source-extraction-rehearsal.json',
  purpose: 'Rehearse source-domain extraction behind the admitted facades without moving source files, changing command outputs, or expanding the npm package surface.',
  prerequisite_plan_file: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.plan_file,
  rehearsal_status: 'rehearsed_not_applied',
  entrypoint_preservation: Object.freeze({
    published_entrypoint: 'cli/agent-onboard.js',
    entrypoint_remains_only_published_bin_target: true,
    physical_modules_created_by_this_gate: false,
    runtime_output_change_allowed: false,
    package_allowlist_change_allowed: false
  }),
  extraction_rehearsal_units: Object.freeze(PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.planned_source_modules.map((module) => Object.freeze({
    domain: module.domain,
    facade: module.facade,
    rehearsal_module: module.planned_module,
    extraction_mode: 'rehearsal_only_no_file_created',
    source_of_truth_before_application: 'cli/agent-onboard.js',
    package_surface: module.package_surface
  }))),
  golden_output_scope: Object.freeze([
    'status',
    'architecture --map',
    'architecture --router',
    'architecture --facades',
    'architecture --partition-check',
    'architecture --extraction-check',
    'authority --check',
    'target runtime --check',
    'release --surface-check',
    'release --check'
  ]),
  application_sequence: Object.freeze([
    Object.freeze({ order: 1, gate: 'rehearsal', action: 'declare extraction units and no-behavior-change checks without creating modules' }),
    Object.freeze({ order: 2, gate: 'golden-output-freeze', action: 'freeze selected command outputs before any physical extraction' }),
    Object.freeze({ order: 3, gate: 'source-module-application', action: 'create source modules behind facades with CLI adapter preserved' }),
    Object.freeze({ order: 4, gate: 'bundle-or-allowlist', action: 'preserve compact npm surface by bundling or explicitly admitting additional files' }),
    Object.freeze({ order: 5, gate: 'installed-parity', action: 'prove source and installed package checks remain equivalent' })
  ]),
  invariants: Object.freeze({
    partition_plan_must_pass: true,
    every_rehearsal_unit_maps_to_canonical_domain: true,
    every_rehearsal_unit_maps_to_facade: true,
    no_physical_module_created_by_this_gate: true,
    no_source_file_moved_by_this_gate: true,
    cli_entrypoint_remains_runtime_source_of_truth: true,
    npm_package_allowlist_unchanged_for_this_gate: true,
    rehearsal_file_is_source_only: true
  }),
  boundary: Object.freeze({
    extraction_rehearsal_command_writes_files: false,
    extraction_check_command_writes_files: false,
    creates_source_modules: false,
    moves_source_files: false,
    changes_runtime_outputs: false,
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

const PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE = Object.freeze({
  schema: 'agent-onboard-public-source-extraction-golden-output-freeze-001',
  title: 'Agent-Onboard Public Source Extraction Golden Output Freeze',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --golden-outputs',
  check_command: 'agent-onboard architecture --golden-check',
  freeze_file: '.agent-onboard/source-extraction-golden-outputs.json',
  purpose: 'Freeze the command-output contract used to compare behavior before any physical source-domain extraction, while avoiding hard-coded package-version sprawl in source docs and tests.',
  prerequisite_rehearsal_file: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.rehearsal_file,
  freeze_status: 'frozen_before_physical_extraction',
  version_policy: Object.freeze({
    single_source_of_truth: 'package.json#version',
    runtime_constant_source: "require('../package.json').version",
    source_docs_must_not_hardcode_current_patch_version: true,
    tests_must_not_hardcode_current_patch_version: true,
    generated_post_publish_handoff_may_emit_version_pinned_commands: true
  }),
  golden_commands: Object.freeze([
    Object.freeze({ command: 'status', schema: 'agent-onboard-status-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line']) }),
    Object.freeze({ command: 'architecture --map', schema: 'agent-onboard-public-architecture-map-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'map']) }),
    Object.freeze({ command: 'architecture --router', schema: 'agent-onboard-public-command-router-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'router']) }),
    Object.freeze({ command: 'architecture --facades', schema: 'agent-onboard-public-domain-service-facades-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'facades']) }),
    Object.freeze({ command: 'architecture --partition-check', schema: 'agent-onboard-public-source-domain-module-partition-plan-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'architecture --extraction-check', schema: 'agent-onboard-public-source-domain-extraction-rehearsal-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'architecture --golden-check', schema: 'agent-onboard-public-source-extraction-golden-output-freeze-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'release --version-sprawl-check', schema: 'agent-onboard-public-version-reference-policy-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'authority --check', schema: 'agent-onboard-public-authority-first-read-index-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'target runtime --check', schema: 'agent-onboard-public-target-runtime-namespace-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'release --surface-check', schema: 'agent-onboard-public-package-surface-preservation-check-result-001', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) }),
    Object.freeze({ command: 'release --check', schema: 'agent-onboard-public-release-check-result-007', required_fields: Object.freeze(['schema', 'status', 'version', 'release_line', 'validated']) })
  ]),
  boundary: Object.freeze({
    golden_outputs_command_writes_files: false,
    golden_check_command_writes_files: false,
    creates_source_modules: false,
    moves_source_files: false,
    changes_runtime_outputs: false,
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


const PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-adapter-boundary-001',
  title: 'Agent-Onboard Public Source Module Extraction Adapter Boundary',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --adapter-boundary',
  check_command: 'agent-onboard architecture --adapter-check',
  boundary_file: '.agent-onboard/source-module-extraction-adapter-boundary.json',
  purpose: 'Declare the stable adapter boundary that preserves cli/agent-onboard.js as the public runtime and npm bin target before physical source-domain modules are extracted.',
  prerequisite_golden_outputs_file: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.freeze_file,
  adapter_status: 'declared_before_physical_extraction',
  published_adapter: Object.freeze({
    path: 'cli/agent-onboard.js',
    role: 'stable published CLI adapter and bundle boundary',
    remains_only_published_bin_target: true,
    delegates_to: Object.freeze(['dispatchCommand', 'COMMAND_ROUTE_HANDLERS', 'DOMAIN_SERVICE_FACADES'])
  }),
  adapter_flow: Object.freeze([
    'published bin entrypoint',
    'CLI adapter boundary',
    'table-driven command router',
    'domain service facade',
    'future source module or current bundled implementation',
    'state reader/writer boundary'
  ]),
  adapter_units: Object.freeze(PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.planned_source_modules.map((module) => Object.freeze({
    domain: module.domain,
    facade: module.facade,
    future_source_module: module.planned_module,
    adapter_entrypoint: 'cli/agent-onboard.js',
    runtime_export_status: 'not_exported_as_public_api',
    extraction_mode: 'adapter_boundary_only_no_module_created'
  }))),
  invariants: Object.freeze({
    golden_outputs_must_pass: true,
    cli_entrypoint_remains_published_bin_target: true,
    every_adapter_unit_maps_to_canonical_domain: true,
    every_adapter_unit_maps_to_facade: true,
    public_api_stays_cli_commands_not_source_imports: true,
    no_physical_module_created_by_this_gate: true,
    no_source_file_moved_by_this_gate: true,
    npm_package_allowlist_unchanged_for_this_gate: true,
    adapter_boundary_file_is_source_only: true
  }),
  boundary: Object.freeze({
    adapter_boundary_command_writes_files: false,
    adapter_check_command_writes_files: false,
    creates_source_modules: false,
    moves_source_files: false,
    changes_runtime_outputs: false,
    publishes_source_modules_as_public_api: false,
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


const PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-first-slice-001',
  title: 'Agent-Onboard Public Source Module Extraction First Slice',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --first-slice',
  check_command: 'agent-onboard architecture --first-slice-check',
  first_slice_file: '.agent-onboard/source-module-extraction-first-slice.json',
  source_module: 'src/domains/core.js',
  purpose: 'Create the first source-only domain module slice for the core domain while preserving the published CLI adapter, runtime output contract, and compact npm package surface.',
  prerequisite_adapter_boundary_file: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.boundary_file,
  first_slice_status: 'source_only_shadow_module_applied',
  extracted_domain: Object.freeze({
    id: 'core',
    facade: 'coreService',
    service: 'coreService',
    planned_module: 'src/domains/core.js',
    runtime_dependency_status: 'not_required_by_published_cli_runtime',
    published_api_status: 'not_public_import_api',
    owns_commands: Object.freeze(['help', 'version', 'status', 'architecture']),
    writes_files: false,
    state_writer: false
  }),
  expected_module_export_names: Object.freeze(['CORE_DOMAIN_FIRST_SLICE', 'getCoreDomainFirstSlice']),
  parity_scope: Object.freeze([
    'domain id matches public architecture map',
    'facade matches public domain service facade',
    'module owns only read-only core commands',
    'module is source-only and absent from npm package allowlist',
    'CLI runtime does not require src/domains/core.js in installed package context'
  ]),
  boundary: Object.freeze({
    first_slice_command_writes_files: false,
    first_slice_check_command_writes_files: false,
    creates_exactly_one_source_module: true,
    created_source_module: 'src/domains/core.js',
    creates_non_core_source_modules: false,
    moves_existing_source_files: false,
    changes_runtime_outputs: false,
    changes_cli_runtime_dependency_graph: false,
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


const PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-bundle-parity-001',
  title: 'Agent-Onboard Public Source Module Extraction Bundle Parity',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --bundle-parity',
  check_command: 'agent-onboard architecture --bundle-parity-check',
  bundle_parity_file: '.agent-onboard/source-module-extraction-bundle-parity.json',
  source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.source_module,
  purpose: 'Prove that the source-only core domain slice and the bundled CLI architecture view remain equivalent before deeper physical extraction or bundle generation is admitted.',
  prerequisite_first_slice_file: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.first_slice_file,
  parity_status: 'source_slice_matches_bundled_cli_view',
  parity_scope: Object.freeze([
    'core domain id and facade match between source slice and bundled architecture map',
    'core-owned command set matches bundled command router routes for the core domain',
    'source module remains source-only and excluded from npm package allowlist',
    'installed package context may omit source-only modules while bundled CLI checks still pass'
  ]),
  bundled_view: Object.freeze({
    source_of_truth: 'cli/agent-onboard.js bundled runtime metadata',
    public_bin_entrypoint: 'cli/agent-onboard.js',
    published_package_file_count: 4
  }),
  boundary: Object.freeze({
    bundle_parity_command_writes_files: false,
    bundle_parity_check_command_writes_files: false,
    creates_bundle_artifact: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_runtime_outputs: false,
    changes_cli_runtime_dependency_graph: false,
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


const PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-runtime-bridge-001',
  title: 'Agent-Onboard Public Source Module Extraction Runtime Bridge',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --runtime-bridge',
  check_command: 'agent-onboard architecture --runtime-bridge-check',
  runtime_bridge_file: '.agent-onboard/source-module-extraction-runtime-bridge.json',
  source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.source_module,
  purpose: 'Admit a guarded runtime bridge that may load the source-only core module in source repository context while falling back to bundled CLI metadata in installed package context.',
  prerequisite_bundle_parity_file: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.bundle_parity_file,
  bridge_status: 'source_context_optional_runtime_bridge_applied',
  bridge_resolution_order: Object.freeze([
    'source repository context: try src/domains/core.js through guarded optional require',
    'installed package context: use bundled CLI core metadata fallback',
    'failure mode: fail closed if source module is present but invalid'
  ]),
  runtime_bridge: Object.freeze({
    bridge_function: 'resolveCoreDomainRuntimeBridge',
    source_context_loads_module_when_present: true,
    installed_context_allows_missing_source_module: true,
    fallback: 'bundledCoreDomainForParity',
    public_import_api: false,
    writes_files: false,
    state_writer: false
  }),
  boundary: Object.freeze({
    runtime_bridge_command_writes_files: false,
    runtime_bridge_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    exports_source_module_as_public_api: false,
    source_context_optional_require_only: true,
    installed_context_fallback_required: true,
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


const PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE = Object.freeze({
  schema: 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-001',
  title: 'Agent-Onboard Public Source Module Extraction Installed Fallback Smoke',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --installed-fallback-smoke',
  check_command: 'agent-onboard architecture --installed-fallback-check',
  installed_fallback_smoke_file: '.agent-onboard/source-module-extraction-installed-fallback-smoke.json',
  source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
  prerequisite_runtime_bridge_file: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.runtime_bridge_file,
  purpose: 'Freeze an installed-package fallback smoke contract proving the compact npm tarball can omit source modules while architecture and release checks still fall back to bundled CLI metadata.',
  smoke_status: 'installed_fallback_smoke_admitted',
  projected_installed_context: Object.freeze({
    package_context: 'installed_package',
    source_module_present: false,
    runtime_bridge_resolution_mode: 'bundled_fallback',
    source_module_must_remain_out_of_pack: true,
    release_check_skips_missing_source_ledger: true,
    architecture_checks_do_not_require_source_context_files: true
  }),
  validated_surfaces: Object.freeze([
    'architecture --runtime-bridge-check',
    'architecture --installed-fallback-check',
    'architecture --check',
    'release --surface-check',
    'release --architecture-parity-smoke',
    'release --check'
  ]),
  boundary: Object.freeze({
    installed_fallback_smoke_command_writes_files: false,
    installed_fallback_check_command_writes_files: false,
    creates_temp_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    exports_source_module_as_public_api: false,
    source_modules_remain_out_of_npm_pack: true,
    installed_context_fallback_required: true,
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
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE
  });
}

module.exports = Object.freeze({
  createPublicSourceKernelCatalog
});
