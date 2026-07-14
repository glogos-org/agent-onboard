'use strict';

const fs = require('fs');
const path = require('path');

function createPublicSourceExtractionGoldenService(deps) {
  const {
    version: VERSION,
    publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    publicSourceExtractionGoldenOutputFreeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    publicVersionReferencePolicy: PUBLIC_VERSION_REFERENCE_POLICY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceDomainExtractionRehearsalCheck
  } = deps;

  for (const [name, value] of Object.entries({
    version: VERSION,
    publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    publicSourceExtractionGoldenOutputFreeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    publicVersionReferencePolicy: PUBLIC_VERSION_REFERENCE_POLICY,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceDomainExtractionRehearsalCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicSourceExtractionGoldenService missing dependency: ${name}`);
  }

function publicSourceExtractionGoldenOutputs(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const freezeFile = PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.freeze_file;
  return {
    schema: 'agent-onboard-public-source-extraction-golden-output-freeze-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.release_line,
    command: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.command,
    check_command: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    freeze_file: freezeFile,
    freeze_file_present: fs.existsSync(path.join(root, freezeFile)),
    golden_output_freeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    version_reference_policy: PUBLIC_VERSION_REFERENCE_POLICY,
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
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
    }
  };
}

function scanCurrentVersionLiterals(root = packageRoot()) {
  const currentVersion = VERSION;
  const currentPinnedPackage = `agent-onboard@${currentVersion}`;
  const findings = [];
  for (const rel of PUBLIC_VERSION_REFERENCE_POLICY.disallowed_current_version_scan_files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const checks = [currentPinnedPackage, currentVersion];
    for (const token of checks) {
      let index = text.indexOf(token);
      while (index !== -1) {
        const before = text.slice(0, index);
        const line = before.split(/\r?\n/).length;
        findings.push({ file: rel, line, token });
        index = text.indexOf(token, index + token.length);
      }
    }
  }
  return findings;
}

function publicVersionReferencePolicyCheck(root = packageRoot()) {
  const findings = scanCurrentVersionLiterals(root);
  const errors = [];
  if (findings.length > 0) {
    errors.push(`current package version literal must not be hard-coded outside package.json or generated handoff output: ${findings.map((item) => `${item.file}:${item.line}:${item.token}`).join(', ')}`);
  }
  return {
    schema: 'agent-onboard-public-version-reference-policy-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_VERSION_REFERENCE_POLICY.package_name,
    version: VERSION,
    release_line: PUBLIC_VERSION_REFERENCE_POLICY.release_line,
    command: PUBLIC_VERSION_REFERENCE_POLICY.command,
    package_root: root,
    validated: {
      package_json_single_source_of_truth: true,
      current_version_not_hardcoded_in_source_docs: findings.length === 0,
      generated_post_publish_handoff_exempt: true,
      tests_should_derive_expected_version_from_package_json: true
    },
    scan_files: PUBLIC_VERSION_REFERENCE_POLICY.disallowed_current_version_scan_files.slice(),
    findings,
    allowed_dynamic_version_surfaces: PUBLIC_VERSION_REFERENCE_POLICY.allowed_dynamic_version_surfaces.slice(),
    boundary: PUBLIC_VERSION_REFERENCE_POLICY.boundary,
    errors
  };
}

function publicSourceExtractionGoldenOutputFreezeCheck(root = packageRoot()) {
  const result = publicSourceExtractionGoldenOutputs(root);
  const extraction = publicSourceDomainExtractionRehearsalCheck(root);
  const versionPolicy = publicVersionReferencePolicyCheck(root);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const goldenBaseCommands = PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL.golden_output_scope.slice();
  const expectedCommands = goldenBaseCommands.slice(0, 6).concat(['architecture --golden-check', 'release --version-sprawl-check'], goldenBaseCommands.slice(6));
  const actualCommands = result.golden_output_freeze.golden_commands.map((entry) => entry.command);
  const errors = [];
  if (extraction.status !== 'ok') errors.push(...extraction.errors.map((error) => `source extraction rehearsal: ${error}`));
  if (versionPolicy.status !== 'ok') errors.push(...versionPolicy.errors.map((error) => `version reference policy: ${error}`));
  if (result.golden_output_freeze.freeze_status !== 'frozen_before_physical_extraction') errors.push('golden output freeze status must be frozen_before_physical_extraction');
  if (!arrayEquals(actualCommands, expectedCommands)) errors.push(`golden output commands must match ${expectedCommands.join(', ')}`);
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (result.golden_output_freeze.boundary.golden_outputs_command_writes_files !== false) errors.push('architecture --golden-outputs must remain no-write');
  if (result.golden_output_freeze.boundary.golden_check_command_writes_files !== false) errors.push('architecture --golden-check must remain no-write');
  if (result.golden_output_freeze.boundary.creates_source_modules !== false) errors.push('golden output freeze must not create source modules');
  if (result.golden_output_freeze.boundary.moves_source_files !== false) errors.push('golden output freeze must not move source files');
  if (result.golden_output_freeze.boundary.changes_runtime_outputs !== false) errors.push('golden output freeze must not change runtime outputs');

  let freezeFileStatus = 'not_present_installed_context_allowed';
  let freezeFileSchema = null;
  if (result.freeze_file_present) {
    try {
      const freezeFile = readJson(path.join(root, result.freeze_file));
      freezeFileSchema = freezeFile.schema || null;
      if (freezeFile.schema !== PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.schema) errors.push(`${result.freeze_file} schema must be ${PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.schema}`);
      const fileCommands = Array.isArray(freezeFile.golden_commands) ? freezeFile.golden_commands.map((entry) => entry.command) : [];
      if (!arrayEquals(fileCommands, expectedCommands)) errors.push(`${result.freeze_file} golden_commands must match ${expectedCommands.join(', ')}`);
      freezeFileStatus = 'present_validated';
    } catch (error) {
      freezeFileStatus = 'present_invalid_json';
      errors.push(`${result.freeze_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    freezeFileStatus = 'missing_source_context';
    errors.push(`${result.freeze_file} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-extraction-golden-output-freeze-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.release_line,
    command: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE.check_command,
    package_root: root,
    validated: {
      source_extraction_rehearsal: extraction.status === 'ok',
      golden_command_order: arrayEquals(actualCommands, expectedCommands),
      freeze_status: result.golden_output_freeze.freeze_status === 'frozen_before_physical_extraction',
      freeze_commands_no_write: result.golden_output_freeze.boundary.golden_outputs_command_writes_files === false && result.golden_output_freeze.boundary.golden_check_command_writes_files === false,
      no_physical_modules_created: result.golden_output_freeze.boundary.creates_source_modules === false,
      runtime_outputs_unchanged_by_gate: result.golden_output_freeze.boundary.changes_runtime_outputs === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      version_reference_policy: versionPolicy.status === 'ok',
      source_freeze_file: freezeFileStatus === 'present_validated' || freezeFileStatus === 'not_present_installed_context_allowed'
    },
    expected_commands: expectedCommands,
    golden_commands: actualCommands,
    source_freeze_file: {
      path: result.freeze_file,
      present: result.freeze_file_present,
      status: freezeFileStatus,
      schema: freezeFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    version_reference_policy: {
      status: versionPolicy.status,
      findings: versionPolicy.findings,
      errors: versionPolicy.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    publicSourceExtractionGoldenOutputs,
    scanCurrentVersionLiterals,
    publicVersionReferencePolicyCheck,
    publicSourceExtractionGoldenOutputFreezeCheck
  });
}

module.exports = Object.freeze({
  createPublicSourceExtractionGoldenService
});
