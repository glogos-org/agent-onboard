'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceModuleAdapterBoundaryService(deps) {
  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceModuleExtractionAdapterBoundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceExtractionGoldenOutputFreezeCheck
  } = deps;

  for (const [name, value] of Object.entries({
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceModuleExtractionAdapterBoundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceExtractionGoldenOutputFreezeCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceModuleAdapterBoundaryService missing dependency: ${name}`);
  }

function publicSourceModuleExtractionAdapterBoundary(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const boundaryFile = PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.boundary_file;
  return {
    schema: 'agent-onboard-public-source-module-extraction-adapter-boundary-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    boundary_file: boundaryFile,
    boundary_file_present: fs.existsSync(path.join(root, boundaryFile)),
    adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
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

function publicSourceModuleExtractionAdapterBoundaryCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionAdapterBoundary(root);
  const golden = publicSourceExtractionGoldenOutputFreezeCheck(root);
  const expectedDomains = PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id);
  const expectedFacades = new Map(PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => [facade.id, facade.service]));
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const unitDomains = result.adapter_boundary.adapter_units.map((unit) => unit.domain);
  const errors = [];
  if (golden.status !== 'ok') errors.push(...golden.errors.map((error) => `golden outputs: ${error}`));
  if (result.adapter_boundary.adapter_status !== 'declared_before_physical_extraction') errors.push('adapter status must be declared_before_physical_extraction');
  if (!arrayEquals(unitDomains, expectedDomains)) errors.push(`adapter unit domains must match ${expectedDomains.join(', ')}`);
  if (new Set(unitDomains).size !== unitDomains.length) errors.push('adapter unit domains must be unique');
  if (!result.adapter_boundary.adapter_units.every((unit) => expectedFacades.has(unit.domain) && unit.facade === expectedFacades.get(unit.domain))) errors.push('every adapter unit must map to the admitted service facade');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (result.adapter_boundary.published_adapter.path !== 'cli/agent-onboard.js') errors.push('published adapter must remain cli/agent-onboard.js');
  if (result.adapter_boundary.published_adapter.remains_only_published_bin_target !== true) errors.push('CLI adapter must remain the only published bin target');
  if (result.adapter_boundary.boundary.adapter_boundary_command_writes_files !== false) errors.push('architecture --adapter-boundary must remain no-write');
  if (result.adapter_boundary.boundary.adapter_check_command_writes_files !== false) errors.push('architecture --adapter-check must remain no-write');
  if (result.adapter_boundary.boundary.creates_source_modules !== false) errors.push('adapter boundary gate must not create source modules');
  if (result.adapter_boundary.boundary.moves_source_files !== false) errors.push('adapter boundary gate must not move source files');
  if (result.adapter_boundary.boundary.changes_runtime_outputs !== false) errors.push('adapter boundary gate must not change runtime outputs');
  if (result.adapter_boundary.boundary.publishes_source_modules_as_public_api !== false) errors.push('adapter boundary gate must not expose source modules as public API');

  let boundaryFileStatus = 'not_present_installed_context_allowed';
  let boundaryFileSchema = null;
  if (result.boundary_file_present) {
    try {
      const boundaryFile = readJson(path.join(root, result.boundary_file));
      boundaryFileSchema = boundaryFile.schema || null;
      if (boundaryFile.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.schema) errors.push(`${result.boundary_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.schema}`);
      const fileDomains = Array.isArray(boundaryFile.adapter_units) ? boundaryFile.adapter_units.map((unit) => unit.domain) : [];
      if (!arrayEquals(fileDomains, expectedDomains)) errors.push(`${result.boundary_file} adapter_units must cover ${expectedDomains.join(', ')}`);
      boundaryFileStatus = 'present_validated';
    } catch (error) {
      boundaryFileStatus = 'present_invalid_json';
      errors.push(`${result.boundary_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    boundaryFileStatus = 'missing_source_context';
    errors.push(`${result.boundary_file} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-adapter-boundary-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY.check_command,
    package_root: root,
    validated: {
      golden_outputs_freeze: golden.status === 'ok',
      adapter_status: result.adapter_boundary.adapter_status === 'declared_before_physical_extraction',
      adapter_unit_order: arrayEquals(unitDomains, expectedDomains),
      adapter_units_unique: new Set(unitDomains).size === unitDomains.length,
      adapter_units_map_to_facades: result.adapter_boundary.adapter_units.every((unit) => expectedFacades.has(unit.domain) && unit.facade === expectedFacades.get(unit.domain)),
      published_cli_adapter_preserved: result.adapter_boundary.published_adapter.path === 'cli/agent-onboard.js' && result.adapter_boundary.published_adapter.remains_only_published_bin_target === true,
      no_physical_modules_created: result.adapter_boundary.boundary.creates_source_modules === false,
      runtime_outputs_unchanged_by_gate: result.adapter_boundary.boundary.changes_runtime_outputs === false,
      adapter_commands_no_write: result.adapter_boundary.boundary.adapter_boundary_command_writes_files === false && result.adapter_boundary.boundary.adapter_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      source_adapter_boundary_file: boundaryFileStatus === 'present_validated' || boundaryFileStatus === 'not_present_installed_context_allowed'
    },
    expected_domain_ids: expectedDomains,
    adapter_unit_domains: unitDomains,
    adapter_units: result.adapter_boundary.adapter_units,
    source_adapter_boundary_file: {
      path: result.boundary_file,
      present: result.boundary_file_present,
      status: boundaryFileStatus,
      schema: boundaryFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    prerequisite_golden_outputs: {
      status: golden.status,
      errors: golden.errors
    },
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    publicSourceModuleExtractionAdapterBoundary,
    publicSourceModuleExtractionAdapterBoundaryCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleAdapterBoundaryService
});
