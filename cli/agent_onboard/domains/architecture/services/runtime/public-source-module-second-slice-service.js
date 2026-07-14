'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicSourceModuleSecondSliceService missing dependency: ${name}`);
  return value;
}

function createPublicSourceModuleSecondSliceService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_DOMAIN_SERVICE_FACADES = required('PUBLIC_DOMAIN_SERVICE_FACADES', options.PUBLIC_DOMAIN_SERVICE_FACADES);
  const PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN = required('PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN', options.PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN = required('PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN', options.PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN);
  const PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE = required('PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE', options.PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const publicSourceModuleExtractionInstalledFallbackSmokeCheck = required('publicSourceModuleExtractionInstalledFallbackSmokeCheck', options.publicSourceModuleExtractionInstalledFallbackSmokeCheck);

function gitignoreSecondSlicePolicy(root = packageRoot()) {
  const rel = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.gitignore_policy.gitignore_file;
  const file = path.join(root, rel);
  const present = fs.existsSync(file);
  const content = present ? fs.readFileSync(file, 'utf8') : '';
  const entries = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith('#'));
  const forbidden = ['.agent-onboard/', '.agent-onboard/*', 'src/', 'src/**', 'src/domains/', 'src/domains/*', 'src/domains/**'];
  const localStateEntries = ['.agent-onboard/tmp/', '.agent-onboard/cache/', '.agent-onboard/local/'];
  const perArtifactUnignoreEntries = entries.filter((entry) => /^!\.agent-onboard\/source-module-extraction-.*\.json$/.test(entry));
  return {
    file: rel,
    present,
    policy: 'track canonical .agent-onboard source JSON by default; ignore only local/runtime/cache state',
    required_unignore_entries: [],
    missing_required_unignore_entries: [],
    forbidden_ignore_entries: forbidden,
    present_forbidden_ignore_entries: forbidden.filter((entry) => entries.includes(entry)),
    local_state_ignore_entries: localStateEntries,
    missing_local_state_ignore_entries: localStateEntries.filter((entry) => !entries.includes(entry)),
    per_artifact_unignore_entries: perArtifactUnignoreEntries,
    entries
  };
}

function publicSourceModuleExtractionSecondSlicePlan(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const plan = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN;
  const plannedModule = plan.planned_second_slice.planned_module;
  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-plan-result-001',
    status: 'ok',
    package_name: plan.package_name,
    version: VERSION,
    release_line: plan.release_line,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    second_slice_plan_file: plan.second_slice_plan_file,
    second_slice_plan_file_present: fs.existsSync(path.join(root, plan.second_slice_plan_file)),
    prerequisite_installed_fallback_smoke_file: plan.prerequisite_installed_fallback_smoke_file,
    planned_second_slice: plan.planned_second_slice,
    planned_module: plannedModule,
    planned_module_present: fs.existsSync(path.join(root, plannedModule)),
    current_source_modules_present: ['src/domains/package.js', plannedModule].filter((rel) => fs.existsSync(path.join(root, rel))),
    gitignore_policy: gitignoreSecondSlicePolicy(root),
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    second_slice_plan: plan,
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

function publicSourceModuleExtractionSecondSlicePlanCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionSecondSlicePlan(root);
  const installedFallback = publicSourceModuleExtractionInstalledFallbackSmokeCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const planned = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.planned_second_slice;
  const partitionPlan = PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.planned_source_modules.find((module) => module.domain === planned.domain);
  const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === planned.domain);
  const artifactPath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file);
  const errors = [];
  if (installedFallback.status !== 'ok') errors.push(...installedFallback.errors.map((error) => `installed fallback smoke: ${error}`));
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_status !== 'planned_not_created') errors.push('second slice status must remain planned_not_created for this gate');
  if (planned.domain !== 'authority') errors.push('second slice must plan the authority domain after the package first slice');
  if (!partitionPlan) errors.push('second slice domain must exist in the source partition plan');
  if (partitionPlan && partitionPlan.planned_module !== planned.planned_module) errors.push(`second slice planned module must match partition plan module ${partitionPlan.planned_module}`);
  if (!facade || facade.service !== planned.facade) errors.push('second slice must map to authorityService facade');
  if (planned.source_module_created_by_this_gate !== false) errors.push('second slice planning gate must not create the authority source module');
  if (planned.published_import_api !== false) errors.push('second slice source module must not be admitted as public import API');
  const followupFirstSliceFilePresent = fs.existsSync(path.join(root, '.agent-onboard/source-module-extraction-second-slice-first-slice.json'));
  if (result.planned_module_present && !followupFirstSliceFilePresent) errors.push(`${planned.planned_module} must not be created until the second slice first-slice gate is admitted`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (result.projected_pack_files.includes(planned.planned_module)) errors.push(`${planned.planned_module} must stay outside the npm package allowlist`);
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_plan_command_writes_files !== false) errors.push('architecture --second-slice-plan must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_check_command_writes_files !== false) errors.push('architecture --second-slice-check must remain no-write');
  if (PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.package_allowlist_unchanged !== true) errors.push('second slice planning must preserve package allowlist');

  let planFileStatus = 'not_present_installed_context_allowed';
  let planFileSchema = null;
  if (result.second_slice_plan_file_present) {
    try {
      const artifact = readJson(artifactPath);
      planFileSchema = artifact.schema || null;
      if (artifact.schema !== PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.schema) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} schema must be ${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.schema}`);
      if (artifact.second_slice_status !== 'planned_not_created') errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must declare planned_not_created`);
      if (!artifact.planned_second_slice || artifact.planned_second_slice.domain !== planned.domain) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must plan ${planned.domain}`);
      if (!artifact.planned_second_slice || artifact.planned_second_slice.planned_module !== planned.planned_module) errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} planned module must be ${planned.planned_module}`);
      planFileStatus = 'present_validated';
    } catch (error) {
      planFileStatus = 'present_invalid_json';
      errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    planFileStatus = 'missing_source_context';
    errors.push(`${PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file} must exist in source repository context`);
  }

  const gitignore = result.gitignore_policy;
  if (result.package_context === 'source_repository') {
    if (!gitignore.present) errors.push('.gitignore must exist in source repository context');
    for (const entry of gitignore.missing_required_unignore_entries) errors.push(`.gitignore must unignore ${entry}`);
    for (const entry of gitignore.present_forbidden_ignore_entries) errors.push(`.gitignore must not ignore source module path with ${entry}`);
    for (const entry of gitignore.per_artifact_unignore_entries) errors.push(`.gitignore must not use per-artifact unignore sprawl: ${entry}`);
    for (const entry of gitignore.missing_local_state_ignore_entries) errors.push(`.gitignore must ignore local state entry ${entry}`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.release_line,
    command: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.check_command,
    package_root: root,
    source_context: result.source_context,
    validated: {
      installed_fallback_smoke: installedFallback.status === 'ok',
      second_slice_status: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_status === 'planned_not_created',
      planned_domain_is_authority: planned.domain === 'authority',
      planned_domain_maps_to_facade: !!facade && facade.service === planned.facade,
      planned_module_matches_partition_plan: !!partitionPlan && partitionPlan.planned_module === planned.planned_module,
      authority_module_not_created_by_this_gate: !result.planned_module_present || followupFirstSliceFilePresent,
      second_slice_plan_file_present_or_installed_context_allowed: planFileStatus === 'present_validated' || planFileStatus === 'not_present_installed_context_allowed',
      gitignore_tracks_source_artifacts: result.package_context === 'installed_package' || (gitignore.present && gitignore.missing_required_unignore_entries.length === 0),
      gitignore_does_not_ignore_src_domains: result.package_context === 'installed_package' || gitignore.present_forbidden_ignore_entries.length === 0,
      gitignore_uses_compact_local_state_policy: result.package_context === 'installed_package' || (gitignore.present && gitignore.per_artifact_unignore_entries.length === 0 && gitignore.missing_local_state_ignore_entries.length === 0),
      second_slice_commands_no_write: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_plan_command_writes_files === false && PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.boundary.second_slice_check_command_writes_files === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
    },
    planned_second_slice: planned,
    second_slice_plan_file: {
      path: PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_PLAN.second_slice_plan_file,
      present: result.second_slice_plan_file_present,
      status: planFileStatus,
      schema: planFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    gitignore_policy: gitignore,
    prerequisite_installed_fallback_smoke: {
      status: installedFallback.status,
      errors: installedFallback.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

function loadAuthoritySecondSliceModule(root = packageRoot()) {
  const modulePath = path.join(root, PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE.source_module);
  if (!fs.existsSync(modulePath)) return null;
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function publicSourceModuleExtractionSecondSliceFirstSlice(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE;
  let module_exports = [];
  let module_value = null;
  let module_load_error = null;
  try {
    const loaded = loadAuthoritySecondSliceModule(root);
    if (loaded) {
      module_exports = Object.keys(loaded).sort();
      if (typeof loaded.getAuthorityDomainSecondSlice === 'function') {
        module_value = loaded.getAuthorityDomainSecondSlice();
      } else if (loaded.AUTHORITY_DOMAIN_SECOND_SLICE) {
        module_value = loaded.AUTHORITY_DOMAIN_SECOND_SLICE;
      }
    }
  } catch (error) {
    module_load_error = error && error.message ? error.message : String(error);
  }
  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-first-slice-result-001',
    status: module_load_error ? 'error' : 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    second_slice_first_slice_file: gate.second_slice_first_slice_file,
    second_slice_first_slice_file_present: fs.existsSync(path.join(root, gate.second_slice_first_slice_file)),
    source_module: gate.source_module,
    source_module_present: fs.existsSync(path.join(root, gate.source_module)),
    source_module_exports: module_exports,
    source_module_value: module_value,
    source_module_load_error: module_load_error,
    prerequisite_second_slice_plan_file: gate.prerequisite_second_slice_plan_file,
    second_slice_first_slice: gate,
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

function publicSourceModuleExtractionSecondSliceFirstSliceCheck(root = packageRoot()) {
  const result = publicSourceModuleExtractionSecondSliceFirstSlice(root);
  const plan = publicSourceModuleExtractionSecondSlicePlanCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const gate = PUBLIC_SOURCE_MODULE_EXTRACTION_SECOND_SLICE_FIRST_SLICE;
  const expectedExports = gate.expected_module_export_names.slice().sort();
  const expectedReadOrder = gate.expected_read_order_paths.slice();
  const errors = [];
  if (plan.status !== 'ok') errors.push(...plan.errors.map((error) => `second slice plan: ${error}`));
  if (result.status !== 'ok') errors.push(`second slice first-slice module load failed: ${result.source_module_load_error}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.second_slice_first_slice_status !== 'source_only_shadow_module_applied') errors.push('second slice first-slice status must be source_only_shadow_module_applied');
  if (gate.extracted_domain.id !== 'authority') errors.push('second slice first-slice must extract the authority domain');
  if (gate.boundary.created_source_module !== 'src/domains/authority.js') errors.push('second slice created source module must be src/domains/authority.js');
  if (gate.boundary.creates_exactly_one_source_module !== true) errors.push('second slice first-slice must create exactly one source module');
  if (gate.boundary.excludes_write_capable_agents_command !== true) errors.push('second slice first-slice must exclude write-capable agents command extraction');
  if (gate.boundary.moves_existing_source_files !== false) errors.push('second slice first-slice must not move existing source files');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('second slice first-slice must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('second slice first-slice must not make CLI runtime require source modules');
  if (gate.boundary.exports_source_module_as_public_api !== false) errors.push('second slice first-slice must not expose source module as public import API');
  if (gate.boundary.second_slice_first_slice_command_writes_files !== false) errors.push('architecture --second-slice-first-slice must remain no-write');
  if (gate.boundary.second_slice_first_slice_check_command_writes_files !== false) errors.push('architecture --second-slice-first-slice-check must remain no-write');

  let artifactStatus = 'not_present_installed_context_allowed';
  let artifactSchema = null;
  if (result.second_slice_first_slice_file_present) {
    try {
      const artifact = readJson(path.join(root, result.second_slice_first_slice_file));
      artifactSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${result.second_slice_first_slice_file} schema must be ${gate.schema}`);
      if (!artifact.extracted_domain || artifact.extracted_domain.id !== 'authority') errors.push(`${result.second_slice_first_slice_file} must declare extracted_domain.id authority`);
      if (artifact.source_module !== 'src/domains/authority.js') errors.push(`${result.second_slice_first_slice_file} source_module must be src/domains/authority.js`);
      artifactStatus = 'present_validated';
    } catch (error) {
      artifactStatus = 'present_invalid_json';
      errors.push(`${result.second_slice_first_slice_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    artifactStatus = 'missing_source_context';
    errors.push(`${result.second_slice_first_slice_file} must be present in source repository context`);
  }

  let sourceModuleStatus = 'not_present_installed_context_allowed';
  const moduleValue = result.source_module_value || {};
  const moduleExportsSorted = result.source_module_exports.slice().sort();
  if (result.source_module_present) {
    if (!arrayEquals(moduleExportsSorted, expectedExports)) errors.push(`${result.source_module} exports must be ${expectedExports.join(', ')}`);
    if (moduleValue.schema !== 'agent-onboard-public-source-module-authority-second-slice-001') errors.push(`${result.source_module} must export authority second-slice schema`);
    if (moduleValue.domain !== 'authority') errors.push(`${result.source_module} domain must be authority`);
    if (moduleValue.facade !== 'authorityService') errors.push(`${result.source_module} facade must be authorityService`);
    if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
    if (moduleValue.runtime_dependency_status !== gate.extracted_domain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
    if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
    if (moduleValue.includes_write_capable_agents_command !== false) errors.push(`${result.source_module} must exclude write-capable agents command extraction`);
    if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
    if (!arrayEquals((moduleValue.read_order_paths || []), expectedReadOrder)) errors.push(`${result.source_module} read_order_paths must match authority first-read order`);
    sourceModuleStatus = 'present_validated';
  } else if (result.package_context === 'source_repository') {
    sourceModuleStatus = 'missing_source_context';
    errors.push(`${result.source_module} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-module-extraction-second-slice-first-slice-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    validated: {
      second_slice_plan: plan.status === 'ok',
      second_slice_status: gate.second_slice_first_slice_status === 'source_only_shadow_module_applied',
      extracted_domain_is_authority: gate.extracted_domain.id === 'authority',
      source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
      second_slice_first_slice_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
      write_capable_agents_command_excluded: moduleValue.includes_write_capable_agents_command === false || sourceModuleStatus === 'not_present_installed_context_allowed',
      commands_no_write: gate.boundary.second_slice_first_slice_command_writes_files === false && gate.boundary.second_slice_first_slice_check_command_writes_files === false,
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
    second_slice_first_slice_file: {
      path: result.second_slice_first_slice_file,
      present: result.second_slice_first_slice_file_present,
      status: artifactStatus,
      schema: artifactSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    prerequisite_second_slice_plan: {
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
    gitignoreSecondSlicePolicy,
    publicSourceModuleExtractionSecondSlicePlan,
    publicSourceModuleExtractionSecondSlicePlanCheck,
    loadAuthoritySecondSliceModule,
    publicSourceModuleExtractionSecondSliceFirstSlice,
    publicSourceModuleExtractionSecondSliceFirstSliceCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceModuleSecondSliceService
});
