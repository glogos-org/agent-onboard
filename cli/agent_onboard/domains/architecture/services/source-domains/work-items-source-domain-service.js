'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureWorkItemsSourceDomainService(deps) {
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
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureWorkItemsSourceDomainService missing dependency: ${name}`);
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

  function loadWorkItemsFirstSliceModule(root = packageRoot()) {
    const modulePath = path.join(root, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.source_module);
    if (!fs.existsSync(modulePath)) return null;
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
    return require(resolved);
  }

  function publicWorkItemsDomainSourceExtractionFirstSlice(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    let module_exports = [];
    let module_value = null;
    let module_load_error = null;
    try {
      const loaded = loadWorkItemsFirstSliceModule(root);
      if (loaded) {
        module_exports = Object.keys(loaded).sort();
        if (typeof loaded.getWorkItemsDomainFirstSlice === 'function') {
          module_value = loaded.getWorkItemsDomainFirstSlice();
        } else if (loaded.WORK_ITEMS_DOMAIN_FIRST_SLICE) {
          module_value = loaded.WORK_ITEMS_DOMAIN_FIRST_SLICE;
        }
      }
    } catch (error) {
      module_load_error = error && error.message ? error.message : String(error);
    }
    return {
      schema: 'agent-onboard-public-source-module-work-items-first-slice-result-001',
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
      work_items_first_slice: gate,
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

  function publicWorkItemsDomainSourceExtractionFirstSliceCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionFirstSlice(root);
    const plan = publicWorkItemsDomainSourceExtractionPlanCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE;
    const expectedExports = gate.expected_module_export_names.slice().sort();
    const errors = [];
    if (plan.status !== 'ok') errors.push(...plan.errors.map((error) => `work-items plan: ${error}`));
    if (result.status !== 'ok') errors.push(`work-items first-slice module load failed: ${result.source_module_load_error}`);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.first_slice_status !== 'source_only_shadow_module_applied') errors.push('work-items first-slice status must be source_only_shadow_module_applied');
    if (gate.extracted_domain.id !== 'work_items') errors.push('work-items first-slice must extract the work_items domain');
    if (gate.boundary.created_source_module !== 'src/domains/work-items.js') errors.push('work-items first-slice created source module must be src/domains/work-items.js');
    if (gate.boundary.creates_exactly_one_source_module !== true) errors.push('work-items first-slice must create exactly one source module');
    if (gate.boundary.excludes_claim_and_close_commands !== true) errors.push('work-items first-slice must exclude claim and close commands');
    if (gate.boundary.moves_existing_source_files !== false) errors.push('work-items first-slice must not move existing source files');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('work-items first-slice must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('work-items first-slice must not make CLI runtime require source modules');
    if (gate.boundary.exports_source_module_as_public_api !== false) errors.push('work-items first-slice must not expose source module as public import API');
    if (gate.boundary.work_items_first_slice_command_writes_files !== false) errors.push('architecture --work-items-first-slice must remain no-write');
    if (gate.boundary.work_items_first_slice_check_command_writes_files !== false) errors.push('architecture --work-items-first-slice-check must remain no-write');

    let artifactStatus = 'not_present_installed_context_allowed';
    let artifactSchema = null;
    if (result.first_slice_file_present) {
      try {
        const artifact = readJson(path.join(root, result.first_slice_file));
        artifactSchema = artifact.schema || null;
        if (artifact.schema !== gate.schema) errors.push(`${result.first_slice_file} schema must be ${gate.schema}`);
        if (artifact.source_module !== gate.source_module) errors.push(`${result.first_slice_file} source_module must be ${gate.source_module}`);
        if (!artifact.extracted_domain || artifact.extracted_domain.id !== 'work_items') errors.push(`${result.first_slice_file} must declare extracted_domain.id work_items`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${result.first_slice_file} must preserve package_allowlist_unchanged`);
        if (!artifact.boundary || artifact.boundary.excludes_claim_and_close_commands !== true) errors.push(`${result.first_slice_file} must exclude claim and close commands`);
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
      if (moduleValue.schema !== gate.schema) errors.push(`${result.source_module} must export work-items first-slice schema`);
      if (moduleValue.domain !== 'work_items') errors.push(`${result.source_module} domain must be work_items`);
      if (moduleValue.facade !== 'workItemsService') errors.push(`${result.source_module} facade must be workItemsService`);
      if (moduleValue.source_module !== result.source_module) errors.push(`${result.source_module} source_module field must match its path`);
      if (moduleValue.runtime_dependency_status !== gate.extracted_domain.runtime_dependency_status) errors.push(`${result.source_module} runtime dependency status must remain source-only shadow`);
      if (moduleValue.exports_public_api !== false) errors.push(`${result.source_module} must not declare public import API`);
      if (moduleValue.includes_claims_domain_behavior !== false) errors.push(`${result.source_module} must exclude claims-domain behavior`);
      if (moduleValue.writes_files !== false || moduleValue.state_writer !== false) errors.push(`${result.source_module} must remain read-only and non-state-writer`);
      if (moduleValue.declares_explicit_write_boundaries !== true) errors.push(`${result.source_module} must declare explicit write boundaries for write-capable work-items commands`);
      if (!arrayEquals((moduleValue.owns_commands || []), gate.expected_owned_commands.slice())) errors.push(`${result.source_module} owns_commands must match work-items first-slice scope`);
      if (!arrayEquals((moduleValue.excluded_commands || []), gate.excluded_commands.slice())) errors.push(`${result.source_module} excluded_commands must keep claim and close out of this slice`);
      sourceModuleStatus = 'present_validated';
    } else if (result.package_context === 'source_repository') {
      sourceModuleStatus = 'missing_source_context';
      errors.push(`${result.source_module} must be present in source repository context`);
    }

    return {
      schema: 'agent-onboard-public-source-module-work-items-first-slice-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        work_items_plan: plan.status === 'ok',
        first_slice_status: gate.first_slice_status === 'source_only_shadow_module_applied',
        extracted_domain_is_work_items: gate.extracted_domain.id === 'work_items',
        source_module_present_or_installed_context_allowed: sourceModuleStatus === 'present_validated' || sourceModuleStatus === 'not_present_installed_context_allowed',
        first_slice_file_present_or_installed_context_allowed: artifactStatus === 'present_validated' || artifactStatus === 'not_present_installed_context_allowed',
        claim_and_close_commands_excluded: moduleValue.includes_claims_domain_behavior === false || sourceModuleStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.work_items_first_slice_command_writes_files === false && gate.boundary.work_items_first_slice_check_command_writes_files === false,
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
      prerequisite_work_items_plan: {
        status: plan.status,
        errors: plan.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  function bundledWorkItemsDomainForParity(root = packageRoot()) {
    const map = publicArchitectureMap(root);
    const facade = PUBLIC_DOMAIN_SERVICE_FACADES.facades.find((item) => item.id === 'work_items');
    const domain = map.map.canonical_domains.find((item) => item.id === 'work_items');
    return {
      schema: 'agent-onboard-public-bundled-work-items-domain-view-001',
      domain: domain ? domain.id : null,
      facade: facade ? facade.service : null,
      service: facade ? facade.service : null,
      source: 'cli/agent-onboard.js',
      owns_commands: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.expected_owned_commands.slice(),
      excluded_commands: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_FIRST_SLICE.excluded_commands.slice(),
      writes_files: false,
      state_writer: false,
      declares_explicit_write_boundaries: true,
      schema_id: 'agent-onboard-target-work-items-001',
      state_files: Object.freeze(['.agent-onboard/work-items.json']).slice(),
      read_surfaces: Object.freeze(['schema', 'template', 'validate-template', 'validate', 'list']).slice(),
      explicit_write_surfaces: Object.freeze([
        'work-items --init --write [--force]',
        'work-items --append --write --id <public-work-item-id> --title <title>'
      ]).slice(),
      package_context: sourceContext(root).package_context
    };
  }

  function publicWorkItemsDomainSourceExtractionBundleParity(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const firstSlice = publicWorkItemsDomainSourceExtractionFirstSlice(root);
    const bundledWorkItems = bundledWorkItemsDomainForParity(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    return {
      schema: 'agent-onboard-public-source-module-work-items-bundle-parity-result-001',
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
      bundled_work_items_view: bundledWorkItems,
      work_items_bundle_parity: gate,
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

  function publicWorkItemsDomainSourceExtractionBundleParityCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionBundleParity(root);
    const firstSlice = publicWorkItemsDomainSourceExtractionFirstSliceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_BUNDLE_PARITY;
    const errors = [];
    if (firstSlice.status !== 'ok') errors.push(...firstSlice.errors.map((error) => `work-items first slice: ${error}`));
    if (result.status !== 'ok') errors.push('work-items bundle parity depends on a loadable first-slice source module in source context or installed fallback metadata');
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.parity_status !== 'work_items_source_slice_matches_bundled_cli_view') errors.push('work-items bundle parity status must remain work_items_source_slice_matches_bundled_cli_view');
    if (gate.boundary.work_items_bundle_parity_command_writes_files !== false) errors.push('architecture --work-items-bundle-parity must remain no-write');
    if (gate.boundary.work_items_bundle_parity_check_command_writes_files !== false) errors.push('architecture --work-items-bundle-parity-check must remain no-write');
    if (gate.boundary.creates_bundle_artifact !== false) errors.push('work-items bundle parity gate must not create bundle artifacts');
    if (gate.boundary.changes_public_cli_outputs !== false) errors.push('work-items bundle parity gate must not change public CLI outputs');
    if (gate.boundary.changes_cli_runtime_dependency_graph !== false) errors.push('work-items bundle parity gate must not change CLI runtime dependency graph');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items bundle parity gate must keep claim and close excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('work-items bundle parity gate must preserve package allowlist');

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
        if (!artifact.boundary || artifact.boundary.includes_claim_and_close_commands !== false) errors.push(`${result.bundle_parity_file} must keep claim and close excluded`);
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
    const bundled = result.bundled_work_items_view;
    const sourceContextAllowedMissing = result.package_context === 'installed_package' && !sourceSlice;
    const domainParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.domain === bundled.domain);
    const facadeParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.facade === bundled.facade);
    const schemaParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.schema_id === bundled.schema_id);
    const stateFileParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.state_files || [], bundled.state_files));
    const commandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.owns_commands || [], bundled.owns_commands));
    const excludedCommandParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.excluded_commands || [], bundled.excluded_commands));
    const readSurfaceParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.read_surfaces || [], bundled.read_surfaces));
    const explicitWriteSurfaceParity = sourceContextAllowedMissing || (sourceSlice && arrayEquals(sourceSlice.explicit_write_surfaces || [], bundled.explicit_write_surfaces));
    const writeBoundaryParity = sourceContextAllowedMissing || (sourceSlice && sourceSlice.writes_files === bundled.writes_files && sourceSlice.state_writer === bundled.state_writer && sourceSlice.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    if (!domainParity) errors.push('work-items source slice domain must match bundled work-items domain view');
    if (!facadeParity) errors.push('work-items source slice facade must match bundled work-items facade view');
    if (!schemaParity) errors.push('work-items source slice schema id must match bundled work-items schema id');
    if (!stateFileParity) errors.push('work-items source slice state files must match bundled work-items state files');
    if (!commandParity) errors.push('work-items source slice owned commands must match bundled work-items command surface');
    if (!excludedCommandParity) errors.push('work-items source slice excluded commands must match bundled work-items exclusions');
    if (!readSurfaceParity) errors.push('work-items source slice read surfaces must match bundled work-items read surfaces');
    if (!explicitWriteSurfaceParity) errors.push('work-items source slice explicit write surfaces must match bundled work-items write-boundary metadata');
    if (!writeBoundaryParity) errors.push('work-items source slice read/write boundary must match bundled work-items view');

    return {
      schema: 'agent-onboard-public-source-module-work-items-bundle-parity-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        first_slice: firstSlice.status === 'ok',
        bundle_parity_status: gate.parity_status === 'work_items_source_slice_matches_bundled_cli_view',
        source_slice_domain_matches_bundled_work_items: domainParity,
        source_slice_facade_matches_bundled_work_items: facadeParity,
        source_slice_schema_matches_bundled_work_items: schemaParity,
        source_slice_state_files_match_bundled_work_items: stateFileParity,
        source_slice_commands_match_bundled_work_items: commandParity,
        source_slice_exclusions_match_bundled_work_items: excludedCommandParity,
        source_slice_read_surfaces_match_bundled_work_items: readSurfaceParity,
        source_slice_write_surfaces_match_bundled_work_items: explicitWriteSurfaceParity,
        source_slice_write_boundary_matches_bundled_work_items: writeBoundaryParity,
        source_module_present_or_installed_context_allowed: result.source_module_present || result.package_context === 'installed_package',
        bundle_parity_file_present_or_installed_context_allowed: bundleParityFileStatus === 'present_validated' || bundleParityFileStatus === 'not_present_installed_context_allowed',
        commands_no_write: gate.boundary.work_items_bundle_parity_command_writes_files === false && gate.boundary.work_items_bundle_parity_check_command_writes_files === false,
        runtime_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
        claim_and_close_commands_excluded: excludedCommandParity
      },
      source_slice: result.source_slice_value,
      bundled_work_items_view: result.bundled_work_items_view,
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



  function resolveWorkItemsDomainRuntimeBridge(root = packageRoot()) {
    const context = sourceContext(root);
    const modulePath = path.join(root, PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module);
    const sourceModulePresent = fs.existsSync(modulePath);
    const bundledWorkItems = bundledWorkItemsDomainForParity(root);
    if (sourceModulePresent) {
      try {
        const loaded = require(modulePath);
        const value = loaded && typeof loaded.getWorkItemsDomainFirstSlice === 'function'
          ? loaded.getWorkItemsDomainFirstSlice()
          : loaded && loaded.WORK_ITEMS_DOMAIN_FIRST_SLICE;
        if (!value || value.schema !== 'agent-onboard-public-source-module-work-items-first-slice-001') {
          return {
            status: 'error',
            context: context.package_context,
            mode: 'source_module_invalid',
            source_module_present: true,
            source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
            module_value: value || null,
            bundled_work_items_view: bundledWorkItems,
            errors: [`${PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} did not export a valid work-items first-slice contract`]
          };
        }
        return {
          status: 'ok',
          context: context.package_context,
          mode: 'source_module_loaded',
          source_module_present: true,
          source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: value,
          bundled_work_items_view: bundledWorkItems,
          errors: []
        };
      } catch (error) {
        return {
          status: 'error',
          context: context.package_context,
          mode: 'source_module_load_failed',
          source_module_present: true,
          source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
          module_value: null,
          bundled_work_items_view: bundledWorkItems,
          errors: [`${PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module} failed to load: ${error && error.message ? error.message : String(error)}`]
        };
      }
    }
    return {
      status: 'ok',
      context: context.package_context,
      mode: 'bundled_fallback',
      source_module_present: false,
      source_module: PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.source_module,
      module_value: null,
      bundled_work_items_view: bundledWorkItems,
      errors: []
    };
  }

  function publicWorkItemsDomainSourceExtractionRuntimeBridge(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const context = sourceContext(root);
    const bridge = resolveWorkItemsDomainRuntimeBridge(root);
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    return {
      schema: 'agent-onboard-public-source-module-work-items-runtime-bridge-result-001',
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

  function publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionRuntimeBridge(root);
    const bundleParity = publicWorkItemsDomainSourceExtractionBundleParityCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE;
    const errors = [];
    if (bundleParity.status !== 'ok') errors.push(...bundleParity.errors.map((error) => `work-items bundle parity: ${error}`));
    if (result.runtime_bridge_resolution.status !== 'ok') errors.push(...result.runtime_bridge_resolution.errors);
    if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);
    if (gate.bridge_status !== 'work_items_source_context_optional_runtime_bridge_applied') errors.push('work-items runtime bridge status must remain work_items_source_context_optional_runtime_bridge_applied');
    if (gate.boundary.work_items_runtime_bridge_command_writes_files !== false) errors.push('architecture --work-items-runtime-bridge must remain no-write');
    if (gate.boundary.work_items_runtime_bridge_check_command_writes_files !== false) errors.push('architecture --work-items-runtime-bridge-check must remain no-write');
    if (gate.boundary.source_context_optional_require_only !== true) errors.push('work-items runtime bridge must use source-context optional require only');
    if (gate.boundary.installed_context_fallback_required !== true) errors.push('work-items runtime bridge must preserve installed-package fallback');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items runtime bridge must keep claim and close excluded');
    if (gate.boundary.package_allowlist_unchanged !== true) errors.push('work-items runtime bridge gate must preserve package allowlist');

    let bridgeFileStatus = 'not_present_installed_context_allowed';
    let bridgeFileSchema = null;
    if (result.runtime_bridge_file_present) {
      try {
        const bridgeFile = readJson(path.join(root, result.runtime_bridge_file));
        bridgeFileSchema = bridgeFile.schema || null;
        if (bridgeFile.schema !== gate.schema) errors.push(`${result.runtime_bridge_file} schema must be ${gate.schema}`);
        if (bridgeFile.source_module !== gate.source_module) errors.push(`${result.runtime_bridge_file} source_module must be ${gate.source_module}`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.installed_context_allows_missing_source_module !== true) errors.push(`${result.runtime_bridge_file} must allow installed context fallback`);
        if (!bridgeFile.runtime_bridge || bridgeFile.runtime_bridge.includes_claim_and_close_commands !== false) errors.push(`${result.runtime_bridge_file} must keep claim and close excluded`);
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
    const bundled = resolved.bundled_work_items_view;
    const domainParity = !source || source.domain === bundled.domain;
    const facadeParity = !source || source.facade === bundled.facade;
    const schemaParity = !source || source.schema_id === bundled.schema_id;
    const stateFileParity = !source || arrayEquals(source.state_files || [], bundled.state_files);
    const commandParity = !source || arrayEquals(source.owns_commands || [], bundled.owns_commands);
    const excludedCommandParity = !source || arrayEquals(source.excluded_commands || [], bundled.excluded_commands);
    const readSurfaceParity = !source || arrayEquals(source.read_surfaces || [], bundled.read_surfaces);
    const explicitWriteSurfaceParity = !source || arrayEquals(source.explicit_write_surfaces || [], bundled.explicit_write_surfaces);
    const writeBoundaryParity = !source || (source.writes_files === bundled.writes_files && source.state_writer === bundled.state_writer && source.declares_explicit_write_boundaries === bundled.declares_explicit_write_boundaries);
    const claimCloseExcluded = !source || (source.includes_claims_domain_behavior === false && arrayEquals(source.excluded_commands || [], bundled.excluded_commands));

    if (!sourceLoadedWhenPresent) errors.push('work-items runtime bridge must load the source work-items slice when present in source repository context');
    if (!fallbackWhenMissing) errors.push('work-items runtime bridge must fall back to bundled work-items view when source module is missing');
    if (!domainParity) errors.push('work-items runtime bridge source domain must match bundled work-items domain');
    if (!facadeParity) errors.push('work-items runtime bridge source facade must match bundled work-items facade');
    if (!schemaParity) errors.push('work-items runtime bridge source schema id must match bundled work-items schema id');
    if (!stateFileParity) errors.push('work-items runtime bridge source state files must match bundled work-items state files');
    if (!commandParity) errors.push('work-items runtime bridge source commands must match bundled work-items commands');
    if (!excludedCommandParity) errors.push('work-items runtime bridge source excluded commands must match bundled work-items exclusions');
    if (!readSurfaceParity) errors.push('work-items runtime bridge source read surfaces must match bundled work-items read surfaces');
    if (!explicitWriteSurfaceParity) errors.push('work-items runtime bridge source explicit write surfaces must match bundled work-items surfaces');
    if (!writeBoundaryParity) errors.push('work-items runtime bridge source write boundary must match bundled work-items view');
    if (!claimCloseExcluded) errors.push('work-items runtime bridge must keep claim and close behavior excluded');

    return {
      schema: 'agent-onboard-public-source-module-work-items-runtime-bridge-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      validated: {
        work_items_bundle_parity: bundleParity.status === 'ok',
        work_items_runtime_bridge_status: gate.bridge_status === 'work_items_source_context_optional_runtime_bridge_applied',
        source_module_loaded_when_present: sourceLoadedWhenPresent,
        bundled_fallback_when_source_missing: fallbackWhenMissing || installedFallbackAllowed,
        installed_context_fallback_allowed: result.package_context === 'installed_package' ? resolved.mode === 'bundled_fallback' || resolved.mode === 'source_module_loaded' : true,
        source_domain_matches_bundled_work_items: domainParity,
        source_facade_matches_bundled_work_items: facadeParity,
        source_schema_matches_bundled_work_items: schemaParity,
        source_state_files_match_bundled_work_items: stateFileParity,
        source_commands_match_bundled_work_items: commandParity,
        source_exclusions_match_bundled_work_items: excludedCommandParity,
        source_read_surfaces_match_bundled_work_items: readSurfaceParity,
        source_write_surfaces_match_bundled_work_items: explicitWriteSurfaceParity,
        source_write_boundary_matches_bundled_work_items: writeBoundaryParity,
        claim_and_close_commands_excluded: claimCloseExcluded,
        work_items_runtime_bridge_file_present_or_installed_context_allowed: bridgeFileStatus === 'present_validated' || bridgeFileStatus === 'not_present_installed_context_allowed',
        work_items_runtime_bridge_commands_no_write: gate.boundary.work_items_runtime_bridge_command_writes_files === false && gate.boundary.work_items_runtime_bridge_check_command_writes_files === false,
        public_cli_outputs_unchanged_by_gate: gate.boundary.changes_public_cli_outputs === false,
        cli_runtime_dependency_graph_unchanged: gate.boundary.changes_cli_runtime_dependency_graph === false,
        package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles)
      },
      runtime_bridge_resolution: resolved,
      source_work_items_runtime_bridge_file: {
        path: result.runtime_bridge_file,
        present: result.runtime_bridge_file_present,
        status: bridgeFileStatus,
        schema: bridgeFileSchema,
        source_context_required: result.package_context === 'source_repository'
      },
      prerequisite_work_items_bundle_parity: {
        status: bundleParity.status,
        errors: bundleParity.errors
      },
      projected_pack_files: result.projected_pack_files,
      expected_pack_files: expectedPackFiles,
      boundary: result.boundary,
      errors
    };
  }


  function publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke(root = packageRoot()) {
    const runtimeBridge = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const context = sourceContext(root);
    const pkg = readJson(path.join(root, 'package.json'));
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
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
      claim_and_close_commands_excluded: true
    };
    return {
      schema: 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-result-001',
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
        work_items_runtime_bridge_check_status: runtimeBridge.status,
        work_items_runtime_bridge_resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
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

  function publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck(root = packageRoot()) {
    const result = publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke(root);
    const runtimeBridge = publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck(root);
    const packageSurface = publicPackageSurfaceCheck(root);
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const projectedPackFiles = packageJsonProjectedPackFiles(readJson(path.join(root, 'package.json'))).slice().sort();
    const gate = PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_INSTALLED_FALLBACK_SMOKE;
    const sourceModuleRel = gate.source_module;
    const artifactPath = path.join(root, gate.installed_fallback_smoke_file);
    const context = sourceContext(root);
    const errors = [];
    if (gate.smoke_status !== 'work_items_installed_fallback_smoke_admitted') errors.push('work-items installed fallback smoke status must remain work_items_installed_fallback_smoke_admitted');
    if (runtimeBridge.status !== 'ok') errors.push(...runtimeBridge.errors.map((error) => `work-items runtime bridge: ${error}`));
    if (packageSurface.status !== 'ok') errors.push(...packageSurface.errors.map((error) => `package surface: ${error}`));
    if (PUBLIC_WORK_ITEMS_DOMAIN_SOURCE_EXTRACTION_RUNTIME_BRIDGE.boundary.installed_context_fallback_required !== true) errors.push('work-items runtime bridge must require installed-context fallback');
    if (gate.boundary.source_modules_remain_out_of_npm_pack !== true) errors.push('work-items source modules must remain out of npm pack');
    if (gate.boundary.work_items_installed_fallback_smoke_command_writes_files !== false) errors.push('architecture --work-items-installed-fallback-smoke must remain no-write');
    if (gate.boundary.work_items_installed_fallback_check_command_writes_files !== false) errors.push('architecture --work-items-installed-fallback-check must remain no-write');
    if (gate.boundary.includes_claim_and_close_commands !== false) errors.push('work-items installed fallback must keep claim and close excluded');
    if (!arrayEquals(expectedPackFiles, projectedPackFiles)) errors.push('projected pack files must match the compact expected pack files');
    if (expectedPackFiles.includes(sourceModuleRel) || projectedPackFiles.includes(sourceModuleRel)) errors.push(`${sourceModuleRel} must remain outside the npm package allowlist`);
    if (context.package_context === 'installed_package' && fs.existsSync(path.join(root, sourceModuleRel))) errors.push(`${sourceModuleRel} must be absent from installed package context`);
    if (context.package_context === 'installed_package' && runtimeBridge.runtime_bridge_resolution.mode !== 'bundled_fallback') errors.push('installed package work-items runtime bridge must resolve through bundled_fallback');
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
        if (!artifact.projected_installed_context || artifact.projected_installed_context.claim_and_close_commands_remain_excluded !== true) errors.push(`${gate.installed_fallback_smoke_file} must keep claim and close excluded`);
        if (!artifact.boundary || artifact.boundary.package_allowlist_unchanged !== true) errors.push(`${gate.installed_fallback_smoke_file} must preserve package_allowlist_unchanged`);
        fileStatus = 'present_validated';
      } catch (error) {
        fileStatus = 'present_invalid_json';
        errors.push(`${gate.installed_fallback_smoke_file} must be valid JSON: ${error.message}`);
      }
    }
    return {
      schema: 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: gate.package_name,
      version: VERSION,
      release_line: gate.release_line,
      command: gate.check_command,
      package_root: root,
      source_context: context,
      validated: {
        work_items_runtime_bridge_check: runtimeBridge.status === 'ok',
        package_surface_check: packageSurface.status === 'ok',
        work_items_installed_fallback_smoke_status: gate.smoke_status === 'work_items_installed_fallback_smoke_admitted',
        source_module_out_of_pack: !expectedPackFiles.includes(sourceModuleRel) && !projectedPackFiles.includes(sourceModuleRel),
        projected_pack_allowlist_unchanged: arrayEquals(expectedPackFiles, projectedPackFiles),
        installed_context_uses_bundled_fallback: context.package_context === 'installed_package' ? runtimeBridge.runtime_bridge_resolution.mode === 'bundled_fallback' : result.projected_installed_runtime_bridge.mode === 'bundled_fallback',
        source_artifact_present_or_installed_context_allowed: fs.existsSync(artifactPath) || context.package_context === 'installed_package',
        claim_and_close_commands_excluded: gate.boundary.includes_claim_and_close_commands === false && result.projected_installed_runtime_bridge.claim_and_close_commands_excluded === true,
        installed_fallback_commands_no_write: gate.boundary.work_items_installed_fallback_smoke_command_writes_files === false && gate.boundary.work_items_installed_fallback_check_command_writes_files === false,
        package_allowlist_unchanged: gate.boundary.package_allowlist_unchanged === true
      },
      observed: result.observed,
      runtime_bridge: {
        status: runtimeBridge.status,
        resolution_mode: runtimeBridge.runtime_bridge_resolution.mode,
        source_module_present: runtimeBridge.runtime_bridge_resolution.source_module_present
      },
      source_work_items_installed_fallback_file: {
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
    publicWorkItemsDomainSourceExtractionPlan,
    publicWorkItemsDomainSourceExtractionPlanCheck,
    loadWorkItemsFirstSliceModule,
    publicWorkItemsDomainSourceExtractionFirstSlice,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    bundledWorkItemsDomainForParity,
    publicWorkItemsDomainSourceExtractionBundleParity,
    publicWorkItemsDomainSourceExtractionBundleParityCheck,
    resolveWorkItemsDomainRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainService
});
