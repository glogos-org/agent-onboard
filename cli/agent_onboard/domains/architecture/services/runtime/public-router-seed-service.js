'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicRouterSeedService missing dependency: ${name}`);
  return value;
}

function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}

function createPublicRouterSeedService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_THIN_CLI_ROUTER_SEED = required('PUBLIC_THIN_CLI_ROUTER_SEED', options.PUBLIC_THIN_CLI_ROUTER_SEED);
  const PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED = required('PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED', options.PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);

  function publicThinCliRouterSeed(root = packageRoot()) {
    const gate = PUBLIC_THIN_CLI_ROUTER_SEED;
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const routerModulePath = path.join(root, gate.router_module);
    const artifactPath = path.join(root, gate.seed_file);
    const routerLineCount = countFileLines(root, gate.router_module);
    let routerModuleStatus = 'not_present_installed_context_allowed';
    let routerModuleSchema = null;
    let routerModuleExports = [];
    let routerRequireError = null;
    if (fs.existsSync(routerModulePath)) {
      try {
        delete require.cache[require.resolve(routerModulePath)];
        const routerModule = require(routerModulePath);
        routerModuleExports = Object.keys(routerModule).sort();
        const described = typeof routerModule.describeRouterSeed === 'function' ? routerModule.describeRouterSeed() : null;
        routerModuleSchema = described && described.schema ? described.schema : null;
        routerModuleStatus = 'present_validated';
      } catch (error) {
        routerModuleStatus = 'present_require_failed';
        routerRequireError = error && error.message ? error.message : String(error);
      }
    }
    const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
    let ledger = null;
    if (fs.existsSync(ledgerPath)) {
      try { ledger = readJson(ledgerPath); } catch { ledger = null; }
    }
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    return {
      schema: 'agent-onboard-public-thin-cli-router-seed-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      seed_file: gate.seed_file,
      seed_file_present: fs.existsSync(artifactPath),
      router_module: {
        path: gate.router_module,
        present: fs.existsSync(routerModulePath),
        status: routerModuleStatus,
        schema: routerModuleSchema,
        exports: routerModuleExports,
        require_error: routerRequireError,
        line_count: routerLineCount,
        max_lines: gate.router_seed_max_lines
      },
      runtime_cutover: {
        applied: gate.runtime_cutover_applied,
        entrypoint: gate.entrypoint,
        entrypoint_line_count: countFileLines(root, gate.entrypoint),
        router_module_used_by_entrypoint_in_this_gate: gate.boundary.uses_router_module_as_runtime_entrypoint
      },
      package_strategy: gate.package_strategy,
      expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
      milestone_state: {
        work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
        next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
      },
      router_contract: gate,
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

  function publicThinCliRouterSeedCheck(root = packageRoot()) {
    const result = publicThinCliRouterSeed(root);
    const gate = PUBLIC_THIN_CLI_ROUTER_SEED;
    const sourceLedgerRequired = result.package_context === 'source_repository';
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];
    if (gate.seed_status !== 'thin_cli_router_seed_admitted') errors.push('thin CLI router seed status must be admitted');
    if (gate.runtime_cutover_applied !== false) errors.push('router seed gate must not apply runtime cutover');
    if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('router seed must preserve controlled_source_module_inclusion package strategy');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.thin_router_command_writes_files !== false) errors.push('architecture --thin-router must remain no-write');
    if (gate.boundary.thin_router_check_command_writes_files !== false) errors.push('architecture --thin-router-check must remain no-write');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('router seed must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('router seed must not change packaged CLI runtime dependency graph');
    if (gate.boundary.uses_router_module_as_runtime_entrypoint !== false) errors.push('router seed must not use the source router module as the packaged runtime entrypoint yet');
    if (gate.boundary.source_router_module_remains_out_of_pack !== true) errors.push('source router module must remain out of npm pack for this gate');
    if (result.router_module.line_count > gate.router_seed_max_lines) errors.push(`${gate.router_module} must stay within ${gate.router_seed_max_lines} lines`);

    let artifactStatus = 'not_present_installed_context_allowed';
    let artifactSchema = null;
    const artifactPath = path.join(root, gate.seed_file);
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = readJson(artifactPath);
        artifactSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.seed_file} schema must be ${gate.schema}`);
        if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.seed_file} must identify ${gate.work_item_id}`);
        if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.seed_file} must seed ${gate.next_work_item_id}`);
        if (artifact.router_module !== gate.router_module) errors.push(`${gate.seed_file} must declare ${gate.router_module}`);
        if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.seed_file} must not apply runtime cutover`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.seed_file} must preserve package_allowlist_unchanged`);
        artifactStatus = 'present_validated';
      } catch (error) {
        artifactStatus = 'present_invalid_json';
        errors.push(`${gate.seed_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (sourceLedgerRequired) {
      artifactStatus = 'missing_source_context';
      errors.push(`${gate.seed_file} must exist in source repository context`);
    }

    const routerModulePresentOrAllowed = result.router_module.present || result.package_context === 'installed_package';
    if (!routerModulePresentOrAllowed) errors.push(`${gate.router_module} must exist in source repository context`);
    if (result.router_module.present) {
      if (result.router_module.status !== 'present_validated') errors.push(`${gate.router_module} must be require-able without side effects${result.router_module.require_error ? `: ${result.router_module.require_error}` : ''}`);
      if (result.router_module.schema !== 'agent-onboard-public-thin-cli-router-seed-module-001') errors.push(`${gate.router_module} must expose router seed module schema`);
      for (const exportName of gate.expected_router_export_names) {
        if (!result.router_module.exports.includes(exportName)) errors.push(`${gate.router_module} must export ${exportName}`);
      }
    }
    const workItem = result.milestone_state.work_item;
    const nextWorkItem = result.milestone_state.next_work_item;
    if (sourceLedgerRequired) {
      if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
      else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router seed admission`);
    }

    return {
      schema: 'agent-onboard-public-thin-cli-router-seed-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      package_context: result.package_context,
      validated: {
        router_seed_status_admitted: gate.seed_status === 'thin_cli_router_seed_admitted',
        router_module_present_or_installed_context_allowed: routerModulePresentOrAllowed,
        router_module_requireable_when_present: !result.router_module.present || result.router_module.status === 'present_validated',
        router_module_under_line_budget: result.router_module.line_count <= gate.router_seed_max_lines,
        router_exports_contract: gate.expected_router_export_names.every((name) => !result.router_module.present || result.router_module.exports.includes(name)),
        runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
        packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        router_module_out_of_pack_for_this_gate: gate.boundary.source_router_module_remains_out_of_pack === true,
        seed_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
        work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
        next_port_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
        thin_router_commands_no_write: gate.boundary.thin_router_command_writes_files === false && gate.boundary.thin_router_check_command_writes_files === false
      },
      router_module: result.router_module,
      runtime_cutover: result.runtime_cutover,
      source_thin_router_seed_file: {
        path: gate.seed_file,
        present: fs.existsSync(artifactPath),
        status: artifactStatus,
        schema: artifactSchema,
        source_context_required: sourceLedgerRequired
      },
      milestone_state: result.milestone_state,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: result.projected_pack_files,
      boundary: result.boundary,
      errors
    };
  }

  function publicCompatibilityCommandPortSeed(root = packageRoot()) {
    const gate = PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED;
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const adapterModulePath = path.join(root, gate.adapter_module);
    const portModulePath = path.join(root, gate.port_module);
    const artifactPath = path.join(root, gate.seed_file);
    const adapterLineCount = countFileLines(root, gate.adapter_module);
    const portLineCount = countFileLines(root, gate.port_module);
    let adapterModuleStatus = 'not_present_installed_context_allowed';
    let adapterModuleSchema = null;
    let adapterModuleExports = [];
    let adapterCommandGroups = [];
    let adapterRequireError = null;
    if (fs.existsSync(adapterModulePath)) {
      try {
        delete require.cache[require.resolve(adapterModulePath)];
        const adapterModule = require(adapterModulePath);
        adapterModuleExports = Object.keys(adapterModule).sort();
        const described = typeof adapterModule.describeCompatibilityCommandPortSeed === 'function' ? adapterModule.describeCompatibilityCommandPortSeed() : null;
        adapterModuleSchema = described && described.schema ? described.schema : null;
        adapterCommandGroups = described && described.command_groups ? Object.keys(described.command_groups).sort() : [];
        adapterModuleStatus = 'present_validated';
      } catch (error) {
        adapterModuleStatus = 'present_require_failed';
        adapterRequireError = error && error.message ? error.message : String(error);
      }
    }
    let portModuleStatus = 'not_present_installed_context_allowed';
    let portModuleExports = [];
    let portRequireError = null;
    if (fs.existsSync(portModulePath)) {
      try {
        delete require.cache[require.resolve(portModulePath)];
        const portModule = require(portModulePath);
        portModuleExports = Object.keys(portModule).sort();
        portModuleStatus = 'present_validated';
      } catch (error) {
        portModuleStatus = 'present_require_failed';
        portRequireError = error && error.message ? error.message : String(error);
      }
    }
    const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
    let ledger = null;
    if (fs.existsSync(ledgerPath)) {
      try { ledger = readJson(ledgerPath); } catch { ledger = null; }
    }
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    return {
      schema: 'agent-onboard-public-compatibility-command-port-seed-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      seed_file: gate.seed_file,
      seed_file_present: fs.existsSync(artifactPath),
      adapter_module: {
        path: gate.adapter_module,
        present: fs.existsSync(adapterModulePath),
        status: adapterModuleStatus,
        schema: adapterModuleSchema,
        exports: adapterModuleExports,
        command_groups: adapterCommandGroups,
        require_error: adapterRequireError,
        line_count: adapterLineCount,
        max_lines: gate.port_seed_max_lines
      },
      port_module: {
        path: gate.port_module,
        present: fs.existsSync(portModulePath),
        status: portModuleStatus,
        exports: portModuleExports,
        require_error: portRequireError,
        line_count: portLineCount,
        max_lines: gate.port_seed_max_lines
      },
      router_module: gate.router_module,
      runtime_cutover: {
        applied: gate.runtime_cutover_applied,
        entrypoint: 'cli/agent-onboard.js',
        entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js'),
        compatibility_port_used_by_entrypoint_in_this_gate: gate.boundary.uses_compatibility_port_as_runtime_entrypoint
      },
      package_strategy: gate.package_strategy,
      expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
      milestone_state: {
        work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
        next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
      },
      port_contract: gate,
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

  function publicCompatibilityCommandPortSeedCheck(root = packageRoot()) {
    const result = publicCompatibilityCommandPortSeed(root);
    const gate = PUBLIC_COMPATIBILITY_COMMAND_PORT_SEED;
    const sourceLedgerRequired = result.package_context === 'source_repository';
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];
    if (gate.seed_status !== 'compatibility_command_port_seed_admitted') errors.push('compatibility command port seed status must be admitted');
    if (gate.runtime_cutover_applied !== false) errors.push('compatibility port seed gate must not apply runtime cutover');
    if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push('compatibility port seed must preserve controlled_source_module_inclusion package strategy');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.compatibility_port_command_writes_files !== false) errors.push('architecture --compatibility-port must remain no-write');
    if (gate.boundary.compatibility_port_check_command_writes_files !== false) errors.push('architecture --compatibility-port-check must remain no-write');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('compatibility port seed must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('compatibility port seed must not change packaged CLI runtime dependency graph');
    if (gate.boundary.uses_compatibility_port_as_runtime_entrypoint !== false) errors.push('compatibility port seed must not use source modules as the packaged runtime entrypoint yet');
    if (gate.boundary.source_port_modules_remain_out_of_pack !== true) errors.push('source compatibility port modules must remain out of npm pack for this gate');
    if (result.adapter_module.line_count > gate.port_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.port_seed_max_lines} lines`);
    if (result.port_module.line_count > gate.port_seed_max_lines) errors.push(`${gate.port_module} must stay within ${gate.port_seed_max_lines} lines`);

    let artifactStatus = 'not_present_installed_context_allowed';
    let artifactSchema = null;
    const artifactPath = path.join(root, gate.seed_file);
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = readJson(artifactPath);
        artifactSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.seed_file} schema must be ${gate.schema}`);
        if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.seed_file} must identify ${gate.work_item_id}`);
        if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.seed_file} must seed ${gate.next_work_item_id}`);
        if (artifact.adapter_module !== gate.adapter_module) errors.push(`${gate.seed_file} must declare ${gate.adapter_module}`);
        if (artifact.port_module !== gate.port_module) errors.push(`${gate.seed_file} must declare ${gate.port_module}`);
        if (artifact.runtime_cutover_applied !== false) errors.push(`${gate.seed_file} must not apply runtime cutover`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.seed_file} must preserve package_allowlist_unchanged`);
        artifactStatus = 'present_validated';
      } catch (error) {
        artifactStatus = 'present_invalid_json';
        errors.push(`${gate.seed_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (sourceLedgerRequired) {
      artifactStatus = 'missing_source_context';
      errors.push(`${gate.seed_file} must exist in source repository context`);
    }

    const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
    const portModulePresentOrAllowed = result.port_module.present || result.package_context === 'installed_package';
    if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
    if (!portModulePresentOrAllowed) errors.push(`${gate.port_module} must exist in source repository context`);
    if (result.adapter_module.present) {
      if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
      if (result.adapter_module.schema !== 'agent-onboard-public-compatibility-command-port-seed-module-001') errors.push(`${gate.adapter_module} must expose compatibility port seed module schema`);
      for (const exportName of gate.expected_adapter_export_names) {
        if (!result.adapter_module.exports.includes(exportName)) errors.push(`${gate.adapter_module} must export ${exportName}`);
      }
      for (const groupName of gate.expected_command_groups) {
        if (!result.adapter_module.command_groups.includes(groupName)) errors.push(`${gate.adapter_module} must declare command group ${groupName}`);
      }
    }
    if (result.port_module.present) {
      if (result.port_module.status !== 'present_validated') errors.push(`${gate.port_module} must be require-able without side effects${result.port_module.require_error ? `: ${result.port_module.require_error}` : ''}`);
      for (const exportName of gate.expected_port_export_names) {
        if (!result.port_module.exports.includes(exportName)) errors.push(`${gate.port_module} must export ${exportName}`);
      }
    }
    const workItem = result.milestone_state.work_item;
    const nextWorkItem = result.milestone_state.next_work_item;
    if (sourceLedgerRequired) {
      if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
      else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after compatibility port seed admission`);
    }

    return {
      schema: 'agent-onboard-public-compatibility-command-port-seed-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      package_context: result.package_context,
      validated: {
        compatibility_port_seed_status_admitted: gate.seed_status === 'compatibility_command_port_seed_admitted',
        adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
        port_module_present_or_installed_context_allowed: portModulePresentOrAllowed,
        adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
        port_module_requireable_when_present: !result.port_module.present || result.port_module.status === 'present_validated',
        port_modules_under_line_budget: result.adapter_module.line_count <= gate.port_seed_max_lines && result.port_module.line_count <= gate.port_seed_max_lines,
        adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
        port_exports_contract: gate.expected_port_export_names.every((name) => !result.port_module.present || result.port_module.exports.includes(name)),
        command_group_contract: gate.expected_command_groups.every((name) => !result.adapter_module.present || result.adapter_module.command_groups.includes(name)),
        runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
        packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        port_modules_out_of_pack_for_this_gate: gate.boundary.source_port_modules_remain_out_of_pack === true,
        seed_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
        work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
        next_adapter_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
        compatibility_port_commands_no_write: gate.boundary.compatibility_port_command_writes_files === false && gate.boundary.compatibility_port_check_command_writes_files === false
      },
      adapter_module: result.adapter_module,
      port_module: result.port_module,
      runtime_cutover: result.runtime_cutover,
      source_compatibility_port_seed_file: {
        path: gate.seed_file,
        present: fs.existsSync(artifactPath),
        status: artifactStatus,
        schema: artifactSchema,
        source_context_required: sourceLedgerRequired
      },
      milestone_state: result.milestone_state,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: result.projected_pack_files,
      boundary: result.boundary,
      errors
    };
  }


  return Object.freeze({
    publicThinCliRouterSeed,
    publicThinCliRouterSeedCheck,
    publicCompatibilityCommandPortSeed,
    publicCompatibilityCommandPortSeedCheck
  });
}

module.exports = Object.freeze({
  createPublicRouterSeedService,
  countFileLines
});
