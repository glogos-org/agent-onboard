#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { checkModulePath } = require('./registry');

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_REL = '.agent-onboard/god-file-budget-enforcement-closure.json';
const TEXT_EXTENSIONS = new Set(['.cjs', '.css', '.editorconfig', '.gitattributes', '.gitignore', '.html', '.js', '.json', '.jsonl', '.md', '.mjs', '.sh', '.txt', '.yaml', '.yml']);
const TEXT_BASENAMES = new Set(['LICENSE', 'Makefile']);
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'coverage', 'dist', 'tmp', '.lake']);

function abs(rel) { return path.join(ROOT, rel); }
function readJson(rel) { return JSON.parse(fs.readFileSync(abs(rel), 'utf8')); }
function normalize(rel) { return rel.split(path.sep).join('/'); }
function lineCount(text) { return text.length === 0 ? 0 : text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0); }
function isTextFile(file) { return TEXT_BASENAMES.has(path.basename(file)) || TEXT_EXTENSIONS.has(path.extname(file)); }
function listFiles(dir = ROOT, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) out.push(...listFiles(path.join(dir, entry.name), path.join(prefix, entry.name)));
    } else if (entry.isFile() && isTextFile(entry.name)) out.push(normalize(path.join(prefix, entry.name)));
  }
  return out.sort();
}
function metric(rel) {
  const text = fs.readFileSync(abs(rel), 'utf8');
  return { path: rel, lines: lineCount(text), bytes: fs.statSync(abs(rel)).size };
}
function fileMetrics() { return listFiles().map(metric); }
function runSourceSizeBudget() {
  const result = spawnSync(process.execPath, ['scripts/check.js', 'source-size-budget'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 });
  if (result.status !== 0) return { status: 'error', errors: [result.stderr || result.stdout || 'source-size-budget failed'] };
  try { return JSON.parse(result.stdout); } catch (error) { return { status: 'error', errors: [`source-size-budget output is not JSON: ${error.message}`] }; }
}
function main() {
  const errors = [];
  const artifact = readJson(ARTIFACT_REL);
  const pkg = readJson('package.json');
  const ledger = readJson('.agent-onboard/work-items.json');
  const sourceBudget = runSourceSizeBudget();
  const metrics = fileMetrics();
  const godFiles = metrics.filter((item) => item.lines >= 1000 || item.bytes >= 102400).sort((a, b) => a.path.localeCompare(b.path));
  const nearGodFiles = metrics.filter((item) => (item.lines >= 500 || item.bytes >= 51200) && !(item.lines >= 1000 || item.bytes >= 102400));
  const admitted = new Map((artifact.remaining_god_files || []).map((item) => [item.path, item]));
  const topLevelCheckScripts = fs.readdirSync(abs('scripts')).filter((name) => /^check-.+\.js$/u.test(name));

  if (artifact.schema !== 'agent-onboard-public-god-file-budget-enforcement-closure-001') errors.push('artifact schema mismatch');
  if (artifact.work_item_id !== 'P1S3M6W34') errors.push('artifact work_item_id must be P1S3M6W34');
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) errors.push('package version must be present');
  if (sourceBudget.status !== 'ok') errors.push(...(sourceBudget.errors || ['source-size-budget status is not ok']));
  if (godFiles.length > artifact.maximums.god_files) errors.push(`god file count ${godFiles.length} exceeds ${artifact.maximums.god_files}`);
  if (nearGodFiles.length > artifact.maximums.near_god_files) errors.push(`near-god file count ${nearGodFiles.length} exceeds ${artifact.maximums.near_god_files}`);
  if (topLevelCheckScripts.length !== artifact.maximums.top_level_check_scripts) errors.push(`top-level check script sprawl remains: ${topLevelCheckScripts.join(', ')}`);
  for (const item of godFiles) {
    const debt = admitted.get(item.path);
    if (!debt) errors.push(`unadmitted god file: ${item.path}`);
    else if (item.lines > (debt.current_lines || Infinity) || item.bytes > (debt.current_bytes || debt.current_bytes_max || Infinity)) errors.push(`${item.path} grew beyond W34 admitted budget`);
  }
  for (const debt of artifact.remaining_god_files || []) {
    if (!fs.existsSync(abs(debt.path))) errors.push(`admitted god file missing: ${debt.path}`);
    if (!debt.next_reduction_gate) errors.push(`${debt.path} missing next_reduction_gate`);
  }
  for (const checkId of artifact.required_check_ids || []) {
    if (!checkModulePath(checkId)) errors.push(`required check id missing from registry: ${checkId}`);
  }
  const items = Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const id of artifact.required_closed_work_items || []) {
    const item = byId.get(id);
    if (!item) errors.push(`required work item missing: ${id}`);
    else if (item.status !== 'closed') errors.push(`required work item is not closed: ${id}`);
  }
  const storage = artifact.policy || {};
  if (storage.storage_backend !== 'json_and_jsonl_text_first') errors.push('storage backend must remain JSON/JSONL text-first');
  if (storage.sqlite_current_source_of_truth !== false || storage.lightning_memory_mapped_database_current_source_of_truth !== false || storage.mdbx_current_source_of_truth !== false) errors.push('database backend must remain non-authoritative');
  const result = {
    schema: 'agent-onboard-public-god-file-budget-enforcement-closure-check-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: 'agent-onboard',
    version: pkg.version,
    work_item_id: 'P1S3M6W34',
    artifact: ARTIFACT_REL,
    counts: { god_files: godFiles.length, near_god_files: nearGodFiles.length, top_level_check_scripts: topLevelCheckScripts.length, failures: errors.length },
    remaining_god_files: godFiles,
    source_size_budget_status: sourceBudget.status,
    source_size_budget_counts: sourceBudget.counts || null,
    boundary: { writes_files: false, mutates_git: false, installs_dependencies: false, network: false, publishes_package: false, storage_backend_changed: false },
    errors
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
