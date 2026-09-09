# Known issues and repair scope

Updated September 9, 2026.

## Addressed in 1.0.9

| Problem | Improvement |
| --- | --- |
| Model slider feels sluggish in long conversations | Preview while dragging and save on release; labels update immediately. |
| Code block headers appear late and shift the page | Ordinary code blocks keep their header from the first render, including the dedicated ChatGPT code view. |
| Side panel tools disappear when switching modes | Browser, Files, and temporary Side chat are available across Chat, Work, new chats, and existing conversations. |
| [Routine requests block Stop and steering #43525](https://github.com/openai/codex/issues/43525) | Reserve capacity for control requests while preserving accounting for operations already sent. |
| [Draft edits rewrite the entire state file #43393](https://github.com/openai/codex/issues/43393) | Draft-only changes use a small separate file and backup. |
| Frequent history layout updates | Combine size notifications and avoid repeated identical layout updates. |
| [Mention search freezes #31065](https://github.com/openai/codex/issues/31065) | Wait for stable input and cancel obsolete queued searches. Already dispatched searches may still take time. |
| [Browser records are repeatedly read in full #38611](https://github.com/openai/codex/issues/38611) | Read in bounded batches and combine duplicate notifications. |

Other included image, message, composer, project settings, and preview fixes are listed in the [README](../README.md).

## Still not fully resolved

| Problem | Limit |
| --- | --- |
| [Windows becomes unresponsive #43726](https://github.com/openai/codex/issues/43726), [system-wide lag #40531](https://github.com/openai/codex/issues/40531) | Reduced local overhead does not guarantee that every system-wide freeze is fixed. |
| [Very large restored conversations freeze the system #41166](https://github.com/openai/codex/issues/41166) | Layout updates are improved; large-history loading and backend memory pressure remain separate concerns. |
| [Long-session state growth #25779](https://github.com/openai/codex/issues/25779) | Some caches and idle state are bounded, but there is no universal history-size limit and conversations are not automatically deleted. |
| [Control requests take many minutes #43525](https://github.com/openai/codex/issues/43525) | Reserved capacity prevents queue amplification; it does not explain or fix every initial backend stall. |
| [Markdown file previews omit math #36728](https://github.com/openai/codex/issues/36728) | The file editor uses a separate rendering path from chat messages. |
| [Quick Chat receives no reply #38852](https://github.com/openai/codex/issues/38852) | Composer recovery does not cover every connection or subscription problem. |
| [Shortcut crashes #42683](https://github.com/openai/codex/issues/42683), [startup refresh loops #43388](https://github.com/openai/codex/issues/43388) | No general fix has been confirmed. |
| [macOS main-thread stalls #43526](https://github.com/openai/codex/issues/43526) | This package supports only the specified Windows x64 build. |

## Reporting a problem

Include the app version, repair version, reproduction steps, and whether it happens in a new or long conversation. Redact private information from screenshots. Do not publicly upload account files, full conversations, or raw logs.

If an update introduces a problem, quit the app normally and run **Uninstall-Restore.cmd**. After an official app update, wait for a compatible repair instead of bypassing the version check.
