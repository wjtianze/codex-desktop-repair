# 1.1.7: Panel dragging and toggle responsiveness

- Apply the latest divider position once per frame. Chat and panel contents continue to reflow while dragging, without waiting for release.
- Opening and closing the left navigation, right panel or Codex bottom panel switches directly to the final layout, avoiding repeated transcript reflow during size animations.
- Preserve size bounds, keyboard resizing, double-click reset, zoom handling and full-width restoration.

Download and extract the ZIP, save unsent content, quit ChatGPT and run Install-Repair.cmd. Supported only on Windows x64 with Microsoft Store package 26.908.4834.0, app 26.908.40834. Installation preserves the existing profile. Use Uninstall-Restore.cmd to restore the previous installation. Verify the ZIP using SHA256SUMS-en.txt.

Checks cover frame updates, final coordinates, toggle layout and native protections. This does not establish that all long-conversation or long-running performance issues are resolved. Report remaining issues on GitHub with versions, reproduction steps and privacy-safe screenshots.
