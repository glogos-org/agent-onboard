'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createKeywordReadmePlanRuntime(ctx = Object.freeze({})) {
  const { PACKAGE_NAME, RELEASE_LINE, VERSION, packageRoot, readJson, sourceContext, PUBLIC_CLEAN_COMPACTION_CATALOG, publicCleanCompactionCatalogCheck, publicReadmeHistoryArchiveSplitAppliedState } = ctx;

const PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION = Object.freeze({
  schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'package-keyword-taxonomy',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  catalog_work_item_id: ['P1S3M6', 'W2'].join(''),
  work_item_id: ['P1S3M6', 'W3'].join(''),
  title: 'Public package keyword taxonomy compaction gate',
  command: 'agent-onboard release --keyword-taxonomy',
  check_command: 'agent-onboard release --keyword-taxonomy-check',
  artifact_file: '.agent-onboard/public-package-keyword-taxonomy-compaction-gate.json',
  purpose: 'Reduce package.json keyword sprawl into a compact public npm discovery taxonomy while preserving package identity, command-family discovery, target onboarding discovery, coordination, release, contract, and clean-compaction terms.',
  previous_observed_keyword_count: 446,
  max_keywords: 80,
  min_keywords: 24,
  required_keyword_groups: Object.freeze({
    package_identity: Object.freeze(['agent-onboard', 'agent-onboard-cli', 'create-agent-onboard']),
    target_onboarding: Object.freeze(['repository-onboarding', 'target-repository', 'target-onboarding', 'target-doctor', 'target-governance']),
    coordination: Object.freeze(['work-items', 'work-item-ledger', 'work-item-claim', 'claim-ledger', 'claims-jsonl']),
    authority_governance: Object.freeze(['repository-governance', 'governance-index', 'authority-check', 'authority-index', 'authority-state']),
    release_package: Object.freeze(['release-check', 'source-manifest', 'content-addressed-manifest', 'package-surface', 'artifact-oracle', 'installed-package-parity']),
    contracts_output: Object.freeze(['public-contracts', 'json-output-contract', 'contract-validation', 'command-router', 'command-catalog', 'runtime-contracts']),
    agent_integration: Object.freeze(['agents-md', 'agent-instructions', 'llms-txt', 'mcp-bridge', 'github-actions', 'ci-recipe']),
    clean_compaction: Object.freeze(['clean-compaction', 'public-clean-compaction', 'package-keyword-taxonomy', 'compaction-policy'])
  }),
  forbidden_keyword_patterns: Object.freeze([
    'concrete work-item identifiers',
    'release-era one-off gate names',
    'opaque milestone-only labels',
    'private/nonpublic process wording',
    'duplicate keywords',
    'non-slug keyword spelling'
  ]),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
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

function publicPackageKeywordTaxonomyCurrent(root = packageRoot()) {
  const pkg = readJson(path.join(root, 'package.json'));
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords.slice() : [];
  const duplicates = keywords.filter((keyword, index) => keywords.indexOf(keyword) !== index);
  const slugPattern = /^[a-z0-9][a-z0-9-]*$/;
  const invalidSlugKeywords = keywords.filter((keyword) => typeof keyword !== 'string' || !slugPattern.test(keyword));
  const concreteWorkItemPattern = /^p\d+s\d+m\d+w\d+$/i;
  const milestoneOnlyPattern = /^p\d+s\d+m\d+$/i;
  const releaseEraGatePattern = /(?:-gate$|^gate-|w\d+$)/i;
  const forbiddenKeywords = keywords.filter((keyword) => concreteWorkItemPattern.test(keyword) || milestoneOnlyPattern.test(keyword) || releaseEraGatePattern.test(keyword));
  const groups = PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.required_keyword_groups;
  const groupCoverage = Object.fromEntries(Object.entries(groups).map(([group, required]) => [group, Object.freeze({
    required: required.slice(),
    present: required.filter((keyword) => keywords.includes(keyword)),
    missing: required.filter((keyword) => !keywords.includes(keyword)),
    complete: required.every((keyword) => keywords.includes(keyword))
  })]));
  return Object.freeze({
    version: pkg.version,
    keyword_count: keywords.length,
    keywords,
    duplicates,
    invalid_slug_keywords: invalidSlugKeywords,
    forbidden_keywords: forbiddenKeywords,
    group_coverage: Object.freeze(groupCoverage),
    reduction: Object.freeze({
      previous_observed_keyword_count: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.previous_observed_keyword_count,
      current_keyword_count: keywords.length,
      reduced_by: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.previous_observed_keyword_count - keywords.length,
      current_within_max: keywords.length <= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords
    })
  });
}

function publicPackageKeywordTaxonomyMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id,
      baseline_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id,
      catalog_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id,
      work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      catalog_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id) || null;
  const catalogWorkItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id,
    baseline_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id,
    catalog_work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id,
    work_item_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    catalog_work_item_status: catalogWorkItem ? catalogWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    catalog_work_item_title: catalogWorkItem ? catalogWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicPackageKeywordTaxonomyCompaction(root = packageRoot()) {
  const current = publicPackageKeywordTaxonomyCurrent(root);
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.command,
    check_command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.check_command,
    package_root: root,
    package_json_path: 'package.json',
    taxonomy: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION,
    catalog_surface: Object.freeze({
      source_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
      source_check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
      catalog_check_status: catalogCheck.status,
      required_surface_id: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_surface_id,
      surface_present: catalogCheck.catalog.entries.some((entry) => entry.id === PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_surface_id)
    }),
    current,
    boundary: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.boundary
  });
}

function publicPackageKeywordTaxonomyCompactionCheck(root = packageRoot()) {
  const result = publicPackageKeywordTaxonomyCompaction(root);
  const current = result.current;
  const milestone = publicPackageKeywordTaxonomyMilestoneState(root);
  const errors = [];
  if (result.catalog_surface.catalog_check_status !== 'ok') errors.push('clean compaction catalog check must pass before keyword taxonomy compaction check');
  if (!result.catalog_surface.surface_present) errors.push('clean compaction catalog must include package-keyword-taxonomy surface');
  if (current.keyword_count > PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords) errors.push(`package keyword count ${current.keyword_count} exceeds compact taxonomy budget ${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords}`);
  if (current.keyword_count < PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords) errors.push(`package keyword count ${current.keyword_count} is below required discovery floor ${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords}`);
  if (current.duplicates.length > 0) errors.push(`package keywords contain duplicates: ${current.duplicates.join(', ')}`);
  if (current.invalid_slug_keywords.length > 0) errors.push(`package keywords must be lowercase npm slugs: ${current.invalid_slug_keywords.join(', ')}`);
  if (current.forbidden_keywords.length > 0) errors.push(`package keywords contain forbidden release-era terms: ${current.forbidden_keywords.join(', ')}`);
  for (const [group, coverage] of Object.entries(current.group_coverage)) {
    if (!coverage.complete) errors.push(`package keyword taxonomy group ${group} is missing: ${coverage.missing.join(', ')}`);
  }
  if (current.reduction.reduced_by <= 0) errors.push('package keyword taxonomy must reduce the previously observed keyword count');
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('keyword taxonomy commands must remain read-only');
  if (result.boundary.publishes_package !== false || result.boundary.mutates_registry !== false) errors.push('keyword taxonomy commands must not publish or mutate registry state');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.milestone_id} must remain open during keyword taxonomy compaction`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.baseline_work_item_id} must be closed before keyword taxonomy compaction`);
    if (milestone.catalog_work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.catalog_work_item_id} must be closed before keyword taxonomy compaction`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.work_item_id} must be closed by this keyword taxonomy gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-package-keyword-taxonomy-compaction-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.check_command,
    taxonomy_command: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.command,
    package_root: root,
    validated: Object.freeze({
      catalog_check_passes: result.catalog_surface.catalog_check_status === 'ok',
      catalog_surface_present: result.catalog_surface.surface_present,
      keyword_count_within_compact_budget: current.keyword_count <= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.max_keywords,
      keyword_count_above_discovery_floor: current.keyword_count >= PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.min_keywords,
      keyword_count_reduced_from_previous_observation: current.reduction.reduced_by > 0,
      no_duplicate_keywords: current.duplicates.length === 0,
      keywords_are_lowercase_slugs: current.invalid_slug_keywords.length === 0,
      release_era_keywords_removed: current.forbidden_keywords.length === 0,
      every_required_group_complete: Object.values(current.group_coverage).every((coverage) => coverage.complete),
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_publish_or_registry_mutation: result.boundary.publishes_package === false && result.boundary.mutates_registry === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      catalog_work_item_closed: !milestone.ledger_present || milestone.catalog_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    taxonomy: result,
    milestone_state: milestone,
    boundary: PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION.boundary,
    errors
  });
}

function publicPackageKeywordTaxonomyCompactionText(result = publicPackageKeywordTaxonomyCompaction()) {
  const lines = [
    `agent-onboard package keyword taxonomy ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Keyword taxonomy:',
    `- current keyword count: ${result.current.keyword_count}`,
    `- previous observed keyword count: ${result.current.reduction.previous_observed_keyword_count}`,
    `- reduced by: ${result.current.reduction.reduced_by}`,
    `- compact budget: ${result.taxonomy.max_keywords}`,
    '',
    'Required groups:'
  ];
  for (const [group, coverage] of Object.entries(result.current.group_coverage)) lines.push(`- ${group}: ${coverage.complete ? 'complete' : `missing ${coverage.missing.join(', ')}`}`);
  lines.push('', 'Boundary:', `- Writes files: ${result.boundary.command_writes_files}`, `- Publishes package: ${result.boundary.publishes_package}`, `- Mutates registry: ${result.boundary.mutates_registry}`);
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}


const PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN = Object.freeze({
  schema: 'agent-onboard-public-readme-first-read-history-split-plan-001',
  package_name: PACKAGE_NAME,
  release_line: RELEASE_LINE,
  milestone_id: 'P1S3M6',
  catalog_surface_id: 'readme-first-read-history',
  baseline_work_item_id: ['P1S3M6', 'W1'].join(''),
  catalog_work_item_id: ['P1S3M6', 'W2'].join(''),
  keyword_work_item_id: ['P1S3M6', 'W3'].join(''),
  work_item_id: ['P1S3M6', 'W4'].join(''),
  title: 'Public README first-read history split planning gate',
  command: 'agent-onboard release --readme-plan',
  check_command: 'agent-onboard release --readme-plan-check',
  artifact_file: '.agent-onboard/public-readme-first-read-history-split-plan-gate.json',
  purpose: 'Plan a future README first-read/history split without moving, deleting, archiving, or rewriting README.md in this gate.',
  required_first_read_markers: Object.freeze([
    '# agent-onboard',
    '## Install',
    '## Quickstart',
    'npx agent-onboard status',
    'npx agent-onboard target doctor --text',
    'npx agent-onboard release --check'
  ]),
  planned_surfaces: Object.freeze({
    live_readme: 'README.md',
    future_history_archive_candidate: 'docs/release-history.md',
    future_history_index_candidate: '.agent-onboard/readme-history.index.json'
  }),
  plan_rules: Object.freeze({
    live_readme_keeps_install_quickstart_current_commands: true,
    history_archive_requires_exact_recovery_path: true,
    first_read_path_must_not_depend_on_history_archive: true,
    future_write_must_name_catalog_surface_id: true,
    future_write_must_refresh_metadata_after_mutation: true
  }),
  boundary: Object.freeze({
    command_writes_files: false,
    check_command_writes_files: false,
    creates_history_archive: false,
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

function publicReadmeHistoryHeadings(readme) {
  return readme.split(/\r?\n/).filter((line) => /^#{2,3}\s+/.test(line) && /release|history|runtime|surface|gate|product|target|contract|compaction/i.test(line));
}

function publicReadmeFirstReadHistoryCurrent(root = packageRoot()) {
  const readmePath = path.join(root, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const markers = PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.required_first_read_markers;
  const releaseMentions = (readme.match(/\b(?:This release|The current release|Current release:)\b/g) || []).length;
  const historyHeadings = publicReadmeHistoryHeadings(readme);
  const planned = PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces;
  return Object.freeze({
    readme_path: 'README.md',
    readme_present: fs.existsSync(readmePath),
    readme_bytes: Buffer.byteLength(readme, 'utf8'),
    readme_lines: readme.length === 0 ? 0 : readme.split(/\r?\n/).length,
    first_read_markers: Object.freeze(markers.map((marker) => Object.freeze({
      marker,
      present: readme.includes(marker)
    }))),
    first_read_marker_count: markers.filter((marker) => readme.includes(marker)).length,
    release_history_signal: Object.freeze({
      release_mention_count: releaseMentions,
      history_heading_count: historyHeadings.length,
      sample_headings: historyHeadings.slice(0, 12)
    }),
    future_history_archive_present: fs.existsSync(path.join(root, planned.future_history_archive_candidate)),
    future_history_index_present: fs.existsSync(path.join(root, planned.future_history_index_candidate)),
    current_gate_performs_split: false
  });
}

function publicReadmeFirstReadHistoryMilestoneState(root = packageRoot()) {
  const ledgerPath = path.join(root, '.agent-onboard', 'work-items.json');
  if (!fs.existsSync(ledgerPath)) {
    return Object.freeze({
      ledger_present: false,
      milestone_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id,
      baseline_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id,
      catalog_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id,
      keyword_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id,
      work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id,
      milestone_status: 'not_present_installed_context_allowed',
      baseline_work_item_status: 'not_present_installed_context_allowed',
      catalog_work_item_status: 'not_present_installed_context_allowed',
      keyword_work_item_status: 'not_present_installed_context_allowed',
      work_item_status: 'not_present_installed_context_allowed'
    });
  }
  let ledger = null;
  try { ledger = readJson(ledgerPath); } catch { ledger = null; }
  const milestones = ledger && Array.isArray(ledger.milestones) ? ledger.milestones : [];
  const workItems = ledger && Array.isArray(ledger.work_items) ? ledger.work_items : [];
  const milestone = milestones.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id) || null;
  const baselineWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id) || null;
  const catalogWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id) || null;
  const keywordWorkItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id) || null;
  const workItem = workItems.find((item) => item.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id) || null;
  return Object.freeze({
    ledger_present: true,
    milestone_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id,
    baseline_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id,
    catalog_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id,
    keyword_work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id,
    work_item_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id,
    milestone_status: milestone ? milestone.status : 'missing',
    baseline_work_item_status: baselineWorkItem ? baselineWorkItem.status : 'missing',
    catalog_work_item_status: catalogWorkItem ? catalogWorkItem.status : 'missing',
    keyword_work_item_status: keywordWorkItem ? keywordWorkItem.status : 'missing',
    work_item_status: workItem ? workItem.status : 'missing',
    milestone_title: milestone ? milestone.title : null,
    baseline_work_item_title: baselineWorkItem ? baselineWorkItem.title : null,
    catalog_work_item_title: catalogWorkItem ? catalogWorkItem.title : null,
    keyword_work_item_title: keywordWorkItem ? keywordWorkItem.title : null,
    work_item_title: workItem ? workItem.title : null
  });
}

function publicReadmeFirstReadHistorySplitPlan(root = packageRoot()) {
  const current = publicReadmeFirstReadHistoryCurrent(root);
  const catalogCheck = publicCleanCompactionCatalogCheck(root);
  const keywordTaxonomyCheck = publicPackageKeywordTaxonomyCompactionCheck(root);
  return Object.freeze({
    schema: 'agent-onboard-public-readme-first-read-history-split-plan-result-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.command,
    check_command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.check_command,
    package_root: root,
    readme_path: 'README.md',
    plan: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN,
    catalog_surface: Object.freeze({
      source_command: PUBLIC_CLEAN_COMPACTION_CATALOG.command,
      source_check_command: PUBLIC_CLEAN_COMPACTION_CATALOG.check_command,
      catalog_check_status: catalogCheck.status,
      required_surface_id: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_surface_id,
      surface_present: catalogCheck.catalog.entries.some((entry) => entry.id === PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_surface_id)
    }),
    prerequisite_checks: Object.freeze({
      clean_catalog_check: catalogCheck.status,
      keyword_taxonomy_check: keywordTaxonomyCheck.status
    }),
    current,
    split_plan: Object.freeze({
      live_readme_keeps: Object.freeze(['package identity', 'install commands', 'quickstart', 'current command surface', 'safety/no-mutation boundary']),
      future_history_archive_candidate: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_archive_candidate,
      future_history_index_candidate: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_index_candidate,
      future_write_sequence: Object.freeze([
        'copy historical release prose into archive candidate',
        'leave first-read install/quickstart/current commands in README.md',
        'add bounded recovery index only if raw archive remains recoverable',
        'refresh target metadata and public package checks after mutation'
      ]),
      no_write_in_this_gate: true
    }),
    boundary: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.boundary
  });
}

function publicReadmeFirstReadHistorySplitPlanCheck(root = packageRoot()) {
  const result = publicReadmeFirstReadHistorySplitPlan(root);
  const current = result.current;
  const milestone = publicReadmeFirstReadHistoryMilestoneState(root);
  const errors = [];
  const applyState = publicReadmeHistoryArchiveSplitAppliedState(root);
  const installedPackageContext = sourceContext(root).package_context === 'installed_package';
  if (result.catalog_surface.catalog_check_status !== 'ok') errors.push('clean compaction catalog check must pass before README split planning');
  if (!result.catalog_surface.surface_present) errors.push('clean compaction catalog must include readme-first-read-history surface');
  if (result.prerequisite_checks.keyword_taxonomy_check !== 'ok') errors.push('keyword taxonomy check must pass before README split planning');
  if (!current.readme_present) errors.push('README.md must be present before split planning');
  for (const marker of current.first_read_markers) {
    if (!marker.present) errors.push(`README first-read marker missing: ${marker.marker}`);
  }
  if (current.release_history_signal.release_mention_count < 3 && !applyState.applied && !(installedPackageContext && applyState.readme_release_history_pointer_present)) errors.push('README must expose enough release-history signal before a split plan is meaningful');
  if (current.future_history_archive_present && !applyState.applied) errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_archive_candidate} must not be created before the admitted apply gate`);
  if (current.future_history_index_present && !applyState.applied) errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.planned_surfaces.future_history_index_candidate} must not be created before the admitted apply gate`);
  if (result.boundary.command_writes_files !== false || result.boundary.check_command_writes_files !== false) errors.push('README split planning commands must remain read-only');
  if (result.boundary.creates_history_archive !== false || result.boundary.deletes_files !== false || result.boundary.moves_files !== false) errors.push('README split planning must not create archive, delete files, or move files');
  if (result.boundary.rewrites_history !== false) errors.push('README split planning must not rewrite history in this gate');
  if (milestone.ledger_present) {
    if (milestone.milestone_status !== 'open') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.milestone_id} must remain open during README split planning`);
    if (milestone.baseline_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.baseline_work_item_id} must be closed before README split planning`);
    if (milestone.catalog_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.catalog_work_item_id} must be closed before README split planning`);
    if (milestone.keyword_work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.keyword_work_item_id} must be closed before README split planning`);
    if (milestone.work_item_status !== 'closed') errors.push(`${PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.work_item_id} must be closed by this README split planning gate`);
  }
  return Object.freeze({
    schema: 'agent-onboard-public-readme-first-read-history-split-plan-check-result-001',
    status: errors.length === 0 ? 'ok' : 'error',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.check_command,
    plan_command: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.command,
    package_root: root,
    validated: Object.freeze({
      catalog_check_passes: result.catalog_surface.catalog_check_status === 'ok',
      catalog_surface_present: result.catalog_surface.surface_present,
      keyword_taxonomy_check_passes: result.prerequisite_checks.keyword_taxonomy_check === 'ok',
      readme_present: current.readme_present,
      all_first_read_markers_present: current.first_read_markers.every((marker) => marker.present),
      release_history_signal_present: current.release_history_signal.release_mention_count >= 3 || applyState.applied || (installedPackageContext && applyState.readme_release_history_pointer_present),
      installed_package_context_allows_archive_omission: installedPackageContext,
      future_archive_not_created: current.future_history_archive_present === false || applyState.applied,
      future_index_not_created: current.future_history_index_present === false || applyState.applied,
      readme_history_apply_gate_admitted: applyState.applied,
      read_only_commands: result.boundary.command_writes_files === false && result.boundary.check_command_writes_files === false,
      no_archive_delete_move_or_rewrite: result.boundary.creates_history_archive === false && result.boundary.deletes_files === false && result.boundary.moves_files === false && result.boundary.rewrites_history === false,
      m6_open: !milestone.ledger_present || milestone.milestone_status === 'open',
      baseline_work_item_closed: !milestone.ledger_present || milestone.baseline_work_item_status === 'closed',
      catalog_work_item_closed: !milestone.ledger_present || milestone.catalog_work_item_status === 'closed',
      keyword_work_item_closed: !milestone.ledger_present || milestone.keyword_work_item_status === 'closed',
      current_work_item_closed: !milestone.ledger_present || milestone.work_item_status === 'closed'
    }),
    plan: result,
    milestone_state: milestone,
    boundary: PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN.boundary,
    apply_state: applyState,
    errors
  });
}

function publicReadmeFirstReadHistorySplitPlanText(result = publicReadmeFirstReadHistorySplitPlan()) {
  const lines = [
    `agent-onboard README first-read/history split plan ${result.version}`,
    `Status: ${result.status}`,
    `Command: ${result.command}`,
    '',
    'Current README:',
    `- bytes: ${result.current.readme_bytes}`,
    `- lines: ${result.current.readme_lines}`,
    `- release mentions: ${result.current.release_history_signal.release_mention_count}`,
    '',
    'Planned future split:',
    `- live README: ${result.plan.planned_surfaces.live_readme}`,
    `- future history archive: ${result.plan.planned_surfaces.future_history_archive_candidate}`,
    `- future history index: ${result.plan.planned_surfaces.future_history_index_candidate}`,
    '',
    'Boundary:',
    `- Writes files: ${result.boundary.command_writes_files}`,
    `- Creates history archive: ${result.boundary.creates_history_archive}`,
    `- Rewrites history: ${result.boundary.rewrites_history}`
  ];
  if (Array.isArray(result.errors) && result.errors.length > 0) lines.push('', 'Errors:', ...result.errors.map((error) => `- ${error}`));
  return `${lines.join('\n')}\n`;
}



  return Object.freeze({
    PUBLIC_PACKAGE_KEYWORD_TAXONOMY_COMPACTION,
    PUBLIC_README_FIRST_READ_HISTORY_SPLIT_PLAN,
    publicPackageKeywordTaxonomyCompaction,
    publicPackageKeywordTaxonomyCompactionCheck,
    publicPackageKeywordTaxonomyCompactionText,
    publicReadmeFirstReadHistorySplitPlan,
    publicReadmeFirstReadHistorySplitPlanCheck,
    publicReadmeFirstReadHistorySplitPlanText,
  });
}

module.exports = Object.freeze({
  createKeywordReadmePlanRuntime
});
