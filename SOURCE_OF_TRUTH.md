<!--
file_urn: urn:agent-onboard:file:source-of-truth-md-2e8b8fb6
metadata_role: target_authority_summary
-->
# Source of Truth

This repository is tracked as the `agent-onboard` target for agent-onboard metadata.

Authority order:

1. `AGENTS.md`
2. `llms.txt`
3. `.agent-onboard/authority-path.json`
4. `.agent-onboard/target.json`
5. `.agent-onboard/runtime-namespace.json`
6. `.agent-onboard/project.json`
7. `.agent-onboard/work-items.json`
8. `README.md`
9. `authority-map.json`
10. `manifest.json`

`authority-map.json` owns stable authority and file URNs. `manifest.json` records content identity with `file_urn`, `file_path`, and `file_id` fields. Administrative markdown metadata belongs in leading HTML comment headers or registry metadata, not visible front matter.

Work-item semantics remain delegated to `agent-onboard`.
