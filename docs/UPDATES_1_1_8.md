# 1.1.8: Support for the 26.911 desktop app

Supports Windows x64, Microsoft Store package **OpenAI.Codex 26.911.7940.0**, app version **26.911.61220**. Other versions are rejected before patching. Save unsent work, quit the app, extract the ZIP and run **Install-Repair.cmd**. Existing profiles, sign-in information and conversations are preserved.

- Adapted the reorganized Chat, Side chat, panel, search, code-block and model-slider modules while preserving native permissions and current functionality.
- Fixed inherited `CODEX_CLI_PATH` selecting a stale backend. The repaired app launches its matching bundled backend and checks its SHA-256 during installation and startup. System environment variables and the standalone CLI are unchanged. This addresses the stale-backend portion of upstream [#46155](https://github.com/openai/codex/issues/46155).
- Retained Side chat editing and regeneration, reading-position restoration, thinking and search progress, interactive previews, draft persistence and panel layout fixes. The newer native distinction between empty and populated thinking sections is retained.

Validation covers 461 native and helper checks. The bundled backend is `0.155.0-alpha.2.6`; standalone CLI `0.154.0` was checked separately and is not replaced. Automated checks and isolated loading do not establish that every device, live conversation or long-running workload is covered.

Revoked sign-in sessions, server capacity errors and network or browser-policy initialization failures are outside the backend-selection fix. See the [upstream issue review](ISSUES_2026_09_17.md) for the investigation boundaries.
