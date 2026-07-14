'use strict';

const fs = require('fs');
const path = require('path');
const {
  PACKAGE_NAME,
  TARGET_METADATA,
  METADATA_FILES,
  AOB_METADATA_MARKER,
  MARKDOWN_METADATA_FILES,
  MANIFEST_FILE_FIELDS,
  ADMIN_FRONT_MATTER_FIELDS,
  DEFAULT_METADATA_POLICY
} = require('./target-metadata-constants');
const {
  toPosix,
  hashFile,
  fileId,
  fileUrn,
  walkFiles,
  normalizeUrnNamespace,
  namespaceFromFileUrn,
  normalizeStringArray
} = require('./target-metadata-identity-service');

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

  function readPolicyDocument(root, options) {
    const explicitPolicyPath = typeof options.policyPath === 'string' && options.policyPath.length > 0
      ? path.resolve(root, options.policyPath)
      : null;
    const implicitPolicyPath = path.join(root, METADATA_FILES.policy);
    const policyPath = explicitPolicyPath || (fs.existsSync(implicitPolicyPath) ? implicitPolicyPath : null);
    if (!policyPath) return { path: null, source: 'default_profile', settings: {}, errors: [] };
    if (!fs.existsSync(policyPath)) {
      return {
        path: policyPath,
        source: explicitPolicyPath ? 'explicit_policy_file' : 'implicit_policy_file',
        settings: {},
        errors: [`metadata policy file is missing: ${policyPath}`]
      };
    }
    try {
      const value = readJson(policyPath);
      const settings = isPlainObject(value) && isPlainObject(value.metadata) ? value.metadata : value;
      return {
        path: policyPath,
        source: explicitPolicyPath ? 'explicit_policy_file' : 'implicit_policy_file',
        settings: isPlainObject(settings) ? settings : {},
        errors: isPlainObject(settings) ? [] : ['metadata policy must be an object or expose an object metadata field']
      };
    } catch (error) {
      return {
        path: policyPath,
        source: explicitPolicyPath ? 'explicit_policy_file' : 'implicit_policy_file',
        settings: {},
        errors: [`metadata policy is not valid JSON: ${error && error.message ? error.message : String(error)}`]
      };
    }
  }

  function firstFileUrnFromAuthorityMap(value) {
    if (!isPlainObject(value)) return null;
    if (Array.isArray(value.file_urns)) {
      const entry = value.file_urns.find((item) => isPlainObject(item) && typeof item.file_urn === 'string');
      return entry ? entry.file_urn : null;
    }
    if (isPlainObject(value.file_urns)) {
      return Object.keys(value.file_urns).find((item) => item.startsWith('urn:')) || null;
    }
    return null;
  }

  function resolveMetadataPolicy(root, name, options = {}) {
    const profile = options.profile || DEFAULT_METADATA_POLICY.profile;
    const policyDocument = readPolicyDocument(root, options);
    const settings = policyDocument.settings;
    const errors = [...policyDocument.errors];
    if (profile !== TARGET_METADATA.profile.default) errors.push(`unsupported target metadata profile: ${profile}`);

    const policy = {
      ...DEFAULT_METADATA_POLICY,
      exclude_paths: [...DEFAULT_METADATA_POLICY.exclude_paths],
      exclude_path_prefixes: [...DEFAULT_METADATA_POLICY.exclude_path_prefixes],
      include_paths: [...DEFAULT_METADATA_POLICY.include_paths],
      profile
    };
    const hasSetting = (field) => Object.prototype.hasOwnProperty.call(settings, field);
    if (hasSetting('manifest_schema') && typeof settings.manifest_schema === 'string') policy.manifest_schema = settings.manifest_schema;
    if (hasSetting('authority_map_schema') && typeof settings.authority_map_schema === 'string') policy.authority_map_schema = settings.authority_map_schema;
    if (hasSetting('urn_namespace') && typeof settings.urn_namespace === 'string') policy.urn_namespace = settings.urn_namespace;
    if (hasSetting('include_control_state')) policy.include_control_state = settings.include_control_state === true;
    if (hasSetting('include_manifest_in_authority_map')) policy.include_manifest_in_authority_map = settings.include_manifest_in_authority_map === true;
    if (hasSetting('preserve_source_of_truth')) policy.preserve_source_of_truth = settings.preserve_source_of_truth !== false;
    if (hasSetting('write_source_of_truth')) policy.write_source_of_truth = settings.write_source_of_truth !== false;
    if (hasSetting('exclude_paths')) policy.exclude_paths = [...policy.exclude_paths, ...normalizeStringArray(settings.exclude_paths)];
    if (hasSetting('exclude_path_prefixes')) policy.exclude_path_prefixes = [...policy.exclude_path_prefixes, ...normalizeStringArray(settings.exclude_path_prefixes)];
    if (hasSetting('include_paths')) policy.include_paths = normalizeStringArray(settings.include_paths);

    const existingManifest = readJsonIfPresent(root, METADATA_FILES.manifest);
    const existingAuthorityMap = readJsonIfPresent(root, METADATA_FILES.authorityMap);
    const adoptExisting = options.adoptExisting === true;
    if (adoptExisting && existingManifest.status === 'valid' && isPlainObject(existingManifest.value) && !hasSetting('manifest_schema')) {
      if (typeof existingManifest.value.schema === 'string') policy.manifest_schema = existingManifest.value.schema;
    }
    if (adoptExisting && existingAuthorityMap.status === 'valid' && isPlainObject(existingAuthorityMap.value)) {
      if (typeof existingAuthorityMap.value.schema === 'string' && !hasSetting('authority_map_schema')) {
        policy.authority_map_schema = existingAuthorityMap.value.schema;
      }
      if (!hasSetting('urn_namespace')) {
        const namespace = typeof existingAuthorityMap.value.namespace === 'string'
          ? existingAuthorityMap.value.namespace
          : namespaceFromFileUrn(firstFileUrnFromAuthorityMap(existingAuthorityMap.value));
        if (namespace) policy.urn_namespace = namespace;
      }
    }

    policy.urn_namespace = normalizeUrnNamespace(policy.urn_namespace, name);
    policy.exclude_paths = [...new Set(policy.exclude_paths.map(toPosix))].sort();
    policy.exclude_path_prefixes = [...new Set(policy.exclude_path_prefixes.map((item) => toPosix(item).replace(/\/+$/g, '')))].sort();
    policy.include_paths = [...new Set(policy.include_paths.map(toPosix))].sort();

    return {
      policy: Object.freeze(policy),
      source: policyDocument.source,
      path: policyDocument.path,
      adopt_existing: adoptExisting,
      existing_manifest: existingManifest,
      existing_authority_map: existingAuthorityMap,
      errors
    };
  }

  function policySummary(context) {
    const policy = context.policy;
    return {
      source: context.source,
      path: context.path,
      profile: policy.profile,
      adopt_existing: context.adopt_existing,
      manifest_schema: policy.manifest_schema,
      authority_map_schema: policy.authority_map_schema,
      urn_namespace: policy.urn_namespace,
      include_control_state: policy.include_control_state,
      include_manifest_in_authority_map: policy.include_manifest_in_authority_map,
      preserve_source_of_truth: policy.preserve_source_of_truth,
      write_source_of_truth: policy.write_source_of_truth,
      exclude_paths: policy.exclude_paths,
      exclude_path_prefixes: policy.exclude_path_prefixes,
      include_paths: policy.include_paths
    };
  }

  function sourceOfTruthBlock(name, policy) {
    return [
      AOB_METADATA_MARKER.begin,
      `file_urn: ${fileUrn(policy.urn_namespace, METADATA_FILES.sourceOfTruth)}`,
      'metadata_role: target_metadata_identity',
      `target_name: ${name}`,
      `urn_namespace: ${policy.urn_namespace}`,
      AOB_METADATA_MARKER.end
    ].join('\n');
  }

  function sourceOfTruthTemplate(name, policy) {
    return [
      '# Source of Truth',
      '',
      sourceOfTruthBlock(name, policy),
      ''
    ].join('\n');
  }

  function sourceOfTruthContent(root, name, policy) {
    const absolutePath = path.join(root, METADATA_FILES.sourceOfTruth);
    const block = sourceOfTruthBlock(name, policy);
    if (!fs.existsSync(absolutePath)) return policy.write_source_of_truth ? sourceOfTruthTemplate(name, policy) : null;
    const current = fs.readFileSync(absolutePath, 'utf8');
    const begin = current.indexOf(AOB_METADATA_MARKER.begin);
    const end = current.indexOf(AOB_METADATA_MARKER.end);
    if (begin >= 0 && end > begin) return `${current.slice(0, begin)}${block}${current.slice(end + AOB_METADATA_MARKER.end.length)}`;
    if (policy.preserve_source_of_truth) return null;
    return sourceOfTruthTemplate(name, policy);
  }

  function isPolicyExcluded(relativePath, policy) {
    if (policy.exclude_paths.includes(relativePath)) return true;
    if (!policy.include_control_state && (relativePath === '.agent-onboard' || relativePath.startsWith('.agent-onboard/'))) return true;
    return policy.exclude_path_prefixes.some((prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`));
  }

  function policyFilePaths(root, policy, generatedContentByPath = {}, options = {}) {
    const allowManifest = options.allowManifest === true;
    const explicitIncludePaths = policy.include_paths.filter((relativePath) => existingFile(root, relativePath) || generatedContentByPath[relativePath] !== undefined);
    return walkFiles(root)
      .concat(Object.keys(generatedContentByPath))
      .concat(allowManifest ? [METADATA_FILES.manifest] : [])
      .concat(explicitIncludePaths)
      .filter((relativePath) => allowManifest || relativePath !== METADATA_FILES.manifest)
      .filter((relativePath) => (allowManifest && relativePath === METADATA_FILES.manifest) || !isPolicyExcluded(relativePath, policy))
      .filter((relativePath, index, values) => values.indexOf(relativePath) === index)
      .sort();
  }

  function authorityMapTemplate(root, name, context, generatedContentByPath) {
    const { policy, existing_authority_map: existingAuthorityMap } = context;
    const existing = context.adopt_existing && existingAuthorityMap.status === 'valid' && isPlainObject(existingAuthorityMap.value)
      ? existingAuthorityMap.value
      : {};
    const filePaths = policyFilePaths(root, policy, generatedContentByPath, {
      allowManifest: policy.include_manifest_in_authority_map
    }).concat([METADATA_FILES.authorityMap])
      .filter((relativePath) => policy.include_manifest_in_authority_map || relativePath !== METADATA_FILES.manifest)
      .filter((relativePath, index, values) => values.indexOf(relativePath) === index)
      .sort();
    const file_urns = filePaths.map((relativePath) => ({
      file_path: relativePath,
      file_urn: fileUrn(policy.urn_namespace, relativePath)
    }));
    return {
      ...existing,
      authorities: Object.prototype.hasOwnProperty.call(existing, 'authorities') ? existing.authorities : [],
      file_urns,
      metadata_policy: {
        ...(isPlainObject(existing.metadata_policy) ? existing.metadata_policy : {}),
        mechanics_owner: PACKAGE_NAME,
        semantics_owner: 'target_repository',
        markdown_admin_metadata: 'leading_html_comment_or_registry',
        visible_front_matter_admin_metadata: false
      },
      namespace: policy.urn_namespace,
      schema: policy.authority_map_schema,
      target: {
        ...(isPlainObject(existing.target) ? existing.target : {}),
        name
      }
    };
  }

  function manifestTemplate(root, name, generatedContentByPath, policy) {
    const files = {};
    const filePaths = policyFilePaths(root, policy, generatedContentByPath);
    for (const relativePath of filePaths) {
      const generatedContent = generatedContentByPath[relativePath];
      const digest = generatedContent === undefined
        ? hashFile(path.join(root, relativePath))
        : hashText(generatedContent);
      const urn = fileUrn(policy.urn_namespace, relativePath);
      files[urn] = {
        file_id: fileId(digest),
        file_path: relativePath,
        file_urn: urn
      };
    }
    return {
      algorithm: 'sha-256',
      exclusions: policy.exclude_paths.map((relativePath) => ({
        file_path: relativePath,
        reason: relativePath === METADATA_FILES.manifest ? 'self_referential_manifest' : 'target_metadata_policy'
      })),
      files,
      metadata_policy: {
        mechanics_owner: PACKAGE_NAME,
        semantics_owner: 'target_repository',
        source: 'target_policy_driven'
      },
      schema: policy.manifest_schema,
      target: {
        kind: 'target-repo',
        name
      }
    };
  }

  function metadataWriteSet(root, options = {}) {
    const [name] = targetName(root);
    const context = resolveMetadataPolicy(root, name, options);
    if (context.errors.length > 0) return { context, writes: [] };
    const sourceOfTruth = sourceOfTruthContent(root, name, context.policy);
    const generatedContentByPath = {};
    if (sourceOfTruth !== null) generatedContentByPath[METADATA_FILES.sourceOfTruth] = sourceOfTruth;
    const authorityMap = authorityMapTemplate(root, name, context, generatedContentByPath);
    const authorityMapText = stableJson(authorityMap);
    generatedContentByPath[METADATA_FILES.authorityMap] = authorityMapText;
    const manifest = manifestTemplate(root, name, generatedContentByPath, context.policy);
    const writes = [];
    if (sourceOfTruth !== null) {
      writes.push({
        path: METADATA_FILES.sourceOfTruth,
        kind: 'text',
        content: sourceOfTruth
      });
    }
    writes.push(
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
    );
    return { context, writes };
  }

  function desiredWriteContent(item) {
    return item.kind === 'json' ? stableJson(item.value) : item.content;
  }

  function planMetadataWrites(root, options = {}) {
    const force = options.force === true;
    const writeSet = metadataWriteSet(root, options);
    const allowAdoptOverwrite = options.adoptExisting === true;
    const plannedWrites = writeSet.writes.map((item) => {
      const absolutePath = path.join(root, item.path);
      const desired = desiredWriteContent(item);
      const exists = fs.existsSync(absolutePath);
      const current = exists ? fs.readFileSync(absolutePath, 'utf8') : null;
      const identical = exists && current === desired;
      const conflict = exists && !identical && !force && !allowAdoptOverwrite;
      let action = TARGET_METADATA.action.create;
      if (identical) action = TARGET_METADATA.action.keep;
      else if (exists && (force || allowAdoptOverwrite)) action = TARGET_METADATA.action.overwrite;
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
    return { context: writeSet.context, plannedWrites };
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

  function metadataPlan(targetRoot = process.cwd(), options = {}) {
    const absoluteTargetRoot = path.resolve(targetRoot || process.cwd());
    const [name, kind] = targetName(absoluteTargetRoot);
    const context = fs.existsSync(absoluteTargetRoot) && fs.statSync(absoluteTargetRoot).isDirectory()
      ? resolveMetadataPolicy(absoluteTargetRoot, name, options)
      : null;
    const errors = context ? context.errors : [`target path is not a directory: ${absoluteTargetRoot}`];
    return {
      schema: TARGET_METADATA.planSchema,
      status: errors.length === 0 ? TARGET_METADATA.status.ok : TARGET_METADATA.status.error,
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: PUBLIC_RELEASE_CONTRACT.release_line,
      command: TARGET_METADATA.planCommand,
      command_family: TARGET_METADATA.commandFamily,
      target: { name, kind, root: absoluteTargetRoot },
      metadata_policy: context ? policySummary(context) : null,
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
        `run ${PACKAGE_NAME} target metadata --write --target ${absoluteTargetRoot} to generate target metadata with the effective policy`,
        `run ${PACKAGE_NAME} target metadata --write --policy ${METADATA_FILES.policy} --target ${absoluteTargetRoot} when the target repo owns custom metadata semantics`,
        `run ${PACKAGE_NAME} target metadata --write --adopt-existing --target ${absoluteTargetRoot} to preserve existing target-owned schema and authority sections`
      ],
      errors
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
    const { context, plannedWrites } = planMetadataWrites(absoluteTargetRoot, options);
    if (context.errors.length > 0) {
      return {
        schema: TARGET_METADATA.writeSchema,
        status: TARGET_METADATA.status.error,
        package_name: PACKAGE_NAME,
        version: VERSION,
        release_line: PUBLIC_RELEASE_CONTRACT.release_line,
        command: TARGET_METADATA.writeCommand,
        command_family: TARGET_METADATA.commandFamily,
        target: { name, kind, root: absoluteTargetRoot },
        metadata_policy: policySummary(context),
        force: options.force === true,
        adopt_existing: options.adoptExisting === true,
        writes_performed: false,
        planned_writes: [],
        conflicts: [],
        generated_files: [],
        post_write_check: null,
        boundary: noMutationBoundary(),
        errors: context.errors
      };
    }
    const conflicts = plannedWrites.filter((item) => item.action === TARGET_METADATA.action.conflict);
    const ok = conflicts.length === 0;
    if (ok) performMetadataWrites(absoluteTargetRoot, plannedWrites);
    const check = ok ? metadataCheck(absoluteTargetRoot, options) : null;
    const errors = conflicts.map((item) => `${item.path} exists with different content; rerun with --force or --adopt-existing to overwrite generated metadata safely`);
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
      metadata_policy: policySummary(context),
      force: options.force === true,
      adopt_existing: options.adoptExisting === true,
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

  function metadataCheck(targetRoot = process.cwd(), options = {}) {
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
    const context = resolveMetadataPolicy(absoluteTargetRoot, name, options);
    const manifest = manifestReport(absoluteTargetRoot);
    const authorityMap = authorityMapReport(absoluteTargetRoot);
    const markdown_metadata = MARKDOWN_METADATA_FILES.map((relativePath) => markdownMetadataReport(absoluteTargetRoot, relativePath));
    const errors = [
      ...context.errors,
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
      metadata_policy: policySummary(context),
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
