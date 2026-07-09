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
4. `llms.txt` — AI-readable command and orientation entrypoint
5. `package.json` — package identity, scripts, and pack surface
6. `authority-map.json` — stable file URN and authority registry
7. `manifest.json` — content identity and file coverage index
8. `.agent-onboard/target.json` — target boundary declaration
9. `.agent-onboard/runtime-namespace.json` — target runtime namespace declaration
10. `.agent-onboard/project.json` — target runtime identity
11. `.agent-onboard/work-items.json` — public work item ledger
12. `README.md` — public package or repository documentation
13. Raw evidence/source files — on demand only after the authority and scope files above

`authority-map.json` owns stable authority and file URNs. `manifest.json` records content identity and file coverage with `file_urn`, `file_path`, and `file_id` fields; it is a first-read map, not the only source of filesystem truth. Administrative markdown metadata belongs in leading HTML comment headers or registry metadata, not visible front matter.

Work-item semantics remain delegated to `agent-onboard`.
