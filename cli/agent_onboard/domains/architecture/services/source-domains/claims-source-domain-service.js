'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureClaimsSourceDomainService(deps) {
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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureClaimsSourceDomainService missing dependency: ${name}`);
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

  function loadClaimsFirstSliceModule(root = packageRoot()) {
    const modulePath = path.join(root, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.source_module);
    if (!fs.existsSync(modulePath)) return null;
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
    return require(resolved);
  }

  function publicClaimsDomainSourceExtractionFirstSlice(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    let module_exports = [];
    let module_value = null;
    let module_load_error = null;
    try {
      const loaded = loadClaimsFirstSliceModule(root);
      if (loaded) {
        module_exports = Object.keys(loaded).sort();
        if (typeof loaded.getClaimsDomainFirstSlice === 'function') {
          module_value = loaded.getClaimsDomainFirstSlice();
        } else if (loaded.CLAIMS_DOMAIN_FIRST_SLICE) {
          module_value = loaded.CLAIMS_DOMAIN_FIRST_SLICE;
        }
      }
    } catch (error) {
      module_load_error = error && error.message ? error.message : String(error);
    }
    return {
      schema: 'agent-onboard-public-source-module-claims-first-slice-result-001',
      status: module_load_error ? 'error' : 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      first_slice_file: gate.first_slice_file,
      first_slice_file_present: fs.existsSync(path.join(root, gate.first_slice_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      source_module_exports: module_exports,
      source_module_value: module_value,
      source_module_load_error: module_load_error,
      prerequisite_plan_file: gate.prerequisite_plan_file,
      claims_first_slice: gate,
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

  function publicClaimsDomainSourceExtractionFirstSliceCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionFirstSlice(root);
    const plan = publicClaimsDomainSourceExtractionPlanCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    const expectedExports = gate.expected_module_export_names.slice().sort();
    const errors = [];
    if (plan.status !== 'ok') errors.push(...plan.errors.map((error) => `claims plan: ${error}`));
    if (result.status !== 'ok') errors.push(`claims first-slice module load failed: ${result.source_module_load_error}`);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.first_slice_status !== 'source_only_shadow_module_applied') errors.push('claims first-slice status must be source_only_shadow_module_applied');
    if (gate.extracted_domain.id !== 'claims') errors.push('claims first-slice must extract the claims domain');
    if (gate.boundary.created_source_module !== 'src/domains/claims.js') errors.push('claims first-slice created source module must be src/domains/claims.js');
    if (gate.boundary.creates_exactly_one_source_module !== true) errors.push('claims first-slice must create exactly one source module');
    if (gate.boundary.excludes_non_claim_work_items_commands !== true) errors.push('claims first-slice must exclude non-claim work-items commands');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims first-slice must keep the shared work-items ledger boundary');
    if (gate.boundary.moves_existing_source_files !== false) errors.push('claims first-slice must not move existing source files');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('claims first-slice must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('claims first-slice must not make CLI runtime require source modules');
    if (gate.boundary.exports_source_module_as_public_api !== false) errors.push('claims first-slice must not expose source module as public import API');
    if (gate.boundary.claims_first_slice_command_writes_files !== false) errors.push('architecture --claims-first-slice must remain no-write');
    if (gate.boundary.claims_first_slice_check_command_writes_files !== false) errors.push('architecture --claims-first-slice-check must remain no-write');

    let artifactStatus = 'not_present_installed_context_allowed';
    let artifactSchema = null;
    if (result.first_slice_file_present) {
      try {
        const artifact = readJson(path.join(root, result.first_slice_file));
        artifactSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${result.first_slice_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== gate.source_module) errors.push(`${result.first_slice_file} source_module must be ${gate.source_module}`);
        if (!artifact.extracted_domain || artifact.extracted_domain.id !== 'claims') errors.push(`${result.first_slice_file} must declare extracted_domain.id claims`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${result.first_slice_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.keeps_shared_work_items_ledger !== true) errors.push(`${result.first_slice_file} must keep shared work-items ledger`);
        if (!artifact.boundary || artifact.boundary.excludes_non_claim_work_items_commands !== true) errors.push(`${result.first_slice_file} must exclude non-claim work-items commands`);
        artifactStatus = 'present_validated';
      } catch (error) {
        artifactStatus = 'present_invalid_json';
        errors.push(`${result.first_slice_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      artifactStatus = 'missing_source_context';
      errors.push(`${result.first_slice_file} must be present in source repository context`);
    }

    let sourceModuleStatus = 'not_present_installed_context_allowed';
    const moduleValue = result.source_module_value || {};
    const moduleExportsSorted = result.source_module_exports.slice().sort();
    if (result.source_module_present) {
      if (!arrayEquals(moduleExportsSorted, expectedExports)) errors.push(`${result.source_module} exports must be ${expectedExports.join(', ')}`);
      if (moduleValue.schema !== gate.schema) errors.push(`${result.source_module} must export claims first-slice schema`);
      if (moduleValue.domain !== 'claims') errors.push(`${result.source_module} domain must be claims`);
      if (moduleValue.facade !== 'claimsService') errors.push(`${result.source_module} facade must be claimsService`);
      if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
      if (moduleValue.runtime_dependency_status !== gate.extracted_domain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
      if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
      if (moduleValue.includes_work_items_non_claim_behavior !== false) errors.push(`${result.source_module} must exclude non-claim work-items behavior`);
      if (moduleValue.declares_shared_work_items_ledger !== true) errors.push(`${result.source_module} must declare the shared work-items ledger boundary`);
      if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
      if (moduleValue.declares_explicit_write_boundaries !== true) errors.push(`${result.source_module} must declare explicit write boundaries for claim/close commands`);
      if (!arrayEquals((moduleValue.owns_commands || []), gate.expected_owned_commands.slice())) errors.push(`${result.source_module} owns_commands must match claims first-slice scope`);
      if (!arrayEquals((moduleValue.excluded_commands || []), gate.excluded_commands.slice())) errors.push(`${result.source_module} excluded_commands must keep non-claim work-items behavior out of this slice`);
      sourceModuleStatus = 'present_validated';
    } else if (result.package_context === 'source_repository') {
      sourceModuleStatus = 'missing_source_context';
      errors.push(`${result.source_module} must be present in source repository context`);
    }

    return {
      schema: 'agent-onboard-public-source-module-claims-first-slice-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        claims_plan: plan.status === 'ok',
        first_slice_status: gate.first_slice_status === 'source_only_shadow_module_applied',
        extracted_domain_is_claims: gate.extracted_domain.id === 'claims',
        source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
        first_slice_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
        shared_work_items_ledger_preserved: moduleValue.declares_shared_work_items_ledger === true || sourceModuleStatus === 'not_present_installed_context_allowed',
        non_claim_work_items_commands_excluded: moduleValue.includes_work_items_non_claim_behavior === false || sourceModuleStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.claims_first_slice_command_writes_files === false && gate.boundary.claims_first_slice_check_command_writes_files === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      source_module: {
        path: result.source_module,
        present: result.source_module_present,
        status: sourceModuleStatus,
        exports: result.source_module_exports,
        value: result.source_module_value,
        source_context_required: result.package_context === 'source_repository'
      },
      first_slice_file: {
        path: result.first_slice_file,
        present: result.first_slice_file_present,
        status: artifactStatus,
        schema: artifactSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_claims_plan: {
        status: plan.status,
        errors: plan.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  function bundledClaimsDomainForParity(root = packageRoot()) {
    const map = publicArchitectureMap(root);
    const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'claims');
    const domain = map.map.canonical_domains.find((item) => item.id === 'claims');
    return {
      schema: 'agent-onboard-public-bundled-claims-domain-view-001',
      domain: domain ? domain.id : null,
      facade: facade ? facade.service : null,
      service: facade ? facade.service : null,
      source: 'cli/agent-onboard.js',
      source_module_schema: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.schema,
      owns_commands: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.expected_owned_commands.slice(),
      excluded_commands: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.excluded_commands.slice(),
      writes_files: false,
      state_writer: false,
      declares_explicit_write_boundaries: true,
      declares_shared_work_items_ledger: true,
      shared_state_files: Object.freeze(['.agent-onboard/work-items.json']).slice(),
      claim_contract: Object.freeze({
        command: 'work-items --claim',
        writes_only_under_explicit_write: true,
        dry_run_is_default_boundary: true
      }),
      close_contract: Object.freeze({
        command: 'work-items --close',
        writes_only_under_explicit_write: true,
        dry_run_is_default_boundary: true
      }),
      package_context: sourceContext(root).package_context
    };
  }

  function publicClaimsDomainSourceExtractionBundleParity(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const firstSlice = publicClaimsDomainSourceExtractionFirstSlice(root);
    const bundledClaims = bundledClaimsDomainForParity(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    return {
      schema: 'agent-onboard-public-source-module-claims-bundle-parity-result-001',
      status: firstSlice.status === 'ok' ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      bundle_parity_file: gate.bundle_parity_file,
      bundle_parity_file_present: fs.existsSync(path.join(root, gate.bundle_parity_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      source_slice_value: firstSlice.source_module_value,
      bundled_claims_view: bundledClaims,
      claims_bundle_parity: gate,
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

  function publicClaimsDomainSourceExtractionBundleParityCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionBundleParity(root);
    const firstSlice = publicClaimsDomainSourceExtractionFirstSliceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    const errors = [];
    if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `claims first slice: ${error}`));
    if (result.status !== 'ok') errors.push('claims bundle parity depends on a loadable first-slice source module in source context or installed fallback metadata');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.parity_status !== 'claims_source_slice_matches_bundled_cli_view') errors.push('claims bundle parity status must remain claims_source_slice_matches_bundled_cli_view');
    if (gate.boundary.claims_bundle_parity_command_writes_files !== false) errors.push('architecture --claims-bundle-parity must remain no-write');
    if (gate.boundary.claims_bundle_parity_check_command_writes_files !== false) errors.push('architecture --claims-bundle-parity-check must remain no-write');
    if (gate.boundary.creates_bundle_artifact !== false) errors.push('claims bundle parity gate must not create runtime bundle artifacts');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims bundle parity gate must preserve the shared work-items ledger boundary');
    if (gate.boundary.excludes_non_claim_work_items_commands !== true) errors.push('claims bundle parity gate must exclude non-claim work-items commands');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('claims bundle parity gate must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('claims bundle parity gate must not change CLI runtime dependency graph');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('claims bundle parity gate must preserve package allowlist');

    let bundleParityFileStatus = 'not_present_installed_context_allowed';
    let bundleParityFileSchema = null;
    if (result.bundle_parity_file_present) {
      try {
        const artifact = readJson(path.join(root, result.bundle_parity_file));
        bundleParityFileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${result.bundle_parity_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== gate.source_module) errors.push(`${result.bundle_parity_file} source_module must be ${gate.source_module}`);
        if (artifact.parity_status !== gate.parity_status) errors.push(`${result.bundle_parity_file} parity_status must be ${gate.parity_status}`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${result.bundle_parity_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.keeps_shared_work_items_ledger !== true) errors.push(`${result.bundle_parity_file} must keep shared work-items ledger`);
        if (!artifact.boundary || artifact.boundary.excludes_non_claim_work_items_commands !== true) errors.push(`${result.bundle_parity_file} must exclude non-claim work-items commands`);
        bundleParityFileStatus = 'present_validated';
      } catch (error) {
        bundleParityFileStatus = 'present_invalid_json';
        errors.push(`${result.bundle_parity_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      bundleParityFileStatus = 'missing_source_context';
      errors.push(`${result.bundle_parity_file} must be present in source repository context`);
    }

    const sourceSlice = result.source_slice_value || null;
    const bundled = result.bundled_claims_view;
    const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
    const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === bundled.domain);
    const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === bundled.facade);
    const serviceParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.service === bundled.service);
    const schemaParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.schema === bundled.source_module_schema);
    const stateFileParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.shared_state_files || [], bundled.shared_state_files));
    const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], bundled.owns_commands));
    const excludedCommandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.excluded_commands || [], bundled.excluded_commands));
    const writeBoundaryParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === bundled.writes_files && sourceSlice.state_writer === bundled.state_writer && sourceSlice.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const sharedLedgerParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.declares_shared_work_items_ledger === bundled.declares_shared_work_items_ledger);
    const claimContractParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.claim_contract && sourceSlice.claim_contract.command === bundled.claim_contract.command && sourceSlice.claim_contract.writes_only_under_explicit_write === true && sourceSlice.claim_contract.dry_run_is_default_boundary === true);
    const closeContractParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.close_contract && sourceSlice.close_contract.command === bundled.close_contract.command && sourceSlice.close_contract.writes_only_under_explicit_write === true && sourceSlice.close_contract.dry_run_is_default_boundary === true);
    const nonClaimExcluded = sourceContextAllowedMissing || (sourceSlice && sourceSlice.includes_work_items_non_claim_behavior === false);
    if (!domainParity) errors.push('claims source slice domain must match bundled claims domain view');
    if (!facadeParity) errors.push('claims source slice facade must match bundled claims facade view');
    if (!serviceParity) errors.push('claims source slice service must match bundled claims service view');
    if (!schemaParity) errors.push('claims source slice schema must match bundled claims source-module schema');
    if (!stateFileParity) errors.push('claims source slice shared state files must match bundled claims view');
    if (!commandParity) errors.push('claims source slice owned commands must match bundled claims command surface');
    if (!excludedCommandParity) errors.push('claims source slice excluded commands must match bundled claims exclusions');
    if (!writeBoundaryParity) errors.push('claims source slice read/write boundary must match bundled claims view');
    if (!sharedLedgerParity) errors.push('claims source slice must preserve shared work-items ledger parity');
    if (!claimContractParity) errors.push('claims source slice claim contract must match bundled claims view');
    if (!closeContractParity) errors.push('claims source slice close contract must match bundled claims view');
    if (!nonClaimExcluded) errors.push('claims source slice must exclude non-claim work-items behavior');

    return {
      schema: 'agent-onboard-public-source-module-claims-bundle-parity-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        first_slice: firstSlice.status === 'ok',
        bundle_parity_status: gate.parity_status === 'claims_source_slice_matches_bundled_cli_view',
        source_slice_domain_matches_bundled_claims: domainParity,
        source_slice_facade_matches_bundled_claims: facadeParity,
        source_slice_service_matches_bundled_claims: serviceParity,
        source_slice_schema_matches_bundled_claims: schemaParity,
        source_slice_state_files_match_bundled_claims: stateFileParity,
        source_slice_commands_match_bundled_claims: commandParity,
        source_slice_exclusions_match_bundled_claims: excludedCommandParity,
        source_slice_write_boundary_matches_bundled_claims: writeBoundaryParity,
        shared_work_items_ledger_preserved: sharedLedgerParity,
        claim_contract_matches_bundled_claims: claimContractParity,
        close_contract_matches_bundled_claims: closeContractParity,
        non_claim_work_items_commands_excluded: nonClaimExcluded,
        source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
        bundle_parity_file_present_or_installed_context_allowed: bundleParityFileStatus === 'present_validated' || bundleParityFileStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.claims_bundle_parity_command_writes_files === false && gate.boundary.claims_bundle_parity_check_command_writes_files === false,
        runtime_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      source_slice: result.source_slice_value,
      bundled_claims_view: result.bundled_claims_view,
      source_bundle_parity_file: {
        path: result.bundle_parity_file,
        present: result.bundle_parity_file_present,
        status: bundleParityFileStatus,
        schema: bundleParityFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_first_slice: {
        status: firstSlice.status,
        errors: firstSlice.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  function resolveClaimsDomainRuntimeBridge(root = packageRoot()) {
    const context = sourceContext(root);
    const modulePath = path.join(root, PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module);
    const sourceModulePresent = fs.existsSync(modulePath);
    const bundledClaims = bundledClaimsDomainForParity(root);
    if (sourceModulePresent) {
      try {
        const resolved = require.resolve(modulePath);
        delete require.cache[resolved];
        const loaded = require(resolved);
        const value = loaded && typeof loaded.getClaimsDomainFirstSlice === 'function'
          ? loaded.getClaimsDomainFirstSlice()
          : loaded && loaded.CLAIMS_DOMAIN_FIRST_SLICE;
        if (!value || value.schema !== 'agent-onboard-public-source-module-claims-first-slice-001') {
          return {
            status: 'error',
            context: context.package_context,
            mode: 'source_module_invalid',
            source_module_present: true,
            source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
            module_value: value || null,
            bundled_claims_view: bundledClaims,
            errors: [`${PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} did not export a valid claims first-slice contract`]
          };
        }
        return {
          status: 'ok',
          context: context.package_context,
          mode: 'source_module_loaded',
          source_module_present: true,
          source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: value,
          bundled_claims_view: bundledClaims,
          errors: []
        };
      } catch (error) {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_load_failed',
          source_module_present: true,
          source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: null,
          bundled_claims_view: bundledClaims,
          errors: [`${PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
        };
      }
    }
    return {
      status: 'ok',
      context: context.package_context,
      mode: 'bundled_fallback',
      source_module_present: false,
      source_module: PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
      module_value: null,
      bundled_claims_view: bundledClaims,
      errors: []
    };
  }

  function publicClaimsDomainSourceExtractionRuntimeBridge(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const bridge = resolveClaimsDomainRuntimeBridge(root);
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    return {
      schema: 'agent-onboard-public-source-module-claims-runtime-bridge-result-001',
      status: bridge.status,
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      package_context: context.package_context,
      package_json_version: pkg.version,
      runtime_bridge_file: gate.runtime_bridge_file,
      runtime_bridge_file_present: fs.existsSync(path.join(root, gate.runtime_bridge_file)),
      source_module: gate.source_module,
      source_module_present: fs.existsSync(path.join(root, gate.source_module)),
      runtime_bridge_resolution: bridge,
      runtime_bridge_contract: gate,
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

  function publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionRuntimeBridge(root);
    const bundleParity = publicClaimsDomainSourceExtractionBundleParityCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    const errors = [];
    if (bundleParity.status !== 'ok') errors.push(...bundleParity.errors.map((error) => `claims bundle parity: ${error}`));
    if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.bridge_status !== 'claims_source_context_optional_runtime_bridge_applied') errors.push('claims runtime bridge status must remain claims_source_context_optional_runtime_bridge_applied');
    if (gate.boundary.claims_runtime_bridge_command_writes_files !== false) errors.push('architecture --claims-runtime-bridge must remain no-write');
    if (gate.boundary.claims_runtime_bridge_check_command_writes_files !== false) errors.push('architecture --claims-runtime-bridge-check must remain no-write');
    if (gate.boundary.source_context_optional_require_only !== true) errors.push('claims runtime bridge must use source-context optional require only');
    if (gate.boundary.installed_context_fallback_required !== true) errors.push('claims runtime bridge must preserve installed-package fallback');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims runtime bridge must preserve shared work-items ledger');
    if (gate.boundary.includes_non_claim_work_items_commands !== false) errors.push('claims runtime bridge must keep non-claim work-items commands excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('claims runtime bridge gate must preserve package allowlist');

    let bridgeFileStatus = 'not_present_installed_context_allowed';
    let bridgeFileSchema = null;
    if (result.runtime_bridge_file_present) {
      try {
        const bridgeFile = readJson(path.join(root, result.runtime_bridge_file));
        bridgeFileSchema = bridgeFile.schema || null;
        if (bridgeFile.schema !== gate.schema) errors.push(`${result.runtime_bridge_file} schema must be ${gate.schema}`);
        if (bridgeFile.source_module !== gate.source_module) errors.push(`${result.runtime_bridge_file} source_module must be ${gate.source_module}`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.runtime_bridge_file} must allow installed context fallback`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.keeps_shared_work_items_ledger !== true) errors.push(`${result.runtime_bridge_file} must keep the shared work-items ledger`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.includes_non_claim_work_items_commands !== false) errors.push(`${result.runtime_bridge_file} must exclude non-claim work-items commands`);
        if (!bridgeFile.boundary || bridgeFile.boundary.package_allowlist_unchanged !== true) errors.push(`${result.runtime_bridge_file} must preserve package_allowlist_unchanged`);
        bridgeFileStatus = 'present_validated';
      } catch (error) {
        bridgeFileStatus = 'present_invalid_json';
        errors.push(`${result.runtime_bridge_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
      }
    } else if (result.package_context === 'source_repository') {
      bridgeFileStatus = 'missing_source_context';
      errors.push(`${result.runtime_bridge_file} must be present in source repository context`);
    }

    const resolved = result.runtime_bridge_resolution;
    const installedFallbackAllowed = result.package_context === 'installed_package' && resolved.mode === 'bundled_fallback';
    const sourceLoadExpected = result.package_context === 'source_repository' && result.source_module_present;
    const sourceLoadedWhenPresent = sourceLoadExpected ? resolved.mode === 'source_module_loaded' : true;
    const fallbackWhenMissing = !result.source_module_present ? resolved.mode === 'bundled_fallback' : true;
    const source = resolved.module_value || null;
    const bundled = resolved.bundled_claims_view;
    const domainParity = !source || source.domain === bundled.domain;
    const facadeParity = !source || source.facade === bundled.facade;
    const serviceParity = !source || source.service === bundled.service;
    const schemaParity = !source || source.schema === bundled.source_module_schema;
    const stateFileParity = !source || arrayEquals(source.shared_state_files || [], bundled.shared_state_files);
    const commandParity = !source || arrayEquals(source.owns_commands || [], bundled.owns_commands);
    const excludedCommandParity = !source || arrayEquals(source.excluded_commands || [], bundled.excluded_commands);
    const writeBoundaryParity = !source || (source.writes_files === bundled.writes_files && source.state_writer === bundled.state_writer && source.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const sharedLedgerParity = !source || (source.declares_shared_work_items_ledger === true && bundled.declares_shared_work_items_ledger === true);
    const nonClaimExcluded = !source || source.includes_work_items_non_claim_behavior === false;
    const claimContractParity = !source || (source.claim_contract && source.claim_contract.command === bundled.claim_contract.command && source.claim_contract.writes_only_under_explicit_write === true && source.claim_contract.dry_run_is_default_boundary === true);
    const closeContractParity = !source || (source.close_contract && source.close_contract.command === bundled.close_contract.command && source.close_contract.writes_only_under_explicit_write === true && source.close_contract.dry_run_is_default_boundary === true);

    if (!sourceLoadedWhenPresent) errors.push('claims runtime bridge must load the source claims slice when present in source repository context');
    if (!fallbackWhenMissing) errors.push('claims runtime bridge must fall back to bundled claims view when source module is missing');
    if (!domainParity) errors.push('claims runtime bridge source domain must match bundled claims domain');
    if (!facadeParity) errors.push('claims runtime bridge source facade must match bundled claims facade');
    if (!serviceParity) errors.push('claims runtime bridge source service must match bundled claims service');
    if (!schemaParity) errors.push('claims runtime bridge source schema must match bundled claims schema');
    if (!stateFileParity) errors.push('claims runtime bridge source shared state files must match bundled claims state files');
    if (!commandParity) errors.push('claims runtime bridge source commands must match bundled claims commands');
    if (!excludedCommandParity) errors.push('claims runtime bridge source exclusions must match bundled claims exclusions');
    if (!writeBoundaryParity) errors.push('claims runtime bridge source write boundary must match bundled claims view');
    if (!sharedLedgerParity) errors.push('claims runtime bridge must preserve shared work-items ledger');
    if (!nonClaimExcluded) errors.push('claims runtime bridge must keep non-claim work-items commands excluded');
    if (!claimContractParity) errors.push('claims runtime bridge source claim contract must match bundled claims view');
    if (!closeContractParity) errors.push('claims runtime bridge source close contract must match bundled claims view');

    return {
      schema: 'agent-onboard-public-source-module-claims-runtime-bridge-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        claims_bundle_parity: bundleParity.status === 'ok',
        claims_runtime_bridge_status: gate.bridge_status === 'claims_source_context_optional_runtime_bridge_applied',
        source_module_loaded_when_present: sourceLoadedWhenPresent,
        bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
        installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
        source_domain_matches_bundled_claims: domainParity,
        source_facade_matches_bundled_claims: facadeParity,
        source_service_matches_bundled_claims: serviceParity,
        source_schema_matches_bundled_claims: schemaParity,
        source_state_files_match_bundled_claims: stateFileParity,
        source_commands_match_bundled_claims: commandParity,
        source_exclusions_match_bundled_claims: excludedCommandParity,
        source_write_boundary_matches_bundled_claims: writeBoundaryParity,
        shared_work_items_ledger_preserved: sharedLedgerParity,
        non_claim_work_items_commands_excluded: nonClaimExcluded,
        claim_contract_matches_bundled_claims: claimContractParity,
        close_contract_matches_bundled_claims: closeContractParity,
        claims_runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
        claims_runtime_bridge_commands_no_write: gate.boundary.claims_runtime_bridge_command_writes_files === false && gate.boundary.claims_runtime_bridge_check_command_writes_files === false,
        public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      runtime_bridge_resolution: resolved,
      source_claims_runtime_bridge_file: {
        path: result.runtime_bridge_file,
        present: result.runtime_bridge_file_present,
        status: bridgeFileStatus,
        schema: bridgeFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_claims_bundle_parity: {
        status: bundleParity.status,
        errors: bundleParity.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  function publicClaimsDomainSourceExtractionInstalledFallbackSmoke(root = packageRoot()) {
    const runtimeBridge = publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const context = sourceContext(root);
    const pkg = readJson(path.join(root, 'package.json'));
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const projectedPackFiles = packageJsonProjectedPackFiles(pkg).slice().sort();
    const sourceModuleRel = gate.source_module;
    const sourceModulePresent = fs.existsSync(path.join(root, sourceModuleRel));
    const sourceModuleInPack = expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel);
    const projectedInstalledRuntimeBridge = {
      context: 'installed_package',
      source_module_present: false,
      source_module: sourceModuleRel,
      mode: 'bundled_fallback',
      fallback_source: 'cli/agent-onboard.js',
      allowed_because_source_module_is_not_in_npm_pack: !sourceModuleInPack,
      shared_work_items_ledger_preserved: true,
      non_claim_work_items_commands_excluded: true
    };
    return {
      schema: 'agent-onboard-public-source-module-claims-installed-fallback-smoke-result-001',
      status: 'ok',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.command,
      check_command: gate.check_command,
      package_root: root,
      source_context: context,
      installed_fallback_smoke_file: gate.installed_fallback_smoke_file,
      installed_fallback_smoke_file_present: fs.existsSync(path.join(root, gate.installed_fallback_smoke_file)),
      source_module: sourceModuleRel,
      source_module_present: sourceModulePresent,
      projected_installed_runtime_bridge: projectedInstalledRuntimeBridge,
      observed: {
        claims_runtime_bridge_check_status: runtimeBridge.status,
        claims_runtime_bridge_resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
        package_surface_check_status: packageSurface.status,
        source_module_in_expected_pack_files: expectedPackFiles.includes(sourceModuleRel),
        source_module_in_projected_pack_files: projectedPackFiles.includes(sourceModuleRel),
        source_context_files_in_pack: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => projectedPackFiles.includes(rel))
      },
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      installed_fallback_contract: gate,
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

  function publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck(root = packageRoot()) {
    const result = publicClaimsDomainSourceExtractionInstalledFallbackSmoke(root);
    const runtimeBridge = publicClaimsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json'))).slice().sort();
    const gate = PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
    const sourceModuleRel = gate.source_module;
    const artifactPath = path.join(root, gate.installed_fallback_smoke_file);
    const context = sourceContext(root);
    const errors = [];
    if (gate.smoke_status !== 'claims_installed_fallback_smoke_admitted') errors.push('claims installed fallback smoke status must remain claims_installed_fallback_smoke_admitted');
    if (runtimeBridge.status !== 'ok') errors.push(...runtimeBridge.errors.map((error) => `claims runtime bridge: ${error}`));
    if (packageSurface.status !== 'ok') errors.push(...packageSurface.errors.map((error) => `package surface: ${error}`));
    if (PUBLIC_CLAIMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('claims runtime bridge must require installed-context fallback');
    if (gate.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('claims source modules must remain out of npm pack');
    if (gate.boundary.claims_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture --claims-installed-fallback-smoke must remain no-write');
    if (gate.boundary.claims_installed_fallback_check_command_writes_files !== false) errors.push('architecture --claims-installed-fallback-check must remain no-write');
    if (gate.boundary.keeps_shared_work_items_ledger !== true) errors.push('claims installed fallback must preserve the shared work-items ledger');
    if (gate.boundary.includes_non_claim_work_items_commands !== false) errors.push('claims installed fallback must keep non-claim work-items commands excluded');
    if (!arrayEquals(expectedPackFiles, projectedPackFiles)) errors.push('projected pack files must match the compact expected pack files');
    if (expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel)) errors.push(`${sourceModuleRel} must remain outside the npm package allowlist`);
    if (context.package_context === 'installed_package' && fs.existsSync(path.join(root, sourceModuleRel))) errors.push(`${sourceModuleRel} must be absent from installed package context`);
    if (context.package_context === 'installed_package' && runtimeBridge.runtime_bridge_resolution.mode !== 'bundled_fallback') errors.push('installed package claims runtime bridge must resolve through bundled_fallback');
    if (context.package_context === 'source_repository' && !fs.existsSync(artifactPath)) errors.push(`${gate.installed_fallback_smoke_file} must exist in source repository context`);
    let fileStatus = 'not_present_installed_context_allowed';
    let fileSchema = null;
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        fileSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${gate.installed_fallback_smoke_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== sourceModuleRel) errors.push(`${gate.installed_fallback_smoke_file} source_module must be ${sourceModuleRel}`);
        if (!artifact.projected_installed_context || artifact.projected_installed_context.runtime_bridge_resolution_mode !== 'bundled_fallback') errors.push(`${gate.installed_fallback_smoke_file} must declare bundled_fallback projected installed context`);
        if (!artifact.projected_installed_context || artifact.projected_installed_context.shared_work_items_ledger_remains_canonical !== true) errors.push(`${gate.installed_fallback_smoke_file} must preserve the shared work-items ledger`);
        if (!artifact.projected_installed_context || artifact.projected_installed_context.non_claim_work_items_commands_remain_excluded !== true) errors.push(`${gate.installed_fallback_smoke_file} must keep non-claim work-items commands excluded`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.installed_fallback_smoke_file} must preserve package_allowlist_unchanged`);
        fileStatus = 'present_validated';
      } catch (error) {
        fileStatus = 'present_invalid_json';
        errors.push(`${gate.installed_fallback_smoke_file} must be valid JSON: ${error.message}`);
      }
    }
    return {
      schema: 'agent-onboard-public-source-module-claims-installed-fallback-smoke-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      source_context: context,
      validated: {
        claims_runtime_bridge_check: runtimeBridge.status === 'ok',
        package_surface_check: packageSurface.status === 'ok',
        claims_installed_fallback_smoke_status: gate.smoke_status === 'claims_installed_fallback_smoke_admitted',
        source_module_out_of_pack: !expectedPackFiles.includes(sourceModuleRel) && !projectedPackFiles.includes(sourceModuleRel),
        projected_pack_allowlist_unchanged: arrayEquals(expectedPackFiles, projectedPackFiles),
        installed_context_uses_bundled_fallback: context.package_context === 'installed_package' ? runtimeBridge.runtime_bridge_resolution.mode === 'bundled_fallback' : result.projected_installed_runtime_bridge.mode === 'bundled_fallback',
        source_artifact_present_or_installed_context_allowed: fs.existsSync(artifactPath) || context.package_context === 'installed_package',
        shared_work_items_ledger_preserved: gate.boundary.keeps_shared_work_items_ledger === true && result.projected_installed_runtime_bridge.shared_work_items_ledger_preserved === true,
        non_claim_work_items_commands_excluded: gate.boundary.includes_non_claim_work_items_commands === false && result.projected_installed_runtime_bridge.non_claim_work_items_commands_excluded === true,
        installed_fallback_commands_no_write: gate.boundary.claims_installed_fallback_smoke_command_writes_files === false && gate.boundary.claims_installed_fallback_check_command_writes_files === false,
        package_allowlist_unchanged: gate.boundary.package_allowlist_unchanged === true
      },
      observed: result.observed,
      runtime_bridge: {
        status: runtimeBridge.status,
        resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
        source_module_present: runtimeBridge.runtime_bridge_resolution.source_module_present
      },
      source_claims_installed_fallback_file: {
        path: gate.installed_fallback_smoke_file,
        present: fs.existsSync(artifactPath),
        status: fs.existsSync(artifactPath) ? fileStatus : (context.package_context === 'installed_package' ? 'not_present_installed_context_allowed' : 'missing'),
        schema: fileSchema,
        source_context_required: true
      },
      projected_installed_runtime_bridge: result.projected_installed_runtime_bridge,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }

  return Object.freeze({
    publicClaimsDomainSourceExtractionPlan,
    publicClaimsDomainSourceExtractionPlanCheck,
    loadClaimsFirstSliceModule,
    publicClaimsDomainSourceExtractionFirstSlice,
    publicClaimsDomainSourceExtractionFirstSliceCheck,
    bundledClaimsDomainForParity,
    publicClaimsDomainSourceExtractionBundleParity,
    publicClaimsDomainSourceExtractionBundleParityCheck,
    resolveClaimsDomainRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmoke,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureClaimsSourceDomainService
});
