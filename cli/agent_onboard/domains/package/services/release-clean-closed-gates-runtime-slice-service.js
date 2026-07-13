'use strict';

const { createCleanCompactionRuntime } = require('./release-clean-closed-gates/clean-compaction-runtime');
const { createKeywordReadmePlanRuntime } = require('./release-clean-closed-gates/keyword-readme-plan-runtime');
const { createReadmeHistoryArchiveRuntime } = require('./release-clean-closed-gates/readme-history-archive-runtime');
const { createReadmeHistoryApplyRuntime } = require('./release-clean-closed-gates/readme-history-apply-runtime');
const { createClosedGateCompactionRuntime } = require('./release-clean-closed-gates/closed-gate-compaction-runtime');
const { createClosedGateApplyRuntime } = require('./release-clean-closed-gates/closed-gate-apply-runtime');
const { createClosedGateReaderRuntime } = require('./release-clean-closed-gates/closed-gate-reader-runtime');
const { createClosedGatePrunePlanRuntime } = require('./release-clean-closed-gates/closed-gate-prune-plan-runtime');
const { createClosedGatePruneDryRunRuntime } = require('./release-clean-closed-gates/closed-gate-prune-dry-run-runtime');
const { createClosedGatePruneApplyRuntime } = require('./release-clean-closed-gates/closed-gate-prune-apply-runtime');

const PUBLIC_RELEASE_CLEAN_CLOSED_GATES_RUNTIME_SLICE = Object.freeze({
  schema: 'agent-onboard-public-release-clean-closed-gates-runtime-slice-001',
  package_name: 'agent-onboard',
  extraction_gate: 'public_release_clean_closed_gates_runtime_slice_extraction',
  role: 'release_clean_closed_gates_runtime_slice',
  module_path: 'cli/agent_onboard/domains/package/services/release-clean-closed-gates-runtime-slice-service.js',
  extracted_from: 'cli/agent_onboard/runtime-composer.js',
  owns: Object.freeze([
    'clean and compaction release commands',
    'README release-history split commands',
    'closed gate compaction and prune release commands'
  ]),
  boundary: Object.freeze({
    no_side_effect_on_require: true,
    no_file_writes_on_require: true,
    storage_backend_changed: false,
    sqlite_introduced: false,
    lmdb_introduced: false,
    mdbx_introduced: false
  })
});

function describePublicReleaseCleanClosedGatesRuntimeSlice() {
  return PUBLIC_RELEASE_CLEAN_CLOSED_GATES_RUNTIME_SLICE;
}

function createLazyApi(api, name) {
  return (...args) => {
    if (typeof api[name] !== 'function') throw new Error(`release clean closed gates slice missing ${name}`);
    return api[name](...args);
  };
}

function createPublicReleaseCleanClosedGatesRuntimeSliceService(deps = Object.freeze({})) {
  const api = {};
  const base = Object.assign({}, deps);
  const clean = createCleanCompactionRuntime(base);
  Object.assign(api, clean);
  const keywordReadmePlan = createKeywordReadmePlanRuntime(Object.assign({}, base, api, {
    publicReadmeHistoryArchiveSplitAppliedState: createLazyApi(api, 'publicReadmeHistoryArchiveSplitAppliedState')
  }));
  Object.assign(api, keywordReadmePlan);
  const readmeArchive = createReadmeHistoryArchiveRuntime(Object.assign({}, base, api));
  Object.assign(api, readmeArchive);
  const readmeApply = createReadmeHistoryApplyRuntime(Object.assign({}, base, api, {
    publicClosedGateRawArtifactPruneApplyAdmitted: createLazyApi(api, 'publicClosedGateRawArtifactPruneApplyAdmitted')
  }));
  Object.assign(api, readmeApply);
  const closedGateApply = createClosedGateApplyRuntime(Object.assign({}, base, api, {
    publicClosedGateArtifactFiles: createLazyApi(api, 'publicClosedGateArtifactFiles'),
    publicClosedGateArtifactParsedRecord: createLazyApi(api, 'publicClosedGateArtifactParsedRecord'),
    publicClosedGateArtifactArchiveCandidateText: createLazyApi(api, 'publicClosedGateArtifactArchiveCandidateText'),
    publicClosedGateArtifactIndexCandidate: createLazyApi(api, 'publicClosedGateArtifactIndexCandidate'),
    publicClosedGateArtifactCompactionDryRunCheck: createLazyApi(api, 'publicClosedGateArtifactCompactionDryRunCheck'),
    publicClosedGateRawArtifactPruneApplyAdmitted: createLazyApi(api, 'publicClosedGateRawArtifactPruneApplyAdmitted'),
    publicClosedGateRawArtifactPruneApplyIndexState: createLazyApi(api, 'publicClosedGateRawArtifactPruneApplyIndexState')
  }));
  Object.assign(api, closedGateApply);
  const closedGateCompaction = createClosedGateCompactionRuntime(Object.assign({}, base, api, {
    publicClosedGateRawArtifactPruneApplyAdmitted: createLazyApi(api, 'publicClosedGateRawArtifactPruneApplyAdmitted')
  }));
  Object.assign(api, closedGateCompaction);
  const closedGateReader = createClosedGateReaderRuntime(Object.assign({}, base, api, {
    publicClosedGateRawArtifactPruneApplyAdmitted: createLazyApi(api, 'publicClosedGateRawArtifactPruneApplyAdmitted')
  }));
  Object.assign(api, closedGateReader);
  const prunePlan = createClosedGatePrunePlanRuntime(Object.assign({}, base, api));
  Object.assign(api, prunePlan);
  const pruneDryRun = createClosedGatePruneDryRunRuntime(Object.assign({}, base, api));
  Object.assign(api, pruneDryRun);
  const pruneApply = createClosedGatePruneApplyRuntime(Object.assign({}, base, api));
  Object.assign(api, pruneApply);
  return Object.freeze(Object.assign({ slice: PUBLIC_RELEASE_CLEAN_CLOSED_GATES_RUNTIME_SLICE }, api));
}

module.exports = Object.freeze({
  createPublicReleaseCleanClosedGatesRuntimeSliceService,
  describePublicReleaseCleanClosedGatesRuntimeSlice
});
