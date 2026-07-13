'use strict';

module.exports = function registerFullSourceShard(fullSourceTest, context) {
  const {
    assert,
    fs,
    os,
    path,
    spawnSync,
    ROOT,
    CLI,
    PACKAGE_JSON,
    EXPECTED_VERSION,
    EXPECTED_RELEASE_LINE,
    EXPECTED_VERSIONED_NPX,
    TARGET_CONFIG_FILE,
    EXPECTED_PACK_FILES,
    EXPECTED_PACK_FILES_SORTED,
    copyExpectedPackFiles,
    run,
    targetConfigPath,
    writeTargetConfig,
    readJsonOutput,
    readJsonFailure,
    readJsonlFile,
    readClosureArchiveByRef,
    runNpmPackDryRun,
    runNpm,
    packSourceTarball,
    runNodeScript,
    tempRepo,
    cliTargetConfigForTest,
    writeWorkItemsLedger
  } = context;

  fullSourceTest('full source block line 2095', () => {
    const tarball = packSourceTarball();
    const installRoot = tempRepo();
    const install = runNpm(['install', tarball, '--no-save', '--ignore-scripts', '--no-audit', '--fund=false'], installRoot);
    assert.strictEqual(install.status, 0, install.stderr || install.stdout || (install.error && install.error.message));
    const installedCli = path.join(installRoot, 'node_modules', 'agent-onboard', 'cli', 'agent-onboard.js');
    assert.ok(fs.existsSync(installedCli));

    const status = runNodeScript(installedCli, ['status'], installRoot);
    const statusOutput = readJsonOutput(status);
    assert.strictEqual(statusOutput.version, EXPECTED_VERSION);
    assert.strictEqual(statusOutput.release_line, EXPECTED_RELEASE_LINE);

    const installedCheck = runNodeScript(installedCli, ['release', '--check'], installRoot);
    const installedCheckOutput = readJsonOutput(installedCheck);
    assert.strictEqual(installedCheckOutput.status, 'ok');
    assert.strictEqual(installedCheckOutput.source_context.package_context, 'installed_package');
    assert.strictEqual(installedCheckOutput.source_work_items_ledger.status, 'skipped');

    const installedHandoff = runNodeScript(installedCli, ['release', '--post-publish-handoff'], installRoot);
    const installedHandoffOutput = readJsonOutput(installedHandoff);
    assert.strictEqual(installedHandoffOutput.status, 'ok');
    assert.strictEqual(installedHandoffOutput.source_context.package_context, 'installed_package');
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --published-acceptance`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --real-target-trial`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --map`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --router`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --facades`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --partition-plan`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --partition-check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --extraction-rehearsal`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --extraction-check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} authority --first-read`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} authority --check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} authority --index`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} authority --index-check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target runtime --namespace`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} target runtime --check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --surface`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} release --surface-check`));
    assert.ok(installedHandoffOutput.verification_commands.includes(`${EXPECTED_VERSIONED_NPX} architecture --check`));

    const installedAcceptance = runNodeScript(installedCli, ['release', '--published-acceptance'], installRoot);
    assert.strictEqual(installedAcceptance.status, 0, installedAcceptance.stderr);
    const installedAcceptanceOutput = JSON.parse(installedAcceptance.stdout);
    assert.strictEqual(installedAcceptanceOutput.status, 'ok');
    assert.strictEqual(installedAcceptanceOutput.source_context.package_context, 'installed_package');
    assert.strictEqual(installedAcceptanceOutput.acceptance_mode, 'published_or_installed_package_acceptance');

    const installedRealTrial = runNodeScript(installedCli, ['release', '--real-target-trial'], installRoot);
    const installedRealTrialOutput = readJsonOutput(installedRealTrial);
    assert.strictEqual(installedRealTrialOutput.status, 'ok');
    assert.strictEqual(installedRealTrialOutput.source_context.package_context, 'installed_package');
    assert.strictEqual(installedRealTrialOutput.validated.trial_writes_no_files, true);

    const installedSmoke = runNodeScript(installedCli, ['release', '--target-onboarding-smoke'], installRoot);
    const installedSmokeOutput = readJsonOutput(installedSmoke);
    assert.strictEqual(installedSmokeOutput.status, 'ok');
    assert.strictEqual(installedSmokeOutput.observed.package_context, 'installed_package');
    assert.strictEqual(installedSmokeOutput.validated.explicit_write_performed_in_temporary_target, true);
    assert.strictEqual(installedSmokeOutput.validated.canonical_target_files_only, true);
    assert.strictEqual(installedSmokeOutput.boundary.cleans_up_temp_target_repository, true);

    const targetRoot = tempRepo();
    const installedTargetTrial = runNodeScript(installedCli, ['target', 'onboarding', '--trial'], targetRoot);
    const installedTargetTrialOutput = readJsonOutput(installedTargetTrial);
    assert.strictEqual(installedTargetTrialOutput.status, 'ok');
    assert.strictEqual(installedTargetTrialOutput.ready_for_explicit_write, true);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, 'AGENTS.md')), false);

    const write = runNodeScript(installedCli, ['target', 'onboarding', '--write'], targetRoot);
    const writeOutput = readJsonOutput(write);
    assert.strictEqual(writeOutput.status, 'ok');
    assert.deepStrictEqual(writeOutput.written_files, ['.agent-onboard/target.json', '.agent-onboard/runtime-namespace.json', '.agent-onboard/project.json', '.agent-onboard/work-items.json', 'AGENTS.md', 'llms.txt', '.agent-onboard/authority-path.json']);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, '.agent-onboard/target.json')), true);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, '.agent-onboard', 'project.json')), true);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, '.agent-onboard', 'work-items.json')), true);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetRoot, 'node_modules')), false);
  });


  fullSourceTest('full source block line 2176', () => {
    const forbiddenKey = ['machine', 'identifier'].join('_');
    const forbiddenWorkItemPattern = new RegExp('P\\d+S\\d+M\\d+W\\d+');
    const ignoredDirs = new Set(['node_modules', '.git']);
    const textExtensions = new Set(['', '.js', '.json', '.md', '.txt']);

    function walk(dir) {
      const entries = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ignoredDirs.has(entry.name)) continue;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) entries.push(...walk(abs));
        else entries.push(abs);
      }
      return entries;
    }

    const violations = [];
    for (const abs of walk(ROOT)) {
      const rel = path.relative(ROOT, abs).split(path.sep).join('/');
      const ext = path.extname(rel);
      if (!textExtensions.has(ext) && rel !== 'LICENSE') continue;
      const text = fs.readFileSync(abs, 'utf8');
      if (text.includes(forbiddenKey)) violations.push(`${rel}: reserved implementation key token`);
      const match = forbiddenWorkItemPattern.exec(text);
      const sourceControlArtifact = rel.startsWith('.agent-onboard/') && rel.endsWith('.json');
      const archivedOrTestArtifact = rel === 'docs/release-history.md' || rel === 'SOURCE_OF_TRUTH.md' || rel.startsWith('test/') || rel.startsWith('scripts/check-');
      if (match && rel !== '.agent-onboard/work-items.json' && !sourceControlArtifact && !archivedOrTestArtifact) {
        violations.push(`${rel}: reserved concrete work-item token ${match[0]}`);
      }
    }
    assert.deepStrictEqual(violations, []);
  });


  fullSourceTest('full source block line 2210', () => {
    const rx = (parts, flags = 'i') => new RegExp(parts.join(''), flags);
    const forbiddenNarrativePatterns = [
      rx(['pri', 'vate\\s*\\/\\s*pub', 'lic\\s+sp', 'lit']),
      rx(['int', 'ernal\\s+li', 'ne']),
      rx(['rese', 'arch\\s+li', 'ne']),
      rx(['str', 'ipp?ed']),
      rx(['sani', 'ti[sz]ed']),
      rx(['\\b', 'le', 'ak(?:age|ed|s|ing)?\\b'])
    ];
    const scannedFiles = ['README.md', 'package.json', 'cli/agent-onboard.js'];
    const violations = [];
    for (const rel of scannedFiles) {
      const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      for (let index = 0; index < forbiddenNarrativePatterns.length; index += 1) {
        const match = forbiddenNarrativePatterns[index].exec(text);
        if (match) violations.push(`${rel}: narrative-rule-${index + 1}: ${match[0]}`);
      }
    }
    assert.deepStrictEqual(violations, []);
  });


  fullSourceTest('full source block line 2233', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const releaseHistory = fs.existsSync(path.join(ROOT, 'docs', 'release-history.md')) ? fs.readFileSync(path.join(ROOT, 'docs', 'release-history.md'), 'utf8') : '';
    const readmeHistoryCorpus = `${readme}
  ${releaseHistory}`;
    assert.ok(readme.includes('work-items --claim --write --id <public-work-item-id> --actor <actor>'));
    assert.ok(readme.includes('work-items --close --write --id <public-work-item-id> --actor <actor> --summary <summary>'));
    assert.ok(readme.includes('npx agent-onboard target doctor --text'));
    assert.ok(readme.includes('npx agent-onboard target profile --text'));
    assert.ok(readme.includes('npx agent-onboard work-items --summary [.agent-onboard/work-items.json]'));
    assert.ok(readme.includes('npx agent-onboard work-items --summary [.agent-onboard/work-items.json] --text'));
    assert.ok(readme.includes('npx agent-onboard work-items --next [.agent-onboard/work-items.json]'));
    assert.ok(readme.includes('npx agent-onboard work-items --next [.agent-onboard/work-items.json] --text'));
    assert.ok(readme.includes('npx agent-onboard work-items --mine [.agent-onboard/work-items.json] --actor <actor>'));
    assert.ok(readme.includes('npx agent-onboard work-items --mine [.agent-onboard/work-items.json] --actor <actor> --text'));
    assert.ok(!readme.includes('This release does not add claim write'));
    assert.ok(readme.includes('`0.0.11` adds public `work-items --claim --dry-run`'));
    assert.ok(readme.includes('`0.0.13` adds source self-dogfood and agent participation support'));
    assert.ok(readme.includes('`0.0.14` adds the public source participation lifecycle gate'));
    assert.ok(readme.includes('`0.0.15` adds the public handoff and closure evidence gate'));

    assert.ok(readme.includes('`0.0.16` aligns public source closure tests'));
    assert.ok(readme.includes('`0.0.17` adds public `release --plan` and `release --check`'));
    assert.ok(readme.includes('`0.0.18` integrates that release surface into a normalized public release contract'));
    assert.ok(readme.includes('`0.0.19` adds a public package contract fixture matrix'));
    assert.ok(readme.includes('`0.0.20` adds installed package parity smoke'));
    assert.ok(readme.includes('`0.0.21` adds the public target onboarding surface plan'));
    assert.ok(readme.includes('`0.0.22` adds the public target onboarding dry-run fixture matrix'));
    assert.ok(readme.includes('`0.0.23` adds the public target onboarding explicit write boundary'));
    assert.ok(readme.includes('`0.0.24` adds the public target onboarding installed-package smoke'));
    assert.ok(readme.includes('`0.0.25` adds the public target onboarding post-publish verification handoff'));
    assert.ok(readme.includes('`0.0.26` adds the public target onboarding published package acceptance gate'));
    assert.ok(readme.includes('`0.0.29` adds the public command router boundary gate'));
    assert.ok(readme.includes('`0.0.30` adds the public domain service facade gate'));
    assert.ok(readme.includes('`0.0.31` adds the public authority first-read index gate'));
    assert.ok(readme.includes('`0.0.32` adds the public target runtime namespace gate'));
    assert.ok(readme.includes('`0.0.33` adds the public package surface preservation gate'));
    assert.ok(readme.includes('`0.0.34` adds the public installed parity architecture smoke gate'));
    assert.ok(readme.includes('`0.0.35` adds the public source domain module partition planning gate'));
    assert.ok(readme.includes('This release adds the public target repo doctor command'));
    assert.ok(readme.includes('This release adds the public target onboarding repair command'));
    assert.ok(readme.includes('This release adds the public target repo profile command'));
    assert.ok(readme.includes('This release adds the public source module extraction adapter boundary gate'));
    assert.ok(readme.includes('This release adds the public source extraction golden output freeze gate'));
    assert.ok(readme.includes('npx agent-onboard architecture --golden-outputs'));
    assert.ok(readme.includes('npx agent-onboard architecture --golden-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --adapter-boundary'));
    assert.ok(readme.includes('npx agent-onboard architecture --adapter-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --first-slice'));
    assert.ok(readme.includes('npx agent-onboard architecture --first-slice-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --bundle-parity'));
    assert.ok(readme.includes('npx agent-onboard architecture --bundle-parity-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --runtime-bridge'));
    assert.ok(readme.includes('npx agent-onboard architecture --runtime-bridge-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --installed-fallback-smoke'));
    assert.ok(readme.includes('npx agent-onboard architecture --installed-fallback-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --second-slice-plan'));
    assert.ok(readme.includes('npx agent-onboard architecture --second-slice-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --second-slice-first-slice'));
    assert.ok(readme.includes('npx agent-onboard architecture --second-slice-first-slice-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --authority-bundle-parity'));
    assert.ok(readme.includes('npx agent-onboard architecture --authority-bundle-parity-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --authority-runtime-bridge'));
    assert.ok(readme.includes('npx agent-onboard architecture --authority-runtime-bridge-check'));
    assert.ok(readme.includes('This release adds the public source module extraction installed fallback smoke gate'));
    assert.ok(readme.includes('This release adds the public source module extraction runtime bridge gate'));
    assert.ok(readme.includes('This release adds the public source module extraction authority runtime bridge gate'));
    assert.ok(readme.includes('This release adds the public source module extraction first slice gate'));
    assert.ok(readme.includes('npx agent-onboard release --version-sprawl-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --partition-plan'));
    assert.ok(readme.includes('npx agent-onboard architecture --partition-check'));
    assert.ok(readme.includes('npx agent-onboard architecture --extraction-rehearsal'));
    assert.ok(readme.includes('npx agent-onboard architecture --extraction-check'));
    assert.ok(readme.includes('npx agent-onboard release --surface'));
    assert.ok(readme.includes('npx agent-onboard release --surface-check'));
    assert.ok(readme.includes('npx agent-onboard release --source-manifest'));
    assert.ok(readme.includes('npx agent-onboard release --source-manifest-check'));
    assert.ok(readme.includes('npx agent-onboard authority --first-read'));
    assert.ok(readme.includes('npx agent-onboard authority --check'));
    assert.ok(readme.includes('npx agent-onboard authority --index'));
    assert.ok(readme.includes('npx agent-onboard authority --index-check'));
    assert.ok(readme.includes('npx agent-onboard authority --state'));
    assert.ok(readme.includes('npx agent-onboard authority --state-check'));
    assert.ok(readme.includes('Current release: `release --authority-state-parity-check` verifies that authority state shards remain source-only'));
    assert.ok(readme.includes('npx agent-onboard target doctor --json'));
    assert.ok(readme.includes('npx agent-onboard target profile --json'));
    assert.ok(readme.includes('npx agent-onboard target work-items --preview'));
    assert.ok(readme.includes('npx agent-onboard target handoff --preview'));
    assert.ok(readme.includes('npx agent-onboard target repair --plan'));
    assert.ok(readme.includes('npx agent-onboard target repair --write'));
    assert.ok(readme.includes('npx agent-onboard target metadata --plan'));
    assert.ok(readme.includes('npx agent-onboard target metadata --check'));
    assert.ok(readme.includes('npx agent-onboard target metadata --write'));
    assert.ok(readme.includes('Generate `SOURCE_OF_TRUTH.md`, `authority-map.json`, and `manifest.json`'));
    assert.ok(readme.includes('A target policy can override `manifest_schema`, `authority_map_schema`, `urn_namespace`'));
    assert.ok(readme.includes('npx agent-onboard target onboarding --write'));
    assert.ok(readme.includes('npx agent-onboard target onboarding --fixture'));
    assert.ok(readme.includes('npx agent-onboard target onboarding --trial'));
    assert.ok(readme.includes('npx agent-onboard target onboarding --plan'));
    assert.ok(readme.includes('The plan reports the target identity inferred from the current directory'));
    assert.ok(readme.includes('npx agent-onboard release --parity-smoke'));
    assert.ok(readme.includes('npx agent-onboard release --architecture-parity-smoke'));
    assert.ok(readme.includes('npx agent-onboard release --target-onboarding-smoke'));
    assert.ok(readme.includes('npx agent-onboard release --post-publish-handoff'));
    assert.ok(readme.includes('npx agent-onboard release --published-acceptance'));
    assert.ok(readme.includes('npx agent-onboard release --real-target-trial'));
    assert.ok(readme.includes('npx agent-onboard release --contract'));
    assert.ok(readme.includes('npx agent-onboard release --fixture'));
    assert.ok(readme.includes('npx agent-onboard release --check'));
    assert.ok(readme.includes('The check validates package metadata, bin entrypoints, the projected npm pack allowlist'));
    assert.ok(readme.includes('Historical source-extraction release checks are reported as retired'));
    assert.ok(readme.includes('The parity smoke checks that the source candidate release check passes'));
    assert.ok(readme.includes('The architecture parity smoke now validates the reduced legacy architecture surface'));
    assert.ok(readme.includes('The target onboarding smoke creates and removes a temporary target repo'));
    assert.ok(readme.includes('The post-publish handoff emits the version-pinned npm view and npx commands'));
    assert.ok(readme.includes('The published acceptance command composes release check'));
    assert.ok(readme.includes('The real target trial command runs a no-write onboarding readiness check'));
    assert.ok(readme.includes('source work-item ledger when that ledger is present'));
    assert.ok(readme.includes('The claim response also returns `next_steps`'));
    assert.ok(readme.includes('The close command reads the existing ledger'));
    assert.ok(readme.includes('This release adds public work-item usability JSON views'));
    assert.ok(readme.includes('This release adds public human-readable output mode'));
    assert.ok(readme.includes('This release expands the public target metadata engine with policy-driven output'));
    assert.ok(readme.includes('This release reduces the retired M3 architecture checker surface'));
    assert.ok(readme.includes('This release extracts public runtime contracts into `cli/agent_onboard/runtime-contracts.js`'));
    assert.ok(readme.includes('This release expands the public runtime contracts with shared top-level command aliases'));
    assert.ok(readme.includes('`work-items --summary` returns total counts'));
    assert.ok(readme.includes('`work-items --next` returns the first open item'));
    assert.ok(readme.includes('`work-items --mine` returns the actor'));
    assert.ok(readme.includes('Use `--text` on target-facing inspection commands'));
    assert.ok(readme.includes('npx agent-onboard check --plan --text'));
    assert.ok(readme.includes('npx agent-onboard check --fast --text'));
    assert.ok(readmeHistoryCorpus.includes('The current release adds `contracts --json|--text|--check` as a compact public contract/interface spine'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added `target handoff --readiness-check --json|--text` as a no-write machine-readable readiness gate'));
    assert.ok(readmeHistoryCorpus.includes('without exporting the source-only implementation archive or requiring TypeScript/abstract classes'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added stable handoff readiness reason codes to `target handoff --json|--text`'));
    assert.ok(readmeHistoryCorpus.includes('The earlier governance budget gate remains available through `target governance --budget-check --json|--text`'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added `target governance --budget-check --json|--text` as a compact no-write target scan'));
    assert.ok(readmeHistoryCorpus.includes('4096-byte per-index and 8192-byte combined governance budget'));
    assert.ok(readmeHistoryCorpus.includes('The previous release wires governance index drift into first-read surfaces'));
    assert.ok(readmeHistoryCorpus.includes('`check --fast --json|--text` emits governance stale-read advisories when stored indexes are `stale`, `missing`, or blocked'));
    assert.ok(readmeHistoryCorpus.includes('target governance budget contract'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target governance index drift check gate'));
    assert.ok(readmeHistoryCorpus.includes('`target governance --check` compares stored governance indexes with freshly derived payloads and reports `fresh`, `stale`, or `missing` without writing files'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target governance index refresh integration gate'));
    assert.ok(readmeHistoryCorpus.includes('`work-items --init|--append|--claim|--close --write` now refreshes allowlisted governance indexes after a successful canonical `.agent-onboard/work-items.json` mutation'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target governance index explicit write product surface'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target governance index materialization dry-run product surface'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target governance preview product surface'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target handoff preview product surface'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public target work-items preview product surface'));
    assert.ok(readmeHistoryCorpus.includes('without dependency installation, managed-project command execution, Git mutation, network access, or writes'));
    assert.ok(readmeHistoryCorpus.includes('The previous release added the public MCP bridge plan / skeleton product surface'));
    assert.ok(readmeHistoryCorpus.includes('without starting an MCP server, adding MCP dependencies, opening sockets, starting stdio transport, writing files, network, Git mutation, or publish'));
  });


  fullSourceTest('full source block line 2323', () => {
    const help = run(['--help']);
    assert.ok(help.stdout.includes('work-items --summary [.agent-onboard/work-items.json]'));
    assert.ok(help.stdout.includes('work-items --summary [.agent-onboard/work-items.json] [--text]'));
    assert.ok(help.stdout.includes('work-items --next [.agent-onboard/work-items.json]'));
    assert.ok(help.stdout.includes('work-items --next [.agent-onboard/work-items.json] [--text]'));
    assert.ok(help.stdout.includes('work-items --mine [.agent-onboard/work-items.json] --actor <actor>'));
    assert.ok(help.stdout.includes('work-items --mine [.agent-onboard/work-items.json] --actor <actor> [--text]'));
    assert.ok(help.stdout.includes('create --dry-run|--json|--text'));
    assert.ok(help.stdout.includes('check --plan|--fast [--json|--text]'));
    assert.ok(help.stdout.includes('authority --first-read|--check|--index|--index-check|--state|--state-check'));
    assert.ok(help.stdout.includes('ci --github-action|--json|--text'));
    assert.ok(help.stdout.includes('mcp --plan|--json|--text'));
    assert.ok(help.stdout.includes('target doctor --json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target profile --json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target inventory --preview|--json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target memory --preview|--json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target work-items --preview|--json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target governance --preview|--check|--budget-contract|--budget-check|--materialize-dry-run|--materialize --write [--force]|--json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target handoff --preview|--readiness-check|--json|--text [--target <path>]'));
    assert.ok(help.stdout.includes('target metadata --plan|--check|--write [--profile default] [--policy <path>] [--adopt-existing] [--force] [--target <path>]'));
    assert.ok(help.stdout.includes('target manifest --check-drift|--init|--refresh [--dry-run|--write] [--target <path>]'));
    assert.ok(help.stdout.includes('work-items --claim --dry-run|--write --id <public-work-item-id> --actor <actor>'));
    assert.ok(help.stdout.includes('work-items --close --dry-run|--write --id <public-work-item-id> --actor <actor> --summary <summary>'));
    assert.ok(help.stdout.includes('architecture --map|--router|--facades|--check'));
    assert.ok(!help.stdout.includes('claims-installed-fallback-smoke'));
    assert.ok(help.stdout.includes('release --plan|--surface|--surface-check|--source-manifest|--source-manifest-check|--artifact-oracle|--artifact-oracle-check|--authority-state-parity|--authority-state-parity-check|--clean-inventory|--clean-check|--clean-catalog|--clean-catalog-check|--keyword-taxonomy|--keyword-taxonomy-check'));
    assert.ok(help.stdout.includes('--closed-gates-apply|--closed-gates-apply-check|--closed-gates-read|--closed-gates-read-check|--closed-gates-prune-plan|--closed-gates-prune-plan-check|--closed-gates-prune-dry-run|--closed-gates-prune-dry-run-check|--closed-gates-prune-apply|--closed-gates-prune-apply-check'));
    assert.ok(help.stdout.includes('--target-onboarding-smoke|--real-target-trial|--check'));
    assert.ok(help.stdout.includes('target repair --plan|--write [--force] [--target <path>]'));
    assert.ok(help.stdout.includes('target onboarding --plan|--fixture|--trial [--target <path>]|--write [--force]'));
  });


  fullSourceTest('full source block line 2333', () => {
    const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
    assert.ok(agents.includes('node cli/agent-onboard.js work-items --list'));
    assert.ok(agents.includes('node cli/agent-onboard.js work-items --claim --write --id <public-work-item-id> --actor <agent-or-human-name>'));
    assert.ok(agents.includes('node cli/agent-onboard.js work-items --close --dry-run --id <public-work-item-id> --actor <agent-or-human-name> --summary <summary>'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --map'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --router'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --facades'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --partition-plan'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --partition-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --golden-outputs'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --golden-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --adapter-boundary'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --adapter-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --first-slice'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --first-slice-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --bundle-parity'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --bundle-parity-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --runtime-bridge'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --runtime-bridge-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --installed-fallback-smoke'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --installed-fallback-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --second-slice-plan'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --second-slice-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --second-slice-first-slice'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --second-slice-first-slice-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --authority-bundle-parity'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --authority-bundle-parity-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --authority-runtime-bridge'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --authority-runtime-bridge-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-plan'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-first-slice'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-first-slice-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-installed-fallback-smoke'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --work-items-installed-fallback-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js architecture --check'));
  assert.ok(agents.includes('node cli/agent-onboard.js target runtime --namespace'));
  assert.ok(agents.includes('node cli/agent-onboard.js target runtime --check'));
    assert.ok(agents.includes('node cli/agent-onboard.js check --plan --text'));
    assert.ok(agents.includes('node cli/agent-onboard.js authority --state'));
    assert.ok(agents.includes('node cli/agent-onboard.js authority --state-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --authority-state-parity-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js check --fast --text'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --check'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --contract'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --fixture'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --surface'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --surface-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --source-manifest'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --source-manifest-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --version-sprawl-check'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --parity-smoke'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --architecture-parity-smoke'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --target-onboarding-smoke'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --post-publish-handoff'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --published-acceptance'));
    assert.ok(agents.includes('node cli/agent-onboard.js release --real-target-trial'));
    assert.ok(agents.includes('node cli/agent-onboard.js target memory --preview'));
    assert.ok(agents.includes('node cli/agent-onboard.js target governance --preview'));
    assert.ok(agents.includes('node cli/agent-onboard.js target governance --materialize-dry-run'));
    assert.ok(agents.includes('node cli/agent-onboard.js target governance --check'));
    assert.ok(agents.includes('node cli/agent-onboard.js target governance --materialize --write --force'));
    assert.ok(agents.includes('node cli/agent-onboard.js target handoff --preview'));
    assert.ok(agents.includes('node cli/agent-onboard.js target onboarding --plan'));
    assert.ok(agents.includes('node cli/agent-onboard.js target onboarding --fixture'));
    assert.ok(agents.includes('node cli/agent-onboard.js target onboarding --trial'));
    assert.ok(agents.includes('node cli/agent-onboard.js target onboarding --write'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.19'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.18'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.17'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.16'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.29'));
    assert.ok(!agents.includes('npx agent-onboard@0.0.15'));
  });


  fullSourceTest('full source block line 2396', () => {
    const result = run(['architecture', '--m2-seed-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-architecture-m1-closure-m2-seed-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --m2-seed-check');
    assert.ok(output.validated.prerequisite_authority_runtime_bridge);
    assert.ok(output.validated.m1_milestone_closed_or_installed_context_allowed);
    assert.ok(output.validated.m1_work_items_all_closed_or_installed_context_allowed);
    assert.ok(output.validated.m2_milestone_open_or_installed_context_allowed);
    assert.ok(output.validated.seed_work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_work_item_seeded_or_installed_context_allowed);
    assert.strictEqual(output.milestone_transition.closed_milestone.status, 'closed');
    assert.strictEqual(output.milestone_transition.opened_milestone.status, 'closed');
    assert.strictEqual(output.milestone_transition.next_work_item.status, 'closed');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2417', () => {
    const result = run(['architecture', '--work-items-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-work-items-domain-source-extraction-plan-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --work-items-check');
    assert.ok(output.validated.prerequisite_m2_seed);
    assert.ok(output.validated.work_items_domain_selected);
    assert.ok(output.validated.planned_module_absent_or_created_by_followup);
    assert.ok(output.validated.current_work_item_closed_or_installed_context_allowed);
    assert.ok(output.validated.next_work_item_seeded_or_installed_context_allowed);
    assert.strictEqual(output.planned_domain.id, 'work_items');
    assert.strictEqual(output.planned_domain.planned_module, 'src/domains/work-items.js');
    assert.strictEqual(output.work_items.current.status, 'closed');
    assert.strictEqual(output.work_items.next.status, 'closed');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2438', () => {
    const result = run(['architecture', '--work-items-first-slice-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-work-items-first-slice-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --work-items-first-slice-check');
    assert.ok(output.validated.extracted_domain_is_work_items);
    assert.ok(output.validated.claim_and_close_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2452', () => {
    const result = run(['architecture', '--work-items-bundle-parity-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-work-items-bundle-parity-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --work-items-bundle-parity-check');
    assert.ok(output.validated.first_slice);
    assert.ok(output.validated.bundle_parity_status);
    assert.ok(output.validated.source_slice_domain_matches_bundled_work_items);
    assert.ok(output.validated.source_slice_commands_match_bundled_work_items);
    assert.ok(output.validated.source_slice_exclusions_match_bundled_work_items);
    assert.ok(output.validated.source_slice_write_boundary_matches_bundled_work_items);
    assert.ok(output.validated.claim_and_close_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.strictEqual(output.bundled_work_items_view.domain, 'work_items');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2473', () => {
    const result = run(['architecture', '--work-items-runtime-bridge-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-work-items-runtime-bridge-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --work-items-runtime-bridge-check');
    assert.ok(output.validated.work_items_bundle_parity);
    assert.ok(output.validated.installed_context_fallback_allowed);
    assert.ok(output.validated.claim_and_close_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2488', () => {
    const result = run(['architecture', '--work-items-installed-fallback-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-work-items-installed-fallback-smoke-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --work-items-installed-fallback-check');
    assert.ok(output.validated.work_items_runtime_bridge_check);
    assert.ok(output.validated.source_module_out_of_pack);
    assert.ok(output.validated.installed_context_uses_bundled_fallback);
    assert.ok(output.validated.claim_and_close_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2505', () => {
    const result = run(['architecture', '--claims-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-claims-domain-source-extraction-plan-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --claims-check');
    assert.ok(output.validated.prerequisite_work_items_installed_fallback);
    assert.ok(output.validated.claims_domain_selected);
    assert.ok(output.validated.planned_module_absent_or_created_by_followup);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.strictEqual(output.planned_domain.id, 'claims');
    assert.strictEqual(output.planned_domain.planned_module, 'src/domains/claims.js');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2523', () => {
    const result = run(['architecture', '--claims-first-slice-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-claims-first-slice-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --claims-first-slice-check');
    assert.ok(output.validated.claims_plan);
    assert.ok(output.validated.extracted_domain_is_claims);
    assert.ok(output.validated.shared_work_items_ledger_preserved);
    assert.ok(output.validated.non_claim_work_items_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.strictEqual(output.source_module.path, 'src/domains/claims.js');
    assert.strictEqual(output.source_module.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2542', () => {
    const result = run(['architecture', '--claims-bundle-parity-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-claims-bundle-parity-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --claims-bundle-parity-check');
    assert.ok(output.validated.first_slice);
    assert.ok(output.validated.source_slice_domain_matches_bundled_claims);
    assert.ok(output.validated.source_slice_commands_match_bundled_claims);
    assert.ok(output.validated.shared_work_items_ledger_preserved);
    assert.ok(output.validated.claim_contract_matches_bundled_claims);
    assert.ok(output.validated.close_contract_matches_bundled_claims);
    assert.ok(output.validated.non_claim_work_items_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2562', () => {
    const result = run(['architecture', '--claims-runtime-bridge-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-claims-runtime-bridge-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --claims-runtime-bridge-check');
    assert.ok(output.validated.claims_bundle_parity);
    assert.ok(output.validated.source_module_loaded_when_present);
    assert.ok(output.validated.installed_context_fallback_allowed);
    assert.ok(output.validated.shared_work_items_ledger_preserved);
    assert.ok(output.validated.non_claim_work_items_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.strictEqual(output.source_claims_runtime_bridge_file.path, '.agent-onboard/source-module-extraction-claims-runtime-bridge.json');
    assert.strictEqual(output.source_claims_runtime_bridge_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });


  fullSourceTest('full source block line 2581', () => {
    const result = run(['architecture', '--claims-installed-fallback-check']);
    const output = readJsonOutput(result);
    assert.strictEqual(output.schema, 'agent-onboard-public-source-module-claims-installed-fallback-smoke-check-result-001');
    assert.strictEqual(output.status, 'ok');
    assert.strictEqual(output.version, EXPECTED_VERSION);
    assert.strictEqual(output.release_line, EXPECTED_RELEASE_LINE);
    assert.strictEqual(output.command, 'agent-onboard architecture --claims-installed-fallback-check');
    assert.ok(output.validated.claims_runtime_bridge_check);
    assert.ok(output.validated.source_module_out_of_pack);
    assert.ok(output.validated.installed_context_uses_bundled_fallback);
    assert.ok(output.validated.shared_work_items_ledger_preserved);
    assert.ok(output.validated.non_claim_work_items_commands_excluded);
    assert.ok(output.validated.package_allowlist_unchanged);
    assert.strictEqual(output.source_claims_installed_fallback_file.path, '.agent-onboard/source-module-extraction-claims-installed-fallback-smoke.json');
    assert.strictEqual(output.source_claims_installed_fallback_file.status, 'present_validated');
    assert.deepStrictEqual(output.errors, []);
  });
};
