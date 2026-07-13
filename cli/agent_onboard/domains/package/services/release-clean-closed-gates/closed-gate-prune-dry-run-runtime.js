'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createClosedGatePruneDryRunRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, publicClosedGateArtifactFiles, publicClosedGateArchiveReaderCheck, publicFullTestRunnerCompletionCheck, publicClosedGateRawArtifactPruneApplyAdmitted, publicClosedGateRawArtifactPruneApplyIndexState, publicClosedGateRawArtifactPrunePlanningCheck, readPublicClosedGateArchiveJsonl, textFileId } = ctx;

const PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W12'].join(''),
  work_item_id: ['P1S3M6', 'W13'].join(''),
  title: 'Public closed gate raw artifact prune dry-run gate',
  surface_id: 'closed-gate-raw-artifact-prune-dry-run',
  command: 'agent-onboard release --closed-gates-prune-dry-run',
  check_command: 'agent-onboard release --closed-gates-prune-dry-run-check',
  artifact_file: '.agent-onboard/public-closed-gate-raw-artifact-prune-dry-run-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  future_apply_command: 'agent-onboard release --closed-gates-prune-apply',
  minimum_candidate_count: 30,
  boundary: Object.freeze({
    dry_run_only: true,
    writes_files: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    prunes_now: false,
    authorizes_future_apply: false,
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

function publicClosedGateRawArtifactPruneDryRunMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateRawArtifactPruneDryRun(root = packageRoot()) {
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const indexPath = path.join(root, plan.index_path);
  const archivePath = path.join(root, plan.archive_path);
  const artifactPath = path.join(root, plan.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  let index = null;
  let indexStatus = 'missing';
  let indexParseError = null;
  if (indexPresent) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
      indexParseError = error && error.message ? error.message : String(error);
    }
  }
  const archive = readPublicClosedGateArchiveJsonl(root, archivePath);
  const rawGateArtifacts = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const rawFileIdByPath = new Map(rawGateArtifacts.map((artifact) => [artifact.path, artifact.file_id]));
  const archiveRecordByPath = new Map(archive.records.map((record) => [record && record.path, record]).filter(([key]) => typeof key === 'string'));
  const missingFromArchive = rawGateArtifacts
    .filter((artifact) => !archiveRecordByPath.has(artifact.path))
    .map((artifact) => Object.freeze({ path: artifact.path, file_id: artifact.file_id, content_inlined: false }));
  const mismatchedArchiveRecords = archive.records
    .filter((record) => record && typeof record.path === 'string' && rawFileIdByPath.has(record.path) && rawFileIdByPath.get(record.path) !== record.raw_artifact_file_id)
    .map((record) => Object.freeze({ path: record.path, archive_file_id: record.raw_artifact_file_id, current_file_id: rawFileIdByPath.get(record.path), content_inlined: false }));
  const candidateRecords = rawGateArtifacts
    .filter((artifact) => {
      const record = archiveRecordByPath.get(artifact.path);
      return record && record.raw_artifact_file_id === artifact.file_id;
    })
    .map((artifact, index) => Object.freeze({
      ordinal: index + 1,
      path: artifact.path,
      file_id: artifact.file_id,
      work_item_id: artifact.work_item_id,
      milestone_id: artifact.milestone_id,
      byte_count: artifact.bytes,
      delete_candidate: true,
      content_inlined: false
    }));
  const archiveCoversRawArtifacts = installedContext || missingFromArchive.length === 0;
  const archiveFileIdsMatchRaw = installedContext || mismatchedArchiveRecords.length === 0;
  const allRawArtifactsEligible = installedContext || (archiveCoversRawArtifacts && archiveFileIdsMatchRaw && candidateRecords.length === rawGateArtifacts.length);
  const planCheck = publicClosedGateRawArtifactPrunePlanningCheck(root);
  const readerCheck = publicClosedGateArchiveReaderCheck(root);
  const fullTestRunnerCheck = publicFullTestRunnerCompletionCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-result-001',
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
      prune_planning_check: planCheck.status,
      closed_gate_archive_reader_check: readerCheck.status,
      full_test_runner_completion_check: fullTestRunnerCheck.status
    }),
    current_surface: Object.freeze({
      raw_gate_artifact_count: rawGateArtifacts.length,
      raw_gate_artifact_parse_error_count: rawGateArtifacts.filter((artifact) => artifact.parse_error).length,
      raw_gate_artifact_total_bytes: rawGateArtifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      index_present: indexPresent,
      index_status: indexStatus,
      index_parse_error: indexParseError,
      index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
      index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
      archive_present: archivePresent,
      archive_record_count: archive.records.length,
      archive_file_id: archivePresent ? textFileId(archive.text) : null,
      archive_parse_error_count: archive.parse_errors.length,
      archive_covers_raw_artifacts: archiveCoversRawArtifacts,
      archive_file_ids_match_raw: archiveFileIdsMatchRaw,
      missing_raw_artifacts_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      raw_artifact_content_inlined: false,
      archive_record_content_inlined: false
    }),
    dry_run_manifest: Object.freeze({
      dry_run_only: true,
      delete_now: false,
      move_now: false,
      rewrite_now: false,
      apply_command_required_before_delete: plan.future_apply_command,
      candidate_path_glob: '.agent-onboard/*-gate.json',
      candidate_count: candidateRecords.length,
      candidate_total_bytes: candidateRecords.reduce((sum, record) => sum + record.byte_count, 0),
      all_raw_artifacts_eligible: allRawArtifactsEligible,
      candidate_paths: candidateRecords.map((record) => record.path),
      candidate_file_ids: candidateRecords.map((record) => record.file_id),
      candidate_records: candidateRecords,
      missing_from_archive: missingFromArchive,
      mismatched_archive_records: mismatchedArchiveRecords,
      protected_non_candidate_paths: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/work-items.json',
        '.agent-onboard/claims.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/*',
        'manifest.json',
        'authority-map.json'
      ]),
      future_apply_must_refresh: Object.freeze([
        '.agent-onboard/closed-gates.index.json',
        '.agent-onboard/closed-gates.archive.jsonl',
        '.agent-onboard/authority-index.json',
        '.agent-onboard/state/live-authority.json',
        '.agent-onboard/state/indexes.json',
        '.agent-onboard/state/closed-gates.jsonl',
        'manifest.json',
        'authority-map.json'
      ]),
      raw_prune_authorized_by_this_gate: false,
      content_inlined: false
    }),
    recovery: Object.freeze({
      reader_check_passes: readerCheck.status === 'ok',
      full_test_runner_check_passes: fullTestRunnerCheck.status === 'ok',
      planning_check_passes: planCheck.status === 'ok',
      index_archive_digest_matches_archive: index && index.archive_candidate_file_id ? index.archive_candidate_file_id === (archivePresent ? textFileId(archive.text) : null) : installedContext,
      raw_artifacts_present_before_future_apply: installedContext || rawGateArtifacts.length > 0,
      raw_file_ids_match_archive: archiveFileIdsMatchRaw,
      archive_covers_raw_artifacts: archiveCoversRawArtifacts,
      dry_run_replay_has_exact_delete_set: installedContext || allRawArtifactsEligible,
      missing_from_archive_count: missingFromArchive.length,
      mismatched_archive_record_count: mismatchedArchiveRecords.length,
      content_inlined: false
    }),
    artifact: Object.freeze({
      path: plan.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    boundary: plan.boundary
  });
}

function publicClosedGateRawArtifactPruneDryRunCheck(root = packageRoot()) {
  const result = publicClosedGateRawArtifactPruneDryRun(root);
  const plan = PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN;
  const milestone = publicClosedGateRawArtifactPruneDryRunMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const pruneState = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const errors = [];
  if (result.prerequisite_checks.prune_planning_check !== 'ok') errors.push('raw artifact prune dry-run requires prune planning check to pass');
  if (result.prerequisite_checks.closed_gate_archive_reader_check !== 'ok') errors.push('raw artifact prune dry-run requires closed gate archive reader check to pass');
  if (result.prerequisite_checks.full_test_runner_completion_check !== 'ok') errors.push('raw artifact prune dry-run requires full-test runner completion check to pass');
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${plan.artifact_file} must exist after W13 closes`);
  if (!installedContext && !rawPruneApplied && result.current_surface.raw_gate_artifact_count < plan.minimum_candidate_count) errors.push(`raw artifact prune dry-run requires at least ${plan.minimum_candidate_count} raw gate artifacts`);
  if (!installedContext && result.current_surface.raw_gate_artifact_parse_error_count !== 0) errors.push('raw artifact prune dry-run requires all raw gate artifacts to parse as JSON');
  if (!installedContext && result.current_surface.index_present !== true) errors.push(`${plan.index_path} must be present before prune dry-run`);
  if (!installedContext && result.current_surface.index_status !== 'present_valid_json') errors.push(`${plan.index_path} must parse as JSON before prune dry-run`);
  if (!installedContext && result.current_surface.archive_present !== true) errors.push(`${plan.archive_path} must be present before prune dry-run`);
  if (!installedContext && result.current_surface.archive_parse_error_count !== 0) errors.push('closed gate archive must parse before prune dry-run');
  if (!installedContext && result.current_surface.index_record_count !== result.current_surface.archive_record_count) errors.push('closed gate index record count must match archive before prune dry-run');
  if (!installedContext && result.recovery.index_archive_digest_matches_archive !== true) errors.push('closed gate index archive digest must match archive before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_covers_raw_artifacts !== true) errors.push('closed gate archive must cover all raw gate artifacts before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.current_surface.archive_file_ids_match_raw !== true) errors.push('closed gate archive file ids must match raw artifacts before prune dry-run');
  if (!installedContext && !rawPruneApplied && result.dry_run_manifest.candidate_count !== result.current_surface.raw_gate_artifact_count) errors.push('prune dry-run candidate count must match raw gate artifact count');
  if (result.dry_run_manifest.dry_run_only !== true || result.dry_run_manifest.delete_now !== false || result.dry_run_manifest.move_now !== false || result.dry_run_manifest.rewrite_now !== false) errors.push('W13 must remain dry-run-only and must not delete, move, or rewrite raw artifacts');
  if (result.dry_run_manifest.raw_prune_authorized_by_this_gate !== false) errors.push('W13 must not authorize raw artifact pruning');
  if (result.dry_run_manifest.apply_command_required_before_delete !== plan.future_apply_command) errors.push('raw artifact prune dry-run must reserve the explicit future apply command');
  if (result.boundary.dry_run_only !== true || result.boundary.writes_files !== false) errors.push('raw artifact prune dry-run command must be no-write dry-run only');
  if (result.boundary.deletes_raw_gate_artifacts !== false || result.boundary.moves_raw_gate_artifacts !== false || result.boundary.rewrites_raw_gate_artifacts !== false) errors.push('raw artifact prune dry-run must not delete, move, or rewrite raw gate artifacts');
  if (result.boundary.prunes_now !== false || result.boundary.authorizes_future_apply !== false) errors.push('raw artifact prune dry-run must not prune now or authorize future apply by itself');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('raw artifact prune dry-run must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${plan.milestone_id} must remain open during W13`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${plan.prerequisite_work_item_id} must be closed before W13 passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${plan.work_item_id} must be closed by W13`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: plan.check_command,
    dry_run_command: plan.command,
    package_root: root,
    validated: Object.freeze({
      prune_planning_check_passes: result.prerequisite_checks.prune_planning_check === 'ok',
      archive_reader_check_passes: result.prerequisite_checks.closed_gate_archive_reader_check === 'ok',
      full_test_runner_check_passes: result.prerequisite_checks.full_test_runner_completion_check === 'ok',
      dry_run_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      enough_raw_gate_artifacts: installedContext || rawPruneApplied || result.current_surface.raw_gate_artifact_count >= plan.minimum_candidate_count,
      raw_gate_artifacts_parse_as_json: installedContext || result.current_surface.raw_gate_artifact_parse_error_count === 0,
      index_present_valid_json: installedContext || (result.current_surface.index_present === true && result.current_surface.index_status === 'present_valid_json'),
      archive_present_and_parses: installedContext || (result.current_surface.archive_present === true && result.current_surface.archive_parse_error_count === 0),
      index_record_count_matches_archive: installedContext || result.current_surface.index_record_count === result.current_surface.archive_record_count,
      index_archive_digest_matches_archive: installedContext || result.recovery.index_archive_digest_matches_archive === true,
      archive_covers_raw_artifacts: installedContext || rawPruneApplied || result.current_surface.archive_covers_raw_artifacts === true,
      archive_file_ids_match_raw: installedContext || rawPruneApplied || result.current_surface.archive_file_ids_match_raw === true,
      exact_candidate_set: installedContext || rawPruneApplied || result.dry_run_manifest.candidate_count === result.current_surface.raw_gate_artifact_count,
      dry_run_only_no_prune: result.dry_run_manifest.dry_run_only === true && result.dry_run_manifest.delete_now === false && result.dry_run_manifest.raw_prune_authorized_by_this_gate === false,
      future_apply_gate_required: result.dry_run_manifest.apply_command_required_before_delete === plan.future_apply_command,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_move_rewrite_boundary: result.boundary.deletes_raw_gate_artifacts === false && result.boundary.moves_raw_gate_artifacts === false && result.boundary.rewrites_raw_gate_artifacts === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    dry_run: result,
    milestone_state: milestone,
    boundary: plan.boundary,
    errors
  });
}

function publicClosedGateRawArtifactPruneDryRunText(result = publicClosedGateRawArtifactPruneDryRun()) {
  const lines = [
    `agent-onboard closed gate raw artifact prune dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Dry-run manifest:',
    `- candidates: ${result.dry_run_manifest.candidate_count}`,
    `- all raw artifacts eligible: ${result.dry_run_manifest.all_raw_artifacts_eligible}`,
    `- delete now: ${result.dry_run_manifest.delete_now}`,
    `- future apply required: ${result.dry_run_manifest.apply_command_required_before_delete}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_CLOSED_GATE_RAW_ARTIFACT_PRUNE_DRY_RUN,
    publicClosedGateRawArtifactPruneDryRun,
    publicClosedGateRawArtifactPruneDryRunCheck,
    publicClosedGateRawArtifactPruneDryRunText,
  });
}

module.exports = Object.freeze({
  createClosedGatePruneDryRunRuntime
});
