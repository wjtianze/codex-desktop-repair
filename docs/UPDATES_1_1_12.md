# 1.1.12: long conversations, false textbook galleries, and retry menus

Supports Windows x64, Store package **26.911.7940.0**, UI **26.911.61220**.

Download and extract the ZIP, save pending input, quit the client, then run **Install-Repair.cmd**. Installation preserves the existing profile, conversations and model preferences. Checksums are included. The previous public version, 1.1.9, can be upgraded directly.

- Treat `api_tool` / `context_stuff` textbook pages as internal retrieval context instead of generated images. Remove false empty galleries while retaining real generated images, user images, response text and file citations.
- That misclassification also selected the image-specific one-click retry action. Correct classification restores the normal response retry menu; the repair never retries or resends messages automatically.
- Bound offscreen turn buffers by viewport distance in the shared Chat/Codex list. Preserve native visible coverage, explicit retained turns, and search navigation.
- Skip offscreen Markdown rendering inside long turns while retaining measured heights. Wait for the parent scroll ref, and handle streaming additions, resizing, font loading and cleanup.
- Reuse Markdown conversion for unchanged messages. Keep the plus control visible during temporary submission blocking without weakening disabled, read-only or permission conditions.
- Reopening the repaired client uses native window activation instead of rejecting a matching background process.

Both editions pass 481 regression checks. Validation includes real-history replay, installed pages and the native retry-component path, without starting model turns. Mounted nodes approximately halved in one long conversation. Some first menu openings still take around a tenth of a second. Network requests, plugin loading and model generation are outside the rendering improvement guarantee; this release does not claim to eliminate all lag.
