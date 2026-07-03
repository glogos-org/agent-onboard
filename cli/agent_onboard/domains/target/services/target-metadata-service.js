'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const targetConstants = require('./target-constants');

const {
  PACKAGE_NAME,
  TARGET_METADATA
} = targetConstants;

const METADATA_FILES = Object.freeze({
  manifest: 'manifest.json',
  authorityMap: 'authority-map.json',
  sourceOfTruth: 'SOURCE_OF_TRUTH.md'
});

const MARKDOWN_METADATA_FILES = Object.freeze([
  'README.md',
  METADATA_FILES.sourceOfTruth,
  'llms.txt'
]);

const MANIFEST_FILE_FIELDS = Object.freeze([
  'file_urn',
  'file_path',
  'file_id'
]);

const ADMIN_FRONT_MATTER_FIELDS = Object.freeze([
  'file_urn',
  'urn',
  'version',
  'status',
  'canonical_path',
  'handling',
  'internal_version'
]);

const DEFAULT_EXCLUDED_PATHS = Object.freeze([
  METADATA_FILES.manifest,
  '.agent-onboard/work-items.json'
]);

const SKIPPED_DIRECTORIES = Object.freeze([
  '.git',
  '.scratch',
  'node_modules'
]);

function createTargetMetadataService(deps) {
  const {
    version: VERSION,
    publicReleaseContract: PUBLIC_RELEASE_CONTRACT,
    isPlainObject,
    readJson,
    stableJson,
    noMutationBoundary,
    targetName
  } = deps;

  function toPosix(relativePath) {
    return relativePath.split(path.sep).join('/');
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'target';
  }

  function hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
  }

  function hashText(text) {
    return hashBuffer(Buffer.from(text, 'utf8'));
  }

  function hashFile(file) {
    return hashBuffer(fs.readFileSync(file));
  }

  function base64Url(buffer) {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function hexPrefix(buffer) {
    return buffer.toString('hex').slice(0, 8);
  }

  function fileId(buffer) {
    return `ni:///sha-256;${base64Url(buffer)}`;
  }

  function fileUrn(namespace, relativePath) {
    const normalized = relativePath.replace(/\\/g, '/');
    return `urn:${namespace}:file:${slugify(normalized)}-${hexPrefix(hashText(normalized))}`;
  }

  function walkFiles(root, current = '') {
    const absoluteCurrent = path.join(root, current);
    const entries = fs.readdirSync(absoluteCurrent, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.isDirectory() && SKIPPED_DIRECTORIES.includes(entry.name)) continue;
      const relativePath = current ? path.join(current, entry.name) : entry.name;
      if (entry.isDirectory()) {
        files.push(...walkFiles(root, relativePath));
        continue;
      }
      if (entry.isFile()) files.push(toPosix(relativePath));
    }
    return files.sort();
  }

  function targetNamespace(name) {
    return slugify(name).replace(/-/g, '_') === 'agent_onboard' ? 'agent-onboard' : slugify(name);
  }

  function sourceOfTruthTemplate(name) {
    const namespace = targetNamespace(name);
    return [
      '<!--',
      `file_urn: urn:${namespace}:file:source-of-truth-md-${hexPrefix(hashText('SOURCE_OF_TRUTH.md'))}`,
      'metadata_role: target_authority_summary',
      '-->',
      '# Source of Truth',
      '',
      `This repository is tracked as the \`${name}\` target for agent-onboard metadata.`,
      '',
      'Authority order:',
      '',
      '1. `AGENTS.md`',
      '2. `llms.txt`',
      '3. `.agent-onboard/authority-path.json`',
      '4. `agent-onboard.target.json`',
      '5. `.agent-onboard/runtime-namespace.json`',
      '6. `.agent-onboard/project.json`',
      '7. `.agent-onboard/work-items.json`',
      '8. `README.md`',
      '9. `authority-map.json`',
      '10. `manifest.json`',
      '',
      '`authority-map.json` owns stable authority and file URNs. `manifest.json` records content identity with `file_urn`, `file_path`, and `file_id` fields. Administrative markdown metadata belongs in leading HTML comment headers or registry metadata, not visible front matter.',
      '',
      'Work-item semantics remain delegated to `agent-onboard`.',
      ''
    ].join('\n');
  }

  function authorityMapTemplate(root, name) {
    const namespace = targetNamespace(name);
    const authorityCandidates = [
      { class: 'source-of-truth', path: METADATA_FILES.sourceOfTruth, slug: 'source-of-truth', status: 'canonical' },
      { class: 'agent-instructions', path: 'AGENTS.md', slug: 'agents', status: 'canonical' },
      { class: 'machine-context', path: 'llms.txt', slug: 'llms', status: 'canonical' },
      { class: 'package-docs', path: 'README.md', slug: 'readme', status: 'canonical' },
      { class: 'target-config', path: 'agent-onboard.target.json', slug: 'target-config', status: 'active' },
      { class: 'work-items', path: '.agent-onboard/work-items.json', slug: 'work-items', status: 'active' }
    ];
    const authorities = authorityCandidates
      .filter((entry) => entry.path === METADATA_FILES.sourceOfTruth || existingFile(root, entry.path))
      .map((entry, index) => ({
        class: entry.class,
        numeric_id: String(index + 1).padStart(4, '0'),
        path: entry.path,
        slug: entry.slug,
        status: entry.status,
        urn: `urn:${namespace}:${entry.slug}-${String(index + 1).padStart(4, '0')}`
      }));
    const filePaths = walkFiles(root)
      .filter((relativePath) => !DEFAULT_EXCLUDED_PATHS.includes(relativePath))
      .concat([METADATA_FILES.sourceOfTruth, METADATA_FILES.authorityMap])
      .filter((relativePath, index, values) => values.indexOf(relativePath) === index)
      .sort();
    const file_urns = filePaths.map((relativePath) => ({
      file_path: relativePath,
      file_urn: fileUrn(namespace, relativePath)
    }));
    return {
      authorities,
      file_urns,
      metadata_policy: {
        markdown_admin_metadata: 'leading_html_comment_or_registry',
        visible_front_matter_admin_metadata: false,
        work_item_semantics: 'delegated_to_agent_onboard'
      },
      namespace: `urn:${namespace}:`,
      schema: 'agent-onboard-target-authority-map-001'
    };
  }

  function manifestTemplate(root, name, generatedContentByPath) {
    const namespace = targetNamespace(name);
    const files = {};
    const filePaths = walkFiles(root)
      .filter((relativePath) => !DEFAULT_EXCLUDED_PATHS.includes(relativePath))
      .concat(Object.keys(generatedContentByPath))
      .filter((relativePath, index, values) => values.indexOf(relativePath) === index)
      .sort();
    for (const relativePath of filePaths) {
      const generatedContent = generatedContentByPath[relativePath];
      const digest = generatedContent === undefined
        ? hashFile(path.join(root, relativePath))
        : hashText(generatedContent);
      const urn = fileUrn(namespace, relativePath);
      files[urn] = {
        file_id: fileId(digest),
        file_path: relativePath,
        file_urn: urn
      };
    }
    return {
      algorithm: 'sha-256',
      exclusions: DEFAULT_EXCLUDED_PATHS.map((relativePath) => ({
        file_path: relativePath,
        reason: relativePath === METADATA_FILES.manifest ? 'self_referential_manifest' : 'mutable_agent_onboard_state'
      })),
      files,
      schema: 'agent-onboard-target-content-manifest-002',
      target: {
        kind: 'target-repo',
        name
      }
    };
  }

  function metadataWriteSet(root) {
    const [name] = targetName(root);
    const sourceOfTruth = sourceOfTruthTemplate(name);
    const authorityMap = authorityMapTemplate(root, name);
    const authorityMapText = stableJson(authorityMap);
    const manifest = manifestTemplate(root, name, {
      [METADATA_FILES.sourceOfTruth]: sourceOfTruth,
      [METADATA_FILES.authorityMap]: authorityMapText
    });
    return [
      {
        path: METADATA_FILES.sourceOfTruth,
        kind: 'text',
        content: sourceOfTruth
      },
      {
        path: METADATA_FILES.authorityMap,
        kind: 'json',
        value: authorityMap
      },
      {
        path: METADATA_FILES.manifest,
        kind: 'json',
        value: manifest
      }
    ];
  }

  function desiredWriteContent(item) {
    return item.kind === 'json' ? stableJson(item.value) : item.content;
  }

  function planMetadataWrites(root, options = {}) {
    const force = options.force === true;
    return metadataWriteSet(root).map((item) => {
      const absolutePath = path.join(root, item.path);
      const desired = desiredWriteContent(item);
      const exists = fs.existsSync(absolutePath);
      const current = exists ? fs.readFileSync(absolutePath, 'utf8') : null;
      const identical = exists && current === desired;
      const conflict = exists && !identical && !force;
      let action = TARGET_METADATA.action.create;
      if (identical) action = TARGET_METADATA.action.keep;
      else if (exists && force) action = TARGET_METADATA.action.overwrite;
      else if (conflict) action = TARGET_METADATA.action.conflict;
      return {
        path: item.path,
        kind: item.kind,
        exists,
        action,
        safe_to_write: action !== TARGET_METADATA.action.conflict,
        content: desired
      };
    });
  }

  function performMetadataWrites(root, plannedWrites) {
    for (const item of plannedWrites) {
      if (item.action !== TARGET_METADATA.action.create && item.action !== TARGET_METADATA.action.overwrite) continue;
      const absolutePath = path.join(root, item.path);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, item.content);
    }
  }

  function summarizeWrites(plannedWrites) {
    return plannedWrites.map((item) => ({
      path: item.path,
      kind: item.kind,
      exists: item.exists,
      action: item.action,
      safe_to_write: item.safe_to_write
    }));
  }

  function existingFile(root, relativePath) {
    const absolutePath = path.join(root, relativePath);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  }

  function readJsonIfPresent(root, relativePath) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) return { present: false, status: 'missing', value: null, errors: [] };
    try {
      return { present: true, status: 'valid', value: readJson(absolutePath), errors: [] };
    } catch (error) {
      return {
        present: true,
        status: 'invalid',
        value: null,
        errors: [`${relativePath} is not valid JSON: ${error && error.message ? error.message : String(error)}`]
      };
    }
  }

  function manifestEntryErrors(entryKey, entry) {
    const errors = [];
    if (!isPlainObject(entry)) return [`manifest entry ${entryKey} must be an object`];
    for (const field of MANIFEST_FILE_FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field].length === 0) errors.push(`manifest entry ${entryKey} must include string ${field}`);
    }
    if (typeof entry.file_urn === 'string' && entry.file_urn !== entryKey) errors.push(`manifest entry ${entryKey} file_urn must match object key`);
    if (typeof entry.file_id === 'string' && !entry.file_id.startsWith('ni:///sha-256;')) errors.push(`manifest entry ${entryKey} file_id must use ni:///sha-256;`);
    if (Object.prototype.hasOwnProperty.call(entry, 'path')) errors.push(`manifest entry ${entryKey} must use file_path instead of path`);
    if (Object.prototype.hasOwnProperty.call(entry, 'urn')) errors.push(`manifest entry ${entryKey} must use file_urn instead of urn`);
    if (Object.prototype.hasOwnProperty.call(entry, 'sha256')) errors.push(`manifest entry ${entryKey} must not expose raw sha256`);
    return errors;
  }

  function manifestReport(root) {
    const report = readJsonIfPresent(root, METADATA_FILES.manifest);
    if (!report.present || report.status !== 'valid') {
      return {
        path: METADATA_FILES.manifest,
        present: report.present,
        status: report.status,
        schema: null,
        file_count: 0,
        keyed_by_file_urn: false,
        errors: report.errors
      };
    }

    const value = report.value;
    const errors = [];
    if (!isPlainObject(value)) errors.push('manifest.json root must be an object');
    const manifestRoot = isPlainObject(value) ? value : {};
    const files = manifestRoot.files;
    if (!isPlainObject(files)) errors.push('manifest.json files must be an object keyed by file_urn');
    if (Object.prototype.hasOwnProperty.call(manifestRoot, 'sha256')) errors.push('manifest.json must not expose raw sha256 at root');
    if (Array.isArray(files)) errors.push('manifest.json files must not be a legacy array');
    const entries = isPlainObject(files) ? Object.entries(files) : [];
    for (const [entryKey, entry] of entries) errors.push(...manifestEntryErrors(entryKey, entry));
    const exclusions = Array.isArray(value.exclusions) ? value.exclusions : [];
    for (const [index, exclusion] of exclusions.entries()) {
      if (isPlainObject(exclusion) && Object.prototype.hasOwnProperty.call(exclusion, 'path')) errors.push(`manifest exclusion ${index} must use file_path instead of path`);
    }

    return {
      path: METADATA_FILES.manifest,
      present: true,
      status: errors.length === 0 ? 'valid' : 'invalid',
      schema: manifestRoot.schema || null,
      file_count: entries.length,
      keyed_by_file_urn: isPlainObject(files),
      errors
    };
  }

  function authorityMapReport(root) {
    const report = readJsonIfPresent(root, METADATA_FILES.authorityMap);
    if (!report.present || report.status !== 'valid') {
      return {
        path: METADATA_FILES.authorityMap,
        present: report.present,
        status: report.status,
        authority_count: 0,
        errors: report.errors
      };
    }
    const value = report.value;
    const errors = [];
    if (!isPlainObject(value)) errors.push('authority-map.json root must be an object');
    const authorityRoot = isPlainObject(value) ? value : {};
    const authorityEntries = Array.isArray(authorityRoot.authorities)
      ? authorityRoot.authorities.filter((entry) => isPlainObject(entry) && typeof entry.urn === 'string' && entry.urn.startsWith('urn:'))
      : (isPlainObject(authorityRoot.authorities) ? Object.keys(authorityRoot.authorities).filter((key) => key.startsWith('urn:')) : []);
    const fileUrnEntries = Array.isArray(authorityRoot.file_urns)
      ? authorityRoot.file_urns.filter((entry) => isPlainObject(entry) && typeof entry.file_urn === 'string' && entry.file_urn.startsWith('urn:') && typeof entry.file_path === 'string')
      : (isPlainObject(authorityRoot.file_urns) ? Object.keys(authorityRoot.file_urns).filter((key) => key.startsWith('urn:')) : []);
    if (authorityEntries.length === 0 && fileUrnEntries.length === 0) errors.push('authority-map.json should expose stable urn:* authority or file_urn entries');
    return {
      path: METADATA_FILES.authorityMap,
      present: true,
      status: errors.length === 0 ? 'valid' : 'invalid',
      authority_count: authorityEntries.length,
      file_urn_count: fileUrnEntries.length,
      errors
    };
  }

  function markdownMetadataReport(root, relativePath) {
    if (!existingFile(root, relativePath)) {
      return {
        path: relativePath,
        present: false,
        status: 'missing',
        has_comment_header: false,
        visible_front_matter_admin_fields: [],
        errors: []
      };
    }
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const trimmedStart = text.trimStart();
    const hasCommentHeader = trimmedStart.startsWith('<!--');
    const frontMatterMatch = trimmedStart.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const visibleFields = [];
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      for (const field of ADMIN_FRONT_MATTER_FIELDS) {
        if (new RegExp(`(^|\\n)${field}\\s*:`, 'i').test(frontMatter)) visibleFields.push(field);
      }
    }
    return {
      path: relativePath,
      present: true,
      status: visibleFields.length === 0 ? 'valid' : 'invalid',
      has_comment_header: hasCommentHeader,
      visible_front_matter_admin_fields: visibleFields,
      errors: visibleFields.map((field) => `${relativePath} must keep ${field} in a comment header or registry metadata, not visible front matter`)
    };
  }

  function metadataPlan(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    const [name, kind] = targetName(absoluteTargetRoot);
    return {
      schema: TARGET_METADATA.planSchema,
      status: TARGET_METADATA.status.ok,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_METADATA.planCommand,
      command_family: TARGET_METADATA.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      manifest_contract: {
        path: METADATA_FILES.manifest,
        files_shape: 'object_keyed_by_file_urn',
        entry_fields: MANIFEST_FILE_FIELDS,
        content_identity: 'file_id ni:///sha-256;...',
        forbidden_fields: Object.freeze(['path', 'urn', 'sha256'])
      },
      authority_contract: {
        path: METADATA_FILES.authorityMap,
        role: 'stable target repository authority/file URN registry'
      },
      markdown_metadata_contract: {
        files: MARKDOWN_METADATA_FILES,
        administrative_metadata_placement: 'leading HTML comment header or registry metadata',
        visible_front_matter_admin_fields_forbidden: ADMIN_FRONT_MATTER_FIELDS
      },
      boundary: {
        ...noMutationBoundary(),
        writes_files: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        git_mutation: false,
        publishes_package: false,
        mutates_registry: false
      },
      next_steps: [
        `run ${PACKAGE_NAME} target metadata --check --target ${absoluteTargetRoot}`,
        `run ${PACKAGE_NAME} target metadata --write --target ${absoluteTargetRoot} to generate missing target metadata`,
        'keep work-item semantics in agent-onboard instead of repo-owned tools',
        'regenerate target-owned manifests with the target repo tooling when files change'
      ],
      errors: []
    };
  }

  function metadataWrite(targetRoot = process.cwd(), options = {}) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot) || !fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: TARGET_METADATA.writeSchema,
        status: TARGET_METADATA.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_METADATA.writeCommand,
        command_family: TARGET_METADATA.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        writes_performed: false,
        planned_writes: [],
        conflicts: [],
        boundary: noMutationBoundary(),
        errors: [`target path is not a directory: ${absoluteTargetRoot}`]
      };
    }

    const [name, kind] = targetName(absoluteTargetRoot);
    const plannedWrites = planMetadataWrites(absoluteTargetRoot, options);
    const conflicts = plannedWrites.filter((item) => item.action === TARGET_METADATA.action.conflict);
    const ok = conflicts.length === 0;
    if (ok) performMetadataWrites(absoluteTargetRoot, plannedWrites);
    const check = ok ? metadataCheck(absoluteTargetRoot) : null;
    const errors = conflicts.map((item) => `${item.path} exists with different content; rerun with --force to overwrite`);
    if (check && check.errors.length > 0) errors.push(...check.errors.map((error) => `post-write check: ${error}`));
    const wroteFiles = ok && plannedWrites.some((item) => item.action === TARGET_METADATA.action.create || item.action === TARGET_METADATA.action.overwrite);

    return {
      schema: TARGET_METADATA.writeSchema,
      status: ok && (!check || check.status === TARGET_METADATA.status.ok) ? TARGET_METADATA.status.ok : TARGET_METADATA.status.error,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_METADATA.writeCommand,
      command_family: TARGET_METADATA.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      force: options.force === true,
      writes_performed: wroteFiles,
      planned_writes: summarizeWrites(plannedWrites),
      conflicts: conflicts.map((item) => item.path),
      generated_files: plannedWrites.map((item) => item.path),
      post_write_check: check ? {
        status: check.status,
        metadata_surface_present: check.metadata_surface_present,
        manifest_file_count: check.manifest.file_count,
        authority_count: check.authority_map.authority_count,
        file_urn_count: check.authority_map.file_urn_count
      } : null,
      boundary: {
        ...noMutationBoundary(),
        writes_files: wroteFiles,
        writes_target_repository_state: wroteFiles,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        git_mutation: false,
        publishes_package: false,
        mutates_registry: false
      },
      errors
    };
  }

  function metadataCheck(targetRoot = process.cwd()) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    if (!fs.existsSync(absoluteTargetRoot) || !fs.statSync(absoluteTargetRoot).isDirectory()) {
      return {
        schema: TARGET_METADATA.checkSchema,
        status: TARGET_METADATA.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_METADATA.checkCommand,
        command_family: TARGET_METADATA.commandFamily,
        target: { name: path.basename(absoluteTargetRoot) || 'target-repo', kind: 'missing', root: absoluteTargetRoot },
        writes_performed: false,
        boundary: noMutationBoundary(),
        errors: [`target path is not a directory: ${absoluteTargetRoot}`]
      };
    }

    const [name, kind] = targetName(absoluteTargetRoot);
    const manifest = manifestReport(absoluteTargetRoot);
    const authorityMap = authorityMapReport(absoluteTargetRoot);
    const markdown_metadata = MARKDOWN_METADATA_FILES.map((relativePath) => markdownMetadataReport(absoluteTargetRoot, relativePath));
    const errors = [
      ...manifest.errors,
      ...authorityMap.errors,
      ...markdown_metadata.flatMap((report) => report.errors)
    ];
    const hasMetadataSurface = manifest.present || authorityMap.present || markdown_metadata.some((report) => report.present && report.has_comment_header);

    return {
      schema: TARGET_METADATA.checkSchema,
      status: errors.length === 0 ? TARGET_METADATA.status.ok : TARGET_METADATA.status.error,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_METADATA.checkCommand,
      command_family: TARGET_METADATA.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      validated: {
        target_path_readable: true,
        no_writes_performed: true,
        manifest_absent_or_v2_shape: !manifest.present || manifest.status === 'valid',
        authority_map_absent_or_valid: !authorityMap.present || authorityMap.status === 'valid',
        markdown_admin_metadata_not_visible: markdown_metadata.every((report) => report.status !== 'invalid'),
        work_item_semantics_delegated_to_agent_onboard: true
      },
      metadata_surface_present: hasMetadataSurface,
      manifest,
      authority_map: authorityMap,
      markdown_metadata,
      writes_performed: false,
      boundary: {
        ...noMutationBoundary(),
        reads_target_repository_state: true,
        writes_files: false,
        runs_package_manager: false,
        runs_build_test_deploy: false,
        git_mutation: false,
        publishes_package: false,
        mutates_registry: false
      },
      errors
    };
  }

  return Object.freeze({
    metadataPlan,
    metadataCheck,
    metadataWrite
  });
}

module.exports = {
  createTargetMetadataService
};
