'use strict';

function createPublicCoreSurfaceCommandRunnerService(options = Object.freeze({})) {
  const VERSION = options.VERSION;
  const RELEASE_LINE = options.RELEASE_LINE;
  const PUBLIC_RELEASE_CONTRACT = options.PUBLIC_RELEASE_CONTRACT || Object.freeze({ release_line: RELEASE_LINE });
  const PRODUCT_HELP_LINES = Array.isArray(options.PRODUCT_HELP_LINES) ? options.PRODUCT_HELP_LINES : [];
  const OUTPUT_FLAG = options.OUTPUT_FLAG || Object.freeze({ json: '--json', text: '--text' });
  const json = typeof options.json === 'function' ? options.json : () => { throw new Error('json writer required'); };
  const writeText = typeof options.writeText === 'function' ? options.writeText : () => { throw new Error('text writer required'); };
  const packageRoot = typeof options.packageRoot === 'function' ? options.packageRoot : () => process.cwd();
  const commandSurfaceService = options.commandSurfaceService;
  const operatorGuideService = options.operatorGuideService;
  const quickstartService = options.quickstartService;
  const discoveryService = options.discoveryService;
  const createDryRunService = options.createDryRunService;
  const issueIntakeService = options.issueIntakeService;
  const contributorAdmissionService = options.contributorAdmissionService;
  const ciSurfaceService = options.ciSurfaceService;
  const checkPlanFastService = options.checkPlanFastService;

  function optionError(schema, commandFamily, message, status = 'error') {
    json({
      schema,
      status,
      command_family: commandFamily,
      message,
      writes_files: false,
      publishes_package: false
    });
  }

  function help() {
    writeText(`agent-onboard ${VERSION}\n\n${PRODUCT_HELP_LINES.join('\n')}\n`);
    return 0;
  }

  function printVersion() {
    writeText(`${VERSION}\n`);
    return 0;
  }

  function runStatus() {
    json({ schema: 'agent-onboard-status-001', status: 'ok', version: VERSION, release_line: PUBLIC_RELEASE_CONTRACT.release_line });
    return 0;
  }

  function runCommands(args = []) {
    const wantsJson = args.includes(OUTPUT_FLAG.json);
    const wantsText = args.includes(OUTPUT_FLAG.text) || !wantsJson;
    if (wantsJson && wantsText && args.includes(OUTPUT_FLAG.text)) {
      optionError('agent-onboard-public-command-surface-error-001', 'commands', 'commands accepts either --json or --text, not both');
      return 1;
    }
    if (args.some((arg) => ![OUTPUT_FLAG.json, OUTPUT_FLAG.text].includes(arg))) {
      optionError('agent-onboard-public-command-surface-error-001', 'commands', 'commands supports only --json or --text');
      return 1;
    }
    if (wantsJson) json(commandSurfaceService.catalog());
    else writeText(commandSurfaceService.text());
    return 0;
  }

  function runGuide(args = []) {
    const wantsJson = args.includes(OUTPUT_FLAG.json);
    const wantsText = args.includes(OUTPUT_FLAG.text) || !wantsJson;
    if (wantsJson && wantsText && args.includes(OUTPUT_FLAG.text)) {
      optionError('agent-onboard-public-operator-guide-error-001', 'guide', 'guide accepts either --json or --text, not both');
      return 1;
    }
    if (args.some((arg) => ![OUTPUT_FLAG.json, OUTPUT_FLAG.text].includes(arg))) {
      optionError('agent-onboard-public-operator-guide-error-001', 'guide', 'guide supports only --json or --text');
      return 1;
    }
    if (wantsJson) json(operatorGuideService.catalog());
    else writeText(operatorGuideService.text());
    return 0;
  }

  function runQuickstart(args = []) {
    const allowed = [OUTPUT_FLAG.json, OUTPUT_FLAG.text, '--dry-run'];
    const selected = args.filter((arg) => allowed.includes(arg));
    if (args.some((arg) => !allowed.includes(arg))) {
      optionError('agent-onboard-public-quickstart-error-001', 'quickstart', 'quickstart supports only --json, --text, or --dry-run');
      return 1;
    }
    if (selected.length > 1) {
      optionError('agent-onboard-public-quickstart-error-001', 'quickstart', 'quickstart accepts only one output mode: --json, --text, or --dry-run');
      return 1;
    }
    const mode = selected[0] || OUTPUT_FLAG.text;
    if (mode === OUTPUT_FLAG.json || mode === '--dry-run') json(quickstartService.catalog());
    else writeText(quickstartService.text());
    return 0;
  }

  function runDiscovery(args = []) {
    const allowed = ['--llms', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
    const selected = args.filter((arg) => allowed.includes(arg));
    if (args.some((arg) => !allowed.includes(arg))) {
      optionError('agent-onboard-public-ai-discovery-error-001', 'discovery', 'discovery supports only --llms, --json, or --text');
      return 1;
    }
    if (selected.length > 1) {
      optionError('agent-onboard-public-ai-discovery-error-001', 'discovery', 'discovery accepts only one output mode: --llms, --json, or --text');
      return 1;
    }
    const mode = selected[0] || OUTPUT_FLAG.text;
    if (mode === '--llms') writeText(discoveryService.llms());
    else if (mode === OUTPUT_FLAG.json) json(discoveryService.catalog());
    else writeText(discoveryService.text());
    return 0;
  }

  function runCreate(args = []) {
    const allowed = ['--dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
    const selected = args.filter((arg) => allowed.includes(arg));
    if (args.some((arg) => !allowed.includes(arg))) {
      json({
        schema: 'agent-onboard-public-create-dry-run-error-001',
        status: 'not_admitted',
        command_family: 'create',
        message: 'create supports only --dry-run, --json, or --text in this public gate',
        reason: 'create --write, init, dependency installation, target scanning, managed-project command execution, Git mutation, and npm publish require later explicit gates.',
        writes_files: false,
        publishes_package: false
      });
      return 2;
    }
    if (selected.length > 1) {
      optionError('agent-onboard-public-create-dry-run-error-001', 'create', 'create accepts only one output mode: --dry-run, --json, or --text');
      return 1;
    }
    const mode = selected[0] || '--dry-run';
    if (mode === OUTPUT_FLAG.text) writeText(createDryRunService.text());
    else json(createDryRunService.catalog());
    return 0;
  }

  function runIssue(args = []) {
    const hasClassify = args.includes('--classify-dry-run');
    const wantsJson = args.includes(OUTPUT_FLAG.json);
    const wantsText = args.includes(OUTPUT_FLAG.text);
    if (!hasClassify) {
      json({
        schema: 'agent-onboard-public-issue-intake-error-001',
        status: 'not_admitted',
        command_family: 'issue',
        message: 'issue requires --classify-dry-run in this public gate',
        reason: 'GitHub API access, issue import, issue mutation, canonical work item creation, and claim admission require later explicit gates.',
        writes_files: false,
        publishes_package: false
      });
      return 2;
    }
    if (wantsJson && wantsText) {
      optionError('agent-onboard-public-issue-intake-error-001', 'issue', 'issue accepts either --json or --text, not both');
      return 1;
    }
    const parsed = issueIntakeService.input(args);
    if (parsed.error) {
      optionError('agent-onboard-public-issue-intake-error-001', 'issue', parsed.error);
      return 1;
    }
    const result = issueIntakeService.classify(parsed.input);
    if (wantsText) writeText(issueIntakeService.text(result));
    else json(result);
    return 0;
  }

  function runContributor(args = []) {
    const hasAdmission = args.includes('--admission-dry-run');
    const wantsJson = args.includes(OUTPUT_FLAG.json);
    const wantsText = args.includes(OUTPUT_FLAG.text);
    if (!hasAdmission) {
      json({
        schema: 'agent-onboard-public-contributor-admission-error-001',
        status: 'not_admitted',
        command_family: 'contributor',
        message: 'contributor requires --admission-dry-run in this public gate',
        reason: 'Contributor ledger writes, external identity verification, GitHub API access, Git mutation, claim admission, and repository scans require later explicit gates.',
        writes_files: false,
        publishes_package: false
      });
      return 2;
    }
    if (wantsJson && wantsText) {
      optionError('agent-onboard-public-contributor-admission-error-001', 'contributor', 'contributor accepts either --json or --text, not both');
      return 1;
    }
    const parsed = contributorAdmissionService.input(args);
    if (parsed.error) {
      optionError('agent-onboard-public-contributor-admission-error-001', 'contributor', parsed.error);
      return 1;
    }
    const result = contributorAdmissionService.preview(parsed.input);
    if (wantsText) writeText(contributorAdmissionService.text(result));
    else json(result);
    return 0;
  }

  function runCi(args = []) {
    const allowed = ['--github-action', OUTPUT_FLAG.json, OUTPUT_FLAG.text];
    const selected = args.filter((arg) => allowed.includes(arg));
    if (args.some((arg) => !allowed.includes(arg))) {
      optionError('agent-onboard-public-ci-surface-error-001', 'ci', 'ci supports only --github-action, --json, or --text');
      return 1;
    }
    if (selected.length > 1) {
      optionError('agent-onboard-public-ci-surface-error-001', 'ci', 'ci accepts only one output mode: --github-action, --json, or --text');
      return 1;
    }
    const mode = selected[0] || OUTPUT_FLAG.text;
    if (mode === '--github-action') writeText(ciSurfaceService.githubAction());
    else if (mode === OUTPUT_FLAG.json) json(ciSurfaceService.catalog());
    else writeText(ciSurfaceService.text());
    return 0;
  }

  function runCheck(args = []) {
    const hasPlan = args.includes('--plan');
    const hasFast = args.includes('--fast');
    const wantsJson = args.includes(OUTPUT_FLAG.json);
    const wantsText = args.includes(OUTPUT_FLAG.text);
    const wantsProgressJsonl = args.includes('--progress-jsonl');
    const allowed = new Set(['--plan', '--fast', '--progress-jsonl', OUTPUT_FLAG.json, OUTPUT_FLAG.text]);
    const unknown = args.filter((arg) => !allowed.has(arg));
    if (unknown.length > 0) {
      optionError('agent-onboard-public-check-plan-fast-error-001', 'check', `check does not support: ${unknown.join(', ')}`);
      return 1;
    }
    if (wantsProgressJsonl && !hasFast) {
      optionError('agent-onboard-public-check-plan-fast-error-001', 'check', 'check --progress-jsonl is only supported with --fast');
      return 1;
    }
    if (hasPlan && hasFast) {
      optionError('agent-onboard-public-check-plan-fast-error-001', 'check', 'check accepts exactly one primary mode: --plan or --fast');
      return 1;
    }
    if (wantsJson && wantsText) {
      optionError('agent-onboard-public-check-plan-fast-error-001', 'check', 'check accepts either --json or --text, not both');
      return 1;
    }
    const mode = hasFast ? '--fast' : '--plan';
    const outputText = wantsText || (!wantsJson && mode === '--plan');
    if (mode === '--plan') {
      const plan = checkPlanFastService.plan();
      if (outputText) writeText(checkPlanFastService.planText(plan));
      else json(plan);
      return 0;
    }
    const result = checkPlanFastService.fast(packageRoot(), { progressJsonl: wantsProgressJsonl });
    if (outputText) writeText(checkPlanFastService.fastText(result));
    else json(result);
    return result.status === 'ok' ? 0 : 1;
  }

  return Object.freeze({
    help,
    printVersion,
    runStatus,
    runCommands,
    runGuide,
    runQuickstart,
    runDiscovery,
    runCreate,
    runIssue,
    runContributor,
    runCheck,
    runCi
  });
}

module.exports = Object.freeze({
  createPublicCoreSurfaceCommandRunnerService
});
