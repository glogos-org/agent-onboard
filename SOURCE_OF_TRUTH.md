<!--
file_urn: urn:agent-onboard:file:source-of-truth-md-2e8b8fb6
metadata_role: target_authority_summary
-->
# Source of Truth

This repository is tracked as the `agent-onboard` target for agent-onboard metadata.

Authority order:

1. `AGENTS.md` — human and agent operating rules
2. `SOURCE_OF_TRUTH.md` — human-readable authority precedence
3. `.agent-onboard/authority-path.json` — machine-readable authority path index
4. `.agent-onboard/authority-index.json` — compact authority digest and drift index
5. `llms.txt` — AI-readable command and orientation entrypoint
6. `package.json` — package identity, scripts, and pack surface
7. `authority-map.json` — stable file URN and authority registry
8. `manifest.json` — content identity and file coverage index
9. `.agent-onboard/target.json` — target boundary declaration
10. `.agent-onboard/runtime-namespace.json` — target runtime namespace declaration
11. `.agent-onboard/project.json` — target runtime identity
12. `.agent-onboard/work-items.json` — public work item ledger
13. `README.md` — public package or repository documentation
14. Raw evidence/source files — on demand only after the authority and scope files above

`.agent-onboard/authority-index.json` records compact file digests for drift checks without inlining raw authority contents. `authority-map.json` owns stable authority and file URNs. `manifest.json` records content identity and file coverage with `file_urn`, `file_path`, and `file_id` fields; it is a first-read map, not the only source of filesystem truth. Package source-manifest cache state, when present, is source-only acceleration and not authority for file existence. Administrative markdown metadata belongs in leading HTML comment headers or registry metadata, not visible front matter.

Bridge marker block: `AGENTS.md` may contain the bounded `agent-onboard:bridge` marker block. That block is discovery guidance only; it does not admit work items, grant mutation authority, or replace this source-of-truth order.

Work-item semantics remain delegated to `agent-onboard`.

## Claim ledger JSONL boundary

`agent-onboard claim --validate-ledger` validates `.agent-onboard/claims.jsonl` as compact JSONL coordination state without inlining raw entries. `agent-onboard claim --lifecycle-check` checks proposed/merged sequencing, active claim conflicts, and stale active claims as compact lifecycle state. `agent-onboard claim --append --write` may append exactly one claim event to that ledger only when the repository owner explicitly authorizes the write and only after lifecycle conflict planning passes; it does not mutate the work-item ledger, Git, dependencies, build/test/deploy state, publication state, registry state, or network state.


## Authority state shards

`.agent-onboard/state/live-authority.json`, `.agent-onboard/state/policies.json`, `.agent-onboard/state/indexes.json`, and `.agent-onboard/state/closed-gates.jsonl` are compact source-only authority state shards. `authority --state` previews generated shard state, and `authority --state-check` compares stored shards with the generated compact state without loading raw growth files by default. These shards are not projected into the npm package and do not grant write authority.

## Exact artifact oracle

`release --artifact-oracle-check` runs local exact artifact evidence using temporary npm pack and fresh install smoke. It must not publish, mutate registry state, require network access, write the package root, or mutate target repositories.


`release --authority-state-parity-check` is the current installed authority-state shard parity gate. It validates that `.agent-onboard/state/*` shards remain source-only, remain outside the npm package projection, and are tolerated as absent in installed package context while `authority --state-check` still passes. It is read-only and does not run package managers, publish, mutate registry state, mutate Git, or load raw authority content by default.

## Clean and compaction baseline

`P1S3M6` is the current public clean and compaction milestone. `agent-onboard release --clean-inventory` and `agent-onboard release --clean-check` provide the read-only baseline; `agent-onboard release --clean-catalog` and `agent-onboard release --clean-catalog-check` classify candidate surfaces before writes. `agent-onboard release --keyword-taxonomy` and `agent-onboard release --keyword-taxonomy-check` verify the admitted package keyword taxonomy compaction: package discovery terms are bounded while preserving package identity, target onboarding, coordination, authority/governance, release/package, public contract, agent-integration, and clean-compaction discovery. `agent-onboard release --readme-plan` and `agent-onboard release --readme-plan-check` plan the README first-read/history split while preserving install, quickstart, current command surface, and safety boundary text in the live README. `agent-onboard release --readme-dry-run` and `agent-onboard release --readme-dry-run-check` compute/replay exact archive, index, live README candidates, source line ranges, and candidate digests. `agent-onboard release --readme-apply` and `agent-onboard release --readme-apply-check` verify the admitted `docs/release-history.md` archive, `.agent-onboard/readme-history.index.json` recovery index, and live README pointer after the split. `agent-onboard release --closed-gates-plan` and `agent-onboard release --closed-gates-plan-check` plan closed gate artifact compaction while preserving raw closure artifacts; `agent-onboard release --closed-gates-dry-run` and `agent-onboard release --closed-gates-dry-run-check` compute or replay exact archive/index candidate records and a recovery map. `agent-onboard release --closed-gates-apply` and `agent-onboard release --closed-gates-apply-check` verify the admitted `.agent-onboard/closed-gates.index.json` and `.agent-onboard/closed-gates.archive.jsonl` materialization while preserving raw gate artifacts. `agent-onboard release --closed-gates-read` and `agent-onboard release --closed-gates-read-check` read that compact archive/index recovery path and verify raw gate artifact file IDs still match. `agent-onboard release --closed-gates-prune-plan` and `agent-onboard release --closed-gates-prune-plan-check` plan raw gate artifact pruning without deleting, moving, rewriting, or authorizing a future apply. `agent-onboard release --closed-gates-prune-dry-run` and `agent-onboard release --closed-gates-prune-dry-run-check` compute and validate the exact raw gate artifact delete set that a future apply gate may use, while still deleting nothing; any actual prune still requires a separate apply gate and owner authorization. `agent-onboard release --full-test-runner` and `agent-onboard release --full-test-runner-check` verify the official full test runner completion contract: bounded full-source shard mode by default, per-case diagnostic isolation through --only-index and shard containment through --exclude-index, deterministic selected-test exit, process-exit completion instead of stdio-close waiting, and explicit bounded task timeouts without running tests inside the checker. The split does not move or delete files. These commands do not delete, move, extract source modules, publish, mutate registry state, or authorize unrelated compaction surfaces; the only admitted README archival surface is `docs/release-history.md` plus `.agent-onboard/readme-history.index.json`. Any future deletion, movement, or pruning of raw gate artifacts requires a separate admitted work item, exact catalog surface id, preserved recovery/replay path, and explicit owner authorization.

