'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COMMAND_FAMILY = 'work-items';
const CANONICAL_WORK_ITEMS_FILE = '.agent-onboard/work-items.json';
const CANONICAL_CLAIMS_FILE = '.agent-onboard/claims.jsonl';

const STATUS = Object.freeze({
  OK: 'ok',
  ERROR: 'error'
});

const WORK_ITEM_STATUS = Object.freeze({
  OPEN: 'open',
  CLAIMED: 'claimed',
  CLOSED: 'closed'
});

const MODE = Object.freeze({
  DRY_RUN: 'dry-run',
  WRITE: 'write'
});

const FLAG = Object.freeze({
  INIT: '--init',
  APPEND: '--append',
  CLAIM: '--claim',
  CLOSE: '--close',
  SCHEMA: '--schema',
  TEMPLATE: '--template',
  VALIDATE_TEMPLATE: '--validate-template',
  LIST: '--list',
  SUMMARY: '--summary',
  NEXT: '--next',
  MINE: '--mine',
  VALIDATE: '--validate',
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

const OUTPUT_FLAG = Object.freeze({
  JSON: '--json',
  TEXT: '--text'
});

const WORK_ITEMS_COMMAND = Object.freeze({
  SCHEMA: 'work-items --schema',
  TEMPLATE: 'work-items --template',
  VALIDATE_TEMPLATE: 'work-items --validate-template',
  LIST: 'work-items --list',
  SUMMARY: 'work-items --summary',
  NEXT: 'work-items --next',
  MINE: 'work-items --mine',
  VALIDATE: 'work-items --validate',
  INIT: 'work-items --init',
  APPEND: 'work-items --append',
  CLAIM: 'work-items --claim',
  CLOSE: 'work-items --close'
});

const WORK_ITEMS_RESULT_SCHEMA = Object.freeze({
  APPEND: 'agent-onboard-work-items-append-result-001',
  INIT: 'agent-onboard-work-items-init-result-001',
  CLAIM: 'agent-onboard-work-items-claim-result-001',
  CLOSE: 'agent-onboard-work-items-close-result-001',
  SCHEMA: 'agent-onboard-work-items-schema-response-001',
  TEMPLATE: 'agent-onboard-work-items-template-response-001',
  TEMPLATE_VALIDATION: 'agent-onboard-work-items-template-validation-001',
  FILE_VALIDATION: 'agent-onboard-work-items-file-validation-001',
  LIST: 'agent-onboard-work-items-list-response-001',
  SUMMARY: 'agent-onboard-work-items-summary-response-001',
  NEXT: 'agent-onboard-work-items-next-response-001',
  MINE: 'agent-onboard-work-items-mine-response-001',
  CLAIM_LEDGER_VALIDATION: 'agent-onboard-public-claim-ledger-validation-001',
  CLAIM_LEDGER_APPEND: 'agent-onboard-public-claim-ledger-append-result-001',
  CLAIM_LEDGER_LIFECYCLE: 'agent-onboard-public-claim-ledger-lifecycle-result-001'
});

const CLAIM_EVENT_TYPE = Object.freeze(['claim_proposed', 'claim_merged']);
const CLAIM_LIFECYCLE_TERMINAL_EVENTS = Object.freeze(['claim_merged']);

const WORK_ITEMS_REASON = Object.freeze({
  MISSING_LEDGER: 'missing .agent-onboard/work-items.json in current target repo root',
  MISSING_CLAIMS_LEDGER: 'missing .agent-onboard/claims.jsonl in current target repo root',
  INVALID_LEDGER: 'current work-item ledger is invalid'
});

const WORK_ITEMS_SERVICE_SEED = Object.freeze({
  schema: 'agent-onboard-public-work-items-runtime-service-seed-001',
  package_name: 'agent-onboard',
  role: 'packaged_runtime_work_items_domain_service_seed',
  service_path: 'cli/agent_onboard/domains/work-items/services/work-items-service.js',
  owned_read_only_commands: Object.freeze([
    WORK_ITEMS_COMMAND.SCHEMA,
    WORK_ITEMS_COMMAND.TEMPLATE,
    WORK_ITEMS_COMMAND.VALIDATE_TEMPLATE,
    WORK_ITEMS_COMMAND.LIST,
    WORK_ITEMS_COMMAND.SUMMARY,
    WORK_ITEMS_COMMAND.NEXT,
    WORK_ITEMS_COMMAND.MINE,
    WORK_ITEMS_COMMAND.VALIDATE
  ]),
  owned_write_boundary_commands: Object.freeze([
    WORK_ITEMS_COMMAND.INIT,
    WORK_ITEMS_COMMAND.APPEND,
    WORK_ITEMS_COMMAND.CLAIM,
    WORK_ITEMS_COMMAND.CLOSE
  ]),
  fallback_commands: Object.freeze([]),
  boundary: Object.freeze({
    packaged_in_npm_tarball_in_this_gate: true,
    no_side_effect_on_require: true,
    no_file_writes_on_require: true,
    no_network: true,
    no_process_exit: true,
    no_dynamic_eval: true,
    no_child_process: true,
    init_append_commands_write_only_under_explicit_write: true,
    claim_close_commands_write_only_under_explicit_write: true,
    canonical_work_items_writes_refresh_governance_indexes: true,
    governance_index_refresh_writes_only_allowlisted_cache_files: true,
    no_legacy_work_items_fallback_commands: true
  })
});

function describeWorkItemsServiceSeed() {
  return WORK_ITEMS_SERVICE_SEED;
}

function defaultJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function defaultReadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function defaultCounts(value) {
  return {
    programs: Array.isArray(value.programs) ? value.programs.length : 0,
    stages: Array.isArray(value.stages) ? value.stages.length : 0,
    milestones: Array.isArray(value.milestones) ? value.milestones.length : 0,
    work_items: Array.isArray(value.work_items) ? value.work_items.length : 0
  };
}

function defaultWorkItemsSchema() {
  return Object.freeze({});
}

function defaultWorkItemsTemplate() {
  return Object.freeze({});
}

function defaultAppendWorkItemDryRun() {
  throw new Error(`${WORK_ITEMS_COMMAND.APPEND} requires an append planner`);
}

function defaultClaimWorkItemDryRun() {
  throw new Error(`${WORK_ITEMS_COMMAND.CLAIM} requires a claim planner`);
}

function defaultCloseWorkItemDryRun() {
  throw new Error(`${WORK_ITEMS_COMMAND.CLOSE} requires a close planner`);
}

function defaultRefreshGovernanceIndexesAfterWorkItemsWrite() {
  return null;
}

function fileAfterFlag(args, flag, fallback) {
  const index = args.indexOf(flag);
  const value = args[index + 1];
  return value && !value.startsWith('-') ? value : fallback;
}

function optionAfterFlag(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('-')) throw new Error(`${flag} requires a value`);
  return value;
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function repeatedOptionsAfterFlag(args, flag) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flag) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('-')) throw new Error(`${flag} requires a value`);
    values.push(value);
    index += 1;
  }
  return values;
}

function resultStatus(ok) {
  return ok ? STATUS.OK : STATUS.ERROR;
}

function modeFromWrite(write) {
  return write ? MODE.WRITE : MODE.DRY_RUN;
}

function commandWithMode(command, mode) {
  return `agent-onboard ${command} --${mode}`;
}

function workItemsFileFromArgs(args) {
  return optionAfterFlag(args, FLAG.FILE) || CANONICAL_WORK_ITEMS_FILE;
}

function countByStatus(workItems) {
  return Object.freeze({
    open: workItems.filter((item) => item.status === WORK_ITEM_STATUS.OPEN).length,
    claimed: workItems.filter((item) => item.status === WORK_ITEM_STATUS.CLAIMED).length,
    closed: workItems.filter((item) => item.status === WORK_ITEM_STATUS.CLOSED).length
  });
}

function indexById(items) {
  const map = new Map();
  for (const item of Array.isArray(items) ? items : []) map.set(item.id, item);
  return map;
}

function decorateWorkItem(item, indexes) {
  const milestone = indexes.milestones.get(item.milestone_id) || null;
  const stage = milestone ? indexes.stages.get(milestone.stage_id) || null : null;
  const program = stage ? indexes.programs.get(stage.program_id) || null : null;
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    milestone: milestone ? { id: milestone.id, title: milestone.title, status: milestone.status } : null,
    stage: stage ? { id: stage.id, title: stage.title, status: stage.status } : null,
    program: program ? { id: program.id, title: program.title, status: program.status } : null,
    claim: item.claim || null,
    closure: item.closure || null
  };
}

function ledgerIndexes(value) {
  return Object.freeze({
    programs: indexById(value.programs),
    stages: indexById(value.stages),
    milestones: indexById(value.milestones)
  });
}

function formatWorkItemTitle(item) {
  return item ? `${item.id} [${item.status}] ${item.title}` : 'none';
}

function formatScope(item) {
  if (!item) return 'none';
  return [item.program, item.stage, item.milestone]
    .filter(Boolean)
    .map((entry) => `${entry.id} ${entry.title}`)
    .join(' > ') || 'none';
}

function formatWorkItemList(items, limit = 10) {
  if (!Array.isArray(items) || items.length === 0) return ['  none'];
  const visible = items.slice(0, limit).map((item) => `  - ${formatWorkItemTitle(item)}`);
  if (items.length > limit) visible.push(`  ... ${items.length - limit} more`);
  return visible;
}

function formatWorkItemsText(payload) {
  if (!payload || payload.status !== STATUS.OK) {
    return [
      'agent-onboard work-items',
      `Status: ${payload && payload.status ? payload.status : STATUS.ERROR}`,
      `Reason: ${payload && payload.reason ? payload.reason : 'unknown error'}`
    ].join('\n');
  }
  if (payload.schema === WORK_ITEMS_RESULT_SCHEMA.SUMMARY) {
    const counts = payload.work_item_status_counts;
    return [
      'agent-onboard work-items summary',
      `File: ${payload.file}`,
      `Items: ${payload.counts.work_items} total, ${counts.open} open, ${counts.claimed} claimed, ${counts.closed} closed`,
      `Next: ${formatWorkItemTitle(payload.next_open_work_item)}`,
      'Open:',
      ...formatWorkItemList(payload.open_work_items),
      'Claimed:',
      ...formatWorkItemList(payload.claimed_work_items)
    ].join('\n');
  }
  if (payload.schema === WORK_ITEMS_RESULT_SCHEMA.NEXT) {
    return [
      'agent-onboard next work item',
      `File: ${payload.file}`,
      `Found: ${payload.selection.found ? 'yes' : 'no'}`,
      `Next: ${formatWorkItemTitle(payload.next_work_item)}`,
      `Scope: ${formatScope(payload.next_work_item)}`,
      `Claim dry-run: ${payload.claim_command || 'none'}`
    ].join('\n');
  }
  if (payload.schema === WORK_ITEMS_RESULT_SCHEMA.MINE) {
    return [
      `agent-onboard work items for ${payload.actor}`,
      `File: ${payload.file}`,
      `Claimed: ${payload.counts.claimed}`,
      ...formatWorkItemList(payload.claimed_work_items),
      `Closed: ${payload.counts.closed}`,
      ...formatWorkItemList(payload.closed_work_items),
      'Next steps:',
      ...(payload.next_steps || []).map((step) => `  - ${step}`)
    ].join('\n');
  }
  return JSON.stringify(payload, null, 2);
}

function createWorkItemsService(options = Object.freeze({})) {
  const cwd = typeof options.cwd === 'function' ? options.cwd : () => process.cwd();
  const emit = typeof options.emit === 'function' ? options.emit : defaultJson;
  const emitText = typeof options.emitText === 'function' ? options.emitText : (text) => process.stdout.write(`${text}\n`);
  const readJson = typeof options.readJson === 'function' ? options.readJson : defaultReadJson;
  const validateWorkItems = typeof options.validateWorkItems === 'function' ? options.validateWorkItems : () => [];
  const workItemCounts = typeof options.workItemCounts === 'function' ? options.workItemCounts : defaultCounts;
  const workItemsSchema = typeof options.workItemsSchema === 'function' ? options.workItemsSchema : defaultWorkItemsSchema;
  const workItemsTemplate = typeof options.workItemsTemplate === 'function' ? options.workItemsTemplate : defaultWorkItemsTemplate;
  const appendWorkItemDryRun = typeof options.appendWorkItemDryRun === 'function' ? options.appendWorkItemDryRun : defaultAppendWorkItemDryRun;
  const claimWorkItemDryRun = typeof options.claimWorkItemDryRun === 'function' ? options.claimWorkItemDryRun : defaultClaimWorkItemDryRun;
  const closeWorkItemDryRun = typeof options.closeWorkItemDryRun === 'function' ? options.closeWorkItemDryRun : defaultCloseWorkItemDryRun;
  const refreshGovernanceIndexesAfterWorkItemsWrite = typeof options.refreshGovernanceIndexesAfterWorkItemsWrite === 'function' ? options.refreshGovernanceIndexesAfterWorkItemsWrite : defaultRefreshGovernanceIndexesAfterWorkItemsWrite;
  const planWrites = typeof options.planWrites === 'function' ? options.planWrites : () => [];
  const performPlannedWrites = typeof options.performPlannedWrites === 'function' ? options.performPlannedWrites : () => {};
  const summarizePlan = typeof options.summarizePlan === 'function' ? options.summarizePlan : (plannedWrites) => plannedWrites;
  const writeJson = typeof options.writeJson === 'function' ? options.writeJson : (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  };
  const exists = typeof options.exists === 'function' ? options.exists : fs.existsSync;

  function emitView(args, payload) {
    if (args.includes(OUTPUT_FLAG.TEXT)) emitText(formatWorkItemsText(payload));
    else emit(payload);
  }

  function refreshGovernanceIndexesAfterWrite({ write, ok, file, command }) {
    if (!write || !ok) return null;
    if (file !== CANONICAL_WORK_ITEMS_FILE) {
      return {
        schema: 'agent-onboard-work-items-governance-index-refresh-skipped-001',
        status: 'skipped',
        reason: `governance index refresh is bound to ${CANONICAL_WORK_ITEMS_FILE}`,
        trigger: {
          command,
          file,
          canonical_work_items_file: false,
          admitted_write_completed: true
        },
        writes_performed: false
      };
    }
    try {
      return refreshGovernanceIndexesAfterWorkItemsWrite({
        target_root: cwd(),
        trigger: {
          command,
          file,
          canonical_work_items_file: true,
          admitted_write_completed: true
        }
      });
    } catch (error) {
      return {
        schema: 'agent-onboard-work-items-governance-index-refresh-error-001',
        status: 'error',
        reason: error && error.message ? error.message : String(error),
        trigger: {
          command,
          file,
          canonical_work_items_file: true,
          admitted_write_completed: true
        },
        writes_performed: false,
        errors: [error && error.message ? error.message : String(error)]
      };
    }
  }

  function readLedgerForView(args, flag, resultSchema) {
    const file = fileAfterFlag(args, flag, CANONICAL_WORK_ITEMS_FILE);
    const absolutePath = path.resolve(cwd(), file);
    if (!exists(absolutePath)) {
      emitView(args, {
        schema: resultSchema,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        file,
        reason: WORK_ITEMS_REASON.MISSING_LEDGER,
        writes_performed: false
      });
      return null;
    }
    const value = readJson(absolutePath);
    const errors = validateWorkItems(value);
    if (errors.length > 0) {
      emitView(args, {
        schema: resultSchema,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        file,
        reason: WORK_ITEMS_REASON.INVALID_LEDGER,
        validated: false,
        errors,
        writes_performed: false
      });
      return null;
    }
    return { file, value, indexes: ledgerIndexes(value) };
  }

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
    if (write && ok) writeJson(absolutePath, proposal.proposed_ledger);
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

  function schema() {
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.SCHEMA,
      status: STATUS.OK,
      work_items_schema: workItemsSchema()
    });
    return 0;
  }

  function template() {
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.TEMPLATE,
      status: STATUS.OK,
      canonical_file: CANONICAL_WORK_ITEMS_FILE,
      work_items: workItemsTemplate()
    });
    return 0;
  }

  function validateTemplate() {
    const errors = validateWorkItems(workItemsTemplate());
    const ok = errors.length === 0;
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.TEMPLATE_VALIDATION,
      status: resultStatus(ok),
      template_source: 'embedded',
      canonical_file: CANONICAL_WORK_ITEMS_FILE,
      validated: true,
      errors
    });
    return ok ? 0 : 1;
  }

  function validate(args) {
    const file = fileAfterFlag(args, FLAG.VALIDATE, CANONICAL_WORK_ITEMS_FILE);
    const value = readJson(path.resolve(cwd(), file));
    const errors = validateWorkItems(value);
    const ok = errors.length === 0;
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.FILE_VALIDATION,
      status: resultStatus(ok),
      file,
      validated: true,
      counts: workItemCounts(value),
      errors
    });
    return ok ? 0 : 1;
  }

  function list(args) {
    const file = fileAfterFlag(args, FLAG.LIST, CANONICAL_WORK_ITEMS_FILE);
    const absolutePath = path.resolve(cwd(), file);
    if (!exists(absolutePath)) {
      emit({
        schema: WORK_ITEMS_RESULT_SCHEMA.LIST,
        status: STATUS.ERROR,
        file,
        reason: WORK_ITEMS_REASON.MISSING_LEDGER,
        writes_performed: false
      });
      return 1;
    }
    const value = readJson(absolutePath);
    const errors = validateWorkItems(value);
    const ok = errors.length === 0;
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.LIST,
      status: resultStatus(ok),
      file,
      validated: true,
      counts: workItemCounts(value),
      programs: Array.isArray(value.programs) ? value.programs : [],
      stages: Array.isArray(value.stages) ? value.stages : [],
      milestones: Array.isArray(value.milestones) ? value.milestones : [],
      work_items: Array.isArray(value.work_items) ? value.work_items : [],
      errors,
      writes_performed: false
    });
    return ok ? 0 : 1;
  }

  function summary(args) {
    const ledger = readLedgerForView(args, FLAG.SUMMARY, WORK_ITEMS_RESULT_SCHEMA.SUMMARY);
    if (!ledger) return 1;
    const workItems = Array.isArray(ledger.value.work_items) ? ledger.value.work_items : [];
    const openItems = workItems.filter((item) => item.status === WORK_ITEM_STATUS.OPEN);
    const claimedItems = workItems.filter((item) => item.status === WORK_ITEM_STATUS.CLAIMED);
    emitView(args, {
      schema: WORK_ITEMS_RESULT_SCHEMA.SUMMARY,
      status: STATUS.OK,
      command_family: COMMAND_FAMILY,
      command: `agent-onboard ${WORK_ITEMS_COMMAND.SUMMARY}`,
      file: ledger.file,
      validated: true,
      counts: workItemCounts(ledger.value),
      work_item_status_counts: countByStatus(workItems),
      open_work_items: openItems.map((item) => decorateWorkItem(item, ledger.indexes)),
      claimed_work_items: claimedItems.map((item) => decorateWorkItem(item, ledger.indexes)),
      next_open_work_item: openItems.length > 0 ? decorateWorkItem(openItems[0], ledger.indexes) : null,
      writes_performed: false,
      boundary: {
        reads_work_items_file: true,
        modifies_work_items_file: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false
      },
      errors: []
    });
    return 0;
  }

  function next(args) {
    const ledger = readLedgerForView(args, FLAG.NEXT, WORK_ITEMS_RESULT_SCHEMA.NEXT);
    if (!ledger) return 1;
    const workItems = Array.isArray(ledger.value.work_items) ? ledger.value.work_items : [];
    const nextItem = workItems.find((item) => item.status === WORK_ITEM_STATUS.OPEN) || null;
    const decorated = nextItem ? decorateWorkItem(nextItem, ledger.indexes) : null;
    emitView(args, {
      schema: WORK_ITEMS_RESULT_SCHEMA.NEXT,
      status: STATUS.OK,
      command_family: COMMAND_FAMILY,
      command: `agent-onboard ${WORK_ITEMS_COMMAND.NEXT}`,
      file: ledger.file,
      validated: true,
      selection: {
        strategy: 'first_open_work_item_by_ledger_order',
        found: decorated !== null
      },
      next_work_item: decorated,
      claim_command: decorated ? `agent-onboard work-items --claim --dry-run --id ${decorated.id} --actor <actor>` : null,
      counts: workItemCounts(ledger.value),
      work_item_status_counts: countByStatus(workItems),
      writes_performed: false,
      boundary: {
        reads_work_items_file: true,
        modifies_work_items_file: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false
      },
      errors: []
    });
    return 0;
  }

  function mine(args) {
    let actor;
    try {
      actor = optionAfterFlag(args, FLAG.ACTOR);
    } catch (error) {
      emitView(args, {
        schema: WORK_ITEMS_RESULT_SCHEMA.MINE,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command: `agent-onboard ${WORK_ITEMS_COMMAND.MINE}`,
        file: fileAfterFlag(args, FLAG.MINE, CANONICAL_WORK_ITEMS_FILE),
        reason: error.message || String(error),
        writes_performed: false
      });
      return 1;
    }
    if (!actor) {
      emitView(args, {
        schema: WORK_ITEMS_RESULT_SCHEMA.MINE,
        status: STATUS.ERROR,
        command_family: COMMAND_FAMILY,
        command: `agent-onboard ${WORK_ITEMS_COMMAND.MINE}`,
        file: fileAfterFlag(args, FLAG.MINE, CANONICAL_WORK_ITEMS_FILE),
        reason: `${WORK_ITEMS_COMMAND.MINE} requires ${FLAG.ACTOR} <actor>`,
        writes_performed: false
      });
      return 1;
    }

    const ledger = readLedgerForView(args, FLAG.MINE, WORK_ITEMS_RESULT_SCHEMA.MINE);
    if (!ledger) return 1;
    const workItems = Array.isArray(ledger.value.work_items) ? ledger.value.work_items : [];
    const claimedItems = workItems.filter((item) => item.status === WORK_ITEM_STATUS.CLAIMED && item.claim && item.claim.actor === actor);
    const closedItems = workItems.filter((item) => item.status === WORK_ITEM_STATUS.CLOSED && (
      (item.claim && item.claim.actor === actor) || (item.closure && item.closure.actor === actor)
    ));
    emitView(args, {
      schema: WORK_ITEMS_RESULT_SCHEMA.MINE,
      status: STATUS.OK,
      command_family: COMMAND_FAMILY,
      command: `agent-onboard ${WORK_ITEMS_COMMAND.MINE}`,
      file: ledger.file,
      actor,
      validated: true,
      claimed_work_items: claimedItems.map((item) => decorateWorkItem(item, ledger.indexes)),
      closed_work_items: closedItems.map((item) => decorateWorkItem(item, ledger.indexes)),
      counts: {
        claimed: claimedItems.length,
        closed: closedItems.length,
        total: claimedItems.length + closedItems.length
      },
      next_steps: claimedItems.length > 0 ? [
        'inspect the claimed work item scope before editing',
        'record changed files and checks before closing the work item'
      ] : [
        `run agent-onboard ${WORK_ITEMS_COMMAND.NEXT}`,
        `claim an open item with agent-onboard ${WORK_ITEMS_COMMAND.CLAIM} ${FLAG.DRY_RUN} ${FLAG.ID} <public-work-item-id> ${FLAG.ACTOR} ${actor}`
      ],
      writes_performed: false,
      boundary: {
        reads_work_items_file: true,
        modifies_work_items_file: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false
      },
      errors: []
    });
    return 0;
  }


  function claimsFileFromArgs(args) {
    return optionAfterFlag(args, FLAG.FILE) || CANONICAL_CLAIMS_FILE;
  }

  function parseClaimsLedger(file) {
    const absolutePath = path.resolve(cwd(), file);
    const present = exists(absolutePath);
    if (!present) {
      return {
        file,
        absolutePath,
        present: false,
        entries: [],
        errors: []
      };
    }
    const text = fs.readFileSync(absolutePath, 'utf8');
    const lines = text.split(/\r?\n/);
    const entries = [];
    const errors = [];
    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      if (!raw.trim()) continue;
      let entry;
      try {
        entry = JSON.parse(raw);
      } catch (error) {
        errors.push(`line ${index + 1} must be valid JSON: ${error && error.message ? error.message : String(error)}`);
        continue;
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`line ${index + 1} must be a JSON object`);
        continue;
      }
      entries.push({ line_number: index + 1, entry });
    }
    return { file, absolutePath, present, entries, errors };
  }

  function validateClaimEntry(entry, lineNumber) {
    const errors = [];
    const prefix = `line ${lineNumber}`;
    if (!entry.event_type || typeof entry.event_type !== 'string') errors.push(`${prefix} requires event_type`);
    else if (!CLAIM_EVENT_TYPE.includes(entry.event_type)) errors.push(`${prefix} event_type must be one of ${CLAIM_EVENT_TYPE.join(', ')}`);
    if (!entry.claim_id || typeof entry.claim_id !== 'string') errors.push(`${prefix} requires claim_id`);
    if (!entry.work_item_id || typeof entry.work_item_id !== 'string') errors.push(`${prefix} requires work_item_id`);
    if (!entry.actor || typeof entry.actor !== 'string') errors.push(`${prefix} requires actor`);
    if (!entry.created_at || typeof entry.created_at !== 'string') errors.push(`${prefix} requires created_at`);
    else if (Number.isNaN(Date.parse(entry.created_at))) errors.push(`${prefix} created_at must be an ISO timestamp`);
    const status = entry.claim_status || entry.status;
    if (status && !['proposed', 'merged'].includes(status)) errors.push(`${prefix} claim_status/status must be proposed or merged when present`);
    return errors;
  }

  function positiveIntegerOption(args, flag, fallback) {
    const value = optionAfterFlag(args, flag);
    if (value === undefined) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${flag} requires a positive integer`);
    return parsed;
  }

  function isoTimeFromOption(args, flag, fallbackIso) {
    const value = optionAfterFlag(args, flag) || fallbackIso;
    if (Number.isNaN(Date.parse(value))) throw new Error(`${flag} requires an ISO timestamp`);
    return value;
  }

  function claimLifecyclePayloadFromParsed(parsed, options = Object.freeze({})) {
    const staleHours = Number.isSafeInteger(options.staleHours) && options.staleHours > 0 ? options.staleHours : 72;
    const nowIso = options.nowIso || new Date().toISOString();
    const nowMs = Date.parse(nowIso);
    const claimState = new Map();
    const activeByWorkItem = new Map();
    const eventCounts = Object.fromEntries(CLAIM_EVENT_TYPE.map((type) => [type, 0]));
    const lifecycleErrors = [];
    const sequenceErrors = [];
    const conflictWorkItems = [];
    const staleClaims = [];
    const workItemIds = new Set();
    const actors = new Set();
    const claimIds = new Set();

    for (const item of parsed.entries) {
      const entry = item.entry;
      if (CLAIM_EVENT_TYPE.includes(entry.event_type)) eventCounts[entry.event_type] += 1;
      if (typeof entry.work_item_id === 'string') workItemIds.add(entry.work_item_id);
      if (typeof entry.actor === 'string') actors.add(entry.actor);
      if (typeof entry.claim_id === 'string') claimIds.add(entry.claim_id);
      if (!entry.claim_id || !entry.work_item_id || !entry.event_type) continue;

      const existing = claimState.get(entry.claim_id);
      if (entry.event_type === 'claim_proposed') {
        if (existing && existing.proposed) sequenceErrors.push(`line ${item.line_number} duplicates proposed event for ${entry.claim_id}`);
        if (existing && existing.work_item_id && existing.work_item_id !== entry.work_item_id) sequenceErrors.push(`line ${item.line_number} reuses ${entry.claim_id} for a different work item`);
        claimState.set(entry.claim_id, {
          claim_id: entry.claim_id,
          work_item_id: entry.work_item_id,
          actor: entry.actor || null,
          proposed_at: entry.created_at || null,
          proposed_line: item.line_number,
          merged_at: existing && existing.merged_at ? existing.merged_at : null,
          merged_line: existing && existing.merged_line ? existing.merged_line : null,
          proposed: true
        });
        continue;
      }

      if (CLAIM_LIFECYCLE_TERMINAL_EVENTS.includes(entry.event_type)) {
        if (!existing || !existing.proposed) {
          sequenceErrors.push(`line ${item.line_number} merges ${entry.claim_id} before a proposed event`);
          claimState.set(entry.claim_id, {
            claim_id: entry.claim_id,
            work_item_id: entry.work_item_id,
            actor: entry.actor || null,
            proposed_at: null,
            proposed_line: null,
            merged_at: entry.created_at || null,
            merged_line: item.line_number,
            proposed: false
          });
          continue;
        }
        if (existing.work_item_id !== entry.work_item_id) sequenceErrors.push(`line ${item.line_number} merges ${entry.claim_id} against a different work item`);
        if (existing.merged_at) sequenceErrors.push(`line ${item.line_number} duplicates terminal event for ${entry.claim_id}`);
        existing.merged_at = entry.created_at || null;
        existing.merged_line = item.line_number;
        claimState.set(entry.claim_id, existing);
      }
    }

    for (const state of claimState.values()) {
      if (!state.proposed || state.merged_at) continue;
      const active = activeByWorkItem.get(state.work_item_id) || [];
      active.push({
        claim_id: state.claim_id,
        work_item_id: state.work_item_id,
        actor: state.actor,
        proposed_at: state.proposed_at,
        proposed_line: state.proposed_line
      });
      activeByWorkItem.set(state.work_item_id, active);
      if (state.proposed_at && nowMs - Date.parse(state.proposed_at) > staleHours * 60 * 60 * 1000) {
        staleClaims.push({
          claim_id: state.claim_id,
          work_item_id: state.work_item_id,
          actor: state.actor,
          proposed_at: state.proposed_at,
          stale_after_hours: staleHours
        });
      }
    }

    for (const [workItemId, active] of activeByWorkItem.entries()) {
      if (active.length > 1) {
        conflictWorkItems.push({
          work_item_id: workItemId,
          active_claim_count: active.length,
          claim_ids: active.map((entry) => entry.claim_id)
        });
      }
    }

    lifecycleErrors.push(...sequenceErrors);
    for (const conflict of conflictWorkItems) lifecycleErrors.push(`work item ${conflict.work_item_id} has ${conflict.active_claim_count} active claims`);

    return {
      schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM_LEDGER_LIFECYCLE,
      status: lifecycleErrors.length === 0 ? STATUS.OK : STATUS.ERROR,
      command_family: 'claim',
      command: 'agent-onboard claim --lifecycle-check',
      file: parsed.file,
      present: parsed.present,
      lifecycle_checked: true,
      line_count: parsed.entries.length,
      event_counts: eventCounts,
      work_item_count: workItemIds.size,
      actor_count: actors.size,
      claim_count: claimIds.size,
      active_claim_count: Array.from(activeByWorkItem.values()).reduce((sum, active) => sum + active.length, 0),
      active_work_item_count: activeByWorkItem.size,
      conflict_count: conflictWorkItems.length,
      stale_claim_count: staleClaims.length,
      stale_threshold_hours: staleHours,
      now: nowIso,
      active_claims: Array.from(activeByWorkItem.values()).flat().map((entry) => ({ claim_id: entry.claim_id, work_item_id: entry.work_item_id, actor: entry.actor, proposed_at: entry.proposed_at })),
      conflict_work_items: conflictWorkItems,
      stale_claims: staleClaims,
      output_policy: {
        raw_claims_ledger_inlined: false,
        raw_claim_event_notes_inlined: false,
        compact_lifecycle_only: true
      },
      boundary: {
        reads_claims_ledger: true,
        writes_files: false,
        mutates_work_items_ledger: false,
        mutates_claims_ledger: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        network: false
      },
      errors: lifecycleErrors
    };
  }

  function claimLedgerValidationPayload(file, options = Object.freeze({})) {
    const parsed = parseClaimsLedger(file);
    const entryErrors = parsed.errors.slice();
    for (const item of parsed.entries) entryErrors.push(...validateClaimEntry(item.entry, item.line_number));
    const lifecycle = claimLifecyclePayloadFromParsed(parsed, options);
    const errors = entryErrors.concat(lifecycle.errors || []);
    return {
      schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM_LEDGER_VALIDATION,
      status: errors.length === 0 ? STATUS.OK : STATUS.ERROR,
      command_family: 'claim',
      command: 'agent-onboard claim --validate-ledger',
      file,
      present: parsed.present,
      validated: true,
      line_count: parsed.entries.length,
      event_counts: lifecycle.event_counts,
      work_item_count: lifecycle.work_item_count,
      actor_count: lifecycle.actor_count,
      claim_count: lifecycle.claim_count,
      lifecycle: {
        status: lifecycle.status,
        active_claim_count: lifecycle.active_claim_count,
        active_work_item_count: lifecycle.active_work_item_count,
        conflict_count: lifecycle.conflict_count,
        stale_claim_count: lifecycle.stale_claim_count,
        stale_threshold_hours: lifecycle.stale_threshold_hours
      },
      output_policy: {
        raw_claims_ledger_inlined: false,
        raw_claim_event_notes_inlined: false,
        compact_counts_only: true,
        compact_lifecycle_only: true
      },
      boundary: {
        reads_claims_ledger: true,
        writes_files: false,
        mutates_work_items_ledger: false,
        mutates_claims_ledger: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        network: false
      },
      errors
    };
  }

  function formatClaimLedgerValidationText(payload) {
    return [
      'agent-onboard claim ledger validation',
      `Status: ${payload.status}`,
      `File: ${payload.file}`,
      `Present: ${payload.present ? 'yes' : 'no'}`,
      `Events: ${payload.line_count}`,
      `Proposed: ${payload.event_counts.claim_proposed}`,
      `Merged: ${payload.event_counts.claim_merged}`,
      `Lifecycle: ${payload.lifecycle ? payload.lifecycle.status : 'not checked'}`,
      `Active claims: ${payload.lifecycle ? payload.lifecycle.active_claim_count : 0}`,
      `Conflicts: ${payload.lifecycle ? payload.lifecycle.conflict_count : 0}`,
      `Stale claims: ${payload.lifecycle ? payload.lifecycle.stale_claim_count : 0}`,
      `Writes performed: ${payload.boundary.writes_files}`,
      payload.errors.length > 0 ? `Errors: ${payload.errors.join('; ')}` : 'Errors: none'
    ].join('\n') + '\n';
  }

  function formatClaimLedgerLifecycleText(payload) {
    return [
      'agent-onboard claim lifecycle check',
      `Status: ${payload.status}`,
      `File: ${payload.file}`,
      `Present: ${payload.present ? 'yes' : 'no'}`,
      `Events: ${payload.line_count}`,
      `Active claims: ${payload.active_claim_count}`,
      `Active work items: ${payload.active_work_item_count}`,
      `Conflicts: ${payload.conflict_count}`,
      `Stale claims: ${payload.stale_claim_count}`,
      `Writes performed: ${payload.boundary.writes_files}`,
      payload.errors.length > 0 ? `Errors: ${payload.errors.join('; ')}` : 'Errors: none'
    ].join('\n') + '\n';
  }

  function validateClaimLedger(args) {
    const wantsText = args.includes(OUTPUT_FLAG.TEXT);
    const wantsJson = args.includes(OUTPUT_FLAG.JSON);
    if (wantsText && wantsJson) throw new Error('claim --validate-ledger accepts either --json or --text, not both');
    const file = claimsFileFromArgs(args);
    const staleHours = positiveIntegerOption(args, '--stale-hours', 72);
    const nowIso = isoTimeFromOption(args, '--now', new Date().toISOString());
    const result = claimLedgerValidationPayload(file, { staleHours, nowIso });
    if (wantsText) emitText(formatClaimLedgerValidationText(result).trimEnd());
    else emit(result);
    return result.status === STATUS.OK ? 0 : 1;
  }

  function claimLifecycleCheck(args) {
    const wantsText = args.includes(OUTPUT_FLAG.TEXT);
    const wantsJson = args.includes(OUTPUT_FLAG.JSON);
    if (wantsText && wantsJson) throw new Error('claim --lifecycle-check accepts either --json or --text, not both');
    const file = claimsFileFromArgs(args);
    const staleHours = positiveIntegerOption(args, '--stale-hours', 72);
    const nowIso = isoTimeFromOption(args, '--now', new Date().toISOString());
    const parsed = parseClaimsLedger(file);
    const result = claimLifecyclePayloadFromParsed(parsed, { staleHours, nowIso });
    const entryErrors = parsed.errors.slice();
    for (const item of parsed.entries) entryErrors.push(...validateClaimEntry(item.entry, item.line_number));
    result.errors = entryErrors.concat(result.errors || []);
    result.status = result.errors.length === 0 ? STATUS.OK : STATUS.ERROR;
    if (wantsText) emitText(formatClaimLedgerLifecycleText(result).trimEnd());
    else emit(result);
    return result.status === STATUS.OK ? 0 : 1;
  }

  function appendClaimLedger(args) {
    const dry = args.includes(FLAG.DRY_RUN);
    const write = args.includes(FLAG.WRITE);
    if (!write && !dry) throw new Error('claim --append requires --dry-run or --write');
    if (write && dry) throw new Error('claim --append accepts only one of --dry-run or --write');
    const mode = modeFromWrite(write);
    const file = claimsFileFromArgs(args);
    const workItemId = optionAfterFlag(args, '--work-item-id');
    const actor = optionAfterFlag(args, FLAG.ACTOR);
    const eventType = optionAfterFlag(args, '--event-type') || 'claim_proposed';
    if (!CLAIM_EVENT_TYPE.includes(eventType)) throw new Error(`claim --append --event-type must be one of ${CLAIM_EVENT_TYPE.join(', ')}`);
    const createdAt = optionAfterFlag(args, '--created-at') || new Date().toISOString();
    const claimId = optionAfterFlag(args, '--claim-id') || `claim-${sha256Hex(`${workItemId}\n${actor}\n${eventType}\n${createdAt}`).slice(0, 16)}`;
    const entry = {
      schema: 'agent-onboard-public-claim-ledger-entry-001',
      event_type: eventType,
      claim_status: eventType === 'claim_merged' ? 'merged' : 'proposed',
      claim_id: claimId,
      work_item_id: workItemId,
      actor,
      created_at: createdAt
    };
    const note = optionAfterFlag(args, FLAG.NOTE);
    const summary = optionAfterFlag(args, FLAG.SUMMARY);
    if (note) entry.note = note;
    if (summary) entry.summary = summary;
    const entryErrors = validateClaimEntry(entry, 1);
    const currentParsed = parseClaimsLedger(file);
    const currentEntryErrors = currentParsed.errors.slice();
    for (const item of currentParsed.entries) currentEntryErrors.push(...validateClaimEntry(item.entry, item.line_number));
    const staleHours = positiveIntegerOption(args, '--stale-hours', 72);
    const nowIso = isoTimeFromOption(args, '--now', new Date().toISOString());
    const plannedParsed = {
      file,
      absolutePath: currentParsed.absolutePath,
      present: currentParsed.present,
      entries: currentParsed.entries.concat([{ line_number: currentParsed.entries.length + 1, entry }]),
      errors: currentParsed.errors.slice()
    };
    const plannedLifecycle = claimLifecyclePayloadFromParsed(plannedParsed, { staleHours, nowIso });
    const lifecycleErrors = plannedLifecycle.errors || [];
    const plannedLine = JSON.stringify(entry);
    if (write && entryErrors.length === 0 && currentEntryErrors.length === 0 && lifecycleErrors.length === 0) {
      fs.mkdirSync(path.dirname(path.resolve(cwd(), file)), { recursive: true });
      fs.appendFileSync(path.resolve(cwd(), file), `${plannedLine}\n`);
    }
    const validationAfter = write && entryErrors.length === 0 && currentEntryErrors.length === 0 && lifecycleErrors.length === 0 ? claimLedgerValidationPayload(file, { staleHours, nowIso }) : null;
    const ok = entryErrors.length === 0 && currentEntryErrors.length === 0 && lifecycleErrors.length === 0 && (!validationAfter || validationAfter.status === STATUS.OK);
    emit({
      schema: WORK_ITEMS_RESULT_SCHEMA.CLAIM_LEDGER_APPEND,
      status: ok ? STATUS.OK : STATUS.ERROR,
      command_family: 'claim',
      command: `agent-onboard claim --append --${mode}`,
      file,
      mode,
      writes_performed: write && ok,
      planned_entry: entry,
      planned_lifecycle: {
        status: plannedLifecycle.status,
        active_claim_count: plannedLifecycle.active_claim_count,
        conflict_count: plannedLifecycle.conflict_count,
        stale_claim_count: plannedLifecycle.stale_claim_count
      },
      validation_after_write: validationAfter,
      boundary: {
        writes_only_under_explicit_write: true,
        mutates_claims_ledger: write,
        mutates_only_claims_ledger: write,
        mutates_work_items_ledger: false,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        network: false
      },
      errors: ok ? [] : entryErrors.concat(currentEntryErrors, lifecycleErrors, validationAfter && validationAfter.errors ? validationAfter.errors : [])
    });
    return ok ? 0 : 1;
  }

  return Object.freeze({
    instance_schema: 'agent-onboard-public-work-items-runtime-service-instance-001',
    seed: WORK_ITEMS_SERVICE_SEED,
    init,
    append,
    claim,
    close,
    schema: schema,
    template,
    validateTemplate,
    validate,
    list,
    summary,
    next,
    mine,
    validateClaimLedger,
    claimLifecycleCheck,
    appendClaimLedger
  });
}

module.exports = Object.freeze({
  WORK_ITEMS_SERVICE_SEED,
  describeWorkItemsServiceSeed,
  createWorkItemsService
});
