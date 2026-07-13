#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_REL = '.agent-onboard/source-size-budget-ratchet.json';
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, CONFIG_REL), 'utf8'));
const TEXT_EXTENSIONS = new Set([
  '.cjs', '.css', '.editorconfig', '.gitattributes', '.gitignore', '.html', '.js', '.json', '.jsonl', '.md', '.mjs', '.sh', '.txt', '.yaml', '.yml'
]);
const TEXT_BASENAMES = new Set(['LICENSE', 'Makefile']);
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'coverage', 'dist', 'tmp', '.lake']);

function normalize(rel) {
  return rel.split(path.sep).join('/');
}

function isTextFile(abs) {
  const base = path.basename(abs);
  if (TEXT_BASENAMES.has(base)) return true;
  const ext = path.extname(abs);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (TEXT_EXTENSIONS.has(base)) return true;
  return false;
}

function listFiles(dir = ROOT, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      out.push(...listFiles(path.join(dir, entry.name), path.join(prefix, entry.name)));
      continue;
    }
    if (!entry.isFile()) continue;
    const abs = path.join(dir, entry.name);
    if (!isTextFile(abs)) continue;
    out.push(normalize(path.join(prefix, entry.name)));
  }
  return out.sort();
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/u).length - (text.endsWith('\n') ? 1 : 0);
}

function byteCount(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function classify(rel) {
  if (rel === 'cli/agent-onboard.js') return 'cli_entrypoint';
  if (rel === 'README.md' || rel === 'SOURCE_OF_TRUTH.md' || rel === 'AGENTS.md' || rel.startsWith('docs/') || rel === 'llms.txt') return 'documentation';
  if (rel.startsWith('scripts/') && rel.endsWith('.js')) return 'check_script';
  if (rel.startsWith('test/') && rel.endsWith('.js')) return 'test_source';
  if (rel.startsWith('cli/agent_onboard/') && rel.endsWith('.js')) {
    if (rel.endsWith('/static-catalog.js') || rel.endsWith('/m3-runtime-catalog.js')) return 'runtime_catalog_source';
    if (rel.includes('/services/')) return 'runtime_service_source';
    return 'runtime_source';
  }
  if (rel.startsWith('src/') && rel.endsWith('.js')) return 'source_module';
  if (rel.startsWith('.agent-onboard/state/') && (rel.endsWith('.json') || rel.endsWith('.jsonl'))) return 'authority_state';
  if (rel.startsWith('.agent-onboard/') && (rel.endsWith('.json') || rel.endsWith('.jsonl'))) return 'authority_registry';
  if (rel.endsWith('.json') || rel.endsWith('.jsonl')) return 'root_json';
  return 'other_text';
}

function categoryPolicy(category) {
  return CONFIG.categories[category] || CONFIG.categories.other_text;
}

function targetBreached(metric, policy, tracked) {
  const targetLines = tracked && Number.isInteger(tracked.target_lines) ? tracked.target_lines : policy.target_lines;
  const targetBytes = tracked && Number.isInteger(tracked.target_bytes) ? tracked.target_bytes : policy.target_bytes;
  return (Number.isInteger(targetLines) && metric.lines > targetLines)
    || (Number.isInteger(targetBytes) && metric.bytes > targetBytes);
}

function godLevel(metric) {
  if (metric.lines >= CONFIG.god_file_thresholds.god_lines || metric.bytes >= CONFIG.god_file_thresholds.god_bytes) return 'god';
  if (metric.lines >= CONFIG.god_file_thresholds.near_god_lines || metric.bytes >= CONFIG.god_file_thresholds.near_god_bytes) return 'near_god';
  return 'normal';
}

function main() {
  const failures = [];
  const advisories = [];
  const tracked = CONFIG.tracked_files || {};
  const files = listFiles();
  const metrics = files.map((rel) => {
    const text = read(rel);
    const category = classify(rel);
    const metric = {
      path: rel,
      category,
      lines: lineCount(text),
      bytes: byteCount(rel)
    };
    metric.level = godLevel(metric);
    return metric;
  });
  const byPath = new Map(metrics.map((metric) => [metric.path, metric]));

  for (const [rel, budget] of Object.entries(tracked)) {
    const metric = byPath.get(rel);
    if (!metric) {
      if (budget.required !== false) failures.push(`tracked budget file missing: ${rel}`);
      continue;
    }
    if (Number.isInteger(budget.max_lines) && metric.lines > budget.max_lines) failures.push(`${rel} has ${metric.lines} lines; ratchet maximum is ${budget.max_lines}`);
    if (Number.isInteger(budget.max_bytes) && metric.bytes > budget.max_bytes) failures.push(`${rel} has ${metric.bytes} bytes; ratchet maximum is ${budget.max_bytes}`);
  }

  for (const metric of metrics) {
    const budget = tracked[metric.path];
    const policy = categoryPolicy(metric.category);
    if (!budget) {
      if (Number.isInteger(policy.max_lines_new_file) && metric.lines > policy.max_lines_new_file) {
        failures.push(`${metric.path} is an untracked ${metric.category} file with ${metric.lines} lines; new-file maximum is ${policy.max_lines_new_file}`);
      }
      if (Number.isInteger(policy.max_bytes_new_file) && metric.bytes > policy.max_bytes_new_file) {
        failures.push(`${metric.path} is an untracked ${metric.category} file with ${metric.bytes} bytes; new-file maximum is ${policy.max_bytes_new_file}`);
      }
    }
    if (targetBreached(metric, policy, budget)) advisories.push(`${metric.path} exceeds long-term target for ${metric.category}`);
  }

  const levels = metrics.reduce((acc, metric) => {
    acc[metric.level] = (acc[metric.level] || 0) + 1;
    return acc;
  }, {});
  const top = metrics.slice().sort((a, b) => (b.lines - a.lines) || (b.bytes - a.bytes)).slice(0, CONFIG.report.top_largest_limit);
  const trackedRuntime = byPath.get('cli/agent_onboard/runtime-composer.js');
  const status = failures.length === 0 ? 'ok' : 'error';
  const result = {
    schema: 'agent-onboard-public-source-size-budget-ratchet-check-001',
    status,
    package_name: require(path.join(ROOT, 'package.json')).name,
    version: require(path.join(ROOT, 'package.json')).version,
    release_line: CONFIG.release_line,
    work_item_id: CONFIG.work_item_id,
    config_path: CONFIG_REL,
    budget_policy: {
      ratchet_mode: CONFIG.ratchet_mode,
      tracked_file_count: Object.keys(tracked).length,
      new_file_categories: Object.keys(CONFIG.categories).length,
      missing_tracked_files_fail: true,
      existing_over_target_files_are_advisory: true,
      tracked_files_may_not_grow_past_maximum: true,
      untracked_files_must_fit_category_new_file_budget: true
    },
    runtime_composer: trackedRuntime ? {
      path: trackedRuntime.path,
      lines: trackedRuntime.lines,
      bytes: trackedRuntime.bytes,
      max_lines: tracked[trackedRuntime.path] && tracked[trackedRuntime.path].max_lines,
      max_bytes: tracked[trackedRuntime.path] && tracked[trackedRuntime.path].max_bytes,
      target_lines: tracked[trackedRuntime.path] && tracked[trackedRuntime.path].target_lines,
      target_bytes: tracked[trackedRuntime.path] && tracked[trackedRuntime.path].target_bytes
    } : null,
    counts: {
      checked_text_files: metrics.length,
      god_files: levels.god || 0,
      near_god_files: levels.near_god || 0,
      normal_files: levels.normal || 0,
      advisories: advisories.length,
      failures: failures.length
    },
    largest_files: top,
    advisories: advisories.slice(0, CONFIG.report.max_advisories),
    failures,
    boundary: {
      writes_files: false,
      mutates_git: false,
      installs_dependencies: false,
      runs_package_manager: false,
      network: false,
      storage_backend_changed: false,
      sqlite_introduced: false,
      lmdb_introduced: false,
      mdbx_introduced: false
    }
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (status !== 'ok') process.exitCode = 1;
}

main();
