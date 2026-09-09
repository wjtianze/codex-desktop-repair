# 1.0.9 English edition

This update makes the side panel available across modes and fixes several interruptions when working with long conversations: a sluggish model slider, labels that update only after release, and code blocks that shift the page as they load.

## Use the side panel without switching modes

ChatGPT Chat, Work, new chats, and existing conversations now have access to Browser, Files, and Side chat.

- **Browser** opens a new browser tab.
- **Files** opens the workspace tree when a local workspace is available. Otherwise, choose a local file to view in the side panel.
- **Side chat** keeps the existing fork behavior for local conversations. Without a local conversation, it opens a separate temporary chat instead of requiring you to start a Codex task first.

Existing account and workspace permissions still apply. Side chats are temporary; save anything you want to keep.

## See the model as you drag

The model name and reasoning level update immediately while dragging. Your selection is saved when you release the slider, avoiding repeated conversation updates at every intermediate position. Dragging back restores the original selection.

## Read code without the header appearing late

Ordinary code blocks, including ChatGPT's dedicated code view, keep their header from the first render. Syntax highlighting still loads as needed, without inserting a new header above the code as you scroll.

## Less background work

Draft-only edits use a small separate file and backup instead of repeatedly rewriting the large global state file. Stop and steering requests have reserved capacity so routine requests cannot occupy every slot. Frequent layout notifications are combined, and hidden slider decorations stop drawing.

These changes do not resolve every backend stall or system-wide freeze. A backend that stops responding may still take time to handle Stop. See [known issues](AUDIT.md).

## Install or upgrade

Supported target: Windows x64, Microsoft Store package **OpenAI.Codex 26.901.6511.0**, app version **26.901.51231**.

1. Download the English ZIP and extract it.
2. Save unsent content and quit ChatGPT completely.
3. Run **Install-Repair.cmd**. Existing repair installations can be upgraded directly.
4. Open **ChatGPT** from the Start menu.

The installer keeps the existing profile and rollback backups. To restore the previous installation, quit the app and run **Uninstall-Restore.cmd**.

After an unexpected exit, keep the state directory's `.drafts-v1.json` file and its backup: they may contain the latest draft. Before returning to an older repair version, save unsent text and quit normally.
