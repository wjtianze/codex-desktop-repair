# Codex / ChatGPT Desktop Repair

An unofficial local repair package for the Windows desktop app. It addresses verified performance, message rendering, image layout, per-conversation model selection, composer recovery, and sidebar filtering issues. The installer builds a separate runtime copy and reuses the existing profile.

This is the English edition of [wjtianze/codex-desktop-repair](https://github.com/wjtianze/codex-desktop-repair). The original main branch remains in Chinese.

**Supported target only: Windows x64, Microsoft Store package OpenAI.Codex 26.903.9818.0, application version 26.903.71938. Other versions are rejected before patching.**

## Installation

1. Download the [English release](https://github.com/wjtianze/codex-desktop-repair/releases/tag/v1.0.15-en.1) and extract the ZIP.
2. Save any unsent content and quit ChatGPT.
3. Double-click **Install-Repair.cmd**. The installer checks the official signature, version, and file hashes, then builds the repair and keeps rollback backups.
4. Use **ChatGPT** in the Start menu afterward. A visible verification window appears briefly before the app starts.

No separate Python, Node.js, or package installation is required. The installer uses the official app's bundled runtime after verifying its hash. Installation runs locally.

Run **Check-Environment.cmd** to check compatibility first. To install without sidebar filtering, run:

    Install-Repair.cmd --without-sidebar

## Included changes

| Area | Behavior |
| --- | --- |
| Startup and history lists | Prefer existing titles; bound and cache long-preview parsing in the main and renderer processes. |
| Long sessions | Bound performance records, release empty listener collections and consumed log records, and enforce the existing idle-history capacity target. |
| Conversation rendering | Reuse unchanged history conversions and metadata parsing; avoid computing an unused Work summary in ordinary chats. |
| Reading position | Restore where you left off together with measured message heights; measure the latest long reply earlier and let user scrolling take priority. |
| Messages and images | Identify internal retrieval images correctly, retain streaming content, and preserve the natural aspect ratio of a single image. |
| File citations | Use compact chips for uploaded PDF, Markdown, HTML, spreadsheet, and other references; retain full cards for generated downloads. |
| Project settings | Successful reference-file-only changes enable Save; pending operations block saving and failed changes retain the native error path. |
| Work activity | Keep thought summaries in native process disclosures and ordinary progress reports visible; show only the latest plan snapshot in each group. |
| Live Chat summaries | Expand when the first summary arrives, preserve later manual collapse, and retain Thinking when the server has not supplied content. |
| Message navigation | Preview and jump between user messages in Chat, floating Quick Chat, and Side chat; appears after four prompts, preserves marker lengths, and keeps a small gap beside the text. |
| Side chat message actions | Edit completed prompts or regenerate answers in a new branch, keeping the original conversation and attachments. |
| Quick Chat message actions | Native edit and regenerate controls preserve attachments, branches, and model options while respecting busy and read-only states. |
| Historical timers and current progress | Close historical activity, show the current turn independently, and recover its snapshot after prolonged inactivity. |
| Save As downloads | Choose the destination before downloading, show a busy state, transfer bounded chunks, and commit only after completion. |
| Models and reasoning effort | Preview the model and reasoning level while dragging; save on release and remember choices per conversation. |
| Code block scrolling | Keep headers in place from the first render, including ChatGPT code blocks; load syntax highlighting as needed. |
| Side panel | Open Browser, Files, and temporary Side chats from Chat, Work, new chats, and existing conversations. |
| State and drafts | Save draft-only edits in a small separate file and backup; retain the native complete state format for other changes and explicit flushes. |
| Stop and steering | Reserve request capacity for Stop and steering without replaying operations whose outcome is unknown. |
| Layout and background work | Combine frequent layout notifications and pause hidden slider decorations. |
| Mention search | Wait for stable input, discard obsolete queued work, and serialize history searches for each host. |
| Quick chat | Create spare windows on demand. Both ChatGPT and Codex modes support Ctrl+Alt+N and the round button beside New chat. |
| Browser and Chrome components | Keep the new official browser implementation; retire the old rollout-watcher patches. |
| Stability | Bound repeated renderer-crash recovery and handle cleanup after optional-device initialization failures. |
| Window restoration | Cap invalid dimensions and move capped oversized windows into the desktop work area. |
| Composer recovery | Keep the composer during a transient cached 404 for a locally known private conversation, with bounded retry. |
| Sidebar | All chats, Chat and cloud work, and Local work and Codex views. Follow the current mode by default, with manual selection and matching project filtering. |
| Progressive previews and search | Preview arriving HTML; show received search queries, domains, and page sources during generation. |

Composer recovery preserves the native submit, archive, sharing, and access checks. Idle cleanup protects active, viewed, observed, approval-blocked, and history-loading tasks.

See [what's new in 1.0.11](docs/UPDATES_1_0_11.md). Earlier side-panel, preview, and search improvements are also included.

## Restore

Quit the repaired app and run **Uninstall-Restore.cmd**, or **Uninstall-Fixed.cmd** in the installation directory. It unwinds this project's installation records and restores the previous files and entry point. Any earlier local repairs return to their pre-installation state.

The installation directory is **%LOCALAPPDATA%\ChatGPT-PerformanceFix**. Backups remain in its **backups** directory. Chat and account data are not removed. Browser caches changed by another program after installation are preserved and reported.

## Compatibility and known issues

See the [1.1.0 release notes](docs/UPDATES_1_1_0.md), [compatibility and testing](docs/VALIDATION.md) for supported versions and local checks, and [known issues](docs/AUDIT.md) for problems this repair does not fully resolve.

Some long-session delays and system-wide freezes remain unresolved. If the backend is unresponsive, Stop may still wait for a response. After an unexpected exit, keep the separate draft file and its backup; save unsent text before returning to an older version.

Only patch fragments, helper code, tests, and documentation are distributed. Version 1.1.0 preserves the official executable and its digital signature; repairs are applied to resources in a separate runtime copy, and the Store installation remains intact. An official update requires a newly validated adaptation.

If security software reports a detection, stop installation and keep the details. Do not disable protection or add an exclusion. The development-time command-line detection and response are documented in [security notes](docs/SECURITY.md).

Developers can run **node tests/run.cjs** with Node.js 24. On Windows with the supported official app installed, **node tests/run.cjs --installed** additionally generates native fixtures from that installation and executes the actual modified functions. Multilingual strings retained inside synthetic test data exercise Unicode handling; project documentation and user-facing messages are in English.

## Original project

These repairs were developed in [wjtianze/codex-desktop-repair](https://github.com/wjtianze/codex-desktop-repair). If this work helps you, please consider starring the original repository.

## A maintainer's rant

After spending this long repairing the app, I honestly wonder whether parts of it were vibe-coded and shipped before anyone tried the complete workflow. Memory that should be released hangs around. Reasoning summaries land in the normal conversation. Adding or removing reference files somehow does not count as changing a project. Images from project reference material can be confused with generated output. The composer can simply disappear. Reasoning labels and their sliders disagree, and one plan can produce multiple competing progress badges. The same history gets parsed again and again, the same state gets rewritten, and a logger keeps holding records after writing them. Opening a conversation, editing a project, viewing an image, waiting for a reply: how do such basic paths keep becoming traps?

Put together, the experience feels like a giant pile of shit held together with spaghetti. Fix one hole and two more appear. Just when it becomes usable, another OpenAI release means checking the package again, chasing changed interfaces, rerunning regressions, and cleaning up behind it all over again. Users pay a subscription, then get handed testing, debugging, and maintenance work as an unpaid extra. This project should not need to exist.

This is the maintainer's reaction to the actual experience. Specific defects, reproduction evidence, and unresolved issues are documented in the [audit](docs/AUDIT.md).
