'use strict';

const { createPublicArchitectureRouterFacadeService } = require('./public-architecture-router-facade-service');
const { createPublicAuthorityStateShardService } = require('./public-authority-state-shard-service');
const { createPublicAuthorityFirstReadService } = require('./public-authority-first-read-service');
const { createPublicTargetRuntimeNamespaceService } = require('./public-target-runtime-namespace-service');
const { createPublicSourceDomainRehearsalService } = require('./public-source-domain-rehearsal-service');
const { createPublicArchitectureTransitionService } = require('./public-architecture-transition-service');
let createPublicArchitectureSourceExtractionService = null;
try {
  createPublicArchitectureSourceExtractionService = require('../source-extraction/architecture-source-extraction-service').createPublicArchitectureSourceExtractionService;
} catch (error) {
  // Source-only extraction service is omitted in installed package context
}

function createPublicArchitectureRuntimeService(deps) {
  const {
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicCommandRouter: PUBLIC_COMMAND_ROUTER,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    publicSourceDomainModulePartitionPlan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    publicSourceExtractionGoldenOutputFreeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    publicVersionReferencePolicy: PUBLIC_VERSION_REFERENCE_POLICY,
    publicSourceModuleExtractionAdapterBoundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    publicSourceModuleExtractionFirstSlice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    publicSourceModuleExtractionBundleParity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    publicSourceModuleExtractionRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    publicSourceModuleExtractionAuthorityRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    publicArchitectureM1ClosureM2Seed: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    targetOnboardingSurfacePlan: TARGET_ONBOARDING_SURFACE_PLAN,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    targetRuntimeNamespaceTemplate,
    targetOnboardingWriteSet,
    publicArchitectureMap,
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_ARCHITECTURE_MAP,
    PUBLIC_COMMAND_ROUTER,
    PUBLIC_DOMAIN_SERVICE_FACADES,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
    PUBLIC_VERSION_REFERENCE_POLICY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
    PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
    PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
    PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    PUBLIC_RELEASE_CONTRACT,
    TARGET_ONBOARDING_SURFACE_PLAN,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    targetRuntimeNamespaceTemplate,
    targetOnboardingWriteSet,
    publicArchitectureMap,
    bundledAuthorityDomainForParity,
    publicSourceModuleExtractionAuthorityBundleParityCheck
  })) {
    if (value === undefined || value === null) throw new Error(`createPublicArchitectureRuntimeService missing dependency: ${name}`);
  }

  const routerFacadeService = createPublicArchitectureRouterFacadeService({
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
  });
  const {
    publicCommandRouter,
    publicCommandRouterCheck,
    publicDomainServiceFacades,
    publicDomainServiceFacadesCheck,
    publicSourceDomainModulePartitionPlan,
    plainClone,
    publicSourceDomainModulePartitionPlanCheck
  } = routerFacadeService;

  const authorityStateShardService = createPublicAuthorityStateShardService({
    version: VERSION,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    packageRoot,
    sourceContext,
    readJson
  });
  const {
    stableSerialize,
    digestJson,
    safeAuthorityFileDigest,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck,
    publicAuthorityStateShardingSeedContract
  } = authorityStateShardService;

  const authorityFirstReadService = createPublicAuthorityFirstReadService({
    version: VERSION,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    publicAuthorityStateShardingSeedContract,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    firstReadOrder,
    llmsTxtTemplate,
    authorityPathTemplate,
    stableSerialize,
    digestJson,
    safeAuthorityFileDigest,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck
  });
  const {
    publicAuthorityFirstRead,
    publicAuthorityFirstReadCheck,
    publicAuthorityCompactIndexResult,
    publicAuthorityCompactIndexCheck
  } = authorityFirstReadService;

  const targetRuntimeNamespaceService = createPublicTargetRuntimeNamespaceService({
    version: VERSION,
    publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    targetOnboardingSurfacePlan: TARGET_ONBOARDING_SURFACE_PLAN,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    targetRuntimeNamespaceTemplate,
    targetOnboardingWriteSet
  });
  const {
    publicTargetRuntimeNamespace,
    publicTargetRuntimeNamespaceCheck
  } = targetRuntimeNamespaceService;

  const sourceDomainRehearsalService = createPublicSourceDomainRehearsalService({
    version: VERSION,
    publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
    publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
    publicSourceDomainModulePartitionPlan: PUBLIC_SOURCE_DOMAIN_MODULE_PARTITION_PLAN,
    publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceDomainModulePartitionPlanCheck
  });
  const {
    publicSourceDomainExtractionRehearsal,
    publicSourceDomainExtractionRehearsalCheck
  } = sourceDomainRehearsalService;

const publicArchitectureSourceExtractionService = typeof createPublicArchitectureSourceExtractionService === 'function' ? createPublicArchitectureSourceExtractionService({
  version: VERSION,
  publicArchitectureMapContract: PUBLIC_ARCHITECTURE_MAP,
  publicDomainServiceFacades: PUBLIC_DOMAIN_SERVICE_FACADES,
  publicSourceDomainExtractionRehearsal: PUBLIC_SOURCE_DOMAIN_EXTRACTION_REHEARSAL,
  publicSourceExtractionGoldenOutputFreeze: PUBLIC_SOURCE_EXTRACTION_GOLDEN_OUTPUT_FREEZE,
  publicVersionReferencePolicy: PUBLIC_VERSION_REFERENCE_POLICY,
  publicSourceModuleExtractionAdapterBoundary: PUBLIC_SOURCE_MODULE_EXTRACTION_ADAPTER_BOUNDARY,
  publicSourceModuleExtractionFirstSlice: PUBLIC_SOURCE_MODULE_EXTRACTION_FIRST_SLICE,
  publicSourceModuleExtractionBundleParity: PUBLIC_SOURCE_MODULE_EXTRACTION_BUNDLE_PARITY,
  publicSourceModuleExtractionRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_RUNTIME_BRIDGE,
  publicSourceModuleExtractionAuthorityRuntimeBridge: PUBLIC_SOURCE_MODULE_EXTRACTION_AUTHORITY_RUNTIME_BRIDGE,
  publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
  packageRoot,
  sourceContext,
  arrayEquals,
  readJson,
  packageJsonProjectedPackFiles,
  publicArchitectureMap,
  publicCommandRouter,
  publicSourceDomainExtractionRehearsalCheck,
  bundledAuthorityDomainForParity,
  publicSourceModuleExtractionAuthorityBundleParityCheck
}) : {};
const {
  publicSourceExtractionGoldenOutputs,
  scanCurrentVersionLiterals,
  publicVersionReferencePolicyCheck,
  publicSourceExtractionGoldenOutputFreezeCheck,
  publicSourceModuleExtractionAdapterBoundary,
  publicSourceModuleExtractionAdapterBoundaryCheck,
  loadCoreFirstSliceModule,
  publicSourceModuleExtractionFirstSlice,
  publicSourceModuleExtractionFirstSliceCheck,
  bundledCoreDomainForParity,
  publicSourceModuleExtractionBundleParity,
  publicSourceModuleExtractionBundleParityCheck,
  resolveCoreDomainRuntimeBridge,
  publicSourceModuleExtractionRuntimeBridge,
  publicSourceModuleExtractionRuntimeBridgeCheck,
  resolveAuthorityDomainRuntimeBridge,
  publicSourceModuleExtractionAuthorityRuntimeBridge,
  publicSourceModuleExtractionAuthorityRuntimeBridgeCheck
} = publicArchitectureSourceExtractionService;

  const transitionService = createPublicArchitectureTransitionService({
    version: VERSION,
    publicArchitectureM1ClosureM2Seed: PUBLIC_ARCHITECTURE_M1_CLOSURE_M2_SEED,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals,
    readJson,
    packageJsonProjectedPackFiles,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck
  });
  const {
    publicArchitectureM1ClosureM2Seed,
    workItemIdFromComponents,
    workItemIdsFromComponentList,
    publicArchitectureM1ClosureM2SeedCheck
  } = transitionService;

  return Object.freeze({
    publicCommandRouter,
    publicCommandRouterCheck,
    publicDomainServiceFacades,
    publicDomainServiceFacadesCheck,
    publicSourceDomainModulePartitionPlan,
    plainClone,
    publicSourceDomainModulePartitionPlanCheck,
    publicAuthorityFirstRead,
    publicAuthorityFirstReadCheck,
    publicAuthorityCompactIndexResult,
    publicAuthorityCompactIndexCheck,
    publicAuthorityStateShardingSeed,
    publicAuthorityStateShardingSeedCheck,
    publicTargetRuntimeNamespace,
    publicTargetRuntimeNamespaceCheck,
    publicSourceDomainExtractionRehearsal,
    publicSourceDomainExtractionRehearsalCheck,
    publicSourceExtractionGoldenOutputs,
    scanCurrentVersionLiterals,
    publicVersionReferencePolicyCheck,
    publicSourceExtractionGoldenOutputFreezeCheck,
    publicSourceModuleExtractionAdapterBoundary,
    publicSourceModuleExtractionAdapterBoundaryCheck,
    loadCoreFirstSliceModule,
    publicSourceModuleExtractionFirstSlice,
    publicSourceModuleExtractionFirstSliceCheck,
    bundledCoreDomainForParity,
    publicSourceModuleExtractionBundleParity,
    publicSourceModuleExtractionBundleParityCheck,
    resolveCoreDomainRuntimeBridge,
    publicSourceModuleExtractionRuntimeBridge,
    publicSourceModuleExtractionRuntimeBridgeCheck,
    resolveAuthorityDomainRuntimeBridge,
    publicSourceModuleExtractionAuthorityRuntimeBridge,
    publicSourceModuleExtractionAuthorityRuntimeBridgeCheck,
    publicArchitectureM1ClosureM2Seed,
    workItemIdFromComponents,
    workItemIdsFromComponentList,
    publicArchitectureM1ClosureM2SeedCheck
  });
}

module.exports = Object.freeze({
  createPublicArchitectureRuntimeService
});
