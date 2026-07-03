'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureSourceDomainClosureService(deps) {
  const {
    version: VERSION,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicSourceDomainExtractionStabilizationClosureReview: PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicPackageSurfaceCheck,
    publicVersionReferencePolicyCheck,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicPackageSurfaceCheck,
    publicVersionReferencePolicyCheck,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureSourceDomainClosureService missing dependency: ${name}`);
  }

  function publicSourceDomainExtractionStabilizationClosureReview(root = packageRoot()) {
    const gate = PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW;
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
    const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    const m2WorkItems = workItems.filter((item) => item.milestone_id === gate.closed_milestone_id);
    const requiredClosed = new Set(gate.required_closed_work_items);
    const m2NonClosed = m2WorkItems.filter((item) => item.status !== 'closed').map((item) => ({ id: item.id, title: item.title, status: item.status }));
    const missingRequired = gate.required_closed_work_items.filter((id) => !m2WorkItems.some((item) => item.id === id));
    const unexpectedM2Items = m2WorkItems.filter((item) => !requiredClosed.has(item.id)).map((item) => item.id);
    return {
      schema: 'agent-onboard-public-source-domain-extraction-stabilization-closure-review-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      source_context: context,
      package_json_version: pkg.version,
      closure_review_file: gate.closure_review_file,
      closure_review_file_present: fs.existsSync(path.join(root, gate.closure_review_file)),
      milestone_transition: {
        closed_milestone: milestones.find((item) => item.id === gate.closed_milestone_id) || null,
        opened_milestone: milestones.find((item) => item.id === gate.opened_milestone_id) || null,
        closure_work_item: workItems.find((item) => item.id === gate.closure_work_item_id) || null,
        seed_work_item: workItems.find((item) => item.id === gate.seed_work_item_id) || null,
        status: gate.closure_status
      },
      component_checks: {
        work_items_plan: publicWorkItemsDomainSourceExtractionPlanCheck(root),
        work_items_first_slice: publicWorkItemsDomainSourceExtractionFirstSliceCheck(root),
        work_items_bundle_parity: publicWorkItemsDomainSourceExtractionBundleParityCheck(root),
        work_items_runtime_bridge: publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root),
        work_items_installed_fallback: publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck(root),
        claims_plan: publicClaimsDomainSourceExtractionPlanCheck(root),
        claims_first_slice: publicClaimsDomainSourceExtractionFirstSliceCheck(root),
        claims_bundle_parity: publicClaimsDomainSourceExtractionBundleParityCheck(root),
        claims_runtime_bridge: publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root),
        claims_installed_fallback: publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck(root),
        package_surface: publicPackageSurfaceCheck(root),
        version_reference_policy: publicVersionReferencePolicyCheck(root)
      },
      source_ledger: {
        present: fs.existsSync(ledgerPath),
        m2_work_item_count: m2WorkItems.length,
        required_closed_work_items: gate.required_closed_work_items.slice(),
        missing_required_work_items: missingRequired,
        non_closed_m2_work_items: m2NonClosed,
        unexpected_m2_work_items: unexpectedM2Items
      },
      expected_pack_files: PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort(),
      projected_pack_files: packageJsonProjectedPackFiles(pkg).slice().sort(),
      closure_contract: gate,
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

  function publicSourceDomainExtractionStabilizationClosureReviewCheck(root = packageRoot()) {
    const result = publicSourceDomainExtractionStabilizationClosureReview(root);
    const gate = PUBLIC_SOURCE_DOMAIN_EXTRACTION_STABILIZATION_CLOSURE_REVIEW;
    const sourceLedgerRequired = result.source_context.package_context === 'source_repository';
    const errors = [];
    const componentEntries = Object.entries(result.component_checks);
    for (const [name, check] of componentEntries) {
      if (!check || check.status !== 'ok') errors.push(...((check && check.errors) || [`${name} check failed`]).map((error) => `${name}: ${error}`));
    }
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.boundary.source_domain_closure_review_command_writes_files !== false) errors.push('architecture --source-domain-closure-review must remain no-write');
    if (gate.boundary.source_domain_closure_check_command_writes_files !== false) errors.push('architecture --source-domain-closure-check must remain no-write');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('source-domain closure review must preserve package allowlist');
    if (gate.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('source-domain closure review must keep source modules out of npm pack');

    const artifactPath = path.join(root, gate.closure_review_file);
    let fileStatus = 'not_present_installed_context_allowed';
    let fileSchema = null;
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = readJson(artifactPath);
        fileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.closure_review_file} schema must be ${gate.schema}`);
        if (!artifact.milestone_transition || artifact.milestone_transition.closed_milestone_id !== gate.closed_milestone_id) errors.push(`${gate.closure_review_file} must close ${gate.closed_milestone_id}`);
        if (!artifact.milestone_transition || artifact.milestone_transition.opened_milestone_id !== gate.opened_milestone_id) errors.push(`${gate.closure_review_file} must open ${gate.opened_milestone_id}`);
        if (!artifact.milestone_transition || artifact.milestone_transition.closure_work_item_id !== gate.closure_work_item_id) errors.push(`${gate.closure_review_file} must identify ${gate.closure_work_item_id} as closure work item`);
        if (!artifact.milestone_transition || artifact.milestone_transition.seed_work_item_id !== gate.seed_work_item_id) errors.push(`${gate.closure_review_file} must seed ${gate.seed_work_item_id}`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.closure_review_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push(`${gate.closure_review_file} must keep source modules out of npm pack`);
        fileStatus = 'present_validated';
      } catch (error) {
        fileStatus = 'present_invalid_json';
        errors.push(`${gate.closure_review_file} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (sourceLedgerRequired) {
      fileStatus = 'missing_source_context';
      errors.push(`${gate.closure_review_file} must exist in source repository context`);
    }

    const closedMilestone = result.milestone_transition.closed_milestone;
    const openedMilestone = result.milestone_transition.opened_milestone;
    const closureWorkItem = result.milestone_transition.closure_work_item;
    const seedWorkItem = result.milestone_transition.seed_work_item;
    if (sourceLedgerRequired) {
      if (!closedMilestone) errors.push(`${gate.closed_milestone_id} milestone must exist`);
      else if (closedMilestone.status !== 'closed') errors.push(`${gate.closed_milestone_id} milestone must be closed`);
      if (!openedMilestone) errors.push(`${gate.opened_milestone_id} milestone must exist`);
      else if (!['open', 'closed'].includes(openedMilestone.status)) errors.push(`${gate.opened_milestone_id} milestone must be open or closed`);
      if (!closureWorkItem) errors.push(`${gate.closure_work_item_id} work item must exist`);
      else if (closureWorkItem.status !== 'closed') errors.push(`${gate.closure_work_item_id} work item must be closed`);
      if (!seedWorkItem) errors.push(`${gate.seed_work_item_id} work item must exist`);
      else if (!['open', 'closed'].includes(seedWorkItem.status)) errors.push(`${gate.seed_work_item_id} work item must be open or closed`);
      for (const id of result.source_ledger.missing_required_work_items) errors.push(`${gate.closed_milestone_id} is missing required work item ${id}`);
      for (const item of result.source_ledger.non_closed_m2_work_items) errors.push(`${gate.closed_milestone_id} contains non-closed work item ${item.id}`);
      for (const id of result.source_ledger.unexpected_m2_work_items) errors.push(`${gate.closed_milestone_id} contains unexpected work item ${id}`);
    }
    return {
      schema: 'agent-onboard-public-source-domain-extraction-stabilization-closure-review-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      source_context: result.source_context,
      validated: {
        work_items_domain_closed: result.component_checks.work_items_installed_fallback.status === 'ok',
        claims_domain_closed: result.component_checks.claims_installed_fallback.status === 'ok',
        m2_milestone_closed_or_installed_context_allowed: !sourceLedgerRequired || (closedMilestone && closedMilestone.status === 'closed'),
        m2_work_items_all_closed_or_installed_context_allowed: !sourceLedgerRequired || result.source_ledger.non_closed_m2_work_items.length === 0,
        m3_milestone_seeded_open_or_installed_context_allowed: !sourceLedgerRequired || (openedMilestone && ['open', 'closed'].includes(openedMilestone.status)),
        m3_seed_work_item_open_or_installed_context_allowed: !sourceLedgerRequired || (seedWorkItem && ['open', 'closed'].includes(seedWorkItem.status)),
        closure_review_file_present_or_installed_context_allowed: fileStatus === 'present_validated' || fileStatus === 'not_present_installed_context_allowed',
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        source_modules_remain_out_of_pack: gate.boundary.source_modules_remain_out_of_npm_pack === true,
        closure_review_commands_no_write: gate.boundary.source_domain_closure_review_command_writes_files === false && gate.boundary.source_domain_closure_check_command_writes_files === false
      },
      milestone_transition: result.milestone_transition,
      source_closure_review_file: {
        path: gate.closure_review_file,
        present: fs.existsSync(artifactPath),
        status: fileStatus,
        schema: fileSchema,
        source_context_required: sourceLedgerRequired
      },
      component_status: Object.fromEntries(componentEntries.map(([name, check]) => [name, check.status])),
      source_ledger: result.source_ledger,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: result.projected_pack_files,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    publicSourceDomainExtractionStabilizationClosureReview,
    publicSourceDomainExtractionStabilizationClosureReviewCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureSourceDomainClosureService
});
