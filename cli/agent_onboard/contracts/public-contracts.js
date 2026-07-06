'use strict';

const PACKAGE_NAME = 'agent-onboard';
const PUBLIC_CONTRACT_SPINE_SCHEMA = 'agent-onboard-public-contract-spine-001';
const PUBLIC_CONTRACT_CHECK_SCHEMA = 'agent-onboard-public-contract-check-001';
const PUBLIC_CONTRACT_OUTPUT_FILE_VALIDATION_SCHEMA = 'agent-onboard-public-contract-output-file-validation-001';

const PUBLIC_CONTRACT_IDS = Object.freeze({
  targetHandoffPreview: 'target_handoff_preview_output',
  targetHandoffReadinessCheck: 'target_handoff_readiness_check_output',
  targetHandoffReadinessReason: 'target_handoff_readiness_reason',
  governanceBudgetContract: 'target_governance_budget_contract_output',
  governanceBudgetCheck: 'target_governance_budget_check_output',
  runtimeBoundary: 'public_no_mutation_runtime_boundary'
});

const PUBLIC_READINESS_SEVERITIES = Object.freeze(['blocker', 'warning']);
const PUBLIC_READINESS_REASON_CODES = Object.freeze([
  'agent_entrypoint_missing',
  'target_inventory_unavailable',
  'target_work_items_preview_unavailable',
  'open_target_work_item_should_be_continued_before_new_admission',
  'governance_index_missing_stale_read_risk',
  'governance_index_stale_read_risk',
  'governance_index_drift_check_blocked',
  'governance_budget_over_contract',
  'governance_budget_check_blocked',
  'governance_budget_check_unavailable'
]);

const PUBLIC_NO_MUTATION_BOUNDARY_FIELDS = Object.freeze([
  'writes_files',
  'writes_target_repository_state',
  'installs_dependencies',
  'runs_managed_project_commands',
  'git_mutation',
  'network'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function freezeDeep(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((entry) => freezeDeep(entry)));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = freezeDeep(value[key]);
    return Object.freeze(value);
  }
  return value;
}

function publicOutputContracts() {
  return freezeDeep([
    {
      id: PUBLIC_CONTRACT_IDS.targetHandoffPreview,
      schema: 'agent-onboard-public-target-handoff-preview-001',
      command: 'agent-onboard target handoff --json',
      role: 'compact next-agent handoff preview output contract',
      required_paths: [
        'schema',
        'status',
        'package_name',
        'version',
        'release_line',
        'target',
        'handoff.readiness.status',
        'handoff.readiness.reason_codes',
        'handoff.readiness.reasons',
        'handoff.governance_budget_summary',
        'output_policy.file_contents_inlined',
        'writes_performed',
        'boundary.writes_files'
      ],
      allowed_status: ['ok', 'error'],
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        installs_dependencies: false,
        runs_managed_project_commands: false,
        git_mutation: false,
        network: false
      }
    },
    {
      id: PUBLIC_CONTRACT_IDS.targetHandoffReadinessCheck,
      schema: 'agent-onboard-public-target-handoff-readiness-check-001',
      command: 'agent-onboard target handoff --readiness-check --json',
      role: 'compact pass/fail readiness gate over stable reason codes',
      required_paths: [
        'schema',
        'status',
        'readiness_check.status',
        'readiness_check.next_agent_ready',
        'readiness_check.reason_codes',
        'readiness_check.blocker_reason_codes',
        'readiness_check.warning_reason_codes',
        'readiness_check.reasons',
        'readiness_check.stable_reason_code_surface',
        'readiness_check.fail_closed_on_blocker',
        'readiness_check.warnings_do_not_fail_check',
        'output_policy.raw_work_items_file_inlined',
        'output_policy.raw_claims_ledger_inlined',
        'output_policy.planned_index_payloads_inlined',
        'writes_performed',
        'boundary.writes_files'
      ],
      allowed_status: ['ok', 'blocked', 'error'],
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        installs_dependencies: false,
        runs_managed_project_commands: false,
        git_mutation: false,
        network: false
      }
    },
    {
      id: PUBLIC_CONTRACT_IDS.targetHandoffReadinessReason,
      schema: 'agent-onboard-public-target-handoff-readiness-reason-001',
      command: 'embedded in agent-onboard target handoff --json and --readiness-check --json',
      role: 'machine-stable readiness reason interface',
      required_paths: ['code', 'severity', 'summary', 'next_command'],
      allowed_reason_codes: PUBLIC_READINESS_REASON_CODES,
      allowed_severities: PUBLIC_READINESS_SEVERITIES,
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        git_mutation: false,
        network: false
      }
    },
    {
      id: PUBLIC_CONTRACT_IDS.governanceBudgetContract,
      schema: 'agent-onboard-public-target-governance-budget-contract-001',
      command: 'agent-onboard target governance --budget-contract --json',
      role: 'stable no-scan first-read governance budget policy',
      required_paths: [
        'schema',
        'status',
        'max_index_bytes_each',
        'max_combined_index_bytes',
        'target_first_read_indexes',
        'raw_growth_files_on_demand_only',
        'boundary.writes_files'
      ],
      allowed_status: ['ok'],
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        git_mutation: false,
        network: false
      }
    },
    {
      id: PUBLIC_CONTRACT_IDS.governanceBudgetCheck,
      schema: 'agent-onboard-public-target-governance-budget-check-001',
      command: 'agent-onboard target governance --budget-check --json',
      role: 'bounded target governance index budget validation without planned payload inline',
      required_paths: [
        'schema',
        'status',
        'budget_check.overall_state',
        'budget_check.max_combined_index_bytes',
        'budget_check.authority_policy.planned_index_payloads_are_not_inlined',
        'output_policy.planned_index_payloads_inlined',
        'boundary.writes_files'
      ],
      allowed_status: ['ok', 'blocked', 'error'],
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        git_mutation: false,
        network: false
      }
    },
    {
      id: PUBLIC_CONTRACT_IDS.runtimeBoundary,
      schema: 'agent-onboard-public-no-mutation-runtime-boundary-001',
      command: 'shared by read-only public product surfaces',
      role: 'minimum public no-mutation boundary interface',
      required_paths: PUBLIC_NO_MUTATION_BOUNDARY_FIELDS.map((field) => `boundary.${field}`),
      boundary: Object.fromEntries(PUBLIC_NO_MUTATION_BOUNDARY_FIELDS.map((field) => [field, false]))
    }
  ]);
}

function publicContractCatalog(options = {}) {
  const version = options.version || '0.0.0';
  const releaseLine = options.releaseLine || 'public_contract_spine';
  const contracts = clone(publicOutputContracts());
  return freezeDeep({
    schema: PUBLIC_CONTRACT_SPINE_SCHEMA,
    status: 'ok',
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: 'agent-onboard contracts --json',
    check_command: 'agent-onboard contracts --check --json',
    output_validation_command: 'agent-onboard contracts --validate-output --contract <id> --file <path> --json',
    purpose: 'compact public contract/interface spine for stable CLI JSON outputs without exposing source-only implementation archives',
    contract_model: {
      style: 'javascript_contract_descriptors_and_validators',
      typescript_required: false,
      abstract_classes_required: false,
      source_contract_archive_exported: false,
      public_descriptor_layer_exported: true,
      runtime_validation_supported: true,
      output_file_validation_supported: true
    },
    contract_count: contracts.length,
    contracts,
    stable_reason_codes: PUBLIC_READINESS_REASON_CODES,
    stable_severities: PUBLIC_READINESS_SEVERITIES,
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false,
      publishes_package: false
    }
  });
}

function pathValue(value, dottedPath) {
  return String(dottedPath).split('.').reduce((cursor, key) => {
    if (cursor === null || cursor === undefined) return undefined;
    return cursor[key];
  }, value);
}

function validatePublicContractCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object') errors.push('contract catalog must be an object');
  if (catalog && catalog.schema !== PUBLIC_CONTRACT_SPINE_SCHEMA) errors.push(`contract catalog schema must be ${PUBLIC_CONTRACT_SPINE_SCHEMA}`);
  const contracts = catalog && Array.isArray(catalog.contracts) ? catalog.contracts : [];
  if (contracts.length === 0) errors.push('contract catalog must define at least one public contract');
  const ids = new Set();
  const schemas = new Set();
  for (const contract of contracts) {
    if (!contract || typeof contract !== 'object') {
      errors.push('contract entries must be objects');
      continue;
    }
    if (!contract.id) errors.push('contract id is required');
    if (ids.has(contract.id)) errors.push(`duplicate contract id: ${contract.id}`);
    ids.add(contract.id);
    if (!contract.schema) errors.push(`${contract.id || 'unknown contract'} schema is required`);
    if (contract.schema && schemas.has(contract.schema)) errors.push(`duplicate contract schema: ${contract.schema}`);
    if (contract.schema) schemas.add(contract.schema);
    if (!contract.command) errors.push(`${contract.id || 'unknown contract'} command is required`);
    if (!Array.isArray(contract.required_paths)) errors.push(`${contract.id || 'unknown contract'} required_paths must be an array`);
    for (const [field, value] of Object.entries(contract.boundary || {})) {
      if (field.includes('writes') || field.includes('mutation') || field === 'network' || field.includes('install') || field.includes('publish')) {
        if (value !== false) errors.push(`${contract.id} boundary.${field} must be false`);
      }
    }
  }
  for (const id of Object.values(PUBLIC_CONTRACT_IDS)) {
    if (!ids.has(id)) errors.push(`missing required public contract id: ${id}`);
  }
  const reasonContract = contracts.find((entry) => entry.id === PUBLIC_CONTRACT_IDS.targetHandoffReadinessReason);
  if (!reasonContract) {
    errors.push('readiness reason contract is required');
  } else {
    for (const code of PUBLIC_READINESS_REASON_CODES) {
      if (!Array.isArray(reasonContract.allowed_reason_codes) || !reasonContract.allowed_reason_codes.includes(code)) errors.push(`readiness reason code missing from contract: ${code}`);
    }
    for (const severity of PUBLIC_READINESS_SEVERITIES) {
      if (!Array.isArray(reasonContract.allowed_severities) || !reasonContract.allowed_severities.includes(severity)) errors.push(`readiness severity missing from contract: ${severity}`);
    }
  }
  return freezeDeep({
    schema: PUBLIC_CONTRACT_CHECK_SCHEMA,
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: catalog && catalog.version ? catalog.version : '0.0.0',
    release_line: catalog && catalog.release_line ? catalog.release_line : 'unknown',
    command: 'agent-onboard contracts --check --json',
    checked_contract_count: contracts.length,
    validated: {
      catalog_schema: catalog && catalog.schema === PUBLIC_CONTRACT_SPINE_SCHEMA,
      unique_contract_ids: ids.size === contracts.length,
      required_contracts_present: Object.values(PUBLIC_CONTRACT_IDS).every((id) => ids.has(id)),
      readiness_reason_codes_stable: Boolean(reasonContract) && PUBLIC_READINESS_REASON_CODES.every((code) => reasonContract.allowed_reason_codes.includes(code)),
      no_mutation_boundaries_declared: errors.filter((error) => error.includes('boundary.')).length === 0
    },
    errors,
    boundary: catalog && catalog.boundary ? clone(catalog.boundary) : {
      writes_files: false,
      writes_target_repository_state: false,
      git_mutation: false,
      network: false
    }
  });
}

function readinessReasonErrors(reason, pointer = 'readiness reason') {
  const errors = [];
  if (!reason || typeof reason !== 'object' || Array.isArray(reason)) {
    return [`${pointer} must be an object`];
  }
  for (const requiredPath of ['code', 'severity', 'summary', 'next_command']) {
    if (pathValue(reason, requiredPath) === undefined) errors.push(`${pointer} missing ${requiredPath}`);
  }
  if (!PUBLIC_READINESS_REASON_CODES.includes(reason.code)) errors.push(`${pointer} code not in public contract: ${reason.code}`);
  if (!PUBLIC_READINESS_SEVERITIES.includes(reason.severity)) errors.push(`${pointer} severity not in public contract: ${reason.severity}`);
  if (typeof reason.summary !== 'string' || reason.summary.trim() === '') errors.push(`${pointer} summary must be a non-empty string`);
  if (typeof reason.next_command !== 'string' || reason.next_command.trim() === '') errors.push(`${pointer} next_command must be a non-empty string`);
  return errors;
}

function validateNoMutationBoundary(contract, output) {
  const errors = [];
  const boundary = contract && contract.boundary && typeof contract.boundary === 'object' ? contract.boundary : {};
  for (const [field, expected] of Object.entries(boundary)) {
    if (expected !== false) continue;
    const actual = pathValue(output, `boundary.${field}`);
    if (actual !== false) errors.push(`${contract.id} output boundary.${field} must be false`);
  }
  return errors;
}

function validateContractOutput(contract, output) {
  const errors = [];
  if (!contract || typeof contract !== 'object') return ['contract must be an object'];
  if (!output || typeof output !== 'object' || Array.isArray(output)) return [`${contract.id || 'unknown contract'} output must be an object`];
  if (contract.schema && output.schema !== contract.schema) errors.push(`${contract.id} output schema must be ${contract.schema}`);
  if (Array.isArray(contract.allowed_status) && !contract.allowed_status.includes(output.status)) errors.push(`${contract.id} output status ${output.status || 'missing'} is not allowed`);
  for (const requiredPath of contract.required_paths || []) {
    if (pathValue(output, requiredPath) === undefined) errors.push(`${contract.id} output missing ${requiredPath}`);
  }
  errors.push(...validateNoMutationBoundary(contract, output));
  if (contract.id === PUBLIC_CONTRACT_IDS.targetHandoffReadinessReason) {
    errors.push(...readinessReasonErrors(output));
  }
  const handoffReasons = pathValue(output, 'handoff.readiness.reasons');
  if (contract.id === PUBLIC_CONTRACT_IDS.targetHandoffPreview && Array.isArray(handoffReasons)) {
    handoffReasons.forEach((reason, index) => errors.push(...readinessReasonErrors(reason, `handoff.readiness.reasons[${index}]`)));
  }
  if (contract.id === PUBLIC_CONTRACT_IDS.targetHandoffReadinessCheck && output.readiness_check) {
    if (output.readiness_check.stable_reason_code_surface !== true) errors.push('readiness check must declare stable_reason_code_surface true');
    if (output.readiness_check.fail_closed_on_blocker !== true) errors.push('readiness check must fail closed on blockers');
    const reasons = Array.isArray(output.readiness_check.reasons) ? output.readiness_check.reasons : [];
    reasons.forEach((reason, index) => errors.push(...readinessReasonErrors(reason, `readiness_check.reasons[${index}]`)));
    const reasonCodes = Array.isArray(output.readiness_check.reason_codes) ? output.readiness_check.reason_codes : [];
    for (const code of reasonCodes) {
      if (!PUBLIC_READINESS_REASON_CODES.includes(code)) errors.push(`readiness_check.reason_codes entry not in public contract: ${code}`);
    }
  }
  if (contract.id === PUBLIC_CONTRACT_IDS.governanceBudgetCheck) {
    if (pathValue(output, 'budget_check.authority_policy.planned_index_payloads_are_not_inlined') !== true) errors.push('budget check must declare planned payloads are not inlined');
    if (pathValue(output, 'output_policy.planned_index_payloads_inlined') !== false) errors.push('budget check output policy must not inline planned payloads');
  }
  return errors;
}

function validatePublicContractOutputs(catalog, outputsByContractId = {}) {
  const contracts = catalog && Array.isArray(catalog.contracts) ? catalog.contracts : [];
  const results = [];
  const errors = [];
  for (const contract of contracts) {
    if (!Object.prototype.hasOwnProperty.call(outputsByContractId, contract.id)) continue;
    const contractErrors = validateContractOutput(contract, outputsByContractId[contract.id]);
    if (contractErrors.length > 0) errors.push(...contractErrors);
    results.push({
      id: contract.id,
      schema: contract.schema,
      command: contract.command,
      status: contractErrors.length === 0 ? 'ok' : 'error',
      errors: contractErrors
    });
  }
  return freezeDeep({
    schema: 'agent-onboard-public-contract-output-validation-001',
    status: errors.length === 0 ? 'ok' : 'error',
    checked_output_count: results.length,
    outputs: results,
    errors
  });
}

function publicContractById(catalog, contractId) {
  const contracts = catalog && Array.isArray(catalog.contracts) ? catalog.contracts : [];
  return contracts.find((contract) => contract.id === contractId) || null;
}

function validatePublicContractOutputFile(catalog, options = {}) {
  const contractId = options.contractId;
  const output = options.output;
  const sourcePath = options.sourcePath || null;
  const errors = [];
  const contract = publicContractById(catalog, contractId);
  if (!contractId) errors.push('contract id is required');
  if (!contract) errors.push(`unknown public contract id: ${contractId}`);
  let validationErrors = [];
  if (contract) validationErrors = validateContractOutput(contract, output);
  errors.push(...validationErrors);
  return freezeDeep({
    schema: PUBLIC_CONTRACT_OUTPUT_FILE_VALIDATION_SCHEMA,
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: catalog && catalog.version ? catalog.version : '0.0.0',
    release_line: catalog && catalog.release_line ? catalog.release_line : 'unknown',
    command: 'agent-onboard contracts --validate-output --contract <id> --file <path> --json',
    contract_id: contractId || null,
    contract_schema: contract ? contract.schema : null,
    contract_command: contract ? contract.command : null,
    source: {
      kind: 'json_file',
      path: sourcePath,
      file_contents_reemitted: false
    },
    validated: {
      contract_id_known: Boolean(contract),
      schema_matches: Boolean(contract) && output && output.schema === contract.schema,
      required_paths_present: validationErrors.filter((error) => error.includes(' missing ')).length === 0,
      allowed_status: validationErrors.filter((error) => error.includes('status') && error.includes('not allowed')).length === 0,
      no_mutation_boundary: validationErrors.filter((error) => error.includes('boundary.')).length === 0,
      readiness_reason_surface: validationErrors.filter((error) => error.includes('readiness')).length === 0
    },
    errors,
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      installs_dependencies: false,
      runs_managed_project_commands: false,
      git_mutation: false,
      network: false,
      publishes_package: false
    }
  });
}

function publicContractText(catalog) {
  const lines = [
    `agent-onboard public contracts ${catalog.version}`,
    `Release line: ${catalog.release_line}`,
    '',
    'Contract model:',
    `- descriptors and validators: ${catalog.contract_model.public_descriptor_layer_exported}`,
    `- TypeScript required: ${catalog.contract_model.typescript_required}`,
    `- abstract classes required: ${catalog.contract_model.abstract_classes_required}`,
    `- source-only implementation archive exported: ${catalog.contract_model.source_contract_archive_exported}`,
    '',
    'Public contracts:'
  ];
  for (const contract of catalog.contracts) lines.push(`- ${contract.id}: ${contract.schema} (${contract.command})`);
  lines.push('', 'Stable readiness reason codes:');
  for (const code of catalog.stable_reason_codes) lines.push(`- ${code}`);
  lines.push('', 'Boundary: no files, no target mutation, no dependency install, no managed-project commands, no Git, no network, no publish.');
  lines.push('Use `agent-onboard contracts --check --json` to validate the compact public contract spine. Use `agent-onboard contracts --validate-output --contract <id> --file <path> --json` to validate a captured JSON output against one public contract.');
  return `${lines.join('\n')}\n`;
}

function publicContractCheckText(result) {
  const lines = [
    `agent-onboard public contract check ${result.version}`,
    `Status: ${result.status}`,
    `Checked contracts: ${result.checked_contract_count}`,
    '',
    'Validated:'
  ];
  for (const [key, value] of Object.entries(result.validated || {})) lines.push(`- ${key}: ${value}`);
  if (Array.isArray(result.output_validation && result.output_validation.outputs)) {
    lines.push('', 'Output contracts:');
    for (const item of result.output_validation.outputs) lines.push(`- ${item.status}: ${item.id}`);
  }
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  lines.push('', 'Boundary: no files, no target mutation, no dependency install, no managed-project commands, no Git, no network, no publish.');
  return `${lines.join('\n')}\n`;
}

function publicContractOutputValidationText(result) {
  const lines = [
    `agent-onboard public contract output validation ${result.version}`,
    `Status: ${result.status}`,
    `Contract: ${result.contract_id || 'unknown'}`,
    `Source: ${result.source && result.source.path ? result.source.path : 'unknown'}`,
    '',
    'Validated:'
  ];
  for (const [key, value] of Object.entries(result.validated || {})) lines.push(`- ${key}: ${value}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  lines.push('', 'Boundary: no files, no target mutation, no dependency install, no managed-project commands, no Git, no network, no publish.');
  return `${lines.join('\n')}\n`;
}

module.exports = Object.freeze({
  PACKAGE_NAME,
  PUBLIC_CONTRACT_CHECK_SCHEMA,
  PUBLIC_CONTRACT_OUTPUT_FILE_VALIDATION_SCHEMA,
  PUBLIC_CONTRACT_IDS,
  PUBLIC_CONTRACT_SPINE_SCHEMA,
  PUBLIC_NO_MUTATION_BOUNDARY_FIELDS,
  PUBLIC_READINESS_REASON_CODES,
  PUBLIC_READINESS_SEVERITIES,
  publicContractCatalog,
  publicContractById,
  publicContractCheckText,
  publicContractText,
  publicContractOutputValidationText,
  publicOutputContracts,
  validateContractOutput,
  validatePublicContractCatalog,
  validatePublicContractOutputFile,
  validatePublicContractOutputs
});
