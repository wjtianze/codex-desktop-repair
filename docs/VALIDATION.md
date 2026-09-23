# Compatibility and validation

## 1.1.18 verification scope

232 standalone checks pass in each edition. Fourteen synthetic inputs were checked against the running client's actual Markdown parser. Native full and no-sidebar variants cover complete image syntax in both fallback extraction and server reference ranges. Existing image-message and file-reference component checks and module syntax checks also pass. The complete --installed suite was not rerun.

The Chinese edition was transactionally installed on 2026-09-23 with matching archive hashes and the same profile directory. The reported cloud Work history opened without an error boundary: the orphan exclamation mark was absent, its PNG attachment card remained, and the composer loaded. No message was sent or regenerated. The other reported history pages were not individually opened; SVG/JPG behavior has targeted coverage. The English edition was separately built and tested, but not installed into the daily profile.

## 1.1.17 verification scope

The final source adds two focused checks for Chat/cloud route scope and search-source initialization. Both editions pass 218 standalone checks. Earlier adaptation passed a complete 512-case regression run, followed by six targeted native side-tab checks. An additional full rerun was stopped to avoid worsening memory paging and is not counted as passing.

The isolated client loaded its real home screen and patched modules. Local, Chat, and cloud Work history opened by the original IDs, with history search and a no-project option, without sending model turns. Existing-tab reuse has additional targeted coverage. On 2026-09-23 the Chinese 1.1.17 build was transactionally installed in the daily profile, with matching runtime hashes and an unchanged profile path. Its real side-chat composer, mode controls, and no-project option mounted. The gap between the controls and the current contenteditable node measured 50 CSS pixels, within the under-60-pixel check. First launch after installation displayed correctly; the check sent no messages and returned to the home screen. The earlier isolated blank cold start remains a limitation for other startup scenarios. The English build shares these patches but was not installed into the daily profile.

The initial home/empty-thread checks did not cover full Chat and cloud Work rendering. Subsequent live failures identified a null queryClient scope and an obsolete search-source initializer. Both bindings were corrected and reinstalled on 2026-09-23; the user then confirmed ordinary Chat, web-search Chat, and cloud Work work again. This confirmation is separate from automated checks and does not establish all-day performance or search freshness.

A system-wide lag investigation found searches continuing after their orchestration code discarded command-session metadata. The user confirmed substantial improvement after the searches stopped and other ended tasks released memory. This supports resource contention; it does not establish or fix every desktop memory leak. Source releases exclude local diagnostics, private chats, and machine-specific global task rules.


## 1.1.16 validation

Both editions pass 511 checks. New coverage includes native saved-thread creation, enabled no-project selection, project and host boundaries, close-without-discard behavior, mode isolation, and composer geometry. A real empty project conversation was reported as non-ephemeral by the backend, had an existing history file, and remained readable after its side tab closed. The native composer and both cloud modes were loaded without sending a model turn. This does not claim end-to-end model response acceptance.


## 1.1.12 validation

Both editions pass 481 checks, including native virtual-list coverage, real React ref timing, offscreen block geometry and cleanup, and `api_tool/context_stuff` classification.

A real-history replay removed 49 false generated-image items while preserving assistant text exactly. The installed page displays the answer and citations and mounts the normal retry-menu component, with no image-retry component or error notice. No model turn was started during validation.

One long Chat page changed from about 18,100 nodes and three mounted turns to about 9,073 nodes and one mounted turn. Separate measurements after settling gave about 76–86 ms for opening the plus menu and about 125 ms for the first model-menu opening. These measurements apply to one device and page state, not all conversations. Cache state, concurrent checks and diagnostic full-text reads affect results; measurements under different conditions are not presented as an overall speedup ratio.

The upstream review included [#46249](https://github.com/openai/codex/issues/46249) and the Windows long-thread layout report [#41166](https://github.com/openai/codex/issues/41166). Local changes follow local reproduction and profiling; they do not establish that every upstream performance issue is resolved.

## Verified version combination

| Component | Version |
| --- | --- |
| Platform | Windows x64 |
| Microsoft Store package | OpenAI.Codex 26.915.4065.0 |
| ChatGPT App | 26.915.31945, Owl runtime |
| App-bundled Codex backend | 0.155.0-alpha.9.2 |
| Standalone Codex CLI | 0.155.1 |

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

## 1.1.9 hotfix verification

Both editions passed 469 checks. New regressions use the official React/JSX runtime and invoke navigation, scroll and local-conversation action entry points, covering bindings missed in 1.1.8.

The isolated app opened actual local Codex and Chat history pages with existing messages and composers, without an error boundary or runtime exception. No messages were sent or replayed. Chinese 1.1.9 was installed with the existing profile and passed actual page/module loading.

Taskbar verification covers shortcut and native window properties, including the Owl fallback. Full and sidebar-free builds verify 14,928 and 14,927 resources. Home-page loading and successful imports alone do not establish conversation-path correctness.

## 1.1.8 release verification

Both editions passed 461 native and helper checks. Full and sidebar-free builds verify 14,926 and 14,925 packed resources. Installer and launcher checks pin the matching bundled backend instead of inheriting a stale CODEX_CLI_PATH.

The Chinese edition was transactionally installed with its existing profile. The running page and all patched modules loaded without an error boundary or sign-in gate. The English edition is built and tested independently; it does not overwrite the local Chinese installation.

The bundled App Server and standalone CLI separately passed initialization, account reading, model listing and configuration-requirement reads. No model turns were started. Native conversation, Side chat, search, code-block and interactive-preview regressions are distinct from every possible live or long-running scenario.
