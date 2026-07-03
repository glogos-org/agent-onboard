'use strict';

const RETIRED_ARCHITECTURE_CHECK_SCOPE = Object.freeze({
  mode: 'retired_m3_checker_reduced',
  retained_checks: Object.freeze([
    'architecture_map',
    'command_router',
    'domain_service_facades',
    'target_runtime_namespace',
    'packaged_router_port'
  ]),
  retired_checks: Object.freeze([
    'source_partition_plans',
    'source_extraction_rehearsals',
    'source_module_bundle_parity',
    'source_module_runtime_bridges',
    'source_domain_closure_review'
  ]),
  reason: 'M4 product work must not be blocked by historical self-dogfood architecture gates.'
});

const EXPECTED_DOMAIN_IDS = Object.freeze([
  'core',
  'authority',
  'work_items',
  'claims',
  'target',
  'release_package'
]);

const REQUIRED_DEPENDENCIES = Object.freeze([
  'version',
  'publicArchitectureMapContract',
  'arrayEquals',
  'publicArchitectureMap',
  'publicCommandRouterCheck',
  'publicDomainServiceFacadesCheck',
  'publicTargetRuntimeNamespaceCheck',
  'publicPackagedRouterPortInclusionCheck'
]);

function prefixedErrors(label, result) {
  return result && Array.isArray(result.errors) ? result.errors.map((error) => `${label}: ${error}`) : [];
}

function createPublicArchitectureAggregateCheckService(deps) {
  for (const name of REQUIRED_DEPENDENCIES) {
    if (deps[name] === undefined || deps[name] === null) {
      throw new Error(`createPublicArchitectureAggregateCheckService missing dependency: ${name}`);
    }
  }

  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    arrayEquals,
    publicArchitectureMap,
    publicCommandRouterCheck,
    publicDomainServiceFacadesCheck,
    publicTargetRuntimeNamespaceCheck,
    publicPackagedRouterPortInclusionCheck
  } = deps;

  function publicArchitectureCheck(root) {
    const map = publicArchitectureMap(root);
    const router = publicCommandRouterCheck(root);
    const facades = publicDomainServiceFacadesCheck(root);
    const targetRuntime = publicTargetRuntimeNamespaceCheck(root);
    const packagedRouterPort = publicPackagedRouterPortInclusionCheck(root);
    const domainIds = map.map.canonical_domains.map((domain) => domain.id);
    const expectedPackFiles = map.map.public_source_shape.expected_pack_files.slice().sort();
    const projectedPackFiles = map.current_runtime.projected_pack_files;
    const errors = [];

    if (!arrayEquals(domainIds, EXPECTED_DOMAIN_IDS)) errors.push(`architecture domain order must be ${EXPECTED_DOMAIN_IDS.join(', ')}`);
    if (new Set(domainIds).size !== domainIds.length) errors.push('architecture domain ids must be unique');
    if (!map.current_runtime.entrypoint_exists) errors.push(`architecture entrypoint is missing: ${map.current_runtime.entrypoint}`);
    if (!arrayEquals(projectedPackFiles, expectedPackFiles)) errors.push(`projected npm pack files must match ${expectedPackFiles.join(', ')}`);
    if (map.map.package_boundary.architecture_map_command_writes_files !== false) errors.push('architecture map command must remain no-write');
    if (map.map.package_boundary.architecture_check_command_writes_files !== false) errors.push('architecture check command must remain no-write');
    errors.push(
      ...prefixedErrors('command router', router),
      ...prefixedErrors('domain service facades', facades),
      ...prefixedErrors('target runtime', targetRuntime),
      ...prefixedErrors('packaged router port', packagedRouterPort)
    );

    return {
      schema: 'agent-onboard-public-architecture-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: PUBLIC_ARCHITECTURE_MAP.package_name,
      version: VERSION,
      release_line: PUBLIC_ARCHITECTURE_MAP.release_line,
      command: PUBLIC_ARCHITECTURE_MAP.check_command,
      package_root: root,
      check_scope: RETIRED_ARCHITECTURE_CHECK_SCOPE,
      validated: {
        retired_architecture_checker_reduced: true,
        historical_source_extraction_checks_retired: true,
        domain_count: map.map.canonical_domains.length === EXPECTED_DOMAIN_IDS.length,
        domain_order: arrayEquals(domainIds, EXPECTED_DOMAIN_IDS),
        domain_ids_unique: new Set(domainIds).size === domainIds.length,
        runtime_entrypoint_present: map.current_runtime.entrypoint_exists,
        compact_package_boundary: arrayEquals(projectedPackFiles, expectedPackFiles),
        architecture_commands_no_write: map.map.package_boundary.architecture_map_command_writes_files === false && map.map.package_boundary.architecture_check_command_writes_files === false,
        command_router_boundary: router.status === 'ok',
        domain_service_facades: facades.status === 'ok',
        target_runtime_namespace: targetRuntime.status === 'ok',
        packaged_router_port: packagedRouterPort.status === 'ok'
      },
      domain_ids: domainIds,
      expected_pack_files: expectedPackFiles,
      projected_pack_files: projectedPackFiles,
      command_router: router,
      domain_service_facades: facades,
      target_runtime_namespace: targetRuntime,
      packaged_router_port: packagedRouterPort,
      retired_checks: RETIRED_ARCHITECTURE_CHECK_SCOPE.retired_checks,
      boundary: map.boundary,
      errors
    };
  }

  return Object.freeze({
    publicArchitectureCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureAggregateCheckService
});
