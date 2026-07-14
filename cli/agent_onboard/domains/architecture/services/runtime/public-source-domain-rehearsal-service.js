'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceDomainRehearsalService(deps) {
  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceDomainModulePartitionPlan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceDomainModulePartitionPlanCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_ARCHITECTURE_MAP,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceDomainModulePartitionPlanCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceDomainRehearsalService missing dependency: ${name}`);
  }

function publicSourceDomainExtractionRehearsal(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const rehearsalFile = PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.rehearsal_file;
  const rehearsalFilePath = path.join(root, rehearsalFile);
  const plannedModulePaths = PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.extraction_rehearsal_units.map((unit) => unit.rehearsal_module);
  return {
    schema: 'agent-onboard-public-source-domain-extraction-rehearsal-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.release_line,
    command: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.command,
    check_command: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    rehearsal_file: rehearsalFile,
    rehearsal_file_present: fs.existsSync(rehearsalFilePath),
    prerequisite_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    planned_module_paths: plannedModulePaths,
    physical_module_paths_present: plannedModulePaths.filter((rel) => fs.existsSync(path.join(root, rel))),
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    boundary: {
      writes_files: false,
      moves_source_files: false,
      creates_source_modules: false,
      changes_runtime_outputs: false,
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

function publicSourceDomainExtractionRehearsalCheck(root = packageRoot()) {
  const result = publicSourceDomainExtractionRehearsal(root);
  const partition = publicSourceDomainModulePartitionPlanCheck(root);
  const expectedDomains = PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id);
  const expectedFacades = new Map(PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => [facade.id, facade.service]));
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const unitDomains = result.rehearsal.extraction_rehearsal_units.map((unit) => unit.domain);
  const errors = [];
  if (partition.status !== 'ok') errors.push(...partition.errors.map((error) => `partition plan: ${error}`));
  if (result.rehearsal.rehearsal_status !== 'rehearsed_not_applied') errors.push('source extraction rehearsal must remain rehearsed_not_applied for this gate');
  if (!arrayEquals(unitDomains, expectedDomains)) errors.push(`source extraction rehearsal units must follow canonical domain order ${expectedDomains.join(', ')}`);
  if (new Set(unitDomains).size !== unitDomains.length) errors.push('source extraction rehearsal unit domains must be unique');
  for (const unit of result.rehearsal.extraction_rehearsal_units) {
    if (!expectedDomains.includes(unit.domain)) errors.push(`source extraction rehearsal unit is not mapped to a canonical domain: ${unit.domain}`);
    if (expectedFacades.has(unit.domain) && unit.facade !== expectedFacades.get(unit.domain)) errors.push(`source extraction rehearsal unit ${unit.domain} must map to facade ${expectedFacades.get(unit.domain)}`);
    if (!String(unit.rehearsal_module || '').startsWith('src/domains/')) errors.push(`source extraction rehearsal module path must stay under src/domains/: ${unit.rehearsal_module}`);
    if (unit.extraction_mode !== 'rehearsal_only_no_file_created') errors.push(`source extraction rehearsal unit ${unit.domain} must be rehearsal_only_no_file_created`);
  }
  const admittedFirstSlicePhysicalModules = ['src/domains/core.js', 'src/domains/authority.js', 'src/domains/work-items.js', 'src/domains/claims.js'];
  const unadmittedPhysicalModules = result.physical_module_paths_present.filter((rel) => !admittedFirstSlicePhysicalModules.includes(rel));
  if (unadmittedPhysicalModules.length > 0) errors.push(`unadmitted physical source modules must not be created by this rehearsal gate: ${unadmittedPhysicalModules.join(', ')}`);
  if (result.rehearsal.entrypoint_preservation.physical_modules_created_by_this_gate !== false) errors.push('source extraction rehearsal must not create physical modules');
  if (result.rehearsal.entrypoint_preservation.runtime_output_change_allowed !== false) errors.push('source extraction rehearsal must not allow runtime output changes');
  if (result.rehearsal.entrypoint_preservation.package_allowlist_change_allowed !== false) errors.push('source extraction rehearsal must not allow package allowlist changes');
  if (result.rehearsal.boundary.extraction_rehearsal_command_writes_files !== false) errors.push('architecture extraction rehearsal command must remain no-write');
  if (result.rehearsal.boundary.extraction_check_command_writes_files !== false) errors.push('architecture extraction check command must remain no-write');
  if (result.rehearsal.boundary.creates_source_modules !== false) errors.push('architecture extraction rehearsal must not create source modules');
  if (result.rehearsal.boundary.moves_source_files !== false) errors.push('architecture extraction rehearsal must not move source files');
  if (result.rehearsal.boundary.changes_runtime_outputs !== false) errors.push('architecture extraction rehearsal must not change runtime outputs');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);

  let sourceRehearsalFileStatus = 'not_present_installed_context_allowed';
  let sourceRehearsalFileSchema = null;
  if (result.rehearsal_file_present) {
    try {
      const sourceRehearsal = readJson(path.join(root, result.rehearsal_file));
      sourceRehearsalFileSchema = sourceRehearsal.schema || null;
      if (sourceRehearsal.schema !== PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.schema) errors.push(`${result.rehearsal_file} schema must be ${PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.schema}`);
      if (sourceRehearsal.rehearsal_status !== 'rehearsed_not_applied') errors.push(`${result.rehearsal_file} must declare rehearsed_not_applied rehearsal status`);
      const fileDomains = Array.isArray(sourceRehearsal.extraction_rehearsal_units) ? sourceRehearsal.extraction_rehearsal_units.map((unit) => unit.domain) : [];
      if (!arrayEquals(fileDomains, expectedDomains)) errors.push(`${result.rehearsal_file} extraction_rehearsal_units must follow canonical domain order ${expectedDomains.join(', ')}`);
      sourceRehearsalFileStatus = 'present_validated';
    } catch (error) {
      sourceRehearsalFileStatus = 'present_invalid_json';
      errors.push(`${result.rehearsal_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    sourceRehearsalFileStatus = 'missing_source_context';
    errors.push(`${result.rehearsal_file} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-domain-extraction-rehearsal-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.release_line,
    command: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.check_command,
    package_root: root,
    validated: {
      partition_plan: partition.status === 'ok',
      rehearsal_unit_count: result.rehearsal.extraction_rehearsal_units.length === expectedDomains.length,
      rehearsal_unit_domain_order: arrayEquals(unitDomains, expectedDomains),
      rehearsal_unit_domains_unique: new Set(unitDomains).size === unitDomains.length,
      rehearsal_units_map_to_facades: result.rehearsal.extraction_rehearsal_units.every((unit) => expectedFacades.has(unit.domain) && unit.facade === expectedFacades.get(unit.domain)),
      no_physical_modules_created: unadmittedPhysicalModules.length === 0,
      runtime_output_change_not_allowed: result.rehearsal.entrypoint_preservation.runtime_output_change_allowed === false && result.rehearsal.boundary.changes_runtime_outputs === false,
      extraction_commands_no_write: result.rehearsal.boundary.extraction_rehearsal_command_writes_files === false && result.rehearsal.boundary.extraction_check_command_writes_files === false && result.rehearsal.boundary.moves_source_files === false && result.rehearsal.boundary.creates_source_modules === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      source_rehearsal_file: sourceRehearsalFileStatus === 'present_validated' || sourceRehearsalFileStatus === 'not_present_installed_context_allowed'
    },
    expected_domain_ids: expectedDomains,
    rehearsal_unit_domains: unitDomains,
    extraction_rehearsal_units: result.rehearsal.extraction_rehearsal_units,
    physical_module_paths_present: result.physical_module_paths_present,
    admitted_physical_module_paths: result.physical_module_paths_present.filter((rel) => admittedFirstSlicePhysicalModules.includes(rel)),
    unadmitted_physical_module_paths: unadmittedPhysicalModules,
    prerequisite_partition_plan: {
      status: partition.status,
      errors: partition.errors
    },
    source_rehearsal_file: {
      path: result.rehearsal_file,
      present: result.rehearsal_file_present,
      status: sourceRehearsalFileStatus,
      schema: sourceRehearsalFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    publicSourceDomainExtractionRehearsal,
    publicSourceDomainExtractionRehearsalCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceDomainRehearsalService
});
