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

function createPublicThinEntrypointCutoverService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION = required('PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION', options.PUBLIC_THIN_ENTRYPOINT_ROUTER_CUTOVER_APPLICATION);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const routeCommand = required('routeCommand', options.routeCommand);
  const createRuntimeCompatibilityPort = required('createRuntimeCompatibilityPort', options.createRuntimeCompatibilityPort);
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
  return Object.freeze({
    publicThinEntrypointRouterCutoverApplication,
    publicThinEntrypointRouterCutoverApplicationCheck
  });
}

module.exports = Object.freeze({
  createPublicThinEntrypointCutoverService
});
