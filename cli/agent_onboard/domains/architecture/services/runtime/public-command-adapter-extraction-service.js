'use strict';

const fs = require('fs');
const path = require('path');

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicCommandAdapterExtractionService missing dependency: ${name}`);
  return value;
}

function countFileLines(root, rel) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith('\n') ? 1 : 0);
}

function readOptionalLedger(root, readJson) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) return [];
  try {
    const ledger = readJson(ledgerPath);
    return ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  } catch {
    return [];
  }
}

function buildSpecs(gates) {
  return Object.freeze({
    core: Object.freeze({
      noun: 'core',
      gate: gates.PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION,
      describe: 'describeCoreCommandAdapterExtraction',
      resultSchema: 'agent-onboard-public-core-command-adapter-extraction-result-001',
      checkSchema: 'agent-onboard-public-core-command-adapter-extraction-check-result-001',
      moduleSchema: 'agent-onboard-public-core-command-adapter-extraction-module-001',
      expectedStatus: 'core_command_adapter_extraction_admitted',
      sourceOutOfPackKey: 'source_core_adapter_module_remains_out_of_pack',
      commandNoWriteKey: 'core_adapter_command_writes_files',
      checkNoWriteKey: 'core_adapter_check_command_writes_files',
      runtimeUseKey: 'uses_core_adapter_as_runtime_entrypoint',
      runtimeReportKey: 'core_adapter_used_by_entrypoint_in_this_gate',
      sourceFileKey: 'source_core_adapter_extraction_file',
      nextValidatedKey: 'next_package_adapter_gate_open_or_installed_context_allowed'
    }),
    package: Object.freeze({
      noun: 'package',
      gate: gates.PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION,
      describe: 'describePackageCommandAdapterExtraction',
      resultSchema: 'agent-onboard-public-package-command-adapter-extraction-result-001',
      checkSchema: 'agent-onboard-public-package-command-adapter-extraction-check-result-001',
      moduleSchema: 'agent-onboard-public-package-command-adapter-extraction-module-001',
      expectedStatus: 'package_command_adapter_extraction_admitted',
      sourceOutOfPackKey: 'source_package_adapter_module_remains_out_of_pack',
      commandNoWriteKey: 'package_adapter_command_writes_files',
      checkNoWriteKey: 'package_adapter_check_command_writes_files',
      runtimeUseKey: 'uses_package_adapter_as_runtime_entrypoint',
      runtimeReportKey: 'package_adapter_used_by_entrypoint_in_this_gate',
      sourceFileKey: 'source_package_adapter_extraction_file',
      nextValidatedKey: 'next_architecture_adapter_gate_open_or_installed_context_allowed'
    }),
    architecture: Object.freeze({
      noun: 'architecture',
      gate: gates.PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION,
      describe: 'describeArchitectureCommandAdapterExtraction',
      resultSchema: 'agent-onboard-public-architecture-command-adapter-extraction-result-001',
      checkSchema: 'agent-onboard-public-architecture-command-adapter-extraction-check-result-001',
      moduleSchema: 'agent-onboard-public-architecture-command-adapter-extraction-module-001',
      expectedStatus: 'architecture_command_adapter_extraction_admitted',
      sourceOutOfPackKey: 'source_architecture_adapter_module_remains_out_of_pack',
      commandNoWriteKey: 'architecture_adapter_command_writes_files',
      checkNoWriteKey: 'architecture_adapter_check_command_writes_files',
      runtimeUseKey: 'uses_architecture_adapter_as_runtime_entrypoint',
      runtimeReportKey: 'architecture_adapter_used_by_entrypoint_in_this_gate',
      sourceFileKey: 'source_architecture_adapter_extraction_file',
      nextValidatedKey: 'next_authority_adapter_gate_open_or_installed_context_allowed'
    }),
    authority: Object.freeze({
      noun: 'authority',
      gate: gates.PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION,
      describe: 'describeAuthorityCommandAdapterExtraction',
      resultSchema: 'agent-onboard-public-authority-command-adapter-extraction-result-001',
      checkSchema: 'agent-onboard-public-authority-command-adapter-extraction-check-result-001',
      moduleSchema: 'agent-onboard-public-authority-command-adapter-extraction-module-001',
      expectedStatus: 'authority_command_adapter_extraction_admitted',
      sourceOutOfPackKey: 'source_authority_adapter_module_remains_out_of_pack',
      commandNoWriteKey: 'authority_adapter_command_writes_files',
      checkNoWriteKey: 'authority_adapter_check_command_writes_files',
      runtimeUseKey: 'uses_authority_adapter_as_runtime_entrypoint',
      runtimeReportKey: 'authority_adapter_used_by_entrypoint_in_this_gate',
      sourceFileKey: 'source_authority_adapter_extraction_file',
      nextValidatedKey: 'next_work_items_adapter_gate_open_or_installed_context_allowed'
    })
  });
}

function createPublicCommandAdapterExtractionService(options = Object.freeze({})) {
  const VERSION = required('VERSION', options.VERSION);
  const PUBLIC_RELEASE_CONTRACT = required('PUBLIC_RELEASE_CONTRACT', options.PUBLIC_RELEASE_CONTRACT);
  const packageRoot = required('packageRoot', options.packageRoot);
  const sourceContext = required('sourceContext', options.sourceContext);
  const arrayEquals = required('arrayEquals', options.arrayEquals);
  const readJson = required('readJson', options.readJson);
  const packageJsonProjectedPackFiles = required('packageJsonProjectedPackFiles', options.packageJsonProjectedPackFiles);
  const specs = buildSpecs({
    PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION: required('PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION', options.PUBLIC_CORE_COMMAND_ADAPTER_EXTRACTION),
    PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION: required('PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION', options.PUBLIC_PACKAGE_COMMAND_ADAPTER_EXTRACTION),
    PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION: required('PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION', options.PUBLIC_ARCHITECTURE_COMMAND_ADAPTER_EXTRACTION),
    PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION: required('PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION', options.PUBLIC_AUTHORITY_COMMAND_ADAPTER_EXTRACTION)
  });

  function inspectAdapterModule(root, spec) {
    const gate = spec.gate;
    const adapterModulePath = path.join(root, gate.adapter_module);
    const report = {
      path: gate.adapter_module,
      present: fs.existsSync(adapterModulePath),
      status: 'not_present_installed_context_allowed',
      schema: null,
      exports: [],
      owned_top_level_commands: [],
      excluded_top_level_commands: [],
      require_error: null,
      line_count: countFileLines(root, gate.adapter_module),
      max_lines: gate.adapter_seed_max_lines
    };
    if (!report.present) return report;
    try {
      delete require.cache[require.resolve(adapterModulePath)];
      const adapterModule = require(adapterModulePath);
      const described = typeof adapterModule[spec.describe] === 'function' ? adapterModule[spec.describe]() : null;
      report.status = 'present_validated';
      report.exports = Object.keys(adapterModule).sort();
      report.schema = described && described.schema ? described.schema : null;
      report.owned_top_level_commands = described && Array.isArray(described.owned_top_level_commands) ? described.owned_top_level_commands.slice().sort() : [];
      report.excluded_top_level_commands = described && Array.isArray(described.excluded_top_level_commands) ? described.excluded_top_level_commands.slice().sort() : [];
    } catch (error) {
      report.status = 'present_require_failed';
      report.require_error = error && error.message ? error.message : String(error);
    }
    return report;
  }

  function plan(spec, root = packageRoot()) {
    const gate = spec.gate;
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const workItems = readOptionalLedger(root, readJson);
    return {
      schema: spec.resultSchema,
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      extraction_file: gate.extraction_file,
      extraction_file_present: fs.existsSync(path.join(root, gate.extraction_file)),
      adapter_module: inspectAdapterModule(root, spec),
      compatibility_port_module: gate.compatibility_port_module,
      router_module: gate.router_module,
      runtime_cutover: Object.assign({
        applied: gate.runtime_cutover_applied,
        entrypoint: 'cli/agent-onboard.js',
        entrypoint_line_count: countFileLines(root, 'cli/agent-onboard.js')
      }, { [spec.runtimeReportKey]: gate.boundary[spec.runtimeUseKey] }),
      package_strategy: gate.package_strategy,
      expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
      milestone_state: {
        work_item: workItems.find((item) => item.id === gate.work_item_id) || null,
        next_work_item: workItems.find((item) => item.id === gate.next_work_item_id) || null
      },
      adapter_contract: gate,
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

  function inspectArtifact(root, spec, errors, sourceLedgerRequired) {
    const gate = spec.gate;
    const artifactPath = path.join(root, gate.extraction_file);
    const artifact = { status: 'not_present_installed_context_allowed', schema: null };
    if (!fs.existsSync(artifactPath)) {
      if (sourceLedgerRequired) {
        artifact.status = 'missing_source_context';
        errors.push(`${gate.extraction_file} must exist in source repository context`);
      }
      return artifact;
    }
    try {
      const body = readJson(artifactPath);
      artifact.schema = body.schema || null;
      if (body.schema !== gate.schema) errors.push(`${gate.extraction_file} schema must be ${gate.schema}`);
      if (body.work_item_id !== gate.work_item_id) errors.push(`${gate.extraction_file} must identify ${gate.work_item_id}`);
      if (body.next_work_item_id !== gate.next_work_item_id) errors.push(`${gate.extraction_file} must seed ${gate.next_work_item_id}`);
      if (body.adapter_module !== gate.adapter_module) errors.push(`${gate.extraction_file} must declare ${gate.adapter_module}`);
      if (body.runtime_cutover_applied !== false) errors.push(`${gate.extraction_file} must not apply runtime cutover`);
      if (!body.boundary || body.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.extraction_file} must preserve package_allowlist_unchanged`);
      artifact.status = 'present_validated';
    } catch (error) {
      artifact.status = 'present_invalid_json';
      errors.push(`${gate.extraction_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
    return artifact;
  }

  function check(spec, root = packageRoot()) {
    const result = plan(spec, root);
    const gate = spec.gate;
    const sourceLedgerRequired = result.package_context === 'source_repository';
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];
    if (gate.extraction_status !== spec.expectedStatus) errors.push(`${spec.noun} command adapter extraction status must be admitted`);
    if (gate.runtime_cutover_applied !== false) errors.push(`${spec.noun} command adapter extraction must not apply runtime cutover`);
    if (gate.package_strategy !== 'controlled_source_module_inclusion') errors.push(`${spec.noun} command adapter extraction must preserve controlled_source_module_inclusion package strategy`);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary[spec.commandNoWriteKey] !== false) errors.push(`architecture --${spec.noun}-adapter must remain no-write`);
    if (gate.boundary[spec.checkNoWriteKey] !== false) errors.push(`architecture --${spec.noun}-adapter-check must remain no-write`);
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push(`${spec.noun} command adapter extraction must not change public CLI outputs`);
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push(`${spec.noun} command adapter extraction must not change packaged CLI runtime dependency graph`);
    if (gate.boundary[spec.runtimeUseKey] !== false) errors.push(`${spec.noun} command adapter extraction must not use source modules as the packaged runtime entrypoint yet`);
    if (gate.boundary[spec.sourceOutOfPackKey] !== true) errors.push(`source ${spec.noun} adapter module must remain out of npm pack for this gate`);
    if (result.adapter_module.line_count > gate.adapter_seed_max_lines) errors.push(`${gate.adapter_module} must stay within ${gate.adapter_seed_max_lines} lines`);
    const artifact = inspectArtifact(root, spec, errors, sourceLedgerRequired);
    const adapterModulePresentOrAllowed = result.adapter_module.present || result.package_context === 'installed_package';
    if (!adapterModulePresentOrAllowed) errors.push(`${gate.adapter_module} must exist in source repository context`);
    if (result.adapter_module.present) {
      if (result.adapter_module.status !== 'present_validated') errors.push(`${gate.adapter_module} must be require-able without side effects${result.adapter_module.require_error ? `: ${result.adapter_module.require_error}` : ''}`);
      if (result.adapter_module.schema !== spec.moduleSchema) errors.push(`${gate.adapter_module} must expose ${spec.noun} command adapter extraction module schema`);
      for (const name of gate.expected_adapter_export_names) if (!result.adapter_module.exports.includes(name)) errors.push(`${gate.adapter_module} must export ${name}`);
      for (const name of gate.owned_top_level_commands) if (!result.adapter_module.owned_top_level_commands.includes(name)) errors.push(`${gate.adapter_module} must own ${spec.noun} command ${name}`);
      for (const name of gate.excluded_top_level_commands) if (!result.adapter_module.excluded_top_level_commands.includes(name)) errors.push(`${gate.adapter_module} must exclude non-${spec.noun} command ${name}`);
    }
    const workItem = result.milestone_state.work_item;
    const nextWorkItem = result.milestone_state.next_work_item;
    if (sourceLedgerRequired) {
      if (!workItem) errors.push(`${gate.work_item_id} work item must exist`);
      else if (workItem.status !== 'closed') errors.push(`${gate.work_item_id} work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} work item must be open or closed after ${spec.noun} adapter extraction admission`);
    }
    const validated = Object.assign({
      [`${spec.noun}_adapter_extraction_status_admitted`]: gate.extraction_status === spec.expectedStatus,
      adapter_module_present_or_installed_context_allowed: adapterModulePresentOrAllowed,
      adapter_module_requireable_when_present: !result.adapter_module.present || result.adapter_module.status === 'present_validated',
      adapter_module_under_line_budget: result.adapter_module.line_count <= gate.adapter_seed_max_lines,
      adapter_exports_contract: gate.expected_adapter_export_names.every((name) => !result.adapter_module.present || result.adapter_module.exports.includes(name)),
      [`owned_${spec.noun}_commands_contract`]: gate.owned_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.owned_top_level_commands.includes(name)),
      [`non_${spec.noun}_commands_excluded`]: gate.excluded_top_level_commands.every((name) => !result.adapter_module.present || result.adapter_module.excluded_top_level_commands.includes(name)),
      runtime_cutover_not_applied: gate.runtime_cutover_applied === false,
      packaged_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      [`${spec.noun}_adapter_module_out_of_pack_for_this_gate`]: gate.boundary[spec.sourceOutOfPackKey] === true,
      extraction_file_present_or_installed_context_allowed: artifact.status === 'present_validated' || artifact.status === 'not_present_installed_context_allowed',
      work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (workItem && workItem.status === 'closed')
    }, {
      [spec.nextValidatedKey]: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      [`${spec.noun}_adapter_commands_no_write`]: gate.boundary[spec.commandNoWriteKey] === false && gate.boundary[spec.checkNoWriteKey] === false
    });
    return Object.assign({
      schema: spec.checkSchema,
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      package_context: result.package_context,
      validated,
      adapter_module: result.adapter_module,
      runtime_cutover: result.runtime_cutover
    }, {
      [spec.sourceFileKey]: {
        path: gate.extraction_file,
        present: fs.existsSync(path.join(root, gate.extraction_file)),
        status: artifact.status,
        schema: artifact.schema,
        source_context_required: sourceLedgerRequired
      }
    }, {
      milestone_state: result.milestone_state,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: result.projected_pack_files,
      boundary: result.boundary,
      errors
    });
  }

  return Object.freeze({
    publicCoreCommandAdapterExtraction: (root = packageRoot()) => plan(specs.core, root),
    publicCoreCommandAdapterExtractionCheck: (root = packageRoot()) => check(specs.core, root),
    publicPackageCommandAdapterExtraction: (root = packageRoot()) => plan(specs.package, root),
    publicPackageCommandAdapterExtractionCheck: (root = packageRoot()) => check(specs.package, root),
    publicArchitectureCommandAdapterExtraction: (root = packageRoot()) => plan(specs.architecture, root),
    publicArchitectureCommandAdapterExtractionCheck: (root = packageRoot()) => check(specs.architecture, root),
    publicAuthorityCommandAdapterExtraction: (root = packageRoot()) => plan(specs.authority, root),
    publicAuthorityCommandAdapterExtractionCheck: (root = packageRoot()) => check(specs.authority, root)
  });
}

module.exports = {
  createPublicCommandAdapterExtractionService,
  countFileLines
};
