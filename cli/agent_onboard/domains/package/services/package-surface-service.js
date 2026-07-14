'use strict';

const fs = require('fs');
const path = require('path');
const { createPackageSourceManifestService } = require('./source-manifest-service');

const PACKAGE_SURFACE_SERVICE_SEED = Object.freeze({
  schema: 'agent-onboard-public-package-surface-service-seed-002',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_package_surface_service',
  service_path: 'cli/agent_onboard/domains/package/services/package-surface-service.js',
  owned_release_commands: Object.freeze(['release --surface', 'release --surface-check', 'release --source-manifest', 'release --source-manifest-check']),
  boundary: Object.freeze({
    packaged_in_npm_tarball_in_this_gate: true,
    no_side_effect_on_require: true,
    no_file_writes_on_require: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true
  })
});

function describePackageSurfaceServiceSeed() {
  return PACKAGE_SURFACE_SERVICE_SEED;
}

function defaultRoot() {
  return path.resolve(__dirname, '../../../../..');
}

function createPackageSurfaceService(options = Object.freeze({})) {
  const version = typeof options.version === 'string' ? options.version : null;
  const publicReleaseContract = options.publicReleaseContract || Object.freeze({});
  const publicPackageSurfacePreservation = options.publicPackageSurfacePreservation || Object.freeze({});
  const packageRoot = typeof options.packageRoot === 'function' ? options.packageRoot : defaultRoot;
  const readJson = typeof options.readJson === 'function' ? options.readJson : (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  const packageJsonProjectedPackFiles = typeof options.packageJsonProjectedPackFiles === 'function'
    ? options.packageJsonProjectedPackFiles
    : (pkg) => Array.from(new Set(['package.json'].concat(Array.isArray(pkg.files) ? pkg.files : []))).sort();
  const sourceContext = typeof options.sourceContext === 'function'
    ? options.sourceContext
    : () => ({ package_context: 'installed_package', source_context_files_present: [], source_context_files_missing: [] });
  const publicArtifactMessagingErrors = typeof options.publicArtifactMessagingErrors === 'function' ? options.publicArtifactMessagingErrors : () => [];
  const arrayEquals = typeof options.arrayEquals === 'function'
    ? options.arrayEquals
    : (left, right) => Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => item === right[index]);

  function createSourceManifestService() {
    return createPackageSourceManifestService({
      packageName: publicReleaseContract.package_name,
      version,
      releaseLine: publicReleaseContract.release_line,
      expectedPackFiles: publicPackageSurfacePreservation.expected_pack_files,
      sourceOnlyFiles: publicPackageSurfacePreservation.source_only_files
    });
  }

  function surface(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
    const expectedPackFiles = (publicPackageSurfacePreservation.expected_pack_files || []).slice().sort();
    const requiredPackageJsonFiles = (publicPackageSurfacePreservation.required_package_json_files || []).slice().sort();
    const actualPackageJsonFiles = Array.isArray(pkg.files) ? pkg.files.slice().sort() : [];
    const context = sourceContext(root);
    const sourceOnlyFiles = (publicPackageSurfacePreservation.source_only_files || []).slice();
    const sourceOnlyPresent = sourceOnlyFiles.filter((rel) => fs.existsSync(path.join(root, rel)));
    const sourceOnlyProjected = sourceOnlyFiles.filter((rel) => projectedPackFiles.includes(rel));
    const expectedPresent = expectedPackFiles.filter((rel) => fs.existsSync(path.join(root, rel)));
    const expectedMissing = expectedPackFiles.filter((rel) => !fs.existsSync(path.join(root, rel)));
    const binTargets = Object.values(publicReleaseContract.required_package_json && publicReleaseContract.required_package_json.bin || {});
    const binTargetsInProjectedPack = binTargets.every((rel) => projectedPackFiles.includes(rel));
    return {
      schema: 'agent-onboard-public-package-surface-preservation-result-001',
      status: 'ok',
      package_name: publicPackageSurfacePreservation.package_name,
      version,
      release_line: publicPackageSurfacePreservation.release_line,
      contract_schema: publicReleaseContract.schema,
      command: publicPackageSurfacePreservation.command,
      check_command: publicPackageSurfacePreservation.check_command,
      package_root: root,
      package_context: context.package_context,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      required_package_json_files: requiredPackageJsonFiles,
      actual_package_json_files: actualPackageJsonFiles,
      source_only_files: sourceOnlyFiles,
      source_only_files_present: sourceOnlyPresent,
      source_only_files_projected_into_pack: sourceOnlyProjected,
      expected_pack_files_present: expectedPresent,
      expected_pack_files_missing: expectedMissing,
      bin_targets: binTargets,
      bin_targets_in_projected_pack: binTargetsInProjectedPack,
      installed_context_policy: publicPackageSurfacePreservation.installed_context_policy,
      boundary: {
        writes_files: false,
        writes_package_root: false,
        writes_target_repository_state: false,
        git_mutation: false,
        installs_dependencies: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        publishes_package: false,
        mutates_registry: false,
        network_registry_publish_required: false
      }
    };
  }

  function sourceManifest(root = packageRoot()) {
    const result = createSourceManifestService().build(root);
    return Object.assign({}, result, {
      command: 'agent-onboard release --source-manifest',
      package_root: root,
      boundary: Object.assign({}, result.boundary, {
        writes_files: false,
        runs_package_manager: false,
        publishes_package: false,
        mutates_registry: false
      })
    });
  }

  function sourceManifestCheck(root = packageRoot()) {
    const result = createSourceManifestService().check(root);
    return Object.assign({}, result, {
      command: 'agent-onboard release --source-manifest-check',
      package_root: root,
      boundary: Object.assign({}, result.boundary, {
        writes_files: false,
        runs_package_manager: false,
        publishes_package: false,
        mutates_registry: false
      })
    });
  }

  function surfaceCheck(root = packageRoot()) {
    const result = surface(root);
    const packageSourceManifest = createSourceManifestService().check(root);
    const errors = [];
    const messagingErrors = publicArtifactMessagingErrors(root, result.expected_pack_files);
    if (!arrayEquals(result.projected_pack_files, result.expected_pack_files)) errors.push(`projected npm pack files must be ${result.expected_pack_files.join(', ')}`);
    if (!arrayEquals(result.actual_package_json_files, result.required_package_json_files)) errors.push(`package.json#files must be ${result.required_package_json_files.join(', ')}`);
    if (result.expected_pack_files_missing.length > 0) errors.push(`expected npm package files missing: ${result.expected_pack_files_missing.join(', ')}`);
    if (result.source_only_files_projected_into_pack.length > 0) errors.push(`source-only files projected into npm package: ${result.source_only_files_projected_into_pack.join(', ')}`);
    if (!result.bin_targets_in_projected_pack) errors.push('all bin targets must remain inside the projected npm package surface');
    if (packageSourceManifest.status !== 'ok') errors.push(...packageSourceManifest.errors.map((error) => `package source manifest: ${error}`));
    errors.push(...messagingErrors.map((error) => `public artifact messaging: ${error}`));
    return {
      schema: 'agent-onboard-public-package-surface-preservation-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: publicPackageSurfacePreservation.package_name,
      version,
      release_line: publicPackageSurfacePreservation.release_line,
      contract_schema: publicReleaseContract.schema,
      command: publicPackageSurfacePreservation.check_command,
      package_root: root,
      package_context: result.package_context,
      validated: {
        controlled_modular_package_surface: arrayEquals(result.projected_pack_files, result.expected_pack_files),
        package_json_files_allowlist: arrayEquals(result.actual_package_json_files, result.required_package_json_files),
        expected_pack_files_present: result.expected_pack_files_missing.length === 0,
        source_only_context_excluded_from_pack: result.source_only_files_projected_into_pack.length === 0,
        source_growth_files_present_in_source_repo: result.package_context === 'installed_package' || result.source_only_files_present.length >= 5,
        bin_entrypoints_in_pack: result.bin_targets_in_projected_pack,
        public_artifact_messaging: messagingErrors.length === 0,
        package_source_manifest: packageSourceManifest.status === 'ok',
        package_source_manifest_content_addressed: packageSourceManifest.validated.package_files_are_content_addressed,
        package_source_manifest_hash_cache_excluded: packageSourceManifest.validated.hash_cache_not_projected_into_package,
        surface_commands_no_write: publicPackageSurfacePreservation.boundary.surface_command_writes_files === false && publicPackageSurfacePreservation.boundary.check_command_writes_files === false
      },
      expected_pack_files: result.expected_pack_files,
      projected_pack_files: result.projected_pack_files,
      required_package_json_files: result.required_package_json_files,
      actual_package_json_files: result.actual_package_json_files,
      source_only_files_present: result.source_only_files_present,
      source_only_files_projected_into_pack: result.source_only_files_projected_into_pack,
      package_source_manifest: packageSourceManifest,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    instance_schema: 'agent-onboard-public-package-surface-service-instance-002',
    seed: PACKAGE_SURFACE_SERVICE_SEED,
    createSourceManifestService,
    sourceManifest,
    sourceManifestCheck,
    surface,
    surfaceCheck
  });
}

module.exports = Object.freeze({
  PACKAGE_SURFACE_SERVICE_SEED,
  describePackageSurfaceServiceSeed,
  createPackageSurfaceService
});
