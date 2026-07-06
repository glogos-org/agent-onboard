'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'agent-onboard';
const TARGET_INVENTORY_SCHEMA = 'agent-onboard-public-target-runtime-inventory-001';
const TARGET_INVENTORY_COMMAND = 'agent-onboard target inventory --preview';
const TARGET_INVENTORY_FAMILY = 'target inventory';
const DEFAULT_EXCLUDED_DIRS = Object.freeze(['.git', 'node_modules', 'node_module', '.agent-onboard', 'dist', 'build', 'coverage']);
const ROOT_MANIFEST_CANDIDATES = Object.freeze([
  Object.freeze({ path: 'package.json', ecosystem: 'node-npm' }),
  Object.freeze({ path: 'Cargo.toml', ecosystem: 'rust-cargo' }),
  Object.freeze({ path: 'pyproject.toml', ecosystem: 'python' }),
  Object.freeze({ path: 'go.mod', ecosystem: 'go' }),
  Object.freeze({ path: 'pom.xml', ecosystem: 'jvm-maven' }),
  Object.freeze({ path: 'build.gradle', ecosystem: 'jvm-gradle' }),
  Object.freeze({ path: 'deno.json', ecosystem: 'deno' })
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (_) { return null; }
}

function readTextIfExists(filePath, maxBytes = 256 * 1024) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  const buffer = fs.readFileSync(filePath);
  return buffer.slice(0, maxBytes).toString('utf8');
}

function listFilesRecursive(root, options = {}) {
  const exclude = new Set(options.excludeDirs || DEFAULT_EXCLUDED_DIRS);
  const maxFiles = Number.isInteger(options.maxFiles) && options.maxFiles > 0 ? options.maxFiles : 10000;
  const files = [];
  let truncated = false;
  function walk(dir) {
    if (files.length >= maxFiles) {
      truncated = true;
      return;
    }
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { return; }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (files.length >= maxFiles) {
        truncated = true;
        return;
      }
      const absolute = path.join(dir, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (exclude.has(entry.name)) continue;
        walk(absolute);
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }
  }
  walk(root);
  return { files: files.sort(), truncated };
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

function inferProjectKind(packageJson, manifest) {
  if (manifest.ecosystem !== 'node-npm') return manifest.ecosystem.replace(/-.+$/, '') || 'generic';
  if (!isPlainObject(packageJson)) return 'node';
  const allDeps = Object.assign({}, packageJson.dependencies || {}, packageJson.devDependencies || {}, packageJson.peerDependencies || {});
  if (allDeps.react || allDeps.vue || allDeps.svelte || allDeps.next || allDeps.vite) return 'node-web';
  if (packageJson.bin || allDeps.commander || allDeps.yargs || allDeps.minimist) return 'node-cli';
  return 'node';
}

function extensionCounts(files) {
  const counts = {};
  for (const file of files) {
    const ext = path.extname(file) || '[no_ext]';
    counts[ext] = (counts[ext] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0])));
}

function topLevelDirectoryRole(name) {
  const lower = String(name || '').toLowerCase();
  if (lower === 'test' || lower === 'tests' || lower.includes('fixture')) return 'tests';
  if (lower === 'example' || lower === 'examples') return 'examples';
  if (lower === 'doc' || lower === 'docs') return 'docs';
  if (lower === 'bin' || lower === 'cli' || lower.includes('cli')) return 'cli';
  if (lower === 'src' || lower === 'source' || /^l\d+-/.test(lower)) return 'source';
  if (lower === '.github') return 'ci';
  if (lower === 'scripts' || lower === 'tools') return 'automation';
  return 'source_or_config';
}

function sourceRoots(root, files) {
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); }
  catch (_) { return []; }
  return entries
    .filter((entry) => entry.isDirectory() && !DEFAULT_EXCLUDED_DIRS.includes(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const prefix = `${entry.name}/`;
      const rootFiles = files.filter((file) => file.startsWith(prefix));
      return Object.freeze({ path: prefix, role: topLevelDirectoryRole(entry.name), file_count: rootFiles.length });
    });
}

function extractRunCommandsFromYaml(text) {
  const commands = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?run:\s*(.+?)\s*$/);
    if (match) commands.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return commands.slice(0, 50);
}

function extractReadmeUsageCommands(text) {
  const commands = [];
  const seen = new Set();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\$\s*/, '');
    if (/^(bun|npm|npx|node|yarn|pnpm|make|python|pytest|go|cargo)\s+/.test(line) && !seen.has(line)) {
      seen.add(line);
      commands.push(line);
    }
  }
  return commands.slice(0, 50);
}

function packageManagerSurface(root, packageJson) {
  const lockfiles = ['bun.lockb', 'bun.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter((name) => fs.existsSync(path.join(root, name)));
  const declared = isPlainObject(packageJson) && typeof packageJson.packageManager === 'string' ? packageJson.packageManager : null;
  const detected = lockfiles.some((name) => name.startsWith('bun.')) ? 'bun'
    : lockfiles.includes('pnpm-lock.yaml') ? 'pnpm'
      : lockfiles.includes('yarn.lock') ? 'yarn'
        : lockfiles.includes('package-lock.json') ? 'npm'
          : (declared ? declared.split('@')[0] : 'unknown');
  return { package_manager: detected, package_manager_declared: declared, lockfiles };
}

function identityAndProvenance(root, files) {
  const repoIdentifier = readTextIfExists(path.join(root, '.repo-identifier'), 8192);
  const goiPath = path.join(root, '.o', 'GordianOpenIntegrity.yaml');
  const goiText = readTextIfExists(goiPath, 64 * 1024);
  return {
    repo_identifier_file: repoIdentifier ? '.repo-identifier' : null,
    repository_did: repoIdentifier ? repoIdentifier.trim().split(/\s+/)[0] : null,
    gordian_open_integrity_yaml: goiText ? '.o/GordianOpenIntegrity.yaml' : null,
    github_workflows: files.filter((file) => file.startsWith('.github/workflows/') && /\.ya?ml$/.test(file)),
    signing_surface_detected: Boolean(goiText && /SigningKey|Signature|Current Mark|Inception Mark/.test(goiText)),
    content_inlined: false
  };
}

function commandSurface(root, files, packageJson) {
  const workflows = files.filter((file) => file.startsWith('.github/workflows/') && /\.ya?ml$/.test(file));
  const ciCommands = [];
  for (const workflow of workflows) {
    const text = readTextIfExists(path.join(root, workflow), 64 * 1024);
    for (const command of extractRunCommandsFromYaml(text)) ciCommands.push({ workflow, command });
  }
  const readmeFiles = files.filter((file) => /^readme(\.|$)/i.test(path.basename(file)) || ['CONCEPTS.md', 'PAPER.md'].includes(path.basename(file))).slice(0, 10);
  const readmeUsageCommands = [];
  for (const file of readmeFiles) {
    const text = readTextIfExists(path.join(root, file), 256 * 1024);
    for (const command of extractReadmeUsageCommands(text)) readmeUsageCommands.push({ file, command });
  }
  return {
    declared_scripts: isPlainObject(packageJson) && isPlainObject(packageJson.scripts) ? packageJson.scripts : {},
    ci_commands: ciCommands,
    readme_usage_commands: readmeUsageCommands,
    admission: {
      inventory_scan_allowed_now: true,
      execution_allowed_now: false,
      dependency_install_allowed_now: false,
      managed_project_commands_executed_by_inventory: false
    }
  };
}

function targetInventory(targetRoot = process.cwd(), deps = {}) {
  const version = deps.version || '0.0.0';
  const releaseLine = deps.releaseLine || 'public_target_work_items_preview_product_gate';
  const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
  const base = {
    schema: TARGET_INVENTORY_SCHEMA,
    package_name: PACKAGE_NAME,
    version,
    release_line: releaseLine,
    command: TARGET_INVENTORY_COMMAND,
    command_family: TARGET_INVENTORY_FAMILY
  };
  if (!fs.existsSync(absoluteTargetRoot)) {
    return Object.assign(base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
      errors: [`target path does not exist: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: { writes_files: false, writes_target_repository_state: false, scans_target_repository: false, git_mutation: false, network: false, publishes_package: false }
    });
  }
  if (!fs.statSync(absoluteTargetRoot).isDirectory()) {
    return Object.assign(base, {
      status: 'error',
      target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'file', root: absoluteTargetRoot },
      errors: [`target path is not a directory: ${absoluteTargetRoot}`],
      writes_performed: false,
      boundary: { writes_files: false, writes_target_repository_state: false, scans_target_repository: false, git_mutation: false, network: false, publishes_package: false }
    });
  }

  const manifest = rootManifest(absoluteTargetRoot);
  const packageJson = safeReadJson(path.join(absoluteTargetRoot, 'package.json')) || {};
  const listed = listFilesRecursive(absoluteTargetRoot);
  const files = listed.files;
  const pkgManager = packageManagerSurface(absoluteTargetRoot, packageJson);
  const inventory = {
    package_surface: {
      ...pkgManager,
      name: isPlainObject(packageJson) && typeof packageJson.name === 'string' ? packageJson.name : null,
      version: isPlainObject(packageJson) && typeof packageJson.version === 'string' ? packageJson.version : null,
      type: isPlainObject(packageJson) && typeof packageJson.type === 'string' ? packageJson.type : null,
      main: isPlainObject(packageJson) && typeof packageJson.main === 'string' ? packageJson.main : null,
      bin: isPlainObject(packageJson) && isPlainObject(packageJson.bin) ? packageJson.bin : (typeof packageJson.bin === 'string' ? packageJson.bin : null),
      exports: isPlainObject(packageJson) && Object.prototype.hasOwnProperty.call(packageJson, 'exports') ? packageJson.exports : null,
      script_names: isPlainObject(packageJson.scripts) ? Object.keys(packageJson.scripts).sort() : []
    },
    source_surface: {
      source_roots: sourceRoots(absoluteTargetRoot, files),
      total_files_excluding_git_node_modules_agent_onboard: files.length,
      file_list_truncated: listed.truncated,
      extension_counts: extensionCounts(files)
    },
    command_surface: commandSurface(absoluteTargetRoot, files, packageJson),
    identity_and_provenance: identityAndProvenance(absoluteTargetRoot, files),
    boundaries: {
      writes_files: false,
      writes_target_repository_state: false,
      allowed_write_paths: [],
      source_mutation_allowed_now: false,
      git_mutation_allowed_now: false,
      dependency_install_allowed_now: false,
      managed_project_command_execution_allowed_now: false,
      network_now: false
    }
  };
  return Object.assign(base, {
    status: 'ok',
    target: {
      name: inventory.package_surface.name || path.basename(absoluteTargetRoot) || 'target-repo',
      kind: inferProjectKind(packageJson, manifest),
      root: absoluteTargetRoot,
      primary_manifest: manifest.primary_manifest,
      ecosystem: manifest.ecosystem,
      manifests_seen: manifest.manifests_seen
    },
    inventory,
    summary: {
      source_roots: inventory.source_surface.source_roots.length,
      files_seen: inventory.source_surface.total_files_excluding_git_node_modules_agent_onboard,
      script_count: inventory.package_surface.script_names.length,
      ci_command_count: inventory.command_surface.ci_commands.length,
      readme_usage_command_count: inventory.command_surface.readme_usage_commands.length,
      provenance_surface_count: [inventory.identity_and_provenance.repo_identifier_file, inventory.identity_and_provenance.gordian_open_integrity_yaml].filter(Boolean).length
    },
    recommended_next_commands: [
      'agent-onboard target doctor --text',
      'agent-onboard target profile --text',
      'agent-onboard target memory --text',
      'agent-onboard check --fast --text'
    ],
    writes_performed: false,
    validated: {
      target_path_readable: true,
      target_is_directory: true,
      no_writes_performed: true,
      managed_project_commands_not_run: true,
      dependency_install_not_run: true,
      build_test_deploy_not_run: true,
      publish_push_not_run: true
    },
    boundary: {
      writes_files: false,
      writes_target_repository_state: false,
      creates_agent_onboard_runtime_state: false,
      scans_target_repository: true,
      excludes_git_node_modules_and_agent_onboard_state: true,
      reads_bounded_file_contents_for_command_detection: true,
      inlines_file_contents: false,
      installs_dependencies: false,
      runs_build_test_deploy: false,
      runs_managed_project_commands: false,
      publishes_package: false,
      network: false,
      git_mutation: false
    },
    errors: []
  });
}

function targetInventoryText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target inventory',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`,
      'Writes performed: false'
    ].join('\n') + '\n';
  }
  const roots = result.inventory.source_surface.source_roots.map((entry) => `${entry.path}(${entry.role}:${entry.file_count})`);
  return [
    'agent-onboard target inventory',
    `Target: ${result.target.name} (${result.target.ecosystem})`,
    `Root: ${result.target.root}`,
    `Files seen: ${result.summary.files_seen}`,
    `Source roots: ${roots.length > 0 ? roots.join(', ') : 'none'}`,
    `Package manager: ${result.inventory.package_surface.package_manager}`,
    `Scripts: ${result.inventory.package_surface.script_names.length > 0 ? result.inventory.package_surface.script_names.join(', ') : 'none'}`,
    `CI commands detected: ${result.summary.ci_command_count}`,
    `README usage commands detected: ${result.summary.readme_usage_command_count}`,
    `Provenance surfaces detected: ${result.summary.provenance_surface_count}`,
    'Boundary: read-only inventory; no dependency install, no managed-project command execution, no Git mutation, no network, no writes.',
    'Next steps:',
    ...result.recommended_next_commands.map((command) => `  - ${command}`),
    'Writes performed: false'
  ].join('\n') + '\n';
}

function createTargetInventoryService(deps = {}) {
  const releaseLine = deps.publicReleaseContract && deps.publicReleaseContract.release_line ? deps.publicReleaseContract.release_line : deps.releaseLine;
  return Object.freeze({
    targetInventory: (targetRoot) => targetInventory(targetRoot, { version: deps.version, releaseLine }),
    formatTargetInventoryText: targetInventoryText,
    listFilesRecursive,
    extractRunCommandsFromYaml,
    extractReadmeUsageCommands
  });
}

module.exports = {
  createTargetInventoryService,
  targetInventory,
  targetInventoryText,
  listFilesRecursive,
  extractRunCommandsFromYaml,
  extractReadmeUsageCommands
};
