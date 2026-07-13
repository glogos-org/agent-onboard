'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createClosedGateCompactionRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, publicClosedGateRawArtifactPruneApplyAdmitted, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY, textFileId, publicCleanCompactionCatalogCheck, publicReadmeHistoryArchiveSplitApplyCheck } = ctx;

const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prior_work_item_id: ['P1S3M6', 'W6'].join(''),
  work_item_id: ['P1S3M6', 'W7'].join(''),
  title: 'Public closed gate artifact compaction planning gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-plan',
  check_command: 'agent-onboard release --closed-gates-plan-check',
  planning_artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-planning-gate.json',
  future_index_candidate: '.agent-onboard/closed-gates.index.json',
  future_archive_candidate: '.agent-onboard/closed-gates.archive.jsonl',
  purpose: 'Plan closed gate artifact compaction without deleting, moving, rewriting, archiving, or replacing raw closure evidence. Any future apply gate must preserve a recovery path from compact index/archive back to source artifact identity.',
  minimum_closed_gate_artifacts: 30,
  boundary: Object.freeze({
    writes_files: false,
    creates_index_now: false,
    creates_archive_now: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
    compacts_raw_artifacts_now: false,
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

function publicClosedGateArtifactFiles(root = packageRoot()) {
  const stateRoot = path.join(root, '.agent-onboard');
  if (!fs.existsSync(stateRoot)) return [];
  return fs.readdirSync(stateRoot)
    .filter((name) => name.endsWith('-gate.json'))
    .map((name) => {
      const relative = path.posix.join('.agent-onboard', name);
      const absolute = path.join(root, relative);
      let parsed = null;
      let parseError = null;
      try { parsed = readJson(absolute); } catch (error) { parseError = error && error.message ? error.message : String(error); }
      const stat = fs.statSync(absolute);
      return Object.freeze({
        path: relative,
        bytes: stat.size,
        file_id: `ni:///sha-256;${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('base64url')}`,
        schema: parsed && parsed.schema ? parsed.schema : null,
        status: parsed && parsed.status ? parsed.status : null,
        milestone_id: parsed && parsed.milestone_id ? parsed.milestone_id : null,
        work_item_id: parsed && parsed.work_item_id ? parsed.work_item_id : null,
        title: parsed && parsed.title ? parsed.title : null,
        parse_error: parseError
      });
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function publicClosedGateArtifactCompactionMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id,
      prior_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prior_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id) || null;
  const priorWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id,
    prior_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prior_work_item_status: priorWorkItem ? priorWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prior_work_item_title: priorWorkItem ? priorWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactCompactionPlan(root = packageRoot()) {
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  const artifacts = publicClosedGateArtifactFiles(root);
  const totalBytes = artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0);
  const parseErrorCount = artifacts.filter((artifact) => artifact.parse_error).length;
  const largestArtifacts = artifacts.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 10).map((artifact) => Object.freeze({
    path: artifact.path,
    bytes: artifact.bytes,
    work_item_id: artifact.work_item_id,
    file_id: artifact.file_id,
    content_inlined: false
  }));
  const byMilestone = {};
  for (const artifact of artifacts) {
    const key = artifact.milestone_id || 'unknown';
    byMilestone[key] = (byMilestone[key] || 0) + 1;
  }
  const planningArtifactPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.planning_artifact_file));
  const futureIndexPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate));
  const futureArchivePresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate));
  const applyArtifactPresent = fs.existsSync(path.join(root, '.agent-onboard', 'public-closed-gate-artifact-compaction-apply-gate.json'));
  const closedGatesStatePath = path.join(root, '.agent-onboard', 'state', 'closed-gates.jsonl');
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.surface_id,
    prerequisite_checks: Object.freeze({
      clean_catalog_check: catalogCheck.status,
      readme_apply_check: publicReadmeHistoryArchiveSplitApplyCheck(root).status
    }),
    current_surface: Object.freeze({
      artifact_count: artifacts.length,
      total_bytes: totalBytes,
      parse_error_count: parseErrorCount,
      planning_artifact_present: planningArtifactPresent,
      authority_closed_gates_jsonl_present: fs.existsSync(closedGatesStatePath),
      authority_closed_gates_jsonl_bytes: fs.existsSync(closedGatesStatePath) ? fs.statSync(closedGatesStatePath).size : 0,
      by_milestone: byMilestone,
      largest_artifacts: largestArtifacts
    }),
    future_compaction_design: Object.freeze({
      index_candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate,
      archive_candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate,
      index_candidate_present_now: futureIndexPresent,
      archive_candidate_present_now: futureArchivePresent,
      apply_gate_applied: applyArtifactPresent && futureIndexPresent && futureArchivePresent,
      raw_artifacts_preserved_until_apply_gate: true,
      raw_artifact_recovery_required_after_apply: true,
      index_must_not_be_sole_authority_without_archive: true,
      archive_record_minimum_fields: Object.freeze(['path', 'file_id', 'schema', 'work_item_id', 'milestone_id', 'title', 'closed_at', 'summary_digest', 'changed_files_count', 'checks_run_count', 'raw_artifact_file_id']),
      future_apply_gate_must_name_surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.surface_id,
      future_apply_gate_must_refresh_manifest_and_authority_indexes: true
    }),
    compaction_risk_register: Object.freeze([
      Object.freeze({ id: 'evidence-loss', risk: 'raw closure evidence is deleted before an archive recovery path exists', mitigation: 'no delete or move in this planning gate; future apply must prove archive/index recovery' }),
      Object.freeze({ id: 'index-authority-confusion', risk: 'a compact index is treated as sole authority', mitigation: 'index candidate is explicitly non-authoritative without raw/archive recovery' }),
      Object.freeze({ id: 'digest-drift', risk: 'manual compaction changes file identity without manifest refresh', mitigation: 'future apply must refresh manifest, authority-map, compact authority index, and state shards' })
    ]),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.boundary
  });
}

function publicClosedGateArtifactCompactionPlanCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionPlan(root);
  const milestone = publicClosedGateArtifactCompactionMilestoneState(root);
  const errors = [];
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  if (result.prerequisite_checks.clean_catalog_check !== 'ok') errors.push('closed-gate planning requires clean catalog check to pass');
  if (result.prerequisite_checks.readme_apply_check !== 'ok') errors.push('closed-gate planning requires README apply check to pass');
  if (!installedContext && !rawPruneApplied && result.current_surface.artifact_count < PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts) errors.push(`closed-gate planning requires at least ${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts} gate artifacts`);
  if (!installedContext && !rawPruneApplied && result.current_surface.total_bytes <= 0) errors.push('closed-gate planning must measure non-zero artifact bytes');
  if (result.current_surface.parse_error_count !== 0) errors.push('closed-gate planning requires all gate artifacts to parse as JSON');
  if (!installedContext && !rawPruneApplied && result.current_surface.planning_artifact_present !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.planning_artifact_file} must exist after this planning gate closes`);
  if (!installedContext && result.current_surface.authority_closed_gates_jsonl_present !== true) errors.push('authority closed-gates JSONL shard must remain present');
  if (!rawPruneApplied && result.future_compaction_design.index_candidate_present_now !== false && result.future_compaction_design.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_index_candidate} must not be created by the planning gate before apply`);
  if (!rawPruneApplied && result.future_compaction_design.archive_candidate_present_now !== false && result.future_compaction_design.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.future_archive_candidate} must not be created by the planning gate before apply`);
  if (!rawPruneApplied && result.future_compaction_design.raw_artifacts_preserved_until_apply_gate !== true) errors.push('raw artifacts must be preserved until a future apply gate');
  if (result.future_compaction_design.raw_artifact_recovery_required_after_apply !== true) errors.push('future apply must preserve raw artifact recovery');
  if (result.boundary.writes_files !== false) errors.push('closed-gate planning command must be no-write');
  if (result.boundary.deletes_files !== false) errors.push('closed-gate planning command must not delete files');
  if (result.boundary.moves_files !== false) errors.push('closed-gate planning command must not move files');
  if (result.boundary.compacts_raw_artifacts_now !== false) errors.push('closed-gate planning command must not compact raw artifacts now');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.milestone_id} must remain open during closed gate artifact planning`);
    if (milestone.prior_work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.prior_work_item_id} must be closed before closed gate artifact planning passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.work_item_id} must be closed by this planning gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.check_command,
    plan_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.command,
    package_root: root,
    validated: Object.freeze({
      clean_catalog_check_passes: result.prerequisite_checks.clean_catalog_check === 'ok',
      readme_apply_check_passes: result.prerequisite_checks.readme_apply_check === 'ok',
      enough_gate_artifacts: installedContext || rawPruneApplied || result.current_surface.artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts,
      source_artifacts_present_or_installed_context_allowed: installedContext || rawPruneApplied || result.current_surface.artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.minimum_closed_gate_artifacts,
      artifacts_parse_as_json: result.current_surface.parse_error_count === 0,
      planning_artifact_present: installedContext || rawPruneApplied || result.current_surface.planning_artifact_present === true,
      installed_context_allows_source_planning_artifact_omission: installedContext,
      future_index_not_created_or_apply_admitted: rawPruneApplied || result.future_compaction_design.index_candidate_present_now === false || result.future_compaction_design.apply_gate_applied === true,
      future_archive_not_created_or_apply_admitted: rawPruneApplied || result.future_compaction_design.archive_candidate_present_now === false || result.future_compaction_design.apply_gate_applied === true,
      raw_artifacts_preserved: rawPruneApplied || result.future_compaction_design.raw_artifacts_preserved_until_apply_gate === true,
      recovery_path_required: result.future_compaction_design.raw_artifact_recovery_required_after_apply === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_files === false,
      no_move_boundary: result.boundary.moves_files === false,
      no_raw_compaction_now: result.boundary.compacts_raw_artifacts_now === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prior_work_item_closed: !milestone.ledger_present || milestone.prior_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    milestone_state: milestone,
    plan: result,
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionPlanText(result = publicClosedGateArtifactCompactionPlan()) {
  const lines = [
    `agent-onboard closed gate artifact compaction plan ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Current surface:',
    `- artifacts: ${result.current_surface.artifact_count}`,
    `- bytes: ${result.current_surface.total_bytes}`,
    `- parse errors: ${result.current_surface.parse_error_count}`,
    '',
    'Future design:',
    `- index: ${result.future_compaction_design.index_candidate_path}`,
    `- archive: ${result.future_compaction_design.archive_candidate_path}`,
    `- raw preserved until apply: ${result.future_compaction_design.raw_artifacts_preserved_until_apply_gate}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes files: ${result.boundary.deletes_files}`,
    `- moves files: ${result.boundary.moves_files}`
  ];
  return `${lines.join('\n')}\n`;
}

const PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W7'].join(''),
  work_item_id: ['P1S3M6', 'W8'].join(''),
  title: 'Public closed gate artifact compaction dry-run gate',
  surface_id: 'closed-gate-artifacts',
  command: 'agent-onboard release --closed-gates-dry-run',
  check_command: 'agent-onboard release --closed-gates-dry-run-check',
  dry_run_artifact_file: '.agent-onboard/public-closed-gate-artifact-compaction-dry-run-gate.json',
  index_candidate: '.agent-onboard/closed-gates.index.json',
  archive_candidate: '.agent-onboard/closed-gates.archive.jsonl',
  minimum_record_count: 30,
  boundary: Object.freeze({
    writes_files: false,
    creates_index_now: false,
    creates_archive_now: false,
    deletes_raw_gate_artifacts: false,
    moves_raw_gate_artifacts: false,
    rewrites_raw_gate_artifacts: false,
    compacts_raw_artifacts_now: false,
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

function publicClosedGateArtifactParsedRecord(root, artifact, ordinal) {
  const absolute = path.join(root, artifact.path);
  let parsed = null;
  try { parsed = readJson(absolute); } catch { parsed = null; }
  const changedFiles = parsed && Array.isArray(parsed.changed_files) ? parsed.changed_files : [];
  const checks = parsed && Array.isArray(parsed.verification_commands) ? parsed.verification_commands : (parsed && Array.isArray(parsed.checks_run) ? parsed.checks_run : []);
  const summary = parsed && typeof parsed.summary === 'string' ? parsed.summary : (parsed && parsed.closure && typeof parsed.closure.summary === 'string' ? parsed.closure.summary : '');
  const rawText = fs.readFileSync(absolute, 'utf8');
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-archive-record-001',
    ordinal,
    path: artifact.path,
    raw_artifact_file_id: artifact.file_id,
    file_id: artifact.file_id,
    byte_count: artifact.bytes,
    schema_id: artifact.schema,
    status: artifact.status,
    package_version: parsed && parsed.package_version ? parsed.package_version : null,
    release_line: parsed && parsed.release_line ? parsed.release_line : null,
    milestone_id: artifact.milestone_id,
    work_item_id: artifact.work_item_id,
    title: artifact.title,
    closed_at: parsed && parsed.closed_at ? parsed.closed_at : null,
    surface_id: parsed && parsed.surface_id ? parsed.surface_id : null,
    changed_files_count: changedFiles.length,
    checks_run_count: checks.length,
    summary_digest: textFileId(summary || `${artifact.path}:${artifact.file_id}`),
    raw_digest: textFileId(rawText),
    content_inlined: false
  });
}

function publicClosedGateArtifactCompactionDryRunMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicClosedGateArtifactArchiveCandidateText(records) {
  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
}

function publicClosedGateArtifactIndexCandidate(root, records, archiveText, options = Object.freeze({})) {
  const byMilestone = {};
  for (const record of records) {
    const key = record.milestone_id || 'unknown';
    byMilestone[key] = (byMilestone[key] || 0) + 1;
  }
  const applyMode = options.status === 'applied';
  return Object.freeze({
    schema: applyMode ? 'agent-onboard-public-closed-gates-index-001' : 'agent-onboard-public-closed-gates-index-preview-001',
    status: applyMode ? 'applied' : 'dry_run_only',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.surface_id,
    source_context: sourceContext(root).package_context,
    source_root_inlined: false,
    index_path: applyMode ? PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.index_path : PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
    archive_candidate_path: applyMode ? PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_APPLY.archive_path : PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate,
    archive_candidate_file_id: textFileId(archiveText),
    record_count: records.length,
    raw_artifact_count: records.length,
    raw_artifacts_preserved: true,
    raw_artifact_paths: records.map((record) => record.path),
    raw_artifact_file_ids: records.map((record) => record.raw_artifact_file_id),
    by_milestone: byMilestone,
    recovery: Object.freeze({
      replay_from_archive_jsonl: true,
      replay_from_raw_artifact_paths: true,
      raw_artifacts_required_until_apply_gate: !applyMode,
      raw_artifacts_preserved_after_apply: applyMode,
      raw_artifacts_required_until_future_prune_gate: applyMode,
      index_is_not_sole_authority: true,
      archive_is_recovery_source: true,
      content_inlined: false
    })
  });
}

function publicClosedGateArtifactCompactionDryRun(root = packageRoot()) {
  const planCheck = publicClosedGateArtifactCompactionPlanCheck(root);
  const artifacts = publicClosedGateArtifactFiles(root);
  const records = artifacts.map((artifact, index) => publicClosedGateArtifactParsedRecord(root, artifact, index + 1));
  const archiveText = publicClosedGateArtifactArchiveCandidateText(records);
  const indexCandidate = publicClosedGateArtifactIndexCandidate(root, records, archiveText);
  const indexText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  const indexPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate));
  const archivePresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate));
  const applyArtifactPresent = fs.existsSync(path.join(root, '.agent-onboard', 'public-closed-gate-artifact-compaction-apply-gate.json'));
  const appliedReplay = indexPresent && archivePresent && applyArtifactPresent;
  const dryRunArtifactPresent = fs.existsSync(path.join(root, PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.dry_run_artifact_file));
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.command,
    check_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    surface_id: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.surface_id,
    plan_gate_check: planCheck.status,
    current: Object.freeze({
      raw_gate_artifact_count: artifacts.length,
      raw_gate_artifact_bytes: artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      parse_error_count: artifacts.filter((artifact) => artifact.parse_error).length,
      index_candidate_present: indexPresent,
      archive_candidate_present: archivePresent,
      dry_run_artifact_present: dryRunArtifactPresent,
      apply_gate_applied: appliedReplay
    }),
    archive_preview: Object.freeze({
      candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate,
      file_id: textFileId(archiveText),
      byte_count: Buffer.byteLength(archiveText, 'utf8'),
      record_count: records.length,
      content_inlined: false,
      first_record: records[0] || null,
      last_record: records[records.length - 1] || null
    }),
    index_preview: Object.freeze({
      candidate_path: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
      file_id: textFileId(indexText),
      byte_count: Buffer.byteLength(indexText, 'utf8'),
      record_count: indexCandidate.record_count,
      archive_candidate_file_id: indexCandidate.archive_candidate_file_id,
      raw_artifacts_preserved: indexCandidate.raw_artifacts_preserved,
      recovery: indexCandidate.recovery
    }),
    recovery_map_preview: Object.freeze({
      raw_artifact_count: records.length,
      raw_artifact_paths_present: records.every((record) => fs.existsSync(path.join(root, record.path))),
      raw_artifact_file_ids_match: records.every((record) => record.raw_artifact_file_id === record.file_id),
      archive_record_file_ids_match_raw: records.every((record) => record.raw_artifact_file_id === record.raw_digest),
      content_inlined: false
    }),
    diff_preview: Object.freeze({
      writes_files_now: false,
      would_write_files_after_future_admission: appliedReplay ? Object.freeze([]) : Object.freeze([
        PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate,
        PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate
      ]),
      would_delete_or_move_raw_artifacts_after_future_admission: false
    }),
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.boundary
  });
}

function publicClosedGateArtifactCompactionDryRunCheck(root = packageRoot()) {
  const result = publicClosedGateArtifactCompactionDryRun(root);
  const milestone = publicClosedGateArtifactCompactionDryRunMilestoneState(root);
  const errors = [];
  const installedContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  if (result.plan_gate_check !== 'ok') errors.push('closed gate dry-run requires closed-gates plan check to pass');
  if (!installedContext && !rawPruneApplied && result.current.raw_gate_artifact_count < PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count) errors.push(`closed gate dry-run requires at least ${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count} raw gate artifacts`);
  if (result.current.parse_error_count !== 0) errors.push('closed gate dry-run requires all raw gate artifacts to parse as JSON');
  if (!rawPruneApplied && result.archive_preview.record_count !== result.current.raw_gate_artifact_count) errors.push('archive preview record count must match raw gate artifact count');
  if (!rawPruneApplied && result.index_preview.record_count !== result.archive_preview.record_count) errors.push('index preview record count must match archive preview record count');
  if (!rawPruneApplied && result.index_preview.archive_candidate_file_id !== result.archive_preview.file_id) errors.push('index preview archive digest must match archive preview digest');
  if (!installedContext && !rawPruneApplied && result.current.dry_run_artifact_present !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.dry_run_artifact_file} must exist after this dry-run gate closes`);
  if (!rawPruneApplied && result.current.index_candidate_present !== false && result.current.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.index_candidate} must not be written by dry-run gate before apply`);
  if (!rawPruneApplied && result.current.archive_candidate_present !== false && result.current.apply_gate_applied !== true) errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.archive_candidate} must not be written by dry-run gate before apply`);
  if (!rawPruneApplied && result.recovery_map_preview.raw_artifact_paths_present !== true) errors.push('recovery map raw artifact paths must still be present');
  if (!rawPruneApplied && result.recovery_map_preview.raw_artifact_file_ids_match !== true) errors.push('recovery map raw artifact file ids must match compact records');
  if (result.diff_preview.writes_files_now !== false) errors.push('closed gate dry-run must not write files now');
  if (result.diff_preview.would_delete_or_move_raw_artifacts_after_future_admission !== false) errors.push('dry-run must not plan raw artifact deletion or movement');
  if (result.boundary.writes_files !== false) errors.push('closed gate dry-run command must be no-write');
  if (result.boundary.deletes_raw_gate_artifacts !== false) errors.push('closed gate dry-run command must not delete raw gate artifacts');
  if (result.boundary.moves_raw_gate_artifacts !== false) errors.push('closed gate dry-run command must not move raw gate artifacts');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.milestone_id} must remain open during closed gate dry-run`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.prerequisite_work_item_id} must be closed before closed gate dry-run passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.work_item_id} must be closed by this dry-run gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.check_command,
    dry_run_command: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.command,
    package_root: root,
    validated: Object.freeze({
      plan_gate_check_passes: result.plan_gate_check === 'ok',
      enough_raw_gate_artifacts: installedContext || rawPruneApplied || result.current.raw_gate_artifact_count >= PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.minimum_record_count,
      raw_gate_artifacts_parse_as_json: result.current.parse_error_count === 0,
      archive_record_count_matches_raw_artifacts: rawPruneApplied || result.archive_preview.record_count === result.current.raw_gate_artifact_count,
      index_record_count_matches_archive: rawPruneApplied || result.index_preview.record_count === result.archive_preview.record_count,
      index_archive_digest_matches_archive_preview: rawPruneApplied || result.index_preview.archive_candidate_file_id === result.archive_preview.file_id,
      dry_run_artifact_present: installedContext || rawPruneApplied || result.current.dry_run_artifact_present === true,
      future_index_not_created_or_apply_admitted: rawPruneApplied || result.current.index_candidate_present === false || result.current.apply_gate_applied === true,
      future_archive_not_created_or_apply_admitted: rawPruneApplied || result.current.archive_candidate_present === false || result.current.apply_gate_applied === true,
      raw_artifacts_preserved: rawPruneApplied || result.recovery_map_preview.raw_artifact_paths_present === true,
      recovery_file_ids_match: rawPruneApplied || result.recovery_map_preview.raw_artifact_file_ids_match === true,
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_raw_gate_artifacts === false,
      no_move_boundary: result.boundary.moves_raw_gate_artifacts === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    milestone_state: milestone,
    dry_run: result,
    boundary: PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN.boundary,
    errors
  });
}

function publicClosedGateArtifactCompactionDryRunText(result = publicClosedGateArtifactCompactionDryRun()) {
  const lines = [
    `agent-onboard closed gate artifact compaction dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Preview:',
    `- records: ${result.archive_preview.record_count}`,
    `- archive bytes: ${result.archive_preview.byte_count}`,
    `- index bytes: ${result.index_preview.byte_count}`,
    `- writes now: ${result.diff_preview.writes_files_now}`,
    '',
    'Boundary:',
    `- writes files: ${result.boundary.writes_files}`,
    `- deletes raw artifacts: ${result.boundary.deletes_raw_gate_artifacts}`,
    `- moves raw artifacts: ${result.boundary.moves_raw_gate_artifacts}`
  ];
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_PLAN,
    PUBLIC_CLOSED_GATE_ARTIFACT_COMPACTION_DRY_RUN,
    publicClosedGateArtifactFiles,
    publicClosedGateArtifactParsedRecord,
    publicClosedGateArtifactArchiveCandidateText,
    publicClosedGateArtifactIndexCandidate,
    publicClosedGateArtifactCompactionPlan,
    publicClosedGateArtifactCompactionPlanCheck,
    publicClosedGateArtifactCompactionPlanText,
    publicClosedGateArtifactCompactionDryRun,
    publicClosedGateArtifactCompactionDryRunCheck,
    publicClosedGateArtifactCompactionDryRunText,
  });
}

module.exports = Object.freeze({
  createClosedGateCompactionRuntime
});
