'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createTargetRuntimeUtilities } = require('./target-runtime-utilities');
const { createTargetOnboardingService } = require('./target-onboarding-service');
const { createTargetProfileService } = require('./target-profile-service');
const { createTargetDoctorService } = require('./target-doctor-service');
const { createTargetRepairService } = require('./target-repair-service');
const { createTargetMetadataService } = require('./target-metadata-service');
const { createTargetManifestService } = require('./target-manifest-service');
const { createTargetMemoryService } = require('./target-memory-service');
const { createTargetInventoryService } = require('./target-inventory-service');
const { createTargetWorkItemsService } = require('./target-work-items-service');
const { createTargetHandoffService } = require('./target-handoff-service');
const { createTargetGovernanceService } = require('./target-governance-service');
const { createTargetTemplatesService } = require('./target-templates-service');
const { createTargetWriteService } = require('./target-write-service');
const targetConstants = require('./target-constants');

function freezeEntries(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

function createTargetRuntimeService(deps) {
  const {
    version: VERSION,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    publicAuthorityFirstReadIndex: PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    publicTargetRuntimeNamespace: PUBLIC_TARGET_RUNTIME_NAMESPACE,
    targetOnboardingSurfacePlanContract: TARGET_ONBOARDING_SURFACE_PLAN,
    targetOnboardingDryRunFixtureMatrix: TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
    targetConfigFile: TARGET_CONFIG_FILE,
    targetConfigSchema: TARGET_CONFIG_SCHEMA,
    workItemsSchema: WORK_ITEMS_SCHEMA,
    boundaryGuardContract: BOUNDARY_GUARD_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals
  } = deps;

  for (const [name, value] of Object.entries({
    VERSION,
    PUBLIC_RELEASE_CONTRACT,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_TARGET_RUNTIME_NAMESPACE,
    TARGET_ONBOARDING_SURFACE_PLAN,
    TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX,
    TARGET_CONFIG_FILE,
    TARGET_CONFIG_SCHEMA,
    WORK_ITEMS_SCHEMA,
    BOUNDARY_GUARD_CONTRACT,
    packageRoot,
    sourceContext,
    arrayEquals
  })) {
    if (value === undefined || value === null) throw new Error(`createTargetRuntimeService missing dependency: ${name}`);
  }

  const targetRuntimeUtilities = createTargetRuntimeUtilities({
    version: VERSION,
    targetConfigFile: TARGET_CONFIG_FILE,
    targetConfigSchema: TARGET_CONFIG_SCHEMA,
    workItemsSchema: WORK_ITEMS_SCHEMA,
    boundaryGuardContract: BOUNDARY_GUARD_CONTRACT
  });

  const fullDeps = {
    ...deps,
    ...targetRuntimeUtilities,
    ...targetConstants
  };

  const context = { ...fullDeps };

  const templatesService = createTargetTemplatesService(context);
  Object.assign(context, templatesService);
  
  const writeService = createTargetWriteService(context);
  Object.assign(context, writeService);

  const profileService = createTargetProfileService(context);
  Object.assign(context, profileService);

  const doctorService = createTargetDoctorService(context);
  Object.assign(context, doctorService);

  const repairService = createTargetRepairService(context);
  Object.assign(context, repairService);

  const metadataService = createTargetMetadataService(context);
  Object.assign(context, metadataService);

  const manifestService = createTargetManifestService(context);
  Object.assign(context, manifestService);

  const memoryService = createTargetMemoryService(context);
  Object.assign(context, memoryService);

  const inventoryService = createTargetInventoryService(context);
  Object.assign(context, inventoryService);

  const workItemsPreviewService = createTargetWorkItemsService(context);
  Object.assign(context, workItemsPreviewService);

  const governanceService = createTargetGovernanceService(context);
  Object.assign(context, governanceService);

  const handoffPreviewService = createTargetHandoffService(context);
  Object.assign(context, handoffPreviewService);

  const onboardingService = createTargetOnboardingService(context);
  Object.assign(context, onboardingService);

  return Object.freeze({
    ...targetRuntimeUtilities,
    ...templatesService,
    ...writeService,
    ...profileService,
    ...doctorService,
    ...repairService,
    ...metadataService,
    ...manifestService,
    ...memoryService,
    ...inventoryService,
    ...workItemsPreviewService,
    ...governanceService,
    ...handoffPreviewService,
    ...onboardingService
  });
}

module.exports = {
  createTargetRuntimeService
};
