# 1.1.16: Quick Chat modes, project side chats, and saved history

For Windows x64, Store package **26.911.7940.0**, app **26.911.61220**. Save unsent content and quit the app, extract the release ZIP, then run **Install-Repair.cmd**. Existing sign-in data, conversations, and model preferences are retained. Checksums are included with the release.

- Quick Chat and side chats offer Chat, cloud Work, and local Work. Mode and location controls sit next to the composer. Separate conversation identities prevent local working context from being silently attached to cloud messages.
- New local side chats use regular persisted conversations. Closing their tabs keeps history and does not stop ongoing work. Select a project to open a new side conversation there, or select **No project** for an independent conversation.
- Chat and cloud Work use the native ChatGPT project picker, messaging, and history flow. Account, project, model, and tool restrictions remain enforced by the native client.
- Empty new conversations no longer show a misleading missing-messages notice. Side content fills the available height, with the composer at the bottom.
- Updated native scope and module bindings fix the side-chat project entry crash.
- Quick Chat history now uses the native visible-range renderer. Streaming updates preserve unchanged rows, while measured ranges shrink oversized buffers and retain live, comparison, and interactive content.

- **Open existing conversation** searches local Work, Chat, and cloud Work history, with additional pages on demand. It resumes the original conversation instead of copying messages or starting a new model turn.

Previously created temporary side chats are not presented as saved conversations. The new persistence rule applies to newly created conversations and cannot restore vanished temporary history. Storage verification, UI loading, and real model replies are separate acceptance stages. Some first-open menus and long conversations can still pause briefly.

The package contains patches, helpers, tests, and documentation only. It includes no complete official application, user conversations, or account data. See the README for recovery and version restrictions.
