'use strict';

const { createPublicArchitectureClaimsSourceDomainPlanService } = require('./claims/plan-service');
const { createPublicArchitectureClaimsSourceDomainFirstSliceService } = require('./claims/first-slice-service');
const { createPublicArchitectureClaimsSourceDomainBundleParityService } = require('./claims/bundle-parity-service');
const { createPublicArchitectureClaimsSourceDomainRuntimeBridgeService } = require('./claims/runtime-bridge-service');
const { createPublicArchitectureClaimsSourceDomainInstalledFallbackService } = require('./claims/installed-fallback-service');

function createPublicArchitectureClaimsSourceDomainService(deps) {
  const planService = createPublicArchitectureClaimsSourceDomainPlanService(deps);
  const firstSliceService = createPublicArchitectureClaimsSourceDomainFirstSliceService({
    ...deps,
    publicClaimsDomainSourceExtractionPlanCheck: planService.publicClaimsDomainSourceExtractionPlanCheck
  });
  const bundleParityService = createPublicArchitectureClaimsSourceDomainBundleParityService({
    ...deps,
    publicClaimsDomainSourceExtractionFirstSliceFn: firstSliceService.publicClaimsDomainSourceExtractionFirstSlice,
    publicClaimsDomainSourceExtractionFirstSliceCheck: firstSliceService.publicClaimsDomainSourceExtractionFirstSliceCheck
  });
  const runtimeBridgeService = createPublicArchitectureClaimsSourceDomainRuntimeBridgeService({
    ...deps,
    bundledClaimsDomainForParity: bundleParityService.bundledClaimsDomainForParity,
    publicClaimsDomainSourceExtractionBundleParityCheck: bundleParityService.publicClaimsDomainSourceExtractionBundleParityCheck
  });
  const installedFallbackService = createPublicArchitectureClaimsSourceDomainInstalledFallbackService({
    ...deps,
    publicClaimsDomainSourceExtractionRuntimeBridgeFn: runtimeBridgeService.publicClaimsDomainSourceExtractionRuntimeBridge,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck: runtimeBridgeService.publicClaimsDomainSourceExtractionRuntimeBridgeCheck
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
  createPublicArchitectureClaimsSourceDomainService
});
