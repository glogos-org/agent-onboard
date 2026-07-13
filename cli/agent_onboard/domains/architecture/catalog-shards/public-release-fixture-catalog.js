'use strict';

function createPublicReleaseFixtureCatalog({ PUBLIC_RELEASE_CONTRACT } = Object.freeze({})) {
const PUBLIC_RELEASE_FIXTURE_MATRIX = Object.freeze({
  schema: 'agent-onboard-public-release-fixture-matrix-022',
  title: 'Agent-Onboard Public Package Contract Fixture Matrix',
  package_name: 'agent-onboard',
  release_line: PUBLIC_RELEASE_CONTRACT.release_line,
  contract_schema: PUBLIC_RELEASE_CONTRACT.schema,
  command: 'agent-onboard release --fixture',
  purpose: 'Declare regression fixtures for package/version/content drift before publish handoff.',
  fixtures: Object.freeze([
    Object.freeze({
      id: 'valid_source_repository_contract',
      expected_status: 'ok',
      validates: Object.freeze(['package_metadata', 'projected_pack_allowlist', 'public_artifact_messaging', 'source_work_items_ledger'])
    }),
    Object.freeze({
      id: 'valid_installed_package_contract',
      expected_status: 'ok',
      validates: Object.freeze(['package_metadata', 'projected_pack_allowlist', 'public_artifact_messaging']),
      expected_source_work_items_ledger_status: 'skipped'
    }),
    Object.freeze({
      id: 'stale_package_version_contract',
      expected_status: 'error',
      detects: 'package.json version drift from runtime version'
    }),
    Object.freeze({
      id: 'pack_allowlist_drift_contract',
      expected_status: 'error',
      detects: 'package.json files array drift from public npm tarball allowlist'
    }),
    Object.freeze({
      id: 'missing_bin_entrypoint_contract',
      expected_status: 'error',
      detects: 'missing CLI bin entrypoint referenced by package.json'
    }),
    Object.freeze({
      id: 'public_artifact_messaging_contract',
      expected_status: 'error',
      detects: 'reserved public artifact messaging token in npm-packed files'
    }),
    Object.freeze({
      id: 'projected_installed_package_parity_smoke',
      expected_status: 'ok',
      validates: Object.freeze(['source_candidate_release_check', 'expected_pack_files_present', 'source_context_excluded_from_pack', 'bin_entrypoints_in_pack', 'runtime_version_matches_package_json']),
      boundary: 'no package-manager execution, no registry mutation, no Git mutation, no temp-file writes'
    }),
    Object.freeze({
      id: 'target_onboarding_dry_run_fixture_matrix',
      expected_status: 'ok',
      validates: Object.freeze(['target onboarding plan no-write fixture', 'target bootstrap dry-run fixture', 'target instance takeover dry-run fixture', 'AGENTS.md preview fixture', 'aggregate explicit write projection', 'conflict and force-preview fixtures']),
      boundary: 'fixture writes no files; explicit write command writes only canonical onboarding files when requested'
    }),
    Object.freeze({
      id: 'target_onboarding_installed_package_smoke',
      expected_status: 'ok',
      validates: Object.freeze(['package release check in current package context', 'target onboarding plan from package runtime', 'target onboarding fixture from package runtime', 'explicit write into temporary target', 'canonical target files only']),
      boundary: 'creates and removes a temporary target repository; does not mutate package root, Git, registry, dependencies, build, test, deploy, publish, or push state'
    }),
    Object.freeze({
      id: 'target_onboarding_post_publish_handoff',
      expected_status: 'ok',
      validates: Object.freeze(['published version metadata command', 'version-pinned npx status command', 'release contract command', 'release fixture command', 'installed package parity smoke command', 'target onboarding smoke command', 'release check command', 'target onboarding plan and fixture commands']),
      boundary: 'handoff emits deterministic operator commands only; it does not query the registry, mutate package root, Git, dependencies, build, deploy, publish, push, or target repository state'
    }),
    Object.freeze({
      id: 'target_onboarding_real_target_repo_trial',
      expected_status: 'ok',
      validates: Object.freeze(['real target repo path inspection', 'target onboarding plan projection', 'dry-run fixture projection', 'canonical write readiness report', 'no-write trial boundary']),
      boundary: 'trial inspects an explicit target path or current directory; it writes no target files, installs no dependencies, runs no Git, and reports conflicts before any explicit onboarding write'
    }),
    Object.freeze({
      id: 'public_architecture_map',
      expected_status: 'ok',
      validates: Object.freeze(['six-domain public architecture kernel', 'runtime flow declaration', 'compact npm package boundary', 'no-write architecture command']),
      boundary: 'architecture map, router, and check are read-only; they do not move files, write source state, mutate Git, install dependencies, publish, or touch target repositories'
    }),
    Object.freeze({
      id: 'public_command_router_boundary',
      expected_status: 'ok',
      validates: Object.freeze(['table-driven top-level command router', 'explicit command aliases', 'nested target route boundary', 'no-write router inspection command']),
      boundary: 'architecture --router is read-only; dispatch remains inside the admitted CLI entrypoint and does not create files, install dependencies, publish, or mutate target repositories'
    }),
    Object.freeze({
      id: 'public_domain_service_facades',
      expected_status: 'ok',
      validates: Object.freeze(['one facade per public domain', 'router routes declare service facade ownership', 'facade command is no-write', 'physical module split remains optional for this gate']),
      boundary: 'architecture --facades is read-only; domain service facade admission does not create files, install dependencies, publish, mutate package root, or mutate target repositories'
    }),
    Object.freeze({
      id: 'public_authority_first_read_index',
      expected_status: 'ok',
      validates: Object.freeze(['canonical first-read order', 'AI-readable llms.txt entrypoint', 'machine-readable authority path index', 'compact authority digest index', 'raw authority on-demand boundary', 'source files stay outside npm package allowlist']),
      boundary: 'authority --first-read, authority --check, authority --index, authority --index-check, authority --state, and authority --state-check are read-only; target onboarding may write first-read authority files only under explicit --write authorization'
    }),
    Object.freeze({
      id: 'public_target_runtime_namespace',
      expected_status: 'ok',
      validates: Object.freeze(['canonical .agent-onboard namespace root', 'runtime namespace file', 'canonical runtime file order', 'reserved future files not written', 'compact npm package boundary']),
      boundary: 'target runtime --namespace and target runtime --check are read-only; target onboarding writes the namespace file only with explicit --write authorization'
    }),
    Object.freeze({
      id: 'public_package_surface_preservation',
      expected_status: 'ok',
      validates: Object.freeze(['four-file npm package surface', 'package.json files allowlist', 'source-only context excluded from pack', 'bin entrypoints remain in pack', 'public artifact messaging guard']),
      boundary: 'release --surface and release --surface-check are read-only; they do not run npm, mutate the registry, write files, install dependencies, run Git, build, test, deploy, publish, or push'
    }),
    Object.freeze({
      id: 'public_installed_parity_architecture_smoke',
      expected_status: 'ok',
      validates: Object.freeze(['installed-like package context accepts missing source-only files', 'architecture check passes from compact package files', 'authority and runtime checks pass from installed context', 'package surface check remains compact']),
      boundary: 'release --architecture-parity-smoke is read-only; it does not create temp files, run npm, mutate registry, write files, install dependencies, run Git, build, test, deploy, publish, or push'
    }),
    Object.freeze({
      id: 'public_source_domain_module_partition_plan',
      expected_status: 'ok',
      validates: Object.freeze(['planned module map covers all six public domains', 'each planned module maps to the admitted facade', 'physical source movement is explicitly not performed by this gate', 'npm package allowlist remains compact']),
      boundary: 'architecture --partition-plan and --partition-check are read-only; they do not create modules, move files, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_domain_extraction_rehearsal',
      expected_status: 'ok',
      validates: Object.freeze(['rehearsal units cover all six public domains', 'each rehearsal unit maps to the admitted facade', 'no physical module is created by this gate', 'golden output scope is declared before source extraction', 'npm package allowlist remains compact']),
      boundary: 'architecture --extraction-rehearsal and --extraction-check are read-only; they do not create modules, move files, change runtime outputs, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_extraction_golden_output_freeze',
      expected_status: 'ok',
      validates: Object.freeze(['golden command order is frozen', 'source extraction rehearsal still passes', 'no physical module is created', 'runtime output change remains disallowed', 'npm package allowlist remains compact']),
      boundary: 'architecture --golden-outputs and --golden-check are read-only; they do not create modules, move files, change runtime outputs, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_adapter_boundary',
      expected_status: 'ok',
      validates: Object.freeze(['CLI adapter boundary is declared', 'adapter units cover all six public domains', 'each adapter unit maps to the admitted facade', 'no physical module is created', 'npm package allowlist remains compact']),
      boundary: 'architecture --adapter-boundary and --adapter-check are read-only; they do not create modules, move files, export source modules as public API, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_first_slice',
      expected_status: 'ok',
      validates: Object.freeze(['the core source-only module slice exists', 'the first slice exports the admitted core metadata contract', 'the slice is not a public import API', 'the CLI runtime dependency graph remains unchanged', 'npm package allowlist remains compact']),
      boundary: 'architecture --first-slice and --first-slice-check are read-only; they do not move existing source files, change runtime outputs, export source modules as public API, expand the npm package allowlist, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_bundle_parity',
      expected_status: 'ok',
      validates: Object.freeze(['the source-only core module output matches the bundled CLI architecture view', 'the parity check is source-aware but installed-package tolerant', 'the source module remains outside the npm allowlist', 'runtime outputs and command routing stay unchanged']),
      boundary: 'architecture --bundle-parity and --bundle-parity-check are read-only; they do not bundle files, move source, change runtime outputs, expand the npm package allowlist, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_runtime_bridge',
      expected_status: 'ok',
      validates: Object.freeze(['the runtime bridge loads the core source module when present in source context', 'installed/package context can fall back to bundled CLI metadata when source modules are absent', 'the source module remains outside the npm allowlist', 'public CLI outputs and package surface stay unchanged']),
      boundary: 'architecture --runtime-bridge and --runtime-bridge-check are read-only; they do not move source, change public CLI outputs, expose source modules as public API, expand the npm package allowlist, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_installed_fallback_smoke',
      expected_status: 'ok',
      validates: Object.freeze(['compact npm tarball omits source modules', 'installed context can use bundled fallback metadata', 'runtime bridge check passes without source module', 'release and architecture checks remain package-compatible']),
      boundary: 'architecture --installed-fallback-smoke and --installed-fallback-check are read-only; they do not install packages, create temp files, move source, expand the npm package allowlist, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_second_slice_plan',
      expected_status: 'ok',
      validates: Object.freeze(['authority is selected as the second source module slice', 'src/domains/authority.js is planned but not created', 'the compact installed package fallback remains valid', '.gitignore tracks source-only extraction artifacts and source modules']),
      boundary: 'architecture --second-slice-plan and --second-slice-check are read-only; they do not create source modules, move source, expand the npm package allowlist, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_second_slice_first_slice',
      expected_status: 'ok',
      validates: Object.freeze(['the authority source-only module slice exists', 'the second slice exports the admitted authority metadata contract', 'write-capable agents command extraction remains excluded', 'the slice is not a public import API', 'npm package allowlist remains compact']),
      boundary: 'architecture --second-slice-first-slice and --second-slice-first-slice-check are read-only; they do not move existing source files, change public CLI outputs, export source modules as public API, expand the npm package allowlist, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_authority_bundle_parity',
      expected_status: 'ok',
      validates: Object.freeze(['the source-only authority module output matches the bundled CLI authority view', 'the parity check is source-aware but installed-package tolerant', 'write-capable agents command extraction remains excluded', 'the authority source module remains outside the npm allowlist', 'runtime outputs and command routing stay unchanged']),
      boundary: 'architecture --authority-bundle-parity and --authority-bundle-parity-check are read-only; they do not bundle files, move source, change public CLI outputs, expand the npm package allowlist, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_source_module_extraction_authority_runtime_bridge',
      expected_status: 'ok',
      validates: Object.freeze(['source context loads authority module', 'installed context uses bundled authority fallback', 'write-capable agents command extraction remains excluded', 'npm package allowlist remains compact']),
      command: 'architecture --authority-runtime-bridge',
      boundary: 'architecture --authority-runtime-bridge and --authority-runtime-bridge-check are read-only; they optionally load src/domains/authority.js in source context, fall back to bundled CLI metadata in installed context, do not extract write-capable agents commands, do not expand the npm package allowlist, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_architecture_m1_closure_m2_seed',
      expected_status: 'ok',
      validates: Object.freeze(['the architecture kernel milestone is closed', 'all architecture-kernel work items are closed', 'the next architecture milestone exists and remains open', 'the transition seed work item is closed', 'the next executable work item is open', 'npm package allowlist remains compact']),
      boundary: 'architecture --m2-seed and --m2-seed-check are read-only; they report and validate the source ledger transition without writing files, creating source modules, expanding npm package files, running Git, publishing, or touching target repository state'
    }),
    Object.freeze({
      id: 'public_work_items_domain_source_extraction_plan',
      expected_status: 'ok',
      validates: Object.freeze(['work_items is selected as the first M2 source-domain extraction candidate', 'src/domains/work-items.js is planned but not created', 'claims-domain behavior remains explicitly excluded', 'the next first-slice work item is seeded open', 'npm package allowlist remains compact']),
      boundary: 'architecture --work-items-plan and --work-items-check are read-only; they do not create source modules, move handlers, change public outputs, expand npm package files, run Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_work_items_domain_source_extraction_first_slice',
      expected_status: 'ok',
      validates: Object.freeze(['src/domains/work-items.js exists as a source-only first slice', 'work-items metadata excludes claim and close behavior', 'the npm package allowlist remains compact']),
      boundary: 'architecture --work-items-first-slice and --work-items-first-slice-check are read-only; the source slice is not a public import API and is excluded from npm package files'
    }),
    Object.freeze({
      id: 'public_work_items_domain_source_extraction_bundle_parity',
      expected_status: 'ok',
      validates: Object.freeze(['the work-items source slice matches the bundled CLI work-items view', 'schema, state file, command-surface, and explicit write-boundary metadata remain equivalent', 'claim and close remain excluded', 'npm package allowlist remains compact']),
      boundary: 'architecture --work-items-bundle-parity and --work-items-bundle-parity-check are read-only; they do not create bundles, move source, change runtime output, expand npm package files, run npm, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_work_items_domain_source_extraction_runtime_bridge',
      expected_status: 'ok',
      validates: Object.freeze(['source context loads work-items module when present', 'installed context falls back to bundled work-items metadata', 'claim and close remain excluded', 'npm package allowlist remains compact']),
      boundary: 'architecture --work-items-runtime-bridge and --work-items-runtime-bridge-check are read-only; they optionally load src/domains/work-items.js in source context, fall back to bundled CLI metadata in installed context, do not extract claim or close commands, and do not expand the npm package allowlist'
    }),

    Object.freeze({
      id: 'public_work_items_domain_source_extraction_installed_fallback_smoke',
      expected_status: 'ok',
      validates: Object.freeze(['installed package context omits src/domains/work-items.js', 'work-items runtime bridge resolves through bundled_fallback when source module is absent', 'claim and close remain excluded', 'npm package allowlist remains compact']),
      boundary: 'architecture --work-items-installed-fallback-smoke and --work-items-installed-fallback-check are read-only; they do not install packages, create temp files, move source, expand the npm package allowlist, mutate Git, publish, or touch target repository state'
    }),
    Object.freeze({
      id: 'public_version_reference_policy',
      expected_status: 'ok',
      validates: Object.freeze(['package.json is the only patch-version source of truth', 'docs avoid hard-coded current package versions', 'tests derive expected version from package.json', 'post-publish output may still emit explicit version-pinned commands']),
      boundary: 'release --version-sprawl-check is read-only; it scans source files and writes no files, publishes nothing, and mutates no registry state'
    })
  ]),
  boundary: Object.freeze({
    writes_files: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false
  })
});

  return Object.freeze({
    PUBLIC_RELEASE_FIXTURE_MATRIX
  });
}

module.exports = Object.freeze({
  createPublicReleaseFixtureCatalog
});
