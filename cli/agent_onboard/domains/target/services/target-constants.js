'use strict';

function freezeEntries(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

const PACKAGE_NAME = 'agent-onboard';

const TARGET_DOCTOR = Object.freeze({
  schema: 'agent-onboard-target-doctor-result-001',
  command: 'agent-onboard target doctor',
  commandWithJson: 'agent-onboard target doctor --json',
  commandFamily: 'target doctor',
  flag: Object.freeze({
    json: '--json',
    target: '--target'
  }),
  readiness: Object.freeze({
    ready: 'ready',
    needsOnboarding: 'needs_onboarding',
    blocked: 'blocked'
  }),
  status: Object.freeze({
    ok: 'ok',
    error: 'error',
    present: 'present',
    missing: 'missing',
    valid: 'valid',
    invalid: 'invalid',
    notApplicable: 'not_applicable',
    customized: 'customized'
  })
});

const TARGET_REPAIR = Object.freeze({
  schema: 'agent-onboard-target-repair-result-001',
  commandFamily: 'target repair',
  mode: Object.freeze({
    plan: 'plan',
    write: 'write'
  }),
  status: Object.freeze({
    ok: 'ok',
    error: 'error'
  }),
  action: Object.freeze({
    create: 'create',
    keep: 'keep',
    overwrite: 'overwrite',
    skipExisting: 'skip_existing'
  }),
  skippedReason: Object.freeze({
    existingNonIdenticalFile: 'existing_non_identical_file'
  })
});

const TARGET_PROFILE = Object.freeze({
  schema: 'agent-onboard-target-profile-result-001',
  command: 'agent-onboard target profile --json',
  commandFamily: 'target profile',
  status: Object.freeze({
    ok: 'ok',
    error: 'error'
  }),
  scriptPurpose: Object.freeze({
    test: 'test',
    build: 'build',
    lint: 'lint',
    format: 'format',
    start: 'start',
    dev: 'dev'
  })
});

const TARGET_DOCTOR_FILE = Object.freeze({
  packageJson: 'package.json',
  runtimeNamespace: '.agent-onboard/runtime-namespace.json',
  runtimeProject: '.agent-onboard/project.json',
  workItems: '.agent-onboard/work-items.json',
  agentsMd: 'AGENTS.md',
  llmsTxt: 'llms.txt',
  authorityPath: '.agent-onboard/authority-path.json'
});

const TARGET_DOCTOR_SCHEMA = Object.freeze({
  runtimeNamespace: 'agent-onboard-target-runtime-namespace-001',
  runtimeProject: 'agent-onboard-target-runtime-project-001',
  workItems: 'agent-onboard-target-work-items-001',
  authorityPath: 'agent-onboard-authority-path-001'
});

const TARGET_DOCTOR_PACKAGE_MANAGER_FILES = freezeEntries([
  { name: 'npm', file: 'package-lock.json' },
  { name: 'pnpm', file: 'pnpm-lock.yaml' },
  { name: 'yarn', file: 'yarn.lock' },
  { name: 'bun', file: 'bun.lockb' },
  { name: 'bun', file: 'bun.lock' }
]);

const TARGET_DOCTOR_LANGUAGE_MARKERS = freezeEntries([
  { name: 'node', files: Object.freeze(['package.json']) },
  { name: 'typescript', files: Object.freeze(['tsconfig.json']) },
  { name: 'python', files: Object.freeze(['pyproject.toml', 'requirements.txt', 'Pipfile']) },
  { name: 'go', files: Object.freeze(['go.mod']) },
  { name: 'rust', files: Object.freeze(['Cargo.toml']) },
  { name: 'java', files: Object.freeze(['pom.xml', 'build.gradle', 'build.gradle.kts']) },
  { name: 'dotnet', files: Object.freeze(['global.json']) },
  { name: 'php', files: Object.freeze(['composer.json']) }
]);

const TARGET_DOCTOR_FRAMEWORK_PACKAGES = freezeEntries([
  { name: 'react', packages: Object.freeze(['react']) },
  { name: 'next', packages: Object.freeze(['next']) },
  { name: 'vue', packages: Object.freeze(['vue']) },
  { name: 'svelte', packages: Object.freeze(['svelte']) },
  { name: 'angular', packages: Object.freeze(['@angular/core']) },
  { name: 'vite', packages: Object.freeze(['vite']) },
  { name: 'express', packages: Object.freeze(['express']) },
  { name: 'fastify', packages: Object.freeze(['fastify']) },
  { name: 'nestjs', packages: Object.freeze(['@nestjs/core']) },
  { name: 'jest', packages: Object.freeze(['jest']) },
  { name: 'vitest', packages: Object.freeze(['vitest']) }
]);

const TARGET_DOCTOR_CI_FILES = freezeEntries([
  { name: 'github_actions', file: '.github/workflows' },
  { name: 'gitlab_ci', file: '.gitlab-ci.yml' },
  { name: 'circleci', file: '.circleci/config.yml' },
  { name: 'azure_pipelines', file: 'azure-pipelines.yml' }
]);

const TARGET_DOCTOR_DOC_FILES = Object.freeze(['README.md', TARGET_DOCTOR_FILE.agentsMd, TARGET_DOCTOR_FILE.llmsTxt, 'CONTRIBUTING.md']);

const TARGET_PROFILE_SCRIPT_MARKERS = freezeEntries([
  { purpose: TARGET_PROFILE.scriptPurpose.test, names: Object.freeze(['test', 'test:unit', 'test:ci', 'test:e2e']) },
  { purpose: TARGET_PROFILE.scriptPurpose.build, names: Object.freeze(['build', 'compile']) },
  { purpose: TARGET_PROFILE.scriptPurpose.lint, names: Object.freeze(['lint', 'lint:fix']) },
  { purpose: TARGET_PROFILE.scriptPurpose.format, names: Object.freeze(['format', 'fmt']) },
  { purpose: TARGET_PROFILE.scriptPurpose.start, names: Object.freeze(['start', 'serve']) },
  { purpose: TARGET_PROFILE.scriptPurpose.dev, names: Object.freeze(['dev', 'develop']) }
]);


module.exports = Object.freeze({
  PACKAGE_NAME,
  TARGET_DOCTOR,
  TARGET_REPAIR,
  TARGET_PROFILE,
  TARGET_DOCTOR_FILE,
  TARGET_DOCTOR_SCHEMA,
  TARGET_DOCTOR_PACKAGE_MANAGER_FILES,
  TARGET_DOCTOR_LANGUAGE_MARKERS,
  TARGET_DOCTOR_FRAMEWORK_PACKAGES,
  TARGET_DOCTOR_CI_FILES,
  TARGET_DOCTOR_DOC_FILES,
  TARGET_PROFILE_SCRIPT_MARKERS
});
