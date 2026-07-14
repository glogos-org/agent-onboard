'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceModuleCoreRuntimeBridgeService(deps) {
  const {
    version: VERSION,
    publicSourceModuleExtractionRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    bundledCoreDomainForParity,
    publicSourceModuleExtractionBundleParityCheck
  } = deps;

  for (const [name, value] of Object.entries({
    version: VERSION,
    publicSourceModuleExtractionRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    bundledCoreDomainForParity,
    publicSourceModuleExtractionBundleParityCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceModuleCoreRuntimeBridgeService missing dependency: ${name}`);
  }

function resolveCoreDomainRuntimeBridge(root = packageRoot()) {
  const context = sourceContext(root);
  const modulePath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module);
  const sourceModulePresent = fs.existsSync(modulePath);
  const bundledCore = bundledCoreDomainForParity(root);
  if (sourceModulePresent) {
    try {
      const loaded = require(modulePath);
      const value = loaded && typeof loaded.getCoreDomainFirstSlice === 'function'
        ? loaded.getCoreDomainFirstSlice()
        : loaded && loaded.CORE_DOMAIN_FIRST_SLICE;
      if (!value || value.schema !== 'agent-onboard-public-source-module-core-first-slice-001') {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_invalid',
          source_module_present: true,
          source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: value || null,
          bundled_core_view: bundledCore,
          errors: [`${PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module} did not export a valid core first-slice contract`]
        };
      }
      return {
        status: 'ok',
        context: context.package_context,
        mode: 'source_module_loaded',
        source_module_present: true,
        source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
        module_value: value,
        bundled_core_view: bundledCore,
        errors: []
      };
    } catch (error) {
      return {
        status: 'error',
        context: context.package_context,
        mode: 'source_module_load_failed',
        source_module_present: true,
        source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
        module_value: null,
        bundled_core_view: bundledCore,
        errors: [`${PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
      };
    }
  }
  return {
    status: 'ok',
    context: context.package_context,
    mode: 'bundled_fallback',
    source_module_present: false,
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
    module_value: null,
    bundled_core_view: bundledCore,
    errors: []
  };
}

function publicSourceModuleExtractionRuntimeBridge(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const bridge = resolveCoreDomainRuntimeBridge(root);
  return {
    schema: 'agent-onboard-public-source-module-extraction-runtime-bridge-result-001',
    status: bridge.status,
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    runtime_bridge_file: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.runtime_bridge_file,
    runtime_bridge_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.runtime_bridge_file)),
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module,
    source_module_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module)),
    runtime_bridge_resolution: bridge,
    runtime_bridge_contract: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
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

function publicSourceModuleExtractionRuntimeBridgeCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionRuntimeBridge(root);
  const bundleParity = publicSourceModuleExtractionBundleParityCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (bundleParity.status !== 'ok') errors.push(...bundleParity.errors.map((error) => `bundle parity: ${error}`));
  if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.bridge_status !== 'source_context_optional_runtime_bridge_applied') errors.push('runtime bridge status must remain source_context_optional_runtime_bridge_applied');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.runtime_bridge_command_writes_files !== false) errors.push('architecture --runtime-bridge must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.runtime_bridge_check_command_writes_files !== false) errors.push('architecture --runtime-bridge-check must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.source_context_optional_require_only !== true) errors.push('runtime bridge must use source-context optional require only');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('runtime bridge must preserve installed-package fallback');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.package_allowlist_unchanged !== true) errors.push('runtime bridge gate must preserve package allowlist');

  let bridgeFileStatus = 'not_present_installed_context_allowed';
  let bridgeFileSchema = null;
  if (result.runtime_bridge_file_present) {
    try {
      const bridgeFile = readJson(path.join(root, result.runtime_bridge_file));
      bridgeFileSchema = bridgeFile.schema || null;
      if (bridgeFile.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.schema) errors.push(`${result.runtime_bridge_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.schema}`);
      if (bridgeFile.source_module !== PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module) errors.push(`${result.runtime_bridge_file} source_module must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.source_module}`);
      if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.runtime_bridge_file} must allow installed context fallback`);
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
  const domainParity = !resolved.module_value || resolved.module_value.domain === resolved.bundled_core_view.domain;
  const facadeParity = !resolved.module_value || resolved.module_value.facade === resolved.bundled_core_view.facade;
  const commandParity = !resolved.module_value || arrayEquals(resolved.module_value.owns_commands || [], resolved.bundled_core_view.owns_commands);
  if (!sourceLoadedWhenPresent) errors.push('runtime bridge must load the source core slice when present in source repository context');
  if (!fallbackWhenMissing) errors.push('runtime bridge must fall back to bundled core view when source module is missing');
  if (!domainParity) errors.push('runtime bridge source domain must match bundled core domain');
  if (!facadeParity) errors.push('runtime bridge source facade must match bundled core facade');
  if (!commandParity) errors.push('runtime bridge source commands must match bundled core commands');

  return {
    schema: 'agent-onboard-public-source-module-extraction-runtime-bridge-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.check_command,
    package_root: root,
    validated: {
      bundle_parity: bundleParity.status === 'ok',
      runtime_bridge_status: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.bridge_status === 'source_context_optional_runtime_bridge_applied',
      source_module_loaded_when_present: sourceLoadedWhenPresent,
      bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
      installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
      runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
      source_domain_matches_bundled_core: domainParity,
      source_facade_matches_bundled_core: facadeParity,
      source_commands_match_bundled_core: commandParity,
      runtime_bridge_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.runtime_bridge_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE.boundary.runtime_bridge_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    runtime_bridge_resolution: resolved,
    source_runtime_bridge_file: {
      path: result.runtime_bridge_file,
      present: result.runtime_bridge_file_present,
      status: bridgeFileStatus,
      schema: bridgeFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_bundle_parity: {
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
    resolveCoreDomainRuntimeBridge,
    publicSourceModuleExtractionRuntimeBridge,
    publicSourceModuleExtractionRuntimeBridgeCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleCoreRuntimeBridgeService
});
