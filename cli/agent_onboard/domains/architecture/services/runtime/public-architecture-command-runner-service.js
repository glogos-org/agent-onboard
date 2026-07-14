'use strict';

const ARCHITECTURE_COMMANDS = Object.freeze([
  ['--map', 'publicArchitectureMap'],
  ['--router', 'publicCommandRouter'],
  ['--facades', 'publicDomainServiceFacades'],
  ['--partition-plan', 'publicSourceDomainModulePartitionPlan'],
  ['--partition-check', 'publicSourceDomainModulePartitionPlanCheck', true],
  ['--extraction-rehearsal', 'publicSourceDomainExtractionRehearsal'],
  ['--extraction-check', 'publicSourceDomainExtractionRehearsalCheck', true],
  ['--golden-outputs', 'publicSourceExtractionGoldenOutputs'],
  ['--golden-check', 'publicSourceExtractionGoldenOutputFreezeCheck', true],
  ['--adapter-boundary', 'publicSourceModuleExtractionAdapterBoundary'],
  ['--adapter-check', 'publicSourceModuleExtractionAdapterBoundaryCheck', true],
  ['--first-slice', 'publicSourceModuleExtractionFirstSlice'],
  ['--first-slice-check', 'publicSourceModuleExtractionFirstSliceCheck', true],
  ['--bundle-parity', 'publicSourceModuleExtractionBundleParity'],
  ['--bundle-parity-check', 'publicSourceModuleExtractionBundleParityCheck', true],
  ['--runtime-bridge', 'publicSourceModuleExtractionRuntimeBridge'],
  ['--runtime-bridge-check', 'publicSourceModuleExtractionRuntimeBridgeCheck', true],
  ['--installed-fallback-smoke', 'publicSourceModuleExtractionInstalledFallbackSmoke'],
  ['--installed-fallback-check', 'publicSourceModuleExtractionInstalledFallbackSmokeCheck', true],
  ['--second-slice-plan', 'publicSourceModuleExtractionSecondSlicePlan'],
  ['--second-slice-check', 'publicSourceModuleExtractionSecondSlicePlanCheck', true],
  ['--second-slice-first-slice', 'publicSourceModuleExtractionSecondSliceFirstSlice'],
  ['--second-slice-first-slice-check', 'publicSourceModuleExtractionSecondSliceFirstSliceCheck', true],
  ['--authority-bundle-parity', 'publicSourceModuleExtractionAuthorityBundleParity'],
  ['--authority-bundle-parity-check', 'publicSourceModuleExtractionAuthorityBundleParityCheck', true],
  ['--authority-runtime-bridge', 'publicSourceModuleExtractionAuthorityRuntimeBridge'],
  ['--authority-runtime-bridge-check', 'publicSourceModuleExtractionAuthorityRuntimeBridgeCheck', true],
  ['--m2-seed', 'publicArchitectureM1ClosureM2Seed'],
  ['--m2-seed-check', 'publicArchitectureM1ClosureM2SeedCheck', true],
  ['--work-items-plan', 'publicWorkItemsDomainSourceExtractionPlan'],
  ['--work-items-check', 'publicWorkItemsDomainSourceExtractionPlanCheck', true],
  ['--work-items-first-slice', 'publicWorkItemsDomainSourceExtractionFirstSlice'],
  ['--work-items-first-slice-check', 'publicWorkItemsDomainSourceExtractionFirstSliceCheck', true],
  ['--work-items-bundle-parity', 'publicWorkItemsDomainSourceExtractionBundleParity'],
  ['--work-items-bundle-parity-check', 'publicWorkItemsDomainSourceExtractionBundleParityCheck', true],
  ['--work-items-runtime-bridge', 'publicWorkItemsDomainSourceExtractionRuntimeBridge'],
  ['--work-items-runtime-bridge-check', 'publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck', true],
  ['--work-items-installed-fallback-smoke', 'publicWorkItemsDomainSourceExtractionInstalledFallbackSmoke'],
  ['--work-items-installed-fallback-check', 'publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck', true],
  ['--claims-plan', 'publicClaimsDomainSourceExtractionPlan'],
  ['--claims-check', 'publicClaimsDomainSourceExtractionPlanCheck', true],
  ['--claims-first-slice', 'publicClaimsDomainSourceExtractionFirstSlice'],
  ['--claims-first-slice-check', 'publicClaimsDomainSourceExtractionFirstSliceCheck', true],
  ['--claims-bundle-parity', 'publicClaimsDomainSourceExtractionBundleParity'],
  ['--claims-bundle-parity-check', 'publicClaimsDomainSourceExtractionBundleParityCheck', true],
  ['--claims-runtime-bridge', 'publicClaimsDomainSourceExtractionRuntimeBridge'],
  ['--claims-runtime-bridge-check', 'publicClaimsDomainSourceExtractionRuntimeBridgeCheck', true],
  ['--claims-installed-fallback-smoke', 'publicClaimsDomainSourceExtractionInstalledFallbackSmoke'],
  ['--claims-installed-fallback-check', 'publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck', true],
  ['--source-domain-closure-review', 'publicSourceDomainExtractionStabilizationClosureReview'],
  ['--source-domain-closure-check', 'publicSourceDomainExtractionStabilizationClosureReviewCheck', true],
  ['--cli-runtime-plan', 'publicCliRuntimeDeMonolithPlanning'],
  ['--cli-runtime-check', 'publicCliRuntimeDeMonolithPlanningCheck', true],
  ['--thin-router', 'publicThinCliRouterSeed'],
  ['--thin-router-check', 'publicThinCliRouterSeedCheck', true],
  ['--compatibility-port', 'publicCompatibilityCommandPortSeed'],
  ['--compatibility-port-check', 'publicCompatibilityCommandPortSeedCheck', true],
  ['--core-adapter', 'publicCoreCommandAdapterExtraction'],
  ['--core-adapter-check', 'publicCoreCommandAdapterExtractionCheck', true],
  ['--package-adapter', 'publicPackageCommandAdapterExtraction'],
  ['--package-adapter-check', 'publicPackageCommandAdapterExtractionCheck', true],
  ['--architecture-adapter', 'publicArchitectureCommandAdapterExtraction'],
  ['--architecture-adapter-check', 'publicArchitectureCommandAdapterExtractionCheck', true],
  ['--authority-adapter', 'publicAuthorityCommandAdapterExtraction'],
  ['--authority-adapter-check', 'publicAuthorityCommandAdapterExtractionCheck', true],
  ['--module-inclusion-plan', 'publicModularRuntimePackageInclusionPlan'],
  ['--module-inclusion-check', 'publicModularRuntimePackageInclusionPlanCheck', true],
  ['--packaged-router-port', 'publicPackagedRouterPortInclusion'],
  ['--packaged-router-port-check', 'publicPackagedRouterPortInclusionCheck', true],
  ['--thin-entrypoint-rehearsal', 'publicThinEntrypointRouterCutoverRehearsal'],
  ['--thin-entrypoint-rehearsal-check', 'publicThinEntrypointRouterCutoverRehearsalCheck', true],
  ['--thin-entrypoint-cutover', 'publicThinEntrypointRouterCutoverApplication'],
  ['--thin-entrypoint-cutover-check', 'publicThinEntrypointRouterCutoverApplicationCheck', true],
  ['--router-adapter-delegation', 'publicRouterCommandAdapterDelegationExpansion'],
  ['--router-adapter-delegation-check', 'publicRouterCommandAdapterDelegationExpansionCheck', true],
  ['--check', 'publicArchitectureCheck', true]
]);

function required(name, value) {
  if (value === undefined || value === null) throw new Error(`createPublicArchitectureCommandRunnerService missing dependency: ${name}`);
  return value;
}

function createPublicArchitectureCommandRunnerService(options = {}) {
  const json = required('json', options.json);
  const handlers = required('handlers', options.handlers);
  const commandIndex = new Map(ARCHITECTURE_COMMANDS.map(([flag, handlerName, statusChecked]) => [flag, Object.freeze({ handlerName, statusChecked: statusChecked === true })]));

  function runArchitecture(args = []) {
    if (args.length === 1 && commandIndex.has(args[0])) {
      const spec = commandIndex.get(args[0]);
      const handler = handlers[spec.handlerName];
      if (typeof handler !== 'function') throw new Error(`architecture handler missing: ${spec.handlerName}`);
      const result = handler();
      json(result);
      return spec.statusChecked ? (result && result.status === 'ok' ? 0 : 1) : 0;
    }
    json({
      schema: 'agent-onboard-architecture-command-error-001',
      status: 'error',
      command_family: 'architecture',
      message: `architecture requires ${ARCHITECTURE_COMMANDS.map(([flag]) => flag).slice(0, -1).join(', ')}, or ${ARCHITECTURE_COMMANDS[ARCHITECTURE_COMMANDS.length - 1][0]}`,
      writes_files: false,
      publishes_package: false
    });
    return 1;
  }

  return Object.freeze({ runArchitecture, commandFlags: () => ARCHITECTURE_COMMANDS.map(([flag]) => flag) });
}

module.exports = Object.freeze({
  ARCHITECTURE_COMMANDS,
  createPublicArchitectureCommandRunnerService
});
