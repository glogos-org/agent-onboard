'use strict';

const path = require('path');

const CHECK_MODULES = Object.freeze({
  'public-artifact-boundary': 'public-artifact-boundary.js',
  'runtime-state-storage-layout': 'runtime-state-storage-layout.js',
  'runtime-state-storage': 'runtime-state-storage-layout.js',
  'work-item-ledger-compaction': 'work-item-ledger-compaction.js',
  'closed-gate-state-layout': 'closed-gate-state-layout.js',
  'runtime-composer-decomposition': 'runtime-composer-decomposition.js',
  'runtime-check-fast-service-decomposition': 'runtime-check-fast-service-decomposition.js',
  'runtime-mcp-bridge-service-decomposition': 'runtime-mcp-bridge-service-decomposition.js',
  'runtime-agents-bridge-service-decomposition': 'runtime-agents-bridge-service-decomposition.js',
  'runtime-guard-service-decomposition': 'runtime-guard-service-decomposition.js',
  'runtime-release-service-decomposition': 'runtime-release-service-decomposition.js',
  'source-size-budget-ratchet': 'source-size-budget-ratchet.js',
  'source-size-budget': 'source-size-budget-ratchet.js',
  'runtime-command-registry-extraction': 'runtime-command-registry-extraction.js',
  'release-clean-closed-gates-runtime-slice-extraction': 'release-clean-closed-gates-runtime-slice-extraction.js',
  'release-clean-closed-gates-runtime-slice': 'release-clean-closed-gates-runtime-slice-extraction.js',
  'architecture-catalog-sharding': 'architecture-catalog-sharding.js',
  'work-items-service-split': 'work-items-service-split.js',
  'target-governance-service-split': 'target-governance-service-split.js',
  'test-suite-sharding': 'test-suite-sharding.js',
  'state-projection-authority-cutover': 'state-projection-authority-cutover.js',
  'closure-payload-reference-compaction': 'closure-payload-reference-compaction.js',
  'check-registry-compaction': 'check-registry-compaction.js',
  'god-file-budget-enforcement-closure': 'god-file-budget-enforcement-closure.js',
  'runtime-composer-residual-slice-reduction': 'runtime-composer-residual-slice-reduction.js',
  'target-command-runner-extraction': 'target-command-runner-extraction.js',
  'exact-artifact-oracle-service-extraction': 'exact-artifact-oracle-service-extraction.js',
  'target-onboarding-acceptance-service-extraction': 'target-onboarding-acceptance-service-extraction.js'
,  'core-surface-command-runner-extraction': 'core-surface-command-runner-extraction.js'
,  'architecture-command-runner-extraction': 'architecture-command-runner-extraction.js'
,  'release-check-service-extraction': 'release-check-service-extraction.js'
,  'contracts-command-service-extraction': 'contracts-command-service-extraction.js'
,  'package-surface-service-extraction': 'package-surface-service-extraction.js'
,  'full-test-runner-service-extraction': 'full-test-runner-service-extraction.js'
,  'cli-runtime-planning-service-extraction': 'cli-runtime-planning-service-extraction.js'
,  'router-seed-service-extraction': 'router-seed-service-extraction.js'
,  'command-adapter-extraction-service-extraction': 'command-adapter-extraction-service-extraction.js'
,  'router-cutover-service-extraction': 'router-cutover-service-extraction.js'
,  'source-module-residual-service-extraction': 'source-module-residual-service-extraction.js'
,  'architecture-runtime-service-residual-reduction': 'architecture-runtime-service-residual-reduction.js'
,  'source-extraction-runtime-service-residual-reduction': 'source-extraction-runtime-service-residual-reduction.js'
});

function normalizeCheckId(value) {
  return String(value || '').trim().replace(/^check:/u, '');
}

function checkIds() {
  return Object.keys(CHECK_MODULES).sort();
}

function checkModulePath(id) {
  const normalized = normalizeCheckId(id);
  const moduleFile = CHECK_MODULES[normalized];
  if (!moduleFile) return null;
  return path.join(__dirname, moduleFile);
}

module.exports = Object.freeze({
  CHECK_MODULES,
  normalizeCheckId,
  checkIds,
  checkModulePath
});
