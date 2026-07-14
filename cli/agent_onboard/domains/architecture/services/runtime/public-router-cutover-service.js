'use strict';
const fs = require('fs');
const path = require('path');
function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicRouterCutoverService missing dependency: ${name}`);
  return value;
}
function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}
function createPublicRouterCutoverService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN = required('PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN', options.PUBLIC_MODULAR_RUNTIME_PACKAGE_INCLUSION_PLAN);
  const PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION = required('PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION', options.PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION);
  const PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL = required('PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL', options.PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL);
  const PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION = required('PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION', options.PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION);
  const PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION = required('PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION', options.PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const routeCommand = required('routeCommand', options.routeCommand);
  const createRuntimeCompatibilityPort = required('createRuntimeCompatibilityPort', options.createRuntimeCompatibilityPort);
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
function inspectPackagedModule(root, rel, expectedExports) {
  const abs = path.join(root, rel);
  const present = fs.existsSync(abs);
  let status = present ? 'present_unvalidated' : 'missing';
  let exportsList = [];
  let requireError = null;
  if (present) {
    try {
      delete require.cache[require.resolve(abs)];
      exportsList = Object.keys(require(abs)).sort();
      status = 'present_validated';
    } catch (error) {
      status = 'present_require_failed';
      requireError = error && error.message ? error.message : String(error);
    }
  }
  return {
    path: rel,
    present,
    status,
    exports: exportsList,
    expected_exports: expectedExports.slice().sort(),
    require_error: requireError,
    line_count: countFileLines(root, rel)
  };
}
function publicPackagedRouterPortInclusion(root = packageRoot()) {
  const gate = PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const inclusionPath = path.join(root, gate.inclusion_file);
  const moduleReports = gate.included_module_files.map((rel) => inspectPackagedModule(root, rel, gate.expected_module_exports[rel] || Object.freeze([])));
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-packaged-router-port-inclusion-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    inclusion_file: gate.inclusion_file,
    inclusion_file_present: fs.existsSync(inclusionPath),
    inclusion_status: gate.inclusion_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_line_count: countFileLines(root, gate.entrypoint)
    },
    included_module_files: gate.included_module_files.slice(),
    module_reports: moduleReports,
    expected_pack_files: gate.included_package_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    inclusion_contract: gate,
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
function publicPackagedRouterPortInclusionCheck(root = packageRoot()) {
  const result = publicPackagedRouterPortInclusion(root);
  const gate = PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.included_package_files.slice().sort();
  const errors = [];
  if (gate.inclusion_status !== 'packaged_router_port_inclusion_admitted') errors.push('packaged router port inclusion status must be admitted');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must be ${expectedPackFiles.join(', ')}`);
  if (gate.runtime_cutover_applied !== false) errors.push('packaged router port inclusion must not apply runtime cutover');
  if (gate.boundary.package_allowlist_expanded !== true) errors.push('packaged router port inclusion must expand package allowlist');
  if (gate.boundary.package_file_count !== expectedPackFiles.length) errors.push(`packaged router port inclusion package file count must be ${expectedPackFiles.length}`);
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('packaged router port inclusion must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('packaged router port inclusion must not change packaged CLI runtime dependency graph yet');
  if (gate.boundary.packaged_router_port_command_writes_files !== false) errors.push('architecture --packaged-router-port must remain no-write');
  if (gate.boundary.packaged_router_port_check_command_writes_files !== false) errors.push('architecture --packaged-router-port-check must remain no-write');
  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for packaged router port inclusion`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    for (const exportName of report.expected_exports) {
      if (!report.exports.includes(exportName)) errors.push(`${report.path} must export ${exportName}`);
    }
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must be included in projected npm pack files`);
  }
  let inclusionFileStatus = 'not_present_installed_context_allowed';
  let inclusionFileSchema = null;
  const inclusionPath = path.join(root, gate.inclusion_file);
  if (fs.existsSync(inclusionPath)) {
    try {
      const artifact = readJson(inclusionPath);
      inclusionFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.inclusion_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.inclusion_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.inclusion_file} must seed ${gate.next_work_item_id}`);
      if (artifact.inclusion_status !== gate.inclusion_status) errors.push(`${gate.inclusion_file} must admit ${gate.inclusion_status}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.inclusion_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_expanded !== true) errors.push(`${gate.inclusion_file} must declare package_allowlist_expanded`);
      inclusionFileStatus = 'present_validated';
    } catch (error) {
      inclusionFileStatus = 'present_invalid_json';
      errors.push(`${gate.inclusion_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    inclusionFileStatus = 'missing_source_context';
    errors.push(`${gate.inclusion_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after packaged router port inclusion`);
  }
  return {
    schema: 'agent-onboard-public-packaged-router-port-inclusion-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      inclusion_status_admitted: gate.inclusion_status === 'packaged_router_port_inclusion_admitted',
      projected_pack_files_match_inclusion_contract: arrayEquals(result.projected_pack_files, expectedPackFiles),
      package_allowlist_expanded: gate.boundary.package_allowlist_expanded === true,
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      packaged_router_port_commands_no_write: gate.boundary.packaged_router_port_command_writes_files === false && gate.boundary.packaged_router_port_check_command_writes_files === false,
      module_files_present: result.module_reports.every((report) => report.present),
      module_files_requireable: result.module_reports.every((report) => report.status === 'present_validated'),
      module_exports_contract: result.module_reports.every((report) => report.expected_exports.every((name) => report.exports.includes(name))),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      inclusion_file_present_or_installed_context_allowed: inclusionFileStatus === 'present_validated' || inclusionFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_thin_entrypoint_cutover_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_packaged_router_port_inclusion_file: {
      path: gate.inclusion_file,
      present: fs.existsSync(inclusionPath),
      status: inclusionFileStatus,
      schema: inclusionFileSchema,
      source_context_required: sourceLedgerRequired
    },
    module_reports: result.module_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    runtime_cutover: result.runtime_cutover,
    boundary: result.boundary,
    errors
  };
}
function runThinEntrypointRehearsalVectors(root, gate) {
  let router = null;
  let portFactory = null;
  let routerLoadError = null;
  let portLoadError = null;
  try {
    router = require(path.join(root, gate.router_module));
  } catch (error) {
    routerLoadError = error && error.message ? error.message : String(error);
  }
  try {
    portFactory = require(path.join(root, gate.compatibility_port_module));
  } catch (error) {
    portLoadError = error && error.message ? error.message : String(error);
  }
  const canRun = router && typeof router.route === 'function' && portFactory && typeof portFactory.createCompatibilityCommandPort === 'function';
  const reports = [];
  if (!canRun) {
    return { can_run: false, router_load_error: routerLoadError, port_load_error: portLoadError, reports };
  }
  const handlers = Object.freeze({
    status(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: 'ok', command: argv[2], writes_files: false });
    },
    help(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: 'ok', command: argv[2] || 'help', writes_files: false });
    },
    default(argv) {
      return Object.freeze({ schema: 'agent-onboard-public-thin-entrypoint-rehearsal-vector-result-001', status: argv[2] ? 'unhandled_source_only_seed' : 'ok', command: argv[2] || 'help', writes_files: false });
    }
  });
  const port = portFactory.createCompatibilityCommandPort(handlers);
  for (const vector of gate.rehearsal_vectors) {
    let vectorResult = null;
    let error = null;
    try {
      vectorResult = router.route(vector.argv.slice(), port);
    } catch (caught) {
      error = caught && caught.message ? caught.message : String(caught);
    }
    reports.push(Object.freeze({
      id: vector.id,
      argv: vector.argv.slice(),
      expected_status: vector.expected_status,
      actual_status: vectorResult && vectorResult.status ? vectorResult.status : null,
      writes_files: vectorResult && vectorResult.writes_files === true,
      matched: !!vectorResult && vectorResult.status === vector.expected_status && vectorResult.writes_files !== true,
      error
    }));
  }
  return { can_run: true, router_load_error: routerLoadError, port_load_error: portLoadError, reports };
}
function publicThinEntrypointRouterCutoverRehearsal(root = packageRoot()) {
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const rehearsalPath = path.join(root, gate.rehearsal_file);
  const moduleReports = [
    inspectPackagedModule(root, gate.router_module, Object.freeze(['ROUTER_SEED', 'describeRouterSeed', 'route'])),
    inspectPackagedModule(root, gate.compatibility_port_module, Object.freeze(['COMPATIBILITY_COMMAND_PORT_SEED', 'createCompatibilityCommandPort', 'describeCompatibilityCommandPortSeed']))
  ];
  const vectorRun = runThinEntrypointRehearsalVectors(root, gate);
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    rehearsal_file: gate.rehearsal_file,
    rehearsal_file_present: fs.existsSync(rehearsalPath),
    rehearsal_status: gate.rehearsal_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      current_entrypoint: gate.current_entrypoint,
      current_entrypoint_line_count: countFileLines(root, gate.current_entrypoint),
      target_entrypoint_max_lines: gate.target_entrypoint_max_lines
    },
    module_reports: moduleReports,
    rehearsal_vector_reports: vectorRun.reports,
    rehearsal_vector_runtime: {
      can_run: vectorRun.can_run,
      router_load_error: vectorRun.router_load_error,
      port_load_error: vectorRun.port_load_error
    },
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    rehearsal_contract: gate,
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
function publicThinEntrypointRouterCutoverRehearsalCheck(root = packageRoot()) {
  const result = publicThinEntrypointRouterCutoverRehearsal(root);
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.rehearsal_status !== 'thin_entrypoint_router_cutover_rehearsed_not_applied') errors.push('thin entrypoint rehearsal status must be rehearsed_not_applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.runtime_cutover_applied !== false) errors.push('thin entrypoint rehearsal must not apply runtime cutover');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('thin entrypoint rehearsal must keep package allowlist unchanged');
  if (gate.boundary.package_file_count !== expectedPackFiles.length) errors.push(`thin entrypoint rehearsal package file count must be ${expectedPackFiles.length}`);
  if (gate.boundary.changes_public_cli_outputs !== false) errors.push('thin entrypoint rehearsal must not change public CLI outputs');
  if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('thin entrypoint rehearsal must not change runtime dependency graph yet');
  if (gate.boundary.thin_entrypoint_rehearsal_command_writes_files !== false) errors.push('architecture --thin-entrypoint-rehearsal must remain no-write');
  if (gate.boundary.thin_entrypoint_rehearsal_check_command_writes_files !== false) errors.push('architecture --thin-entrypoint-rehearsal-check must remain no-write');
  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for thin entrypoint rehearsal`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    for (const exportName of report.expected_exports) {
      if (!report.exports.includes(exportName)) errors.push(`${report.path} must export ${exportName}`);
    }
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
  }
  if (!result.rehearsal_vector_runtime.can_run) errors.push('thin entrypoint rehearsal vectors must be runnable through router and compatibility port');
  for (const report of result.rehearsal_vector_reports) {
    if (!report.matched) errors.push(`thin entrypoint rehearsal vector ${report.id} must return ${report.expected_status} without writes`);
  }
  let rehearsalFileStatus = 'not_present_installed_context_allowed';
  let rehearsalFileSchema = null;
  const rehearsalPath = path.join(root, gate.rehearsal_file);
  if (fs.existsSync(rehearsalPath)) {
    try {
      const artifact = readJson(rehearsalPath);
      rehearsalFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.rehearsal_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.rehearsal_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.rehearsal_file} must seed ${gate.next_work_item_id}`);
      if (artifact.rehearsal_status !== gate.rehearsal_status) errors.push(`${gate.rehearsal_file} must admit ${gate.rehearsal_status}`);
      if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.rehearsal_file} must not apply runtime cutover`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.rehearsal_file} must declare package_allowlist_unchanged`);
      rehearsalFileStatus = 'present_validated';
    } catch (error) {
      rehearsalFileStatus = 'present_invalid_json';
      errors.push(`${gate.rehearsal_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    rehearsalFileStatus = 'missing_source_context';
    errors.push(`${gate.rehearsal_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after thin entrypoint rehearsal`);
  }
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-rehearsal-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      rehearsal_status_admitted: gate.rehearsal_status === 'thin_entrypoint_router_cutover_rehearsed_not_applied',
      projected_pack_files_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      package_allowlist_unchanged: gate.boundary.package_allowlist_unchanged === true,
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      public_cli_outputs_unchanged: gate.boundary.changes_public_cli_outputs === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      packaged_router_and_port_present: result.module_reports.every((report) => report.present),
      packaged_router_and_port_requireable: result.module_reports.every((report) => report.status === 'present_validated'),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      rehearsal_vectors_runnable: result.rehearsal_vector_runtime.can_run,
      rehearsal_vectors_match_expected_status: result.rehearsal_vector_reports.every((report) => report.matched),
      rehearsal_commands_no_write: gate.boundary.thin_entrypoint_rehearsal_command_writes_files === false && gate.boundary.thin_entrypoint_rehearsal_check_command_writes_files === false,
      rehearsal_file_present_or_installed_context_allowed: rehearsalFileStatus === 'present_validated' || rehearsalFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_cutover_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_thin_entrypoint_rehearsal_file: {
      path: gate.rehearsal_file,
      present: fs.existsSync(rehearsalPath),
      status: rehearsalFileStatus,
      schema: rehearsalFileSchema,
      source_context_required: sourceLedgerRequired
    },
    module_reports: result.module_reports,
    rehearsal_vector_reports: result.rehearsal_vector_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    runtime_cutover: result.runtime_cutover,
    boundary: result.boundary,
    errors
  };
}
function publicThinEntrypointRouterCutoverApplication(root = packageRoot()) {
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION;
  const pkg = readJson(path.join(root, 'package.json'));
  const entrypointPath = path.join(root, gate.entrypoint);
  const entrypointExists = fs.existsSync(entrypointPath);
  const entrypointText = entrypointExists ? fs.readFileSync(entrypointPath, 'utf8') : '';
  let composerText = ''; try { composerText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-composer.js'), 'utf8'); } catch(e){}
  let registryText = ''; try { registryText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-command-registry.js'), 'utf8'); } catch(e){}
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const runMainSmoke = (argv) => {
    const originalWrite = process.stdout.write;
    try {
      process.stdout.write = () => true;
      return routeCommand(argv, createRuntimeCompatibilityPort());
    } finally {
      process.stdout.write = originalWrite;
    }
  };
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-application-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    cutover_status: gate.cutover_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_exists: entrypointExists,
      entrypoint_line_count: countFileLines(root, gate.entrypoint),
      imports_router: entrypointText.includes("require('./agent_onboard/command-router')") || composerText.includes("require('./command-router')"),
      imports_compatibility_port: entrypointText.includes("require('./agent_onboard/adapters/compatibility-command-port')") || composerText.includes("require('./adapters/compatibility-command-port')"),
      main_delegates_to_router: /function main[\s\S]*routeCommand\(argv, createRuntimeCompatibilityPort\(\)\)/.test(entrypointText)
    },
    module_reports: [
      inspectPackagedModule(root, gate.router_module, Object.freeze(['ROUTER_SEED', 'describeRouterSeed', 'route'])),
      inspectPackagedModule(root, gate.compatibility_port_module, Object.freeze(['COMPATIBILITY_COMMAND_PORT_SEED', 'createCompatibilityCommandPort', 'describeCompatibilityCommandPortSeed']))
    ],
    cli_smoke: {
      status_result: runMainSmoke(['node', gate.entrypoint, 'status']),
      version_result: runMainSmoke(['node', gate.entrypoint, '--version'])
    },
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    cutover_file: gate.cutover_file,
    cutover_file_present: fs.existsSync(path.join(root, gate.cutover_file)),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
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
    },
    errors: []
  };
}
function publicThinEntrypointRouterCutoverApplicationCheck(root = packageRoot()) {
  const result = publicThinEntrypointRouterCutoverApplication(root);
  const gate = PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.cutover_status !== 'thin_entrypoint_router_cutover_applied') errors.push('thin entrypoint cutover status must be applied');
  if (gate.runtime_cutover_applied !== true) errors.push('thin entrypoint cutover must declare runtime cutover applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (!result.runtime_cutover.entrypoint_exists) errors.push(`${gate.entrypoint} must exist for thin entrypoint cutover`);
  if (!result.runtime_cutover.imports_router) errors.push(`${gate.entrypoint} must import packaged command router`);
  if (!result.runtime_cutover.imports_compatibility_port) errors.push(`${gate.entrypoint} must import packaged compatibility command port`);
  if (!result.runtime_cutover.main_delegates_to_router) errors.push(`${gate.entrypoint} main() must delegate to routeCommand(argv, createRuntimeCompatibilityPort())`);
  if (result.cli_smoke.status_result !== 0) errors.push('main status smoke must return 0');
  if (result.cli_smoke.version_result !== 0) errors.push('main version smoke must return 0');
  for (const report of result.module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for thin entrypoint cutover`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
  }
  let cutoverFileStatus = 'not_present_installed_context_allowed';
  let cutoverFileSchema = null;
  const cutoverPath = path.join(root, gate.cutover_file);
  if (fs.existsSync(cutoverPath)) {
    try {
      const artifact = readJson(cutoverPath);
      cutoverFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.cutover_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.cutover_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.cutover_file} must seed ${gate.next_work_item_id}`);
      if (artifact.cutover_status !== gate.cutover_status) errors.push(`${gate.cutover_file} must admit ${gate.cutover_status}`);
      if (artifact.runtime_cutover_applied !== true) errors.push(`${gate.cutover_file} must declare runtime cutover applied`);
      cutoverFileStatus = 'present_validated';
    } catch (error) {
      cutoverFileStatus = 'present_invalid_json';
      errors.push(`${gate.cutover_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    cutoverFileStatus = 'missing_source_context';
    errors.push(`${gate.cutover_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after thin entrypoint cutover`);
  }
  return {
    schema: 'agent-onboard-public-thin-entrypoint-router-cutover-application-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      cutover_status_applied: gate.cutover_status === 'thin_entrypoint_router_cutover_applied',
      runtime_cutover_applied: gate.runtime_cutover_applied === true,
      entrypoint_imports_packaged_router: result.runtime_cutover.imports_router,
      entrypoint_imports_packaged_compatibility_port: result.runtime_cutover.imports_compatibility_port,
      entrypoint_main_delegates_to_router: result.runtime_cutover.main_delegates_to_router,
      projected_pack_files_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      module_files_in_projected_pack: result.module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      main_smoke_status_ok: result.cli_smoke.status_result === 0,
      main_smoke_version_ok: result.cli_smoke.version_result === 0,
      cutover_file_present_or_installed_context_allowed: cutoverFileStatus === 'present_validated' || cutoverFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_thin_entrypoint_cutover_file: {
      path: gate.cutover_file,
      present: fs.existsSync(cutoverPath),
      status: cutoverFileStatus,
      schema: cutoverFileSchema,
      source_context_required: sourceLedgerRequired
    },
    runtime_cutover: result.runtime_cutover,
    module_reports: result.module_reports,
    cli_smoke: result.cli_smoke,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}
function inspectRuntimeAdapterModule(root, spec) {
  const report = inspectPackagedModule(root, spec.path, Object.freeze([spec.factory, spec.describe]));
  let describedBoundary = null;
  let describedRole = null;
  let describedCommands = [];
  let describeError = null;
  try {
    const moduleValue = require(path.join(root, spec.path));
    const described = typeof moduleValue[spec.describe] === 'function' ? moduleValue[spec.describe]() : null;
    describedBoundary = described && described.boundary ? described.boundary : null;
    describedRole = described && described.role ? described.role : null;
    describedCommands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice() : [];
  } catch (error) {
    describeError = error && error.message ? error.message : String(error);
  }
  return Object.freeze({
    ...report,
    group: spec.group,
    factory: spec.factory,
    describe: spec.describe,
    expected_commands: spec.commands.slice(),
    described_role: describedRole,
    described_commands: describedCommands,
    described_boundary: describedBoundary,
    describe_error: describeError
  });
}
function runSuppressedMainSmoke(argv) {
  const originalWrite = process.stdout.write;
  try {
    process.stdout.write = () => true;
    return routeCommand(argv, createRuntimeCompatibilityPort());
  } finally {
    process.stdout.write = originalWrite;
  }
}
function publicRouterCommandAdapterDelegationExpansion(root = packageRoot()) {
  const gate = PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION;
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const entrypointPath = path.join(root, gate.entrypoint);
  const entrypointExists = fs.existsSync(entrypointPath);
  const entrypointText = entrypointExists ? fs.readFileSync(entrypointPath, 'utf8') : '';
  let composerText = ''; try { composerText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-composer.js'), 'utf8'); } catch(e){}
  let registryText = ''; try { registryText = fs.readFileSync(path.join(root, 'cli/agent_onboard/runtime-command-registry.js'), 'utf8'); } catch(e){}
  const port = createRuntimeCompatibilityPort();
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  }
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const smokeReports = gate.smoke_vectors.map((vector) => {
    let exitCode = null;
    let error = null;
    try {
      exitCode = runSuppressedMainSmoke(vector.argv.slice());
    } catch (caught) {
      error = caught && caught.message ? caught.message : String(caught);
    }
    return Object.freeze({
      id: vector.id,
      argv: vector.argv.slice(),
      expected_exit_code: vector.expected_exit_code,
      actual_exit_code: exitCode,
      matched: exitCode === vector.expected_exit_code && !error,
      error
    });
  });
  return {
    schema: 'agent-onboard-public-router-command-adapter-delegation-expansion-result-001',
    status: 'ok',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.command,
    check_command: gate.check_command,
    package_root: root,
    package_context: context.package_context,
    delegation_file: gate.delegation_file,
    delegation_file_present: fs.existsSync(path.join(root, gate.delegation_file)),
    delegation_status: gate.delegation_status,
    runtime_cutover: {
      applied: gate.runtime_cutover_applied,
      entrypoint: gate.entrypoint,
      entrypoint_exists: entrypointExists,
      imports_router: entrypointText.includes("require('./agent_onboard/command-router')"),
      imports_compatibility_port: entrypointText.includes("require('./agent_onboard/adapters/compatibility-command-port')"),
      imports_core_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/core')") || composerText.includes("require('./adapters/commands/core')") || registryText.includes("require('./adapters/commands/core')"),
      imports_package_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/release-package')") || composerText.includes("require('./adapters/commands/release-package')") || registryText.includes("require('./adapters/commands/release-package')"),
      imports_architecture_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/architecture')") || composerText.includes("require('./adapters/commands/architecture')") || registryText.includes("require('./adapters/commands/architecture')"),
      imports_authority_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/authority')") || composerText.includes("require('./adapters/commands/authority')") || registryText.includes("require('./adapters/commands/authority')"),
      imports_target_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/target')") || composerText.includes("require('./adapters/commands/target')") || registryText.includes("require('./adapters/commands/target')"),
      imports_work_items_adapter: entrypointText.includes("require('./agent_onboard/adapters/commands/work-items')") || composerText.includes("require('./adapters/commands/work-items')") || registryText.includes("require('./adapters/commands/work-items')"),
      imports_work_items_service: entrypointText.includes("require('./agent_onboard/domains/work-items')") || composerText.includes("require('./domains/work-items')") || registryText.includes("require('./domains/work-items')"),
      main_delegates_to_router: /function main[\s\S]*routeCommand\(argv, createRuntimeCompatibilityPort\(\)\)/.test(entrypointText)
    },
    compatibility_port: {
      schema: port.schema,
      command_adapters_required_in_this_gate: port.seed && port.seed.boundary && port.seed.boundary.command_adapters_required_in_this_gate === true,
      adapter_delegation_expanded_in_this_gate: port.seed && port.seed.boundary && port.seed.boundary.adapter_delegation_expanded_in_this_gate === true,
      delegated_commands: Array.isArray(port.delegated_commands) ? port.delegated_commands.slice() : [],
      adapter_groups: port.adapter_groups || null
    },
    adapter_module_reports: gate.adapter_modules.map((spec) => inspectRuntimeAdapterModule(root, spec)),
    smoke_reports: smokeReports,
    expected_pack_files: gate.expected_pack_files.slice().sort(),
    projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
    milestone_state: {
      work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
      next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
    },
    delegation_contract: gate,
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
function publicRouterCommandAdapterDelegationExpansionCheck(root = packageRoot()) {
  const result = publicRouterCommandAdapterDelegationExpansion(root);
  const gate = PUBLIC_ROUTER_COMMAND_ADAPTER_DELEGATION_EXPANSION;
  const sourceLedgerRequired = result.package_context === 'source_repository';
  const expectedPackFiles = gate.expected_pack_files.slice().sort();
  const errors = [];
  if (gate.delegation_status !== 'router_command_adapter_delegation_expanded') errors.push('router command adapter delegation status must be expanded');
  if (gate.runtime_cutover_applied !== true) errors.push('router command adapter delegation must keep runtime cutover applied');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (!result.runtime_cutover.entrypoint_exists) errors.push(`${gate.entrypoint} must exist`);
  if (!result.runtime_cutover.imports_router) errors.push(`${gate.entrypoint} must import packaged command router`);
  if (!result.runtime_cutover.imports_compatibility_port) errors.push(`${gate.entrypoint} must import packaged compatibility command port`);
  if (!result.runtime_cutover.imports_core_adapter) errors.push(`${gate.entrypoint} must import packaged core command adapter`);
  if (!result.runtime_cutover.imports_package_adapter) errors.push(`${gate.entrypoint} must import packaged release package command adapter`);
  if (!result.runtime_cutover.imports_architecture_adapter) errors.push(`${gate.entrypoint} must import packaged architecture command adapter`);
  if (!result.runtime_cutover.imports_authority_adapter) errors.push(`${gate.entrypoint} must import packaged authority command adapter`);
  if (!result.runtime_cutover.imports_target_adapter) errors.push(`${gate.entrypoint} must import packaged target command adapter`);
  if (!result.runtime_cutover.imports_work_items_adapter) errors.push(`${gate.entrypoint} must import packaged work-items command adapter`);
  if (!result.runtime_cutover.imports_work_items_service) errors.push(`${gate.entrypoint} must import packaged work-items runtime service`);
  if (!result.runtime_cutover.main_delegates_to_router) errors.push(`${gate.entrypoint} main() must continue delegating through command router`);
  if (!result.compatibility_port.command_adapters_required_in_this_gate) errors.push('compatibility command port must require command adapters in this gate');
  if (!result.compatibility_port.adapter_delegation_expanded_in_this_gate) errors.push('compatibility command port must declare adapter delegation expanded');
  if (!arrayEquals(result.compatibility_port.delegated_commands.slice().sort(), gate.delegated_commands.slice().sort())) {
    errors.push(`runtime delegated commands must be ${gate.delegated_commands.join(', ')}`);
  }
  for (const report of result.adapter_module_reports) {
    if (!report.present) errors.push(`${report.path} must exist for router command adapter delegation`);
    if (report.status !== 'present_validated') errors.push(`${report.path} must be require-able without side effects${report.require_error ? `: ${report.require_error}` : ''}`);
    if (report.describe_error) errors.push(`${report.path} describe contract failed: ${report.describe_error}`);
    if (!result.projected_pack_files.includes(report.path)) errors.push(`${report.path} must remain in projected npm pack files`);
    if (!report.described_boundary || report.described_boundary.used_by_runtime_entrypoint_in_this_gate !== true) errors.push(`${report.path} must declare runtime entrypoint use in this gate`);
    if (!report.described_boundary || report.described_boundary.packaged_in_npm_tarball_in_this_gate !== true) errors.push(`${report.path} must declare npm tarball inclusion in this gate`);
    for (const command of report.expected_commands.filter((item) => !item.startsWith('-'))) {
      if (!report.described_commands.includes(command)) errors.push(`${report.path} must describe owned command ${command}`);
    }
  }
  for (const report of result.smoke_reports) {
    if (!report.matched) errors.push(`router adapter delegation smoke ${report.id} must return ${report.expected_exit_code}`);
  }
  let delegationFileStatus = 'not_present_installed_context_allowed';
  let delegationFileSchema = null;
  const delegationPath = path.join(root, gate.delegation_file);
  if (fs.existsSync(delegationPath)) {
    try {
      const artifact = readJson(delegationPath);
      delegationFileSchema = artifact.schema || null;
      if (artifact.schema !== gate.schema) errors.push(`${gate.delegation_file} schema must be ${gate.schema}`);
      if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.delegation_file} must identify ${gate.work_item_id}`);
      if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.delegation_file} must seed ${gate.next_work_item_id}`);
      if (artifact.delegation_status !== gate.delegation_status) errors.push(`${gate.delegation_file} must admit ${gate.delegation_status}`);
      if (artifact.runtime_cutover_applied !== true) errors.push(`${gate.delegation_file} must keep runtime cutover applied`);
      if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.delegation_file} must declare package_allowlist_unchanged`);
      delegationFileStatus = 'present_validated';
    } catch (error) {
      delegationFileStatus = 'present_invalid_json';
      errors.push(`${gate.delegation_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (sourceLedgerRequired) {
    delegationFileStatus = 'missing_source_context';
    errors.push(`${gate.delegation_file} must exist in source repository context`);
  }
  const workItem = result.milestone_state.work_item;
  const nextWorkItem = result.milestone_state.next_work_item;
  if (sourceLedgerRequired) {
    if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
    else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router command adapter delegation expansion`);
  }
  return {
    schema: 'agent-onboard-public-router-command-adapter-delegation-expansion-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    package_context: result.package_context,
    validated: {
      delegation_status_expanded: gate.delegation_status === 'router_command_adapter_delegation_expanded',
      runtime_cutover_still_applied: gate.runtime_cutover_applied === true,
      entrypoint_imports_packaged_adapters: result.runtime_cutover.imports_core_adapter && result.runtime_cutover.imports_package_adapter && result.runtime_cutover.imports_architecture_adapter && result.runtime_cutover.imports_authority_adapter && result.runtime_cutover.imports_target_adapter && result.runtime_cutover.imports_work_items_adapter,
      entrypoint_imports_work_items_service: result.runtime_cutover.imports_work_items_service,
      compatibility_port_delegates_to_adapters: result.compatibility_port.command_adapters_required_in_this_gate && result.compatibility_port.adapter_delegation_expanded_in_this_gate,
      delegated_commands_match_contract: arrayEquals(result.compatibility_port.delegated_commands.slice().sort(), gate.delegated_commands.slice().sort()),
      adapter_modules_present: result.adapter_module_reports.every((report) => report.present),
      adapter_modules_requireable: result.adapter_module_reports.every((report) => report.status === 'present_validated'),
      adapter_modules_used_by_runtime: result.adapter_module_reports.every((report) => report.described_boundary && report.described_boundary.used_by_runtime_entrypoint_in_this_gate === true),
      adapter_modules_in_projected_pack: result.adapter_module_reports.every((report) => result.projected_pack_files.includes(report.path)),
      runtime_smoke_vectors_pass: result.smoke_reports.every((report) => report.matched),
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      delegation_commands_no_write: gate.boundary.router_adapter_delegation_command_writes_files === false && gate.boundary.router_adapter_delegation_check_command_writes_files === false,
      delegation_file_present_or_installed_context_allowed: delegationFileStatus === 'present_validated' || delegationFileStatus === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
      next_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status))
    },
    source_router_command_adapter_delegation_file: {
      path: gate.delegation_file,
      present: fs.existsSync(delegationPath),
      status: delegationFileStatus,
      schema: delegationFileSchema,
      source_context_required: sourceLedgerRequired
    },
    runtime_cutover: result.runtime_cutover,
    compatibility_port: result.compatibility_port,
    adapter_module_reports: result.adapter_module_reports,
    smoke_reports: result.smoke_reports,
    milestone_state: result.milestone_state,
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}
  return Object.freeze({
    publicModularRuntimePackageInclusionPlan,
    publicModularRuntimePackageInclusionPlanCheck,
    publicPackagedRouterPortInclusion,
    publicPackagedRouterPortInclusionCheck,
    publicThinEntrypointRouterCutoverRehearsal,
    publicThinEntrypointRouterCutoverRehearsalCheck,
    publicThinEntrypointRouterCutoverApplication,
    publicThinEntrypointRouterCutoverApplicationCheck,
    publicRouterCommandAdapterDelegationExpansion,
    publicRouterCommandAdapterDelegationExpansionCheck
  });
}
module.exports = Object.freeze({
  createPublicRouterCutoverService
});
