'use strict';

const { createPublicArchitectureWorkItemsSourceDomainPlanService } = require('./work-items/plan-service');
const { createPublicArchitectureWorkItemsSourceDomainFirstSliceService } = require('./work-items/first-slice-service');
const { createPublicArchitectureWorkItemsSourceDomainBundleParityService } = require('./work-items/bundle-parity-service');
const { createPublicArchitectureWorkItemsSourceDomainRuntimeBridgeService } = require('./work-items/runtime-bridge-service');
const { createPublicArchitectureWorkItemsSourceDomainInstalledFallbackService } = require('./work-items/installed-fallback-service');

function createPublicArchitectureWorkItemsSourceDomainService(deps) {
  const planService = createPublicArchitectureWorkItemsSourceDomainPlanService(deps);
  const firstSliceService = createPublicArchitectureWorkItemsSourceDomainFirstSliceService({
    ...deps,
    publicWorkItemsDomainSourceExtractionPlanCheck: planService.publicWorkItemsDomainSourceExtractionPlanCheck
  });
  const bundleParityService = createPublicArchitectureWorkItemsSourceDomainBundleParityService({
    ...deps,
    publicWorkItemsDomainSourceExtractionFirstSliceFn: firstSliceService.publicWorkItemsDomainSourceExtractionFirstSlice,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck: firstSliceService.publicWorkItemsDomainSourceExtractionFirstSliceCheck
  });
  const runtimeBridgeService = createPublicArchitectureWorkItemsSourceDomainRuntimeBridgeService({
    ...deps,
    bundledWorkItemsDomainForParity: bundleParityService.bundledWorkItemsDomainForParity,
    publicWorkItemsDomainSourceExtractionBundleParityCheck: bundleParityService.publicWorkItemsDomainSourceExtractionBundleParityCheck
  });
  const installedFallbackService = createPublicArchitectureWorkItemsSourceDomainInstalledFallbackService({
    ...deps,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeFn: runtimeBridgeService.publicWorkItemsDomainSourceExtractionRuntimeBridge,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck: runtimeBridgeService.publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck
  });

  return Object.freeze({
    ...planService,
    ...firstSliceService,
    ...bundleParityService,
    ...runtimeBridgeService,
    ...installedFallbackService
  });
}

module.exports = Object.freeze({
  createPublicArchitectureWorkItemsSourceDomainService
});
