# Codex / ChatGPT Desktop Repair

An unofficial local repair package for the Windows desktop app. It addresses verified performance, message rendering, image layout, per-conversation model selection, composer recovery, and sidebar filtering issues. The installer builds a separate runtime copy and reuses the existing profile.

This is the English edition of [wjtianze/codex-desktop-repair](https://github.com/wjtianze/codex-desktop-repair). The original main branch remains in Chinese.

**Supported target only: Windows x64, Microsoft Store package OpenAI.Codex 26.901.6511.0, application version 26.901.51231. Other versions are rejected before patching.**

## Installation

1. Download the [English release](https://github.com/wjtianze/codex-desktop-repair/releases/tag/v1.0.1-en.1) and extract the ZIP.
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
| Messages and images | Identify internal retrieval images correctly, retain streaming content, and preserve the natural aspect ratio of a single image. |
| File citations | Use compact chips for uploaded PDF, Markdown, HTML, spreadsheet, and other references; retain full cards for generated downloads. |
| Models and reasoning effort | Remember choices per conversation across restarts; select the correct slider slot when the catalog has no explicit default. |
| State and drafts | Coalesce queued writes and await asynchronous ordinary flushes. Text drafts wait 750 ms after editing; clearing remains immediate. |
| Mention search | Wait for stable input, discard obsolete queued work, and serialize history searches for each host. |
| Quick chat | Create spare windows on demand. Both ChatGPT and Codex modes support Ctrl+Alt+N and the round button beside New chat. |
| Browser and Chrome components | Read large records in bounded batches; coalesce file notifications and process notifications arriving during queue cleanup. |
| Stability | Bound repeated renderer-crash recovery and handle cleanup after optional-device initialization failures. |
| Window restoration | Cap invalid dimensions and move capped oversized windows into the desktop work area. |
| Composer recovery | Keep the composer during a transient cached 404 for a locally known private conversation, with bounded retry. |
| Sidebar | All chats, Chat and cloud work, and Local work and Codex views. Follow the current mode by default, with manual selection and matching project filtering. |

Composer recovery preserves the native submit, archive, sharing, and access checks. Idle cleanup protects active, viewed, observed, approval-blocked, and history-loading tasks.

## Restore

Quit the repaired app and run **Uninstall-Restore.cmd**, or **Uninstall-Fixed.cmd** in the installation directory. It unwinds this project's installation records and restores the previous files and entry point. Any earlier local repairs return to their pre-installation state.

The installation directory is **%LOCALAPPDATA%\ChatGPT-PerformanceFix**. Backups remain in its **backups** directory. Chat and account data are not removed. Browser caches changed by another program after installation are preserved and reported.

## Validation and limits

The base 1.0.1 repair passed 188 behavior tests and verification of all 8,799 packed resources. The English edition reruns the same tests and rebuilds hashes after translating its own interface and console messages. See [validation](docs/VALIDATION.md), [audit findings](docs/AUDIT.md), and the [upstream evidence guide](docs/UPSTREAM_REPORT.md).

Some occasional input delay remains unexplained. Drafts still use the native whole-state file and backup format; these changes reduce repeated work and save frequency, rather than eliminating whole-file writes.

Only patch fragments, helper code, tests, and documentation are distributed. Updating the copied executable's resource-header digest invalidates its official digital signature; the original Store installation remains intact. An official update requires a newly validated adaptation.

If security software reports a detection, stop installation and keep the details. Do not disable protection or add an exclusion. The development-time command-line detection and response are documented in [security notes](docs/SECURITY.md).

Developers can run **node tests/run.cjs** with Node.js 24. On Windows with the supported official app installed, **node tests/run.cjs --installed** additionally generates native fixtures from that installation and executes the actual modified functions. Multilingual strings retained inside synthetic test data exercise Unicode handling; project documentation and user-facing messages are in English.

## Original project

These repairs were developed in [wjtianze/codex-desktop-repair](https://github.com/wjtianze/codex-desktop-repair). If this work helps you, please consider starring the original repository.
