
'use strict';

const path = require('path');

const COMMAND_FAMILY = 'work-items';
const CANONICAL_WORK_ITEMS_FILE = '.agent-onboard/work-items.json';
const CANONICAL_WORK_ITEM_CLOSURES_FILE = '.agent-onboard/state/closures/work-items-closures.jsonl';

const STATUS = Object.freeze({
  OK: 'ok',
  ERROR: 'error'
});

const MODE = Object.freeze({
  DRY_RUN: 'dry-run',
  WRITE: 'write'
});

const FLAG = Object.freeze({
  DRY_RUN: '--dry-run',
  WRITE: '--write',
  FORCE: '--force',
  FILE: '--file',
  ID: '--id',
  TITLE: '--title',
  PROGRAM_TITLE: '--program-title',
  STAGE_TITLE: '--stage-title',
  MILESTONE_TITLE: '--milestone-title',
  ACTOR: '--actor',
  CLAIMED_AT: '--claimed-at',
  CLOSED_AT: '--closed-at',
  NOTE: '--note',
  CHANGED_FILE: '--changed-file',
  CHECK: '--check',
  SUMMARY: '--summary',
  CHECK_NOT_RUN: '--check-not-run',
  KNOWN_NON_PASS: '--known-non-pass'
});

const WORK_ITEMS_COMMAND = Object.freeze({
  INIT: 'work-items --init',
  APPEND: 'work-items --append',
  CLAIM: 'work-items --claim',
  CLOSE: 'work-items --close'
});

const WORK_ITEMS_RESULT_SCHEMA = Object.freeze({
  APPEND: 'agent-onboard-work-items-append-result-001',
  INIT: 'agent-onboard-work-items-init-result-001',
  CLAIM: 'agent-onboard-work-items-claim-result-001',
  CLOSE: 'agent-onboard-work-items-close-result-001'
});

const WORK_ITEMS_REASON = Object.freeze({
  MISSING_LEDGER: 'missing .agent-onboard/work-items.json in current target repo root',
  INVALID_LEDGER: 'current work-item ledger is invalid'
});

function defaultDependency(name) {
  throw new Error(`work-items mutation service requires ${name}`);
}

function createWorkItemsMutationService(options = Object.freeze({})) {
  const cwd = typeof options.cwd === 'function' ? options.cwd : () => process.cwd();
  const emit = typeof options.emit === 'function' ? options.emit : () => defaultDependency('emit');
  const readJson = typeof options.readJson === 'function' ? options.readJson : () => defaultDependency('readJson');
  const validateWorkItems = typeof options.validateWorkItems === 'function' ? options.validateWorkItems : () => [];
  const workItemCounts = typeof options.workItemCounts === 'function' ? options.workItemCounts : () => ({});
  const appendWorkItemDryRun = typeof options.appendWorkItemDryRun === 'function' ? options.appendWorkItemDryRun : () => defaultDependency('appendWorkItemDryRun');
  const claimWorkItemDryRun = typeof options.claimWorkItemDryRun === 'function' ? options.claimWorkItemDryRun : () => defaultDependency('claimWorkItemDryRun');
  const closeWorkItemDryRun = typeof options.closeWorkItemDryRun === 'function' ? options.closeWorkItemDryRun : () => defaultDependency('closeWorkItemDryRun');
  const workItemsTemplate = typeof options.workItemsTemplate === 'function' ? options.workItemsTemplate : () => defaultDependency('workItemsTemplate');
  const planWrites = typeof options.planWrites === 'function' ? options.planWrites : () => [];
  const performPlannedWrites = typeof options.performPlannedWrites === 'function' ? options.performPlannedWrites : () => {};
  const summarizePlan = typeof options.summarizePlan === 'function' ? options.summarizePlan : (plannedWrites) => plannedWrites;
  const writeJson = typeof options.writeJson === 'function' ? options.writeJson : () => defaultDependency('writeJson');
  const exists = typeof options.exists === 'function' ? options.exists : () => false;
  const refreshGovernanceIndexesAfterWrite = typeof options.refreshGovernanceIndexesAfterWrite === 'function' ? options.refreshGovernanceIndexesAfterWrite : () => null;
  const optionAfterFlag = typeof options.optionAfterFlag === 'function' ? options.optionAfterFlag : () => undefined;
  const repeatedOptionsAfterFlag = typeof options.repeatedOptionsAfterFlag === 'function' ? options.repeatedOptionsAfterFlag : () => [];
  const resultStatus = typeof options.resultStatus === 'function' ? options.resultStatus : (ok) => ok ? STATUS.OK : STATUS.ERROR;
  const modeFromWrite = typeof options.modeFromWrite === 'function' ? options.modeFromWrite : (write) => write ? MODE.WRITE : MODE.DRY_RUN;
  const commandWithMode = typeof options.commandWithMode === 'function' ? options.commandWithMode : (command, mode) => `agent-onboard ${command} --${mode}`;
  const workItemsFileFromArgs = typeof options.workItemsFileFromArgs === 'function' ? options.workItemsFileFromArgs : () => CANONICAL_WORK_ITEMS_FILE;
  const appendJsonlRecord = typeof options.appendJsonlRecord === 'function' ? options.appendJsonlRecord : () => defaultDependency('appendJsonlRecord');

  function append(args) {
    const dry = args.includes(FLAG.DRY_RUN);
    const write = args.includes(FLAG.WRITE);
    if (!write && !dry) throw new Error(`${WORK_ITEMS_COMMAND.APPEND} requires ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);
    if (write && dry) throw new Error(`${WORK_ITEMS_COMMAND.APPEND} accepts only one of ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);

    const mode = modeFromWrite(write);
    const command = commandWithMode(WORK_ITEMS_COMMAND.APPEND, mode);
    const file = workItemsFileFromArgs(args);
    const absolutePath = path.resolve(cwd(), file);
    if (!exists(absolutePath)) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.APPEND,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.MISSING_LEDGER,
        writes_performed: false
      });
      return 1;
    }

    const current = readJson(absolutePath);
    const currentErrors = validateWorkItems(current);
    if (currentErrors.length > 0) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.APPEND,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.INVALID_LEDGER,
        writes_performed: false,
        errors: currentErrors
      });
      return 1;
    }

    let proposal;
    try {
      proposal = appendWorkItemDryRun(current, {
        id: optionAfterFlag(args, FLAG.ID),
        title: optionAfterFlag(args, FLAG.TITLE),
        program_title: optionAfterFlag(args, FLAG.PROGRAM_TITLE),
        stage_title: optionAfterFlag(args, FLAG.STAGE_TITLE),
        milestone_title: optionAfterFlag(args, FLAG.MILESTONE_TITLE)
      });
    } catch (error) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.APPEND,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: error.message || String(error),
        writes_performed: false
      });
      return 1;
    }

    const proposalErrors = validateWorkItems(proposal.proposed_ledger);
    const ok = proposalErrors.length === 0;
    if (write && ok) writeJson(absolutePath, proposal.proposed_ledger);
    const governanceIndexRefresh = refreshGovernanceIndexesAfterWrite({ write, ok, file, command });
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.APPEND,
      status: resultStatus(ok),
      command_family: COMMAND_FAMILY,
      command,
      file,
      mode,
      writes_performed: write && ok,
      counts_before: workItemCounts(current),
      counts_after: workItemCounts(proposal.proposed_ledger),
      added: proposal.added,
      proposed_ledger: proposal.proposed_ledger,
      governance_index_refresh: governanceIndexRefresh,
      errors: proposalErrors,
      boundary: {
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        modifies_source_files: false,
        modifies_work_items_file: write,
        modifies_only_canonical_work_items_file: write && !governanceIndexRefresh,
        refreshes_governance_indexes: Boolean(governanceIndexRefresh),
        governance_index_refresh_after_admitted_write: Boolean(governanceIndexRefresh),
        governance_index_refresh_writes_performed: Boolean(governanceIndexRefresh && governanceIndexRefresh.writes_performed)
      }
    });
    return ok ? 0 : 1;
  }

  function init(args) {
    const write = args.includes(FLAG.WRITE);
    const dry = args.includes(FLAG.DRY_RUN);
    const force = args.includes(FLAG.FORCE);
    if (!write && !dry) throw new Error(`${WORK_ITEMS_COMMAND.INIT} requires ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);
    if (write && dry) throw new Error(`${WORK_ITEMS_COMMAND.INIT} accepts only one of ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);

    const templateValue = workItemsTemplate();
    const plannedWrites = planWrites([[CANONICAL_WORK_ITEMS_FILE, templateValue]], { force });
    const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
    const errors = validateWorkItems(templateValue);
    const ok = conflicts.length === 0 && errors.length === 0;

    if (write && ok) performPlannedWrites(plannedWrites);
    const governanceIndexRefresh = refreshGovernanceIndexesAfterWrite({ write, ok, file: CANONICAL_WORK_ITEMS_FILE, command: commandWithMode(WORK_ITEMS_COMMAND.INIT, modeFromWrite(write)) });

    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.INIT,
      status: resultStatus(ok),
      command_family: COMMAND_FAMILY,
      command: commandWithMode(WORK_ITEMS_COMMAND.INIT, modeFromWrite(write)),
      canonical_file: CANONICAL_WORK_ITEMS_FILE,
      mode: modeFromWrite(write),
      force,
      writes_performed: write && ok,
      planned_writes: summarizePlan(plannedWrites),
      conflicts: conflicts.map((item) => item.path),
      validated_template: errors.length === 0,
      counts: workItemCounts(templateValue),
      governance_index_refresh: governanceIndexRefresh,
      errors,
      boundary: {
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        modifies_source_files: false,
        modifies_work_items_file: write,
        modifies_only_canonical_work_items_file: write && !governanceIndexRefresh,
        refreshes_governance_indexes: Boolean(governanceIndexRefresh),
        governance_index_refresh_after_admitted_write: Boolean(governanceIndexRefresh),
        governance_index_refresh_writes_performed: Boolean(governanceIndexRefresh && governanceIndexRefresh.writes_performed)
      }
    });
    return ok ? 0 : 1;
  }

  function claim(args) {
    const dry = args.includes(FLAG.DRY_RUN);
    const write = args.includes(FLAG.WRITE);
    if (!write && !dry) throw new Error(`${WORK_ITEMS_COMMAND.CLAIM} requires ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);
    if (write && dry) throw new Error(`${WORK_ITEMS_COMMAND.CLAIM} accepts only one of ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);

    const mode = modeFromWrite(write);
    const command = commandWithMode(WORK_ITEMS_COMMAND.CLAIM, mode);
    const file = workItemsFileFromArgs(args);
    const absolutePath = path.resolve(cwd(), file);
    if (!exists(absolutePath)) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.MISSING_LEDGER,
        writes_performed: false
      });
      return 1;
    }

    const current = readJson(absolutePath);
    const currentErrors = validateWorkItems(current);
    if (currentErrors.length > 0) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.INVALID_LEDGER,
        writes_performed: false,
        errors: currentErrors
      });
      return 1;
    }

    let proposal;
    try {
      proposal = claimWorkItemDryRun(current, {
        id: optionAfterFlag(args, FLAG.ID),
        actor: optionAfterFlag(args, FLAG.ACTOR),
        claimed_at: optionAfterFlag(args, FLAG.CLAIMED_AT),
        note: optionAfterFlag(args, FLAG.NOTE)
      });
    } catch (error) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: error.message || String(error),
        writes_performed: false
      });
      return 1;
    }

    const proposalErrors = validateWorkItems(proposal.proposed_ledger);
    const ok = proposalErrors.length === 0;
    if (write && ok) writeJson(absolutePath, proposal.proposed_ledger);
    const governanceIndexRefresh = refreshGovernanceIndexesAfterWrite({ write, ok, file, command });
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM,
      status: resultStatus(ok),
      command_family: COMMAND_FAMILY,
      command,
      file,
      mode,
      writes_performed: write && ok,
      counts_before: workItemCounts(current),
      counts_after: workItemCounts(proposal.proposed_ledger),
      claimed: proposal.claimed,
      next_steps: proposal.next_steps,
      proposed_ledger: proposal.proposed_ledger,
      governance_index_refresh: governanceIndexRefresh,
      errors: proposalErrors,
      boundary: {
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        modifies_source_files: false,
        modifies_work_items_file: write,
        modifies_only_canonical_work_items_file: write && !governanceIndexRefresh,
        refreshes_governance_indexes: Boolean(governanceIndexRefresh),
        governance_index_refresh_after_admitted_write: Boolean(governanceIndexRefresh),
        governance_index_refresh_writes_performed: Boolean(governanceIndexRefresh && governanceIndexRefresh.writes_performed)
      }
    });
    return ok ? 0 : 1;
  }

  function close(args) {
    const dry = args.includes(FLAG.DRY_RUN);
    const write = args.includes(FLAG.WRITE);
    if (!write && !dry) throw new Error(`${WORK_ITEMS_COMMAND.CLOSE} requires ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);
    if (write && dry) throw new Error(`${WORK_ITEMS_COMMAND.CLOSE} accepts only one of ${FLAG.DRY_RUN} or ${FLAG.WRITE}`);

    const mode = modeFromWrite(write);
    const command = commandWithMode(WORK_ITEMS_COMMAND.CLOSE, mode);
    const file = workItemsFileFromArgs(args);
    const absolutePath = path.resolve(cwd(), file);
    if (!exists(absolutePath)) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLOSE,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.MISSING_LEDGER,
        writes_performed: false
      });
      return 1;
    }

    const current = readJson(absolutePath);
    const currentErrors = validateWorkItems(current);
    if (currentErrors.length > 0) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLOSE,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: WORK_ITEMS_REASON.INVALID_LEDGER,
        writes_performed: false,
        errors: currentErrors
      });
      return 1;
    }

    let proposal;
    try {
      proposal = closeWorkItemDryRun(current, {
        id: optionAfterFlag(args, FLAG.ID),
        actor: optionAfterFlag(args, FLAG.ACTOR),
        closed_at: optionAfterFlag(args, FLAG.CLOSED_AT),
        summary: optionAfterFlag(args, FLAG.SUMMARY),
        changed_files: repeatedOptionsAfterFlag(args, FLAG.CHANGED_FILE),
        checks_run: repeatedOptionsAfterFlag(args, FLAG.CHECK),
        checks_not_run: repeatedOptionsAfterFlag(args, FLAG.CHECK_NOT_RUN),
        known_non_pass: repeatedOptionsAfterFlag(args, FLAG.KNOWN_NON_PASS)
      });
    } catch (error) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.CLOSE,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command,
        file,
        mode,
        reason: error.message || String(error),
        writes_performed: false
      });
      return 1;
    }

    const proposalErrors = validateWorkItems(proposal.proposed_ledger);
    const ok = proposalErrors.length === 0;
    let closureArchiveWrite = null;
    if (write && ok) {
      writeJson(absolutePath, proposal.proposed_ledger);
      if (proposal.closure_record && file === CANONICAL_WORK_ITEMS_FILE) {
        const archivePath = path.resolve(cwd(), CANONICAL_WORK_ITEM_CLOSURES_FILE);
        appendJsonlRecord(archivePath, proposal.closure_record);
        closureArchiveWrite = {
          schema: 'agent-onboard-work-items-closure-archive-write-001',
          status: STATUS.OK,
          path: CANONICAL_WORK_ITEM_CLOSURES_FILE,
          closure_ref: proposal.closure_record.closure_id,
          writes_performed: true
        };
      }
    }
    const governanceIndexRefresh = refreshGovernanceIndexesAfterWrite({ write, ok, file, command });
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.CLOSE,
      status: resultStatus(ok),
      command_family: COMMAND_FAMILY,
      command,
      file,
      mode,
      writes_performed: write && ok,
      counts_before: workItemCounts(current),
      counts_after: workItemCounts(proposal.proposed_ledger),
      closed: proposal.closed,
      handoff_evidence: proposal.handoff_evidence,
      closure_archive_write: closureArchiveWrite,
      proposed_ledger: proposal.proposed_ledger,
      governance_index_refresh: governanceIndexRefresh,
      errors: proposalErrors,
      boundary: {
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        modifies_source_files: false,
        modifies_work_items_file: write,
        appends_work_item_closure_archive: Boolean(closureArchiveWrite),
        modifies_only_canonical_work_items_file: write && !governanceIndexRefresh && !closureArchiveWrite,
        refreshes_governance_indexes: Boolean(governanceIndexRefresh),
        governance_index_refresh_after_admitted_write: Boolean(governanceIndexRefresh),
        governance_index_refresh_writes_performed: Boolean(governanceIndexRefresh && governanceIndexRefresh.writes_performed)
      }
    });
    return ok ? 0 : 1;
  }


  return Object.freeze({
    init,
    append,
    claim,
    close
  });
}

module.exports = Object.freeze({
  createWorkItemsMutationService
});
