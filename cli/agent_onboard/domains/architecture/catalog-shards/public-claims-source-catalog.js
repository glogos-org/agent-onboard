'use strict';

function createPublicClaimsSourceCatalog({ releaseLine } = Object.freeze({})) {
  const RELEASE_LINE = releaseLine;

const PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN = Object.freeze({
  schema: 'agent-onboard-public-claims-domain-source-extraction-plan-001',
  title: 'Agent-Onboard Public Claims Domain Source Extraction Planning Gate',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --claims-plan',
  check_command: 'agent-onboard architecture --claims-check',
  plan_file: '.agent-onboard/source-module-extraction-claims-plan.json',
  milestone_id: 'P1S3M2',
  work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 7].join(''),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 8].join(''),
  domain: Object.freeze({
    id: 'claims',
    facade: 'claimsService',
    command_surface: Object.freeze(['work-items --claim', 'work-items --close']),
    state_file: '.agent-onboard/work-items.json',
    planned_module: 'src/domains/claims.js',
    planned_contract_schema: 'agent-onboard-public-source-module-claims-first-slice-001',
    planned_status: 'planned_not_created_by_this_gate'
  }),
  prerequisites: Object.freeze({
    work_items_installed_fallback_check: 'agent-onboard architecture --work-items-installed-fallback-check',
    package_surface_check: 'agent-onboard release --surface-check'
  }),
  extraction_scope: Object.freeze([
    'claim dry-run/write proposal envelope for existing public work items',
    'claim actor, claimed_at, and note metadata transitions',
    'close dry-run/write closure envelope and handoff evidence checklist',
    'claim/close validation boundaries while the canonical state remains .agent-onboard/work-items.json'
  ]),
  excluded_scope: Object.freeze([
    'do not create src/domains/claims.js in this planning gate',
    'do not move work-items --claim or work-items --close handlers in this planning gate',
    'do not change work-items schema, template, init, validate, list, or append behavior',
    'do not expand the npm package allowlist',
    'do not change public CLI output contracts beyond adding this explicit planning/check surface'
  ]),
  followup_work_items: Object.freeze([
    Object.freeze({ id: ['P', 1, 'S', 3, 'M', 2, 'W', 8].join(''), title: 'Public claims domain source extraction first-slice gate', expected_status: 'open' })
  ]),
  boundary: Object.freeze({
    claims_plan_command_writes_files: false,
    claims_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_work_items_non_claim_runtime: false,
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

const PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-claims-first-slice-001',
  title: 'Agent-Onboard Public Claims Domain Source Extraction First Slice',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --claims-first-slice',
  check_command: 'agent-onboard architecture --claims-first-slice-check',
  first_slice_file: '.agent-onboard/source-module-extraction-claims-first-slice.json',
  source_module: 'src/domains/claims.js',
  prerequisite_plan_file: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN.plan_file,
  first_slice_status: 'source_only_shadow_module_applied',
  extracted_domain: Object.freeze({
    id: 'claims',
    facade: 'claimsService',
    service: 'claimsService',
    module: 'src/domains/claims.js',
    shared_state_file: '.agent-onboard/work-items.json',
    runtime_dependency_status: 'not_required_by_published_cli_runtime',
    extraction_scope: 'claim and close command metadata, shared ledger write-boundary metadata, and closure handoff contract only; non-claim work-items behavior remains excluded'
  }),
  expected_module_export_names: Object.freeze(['CLAIMS_DOMAIN_FIRST_SLICE', 'getClaimsDomainFirstSlice']),
  expected_owned_commands: Object.freeze([
    'work-items --claim',
    'work-items --close'
  ]),
  excluded_commands: Object.freeze([
    'work-items --schema',
    'work-items --template',
    'work-items --validate-template',
    'work-items --validate',
    'work-items --list',
    'work-items --init',
    'work-items --append'
  ]),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 9].join(''),
  boundary: Object.freeze({
    claims_first_slice_command_writes_files: false,
    claims_first_slice_check_command_writes_files: false,
    creates_exactly_one_source_module: true,
    created_source_module: 'src/domains/claims.js',
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    keeps_shared_work_items_ledger: true,
    excludes_non_claim_work_items_commands: true,
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


const PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY = Object.freeze({
  schema: 'agent-onboard-public-source-module-claims-bundle-parity-001',
  title: 'Agent-Onboard Public Claims Domain Source Extraction Bundle Parity',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --claims-bundle-parity',
  check_command: 'agent-onboard architecture --claims-bundle-parity-check',
  bundle_parity_file: '.agent-onboard/source-module-extraction-claims-bundle-parity.json',
  source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.source_module,
  prerequisite_first_slice_file: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.first_slice_file,
  parity_status: 'claims_source_slice_matches_bundled_cli_view',
  purpose: 'Prove that the source-only claims first slice and the bundled CLI claims architecture view remain equivalent before admitting a runtime bridge.',
  parity_scope: Object.freeze([
    'claims domain id, facade, service, and shared work-items ledger metadata match between source slice and bundled CLI view',
    'claim and close command ownership matches the bundled CLI claims view',
    'non-claim work-items commands remain excluded from the claims slice',
    'claim/close write-boundary metadata remains explicit while the source module itself remains read-only',
    'source module remains source-only and excluded from npm package allowlist'
  ]),
  bundled_view: Object.freeze({
    source_of_truth: 'cli/agent-onboard.js bundled claims runtime metadata',
    public_bin_entrypoint: 'cli/agent-onboard.js',
    published_package_file_count: 4
  }),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 10].join(''),
  boundary: Object.freeze({
    claims_bundle_parity_command_writes_files: false,
    claims_bundle_parity_check_command_writes_files: false,
    creates_bundle_artifact: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    keeps_shared_work_items_ledger: true,
    excludes_non_claim_work_items_commands: true,
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


const PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE = Object.freeze({
  schema: 'agent-onboard-public-source-module-claims-runtime-bridge-001',
  title: 'Agent-Onboard Public Claims Domain Source Extraction Runtime Bridge',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --claims-runtime-bridge',
  check_command: 'agent-onboard architecture --claims-runtime-bridge-check',
  runtime_bridge_file: '.agent-onboard/source-module-extraction-claims-runtime-bridge.json',
  source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY.source_module,
  prerequisite_bundle_parity_file: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY.bundle_parity_file,
  bridge_status: 'claims_source_context_optional_runtime_bridge_applied',
  purpose: 'Admit a guarded runtime bridge that may load the source-only claims module in source repository context while falling back to bundled CLI claims metadata in installed package context.',
  bridge_resolution_order: Object.freeze([
    'source repository context: try src/domains/claims.js through guarded optional require',
    'installed package context: use bundled CLI claims metadata fallback',
    'failure mode: fail closed if source module is present but invalid'
  ]),
  runtime_bridge: Object.freeze({
    bridge_function: 'resolveClaimsDomainRuntimeBridge',
    source_context_loads_module_when_present: true,
    installed_context_allows_missing_source_module: true,
    fallback: 'bundledClaimsDomainForParity',
    public_import_api: false,
    writes_files: false,
    state_writer: false,
    keeps_shared_work_items_ledger: true,
    includes_non_claim_work_items_commands: false
  }),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 11].join(''),
  boundary: Object.freeze({
    claims_runtime_bridge_command_writes_files: false,
    claims_runtime_bridge_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    source_context_optional_require_only: true,
    installed_context_fallback_required: true,
    keeps_shared_work_items_ledger: true,
    includes_non_claim_work_items_commands: false,
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


const PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE = Object.freeze({
  schema: 'agent-onboard-public-source-module-claims-installed-fallback-smoke-001',
  title: 'Agent-Onboard Public Claims Domain Source Extraction Installed Fallback Smoke',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --claims-installed-fallback-smoke',
  check_command: 'agent-onboard architecture --claims-installed-fallback-check',
  installed_fallback_smoke_file: '.agent-onboard/source-module-extraction-claims-installed-fallback-smoke.json',
  source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
  prerequisite_runtime_bridge_file: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.runtime_bridge_file,
  purpose: 'Freeze an installed-package fallback smoke contract proving the compact npm tarball can omit the source-only claims module while claim/close architecture checks still fall back to bundled CLI metadata.',
  smoke_status: 'claims_installed_fallback_smoke_admitted',
  projected_installed_context: Object.freeze({
    package_context: 'installed_package',
    source_module_present: false,
    runtime_bridge_resolution_mode: 'bundled_fallback',
    source_module_must_remain_out_of_pack: true,
    shared_work_items_ledger_remains_canonical: true,
    non_claim_work_items_commands_remain_excluded: true,
    architecture_checks_do_not_require_source_context_files: true
  }),
  validated_surfaces: Object.freeze([
    'architecture --claims-runtime-bridge-check',
    'architecture --claims-installed-fallback-check',
    'architecture --check',
    'release --surface-check',
    'release --architecture-parity-smoke',
    'release --check'
  ]),
  next_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 12].join(''),
  boundary: Object.freeze({
    claims_installed_fallback_smoke_command_writes_files: false,
    claims_installed_fallback_check_command_writes_files: false,
    creates_temp_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    exports_source_module_as_public_api: false,
    source_modules_remain_out_of_npm_pack: true,
    installed_context_fallback_required: true,
    keeps_shared_work_items_ledger: true,
    includes_non_claim_work_items_commands: false,
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



const PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW = Object.freeze({
  schema: 'agent-onboard-public-source-domain-extraction-stabilization-closure-review-001',
  title: 'Agent-Onboard Public Source-Domain Extraction Stabilization Closure Review Gate',
  package_name: 'agent-onboard',
  release_line: RELEASE_LINE,
  command: 'agent-onboard architecture --source-domain-closure-review',
  check_command: 'agent-onboard architecture --source-domain-closure-check',
  closure_review_file: '.agent-onboard/source-domain-extraction-stabilization-closure-review.json',
  milestone_id: 'P1S3M2',
  closed_milestone_id: 'P1S3M2',
  opened_milestone_id: 'P1S3M3',
  closure_work_item_id: ['P', 1, 'S', 3, 'M', 2, 'W', 12].join(''),
  seed_work_item_id: ['P', 1, 'S', 3, 'M', 3, 'W', 1].join(''),
  closure_status: 'p1s3m2_closed_p1s3m3_seeded',
  required_closed_work_items: Object.freeze(Array.from({ length: 12 }, (_, index) => ['P', 1, 'S', 3, 'M', 2, 'W', index + 1].join(''))),
  required_component_checks: Object.freeze([
    'architecture --work-items-check',
    'architecture --work-items-first-slice-check',
    'architecture --work-items-bundle-parity-check',
    'architecture --work-items-runtime-bridge-check',
    'architecture --work-items-installed-fallback-check',
    'architecture --claims-check',
    'architecture --claims-first-slice-check',
    'architecture --claims-bundle-parity-check',
    'architecture --claims-runtime-bridge-check',
    'architecture --claims-installed-fallback-check'
  ]),
  next_scope: Object.freeze([
    Object.freeze({ id: ['P', 1, 'S', 3, 'M', 3, 'W', 1].join(''), title: 'Public CLI runtime de-monolith planning gate', expected_status: 'closed' })
  ]),
  boundary: Object.freeze({
    source_domain_closure_review_command_writes_files: false,
    source_domain_closure_check_command_writes_files: false,
    creates_source_modules: false,
    moves_existing_source_files: false,
    exports_source_module_as_public_api: false,
    changes_public_cli_outputs: false,
    changes_cli_runtime_dependency_graph: false,
    package_allowlist_unchanged: true,
    source_modules_remain_out_of_npm_pack: true,
    writes_package_root: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false
  })
});

  return Object.freeze({
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW
  });
}

module.exports = Object.freeze({
  createPublicClaimsSourceCatalog
});
