# 1.0.10 English edition

This update helps you keep your place in long conversations. Switching away and back should not mean finding the same paragraph again, and a long reply loading below should not send the view back to the top.

## Return to where you left off

Chats remember your reading position together with measured message heights. Restoration waits for the layout to be ready, so a temporary position during loading cannot overwrite the saved one. Content growing below your reading position is also taken into account.

## Load long replies without interrupting scrolling

The latest reply is measured earlier, reducing large surprises when you reach it. If you start scrolling while restoration is in progress, your input takes priority and automatic restoration stops.

Reading positions are stored locally in a bounded cache. It contains positions and heights, not message text. Images, web pages, and interactive content can still change height as they load.

## Upgrade

Supported target: **Windows x64**, Microsoft Store package **OpenAI.Codex 26.901.6511.0**, app version **26.901.51231**.

Save unsent content, quit ChatGPT completely, extract the English ZIP, and run **Install-Repair.cmd**. Existing repair installations can be upgraded directly. The installer preserves the profile and rollback backups.

The [side-panel, model-preview, and code-block improvements from 1.0.9](UPDATES_1_0_9.md) are included.
