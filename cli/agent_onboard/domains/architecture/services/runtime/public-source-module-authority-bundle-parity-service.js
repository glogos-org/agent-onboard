'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicSourceModuleAuthorityBundleParityService missing dependency: ${name}`);
  return value;
}

function createPublicSourceModuleAuthorityBundleParityService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_DOMAIN_SERVICE_FACADES = required('PUBLIC_DOMAIN_SERVICE_FACADES', options.PUBLIC_DOMAIN_SERVICE_FACADES);
  const PUBLIC_AUTHORITY_FIRST_READ_INDEX = required('PUBLIC_AUTHORITY_FIRST_READ_INDEX', options.PUBLIC_AUTHORITY_FIRST_READ_INDEX);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY = required('PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY', options.PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const publicArchitectureMap = required('publicArchitectureMap', options.publicArchitectureMap);
  const publicSourceModuleExtractionSecondSliceFirstSlice = required('publicSourceModuleExtractionSecondSliceFirstSlice', options.publicSourceModuleExtractionSecondSliceFirstSlice);
  const publicSourceModuleExtractionSecondSliceFirstSliceCheck = required('publicSourceModuleExtractionSecondSliceFirstSliceCheck', options.publicSourceModuleExtractionSecondSliceFirstSliceCheck);

function bundledAuthorityDomainForParity(root = packageRoot()) {
  const map = publicArchitectureMap(root);
  const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'authority');
  const domain = map.map.canonical_domains.find((item) => item.id === 'authority');
  return {
    schema: 'agent-onboard-public-bundled-authority-domain-view-001',
    domain: domain ? domain.id : null,
    facade: facade ? facade.service : null,
    service: facade ? facade.service : null,
    source: 'cli/agent-onboard.js',
    owns_commands: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.expected_owned_commands.slice(),
    excluded_commands: ['agents --write', 'agents --preview'],
    writes_files: false,
    state_writer: false,
    state_files: domain ? domain.state_files.slice() : [],
    read_order_paths: PUBLIC_AUTHORITY_FIRST_READ_INDEX.read_order.map((item) => item.path),
    package_context: sourceContext(root).package_context
  };
}

function publicSourceModuleExtractionAuthorityBundleParity(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const sourceSlice = publicSourceModuleExtractionSecondSliceFirstSlice(root);
  const bundledAuthority = bundledAuthorityDomainForParity(root);
  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-bundle-parity-result-001',
    status: sourceSlice.status,
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    authority_bundle_parity_file: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.authority_bundle_parity_file,
    authority_bundle_parity_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.authority_bundle_parity_file)),
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.source_module,
    source_module_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY.source_module)),
    source_slice_value: sourceSlice.source_module_value,
    source_slice_load_error: sourceSlice.source_module_load_error,
    bundled_authority_view: bundledAuthority,
    authority_bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
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

function publicSourceModuleExtractionAuthorityBundleParityCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionAuthorityBundleParity(root);
  const firstSlice = publicSourceModuleExtractionSecondSliceFirstSliceCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY;
  const errors = [];
  if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `second slice first-slice: ${error}`));
  if (result.status !== 'ok') errors.push(`authority source slice module load failed: ${result.source_slice_load_error}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.parity_status !== 'authority_source_slice_matches_bundled_cli_view') errors.push('authority bundle parity status must remain authority_source_slice_matches_bundled_cli_view');
  if (gate.boundary.authority_bundle_parity_command_writes_files !== false) errors.push('architecture --authority-bundle-parity must remain no-write');
  if (gate.boundary.authority_bundle_parity_check_command_writes_files !== false) errors.push('architecture --authority-bundle-parity-check must remain no-write');
  if (gate.boundary.creates_bundle_artifact !== false) errors.push('authority bundle parity gate must not create bundle artifacts');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('authority bundle parity gate must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('authority bundle parity gate must not change CLI runtime dependency graph');
  if (gate.boundary.includes_write_capable_agents_command !== false) errors.push('authority bundle parity gate must exclude write-capable agents command extraction');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('authority bundle parity gate must preserve package allowlist');

  let parityFileStatus = 'not_present_installed_context_allowed';
  let parityFileSchema = null;
  if (result.authority_bundle_parity_file_present) {
    try {
      const parityFile = readJson(path.join(root, result.authority_bundle_parity_file));
      parityFileSchema = parityFile.schema || null;
      if (parityFile.schema !== gate.schema) errors.push(`${result.authority_bundle_parity_file} schema must be ${gate.schema}`);
      if (parityFile.source_module !== gate.source_module) errors.push(`${result.authority_bundle_parity_file} source_module must be ${gate.source_module}`);
      if (parityFile.parity_status !== gate.parity_status) errors.push(`${result.authority_bundle_parity_file} parity_status must be ${gate.parity_status}`);
      if (!parityFile.boundary || parityFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.authority_bundle_parity_file} must preserve package_allowlist_unchanged`);
      if (!parityFile.boundary || parityFile.boundary.includes_write_capable_agents_command !== false) errors.push(`${result.authority_bundle_parity_file} must exclude write-capable agents command extraction`);
      parityFileStatus = 'present_validated';
    } catch (error) {
      parityFileStatus = 'present_invalid_json';
      errors.push(`${result.authority_bundle_parity_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    parityFileStatus = 'missing_source_context';
    errors.push(`${result.authority_bundle_parity_file} must be present in source repository context`);
  }

  const sourceSlice = result.source_slice_value || null;
  const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
  const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], result.bundled_authority_view.owns_commands));
  const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === result.bundled_authority_view.domain);
  const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === result.bundled_authority_view.facade);
  const readOrderParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.read_order_paths || [], result.bundled_authority_view.read_order_paths));
  const excludedAgentsParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.includes_write_capable_agents_command === false && arrayEquals(sourceSlice.excluded_commands || [], result.bundled_authority_view.excluded_commands));
  const writeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === result.bundled_authority_view.writes_files && sourceSlice.state_writer === result.bundled_authority_view.state_writer);
  if (!domainParity) errors.push('authority source slice domain must match bundled authority domain view');
  if (!facadeParity) errors.push('authority source slice facade must match bundled authority facade view');
  if (!commandParity) errors.push('authority source slice owned commands must match bundled authority command routes');
  if (!readOrderParity) errors.push('authority source slice read order must match bundled first-read index');
  if (!excludedAgentsParity) errors.push('authority source slice must exclude write-capable agents commands');
  if (!writeParity) errors.push('authority source slice read/write boundary must match bundled authority view');

  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-bundle-parity-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    validated: {
      second_slice_first_slice: firstSlice.status === 'ok',
      authority_bundle_parity_status: gate.parity_status === 'authority_source_slice_matches_bundled_cli_view',
      source_slice_domain_matches_bundled_authority: domainParity,
      source_slice_facade_matches_bundled_authority: facadeParity,
      source_slice_commands_match_bundled_authority: commandParity,
      source_slice_read_order_matches_bundled_first_read: readOrderParity,
      write_capable_agents_command_excluded: excludedAgentsParity,
      source_slice_write_boundary_matches_bundled_authority: writeParity,
      source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
      authority_bundle_parity_file_present_or_installed_context_allowed: parityFileStatus === 'present_validated' || parityFileStatus === 'not_present_installed_context_allowed',
      authority_bundle_parity_commands_no_write: gate.boundary.authority_bundle_parity_command_writes_files === false && gate.boundary.authority_bundle_parity_check_command_writes_files === false,
      public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
      cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    source_slice: result.source_slice_value,
    bundled_authority_view: result.bundled_authority_view,
    source_authority_bundle_parity_file: {
      path: result.authority_bundle_parity_file,
      present: result.authority_bundle_parity_file_present,
      status: parityFileStatus,
      schema: parityFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_second_slice_first_slice: {
      status: firstSlice.status,
      errors: firstSlice.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleAuthorityBundleParityService
});
