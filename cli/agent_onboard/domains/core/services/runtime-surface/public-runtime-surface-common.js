'use strict';

const path = require('path');
const { OUTPUT_FLAG, PACKAGE_NAME, PRODUCT_HELP_LINES, RELEASE_LINE, ROUTER_COMMAND_ORDER, RUNTIME_COMMAND_GROUP, TOP_LEVEL_COMMAND_ALIAS } = require('../../../../runtime-contracts');
const VERSION = require('../../../../../../package.json').version;

function packageRoot() {
  return path.resolve(__dirname, '../../../../../..');
}

function discoveryFirstReadOrder() {
  return [
    'AGENTS.md',
    'SOURCE_OF_TRUTH.md',
    '.agent-onboard/authority-path.json',
    '.agent-onboard/authority-index.json',
    'llms.txt',
    'package.json',
    'authority-map.json',
    'manifest.json',
    '.agent-onboard/target.json',
    '.agent-onboard/runtime-namespace.json',
    '.agent-onboard/project.json',
    '.agent-onboard/work-items.json',
    'README.md'
  ];
}

function discoveryStableCommands() {
  return [
    'agent-onboard discovery --llms',
    'agent-onboard discovery --text',
    'agent-onboard discovery --json',
    'agent-onboard create --dry-run',
    'agent-onboard issue --classify-dry-run --text',
    'agent-onboard contributor --admission-dry-run --text',
    'agent-onboard contracts --text',
    'agent-onboard contracts --check --json',
    'agent-onboard contracts --validate-output --contract <id> --file <path> --json',
    'agent-onboard check --plan --text',
    'agent-onboard check --fast --text',
    'agent-onboard ci --github-action',
    'agent-onboard mcp --plan --text',
    'agent-onboard guide --text',
    'agent-onboard quickstart --text',
    'agent-onboard commands --text',
    'agent-onboard target doctor --text',
    'agent-onboard target governance --text',
    'agent-onboard target governance --budget-contract --text',
    'agent-onboard target governance --budget-check --text',
    'agent-onboard target governance --materialize-dry-run --text',
    'agent-onboard target onboarding --plan',
    'agent-onboard work-items --next --text',
    'agent-onboard release --source-manifest',
    'agent-onboard release --clean-inventory',
    'agent-onboard release --clean-check',
    'agent-onboard release --clean-catalog',
    'agent-onboard release --clean-catalog-check',
    'agent-onboard release --keyword-taxonomy',
    'agent-onboard release --keyword-taxonomy-check',
    'agent-onboard release --readme-plan',
    'agent-onboard release --readme-plan-check',
    'agent-onboard release --readme-dry-run',
    'agent-onboard release --readme-dry-run-check',
    'agent-onboard release --readme-apply',
    'agent-onboard release --readme-apply-check',
    'agent-onboard release --closed-gates-plan',
    'agent-onboard release --closed-gates-plan-check',
    'agent-onboard release --closed-gates-dry-run',
    'agent-onboard release --closed-gates-dry-run-check',
    'agent-onboard release --closed-gates-apply',
    'agent-onboard release --closed-gates-apply-check',
    'agent-onboard release --closed-gates-read',
    'agent-onboard release --closed-gates-read-check',
    'agent-onboard release --closed-gates-prune-plan',
    'agent-onboard release --closed-gates-prune-plan-check',
    'agent-onboard release --closed-gates-prune-dry-run',
    'agent-onboard release --closed-gates-prune-dry-run-check',
    'agent-onboard release --full-test-runner',
    'agent-onboard release --full-test-runner-check',
    'agent-onboard authority --index',
    'agent-onboard authority --index-check',
    'agent-onboard authority --state',
    'agent-onboard authority --state-check',
    'agent-onboard release --check'
  ];
}

module.exports = Object.freeze({
  OUTPUT_FLAG,
  PACKAGE_NAME,
  PRODUCT_HELP_LINES,
  RELEASE_LINE,
  ROUTER_COMMAND_ORDER,
  RUNTIME_COMMAND_GROUP,
  TOP_LEVEL_COMMAND_ALIAS,
  VERSION,
  packageRoot,
  discoveryFirstReadOrder,
  discoveryStableCommands
});
