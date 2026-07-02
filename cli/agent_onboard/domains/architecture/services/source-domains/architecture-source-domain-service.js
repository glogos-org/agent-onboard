'use strict';

const { createPublicArchitectureWorkItemsSourceDomainService } = require('./work-items-source-domain-service');
const { createPublicArchitectureClaimsSourceDomainService } = require('./claims-source-domain-service');
const { createPublicArchitectureSourceDomainClosureService } = require('./source-domain-closure-service');

function createPublicArchitectureSourceDomainService(deps) {
  const workItemsService = createPublicArchitectureWorkItemsSourceDomainService(deps);
  const claimsService = createPublicArchitectureClaimsSourceDomainService({
    ...deps,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck: workItemsService.publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck
  });
  const closureService = createPublicArchitectureSourceDomainClosureService({
    ...deps,
    publicWorkItemsDomainSourceExtractionPlanCheck: workItemsService.publicWorkItemsDomainSourceExtractionPlanCheck,
    publicWorkItemsDomainSourceExtractionFirstSliceCheck: workItemsService.publicWorkItemsDomainSourceExtractionFirstSliceCheck,
    publicWorkItemsDomainSourceExtractionBundleParityCheck: workItemsService.publicWorkItemsDomainSourceExtractionBundleParityCheck,
    publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck: workItemsService.publicWorkItemsDomainSourceExtractionRuntimeBridgeCheck,
    publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck: workItemsService.publicWorkItemsDomainSourceExtractionInstalledFallbackSmokeCheck,
    publicClaimsDomainSourceExtractionPlanCheck: claimsService.publicClaimsDomainSourceExtractionPlanCheck,
    publicClaimsDomainSourceExtractionFirstSliceCheck: claimsService.publicClaimsDomainSourceExtractionFirstSliceCheck,
    publicClaimsDomainSourceExtractionBundleParityCheck: claimsService.publicClaimsDomainSourceExtractionBundleParityCheck,
    publicClaimsDomainSourceExtractionRuntimeBridgeCheck: claimsService.publicClaimsDomainSourceExtractionRuntimeBridgeCheck,
    publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck: claimsService.publicClaimsDomainSourceExtractionInstalledFallbackSmokeCheck
  });

  return Object.freeze({
    ...workItemsService,
    ...claimsService,
    ...closureService
  });
}

module.exports = Object.freeze({
  createPublicArchitectureSourceDomainService
});
