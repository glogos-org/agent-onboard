'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function defaultNpmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function compactSpawnSummary(result) {
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  return {
    status: result.status === 0 ? 'ok' : 'error',
    exit_code: result.status,
    signal: result.signal || null,
    stdout_bytes: Buffer.byteLength(stdout),
    stderr_bytes: Buffer.byteLength(stderr),
    stdout_preview: stdout.trim().slice(0, 240),
    stderr_preview: stderr.trim().slice(0, 240)
  };
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseNpmPackJson(stdout) {
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0] || typeof parsed[0] !== 'object') {
    throw new Error('npm pack --json must return a single package entry');
  }
  return parsed[0];
}

function exactArtifactPackFiles(packEntry) {
  return Array.isArray(packEntry.files) ? packEntry.files.map((file) => file.path).sort() : [];
}

function removeTempRoot(tempRoot) {
  if (!tempRoot || !tempRoot.startsWith(os.tmpdir())) return;
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function createPublicExactArtifactOracleService(deps) {
  const {
    PACKAGE_NAME,
    VERSION,
    RELEASE_LINE,
    PUBLIC_RELEASE_CONTRACT,
    sourceContext,
    readJson,
    arrayEquals,
    packageRoot,
    npmExecutable = defaultNpmExecutable
  } = deps;

  const publicExactArtifactOracleContract = Object.freeze({
    schema: 'agent-onboard-public-exact-artifact-oracle-contract-001',
    package_name: PACKAGE_NAME,
    release_line: RELEASE_LINE,
    command: 'agent-onboard release --artifact-oracle',
    check_command: 'agent-onboard release --artifact-oracle-check',
    role: 'local exact npm artifact projection and fresh installed CLI smoke oracle',
    pack_command: 'npm pack --json --pack-destination <temp>',
    install_command: 'npm install --no-audit --no-fund --ignore-scripts <local-tgz>',
    smoke_commands: Object.freeze([
      'node node_modules/agent-onboard/cli/agent-onboard.js --version',
      'node node_modules/agent-onboard/cli/agent-onboard.js release --check'
    ]),
    boundary: Object.freeze({
      writes_package_root: false,
      writes_target_repository_state: false,
      writes_temp_files: true,
      removes_temp_files: true,
      child_process_spawn: true,
      runs_package_manager: true,
      package_manager_uses_local_tgz_only: true,
      publishes_package: false,
      mutates_registry: false,
      network_required: false,
      raw_stdout_inlined: false,
      raw_stderr_inlined: false
    })
  });

  function publicExactArtifactOracle(root = packageRoot()) {
    const pkg = readJson(path.join(root, 'package.json'));
    const expectedPackFiles = PUBLIC_RELEASE_CONTRACT.expected_pack_files.slice().sort();
    const errors = [];
    let tempRoot = null;
    let packSummary = null;
    let installSummary = null;
    let versionSmokeSummary = null;
    let releaseSmokeSummary = null;
    let authorityStateSmokeSummary = null;
    let authorityStateParitySmokeSummary = null;
    let packEntry = null;
    let tarball = null;
    let tarballSha256 = null;
    let installedCli = null;
    let cliEntrypointPresent = false;
    let cleanupStatus = 'not_started';

    try {
      tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-onboard-artifact-oracle-'));
      const packDir = path.join(tempRoot, 'pack');
      const installRoot = path.join(tempRoot, 'install');
      fs.mkdirSync(packDir, { recursive: true });
      fs.mkdirSync(installRoot, { recursive: true });

      const packResult = spawnSync(npmExecutable(), ['pack', '--json', '--pack-destination', packDir], {
        cwd: root,
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024
      });
      packSummary = compactSpawnSummary(packResult);
      if (packResult.status !== 0) {
        errors.push('npm pack exact artifact projection must exit 0');
      } else {
        try {
          packEntry = parseNpmPackJson(packResult.stdout);
          tarball = path.join(packDir, packEntry.filename || '');
          if (!fs.existsSync(tarball)) errors.push('npm pack exact tarball must exist in temp pack directory');
          else tarballSha256 = sha256File(tarball);
        } catch (error) {
          errors.push(`npm pack JSON parse failed: ${error.message}`);
        }
      }

      const actualPackFiles = packEntry ? exactArtifactPackFiles(packEntry) : [];
      if (packEntry) {
        if (packEntry.name !== PACKAGE_NAME) errors.push(`npm pack name must be ${PACKAGE_NAME}`);
        if (packEntry.version !== VERSION) errors.push(`npm pack version must be ${VERSION}`);
        if (packEntry.filename !== `${PACKAGE_NAME}-${VERSION}.tgz`) errors.push(`npm pack filename must be ${PACKAGE_NAME}-${VERSION}.tgz`);
        if (!arrayEquals(actualPackFiles, expectedPackFiles)) errors.push(`npm pack file list must match ${expectedPackFiles.join(', ')}`);
        if (typeof packEntry.integrity !== 'string' || !packEntry.integrity.startsWith('sha512-')) errors.push('npm pack integrity must be present');
        if (typeof packEntry.shasum !== 'string' || packEntry.shasum.length === 0) errors.push('npm pack shasum must be present');
      }

      if (tarball && fs.existsSync(tarball)) {
        fs.writeFileSync(path.join(installRoot, 'package.json'), JSON.stringify({ private: true, name: 'agent-onboard-artifact-oracle-smoke' }, null, 2) + '\n');
        const installResult = spawnSync(npmExecutable(), ['install', '--no-audit', '--no-fund', '--ignore-scripts', tarball], {
          cwd: installRoot,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 20 * 1024 * 1024
        });
        installSummary = compactSpawnSummary(installResult);
        if (installResult.status !== 0) errors.push('fresh install smoke from exact local tgz must exit 0');

        installedCli = path.join(installRoot, 'node_modules', PACKAGE_NAME, 'cli', 'agent-onboard.js');
        cliEntrypointPresent = fs.existsSync(installedCli);
        if (!cliEntrypointPresent) errors.push('fresh install smoke must include CLI entrypoint');
        else {
          const versionSmoke = spawnSync(process.execPath, [installedCli, '--version'], {
            cwd: installRoot,
            encoding: 'utf8',
            timeout: 60000,
            maxBuffer: 5 * 1024 * 1024
          });
          versionSmokeSummary = compactSpawnSummary(versionSmoke);
          if (versionSmoke.status !== 0 || versionSmoke.stdout.trim() !== VERSION) errors.push('fresh installed CLI --version must match package version');

          const releaseSmoke = spawnSync(process.execPath, [installedCli, 'release', '--check'], {
            cwd: installRoot,
            encoding: 'utf8',
            timeout: 120000,
            maxBuffer: 20 * 1024 * 1024
          });
          releaseSmokeSummary = compactSpawnSummary(releaseSmoke);
          if (releaseSmoke.status !== 0) errors.push('fresh installed CLI release --check must exit 0');
          else {
            try {
              const releaseOutput = JSON.parse(releaseSmoke.stdout);
              if (releaseOutput.status !== 'ok') errors.push('fresh installed CLI release --check must return ok');
              if (releaseOutput.version !== VERSION) errors.push('fresh installed CLI release --check version must match package version');
            } catch (error) {
              errors.push(`fresh installed CLI release --check JSON parse failed: ${error.message}`);
            }
          }

          const authorityStateSmoke = spawnSync(process.execPath, [installedCli, 'authority', '--state-check'], {
            cwd: installRoot,
            encoding: 'utf8',
            timeout: 120000,
            maxBuffer: 20 * 1024 * 1024
          });
          authorityStateSmokeSummary = compactSpawnSummary(authorityStateSmoke);
          if (authorityStateSmoke.status !== 0) errors.push('fresh installed CLI authority --state-check must exit 0');
          else {
            try {
              const stateOutput = JSON.parse(authorityStateSmoke.stdout);
              if (stateOutput.status !== 'ok') errors.push('fresh installed CLI authority --state-check must return ok');
              if (stateOutput.package_context !== 'installed_package') errors.push('fresh installed CLI authority --state-check must observe installed_package context');
              if (!stateOutput.validated || stateOutput.validated.source_shards_present_or_installed_context_allowed !== true) errors.push('fresh installed CLI authority --state-check must permit absent source-only shards');
            } catch (error) {
              errors.push(`fresh installed CLI authority --state-check JSON parse failed: ${error.message}`);
            }
          }

          const paritySmoke = spawnSync(process.execPath, [installedCli, 'release', '--authority-state-parity-check'], {
            cwd: installRoot,
            encoding: 'utf8',
            timeout: 120000,
            maxBuffer: 20 * 1024 * 1024
          });
          authorityStateParitySmokeSummary = compactSpawnSummary(paritySmoke);
          if (paritySmoke.status !== 0) errors.push('fresh installed CLI release --authority-state-parity-check must exit 0');
          else {
            try {
              const parityOutput = JSON.parse(paritySmoke.stdout);
              if (parityOutput.status !== 'ok') errors.push('fresh installed CLI release --authority-state-parity-check must return ok');
              if (parityOutput.package_context !== 'installed_package') errors.push('fresh installed CLI release --authority-state-parity-check must observe installed_package context');
              if (!parityOutput.validated || parityOutput.validated.source_state_shards_not_projected_into_package !== true) errors.push('fresh installed CLI authority-state parity must keep shards out of package');
            } catch (error) {
              errors.push(`fresh installed CLI release --authority-state-parity-check JSON parse failed: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      errors.push(error && error.message ? error.message : String(error));
    } finally {
      try {
        removeTempRoot(tempRoot);
        cleanupStatus = 'ok';
      } catch (error) {
        cleanupStatus = 'error';
        errors.push(`temp cleanup failed: ${error.message}`);
      }
    }

    const actualPackFiles = packEntry ? exactArtifactPackFiles(packEntry) : [];
    return {
      schema: 'agent-onboard-public-exact-artifact-oracle-result-001',
      status: errors.length === 0 ? 'ok' : 'error',
      package_name: PACKAGE_NAME,
      version: VERSION,
      release_line: RELEASE_LINE,
      command: publicExactArtifactOracleContract.command,
      check_command: publicExactArtifactOracleContract.check_command,
      package_root: root,
      source_context: sourceContext(root),
      oracle: {
        schema: publicExactArtifactOracleContract.schema,
        role: publicExactArtifactOracleContract.role,
        exact_tgz_created_in_temp: !!tarball,
        exact_tgz_sha256: tarballSha256,
        exact_tgz_sha256_present: typeof tarballSha256 === 'string' && tarballSha256.length === 64,
        npm_integrity_present: !!(packEntry && typeof packEntry.integrity === 'string' && packEntry.integrity.startsWith('sha512-')),
        npm_shasum_present: !!(packEntry && typeof packEntry.shasum === 'string' && packEntry.shasum.length > 0),
        raw_pack_stdout_inlined: false,
        raw_install_stdout_inlined: false,
        temp_cleanup_status: cleanupStatus
      },
      npm_pack: Object.assign({
        package_id: packEntry ? packEntry.id : null,
        name: packEntry ? packEntry.name : null,
        npm_version: packEntry ? packEntry.version : null,
        filename: packEntry ? packEntry.filename : null,
        size: packEntry ? packEntry.size : null,
        unpacked_size: packEntry ? packEntry.unpackedSize : null,
        file_count: actualPackFiles.length,
        expected_file_count: expectedPackFiles.length,
        exact_file_list_matches_contract: arrayEquals(actualPackFiles, expectedPackFiles)
      }, packSummary || { status: 'not_run' }),
      fresh_install_smoke: {
        install: installSummary || { status: 'not_run' },
        cli_entrypoint_present: cliEntrypointPresent,
        version_smoke: versionSmokeSummary || { status: 'not_run' },
        release_check_smoke: releaseSmokeSummary || { status: 'not_run' },
        authority_state_check_smoke: authorityStateSmokeSummary || { status: 'not_run' },
        authority_state_parity_smoke: authorityStateParitySmokeSummary || { status: 'not_run' }
      },
      expected_pack_files: expectedPackFiles,
      exact_pack_files: actualPackFiles,
      validated: {
        package_version_matches_runtime: pkg.version === VERSION,
        exact_pack_command_exited_zero: packSummary && packSummary.status === 'ok',
        exact_tgz_sha256_present: typeof tarballSha256 === 'string' && tarballSha256.length === 64,
        exact_pack_file_list_matches_contract: arrayEquals(actualPackFiles, expectedPackFiles),
        fresh_install_from_exact_tgz: installSummary && installSummary.status === 'ok',
        fresh_installed_cli_version: versionSmokeSummary && versionSmokeSummary.status === 'ok',
        fresh_installed_release_check: releaseSmokeSummary && releaseSmokeSummary.status === 'ok',
        fresh_installed_authority_state_check: authorityStateSmokeSummary && authorityStateSmokeSummary.status === 'ok',
        fresh_installed_authority_state_parity: authorityStateParitySmokeSummary && authorityStateParitySmokeSummary.status === 'ok',
        temp_artifacts_removed: cleanupStatus === 'ok'
      },
      boundary: publicExactArtifactOracleContract.boundary,
      errors
    };
  }

  return Object.freeze({
    publicExactArtifactOracleContract,
    publicExactArtifactOracle,
    exactArtifactPackFiles,
    parseNpmPackJson,
    compactSpawnSummary
  });
}

module.exports = Object.freeze({
  createPublicExactArtifactOracleService
});
