# Upstream evidence guide

This English edition packages reproducible findings and regression cases for Windows Store build 26.901.6511.0, application version 26.901.51231. It is intended to help the desktop maintainers port validated changes into their maintained source.

The public openai/codex repository does not contain the packaged Electron interface modules targeted here. Its [contribution policy](https://github.com/openai/codex/blob/main/docs/contributing.md) directs external contributions to issue reports and root-cause analysis rather than external code or pull requests. Upstream submissions therefore provide focused reports, reproduction cases, and links to these implementation materials.

## Evidence available without account data

| Finding | Implementation and regression entry points |
| --- | --- |
| Consumed logger records remain retained under backpressure | patches/logger, assets/bounded-desktop-log.cjs, tests/render-desktop-logger.cjs |
| Repeated state writes and synchronous ordinary flush | patches/state-store, tests/render-state-store.cjs |
| Obsolete mention searches overlap and continue paging | assets/local-mention-search-v1.mjs, tests/render-mention-search.mjs |
| Internal retrieval images become a generated gallery | assets/local-conversation-render-fixes-v1.mjs, tests/render-first-fixes.mjs |
| Portrait image layout enters square crop because of rounding | tests/render-gallery-layout.mjs |
| Citation presentation ignores file provenance and intent | tests/render-citation-component.mjs |
| Model selection and slider state disagree or reset | assets/local-conversation-model-preferences-v1.mjs, tests/render-model-fixes.mjs |
| Unchanged histories are converted repeatedly | assets/local-conversation-performance-v1.mjs, tests/render-performance-fixes.mjs |
| Quick chat is gated on Codex sidebar mode | tests/quickchat-modes.cjs |
| File-only project edits do not enable Save | assets/local-project-settings-v1.mjs, tests/project-sources.mjs, tests/project-settings.mjs |
| Thought summaries become commentary and stale plan snapshots remain visible | tests/work-activity.mjs |
| Chat summary remains collapsed after its first content arrives | tests/chat-live-thinking.mjs |
| Quick Chat omits native edit and regenerate handlers | assets/local-quick-chat-actions-v1.mjs, tests/quick-actions.mjs, tests/quick-native.mjs |
| Earlier title, listener, idle-cache, browser, and window issues | tests/core.cjs, tests/tracker.cjs, tests/cold.cjs, tests/title.cjs, tests/host-title.cjs |

Run **node tests/run.cjs** for the 76 portable checks. With the exact official Windows app installed, run **node tests/run.cjs --installed** for all 242 cases. The fixture generator extracts the original functions locally, applies the checked patch manifest, and runs behavioral comparisons. It does not publish full client bundles or require credentials, prompts, or real conversation identifiers.

The manifest records the exact official input hashes and each replacement's input/output digests. Native function names refer only to this distributed build and are not proposed stable upstream API names.

## Interpretation

A local packaged-app repair is not an upstream source merge or an official fix. Changes that affect UI presentation were accepted in the base repair by the user. Each issue report should distinguish original-client defects from any regression encountered while developing the local package.

The state-save changes mitigate write amplification while preserving the native whole-state primary and backup format. Mention cancellation cannot interrupt an RPC already running in the current host interface. A bounded 15-minute renderer observation does not establish that multi-hour desktop compositor problems are solved.

## Attribution

Original implementation and Chinese documentation: [wjtianze/codex-desktop-repair](https://github.com/wjtianze/codex-desktop-repair).

If these findings or repairs are useful, a star on the original repository is appreciated.
