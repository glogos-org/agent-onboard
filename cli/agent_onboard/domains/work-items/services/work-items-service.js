'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createWorkItemsMutationService } = require('./work-items-mutation-service');
const { createWorkItemsClaimLedgerService } = require('./work-items-claim-ledger-service');

const COMMAND_FAMILY = 'work-items';
const CANONICAL_WORK_ITEMS_FILE = '.agent-onboard/work-items.json';
const CANONICAL_CLAIMS_FILE = '.agent-onboard/claims.jsonl';
const CANONICAL_WORK_ITEM_CLOSURES_FILE = '.agent-onboard/state/closures/work-items-closures.jsonl';

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

function closureForWorkItem(item, closureArchiveByRef) {
  if (item && item.closure) return item.closure;
  if (item && item.closure_ref && closureArchiveByRef instanceof Map) return closureArchiveByRef.get(item.closure_ref) || null;
  return null;
}

function decorateWorkItem(item, indexes, closureArchiveByRef = new Map()) {
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
    closure_ref: item.closure_ref || null,
    closure: closureForWorkItem(item, closureArchiveByRef)
  };
}

function ledgerIndexes(value) {
  return Object.freeze({
    programs: indexById(value.programs),
    stages: indexById(value.stages),
    milestones: indexById(value.milestones)
  });
}

function readClosureArchiveByRef(root, existsFn = fs.existsSync) {
  const archivePath = path.resolve(root, CANONICAL_WORK_ITEM_CLOSURES_FILE);
  const byRef = new Map();
  if (!existsFn(archivePath)) return byRef;
  const text = fs.readFileSync(archivePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      if (record && typeof record.closure_id === 'string') byRef.set(record.closure_id, record);
    } catch (_error) {
      // Archive parsing is best-effort for compatibility views; validation commands own hard failures.
    }
  }
  return byRef;
}

function appendJsonlRecord(file, record) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
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

  const mutationService = createWorkItemsMutationService({
    cwd,
    emit,
    readJson,
    validateWorkItems,
    workItemCounts,
    appendWorkItemDryRun,
    claimWorkItemDryRun,
    closeWorkItemDryRun,
    workItemsTemplate,
    planWrites,
    performPlannedWrites,
    summarizePlan,
    writeJson,
    exists,
    refreshGovernanceIndexesAfterWrite,
    optionAfterFlag,
    repeatedOptionsAfterFlag,
    resultStatus,
    modeFromWrite,
    commandWithMode,
    workItemsFileFromArgs,
    appendJsonlRecord
  });

  const claimLedgerService = createWorkItemsClaimLedgerService({
    cwd,
    emit,
    emitText,
    exists,
    optionAfterFlag,
    modeFromWrite,
    sha256Hex
  });

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
    return { file, value, indexes: ledgerIndexes(value), closureArchiveByRef: readClosureArchiveByRef(cwd(), exists) };
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
      open_work_items: openItems.map((item) => decorateWorkItem(item, ledger.indexes, ledger.closureArchiveByRef)),
      claimed_work_items: claimedItems.map((item) => decorateWorkItem(item, ledger.indexes, ledger.closureArchiveByRef)),
      next_open_work_item: openItems.length > 0 ? decorateWorkItem(openItems[0], ledger.indexes, ledger.closureArchiveByRef) : null,
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
    const closedItems = workItems.filter((item) => {
      if (item.status !== WORK_ITEM_STATUS.CLOSED) return false;
      const archivedClosure = closureForWorkItem(item, ledger.closureArchiveByRef);
      return (item.claim && item.claim.actor === actor) || (archivedClosure && archivedClosure.actor === actor);
    });
    emitView(args, {
      schema: WORK_ITEMS_RESULT_SCHEMA.MINE,
      status: STATUS.OK,
      command_family: COMMAND_FAMILY,
      command: `agent-onboard ${WORK_ITEMS_COMMAND.MINE}`,
      file: ledger.file,
      actor,
      validated: true,
      claimed_work_items: claimedItems.map((item) => decorateWorkItem(item, ledger.indexes, ledger.closureArchiveByRef)),
      closed_work_items: closedItems.map((item) => decorateWorkItem(item, ledger.indexes, ledger.closureArchiveByRef)),
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


  return Object.freeze({
    instance_schema: 'agent-onboard-public-work-items-runtime-service-instance-001',
    seed: WORK_ITEMS_SERVICE_SEED,
    init: mutationService.init,
    append: mutationService.append,
    claim: mutationService.claim,
    close: mutationService.close,
    schema: schema,
    template,
    validateTemplate,
    validate,
    list,
    summary,
    next,
    mine,
    validateClaimLedger: claimLedgerService.validateClaimLedger,
    claimLifecycleCheck: claimLedgerService.claimLifecycleCheck,
    appendClaimLedger: claimLedgerService.appendClaimLedger
  });
}

module.exports = Object.freeze({
  WORK_ITEMS_SERVICE_SEED,
  describeWorkItemsServiceSeed,
  createWorkItemsService
});
