'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createCleanCompactionRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, packageJsonProjectedPackFiles } = ctx;

const PUBLIC_CLEAN_COMPACTION_BASELINE = Object.freeze({
  schema: 'agent-onboard-public-clean-compaction-baseline-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  previous_milestone_id: 'P1S3M5',
  work_item_id: ['P1S3M6', 'W1'].join(''),
  title: 'Public clean and compaction baseline gate',
  command: 'agent-onboard release --clean-inventory',
  check_command: 'agent-onboard release --clean-check',
  baseline_file: '.agent-onboard/public-clean-compaction-baseline-gate.json',
  purpose: 'Seed the public clean and compaction milestone with a read-only source surface inventory and bounded compaction baseline before deleting or moving any source files.',
  budgets: Object.freeze({
    max_source_files: 263,
    max_agent_onboard_files: 114,
    max_agent_onboard_gate_artifacts: 95,
    max_projected_pack_files: 92,
    max_package_keywords: 480,
    max_readme_bytes: 110000,
    max_work_items_bytes: 400000,
    max_manifest_bytes: 80000
  }),
  compaction_candidate_surfaces: Object.freeze([
    'README.md historical release prose',
    '.agent-onboard closed gate artifacts',
    'package.json keyword sprawl',
    '.agent-onboard/work-items.json closure history growth',
    'manifest/authority map digest refresh churn'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
    mutates_work_items: false,
    mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false
  })
});

function publicCleanCompactionWalkFiles(root = packageRoot()) {
  const skipDirectories = new Set(['.git', 'node_modules', '.idea', '.vscode', 'coverage', 'dist']);
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (skipDirectories.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const rel = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(absolute);
      files.push(Object.freeze({ path: rel, bytes: stat.size, top_level: rel.includes('/') ? rel.split('/')[0] : rel }));
    }
  }
  walk(root);
  return files;
}

function publicCleanCompactionTopLevelCounts(files) {
  const counts = {};
  const bytes = {};
  for (const file of files) {
    counts[file.top_level] = (counts[file.top_level] || 0) + 1;
    bytes[file.top_level] = (bytes[file.top_level] || 0) + file.bytes;
  }
  return Object.keys(counts).sort().map((name) => Object.freeze({ name, file_count: counts[name], bytes: bytes[name] }));
}

function publicCleanCompactionMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      previous_milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id,
      milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id,
      work_item_id: PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id,
      previous_milestone_status: 'not_present_installed_context_allowed',
      milestone_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const previousMilestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id) || null;
  const milestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    previous_milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id,
    milestone_id: PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id,
    work_item_id: PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id,
    previous_milestone_status: previousMilestone ? previousMilestone.status : 'missing',
    milestone_status: milestone ? milestone.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    previous_milestone_title: previousMilestone ? previousMilestone.title : null,
    milestone_title: milestone ? milestone.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicCleanCompactionInventory(root = packageRoot()) {
  const files = publicCleanCompactionWalkFiles(root);
  const pkg = readJson(path.join(root, 'package.json'));
  const projectedPackFiles = packageJsonProjectedPackFiles(pkg);
  const agentOnboardFiles = files.filter((file) => file.path.startsWith('.agent-onboard/'));
  const gateArtifacts = agentOnboardFiles.filter((file) => /(?:gate|plan|seed|parity|smoke|review|catalog|manifest|oracle)\.json$/.test(file.path));
  const jsonFiles = files.filter((file) => file.path.endsWith('.json'));
  const jsonlFiles = files.filter((file) => file.path.endsWith('.jsonl'));
  const sourceModules = files.filter((file) => file.path.startsWith('cli/') || file.path.startsWith('src/'));
  const readmePath = path.join(root, 'README.md');
  const workItemsPath = path.join(root, '.agent-onboard', 'work-items.json');
  const manifestPath = path.join(root, 'manifest.json');
  const largestFiles = files.slice().sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)).slice(0, 12);
  return Object.freeze({
    total_files: files.length,
    total_bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    top_level: publicCleanCompactionTopLevelCounts(files),
    source_modules: Object.freeze({
      file_count: sourceModules.length,
      cli_file_count: files.filter((file) => file.path.startsWith('cli/')).length,
      source_only_domain_file_count: files.filter((file) => file.path.startsWith('src/')).length
    }),
    agent_onboard_state: Object.freeze({
      file_count: agentOnboardFiles.length,
      json_file_count: agentOnboardFiles.filter((file) => file.path.endsWith('.json')).length,
      jsonl_file_count: agentOnboardFiles.filter((file) => file.path.endsWith('.jsonl')).length,
      closed_gate_artifact_count: gateArtifacts.length,
      work_items_bytes: fs.existsSync(workItemsPath) ? fs.statSync(workItemsPath).size : 0
    }),
    package: Object.freeze({
      projected_pack_file_count: projectedPackFiles.length,
      projected_pack_files: projectedPackFiles,
      package_json_files_count: Array.isArray(pkg.files) ? pkg.files.length : 0,
      keyword_count: Array.isArray(pkg.keywords) ? pkg.keywords.length : 0,
      version: pkg.version
    }),
    documentation: Object.freeze({
      readme_bytes: fs.existsSync(readmePath) ? fs.statSync(readmePath).size : 0,
      llms_bytes: fs.existsSync(path.join(root, 'llms.txt')) ? fs.statSync(path.join(root, 'llms.txt')).size : 0,
      source_of_truth_bytes: fs.existsSync(path.join(root, 'SOURCE_OF_TRUTH.md')) ? fs.statSync(path.join(root, 'SOURCE_OF_TRUTH.md')).size : 0,
      agents_bytes: fs.existsSync(path.join(root, 'AGENTS.md')) ? fs.statSync(path.join(root, 'AGENTS.md')).size : 0
    }),
    identity_indexes: Object.freeze({
      manifest_bytes: fs.existsSync(manifestPath) ? fs.statSync(manifestPath).size : 0,
      authority_map_bytes: fs.existsSync(path.join(root, 'authority-map.json')) ? fs.statSync(path.join(root, 'authority-map.json')).size : 0,
      json_file_count: jsonFiles.length,
      jsonl_file_count: jsonlFiles.length
    }),
    largest_files: largestFiles,
    milestone_state: publicCleanCompactionMilestoneState(root)
  });
}

function publicCleanCompactionCandidates(inventory) {
  return Object.freeze([
    Object.freeze({
      surface: 'README.md',
      current_bytes: inventory.documentation.readme_bytes,
      candidate_action: 'split or compact historical release prose while preserving first-read usage sections',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: '.agent-onboard closed gate artifacts',
      current_file_count: inventory.agent_onboard_state.closed_gate_artifact_count,
      candidate_action: 'compact closed gate records into bounded index/shard form without losing closure evidence',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: 'package.json keywords',
      current_count: inventory.package.keyword_count,
      candidate_action: 'collapse release-era keyword sprawl into stable product taxonomy',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: '.agent-onboard/work-items.json',
      current_bytes: inventory.agent_onboard_state.work_items_bytes,
      candidate_action: 'seed archival/summary split only after preserving authoritative work-item semantics',
      admission_required_before_write: true
    }),
    Object.freeze({
      surface: 'manifest.json and authority-map.json',
      current_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes,
      candidate_action: 'preserve content identity while avoiding identity-map noise during future compaction passes',
      admission_required_before_write: true
    })
  ]);
}

function publicCleanCompactionBaseline(root = packageRoot()) {
  const inventory = publicCleanCompactionInventory(root);
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-baseline-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    check_command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    package_root: root,
    baseline: PUBLIC_CLEAN_COMPACTION_BASELINE,
    inventory,
    compaction_candidates: publicCleanCompactionCandidates(inventory),
    boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary
  });
}

function publicCleanCompactionBaselineCheck(root = packageRoot()) {
  const result = publicCleanCompactionBaseline(root);
  const budget = PUBLIC_CLEAN_COMPACTION_BASELINE.budgets;
  const inventory = result.inventory;
  const milestone = inventory.milestone_state;
  const errors = [];
  if (inventory.total_files > budget.max_source_files) errors.push(`source file count ${inventory.total_files} exceeds clean baseline budget ${budget.max_source_files}`);
  if (inventory.agent_onboard_state.file_count > budget.max_agent_onboard_files) errors.push(`.agent-onboard file count ${inventory.agent_onboard_state.file_count} exceeds clean baseline budget ${budget.max_agent_onboard_files}`);
  if (inventory.agent_onboard_state.closed_gate_artifact_count > budget.max_agent_onboard_gate_artifacts) errors.push(`closed gate artifact count ${inventory.agent_onboard_state.closed_gate_artifact_count} exceeds clean baseline budget ${budget.max_agent_onboard_gate_artifacts}`);
  if (inventory.package.projected_pack_file_count > budget.max_projected_pack_files) errors.push(`projected pack file count ${inventory.package.projected_pack_file_count} exceeds clean baseline budget ${budget.max_projected_pack_files}`);
  if (inventory.package.keyword_count > budget.max_package_keywords) errors.push(`package keyword count ${inventory.package.keyword_count} exceeds clean baseline budget ${budget.max_package_keywords}`);
  if (inventory.documentation.readme_bytes > budget.max_readme_bytes) errors.push(`README.md bytes ${inventory.documentation.readme_bytes} exceeds clean baseline budget ${budget.max_readme_bytes}`);
  if (inventory.agent_onboard_state.work_items_bytes > budget.max_work_items_bytes) errors.push(`work-items ledger bytes ${inventory.agent_onboard_state.work_items_bytes} exceeds clean baseline budget ${budget.max_work_items_bytes}`);
  if (inventory.identity_indexes.manifest_bytes > budget.max_manifest_bytes) errors.push(`manifest.json bytes ${inventory.identity_indexes.manifest_bytes} exceeds clean baseline budget ${budget.max_manifest_bytes}`);
  if (PUBLIC_CLEAN_COMPACTION_BASELINE.boundary.writes_files !== false) errors.push('clean compaction baseline command must remain no-write');
  if (milestone.ledger_present) {
    if (milestone.previous_milestone_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.previous_milestone_id} must be closed before M6 baseline passes`);
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.milestone_id} must be open for clean and compaction work`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_BASELINE.work_item_id} must be closed by this baseline gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-baseline-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    inventory_command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    package_root: root,
    validated: Object.freeze({
      source_file_count_within_budget: inventory.total_files <= budget.max_source_files,
      agent_onboard_file_count_within_budget: inventory.agent_onboard_state.file_count <= budget.max_agent_onboard_files,
      gate_artifact_count_within_budget: inventory.agent_onboard_state.closed_gate_artifact_count <= budget.max_agent_onboard_gate_artifacts,
      projected_pack_file_count_within_budget: inventory.package.projected_pack_file_count <= budget.max_projected_pack_files,
      package_keywords_within_budget: inventory.package.keyword_count <= budget.max_package_keywords,
      readme_bytes_within_budget: inventory.documentation.readme_bytes <= budget.max_readme_bytes,
      work_items_bytes_within_budget: inventory.agent_onboard_state.work_items_bytes <= budget.max_work_items_bytes,
      manifest_bytes_within_budget: inventory.identity_indexes.manifest_bytes <= budget.max_manifest_bytes,
      no_write_boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary.writes_files === false,
      m5_closed_m6_open: !milestone.ledger_present || (milestone.previous_milestone_status === 'closed' && milestone.milestone_status === 'open'),
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    budgets: budget,
    inventory,
    compaction_candidates: result.compaction_candidates,
    boundary: PUBLIC_CLEAN_COMPACTION_BASELINE.boundary,
    errors
  });
}

function publicCleanCompactionBaselineText(result = publicCleanCompactionBaseline()) {
  const lines = [
    `agent-onboard clean compaction baseline ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Inventory:',
    `- total files: ${result.inventory.total_files}`,
    `- total bytes: ${result.inventory.total_bytes}`,
    `- .agent-onboard files: ${result.inventory.agent_onboard_state.file_count}`,
    `- closed gate artifacts: ${result.inventory.agent_onboard_state.closed_gate_artifact_count}`,
    `- projected package files: ${result.inventory.package.projected_pack_file_count}`,
    `- package keywords: ${result.inventory.package.keyword_count}`,
    `- README bytes: ${result.inventory.documentation.readme_bytes}`,
    '',
    'Compaction candidates:'
  ];
  for (const candidate of result.compaction_candidates) lines.push(`- ${candidate.surface}: ${candidate.candidate_action}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.writes_files}`, `- Deletes files: ${result.boundary.deletes_files}`, `- Publishes package: ${result.boundary.publishes_package}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_CLEAN_COMPACTION_CATALOG = Object.freeze({
  schema: 'agent-onboard-public-clean-compaction-catalog-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  work_item_id: ['P1S3M6', 'W2'].join(''),
  title: 'Public clean and compaction candidate catalog gate',
  command: 'agent-onboard release --clean-catalog',
  check_command: 'agent-onboard release --clean-catalog-check',
  catalog_file: '.agent-onboard/public-clean-compaction-catalog-gate.json',
  purpose: 'Classify clean and compaction candidates into explicit preserve, defer, and future-write lanes before any deletion, movement, archival, or taxonomy reduction is admitted.',
  required_candidate_count: 6,
  allowed_dispositions: Object.freeze([
    'preserve_live_first_read_then_split_history',
    'preserve_evidence_then_compact_closed_records',
    'preserve_discovery_then_reduce_taxonomy',
    'preserve_authority_then_split_archive_index',
    'preserve_identity_then_regenerate_after_write',
    'preserve_behavior_then_extract_runtime_modules'
  ]),
  boundary: Object.freeze({
    writes_files: false,
    deletes_files: false,
    moves_files: false,
    rewrites_history: false,
    mutates_work_items: false,
    mutates_claims: false,
    mutates_git: false,
    installs_dependencies: false,
    runs_package_manager: false,
    publishes_package: false,
    mutates_registry: false,
    network: false
  })
});

function publicCleanCompactionCatalogEntries(inventory) {
  const runtimeComposer = inventory.largest_files.find((file) => file.path === 'cli/agent_onboard/runtime-composer.js') || { bytes: 0 };
  const testFile = inventory.largest_files.find((file) => file.path === 'test/agent-onboard.test.js') || { bytes: 0 };
  return Object.freeze([
    Object.freeze({
      id: 'readme-first-read-history',
      surface: 'README.md',
      class: 'documentation_surface',
      current_bytes: inventory.documentation.readme_bytes,
      disposition: 'preserve_live_first_read_then_split_history',
      preserve_before_compaction: Object.freeze(['install/use commands', 'public safety boundaries', 'current release commands', 'first-read path']),
      forbidden_now: Object.freeze(['delete README.md', 'drop current commands', 'hide public boundary wording']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'closed-gate-artifacts',
      surface: '.agent-onboard closed gate artifacts',
      class: 'closure_evidence_surface',
      current_file_count: inventory.agent_onboard_state.closed_gate_artifact_count,
      disposition: 'preserve_evidence_then_compact_closed_records',
      preserve_before_compaction: Object.freeze(['work item id', 'title', 'closed_at', 'summary', 'changed_files', 'checks_run', 'known_non_pass']),
      forbidden_now: Object.freeze(['bulk-delete closure records', 'replace evidence with unlinked prose', 'make index authoritative without raw recovery path']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'package-keyword-taxonomy',
      surface: 'package.json keywords',
      class: 'package_discovery_metadata',
      current_count: inventory.package.keyword_count,
      disposition: 'preserve_discovery_then_reduce_taxonomy',
      preserve_before_compaction: Object.freeze(['package identity keywords', 'stable command-family keywords', 'consumer onboarding discovery keywords']),
      forbidden_now: Object.freeze(['collapse to vague branding only', 'remove npm discoverability before taxonomy is admitted']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'work-items-ledger-growth',
      surface: '.agent-onboard/work-items.json',
      class: 'authority_ledger_surface',
      current_bytes: inventory.agent_onboard_state.work_items_bytes,
      disposition: 'preserve_authority_then_split_archive_index',
      preserve_before_compaction: Object.freeze(['open/closed status', 'milestone membership', 'closure evidence', 'operator-readable next item semantics']),
      forbidden_now: Object.freeze(['make summary index the sole authority', 'drop closure history without archived recovery path']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'identity-index-refresh-churn',
      surface: 'manifest.json and authority-map.json',
      class: 'content_identity_surface',
      current_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes,
      disposition: 'preserve_identity_then_regenerate_after_write',
      preserve_before_compaction: Object.freeze(['file_urn', 'file_path', 'file_id', 'self-referential manifest exclusion']),
      forbidden_now: Object.freeze(['edit hashes by hand without target metadata refresh', 'treat digest churn as permission to drop identity coverage']),
      future_write_requires_admitted_work_item: true
    }),
    Object.freeze({
      id: 'runtime-and-test-monoliths',
      surface: 'runtime-composer.js and agent-onboard.test.js',
      class: 'source_runtime_surface',
      current_bytes: runtimeComposer.bytes + testFile.bytes,
      disposition: 'preserve_behavior_then_extract_runtime_modules',
      preserve_before_compaction: Object.freeze(['CLI command output contracts', 'installed package parity', 'release check behavior', 'target onboarding behavior']),
      forbidden_now: Object.freeze(['mechanical split without golden output check', 'delete test coverage to reduce byte count']),
      future_write_requires_admitted_work_item: true
    })
  ]);
}

function publicCleanCompactionCatalog(root = packageRoot()) {
  const baseline = publicCleanCompactionBaseline(root);
  const inventory = baseline.inventory;
  const entries = publicCleanCompactionCatalogEntries(inventory);
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-catalog-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
    check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
    package_root: root,
    baseline_command: PUBLIC_CLEAN_COMPACTION_BASELINE.command,
    baseline_check_command: PUBLIC_CLEAN_COMPACTION_BASELINE.check_command,
    catalog: PUBLIC_CLEAN_COMPACTION_CATALOG,
    inventory_snapshot: Object.freeze({
      total_files: inventory.total_files,
      total_bytes: inventory.total_bytes,
      agent_onboard_files: inventory.agent_onboard_state.file_count,
      closed_gate_artifacts: inventory.agent_onboard_state.closed_gate_artifact_count,
      package_keywords: inventory.package.keyword_count,
      readme_bytes: inventory.documentation.readme_bytes,
      work_items_bytes: inventory.agent_onboard_state.work_items_bytes,
      identity_index_bytes: inventory.identity_indexes.manifest_bytes + inventory.identity_indexes.authority_map_bytes
    }),
    classification_policy: Object.freeze({
      delete_or_move_allowed_now: false,
      taxonomy_reduction_allowed_now: false,
      archive_split_allowed_now: false,
      future_write_must_name_exact_surface_id: true,
      future_write_must_preserve_recovery_or_replay_path: true,
      future_write_must_refresh_target_metadata_after_mutation: true
    }),
    entries,
    boundary: PUBLIC_CLEAN_COMPACTION_CATALOG.boundary
  });
}

function publicCleanCompactionCatalogMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id,
      baseline_work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id,
      work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id,
    baseline_work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id,
    work_item_id: PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicCleanCompactionCatalogCheck(root = packageRoot()) {
  const result = publicCleanCompactionCatalog(root);
  const baselineCheck = publicCleanCompactionBaselineCheck(root);
  const milestone = publicCleanCompactionCatalogMilestoneState(root);
  const errors = baselineCheck.errors.map((error) => `baseline: ${error}`);
  const allowed = new Set(PUBLIC_CLEAN_COMPACTION_CATALOG.allowed_dispositions);
  if (result.entries.length !== PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count) errors.push(`clean catalog must classify exactly ${PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count} surfaces`);
  for (const entry of result.entries) {
    if (!entry.id) errors.push('clean catalog entry is missing id');
    if (!entry.surface) errors.push(`clean catalog entry ${entry.id || '<unknown>'} is missing surface`);
    if (!allowed.has(entry.disposition)) errors.push(`clean catalog entry ${entry.id || '<unknown>'} has unsupported disposition ${entry.disposition}`);
    if (entry.future_write_requires_admitted_work_item !== true) errors.push(`clean catalog entry ${entry.id || '<unknown>'} must require a future admitted work item before writes`);
    if (!Array.isArray(entry.forbidden_now) || entry.forbidden_now.length === 0) errors.push(`clean catalog entry ${entry.id || '<unknown>'} must list forbidden-now actions`);
  }
  if (result.classification_policy.delete_or_move_allowed_now !== false) errors.push('clean catalog must not allow delete or move now');
  if (result.classification_policy.future_write_must_name_exact_surface_id !== true) errors.push('future compaction writes must name exact surface id');
  if (result.boundary.writes_files !== false) errors.push('clean catalog command must remain no-write');
  if (result.boundary.deletes_files !== false) errors.push('clean catalog command must not delete files');
  if (result.boundary.moves_files !== false) errors.push('clean catalog command must not move files');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.milestone_id} must remain open during clean and compaction cataloging`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.baseline_work_item_id} must be closed before the clean catalog passes`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_CLEAN_COMPACTION_CATALOG.work_item_id} must be closed by this catalog gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-clean-compaction-catalog-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
    catalog_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
    package_root: root,
    validated: Object.freeze({
      baseline_check_passes: baselineCheck.status === 'ok',
      required_candidate_count: result.entries.length === PUBLIC_CLEAN_COMPACTION_CATALOG.required_candidate_count,
      dispositions_supported: result.entries.every((entry) => allowed.has(entry.disposition)),
      every_entry_requires_future_admission: result.entries.every((entry) => entry.future_write_requires_admitted_work_item === true),
      every_entry_has_forbidden_now_actions: result.entries.every((entry) => Array.isArray(entry.forbidden_now) && entry.forbidden_now.length > 0),
      no_write_boundary: result.boundary.writes_files === false,
      no_delete_boundary: result.boundary.deletes_files === false,
      no_move_boundary: result.boundary.moves_files === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    baseline_check: baselineCheck,
    milestone_state: milestone,
    catalog: result,
    boundary: PUBLIC_CLEAN_COMPACTION_CATALOG.boundary,
    errors
  });
}

function publicCleanCompactionCatalogText(result = publicCleanCompactionCatalog()) {
  const lines = [
    `agent-onboard clean compaction catalog ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Classification policy:',
    `- delete or move allowed now: ${result.classification_policy.delete_or_move_allowed_now}`,
    `- future write must name exact surface id: ${result.classification_policy.future_write_must_name_exact_surface_id}`,
    `- future write must preserve recovery/replay path: ${result.classification_policy.future_write_must_preserve_recovery_or_replay_path}`,
    '',
    'Catalog entries:'
  ];
  for (const entry of result.entries) lines.push(`- ${entry.id}: ${entry.surface} -> ${entry.disposition}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.writes_files}`, `- Deletes files: ${result.boundary.deletes_files}`, `- Moves files: ${result.boundary.moves_files}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


  return Object.freeze({
    PUBLIC_CLEAN_COMPACTION_BASELINE,
    PUBLIC_CLEAN_COMPACTION_CATALOG,
    publicCleanCompactionBaseline,
    publicCleanCompactionBaselineCheck,
    publicCleanCompactionBaselineText,
    publicCleanCompactionCatalog,
    publicCleanCompactionCatalogCheck,
    publicCleanCompactionCatalogText,
  });
}

module.exports = Object.freeze({
  createCleanCompactionRuntime
});
