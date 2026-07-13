'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createReadmeHistoryArchiveRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN, publicReadmeFirstReadHistorySplitPlanCheck } = ctx;

const PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN = Object.freeze({
  schema: 'agent-onboard-public-readme-history-archive-split-dry-run-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'readme-first-read-history',
  prerequisite_work_item_id: ['P1S3M6', 'W4'].join(''),
  work_item_id: ['P1S3M6', 'W5'].join(''),
  title: 'Public README history archive split dry-run gate',
  command: 'agent-onboard release --readme-dry-run',
  check_command: 'agent-onboard release --readme-dry-run-check',
  artifact_file: '.agent-onboard/public-readme-history-archive-split-dry-run-gate.json',
  purpose: 'Compute an exact in-memory README history archive split preview, with source line ranges and candidate digests, before any README or archive file is written.',
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    history_archive_candidate: 'docs/release-history.md',
    history_index_candidate: '.agent-onboard/readme-history.index.json'
  }),
  retained_live_readme_markers: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers,
  extraction: Object.freeze({
    source_heading_selector: '^##\\s+(?:Current release|Previous release)\\b',
    replacement_pointer_heading: '## Release history',
    min_history_sections: 5,
    max_archive_preview_bytes: 90000,
    max_live_readme_preview_bytes: 90000,
    max_index_preview_bytes: 32768
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    creates_history_archive: false,
    creates_history_index: false,
    rewrites_readme: false,
    deletes_files: false,
    moves_files: false,
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

function textFileId(text) {
  return `ni:///sha-256;${crypto.createHash('sha256').update(text).digest('base64url')}`;
}


function publicReadmeHistoryArchiveSplitAppliedState(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const archivePath = path.join(root, 'docs', 'release-history.md');
  const indexPath = path.join(root, '.agent-onboard', 'readme-history.index.json');
  const artifactPath = path.join(root, '.agent-onboard', 'public-readme-history-archive-split-apply-gate.json');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const archive = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf8') : '';
  let index = null;
  let indexStatus = 'missing';
  if (fs.existsSync(indexPath)) {
    try {
      index = readJson(indexPath);
      indexStatus = 'present_valid_json';
    } catch (error) {
      indexStatus = 'present_invalid_json';
    }
  }
  const liveHistorySections = publicReadmeHistoryArchiveSections(readme);
  const archiveHistorySections = publicReadmeHistoryArchiveSections(archive);
  const readmeFileId = textFileId(readme);
  const archiveFileId = textFileId(archive);
  const indexFileText = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  return Object.freeze({
    applied: fs.existsSync(archivePath) && fs.existsSync(indexPath) && index && index.status === 'applied',
    readme_path: 'README.md',
    readme_present: fs.existsSync(readmePath),
    readme_file_id: readmeFileId,
    readme_bytes: Buffer.byteLength(readme, 'utf8'),
    readme_release_history_pointer_present: readme.includes('## Release history') && readme.includes('docs/release-history.md'),
    live_history_section_count: liveHistorySections.length,
    history_archive_path: 'docs/release-history.md',
    history_archive_present: fs.existsSync(archivePath),
    history_archive_file_id: archiveFileId,
    history_archive_bytes: Buffer.byteLength(archive, 'utf8'),
    archive_history_section_count: archiveHistorySections.length,
    history_index_path: '.agent-onboard/readme-history.index.json',
    history_index_present: fs.existsSync(indexPath),
    history_index_status: indexStatus,
    history_index_file_id: textFileId(indexFileText),
    history_index_section_count: index && Array.isArray(index.sections) ? index.sections.length : 0,
    history_index_live_readme_file_id: index ? index.live_readme_file_id || null : null,
    history_index_archive_file_id: index ? index.history_archive_file_id || null : null,
    apply_artifact_path: '.agent-onboard/public-readme-history-archive-split-apply-gate.json',
    apply_artifact_present: fs.existsSync(artifactPath),
    index
  });
}

function publicReadmeHistoryArchiveSections(readme) {
  const lines = readme.split(/\r?\n/);
  const headingRegex = /^##\s+(?:Current release|Previous release)\b/i;
  const sectionStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (headingRegex.test(lines[index])) sectionStarts.push(index);
  }
  return sectionStarts.map((startIndex, sectionIndex) => {
    let endIndexExclusive = lines.length;
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (/^##\s+/.test(lines[index])) {
        endIndexExclusive = index;
        break;
      }
    }
    const text = `${lines.slice(startIndex, endIndexExclusive).join('\n')}\n`;
    return Object.freeze({
      ordinal: sectionIndex + 1,
      heading: lines[startIndex],
      source_path: 'README.md',
      start_line: startIndex + 1,
      end_line: endIndexExclusive,
      byte_count: Buffer.byteLength(text, 'utf8'),
      file_id: textFileId(text),
      start_index: startIndex,
      end_index_exclusive: endIndexExclusive,
      content: text
    });
  });
}

function publicReadmeHistoryArchiveCandidate(readme, sections) {
  const header = [
    '# agent-onboard release history',
    '',
    'This is an in-memory dry-run candidate derived from README.md historical release sections.',
    'It is not written by this command and does not replace README.md authority.',
    ''
  ].join('\n');
  const body = sections.map((section) => section.content.trimEnd()).join('\n\n');
  return `${header}${body}\n`;
}

function publicReadmeHistoryLiveReadmeCandidate(readme, sections) {
  const lines = readme.split(/\r?\n/);
  const skip = new Set();
  for (const section of sections) {
    for (let index = section.start_index; index < section.end_index_exclusive; index += 1) skip.add(index);
  }
  const insertIndex = sections.length > 0 ? sections[0].start_index : lines.length;
  const pointer = [
    '## Release history',
    '',
    'Historical release prose is planned for `docs/release-history.md` after an admitted write gate. Current install, quickstart, command, and no-mutation boundary material remains in this README.',
    ''
  ];
  const output = [];
  let inserted = false;
  for (let index = 0; index < lines.length; index += 1) {
    if (!inserted && index === insertIndex) {
      output.push(...pointer);
      inserted = true;
    }
    if (skip.has(index)) continue;
    output.push(lines[index]);
  }
  if (!inserted) output.push('', ...pointer);
  return `${output.join('\n').replace(/\n{4,}/g, '\n\n\n').trimEnd()}\n`;
}

function publicReadmeHistoryArchiveSplitMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id,
      prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id,
      work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      prerequisite_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id) || null;
  const prerequisiteWorkItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.milestone_id,
    prerequisite_work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.prerequisite_work_item_id,
    work_item_id: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    prerequisite_work_item_status: prerequisiteWorkItem ? prerequisiteWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    prerequisite_work_item_title: prerequisiteWorkItem ? prerequisiteWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeHistoryArchiveSplitDryRun(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const rawSections = publicReadmeHistoryArchiveSections(readme);
  const appliedReplay = rawSections.length === 0 && applyState.applied;
  const sections = appliedReplay && applyState.index && Array.isArray(applyState.index.sections)
    ? applyState.index.sections.map((section) => Object.freeze({
      ordinal: section.ordinal,
      heading: section.heading,
      source_path: section.source_path,
      start_line: section.start_line,
      end_line: section.end_line,
      byte_count: section.byte_count,
      file_id: section.file_id,
      start_index: 0,
      end_index_exclusive: 0,
      content: ''
    }))
    : rawSections;
  const archiveCandidate = appliedReplay && applyState.history_archive_present
    ? fs.readFileSync(path.join(root, applyState.history_archive_path), 'utf8')
    : publicReadmeHistoryArchiveCandidate(readme, sections);
  const liveReadmeCandidate = appliedReplay ? readme : publicReadmeHistoryLiveReadmeCandidate(readme, sections);
  const indexCandidate = appliedReplay && applyState.index ? applyState.index : {
    schema: 'agent-onboard-public-readme-history-index-preview-001',
    status: 'dry_run_only',
    source_file: 'README.md',
    source_file_id: textFileId(readme),
    history_archive_candidate: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.planned_surfaces.history_archive_candidate,
    history_archive_candidate_file_id: textFileId(archiveCandidate),
    live_readme_candidate_file_id: textFileId(liveReadmeCandidate),
    section_count: sections.length,
    sections: sections.map((section) => Object.freeze({
      ordinal: section.ordinal,
      heading: section.heading,
      source_path: section.source_path,
      start_line: section.start_line,
      end_line: section.end_line,
      byte_count: section.byte_count,
      file_id: section.file_id
    }))
  };
  const indexCandidateText = `${JSON.stringify(indexCandidate, null, 2)}\n`;
  const retainedMarkers = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.retained_live_readme_markers.map((marker) => Object.freeze({
    marker,
    present_in_live_candidate: liveReadmeCandidate.includes(marker)
  }));
  const planned = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.planned_surfaces;
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-dry-run-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.command,
    check_command: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.check_command,
    package_root: root,
    plan_gate_check: publicReadmeFirstReadHistorySplitPlanCheck(root).status,
    dry_run: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN,
    replay_mode: appliedReplay ? 'post_apply_replay_from_archive_index' : 'pre_apply_in_memory_preview',
    current: Object.freeze({
      readme_path: 'README.md',
      readme_present: fs.existsSync(readmePath),
      readme_bytes: Buffer.byteLength(readme, 'utf8'),
      readme_lines: readme.length === 0 ? 0 : readme.split(/\r?\n/).length,
      readme_file_id: textFileId(readme),
      history_archive_present: fs.existsSync(path.join(root, planned.history_archive_candidate)),
      history_index_present: fs.existsSync(path.join(root, planned.history_index_candidate)),
      apply_gate_applied: applyState.applied
    }),
    archive_preview: Object.freeze({
      candidate_path: planned.history_archive_candidate,
      section_count: sections.length,
      source_sections: sections.map((section) => Object.freeze({
        ordinal: section.ordinal,
        heading: section.heading,
        start_line: section.start_line,
        end_line: section.end_line,
        byte_count: section.byte_count,
        file_id: section.file_id
      })),
      byte_count: Buffer.byteLength(archiveCandidate, 'utf8'),
      file_id: textFileId(archiveCandidate),
      content_inlined: false
    }),
    live_readme_preview: Object.freeze({
      candidate_path: planned.live_readme,
      replacement_pointer_heading: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.replacement_pointer_heading,
      retained_first_read_markers: retainedMarkers,
      byte_count: Buffer.byteLength(liveReadmeCandidate, 'utf8'),
      file_id: textFileId(liveReadmeCandidate),
      content_inlined: false
    }),
    index_preview: Object.freeze({
      candidate_path: planned.history_index_candidate,
      byte_count: Buffer.byteLength(indexCandidateText, 'utf8'),
      file_id: textFileId(indexCandidateText),
      section_count: sections.length,
      content_inlined: false
    }),
    apply_state: applyState,
    diff_preview: Object.freeze({
      writes_files_now: false,
      would_write_files_after_future_admission: Object.freeze([
        planned.live_readme,
        planned.history_archive_candidate,
        planned.history_index_candidate
      ]),
      readme_line_ranges_to_archive: sections.map((section) => Object.freeze({
        heading: section.heading,
        start_line: section.start_line,
        end_line: section.end_line
      })),
      readme_replacement: Object.freeze({
        heading: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.extraction.replacement_pointer_heading,
        points_to: planned.history_archive_candidate,
        exact_content_inlined: false
      })
    }),
    boundary: PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN.boundary
  });
}

function publicReadmeHistoryArchiveSplitDryRunCheck(root = packageRoot()) {
  const result = publicReadmeHistoryArchiveSplitDryRun(root);
  const milestone = publicReadmeHistoryArchiveSplitMilestoneState(root);
  const installedPackageContext = sourceContext(root).package_context === 'installed_package';
  const errors = [];
  const dryRun = PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN;
  if (result.plan_gate_check !== 'ok') errors.push('README split planning check must pass before archive split dry-run');
  if (!result.current.readme_present) errors.push('README.md must be present before README history archive split dry-run');
  if (!installedPackageContext && result.archive_preview.section_count < dryRun.extraction.min_history_sections) errors.push(`README history archive dry-run must identify at least ${dryRun.extraction.min_history_sections} history sections`);
  if (!installedPackageContext && result.archive_preview.byte_count <= 0) errors.push('README history archive dry-run must produce a non-empty archive preview');
  if (result.archive_preview.byte_count > dryRun.extraction.max_archive_preview_bytes) errors.push(`README history archive preview bytes ${result.archive_preview.byte_count} exceeds budget ${dryRun.extraction.max_archive_preview_bytes}`);
  if (result.live_readme_preview.byte_count > dryRun.extraction.max_live_readme_preview_bytes) errors.push(`live README preview bytes ${result.live_readme_preview.byte_count} exceeds budget ${dryRun.extraction.max_live_readme_preview_bytes}`);
  if (result.index_preview.byte_count > dryRun.extraction.max_index_preview_bytes) errors.push(`README history index preview bytes ${result.index_preview.byte_count} exceeds budget ${dryRun.extraction.max_index_preview_bytes}`);
  if (result.current.history_archive_present && !result.current.apply_gate_applied && !installedPackageContext) errors.push(`${dryRun.planned_surfaces.history_archive_candidate} must not be created before the admitted apply gate`);
  if (result.current.history_index_present && !result.current.apply_gate_applied && !installedPackageContext) errors.push(`${dryRun.planned_surfaces.history_index_candidate} must not be created before the admitted apply gate`);
  for (const marker of result.live_readme_preview.retained_first_read_markers) {
    if (!marker.present_in_live_candidate) errors.push(`live README candidate would drop first-read marker: ${marker.marker}`);
  }
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README history archive dry-run commands must remain read-only');
  if (result.boundary.creates_history_archive !== false || result.boundary.creates_history_index !== false || result.boundary.rewrites_readme !== false) errors.push('README history archive dry-run must not create archive/index or rewrite README');
  if (result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README history archive dry-run must not delete or move files');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${dryRun.milestone_id} must remain open during README history archive split dry-run`);
    if (milestone.prerequisite_work_item_status !== 'closed') errors.push(`${dryRun.prerequisite_work_item_id} must be closed before README history archive split dry-run`);
    if (milestone.work_item_status !== 'closed') errors.push(`${dryRun.work_item_id} must be closed by this README history archive split dry-run gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-history-archive-split-dry-run-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: dryRun.check_command,
    dry_run_command: dryRun.command,
    package_root: root,
    validated: Object.freeze({
      plan_gate_check_passes: result.plan_gate_check === 'ok',
      readme_present: result.current.readme_present,
      enough_history_sections_identified: result.archive_preview.section_count >= dryRun.extraction.min_history_sections || installedPackageContext,
      archive_preview_non_empty: result.archive_preview.byte_count > 0 || installedPackageContext,
      installed_package_context_allows_archive_omission: installedPackageContext,
      archive_preview_within_budget: result.archive_preview.byte_count <= dryRun.extraction.max_archive_preview_bytes,
      live_readme_preview_within_budget: result.live_readme_preview.byte_count <= dryRun.extraction.max_live_readme_preview_bytes,
      index_preview_within_budget: result.index_preview.byte_count <= dryRun.extraction.max_index_preview_bytes,
      future_archive_not_created: result.current.history_archive_present === false || result.current.apply_gate_applied || installedPackageContext,
      future_index_not_created: result.current.history_index_present === false || result.current.apply_gate_applied || installedPackageContext,
      apply_gate_admitted_when_archive_present: result.current.history_archive_present === false || result.current.apply_gate_applied || installedPackageContext,
      live_readme_candidate_retains_first_read_markers: result.live_readme_preview.retained_first_read_markers.every((marker) => marker.present_in_live_candidate),
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_archive_index_readme_write: result.boundary.creates_history_archive === false && result.boundary.creates_history_index === false && result.boundary.rewrites_readme === false,
      no_delete_or_move: result.boundary.deletes_files === false && result.boundary.moves_files === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      prerequisite_work_item_closed: !milestone.ledger_present || milestone.prerequisite_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    dry_run: result,
    milestone_state: milestone,
    boundary: dryRun.boundary,
    errors
  });
}

function publicReadmeHistoryArchiveSplitDryRunText(result = publicReadmeHistoryArchiveSplitDryRun()) {
  const lines = [
    `agent-onboard README history archive split dry-run ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Archive preview:',
    `- candidate: ${result.archive_preview.candidate_path}`,
    `- sections: ${result.archive_preview.section_count}`,
    `- bytes: ${result.archive_preview.byte_count}`,
    '',
    'Live README preview:',
    `- candidate: ${result.live_readme_preview.candidate_path}`,
    `- bytes: ${result.live_readme_preview.byte_count}`,
    '',
    'Boundary:',
    `- Writes files now: ${result.diff_preview.writes_files_now}`,
    `- Creates archive now: ${result.boundary.creates_history_archive}`,
    `- Creates index now: ${result.boundary.creates_history_index}`,
    `- Rewrites README now: ${result.boundary.rewrites_readme}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_README_HISTORY_ARCHIVE_SPLIT_DRY_RUN,
    textFileId,
    publicReadmeHistoryArchiveSplitAppliedState,
    publicReadmeHistoryArchiveSections,
    publicReadmeHistoryArchiveCandidate,
    publicReadmeHistoryLiveReadmeCandidate,
    publicReadmeHistoryArchiveSplitDryRun,
    publicReadmeHistoryArchiveSplitDryRunCheck,
    publicReadmeHistoryArchiveSplitDryRunText,
  });
}

module.exports = Object.freeze({
  createReadmeHistoryArchiveRuntime
});
