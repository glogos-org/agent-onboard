'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createReadmeHistoryApplyRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN, PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN, publicReadmeHistoryArchiveSplitAppliedState, publicReadmeHistoryArchiveSplitDryRunCheck, publicClosedGateRawArtifactPruneApplyAdmitted } = ctx;

const PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY = Object.freeze({
  schema: 'agent-onboard-public-readme-history-archive-split-apply-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  prerequisite_work_item_id: ['P1S3M6', 'W5'].join(''),
  work_item_id: ['P1S3M6', 'W6'].join(''),
  title: 'Public README history archive split apply gate',
  command: 'agent-onboard release --readme-apply',
  check_command: 'agent-onboard release --readme-apply-check',
  artifact_file: '.agent-onboard/public-readme-history-archive-split-apply-gate.json',
  purpose: 'Verify the admitted README history archive split after README.md has been rewritten to a first-read surface and historical release prose has been archived with a recovery index.',
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    history_archive: 'docs/release-history.md',
    history_index: '.agent-onboard/readme-history.index.json'
  }),
  retained_live_readme_markers: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers,
  extraction: Object.freeze({
    source_heading_selector: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.source_heading_selector,
    replacement_pointer_heading: '## Release history',
    min_history_sections: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.min_history_sections,
    max_archive_bytes: 90000,
    max_live_readme_bytes: 90000,
    max_index_bytes: 32768
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    repository_write_admitted_by_gate: true,
    creates_history_archive: true,
    creates_history_index: true,
    rewrites_readme: true,
    deletes_files: false,
    moves_files: false,
    command_mutates_work_items: false,
    command_mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false
  })
});

function publicReadmeHistoryArchiveSplitApplyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id,
      prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id,
      work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.milestone_id,
    prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.prerequisite_work_item_id,
    work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeHistoryArchiveSplitApply(root = packageRoot()) {
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const markerStatus = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.retained_live_readme_markers.map((marker) => Object.freeze({
    marker,
    present_in_live_readme: fs.existsSync(path.join(root, 'README.md')) && fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes(marker)
  }));
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-apply-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.command,
    check_command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.check_command,
    package_root: root,
    package_context: sourceContext(root).package_context,
    dry_run_check: publicReadmeHistoryArchiveSplitDryRunCheck(root).status,
    apply: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY,
    current: applyState,
    live_readme: Object.freeze({
      path: applyState.readme_path,
      present: applyState.readme_present,
      byte_count: applyState.readme_bytes,
      file_id: applyState.readme_file_id,
      release_history_pointer_present: applyState.readme_release_history_pointer_present,
      retained_first_read_markers: markerStatus,
      archived_history_sections_remaining: applyState.live_history_section_count
    }),
    archive: Object.freeze({
      path: applyState.history_archive_path,
      present: applyState.history_archive_present,
      byte_count: applyState.history_archive_bytes,
      file_id: applyState.history_archive_file_id,
      section_count: applyState.archive_history_section_count
    }),
    index: Object.freeze({
      path: applyState.history_index_path,
      present: applyState.history_index_present,
      status: applyState.history_index_status,
      byte_count: fs.existsSync(path.join(root, applyState.history_index_path)) ? Buffer.byteLength(fs.readFileSync(path.join(root, applyState.history_index_path), 'utf8'), 'utf8') : 0,
      file_id: applyState.history_index_file_id,
      section_count: applyState.history_index_section_count,
      live_readme_file_id: applyState.history_index_live_readme_file_id,
      history_archive_file_id: applyState.history_index_archive_file_id
    }),
    boundary: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY.boundary
  });
}

function publicReadmeHistoryArchiveSplitApplyCheck(root = packageRoot()) {
  const result = publicReadmeHistoryArchiveSplitApply(root);
  const milestone = publicReadmeHistoryArchiveSplitApplyMilestoneState(root);
  const installedPackageContext = result.package_context === 'installed_package';
  const rawPruneApplied = publicClosedGateRawArtifactPruneApplyAdmitted(root);
  const errors = [];
  const apply = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY;
  if (result.dry_run_check !== 'ok') errors.push('README history archive split dry-run check must pass before apply check');
  if (!result.current.applied && !installedPackageContext) errors.push('README history archive split must be applied with archive and index status applied');
  if (!result.current.apply_artifact_present && !installedPackageContext && !rawPruneApplied) errors.push(`${apply.artifact_file} must be present after apply`);
  if (!result.live_readme.present) errors.push('README.md must remain present after archive split apply');
  if (!result.live_readme.release_history_pointer_present) errors.push('README.md must contain a release history pointer to docs/release-history.md');
  if (result.live_readme.archived_history_sections_remaining !== 0) errors.push('README.md must not retain archived Current release/Previous release sections after apply');
  if (!result.archive.present && !installedPackageContext) errors.push(`${apply.planned_surfaces.history_archive} must be present after apply`);
  if (!installedPackageContext && result.archive.section_count < apply.extraction.min_history_sections) errors.push(`history archive must retain at least ${apply.extraction.min_history_sections} sections`);
  if (!installedPackageContext && (result.archive.byte_count <= 0 || result.archive.byte_count > apply.extraction.max_archive_bytes)) errors.push(`history archive byte count ${result.archive.byte_count} outside apply budget`);
  if (!installedPackageContext && (!result.index.present || result.index.status !== 'present_valid_json')) errors.push(`${apply.planned_surfaces.history_index} must be present and valid JSON after apply`);
  if (!installedPackageContext && result.index.section_count !== result.archive.section_count) errors.push('README history index section count must match archive section count');
  if (!installedPackageContext && result.index.live_readme_file_id !== result.live_readme.file_id) errors.push('README history index live_readme_file_id must match current README.md');
  if (!installedPackageContext && result.index.history_archive_file_id !== result.archive.file_id) errors.push('README history index history_archive_file_id must match current release history archive');
  for (const marker of result.live_readme.retained_first_read_markers) {
    if (!marker.present_in_live_readme) errors.push(`README.md dropped first-read marker after apply: ${marker.marker}`);
  }
  if (result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README archive split apply must not delete or move files');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README archive split apply commands must remain read-only verifiers');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('README archive split apply must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${apply.milestone_id} must remain open during README history archive split apply`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${apply.prerequisite_work_item_id} must be closed before README history archive split apply`);
    if (milestone.work_item_status !== 'closed') errors.push(`${apply.work_item_id} must be closed by this README history archive split apply gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-apply-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: apply.check_command,
    apply_command: apply.command,
    package_root: root,
    validated: Object.freeze({
      dry_run_check_passes: result.dry_run_check === 'ok',
      apply_state_present: result.current.applied || installedPackageContext,
      apply_artifact_present: result.current.apply_artifact_present || installedPackageContext || rawPruneApplied,
      installed_package_context_allows_source_archive_omission: installedPackageContext,
      readme_present: result.live_readme.present,
      readme_release_history_pointer_present: result.live_readme.release_history_pointer_present,
      readme_archived_sections_removed: result.live_readme.archived_history_sections_remaining === 0,
      archive_present: result.archive.present || installedPackageContext,
      archive_section_count_retained: result.archive.section_count >= apply.extraction.min_history_sections || installedPackageContext,
      index_present_valid_json: (result.index.present && result.index.status === 'present_valid_json') || installedPackageContext,
      index_matches_archive_section_count: result.index.section_count === result.archive.section_count || installedPackageContext,
      index_live_readme_digest_matches: result.index.live_readme_file_id === result.live_readme.file_id || installedPackageContext,
      index_archive_digest_matches: result.index.history_archive_file_id === result.archive.file_id || installedPackageContext,
      live_readme_retains_first_read_markers: result.live_readme.retained_first_read_markers.every((marker) => marker.present_in_live_readme),
      no_delete_or_move: result.boundary.deletes_files === false && result.boundary.moves_files === false,
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

function publicReadmeHistoryArchiveSplitApplyText(result = publicReadmeHistoryArchiveSplitApply()) {
  const lines = [
    `agent-onboard README history archive split apply ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Applied surfaces:',
    `- README: ${result.live_readme.path} (${result.live_readme.byte_count} bytes)`,
    `- archive: ${result.archive.path} (${result.archive.section_count} sections, ${result.archive.byte_count} bytes)`,
    `- index: ${result.index.path} (${result.index.section_count} sections)`,
    '',
    'Boundary:',
    `- Deletes files: ${result.boundary.deletes_files}`,
    `- Moves files: ${result.boundary.moves_files}`,
    `- Publishes package: ${result.boundary.publishes_package}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


  return Object.freeze({
    PUBLIC_README_HISTORY_ARCHIVE_SPLIT_APPLY,
    publicReadmeHistoryArchiveSplitApply,
    publicReadmeHistoryArchiveSplitApplyCheck,
    publicReadmeHistoryArchiveSplitApplyText,
  });
}

module.exports = Object.freeze({
  createReadmeHistoryApplyRuntime
});
