'use strict';

const fs = require('fs');
const path = require('path');

const TARGET_MEMORY_SURFACE_CANDIDATES = Object.freeze([
  { path: 'AGENTS.md', kind: 'agent_instruction', authority: 'candidate_first_read', read_policy: 'read_summary_or_full_text_on_agent_request' },
  { path: 'llms.txt', kind: 'ai_discovery', authority: 'candidate_discovery', read_policy: 'read_before_agent_workflow_selection' },
  { path: 'README.md', kind: 'human_project_overview', authority: 'candidate_context', read_policy: 'read_summary_or_full_text_on_agent_request' },
  { path: 'CLAUDE.md', kind: 'model_specific_agent_instruction', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.github/copilot-instructions.md', kind: 'model_specific_agent_instruction', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.cursor/rules', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/agents', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/commands', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.claude/skills', kind: 'model_specific_agent_instruction_directory', authority: 'candidate_memory', read_policy: 'metadata_only_in_this_command' },
  { path: '.repo-identifier', kind: 'repo_identity_marker', authority: 'candidate_identity', read_policy: 'metadata_only_in_this_command' },
  { path: '.agent-onboard/target.json', kind: 'target_config', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/project.json', kind: 'target_project_state', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/work-items.json', kind: 'work_item_state', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/authority-path.json', kind: 'authority_path', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/authority-index.json', kind: 'authority_compact_index', authority: 'target_owned_state', read_policy: 'schema_metadata_only_in_this_command' },
  { path: '.agent-onboard/claims.jsonl', kind: 'claims_ledger', authority: 'target_owned_state', read_policy: 'metadata_only_in_this_command' },
  { path: '.agent-onboard/target-memory.json', kind: 'target_memory_descriptor', authority: 'target_owned_state', read_policy: 'metadata_only_in_this_command' }
]);

const TARGET_ROOT_MANIFEST_CANDIDATES = Object.freeze([
  { path: 'package.json', ecosystem: 'node-npm' },
  { path: 'Cargo.toml', ecosystem: 'rust-cargo' },
  { path: 'pyproject.toml', ecosystem: 'python' },
  { path: 'go.mod', ecosystem: 'go' },
  { path: 'pom.xml', ecosystem: 'jvm-maven' },
  { path: 'build.gradle', ecosystem: 'jvm-gradle' },
  { path: 'deno.json', ecosystem: 'deno' }
]);

function safeRelativeStat(root, rel) {
  const absolute = path.resolve(root, rel);
  const rootWithSep = path.resolve(root) + path.sep;
  if (absolute !== path.resolve(root) && !absolute.startsWith(rootWithSep)) {
    return { path: rel, present: false, kind: 'invalid_path', bytes: null };
  }
  if (!fs.existsSync(absolute)) return { path: rel, present: false, kind: 'missing', bytes: null };
  const stat = fs.statSync(absolute);
  return {
    path: rel,
    present: true,
    kind: stat.isDirectory() ? 'directory' : (stat.isFile() ? 'file' : 'other'),
    bytes: stat.isFile() ? stat.size : null
  };
}

function createTargetMemoryService(deps) {
  const packageName = deps.packageName || deps.PACKAGE_NAME || 'agent-onboard';
  const version = deps.version;
  const releaseLine = deps.releaseLine;
  if (!version) throw new Error('createTargetMemoryService missing dependency: version');
  if (!releaseLine) throw new Error('createTargetMemoryService missing dependency: releaseLine');

  function targetMemoryRootManifest(root) {
    const seen = TARGET_ROOT_MANIFEST_CANDIDATES.filter((candidate) => fs.existsSync(path.join(root, candidate.path)));
    const primary = seen[0] || null;
    return {
      primary_manifest: primary ? primary.path : null,
      ecosystem: primary ? primary.ecosystem : 'unknown',
      manifests_seen: seen.map((candidate) => candidate.path)
    };
  }

  function targetMemoryDescriptor(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot)) {
      return {
        schema: 'agent-onboard-public-target-memory-preview-001',
        status: 'error',
        package_name: packageName,
        version,
        release_line: releaseLine,
        command: 'agent-onboard target memory --preview',
        command_family: 'target memory',
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        errors: [`target path does not exist: ${absoluteTargetRoot}`],
        writes_performed: false,
        boundary: {
          writes_files: false,
          writes_target_repository_state: false,
          reads_file_contents: false,
          stores_target_ai_file_contents: false,
          imports_hidden_model_memory: false,
          treats_chat_history_as_authority: false,
          scans_arbitrary_private_files: false,
          network: false,
          git_mutation: false
        }
      };
    }
    if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: 'agent-onboard-public-target-memory-preview-001',
        status: 'error',
        package_name: packageName,
        version,
        release_line: releaseLine,
        command: 'agent-onboard target memory --preview',
        command_family: 'target memory',
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
        errors: [`target path is not a directory: ${absoluteTargetRoot}`],
        writes_performed: false,
        boundary: {
          writes_files: false,
          writes_target_repository_state: false,
          reads_file_contents: false,
          stores_target_ai_file_contents: false,
          imports_hidden_model_memory: false,
          treats_chat_history_as_authority: false,
          scans_arbitrary_private_files: false,
          network: false,
          git_mutation: false
        }
      };
    }

    const rootManifest = targetMemoryRootManifest(absoluteTargetRoot);
    const surfaces = TARGET_MEMORY_SURFACE_CANDIDATES.map((candidate) => {
      const observed = safeRelativeStat(absoluteTargetRoot, candidate.path);
      return {
        path: candidate.path,
        kind: candidate.kind,
        authority: candidate.authority,
        read_policy: candidate.read_policy,
        present: observed.present,
        observed_kind: observed.kind,
        bytes: observed.bytes,
        content_imported: false
      };
    });
    const presentSurfaces = surfaces.filter((surface) => surface.present);
    const authorityGroups = presentSurfaces.reduce((acc, surface) => {
      if (!acc[surface.authority]) acc[surface.authority] = [];
      acc[surface.authority].push(surface.path);
      return acc;
    }, {});
    return {
      schema: 'agent-onboard-public-target-memory-preview-001',
      status: 'ok',
      package_name: packageName,
      version,
      release_line: releaseLine,
      command: 'agent-onboard target memory --preview',
      command_family: 'target memory',
      target: {
        name: path.basename(absoluteTargetRoot) || 'target-repo',
        kind: 'directory',
        root: absoluteTargetRoot,
        primary_manifest: rootManifest.primary_manifest,
        ecosystem: rootManifest.ecosystem,
        manifests_seen: rootManifest.manifests_seen
      },
      memory_model: {
        repo_native_memory_surface_is_candidate_authority: true,
        target_owned_state_may_be_authority_after_target_owner_admission: true,
        hidden_model_memory_is_authority: false,
        chat_history_is_authority: false,
        provider_runtime_state_is_target_authority: false,
        descriptor_preview_is_authority_now: false
      },
      surfaces,
      summary: {
        known_surface_count: surfaces.length,
        present_surface_count: presentSurfaces.length,
        present_surfaces: presentSurfaces.map((surface) => surface.path),
        authority_groups: authorityGroups
      },
      output_policy: {
        compact_default: true,
        file_contents_inlined: false,
        target_ai_memory_content_imported: false,
        provider_authority_files_inlined: false,
        stores_target_ai_file_metadata_only: true
      },
      recommended_next_commands: [
        'agent-onboard target doctor --text',
        'agent-onboard target profile --text',
        'agent-onboard target onboarding --plan',
        'agent-onboard work-items --next --text'
      ],
      writes_performed: false,
      boundary: {
        writes_files: false,
        writes_target_repository_state: false,
        reads_file_contents: false,
        stores_target_ai_file_contents: false,
        imports_hidden_model_memory: false,
        treats_chat_history_as_authority: false,
        scans_arbitrary_private_files: false,
        bounded_known_path_probe_only: true,
        installs_dependencies: false,
        runs_build_test_deploy: false,
        runs_managed_project_commands: false,
        publishes_package: false,
        network: false,
        git_mutation: false
      }
    };
  }

  function targetMemoryText(result) {
    if (result.status !== 'ok') {
      return [
        'agent-onboard target memory',
        `Status: ${result.status}`,
        `Target: ${result.target ? result.target.root : 'unknown'}`,
        `Errors: ${(result.errors || []).join('; ') || 'none'}`,
        'Writes performed: false'
      ].join('\n') + '\n';
    }
    const present = result.summary.present_surfaces.length > 0 ? result.summary.present_surfaces.join(', ') : 'none';
    const groups = Object.keys(result.summary.authority_groups).sort().map((key) => `  - ${key}: ${result.summary.authority_groups[key].join(', ')}`);
    return [
      'agent-onboard target memory',
      `Target: ${result.target.name} (${result.target.ecosystem})`,
      `Root: ${result.target.root}`,
      `Known surfaces: ${result.summary.known_surface_count}`,
      `Present surfaces: ${result.summary.present_surface_count}`,
      `Present: ${present}`,
      'Authority groups:',
      ...(groups.length > 0 ? groups : ['  none']),
      'Policy: metadata-only preview; file contents are not imported or stored.',
      'Next steps:',
      ...result.recommended_next_commands.map((command) => `  - ${command}`),
      'Writes performed: false'
    ].join('\n') + '\n';
  }

  return Object.freeze({
    targetMemoryDescriptor,
    targetMemoryText
  });
}

module.exports = Object.freeze({
  createTargetMemoryService,
  TARGET_MEMORY_SURFACE_CANDIDATES,
  TARGET_ROOT_MANIFEST_CANDIDATES
});
