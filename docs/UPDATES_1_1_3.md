# 1.1.3: updated App support, search conversations and Side chat fixes

Supports Microsoft Store package **26.908.4834.0**, App **26.908.40834**, standalone Codex CLI **0.154.0** and bundled backend **0.154.0-alpha.6.2**.

- Fixes crashes when opening conversations containing web-search activity, including while a reply is streaming.
- Fixes editing and regenerating later turns in a Side chat. Earlier exchanges are retained and the existing tab is updated in place.
- Restores per-conversation reading positions instead of always reopening at the bottom.
- Recovers a complete visualization file-reference JSON payload when only its closing marker is missing. Truncated payloads and following prose are not consumed; native file-access checks remain in effect.
- Slider particles follow the display refresh cadence while retaining hidden-window suspension and reduced-motion behavior.
- Updates Quick Chat, project settings, downloads and panel controls while preserving native permissions and active-voice protection.

Save drafts, exit the client and run **Install-Repair.cmd**. Existing login and conversation data are reused; the standalone CLI is not replaced. Use **Uninstall-Restore.cmd** to restore.

Both editions passed **439 checks**. Full and sidebar-free builds verified **9,030 / 9,029** packed resources. The Chinese edition was installed and passed actual page/module loading. Multi-turn Side chat was checked against the real client, with final model dispatch intercepted. See [compatibility and validation](VALIDATION.md).

Heavy background workloads may still affect responsiveness. This release does not claim to eliminate every intermittent stall on every device.
