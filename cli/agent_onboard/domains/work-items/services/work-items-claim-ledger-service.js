
'use strict';

const fs = require('fs');
const path = require('path');

const CANONICAL_CLAIMS_FILE = '.agent-onboard/claims.jsonl';

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
  FILE: '--file',
  ACTOR: '--actor',
  NOTE: '--note',
  SUMMARY: '--summary'
});

const OUTPUT_FLAG = Object.freeze({
  JSON: '--json',
  TEXT: '--text'
});

const WORK_ITEMS_RESULT_SCHEMA = Object.freeze({
  CLAIM_LEDGER_VALIDATION: 'agent-onboard-public-claim-ledger-validation-001',
  CLAIM_LEDGER_APPEND: 'agent-onboard-public-claim-ledger-append-result-001',
  CLAIM_LEDGER_LIFECYCLE: 'agent-onboard-public-claim-ledger-lifecycle-result-001'
});

const CLAIM_EVENT_TYPE = Object.freeze(['claim_proposed', 'claim_merged']);
const CLAIM_LIFECYCLE_TERMINAL_EVENTS = Object.freeze(['claim_merged']);

function createWorkItemsClaimLedgerService(options = Object.freeze({})) {
  const cwd = typeof options.cwd === 'function' ? options.cwd : () => process.cwd();
  const emit = typeof options.emit === 'function' ? options.emit : (payload) => process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  const emitText = typeof options.emitText === 'function' ? options.emitText : (text) => process.stdout.write(`${text}\n`);
  const exists = typeof options.exists === 'function' ? options.exists : fs.existsSync;
  const optionAfterFlag = typeof options.optionAfterFlag === 'function' ? options.optionAfterFlag : () => undefined;
  const modeFromWrite = typeof options.modeFromWrite === 'function' ? options.modeFromWrite : (write) => write ? MODE.WRITE : MODE.DRY_RUN;
  const sha256Hex = typeof options.sha256Hex === 'function' ? options.sha256Hex : (text) => require('crypto').createHash('sha256').update(String(text)).digest('hex');

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
    validateClaimLedger,
    claimLifecycleCheck,
    appendClaimLedger
  });
}

module.exports = Object.freeze({
  createWorkItemsClaimLedgerService
});
