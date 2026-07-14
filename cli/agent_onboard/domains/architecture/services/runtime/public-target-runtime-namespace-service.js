'use strict';

const fs = require('fs');
const path = require('path');

function createPublicTargetRuntimeNamespaceService(deps) {
  const {
    version: VERSION,
    publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    targetOnboardingSurfacePlan: TARGET_ONBOARDING_SURFACE_PLAN,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    targetRuntimeNamespaceTemplate,
    targetOnboardingWriteSet
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    PUBLIC_RELEASE_CONTRACT,
    TARGET_ONBOARDING_SURFACE_PLAN,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    targetRuntimeNamespaceTemplate,
    targetOnboardingWriteSet
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicTargetRuntimeNamespaceService missing dependency: ${name}`);
  }

function publicTargetRuntimeNamespace(root = packageRoot()) {
  const packageContext = sourceContext(root);
  const sourceFile = PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file;
  const sourceFilePresent = fs.existsSync(path.join(root, sourceFile));
  return {
    schema: 'agent-onboard-public-target-runtime-namespace-result-001',
    status: 'ok',
    package_name: PUBLIC_TARGET_RUNTIME_NAMESPACE.package_name,
    version: VERSION,
    release_line: PUBLIC_TARGET_RUNTIME_NAMESPACE.release_line,
    command: PUBLIC_TARGET_RUNTIME_NAMESPACE.command,
    check_command: PUBLIC_TARGET_RUNTIME_NAMESPACE.check_command,
    package_root: root,
    package_context: packageContext.package_context,
    namespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    namespace_root: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_root,
    namespace_file: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file,
    canonical_runtime_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.canonical_runtime_files.map((entry) => ({
      path: entry.path,
      domain: entry.domain,
      role: entry.role,
      kind: entry.kind,
      required: entry.required,
      written_by: entry.written_by
    })),
    top_level_authority_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.top_level_authority_files.slice(),
    reserved_future_files: PUBLIC_TARGET_RUNTIME_NAMESPACE.reserved_future_files.map((entry) => ({
      path: entry.path,
      domain: entry.domain,
      status: entry.status
    })),
    source_file_present: sourceFilePresent,
    source_file_missing: sourceFilePresent ? [] : [sourceFile],
    projected_template: targetRuntimeNamespaceTemplate(root),
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

function publicTargetRuntimeNamespaceCheck(root = packageRoot()) {
  const result = publicTargetRuntimeNamespace(root);
  const expectedRuntimeFiles = ['.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', '.agent-onboard/authority-path.json'];
  const actualRuntimeFiles = result.canonical_runtime_files.map((entry) => entry.path);
  const targetCanonical = TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice();
  const targetWritePaths = targetOnboardingWriteSet(root).map((entry) => entry.path);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json')));
  const reservedPaths = PUBLIC_TARGET_RUNTIME_NAMESPACE.reserved_future_files.map((entry) => entry.path);
  const writtenReservedPaths = targetWritePaths.filter((rel) => reservedPaths.includes(rel));
  const errors = [];
  if (PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_root !== '.agent-onboard') errors.push('target_runtime_namespace root must be .agent-onboard');
  if (PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file !== '.agent-onboard/runtime-namespace.json') errors.push('target runtime namespace file must be .agent-onboard/runtime-namespace.json');
  if (!arrayEquals(actualRuntimeFiles, expectedRuntimeFiles)) errors.push(`target runtime file order must be ${expectedRuntimeFiles.join(', ')}`);
  if (!targetCanonical.includes(PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file)) errors.push('target onboarding canonical files must include .agent-onboard/runtime-namespace.json');
  if (!targetWritePaths.includes(PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file)) errors.push('target onboarding write set must include .agent-onboard/runtime-namespace.json');
  if (writtenReservedPaths.length > 0) errors.push(`target onboarding must not write reserved runtime files: ${writtenReservedPaths.join(', ')}`);
  if (PUBLIC_TARGET_RUNTIME_NAMESPACE.boundary.namespace_command_writes_files !== false) errors.push('target runtime --namespace command must remain no-write');
  if (PUBLIC_TARGET_RUNTIME_NAMESPACE.boundary.check_command_writes_files !== false) errors.push('target runtime --check command must remain no-write');
  if (!arrayEquals(projectedPackFiles, expectedPackFiles)) errors.push(`projected npm pack files must stay compact: ${expectedPackFiles.join(', ')}`);
  if (result.package_context === 'source_repository') {
    if (!result.source_file_present) errors.push('source runtime namespace file missing: .agent-onboard/runtime-namespace.json');
    const namespacePath = path.join(root, '.agent-onboard', 'runtime-namespace.json');
    if (fs.existsSync(namespacePath)) {
      try {
        const value = readJson(namespacePath);
        const paths = Array.isArray(value.canonical_runtime_files) ? value.canonical_runtime_files.map((entry) => entry.path) : [];
        if (value.schema !== 'agent-onboard-target-runtime-namespace-001') errors.push('runtime-namespace schema must be agent-onboard-target-runtime-namespace-001');
        if (!arrayEquals(paths, expectedRuntimeFiles)) errors.push('runtime-namespace canonical_runtime_files must match canonical runtime order');
        if (value.namespace_root !== '.agent-onboard') errors.push('runtime-namespace namespace_root must be .agent-onboard');
      } catch (error) {
        errors.push(`runtime-namespace is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    }
  }
  return {
    schema: 'agent-onboard-public-target-runtime-namespace-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_TARGET_RUNTIME_NAMESPACE.package_name,
    version: VERSION,
    release_line: PUBLIC_TARGET_RUNTIME_NAMESPACE.release_line,
    command: PUBLIC_TARGET_RUNTIME_NAMESPACE.check_command,
    package_root: root,
    validated: {
      namespace_root: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_root === '.agent-onboard',
      namespace_file: PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file === '.agent-onboard/runtime-namespace.json',
      runtime_file_order: arrayEquals(actualRuntimeFiles, expectedRuntimeFiles),
      target_onboarding_canonical_file: targetCanonical.includes(PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file),
      target_onboarding_write_set: targetWritePaths.includes(PUBLIC_TARGET_RUNTIME_NAMESPACE.namespace_file),
      reserved_future_files_not_written: writtenReservedPaths.length === 0,
      runtime_commands_no_write: PUBLIC_TARGET_RUNTIME_NAMESPACE.boundary.namespace_command_writes_files === false && PUBLIC_TARGET_RUNTIME_NAMESPACE.boundary.check_command_writes_files === false,
      source_runtime_namespace_file: result.package_context === 'source_repository' ? result.source_file_present : true,
      compact_package_boundary: arrayEquals(projectedPackFiles, expectedPackFiles)
    },
    namespace_root: result.namespace_root,
    namespace_file: result.namespace_file,
    expected_runtime_files: expectedRuntimeFiles,
    runtime_files: actualRuntimeFiles,
    target_onboarding_canonical_files: targetCanonical,
    target_onboarding_write_paths: targetWritePaths,
    reserved_future_files: result.reserved_future_files,
    source_file_present: result.source_file_present,
    package_context: result.package_context,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: projectedPackFiles,
    boundary: result.boundary,
    errors
  };
}


  return Object.freeze({
    publicTargetRuntimeNamespace,
    publicTargetRuntimeNamespaceCheck
  });
}

module.exports = Object.freeze({
  createPublicTargetRuntimeNamespaceService
});
