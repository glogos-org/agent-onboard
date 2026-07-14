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

function createPublicPackagedRouterPortInclusionService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION = required('PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION', options.PUBLIC_PACKAGED_ROUTER_PORT_INCLUSION);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
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
  return Object.freeze({
    publicPackagedRouterPortInclusion,
    publicPackagedRouterPortInclusionCheck
  });
}

module.exports = Object.freeze({
  createPublicPackagedRouterPortInclusionService
});
