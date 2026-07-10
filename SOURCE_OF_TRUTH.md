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

`P1S3M6` is the current public clean and compaction milestone. `agent-onboard release --clean-inventory` and `agent-onboard release --clean-check` provide the read-only baseline for that line. They may identify compaction candidates, but they do not delete, move, archive, rewrite, or compact files. Any future compaction write requires a separate admitted work item and explicit owner authorization.

