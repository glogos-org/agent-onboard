'use strict';

const fs = require('fs');
const path = require('path');

function createPublicFullTestRunnerService(options = Object.freeze({})) {
  const {
    PACKAGE_NAME,
    VERSION,
    RELEASE_LINE,
    packageRoot,
    readJson,
    sourceContext,
    publicClosedGateRawArtifactPruneApplyAdmitted
  } = options;

  const PUBLIC_FULL_TEST_RUNNER_COMPLETION = Object.freeze({
    schema: 'agent-onboard-public-full-test-runner-completion-001',
    package_name: PACKAGE_NAME,
    release_line: RELEASE_LINE,
    milestone_id: 'P1S3M6',
    prerequisite_work_item_id: ['P1S3M6', 'W10'].join(''),
    work_item_id: ['P1S3M6', 'W11'].join(''),
    title: 'Public full-test runner completion compaction gate',
    surface_id: 'full-test-runner-completion',
    command: 'agent-onboard release --full-test-runner',
    check_command: 'agent-onboard release --full-test-runner-check',
    artifact_file: '.agent-onboard/public-full-test-runner-completion-compaction-gate.json',
    boundary: Object.freeze({
      writes_files: false,
      executes_tests_inside_checker: false,
      deletes_raw_gate_artifacts: false,
      moves_raw_gate_artifacts: false,
      mutates_work_items: false,
      mutates_claims: false,
      mutates_git: false,
      installs_dependencies: false,
      runs_package_manager: false,
      publishes_package: false,
      mutates_registry: false,
      network: false
    })
  });

  function milestoneState(root = packageRoot()) {
    const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
    if (!fs.existsSync(ledgerPath)) {
      return Object.freeze({
        ledger_present: false,
        milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
        prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
        work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
        milestone_status: 'not_present_installed_context_allowed',
        prerequisite_work_item_status: 'not_present_installed_context_allowed',
        work_item_status: 'not_present_installed_context_allowed'
      });
    }
    let ledger = null;
    try { ledger = readJson(ledgerPath); } catch { ledger = null; }
    const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
    const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
    const milestone = milestones.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id) || null;
    const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id) || null;
    const workItem = workItems.find((item) => item.id === PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id) || null;
    return Object.freeze({
      ledger_present: true,
      milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
      prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
      work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
      milestone_status: milestone ? milestone.status : 'missing',
      prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
      work_item_status: workItem ? workItem.status : 'missing',
      milestone_title: milestone ? milestone.title : null,
      prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
      work_item_title: workItem ? workItem.title : null
    });
  }

  function completion(root = packageRoot()) {
    const runnerPath = path.join(root, 'test', 'run-tests.js');
    const sourceTestPath = path.join(root, 'test', 'agent-onboard.test.js');
    const artifactPath = path.join(root, PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file);
    const runnerText = fs.existsSync(runnerPath) ? fs.readFileSync(runnerPath, 'utf8') : '';
    const sourceTestText = fs.existsSync(sourceTestPath) ? fs.readFileSync(sourceTestPath, 'utf8') : '';
    const taskTimeout = Number.parseInt(process.env.AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS || '', 10) || 180000;
    return Object.freeze({
      schema: 'agent-onboard-public-full-test-runner-completion-result-001',
      status: 'ok',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      milestone_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id,
      prerequisite_work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id,
      work_item_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id,
      title: PUBLIC_FULL_TEST_RUNNER_COMPLETION.title,
      command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.command,
      check_command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.check_command,
      package_root: root,
      surface_id: PUBLIC_FULL_TEST_RUNNER_COMPLETION.surface_id,
      artifact: Object.freeze({
        path: PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file,
        present: fs.existsSync(artifactPath),
        content_inlined: false
      }),
      runner_contract: Object.freeze({
        official_command: 'npm run test:full',
        full_runner_script: 'node test/run-tests.js full',
        default_shard_count: 163,
        default_full_concurrency: 1,
        per_task_timeout_ms: taskTimeout,
        case_mode_env: 'AGENT_ONBOARD_FULL_TEST_CASE_MODE=1',
        shard_mode_default: true,
        runs_tests_inside_checker: false
      }),
      observed_source: Object.freeze({
        runner_file_present: fs.existsSync(runnerPath),
        source_test_file_present: fs.existsSync(sourceTestPath),
        exit_event_completion: /child\.on\('exit'/.test(runnerText) && /finish\(status, signal\)/.test(runnerText),
        stdio_close_not_required_for_full_source_tasks: /captureOutput: false/.test(runnerText) && /stdio: task\.captureOutput === false \? 'ignore'/.test(runnerText),
        per_task_timeout_configured: /AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS/.test(runnerText) && /task timeout after/.test(runnerText),
        output_capture_disabled_for_full_tasks: /captureOutput: false/.test(runnerText),
        temp_cleanup_available: /cleanupFullSourceTempDirs/.test(runnerText),
        per_case_diagnostic_mode: /--only-index=/.test(runnerText) && /AGENT_ONBOARD_FULL_TEST_CASE_MODE/.test(runnerText),
        selected_test_only_index_supported: /--only-index=/.test(sourceTestText),
        selected_test_exclude_index_supported: /--exclude-index=/.test(sourceTestText),
        selected_test_force_exit: /FULL_SOURCE_FORCE_EXIT/.test(sourceTestText) && /process\.exit\(0\)/.test(sourceTestText)
      }),
      boundary: PUBLIC_FULL_TEST_RUNNER_COMPLETION.boundary
    });
  }

  function completionCheck(root = packageRoot()) {
    const result = completion(root);
    const milestone = milestoneState(root);
    const installedContext = sourceContext(root).package_context === 'installed_package';
    const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
    const errors = [];
    if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.artifact_file} must exist after W11 closes`);
    if (!installedContext && result.observed_source.runner_file_present !== true) errors.push('test/run-tests.js must be present');
    if (!installedContext && result.observed_source.source_test_file_present !== true) errors.push('test/agent-onboard.test.js must be present');
    if (!installedContext && result.observed_source.exit_event_completion !== true) errors.push('full runner must resolve on child process exit instead of waiting only for stdio close');
    if (!installedContext && result.observed_source.stdio_close_not_required_for_full_source_tasks !== true) errors.push('full source tasks must not require captured stdio close for completion');
    if (!installedContext && result.observed_source.per_task_timeout_configured !== true) errors.push('full runner must keep explicit per-task timeout failures');
    if (!installedContext && result.observed_source.output_capture_disabled_for_full_tasks !== true) errors.push('full source tasks must disable output capture by default');
    if (!installedContext && result.observed_source.temp_cleanup_available !== true) errors.push('full runner must expose temporary directory cleanup for full-source shards');
    if (!installedContext && result.observed_source.per_case_diagnostic_mode !== true) errors.push('full runner must retain per-case diagnostic mode');
    if (!installedContext && result.observed_source.selected_test_only_index_supported !== true) errors.push('full source test must support --only-index');
    if (!installedContext && result.observed_source.selected_test_exclude_index_supported !== true) errors.push('full source test must support --exclude-index');
    if (!installedContext && result.observed_source.selected_test_force_exit !== true) errors.push('full source test must force deterministic successful selected-test exit');
    if (result.boundary.executes_tests_inside_checker !== false) errors.push('full-test-runner check must not execute the test suite inside release check');
    if (milestone.ledger_present) {
      if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.milestone_id} must remain open during W11`);
      if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.prerequisite_work_item_id} must be closed before W11 passes`);
      if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_FULL_TEST_RUNNER_COMPLETION.work_item_id} must be closed by W11`);
    }
    return Object.freeze({
      schema: 'agent-onboard-public-full-test-runner-completion-check-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.check_command,
      runner_command: PUBLIC_FULL_TEST_RUNNER_COMPLETION.command,
      package_root: root,
      validated: Object.freeze({
        runner_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
        exit_event_completion: result.observed_source.exit_event_completion === true,
        stdio_close_not_required_for_full_source_tasks: result.observed_source.stdio_close_not_required_for_full_source_tasks === true,
        full_source_output_capture_disabled: result.observed_source.output_capture_disabled_for_full_tasks === true,
        per_task_timeout_configured: result.observed_source.per_task_timeout_configured === true,
        temp_cleanup_available: result.observed_source.temp_cleanup_available === true,
        per_case_diagnostic_mode: result.observed_source.per_case_diagnostic_mode === true,
        selected_test_only_index_supported: result.observed_source.selected_test_only_index_supported === true,
        selected_test_exclude_index_supported: result.observed_source.selected_test_exclude_index_supported === true,
        selected_test_force_exit: result.observed_source.selected_test_force_exit === true,
        checker_does_not_execute_tests: result.boundary.executes_tests_inside_checker === false,
        m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
        prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
        current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
      }),
      runner: result,
      milestone_state: milestone,
      boundary: PUBLIC_FULL_TEST_RUNNER_COMPLETION.boundary,
      errors
    });
  }

  function completionText(result = completion()) {
    const lines = [
      `agent-onboard full-test runner completion ${result.version}`,
      `Status: ${result.status}`,
      `Command: ${result.command}`,
      '',
      'Runner contract:',
      `- official command: ${result.runner_contract.official_command}`,
      `- default shards: ${result.runner_contract.default_shard_count}`,
      `- default concurrency: ${result.runner_contract.default_full_concurrency}`,
      `- per-task timeout: ${result.runner_contract.per_task_timeout_ms}ms`,
      '',
      'Boundary:',
      `- checker runs tests: ${result.boundary.executes_tests_inside_checker}`,
      `- writes files: ${result.boundary.writes_files}`,
      `- publishes package: ${result.boundary.publishes_package}`
    ];
    return `${lines.join('\n')}\n`;
  }

  return Object.freeze({
    contract: PUBLIC_FULL_TEST_RUNNER_COMPLETION,
    milestoneState,
    completion,
    completionCheck,
    completionText
  });
}

module.exports = Object.freeze({
  createPublicFullTestRunnerService
});
