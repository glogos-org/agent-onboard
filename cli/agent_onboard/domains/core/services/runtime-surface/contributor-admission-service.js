'use strict';

const { OUTPUT_FLAG, PACKAGE_NAME, RELEASE_LINE, VERSION } = require('./public-runtime-surface-common');

const CONTRIBUTOR_ADMISSION_DEFAULT= Object.freeze({
  actor: Object.freeze({
    kind: 'human',
    handle: null,
    email: null,
    identity_surface: 'manual',
    agreement_surface: 'project-policy',
    repository_identifier: null,
    fingerprint: null
  }),
  ai_assistance: Object.freeze({
    used: false,
    assisted_by: null
  })
});

function parseBooleanLike(value) {
  if (['yes', 'true', '1', 'used'].includes(String(value).toLowerCase())) return true;
  if (['no', 'false', '0', 'none'].includes(String(value).toLowerCase())) return false;
  return null;
}

function contributorAdmissionValue(args = []) {
  const input = {
    actor: Object.assign({}, CONTRIBUTOR_ADMISSION_DEFAULT.actor),
    ai_assistance: Object.assign({}, CONTRIBUTOR_ADMISSION_DEFAULT.ai_assistance)
  };
  const allowed = new Set([
    '--admission-dry-run', OUTPUT_FLAG.json, OUTPUT_FLAG.text,
    '--actor', '--handle', '--email', '--repo', '--repository', '--fingerprint',
    '--identity-surface', '--agreement', '--ai-assisted', '--assisted-by'
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!allowed.has(arg)) {
      return { error: 'contributor supports only --admission-dry-run, --json, --text, --actor, --handle, --email, --repo, --repository, --fingerprint, --identity-surface, --agreement, --ai-assisted, or --assisted-by in this public gate' };
    }
    if (arg === '--admission-dry-run' || arg === OUTPUT_FLAG.json || arg === OUTPUT_FLAG.text) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('-')) return { error: `contributor ${arg} requires a value` };
    index += 1;
    if (arg === '--actor') input.actor.kind = value;
    else if (arg === '--handle') input.actor.handle = value;
    else if (arg === '--email') input.actor.email = value;
    else if (arg === '--repo' || arg === '--repository') input.actor.repository_identifier = value;
    else if (arg === '--fingerprint') input.actor.fingerprint = value;
    else if (arg === '--identity-surface') input.actor.identity_surface = value;
    else if (arg === '--agreement') input.actor.agreement_surface = value;
    else if (arg === '--ai-assisted') {
      const parsed = parseBooleanLike(value);
      if (parsed === null) return { error: 'contributor --ai-assisted requires yes or no' };
      input.ai_assistance.used = parsed;
    } else if (arg === '--assisted-by') {
      input.ai_assistance.assisted_by = value;
      input.ai_assistance.used = true;
    }
  }
  return { input };
}

function contributorActorId(input) {
  const kind = input.actor.kind || 'unknown';
  if (input.actor.email) return `actor:${kind}:${input.actor.email}`;
  if (input.actor.handle) return `actor:${kind}:${input.actor.handle}`;
  return `actor:${kind}:unidentified`;
}

function contributorAdmissionPreview(input) {
  const actorKinds = new Set(['human', 'agent', 'automation', 'maintainer', 'unknown']);
  const identitySurfaces = new Set(['git-author', 'github-user', 'ssh-fingerprint', 'signing-fingerprint', 'manual', 'unknown']);
  const agreementSurfaces = new Set(['project-policy', 'external-policy', 'none', 'unknown']);
  const kind = actorKinds.has(input.actor.kind) ? input.actor.kind : 'unknown';
  const identitySurface = identitySurfaces.has(input.actor.identity_surface) ? input.actor.identity_surface : 'unknown';
  const agreementSurface = agreementSurfaces.has(input.actor.agreement_surface) ? input.actor.agreement_surface : 'unknown';
  const aiUsed = Boolean(input.ai_assistance.used);
  const assistedBy = input.ai_assistance.assisted_by || (aiUsed ? null : null);
  const missing = [];
  if (!input.actor.handle && !input.actor.email) missing.push('actor_handle_or_email');
  if (!input.actor.repository_identifier) missing.push('repository_identifier');
  if (aiUsed && !assistedBy) missing.push('assisted_by_trailer');
  const disposition = missing.length === 0 ? 'candidate_admission_preview_only' : 'needs_admission_evidence';
  return {
    schema: 'agent-onboard-public-contributor-admission-dry-run-001',
    status: 'ok',
    package_name: PACKAGE_NAME,
    version: VERSION,
    release_line: RELEASE_LINE,
    command: 'agent-onboard contributor --admission-dry-run',
    mode: 'admission-dry-run',
    actor_record_preview: {
      actor_id: contributorActorId({ actor: Object.assign({}, input.actor, { kind }) }),
      actor_type: kind,
      handle: input.actor.handle || null,
      email: input.actor.email || null,
      identity_surface: identitySurface,
      agreement_surface: agreementSurface,
      repository_identifier: input.actor.repository_identifier || null,
      fingerprint: input.actor.fingerprint || null,
      authority: kind === 'maintainer' ? 'candidate_upstream_only' : 'candidate_only',
      local_actor_record_is_authority_now: false,
      mutation_authority_granted: false
    },
    ai_assistance_policy: {
      ai_assistance_may_be_disclosed: true,
      ai_assistance_used: aiUsed,
      permitted_ai_attribution_trailer: 'Assisted-by',
      assisted_by: assistedBy,
      assisted_by_required_when_ai_used: true,
      assisted_by_present: !aiUsed || Boolean(assistedBy),
      human_responsibility_required: true,
      ai_signed_off_by_allowed_now: false,
      ai_coauthor_claim_allowed_now: false,
      raw_ai_output_is_authority_now: false
    },
    admission_preview: {
      disposition,
      missing_evidence: missing,
      candidate_created_in_memory: true,
      canonical_contributor_record_created: false,
      contributor_ledger_written: false,
      work_item_created: false,
      admitted_claim_created: false,
      github_api_used: false,
      git_mutation: false,
      requires_explicit_future_admission: true
    },
    contribution_trailer_guidance: {
      signed_off_by_ai_allowed_now: false,
      assisted_by_required_when_ai_used: true,
      examples: aiUsed ? [assistedBy || 'Assisted-by: <tool-or-agent-name>'] : []
    },
    recommended_next_commands: [
      'agent-onboard issue --classify-dry-run --text',
      'agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>',
      'agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>'
    ],
    boundary: {
      writes_files: false,
      writes_consuming_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_consumer_repository: false,
      validates_arbitrary_consumer_config_file: false,
      contributor_ledger_write_allowed_now: false,
      canonical_contributor_record_creation_allowed_now: false,
      claim_admission_allowed_now: false,
      github_api_dependency_now: false,
      github_mutation_allowed_now: false,
      git_mutation: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false
    }
  };
}

function contributorAdmissionText(result) {
  return [
    'agent-onboard contributor admission dry-run',
    `Actor: ${result.actor_record_preview.actor_type}${result.actor_record_preview.handle ? ` (${result.actor_record_preview.handle})` : ''}`,
    `Identity surface: ${result.actor_record_preview.identity_surface}`,
    `Agreement surface: ${result.actor_record_preview.agreement_surface}`,
    `Disposition: ${result.admission_preview.disposition}`,
    `AI assistance used: ${result.ai_assistance_policy.ai_assistance_used}`,
    `Assisted-by present: ${result.ai_assistance_policy.assisted_by_present}`,
    'Authority: candidate only; no canonical contributor record, admitted claim, or ledger write created.',
    'Boundary: no files written, no GitHub API, no Git mutation, no network, no publish.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`)
  ].join('\n') + '\n';
}

const contributorAdmissionService = Object.freeze({
  input: contributorAdmissionValue,
  preview: contributorAdmissionPreview,
  text: contributorAdmissionText
});

module.exports = Object.freeze({ contributorAdmissionService });
