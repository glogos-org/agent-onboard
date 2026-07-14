'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`${name} missing dependency`);
  return value;
}

function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}

function createPublicModularRuntimePackageInclusionService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN = required('PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN', options.PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
function publicModularRuntimePackageInclusionPlan(root = packageRoot()) {
  const gate = PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const planningPath = path.join(root, gate.planning_file);
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-modular-runtime-package-inclusion-plan-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    planning_file: gate.planning_file,
    planning_file_present: fs.existsSync(planningPath),
    planning_status: gate.planning_status,
    current_public_package_files: gate.current_public_package_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
    runtime_reference_shape: gate.runtime_reference_shape,
    future_include_candidates: gate.future_include_candidates.slice(),
    first_inclusion_slice: gate.first_inclusion_slice,
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    plan: gate,
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
function publicModularRuntimePackageInclusionPlanCheck(root = packageRoot()) {
  const result = publicModularRuntimePackageInclusionPlan(root);
  const gate = PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const planningGatePackFiles = gate.current_public_package_files.slice().sort();
  const compactPackStillCurrent = arrayEquals(result.projected_pack_files, planningGatePackFiles);
  const plannedExpansionApplied = gate.boundary.future_package_allowlist_change_planned === true && arrayEquals(result.projected_pack_files, expectedPackFiles);
  const errors = [];
  if (gate.planning_status !== 'modular_runtime_package_inclusion_plan_admitted') errors.push('modular runtime package inclusion plan status must be admitted');
  if (!compactPackStillCurrent && !plannedExpansionApplied) errors.push(`projected npm pack files must be either the planning gate compact files ${planningGatePackFiles.join(', ')} or the admitted current release files ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.package_allowlist_unchanged_for_this_gate !== true) errors.push('module inclusion planning gate must keep package allowlist unchanged');
  if (gate.boundary.future_package_allowlist_change_planned !== true) errors.push('module inclusion planning gate must explicitly plan a future package allowlist change');
  if (gate.boundary.runtime_cutover_applied !== false) errors.push('module inclusion planning gate must not apply runtime cutover');
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('module inclusion planning gate must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('module inclusion planning gate must not change packaged CLI runtime dependency graph');
  if (gate.boundary.module_inclusion_plan_command_writes_files !== false) errors.push('architecture --module-inclusion-plan must remain no-write');
  if (gate.boundary.module_inclusion_check_command_writes_files !== false) errors.push('architecture --module-inclusion-check must remain no-write');
  if (!gate.future_include_candidates.includes('cli/agent_onboard/command-router.js')) errors.push('future include candidates must include the command router');
  if (!gate.future_include_candidates.includes('cli/agent_onboard/adapters/compatibility-command-port.js')) errors.push('future include candidates must include the compatibility command port adapter');
  if (gate.first_inclusion_slice.runtime_cutover_allowed !== false) errors.push('first inclusion slice must not allow runtime cutover');
  if (gate.first_inclusion_slice.package_files_change_allowed !== true) errors.push('first inclusion slice must allow a controlled package files change');
  let planningFileStatus = 'not_present_installed_context_allowed';
  let planningFileSchema = null;
  const planningPath = path.join(root, gate.planning_file);
  if (fs.existsSync(planningPath)) {
    try {
      const artifact = readJson(planningPath);
      planningFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.planning_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.planning_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.planning_file} must seed ${gate.next_work_item_id}`);
      if (artifact.planning_status !== gate.planning_status) errors.push(`${gate.planning_file} must admit ${gate.planning_status}`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged_for_this_gate !== true) errors.push(`${gate.planning_file} must preserve package_allowlist_unchanged_for_this_gate`);
      if (!artifact.boundary || artifact.boundary.future_package_allowlist_change_planned !== true) errors.push(`${gate.planning_file} must plan a future package allowlist change`);
      planningFileStatus = 'present_validated';
    } catch (error) {
      planningFileStatus = 'present_invalid_json';
      errors.push(`${gate.planning_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    planningFileStatus = 'missing_source_context';
    errors.push(`${gate.planning_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after module inclusion planning`);
  }
  return {
    schema: 'agent-onboard-public-modular-runtime-package-inclusion-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      planning_status_admitted: gate.planning_status === 'modular_runtime_package_inclusion_plan_admitted',
      compact_pack_allowlist_preserved_for_planning_gate_or_superseded_by_admitted_inclusion: compactPackStillCurrent || plannedExpansionApplied,
      future_package_allowlist_change_planned: gate.boundary.future_package_allowlist_change_planned === true,
      runtime_cutover_not_applied: gate.boundary.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      planning_commands_no_write: gate.boundary.module_inclusion_plan_command_writes_files === false && gate.boundary.module_inclusion_check_command_writes_files === false,
      runtime_reference_shape_declared: !!gate.runtime_reference_shape.router_module && !!gate.runtime_reference_shape.compatibility_port_module,
      first_inclusion_slice_declared: gate.first_inclusion_slice.package_files_change_allowed === true && gate.first_inclusion_slice.runtime_cutover_allowed === false,
      planning_file_present_or_installed_context_allowed: planningFileStatus === 'present_validated' || planningFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_packaged_router_inclusion_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_modular_runtime_package_inclusion_plan_file: {
      path: gate.planning_file,
      present: fs.existsSync(planningPath),
      status: planningFileStatus,
      schema: planningFileSchema,
      source_context_required: sourceLedgerRequired
    },
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    future_include_candidates: gate.future_include_candidates.slice(),
    first_inclusion_slice: gate.first_inclusion_slice,
    boundary: result.boundary,
    errors
  };
}
  return Object.freeze({
    publicModularRuntimePackageInclusionPlan,
    publicModularRuntimePackageInclusionPlanCheck
  });
}

module.exports = Object.freeze({
  createPublicModularRuntimePackageInclusionService
});
