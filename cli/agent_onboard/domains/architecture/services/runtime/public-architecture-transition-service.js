'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureTransitionService(deps) {
  const {
    version: VERSION,
    publicArchitectureM1ClosureM2Seed: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureTransitionService missing dependency: ${name}`);
  }

function publicArchitectureM1ClosureM2Seed(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const transitionFile = PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.transition_file;
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  let ledger = null;
  if (fs.existsSync(ledgerPath)) {
    try {
      ledger = readJson(ledgerPath);
    } catch {
      ledger = null;
    }
  }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const closedMilestone = milestones.find((item) => item.id === PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.closed_milestone_id) || null;
  const openedMilestone = milestones.find((item) => item.id === PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.opened_milestone_id) || null;
  const seedWorkItem = workItems.find((item) => item.id === PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.seed_work_item_id) || null;
  const nextWorkItem = workItems.find((item) => item.id === PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.next_work_item_id) || null;
  const m1WorkItems = workItems.filter((item) => item.milestone_id === PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.closed_milestone_id);
  return {
    schema: 'agent-onboard-public-architecture-m1-closure-m2-seed-result-001',
    status: 'ok',
    package_name: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.package_name,
    version: VERSION,
    release_line: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.release_line,
    command: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.command,
    check_command: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    transition_file: transitionFile,
    transition_file_present: fs.existsSync(path.join(root, transitionFile)),
    transition: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    source_ledger_present: fs.existsSync(ledgerPath),
    milestones: {
      closed: closedMilestone,
      opened: openedMilestone
    },
    work_items: {
      m1_count: m1WorkItems.length,
      m1_non_closed: m1WorkItems.filter((item) => item.status !== 'closed').map((item) => ({ id: item.id, title: item.title, status: item.status })),
      seed: seedWorkItem,
      next: nextWorkItem
    },
    prerequisite_authority_runtime_bridge: publicSourceModuleExtractionAuthorityRuntimeBridgeCheck(root),
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    boundary: {
      writes_files: false,
      writes_source_state: false,
      writes_target_repository_state: false,
      creates_source_modules: false,
      moves_existing_source_files: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      publishes_package: false,
      mutates_registry: false
    }
  };
}

function workItemIdFromComponents(value) {
  if (!value || !Number.isInteger(value.program) || !Number.isInteger(value.stage) || !Number.isInteger(value.milestone) || !Number.isInteger(value.work_item)) return null;
  return ['P', value.program, 'S', value.stage, 'M', value.milestone, 'W', value.work_item].join('');
}

function workItemIdsFromComponentList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => workItemIdFromComponents(item)).filter(Boolean);
}

function publicArchitectureM1ClosureM2SeedCheck(root = packageRoot()) {
  const result = publicArchitectureM1ClosureM2Seed(root);
  const gate = PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED;
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];

  if (result.prerequisite_authority_runtime_bridge.status !== 'ok') {
    errors.push(...result.prerequisite_authority_runtime_bridge.errors.map((error) => `authority runtime bridge: ${error}`));
  }
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
  if (gate.boundary.m2_seed_command_writes_files !== false) errors.push('architecture --m2-seed must remain no-write');
  if (gate.boundary.m2_seed_check_command_writes_files !== false) errors.push('architecture --m2-seed-check must remain no-write');
  if (gate.boundary.package_allowlist_unchanged !== true) errors.push('M2 seed gate must preserve package allowlist');
  if (gate.boundary.creates_source_modules !== false) errors.push('M2 seed gate must not create source modules');

  let transitionFileStatus = 'not_present_installed_context_allowed';
  let transitionFileSchema = null;
  if (result.transition_file_present) {
    try {
      const transitionFile = readJson(path.join(root, result.transition_file));
      transitionFileSchema = transitionFile.schema || null;
      if (transitionFile.schema !== gate.schema) errors.push(`${result.transition_file} schema must be ${gate.schema}`);
      if (!transitionFile.milestone_transition || transitionFile.milestone_transition.closed_milestone_id !== gate.closed_milestone_id) errors.push(`${result.transition_file} must close ${gate.closed_milestone_id}`);
      if (!transitionFile.milestone_transition || transitionFile.milestone_transition.opened_milestone_id !== gate.opened_milestone_id) errors.push(`${result.transition_file} must open ${gate.opened_milestone_id}`);
      const transitionSeedWorkItemId = transitionFile.milestone_transition && (transitionFile.milestone_transition.seed_work_item_id || workItemIdFromComponents(transitionFile.milestone_transition.seed_work_item_components));
      const transitionNextWorkItemId = transitionFile.milestone_transition && (transitionFile.milestone_transition.next_work_item_id || workItemIdFromComponents(transitionFile.milestone_transition.next_work_item_components));
      const transitionPrerequisiteIds = Array.isArray(transitionFile.prerequisite_closed_work_items) ? transitionFile.prerequisite_closed_work_items : workItemIdsFromComponentList(transitionFile.prerequisite_closed_work_item_components);
      if (transitionSeedWorkItemId !== gate.seed_work_item_id) errors.push(`${result.transition_file} seed work item components must resolve to the transition seed work item`);
      if (transitionNextWorkItemId !== gate.next_work_item_id) errors.push(`${result.transition_file} next work item components must resolve to the next executable work item`);
      if (!arrayEquals(transitionPrerequisiteIds, gate.prerequisite_closed_work_items)) errors.push(`${result.transition_file} prerequisite closed work item components must match the M1 closure list`);
      transitionFileStatus = 'present_validated';
    } catch (error) {
      transitionFileStatus = 'present_invalid_json';
      errors.push(`${result.transition_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    transitionFileStatus = 'missing_source_context';
    errors.push(`${result.transition_file} must be present in source repository context`);
  }

  const sourceLedgerRequired = result.package_context === 'source_repository';
  const closedMilestone = result.milestones.closed;
  const openedMilestone = result.milestones.opened;
  const seedWorkItem = result.work_items.seed;
  const nextWorkItem = result.work_items.next;
  const prerequisiteClosed = new Set(gate.prerequisite_closed_work_items);
  const m1WorkIds = result.source_ledger_present ? (readJson(path.join(root, '.agent-onboard', 'work-items.json')).work_items || []).filter((item) => item.milestone_id === gate.closed_milestone_id).map((item) => item.id) : [];
  const missingPrerequisites = gate.prerequisite_closed_work_items.filter((id) => !m1WorkIds.includes(id));
  const unexpectedM1WorkItems = m1WorkIds.filter((id) => !prerequisiteClosed.has(id));

  if (sourceLedgerRequired && !result.source_ledger_present) errors.push('.agent-onboard/work-items.json must be present in source repository context');
  if (result.source_ledger_present) {
    if (!closedMilestone) errors.push(`${gate.closed_milestone_id} milestone must exist`);
    else if (closedMilestone.status !== 'closed') errors.push(`${gate.closed_milestone_id} milestone must be closed`);
    if (!openedMilestone) errors.push(`${gate.opened_milestone_id} milestone must exist`);
    else if (!['open', 'closed'].includes(openedMilestone.status)) errors.push(`${gate.opened_milestone_id} milestone must be open or closed`);
    if (result.work_items.m1_non_closed.length > 0) errors.push(`${gate.closed_milestone_id} must have no non-closed work items`);
    if (missingPrerequisites.length > 0) errors.push(`${gate.closed_milestone_id} is missing prerequisite work items: ${missingPrerequisites.join(', ')}`);
    if (unexpectedM1WorkItems.length > 0) errors.push(`${gate.closed_milestone_id} contains unplanned extension work items: ${unexpectedM1WorkItems.join(', ')}`);
    if (!seedWorkItem) errors.push(`${gate.seed_work_item_id} work item must exist`);
    else if (seedWorkItem.status !== 'closed') errors.push(`${gate.seed_work_item_id} transition work item must be closed`);
    if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
    else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} seeded work item must be open or closed`);
  }

  return {
    schema: 'agent-onboard-public-architecture-m1-closure-m2-seed-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: gate.package_name,
    version: VERSION,
    release_line: gate.release_line,
    command: gate.check_command,
    package_root: root,
    validated: {
      prerequisite_authority_runtime_bridge: result.prerequisite_authority_runtime_bridge.status === 'ok',
      m1_milestone_closed_or_installed_context_allowed: !sourceLedgerRequired || (closedMilestone && closedMilestone.status === 'closed'),
      m1_work_items_all_closed_or_installed_context_allowed: !sourceLedgerRequired || result.work_items.m1_non_closed.length === 0,
      m2_milestone_open_or_installed_context_allowed: !sourceLedgerRequired || (openedMilestone && ['open', 'closed'].includes(openedMilestone.status)),
      seed_work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (seedWorkItem && seedWorkItem.status === 'closed'),
      next_work_item_seeded_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
      transition_file_present_or_installed_context_allowed: transitionFileStatus === 'present_validated' || transitionFileStatus === 'not_present_installed_context_allowed',
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      m2_seed_commands_no_write: gate.boundary.m2_seed_command_writes_files === false && gate.boundary.m2_seed_check_command_writes_files === false
    },
    milestone_transition: {
      closed_milestone: closedMilestone,
      opened_milestone: openedMilestone,
      seed_work_item: seedWorkItem ? { id: seedWorkItem.id, title: seedWorkItem.title, status: seedWorkItem.status } : null,
      next_work_item: nextWorkItem ? { id: nextWorkItem.id, title: nextWorkItem.title, status: nextWorkItem.status } : null,
      m1_non_closed_work_items: result.work_items.m1_non_closed
    },
    source_transition_file: {
      path: result.transition_file,
      present: result.transition_file_present,
      status: transitionFileStatus,
      schema: transitionFileSchema,
      source_context_required: sourceLedgerRequired
    },
    prerequisite_authority_runtime_bridge: {
      status: result.prerequisite_authority_runtime_bridge.status,
      errors: result.prerequisite_authority_runtime_bridge.errors
    },
    projected_pack_files: result.projected_pack_files,
    expected_pack_files: expectedPackFiles,
    boundary: result.boundary,
    errors
  };
}

  return Object.freeze({
    publicArchitectureM1ClosureM2Seed,
    workItemIdFromComponents,
    workItemIdsFromComponentList,
    publicArchitectureM1ClosureM2SeedCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureTransitionService
});
