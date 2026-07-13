'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createClosedGateReaderRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, publicClosedGateArtifactFiles, publicClosedGateArtifactCompactionApplyCheck, publicClosedGateRawArtifactPruneApplyAdmitted, textFileId } = ctx;

const PUBLIC_CLOSED_GATE_ARCHIVE_READER = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-archive-reader-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W9'].join(''),
  work_item_id: ['P1S3M6', 'W10'].join(''),
  title: 'Public closed gate archive reader and full-test timeout hardening gate',
  surface_id: 'closed-gate-archive-reader',
  command: 'agent-onboard release --closed-gates-read',
  check_command: 'agent-onboard release --closed-gates-read-check',
  artifact_file: '.agent-onboard/public-closed-gate-archive-reader-full-test-hardening-gate.json',
  index_path: '.agent-onboard/closed-gates.index.json',
  archive_path: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  max_reader_payload_bytes: 90000,
  boundary: Object.freeze({
    writes_files: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    reads_archive_index_only: true,
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

function publicClosedGateArchiveReaderMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARCHIVE_READER.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function readPublicClosedGateArchiveJsonl(root, archivePath) {
  if (!fs.existsSync(archivePath)) return Object.freeze({ text: '', records: Object.freeze([]), parse_errors: Object.freeze([]) });
  const text = fs.readFileSync(archivePath, 'utf8');
  const lines = text.trim().length === 0 ? [] : text.trimEnd().split('\n');
  const records = [];
  const parseErrors = [];
  for (let index = 0; index < lines.length; index += 1) {
    try {
      records.push(JSON.parse(lines[index]));
    } catch (error) {
      parseErrors.push(Object.freeze({ line: index + 1, message: error && error.message ? error.message : String(error) }));
    }
  }
  return Object.freeze({ text, records: Object.freeze(records), parse_errors: Object.freeze(parseErrors) });
}

function publicClosedGateArchiveReader(root = packageRoot()) {
  const reader = PUBLIC_CLOSED_GATE_ARCHIVE_READER;
  const context = sourceContext(root).package_context;
  const installedContext = context === 'installed_package';
  const indexPath = path.join(root, reader.index_path);
  const archivePath = path.join(root, reader.archive_path);
  const artifactPath = path.join(root, reader.artifact_file);
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
  const recordPaths = archive.records.map((record) => record && record.path).filter((value) => typeof value === 'string');
  const recordOrdinals = archive.records.map((record) => record && record.ordinal).filter((value) => Number.isInteger(value));
  const uniquePaths = new Set(recordPaths);
  const uniqueOrdinals = new Set(recordOrdinals);
  const ordinalSequenceContiguous = archive.records.every((record, index) => record && record.ordinal === index + 1);
  const byMilestone = {};
  const byStatus = {};
  for (const record of archive.records) {
    const milestoneKey = record && record.milestone_id ? record.milestone_id : 'unknown';
    const statusKey = record && record.status ? record.status : 'unknown';
    byMilestone[milestoneKey] = (byMilestone[milestoneKey] || 0) + 1;
    byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
  }
  const rawPathReports = archive.records.map((record) => {
    const rel = record && typeof record.path === 'string' ? record.path : '';
    const absolute = path.join(root, rel);
    const present = rel.length > 0 && fs.existsSync(absolute);
    const fileId = present ? `ni:///sha-256;${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('base64url')}` : null;
    return Object.freeze({
      path: rel,
      present,
      archive_file_id: record && record.raw_artifact_file_id ? record.raw_artifact_file_id : null,
      current_file_id_matches_archive: present && record && record.raw_artifact_file_id ? fileId === record.raw_artifact_file_id : false,
      content_inlined: false
    });
  });
  const rawGateArtifactFiles = installedContext ? [] : publicClosedGateArtifactFiles(root);
  const testRunnerPath = path.join(root, 'test', 'run-tests.js');
  const testRunnerText = fs.existsSync(testRunnerPath) ? fs.readFileSync(testRunnerPath, 'utf8') : '';
  const runnerTimeoutConfigured = /(AGENT_ONBOARD_TEST_TASK_TIMEOUT_MS|AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS)/.test(testRunnerText) && /timeoutMs/.test(testRunnerText) && /task timeout/.test(testRunnerText);
  const compactLatestRecords = archive.records.slice(-5).map((record) => Object.freeze({
    ordinal: record.ordinal,
    path: record.path,
    work_item_id: record.work_item_id,
    milestone_id: record.milestone_id,
    status: record.status,
    raw_artifact_file_id: record.raw_artifact_file_id,
    content_inlined: false
  }));
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-reader-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: reader.command,
    check_command: reader.check_command,
    package_root: root,
    package_context: context,
    surface_id: reader.surface_id,
    apply_check_status: publicClosedGateArtifactCompactionApplyCheck(root).status,
    installed_package_source_archive_omitted: installedContext && !indexPresent && !archivePresent,
    index: Object.freeze({
      path: reader.index_path,
      present: indexPresent,
      status: indexStatus,
      parse_error: indexParseError,
      byte_count: indexPresent ? fs.statSync(indexPath).size : 0,
      file_id: indexPresent ? textFileId(fs.readFileSync(indexPath, 'utf8')) : null,
      record_count: index && typeof index.record_count === 'number' ? index.record_count : 0,
      archive_file_id: index && index.archive_candidate_file_id ? index.archive_candidate_file_id : null,
      raw_artifact_count: index && typeof index.raw_artifact_count === 'number' ? index.raw_artifact_count : 0,
      raw_artifacts_preserved: index && typeof index.raw_artifacts_preserved === 'boolean' ? index.raw_artifacts_preserved : false,
      recovery: index && index.recovery ? index.recovery : null,
      content_inlined: false
    }),
    archive: Object.freeze({
      path: reader.archive_path,
      present: archivePresent,
      byte_count: archivePresent ? fs.statSync(archivePath).size : 0,
      file_id: archivePresent ? textFileId(archive.text) : null,
      record_count: archive.records.length,
      parse_error_count: archive.parse_errors.length,
      parse_errors: archive.parse_errors,
      content_inlined: false
    }),
    reader: Object.freeze({
      records_loaded: archive.records.length,
      unique_paths: uniquePaths.size,
      unique_ordinals: uniqueOrdinals.size,
      ordinal_sequence_contiguous: ordinalSequenceContiguous,
      by_milestone: byMilestone,
      by_status: byStatus,
      latest_records: compactLatestRecords,
      raw_archive_record_content_inlined: false
    }),
    recovery: Object.freeze({
      raw_gate_artifact_count: rawGateArtifactFiles.length,
      raw_gate_artifacts_present: installedContext || rawPathReports.every((report) => report.present === true),
      raw_gate_artifact_file_ids_match_archive: installedContext || rawPathReports.every((report) => report.current_file_id_matches_archive === true),
      raw_path_reports_content_inlined: false,
      raw_path_report_count: rawPathReports.length
    }),
    test_runner_hardening: Object.freeze({
      run_tests_file_present: fs.existsSync(testRunnerPath),
      per_task_timeout_configured: runnerTimeoutConfigured,
      full_suite_timeout_failure_is_bounded: runnerTimeoutConfigured,
      package_context_allows_absent_tests: installedContext
    }),
    artifact: Object.freeze({
      path: reader.artifact_file,
      present: fs.existsSync(artifactPath),
      content_inlined: false
    }),
    boundary: reader.boundary
  });
}

function publicClosedGateArchiveReaderCheck(root = packageRoot()) {
  const result = publicClosedGateArchiveReader(root);
  const reader = PUBLIC_CLOSED_GATE_ARCHIVE_READER;
  const milestone = publicClosedGateArchiveReaderMilestoneState(root);
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const errors = [];
  if (result.apply_check_status !== 'ok') errors.push('closed gate archive reader requires closed-gates apply check to pass');
  if (!installedContext && !rawPruneApplied && result.artifact.present !== true) errors.push(`${reader.artifact_file} must exist after this reader gate closes`);
  if (!installedContext && result.index.present !== true) errors.push(`${reader.index_path} must be present for archive reader`);
  if (!installedContext && result.index.status !== 'present_valid_json') errors.push(`${reader.index_path} must parse as JSON`);
  if (!installedContext && result.archive.present !== true) errors.push(`${reader.archive_path} must be present for archive reader`);
  if (!installedContext && result.archive.parse_error_count !== 0) errors.push('closed gate archive reader requires every archive JSONL record to parse');
  if (!installedContext && result.archive.record_count < reader.minimum_record_count) errors.push(`closed gate archive reader requires at least ${reader.minimum_record_count} records`);
  if (!installedContext && result.index.record_count !== result.archive.record_count) errors.push('closed gate archive reader index record count must match archive record count');
  if (!installedContext && result.index.archive_file_id !== result.archive.file_id) errors.push('closed gate archive reader index archive digest must match archive file digest');
  if (!installedContext && result.index.raw_artifact_count !== result.archive.record_count) errors.push('closed gate archive reader index raw artifact count must match archive record count');
  if (!installedContext && result.reader.unique_paths !== result.archive.record_count) errors.push('closed gate archive reader requires unique archive record paths');
  if (!installedContext && result.reader.unique_ordinals !== result.archive.record_count) errors.push('closed gate archive reader requires unique archive record ordinals');
  if (!installedContext && result.reader.ordinal_sequence_contiguous !== true) errors.push('closed gate archive reader requires contiguous ordinal sequence');
  if (!installedContext && !rawPruneApplied && result.recovery.raw_gate_artifacts_present !== true) errors.push('closed gate archive reader requires raw gate artifact paths to remain present');
  if (!installedContext && !rawPruneApplied && result.recovery.raw_gate_artifact_file_ids_match_archive !== true) errors.push('closed gate archive reader requires raw artifact file ids to match archive records');
  if (!installedContext && result.test_runner_hardening.per_task_timeout_configured !== true) errors.push('full test runner must configure bounded per-task timeout before W10 closes');
  if (result.boundary.writes_files !== false) errors.push('closed gate archive reader must be no-write');
  if (result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate archive reader must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate archive reader must not move raw gate artifacts');
  if (result.boundary.raw_artifact_content_inlined !== false || result.boundary.archive_record_content_inlined !== false) errors.push('closed gate archive reader must not inline raw artifact or archive contents');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('closed gate archive reader must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${reader.milestone_id} must remain open during closed gate archive reader gate`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${reader.prerequisite_work_item_id} must be closed before closed gate archive reader passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${reader.work_item_id} must be closed by this closed gate archive reader gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-reader-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: reader.check_command,
    reader_command: reader.command,
    package_root: root,
    validated: Object.freeze({
      apply_check_passes: result.apply_check_status === 'ok',
      source_archive_omission_allowed_in_installed_package: installedContext ? result.installed_package_source_archive_omitted === true : true,
      reader_artifact_present: installedContext || rawPruneApplied || result.artifact.present === true,
      index_present_valid_json: installedContext || (result.index.present === true && result.index.status === 'present_valid_json'),
      archive_present: installedContext || result.archive.present === true,
      archive_records_parse: installedContext || result.archive.parse_error_count === 0,
      enough_archive_records: installedContext || result.archive.record_count >= reader.minimum_record_count,
      index_record_count_matches_archive: installedContext || result.index.record_count === result.archive.record_count,
      index_archive_digest_matches_archive: installedContext || result.index.archive_file_id === result.archive.file_id,
      unique_record_paths: installedContext || result.reader.unique_paths === result.archive.record_count,
      unique_record_ordinals: installedContext || result.reader.unique_ordinals === result.archive.record_count,
      ordinal_sequence_contiguous: installedContext || result.reader.ordinal_sequence_contiguous === true,
      raw_gate_artifacts_preserved: installedContext || rawPruneApplied || result.recovery.raw_gate_artifacts_present === true,
      raw_file_ids_match_archive: installedContext || rawPruneApplied || result.recovery.raw_gate_artifact_file_ids_match_archive === true,
      full_test_task_timeout_hardened: installedContext || result.test_runner_hardening.per_task_timeout_configured === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_raw_gate_artifacts === false,
      no_move_boundary: result.boundary.moves_raw_gate_artifacts === false,
      no_raw_content_inline: result.boundary.raw_artifact_content_inlined === false && result.boundary.archive_record_content_inlined === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    reader: result,
    milestone_state: milestone,
    boundary: reader.boundary,
    errors
  });
}

function publicClosedGateArchiveReaderText(result = publicClosedGateArchiveReader()) {
  const lines = [
    `agent-onboard closed gate archive reader ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Archive:',
    `- records: ${result.archive.record_count}`,
    `- bytes: ${result.archive.byte_count}`,
    `- parse errors: ${result.archive.parse_error_count}`,
    '',
    'Recovery:',
    `- raw artifacts present: ${result.recovery.raw_gate_artifacts_present}`,
    `- raw file ids match archive: ${result.recovery.raw_gate_artifact_file_ids_match_archive}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- inlines raw content: ${result.boundary.raw_artifact_content_inlined}`
  ];
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_CLOSED_GATE_ARCHIVE_READER,
    readPublicClosedGateArchiveJsonl,
    publicClosedGateArchiveReader,
    publicClosedGateArchiveReaderCheck,
    publicClosedGateArchiveReaderText,
  });
}

module.exports = Object.freeze({
  createClosedGateReaderRuntime
});
