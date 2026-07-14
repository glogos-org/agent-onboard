'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureWorkItemsSourceDomainInstalledFallbackService(deps) {
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

  const { publicWorkItemsDomainSourceExtractionRuntimeBridgeFn: publicWorkItemsDomainSourceExtractionRuntimeBridge, publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck } = deps;

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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureWorkItemsSourceDomainInstalledFallbackService missing dependency: ${name}`);
  }


  function publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke(root = packageRoot()) {
    const runtimeBridge = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const context = sourceContext(root);
    const pkg = readJson(path.join(root, 'package.json'));
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const projectedPackFiles = packageJsonProjectedPackFiles(pkg).slice().sort();
    const sourceModuleRel = gate.source_module;
    const sourceModulePresent = fs.existsSync(path.join(root, sourceModuleRel));
    const sourceModuleInPack = expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel);
    const projectedInstalledRuntimeBridge = {
      context: 'installed_package',
      source_module_present: false,
      source_module: sourceModuleRel,
      mode: 'bundled_fallback',
      fallback_source: 'cli/agent-onboard.js',
      allowed_because_source_module_is_not_in_npm_pack: !sourceModuleInPack,
      claim_and_close_commands_excluded: true
    };
    return {
      schema: 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      source_context: context,
      installed_fallback_smoke_file: gate.installed_fallback_smoke_file,
      installed_fallback_smoke_file_present: fs.existsSync(path.join(root, gate.installed_fallback_smoke_file)),
      source_module: sourceModuleRel,
      source_module_present: sourceModulePresent,
      projected_installed_runtime_bridge: projectedInstalledRuntimeBridge,
      observed: {
        work_items_runtime_bridge_check_status: runtimeBridge.status,
        work_items_runtime_bridge_resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
        package_surface_check_status: packageSurface.status,
        source_module_in_expected_pack_files: expectedPackFiles.includes(sourceModuleRel),
        source_module_in_projected_pack_files: projectedPackFiles.includes(sourceModuleRel),
        source_context_files_in_pack: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => projectedPackFiles.includes(rel))
      },
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      installed_fallback_contract: gate,
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
      },
      errors: []
    };
  }


  function publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke(root);
    const runtimeBridge = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json'))).slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
    const sourceModuleRel = gate.source_module;
    const artifactPath = path.join(root, gate.installed_fallback_smoke_file);
    const context = sourceContext(root);
    const errors = [];
    if (gate.smoke_status !== 'work_items_installed_fallback_smoke_admitted') errors.push('work-items installed fallback smoke status must remain work_items_installed_fallback_smoke_admitted');
    if (runtimeBridge.status !== 'ok') errors.push(...runtimeBridge.errors.map((error) => `work-items runtime bridge: ${error}`));
    if (packageSurface.status !== 'ok') errors.push(...packageSurface.errors.map((error) => `package surface: ${error}`));
    if (PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('work-items runtime bridge must require installed-context fallback');
    if (gate.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('work-items source modules must remain out of npm pack');
    if (gate.boundary.work_items_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture --work-items-installed-fallback-smoke must remain no-write');
    if (gate.boundary.work_items_installed_fallback_check_command_writes_files !== false) errors.push('architecture --work-items-installed-fallback-check must remain no-write');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items installed fallback must keep claim and close excluded');
    if (!arrayEquals(expectedPackFiles, projectedPackFiles)) errors.push('projected pack files must match the compact expected pack files');
    if (expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel)) errors.push(`${sourceModuleRel} must remain outside the npm package allowlist`);
    if (context.package_context === 'installed_package' && fs.existsSync(path.join(root, sourceModuleRel))) errors.push(`${sourceModuleRel} must be absent from installed package context`);
    if (context.package_context === 'installed_package' && runtimeBridge.runtime_bridge_resolution.mode !== 'bundled_fallback') errors.push('installed package work-items runtime bridge must resolve through bundled_fallback');
    if (context.package_context === 'source_repository' && !fs.existsSync(artifactPath)) errors.push(`${gate.installed_fallback_smoke_file} must exist in source repository context`);
    let fileStatus = 'not_present_installed_context_allowed';
    let fileSchema = null;
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        fileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.installed_fallback_smoke_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== sourceModuleRel) errors.push(`${gate.installed_fallback_smoke_file} source_module must be ${sourceModuleRel}`);
        if (!artifact.projected_installed_context || artifact.projected_installed_context.runtime_bridge_resolution_mode !== 'bundled_fallback') errors.push(`${gate.installed_fallback_smoke_file} must declare bundled_fallback projected installed context`);
        if (!artifact.projected_installed_context || artifact.projected_installed_context.claim_and_close_commands_remain_excluded !== true) errors.push(`${gate.installed_fallback_smoke_file} must keep claim and close excluded`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.installed_fallback_smoke_file} must preserve package_allowlist_unchanged`);
        fileStatus = 'present_validated';
      } catch (error) {
        fileStatus = 'present_invalid_json';
        errors.push(`${gate.installed_fallback_smoke_file} must be valid JSON: ${error.message}`);
      }
    }
    return {
      schema: 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      source_context: context,
      validated: {
        work_items_runtime_bridge_check: runtimeBridge.status === 'ok',
        package_surface_check: packageSurface.status === 'ok',
        work_items_installed_fallback_smoke_status: gate.smoke_status === 'work_items_installed_fallback_smoke_admitted',
        source_module_out_of_pack: !expectedPackFiles.includes(sourceModuleRel) && !projectedPackFiles.includes(sourceModuleRel),
        projected_pack_allowlist_unchanged: arrayEquals(expectedPackFiles, projectedPackFiles),
        installed_context_uses_bundled_fallback: context.package_context === 'installed_package' ? runtimeBridge.runtime_bridge_resolution.mode === 'bundled_fallback' : result.projected_installed_runtime_bridge.mode === 'bundled_fallback',
        source_artifact_present_or_installed_context_allowed: fs.existsSync(artifactPath) || context.package_context === 'installed_package',
        claim_and_close_commands_excluded: gate.boundary.includes_claim_and_close_commands === false && result.projected_installed_runtime_bridge.claim_and_close_commands_excluded === true,
        installed_fallback_commands_no_write: gate.boundary.work_items_installed_fallback_smoke_command_writes_files === false && gate.boundary.work_items_installed_fallback_check_command_writes_files === false,
        package_allowlist_unchanged: gate.boundary.package_allowlist_unchanged === true
      },
      observed: result.observed,
      runtime_bridge: {
        status: runtimeBridge.status,
        resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
        source_module_present: runtimeBridge.runtime_bridge_resolution.source_module_present
      },
      source_work_items_installed_fallback_file: {
        path: gate.installed_fallback_smoke_file,
        present: fs.existsSync(artifactPath),
        status: fs.existsSync(artifactPath) ? fileStatus : (context.package_context === 'installed_package' ? 'not_present_installed_context_allowed' : 'missing'),
        schema: fileSchema,
        source_context_required: true
      },
      projected_installed_runtime_bridge: result.projected_installed_runtime_bridge,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainInstalledFallbackService
});
