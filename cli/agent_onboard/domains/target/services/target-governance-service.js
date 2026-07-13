'use strict';

const {
  buildWorkItemsIndex,
  buildClaimsIndex
} = require('./target-governance-core');
const {
  targetGovernancePreview,
  targetGovernancePreviewText
} = require('./target-governance-preview-service');
const {
  targetGovernanceBudgetContract,
  targetGovernanceBudgetContractText,
  targetGovernanceBudgetCheck,
  targetGovernanceBudgetCheckText
} = require('./target-governance-budget-service');
const {
  targetGovernanceIndexMaterializationDryRun,
  targetGovernanceIndexMaterializationDryRunText,
  targetGovernanceIndexMaterializationWrite,
  targetGovernanceIndexMaterializationWriteText,
  targetGovernanceIndexRefreshAfterMutation,
  targetGovernanceIndexDriftCheck,
  targetGovernanceIndexDriftCheckText,
  targetGovernanceIndexDriftSummary
} = require('./target-governance-index-materialization-service');

function createTargetGovernanceService(deps = {}) {
  const releaseLine = deps.publicReleaseContract && deps.publicReleaseContract.release_line ? deps.publicReleaseContract.release_line : deps.releaseLine;
  return Object.freeze({
    targetGovernancePreview: (targetRoot) => targetGovernancePreview(targetRoot, { version: deps.version, releaseLine }),
    formatTargetGovernancePreviewText: targetGovernancePreviewText,
    targetGovernanceBudgetContract: () => targetGovernanceBudgetContract({ version: deps.version, releaseLine }),
    formatTargetGovernanceBudgetContractText: targetGovernanceBudgetContractText,
    targetGovernanceBudgetCheck: (targetRoot) => targetGovernanceBudgetCheck(targetRoot, { version: deps.version, releaseLine }),
    formatTargetGovernanceBudgetCheckText: targetGovernanceBudgetCheckText,
    targetGovernanceIndexMaterializationDryRun: (targetRoot) => targetGovernanceIndexMaterializationDryRun(targetRoot, { version: deps.version, releaseLine }),
    formatTargetGovernanceIndexMaterializationDryRunText: targetGovernanceIndexMaterializationDryRunText,
    targetGovernanceIndexMaterializationWrite: (targetRoot, options = {}) => targetGovernanceIndexMaterializationWrite(targetRoot, { version: deps.version, releaseLine, force: options.force }),
    targetGovernanceIndexRefreshAfterMutation: (targetRoot, options = {}) => targetGovernanceIndexRefreshAfterMutation(targetRoot, { version: deps.version, releaseLine, trigger: options.trigger, updatedAt: options.updatedAt }),
    formatTargetGovernanceIndexMaterializationWriteText: targetGovernanceIndexMaterializationWriteText,
    targetGovernanceIndexDriftCheck: (targetRoot) => targetGovernanceIndexDriftCheck(targetRoot, { version: deps.version, releaseLine }),
    targetGovernanceIndexDriftSummary: (targetRoot) => targetGovernanceIndexDriftSummary(targetGovernanceIndexDriftCheck(targetRoot, { version: deps.version, releaseLine })),
    summarizeTargetGovernanceIndexDriftCheck: targetGovernanceIndexDriftSummary,
    formatTargetGovernanceIndexDriftCheckText: targetGovernanceIndexDriftCheckText,
    buildTargetGovernanceWorkItemsIndex: buildWorkItemsIndex,
    buildTargetGovernanceClaimsIndex: buildClaimsIndex
  });
}

module.exports = {
  createTargetGovernanceService,
  targetGovernancePreview,
  targetGovernancePreviewText,
  targetGovernanceBudgetContract,
  targetGovernanceBudgetContractText,
  targetGovernanceBudgetCheck,
  targetGovernanceBudgetCheckText,
  targetGovernanceIndexMaterializationDryRun,
  targetGovernanceIndexMaterializationDryRunText,
  targetGovernanceIndexMaterializationWrite,
  targetGovernanceIndexMaterializationWriteText,
  targetGovernanceIndexRefreshAfterMutation,
  targetGovernanceIndexDriftCheck,
  targetGovernanceIndexDriftCheckText,
  targetGovernanceIndexDriftSummary,
  buildWorkItemsIndex,
  buildClaimsIndex
};
