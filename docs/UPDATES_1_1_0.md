# 1.1.0: compatibility with the updated ChatGPT App and Codex CLI

The previous repair package refuses installation after the official App is upgraded. This release supports Windows Store package **26.903.9818.0**, App version **26.903.71938**, and has been checked with standalone **Codex CLI 0.154.0**.

- Carries forward chat reading position, model preferences, reasoning summaries, compact uploaded-file citations, Quick Chat and Side chat fixes using the new components and state bindings.
- Preserves the updated native presentation for generated files and shows busy feedback while saving a file.
- Supports the new Owl runtime while preserving the official executable and its digital signature. Repairs remain in a separate local runtime copy.
- Keeps the new official browser implementation. The old rollout-watcher patches are no longer applied, and shared browser program files are left intact.
- Supports transactional upgrades across App versions, includes the existing pinned taskbar shortcut in recovery, and retains the current recovery pointer if a rollback is interrupted.

## Install and restore

Save unsent content, quit ChatGPT, extract the package and run **Install-Repair.cmd**. The existing profile, login, conversations and model preferences are retained. Workspace source files and repair packages are not cleanup targets.

The standalone CLI is not replaced. The App includes backend **0.153.4**, which is a separate executable from standalone CLI **0.154.0**. Both were checked using their generated protocol schemas and live initialization, model-list and policy-requirement requests.

To restore, quit the repaired App and run **Uninstall-Restore.cmd**. The official installation, user profile and local backups remain available. Unsupported App versions still fail closed instead of bypassing version or integrity checks.

See [Compatibility and validation](VALIDATION.md) for the verification scope and limitations.
