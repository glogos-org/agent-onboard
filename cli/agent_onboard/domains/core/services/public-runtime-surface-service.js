'use strict';

const { commandSurfaceService } = require('./runtime-surface/command-surface-service');
const { operatorGuideService } = require('./runtime-surface/operator-guide-service');
const { quickstartService } = require('./runtime-surface/quickstart-service');
const { discoveryService } = require('./runtime-surface/discovery-service');
const { createDryRunService } = require('./runtime-surface/create-dry-run-service');
const { issueIntakeService } = require('./runtime-surface/issue-intake-service');
const { contributorAdmissionService } = require('./runtime-surface/contributor-admission-service');
const { ciSurfaceService } = require('./runtime-surface/ci-surface-service');

module.exports = Object.freeze({
  commandSurfaceService,
  operatorGuideService,
  quickstartService,
  discoveryService,
  createDryRunService,
  issueIntakeService,
  contributorAdmissionService,
  ciSurfaceService
});
