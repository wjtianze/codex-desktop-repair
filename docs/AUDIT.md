# Audit scope and repair evidence

Reviewed on September 7, 2026, for Windows x64 Store package 26.901.6511.0 and application version 26.901.51231. The resource inventory covered 8,830 entries, including 7,398 scripts. Pattern matches and public reports were investigation leads.

## Confirmed repairs

The main and renderer processes parsed complete historical previews to produce short titles. The main process also calculated candidate titles that were never selected. CPU profiles identified that call chain as a major source of blocking. The repair prefers an existing name, bounds preview parsing, and caches results. Full message content remains available through the normal rendering path.

Other confirmed issues included accumulating performance samples, empty listener collections, an unenforced idle-history capacity target, full-file browser record reads, notification queuing, cleanup after optional-device initialization failure, repeated renderer-crash recovery, and invalid restored window dimensions. Tests exercise methods extracted from the target version and synthetic boundary cases.

The composer failure was reproduced in the running client: a private conversation already had local state, while its query retained a 404 and caused the input to unmount. A read-only query refetch restored it immediately. The repair preserves the composer during that transient condition, retries finitely, and retains the original submission and access checks. The user confirmed recovery. A similar brief disappearance on the website was reported by the user; its internal cause was not established.

## Additional review for 1.0.1

Targeted review covered main-process state persistence and logging, history and message conversion, image layout, citation cards, per-conversation model selection, drafts, and mention search. Whole-package inventory scanning is not described as a line-by-line audit of every third-party dependency. Unreproduced public reports are not counted as fixed.

- A single portrait image could reconstruct a width of 400.00000000000006. A strict comparison incorrectly selected square cropping. Single images now retain their natural aspect ratio, with tolerance for floating-point rounding. The user confirmed complete display.
- Internal page images returned by file search were classified as a generated gallery. Tool role and source now distinguish them from user uploads and generated images.
- Citation presentation follows provenance and presentation intent across file extensions. An early local preview introduced a temporal-dead-zone error in the reference renderer; it was rolled back and corrected. Regression tests execute the complete component, covering compact references, generated downloads, restricted states, and installation without sidebar filtering. The user confirmed that cards and Markdown rendering recovered.
- Model and reasoning-effort choices persist per conversation. A draft identifier migrates to the stable server identifier. A missing default uses a real available effort slot. Only selection fields are stored.
- Weak-key caches reuse unchanged history and metadata. Streaming state, branch selection, message mapping, moderation notices, and telemetry dependencies invalidate conversion results. Ordinary chats skip an unused Work summary. The user confirmed that generated content no longer disappears.
- Under sustained write backpressure, the native logger retained 3,001 consumed records with zero pending records. The repair releases consumed entries, bounds pending data to 8 MiB, and truncates oversized lines with a visible notice while retaining the beginning and end. This does not establish logging as the cause of every memory increase.
- The state store coalesces a burst of pending writes while still allowing a follow-up containing updates made during an active write. Ordinary flush awaits asynchronous writes. Strict flush preserves its failure contract. The native primary file, backup, atomic replacement, and read format remain intact.
- First installation previously selected a package-virtualized profile directory. The supported package explicitly disables file-system write virtualization. The installer now defaults to the actual Roaming\Codex profile, while upgrades preserve an existing absolute path. Account files are not migrated or deleted.
- Quick-chat shortcut registration and the round sidebar button shared an extra condition requiring Codex mode. Removing that mode condition enables the same action in ChatGPT mode while preserving capability and explicit-disable checks. The user confirmed both entry points.

## Public reports still open at review time

The GitHub API was used to recheck all nine reports below and their comments. All were open; no OWNER, MEMBER, or COLLABORATOR comment confirmed an official fix. Same-version user evidence and local workarounds do not constitute an official resolution.

| Report | Current-version assessment |
| --- | --- |
| [Draft autosave write amplification #43393](https://github.com/openai/codex/issues/43393) | The same-version whole-state and backup write path is present. Pending writes are coalesced, and two text-draft record types wait 750 ms instead of 250 ms before saving. Clearing remains immediate; existing page-exit flushing remains. Each actual save still rewrites the complete files. |
| [Mention search freezes #31065](https://github.com/openai/codex/issues/31065) | Current code matches the recent overlapping-search report. The repair adds a 200 ms debounce, empty-query protection, cancellation of obsolete work, and per-host serialization. Cancellation stops later pages. An RPC already in flight must still settle; server-side search itself is not claimed to be faster. |
| [Repeated Windows Node runtime copies #42484](https://github.com/openai/codex/issues/42484) | Protected WindowsApps paths trigger synchronous relocation and retries after rename failures. The repair package's complete ordinary-directory runtime avoids that trigger. This does not establish a fix for project updaters or every installation arrangement. |
| [Math missing from Markdown file preview #36728](https://github.com/openai/codex/issues/36728) | The separate CodeMirror/Lezer file-editor path lacks math nodes and widgets. This differs from the repaired conversation Markdown failure. The editor extension is not included in this release and remains unresolved. |
| [Duplicated sessions #43394](https://github.com/openai/codex/issues/43394) | The report concerns macOS and lacks conversation identifiers or a complete reproduction. Similar titles are not used to hide potentially distinct conversations. |
| [Quick Chat does not answer #38852](https://github.com/openai/codex/issues/38852) | The report involves subscription and connection lifecycle. This machine's logs show successful connections; transient composer query failure has a separate repair. The original conditions were not reproduced. |
| [Alt+P exits the app #42683](https://github.com/openai/codex/issues/42683) | A recent user analysis attributes the crash to loss of the Windows-key modifier during native registration and reports a workaround by changing or disabling Show pet. The current default is Super+Alt+P. The native crash stack was not independently reproduced; native binaries and shortcut settings were not changed. |
| [Startup reload loop #43388](https://github.com/openai/codex/issues/43388) | Renderer-crash recovery is bounded, but an initial loading loop need not be a renderer crash. The new report lacks a matching stack, so complete coverage is not claimed. |
| [System-wide Windows stutter #40531](https://github.com/openai/codex/issues/40531) | Reports describe persistent desktop-wide lag, with temporary recovery after restarting DWM. The client-side trigger remains unresolved. A 15-minute JavaScript heap trace does not exclude compositor or GPU problems. No DWM restart, MPO, scheduling, or driver change was performed or claimed as a fix. |

## Earlier 1.0.0 report review

| Source | Assessment |
| --- | --- |
| [Repeated large browser-record reads #38611](https://github.com/openai/codex/issues/38611) | The current whole-file assembly and retry path was replaced by bounded batch reads. |
| [Accumulating history metadata #25779](https://github.com/openai/codex/issues/25779) | The current architecture already has some cleanup. Separate empty-callback and idle-capacity defects were confirmed and repaired. |
| [Memory growth #37584](https://github.com/openai/codex/issues/37584), [related report #38048](https://github.com/openai/codex/issues/38048) | Used as investigation leads; memory growth is not attributed universally to one cause. |
| [Navigation lag #33524](https://github.com/openai/codex/issues/33524), [window observation #39120](https://github.com/openai/codex/issues/39120) | Versions and triggers differ and do not establish this machine's root cause. |
| [Oversized restored windows #42493](https://github.com/openai/codex/issues/42493) | The missing maximum-size constraint was repaired, including position correction. Every display-scaling configuration was not tested. |
| [Voice click-through #43226](https://github.com/openai/codex/issues/43226), [pet click offset #42661](https://github.com/openai/codex/issues/42661) | Not reproduced on this machine. |
| [Large remote message failure #41573](https://github.com/openai/codex/issues/41573) | No equivalent remote environment was available. Connection protections and timeouts were not changed. |
| [Unavailable composer #40872](https://github.com/openai/codex/issues/40872) | Not equivalent to the locally reproduced private-chat cached 404; one repair is not claimed to cover every composer failure. |
| [Older ARM64 native crash #33429](https://github.com/openai/codex/issues/33429) | Outside this x64 target; no cross-architecture workaround was applied. |

Service capacity, networking, drivers, and unreproduced native issues may still affect behavior. This repository contains the repairs confirmed in this review.

References: [official troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting) and [Electron ASAR integrity](https://www.electronjs.org/docs/latest/tutorial/asar-integrity).
