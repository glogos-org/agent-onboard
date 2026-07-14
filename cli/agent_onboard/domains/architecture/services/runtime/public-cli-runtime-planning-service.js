'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicCliRuntimePlanningService missing dependency: ${name}`);
  return value;
}

function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}

function createPublicCliRuntimePlanningService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING = required('PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING', options.PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING);
  const packageRoot = required('packageRoot', options.packageRoot);
  const readJson = required('readJson', options.readJson);
  const sourceContext = required('sourceContext', options.sourceContext);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const arrayEquals = required('arrayEquals', options.arrayEquals);

  function plan(root = packageRoot()) {
    const gate = PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING;
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
    let ledger = null;
    if (fs.existsSync(ledgerPath)) {
      try { ledger = readJson(ledgerPath); } catch { ledger = null; }
    }
    const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    const cliLineCount = countFileLines(root, gate.current_runtime_observation.entrypoint);
    const sourceDomainModules = ['src/domains/core.js', 'src/domains/authority.js', 'src/domains/work-items.js', 'src/domains/claims.js'];
    const sourceDomainLineCount = sourceDomainModules.reduce((sum, rel) => sum + countFileLines(root, rel), 0);
    return {
      schema: 'agent-onboard-public-cli-runtime-de-monolith-planning-result-001',
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
      planning_file_present: fs.existsSync(path.join(root, gate.planning_file)),
      milestone_state: {
        milestone: milestones.find((item) => item.id === gate.milestone_id) || null,
        work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
        next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
      },
      observed_runtime: {
        cli_entrypoint: gate.current_runtime_observation.entrypoint,
        cli_entrypoint_exists: fs.existsSync(path.join(root, gate.current_runtime_observation.entrypoint)),
        cli_entrypoint_line_count: cliLineCount,
        source_domain_module_line_count: sourceDomainLineCount,
        source_domain_modules_present: sourceDomainModules.filter((rel) => fs.existsSync(path.join(root, rel))),
        monolith_line_count_floor: gate.current_runtime_observation.observed_cli_line_count_floor,
        extracted_service_line_count_ceiling: gate.current_runtime_observation.extracted_service_line_count_ceiling,
        monolith_debt_declared: gate.current_runtime_observation.monolith_debt_declared
      },
      selected_package_strategy: gate.selected_package_strategy,
      target_runtime_shape: gate.target_runtime_shape,
      cli_line_budget: gate.cli_line_budget,
      expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
      planning_contract: gate,
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

  function check(root = packageRoot()) {
    const result = plan(root);
    const gate = PUBLIC_CLI_RUNTIME_DE_MONOLITH_PLANNING;
    const sourceLedgerRequired = result.package_context === 'source_repository';
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];
    if (gate.planning_status !== 'cli_runtime_de_monolith_plan_admitted') errors.push('CLI runtime de-monolith planning status must be admitted');
    if (!result.observed_runtime.cli_entrypoint_exists) errors.push(`${gate.current_runtime_observation.entrypoint} must exist`);
    if (result.observed_runtime.cli_entrypoint_line_count > gate.current_runtime_observation.extracted_service_line_count_ceiling) errors.push(`${gate.current_runtime_observation.entrypoint} must stay under ${gate.current_runtime_observation.extracted_service_line_count_ceiling} lines after service extraction`);
    if (gate.current_runtime_observation.monolith_debt_declared !== true) errors.push('CLI monolith debt must be declared');
    if (gate.selected_package_strategy.id !== 'controlled_source_module_inclusion') errors.push('selected package strategy must be controlled_source_module_inclusion');
    if (gate.selected_package_strategy.current_gate_keeps_compact_pack_allowlist !== true) errors.push('planning gate must keep compact package allowlist unchanged');
    if (gate.cli_line_budget.target_entrypoint_max_lines > 300) errors.push('target thin CLI entrypoint line budget must be <= 300 lines');
    if (gate.cli_line_budget.current_monolith_growth_allowed !== false) errors.push('current monolith growth must not be allowed');
    if (gate.cli_line_budget.no_new_domain_logic_in_monolith !== true) errors.push('new domain logic must be blocked from the CLI monolith');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.cli_runtime_plan_command_writes_files !== false) errors.push('architecture --cli-runtime-plan must remain no-write');
    if (gate.boundary.cli_runtime_check_command_writes_files !== false) errors.push('architecture --cli-runtime-check must remain no-write');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('CLI runtime planning gate must preserve package allowlist');
    if (gate.boundary.creates_runtime_modules !== false) errors.push('CLI runtime planning gate must not create runtime modules');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('CLI runtime planning gate must not change runtime dependency graph');

    const artifactPath = path.join(root, gate.planning_file);
    let fileStatus = 'not_present_installed_context_allowed';
    let fileSchema = null;
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = readJson(artifactPath);
        fileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.planning_file} schema must be ${gate.schema}`);
        if (artifact.work_item_id !== gate.work_item_id) errors.push(`${gate.planning_file} must identify ${gate.work_item_id}`);
        if (artifact.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.planning_file} must seed ${gate.next_work_item_id}`);
        if (artifact.planning_status !== gate.planning_status) errors.push(`${gate.planning_file} planning_status must be ${gate.planning_status}`);
        if (!artifact.selected_package_strategy || artifact.selected_package_strategy.id !== gate.selected_package_strategy.id) errors.push(`${gate.planning_file} must select ${gate.selected_package_strategy.id}`);
        if (!artifact.current_runtime_observation || artifact.current_runtime_observation.extracted_service_line_count_ceiling !== gate.current_runtime_observation.extracted_service_line_count_ceiling) errors.push(`${gate.planning_file} must declare extracted_service_line_count_ceiling ${gate.current_runtime_observation.extracted_service_line_count_ceiling}`);
        if (!artifact.cli_line_budget || artifact.cli_line_budget.target_entrypoint_max_lines > 300) errors.push(`${gate.planning_file} must set target_entrypoint_max_lines <= 300`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.planning_file} must preserve package_allowlist_unchanged`);
        fileStatus = 'present_validated';
      } catch (error) {
        fileStatus = 'present_invalid_json';
        errors.push(`${gate.planning_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (sourceLedgerRequired) {
      fileStatus = 'missing_source_context';
      errors.push(`${gate.planning_file} must exist in source repository context`);
    }

    const milestone = result.milestone_state.milestone;
    const workItem = result.milestone_state.work_item;
    const nextWorkItem = result.milestone_state.next_work_item;
    if (sourceLedgerRequired) {
      if (!milestone) errors.push(`${gate.milestone_id} milestone must exist`);
      else if (!['open', 'closed'].includes(milestone.status)) errors.push(`${gate.milestone_id} milestone must be open or closed`);
      if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
      else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after router seed admission`);
    }

    return {
      schema: 'agent-onboard-public-cli-runtime-de-monolith-planning-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      package_context: result.package_context,
      validated: {
        monolith_debt_declared: gate.current_runtime_observation.monolith_debt_declared === true,
        cli_line_count_floor_observed: result.observed_runtime.cli_entrypoint_line_count >= gate.current_runtime_observation.observed_cli_line_count_floor,
        architecture_service_extraction_line_count_observed: result.observed_runtime.cli_entrypoint_line_count <= gate.current_runtime_observation.extracted_service_line_count_ceiling,
        controlled_source_module_inclusion_selected: gate.selected_package_strategy.id === 'controlled_source_module_inclusion',
        compact_pack_allowlist_unchanged_for_this_gate: arrayEquals(result.projected_pack_files, expectedPackFiles),
        thin_entrypoint_budget_declared: gate.cli_line_budget.target_entrypoint_max_lines <= 300,
        monolith_growth_blocked: gate.cli_line_budget.current_monolith_growth_allowed === false && gate.cli_line_budget.no_new_domain_logic_in_monolith === true,
        planning_file_present_or_installed_context_allowed: fileStatus === 'present_validated' || fileStatus === 'not_present_installed_context_allowed',
        work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed'),
        next_router_gate_open_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
        cli_runtime_commands_no_write: gate.boundary.cli_runtime_plan_command_writes_files === false && gate.boundary.cli_runtime_check_command_writes_files === false
      },
      observed_runtime: result.observed_runtime,
      selected_package_strategy: result.selected_package_strategy,
      cli_line_budget: result.cli_line_budget,
      target_runtime_shape: result.target_runtime_shape,
      milestone_state: result.milestone_state,
      source_cli_runtime_plan_file: {
        path: gate.planning_file,
        present: fs.existsSync(artifactPath),
        status: fileStatus,
        schema: fileSchema,
        source_context_required: sourceLedgerRequired
      },
      expected_pack_files: expectedPackFiles,
      projected_pack_files: result.projected_pack_files,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({ plan, check });
}

module.exports = Object.freeze({
  createPublicCliRuntimePlanningService,
  countFileLines
});
