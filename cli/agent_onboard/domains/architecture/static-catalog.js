'use strict';

const { createPublicCliRuntimeDeMonolithCatalog } = require('./m3-runtime-catalog');
const { createPublicArchitectureMapCatalog } = require('./catalog-shards/public-architecture-map-catalog');
const { createPublicArchitectureBoundaryCatalog } = require('./catalog-shards/public-architecture-boundary-catalog');
const { createPublicSourceKernelCatalog } = require('./catalog-shards/public-source-kernel-catalog');
const { createPublicSourceAuthorityCatalog } = require('./catalog-shards/public-source-authority-catalog');
const { createPublicWorkItemsSourceCatalog } = require('./catalog-shards/public-work-items-source-catalog');
const { createPublicClaimsSourceCatalog } = require('./catalog-shards/public-claims-source-catalog');
const { createPublicReleaseContractCatalog } = require('./catalog-shards/public-release-contract-catalog');
const { createPublicReleaseFixtureCatalog } = require('./catalog-shards/public-release-fixture-catalog');

function createPublicArchitectureCatalog(options = Object.freeze({})) {
  const RELEASE_LINE = options.releaseLine;
  const PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES = options.publicPackagedRouterPortPackFiles;
  const PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES = options.publicPackagedRouterPortModuleFiles;

  const architectureMapCatalog = createPublicArchitectureMapCatalog({
    releaseLine: RELEASE_LINE,
    publicPackagedRouterPortPackFiles: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES
  });

  const architectureBoundaryCatalog = createPublicArchitectureBoundaryCatalog({
    releaseLine: RELEASE_LINE,
    publicPackagedRouterPortPackFiles: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES
  });

  const sourceKernelCatalog = createPublicSourceKernelCatalog({
    releaseLine: RELEASE_LINE
  });

  const sourceAuthorityCatalog = createPublicSourceAuthorityCatalog({
    releaseLine: RELEASE_LINE,
    PUBLIC_AUTHORITY_FIRST_READ_INDEX: architectureBoundaryCatalog.PUBLIC_AUTHORITY_FIRST_READ_INDEX,
    PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE: sourceKernelCatalog.PUBLIC_SOURCE_MODULE_EXTRACTION_INSTALLED_FALLBACK_SMOKE
  });

  const workItemsSourceCatalog = createPublicWorkItemsSourceCatalog({
    releaseLine: RELEASE_LINE
  });

  const claimsSourceCatalog = createPublicClaimsSourceCatalog({
    releaseLine: RELEASE_LINE
  });

  const runtimeDeMonolithCatalog = createPublicCliRuntimeDeMonolithCatalog({
    releaseLine: RELEASE_LINE,
    publicPackagedRouterPortPackFiles: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES,
    publicPackagedRouterPortModuleFiles: PUBLIC_PACKAGED_ROUTER_PORT_MODULE_FILES
  });

  const releaseContractCatalog = createPublicReleaseContractCatalog({
    releaseLine: RELEASE_LINE,
    publicPackagedRouterPortPackFiles: PUBLIC_PACKAGED_ROUTER_PORT_PACK_FILES
  });

  const releaseFixtureCatalog = createPublicReleaseFixtureCatalog({
    PUBLIC_RELEASE_CONTRACT: releaseContractCatalog.PUBLIC_RELEASE_CONTRACT
  });

  return Object.freeze({
    ...architectureMapCatalog,
    ...architectureBoundaryCatalog,
    ...sourceKernelCatalog,
    ...sourceAuthorityCatalog,
    ...workItemsSourceCatalog,
    ...claimsSourceCatalog,
    ...runtimeDeMonolithCatalog,
    ...releaseContractCatalog,
    ...releaseFixtureCatalog
  });
}

module.exports = Object.freeze({
  createPublicArchitectureCatalog
});
