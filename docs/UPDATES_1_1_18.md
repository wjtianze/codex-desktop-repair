# 1.1.18: Cloud Work image references

Download and extract the release ZIP, save unsent text, quit the desktop app, then run **Install-Repair.cmd**. Installation preserves the existing account, conversations and model preferences and keeps rollback backups. Use **Uninstall-Restore.cmd** to remove the repair. No separate Python or Node.js installation is required. Verify the download against the attached SHA256SUMS-en.txt.

Generated PNG, JPG and SVG references written as `![description](sandbox:/...)` could leave a lone `!` in the answer while the file appeared in an attachment card below. The repair recognizes the entire Markdown image node and expands server reference ranges that cover only its link or path.

Native attachment cards, downloads, access checks and ordinary punctuation remain intact. Markdown examples inside code blocks no longer become attachments. This change does not add inline image previews.

Only Windows x64, Store package **26.915.4065.0**, UI **26.915.31945** are supported. Other official versions are rejected.

232 standalone checks pass. Focused checks cover PNG/JPG/SVG, Unicode and spaced paths, empty descriptions, escaped parentheses, repeated references, normal links, code examples, incomplete streaming content, and both server and fallback reference paths. The Chinese edition was installed and checked against the reported cloud Work history: the stray exclamation mark disappeared and the PNG attachment card remained. The English edition shares the verified patches but was not installed into the daily profile. The other reported history pages were not individually opened; SVG/JPG behavior has targeted coverage. The complete native suite was not rerun for this patch.

After an official update, wait for a matching repair release. When reporting issues, include the official version, repair version and reproduction steps; do not upload account files or private conversations. See [compatibility and validation](https://github.com/wjtianze/codex-desktop-repair/blob/v1.1.18-en.1/docs/VALIDATION.md).
