'use strict';

const targetConstants = require('./target-constants');

const {
  PACKAGE_NAME,
  TARGET_METADATA
} = targetConstants;

const METADATA_FILES = Object.freeze({
  manifest: 'manifest.json',
  authorityMap: 'authority-map.json',
  policy: TARGET_METADATA.defaultPolicyFile,
  sourceOfTruth: 'SOURCE_OF_TRUTH.md'
});

const AOB_METADATA_MARKER = Object.freeze({
  begin: '<!-- BEGIN AOB METADATA -->',
  end: '<!-- END AOB METADATA -->'
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
  'implementation_version'
]);

const DEFAULT_EXCLUDED_PATHS = Object.freeze([
  METADATA_FILES.manifest,
  '.agent-onboard/work-items.json'
]);

const DEFAULT_METADATA_POLICY = Object.freeze({
  profile: TARGET_METADATA.profile.default,
  manifest_schema: TARGET_METADATA.defaultManifestSchema,
  authority_map_schema: TARGET_METADATA.defaultAuthorityMapSchema,
  urn_namespace: null,
  include_control_state: true,
  include_manifest_in_authority_map: true,
  preserve_source_of_truth: true,
  write_source_of_truth: true,
  exclude_paths: DEFAULT_EXCLUDED_PATHS,
  exclude_path_prefixes: Object.freeze([]),
  include_paths: Object.freeze([])
});

const SKIPPED_DIRECTORIES = Object.freeze([
  '.git',
  '.scratch',
  'node_modules'
]);

module.exports = Object.freeze({
  PACKAGE_NAME,
  TARGET_METADATA,
  METADATA_FILES,
  AOB_METADATA_MARKER,
  MARKDOWN_METADATA_FILES,
  MANIFEST_FILE_FIELDS,
  ADMIN_FRONT_MATTER_FIELDS,
  DEFAULT_METADATA_POLICY,
  SKIPPED_DIRECTORIES
});
