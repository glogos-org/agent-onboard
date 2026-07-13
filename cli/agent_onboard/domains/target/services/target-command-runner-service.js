'use strict';

const path = require('path');
const { emitText, formatTargetDoctorText, formatTargetProfileText } = require('./target-command-text-service');
const {
  TARGET_COMMAND,
  TARGET_CONFIG_FILE,
  TARGET_DOCTOR_COMMAND,
  TARGET_GOVERNANCE_COMMAND,
  TARGET_HANDOFF_COMMAND,
  TARGET_INVENTORY_COMMAND,
  TARGET_MANIFEST_COMMAND,
  TARGET_MEMORY_COMMAND,
  TARGET_METADATA_COMMAND,
  TARGET_PROFILE_COMMAND,
  TARGET_REPAIR_COMMAND,
  TARGET_WORK_ITEMS_COMMAND
} = require('../../../runtime-contracts');

function requireDependency(name, value) {
  if (value === undefined || value === null) throw new Error(`createTargetCommandRunnerService missing dependency: ${name}`);
  return value;
}

function createTargetCommandRunnerService(deps = {}) {
  const VERSION = requireDependency('version', deps.version);
  const PUBLIC_RELEASE_CONTRACT = requireDependency('publicReleaseContract', deps.publicReleaseContract);
  const TARGET_ONBOARDING_SURFACE_PLAN = requireDependency('targetOnboardingSurfacePlanContract', deps.targetOnboardingSurfacePlanContract);
  const TARGET_CONFIG_SCHEMA = requireDependency('targetConfigSchema', deps.targetConfigSchema);
  const targetRuntimeService = requireDependency('targetRuntimeService', deps.targetRuntimeService);
  const publicTargetRuntimeNamespace = requireDependency('publicTargetRuntimeNamespace', deps.publicTargetRuntimeNamespace);
  const publicTargetRuntimeNamespaceCheck = requireDependency('publicTargetRuntimeNamespaceCheck', deps.publicTargetRuntimeNamespaceCheck);
  const json = requireDependency('json', deps.json);

  const {
    readJson,
    validateTargetConfig,
    targetOnboardingDryRunFixture,
    targetOnboardingRealTargetTrial,
    targetOnboardingSurfacePlan,
    targetDoctor,
    metadataPlan,
    metadataCheck,
    metadataWrite,
    checkTargetManifestDrift,
    initTargetManifest,
    refreshTargetManifest,
    targetRepair,
    targetProfile,
    targetInventory,
    formatTargetInventoryText,
    targetWorkItemsPreview,
    formatTargetWorkItemsPreviewText,
    targetGovernancePreview,
    formatTargetGovernancePreviewText,
    targetGovernanceBudgetContract,
    formatTargetGovernanceBudgetContractText,
    targetGovernanceBudgetCheck,
    formatTargetGovernanceBudgetCheckText,
    targetGovernanceIndexMaterializationDryRun,
    formatTargetGovernanceIndexMaterializationDryRunText,
    targetGovernanceIndexMaterializationWrite,
    formatTargetGovernanceIndexMaterializationWriteText,
    targetGovernanceIndexDriftCheck,
    formatTargetGovernanceIndexDriftCheckText,
    targetHandoffPreview,
    formatTargetHandoffPreviewText,
    targetConfigTemplate,
    targetRuntimeNamespaceTemplate,
    runtimeProjectTemplate,
    workItemsTemplate,
    initWriteSet,
    planTargetOnboardingWrites,
    performTargetOnboardingWrites,
    planWrites,
    performPlannedWrites,
    summarizePlan
  } = targetRuntimeService;

function runTargetConfig(args) {
  if (args.includes('--schema')) {
    json({
      schema: 'agent-onboard-target-config-schema-response-001',
      status: 'ok',
      target_config_schema: TARGET_CONFIG_SCHEMA
    });
    return 0;
  }
  if (args.includes('--template')) {
    json({
      schema: 'agent-onboard-target-config-template-response-001',
      status: 'ok',
      canonical_config_file: TARGET_CONFIG_FILE,
      target_config: targetConfigTemplate()
    });
    return 0;
  }
  if (args.includes('--validate-template')) {
    const errors = validateTargetConfig(targetConfigTemplate());
    const ok = errors.length === 0;
    json({
      schema: 'agent-onboard-target-config-template-validation-001',
      status: ok ? 'ok' : 'error',
      template_source: 'embedded',
      canonical_config_file: TARGET_CONFIG_FILE,
      validated: true,
      errors
    });
    return ok ? 0 : 1;
  }
  if (args.includes('--validate')) {
    const index = args.indexOf('--validate');
    const file = args[index + 1] && !args[index + 1].startsWith('-') ? args[index + 1] : TARGET_CONFIG_FILE;
    const errors = validateTargetConfig(readJson(path.resolve(process.cwd(), file)));
    const ok = errors.length === 0;
    json({
      schema: 'agent-onboard-target-config-file-validation-001',
      status: ok ? 'ok' : 'error',
      file,
      validated: true,
      errors
    });
    return ok ? 0 : 1;
  }
  throw new Error('target-config requires --schema, --template, --validate-template, or --validate [file]');
}

function runInit(args) {
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('init requires --dry-run or --write');
  if (write && dry) throw new Error('init accepts only one of --dry-run or --write');

  const plannedWrites = planWrites(initWriteSet(), { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;

  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-init-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'init',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    boundary: {
      installs_dependencies: false,
      runs_build_test_deploy: false,
      publishes_or_pushes: false,
      modifies_source_files: false
    }
  });
  return ok ? 0 : 1;
}

function runTargetOnboarding(args) {
  const plan = args.includes('--plan');
  const fixture = args.includes('--fixture');
  const write = args.includes('--write');
  const trial = args.includes('--trial');
  const force = args.includes('--force');
  const targetIndex = args.indexOf('--target');
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(['--plan', '--fixture', '--write', '--trial', '--force', '--target']);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error('target onboarding --target requires a path');
  if (unknown.length > 0) throw new Error(`target onboarding does not support: ${unknown.join(', ')}`);
  if ([plan, fixture, write, trial].filter(Boolean).length !== 1) throw new Error('target onboarding requires exactly one of --plan, --fixture, --trial, or --write');
  if (force && !write) throw new Error('target onboarding --force requires --write');
  if (targetIndex >= 0 && !trial) throw new Error('target onboarding --target is only supported with --trial');
  if (plan) {
    json(targetOnboardingSurfacePlan());
    return 0;
  }
  if (fixture) {
    json(targetOnboardingDryRunFixture());
    return 0;
  }
  if (trial) {
    const result = targetOnboardingRealTargetTrial(targetRoot);
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }

  const plannedWrites = planTargetOnboardingWrites({ force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (ok) performTargetOnboardingWrites(plannedWrites);
  const writtenFiles = ok ? plannedWrites.filter((item) => item.action === 'create' || item.action === 'overwrite').map((item) => item.path) : [];

  json({
    schema: 'agent-onboard-public-target-onboarding-explicit-write-result-001',
    status: ok ? 'ok' : 'error',
    package_name: 'agent-onboard',
    version: VERSION,
    release_line: PUBLIC_RELEASE_CONTRACT.release_line,
    command: force ? 'agent-onboard target onboarding --write --force' : 'agent-onboard target onboarding --write',
    command_family: 'target onboarding',
    mode: 'write',
    force,
    writes_performed: writtenFiles.length > 0,
    written_files: writtenFiles,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    boundary: {
      explicit_write_flag_required: true,
      force_overwrite_requires_explicit_force_flag: true,
      writes_only_canonical_target_onboarding_files: true,
      canonical_files: TARGET_ONBOARDING_SURFACE_PLAN.canonical_files.slice(),
      installs_dependencies: false,
      runs_build_test_deploy: false,
      publishes_or_pushes: false,
      git_mutation: false
    },
    next_steps: ok ? [
      'read AGENTS.md before continuing agent-assisted work',
      `run agent-onboard guard --check-boundary after ${TARGET_CONFIG_FILE} exists`,
      'use work-items --append/--claim only after the target owner assigns public work-item scope'
    ] : []
  });
  return ok ? 0 : 1;
}

function runTargetDoctor(args) {
  const jsonFlag = args.includes(TARGET_DOCTOR_COMMAND.flag.json);
  const textFlag = args.includes(TARGET_DOCTOR_COMMAND.flag.text);
  const targetIndex = args.indexOf(TARGET_DOCTOR_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(Object.values(TARGET_DOCTOR_COMMAND.flag));
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target doctor ${TARGET_DOCTOR_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target doctor does not support: ${unknown.join(', ')}`);
  if (jsonFlag && textFlag) throw new Error(`target doctor accepts only one of ${TARGET_DOCTOR_COMMAND.flag.json} or ${TARGET_DOCTOR_COMMAND.flag.text}`);
  if (!jsonFlag && !textFlag && args.length > 0) throw new Error(`target doctor accepts only ${TARGET_DOCTOR_COMMAND.flag.json}, ${TARGET_DOCTOR_COMMAND.flag.text}, and ${TARGET_DOCTOR_COMMAND.flag.target} <path>`);
  const result = targetDoctor(targetRoot);
  if (textFlag) emitText(formatTargetDoctorText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetProfile(args) {
  const jsonFlag = args.includes(TARGET_PROFILE_COMMAND.flag.json);
  const textFlag = args.includes(TARGET_PROFILE_COMMAND.flag.text);
  const targetIndex = args.indexOf(TARGET_PROFILE_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set(Object.values(TARGET_PROFILE_COMMAND.flag));
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target profile ${TARGET_PROFILE_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target profile does not support: ${unknown.join(', ')}`);
  if (jsonFlag && textFlag) throw new Error(`target profile accepts only one of ${TARGET_PROFILE_COMMAND.flag.json} or ${TARGET_PROFILE_COMMAND.flag.text}`);
  if (!jsonFlag && !textFlag && args.length > 0) throw new Error(`target profile accepts only ${TARGET_PROFILE_COMMAND.flag.json}, ${TARGET_PROFILE_COMMAND.flag.text}, and ${TARGET_PROFILE_COMMAND.flag.target} <path>`);
  const result = targetProfile(targetRoot);
  if (textFlag) emitText(formatTargetProfileText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetRepair(args) {
  const plan = args.includes(TARGET_REPAIR_COMMAND.mode.plan);
  const write = args.includes(TARGET_REPAIR_COMMAND.mode.write);
  const force = args.includes(TARGET_REPAIR_COMMAND.flag.force);
  const targetIndex = args.indexOf(TARGET_REPAIR_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_REPAIR_COMMAND.mode),
    ...Object.values(TARGET_REPAIR_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target repair ${TARGET_REPAIR_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target repair does not support: ${unknown.join(', ')}`);
  if ([plan, write].filter(Boolean).length !== 1) throw new Error(`target repair requires exactly one of ${TARGET_REPAIR_COMMAND.mode.plan} or ${TARGET_REPAIR_COMMAND.mode.write}`);
  const result = targetRepair(targetRoot, { write, force });
  json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetMetadata(args) {
  const plan = args.includes(TARGET_METADATA_COMMAND.mode.plan);
  const check = args.includes(TARGET_METADATA_COMMAND.mode.check);
  const write = args.includes(TARGET_METADATA_COMMAND.mode.write);
  const adoptExisting = args.includes(TARGET_METADATA_COMMAND.flag.adoptExisting);
  const force = args.includes(TARGET_METADATA_COMMAND.flag.force);
  const policyIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.policy);
  const policyPath = policyIndex >= 0 ? args[policyIndex + 1] : null;
  const profileIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.profile);
  const profile = profileIndex >= 0 ? args[profileIndex + 1] : null;
  const targetIndex = args.indexOf(TARGET_METADATA_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_METADATA_COMMAND.mode),
    ...Object.values(TARGET_METADATA_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (policyIndex >= 0 && index === policyIndex + 1) return false;
    if (profileIndex >= 0 && index === profileIndex + 1) return false;
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (policyIndex >= 0 && (!policyPath || policyPath.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.policy} requires a path`);
  if (profileIndex >= 0 && (!profile || profile.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.profile} requires a profile`);
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target metadata ${TARGET_METADATA_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target metadata does not support: ${unknown.join(', ')}`);
  if ([plan, check, write].filter(Boolean).length !== 1) throw new Error(`target metadata requires exactly one of ${TARGET_METADATA_COMMAND.mode.plan}, ${TARGET_METADATA_COMMAND.mode.check}, or ${TARGET_METADATA_COMMAND.mode.write}`);
  const options = { adoptExisting, force, policyPath, profile };
  const result = plan ? metadataPlan(targetRoot, options) : (check ? metadataCheck(targetRoot, options) : metadataWrite(targetRoot, options));
  json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetManifest(args) {
  const checkDrift = args.includes(TARGET_MANIFEST_COMMAND.mode.checkDrift);
  const init = args.includes(TARGET_MANIFEST_COMMAND.mode.init);
  const refresh = args.includes(TARGET_MANIFEST_COMMAND.mode.refresh);
  const dryRun = args.includes(TARGET_MANIFEST_COMMAND.mode.dryRun);
  const write = args.includes(TARGET_MANIFEST_COMMAND.mode.write);
  const targetIndex = args.indexOf(TARGET_MANIFEST_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const known = new Set([
    ...Object.values(TARGET_MANIFEST_COMMAND.mode),
    ...Object.values(TARGET_MANIFEST_COMMAND.flag)
  ]);
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !known.has(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target manifest ${TARGET_MANIFEST_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target manifest does not support: ${unknown.join(', ')}`);
  if ([checkDrift, init, refresh].filter(Boolean).length !== 1) throw new Error(`target manifest requires exactly one of ${TARGET_MANIFEST_COMMAND.mode.checkDrift}, ${TARGET_MANIFEST_COMMAND.mode.init}, or ${TARGET_MANIFEST_COMMAND.mode.refresh}`);
  if (checkDrift && (dryRun || write)) throw new Error('target manifest --check-drift does not accept --dry-run or --write');
  if ((init || refresh) && [dryRun, write].filter(Boolean).length !== 1) throw new Error(`target manifest ${init ? '--init' : '--refresh'} requires exactly one of ${TARGET_MANIFEST_COMMAND.mode.dryRun} or ${TARGET_MANIFEST_COMMAND.mode.write}`);
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const result = checkDrift
    ? checkTargetManifestDrift(absoluteTargetRoot)
    : (init ? initTargetManifest(absoluteTargetRoot, { write }) : refreshTargetManifest(absoluteTargetRoot, { write }));
  json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetBootstrap(args) {
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('target bootstrap requires --dry-run or --write');
  if (write && dry) throw new Error('target bootstrap accepts only one of --dry-run or --write');

  const plannedWrites = planWrites([[TARGET_CONFIG_FILE, targetConfigTemplate()]], { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-target-bootstrap-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'target',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path),
    skipped_optional_writes: ['package.json']
  });
  return ok ? 0 : 1;
}

function runTargetInstance(args) {
  if (args[0] !== 'takeover') throw new Error('target-instance supports only: takeover');
  const write = args.includes('--write');
  const dry = args.includes('--dry-run');
  const force = args.includes('--force');
  if (!write && !dry) throw new Error('target-instance takeover requires --dry-run or --write');
  if (write && dry) throw new Error('target-instance takeover accepts only one of --dry-run or --write');

  const plannedWrites = planWrites([
    ['.agent-onboard/runtime-namespace.json', targetRuntimeNamespaceTemplate()],
    ['.agent-onboard/project.json', runtimeProjectTemplate()],
    ['.agent-onboard/work-items.json', workItemsTemplate()]
  ], { force });
  const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
  const ok = conflicts.length === 0;
  if (write && ok) performPlannedWrites(plannedWrites);

  json({
    schema: 'agent-onboard-target-instance-takeover-result-001',
    status: ok ? 'ok' : 'error',
    command_family: 'target-instance',
    mode: write ? 'write' : 'dry-run',
    force,
    writes_performed: write && ok,
    planned_writes: summarizePlan(plannedWrites),
    conflicts: conflicts.map((item) => item.path)
  });
  return ok ? 0 : 1;
}

function runTargetInventory(args) {
  const allowed = [TARGET_INVENTORY_COMMAND.mode.preview, TARGET_INVENTORY_COMMAND.flag.json, TARGET_INVENTORY_COMMAND.flag.text, TARGET_INVENTORY_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_INVENTORY_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target inventory ${TARGET_INVENTORY_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target inventory does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_INVENTORY_COMMAND.mode.preview, TARGET_INVENTORY_COMMAND.flag.json, TARGET_INVENTORY_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target inventory accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_INVENTORY_COMMAND.mode.preview;
  const result = targetInventory(targetRoot);
  if (mode === TARGET_INVENTORY_COMMAND.flag.text) process.stdout.write(formatTargetInventoryText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetWorkItems(args) {
  const allowed = [TARGET_WORK_ITEMS_COMMAND.mode.preview, TARGET_WORK_ITEMS_COMMAND.flag.json, TARGET_WORK_ITEMS_COMMAND.flag.text, TARGET_WORK_ITEMS_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_WORK_ITEMS_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target work-items ${TARGET_WORK_ITEMS_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target work-items does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_WORK_ITEMS_COMMAND.mode.preview, TARGET_WORK_ITEMS_COMMAND.flag.json, TARGET_WORK_ITEMS_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target work-items accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_WORK_ITEMS_COMMAND.mode.preview;
  const result = targetWorkItemsPreview(targetRoot);
  if (mode === TARGET_WORK_ITEMS_COMMAND.flag.text) process.stdout.write(formatTargetWorkItemsPreviewText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetGovernance(args) {
  const allowed = [TARGET_GOVERNANCE_COMMAND.mode.preview, TARGET_GOVERNANCE_COMMAND.mode.driftCheck, TARGET_GOVERNANCE_COMMAND.mode.budgetContract, TARGET_GOVERNANCE_COMMAND.mode.budgetCheck, TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun, TARGET_GOVERNANCE_COMMAND.mode.materialize, TARGET_GOVERNANCE_COMMAND.flag.write, TARGET_GOVERNANCE_COMMAND.flag.force, TARGET_GOVERNANCE_COMMAND.flag.json, TARGET_GOVERNANCE_COMMAND.flag.text, TARGET_GOVERNANCE_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_GOVERNANCE_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target governance ${TARGET_GOVERNANCE_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target governance does not support: ${unknown.join(', ')}`);
  const primaryModes = args.filter((arg) => [TARGET_GOVERNANCE_COMMAND.mode.preview, TARGET_GOVERNANCE_COMMAND.mode.driftCheck, TARGET_GOVERNANCE_COMMAND.mode.budgetContract, TARGET_GOVERNANCE_COMMAND.mode.budgetCheck, TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun, TARGET_GOVERNANCE_COMMAND.mode.materialize].includes(arg));
  const outputModes = args.filter((arg) => [TARGET_GOVERNANCE_COMMAND.flag.json, TARGET_GOVERNANCE_COMMAND.flag.text].includes(arg));
  if (primaryModes.length > 1) throw new Error('target governance accepts only one primary mode: --preview, --check, --budget-contract, --budget-check, --materialize-dry-run, or --materialize');
  if (outputModes.length > 1) throw new Error('target governance accepts only one output mode: --json or --text');
  const primaryMode = primaryModes[0] || TARGET_GOVERNANCE_COMMAND.mode.preview;
  const outputMode = outputModes[0] || (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.preview ? TARGET_GOVERNANCE_COMMAND.mode.preview : TARGET_GOVERNANCE_COMMAND.flag.json);
  const wantsWrite = args.includes(TARGET_GOVERNANCE_COMMAND.flag.write);
  const force = args.includes(TARGET_GOVERNANCE_COMMAND.flag.force);
  if (primaryMode !== TARGET_GOVERNANCE_COMMAND.mode.materialize && wantsWrite) throw new Error('target governance --write is only valid with --materialize');
  if (!wantsWrite && force) throw new Error('target governance --force is only valid with --write');
  if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize && !wantsWrite) throw new Error('target governance --materialize requires --write');
  const result = primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun
    ? targetGovernanceIndexMaterializationDryRun(targetRoot)
    : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize
      ? targetGovernanceIndexMaterializationWrite(targetRoot, { force })
      : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.driftCheck
        ? targetGovernanceIndexDriftCheck(targetRoot)
        : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetContract
          ? targetGovernanceBudgetContract()
          : (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetCheck
            ? targetGovernanceBudgetCheck(targetRoot)
            : targetGovernancePreview(targetRoot)))));
  if (outputMode === TARGET_GOVERNANCE_COMMAND.flag.text) {
    if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materializeDryRun) process.stdout.write(formatTargetGovernanceIndexMaterializationDryRunText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.materialize) process.stdout.write(formatTargetGovernanceIndexMaterializationWriteText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.driftCheck) process.stdout.write(formatTargetGovernanceIndexDriftCheckText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetContract) process.stdout.write(formatTargetGovernanceBudgetContractText(result));
    else if (primaryMode === TARGET_GOVERNANCE_COMMAND.mode.budgetCheck) process.stdout.write(formatTargetGovernanceBudgetCheckText(result));
    else process.stdout.write(formatTargetGovernancePreviewText(result));
  } else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetHandoff(args) {
  const allowed = [TARGET_HANDOFF_COMMAND.mode.preview, TARGET_HANDOFF_COMMAND.mode.readinessCheck, TARGET_HANDOFF_COMMAND.flag.json, TARGET_HANDOFF_COMMAND.flag.text, TARGET_HANDOFF_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_HANDOFF_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target handoff ${TARGET_HANDOFF_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target handoff does not support: ${unknown.join(', ')}`);
  const primaryModes = args.filter((arg) => [TARGET_HANDOFF_COMMAND.mode.preview, TARGET_HANDOFF_COMMAND.mode.readinessCheck].includes(arg));
  const outputModes = args.filter((arg) => [TARGET_HANDOFF_COMMAND.flag.json, TARGET_HANDOFF_COMMAND.flag.text].includes(arg));
  if (primaryModes.length > 1) throw new Error('target handoff accepts only one primary mode: --preview or --readiness-check');
  if (outputModes.length > 1) throw new Error('target handoff accepts only one output mode: --json or --text');
  const primaryMode = primaryModes[0] || TARGET_HANDOFF_COMMAND.mode.preview;
  const outputMode = outputModes[0] || (primaryMode === TARGET_HANDOFF_COMMAND.mode.preview ? TARGET_HANDOFF_COMMAND.mode.preview : TARGET_HANDOFF_COMMAND.flag.json);
  const result = primaryMode === TARGET_HANDOFF_COMMAND.mode.readinessCheck
    ? targetRuntimeService.targetHandoffReadinessCheck(targetRoot)
    : targetHandoffPreview(targetRoot);
  if (outputMode === TARGET_HANDOFF_COMMAND.flag.text) {
    if (primaryMode === TARGET_HANDOFF_COMMAND.mode.readinessCheck) process.stdout.write(targetRuntimeService.formatTargetHandoffReadinessCheckText(result));
    else process.stdout.write(formatTargetHandoffPreviewText(result));
  } else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetMemory(args) {
  const allowed = [TARGET_MEMORY_COMMAND.mode.preview, TARGET_MEMORY_COMMAND.flag.json, TARGET_MEMORY_COMMAND.flag.text, TARGET_MEMORY_COMMAND.flag.target];
  const targetIndex = args.indexOf(TARGET_MEMORY_COMMAND.flag.target);
  const targetRoot = targetIndex >= 0 ? args[targetIndex + 1] : process.cwd();
  const unknown = args.filter((arg, index) => {
    if (targetIndex >= 0 && index === targetIndex + 1) return false;
    return !allowed.includes(arg);
  });
  if (targetIndex >= 0 && (!targetRoot || targetRoot.startsWith('-'))) throw new Error(`target memory ${TARGET_MEMORY_COMMAND.flag.target} requires a path`);
  if (unknown.length > 0) throw new Error(`target memory does not support: ${unknown.join(', ')}`);
  const modes = args.filter((arg) => [TARGET_MEMORY_COMMAND.mode.preview, TARGET_MEMORY_COMMAND.flag.json, TARGET_MEMORY_COMMAND.flag.text].includes(arg));
  if (modes.length > 1) throw new Error('target memory accepts only one output mode: --preview, --json, or --text');
  const mode = modes[0] || TARGET_MEMORY_COMMAND.mode.preview;
  const result = targetRuntimeService.targetMemoryDescriptor(targetRoot);
  if (mode === TARGET_MEMORY_COMMAND.flag.text) process.stdout.write(targetRuntimeService.targetMemoryText(result));
  else json(result);
  return result.status === 'ok' ? 0 : 1;
}

function runTargetRuntime(args) {
  if (args.length === 1 && args[0] === '--namespace') {
    json(publicTargetRuntimeNamespace());
    return 0;
  }
  if (args.length === 1 && args[0] === '--check') {
    const result = publicTargetRuntimeNamespaceCheck();
    json(result);
    return result.status === 'ok' ? 0 : 1;
  }
  json({
    schema: 'agent-onboard-target-runtime-command-error-001',
    status: 'error',
    command_family: 'target runtime',
    message: 'target runtime requires --namespace or --check',
    writes_files: false,
    publishes_package: false
  });
  return 1;
}

function runTargetCommand(args) {
  if (args[0] === TARGET_COMMAND.doctor) return runTargetDoctor(args.slice(1));
  if (args[0] === TARGET_COMMAND.metadata) return runTargetMetadata(args.slice(1));
  if (args[0] === TARGET_COMMAND.manifest) return runTargetManifest(args.slice(1));
  if (args[0] === TARGET_COMMAND.profile) return runTargetProfile(args.slice(1));
  if (args[0] === TARGET_COMMAND.repair) return runTargetRepair(args.slice(1));
  if (args[0] === TARGET_COMMAND.runtime) return runTargetRuntime(args.slice(1));
  if (args[0] === TARGET_COMMAND.inventory) return runTargetInventory(args.slice(1));
  if (args[0] === TARGET_COMMAND.memory) return runTargetMemory(args.slice(1));
  if (args[0] === TARGET_COMMAND.workItems) return runTargetWorkItems(args.slice(1));
  if (args[0] === TARGET_COMMAND.governance) return runTargetGovernance(args.slice(1));
  if (args[0] === TARGET_COMMAND.handoff) return runTargetHandoff(args.slice(1));
  if (args[0] === TARGET_COMMAND.onboarding) return runTargetOnboarding(args.slice(1));
  if (args[0] !== TARGET_COMMAND.bootstrap) throw new Error(`target supports only: ${TARGET_DOCTOR_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_PROFILE_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_REPAIR_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_METADATA_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_MANIFEST_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_INVENTORY_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_MEMORY_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_WORK_ITEMS_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_GOVERNANCE_COMMAND.help.replace('agent-onboard target ', '')}, ${TARGET_HANDOFF_COMMAND.help.replace('agent-onboard target ', '')}, runtime --namespace|--check, onboarding --plan|--fixture|--trial [--target <path>]|--write [--force], bootstrap`);
  return runTargetBootstrap(args.slice(1));
}

  return Object.freeze({
    runInit,
    runTargetConfig,
    runTargetRuntime,
    runTargetInventory,
    runTargetMemory,
    runTargetGovernance,
    runTargetHandoff,
    runTargetCommand,
    runTargetInstance
  });
}

module.exports = {
  createTargetCommandRunnerService
};
