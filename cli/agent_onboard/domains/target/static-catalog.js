'use strict';

function freezeList(items) {
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

const TARGET_CONFIG_SCHEMA = {
  schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'agent-onboard-target-config-001',
  type: 'object',
  required: ['schema', 'control', 'project', 'boundaries', 'surfaces'],
  additionalProperties: false,
  properties: {
    schema: { const: 'agent-onboard-target-config-001' },
    control: {
      type: 'object',
      required: ['package_name', 'requested_mode', 'authority_level'],
      additionalProperties: false,
      properties: {
        package_name: { const: 'agent-onboard' },
        requested_mode: { enum: ['target_dry_run', 'target_write'] },
        authority_level: { enum: ['L1_read_only_preview', 'L2_explicit_write'] }
      }
    },
    project: {
      type: 'object',
      required: ['name', 'kind'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', minLength: 1 },
        kind: { type: 'string', minLength: 1 }
      }
    },
    boundaries: {
      type: 'object',
      required: [
        'writes_allowed',
        'managed_project_commands_allowed',
        'create_agent_onboard_runtime_state',
        'install_dependencies',
        'run_build_test_deploy',
        'publish_or_push'
      ],
      additionalProperties: false,
      properties: {
        writes_allowed: { type: 'boolean' },
        managed_project_commands_allowed: { type: 'integer', minimum: 0 },
        create_agent_onboard_runtime_state: { type: 'boolean' },
        install_dependencies: { type: 'boolean' },
        run_build_test_deploy: { type: 'boolean' },
        publish_or_push: { type: 'boolean' }
      }
    },
    surfaces: {
      type: 'object',
      required: ['include', 'exclude'],
      additionalProperties: false,
      properties: {
        include: { type: 'array', items: { type: 'string' } },
        exclude: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

  const BOUNDARY_GUARD_CONTRACT = Object.freeze({
  schema: 'agent-onboard-public-boundary-guard-enforcement-seed-contract-001',
  title: 'Agent-Onboard Public Boundary Guard Enforcement Seed Gate',
  package_name: 'agent-onboard',
  command: 'agent-onboard guard --check-boundary',
  canonical_target_config_file: 'agent-onboard.target.json',
  enforcement_mode: 'fail_closed',
  required_target_config_values: Object.freeze({
    schema: 'agent-onboard-target-config-001',
    'control.package_name': 'agent-onboard',
    'control.requested_mode': 'target_dry_run',
    'control.authority_level': 'L1_read_only_preview',
    'boundaries.writes_allowed': false,
    'boundaries.managed_project_commands_allowed': 0,
    'boundaries.create_agent_onboard_runtime_state': false,
    'boundaries.install_dependencies': false,
    'boundaries.run_build_test_deploy': false,
    'boundaries.publish_or_push': false
  }),
  forbidden_true_boundary_fields: Object.freeze([
    'boundaries.writes_allowed',
    'boundaries.create_agent_onboard_runtime_state',
    'boundaries.install_dependencies',
    'boundaries.run_build_test_deploy',
    'boundaries.publish_or_push'
  ])
});

  
function createPublicTargetStaticCatalog({ publicReleaseContract }) {
  if (!publicReleaseContract || !publicReleaseContract.release_line) {
    throw new Error('publicReleaseContract.release_line is required');
  }

  const TARGET_ONBOARDING_SURFACE_PLAN = Object.freeze({
    schema: 'agent-onboard-public-target-onboarding-surface-plan-001',
    title: 'Agent-Onboard Public Target Onboarding Surface Plan',
    package_name: 'agent-onboard',
    release_line: publicReleaseContract.release_line,
    command: 'agent-onboard target onboarding --plan',
    fixture_command: 'agent-onboard target onboarding --fixture',
    purpose: 'Declare the public, read-only onboarding sequence for a target repository before write-capable onboarding commands are used.',
    canonical_files: Object.freeze([
      'agent-onboard.target.json',
      '.agent-onboard/runtime-namespace.json',
      '.agent-onboard/project.json',
      '.agent-onboard/work-items.json',
      'AGENTS.md',
      'llms.txt',
      '.agent-onboard/authority-path.json'
    ]),
    phases: freezeList([
      {
        id: 'discover_target_surface',
        command: 'agent-onboard target onboarding --plan',
        output: 'read-only onboarding sequence and boundary summary',
        writes_files: false
      },
      {
        id: 'preview_boundary_config',
        command: 'agent-onboard target-config --template',
        output: 'target boundary config template',
        writes_files: false
      },
      {
        id: 'preview_runtime_state',
        command: 'agent-onboard init --dry-run',
        output: 'planned canonical target files without writes',
        writes_files: false
      },
      {
        id: 'preview_agent_instructions',
        command: 'agent-onboard agents --preview',
        output: 'AGENTS.md preview for human and agent operators',
        writes_files: false
      },
      {
        id: 'write_explicit_full_onboarding',
        command: 'agent-onboard target onboarding --write',
        output: 'agent-onboard.target.json, .agent-onboard/runtime-namespace.json, .agent-onboard/project.json, .agent-onboard/work-items.json, AGENTS.md, llms.txt, and .agent-onboard/authority-path.json when explicitly authorized',
        writes_files: true
      },
      {
        id: 'write_explicit_boundary_config',
        command: 'agent-onboard target bootstrap --write',
        output: 'agent-onboard.target.json when explicitly authorized',
        writes_files: true,
        lower_level_command: true
      },
      {
        id: 'write_explicit_runtime_state',
        command: 'agent-onboard target-instance takeover --write',
        output: '.agent-onboard/project.json and .agent-onboard/work-items.json when explicitly authorized',
        writes_files: true,
        lower_level_command: true
      },
      {
        id: 'verify_boundary',
        command: 'agent-onboard guard --check-boundary',
        output: 'fail-closed boundary result for read-only target config',
        writes_files: false
      }
    ]),
    boundary: Object.freeze({
      plan_writes_files: false,
      plan_git_mutation: false,
      plan_installs_dependencies: false,
      plan_runs_build_test_deploy: false,
      plan_publishes_or_pushes: false,
      write_commands_require_explicit_write_flag: true,
      force_overwrite_requires_explicit_force_flag: true
    }),
    next_candidate_gate: Object.freeze({
      title: 'Public architecture map gate',
      intent: 'Declare the public architecture kernel before source code is physically partitioned.'
    })
  });

  const TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX = Object.freeze({
    schema: 'agent-onboard-public-target-onboarding-fixture-matrix-002',
    title: 'Agent-Onboard Public Target Onboarding Fixture Matrix',
    package_name: 'agent-onboard',
    release_line: publicReleaseContract.release_line,
    command: 'agent-onboard target onboarding --fixture',
    purpose: 'Declare no-write regression fixtures and explicit-write boundary projections for target onboarding behavior.',
    fixtures: freezeList([
      {
        id: 'target_onboarding_plan_no_write',
        command: 'agent-onboard target onboarding --plan',
        expected_status: 'ok',
        validates: Object.freeze(['target identity detection', 'canonical file planning', 'plan boundary reports no writes'])
      },
      {
        id: 'target_bootstrap_dry_run_empty_target',
        command: 'agent-onboard target bootstrap --dry-run',
        expected_status: 'ok',
        validates: Object.freeze(['agent-onboard.target.json create plan', 'writes_performed false', 'no dependency install'])
      },
      {
        id: 'target_instance_takeover_dry_run_empty_target',
        command: 'agent-onboard target-instance takeover --dry-run',
        expected_status: 'ok',
        validates: Object.freeze(['.agent-onboard/project.json create plan', '.agent-onboard/work-items.json create plan', 'writes_performed false'])
      },
      {
        id: 'agents_preview_empty_target',
        command: 'agent-onboard agents --preview',
        expected_status: 'ok',
        validates: Object.freeze(['AGENTS.md create plan', 'writes_performed false', 'canonical agent instructions preview'])
      },
      {
        id: 'target_onboarding_explicit_write_empty_target',
        command: 'agent-onboard target onboarding --write',
        expected_status: 'ok',
        validates: Object.freeze(['explicit write flag required', 'aggregate canonical file set only', 'no dependency install', 'no Git mutation', 'no publish or push'])
      },
      {
        id: 'target_bootstrap_conflict_dry_run',
        command: 'agent-onboard target bootstrap --dry-run',
        expected_status: 'error',
        detects: 'existing divergent target config is reported as a conflict without writes'
      },
      {
        id: 'target_bootstrap_force_dry_run',
        command: 'agent-onboard target bootstrap --dry-run --force',
        expected_status: 'ok',
        detects: 'force changes the planned action to overwrite while dry-run still writes nothing'
      }
    ]),
    boundary: Object.freeze({
      fixture_writes_files: false,
      fixture_git_mutation: false,
      fixture_installs_dependencies: false,
      fixture_runs_build_test_deploy: false,
      fixture_publishes_or_pushes: false,
      validates_explicit_write_flag_boundary: true,
      validates_aggregate_write_command: true,
      validates_conflict_detection: true,
      validates_force_preview_without_write: true
    }),
    next_candidate_gate: Object.freeze({
      title: 'Public architecture map gate',
      intent: 'Declare the public architecture kernel before source code is physically partitioned.'
    })
  });

  return Object.freeze({
    TARGET_CONFIG_SCHEMA,
    BOUNDARY_GUARD_CONTRACT,
    TARGET_ONBOARDING_SURFACE_PLAN,
    TARGET_ONBOARDING_DRY_RUN_FIXTURE_MATRIX
  });
}

module.exports = {
  TARGET_CONFIG_SCHEMA,
  BOUNDARY_GUARD_CONTRACT,
  createPublicTargetStaticCatalog
};
