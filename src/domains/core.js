'use strict';

const CORE_DOMAIN_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-core-first-slice-001',
  domain: 'core',
  facade: 'coreService',
  service: 'coreService',
  source_module: 'src/domains/core.js',
  slice_status: 'source_only_shadow_module',
  runtime_dependency_status: 'not_required_by_published_cli_runtime',
  exports_public_api: false,
  owns_commands: Object.freeze(['help', 'version', 'status', 'architecture']),
  writes_files: false,
  state_writer: false,
  state_files: Object.freeze([]),
  output_contract: Object.freeze([
    'status output reads package.json version at runtime',
    'help and version remain CLI adapter outputs',
    'architecture commands remain read-only metadata outputs'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    writes_source_state: false,
    writes_target_repository_state: false,
    git_mutation: false,
    installs_dependencies: false,
    runs_package_manager: false,
    runs_build_test_deploy: false,
    publishes_package: false,
    mutates_registry: false,
    public_import_api: false
  })
});

function cloneFrozen(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCoreDomainFirstSlice() {
  return cloneFrozen(CORE_DOMAIN_FIRST_SLICE);
}

module.exports = {
  CORE_DOMAIN_FIRST_SLICE,
  getCoreDomainFirstSlice
};
