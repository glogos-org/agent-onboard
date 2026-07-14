'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureClaimsSourceDomainBundleParityService(deps) {
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

  const { publicClaimsDomainSourceExtractionFirstSliceFn: publicClaimsDomainSourceExtractionFirstSlice, publicClaimsDomainSourceExtractionFirstSliceCheck } = deps;

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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureClaimsSourceDomainBundleParityService missing dependency: ${name}`);
  }


  function bundledClaimsDomainForParity(root = packageRoot()) {
    const map = publicArchitectureMap(root);
    const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'claims');
    const domain = map.map.canonical_domains.find((item) => item.id === 'claims');
    return {
      schema: 'agent-onboard-public-bundled-claims-domain-view-001',
      domain: domain ? domain.id : null,
      facade: facade ? facade.service : null,
      service: facade ? facade.service : null,
      source: 'cli/agent-onboard.js',
      source_module_schema: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.schema,
      owns_commands: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.expected_owned_commands.slice(),
      excluded_commands: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.excluded_commands.slice(),
      writes_files: false,
      state_writer: false,
      declares_explicit_write_boundaries: true,
      declares_shared_work_items_ledger: true,
      shared_state_files: Object.freeze(['.agent-onboard/work-items.json']).slice(),
      claim_contract: Object.freeze({
        command: 'work-items --claim',
        writes_only_under_explicit_write: true,
        dry_run_is_default_boundary: true
      }),
      close_contract: Object.freeze({
        command: 'work-items --close',
        writes_only_under_explicit_write: true,
        dry_run_is_default_boundary: true
      }),
      package_context: sourceContext(root).package_context
    };
  }


  function publicClaimsDomainSourceExtractionBundleParity(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const firstSlice = publicClaimsDomainSourceExtractionFirstSlice(root);
    const bundledClaims = bundledClaimsDomainForParity(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    return {
      schema: 'agent-onboard-public-source-module-claims-bundle-parity-result-001',
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
      bundled_claims_view: bundledClaims,
      claims_bundle_parity: gate,
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


  function publicClaimsDomainSourceExtractionBundleParityCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionBundleParity(root);
    const firstSlice = publicClaimsDomainSourceExtractionFirstSliceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    const errors = [];
    if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `claims first slice: ${error}`));
    if (result.status !== 'ok') errors.push('claims bundle parity depends on a loadable first-slice source module in source context or installed fallback metadata');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.parity_status !== 'claims_source_slice_matches_bundled_cli_view') errors.push('claims bundle parity status must remain claims_source_slice_matches_bundled_cli_view');
    if (gate.boundary.claims_bundle_parity_command_writes_files !== false) errors.push('architecture --claims-bundle-parity must remain no-write');
    if (gate.boundary.claims_bundle_parity_check_command_writes_files !== false) errors.push('architecture --claims-bundle-parity-check must remain no-write');
    if (gate.boundary.creates_bundle_artifact !== false) errors.push('claims bundle parity gate must not create runtime bundle artifacts');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims bundle parity gate must preserve the shared work-items ledger boundary');
    if (gate.boundary.excludes_non_claim_work_items_commands !== true) errors.push('claims bundle parity gate must exclude non-claim work-items commands');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('claims bundle parity gate must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('claims bundle parity gate must not change CLI runtime dependency graph');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('claims bundle parity gate must preserve package allowlist');

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
        if (!artifact.boundary || artifact.boundary.keeps_shared_work_items_ledger !== true) errors.push(`${result.bundle_parity_file} must keep shared work-items ledger`);
        if (!artifact.boundary || artifact.boundary.excludes_non_claim_work_items_commands !== true) errors.push(`${result.bundle_parity_file} must exclude non-claim work-items commands`);
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
    const bundled = result.bundled_claims_view;
    const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
    const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === bundled.domain);
    const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === bundled.facade);
    const serviceParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.service === bundled.service);
    const schemaParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.schema === bundled.source_module_schema);
    const stateFileParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.shared_state_files || [], bundled.shared_state_files));
    const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], bundled.owns_commands));
    const excludedCommandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.excluded_commands || [], bundled.excluded_commands));
    const writeBoundaryParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === bundled.writes_files && sourceSlice.state_writer === bundled.state_writer && sourceSlice.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const sharedLedgerParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.declares_shared_work_items_ledger === bundled.declares_shared_work_items_ledger);
    const claimContractParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.claim_contract && sourceSlice.claim_contract.command === bundled.claim_contract.command && sourceSlice.claim_contract.writes_only_under_explicit_write === true && sourceSlice.claim_contract.dry_run_is_default_boundary === true);
    const closeContractParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.close_contract && sourceSlice.close_contract.command === bundled.close_contract.command && sourceSlice.close_contract.writes_only_under_explicit_write === true && sourceSlice.close_contract.dry_run_is_default_boundary === true);
    const nonClaimExcluded = sourceContextAllowedMissing || (sourceSlice && sourceSlice.includes_work_items_non_claim_behavior === false);
    if (!domainParity) errors.push('claims source slice domain must match bundled claims domain view');
    if (!facadeParity) errors.push('claims source slice facade must match bundled claims facade view');
    if (!serviceParity) errors.push('claims source slice service must match bundled claims service view');
    if (!schemaParity) errors.push('claims source slice schema must match bundled claims source-module schema');
    if (!stateFileParity) errors.push('claims source slice shared state files must match bundled claims view');
    if (!commandParity) errors.push('claims source slice owned commands must match bundled claims command surface');
    if (!excludedCommandParity) errors.push('claims source slice excluded commands must match bundled claims exclusions');
    if (!writeBoundaryParity) errors.push('claims source slice read/write boundary must match bundled claims view');
    if (!sharedLedgerParity) errors.push('claims source slice must preserve shared work-items ledger parity');
    if (!claimContractParity) errors.push('claims source slice claim contract must match bundled claims view');
    if (!closeContractParity) errors.push('claims source slice close contract must match bundled claims view');
    if (!nonClaimExcluded) errors.push('claims source slice must exclude non-claim work-items behavior');

    return {
      schema: 'agent-onboard-public-source-module-claims-bundle-parity-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        first_slice: firstSlice.status === 'ok',
        bundle_parity_status: gate.parity_status === 'claims_source_slice_matches_bundled_cli_view',
        source_slice_domain_matches_bundled_claims: domainParity,
        source_slice_facade_matches_bundled_claims: facadeParity,
        source_slice_service_matches_bundled_claims: serviceParity,
        source_slice_schema_matches_bundled_claims: schemaParity,
        source_slice_state_files_match_bundled_claims: stateFileParity,
        source_slice_commands_match_bundled_claims: commandParity,
        source_slice_exclusions_match_bundled_claims: excludedCommandParity,
        source_slice_write_boundary_matches_bundled_claims: writeBoundaryParity,
        shared_work_items_ledger_preserved: sharedLedgerParity,
        claim_contract_matches_bundled_claims: claimContractParity,
        close_contract_matches_bundled_claims: closeContractParity,
        non_claim_work_items_commands_excluded: nonClaimExcluded,
        source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
        bundle_parity_file_present_or_installed_context_allowed: bundleParityFileStatus === 'present_validated' || bundleParityFileStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.claims_bundle_parity_command_writes_files === false && gate.boundary.claims_bundle_parity_check_command_writes_files === false,
        runtime_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      source_slice: result.source_slice_value,
      bundled_claims_view: result.bundled_claims_view,
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
    bundledClaimsDomainForParity,
    publicClaimsDomainSourceExtractionBundleParity,
    publicClaimsDomainSourceExtractionBundleParityCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureClaimsSourceDomainBundleParityService
});
