# Compatibility and validation

## Verified version combination

| Component | Version |
| --- | --- |
| Platform | Windows x64 |
| Microsoft Store package | OpenAI.Codex 26.903.9818.0 |
| ChatGPT App | 26.903.71938, Owl runtime |
| App-bundled Codex backend | 0.153.4 |
| Standalone Codex CLI | 0.154.0 |

The App and standalone CLI use separate executables. Installing this repair does not replace the standalone CLI or downgrade the App's bundled backend. The installer verifies the official signature, exact version and file hashes. Other App versions are rejected.

## Validation scope

Automated checks cover patch boundaries, full and sidebar-free builds, complete native-module syntax, drafts, request scheduling, chat reading position, model selection, messages, images, file citations, search progress, Side chat editing and navigation layout.

Installation and recovery checks also cover cross-version runtimes, the pinned taskbar shortcut, the existing profile path, backup integrity and resuming an interrupted rollback. The new official browser no longer contains the legacy rollout watcher, so those patches are retired; unchanged official browser files are still hash-verified.

Protocol schemas are generated separately from both actual executables. Live compatibility checks cover initialization, account reading, model listing and policy requirements. Semantics follow the [OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server); version-specific interfaces are checked against the generated schemas. These compatibility checks did not start real model turns.

Isolated module/page loading and installation acceptance using the existing profile are recorded separately. Automated checks cannot replace every real conversation, device or long-running session. See [known issues](AUDIT.md) for remaining limitations.

## Local checks

Run **Check-Environment.cmd** for a compatibility check. Maintainers use Node.js 24:

~~~powershell
node tests/run.cjs
node tests/run.cjs --installed
~~~

The second command requires the supported Windows App, regenerates native fixtures and runs the modified native functions and browser-layout tests. Results and generated resources stay under ignored build/ directories. Account files, conversations and complete official resources are not published.

## Release verification

Both editions passed 432 checks against the installed official source. Full and sidebar-free builds each verified 8,853 packed resources. The Chinese 1.1.2 build was installed using the existing profile and passed a real page/module-loading check without a login gate or error boundary. The English edition was independently built and tested; it was not installed over the user's Chinese edition.

Real-client integration checks also exercised editing and regeneration consecutively in the same tab, preserving its identifier and title. Project selection applied the maintenance working directory without changing the main route. Only new temporary test threads were used; the final native model dispatch was intercepted.
