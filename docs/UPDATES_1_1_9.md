# 1.1.9: Conversation loading and taskbar identity fixes

Supports Windows x64, Store package **26.911.7940.0**, app version **26.911.61220**.

- Fixes 1.1.8 error pages after sending a message or opening an existing conversation. Navigation uses explicit React/JSX imports; local conversation and scroll callbacks use the correct native interfaces.
- Gives desktop windows and shortcuts a shared taskbar identity, restoring pinning and preventing PowerShell task menus. Web-app shortcuts remain separate.
- Uses owner-checked Windows window properties where Owl does not provide the older Electron taskbar API. The helper runs without a console window.

Download and extract the English ZIP, save unsent work, quit the app and run **Install-Repair.cmd**. Existing profiles and the transactional rollback mechanism are preserved.

Validation covers real Chat and local Codex history pages, actual React/JSX navigation entry points, scroll callbacks, taskbar properties and existing regressions. The fix does not replay messages; history-page checks do not start model turns. Checksums are attached to the release.
