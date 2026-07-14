'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureWorkItemsSourceDomainBundleParityService(deps) {
  const {
    version: VERSION,
    publicDomainServiceFacadesContract: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicWorkItemsDomainSourceExtractionPlan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    publicWorkItemsDomainSourceExtractionFirstSlice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    publicWorkItemsDomainSourceExtractionBundleParity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    publicWorkItemsDomainSourceExtractionRuntimeBridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicArchitectureM1ClosureM2SeedCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicPackageSurfaceCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  } = deps;

  const { publicWorkItemsDomainSourceExtractionFirstSliceFn: publicWorkItemsDomainSourceExtractionFirstSlice, publicWorkItemsDomainSourceExtractionFirstSliceCheck } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicArchitectureM1ClosureM2SeedCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicPackageSurfaceCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureWorkItemsSourceDomainBundleParityService missing dependency: ${name}`);
  }


  function bundledWorkItemsDomainForParity(root = packageRoot()) {
    const map = publicArchitectureMap(root);
    const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'work_items');
    const domain = map.map.canonical_domains.find((item) => item.id === 'work_items');
    return {
      schema: 'agent-onboard-public-bundled-work-items-domain-view-001',
      domain: domain ? domain.id : null,
      facade: facade ? facade.service : null,
      service: facade ? facade.service : null,
      source: 'cli/agent-onboard.js',
      owns_commands: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.expected_owned_commands.slice(),
      excluded_commands: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.excluded_commands.slice(),
      writes_files: false,
      state_writer: false,
      declares_explicit_write_boundaries: true,
      schema_id: 'agent-onboard-target-work-items-001',
      state_files: Object.freeze(['.agent-onboard/work-items.json']).slice(),
      read_surfaces: Object.freeze(['schema', 'template', 'validate-template', 'validate', 'list']).slice(),
      explicit_write_surfaces: Object.freeze([
        'work-items --init --write [--force]',
        'work-items --append --write --id <public-work-item-id> --title <title>'
      ]).slice(),
      package_context: sourceContext(root).package_context
    };
  }


  function publicWorkItemsDomainSourceExtractionBundleParity(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const firstSlice = publicWorkItemsDomainSourceExtractionFirstSlice(root);
    const bundledWorkItems = bundledWorkItemsDomainForParity(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    return {
      schema: 'agent-onboard-public-source-module-work-items-bundle-parity-result-001',
      status: firstSlice.status === 'ok' ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      bundle_parity_file: gate.bundle_parity_file,
      bundle_parity_file_present: fs.existsSync(path.join(root, gate.bundle_parity_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      source_slice_value: firstSlice.source_module_value,
      bundled_work_items_view: bundledWorkItems,
      work_items_bundle_parity: gate,
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


  function publicWorkItemsDomainSourceExtractionBundleParityCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionBundleParity(root);
    const firstSlice = publicWorkItemsDomainSourceExtractionFirstSliceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    const errors = [];
    if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `work-items first slice: ${error}`));
    if (result.status !== 'ok') errors.push('work-items bundle parity depends on a loadable first-slice source module in source context or installed fallback metadata');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.parity_status !== 'work_items_source_slice_matches_bundled_cli_view') errors.push('work-items bundle parity status must remain work_items_source_slice_matches_bundled_cli_view');
    if (gate.boundary.work_items_bundle_parity_command_writes_files !== false) errors.push('architecture --work-items-bundle-parity must remain no-write');
    if (gate.boundary.work_items_bundle_parity_check_command_writes_files !== false) errors.push('architecture --work-items-bundle-parity-check must remain no-write');
    if (gate.boundary.creates_bundle_artifact !== false) errors.push('work-items bundle parity gate must not create bundle artifacts');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('work-items bundle parity gate must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('work-items bundle parity gate must not change CLI runtime dependency graph');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items bundle parity gate must keep claim and close excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('work-items bundle parity gate must preserve package allowlist');

    let bundleParityFileStatus = 'not_present_installed_context_allowed';
    let bundleParityFileSchema = null;
    if (result.bundle_parity_file_present) {
      try {
        const artifact = readJson(path.join(root, result.bundle_parity_file));
        bundleParityFileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${result.bundle_parity_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== gate.source_module) errors.push(`${result.bundle_parity_file} source_module must be ${gate.source_module}`);
        if (artifact.parity_status !== gate.parity_status) errors.push(`${result.bundle_parity_file} parity_status must be ${gate.parity_status}`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${result.bundle_parity_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.includes_claim_and_close_commands !== false) errors.push(`${result.bundle_parity_file} must keep claim and close excluded`);
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
    const bundled = result.bundled_work_items_view;
    const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
    const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === bundled.domain);
    const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === bundled.facade);
    const schemaParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.schema_id === bundled.schema_id);
    const stateFileParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.state_files || [], bundled.state_files));
    const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], bundled.owns_commands));
    const excludedCommandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.excluded_commands || [], bundled.excluded_commands));
    const readSurfaceParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.read_surfaces || [], bundled.read_surfaces));
    const explicitWriteSurfaceParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.explicit_write_surfaces || [], bundled.explicit_write_surfaces));
    const writeBoundaryParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === bundled.writes_files && sourceSlice.state_writer === bundled.state_writer && sourceSlice.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    if (!domainParity) errors.push('work-items source slice domain must match bundled work-items domain view');
    if (!facadeParity) errors.push('work-items source slice facade must match bundled work-items facade view');
    if (!schemaParity) errors.push('work-items source slice schema id must match bundled work-items schema id');
    if (!stateFileParity) errors.push('work-items source slice state files must match bundled work-items state files');
    if (!commandParity) errors.push('work-items source slice owned commands must match bundled work-items command surface');
    if (!excludedCommandParity) errors.push('work-items source slice excluded commands must match bundled work-items exclusions');
    if (!readSurfaceParity) errors.push('work-items source slice read surfaces must match bundled work-items read surfaces');
    if (!explicitWriteSurfaceParity) errors.push('work-items source slice explicit write surfaces must match bundled work-items write-boundary metadata');
    if (!writeBoundaryParity) errors.push('work-items source slice read/write boundary must match bundled work-items view');

    return {
      schema: 'agent-onboard-public-source-module-work-items-bundle-parity-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        first_slice: firstSlice.status === 'ok',
        bundle_parity_status: gate.parity_status === 'work_items_source_slice_matches_bundled_cli_view',
        source_slice_domain_matches_bundled_work_items: domainParity,
        source_slice_facade_matches_bundled_work_items: facadeParity,
        source_slice_schema_matches_bundled_work_items: schemaParity,
        source_slice_state_files_match_bundled_work_items: stateFileParity,
        source_slice_commands_match_bundled_work_items: commandParity,
        source_slice_exclusions_match_bundled_work_items: excludedCommandParity,
        source_slice_read_surfaces_match_bundled_work_items: readSurfaceParity,
        source_slice_write_surfaces_match_bundled_work_items: explicitWriteSurfaceParity,
        source_slice_write_boundary_matches_bundled_work_items: writeBoundaryParity,
        source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
        bundle_parity_file_present_or_installed_context_allowed: bundleParityFileStatus === 'present_validated' || bundleParityFileStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.work_items_bundle_parity_command_writes_files === false && gate.boundary.work_items_bundle_parity_check_command_writes_files === false,
        runtime_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        claim_and_close_commands_excluded: excludedCommandParity
      },
      source_slice: result.source_slice_value,
      bundled_work_items_view: result.bundled_work_items_view,
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
    bundledWorkItemsDomainForParity,
    publicWorkItemsDomainSourceExtractionBundleParity,
    publicWorkItemsDomainSourceExtractionBundleParityCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainBundleParityService
});
