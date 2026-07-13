## Current release: work item ledger compaction migration gate

The current release migrates work item closure payloads out of `.agent-onboard/work-items.json` into `.agent-onboard/state/closures/work-items-closures.jsonl`. The compatibility ledger now stays compact by storing `closure_ref` pointers, while `.agent-onboard/state/live/work-items.json`, `.agent-onboard/state/events/work-items.jsonl`, and `.agent-onboard/state/indexes/work-items.index.json` provide the live snapshot, event log, and derived navigation index. SQLite, Lightning Memory-Mapped Database, MDBX, and other binary stores remain future optional adapters only.

# agent-onboard release history

Historical release prose archived from README.md by P1S3M6W6.
README.md remains the live first-read surface for install, quickstart, current commands, and no-mutation boundary material.
## Previous release: runtime and state architecture growth arrest gate

The current release seeds a text-first runtime and state growth-arrest layout. It keeps `.agent-onboard/work-items.json` as the compatibility ledger while adding `.agent-onboard/state/live/work-items.json`, `.agent-onboard/state/events/work-items.jsonl`, `.agent-onboard/state/closures/work-items-closures.jsonl`, and `.agent-onboard/state/indexes/work-items.index.json` as the new parallel storage shape. It also adds a storage backend policy that keeps SQLite, Lightning Memory-Mapped Database, MDBX, and other binary stores as future optional repository adapters only, not current sources of truth.

## Current release: closed gate raw artifact prune dry-run gate

The current release adds `release --closed-gates-prune-dry-run` and `release --closed-gates-prune-dry-run-check` as the exact dry-run surface for future raw closed-gate artifact pruning. The checker validates the compact archive/index recovery path, archive coverage of every raw `*-gate.json` artifact, raw file-id parity, the archive-backed candidate delete set, and the preserved no-delete/no-move/no-rewrite boundary. Raw `*-gate.json` artifacts remain preserved; no prune, move, registry mutation, publish, or network operation is admitted.

## Previous release: public contract spine readiness output contract gate

The current release adds `contracts --json|--text|--check` as a compact public contract/interface spine for stable CLI JSON outputs. The spine declares descriptor-based contracts for target handoff preview, handoff readiness checks, readiness reason entries, governance budget contract/check outputs, and the shared no-mutation runtime boundary. It validates the catalog and live runtime outputs through `contracts --check` and `check --fast` without writing files, exporting source-only implementation archives, requiring TypeScript, requiring abstract classes, installing dependencies, mutating Git, publishing, or using network access.

The previous release added `target handoff --readiness-check --json|--text` as a no-write machine-readable readiness gate for CI and next-agent startup. It reuses handoff readiness reason codes, returns `readiness_check.reason_codes`, `blocker_reason_codes`, `warning_reason_codes`, and structured `reasons[]`, exits cleanly when there are warnings but no blockers, and fails closed when blocker reasons are present. It still inlines no raw work-items file, claims ledger, planned index payload, memory content, source evidence, or private provider state. The previous release added stable handoff readiness reason codes to `target handoff --json|--text`: handoff readiness includes `reason_codes` and structured `reasons[]` entries with severity, summary, and a suggested next command, so budget, drift, missing-entrypoint, and open-work-item states are explainable without importing file contents or treating the preview as authority. The earlier governance budget gate remains available through `target governance --budget-check --json|--text`, the compact no-write target scan for `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` against the public 4096-byte per-index and 8192-byte combined governance budget. `--budget-contract` remains the no-scan policy surface; `--materialize-dry-run` remains the exact payload planning surface; explicit `target governance --materialize --write --force` remains the only command that may write allowlisted governance index paths with compare-before-write.

## Previous release: target governance budget check product gate

The previous release added `target governance --budget-check --json|--text` as a compact no-write target scan that validates `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` against the public 4096-byte per-index and 8192-byte combined governance budget without inlining planned index payloads. `--budget-contract` remains the no-scan policy surface; `--materialize-dry-run` remains the exact payload planning surface; explicit `target governance --materialize --write --force` remains the only command that may write allowlisted governance index paths with compare-before-write.

## Previous release: target governance budget contract product gate

The previous release added `target governance --budget-contract --json|--text` as a no-scan, no-write public contract for compact governance first-read cache policy. It declares `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` as compact first-read indexes, keeps `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` as raw authority files loaded only on demand, publishes the 4096-byte per-index and 8192-byte combined budget, and states that only explicit `target governance --materialize --write --force` may write allowlisted index paths with compare-before-write.

## Previous release: target governance stale-read fast-check wiring gate

The previous release wires governance index drift into first-read surfaces: `target handoff --json|--text` now includes a compact `governance_index_drift_summary`, and `check --fast --json|--text` emits governance stale-read advisories when stored indexes are `stale`, `missing`, or blocked. The wiring is read-only and advisory: it does not refresh indexes, write files, mutate raw ledgers, admit or close work items, create claims, install dependencies, run managed project commands, publish, mutate Git, or use network access.

## Current release: exact artifact oracle gate

The current release adds `agent-onboard release --artifact-oracle` and `agent-onboard release --artifact-oracle-check` as a local exact artifact oracle. The oracle runs `npm pack` into a temporary directory, records the exact package file list, integrity metadata, and tarball SHA-256, then fresh-installs that local tarball into a temporary project and smoke-tests the installed CLI with `--version` and `release --check`. It removes temporary artifacts after the run. The oracle does not write the package root, mutate target repositories, publish, mutate registry state, or require network access. Because it runs npm and creates temporary files, `check --fast` reports it as an omitted slow/package-manager check instead of executing it in the in-process fast runner.

## Previous release: check plan / fast runner product gate

The previous release added the public check plan and fast runner product surface: `agent-onboard check --plan`, `agent-onboard check --plan --json`, `agent-onboard check --plan --text`, `agent-onboard check --fast`, `agent-onboard check --fast --json`, and `agent-onboard check --fast --text`. The plan command exposes a deterministic default-fast registry of packaged public probes. The fast command runs the registry in process against command discovery, guide, quickstart, discovery, create dry-run, issue intake, contributor admission, target inventory preview, target memory preview, target work-items preview, target governance preview, target governance budget contract, target governance budget check, target governance index materialization dry-run, target governance index drift check, target handoff preview, target handoff readiness check, source manifest, package surface, and release integrity. It omits `release --artifact-oracle` because that command intentionally runs npm in temporary directories. It does not write files, spawn shell commands, run npm, mutate Git, publish, or use network access.

## Previous release: GitHub Action / CI surface product gate

The previous release added the public GitHub Action / CI surface product surface: `agent-onboard ci --github-action`, `agent-onboard ci --json`, and `agent-onboard ci --text`. The command prints a copyable GitHub Actions workflow recipe plus a machine-readable CI contract for running `check --fast --json` and `release --check`. It does not create `.github/workflows/*`, call the GitHub API, run npm, run shell commands, mutate Git, use network access, write files, admit claims, create work items, write ledgers, or publish. CI output is evidence only; it is not authority and cannot admit claims or create canonical work items.

## Previous release: target governance index drift check gate

The previous release added the public target governance index drift check gate: `target governance --check` compares stored governance indexes with freshly derived payloads and reports `fresh`, `stale`, or `missing` without writing files. The check uses the same bounded materialization derivation as the dry-run/write surfaces, ignores `updated_at` churn when semantic payloads match, and recommends explicit materialization only when a refresh is required. It never treats indexes as authority and does not mutate `.agent-onboard/work-items.json`, truncate or rewrite `.agent-onboard/claims.jsonl`, write indexes, admit or close work items, create claims, mutate Git, install dependencies, run managed project commands, publish, or use network access.

Target governance drift-check boundary summary: no-write comparison only; stored indexes are cache/orientation; `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` remain authoritative; reports `fresh`, `stale`, or `missing`; without index refresh, raw ledger mutation, claim creation, work-item admission, closure, dependency installation, managed-project command execution, Git mutation, network access, or publish.

## Previous release: target governance index refresh integration gate

The previous release added the public target governance index refresh integration gate: `work-items --init|--append|--claim|--close --write` now refreshes allowlisted governance indexes after a successful canonical `.agent-onboard/work-items.json` mutation. The refresh reuses the explicit materialization writer, writes only `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json`, performs compare-before-write, and reports the embedded `governance_index_refresh` result in the work-items write response. It is skipped for non-canonical `--file` paths and never treats indexes as authority. It does not truncate or rewrite `.agent-onboard/claims.jsonl`, create claims, mutate Git, install dependencies, run managed project commands, publish, or use network access.

Target governance refresh boundary summary: after admitted canonical work-items write only; allowlisted governance index paths only; compare-before-write; index payloads are first-read cache; `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` remain authoritative; without claim creation, claims-ledger mutation, dependency installation, managed-project command execution, Git mutation, network access, or publish.

## Previous release: target governance index explicit write product gate

The previous release added the public target governance index explicit write product surface: `agent-onboard target governance --materialize --write --force`, `agent-onboard target governance --materialize --write --force --json`, and `agent-onboard target governance --materialize --write --force --text`. The command reuses the bounded governance index materialization plan, writes only `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json`, performs compare-before-write, and reports create/replace/keep actions. It does not mutate `.agent-onboard/work-items.json`, truncate or rewrite `.agent-onboard/claims.jsonl`, admit or close work items, create claims, mutate Git, install dependencies, run managed project commands, publish, or use network access. Write output is evidence and orientation only; the raw work-items and claims files remain authoritative.

Target governance explicit write boundary summary: explicit owner-authorized write only; allowlisted governance index paths only; compare-before-write; index payloads are first-read cache; `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` remain authoritative; without raw ledger mutation, claim creation, work-item admission, closure, dependency installation, managed-project command execution, Git mutation, network access, or publish.

## Previous release: target governance index materialization dry-run product gate

The previous release added the public target governance index materialization dry-run product surface: `agent-onboard target governance --materialize-dry-run`, `agent-onboard target governance --materialize-dry-run --json`, and `agent-onboard target governance --materialize-dry-run --text`. The command derives bounded `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` payloads in memory, reports whether each index would be created/replaced/kept, checks a compact first-read budget, and leaves the target unchanged. It does not write indexes, inline raw growth files, admit or close work items, create claims, mutate Git, install dependencies, run managed project commands, publish, or use network access. Materialization dry-run output is evidence and orientation only; it cannot grant authority.

Target governance materialization boundary summary: dry-run only; index payloads are first-read cache; `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` remain authoritative; without index writes, raw ledger inlining, claim creation, work-item admission, closure, dependency installation, managed-project command execution, Git mutation, network access, or target writes.

## Previous release: target governance preview product gate

The previous release added the public target governance preview product surface: `agent-onboard target governance --preview`, `agent-onboard target governance --json`, and `agent-onboard target governance --text`. The command previews compact `.agent-onboard/work-items.index.json` and `.agent-onboard/claims.index.json` governance indexes when present, and derives bounded in-memory summaries from `.agent-onboard/work-items.json` and `.agent-onboard/claims.jsonl` only on explicit command invocation. It does not write indexes, inline raw growth files, admit or close work items, create claims, mutate Git, install dependencies, run managed project commands, publish, or use network access. Governance preview output is evidence and orientation only; it cannot grant authority.

Target governance boundary summary: compact indexes preferred; raw growth files on-demand only; without index writes, raw ledger inlining, claim creation, work-item admission, closure, dependency installation, managed-project command execution, Git mutation, network access, or target writes.

## Previous release: target handoff preview product gate

The previous release added the public target handoff preview product surface: `agent-onboard target handoff --preview`, `agent-onboard target handoff --json`, and `agent-onboard target handoff --text`. The command composes bounded target inventory, known memory/handoff surface presence, target governance summary, and target work-item summary into a compact next-session handoff. It does not import file contents, admit or close work items, synthesize a next id, write ledgers, mutate Git, install dependencies, run managed project commands, publish, or use network access. Handoff preview output is evidence and orientation only; it cannot grant authority.

Target handoff boundary summary: without file-content import, work-item admission, closure, synthetic next-id generation, ledger writes, dependency installation, managed-project command execution, Git mutation, network access, or target writes.

## Previous release: target work-items preview product gate

The previous release added the public target work-items preview product surface: `agent-onboard target work-items --preview`, `agent-onboard target work-items --json`, and `agent-onboard target work-items --text`. The command reads only `.agent-onboard/work-items.json` metadata when present, reports total/status counts, current open item, last closed item, admission queue count, and the next explicit queued candidate. It does not admit work items, close work items, synthesize a next id, write ledgers, mutate Git, install dependencies, run managed project commands, publish, or use network access. Work-items preview output is evidence and triage only; it cannot grant authority.

Target work-items boundary summary: without work-item admission, closure, synthetic next-id generation, ledger writes, Git mutation, network access, or target writes.

## Previous release: target inventory preview product gate

The previous release added the public target inventory preview product surface: `agent-onboard target inventory --preview`, `agent-onboard target inventory --json`, and `agent-onboard target inventory --text`. The command scans target file names while excluding `.git`, `node_modules`, and `.agent-onboard`, reads bounded `package.json`, README, and workflow snippets only to extract script and command-surface metadata, and reports package, source, command, identity/provenance, and boundary surfaces without dependency installation, managed-project command execution, Git mutation, network access, or writes. Inventory output is evidence and triage only; it cannot admit claims, create canonical work items, write ledgers, or grant authority.

Target inventory boundary summary: without dependency installation, managed-project command execution, Git mutation, network access, or writes.

## Previous release: MCP bridge plan / skeleton product gate

The previous release added the public MCP bridge plan / skeleton product surface: `agent-onboard mcp --plan`, `agent-onboard mcp --json`, and `agent-onboard mcp --text`. The command prints a read-only agent-client bridge contract with future tool candidates mapped to existing public commands such as `commands --json`, `discovery --json`, `target inventory --json`, `target memory --json`, `target work-items --json`, `target governance --json`, `target handoff --json`, `target handoff --readiness-check --json`, `check --fast --json`, `ci --json`, and `release --check`. It does not start an MCP server, add MCP dependencies, open sockets, start stdio transport, invoke MCP tools, write files, mutate Git, use network access, install dependencies, run shell commands, or publish. MCP bridge output is evidence and orientation only; it cannot admit claims, create canonical work items, write ledgers, or grant authority.

MCP bridge boundary summary: without starting an MCP server, adding MCP dependencies, opening sockets, starting stdio transport, writing files, network, Git mutation, or publish.

This release adds the public contract output validator gate: `contracts --validate-output --contract <id> --file <path> --json|--text` validates a captured JSON output against one public contract ID, checks schema/required paths/status/readiness reasons/no-mutation boundaries, does not re-emit file contents, and fails non-zero on mismatch.

## Current release: claim lifecycle conflict hardening gate

The current release adds `agent-onboard claim --lifecycle-check` and hardens `agent-onboard claim --append --dry-run|--write`. The lifecycle check validates `.agent-onboard/claims.jsonl` sequencing, detects terminal events without matching proposed events, rejects multiple active claims for the same work item as conflicts, and reports stale active claims as compact advisories without inlining raw ledger entries. `claim --append` now plans the post-append lifecycle first and refuses both dry-run success and explicit writes when the planned event would create an active-claim conflict. The command remains read-only unless `--write` is explicitly supplied, never mutates `.agent-onboard/work-items.json`, does not mutate Git, does not run package managers, does not publish, and does not require network access.
