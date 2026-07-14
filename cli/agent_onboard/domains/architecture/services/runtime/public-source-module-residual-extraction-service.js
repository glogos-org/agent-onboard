'use strict';

const fs = require('fs');
const path = require('path');

const { createPublicSourceModuleSecondSliceService } = require('./public-source-module-second-slice-service');
const { createPublicSourceModuleAuthorityBundleParityService } = require('./public-source-module-authority-bundle-parity-service');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicSourceModuleResidualExtractionService missing dependency: ${name}`);
  return value;
}

function createPublicSourceModuleResidualExtractionService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_ARCHITECTURE_MAP = required('PUBLIC_ARCHITECTURE_MAP', options.PUBLIC_ARCHITECTURE_MAP);
  const PUBLIC_COMMAND_ROUTER = required('PUBLIC_COMMAND_ROUTER', options.PUBLIC_COMMAND_ROUTER);
  const PUBLIC_DOMAIN_SERVICE_FACADES = required('PUBLIC_DOMAIN_SERVICE_FACADES', options.PUBLIC_DOMAIN_SERVICE_FACADES);
  const PUBLIC_AUTHORITY_FIRST_READ_INDEX = required('PUBLIC_AUTHORITY_FIRST_READ_INDEX', options.PUBLIC_AUTHORITY_FIRST_READ_INDEX);
  const PUBLIC_TARGET_RUNTIME_NAMESPACE = required('PUBLIC_TARGET_RUNTIME_NAMESPACE', options.PUBLIC_TARGET_RUNTIME_NAMESPACE);
  const PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN = required('PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN', options.PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN);
  const PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL = required('PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL', options.PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL);
  const PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE = required('PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE', options.PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE);
  const PUBLIC_VERSION_REFERENCE_POLICY = required('PUBLIC_VERSION_REFERENCE_POLICY', options.PUBLIC_VERSION_REFERENCE_POLICY);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY = required('PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY', options.PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN = required('PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN', options.PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY = required('PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY', options.PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const publicPackageSurfaceCheck = required('publicPackageSurfaceCheck', options.publicPackageSurfaceCheck);
  const publicSourceModuleExtractionRuntimeBridgeCheck = required('publicSourceModuleExtractionRuntimeBridgeCheck', options.publicSourceModuleExtractionRuntimeBridgeCheck);

function publicArchitectureMap(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  return {
    schema: 'agent-onboard-public-architecture-map-result-001',
    status: 'ok',
    package_name: PUBLIC_ARCHITECTURE_MAP.package_name,
    version: VERSION,
    release_line: PUBLIC_ARCHITECTURE_MAP.release_line,
    command: PUBLIC_ARCHITECTURE_MAP.command,
    check_command: PUBLIC_ARCHITECTURE_MAP.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    package_json_version: pkg.version,
    map: PUBLIC_ARCHITECTURE_MAP,
    command_router: PUBLIC_COMMAND_ROUTER,
    domain_service_facades: PUBLIC_DOMAIN_SERVICE_FACADES,
    source_domain_module_partition_plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    source_domain_extraction_rehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    source_extraction_golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
      source_module_extraction_adapter_boundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    source_module_extraction_first_slice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    source_module_extraction_second_slice_plan: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
    version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
    authority_first_read_index: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    target_runtime_namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    current_runtime: {
      entrypoint: PUBLIC_ARCHITECTURE_MAP.public_source_shape.current_entrypoint,
      entrypoint_exists: fs.existsSync(path.join(root, PUBLIC_ARCHITECTURE_MAP.public_source_shape.current_entrypoint)),
      physical_domain_split_status: PUBLIC_ARCHITECTURE_MAP.public_source_shape.physical_domain_split_status,
      expected_pack_files: PUBLIC_ARCHITECTURE_MAP.public_source_shape.expected_pack_files.slice(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg)
    },
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

function publicSourceModuleExtractionInstalledFallbackSmoke(root = packageRoot()) {
  const runtimeBridge = publicSourceModuleExtractionRuntimeBridgeCheck(root);
  const packageSurface = publicPackageSurfaceCheck(root);
  const context = sourceContext(root);
  const pkg = readJson(path.join(root, 'package.json'));
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg).slice().sort();
  const sourceModuleRel = PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.source_module;
  const sourceModulePresent = fs.existsSync(path.join(root, sourceModuleRel));
  const sourceModuleInPack = expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel);
  const projectedInstalledRuntimeBridge = {
    context: 'installed_package',
    source_module_present: false,
    source_module: sourceModuleRel,
    mode: 'bundled_fallback',
    fallback_source: 'cli/agent-onboard.js',
    allowed_because_source_module_is_not_in_npm_pack: !sourceModuleInPack
  };
  return {
    schema: 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.check_command,
    package_root: root,
    source_context: context,
    installed_fallback_smoke_file: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file,
    installed_fallback_smoke_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file)),
    source_module: sourceModuleRel,
    source_module_present: sourceModulePresent,
    projected_installed_runtime_bridge: projectedInstalledRuntimeBridge,
    observed: {
      runtime_bridge_check_status: runtimeBridge.status,
      runtime_bridge_resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
      package_surface_check_status: packageSurface.status,
      source_module_in_expected_pack_files: expectedPackFiles.includes(sourceModuleRel),
      source_module_in_projected_pack_files: projectedPackFiles.includes(sourceModuleRel),
      source_context_files_in_pack: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => projectedPackFiles.includes(rel))
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    installed_fallback_contract: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
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

function publicSourceModuleExtractionInstalledFallbackSmokeCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionInstalledFallbackSmoke(root);
  const runtimeBridge = publicSourceModuleExtractionRuntimeBridgeCheck(root);
  const packageSurface = publicPackageSurfaceCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json'))).slice().sort();
  const sourceModuleRel = PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.source_module;
  const artifactPath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file);
  const context = sourceContext(root);
  const errors = [];
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.smoke_status !== 'installed_fallback_smoke_admitted') errors.push('installed fallback smoke status must be installed_fallback_smoke_admitted');
  if (runtimeBridge.status !== 'ok') errors.push('runtime bridge check must pass before installed fallback smoke');
  if (packageSurface.status !== 'ok') errors.push('package surface check must pass before installed fallback smoke');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('runtime bridge must require installed-context fallback');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('source modules must remain out of npm pack');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_check_command_writes_files !== false) errors.push('installed fallback check must remain no-write');
  if (!arrayEquals(expectedPackFiles, projectedPackFiles)) errors.push('projected pack files must match the compact expected pack files');
  if (expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel)) errors.push(`${sourceModuleRel} must remain outside the npm package allowlist`);
  if (context.package_context === 'installed_package' && fs.existsSync(path.join(root, sourceModuleRel))) errors.push(`${sourceModuleRel} must be absent from installed package context`);
  if (context.package_context === 'installed_package' && runtimeBridge.runtime_bridge_resolution.mode !== 'bundled_fallback') errors.push('installed package runtime bridge must resolve through bundled_fallback');
  if (context.package_context === 'source_repository' && !fs.existsSync(artifactPath)) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must exist in source repository context`);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      if (artifact.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema}`);
      if (artifact.source_module !== sourceModuleRel) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} source_module must be ${sourceModuleRel}`);
      if (!artifact.projected_installed_context || artifact.projected_installed_context.runtime_bridge_resolution_mode !== 'bundled_fallback') errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must declare bundled_fallback projected installed context`);
    } catch (error) {
      errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file} must be valid JSON: ${error.message}`);
    }
  }
  return {
    schema: 'agent-onboard-public-source-module-extraction-installed-fallback-smoke-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.check_command,
    package_root: root,
    source_context: context,
    validated: {
      runtime_bridge_check: runtimeBridge.status === 'ok',
      package_surface_check: packageSurface.status === 'ok',
      installed_fallback_smoke_status: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.smoke_status === 'installed_fallback_smoke_admitted',
      source_module_out_of_pack: !expectedPackFiles.includes(sourceModuleRel) && !projectedPackFiles.includes(sourceModuleRel),
      projected_pack_allowlist_unchanged: arrayEquals(expectedPackFiles, projectedPackFiles),
      installed_context_uses_bundled_fallback: context.package_context === 'installed_package' ? runtimeBridge.runtime_bridge_resolution.mode === 'bundled_fallback' : result.projected_installed_runtime_bridge.mode === 'bundled_fallback',
      source_artifact_present_or_installed_context_allowed: fs.existsSync(artifactPath) || context.package_context === 'installed_package',
      installed_fallback_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_smoke_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.installed_fallback_check_command_writes_files === false,
      package_allowlist_unchanged: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.boundary.package_allowlist_unchanged === true
    },
    observed: result.observed,
    runtime_bridge: {
      status: runtimeBridge.status,
      resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
      source_module_present: runtimeBridge.runtime_bridge_resolution.source_module_present
    },
    source_installed_fallback_file: {
      path: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.installed_fallback_smoke_file,
      present: fs.existsSync(artifactPath),
      status: fs.existsSync(artifactPath) ? 'present_validated' : (context.package_context === 'installed_package' ? 'not_present_installed_context_allowed' : 'missing'),
      schema: PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE.schema,
      source_context_required: true
    },
    projected_installed_runtime_bridge: result.projected_installed_runtime_bridge,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
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
    errors
  };
}


  const secondSliceService = createPublicSourceModuleSecondSliceService({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceModuleExtractionInstalledFallbackSmokeCheck
  });
  const {
    gitignoreSecondSlicePolicy,
    publicSourceModuleExtractionSecondSlicePlan,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    loadAuthoritySecondSliceModule,
    publicSourceModuleExtractionSecondSliceFirstSlice,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck
  } = secondSliceService;

  const authorityBundleParityService = createPublicSourceModuleAuthorityBundleParityService({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_BUNDLE_PARITY,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicArchitectureMap,
    publicSourceModuleExtractionSecondSliceFirstSlice,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck
  });
  const {
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  } = authorityBundleParityService;

  return Object.freeze({
    publicArchitectureMap,
    publicSourceModuleExtractionInstalledFallbackSmoke,
    publicSourceModuleExtractionInstalledFallbackSmokeCheck,
    gitignoreSecondSlicePolicy,
    publicSourceModuleExtractionSecondSlicePlan,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    loadAuthoritySecondSliceModule,
    publicSourceModuleExtractionSecondSliceFirstSlice,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck,
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleResidualExtractionService
});
