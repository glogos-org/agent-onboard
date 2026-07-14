'use strict';

const fs = require('fs');
const path = require('path');
const publicContracts = require('../../../contracts/public-contracts');

function createPublicContractsCommandService(dependencies = {}) {
  const {
    VERSION,
    RELEASE_LINE,
    readJson,
    json,
    targetRuntimeService,
    cwd = () => process.cwd()
  } = dependencies;

  function publicContractsCatalog() {
    return publicContracts.publicContractCatalog({
      version: VERSION,
      releaseLine: RELEASE_LINE
    });
  }

  function publicContractsCheck() {
    const catalog = publicContractsCatalog();
    const catalogCheck = publicContracts.validatePublicContractCatalog(catalog);
    const outputs = {
      [publicContracts.PUBLIC_CONTRACT_IDS.targetHandoffPreview]: targetRuntimeService.targetHandoffPreview(cwd()),
      [publicContracts.PUBLIC_CONTRACT_IDS.targetHandoffReadinessCheck]: targetRuntimeService.targetHandoffReadinessCheck(cwd()),
      [publicContracts.PUBLIC_CONTRACT_IDS.governanceBudgetContract]: targetRuntimeService.targetGovernanceBudgetContract(),
      [publicContracts.PUBLIC_CONTRACT_IDS.governanceBudgetCheck]: targetRuntimeService.targetGovernanceBudgetCheck(cwd())
    };
    const outputValidation = publicContracts.validatePublicContractOutputs(catalog, outputs);
    const errors = [];
    if (Array.isArray(catalogCheck.errors)) errors.push(...catalogCheck.errors);
    if (Array.isArray(outputValidation.errors)) errors.push(...outputValidation.errors);
    return Object.freeze(Object.assign({}, catalogCheck, {
      status: errors.length === 0 ? 'ok' : 'error',
      command: 'agent-onboard contracts --check --json',
      checked_runtime_output_count: outputValidation.checked_output_count,
      output_validation: outputValidation,
      errors
    }));
  }

  function readContractOutputFile(filePath) {
    const resolved = path.resolve(cwd(), filePath);
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) throw new Error('contracts --validate-output --file must point to a JSON file');
    const maxBytes = 1024 * 1024;
    if (stat.size > maxBytes) throw new Error(`contracts --validate-output --file exceeds ${maxBytes} bytes`);
    return { resolved, output: readJson(resolved) };
  }

  function publicContractsOutputFileValidation(options = {}) {
    const catalog = publicContractsCatalog();
    const { resolved, output } = readContractOutputFile(options.file);
    return publicContracts.validatePublicContractOutputFile(catalog, {
      contractId: options.contractId,
      sourcePath: resolved,
      output
    });
  }

  function errorResult(reason) {
    return json({
      schema: 'agent-onboard-public-contracts-error-001',
      status: 'error',
      reason,
      writes_files: false
    }, 1);
  }

  function runContracts(args = []) {
    const valueFlags = new Set(['--contract', '--file']);
    const allowed = new Set(['--json', '--text', '--check', '--validate-output', '--contract', '--file']);
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (valueFlags.has(arg)) {
        if (!args[index + 1] || args[index + 1].startsWith('-')) return errorResult(`${arg} requires a value`);
        index += 1;
        continue;
      }
      if (!allowed.has(arg)) return errorResult('contracts supports only --json, --text, --check, or --validate-output --contract <id> --file <path>');
    }
    const checkMode = args.includes('--check');
    const validateOutputMode = args.includes('--validate-output');
    const text = args.includes('--text');
    if (args.includes('--json') && text) return errorResult('contracts accepts only one output mode: --json or --text');
    if (checkMode && validateOutputMode) return errorResult('contracts accepts only one primary mode: --check or --validate-output');
    if (!validateOutputMode && (args.includes('--contract') || args.includes('--file'))) return errorResult('--contract and --file are only valid with --validate-output');
    if (validateOutputMode) {
      const contractIndex = args.indexOf('--contract');
      const fileIndex = args.indexOf('--file');
      if (contractIndex < 0 || fileIndex < 0) return errorResult('contracts --validate-output requires --contract <id> and --file <path>');
      const result = publicContractsOutputFileValidation({
        contractId: args[contractIndex + 1],
        file: args[fileIndex + 1]
      });
      if (text) {
        process.stdout.write(publicContracts.publicContractOutputValidationText(result));
        return result.status === 'ok' ? 0 : 1;
      }
      return json(result, result.status === 'ok' ? 0 : 1);
    }
    if (checkMode) {
      const result = publicContractsCheck();
      if (text) {
        process.stdout.write(publicContracts.publicContractCheckText(result));
        return result.status === 'ok' ? 0 : 1;
      }
      return json(result, result.status === 'ok' ? 0 : 1);
    }
    const catalog = publicContractsCatalog();
    if (text) {
      process.stdout.write(publicContracts.publicContractText(catalog));
      return 0;
    }
    return json(catalog, 0);
  }

  return Object.freeze({
    catalog: publicContractsCatalog,
    check: publicContractsCheck,
    text: publicContracts.publicContractText,
    checkText: publicContracts.publicContractCheckText,
    validateOutputFile: publicContractsOutputFileValidation,
    outputValidationText: publicContracts.publicContractOutputValidationText,
    runContracts
  });
}

module.exports = Object.freeze({
  createPublicContractsCommandService
});
