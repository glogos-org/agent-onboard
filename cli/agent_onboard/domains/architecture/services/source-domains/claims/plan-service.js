'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureClaimsSourceDomainPlanService(deps) {
  const {
    version: VERSION,
    publicDomainServiceFacadesContract: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicClaimsDomainSourceExtractionPlan: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    publicClaimsDomainSourceExtractionFirstSlice: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    publicClaimsDomainSourceExtractionBundleParity: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    publicClaimsDomainSourceExtractionRuntimeBridge: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    publicClaimsDomainSourceExtractionInstalledFallbackSmoke: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicPackageSurfaceCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicDomainServiceFacades,
    publicPackageSurfaceCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicArchitectureMap,
    workItemIdFromComponents
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureClaimsSourceDomainPlanService missing dependency: ${name}`);
  }


  function publicClaimsDomainSourceExtractionPlan(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN;
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
    const currentWorkItem = workItems.find((item) => item.id === gate.work_item_id) || null;
    const nextWorkItem = workItems.find((item) => item.id === gate.next_work_item_id) || null;
    const milestone = milestones.find((item) => item.id === gate.milestone_id) || null;
    return {
      schema: 'agent-onboard-public-claims-domain-source-extraction-plan-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      plan_file: gate.plan_file,
      plan_file_present: fs.existsSync(path.join(root, gate.plan_file)),
      plan: gate,
      source_ledger_present: fs.existsSync(ledgerPath),
      milestone,
      work_items: {
        current: currentWorkItem,
        next: nextWorkItem
      },
      planned_source_module_present: fs.existsSync(path.join(root, gate.domain.planned_module)),
      prerequisite_work_items_installed_fallback: publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck(root),
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


  function publicClaimsDomainSourceExtractionPlanCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionPlan(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_PLAN;
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];

    if (result.prerequisite_work_items_installed_fallback.status !== 'ok') errors.push(...result.prerequisite_work_items_installed_fallback.errors.map((error) => `work-items installed fallback smoke: ${error}`));
    if (result.prerequisite_package_surface.status !== 'ok') errors.push(...result.prerequisite_package_surface.errors.map((error) => `package surface: ${error}`));
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.claims_plan_command_writes_files !== false) errors.push('architecture --claims-plan must remain no-write');
    if (gate.boundary.claims_check_command_writes_files !== false) errors.push('architecture --claims-check must remain no-write');
    if (gate.boundary.creates_source_modules !== false) errors.push('claims planning gate must not create source modules');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('claims planning gate must preserve package allowlist');
    if (gate.domain.id !== 'claims') errors.push('claims planning gate must select the claims domain');
    if (gate.domain.facade !== 'claimsService') errors.push('claims planning gate must remain behind claimsService');
    if (gate.domain.planned_module !== 'src/domains/claims.js') errors.push('planned claims module path must be src/domains/claims.js');
    // After the follow-up first-slice gate closes, the planned module is allowed to exist.
    // The planning gate itself remains no-write and the first-slice gate owns creation evidence.

    let planFileStatus = 'not_present_installed_context_allowed';
    let planFileSchema = null;
    if (result.plan_file_present) {
      try {
        const planFile = readJson(path.join(root, result.plan_file));
        planFileSchema = planFile.schema || null;
        if (planFile.schema !== gate.schema) errors.push(`${result.plan_file} schema must be ${gate.schema}`);
        if (!planFile.domain || planFile.domain.id !== gate.domain.id) errors.push(`${result.plan_file} must select claims domain`);
        if (!planFile.domain || planFile.domain.facade !== gate.domain.facade) errors.push(`${result.plan_file} must remain behind claimsService`);
        if (!planFile.domain || planFile.domain.planned_module !== gate.domain.planned_module) errors.push(`${result.plan_file} must plan ${gate.domain.planned_module}`);
        if (!planFile.boundary || planFile.boundary.creates_source_modules !== false) errors.push(`${result.plan_file} must not create source modules`);
        if (!planFile.boundary || planFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.plan_file} must preserve package allowlist`);
        if (!Array.isArray(planFile.extraction_scope) || !planFile.extraction_scope.some((item) => /claim/.test(item)) || !planFile.extraction_scope.some((item) => /close|closure|handoff/.test(item))) errors.push(`${result.plan_file} must scope claim and closure/handoff behavior`);
        if (!Array.isArray(planFile.excluded_scope) || !planFile.excluded_scope.some((item) => /schema|template|init|validate|list|append/.test(item))) errors.push(`${result.plan_file} must explicitly exclude non-claims work-items behavior`);
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
      else if (currentWorkItem.status !== 'closed') errors.push(`${gate.work_item_id} claims planning work item must be closed`);
      if (!nextWorkItem) errors.push(`${gate.next_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(nextWorkItem.status)) errors.push(`${gate.next_work_item_id} seeded work item must be open or closed`);
    }

    return {
      schema: 'agent-onboard-public-claims-domain-source-extraction-plan-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        prerequisite_work_items_installed_fallback: result.prerequisite_work_items_installed_fallback.status === 'ok',
        prerequisite_package_surface: result.prerequisite_package_surface.status === 'ok',
        claims_domain_selected: gate.domain.id === 'claims',
        planned_module_absent_or_created_by_followup: !result.planned_source_module_present || (nextWorkItem && nextWorkItem.status === 'closed'),
        current_work_item_closed_or_installed_context_allowed: result.package_context === 'installed_package' || (currentWorkItem && currentWorkItem.status === 'closed'),
        next_work_item_seeded_or_installed_context_allowed: result.package_context === 'installed_package' || !!nextWorkItem,
        claims_plan_commands_no_write: gate.boundary.claims_plan_command_writes_files === false && gate.boundary.claims_check_command_writes_files === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      planned_domain: gate.domain,
      work_items: result.work_items,
      source_claims_plan_file: {
        path: result.plan_file,
        present: result.plan_file_present,
        status: planFileStatus,
        schema: planFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_work_items_installed_fallback: {
        status: result.prerequisite_work_items_installed_fallback.status,
        errors: result.prerequisite_work_items_installed_fallback.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    publicClaimsDomainSourceExtractionPlan,
    publicClaimsDomainSourceExtractionPlanCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureClaimsSourceDomainPlanService
});
