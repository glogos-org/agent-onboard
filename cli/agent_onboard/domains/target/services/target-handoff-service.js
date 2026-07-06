'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'agent-onboard';
const TARGET_HANDOFF_SCHEMA = 'agent-onboard-public-target-handoff-preview-001';
const TARGET_HANDOFF_COMMAND = 'agent-onboard target handoff --preview';
const TARGET_HANDOFF_FAMILY = 'target handoff';

const ROOT_MANIFEST_CANDIDATES = Object.freeze([
  Object.freeze({ path: 'package.json', ecosystem: 'node-npm' }),
  Object.freeze({ path: 'Cargo.toml', ecosystem: 'rust-cargo' }),
  Object.freeze({ path: 'pyproject.toml', ecosystem: 'python' }),
  Object.freeze({ path: 'go.mod', ecosystem: 'go' }),
  Object.freeze({ path: 'pom.xml', ecosystem: 'jvm-maven' }),
  Object.freeze({ path: 'build.gradle', ecosystem: 'jvm-gradle' }),
  Object.freeze({ path: 'deno.json', ecosystem: 'deno' })
]);

const HANDOFF_SURFACE_CANDIDATES = Object.freeze([
  Object.freeze({ path: 'AGENTS.md', role: 'agent_instructions', authority: 'target_owned' }),
  Object.freeze({ path: 'llms.txt', role: 'ai_discovery_entrypoint', authority: 'target_owned' }),
  Object.freeze({ path: 'README.md', role: 'human_readme', authority: 'target_owned' }),
  Object.freeze({ path: 'SOURCE_OF_TRUTH.md', role: 'source_of_truth', authority: 'target_owned' }),
  Object.freeze({ path: 'manifest.json', role: 'metadata_manifest', authority: 'target_owned' }),
  Object.freeze({ path: 'authority-map.json', role: 'authority_map', authority: 'target_owned' }),
  Object.freeze({ path: '.repo-identifier', role: 'repo_identifier', authority: 'target_owned' }),
  Object.freeze({ path: '.agent-onboard/target.json', role: 'target_boundary_config', authority: 'agent_onboard_runtime_state' }),
  Object.freeze({ path: '.agent-onboard/project.json', role: 'target_project_descriptor', authority: 'agent_onboard_runtime_state' }),
  Object.freeze({ path: '.agent-onboard/work-items.json', role: 'target_work_item_ledger', authority: 'agent_onboard_runtime_state' }),
  Object.freeze({ path: '.agent-onboard/authority-path.json', role: 'first_read_authority_index', authority: 'agent_onboard_runtime_state' }),
  Object.freeze({ path: '.github/copilot-instructions.md', role: 'agent_instructions', authority: 'target_owned' })
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (_) { return null; }
}

function rootManifest(root) {
  const seen = ROOT_MANIFEST_CANDIDATES.filter((candidate) => fs.existsSync(path.join(root, candidate.path)));
  const primary = seen[0] || null;
  return {
    primary_manifest: primary ? primary.path : null,
    ecosystem: primary ? primary.ecosystem : 'unknown',
    manifests_seen: seen.map((candidate) => candidate.path)
  };
}

function targetName(root, manifest) {
  const packageJson = safeReadJson(path.join(root, 'package.json'));
  if (isPlainObject(packageJson) && typeof packageJson.name === 'string' && packageJson.name.trim()) return packageJson.name.trim();
  if (manifest.primary_manifest === 'Cargo.toml') {
    try {
      const cargoText = fs.readFileSync(path.join(root, 'Cargo.toml'), 'utf8');
      const match = cargoText.match(/^name\s*=\s*["']([^"']+)["']/m);
      if (match) return match[1];
    } catch (_) {}
  }
  return path.basename(root) || 'target-repo';
}

function surfaceEntry(root, candidate) {
  const absolute = path.join(root, candidate.path);
  const present = fs.existsSync(absolute);
  let kind = 'missing';
  let bytes = 0;
  if (present) {
    const stat = fs.statSync(absolute);
    kind = stat.isDirectory() ? 'directory' : 'file';
    bytes = stat.isFile() ? stat.size : 0;
  }
  return Object.freeze({
    path: candidate.path,
    role: candidate.role,
    authority: candidate.authority,
    present,
    kind,
    bytes,
    content_imported: false
  });
}

function targetHandoffSurfaces(root) {
  const surfaces = HANDOFF_SURFACE_CANDIDATES.map((candidate) => surfaceEntry(root, candidate));
  return {
    surfaces,
    present_paths: surfaces.filter((entry) => entry.present).map((entry) => entry.path),
    missing_paths: surfaces.filter((entry) => !entry.present).map((entry) => entry.path),
    present_count: surfaces.filter((entry) => entry.present).length,
    file_contents_inlined: false
  };
}

function inventorySummary(inventory) {
  if (!inventory || inventory.status !== 'ok') {
    return Object.freeze({ status: inventory && inventory.status ? inventory.status : 'unavailable', files_seen: 0, source_roots: [], script_names: [], ci_command_count: 0, readme_usage_command_count: 0, provenance_surface_count: 0 });
  }
  const inv = inventory.inventory || {};
  const source = inv.source_surface || {};
  const pkg = inv.package_surface || {};
  const summary = inventory.summary || {};
  return Object.freeze({
    status: inventory.status,
    files_seen: summary.files_seen || 0,
    source_roots: Array.isArray(source.source_roots) ? source.source_roots.map((entry) => ({ path: entry.path, role: entry.role, file_count: entry.file_count })) : [],
    package_manager: pkg.package_manager || 'unknown',
    script_names: Array.isArray(pkg.script_names) ? pkg.script_names.slice() : [],
    ci_command_count: summary.ci_command_count || 0,
    readme_usage_command_count: summary.readme_usage_command_count || 0,
    provenance_surface_count: summary.provenance_surface_count || 0,
    truncated: Boolean(summary.truncated)
  });
}

function workItemsSummary(workItems) {
  if (!workItems || workItems.status !== 'ok') {
    return Object.freeze({ status: workItems && workItems.status ? workItems.status : 'unavailable', present: false, total_work_items: 0, open_work_item: null, next_admission_candidate: null, next_action_state: 'unavailable' });
  }
  const summary = workItems.summary || {};
  return Object.freeze({
    status: workItems.status,
    present: Boolean(workItems.work_items_file && workItems.work_items_file.present),
    total_work_items: summary.total_work_items || 0,
    status_counts: summary.status_counts || {},
    open_work_item: summary.open_work_item || null,
    last_closed_work_item: summary.last_closed_work_item || null,
    admission_queue_count: summary.admission_queue_count || 0,
    next_admission_candidate: summary.next_admission_candidate || null,
    next_action_state: summary.next_action_state || 'unknown'
  });
}

function governanceSummary(governance) {
  if (!governance || governance.status !== 'ok') {
    return Object.freeze({ status: governance && governance.status ? governance.status : 'unavailable', compact_first_read_available: false, work_items_index_present: false, claims_index_present: false, active_work_item_ids: [], claim_count: 0, warnings: [] });
  }
  const payload = governance.governance || {};
  const workIndex = payload.work_items_index || {};
  const claimsIndex = payload.claims_index || {};
  const readiness = payload.readiness || {};
  return Object.freeze({
    status: governance.status,
    readiness_status: readiness.status || 'unknown',
    compact_first_read_available: Boolean(readiness.compact_first_read_available),
    derived_preview_available: Boolean(readiness.derived_preview_available),
    work_items_index_present: Boolean(workIndex.present),
    work_items_index_source: workIndex.source || 'unavailable',
    claims_index_present: Boolean(claimsIndex.present),
    claims_index_source: claimsIndex.source || 'unavailable',
    active_work_item_ids: Array.isArray(workIndex.active_work_item_ids) ? workIndex.active_work_item_ids.slice() : [],
    claim_count: claimsIndex.claim_count || 0,
    warnings: Array.isArray(readiness.warnings) ? readiness.warnings.slice() : []
  });
}

function readinessFromSummaries(surfaceSummary, inventory, workItems) {
  const blockers = [];
  const warnings = [];
  if (!surfaceSummary.present_paths.includes('AGENTS.md') && !surfaceSummary.present_paths.includes('llms.txt')) warnings.push('no_target_agent_entrypoint_detected');
  if (!surfaceSummary.present_paths.includes('.agent-onboard/work-items.json')) warnings.push('no_target_work_items_file_detected');
  if (inventory.status !== 'ok') blockers.push('target_inventory_unavailable');
  if (workItems.status !== 'ok') blockers.push('target_work_items_preview_unavailable');
  if (workItems.open_work_item) warnings.push('open_target_work_item_should_be_continued_before_new_admission');
  return {
    status: blockers.length > 0 ? 'blocked' : (warnings.length > 0 ? 'usable_with_warnings' : 'ready'),
    blockers,
    warnings,
    next_agent_ready: blockers.length === 0,
    authority_note: 'Use target-owned files and explicit owner instructions as authority; this preview is non-authoritative evidence only.'
  };
}

function targetHandoffPreview(targetRoot = process.cwd(), deps = {}) {
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const version = deps.version;
  const releaseLine = deps.releaseLine;
  if (!fs.existsSync(absoluteTargetRoot)) {
    return Object.freeze({
      schema: TARGET_HANDOFF_SCHEMA,
      status: 'error',
      package_name: PACKAGE_NAME,
      version,
      release_line: releaseLine,
      command: TARGET_HANDOFF_COMMAND,
      command_family: TARGET_HANDOFF_FAMILY,
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'missing', primary_manifest: null, ecosystem: 'unknown' },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: noMutationBoundary()
    });
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return Object.freeze({
      schema: TARGET_HANDOFF_SCHEMA,
      status: 'error',
      package_name: PACKAGE_NAME,
      version,
      release_line: releaseLine,
      command: TARGET_HANDOFF_COMMAND,
      command_family: TARGET_HANDOFF_FAMILY,
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', root: absoluteTargetRoot, kind: 'file', primary_manifest: null, ecosystem: 'unknown' },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: noMutationBoundary()
    });
  }

  const manifest = rootManifest(absoluteTargetRoot);
  const inventory = typeof deps.targetInventory === 'function'
    ? deps.targetInventory(absoluteTargetRoot)
    : { status: 'unavailable' };
  const workItems = typeof deps.targetWorkItemsPreview === 'function'
    ? deps.targetWorkItemsPreview(absoluteTargetRoot)
    : { status: 'unavailable' };
  const governance = typeof deps.targetGovernancePreview === 'function'
    ? deps.targetGovernancePreview(absoluteTargetRoot)
    : { status: 'unavailable' };
  const surfaces = targetHandoffSurfaces(absoluteTargetRoot);
  const inventoryCompact = inventorySummary(inventory);
  const workItemsCompact = workItemsSummary(workItems);
  const governanceCompact = governanceSummary(governance);
  const readiness = readinessFromSummaries(surfaces, inventoryCompact, workItemsCompact);

  return Object.freeze({
    schema: TARGET_HANDOFF_SCHEMA,
    status: 'ok',
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_HANDOFF_COMMAND,
    command_family: TARGET_HANDOFF_FAMILY,
    target: {
      name: targetName(absoluteTargetRoot, manifest),
      root: absoluteTargetRoot,
      kind: manifest.ecosystem === 'unknown' ? 'generic' : manifest.ecosystem,
      primary_manifest: manifest.primary_manifest,
      manifests_seen: manifest.manifests_seen,
      ecosystem: manifest.ecosystem
    },
    handoff: {
      purpose: 'compact read-only handoff preview for the next human or agent session before target mutation',
      inventory_summary: inventoryCompact,
      work_items_summary: workItemsCompact,
      governance_summary: governanceCompact,
      memory_surface_summary: surfaces,
      readiness,
      recommended_next_commands: [
        'agent-onboard target doctor --text',
        'agent-onboard target inventory --text',
        'agent-onboard target memory --text',
        'agent-onboard target governance --text',
        'agent-onboard target work-items --text',
        'agent-onboard check --fast --text'
      ],
      prohibited_next_actions_without_owner_authorization: [
        'write target repository state',
        'admit or close work items',
        'install dependencies',
        'run managed-project build/test/deploy commands',
        'mutate Git state',
        'publish packages or use network APIs'
      ]
    },
    output_policy: {
      compact_default: true,
      file_contents_inlined: false,
      target_ai_memory_content_inlined: false,
      source_evidence_inlined: false,
      provider_private_state_inlined: false
    },
    writes_performed: false,
    boundary: noMutationBoundary(),
    errors: []
  });
}

function noMutationBoundary() {
  return Object.freeze({
    writes_files: false,
    writes_target_repository_state: false,
    creates_agent_onboard_runtime_state: false,
    scans_target_repository: true,
    bounded_to_repo_metadata_inventory_and_known_handoff_surfaces: true,
    reads_file_contents_for_command_detection: true,
    inlines_file_contents: false,
    admits_or_closes_work_items: false,
    installs_dependencies: false,
    runs_build_test_deploy: false,
    runs_managed_project_commands: false,
    publishes_package: false,
    network: false,
    git_mutation: false
  });
}

function targetHandoffPreviewText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target handoff',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const inventory = result.handoff.inventory_summary;
  const workItems = result.handoff.work_items_summary;
  const memory = result.handoff.memory_surface_summary;
  const governance = result.handoff.governance_summary || {};
  const roots = inventory.source_roots.map((entry) => `${entry.path}(${entry.role}:${entry.file_count})`).join(', ') || 'none';
  const present = memory.present_paths.length > 0 ? memory.present_paths.join(', ') : 'none';
  const open = workItems.open_work_item ? `${workItems.open_work_item.id} — ${workItems.open_work_item.title || 'untitled'}` : 'none';
  const next = workItems.next_admission_candidate ? `${workItems.next_admission_candidate.id} — ${workItems.next_admission_candidate.title || 'untitled'}` : 'none';
  return [
    'agent-onboard target handoff',
    `Target: ${result.target.name} (${result.target.ecosystem})`,
    `Root: ${result.target.root}`,
    `Readiness: ${result.handoff.readiness.status}`,
    `Files seen: ${inventory.files_seen}`,
    `Source roots: ${roots}`,
    `Scripts: ${inventory.script_names.length > 0 ? inventory.script_names.join(', ') : 'none'}`,
    `Memory/handoff surfaces: ${present}`,
    `Governance indexes: work-items ${governance.work_items_index_present ? 'present' : (governance.work_items_index_source || 'unavailable')}, claims ${governance.claims_index_present ? 'present' : (governance.claims_index_source || 'unavailable')}`,
    `Work-items present: ${workItems.present}`,
    `Open item: ${open}`,
    `Next queued candidate: ${next}`,
    `Warnings: ${result.handoff.readiness.warnings.length > 0 ? result.handoff.readiness.warnings.join(', ') : 'none'}`,
    'Boundary: read-only handoff preview; no file content import, no work-item admission or closure, no dependency install, no managed-project command execution, no Git mutation, no network, no writes.',
    'Next commands:',
    ...result.handoff.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

function createTargetHandoffService(deps = {}) {
  const releaseLine = deps.publicReleaseContract && deps.publicReleaseContract.release_line ? deps.publicReleaseContract.release_line : deps.releaseLine;
  return Object.freeze({
    targetHandoffPreview: (targetRoot) => targetHandoffPreview(targetRoot, {
      version: deps.version,
      releaseLine,
      targetInventory: deps.targetInventory,
      targetWorkItemsPreview: deps.targetWorkItemsPreview,
      targetGovernancePreview: deps.targetGovernancePreview
    }),
    formatTargetHandoffPreviewText: targetHandoffPreviewText,
    targetHandoffSurfaces
  });
}

module.exports = {
  createTargetHandoffService,
  targetHandoffPreview,
  targetHandoffPreviewText,
  targetHandoffSurfaces
};
