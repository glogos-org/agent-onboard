# AGENTS.md

## Agent-Onboard source repository rules

This repository dogfoods `agent-onboard` as a target repository for public agent-assisted development.

## Read order

Before proposing or making changes, read:

1. `AGENTS.md`
2. `SOURCE_OF_TRUTH.md`
3. `.agent-onboard/authority-path.json`
4. `.agent-onboard/authority-index.json`
5. `llms.txt`
6. `package.json`
7. `authority-map.json`
8. `manifest.json`
9. `.agent-onboard/target.json`
10. `.agent-onboard/runtime-namespace.json`
11. `.agent-onboard/project.json`
12. `.agent-onboard/work-items.json`
13. `README.md`
14. Raw evidence/source files on demand only after the authority and scope files above.


Runtime composer decomposition note: do not add new first-read command-surface, guide, quickstart, discovery, issue, contributor, CI recipe, check-plan, fast-check runner, or MCP bridge plan logic directly to `cli/agent_onboard/runtime-composer.js`. First-read surface logic belongs in `cli/agent_onboard/domains/core/services/public-runtime-surface-service.js`; check plan and fast-check runner logic belongs in `cli/agent_onboard/domains/core/services/public-runtime-check-fast-service.js`; MCP bridge plan logic belongs in `cli/agent_onboard/domains/core/services/public-runtime-mcp-bridge-service.js`; release command logic belongs in `cli/agent_onboard/domains/package/services/public-runtime-release-service.js`. The composer remains a compatibility bridge and export aggregator only.

Runtime/state storage note: use the text-first state layout for work item state. `.agent-onboard/work-items.json` is compact and must not inline closure payloads; use `closure_ref` values that resolve to `.agent-onboard/state/closures/work-items-closures.jsonl`. `.agent-onboard/state/live/work-items.json`, `.agent-onboard/state/events/work-items.jsonl`, `.agent-onboard/state/closures/work-items-closures.jsonl`, and `.agent-onboard/state/indexes/work-items.index.json` are the active work item shards. Do not introduce SQLite, Lightning Memory-Mapped Database, MDBX, or other binary storage as authority without a separate migration gate and a replayable text export.

Authority state shard note: `.agent-onboard/state/live-authority.json`, `.agent-onboard/state/policies.json`, `.agent-onboard/state/indexes.json`, and `.agent-onboard/state/closed-gates.jsonl` are compact source-only shards. Validate them with `node cli/agent-onboard.js authority --state-check` and `node cli/agent-onboard.js release --authority-state-parity-check`; do not treat them as permission to read raw growth files by default, and do not project these shards into the npm package.

Closed-gate compaction note: `.agent-onboard/closed-gates.archive.jsonl` and `.agent-onboard/closed-gates.index.json` are retained source-only compatibility surfaces; the active migrated state layout is `.agent-onboard/state/live/closed-gates.json`, `.agent-onboard/state/events/closed-gates.jsonl`, `.agent-onboard/state/closures/closed-gate-closures.jsonl`, and `.agent-onboard/state/indexes/closed-gates.index.json`. Validate them with `node cli/agent-onboard.js release --closed-gates-apply-check`, `node cli/agent-onboard.js release --closed-gates-read-check`, `node cli/agent-onboard.js release --closed-gates-prune-plan-check`, `node cli/agent-onboard.js release --closed-gates-prune-dry-run-check`, and `node cli/agent-onboard.js release --full-test-runner-check`; do not delete, move, or rewrite raw `*-gate.json` artifacts unless a later prune gate explicitly admits that mutation.

## Default boundary

Forbidden by default unless the repository owner explicitly authorizes the action:

- dependency install, upgrade, or removal;
- build, test, publish, deploy, or Git mutation;
- source edits outside the assigned work item;
- mutation of `.agent-onboard/` files except through an explicit `agent-onboard` command or owner request.

## Work-item participation lifecycle

Use this source-repository lifecycle for public human/agent participation:

1. Discover: read this file and inspect the public ledger.
2. Inspect: read the assigned work-item scope and relevant files before editing.
3. Claim: claim only an assigned open work item with an explicit write command.
4. Work: modify only files needed for that work item.
5. Validate: run only checks authorized by the owner or clearly permitted by the current task.
6. Handoff: report changed files, checks run, checks not run, and known non-pass states.
7. Close: record a closure envelope only after handoff evidence is ready.

For source validation, `npm test` runs the parallel quick gate. Use `npm run test:full` for the bounded shard-parallel full exhaustive fixture matrix, and `npm run test:all` when both the quick gate and the full fixture matrix are needed before release handoff.

Inspect the public command surface before choosing a workflow:

```sh
node cli/agent-onboard.js guide --text
node cli/agent-onboard.js guide --json
node cli/agent-onboard.js quickstart --text
node cli/agent-onboard.js quickstart --json
node cli/agent-onboard.js discovery --llms
node cli/agent-onboard.js discovery --text
node cli/agent-onboard.js discovery --json
node cli/agent-onboard.js authority --index
node cli/agent-onboard.js authority --index-check
node cli/agent-onboard.js authority --state
node cli/agent-onboard.js authority --state-check
node cli/agent-onboard.js authority --state
node cli/agent-onboard.js authority --state-check
node cli/agent-onboard.js target memory --text
node cli/agent-onboard.js target memory --preview
node cli/agent-onboard.js target work-items --text
node cli/agent-onboard.js target work-items --preview
node cli/agent-onboard.js target governance --text
node cli/agent-onboard.js target governance --budget-contract --text
node cli/agent-onboard.js target governance --budget-check --text
node cli/agent-onboard.js target governance --materialize-dry-run --text
node cli/agent-onboard.js target governance --check --text
node cli/agent-onboard.js target governance --materialize --write --force --text
node cli/agent-onboard.js target governance --preview
node cli/agent-onboard.js target governance --materialize-dry-run
node cli/agent-onboard.js target governance --materialize --write --force
node cli/agent-onboard.js target handoff --text
node cli/agent-onboard.js target handoff --preview
node cli/agent-onboard.js target handoff --readiness-check --text
node cli/agent-onboard.js contracts --text
node cli/agent-onboard.js contracts --check --json
node cli/agent-onboard.js contracts --validate-output --contract target_handoff_readiness_check_output --file ./handoff-readiness.json --json
node cli/agent-onboard.js issue --classify-dry-run --text
node cli/agent-onboard.js contributor --admission-dry-run --text
node cli/agent-onboard.js check --plan --text
node cli/agent-onboard.js check --fast --text
node cli/agent-onboard.js commands --text
node cli/agent-onboard.js commands --json
```

Target handoff includes governance budget state, governance index drift state, structured readiness reason codes, and a no-write readiness-check mode for next-session or CI readiness, while remaining read-only and non-authoritative.

Run the target onboarding plan before expanding target-surface behavior:

```sh
node cli/agent-onboard.js target onboarding --plan
node cli/agent-onboard.js target onboarding --fixture
node cli/agent-onboard.js target onboarding --trial
```

Use the aggregate onboarding write command only when the repository owner explicitly authorizes canonical target file creation or replacement:

```sh
node cli/agent-onboard.js target onboarding --write
```


Inspect the public architecture kernel and source partition plan and extraction rehearsal before expanding command or domain behavior:

```sh
node cli/agent-onboard.js architecture --map
node cli/agent-onboard.js architecture --router
node cli/agent-onboard.js architecture --facades
node cli/agent-onboard.js architecture --partition-plan
node cli/agent-onboard.js architecture --partition-check
node cli/agent-onboard.js architecture --extraction-rehearsal
node cli/agent-onboard.js architecture --extraction-check
node cli/agent-onboard.js architecture --golden-outputs
node cli/agent-onboard.js architecture --golden-check
node cli/agent-onboard.js architecture --adapter-boundary
node cli/agent-onboard.js architecture --adapter-check
node cli/agent-onboard.js architecture --first-slice
node cli/agent-onboard.js architecture --first-slice-check
node cli/agent-onboard.js architecture --bundle-parity
node cli/agent-onboard.js architecture --bundle-parity-check
node cli/agent-onboard.js architecture --runtime-bridge
node cli/agent-onboard.js architecture --runtime-bridge-check
node cli/agent-onboard.js architecture --installed-fallback-smoke
node cli/agent-onboard.js architecture --installed-fallback-check
node cli/agent-onboard.js architecture --second-slice-plan
node cli/agent-onboard.js architecture --second-slice-check
node cli/agent-onboard.js architecture --authority-bundle-parity
node cli/agent-onboard.js architecture --authority-bundle-parity-check
node cli/agent-onboard.js architecture --authority-runtime-bridge
node cli/agent-onboard.js architecture --authority-runtime-bridge-check
node cli/agent-onboard.js architecture --m2-seed
node cli/agent-onboard.js architecture --m2-seed-check
node cli/agent-onboard.js architecture --work-items-plan
node cli/agent-onboard.js architecture --work-items-check
node cli/agent-onboard.js architecture --work-items-first-slice
node cli/agent-onboard.js architecture --work-items-first-slice-check
node cli/agent-onboard.js architecture --check
```

Inspect the public authority first-read index before expanding authority or target onboarding behavior:

```sh
node cli/agent-onboard.js authority --first-read
node cli/agent-onboard.js authority --check
node cli/agent-onboard.js authority --index
node cli/agent-onboard.js authority --index-check
```

Inspect the public target runtime namespace before expanding target runtime files:

```sh
node cli/agent-onboard.js target runtime --namespace
node cli/agent-onboard.js target runtime --check
```

Validate the public release contract and source/package surface before any package publish handoff:

```sh
node cli/agent-onboard.js check --fast --json
node cli/agent-onboard.js release --check
```

Inspect the normalized release contract:

```sh
node cli/agent-onboard.js release --contract
```

Inspect the release fixture matrix:

```sh
node cli/agent-onboard.js release --fixture
node cli/agent-onboard.js release --surface
node cli/agent-onboard.js release --surface-check
node cli/agent-onboard.js release --source-manifest
node cli/agent-onboard.js release --source-manifest-check
node cli/agent-onboard.js release --version-sprawl-check
```

Run the installed package parity smoke:

```sh
node cli/agent-onboard.js release --parity-smoke
node cli/agent-onboard.js release --architecture-parity-smoke
```

Run the target onboarding installed-package smoke before publish handoff:

```sh
node cli/agent-onboard.js release --target-onboarding-smoke
```

Inspect the post-publish verification handoff before publishing:

```sh
node cli/agent-onboard.js release --post-publish-handoff
```

Run the published package acceptance rehearsal before publish, then the version-pinned acceptance check after publish:

```sh
node cli/agent-onboard.js release --published-acceptance
node cli/agent-onboard.js release --real-target-trial
```

Inspect the public ledger:

```sh
node cli/agent-onboard.js work-items --list
```

Claim an assigned work item only with an explicit write command:

```sh
node cli/agent-onboard.js work-items --claim --write --id <public-work-item-id> --actor <agent-or-human-name>
```

After claiming, follow the `next_steps` returned by the CLI. Claiming is not admission to publish, push, install dependencies, or edit unrelated files.

Preview closure evidence before writing it:

```sh
node cli/agent-onboard.js work-items --close --dry-run --id <public-work-item-id> --actor <agent-or-human-name> --summary <summary>
```

A closure must separate changed files, checks run, checks not run, and known non-pass states.

If a target repo already has a non-identical `AGENTS.md`, treat the conflict as expected overwrite protection. Do not force overwrite unless the repository owner explicitly requests it.

Report changed files, checks run, checks not run, and known non-pass states separately.

## Public source module extraction second slice first-slice gate

Run these source checks before publishing this gate:

```sh
node cli/agent-onboard.js architecture --second-slice-first-slice
node cli/agent-onboard.js architecture --second-slice-first-slice-check
node cli/agent-onboard.js architecture --authority-bundle-parity
node cli/agent-onboard.js architecture --authority-bundle-parity-check
node cli/agent-onboard.js architecture --authority-runtime-bridge
node cli/agent-onboard.js architecture --authority-runtime-bridge-check
```

The authority slice is source-only and is not a public import API.


## Public source module extraction authority bundle parity gate

Run these source checks before publishing this gate:

```sh
node cli/agent-onboard.js architecture --authority-bundle-parity
node cli/agent-onboard.js architecture --authority-bundle-parity-check
node cli/agent-onboard.js architecture --authority-runtime-bridge
node cli/agent-onboard.js architecture --authority-runtime-bridge-check
```

The authority source slice must remain source-only, read-only, outside `package.json#files`, and must exclude write-capable `agents` extraction.


## Architecture milestone transition

The architecture kernel milestone is closed. Before starting the next source-domain extraction task, inspect the milestone transition gate:

```sh
node cli/agent-onboard.js architecture --m2-seed
node cli/agent-onboard.js architecture --m2-seed-check
```

The next architecture milestone remains open. The work-items first slice and bundle parity gates are now closed; the next executable work item is the work-items runtime bridge gate.


## Public work-items domain source extraction bundle parity gate

Run these source checks before publishing this gate:

```sh
node cli/agent-onboard.js architecture --work-items-first-slice
node cli/agent-onboard.js architecture --work-items-first-slice-check
node cli/agent-onboard.js architecture --work-items-bundle-parity
node cli/agent-onboard.js architecture --work-items-bundle-parity-check
node cli/agent-onboard.js architecture --check
node cli/agent-onboard.js release --architecture-parity-smoke
node cli/agent-onboard.js release --check
```

The work-items source slice must remain source-only, outside `package.json#files`, and must keep `work-items --claim` and `work-items --close` reserved for a later claims-domain extraction gate.

## Work-items installed fallback smoke

Use `node cli/agent-onboard.js architecture --work-items-installed-fallback-smoke` and `node cli/agent-onboard.js architecture --work-items-installed-fallback-check` to verify that the source-only work-items module remains outside the npm package while installed context falls back to bundled CLI metadata. Claim and close behavior remain excluded from this slice.

## Public claims domain source extraction first-slice gate

Run these source checks before publishing this gate:

```sh
node cli/agent-onboard.js architecture --claims-plan
node cli/agent-onboard.js architecture --claims-check
node cli/agent-onboard.js architecture --claims-first-slice
node cli/agent-onboard.js architecture --claims-first-slice-check
node cli/agent-onboard.js architecture --check
node cli/agent-onboard.js release --check
```

The first-slice gate may create only `src/domains/claims.js` plus its source-only evidence artifact. It must not move the published `work-items --claim` or `work-items --close` runtime handlers, must keep `.agent-onboard/work-items.json` as the shared canonical ledger, and must keep the npm package allowlist compact.


## Public claims domain source extraction bundle parity gate

For this gate, run:

```bash
node cli/agent-onboard.js architecture --claims-bundle-parity
node cli/agent-onboard.js architecture --claims-bundle-parity-check
node cli/agent-onboard.js architecture --claims-runtime-bridge
node cli/agent-onboard.js architecture --claims-runtime-bridge-check
node cli/agent-onboard.js architecture --claims-installed-fallback-smoke
node cli/agent-onboard.js architecture --claims-installed-fallback-check
node cli/agent-onboard.js architecture --source-domain-closure-review
node cli/agent-onboard.js architecture --source-domain-closure-check
node cli/agent-onboard.js architecture --check
node cli/agent-onboard.js release --surface-check
node cli/agent-onboard.js release --source-manifest-check
node cli/agent-onboard.js release --check
```

The claims bundle parity gate may add only the source-only parity evidence artifact plus release/test/docs updates. It must not move the published `work-items --claim` or `work-items --close` handlers, must keep `.agent-onboard/work-items.json` as the shared canonical ledger, and must keep the npm package allowlist compact.

Claims installed fallback smoke rule: `src/domains/claims.js` remains source-only and outside `package.json#files`; installed context must resolve claims metadata through bundled fallback while preserving the shared `.agent-onboard/work-items.json` authority and excluding non-claim work-items commands.

Source-domain stabilization closure review: `architecture --source-domain-closure-review` reports M2 closure across work-items and claims extraction gates, and `architecture --source-domain-closure-check` validates the M2 closure plus M3 seed while keeping source modules outside the npm package.


## Public CLI runtime de-monolith planning

`cli/agent-onboard.js` is now declared as monolith debt; the public runtime cutover path uses controlled source-module inclusion, keeps the current compact npm package allowlist unchanged for this planning gate, and seeds the thin CLI router cutover.

## Public thin entrypoint router cutover application

Run these source checks for the thin entrypoint router cutover application gate:

```sh
node cli/agent-onboard.js architecture --package-adapter
node cli/agent-onboard.js architecture --package-adapter-check
node cli/agent-onboard.js architecture --architecture-adapter
node cli/agent-onboard.js architecture --architecture-adapter-check
node cli/agent-onboard.js architecture --authority-adapter
node cli/agent-onboard.js architecture --authority-adapter-check
node cli/agent-onboard.js architecture --module-inclusion-plan
node cli/agent-onboard.js architecture --module-inclusion-check
node cli/agent-onboard.js architecture --packaged-router-port
node cli/agent-onboard.js architecture --packaged-router-port-check
node cli/agent-onboard.js architecture --thin-entrypoint-rehearsal
node cli/agent-onboard.js architecture --thin-entrypoint-rehearsal-check
node cli/agent-onboard.js architecture --thin-entrypoint-cutover
node cli/agent-onboard.js architecture --thin-entrypoint-cutover-check
node cli/agent-onboard.js architecture --router-adapter-delegation
node cli/agent-onboard.js architecture --router-adapter-delegation-check
node cli/agent-onboard.js architecture --check
node cli/agent-onboard.js release --check
```

This gate expands runtime delegation through the packaged command adapters after the `process.argv` router cutover. It keeps the 11-file package surface unchanged; future gates should continue extracting command families without growing `cli/agent-onboard.js` again.

## Public work-items claim close runtime handoff

The public line now routes the full work-items command family through the packaged runtime service. The packaged work-items command adapter plus packaged runtime domain service modules route `work-items --schema`, `--template`, `--validate-template`, `--list`, `--validate`, `--init`, `--append`, `--claim`, and `--close`; ledger-writing commands keep explicit dry-run/write boundaries.

Run these source checks for this gate:

```sh
node -c cli/agent-onboard.js
node -c cli/agent_onboard/adapters/commands/work-items.js
node -c cli/agent_onboard/domains/work-items/services/work-items-service.js
node cli/agent-onboard.js work-items --schema
node cli/agent-onboard.js work-items --template
node cli/agent-onboard.js work-items --validate-template
node cli/agent-onboard.js work-items --list .agent-onboard/work-items.json
node cli/agent-onboard.js work-items --validate .agent-onboard/work-items.json
node cli/agent-onboard.js claim --validate-ledger --json
node cli/agent-onboard.js claim --lifecycle-check --json
node cli/agent-onboard.js work-items --init --dry-run --force
node cli/agent-onboard.js work-items --append --dry-run --id <public-work-item-id> --title "Runtime append dry-run smoke"
node cli/agent-onboard.js architecture --router-adapter-delegation-check
node cli/agent-onboard.js release --surface-check
node cli/agent-onboard.js release --source-manifest-check
node cli/agent-onboard.js release --check
npm test
```

## Public work-items legacy fallback deletion

The public line deletes the legacy bundled work-items fallback from `cli/agent-onboard.js`. The packaged work-items command adapter and packaged work-items runtime service are now the only public work-items command path.

## Public architecture static catalog extraction

The public line extracts the architecture/release static catalog from `cli/agent-onboard.js` into `cli/agent_onboard/domains/architecture/static-catalog.js`. Keep this module packaged and side-effect-free; public CLI outputs must remain stable.

## Public target static catalog extraction

The public line extracts the target onboarding static catalog from `cli/agent-onboard.js` into `cli/agent_onboard/domains/target/static-catalog.js`. Keep this module packaged and side-effect-free; target onboarding plan and fixture outputs must remain stable.

## Public target runtime service body extraction

The public line extracts the target runtime service body from `cli/agent-onboard.js` into `cli/agent_onboard/domains/target/services/target-service.js`. Keep this module packaged, keep public outputs stable, and split smaller services only through follow-up work items.

## Public target service utility split

The public line splits target runtime utilities into `cli/agent_onboard/domains/target/services/target-runtime-utilities.js`. Keep this module packaged and behavior-compatible; do not let `target-service.js` become the next god file.

## Public architecture M3 runtime catalog split

The public line splits the M3 CLI runtime de-monolith catalog into `cli/agent_onboard/domains/architecture/m3-runtime-catalog.js`. Keep this module packaged and side-effect-free; architecture and release outputs must remain stable.

## Public architecture runtime service extraction

The public line extracts architecture runtime/check handlers into `cli/agent_onboard/domains/architecture/services/runtime/architecture-runtime-service.js`. Keep this service packaged, dependency-injected, and output-compatible; `cli/agent-onboard.js` should stay a wiring and dispatch surface.

## Public architecture source extraction service split

The public line splits source-extraction and bridge handlers into `cli/agent_onboard/domains/architecture/services/source-extraction/architecture-source-extraction-service.js`. Keep the split services packaged, dependency-injected, and output-compatible; do not let either architecture service become a new god file.

## Public architecture source domain service split

The public line splits work-items and claims source-domain architecture handlers into `cli/agent_onboard/domains/architecture/services/source-domains/*` services. Keep the orchestrator thin, keep subservices dependency-injected, and do not move private or source-only context into the npm package surface.

## Public architecture aggregate check service split

The public line extracts the aggregate `architecture --check` coordinator into `cli/agent_onboard/domains/architecture/services/checks/architecture-check-service.js`. Keep the service dependency-injected and keep `cli/agent-onboard.js` as wiring plus command dispatch.

## Public release package runtime service partition

The public line admits `release_package` as a packaged domain service partition under `cli/agent_onboard/domains/package/`. Keep `package-service.js` as a thin release command coordinator, keep package surface, source manifest, package coordinate, and installed first-read responsibilities in separate service modules, and do not grow `cli/agent-onboard.js` with new release/package logic.

The package source manifest service is now an active read-only package surface guard and explicit release command surface. Keep `release --source-manifest` and `release --source-manifest-check` side-effect-free: they may hash projected package files, may consume an optional source-only `.agent-onboard/source-manifest.hash-cache.json` accelerator, and must report `file_id` values. The actual package projection remains the authority for file existence. Cache entries have a zero stale/extra/missing/invalid budget and must stay out of `package.json#files`; the commands must not write cache files, expose raw `sha256`, run npm, or pull source-only state into the package projection.

## Public core config guard service extraction

The public line extracts `guard --plan` and `guard --check-boundary` into `cli/agent_onboard/domains/core/services/config-guard-service.js`. Keep this service packaged, dependency-injected, read-only, and output-compatible with the existing guard boundary contract.

## Public operator guide product surface

Use `node cli/agent-onboard.js guide --text` or `node cli/agent-onboard.js guide --json` when a new agent or operator needs workflow selection before choosing a command family. The guide is read-only and must stay compact: first-read order, workflow command groups, escalation points, and no package publish, network, dependency install, Git mutation, or file writes.

## Public quickstart product surface

Use `node cli/agent-onboard.js quickstart --text`, `node cli/agent-onboard.js quickstart --json`, or `node cli/agent-onboard.js quickstart --dry-run` to print the first-run recipe before target onboarding. Quickstart is read-only: it may recommend guide, commands, target doctor, onboarding plan, bootstrap dry-run, and work-item lookup, but it must not write files, install dependencies, run managed project commands, publish, push, mutate Git state, or perform network calls.



## Public create dry-run product surface

Use `node cli/agent-onboard.js create --dry-run`, `node cli/agent-onboard.js create --json`, or `node cli/agent-onboard.js create --text` to preview the future npm-create onboarding write set. The command is read-only: it may list planned files and next commands, but it must not write files, scan arbitrary consumer state, install dependencies, run managed project commands, publish, mutate Git, or use network access. The `create-agent-onboard --dry-run` bin path must route to the same dry-run preview.

## Public AI discovery product surface

Use `node cli/agent-onboard.js discovery --llms`, `node cli/agent-onboard.js discovery --text`, or `node cli/agent-onboard.js discovery --json` when a new agent needs the compact AI-readable public entrypoint before selecting a workflow. Discovery is read-only: it may print the packaged/source AI discovery catalog and llms-style entrypoint, but it must not scan target repositories, create runtime state, validate arbitrary target configs, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.





## Public exact artifact oracle gate

Use `node cli/agent-onboard.js release --artifact-oracle` or `node cli/agent-onboard.js release --artifact-oracle-check` when a release candidate needs local exact artifact evidence rather than source-tree projection alone. The command may run `npm pack` into a temporary directory, compute an exact tarball SHA-256, fresh-install the local tarball into a temporary project, and smoke-test the installed CLI. It must remove temporary artifacts, must not write the package root, must not mutate target repository state, must not publish or mutate registry state, and must not require network access. Keep this command outside `check --fast`; the fast runner must continue to list it as an omitted package-manager check.

## Public target governance budget check product gate

Use `node cli/agent-onboard.js target governance --budget-check`, `node cli/agent-onboard.js target governance --budget-check --json`, or `node cli/agent-onboard.js target governance --budget-check --text` when a human or agent needs to validate compact governance index byte budgets on a target without seeing full planned payloads. The command scans only known governance files, reports per-index and combined bytes, and blocks over-budget states without writing indexes. It must not inline planned index payloads, import raw growth file contents into output, refresh indexes, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Budget-check output is evidence/orientation only; it cannot grant authority or refresh indexes.

## Public target governance budget contract product gate

Use `node cli/agent-onboard.js target governance --budget-contract`, `node cli/agent-onboard.js target governance --budget-contract --json`, or `node cli/agent-onboard.js target governance --budget-contract --text` when a human or agent needs the stable compact-governance budget/authority contract before scanning a target. The command declares the compact first-read index paths, raw authority files, size budgets, and explicit write policy. It must not scan target repositories, import raw growth files, write files, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Contract output is policy/orientation only; it cannot grant authority or refresh indexes.

## Public target governance stale-read fast-check wiring gate

`node cli/agent-onboard.js target handoff --json|--text` must surface `governance_index_drift_summary` so a new agent can see whether stored governance indexes are `fresh`, `stale`, or `missing` before relying on compact first-read cache. `node cli/agent-onboard.js check --fast --json|--text` must surface governance stale-read advisories without failing unrelated checks. This wiring is read-only: it must not refresh indexes, write files, mutate raw work-items or claims ledgers, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.

## Public target governance index drift check gate

Use `node cli/agent-onboard.js target governance --check`, `node cli/agent-onboard.js target governance --check --json`, or `node cli/agent-onboard.js target governance --check --text` before trusting stored governance indexes in a target repository. The check compares `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` with freshly derived payloads and reports `fresh`, `stale`, or `missing` without writing files. It must not refresh indexes, mutate raw work-items or claims ledgers, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.


## Public target governance index refresh integration gate

After successful canonical `node cli/agent-onboard.js work-items --init --write`, `--append --write`, `--claim --write`, or `--close --write`, the work-items response may include `governance_index_refresh`. That refresh writes only `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json`, uses compare-before-write, and is cache/orientation only. It must not treat the indexes as authority, mutate `.agent-onboard/claims.jsonl`, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. If `--file` points away from the canonical `.agent-onboard/work-items.json`, the refresh is skipped.

## Public target governance index explicit write product surface

Use `node cli/agent-onboard.js target governance --materialize --write --force`, `node cli/agent-onboard.js target governance --materialize --write --force --json`, or `node cli/agent-onboard.js target governance --materialize --write --force --text` only after explicit owner authorization to materialize compact first-read governance indexes. The command writes only `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json`, uses compare-before-write, and reports create/replace/keep actions. It must not mutate `.agent-onboard/work-items.json`, truncate or rewrite `.agent-onboard/claims.jsonl`, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Index output is cache/orientation only; raw work-items and claims files remain authoritative.

## Public target governance index materialization dry-run product surface

Use `node cli/agent-onboard.js target governance --materialize-dry-run`, `node cli/agent-onboard.js target governance --materialize-dry-run --json`, or `node cli/agent-onboard.js target governance --materialize-dry-run --text` when a new human or agent needs to see the exact compact governance index payloads that would be materialized. The command plans `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` in memory, reports create/replace/keep actions, checks the compact first-read budget, and leaves the target unchanged. It must not write indexes without explicit owner authorization, inline raw growth files, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Materialization output is evidence and orientation only; it cannot grant authority.

## Public target governance preview product surface

Use `node cli/agent-onboard.js target governance --preview`, `node cli/agent-onboard.js target governance --json`, or `node cli/agent-onboard.js target governance --text` when a new human or agent needs a compact read-only view of target governance growth state. Target governance previews `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` when present and derives bounded summaries from raw work-items/claims files only on explicit command invocation. It must not write indexes, inline raw growth files, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Governance output is evidence and orientation only; it cannot grant authority.

## Public target handoff preview product surface

Use `node cli/agent-onboard.js target handoff --preview`, `node cli/agent-onboard.js target handoff --json`, `node cli/agent-onboard.js target handoff --text`, or `node cli/agent-onboard.js target handoff --readiness-check --text` when a new human or agent needs a compact read-only next-session handoff or machine-readable readiness gate. Target handoff composes bounded target inventory, known memory/handoff surface presence, target governance summary, governance index drift state, and target work-item summary. It must not import file contents, admit work items, close work items, synthesize a next id, write ledgers, install dependencies, run managed project commands, publish, mutate Git, or perform network calls. Handoff output is evidence and orientation only; it cannot grant authority.

## Public target work-items preview product surface

Use `node cli/agent-onboard.js target work-items --preview`, `node cli/agent-onboard.js target work-items --json`, or `node cli/agent-onboard.js target work-items --text` when a new agent needs a read-only view of target-owned work-item state before admitting or closing anything. Target work-items preview reads only `.agent-onboard/work-items.json` metadata when present and reports counts, open item, last closed item, admission queue count, and the next explicit queued candidate. It must not admit work items, close work items, synthesize a next id, write ledgers, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.


## Public target memory descriptor product surface

Use `node cli/agent-onboard.js target memory --preview`, `node cli/agent-onboard.js target memory --json`, or `node cli/agent-onboard.js target memory --text` when a new agent needs a bounded repo-memory descriptor before reading raw instruction/state files. Target memory is read-only and metadata-only: it may probe known root paths for presence/kind/authority grouping, but it must not import file contents, copy target AI memory, scan arbitrary private paths, write files, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.



## Public contributor admission dry-run product surface

Use `node cli/agent-onboard.js contributor --admission-dry-run`, `node cli/agent-onboard.js contributor --admission-dry-run --json`, or `node cli/agent-onboard.js contributor --admission-dry-run --text` to preview contributor identity, provenance, and AI-assistance attribution before future admission. Optional metadata flags are `--actor`, `--handle`, `--email`, `--repo`, `--identity-surface`, `--agreement`, `--ai-assisted`, and `--assisted-by`. Contributor admission is read-only: it may create an in-memory admission preview, missing-evidence list, and `Assisted-by` guidance, but it must not verify identity externally, create canonical contributor records, write ledgers, admit claims, call GitHub, scan arbitrary target state, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.

## Public issue intake dry-run product surface

Use `node cli/agent-onboard.js issue --classify-dry-run`, `node cli/agent-onboard.js issue --classify-dry-run --json`, or `node cli/agent-onboard.js issue --classify-dry-run --text` to classify external issue metadata before deciding whether a future work item should be admitted. Optional metadata flags are `--title`, repeated `--label`, `--actor`, `--source`, `--repo`, `--issue-number`, `--runtime`, and `--handle`. Issue intake is read-only: it may create an in-memory classification and candidate preview, but it must not call GitHub, import issue state, mutate platform issues, write `.agent-onboard/work-items.json`, admit claims, install dependencies, run managed project commands, publish, mutate Git, or perform network calls.

## Public GitHub Action / CI surface product surface

Use `node cli/agent-onboard.js ci --github-action`, `node cli/agent-onboard.js ci --json`, or `node cli/agent-onboard.js ci --text` when a repo owner wants a copyable CI recipe for agent-onboard checks. The command is read-only: it may print a GitHub Actions workflow template and CI contract, but it must not create `.github/workflows/*`, call the GitHub API, run npm, run shell commands, install dependencies, mutate PRs/issues, create work items, admit claims, write ledgers, publish, mutate Git, or use network access. Treat CI output as evidence only, never as authority.


## Public MCP bridge plan / skeleton product surface

Use `node cli/agent-onboard.js mcp --plan`, `node cli/agent-onboard.js mcp --json`, or `node cli/agent-onboard.js mcp --text` when an agent client needs a stable bridge contract before a real MCP server is admitted. The command is read-only: it may list tool candidates and their mapped public CLI commands, but it must not start an MCP server, add MCP dependencies, open sockets, start stdio transport, invoke tools, write files, install dependencies, run shell commands, mutate Git, publish, or use network access. Treat MCP bridge output as orientation/evidence only, never as authority.

## Public target handoff readiness check product surface

Use `node cli/agent-onboard.js target handoff --readiness-check --json|--text` when CI or a next agent needs a compact pass/fail readiness gate over handoff reason codes. The check must fail closed on blocker reason codes, must not fail on warnings alone, and must not inline raw work-items, claims ledgers, planned governance-index payloads, memory contents, source evidence, or provider-private state. It must not write files, admit or close work items, create claims, install dependencies, run managed-project commands, mutate Git, publish, or use network access.

## Public contract spine product surface

Use `node cli/agent-onboard.js contracts --json|--text|--check` when a human, CI job, or agent needs the compact public contract/interface spine for stable JSON outputs. The command is read-only: it may describe and validate descriptor-based output contracts for handoff readiness, governance budget, and no-mutation runtime boundaries, but it must not export source-only implementation archives, require TypeScript or abstract classes, write files, install dependencies, run managed-project commands, mutate Git, publish, or use network access. Treat contract output as public product interface evidence, not as authority to mutate target state.

<!-- agent-onboard:bridge:start -->
## Agent-Onboard bridge

This marker block is a bounded discovery bridge for repositories that use `agent-onboard`. It does not grant write authority, does not admit work items, and does not replace this repository's own instructions.

Agent-onboard bridge order:

1. If `node_modules/agent-onboard/` exists, read `node_modules/agent-onboard/AGENTS.md` and `node_modules/agent-onboard/llms.txt` before running installed package commands.
2. If `node_modules/agent-onboard/` is missing, do not read `node_modules/` and do not install or fetch packages solely for this bridge. Use the checked-in `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `.agent-onboard/authority-path.json`, `.agent-onboard/authority-index.json`, and `.agent-onboard/work-items.json` when present.
3. Prefer `agent-onboard status` from an installed package, or a repository-owner specified package coordinate, only when package execution is admitted.
4. Follow installed package governance when available; otherwise follow checked-in governance until install or update is explicitly admitted.

Forbidden by default unless the repository owner explicitly authorizes the action:

- mutating source files outside the requested scope;
- mutating Git state;
- installing, removing, or upgrading dependencies;
- running managed project build, test, deploy, publish, or release commands;
- treating this bridge block as proof that runtime enforcement already exists.

<!-- agent-onboard:bridge:end -->


Installed authority state shard parity: use `node cli/agent-onboard.js release --authority-state-parity-check` before packaging or handoff. The check keeps `.agent-onboard/state/*` source-only while requiring installed-package parity to pass without loading raw authority state, writing files, installing dependencies, mutating Git, publishing, or using network access.

## Clean and compaction boundary

`P1S3M6` is the current public clean and compaction milestone. Start with `agent-onboard release --clean-inventory`, `agent-onboard release --clean-check`, `agent-onboard release --clean-catalog`, `agent-onboard release --clean-catalog-check`, and `agent-onboard release --keyword-taxonomy-check`, `agent-onboard release --readme-plan`, `agent-onboard release --readme-plan-check`, `agent-onboard release --readme-dry-run`, `agent-onboard release --readme-dry-run-check`, `agent-onboard release --readme-apply`, and `agent-onboard release --readme-apply-check`. The baseline/catalog commands remain read-only; the keyword taxonomy gate is the admitted package metadata compaction surface and still exposes read-only verification commands; the README plan gate is planning-only, and the README dry-run gate computes/replays exact archive/index/live README candidates, and the README apply gate verifies the admitted `docs/release-history.md` archive plus `.agent-onboard/readme-history.index.json` recovery index after README history is removed from the live first-read surface. The closed gate artifact planning commands inventory `.agent-onboard/*-gate.json` evidence and define future index/archive recovery requirements without writing that index/archive. They do not authorize deletion, movement, source extraction, package publication, dependency installation, Git mutation, claim mutation, or unrelated work-item mutation; the admitted README archival is limited to `docs/release-history.md` plus `.agent-onboard/readme-history.index.json`. Future compaction writes require a separate admitted work item, the exact catalog surface id, a preserved recovery/replay path, and explicit owner authorization.
