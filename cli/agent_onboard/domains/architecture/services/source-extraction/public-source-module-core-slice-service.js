'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceModuleCoreSliceService(deps) {
  const {
    version: VERSION,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceModuleExtractionFirstSlice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    publicSourceModuleExtractionBundleParity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicArchitectureMap,
    publicCommandRouter,
    publicSourceModuleExtractionAdapterBoundaryCheck
  } = deps;

  for (const [name, value] of Object.entries({
    version: VERSION,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceModuleExtractionFirstSlice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    publicSourceModuleExtractionBundleParity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicArchitectureMap,
    publicCommandRouter,
    publicSourceModuleExtractionAdapterBoundaryCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceModuleCoreSliceService missing dependency: ${name}`);
  }

function loadCoreFirstSliceModule(root = packageRoot()) {
  const modulePath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.source_module);
  if (!fs.existsSync(modulePath)) return null;
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function publicSourceModuleExtractionFirstSlice(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const firstSliceFile = PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.first_slice_file;
  const sourceModule = PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.source_module;
  let module_exports = [];
  let module_value = null;
  let module_load_error = null;
  try {
    const loaded = loadCoreFirstSliceModule(root);
    if (loaded) {
      module_exports = Object.keys(loaded).sort();
      if (typeof loaded.getCoreDomainFirstSlice === 'function') {
        module_value = loaded.getCoreDomainFirstSlice();
      } else if (loaded.CORE_DOMAIN_FIRST_SLICE) {
        module_value = loaded.CORE_DOMAIN_FIRST_SLICE;
      }
    }
  } catch (error) {
    module_load_error = error && error.message ? error.message : String(error);
  }
  return {
    schema: 'agent-onboard-public-source-module-extraction-first-slice-result-001',
    status: module_load_error ? 'error' : 'ok',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    first_slice_file: firstSliceFile,
    first_slice_file_present: fs.existsSync(path.join(root, firstSliceFile)),
    source_module: sourceModule,
    source_module_present: fs.existsSync(path.join(root, sourceModule)),
    source_module_exports: module_exports,
    source_module_value: module_value,
    source_module_load_error: module_load_error,
    first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
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

function publicSourceModuleExtractionFirstSliceCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionFirstSlice(root);
  const adapter = publicSourceModuleExtractionAdapterBoundaryCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const expectedExports = PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.expected_module_export_names.slice().sort();
  const expectedDomain = PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.extracted_domain;
  const errors = [];
  if (adapter.status !== 'ok') errors.push(...adapter.errors.map((error) => `adapter boundary: ${error}`));
  if (result.status !== 'ok') errors.push(`first slice module load failed: ${result.source_module_load_error}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.first_slice_status !== 'source_only_shadow_module_applied') errors.push('first slice status must be source_only_shadow_module_applied');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.extracted_domain.id !== 'core') errors.push('first slice must extract the core domain first');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.created_source_module !== 'src/domains/core.js') errors.push('first slice created source module must be src/domains/core.js');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.creates_exactly_one_source_module !== true) errors.push('first slice must create exactly one source module');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.creates_non_core_source_modules !== false) errors.push('first slice must not create non-core source modules');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.moves_existing_source_files !== false) errors.push('first slice must not move existing source files');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.changes_runtime_outputs !== false) errors.push('first slice must not change runtime outputs');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('first slice must not make CLI runtime require source modules');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.exports_source_module_as_public_api !== false) errors.push('first slice must not expose source module as public import API');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.first_slice_command_writes_files !== false) errors.push('architecture --first-slice must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.first_slice_check_command_writes_files !== false) errors.push('architecture --first-slice-check must remain no-write');

  let firstSliceFileStatus = 'not_present_installed_context_allowed';
  let firstSliceFileSchema = null;
  if (result.first_slice_file_present) {
    try {
      const firstSliceFile = readJson(path.join(root, result.first_slice_file));
      firstSliceFileSchema = firstSliceFile.schema || null;
      if (firstSliceFile.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.schema) errors.push(`${result.first_slice_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.schema}`);
      if (!firstSliceFile.extracted_domain || firstSliceFile.extracted_domain.id !== 'core') errors.push(`${result.first_slice_file} must declare extracted_domain.id core`);
      if (firstSliceFile.source_module !== 'src/domains/core.js') errors.push(`${result.first_slice_file} source_module must be src/domains/core.js`);
      firstSliceFileStatus = 'present_validated';
    } catch (error) {
      firstSliceFileStatus = 'present_invalid_json';
      errors.push(`${result.first_slice_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    firstSliceFileStatus = 'missing_source_context';
    errors.push(`${result.first_slice_file} must be present in source repository context`);
  }

  let sourceModuleStatus = 'not_present_installed_context_allowed';
  const moduleValue = result.source_module_value || {};
  const moduleExportsSorted = result.source_module_exports.slice().sort();
  if (result.source_module_present) {
    if (!arrayEquals(moduleExportsSorted, expectedExports)) errors.push(`${result.source_module} exports must be ${expectedExports.join(', ')}`);
    if (moduleValue.schema !== 'agent-onboard-public-source-module-core-first-slice-001') errors.push(`${result.source_module} must export core first-slice schema`);
    if (moduleValue.domain !== expectedDomain.id) errors.push(`${result.source_module} domain must be ${expectedDomain.id}`);
    if (moduleValue.facade !== expectedDomain.facade) errors.push(`${result.source_module} facade must be ${expectedDomain.facade}`);
    if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
    if (moduleValue.runtime_dependency_status !== expectedDomain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
    if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
    if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
    sourceModuleStatus = 'present_validated';
  } else if (result.package_context === 'source_repository') {
    sourceModuleStatus = 'missing_source_context';
    errors.push(`${result.source_module} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-first-slice-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.check_command,
    package_root: root,
    validated: {
      adapter_boundary: adapter.status === 'ok',
      first_slice_status: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.first_slice_status === 'source_only_shadow_module_applied',
      extracted_domain_is_core: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.extracted_domain.id === 'core',
      source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
      first_slice_file_present_or_installed_context_allowed: firstSliceFileStatus === 'present_validated' || firstSliceFileStatus === 'not_present_installed_context_allowed',
      source_module_exports: arrayEquals(moduleExportsSorted, expectedExports) || sourceModuleStatus === 'not_present_installed_context_allowed',
      source_module_matches_core_facade: sourceModuleStatus === 'not_present_installed_context_allowed' || (moduleValue.domain === expectedDomain.id && moduleValue.facade === expectedDomain.facade),
      source_module_not_public_api: sourceModuleStatus === 'not_present_installed_context_allowed' || moduleValue.exports_public_api === false,
      source_module_read_only: sourceModuleStatus === 'not_present_installed_context_allowed' || (moduleValue.writes_files === false && moduleValue.state_writer === false),
      exactly_one_source_module_created: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.creates_exactly_one_source_module === true && PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.creates_non_core_source_modules === false,
      runtime_outputs_unchanged_by_gate: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.changes_runtime_outputs === false,
      cli_runtime_dependency_graph_unchanged: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.changes_cli_runtime_dependency_graph === false,
      first_slice_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.first_slice_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE.boundary.first_slice_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    expected_domain: expectedDomain,
    source_module: {
      path: result.source_module,
      present: result.source_module_present,
      status: sourceModuleStatus,
      exports: result.source_module_exports,
      value: result.source_module_value,
      source_context_required: result.package_context === 'source_repository'
    },
    source_first_slice_file: {
      path: result.first_slice_file,
      present: result.first_slice_file_present,
      status: firstSliceFileStatus,
      schema: firstSliceFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_adapter_boundary: {
      status: adapter.status,
      errors: adapter.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}


function bundledCoreDomainForParity(root = packageRoot()) {
  const map = publicArchitectureMap(root);
  const router = publicCommandRouter(root);
  const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'core');
  const domain = map.map.canonical_domains.find((item) => item.id === 'core');
  const coreRoutes = router.router.routes.filter((route) => route.domain === 'core').map((route) => route.command);
  return {
    schema: 'agent-onboard-public-bundled-core-domain-view-001',
    domain: domain ? domain.id : null,
    facade: facade ? facade.service : null,
    service: facade ? facade.service : null,
    source: 'cli/agent-onboard.js',
    owns_commands: coreRoutes,
    writes_files: false,
    state_writer: false,
    state_files: domain ? domain.state_files.slice() : [],
    package_context: sourceContext(root).package_context
  };
}

function publicSourceModuleExtractionBundleParity(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const firstSlice = publicSourceModuleExtractionFirstSlice(root);
  const bundledCore = bundledCoreDomainForParity(root);
  return {
    schema: 'agent-onboard-public-source-module-extraction-bundle-parity-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    bundle_parity_file: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.bundle_parity_file,
    bundle_parity_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.bundle_parity_file)),
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.source_module,
    source_module_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.source_module)),
    source_slice_value: firstSlice.source_module_value,
    bundled_core_view: bundledCore,
    bundle_parity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
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

function publicSourceModuleExtractionBundleParityCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionBundleParity(root);
  const firstSlice = publicSourceModuleExtractionFirstSliceCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `first slice: ${error}`));
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.parity_status !== 'source_slice_matches_bundled_cli_view') errors.push('bundle parity status must remain source_slice_matches_bundled_cli_view');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.bundle_parity_command_writes_files !== false) errors.push('architecture --bundle-parity must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.bundle_parity_check_command_writes_files !== false) errors.push('architecture --bundle-parity-check must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.creates_bundle_artifact !== false) errors.push('bundle parity gate must not create bundle artifacts');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.changes_runtime_outputs !== false) errors.push('bundle parity gate must not change runtime outputs');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('bundle parity gate must not change CLI runtime dependency graph');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.package_allowlist_unchanged !== true) errors.push('bundle parity gate must preserve package allowlist');

  let bundleParityFileStatus = 'not_present_installed_context_allowed';
  let bundleParityFileSchema = null;
  if (result.bundle_parity_file_present) {
    try {
      const bundleParityFile = readJson(path.join(root, result.bundle_parity_file));
      bundleParityFileSchema = bundleParityFile.schema || null;
      if (bundleParityFile.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.schema) errors.push(`${result.bundle_parity_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.schema}`);
      if (bundleParityFile.source_module !== PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.source_module) errors.push(`${result.bundle_parity_file} source_module must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.source_module}`);
      if (!bundleParityFile.boundary || bundleParityFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.bundle_parity_file} must preserve package_allowlist_unchanged`);
      bundleParityFileStatus = 'present_validated';
    } catch (error) {
      bundleParityFileStatus = 'present_invalid_json';
      errors.push(`${result.bundle_parity_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    bundleParityFileStatus = 'missing_source_context';
    errors.push(`${result.bundle_parity_file} must be present in source repository context`);
  }

  const sourceSlice = result.source_slice_value || null;
  const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
  const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], result.bundled_core_view.owns_commands));
  const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === result.bundled_core_view.domain);
  const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === result.bundled_core_view.facade);
  const writeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === result.bundled_core_view.writes_files && sourceSlice.state_writer === result.bundled_core_view.state_writer);
  if (!domainParity) errors.push('source slice domain must match bundled core domain view');
  if (!facadeParity) errors.push('source slice facade must match bundled core facade view');
  if (!commandParity) errors.push('source slice owned commands must match bundled core command routes');
  if (!writeParity) errors.push('source slice read/write boundary must match bundled core view');

  return {
    schema: 'agent-onboard-public-source-module-extraction-bundle-parity-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.check_command,
    package_root: root,
    validated: {
      first_slice: firstSlice.status === 'ok',
      bundle_parity_status: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.parity_status === 'source_slice_matches_bundled_cli_view',
      source_slice_domain_matches_bundled_core: domainParity,
      source_slice_facade_matches_bundled_core: facadeParity,
      source_slice_commands_match_bundled_router: commandParity,
      source_slice_write_boundary_matches_bundled_core: writeParity,
      source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
      bundle_parity_file_present_or_installed_context_allowed: bundleParityFileStatus === 'present_validated' || bundleParityFileStatus === 'not_present_installed_context_allowed',
      bundle_parity_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.bundle_parity_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.bundle_parity_check_command_writes_files === false,
      runtime_outputs_unchanged_by_gate: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.changes_runtime_outputs === false,
      cli_runtime_dependency_graph_unchanged: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    source_slice: result.source_slice_value,
    bundled_core_view: result.bundled_core_view,
    source_bundle_parity_file: {
      path: result.bundle_parity_file,
      present: result.bundle_parity_file_present,
      status: bundleParityFileStatus,
      schema: bundleParityFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_first_slice: {
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
    loadCoreFirstSliceModule,
    publicSourceModuleExtractionFirstSlice,
    publicSourceModuleExtractionFirstSliceCheck,
    bundledCoreDomainForParity,
    publicSourceModuleExtractionBundleParity,
    publicSourceModuleExtractionBundleParityCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleCoreSliceService
});
