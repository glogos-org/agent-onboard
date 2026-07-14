'use strict';

function createRuntimeSharedContextService(options = {}) {
  const fs = options.fs;
  const path = options.path;
  const runtimeDir = options.runtimeDir;
  const VERSION = options.VERSION;
  const PUBLIC_RELEASE_CONTRACT = options.PUBLIC_RELEASE_CONTRACT;
  const readJson = options.readJson;
  const getPathValue = options.getPathValue;
  const validateWorkItems = options.validateWorkItems;
  const workItemCounts = options.workItemCounts;

  function packageRoot() {
    return path.resolve(runtimeDir, '../..');
  }

  function arrayEquals(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  }

  function sourceContext(root = packageRoot()) {
    const sourceFiles = PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => fs.existsSync(path.join(root, rel)));
    return {
      package_context: sourceFiles.length > 0 ? 'source_repository' : 'installed_package',
      source_context_files_present: sourceFiles,
      source_context_files_missing: PUBLIC_RELEASE_CONTRACT.source_context_files.filter((rel) => !sourceFiles.includes(rel))
    };
  }

  function listRelativeFiles(root) {
    const files = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(absolute);
        else files.push(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
    if (fs.existsSync(root)) walk(root);
    return files.sort();
  }

  function publicReleasePostPublishCommands(version = VERSION) {
    return PUBLIC_RELEASE_CONTRACT.post_publish_verification_commands.map((command) => command.replaceAll('<version>', version));
  }

  function packageJsonReleaseErrors(pkg, root = packageRoot()) {
    const errors = [];
    const required = PUBLIC_RELEASE_CONTRACT.required_package_json;
    if (pkg.name !== required.name) errors.push(`package.json#name must be ${required.name}`);
    if (pkg.version !== VERSION) errors.push(`package.json#version must match runtime version ${VERSION}`);
    if (pkg.private === true) errors.push('package.json#private must not be true for a public package');
    if (pkg.license !== required.license) errors.push(`package.json#license must be ${required.license}`);
    if (pkg.type !== required.type) errors.push(`package.json#type must be ${required.type}`);
    if (!pkg.engines || pkg.engines.node !== required.node_engine) errors.push(`package.json#engines.node must be ${required.node_engine}`);
    for (const field of PUBLIC_RELEASE_CONTRACT.required_metadata_fields) {
      const value = getPathValue(pkg, field);
      const missing = Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';
      if (missing) errors.push(`package.json#${field} is required`);
    }
    if (!Array.isArray(pkg.keywords) || pkg.keywords.length < 5) errors.push('package.json#keywords must contain at least 5 discovery terms');
    const requiredBin = required.bin;
    for (const [name, rel] of Object.entries(requiredBin)) {
      if (!pkg.bin || pkg.bin[name] !== rel) errors.push(`package.json#bin.${name} must be ${rel}`);
      else if (!fs.existsSync(path.join(root, rel))) errors.push(`package.json#bin.${name} points to missing file ${rel}`);
    }
    const actualFiles = Array.isArray(pkg.files) ? pkg.files.slice().sort() : [];
    const expectedFiles = required.files.slice().sort();
    if (!arrayEquals(actualFiles, expectedFiles)) errors.push(`package.json#files must match ${expectedFiles.join(', ')}`);
    for (const rel of expectedFiles) {
      if (!fs.existsSync(path.join(root, rel))) errors.push(`package.json#files includes missing path ${rel}`);
    }
    return errors;
  }

  function packageJsonProjectedPackFiles(pkg) {
    const files = new Set(['package.json']);
    if (Array.isArray(pkg.files)) {
      for (const rel of pkg.files) files.add(rel);
    }
    return Array.from(files).sort();
  }

  function publicArtifactMessagingErrors(root = packageRoot(), files = PUBLIC_RELEASE_CONTRACT.expected_pack_files) {
    const errors = [];
    const forbiddenConcreteWorkItem = /P\d+S\d+M\d+W\d+/;
    const forbiddenKey = ['machine', 'identifier'].join('_');
    const forbiddenNarrativePatterns = [
      new RegExp(['pri', 'vate\\s*\\/\\s*pub', 'lic\\s+sp', 'lit'].join(''), 'i'),
      new RegExp(['in', 'ternal\\s+line'].join(''), 'i'),
      new RegExp(['rese', 'arch\\s+li', 'ne'].join(''), 'i'),
      new RegExp(['str', 'ipp?ed'].join(''), 'i'),
      new RegExp(['sani', 'ti[sz]ed'].join(''), 'i'),
      new RegExp(['\\b', 'le', 'ak(?:age|ed|s|ing)?\\b'].join(''), 'i')
    ];

    for (const rel of files) {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
      const text = fs.readFileSync(abs, 'utf8');
      if (text.includes(forbiddenKey)) errors.push(`${rel} contains reserved implementation key token`);
      const workItemMatch = forbiddenConcreteWorkItem.exec(text);
      if (workItemMatch) errors.push(`${rel} contains concrete work-item token ${workItemMatch[0]}`);
      for (let index = 0; index < forbiddenNarrativePatterns.length; index += 1) {
        const match = forbiddenNarrativePatterns[index].exec(text);
        if (match) errors.push(`${rel} violates public artifact messaging rule ${index + 1}: ${match[0]}`);
      }
    }
    return errors;
  }

  function sourceWorkItemsLedgerCheck(root = packageRoot()) {
    const file = path.join(root, '.agent-onboard', 'work-items.json');
    if (!fs.existsSync(file)) {
      return {
        present: false,
        status: 'skipped',
        reason: 'source work-item ledger is not present in this package context',
        validated: true,
        file: '.agent-onboard/work-items.json',
        counts: null,
        errors: []
      };
    }
    let value;
    try {
      value = readJson(file);
    } catch (error) {
      return {
        present: true,
        status: 'error',
        reason: 'source work-item ledger is not valid JSON',
        validated: false,
        file: '.agent-onboard/work-items.json',
        counts: null,
        errors: [error && error.message ? error.message : String(error)]
      };
    }
    const errors = validateWorkItems(value);
    const counts = workItemCounts(value);
    return {
      present: true,
      status: errors.length === 0 ? 'ok' : 'error',
      reason: errors.length === 0 ? 'source work-item ledger validates' : 'source work-item ledger validation failed',
      validated: errors.length === 0,
      file: '.agent-onboard/work-items.json',
      counts,
      open_work_items: Array.isArray(value.work_items) ? value.work_items.filter((item) => item.status !== 'closed').map((item) => ({ id: item.id, title: item.title, status: item.status })) : [],
      errors
    };
  }

  return Object.freeze({
    listRelativeFiles,
    packageRoot,
    arrayEquals,
    publicReleasePostPublishCommands,
    packageJsonReleaseErrors,
    packageJsonProjectedPackFiles,
    publicArtifactMessagingErrors,
    sourceWorkItemsLedgerCheck,
    sourceContext
  });
}

module.exports = { createRuntimeSharedContextService };
