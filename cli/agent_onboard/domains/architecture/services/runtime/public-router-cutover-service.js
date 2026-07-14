'use strict';

const { createPublicModularRuntimePackageInclusionService } = require('./public-modular-runtime-package-inclusion-service');
const { createPublicPackagedRouterPortInclusionService } = require('./public-packaged-router-port-inclusion-service');
const { createPublicThinEntrypointRehearsalService } = require('./public-thin-entrypoint-rehearsal-service');
const { createPublicThinEntrypointCutoverService } = require('./public-thin-entrypoint-cutover-service');
const { createPublicRouterAdapterDelegationService } = require('./public-router-adapter-delegation-service');

function createPublicRouterCutoverService(options = Object.freeze({})) {
  const modularRuntimePackageInclusionService = createPublicModularRuntimePackageInclusionService(options);
  const packagedRouterPortInclusionService = createPublicPackagedRouterPortInclusionService(options);
  const thinEntrypointRehearsalService = createPublicThinEntrypointRehearsalService(options);
  const thinEntrypointCutoverService = createPublicThinEntrypointCutoverService(options);
  const routerAdapterDelegationService = createPublicRouterAdapterDelegationService(options);

  return Object.freeze({
    publicModularRuntimePackageInclusionPlan: modularRuntimePackageInclusionService.publicModularRuntimePackageInclusionPlan,
    publicModularRuntimePackageInclusionPlanCheck: modularRuntimePackageInclusionService.publicModularRuntimePackageInclusionPlanCheck,
    publicPackagedRouterPortInclusion: packagedRouterPortInclusionService.publicPackagedRouterPortInclusion,
    publicPackagedRouterPortInclusionCheck: packagedRouterPortInclusionService.publicPackagedRouterPortInclusionCheck,
    publicThinEntrypointRouterCutoverRehearsal: thinEntrypointRehearsalService.publicThinEntrypointRouterCutoverRehearsal,
    publicThinEntrypointRouterCutoverRehearsalCheck: thinEntrypointRehearsalService.publicThinEntrypointRouterCutoverRehearsalCheck,
    publicThinEntrypointRouterCutoverApplication: thinEntrypointCutoverService.publicThinEntrypointRouterCutoverApplication,
    publicThinEntrypointRouterCutoverApplicationCheck: thinEntrypointCutoverService.publicThinEntrypointRouterCutoverApplicationCheck,
    publicRouterCommandAdapterDelegationExpansion: routerAdapterDelegationService.publicRouterCommandAdapterDelegationExpansion,
    publicRouterCommandAdapterDelegationExpansionCheck: routerAdapterDelegationService.publicRouterCommandAdapterDelegationExpansionCheck
  });
}

module.exports = Object.freeze({
  createPublicRouterCutoverService
});
