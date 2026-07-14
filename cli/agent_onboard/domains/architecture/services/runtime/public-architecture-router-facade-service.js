'use strict';

const fs = require('fs');
const path = require('path');

function createPublicArchitectureRouterFacadeService(deps) {
  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicCommandRouter: PUBLIC_COMMAND_ROUTER,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceDomainModulePartitionPlan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_ARCHITECTURE_MAP,
    PUBLIC_COMMAND_ROUTER,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureRouterFacadeService missing dependency: ${name}`);
  }

function publicCommandRouter(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const commands = PUBLIC_COMMAND_ROUTER.routes.map((route) => route.command);
  return {
    schema: 'agent-onboard-public-command-router-result-001',
    status: 'ok',
    package_name: PUBLIC_COMMAND_ROUTER.package_name,
    version: VERSION,
    release_line: PUBLIC_COMMAND_ROUTER.release_line,
    command: PUBLIC_COMMAND_ROUTER.command,
    check_command: PUBLIC_COMMAND_ROUTER.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    package_json_version: pkg.version,
    router: PUBLIC_COMMAND_ROUTER,
    route_count: commands.length,
    route_commands: commands,
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

function publicCommandRouterCheck(root = packageRoot()) {
  const router = publicCommandRouter(root);
  const expectedCommands = ['help', 'version', 'status', 'init', 'agents', 'guard', 'authority', 'architecture', 'release', 'target-config', 'work-items', 'target', 'target-instance'];
  const expectedDomains = PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id);
  const routeCommands = router.route_commands;
  const routeDomains = router.router.routes.map((route) => route.domain);
  const errors = [];
  if (!arrayEquals(routeCommands, expectedCommands)) errors.push(`command router route order must be ${expectedCommands.join(', ')}`);
  if (new Set(routeCommands).size !== routeCommands.length) errors.push('command router route commands must be unique');
  for (const domain of routeDomains) {
    if (!expectedDomains.includes(domain)) errors.push(`command router route domain is not canonical: ${domain}`);
  }
  if (router.router.dispatch_mode !== 'table_driven_top_level_router') errors.push('command router dispatch_mode must be table_driven_top_level_router');
  if (router.router.dispatcher !== 'dispatchCommand') errors.push('command router dispatcher must be dispatchCommand');
  if (router.router.boundary.router_command_writes_files !== false) errors.push('architecture router command must remain no-write');
  if (router.router.boundary.unsupported_commands_fail_closed !== true) errors.push('unsupported commands must fail closed');
  const targetRoute = router.router.routes.find((route) => route.command === 'target');
  const expectedTargetNestedCommands = ['runtime', 'metadata', 'onboarding', 'bootstrap'];
  if (!targetRoute || !arrayEquals(targetRoute.nested_commands.slice(), expectedTargetNestedCommands)) errors.push(`target nested route boundary must declare ${expectedTargetNestedCommands.join(', ')}`);
  return {
    schema: 'agent-onboard-public-command-router-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_COMMAND_ROUTER.package_name,
    version: VERSION,
    release_line: PUBLIC_COMMAND_ROUTER.release_line,
    command: PUBLIC_COMMAND_ROUTER.check_command,
    package_root: root,
    validated: {
      route_count: router.route_count === expectedCommands.length,
      route_order: arrayEquals(routeCommands, expectedCommands),
      route_commands_unique: new Set(routeCommands).size === routeCommands.length,
      canonical_route_domains: routeDomains.every((domain) => expectedDomains.includes(domain)),
      route_facades_declared: router.router.routes.every((route) => typeof route.facade === 'string' && route.facade.length > 0),
      table_driven_dispatch: router.router.dispatch_mode === 'table_driven_top_level_router',
      dispatcher_boundary: router.router.dispatcher === 'dispatchCommand',
      router_command_no_write: router.router.boundary.router_command_writes_files === false,
      unsupported_commands_fail_closed: router.router.boundary.unsupported_commands_fail_closed === true,
      nested_target_routes_explicit: !!targetRoute && arrayEquals(targetRoute.nested_commands.slice(), expectedTargetNestedCommands)
    },
    expected_route_commands: expectedCommands,
    route_commands: routeCommands,
    route_domains: routeDomains,
    route_facades: router.router.routes.map((route) => route.facade),
    boundary: router.boundary,
    errors
  };
}

function publicDomainServiceFacades(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const facadeIds = PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => facade.id);
  return {
    schema: 'agent-onboard-public-domain-service-facades-result-001',
    status: 'ok',
    package_name: PUBLIC_DOMAIN_SERVICE_FACADES.package_name,
    version: VERSION,
    release_line: PUBLIC_DOMAIN_SERVICE_FACADES.release_line,
    command: PUBLIC_DOMAIN_SERVICE_FACADES.command,
    check_command: PUBLIC_DOMAIN_SERVICE_FACADES.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    package_json_version: pkg.version,
    facades: PUBLIC_DOMAIN_SERVICE_FACADES,
    facade_ids: facadeIds,
    service_names: PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => facade.service),
    router_routes: PUBLIC_COMMAND_ROUTER.routes.map((route) => ({
      command: route.command,
      domain: route.domain,
      facade: route.facade,
      handler: route.handler,
      writes_files: route.writes_files
    })),
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

function publicDomainServiceFacadesCheck(root = packageRoot()) {
  const result = publicDomainServiceFacades(root);
  const expectedDomains = PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id);
  const facadeIds = result.facade_ids;
  const serviceNames = result.service_names;
  const serviceByDomain = new Map(PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => [facade.id, facade.service]));
  const errors = [];
  if (!arrayEquals(facadeIds, expectedDomains)) errors.push(`domain service facade order must be ${expectedDomains.join(', ')}`);
  if (new Set(facadeIds).size !== facadeIds.length) errors.push('domain service facade ids must be unique');
  if (new Set(serviceNames).size !== serviceNames.length) errors.push('domain service names must be unique');
  if (result.facades.boundary.facades_command_writes_files !== false) errors.push('architecture facades command must remain no-write');
  for (const route of result.router_routes) {
    if (!route.facade) errors.push(`route ${route.command} must declare a domain service facade`);
    if (!serviceByDomain.has(route.domain)) errors.push(`route ${route.command} domain is not backed by a public facade: ${route.domain}`);
    if (serviceByDomain.has(route.domain) && route.facade !== serviceByDomain.get(route.domain)) errors.push(`route ${route.command} facade must be ${serviceByDomain.get(route.domain)}`);
  }
  return {
    schema: 'agent-onboard-public-domain-service-facades-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_DOMAIN_SERVICE_FACADES.package_name,
    version: VERSION,
    release_line: PUBLIC_DOMAIN_SERVICE_FACADES.release_line,
    command: PUBLIC_DOMAIN_SERVICE_FACADES.check_command,
    package_root: root,
    validated: {
      facade_count: facadeIds.length === expectedDomains.length,
      facade_order: arrayEquals(facadeIds, expectedDomains),
      facade_ids_unique: new Set(facadeIds).size === facadeIds.length,
      service_names_unique: new Set(serviceNames).size === serviceNames.length,
      facades_command_no_write: result.facades.boundary.facades_command_writes_files === false,
      every_route_declares_facade: result.router_routes.every((route) => typeof route.facade === 'string' && route.facade.length > 0),
      route_facades_match_domains: result.router_routes.every((route) => serviceByDomain.has(route.domain) && route.facade === serviceByDomain.get(route.domain))
    },
    expected_domain_ids: expectedDomains,
    facade_ids: facadeIds,
    service_names: serviceNames,
    router_routes: result.router_routes,
    boundary: result.boundary,
    errors
  };
}


function publicSourceDomainModulePartitionPlan(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const context = sourceContext(root);
  const planFile = PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.plan_file;
  const planFilePath = path.join(root, planFile);
  return {
    schema: 'agent-onboard-public-source-domain-module-partition-plan-result-001',
    status: 'ok',
    package_name: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.release_line,
    command: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.command,
    check_command: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.check_command,
    package_root: root,
    package_context: context.package_context,
    package_json_version: pkg.version,
    plan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    plan_file: planFile,
    plan_file_present: fs.existsSync(planFilePath),
    canonical_domain_ids: PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id),
    facade_ids: PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => facade.id),
    projected_pack_files: packageJsonProjectedPackFiles(pkg),
    boundary: {
      writes_files: false,
      moves_source_files: false,
      creates_source_modules: false,
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

function plainClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function publicSourceDomainModulePartitionPlanCheck(root = packageRoot()) {
  const result = publicSourceDomainModulePartitionPlan(root);
  const expectedDomains = PUBLIC_ARCHITECTURE_MAP.canonical_domains.map((domain) => domain.id);
  const expectedFacades = new Map(PUBLIC_DOMAIN_SERVICE_FACADES.facades.map((facade) => [facade.id, facade.service]));
  const plannedDomains = result.plan.planned_source_modules.map((module) => module.domain);
  const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
  const errors = [];
  if (!arrayEquals(plannedDomains, expectedDomains)) errors.push(`source partition planned modules must follow canonical domain order ${expectedDomains.join(', ')}`);
  if (new Set(plannedDomains).size !== plannedDomains.length) errors.push('source partition planned module domains must be unique');
  for (const module of result.plan.planned_source_modules) {
    if (!expectedDomains.includes(module.domain)) errors.push(`planned source module is not mapped to a canonical domain: ${module.domain}`);
    if (expectedFacades.has(module.domain) && module.facade !== expectedFacades.get(module.domain)) errors.push(`planned source module ${module.domain} must map to facade ${expectedFacades.get(module.domain)}`);
    if (!String(module.planned_module || '').startsWith('src/domains/')) errors.push(`planned source module path must stay under src/domains/: ${module.planned_module}`);
  }
  if (result.plan.current_shape.physical_module_partition_status !== 'planned_not_applied') errors.push('source partition plan must remain planned_not_applied for this gate');
  if (result.plan.invariants.physical_partition_not_applied_by_this_gate !== true) errors.push('source partition plan must not apply the physical partition in this gate');
  if (result.plan.boundary.moves_source_files !== false) errors.push('architecture partition plan must not move source files');
  if (result.plan.boundary.creates_source_modules !== false) errors.push('architecture partition plan must not create source modules');
  if (result.plan.boundary.partition_plan_command_writes_files !== false) errors.push('architecture partition plan command must remain no-write');
  if (result.plan.boundary.partition_check_command_writes_files !== false) errors.push('architecture partition check command must remain no-write');
  if (!arrayEquals(result.projected_pack_files, expectedPackFiles)) errors.push(`projected npm pack files must remain ${expectedPackFiles.join(', ')}`);

  let sourcePlanFileStatus = 'not_present_installed_context_allowed';
  let sourcePlanFileSchema = null;
  if (result.plan_file_present) {
    try {
      const sourcePlan = readJson(path.join(root, result.plan_file));
      sourcePlanFileSchema = sourcePlan.schema || null;
      if (sourcePlan.schema !== PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.schema) errors.push(`${result.plan_file} schema must be ${PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.schema}`);
      if (!sourcePlan.current_shape || sourcePlan.current_shape.physical_module_partition_status !== 'planned_not_applied') errors.push(`${result.plan_file} must declare planned_not_applied physical module partition status`);
      const fileDomains = Array.isArray(sourcePlan.planned_source_modules) ? sourcePlan.planned_source_modules.map((module) => module.domain) : [];
      if (!arrayEquals(fileDomains, expectedDomains)) errors.push(`${result.plan_file} planned_source_modules must follow canonical domain order ${expectedDomains.join(', ')}`);
      sourcePlanFileStatus = 'present_validated';
    } catch (error) {
      sourcePlanFileStatus = 'present_invalid_json';
      errors.push(`${result.plan_file} is not valid JSON: ${error && error.message ? error.message : String(error)}`);
    }
  } else if (result.package_context === 'source_repository') {
    sourcePlanFileStatus = 'missing_source_context';
    errors.push(`${result.plan_file} must be present in source repository context`);
  }

  return {
    schema: 'agent-onboard-public-source-domain-module-partition-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.package_name,
    version: VERSION,
    release_line: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.release_line,
    command: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN.check_command,
    package_root: root,
    validated: {
      planned_module_count: result.plan.planned_source_modules.length === expectedDomains.length,
      planned_module_domain_order: arrayEquals(plannedDomains, expectedDomains),
      planned_module_domains_unique: new Set(plannedDomains).size === plannedDomains.length,
      planned_modules_map_to_facades: result.plan.planned_source_modules.every((module) => expectedFacades.has(module.domain) && module.facade === expectedFacades.get(module.domain)),
      physical_partition_not_applied: result.plan.current_shape.physical_module_partition_status === 'planned_not_applied' && result.plan.invariants.physical_partition_not_applied_by_this_gate === true,
      partition_commands_no_write: result.plan.boundary.partition_plan_command_writes_files === false && result.plan.boundary.partition_check_command_writes_files === false && result.plan.boundary.moves_source_files === false && result.plan.boundary.creates_source_modules === false,
      package_allowlist_unchanged: arrayEquals(result.projected_pack_files, expectedPackFiles),
      source_plan_file: sourcePlanFileStatus === 'present_validated' || sourcePlanFileStatus === 'not_present_installed_context_allowed'
    },
    expected_domain_ids: expectedDomains,
    planned_module_domains: plannedDomains,
    planned_modules: result.plan.planned_source_modules,
    source_plan_file: {
      path: result.plan_file,
      present: result.plan_file_present,
      status: sourcePlanFileStatus,
      schema: sourcePlanFileSchema,
      source_context_required: result.package_context === 'source_repository'
    },
    expected_pack_files: expectedPackFiles,
    projected_pack_files: result.projected_pack_files,
    boundary: result.boundary,
    errors
  };
}



  return Object.freeze({
    publicCommandRouter,
    publicCommandRouterCheck,
    publicDomainServiceFacades,
    publicDomainServiceFacadesCheck,
    publicSourceDomainModulePartitionPlan,
    plainClone,
    publicSourceDomainModulePartitionPlanCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureRouterFacadeService
});
