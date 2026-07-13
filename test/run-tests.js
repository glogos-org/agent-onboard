'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'cli', 'agent-onboard.js');
const PACKAGE_JSON = require(path.join(ROOT, 'package.json'));
const EXPECTED_PACK_FILES = Array.from(new Set(PACKAGE_JSON.files.concat(['package.json']))).sort();
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_FULL_CONCURRENCY = 1;
const DEFAULT_FULL_SOURCE_TEST_SHARDS = 163;
const DEFAULT_TASK_TIMEOUT_MS = 120000;
const DEFAULT_FULL_SOURCE_TEST_TASK_TIMEOUT_MS = 180000;
const FULL_SOURCE_TEST = path.join(ROOT, 'test', 'agent-onboard.test.js');
const FULL_SOURCE_CONTEXT = path.join(ROOT, 'test', 'support', 'full-source-context.js');
const FULL_SOURCE_SHARDS_DIR = path.join(ROOT, 'test', 'full-source');
const APPEND_SMOKE_WORK_ITEM_ID = ['P8', 'S8', 'M8', 'W8'].join('');

function nodeTask(name, args, validate, options = {}) {
  return {
    name,
    command: process.execPath,
    args,
    validate,
    timeoutMs: options.timeoutMs || DEFAULT_TASK_TIMEOUT_MS,
    captureOutput: options.captureOutput !== false,
    cleanupTemp: options.cleanupTemp === true
  };
}

function cliTask(name, args, validate, options = {}) {
  return nodeTask(name, [CLI, ...args], validate, options);
}

function npmTask(name, args, validate) {
  if (process.platform === 'win32') {
    return {
      name,
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', ['npm', ...args].join(' ')],
      validate,
      timeoutMs: DEFAULT_TASK_TIMEOUT_MS
    };
  }
  return {
    name,
    command: 'npm',
    args,
    validate,
    timeoutMs: DEFAULT_TASK_TIMEOUT_MS
  };
}

function parseJson(stdout, taskName) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${taskName} did not print valid JSON: ${error.message}`);
  }
}

function expectStatusOk(stdout, taskName) {
  const output = parseJson(stdout, taskName);
  if (output.status !== 'ok') {
    throw new Error(`${taskName} returned status ${JSON.stringify(output.status)}`);
  }
}

function expectPackFiles(stdout, taskName) {
  const output = parseJson(stdout, taskName);
  if (!Array.isArray(output) || output.length !== 1 || !Array.isArray(output[0].files)) {
    throw new Error(`${taskName} returned an unexpected npm pack shape`);
  }
  const actual = output[0].files.map((file) => file.path).sort();
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_PACK_FILES)) {
    throw new Error(`${taskName} packed ${actual.join(', ')} instead of ${EXPECTED_PACK_FILES.join(', ')}`);
  }
}

function expectTextIncludes(patterns) {
  return (stdout, taskName) => {
    for (const pattern of patterns) {
      if (!stdout.includes(pattern)) throw new Error(`${taskName} did not include ${JSON.stringify(pattern)}`);
    }
  };
}

function commandForDisplay(task) {
  return [path.basename(task.command), ...task.args].join(' ');
}

function trimOutput(output) {
  if (!output) return '';
  const trimmed = output.trim();
  if (trimmed.length <= 2000) return trimmed;
  return `${trimmed.slice(0, 2000)}\n... output truncated ...`;
}


function cleanupFullSourceTempDirs() {
  const tmp = os.tmpdir();
  let entries = [];
  try { entries = fs.readdirSync(tmp); } catch { return; }
  for (const entry of entries) {
    if (/^(agent-onboard-test-|agent-onboard-pack-|agent-onboard-hash-cache-|agent-onboard-target-manifest-|agent-onboard-installed-like-|agent-onboard-artifact-oracle-|agent-onboard-target-installed-smoke-|agent-onboard-real-target-trial-|aob-contract-output-|aob-full-task-|aob-target-fixture-)/.test(entry)) {
      try { fs.rmSync(path.join(tmp, entry), { recursive: true, force: true }); } catch {}
    }
  }
}

function runTask(task) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    if (task.cleanupTemp) cleanupFullSourceTempDirs();
    const child = spawn(task.command, task.args, {
      cwd: ROOT,
      windowsHide: true,
      stdio: task.captureOutput === false ? 'ignore' : ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let outputTooLarge = false;
    let timedOut = false;
    let settled = false;
    const timeoutMs = Number.isInteger(task.timeoutMs) && task.timeoutMs > 0 ? task.timeoutMs : DEFAULT_TASK_TIMEOUT_MS;

    function finish(status, signal, errorMessage) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (child.stdout && !child.stdout.destroyed) child.stdout.destroy();
      if (child.stderr && !child.stderr.destroyed) child.stderr.destroy();
      if (child.stdin && !child.stdin.destroyed) child.stdin.destroy();
      if (task.cleanupTemp) cleanupFullSourceTempDirs();
      const durationMs = Date.now() - startedAt;
      if (errorMessage) {
        resolve({ task, ok: false, durationMs, error: errorMessage, stdout, stderr });
        return;
      }
      if (outputTooLarge) {
        resolve({ task, ok: false, durationMs, error: 'output exceeded runner buffer limit', stdout, stderr });
        return;
      }
      if (timedOut) {
        resolve({ task, ok: false, durationMs, error: `task timeout after ${timeoutMs}ms`, stdout, stderr });
        return;
      }
      if (status !== 0) {
        resolve({
          task,
          ok: false,
          durationMs,
          error: signal ? `terminated by ${signal}` : `exited with ${status}`,
          stdout,
          stderr
        });
        return;
      }
      try {
        if (task.validate) task.validate(stdout, task.name);
        resolve({ task, ok: true, durationMs, stdout, stderr });
      } catch (error) {
        resolve({ task, ok: false, durationMs, error: error.message, stdout, stderr });
      }
    }

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        finish(null, 'SIGKILL');
      }, 1000).unref();
    }, timeoutMs);
    timeout.unref();

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        if (stdout.length + stderr.length > MAX_OUTPUT_BYTES) {
          outputTooLarge = true;
          child.kill();
        }
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        if (stdout.length + stderr.length > MAX_OUTPUT_BYTES) {
          outputTooLarge = true;
          child.kill();
        }
      });
    }
    child.on('error', (error) => {
      finish(null, null, error.message);
    });
    child.on('exit', (status, signal) => {
      setTimeout(() => finish(status, signal), 25);
    });
    child.on('close', (status, signal) => {
      finish(status, signal);
    });
  });
}

async function runPool(tasks, concurrency) {
  const pending = tasks.slice();
  const results = [];
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (pending.length > 0) {
      const task = pending.shift();
      const result = await runTask(task);
      results.push(result);
      const seconds = (result.durationMs / 1000).toFixed(1);
      const marker = result.ok ? 'pass' : 'fail';
      process.stdout.write(`[${marker}] ${task.name} (${seconds}s)\n`);
    }
  });
  await Promise.all(workers);
  return results;
}

function fullSourceShardSyntaxTasks() {
  if (!fs.existsSync(FULL_SOURCE_SHARDS_DIR)) return [];
  return fs.readdirSync(FULL_SOURCE_SHARDS_DIR)
    .filter((entry) => /^shard-\d{2}\.js$/u.test(entry))
    .sort()
    .map((entry) => nodeTask(`syntax: full source shard ${entry}`, ['-c', path.join(FULL_SOURCE_SHARDS_DIR, entry)]));
}

function syntaxTasks() {
  return [
    nodeTask('syntax: cli/agent-onboard.js', ['-c', CLI]),
    nodeTask('syntax: command-router', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'command-router.js')]),
    nodeTask('syntax: public contracts', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'contracts', 'public-contracts.js')]),
    nodeTask('syntax: runtime contracts', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'runtime-contracts.js')]),
    nodeTask('syntax: compatibility-command-port adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'compatibility-command-port.js')]),
    nodeTask('syntax: compatibility-command-port port', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'ports', 'compatibility-command-port.js')]),
    nodeTask('syntax: core command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'core.js')]),
    nodeTask('syntax: release package command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'release-package.js')]),
    nodeTask('syntax: architecture command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'architecture.js')]),
    nodeTask('syntax: authority command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'authority.js')]),
    nodeTask('syntax: target command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'target.js')]),
    nodeTask('syntax: work-items command adapter', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'adapters', 'commands', 'work-items.js')]),
    nodeTask('syntax: runtime service partitions', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'service-partitions.js')]),
    nodeTask('syntax: architecture M3 runtime catalog', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'm3-runtime-catalog.js')]),
    nodeTask('syntax: architecture aggregate check service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'checks', 'architecture-check-service.js')]),
    nodeTask('syntax: architecture runtime service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'runtime', 'architecture-runtime-service.js')]),
    nodeTask('syntax: architecture source extraction service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'source-extraction', 'architecture-source-extraction-service.js')]),
    nodeTask('syntax: architecture source domain orchestrator service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'source-domains', 'architecture-source-domain-service.js')]),
    nodeTask('syntax: architecture work-items source domain service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'source-domains', 'work-items-source-domain-service.js')]),
    nodeTask('syntax: architecture claims source domain service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'source-domains', 'claims-source-domain-service.js')]),
    nodeTask('syntax: architecture source domain closure service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'services', 'source-domains', 'source-domain-closure-service.js')]),
    nodeTask('syntax: architecture static catalog', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'static-catalog.js')]),
    nodeTask('syntax: architecture catalog shard map', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-architecture-map-catalog.js')]),
    nodeTask('syntax: architecture catalog shard boundary', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-architecture-boundary-catalog.js')]),
    nodeTask('syntax: architecture catalog shard source kernel', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-source-kernel-catalog.js')]),
    nodeTask('syntax: architecture catalog shard source authority', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-source-authority-catalog.js')]),
    nodeTask('syntax: architecture catalog shard work-items source', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-work-items-source-catalog.js')]),
    nodeTask('syntax: architecture catalog shard claims source', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-claims-source-catalog.js')]),
    nodeTask('syntax: architecture catalog shard release contract', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-release-contract-catalog.js')]),
    nodeTask('syntax: architecture catalog shard release fixture', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'architecture', 'catalog-shards', 'public-release-fixture-catalog.js')]),
    nodeTask('syntax: core runtime domain index', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'core', 'index.js')]),
    nodeTask('syntax: core config guard service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'core', 'services', 'config-guard-service.js')]),
    nodeTask('syntax: package runtime domain index', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'index.js')]),
    nodeTask('syntax: package runtime service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'package-service.js')]),
    nodeTask('syntax: package surface service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'package-surface-service.js')]),
    nodeTask('syntax: source manifest service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'source-manifest-service.js')]),
    nodeTask('syntax: package coordinate service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'package-coordinate-service.js')]),
    nodeTask('syntax: installed first-read contract service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'package', 'services', 'installed-first-read-contract.js')]),
    nodeTask('syntax: target static catalog', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'static-catalog.js')]),
    nodeTask('syntax: target runtime service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-service.js')]),
    nodeTask('syntax: target runtime utilities', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-runtime-utilities.js')]),
    nodeTask('syntax: target work-items preview service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-work-items-service.js')]),
    nodeTask('syntax: target governance preview service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-governance-service.js')]),
    nodeTask('syntax: target governance core service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-governance-core.js')]),
    nodeTask('syntax: target governance split preview service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-governance-preview-service.js')]),
    nodeTask('syntax: target governance index materialization service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-governance-index-materialization-service.js')]),
    nodeTask('syntax: target governance budget service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-governance-budget-service.js')]),
    nodeTask('syntax: target handoff preview service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'target', 'services', 'target-handoff-service.js')]),
    nodeTask('syntax: work-items runtime domain index', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'work-items', 'index.js')]),
    nodeTask('syntax: work-items runtime service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'work-items', 'services', 'work-items-service.js')]),
    nodeTask('syntax: work-items mutation service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'work-items', 'services', 'work-items-mutation-service.js')]),
    nodeTask('syntax: work-items claim ledger service', ['-c', path.join(ROOT, 'cli', 'agent_onboard', 'domains', 'work-items', 'services', 'work-items-claim-ledger-service.js')]),
    nodeTask('syntax: public artifact boundary check', ['-c', path.join(ROOT, 'scripts', 'check-public-artifact-boundary.js')]),
    nodeTask('syntax: source size budget ratchet check', ['-c', path.join(ROOT, 'scripts', 'check-source-size-budget-ratchet.js')]),
    nodeTask('syntax: runtime command registry extraction check', ['-c', path.join(ROOT, 'scripts', 'check-runtime-command-registry-extraction.js')]),
    nodeTask('syntax: release clean closed gates runtime slice extraction check', ['-c', path.join(ROOT, 'scripts', 'check-release-clean-closed-gates-runtime-slice-extraction.js')]),
    nodeTask('syntax: architecture catalog sharding check', ['-c', path.join(ROOT, 'scripts', 'check-architecture-catalog-sharding.js')]),
    nodeTask('syntax: work-items service split check', ['-c', path.join(ROOT, 'scripts', 'check-work-items-service-split.js')]),
    nodeTask('syntax: target governance service split check', ['-c', path.join(ROOT, 'scripts', 'check-target-governance-service-split.js')]),
    nodeTask('syntax: test suite sharding check', ['-c', path.join(ROOT, 'scripts', 'check-test-suite-sharding.js')]),
    nodeTask('syntax: state projection authority cutover check', ['-c', path.join(ROOT, 'scripts', 'check-state-projection-authority-cutover.js')]),
    nodeTask('syntax: full source test context', ['-c', FULL_SOURCE_CONTEXT]),
    ...fullSourceShardSyntaxTasks(),
    nodeTask('syntax: full source test aggregator', ['-c', FULL_SOURCE_TEST]),
    nodeTask('syntax: parallel runner', ['-c', __filename])
  ];
}

function quickTasks() {
  return [
    ...syntaxTasks(),
    cliTask('status', ['status'], expectStatusOk),
    cliTask('architecture thin entrypoint cutover check', ['architecture', '--thin-entrypoint-cutover-check'], expectStatusOk),
    cliTask('architecture router adapter delegation check', ['architecture', '--router-adapter-delegation-check'], expectStatusOk),
    cliTask('architecture check', ['architecture', '--check'], expectStatusOk),
    cliTask('release surface check', ['release', '--surface-check'], expectStatusOk),
    cliTask('release clean check', ['release', '--clean-check'], expectStatusOk),
    cliTask('release clean catalog check', ['release', '--clean-catalog-check'], expectStatusOk),
    cliTask('release keyword taxonomy check', ['release', '--keyword-taxonomy-check'], expectStatusOk),
    cliTask('release README plan check', ['release', '--readme-plan-check'], expectStatusOk),
    cliTask('release README history archive split dry-run check', ['release', '--readme-dry-run-check'], expectStatusOk),
    cliTask('release README history archive split apply check', ['release', '--readme-apply-check'], expectStatusOk),
    cliTask('release closed gate artifact compaction plan check', ['release', '--closed-gates-plan-check'], expectStatusOk),
    cliTask('release closed gate artifact compaction dry-run check', ['release', '--closed-gates-dry-run-check'], expectStatusOk),
    cliTask('release closed gate artifact compaction apply check', ['release', '--closed-gates-apply-check'], expectStatusOk),
    cliTask('release closed gate archive reader check', ['release', '--closed-gates-read-check'], expectStatusOk),
    cliTask('release closed gate raw artifact prune planning check', ['release', '--closed-gates-prune-plan-check'], expectStatusOk),
    cliTask('release closed gate raw artifact prune dry-run check', ['release', '--closed-gates-prune-dry-run-check'], expectStatusOk),
    cliTask('release closed gate raw artifact prune apply admission check', ['release', '--closed-gates-prune-apply-check'], expectStatusOk),
    cliTask('release version sprawl check', ['release', '--version-sprawl-check'], expectStatusOk),
    cliTask('release architecture parity smoke', ['release', '--architecture-parity-smoke'], expectStatusOk),
    cliTask('release check', ['release', '--check'], expectStatusOk),
    cliTask('target doctor', ['target', 'doctor', '--json'], expectStatusOk),
    cliTask('target doctor text', ['target', 'doctor', '--text'], expectTextIncludes(['agent-onboard target doctor', 'Readiness:', 'Writes performed: false'])),
    cliTask('target profile', ['target', 'profile', '--json'], expectStatusOk),
    cliTask('target profile text', ['target', 'profile', '--text'], expectTextIncludes(['agent-onboard target profile', 'Package managers:', 'Writes performed: false'])),
    cliTask('target inventory', ['target', 'inventory', '--preview'], expectStatusOk),
    cliTask('target inventory text', ['target', 'inventory', '--text'], expectTextIncludes(['agent-onboard target inventory', 'Boundary:', 'Writes performed: false'])),
    cliTask('target memory', ['target', 'memory', '--preview'], expectStatusOk),
    cliTask('target memory text', ['target', 'memory', '--text'], expectTextIncludes(['agent-onboard target memory', 'metadata-only preview', 'Writes performed: false'])),
    cliTask('target work-items', ['target', 'work-items', '--preview'], expectStatusOk),
    cliTask('target work-items text', ['target', 'work-items', '--text'], expectTextIncludes(['agent-onboard target work-items', 'Boundary:', 'Writes performed: false'])),
    cliTask('target governance', ['target', 'governance', '--preview'], expectStatusOk),
    cliTask('target governance text', ['target', 'governance', '--text'], expectTextIncludes(['agent-onboard target governance', 'Boundary:', 'Writes performed: false'])),
    cliTask('target governance materialization dry-run', ['target', 'governance', '--materialize-dry-run'], expectStatusOk),
    cliTask('target governance materialization dry-run text', ['target', 'governance', '--materialize-dry-run', '--text'], expectTextIncludes(['agent-onboard target governance materialization dry-run', 'Boundary:', 'Writes performed: false'])),
    cliTask('target governance drift check', ['target', 'governance', '--check'], expectStatusOk),
    cliTask('target governance drift check text', ['target', 'governance', '--check', '--text'], expectTextIncludes(['agent-onboard target governance drift check', 'Boundary:', 'Writes performed: false'])),
    cliTask('target handoff', ['target', 'handoff', '--preview'], expectStatusOk),
    cliTask('target handoff text', ['target', 'handoff', '--text'], expectTextIncludes(['agent-onboard target handoff', 'Boundary:', 'Writes performed: false'])),
    cliTask('issue classify dry-run', ['issue', '--classify-dry-run'], expectStatusOk),
    cliTask('issue classify dry-run text', ['issue', '--classify-dry-run', '--text'], expectTextIncludes(['agent-onboard issue intake dry-run', 'Authority: external signal only', 'no GitHub API'])),
    cliTask('contributor admission dry-run', ['contributor', '--admission-dry-run'], expectStatusOk),
    cliTask('contributor admission dry-run text', ['contributor', '--admission-dry-run', '--text'], expectTextIncludes(['agent-onboard contributor admission dry-run', 'Authority: candidate only', 'no GitHub API'])),
    cliTask('public contracts json', ['contracts', '--json'], expectStatusOk),
    cliTask('public contracts text', ['contracts', '--text'], expectTextIncludes(['agent-onboard public contracts', 'target_handoff_readiness_check_output', 'Boundary: no files'])),
    cliTask('public contracts check', ['contracts', '--check', '--json'], expectStatusOk),
    cliTask('public contracts check text', ['contracts', '--check', '--text'], expectTextIncludes(['agent-onboard public contract check', 'Status: ok', 'Output contracts:'])),
    cliTask('check plan', ['check', '--plan', '--json'], expectStatusOk),
    cliTask('check plan text', ['check', '--plan', '--text'], expectTextIncludes(['agent-onboard check plan', 'release-check', 'no shell spawn'])),
    cliTask('check fast', ['check', '--fast', '--json'], expectStatusOk),
    cliTask('check fast text', ['check', '--fast', '--text'], expectTextIncludes(['agent-onboard check fast', 'Result: pass', 'no shell spawn'])),
    cliTask('ci surface json', ['ci', '--json'], expectStatusOk),
    cliTask('ci surface text', ['ci', '--text'], expectTextIncludes(['agent-onboard CI surface', 'CI is authority: false', 'no GitHub API'])),
    cliTask('ci github action', ['ci', '--github-action'], expectTextIncludes(['name: Agent Onboard', 'actions/checkout@v4', 'check --fast --json'])),
    cliTask('mcp bridge plan json', ['mcp', '--json'], expectStatusOk),
    cliTask('mcp bridge plan text', ['mcp', '--text'], expectTextIncludes(['agent-onboard MCP bridge plan', 'server implemented now: false', 'agent_onboard_get_discovery'])),
    cliTask('target repair plan', ['target', 'repair', '--plan'], expectStatusOk),
    cliTask('work-items schema through runtime service', ['work-items', '--schema'], expectStatusOk),
    cliTask('work-items template through runtime service', ['work-items', '--template'], expectStatusOk),
    cliTask('work-items validate-template through runtime service', ['work-items', '--validate-template'], expectStatusOk),
    cliTask('work-items list through runtime service', ['work-items', '--list', '.agent-onboard/work-items.json'], expectStatusOk),
    cliTask('work-items summary view through runtime service', ['work-items', '--summary', '.agent-onboard/work-items.json'], expectStatusOk),
    cliTask('work-items summary text view through runtime service', ['work-items', '--summary', '.agent-onboard/work-items.json', '--text'], expectTextIncludes(['agent-onboard work-items summary', 'Items:'])),
    cliTask('work-items next view through runtime service', ['work-items', '--next', '.agent-onboard/work-items.json'], expectStatusOk),
    cliTask('work-items next text view through runtime service', ['work-items', '--next', '.agent-onboard/work-items.json', '--text'], expectTextIncludes(['agent-onboard next work item', 'Claim dry-run:'])),
    cliTask('work-items mine view through runtime service', ['work-items', '--mine', '.agent-onboard/work-items.json', '--actor', 'codex-gpt-5'], expectStatusOk),
    cliTask('work-items mine text view through runtime service', ['work-items', '--mine', '.agent-onboard/work-items.json', '--actor', 'codex-gpt-5', '--text'], expectTextIncludes(['agent-onboard work items for codex-gpt-5', 'Claimed:'])),
    cliTask('work-items validate', ['work-items', '--validate', '.agent-onboard/work-items.json'], expectStatusOk),
    cliTask('claim ledger validate', ['claim', '--validate-ledger', '--json'], expectStatusOk),
    cliTask('claim ledger validate text', ['claim', '--validate-ledger', '--text'], expectTextIncludes(['agent-onboard claim ledger validation', 'Writes performed: false'])),
    cliTask('claim lifecycle check', ['claim', '--lifecycle-check', '--json'], expectStatusOk),
    cliTask('claim lifecycle check text', ['claim', '--lifecycle-check', '--text'], expectTextIncludes(['agent-onboard claim lifecycle check', 'Writes performed: false'])),
    cliTask('claim ledger append dry-run', ['claim', '--append', '--dry-run', '--work-item-id', APPEND_SMOKE_WORK_ITEM_ID, '--actor', 'test-runner', '--event-type', 'claim_proposed', '--claim-id', 'quick-smoke-claim', '--created-at', '2026-07-06T00:00:00.000Z'], expectStatusOk),
    cliTask('work-items init dry-run through runtime service', ['work-items', '--init', '--dry-run', '--force'], expectStatusOk),
    cliTask('work-items append dry-run through runtime service', ['work-items', '--append', '--dry-run', '--id', APPEND_SMOKE_WORK_ITEM_ID, '--title', 'Runtime append dry-run smoke'], expectStatusOk),
    nodeTask('closed gate state layout check', [path.join(ROOT, 'scripts', 'check-closed-gate-state-layout.js')], expectStatusOk),
    nodeTask('source size budget ratchet check', [path.join(ROOT, 'scripts', 'check-source-size-budget-ratchet.js')], expectStatusOk),
    nodeTask('runtime command registry extraction check', [path.join(ROOT, 'scripts', 'check-runtime-command-registry-extraction.js')], expectStatusOk),
    nodeTask('release clean closed gates runtime slice extraction check', [path.join(ROOT, 'scripts', 'check-release-clean-closed-gates-runtime-slice-extraction.js')], expectStatusOk),
    nodeTask('architecture catalog sharding check', [path.join(ROOT, 'scripts', 'check-architecture-catalog-sharding.js')], expectStatusOk),
    nodeTask('work-items service split check', [path.join(ROOT, 'scripts', 'check-work-items-service-split.js')], expectStatusOk),
    nodeTask('target governance service split check', [path.join(ROOT, 'scripts', 'check-target-governance-service-split.js')], expectStatusOk),
    nodeTask('test suite sharding check', [path.join(ROOT, 'scripts', 'check-test-suite-sharding.js')], expectStatusOk),
    nodeTask('state projection authority cutover check', [path.join(ROOT, 'scripts', 'check-state-projection-authority-cutover.js')], expectStatusOk),
    nodeTask('public artifact boundary check', [path.join(ROOT, 'scripts', 'check-public-artifact-boundary.js')], expectStatusOk),
    npmTask('npm pack dry run', ['pack', '--dry-run', '--json'], expectPackFiles)
  ];
}

function discoverFullSourceTests() {
  const result = spawnSync(process.execPath, [FULL_SOURCE_TEST, '--list'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT_BYTES,
    timeout: DEFAULT_TASK_TIMEOUT_MS
  });
  if (result.status !== 0) {
    throw new Error(`full source test list failed: ${result.stderr || result.stdout || result.error && result.error.message || result.status}`);
  }
  const listed = parseJson(result.stdout, 'full source test list');
  if (!Array.isArray(listed)) throw new Error('full source test list did not return an array');
  return listed;
}

function fullTasks(shards) {
  const timeoutMs = Number.parseInt(process.env.AGENT_ONBOARD_FULL_TEST_TASK_TIMEOUT_MS || '', 10) || DEFAULT_FULL_SOURCE_TEST_TASK_TIMEOUT_MS;
  if (process.env.AGENT_ONBOARD_FULL_TEST_CASE_MODE === '1') {
    return discoverFullSourceTests().map((test) => (
      nodeTask(`full source test index ${test.index}`, [FULL_SOURCE_TEST, `--only-index=${test.index}`], null, { timeoutMs, captureOutput: false, cleanupTemp: true })
    ));
  }
  return Array.from({ length: shards }, (_, index) => (
    nodeTask(`full source test shard ${index}/${shards}`, [FULL_SOURCE_TEST, `--shard=${index}/${shards}`], null, { timeoutMs, captureOutput: false, cleanupTemp: true })
  ));
}

function testConcurrency(defaultValue = DEFAULT_CONCURRENCY) {
  return Number.parseInt(process.env.AGENT_ONBOARD_TEST_CONCURRENCY || '', 10) || defaultValue;
}

async function runQuick() {
  const startedAt = Date.now();
  const concurrency = testConcurrency();
  const tasks = quickTasks();
  process.stdout.write(`agent-onboard quick test suite: ${tasks.length} checks, concurrency ${Math.min(concurrency, tasks.length)}\n`);
  const results = await runPool(tasks, concurrency);
  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    for (const result of failed) {
      process.stderr.write(`\n[fail] ${result.task.name}\n`);
      process.stderr.write(`command: ${commandForDisplay(result.task)}\n`);
      process.stderr.write(`error: ${result.error}\n`);
      const stdout = trimOutput(result.stdout);
      const stderr = trimOutput(result.stderr);
      if (stdout) process.stderr.write(`stdout:\n${stdout}\n`);
      if (stderr) process.stderr.write(`stderr:\n${stderr}\n`);
    }
    process.exitCode = 1;
    return;
  }
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(`agent-onboard quick test suite passed in ${seconds}s\n`);
}

async function runSuite(label, tasks, concurrency) {
  const startedAt = Date.now();
  process.stdout.write(`agent-onboard ${label} test suite: ${tasks.length} checks, concurrency ${Math.min(concurrency, tasks.length)}\n`);
  const results = await runPool(tasks, concurrency);
  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    for (const result of failed) {
      process.stderr.write(`\n[fail] ${result.task.name}\n`);
      process.stderr.write(`command: ${commandForDisplay(result.task)}\n`);
      process.stderr.write(`error: ${result.error}\n`);
      const stdout = trimOutput(result.stdout);
      const stderr = trimOutput(result.stderr);
      if (stdout) process.stderr.write(`stdout:\n${stdout}\n`);
      if (stderr) process.stderr.write(`stderr:\n${stderr}\n`);
    }
    process.exitCode = 1;
    return false;
  }
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(`agent-onboard ${label} test suite passed in ${seconds}s\n`);
  return true;
}

function runFullTaskSync(task) {
  const startedAt = Date.now();
  if (task.cleanupTemp) cleanupFullSourceTempDirs();
  const timeoutMs = Number.isInteger(task.timeoutMs) && task.timeoutMs > 0 ? task.timeoutMs : DEFAULT_FULL_SOURCE_TEST_TASK_TIMEOUT_MS;
  const result = spawnSync(task.command, task.args, {
    cwd: ROOT,
    windowsHide: true,
    stdio: task.captureOutput === false ? 'ignore' : 'pipe',
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT_BYTES,
    timeout: timeoutMs
  });
  const durationMs = Date.now() - startedAt;
  if (task.cleanupTemp) cleanupFullSourceTempDirs();
  if (result.error) {
    const timedOut = result.error.code === 'ETIMEDOUT';
    return Object.assign({}, result, { task, ok: false, durationMs, errorMessage: timedOut ? `task timeout after ${timeoutMs}ms` : result.error.message });
  }
  if (result.status !== 0) {
    return Object.assign({}, result, { task, ok: false, durationMs, errorMessage: result.signal ? `terminated by ${result.signal}` : `exited with ${result.status}` });
  }
  try {
    if (task.validate) task.validate(result.stdout || '', task.name);
    return Object.assign({}, result, { task, ok: true, durationMs });
  } catch (error) {
    return Object.assign({}, result, { task, ok: false, durationMs, errorMessage: error.message });
  }
}

function runFullSuiteSync(tasks, concurrency) {
  const startedAt = Date.now();
  process.stdout.write(`agent-onboard full test suite: ${tasks.length} checks, concurrency ${Math.min(concurrency, tasks.length)}\n`);
  const failed = [];
  for (const task of tasks) {
    const result = runFullTaskSync(task);
    const seconds = (result.durationMs / 1000).toFixed(1);
    const marker = result.ok ? 'pass' : 'fail';
    process.stdout.write(`[${marker}] ${task.name} (${seconds}s)\n`);
    if (!result.ok) failed.push(result);
  }
  if (failed.length > 0) {
    for (const result of failed) {
      process.stderr.write(`\n[fail] ${result.task.name}\n`);
      process.stderr.write(`command: ${commandForDisplay(result.task)}\n`);
      process.stderr.write(`error: ${result.errorMessage}\n`);
      const stdout = trimOutput(result.stdout || '');
      const stderr = trimOutput(result.stderr || '');
      if (stdout) process.stderr.write(`stdout:\n${stdout}\n`);
      if (stderr) process.stderr.write(`stderr:\n${stderr}\n`);
    }
    process.exitCode = 1;
    return false;
  }
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(`agent-onboard full test suite passed in ${seconds}s\n`);
  return true;
}

async function runFull() {
  cleanupFullSourceTempDirs();
  const concurrency = testConcurrency(DEFAULT_FULL_CONCURRENCY);
  const shardCount = Number.parseInt(process.env.AGENT_ONBOARD_FULL_TEST_SHARDS || '', 10) || DEFAULT_FULL_SOURCE_TEST_SHARDS;
  const tasks = fullTasks(Math.max(1, shardCount));
  try {
    await runSuite('full', tasks, concurrency);
  } finally {
    cleanupFullSourceTempDirs();
  }
}

async function main() {
  const suite = process.argv[2] || 'quick';
  if (suite === 'quick') {
    await runQuick();
    return;
  }
  if (suite === 'full') {
    await runFull();
    return;
  }
  if (suite === 'all') {
    await runQuick();
    if (process.exitCode) return;
    await runFull();
    return;
  }
  process.stderr.write('usage: node test/run-tests.js [quick|full|all]\n');
  process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
