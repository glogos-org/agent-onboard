'use strict';

const WORK_ITEMS_DOMAIN_FIRST_SLICE = Object.freeze({
  schema: 'agent-onboard-public-source-module-work-items-first-slice-001',
  domain: 'work_items',
  facade: 'workItemsService',
  service: 'workItemsService',
  source_module: 'src/domains/work-items.js',
  slice_status: 'source_only_shadow_module_applied',
  runtime_dependency_status: 'not_required_by_published_cli_runtime',
  extraction_scope: 'work item vocabulary, schema/view metadata, list/read validation surface, and explicit init/append write-boundary metadata only; claim and close behavior remains excluded for a later claims-domain gate',
  exports_public_api: false,
  includes_claims_domain_behavior: false,
  owns_commands: Object.freeze([
    'work-items --schema',
    'work-items --template',
    'work-items --validate-template',
    'work-items --validate',
    'work-items --list',
    'work-items --init',
    'work-items --append'
  ]),
  excluded_commands: Object.freeze([
    'work-items --claim',
    'work-items --close'
  ]),
  writes_files: false,
  state_writer: false,
  declares_explicit_write_boundaries: true,
  state_files: Object.freeze(['.agent-onboard/work-items.json']),
  schema_id: 'agent-onboard-target-work-items-001',
  vocabulary_prefixes: Object.freeze({
    program: 'P',
    stage: 'S',
    milestone: 'M',
    work_item: 'W'
  }),
  read_surfaces: Object.freeze([
    'schema',
    'template',
    'validate-template',
    'validate',
    'list'
  ]),
  explicit_write_surfaces: Object.freeze([
    'work-items --init --write [--force]',
    'work-items --append --write --id <public-work-item-id> --title <title>'
  ]),
  output_contract: Object.freeze([
    'work item IDs keep the P/S/M/W public vocabulary',
    'source module is a shadow metadata slice, not a public import API',
    'claim and close remain excluded until a claims-domain extraction gate',
    'published CLI runtime may omit this source module and use bundled metadata fallback'
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
    public_import_api: false,
    package_allowlist_unchanged: true
  })
});

function cloneFrozen(value) {
  return JSON.parse(JSON.stringify(value));
}

function getWorkItemsDomainFirstSlice() {
  return cloneFrozen(WORK_ITEMS_DOMAIN_FIRST_SLICE);
}

module.exports = {
  WORK_ITEMS_DOMAIN_FIRST_SLICE,
  getWorkItemsDomainFirstSlice
};
