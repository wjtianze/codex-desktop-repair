# 1.1.17-en.1 release notes

This release supports Windows x64 Store package `26.915.4065.0`, UI `26.915.31945`, and bundled Codex backend `0.155.0-alpha.9.2`. Other official versions remain unsupported. Signature, integrity, and permission checks remain enforced.

## Install and restore

Download and extract the release ZIP, save unsent drafts, exit the desktop app, and run the install launcher. Installation creates a separate runtime while preserving sign-in, chats, model preferences, and restore backups. Use the uninstall launcher to reverse this project's installation. No separate Python or Node.js installation is required. Verify the download against the attached SHA256SUMS file.

## Changes

- Adapt side chats, saved history, model previews, search, downloads, message lists, and visualization previews to the new modules and interfaces.
- Use the current panel manager and activation option so newly created side tabs activate their content.
- Include the new clinical search and citation flags in model-related performance cache dependencies.
- Connect draft checkpoints to the current explicit flush entry, retain native write coalescing, and cover both current logging entry points.
- Update native virtual-list and progressive visualization mounting checks.

## Scope and limits

This package does not replace the standalone Codex CLI or modify the command-runner binary. An outer script returning does not mean its child command has exited. Dropping session_id or failing to track background searches can still leave resource-consuming commands running. This release does not claim to fix every process-lifecycle issue or eliminate all long-session latency.

See [Compatibility and validation](VALIDATION.md) for check coverage and live verification limits. When reporting a problem, include the official and repair versions, reproduction steps, and concurrent search or heavy workloads. Do not upload account files or private chats. Wait for a matching repair release after an official upgrade; do not bypass version checks.
