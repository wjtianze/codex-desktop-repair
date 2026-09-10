# What's new in 1.0.11

Finding an earlier question takes less scrolling, and side chats can now try a different question or answer without losing the original conversation.

## Message navigation in more windows

Chat, floating Quick Chat, and Side chat now use Codex's native message navigation rail. It appears after four user messages: hover over a marker to preview the question and its answer, or click to return to that message.

Narrow windows reserve space for the rail. Each rail controls its own conversation, so browsing a side chat leaves the main chat's reading position alone. Previews use existing messages and do not request an additional model response.

## Edit and regenerate in Side chat

For a completed turn, edit its last user message or choose **Regenerate** below the answer. The action opens a new side-chat branch at the selected turn and sends the revised or original question there. The original conversation remains available for comparison.

Regeneration retains the original inputs and attachments. Actions stay unavailable while generating, in read-only views, or with unsupported history modes. Repeated clicks do not create duplicate submissions.

Side chats remain temporary and disappear when the app closes. Save anything you need to keep before quitting.

## Upgrade

Supports Windows x64, Microsoft Store package **OpenAI.Codex 26.901.6511.0**, app version **26.901.51231**.

Save drafts and any side-chat content you need, quit ChatGPT completely, extract the new package, and run **Install-Repair.cmd**. Existing installations can upgrade directly; the profile, ordinary chats, and recovery backups are preserved.

This release also includes the [reading-position improvements from 1.0.10](UPDATES_1_0_10.md).
