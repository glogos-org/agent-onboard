'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureClaimsSourceDomainFirstSliceService(deps) {
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

  const { publicClaimsDomainSourceExtractionPlanCheck } = deps;

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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureClaimsSourceDomainFirstSliceService missing dependency: ${name}`);
  }


  function loadClaimsFirstSliceModule(root = packageRoot()) {
    const modulePath = path.join(root, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.source_module);
    if (!fs.existsSync(modulePath)) return null;
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
    return require(resolved);
  }


  function publicClaimsDomainSourceExtractionFirstSlice(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    let module_exports = [];
    let module_value = null;
    let module_load_error = null;
    try {
      const loaded = loadClaimsFirstSliceModule(root);
      if (loaded) {
        module_exports = Object.keys(loaded).sort();
        if (typeof loaded.getClaimsDomainFirstSlice === 'function') {
          module_value = loaded.getClaimsDomainFirstSlice();
        } else if (loaded.CLAIMS_DOMAIN_FIRST_SLICE) {
          module_value = loaded.CLAIMS_DOMAIN_FIRST_SLICE;
        }
      }
    } catch (error) {
      module_load_error = error && error.message ? error.message : String(error);
    }
    return {
      schema: 'agent-onboard-public-source-module-claims-first-slice-result-001',
      status: module_load_error ? 'error' : 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      first_slice_file: gate.first_slice_file,
      first_slice_file_present: fs.existsSync(path.join(root, gate.first_slice_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      source_module_exports: module_exports,
      source_module_value: module_value,
      source_module_load_error: module_load_error,
      prerequisite_plan_file: gate.prerequisite_plan_file,
      claims_first_slice: gate,
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


  function publicClaimsDomainSourceExtractionFirstSliceCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionFirstSlice(root);
    const plan = publicClaimsDomainSourceExtractionPlanCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    const expectedExports = gate.expected_module_export_names.slice().sort();
    const errors = [];
    if (plan.status !== 'ok') errors.push(...plan.errors.map((error) => `claims plan: ${error}`));
    if (result.status !== 'ok') errors.push(`claims first-slice module load failed: ${result.source_module_load_error}`);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.first_slice_status !== 'source_only_shadow_module_applied') errors.push('claims first-slice status must be source_only_shadow_module_applied');
    if (gate.extracted_domain.id !== 'claims') errors.push('claims first-slice must extract the claims domain');
    if (gate.boundary.created_source_module !== 'src/domains/claims.js') errors.push('claims first-slice created source module must be src/domains/claims.js');
    if (gate.boundary.creates_exactly_one_source_module !== true) errors.push('claims first-slice must create exactly one source module');
    if (gate.boundary.excludes_non_claim_work_items_commands !== true) errors.push('claims first-slice must exclude non-claim work-items commands');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims first-slice must keep the shared work-items ledger boundary');
    if (gate.boundary.moves_existing_source_files !== false) errors.push('claims first-slice must not move existing source files');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('claims first-slice must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('claims first-slice must not make CLI runtime require source modules');
    if (gate.boundary.exports_source_module_as_public_api !== false) errors.push('claims first-slice must not expose source module as public import API');
    if (gate.boundary.claims_first_slice_command_writes_files !== false) errors.push('architecture --claims-first-slice must remain no-write');
    if (gate.boundary.claims_first_slice_check_command_writes_files !== false) errors.push('architecture --claims-first-slice-check must remain no-write');

    let artifactStatus = 'not_present_installed_context_allowed';
    let artifactSchema = null;
    if (result.first_slice_file_present) {
      try {
        const artifact = readJson(path.join(root, result.first_slice_file));
        artifactSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${result.first_slice_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== gate.source_module) errors.push(`${result.first_slice_file} source_module must be ${gate.source_module}`);
        if (!artifact.extracted_domain || artifact.extracted_domain.id !== 'claims') errors.push(`${result.first_slice_file} must declare extracted_domain.id claims`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${result.first_slice_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.keeps_shared_work_items_ledger !== true) errors.push(`${result.first_slice_file} must keep shared work-items ledger`);
        if (!artifact.boundary || artifact.boundary.excludes_non_claim_work_items_commands !== true) errors.push(`${result.first_slice_file} must exclude non-claim work-items commands`);
        artifactStatus = 'present_validated';
      } catch (error) {
        artifactStatus = 'present_invalid_json';
        errors.push(`${result.first_slice_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      artifactStatus = 'missing_source_context';
      errors.push(`${result.first_slice_file} must be present in source repository context`);
    }

    let sourceModuleStatus = 'not_present_installed_context_allowed';
    const moduleValue = result.source_module_value || {};
    const moduleExportsSorted = result.source_module_exports.slice().sort();
    if (result.source_module_present) {
      if (!arrayEquals(moduleExportsSorted, expectedExports)) errors.push(`${result.source_module} exports must be ${expectedExports.join(', ')}`);
      if (moduleValue.schema !== gate.schema) errors.push(`${result.source_module} must export claims first-slice schema`);
      if (moduleValue.domain !== 'claims') errors.push(`${result.source_module} domain must be claims`);
      if (moduleValue.facade !== 'claimsService') errors.push(`${result.source_module} facade must be claimsService`);
      if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
      if (moduleValue.runtime_dependency_status !== gate.extracted_domain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
      if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
      if (moduleValue.includes_work_items_non_claim_behavior !== false) errors.push(`${result.source_module} must exclude non-claim work-items behavior`);
      if (moduleValue.declares_shared_work_items_ledger !== true) errors.push(`${result.source_module} must declare the shared work-items ledger boundary`);
      if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
      if (moduleValue.declares_explicit_write_boundaries !== true) errors.push(`${result.source_module} must declare explicit write boundaries for claim/close commands`);
      if (!arrayEquals((moduleValue.owns_commands || []), gate.expected_owned_commands.slice())) errors.push(`${result.source_module} owns_commands must match claims first-slice scope`);
      if (!arrayEquals((moduleValue.excluded_commands || []), gate.excluded_commands.slice())) errors.push(`${result.source_module} excluded_commands must keep non-claim work-items behavior out of this slice`);
      sourceModuleStatus = 'present_validated';
    } else if (result.package_context === 'source_repository') {
      sourceModuleStatus = 'missing_source_context';
      errors.push(`${result.source_module} must be present in source repository context`);
    }

    return {
      schema: 'agent-onboard-public-source-module-claims-first-slice-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        claims_plan: plan.status === 'ok',
        first_slice_status: gate.first_slice_status === 'source_only_shadow_module_applied',
        extracted_domain_is_claims: gate.extracted_domain.id === 'claims',
        source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
        first_slice_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
        shared_work_items_ledger_preserved: moduleValue.declares_shared_work_items_ledger === true || sourceModuleStatus === 'not_present_installed_context_allowed',
        non_claim_work_items_commands_excluded: moduleValue.includes_work_items_non_claim_behavior === false || sourceModuleStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.claims_first_slice_command_writes_files === false && gate.boundary.claims_first_slice_check_command_writes_files === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      source_module: {
        path: result.source_module,
        present: result.source_module_present,
        status: sourceModuleStatus,
        exports: result.source_module_exports,
        value: result.source_module_value,
        source_context_required: result.package_context === 'source_repository'
      },
      first_slice_file: {
        path: result.first_slice_file,
        present: result.first_slice_file_present,
        status: artifactStatus,
        schema: artifactSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_claims_plan: {
        status: plan.status,
        errors: plan.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  return Object.freeze({
    loadClaimsFirstSliceModule,
    publicClaimsDomainSourceExtractionFirstSlice,
    publicClaimsDomainSourceExtractionFirstSliceCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureClaimsSourceDomainFirstSliceService
});
