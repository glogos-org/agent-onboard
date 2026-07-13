'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createClosedGatePruneApplyRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, publicClosedGateArtifactFiles, publicClosedGateArchiveReaderCheck, publicFullTestRunnerCompletionCheck, publicClosedGateRawArtifactPruneApplyAdmitted, publicClosedGateRawArtifactPruneApplyIndexState, publicClosedGateRawArtifactPruneDryRunCheck } = ctx;

const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W13'].join(''),
  work_item_id: ['P1S3M6', 'W14'].join(''),
  title: 'Public closed gate raw artifact prune apply admission gate',
  surface_id: 'closed-gate-raw-artifact-prune-apply-admission',
  command: 'agent-onboard release --closed-gates-prune-apply',
  check_command: 'agent-onboard release --closed-gates-prune-apply-check',
  artifact_file: '.agent-onboard/public-closed-gate-raw-artifact-prune-apply-admission.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_candidate_count: 30,
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    deletes_raw_gate_artifacts: true,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    preserves_archive: true,
    preserves_index: true,
    raw_artifact_content_inlined: false,
    archive_record_content_inlined: false,
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

function publicClosedGateRawArtifactPruneApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateRawArtifactPruneApply(root = packageRoot()) {
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const state = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const liveRawGateArtifacts = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const indexedCount = state.index_raw_artifact_count;
  const remainingCount = state.remaining_indexed_paths.length;
  const prunedCount = Math.max(0, indexedCount - remainingCount);
  const dryRunCheck = publicClosedGateRawArtifactPruneDryRunCheck(root);
  const readerCheck = publicClosedGateArchiveReaderCheck(root);
  const fullTestRunnerCheck = publicFullTestRunnerCompletionCheck(root);
  const indexRecovery = state.index_recovery || {};
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    milestone_id: plan.milestone_id,
    prerequisite_work_item_id: plan.prerequisite_work_item_id,
    work_item_id: plan.work_item_id,
    title: plan.title,
    command: plan.command,
    check_command: plan.check_command,
    package_root: root,
    package_context: context,
    surface_id: plan.surface_id,
    prerequisite_checks: Object.freeze({
      prune_dry_run_check: dryRunCheck.status,
      closed_gate_archive_reader_check: readerCheck.status,
      full_test_runner_completion_check: fullTestRunnerCheck.status
    }),
    applied: installedContext || (state.artifact_present === true && indexedCount >= plan.minimum_candidate_count && remainingCount === 0 && state.archive_paths_match_index === true && state.archive_file_ids_match_index === true),
    raw_gate_artifacts_pruned: installedContext || remainingCount === 0,
    artifact: Object.freeze({
      path: plan.artifact_file,
      present: state.artifact_present,
      content_inlined: false
    }),
    index: Object.freeze({
      path: plan.index_path,
      present: state.index_present,
      status: state.index_status,
      parse_error: state.index_parse_error,
      file_id: state.index_file_id,
      record_count: state.index_record_count,
      raw_artifact_count: indexedCount,
      archive_file_id: state.index_archive_file_id,
      recovery: indexRecovery,
      content_inlined: false
    }),
    archive: Object.freeze({
      path: plan.archive_path,
      present: state.archive_present,
      file_id: state.archive_file_id,
      record_count: state.archive_record_count,
      parse_error_count: state.archive_parse_error_count,
      content_inlined: false
    }),
    prune_application: Object.freeze({
      candidate_count: indexedCount,
      pruned_candidate_count: prunedCount,
      remaining_indexed_raw_artifact_count: remainingCount,
      remaining_live_raw_gate_artifact_count: liveRawGateArtifacts.length,
      deleted_candidate_paths: state.indexed_paths,
      deleted_candidate_file_ids: state.indexed_file_ids,
      remaining_indexed_paths: state.remaining_indexed_paths,
      deleted_path_content_inlined: false,
      archive_paths_match_index: state.archive_paths_match_index,
      archive_file_ids_match_index: state.archive_file_ids_match_index,
      index_archive_digest_matches_archive: state.index_archive_file_id === state.archive_file_id,
      archive_retains_recovery_records: state.archive_record_count === indexedCount,
      index_declares_pruned_state: indexRecovery.raw_artifacts_pruned === true,
      index_declares_prune_apply_artifact: indexRecovery.prune_apply_artifact_file === plan.artifact_file,
      raw_artifact_content_inlined: false,
      archive_record_content_inlined: false
    }),
    recovery: Object.freeze({
      archive_preserved: state.archive_present === true,
      index_preserved: state.index_present === true,
      archive_records_replay_deleted_raw_file_ids: state.archive_file_ids_match_index === true,
      archive_records_replay_deleted_raw_paths: state.archive_paths_match_index === true,
      raw_gate_artifacts_restorable_from_archive: state.archive_file_ids_match_index === true && state.archive_paths_match_index === true,
      restore_requires_explicit_future_restore_gate: true,
      content_inlined: false
    }),
    boundary: plan.boundary
  });
}

function publicClosedGateRawArtifactPruneApplyCheck(root = packageRoot()) {
  const result = publicClosedGateRawArtifactPruneApply(root);
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY;
  const milestone = publicClosedGateRawArtifactPruneApplyMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const errors = [];
  if (result.prerequisite_checks.prune_dry_run_check !== 'ok') errors.push('raw artifact prune apply requires prune dry-run check to pass');
  if (result.prerequisite_checks.closed_gate_archive_reader_check !== 'ok') errors.push('raw artifact prune apply requires archive reader check to pass');
  if (result.prerequisite_checks.full_test_runner_completion_check !== 'ok') errors.push('raw artifact prune apply requires full-test runner completion check to pass');
  if (!installedContext && result.artifact.present !== true) errors.push(`${plan.artifact_file} must exist after W14 closes`);
  if (!installedContext && result.index.present !== true) errors.push(`${plan.index_path} must remain present after raw artifact prune apply`);
  if (!installedContext && result.index.status !== 'present_valid_json') errors.push(`${plan.index_path} must parse as JSON after raw artifact prune apply`);
  if (!installedContext && result.archive.present !== true) errors.push(`${plan.archive_path} must remain present after raw artifact prune apply`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed-gates archive must parse after raw artifact prune apply');
  if (!installedContext && result.index.record_count < plan.minimum_candidate_count) errors.push(`raw artifact prune apply requires at least ${plan.minimum_candidate_count} archived records`);
  if (!installedContext && result.archive.record_count !== result.index.record_count) errors.push('archive record count must match index record count after prune apply');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('index archive digest must match archive after prune apply');
  if (!installedContext && result.prune_application.candidate_count !== result.index.raw_artifact_count) errors.push('candidate count must match index raw artifact count after prune apply');
  if (!installedContext && result.prune_application.pruned_candidate_count !== result.prune_application.candidate_count) errors.push('every indexed raw gate artifact candidate must be pruned');
  if (!installedContext && result.prune_application.remaining_indexed_raw_artifact_count !== 0) errors.push('no indexed raw gate artifact may remain after prune apply');
  if (!installedContext && result.prune_application.archive_paths_match_index !== true) errors.push('archive record paths must replay indexed raw artifact paths after prune apply');
  if (!installedContext && result.prune_application.archive_file_ids_match_index !== true) errors.push('archive record file ids must replay indexed raw artifact file ids after prune apply');
  if (!installedContext && result.prune_application.index_archive_digest_matches_archive !== true) errors.push('closed gate index digest must match archive after prune apply');
  if (!installedContext && result.prune_application.index_declares_pruned_state !== true) errors.push('closed gate index recovery state must declare raw_artifacts_pruned');
  if (!installedContext && result.prune_application.index_declares_prune_apply_artifact !== true) errors.push('closed gate index recovery state must name the prune apply artifact');
  if (!installedContext && result.applied !== true) errors.push('raw artifact prune apply admission state must be applied');
  if (result.boundary.repository_write_admitted_by_gate !== true || result.boundary.deletes_raw_gate_artifacts !== true) errors.push('W14 must explicitly admit raw gate artifact deletion');
  if (result.boundary.moves_raw_gate_artifacts !== false || result.boundary.rewrites_raw_gate_artifacts !== false) errors.push('W14 must not move or rewrite raw gate artifacts');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('raw artifact prune apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('raw artifact prune apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${plan.milestone_id} must remain open during W14`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${plan.prerequisite_work_item_id} must be closed before W14 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${plan.work_item_id} must be closed by W14`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: plan.check_command,
    apply_command: plan.command,
    package_root: root,
    validated: Object.freeze({
      prune_dry_run_check_passes: result.prerequisite_checks.prune_dry_run_check === 'ok',
      archive_reader_check_passes: result.prerequisite_checks.closed_gate_archive_reader_check === 'ok',
      full_test_runner_check_passes: result.prerequisite_checks.full_test_runner_completion_check === 'ok',
      apply_artifact_present: installedContext || result.artifact.present === true,
      index_present_valid_json: installedContext || (result.index.present === true && result.index.status === 'present_valid_json'),
      archive_present_and_parses: installedContext || (result.archive.present === true && result.archive.parse_error_count === 0),
      archive_record_count_matches_index: installedContext || result.archive.record_count === result.index.record_count,
      index_archive_digest_matches_archive: installedContext || result.index.archive_file_id === result.archive.file_id,
      all_indexed_raw_artifacts_pruned: installedContext || result.prune_application.remaining_indexed_raw_artifact_count === 0,
      archive_replays_deleted_paths: installedContext || result.prune_application.archive_paths_match_index === true,
      archive_replays_deleted_file_ids: installedContext || result.prune_application.archive_file_ids_match_index === true,
      index_declares_pruned_state: installedContext || result.prune_application.index_declares_pruned_state === true,
      recovery_path_preserved: installedContext || result.recovery.raw_gate_artifacts_restorable_from_archive === true,
      deletion_admitted_by_gate: result.boundary.repository_write_admitted_by_gate === true && result.boundary.deletes_raw_gate_artifacts === true,
      no_move_or_rewrite: result.boundary.moves_raw_gate_artifacts === false && result.boundary.rewrites_raw_gate_artifacts === false,
      commands_are_read_only_verifiers: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    apply: result,
    milestone_state: milestone,
    boundary: plan.boundary,
    errors
  });
}

function publicClosedGateRawArtifactPruneApplyText(result = publicClosedGateRawArtifactPruneApply()) {
  const lines = [
    `agent-onboard closed gate raw artifact prune apply admission ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Prune application:',
    `- candidates: ${result.prune_application.candidate_count}`,
    `- pruned: ${result.prune_application.pruned_candidate_count}`,
    `- remaining indexed raw artifacts: ${result.prune_application.remaining_indexed_raw_artifact_count}`,
    '',
    'Recovery:',
    `- archive preserved: ${result.recovery.archive_preserved}`,
    `- index preserved: ${result.recovery.index_preserved}`,
    `- restorable from archive: ${result.recovery.raw_gate_artifacts_restorable_from_archive}`,
    '',
    'Boundary:',
    `- deletion admitted: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  return `${lines.join('\n')}\n`;
}


  return Object.freeze({
    PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_APPLY,
    publicClosedGateRawArtifactPruneApply,
    publicClosedGateRawArtifactPruneApplyCheck,
    publicClosedGateRawArtifactPruneApplyText,
  });
}

module.exports = Object.freeze({
  createClosedGatePruneApplyRuntime
});
