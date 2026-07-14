'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureWorkItemsSourceDomainRuntimeBridgeService(deps) {
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

  const { bundledWorkItemsDomainForParity, publicWorkItemsDomainSourceExtractionBundleParityCheck } = deps;

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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureWorkItemsSourceDomainRuntimeBridgeService missing dependency: ${name}`);
  }


  function resolveWorkItemsDomainRuntimeBridge(root = packageRoot()) {
    const context = sourceContext(root);
    const modulePath = path.join(root, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module);
    const sourceModulePresent = fs.existsSync(modulePath);
    const bundledWorkItems = bundledWorkItemsDomainForParity(root);
    if (sourceModulePresent) {
      try {
        const loaded = require(modulePath);
        const value = loaded && typeof loaded.getWorkItemsDomainFirstSlice === 'function'
          ? loaded.getWorkItemsDomainFirstSlice()
          : loaded && loaded.WORK_ITEMS_DOMAIN_FIRST_SLICE;
        if (!value || value.schema !== 'agent-onboard-public-source-module-work-items-first-slice-001') {
          return {
            status: 'error',
            context: context.package_context,
            mode: 'source_module_invalid',
            source_module_present: true,
            source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
            module_value: value || null,
            bundled_work_items_view: bundledWorkItems,
            errors: [`${PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} did not export a valid work-items first-slice contract`]
          };
        }
        return {
          status: 'ok',
          context: context.package_context,
          mode: 'source_module_loaded',
          source_module_present: true,
          source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: value,
          bundled_work_items_view: bundledWorkItems,
          errors: []
        };
      } catch (error) {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_load_failed',
          source_module_present: true,
          source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: null,
          bundled_work_items_view: bundledWorkItems,
          errors: [`${PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
        };
      }
    }
    return {
      status: 'ok',
      context: context.package_context,
      mode: 'bundled_fallback',
      source_module_present: false,
      source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
      module_value: null,
      bundled_work_items_view: bundledWorkItems,
      errors: []
    };
  }


  function publicWorkItemsDomainSourceExtractionRuntimeBridge(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const bridge = resolveWorkItemsDomainRuntimeBridge(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    return {
      schema: 'agent-onboard-public-source-module-work-items-runtime-bridge-result-001',
      status: bridge.status,
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      runtime_bridge_file: gate.runtime_bridge_file,
      runtime_bridge_file_present: fs.existsSync(path.join(root, gate.runtime_bridge_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      runtime_bridge_resolution: bridge,
      runtime_bridge_contract: gate,
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


  function publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionRuntimeBridge(root);
    const bundleParity = publicWorkItemsDomainSourceExtractionBundleParityCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    const errors = [];
    if (bundleParity.status !== 'ok') errors.push(...bundleParity.errors.map((error) => `work-items bundle parity: ${error}`));
    if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.bridge_status !== 'work_items_source_context_optional_runtime_bridge_applied') errors.push('work-items runtime bridge status must remain work_items_source_context_optional_runtime_bridge_applied');
    if (gate.boundary.work_items_runtime_bridge_command_writes_files !== false) errors.push('architecture --work-items-runtime-bridge must remain no-write');
    if (gate.boundary.work_items_runtime_bridge_check_command_writes_files !== false) errors.push('architecture --work-items-runtime-bridge-check must remain no-write');
    if (gate.boundary.source_context_optional_require_only !== true) errors.push('work-items runtime bridge must use source-context optional require only');
    if (gate.boundary.installed_context_fallback_required !== true) errors.push('work-items runtime bridge must preserve installed-package fallback');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items runtime bridge must keep claim and close excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('work-items runtime bridge gate must preserve package allowlist');

    let bridgeFileStatus = 'not_present_installed_context_allowed';
    let bridgeFileSchema = null;
    if (result.runtime_bridge_file_present) {
      try {
        const bridgeFile = readJson(path.join(root, result.runtime_bridge_file));
        bridgeFileSchema = bridgeFile.schema || null;
        if (bridgeFile.schema !== gate.schema) errors.push(`${result.runtime_bridge_file} schema must be ${gate.schema}`);
        if (bridgeFile.source_module !== gate.source_module) errors.push(`${result.runtime_bridge_file} source_module must be ${gate.source_module}`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.runtime_bridge_file} must allow installed context fallback`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.includes_claim_and_close_commands !== false) errors.push(`${result.runtime_bridge_file} must keep claim and close excluded`);
        if (!bridgeFile.boundary || bridgeFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.runtime_bridge_file} must preserve package_allowlist_unchanged`);
        bridgeFileStatus = 'present_validated';
      } catch (error) {
        bridgeFileStatus = 'present_invalid_json';
        errors.push(`${result.runtime_bridge_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      bridgeFileStatus = 'missing_source_context';
      errors.push(`${result.runtime_bridge_file} must be present in source repository context`);
    }

    const resolved = result.runtime_bridge_resolution;
    const installedFallbackAllowed = result.package_context === 'installed_package' && resolved.mode === 'bundled_fallback';
    const sourceLoadExpected = result.package_context === 'source_repository' && result.source_module_present;
    const sourceLoadedWhenPresent = sourceLoadExpected ? resolved.mode === 'source_module_loaded' : true;
    const fallbackWhenMissing = !result.source_module_present ? resolved.mode === 'bundled_fallback' : true;
    const source = resolved.module_value || null;
    const bundled = resolved.bundled_work_items_view;
    const domainParity = !source || source.domain === bundled.domain;
    const facadeParity = !source || source.facade === bundled.facade;
    const schemaParity = !source || source.schema_id === bundled.schema_id;
    const stateFileParity = !source || arrayEquals(source.state_files || [], bundled.state_files);
    const commandParity = !source || arrayEquals(source.owns_commands || [], bundled.owns_commands);
    const excludedCommandParity = !source || arrayEquals(source.excluded_commands || [], bundled.excluded_commands);
    const readSurfaceParity = !source || arrayEquals(source.read_surfaces || [], bundled.read_surfaces);
    const explicitWriteSurfaceParity = !source || arrayEquals(source.explicit_write_surfaces || [], bundled.explicit_write_surfaces);
    const writeBoundaryParity = !source || (source.writes_files === bundled.writes_files && source.state_writer === bundled.state_writer && source.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const claimCloseExcluded = !source || (source.includes_claims_domain_behavior === false && arrayEquals(source.excluded_commands || [], bundled.excluded_commands));

    if (!sourceLoadedWhenPresent) errors.push('work-items runtime bridge must load the source work-items slice when present in source repository context');
    if (!fallbackWhenMissing) errors.push('work-items runtime bridge must fall back to bundled work-items view when source module is missing');
    if (!domainParity) errors.push('work-items runtime bridge source domain must match bundled work-items domain');
    if (!facadeParity) errors.push('work-items runtime bridge source facade must match bundled work-items facade');
    if (!schemaParity) errors.push('work-items runtime bridge source schema id must match bundled work-items schema id');
    if (!stateFileParity) errors.push('work-items runtime bridge source state files must match bundled work-items state files');
    if (!commandParity) errors.push('work-items runtime bridge source commands must match bundled work-items commands');
    if (!excludedCommandParity) errors.push('work-items runtime bridge source excluded commands must match bundled work-items exclusions');
    if (!readSurfaceParity) errors.push('work-items runtime bridge source read surfaces must match bundled work-items read surfaces');
    if (!explicitWriteSurfaceParity) errors.push('work-items runtime bridge source explicit write surfaces must match bundled work-items surfaces');
    if (!writeBoundaryParity) errors.push('work-items runtime bridge source write boundary must match bundled work-items view');
    if (!claimCloseExcluded) errors.push('work-items runtime bridge must keep claim and close behavior excluded');

    return {
      schema: 'agent-onboard-public-source-module-work-items-runtime-bridge-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        work_items_bundle_parity: bundleParity.status === 'ok',
        work_items_runtime_bridge_status: gate.bridge_status === 'work_items_source_context_optional_runtime_bridge_applied',
        source_module_loaded_when_present: sourceLoadedWhenPresent,
        bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
        installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
        source_domain_matches_bundled_work_items: domainParity,
        source_facade_matches_bundled_work_items: facadeParity,
        source_schema_matches_bundled_work_items: schemaParity,
        source_state_files_match_bundled_work_items: stateFileParity,
        source_commands_match_bundled_work_items: commandParity,
        source_exclusions_match_bundled_work_items: excludedCommandParity,
        source_read_surfaces_match_bundled_work_items: readSurfaceParity,
        source_write_surfaces_match_bundled_work_items: explicitWriteSurfaceParity,
        source_write_boundary_matches_bundled_work_items: writeBoundaryParity,
        claim_and_close_commands_excluded: claimCloseExcluded,
        work_items_runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
        work_items_runtime_bridge_commands_no_write: gate.boundary.work_items_runtime_bridge_command_writes_files === false && gate.boundary.work_items_runtime_bridge_check_command_writes_files === false,
        public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      runtime_bridge_resolution: resolved,
      source_work_items_runtime_bridge_file: {
        path: result.runtime_bridge_file,
        present: result.runtime_bridge_file_present,
        status: bridgeFileStatus,
        schema: bridgeFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_work_items_bundle_parity: {
        status: bundleParity.status,
        errors: bundleParity.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  return Object.freeze({
    resolveWorkItemsDomainRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainRuntimeBridgeService
});
