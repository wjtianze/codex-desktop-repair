# 1.1.2: updated App support and in-place Side chat updates

Supports Windows Store package **26.903.9818.0**, App version **26.903.71938**, standalone **Codex CLI 0.154.0**, and the App-bundled backend **0.153.4**.

- **Edit and regenerate in the same Side chat tab.** The replacement is prepared in the background before the existing tab is updated. Tab identity, position and title are retained. Preparation failures leave the original tab intact; uncertain sends are not automatically repeated.
- **Fix failed Side chat actions.** History is read from the actual local owner instead of treating an asynchronous RPC proxy as a synchronous object, avoiding unnecessary cross-channel history reads.
- **Work in a project from Side chat.** Selecting a local or remote project with a working directory opens a new Side chat there, preserving the current conversation and main-window navigation.
- **Support the Owl runtime.** Official executable signatures are preserved, resource patches stay in a separate runtime, and the retired browser-watcher patches are no longer applied.
- Retain reading position, model preferences, file citations, reasoning summaries, Quick Chat and other fixes. Transactional upgrades and recovery include the pinned taskbar shortcut and interrupted-recovery protection.

Temporary Side chats have no durable history that can be reverted directly. In-place updates therefore rebuild a temporary backend thread and replay earlier visible exchanges and attachments without adding another visible Side chat tab. They do not undo file changes in the working directory.

Save unsent content, quit the App and run **Install-Repair.cmd**. The standalone CLI is not replaced, and the existing login and conversation profile is retained. Use **Uninstall-Restore.cmd** to restore.

Both editions passed **432 checks**. Additional real-client checks verified consecutive edit/regenerate operations with an unchanged tab count, project working directories and unchanged main navigation. Final model dispatch was intercepted for those test threads; no real model turns were consumed. See [compatibility and validation](VALIDATION.md).

This release removes redundant RPC work from the Side chat path. It does not claim to resolve every slowdown in the updated App; remaining limits are listed under [known issues](AUDIT.md).
