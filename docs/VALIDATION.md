# Compatibility and validation

## Verified version combination

| Component | Version |
| --- | --- |
| Platform | Windows x64 |
| Microsoft Store package | OpenAI.Codex 26.911.7940.0 |
| ChatGPT App | 26.911.61220, Owl runtime |
| App-bundled Codex backend | 0.155.0-alpha.2.6 |
| Standalone Codex CLI | 0.154.0 |

The App and standalone CLI use separate executables. Installing this repair does not replace the standalone CLI or downgrade the App's bundled backend. The installer verifies the official signature, exact version and file hashes. Other App versions are rejected.

## Validation scope

Automated checks cover patch boundaries, full and sidebar-free builds, complete native-module syntax, drafts, request scheduling, chat reading position, model selection, messages, images, file citations, search progress, Side chat editing and navigation layout.

Installation and recovery checks also cover cross-version runtimes, the pinned taskbar shortcut, the existing profile path, backup integrity and resuming an interrupted rollback. The new official browser no longer contains the legacy rollout watcher, so those patches are retired; unchanged official browser files are still hash-verified.

The exact App and standalone CLI executables were checked separately for initialization, account reading, model listing and policy requirements. Semantics follow the [OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server); version-specific behavior is verified against each executable. These compatibility checks did not start real model turns.

Isolated module/page loading and installation acceptance using the existing profile are recorded separately. Automated checks cannot replace every real conversation, device or long-running session. See [known issues](AUDIT.md) for remaining limitations.

## Local checks

Run **Check-Environment.cmd** for a compatibility check. Maintainers use Node.js 24:

~~~powershell
node tests/run.cjs
node tests/run.cjs --installed
~~~

The second command requires the supported Windows App, regenerates native fixtures and runs the modified native functions and browser-layout tests. Results and generated resources stay under ignored build/ directories. Account files, conversations and complete official resources are not published.

## 1.1.8 release verification

Both editions passed 461 native and helper checks. Full and sidebar-free builds verify 14,926 and 14,925 packed resources. Installer and launcher checks pin the matching bundled backend instead of inheriting a stale CODEX_CLI_PATH.

The Chinese edition was transactionally installed with its existing profile. The running page and all patched modules loaded without an error boundary or sign-in gate. The English edition is built and tested independently; it does not overwrite the local Chinese installation.

The bundled App Server and standalone CLI separately passed initialization, account reading, model listing and configuration-requirement reads. No model turns were started. Native conversation, Side chat, search, code-block and interactive-preview regressions are distinct from every possible live or long-running scenario.
