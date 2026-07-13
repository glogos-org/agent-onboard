'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createClosedGateApplyRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, publicClosedGateArtifactFiles, publicClosedGateArtifactParsedRecord, publicClosedGateArtifactArchiveCandidateText, publicClosedGateArtifactIndexCandidate, publicClosedGateArtifactCompactionDryRunCheck, publicClosedGateRawArtifactPruneApplyAdmitted, publicClosedGateRawArtifactPruneApplyIndexState, textFileId } = ctx;

const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W8'].join(''),
  work_item_id: ['P1S3M6', 'W9'].join(''),
  title: 'Public closed gate artifact compaction apply gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-apply',
  check_command: 'agent-onboard release --closed-gates-apply-check',
  artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-apply-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  max_index_bytes: 90000,
  max_archive_bytes: 250000,
  purpose: 'Verify the admitted closed-gate artifact archive and compact index after materialization. Raw gate JSON artifacts remain present until a future prune gate admits deletion or movement.',
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    creates_index: true,
    creates_archive: true,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    mutates_work_items: false,
    mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false,
    file_contents_inlined: false
  })
});

function publicClosedGateArtifactCompactionApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactCompactionApplyCandidates(root = packageRoot()) {
  const artifacts = publicClosedGateArtifactFiles(root);
  const records = artifacts.map((artifact, index) => publicClosedGateArtifactParsedRecord(root, artifact, index + 1));
  const archiveText = publicClosedGateArtifactArchiveCandidateText(records);
  const indexCandidate = publicClosedGateArtifactIndexCandidate(root, records, archiveText, { status: 'applied' });
  const indexText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  return Object.freeze({ artifacts, records, archiveText, indexCandidate, indexText });
}

function publicClosedGateArtifactCompactionApplyState(root = packageRoot()) {
  const apply = PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY;
  const candidates = publicClosedGateArtifactCompactionApplyCandidates(root);
  const indexPath = path.join(root, apply.index_path);
  const archivePath = path.join(root, apply.archive_path);
  const artifactPath = path.join(root, apply.artifact_file);
  const indexPresent = fs.existsSync(indexPath);
  const archivePresent = fs.existsSync(archivePath);
  const applyArtifactPresent = fs.existsSync(artifactPath);
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
  const archiveText = archivePresent ? fs.readFileSync(archivePath, 'utf8') : '';
  const archiveRecords = archiveText.trim().length === 0 ? [] : archiveText.trimEnd().split('\n').map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  });
  const archiveParseErrorCount = archiveRecords.filter((record) => record === null).length;
  return Object.freeze({
    applied: indexPresent && archivePresent && applyArtifactPresent,
    index_path: apply.index_path,
    index_present: indexPresent,
    index_status: indexStatus,
    index_parse_error: indexParseError,
    index_bytes: indexPresent ? fs.statSync(indexPath).size : 0,
    index_file_id: indexPresent ? textFileId(fs.readFileSync(indexPath, 'utf8')) : null,
    expected_index_file_id: textFileId(candidates.indexText),
    index_record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
    index_archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
    archive_path: apply.archive_path,
    archive_present: archivePresent,
    archive_bytes: archivePresent ? fs.statSync(archivePath).size : 0,
    archive_file_id: archivePresent ? textFileId(archiveText) : null,
    expected_archive_file_id: textFileId(candidates.archiveText),
    archive_record_count: archiveRecords.length,
    archive_parse_error_count: archiveParseErrorCount,
    apply_artifact_path: apply.artifact_file,
    apply_artifact_present: applyArtifactPresent,
    raw_gate_artifact_count: candidates.records.length,
    raw_gate_artifacts_present: candidates.records.every((record) => fs.existsSync(path.join(root, record.path))),
    raw_gate_artifact_file_ids_match_archive: archiveRecords.length === candidates.records.length && archiveRecords.every((record, index) => record && candidates.records[index] && record.raw_artifact_file_id === candidates.records[index].raw_artifact_file_id),
    archive_matches_expected: archivePresent && textFileId(archiveText) === textFileId(candidates.archiveText),
    index_matches_expected: indexPresent && textFileId(fs.readFileSync(indexPath, 'utf8')) === textFileId(candidates.indexText),
    candidates
  });
}

function publicClosedGateArtifactCompactionApply(root = packageRoot()) {
  const state = publicClosedGateArtifactCompactionApplyState(root);
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.surface_id,
    dry_run_check: publicClosedGateArtifactCompactionDryRunCheck(root).status,
    apply: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY,
    current: Object.freeze({
      applied: state.applied,
      index_present: state.index_present,
      archive_present: state.archive_present,
      apply_artifact_present: state.apply_artifact_present,
      raw_gate_artifact_count: state.raw_gate_artifact_count,
      raw_gate_artifacts_present: state.raw_gate_artifacts_present
    }),
    archive: Object.freeze({
      path: state.archive_path,
      present: state.archive_present,
      byte_count: state.archive_bytes,
      file_id: state.archive_file_id,
      expected_file_id: state.expected_archive_file_id,
      record_count: state.archive_record_count,
      parse_error_count: state.archive_parse_error_count,
      matches_expected: state.archive_matches_expected,
      content_inlined: false
    }),
    index: Object.freeze({
      path: state.index_path,
      present: state.index_present,
      status: state.index_status,
      byte_count: state.index_bytes,
      file_id: state.index_file_id,
      expected_file_id: state.expected_index_file_id,
      record_count: state.index_record_count,
      archive_file_id: state.index_archive_file_id,
      matches_expected: state.index_matches_expected,
      content_inlined: false
    }),
    recovery: Object.freeze({
      raw_gate_artifacts_preserved: state.raw_gate_artifacts_present,
      archive_replays_raw_artifact_file_ids: state.raw_gate_artifact_file_ids_match_archive,
      index_archive_digest_matches_archive: state.index_archive_file_id === state.archive_file_id,
      index_is_not_sole_authority: true,
      future_prune_gate_required_before_deletion: true,
      content_inlined: false
    }),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.boundary
  });
}

function publicClosedGateArtifactCompactionApplyCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionApply(root);
  const milestone = publicClosedGateArtifactCompactionApplyMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const apply = PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY;
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const pruneState = publicClosedGateRawArtifactPruneApplyIndexState(root);
  const errors = [];
  if (result.dry_run_check !== 'ok') errors.push('closed gate artifact compaction dry-run check must pass before apply check');
  if (!installedContext && !rawPruneApplied && result.current.raw_gate_artifact_count < apply.minimum_record_count) errors.push(`closed gate apply requires at least ${apply.minimum_record_count} raw gate artifacts`);
  if (!installedContext && !rawPruneApplied && !result.current.applied) errors.push('closed gate compaction apply must materialize index, archive, and apply gate artifact');
  if (!installedContext && !result.archive.present) errors.push(`${apply.archive_path} must be present after apply`);
  if (!installedContext && !result.index.present) errors.push(`${apply.index_path} must be present after apply`);
  if (!installedContext && !rawPruneApplied && !result.current.apply_artifact_present) errors.push(`${apply.artifact_file} must be present after apply`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed gate archive JSONL records must all parse');
  if (!installedContext && !rawPruneApplied && result.archive.record_count !== result.current.raw_gate_artifact_count) errors.push('closed gate archive record count must match raw gate artifact count');
  if (!installedContext && result.index.record_count !== result.archive.record_count) errors.push('closed gate index record count must match archive record count');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('closed gate index archive digest must match archive file digest');
  if (!installedContext && !rawPruneApplied && !result.archive.matches_expected) errors.push('closed gate archive file must match generated archive candidate');
  if (!installedContext && !rawPruneApplied && !result.index.matches_expected) errors.push('closed gate index file must match generated index candidate');
  if (!installedContext && result.index.byte_count > apply.max_index_bytes) errors.push(`closed gate index byte count ${result.index.byte_count} outside apply budget`);
  if (!installedContext && result.archive.byte_count > apply.max_archive_bytes) errors.push(`closed gate archive byte count ${result.archive.byte_count} outside apply budget`);
  if (!rawPruneApplied && !result.recovery.raw_gate_artifacts_preserved && !installedContext) errors.push('raw closed gate artifacts must remain present after apply');
  if (!rawPruneApplied && !result.recovery.archive_replays_raw_artifact_file_ids && !installedContext) errors.push('archive records must preserve raw artifact file ids in order');
  if (!rawPruneApplied && result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate apply must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate apply must not move raw gate artifacts');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('closed gate apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('closed gate apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${apply.milestone_id} must remain open during closed gate artifact apply`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${apply.prerequisite_work_item_id} must be closed before closed gate artifact apply`);
    if (milestone.work_item_status !== 'closed') errors.push(`${apply.work_item_id} must be closed by this closed gate artifact apply gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-apply-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: apply.check_command,
    apply_command: apply.command,
    package_root: root,
    validated: Object.freeze({
      dry_run_check_passes: result.dry_run_check === 'ok',
      apply_state_present: rawPruneApplied || result.current.applied || installedContext,
      apply_artifact_present: rawPruneApplied || result.current.apply_artifact_present || installedContext,
      archive_present: result.archive.present || installedContext,
      index_present_valid_json: (result.index.present && result.index.status === 'present_valid_json') || installedContext,
      raw_gate_artifacts_preserved: rawPruneApplied || result.recovery.raw_gate_artifacts_preserved || installedContext,
      archive_record_count_matches_raw_artifacts: rawPruneApplied || result.archive.record_count === result.current.raw_gate_artifact_count || installedContext,
      index_record_count_matches_archive: result.index.record_count === result.archive.record_count || installedContext,
      index_archive_digest_matches_archive: result.index.archive_file_id === result.archive.file_id || installedContext,
      archive_matches_generated_candidate: rawPruneApplied || result.archive.matches_expected || installedContext,
      index_matches_generated_candidate: rawPruneApplied || result.index.matches_expected || installedContext,
      archive_replays_raw_artifact_file_ids: rawPruneApplied || result.recovery.archive_replays_raw_artifact_file_ids || installedContext,
      no_delete_raw_artifacts: rawPruneApplied || result.boundary.deletes_raw_gate_artifacts === false,
      no_move_raw_artifacts: result.boundary.moves_raw_gate_artifacts === false,
      commands_are_read_only_verifiers: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    apply: result,
    milestone_state: milestone,
    boundary: apply.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionApplyText(result = publicClosedGateArtifactCompactionApply()) {
  const lines = [
    `agent-onboard closed gate artifact compaction apply ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Applied surfaces:',
    `- index: ${result.index.path} (${result.index.record_count} records, ${result.index.byte_count} bytes)`,
    `- archive: ${result.archive.path} (${result.archive.record_count} records, ${result.archive.byte_count} bytes)`,
    `- raw artifacts preserved: ${result.recovery.raw_gate_artifacts_preserved}`,
    '',
    'Boundary:',
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`,
    `- publishes package: ${result.boundary.publishes_package}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY,
    publicClosedGateArtifactCompactionApply,
    publicClosedGateArtifactCompactionApplyCheck,
    publicClosedGateArtifactCompactionApplyText,
  });
}

module.exports = Object.freeze({
  createClosedGateApplyRuntime
});
