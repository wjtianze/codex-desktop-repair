# Compatibility and testing

## Supported version

- Windows x64.
- Microsoft Store package **OpenAI.Codex 26.901.6511.0**.
- App version **26.901.51231**.

Other versions and architectures are rejected before installation. The installer checks the official signature, source hashes, and generated resources. The original Store installation remains intact; the repair uses a separate runtime copy.

## Test coverage

The English 1.0.14 edition passes 417 automated checks covering patch application, installation and restore, draft persistence, request scheduling, reading-position restoration, rendering, model previews, and side-panel actions. Code block checks cover both generic and dedicated ChatGPT components. Browser checks also cover narrow and wide layouts, native marker expansion, the visible gap beside the text, scaled windows, independent scrolling, and cleanup. Side-chat checks cover branch ownership, history projection, input preservation, and duplicate submission protection.

Automated tests use synthetic data and cannot cover every conversation, device, or long-running session. See [known issues](AUDIT.md) for remaining limits.

## Run a local check

Double-click **Check-Environment.cmd** to check whether the installed official app is supported.

Contributors can run the portable checks with Node.js 24:

```powershell
node tests/run.cjs
```

With the supported official Windows app installed, also run:

```powershell
node tests/run.cjs --installed
node tests/code-header-layout.cjs
```

Generated native resources and results stay in the local `build/` directory and are not included in release downloads.
