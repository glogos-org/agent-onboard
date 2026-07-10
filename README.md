# agent-onboard

CLI for onboarding and managing target repositories.

`agent-onboard` creates a small machine-readable and human-readable control surface inside a target repo. In the current `0.0.x` line, that surface is a convention/spec plus a reference CLI generator. It is not a sandbox, filesystem wrapper, CI policy engine, or runtime enforcement layer.

The generated files are intended to be read by agents, wrappers, CI hooks, or future runtimes that choose to honor the declared boundaries.

## Install

For the `0.0.x` line, install with `latest` for the current public line, or pin a specific published version only in release verification evidence:

```sh
npm install --save-dev agent-onboard@latest
```

Run without installing:

```sh
npx agent-onboard status
npx agent-onboard guide --text
npx agent-onboard quickstart --text
npx agent-onboard commands --text
```

Inspect target repo readiness without writing files:

```sh
npx agent-onboard target doctor --json
npx agent-onboard target doctor --text
npx agent-onboard target profile --json
npx agent-onboard target profile --text
npx agent-onboard target inventory --preview
npx agent-onboard target inventory --text
npx agent-onboard target memory --preview
npx agent-onboard target memory --text
npx agent-onboard target work-items --preview
npx agent-onboard target work-items --text
npx agent-onboard target governance --preview
npx agent-onboard target governance --text
npx agent-onboard target governance --budget-contract --text
npx agent-onboard target governance --budget-check --text
npx agent-onboard target governance --materialize-dry-run --text
# explicit write, owner-authorized only:
npx agent-onboard target governance --materialize --write --force --text
npx agent-onboard target handoff --preview
npx agent-onboard target handoff --text
npx agent-onboard target handoff --readiness-check --text
npx agent-onboard contracts --text
npx agent-onboard contracts --check --json
npx agent-onboard contracts --validate-output --contract target_handoff_readiness_check_output --file ./handoff-readiness.json --json
npx agent-onboard issue --classify-dry-run --text
npx agent-onboard contributor --admission-dry-run --text
npx agent-onboard target metadata --plan
npx agent-onboard target metadata --check
npx agent-onboard target metadata --write
npx agent-onboard target manifest --init --dry-run
npx agent-onboard target manifest --check-drift
```

Plan a repair for missing canonical onboarding files without overwriting existing files:

```sh
npx agent-onboard target repair --plan
```

## Quickstart

Print a read-only first-run recipe for a new operator or agent:

```sh
npx agent-onboard quickstart --text
npx agent-onboard quickstart --json
npx agent-onboard quickstart --dry-run
```

Quickstart writes nothing. It does not install dependencies, run managed project commands, publish, push, mutate Git state, or scan the target repository beyond the commands it recommends. Use it before `target onboarding --write`, `target bootstrap --write`, publish operations, or broad repository edits.

## Minimal target init

Preview the target onboarding sequence before touching files:

```sh
npx agent-onboard target onboarding --plan
npx agent-onboard target onboarding --fixture
```

The plan and fixture are read-only. They declare the canonical target files, the preview commands, the explicit write command, and the guard check that should be run after a read-only target boundary exists.

Write the full canonical onboarding surface only after the target owner explicitly authorizes file creation:

```sh
npx agent-onboard target onboarding --write
```

`target onboarding --write` refuses to overwrite existing non-identical canonical files. To intentionally replace them:

```sh
npx agent-onboard target onboarding --write --force
```

Preview the files that would be created:

```sh
npx agent-onboard init --dry-run
```

Write the minimal target state:

```sh
npx agent-onboard init --write
```

`init --write` refuses to overwrite existing non-identical files. To intentionally replace existing target-state files:

```sh
npx agent-onboard init --write --force
```

## Agent instructions preview

Preview the canonical agent instruction file:

```sh
npx agent-onboard agents --preview
```

Write it to the target repo:

```sh
npx agent-onboard agents --write
```

`agents --write` writes only `AGENTS.md`. The aggregate `target onboarding --write` command writes the broader canonical target surface, including `llms.txt`, `.agent-onboard/authority-path.json`, and `.agent-onboard/runtime-namespace.json`.

It refuses to overwrite an existing non-identical `AGENTS.md` unless `--force` is passed:

```sh
npx agent-onboard agents --write --force
```

## AGENTS bridge marker block

Preview a bounded marker block that can be appended to an existing `AGENTS.md` without replacing repository-owned instructions:

```sh
npx agent-onboard bridge --dry-run --text
```

Validate that the current target already has exactly one valid bridge marker block:

```sh
npx agent-onboard bridge --check --text
```

Write or refresh only the marker block when explicitly authorized:

```sh
npx agent-onboard bridge --write --text
```

`bridge --write` is idempotent: it creates `AGENTS.md` when missing, appends the bridge when no marker exists, replaces the existing marker block when present, and refuses malformed duplicate markers. It does not install dependencies, run package-manager commands, mutate Git, run managed project commands, publish, or use network access.

## Commands

Print the compact operator guide and discoverable command catalog for humans or scripts:

```sh
npx agent-onboard guide --text
npx agent-onboard guide --json
npx agent-onboard quickstart --text
npx agent-onboard quickstart --json
npx agent-onboard discovery --llms
npx agent-onboard create --dry-run
npx agent-onboard target inventory --text
npx agent-onboard target memory --text
npx agent-onboard target governance --text
npx agent-onboard target governance --budget-contract --text
npx agent-onboard target governance --budget-check --text
npx agent-onboard target governance --materialize-dry-run --text
npx agent-onboard target work-items --text
npx agent-onboard target handoff --text
npx agent-onboard issue --classify-dry-run --text
npx agent-onboard contributor --admission-dry-run --text
npx agent-onboard check --plan --text
npx agent-onboard check --fast --text
npx create-agent-onboard --dry-run
npm create agent-onboard@latest -- --dry-run
npx agent-onboard discovery --text
npx agent-onboard discovery --json
npx agent-onboard commands --text
npx agent-onboard commands --json
```

The guide turns the public CLI into a first-read workflow selector: new-agent orientation, target repo triage, target onboarding preview, create-entrypoint preview, and source release handoff. The quickstart command turns that orientation into a read-only first-run recipe: guide, command discovery, target doctor, target inventory, target work-items preview, onboarding plan, bootstrap dry-run, create dry-run, issue intake dry-run, contributor admission dry-run, and next work-item lookup. The discovery command prints the AI-readable llms-style entrypoint or a compact discovery catalog for installed/source package contexts. The create dry-run command previews the future npm-create onboarding write set without writing files, scanning the consumer repository, installing dependencies, mutating Git, publishing, or using network access. The target inventory command prints a bounded read-only package/source/command/provenance inventory without executing detected commands. The target work-items command previews a target repo work-item file, current open item, last closed item, and explicit queued candidate without admitting, closing, or synthesizing work items. The target governance command previews compact work-items/claims indexes, exposes a stable budget contract, checks target index budgets without inlining planned payloads, checks stored-index drift, and derives bounded summaries on explicit request without inlining raw growth files, admitting claims, or mutating target state. The target handoff command combines bounded inventory, memory-surface presence, work-item preview summaries, governance index summaries, governance index drift state, structured readiness reasons, and a machine-readable readiness check into a compact read-only next-session handoff without importing file contents or granting authority. The target memory command prints a bounded metadata-only descriptor of known repo memory, instruction, identity, and target-owned state surfaces without importing file contents. The issue intake dry-run command classifies external issue metadata and previews whether it should become a generalized work-item candidate without calling GitHub, importing an issue, writing a ledger, admitting a claim, mutating Git, publishing, or using network access. The contributor admission dry-run command previews actor identity, provenance, and AI-assistance attribution without creating a contributor record, writing a ledger, granting claim authority, calling GitHub, mutating Git, publishing, or using network access. The contracts command exposes the compact public contract/interface spine, validates live runtime outputs, and validates captured JSON output files by contract ID without re-emitting file contents or writing state. The check plan/fast runner commands expose a deterministic in-process fast-check registry, run packaged public probes, and surface governance stale-read advisories without shell spawn, npm, Git, network, file writes, or publish. The CI surface prints a copyable GitHub Actions workflow and CI contract without creating workflow files, calling GitHub APIs, running npm/shell commands, mutating Git, using network access, writing files, or publishing. The MCP bridge plan prints a read-only tool-candidate contract for future agent clients without starting an MCP server, adding dependencies, opening sockets, starting stdio transport, writing files, mutating Git, publishing, or using network access. The command catalog exposes top-level commands, aliases, runtime groups, help lines, recommended first commands, and the no-mutation boundary for command discovery. The bridge command adds a bounded AGENTS.md marker-block path for installed-package discovery without replacing repository-owned instructions. Together they are the fastest way for a new agent or operator to orient itself before choosing a workflow.

```sh
npx agent-onboard status
npx agent-onboard guide --text
npx agent-onboard guide --json
npx agent-onboard quickstart --text
npx agent-onboard quickstart --json
npx agent-onboard discovery --llms
npx agent-onboard create --dry-run
npx agent-onboard create --text
npx agent-onboard target inventory --preview
npx agent-onboard target inventory --text
npx agent-onboard target memory --preview
npx agent-onboard target memory --text
npx agent-onboard issue --classify-dry-run --text
npx agent-onboard contributor --admission-dry-run --text
npx agent-onboard check --plan --text
npx agent-onboard check --fast --text
npx agent-onboard discovery --text
npx agent-onboard discovery --json
npx agent-onboard commands --text
npx agent-onboard commands --json
npx agent-onboard init --dry-run
npx agent-onboard init --write
npx agent-onboard agents --preview
npx agent-onboard agents --write
npx agent-onboard guard --plan
npx agent-onboard guard --check-boundary
npx agent-onboard authority --first-read
npx agent-onboard authority --check
npx agent-onboard authority --index
npx agent-onboard authority --index-check
npx agent-onboard authority --state
npx agent-onboard authority --state-check
npx agent-onboard target doctor --json
npx agent-onboard target doctor --text
npx agent-onboard target profile --json
npx agent-onboard target profile --text
npx agent-onboard target inventory --preview
npx agent-onboard target inventory --text
npx agent-onboard target memory --preview
npx agent-onboard target memory --text
npx agent-onboard target work-items --preview
npx agent-onboard target work-items --text
npx agent-onboard target governance --preview
npx agent-onboard target governance --text
npx agent-onboard target governance --budget-contract --text
npx agent-onboard target governance --budget-check --text
npx agent-onboard target governance --materialize-dry-run --text
npx agent-onboard target handoff --preview
npx agent-onboard target handoff --text
npx agent-onboard target handoff --readiness-check --text
npx agent-onboard target repair --plan
npx agent-onboard target manifest --init --dry-run
npx agent-onboard target manifest --check-drift
npx agent-onboard target manifest --refresh --dry-run
npx agent-onboard target repair --write
npx agent-onboard target metadata --plan
npx agent-onboard target metadata --check
npx agent-onboard target metadata --write
npx agent-onboard target runtime --namespace
npx agent-onboard target runtime --check
npx agent-onboard architecture --map
npx agent-onboard architecture --router
npx agent-onboard architecture --facades
npx agent-onboard architecture --check
npx agent-onboard release --plan
npx agent-onboard release --surface
npx agent-onboard release --surface-check
npx agent-onboard release --source-manifest
npx agent-onboard release --source-manifest-check
npx agent-onboard release --artifact-oracle-check
npx agent-onboard release --authority-state-parity-check
npx agent-onboard release --target-onboarding-smoke
npx agent-onboard release --real-target-trial
npx agent-onboard release --check
npx agent-onboard target-config --schema
npx agent-onboard target-config --template
npx agent-onboard target-config --validate-template
npx agent-onboard target-config --validate [.agent-onboard/target.json]
npx agent-onboard work-items --schema
npx agent-onboard work-items --template
npx agent-onboard work-items --validate-template
npx agent-onboard work-items --init --dry-run
npx agent-onboard work-items --init --write
npx agent-onboard work-items --validate [.agent-onboard/work-items.json]
npx agent-onboard work-items --list [.agent-onboard/work-items.json]
npx agent-onboard work-items --summary [.agent-onboard/work-items.json]
npx agent-onboard work-items --summary [.agent-onboard/work-items.json] --text
npx agent-onboard work-items --next [.agent-onboard/work-items.json]
npx agent-onboard work-items --next [.agent-onboard/work-items.json] --text
npx agent-onboard work-items --mine [.agent-onboard/work-items.json] --actor <actor>
npx agent-onboard work-items --mine [.agent-onboard/work-items.json] --actor <actor> --text
npx agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>
npx agent-onboard work-items --append --write --id <public-work-item-id> --title <title>
npx agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>
npx agent-onboard work-items --claim --write --id <public-work-item-id> --actor <actor>
npx agent-onboard work-items --close --dry-run --id <public-work-item-id> --actor <actor> --summary <summary>
npx agent-onboard work-items --close --write --id <public-work-item-id> --actor <actor> --summary <summary>
npx agent-onboard target runtime --namespace
npx agent-onboard target runtime --check
npx agent-onboard target onboarding --plan
npx agent-onboard target onboarding --fixture
npx agent-onboard target onboarding --trial
npx agent-onboard target onboarding --write
npx agent-onboard target bootstrap --dry-run
npx agent-onboard target bootstrap --write
npx agent-onboard target-instance takeover --dry-run
npx agent-onboard target-instance takeover --write
```

## Source Checks

Use the parallel quick gate for normal source validation:

```sh
npm test
```

The quick gate runs read-only CLI checks, syntax checks, work-item ledger validation, and an npm pack dry run in parallel. Use the parallel full source test when a change needs the full fixture matrix:

```sh
npm run test:full
```

Run both suites explicitly before a higher-risk release handoff:

```sh
npm run test:all
```

## Public architecture map

Print the public architecture kernel without moving files or writing state:

```sh
npx agent-onboard architecture --map
```

Inspect the public command router boundary without moving files or writing state:

```sh
npx agent-onboard architecture --router
```

Validate the reduced architecture guard that still matters to the published CLI: canonical domains, compact npm package boundary, command router, domain service facade, target runtime namespace, and packaged router port:

```sh
npx agent-onboard architecture --check
```

The public architecture kernel is: `core`, `authority`, `work_items`, `claims`, `target`, and `release_package`. M4 keeps `architecture --map`, `architecture --router`, `architecture --facades`, and the reduced `architecture --check` as package-safety diagnostics. Historical source-extraction and self-dogfood checkers are retained for compatibility where they already exist, but they are no longer presented as the main product workflow or as active release blockers.

## Public source domain module partition plan

Print the source-domain module partition plan without moving files:

```sh
npx agent-onboard architecture --partition-plan
```

Validate the partition plan and source-only `.agent-onboard/source-partition-plan.json` file when running from the source repo, or validate the embedded plan when running from an installed package:

```sh
npx agent-onboard architecture --partition-check
```

This gate does not create `src/domains/*`, move source code, change `package.json#files`, run package-manager commands, or publish. It only admits the future module boundaries for `core`, `authority`, `work_items`, `claims`, `target`, and `release_package` behind the already admitted service facades.

## Public source domain extraction rehearsal

Print the source-domain extraction rehearsal without creating modules or moving files:

```sh
npx agent-onboard architecture --extraction-rehearsal
```

Validate the rehearsal and source-only `.agent-onboard/source-extraction-rehearsal.json` file when running from the source repo, or validate the embedded rehearsal contract when running from an installed package:

```sh
npx agent-onboard architecture --extraction-check
```

Freeze and validate the command-output contract before physical source extraction:

```sh
npx agent-onboard architecture --golden-outputs
npx agent-onboard architecture --golden-check
npx agent-onboard architecture --adapter-boundary
npx agent-onboard architecture --adapter-check
npx agent-onboard architecture --first-slice
npx agent-onboard architecture --first-slice-check
npx agent-onboard architecture --bundle-parity
npx agent-onboard architecture --bundle-parity-check
npx agent-onboard architecture --runtime-bridge
npx agent-onboard architecture --runtime-bridge-check
npx agent-onboard architecture --installed-fallback-smoke
npx agent-onboard architecture --installed-fallback-check
npx agent-onboard architecture --second-slice-plan
npx agent-onboard architecture --second-slice-check
npx agent-onboard architecture --second-slice-first-slice
npx agent-onboard architecture --second-slice-first-slice-check
npx agent-onboard architecture --authority-bundle-parity
npx agent-onboard architecture --authority-bundle-parity-check
npx agent-onboard architecture --authority-runtime-bridge
npx agent-onboard architecture --authority-runtime-bridge-check
npx agent-onboard architecture --package-adapter
npx agent-onboard architecture --package-adapter-check
npx agent-onboard architecture --architecture-adapter
npx agent-onboard architecture --architecture-adapter-check
npx agent-onboard architecture --authority-adapter
npx agent-onboard architecture --authority-adapter-check
npx agent-onboard architecture --module-inclusion-plan
npx agent-onboard architecture --module-inclusion-check
npx agent-onboard architecture --packaged-router-port
npx agent-onboard architecture --packaged-router-port-check
npx agent-onboard architecture --thin-entrypoint-rehearsal
npx agent-onboard architecture --thin-entrypoint-rehearsal-check
npx agent-onboard architecture --thin-entrypoint-cutover
npx agent-onboard architecture --thin-entrypoint-cutover-check
npx agent-onboard architecture --router-adapter-delegation
npx agent-onboard architecture --router-adapter-delegation-check
npx agent-onboard release --version-sprawl-check
```

This release adds the public source module extraction adapter boundary gate. This gate rehearses `src/domains/*` extraction behind the admitted service facades and then declares the stable adapter boundary that future physical modules must use. The next gate adds the first source-only physical slice for `core` while keeping CLI runtime output and the compact npm package surface unchanged.

This release adds the public source module extraction first slice gate. The first slice is `src/domains/core.js`, a source-only shadow module for read-only core metadata. It is checked by `architecture --first-slice-check`, is not included in `package.json#files`, is not a public import API, and is not required by the installed CLI runtime. This release adds bundle parity on top: `architecture --bundle-parity-check` compares the source-only slice with the bundled CLI architecture view and remains installed-package tolerant when `src/domains/core.js` is absent from npm installs. This release adds the public source module extraction runtime bridge gate: `architecture --runtime-bridge-check` validates a guarded optional bridge that loads `src/domains/core.js` in source context and falls back to bundled CLI metadata in installed package context. This release adds the public source module extraction installed fallback smoke gate: `architecture --installed-fallback-check` validates that compact npm installs can omit `src/domains/core.js` and still use bundled fallback metadata. This release adds the public source module extraction second slice planning gate: `architecture --second-slice-check` validates that `authority` is planned as the next source module slice, that `src/domains/authority.js` is not created in this gate, and that `.gitignore` tracks the source-only extraction artifacts. This release adds the public source module extraction second slice first-slice and authority bundle parity gates: `architecture --second-slice-first-slice-check` validates `src/domains/authority.js`, and `architecture --authority-bundle-parity-check` validates that the authority source slice matches the bundled CLI authority view while excluding write-capable `agents` extraction. This release adds the public source module extraction authority runtime bridge gate: `architecture --authority-runtime-bridge-check` validates that source context can load `src/domains/authority.js`, installed package context falls back to bundled CLI authority metadata, and `.gitignore` remains policy-based rather than per-artifact. This release closes the architecture kernel milestone and seeds the next architecture milestone with `architecture --m2-seed-check` while keeping the next executable source-domain extraction gate open.

## Public authority first-read index

Previous release: `authority --index` emits the compact authority digest index, and `authority --index-check` compares the stored source-only `.agent-onboard/authority-index.json` against live first-read file digests. Both commands are read-only, keep raw authority file contents out of the output, and preserve the npm package allowlist.

Previous release: `bridge --dry-run`, `bridge --check`, and `bridge --write` provide a bounded `AGENTS.md` marker-block bridge. The write path is explicit and marker-block-only; it preserves existing repository instructions, avoids duplicate markers, and performs no dependency install, package-manager execution, Git mutation, managed project command, publish, registry mutation, or network access.

Current release: `release --keyword-taxonomy` and `release --keyword-taxonomy-check` verify the compact `package.json#keywords` taxonomy admitted by the public clean-and-compaction line. The package keywords are reduced from release-era sprawl to a bounded discovery set while preserving package identity, command-family discovery, target onboarding, coordination, authority/governance, release/package, public-contract, agent-integration, and clean-compaction terms. The commands are read-only and do not delete, move, archive, rewrite history, mutate work items or claims, run Git/dependency/build/test/deploy/package-manager commands, publish, touch registry/network state, or authorize unrelated cleanup writes.

Previous release: `claim --validate-ledger` validates `.agent-onboard/claims.jsonl` as a compact JSONL claim-event ledger without inlining raw entries, `claim --lifecycle-check` detects active claim conflicts and stale active claims, and `claim --append --dry-run|--write` appends exactly one claim event only under explicit `--write` after lifecycle conflict planning. The command does not mutate `.agent-onboard/work-items.json`, Git, dependencies, build/test/deploy state, publication state, registry state, or network state.

Previous release: `authority --state` previews compact authority state shards, and `authority --state-check` validates `.agent-onboard/state/live-authority.json`, `.agent-onboard/state/policies.json`, `.agent-onboard/state/indexes.json`, and `.agent-onboard/state/closed-gates.jsonl` against generated state without loading raw growth files by default. The state shards are source-only and remain outside the npm package projection.

Current release: `release --authority-state-parity-check` verifies that authority state shards remain source-only and absent from the npm package projection while the installed package context still passes `authority --state-check`. The exact artifact oracle also fresh-installs the local tarball and smoke-tests both installed authority state checking and installed authority-state parity without publishing or mutating registry state.

Print the public authority read order without writing files:

```sh
npx agent-onboard authority --first-read
```

Validate the source authority files when running from a source repo, or validate the embedded authority contract when running from an installed package:

```sh
npx agent-onboard authority --check
```

The canonical read order is `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `.agent-onboard/authority-path.json`, `.agent-onboard/authority-index.json`, `llms.txt`, `package.json`, `authority-map.json`, `manifest.json`, `.agent-onboard/target.json`, `.agent-onboard/runtime-namespace.json`, `.agent-onboard/project.json`, `.agent-onboard/work-items.json`, then `README.md`; raw evidence/source files are on-demand only after those authority files. The compact authority index records file digests and drift state without inlining raw authority file contents.

## Public target runtime namespace

Print the public target runtime namespace without writing files:

```sh
npx agent-onboard target runtime --namespace
```

Validate the embedded namespace contract and, in source context, `.agent-onboard/runtime-namespace.json`:

```sh
npx agent-onboard target runtime --check
```

The canonical runtime namespace root is `.agent-onboard/`. The admitted runtime files are `.agent-onboard/runtime-namespace.json`, `.agent-onboard/project.json`, `.agent-onboard/work-items.json`, and `.agent-onboard/authority-path.json`. Reserved future files such as `.agent-onboard/claims.jsonl` and `.agent-onboard/events.jsonl` are declared but not written by this gate.

## Public target metadata manifest authority

Plan the target metadata manifest and authority-map contract without writing files:

```sh
npx agent-onboard target metadata --plan
```

Validate a target-owned `manifest.json`, `authority-map.json`, and markdown metadata placement without writing files:

```sh
npx agent-onboard target metadata --check
```

Generate `SOURCE_OF_TRUTH.md`, `authority-map.json`, and `manifest.json` for a target repo:

```sh
npx agent-onboard target metadata --write
```

Use the default universal profile explicitly:

```sh
npx agent-onboard target metadata --write --profile default
```

Use a target-owned metadata policy:

```sh
npx agent-onboard target metadata --write --policy .agent-onboard/metadata-policy.json
```

Adopt existing target metadata while preserving target-owned schema IDs and authority sections:

```sh
npx agent-onboard target metadata --write --adopt-existing
```

`target metadata` keeps a strict boundary: agent-onboard owns mechanics, while the target repo owns semantics. The universal engine computes stable `file_id` values with `ni:///sha-256;...`, generates stable `file_urn` values, scans the file tree, and validates portable manifest/authority invariants. A target policy can override `manifest_schema`, `authority_map_schema`, `urn_namespace`, include/exclude rules, whether control state is included, and whether `manifest.json` appears in `authority-map.json`. `target metadata --write` refuses to overwrite existing non-identical generated metadata files unless `--force` or `--adopt-existing` is supplied. Existing `SOURCE_OF_TRUTH.md` files are non-destructive by default: agent-onboard only creates a missing file or updates its own `<!-- BEGIN AOB METADATA -->` block; target-owned prose is not rewritten. Markdown administrative metadata belongs in leading HTML comment headers or registry metadata, not visible YAML front matter. Work-item semantics remain delegated to `agent-onboard`; target repos do not need to grow their own workflow engine.

## Public target manifest drift guard

Freeze a target repository content manifest without writing files:

```sh
npx agent-onboard target manifest --init --target . --dry-run
```

Write the initial drift baseline after the target owner authorizes the `.agent-onboard/target-manifest.json` state file:

```sh
npx agent-onboard target manifest --init --target . --write
```

Check whether the target file tree has drifted from that baseline:

```sh
npx agent-onboard target manifest --check-drift --target .
```

Refresh the baseline after reviewing intentional changes:

```sh
npx agent-onboard target manifest --refresh --target . --dry-run
npx agent-onboard target manifest --refresh --target . --write
```

`target manifest` is a content-addressed drift guard for target repositories. It writes only `.agent-onboard/target-manifest.json` when `--write` is explicit, excludes common build/dependency/cache directories, records entries as `file_path`, `bytes`, and `file_id`, and uses `ni:///sha-256;...` identifiers without exposing raw `sha256`, legacy `path`, `urn`, or `ni` entry fields.


## Public release verification

For a source release candidate, validate the package-owned release contract before publishing:

```sh
npx agent-onboard release --check
```

The check validates package metadata, bin entrypoints, the projected npm pack allowlist, public artifact messaging, the reduced public architecture runtime checks, package surface preservation, target repo product readiness (`target doctor`, `target profile`, `target repair --plan`, `target onboarding --plan`, and `target onboarding --fixture`), the installed parity architecture smoke, and the source work-item ledger when that ledger is present. Historical source-extraction release checks are reported as retired instead of being run as active publish blockers. It does not publish, mutate registry state, install dependencies, or run Git operations. The response reports whether it is running in a source-repository context or an installed-package context, then includes local pre-publish commands and post-publish verification commands for the operator.

Preview the release plan without running validation:

```sh
npx agent-onboard release --plan
```

Print the normalized release contract without running validation:

```sh
npx agent-onboard release --contract
```

Print the release fixture matrix without mutating files, package state, or registry state:

```sh
npx agent-onboard release --fixture
```

Print or validate the content-addressed package source manifest without writing files or running npm:

```sh
npx agent-onboard release --source-manifest
npx agent-onboard release --source-manifest-check
npx agent-onboard release --artifact-oracle-check
```

The source manifest command reports every projected npm package file with `file_path`, byte count, and `file_id` using `ni:///sha-256;...`. It may use a source-only `.agent-onboard/source-manifest.hash-cache.json` workspace cache when one exists, but the actual package file projection remains authority for file existence. The check enforces a zero stale/extra/missing/invalid cache-entry budget, keeps the cache out of the npm package projection, does not expose raw `sha256`, does not write hash-cache state, publish, install dependencies, or mutate the package root.

The fixture matrix documents the contract regression cases used by the source tests: valid source context, valid installed-package context, stale package version, npm pack allowlist drift, missing bin entrypoint, reserved public artifact messaging tokens, projected installed-package parity smoke, target onboarding installed-package smoke, target onboarding post-publish handoff, published package acceptance rehearsal, real target repo trial, public architecture map, public command router boundary, public domain service facade boundary, public authority first-read index boundary, public target runtime namespace boundary, public source domain module partition planning boundary, public source domain extraction rehearsal boundary, public package surface preservation boundary, and public installed parity architecture smoke boundary.

Run the installed package parity smoke without executing package-manager, registry, Git, build, or temp-file write operations:

```sh
npx agent-onboard release --parity-smoke
```


The package surface check validates that the npm package remains exactly `LICENSE`, `README.md`, `cli/agent-onboard.js`, and `package.json`. Source-only operating files such as `AGENTS.md`, `llms.txt`, `.agent-onboard/*.json`, and tests must stay outside the npm pack projection.

The parity smoke checks that the source candidate release check passes, the projected npm package file set matches the contract, source-only context files stay out of the npm package, bin entrypoints are included in the projected package, and `package.json` version matches the runtime version.

Run the installed parity architecture smoke without executing package-manager, registry, Git, build, or temp-file write operations:

```sh
npx agent-onboard release --architecture-parity-smoke
```

The architecture parity smoke now validates the reduced legacy architecture surface: architecture map, command router, domain facades, target runtime namespace, packaged router port, package surface, package metadata, and source-only package exclusion. Historical M3 source-extraction checkers are reported as retired so M4 target-repo product work is not blocked by self-dogfood gates.

Run the target onboarding installed-package smoke to exercise the package runtime against a temporary target repo:

```sh
npx agent-onboard release --target-onboarding-smoke
```

The target onboarding smoke creates and removes a temporary target repo, runs the target onboarding plan and fixture, writes only the canonical onboarding files into that temporary target, and verifies the generated read-only boundary config. It does not mutate the package root, Git, registry, dependencies, build, deploy, publish, or push state.

Emit the post-publish verification handoff for the exact package version:

```sh
npx agent-onboard release --post-publish-handoff
```

The post-publish handoff emits the version-pinned npm view and npx commands an operator should run after publishing. It includes metadata verification, installed-package release contract and fixture checks, parity smoke, target onboarding smoke, published acceptance, real target trial, architecture map/router/facades/partition-plan/partition-check/extraction-rehearsal/extraction-check/check, authority first-read/check, release check, and target onboarding plan/fixture/trial checks. The command itself does not query the registry, publish, mutate registry state, install dependencies, run Git, or write target files.

Run the published package acceptance check after publish with a version-pinned package, or locally as a source rehearsal before publish:

```sh
npx agent-onboard release --published-acceptance
```

The published acceptance command composes release check, post-publish handoff validation, parity smoke, target onboarding smoke, target onboarding plan, target onboarding fixture, and real target trial. When run from `npx agent-onboard@<version>` after publish it should report an installed-package context; when run in the source repo before publish it reports source-repository rehearsal. It does not publish, mutate registry state, install dependencies, run Git, or write target files outside its temporary smoke target.

Run the real target trial gate without writing target files:

```sh
npx agent-onboard release --real-target-trial
```

The real target trial command runs a no-write onboarding readiness check against a realistic temporary target repo. It verifies that target onboarding projects only canonical files, reports conflict readiness before writes, avoids package-manager/Git/build/publish operations, and cleans up its temporary target.

After install, these command names are available:

```sh
agent-onboard status
aob status
create-agent-onboard status
```

## Target onboarding plan

Print the public target onboarding sequence without writing files:

```sh
npx agent-onboard target onboarding --plan
npx agent-onboard target onboarding --fixture
```

The plan reports the target identity inferred from the current directory, the canonical files, the read-only preview phases, the aggregate explicit write phase, lower-level write phases, and the no-mutation boundary for the plan command itself. It is the first command to run when deciding how to onboard a target repo.

Print the public target onboarding fixture matrix without writing files:

```sh
npx agent-onboard target onboarding --fixture
```

The fixture matrix covers the read-only plan, target bootstrap dry-run, target instance takeover dry-run, AGENTS.md preview, aggregate explicit-write projection, conflict detection, and force-preview/no-write behavior.

Run a no-write trial against the current target repo before explicit onboarding writes:

```sh
npx agent-onboard target onboarding --trial
```

Run the same trial against an explicit target path from outside that repo:

```sh
npx agent-onboard target onboarding --trial --target <target-repo-path>
```

The trial reports target identity, planned canonical files, conflicts with existing non-identical files, and whether the target is ready for an explicit `target onboarding --write`. It writes nothing.

Write the aggregate canonical onboarding surface with one explicit command:

```sh
npx agent-onboard target onboarding --write
```

This writes only the canonical onboarding files, never installs dependencies, never runs build/test/deploy commands, never publishes or pushes, and never mutates Git state. It refuses divergent existing files unless `--force` is passed.

## Files written

Dry-run and preview commands write nothing.

`target onboarding --write` writes the full canonical onboarding surface:

```text
.agent-onboard/target.json
.agent-onboard/project.json
.agent-onboard/work-items.json
AGENTS.md
```

`init --write` writes the complete minimal public target state:

```text
.agent-onboard/target.json
.agent-onboard/project.json
.agent-onboard/work-items.json
```

`agents --write` writes the public agent instruction surface:

```text
AGENTS.md
```

`work-items --init --write` writes only the public work-item ledger:

```text
.agent-onboard/work-items.json
```

The older explicit subcommands remain available:

`target bootstrap --write` writes:

```text
.agent-onboard/target.json
```

`target-instance takeover --write` writes:

```text
.agent-onboard/project.json
.agent-onboard/work-items.json
```

## Public P/S/M/W work item ledger init

`agent-onboard` now exposes the public vocabulary used by `.agent-onboard/work-items.json`:

```text
P = Program
S = Stage
M = Milestone
W = Work Item
```

The generated work-item ledger is intentionally empty at initialization. It establishes the public JSON shape without importing pre-existing target state, milestone history, or generated provenance.

Initialize only the canonical work-item ledger without writing the rest of the target state:

```sh
npx agent-onboard work-items --init --dry-run
npx agent-onboard work-items --init --write
```

`work-items --init --write` writes only:

```text
.agent-onboard/work-items.json
```

It refuses to overwrite an existing non-identical ledger unless `--force` is passed:

```sh
npx agent-onboard work-items --init --write --force
```

Inspect the embedded schema:

```sh
npx agent-onboard work-items --schema
```

Print the embedded template:

```sh
npx agent-onboard work-items --template
```

Validate the embedded template:

```sh
npx agent-onboard work-items --validate-template
```

Validate or list the target repo ledger after `init --write`, `target-instance takeover --write`, or `work-items --init --write`:

```sh
npx agent-onboard work-items --validate
npx agent-onboard work-items --list
```

Inspect target repo work in progress without writing the ledger:

```sh
npx agent-onboard work-items --summary
npx agent-onboard work-items --next
npx agent-onboard work-items --mine --actor <actor>
npx agent-onboard work-items --summary --text
npx agent-onboard work-items --next --text
npx agent-onboard work-items --mine --actor <actor> --text
```

`work-items --summary` returns total counts, status counts, open items, claimed items, and the next open item. `work-items --next` returns the first open item by ledger order plus a dry-run claim command. `work-items --mine` returns the actor's claimed and closed work items with lifecycle next steps.

Use `--text` on target-facing inspection commands when a person is reading the output, and keep JSON output for scripts:

```sh
npx agent-onboard target doctor --text
npx agent-onboard target profile --text
```

Preview a public work-item append without writing the ledger:

```sh
npx agent-onboard work-items --append --dry-run --id <public-work-item-id> --title <title>
```

Optional parent titles can be previewed when the referenced program, stage, or milestone is not already present:

```sh
npx agent-onboard work-items --append --dry-run \
  --id <public-work-item-id> \
  --title <title> \
  --program-title <program-title> \
  --stage-title <stage-title> \
  --milestone-title <milestone-title>
```

The append command returns `counts_before`, `counts_after`, `added`, and `proposed_ledger`. In dry-run mode it writes nothing. In write mode it writes only the canonical work-item ledger:

```text
.agent-onboard/work-items.json
```

Write a public work item into the target repo ledger:

```sh
npx agent-onboard work-items --append --write --id <public-work-item-id> --title <title>
```

The append command refuses missing ledgers, invalid ledgers, duplicate work-item IDs, and IDs outside the public P/S/M/W shape.

Preview a public claim without writing the ledger:

```sh
npx agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <actor>
```

Write a public claim into the canonical work-item ledger:

```sh
npx agent-onboard work-items --claim --write --id <public-work-item-id> --actor <actor>
```

The claim command reads the existing ledger, validates it, verifies that the requested work item exists and is still open, and returns `counts_before`, `counts_after`, `claimed`, and `proposed_ledger`. In dry-run mode it writes nothing. In write mode it writes only:

```text
.agent-onboard/work-items.json
```

Optional metadata can be supplied with `--claimed-at <timestamp>` and `--note <note>`. The claim command refuses missing ledgers, invalid ledgers, missing work-item IDs, closed work items, and already claimed work items.

The claim response also returns `next_steps`, a documented lifecycle hint for public participation. It tells the actor to inspect scope, modify only relevant files, validate with authorized checks, and hand off changed files plus pass/non-pass evidence.

Preview a public close without writing the ledger:

```sh
npx agent-onboard work-items --close --dry-run --id <public-work-item-id> --actor <actor> --summary <summary>
```

Write a public close into the canonical work-item ledger:

```sh
npx agent-onboard work-items --close --write --id <public-work-item-id> --actor <actor> --summary <summary>
```

The close command reads the existing ledger, validates it, verifies that the requested work item exists and is not already closed, and returns `counts_before`, `counts_after`, `closed`, `handoff_evidence`, and `proposed_ledger`. In dry-run mode it writes nothing. In write mode it writes only:

```text
.agent-onboard/work-items.json
```

Closure evidence accepts repeated metadata flags:

```sh
--changed-file <path>
--check <check-run>
--check-not-run <check-not-run>
--known-non-pass <known-non-pass-state>
```

Optional timestamp metadata can be supplied with `--closed-at <timestamp>`. The close command refuses missing ledgers, invalid ledgers, missing work-item IDs, and already closed work items.

## Public source participation lifecycle

For public human/agent participation, use this lifecycle:

```text
discover -> inspect -> claim -> work -> validate -> handoff -> close
```

The lifecycle is intentionally conservative:

- `discover`: read `AGENTS.md`, `.agent-onboard/target.json`, `.agent-onboard/project.json`, and `.agent-onboard/work-items.json` when present.
- `inspect`: understand the assigned public work item before editing.
- `claim`: use `work-items --claim --dry-run` first, then `--write` only when explicitly authorized.
- `work`: edit only files needed for the claimed work item.
- `validate`: run only checks authorized by the owner or clearly permitted by the current task.
- `handoff`: report files changed, checks run, checks not run, and known non-pass states.
- `close`: record the handoff evidence envelope in the canonical work-item ledger only after the work item is ready to close.

Claiming or closing a work item is not permission to publish, push, install dependencies, overwrite existing instructions, or edit unrelated files.

If `agents --write` finds an existing non-identical `AGENTS.md`, it returns a conflict and writes nothing. That conflict is expected overwrite protection for target repos with their own agent instructions; merge manually or use `--force` only when the repository owner explicitly asks for replacement.

The current release surface keeps work-item closing narrow and adds a release contract check plus installed-package parity smoke for package and source contexts. Admission, conflict detection, and milestone governance remain outside the command surface until documented and exposed by explicit commands.

## Boundary guard seed

`agent-onboard guard --check-boundary` is the first narrow public enforcement seed. It reads `.agent-onboard/target.json` from the current target repo root and exits non-zero when that declaration is not the default read-only dry-run boundary.

It passes only when the target config keeps:

```text
requested_mode: target_dry_run
authority_level: L1_read_only_preview
writes_allowed: false
managed_project_commands_allowed: 0
create_agent_onboard_runtime_state: false
install_dependencies: false
run_build_test_deploy: false
publish_or_push: false
```

Run it before dependency installs, build/test/deploy commands, publish/push operations, or broad write operations:

```sh
npx agent-onboard guard --check-boundary
```

This guard does not sandbox other tools and does not wrap shell commands. It only evaluates the declared boundary and fails closed when the target config is missing, invalid, or permissive.

## What the boundary files mean

`.agent-onboard/target.json` declares the target repo's intended operating boundaries, including write policy, dependency-install policy, build/test/deploy policy, publish/push policy, and managed surfaces.

`AGENTS.md` gives agents a human-readable read order, default forbidden actions, dry-run-first operating mode, and reporting discipline.

In the current `0.0.x` line, these fields and instructions are declarative. They do not block other tools by themselves. A separate agent runtime, wrapper, CI hook, or future `agent-onboard` component must read the files and enforce the declared policy.

The generated config intentionally starts at:

```text
requested_mode: target_dry_run
authority_level: L1_read_only_preview
writes_allowed: false
```

Passing `--write` to this CLI only allows this CLI to write the requested public surface files. It does not raise the generated target authority level.

## Validation

`target-config --schema` prints the embedded target config schema.

`target-config --template` prints the embedded target config template.

`target-config --validate-template` validates the embedded target config template against that schema and returns non-zero if the template is invalid.

`target-config --validate [file]` validates an existing target config file. When no file is provided, it validates `.agent-onboard/target.json` in the current directory.

## Safety boundaries of this CLI

This version does not:

- install dependencies;
- run builds, tests, deploys, publishes, or pushes;
- modify source files except the requested generated public surface files;
- write files unless `--write` is passed;
- overwrite existing non-identical target-state or agent-instruction files unless `--force` is passed;
- enforce filesystem, network, shell, Git, or package-manager policy for other tools.

## File meanings

`.agent-onboard/target.json` is the target repo config and boundary declaration.

`.agent-onboard/project.json` is the runtime identity of the target repo.

`.agent-onboard/work-items.json` is the initial empty public P/S/M/W work-item ledger.

`AGENTS.md` is the human-readable agent instruction surface for the target repo.

## Version line

`0.0.1` is the first public package version.

`0.0.2` adds public repository hygiene and npm/GitHub metadata while staying below the `0.1.0` boundary.

`0.0.3` adds the public target config/init surface: top-level `init`, target config template printing, target config file validation, and default overwrite protection.

`0.0.4` adds the public agent instructions / `AGENTS.md` preview surface with guarded write support.

`0.0.6` is the boundary guard hotfix: it keeps the `guard --plan` and `guard --check-boundary` surface while keeping JSON output limited to documented fields.

`0.0.7` adds the P/S/M/W vocabulary and work-item ledger schema/template/list/validation surface with documented JSON output.

`0.0.8` adds the public `work-items --init --dry-run|--write` surface for initializing only `.agent-onboard/work-items.json` with overwrite protection.

`0.0.9` adds public `work-items --append --dry-run` for previewing a new work item and its missing parent chain without writing the ledger.

`0.0.10` adds public `work-items --append --write` for persisting a new work item to the canonical target repo ledger while still refusing missing ledgers, invalid ledgers, duplicate IDs, and non-public ID shapes.

`0.0.11` adds public `work-items --claim --dry-run` for previewing a claim against an existing open public work item without mutating the ledger.

`0.0.12` keeps the npm artifact compact while documenting the source-repository/public-package boundary more explicitly.

`0.0.13` adds source self-dogfood and agent participation support: the source repository can carry `AGENTS.md`, `.agent-onboard/target.json`, `.agent-onboard/project.json`, `.agent-onboard/work-items.json`, and public `work-items --claim --write` for explicit participation claims.

`0.0.14` adds the public source participation lifecycle gate: claim responses include `next_steps`, generated `AGENTS.md` documents the discover/inspect/claim/work/validate/handoff loop, and README documents expected `AGENTS.md` conflict handling for target repos.

`0.0.15` adds the public handoff and closure evidence gate: `work-items --close --dry-run|--write` records a closure envelope with summary, changed files, checks run, checks not run, and known non-pass states.

`0.0.16` aligns public source closure tests and closes the fixture evidence gate with the closed handoff evidence state and preserves populated closure evidence for the handoff work item.

`0.0.17` adds public `release --plan` and `release --check` so a source release candidate can validate package metadata, projected npm pack files, bin entrypoints, public artifact messaging, and post-publish verification handoff without mutating the public registry.

`0.0.18` integrates that release surface into a normalized public release contract: `release --contract` prints the contract, `release --check` reports source-vs-package context, and source-ledger validation runs when the source ledger is present.

`0.0.19` adds a public package contract fixture matrix: `release --fixture` prints the fixture matrix, and source tests now cover installed-package pass, stale package version, npm pack allowlist drift, missing bin entrypoint, and public artifact messaging failure cases.

`0.0.20` adds installed package parity smoke: `release --parity-smoke` validates the source candidate check, projected npm package file set, source-context exclusion, bin entrypoint inclusion, and package/runtime version parity without running package-manager, registry, Git, or build commands.

`0.0.21` adds the public target onboarding surface plan: `target onboarding --plan` prints the target onboarding sequence, canonical files, explicit write boundaries, and next candidate gate without mutating the target repo.
`0.0.22` adds the public target onboarding dry-run fixture matrix: `target onboarding --fixture` declares no-write regression fixtures for target bootstrap dry-run, target instance takeover dry-run, AGENTS.md preview, conflict detection, and force-preview behavior.

`0.0.23` adds the public target onboarding explicit write boundary: `target onboarding --write` writes the aggregate canonical onboarding surface only when explicitly requested and refuses divergent files unless `--force` is provided.

`0.0.24` adds the public target onboarding installed-package smoke: `release --target-onboarding-smoke` exercises target onboarding plan, fixture, and explicit write behavior against a temporary target repo from the package runtime.

`0.0.25` adds the public target onboarding post-publish verification handoff: `release --post-publish-handoff` emits version-pinned npm view and npx commands for operator verification after publish, including target onboarding plan, fixture, smoke, and release check coverage.

`0.0.26` adds the public target onboarding published package acceptance gate: `release --published-acceptance` composes release check, post-publish handoff validation, parity smoke, target onboarding smoke, plan, and fixture validation so the version-pinned published package can be accepted after registry verification.

`0.0.29` adds the public command router boundary gate: `architecture --router` reports the admitted table-driven top-level command router, explicit aliases, nested target route boundary, and no-write router inspection contract.

`0.0.30` adds the public domain service facade gate: `architecture --facades` reports the six admitted service facades, route-to-facade ownership, and the no-write facade inspection contract without requiring a physical source module split.

`0.0.31` adds the public authority first-read index gate: `authority --first-read` reports the canonical read order, `authority --check` validates `llms.txt` and `.agent-onboard/authority-path.json`, and target onboarding now projects those first-read files as canonical target surface files. Current authority checks also validate `.agent-onboard/authority-index.json` as a compact digest/drift guard through `authority --index` and `authority --index-check`, without loading raw authority contents by default.

`0.0.32` adds the public target runtime namespace gate: `target runtime --namespace` reports the canonical `.agent-onboard/` namespace, `target runtime --check` validates `.agent-onboard/runtime-namespace.json`, and target onboarding projects the namespace file as a canonical target surface file.

`0.0.33` adds the public package surface preservation gate: `release --surface` reports the projected four-file npm package surface, `release --surface-check` validates the package allowlist and source-only exclusions, and `release --check` now includes the package surface preservation result.

`0.0.34` adds the public installed parity architecture smoke gate: `release --architecture-parity-smoke` validates the admitted architecture, authority, target runtime, and package surface checks in installed-package-compatible context, and `release --check` now includes the architecture parity result.

`0.0.35` adds the public source domain module partition planning gate: `architecture --partition-plan` reports the future `src/domains/*` module map and `architecture --partition-check` validates that no physical source move is performed while the npm package remains compact.

This release adds the public target repo doctor command: `target doctor --json` reports onboarding readiness, detected stack markers, canonical file status, boundary/work-items health, and next steps without writing files or running managed project commands.

This release adds the public target onboarding repair command: `target repair --plan|--write` creates missing canonical onboarding files, preserves existing non-identical files by default, and requires explicit `--force` before overwriting.

This release adds the public target repo profile command: `target profile --json` detects package managers, languages, framework dependencies, scripts, CI markers, docs, and Git presence without running managed project commands.

This release adds the public source extraction golden output freeze gate: `architecture --golden-outputs` reports the frozen command-output contract, `architecture --golden-check` validates it, and `release --version-sprawl-check` prevents current patch-version literals from spreading through source docs and tests.

This release adds the public architecture command adapter extraction gate: `architecture --architecture-adapter` reports the source-only adapter contract for the architecture command family, and `architecture --architecture-adapter-check` validates that it remains outside the npm package allowlist and unused by the packaged runtime entrypoint for this gate.

This release adds the public authority command adapter extraction gate: `architecture --authority-adapter` reports the source-only adapter contract for the authority command family, and `architecture --authority-adapter-check` validates that `authority`, `agents`, and `guard` remain outside the npm package allowlist and unused by the packaged runtime entrypoint for this gate.

This release adds the public modular runtime package inclusion planning gate: `architecture --module-inclusion-plan` records the shift from adding more source-only command adapters toward a thin-entrypoint modular runtime shape, and `architecture --module-inclusion-check` keeps the current four-file package surface unchanged while planning the next controlled package inclusion slice.

This release adds the public packaged router port inclusion gate: `architecture --packaged-router-port` reports the first controlled modular package inclusion slice, and `architecture --packaged-router-port-check` validates that the router, compatibility command port, port facade, and admitted command adapters are included in the npm package while `cli/agent-onboard.js` remains the runtime entrypoint for this gate.

This release adds the public thin entrypoint router cutover rehearsal gate: `architecture --thin-entrypoint-rehearsal` reports the future thin-entrypoint delegation shape, and `architecture --thin-entrypoint-rehearsal-check` validates no-write router/compatibility-port rehearsal vectors while keeping `cli/agent-onboard.js` as the current runtime entrypoint and preserving the 11-file modular package surface.

This release adds the public thin entrypoint router cutover application gate: `architecture --thin-entrypoint-cutover` reports the applied runtime delegation, and `architecture --thin-entrypoint-cutover-check` validates that `cli/agent-onboard.js` now routes `main(process.argv)` through the packaged command router and compatibility command port while preserving the 11-file package surface.

This release adds the public router command adapter delegation expansion gate: `architecture --router-adapter-delegation` reports the adapter-backed runtime routes, and `architecture --router-adapter-delegation-check` validates that core, release, architecture, and authority command families delegate through the packaged command adapters while keeping the 11-file package surface unchanged.

This release adds the public work-items claim/close runtime handoff gate. `work-items --schema`, `--template`, `--validate-template`, `--list`, `--validate`, `--init`, `--append`, `--claim`, and `--close` now route through a packaged work-items command adapter and packaged runtime domain service modules with explicit dry-run/write boundaries for ledger writes.

This release deletes the legacy bundled work-items fallback from `cli/agent-onboard.js`. The packaged work-items command adapter and runtime service are now the only public work-items command path.

This release extracts the public architecture static catalog from `cli/agent-onboard.js` into `cli/agent_onboard/domains/architecture/static-catalog.js`, keeping public CLI outputs unchanged while reducing the entrypoint size.

This release extracts the public target onboarding static catalog from `cli/agent-onboard.js` into `cli/agent_onboard/domains/target/static-catalog.js`, keeping target onboarding plan and fixture outputs unchanged while reducing the entrypoint size.

This release extracts the public target runtime service body from `cli/agent-onboard.js` into `cli/agent_onboard/domains/target/services/target-service.js`, keeping the existing command handlers and public outputs stable while cutting the entrypoint by another large block.

This release splits target runtime utilities from `cli/agent_onboard/domains/target/services/target-service.js` into `cli/agent_onboard/domains/target/services/target-runtime-utilities.js`, keeping target service focused and preserving public outputs.

This release splits the public M3 CLI runtime de-monolith catalog from `cli/agent_onboard/domains/architecture/static-catalog.js` into `cli/agent_onboard/domains/architecture/m3-runtime-catalog.js`, keeping architecture and release outputs stable while shrinking the architecture catalog.

This release extracts the public architecture runtime service batch from `cli/agent-onboard.js` into `cli/agent_onboard/domains/architecture/services/runtime/architecture-runtime-service.js`, keeping command outputs stable while cutting the entrypoint below 9k lines.

This release splits source-extraction and bridge handlers from the architecture runtime service into `cli/agent_onboard/domains/architecture/services/source-extraction/architecture-source-extraction-service.js`, keeping the runtime service below 1k lines while preserving architecture and release outputs.

This release extracts the work-items and claims source-domain architecture checks from `cli/agent-onboard.js` into packaged `cli/agent_onboard/domains/architecture/services/source-domains/*` services, keeping the entrypoint below 7k lines and preserving architecture and release outputs.

This release extracts the aggregate `architecture --check` coordinator from `cli/agent-onboard.js` into `cli/agent_onboard/domains/architecture/services/checks/architecture-check-service.js`, keeping the entrypoint smaller while preserving the full architecture check contract.

This release adds public work-item usability JSON views: `work-items --summary`, `work-items --next`, and `work-items --mine --actor <actor>` inspect target repo ledger progress without writing files.

This release adds public human-readable output mode for target-facing inspection commands: `target doctor --text`, `target profile --text`, and `work-items --summary|--next|--mine --text` print compact text while JSON remains available for automation.

This release expands the public target metadata engine with policy-driven output: `target metadata --plan|--check|--write` computes universal file identity and URNs, supports target-owned metadata policy overrides, preserves existing schema and authority sections with `--adopt-existing`, and updates `SOURCE_OF_TRUTH.md` non-destructively.

This release reduces the retired M3 architecture checker surface: `architecture --check` and `release --architecture-parity-smoke` keep the package/router/target-runtime invariants that still protect the public CLI, and retire source-partition/source-extraction parity checks from the active M4 gate.

This release extracts public runtime contracts into `cli/agent_onboard/runtime-contracts.js`, making command names, target command flags, package allowlist contracts, and runtime package identity shared constants instead of composer-owned literals.

This release expands the public runtime contracts with shared top-level command aliases, router command order, and runtime command groups so the router, compatibility command port, and runtime composer use the same frozen command constants.

<!-- ## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=glogos-org/agent-onboard&type=date&legend=top-left)](https://www.star-history.com/?repos=glogos-org%2Fagent-onboard&type=date&legend=top-left) -->


This release adds the public work-items domain source extraction bundle parity gate: `architecture --work-items-bundle-parity` and `architecture --work-items-bundle-parity-check` validate that the source-only `src/domains/work-items.js` slice matches the bundled CLI work-items view without expanding the npm package surface.

## Source self-dogfood and agent participation

The source repository can carry its own public Agent-Onboard operating surface:

- `AGENTS.md` gives human-readable rules for agents.
- `.agent-onboard/target.json` declares the target-repo boundary.
- `llms.txt` gives the AI-readable first-read entrypoint.
- `.agent-onboard/authority-path.json` records the first-read order.
- `.agent-onboard/runtime-namespace.json` declares the target runtime namespace.
- `.agent-onboard/project.json` records the target identity.
- `.agent-onboard/work-items.json` stores the public work-item ledger.

Agent participation is explicit. An agent should first list the ledger, then claim only an assigned work item:

```sh
npx agent-onboard work-items --list
npx agent-onboard work-items --claim --dry-run --id <public-work-item-id> --actor <agent-or-human-name>
npx agent-onboard work-items --claim --write --id <public-work-item-id> --actor <agent-or-human-name>
```

The npm package surface now includes the first controlled modular runtime slice under `cli/agent_onboard/`. Self-dogfood files remain source-repository operating files and are not included in the public npm tarball.

## License

Apache-2.0. Copyright 2026 Glogos.

## Public clean and compaction catalog

Use these commands to inspect, validate, and classify the M6 clean/compaction line before any compaction write:

```sh
npx agent-onboard release --clean-inventory
npx agent-onboard release --clean-check
npx agent-onboard release --clean-catalog
npx agent-onboard release --clean-catalog-check
npx agent-onboard release --keyword-taxonomy-check
npx agent-onboard release --readme-plan
npx agent-onboard release --readme-plan-check
npx agent-onboard release --readme-dry-run
npx agent-onboard release --readme-dry-run-check
agent-onboard release --readme-apply
agent-onboard release --readme-apply-check
agent-onboard release --closed-gates-plan
agent-onboard release --closed-gates-plan-check
agent-onboard release --closed-gates-dry-run
agent-onboard release --closed-gates-dry-run-check
agent-onboard release --closed-gates-apply
agent-onboard release --closed-gates-apply-check
agent-onboard release --closed-gates-read
agent-onboard release --closed-gates-read-check
agent-onboard release --full-test-runner
agent-onboard release --full-test-runner-check
```

The baseline reports the current source surface, `.agent-onboard` growth, package projection size, README size, keyword count, work-item ledger size, and compaction candidates. The catalog then classifies each candidate surface into a preserve-first disposition: README first-read/history split, closed gate evidence compaction, package keyword taxonomy reduction, work-item ledger archive/index split, identity index refresh discipline, and runtime/test module extraction. These surfaces are intentionally no-write unless a later admitted write gate says otherwise. The README plan/check commands classify the future split: live README keeps install, quickstart, current command surface, and safety boundary text; a future archive candidate can hold historical release prose only after an exact recovery path and metadata refresh are admitted. The README dry-run/check commands compute the exact in-memory archive candidate, live README candidate, history-index candidate, source line ranges, and candidate digests without creating `docs/release-history.md`, without creating `.agent-onboard/readme-history.index.json`, without moving files, and without rewriting README history. Future deletion, archival, movement, taxonomy reduction, or source extraction requires a separate admitted work item that names the exact catalog surface id and preserves a recovery or replay path.

### Public source module extraction second slice first-slice gate

```sh
npx agent-onboard architecture --second-slice-first-slice
npx agent-onboard architecture --second-slice-first-slice-check
```

This gate creates `src/domains/authority.js` as a source-only authority slice while preserving the compact published npm package surface.


### Public source module extraction authority bundle parity gate

```sh
npx agent-onboard architecture --authority-bundle-parity
npx agent-onboard architecture --authority-bundle-parity-check
```

This gate validates that `src/domains/authority.js` matches the bundled CLI authority view, preserves the compact four-file npm package surface, and keeps write-capable `agents` extraction out of the authority source slice.


### Public source module extraction authority runtime bridge gate

```sh
npx agent-onboard architecture --authority-runtime-bridge
npx agent-onboard architecture --authority-runtime-bridge-check
```

This gate validates that `src/domains/authority.js` can be loaded only through a guarded source-context runtime bridge, that installed package context falls back to bundled CLI authority metadata, and that `.gitignore` uses compact policy for `.agent-onboard/` local state instead of per-artifact source allowlisting.


### Public architecture M1 closure and M2 seed gate

```sh
npx agent-onboard architecture --m2-seed
npx agent-onboard architecture --m2-seed-check
npx agent-onboard architecture --work-items-plan
npx agent-onboard architecture --work-items-check
npx agent-onboard architecture --work-items-first-slice
npx agent-onboard architecture --work-items-first-slice-check
npx agent-onboard architecture --work-items-bundle-parity
npx agent-onboard architecture --work-items-bundle-parity-check
npx agent-onboard architecture --work-items-runtime-bridge
npx agent-onboard architecture --work-items-runtime-bridge-check
```

This gate validates the transition from the public architecture kernel milestone into the work-items source extraction line. The current bundle parity gate proves that `src/domains/work-items.js` matches the bundled CLI work-items view while keeping claim/close behavior excluded and preserving the compact `package.json#files` surface.

## Work-items installed fallback smoke

Use `node cli/agent-onboard.js architecture --work-items-installed-fallback-smoke` and `node cli/agent-onboard.js architecture --work-items-installed-fallback-check` to verify that the source-only work-items module remains outside the npm package while installed context falls back to bundled CLI metadata. Claim and close behavior remain excluded from this slice.

## Public claims domain source extraction planning gate

Use these commands to inspect and validate the claims-domain extraction plan:

```sh
npx agent-onboard architecture --claims-plan
npx agent-onboard architecture --claims-check
```

This planning gate selected the `claims` domain for a source-only `src/domains/claims.js` slice while preserving the compact four-file npm package surface. The follow-up first-slice gate now creates the shadow claims module without moving the published claim/close runtime handlers.

## Public claims domain source extraction first-slice gate

Use these commands to inspect and validate the claims-domain first slice:

```sh
npx agent-onboard architecture --claims-first-slice
npx agent-onboard architecture --claims-first-slice-check
```

This gate creates `src/domains/claims.js` as a source-only shadow metadata module for `work-items --claim` and `work-items --close`. The canonical claim and closure state remains in `.agent-onboard/work-items.json`, the bundled CLI runtime remains the published execution surface, and `package.json#files` stays compact.


## Public claims domain source extraction bundle parity gate

Use these commands to inspect and validate claims-domain bundle parity:

```bash
npx agent-onboard architecture --claims-bundle-parity
npx agent-onboard architecture --claims-bundle-parity-check
npx agent-onboard architecture --claims-runtime-bridge
npx agent-onboard architecture --claims-runtime-bridge-check
npx agent-onboard architecture --claims-installed-fallback-smoke
npx agent-onboard architecture --claims-installed-fallback-check
npx agent-onboard architecture --source-domain-closure-review
npx agent-onboard architecture --source-domain-closure-check
```

This gate proves `src/domains/claims.js` matches the bundled CLI claims-domain view for `work-items --claim` and `work-items --close`. It keeps the canonical claim/closure state in `.agent-onboard/work-items.json`, keeps non-claim work-items commands excluded from the claims slice, and does not expand `package.json#files`. The installed fallback smoke gate freezes the same boundary for the compact npm tarball: the source-only claims module is omitted, the claims runtime bridge resolves through bundled fallback metadata, and release checks still preserve the four-file package surface.

Source-domain stabilization closure review: `architecture --source-domain-closure-review` reports M2 closure across work-items and claims extraction gates, and `architecture --source-domain-closure-check` validates the M2 closure plus M3 seed while keeping source modules outside the npm package.


## Public CLI runtime de-monolith planning

`cli/agent-onboard.js` is now declared as monolith debt; the public runtime cutover path uses controlled source-module inclusion, keeps the current compact npm package allowlist unchanged for this planning gate, and seeds the thin CLI router cutover.

## Public release package runtime service partition

The public line admits the `release_package` domain service partition under `cli/agent_onboard/domains/package/`. The packaged module set separates release command coordination, package surface checks, source manifest context, package coordinates, and installed first-read contracts while preserving existing `agent-onboard release ...` outputs.

## Public core config guard service extraction

The public line extracts `guard --plan` and `guard --check-boundary` into the packaged core config guard service at `cli/agent_onboard/domains/core/services/config-guard-service.js`. The guard remains read-only, keeps the same target config boundary contract, and preserves existing guard JSON outputs while `cli/agent-onboard.js` stays focused on wiring and dispatch.

The current release adds the public target manifest drift guard: `target manifest --init|--check-drift|--refresh` creates and validates `.agent-onboard/target-manifest.json` with content-addressed `file_id` entries.

The current release also hardens the package-domain source manifest as explicit read-only release commands: `release --source-manifest` prints every projected npm package file with a `file_id` using `ni:///sha-256;...`, `release --clean-inventory`/`release --clean-check` expose the M6 clean-and-compaction baseline, `release --clean-catalog`/`release --clean-catalog-check` classify future compaction surfaces, `release --keyword-taxonomy`/`release --keyword-taxonomy-check` verify the compact package keyword taxonomy, `release --readme-plan`/`release --readme-plan-check` plan the README first-read/history split, `release --readme-dry-run`/`release --readme-dry-run-check` replay the exact archive/index/live README split preview, `release --readme-apply`/`release --readme-apply-check` verify the admitted README history archive and recovery index after apply, `release --closed-gates-plan`/`release --closed-gates-plan-check` plan closed gate artifact compaction without deleting or compacting raw evidence, `release --closed-gates-dry-run`/`release --closed-gates-dry-run-check` preview or replay the exact closed-gate archive/index records and recovery map, `release --closed-gates-apply`/`release --closed-gates-apply-check` verify the admitted `.agent-onboard/closed-gates.archive.jsonl` and `.agent-onboard/closed-gates.index.json` materialization while preserving raw gate artifacts, `release --closed-gates-read`/`release --closed-gates-read-check` read and validate the compact closed-gate archive/index recovery path, `release --full-test-runner`/`release --full-test-runner-check` verify bounded full-source shard execution, per-case diagnostic isolation, exclude-index containment, exit-event completion, and bounded full-test runner completion without executing tests inside the check, and `release --source-manifest-check` validates the content-addressed manifest shape plus the optional source-only hash-cache budget. `release --surface-check` continues to validate that raw `sha256` values are not exposed, stale/extra/missing/invalid cache entries have zero budget when a cache exists, the cache is never file-existence authority, and source-only hash-cache state remains outside the npm package projection.

The current command surface includes `guide --json|--text`, `quickstart --json|--text|--dry-run`, `discovery --llms|--json|--text`, `create --dry-run|--json|--text`, `issue --classify-dry-run|--json|--text`, `contributor --admission-dry-run|--json|--text`, `claim --validate-ledger`, `claim --lifecycle-check`, `claim --append --dry-run|--write`, `release --clean-inventory|--clean-check|--clean-catalog|--clean-catalog-check|--keyword-taxonomy|--keyword-taxonomy-check|--readme-plan|--readme-plan-check|--readme-dry-run|--readme-dry-run-check`, `contracts --json|--text|--check`, `check --plan|--fast [--json|--text]`, `ci --github-action|--json|--text`, `mcp --plan|--json|--text`, `bridge --dry-run|--check|--write [--target <path>] [--json|--text]`, `target inventory --preview|--json|--text`, `target memory --preview|--json|--text`, `target work-items --preview|--json|--text`, `target governance --preview|--check|--budget-contract|--budget-check|--materialize-dry-run|--materialize --write [--force]|--json|--text`, `target handoff --preview|--readiness-check|--json|--text`, and `commands --json|--text`. The guide provides a compact workflow selector for new-agent orientation, target repo triage, target onboarding preview, create-entrypoint preview, and source release handoff, and MCP bridge planning. Quickstart provides the concrete read-only first-run recipe. Discovery provides the AI-readable entrypoint. Create dry-run previews the future npm-create onboarding write set without mutating a consumer repo. Target inventory previews package, source, command, and provenance surfaces without running target commands. Target work-items previews target-owned project work-item state without admission, closure, ledger writes, or synthetic next-id generation. Target governance previews compact work-items/claims index state, exposes `--budget-contract` as the stable no-scan first-read cache/authority/budget policy, `--budget-check` validates target index byte budgets without inlining planned payloads, its drift check compares stored indexes with freshly derived payloads and reports `fresh`, `stale`, or `missing` without writing files, its materialization dry-run plans bounded first-read index payloads without writing them, and its explicit write mode materializes only allowlisted governance index files with compare-before-write; work-items write commands refresh those indexes after successful canonical ledger mutation; raw summaries are derived only on explicit request without admitting claims or inlining raw ledgers. Target handoff emits a compact next-session preview by composing target inventory, memory-surface presence, work-item summaries, governance index summaries, governance budget state, governance index drift state, and structured readiness reasons; `--readiness-check` returns the same readiness reason-code surface as a compact CI/agent gate without importing file contents, granting authority, or mutating target state. `contracts --json|--text|--check` exposes and validates the compact public contract/interface spine for these JSON outputs without exporting the source-only implementation archive or requiring TypeScript/abstract classes. Target memory previews a metadata-only descriptor of known repo memory surfaces without importing file contents. Check fast includes the governance budget check and stale-read advisories so missing/stale indexes are visible without failing unrelated checks. MCP bridge planning exposes future agent-client tool candidates mapped to existing read-only CLI commands without starting a server. The command catalog remains the machine-readable inventory of top-level commands, runtime groups, help lines, and recommended first commands.


## Create dry-run product surface

The current release adds the public create dry-run product surface: `agent-onboard create --dry-run`, `agent-onboard create --json`, and `agent-onboard create --text`. It also keeps the existing `create-agent-onboard` bin as a read-only dry-run entrypoint when invoked with `--dry-run`. The command previews the future npm-create onboarding write set and recommended next commands while preserving the no-write, no-install, no-Git, no-publish, and no-network boundary.


## Target memory descriptor product surface

The current release adds `agent-onboard target memory --preview`, `agent-onboard target memory --json`, and `agent-onboard target memory --text`. The command probes only known root memory/instruction/state paths such as `AGENTS.md`, `llms.txt`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.agent-onboard/work-items.json`, and `.agent-onboard/authority-path.json`. It reports presence, observed kind, authority grouping, and read policy metadata without importing file contents, writing target state, installing dependencies, mutating Git, publishing, or using network access.


## Release history

Historical release prose has been archived in the source repository at `docs/release-history.md`.
README.md remains the live first-read surface for install, quickstart, current command, and no-mutation boundary material.
