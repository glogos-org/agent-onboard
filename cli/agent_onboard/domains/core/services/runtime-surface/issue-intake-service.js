'use strict';

const { OUTPUT_FLAG, PACKAGE_NAME, RELEASE_LINE, VERSION } = require('./public-runtime-surface-common');

const ISSUE_INTAKE_DEFAULT= Object.freeze({
  source: Object.freeze({
    kind: 'github_issue',
    platform: 'github',
    repository: null,
    issue_number: null
  }),
  actor: Object.freeze({
    kind: 'human_contributor',
    handle: null,
    runtime: null,
    declared_authority: null
  }),
  issue: Object.freeze({
    title: 'External issue intake dry-run sample',
    labels: Object.freeze(['admission:needs-triage'])
  })
});

function issueIntakeValue(args = []) {
  const input = {
    source: Object.assign({}, ISSUE_INTAKE_DEFAULT.source),
    actor: Object.assign({}, ISSUE_INTAKE_DEFAULT.actor),
    issue: {
      title: ISSUE_INTAKE_DEFAULT.issue.title,
      labels: Array.from(ISSUE_INTAKE_DEFAULT.issue.labels)
    }
  };
  const allowed = new Set(['--classify-dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text, '--title', '--label', '--actor', '--source', '--repo', '--issue-number', '--runtime', '--handle']);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!allowed.has(arg)) {
      return { error: `issue supports only --classify-dry-run, --json, --text, --title, --label, --actor, --source, --repo, --issue-number, --runtime, or --handle in this public gate` };
    }
    if (arg === '--classify-dry-run' || arg === OUTPUT_FLAG.json || arg === OUTPUT_FLAG.text) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('-')) return { error: `issue ${arg} requires a value` };
    index += 1;
    if (arg === '--title') input.issue.title = value;
    else if (arg === '--label') input.issue.labels.push(value);
    else if (arg === '--actor') input.actor.kind = value;
    else if (arg === '--source') input.source.kind = value;
    else if (arg === '--repo') input.source.repository = value;
    else if (arg === '--issue-number') input.source.issue_number = value;
    else if (arg === '--runtime') input.actor.runtime = value;
    else if (arg === '--handle') input.actor.handle = value;
  }
  input.issue.labels = Array.from(new Set(input.issue.labels));
  return { input };
}

function issueDispositionFor(input) {
  const labels = Array.isArray(input.issue.labels) ? input.issue.labels : [];
  const actorKind = input.actor.kind || 'unknown';
  const sourceKind = input.source.kind || 'unknown';
  const permittedActorKinds = new Set(['human_contributor', 'maintainer', 'autonomous_agent', 'automation', 'unknown']);
  const permittedSignalKinds = new Set(['github_issue', 'gitlab_issue', 'external_signal', 'support_request', 'unknown']);
  if (!permittedSignalKinds.has(sourceKind) || !permittedActorKinds.has(actorKind)) return 'needs_triage';
  if (labels.includes('duplicate')) return 'duplicate';
  if (labels.includes('admission:rejected') || labels.includes('rejected')) return 'rejected';
  if (labels.includes('scope:consumer') || labels.includes('consumer-specific')) return 'consumer_specific';
  if (labels.includes('admission:upstream-candidate') || labels.includes('upstream-candidate')) return 'upstream_candidate';
  if (actorKind === 'autonomous_agent' || actorKind === 'automation' || labels.includes('admission:needs-triage')) return 'needs_generalization';
  return 'needs_triage';
}

function issueIntakeClassification(input) {
  const disposition = issueDispositionFor(input);
  const candidateEligible = disposition === 'needs_generalization' || disposition === 'upstream_candidate';
  const issueNumber = input.source.issue_number || 'unknown';
  return {
    schema: 'agent-onboard-public-issue-intake-classification-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard issue --classify-dry-run',
    mode: 'classify-dry-run',
    source: {
      kind: input.source.kind || null,
      platform: input.source.platform || null,
      repository: input.source.repository || null,
      issue_number: input.source.issue_number || null,
      authority: 'external_signal_only'
    },
    actor_classification: {
      kind: input.actor.kind || 'unknown',
      handle: input.actor.handle || null,
      runtime: input.actor.runtime || null,
      declared_authority: input.actor.declared_authority || null,
      authority: 'candidate_only',
      mutation_authority_granted: false
    },
    issue_classification: {
      title: input.issue.title || null,
      labels: Array.isArray(input.issue.labels) ? input.issue.labels.slice() : [],
      disposition,
      requires_generality_review: candidateEligible,
      candidate_work_item_preview_created: candidateEligible,
      canonical_work_item_created: false,
      admitted_claim_created: false,
      github_issue_mutated: false,
      github_api_used: false
    },
    work_item_candidate_preview: {
      candidate_id: `candidate:${input.source.kind || 'external_signal'}:${issueNumber}:work-item`,
      candidate_created_in_memory: candidateEligible,
      canonical_work_item_created: false,
      canonical_work_item_id: null,
      title: input.issue.title || 'External issue intake candidate',
      kind: 'upstream_generalization_candidate',
      source_disposition: disposition,
      requires_explicit_future_admission: true,
      mutation_authority_granted: false,
      admitted_claim_created: false
    },
    recommended_next_commands: [
      'agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>',
      'agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>',
      'agent-onboard contributor --admission-dry-run'
    ],
    boundary: {
      writes_files: false,
      writes_consuming_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_consumer_repository: false,
      imports_github_issue: false,
      github_api_dependency_now: false,
      github_issue_mutation_allowed_now: false,
      github_issue_is_canonical_work_item_now: false,
      canonical_work_item_creation_allowed_now: false,
      claim_admission_allowed_now: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false,
      git_mutation: false
    }
  };
}

function issueIntakeText(result) {
  return [
    'agent-onboard issue intake dry-run',
    `Source: ${result.source.kind}${result.source.repository ? ` ${result.source.repository}` : ''}${result.source.issue_number ? `#${result.source.issue_number}` : ''}`,
    `Actor: ${result.actor_classification.kind}${result.actor_classification.handle ? ` (${result.actor_classification.handle})` : ''}`,
    `Disposition: ${result.issue_classification.disposition}`,
    `Candidate preview: ${result.work_item_candidate_preview.candidate_created_in_memory ? result.work_item_candidate_preview.candidate_id : 'not created for this disposition'}`,
    'Authority: external signal only; no canonical work item or admitted claim created.',
    'Boundary: no files written, no GitHub API, no Git mutation, no network, no publish.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`)
  ].join('\n') + '\n';
}

const issueIntakeService = Object.freeze({
  input: issueIntakeValue,
  classify: issueIntakeClassification,
  text: issueIntakeText
});

module.exports = Object.freeze({ issueIntakeService });
