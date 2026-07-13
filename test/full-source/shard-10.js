'use strict';

module.exports = function registerFullSourceShard(fullSourceTest, context) {
  const {
    assert,
    fs,
    os,
    path,
    spawnSync,
    ROOT,
    CLI,
    PACKAGE_JSON,
    EXPECTED_VERSION,
    EXPECTED_RELEASE_LINE,
    EXPECTED_VERSIONED_NPX,
    TARGET_CONFIG_FILE,
    EXPECTED_PACK_FILES,
    EXPECTED_PACK_FILES_SORTED,
    copyExpectedPackFiles,
    run,
    targetConfigPath,
    writeTargetConfig,
    readJsonOutput,
    readJsonFailure,
    readJsonlFile,
    readClosureArchiveByRef,
    runNpmPackDryRun,
    runNpm,
    packSourceTarball,
    runNodeScript,
    tempRepo,
    cliTargetConfigForTest,
    writeWorkItemsLedger
  } = context;

  fullSourceTest('public closed gate artifact compaction plan is no-write and release-checked', () => {
    const plan = readJsonOutput(run(['release', '--closed-gates-plan']));
    assert.strictEqual(plan.schema, 'agent-onboard-public-closed-gate-artifact-compaction-plan-result-001');
    assert.strictEqual(plan.status, 'ok');
    assert.strictEqual(plan.version, EXPECTED_VERSION);
    assert.strictEqual(plan.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(plan.command, 'agent-onboard release --closed-gates-plan');
    assert.strictEqual(plan.surface_id, 'closed-gate-artifacts');
    assert.strictEqual(plan.current_surface.artifact_count, 0);
    assert.strictEqual(plan.current_surface.total_bytes, 0);
    assert.strictEqual(plan.current_surface.parse_error_count, 0);
    assert.strictEqual(plan.future_compaction_design.apply_gate_applied, false);
    assert.strictEqual(plan.future_compaction_design.index_candidate_present_now, true);
    assert.strictEqual(plan.future_compaction_design.archive_candidate_present_now, true);
    assert.strictEqual(plan.future_compaction_design.raw_artifacts_preserved_until_apply_gate, true);
    assert.strictEqual(plan.future_compaction_design.raw_artifact_recovery_required_after_apply, true);
    assert.strictEqual(plan.boundary.writes_files, false);
    assert.strictEqual(plan.boundary.deletes_files, false);
    assert.strictEqual(plan.boundary.moves_files, false);
    assert.strictEqual(plan.boundary.compacts_raw_artifacts_now, false);

    const check = readJsonOutput(run(['release', '--closed-gates-plan-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-artifact-compaction-plan-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-plan-check');
    assert.strictEqual(check.validated.clean_catalog_check_passes, true);
    assert.strictEqual(check.validated.readme_apply_check_passes, true);
    assert.strictEqual(check.validated.enough_gate_artifacts, true);
    assert.strictEqual(check.validated.artifacts_parse_as_json, true);
    assert.strictEqual(check.validated.planning_artifact_present, true);
    assert.strictEqual(check.validated.future_index_not_created_or_apply_admitted, true);
    assert.strictEqual(check.validated.future_archive_not_created_or_apply_admitted, true);
    assert.strictEqual(check.validated.raw_artifacts_preserved, true);
    assert.strictEqual(check.validated.recovery_path_required, true);
    assert.strictEqual(check.validated.no_write_boundary, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate artifact compaction dry-run is exact and no-write', () => {
    const dryRun = readJsonOutput(run(['release', '--closed-gates-dry-run']));
    assert.strictEqual(dryRun.schema, 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-result-001');
    assert.strictEqual(dryRun.status, 'ok');
    assert.strictEqual(dryRun.version, EXPECTED_VERSION);
    assert.strictEqual(dryRun.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(dryRun.command, 'agent-onboard release --closed-gates-dry-run');
    assert.strictEqual(dryRun.surface_id, 'closed-gate-artifacts');
    assert.strictEqual(dryRun.plan_gate_check, 'ok');
    assert.strictEqual(dryRun.current.raw_gate_artifact_count, 0);
    assert.strictEqual(dryRun.current.parse_error_count, 0);
    assert.strictEqual(dryRun.current.apply_gate_applied, false);
    assert.strictEqual(dryRun.current.index_candidate_present, true);
    assert.strictEqual(dryRun.current.archive_candidate_present, true);
    assert.strictEqual(dryRun.archive_preview.record_count, dryRun.current.raw_gate_artifact_count);
    assert.strictEqual(dryRun.index_preview.record_count, dryRun.archive_preview.record_count);
    assert.strictEqual(dryRun.index_preview.archive_candidate_file_id, dryRun.archive_preview.file_id);
    assert.strictEqual(dryRun.recovery_map_preview.raw_artifact_paths_present, true);
    assert.strictEqual(dryRun.recovery_map_preview.raw_artifact_file_ids_match, true);
    assert.strictEqual(dryRun.diff_preview.writes_files_now, false);
    assert.deepStrictEqual(dryRun.diff_preview.would_write_files_after_future_admission, [
      '.agent-onboard/closed-gates.index.json',
      '.agent-onboard/closed-gates.archive.jsonl',
    ]);
    assert.strictEqual(dryRun.diff_preview.would_delete_or_move_raw_artifacts_after_future_admission, false);
    assert.strictEqual(dryRun.boundary.writes_files, false);
    assert.strictEqual(dryRun.boundary.deletes_raw_gate_artifacts, false);
    assert.strictEqual(dryRun.boundary.moves_raw_gate_artifacts, false);

    const check = readJsonOutput(run(['release', '--closed-gates-dry-run-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-artifact-compaction-dry-run-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-dry-run-check');
    assert.strictEqual(check.validated.plan_gate_check_passes, true);
    assert.strictEqual(check.validated.enough_raw_gate_artifacts, true);
    assert.strictEqual(check.validated.raw_gate_artifacts_parse_as_json, true);
    assert.strictEqual(check.validated.archive_record_count_matches_raw_artifacts, true);
    assert.strictEqual(check.validated.index_record_count_matches_archive, true);
    assert.strictEqual(check.validated.index_archive_digest_matches_archive_preview, true);
    assert.strictEqual(check.validated.dry_run_artifact_present, true);
    assert.strictEqual(check.validated.future_index_not_created_or_apply_admitted, true);
    assert.strictEqual(check.validated.future_archive_not_created_or_apply_admitted, true);
    assert.strictEqual(check.validated.raw_artifacts_preserved, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate artifact compaction apply verifies archive and compact index', () => {
    const apply = readJsonOutput(run(['release', '--closed-gates-apply']));
    assert.strictEqual(apply.schema, 'agent-onboard-public-closed-gate-artifact-compaction-apply-result-001');
    assert.strictEqual(apply.status, 'ok');
    assert.strictEqual(apply.version, EXPECTED_VERSION);
    assert.strictEqual(apply.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(apply.command, 'agent-onboard release --closed-gates-apply');
    assert.strictEqual(apply.surface_id, 'closed-gate-artifacts');
    assert.strictEqual(apply.current.applied, false);
    assert.strictEqual(apply.current.index_present, true);
    assert.strictEqual(apply.current.archive_present, true);
    assert.strictEqual(apply.current.apply_artifact_present, false);
    assert.ok(apply.archive.record_count >= 30);
    assert.strictEqual(apply.archive.matches_expected, false);
    assert.strictEqual(apply.index.matches_expected, false);
    assert.strictEqual(apply.recovery.raw_gate_artifacts_preserved, true);
    assert.strictEqual(apply.recovery.index_archive_digest_matches_archive, true);
    assert.strictEqual(apply.boundary.deletes_raw_gate_artifacts, false);
    assert.strictEqual(apply.boundary.moves_raw_gate_artifacts, false);

    const check = readJsonOutput(run(['release', '--closed-gates-apply-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-artifact-compaction-apply-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-apply-check');
    assert.strictEqual(check.validated.dry_run_check_passes, true);
    assert.strictEqual(check.validated.apply_state_present, true);
    assert.strictEqual(check.validated.archive_record_count_matches_raw_artifacts, true);
    assert.strictEqual(check.validated.index_record_count_matches_archive, true);
    assert.strictEqual(check.validated.index_archive_digest_matches_archive, true);
    assert.strictEqual(check.validated.archive_matches_generated_candidate, true);
    assert.strictEqual(check.validated.index_matches_generated_candidate, true);
    assert.strictEqual(check.validated.raw_gate_artifacts_preserved, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate archive reader verifies compact archive recovery and bounded full-test runner', () => {
    const reader = readJsonOutput(run(['release', '--closed-gates-read']));
    assert.strictEqual(reader.schema, 'agent-onboard-public-closed-gate-archive-reader-result-001');
    assert.strictEqual(reader.status, 'ok');
    assert.strictEqual(reader.version, EXPECTED_VERSION);
    assert.strictEqual(reader.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(reader.command, 'agent-onboard release --closed-gates-read');
    assert.strictEqual(reader.surface_id, 'closed-gate-archive-reader');
    assert.strictEqual(reader.apply_check_status, 'ok');
    assert.strictEqual(reader.index.present, true);
    assert.strictEqual(reader.index.status, 'present_valid_json');
    assert.strictEqual(reader.archive.present, true);
    assert.strictEqual(reader.archive.parse_error_count, 0);
    assert.ok(reader.archive.record_count >= 30);
    assert.strictEqual(reader.index.record_count, reader.archive.record_count);
    assert.strictEqual(reader.index.archive_file_id, reader.archive.file_id);
    assert.strictEqual(reader.reader.unique_paths, reader.archive.record_count);
    assert.strictEqual(reader.reader.unique_ordinals, reader.archive.record_count);
    assert.strictEqual(reader.reader.ordinal_sequence_contiguous, true);
    assert.strictEqual(reader.recovery.raw_gate_artifacts_present, false);
    assert.strictEqual(reader.recovery.raw_gate_artifact_file_ids_match_archive, false);
    assert.strictEqual(reader.test_runner_hardening.per_task_timeout_configured, true);
    assert.strictEqual(reader.boundary.writes_files, false);
    assert.strictEqual(reader.boundary.raw_artifact_content_inlined, false);

    const check = readJsonOutput(run(['release', '--closed-gates-read-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-archive-reader-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-read-check');
    assert.strictEqual(check.validated.apply_check_passes, true);
    assert.strictEqual(check.validated.index_present_valid_json, true);
    assert.strictEqual(check.validated.archive_records_parse, true);
    assert.strictEqual(check.validated.index_record_count_matches_archive, true);
    assert.strictEqual(check.validated.index_archive_digest_matches_archive, true);
    assert.strictEqual(check.validated.raw_gate_artifacts_preserved, true);
    assert.strictEqual(check.validated.raw_file_ids_match_archive, true);
    assert.strictEqual(check.validated.full_test_task_timeout_hardened, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate raw artifact prune planning stays no-delete and requires future apply', () => {
    const plan = readJsonOutput(run(['release', '--closed-gates-prune-plan']));
    assert.strictEqual(plan.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-planning-result-001');
    assert.strictEqual(plan.status, 'ok');
    assert.strictEqual(plan.version, EXPECTED_VERSION);
    assert.strictEqual(plan.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(plan.command, 'agent-onboard release --closed-gates-prune-plan');
    assert.strictEqual(plan.surface_id, 'closed-gate-raw-artifact-prune-planning');
    assert.strictEqual(plan.prerequisite_checks.closed_gate_archive_reader_check, 'ok');
    assert.strictEqual(plan.prerequisite_checks.full_test_runner_completion_check, 'ok');
    assert.strictEqual(plan.current_surface.raw_gate_artifact_count, 0);
    assert.ok(plan.current_surface.index_record_count >= 30);
    assert.strictEqual(plan.current_surface.raw_gate_artifact_parse_error_count, 0);
    assert.strictEqual(plan.current_surface.index_present, true);
    assert.strictEqual(plan.current_surface.index_status, 'present_valid_json');
    assert.strictEqual(plan.current_surface.archive_present, true);
    assert.strictEqual(plan.current_surface.archive_parse_error_count, 0);
    assert.strictEqual(plan.current_surface.index_record_count, plan.current_surface.archive_record_count);
    assert.strictEqual(plan.current_surface.archive_covers_raw_artifacts, true);
    assert.strictEqual(plan.current_surface.archive_file_ids_match_raw, false);
    assert.strictEqual(plan.prune_plan.planning_only, true);
    assert.strictEqual(plan.prune_plan.delete_now, false);
    assert.strictEqual(plan.prune_plan.move_now, false);
    assert.strictEqual(plan.prune_plan.rewrite_now, false);
    assert.strictEqual(plan.prune_plan.future_prune_requires_explicit_apply_gate, true);
    assert.strictEqual(plan.prune_plan.raw_prune_authorized_by_this_gate, false);
    assert.strictEqual(plan.recovery.reader_check_passes, true);
    assert.strictEqual(plan.recovery.full_test_runner_check_passes, true);
    assert.strictEqual(plan.recovery.index_archive_digest_matches_archive, true);
    assert.strictEqual(plan.recovery.raw_file_ids_match_archive, false);
    assert.strictEqual(plan.artifact.present, false);
    assert.strictEqual(plan.boundary.writes_files, false);
    assert.strictEqual(plan.boundary.deletes_raw_gate_artifacts, false);
    assert.strictEqual(plan.boundary.prunes_now, false);

    const check = readJsonOutput(run(['release', '--closed-gates-prune-plan-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-planning-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-prune-plan-check');
    assert.strictEqual(check.validated.archive_reader_check_passes, true);
    assert.strictEqual(check.validated.full_test_runner_check_passes, true);
    assert.strictEqual(check.validated.planning_artifact_present, true);
    assert.strictEqual(check.validated.index_present_valid_json, true);
    assert.strictEqual(check.validated.archive_present_and_parses, true);
    assert.strictEqual(check.validated.index_archive_digest_matches_archive, true);
    assert.strictEqual(check.validated.archive_covers_raw_artifacts, true);
    assert.strictEqual(check.validated.archive_file_ids_match_raw, true);
    assert.strictEqual(check.validated.planning_only_no_prune, true);
    assert.strictEqual(check.validated.future_apply_gate_required, true);
    assert.strictEqual(check.validated.no_delete_move_rewrite_boundary, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate raw artifact prune dry-run computes exact no-delete candidate set', () => {
    const dryRun = readJsonOutput(run(['release', '--closed-gates-prune-dry-run']));
    assert.strictEqual(dryRun.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-result-001');
    assert.strictEqual(dryRun.status, 'ok');
    assert.strictEqual(dryRun.version, EXPECTED_VERSION);
    assert.strictEqual(dryRun.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(dryRun.command, 'agent-onboard release --closed-gates-prune-dry-run');
    assert.strictEqual(dryRun.surface_id, 'closed-gate-raw-artifact-prune-dry-run');
    assert.strictEqual(dryRun.prerequisite_checks.prune_planning_check, 'ok');
    assert.strictEqual(dryRun.prerequisite_checks.closed_gate_archive_reader_check, 'ok');
    assert.strictEqual(dryRun.prerequisite_checks.full_test_runner_completion_check, 'ok');
    assert.strictEqual(dryRun.current_surface.raw_gate_artifact_count, 0);
    assert.ok(dryRun.current_surface.index_record_count >= 30);
    assert.strictEqual(dryRun.current_surface.raw_gate_artifact_parse_error_count, 0);
    assert.strictEqual(dryRun.current_surface.index_present, true);
    assert.strictEqual(dryRun.current_surface.index_status, 'present_valid_json');
    assert.strictEqual(dryRun.current_surface.archive_present, true);
    assert.strictEqual(dryRun.current_surface.archive_parse_error_count, 0);
    assert.strictEqual(dryRun.current_surface.index_record_count, dryRun.current_surface.archive_record_count);
    assert.strictEqual(dryRun.current_surface.archive_covers_raw_artifacts, true);
    assert.strictEqual(dryRun.current_surface.archive_file_ids_match_raw, true);
    assert.strictEqual(dryRun.dry_run_manifest.dry_run_only, true);
    assert.strictEqual(dryRun.dry_run_manifest.delete_now, false);
    assert.strictEqual(dryRun.dry_run_manifest.move_now, false);
    assert.strictEqual(dryRun.dry_run_manifest.rewrite_now, false);
    assert.strictEqual(dryRun.dry_run_manifest.candidate_count, 0);
    assert.strictEqual(dryRun.dry_run_manifest.all_raw_artifacts_eligible, true);
    assert.strictEqual(dryRun.dry_run_manifest.raw_prune_authorized_by_this_gate, false);
    assert.strictEqual(dryRun.recovery.planning_check_passes, true);
    assert.strictEqual(dryRun.recovery.reader_check_passes, true);
    assert.strictEqual(dryRun.recovery.full_test_runner_check_passes, true);
    assert.strictEqual(dryRun.recovery.index_archive_digest_matches_archive, true);
    assert.strictEqual(dryRun.recovery.dry_run_replay_has_exact_delete_set, true);
    assert.strictEqual(dryRun.artifact.present, false);
    assert.strictEqual(dryRun.boundary.dry_run_only, true);
    assert.strictEqual(dryRun.boundary.writes_files, false);
    assert.strictEqual(dryRun.boundary.deletes_raw_gate_artifacts, false);
    assert.strictEqual(dryRun.boundary.prunes_now, false);

    const check = readJsonOutput(run(['release', '--closed-gates-prune-dry-run-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-dry-run-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-prune-dry-run-check');
    assert.strictEqual(check.validated.prune_planning_check_passes, true);
    assert.strictEqual(check.validated.archive_reader_check_passes, true);
    assert.strictEqual(check.validated.full_test_runner_check_passes, true);
    assert.strictEqual(check.validated.dry_run_artifact_present, true);
    assert.strictEqual(check.validated.index_present_valid_json, true);
    assert.strictEqual(check.validated.archive_present_and_parses, true);
    assert.strictEqual(check.validated.index_archive_digest_matches_archive, true);
    assert.strictEqual(check.validated.archive_covers_raw_artifacts, true);
    assert.strictEqual(check.validated.archive_file_ids_match_raw, true);
    assert.strictEqual(check.validated.exact_candidate_set, true);
    assert.strictEqual(check.validated.dry_run_only_no_prune, true);
    assert.strictEqual(check.validated.future_apply_gate_required, true);
    assert.strictEqual(check.validated.no_delete_move_rewrite_boundary, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('public closed gate raw artifact prune apply admission prunes archived raw gate artifacts', () => {
    const apply = readJsonOutput(run(['release', '--closed-gates-prune-apply']));
    assert.strictEqual(apply.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-result-001');
    assert.strictEqual(apply.status, 'ok');
    assert.strictEqual(apply.version, EXPECTED_VERSION);
    assert.strictEqual(apply.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(apply.command, 'agent-onboard release --closed-gates-prune-apply');
    assert.strictEqual(apply.surface_id, 'closed-gate-raw-artifact-prune-apply-admission');
    assert.strictEqual(apply.prerequisite_checks.prune_dry_run_check, 'ok');
    assert.strictEqual(apply.prerequisite_checks.closed_gate_archive_reader_check, 'ok');
    assert.strictEqual(apply.prerequisite_checks.full_test_runner_completion_check, 'ok');
    assert.strictEqual(apply.applied, true);
    assert.strictEqual(apply.raw_gate_artifacts_pruned, true);
    assert.strictEqual(apply.artifact.present, true);
    assert.ok(apply.prune_application.candidate_count >= 30);
    assert.strictEqual(apply.prune_application.pruned_candidate_count, apply.prune_application.candidate_count);
    assert.strictEqual(apply.prune_application.remaining_indexed_raw_artifact_count, 0);
    assert.strictEqual(apply.prune_application.remaining_live_raw_gate_artifact_count, 0);
    assert.strictEqual(apply.prune_application.archive_paths_match_index, true);
    assert.strictEqual(apply.prune_application.archive_file_ids_match_index, true);
    assert.strictEqual(apply.prune_application.index_declares_pruned_state, true);
    assert.strictEqual(apply.recovery.archive_preserved, true);
    assert.strictEqual(apply.recovery.index_preserved, true);
    assert.strictEqual(apply.recovery.raw_gate_artifacts_restorable_from_archive, true);
    assert.strictEqual(apply.boundary.repository_write_admitted_by_gate, true);
    assert.strictEqual(apply.boundary.deletes_raw_gate_artifacts, true);
    assert.strictEqual(apply.boundary.moves_raw_gate_artifacts, false);
    assert.strictEqual(apply.boundary.rewrites_raw_gate_artifacts, false);

    const check = readJsonOutput(run(['release', '--closed-gates-prune-apply-check']));
    assert.strictEqual(check.schema, 'agent-onboard-public-closed-gate-raw-artifact-prune-apply-admission-check-result-001');
    assert.strictEqual(check.status, 'ok');
    assert.strictEqual(check.command, 'agent-onboard release --closed-gates-prune-apply-check');
    assert.strictEqual(check.validated.prune_dry_run_check_passes, true);
    assert.strictEqual(check.validated.archive_reader_check_passes, true);
    assert.strictEqual(check.validated.all_indexed_raw_artifacts_pruned, true);
    assert.strictEqual(check.validated.archive_replays_deleted_paths, true);
    assert.strictEqual(check.validated.archive_replays_deleted_file_ids, true);
    assert.strictEqual(check.validated.index_declares_pruned_state, true);
    assert.strictEqual(check.validated.recovery_path_preserved, true);
    assert.strictEqual(check.validated.deletion_admitted_by_gate, true);
    assert.strictEqual(check.validated.current_work_item_closed, true);
  });


  fullSourceTest('work item ledger compaction checker validates closure archive references', () => {
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'check.js'), 'work-item-ledger-compaction'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 50 * 1024 * 1024
    });
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.schema, 'agent-onboard-work-item-ledger-compaction-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.inline_closure_count, 0);
    assert.ok(output.archived_closure_count >= 1);
    assert.strictEqual(output.boundary.admits_sqlite_now, false);
    assert.strictEqual(output.boundary.admits_lightning_memory_mapped_database_now, false);
  });
};
