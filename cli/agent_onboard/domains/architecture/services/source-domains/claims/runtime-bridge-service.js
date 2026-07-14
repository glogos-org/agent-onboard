'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureClaimsSourceDomainRuntimeBridgeService(deps) {
  const {
    version: VERSION,
    publicDomainServiceFacadesContract: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicClaimsDomainSourceExtractionPlan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    publicClaimsDomainSourceExtractionFirstSlice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    publicClaimsDomainSourceExtractionBundleParity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    publicClaimsDomainSourceExtractionRuntimeBridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    publicClaimsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicPackageSurfaceCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  } = deps;

  const { bundledClaimsDomainForParity, publicClaimsDomainSourceExtractionBundleParityCheck } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicPackageSurfaceCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureClaimsSourceDomainRuntimeBridgeService missing dependency: ${name}`);
  }


  function resolveClaimsDomainRuntimeBridge(root = packageRoot()) {
    const context = sourceContext(root);
    const modulePath = path.join(root, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module);
    const sourceModulePresent = fs.existsSync(modulePath);
    const bundledClaims = bundledClaimsDomainForParity(root);
    if (sourceModulePresent) {
      try {
        const resolved = require.resolve(modulePath);
        delete require.cache[resolved];
        const loaded = require(resolved);
        const value = loaded && typeof loaded.getClaimsDomainFirstSlice === 'function'
          ? loaded.getClaimsDomainFirstSlice()
          : loaded && loaded.CLAIMS_DOMAIN_FIRST_SLICE;
        if (!value || value.schema !== 'agent-onboard-public-source-module-claims-first-slice-001') {
          return {
            status: 'error',
            context: context.package_context,
            mode: 'source_module_invalid',
            source_module_present: true,
            source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
            module_value: value || null,
            bundled_claims_view: bundledClaims,
            errors: [`${PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} did not export a valid claims first-slice contract`]
          };
        }
        return {
          status: 'ok',
          context: context.package_context,
          mode: 'source_module_loaded',
          source_module_present: true,
          source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: value,
          bundled_claims_view: bundledClaims,
          errors: []
        };
      } catch (error) {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_load_failed',
          source_module_present: true,
          source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: null,
          bundled_claims_view: bundledClaims,
          errors: [`${PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
        };
      }
    }
    return {
      status: 'ok',
      context: context.package_context,
      mode: 'bundled_fallback',
      source_module_present: false,
      source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
      module_value: null,
      bundled_claims_view: bundledClaims,
      errors: []
    };
  }


  function publicClaimsDomainSourceExtractionRuntimeBridge(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const bridge = resolveClaimsDomainRuntimeBridge(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    return {
      schema: 'agent-onboard-public-source-module-claims-runtime-bridge-result-001',
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


  function publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionRuntimeBridge(root);
    const bundleParity = publicClaimsDomainSourceExtractionBundleParityCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    const errors = [];
    if (bundleParity.status !== 'ok') errors.push(...bundleParity.errors.map((error) => `claims bundle parity: ${error}`));
    if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.bridge_status !== 'claims_source_context_optional_runtime_bridge_applied') errors.push('claims runtime bridge status must remain claims_source_context_optional_runtime_bridge_applied');
    if (gate.boundary.claims_runtime_bridge_command_writes_files !== false) errors.push('architecture --claims-runtime-bridge must remain no-write');
    if (gate.boundary.claims_runtime_bridge_check_command_writes_files !== false) errors.push('architecture --claims-runtime-bridge-check must remain no-write');
    if (gate.boundary.source_context_optional_require_only !== true) errors.push('claims runtime bridge must use source-context optional require only');
    if (gate.boundary.installed_context_fallback_required !== true) errors.push('claims runtime bridge must preserve installed-package fallback');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims runtime bridge must preserve shared work-items ledger');
    if (gate.boundary.includes_non_claim_work_items_commands !== false) errors.push('claims runtime bridge must keep non-claim work-items commands excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('claims runtime bridge gate must preserve package allowlist');

    let bridgeFileStatus = 'not_present_installed_context_allowed';
    let bridgeFileSchema = null;
    if (result.runtime_bridge_file_present) {
      try {
        const bridgeFile = readJson(path.join(root, result.runtime_bridge_file));
        bridgeFileSchema = bridgeFile.schema || null;
        if (bridgeFile.schema !== gate.schema) errors.push(`${result.runtime_bridge_file} schema must be ${gate.schema}`);
        if (bridgeFile.source_module !== gate.source_module) errors.push(`${result.runtime_bridge_file} source_module must be ${gate.source_module}`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.runtime_bridge_file} must allow installed context fallback`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.keeps_shared_work_items_ledger !== true) errors.push(`${result.runtime_bridge_file} must keep the shared work-items ledger`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.includes_non_claim_work_items_commands !== false) errors.push(`${result.runtime_bridge_file} must exclude non-claim work-items commands`);
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
    const bundled = resolved.bundled_claims_view;
    const domainParity = !source || source.domain === bundled.domain;
    const facadeParity = !source || source.facade === bundled.facade;
    const serviceParity = !source || source.service === bundled.service;
    const schemaParity = !source || source.schema === bundled.source_module_schema;
    const stateFileParity = !source || arrayEquals(source.shared_state_files || [], bundled.shared_state_files);
    const commandParity = !source || arrayEquals(source.owns_commands || [], bundled.owns_commands);
    const excludedCommandParity = !source || arrayEquals(source.excluded_commands || [], bundled.excluded_commands);
    const writeBoundaryParity = !source || (source.writes_files === bundled.writes_files && source.state_writer === bundled.state_writer && source.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const sharedLedgerParity = !source || (source.declares_shared_work_items_ledger === true && bundled.declares_shared_work_items_ledger === true);
    const nonClaimExcluded = !source || source.includes_work_items_non_claim_behavior === false;
    const claimContractParity = !source || (source.claim_contract && source.claim_contract.command === bundled.claim_contract.command && source.claim_contract.writes_only_under_explicit_write === true && source.claim_contract.dry_run_is_default_boundary === true);
    const closeContractParity = !source || (source.close_contract && source.close_contract.command === bundled.close_contract.command && source.close_contract.writes_only_under_explicit_write === true && source.close_contract.dry_run_is_default_boundary === true);

    if (!sourceLoadedWhenPresent) errors.push('claims runtime bridge must load the source claims slice when present in source repository context');
    if (!fallbackWhenMissing) errors.push('claims runtime bridge must fall back to bundled claims view when source module is missing');
    if (!domainParity) errors.push('claims runtime bridge source domain must match bundled claims domain');
    if (!facadeParity) errors.push('claims runtime bridge source facade must match bundled claims facade');
    if (!serviceParity) errors.push('claims runtime bridge source service must match bundled claims service');
    if (!schemaParity) errors.push('claims runtime bridge source schema must match bundled claims schema');
    if (!stateFileParity) errors.push('claims runtime bridge source shared state files must match bundled claims state files');
    if (!commandParity) errors.push('claims runtime bridge source commands must match bundled claims commands');
    if (!excludedCommandParity) errors.push('claims runtime bridge source exclusions must match bundled claims exclusions');
    if (!writeBoundaryParity) errors.push('claims runtime bridge source write boundary must match bundled claims view');
    if (!sharedLedgerParity) errors.push('claims runtime bridge must preserve shared work-items ledger');
    if (!nonClaimExcluded) errors.push('claims runtime bridge must keep non-claim work-items commands excluded');
    if (!claimContractParity) errors.push('claims runtime bridge source claim contract must match bundled claims view');
    if (!closeContractParity) errors.push('claims runtime bridge source close contract must match bundled claims view');

    return {
      schema: 'agent-onboard-public-source-module-claims-runtime-bridge-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        claims_bundle_parity: bundleParity.status === 'ok',
        claims_runtime_bridge_status: gate.bridge_status === 'claims_source_context_optional_runtime_bridge_applied',
        source_module_loaded_when_present: sourceLoadedWhenPresent,
        bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
        installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
        source_domain_matches_bundled_claims: domainParity,
        source_facade_matches_bundled_claims: facadeParity,
        source_service_matches_bundled_claims: serviceParity,
        source_schema_matches_bundled_claims: schemaParity,
        source_state_files_match_bundled_claims: stateFileParity,
        source_commands_match_bundled_claims: commandParity,
        source_exclusions_match_bundled_claims: excludedCommandParity,
        source_write_boundary_matches_bundled_claims: writeBoundaryParity,
        shared_work_items_ledger_preserved: sharedLedgerParity,
        non_claim_work_items_commands_excluded: nonClaimExcluded,
        claim_contract_matches_bundled_claims: claimContractParity,
        close_contract_matches_bundled_claims: closeContractParity,
        claims_runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
        claims_runtime_bridge_commands_no_write: gate.boundary.claims_runtime_bridge_command_writes_files === false && gate.boundary.claims_runtime_bridge_check_command_writes_files === false,
        public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      runtime_bridge_resolution: resolved,
      source_claims_runtime_bridge_file: {
        path: result.runtime_bridge_file,
        present: result.runtime_bridge_file_present,
        status: bridgeFileStatus,
        schema: bridgeFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_claims_bundle_parity: {
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
    resolveClaimsDomainRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureClaimsSourceDomainRuntimeBridgeService
});
