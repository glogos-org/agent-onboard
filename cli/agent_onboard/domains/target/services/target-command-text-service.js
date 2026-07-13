'use strict';

function emitText(lines) {
  process.stdout.write(`${lines.join('\n')}\n`);
}

function names(items) {
  return Array.isArray(items) && items.length > 0 ? items.map((item) => item.name || item).join(', ') : 'none';
}

function formatTargetDoctorText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target doctor',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`
    ];
  }
  const present = result.canonical_files.filter((item) => item.present).length;
  const missing = result.readiness.missing_files.length > 0 ? result.readiness.missing_files.join(', ') : 'none';
  const invalid = result.readiness.invalid_checks.length > 0 ? result.readiness.invalid_checks.join(', ') : 'none';
  return [
    'agent-onboard target doctor',
    `Target: ${result.target.name} (${result.target.kind})`,
    `Root: ${result.target.root}`,
    `Readiness: ${result.readiness.status} (${result.readiness.score}%)`,
    `Canonical files: ${present}/${result.canonical_files.length} present`,
    `Missing: ${missing}`,
    `Invalid checks: ${invalid}`,
    `Package managers: ${names(result.profile.package_managers)}`,
    `Languages: ${names(result.profile.languages)}`,
    `Frameworks: ${names(result.profile.frameworks)}`,
    'Next steps:',
    ...result.next_steps.map((step) => `  - ${step}`),
    'Writes performed: false'
  ];
}

function formatTargetProfileText(result) {
  if (result.status !== 'ok') {
    return [
      'agent-onboard target profile',
      `Status: ${result.status}`,
      `Target: ${result.target ? result.target.root : 'unknown'}`,
      `Errors: ${(result.errors || []).join('; ') || 'none'}`
    ];
  }
  const scriptLines = result.profile.scripts.length > 0
    ? result.profile.scripts.map((entry) => `  - ${entry.purpose}: ${entry.scripts.join(', ')}`)
    : ['  none'];
  return [
    'agent-onboard target profile',
    `Target: ${result.target.name} (${result.target.kind})`,
    `Root: ${result.target.root}`,
    `Package managers: ${names(result.profile.package_managers)}`,
    `Languages: ${names(result.profile.languages)}`,
    `Frameworks: ${names(result.profile.frameworks)}`,
    'Scripts:',
    ...scriptLines,
    `CI: ${names(result.profile.ci)}`,
    `Docs: ${result.profile.docs.length > 0 ? result.profile.docs.join(', ') : 'none'}`,
    `Git: ${result.profile.git_present ? 'present' : 'missing'}`,
    'Next steps:',
    ...result.next_steps.map((step) => `  - ${step}`),
    'Writes performed: false'
  ];
}

module.exports = {
  emitText,
  formatTargetDoctorText,
  formatTargetProfileText
};
