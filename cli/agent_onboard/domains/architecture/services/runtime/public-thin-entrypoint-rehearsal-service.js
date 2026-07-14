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

function createPublicThinEntrypointRehearsalService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL = required('PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL', options.PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_REHEARSAL);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
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
  return Object.freeze({
    publicThinEntrypointRouterCutoverRehearsal,
    publicThinEntrypointRouterCutoverRehearsalCheck
  });
}

module.exports = Object.freeze({
  createPublicThinEntrypointRehearsalService
});
