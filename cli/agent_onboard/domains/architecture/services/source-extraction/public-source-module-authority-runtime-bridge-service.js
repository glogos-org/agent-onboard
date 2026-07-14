'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceModuleAuthorityRuntimeBridgeService(deps) {
  const {
    version: VERSION,
    publicSourceModuleExtractionAuthorityRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  } = deps;

  for (const [name, value] of Object.entries({
    version: VERSION,
    publicSourceModuleExtractionAuthorityRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceModuleAuthorityRuntimeBridgeService missing dependency: ${name}`);
  }

function resolveAuthorityDomainRuntimeBridge(root = packageRoot()) {
  const context = sourceContext(root);
  const modulePath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module);
  const sourceModulePresent = fs.existsSync(modulePath);
  const bundledAuthority = bundledAuthorityDomainForParity(root);
  if (sourceModulePresent) {
    try {
      const loaded = require(modulePath);
      const value = loaded && typeof loaded.getAuthorityDomainSecondSlice === 'function'
        ? loaded.getAuthorityDomainSecondSlice()
        : loaded && loaded.AUTHORITY_DOMAIN_SECOND_SLICE;
      if (!value || value.schema !== 'agent-onboard-public-source-module-authority-second-slice-001') {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_invalid',
          source_module_present: true,
          source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module,
          module_value: value || null,
          bundled_authority_view: bundledAuthority,
          errors: [`${PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module} did not export a valid authority second-slice contract`]
        };
      }
      return {
        status: 'ok',
        context: context.package_context,
        mode: 'source_module_loaded',
        source_module_present: true,
        source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module,
        module_value: value,
        bundled_authority_view: bundledAuthority,
        errors: []
      };
    } catch (error) {
      return {
        status: 'error',
        context: context.package_context,
        mode: 'source_module_load_failed',
        source_module_present: true,
        source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module,
        module_value: null,
        bundled_authority_view: bundledAuthority,
        errors: [`${PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
      };
    }
  }
  return {
    status: 'ok',
    context: context.package_context,
    mode: 'bundled_fallback',
    source_module_present: false,
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module,
    module_value: null,
    bundled_authority_view: bundledAuthority,
    errors: []
  };
}

function publicSourceModuleExtractionAuthorityRuntimeBridge(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const bridge = resolveAuthorityDomainRuntimeBridge(root);
  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-runtime-bridge-result-001',
    status: bridge.status,
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.command,
    check_command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    authority_runtime_bridge_file: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.authority_runtime_bridge_file,
    authority_runtime_bridge_file_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.authority_runtime_bridge_file)),
    source_module: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module,
    source_module_present: fs.existsSync(path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module)),
    runtime_bridge_resolution: bridge,
    runtime_bridge_contract: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    gitignore_policy: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.gitignore_policy,
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

function publicSourceModuleExtractionAuthorityRuntimeBridgeCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionAuthorityRuntimeBridge(root);
  const authorityBundleParity = publicSourceModuleExtractionAuthorityBundleParityCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (authorityBundleParity.status !== 'ok') errors.push(...authorityBundleParity.errors.map((error) => `authority bundle parity: ${error}`));
  if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.bridge_status !== 'authority_source_context_optional_runtime_bridge_applied') errors.push('authority runtime bridge status must remain authority_source_context_optional_runtime_bridge_applied');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.authority_runtime_bridge_command_writes_files !== false) errors.push('architecture --authority-runtime-bridge must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.authority_runtime_bridge_check_command_writes_files !== false) errors.push('architecture --authority-runtime-bridge-check must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.source_context_optional_require_only !== true) errors.push('authority runtime bridge must use source-context optional require only');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('authority runtime bridge must preserve installed-package fallback');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.includes_write_capable_agents_command !== false) errors.push('authority runtime bridge must exclude write-capable agents command extraction');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.package_allowlist_unchanged !== true) errors.push('authority runtime bridge gate must preserve package allowlist');

  let bridgeFileStatus = 'not_present_installed_context_allowed';
  let bridgeFileSchema = null;
  if (result.authority_runtime_bridge_file_present) {
    try {
      const bridgeFile = readJson(path.join(root, result.authority_runtime_bridge_file));
      bridgeFileSchema = bridgeFile.schema || null;
      if (bridgeFile.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.schema) errors.push(`${result.authority_runtime_bridge_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.schema}`);
      if (bridgeFile.source_module !== PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module) errors.push(`${result.authority_runtime_bridge_file} source_module must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.source_module}`);
      if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.authority_runtime_bridge_file} must allow installed context fallback`);
      if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.includes_write_capable_agents_command !== false) errors.push(`${result.authority_runtime_bridge_file} must exclude write-capable agents command extraction`);
      if (!bridgeFile.boundary || bridgeFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.authority_runtime_bridge_file} must preserve package_allowlist_unchanged`);
      bridgeFileStatus = 'present_validated';
    } catch (error) {
      bridgeFileStatus = 'present_invalid_json';
      errors.push(`${result.authority_runtime_bridge_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    bridgeFileStatus = 'missing_source_context';
    errors.push(`${result.authority_runtime_bridge_file} must be present in source repository context`);
  }

  const resolved = result.runtime_bridge_resolution;
  const installedFallbackAllowed = result.package_context === 'installed_package' && resolved.mode === 'bundled_fallback';
  const sourceLoadExpected = result.package_context === 'source_repository' && result.source_module_present;
  const sourceLoadedWhenPresent = sourceLoadExpected ? resolved.mode === 'source_module_loaded' : true;
  const fallbackWhenMissing = !result.source_module_present ? resolved.mode === 'bundled_fallback' : true;
  const domainParity = !resolved.module_value || resolved.module_value.domain === resolved.bundled_authority_view.domain;
  const facadeParity = !resolved.module_value || resolved.module_value.facade === resolved.bundled_authority_view.facade;
  const commandParity = !resolved.module_value || arrayEquals(resolved.module_value.owns_commands || [], resolved.bundled_authority_view.owns_commands);
  const readOrderParity = !resolved.module_value || arrayEquals(resolved.module_value.read_order_paths || [], resolved.bundled_authority_view.read_order_paths);
  const excludedAgentsParity = !resolved.module_value || (resolved.module_value.includes_write_capable_agents_command === false && arrayEquals(resolved.module_value.excluded_commands || [], resolved.bundled_authority_view.excluded_commands));
  const writeParity = !resolved.module_value || (resolved.module_value.writes_files === resolved.bundled_authority_view.writes_files && resolved.module_value.state_writer === resolved.bundled_authority_view.state_writer);
  if (!sourceLoadedWhenPresent) errors.push('authority runtime bridge must load the source authority slice when present in source repository context');
  if (!fallbackWhenMissing) errors.push('authority runtime bridge must fall back to bundled authority view when source module is missing');
  if (!domainParity) errors.push('authority runtime bridge source domain must match bundled authority domain');
  if (!facadeParity) errors.push('authority runtime bridge source facade must match bundled authority facade');
  if (!commandParity) errors.push('authority runtime bridge source commands must match bundled authority commands');
  if (!readOrderParity) errors.push('authority runtime bridge source read order must match bundled first-read order');
  if (!excludedAgentsParity) errors.push('authority runtime bridge must exclude write-capable agents commands');
  if (!writeParity) errors.push('authority runtime bridge source write boundary must match bundled authority view');

  const gitignorePath = path.join(root, '.gitignore');
  let gitignorePolicyStatus = 'not_present_installed_context_allowed';
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const hasBlanketAgentOnboardIgnore = /^\.agent-onboard\/\*\s*$/m.test(gitignore) || /^\.agent-onboard\/\s*$/m.test(gitignore);
    const perArtifactUnignoreSprawl = (gitignore.match(/^!\.agent-onboard\/source-module-extraction-.*\.json\s*$/gm) || []).length;
    const localStateIgnored = ['.agent-onboard/tmp/', '.agent-onboard/cache/', '.agent-onboard/local/'].every((entry) => gitignore.includes(entry));
    if (hasBlanketAgentOnboardIgnore) errors.push('.gitignore must not blanket-ignore canonical .agent-onboard source artifacts');
    if (perArtifactUnignoreSprawl > 0) errors.push('.gitignore must not add one unignore line per source-module artifact');
    if (!localStateIgnored) errors.push('.gitignore must ignore local .agent-onboard runtime/cache subtrees');
    gitignorePolicyStatus = hasBlanketAgentOnboardIgnore || perArtifactUnignoreSprawl > 0 || !localStateIgnored ? 'present_invalid' : 'present_validated';
  } else if (result.package_context === 'source_repository') {
    gitignorePolicyStatus = 'missing_source_context';
    errors.push('.gitignore must be present in source repository context');
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-authority-runtime-bridge-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.check_command,
    package_root: root,
    validated: {
      authority_bundle_parity: authorityBundleParity.status === 'ok',
      authority_runtime_bridge_status: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.bridge_status === 'authority_source_context_optional_runtime_bridge_applied',
      source_module_loaded_when_present: sourceLoadedWhenPresent,
      bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
      installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
      source_domain_matches_bundled_authority: domainParity,
      source_facade_matches_bundled_authority: facadeParity,
      source_commands_match_bundled_authority: commandParity,
      source_read_order_matches_bundled_authority: readOrderParity,
      write_capable_agents_command_excluded: excludedAgentsParity,
      source_write_boundary_matches_bundled_authority: writeParity,
      authority_runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
      authority_runtime_bridge_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.authority_runtime_bridge_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.authority_runtime_bridge_check_command_writes_files === false,
      public_cli_outputs_unchanged_by_gate: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE.boundary.changes_public_cli_outputs === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      gitignore_policy_compacted: gitignorePolicyStatus === 'present_validated' || gitignorePolicyStatus === 'not_present_installed_context_allowed'
    },
    runtime_bridge_resolution: resolved,
    source_authority_runtime_bridge_file: {
      path: result.authority_runtime_bridge_file,
      present: result.authority_runtime_bridge_file_present,
      status: bridgeFileStatus,
      schema: bridgeFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    gitignore_policy: {
      path: '.gitignore',
      status: gitignorePolicyStatus,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_authority_bundle_parity: {
      status: authorityBundleParity.status,
      errors: authorityBundleParity.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    resolveAuthorityDomainRuntimeBridge,
    publicSourceModuleExtractionAuthorityRuntimeBridge,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleAuthorityRuntimeBridgeService
});
