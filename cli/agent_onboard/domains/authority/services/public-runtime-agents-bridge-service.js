'use strict';

const BRIDGE_MARKER_START = '<!-- agent-onboard:bridge:start -->';
const BRIDGE_MARKER_END = '<!-- agent-onboard:bridge:end -->';

function defaultJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let index = 0;
  while ((index = text.indexOf(needle, index)) !== -1) {
    count += 1;
    index += needle.length;
  }
  return count;
}

function createPublicRuntimeAgentsBridgeService(options = Object.freeze({})) {
  const fs = options.fs;
  const path = options.path;
  if (!fs || !path) throw new Error('public runtime AGENTS bridge service requires fs and path ports');

  const PACKAGE_NAME = options.PACKAGE_NAME || 'agent-onboard';
  const VERSION = options.VERSION || '0.0.0';
  const RELEASE_LINE = options.RELEASE_LINE || 'unknown_release_line';
  const OUTPUT_FLAG = options.OUTPUT_FLAG || Object.freeze({ json: '--json', text: '--text' });
  const cwd = typeof options.cwd === 'function' ? options.cwd : (() => '.');
  const json = typeof options.json === 'function' ? options.json : ((value) => options.writeText ? options.writeText(defaultJson(value)) : undefined);
  const writeText = typeof options.writeText === 'function' ? options.writeText : (() => undefined);
  const agentsMdTemplate = typeof options.agentsMdTemplate === 'function' ? options.agentsMdTemplate : (() => '');
  const planTextWrites = typeof options.planTextWrites === 'function' ? options.planTextWrites : (() => []);
  const performPlannedTextWrites = typeof options.performPlannedTextWrites === 'function' ? options.performPlannedTextWrites : (() => undefined);
  const summarizePlan = typeof options.summarizePlan === 'function' ? options.summarizePlan : ((plan) => plan);

  function bridgeMarkerBlock(version = VERSION) {
    return [
      BRIDGE_MARKER_START,
      '## Agent-Onboard bridge',
      '',
      'This marker block is a bounded discovery bridge for repositories that use `agent-onboard`. It does not grant write authority, does not admit work items, and does not replace this repository\'s own instructions.',
      '',
      'Agent-onboard bridge order:',
      '',
      '1. If `node_modules/agent-onboard/` exists, read `node_modules/agent-onboard/AGENTS.md` and `node_modules/agent-onboard/llms.txt` before running installed package commands.',
      '2. If `node_modules/agent-onboard/` is missing, do not read `node_modules/` and do not install or fetch packages solely for this bridge. Use the checked-in `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `.agent-onboard/authority-path.json`, `.agent-onboard/authority-index.json`, and `.agent-onboard/work-items.json` when present.',
      '3. Prefer `agent-onboard status` from an installed package, or a repository-owner specified package coordinate, only when package execution is admitted.',
      '4. Follow installed package governance when available; otherwise follow checked-in governance until install or update is explicitly admitted.',
      '',
      'Forbidden by default unless the repository owner explicitly authorizes the action:',
      '',
      '- mutating source files outside the requested scope;',
      '- mutating Git state;',
      '- installing, removing, or upgrading dependencies;',
      '- running managed project build, test, deploy, publish, or release commands;',
      '- treating this bridge block as proof that runtime enforcement already exists.',
      '',
      BRIDGE_MARKER_END,
      ''
    ].join('\n');
  }

  function bridgeBlockValidation(text) {
    const value = String(text || '');
    const startCount = countOccurrences(value, BRIDGE_MARKER_START);
    const endCount = countOccurrences(value, BRIDGE_MARKER_END);
    const startIndex = value.indexOf(BRIDGE_MARKER_START);
    const endIndex = value.indexOf(BRIDGE_MARKER_END);
    const errors = [];
    if (startCount === 0 || endCount === 0) errors.push('bridge marker block is missing');
    if (startCount > 1) errors.push('bridge marker start appears more than once');
    if (endCount > 1) errors.push('bridge marker end appears more than once');
    if (startIndex >= 0 && endIndex >= 0 && startIndex > endIndex) errors.push('bridge marker start must appear before bridge marker end');
    const required = [
      'Agent-onboard bridge order:',
      'node_modules/agent-onboard/AGENTS.md',
      'node_modules/agent-onboard/llms.txt',
      'If `node_modules/agent-onboard/` is missing',
      'do not install or fetch packages solely for this bridge',
      'Forbidden by default',
      'does not grant write authority',
      'does not admit work items'
    ];
    for (const snippet of required) {
      if (!value.includes(snippet)) errors.push(`bridge marker block missing required text: ${snippet}`);
    }
    return {
      present: startCount === 1 && endCount === 1 && startIndex >= 0 && endIndex > startIndex,
      start_count: startCount,
      end_count: endCount,
      valid: errors.length === 0,
      errors
    };
  }

  function applyBridgeMarkerBlock(existingText, block) {
    const current = String(existingText || '');
    const validation = bridgeBlockValidation(current);
    const hasAnyMarker = validation.start_count > 0 || validation.end_count > 0;
    if (hasAnyMarker && !validation.present) {
      return {
        status: 'error',
        action: 'blocked_malformed_marker_block',
        content: current,
        errors: validation.errors
      };
    }
    if (validation.present) {
      const start = current.indexOf(BRIDGE_MARKER_START);
      const end = current.indexOf(BRIDGE_MARKER_END) + BRIDGE_MARKER_END.length;
      const before = current.slice(0, start).replace(/\s*$/u, '');
      const after = current.slice(end).replace(/^\s*/u, '');
      const next = `${before}${before ? '\n\n' : ''}${block}${after ? '\n' + after : ''}`;
      return {
        status: 'ok',
        action: next === current ? 'keep' : 'replace_marker_block',
        content: next,
        errors: []
      };
    }
    const trimmed = current.replace(/\s*$/u, '');
    const next = `${trimmed}${trimmed ? '\n\n' : ''}${block}`;
    return {
      status: 'ok',
      action: current.length > 0 ? 'append_marker_block' : 'create_agents_with_marker_block',
      content: next,
      errors: []
    };
  }

  function bridgeTargetRoot(args = []) {
    const targetIndex = args.indexOf('--target');
    if (targetIndex < 0) return { root: cwd(), targetIndex };
    const target = args[targetIndex + 1];
    if (!target || target.startsWith('-')) return { error: 'bridge --target requires a path' };
    return { root: path.resolve(cwd(), target), targetIndex };
  }

  function bridgeBoundary(writeMode) {
    return {
      writes_files: writeMode,
      writes_target_repository_state: writeMode,
      writes_only: writeMode ? ['AGENTS.md marker block'] : [],
      replaces_entire_agents_md: false,
      marker_block_idempotent: true,
      installs_dependencies: false,
      runs_package_manager: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      mutates_registry: false,
      network: false,
      git_mutation: false
    };
  }

  function bridgePlan(root = cwd()) {
    const targetRoot = path.resolve(root);
    const agentsPath = path.join(targetRoot, 'AGENTS.md');
    const block = bridgeMarkerBlock();
    if (!fs.existsSync(targetRoot)) {
      return {
        schema: 'agent-onboard-public-agents-bridge-plan-001',
        status: 'error',
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: RELEASE_LINE,
        command: 'agent-onboard bridge --dry-run',
        target_root: targetRoot,
        canonical_file: 'AGENTS.md',
        mode: 'dry-run',
        writes_performed: false,
        planned_writes: [],
        bridge_block: block,
        validation: { present: false, valid: false, errors: [`target path does not exist: ${targetRoot}`] },
        errors: [`target path does not exist: ${targetRoot}`],
        boundary: bridgeBoundary(false)
      };
    }
    if (!fs.statSync(targetRoot).isDirectory()) {
      return {
        schema: 'agent-onboard-public-agents-bridge-plan-001',
        status: 'error',
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: RELEASE_LINE,
        command: 'agent-onboard bridge --dry-run',
        target_root: targetRoot,
        canonical_file: 'AGENTS.md',
        mode: 'dry-run',
        writes_performed: false,
        planned_writes: [],
        bridge_block: block,
        validation: { present: false, valid: false, errors: [`target path is not a directory: ${targetRoot}`] },
        errors: [`target path is not a directory: ${targetRoot}`],
        boundary: bridgeBoundary(false)
      };
    }
    const exists = fs.existsSync(agentsPath);
    const current = exists ? fs.readFileSync(agentsPath, 'utf8') : '';
    const apply = applyBridgeMarkerBlock(current, block);
    const currentValidation = bridgeBlockValidation(current);
    const nextValidation = bridgeBlockValidation(apply.content);
    const safe = apply.status === 'ok' && nextValidation.valid;
    return {
      schema: 'agent-onboard-public-agents-bridge-plan-001',
      status: safe ? 'ok' : 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: 'agent-onboard bridge --dry-run',
      target_root: targetRoot,
      canonical_file: 'AGENTS.md',
      mode: 'dry-run',
      marker_start: BRIDGE_MARKER_START,
      marker_end: BRIDGE_MARKER_END,
      writes_performed: false,
      planned_writes: [{
        path: 'AGENTS.md',
        exists,
        action: apply.action,
        safe_to_write: safe,
        preserves_existing_content: exists,
        marker_block_only: true
      }],
      bridge_block: block,
      current_validation: currentValidation,
      validation: nextValidation,
      errors: [...apply.errors, ...nextValidation.errors],
      boundary: bridgeBoundary(false)
    };
  }

  function bridgeCheck(root = cwd()) {
    const targetRoot = path.resolve(root);
    const agentsPath = path.join(targetRoot, 'AGENTS.md');
    const exists = fs.existsSync(agentsPath);
    const validation = exists ? bridgeBlockValidation(fs.readFileSync(agentsPath, 'utf8')) : {
      present: false,
      start_count: 0,
      end_count: 0,
      valid: false,
      errors: ['AGENTS.md is missing']
    };
    return {
      schema: 'agent-onboard-public-agents-bridge-check-001',
      status: exists && validation.valid ? 'ok' : 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: 'agent-onboard bridge --check',
      target_root: targetRoot,
      canonical_file: 'AGENTS.md',
      marker_start: BRIDGE_MARKER_START,
      marker_end: BRIDGE_MARKER_END,
      validation,
      writes_performed: false,
      boundary: bridgeBoundary(false),
      errors: validation.errors
    };
  }

  function bridgeWrite(root = cwd()) {
    const plan = bridgePlan(root);
    const ok = plan.status === 'ok';
    let written = false;
    if (ok) {
      const planned = plan.planned_writes[0];
      if (planned.action !== 'keep') {
        fs.mkdirSync(path.resolve(root), { recursive: true });
        fs.writeFileSync(path.join(path.resolve(root), 'AGENTS.md'), applyBridgeMarkerBlock(fs.existsSync(path.join(path.resolve(root), 'AGENTS.md')) ? fs.readFileSync(path.join(path.resolve(root), 'AGENTS.md'), 'utf8') : '', bridgeMarkerBlock()).content);
        written = true;
      }
    }
    return Object.assign({}, plan, {
      schema: 'agent-onboard-public-agents-bridge-write-001',
      status: ok ? 'ok' : 'error',
      command: 'agent-onboard bridge --write',
      mode: 'write',
      writes_performed: written,
      boundary: bridgeBoundary(true)
    });
  }

  function bridgeText(result) {
    const lines = [
      'agent-onboard AGENTS bridge',
      `Status: ${result.status}`,
      `Target: ${result.target_root}`,
      `File: ${result.canonical_file}`,
      `Mode: ${result.mode || (result.command || '').replace('agent-onboard bridge ', '')}`,
      `Writes performed: ${result.writes_performed === true}`
    ];
    if (Array.isArray(result.planned_writes) && result.planned_writes.length > 0) {
      lines.push('Planned writes:');
      for (const item of result.planned_writes) lines.push(`  - ${item.path}: ${item.action}`);
    }
    if (result.validation) lines.push(`Marker block valid: ${result.validation.valid === true}`);
    if (Array.isArray(result.errors) && result.errors.length > 0) {
      lines.push('Errors:');
      for (const error of result.errors) lines.push(`  - ${error}`);
    }
    lines.push('Boundary: marker block only; no dependency install, package-manager execution, Git mutation, network, build, test, deploy, publish, or registry mutation.');
    return `${lines.join('\n')}\n`;
  }

  function runBridge(args = []) {
    const allowed = new Set(['--dry-run', '--check', '--write', OUTPUT_FLAG.json, OUTPUT_FLAG.text, '--target']);
    const target = bridgeTargetRoot(args);
    if (target.error) {
      json({ schema: 'agent-onboard-public-agents-bridge-error-001', status: 'error', command_family: 'bridge', message: target.error, writes_files: false });
      return 1;
    }
    const unknown = args.filter((arg, index) => {
      if (target.targetIndex >= 0 && index === target.targetIndex + 1) return false;
      return !allowed.has(arg);
    });
    if (unknown.length > 0) {
      json({ schema: 'agent-onboard-public-agents-bridge-error-001', status: 'error', command_family: 'bridge', message: `bridge does not support: ${unknown.join(', ')}`, writes_files: false });
      return 1;
    }
    const modes = args.filter((arg) => ['--dry-run', '--check', '--write'].includes(arg));
    const outputs = args.filter((arg) => [OUTPUT_FLAG.json, OUTPUT_FLAG.text].includes(arg));
    if (modes.length > 1 || outputs.length > 1) {
      json({ schema: 'agent-onboard-public-agents-bridge-error-001', status: 'error', command_family: 'bridge', message: 'bridge accepts one primary mode and one output mode', writes_files: false });
      return 1;
    }
    const mode = modes[0] || '--dry-run';
    const outputMode = outputs[0] || OUTPUT_FLAG.json;
    const result = mode === '--check' ? bridgeCheck(target.root) : (mode === '--write' ? bridgeWrite(target.root) : bridgePlan(target.root));
    if (outputMode === OUTPUT_FLAG.text) writeText(bridgeText(result));
    else json(result);
    return result.status === 'ok' ? 0 : 1;
  }

  function runAgents(args = []) {
    const preview = args.includes('--preview');
    const write = args.includes('--write');
    const force = args.includes('--force');
    if (!preview && !write) throw new Error('agents requires --preview or --write');
    if (preview && write) throw new Error('agents accepts only one of --preview or --write');

    const content = agentsMdTemplate();
    const plannedWrites = planTextWrites([['AGENTS.md', content]], { force });
    const conflicts = plannedWrites.filter((item) => item.action === 'conflict');
    const ok = conflicts.length === 0;
    if (write && ok) performPlannedTextWrites(plannedWrites);

    json({
      schema: 'agent-onboard-agents-result-001',
      status: ok ? 'ok' : 'error',
      command_family: 'agents',
      canonical_file: 'AGENTS.md',
      mode: write ? 'write' : 'preview',
      force,
      writes_performed: write && ok,
      planned_writes: summarizePlan(plannedWrites),
      conflicts: conflicts.map((item) => item.path),
      agents_md: content,
      boundary: {
        installs_dependencies: false,
        runs_build_test_deploy: false,
        publishes_or_pushes: false,
        modifies_source_files: write,
        modifies_only_canonical_agents_file: write
      }
    });
    return ok ? 0 : 1;
  }

  return Object.freeze({
    schema: 'agent-onboard-public-runtime-agents-bridge-service-001',
    marker_start: BRIDGE_MARKER_START,
    marker_end: BRIDGE_MARKER_END,
    bridgeMarkerBlock,
    bridgeBlockValidation,
    applyBridgeMarkerBlock,
    bridgePlan,
    bridgeCheck,
    bridgeWrite,
    bridgeText,
    runBridge,
    runAgents
  });
}

module.exports = Object.freeze({
  BRIDGE_MARKER_START,
  BRIDGE_MARKER_END,
  createPublicRuntimeAgentsBridgeService
});
