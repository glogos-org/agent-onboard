'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureWorkItemsSourceDomainPlanService(deps) {
  const {
    version: VERSION,
    publicDomainServiceFacadesContract: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicWorkItemsDomainSourceExtractionPlan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    publicWorkItemsDomainSourceExtractionFirstSlice: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    publicWorkItemsDomainSourceExtractionBundleParity: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    publicWorkItemsDomainSourceExtractionRuntimeBridge: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicArchitectureM1ClosureM2SeedCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicPackageSurfaceCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicArchitectureM1ClosureM2SeedCheck,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicPackageSurfaceCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureWorkItemsSourceDomainPlanService missing dependency: ${name}`);
  }


  function publicWorkItemsDomainSourceExtractionPlan(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
    let ledger = null;
    if (fs.existsSync(ledgerPath)) {
      try {
        ledger = readJson(ledgerPath);
      } catch {
        ledger = null;
      }
    }
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
    const currentWorkItem = workItems.find((item) => item.id === PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.work_item_id) || null;
    const nextWorkItem = workItems.find((item) => item.id === PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.next_work_item_id) || null;
    const milestone = milestones.find((item) => item.id === PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.milestone_id) || null;
    return {
      schema: 'agent-onboard-public-work-items-domain-source-extraction-plan-result-001',
      status: 'ok',
      package_name: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.package_name,
      version: VERSION,
      release_line: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.release_line,
      command: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.command,
      check_command: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      plan_file: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.plan_file,
      plan_file_present: fs.existsSync(path.join(root, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.plan_file)),
      plan: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
      source_ledger_present: fs.existsSync(ledgerPath),
      milestone,
      work_items: {
        current: currentWorkItem,
        next: nextWorkItem
      },
      planned_source_module_present: fs.existsSync(path.join(root, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN.domain.planned_module)),
      prerequisite_m2_seed: publicArchitectureM1ClosureM2SeedCheck(root),
      prerequisite_authority_runtime_bridge: publicSourceModuleExtractionAuthorityRuntimeBridgeCheck(root),
      prerequisite_package_surface: publicPackageSurfaceCheck(root),
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


  function publicWorkItemsDomainSourceExtractionPlanCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionPlan(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_PLAN;
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];

    if (result.prerequisite_m2_seed.status !== 'ok') errors.push(...result.prerequisite_m2_seed.errors.map((error) => `m2 seed: ${error}`));
    if (result.prerequisite_authority_runtime_bridge.status !== 'ok') errors.push(...result.prerequisite_authority_runtime_bridge.errors.map((error) => `authority runtime bridge: ${error}`));
    if (result.prerequisite_package_surface.status !== 'ok') errors.push(...result.prerequisite_package_surface.errors.map((error) => `package surface: ${error}`));
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.work_items_plan_command_writes_files !== false) errors.push('architecture --work-items-plan must remain no-write');
    if (gate.boundary.work_items_check_command_writes_files !== false) errors.push('architecture --work-items-check must remain no-write');
    if (gate.boundary.creates_source_modules !== false) errors.push('work-items planning gate must not create source modules');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('work-items planning gate must preserve package allowlist');
    if (gate.domain.id !== 'work_items') errors.push('work-items planning gate must select the work_items domain');
    if (gate.domain.facade !== 'workItemsService') errors.push('work-items planning gate must remain behind workItemsService');
    if (gate.domain.planned_module !== 'src/domains/work-items.js') errors.push('planned work-items module path must be src/domains/work-items.js');
    // After the follow-up first-slice gate closes, the planned module is allowed to exist.
    // The planning gate itself remains no-write and the first-slice gate owns creation evidence.

    let planFileStatus = 'not_present_installed_context_allowed';
    let planFileSchema = null;
    if (result.plan_file_present) {
      try {
        const planFile = readJson(path.join(root, result.plan_file));
        planFileSchema = planFile.schema || null;
        if (planFile.schema !== gate.schema) errors.push(`${result.plan_file} schema must be ${gate.schema}`);
        if (!planFile.domain || planFile.domain.id !== gate.domain.id) errors.push(`${result.plan_file} must select work_items domain`);
        if (!planFile.domain || planFile.domain.planned_module !== gate.domain.planned_module) errors.push(`${result.plan_file} must plan ${gate.domain.planned_module}`);
        if (!planFile.boundary || planFile.boundary.creates_source_modules !== false) errors.push(`${result.plan_file} must not create source modules`);
        if (!planFile.boundary || planFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.plan_file} must preserve package allowlist`);
        if (!Array.isArray(planFile.excluded_scope) || !planFile.excluded_scope.some((item) => /claims-domain/.test(item))) errors.push(`${result.plan_file} must explicitly exclude claims-domain extraction`);
        const nextFollowup = planFile.followup_work_items && planFile.followup_work_items[0] ? planFile.followup_work_items[0] : null;
        const nextId = planFile.next_work_item_id || workItemIdFromComponents(planFile.next_work_item_components) || (nextFollowup && (nextFollowup.id || workItemIdFromComponents(nextFollowup.id_components)));
        if (nextId !== gate.next_work_item_id) errors.push(`${result.plan_file} must seed ${gate.next_work_item_id} as the next work item`);
        planFileStatus = 'present_validated';
      } catch (error) {
        planFileStatus = 'present_invalid_json';
        errors.push(`${result.plan_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      planFileStatus = 'missing_source_context';
      errors.push(`${result.plan_file} must be present in source repository context`);
    }

    const sourceLedgerRequired = result.package_context === 'source_repository';
    const currentWorkItem = result.work_items.current;
    const nextWorkItem = result.work_items.next;
    if (sourceLedgerRequired && !result.source_ledger_present) errors.push('.agent-onboard/work-items.json must be present in source repository context');
    if (result.source_ledger_present) {
      if (!result.milestone) errors.push(`${gate.milestone_id} milestone must exist`);
      else if (!['open', 'closed'].includes(result.milestone.status)) errors.push(`${gate.milestone_id} milestone must remain open or closed`);
      if (!currentWorkItem) errors.push(`${gate.work_item_id} work item must exist`);
      else if (currentWorkItem.status !== 'closed') errors.push(`${gate.work_item_id} planning work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} seeded work item must be open or closed`);
    }

    return {
      schema: 'agent-onboard-public-work-items-domain-source-extraction-plan-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        prerequisite_m2_seed: result.prerequisite_m2_seed.status === 'ok',
        prerequisite_authority_runtime_bridge: result.prerequisite_authority_runtime_bridge.status === 'ok',
        prerequisite_package_surface: result.prerequisite_package_surface.status === 'ok',
        work_items_domain_selected: gate.domain.id === 'work_items',
        planned_module_absent_or_created_by_followup: !result.planned_source_module_present || (nextWorkItem && nextWorkItem.status === 'closed'),
        current_work_item_closed_or_installed_context_allowed: !sourceLedgerRequired || (currentWorkItem && currentWorkItem.status === 'closed'),
        next_work_item_seeded_or_installed_context_allowed: !sourceLedgerRequired || (nextWorkItem && ['open', 'closed'].includes(nextWorkItem.status)),
        plan_file_present_or_installed_context_allowed: planFileStatus === 'present_validated' || planFileStatus === 'not_present_installed_context_allowed',
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        work_items_plan_commands_no_write: gate.boundary.work_items_plan_command_writes_files === false && gate.boundary.work_items_check_command_writes_files === false
      },
      planned_domain: gate.domain,
      work_items: result.work_items,
      source_plan_file: {
        path: result.plan_file,
        present: result.plan_file_present,
        status: planFileStatus,
        schema: planFileSchema,
        source_context_required: sourceLedgerRequired
      },
      prerequisite_m2_seed: {
        status: result.prerequisite_m2_seed.status,
        errors: result.prerequisite_m2_seed.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    publicWorkItemsDomainSourceExtractionPlan,
    publicWorkItemsDomainSourceExtractionPlanCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainPlanService
});
